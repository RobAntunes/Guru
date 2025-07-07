import { Neo4jRelationshipStore, SymbolNode, SymbolRelationship } from './neo4j-relationship-store.js';
import { RedisCache } from './redis-cache.js';
import { AnalyticsStore } from './analytics-store.js';
import { DPCMPatternStore } from './dpcm-pattern-store.js';
import { PatternQualityManager } from './pattern-quality-manager.js';
import { AdaptiveCacheWarmer } from '../optimization/adaptive-cache-warmer.js';
import { StorageTierMigrator } from '../optimization/storage-tier-migrator.js';
import { QueryResultMaterializer } from '../optimization/query-result-materializer.js';
import { HarmonicPatternMemory, PatternCategory, LogicOperation } from '../memory/types.js';

export interface StorageHealth {
  neo4j: { status: string; nodeCount: number; relationshipCount: number };
  redis: { status: string; latency: number };
  analytics: { status: string; patternCount: number; fileCount: number };
  dpcm: { status: string; patternCount: number };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export interface SymbolGraphQuery {
  symbolId?: string;
  file?: string;
  pattern?: string;
  depth?: number;
  includePatterns?: boolean;
  includeMetrics?: boolean;
}

export interface SymbolGraphResult {
  symbols: SymbolNode[];
  relationships: SymbolRelationship[];
  patterns: HarmonicPatternMemory[];
  metrics?: any;
  fromCache?: boolean;
}

export class StorageManager {
  public readonly neo4j: Neo4jRelationshipStore;
  public readonly cache: RedisCache;
  public readonly analytics: AnalyticsStore;
  public readonly dpcm: DPCMPatternStore;
  public readonly qpfm: any; // Will be set by QPFM factory
  private qualityManager: PatternQualityManager;
  private cacheWarmer: AdaptiveCacheWarmer;
  private tierMigrator: StorageTierMigrator;
  private queryMaterializer: QueryResultMaterializer;
  private connected: boolean = false;

  constructor() {
    this.neo4j = new Neo4jRelationshipStore();
    this.cache = new RedisCache();
    this.analytics = new AnalyticsStore();
    this.dpcm = new DPCMPatternStore();
    this.qualityManager = new PatternQualityManager(this);
    this.cacheWarmer = new AdaptiveCacheWarmer(this, this.cache);
    this.tierMigrator = new StorageTierMigrator(this);
    this.queryMaterializer = new QueryResultMaterializer(this, this.cache);
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to storage layers...');
      
      // Connect to all storage layers
      await Promise.all([
        this.neo4j.connect(),
        this.cache.connect(),
        this.analytics.connect()
        // DPCM doesn't need connection (in-memory)
      ]);

      this.connected = true;
      console.log('✅ All storage layers connected successfully');
      
      // Start adaptive cache warming
      this.cacheWarmer.start();
      console.log('🔥 Adaptive cache warming started');
      
      // Start storage tier migration
      this.tierMigrator.start();
      console.log('📦 Storage tier migration started');
      
      // Start query result materialization
      await this.queryMaterializer.start();
      console.log('📊 Query result materialization started');
    } catch (error) {
      console.error('❌ Storage connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      // Stop optimizations
      this.cacheWarmer.stop();
      this.tierMigrator.stop();
      this.queryMaterializer.stop();
      
      await Promise.all([
        this.neo4j.disconnect(),
        this.cache.disconnect(),
        this.analytics.disconnect()
      ]);
      this.connected = false;
      console.log('📴 Storage layers disconnected');
    }
  }

  // Symbol operations with caching
  async createSymbol(symbol: SymbolNode): Promise<void> {
    await this.neo4j.createSymbol(symbol);
    // Invalidate file cache
    await this.cache.invalidateFileCache(symbol.file);
  }

  async createSymbolRelationship(relationship: SymbolRelationship): Promise<void> {
    await this.neo4j.createSymbolRelationship(relationship);
  }

  async getSymbolsByFile(file: string): Promise<SymbolNode[]> {
    // Try cache first
    const cached = await this.cache.getFileSymbols(file);
    if (cached) {
      return cached;
    }

    // Fetch from Neo4j and cache
    const symbols = await this.neo4j.getSymbolsByFile(file);
    await this.cache.cacheFileSymbols(file, symbols);
    return symbols;
  }

  async getSymbolCallGraph(symbolId: string, depth: number = 2): Promise<any> {
    const cacheKey = `callgraph:${symbolId}:${depth}`;
    
    // Try cache first (for call graphs we use DPCM query cache)
    const cached = await this.cache.getDPCMQuery(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from Neo4j and cache
    const graph = await this.neo4j.getSymbolCallGraph(symbolId, depth);
    await this.cache.cacheDPCMQuery(cacheKey, graph, 1800); // 30 min TTL
    return graph;
  }

  // Pattern operations with quality-based routing
  async storePattern(pattern: HarmonicPatternMemory): Promise<void> {
    // Use quality manager to route to appropriate storage
    await this.qualityManager.routePattern(pattern);
  }

  async storePatterns(patterns: HarmonicPatternMemory[]): Promise<void> {
    // Use quality manager for bulk routing
    await this.qualityManager.bulkRoutePatterns(patterns);
  }
  
  /**
   * Store pattern in all layers (legacy method for compatibility)
   */
  async storePatternEverywhere(pattern: HarmonicPatternMemory): Promise<void> {
    // Store in all layers
    await Promise.all([
      this.dpcm.store(pattern),           // DPCM coordinates
      this.neo4j.createPattern(pattern),  // Graph relationships
      this.analytics.storePattern(pattern), // Analytics
      this.cache.cachePattern(pattern)    // Cache
    ]);
  }

  async queryPatterns(
    basePattern: string,
    operations: LogicOperation[],
    options: any = {}
  ): Promise<HarmonicPatternMemory[]> {
    const startTime = Date.now();
    
    // Use DPCM for coordinate-based search
    const results = await this.dpcm.query(basePattern, operations, options);
    
    // Record access patterns for cache warming
    const latency = Date.now() - startTime;
    results.forEach(pattern => {
      this.cacheWarmer.recordAccess(pattern.id, latency);
    });
    
    return results;
  }

  async findSimilarPatterns(patternId: string, minSimilarity: number = 0.7): Promise<any[]> {
    const startTime = Date.now();
    
    // Try cache first
    const cacheKey = `similar:${patternId}:${minSimilarity}`;
    const cached = await this.cache.getDPCMQuery(cacheKey);
    if (cached) {
      // Record cache hit with low latency
      this.cacheWarmer.recordAccess(patternId, Date.now() - startTime);
      return cached;
    }

    // Query Neo4j for graph-based similarity
    const similar = await this.neo4j.findSimilarPatterns(patternId, minSimilarity);
    await this.cache.cacheDPCMQuery(cacheKey, similar, 3600); // 1 hour TTL
    
    // Record access pattern
    const latency = Date.now() - startTime;
    this.cacheWarmer.recordAccess(patternId, latency);
    
    return similar;
  }

  // Advanced symbol graph queries
  async getSymbolGraph(query: SymbolGraphQuery): Promise<SymbolGraphResult> {
    const result: SymbolGraphResult = {
      symbols: [],
      relationships: [],
      patterns: [],
      fromCache: false
    };

    if (query.file) {
      result.symbols = await this.getSymbolsByFile(query.file);
    }

    if (query.symbolId && query.includePatterns) {
      // Get patterns associated with symbol
      const analysis = await this.neo4j.getSymbolPatternAnalysis(query.symbolId);
      if (query.includeMetrics) {
        result.metrics = analysis;
      }
    }

    if (query.symbolId && query.depth) {
      const callGraph = await this.getSymbolCallGraph(query.symbolId, query.depth);
      // Process call graph into relationships
      // (implementation depends on call graph structure)
    }

    return result;
  }

  // Analytics and insights
  async getComplexityHotspots(limit: number = 10): Promise<SymbolNode[]> {
    const cacheKey = `hotspots:${limit}`;
    const cached = await this.cache.getDPCMQuery(cacheKey);
    if (cached) {
      return cached;
    }

    const hotspots = await this.neo4j.getComplexityHotspots(limit);
    await this.cache.cacheDPCMQuery(cacheKey, hotspots, 1800);
    return hotspots;
  }

  async getCentralSymbols(limit: number = 10): Promise<any[]> {
    const cacheKey = `central:${limit}`;
    const cached = await this.cache.getDPCMQuery(cacheKey);
    if (cached) {
      return cached;
    }

    const central = await this.neo4j.getCentralSymbols(limit);
    await this.cache.cacheDPCMQuery(cacheKey, central, 1800);
    return central;
  }

  async getFileModularityScore(file: string): Promise<number> {
    const cacheKey = `modularity:${Buffer.from(file).toString('base64')}`;
    const cached = await this.cache.getDPCMQuery(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    const score = await this.neo4j.getFileModularityScore(file);
    await this.cache.cacheDPCMQuery(cacheKey, [score], 3600);
    return score;
  }

  // Analytics aggregations with materialization
  async getPatternTrends(days: number = 30): Promise<any[]> {
    const startTime = Date.now();
    
    // Check for materialized result
    const query = `pattern_evolution_${days}d`;
    const materialized = await this.queryMaterializer.getMaterializedResult(query, { days });
    if (materialized) {
      return materialized.result;
    }
    
    // Execute query normally
    const result = await this.analytics.getPatternTrends(days);
    
    // Record execution for potential materialization
    const executionTime = Date.now() - startTime;
    this.queryMaterializer.recordQueryExecution(query, { days }, executionTime);
    
    return result;
  }

  async getPatternDistribution(): Promise<Record<PatternCategory, number>> {
    const startTime = Date.now();
    
    // Check for materialized result
    const query = 'pattern_distribution';
    const materialized = await this.queryMaterializer.getMaterializedResult(query, {});
    if (materialized) {
      return materialized.result;
    }
    
    // Execute query normally
    const result = await this.analytics.getPatternDistribution();
    
    // Record execution
    const executionTime = Date.now() - startTime;
    this.queryMaterializer.recordQueryExecution(query, {}, executionTime);
    
    return result;
  }

  async getTopPatternsByStrength(limit: number = 10): Promise<HarmonicPatternMemory[]> {
    const startTime = Date.now();
    
    // Check for materialized result
    const query = 'top_patterns_by_strength';
    const materialized = await this.queryMaterializer.getMaterializedResult(query, { limit });
    if (materialized) {
      return materialized.result;
    }
    
    // Execute query normally
    const result = await this.analytics.getTopPatternsByStrength(limit);
    
    // Record execution
    const executionTime = Date.now() - startTime;
    this.queryMaterializer.recordQueryExecution(query, { limit }, executionTime);
    
    return result;
  }

  // Cache management
  async clearCache(type?: 'patterns' | 'symbols' | 'all'): Promise<void> {
    switch (type) {
      case 'patterns':
        await this.cache.invalidatePatternCache();
        break;
      case 'symbols':
        await this.cache.invalidateFileCache();
        break;
      default:
        await Promise.all([
          this.cache.invalidatePatternCache(),
          this.cache.invalidateFileCache()
        ]);
    }
  }

  async getCacheStats(): Promise<any> {
    return this.cache.getStats();
  }

  // Health monitoring
  async healthCheck(): Promise<StorageHealth> {
    const [neo4jHealth, redisHealth, analyticsHealth, dpcmHealth] = await Promise.all([
      this.neo4j.healthCheck().catch(() => ({ status: 'error', nodeCount: 0, relationshipCount: 0 })),
      this.cache.healthCheck().catch(() => ({ status: 'error', latency: -1 })),
      this.analytics.healthCheck().catch(() => ({ status: 'error', patternCount: 0, fileCount: 0 })),
      Promise.resolve({ status: 'healthy', patternCount: this.dpcm.getPatternCount() })
    ]);

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

  // Utility methods
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get quality manager for external access
   */
  getQualityManager(): PatternQualityManager {
    return this.qualityManager;
  }

  /**
   * Get cache warmer for external access
   */
  getCacheWarmer(): AdaptiveCacheWarmer {
    return this.cacheWarmer;
  }

  /**
   * Get tier migrator for external access
   */
  getTierMigrator(): StorageTierMigrator {
    return this.tierMigrator;
  }

  /**
   * Get query materializer for external access
   */
  getQueryMaterializer(): QueryResultMaterializer {
    return this.queryMaterializer;
  }

  /**
   * Get storage optimization recommendations based on quality distribution
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
    const recommendations = await this.qualityManager.getStorageRecommendations();
    
    // Get current pattern distribution
    const [dpcmCount, analyticsCount] = await Promise.all([
      Promise.resolve(this.dpcm.getPatternCount()),
      this.analytics.getStats().then(s => s.patternCount)
    ]);
    
    const totalPatterns = dpcmCount + analyticsCount;
    
    // Estimate quality distribution (would be more accurate with actual metrics)
    const qualityDistribution = {
      premium: Math.round(totalPatterns * 0.15), // Top 15%
      standard: Math.round(totalPatterns * 0.35), // Middle 35%
      archive: Math.round(totalPatterns * 0.50)   // Bottom 50%
    };
    
    // Calculate storage efficiency (0-1, higher is better)
    const storageEfficiency = totalPatterns > 0 
      ? Math.min(1, 1 - (dpcmCount / totalPatterns) * 0.3) // Penalize if too many in DPCM
      : 0;
    
    return {
      recommendations,
      qualityDistribution,
      storageEfficiency
    };
  }

  async getStorageStats(): Promise<any> {
    const [cacheStats, analyticsStats] = await Promise.all([
      this.cache.getStats(),
      this.analytics.getStats()
    ]);

    return {
      cache: cacheStats,
      analytics: analyticsStats,
      dpcm: {
        patternCount: this.dpcm.getPatternCount()
      }
    };
  }
}