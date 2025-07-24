/**
 * Confidence-Aware Learning System
 * 
 * Adapts learning strategies based on confidence levels, implementing
 * dynamic exploration-exploitation balance and confidence calibration.
 */

import { EventEmitter } from 'events';
import { LearningOutcome } from './unified-learning-coordinator.js';
import { LearningEvent } from './unified-learning-coordinator.js';

export interface ConfidenceContext {
  domain: string;
  currentConfidence: number;
  historicalConfidence: number[];
  confidenceVariance: number;
  calibrationError: number; // How wrong our confidence estimates have been
  uncertaintySource: 'data' | 'model' | 'domain' | 'temporal';
}

export interface ConfidenceStrategy {
  name: string;
  confidenceRange: [number, number];
  explorationRate: number;
  learningMultiplier: number;
  uncertaintyHandling: 'explore' | 'exploit' | 'mixed';
  riskTolerance: number;
}

export interface ConfidenceCalibration {
  domain: string;
  actualOutcomes: number[];
  predictedConfidences: number[];
  calibrationCurve: Array<{ predicted: number; actual: number }>;
  calibrationError: number;
  lastCalibrated: Date;
}

export interface ConfidenceLearningConfig {
  calibrationWindow: number; // Number of events for calibration
  confidenceThresholds: {
    veryLow: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  adaptiveThresholds: boolean;
  uncertaintyPenalty: number;
  calibrationFrequency: number; // How often to recalibrate (events)
}

export class ConfidenceAwareLearning extends EventEmitter {
  private strategies: Map<string, ConfidenceStrategy> = new Map();
  private calibrations: Map<string, ConfidenceCalibration> = new Map();
  private confidenceHistory: Map<string, number[]> = new Map();
  private outcomeHistory: Map<string, boolean[]> = new Map();
  private dynamicThresholds: Map<string, any> = new Map();
  
  constructor(private config: ConfidenceLearningConfig) {
    super();
    this.initializeStrategies();
  }
  
  /**
   * Initialize confidence-based strategies
   */
  private initializeStrategies(): void {
    const { confidenceThresholds } = this.config;
    
    // Very Low Confidence Strategy - Maximum exploration
    this.strategies.set('very-low-confidence', {
      name: 'Maximum Exploration',
      confidenceRange: [0, confidenceThresholds.veryLow],
      explorationRate: 0.8,
      learningMultiplier: 1.5,
      uncertaintyHandling: 'explore',
      riskTolerance: 0.9
    });
    
    // Low Confidence Strategy - Balanced exploration
    this.strategies.set('low-confidence', {
      name: 'Balanced Exploration',
      confidenceRange: [confidenceThresholds.veryLow, confidenceThresholds.low],
      explorationRate: 0.5,
      learningMultiplier: 1.3,
      uncertaintyHandling: 'mixed',
      riskTolerance: 0.7
    });
    
    // Medium Confidence Strategy - Cautious progress
    this.strategies.set('medium-confidence', {
      name: 'Cautious Progress',
      confidenceRange: [confidenceThresholds.low, confidenceThresholds.medium],
      explorationRate: 0.3,
      learningMultiplier: 1.1,
      uncertaintyHandling: 'mixed',
      riskTolerance: 0.5
    });
    
    // High Confidence Strategy - Exploitation focus
    this.strategies.set('high-confidence', {
      name: 'Exploitation Focus',
      confidenceRange: [confidenceThresholds.medium, confidenceThresholds.high],
      explorationRate: 0.15,
      learningMultiplier: 0.9,
      uncertaintyHandling: 'exploit',
      riskTolerance: 0.3
    });
    
    // Very High Confidence Strategy - Pure exploitation
    this.strategies.set('very-high-confidence', {
      name: 'Pure Exploitation',
      confidenceRange: [confidenceThresholds.high, confidenceThresholds.veryHigh],
      explorationRate: 0.05,
      learningMultiplier: 0.7,
      uncertaintyHandling: 'exploit',
      riskTolerance: 0.1
    });
  }
  
  /**
   * Select learning approach based on confidence
   */
  async selectConfidenceStrategy(context: ConfidenceContext): Promise<{
    strategy: ConfidenceStrategy;
    adjustments: {
      explorationBonus: number;
      learningRateMultiplier: number;
      uncertaintyHandling: string;
    };
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    
    // Get calibrated confidence
    const calibratedConfidence = this.getCalibratedConfidence(
      context.domain,
      context.currentConfidence
    );
    
    // Select base strategy
    let selectedStrategy: ConfidenceStrategy | undefined;
    for (const strategy of this.strategies.values()) {
      if (calibratedConfidence >= strategy.confidenceRange[0] && 
          calibratedConfidence <= strategy.confidenceRange[1]) {
        selectedStrategy = strategy;
        break;
      }
    }
    
    if (!selectedStrategy) {
      selectedStrategy = this.strategies.get('medium-confidence')!;
      reasoning.push('Defaulting to medium confidence strategy');
    } else {
      reasoning.push(`Selected ${selectedStrategy.name} for confidence ${calibratedConfidence.toFixed(3)}`);
    }
    
    // Calculate adjustments based on additional factors
    const adjustments = this.calculateAdjustments(context, selectedStrategy, reasoning);
    
    // Emit strategy selection
    this.emit('strategy-selected', {
      context,
      strategy: selectedStrategy,
      adjustments,
      calibratedConfidence
    });
    
    return {
      strategy: selectedStrategy,
      adjustments,
      reasoning
    };
  }
  
  /**
   * Calculate strategy adjustments
   */
  private calculateAdjustments(
    context: ConfidenceContext,
    strategy: ConfidenceStrategy,
    reasoning: string[]
  ): {
    explorationBonus: number;
    learningRateMultiplier: number;
    uncertaintyHandling: string;
  } {
    let explorationBonus = 0;
    let learningRateMultiplier = strategy.learningMultiplier;
    let uncertaintyHandling = strategy.uncertaintyHandling;
    
    // High variance increases exploration
    if (context.confidenceVariance > 0.2) {
      explorationBonus += 0.1;
      reasoning.push('High confidence variance - increasing exploration');
    }
    
    // Calibration error adjustments
    if (context.calibrationError > 0.15) {
      explorationBonus += 0.15;
      learningRateMultiplier *= 1.2;
      reasoning.push('High calibration error - boosting exploration and learning');
    }
    
    // Uncertainty source adjustments
    switch (context.uncertaintySource) {
      case 'data':
        explorationBonus += 0.05;
        reasoning.push('Data uncertainty - slight exploration increase');
        break;
      case 'model':
        explorationBonus += 0.1;
        learningRateMultiplier *= 1.1;
        reasoning.push('Model uncertainty - increasing both exploration and learning');
        break;
      case 'domain':
        explorationBonus += 0.2;
        uncertaintyHandling = 'explore';
        reasoning.push('Domain uncertainty - maximum exploration mode');
        break;
      case 'temporal':
        explorationBonus += 0.15;
        reasoning.push('Temporal uncertainty - increasing exploration for adaptation');
        break;
    }
    
    // Dynamic threshold adjustments
    if (this.config.adaptiveThresholds) {
      const thresholdAdjustment = this.getDynamicThresholdAdjustment(context.domain);
      if (thresholdAdjustment !== 0) {
        explorationBonus += thresholdAdjustment * 0.1;
        reasoning.push(`Dynamic threshold adjustment: ${thresholdAdjustment.toFixed(2)}`);
      }
    }
    
    return {
      explorationBonus: Math.min(0.5, explorationBonus), // Cap at 50% bonus
      learningRateMultiplier,
      uncertaintyHandling
    };
  }
  
  /**
   * Get calibrated confidence
   */
  private getCalibratedConfidence(domain: string, rawConfidence: number): number {
    const calibration = this.calibrations.get(domain);
    
    if (!calibration || calibration.calibrationCurve.length < 3) {
      // Not enough data for calibration
      return rawConfidence;
    }
    
    // Find closest calibration points
    const curve = calibration.calibrationCurve;
    let lower = curve[0];
    let upper = curve[curve.length - 1];
    
    for (const point of curve) {
      if (point.predicted <= rawConfidence && point.predicted > lower.predicted) {
        lower = point;
      }
      if (point.predicted >= rawConfidence && point.predicted < upper.predicted) {
        upper = point;
      }
    }
    
    // Linear interpolation
    if (lower === upper) {
      return lower.actual;
    }
    
    const ratio = (rawConfidence - lower.predicted) / (upper.predicted - lower.predicted);
    return lower.actual + ratio * (upper.actual - lower.actual);
  }
  
  /**
   * Update confidence calibration
   */
  async updateCalibration(
    domain: string,
    predictedConfidence: number,
    actualOutcome: boolean
  ): Promise<void> {
    // Update history
    const confidences = this.confidenceHistory.get(domain) || [];
    confidences.push(predictedConfidence);
    this.confidenceHistory.set(domain, confidences.slice(-this.config.calibrationWindow));
    
    const outcomes = this.outcomeHistory.get(domain) || [];
    outcomes.push(actualOutcome);
    this.outcomeHistory.set(domain, outcomes.slice(-this.config.calibrationWindow));
    
    // Check if recalibration needed
    if (confidences.length >= this.config.calibrationFrequency &&
        confidences.length % this.config.calibrationFrequency === 0) {
      await this.recalibrate(domain);
    }
  }
  
  /**
   * Recalibrate confidence for a domain
   */
  private async recalibrate(domain: string): Promise<void> {
    const confidences = this.confidenceHistory.get(domain) || [];
    const outcomes = this.outcomeHistory.get(domain) || [];
    
    if (confidences.length < 10 || outcomes.length < 10) {
      return; // Not enough data
    }
    
    // Build calibration curve
    const bins = 10;
    const binSize = 1.0 / bins;
    const calibrationCurve: Array<{ predicted: number; actual: number }> = [];
    
    for (let i = 0; i < bins; i++) {
      const binMin = i * binSize;
      const binMax = (i + 1) * binSize;
      const binCenter = (binMin + binMax) / 2;
      
      // Find all predictions in this bin
      const binIndices: number[] = [];
      confidences.forEach((conf, idx) => {
        if (conf >= binMin && conf < binMax) {
          binIndices.push(idx);
        }
      });
      
      if (binIndices.length > 0) {
        // Calculate actual success rate for this bin
        const successCount = binIndices.filter(idx => outcomes[idx]).length;
        const actualRate = successCount / binIndices.length;
        
        calibrationCurve.push({
          predicted: binCenter,
          actual: actualRate
        });
      }
    }
    
    // Calculate calibration error
    const calibrationError = calibrationCurve.reduce((sum, point) => {
      return sum + Math.abs(point.predicted - point.actual);
    }, 0) / calibrationCurve.length;
    
    // Update calibration
    this.calibrations.set(domain, {
      domain,
      actualOutcomes: [...outcomes],
      predictedConfidences: [...confidences],
      calibrationCurve,
      calibrationError,
      lastCalibrated: new Date()
    });
    
    // Update dynamic thresholds if enabled
    if (this.config.adaptiveThresholds) {
      this.updateDynamicThresholds(domain, calibrationError);
    }
    
    this.emit('calibration-updated', {
      domain,
      calibrationError,
      curvePoints: calibrationCurve.length
    });
  }
  
  /**
   * Update dynamic thresholds based on calibration
   */
  private updateDynamicThresholds(domain: string, calibrationError: number): void {
    const currentThresholds = this.dynamicThresholds.get(domain) || { ...this.config.confidenceThresholds };
    
    // Adjust thresholds based on calibration error
    const adjustment = calibrationError > 0.1 ? 0.05 : -0.02;
    
    // Update each threshold
    for (const [key, value] of Object.entries(currentThresholds)) {
      if (typeof value === 'number') {
        currentThresholds[key] = Math.max(0.1, Math.min(0.9, value + adjustment));
      }
    }
    
    this.dynamicThresholds.set(domain, currentThresholds);
  }
  
  /**
   * Get dynamic threshold adjustment
   */
  private getDynamicThresholdAdjustment(domain: string): number {
    const dynamicThresholds = this.dynamicThresholds.get(domain);
    if (!dynamicThresholds) return 0;
    
    // Calculate deviation from original thresholds
    let totalDeviation = 0;
    let count = 0;
    
    for (const [key, value] of Object.entries(this.config.confidenceThresholds)) {
      if (typeof value === 'number' && key in dynamicThresholds) {
        totalDeviation += dynamicThresholds[key] - value;
        count++;
      }
    }
    
    return count > 0 ? totalDeviation / count : 0;
  }
  
  /**
   * Learn from confidence prediction outcome
   */
  async learnFromOutcome(
    domain: string,
    predictedConfidence: number,
    actualOutcome: boolean,
    context?: any
  ): Promise<{
    calibrationNeeded: boolean;
    confidenceAdjustment: number;
    learningInsights: string[];
  }> {
    const insights: string[] = [];
    
    // Update calibration data
    await this.updateCalibration(domain, predictedConfidence, actualOutcome);
    
    // Calculate confidence adjustment
    const expectedOutcome = predictedConfidence > 0.5;
    const correct = expectedOutcome === actualOutcome;
    const confidenceError = Math.abs(predictedConfidence - (actualOutcome ? 1 : 0));
    
    let confidenceAdjustment = 0;
    
    if (!correct) {
      // Wrong prediction
      if (predictedConfidence > 0.7) {
        confidenceAdjustment = -0.1;
        insights.push('Overconfident prediction failed - reducing confidence');
      } else if (predictedConfidence < 0.3) {
        confidenceAdjustment = 0.1;
        insights.push('Underconfident prediction succeeded - increasing confidence');
      }
    } else {
      // Correct prediction
      if (confidenceError > 0.3) {
        const direction = actualOutcome ? 0.05 : -0.05;
        confidenceAdjustment = direction;
        insights.push(`Correct but imprecise - adjusting by ${direction}`);
      }
    }
    
    // Check if calibration is significantly off
    const calibration = this.calibrations.get(domain);
    const calibrationNeeded = calibration ? calibration.calibrationError > 0.15 : false;
    
    if (calibrationNeeded) {
      insights.push('Calibration error high - recalibration recommended');
    }
    
    // Emit learning event
    this.emit('confidence-learning', {
      domain,
      predictedConfidence,
      actualOutcome,
      correct,
      confidenceError,
      confidenceAdjustment,
      insights
    });
    
    return {
      calibrationNeeded,
      confidenceAdjustment,
      learningInsights: insights
    };
  }
  
  /**
   * Get confidence analytics
   */
  getConfidenceAnalytics(domain?: string): {
    calibrations: Map<string, ConfidenceCalibration>;
    strategies: Map<string, ConfidenceStrategy>;
    domainStats: Array<{
      domain: string;
      avgConfidence: number;
      calibrationError: number;
      successRate: number;
      dataPoints: number;
    }>;
    recommendations: string[];
  } {
    const domainStats: any[] = [];
    const recommendations: string[] = [];
    
    // Calculate stats for each domain
    const domains = domain ? [domain] : Array.from(this.confidenceHistory.keys());
    
    for (const d of domains) {
      const confidences = this.confidenceHistory.get(d) || [];
      const outcomes = this.outcomeHistory.get(d) || [];
      const calibration = this.calibrations.get(d);
      
      if (confidences.length > 0) {
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        const successRate = outcomes.filter(o => o).length / outcomes.length;
        
        domainStats.push({
          domain: d,
          avgConfidence,
          calibrationError: calibration?.calibrationError || 0,
          successRate,
          dataPoints: confidences.length
        });
        
        // Generate recommendations
        if (Math.abs(avgConfidence - successRate) > 0.2) {
          recommendations.push(
            `Domain '${d}': Large gap between confidence (${avgConfidence.toFixed(2)}) ` +
            `and success rate (${successRate.toFixed(2)})`
          );
        }
        
        if (calibration && calibration.calibrationError > 0.2) {
          recommendations.push(
            `Domain '${d}': High calibration error (${calibration.calibrationError.toFixed(2)})`
          );
        }
      }
    }
    
    return {
      calibrations: this.calibrations,
      strategies: this.strategies,
      domainStats,
      recommendations
    };
  }
  
  /**
   * Reset confidence data for a domain
   */
  resetDomain(domain: string): void {
    this.confidenceHistory.delete(domain);
    this.outcomeHistory.delete(domain);
    this.calibrations.delete(domain);
    this.dynamicThresholds.delete(domain);
    
    this.emit('domain-reset', domain);
  }
  
  /**
   * Export confidence data
   */
  exportConfidenceData(): any {
    return {
      confidenceHistory: Array.from(this.confidenceHistory.entries()),
      outcomeHistory: Array.from(this.outcomeHistory.entries()),
      calibrations: Array.from(this.calibrations.entries()),
      dynamicThresholds: Array.from(this.dynamicThresholds.entries()),
      config: this.config
    };
  }
  
  /**
   * Import confidence data
   */
  importConfidenceData(data: any): void {
    if (data.confidenceHistory) {
      this.confidenceHistory = new Map(data.confidenceHistory);
    }
    
    if (data.outcomeHistory) {
      this.outcomeHistory = new Map(data.outcomeHistory);
    }
    
    if (data.calibrations) {
      this.calibrations = new Map(data.calibrations.map((entry: any) => [
        entry[0],
        {
          ...entry[1],
          lastCalibrated: new Date(entry[1].lastCalibrated)
        }
      ]));
    }
    
    if (data.dynamicThresholds) {
      this.dynamicThresholds = new Map(data.dynamicThresholds);
    }
    
    this.emit('data-imported');
  }
}