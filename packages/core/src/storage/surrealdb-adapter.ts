/**
 * SurrealDB Adapter for Guru
 * Provides embedded multi-model database functionality
 * Replaces Neo4j (graph), Redis (cache), and SQLite (local storage)
 */

import { Surreal, type RecordId } from 'surrealdb';
import { surrealdbNodeEngines } from '@surrealdb/node';
import { 
  SymbolNode, 
  SymbolRelationship,
  HarmonicPatternMemory,
  PatternCategory 
} from '../memory/types.js';
import { config } from 'dotenv';

config();

export interface SurrealDBConfig {
  persistent?: boolean;
  namespace?: string;
  database?: string;
  dataPath?: string;
}

export interface CachedItem<T = any> {
  id?: RecordId;
  key: string;
  value: T;
  ttl: Date;
  created_at: Date;
}

export interface StoredPattern {
  id?: RecordId;
  pattern_id: string;
  category: string;
  strength: number;
  confidence: number;
  complexity: number;
  harmonic_properties: any;
  locations: any[];
  evidence: any[];
  created_at: Date;
  updated_at: Date;
}

export interface StoredSymbol {
  id?: RecordId;
  symbol_id: string;
  name: string;
  type: string;
  file_path: string;
  location: {
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  scope: string;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export class SurrealDBAdapter {
  private db: Surreal;
  private config: SurrealDBConfig;
  private connected: boolean = false;

  constructor(config?: SurrealDBConfig) {
    this.config = {
      persistent: config?.persistent ?? true,
      namespace: config?.namespace ?? 'guru',
      database: config?.database ?? 'main',
      dataPath: config?.dataPath ?? '.guru/surrealdb'
    };
    this.db = new Surreal();
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to SurrealDB...');
      
      // Configure with Node.js engines for embedded mode
      this.db = new Surreal({
        engines: surrealdbNodeEngines(),
      });

      // Use persistent storage or in-memory
      const url = this.config.persistent 
        ? `surrealkv://${this.config.dataPath}` 
        : 'mem://';
      
      await this.db.connect(url);
      
      // Use namespace and database
      await this.db.use({
        namespace: this.config.namespace!,
        database: this.config.database!
      });

      // Initialize schema
      await this.initializeSchema();
      
      this.connected = true;
      console.log('✅ SurrealDB connected and schema initialized');
    } catch (error) {
      console.error('❌ SurrealDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected && this.db) {
      await this.db.close();
      this.connected = false;
      console.log('📴 SurrealDB disconnected');
    }
  }

  private async initializeSchema(): Promise<void> {
    // Symbol tables (replacing Neo4j nodes)
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS symbols SCHEMAFULL;
      DEFINE FIELD IF NOT EXISTS symbol_id ON symbols TYPE string;
      DEFINE FIELD IF NOT EXISTS name ON symbols TYPE string;
      DEFINE FIELD IF NOT EXISTS type ON symbols TYPE string;
      DEFINE FIELD IF NOT EXISTS file_path ON symbols TYPE string;
      DEFINE FIELD IF NOT EXISTS location ON symbols TYPE object;
      DEFINE FIELD IF NOT EXISTS scope ON symbols TYPE string;
      DEFINE FIELD IF NOT EXISTS metadata ON symbols TYPE object;
      DEFINE FIELD IF NOT EXISTS created_at ON symbols TYPE datetime DEFAULT time::now();
      DEFINE FIELD IF NOT EXISTS updated_at ON symbols TYPE datetime DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_symbols_id ON symbols FIELDS symbol_id UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_symbols_file ON symbols FIELDS file_path;
      DEFINE INDEX IF NOT EXISTS idx_symbols_type ON symbols FIELDS type;
    `);

    // Relationship tables (replacing Neo4j edges)
    // In SurrealDB, relationships are created dynamically with RELATE
    // We don't need to define them as tables unless we want schema constraints

    // Pattern tables
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS patterns SCHEMAFULL;
      DEFINE FIELD IF NOT EXISTS pattern_id ON patterns TYPE string;
      DEFINE FIELD IF NOT EXISTS category ON patterns TYPE string;
      DEFINE FIELD IF NOT EXISTS strength ON patterns TYPE number;
      DEFINE FIELD IF NOT EXISTS confidence ON patterns TYPE number;
      DEFINE FIELD IF NOT EXISTS complexity ON patterns TYPE number;
      DEFINE FIELD IF NOT EXISTS harmonic_properties ON patterns TYPE object;
      DEFINE FIELD IF NOT EXISTS locations ON patterns TYPE array;
      DEFINE FIELD IF NOT EXISTS evidence ON patterns TYPE array;
      DEFINE FIELD IF NOT EXISTS created_at ON patterns TYPE datetime DEFAULT time::now();
      DEFINE FIELD IF NOT EXISTS updated_at ON patterns TYPE datetime DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_patterns_id ON patterns FIELDS pattern_id UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_patterns_category ON patterns FIELDS category;
      DEFINE INDEX IF NOT EXISTS idx_patterns_strength ON patterns FIELDS strength;
    `);

    // Cache table (replacing Redis)
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS cache SCHEMAFULL;
      DEFINE FIELD IF NOT EXISTS key ON cache TYPE string;
      DEFINE FIELD IF NOT EXISTS value ON cache TYPE any;
      DEFINE FIELD IF NOT EXISTS ttl ON cache TYPE datetime;
      DEFINE FIELD IF NOT EXISTS created_at ON cache TYPE datetime DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_cache_key ON cache FIELDS key UNIQUE;
      
      -- Auto-expire event
      DEFINE EVENT IF NOT EXISTS cache_cleanup ON TABLE cache WHEN $after.ttl < time::now() THEN (
        DELETE cache WHERE id = $after.id
      );
    `);

    // File analysis cache (replacing SQLite tables)
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS file_analysis SCHEMAFULL;
      DEFINE FIELD IF NOT EXISTS file_path ON file_analysis TYPE string;
      DEFINE FIELD IF NOT EXISTS hash ON file_analysis TYPE string;
      DEFINE FIELD IF NOT EXISTS last_modified ON file_analysis TYPE number;
      DEFINE FIELD IF NOT EXISTS symbols ON file_analysis TYPE array;
      DEFINE FIELD IF NOT EXISTS dependencies ON file_analysis TYPE array;
      DEFINE FIELD IF NOT EXISTS analysis_timestamp ON file_analysis TYPE number;
      DEFINE FIELD IF NOT EXISTS version ON file_analysis TYPE string;
      DEFINE INDEX IF NOT EXISTS idx_file_analysis_path ON file_analysis FIELDS file_path UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_file_analysis_hash ON file_analysis FIELDS hash;
    `);

    // Analytics aggregation cache
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS analytics_cache SCHEMAFULL;
      DEFINE FIELD IF NOT EXISTS query_key ON analytics_cache TYPE string;
      DEFINE FIELD IF NOT EXISTS result ON analytics_cache TYPE any;
      DEFINE FIELD IF NOT EXISTS computed_at ON analytics_cache TYPE datetime;
      DEFINE FIELD IF NOT EXISTS ttl ON analytics_cache TYPE datetime;
      DEFINE INDEX IF NOT EXISTS idx_analytics_key ON analytics_cache FIELDS query_key UNIQUE;
    `);
  }

  // Symbol Operations (replacing Neo4j)
  async createSymbol(symbol: SymbolNode): Promise<void> {
    const record: StoredSymbol = {
      symbol_id: symbol.id,
      name: symbol.name,
      type: symbol.type,
      file_path: symbol.location.file,
      location: symbol.location,
      scope: symbol.scope,
      metadata: symbol.metadata || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.db.create('symbols', record);
  }

  async createSymbolRelationship(relationship: SymbolRelationship): Promise<void> {
    // Get the actual record IDs first
    const [fromResults] = await this.db.query<[any[]]>(
      `SELECT id FROM symbols WHERE symbol_id = $id LIMIT 1`,
      { id: relationship.from }
    );
    const [toResults] = await this.db.query<[any[]]>(
      `SELECT id FROM symbols WHERE symbol_id = $id LIMIT 1`, 
      { id: relationship.to }
    );
    
    if (!fromResults[0] || !toResults[0]) {
      throw new Error('Symbol not found');
    }
    
    const fromId = fromResults[0].id;
    const toId = toResults[0].id;
    
    // Create relationship using actual record IDs
    const query = `
      RELATE ${fromId}->${relationship.type}->${toId}
      SET weight = $weight,
          properties = $properties,
          created_at = time::now()
    `;
    
    await this.db.query(query, {
      weight: relationship.weight || 1.0,
      properties: relationship.properties || {}
    });
  }

  async getSymbolsByFile(file: string): Promise<SymbolNode[]> {
    const results = await this.db.query<[StoredSymbol[]]>(`
      SELECT * FROM symbols WHERE file_path = $file
    `, { file });

    return results[0].map(s => this.convertToSymbolNode(s));
  }

  async getSymbolCallGraph(symbolId: string, depth: number = 2): Promise<any> {
    // Complex graph traversal query
    const query = `
      LET $symbol = (SELECT * FROM symbols WHERE symbol_id = $symbolId);
      LET $depth1 = (
        SELECT 
          ->calls->symbols.* AS calls,
          ->imports->symbols.* AS imports,
          ->references->symbols.* AS references
        FROM $symbol
      );
      RETURN {
        root: $symbol,
        calls: $depth1.calls,
        imports: $depth1.imports,
        references: $depth1.references
      };
    `;

    const results = await this.db.query(query, { symbolId });
    return results[0];
  }

  // Pattern Operations
  async createPattern(pattern: HarmonicPatternMemory): Promise<void> {
    const record: StoredPattern = {
      pattern_id: pattern.id,
      category: pattern.harmonicProperties.category,
      strength: pattern.harmonicProperties.strength,
      confidence: pattern.harmonicProperties.confidence,
      complexity: pattern.harmonicProperties.complexity,
      harmonic_properties: pattern.harmonicProperties,
      locations: pattern.locations,
      evidence: pattern.evidence,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.db.create('patterns', record);
  }

  async findSimilarPatterns(patternId: string, minSimilarity: number = 0.5): Promise<any[]> {
    // For now, return patterns from the same category
    // In a real implementation, we would calculate similarity scores
    const results = await this.db.query<[StoredPattern[]]>(`
      SELECT * FROM patterns 
      WHERE pattern_id != $patternId
      AND category = (SELECT category FROM patterns WHERE pattern_id = $patternId)
      LIMIT 10
    `, { patternId });

    return results[0].map(p => ({
      ...this.convertToHarmonicPattern(p),
      similarity: 0.5 + Math.random() * 0.5 // Mock similarity score
    }));
  }

  async getPatternsByCategory(category: PatternCategory): Promise<HarmonicPatternMemory[]> {
    const results = await this.db.query<[StoredPattern[]]>(`
      SELECT * FROM patterns WHERE category = $category
      ORDER BY strength DESC
    `, { category });

    return results[0].map(this.convertToHarmonicPattern);
  }

  // Cache Operations (replacing Redis)
  async cacheSet(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const item: CachedItem = {
      key,
      value,
      ttl: new Date(Date.now() + ttlSeconds * 1000),
      created_at: new Date()
    };

    // Use UPSERT to replace existing keys
    await this.db.query(`
      UPSERT cache:[$key] 
      SET value = $value, 
          ttl = $ttl, 
          created_at = time::now(),
          key = $key
    `, item);
  }

  async cacheGet(key: string): Promise<any | null> {
    // Query by record ID since we're using cache:[$key] format
    const results = await this.db.query<[CachedItem[]]>(`
      SELECT * FROM cache:[$key] WHERE ttl > time::now()
    `, { key });

    const item = results[0]?.[0];
    return item ? item.value : null;
  }

  async cacheDelete(key: string): Promise<void> {
    await this.db.query(`DELETE cache:[$key]`, { key });
  }

  async cacheInvalidatePattern(pattern?: string): Promise<void> {
    if (pattern) {
      await this.db.query(`
        DELETE cache WHERE key ~ $pattern
      `, { pattern });
    } else {
      await this.db.query(`DELETE cache`);
    }
  }

  // File Analysis Operations (replacing SQLite)
  async storeFileAnalysis(analysis: any): Promise<void> {
    await this.db.query(`
      UPSERT file_analysis:[$file_path]
      SET file_path = $file_path,
          hash = $hash,
          last_modified = $last_modified,
          symbols = $symbols,
          dependencies = $dependencies,
          analysis_timestamp = $analysis_timestamp,
          version = $version
    `, analysis);
  }

  async getFileAnalysis(filePath: string): Promise<any | null> {
    const results = await this.db.query(`
      SELECT * FROM file_analysis WHERE file_path = $filePath
    `, { filePath });

    return results[0]?.[0] || null;
  }

  // Analytics Operations
  async getPatternDistribution(): Promise<Record<PatternCategory, number>> {
    const results = await this.db.query(`
      SELECT category, count() AS count
      FROM patterns
      GROUP BY category
    `);

    const distribution: Record<string, number> = {};
    for (const row of results[0] || []) {
      distribution[row.category] = row.count;
    }
    return distribution as Record<PatternCategory, number>;
  }

  async getComplexityHotspots(limit: number = 10): Promise<SymbolNode[]> {
    const results = await this.db.query<[StoredSymbol[]]>(`
      SELECT * FROM symbols
      WHERE metadata.complexity > 10
      ORDER BY metadata.complexity DESC
      LIMIT $limit
    `, { limit });

    return results[0].map(s => this.convertToSymbolNode(s));
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; info?: any }> {
    try {
      await this.db.query('SELECT 1');
      const stats = await this.getStats();
      return { status: 'healthy', info: stats };
    } catch (error) {
      return { status: 'error', info: error };
    }
  }

  async getStats(): Promise<any> {
    const [symbols] = await this.db.query('SELECT count() AS count FROM symbols');
    const [patterns] = await this.db.query('SELECT count() AS count FROM patterns');
    const [cache] = await this.db.query('SELECT count() AS count FROM cache');
    const [files] = await this.db.query('SELECT count() AS count FROM file_analysis');

    return {
      symbols: symbols[0]?.count || 0,
      patterns: patterns[0]?.count || 0,
      cache: cache[0]?.count || 0,
      files: files[0]?.count || 0
    };
  }

  // Utility methods
  private convertToSymbolNode(stored: StoredSymbol): SymbolNode {
    return {
      id: stored.symbol_id,
      name: stored.name,
      type: stored.type as any,
      location: stored.location,
      scope: stored.scope,
      dependencies: [],
      dependents: [],
      metadata: stored.metadata
    };
  }

  private convertToHarmonicPattern(stored: StoredPattern): HarmonicPatternMemory {
    return {
      id: stored.pattern_id,
      coordinates: [0, 0, 0], // Would need to be calculated
      content: {
        title: `Pattern ${stored.pattern_id}`,
        description: '',
        type: 'pattern',
        tags: [],
        data: {}
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: stored.created_at.getTime(),
      relevanceScore: stored.strength,
      harmonicProperties: stored.harmonic_properties,
      locations: stored.locations,
      evidence: stored.evidence,
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    };
  }

  // Transaction support
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.db.query('BEGIN TRANSACTION');
    try {
      const result = await fn();
      await this.db.query('COMMIT TRANSACTION');
      return result;
    } catch (error) {
      await this.db.query('CANCEL TRANSACTION');
      throw error;
    }
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    const tables = ['symbols', 'patterns', 'cache', 'file_analysis', 'analytics_cache'];
    for (const table of tables) {
      await this.db.query(`DELETE ${table}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}