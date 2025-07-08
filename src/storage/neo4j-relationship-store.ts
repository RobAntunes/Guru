import neo4j, { Driver, Session, Node, Relationship } from 'neo4j-driver';
import { HarmonicPatternMemory, PatternCategory, CodeLocation } from '../memory/types.js';
import { config } from 'dotenv';

config();

export interface SymbolNode {
  id: string;
  name: string;
  type: 'function' | 'class' | 'variable' | 'module' | 'import';
  file: string;
  startLine: number;
  endLine: number;
  complexity?: number;
  properties: Record<string, any>;
}

export interface SymbolRelationship {
  from: string;
  to: string;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'contains' | 'references' | 'pattern_similarity';
  properties: Record<string, any>;
  weight?: number;
}

export interface PatternConnection {
  pattern1: string;
  pattern2: string;
  similarity: number;
  sharedFeatures: string[];
  distance: number;
}

export class Neo4jRelationshipStore {
  private _driver: Driver;
  private connected: boolean = false;

  constructor(
    uri?: string,
    username?: string,
    password?: string
  ) {
    const neo4jUri = uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    const neo4jUsername = username || process.env.NEO4J_USERNAME || 'neo4j';
    const neo4jPassword = password || process.env.NEO4J_PASSWORD || 'password';

    this._driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUsername, neo4jPassword));
  }

  get driver(): Driver {
    return this._driver;
  }

  async connect(): Promise<void> {
    try {
      await this._driver.verifyConnectivity();
      await this.initializeSchema();
      this.connected = true;
      console.log('✅ Neo4j connected and schema initialized');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this._driver) {
      await this._driver.close();
      this.connected = false;
    }
  }

  async close(): Promise<void> {
    await this.disconnect();
  }

  private async initializeSchema(): Promise<void> {
    const session = this._driver.session();
    try {
      // Create constraints and indexes for symbols
      await session.run(`
        CREATE CONSTRAINT symbol_id_unique IF NOT EXISTS
        FOR (s:Symbol) REQUIRE s.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS
        FOR (p:Pattern) REQUIRE p.id IS UNIQUE
      `);

      // Create indexes for performance
      await session.run(`
        CREATE INDEX symbol_name_idx IF NOT EXISTS
        FOR (s:Symbol) ON (s.name)
      `);

      await session.run(`
        CREATE INDEX symbol_file_idx IF NOT EXISTS
        FOR (s:Symbol) ON (s.file)
      `);

      await session.run(`
        CREATE INDEX pattern_category_idx IF NOT EXISTS
        FOR (p:Pattern) ON (p.category)
      `);

      await session.run(`
        CREATE INDEX pattern_strength_idx IF NOT EXISTS
        FOR (p:Pattern) ON (p.strength)
      `);

      console.log('📊 Neo4j schema constraints and indexes created');
    } finally {
      await session.close();
    }
  }

  // Symbol operations
  async createSymbol(symbol: SymbolNode): Promise<void> {
    const session = this._driver.session();
    try {
      // Flatten the properties for Neo4j storage
      const params = {
        id: symbol.id,
        name: symbol.name,
        type: symbol.type,
        file: symbol.file,
        startLine: symbol.startLine,
        endLine: symbol.endLine,
        complexity: symbol.complexity,
        propertiesJson: JSON.stringify(symbol.properties)
      };
      
      await session.run(`
        MERGE (s:Symbol {id: $id})
        SET s.name = $name,
            s.type = $type,
            s.file = $file,
            s.startLine = $startLine,
            s.endLine = $endLine,
            s.complexity = $complexity,
            s.properties = $propertiesJson,
            s.updatedAt = datetime()
      `, params);
    } finally {
      await session.close();
    }
  }

  async createSymbolRelationship(relationship: SymbolRelationship): Promise<void> {
    const session = this._driver.session();
    try {
      await session.run(`
        MATCH (from:Symbol {id: $from})
        MATCH (to:Symbol {id: $to})
        MERGE (from)-[r:\`${relationship.type.toUpperCase()}\`]->(to)
        SET r.properties = $properties,
            r.weight = $weight,
            r.createdAt = datetime()
      `, {
        from: relationship.from,
        to: relationship.to,
        properties: relationship.properties,
        weight: relationship.weight || 1.0
      });
    } finally {
      await session.close();
    }
  }

  async getSymbolsByFile(file: string): Promise<SymbolNode[]> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol {file: $file})
        RETURN s
        ORDER BY s.startLine
      `, { file });

      return result.records.map(record => {
        const node = record.get('s');
        return {
          id: node.properties.id,
          name: node.properties.name,
          type: node.properties.type,
          file: node.properties.file,
          startLine: node.properties.startLine.toNumber(),
          endLine: node.properties.endLine.toNumber(),
          complexity: node.properties.complexity?.toNumber(),
          properties: node.properties.properties || {}
        };
      });
    } finally {
      await session.close();
    }
  }

  async getSymbolCallGraph(symbolId: string, depth: number = 2): Promise<any> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH path = (start:Symbol {id: $symbolId})-[:CALLS*1..${depth}]->(target:Symbol)
        RETURN path
        LIMIT 1000
      `, { symbolId });

      return result.records.map(record => record.get('path'));
    } finally {
      await session.close();
    }
  }

  // Pattern operations
  async createPattern(pattern: HarmonicPatternMemory): Promise<void> {
    const session = this._driver.session();
    try {
      // Create pattern node
      await session.run(`
        MERGE (p:Pattern {id: $id})
        SET p.category = $category,
            p.strength = $strength,
            p.occurrences = $occurrences,
            p.confidence = $confidence,
            p.complexity = $complexity,
            p.dpcmCoordinates = $coordinates,
            p.evidence = $evidence,
            p.updatedAt = datetime()
      `, {
        id: pattern.id,
        category: pattern.harmonicProperties.category || 'GENERAL',
        strength: pattern.harmonicProperties.strength,
        occurrences: pattern.harmonicProperties.occurrences,
        confidence: pattern.harmonicProperties.confidence,
        complexity: pattern.harmonicProperties.complexity,
        coordinates: pattern.coordinates,
        evidence: JSON.stringify(pattern.evidence)
      });

      // Connect pattern to symbols
      for (const location of pattern.locations) {
        // Handle both formats: { line: number } and { startLine, endLine }
        const startLine = (location as any).line || location.startLine || 0;
        const endLine = (location as any).line || location.endLine || startLine;
        
        await session.run(`
          MATCH (p:Pattern {id: $patternId})
          MATCH (s:Symbol {file: $file})
          WHERE s.startLine <= $startLine AND s.endLine >= $endLine
          MERGE (p)-[:FOUND_IN]->(s)
        `, {
          patternId: pattern.id,
          file: location.file,
          startLine,
          endLine
        });
      }
    } finally {
      await session.close();
    }
  }

  async createPatternSimilarity(connection: PatternConnection): Promise<void> {
    const session = this._driver.session();
    try {
      await session.run(`
        MATCH (p1:Pattern {id: $pattern1})
        MATCH (p2:Pattern {id: $pattern2})
        MERGE (p1)-[r:SIMILAR_TO]-(p2)
        SET r.similarity = $similarity,
            r.distance = $distance,
            r.sharedFeatures = $sharedFeatures,
            r.createdAt = datetime()
      `, connection);
    } finally {
      await session.close();
    }
  }

  async findSimilarPatterns(patternId: string, minSimilarity: number = 0.7): Promise<any[]> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (p1:Pattern {id: $patternId})-[r:SIMILAR_TO]-(p2:Pattern)
        WHERE r.similarity >= $minSimilarity
        RETURN p2, r.similarity as similarity
        ORDER BY r.similarity DESC
        LIMIT 20
      `, { patternId, minSimilarity });

      return result.records.map(record => ({
        pattern: record.get('p2').properties,
        similarity: record.get('similarity')
      }));
    } finally {
      await session.close();
    }
  }

  async getPatternsByCategory(category: PatternCategory): Promise<any[]> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (p:Pattern {category: $category})
        RETURN p
        ORDER BY p.strength DESC
        LIMIT 100
      `, { category });

      return result.records.map(record => record.get('p').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Get a specific pattern by ID
   */
  async getPattern(patternId: string): Promise<HarmonicPatternMemory | null> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (p:Pattern {id: $patternId})
        RETURN p
      `, { patternId });

      if (result.records.length === 0) {
        return null;
      }

      const props = result.records[0].get('p').properties;
      
      // Reconstruct HarmonicPatternMemory object
      return {
        id: props.id,
        content: JSON.parse(props.evidence || '{}'), // Stored as JSON
        harmonicProperties: {
          category: props.category as PatternCategory,
          strength: props.strength,
          confidence: props.confidence,
          complexity: props.complexity,
          occurrences: props.occurrences
        },
        coordinates: props.dpcmCoordinates || [0, 0, 0],
        createdAt: props.createdAt?.toNumber() || Date.now(),
        lastAccessed: props.updatedAt?.toNumber() || Date.now(),
        accessCount: props.accessCount || 0,
        relevanceScore: props.strength,
        locations: [],
        evidence: JSON.parse(props.evidence || '[]'),
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      };
    } finally {
      await session.close();
    }
  }

  async getSymbolPatternAnalysis(symbolId: string): Promise<any> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol {id: $symbolId})<-[:FOUND_IN]-(p:Pattern)
        RETURN p.category as category, count(p) as patternCount, avg(p.strength) as avgStrength
        ORDER BY patternCount DESC
      `, { symbolId });

      return result.records.map(record => ({
        category: record.get('category'),
        patternCount: record.get('patternCount').toNumber(),
        avgStrength: record.get('avgStrength')
      }));
    } finally {
      await session.close();
    }
  }

  // Utility methods for symbol graph analysis
  async getComplexityHotspots(limit: number = 10): Promise<SymbolNode[]> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)
        WHERE s.complexity IS NOT NULL
        RETURN s
        ORDER BY s.complexity DESC
        LIMIT $limit
      `, { limit });

      return result.records.map(record => {
        const node = record.get('s');
        return {
          id: node.properties.id,
          name: node.properties.name,
          type: node.properties.type,
          file: node.properties.file,
          startLine: node.properties.startLine.toNumber(),
          endLine: node.properties.endLine.toNumber(),
          complexity: node.properties.complexity.toNumber(),
          properties: node.properties.properties || {}
        };
      });
    } finally {
      await session.close();
    }
  }

  async getCentralSymbols(limit: number = 10): Promise<any[]> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)
        OPTIONAL MATCH (s)-[out]->()
        OPTIONAL MATCH ()-[in]->(s)
        WITH s, count(out) as outDegree, count(in) as inDegree
        RETURN s, outDegree + inDegree as totalDegree
        ORDER BY totalDegree DESC
        LIMIT $limit
      `, { limit });

      return result.records.map(record => ({
        symbol: record.get('s').properties,
        degree: record.get('totalDegree').toNumber()
      }));
    } finally {
      await session.close();
    }
  }

  async getFileModularityScore(file: string): Promise<number> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (internal:Symbol {file: $file})-[r]->(external:Symbol)
        WHERE external.file <> $file
        WITH count(r) as externalConnections
        MATCH (internal:Symbol {file: $file})-[r2]->(internal2:Symbol {file: $file})
        WITH externalConnections, count(r2) as internalConnections
        RETURN CASE 
          WHEN externalConnections + internalConnections = 0 THEN 1.0
          ELSE toFloat(internalConnections) / (externalConnections + internalConnections)
        END as modularity
      `, { file });

      return result.records[0]?.get('modularity') || 0;
    } finally {
      await session.close();
    }
  }

  // Check if a pattern exists for a symbol
  async patternExists(symbolId: string, patternType: string): Promise<boolean> {
    const session = this._driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol {id: $symbolId})-[:EXHIBITS]->(p:Pattern {type: $patternType})
        RETURN count(p) > 0 as exists
      `, { symbolId, patternType });
      
      return result.records[0]?.get('exists') || false;
    } finally {
      await session.close();
    }
  }

  // Link patterns to symbols
  async linkPatternToSymbol(symbolId: string, patterns: any[]): Promise<void> {
    // Check if driver is connected
    if (!this._driver || !this.connected) {
      console.warn('Neo4j not connected, skipping pattern linking');
      return;
    }
    
    const session = this._driver.session();
    const tx = session.beginTransaction();
    
    try {
      // First ensure the Symbol exists
      await tx.run(`
        MERGE (s:Symbol {id: $symbolId})
        ON CREATE SET s.name = $symbolId,
                      s.type = 'unknown',
                      s.file = 'unknown',
                      s.startLine = 0,
                      s.endLine = 0,
                      s.createdAt = datetime()
      `, { symbolId });
      
      for (const pattern of patterns) {
        await tx.run(`
          MERGE (p:Pattern {id: $patternId})
          SET p.type = $patternType,
              p.category = $category,
              p.strength = $score,
              p.confidence = $confidence,
              p.location = $location,
              p.updatedAt = datetime()
          WITH p
          MATCH (s:Symbol {id: $symbolId})
          MERGE (s)-[:EXHIBITS]->(p)
        `, {
          patternId: `${symbolId}_${pattern.pattern}`,
          patternType: pattern.pattern,
          category: pattern.category,
          score: pattern.score,
          confidence: pattern.confidence,
          location: JSON.stringify(pattern.location),
          symbolId
        });
      }
      
      await tx.commit();
    } catch (error) {
      try {
        await tx.rollback();
      } catch (rollbackError) {
        // Ignore rollback errors
      }
      throw error;
    } finally {
      await session.close();
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; nodeCount: number; relationshipCount: number }> {
    const session = this._driver.session();
    try {
      const nodeResult = await session.run('MATCH (n) RETURN count(n) as nodeCount');
      const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as relCount');
      
      return {
        status: 'healthy',
        nodeCount: nodeResult.records[0].get('nodeCount').toNumber(),
        relationshipCount: relResult.records[0].get('relCount').toNumber()
      };
    } finally {
      await session.close();
    }
  }
}