/**
 * Unified Learning Coordinator
 * 
 * Central orchestrator for all adaptive learning mechanisms in Guru.
 * Coordinates quantum learning, emergent behaviors, pattern recognition,
 * and other learning subsystems to create a unified adaptive intelligence.
 */

import { EventEmitter } from 'events';
import { QuantumLearningSystem } from '../memory/quantum-learning-system.js';
import { EmergentBehaviorEngine } from '../memory/emergent-behavior-engine.js';
import { AdaptiveCacheWarmer } from '../optimization/adaptive-cache-warmer.js';
import { SelfReflectionEngine } from '../intelligence/self-reflection-engine.js';
import { PatternDetector } from '../intelligence/pattern-detector.js';
import { MemoryIntelligenceEngine } from '../intelligence/memory-intelligence-engine.js';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine.js';

export interface LearningEvent {
  timestamp: Date;
  source: string;
  type: 'success' | 'failure' | 'discovery' | 'adaptation' | 'insight';
  context: any;
  metrics?: {
    confidence?: number;
    accuracy?: number;
    performance?: number;
    novelty?: number;
  };
}

export interface LearningStrategy {
  name: string;
  priority: number;
  conditions: {
    minConfidence?: number;
    maxUncertainty?: number;
    contextType?: string[];
    performanceThreshold?: number;
  };
  execute: (context: any) => Promise<LearningOutcome>;
}

export interface LearningOutcome {
  success: boolean;
  insights: string[];
  adaptations: {
    component: string;
    parameter: string;
    oldValue: any;
    newValue: any;
  }[];
  metrics: {
    learningRate: number;
    convergence: number;
    generalization: number;
  };
}

export interface AdaptiveLearningConfig {
  enableQuantumLearning: boolean;
  enableEmergentBehaviors: boolean;
  enablePatternRecognition: boolean;
  enableSelfReflection: boolean;
  learningRateRange: [number, number];
  adaptationThreshold: number;
  crossSystemLearning: boolean;
}

export class UnifiedLearningCoordinator extends EventEmitter {
  private learningHistory: LearningEvent[] = [];
  private strategies: Map<string, LearningStrategy> = new Map();
  private activeStrategies: Set<string> = new Set();
  private globalLearningRate: number = 0.3;
  private adaptationCycles: number = 0;
  
  constructor(
    private config: AdaptiveLearningConfig,
    private quantumLearning?: QuantumLearningSystem,
    private emergentBehavior?: EmergentBehaviorEngine,
    private cacheWarmer?: AdaptiveCacheWarmer,
    private selfReflection?: SelfReflectionEngine,
    private patternDetector?: PatternDetector,
    private memoryIntelligence?: MemoryIntelligenceEngine,
    private harmonicEngine?: HarmonicAnalysisEngine
  ) {
    super();
    this.initializeStrategies();
  }
  
  private initializeStrategies(): void {
    // Quantum Learning Strategy
    if (this.config.enableQuantumLearning && this.quantumLearning) {
      this.strategies.set('quantum-learning', {
        name: 'Quantum Learning',
        priority: 1,
        conditions: {
          minConfidence: 0.3,
          contextType: ['memory', 'pattern', 'association']
        },
        execute: async (context) => this.executeQuantumLearning(context)
      });
    }
    
    // Emergent Behavior Strategy
    if (this.config.enableEmergentBehaviors && this.emergentBehavior) {
      this.strategies.set('emergent-behavior', {
        name: 'Emergent Behavior',
        priority: 2,
        conditions: {
          maxUncertainty: 0.7,
          contextType: ['exploration', 'synthesis', 'creativity']
        },
        execute: async (context) => this.executeEmergentBehavior(context)
      });
    }
    
    // Pattern Recognition Strategy
    if (this.config.enablePatternRecognition && this.patternDetector) {
      this.strategies.set('pattern-recognition', {
        name: 'Pattern Recognition',
        priority: 3,
        conditions: {
          contextType: ['code', 'structure', 'behavior']
        },
        execute: async (context) => this.executePatternRecognition(context)
      });
    }
    
    // Self-Reflection Strategy
    if (this.config.enableSelfReflection && this.selfReflection) {
      this.strategies.set('self-reflection', {
        name: 'Self Reflection',
        priority: 4,
        conditions: {
          performanceThreshold: 0.5
        },
        execute: async (context) => this.executeSelfReflection(context)
      });
    }
  }
  
  /**
   * Main learning coordination method
   */
  async coordinateLearning(context: any): Promise<LearningOutcome> {
    const startTime = Date.now();
    
    // Select appropriate strategies based on context
    const selectedStrategies = this.selectStrategies(context);
    
    // Execute strategies in parallel with cross-communication
    const outcomes = await this.executeStrategies(selectedStrategies, context);
    
    // Synthesize learning outcomes
    const synthesizedOutcome = this.synthesizeOutcomes(outcomes);
    
    // Adapt global learning parameters
    await this.adaptLearningParameters(synthesizedOutcome);
    
    // Record learning event
    this.recordLearningEvent({
      timestamp: new Date(),
      source: 'unified-coordinator',
      type: synthesizedOutcome.success ? 'success' : 'failure',
      context,
      metrics: {
        confidence: synthesizedOutcome.metrics.convergence,
        performance: (Date.now() - startTime) / 1000,
        novelty: synthesizedOutcome.insights.length / 10
      }
    });
    
    // Emit learning event
    this.emit('learning-complete', synthesizedOutcome);
    
    return synthesizedOutcome;
  }
  
  /**
   * Select strategies based on context and conditions
   */
  private selectStrategies(context: any): LearningStrategy[] {
    const applicable: LearningStrategy[] = [];
    
    for (const [name, strategy] of this.strategies) {
      if (this.matchesConditions(strategy.conditions, context)) {
        applicable.push(strategy);
      }
    }
    
    // Sort by priority
    return applicable.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Check if strategy conditions match context
   */
  private matchesConditions(conditions: any, context: any): boolean {
    if (conditions.minConfidence && context.confidence < conditions.minConfidence) {
      return false;
    }
    
    if (conditions.maxUncertainty && context.uncertainty > conditions.maxUncertainty) {
      return false;
    }
    
    if (conditions.contextType && !conditions.contextType.includes(context.type)) {
      return false;
    }
    
    if (conditions.performanceThreshold && context.performance < conditions.performanceThreshold) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Execute selected strategies with cross-communication
   */
  private async executeStrategies(
    strategies: LearningStrategy[],
    context: any
  ): Promise<LearningOutcome[]> {
    const outcomes: LearningOutcome[] = [];
    
    // Execute strategies with shared context
    const sharedContext = { ...context, crossLearning: {} };
    
    for (const strategy of strategies) {
      try {
        this.activeStrategies.add(strategy.name);
        const outcome = await strategy.execute(sharedContext);
        outcomes.push(outcome);
        
        // Share insights with next strategies
        if (this.config.crossSystemLearning) {
          sharedContext.crossLearning[strategy.name] = outcome.insights;
        }
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
      } finally {
        this.activeStrategies.delete(strategy.name);
      }
    }
    
    return outcomes;
  }
  
  /**
   * Synthesize multiple learning outcomes
   */
  private synthesizeOutcomes(outcomes: LearningOutcome[]): LearningOutcome {
    const allInsights = outcomes.flatMap(o => o.insights);
    const allAdaptations = outcomes.flatMap(o => o.adaptations);
    
    // Deduplicate insights
    const uniqueInsights = Array.from(new Set(allInsights));
    
    // Merge metrics
    const avgLearningRate = outcomes.reduce((sum, o) => sum + o.metrics.learningRate, 0) / outcomes.length;
    const avgConvergence = outcomes.reduce((sum, o) => sum + o.metrics.convergence, 0) / outcomes.length;
    const avgGeneralization = outcomes.reduce((sum, o) => sum + o.metrics.generalization, 0) / outcomes.length;
    
    return {
      success: outcomes.some(o => o.success),
      insights: uniqueInsights,
      adaptations: allAdaptations,
      metrics: {
        learningRate: avgLearningRate,
        convergence: avgConvergence,
        generalization: avgGeneralization
      }
    };
  }
  
  /**
   * Adapt global learning parameters based on outcomes
   */
  private async adaptLearningParameters(outcome: LearningOutcome): Promise<void> {
    const { metrics } = outcome;
    
    // Adjust global learning rate
    if (metrics.convergence > 0.8) {
      // High convergence, can reduce learning rate
      this.globalLearningRate *= 0.95;
    } else if (metrics.convergence < 0.3) {
      // Low convergence, increase learning rate
      this.globalLearningRate *= 1.05;
    }
    
    // Clamp to configured range
    const [minRate, maxRate] = this.config.learningRateRange;
    this.globalLearningRate = Math.max(minRate, Math.min(maxRate, this.globalLearningRate));
    
    // Apply adaptations
    for (const adaptation of outcome.adaptations) {
      await this.applyAdaptation(adaptation);
    }
    
    this.adaptationCycles++;
  }
  
  /**
   * Execute quantum learning strategy
   */
  private async executeQuantumLearning(context: any): Promise<LearningOutcome> {
    if (!this.quantumLearning) {
      throw new Error('Quantum learning not available');
    }
    
    const insights: string[] = [];
    const adaptations: any[] = [];
    
    // Process learning event
    const event = {
      query: context.query || '',
      memories: context.memories || [],
      success: context.success !== false,
      confidence: context.confidence || 0.5,
      timestamp: Date.now()
    };
    
    await this.quantumLearning.processLearningEvent(event);
    
    // Get learning insights
    const state = this.quantumLearning.getLearningState();
    
    if (state.totalEvents > 10) {
      insights.push(`Quantum learning processed ${state.totalEvents} events with ${state.averageConfidence.toFixed(2)} average confidence`);
      
      if (state.spatialClusters > 1) {
        insights.push(`Formed ${state.spatialClusters} memory clusters through spatial adaptation`);
      }
    }
    
    return {
      success: true,
      insights,
      adaptations,
      metrics: {
        learningRate: this.globalLearningRate,
        convergence: state.averageConfidence,
        generalization: state.spatialClusters / Math.max(1, state.totalEvents / 10)
      }
    };
  }
  
  /**
   * Execute emergent behavior strategy
   */
  private async executeEmergentBehavior(context: any): Promise<LearningOutcome> {
    if (!this.emergentBehavior) {
      throw new Error('Emergent behavior not available');
    }
    
    const insights: string[] = [];
    const adaptations: any[] = [];
    
    // Determine which emergent behavior to activate
    const uncertainty = context.uncertainty || 0.5;
    const creativity = context.creativity || 0.3;
    
    let behavior: any;
    
    if (uncertainty > 0.6) {
      // High uncertainty - use déjà vu exploration
      behavior = await this.emergentBehavior['findDejaVuCandidates'](1);
      if (behavior.length > 0) {
        insights.push('Triggered déjà vu exploration to resolve uncertainty');
      }
    } else if (creativity > 0.7) {
      // High creativity need - use synthesis
      const categories = context.categories || ['default'];
      behavior = await this.emergentBehavior['performCreativeSynthesis'](categories, 3);
      insights.push(`Generated ${behavior.insights.length} creative insights across categories`);
    } else {
      // Default - use dream state
      behavior = await this.emergentBehavior['enterDreamState'](5, 0.3);
      if (behavior.discoveries.length > 0) {
        insights.push(`Dream state discovered ${behavior.discoveries.length} novel connections`);
      }
    }
    
    return {
      success: insights.length > 0,
      insights,
      adaptations,
      metrics: {
        learningRate: this.globalLearningRate,
        convergence: 0.5,
        generalization: 0.7
      }
    };
  }
  
  /**
   * Execute pattern recognition strategy
   */
  private async executePatternRecognition(context: any): Promise<LearningOutcome> {
    if (!this.patternDetector) {
      throw new Error('Pattern detector not available');
    }
    
    const insights: string[] = [];
    const adaptations: any[] = [];
    
    // Detect patterns in provided symbols
    const symbols = context.symbols || [];
    const patterns = await this.patternDetector.detectPatterns(symbols);
    
    // Analyze pattern quality
    const highValuePatterns = patterns.filter(p => p.confidence > 0.7);
    
    if (highValuePatterns.length > 0) {
      insights.push(`Detected ${highValuePatterns.length} high-confidence patterns`);
      
      // Extract pattern insights
      for (const pattern of highValuePatterns.slice(0, 3)) {
        insights.push(`Pattern: ${pattern.type} with ${pattern.instances.length} instances`);
      }
    }
    
    return {
      success: patterns.length > 0,
      insights,
      adaptations,
      metrics: {
        learningRate: this.globalLearningRate,
        convergence: highValuePatterns.length / Math.max(1, patterns.length),
        generalization: patterns.length / Math.max(1, symbols.length)
      }
    };
  }
  
  /**
   * Execute self-reflection strategy
   */
  private async executeSelfReflection(context: any): Promise<LearningOutcome> {
    if (!this.selfReflection) {
      throw new Error('Self reflection not available');
    }
    
    const insights: string[] = [];
    const adaptations: any[] = [];
    
    // Analyze recent performance
    const recentHistory = this.getRecentHistory(100);
    const analysis = await this.selfReflection.analyzePerformance(recentHistory);
    
    // Extract key insights
    if (analysis.overallAccuracy < 0.5) {
      insights.push('Performance below threshold - need strategy adjustment');
      adaptations.push({
        component: 'learning-coordinator',
        parameter: 'globalLearningRate',
        oldValue: this.globalLearningRate,
        newValue: this.globalLearningRate * 1.2
      });
    }
    
    if (analysis.blindSpots.length > 0) {
      insights.push(`Identified ${analysis.blindSpots.length} blind spots in learning`);
    }
    
    return {
      success: true,
      insights,
      adaptations,
      metrics: {
        learningRate: this.globalLearningRate,
        convergence: analysis.overallAccuracy,
        generalization: 1 - (analysis.blindSpots.length / 10)
      }
    };
  }
  
  /**
   * Apply adaptation to system
   */
  private async applyAdaptation(adaptation: any): Promise<void> {
    // Log adaptation
    console.log(`Applying adaptation: ${adaptation.component}.${adaptation.parameter} from ${adaptation.oldValue} to ${adaptation.newValue}`);
    
    // Apply based on component
    switch (adaptation.component) {
      case 'learning-coordinator':
        if (adaptation.parameter === 'globalLearningRate') {
          this.globalLearningRate = adaptation.newValue;
        }
        break;
      
      case 'quantum-learning':
        if (this.quantumLearning && adaptation.parameter in this.quantumLearning) {
          (this.quantumLearning as any)[adaptation.parameter] = adaptation.newValue;
        }
        break;
      
      // Add more components as needed
    }
    
    this.emit('adaptation-applied', adaptation);
  }
  
  /**
   * Record learning event
   */
  private recordLearningEvent(event: LearningEvent): void {
    this.learningHistory.push(event);
    
    // Keep history size manageable
    if (this.learningHistory.length > 10000) {
      this.learningHistory = this.learningHistory.slice(-5000);
    }
    
    this.emit('learning-event', event);
  }
  
  /**
   * Get recent learning history
   */
  getRecentHistory(count: number = 100): LearningEvent[] {
    return this.learningHistory.slice(-count);
  }
  
  /**
   * Get learning analytics
   */
  getLearningAnalytics(): {
    totalEvents: number;
    successRate: number;
    averageConfidence: number;
    learningVelocity: number;
    activeStrategies: string[];
    adaptationCycles: number;
    insights: {
      total: number;
      byType: Record<string, number>;
      recent: string[];
    };
  } {
    const totalEvents = this.learningHistory.length;
    const successEvents = this.learningHistory.filter(e => e.type === 'success').length;
    const successRate = totalEvents > 0 ? successEvents / totalEvents : 0;
    
    const avgConfidence = this.learningHistory
      .filter(e => e.metrics?.confidence !== undefined)
      .reduce((sum, e) => sum + (e.metrics?.confidence || 0), 0) / totalEvents || 0;
    
    // Calculate learning velocity (events per hour)
    const hourAgo = Date.now() - 3600000;
    const recentEvents = this.learningHistory.filter(e => e.timestamp.getTime() > hourAgo).length;
    
    // Count insights by type
    const insightsByType: Record<string, number> = {};
    for (const event of this.learningHistory) {
      insightsByType[event.type] = (insightsByType[event.type] || 0) + 1;
    }
    
    return {
      totalEvents,
      successRate,
      averageConfidence: avgConfidence,
      learningVelocity: recentEvents,
      activeStrategies: Array.from(this.activeStrategies),
      adaptationCycles: this.adaptationCycles,
      insights: {
        total: totalEvents,
        byType: insightsByType,
        recent: this.learningHistory.slice(-10).map(e => e.type)
      }
    };
  }
  
  /**
   * Enable/disable specific learning strategies
   */
  setStrategyEnabled(strategyName: string, enabled: boolean): void {
    if (enabled && !this.strategies.has(strategyName)) {
      console.warn(`Strategy ${strategyName} not found`);
      return;
    }
    
    if (!enabled) {
      this.strategies.delete(strategyName);
    }
    
    this.emit('strategy-changed', { strategy: strategyName, enabled });
  }
  
  /**
   * Get current learning configuration
   */
  getConfiguration(): {
    config: AdaptiveLearningConfig;
    globalLearningRate: number;
    enabledStrategies: string[];
    adaptationThreshold: number;
  } {
    return {
      config: this.config,
      globalLearningRate: this.globalLearningRate,
      enabledStrategies: Array.from(this.strategies.keys()),
      adaptationThreshold: this.config.adaptationThreshold
    };
  }
}