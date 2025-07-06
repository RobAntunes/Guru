/**
 * Base class for all pattern analyzers
 * @module harmonic-intelligence/analyzers
 */
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory
} from '../interfaces/harmonic-types';
import { Logger } from '../../utils/logger';
export abstract class BasePatternAnalyzer {
  protected abstract readonly logger: Logger;
  protected abstract readonly category: PatternCategory;
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
}