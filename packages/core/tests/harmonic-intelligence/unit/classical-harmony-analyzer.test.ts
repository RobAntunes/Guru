/**
 * Unit tests for Classical Harmony Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClassicalHarmonyAnalyzer } from '../../../src/harmonic-intelligence/analyzers/classical-harmony-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('ClassicalHarmonyAnalyzer', () => {
  let analyzer: ClassicalHarmonyAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new ClassicalHarmonyAnalyzer();
    
    // Create mock semantic data
    mockSemanticData = {
      symbols: new Map([
        ['func1', {
          id: 'func1',
          name: 'calculateTotal',
          kind: 'function',
          line: 10,
          endLine: 25,
          filePath: 'src/utils/calc.ts',
          parameters: ['a', 'b', 'c'],
          complexity: 3,
          depth: 1
        }],
        ['func2', {
          id: 'func2',
          name: 'processData',
          kind: 'function',
          line: 30,
          endLine: 70,
          filePath: 'src/utils/calc.ts',
          parameters: ['data', 'options'],
          complexity: 5,
          depth: 2
        }],
        ['func3', {
          id: 'func3',
          name: 'validateInput',
          kind: 'function',
          line: 75,
          endLine: 90,
          filePath: 'src/utils/validate.ts',
          parameters: ['input'],
          complexity: 2,
          depth: 1
        }],
        ['class1', {
          id: 'class1',
          name: 'DataProcessor',
          kind: 'class',
          line: 1,
          endLine: 200,
          filePath: 'src/core/processor.ts'
        }],
        ['method1', {
          id: 'method1',
          name: 'process',
          kind: 'method',
          containerName: 'DataProcessor',
          line: 50,
          endLine: 80,
          filePath: 'src/core/processor.ts',
          parameters: ['input', 'config'],
          complexity: 8
        }],
        ['method2', {
          id: 'method2',
          name: 'validate',
          kind: 'method',
          containerName: 'DataProcessor',
          line: 85,
          endLine: 95,
          filePath: 'src/core/processor.ts',
          parameters: ['data'],
          complexity: 3
        }]
      ]),
      relationships: new Map([
        ['func1', ['func2', 'func3']],
        ['func2', ['func3']],
        ['method1', ['method2', 'func1']]
      ]),
      behaviors: {
        executionFlows: [],
        dataFlows: [],
        controlFlows: []
      },
      structure: {
        files: ['src/utils/calc.ts', 'src/utils/validate.ts', 'src/core/processor.ts'],
        packages: ['utils', 'core'],
        namespaces: [],
        modules: ['calc', 'validate', 'processor']
      }
    };
  });
  
  describe('analyze', () => {
    it('should return all four classical harmony patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(4);
      expect(results.has(PatternType.GOLDEN_RATIO)).toBe(true);
      expect(results.has(PatternType.FIBONACCI_SEQUENCES)).toBe(true);
      expect(results.has(PatternType.PRIME_NUMBER_HARMONICS)).toBe(true);
      expect(results.has(PatternType.EULER_CONSTANT_PATTERNS)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const [_, score] of results) {
        expect(score.category).toBe(PatternCategory.CLASSICAL_HARMONY);
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
  
  describe('Golden Ratio Detection', () => {
    it('should detect golden ratio in file/package structure', async () => {
      // Create data with golden ratio proportions
      const goldenData: SemanticData = {
        ...mockSemanticData,
        structure: {
          files: Array(16).fill('file.ts'), // ~1.618 * 10
          packages: Array(10).fill('package'),
          namespaces: [],
          modules: []
        }
      };
      
      const results = await analyzer.analyze(goldenData);
      const goldenScore = results.get(PatternType.GOLDEN_RATIO);
      
      expect(goldenScore).toBeDefined();
      expect(goldenScore.score).toBeGreaterThan(0);
      // Detection depends on threshold (0.6 for golden ratio)
      if (goldenScore.score > 0.6) {
        expect(goldenScore.detected).toBe(true);
      }
      expect(goldenScore.evidence.length).toBeGreaterThan(0);
    });
    
    it('should detect golden ratio in function length progression', async () => {
      // Add functions with golden ratio length progression
      const functions = [
        { name: 'f1', line: 1, endLine: 8, kind: 'function' },    // 8 lines
        { name: 'f2', line: 10, endLine: 22, kind: 'function' },  // 13 lines (~8 * 1.618)
        { name: 'f3', line: 25, endLine: 45, kind: 'function' },  // 21 lines (~13 * 1.618)
        { name: 'f4', line: 50, endLine: 83, kind: 'function' }   // 34 lines (~21 * 1.618)
      ];
      
      const goldenData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map(functions.map((f, i) => [`func${i}`, f]))
      };
      
      const results = await analyzer.analyze(goldenData);
      const goldenScore = results.get(PatternType.GOLDEN_RATIO);
      
      expect(goldenScore.score).toBeGreaterThan(0.7);
    });
    
    it('should not detect golden ratio in random proportions', async () => {
      const randomData: SemanticData = {
        ...mockSemanticData,
        structure: {
          files: Array(7).fill('file.ts'),
          packages: Array(3).fill('package'),
          namespaces: [],
          modules: []
        }
      };
      
      const results = await analyzer.analyze(randomData);
      const goldenScore = results.get(PatternType.GOLDEN_RATIO);
      
      expect(goldenScore.score).toBeLessThan(0.5);
    });
  });
  
  describe('Fibonacci Sequence Detection', () => {
    it('should detect Fibonacci-like parameter counts', async () => {
      // Create functions with Fibonacci parameter counts
      const fibFunctions = [
        { name: 'f1', kind: 'function', parameters: ['a'] },                    // 1
        { name: 'f2', kind: 'function', parameters: ['a'] },                    // 1
        { name: 'f3', kind: 'function', parameters: ['a', 'b'] },               // 2
        { name: 'f4', kind: 'function', parameters: ['a', 'b', 'c'] },          // 3
        { name: 'f5', kind: 'function', parameters: Array(5).fill('p') },       // 5
        { name: 'f6', kind: 'function', parameters: Array(8).fill('p') }        // 8
      ];
      
      const fibData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map(fibFunctions.map((f, i) => [`func${i}`, { ...f, line: i * 10, endLine: i * 10 + 5 }]))
      };
      
      const results = await analyzer.analyze(fibData);
      const fibScore = results.get(PatternType.FIBONACCI_SEQUENCES);
      
      expect(fibScore).toBeDefined();
      expect(fibScore.score).toBeGreaterThan(0.7);
      expect(fibScore.detected).toBe(true);
    });
    
    it('should detect Fibonacci in branching factors', async () => {
      // Create relationships with Fibonacci branching
      const fibRelationships = new Map([
        ['node1', ['a']],                          // 1
        ['node2', ['a']],                          // 1  
        ['node3', ['a', 'b']],                     // 2
        ['node4', ['a', 'b', 'c']],                // 3
        ['node5', Array(5).fill('dep')],           // 5
        ['node6', Array(8).fill('dep')]            // 8
      ]);
      
      const fibData: SemanticData = {
        ...mockSemanticData,
        relationships: fibRelationships
      };
      
      const results = await analyzer.analyze(fibData);
      const fibScore = results.get(PatternType.FIBONACCI_SEQUENCES);
      
      expect(fibScore.score).toBeGreaterThan(0.6);
    });
  });
  
  describe('Prime Number Harmonics Detection', () => {
    it('should detect prime number in module count', async () => {
      // Create structure with prime number of modules
      const primeData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ...Array(7).fill(null).map((_, i) => [
            `mod${i}`, 
            { name: `module${i}`, kind: 'module', filePath: `src/mod${i}/index.ts`, line: 1, endLine: 10 }
          ])
        ])
      };
      
      const results = await analyzer.analyze(primeData);
      const primeScore = results.get(PatternType.PRIME_NUMBER_HARMONICS);
      
      expect(primeScore).toBeDefined();
      expect(primeScore.score).toBeGreaterThan(0.5);
    });
    
    it('should detect prime distribution in function counts', async () => {
      // Create files with prime numbers of functions
      const files = [
        { functions: 2 },  // prime
        { functions: 3 },  // prime
        { functions: 5 },  // prime
        { functions: 7 },  // prime
        { functions: 4 },  // not prime
        { functions: 6 }   // not prime
      ];
      
      const symbols = new Map();
      files.forEach((file, fileIdx) => {
        for (let i = 0; i < file.functions; i++) {
          symbols.set(`f${fileIdx}_${i}`, {
            name: `func_${fileIdx}_${i}`,
            kind: 'function',
            filePath: `file${fileIdx}.ts`,
            line: i * 10,
            endLine: i * 10 + 5
          });
        }
      });
      
      const primeData: SemanticData = {
        ...mockSemanticData,
        symbols
      };
      
      const results = await analyzer.analyze(primeData);
      const primeScore = results.get(PatternType.PRIME_NUMBER_HARMONICS);
      
      expect(primeScore.score).toBeGreaterThan(0.6); // 4/6 files have prime counts
    });
  });
  
  describe('Euler Constant Patterns Detection', () => {
    it('should detect exponential growth patterns', async () => {
      // Create symbols with exponential complexity growth
      const expSymbols = new Map([
        ['f1', { name: 'f1', kind: 'function', complexity: 1, filePath: 'a.ts', line: 1, endLine: 5 }],
        ['f2', { name: 'f2', kind: 'function', complexity: 2.7, filePath: 'b.ts', line: 1, endLine: 5 }],
        ['f3', { name: 'f3', kind: 'function', complexity: 7.3, filePath: 'c.ts', line: 1, endLine: 5 }],
        ['f4', { name: 'f4', kind: 'function', complexity: 20, filePath: 'd.ts', line: 1, endLine: 5 }]
      ]);
      
      const eulerData: SemanticData = {
        ...mockSemanticData,
        symbols: expSymbols
      };
      
      const results = await analyzer.analyze(eulerData);
      const eulerScore = results.get(PatternType.EULER_CONSTANT_PATTERNS);
      
      expect(eulerScore).toBeDefined();
      expect(eulerScore.evidence.length).toBeGreaterThan(0);
    });
    
    it('should detect logarithmic relationships', async () => {
      // Create file sizes that follow logarithmic distribution
      const logFiles = [1, 2, 3, 5, 8, 13, 21].map((size, i) => {
        const symbols = new Map();
        for (let j = 0; j < Math.log(size) * 10; j++) {
          symbols.set(`f${i}_${j}`, {
            name: `func_${i}_${j}`,
            kind: 'function',
            filePath: `file${i}.ts`,
            line: j * 10,
            endLine: j * 10 + 5
          });
        }
        return symbols;
      });
      
      const allSymbols = new Map();
      logFiles.forEach(fileSymbols => {
        fileSymbols.forEach((value, key) => allSymbols.set(key, value));
      });
      
      const logData: SemanticData = {
        ...mockSemanticData,
        symbols: allSymbols
      };
      
      const results = await analyzer.analyze(logData);
      const eulerScore = results.get(PatternType.EULER_CONSTANT_PATTERNS);
      
      expect(eulerScore.score).toBeGreaterThan(0.4);
    });
  });
  
  describe('Performance', () => {
    it('should analyze large codebases efficiently', async () => {
      // Create a large dataset
      const largeSymbols = new Map();
      for (let i = 0; i < 1000; i++) {
        largeSymbols.set(`sym${i}`, {
          id: `sym${i}`,
          name: `symbol${i}`,
          kind: i % 3 === 0 ? 'function' : i % 3 === 1 ? 'class' : 'method',
          line: i * 10,
          endLine: i * 10 + Math.floor(Math.random() * 50),
          filePath: `src/file${Math.floor(i / 10)}.ts`,
          parameters: Array(Math.floor(Math.random() * 5)).fill('param'),
          complexity: Math.floor(Math.random() * 10) + 1,
          depth: Math.floor(Math.random() * 5) + 1
        });
      }
      
      const largeData: SemanticData = {
        symbols: largeSymbols,
        relationships: new Map(),
        behaviors: {
          executionFlows: [],
          dataFlows: [],
          controlFlows: []
        },
        structure: {
          files: Array(100).fill(null).map((_, i) => `src/file${i}.ts`),
          packages: Array(10).fill(null).map((_, i) => `package${i}`),
          namespaces: [],
          modules: []
        }
      };
      
      const startTime = Date.now();
      const results = await analyzer.analyze(largeData);
      const duration = Date.now() - startTime;
      
      expect(results.size).toBe(4);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
  
  describe('Evidence Quality', () => {
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
            expect(evidence.weight).toBeGreaterThanOrEqual(0);
            expect(evidence.weight).toBeLessThanOrEqual(1);
          });
        }
      }
    });
  });
});

describe('ClassicalHarmonyAnalyzer Edge Cases', () => {
  let analyzer: ClassicalHarmonyAnalyzer;
  
  beforeEach(() => {
    analyzer = new ClassicalHarmonyAnalyzer();
  });
  
  it('should handle division by zero gracefully', async () => {
    const edgeData: SemanticData = {
      symbols: new Map([
        ['func1', { 
          name: 'func1', 
          kind: 'function', 
          line: 1, 
          endLine: 1, // Same line (0 length)
          filePath: 'test.ts',
          parameters: []
        }]
      ]),
      relationships: new Map(),
      behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
      structure: { files: [], packages: [], namespaces: [], modules: [] }
    };
    
    const results = await analyzer.analyze(edgeData);
    
    expect(results).toBeDefined();
    for (const [_, score] of results) {
      expect(isNaN(score.score)).toBe(false);
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(1);
    }
  });
  
  it('should handle circular dependencies', async () => {
    const circularData: SemanticData = {
      symbols: new Map([
        ['a', { name: 'a', kind: 'function', line: 1, endLine: 10, filePath: 'a.ts' }],
        ['b', { name: 'b', kind: 'function', line: 1, endLine: 10, filePath: 'b.ts' }],
        ['c', { name: 'c', kind: 'function', line: 1, endLine: 10, filePath: 'c.ts' }]
      ]),
      relationships: new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', ['a']] // Circular dependency
      ]),
      behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
      structure: { files: ['a.ts', 'b.ts', 'c.ts'], packages: ['pkg'], namespaces: [], modules: [] }
    };
    
    const results = await analyzer.analyze(circularData);
    expect(results).toBeDefined();
    expect(results.size).toBe(4);
  });
});