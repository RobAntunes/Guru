/**
 * Harmonic Intelligence Data Lake
 * Efficient storage and querying for massive harmonic analysis datasets
 */

import { Database } from 'duckdb-async';
import * as parquet from 'parquetjs';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

export interface HarmonicPatternRecord {
  // Identity
  id: string;
  timestamp: Date;
  
  // Location
  file_path: string;
  symbol_id: string;
  symbol_name: string;
  symbol_type: string;
  line_start: number;
  line_end: number;
  
  // Pattern Data
  pattern_type: string;
  category: string;
  score: number;
  confidence: number;
  
  // Analysis Details
  evidence: string; // JSON string
  metrics: string; // JSON string of pattern-specific metrics
  
  // Relationships
  related_patterns: string; // JSON array of IDs
  parent_pattern: string | null;
  
  // Metadata
  analysis_version: string;
  codebase_hash: string;
}

export interface PatternQuery {
  categories?: string[];
  patterns?: string[];
  files?: string[];
  minScore?: number;
  minConfidence?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

export class HarmonicDataLake {
  private db: Database;
  private basePath: string;
  private batchSize: number = 10000;
  private maxPartitionSize: number = 100 * 1024 * 1024; // 100MB

  constructor(basePath: string = '.guru/datalake') {
    this.basePath = basePath;
    try {
      this.db = new Database(':memory:'); // DuckDB in-memory for fast queries
    } catch (error) {
      console.warn('Failed to initialize DuckDB, some features may be limited:', error);
      // Only use mock in test environment
      if (process.env.NODE_ENV === 'test') {
        this.db = this.createMockDatabase();
      } else {
        throw error; // In production, fail hard
      }
    }
  }

  async initialize(): Promise<void> {
    // Create directory structure
    await this.ensureDirectories();
    
    // Set up DuckDB - skip if using mock database
    if (this.db.run && !this.db.isMock) {
      try {
        await this.db.run(`
          INSTALL parquet;
          LOAD parquet;
        `);
      } catch (error) {
        console.warn('Failed to install DuckDB extensions:', error);
      }
    }
    
    // Create pattern table schema
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS patterns (
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
        codebase_hash VARCHAR
      );
    `);
    
    // Create indexes
    await this.createIndexes();
    
    console.log('🌊 Harmonic Data Lake initialized');
  }

  /**
   * Store a batch of patterns efficiently
   */
  async storePatternBatch(patterns: any[], metadata: {
    analysisId: string;
    codebaseHash: string;
    version: string;
  }): Promise<void> {
    const timestamp = new Date();
    const dayPartition = timestamp.toISOString().split('T')[0];
    
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

    // Partition by day and category
    const partitions = this.partitionRecords(records, dayPartition);
    
    // Write each partition as Parquet
    for (const [partitionKey, partitionRecords] of partitions) {
      await this.writeParquetPartition(partitionKey, partitionRecords);
    }
    
    // Update metadata
    await this.updateMetadata(dayPartition, records.length, partitions.size);
    
    console.log(`💾 Stored ${records.length} patterns in ${partitions.size} partitions`);
  }

  /**
   * Query patterns using DuckDB
   */
  async queryPatterns(query: PatternQuery): Promise<HarmonicPatternRecord[]> {
    // Build WHERE clauses
    const conditions: string[] = [];
    const params: any = {};
    
    if (query.categories?.length) {
      conditions.push(`category IN (${query.categories.map((_, i) => `$cat${i}`).join(',')})`);
      query.categories.forEach((cat, i) => params[`cat${i}`] = cat);
    }
    
    if (query.patterns?.length) {
      conditions.push(`pattern_type IN (${query.patterns.map((_, i) => `$pat${i}`).join(',')})`);
      query.patterns.forEach((pat, i) => params[`pat${i}`] = pat);
    }
    
    if (query.minScore !== undefined) {
      conditions.push('score >= $minScore');
      params.minScore = query.minScore;
    }
    
    if (query.minConfidence !== undefined) {
      conditions.push('confidence >= $minConfidence');
      params.minConfidence = query.minConfidence;
    }
    
    if (query.timeRange) {
      conditions.push('timestamp BETWEEN $startTime AND $endTime');
      params.startTime = query.timeRange.start;
      params.endTime = query.timeRange.end;
    }
    
    // Build query
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = query.limit ? `LIMIT ${query.limit}` : '';
    
    const sql = `
      SELECT * FROM read_parquet('${this.basePath}/harmonics/daily/*/*.parquet')
      ${whereClause}
      ORDER BY score DESC
      ${limitClause}
    `;
    
    const result = await this.db.all(sql, params);
    return result as HarmonicPatternRecord[];
  }

  /**
   * Get pattern evolution over time
   */
  async getPatternEvolution(fileOrSymbol: string, days: number = 30): Promise<any[]> {
    const sql = `
      WITH daily_patterns AS (
        SELECT 
          DATE_TRUNC('day', timestamp) as day,
          pattern_type,
          category,
          AVG(score) as avg_score,
          COUNT(*) as pattern_count
        FROM read_parquet('${this.basePath}/harmonics/daily/*/*.parquet')
        WHERE (file_path = $target OR symbol_id = $target)
          AND timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY day, pattern_type, category
      )
      SELECT 
        day,
        pattern_type,
        category,
        avg_score,
        pattern_count,
        avg_score - LAG(avg_score) OVER (
          PARTITION BY pattern_type ORDER BY day
        ) as score_change
      FROM daily_patterns
      ORDER BY day DESC, pattern_type
    `;
    
    return await this.db.all(sql, { target: fileOrSymbol });
  }

  /**
   * Find pattern hotspots
   */
  async findHotspots(minPatterns: number = 5): Promise<any[]> {
    const sql = `
      SELECT 
        file_path,
        COUNT(DISTINCT pattern_type) as unique_patterns,
        COUNT(*) as total_patterns,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        STRING_AGG(DISTINCT category, ', ') as categories
      FROM read_parquet('${this.basePath}/harmonics/daily/*/*.parquet')
      GROUP BY file_path
      HAVING unique_patterns >= $minPatterns
      ORDER BY avg_score DESC
      LIMIT 20
    `;
    
    return await this.db.all(sql, { minPatterns });
  }

  /**
   * Get pattern distribution statistics
   */
  async getPatternStats(): Promise<any> {
    const sql = `
      SELECT 
        category,
        pattern_type,
        COUNT(*) as count,
        AVG(score) as avg_score,
        STDDEV(score) as stddev_score,
        MIN(score) as min_score,
        MAX(score) as max_score,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY score) as q1,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY score) as median,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY score) as q3,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY score) as p95
      FROM read_parquet('${this.basePath}/harmonics/daily/*/*.parquet')
      GROUP BY category, pattern_type
      ORDER BY count DESC
    `;
    
    return await this.db.all(sql);
  }

  /**
   * Compact old partitions for better performance
   */
  async compactPartitions(olderThanDays: number = 7): Promise<void> {
    console.log(`🗜️  Compacting partitions older than ${olderThanDays} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Find partitions to compact
    const partitionsPath = path.join(this.basePath, 'harmonics', 'daily');
    const dayDirs = await fs.readdir(partitionsPath);
    
    for (const dayDir of dayDirs) {
      const dayDate = new Date(dayDir);
      if (dayDate < cutoffDate) {
        await this.compactDayPartition(dayDir);
      }
    }
  }

  // Private methods

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      path.join(this.basePath, 'harmonics', 'daily'),
      path.join(this.basePath, 'harmonics', 'by_category'),
      path.join(this.basePath, 'harmonics', 'by_file'),
      path.join(this.basePath, 'metadata')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async createIndexes(): Promise<void> {
    // These would be materialized views in production
    await this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_category_score 
      ON patterns(category, score);
    `);
    
    await this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_file_pattern 
      ON patterns(file_path, pattern_type);
    `);
    
    await this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_timestamp 
      ON patterns(timestamp);
    `);
  }

  private partitionRecords(
    records: HarmonicPatternRecord[], 
    dayPartition: string
  ): Map<string, HarmonicPatternRecord[]> {
    const partitions = new Map<string, HarmonicPatternRecord[]>();
    
    for (const record of records) {
      const key = `${dayPartition}/${record.category}`;
      if (!partitions.has(key)) {
        partitions.set(key, []);
      }
      partitions.get(key)!.push(record);
    }
    
    return partitions;
  }

  private async writeParquetPartition(
    partitionKey: string, 
    records: HarmonicPatternRecord[]
  ): Promise<void> {
    const partitionPath = path.join(this.basePath, 'harmonics', 'daily', partitionKey);
    await fs.mkdir(partitionPath, { recursive: true });
    
    // Find next file number
    const existingFiles = await fs.readdir(partitionPath);
    const fileNumber = existingFiles.length + 1;
    const fileName = `patterns_${String(fileNumber).padStart(5, '0')}.parquet`;
    const filePath = path.join(partitionPath, fileName);
    
    // Define parquet schema
    const schema = new parquet.ParquetSchema({
      id: { type: 'UTF8' },
      timestamp: { type: 'TIMESTAMP_MILLIS' },
      file_path: { type: 'UTF8' },
      symbol_id: { type: 'UTF8' },
      symbol_name: { type: 'UTF8' },
      symbol_type: { type: 'UTF8' },
      line_start: { type: 'INT32' },
      line_end: { type: 'INT32' },
      pattern_type: { type: 'UTF8' },
      category: { type: 'UTF8' },
      score: { type: 'DOUBLE' },
      confidence: { type: 'DOUBLE' },
      evidence: { type: 'UTF8' },
      metrics: { type: 'UTF8' },
      related_patterns: { type: 'UTF8' },
      parent_pattern: { type: 'UTF8', optional: true },
      analysis_version: { type: 'UTF8' },
      codebase_hash: { type: 'UTF8' }
    });
    
    // Write parquet file
    const writer = await parquet.ParquetWriter.openFile(schema, filePath, {
      compression: 'SNAPPY',
      rowGroupSize: 10000
    });
    
    for (const record of records) {
      await writer.appendRow(record);
    }
    
    await writer.close();
  }

  private async updateMetadata(
    dayPartition: string, 
    recordCount: number,
    partitionCount: number
  ): Promise<void> {
    const metadataPath = path.join(this.basePath, 'metadata', `${dayPartition}.json`);
    
    let metadata = {
      date: dayPartition,
      totalRecords: 0,
      partitions: {} as Record<string, number>,
      lastUpdated: new Date().toISOString()
    };
    
    // Load existing metadata if exists
    try {
      const existing = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existing);
    } catch (e) {
      // File doesn't exist, use defaults
    }
    
    // Update metadata
    metadata.totalRecords += recordCount;
    metadata.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async compactDayPartition(dayDir: string): Promise<void> {
    const dayPath = path.join(this.basePath, 'harmonics', 'daily', dayDir);
    const files = await fs.readdir(dayPath);
    const parquetFiles = files.filter(f => f.endsWith('.parquet'));
    
    if (parquetFiles.length <= 1) return; // No need to compact
    
    console.log(`  Compacting ${parquetFiles.length} files for ${dayDir}`);
    
    // Read all files and merge
    const allRecords: HarmonicPatternRecord[] = [];
    for (const file of parquetFiles) {
      const filePath = path.join(dayPath, file);
      // In production, use streaming to handle large files
      const reader = await parquet.ParquetReader.openFile(filePath);
      const cursor = reader.getCursor();
      let record;
      while (record = await cursor.next()) {
        allRecords.push(record as HarmonicPatternRecord);
      }
      await reader.close();
    }
    
    // Write compacted file
    const compactedPath = path.join(dayPath, 'compacted_00001.parquet');
    const schema = new parquet.ParquetSchema({
      // Same schema as before
    });
    
    const writer = await parquet.ParquetWriter.openFile(schema, compactedPath, {
      compression: 'ZSTD', // Better compression for archived data
      rowGroupSize: 50000
    });
    
    for (const record of allRecords) {
      await writer.appendRow(record);
    }
    await writer.close();
    
    // Remove old files
    for (const file of parquetFiles) {
      await fs.unlink(path.join(dayPath, file));
    }
    
    console.log(`  ✅ Compacted ${allRecords.length} records`);
  }

  /**
   * Create a mock database object for when DuckDB fails to initialize
   */
  private createMockDatabase(): any {
    return {
      isMock: true,
      run: async (query: string) => {
        console.debug('Mock DB: run query', query.substring(0, 50) + '...');
        return { changes: 0 };
      },
      all: async (query: string) => {
        console.debug('Mock DB: all query', query.substring(0, 50) + '...');
        return [];
      },
      prepare: (query: string) => ({
        run: async (...params: any[]) => {
          console.debug('Mock DB: prepared run', params.length, 'params');
          return { changes: 0 };
        },
        all: async (...params: any[]) => {
          console.debug('Mock DB: prepared all', params.length, 'params');
          return [];
        }
      }),
      close: async () => {
        console.debug('Mock DB: close');
      }
    };
  }
}

// Export convenience function instead of singleton
export async function getHarmonicDataLake(basePath?: string): Promise<HarmonicDataLake> {
  const lake = new HarmonicDataLake(basePath);
  await lake.initialize();
  return lake;
}