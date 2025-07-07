/**
 * Storage Tier Migrator
 * Automatically moves patterns between storage tiers based on usage patterns
 */

import { StorageManager } from '../storage/storage-manager.js';
import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';
import { EventEmitter } from 'events';

export interface MigrationCandidate {
  patternId: string;
  currentTier: 'premium' | 'standard' | 'archive';
  suggestedTier: 'premium' | 'standard' | 'archive';
  reason: string;
  score: number;
  lastAccessed: number;
  accessCount: number;
}

export interface MigrationStats {
  promoted: number;
  demoted: number;
  unchanged: number;
  errors: number;
}

export interface MigrationConfig {
  enabled: boolean;
  interval: number; // ms between migration cycles
  batchSize: number;
  thresholds: {
    promotionAccessCount: number; // Min accesses for promotion
    promotionRecency: number; // Max days since last access for promotion
    demotionInactivity: number; // Days of inactivity for demotion
    scoreImprovement: number; // Min score increase for promotion
  };
}

/**
 * Manages automatic pattern migration between storage tiers
 */
export class StorageTierMigrator extends EventEmitter {
  private logger = Logger.getInstance();
  private migrationTimer?: NodeJS.Timer;
  private isMigrating: boolean = false;
  private migrationHistory: Map<string, Date> = new Map();
  
  private readonly defaultConfig: MigrationConfig = {
    enabled: true,
    interval: 3600000, // 1 hour
    batchSize: 100,
    thresholds: {
      promotionAccessCount: 10,
      promotionRecency: 1, // 1 day
      demotionInactivity: 7, // 7 days
      scoreImprovement: 0.1
    }
  };

  constructor(
    private storageManager: StorageManager,
    private config: MigrationConfig = {} as MigrationConfig
  ) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Start the migration process
   */
  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Storage tier migration is disabled');
      return;
    }

    this.logger.info('📦 Starting storage tier migrator');
    
    // Initial migration
    this.migrate().catch(err => 
      this.logger.error('Initial migration failed:', err)
    );
    
    // Schedule periodic migrations
    this.migrationTimer = setInterval(() => {
      if (!this.isMigrating) {
        this.migrate().catch(err => 
          this.logger.error('Periodic migration failed:', err)
        );
      }
    }, this.config.interval);
  }

  /**
   * Stop the migration process
   */
  stop(): void {
    if (this.migrationTimer) {
      clearInterval(this.migrationTimer);
      this.migrationTimer = undefined;
    }
    this.logger.info('🛑 Stopped storage tier migrator');
  }

  /**
   * Main migration logic
   */
  private async migrate(): Promise<void> {
    this.isMigrating = true;
    const startTime = Date.now();
    const stats: MigrationStats = {
      promoted: 0,
      demoted: 0,
      unchanged: 0,
      errors: 0
    };
    
    try {
      this.logger.debug('Starting migration cycle...');
      
      // Get migration candidates
      const candidates = await this.identifyCandidates();
      
      this.logger.debug(`Found ${candidates.length} migration candidates`);
      
      // Process candidates in batches
      for (const batch of this.batchCandidates(candidates, this.config.batchSize)) {
        await this.processBatch(batch, stats);
      }
      
      const duration = Date.now() - startTime;
      
      this.logger.info(
        `Migration completed: ${stats.promoted} promoted, ${stats.demoted} demoted, ` +
        `${stats.unchanged} unchanged, ${stats.errors} errors (${duration}ms)`
      );
      
      this.emit('migration:complete', {
        stats,
        duration,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.logger.error('Migration error:', error);
      this.emit('migration:error', error);
    } finally {
      this.isMigrating = false;
    }
  }

  /**
   * Identify patterns that should be migrated
   */
  private async identifyCandidates(): Promise<MigrationCandidate[]> {
    const candidates: MigrationCandidate[] = [];
    
    // Get all patterns with their current storage location
    const patterns = await this.getAllPatternsWithMetadata();
    
    for (const { pattern, tier } of patterns) {
      const candidate = this.evaluatePattern(pattern, tier);
      if (candidate && candidate.currentTier !== candidate.suggestedTier) {
        candidates.push(candidate);
      }
    }
    
    // Sort by migration priority (promotions first, then by score)
    return candidates.sort((a, b) => {
      // Promotions have priority
      if (a.suggestedTier > a.currentTier && b.suggestedTier <= b.currentTier) return -1;
      if (b.suggestedTier > b.currentTier && a.suggestedTier <= a.currentTier) return 1;
      
      // Then by score
      return b.score - a.score;
    });
  }

  /**
   * Evaluate a pattern and determine if it should be migrated
   */
  private evaluatePattern(
    pattern: HarmonicPatternMemory,
    currentTier: 'premium' | 'standard' | 'archive'
  ): MigrationCandidate | null {
    const now = Date.now();
    const daysSinceAccess = (now - pattern.lastAccessed) / (1000 * 60 * 60 * 24);
    const daysSinceCreation = (now - pattern.createdAt) / (1000 * 60 * 60 * 24);
    
    // Check if recently migrated (avoid ping-ponging)
    const lastMigration = this.migrationHistory.get(pattern.id);
    if (lastMigration && (now - lastMigration.getTime()) < 24 * 60 * 60 * 1000) {
      return null; // Skip if migrated within last 24 hours
    }
    
    // Calculate current quality score
    const qualityManager = this.storageManager.getQualityManager();
    const metrics = qualityManager.assessQuality(pattern);
    
    let suggestedTier: 'premium' | 'standard' | 'archive' = currentTier;
    let reason = '';
    
    // Promotion logic
    if (currentTier !== 'premium') {
      if (
        pattern.accessCount >= this.config.thresholds.promotionAccessCount &&
        daysSinceAccess <= this.config.thresholds.promotionRecency &&
        metrics.overallScore >= 0.85
      ) {
        suggestedTier = 'premium';
        reason = `High activity (${pattern.accessCount} accesses) and quality (${metrics.overallScore.toFixed(2)})`;
      } else if (
        currentTier === 'archive' &&
        pattern.accessCount >= this.config.thresholds.promotionAccessCount / 2 &&
        metrics.overallScore >= 0.70
      ) {
        suggestedTier = 'standard';
        reason = `Moderate activity recovery from archive`;
      }
    }
    
    // Demotion logic
    if (suggestedTier === currentTier) {
      if (
        currentTier === 'premium' &&
        daysSinceAccess > this.config.thresholds.demotionInactivity
      ) {
        suggestedTier = 'standard';
        reason = `Inactive for ${daysSinceAccess.toFixed(0)} days`;
      } else if (
        currentTier === 'standard' &&
        daysSinceAccess > this.config.thresholds.demotionInactivity * 2
      ) {
        suggestedTier = 'archive';
        reason = `Very inactive (${daysSinceAccess.toFixed(0)} days)`;
      } else if (
        metrics.overallScore < 0.5 &&
        daysSinceCreation > 30
      ) {
        // Low quality patterns that are old
        suggestedTier = 'archive';
        reason = `Low quality score (${metrics.overallScore.toFixed(2)})`;
      }
    }
    
    if (suggestedTier === currentTier) {
      return null;
    }
    
    return {
      patternId: pattern.id,
      currentTier,
      suggestedTier,
      reason,
      score: metrics.overallScore,
      lastAccessed: pattern.lastAccessed,
      accessCount: pattern.accessCount
    };
  }

  /**
   * Process a batch of migration candidates
   */
  private async processBatch(
    candidates: MigrationCandidate[],
    stats: MigrationStats
  ): Promise<void> {
    const migrations = candidates.map(async (candidate) => {
      try {
        await this.migratePattern(candidate);
        
        if (candidate.suggestedTier > candidate.currentTier) {
          stats.promoted++;
        } else {
          stats.demoted++;
        }
        
        // Record migration
        this.migrationHistory.set(candidate.patternId, new Date());
        
        this.emit('pattern:migrated', candidate);
        
      } catch (error) {
        this.logger.error(`Failed to migrate pattern ${candidate.patternId}:`, error);
        stats.errors++;
      }
    });
    
    await Promise.all(migrations);
  }

  /**
   * Migrate a single pattern
   */
  private async migratePattern(candidate: MigrationCandidate): Promise<void> {
    const { patternId, currentTier, suggestedTier, reason } = candidate;
    
    this.logger.debug(
      `Migrating ${patternId} from ${currentTier} to ${suggestedTier}: ${reason}`
    );
    
    // Get the pattern data
    const pattern = await this.getPatternFromTier(patternId, currentTier);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found in ${currentTier}`);
    }
    
    // Store in new tier
    await this.storeInTier(pattern, suggestedTier);
    
    // Remove from old tier (if different storage)
    if (currentTier !== suggestedTier) {
      await this.removeFromTier(patternId, currentTier);
    }
    
    // Update cache tier
    await this.updateCacheTier(pattern, suggestedTier);
  }

  /**
   * Get all patterns with their current storage tier
   */
  private async getAllPatternsWithMetadata(): Promise<Array<{
    pattern: HarmonicPatternMemory;
    tier: 'premium' | 'standard' | 'archive';
  }>> {
    const results: Array<{ pattern: HarmonicPatternMemory; tier: 'premium' | 'standard' | 'archive' }> = [];
    
    // Get patterns from each storage tier
    // Note: In production, we'd query each storage to identify which patterns are where
    // For now, we'll use the quality score to determine current tier
    
    const allPatterns = this.storageManager.dpcm.getAllPatterns();
    
    for (const pattern of allPatterns) {
      const qualityManager = this.storageManager.getQualityManager();
      const metrics = qualityManager.assessQuality(pattern);
      
      // Determine current tier based on quality
      let tier: 'premium' | 'standard' | 'archive';
      if (metrics.overallScore >= 0.85) {
        tier = 'premium';
      } else if (metrics.overallScore >= 0.70) {
        tier = 'standard';
      } else {
        tier = 'archive';
      }
      
      results.push({ pattern, tier });
    }
    
    return results;
  }

  /**
   * Get pattern from specific tier
   */
  private async getPatternFromTier(
    patternId: string,
    tier: 'premium' | 'standard' | 'archive'
  ): Promise<HarmonicPatternMemory | null> {
    switch (tier) {
      case 'premium':
        return this.storageManager.qpfm?.getPattern?.(patternId) || null;
      case 'standard':
        return await this.storageManager.neo4j.getPattern(patternId);
      case 'archive':
        const patterns = await this.storageManager.analytics.getPatternById(patternId);
        return patterns.length > 0 ? patterns[0] : null;
    }
  }

  /**
   * Store pattern in specific tier
   */
  private async storeInTier(
    pattern: HarmonicPatternMemory,
    tier: 'premium' | 'standard' | 'archive'
  ): Promise<void> {
    switch (tier) {
      case 'premium':
        if (this.storageManager.qpfm) {
          await this.storageManager.qpfm.store(pattern);
        }
        break;
      case 'standard':
        await this.storageManager.neo4j.createPattern(pattern);
        break;
      case 'archive':
        await this.storageManager.analytics.storePattern(pattern);
        break;
    }
  }

  /**
   * Remove pattern from specific tier
   */
  private async removeFromTier(
    patternId: string,
    tier: 'premium' | 'standard' | 'archive'
  ): Promise<void> {
    // In production, each storage would have a delete method
    // For now, we'll log the removal
    this.logger.debug(`Would remove ${patternId} from ${tier} storage`);
  }

  /**
   * Update cache tier for migrated pattern
   */
  private async updateCacheTier(
    pattern: HarmonicPatternMemory,
    newTier: 'premium' | 'standard' | 'archive'
  ): Promise<void> {
    const cache = this.storageManager.cache;
    
    // Remove from old cache tiers
    await Promise.all([
      cache.client.del(`hot:${pattern.id}`),
      cache.client.del(`warm:${pattern.id}`),
      cache.client.del(`cold:${pattern.id}`)
    ]);
    
    // Add to new cache tier
    const tierMap = {
      premium: { key: 'hot', ttl: 3600 },
      standard: { key: 'warm', ttl: 300 },
      archive: { key: 'cold', ttl: 30 }
    };
    
    const { key, ttl } = tierMap[newTier];
    await cache.setex(`${key}:${pattern.id}`, ttl, JSON.stringify(pattern));
  }

  /**
   * Batch candidates for processing
   */
  private *batchCandidates(
    candidates: MigrationCandidate[],
    batchSize: number
  ): Generator<MigrationCandidate[]> {
    for (let i = 0; i < candidates.length; i += batchSize) {
      yield candidates.slice(i, i + batchSize);
    }
  }

  /**
   * Get migration statistics
   */
  getStats(): {
    isMigrating: boolean;
    historySize: number;
    config: MigrationConfig;
  } {
    return {
      isMigrating: this.isMigrating,
      historySize: this.migrationHistory.size,
      config: this.config
    };
  }

  /**
   * Clear migration history
   */
  clearHistory(): void {
    this.migrationHistory.clear();
    this.logger.info('Cleared migration history');
  }
}