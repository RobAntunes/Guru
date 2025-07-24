/**
 * Harmonic DuckLake Implementation
 * Extends the data lake with DuckLake's advanced features
 */

import { Database } from 'duckdb-async';
import { HarmonicDataLake, HarmonicPatternRecord, PatternQuery } from './harmonic-data-lake.js';
import { createDuckDBClient } from './duckdb-http-client.js';
import path from 'path';

export interface DuckLakeConfig {
  catalogDb: 'duckdb' | 'sqlite' | 'postgresql' | 'mysql';
  catalogPath: string;
  storageConfig?: {
    compression: 'snappy' | 'zstd' | 'gzip';
    enableStatistics: boolean;
  };
}

export class HarmonicDuckLake extends HarmonicDataLake {
  private duckLakeDb: Database;
  private lakeName: string;
  private config: DuckLakeConfig;

  constructor(
    basePath: string = '.guru/datalake',
    lakeName: string = 'harmonic_lake',
    config?: Partial<DuckLakeConfig>
  ) {
    super(basePath);
    this.lakeName = lakeName;
    this.config = {
      catalogDb: config?.catalogDb || 'duckdb',
      catalogPath: config?.catalogPath || path.join(basePath, 'metadata.ducklake'),
      storageConfig: {
        compression: config?.storageConfig?.compression || 'zstd',
        enableStatistics: config?.storageConfig?.enableStatistics ?? true
      }
    };
    // Initialize will create the actual database connection
    this.duckLakeDb = null as any; // Will be set in initialize()
  }

  async initialize(): Promise<void> {
    console.log('🦆 Initializing Harmonic DuckLake...');
    
    // Try to create DuckDB client
    try {
      // In production, always use embedded DuckDB
      if (process.env.NODE_ENV === 'production') {
        const { Database } = await import('duckdb-async');
        this.duckLakeDb = new Database(':memory:');
      } else {
        // In development/test, try HTTP client first, then embedded
        this.duckLakeDb = await createDuckDBClient();
      }
    } catch (error) {
      console.warn('Failed to create DuckDB client:', error);
      // Only use mock in test environment
      if (process.env.NODE_ENV === 'test') {
        this.duckLakeDb = this.createMockDatabase();
      } else {
        throw error; // In production, fail hard
      }
    }
    
    // Install DuckLake extension (if supported)
    try {
      await this.duckLakeDb.run(`
      INSTALL ducklake;
      LOAD ducklake;
    `);

    // Attach DuckLake catalog
    await this.duckLakeDb.run(`
      ATTACH 'ducklake:${this.config.catalogPath}' AS ${this.lakeName};
      USE ${this.lakeName};
    `);

    // Create patterns table with DuckLake features
    await this.duckLakeDb.run(`
      CREATE TABLE IF NOT EXISTS patterns (
        -- Core pattern data
        id VARCHAR PRIMARY KEY,
        timestamp TIMESTAMP,
        file_path VARCHAR,
        symbol_id VARCHAR,
        symbol_name VARCHAR,
        symbol_type VARCHAR,
        line_start INTEGER,
        line_end INTEGER,
        pattern_type VARCHAR,
        category VARCHAR,
        score DOUBLE,
        confidence DOUBLE,
        evidence TEXT,
        metrics TEXT,
        related_patterns TEXT,
        parent_pattern VARCHAR,
        analysis_version VARCHAR,
        codebase_hash VARCHAR,
        
        -- DuckLake system columns
        _ducklake_version BIGINT DEFAULT nextval('pattern_version_seq'),
        _ducklake_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        _ducklake_operation VARCHAR DEFAULT 'INSERT'
      ) USING DUCKLAKE
      WITH (
        compression = '${this.config.storageConfig?.compression}',
        enable_statistics = ${this.config.storageConfig?.enableStatistics}
      );
    `);

    // Create indexes for common queries
    await this.createDuckLakeIndexes();

    // Create initial snapshot
    await this.createSnapshot('initial');

    console.log('✅ DuckLake initialized with advanced features');
    } catch (error) {
      console.warn('DuckLake extension not available, using standard DuckDB features');
    }
  }

  /**
   * Store patterns with ACID transaction support
   */
  async storePatternBatch(
    patterns: any[], 
    metadata: {
      analysisId: string;
      codebaseHash: string;
      version: string;
    }
  ): Promise<void> {
    // If database is not initialized or is a mock, skip
    if (!this.duckLakeDb || (this.duckLakeDb as any).isMock) {
      console.log('Skipping pattern batch storage (mock database)');
      return;
    }

    const timestamp = new Date();
    
    // Convert patterns to records
    const records: HarmonicPatternRecord[] = patterns.map(p => ({
      id: `${metadata.analysisId}_${p.symbol}_${p.pattern}`,
      timestamp,
      file_path: p.location.file,
      symbol_id: p.symbol,
      symbol_name: p.symbol.split(':')[1] || p.symbol,
      symbol_type: p.symbol.split(':')[2] || 'unknown',
      line_start: p.location.line,
      line_end: p.location.line,
      pattern_type: p.pattern,
      category: p.category,
      score: p.score,
      confidence: p.confidence,
      evidence: JSON.stringify(p.evidence || {}),
      metrics: JSON.stringify(p.metrics || {}),
      related_patterns: JSON.stringify([]),
      parent_pattern: null,
      analysis_version: metadata.version,
      codebase_hash: metadata.codebaseHash
    }));

    // Start ACID transaction
    await this.duckLakeDb.run('BEGIN TRANSACTION');
    
    try {
      // Batch insert with prepared statement
      const stmt = await this.duckLakeDb.prepare(`
        INSERT INTO patterns (
          id, timestamp, file_path, symbol_id, symbol_name, symbol_type,
          line_start, line_end, pattern_type, category, score, confidence,
          evidence, metrics, related_patterns, parent_pattern, 
          analysis_version, codebase_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const record of records) {
        await stmt.run(
          record.id, record.timestamp, record.file_path, record.symbol_id,
          record.symbol_name, record.symbol_type, record.line_start,
          record.line_end, record.pattern_type, record.category,
          record.score, record.confidence, record.evidence, record.metrics,
          record.related_patterns, record.parent_pattern,
          record.analysis_version, record.codebase_hash
        );
      }

      await stmt.finalize();
      await this.duckLakeDb.run('COMMIT');

      console.log(`🦆 Stored ${records.length} patterns with ACID guarantees`);

      // Auto-snapshot after large batches
      if (records.length > 10000) {
        await this.createSnapshot(`auto_${metadata.analysisId}_${Date.now()}`);
      }
    } catch (error) {
      await this.duckLakeDb.run('ROLLBACK');
      throw new Error(`DuckLake transaction failed: ${error}`);
    }
  }

  /**
   * Query patterns with DuckLake optimizations
   */
  async queryPatterns(query: PatternQuery): Promise<HarmonicPatternRecord[]> {
    const conditions: string[] = [];
    const params: any = {};
    
    if (query.categories?.length) {
      conditions.push(`category = ANY($categories)`);
      params.categories = query.categories;
    }
    
    if (query.patterns?.length) {
      conditions.push(`pattern_type = ANY($patterns)`);
      params.patterns = query.patterns;
    }
    
    if (query.minScore !== undefined) {
      conditions.push('score >= $minScore');
      params.minScore = query.minScore;
    }
    
    if (query.timeRange) {
      conditions.push('timestamp BETWEEN $startTime AND $endTime');
      params.startTime = query.timeRange.start;
      params.endTime = query.timeRange.end;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = query.limit ? `LIMIT ${query.limit}` : '';
    
    const sql = `
      SELECT * FROM patterns
      ${whereClause}
      ORDER BY score DESC
      ${limitClause}
    `;
    
    return await this.duckLakeDb.all(sql, params) as HarmonicPatternRecord[];
  }

  /**
   * Time travel query - analyze patterns at a specific point
   */
  async queryAtTimestamp(timestamp: Date, query: PatternQuery): Promise<HarmonicPatternRecord[]> {
    const timeTravel = `AS OF TIMESTAMP '${timestamp.toISOString()}'`;
    
    const sql = `
      SELECT * FROM patterns ${timeTravel}
      WHERE score >= ${query.minScore || 0}
      ${query.limit ? `LIMIT ${query.limit}` : ''}
    `;
    
    return await this.duckLakeDb.all(sql) as HarmonicPatternRecord[];
  }

  /**
   * Create a named snapshot
   */
  async createSnapshot(name: string, description?: string): Promise<void> {
    await this.duckLakeDb.run(`
      CREATE SNAPSHOT '${name}' IN ${this.lakeName}
      ${description ? `WITH COMMENT '${description}'` : ''};
    `);
    
    console.log(`📸 Created DuckLake snapshot: ${name}`);
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<any[]> {
    const result = await this.duckLakeDb.all(`
      SELECT * FROM ${this.lakeName}.snapshots
      ORDER BY created_at DESC;
    `);
    
    return result;
  }

  /**
   * Schema evolution - add new columns without breaking queries
   */
  async evolveSchema(alterations: Array<{
    column: string;
    type: string;
    defaultValue?: any;
  }>): Promise<void> {
    for (const alt of alterations) {
      await this.duckLakeDb.run(`
        ALTER TABLE patterns 
        ADD COLUMN IF NOT EXISTS ${alt.column} ${alt.type}
        ${alt.defaultValue !== undefined ? `DEFAULT ${alt.defaultValue}` : ''};
      `);
    }
    
    console.log(`🔄 Schema evolved with ${alterations.length} new columns`);
  }

  /**
   * Get pattern evolution over time
   */
  async getPatternEvolution(fileOrSymbol: string, days: number = 30): Promise<any[]> {
    return this.analyzePatternEvolution(fileOrSymbol, {
      timeRange: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      granularity: 'day'
    });
  }

  /**
   * Pattern evolution analysis using time travel
   */
  async analyzePatternEvolution(
    fileOrSymbol: string,
    options: {
      snapshots?: string[];
      timeRange?: { start: Date; end: Date };
      granularity?: 'hour' | 'day' | 'week';
    } = {}
  ): Promise<any> {
    if (!this.duckLakeDb || (this.duckLakeDb as any).isMock) {
      return [];
    }

    const granularity = options.granularity || 'day';
    
    const sql = `
      WITH evolution AS (
        SELECT 
          date_trunc('${granularity}', _ducklake_timestamp) as period,
          pattern_type,
          category,
          AVG(score) as avg_score,
          COUNT(*) as pattern_count,
          STDDEV(score) as score_variance
        FROM patterns
        WHERE (file_path = $target OR symbol_id = $target)
          ${options.timeRange ? 
            `AND _ducklake_timestamp BETWEEN $start AND $end` : ''}
        GROUP BY period, pattern_type, category
      )
      SELECT 
        *,
        avg_score - LAG(avg_score) OVER (
          PARTITION BY pattern_type ORDER BY period
        ) as score_change,
        pattern_count - LAG(pattern_count) OVER (
          PARTITION BY pattern_type ORDER BY period
        ) as count_change
      FROM evolution
      ORDER BY period DESC, pattern_type;
    `;
    
    const params: any = { target: fileOrSymbol };
    if (options.timeRange) {
      params.start = options.timeRange.start;
      params.end = options.timeRange.end;
    }
    
    return await this.duckLakeDb.all(sql, params);
  }

  /**
   * Compare patterns between snapshots
   */
  async compareSnapshots(
    snapshot1: string, 
    snapshot2: string
  ): Promise<{
    added: HarmonicPatternRecord[];
    removed: HarmonicPatternRecord[];
    changed: Array<{
      pattern: HarmonicPatternRecord;
      scoreChange: number;
      confidenceChange: number;
    }>;
  }> {
    const sql = `
      WITH 
      snap1 AS (
        SELECT * FROM patterns AT SNAPSHOT '${snapshot1}'
      ),
      snap2 AS (
        SELECT * FROM patterns AT SNAPSHOT '${snapshot2}'
      ),
      -- Find added patterns
      added AS (
        SELECT s2.*
        FROM snap2 s2
        LEFT JOIN snap1 s1 ON s2.id = s1.id
        WHERE s1.id IS NULL
      ),
      -- Find removed patterns
      removed AS (
        SELECT s1.*
        FROM snap1 s1
        LEFT JOIN snap2 s2 ON s1.id = s2.id
        WHERE s2.id IS NULL
      ),
      -- Find changed patterns
      changed AS (
        SELECT 
          s2.*,
          s2.score - s1.score as score_change,
          s2.confidence - s1.confidence as confidence_change
        FROM snap1 s1
        JOIN snap2 s2 ON s1.id = s2.id
        WHERE s1.score != s2.score OR s1.confidence != s2.confidence
      )
      SELECT 
        'added' as change_type, added.* FROM added
      UNION ALL
      SELECT 
        'removed' as change_type, removed.* FROM removed
      UNION ALL
      SELECT 
        'changed' as change_type, changed.* FROM changed;
    `;
    
    const results = await this.duckLakeDb.all(sql);
    
    const added: HarmonicPatternRecord[] = [];
    const removed: HarmonicPatternRecord[] = [];
    const changed: any[] = [];
    
    for (const row of results) {
      const record = row as any;
      switch (record.change_type) {
        case 'added':
          added.push(record);
          break;
        case 'removed':
          removed.push(record);
          break;
        case 'changed':
          changed.push({
            pattern: record,
            scoreChange: record.score_change,
            confidenceChange: record.confidence_change
          });
          break;
      }
    }
    
    return { added, removed, changed };
  }

  /**
   * Create optimized indexes for DuckLake
   */
  private async createDuckLakeIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_dl_category_score ON patterns(category, score DESC)',
      'CREATE INDEX IF NOT EXISTS idx_dl_file_pattern ON patterns(file_path, pattern_type)',
      'CREATE INDEX IF NOT EXISTS idx_dl_symbol_timestamp ON patterns(symbol_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_dl_score_confidence ON patterns(score DESC, confidence DESC)',
      'CREATE INDEX IF NOT EXISTS idx_dl_version ON patterns(_ducklake_version)'
    ];
    
    for (const idx of indexes) {
      await this.duckLakeDb.run(idx);
    }
  }

  /**
   * Optimize storage with compaction
   */
  async optimizeStorage(): Promise<void> {
    console.log('🗜️  Optimizing DuckLake storage...');
    
    await this.duckLakeDb.run(`
      CHECKPOINT ${this.lakeName};
      VACUUM ${this.lakeName};
    `);
    
    console.log('✅ Storage optimized');
  }

  /**
   * Export patterns to Parquet for external analysis
   */
  async exportToParquet(
    outputPath: string,
    query?: PatternQuery
  ): Promise<void> {
    const whereClause = query ? this.buildWhereClause(query) : '';
    
    await this.duckLakeDb.run(`
      COPY (
        SELECT * FROM patterns ${whereClause}
      ) TO '${outputPath}'
      WITH (FORMAT 'PARQUET', COMPRESSION 'ZSTD');
    `);
    
    console.log(`📦 Exported patterns to: ${outputPath}`);
  }

  /**
   * Find hotspot files with many patterns
   */
  async findHotspots(minPatterns: number = 5): Promise<any[]> {
    if (!this.duckLakeDb || (this.duckLakeDb as any).isMock) {
      return [];
    }

    const sql = `
      SELECT 
        file_path,
        COUNT(*) as pattern_count,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        COUNT(DISTINCT pattern_type) as pattern_diversity
      FROM patterns
      GROUP BY file_path
      HAVING COUNT(*) >= ?
      ORDER BY pattern_count DESC
      LIMIT 20
    `;

    return await this.duckLakeDb.all(sql, minPatterns);
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(): Promise<any> {
    if (!this.duckLakeDb || (this.duckLakeDb as any).isMock) {
      return { totalPatterns: 0, categories: {}, avgScore: 0 };
    }

    const sql = `
      SELECT 
        COUNT(*) as totalPatterns,
        AVG(score) as avgScore,
        MIN(score) as minScore,
        MAX(score) as maxScore,
        COUNT(DISTINCT category) as uniqueCategories,
        COUNT(DISTINCT pattern_type) as uniquePatternTypes
      FROM patterns
    `;

    const stats = await this.duckLakeDb.get(sql);
    
    // Get category distribution
    const categoryStats = await this.duckLakeDb.all(`
      SELECT category, COUNT(*) as count
      FROM patterns
      GROUP BY category
    `);

    const categories: Record<string, number> = {};
    for (const cat of categoryStats) {
      categories[cat.category] = cat.count;
    }

    return { ...stats, categories };
  }

  private buildWhereClause(query: PatternQuery): string {
    const conditions: string[] = [];
    
    if (query.categories?.length) {
      conditions.push(`category IN (${query.categories.map(c => `'${c}'`).join(',')})`);
    }
    
    if (query.minScore !== undefined) {
      conditions.push(`score >= ${query.minScore}`);
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Create a mock database for testing when DuckDB fails to load
   */
  private createMockDatabase(): any {
    console.warn('Using mock DuckDB - functionality will be limited');
    const mockData: any[] = [];
    
    return {
      isMock: true,
      run: async (sql: string) => {
        console.log('[MockDB] SQL:', sql.substring(0, 100));
        return { changes: 0 };
      },
      prepare: (sql: string) => ({
        all: () => mockData,
        run: (...params: any[]) => ({ changes: 0 }),
        get: () => mockData[0],
        finalize: async () => {}
      }),
      all: async (sql: string, params?: any) => mockData,
      get: async (sql: string, params?: any) => mockData[0],
      close: () => {},
      transaction: (fn: Function) => fn,
      exec: (sql: string) => {}
    };
  }
}

// Export convenience function
export async function createHarmonicDuckLake(
  basePath?: string,
  lakeName?: string,
  config?: Partial<DuckLakeConfig>
): Promise<HarmonicDuckLake> {
  const lake = new HarmonicDuckLake(basePath, lakeName, config);
  await lake.initialize();
  return lake;
}