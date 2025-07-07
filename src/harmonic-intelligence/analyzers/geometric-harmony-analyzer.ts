/**
 * Geometric Harmony Pattern Analyzer
 * Detects sacred geometry, symmetry groups, and Platonic solid relationships in code
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
interface GeometricMetrics {
  eulerCharacteristic: number;
  symmetryGroups: SymmetryGroup[];
  platonicRelationships: PlatonicRelationship[];
  vesicaPiscisRatios: number[];
}
interface SymmetryGroup {
  type: 'rotational' | 'reflection' | 'dihedral';
  order: number;
  elements: string[];
  confidence: number;
}
interface PlatonicRelationship {
  solid: 'tetrahedron' | 'cube' | 'octahedron' | 'dodecahedron' | 'icosahedron';
  vertices: number;
  edges: number;
  faces: number;
  dualRelationship?: string;
  volumeSurfaceRatio: number;
}
export class GeometricHarmonyAnalyzer extends BasePatternAnalyzer {
  protected readonly logger = new Logger('GeometricHarmonyAnalyzer');
  protected readonly category = PatternCategory.GEOMETRIC_HARMONY;
  private readonly SQRT_3 = Math.sqrt(3); // Vesica Piscis ratio
  private readonly PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio for dodecahedron/icosahedron
  constructor() {
    super();
  }
  async analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>> {
    const results = new Map<PatternType, PatternScore>();
    // Run all geometric analyses
    const [sacredGeometry, symmetryGroups, platonicSolids] = await Promise.all([
      this.detectSacredGeometry(semanticData),
      this.detectSymmetryGroups(semanticData),
      this.detectPlatonicSolids(semanticData)
    ]);
    results.set(PatternType.SACRED_GEOMETRY, sacredGeometry);
    results.set(PatternType.SYMMETRY_GROUPS, symmetryGroups);
    results.set(PatternType.PLATONIC_SOLIDS, platonicSolids);
    return results;
  }
  private async detectSacredGeometry(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Detect Platonic solid relationships in class hierarchies
    const classHierarchies = this.extractClassHierarchies(semanticData);
    for (const hierarchy of classHierarchies) {
      const eulerCheck = this.checkEulerFormula(hierarchy);
      if (eulerCheck.isValid) {
        evidence.push({
          type: 'euler_formula',
          description: `Class hierarchy satisfies Euler formula: V(${eulerCheck.vertices}) - E(${eulerCheck.edges}) + F(${eulerCheck.faces}) = 2`,
          weight: 0.3,
          value: eulerCheck.characteristic
        });
        totalScore += 0.3;
      }
      weightSum += 0.3;
    }
    // 2. Find vesica piscis ratios (√3)
    const vesicaRatios = this.findVesicaPiscisRatios(semanticData);
    for (const ratio of vesicaRatios) {
      if (Math.abs(ratio.value - this.SQRT_3) < 0.1) {
        evidence.push({
          type: 'vesica_piscis',
          description: `Vesica Piscis ratio found: ${ratio.value.toFixed(3)} ≈ √3`,
          weight: 0.25,
          value: ratio.value
        });
        totalScore += 0.25 * (1 - Math.abs(ratio.value - this.SQRT_3) / this.SQRT_3);
      }
      weightSum += 0.25;
    }
    // 3. Detect sacred proportions in module structure
    const moduleProportions = this.analyzeModuleProportions(semanticData);
    for (const proportion of moduleProportions) {
      if (this.isSacredProportion(proportion.ratio)) {
        evidence.push({
          type: 'sacred_proportion',
          description: `Sacred proportion in modules: ${proportion.description}`,
          weight: 0.2,
          value: proportion.ratio
        });
        totalScore += 0.2 * (1 - Math.abs(proportion.ratio - this.PHI) / this.PHI);
      }
      weightSum += 0.2;
    }
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.SACRED_GEOMETRY,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  private async detectSymmetryGroups(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Rotational symmetry in method patterns
    const rotationalSymmetries = this.findRotationalSymmetry(semanticData);
    for (const symmetry of rotationalSymmetries) {
      evidence.push({
        type: 'rotational_symmetry',
        description: `${symmetry.order}-fold rotational symmetry in ${symmetry.location}`,
        weight: 0.3,
        value: symmetry.order
      });
      totalScore += 0.3 * (symmetry.confidence);
      weightSum += 0.3;
    }
    // 2. Reflection symmetry in code structure
    const reflectionSymmetries = this.findReflectionSymmetry(semanticData);
    for (const symmetry of reflectionSymmetries) {
      evidence.push({
        type: 'reflection_symmetry',
        description: `Reflection symmetry found: ${symmetry.description}`,
        weight: 0.3,
        value: symmetry.confidence
      });
      totalScore += 0.3 * symmetry.confidence;
      weightSum += 0.3;
    }
    // 3. Dihedral group classification
    const dihedralGroups = this.classifyDihedralGroups(semanticData);
    for (const group of dihedralGroups) {
      evidence.push({
        type: 'dihedral_group',
        description: `Dihedral group D${group.order} structure detected`,
        weight: 0.4,
        value: group.order
      });
      totalScore += 0.4 * (group.order >= 3 ? 1 : 0.5);
      weightSum += 0.4;
    }
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.SYMMETRY_GROUPS,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  private async detectPlatonicSolids(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Detect dual relationships in architecture
    const dualRelationships = this.findDualRelationships(semanticData);
    for (const dual of dualRelationships) {
      evidence.push({
        type: 'dual_relationship',
        description: `${dual.solid1}-${dual.solid2} duality found in architecture`,
        weight: 0.35,
        value: dual.confidence
      });
      totalScore += 0.35 * dual.confidence;
      weightSum += 0.35;
    }
    // 2. Volume/surface ratios matching Platonic solids
    const volumeSurfaceRatios = this.analyzeVolumeSurfaceRatios(semanticData);
    for (const ratio of volumeSurfaceRatios) {
      const matchedSolid = this.matchPlatonicRatio(ratio.value);
      if (matchedSolid) {
        evidence.push({
          type: 'platonic_ratio',
          description: `${matchedSolid} volume/surface ratio detected: ${ratio.value.toFixed(3)}`,
          weight: 0.3,
          value: ratio.value
        });
        totalScore += 0.3;
      }
      weightSum += 0.3;
    }
    // 3. 3D structural analysis
    const structures3D = this.analyze3DStructures(semanticData);
    for (const structure of structures3D) {
      if (this.isPlatonicStructure(structure)) {
        evidence.push({
          type: '3d_structure',
          description: `${structure.type} 3D structure with ${structure.vertices} vertices`,
          weight: 0.35,
          value: structure.completeness
        });
        totalScore += 0.35 * structure.completeness;
      }
      weightSum += 0.35;
    }
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.PLATONIC_SOLIDS,
      category: this.category,
      score: finalScore,
      confidence: this.calculateConfidence(evidence),
      detected: finalScore > 0.3,
      evidence,
    };
  }
  // Helper methods for Sacred Geometry
  private extractClassHierarchies(semanticData: SemanticData): any[] {
    const hierarchies = [];
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class');
    for (const cls of classes) {
      const hierarchy = this.buildHierarchy(cls, semanticData);
      if (hierarchy.depth > 1) {
        hierarchies.push(hierarchy);
      }
    }
    return hierarchies;
  }
  private buildHierarchy(rootClass: HarmonicSymbol, semanticData: SemanticData): any {
    const visited = new Set<string>();
    const nodes = new Set<string>();
    const edges = new Set<string>();
    const traverse = (symbolId: string, depth: number = 0) => {
      if (visited.has(symbolId)) return depth;
      visited.add(symbolId);
      nodes.add(symbolId);
      const relations = semanticData.relationships.get(symbolId) || [];
      let maxDepth = depth;
      for (const relation of relations) {
        edges.add(`${symbolId}-${relation}`);
        const childDepth = traverse(relation, depth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
      return maxDepth;
    };
    const depth = traverse(rootClass.id);
    return {
      rootClass: rootClass.name,
      nodes: Array.from(nodes),
      edges: Array.from(edges),
      vertices: nodes.size,
      edgeCount: edges.size,
      depth
    };
  }
  private checkEulerFormula(hierarchy: any): any {
    // For a graph to satisfy Euler's formula, we need to identify faces
    // In a class hierarchy, faces can be cycles + 1 (outer face)
    const vertices = hierarchy.vertices;
    const edges = hierarchy.edgeCount;
    // Simple cycle detection for faces
    const cycles = this.countCycles(hierarchy.nodes, hierarchy.edges);
    const faces = cycles + 1; // +1 for outer face
    const characteristic = vertices - edges + faces;
    return {
      vertices,
      edges,
      faces,
      characteristic,
      isValid: Math.abs(characteristic - 2) < 0.1
    };
  }
  private countCycles(nodes: string[], edges: string[]): number {
    // Simplified cycle counting - in practice would use more sophisticated algorithm
    // For now, estimate based on edge/node ratio
    const edgeCount = edges.length;
    const nodeCount = nodes.length;
    if (edgeCount < nodeCount) return 0;
    return Math.floor(edgeCount - nodeCount + 1);
  }
  private findVesicaPiscisRatios(semanticData: SemanticData): any[] {
    const ratios = [];
    // Look for √3 ratios in various code metrics
    const files = semanticData.structure.files;
    // Check file count ratios between directories
    const directoryCounts = new Map<string, number>();
    for (const file of files) {
      const dir = file.substring(0, file.lastIndexOf('/'));
      directoryCounts.set(dir, (directoryCounts.get(dir) || 0) + 1);
    }
    const dirs = Array.from(directoryCounts.entries());
    for (let i = 0; i < dirs.length - 1; i++) {
      for (let j = i + 1; j < dirs.length; j++) {
        const ratio = Math.max(dirs[i][1], dirs[j][1]) / Math.min(dirs[i][1], dirs[j][1]);
        ratios.push({
          value: ratio,
          location: `${dirs[i][0]} vs ${dirs[j][0]}`
        });
      }
    }
    // Check function length ratios
    const functions = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'function' || s.kind === 'method');
    for (let i = 0; i < Math.min(functions.length - 1, 20); i++) {
      const length1 = (functions[i].endLine || 0) - functions[i].line;
      const length2 = (functions[i + 1].endLine || 0) - functions[i + 1].line;
      if (length1 > 0 && length2 > 0) {
        const ratio = Math.max(length1, length2) / Math.min(length1, length2);
        ratios.push({
          value: ratio,
          location: `${functions[i].name} vs ${functions[i + 1].name}`
        });
      }
    }
    return ratios;
  }
  private analyzeModuleProportions(semanticData: SemanticData): any[] {
    const proportions = [];
    const modules = semanticData.structure.modules;
    if (modules.length >= 2) {
      // Count symbols per module
      const moduleCounts = new Map<string, number>();
      for (const [_, symbol] of semanticData.symbols) {
        const moduleName = this.extractModuleName(symbol.filePath);
        if (moduleName && modules.includes(moduleName)) {
          moduleCounts.set(moduleName, (moduleCounts.get(moduleName) || 0) + 1);
        }
      }
      // If no counts found by path extraction, count by module names directly
      if (moduleCounts.size === 0) {
        // Count symbols that belong to each module
        for (const module of modules) {
          const count = Array.from(semanticData.symbols.values())
            .filter(s => s.filePath.includes(`/${module}/`) || s.filePath.includes(`${module}/`))
            .length;
          if (count > 0) {
            moduleCounts.set(module, count);
          }
        }
      }
      const counts = Array.from(moduleCounts.values()).sort((a, b) => b - a);
      for (let i = 0; i < counts.length - 1; i++) {
        if (counts[i + 1] > 0) {
          const ratio = counts[i] / counts[i + 1];
          proportions.push({
            ratio,
            description: `Module size ratio ${i} to ${i + 1}: ${ratio.toFixed(3)}`
          });
        }
      }
    }
    return proportions;
  }
  private extractModuleName(filePath: string): string {
    const parts = filePath.split('/');
    if (parts.length >= 2) {
      return parts[parts.indexOf('src') + 1] || parts[1];
    }
    return '';
  }
  private isSacredProportion(ratio: number): boolean {
    const sacredRatios = [
      this.PHI,           // Golden ratio
      this.SQRT_3,        // Vesica Piscis
      Math.sqrt(2),       // Sacred root 2
      Math.PI / 2,        // Pi/2
      2 / this.PHI,       // Inverse golden ratio
      Math.sqrt(5)        // Sacred root 5
    ];
    return sacredRatios.some(sacred => Math.abs(ratio - sacred) < 0.1);
  }
  // Helper methods for Symmetry Groups
  private findRotationalSymmetry(semanticData: SemanticData): any[] {
    const symmetries = [];
    // 1. Analyze control flow graphs for rotational patterns
    const controlFlowSymmetries = this.analyzeControlFlowSymmetry(semanticData);
    symmetries.push(...controlFlowSymmetries);
    // 2. Detect cyclic dependency patterns
    const cyclicSymmetries = this.analyzeCyclicDependencies(semanticData);
    symmetries.push(...cyclicSymmetries);
    // 3. Analyze structural graph symmetries
    const graphSymmetries = this.analyzeGraphSymmetry(semanticData);
    symmetries.push(...graphSymmetries);
    // 4. Detect symmetric relationship patterns
    const relationshipSymmetries = this.analyzeRelationshipSymmetry(semanticData);
    symmetries.push(...relationshipSymmetries);
    return symmetries;
  }
  private analyzeControlFlowSymmetry(semanticData: SemanticData): any[] {
    const symmetries = [];
    // Analyze execution flows for symmetric patterns
    if (semanticData.behaviors && semanticData.behaviors.executionFlows) {
      for (const flow of semanticData.behaviors.executionFlows) {
        // Check if flow has a path property and it's an array
        if (!flow || !flow.path || !Array.isArray(flow.path)) {
          continue;
        }
        // Build adjacency matrix for the flow
        const nodes = new Set<string>();
        const edges = new Map<string, Set<string>>();
        for (const step of flow.path) {
          nodes.add(step);
        }
        // Create edges from sequential steps
        for (let i = 0; i < flow.path.length - 1; i++) {
          const from = flow.path[i];
          const to = flow.path[i + 1];
          if (!edges.has(from)) edges.set(from, new Set());
          edges.get(from)!.add(to);
        }
        // Check for rotational symmetry in the graph
        const order = this.detectGraphRotationalSymmetry(nodes, edges);
        if (order > 1) {
          symmetries.push({
            order,
            confidence: 0.8
          });
        }
      }
    }
    return symmetries;
  }
  private analyzeCyclicDependencies(semanticData: SemanticData): any[] {
    const symmetries = [];
    // Find strongly connected components (cycles)
    const cycles = this.findStronglyConnectedComponents(semanticData.relationships);
    for (const cycle of cycles) {
      if (cycle.length >= 3) {
        // Check if the cycle exhibits rotational symmetry
        const symmetryOrder = this.analyzeCycleSymmetry(cycle, semanticData);
        if (symmetryOrder > 1) {
          symmetries.push({
            order: symmetryOrder,
            confidence: 0.9
          });
        }
      }
    }
    return symmetries;
  }
  private analyzeGraphSymmetry(semanticData: SemanticData): any[] {
    const symmetries = [];
    // Build a graph of module/package relationships
    const moduleGraph = this.buildModuleGraph(semanticData);
    // Check for symmetric subgraphs
    for (const [module, connections] of moduleGraph) {
      if (connections.size >= 3) {
        // Analyze the local neighborhood for symmetry
        const localSymmetry = this.analyzeLocalGraphSymmetry(module, moduleGraph);
        if (localSymmetry.order > 1) {
          symmetries.push({
            order: localSymmetry.order,
            confidence: localSymmetry.confidence
          });
        }
      }
    }
    return symmetries;
  }
  private analyzeRelationshipSymmetry(semanticData: SemanticData): any[] {
    const symmetries = [];
    // Group symbols by their structural properties
    const symbolGroups = this.groupSymbolsByStructure(semanticData);
    for (const [groupKey, symbols] of symbolGroups) {
      if (symbols.length >= 3) {
        // Analyze relationship patterns within the group
        const relationshipMatrix = this.buildRelationshipMatrix(symbols, semanticData);
        const symmetryOrder = this.detectMatrixRotationalSymmetry(relationshipMatrix);
        if (symmetryOrder > 1) {
          symmetries.push({
            order: symmetryOrder,
            confidence: 0.85
          });
        }
      }
    }
    return symmetries;
  }
  private detectGraphRotationalSymmetry(nodes: Set<string>, edges: Map<string, Set<string>>): number {
    const nodeArray = Array.from(nodes);
    const n = nodeArray.length;
    // Check for different orders of rotational symmetry
    for (const order of [2, 3, 4, 5, 6]) {
      if (n % order !== 0) continue;
      // Try to find a rotation that preserves the graph structure
      const rotationMap = new Map<string, string>();
      const step = Math.floor(n / order);
      // Build rotation mapping
      for (let i = 0; i < n; i++) {
        const rotatedIndex = (i + step) % n;
        rotationMap.set(nodeArray[i], nodeArray[rotatedIndex]);
      }
      // Check if edges are preserved under rotation
      let isSymmetric = true;
      for (const [from, targets] of edges) {
        const rotatedFrom = rotationMap.get(from);
        if (!rotatedFrom || !edges.has(rotatedFrom)) {
          isSymmetric = false;
          break;
        }
        const rotatedTargets = edges.get(rotatedFrom)!;
        for (const target of targets) {
          const rotatedTarget = rotationMap.get(target);
          if (!rotatedTarget || !rotatedTargets.has(rotatedTarget)) {
            isSymmetric = false;
            break;
          }
        }
        if (!isSymmetric) break;
      }
      if (isSymmetric) return order;
    }
    return 1; // No rotational symmetry found
  }
  private findStronglyConnectedComponents(relationships: Map<string, string[]>): string[][] {
    // Tarjan's algorithm for finding SCCs
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const sccs: string[][] = [];
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
  private analyzeCycleSymmetry(cycle: string[], semanticData: SemanticData): number {
    // Analyze if the nodes in the cycle have symmetric properties
    const nodeProperties: Array<{ size: number; connections: number }> = [];
    for (const node of cycle) {
      const symbol = semanticData.symbols.get(node);
      if (symbol) {
        const size = (symbol.endLine || symbol.line) - symbol.line;
        const connections = (semanticData.relationships.get(node) || []).length;
        nodeProperties.push({ size, connections });
      }
    }
    // Check for rotational patterns in properties
    for (const order of [2, 3, 4, 5, 6]) {
      if (cycle.length % order !== 0) continue;
      const groupSize = cycle.length / order;
      let isSymmetric = true;
      // Compare groups
      for (let g = 1; g < order; g++) {
        for (let i = 0; i < groupSize; i++) {
          const idx1 = i;
          const idx2 = g * groupSize + i;
          if (idx2 >= nodeProperties.length) {
            isSymmetric = false;
            break;
          }
          // Check if properties are similar
          const prop1 = nodeProperties[idx1];
          const prop2 = nodeProperties[idx2];
          const sizeDiff = Math.abs(prop1.size - prop2.size) / Math.max(prop1.size, prop2.size, 1);
          const connDiff = Math.abs(prop1.connections - prop2.connections);
          if (sizeDiff > 0.3 || connDiff > 1) {
            isSymmetric = false;
            break;
          }
        }
        if (!isSymmetric) break;
      }
      if (isSymmetric) return order;
    }
    return 1;
  }
  private buildModuleGraph(semanticData: SemanticData): Map<string, Set<string>> {
    const moduleGraph = new Map<string, Set<string>>();
    // Initialize modules
    for (const module of semanticData.structure.modules) {
      moduleGraph.set(module, new Set());
    }
    // Build connections based on symbol relationships
    for (const [fromId, targets] of semanticData.relationships) {
      const fromSymbol = semanticData.symbols.get(fromId);
      if (!fromSymbol) continue;
      const fromModule = this.getSymbolModule(fromSymbol, semanticData);
      if (!fromModule) continue;
      for (const toId of targets) {
        const toSymbol = semanticData.symbols.get(toId);
        if (!toSymbol) continue;
        const toModule = this.getSymbolModule(toSymbol, semanticData);
        if (toModule && toModule !== fromModule) {
          if (!moduleGraph.has(fromModule)) {
            moduleGraph.set(fromModule, new Set());
          }
          moduleGraph.get(fromModule)!.add(toModule);
        }
      }
    }
    return moduleGraph;
  }
  private getSymbolModule(symbol: HarmonicSymbol, semanticData: SemanticData): string | null {
    for (const module of semanticData.structure.modules) {
      if (symbol.filePath.includes(`/${module}/`) || symbol.filePath.includes(`${module}/`)) {
        return module;
      }
    }
    return null;
  }
  private analyzeLocalGraphSymmetry(center: string, graph: Map<string, Set<string>>): {
    order: number;
    confidence: number;
  } {
    // Analyze the local neighborhood for symmetry
    const neighbors = Array.from(graph.get(center) || []);
    const n = neighbors.length;
    if (n < 3) return { order: 1, confidence: 0 };
    // Check if neighbors form a symmetric pattern
    for (const order of [2, 3, 4, 5, 6]) {
      if (n % order !== 0) continue;
      // Check if neighbor connections form a symmetric pattern
      const groupSize = n / order;
      let symmetryScore = 0;
      let comparisons = 0;
      for (let g = 0; g < order - 1; g++) {
        for (let i = 0; i < groupSize; i++) {
          const idx1 = g * groupSize + i;
          const idx2 = ((g + 1) % order) * groupSize + i;
          const neighbor1 = neighbors[idx1];
          const neighbor2 = neighbors[idx2];
          // Compare their connectivity patterns
          const conn1 = graph.get(neighbor1) || new Set();
          const conn2 = graph.get(neighbor2) || new Set();
          const similarity = this.calculateSetSimilarity(conn1, conn2);
          symmetryScore += similarity;
          comparisons++;
        }
      }
      const avgSymmetry = comparisons > 0 ? symmetryScore / comparisons : 0;
      if (avgSymmetry > 0.7) {
        return { order, confidence: avgSymmetry };
      }
    }
    return { order: 1, confidence: 0 };
  }
  private calculateSetSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
  private groupSymbolsByStructure(semanticData: SemanticData): Map<string, HarmonicSymbol[]> {
    const groups = new Map<string, HarmonicSymbol[]>();
    for (const symbol of semanticData.symbols.values()) {
      // Group by kind, approximate size, and structural properties
      const size = (symbol.endLine || symbol.line) - symbol.line;
      const sizeCategory = Math.floor(size / 10) * 10;
      const connections = (semanticData.relationships.get(symbol.id) || []).length;
      const connCategory = Math.floor(connections / 3) * 3;
      const key = `${symbol.kind}-size${sizeCategory}-conn${connCategory}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(symbol);
    }
    return groups;
  }
  private buildRelationshipMatrix(symbols: HarmonicSymbol[], semanticData: SemanticData): number[][] {
    const n = symbols.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      const fromRelations = semanticData.relationships.get(symbols[i].id) || [];
      for (let j = 0; j < n; j++) {
        if (i !== j && fromRelations.includes(symbols[j].id)) {
          matrix[i][j] = 1;
        }
      }
    }
    return matrix;
  }
  private detectMatrixRotationalSymmetry(matrix: number[][]): number {
    const n = matrix.length;
    if (n < 3) return 1;
    // Check for different orders of rotational symmetry
    for (const order of [2, 3, 4, 5, 6]) {
      if (n % order !== 0) continue;
      // Check if matrix has block-circulant structure
      const blockSize = n / order;
      let isSymmetric = true;
      for (let b = 0; b < order; b++) {
        const nextB = (b + 1) % order;
        // Compare blocks
        for (let i = 0; i < blockSize; i++) {
          for (let j = 0; j < blockSize; j++) {
            const val1 = matrix[b * blockSize + i][b * blockSize + j];
            const val2 = matrix[nextB * blockSize + i][nextB * blockSize + j];
            if (Math.abs(val1 - val2) > 0.1) {
              isSymmetric = false;
              break;
            }
          }
          if (!isSymmetric) break;
        }
        if (!isSymmetric) break;
      }
      if (isSymmetric) return order;
    }
    return 1;
  }
  private detectRotationalPattern(methods: HarmonicSymbol[]): any {
    // Detect n-fold rotational symmetry using discrete rotation analysis
    // Check for symmetries of order 2, 3, 4, 5, 6
    const symmetryOrders = [2, 3, 4, 5, 6];
    let bestSymmetry = null;
    let maxConfidence = 0;
    for (const n of symmetryOrders) {
      // For n-fold symmetry, elements should repeat after rotation by 2π/n
      const confidence = this.checkNFoldSymmetry(methods, n);
      if (confidence > maxConfidence && confidence > 0.6) {
        maxConfidence = confidence;
        bestSymmetry = {
          order: n,
          confidence: confidence
        };
      }
    }
    // Also check for method name patterns as a fallback
    if (!bestSymmetry || maxConfidence < 0.7) {
      const namePatternSymmetry = this.checkMethodNamePatterns(methods);
      if (namePatternSymmetry && namePatternSymmetry.confidence > maxConfidence) {
        bestSymmetry = namePatternSymmetry;
      }
    }
    return bestSymmetry;
  }
  private checkNFoldSymmetry(methods: HarmonicSymbol[], n: number): number {
    // Check if methods exhibit n-fold rotational symmetry
    // based on their structural properties (size, complexity, position)
    if (methods.length < n) return 0;
    // Sort methods by line number to get positional order
    const sortedMethods = methods.slice().sort((a, b) => a.line - b.line);
    // For n-fold symmetry, divide methods into n groups
    const groupSize = Math.floor(sortedMethods.length / n);
    if (groupSize === 0) return 0;
    // Calculate properties for each group
    const groups: Array<{ avgSize: number; avgComplexity: number }> = [];
    for (let i = 0; i < n; i++) {
      const groupMethods = sortedMethods.slice(i * groupSize, (i + 1) * groupSize);
      if (groupMethods.length === 0) continue;
      const avgSize = groupMethods.reduce((sum, m) => 
        sum + ((m.endLine || m.line) - m.line), 0) / groupMethods.length;
      // Simple complexity metric based on method name length and parameter count
      const avgComplexity = groupMethods.reduce((sum, m) => 
        sum + m.name.length, 0) / groupMethods.length;
      groups.push({ avgSize, avgComplexity });
    }
    // Check if groups are similar (indicating rotational symmetry)
    if (groups.length !== n) return 0;
    // Calculate variance in group properties
    const avgGroupSize = groups.reduce((sum, g) => sum + g.avgSize, 0) / n;
    const sizeVariance = groups.reduce((sum, g) => 
      sum + Math.pow(g.avgSize - avgGroupSize, 2), 0) / n;
    // Lower variance indicates better symmetry
    const sizeSymmetry = Math.exp(-sizeVariance / (avgGroupSize * avgGroupSize + 1));
    // Special check for 2-fold symmetry (should have two distinct groups)
    if (n === 2) {
      const sizeDiff = Math.abs(groups[0].avgSize - groups[1].avgSize) / avgGroupSize;
      // For 2-fold, we expect groups to be similar
      return sizeDiff < 0.3 ? 0.9 : 0.5;
    }
    return sizeSymmetry;
  }
  private checkMethodNamePatterns(methods: HarmonicSymbol[]): any {
    // Fallback: Look for patterns like: get/set/validate, create/read/update/delete, etc.
    const patterns = [
      { prefixes: ['get', 'set', 'validate'], order: 3 },
      { prefixes: ['create', 'read', 'update', 'delete'], order: 4 },
      { prefixes: ['init', 'process', 'validate', 'finalize'], order: 4 },
      { prefixes: ['start', 'stop'], order: 2 },
      { prefixes: ['push', 'pop', 'peek'], order: 3 },
      { prefixes: ['open', 'read', 'write', 'close'], order: 4 },
      { prefixes: ['begin', 'execute', 'commit', 'rollback'], order: 4 },
      { prefixes: ['load', 'transform', 'save'], order: 3 },
      { prefixes: ['request', 'process', 'respond'], order: 3 }
    ];
    for (const pattern of patterns) {
      let matches = 0;
      for (const prefix of pattern.prefixes) {
        if (methods.some(m => m.name.toLowerCase().includes(prefix))) {
          matches++;
        }
      }
      if (matches >= pattern.order * 0.75) {
        return {
          order: pattern.order,
          confidence: matches / pattern.order
        };
      }
    }
    return null;
  }
  private findReflectionSymmetry(semanticData: SemanticData): any[] {
    const symmetries = [];
    // Check for symmetric relationships
    const relationships = semanticData.relationships;
    for (const [source, targets] of relationships) {
      // Check if relationships are symmetric
      let symmetricCount = 0;
      for (const target of targets) {
        const reverseRels = relationships.get(target) || [];
        if (reverseRels.includes(source)) {
          symmetricCount++;
        }
      }
      if (symmetricCount > 0 && targets.length > 0) {
        const confidence = symmetricCount / targets.length;
        if (confidence > 0.5) {
          symmetries.push({
            description: `Symmetric relationships from ${source}`,
            confidence
          });
        }
      }
    }
    return symmetries;
  }
  private classifyDihedralGroups(semanticData: SemanticData): any[] {
    const groups = [];
    // Look for dihedral patterns in class structures
    const packages = semanticData.structure.packages;
    for (const pkg of packages) {
      const packageSymbols = Array.from(semanticData.symbols.values())
        .filter(s => s.filePath.includes(`/${pkg}/`));
      // Count classes and their relationships
      const classes = packageSymbols.filter(s => s.kind === 'class');
      if (classes.length >= 3) {
        // Simple heuristic: if classes form a regular polygon-like structure
        const order = classes.length;
        groups.push({
          order,
          confidence: 1.0
        });
      }
    }
    return groups;
  }
  // Helper methods for Platonic Solids
  private findDualRelationships(semanticData: SemanticData): any[] {
    const duals = [];
    // Platonic dual pairs: tetrahedron-self, cube-octahedron, dodecahedron-icosahedron
    const packages = semanticData.structure.packages;
    for (let i = 0; i < packages.length - 1; i++) {
      for (let j = i + 1; j < packages.length; j++) {
        const pkg1Symbols = Array.from(semanticData.symbols.values())
          .filter(s => s.filePath.includes(`/${packages[i]}/`));
        const pkg2Symbols = Array.from(semanticData.symbols.values())
          .filter(s => s.filePath.includes(`/${packages[j]}/`));
        const duality = this.checkDuality(pkg1Symbols, pkg2Symbols);
        if (duality) {
          duals.push({
            solid1: duality.solid1,
            solid2: duality.solid2,
            confidence: duality.confidence
          });
        }
      }
    }
    return duals;
  }
  private checkDuality(symbols1: HarmonicSymbol[], symbols2: HarmonicSymbol[]): any {
    // Check if the relationship between two sets resembles Platonic duality
    const classes1 = symbols1.filter(s => s.kind === 'class').length;
    const classes2 = symbols2.filter(s => s.kind === 'class').length;
    // Cube-Octahedron: 8 vertices vs 6 vertices
    if ((classes1 === 8 && classes2 === 6) || (classes1 === 6 && classes2 === 8)) {
      return {
        solid1: classes1 === 8 ? 'cube' : 'octahedron',
        solid2: classes1 === 8 ? 'octahedron' : 'cube',
        confidence: 0.8
      };
    }
    // Dodecahedron-Icosahedron: 20 vertices vs 12 vertices
    if ((classes1 === 20 && classes2 === 12) || (classes1 === 12 && classes2 === 20)) {
      return {
        solid1: classes1 === 20 ? 'dodecahedron' : 'icosahedron',
        solid2: classes1 === 20 ? 'icosahedron' : 'dodecahedron',
        confidence: 0.8
      };
    }
    return null;
  }
  private analyzeVolumeSurfaceRatios(semanticData: SemanticData): any[] {
    const ratios = [];
    // Analyze package structure ratios
    for (const pkg of semanticData.structure.packages) {
      const symbols = Array.from(semanticData.symbols.values())
        .filter(s => s.filePath.includes(`/${pkg}/`));
      const volume = symbols.length; // Total symbols as "volume"
      const surface = new Set(
        symbols.map(s => s.filePath.split('/').pop())
      ).size; // Unique files as "surface"
      if (surface > 0) {
        const ratio = volume / surface;
        ratios.push({
          value: ratio,
          location: pkg
        });
      }
    }
    return ratios;
  }
  private matchPlatonicRatio(ratio: number): string | null {
    // Platonic solid volume/surface ratios (normalized)
    const platonicRatios = [
      { name: 'tetrahedron', ratio: 0.118 },
      { name: 'cube', ratio: 0.167 },
      { name: 'octahedron', ratio: 0.118 },
      { name: 'dodecahedron', ratio: 0.382 },
      { name: 'icosahedron', ratio: 0.318 }
    ];
    // Scale the ratio to match typical code metrics
    const scaledRatio = ratio / 10;
    for (const platonic of platonicRatios) {
      if (Math.abs(scaledRatio - platonic.ratio) < 0.05) {
        return platonic.name;
      }
    }
    return null;
  }
  private analyze3DStructures(semanticData: SemanticData): any[] {
    const structures = [];
    // Analyze class inheritance depth as Z-axis
    const classes = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'class');
    for (const cls of classes) {
      const structure = this.build3DStructure(cls, semanticData);
      structures.push(structure);
    }
    return structures;
  }
  private build3DStructure(rootClass: HarmonicSymbol, semanticData: SemanticData): any {
    // Build a 3D representation of the class and its relationships
    const methods = Array.from(semanticData.symbols.values())
      .filter(s => s.kind === 'method' && s.containerName === rootClass.name);
    const relations = semanticData.relationships.get(rootClass.id) || [];
    // Simple 3D metrics
    const vertices = methods.length + 1; // methods + class itself
    const edges = relations.length + methods.length; // relations + method connections
    const depth = this.calculateInheritanceDepth(rootClass, semanticData);
    let type = 'unknown';
    let completeness = 0;
    // Match to Platonic solids by vertex count
    if (vertices === 4) {
      type = 'tetrahedron';
      completeness = 1.0;
    } else if (vertices === 8) {
      type = 'cube';
      completeness = 0.9;
    } else if (vertices === 6) {
      type = 'octahedron';
      completeness = 0.9;
    } else if (vertices === 20) {
      type = 'dodecahedron';
      completeness = 0.8;
    } else if (vertices === 12) {
      type = 'icosahedron';
      completeness = 0.8;
    }
    return {
      type,
      vertices,
      edges,
      depth,
      completeness
    };
  }
  private calculateInheritanceDepth(cls: HarmonicSymbol, semanticData: SemanticData): number {
    let depth = 0;
    const visited = new Set<string>();
    const traverse = (symbolId: string, currentDepth: number): number => {
      if (visited.has(symbolId)) return currentDepth;
      visited.add(symbolId);
      const relations = semanticData.relationships.get(symbolId) || [];
      let maxDepth = currentDepth;
      for (const relation of relations) {
        const relatedSymbol = semanticData.symbols.get(relation);
        if (relatedSymbol && relatedSymbol.kind === 'class') {
          const childDepth = traverse(relation, currentDepth + 1);
          maxDepth = Math.max(maxDepth, childDepth);
        }
      }
      return maxDepth;
    };
    return traverse(cls.id, 0);
  }
  private isPlatonicStructure(structure: any): boolean {
    return structure.type !== 'unknown' && structure.completeness > 0.5;
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
}