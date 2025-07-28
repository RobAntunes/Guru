/**
 * Adaptive Strategy Selection System
 * 
 * Intelligently selects and combines learning strategies based on context,
 * performance history, and environmental factors. Uses multi-armed bandit
 * algorithms and contextual bandits for optimal strategy selection.
 */

import { EventEmitter } from 'events';
import { LearningStrategy, LearningOutcome } from './unified-learning-coordinator.js';
import { LearningTrend, LearningPattern } from './learning-history-analytics.js';

export interface StrategyContext {
  domain: string;
  complexity: number;
  uncertainty: number;
  timeConstraint?: number;
  resourceConstraint?: number;
  previousOutcomes: LearningOutcome[];
  environmentalFactors: {
    systemLoad: number;
    memoryUsage: number;
    concurrentTasks: number;
  };
}

export interface StrategyPerformance {
  strategyName: string;
  totalUses: number;
  successRate: number;
  averageReward: number;
  contextualPerformance: Map<string, {
    uses: number;
    reward: number;
  }>;
  recentPerformance: {
    window: number;
    successRate: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface StrategyRecommendation {
  primary: string;
  alternatives: string[];
  ensemble?: {
    strategies: string[];
    weights: number[];
  };
  reasoning: string[];
  expectedOutcome: {
    successProbability: number;
    expectedReward: number;
    uncertainty: number;
  };
}

export interface AdaptiveSelectionConfig {
  explorationRate: number; // Epsilon for epsilon-greedy
  decayRate: number; // How fast to reduce exploration
  contextualBandit: boolean; // Use contextual bandits
  ensembleThreshold: number; // When to use ensemble strategies
  performanceWindow: number; // Hours to consider for recent performance
  adaptationSpeed: number; // How quickly to adapt to changes
}

export class AdaptiveStrategySelector extends EventEmitter {
  private strategyPerformance: Map<string, StrategyPerformance> = new Map();
  private contextualModels: Map<string, any> = new Map();
  private selectionHistory: Array<{
    timestamp: Date;
    context: StrategyContext;
    selected: string;
    outcome?: LearningOutcome;
  }> = [];
  private explorationRate: number;
  private totalSelections: number = 0;
  
  constructor(
    private config: AdaptiveSelectionConfig,
    private availableStrategies: Map<string, LearningStrategy>
  ) {
    super();
    this.explorationRate = config.explorationRate;
    this.initializePerformance();
  }
  
  /**
   * Initialize performance tracking for all strategies
   */
  private initializePerformance(): void {
    for (const [name, strategy] of this.availableStrategies) {
      this.strategyPerformance.set(name, {
        strategyName: name,
        totalUses: 0,
        successRate: 0,
        averageReward: 0,
        contextualPerformance: new Map(),
        recentPerformance: {
          window: this.config.performanceWindow,
          successRate: 0,
          trend: 'stable'
        }
      });
    }
  }
  
  /**
   * Select optimal strategy based on context
   */
  async selectStrategy(context: StrategyContext): Promise<StrategyRecommendation> {
    this.totalSelections++;
    
    // Update exploration rate
    this.updateExplorationRate();
    
    // Get strategy scores
    const scores = await this.calculateStrategyScores(context);
    
    // Decide between exploitation and exploration
    const shouldExplore = Math.random() < this.explorationRate;
    
    let selectedStrategy: string;
    let reasoning: string[] = [];
    
    if (shouldExplore) {
      // Exploration: choose random strategy
      const strategies = Array.from(this.availableStrategies.keys());
      selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      reasoning.push('Exploring new strategy for learning');
    } else {
      // Exploitation: choose best strategy
      selectedStrategy = this.selectBestStrategy(scores, context, reasoning);
    }
    
    // Check if ensemble is beneficial
    const ensemble = this.considerEnsemble(scores, context);
    
    // Calculate expected outcome
    const expectedOutcome = this.calculateExpectedOutcome(selectedStrategy, context);
    
    // Record selection
    this.recordSelection(context, selectedStrategy);
    
    // Generate alternatives
    const alternatives = this.getAlternativeStrategies(scores, selectedStrategy);
    
    const recommendation: StrategyRecommendation = {
      primary: selectedStrategy,
      alternatives,
      ensemble,
      reasoning,
      expectedOutcome
    };
    
    this.emit('strategy-selected', recommendation);
    
    return recommendation;
  }
  
  /**
   * Calculate scores for all strategies
   */
  private async calculateStrategyScores(
    context: StrategyContext
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    for (const [name, strategy] of this.availableStrategies) {
      let score = 0;
      
      // Base score from historical performance
      const performance = this.strategyPerformance.get(name)!;
      score += performance.averageReward * 0.4;
      
      // Contextual score
      if (this.config.contextualBandit) {
        score += this.getContextualScore(name, context) * 0.3;
      }
      
      // Recent performance bonus/penalty
      const recentBonus = this.getRecentPerformanceScore(performance);
      score += recentBonus * 0.2;
      
      // Strategy-context fit score
      const fitScore = this.calculateStrategyFit(strategy, context);
      score += fitScore * 0.1;
      
      scores.set(name, score);
    }
    
    return scores;
  }
  
  /**
   * Get contextual score using learned models
   */
  private getContextualScore(strategyName: string, context: StrategyContext): number {
    const contextKey = this.getContextKey(context);
    const performance = this.strategyPerformance.get(strategyName)!;
    const contextualData = performance.contextualPerformance.get(contextKey);
    
    if (!contextualData || contextualData.uses < 3) {
      // Not enough data, return neutral score
      return 0.5;
    }
    
    // Calculate contextual score
    const avgReward = contextualData.reward / contextualData.uses;
    
    // Apply Thompson sampling for uncertainty
    const uncertainty = 1 / Math.sqrt(contextualData.uses);
    const sample = avgReward + (Math.random() - 0.5) * uncertainty;
    
    return Math.max(0, Math.min(1, sample));
  }
  
  /**
   * Calculate recent performance score
   */
  private getRecentPerformanceScore(performance: StrategyPerformance): number {
    const { recentPerformance } = performance;
    
    let score = recentPerformance.successRate;
    
    // Adjust for trend
    switch (recentPerformance.trend) {
      case 'improving':
        score *= 1.2;
        break;
      case 'declining':
        score *= 0.8;
        break;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Calculate how well a strategy fits the context
   */
  private calculateStrategyFit(strategy: LearningStrategy, context: StrategyContext): number {
    let fitScore = 1.0;
    
    // Check complexity match
    if (context.complexity > 0.7 && strategy.priority > 2) {
      fitScore *= 0.8; // Complex contexts need high-priority strategies
    }
    
    // Check uncertainty match
    if (context.uncertainty > 0.6) {
      // High uncertainty favors certain strategies
      if (strategy.name.includes('exploration') || strategy.name.includes('emergent')) {
        fitScore *= 1.2;
      }
    }
    
    // Check resource constraints
    if (context.resourceConstraint && context.resourceConstraint < 0.3) {
      // Low resources favor lightweight strategies
      if (strategy.priority > 3) {
        fitScore *= 0.7;
      }
    }
    
    // Check time constraints
    if (context.timeConstraint && context.timeConstraint < 1000) {
      // Tight time constraints favor fast strategies
      if (strategy.name.includes('quantum') || strategy.name.includes('pattern')) {
        fitScore *= 1.1;
      }
    }
    
    return Math.max(0.1, Math.min(1.5, fitScore));
  }
  
  /**
   * Select best strategy from scores
   */
  private selectBestStrategy(
    scores: Map<string, number>,
    context: StrategyContext,
    reasoning: string[]
  ): string {
    let bestStrategy = '';
    let bestScore = -Infinity;
    
    for (const [strategy, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }
    
    // Add reasoning
    reasoning.push(`Selected ${bestStrategy} with score ${bestScore.toFixed(3)}`);
    
    // Context-specific reasoning
    if (context.complexity > 0.7) {
      reasoning.push('High complexity context favors sophisticated strategies');
    }
    
    if (context.uncertainty > 0.6) {
      reasoning.push('High uncertainty requires exploratory approaches');
    }
    
    const performance = this.strategyPerformance.get(bestStrategy)!;
    if (performance.recentPerformance.trend === 'improving') {
      reasoning.push(`${bestStrategy} showing improvement trend`);
    }
    
    return bestStrategy;
  }
  
  /**
   * Consider using ensemble of strategies
   */
  private considerEnsemble(
    scores: Map<string, number>,
    context: StrategyContext
  ): { strategies: string[]; weights: number[] } | undefined {
    // Get top strategies
    const sortedStrategies = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Check if ensemble is beneficial
    const topScore = sortedStrategies[0][1];
    const secondScore = sortedStrategies[1]?.[1] || 0;
    
    if (secondScore / topScore > this.config.ensembleThreshold) {
      // Scores are close, ensemble might be beneficial
      const strategies = sortedStrategies.map(s => s[0]);
      const weights = this.calculateEnsembleWeights(sortedStrategies);
      
      return { strategies, weights };
    }
    
    return undefined;
  }
  
  /**
   * Calculate ensemble weights using softmax
   */
  private calculateEnsembleWeights(
    strategies: Array<[string, number]>
  ): number[] {
    const scores = strategies.map(s => s[1]);
    const maxScore = Math.max(...scores);
    
    // Softmax with temperature
    const temperature = 0.5;
    const expScores = scores.map(s => Math.exp((s - maxScore) / temperature));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    
    return expScores.map(e => e / sumExp);
  }
  
  /**
   * Calculate expected outcome for a strategy
   */
  private calculateExpectedOutcome(
    strategy: string,
    context: StrategyContext
  ): {
    successProbability: number;
    expectedReward: number;
    uncertainty: number;
  } {
    const performance = this.strategyPerformance.get(strategy)!;
    const contextKey = this.getContextKey(context);
    const contextualData = performance.contextualPerformance.get(contextKey);
    
    if (contextualData && contextualData.uses > 0) {
      // Use contextual data
      const successProbability = Math.min(0.95, contextualData.reward / contextualData.uses);
      const uncertainty = 1 / Math.sqrt(contextualData.uses + 1);
      
      return {
        successProbability,
        expectedReward: successProbability * 0.8, // Conservative estimate
        uncertainty
      };
    } else {
      // Use global performance
      return {
        successProbability: performance.successRate,
        expectedReward: performance.averageReward,
        uncertainty: performance.totalUses > 0 ? 1 / Math.sqrt(performance.totalUses) : 1
      };
    }
  }
  
  /**
   * Get alternative strategy recommendations
   */
  private getAlternativeStrategies(
    scores: Map<string, number>,
    selected: string
  ): string[] {
    return Array.from(scores.entries())
      .filter(([name]) => name !== selected)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name]) => name);
  }
  
  /**
   * Update strategy performance after execution
   */
  async updatePerformance(
    strategy: string,
    context: StrategyContext,
    outcome: LearningOutcome
  ): Promise<void> {
    const performance = this.strategyPerformance.get(strategy);
    if (!performance) return;
    
    // Update global performance
    performance.totalUses++;
    const reward = this.calculateReward(outcome);
    performance.averageReward = (
      (performance.averageReward * (performance.totalUses - 1) + reward) /
      performance.totalUses
    );
    performance.successRate = (
      (performance.successRate * (performance.totalUses - 1) + (outcome.success ? 1 : 0)) /
      performance.totalUses
    );
    
    // Update contextual performance
    const contextKey = this.getContextKey(context);
    const contextualData = performance.contextualPerformance.get(contextKey) || {
      uses: 0,
      reward: 0
    };
    
    contextualData.uses++;
    contextualData.reward += reward;
    performance.contextualPerformance.set(contextKey, contextualData);
    
    // Update recent performance
    this.updateRecentPerformance(performance);
    
    // Update selection history
    const lastSelection = this.selectionHistory[this.selectionHistory.length - 1];
    if (lastSelection && lastSelection.selected === strategy) {
      lastSelection.outcome = outcome;
    }
    
    // Emit update event
    this.emit('performance-updated', {
      strategy,
      performance,
      outcome
    });
  }
  
  /**
   * Calculate reward from outcome
   */
  private calculateReward(outcome: LearningOutcome): number {
    let reward = 0;
    
    // Base reward from success
    reward += outcome.success ? 0.5 : 0;
    
    // Reward from metrics
    reward += outcome.metrics.convergence * 0.2;
    reward += outcome.metrics.generalization * 0.2;
    reward += Math.min(1, outcome.insights.length / 5) * 0.1;
    
    return Math.max(0, Math.min(1, reward));
  }
  
  /**
   * Update recent performance metrics
   */
  private updateRecentPerformance(performance: StrategyPerformance): void {
    const windowMs = performance.recentPerformance.window * 3600000;
    const cutoff = Date.now() - windowMs;
    
    // Get recent uses from history
    const recentUses = this.selectionHistory.filter(h => 
      h.selected === performance.strategyName &&
      h.timestamp.getTime() > cutoff &&
      h.outcome !== undefined
    );
    
    if (recentUses.length === 0) return;
    
    // Calculate recent success rate
    const recentSuccesses = recentUses.filter(h => h.outcome!.success).length;
    const newSuccessRate = recentSuccesses / recentUses.length;
    
    // Determine trend
    const oldRate = performance.recentPerformance.successRate;
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (newSuccessRate > oldRate + 0.1) {
      trend = 'improving';
    } else if (newSuccessRate < oldRate - 0.1) {
      trend = 'declining';
    }
    
    performance.recentPerformance.successRate = newSuccessRate;
    performance.recentPerformance.trend = trend;
  }
  
  /**
   * Get context key for contextual bandits
   */
  private getContextKey(context: StrategyContext): string {
    // Create a simplified context representation
    const complexity = Math.round(context.complexity * 10) / 10;
    const uncertainty = Math.round(context.uncertainty * 10) / 10;
    const load = Math.round(context.environmentalFactors.systemLoad * 10) / 10;
    
    return `${context.domain}-c${complexity}-u${uncertainty}-l${load}`;
  }
  
  /**
   * Record strategy selection
   */
  private recordSelection(context: StrategyContext, selected: string): void {
    this.selectionHistory.push({
      timestamp: new Date(),
      context,
      selected
    });
    
    // Keep history manageable
    if (this.selectionHistory.length > 10000) {
      this.selectionHistory = this.selectionHistory.slice(-5000);
    }
  }
  
  /**
   * Update exploration rate with decay
   */
  private updateExplorationRate(): void {
    this.explorationRate *= (1 - this.config.decayRate);
    this.explorationRate = Math.max(0.01, this.explorationRate); // Minimum exploration
  }
  
  /**
   * Get strategy selection analytics
   */
  getSelectionAnalytics(): {
    strategyUsage: Map<string, number>;
    performanceRankings: Array<{
      strategy: string;
      score: number;
      uses: number;
      successRate: number;
    }>;
    contextualInsights: Array<{
      context: string;
      bestStrategy: string;
      performance: number;
    }>;
    explorationRate: number;
    totalSelections: number;
  } {
    // Calculate strategy usage
    const strategyUsage = new Map<string, number>();
    for (const selection of this.selectionHistory) {
      strategyUsage.set(
        selection.selected,
        (strategyUsage.get(selection.selected) || 0) + 1
      );
    }
    
    // Get performance rankings
    const performanceRankings = Array.from(this.strategyPerformance.values())
      .map(p => ({
        strategy: p.strategyName,
        score: p.averageReward,
        uses: p.totalUses,
        successRate: p.successRate
      }))
      .sort((a, b) => b.score - a.score);
    
    // Get contextual insights
    const contextualInsights: Array<any> = [];
    const contextMap = new Map<string, { strategy: string; performance: number; count: number }>();
    
    for (const [strategy, performance] of this.strategyPerformance) {
      for (const [context, data] of performance.contextualPerformance) {
        const existing = contextMap.get(context);
        const avgPerformance = data.reward / data.uses;
        
        if (!existing || avgPerformance > existing.performance) {
          contextMap.set(context, {
            strategy,
            performance: avgPerformance,
            count: data.uses
          });
        }
      }
    }
    
    for (const [context, data] of contextMap) {
      if (data.count >= 3) { // Only include contexts with enough data
        contextualInsights.push({
          context,
          bestStrategy: data.strategy,
          performance: data.performance
        });
      }
    }
    
    return {
      strategyUsage,
      performanceRankings,
      contextualInsights: contextualInsights.sort((a, b) => b.performance - a.performance).slice(0, 10),
      explorationRate: this.explorationRate,
      totalSelections: this.totalSelections
    };
  }
  
  /**
   * Reset strategy performance (useful for adapting to changes)
   */
  resetPerformance(strategy?: string): void {
    if (strategy) {
      // Reset specific strategy
      const perf = this.strategyPerformance.get(strategy);
      if (perf) {
        perf.totalUses = 0;
        perf.successRate = 0;
        perf.averageReward = 0;
        perf.contextualPerformance.clear();
        perf.recentPerformance.successRate = 0;
        perf.recentPerformance.trend = 'stable';
      }
    } else {
      // Reset all strategies
      this.initializePerformance();
    }
    
    this.emit('performance-reset', strategy || 'all');
  }
  
  /**
   * Export selection data for analysis
   */
  exportSelectionData(): {
    performance: Array<[string, StrategyPerformance]>;
    history: typeof this.selectionHistory;
    config: AdaptiveSelectionConfig;
  } {
    return {
      performance: Array.from(this.strategyPerformance.entries()),
      history: [...this.selectionHistory],
      config: { ...this.config }
    };
  }
  
  /**
   * Import selection data
   */
  importSelectionData(data: any): void {
    if (data.performance) {
      this.strategyPerformance.clear();
      for (const [name, perf] of data.performance) {
        this.strategyPerformance.set(name, {
          ...perf,
          contextualPerformance: new Map(perf.contextualPerformance)
        });
      }
    }
    
    if (data.history) {
      this.selectionHistory = data.history.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      }));
    }
    
    if (data.config) {
      Object.assign(this.config, data.config);
      this.explorationRate = this.config.explorationRate;
    }
    
    this.emit('data-imported');
  }
}