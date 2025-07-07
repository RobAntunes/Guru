/**
 * Fractal Pattern Analyzer
 * Detects self-similarity, recursive patterns, and fractal dimensions in code structure
 * @module harmonic-intelligence/analyzers
 */
import { BasePatternAnalyzer } from './base-pattern-analyzer.js';
import {
  PatternType,
  PatternScore,
  SemanticData,
  PatternCategory,
  PatternEvidence,
  HarmonicSymbol
} from '../interfaces/harmonic-types';
import { Logger } from '../../utils/logger.js';
interface FractalMetrics {
  mandelbrotComplexity: number;
  juliaSetConnectivity: number;
  lSystemGrowth: LSystemPattern[];
  hausdorffDimension: number;
  selfSimilarity: SelfSimilarityScore;
}
interface SelfSimilarityScore {
  scale: number;
  iterations: number;
  confidence: number;
  patterns: string[];
}
interface LSystemPattern {
  axiom: string;
  rules: Map<string, string>;
  iterations: number;
  branchingFactor: number;
}
interface RecursivePattern {
  depth: number;
  branchingFactor: number;
  selfReferenceCount: number;
  pattern: string;
}
export class FractalPatternAnalyzer extends BasePatternAnalyzer {
  protected readonly logger = new Logger('FractalPatternAnalyzer');
  protected readonly category = PatternCategory.FRACTAL_PATTERNS;
  private readonly MAX_RECURSION_DEPTH = 10;
  private readonly JULIA_PARAMETER_C = { real: -0.7, imag: 0.27015 }; // Classic Julia set parameter
  async analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>> {
    const results = new Map<PatternType, PatternScore>();
    // Run all fractal analyses
    const [mandelbrot, julia, lSystem, hausdorff] = await Promise.all([
      this.detectMandelbrotComplexity(semanticData),
      this.detectJuliaSetPatterns(semanticData),
      this.detectLSystemGrowth(semanticData),
      this.detectHausdorffDimension(semanticData)
    ]);
    results.set(PatternType.MANDELBROT_COMPLEXITY, mandelbrot);
    results.set(PatternType.JULIA_SET_PATTERNS, julia);
    results.set(PatternType.L_SYSTEM_GROWTH, lSystem);
    results.set(PatternType.HAUSDORFF_DIMENSION, hausdorff);
    return results;
  }
  private async detectMandelbrotComplexity(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Analyze complexity boundaries
    const complexityBoundaries = this.findComplexityBoundaries(semanticData);
    for (const boundary of complexityBoundaries) {
      if (boundary.isFractal) {
        evidence.push({
          type: 'complexity_boundary',
          description: `Fractal complexity boundary detected: ${boundary.description}`,
          weight: 0.3,
          value: boundary.dimension
        });
        totalScore += 0.3 * boundary.confidence;
      }
      weightSum += 0.3;
    }
    // 2. Calculate fractal dimension of code structure
    const fractalDimension = this.calculateCodeFractalDimension(semanticData);
    if (fractalDimension > 1.0 && fractalDimension < 2.0) {
      evidence.push({
        type: 'fractal_dimension',
        description: `Code exhibits fractal dimension: ${fractalDimension.toFixed(3)}`,
        weight: 0.35,
        value: fractalDimension
      });
      totalScore += 0.35 * ((fractalDimension - 1.0) / 1.0); // Normalize to 0-1
    }
    weightSum += 0.35;
    // 3. Detect self-similarity at different scales
    const selfSimilarity = this.detectSelfSimilarity(semanticData);
    if (selfSimilarity.confidence > 0.5) {
      evidence.push({
        type: 'self_similarity',
        description: `Self-similar patterns detected across ${selfSimilarity.iterations} scales`,
        weight: 0.35,
        value: selfSimilarity.confidence
      });
      totalScore += 0.35 * selfSimilarity.confidence;
    }
    weightSum += 0.35;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.MANDELBROT_COMPLEXITY,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  private async detectJuliaSetPatterns(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Parameter sensitivity analysis
    const parameterSensitivity = this.analyzeParameterSensitivity(semanticData);
    if (parameterSensitivity.chaotic) {
      evidence.push({
        type: 'parameter_sensitivity',
        description: `Chaotic parameter sensitivity detected: small changes lead to ${parameterSensitivity.divergence}x divergence`,
        weight: 0.3,
        value: parameterSensitivity.score
      });
      totalScore += 0.3 * parameterSensitivity.score;
    }
    weightSum += 0.3;
    // 2. Connectivity measurement
    const connectivity = this.measureConnectivity(semanticData);
    if (connectivity.isConnected && connectivity.juliaLike) {
      evidence.push({
        type: 'julia_connectivity',
        description: `Julia set-like connectivity pattern: ${connectivity.description}`,
        weight: 0.35,
        value: connectivity.score
      });
      totalScore += 0.35 * connectivity.score;
    }
    weightSum += 0.35;
    // 3. Dynamic system detection
    const dynamicSystems = this.detectDynamicSystems(semanticData);
    let dynamicScore = 0;
    let dynamicCount = 0;
    for (const system of dynamicSystems) {
      if (system.exhibitsJuliaBehavior) {
        evidence.push({
          type: 'dynamic_system',
          description: `Dynamic system with Julia-like behavior: ${system.name}`,
          weight: 0.35,
          value: system.score
        });
        dynamicScore += system.score;
        dynamicCount++;
      }
    }
    if (dynamicCount > 0) {
      totalScore += 0.35 * (dynamicScore / dynamicCount);
      weightSum += 0.35;
    }
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.JULIA_SET_PATTERNS,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  private async detectLSystemGrowth(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    
    // 1. Detect ALL recursive growth patterns - raw data
    const growthPatterns = this.findRecursiveGrowthPatterns(semanticData);
    for (const pattern of growthPatterns) {
      if (pattern.isLSystemLike) {
        evidence.push({
          type: 'recursive_growth',
          description: `L-system growth pattern: ${pattern.description}`,
          weight: 0.35,
          value: pattern.score
        });
      }
    }
    
    // 2. Analyze branching factors - raw data
    const branchingAnalysis = this.analyzeBranchingFactors(semanticData);
    if (branchingAnalysis.biological) {
      evidence.push({
        type: 'branching_factor',
        description: `Biological branching pattern: average factor ${branchingAnalysis.averageFactor.toFixed(2)}`,
        weight: 0.3,
        value: branchingAnalysis.score
      });
    }
    
    // 3. ALL biological pattern matches - raw data
    const biologicalPatterns = this.matchBiologicalPatterns(semanticData);
    for (const pattern of biologicalPatterns) {
      evidence.push({
        type: 'biological_pattern',
        description: `Matches ${pattern.type} growth: ${pattern.similarity}% similar`,
        weight: 0.35,
        value: pattern.similarity / 100
      });
    }
    
    // Report raw pattern data
    const detected = evidence.length > 0;
    
    // For raw data, use the count of evidence as a simple metric
    // The AI will interpret the evidence details
    const rawScore = detected ? Math.min(evidence.length / 10, 1.0) : 0.0;
    
    return {
      patternName: PatternType.L_SYSTEM_GROWTH,
      category: this.category,
      score: rawScore,
      confidence: detected ? Math.min(evidence.length / 50, 1.0) : 0,
      detected,
      evidence, // All raw evidence for AI interpretation
    };
  }
  private async detectHausdorffDimension(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Box-counting algorithm
    const boxDimension = this.calculateBoxCountingDimensionForSemanticData(semanticData);
    if (boxDimension.isValid) {
      evidence.push({
        type: 'box_counting',
        description: `Hausdorff dimension via box-counting: ${boxDimension.dimension.toFixed(3)}`,
        weight: 0.4,
        value: boxDimension.dimension
      });
      // Score based on how far from integer dimension (more fractal)
      const fractionalPart = boxDimension.dimension % 1;
      totalScore += 0.4 * (fractionalPart > 0.5 ? 1 - fractionalPart : fractionalPart) * 2;
    }
    weightSum += 0.4;
    // 2. Dimension calculation for code structures
    const structureDimensions = this.calculateStructureDimensions(semanticData);
    for (const structure of structureDimensions) {
      if (structure.isFractal) {
        evidence.push({
          type: 'structure_dimension',
          description: `${structure.name} has fractal dimension: ${structure.dimension.toFixed(3)}`,
          weight: 0.3,
          value: structure.dimension
        });
        totalScore += 0.3 * structure.confidence;
      }
    }
    if (structureDimensions.length > 0) weightSum += 0.3;
    // 3. Fractal complexity scoring
    const complexityScore = this.scoreFractalComplexity(semanticData);
    if (complexityScore.score > 0.5) {
      evidence.push({
        type: 'fractal_complexity',
        description: `High fractal complexity: ${complexityScore.description}`,
        weight: 0.3,
        value: complexityScore.score
      });
      totalScore += 0.3 * complexityScore.score;
    }
    weightSum += 0.3;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.HAUSDORFF_DIMENSION,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  // Helper methods for Mandelbrot Complexity
  private findComplexityBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    // Analyze structural boundaries at multiple scales
    const structuralBoundaries = this.analyzeStructuralBoundaries(semanticData);
    for (const boundary of structuralBoundaries) {
      // Analyze the fractal nature of the boundary
      const fractalAnalysis = this.analyzeBoundaryFractality(boundary, semanticData);
      if (fractalAnalysis.isFractal) {
        boundaries.push({
          isFractal: true,
          dimension: fractalAnalysis.dimension,
          confidence: fractalAnalysis.confidence,
          description: fractalAnalysis.description,
          boxCountingDimension: fractalAnalysis.boxCountingDimension,
          informationDimension: fractalAnalysis.informationDimension
        });
      }
    }
    // Also analyze inter-module boundaries
    const interModuleBoundaries = this.analyzeInterModuleBoundaries(semanticData);
    boundaries.push(...interModuleBoundaries.filter(b => b.isFractal));
    return boundaries;
  }
  private analyzeStructuralBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    // 1. File/directory boundaries
    const fileBoundaries = this.analyzeFileBoundaries(semanticData);
    boundaries.push(...fileBoundaries);
    // 2. Class/interface boundaries
    const classBoundaries = this.analyzeClassBoundaries(semanticData);
    boundaries.push(...classBoundaries);
    // 3. Function call boundaries
    const callBoundaries = this.analyzeCallBoundaries(semanticData);
    boundaries.push(...callBoundaries);
    return boundaries;
  }
  private analyzeFileBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    const fileGraph = new Map<string, Set<string>>();
    // Build file dependency graph
    for (const [fromId, targets] of semanticData.relationships) {
      const fromSymbol = semanticData.symbols.get(fromId);
      if (!fromSymbol) continue;
      for (const toId of targets) {
        const toSymbol = semanticData.symbols.get(toId);
        if (!toSymbol || toSymbol.filePath === fromSymbol.filePath) continue;
        if (!fileGraph.has(fromSymbol.filePath)) {
          fileGraph.set(fromSymbol.filePath, new Set());
        }
        fileGraph.get(fromSymbol.filePath)!.add(toSymbol.filePath);
      }
    }
    // Analyze boundary complexity
    for (const [file, dependencies] of fileGraph) {
      if (dependencies.size > 2) {
        boundaries.push({
          type: 'file',
          complexity: dependencies.size,
          connections: Array.from(dependencies)
        });
      }
    }
    return boundaries;
  }
  private analyzeClassBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    const classes = Array.from(semanticData.symbols.values()).filter(s => s.kind === 'class');
    for (const cls of classes) {
      // Analyze the boundary between class internals and externals
      const internalSymbols = Array.from(semanticData.symbols.values())
        .filter(s => s.containerName === cls.name);
      const externalConnections = new Set<string>();
      for (const internal of internalSymbols) {
        const relations = semanticData.relationships.get(internal.id) || [];
        for (const rel of relations) {
          const target = semanticData.symbols.get(rel);
          if (target && target.containerName !== cls.name) {
            externalConnections.add(rel);
          }
        }
      }
      if (externalConnections.size > 0) {
        boundaries.push({
          type: 'class',
          internalComplexity: internalSymbols.length,
          externalComplexity: externalConnections.size,
          ratio: externalConnections.size / Math.max(internalSymbols.length, 1)
        });
      }
    }
    return boundaries;
  }
  private analyzeCallBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    // Analyze function call patterns
    const functions = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'function' || s.kind === 'method');
    for (const func of functions) {
      const callees = semanticData.relationships.get(func.id) || [];
      if (callees.length > 3) {
        // Analyze the distribution of calls
        const callDepths = callees.map(calleeId => {
          const callee = semanticData.symbols.get(calleeId);
          return callee ? this.calculateCallDepth(callee, semanticData) : 0;
        });
        boundaries.push({
          type: 'call',
          callCount: callees.length,
          depthDistribution: callDepths
        });
      }
    }
    return boundaries;
  }
  private analyzeBoundaryFractality(boundary: any, semanticData: SemanticData): any {
    // Perform multi-scale analysis to detect fractal properties
    const scales = [1, 2, 4, 8, 16];
    const measurements = [];
    for (const scale of scales) {
      const measurement = this.measureBoundaryAtScale(boundary, scale, semanticData);
      measurements.push({ scale, measurement });
    }
    // Calculate fractal dimensions
    const boxCounting = this.calculateBoxCountingDimension(measurements);
    const information = this.calculateInformationDimension(boundary, semanticData);
    // Determine if boundary is fractal
    const isFractal = (boxCounting > 1.2 && boxCounting < 1.8) || 
                     (Math.abs(boxCounting - information) < 0.3);
    return {
      isFractal,
      dimension: (boxCounting + information) / 2,
      boxCountingDimension: boxCounting,
      informationDimension: information,
      confidence: isFractal ? 0.8 : 0.3,
      description: `Fractal boundary with dimension ${((boxCounting + information) / 2).toFixed(3)}`
    };
  }
  private measureBoundaryAtScale(boundary: any, scale: number, semanticData: SemanticData): number {
    // Measure boundary complexity at a given scale
    if (boundary.type === 'file') {
      // Count connections within scale distance
      let count = 0;
      const visited = new Set<string>();
      const queue = [boundary.location];
      let depth = 0;
      while (queue.length > 0 && depth < scale) {
        const levelSize = queue.length;
        for (let i = 0; i < levelSize; i++) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          visited.add(current);
          count++;
          // Add connections
          if (boundary.connections) {
            queue.push(...boundary.connections.filter((c: string) => !visited.has(c)));
          }
        }
        depth++;
      }
      return count;
    } else if (boundary.type === 'class') {
      // Measure at different granularities
      return boundary.internalComplexity * Math.pow(boundary.ratio, 1/scale);
    } else if (boundary.type === 'call') {
      // Measure call pattern complexity
      const depths = boundary.depthDistribution || [];
      const scaledDepths = depths.filter((d: number) => d <= scale);
      return scaledDepths.length;
    }
    return 1;
  }
  private calculateBoxCountingDimension(measurements: Array<{scale: number, measurement: number}>): number {
    if (measurements.length < 2) return 1;
    // Linear regression on log-log plot
    const logScales = measurements.map(m => Math.log(m.scale));
    const logMeasurements = measurements.map(m => Math.log(Math.max(m.measurement, 1)));
    // Calculate slope (fractal dimension)
    const n = measurements.length;
    const sumX = logScales.reduce((a, b) => a + b, 0);
    const sumY = logMeasurements.reduce((a, b) => a + b, 0);
    const sumXY = logScales.reduce((sum, x, i) => sum + x * logMeasurements[i], 0);
    const sumX2 = logScales.reduce((sum, x) => sum + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.abs(slope);
  }
  private calculateInformationDimension(boundary: any, semanticData: SemanticData): number {
    // Calculate information dimension based on probability distribution
    const probabilities = this.calculateBoundaryProbabilities(boundary, semanticData);
    if (probabilities.length === 0) return 1;
    // Calculate Shannon entropy
    const entropy = probabilities.reduce((sum, p) => {
      return p > 0 ? sum - p * Math.log(p) : sum;
    }, 0);
    // Information dimension approximation
    return entropy / Math.log(probabilities.length);
  }
  private calculateBoundaryProbabilities(boundary: any, semanticData: SemanticData): number[] {
    // Calculate probability distribution across boundary
    if (boundary.type === 'file' && boundary.connections) {
      const total = boundary.connections.length;
      const connectionCounts = new Map<string, number>();
      for (const conn of boundary.connections) {
        const count = (semanticData.relationships.get(conn) || []).length;
        connectionCounts.set(conn, count);
      }
      const totalCount = Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0);
      return Array.from(connectionCounts.values()).map(c => c / totalCount);
    }
    return [];
  }
  private analyzeInterModuleBoundaries(semanticData: SemanticData): any[] {
    const boundaries = [];
    const modules = semanticData.structure.modules;
    for (let i = 0; i < modules.length; i++) {
      for (let j = i + 1; j < modules.length; j++) {
        const boundary = this.analyzeModuleBoundary(modules[i], modules[j], semanticData);
        if (boundary.connectionCount > 0) {
          boundaries.push(boundary);
        }
      }
    }
    return boundaries;
  }
  private analyzeModuleBoundary(module1: string, module2: string, semanticData: SemanticData): any {
    // Analyze the boundary between two modules
    const connections = new Map<string, string[]>();
    let connectionCount = 0;
    for (const [fromId, targets] of semanticData.relationships) {
      const fromSymbol = semanticData.symbols.get(fromId);
      if (!fromSymbol) continue;
      const fromModule = this.getSymbolModule(fromSymbol, semanticData);
      if (fromModule !== module1 && fromModule !== module2) continue;
      for (const toId of targets) {
        const toSymbol = semanticData.symbols.get(toId);
        if (!toSymbol) continue;
        const toModule = this.getSymbolModule(toSymbol, semanticData);
        if ((fromModule === module1 && toModule === module2) ||
            (fromModule === module2 && toModule === module1)) {
          if (!connections.has(fromId)) {
            connections.set(fromId, []);
          }
          connections.get(fromId)!.push(toId);
          connectionCount++;
        }
      }
    }
    // Analyze fractal properties of the boundary
    const fractalAnalysis = this.analyzeBoundaryConnections(connections, semanticData);
    return {
      type: 'inter-module',
      connectionCount,
      isFractal: fractalAnalysis.isFractal,
      dimension: fractalAnalysis.dimension,
      confidence: fractalAnalysis.confidence
    };
  }
  private analyzeBoundaryConnections(connections: Map<string, string[]>, semanticData: SemanticData): any {
    // Analyze if connections form fractal patterns
    const connectionSizes = Array.from(connections.values()).map(c => c.length);
    const distribution = this.analyzeDistribution(connectionSizes);
    // Check for power-law distribution (characteristic of fractals)
    const isPowerLaw = this.isPowerLawDistribution(distribution);
    const dimension = isPowerLaw ? this.estimatePowerLawExponent(distribution) : 1;
    return {
      isFractal: isPowerLaw,
      dimension: dimension,
      confidence: isPowerLaw ? 0.85 : 0.3
    };
  }
  private analyzeDistribution(values: number[]): Map<number, number> {
    const distribution = new Map<number, number>();
    for (const value of values) {
      distribution.set(value, (distribution.get(value) || 0) + 1);
    }
    return distribution;
  }
  private isPowerLawDistribution(distribution: Map<number, number>): boolean {
    if (distribution.size < 3) return false;
    // Convert to arrays for analysis
    const sizes = Array.from(distribution.keys()).filter(k => k > 0);
    const frequencies = sizes.map(s => distribution.get(s) || 0);
    // Check log-log linearity
    const logSizes = sizes.map(s => Math.log(s));
    const logFreqs = frequencies.map(f => Math.log(Math.max(f, 1)));
    // Calculate correlation
    const correlation = this.calculateCorrelation(logSizes, logFreqs);
    return Math.abs(correlation) > 0.8;
  }
  private estimatePowerLawExponent(distribution: Map<number, number>): number {
    const sizes = Array.from(distribution.keys()).filter(k => k > 0);
    const frequencies = sizes.map(s => distribution.get(s) || 0);
    if (sizes.length < 2) return 1;
    // Maximum likelihood estimation
    const xmin = Math.min(...sizes);
    const sum = sizes.reduce((acc, x, i) => {
      return acc + frequencies[i] * Math.log(x / xmin);
    }, 0);
    const n = frequencies.reduce((a, b) => a + b, 0);
    const alpha = 1 + n / sum;
    return Math.min(Math.max(alpha, 1), 3);
  }
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
  }
  private getSymbolModule(symbol: HarmonicSymbol, semanticData: SemanticData): string | null {
    for (const module of semanticData.structure.modules) {
      if (symbol.filePath.includes(`/${module}/`) || symbol.filePath.includes(`${module}/`)) {
        return module;
      }
    }
    return null;
  }
  private calculateCallDepth(symbol: HarmonicSymbol, semanticData: SemanticData): number {
    // Calculate the depth of call chains from this symbol
    const visited = new Set<string>();
    const getDepth = (id: string, currentDepth: number): number => {
      if (visited.has(id) || currentDepth > 10) return currentDepth;
      visited.add(id);
      const relations = semanticData.relationships.get(id) || [];
      let maxDepth = currentDepth;
      for (const rel of relations) {
        const depth = getDepth(rel, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
      return maxDepth;
    };
    return getDepth(symbol.id, 0);
  }
  private calculateCodeFractalDimension(semanticData: SemanticData): number {
    // Simplified fractal dimension calculation based on code structure
    const symbols = Array.from(semanticData.symbols.values());
    if (symbols.length === 0) return 1.0;
    // Group symbols by depth/scale
    const depthGroups = new Map<number, number>();
    symbols.forEach(symbol => {
      const depth = this.calculateSymbolDepth(symbol, semanticData);
      depthGroups.set(depth, (depthGroups.get(depth) || 0) + 1);
    });
    // Calculate dimension using scaling relationship
    const depths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
    if (depths.length < 2) return 1.0;
    let totalDimension = 0;
    let count = 0;
    for (let i = 0; i < depths.length - 1; i++) {
      const scale1 = depths[i] + 1;
      const scale2 = depths[i + 1] + 1;
      const count1 = depthGroups.get(depths[i]) || 1;
      const count2 = depthGroups.get(depths[i + 1]) || 1;
      if (scale2 > scale1 && count1 > 0 && count2 > 0) {
        // D = log(N2/N1) / log(scale2/scale1)
        const dimension = Math.log(count2 / count1) / Math.log(scale2 / scale1);
        if (dimension > 0 && dimension < 3) {
          totalDimension += dimension;
          count++;
        }
      }
    }
    return count > 0 ? totalDimension / count : 1.0;
  }
  private calculateSymbolDepth(symbol: HarmonicSymbol, semanticData: SemanticData): number {
    // Calculate nesting depth
    let depth = 0;
    // File path depth
    depth += (symbol.filePath.match(/\//g) || []).length;
    // Container depth
    if (symbol.containerName) depth++;
    // Relationship depth
    const relations = semanticData.relationships.get(symbol.id);
    if (relations && relations.length > 0) {
      depth += Math.floor(Math.log2(relations.length + 1));
    }
    return depth;
  }
  private detectSelfSimilarity(semanticData: SemanticData): SelfSimilarityScore {
    const patterns: string[] = [];
    // 1. Analyze structural self-similarity at multiple scales
    const structuralSimilarity = this.analyzeStructuralSelfSimilarity(semanticData);
    // 2. Analyze recursive patterns
    const recursiveSimilarity = this.analyzeRecursiveSelfSimilarity(semanticData);
    // 3. Analyze hierarchical self-similarity
    const hierarchicalSimilarity = this.analyzeHierarchicalSelfSimilarity(semanticData);
    // Combine all similarity measures
    const overallConfidence = (
      structuralSimilarity.confidence * 0.4 +
      recursiveSimilarity.confidence * 0.3 +
      hierarchicalSimilarity.confidence * 0.3
    );
    patterns.push(...structuralSimilarity.patterns);
    patterns.push(...recursiveSimilarity.patterns);
    patterns.push(...hierarchicalSimilarity.patterns);
    return {
      scale: Math.max(
        structuralSimilarity.scale,
        recursiveSimilarity.scale,
        hierarchicalSimilarity.scale
      ),
      iterations: structuralSimilarity.iterations,
      confidence: overallConfidence,
      patterns
    };
  }
  private analyzeStructuralSelfSimilarity(semanticData: SemanticData): {
    scale: number;
    iterations: number;
    confidence: number;
    patterns: string[];
  } {
    // Build hierarchical representation of code structure
    const hierarchy = this.buildStructuralHierarchy(semanticData);
    const patterns: string[] = [];
    let totalSimilarity = 0;
    let comparisons = 0;
    // Compare patterns at different levels of hierarchy
    for (let level = 0; level < hierarchy.length - 1; level++) {
      const currentLevel = hierarchy[level];
      const nextLevel = hierarchy[level + 1];
      // Calculate similarity between levels
      const similarity = this.calculateLevelSimilarity(currentLevel, nextLevel);
      if (similarity > 0.6) {
        patterns.push(`Level ${level} → ${level + 1}: ${(similarity * 100).toFixed(1)}% similar structure`);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    return {
      scale: comparisons,
      iterations: hierarchy.length,
      confidence: comparisons > 0 ? totalSimilarity / comparisons : 0,
      patterns
    };
  }
  private analyzeRecursiveSelfSimilarity(semanticData: SemanticData): {
    scale: number;
    iterations: number;
    confidence: number;
    patterns: string[];
  } {
    const patterns: string[] = [];
    const recursivePatterns = this.detectRecursivePatterns(semanticData);
    let totalDepth = 0;
    let totalSimilarity = 0;
    for (const pattern of recursivePatterns) {
      const similarity = this.calculateRecursiveSimilarity(pattern);
      if (similarity > 0.7) {
        patterns.push(`Recursive pattern: ${pattern.name} (depth ${pattern.depth}, similarity ${(similarity * 100).toFixed(1)}%)`);
        totalDepth += pattern.depth;
        totalSimilarity += similarity;
      }
    }
    return {
      scale: recursivePatterns.length,
      iterations: Math.max(...recursivePatterns.map(p => p.depth), 0),
      confidence: recursivePatterns.length > 0 ? totalSimilarity / recursivePatterns.length : 0,
      patterns
    };
  }
  private analyzeHierarchicalSelfSimilarity(semanticData: SemanticData): {
    scale: number;
    iterations: number;
    confidence: number;
    patterns: string[];
  } {
    const patterns: string[] = [];
    // Analyze module → class → method hierarchy
    const modulePatterns = this.extractModulePatterns(semanticData);
    const classPatterns = this.extractClassPatterns(semanticData);
    const methodPatterns = this.extractMethodPatterns(semanticData);
    // Compare pattern distributions across hierarchical levels
    const moduleClassSimilarity = this.comparePatternDistributions(modulePatterns, classPatterns);
    const classMethodSimilarity = this.comparePatternDistributions(classPatterns, methodPatterns);
    if (moduleClassSimilarity > 0.6) {
      patterns.push(`Module-Class similarity: ${(moduleClassSimilarity * 100).toFixed(1)}%`);
    }
    if (classMethodSimilarity > 0.6) {
      patterns.push(`Class-Method similarity: ${(classMethodSimilarity * 100).toFixed(1)}%`);
    }
    const overallSimilarity = (moduleClassSimilarity + classMethodSimilarity) / 2;
    return {
      scale: 3, // Three hierarchical levels
      iterations: 3,
      confidence: overallSimilarity,
      patterns
    };
  }
  private buildStructuralHierarchy(semanticData: SemanticData): any[][] {
    const hierarchy: any[][] = [];
    // Level 0: Modules
    const modules = semanticData.structure.modules.map(module => ({
      type: 'module',
      name: module,
      complexity: this.calculateModuleComplexity(module, semanticData)
    }));
    hierarchy.push(modules);
    // Level 1: Files
    const files = semanticData.structure.files.map(file => ({
      type: 'file',
      name: file,
      complexity: this.calculateFileComplexity(file, semanticData)
    }));
    hierarchy.push(files);
    // Level 2: Classes/Interfaces
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class' || s.kind === 'interface')
      .map(cls => ({
        type: cls.kind,
        name: cls.name,
        complexity: this.calculateSymbolComplexity(cls, semanticData)
      }));
    hierarchy.push(classes);
    // Level 3: Methods/Functions
    const methods = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'method' || s.kind === 'function')
      .map(method => ({
        type: method.kind,
        name: method.name,
        complexity: this.calculateSymbolComplexity(method, semanticData)
      }));
    hierarchy.push(methods);
    return hierarchy;
  }
  private calculateLevelSimilarity(level1: any[], level2: any[]): number {
    if (level1.length === 0 || level2.length === 0) return 0;
    // Compare complexity distributions
    const dist1 = this.getComplexityDistribution(level1);
    const dist2 = this.getComplexityDistribution(level2);
    // Compare type distributions
    const typeDist1 = this.getTypeDistribution(level1);
    const typeDist2 = this.getTypeDistribution(level2);
    // Calculate similarities
    const complexitySim = this.compareDistributions(dist1, dist2);
    const typeSim = this.compareDistributions(typeDist1, typeDist2);
    return (complexitySim + typeSim) / 2;
  }
  private getComplexityDistribution(items: any[]): Map<number, number> {
    const distribution = new Map<number, number>();
    for (const item of items) {
      const bin = Math.floor(item.complexity / 5) * 5;
      distribution.set(bin, (distribution.get(bin) || 0) + 1);
    }
    return distribution;
  }
  private getTypeDistribution(items: any[]): Map<string, number> {
    const distribution = new Map<string, number>();
    for (const item of items) {
      distribution.set(item.type, (distribution.get(item.type) || 0) + 1);
    }
    return distribution;
  }
  private compareDistributions<T>(dist1: Map<T, number>, dist2: Map<T, number>): number {
    const allKeys = new Set([...dist1.keys(), ...dist2.keys()]);
    const total1 = Array.from(dist1.values()).reduce((a, b) => a + b, 0);
    const total2 = Array.from(dist2.values()).reduce((a, b) => a + b, 0);
    if (total1 === 0 || total2 === 0) return 0;
    let similarity = 0;
    for (const key of allKeys) {
      const p1 = (dist1.get(key) || 0) / total1;
      const p2 = (dist2.get(key) || 0) / total2;
      similarity += Math.min(p1, p2);
    }
    return similarity;
  }
  private detectRecursivePatterns(semanticData: SemanticData): Array<{
    name: string;
    depth: number;
    pattern: any;
  }> {
    const patterns: Array<{ name: string; depth: number; pattern: any }> = [];
    // Detect direct recursion
    for (const [id, targets] of semanticData.relationships) {
      if (targets.includes(id)) {
        const symbol = semanticData.symbols.get(id);
        if (symbol) {
          patterns.push({
            name: symbol.name,
            depth: 1,
            pattern: { type: 'direct', symbolId: id }
          });
        }
      }
    }
    // Detect indirect recursion
    const cycles = this.findStronglyConnectedComponents(semanticData.relationships);
    for (const cycle of cycles) {
      if (cycle.length > 1) {
        patterns.push({
          name: `Cycle of ${cycle.length} symbols`,
          depth: cycle.length,
          pattern: { type: 'indirect', cycle }
        });
      }
    }
    // Detect structural recursion (e.g., tree-like patterns)
    const treePatterns = this.detectTreePatterns(semanticData);
    patterns.push(...treePatterns);
    return patterns;
  }
  private detectTreePatterns(semanticData: SemanticData): Array<{
    name: string;
    depth: number;
    pattern: any;
  }> {
    const patterns: Array<{ name: string; depth: number; pattern: any }> = [];
    // Look for tree-like structures in class hierarchies
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class' || s.kind === 'interface');
    for (const cls of classes) {
      const tree = this.buildInheritanceTree(cls, semanticData);
      if (tree.depth > 2) {
        patterns.push({
          name: `${cls.name} hierarchy`,
          depth: tree.depth,
          pattern: tree
        });
      }
    }
    return patterns;
  }
  private buildInheritanceTree(root: HarmonicSymbol, semanticData: SemanticData): any {
    const visited = new Set<string>();
    const buildTree = (symbol: HarmonicSymbol, depth: number = 0): any => {
      if (visited.has(symbol.id) || depth > 10) return null;
      visited.add(symbol.id);
      const children = Array.from(semanticData.symbols.values())
        .filter(s => {
          const relations = semanticData.relationships.get(s.id) || [];
          return relations.includes(symbol.id) && 
                 (s.kind === 'class' || s.kind === 'interface');
        });
      const childTrees = children
        .map(child => buildTree(child, depth + 1))
        .filter(t => t !== null);
      return {
        id: symbol.id,
        name: symbol.name,
        depth: depth,
        children: childTrees,
        maxDepth: Math.max(depth, ...childTrees.map(t => t.maxDepth))
      };
    };
    const tree = buildTree(root);
    return tree || { depth: 0 };
  }
  private calculateRecursiveSimilarity(pattern: any): number {
    // Calculate how self-similar a recursive pattern is
    if (pattern.pattern.type === 'direct') {
      return 1.0; // Direct recursion is perfectly self-similar
    } else if (pattern.pattern.type === 'indirect') {
      // For cycles, similarity depends on consistency of the pattern
      const cycle = pattern.pattern.cycle;
      return 0.8 + 0.2 * (1 / cycle.length); // Smaller cycles are more similar
    } else if (pattern.pattern.children) {
      // For tree patterns, check if subtrees are similar
      return this.calculateTreeSimilarity(pattern.pattern);
    }
    return 0.5;
  }
  private calculateTreeSimilarity(tree: any): number {
    if (!tree.children || tree.children.length === 0) return 1;
    // Compare child subtrees
    let totalSimilarity = 0;
    let comparisons = 0;
    for (let i = 0; i < tree.children.length - 1; i++) {
      for (let j = i + 1; j < tree.children.length; j++) {
        const sim = this.compareTreeStructures(tree.children[i], tree.children[j]);
        totalSimilarity += sim;
        comparisons++;
      }
    }
    return comparisons > 0 ? totalSimilarity / comparisons : 1;
  }
  private compareTreeStructures(tree1: any, tree2: any): number {
    // Compare depth
    const depthSim = 1 - Math.abs(tree1.maxDepth - tree2.maxDepth) / 
                     Math.max(tree1.maxDepth, tree2.maxDepth, 1);
    // Compare branching factor
    const branch1 = tree1.children ? tree1.children.length : 0;
    const branch2 = tree2.children ? tree2.children.length : 0;
    const branchSim = 1 - Math.abs(branch1 - branch2) / Math.max(branch1, branch2, 1);
    return (depthSim + branchSim) / 2;
  }
  private extractModulePatterns(semanticData: SemanticData): Map<string, number> {
    const patterns = new Map<string, number>();
    for (const module of semanticData.structure.modules) {
      const complexity = this.calculateModuleComplexity(module, semanticData);
      const pattern = `module_complexity_${Math.floor(complexity / 10) * 10}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    return patterns;
  }
  private extractClassPatterns(semanticData: SemanticData): Map<string, number> {
    const patterns = new Map<string, number>();
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class' || s.kind === 'interface');
    for (const cls of classes) {
      const memberCount = Array.from(semanticData.symbols.values())
        .filter(s => s.containerName === cls.name).length;
      const pattern = `class_members_${Math.floor(memberCount / 5) * 5}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    return patterns;
  }
  private extractMethodPatterns(semanticData: SemanticData): Map<string, number> {
    const patterns = new Map<string, number>();
    const methods = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'method' || s.kind === 'function');
    for (const method of methods) {
      const size = (method.endLine || method.line) - method.line;
      const pattern = `method_size_${Math.floor(size / 10) * 10}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    return patterns;
  }
  private comparePatternDistributions(dist1: Map<string, number>, dist2: Map<string, number>): number {
    return this.compareDistributions(dist1, dist2);
  }
  private calculateModuleComplexity(module: string, semanticData: SemanticData): number {
    const moduleSymbols = Array.from(semanticData.symbols.values())
      .filter(s => s.filePath.includes(`/${module}/`) || s.filePath.includes(`${module}/`));
    return moduleSymbols.reduce((sum, s) => 
      sum + this.calculateSymbolComplexity(s, semanticData), 0);
  }
  private calculateFileComplexity(file: string, semanticData: SemanticData): number {
    const fileSymbols = Array.from(semanticData.symbols.values())
      .filter(s => s.filePath === file);
    return fileSymbols.reduce((sum, s) => 
      sum + this.calculateSymbolComplexity(s, semanticData), 0);
  }
  private calculateSymbolComplexity(symbol: HarmonicSymbol, semanticData: SemanticData): number {
    let complexity = 1;
    // Size-based complexity
    const size = (symbol.endLine || symbol.line) - symbol.line;
    complexity += Math.log2(size + 1);
    // Relationship-based complexity
    const relationships = (semanticData.relationships.get(symbol.id) || []).length;
    complexity += Math.sqrt(relationships);
    // Type-specific complexity
    if (symbol.kind === 'class' || symbol.kind === 'interface') {
      const members = Array.from(semanticData.symbols.values())
        .filter(s => s.containerName === symbol.name).length;
      complexity += Math.log2(members + 1);
    }
    return complexity;
  }
  private groupByScale(semanticData: SemanticData): any[][] {
    // Group symbols by their scale (depth, size, complexity)
    const scaleMap = new Map<number, any[]>();
    for (const [_, symbol] of semanticData.symbols) {
      const scale = this.calculateScale(symbol);
      if (!scaleMap.has(scale)) {
        scaleMap.set(scale, []);
      }
      scaleMap.get(scale)!.push(symbol);
    }
    return Array.from(scaleMap.values());
  }
  private calculateScale(symbol: HarmonicSymbol): number {
    // Determine the scale of a symbol based on various metrics
    let scale = 0;
    // Size scale
    if (symbol.endLine && symbol.line) {
      const size = symbol.endLine - symbol.line;
      scale = Math.floor(Math.log2(size + 1));
    }
    // Complexity scale
    if (symbol.complexity) {
      scale = Math.max(scale, Math.floor(Math.log2(symbol.complexity + 1)));
    }
    return scale;
  }
  private comparePatternsAtScale(group1: any[], group2: any[]): number {
    if (group1.length === 0 || group2.length === 0) return 0;
    // Compare statistical properties
    const stats1 = this.calculateGroupStats(group1);
    const stats2 = this.calculateGroupStats(group2);
    // Compare distributions
    let similarity = 0;
    let comparisons = 0;
    // Size distribution similarity
    if (stats1.avgSize > 0 && stats2.avgSize > 0) {
      similarity += 1 - Math.abs(stats1.avgSize - stats2.avgSize) / Math.max(stats1.avgSize, stats2.avgSize);
      comparisons++;
    }
    // Complexity distribution similarity
    if (stats1.avgComplexity > 0 && stats2.avgComplexity > 0) {
      similarity += 1 - Math.abs(stats1.avgComplexity - stats2.avgComplexity) / Math.max(stats1.avgComplexity, stats2.avgComplexity);
      comparisons++;
    }
    // Type distribution similarity
    similarity += this.compareTypeDistributions(stats1.typeDistribution, stats2.typeDistribution);
    comparisons++;
    return comparisons > 0 ? similarity / comparisons : 0;
  }
  private calculateGroupStats(group: any[]): any {
    const stats = {
      avgSize: 0,
      avgComplexity: 0,
      typeDistribution: new Map<string, number>()
    };
    let totalSize = 0;
    let totalComplexity = 0;
    let sizeCount = 0;
    let complexityCount = 0;
    for (const symbol of group) {
      if (symbol.endLine && symbol.line) {
        totalSize += symbol.endLine - symbol.line;
        sizeCount++;
      }
      if (symbol.complexity) {
        totalComplexity += symbol.complexity;
        complexityCount++;
      }
      // Count types
      stats.typeDistribution.set(
        symbol.kind,
        (stats.typeDistribution.get(symbol.kind) || 0) + 1
      );
    }
    stats.avgSize = sizeCount > 0 ? totalSize / sizeCount : 0;
    stats.avgComplexity = complexityCount > 0 ? totalComplexity / complexityCount : 0;
    return stats;
  }
  private compareTypeDistributions(dist1: Map<string, number>, dist2: Map<string, number>): number {
    const allTypes = new Set([...dist1.keys(), ...dist2.keys()]);
    if (allTypes.size === 0) return 0;
    let similarity = 0;
    for (const type of allTypes) {
      const count1 = dist1.get(type) || 0;
      const count2 = dist2.get(type) || 0;
      const total1 = Array.from(dist1.values()).reduce((a, b) => a + b, 0);
      const total2 = Array.from(dist2.values()).reduce((a, b) => a + b, 0);
      if (total1 > 0 && total2 > 0) {
        const freq1 = count1 / total1;
        const freq2 = count2 / total2;
        similarity += 1 - Math.abs(freq1 - freq2);
      }
    }
    return similarity / allTypes.size;
  }
  // Helper methods for Julia Set Patterns
  private analyzeParameterSensitivity(semanticData: SemanticData): any {
    // Analyze how small changes in parameters affect the system
    const functions = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'function' || s.kind === 'method');
    if (functions.length === 0) {
      return { chaotic: false, divergence: 0, score: 0, location: 'none' };
    }
    // Look for functions with similar names but different parameters
    const sensitivityMap = new Map<string, any[]>();
    for (const func of functions) {
      const baseName = func.name.replace(/\d+$/, '').replace(/_v\d+$/, '');
      if (!sensitivityMap.has(baseName)) {
        sensitivityMap.set(baseName, []);
      }
      sensitivityMap.get(baseName)!.push(func);
    }
    let maxDivergence = 0;
    let chaoticCount = 0;
    let totalGroups = 0;
    for (const [baseName, variants] of sensitivityMap) {
      if (variants.length > 1) {
        totalGroups++;
        // Calculate parameter divergence
        const divergence = this.calculateParameterDivergence(variants);
        if (divergence > 2) {
          chaoticCount++;
          maxDivergence = Math.max(maxDivergence, divergence);
        }
      }
    }
    const score = totalGroups > 0 ? chaoticCount / totalGroups : 0;
    return {
      chaotic: chaoticCount > 0,
      divergence: maxDivergence,
      score,
      location: `${chaoticCount} function families`
    };
  }
  private calculateParameterDivergence(variants: any[]): number {
    if (variants.length < 2) return 0;
    // Compare parameter counts and complexities
    const paramCounts = variants.map(v => v.parameters?.length || 0);
    const complexities = variants.map(v => v.complexity || 1);
    const paramVariance = this.calculateVariance(paramCounts);
    const complexityVariance = this.calculateVariance(complexities);
    // High variance indicates sensitivity
    return Math.sqrt(paramVariance + complexityVariance);
  }
  private measureConnectivity(semanticData: SemanticData): any {
    const relationships = semanticData.relationships;
    const symbols = semanticData.symbols;
    // Build connectivity graph
    const connected = new Set<string>();
    const visited = new Set<string>();
    // Start from arbitrary node
    const startNode = symbols.keys().next().value;
    if (!startNode) {
      return { isConnected: false, juliaLike: false, score: 0, description: 'Empty graph' };
    }
    // DFS to find connected components
    const dfs = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      connected.add(node);
      const relations = relationships.get(node) || [];
      for (const relation of relations) {
        dfs(relation);
      }
      // Check reverse relationships
      for (const [source, targets] of relationships) {
        if (targets.includes(node)) {
          dfs(source);
        }
      }
    };
    dfs(startNode);
    const connectivityRatio = connected.size / symbols.size;
    const isConnected = connectivityRatio > 0.8;
    // Julia-like if highly connected with complex boundaries
    const juliaLike = isConnected && this.hasComplexBoundaries(relationships);
    return {
      isConnected,
      juliaLike,
      score: connectivityRatio,
      description: `${(connectivityRatio * 100).toFixed(0)}% connected`
    };
  }
  private hasComplexBoundaries(relationships: Map<string, string[]>): boolean {
    // Check if the relationship graph has complex, fractal-like boundaries
    let boundaryComplexity = 0;
    for (const [source, targets] of relationships) {
      // Nodes with unusual connection patterns
      if (targets.length === 1 || targets.length > 5) {
        boundaryComplexity++;
      }
    }
    return boundaryComplexity > relationships.size * 0.3;
  }
  private detectDynamicSystems(semanticData: SemanticData): any[] {
    const systems = [];
    // Look for state machines and iterative systems
    const statePatterns = ['state', 'status', 'phase', 'mode', 'stage'];
    const iterativePatterns = ['update', 'iterate', 'step', 'evolve', 'transform'];
    for (const [id, symbol] of semanticData.symbols) {
      const name = symbol.name.toLowerCase();
      const hasStatePattern = statePatterns.some(p => name.includes(p));
      const hasIterativePattern = iterativePatterns.some(p => name.includes(p));
      if (hasStatePattern || hasIterativePattern) {
        const relatedSymbols = this.findRelatedSymbols(id, semanticData);
        const exhibitsJuliaBehavior = this.checkJuliaBehavior(symbol, relatedSymbols);
        if (exhibitsJuliaBehavior) {
          systems.push({
            name: symbol.name,
            exhibitsJuliaBehavior: true,
            score: 0.7 + (relatedSymbols.length / 20) * 0.3
          });
        }
      }
    }
    return systems;
  }
  private findRelatedSymbols(symbolId: string, semanticData: SemanticData): HarmonicSymbol[] {
    const related: HarmonicSymbol[] = [];
    const visited = new Set<string>();
    const traverse = (id: string, depth: number = 0) => {
      if (visited.has(id) || depth > 3) return;
      visited.add(id);
      const symbol = semanticData.symbols.get(id);
      if (symbol && depth > 0) {
        related.push(symbol);
      }
      const relations = semanticData.relationships.get(id) || [];
      for (const relId of relations) {
        traverse(relId, depth + 1);
      }
    };
    traverse(symbolId);
    return related;
  }
  private checkJuliaBehavior(symbol: HarmonicSymbol, relatedSymbols: HarmonicSymbol[]): boolean {
    // Check if the system exhibits Julia-like iterative behavior
    if (relatedSymbols.length < 3) return false;
    // Look for feedback loops
    const hasFeedback = relatedSymbols.some(s => 
      s.name.toLowerCase().includes('feedback') ||
      s.name.toLowerCase().includes('recursive') ||
      s.name.toLowerCase().includes('self')
    );
    // Look for transformation functions
    const hasTransform = relatedSymbols.some(s =>
      s.name.toLowerCase().includes('transform') ||
      s.name.toLowerCase().includes('map') ||
      s.name.toLowerCase().includes('apply')
    );
    return hasFeedback && hasTransform;
  }
  // Helper methods for L-System Growth
  private findRecursiveGrowthPatterns(semanticData: SemanticData): any[] {
    const patterns = [];
    // Find recursive functions and structures
    const recursiveSymbols = Array.from(semanticData.symbols.values())
      .filter(s => this.isRecursive(s, semanticData));
    for (const symbol of recursiveSymbols) {
      const growthPattern = this.analyzeGrowthPattern(symbol, semanticData);
      if (growthPattern) {
        patterns.push({
          description: growthPattern.description,
          isLSystemLike: growthPattern.branchingFactor > 1,
          score: growthPattern.score
        });
      }
    }
    return patterns;
  }
  private isRecursive(symbol: HarmonicSymbol, semanticData: SemanticData): boolean {
    // Check if symbol is part of recursive pattern
    const relations = semanticData.relationships.get(symbol.id) || [];
    // Direct recursion
    if (relations.includes(symbol.id)) return true;
    // Indirect recursion (cycle detection)
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const hasCycle = (id: string): boolean => {
      visited.add(id);
      recStack.add(id);
      const neighbors = semanticData.relationships.get(id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      recStack.delete(id);
      return false;
    };
    return hasCycle(symbol.id);
  }
  private analyzeGrowthPattern(symbol: HarmonicSymbol, semanticData: SemanticData): any {
    const relations = semanticData.relationships.get(symbol.id) || [];
    // Calculate branching factor
    const branchingFactor = relations.length;
    // Analyze growth characteristics
    let totalDepth = 0;
    let maxDepth = 0;
    let nodeCount = 0;
    const measureDepth = (id: string, depth: number, visited: Set<string>) => {
      if (visited.has(id) || depth > this.MAX_RECURSION_DEPTH) return;
      visited.add(id);
      nodeCount++;
      totalDepth += depth;
      maxDepth = Math.max(maxDepth, depth);
      const childRelations = semanticData.relationships.get(id) || [];
      for (const child of childRelations) {
        measureDepth(child, depth + 1, visited);
      }
    };
    measureDepth(symbol.id, 0, new Set());
    if (nodeCount === 0) return null;
    const avgDepth = totalDepth / nodeCount;
    const score = (branchingFactor > 1 ? 0.5 : 0) + 
                  (maxDepth > 3 ? 0.3 : 0) +
                  (avgDepth > 2 ? 0.2 : 0);
    return {
      branchingFactor,
      maxDepth,
      avgDepth,
      score,
      description: `Branching factor: ${branchingFactor}, Max depth: ${maxDepth}`
    };
  }
  private analyzeBranchingFactors(semanticData: SemanticData): any {
    const branchingFactors: number[] = [];
    for (const [_, relations] of semanticData.relationships) {
      if (relations.length > 0) {
        branchingFactors.push(relations.length);
      }
    }
    if (branchingFactors.length === 0) {
      return { biological: false, averageFactor: 0, score: 0 };
    }
    const avgFactor = branchingFactors.reduce((a, b) => a + b, 0) / branchingFactors.length;
    // Biological branching typically between 1.5 and 3
    const biological = avgFactor >= 1.5 && avgFactor <= 3;
    const score = biological ? 1 - Math.abs(avgFactor - 2.2) / 2.2 : 0;
    return {
      biological,
      averageFactor: avgFactor,
      score
    };
  }
  private matchBiologicalPatterns(semanticData: SemanticData): any[] {
    const patterns = [];
    // Known biological growth patterns
    const bioPatterns = [
      { type: 'tree', branchingRange: [2, 3], depthRange: [3, 8] },
      { type: 'fern', branchingRange: [3, 5], depthRange: [4, 6] },
      { type: 'coral', branchingRange: [2, 4], depthRange: [2, 5] },
      { type: 'root', branchingRange: [1, 3], depthRange: [4, 10] }
    ];
    // Analyze overall structure
    const structureStats = this.calculateStructureStats(semanticData);
    for (const bioPattern of bioPatterns) {
      const branchingMatch = structureStats.avgBranching >= bioPattern.branchingRange[0] &&
                            structureStats.avgBranching <= bioPattern.branchingRange[1];
      const depthMatch = structureStats.avgDepth >= bioPattern.depthRange[0] &&
                        structureStats.avgDepth <= bioPattern.depthRange[1];
      if (branchingMatch && depthMatch) {
        const similarity = 50 + (branchingMatch ? 25 : 0) + (depthMatch ? 25 : 0);
        patterns.push({
          type: bioPattern.type,
          similarity,
          location: 'overall_structure'
        });
      }
    }
    return patterns;
  }
  private calculateStructureStats(semanticData: SemanticData): any {
    let totalBranching = 0;
    let totalDepth = 0;
    let count = 0;
    for (const [id, relations] of semanticData.relationships) {
      if (relations.length > 0) {
        totalBranching += relations.length;
        const depth = this.calculateMaxDepth(id, semanticData, new Set());
        totalDepth += depth;
        count++;
      }
    }
    return {
      avgBranching: count > 0 ? totalBranching / count : 0,
      avgDepth: count > 0 ? totalDepth / count : 0
    };
  }
  private calculateMaxDepth(id: string, semanticData: SemanticData, visited: Set<string>): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const relations = semanticData.relationships.get(id) || [];
    let maxChildDepth = 0;
    for (const childId of relations) {
      const childDepth = this.calculateMaxDepth(childId, semanticData, visited);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
    return 1 + maxChildDepth;
  }
  // Helper methods for Hausdorff Dimension
  private calculateBoxCountingDimensionForSemanticData(semanticData: SemanticData): any {
    // Implement box-counting algorithm for code structure
    const symbols = Array.from(semanticData.symbols.values());
    if (symbols.length < 10) {
      return { isValid: false, dimension: 1 };
    }
    // Create spatial representation of code
    const points = symbols.map(s => ({
      x: s.line,
      y: s.complexity || 1,
      z: (s.parameters?.length || 0)
    }));
    // Box counting at different scales
    const scales = [1, 2, 4, 8, 16];
    const counts: number[] = [];
    for (const scale of scales) {
      const boxes = new Set<string>();
      for (const point of points) {
        const boxX = Math.floor(point.x / scale);
        const boxY = Math.floor(point.y / scale);
        const boxZ = Math.floor(point.z / scale);
        boxes.add(`${boxX},${boxY},${boxZ}`);
      }
      counts.push(boxes.size);
    }
    // Calculate dimension from scaling relationship
    const dimension = this.calculateDimensionFromCounts(scales, counts);
    return {
      isValid: dimension > 0 && dimension < 3,
      dimension
    };
  }
  private calculateDimensionFromCounts(scales: number[], counts: number[]): number {
    if (scales.length < 2) return 1;
    // Use least squares to fit log(N) = -D * log(scale) + C
    const logScales = scales.map(s => Math.log(s));
    const logCounts = counts.map(c => Math.log(c));
    const n = scales.length;
    const sumX = logScales.reduce((a, b) => a + b, 0);
    const sumY = logCounts.reduce((a, b) => a + b, 0);
    const sumXY = logScales.reduce((sum, x, i) => sum + x * logCounts[i], 0);
    const sumX2 = logScales.reduce((sum, x) => sum + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return -slope; // Dimension is negative of slope
  }
  private calculateStructureDimensions(semanticData: SemanticData): any[] {
    const dimensions = [];
    // Calculate dimension for different code structures
    const structures = [
      { name: 'File hierarchy', data: this.extractFileHierarchy(semanticData) },
      { name: 'Class inheritance', data: this.extractClassHierarchy(semanticData) },
      { name: 'Function calls', data: this.extractCallGraph(semanticData) }
    ];
    for (const structure of structures) {
      if (structure.data.length > 5) {
        const dimension = this.calculateHierarchyDimension(structure.data);
        dimensions.push({
          name: structure.name,
          dimension,
          isFractal: dimension % 1 > 0.1 && dimension % 1 < 0.9,
          confidence: 0.7,
          location: structure.name.toLowerCase().replace(' ', '_')
        });
      }
    }
    return dimensions;
  }
  private extractFileHierarchy(semanticData: SemanticData): any[] {
    const hierarchy = [];
    const files = semanticData.structure.files;
    // Build file tree structure
    const tree = new Map<string, Set<string>>();
    for (const file of files) {
      const parts = file.split('/');
      for (let i = 0; i < parts.length - 1; i++) {
        const parent = parts.slice(0, i + 1).join('/');
        const child = parts.slice(0, i + 2).join('/');
        if (!tree.has(parent)) {
          tree.set(parent, new Set());
        }
        tree.get(parent)!.add(child);
      }
    }
    // Convert to array format
    for (const [parent, children] of tree) {
      hierarchy.push({
        level: parent.split('/').length,
        count: children.size
      });
    }
    return hierarchy;
  }
  private extractClassHierarchy(semanticData: SemanticData): any[] {
    const hierarchy = [];
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class');
    // Build inheritance levels
    const levels = new Map<number, number>();
    for (const cls of classes) {
      const depth = this.calculateInheritanceDepth(cls.id, semanticData);
      levels.set(depth, (levels.get(depth) || 0) + 1);
    }
    for (const [level, count] of levels) {
      hierarchy.push({ level, count });
    }
    return hierarchy;
  }
  private calculateInheritanceDepth(classId: string, semanticData: SemanticData): number {
    const visited = new Set<string>();
    const getDepth = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);
      const relations = semanticData.relationships.get(id) || [];
      let maxDepth = 0;
      for (const relId of relations) {
        const relSymbol = semanticData.symbols.get(relId);
        if (relSymbol && relSymbol.kind === 'class') {
          maxDepth = Math.max(maxDepth, 1 + getDepth(relId));
        }
      }
      return maxDepth;
    };
    return getDepth(classId);
  }
  private extractCallGraph(semanticData: SemanticData): any[] {
    const callGraph = [];
    // Count function calls at different depths
    const depthCounts = new Map<number, number>();
    for (const [id, relations] of semanticData.relationships) {
      const symbol = semanticData.symbols.get(id);
      if (symbol && (symbol.kind === 'function' || symbol.kind === 'method')) {
        const depth = relations.length; // Simplified: use out-degree as depth
        depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
      }
    }
    for (const [depth, count] of depthCounts) {
      callGraph.push({ level: depth, count });
    }
    return callGraph;
  }
  private calculateHierarchyDimension(hierarchy: any[]): number {
    if (hierarchy.length < 2) return 1;
    // Sort by level
    hierarchy.sort((a, b) => a.level - b.level);
    // Calculate dimension from level vs count relationship
    const levels = hierarchy.map(h => h.level);
    const counts = hierarchy.map(h => h.count);
    return this.calculateDimensionFromCounts(levels, counts);
  }
  private scoreFractalComplexity(semanticData: SemanticData): any {
    // Overall fractal complexity score
    const metrics = [];
    // Self-similarity score
    const selfSim = this.detectSelfSimilarity(semanticData);
    metrics.push(selfSim.confidence);
    // Recursive depth score
    const recursiveSymbols = Array.from(semanticData.symbols.values())
      .filter(s => this.isRecursive(s, semanticData));
    const recursiveRatio = recursiveSymbols.length / semanticData.symbols.size;
    metrics.push(recursiveRatio);
    // Branching complexity
    const branchingStats = this.analyzeBranchingFactors(semanticData);
    metrics.push(branchingStats.score);
    const avgScore = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    return {
      score: avgScore,
      description: `Self-similarity: ${(selfSim.confidence * 100).toFixed(0)}%, Recursive: ${(recursiveRatio * 100).toFixed(0)}%`
    };
  }
  // Utility methods
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  private isFractalBoundary(complexities: number[]): boolean {
    if (complexities.length < 3) return false;
    // Check for self-similar variance at different scales
    const variance = this.calculateVariance(complexities);
    const halfVariance1 = this.calculateVariance(complexities.slice(0, Math.floor(complexities.length / 2)));
    const halfVariance2 = this.calculateVariance(complexities.slice(Math.floor(complexities.length / 2)));
    // Fractal if variances are similar at different scales
    const varianceRatio1 = halfVariance1 / variance;
    const varianceRatio2 = halfVariance2 / variance;
    return varianceRatio1 > 0.4 && varianceRatio1 < 0.6 &&
           varianceRatio2 > 0.4 && varianceRatio2 < 0.6;
  }
  private estimateDimension(values: number[]): number {
    // Simple dimension estimation based on distribution
    const sorted = [...values].sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];
    if (range === 0) return 1;
    // Count unique values at different scales
    const scales = [1, 2, 4, 8];
    const counts = scales.map(scale => {
      const scaled = values.map(v => Math.floor(v / scale));
      return new Set(scaled).size;
    });
    return this.calculateDimensionFromCounts(scales, counts);
  }
  /**
   * Calculate confidence based on evidence
   */
  private calculateConfidence(evidence: PatternEvidence[]): number {
    if (evidence.length === 0) return 0;
    // Calculate weighted confidence based on evidence
    const totalWeight = evidence.reduce((sum, e) => sum + e.weight, 0);
    const weightedSum = evidence.reduce((sum, e) => sum + e.weight * (e.value || 0), 0);
    if (totalWeight === 0) return 0;
    const baseConfidence = weightedSum / totalWeight;
    // Adjust confidence based on evidence count
    const evidenceBonus = Math.min(0.2, evidence.length * 0.05);
    return Math.min(1, baseConfidence + evidenceBonus);
  }
  private findStronglyConnectedComponents(relationships: Map<string, string[]>): string[][] {
    // Tarjan's algorithm for finding strongly connected components
    const sccs: string[][] = [];
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    let currentIndex = 0;
    const strongconnect = (v: string) => {
      index.set(v, currentIndex);
      lowlink.set(v, currentIndex);
      currentIndex++;
      stack.push(v);
      onStack.add(v);
      const neighbors = relationships.get(v) || [];
      for (const w of neighbors) {
        if (!index.has(w)) {
          strongconnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
        }
      }
      if (lowlink.get(v) === index.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        if (scc.length > 1) {
          sccs.push(scc);
        }
      }
    };
    for (const node of relationships.keys()) {
      if (!index.has(node)) {
        strongconnect(node);
      }
    }
    return sccs;
  }
}