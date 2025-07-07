/**
 * Query Result Materializer
 * Pre-computes and caches expensive query results for instant access
 */

import { StorageManager } from '../storage/storage-manager.js';
import { RedisCache } from '../storage/redis-cache.js';
import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface MaterializedView {
  id: string;
  query: string;
  parameters: Record<string, any>;
  result: any;
  createdAt: Date;
  lastRefreshed: Date;
  refreshInterval: number; // ms
  accessCount: number;
  avgComputeTime: number; // ms
  priority: 'critical' | 'high' | 'normal';
}

export interface MaterializationConfig {
  enabled: boolean;
  maxViews: number;
  defaultRefreshInterval: number; // ms
  autoDetectQueries: boolean;
  minComputeTime: number; // ms - queries faster than this won't be materialized
  minAccessCount: number; // minimum accesses before considering materialization
}

export interface QueryProfile {
  queryHash: string;
  query: string;
  parameters: Record<string, any>;
  executionTimes: number[];
  accessCount: number;
  lastAccessed: Date;
}

/**
 * Materializes expensive query results for instant access
 */
export class QueryResultMaterializer extends EventEmitter {
  private logger = Logger.getInstance();
  private materializedViews: Map<string, MaterializedView> = new Map();
  private queryProfiles: Map<string, QueryProfile> = new Map();
  private refreshTimers: Map<string, NodeJS.Timer> = new Map();
  private isRefreshing: Set<string> = new Set();
  
  private readonly defaultConfig: MaterializationConfig = {
    enabled: true,
    maxViews: 100,
    defaultRefreshInterval: 300000, // 5 minutes
    autoDetectQueries: true,
    minComputeTime: 50, // 50ms
    minAccessCount: 3
  };

  // Common expensive queries to pre-materialize
  private readonly commonQueries = [
    {
      id: 'top_patterns_by_category',
      query: 'SELECT category, AVG(strength) as avg_strength, COUNT(*) as count FROM patterns GROUP BY category',
      priority: 'high' as const,
      refreshInterval: 600000 // 10 minutes
    },
    {
      id: 'pattern_evolution_30d',
      query: 'SELECT date, category, COUNT(*) as count FROM patterns WHERE created_at > NOW() - INTERVAL 30 DAY GROUP BY date, category',
      priority: 'normal' as const,
      refreshInterval: 3600000 // 1 hour
    },
    {
      id: 'complexity_hotspots',
      query: 'SELECT file, AVG(complexity) as avg_complexity FROM patterns GROUP BY file HAVING avg_complexity > 7 ORDER BY avg_complexity DESC LIMIT 20',
      priority: 'high' as const,
      refreshInterval: 1800000 // 30 minutes
    },
    {
      id: 'cross_cutting_patterns',
      query: 'SELECT pattern_type, COUNT(DISTINCT file) as file_count FROM patterns GROUP BY pattern_type HAVING file_count > 3',
      priority: 'critical' as const,
      refreshInterval: 900000 // 15 minutes
    }
  ];

  constructor(
    private storageManager: StorageManager,
    private cache: RedisCache,
    private config: MaterializationConfig = {} as MaterializationConfig
  ) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Start materialization process
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Query result materialization is disabled');
      return;
    }

    this.logger.info('📊 Starting query result materializer');
    
    // Initialize common materialized views
    for (const queryDef of this.commonQueries) {
      await this.createMaterializedView(
        queryDef.id,
        queryDef.query,
        {},
        queryDef.refreshInterval,
        queryDef.priority
      );
    }
    
    this.logger.info(`Initialized ${this.commonQueries.length} materialized views`);
  }

  /**
   * Stop materialization process
   */
  stop(): void {
    // Clear all refresh timers
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
    
    this.logger.info('🛑 Stopped query result materializer');
  }

  /**
   * Record query execution for profiling
   */
  recordQueryExecution(
    query: string,
    parameters: Record<string, any>,
    executionTime: number
  ): void {
    if (!this.config.autoDetectQueries) return;
    
    const queryHash = this.hashQuery(query, parameters);
    
    let profile = this.queryProfiles.get(queryHash);
    if (!profile) {
      profile = {
        queryHash,
        query,
        parameters,
        executionTimes: [],
        accessCount: 0,
        lastAccessed: new Date()
      };
      this.queryProfiles.set(queryHash, profile);
    }
    
    profile.executionTimes.push(executionTime);
    profile.accessCount++;
    profile.lastAccessed = new Date();
    
    // Keep only last 100 execution times
    if (profile.executionTimes.length > 100) {
      profile.executionTimes = profile.executionTimes.slice(-100);
    }
    
    // Check if this query should be materialized
    this.evaluateForMaterialization(profile);
  }

  /**
   * Get materialized result if available
   */
  async getMaterializedResult(
    query: string,
    parameters: Record<string, any>
  ): Promise<{ result: any; materialized: boolean } | null> {
    const queryHash = this.hashQuery(query, parameters);
    const viewId = `auto_${queryHash}`;
    
    // Check if we have a materialized view
    const view = this.materializedViews.get(viewId);
    if (!view) {
      return null;
    }
    
    // Update access count
    view.accessCount++;
    
    // Check if result is in cache
    const cached = await this.cache.get(`materialized:${viewId}`);
    if (cached) {
      this.emit('materialized:hit', { viewId, query });
      return {
        result: JSON.parse(cached),
        materialized: true
      };
    }
    
    // Result not in cache, might be refreshing
    if (this.isRefreshing.has(viewId)) {
      return null; // Let query execute normally
    }
    
    // Trigger refresh if needed
    this.refreshView(viewId).catch(err => 
      this.logger.error(`Failed to refresh view ${viewId}:`, err)
    );
    
    return null;
  }

  /**
   * Create a materialized view
   */
  async createMaterializedView(
    id: string,
    query: string,
    parameters: Record<string, any> = {},
    refreshInterval?: number,
    priority: 'critical' | 'high' | 'normal' = 'normal'
  ): Promise<void> {
    if (this.materializedViews.size >= this.config.maxViews) {
      // Remove least accessed view
      this.evictLeastUsedView();
    }
    
    const view: MaterializedView = {
      id,
      query,
      parameters,
      result: null,
      createdAt: new Date(),
      lastRefreshed: new Date(0), // Force initial refresh
      refreshInterval: refreshInterval || this.config.defaultRefreshInterval,
      accessCount: 0,
      avgComputeTime: 0,
      priority
    };
    
    this.materializedViews.set(id, view);
    
    // Initial refresh
    await this.refreshView(id);
    
    // Schedule periodic refresh
    const timer = setInterval(() => {
      this.refreshView(id).catch(err => 
        this.logger.error(`Scheduled refresh failed for ${id}:`, err)
      );
    }, view.refreshInterval);
    
    this.refreshTimers.set(id, timer);
    
    this.logger.info(`Created materialized view: ${id}`);
    this.emit('view:created', { id, query });
  }

  /**
   * Refresh a materialized view
   */
  private async refreshView(viewId: string): Promise<void> {
    const view = this.materializedViews.get(viewId);
    if (!view || this.isRefreshing.has(viewId)) {
      return;
    }
    
    this.isRefreshing.add(viewId);
    const startTime = Date.now();
    
    try {
      // Execute the query
      const result = await this.executeQuery(view.query, view.parameters);
      
      const computeTime = Date.now() - startTime;
      
      // Update view
      view.result = result;
      view.lastRefreshed = new Date();
      view.avgComputeTime = view.avgComputeTime > 0
        ? (view.avgComputeTime * 0.9 + computeTime * 0.1) // Moving average
        : computeTime;
      
      // Cache the result
      await this.cache.setex(
        `materialized:${viewId}`,
        Math.floor(view.refreshInterval / 1000), // TTL in seconds
        JSON.stringify(result)
      );
      
      this.logger.debug(`Refreshed view ${viewId} in ${computeTime}ms`);
      this.emit('view:refreshed', { viewId, computeTime });
      
    } catch (error) {
      this.logger.error(`Failed to refresh view ${viewId}:`, error);
      this.emit('view:error', { viewId, error });
    } finally {
      this.isRefreshing.delete(viewId);
    }
  }

  /**
   * Execute a query against the storage system
   */
  private async executeQuery(
    query: string,
    parameters: Record<string, any>
  ): Promise<any> {
    // This is a simplified implementation
    // In production, this would parse and execute the query
    
    if (query.includes('GROUP BY category')) {
      // Pattern distribution query
      return await this.storageManager.analytics.getPatternDistribution();
    } else if (query.includes('pattern_evolution')) {
      // Pattern trends query
      return await this.storageManager.analytics.getPatternTrends(30);
    } else if (query.includes('complexity_hotspots')) {
      // Complexity hotspots
      const hotspots = await this.storageManager.getComplexityHotspots(20);
      return hotspots.map(h => ({
        file: h.file,
        avg_complexity: h.complexity || 0
      }));
    } else if (query.includes('cross_cutting_patterns')) {
      // Cross-cutting patterns
      const patterns = await this.storageManager.dpcm.getAllPatterns();
      const filesByType = new Map<string, Set<string>>();
      
      patterns.forEach(p => {
        const type = p.harmonicProperties.category;
        if (!filesByType.has(type)) {
          filesByType.set(type, new Set());
        }
        p.locations.forEach(loc => {
          filesByType.get(type)!.add(loc.file);
        });
      });
      
      return Array.from(filesByType.entries())
        .filter(([_, files]) => files.size > 3)
        .map(([type, files]) => ({
          pattern_type: type,
          file_count: files.size
        }));
    }
    
    // Default: return empty result
    return [];
  }

  /**
   * Evaluate if a query should be materialized
   */
  private evaluateForMaterialization(profile: QueryProfile): void {
    if (profile.accessCount < this.config.minAccessCount) {
      return;
    }
    
    const avgExecutionTime = profile.executionTimes.reduce((a, b) => a + b, 0) / profile.executionTimes.length;
    
    if (avgExecutionTime < this.config.minComputeTime) {
      return; // Query is already fast enough
    }
    
    const viewId = `auto_${profile.queryHash}`;
    
    // Check if already materialized
    if (this.materializedViews.has(viewId)) {
      return;
    }
    
    // Determine priority based on execution time and access frequency
    let priority: 'critical' | 'high' | 'normal';
    if (avgExecutionTime > 200 && profile.accessCount > 10) {
      priority = 'critical';
    } else if (avgExecutionTime > 100 || profile.accessCount > 5) {
      priority = 'high';
    } else {
      priority = 'normal';
    }
    
    // Create materialized view
    this.createMaterializedView(
      viewId,
      profile.query,
      profile.parameters,
      this.config.defaultRefreshInterval,
      priority
    ).catch(err => 
      this.logger.error('Failed to create auto-materialized view:', err)
    );
    
    this.logger.info(
      `Auto-materializing query with avg time ${avgExecutionTime}ms and ${profile.accessCount} accesses`
    );
  }

  /**
   * Evict least used materialized view
   */
  private evictLeastUsedView(): void {
    let leastUsed: MaterializedView | null = null;
    let leastUsedId: string | null = null;
    
    this.materializedViews.forEach((view, id) => {
      // Don't evict critical views
      if (view.priority === 'critical') return;
      
      if (!leastUsed || view.accessCount < leastUsed.accessCount) {
        leastUsed = view;
        leastUsedId = id;
      }
    });
    
    if (leastUsedId) {
      this.removeMaterializedView(leastUsedId);
    }
  }

  /**
   * Remove a materialized view
   */
  removeMaterializedView(viewId: string): void {
    const timer = this.refreshTimers.get(viewId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(viewId);
    }
    
    this.materializedViews.delete(viewId);
    this.cache.client.del(`materialized:${viewId}`).catch(() => {});
    
    this.logger.info(`Removed materialized view: ${viewId}`);
    this.emit('view:removed', { viewId });
  }

  /**
   * Hash query for consistent identification
   */
  private hashQuery(query: string, parameters: Record<string, any>): string {
    const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
    return crypto.createHash('md5').update(normalized + paramStr).digest('hex');
  }

  /**
   * Get statistics
   */
  getStats(): {
    viewCount: number;
    views: Array<{
      id: string;
      priority: string;
      accessCount: number;
      avgComputeTime: number;
      lastRefreshed: Date;
    }>;
    profileCount: number;
    topCandidates: QueryProfile[];
  } {
    const views = Array.from(this.materializedViews.values())
      .map(v => ({
        id: v.id,
        priority: v.priority,
        accessCount: v.accessCount,
        avgComputeTime: v.avgComputeTime,
        lastRefreshed: v.lastRefreshed
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
    
    const topCandidates = Array.from(this.queryProfiles.values())
      .filter(p => p.accessCount >= this.config.minAccessCount)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);
    
    return {
      viewCount: this.materializedViews.size,
      views,
      profileCount: this.queryProfiles.size,
      topCandidates
    };
  }
}