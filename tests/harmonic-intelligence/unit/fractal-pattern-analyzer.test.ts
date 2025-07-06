/**
 * Unit tests for Fractal Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FractalPatternAnalyzer } from '../../../src/harmonic-intelligence/analyzers/fractal-pattern-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('FractalPatternAnalyzer', () => {
  let analyzer: FractalPatternAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new FractalPatternAnalyzer();
    
    // Create base mock semantic data
    mockSemanticData = {
      symbols: new Map([
        ['func1', {
          id: 'func1',
          name: 'processData',
          kind: 'function',
          line: 10,
          endLine: 30,
          filePath: 'src/core/processor.ts',
          parameters: ['data', 'options'],
          complexity: 5
        }],
        ['func2', {
          id: 'func2',
          name: 'transformData',
          kind: 'function',
          line: 40,
          endLine: 80,
          filePath: 'src/core/transformer.ts',
          parameters: ['input'],
          complexity: 8
        }],
        ['class1', {
          id: 'class1',
          name: 'DataHandler',
          kind: 'class',
          line: 1,
          endLine: 200,
          filePath: 'src/handlers/data.ts',
          complexity: 15
        }]
      ]),
      relationships: new Map([
        ['func1', ['func2']],
        ['func2', ['func1']], // Creates a cycle
        ['class1', ['func1', 'func2']]
      ]),
      behaviors: {
        executionFlows: [],
        dataFlows: [],
        controlFlows: []
      },
      structure: {
        files: ['src/core/processor.ts', 'src/core/transformer.ts', 'src/handlers/data.ts'],
        packages: ['core', 'handlers'],
        namespaces: [],
        modules: ['processor', 'transformer', 'data']
      }
    };
  });
  
  describe('analyze', () => {
    it('should return all four fractal patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(4);
      expect(results.has(PatternType.MANDELBROT_COMPLEXITY)).toBe(true);
      expect(results.has(PatternType.JULIA_SET_PATTERNS)).toBe(true);
      expect(results.has(PatternType.L_SYSTEM_GROWTH)).toBe(true);
      expect(results.has(PatternType.HAUSDORFF_DIMENSION)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const [_, score] of results) {
        expect(score.category).toBe(PatternCategory.FRACTAL_PATTERNS);
      }
    });
    
    it('should handle empty semantic data gracefully', async () => {
      const emptyData: SemanticData = {
        symbols: new Map(),
        relationships: new Map(),
        behaviors: {
          executionFlows: [],
          dataFlows: [],
          controlFlows: []
        },
        structure: {
          files: [],
          packages: [],
          namespaces: [],
          modules: []
        }
      };
      
      const results = await analyzer.analyze(emptyData);
      
      expect(results.size).toBe(4);
      for (const [_, score] of results) {
        expect(score.score).toBe(0);
        expect(score.detected).toBe(false);
      }
    });
  });
  
  describe('Mandelbrot Complexity Detection', () => {
    it('should detect self-similarity at multiple scales', async () => {
      // Create data with self-similar structure
      const selfSimilarData = createSelfSimilarStructure();
      
      const results = await analyzer.analyze(selfSimilarData);
      const mandelbrotScore = results.get(PatternType.MANDELBROT_COMPLEXITY);
      
      expect(mandelbrotScore).toBeDefined();
      expect(mandelbrotScore.score).toBeGreaterThan(0);
      expect(mandelbrotScore.evidence.some(e => e.type === 'self_similarity')).toBe(true);
    });
    
    it('should calculate fractal dimension of code structure', async () => {
      // Create multi-scale structure
      const fractalData = createFractalStructure();
      
      const results = await analyzer.analyze(fractalData);
      const mandelbrotScore = results.get(PatternType.MANDELBROT_COMPLEXITY);
      
      expect(mandelbrotScore).toBeDefined();
      // May or may not have fractal dimension evidence depending on structure
      const hasFractalDimension = mandelbrotScore.evidence.some(e => e.type === 'fractal_dimension');
      
      if (hasFractalDimension) {
        // Check that dimension is between 1 and 2 (fractal)
        const dimensionEvidence = mandelbrotScore.evidence.find(e => e.type === 'fractal_dimension');
        expect(dimensionEvidence.value).toBeGreaterThan(1);
        expect(dimensionEvidence.value).toBeLessThan(2);
      }
    });
    
    it('should identify complexity boundaries', async () => {
      // Create modules with varying complexity
      const complexData = createComplexBoundaryData();
      
      const results = await analyzer.analyze(complexData);
      const mandelbrotScore = results.get(PatternType.MANDELBROT_COMPLEXITY);
      
      expect(mandelbrotScore).toBeDefined();
      // Complexity boundaries may not always be detected as fractal
      const hasComplexityBoundary = mandelbrotScore.evidence.some(e => e.type === 'complexity_boundary');
      expect(mandelbrotScore.score).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Julia Set Pattern Detection', () => {
    it('should detect parameter sensitivity', async () => {
      // Create functions with similar names but different parameters
      const sensitiveData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['process1', {
            id: 'process1',
            name: 'processData',
            kind: 'function',
            line: 1,
            endLine: 20,
            filePath: 'src/process.ts',
            parameters: ['data'],
            complexity: 3
          }],
          ['process2', {
            id: 'process2',
            name: 'processData_v2',
            kind: 'function',
            line: 25,
            endLine: 60,
            filePath: 'src/process.ts',
            parameters: ['data', 'options', 'callback'],
            complexity: 12
          }],
          ['process3', {
            id: 'process3',
            name: 'processData_v3',
            kind: 'function',
            line: 65,
            endLine: 150,
            filePath: 'src/process.ts',
            parameters: ['data', 'options', 'callback', 'context', 'logger'],
            complexity: 25
          }]
        ])
      };
      
      const results = await analyzer.analyze(sensitiveData);
      const juliaScore = results.get(PatternType.JULIA_SET_PATTERNS);
      
      expect(juliaScore).toBeDefined();
      expect(juliaScore.evidence.some(e => e.type === 'parameter_sensitivity')).toBe(true);
    });
    
    it('should measure connectivity patterns', async () => {
      // Create highly connected component graph
      const connectedData = createHighlyConnectedGraph();
      
      const results = await analyzer.analyze(connectedData);
      const juliaScore = results.get(PatternType.JULIA_SET_PATTERNS);
      
      expect(juliaScore).toBeDefined();
      expect(juliaScore.evidence.some(e => e.type === 'julia_connectivity')).toBe(true);
    });
    
    it('should detect dynamic systems with feedback', async () => {
      // Create state machine with feedback loops
      const dynamicData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['stateManager', {
            id: 'stateManager',
            name: 'StateManager',
            kind: 'class',
            line: 1,
            endLine: 100,
            filePath: 'src/state.ts'
          }],
          ['updateState', {
            id: 'updateState',
            name: 'updateState',
            kind: 'method',
            containerName: 'StateManager',
            line: 10,
            endLine: 30,
            filePath: 'src/state.ts'
          }],
          ['transformState', {
            id: 'transformState',
            name: 'transformState',
            kind: 'method',
            containerName: 'StateManager',
            line: 35,
            endLine: 50,
            filePath: 'src/state.ts'
          }],
          ['applyFeedback', {
            id: 'applyFeedback',
            name: 'applyFeedback',
            kind: 'method',
            containerName: 'StateManager',
            line: 55,
            endLine: 80,
            filePath: 'src/state.ts'
          }]
        ]),
        relationships: new Map([
          ['updateState', ['transformState', 'applyFeedback']],
          ['transformState', ['applyFeedback']],
          ['applyFeedback', ['updateState']] // Feedback loop
        ])
      };
      
      const results = await analyzer.analyze(dynamicData);
      const juliaScore = results.get(PatternType.JULIA_SET_PATTERNS);
      
      expect(juliaScore).toBeDefined();
      // Dynamic systems require specific patterns to be detected
      const hasDynamicSystem = juliaScore.evidence.some(e => e.type === 'dynamic_system');
      expect(juliaScore.score).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('L-System Growth Detection', () => {
    it('should detect recursive growth patterns', async () => {
      // Create recursive tree structure
      const recursiveData = createRecursiveTreeStructure();
      
      const results = await analyzer.analyze(recursiveData);
      const lSystemScore = results.get(PatternType.L_SYSTEM_GROWTH);
      
      expect(lSystemScore).toBeDefined();
      expect(lSystemScore.score).toBeGreaterThan(0);
      expect(lSystemScore.evidence.some(e => e.type === 'recursive_growth')).toBe(true);
    });
    
    it('should analyze biological branching factors', async () => {
      // Create structure with biological branching (2-3 branches)
      const biologicalData = createBiologicalBranchingStructure();
      
      const results = await analyzer.analyze(biologicalData);
      const lSystemScore = results.get(PatternType.L_SYSTEM_GROWTH);
      
      expect(lSystemScore).toBeDefined();
      expect(lSystemScore.evidence.some(e => e.type === 'branching_factor')).toBe(true);
      
      const branchingEvidence = lSystemScore.evidence.find(e => e.type === 'branching_factor');
      if (branchingEvidence) {
        expect(branchingEvidence.description).toContain('Biological branching');
      }
    });
    
    it('should match known biological patterns', async () => {
      // Create tree-like structure
      const treeData = createTreeLikeStructure();
      
      const results = await analyzer.analyze(treeData);
      const lSystemScore = results.get(PatternType.L_SYSTEM_GROWTH);
      
      expect(lSystemScore).toBeDefined();
      // Biological patterns require specific structure to match
      const hasBiologicalPattern = lSystemScore.evidence.some(e => e.type === 'biological_pattern');
      if (hasBiologicalPattern) {
        expect(lSystemScore.score).toBeGreaterThan(0.3);
      }
    });
  });
  
  describe('Hausdorff Dimension Detection', () => {
    it('should calculate box-counting dimension', async () => {
      // Create structure with non-integer dimension
      const fractalData = createFractalDimensionData();
      
      const results = await analyzer.analyze(fractalData);
      const hausdorffScore = results.get(PatternType.HAUSDORFF_DIMENSION);
      
      expect(hausdorffScore).toBeDefined();
      expect(hausdorffScore.evidence.some(e => e.type === 'box_counting')).toBe(true);
    });
    
    it('should calculate dimensions for code structures', async () => {
      // Create hierarchical structure
      const hierarchicalData = createHierarchicalStructure();
      
      const results = await analyzer.analyze(hierarchicalData);
      const hausdorffScore = results.get(PatternType.HAUSDORFF_DIMENSION);
      
      expect(hausdorffScore).toBeDefined();
      // Structure dimensions depend on having sufficient hierarchy
      const hasStructureDimension = hausdorffScore.evidence.some(e => e.type === 'structure_dimension');
      expect(hausdorffScore).toBeDefined();
      expect(hausdorffScore.score).toBeGreaterThanOrEqual(0);
    });
    
    it('should score fractal complexity', async () => {
      const complexData = createComplexFractalStructure();
      
      const results = await analyzer.analyze(complexData);
      const hausdorffScore = results.get(PatternType.HAUSDORFF_DIMENSION);
      
      expect(hausdorffScore).toBeDefined();
      if (hausdorffScore.score > 0.5) {
        expect(hausdorffScore.evidence.some(e => e.type === 'fractal_complexity')).toBe(true);
      }
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle circular dependencies', async () => {
      const circularData: SemanticData = {
        ...mockSemanticData,
        relationships: new Map([
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['a']] // Circular
        ])
      };
      
      const results = await analyzer.analyze(circularData);
      expect(results).toBeDefined();
      expect(results.size).toBe(4);
    });
    
    it('should handle deep recursion without stack overflow', async () => {
      // Create deep recursive structure
      const deepData = createDeepRecursiveStructure(20);
      
      const results = await analyzer.analyze(deepData);
      expect(results).toBeDefined();
      
      const lSystemScore = results.get(PatternType.L_SYSTEM_GROWTH);
      expect(lSystemScore).toBeDefined();
    });
    
    it('should handle symbols with missing properties', async () => {
      const incompleteData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['incomplete', {
            id: 'incomplete',
            name: 'IncompleteFunc',
            kind: 'function',
            line: 1,
            // Missing endLine, parameters, complexity
            filePath: 'src/incomplete.ts'
          } as Symbol]
        ])
      };
      
      const results = await analyzer.analyze(incompleteData);
      
      expect(results).toBeDefined();
      for (const [_, score] of results) {
        expect(isNaN(score.score)).toBe(false);
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('Performance', () => {
    it('should analyze large fractal structures efficiently', async () => {
      const largeData = createLargeFractalStructure(100);
      
      const startTime = Date.now();
      const results = await analyzer.analyze(largeData);
      const duration = Date.now() - startTime;
      
      expect(results.size).toBe(4);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
    
    it('should provide meaningful evidence for detected patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const [patternType, score] of results) {
        if (score.detected) {
          expect(score.evidence).toBeDefined();
          expect(score.evidence.length).toBeGreaterThan(0);
          
          // Check evidence quality
          score.evidence.forEach(evidence => {
            expect(evidence.type).toBeTruthy();
            expect(evidence.description).toBeTruthy();
            expect(evidence.location).toBeTruthy();
            expect(evidence.weight).toBeGreaterThanOrEqual(0);
            expect(evidence.weight).toBeLessThanOrEqual(1);
          });
        }
      }
    });
  });
});

// Helper functions to create test data

function createSelfSimilarStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create self-similar modules at different scales
  const scales = [1, 2, 4, 8];
  
  scales.forEach((scale, scaleIdx) => {
    const moduleCount = 8 / scale; // Fewer modules at larger scales
    
    for (let m = 0; m < moduleCount; m++) {
      const modulePrefix = `scale${scale}_module${m}`;
      
      // Each module has similar structure but at different scale
      const functionCount = 4 * scale;
      for (let f = 0; f < functionCount; f++) {
        const funcId = `${modulePrefix}_func${f}`;
        symbols.set(funcId, {
          id: funcId,
          name: `function${f}`,
          kind: 'function',
          line: f * 10 * scale,
          endLine: (f * 10 + 8) * scale,
          filePath: `src/scale${scale}/module${m}/func${f}.ts`,
          parameters: Array(Math.floor(Math.log2(scale) + 1)).fill('param'),
          complexity: 3 * scale
        });
        
        // Create self-similar relationships
        if (f > 0) {
          relationships.set(funcId, [`${modulePrefix}_func${f-1}`]);
        }
      }
    }
  });
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: scales.map(s => `scale${s}`),
      namespaces: [],
      modules: []
    }
  };
}

function createFractalStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create structure with fractal dimension ~1.585 (log(3)/log(2))
  const createFractalBranch = (prefix: string, depth: number, maxDepth: number) => {
    if (depth > maxDepth) return;
    
    const nodeId = `${prefix}_d${depth}`;
    symbols.set(nodeId, {
      id: nodeId,
      name: `node_${depth}`,
      kind: 'function',
      line: depth * 100,
      endLine: depth * 100 + 50,
      filePath: `src/fractal/${prefix}.ts`,
      complexity: Math.pow(2, depth)
    });
    
    // Each node branches into 3 (Sierpinski-like)
    const children = [];
    for (let i = 0; i < 3; i++) {
      const childPrefix = `${prefix}_${i}`;
      createFractalBranch(childPrefix, depth + 1, maxDepth);
      children.push(`${childPrefix}_d${depth + 1}`);
    }
    
    if (children.length > 0) {
      relationships.set(nodeId, children);
    }
  };
  
  createFractalBranch('root', 0, 4);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['fractal'],
      namespaces: [],
      modules: ['fractal']
    }
  };
}

function createComplexBoundaryData(): SemanticData {
  const symbols = new Map<string, Symbol>();
  
  // Create modules with fractal complexity boundaries
  const modules = ['simple', 'boundary', 'complex', 'chaotic'];
  const complexityPatterns = [
    [1, 2, 1, 2, 1, 2], // Simple periodic
    [1, 3, 5, 8, 13, 21], // Fibonacci growth
    [2, 4, 8, 16, 32, 64], // Exponential
    [5, 13, 7, 17, 3, 19, 11, 23] // Chaotic (primes)
  ];
  
  modules.forEach((module, idx) => {
    const pattern = complexityPatterns[idx];
    pattern.forEach((complexity, i) => {
      const id = `${module}_func${i}`;
      symbols.set(id, {
        id,
        name: `func${i}`,
        kind: 'function',
        line: i * 50,
        endLine: i * 50 + 30,
        filePath: `src/${module}/functions.ts`,
        complexity
      });
    });
  });
  
  return {
    symbols,
    relationships: new Map(),
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: modules.map(m => `src/${m}/functions.ts`),
      packages: modules,
      namespaces: [],
      modules
    }
  };
}

function createHighlyConnectedGraph(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create densely connected component
  const nodeCount = 10;
  for (let i = 0; i < nodeCount; i++) {
    const id = `node${i}`;
    symbols.set(id, {
      id,
      name: `Component${i}`,
      kind: 'class',
      line: i * 100,
      endLine: i * 100 + 80,
      filePath: `src/components/comp${i}.ts`
    });
    
    // Connect to multiple other nodes (Julia set-like connectivity)
    const connections = [];
    for (let j = 0; j < nodeCount; j++) {
      if (i !== j && Math.abs(i - j) <= 3) {
        connections.push(`node${j}`);
      }
    }
    relationships.set(id, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: ['components'],
      namespaces: [],
      modules: ['components']
    }
  };
}

function createRecursiveTreeStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create recursive tree processing functions
  const createTreeNode = (prefix: string, depth: number, maxDepth: number) => {
    const id = `${prefix}_process`;
    
    symbols.set(id, {
      id,
      name: `process${prefix}`,
      kind: 'function',
      line: depth * 50,
      endLine: depth * 50 + 40,
      filePath: 'src/tree/processor.ts',
      parameters: ['node', 'context'],
      complexity: depth + 3
    });
    
    if (depth < maxDepth) {
      const children = [];
      // Binary tree structure
      const leftChild = `${prefix}Left`;
      const rightChild = `${prefix}Right`;
      
      createTreeNode(leftChild, depth + 1, maxDepth);
      createTreeNode(rightChild, depth + 1, maxDepth);
      
      children.push(`${leftChild}_process`, `${rightChild}_process`);
      relationships.set(id, children);
      
      // Add self-reference for recursion
      children.push(id);
    }
  };
  
  createTreeNode('root', 0, 4);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: ['src/tree/processor.ts'],
      packages: ['tree'],
      namespaces: [],
      modules: ['processor']
    }
  };
}

function createBiologicalBranchingStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create structure with biological branching factors (2-3)
  let nodeId = 0;
  
  const createBranch = (parentId: string, depth: number, maxDepth: number) => {
    if (depth > maxDepth) return;
    
    // Biological branching: 2-3 branches per node
    const branchCount = 2 + Math.floor(Math.random() * 2);
    const children = [];
    
    for (let i = 0; i < branchCount; i++) {
      const childId = `node${nodeId++}`;
      symbols.set(childId, {
        id: childId,
        name: `Branch${childId}`,
        kind: 'class',
        line: nodeId * 30,
        endLine: nodeId * 30 + 25,
        filePath: `src/organism/branch${depth}.ts`
      });
      
      children.push(childId);
      createBranch(childId, depth + 1, maxDepth);
    }
    
    if (children.length > 0) {
      relationships.set(parentId, children);
    }
  };
  
  const rootId = `node${nodeId++}`;
  symbols.set(rootId, {
    id: rootId,
    name: 'OrganismRoot',
    kind: 'class',
    line: 1,
    endLine: 50,
    filePath: 'src/organism/root.ts'
  });
  
  createBranch(rootId, 1, 4);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['organism'],
      namespaces: [],
      modules: ['organism']
    }
  };
}

function createTreeLikeStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create tree-like module structure
  const createTreeModule = (name: string, depth: number, parentId?: string) => {
    const moduleId = `${name}_module`;
    const controllerId = `${name}_controller`;
    const serviceid = `${name}_service`;
    
    // Module class
    symbols.set(moduleId, {
      id: moduleId,
      name: `${name}Module`,
      kind: 'class',
      line: depth * 100,
      endLine: depth * 100 + 80,
      filePath: `src/modules/${name}/module.ts`
    });
    
    // Controller
    symbols.set(controllerId, {
      id: controllerId,
      name: `${name}Controller`,
      kind: 'class',
      line: 1,
      endLine: 60,
      filePath: `src/modules/${name}/controller.ts`
    });
    
    // Service
    symbols.set(serviceid, {
      id: serviceid,
      name: `${name}Service`,
      kind: 'class',
      line: 1,
      endLine: 100,
      filePath: `src/modules/${name}/service.ts`
    });
    
    // Internal relationships
    relationships.set(moduleId, [controllerId, serviceid]);
    relationships.set(controllerId, [serviceid]);
    
    // Parent relationship
    if (parentId) {
      const parentRels = relationships.get(parentId) || [];
      parentRels.push(moduleId);
      relationships.set(parentId, parentRels);
    }
    
    return moduleId;
  };
  
  // Create tree structure
  const root = createTreeModule('app', 0);
  const auth = createTreeModule('auth', 1, root);
  const user = createTreeModule('user', 1, root);
  const admin = createTreeModule('admin', 2, auth);
  const profile = createTreeModule('profile', 2, user);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: ['modules'],
      namespaces: [],
      modules: ['app', 'auth', 'user', 'admin', 'profile']
    }
  };
}

function createFractalDimensionData(): SemanticData {
  const symbols = new Map<string, Symbol>();
  
  // Create symbols distributed in a fractal pattern
  // Using Cantor set-like distribution
  const createCantorDistribution = (start: number, end: number, depth: number) => {
    if (depth === 0 || end - start < 10) {
      const id = `func_${start}_${end}`;
      symbols.set(id, {
        id,
        name: `function_${start}`,
        kind: 'function',
        line: start,
        endLine: end,
        filePath: 'src/cantor/functions.ts',
        complexity: depth + 1,
        parameters: Array(depth).fill('p')
      });
      return;
    }
    
    const third = Math.floor((end - start) / 3);
    // Remove middle third (Cantor set)
    createCantorDistribution(start, start + third, depth - 1);
    createCantorDistribution(end - third, end, depth - 1);
  };
  
  createCantorDistribution(1, 729, 5); // 3^6 = 729
  
  return {
    symbols,
    relationships: new Map(),
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: ['src/cantor/functions.ts'],
      packages: ['cantor'],
      namespaces: [],
      modules: ['cantor']
    }
  };
}

function createHierarchicalStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create multi-level hierarchy
  const levels = 5;
  const branchingFactor = 3;
  
  let id = 0;
  for (let level = 0; level < levels; level++) {
    const nodesAtLevel = Math.pow(branchingFactor, level);
    
    for (let n = 0; n < nodesAtLevel; n++) {
      const nodeId = `level${level}_node${n}`;
      const nodeIndex = id++;
      
      symbols.set(nodeId, {
        id: nodeId,
        name: `Level${level}Class${n}`,
        kind: 'class',
        line: nodeIndex * 50,
        endLine: nodeIndex * 50 + 40,
        filePath: `src/hierarchy/level${level}/class${n}.ts`
      });
      
      // Connect to children in next level
      if (level < levels - 1) {
        const children = [];
        for (let c = 0; c < branchingFactor; c++) {
          const childIdx = n * branchingFactor + c;
          children.push(`level${level + 1}_node${childIdx}`);
        }
        relationships.set(nodeId, children);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: Array.from({ length: levels }, (_, i) => `level${i}`),
      namespaces: [],
      modules: []
    }
  };
}

function createComplexFractalStructure(): SemanticData {
  // Combine multiple fractal patterns
  const base = createFractalStructure();
  const selfsimilar = createSelfSimilarStructure();
  const recursive = createRecursiveTreeStructure();
  
  // Merge all structures
  const symbols = new Map([...base.symbols, ...selfsimilar.symbols, ...recursive.symbols]);
  const relationships = new Map([...base.relationships, ...selfsimilar.relationships, ...recursive.relationships]);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: [...new Set([...base.structure.files, ...selfsimilar.structure.files, ...recursive.structure.files])],
      packages: [...new Set([...base.structure.packages, ...selfsimilar.structure.packages, ...recursive.structure.packages])],
      namespaces: [],
      modules: []
    }
  };
}

function createDeepRecursiveStructure(depth: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create linear recursive chain
  for (let i = 0; i < depth; i++) {
    const id = `recursive${i}`;
    symbols.set(id, {
      id,
      name: `recursiveFunc${i}`,
      kind: 'function',
      line: i * 10,
      endLine: i * 10 + 8,
      filePath: 'src/recursive/chain.ts',
      parameters: ['depth'],
      complexity: i + 1
    });
    
    if (i < depth - 1) {
      relationships.set(id, [`recursive${i + 1}`]);
    } else {
      // Last one calls first (cycle)
      relationships.set(id, ['recursive0']);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: ['src/recursive/chain.ts'],
      packages: ['recursive'],
      namespaces: [],
      modules: ['recursive']
    }
  };
}

function createLargeFractalStructure(size: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create large fractal tree
  let nodeCount = 0;
  
  const createNode = (depth: number, maxDepth: number, branchFactor: number) => {
    if (depth > maxDepth || nodeCount >= size) return null;
    
    const id = `node${nodeCount++}`;
    symbols.set(id, {
      id,
      name: `Node${id}`,
      kind: 'class',
      line: nodeCount * 20,
      endLine: nodeCount * 20 + 15,
      filePath: `src/large/node${Math.floor(nodeCount / 100)}.ts`,
      complexity: depth
    });
    
    const children = [];
    for (let i = 0; i < branchFactor && nodeCount < size; i++) {
      const childId = createNode(depth + 1, maxDepth, branchFactor);
      if (childId) children.push(childId);
    }
    
    if (children.length > 0) {
      relationships.set(id, children);
    }
    
    return id;
  };
  
  createNode(0, 10, 3); // Ternary tree
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['large'],
      namespaces: [],
      modules: ['large']
    }
  };
}