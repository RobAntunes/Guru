/**
 * Base class for all pattern analyzers
 * @module harmonic-intelligence/analyzers
 */
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory
} from '../interfaces/harmonic-types.js';
import { Logger } from '../../utils/logger.js';
import { DynamicThreshold, smoothThreshold, AdaptiveThreshold } from '../interfaces/dynamic-threshold.js';
export abstract class BasePatternAnalyzer {
  protected abstract readonly logger: Logger;
  protected abstract readonly category: PatternCategory;
  
  // Adaptive threshold for each analyzer instance - initialized on first use
  protected adaptiveThreshold: AdaptiveThreshold | null = null;
  
  // Historical scores for dynamic threshold calculation
  protected scoreHistory: number[] = [];
  
  // Collect initial scores before determining threshold
  protected initialScores: number[] = [];
  /**
   * Analyze patterns in the semantic data
   * @param semanticData The semantic data to analyze
   * @returns Map of pattern types to their scores
   */
  public abstract analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>>;
  /**
   * Validate semantic data before analysis
   */
  protected validateSemanticData(semanticData: SemanticData): void {
    if (!semanticData) {
      throw new Error('Semantic data is required');
    }
    if (!semanticData.symbols || semanticData.symbols.size === 0) {
      throw new Error('No symbols found in semantic data');
    }
    if (!semanticData.relationships) {
      throw new Error('No relationships found in semantic data');
    }
  }
  /**
   * Calculate statistical confidence based on sample size
   */
  protected calculateStatisticalConfidence(sampleSize: number, detections: number): number {
    if (sampleSize === 0) return 0;
    // Use Wilson score interval for binomial confidence
    const p = detections / sampleSize;
    const z = 1.96; // 95% confidence
    const denominator = 1 + z * z / sampleSize;
    const centre = (p + z * z / (2 * sampleSize)) / denominator;
    const margin = z * Math.sqrt(p * (1 - p) / sampleSize + z * z / (4 * sampleSize * sampleSize)) / denominator;
    // Return lower bound of confidence interval
    return Math.max(0, centre - margin);
  }
  /**
   * Normalize score to 0-1 range
   */
  protected normalizeScore(value: number, min: number = 0, max: number = 1): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
  /**
   * Calculate weighted average of scores
   */
  protected weightedAverage(scores: Array<{ value: number; weight: number }>): number {
    if (scores.length === 0) return 0;
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
    return weightedSum / totalWeight;
  }
  /**
   * Check if a value is within tolerance of target
   */
  protected isWithinTolerance(value: number, target: number, tolerance: number): boolean {
    return Math.abs(value - target) <= tolerance;
  }
  /**
   * Calculate standard deviation
   */
  protected standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }
  /**
   * Calculate correlation coefficient
   */
  protected correlationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    if (denomX === 0 || denomY === 0) return 0;
    return numerator / Math.sqrt(denomX * denomY);
  }
  /**
   * Extract numeric features from symbols
   */
  protected extractNumericFeatures(symbols: any[]): Map<string, number[]> {
    const features = new Map<string, number[]>();
    // Line counts
    features.set('lineCounts', symbols.map(s => (s.endLine || s.line) - s.line + 1));
    // Complexity scores
    features.set('complexity', symbols.map(s => s.complexity || 1));
    // Dependency counts
    features.set('dependencies', symbols.map(s => s.dependencies?.length || 0));
    // Parameter counts (for functions)
    const functions = symbols.filter(s => s.kind === 'function' || s.kind === 'method');
    features.set('parameterCounts', functions.map(s => s.parameters?.length || 0));
    return features;
  }
  /**
   * Detect outliers using IQR method
   */
  protected detectOutliers(values: number[]): { outliers: number[]; indices: number[] } {
    if (values.length < 4) return { outliers: [], indices: [] };
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers: number[] = [];
    const indices: number[] = [];
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });
    return { outliers, indices };
  }
  
  /**
   * Initialize adaptive threshold based on actual score distribution
   * Uses statistical properties of the data instead of arbitrary values
   */
  protected initializeThreshold(scores: number[]): void {
    if (this.adaptiveThreshold === null && scores.length > 0) {
      // Calculate initial threshold from data properties
      const sorted = [...scores].sort((a, b) => a - b);
      
      // Use interquartile range method
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      
      // Initial threshold: Q1 + 0.5 * IQR
      // This captures values above the lower quartile but not outliers
      let initialThreshold = q1 + 0.5 * iqr;
      
      // If IQR is too small (uniform distribution), use mean + 0.5 * stddev
      if (iqr < 0.1) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const stddev = Math.sqrt(
          scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
        );
        initialThreshold = mean + 0.5 * stddev;
      }
      
      // Ensure threshold is in valid range
      initialThreshold = Math.max(0.05, Math.min(0.95, initialThreshold));
      
      this.adaptiveThreshold = new AdaptiveThreshold(initialThreshold);
      // Log initialization if logger is available
      if (this.logger) {
        this.logger.debug(`Initialized threshold to ${initialThreshold.toFixed(3)} based on ${scores.length} scores`);
      }
    }
  }
  
  /**
   * Calculate dynamic detection threshold based on pattern scores
   * Replaces hardcoded thresholds with statistical approach
   */
  protected calculateDynamicThreshold(scores: number[]): number {
    // Initialize threshold if needed
    this.initializeThreshold(scores);
    
    // Update adaptive threshold with new scores
    if (this.adaptiveThreshold) {
      this.adaptiveThreshold.update(scores);
      return this.adaptiveThreshold.getThreshold();
    }
    
    // Fallback: calculate from current scores
    return DynamicThreshold.calculateDetectionThreshold(scores, { 
      dataSize: scores.length, 
      patternCategory: this.category 
    });
  }
  
  /**
   * Determine if pattern is detected using smooth threshold
   * Avoids binary decisions from hardcoded values
   */
  protected isPatternDetected(score: number, threshold?: number): boolean {
    // Collect initial scores
    this.initialScores.push(score);
    
    // Initialize threshold after collecting enough data
    if (this.adaptiveThreshold === null && this.initialScores.length >= 3) {
      this.initializeThreshold(this.initialScores);
    }
    
    // Use provided threshold or calculate from data
    let dynamicThreshold: number;
    if (threshold !== undefined) {
      dynamicThreshold = threshold;
    } else if (this.adaptiveThreshold) {
      dynamicThreshold = this.adaptiveThreshold.getThreshold();
    } else if (this.initialScores.length >= 2) {
      // Calculate threshold from available scores
      dynamicThreshold = DynamicThreshold.calculateDetectionThreshold(
        this.initialScores, 
        { dataSize: this.initialScores.length, patternCategory: this.category }
      );
    } else {
      // With only 1 score, use z-score approach
      // Assume scores follow a beta distribution (common for bounded [0,1] data)
      // For beta(2,2), mean=0.5, std≈0.224
      // Score is significant if |z-score| > 1
      const assumedMean = 0.5;
      const assumedStd = 0.224;
      const zScore = (score - assumedMean) / assumedStd;
      
      // Threshold at 1 standard deviation from mean
      dynamicThreshold = assumedMean + assumedStd;
      
      // But if score is already high, adjust threshold to just below it
      if (score > dynamicThreshold) {
        dynamicThreshold = score - assumedStd * 0.5;
      }
    }
    
    // Use smooth transition instead of hard cutoff
    const smoothScore = smoothThreshold(score, dynamicThreshold);
    return smoothScore > 0.5; // More than 50% confidence after smoothing
  }
  
  /**
   * Calculate confidence without arbitrary magic numbers
   * Based on evidence quality and statistical significance
   */
  protected calculateConfidence(evidence: any[], expectedEvidence: number = 3): number {
    if (evidence.length === 0) return 0;
    
    // Base confidence from evidence count
    const evidenceRatio = Math.min(1, evidence.length / expectedEvidence);
    
    // Weight-based confidence
    const totalWeight = evidence.reduce((sum, e) => sum + (e.weight || 0), 0);
    const maxPossibleWeight = evidence.length; // Assuming max weight of 1 per evidence
    const weightRatio = totalWeight / maxPossibleWeight;
    
    // Value-based confidence (if evidence has values)
    let valueConfidence = 0;
    const evidenceWithValues = evidence.filter(e => e.value !== undefined);
    if (evidenceWithValues.length > 0) {
      valueConfidence = evidenceWithValues.reduce((sum, e) => {
        const normalizedValue = Math.max(0, Math.min(1, e.value));
        return sum + normalizedValue * (e.weight || 1);
      }, 0) / evidenceWithValues.length;
    }
    
    // Combine all factors
    const factors = [evidenceRatio, weightRatio];
    if (valueConfidence > 0) factors.push(valueConfidence);
    
    // Use geometric mean for more balanced confidence
    const product = factors.reduce((prod, f) => prod * f, 1);
    const confidence = Math.pow(product, 1 / factors.length);
    
    // Apply statistical significance adjustment
    const sampleSize = evidence.length;
    const significanceAdjustment = 1 - Math.exp(-sampleSize / 3); // Asymptotic to 1
    
    return confidence * significanceAdjustment;
  }
  
  /**
   * Calculate dynamic tolerance based on data variance
   * Replaces hardcoded percentage tolerances
   */
  protected calculateDynamicTolerance(values: number[], target: number): number {
    return DynamicThreshold.calculateTolerance(values, target, {});
  }
}