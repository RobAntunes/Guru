/**
 * Adaptive Cache Warmer
 * Pre-loads frequently accessed patterns based on usage patterns
 */

import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';
import { RedisCache } from '../storage/redis-cache.js';
import { HarmonicPatternMemory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';
import { EventEmitter } from 'events';

export interface AccessPattern {
  patternId: string;
  hourOfDay: number;
  dayOfWeek: number;
  count: number;
  avgLatency: number;
}

export interface WarmingStrategy {
  patterns: string[];
  priority: 'critical' | 'high' | 'normal';
  ttl: number;
  reason: string;
}

export interface WarmingConfig {
  enabled: boolean;
  interval: number; // ms between warming cycles
  maxPatternsPerCycle: number;
  strategies: {
    timeBasedWarming: boolean;
    frequencyBasedWarming: boolean;
    predictiveWarming: boolean;
  };
}

/**
 * Intelligently pre-warms cache based on access patterns
 */
export class AdaptiveCacheWarmer extends EventEmitter {
  private logger = Logger.getInstance();
  private accessHistory: Map<string, AccessPattern[]> = new Map();
  private warmingTimer?: NodeJS.Timer;
  private isWarming: boolean = false;
  
  private readonly defaultConfig: WarmingConfig = {
    enabled: true,
    interval: 60000, // 1 minute
    maxPatternsPerCycle: 100,
    strategies: {
      timeBasedWarming: true,
      frequencyBasedWarming: true,
      predictiveWarming: true
    }
  };

  constructor(
    private storageManager: UnifiedStorageManager,
    private cache: RedisCache,
    private config: WarmingConfig = {} as WarmingConfig
  ) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Start the adaptive cache warming process
   */
  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Adaptive cache warming is disabled');
      return;
    }

    this.logger.info('🔥 Starting adaptive cache warmer');
    
    // Initial warming
    this.warmCache().catch(err => 
      this.logger.error('Initial cache warming failed:', err)
    );
    
    // Schedule periodic warming
    this.warmingTimer = setInterval(() => {
      if (!this.isWarming) {
        this.warmCache().catch(err => 
          this.logger.error('Periodic cache warming failed:', err)
        );
      }
    }, this.config.interval);
  }

  /**
   * Stop the cache warming process
   */
  stop(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
      this.warmingTimer = undefined;
    }
    this.logger.info('🛑 Stopped adaptive cache warmer');
  }

  /**
   * Record pattern access for learning
   */
  recordAccess(patternId: string, latency: number): void {
    const now = new Date();
    const accessPattern: AccessPattern = {
      patternId,
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      count: 1,
      avgLatency: latency
    };
    
    if (!this.accessHistory.has(patternId)) {
      this.accessHistory.set(patternId, []);
    }
    
    const history = this.accessHistory.get(patternId)!;
    
    // Aggregate with existing pattern for same time slot
    const existing = history.find(h => 
      h.hourOfDay === accessPattern.hourOfDay && 
      h.dayOfWeek === accessPattern.dayOfWeek
    );
    
    if (existing) {
      existing.count++;
      existing.avgLatency = (existing.avgLatency * (existing.count - 1) + latency) / existing.count;
    } else {
      history.push(accessPattern);
    }
    
    // Keep history size manageable
    if (history.length > 168) { // 7 days * 24 hours
      history.shift();
    }
  }

  /**
   * Main cache warming logic
   */
  private async warmCache(): Promise<void> {
    this.isWarming = true;
    const startTime = Date.now();
    
    try {
      const strategies: WarmingStrategy[] = [];
      
      // Collect warming strategies
      if (this.config.strategies.timeBasedWarming) {
        strategies.push(await this.getTimeBasedStrategy());
      }
      
      if (this.config.strategies.frequencyBasedWarming) {
        strategies.push(await this.getFrequencyBasedStrategy());
      }
      
      if (this.config.strategies.predictiveWarming) {
        strategies.push(await this.getPredictiveStrategy());
      }
      
      // Merge and prioritize patterns
      const patternsToWarm = this.mergeStrategies(strategies);
      
      // Warm patterns in batches
      let warmed = 0;
      for (const batch of this.batchPatterns(patternsToWarm, 10)) {
        await this.warmPatternBatch(batch);
        warmed += batch.length;
        
        if (warmed >= this.config.maxPatternsPerCycle) {
          break;
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache warming completed: ${warmed} patterns in ${duration}ms`);
      
      this.emit('warming:complete', {
        patternsWarmed: warmed,
        duration,
        strategies: strategies.length
      });
      
    } catch (error) {
      this.logger.error('Cache warming error:', error);
      this.emit('warming:error', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Time-based warming strategy
   */
  private async getTimeBasedStrategy(): Promise<WarmingStrategy> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Find patterns frequently accessed at this time
    const timeRelevantPatterns: Array<{id: string; score: number}> = [];
    
    this.accessHistory.forEach((history, patternId) => {
      const relevantAccesses = history.filter(h => 
        Math.abs(h.hourOfDay - currentHour) <= 1 && // Within 1 hour
        h.dayOfWeek === currentDay
      );
      
      if (relevantAccesses.length > 0) {
        const totalCount = relevantAccesses.reduce((sum, h) => sum + h.count, 0);
        const avgLatency = relevantAccesses.reduce((sum, h) => sum + h.avgLatency, 0) / relevantAccesses.length;
        
        // Score based on frequency and latency
        const score = totalCount * (avgLatency / 10); // Higher score = more important to cache
        
        timeRelevantPatterns.push({ id: patternId, score });
      }
    });
    
    // Sort by score and take top patterns
    timeRelevantPatterns.sort((a, b) => b.score - a.score);
    const patterns = timeRelevantPatterns.slice(0, 50).map(p => p.id);
    
    return {
      patterns,
      priority: 'high',
      ttl: 3600, // 1 hour
      reason: `Time-based: ${currentHour}:00 on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDay]}`
    };
  }

  /**
   * Frequency-based warming strategy
   */
  private async getFrequencyBasedStrategy(): Promise<WarmingStrategy> {
    // Get most frequently accessed patterns overall
    const frequencyMap = new Map<string, number>();
    
    this.accessHistory.forEach((history, patternId) => {
      const totalCount = history.reduce((sum, h) => sum + h.count, 0);
      frequencyMap.set(patternId, totalCount);
    });
    
    // Sort by frequency
    const sorted = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([id]) => id);
    
    return {
      patterns: sorted,
      priority: 'critical',
      ttl: 7200, // 2 hours for frequently accessed
      reason: 'Frequency-based: Top accessed patterns'
    };
  }

  /**
   * Predictive warming strategy using patterns
   */
  private async getPredictiveStrategy(): Promise<WarmingStrategy> {
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const currentDay = now.getDay();
    
    // Predict what will be needed in the next hour
    const predictions: Array<{id: string; confidence: number}> = [];
    
    this.accessHistory.forEach((history, patternId) => {
      // Look for patterns in the next hour
      const futureAccesses = history.filter(h => 
        h.hourOfDay === nextHour && 
        h.dayOfWeek === currentDay
      );
      
      if (futureAccesses.length > 0) {
        // Calculate confidence based on consistency
        const avgCount = futureAccesses.reduce((sum, h) => sum + h.count, 0) / futureAccesses.length;
        const confidence = Math.min(1, avgCount / 10); // Normalize to 0-1
        
        predictions.push({ id: patternId, confidence });
      }
    });
    
    // Also check for patterns that follow sequences
    const sequentialPatterns = await this.findSequentialPatterns();
    sequentialPatterns.forEach(({ id, confidence }) => {
      const existing = predictions.find(p => p.id === id);
      if (existing) {
        existing.confidence = Math.max(existing.confidence, confidence);
      } else {
        predictions.push({ id, confidence });
      }
    });
    
    // Sort by confidence and take top predictions
    predictions.sort((a, b) => b.confidence - a.confidence);
    const patterns = predictions
      .filter(p => p.confidence > 0.3)
      .slice(0, 40)
      .map(p => p.id);
    
    return {
      patterns,
      priority: 'normal',
      ttl: 1800, // 30 minutes for predictions
      reason: `Predictive: Expected for ${nextHour}:00`
    };
  }

  /**
   * Find patterns that are often accessed in sequence
   */
  private async findSequentialPatterns(): Promise<Array<{id: string; confidence: number}>> {
    // This would analyze access logs to find patterns like:
    // "When pattern A is accessed, pattern B is usually accessed within 5 minutes"
    // For now, return empty array - this is a placeholder for future ML enhancement
    return [];
  }

  /**
   * Merge multiple strategies and deduplicate
   */
  private mergeStrategies(strategies: WarmingStrategy[]): Map<string, WarmingStrategy> {
    const merged = new Map<string, WarmingStrategy>();
    
    // Process by priority: critical > high > normal
    const priorityOrder = ['critical', 'high', 'normal'] as const;
    
    priorityOrder.forEach(priority => {
      strategies
        .filter(s => s.priority === priority)
        .forEach(strategy => {
          strategy.patterns.forEach(patternId => {
            if (!merged.has(patternId)) {
              merged.set(patternId, {
                patterns: [patternId],
                priority: strategy.priority,
                ttl: strategy.ttl,
                reason: strategy.reason
              });
            }
          });
        });
    });
    
    return merged;
  }

  /**
   * Batch patterns for warming
   */
  private *batchPatterns(patterns: Map<string, WarmingStrategy>, batchSize: number) {
    const entries = Array.from(patterns.entries());
    for (let i = 0; i < entries.length; i += batchSize) {
      yield entries.slice(i, i + batchSize);
    }
  }

  /**
   * Warm a batch of patterns
   */
  private async warmPatternBatch(batch: Array<[string, WarmingStrategy]>): Promise<void> {
    const promises = batch.map(async ([patternId, strategy]) => {
      try {
        // Check if already cached
        const cached = await this.cache.getPattern(patternId);
        if (cached) {
          return; // Already warm
        }
        
        // Fetch from storage
        const pattern = await this.fetchPattern(patternId);
        if (pattern) {
          // Cache with appropriate TTL
          await this.cache.setex(
            `pattern:${patternId}`,
            strategy.ttl,
            JSON.stringify(pattern)
          );
          
          // Also add to appropriate cache tier
          const tier = this.determineCacheTier(strategy.priority);
          await this.cache.setex(
            `${tier}:${patternId}`,
            strategy.ttl,
            JSON.stringify(pattern)
          );
        }
      } catch (error) {
        this.logger.error(`Failed to warm pattern ${patternId}:`, error);
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * Fetch pattern from storage
   */
  private async fetchPattern(patternId: string): Promise<HarmonicPatternMemory | null> {
    // Try each storage layer
    try {
      // Check DPCM first (fastest)
      const dpcmPattern = this.storageManager.dpcm.getPattern(patternId);
      if (dpcmPattern) return dpcmPattern;
      
      // Then check analytics/DuckDB
      const patterns = await this.storageManager.analytics.getPatternById(patternId);
      if (patterns.length > 0) return patterns[0];
      
      // Finally check Neo4j
      const neo4jPattern = await this.storageManager.neo4j.getPattern(patternId);
      return neo4jPattern;
      
    } catch (error) {
      this.logger.error(`Error fetching pattern ${patternId}:`, error);
      return null;
    }
  }

  /**
   * Determine cache tier based on priority
   */
  private determineCacheTier(priority: WarmingStrategy['priority']): 'hot' | 'warm' | 'cold' {
    switch (priority) {
      case 'critical': return 'hot';
      case 'high': return 'warm';
      case 'normal': return 'cold';
    }
  }

  /**
   * Get warming statistics
   */
  getStats(): {
    accessHistorySize: number;
    isWarming: boolean;
    config: WarmingConfig;
  } {
    return {
      accessHistorySize: this.accessHistory.size,
      isWarming: this.isWarming,
      config: this.config
    };
  }

  /**
   * Clear access history
   */
  clearHistory(): void {
    this.accessHistory.clear();
    this.logger.info('Cleared cache warming history');
  }
}