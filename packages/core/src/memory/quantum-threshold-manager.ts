/**
 * Dynamic threshold management for quantum memory and pattern detection
 * Replaces arbitrary thresholds with data-driven approaches
 */

export interface QueryContext {
  searchMode: 'precision' | 'discovery' | 'creative' | 'balanced';
  queryComplexity?: number;
  historicalSuccess?: number;
}

export interface SystemState {
  coordinateSpaceDensity: number;
  memoryPressure: number;
  recentQueryPerformance: number;
}

export class QuantumThresholdManager {
  calculateDynamicThreshold(
    candidateProbabilities: number[],
    queryContext: QueryContext,
    systemState: SystemState
  ): number {
    
    // Edge case: No candidates
    if (candidateProbabilities.length === 0) {
      return this.getAdaptiveDefault(queryContext, systemState);
    }
    
    // Small dataset: Use minimum-based threshold
    if (candidateProbabilities.length < 5) {
      const minProb = Math.min(...candidateProbabilities);
      return Math.max(0.0001, minProb * 0.3); // 30% of minimum
    }
    
    // Large dataset: Use statistical analysis
    const thresholdStrategies = {
      percentile: this.calculatePercentile(candidateProbabilities, 0.05), // Bottom 5%
      clustering: this.calculateClusterThreshold(candidateProbabilities),
      entropy: this.calculateEntropyThreshold(candidateProbabilities),
      stdDev: this.calculateStdDevThreshold(candidateProbabilities)
    };
    
    // Choose strategy based on query intent
    switch (queryContext.searchMode) {
      case 'precision':
        return Math.max(thresholdStrategies.clustering, thresholdStrategies.percentile);
      
      case 'discovery':
        return Math.min(thresholdStrategies.entropy, thresholdStrategies.stdDev);
      
      case 'creative':
        return thresholdStrategies.percentile * 0.5; // Very permissive
      
      default:
        return thresholdStrategies.clustering; // Balanced approach
    }
  }
  
  private getAdaptiveDefault(queryContext: QueryContext, systemState: SystemState): number {
    const baseThresholds = {
      precision: 0.005,
      discovery: 0.001,  
      creative: 0.0005,
      balanced: 0.002
    };
    
    let threshold = baseThresholds[queryContext.searchMode] || 0.001;
    
    // Adapt to coordinate space density
    if (systemState.coordinateSpaceDensity > 0.8) {
      threshold *= 1.5; // Higher threshold in dense spaces
    }
    
    // Adapt to memory pressure
    if (systemState.memoryPressure > 0.9) {
      threshold *= 2; // Much higher threshold under pressure
    }
    
    return threshold;
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
  
  private calculateClusterThreshold(values: number[]): number {
    if (values.length < 2) return values[0] || 0;
    
    // Simple k-means with k=2 (signal vs noise)
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    let lowCenter = sorted[Math.floor(mid / 2)];
    let highCenter = sorted[Math.floor(mid + (sorted.length - mid) / 2)];
    
    // One iteration of k-means
    const lowCluster: number[] = [];
    const highCluster: number[] = [];
    
    for (const val of sorted) {
      if (Math.abs(val - lowCenter) < Math.abs(val - highCenter)) {
        lowCluster.push(val);
      } else {
        highCluster.push(val);
      }
    }
    
    // Threshold is between clusters
    const lowMax = Math.max(...lowCluster);
    const highMin = Math.min(...highCluster);
    return (lowMax + highMin) / 2;
  }
  
  private calculateEntropyThreshold(values: number[]): number {
    if (values.length < 2) return values[0] || 0;
    
    // Use entropy to find natural separation
    const sorted = [...values].sort((a, b) => a - b);
    let maxEntropy = 0;
    let bestThreshold = sorted[0];
    
    for (let i = 1; i < sorted.length - 1; i++) {
      const threshold = sorted[i];
      const below = values.filter(v => v <= threshold).length;
      const above = values.filter(v => v > threshold).length;
      
      const p1 = below / values.length;
      const p2 = above / values.length;
      
      if (p1 > 0 && p2 > 0) {
        const entropy = -p1 * Math.log2(p1) - p2 * Math.log2(p2);
        if (entropy > maxEntropy) {
          maxEntropy = entropy;
          bestThreshold = threshold;
        }
      }
    }
    
    return bestThreshold;
  }
  
  private calculateStdDevThreshold(values: number[]): number {
    if (values.length < 2) return values[0] || 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Threshold at mean - 1.5 * stdDev (captures ~93% if normal)
    return Math.max(0, mean - 1.5 * stdDev);
  }
}

/**
 * Simplified threshold for immediate use in tests
 */
export function calculateAdaptiveThreshold(
  candidateProbabilities: number[],
  mode: 'permissive' | 'balanced' | 'strict' = 'balanced'
): number {
  
  if (candidateProbabilities.length === 0) {
    // Edge case: Start conservatively and expand if needed
    return mode === 'permissive' ? 0.0001 : mode === 'strict' ? 0.01 : 0.001;
  }
  
  // Quick statistical threshold for immediate implementation
  const sorted = [...candidateProbabilities].sort((a, b) => a - b);
  
  if (sorted.length < 3) {
    const factor = mode === 'permissive' ? 0.1 : mode === 'strict' ? 0.5 : 0.3;
    return sorted[0] * factor; // Scale based on mode
  }
  
  // Use percentile based on mode
  const percentile = mode === 'permissive' ? 0.05 : mode === 'strict' ? 0.25 : 0.1;
  const percentileIndex = Math.floor(sorted.length * percentile);
  return sorted[percentileIndex];
}