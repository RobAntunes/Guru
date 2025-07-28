/**
 * Unit tests for Geometric Harmony Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeometricHarmonyAnalyzer } from '../../../src/harmonic-intelligence/analyzers/geometric-harmony-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('GeometricHarmonyAnalyzer', () => {
  let analyzer: GeometricHarmonyAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new GeometricHarmonyAnalyzer();
    
    // Create base mock semantic data
    mockSemanticData = {
      symbols: new Map([
        ['BaseClass', {
          id: 'BaseClass',
          name: 'BaseClass',
          kind: 'class',
          line: 1,
          endLine: 100,
          filePath: 'src/core/base.ts'
        }],
        ['DerivedClass1', {
          id: 'DerivedClass1',
          name: 'DerivedClass1',
          kind: 'class',
          line: 1,
          endLine: 80,
          filePath: 'src/core/derived1.ts'
        }],
        ['DerivedClass2', {
          id: 'DerivedClass2',
          name: 'DerivedClass2',
          kind: 'class',
          line: 1,
          endLine: 90,
          filePath: 'src/core/derived2.ts'
        }],
        ['method1', {
          id: 'method1',
          name: 'getValue',
          kind: 'method',
          containerName: 'BaseClass',
          line: 10,
          endLine: 20,
          filePath: 'src/core/base.ts'
        }],
        ['method2', {
          id: 'method2',
          name: 'setValue',
          kind: 'method',
          containerName: 'BaseClass',
          line: 25,
          endLine: 35,
          filePath: 'src/core/base.ts'
        }],
        ['method3', {
          id: 'method3',
          name: 'validateValue',
          kind: 'method',
          containerName: 'BaseClass',
          line: 40,
          endLine: 50,
          filePath: 'src/core/base.ts'
        }]
      ]),
      relationships: new Map([
        ['DerivedClass1', ['BaseClass']],
        ['DerivedClass2', ['BaseClass']],
        ['BaseClass', ['DerivedClass1', 'DerivedClass2']]
      ]),
      behaviors: {
        executionFlows: [],
        dataFlows: [],
        controlFlows: []
      },
      structure: {
        files: [
          'src/core/base.ts',
          'src/core/derived1.ts',
          'src/core/derived2.ts',
          'src/utils/helper.ts'
        ],
        packages: ['core', 'utils'],
        namespaces: [],
        modules: ['base', 'derived1', 'derived2', 'helper']
      }
    };
  });
  
  describe('analyze', () => {
    it('should return all three geometric harmony patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(3);
      expect(results.has(PatternType.SACRED_GEOMETRY)).toBe(true);
      expect(results.has(PatternType.SYMMETRY_GROUPS)).toBe(true);
      expect(results.has(PatternType.PLATONIC_SOLIDS)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const [_, score] of results) {
        expect(score.category).toBe(PatternCategory.GEOMETRIC_HARMONY);
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
      
      expect(results.size).toBe(3);
      for (const [_, score] of results) {
        expect(score.score).toBe(0);
        expect(score.detected).toBe(false);
      }
    });
  });
  
  describe('Sacred Geometry Detection', () => {
    it('should detect Euler formula in class hierarchies', async () => {
      // Create a hierarchy that satisfies Euler's formula V - E + F = 2
      const eulerData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['A', { id: 'A', name: 'A', kind: 'class', line: 1, endLine: 10, filePath: 'a.ts' }],
          ['B', { id: 'B', name: 'B', kind: 'class', line: 1, endLine: 10, filePath: 'b.ts' }],
          ['C', { id: 'C', name: 'C', kind: 'class', line: 1, endLine: 10, filePath: 'c.ts' }],
          ['D', { id: 'D', name: 'D', kind: 'class', line: 1, endLine: 10, filePath: 'd.ts' }]
        ]),
        relationships: new Map([
          ['A', ['B', 'C']],
          ['B', ['D']],
          ['C', ['D']],
          ['D', ['A']] // Creates a cycle
        ])
      };
      
      const results = await analyzer.analyze(eulerData);
      const sacredScore = results.get(PatternType.SACRED_GEOMETRY);
      
      expect(sacredScore).toBeDefined();
      expect(sacredScore.evidence.some(e => e.type === 'euler_formula')).toBe(true);
    });
    
    it('should detect vesica piscis ratios (√3)', async () => {
      // Create file structure with √3 ratio
      const sqrt3 = Math.sqrt(3);
      const vesicaData: SemanticData = {
        ...mockSemanticData,
        structure: {
          files: [
            ...Array(10).fill(null).map((_, i) => `src/moduleA/file${i}.ts`),
            ...Array(Math.round(10 * sqrt3)).fill(null).map((_, i) => `src/moduleB/file${i}.ts`)
          ],
          packages: ['moduleA', 'moduleB'],
          namespaces: [],
          modules: ['moduleA', 'moduleB']
        }
      };
      
      const results = await analyzer.analyze(vesicaData);
      const sacredScore = results.get(PatternType.SACRED_GEOMETRY);
      
      expect(sacredScore).toBeDefined();
      expect(sacredScore.evidence.some(e => e.type === 'vesica_piscis')).toBe(true);
    });
    
    it('should detect sacred proportions in module structure', async () => {
      const phi = (1 + Math.sqrt(5)) / 2;
      
      // Create symbols with golden ratio proportions
      const symbols = new Map();
      
      // Module A: 8 symbols
      for (let i = 0; i < 8; i++) {
        symbols.set(`modA_${i}`, {
          id: `modA_${i}`,
          name: `funcA${i}`,
          kind: 'function',
          line: i * 10,
          endLine: i * 10 + 5,
          filePath: 'src/moduleA/index.ts'
        });
      }
      
      // Module B: 13 symbols (Fibonacci, ~8 * phi)
      for (let i = 0; i < 13; i++) {
        symbols.set(`modB_${i}`, {
          id: `modB_${i}`,
          name: `funcB${i}`,
          kind: 'function',
          line: i * 10,
          endLine: i * 10 + 5,
          filePath: 'src/moduleB/index.ts'
        });
      }
      
      const sacredData: SemanticData = {
        ...mockSemanticData,
        symbols,
        structure: {
          ...mockSemanticData.structure,
          modules: ['moduleA', 'moduleB']
        }
      };
      
      const results = await analyzer.analyze(sacredData);
      const sacredScore = results.get(PatternType.SACRED_GEOMETRY);
      
      expect(sacredScore.score).toBeGreaterThan(0);
      expect(sacredScore.detected).toBe(false); // Since the score is low
      expect(sacredScore.evidence.some(e => e.type === 'sacred_proportion')).toBe(true);
    });
  });
  
  describe('Symmetry Groups Detection', () => {
    it('should detect rotational symmetry in method patterns', async () => {
      // Create class with rotational symmetry pattern (get/set/validate)
      const rotationalData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['UserClass', {
            id: 'UserClass',
            name: 'UserClass',
            kind: 'class',
            line: 1,
            endLine: 100,
            filePath: 'src/user.ts'
          }],
          ['getName', {
            id: 'getName',
            name: 'getName',
            kind: 'method',
            containerName: 'UserClass',
            line: 10,
            endLine: 15,
            filePath: 'src/user.ts'
          }],
          ['setName', {
            id: 'setName',
            name: 'setName',
            kind: 'method',
            containerName: 'UserClass',
            line: 20,
            endLine: 25,
            filePath: 'src/user.ts'
          }],
          ['validateName', {
            id: 'validateName',
            name: 'validateName',
            kind: 'method',
            containerName: 'UserClass',
            line: 30,
            endLine: 35,
            filePath: 'src/user.ts'
          }],
          ['getEmail', {
            id: 'getEmail',
            name: 'getEmail',
            kind: 'method',
            containerName: 'UserClass',
            line: 40,
            endLine: 45,
            filePath: 'src/user.ts'
          }],
          ['setEmail', {
            id: 'setEmail',
            name: 'setEmail',
            kind: 'method',
            containerName: 'UserClass',
            line: 50,
            endLine: 55,
            filePath: 'src/user.ts'
          }],
          ['validateEmail', {
            id: 'validateEmail',
            name: 'validateEmail',
            kind: 'method',
            containerName: 'UserClass',
            line: 60,
            endLine: 65,
            filePath: 'src/user.ts'
          }]
        ])
      };
      
      const results = await analyzer.analyze(rotationalData);
      const symmetryScore = results.get(PatternType.SYMMETRY_GROUPS);
      
      expect(symmetryScore).toBeDefined();
      expect(symmetryScore.score).toBeGreaterThan(0.5);
      expect(symmetryScore.evidence.some(e => e.type === 'rotational_symmetry')).toBe(true);
    });
    
    it('should detect reflection symmetry in relationships', async () => {
      // Create symmetric bidirectional relationships
      const reflectionData: SemanticData = {
        ...mockSemanticData,
        relationships: new Map([
          ['A', ['B', 'C']],
          ['B', ['A', 'C']], // B points back to A (symmetric)
          ['C', ['A', 'B']]  // C points back to both (symmetric)
        ])
      };
      
      const results = await analyzer.analyze(reflectionData);
      const symmetryScore = results.get(PatternType.SYMMETRY_GROUPS);
      
      expect(symmetryScore).toBeDefined();
      expect(symmetryScore.evidence.some(e => e.type === 'reflection_symmetry')).toBe(true);
    });
    
    it('should classify dihedral groups', async () => {
      // Create package with multiple classes (forms dihedral group)
      const symbols = new Map();
      
      // Create 6 classes in a package (D6 group)
      for (let i = 0; i < 6; i++) {
        symbols.set(`Class${i}`, {
          id: `Class${i}`,
          name: `Class${i}`,
          kind: 'class',
          line: 1,
          endLine: 50,
          filePath: `src/geometry/class${i}.ts`
        });
      }
      
      const dihedralData: SemanticData = {
        ...mockSemanticData,
        symbols,
        structure: {
          ...mockSemanticData.structure,
          packages: ['geometry']
        }
      };
      
      const results = await analyzer.analyze(dihedralData);
      const symmetryScore = results.get(PatternType.SYMMETRY_GROUPS);
      
      expect(symmetryScore).toBeDefined();
      expect(symmetryScore.evidence.some(e => e.type === 'dihedral_group')).toBe(true);
    });
  });
  
  describe('Platonic Solids Detection', () => {
    it('should detect cube-octahedron duality', async () => {
      // Create two packages with 8 and 6 classes respectively
      const symbols = new Map();
      
      // Package 1: 8 classes (cube vertices)
      for (let i = 0; i < 8; i++) {
        symbols.set(`Cube${i}`, {
          id: `Cube${i}`,
          name: `CubeClass${i}`,
          kind: 'class',
          line: 1,
          endLine: 50,
          filePath: `src/cube/class${i}.ts`
        });
      }
      
      // Package 2: 6 classes (octahedron vertices)
      for (let i = 0; i < 6; i++) {
        symbols.set(`Octa${i}`, {
          id: `Octa${i}`,
          name: `OctaClass${i}`,
          kind: 'class',
          line: 1,
          endLine: 50,
          filePath: `src/octa/class${i}.ts`
        });
      }
      
      const dualData: SemanticData = {
        ...mockSemanticData,
        symbols,
        structure: {
          ...mockSemanticData.structure,
          packages: ['cube', 'octa']
        }
      };
      
      const results = await analyzer.analyze(dualData);
      const platonicScore = results.get(PatternType.PLATONIC_SOLIDS);
      
      expect(platonicScore).toBeDefined();
      expect(platonicScore.score).toBeGreaterThan(0);
      expect(platonicScore.evidence.some(e => e.type === 'dual_relationship')).toBe(true);
    });
    
    it('should detect volume/surface ratios matching Platonic solids', async () => {
      // Create package with specific symbol/file ratio
      const symbols = new Map();
      
      // 20 symbols across 6 files (~3.33 ratio, close to icosahedron)
      for (let i = 0; i < 20; i++) {
        const fileIndex = Math.floor(i / 4);
        symbols.set(`sym${i}`, {
          id: `sym${i}`,
          name: `symbol${i}`,
          kind: 'function',
          line: (i % 4) * 20,
          endLine: (i % 4) * 20 + 15,
          filePath: `src/platonic/file${fileIndex}.ts`
        });
      }
      
      const ratioData: SemanticData = {
        ...mockSemanticData,
        symbols,
        structure: {
          ...mockSemanticData.structure,
          packages: ['platonic']
        }
      };
      
      const results = await analyzer.analyze(ratioData);
      const platonicScore = results.get(PatternType.PLATONIC_SOLIDS);
      
      expect(platonicScore).toBeDefined();
      expect(platonicScore.evidence.some(e => e.type === 'platonic_ratio')).toBe(true);
    });
    
    it('should detect 3D structural patterns', async () => {
      // Create class with tetrahedron structure (4 vertices)
      const symbols = new Map([
        ['TetraClass', {
          id: 'TetraClass',
          name: 'TetrahedronClass',
          kind: 'class',
          line: 1,
          endLine: 100,
          filePath: 'src/shapes/tetra.ts'
        }],
        ['vertex1', {
          id: 'vertex1',
          name: 'topVertex',
          kind: 'method',
          containerName: 'TetrahedronClass',
          line: 10,
          endLine: 20,
          filePath: 'src/shapes/tetra.ts'
        }],
        ['vertex2', {
          id: 'vertex2',
          name: 'baseVertex1',
          kind: 'method',
          containerName: 'TetrahedronClass',
          line: 25,
          endLine: 35,
          filePath: 'src/shapes/tetra.ts'
        }],
        ['vertex3', {
          id: 'vertex3',
          name: 'baseVertex2',
          kind: 'method',
          containerName: 'TetrahedronClass',
          line: 40,
          endLine: 50,
          filePath: 'src/shapes/tetra.ts'
        }]
      ]);
      
      const tetraData: SemanticData = {
        ...mockSemanticData,
        symbols,
        relationships: new Map([
          ['TetraClass', ['vertex1', 'vertex2', 'vertex3']]
        ])
      };
      
      const results = await analyzer.analyze(tetraData);
      const platonicScore = results.get(PatternType.PLATONIC_SOLIDS);
      
      expect(platonicScore).toBeDefined();
      expect(platonicScore.evidence.some(e => e.type === '3d_structure')).toBe(true);
      expect(platonicScore.evidence.some(e => e.description.includes('tetrahedron'))).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle circular dependencies without infinite loops', async () => {
      const circularData: SemanticData = {
        ...mockSemanticData,
        relationships: new Map([
          ['A', ['B']],
          ['B', ['C']],
          ['C', ['A']] // Circular reference
        ])
      };
      
      const results = await analyzer.analyze(circularData);
      expect(results).toBeDefined();
      expect(results.size).toBe(3);
    });
    
    it('should handle very large hierarchies efficiently', async () => {
      const largeSymbols = new Map();
      const largeRelationships = new Map();
      
      // Create 100 classes with relationships
      for (let i = 0; i < 100; i++) {
        largeSymbols.set(`Class${i}`, {
          id: `Class${i}`,
          name: `Class${i}`,
          kind: 'class',
          line: i * 100,
          endLine: i * 100 + 90,
          filePath: `src/large/class${i}.ts`
        });
        
        if (i > 0) {
          largeRelationships.set(`Class${i}`, [`Class${i-1}`]);
        }
      }
      
      const largeData: SemanticData = {
        symbols: largeSymbols,
        relationships: largeRelationships,
        behaviors: {
          executionFlows: [],
          dataFlows: [],
          controlFlows: []
        },
        structure: {
          files: Array.from(largeSymbols.values()).map(s => s.filePath),
          packages: ['large'],
          namespaces: [],
          modules: []
        }
      };
      
      const startTime = Date.now();
      const results = await analyzer.analyze(largeData);
      const duration = Date.now() - startTime;
      
      expect(results.size).toBe(3);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
    
    it('should handle symbols with missing properties', async () => {
      const incompleteData: SemanticData = {
        ...mockSemanticData,
        symbols: new Map([
          ['incomplete', {
            id: 'incomplete',
            name: 'IncompleteSymbol',
            kind: 'function',
            line: 1,
            // Missing endLine
            filePath: 'src/incomplete.ts'
            // Missing other properties
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
    it('should provide meaningful evidence for all detected patterns', async () => {
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
    
    it('should calculate confidence intervals correctly', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const [_, score] of results) {
        expect(score.confidence).toBeGreaterThanOrEqual(0);
        expect(score.confidence).toBeLessThanOrEqual(1);
        
        // Confidence should correlate with evidence
        if (score.evidence.length === 0) {
          expect(score.confidence).toBe(0);
        } else if (score.evidence.length > 3) {
          expect(score.confidence).toBeGreaterThan(0.5);
        }
      }
    });
  });
});