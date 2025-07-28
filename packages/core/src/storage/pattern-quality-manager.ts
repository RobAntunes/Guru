/**
 * Pattern Quality Manager
 * Routes patterns to optimal storage based on quality tiers
 */

import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';
import { UnifiedStorageManager } from './unified-storage-manager.js';
import { Logger } from '../logging/logger.js';

export interface QualityTier {
  name: 'premium' | 'standard' | 'archive';
  threshold: number;
  storage: 'qpfm' | 'neo4j' | 'duckdb';
  cache: 'hot' | 'warm' | 'cold';
  ttl: number; // Cache TTL in seconds
  features: string[];
}

export interface QualityMetrics {
  overallScore: number;
  tier: QualityTier;
  breakdown: {
    strength: number;
    confidence: number;
    complexity: number;
    occurrences: number;
    freshness: number;
  };
}

/**
 * Manages pattern quality assessment and storage routing
 */
export class PatternQualityManager {
  private logger = Logger.getInstance();
  
  // Quality tiers based on our performance data
  private readonly tiers: QualityTier[] = [
    {
      name: 'premium',
      threshold: 0.85,
      storage: 'qpfm',
      cache: 'hot',
      ttl: 3600, // 1 hour
      features: ['quantum_search', 'similarity', 'real_time_access']
    },
    {
      name: 'standard',
      threshold: 0.70,
      storage: 'neo4j',
      cache: 'warm',
      ttl: 300, // 5 minutes
      features: ['graph_traversal', 'relationship_analysis']
    },
    {
      name: 'archive',
      threshold: 0.50,
      storage: 'duckdb',
      cache: 'cold',
      ttl: 30, // 30 seconds
      features: ['time_series', 'bulk_analysis', 'historical']
    }
  ];

  // Category-specific quality weights
  private readonly categoryWeights = new Map<PatternCategory, {
    strength: number;
    confidence: number;
    complexity: number;
    occurrences: number;
  }>([
    [PatternCategory.AUTHENTICATION, { strength: 0.4, confidence: 0.3, complexity: 0.2, occurrences: 0.1 }],
    [PatternCategory.CRYPTOGRAPHIC, { strength: 0.5, confidence: 0.3, complexity: 0.1, occurrences: 0.1 }],
    [PatternCategory.ERROR_PATTERN, { strength: 0.3, confidence: 0.2, complexity: 0.2, occurrences: 0.3 }],
    [PatternCategory.STRUCTURAL, { strength: 0.3, confidence: 0.2, complexity: 0.3, occurrences: 0.2 }],
    // Default weights
    ['default', { strength: 0.35, confidence: 0.25, complexity: 0.25, occurrences: 0.15 }]
  ]);

  constructor(private storageManager: UnifiedStorageManager) {}

  /**
   * Assess pattern quality and determine storage tier
   */
  assessQuality(pattern: HarmonicPatternMemory): QualityMetrics {
    const props = pattern.harmonicProperties;
    
    // Get category-specific weights
    const weights = this.categoryWeights.get(props.category) || 
                   this.categoryWeights.get('default' as any)!;
    
    // Calculate component scores
    const breakdown = {
      strength: props.strength,
      confidence: props.confidence,
      complexity: this.normalizeComplexity(props.complexity),
      occurrences: this.normalizeOccurrences(props.occurrences),
      freshness: this.calculateFreshness(pattern.createdAt)
    };
    
    // Calculate weighted overall score
    const overallScore = 
      breakdown.strength * weights.strength +
      breakdown.confidence * weights.confidence +
      breakdown.complexity * weights.complexity +
      breakdown.occurrences * weights.occurrences +
      breakdown.freshness * 0.1; // Bonus for recent patterns
    
    // Determine tier
    const tier = this.getTier(overallScore);
    
    return {
      overallScore: Math.min(1, overallScore),
      tier,
      breakdown
    };
  }

  /**
   * Route pattern to appropriate storage based on quality
   */
  async routePattern(pattern: HarmonicPatternMemory): Promise<void> {
    const metrics = this.assessQuality(pattern);
    
    this.logger.debug(
      `Pattern ${pattern.id} assessed: score=${metrics.overallScore.toFixed(3)}, tier=${metrics.tier.name}`
    );
    
    // Route to appropriate storage
    switch (metrics.tier.storage) {
      case 'qpfm':
        // Premium patterns get quantum storage
        if (this.storageManager.qpfm) {
          await this.storageManager.qpfm.store(pattern);
          
          // Also add to hot cache
          if (this.storageManager.redis) {
            await this.storageManager.redis.setex(
              `hot:${pattern.id}`,
              metrics.tier.ttl,
              JSON.stringify(pattern)
            );
          }
        }
        break;
        
      case 'neo4j':
        // Standard patterns go to graph database
        if (this.storageManager.neo4j) {
          await this.storageManager.neo4j.createPattern(pattern);
          
          // Add to warm cache
          if (this.storageManager.redis) {
            await this.storageManager.redis.setex(
              `warm:${pattern.id}`,
              metrics.tier.ttl,
              JSON.stringify(pattern)
            );
          }
        }
        break;
        
      case 'duckdb':
        // Archive patterns go to data lake
        if (this.storageManager.analytics) {
          await this.storageManager.analytics.storePattern(pattern);
        }
        
        // Minimal caching for archive
        if (this.storageManager.redis && Math.random() < 0.1) { // Only cache 10%
          await this.storageManager.redis.setex(
            `cold:${pattern.id}`,
            metrics.tier.ttl,
            JSON.stringify(pattern)
          );
        }
        break;
    }
    
    // Store quality metrics for later analysis
    await this.storeQualityMetrics(pattern.id, metrics);
  }

  /**
   * Bulk route patterns with quality optimization
   */
  async bulkRoutePatterns(patterns: HarmonicPatternMemory[]): Promise<void> {
    // Assess all patterns first
    const assessments = patterns.map(p => ({
      pattern: p,
      metrics: this.assessQuality(p)
    }));
    
    // Group by tier for batch processing
    const byTier = {
      premium: assessments.filter(a => a.metrics.tier.name === 'premium'),
      standard: assessments.filter(a => a.metrics.tier.name === 'standard'),
      archive: assessments.filter(a => a.metrics.tier.name === 'archive')
    };
    
    // Process each tier in parallel
    await Promise.all([
      this.storePremiumBatch(byTier.premium),
      this.storeStandardBatch(byTier.standard),
      this.storeArchiveBatch(byTier.archive)
    ]);
    
    this.logger.info(
      `Routed ${patterns.length} patterns: ` +
      `${byTier.premium.length} premium, ` +
      `${byTier.standard.length} standard, ` +
      `${byTier.archive.length} archive`
    );
  }

  /**
   * Get storage recommendations based on pattern distribution
   */
  async getStorageRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze recent quality metrics
    const recentMetrics = await this.getRecentQualityMetrics(1000);
    
    const tierCounts = {
      premium: 0,
      standard: 0,
      archive: 0
    };
    
    recentMetrics.forEach(m => {
      tierCounts[m.tier.name]++;
    });
    
    // Generate recommendations
    if (tierCounts.premium > recentMetrics.length * 0.3) {
      recommendations.push('High premium pattern ratio - consider expanding QPFM capacity');
    }
    
    if (tierCounts.archive > recentMetrics.length * 0.5) {
      recommendations.push('Many archive patterns - implement automated cleanup policy');
    }
    
    const avgScore = recentMetrics.reduce((sum, m) => sum + m.overallScore, 0) / recentMetrics.length;
    if (avgScore < 0.7) {
      recommendations.push(`Average quality score ${avgScore.toFixed(2)} - review pattern generation`);
    }
    
    return recommendations;
  }

  // Private helper methods

  private getTier(score: number): QualityTier {
    return this.tiers.find(t => score >= t.threshold) || this.tiers[this.tiers.length - 1];
  }

  private normalizeComplexity(complexity: number): number {
    // Normalize complexity to 0-1 range (assuming max complexity of 10)
    return Math.min(1, complexity / 10);
  }

  private normalizeOccurrences(occurrences: number): number {
    // Log scale normalization for occurrences
    return Math.min(1, Math.log10(occurrences + 1) / 2);
  }

  private calculateFreshness(createdAt: number): number {
    const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    // Exponential decay: fresh patterns score higher
    return Math.exp(-ageHours / 24); // Half-life of 24 hours
  }

  private async storePremiumBatch(items: Array<{pattern: HarmonicPatternMemory, metrics: QualityMetrics}>) {
    if (items.length === 0 || !this.storageManager.qpfm) return;
    
    // Store in QPFM with bulk operation
    await Promise.all(items.map(({ pattern }) => 
      this.storageManager.qpfm!.store(pattern)
    ));
    
    // Cache all premium patterns
    if (this.storageManager.redis) {
      const pipeline = this.storageManager.redis.pipeline();
      items.forEach(({ pattern, metrics }) => {
        pipeline.setex(
          `hot:${pattern.id}`,
          metrics.tier.ttl,
          JSON.stringify(pattern)
        );
      });
      await pipeline.exec();
    }
  }

  private async storeStandardBatch(items: Array<{pattern: HarmonicPatternMemory, metrics: QualityMetrics}>) {
    if (items.length === 0 || !this.storageManager.neo4j) return;
    
    // Batch create in Neo4j
    await Promise.all(items.map(({ pattern }) => 
      this.storageManager.neo4j!.createPattern(pattern)
    ));
    
    // Cache selectively
    if (this.storageManager.redis) {
      const pipeline = this.storageManager.redis.pipeline();
      items.slice(0, 50).forEach(({ pattern, metrics }) => { // Cache first 50
        pipeline.setex(
          `warm:${pattern.id}`,
          metrics.tier.ttl,
          JSON.stringify(pattern)
        );
      });
      await pipeline.exec();
    }
  }

  private async storeArchiveBatch(items: Array<{pattern: HarmonicPatternMemory, metrics: QualityMetrics}>) {
    if (items.length === 0 || !this.storageManager.analytics) return;
    
    // Bulk store in analytics
    await this.storageManager.analytics.storePatterns(
      items.map(({ pattern }) => pattern)
    );
    
    // Minimal caching for archive tier
    if (this.storageManager.redis && items.length > 0) {
      const selected = items.slice(0, Math.ceil(items.length * 0.1)); // Cache 10%
      const pipeline = this.storageManager.redis.pipeline();
      selected.forEach(({ pattern, metrics }) => {
        pipeline.setex(
          `cold:${pattern.id}`,
          metrics.tier.ttl,
          JSON.stringify(pattern)
        );
      });
      await pipeline.exec();
    }
  }

  private async storeQualityMetrics(patternId: string, metrics: QualityMetrics): Promise<void> {
    if (!this.storageManager.redis) return;
    
    // Store metrics with expiry
    await this.storageManager.redis.setex(
      `quality:${patternId}`,
      86400, // 24 hours
      JSON.stringify({
        ...metrics,
        timestamp: Date.now()
      })
    );
  }

  private async getRecentQualityMetrics(limit: number): Promise<QualityMetrics[]> {
    if (!this.storageManager.redis) return [];
    
    // Get recent quality metrics for analysis
    const keys = await this.storageManager.redis.keys('quality:*');
    const metrics: QualityMetrics[] = [];
    
    for (const key of keys.slice(0, limit)) {
      const data = await this.storageManager.redis.get(key);
      if (data) {
        metrics.push(JSON.parse(data));
      }
    }
    
    return metrics;
  }
}