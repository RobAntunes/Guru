/**
 * Unified Storage Manager using SurrealDB
 * Single embedded database for graph, document, and cache operations
 * Maintains compatibility with existing StorageManager interface
 */

import { SurrealDBAdapter } from './surrealdb-adapter.js';
import { DuckDBDataLake } from '../datalake/duckdb-data-lake.js';
import { HarmonicDuckLake } from '../datalake/harmonic-ducklake.js';
import { 
  SymbolNode, 
  SymbolRelationship,
  HarmonicPatternMemory,
  PatternCategory,
  LogicOperation
} from '../memory/types.js';
import { 
  StorageHealth,
  SymbolGraphQuery,
  SymbolGraphResult 
} from './storage-manager.js';

export class UnifiedStorageManager {
  public surrealdb: SurrealDBAdapter;
  private duckdb?: DuckDBDataLake;
  private harmonicDuckLake?: HarmonicDuckLake;
  private connected: boolean = false;
  
  // Compatibility properties
  public readonly qpfm: any; // Will be set by QPFM factory
  
  // Stats tracking
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    queries: 0
  };

  constructor() {
    this.surrealdb = new SurrealDBAdapter({ persistent: true });
    // DuckDB will be initialized lazily
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to unified storage...');
      
      // Connect to SurrealDB (handles graph, cache, and document storage)
      await this.surrealdb.connect();
      
      // Initialize DuckDB for analytics (already embedded)
      try {
        this.duckdb = new DuckDBDataLake();
        await this.duckdb.initialize();
        this.harmonicDuckLake = new HarmonicDuckLake();
        await this.harmonicDuckLake.initialize();
      } catch (error) {
        console.warn('DuckDB initialization failed, analytics features limited:', error);
      }
      
      this.connected = true;
      console.log('✅ Unified storage connected');
    } catch (error) {
      console.error('❌ Storage connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.surrealdb.disconnect();
      if (this.duckdb) {
        await this.duckdb.close();
      }
      this.connected = false;
      console.log('📴 Unified storage disconnected');
    }
  }

  // Symbol Operations (Graph)
  async createSymbol(symbol: SymbolNode): Promise<void> {
    await this.surrealdb.createSymbol(symbol);
    // Invalidate file cache
    await this.invalidateFileCache(symbol.location.file);
  }

  async createSymbolRelationship(relationship: SymbolRelationship): Promise<void> {
    await this.surrealdb.createSymbolRelationship(relationship);
  }

  async getSymbolsByFile(file: string): Promise<SymbolNode[]> {
    // Try cache first
    const cacheKey = `symbols:file:${file}`;
    const cached = await this.surrealdb.cacheGet(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    // Fetch from database
    this.stats.cacheMisses++;
    const symbols = await this.surrealdb.getSymbolsByFile(file);
    
    // Cache for 30 minutes
    await this.surrealdb.cacheSet(cacheKey, symbols, 1800);
    
    return symbols;
  }

  async getSymbolCallGraph(symbolId: string, depth: number = 2): Promise<any> {
    const cacheKey = `callgraph:${symbolId}:${depth}`;
    
    // Try cache first
    const cached = await this.surrealdb.cacheGet(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    // Fetch from database
    this.stats.cacheMisses++;
    const graph = await this.surrealdb.getSymbolCallGraph(symbolId, depth);
    
    // Cache for 30 minutes
    await this.surrealdb.cacheSet(cacheKey, graph, 1800);
    
    return graph;
  }

  // Pattern Operations
  async storePattern(pattern: HarmonicPatternMemory): Promise<void> {
    // Store in SurrealDB for graph relationships
    await this.surrealdb.createPattern(pattern);
    
    // Also store in DuckDB for time-series analytics
    if (this.duckdb) {
      await this.duckdb.batchInsertPatterns([pattern]);
    }
  }

  async storePatterns(patterns: HarmonicPatternMemory[]): Promise<void> {
    // Bulk store in both databases
    await Promise.all([
      // Store each pattern in SurrealDB (for graph)
      Promise.all(patterns.map(p => this.surrealdb.createPattern(p))),
      // Batch insert in DuckDB (for analytics)
      this.duckdb ? this.duckdb.batchInsertPatterns(patterns) : Promise.resolve()
    ]);
  }

  async queryPatterns(
    basePattern: string,
    operations: LogicOperation[],
    options: any = {}
  ): Promise<HarmonicPatternMemory[]> {
    this.stats.queries++;
    
    // For now, delegate to DuckDB for complex queries
    // In future, could implement in SurrealDB
    if (!this.duckdb) {
      return [];
    }
    return this.duckdb.queryTimeRange({
      startTime: new Date(Date.now() - 86400000), // Last 24 hours
      endTime: new Date(),
      categories: options.categories,
      limit: options.limit
    });
  }

  async findSimilarPatterns(patternId: string, minSimilarity: number = 0.7): Promise<any[]> {
    const cacheKey = `similar:${patternId}:${minSimilarity}`;
    const cached = await this.surrealdb.cacheGet(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    const similar = await this.surrealdb.findSimilarPatterns(patternId, minSimilarity);
    await this.surrealdb.cacheSet(cacheKey, similar, 3600);
    
    this.stats.cacheMisses++;
    return similar;
  }

  // Analytics Operations (delegated to DuckDB)
  async getPatternTrends(days: number = 30): Promise<any[]> {
    if (!this.duckdb) {
      return [];
    }
    return this.duckdb.getPatternEvolution('*', days);
  }

  async getPatternDistribution(): Promise<Record<PatternCategory, number>> {
    // Try SurrealDB first (faster for simple aggregations)
    return this.surrealdb.getPatternDistribution();
  }

  async getTopPatternsByStrength(limit: number = 10): Promise<HarmonicPatternMemory[]> {
    const patterns = await this.surrealdb.getPatternsByCategory(PatternCategory.STRUCTURAL);
    return patterns
      .sort((a, b) => b.harmonicProperties.strength - a.harmonicProperties.strength)
      .slice(0, limit);
  }

  async getComplexityHotspots(limit: number = 10): Promise<SymbolNode[]> {
    const cacheKey = `hotspots:${limit}`;
    const cached = await this.surrealdb.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const hotspots = await this.surrealdb.getComplexityHotspots(limit);
    await this.surrealdb.cacheSet(cacheKey, hotspots, 1800);
    return hotspots;
  }

  async getCentralSymbols(limit: number = 10): Promise<any[]> {
    // TODO: Implement graph centrality in SurrealDB
    return [];
  }

  async getFileModularityScore(file: string): Promise<number> {
    // TODO: Implement modularity calculation
    return 0.5;
  }

  // Advanced Symbol Graph Queries
  async getSymbolGraph(query: SymbolGraphQuery): Promise<SymbolGraphResult> {
    const result: SymbolGraphResult = {
      symbols: [],
      relationships: [],
      patterns: [],
      fromCache: false
    };

    if (query.file) {
      result.symbols = await this.getSymbolsByFile(query.file);
      result.fromCache = true; // Likely cached
    }

    if (query.symbolId && query.depth) {
      const callGraph = await this.getSymbolCallGraph(query.symbolId, query.depth);
      // Process call graph into result format
      if (callGraph.calls) {
        result.symbols.push(...callGraph.calls);
      }
    }

    return result;
  }

  // Cache Management
  async clearCache(type?: 'patterns' | 'symbols' | 'all'): Promise<void> {
    switch (type) {
      case 'patterns':
        await this.surrealdb.cacheInvalidatePattern('pattern:*');
        break;
      case 'symbols':
        await this.surrealdb.cacheInvalidatePattern('symbols:*');
        break;
      default:
        await this.surrealdb.cacheInvalidatePattern();
    }
  }

  async invalidateFileCache(file: string): Promise<void> {
    await this.surrealdb.cacheDelete(`symbols:file:${file}`);
  }

  async getCacheStats(): Promise<any> {
    const stats = await this.surrealdb.getStats();
    return {
      ...this.stats,
      totalCached: stats.cache,
      hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
    };
  }

  // Health Monitoring
  async healthCheck(): Promise<StorageHealth> {
    const [surrealHealth, duckdbHealth] = await Promise.all([
      this.surrealdb.healthCheck(),
      this.duckdb ? this.duckdb.healthCheck().catch(() => ({ status: 'error', patternCount: 0 })) : Promise.resolve({ status: 'disabled', patternCount: 0 })
    ]);

    const surrealStats = surrealHealth.info || {};
    
    // Map to expected format
    const neo4jHealth = {
      status: surrealHealth.status,
      nodeCount: surrealStats.symbols || 0,
      relationshipCount: 0 // Would need to count relationships
    };

    const redisHealth = {
      status: surrealHealth.status,
      latency: 1 // Mock latency
    };

    const analyticsHealth = {
      status: duckdbHealth.status,
      patternCount: surrealStats.patterns || 0,
      fileCount: surrealStats.files || 0
    };

    const dpcmHealth = {
      status: 'healthy',
      patternCount: surrealStats.patterns || 0
    };

    const healthyCount = [neo4jHealth, redisHealth, analyticsHealth, dpcmHealth]
      .filter(h => h.status === 'healthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === 4) {
      overall = 'healthy';
    } else if (healthyCount >= 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      neo4j: neo4jHealth,
      redis: redisHealth,
      analytics: analyticsHealth,
      dpcm: dpcmHealth,
      overall
    };
  }

  async getStorageStats(): Promise<any> {
    const [surrealStats, cacheStats] = await Promise.all([
      this.surrealdb.getStats(),
      this.getCacheStats()
    ]);

    return {
      database: surrealStats,
      cache: cacheStats,
      analytics: {
        provider: 'DuckDB',
        embedded: true
      }
    };
  }

  // Utility Methods
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Initialize storage manager (alias for connect)
   */
  async initialize(): Promise<void> {
    return this.connect();
  }

  /**
   * Close storage manager (alias for disconnect)
   */
  async close(): Promise<void> {
    return this.disconnect();
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData(): Promise<void> {
    await this.surrealdb.clearAllData();
    // Note: DuckDB data clearing would need to be implemented
  }

  /**
   * Get storage optimization recommendations
   */
  async getStorageOptimizationRecommendations(): Promise<{
    recommendations: string[];
    qualityDistribution: {
      premium: number;
      standard: number; 
      archive: number;
    };
    storageEfficiency: number;
  }> {
    const stats = await this.surrealdb.getStats();
    const totalPatterns = stats.patterns || 0;
    
    const recommendations: string[] = [];
    
    if (stats.cache > 10000) {
      recommendations.push('Consider implementing cache eviction policy');
    }
    
    if (stats.symbols > 100000) {
      recommendations.push('Consider archiving old symbol data');
    }
    
    const qualityDistribution = {
      premium: Math.round(totalPatterns * 0.15),
      standard: Math.round(totalPatterns * 0.35),
      archive: Math.round(totalPatterns * 0.50)
    };
    
    const storageEfficiency = 0.85; // Mock value
    
    return {
      recommendations,
      qualityDistribution,
      storageEfficiency
    };
  }

  // DuckDB delegation methods for analytics
  async storePatternBatch(patterns: any[], metadata: any): Promise<void> {
    if (!this.harmonicDuckLake) {
      return;
    }
    await this.harmonicDuckLake.storePatternBatch(patterns, metadata);
  }

  async queryDuckLakePatterns(query: any): Promise<any[]> {
    if (!this.harmonicDuckLake) {
      return [];
    }
    return this.harmonicDuckLake.queryPatterns(query);
  }

  async getPatternEvolution(fileOrSymbol: string, days: number = 30): Promise<any[]> {
    if (!this.harmonicDuckLake) {
      return [];
    }
    return this.harmonicDuckLake.getPatternEvolution(fileOrSymbol, days);
  }

  async findHotspots(minPatterns: number = 5): Promise<any[]> {
    if (!this.harmonicDuckLake) {
      return [];
    }
    return this.harmonicDuckLake.findHotspots(minPatterns);
  }

  async getPatternStats(): Promise<any> {
    if (!this.harmonicDuckLake) {
      return { totalPatterns: 0, categories: {}, avgScore: 0 };
    }
    return this.harmonicDuckLake.getPatternStats();
  }
}