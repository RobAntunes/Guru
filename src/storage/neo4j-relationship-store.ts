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
  private driver: Driver;
  private connected: boolean = false;

  constructor() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async connect(): Promise<void> {
    try {
      await this.driver.verifyConnectivity();
      await this.initializeSchema();
      this.connected = true;
      console.log('✅ Neo4j connected and schema initialized');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
    }
  }

  private async initializeSchema(): Promise<void> {
    const session = this.driver.session();
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
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (s:Symbol {id: $id})
        SET s.name = $name,
            s.type = $type,
            s.file = $file,
            s.startLine = $startLine,
            s.endLine = $endLine,
            s.complexity = $complexity,
            s.properties = $properties,
            s.updatedAt = datetime()
      `, symbol);
    } finally {
      await session.close();
    }
  }

  async createSymbolRelationship(relationship: SymbolRelationship): Promise<void> {
    const session = this.driver.session();
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
    const session = this.driver.session();
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
    const session = this.driver.session();
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
    const session = this.driver.session();
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
        category: pattern.harmonicProperties.category,
        strength: pattern.harmonicProperties.strength,
        occurrences: pattern.harmonicProperties.occurrences,
        confidence: pattern.harmonicProperties.confidence,
        complexity: pattern.harmonicProperties.complexity,
        coordinates: pattern.dpcmCoordinates,
        evidence: JSON.stringify(pattern.evidence)
      });

      // Connect pattern to symbols
      for (const location of pattern.locations) {
        await session.run(`
          MATCH (p:Pattern {id: $patternId})
          MATCH (s:Symbol {file: $file})
          WHERE s.startLine <= $startLine AND s.endLine >= $endLine
          MERGE (p)-[:FOUND_IN]->(s)
        `, {
          patternId: pattern.id,
          file: location.file,
          startLine: location.startLine,
          endLine: location.endLine
        });
      }
    } finally {
      await session.close();
    }
  }

  async createPatternSimilarity(connection: PatternConnection): Promise<void> {
    const session = this.driver.session();
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
    const session = this.driver.session();
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
    const session = this.driver.session();
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

  async getSymbolPatternAnalysis(symbolId: string): Promise<any> {
    const session = this.driver.session();
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
    const session = this.driver.session();
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
    const session = this.driver.session();
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
    const session = this.driver.session();
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

  // Health check
  async healthCheck(): Promise<{ status: string; nodeCount: number; relationshipCount: number }> {
    const session = this.driver.session();
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