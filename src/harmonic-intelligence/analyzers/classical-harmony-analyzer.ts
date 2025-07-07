/**
 * Classical Harmony Pattern Analyzer
 * Detects: Golden Ratio, Fibonacci Sequences, Prime Numbers, Euler Constant
 * @module harmonic-intelligence/analyzers
 */
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  PatternEvidence
} from '../interfaces/harmonic-types.js';
import { BasePatternAnalyzer } from './base-pattern-analyzer.js';
import { Logger } from '../../utils/logger.js';
export class ClassicalHarmonyAnalyzer extends BasePatternAnalyzer {
  protected readonly logger = new Logger('ClassicalHarmonyAnalyzer');
  protected readonly category = PatternCategory.CLASSICAL_HARMONY;
  // Mathematical constants
  private readonly PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618
  private readonly E = Math.E; // Euler's number ≈ 2.718
  /**
   * Analyze all classical harmony patterns
   */
  public async analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>> {
    this.logger.debug('Analyzing classical harmony patterns');
    const results = new Map<PatternType, PatternScore>();
    // Run all pattern detections
    const [golden, fibonacci, prime, euler] = await Promise.all([
      this.detectGoldenRatio(semanticData),
      this.detectFibonacciSequences(semanticData),
      this.detectPrimeNumberHarmonics(semanticData),
      this.detectEulerConstantPatterns(semanticData)
    ]);
    results.set(PatternType.GOLDEN_RATIO, golden);
    results.set(PatternType.FIBONACCI_SEQUENCES, fibonacci);
    results.set(PatternType.PRIME_NUMBER_HARMONICS, prime);
    results.set(PatternType.EULER_CONSTANT_PATTERNS, euler);
    return results;
  }
  /**
   * Detect golden ratio patterns in code structure
   */
  private async detectGoldenRatio(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let detectionCount = 0;
    // Analyze file structure ratios
    const fileRatios = this.analyzeFileStructureRatios(semanticData);
    if (fileRatios.score > 0) {
      totalScore += fileRatios.score;
      detectionCount++;
      evidence.push(fileRatios.evidence);
    }
    // Analyze function length ratios
    const functionRatios = this.analyzeFunctionLengthRatios(semanticData);
    if (functionRatios.score > 0) {
      totalScore += functionRatios.score;
      detectionCount++;
      evidence.push(functionRatios.evidence);
    }
    // Analyze dependency tree proportions
    const dependencyRatios = this.analyzeDependencyRatios(semanticData);
    if (dependencyRatios.score > 0) {
      totalScore += dependencyRatios.score;
      detectionCount++;
      evidence.push(dependencyRatios.evidence);
    }
    // Analyze nesting depth ratios
    const nestingRatios = this.analyzeNestingDepthRatios(semanticData);
    if (nestingRatios.score > 0) {
      totalScore += nestingRatios.score;
      detectionCount++;
      evidence.push(nestingRatios.evidence);
    }
    const score = detectionCount > 0 ? totalScore / detectionCount : 0;
    const confidence = Math.min(1.0, detectionCount / 4); // More evidence = higher confidence
    return {
      patternName: 'Golden Ratio Patterns',
      category: this.category,
      score,
      confidence,
      detected: score > 0.6,
      evidence
    };
  }
  /**
   * Detect Fibonacci sequences in code patterns
   */
  private async detectFibonacciSequences(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let detectionCount = 0;
    // Check for Fibonacci-like growth in various metrics
    const symbols = Array.from(semanticData.symbols.values());
    // Analyze parameter counts
    const paramCounts = this.extractParameterCounts(symbols);
    if (this.isFibonacciLike(paramCounts)) {
      totalScore += 0.9;
      detectionCount++;
      evidence.push({
        type: 'parameter_progression',
        value: paramCounts,
        weight: 0.9,
        description: 'Function parameters follow Fibonacci-like progression'
      });
    }
    // Analyze method counts per class
    const methodCounts = this.extractMethodCounts(symbols);
    if (this.isFibonacciLike(methodCounts)) {
      totalScore += 0.8;
      detectionCount++;
      evidence.push({
        type: 'method_count_progression',
        value: methodCounts,
        weight: 0.8,
        description: 'Methods per class follow Fibonacci pattern'
      });
    }
    // Analyze branching factors
    const branchingFactors = this.extractBranchingFactors(semanticData);
    if (this.isFibonacciLike(branchingFactors)) {
      totalScore += 0.85;
      detectionCount++;
      evidence.push({
        type: 'branching_progression',
        value: branchingFactors,
        weight: 0.85,
        description: 'Code branching follows natural growth pattern'
      });
    }
    const score = detectionCount > 0 ? totalScore / detectionCount : 0;
    const confidence = Math.min(1.0, detectionCount / 3);
    return {
      patternName: 'Fibonacci Sequences',
      category: this.category,
      score,
      confidence,
      detected: score > 0.7,
      evidence
    };
  }
  /**
   * Detect prime number harmonics in code structure
   */
  private async detectPrimeNumberHarmonics(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let detectionCount = 0;
    // Analyze if key metrics align with prime numbers
    const symbols = Array.from(semanticData.symbols.values());
    // Check if module counts are prime
    const moduleCount = new Set(symbols.map(s => s.filePath)).size;
    if (this.isPrime(moduleCount) && moduleCount > 2) {
      totalScore += 0.7;
      detectionCount++;
      evidence.push({
        type: 'prime_module_count',
        value: moduleCount,
        weight: 0.7,
        description: `Module count (${moduleCount}) is prime - indicating atomic modularity`
      });
    }
    // Check function counts in prime ranges
    const functionCounts = this.getFunctionCountsByFile(symbols);
    const primeCounts = functionCounts.filter(c => this.isPrime(c)).length;
    const primeRatio = primeCounts / functionCounts.length;
    if (primeRatio > 0.3) {
      totalScore += primeRatio;
      detectionCount++;
      evidence.push({
        type: 'prime_function_distribution',
        value: primeRatio,
        weight: primeRatio,
        description: `${(primeRatio * 100).toFixed(1)}% of files have prime function counts`
      });
    }
    // Analyze hash distribution (simplified)
    const hashModuloPrimes = this.analyzeHashDistribution(symbols);
    if (hashModuloPrimes > 0.6) {
      totalScore += hashModuloPrimes;
      detectionCount++;
      evidence.push({
        type: 'hash_prime_distribution',
        value: hashModuloPrimes,
        weight: hashModuloPrimes,
        description: 'Symbol hashes show prime number distribution patterns'
      });
    }
    const score = detectionCount > 0 ? totalScore / detectionCount : 0;
    const confidence = Math.min(1.0, detectionCount / 3);
    return {
      patternName: 'Prime Number Harmonics',
      category: this.category,
      score,
      confidence,
      detected: score > 0.5,
      evidence
    };
  }
  /**
   * Detect Euler constant patterns in growth/decay
   */
  private async detectEulerConstantPatterns(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let detectionCount = 0;
    // Analyze exponential growth/decay patterns
    const symbols = Array.from(semanticData.symbols.values());
    // Check complexity growth
    const complexityGrowth = this.analyzeComplexityGrowth(symbols);
    if (Math.abs(complexityGrowth.rate - this.E) < 0.5) {
      const accuracy = 1 - Math.abs(complexityGrowth.rate - this.E) / this.E;
      totalScore += accuracy;
      detectionCount++;
      evidence.push({
        type: 'complexity_growth_rate',
        value: complexityGrowth.rate,
        weight: accuracy,
        description: `Complexity grows at rate ${complexityGrowth.rate.toFixed(3)} (e ≈ ${this.E.toFixed(3)})`
      });
    }
    // Check natural logarithmic relationships
    const logRelationships = this.findLogarithmicRelationships(semanticData);
    if (logRelationships.score > 0.6) {
      totalScore += logRelationships.score;
      detectionCount++;
      evidence.push(logRelationships.evidence);
    }
    // Check exponential decay in dependencies
    const dependencyDecay = this.analyzeDependencyDecay(semanticData);
    if (dependencyDecay.score > 0.5) {
      totalScore += dependencyDecay.score;
      detectionCount++;
      evidence.push(dependencyDecay.evidence);
    }
    const score = detectionCount > 0 ? totalScore / detectionCount : 0;
    const confidence = Math.min(1.0, detectionCount / 3);
    return {
      patternName: 'Euler Constant Patterns',
      category: this.category,
      score,
      confidence,
      detected: score > 0.6,
      evidence
    };
  }
  // Helper methods
  private analyzeFileStructureRatios(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    const files = semanticData.structure.files;
    const packages = semanticData.structure.packages;
    if (packages.length === 0) {
      return { score: 0, evidence: { type: 'empty', value: 0, weight: 0, description: 'No data available' } };
    }
    const ratio = files.length / packages.length;
    const goldenError = Math.abs(ratio - this.PHI) / this.PHI;
    const score = Math.max(0, 1 - goldenError);
    return {
      score,
      evidence: {
        type: 'file_package_ratio',
        value: ratio,
        weight: score,
        description: `File to package ratio (${ratio.toFixed(3)}) approximates φ`
      }
    };
  }
  private analyzeFunctionLengthRatios(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    const symbols = Array.from(semanticData.symbols.values());
    const functions = symbols.filter(s => s.kind === 'function' || s.kind === 'method');
    if (functions.length < 2) {
      return { score: 0, evidence: { type: 'empty', value: 0, weight: 0, description: 'No data available' } };
    }
    // Sort by line count and check adjacent ratios
    functions.sort((a, b) => (a.endLine - a.line) - (b.endLine - b.line));
    let goldenRatioCount = 0;
    for (let i = 1; i < functions.length; i++) {
      const ratio = (functions[i].endLine - functions[i].line) / 
                   (functions[i-1].endLine - functions[i-1].line);
      if (Math.abs(ratio - this.PHI) < 0.2) {
        goldenRatioCount++;
      }
    }
    const score = goldenRatioCount / (functions.length - 1);
    return {
      score,
      evidence: {
        type: 'function_length_progression',
        value: goldenRatioCount,
        weight: score,
        description: `${goldenRatioCount} function pairs show golden ratio length relationship`
      }
    };
  }
  private analyzeDependencyRatios(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    const relationships = semanticData.relationships;
    // Count incoming vs outgoing dependencies
    const incomingCounts = new Map<string, number>();
    const outgoingCounts = new Map<string, number>();
    for (const [from, tos] of relationships) {
      outgoingCounts.set(from, (outgoingCounts.get(from) || 0) + tos.length);
      for (const to of tos) {
        incomingCounts.set(to, (incomingCounts.get(to) || 0) + 1);
      }
    }
    // Check ratios
    let goldenRatioCount = 0;
    let totalChecked = 0;
    for (const symbol of incomingCounts.keys()) {
      const incoming = incomingCounts.get(symbol) || 0;
      const outgoing = outgoingCounts.get(symbol) || 0;
      if (incoming > 0 && outgoing > 0) {
        const ratio = Math.max(incoming, outgoing) / Math.min(incoming, outgoing);
        if (Math.abs(ratio - this.PHI) < 0.3) {
          goldenRatioCount++;
        }
        totalChecked++;
      }
    }
    const score = totalChecked > 0 ? goldenRatioCount / totalChecked : 0;
    return {
      score,
      evidence: {
        type: 'dependency_balance',
        value: goldenRatioCount,
        weight: score,
        description: `${goldenRatioCount} symbols show golden ratio in/out dependency balance`
      }
    };
  }
  private analyzeNestingDepthRatios(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    // Simplified - would need proper AST analysis for real nesting depth
    const symbols = Array.from(semanticData.symbols.values());
    // Use indentation as proxy for nesting (very simplified)
    const nestingLevels = symbols
      .filter(s => s.kind === 'function' || s.kind === 'method')
      .map(s => s.depth || 0);
    if (nestingLevels.length < 2) {
      return { score: 0, evidence: { type: 'empty', value: 0, weight: 0, description: 'No data available' } };
    }
    // Check for golden ratio in nesting progression
    nestingLevels.sort((a, b) => a - b);
    let goldenCount = 0;
    for (let i = 1; i < nestingLevels.length; i++) {
      if (nestingLevels[i-1] > 0) {
        const ratio = nestingLevels[i] / nestingLevels[i-1];
        if (Math.abs(ratio - this.PHI) < 0.4) {
          goldenCount++;
        }
      }
    }
    const score = goldenCount / (nestingLevels.length - 1);
    return {
      score,
      evidence: {
        type: 'nesting_depth_progression',
        value: goldenCount,
        weight: score,
        description: 'Nesting depths show golden ratio progression'
      }
    };
  }
  private isFibonacciLike(sequence: number[]): boolean {
    if (sequence.length < 3) return false;
    // Check if ratios converge to golden ratio
    const ratios: number[] = [];
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i-1] > 0) {
        ratios.push(sequence[i] / sequence[i-1]);
      }
    }
    if (ratios.length === 0) return false;
    // Check convergence to PHI
    const lastRatios = ratios.slice(-3);
    const avgRatio = lastRatios.reduce((a, b) => a + b, 0) / lastRatios.length;
    return Math.abs(avgRatio - this.PHI) < 0.2;
  }
  private isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }
  private extractParameterCounts(symbols: any[]): number[] {
    return symbols
      .filter(s => s.kind === 'function' || s.kind === 'method')
      .map(s => s.parameters?.length || 0)
      .filter(c => c > 0)
      .sort((a, b) => a - b);
  }
  private extractMethodCounts(symbols: any[]): number[] {
    const classMethods = new Map<string, number>();
    symbols
      .filter(s => s.kind === 'method')
      .forEach(s => {
        const className = s.containerName || 'unknown';
        classMethods.set(className, (classMethods.get(className) || 0) + 1);
      });
    return Array.from(classMethods.values()).sort((a, b) => a - b);
  }
  private extractBranchingFactors(semanticData: SemanticData): number[] {
    const branchingFactors: number[] = [];
    for (const [from, tos] of semanticData.relationships) {
      if (tos.length > 0) {
        branchingFactors.push(tos.length);
      }
    }
    return branchingFactors.sort((a, b) => a - b);
  }
  private getFunctionCountsByFile(symbols: any[]): number[] {
    const fileFunctions = new Map<string, number>();
    symbols
      .filter(s => s.kind === 'function' || s.kind === 'method')
      .forEach(s => {
        const file = s.filePath || 'unknown';
        fileFunctions.set(file, (fileFunctions.get(file) || 0) + 1);
      });
    return Array.from(fileFunctions.values());
  }
  private analyzeHashDistribution(symbols: any[]): number {
    // Simplified hash distribution analysis
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
    let goodDistribution = 0;
    for (const prime of primes) {
      const buckets = new Array(prime).fill(0);
      symbols.forEach(s => {
        const hash = this.simpleHash(s.name) % prime;
        buckets[hash]++;
      });
      // Check if distribution is relatively uniform
      const avg = symbols.length / prime;
      const variance = buckets.reduce((sum, count) => 
        sum + Math.pow(count - avg, 2), 0) / prime;
      if (variance < avg) {
        goodDistribution++;
      }
    }
    return goodDistribution / primes.length;
  }
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  private analyzeComplexityGrowth(symbols: any[]): { rate: number } {
    // Group by file and calculate average complexity
    const fileComplexity = new Map<string, number[]>();
    symbols.forEach(s => {
      const file = s.filePath || 'unknown';
      const complexity = s.complexity || 1;
      if (!fileComplexity.has(file)) {
        fileComplexity.set(file, []);
      }
      fileComplexity.get(file)!.push(complexity);
    });
    // Calculate growth rate (simplified)
    const avgComplexities = Array.from(fileComplexity.values())
      .map(comps => comps.reduce((a, b) => a + b, 0) / comps.length)
      .sort((a, b) => a - b);
    if (avgComplexities.length < 2) {
      return { rate: 1 };
    }
    // Simple exponential fit
    const first = avgComplexities[0];
    const last = avgComplexities[avgComplexities.length - 1];
    const steps = avgComplexities.length - 1;
    const rate = Math.pow(last / first, 1 / steps);
    return { rate };
  }
  private findLogarithmicRelationships(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    // Look for logarithmic patterns in code metrics
    const symbols = Array.from(semanticData.symbols.values());
    // Check if file sizes follow logarithmic distribution
    const fileSizes = new Map<string, number>();
    symbols.forEach(s => {
      const file = s.filePath || 'unknown';
      fileSizes.set(file, (fileSizes.get(file) || 0) + 1);
    });
    const sizes = Array.from(fileSizes.values()).sort((a, b) => a - b);
    // Check if log of sizes is linear
    const logSizes = sizes.map(s => Math.log(s));
    const linearityScore = this.checkLinearity(logSizes);
    return {
      score: linearityScore,
      evidence: {
        type: 'logarithmic_size_distribution',
        value: linearityScore,
        weight: linearityScore,
        description: 'File sizes follow logarithmic distribution'
      }
    };
  }
  private analyzeDependencyDecay(semanticData: SemanticData): { score: number; evidence: PatternEvidence } {
    // Analyze how dependencies decay with distance
    const relationships = semanticData.relationships;
    // Build distance matrix (simplified - using 1 for direct, 2 for indirect)
    const distances: number[] = [];
    for (const [from, directDeps] of relationships) {
      distances.push(directDeps.length); // Direct dependencies
      // Indirect dependencies (2nd degree)
      let indirectCount = 0;
      for (const dep of directDeps) {
        const secondDegree = relationships.get(dep) || [];
        indirectCount += secondDegree.length;
      }
      if (directDeps.length > 0 && indirectCount > 0) {
        const decayRate = directDeps.length / indirectCount;
        distances.push(decayRate);
      }
    }
    if (distances.length === 0) {
      return { score: 0, evidence: { type: 'empty', value: 0, weight: 0, description: 'No data available' } };
    }
    // Check if decay approximates e^(-x)
    const avgDecay = distances.reduce((a, b) => a + b, 0) / distances.length;
    const expectedDecay = Math.exp(-1); // e^(-1) ≈ 0.368
    const score = Math.max(0, 1 - Math.abs(avgDecay - expectedDecay));
    return {
      score,
      evidence: {
        type: 'dependency_decay_rate',
        value: avgDecay,
        weight: score,
        description: `Dependency decay rate (${avgDecay.toFixed(3)}) approximates e^(-1)`
      }
    };
  }
  private checkLinearity(values: number[]): number {
    if (values.length < 3) return 0;
    // Simple linearity check using correlation
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = values[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return 0;
    const correlation = num / Math.sqrt(denX * denY);
    return Math.abs(correlation);
  }
}