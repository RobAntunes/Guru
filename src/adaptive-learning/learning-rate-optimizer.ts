/**
 * Learning Rate Optimization System
 * 
 * Dynamically optimizes learning rates across all subsystems using advanced
 * optimization algorithms including gradient descent, momentum, adaptive
 * learning rates (Adam, RMSprop), and meta-learning approaches.
 */

import { EventEmitter } from 'events';
import { LearningOutcome } from './unified-learning-coordinator.js';
import { LearningTrend } from './learning-history-analytics.js';

export interface LearningRateSchedule {
  type: 'constant' | 'linear' | 'exponential' | 'cosine' | 'adaptive' | 'cyclic';
  initialRate: number;
  finalRate?: number;
  decaySteps?: number;
  cycleLength?: number;
  warmupSteps?: number;
}

export interface OptimizationState {
  component: string;
  parameter: string;
  currentValue: number;
  gradient: number;
  momentum: number;
  velocity: number; // For Adam optimizer
  rmsGradient: number; // For RMSprop
  stepCount: number;
  lastUpdate: Date;
}

export interface OptimizationMetrics {
  convergenceRate: number;
  oscillation: number;
  stability: number;
  efficiency: number;
  optimalityGap: number;
}

export interface MetaLearningState {
  taskHistory: Array<{
    task: string;
    optimalRate: number;
    performance: number;
    context: any;
  }>;
  learnedPriors: Map<string, number>;
  adaptationSpeed: number;
}

export interface OptimizerConfig {
  algorithm: 'sgd' | 'momentum' | 'adam' | 'rmsprop' | 'meta';
  learningRate: number;
  momentum: number;
  beta1: number; // Adam first moment
  beta2: number; // Adam second moment
  epsilon: number; // Numerical stability
  clipGradient: number; // Gradient clipping threshold
  schedule: LearningRateSchedule;
  metaLearning: boolean;
  adaptiveBounds: [number, number];
}

export class LearningRateOptimizer extends EventEmitter {
  private optimizationStates: Map<string, OptimizationState> = new Map();
  private performanceHistory: Array<{
    timestamp: Date;
    component: string;
    learningRate: number;
    performance: number;
  }> = [];
  private metaLearningState: MetaLearningState = {
    taskHistory: [],
    learnedPriors: new Map(),
    adaptationSpeed: 0.1
  };
  private globalStep: number = 0;
  
  constructor(private config: OptimizerConfig) {
    super();
  }
  
  /**
   * Optimize learning rate for a component based on performance
   */
  async optimizeLearningRate(
    component: string,
    parameter: string,
    currentPerformance: number,
    targetPerformance: number = 1.0
  ): Promise<{
    newRate: number;
    adjustment: number;
    metrics: OptimizationMetrics;
  }> {
    const stateKey = `${component}.${parameter}`;
    let state = this.optimizationStates.get(stateKey);
    
    if (!state) {
      // Initialize optimization state
      state = this.initializeState(component, parameter);
      this.optimizationStates.set(stateKey, state);
    }
    
    // Calculate gradient (performance derivative w.r.t. learning rate)
    const gradient = this.estimateGradient(state, currentPerformance, targetPerformance);
    
    // Apply optimization algorithm
    const newRate = await this.applyOptimizer(state, gradient);
    
    // Apply learning rate schedule
    const scheduledRate = this.applySchedule(newRate, state.stepCount);
    
    // Apply bounds
    const boundedRate = this.applyBounds(scheduledRate);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(state, currentPerformance);
    
    // Update state
    state.currentValue = boundedRate;
    state.gradient = gradient;
    state.stepCount++;
    state.lastUpdate = new Date();
    
    // Record performance
    this.recordPerformance(component, boundedRate, currentPerformance);
    
    // Meta-learning update
    if (this.config.metaLearning) {
      await this.updateMetaLearning(component, parameter, boundedRate, currentPerformance);
    }
    
    const adjustment = boundedRate - state.currentValue;
    
    this.emit('rate-optimized', {
      component,
      parameter,
      oldRate: state.currentValue,
      newRate: boundedRate,
      metrics
    });
    
    return {
      newRate: boundedRate,
      adjustment,
      metrics
    };
  }
  
  /**
   * Initialize optimization state
   */
  private initializeState(component: string, parameter: string): OptimizationState {
    const initialRate = this.getInitialRate(component);
    
    return {
      component,
      parameter,
      currentValue: initialRate,
      gradient: 0,
      momentum: 0,
      velocity: 0,
      rmsGradient: 0,
      stepCount: 0,
      lastUpdate: new Date()
    };
  }
  
  /**
   * Get initial learning rate
   */
  private getInitialRate(component: string): number {
    // Check meta-learned priors
    if (this.config.metaLearning) {
      const prior = this.metaLearningState.learnedPriors.get(component);
      if (prior) return prior;
    }
    
    // Use schedule initial rate
    return this.config.schedule.initialRate || this.config.learningRate;
  }
  
  /**
   * Estimate gradient using finite differences
   */
  private estimateGradient(
    state: OptimizationState,
    currentPerformance: number,
    targetPerformance: number
  ): number {
    // Performance error
    const error = targetPerformance - currentPerformance;
    
    // Get historical performance for gradient estimation
    const history = this.getRecentPerformance(state.component, 5);
    
    if (history.length < 2) {
      // Not enough history, use simple gradient
      return error * 0.1;
    }
    
    // Estimate gradient using finite differences
    const recentChanges = history.slice(-2);
    const rateChange = recentChanges[1].learningRate - recentChanges[0].learningRate;
    const perfChange = recentChanges[1].performance - recentChanges[0].performance;
    
    if (Math.abs(rateChange) < 1e-6) {
      // No rate change, use error-based gradient
      return error * 0.1;
    }
    
    // Gradient = performance change / rate change
    const gradient = perfChange / rateChange;
    
    // Scale by error to get direction
    return gradient * error;
  }
  
  /**
   * Apply optimization algorithm
   */
  private async applyOptimizer(state: OptimizationState, gradient: number): Promise<number> {
    // Clip gradient
    const clippedGradient = Math.max(
      -this.config.clipGradient,
      Math.min(this.config.clipGradient, gradient)
    );
    
    switch (this.config.algorithm) {
      case 'sgd':
        return this.sgdUpdate(state, clippedGradient);
        
      case 'momentum':
        return this.momentumUpdate(state, clippedGradient);
        
      case 'adam':
        return this.adamUpdate(state, clippedGradient);
        
      case 'rmsprop':
        return this.rmspropUpdate(state, clippedGradient);
        
      case 'meta':
        return this.metaUpdate(state, clippedGradient);
        
      default:
        return this.sgdUpdate(state, clippedGradient);
    }
  }
  
  /**
   * Stochastic Gradient Descent update
   */
  private sgdUpdate(state: OptimizationState, gradient: number): number {
    return state.currentValue + this.config.learningRate * gradient;
  }
  
  /**
   * Momentum update
   */
  private momentumUpdate(state: OptimizationState, gradient: number): number {
    state.momentum = this.config.momentum * state.momentum + this.config.learningRate * gradient;
    return state.currentValue + state.momentum;
  }
  
  /**
   * Adam optimizer update
   */
  private adamUpdate(state: OptimizationState, gradient: number): number {
    const { beta1, beta2, epsilon } = this.config;
    const t = state.stepCount + 1;
    
    // Update biased first moment estimate
    state.momentum = beta1 * state.momentum + (1 - beta1) * gradient;
    
    // Update biased second raw moment estimate
    state.velocity = beta2 * state.velocity + (1 - beta2) * gradient * gradient;
    
    // Compute bias-corrected first moment estimate
    const mHat = state.momentum / (1 - Math.pow(beta1, t));
    
    // Compute bias-corrected second raw moment estimate
    const vHat = state.velocity / (1 - Math.pow(beta2, t));
    
    // Update parameters
    return state.currentValue + this.config.learningRate * mHat / (Math.sqrt(vHat) + epsilon);
  }
  
  /**
   * RMSprop optimizer update
   */
  private rmspropUpdate(state: OptimizationState, gradient: number): number {
    const { beta2, epsilon } = this.config;
    
    // Update moving average of squared gradients
    state.rmsGradient = beta2 * state.rmsGradient + (1 - beta2) * gradient * gradient;
    
    // Update parameters
    return state.currentValue + this.config.learningRate * gradient / (Math.sqrt(state.rmsGradient) + epsilon);
  }
  
  /**
   * Meta-learning update
   */
  private metaUpdate(state: OptimizationState, gradient: number): number {
    // Use meta-learned adaptation speed
    const adaptationSpeed = this.metaLearningState.adaptationSpeed;
    
    // Combine gradient with meta-learned prior
    const prior = this.metaLearningState.learnedPriors.get(state.component) || state.currentValue;
    const priorInfluence = 0.3;
    
    // Weighted update
    const gradientUpdate = state.currentValue + adaptationSpeed * gradient;
    const metaUpdate = priorInfluence * prior + (1 - priorInfluence) * gradientUpdate;
    
    return metaUpdate;
  }
  
  /**
   * Apply learning rate schedule
   */
  private applySchedule(rate: number, step: number): number {
    const schedule = this.config.schedule;
    
    // Apply warmup if configured
    if (schedule.warmupSteps && step < schedule.warmupSteps) {
      const warmupFactor = step / schedule.warmupSteps;
      rate *= warmupFactor;
    }
    
    // Apply main schedule
    switch (schedule.type) {
      case 'constant':
        return rate;
        
      case 'linear':
        if (schedule.decaySteps && schedule.finalRate !== undefined) {
          const progress = Math.min(1, step / schedule.decaySteps);
          return rate + (schedule.finalRate - rate) * progress;
        }
        return rate;
        
      case 'exponential':
        if (schedule.decaySteps && schedule.finalRate !== undefined) {
          const decayRate = Math.pow(schedule.finalRate / schedule.initialRate, 1 / schedule.decaySteps);
          return rate * Math.pow(decayRate, step);
        }
        return rate;
        
      case 'cosine':
        if (schedule.decaySteps) {
          const progress = Math.min(1, step / schedule.decaySteps);
          const cosineDecay = 0.5 * (1 + Math.cos(Math.PI * progress));
          return schedule.finalRate! + (rate - schedule.finalRate!) * cosineDecay;
        }
        return rate;
        
      case 'cyclic':
        if (schedule.cycleLength) {
          const cycleProgress = (step % schedule.cycleLength) / schedule.cycleLength;
          const cyclicFactor = 0.5 * (1 + Math.sin(2 * Math.PI * cycleProgress));
          return schedule.finalRate! + (rate - schedule.finalRate!) * cyclicFactor;
        }
        return rate;
        
      case 'adaptive':
        // Adaptive schedule based on performance metrics
        return this.adaptiveSchedule(rate, step);
        
      default:
        return rate;
    }
  }
  
  /**
   * Adaptive learning rate schedule
   */
  private adaptiveSchedule(rate: number, step: number): number {
    // Get recent performance trends
    const recentPerf = this.performanceHistory.slice(-10);
    if (recentPerf.length < 5) return rate;
    
    // Calculate performance variance
    const performances = recentPerf.map(p => p.performance);
    const mean = performances.reduce((a, b) => a + b, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / performances.length;
    
    // High variance suggests instability, reduce rate
    if (variance > 0.1) {
      rate *= 0.9;
    }
    
    // Check for plateau
    const recentImprovement = performances[performances.length - 1] - performances[0];
    if (Math.abs(recentImprovement) < 0.01) {
      // Plateau detected, try increasing rate
      rate *= 1.1;
    }
    
    return rate;
  }
  
  /**
   * Apply bounds to learning rate
   */
  private applyBounds(rate: number): number {
    const [minRate, maxRate] = this.config.adaptiveBounds;
    return Math.max(minRate, Math.min(maxRate, rate));
  }
  
  /**
   * Calculate optimization metrics
   */
  private calculateMetrics(state: OptimizationState, performance: number): OptimizationMetrics {
    const history = this.getRecentPerformance(state.component, 20);
    
    // Convergence rate
    const convergenceRate = this.calculateConvergenceRate(history);
    
    // Oscillation detection
    const oscillation = this.detectOscillation(history);
    
    // Stability measure
    const stability = this.calculateStability(history);
    
    // Efficiency (performance gain per unit time)
    const efficiency = this.calculateEfficiency(history);
    
    // Optimality gap estimate
    const optimalityGap = Math.max(0, 1 - performance);
    
    return {
      convergenceRate,
      oscillation,
      stability,
      efficiency,
      optimalityGap
    };
  }
  
  /**
   * Calculate convergence rate
   */
  private calculateConvergenceRate(history: any[]): number {
    if (history.length < 3) return 0;
    
    // Fit exponential decay to performance improvements
    const improvements = [];
    for (let i = 1; i < history.length; i++) {
      improvements.push(history[i].performance - history[i-1].performance);
    }
    
    // Calculate average improvement rate
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, avgImprovement * 10));
  }
  
  /**
   * Detect oscillation in learning
   */
  private detectOscillation(history: any[]): number {
    if (history.length < 4) return 0;
    
    let directionChanges = 0;
    let lastDirection = 0;
    
    for (let i = 1; i < history.length; i++) {
      const direction = Math.sign(history[i].performance - history[i-1].performance);
      if (lastDirection !== 0 && direction !== lastDirection && direction !== 0) {
        directionChanges++;
      }
      if (direction !== 0) lastDirection = direction;
    }
    
    // Normalize oscillation score
    return directionChanges / (history.length - 1);
  }
  
  /**
   * Calculate stability
   */
  private calculateStability(history: any[]): number {
    if (history.length < 2) return 1;
    
    // Calculate variance in learning rates
    const rates = history.map(h => h.learningRate);
    const meanRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - meanRate, 2), 0) / rates.length;
    
    // Lower variance = higher stability
    return 1 / (1 + variance * 100);
  }
  
  /**
   * Calculate efficiency
   */
  private calculateEfficiency(history: any[]): number {
    if (history.length < 2) return 0;
    
    const timeSpan = history[history.length - 1].timestamp.getTime() - history[0].timestamp.getTime();
    const performanceGain = history[history.length - 1].performance - history[0].performance;
    
    if (timeSpan === 0) return 0;
    
    // Performance gain per millisecond, scaled
    return Math.max(0, performanceGain * 1000 / timeSpan);
  }
  
  /**
   * Update meta-learning state
   */
  private async updateMetaLearning(
    component: string,
    parameter: string,
    optimalRate: number,
    performance: number
  ): Promise<void> {
    // Record task
    this.metaLearningState.taskHistory.push({
      task: `${component}.${parameter}`,
      optimalRate,
      performance,
      context: {
        timestamp: Date.now(),
        globalStep: this.globalStep
      }
    });
    
    // Update learned priors
    const currentPrior = this.metaLearningState.learnedPriors.get(component) || optimalRate;
    const newPrior = 0.9 * currentPrior + 0.1 * optimalRate;
    this.metaLearningState.learnedPriors.set(component, newPrior);
    
    // Adapt meta-learning speed based on performance
    if (performance > 0.8) {
      this.metaLearningState.adaptationSpeed *= 0.95; // Slow down when performing well
    } else if (performance < 0.5) {
      this.metaLearningState.adaptationSpeed *= 1.05; // Speed up when performing poorly
    }
    
    // Keep adaptation speed in reasonable bounds
    this.metaLearningState.adaptationSpeed = Math.max(0.01, Math.min(0.5, this.metaLearningState.adaptationSpeed));
    
    // Trim history
    if (this.metaLearningState.taskHistory.length > 1000) {
      this.metaLearningState.taskHistory = this.metaLearningState.taskHistory.slice(-500);
    }
  }
  
  /**
   * Record performance history
   */
  private recordPerformance(component: string, learningRate: number, performance: number): void {
    this.performanceHistory.push({
      timestamp: new Date(),
      component,
      learningRate,
      performance
    });
    
    // Keep history manageable
    if (this.performanceHistory.length > 10000) {
      this.performanceHistory = this.performanceHistory.slice(-5000);
    }
    
    this.globalStep++;
  }
  
  /**
   * Get recent performance for a component
   */
  private getRecentPerformance(component: string, count: number): any[] {
    return this.performanceHistory
      .filter(p => p.component === component)
      .slice(-count);
  }
  
  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    component: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    expectedImprovement: number;
  }> {
    const recommendations: any[] = [];
    
    for (const [key, state] of this.optimizationStates) {
      const history = this.getRecentPerformance(state.component, 10);
      if (history.length < 3) continue;
      
      const metrics = this.calculateMetrics(state, history[history.length - 1].performance);
      
      // High oscillation
      if (metrics.oscillation > 0.5) {
        recommendations.push({
          component: state.component,
          recommendation: 'Reduce learning rate or increase momentum to reduce oscillation',
          priority: 'high',
          expectedImprovement: 0.2
        });
      }
      
      // Slow convergence
      if (metrics.convergenceRate < 0.1 && metrics.optimalityGap > 0.3) {
        recommendations.push({
          component: state.component,
          recommendation: 'Increase learning rate or switch to adaptive optimizer',
          priority: 'medium',
          expectedImprovement: 0.15
        });
      }
      
      // Plateau detection
      if (metrics.convergenceRate < 0.01 && metrics.stability > 0.9) {
        recommendations.push({
          component: state.component,
          recommendation: 'Consider cyclic learning rate or increase exploration',
          priority: 'medium',
          expectedImprovement: 0.1
        });
      }
    }
    
    return recommendations.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
  }
  
  /**
   * Get optimizer analytics
   */
  getOptimizerAnalytics(): {
    activeOptimizations: number;
    averageLearningRate: number;
    convergenceStats: {
      converging: number;
      oscillating: number;
      plateaued: number;
    };
    algorithmPerformance: Map<string, number>;
    metaLearningInsights: {
      adaptationSpeed: number;
      learnedPriors: number;
      tasksSeen: number;
    };
  } {
    const states = Array.from(this.optimizationStates.values());
    
    // Calculate average learning rate
    const avgRate = states.length > 0
      ? states.reduce((sum, s) => sum + s.currentValue, 0) / states.length
      : this.config.learningRate;
    
    // Convergence statistics
    let converging = 0, oscillating = 0, plateaued = 0;
    
    for (const state of states) {
      const history = this.getRecentPerformance(state.component, 10);
      if (history.length < 3) continue;
      
      const metrics = this.calculateMetrics(state, history[history.length - 1].performance);
      
      if (metrics.oscillation > 0.5) oscillating++;
      else if (metrics.convergenceRate < 0.01) plateaued++;
      else converging++;
    }
    
    // Algorithm performance (simulated for now)
    const algorithmPerformance = new Map<string, number>([
      ['sgd', 0.7],
      ['momentum', 0.8],
      ['adam', 0.9],
      ['rmsprop', 0.85],
      ['meta', 0.95]
    ]);
    
    return {
      activeOptimizations: states.length,
      averageLearningRate: avgRate,
      convergenceStats: {
        converging,
        oscillating,
        plateaued
      },
      algorithmPerformance,
      metaLearningInsights: {
        adaptationSpeed: this.metaLearningState.adaptationSpeed,
        learnedPriors: this.metaLearningState.learnedPriors.size,
        tasksSeen: this.metaLearningState.taskHistory.length
      }
    };
  }
  
  /**
   * Reset optimizer state
   */
  resetOptimizer(component?: string): void {
    if (component) {
      // Reset specific component
      for (const [key, state] of this.optimizationStates) {
        if (state.component === component) {
          this.optimizationStates.delete(key);
        }
      }
    } else {
      // Reset all
      this.optimizationStates.clear();
      this.performanceHistory = [];
      this.globalStep = 0;
    }
    
    this.emit('optimizer-reset', component || 'all');
  }
}