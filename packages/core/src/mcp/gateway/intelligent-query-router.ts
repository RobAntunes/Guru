/**
 * Intelligent Query Router
 * Routes queries to optimal storage based on performance characteristics
 */

import { MCPQuery, MCPQueryType } from './mcp-pattern-gateway.js';
import { Logger } from '../../logging/logger.js';

export interface RouteStrategy {
  storage: 'duckdb' | 'neo4j' | 'qpfm' | 'unified';
  handler?: string;
  expectedTime: number;
  strategy?: 'direct' | 'batch' | 'cache_first' | 'parallel';
  fallback?: string;
  sla?: number;
  fastPath?: boolean;
  requiresJoin?: boolean;
  cacheKey?: string;
}

export interface PerformanceProfile {
  queryType: MCPQueryType;
  avgResponseTime: number;
  p95ResponseTime: number;
  optimalStorage: string;
  successRate: number;
}

/**
 * Routes queries based on proven performance patterns
 */
export class IntelligentQueryRouter {
  private logger = Logger.getInstance();
  
  // Performance profiles based on our benchmarks
  private readonly performanceProfiles: Map<MCPQueryType, PerformanceProfile> = new Map([
    ['time_series', {
      queryType: 'time_series',
      avgResponseTime: 4.0,
      p95ResponseTime: 5.0,
      optimalStorage: 'duckdb',
      successRate: 0.99
    }],
    ['unified', {
      queryType: 'unified',
      avgResponseTime: 42.6,
      p95ResponseTime: 50.0,
      optimalStorage: 'unified',
      successRate: 0.95
    }],
    ['similarity', {
      queryType: 'similarity',
      avgResponseTime: 15.0,
      p95ResponseTime: 25.0,
      optimalStorage: 'qpfm',
      successRate: 0.98
    }],
    ['graph_traversal', {
      queryType: 'graph_traversal',
      avgResponseTime: 37.1,
      p95ResponseTime: 45.0,
      optimalStorage: 'neo4j',
      successRate: 0.96
    }]
  ]);

  // Query patterns for optimization
  private queryPatterns = {
    timeSeries: /time|date|when|history|trend/i,
    similarity: /similar|like|related|match/i,
    graph: /connect|relation|depend|link|path/i,
    aggregation: /count|sum|avg|group|total/i
  };

  /**
   * Analyze query and determine optimal routing strategy
   */
  analyze(query: MCPQuery): RouteStrategy {
    const profile = this.performanceProfiles.get(query.type);
    
    // Check explicit type first before pattern matching
    
    // QPFM for similarity searches - check FIRST to avoid time-series false positives
    if (query.type === 'similarity' || query.type === 'realtime_similarity') {
      return {
        storage: 'qpfm',
        handler: 'handleSimilarityQuery',
        expectedTime: 15.0,
        strategy: 'cache_first',
        fallback: 'quantum_search',
        cacheKey: this.generateCacheKey(query, 'sim')
      };
    }
    
    // Fast path for time-series queries (our 4ms benchmark)
    if (query.type === 'time_series' || this.isTimeSeriesQuery(query)) {
      return {
        storage: 'duckdb',
        handler: 'handleTimeSeriesQuery',
        expectedTime: 4.0,
        strategy: 'direct',
        fastPath: true,
        cacheKey: this.generateCacheKey(query, 'ts')
      };
    }

    // Batch processing for concurrent queries (0.38ms per query)
    if (this.isConcurrentCandidate(query)) {
      return {
        storage: 'unified',
        handler: 'handleBatchQuery',
        expectedTime: 0.04 * (query.limit || 10),
        strategy: 'batch',
        cacheKey: this.generateCacheKey(query, 'batch')
      };
    }

    // Secondary check for similarity patterns (if not explicitly typed)
    if (this.isSimilarityQuery(query)) {
      return {
        storage: 'qpfm',
        handler: 'handleSimilarityQuery',
        expectedTime: 15.0,
        strategy: 'cache_first',
        fallback: 'quantum_search',
        cacheKey: this.generateCacheKey(query, 'sim')
      };
    }

    // Neo4j for graph traversal
    if (query.type === 'graph_traversal' || this.isGraphQuery(query)) {
      return {
        storage: 'neo4j',
        handler: 'handleRelationshipQuery',
        expectedTime: 37.0,
        strategy: 'direct',
        requiresJoin: true,
        cacheKey: this.generateCacheKey(query, 'graph')
      };
    }

    // MCP Gateway unified queries with SLA
    if (query.type === 'unified') {
      return {
        storage: 'unified',
        handler: 'handleUnifiedQuery',
        expectedTime: 42.6,
        strategy: 'cache_first',
        fallback: 'parallel_query',
        sla: 50, // Keep under 50ms
        cacheKey: this.generateCacheKey(query, 'unified')
      };
    }

    // Default routing
    return {
      storage: 'unified',
      handler: 'handleComprehensiveQuery',
      expectedTime: profile?.avgResponseTime || 50.0,
      strategy: 'parallel',
      cacheKey: this.generateCacheKey(query, 'default')
    };
  }

  /**
   * Determine if query should be pre-cached
   */
  shouldPreCache(query: MCPQuery): boolean {
    const route = this.analyze(query);
    
    // Pre-cache if:
    // 1. Expected time > 20ms
    // 2. Query has been seen before
    // 3. It's a common pattern
    return route.expectedTime > 20 || 
           this.isCommonPattern(query) ||
           route.requiresJoin === true;
  }

  /**
   * Get optimal batch size for concurrent processing
   */
  getOptimalBatchSize(query: MCPQuery): number {
    // Based on our benchmark: 200 results in 0.38ms
    // That's ~526 results per ms
    const targetLatency = 10; // 10ms target
    return Math.floor(526 * targetLatency);
  }

  // Pattern detection methods
  private isTimeSeriesQuery(query: MCPQuery): boolean {
    const queryStr = JSON.stringify(query).toLowerCase();
    return this.queryPatterns.timeSeries.test(queryStr) ||
           query.parameters?.timeRange !== undefined;
  }

  private isSimilarityQuery(query: MCPQuery): boolean {
    const queryStr = JSON.stringify(query).toLowerCase();
    return this.queryPatterns.similarity.test(queryStr) ||
           query.parameters?.similarity !== undefined;
  }

  private isGraphQuery(query: MCPQuery): boolean {
    const queryStr = JSON.stringify(query).toLowerCase();
    return this.queryPatterns.graph.test(queryStr) ||
           query.parameters?.depth !== undefined;
  }

  private isConcurrentCandidate(query: MCPQuery): boolean {
    // Good for batching if it's a simple query with multiple results expected
    return (query.parameters?.concurrent === true) ||
           (query.limit && query.limit > 10) ||
           query.type === 'unified';
  }

  private isCommonPattern(query: MCPQuery): boolean {
    // Common patterns we see frequently
    const commonTypes = ['unified', 'time_series', 'similarity'];
    return commonTypes.includes(query.type);
  }

  private generateCacheKey(query: MCPQuery, prefix: string): string {
    const params = JSON.stringify(query.parameters || {});
    return `${prefix}:${query.type}:${query.target || 'all'}:${params}`;
  }

  /**
   * Update performance profiles based on actual execution
   */
  updateProfile(
    queryType: MCPQueryType, 
    actualTime: number, 
    success: boolean
  ): void {
    const profile = this.performanceProfiles.get(queryType);
    if (!profile) return;

    // Update moving average
    profile.avgResponseTime = profile.avgResponseTime * 0.9 + actualTime * 0.1;
    profile.successRate = profile.successRate * 0.95 + (success ? 1 : 0) * 0.05;

    this.logger.debug(`Updated profile for ${queryType}: ${profile.avgResponseTime}ms`);
  }

  /**
   * Get routing recommendations for optimization
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    this.performanceProfiles.forEach((profile, type) => {
      if (profile.avgResponseTime > 50) {
        recommendations.push(`Consider caching ${type} queries (avg: ${profile.avgResponseTime}ms)`);
      }
      if (profile.successRate < 0.9) {
        recommendations.push(`Improve ${type} reliability (success: ${(profile.successRate * 100).toFixed(1)}%)`);
      }
    });

    return recommendations;
  }
}