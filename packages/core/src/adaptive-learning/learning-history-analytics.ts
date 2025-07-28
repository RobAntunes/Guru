/**
 * Learning History & Analytics System
 * 
 * Advanced analytics and visualization for adaptive learning progress.
 * Tracks learning patterns, identifies trends, and provides actionable insights.
 */

import { EventEmitter } from 'events';
import { LearningEvent } from './unified-learning-coordinator.js';

export interface LearningPattern {
  id: string;
  type: 'cyclic' | 'progressive' | 'plateau' | 'regression' | 'breakthrough';
  startTime: Date;
  endTime?: Date;
  events: LearningEvent[];
  metrics: {
    duration: number;
    frequency: number;
    effectiveness: number;
    stability: number;
  };
  insights: string[];
}

export interface LearningTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number; // Change rate per hour
  confidence: number;
  prediction: {
    nextHour: number;
    nextDay: number;
    confidence: number;
  };
}

export interface LearningMilestone {
  id: string;
  name: string;
  achievedAt: Date;
  criteria: {
    metric: string;
    threshold: number;
    sustained: boolean;
  };
  impact: {
    performanceGain: number;
    learningAcceleration: number;
    systemImprovement: number;
  };
}

export interface LearningDomain {
  name: string;
  expertise: number; // 0-1 scale
  learningRate: number;
  lastActive: Date;
  totalEvents: number;
  successRate: number;
  subdomains: Map<string, LearningDomain>;
}

export interface AnalyticsConfig {
  historyRetentionDays: number;
  patternDetectionWindow: number; // hours
  trendAnalysisWindow: number; // hours
  milestoneThresholds: {
    performance: number;
    consistency: number;
    breakthrough: number;
  };
  domainDecayRate: number; // expertise decay per day of inactivity
}

export class LearningHistoryAnalytics extends EventEmitter {
  private history: LearningEvent[] = [];
  private patterns: Map<string, LearningPattern> = new Map();
  private milestones: Map<string, LearningMilestone> = new Map();
  private domains: Map<string, LearningDomain> = new Map();
  private analyticsCache: Map<string, any> = new Map();
  private lastAnalysis: Date = new Date();
  
  constructor(private config: AnalyticsConfig) {
    super();
    this.startPeriodicAnalysis();
  }
  
  /**
   * Add learning event to history
   */
  addEvent(event: LearningEvent): void {
    this.history.push(event);
    this.updateDomain(event);
    
    // Trigger real-time pattern detection
    this.detectRealtimePatterns(event);
    
    // Check for milestone achievements
    this.checkMilestones(event);
    
    // Clean old history
    this.cleanOldHistory();
    
    this.emit('event-added', event);
  }
  
  /**
   * Analyze learning patterns over time
   */
  async analyzeLearningPatterns(): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const windowSize = this.config.patternDetectionWindow * 3600000; // Convert to ms
    const now = Date.now();
    
    // Detect cyclic patterns
    const cyclicPattern = this.detectCyclicPattern(windowSize);
    if (cyclicPattern) patterns.push(cyclicPattern);
    
    // Detect progressive improvement
    const progressivePattern = this.detectProgressivePattern(windowSize);
    if (progressivePattern) patterns.push(progressivePattern);
    
    // Detect learning plateaus
    const plateauPattern = this.detectPlateauPattern(windowSize);
    if (plateauPattern) patterns.push(plateauPattern);
    
    // Detect breakthroughs
    const breakthroughPattern = this.detectBreakthroughPattern(windowSize);
    if (breakthroughPattern) patterns.push(breakthroughPattern);
    
    // Cache patterns
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
    }
    
    return patterns;
  }
  
  /**
   * Analyze learning trends
   */
  async analyzeTrends(): Promise<LearningTrend[]> {
    const trends: LearningTrend[] = [];
    const windowSize = this.config.trendAnalysisWindow * 3600000;
    const recentEvents = this.getRecentEvents(windowSize);
    
    if (recentEvents.length < 10) {
      return trends; // Not enough data
    }
    
    // Analyze success rate trend
    const successTrend = this.analyzeMetricTrend(recentEvents, 'success');
    if (successTrend) trends.push(successTrend);
    
    // Analyze confidence trend
    const confidenceTrend = this.analyzeMetricTrend(recentEvents, 'confidence');
    if (confidenceTrend) trends.push(confidenceTrend);
    
    // Analyze learning velocity trend
    const velocityTrend = this.analyzeVelocityTrend(recentEvents);
    if (velocityTrend) trends.push(velocityTrend);
    
    // Analyze novelty trend
    const noveltyTrend = this.analyzeMetricTrend(recentEvents, 'novelty');
    if (noveltyTrend) trends.push(noveltyTrend);
    
    return trends;
  }
  
  /**
   * Get comprehensive analytics report
   */
  async getAnalyticsReport(): Promise<{
    overview: {
      totalEvents: number;
      timeSpan: number;
      activeDomains: number;
      overallProgress: number;
    };
    patterns: LearningPattern[];
    trends: LearningTrend[];
    milestones: LearningMilestone[];
    domains: {
      name: string;
      expertise: number;
      trend: string;
    }[];
    recommendations: string[];
  }> {
    const patterns = await this.analyzeLearningPatterns();
    const trends = await this.analyzeTrends();
    const milestones = Array.from(this.milestones.values());
    
    // Calculate overview metrics
    const timeSpan = this.history.length > 0 
      ? Date.now() - this.history[0].timestamp.getTime()
      : 0;
    
    const activeDomains = Array.from(this.domains.values())
      .filter(d => Date.now() - d.lastActive.getTime() < 86400000).length; // Active in last day
    
    const overallProgress = this.calculateOverallProgress();
    
    // Get domain summaries
    const domainSummaries = Array.from(this.domains.values())
      .map(d => ({
        name: d.name,
        expertise: d.expertise,
        trend: this.getDomainTrend(d)
      }))
      .sort((a, b) => b.expertise - a.expertise)
      .slice(0, 10); // Top 10 domains
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns, trends);
    
    return {
      overview: {
        totalEvents: this.history.length,
        timeSpan,
        activeDomains,
        overallProgress
      },
      patterns,
      trends,
      milestones,
      domains: domainSummaries,
      recommendations
    };
  }
  
  /**
   * Detect cyclic learning patterns
   */
  private detectCyclicPattern(windowSize: number): LearningPattern | null {
    const recentEvents = this.getRecentEvents(windowSize);
    if (recentEvents.length < 20) return null;
    
    // Look for repeating success/failure cycles
    const cycleLength = this.findCycleLength(recentEvents);
    
    if (cycleLength > 0 && cycleLength < recentEvents.length / 2) {
      const cycles = Math.floor(recentEvents.length / cycleLength);
      const effectiveness = this.calculateCycleEffectiveness(recentEvents, cycleLength);
      
      return {
        id: `cyclic-${Date.now()}`,
        type: 'cyclic',
        startTime: recentEvents[0].timestamp,
        events: recentEvents,
        metrics: {
          duration: cycleLength * 3600000, // Assume hours
          frequency: cycles,
          effectiveness,
          stability: 0.7 // Cyclic patterns have moderate stability
        },
        insights: [
          `Detected ${cycles} learning cycles of ${cycleLength} events each`,
          `Cycle effectiveness: ${(effectiveness * 100).toFixed(1)}%`,
          `Consider breaking cyclic patterns for better progress`
        ]
      };
    }
    
    return null;
  }
  
  /**
   * Detect progressive improvement pattern
   */
  private detectProgressivePattern(windowSize: number): LearningPattern | null {
    const recentEvents = this.getRecentEvents(windowSize);
    if (recentEvents.length < 10) return null;
    
    // Calculate improvement rate
    const improvements = this.calculateImprovementRate(recentEvents);
    
    if (improvements.rate > 0.1) { // 10% improvement threshold
      return {
        id: `progressive-${Date.now()}`,
        type: 'progressive',
        startTime: recentEvents[0].timestamp,
        events: recentEvents,
        metrics: {
          duration: windowSize,
          frequency: recentEvents.length,
          effectiveness: improvements.rate,
          stability: improvements.consistency
        },
        insights: [
          `Progressive improvement detected: ${(improvements.rate * 100).toFixed(1)}% gain`,
          `Consistency: ${(improvements.consistency * 100).toFixed(1)}%`,
          `Maintain current learning strategies`
        ]
      };
    }
    
    return null;
  }
  
  /**
   * Detect learning plateau pattern
   */
  private detectPlateauPattern(windowSize: number): LearningPattern | null {
    const recentEvents = this.getRecentEvents(windowSize);
    if (recentEvents.length < 15) return null;
    
    // Calculate variance in performance
    const variance = this.calculatePerformanceVariance(recentEvents);
    
    if (variance < 0.05) { // Low variance indicates plateau
      const avgPerformance = this.calculateAveragePerformance(recentEvents);
      
      return {
        id: `plateau-${Date.now()}`,
        type: 'plateau',
        startTime: recentEvents[0].timestamp,
        events: recentEvents,
        metrics: {
          duration: windowSize,
          frequency: recentEvents.length,
          effectiveness: avgPerformance,
          stability: 0.9 // High stability in plateau
        },
        insights: [
          `Learning plateau detected at ${(avgPerformance * 100).toFixed(1)}% performance`,
          `Low variation (${(variance * 100).toFixed(2)}%) indicates stagnation`,
          `Consider introducing new challenges or strategies`
        ]
      };
    }
    
    return null;
  }
  
  /**
   * Detect breakthrough pattern
   */
  private detectBreakthroughPattern(windowSize: number): LearningPattern | null {
    const recentEvents = this.getRecentEvents(windowSize / 4); // Look at recent quarter
    if (recentEvents.length < 5) return null;
    
    const olderEvents = this.getEventsInRange(windowSize, windowSize / 4);
    if (olderEvents.length < 10) return null;
    
    const recentPerformance = this.calculateAveragePerformance(recentEvents);
    const olderPerformance = this.calculateAveragePerformance(olderEvents);
    
    const improvement = (recentPerformance - olderPerformance) / olderPerformance;
    
    if (improvement > 0.3) { // 30% sudden improvement
      return {
        id: `breakthrough-${Date.now()}`,
        type: 'breakthrough',
        startTime: recentEvents[0].timestamp,
        events: recentEvents,
        metrics: {
          duration: windowSize / 4,
          frequency: recentEvents.length,
          effectiveness: recentPerformance,
          stability: 0.5 // Breakthroughs may not be stable initially
        },
        insights: [
          `Breakthrough detected: ${(improvement * 100).toFixed(1)}% improvement`,
          `Performance jumped from ${(olderPerformance * 100).toFixed(1)}% to ${(recentPerformance * 100).toFixed(1)}%`,
          `Analyze and reinforce successful strategies`
        ]
      };
    }
    
    return null;
  }
  
  /**
   * Analyze metric trend
   */
  private analyzeMetricTrend(events: LearningEvent[], metric: string): LearningTrend | null {
    const dataPoints = events
      .filter(e => e.metrics && metric in e.metrics)
      .map(e => ({
        time: e.timestamp.getTime(),
        value: e.metrics![metric as keyof typeof e.metrics] || 0
      }));
    
    if (dataPoints.length < 5) return null;
    
    // Simple linear regression
    const regression = this.linearRegression(dataPoints);
    
    // Determine direction
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(regression.slope) < 0.001) {
      direction = 'stable';
    } else if (regression.slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }
    
    // Make predictions
    const now = Date.now();
    const hourFromNow = now + 3600000;
    const dayFromNow = now + 86400000;
    
    return {
      metric,
      direction,
      rate: regression.slope * 3600000, // Rate per hour
      confidence: regression.r2,
      prediction: {
        nextHour: regression.predict(hourFromNow),
        nextDay: regression.predict(dayFromNow),
        confidence: Math.max(0, regression.r2 - (0.1 * 24)) // Decay confidence for longer predictions
      }
    };
  }
  
  /**
   * Linear regression for trend analysis
   */
  private linearRegression(points: { time: number; value: number }[]): {
    slope: number;
    intercept: number;
    r2: number;
    predict: (time: number) => number;
  } {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (const { time, value } of points) {
      sumX += time;
      sumY += value;
      sumXY += time * value;
      sumX2 += time * time;
      sumY2 += value * value;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    for (const { time, value } of points) {
      const prediction = slope * time + intercept;
      ssTotal += (value - yMean) ** 2;
      ssResidual += (value - prediction) ** 2;
    }
    
    const r2 = 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      intercept,
      r2: Math.max(0, r2),
      predict: (time: number) => slope * time + intercept
    };
  }
  
  /**
   * Update domain expertise
   */
  private updateDomain(event: LearningEvent): void {
    const domainName = event.context?.domain || 'general';
    
    if (!this.domains.has(domainName)) {
      this.domains.set(domainName, {
        name: domainName,
        expertise: 0,
        learningRate: 0.1,
        lastActive: event.timestamp,
        totalEvents: 0,
        successRate: 0,
        subdomains: new Map()
      });
    }
    
    const domain = this.domains.get(domainName)!;
    
    // Update domain stats
    domain.totalEvents++;
    domain.lastActive = event.timestamp;
    
    // Update success rate
    if (event.type === 'success') {
      domain.successRate = (domain.successRate * (domain.totalEvents - 1) + 1) / domain.totalEvents;
    } else if (event.type === 'failure') {
      domain.successRate = (domain.successRate * (domain.totalEvents - 1)) / domain.totalEvents;
    }
    
    // Update expertise based on performance
    const performanceMultiplier = event.metrics?.confidence || 0.5;
    const learningDelta = domain.learningRate * performanceMultiplier;
    
    if (event.type === 'success' || event.type === 'insight') {
      domain.expertise = Math.min(1, domain.expertise + learningDelta);
    } else if (event.type === 'failure') {
      domain.expertise = Math.max(0, domain.expertise - learningDelta * 0.5);
    }
    
    // Adaptive learning rate
    if (domain.expertise > 0.8) {
      domain.learningRate *= 0.95; // Slow down at high expertise
    } else if (domain.expertise < 0.2) {
      domain.learningRate *= 1.05; // Speed up at low expertise
    }
    
    // Apply decay to inactive domains
    this.applyDomainDecay();
  }
  
  /**
   * Apply expertise decay to inactive domains
   */
  private applyDomainDecay(): void {
    const now = Date.now();
    const dayInMs = 86400000;
    
    for (const [name, domain] of this.domains) {
      const inactiveDays = (now - domain.lastActive.getTime()) / dayInMs;
      
      if (inactiveDays > 1) {
        const decay = this.config.domainDecayRate * inactiveDays;
        domain.expertise = Math.max(0, domain.expertise - decay);
      }
    }
  }
  
  /**
   * Check for milestone achievements
   */
  private checkMilestones(event: LearningEvent): void {
    // Performance milestone
    if (event.metrics?.confidence && event.metrics.confidence > this.config.milestoneThresholds.performance) {
      const milestoneId = `performance-${Date.now()}`;
      if (!this.milestones.has(milestoneId)) {
        this.milestones.set(milestoneId, {
          id: milestoneId,
          name: 'High Performance Achievement',
          achievedAt: event.timestamp,
          criteria: {
            metric: 'confidence',
            threshold: this.config.milestoneThresholds.performance,
            sustained: false
          },
          impact: {
            performanceGain: 0.2,
            learningAcceleration: 1.1,
            systemImprovement: 0.15
          }
        });
        
        this.emit('milestone-achieved', this.milestones.get(milestoneId));
      }
    }
    
    // Consistency milestone
    const recentEvents = this.getRecentEvents(3600000); // Last hour
    const successRate = recentEvents.filter(e => e.type === 'success').length / recentEvents.length;
    
    if (recentEvents.length >= 10 && successRate > this.config.milestoneThresholds.consistency) {
      const milestoneId = `consistency-${Date.now()}`;
      if (!this.milestones.has(milestoneId)) {
        this.milestones.set(milestoneId, {
          id: milestoneId,
          name: 'Consistent Performance',
          achievedAt: event.timestamp,
          criteria: {
            metric: 'successRate',
            threshold: this.config.milestoneThresholds.consistency,
            sustained: true
          },
          impact: {
            performanceGain: 0.1,
            learningAcceleration: 1.2,
            systemImprovement: 0.2
          }
        });
        
        this.emit('milestone-achieved', this.milestones.get(milestoneId));
      }
    }
  }
  
  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(patterns: LearningPattern[], trends: LearningTrend[]): string[] {
    const recommendations: string[] = [];
    
    // Pattern-based recommendations
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'plateau':
          recommendations.push('Learning plateau detected - introduce new challenges or vary learning strategies');
          break;
        case 'cyclic':
          recommendations.push('Cyclic pattern identified - break the cycle with novel approaches');
          break;
        case 'regression':
          recommendations.push('Performance regression observed - review recent changes and revert if necessary');
          break;
        case 'breakthrough':
          recommendations.push('Breakthrough achieved! Analyze and document successful strategies');
          break;
      }
    }
    
    // Trend-based recommendations
    for (const trend of trends) {
      if (trend.direction === 'declining' && trend.confidence > 0.7) {
        recommendations.push(`${trend.metric} is declining - investigate root causes`);
      } else if (trend.direction === 'improving' && trend.rate > 0.1) {
        recommendations.push(`Strong improvement in ${trend.metric} - maintain current approach`);
      }
    }
    
    // Domain-based recommendations
    const topDomains = Array.from(this.domains.values())
      .sort((a, b) => b.expertise - a.expertise)
      .slice(0, 3);
    
    if (topDomains.length > 0) {
      recommendations.push(`Focus on top domains: ${topDomains.map(d => d.name).join(', ')}`);
    }
    
    return recommendations;
  }
  
  /**
   * Helper methods
   */
  
  private getRecentEvents(windowMs: number): LearningEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.history.filter(e => e.timestamp.getTime() > cutoff);
  }
  
  private getEventsInRange(startMs: number, endMs: number): LearningEvent[] {
    const now = Date.now();
    const start = now - startMs;
    const end = now - endMs;
    return this.history.filter(e => {
      const time = e.timestamp.getTime();
      return time > start && time <= end;
    });
  }
  
  private calculateAveragePerformance(events: LearningEvent[]): number {
    const performances = events
      .filter(e => e.metrics?.confidence !== undefined)
      .map(e => e.metrics!.confidence!);
    
    return performances.length > 0
      ? performances.reduce((a, b) => a + b, 0) / performances.length
      : 0;
  }
  
  private calculatePerformanceVariance(events: LearningEvent[]): number {
    const performances = events
      .filter(e => e.metrics?.confidence !== undefined)
      .map(e => e.metrics!.confidence!);
    
    if (performances.length === 0) return 0;
    
    const mean = performances.reduce((a, b) => a + b, 0) / performances.length;
    const variance = performances.reduce((sum, val) => sum + (val - mean) ** 2, 0) / performances.length;
    
    return variance;
  }
  
  private calculateImprovementRate(events: LearningEvent[]): { rate: number; consistency: number } {
    if (events.length < 2) return { rate: 0, consistency: 0 };
    
    // Split into halves
    const midpoint = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, midpoint);
    const secondHalf = events.slice(midpoint);
    
    const firstPerf = this.calculateAveragePerformance(firstHalf);
    const secondPerf = this.calculateAveragePerformance(secondHalf);
    
    const rate = firstPerf > 0 ? (secondPerf - firstPerf) / firstPerf : 0;
    
    // Calculate consistency as inverse of variance
    const variance = this.calculatePerformanceVariance(events);
    const consistency = 1 / (1 + variance);
    
    return { rate, consistency };
  }
  
  private findCycleLength(events: LearningEvent[]): number {
    // Simple cycle detection - look for repeating success/failure patterns
    const pattern = events.map(e => e.type === 'success' ? 1 : 0);
    
    for (let length = 2; length < pattern.length / 2; length++) {
      let matches = true;
      
      for (let i = 0; i < length && i + length < pattern.length; i++) {
        if (pattern[i] !== pattern[i + length]) {
          matches = false;
          break;
        }
      }
      
      if (matches) return length;
    }
    
    return 0;
  }
  
  private calculateCycleEffectiveness(events: LearningEvent[], cycleLength: number): number {
    // Calculate average performance per cycle
    const cycles = Math.floor(events.length / cycleLength);
    let totalEffectiveness = 0;
    
    for (let i = 0; i < cycles; i++) {
      const cycleEvents = events.slice(i * cycleLength, (i + 1) * cycleLength);
      totalEffectiveness += this.calculateAveragePerformance(cycleEvents);
    }
    
    return cycles > 0 ? totalEffectiveness / cycles : 0;
  }
  
  private calculateOverallProgress(): number {
    // Combine multiple factors for overall progress
    const domains = Array.from(this.domains.values());
    const avgExpertise = domains.length > 0
      ? domains.reduce((sum, d) => sum + d.expertise, 0) / domains.length
      : 0;
    
    const recentPerformance = this.calculateAveragePerformance(this.getRecentEvents(86400000));
    const milestoneScore = this.milestones.size * 0.1;
    
    return Math.min(1, (avgExpertise + recentPerformance + milestoneScore) / 3);
  }
  
  private getDomainTrend(domain: LearningDomain): string {
    const dayAgo = Date.now() - 86400000;
    const recentActivity = domain.lastActive.getTime() > dayAgo;
    
    if (!recentActivity) return 'inactive';
    if (domain.learningRate > 0.15) return 'rapid growth';
    if (domain.expertise > 0.8) return 'mastery';
    if (domain.successRate > 0.7) return 'improving';
    return 'developing';
  }
  
  private cleanOldHistory(): void {
    const retentionMs = this.config.historyRetentionDays * 86400000;
    const cutoff = Date.now() - retentionMs;
    
    this.history = this.history.filter(e => e.timestamp.getTime() > cutoff);
  }
  
  private startPeriodicAnalysis(): void {
    // Run analysis every hour
    setInterval(async () => {
      const report = await this.getAnalyticsReport();
      this.emit('periodic-analysis', report);
      this.lastAnalysis = new Date();
    }, 3600000);
  }
  
  /**
   * Export analytics data
   */
  exportAnalytics(): {
    history: LearningEvent[];
    patterns: LearningPattern[];
    milestones: LearningMilestone[];
    domains: Array<[string, LearningDomain]>;
    metadata: {
      exportDate: Date;
      totalEvents: number;
      timespan: number;
    };
  } {
    return {
      history: [...this.history],
      patterns: Array.from(this.patterns.values()),
      milestones: Array.from(this.milestones.values()),
      domains: Array.from(this.domains.entries()),
      metadata: {
        exportDate: new Date(),
        totalEvents: this.history.length,
        timespan: this.history.length > 0
          ? Date.now() - this.history[0].timestamp.getTime()
          : 0
      }
    };
  }
  
  /**
   * Import analytics data
   */
  importAnalytics(data: any): void {
    // Validate and import data
    if (data.history && Array.isArray(data.history)) {
      this.history = data.history.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    }
    
    if (data.patterns && Array.isArray(data.patterns)) {
      this.patterns.clear();
      for (const pattern of data.patterns) {
        this.patterns.set(pattern.id, {
          ...pattern,
          startTime: new Date(pattern.startTime),
          endTime: pattern.endTime ? new Date(pattern.endTime) : undefined
        });
      }
    }
    
    if (data.milestones && Array.isArray(data.milestones)) {
      this.milestones.clear();
      for (const milestone of data.milestones) {
        this.milestones.set(milestone.id, {
          ...milestone,
          achievedAt: new Date(milestone.achievedAt)
        });
      }
    }
    
    if (data.domains && Array.isArray(data.domains)) {
      this.domains.clear();
      for (const [name, domain] of data.domains) {
        this.domains.set(name, {
          ...domain,
          lastActive: new Date(domain.lastActive),
          subdomains: new Map(domain.subdomains)
        });
      }
    }
    
    this.emit('analytics-imported', data.metadata);
  }
}