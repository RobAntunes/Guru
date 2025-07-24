/**
 * Dynamic threshold calculation for pattern detection
 * Avoids arbitrary magic numbers by using statistical methods
 */

export interface ThresholdContext {
  dataSize: number;
  patternCategory: string;
  historicalScores?: number[];
  noiseLevel?: number;
}

export class DynamicThreshold {
  /**
   * Calculate adaptive threshold based on data characteristics
   * Uses statistical methods instead of arbitrary values
   */
  static calculateDetectionThreshold(
    scores: number[],
    context: ThresholdContext
  ): number {
    if (scores.length === 0) return 0.5; // No data fallback

    // Sort scores to find distribution
    const sorted = [...scores].sort((a, b) => a - b);
    
    // Calculate statistical measures
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Use Otsu's method - find threshold that minimizes intra-class variance
    let bestThreshold = mean;
    let minVariance = Infinity;
    
    // Test thresholds at percentiles
    const percentiles = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (const p of percentiles) {
      const threshold = sorted[Math.floor(p * sorted.length)];
      
      // Calculate intra-class variance
      const below = scores.filter(s => s <= threshold);
      const above = scores.filter(s => s > threshold);
      
      if (below.length > 0 && above.length > 0) {
        const belowVar = this.calculateVariance(below);
        const aboveVar = this.calculateVariance(above);
        const intraVar = (below.length * belowVar + above.length * aboveVar) / scores.length;
        
        if (intraVar < minVariance) {
          minVariance = intraVar;
          bestThreshold = threshold;
        }
      }
    }
    
    // Adjust based on context
    if (context.dataSize < 10) {
      // Small dataset - be more conservative
      bestThreshold = Math.max(bestThreshold, mean + 0.5 * stdDev);
    }
    
    if (context.noiseLevel && context.noiseLevel > 0.3) {
      // High noise - raise threshold
      bestThreshold += context.noiseLevel * stdDev;
    }
    
    return Math.max(0, Math.min(1, bestThreshold));
  }
  
  /**
   * Calculate quality tiers dynamically based on score distribution
   * Avoids arbitrary tier boundaries
   */
  static calculateQualityTiers(scores: number[]): {
    premium: number;
    standard: number;
    archive: number;
  } {
    if (scores.length === 0) {
      return { premium: 0.8, standard: 0.5, archive: 0.2 };
    }
    
    const sorted = [...scores].sort((a, b) => b - a); // Descending
    
    // Use percentiles instead of fixed thresholds
    // Top 15% = premium, next 35% = standard, rest = archive
    const premiumIdx = Math.floor(0.15 * sorted.length);
    const standardIdx = Math.floor(0.5 * sorted.length);
    
    return {
      premium: sorted[Math.max(0, premiumIdx - 1)] || 0.8,
      standard: sorted[Math.max(0, standardIdx - 1)] || 0.5,
      archive: sorted[sorted.length - 1] * 0.5 || 0.2
    };
  }
  
  /**
   * Calculate tolerance dynamically based on signal characteristics
   */
  static calculateTolerance(
    values: number[],
    targetValue: number,
    context: { isFrequency?: boolean; isRatio?: boolean }
  ): number {
    if (values.length === 0) return 0.1;
    
    // Calculate local variance around target
    const nearTarget = values.filter(v => Math.abs(v - targetValue) < targetValue);
    const localStdDev = this.calculateStdDev(nearTarget);
    
    if (context.isFrequency) {
      // Frequency tolerance should be tighter at low frequencies
      return Math.min(0.2, localStdDev * 2 / Math.sqrt(targetValue + 1));
    }
    
    if (context.isRatio) {
      // Ratio tolerance based on local variance
      return Math.min(0.15, localStdDev * 1.5);
    }
    
    // Default: 2 standard deviations
    return Math.min(0.3, localStdDev * 2);
  }
  
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  private static calculateStdDev(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }
}

/**
 * Smooth transition function instead of hard threshold
 * Avoids binary decisions
 */
export function smoothThreshold(
  value: number,
  threshold: number,
  steepness: number = 10
): number {
  // Sigmoid function for smooth transition
  return 1 / (1 + Math.exp(-steepness * (value - threshold)));
}

/**
 * Adaptive threshold with hysteresis to prevent oscillation
 */
export class AdaptiveThreshold {
  private history: number[] = [];
  private currentThreshold: number;
  private readonly maxHistory = 100;
  private readonly hysteresis = 0.05;
  
  constructor(initialThreshold: number) {
    // No default value - must be calculated from data
    this.currentThreshold = initialThreshold;
  }
  
  update(newScores: number[]): number {
    // Add to history
    this.history.push(...newScores);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    
    // Calculate new threshold
    const newThreshold = DynamicThreshold.calculateDetectionThreshold(
      this.history,
      { dataSize: this.history.length, patternCategory: 'adaptive' }
    );
    
    // Apply hysteresis to prevent oscillation
    if (Math.abs(newThreshold - this.currentThreshold) > this.hysteresis) {
      this.currentThreshold = newThreshold;
    }
    
    return this.currentThreshold;
  }
  
  getThreshold(): number {
    return this.currentThreshold;
  }
}