/**
 * Pattern Store Reconciler
 * Coordinates data flow between DuckLake, Neo4j, and QPFM
 */

import { DuckDBDataLake } from '../datalake/duckdb-data-lake.js';
import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system.js';
import { StorageManager } from '../storage/storage-manager.js';
import { Logger } from '../logging/logger.js';
import { EventEmitter } from 'events';

export interface ReconciliationConfig {
  batchSize: number;
  qpfmScoreThreshold: number;
  neo4jBatchSize: number;
  parallelWorkers: number;
}

export interface ReconciliationStats {
  totalPatterns: number;
  duckLakeStored: number;
  storageRelationships: number;
  qpfmPatterns: number;
  errors: number;
  duration: number;
}

export class PatternStoreReconciler extends EventEmitter {
  private logger = Logger.getInstance();
  private config: ReconciliationConfig;
  
  constructor(
    private duckLake: DuckDBDataLake,
    private storage: UnifiedStorageManager,
    private qpfm: QuantumProbabilityFieldMemory,
    config?: Partial<ReconciliationConfig>
  ) {
    super();
    this.config = {
      batchSize: 1000,
      qpfmScoreThreshold: 0.8,
      neo4jBatchSize: 500,
      parallelWorkers: 4,
      ...config
    };
  }

  /**
   * Process patterns from analysis and distribute to all stores
   */
  async processAnalysisStream(
    patterns: AsyncIterable<any>,
    metadata: {
      analysisId: string;
      codebaseHash: string;
      version: string;
    }
  ): Promise<ReconciliationStats> {
    const stats: ReconciliationStats = {
      totalPatterns: 0,
      duckLakeStored: 0,
      storageRelationships: 0,
      qpfmPatterns: 0,
      errors: 0,
      duration: 0
    };

    const startTime = Date.now();
    const batches = {
      duckLake: [] as any[],
      storage: [] as any[],
      qpfm: [] as any[]
    };

    console.log('🔄 Starting pattern reconciliation...');
    this.emit('reconciliation:start', metadata);

    try {
      for await (const pattern of patterns) {
        stats.totalPatterns++;

        // Add to appropriate batches
        batches.duckLake.push(pattern);
        batches.storage.push(pattern);
        
        if (pattern.score >= this.config.qpfmScoreThreshold) {
          batches.qpfm.push(pattern);
        }

        // Process batches when full
        if (batches.duckLake.length >= this.config.batchSize) {
          await this.processBatches(batches, metadata, stats);
        }

        // Emit progress
        if (stats.totalPatterns % 10000 === 0) {
          this.emit('reconciliation:progress', {
            processed: stats.totalPatterns,
            stats
          });
          console.log(`   Processed ${stats.totalPatterns.toLocaleString()} patterns...`);
        }
      }

      // Process remaining patterns
      if (batches.duckLake.length > 0) {
        await this.processBatches(batches, metadata, stats);
      }

      // Create snapshot in DuckLake
      await this.duckLake.createSnapshot(
        `analysis_${metadata.analysisId}`,
        `Analysis version ${metadata.version} of codebase ${metadata.codebaseHash}`
      );

      stats.duration = Date.now() - startTime;
      
      console.log('\n✅ Reconciliation complete:');
      console.log(`   Total patterns: ${stats.totalPatterns.toLocaleString()}`);
      console.log(`   DuckLake: ${stats.duckLakeStored.toLocaleString()}`);
      console.log(`   Storage relationships: ${stats.storageRelationships.toLocaleString()}`);
      console.log(`   QPFM patterns: ${stats.qpfmPatterns.toLocaleString()}`);
      console.log(`   Errors: ${stats.errors}`);
      console.log(`   Duration: ${(stats.duration / 1000).toFixed(2)}s`);
      console.log(`   Rate: ${(stats.totalPatterns / (stats.duration / 1000)).toFixed(0)} patterns/sec`);

      this.emit('reconciliation:complete', stats);
      return stats;

    } catch (error) {
      this.logger.error('Reconciliation failed:', error);
      this.emit('reconciliation:error', error);
      throw error;
    }
  }

  /**
   * Process batches to all stores in parallel
   */
  private async processBatches(
    batches: {
      duckLake: any[];
      storage: any[];
      qpfm: any[];
    },
    metadata: any,
    stats: ReconciliationStats
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Store in DuckLake
    if (batches.duckLake.length > 0) {
      promises.push(
        this.storeToDuckLake(batches.duckLake, metadata, stats)
          .catch(err => {
            this.logger.error('DuckLake storage error:', err);
            stats.errors += batches.duckLake.length;
          })
      );
    }

    // Create storage relationships
    if (batches.storage.length > 0) {
      promises.push(
        this.storeToStorage(batches.storage, stats)
          .catch(err => {
            this.logger.error('Storage error:', err);
            stats.errors += batches.storage.length;
          })
      );
    }

    // Store in QPFM
    if (batches.qpfm.length > 0) {
      promises.push(
        this.storeToQPFM(batches.qpfm, stats)
          .catch(err => {
            this.logger.error('QPFM storage error:', err);
            stats.errors += batches.qpfm.length;
          })
      );
    }

    await Promise.all(promises);

    // Clear batches
    batches.duckLake.length = 0;
    batches.storage.length = 0;
    batches.qpfm.length = 0;
  }

  /**
   * Store patterns in DuckLake
   */
  private async storeToDuckLake(
    patterns: any[],
    metadata: any,
    stats: ReconciliationStats
  ): Promise<void> {
    await this.duckLake.storePatternBatch(patterns, metadata);
    stats.duckLakeStored += patterns.length;
  }

  /**
   * Create pattern-symbol relationships in storage
   */
  private async storeToStorage(
    patterns: any[],
    stats: ReconciliationStats
  ): Promise<void> {
    // Group patterns by symbol for efficient relationship creation
    const patternsBySymbol = new Map<string, any[]>();
    
    for (const pattern of patterns) {
      const symbolId = pattern.symbol;
      if (!patternsBySymbol.has(symbolId)) {
        patternsBySymbol.set(symbolId, []);
      }
      patternsBySymbol.get(symbolId)!.push(pattern);
    }

    // Create relationships in batches
    const db = this.storage.getDatabase();
    for (const [symbolId, symbolPatterns] of patternsBySymbol) {
      try {
        // Create pattern nodes and relationships
        for (const pattern of symbolPatterns) {
          await db.query(`
            LET $pattern = CREATE pattern SET 
              id = $patternId,
              type = $patternType,
              category = $category,
              score = $score;
            RELATE symbol:⟨$symbolId⟩->exhibits->$pattern;
          `, {
            symbolId,
            patternId: `${symbolId}_${pattern.pattern}`,
            patternType: pattern.pattern,
            category: pattern.category,
            score: pattern.score
          });
          stats.storageRelationships++;
        }
      } catch (error) {
        // Continue processing even if storage fails
        this.logger.warn(`Failed to link patterns to ${symbolId} in storage:`, error);
      }
    }
  }

  /**
   * Store high-value patterns in QPFM
   */
  private async storeToQPFM(
    patterns: any[],
    stats: ReconciliationStats
  ): Promise<void> {
    for (const pattern of patterns) {
      // Convert pattern to HarmonicPatternMemory format expected by QPFM
      const harmonicPattern = {
        id: `${pattern.symbol}_${pattern.pattern}`,
        coordinates: this.patternToCoordinates(pattern),
        content: {
          title: `${pattern.pattern} in ${pattern.symbol}`,
          description: `Pattern ${pattern.pattern} detected in ${pattern.symbol}`,
          type: pattern.pattern,
          tags: [pattern.category, pattern.pattern],
          data: pattern
        },
        accessCount: 0,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
        relevanceScore: pattern.score,
        harmonicProperties: {
          category: pattern.category,
          strength: pattern.score,
          occurrences: 1,
          confidence: pattern.confidence,
          complexity: pattern.metrics?.complexity || 5
        },
        locations: [{
          file: pattern.location.file,
          startLine: pattern.location.line,
          endLine: pattern.location.line,
          startColumn: 0,
          endColumn: 0
        }],
        evidence: [pattern.evidence],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      };

      await this.qpfm.store(harmonicPattern);
      stats.qpfmPatterns++;
    }
  }

  /**
   * Convert pattern to QPFM coordinate space
   */
  private patternToCoordinates(pattern: any): number[] {
    // Use pattern characteristics as coordinates
    // This is a simplified version - in practice, use embeddings
    return [
      pattern.score || 0,
      pattern.confidence || 0,
      this.categoryToNumeric(pattern.category),
      this.patternTypeToNumeric(pattern.pattern),
      Math.log1p(pattern.complexity || 1) / 10,
      pattern.evidence?.metrics?.entropy || 0
    ];
  }

  private categoryToNumeric(category: string): number {
    const categories: Record<string, number> = {
      'QUANTUM': 0.9,
      'GEOMETRIC': 0.8,
      'ARCHITECTURAL': 0.7,
      'TOPOLOGICAL': 0.6,
      'WAVE': 0.5,
      'INFORMATION': 0.4,
      'FRACTAL': 0.3,
      'CLASSICAL': 0.2
    };
    return categories[category] || 0.1;
  }

  private patternTypeToNumeric(type: string): number {
    // Hash pattern type to 0-1 range
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = ((hash << 5) - hash) + type.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100) / 100;
  }

  /**
   * Perform lazy reconciliation from DuckLake to other stores
   */
  async lazyReconcile(
    analysisId: string,
    options?: {
      minScore?: number;
      categories?: string[];
      limit?: number;
    }
  ): Promise<ReconciliationStats> {
    console.log('🔄 Starting lazy reconciliation from DuckLake...');
    
    const stats: ReconciliationStats = {
      totalPatterns: 0,
      duckLakeStored: 0,
      storageRelationships: 0,
      qpfmPatterns: 0,
      errors: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Query patterns from DuckLake
    const patterns = await this.duckLake.queryPatterns({
      minScore: options?.minScore || 0.7,
      categories: options?.categories,
      limit: options?.limit
    });

    stats.totalPatterns = patterns.length;
    stats.duckLakeStored = patterns.length; // Already in DuckLake

    // Process in batches
    const batches = this.chunkArray(patterns, this.config.batchSize);
    
    for (const batch of batches) {
      // Create Neo4j relationships
      const neo4jPatterns = batch.map(p => ({
        symbol: p.symbol_id,
        pattern: p.pattern_type,
        category: p.category,
        score: p.score,
        location: {
          file: p.file_path,
          line: p.line_start
        }
      }));
      
      await this.storeToStorage(neo4jPatterns, stats);

      // Store high-value patterns in QPFM
      const qpfmPatterns = batch
        .filter(p => p.score >= this.config.qpfmScoreThreshold)
        .map(p => ({
          symbol: p.symbol_id,
          pattern: p.pattern_type,
          category: p.category,
          score: p.score,
          confidence: p.confidence,
          complexity: 10, // Default if not available
          evidence: JSON.parse(p.evidence || '{}')
        }));
      
      if (qpfmPatterns.length > 0) {
        await this.storeToQPFM(qpfmPatterns, stats);
      }
    }

    stats.duration = Date.now() - startTime;
    
    console.log('✅ Lazy reconciliation complete');
    return stats;
  }

  /**
   * Verify consistency across stores
   */
  async verifyConsistency(sampleSize: number = 100): Promise<{
    consistent: boolean;
    issues: string[];
  }> {
    console.log('🔍 Verifying cross-store consistency...');
    
    const issues: string[] = [];
    
    // Sample patterns from DuckLake
    const duckLakePatterns = await this.duckLake.queryPatterns({
      limit: sampleSize
    });

    const db = this.storage.getDatabase();
    
    for (const pattern of duckLakePatterns) {
      // Check if exists in storage
      const result = await db.query(`
        SELECT * FROM pattern 
        WHERE id = $patternId
      `, {
        patternId: `${pattern.symbol_id}_${pattern.pattern_type}`
      });
      
      const storageExists = result[0]?.result?.length > 0;
      
      if (!storageExists) {
        issues.push(`Pattern ${pattern.id} missing from storage`);
      }

      // Check QPFM for high-score patterns
      if (pattern.score >= this.config.qpfmScoreThreshold) {
        const qpfmResult = await this.qpfm.retrieve(pattern.id);
        if (!qpfmResult) {
          issues.push(`High-score pattern ${pattern.id} missing from QPFM`);
        }
      }
    }

    const consistent = issues.length === 0;
    
    console.log(consistent ? '✅ All stores consistent' : `❌ Found ${issues.length} inconsistencies`);
    
    return { consistent, issues };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Factory function
export async function createPatternReconciler(
  storageManager: StorageManager,
  duckLake: DuckDBDataLake,
  config?: Partial<ReconciliationConfig>
): Promise<PatternStoreReconciler> {
  const storage = storageManager.storage;
  const qpfm = new QuantumProbabilityFieldMemory(undefined, storageManager);
  
  return new PatternStoreReconciler(duckLake, storage, qpfm, config);
}