/**
 * Revolutionary Adaptive Pattern Detection System
 * Discovers patterns by comparing against random baselines, not hardcoded assumptions
 */

export interface AdaptivePatternResult {
  score: number; // 0-1 based on percentile vs random
  confidence: number; // Statistical confidence based on sample size
  evidence: string;
  statisticalSignificance?: number;
  pValue?: number;
  zScore?: number;
  sampleSize?: number;
  baseline?: number;
  actualValue?: number;
  isEmpty?: boolean;
  isSinglePoint?: boolean;
  needsMoreData?: boolean;
  handleGracefully?: boolean;
}

export class AdaptivePatternDetector {
  /**
   * Detect harmonic patterns by comparing against random baseline
   */
  detectHarmonicSeriesAdaptive(frequencies: number[]): AdaptivePatternResult {
    if (frequencies.length === 0) {
      return { 
        score: 0, 
        confidence: 1.0, 
        evidence: "No data provided - gracefully handled",
        isEmpty: true,
        handleGracefully: true
      };
    }
    
    if (frequencies.length === 1) {
      return { 
        score: 0.1, // Minimal score for single point
        confidence: 0.1, 
        evidence: "Single frequency - insufficient for pattern detection",
        isSinglePoint: true,
        needsMoreData: true
      };
    }
    
    // Calculate actual harmonicity
    const actualHarmonicity = this.calculateHarmonicity(frequencies);
    
    // Generate random baseline
    const randomBaseline = this.generateRandomBaseline(frequencies.length, 1000);
    const percentileRank = this.calculatePercentileRank(actualHarmonicity, randomBaseline.samples);
    
    // Statistical significance
    const zScore = (actualHarmonicity - randomBaseline.mean) / randomBaseline.stdDev;
    const pValue = this.calculatePValue(zScore);
    
    return {
      score: percentileRank,
      confidence: this.calculateStatisticalConfidence(frequencies.length),
      evidence: `Harmonicity ${actualHarmonicity.toFixed(3)} is ${(percentileRank * 100).toFixed(1)}% better than random (z=${zScore.toFixed(2)})`,
      statisticalSignificance: 1 - pValue,
      pValue,
      zScore,
      sampleSize: frequencies.length,
      baseline: randomBaseline.mean,
      actualValue: actualHarmonicity
    };
  }

  /**
   * Calculate how "harmonic" a set of frequencies is
   * Returns a score based on how close frequencies are to integer ratios
   */
  private calculateHarmonicity(frequencies: number[]): number {
    if (frequencies.length < 2) return 0;
    
    let harmonicScore = 0;
    let totalComparisons = 0;
    
    // Sort frequencies to find potential fundamentals
    const sorted = [...frequencies].sort((a, b) => a - b);
    
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const ratio = sorted[j] / sorted[i];
        const nearestInteger = Math.round(ratio);
        const deviation = Math.abs(ratio - nearestInteger);
        
        // Score based on how close to integer ratio
        harmonicScore += Math.exp(-deviation * 10); // Exponential decay
        totalComparisons++;
      }
    }
    
    return totalComparisons > 0 ? harmonicScore / totalComparisons : 0;
  }

  /**
   * Generate random baseline for comparison
   */
  private generateRandomBaseline(length: number, iterations: number): { 
    samples: number[], 
    mean: number, 
    stdDev: number 
  } {
    const samples: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Generate random frequencies in reasonable range
      const randomFreqs = Array.from({ length }, () => 0.1 + Math.random() * 50);
      samples.push(this.calculateHarmonicity(randomFreqs));
    }
    
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    
    return { samples, mean, stdDev };
  }

  /**
   * Calculate percentile rank of value within samples
   */
  private calculatePercentileRank(value: number, samples: number[]): number {
    const sorted = [...samples].sort((a, b) => a - b);
    let rank = 0;
    
    for (const sample of sorted) {
      if (sample < value) rank++;
      else break;
    }
    
    return rank / samples.length;
  }

  /**
   * Calculate p-value from z-score
   */
  private calculatePValue(zScore: number): number {
    // Approximation of normal CDF
    const sign = zScore >= 0 ? 1 : -1;
    const z = Math.abs(zScore);
    const a1 = 0.31938153;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;
    const p = 0.2316419;
    const c = 0.39894228;
    
    const t = 1.0 / (1.0 + p * z);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    
    const b = c * Math.exp((-z * z) / 2.0);
    const n = ((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * b;
    
    return sign === 1 ? 1 - n : n;
  }

  /**
   * Calculate statistical confidence based on sample size
   */
  private calculateStatisticalConfidence(sampleSize: number): number {
    // Confidence increases with sample size, asymptotic to 1
    return 1 - Math.exp(-sampleSize / 10);
  }

  /**
   * Analyze any pattern type adaptively
   */
  analyzePattern<T>(
    data: T[], 
    measureFunction: (data: T[]) => number,
    patternName: string
  ): AdaptivePatternResult {
    
    if (data.length === 0) {
      return this.createEmptyDataResult(patternName);
    }
    
    if (data.length === 1) {
      return this.createSingleDataResult(data[0], patternName);
    }
    
    // Calculate actual measurement
    const actualMeasurement = measureFunction(data);
    
    // Generate baseline with similar data characteristics
    const baseline = this.generateAdaptiveBaseline(data, measureFunction, 1000);
    
    // Calculate significance
    const zScore = baseline.stdDev > 0 ? (actualMeasurement - baseline.mean) / baseline.stdDev : 0;
    const pValue = this.calculatePValue(zScore);
    const percentileRank = this.calculatePercentileRank(actualMeasurement, baseline.samples);
    
    return {
      score: percentileRank,
      confidence: this.calculateStatisticalConfidence(data.length),
      evidence: `${patternName}: actual=${actualMeasurement.toFixed(3)}, baseline=${baseline.mean.toFixed(3)}±${baseline.stdDev.toFixed(3)}, percentile=${(percentileRank * 100).toFixed(1)}%`,
      statisticalSignificance: 1 - pValue,
      pValue,
      zScore,
      sampleSize: data.length,
      baseline: baseline.mean,
      actualValue: actualMeasurement
    };
  }

  private generateAdaptiveBaseline<T>(
    originalData: T[],
    measureFunction: (data: T[]) => number,
    iterations: number
  ): { mean: number, stdDev: number, samples: number[] } {
    
    const samples: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Shuffle data to generate random baseline
      const randomData = this.shuffleArray([...originalData]);
      samples.push(measureFunction(randomData));
    }
    
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev, samples };
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private createEmptyDataResult(patternName: string): AdaptivePatternResult {
    return {
      score: 0,
      confidence: 1.0,
      evidence: `${patternName}: No data to analyze - gracefully handled`,
      isEmpty: true,
      handleGracefully: true
    };
  }

  private createSingleDataResult<T>(dataPoint: T, patternName: string): AdaptivePatternResult {
    return {
      score: 0.1,
      confidence: 0.1,
      evidence: `${patternName}: Single data point - insufficient for pattern detection`,
      isSinglePoint: true,
      needsMoreData: true
    };
  }
}

/**
 * Extract analyzable numeric data from any input
 */
export class DataExtractor {
  static extractNumericData(input: any): number[] {
    const data: number[] = [];
    
    const extract = (obj: any, depth: number = 0) => {
      if (depth > 10) return; // Prevent infinite recursion
      
      if (typeof obj === 'number' && !isNaN(obj) && isFinite(obj)) {
        data.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => extract(item, depth + 1));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(value => extract(value, depth + 1));
      } else if (typeof obj === 'string') {
        // Extract numbers from strings
        const numbers = obj.match(/-?\d+(\.\d+)?/g);
        if (numbers) {
          numbers.forEach(n => {
            const num = parseFloat(n);
            if (!isNaN(num) && isFinite(num)) {
              data.push(num);
            }
          });
        }
      }
    };
    
    extract(input);
    return data;
  }

  static extractPatternFeatures(semanticData: any): Map<string, number[]> {
    const features = new Map<string, number[]>();
    
    // Extract various numeric features
    if (semanticData.symbols) {
      const symbols = Array.from(semanticData.symbols.values());
      
      // Line counts
      features.set('lineCounts', symbols.map(s => (s.endLine || s.line) - s.line + 1));
      
      // Name lengths
      features.set('nameLengths', symbols.map(s => s.name?.length || 0));
      
      // Complexity scores
      features.set('complexity', symbols.map(s => s.complexity || 1));
      
      // Symbol type frequencies
      const typeFreqs = new Map<string, number>();
      symbols.forEach(s => {
        typeFreqs.set(s.kind, (typeFreqs.get(s.kind) || 0) + 1);
      });
      features.set('typeFrequencies', Array.from(typeFreqs.values()));
    }
    
    if (semanticData.relationships) {
      // Relationship counts
      const relCounts = Array.from(semanticData.relationships.values()).map(r => r.length);
      features.set('relationshipCounts', relCounts);
    }
    
    return features;
  }
}