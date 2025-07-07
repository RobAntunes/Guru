/**
 * Production DuckDB Data Lake Implementation
 * Handles async initialization properly for production use
 */

import duckdb from 'duckdb';
import { promisify } from 'util';
import { HarmonicPatternRecord, PatternQuery, SnapshotInfo } from './harmonic-data-lake.js';
import { Logger } from '../logging/logger.js';
import path from 'path';
import fs from 'fs/promises';

export class DuckDBDataLake {
  private db: duckdb.Database | null = null;
  private connection: any = null;
  private logger = Logger.getInstance();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  
  constructor(private dbPath: string = ':memory:') {}

  /**
   * Initialize DuckDB with proper async handling
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.initPromise) {
      return this.initPromise;
    }
    
    if (this.isInitialized) {
      return;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Create database with promisified methods
      await new Promise<void>((resolve, reject) => {
        this.db = new duckdb.Database(this.dbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Create connection
      this.connection = this.db.connect();
      
      // Promisify methods we need
      this.connection.allAsync = promisify(this.connection.all).bind(this.connection);
      this.connection.runAsync = promisify(this.connection.run).bind(this.connection);
      this.connection.execAsync = promisify(this.connection.exec).bind(this.connection);

      // Create schema
      await this.createSchema();
      
      this.isInitialized = true;
      this.logger.info(`🦆 DuckDB Data Lake initialized ${this.dbPath === ':memory:' ? '(in-memory)' : `at ${this.dbPath}`}`);
    } catch (error) {
      this.logger.error('Failed to initialize DuckDB:', error);
      throw error;
    }
  }

  /**
   * Ensure initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Create the patterns table schema
   */
  private async createSchema(): Promise<void> {
    const schema = `
      CREATE TABLE IF NOT EXISTS patterns (
        id VARCHAR PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        file_path VARCHAR NOT NULL,
        symbol_id VARCHAR NOT NULL,
        symbol_name VARCHAR,
        symbol_type VARCHAR,
        line_start INTEGER,
        line_end INTEGER,
        pattern_type VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        score DOUBLE NOT NULL,
        confidence DOUBLE,
        evidence JSON,
        metrics JSON,
        related_patterns JSON,
        parent_pattern VARCHAR,
        analysis_version VARCHAR,
        codebase_hash VARCHAR
      );

      -- Indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_patterns_timestamp ON patterns(timestamp);
      CREATE INDEX IF NOT EXISTS idx_patterns_file ON patterns(file_path);
      CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
      CREATE INDEX IF NOT EXISTS idx_patterns_score ON patterns(score);
      CREATE INDEX IF NOT EXISTS idx_patterns_symbol ON patterns(symbol_id);
    `;

    await this.connection.execAsync(schema);
  }

  /**
   * Store a batch of patterns
   */
  async storePatternBatch(
    patterns: any[],
    metadata: {
      analysisId: string;
      codebaseHash: string;
      version: string;
    }
  ): Promise<void> {
    await this.ensureInitialized();
    
    const timestamp = new Date().toISOString();
    
    // Prepare batch insert - create proper values for each pattern
    const valueRows = patterns.map((p, idx) => {
      // Use index to ensure unique IDs
      const patternId = `${metadata.analysisId}_${p.symbol}_${p.pattern}_${idx}`.replace(/'/g, "''");
      const symbolName = (p.symbol.split(':')[1] || p.symbol).replace(/'/g, "''");
      const symbolType = (p.symbol.split(':')[2] || 'unknown').replace(/'/g, "''");
      
      return `(
        '${patternId}',
        '${timestamp}',
        '${p.location.file.replace(/'/g, "''")}',
        '${p.symbol.replace(/'/g, "''")}',
        '${symbolName}',
        '${symbolType}',
        ${p.location.line || 0},
        ${p.location.line || 0},
        '${p.pattern.replace(/'/g, "''")}',
        '${p.category.replace(/'/g, "''")}',
        ${p.score || 0},
        ${p.confidence || 0},
        '${JSON.stringify(p.evidence || {}).replace(/'/g, "''")}',
        '${JSON.stringify(p.metrics || {}).replace(/'/g, "''")}',
        '${JSON.stringify([]).replace(/'/g, "''")}',
        NULL,
        '${metadata.version}',
        '${metadata.codebaseHash}'
      )`;
    });

    const query = `
      INSERT INTO patterns VALUES ${valueRows.join(', ')}
    `;

    try {
      await this.connection.runAsync(query);
      this.logger.debug(`Stored ${patterns.length} patterns in DuckDB`);
    } catch (error) {
      this.logger.error('Failed to store patterns:', error);
      throw error;
    }
  }

  /**
   * Query patterns with filters
   */
  async queryPatterns(query: PatternQuery): Promise<HarmonicPatternRecord[]> {
    await this.ensureInitialized();
    
    let sql = 'SELECT * FROM patterns WHERE 1=1';
    const params: any[] = [];

    if (query.categories && query.categories.length > 0) {
      sql += ` AND category IN (${query.categories.map(() => '?').join(',')})`;
      params.push(...query.categories);
    }

    if (query.minScore !== undefined) {
      sql += ' AND score >= ?';
      params.push(query.minScore);
    }

    if (query.files && query.files.length > 0) {
      sql += ` AND file_path IN (${query.files.map(() => '?').join(',')})`;
      params.push(...query.files);
    }

    if (query.timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(query.timeRange.start, query.timeRange.end);
    }

    sql += ' ORDER BY timestamp DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    try {
      const results = await this.connection.allAsync(sql, ...params);
      return results as HarmonicPatternRecord[];
    } catch (error) {
      this.logger.error('Query failed:', error);
      throw error;
    }
  }

  /**
   * Analyze pattern evolution over time
   */
  async analyzePatternEvolution(
    target: string,
    options: {
      timeRange?: { start: Date; end: Date };
      granularity?: 'hour' | 'day' | 'week' | 'month';
    } = {}
  ): Promise<any[]> {
    await this.ensureInitialized();
    
    const granularity = options.granularity || 'day';
    const dateFormat = {
      hour: '%Y-%m-%d %H:00:00',
      day: '%Y-%m-%d',
      week: '%Y-%W',
      month: '%Y-%m'
    }[granularity];

    const query = `
      SELECT 
        strftime('${dateFormat}', timestamp) as period,
        pattern_type,
        category,
        COUNT(*) as count,
        AVG(score) as avg_score,
        MIN(score) as min_score,
        MAX(score) as max_score
      FROM patterns
      WHERE (file_path = ? OR symbol_id = ?)
      ${options.timeRange ? 'AND timestamp BETWEEN ? AND ?' : ''}
      GROUP BY period, pattern_type, category
      ORDER BY period DESC
    `;

    const params = [target, target];
    if (options.timeRange) {
      params.push(options.timeRange.start.toISOString(), options.timeRange.end.toISOString());
    }

    try {
      return await this.connection.allAsync(query, ...params);
    } catch (error) {
      this.logger.error('Evolution analysis failed:', error);
      throw error;
    }
  }

  /**
   * Batch insert harmonic patterns (for compatibility)
   */
  async batchInsertPatterns(patterns: any[]): Promise<void> {
    await this.ensureInitialized();
    
    // Convert harmonic patterns to the expected format
    const records = patterns.map(p => ({
      symbol: p.id.split('_')[0] || 'unknown',
      pattern: p.content.type,
      category: p.harmonicProperties.category,
      score: p.harmonicProperties.strength,
      confidence: p.harmonicProperties.confidence,
      location: {
        file: p.locations?.[0]?.file || 'unknown',
        line: p.locations?.[0]?.startLine || 0
      },
      evidence: {
        occurrences: p.harmonicProperties.occurrences,
        complexity: p.harmonicProperties.complexity
      },
      metrics: {
        relevanceScore: p.relevanceScore,
        accessCount: p.accessCount
      }
    }));
    
    const metadata = {
      analysisId: `harmonic_${Date.now()}`,
      codebaseHash: 'test_hash',
      version: '1.0.0'
    };
    
    await this.storePatternBatch(records, metadata);
  }

  /**
   * Query patterns by time range
   */
  async queryTimeRange(options: {
    startTime: Date;
    endTime: Date;
    categories?: string[];
  }): Promise<any[]> {
    await this.ensureInitialized();
    
    let query = `
      SELECT * FROM patterns 
      WHERE timestamp >= ? AND timestamp <= ?
    `;
    
    const params: any[] = [options.startTime.toISOString(), options.endTime.toISOString()];
    
    if (options.categories && options.categories.length > 0) {
      query += ` AND category IN (${options.categories.map(() => '?').join(',')})`;
      params.push(...options.categories);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    try {
      return await this.connection.allAsync(query, ...params);
    } catch (error) {
      this.logger.error('Time range query failed:', error);
      throw error;
    }
  }

  /**
   * Aggregate patterns by various dimensions
   */
  async aggregatePatterns(options: {
    groupBy: string;
    metrics: string[];
  }): Promise<any[]> {
    await this.ensureInitialized();
    
    const metricQueries = options.metrics.map(m => {
      switch (m) {
        case 'count': return 'COUNT(*) as count';
        case 'avg_strength': return 'AVG(score) as avg_strength';
        case 'max_complexity': return 'MAX(CAST(json_extract(metrics, \'$.complexity\') AS DOUBLE)) as max_complexity';
        default: return null;
      }
    }).filter(Boolean).join(', ');
    
    const query = `
      SELECT 
        ${options.groupBy},
        ${metricQueries}
      FROM patterns
      GROUP BY ${options.groupBy}
      ORDER BY count DESC
    `;
    
    try {
      return await this.connection.allAsync(query);
    } catch (error) {
      this.logger.error('Aggregation query failed:', error);
      throw error;
    }
  }

  /**
   * General pattern query
   */
  async query(options: any): Promise<any[]> {
    await this.ensureInitialized();
    
    // Handle time range queries
    if (options.timeRange) {
      return this.queryTimeRange({
        startTime: options.timeRange.start,
        endTime: options.timeRange.end,
        categories: options.categories
      });
    }
    
    // Handle aggregation queries
    if (options.groupBy) {
      return this.aggregatePatterns(options);
    }
    
    // Default query
    return this.getPatternStats();
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(): Promise<any[]> {
    await this.ensureInitialized();
    
    const query = `
      SELECT 
        category,
        pattern_type,
        COUNT(*) as count,
        AVG(score) as avg_score,
        COUNT(DISTINCT file_path) as file_count,
        COUNT(DISTINCT symbol_id) as symbol_count
      FROM patterns
      GROUP BY category, pattern_type
      ORDER BY count DESC
    `;

    try {
      return await this.connection.allAsync(query);
    } catch (error) {
      this.logger.error('Stats query failed:', error);
      throw error;
    }
  }

  /**
   * Create a snapshot (using COPY for real snapshots)
   */
  async createSnapshot(name: string, comment?: string): Promise<void> {
    await this.ensureInitialized();
    
    if (this.dbPath === ':memory:') {
      this.logger.warn('Cannot create persistent snapshots in memory mode');
      return;
    }

    const snapshotPath = path.join(
      path.dirname(this.dbPath),
      `snapshots/${name}_${Date.now()}.parquet`
    );

    // Ensure snapshot directory exists
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true });

    const query = `
      COPY (SELECT * FROM patterns) 
      TO '${snapshotPath}' 
      (FORMAT PARQUET, COMPRESSION ZSTD)
    `;

    try {
      await this.connection.execAsync(query);
      this.logger.info(`Created snapshot: ${snapshotPath}`);
      
      // Store snapshot metadata
      await this.storeSnapshotMetadata(name, snapshotPath, comment);
    } catch (error) {
      this.logger.error('Snapshot creation failed:', error);
      throw error;
    }
  }

  /**
   * Store snapshot metadata
   */
  private async storeSnapshotMetadata(name: string, path: string, comment?: string): Promise<void> {
    // In production, store this in a metadata table
    const metadataQuery = `
      CREATE TABLE IF NOT EXISTS snapshots (
        name VARCHAR PRIMARY KEY,
        path VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comment VARCHAR
      );
      
      INSERT INTO snapshots (name, path, comment) VALUES (?, ?, ?);
    `;

    try {
      await this.connection.runAsync(metadataQuery, name, path, comment || '');
    } catch (error) {
      // Table might already exist, try just insert
      await this.connection.runAsync(
        'INSERT INTO snapshots (name, path, comment) VALUES (?, ?, ?)',
        name, path, comment || ''
      );
    }
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<SnapshotInfo[]> {
    await this.ensureInitialized();
    
    try {
      const results = await this.connection.allAsync(
        'SELECT name, created_at, comment FROM snapshots ORDER BY created_at DESC'
      );
      
      return results.map((r: any) => ({
        name: r.name,
        timestamp: new Date(r.created_at),
        comment: r.comment
      }));
    } catch (error) {
      // If snapshots table doesn't exist, return empty array
      return [];
    }
  }

  /**
   * Compare two snapshots
   */
  async compareSnapshots(snapshot1: string, snapshot2: string): Promise<any> {
    await this.ensureInitialized();
    
    // In production, load snapshots and compare
    // For now, return a placeholder
    return {
      added: [],
      removed: [],
      changed: [],
      summary: {
        snapshot1,
        snapshot2,
        timestamp: new Date()
      }
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      this.connection.close();
    }
    if (this.db) {
      await new Promise<void>((resolve) => {
        this.db!.close(() => resolve());
      });
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

/**
 * Factory function to create and initialize DuckDB data lake
 */
export async function createDuckDBDataLake(dbPath?: string): Promise<DuckDBDataLake> {
  const lake = new DuckDBDataLake(dbPath);
  await lake.initialize();
  return lake;
}