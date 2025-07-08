/**
 * MCP Pattern Gateway
 * The unified AI agent interface for all pattern intelligence
 */

import { MCPTool, MCPToolResponse } from '../qpfm-mcp-tools.js';
import { DuckDBDataLake } from '../../datalake/duckdb-data-lake.js';
import { QuantumProbabilityFieldMemory } from '../../memory/quantum-memory-system.js';
import { UnifiedPatternQuery } from '../../integration/unified-pattern-query.js';
import { UnifiedStorageManager } from '../../storage/unified-storage-manager.js';
import { IntelligentQueryRouter } from './intelligent-query-router.js';
import { Logger } from '../../logging/logger.js';
import { EventEmitter } from 'events';
import { LRUCache } from 'lru-cache';

export type MCPQueryType = 
  | 'realtime_similarity'
  | 'relationship_traversal'
  | 'historical_analysis'
  | 'comprehensive_intelligence'
  | 'pattern_evolution'
  | 'cross_cutting_patterns'
  | 'quality_assessment'
  | 'unified'
  | 'time_series'
  | 'similarity'
  | 'graph_traversal';

export interface MCPQuery {
  type: MCPQueryType;
  target: string;
  parameters?: Record<string, any>;
  context?: {
    previousQueries?: string[];
    sessionId?: string;
    agentId?: string;
  };
}

export interface MCPResponse {
  success: boolean;
  data: any;
  metadata: {
    queryType: MCPQueryType;
    executionTime: number;
    sourceSystems: string[];
    cacheHit: boolean;
  };
  insights?: string[];
  recommendations?: string[];
}

export interface MCPGatewayConfig {
  cacheSize?: number;
  cacheTTL?: number;
  enableStreaming?: boolean;
  routingStrategy?: 'optimal' | 'comprehensive' | 'fast';
}

/**
 * The crown jewel - unified pattern intelligence gateway
 */
export class MCPPatternGateway extends EventEmitter {
  private logger = Logger.getInstance();
  private cache: LRUCache<string, MCPResponse>;
  private unifiedQuery: UnifiedPatternQuery;
  private config: Required<MCPGatewayConfig>;
  private queryMetrics = new Map<MCPQueryType, { count: number; avgTime: number }>();
  private duckLake: DuckDBDataLake;
  private neo4j: any;  // SurrealDB adapter
  private qpfm: QuantumProbabilityFieldMemory;
  private queryRouter: IntelligentQueryRouter;

  constructor(storageManagerOrDuckLake: UnifiedStorageManager | DuckDBDataLake, ...args: any[]) {
    super();
    
    // Handle both constructor signatures
    if (storageManagerOrDuckLake instanceof UnifiedStorageManager) {
      // Constructor with StorageManager
      const storageManager = storageManagerOrDuckLake;
      const config = args[0] as MCPGatewayConfig | undefined;
      
      // Create default instances if not available
      this.duckLake = new DuckDBDataLake();
      this.duckLake.initialize().catch(err => this.logger.error('DuckDB init failed:', err));
      this.neo4j = storageManager.surrealdb;  // Use SurrealDB adapter
      this.qpfm = storageManager.qpfm || new QuantumProbabilityFieldMemory();
      
      this.config = {
        cacheSize: config?.cacheSize || 1000,
        cacheTTL: config?.cacheTTL || 300000,
        enableStreaming: config?.enableStreaming ?? true,
        routingStrategy: config?.routingStrategy || 'optimal'
      };
    } else {
      // Original constructor with individual storage instances
      this.duckLake = storageManagerOrDuckLake;
      this.neo4j = args[0] as any;  // SurrealDB adapter
      this.qpfm = args[1] as QuantumProbabilityFieldMemory;
      const config = args[2] as MCPGatewayConfig | undefined;
      
      this.config = {
        cacheSize: config?.cacheSize || 1000,
        cacheTTL: config?.cacheTTL || 300000,
        enableStreaming: config?.enableStreaming ?? true,
        routingStrategy: config?.routingStrategy || 'optimal'
      };
    }

    this.cache = new LRUCache({
      max: this.config.cacheSize,
      ttl: this.config.cacheTTL
    });

    this.unifiedQuery = new UnifiedPatternQuery(this.duckLake, this.neo4j, this.qpfm);
    this.queryRouter = new IntelligentQueryRouter();
    
    this.logger.info('🌟 MCP Pattern Gateway initialized');
  }

  /**
   * Main entry point for all MCP queries
   */
  async handleMCPRequest(query: MCPQuery): Promise<MCPResponse> {
    const startTime = Date.now();
    
    // Use intelligent routing
    const route = this.queryRouter.analyze(query);
    const cacheKey = route.cacheKey || this.generateCacheKey(query);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.emit('cache:hit', { query, response: cached });
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true
        }
      };
    }

    this.logger.debug(`Processing MCP query: ${query.type} with route: ${route.storage}`);
    
    try {
      let response: MCPResponse;
      
      // Fast path optimization
      if (route.fastPath && route.storage === 'duckdb') {
        // Direct DuckDB query for time-series (4ms path)
        const results = await this.duckLake.queryTimeRange({
          startTime: query.parameters?.timeRange?.start || new Date(Date.now() - 3600000),
          endTime: query.parameters?.timeRange?.end || new Date(),
          categories: query.parameters?.categories
        });
        
        response = {
          success: true,
          data: results,
          metadata: {
            queryType: query.type,
            executionTime: Date.now() - startTime,
            sourceSystems: ['duckdb'],
            cacheHit: false
          },
          memories: results
        } as MCPResponse;
      } else if (route.strategy === 'batch' && query.limit && query.limit > 10) {
        // Batch processing for concurrent queries
        response = await this.handleBatchQuery(query, route);
      } else {
        // Standard routing
        response = await this.routeQuery(query);
      }
      
      // Add execution metadata (preserve existing metadata if present)
      response.metadata = {
        ...response.metadata,
        queryType: query.type,
        executionTime: Date.now() - startTime,
        sourceSystems: response.metadata?.sourceSystems || (route.storage === 'unified' 
          ? ['duckdb', 'neo4j', 'qpfm'] 
          : [route.storage]),
        cacheHit: false
      };

      // Cache successful responses (only if query takes > 10ms)
      if (response.success && route.expectedTime > 10) {
        this.cache.set(cacheKey, response);
      }

      // Update metrics and router profile
      const actualTime = response.metadata.executionTime;
      this.updateQueryMetrics(query.type, actualTime);
      this.queryRouter.updateProfile(query.type, actualTime, response.success);
      
      // Emit for streaming subscribers
      if (this.config.enableStreaming) {
        this.emit('query:complete', { query, response });
      }

      return response;

    } catch (error) {
      this.logger.error('MCP query failed:', error);
      return {
        success: false,
        data: null,
        metadata: {
          queryType: query.type,
          executionTime: Date.now() - startTime,
          sourceSystems: [],
          cacheHit: false
        },
        insights: [`Query failed: ${error.message}`]
      };
    }
  }

  /**
   * Route query to optimal storage system(s)
   */
  private async routeQuery(query: MCPQuery): Promise<MCPResponse> {
    switch (query.type) {
      case 'realtime_similarity':
        return await this.handleSimilarityQuery(query);
        
      case 'relationship_traversal':
        return await this.handleRelationshipQuery(query);
        
      case 'historical_analysis':
        return await this.handleHistoricalQuery(query);
        
      case 'comprehensive_intelligence':
        return await this.handleComprehensiveQuery(query);
        
      case 'pattern_evolution':
        return await this.handleEvolutionQuery(query);
        
      case 'cross_cutting_patterns':
        return await this.handleCrossCuttingQuery(query);
        
      case 'quality_assessment':
        return await this.handleQualityQuery(query);
      
      case 'unified':
        return await this.handleUnifiedQuery(query);
      
      case 'time_series':
        return await this.handleTimeSeriesQuery(query);
      
      case 'similarity':
        return await this.handleSimilarityQuery(query);
      
      case 'graph_traversal':
        return await this.handleRelationshipQuery(query);
        
      default:
        throw new Error(`Unknown query type: ${query.type}`);
    }
  }

  /**
   * QPFM-focused: Real-time similarity search
   */
  private async handleSimilarityQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    
    // Get pattern coordinates
    const patterns = await this.duckLake.queryPatterns({
      files: [target],
      limit: 1
    });

    if (patterns.length === 0) {
      return {
        success: false,
        data: null,
        insights: [`No patterns found for ${target}`]
      } as MCPResponse;
    }

    // Convert to coordinates (in production, use actual embeddings)
    const coordinates = [
      patterns[0].score,
      patterns[0].confidence,
      0.5, 0.5, 0.5, 0.5 // Placeholder dimensions
    ];

    // Query QPFM
    const similar = await this.qpfm.querySimilar({
      coordinates,
      radius: parameters.radius || 0.3,
      limit: parameters.limit || 20
    });

    return {
      success: true,
      data: {
        query: target,
        similar: similar.results,
        coordinates,
        clusters: similar.clusters || []
      },
      insights: [
        `Found ${similar.results.length} similar patterns`,
        similar.results.length > 10 ? 'High pattern connectivity detected' : 'Moderate pattern connectivity'
      ],
      recommendations: this.generateSimilarityRecommendations(similar.results)
    } as MCPResponse;
  }

  /**
   * Neo4j-focused: Relationship traversal
   */
  private async handleRelationshipQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    const depth = parameters.depth || 2;
    
    const session = this.neo4j.driver.session();
    
    try {
      // Get symbol and its relationships
      const result = await session.run(`
        MATCH (s:Symbol)
        WHERE s.name = $target OR s.file = $target OR s.id = $target
        OPTIONAL MATCH (s)-[:EXHIBITS]->(p:Pattern)
        OPTIONAL MATCH (s)-[:CALLS*1..${depth}]->(called:Symbol)
        OPTIONAL MATCH (s)<-[:CALLS*1..${depth}]-(caller:Symbol)
        RETURN 
          s,
          collect(DISTINCT p) as patterns,
          collect(DISTINCT called) as calls,
          collect(DISTINCT caller) as calledBy
      `, { target });

      if (result.records.length === 0) {
        return {
          success: false,
          data: null,
          insights: [`Symbol ${target} not found in graph`]
        } as MCPResponse;
      }

      const record = result.records[0];
      const data = {
        symbol: record.get('s').properties,
        patterns: record.get('patterns').map((p: any) => p.properties),
        calls: record.get('calls').map((s: any) => s.properties),
        calledBy: record.get('calledBy').map((s: any) => s.properties)
      };

      return {
        success: true,
        data,
        insights: this.generateRelationshipInsights(data),
        recommendations: this.generateRelationshipRecommendations(data)
      } as MCPResponse;

    } finally {
      await session.close();
    }
  }

  /**
   * DuckLake-focused: Historical analysis
   */
  private async handleHistoricalQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    
    const evolution = await this.duckLake.analyzePatternEvolution(target, {
      timeRange: parameters.timeRange,
      granularity: parameters.granularity || 'day'
    });

    const snapshots = await this.duckLake.listSnapshots();
    const relevantSnapshots = snapshots.filter(s => 
      s.comment?.includes(target)
    );

    return {
      success: true,
      data: {
        evolution,
        snapshots: relevantSnapshots,
        trends: this.analyzeEvolutionTrends(evolution)
      },
      insights: this.generateHistoricalInsights(evolution),
      recommendations: this.generateHistoricalRecommendations(evolution)
    } as MCPResponse;
  }

  /**
   * All systems: Comprehensive intelligence
   */
  private async handleComprehensiveQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    
    const analysis = await this.unifiedQuery.getComprehensiveAnalysis(target, {
      includeTimeline: parameters.includeTimeline ?? true,
      includeGraph: parameters.includeGraph ?? true,
      includeSimilar: parameters.includeSimilar ?? true,
      timeRange: parameters.timeRange,
      depth: parameters.depth || 2
    });

    return {
      success: true,
      data: analysis,
      insights: analysis.insights.trends.concat([
        `Code quality: ${analysis.insights.quality}`,
        ...analysis.insights.hotspots
      ]),
      recommendations: analysis.insights.recommendations
    } as MCPResponse;
  }

  /**
   * Evolution-specific query
   */
  private async handleEvolutionQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    
    if (parameters.snapshot1 && parameters.snapshot2) {
      // Compare two snapshots
      const comparison = await this.duckLake.compareSnapshots(
        parameters.snapshot1,
        parameters.snapshot2
      );

      return {
        success: true,
        data: comparison,
        insights: [
          `${comparison.added.length} patterns added`,
          `${comparison.removed.length} patterns removed`,
          `${comparison.changed.length} patterns changed`
        ],
        recommendations: this.generateEvolutionRecommendations(comparison)
      } as MCPResponse;
    }

    // Default evolution analysis
    return this.handleHistoricalQuery(query);
  }

  /**
   * Cross-cutting pattern analysis
   */
  private async handleCrossCuttingQuery(query: MCPQuery): Promise<MCPResponse> {
    const { parameters = {} } = query;
    
    const result = await this.unifiedQuery.findCrossCuttingPatterns({
      minFiles: parameters.minFiles || 3,
      minScore: parameters.minScore || 0.7,
      categories: parameters.categories
    });

    const topPatterns = result.patterns.slice(0, 10).map((p: any) => ({
      ...p,
      impact: result.impact.get(p.pattern_type) || 0
    }));

    return {
      success: true,
      data: {
        patterns: topPatterns,
        totalFound: result.patterns.length,
        impactAnalysis: Object.fromEntries(result.impact)
      },
      insights: [
        `Found ${result.patterns.length} cross-cutting patterns`,
        `Top pattern appears in ${topPatterns[0]?.file_count || 0} files`
      ],
      recommendations: [
        'Consider extracting cross-cutting patterns into shared modules',
        'Review high-impact patterns for optimization opportunities'
      ]
    } as MCPResponse;
  }

  /**
   * Quality assessment query
   */
  private async handleQualityQuery(query: MCPQuery): Promise<MCPResponse> {
    const { target, parameters = {} } = query;
    
    // Get comprehensive analysis first
    const analysis = await this.unifiedQuery.getComprehensiveAnalysis(target, {
      includeTimeline: true,
      includeGraph: true,
      includeSimilar: true
    });

    // Calculate quality metrics
    const metrics = {
      overallQuality: analysis.insights.quality,
      patternScore: this.calculateAveragePatternScore(analysis),
      evolutionTrend: this.calculateEvolutionTrend(analysis),
      relationshipComplexity: this.calculateRelationshipComplexity(analysis),
      similarityScore: this.calculateSimilarityScore(analysis)
    };

    return {
      success: true,
      data: {
        target,
        metrics,
        details: analysis
      },
      insights: [
        `Overall quality: ${metrics.overallQuality}`,
        `Pattern score: ${metrics.patternScore.toFixed(2)}/1.0`,
        `Evolution trend: ${metrics.evolutionTrend}`,
        `Complexity: ${metrics.relationshipComplexity}`
      ],
      recommendations: this.generateQualityRecommendations(metrics, analysis)
    } as MCPResponse;
  }

  /**
   * Stream pattern updates to connected AI agents
   */
  streamPatternUpdates(filter?: {
    categories?: string[];
    minScore?: number;
    files?: string[];
  }) {
    return new MCPPatternStream(this, filter);
  }

  /**
   * Get gateway performance metrics
   */
  getMetrics(): Record<MCPQueryType, { count: number; avgTime: number }> {
    return Object.fromEntries(this.queryMetrics);
  }

  /**
   * Clear cache (useful after major updates)
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  // Helper methods

  private generateCacheKey(query: MCPQuery): string {
    return `${query.type}:${query.target}:${JSON.stringify(query.parameters || {})}`;
  }

  private determineSourceSystems(queryType: MCPQueryType): string[] {
    const mapping: Record<MCPQueryType, string[]> = {
      'realtime_similarity': ['qpfm'],
      'relationship_traversal': ['neo4j'],
      'historical_analysis': ['ducklake'],
      'comprehensive_intelligence': ['ducklake', 'neo4j', 'qpfm'],
      'pattern_evolution': ['ducklake'],
      'cross_cutting_patterns': ['ducklake', 'neo4j'],
      'quality_assessment': ['ducklake', 'neo4j', 'qpfm']
    };
    return mapping[queryType] || [];
  }

  private updateQueryMetrics(type: MCPQueryType, executionTime: number): void {
    const current = this.queryMetrics.get(type) || { count: 0, avgTime: 0 };
    const newCount = current.count + 1;
    const newAvgTime = (current.avgTime * current.count + executionTime) / newCount;
    
    this.queryMetrics.set(type, {
      count: newCount,
      avgTime: newAvgTime
    });
  }

  private generateSimilarityRecommendations(similar: any[]): string[] {
    const recommendations: string[] = [];
    
    if (similar.length > 15) {
      recommendations.push('Many similar patterns found - consider abstraction');
    }
    
    if (similar.some(s => s.score > 0.9)) {
      recommendations.push('Nearly identical patterns detected - possible duplication');
    }
    
    return recommendations;
  }

  private generateRelationshipInsights(data: any): string[] {
    const insights: string[] = [];
    
    insights.push(`Symbol exhibits ${data.patterns.length} patterns`);
    insights.push(`Calls ${data.calls.length} functions`);
    insights.push(`Called by ${data.calledBy.length} functions`);
    
    if (data.calls.length > 10) {
      insights.push('High outgoing complexity - consider refactoring');
    }
    
    if (data.calledBy.length > 15) {
      insights.push('Highly depended upon - changes have wide impact');
    }
    
    return insights;
  }

  private generateRelationshipRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.calls.length > 10) {
      recommendations.push('Consider breaking down this function');
    }
    
    if (data.calledBy.length > 15) {
      recommendations.push('Consider creating an interface to reduce coupling');
    }
    
    if (data.patterns.length < 3) {
      recommendations.push('Low pattern count - analyze for improvement opportunities');
    }
    
    return recommendations;
  }

  private generateHistoricalInsights(evolution: any[]): string[] {
    const insights: string[] = [];
    
    if (evolution.length > 0) {
      const improving = evolution.filter((e: any) => e.score_change > 0).length;
      const declining = evolution.filter((e: any) => e.score_change < 0).length;
      
      insights.push(`${improving} patterns improving over time`);
      insights.push(`${declining} patterns declining in quality`);
    }
    
    return insights;
  }

  private generateHistoricalRecommendations(evolution: any[]): string[] {
    const recommendations: string[] = [];
    
    const declining = evolution.filter((e: any) => e.score_change < -0.1);
    if (declining.length > 0) {
      recommendations.push('Address declining pattern quality');
      recommendations.push(`Focus on: ${declining[0].pattern_type}`);
    }
    
    return recommendations;
  }

  private generateEvolutionRecommendations(comparison: any): string[] {
    const recommendations: string[] = [];
    
    if (comparison.removed.length > comparison.added.length) {
      recommendations.push('Pattern count decreasing - ensure not losing functionality');
    }
    
    if (comparison.changed.filter((c: any) => c.scoreChange < 0).length > 5) {
      recommendations.push('Multiple patterns declining - review recent changes');
    }
    
    return recommendations;
  }

  private analyzeEvolutionTrends(evolution: any[]): any {
    if (evolution.length === 0) return { trend: 'stable', confidence: 0 };
    
    const scores = evolution.map((e: any) => e.avg_score || 0);
    const trend = scores[scores.length - 1] > scores[0] ? 'improving' : 'declining';
    
    return { trend, confidence: 0.8 };
  }

  private calculateAveragePatternScore(analysis: any): number {
    if (!analysis.graph?.patterns) return 0;
    
    const patterns = analysis.graph.patterns;
    if (patterns.length === 0) return 0;
    
    const sum = patterns.reduce((acc: number, p: any) => acc + (p.strength || 0), 0);
    return sum / patterns.length;
  }

  private calculateEvolutionTrend(analysis: any): string {
    if (!analysis.timeline?.evolution) return 'unknown';
    
    const evolution = analysis.timeline.evolution;
    if (evolution.length < 2) return 'stable';
    
    const recent = evolution.slice(-5);
    const improving = recent.filter((e: any) => e.score_change > 0).length;
    
    if (improving > 3) return 'improving';
    if (improving < 2) return 'declining';
    return 'stable';
  }

  private calculateRelationshipComplexity(analysis: any): string {
    if (!analysis.graph) return 'unknown';
    
    const callsCount = analysis.graph.callChains?.length || 0;
    const relatedCount = analysis.graph.relatedSymbols?.length || 0;
    
    const total = callsCount + relatedCount;
    
    if (total > 30) return 'high';
    if (total > 15) return 'medium';
    return 'low';
  }

  private calculateSimilarityScore(analysis: any): number {
    if (!analysis.similar?.patterns) return 0;
    
    const patterns = analysis.similar.patterns;
    if (patterns.length === 0) return 1.0; // Unique is good
    
    // Lower score means more similar patterns exist
    return Math.max(0, 1.0 - (patterns.length / 20));
  }

  private generateQualityRecommendations(metrics: any, analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.overallQuality === 'poor' || metrics.overallQuality === 'needs-improvement') {
      recommendations.push('Prioritize refactoring this component');
    }
    
    if (metrics.patternScore < 0.6) {
      recommendations.push('Improve pattern implementation quality');
    }
    
    if (metrics.evolutionTrend === 'declining') {
      recommendations.push('Review recent changes for quality regression');
    }
    
    if (metrics.relationshipComplexity === 'high') {
      recommendations.push('Consider decomposing to reduce complexity');
    }
    
    if (metrics.similarityScore < 0.5) {
      recommendations.push('Many similar patterns - consider DRY principle');
    }
    
    return recommendations;
  }

  /**
   * Handle batch queries for optimal performance
   */
  private async handleBatchQuery(query: MCPQuery, route: any): Promise<MCPResponse> {
    const batchSize = this.queryRouter.getOptimalBatchSize(query);
    const batches: any[] = [];
    
    // Split into optimal batches
    const totalItems = query.limit || 100;
    for (let i = 0; i < totalItems; i += batchSize) {
      batches.push({
        ...query,
        offset: i,
        limit: Math.min(batchSize, totalItems - i)
      });
    }
    
    // Execute batches in parallel
    const batchResults = await Promise.all(
      batches.map(batch => this.routeQuery(batch))
    );
    
    // Combine results
    const allMemories = batchResults.flatMap(r => r.memories || []);
    
    return {
      success: true,
      data: allMemories,
      metadata: {
        queryType: query.type,
        executionTime: 0, // Will be set by caller
        sourceSystems: ['batch_processor'],
        cacheHit: false
      },
      memories: allMemories
    } as MCPResponse;
  }

  /**
   * Handle unified query across all storage systems
   */
  private async handleUnifiedQuery(query: any): Promise<MCPResponse> {
    const { query: searchQuery = '', filters = {}, limit = 20 } = query;
    
    try {
      // Query all storage systems in parallel
      const [duckResults, neo4jResults, qpfmResults] = await Promise.all([
        // DuckDB query
        this.duckLake.queryPatterns({
          minScore: filters.minStrength,
          categories: filters.categories,
          limit
        }).catch(() => []),
        
        // Neo4j query (if available)
        filters.categories?.[0] 
          ? this.neo4j.getPatternsByCategory(filters.categories[0]).catch(() => [])
          : Promise.resolve([]),
        
        // QPFM query
        this.qpfm.query(searchQuery).catch(() => ({ memories: [] }))
      ]);
      
      // Combine and deduplicate results
      const allResults = [
        ...duckResults,
        ...neo4jResults,
        ...(qpfmResults.memories || [])
      ];
      
      return {
        success: true,
        data: allResults.slice(0, limit),
        metadata: {
          queryType: 'unified',
          executionTime: 0,
          sourceSystems: ['duckdb', 'neo4j', 'qpfm'],
          cacheHit: false
        },
        memories: allResults.slice(0, limit)
      } as MCPResponse;
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          queryType: 'unified',
          executionTime: 0,
          sourceSystems: [],
          cacheHit: false
        },
        memories: []
      } as MCPResponse;
    }
  }

  /**
   * Handle time-series queries
   */
  private async handleTimeSeriesQuery(query: any): Promise<MCPResponse> {
    const { timeRange, filters = {} } = query;
    
    try {
      const results = await this.duckLake.queryTimeRange({
        startTime: timeRange.start,
        endTime: timeRange.end,
        categories: filters.category ? [filters.category] : undefined
      });
      
      return {
        success: true,
        data: results,
        metadata: {
          queryType: 'time_series',
          executionTime: 0,
          sourceSystems: ['duckdb'],
          cacheHit: false
        },
        memories: results
      } as MCPResponse;
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          queryType: 'time_series',
          executionTime: 0,
          sourceSystems: ['duckdb'],
          cacheHit: false
        },
        memories: []
      } as MCPResponse;
    }
  }
}

/**
 * Stream pattern updates to AI agents
 */
export class MCPPatternStream extends EventEmitter {
  constructor(
    private gateway: MCPPatternGateway,
    private filter?: any
  ) {
    super();
    
    // Subscribe to gateway events
    gateway.on('query:complete', this.handleQueryComplete.bind(this));
  }

  private handleQueryComplete({ query, response }: any) {
    if (this.matchesFilter(query, response)) {
      this.emit('pattern:update', {
        timestamp: new Date(),
        query,
        response,
        filtered: true
      });
    }
  }

  private matchesFilter(query: MCPQuery, response: MCPResponse): boolean {
    if (!this.filter) return true;
    
    // Apply filters
    if (this.filter.categories && response.data?.category) {
      if (!this.filter.categories.includes(response.data.category)) {
        return false;
      }
    }
    
    if (this.filter.minScore && response.data?.score) {
      if (response.data.score < this.filter.minScore) {
        return false;
      }
    }
    
    return true;
  }

  stop() {
    this.removeAllListeners();
  }
}

// Export factory function
export async function createMCPGateway(
  duckLake: DuckDBDataLake,
  neo4j: Neo4jRelationshipStore,
  qpfm: QuantumProbabilityFieldMemory,
  config?: MCPGatewayConfig
): Promise<MCPPatternGateway> {
  const gateway = new MCPPatternGateway(duckLake, neo4j, qpfm, config);
  
  // Skip pre-warming in test environment
  if (process.env.NODE_ENV !== 'test') {
    // Pre-warm cache with common queries
    const commonTargets = [
      'src/core/guru.ts',
      'src/memory/quantum-memory-system.ts',
      'src/harmonic-intelligence/core/harmonic-analysis-engine.ts'
    ];
    
    for (const target of commonTargets) {
      gateway.handleMCPRequest({
        type: 'quality_assessment',
        target
      }).catch(() => {}); // Ignore errors during pre-warming
    }
  }
  
  return gateway;
}