/**
 * Information Theory Pattern Analyzer
 * Detects Shannon entropy, Kolmogorov complexity, and effective complexity in code structure
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
interface InformationMetrics {
  shannonEntropy: EntropyMetrics;
  kolmogorovComplexity: ComplexityMetrics;
  effectiveComplexity: EffectiveMetrics;
}
interface EntropyMetrics {
  symbolEntropy: number;
  structuralEntropy: number;
  conditionalEntropy: number;
  mutualInformation: number;
  redundancy: number;
  compressionRatio: number;
  informationDensity: number;
}
interface ComplexityMetrics {
  compressedSize: number;
  originalSize: number;
  compressionRatio: number;
  algorithmicEntropy: number;
  minimumDescriptionLength: number;
  lempelZivComplexity: number;
  approximateKolmogorov: number;
}
interface EffectiveMetrics {
  structuralRegularity: number;
  randomnessLevel: number;
  effectiveComplexity: number;
  logicalDepth: number;
  meaningfulInformation: number;
  patternStrength: number;
  chaosVsOrder: number;
}
interface StructuralElement {
  id: string;
  type: string;
  depth: number;
  complexity: number;
  connections: number;
  size: number;
}
export class InformationTheoryAnalyzer extends BasePatternAnalyzer {
  protected readonly logger = new Logger('InformationTheoryAnalyzer');
  protected readonly category = PatternCategory.INFORMATION_THEORY;
  protected readonly threshold = 0.35; // Threshold for information patterns
  private readonly CHUNK_SIZE = 1024;
  private readonly MIN_ENTROPY = 0.0;
  private readonly MAX_ENTROPY = 8.0; // bits
  async analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>> {
    const results = new Map<PatternType, PatternScore>();
    // Run all information theory analyses
    const [shannon, kolmogorov, effective] = await Promise.all([
      this.detectShannonEntropy(semanticData),
      this.detectKolmogorovComplexity(semanticData),
      this.detectEffectiveComplexity(semanticData)
    ]);
    results.set(PatternType.SHANNON_ENTROPY, shannon);
    results.set(PatternType.KOLMOGOROV_COMPLEXITY, kolmogorov);
    results.set(PatternType.EFFECTIVE_COMPLEXITY, effective);
    return results;
  }
  private async detectShannonEntropy(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Calculate symbol entropy
    const symbolEntropy = this.calculateSymbolEntropy(semanticData);
    const symbolWeight = 0.3;
    evidence.push({
      type: 'symbol_entropy',
      description: `Symbol entropy: ${symbolEntropy.toFixed(3)} bits`,
      weight: symbolWeight,
      value: symbolEntropy
    });
    // Optimal entropy is neither too high (random) nor too low (trivial)
    const optimalEntropy = 4.0;
    const entropyScore = 1 - Math.abs(symbolEntropy - optimalEntropy) / optimalEntropy;
    totalScore += symbolWeight * Math.max(0, entropyScore);
    weightSum += symbolWeight;
    // 2. Calculate structural entropy
    const structuralEntropy = this.calculateStructuralEntropy(semanticData);
    const structuralWeight = 0.3;
    if (structuralEntropy > 0) {
      evidence.push({
        type: 'structural_entropy',
        description: `Structural entropy: ${structuralEntropy.toFixed(3)} bits`,
        weight: structuralWeight,
        value: structuralEntropy
      });
      const structScore = Math.min(structuralEntropy / 5, 1);
      totalScore += structuralWeight * structScore;
    }
    weightSum += structuralWeight;
    // 3. Calculate redundancy
    const redundancy = this.calculateRedundancy(semanticData);
    const redundancyWeight = 0.2;
    if (semanticData.symbols.size > 0) {
      evidence.push({
        type: 'redundancy_measure',
        description: `Code redundancy: ${(redundancy * 100).toFixed(1)}%`,
        weight: redundancyWeight,
        value: redundancy
      });
      // Lower redundancy is better (but not zero)
      const redundancyScore = redundancy > 0.1 && redundancy < 0.5 ? 1 : 0.5;
      totalScore += redundancyWeight * redundancyScore;
    }
    weightSum += redundancyWeight;
    // 4. Calculate mutual information
    const mutualInfo = this.calculateMutualInformation(semanticData);
    const mutualWeight = 0.2;
    if (mutualInfo > 0) {
      evidence.push({
        type: 'mutual_information',
        description: `Mutual information between modules: ${mutualInfo.toFixed(3)} bits`,
        weight: mutualWeight,
        value: mutualInfo
      });
      totalScore += mutualWeight * Math.min(mutualInfo / 2, 1);
    }
    weightSum += mutualWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.SHANNON_ENTROPY,
      score: finalScore,
      confidence: this.calculateConfidence(evidence.length, 4),
      detected: finalScore > this.threshold,
      evidence,
      category: this.category,
    };
  }
  private async detectKolmogorovComplexity(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Approximate using compression
    const compressionMetrics = this.approximateKolmogorovComplexity(semanticData);
    const compressionWeight = 0.35;
    if (semanticData.symbols.size > 0) {
      evidence.push({
        type: 'compression_approximation',
        description: `Compression ratio: ${(compressionMetrics.ratio * 100).toFixed(1)}% (${compressionMetrics.method})`,
        weight: compressionWeight,
        value: compressionMetrics.ratio
      });
      // Good compression ratio indicates structure
      const compressionScore = compressionMetrics.ratio > 0.3 && compressionMetrics.ratio < 0.7 ? 1 : 0.5;
      totalScore += compressionWeight * compressionScore;
    }
    weightSum += compressionWeight;
    // 2. Calculate minimum description length
    const mdl = this.calculateMinimumDescriptionLength(semanticData);
    const mdlWeight = 0.35;
    if (mdl.length > 0) {
      evidence.push({
        type: 'minimum_description_length',
        description: `MDL: ${mdl.length} bits for ${mdl.elements} elements`,
        weight: mdlWeight,
        value: mdl.length
      });
      const mdlScore = Math.min(mdl.efficiency, 1);
      totalScore += mdlWeight * mdlScore;
    }
    weightSum += mdlWeight;
    // 3. Lempel-Ziv complexity
    const lzComplexity = this.calculateLempelZivComplexity(semanticData);
    const lzWeight = 0.3;
    if (semanticData.symbols.size > 0) {
      evidence.push({
        type: 'lempel_ziv_complexity',
        description: `LZ complexity: ${lzComplexity.complexity} patterns`,
        weight: lzWeight,
        value: lzComplexity.complexity
      });
      const lzScore = Math.min(lzComplexity.normalizedComplexity, 1);
      totalScore += lzWeight * lzScore;
    }
    weightSum += lzWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.KOLMOGOROV_COMPLEXITY,
      score: finalScore,
      confidence: this.calculateConfidence(evidence.length, 3),
      detected: finalScore > this.threshold,
      evidence,
      category: this.category,
    };
  }
  private async detectEffectiveComplexity(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Separate structure from randomness
    const structureAnalysis = this.analyzeStructureVsRandomness(semanticData);
    const structureWeight = 0.35;
    if (semanticData.symbols.size > 0) {
      evidence.push({
        type: 'structure_vs_randomness',
        description: `${(structureAnalysis.structureRatio * 100).toFixed(1)}% structured, ${(structureAnalysis.randomnessRatio * 100).toFixed(1)}% random`,
        weight: structureWeight,
        value: structureAnalysis.effectiveComplexity
      });
      // Optimal balance between structure and randomness
      const balanceScore = 1 - Math.abs(structureAnalysis.structureRatio - 0.7);
      totalScore += structureWeight * balanceScore;
    }
    weightSum += structureWeight;
    // 2. Detect meaningful patterns
    const meaningfulPatterns = this.detectMeaningfulComplexity(semanticData);
    const meaningfulWeight = 0.35;
    if (meaningfulPatterns.count > 0) {
      evidence.push({
        type: 'meaningful_patterns',
        description: `${meaningfulPatterns.count} meaningful patterns detected (strength: ${meaningfulPatterns.averageStrength.toFixed(2)})`,
        weight: meaningfulWeight,
        value: meaningfulPatterns.count
      });
      totalScore += meaningfulWeight * Math.min(meaningfulPatterns.averageStrength, 1);
    } else if (semanticData.symbols.size === 0) {
      // Empty codebase - no score contribution
      totalScore += 0;
    }
    weightSum += meaningfulWeight;
    // 3. Calculate logical depth
    const logicalDepth = this.calculateLogicalDepth(semanticData);
    const depthWeight = 0.3;
    if (semanticData.symbols.size > 0) {
      evidence.push({
        type: 'logical_depth',
        description: `Logical depth: ${logicalDepth.depth} layers`,
        weight: depthWeight,
        value: logicalDepth.depth
      });
      const depthScore = Math.min(logicalDepth.depth / 10, 1);
      totalScore += depthWeight * depthScore;
    }
    weightSum += depthWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.EFFECTIVE_COMPLEXITY,
      score: finalScore,
      confidence: this.calculateConfidence(evidence.length, 3),
      detected: finalScore > this.threshold,
      evidence,
      category: this.category,
    };
  }
  private calculateSymbolEntropy(semanticData: SemanticData): number {
    // Calculate structural entropy based on AST diversity and organization
    const structuralElements = this.extractStructuralElements(semanticData);
    if (structuralElements.length === 0) return 0;
    // Calculate multiple entropy measures
    const nodeTypeEntropy = this.calculateNodeTypeEntropy(structuralElements);
    const depthEntropy = this.calculateDepthDistributionEntropy(structuralElements);
    const complexityEntropy = this.calculateComplexityDistributionEntropy(structuralElements);
    const relationshipEntropy = this.calculateRelationshipEntropy(semanticData);
    // Combine entropies with weights
    const weights = {
      nodeType: 0.3,
      depth: 0.2,
      complexity: 0.3,
      relationship: 0.2
    };
    const weightedEntropy = 
      nodeTypeEntropy * weights.nodeType +
      depthEntropy * weights.depth +
      complexityEntropy * weights.complexity +
      relationshipEntropy * weights.relationship;
    return weightedEntropy;
  }
  private extractStructuralElements(semanticData: SemanticData): StructuralElement[] {
    const elements: StructuralElement[] = [];
    for (const [id, symbol] of semanticData.symbols) {
      const depth = this.calculateSymbolDepth(symbol, semanticData);
      const complexity = this.calculateSymbolComplexity(symbol, semanticData);
      const connections = (semanticData.relationships.get(id) || []).length;
      elements.push({
        id,
        type: symbol.kind,
        depth,
        complexity,
        connections,
        size: (symbol.endLine || symbol.line) - symbol.line
      });
    }
    return elements;
  }
  private calculateNodeTypeEntropy(elements: StructuralElement[]): number {
    const typeCounts = new Map<string, number>();
    for (const element of elements) {
      typeCounts.set(element.type, (typeCounts.get(element.type) || 0) + 1);
    }
    return this.calculateEntropyFromDistribution(typeCounts, elements.length);
  }
  private calculateDepthDistributionEntropy(elements: StructuralElement[]): number {
    const depthCounts = new Map<number, number>();
    for (const element of elements) {
      depthCounts.set(element.depth, (depthCounts.get(element.depth) || 0) + 1);
    }
    return this.calculateEntropyFromDistribution(depthCounts, elements.length);
  }
  private calculateComplexityDistributionEntropy(elements: StructuralElement[]): number {
    // Bin complexities to create distribution
    const complexityBins = new Map<number, number>();
    for (const element of elements) {
      const bin = Math.floor(element.complexity / 5) * 5; // 5-unit bins
      complexityBins.set(bin, (complexityBins.get(bin) || 0) + 1);
    }
    return this.calculateEntropyFromDistribution(complexityBins, elements.length);
  }
  private calculateRelationshipEntropy(semanticData: SemanticData): number {
    const degreeCounts = new Map<number, number>();
    let totalNodes = 0;
    // Count in-degree and out-degree distributions
    const inDegrees = new Map<string, number>();
    const outDegrees = new Map<string, number>();
    for (const [from, targets] of semanticData.relationships) {
      outDegrees.set(from, targets.length);
      for (const target of targets) {
        inDegrees.set(target, (inDegrees.get(target) || 0) + 1);
      }
    }
    // Combine degree information
    const allNodes = new Set([...semanticData.symbols.keys()]);
    for (const node of allNodes) {
      const totalDegree = (inDegrees.get(node) || 0) + (outDegrees.get(node) || 0);
      degreeCounts.set(totalDegree, (degreeCounts.get(totalDegree) || 0) + 1);
      totalNodes++;
    }
    return this.calculateEntropyFromDistribution(degreeCounts, totalNodes);
  }
  private calculateEntropyFromDistribution<T>(distribution: Map<T, number>, total: number): number {
    if (total === 0) return 0;
    let entropy = 0;
    for (const count of distribution.values()) {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    }
    // Normalize by maximum possible entropy
    const maxEntropy = Math.log2(distribution.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }
  private calculateSymbolDepth(symbol: HarmonicSymbol, semanticData: SemanticData): number {
    // Calculate structural depth based on multiple factors
    let depth = 0;
    // File path depth
    const pathDepth = (symbol.filePath.match(/\//g) || []).length;
    depth += pathDepth;
    // Container nesting depth
    if (symbol.containerName) {
      depth += 1;
      // Check if container is itself nested
      const container = Array.from(semanticData.symbols.values())
        .find(s => s.name === symbol.containerName);
      if (container && container.containerName) {
        depth += 1; // Add additional depth for nested containers
      }
    }
    // Relationship chain depth (how deep in call chains)
    const chainDepth = this.calculateMaxChainDepth(symbol.id, semanticData);
    depth += Math.floor(Math.log2(chainDepth + 1));
    return depth;
  }
  private calculateSymbolComplexity(symbol: HarmonicSymbol, semanticData: SemanticData): number {
    // Calculate complexity based on multiple structural factors
    let complexity = 1;
    // Size complexity
    const size = (symbol.endLine || symbol.line) - symbol.line;
    complexity += Math.log2(size + 1);
    // Relationship complexity
    const relationships = semanticData.relationships.get(symbol.id) || [];
    complexity += Math.sqrt(relationships.length);
    // Cyclomatic complexity approximation (based on symbol type)
    if (symbol.kind === 'function' || symbol.kind === 'method') {
      complexity += 2; // Base complexity for functions
      // Add complexity for each relationship (approximating branches)
      complexity += relationships.length * 0.5;
    }
    // Interface complexity
    if (symbol.kind === 'interface' || symbol.kind === 'class') {
      const members = Array.from(semanticData.symbols.values())
        .filter(s => s.containerName === symbol.name);
      complexity += Math.log2(members.length + 1);
    }
    return complexity;
  }
  private calculateMaxChainDepth(symbolId: string, semanticData: SemanticData, visited = new Set<string>()): number {
    if (visited.has(symbolId)) return 0;
    visited.add(symbolId);
    const relationships = semanticData.relationships.get(symbolId) || [];
    if (relationships.length === 0) return 0;
    let maxDepth = 0;
    for (const targetId of relationships) {
      const depth = 1 + this.calculateMaxChainDepth(targetId, semanticData, visited);
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
  }
  private calculateStructuralEntropy(semanticData: SemanticData): number {
    // Entropy of structural patterns
    const patterns = new Map<string, number>();
    // Analyze file structure patterns
    for (const file of semanticData.structure.files) {
      const depth = file.split('/').length;
      const pattern = `depth:${depth}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    // Analyze module patterns
    for (const module of semanticData.structure.modules) {
      const symbolsInModule = Array.from(semanticData.symbols.values())
        .filter(s => s.filePath.includes(module)).length;
      const pattern = `module_size:${Math.floor(symbolsInModule / 5) * 5}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    // Calculate entropy
    const total = Array.from(patterns.values()).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    let entropy = 0;
    for (const count of patterns.values()) {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }
  private calculateRedundancy(semanticData: SemanticData): number {
    // Measure code redundancy
    const signatures = new Map<string, number>();
    // Create signatures for symbols
    for (const symbol of semanticData.symbols.values()) {
      const signature = `${symbol.kind}:${symbol.name.replace(/\d+$/, 'N')}:${
        Math.floor((symbol.endLine - symbol.line) / 5) * 5
      }`;
      signatures.set(signature, (signatures.get(signature) || 0) + 1);
    }
    // Calculate redundancy ratio
    const totalSymbols = semanticData.symbols.size;
    const uniquePatterns = signatures.size;
    if (totalSymbols === 0) return 0;
    const redundancy = 1 - (uniquePatterns / totalSymbols);
    return Math.max(0, Math.min(1, redundancy));
  }
  private calculateMutualInformation(semanticData: SemanticData): number {
    // Calculate mutual information between modules
    if (semanticData.structure.modules.length < 2) return 0;
    // Create module dependency matrix
    const moduleDeps = new Map<string, Map<string, number>>();
    for (const [from, targets] of semanticData.relationships) {
      const fromSymbol = semanticData.symbols.get(from);
      if (!fromSymbol) continue;
      const fromModule = this.getModuleForSymbol(fromSymbol, semanticData);
      if (!fromModule) continue;
      if (!moduleDeps.has(fromModule)) {
        moduleDeps.set(fromModule, new Map());
      }
      for (const target of targets) {
        const targetSymbol = semanticData.symbols.get(target);
        if (!targetSymbol) continue;
        const targetModule = this.getModuleForSymbol(targetSymbol, semanticData);
        if (!targetModule || targetModule === fromModule) continue;
        const deps = moduleDeps.get(fromModule)!;
        deps.set(targetModule, (deps.get(targetModule) || 0) + 1);
      }
    }
    // Calculate mutual information
    const totalDeps = Array.from(moduleDeps.values())
      .reduce((sum, deps) => sum + Array.from(deps.values()).reduce((s, c) => s + c, 0), 0);
    if (totalDeps === 0) return 0;
    let mutualInfo = 0;
    for (const [moduleA, deps] of moduleDeps) {
      for (const [moduleB, count] of deps) {
        const pAB = count / totalDeps;
        const pA = Array.from(moduleDeps.values())
          .reduce((sum, d) => sum + (d.get(moduleB) || 0), 0) / totalDeps;
        const pB = (moduleDeps.get(moduleB)?.size || 0) / semanticData.structure.modules.length;
        if (pAB > 0 && pA > 0 && pB > 0) {
          mutualInfo += pAB * Math.log2(pAB / (pA * pB));
        }
      }
    }
    return Math.max(0, mutualInfo);
  }
  private approximateKolmogorovComplexity(semanticData: SemanticData): {
    ratio: number;
    entropy: number;
    method: string;
  } {
    // Approximate using simple compression simulation
    const codeString = this.serializeCodeStructure(semanticData);
    const originalSize = codeString.length;
    if (originalSize === 0) {
      return { ratio: 0, entropy: 0, method: 'empty' };
    }
    // Simulate LZ77 compression
    const compressed = this.simulateLZ77Compression(codeString);
    const compressedSize = compressed.length;
    const ratio = compressedSize / originalSize;
    const entropy = -Math.log2(ratio);
    return {
      ratio,
      entropy,
      method: 'LZ77'
    };
  }
  private calculateMinimumDescriptionLength(semanticData: SemanticData): {
    length: number;
    elements: number;
    efficiency: number;
  } {
    // MDL = model complexity + data complexity given model
    const elements = semanticData.symbols.size;
    if (elements === 0) return { length: 0, elements: 0, efficiency: 0 };
    // Model complexity: describe the pattern types
    const patternTypes = new Set<string>();
    for (const symbol of semanticData.symbols.values()) {
      patternTypes.add(symbol.kind);
    }
    const modelBits = patternTypes.size * Math.log2(elements);
    // Data complexity: describe instances given patterns
    let dataBits = 0;
    const typeCount = new Map<string, number>();
    for (const symbol of semanticData.symbols.values()) {
      typeCount.set(symbol.kind, (typeCount.get(symbol.kind) || 0) + 1);
    }
    for (const [type, count] of typeCount) {
      if (count > 0) {
        dataBits += count * Math.log2(elements / count);
      }
    }
    const totalBits = modelBits + dataBits;
    const naiveBits = elements * Math.log2(elements);
    const efficiency = 1 - (totalBits / naiveBits);
    return {
      length: totalBits,
      elements,
      efficiency
    };
  }
  private calculateLempelZivComplexity(semanticData: SemanticData): {
    complexity: number;
    normalizedComplexity: number;
  } {
    // Convert code structure to string
    const sequence = this.createSymbolSequence(semanticData);
    if (sequence.length === 0) return { complexity: 0, normalizedComplexity: 0 };
    // LZ complexity calculation
    const patterns = new Set<string>();
    let i = 0;
    let complexity = 0;
    while (i < sequence.length) {
      let length = 1;
      let found = false;
      // Find longest substring not seen before
      while (i + length <= sequence.length) {
        const substring = sequence.slice(i, i + length);
        if (!patterns.has(substring)) {
          patterns.add(substring);
          complexity++;
          i += length;
          found = true;
          break;
        }
        length++;
      }
      if (!found) {
        i++;
      }
    }
    // Normalize by theoretical maximum
    const n = sequence.length;
    const maxComplexity = n / Math.log2(n);
    const normalizedComplexity = complexity / maxComplexity;
    return {
      complexity,
      normalizedComplexity: Math.min(1, normalizedComplexity)
    };
  }
  private analyzeStructureVsRandomness(semanticData: SemanticData): {
    structureRatio: number;
    randomnessRatio: number;
    effectiveComplexity: number;
  } {
    // Identify structured patterns
    const structuredPatterns = new Set<string>();
    const randomElements = new Set<string>();
    // Check for repeated patterns (structure)
    const patternCounts = new Map<string, number>();
    for (const symbol of semanticData.symbols.values()) {
      const pattern = `${symbol.kind}:${symbol.name.replace(/\d+$/, '')}`;
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }
    // Patterns that appear multiple times are structured
    let totalCount = 0;
    for (const [pattern, count] of patternCounts) {
      totalCount += count;
      if (count > 2) {
        structuredPatterns.add(pattern);
      } else {
        randomElements.add(pattern);
      }
    }
    const total = structuredPatterns.size + randomElements.size;
    if (total === 0) return { structureRatio: 0, randomnessRatio: 0, effectiveComplexity: 0 };
    // For purely structured code, we need to look at actual diversity
    const uniquePatterns = patternCounts.size;
    const totalSymbols = semanticData.symbols.size;
    let structureRatio: number;
    let randomnessRatio: number;
    if (randomElements.size === 0 && structuredPatterns.size > 0) {
      // Purely structured - calculate randomness from diversity
      const diversity = uniquePatterns / Math.max(totalSymbols, 1);
      structureRatio = 1 - diversity;
      randomnessRatio = diversity;
    } else {
      structureRatio = structuredPatterns.size / total;
      randomnessRatio = randomElements.size / total;
    }
    // Effective complexity is highest when there's a balance
    const effectiveComplexity = 2 * structureRatio * randomnessRatio;
    return {
      structureRatio,
      randomnessRatio,
      effectiveComplexity
    };
  }
  private detectMeaningfulComplexity(semanticData: SemanticData): {
    count: number;
    averageStrength: number;
    patterns: string[];
  } {
    const meaningfulPatterns: Array<{ pattern: string; strength: number }> = [];
    // 1. Design patterns (highly meaningful)
    const designPatterns = this.detectDesignPatterns(semanticData);
    for (const pattern of designPatterns) {
      meaningfulPatterns.push({ pattern: pattern.name, strength: pattern.confidence });
    }
    // 2. Architectural patterns
    const archPatterns = this.detectArchitecturalPatterns(semanticData);
    for (const pattern of archPatterns) {
      meaningfulPatterns.push({ pattern: pattern.name, strength: pattern.strength });
    }
    // 3. Domain patterns
    const domainPatterns = this.detectDomainPatterns(semanticData);
    for (const pattern of domainPatterns) {
      meaningfulPatterns.push({ pattern: pattern.name, strength: pattern.relevance });
    }
    // 4. Chaotic patterns with underlying structure (highest effective complexity)
    const chaoticPatterns = this.detectChaoticPatterns(semanticData);
    for (const pattern of chaoticPatterns) {
      meaningfulPatterns.push({ pattern: pattern.name, strength: pattern.strength });
    }
    const count = meaningfulPatterns.length;
    const averageStrength = count > 0
      ? meaningfulPatterns.reduce((sum, p) => sum + p.strength, 0) / count
      : 0;
    return {
      count,
      averageStrength,
      patterns: meaningfulPatterns.map(p => p.pattern)
    };
  }
  private calculateLogicalDepth(semanticData: SemanticData): {
    depth: number;
    computationalSteps: number;
  } {
    // Logical depth = computational steps to generate structure
    let depth = 0;
    let steps = 0;
    // 1. Dependency chain depth
    const depthMap = new Map<string, number>();
    for (const [id, symbol] of semanticData.symbols) {
      if (!semanticData.relationships.has(id)) {
        depthMap.set(id, 1);
      }
    }
    // Calculate depth recursively
    const calculateDepth = (id: string, visited: Set<string> = new Set()): number => {
      if (depthMap.has(id)) return depthMap.get(id)!;
      if (visited.has(id)) return 1; // Cycle
      visited.add(id);
      const deps = semanticData.relationships.get(id) || [];
      let maxDepth = 0;
      for (const dep of deps) {
        const depDepth = calculateDepth(dep, new Set(visited));
        maxDepth = Math.max(maxDepth, depDepth);
        steps++;
      }
      const myDepth = maxDepth + 1;
      depthMap.set(id, myDepth);
      return myDepth;
    };
    for (const id of semanticData.symbols.keys()) {
      calculateDepth(id);
    }
    depth = Math.max(...depthMap.values(), 0);
    return {
      depth,
      computationalSteps: steps
    };
  }
  private serializeCodeStructure(semanticData: SemanticData): string {
    // Convert code structure to string for compression
    const parts: string[] = [];
    for (const symbol of semanticData.symbols.values()) {
      parts.push(`${symbol.kind}:${symbol.name}:${symbol.endLine - symbol.line}`);
    }
    for (const [from, targets] of semanticData.relationships) {
      parts.push(`rel:${from}:${targets.join(',')}`);
    }
    return parts.join('|');
  }
  private simulateLZ77Compression(input: string): string {
    // Simple LZ77 compression simulation
    const window = 256;
    const compressed: string[] = [];
    let i = 0;
    while (i < input.length) {
      let maxLength = 0;
      let maxOffset = 0;
      // Search for matches in sliding window
      const start = Math.max(0, i - window);
      for (let j = start; j < i; j++) {
        let length = 0;
        while (i + length < input.length && 
               input[j + length] === input[i + length] && 
               length < 255) {
          length++;
        }
        if (length > maxLength) {
          maxLength = length;
          maxOffset = i - j;
        }
      }
      if (maxLength > 3) {
        compressed.push(`<${maxOffset},${maxLength}>`);
        i += maxLength;
      } else {
        compressed.push(input[i]);
        i++;
      }
    }
    return compressed.join('');
  }
  private createSymbolSequence(semanticData: SemanticData): string {
    // Create a sequence representing the code structure
    const symbols = Array.from(semanticData.symbols.values())
      .sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line);
    return symbols.map(s => {
      switch (s.kind) {
        case 'class': return 'C';
        case 'function': return 'F';
        case 'method': return 'M';
        case 'interface': return 'I';
        case 'property': return 'P';
        case 'variable': return 'V';
        default: return 'X';
      }
    }).join('');
  }
  private getModuleForSymbol(symbol: HarmonicSymbol, semanticData: SemanticData): string | null {
    for (const module of semanticData.structure.modules) {
      if (symbol.filePath.includes(module)) {
        return module;
      }
    }
    const pathParts = symbol.filePath.split('/');
    return pathParts.length > 1 ? pathParts[0] : null;
  }
  private detectDesignPatterns(semanticData: SemanticData): Array<{
    name: string;
    confidence: number;
  }> {
    const patterns: Array<{ name: string; confidence: number }> = [];
    // Simple pattern detection based on naming and structure
    const symbolNames = Array.from(semanticData.symbols.values()).map(s => s.name);
    // Singleton pattern
    if (symbolNames.some(n => n.toLowerCase().includes('singleton') || 
                            n.toLowerCase().includes('instance'))) {
      patterns.push({ name: 'Singleton', confidence: 0.8 });
    }
    // Factory pattern
    if (symbolNames.some(n => n.toLowerCase().includes('factory') || 
                            n.toLowerCase().includes('create'))) {
      patterns.push({ name: 'Factory', confidence: 0.8 });
    }
    // Observer pattern
    if (symbolNames.some(n => n.toLowerCase().includes('observer') || 
                            n.toLowerCase().includes('listener'))) {
      patterns.push({ name: 'Observer', confidence: 0.8 });
    }
    return patterns;
  }
  private detectArchitecturalPatterns(semanticData: SemanticData): Array<{
    name: string;
    strength: number;
  }> {
    const patterns: Array<{ name: string; strength: number }> = [];
    // Layered architecture
    const layers = new Set<string>();
    for (const file of semanticData.structure.files) {
      if (file.includes('controller')) layers.add('controller');
      if (file.includes('service')) layers.add('service');
      if (file.includes('repository') || file.includes('dao')) layers.add('data');
      if (file.includes('model') || file.includes('entity')) layers.add('model');
    }
    if (layers.size >= 3) {
      patterns.push({ name: 'Layered Architecture', strength: layers.size / 4 });
    }
    // Microservices
    if (semanticData.structure.modules.length > 5 && 
        semanticData.structure.modules.some(m => m.includes('service'))) {
      patterns.push({ name: 'Microservices', strength: 0.7 });
    }
    return patterns;
  }
  private detectDomainPatterns(semanticData: SemanticData): Array<{
    name: string;
    relevance: number;
  }> {
    const patterns: Array<{ name: string; relevance: number }> = [];
    // Domain-driven design patterns
    const domainTerms = ['aggregate', 'entity', 'valueobject', 'repository', 'domain'];
    let domainCount = 0;
    for (const symbol of semanticData.symbols.values()) {
      if (domainTerms.some(term => symbol.name.toLowerCase().includes(term))) {
        domainCount++;
      }
    }
    if (domainCount > 5) {
      patterns.push({ 
        name: 'Domain-Driven Design', 
        relevance: Math.min(domainCount / 20, 1) 
      });
    }
    return patterns;
  }
  private detectChaoticPatterns(semanticData: SemanticData): Array<{
    name: string;
    strength: number;
  }> {
    const patterns: Array<{ name: string; strength: number }> = [];
    // Detect patterns that exhibit chaos with underlying structure
    // (like logistic map, Henon system, etc.)
    // 1. Non-linear growth patterns
    const symbolSizes = Array.from(semanticData.symbols.values())
      .map(s => (s.endLine || s.line) - s.line)
      .filter(size => size > 0);
    if (symbolSizes.length > 10) {
      // Check for non-linear growth (characteristic of chaotic systems)
      const growthRates: number[] = [];
      for (let i = 1; i < symbolSizes.length; i++) {
        if (symbolSizes[i-1] !== 0) {
          growthRates.push(symbolSizes[i] / symbolSizes[i-1]);
        }
      }
      // High variance in growth rates suggests chaotic behavior
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      const variance = growthRates.reduce((sum, rate) => 
        sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
      if (variance > 1.0 && avgGrowth > 0.5 && avgGrowth < 4.0) {
        patterns.push({
          name: 'Logistic Map Pattern',
          strength: Math.min(variance / 2, 1)
        });
      }
    }
    // 2. Strange attractor patterns in relationships
    const attractorStrength = this.detectStrangeAttractor(semanticData);
    if (attractorStrength > 0.5) {
      patterns.push({
        name: 'Strange Attractor',
        strength: attractorStrength
      });
    }
    // 3. Bifurcation patterns
    const bifurcationScore = this.detectBifurcationPatterns(semanticData);
    if (bifurcationScore > 0.5) {
      patterns.push({
        name: 'Bifurcation Pattern',
        strength: bifurcationScore
      });
    }
    // 4. Self-organized criticality
    const criticalityScore = this.detectSelfOrganizedCriticality(semanticData);
    if (criticalityScore > 0.5) {
      patterns.push({
        name: 'Self-Organized Criticality',
        strength: criticalityScore
      });
    }
    return patterns;
  }
  private detectStrangeAttractor(semanticData: SemanticData): number {
    // Detect if relationships form strange attractor-like patterns
    const nodes = new Map<string, { inDegree: number; outDegree: number }>();
    // Calculate in/out degrees
    for (const [source, targets] of semanticData.relationships) {
      if (!nodes.has(source)) {
        nodes.set(source, { inDegree: 0, outDegree: 0 });
      }
      nodes.get(source)!.outDegree += targets.length;
      for (const target of targets) {
        if (!nodes.has(target)) {
          nodes.set(target, { inDegree: 0, outDegree: 0 });
        }
        nodes.get(target)!.inDegree += 1;
      }
    }
    // Look for nodes that attract many connections but have complex outgoing patterns
    let attractorNodes = 0;
    let totalNodes = nodes.size;
    for (const [_, degrees] of nodes) {
      // High in-degree with moderate out-degree suggests attractor behavior
      if (degrees.inDegree > 5 && degrees.outDegree > 0 && degrees.outDegree < degrees.inDegree) {
        attractorNodes++;
      }
    }
    return totalNodes > 0 ? attractorNodes / totalNodes : 0;
  }
  private detectBifurcationPatterns(semanticData: SemanticData): number {
    // Detect bifurcation: where one path splits into multiple paths
    let bifurcations = 0;
    let totalBranches = 0;
    for (const [source, targets] of semanticData.relationships) {
      if (targets.length > 1) {
        // Count as bifurcation if targets lead to divergent paths
        const divergentPaths = new Set<string>();
        for (const target of targets) {
          const secondLevel = semanticData.relationships.get(target) || [];
          for (const second of secondLevel) {
            divergentPaths.add(second);
          }
        }
        if (divergentPaths.size >= targets.length) {
          bifurcations++;
        }
        totalBranches++;
      }
    }
    return totalBranches > 0 ? bifurcations / totalBranches : 0;
  }
  private detectSelfOrganizedCriticality(semanticData: SemanticData): number {
    // Detect power-law distributions characteristic of self-organized critical systems
    const componentSizes = new Map<string, number>();
    // Group symbols by component/module
    for (const symbol of semanticData.symbols.values()) {
      const component = symbol.filePath.split('/')[0];
      componentSizes.set(component, (componentSizes.get(component) || 0) + 1);
    }
    const sizes = Array.from(componentSizes.values()).sort((a, b) => b - a);
    if (sizes.length < 5) return 0;
    // Check for power-law distribution
    // In a power law, log(rank) vs log(size) should be approximately linear
    let correlation = 0;
    const logRanks = sizes.map((_, i) => Math.log(i + 1));
    const logSizes = sizes.map(s => Math.log(s));
    // Simple correlation check
    const avgLogRank = logRanks.reduce((a, b) => a + b, 0) / logRanks.length;
    const avgLogSize = logSizes.reduce((a, b) => a + b, 0) / logSizes.length;
    let numerator = 0;
    let denomRank = 0;
    let denomSize = 0;
    for (let i = 0; i < logRanks.length; i++) {
      const rankDiff = logRanks[i] - avgLogRank;
      const sizeDiff = logSizes[i] - avgLogSize;
      numerator += rankDiff * sizeDiff;
      denomRank += rankDiff * rankDiff;
      denomSize += sizeDiff * sizeDiff;
    }
    if (denomRank > 0 && denomSize > 0) {
      correlation = Math.abs(numerator / Math.sqrt(denomRank * denomSize));
    }
    return correlation;
  }
  private calculateConfidence(evidenceCount: number, maxEvidence: number): number {
    return Math.min(evidenceCount / maxEvidence, 1);
  }
}