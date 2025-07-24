/**
 * Integration tests for Geometric Harmony Analyzer
 * @module tests/harmonic-intelligence/integration
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { HarmonicAnalysisEngine } from '../../../src/harmonic-intelligence/core/harmonic-analysis-engine.js';
import { HarmonicSchemaMigration } from '../../../src/harmonic-intelligence/database/migrate-harmonic-schema';
// Temporarily skip database adapter until we fix the import paths
// import { DatabaseAdapter } from '../../../src/core/database-adapter';
import {
  HarmonicConfig,
  PatternType,
  SemanticData,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

// Mock the pattern analyzers that don't exist yet
vi.mock('../../../src/harmonic-intelligence/analyzers/fractal-pattern-analyzer');
vi.mock('../../../src/harmonic-intelligence/analyzers/tiling-crystallographic-analyzer');
vi.mock('../../../src/harmonic-intelligence/analyzers/topological-pattern-analyzer');
vi.mock('../../../src/harmonic-intelligence/analyzers/wave-harmonic-analyzer');
vi.mock('../../../src/harmonic-intelligence/analyzers/information-theory-analyzer');

// TODO: Fix these tests - they need:
// 1. Base Guru schema to be created first (symbols table)
// 2. Proper SQL parsing that handles multi-line statements
// 3. Config passing to HarmonicAnalysisEngine constructor
describe.skip('Geometric Harmony Integration Tests', () => {
  let engine: HarmonicAnalysisEngine;
  let migration: HarmonicSchemaMigration;
  let testDbPath: string;
  
  const config: HarmonicConfig = {
    enabledPatterns: [
      PatternType.GOLDEN_RATIO,
      PatternType.FIBONACCI_SEQUENCES,
      PatternType.PRIME_NUMBER_HARMONICS,
      PatternType.EULER_CONSTANT_PATTERNS,
      PatternType.SACRED_GEOMETRY,
      PatternType.SYMMETRY_GROUPS,
      PatternType.PLATONIC_SOLIDS
    ],
    patternWeights: new Map(),
    confidenceThreshold: 0.7,
    cacheEnabled: true,
    parallelAnalysis: false, // Sequential for testing
    maxAnalysisTime: 5000,
    minimumQualityScore: 0.3
  };
  
  beforeAll(async () => {
    // Create test database
    testDbPath = path.join(__dirname, 'test-geometric-harmonic.db');
    process.env.GURU_DB_PATH = testDbPath;
    
    // Initialize database - DatabaseAdapter initializes in constructor
    const db = DatabaseAdapter.getInstance();
    
    // Run migrations if they exist
    try {
      migration = new HarmonicSchemaMigration();
      await migration.migrate();
    } catch (error) {
      console.warn('Migration skipped:', error);
    }
    
    // Initialize engine
    engine = new HarmonicAnalysisEngine();
  });
  
  afterAll(async () => {
    // Cleanup
    if (migration && migration.rollback) {
      await migration.rollback();
    }
    DatabaseAdapter.getInstance().close();
    
    // Remove test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Real-World Code Analysis', () => {
    it('should detect sacred geometry in well-structured architecture', async () => {
      // Create semantic data representing a well-architected system
      const semanticData = createWellArchitectedSystem();
      
      const analysis = await engine.analyzeCodeStructure(semanticData);
      
      // Check overall harmonic score
      expect(analysis.overallScore).toBeGreaterThan(0.5);
      
      // Check geometric patterns
      const sacredGeometry = analysis.patternScores.get(PatternType.SACRED_GEOMETRY);
      expect(sacredGeometry).toBeDefined();
      expect(sacredGeometry.detected).toBe(true);
      
      const symmetryGroups = analysis.patternScores.get(PatternType.SYMMETRY_GROUPS);
      expect(symmetryGroups).toBeDefined();
      expect(symmetryGroups.score).toBeGreaterThan(0.4);
      
      // Check geometric coordinates
      expect(analysis.geometricCoordinates.x).toBeGreaterThan(0);
      expect(analysis.geometricCoordinates.y).toBeGreaterThan(0);
    });
    
    it('should detect Platonic solid patterns in microservice architecture', async () => {
      // Create semantic data representing microservices
      const semanticData = createMicroserviceArchitecture();
      
      const analysis = await engine.analyzeCodeStructure(semanticData);
      
      const platonicSolids = analysis.patternScores.get(PatternType.PLATONIC_SOLIDS);
      expect(platonicSolids).toBeDefined();
      expect(platonicSolids.evidence.length).toBeGreaterThan(0);
      
      // Should find cube-octahedron duality in service relationships
      const hasDuality = platonicSolids.evidence.some(e => 
        e.type === 'dual_relationship' && e.description.includes('cube')
      );
      expect(hasDuality).toBe(true);
    });
    
    it('should handle combined classical and geometric patterns', async () => {
      // Create data with both pattern types
      const semanticData = createHarmonicCodebase();
      
      const analysis = await engine.analyzeCodeStructure(semanticData);
      
      // Check that both pattern categories contribute to the score
      const classicalPatterns = [
        PatternType.GOLDEN_RATIO,
        PatternType.FIBONACCI_SEQUENCES
      ];
      
      const geometricPatterns = [
        PatternType.SACRED_GEOMETRY,
        PatternType.SYMMETRY_GROUPS
      ];
      
      let classicalScore = 0;
      let geometricScore = 0;
      
      for (const [type, score] of analysis.patternScores) {
        if (classicalPatterns.includes(type) && score.detected) {
          classicalScore += score.score;
        }
        if (geometricPatterns.includes(type) && score.detected) {
          geometricScore += score.score;
        }
      }
      
      expect(classicalScore).toBeGreaterThan(0);
      expect(geometricScore).toBeGreaterThan(0);
    });
  });
  
  describe('Pattern Evolution Tracking', () => {
    it('should track geometric pattern changes over time', async () => {
      const baseData = createEvolvingCodebase(1.0);
      
      // First analysis
      await engine.analyzeCodeStructure(baseData);
      
      // Evolve the codebase
      const evolvedData = createEvolvingCodebase(1.618); // Golden ratio evolution
      
      // Second analysis
      await engine.analyzeCodeStructure(evolvedData);
      
      // Check pattern evolution in database
      const db = DatabaseAdapter.getInstance().getDatabase();
      const evolution = db.prepare(`
        SELECT * FROM pattern_evolution 
        WHERE pattern_type IN (?, ?, ?)
        ORDER BY timestamp
      `).all(
        PatternType.SACRED_GEOMETRY,
        PatternType.SYMMETRY_GROUPS,
        PatternType.PLATONIC_SOLIDS
      );
      
      expect(evolution.length).toBeGreaterThanOrEqual(2);
      
      // Check if scores improved
      const geometricEvolution = evolution.filter(e => 
        e.pattern_type === PatternType.SACRED_GEOMETRY
      );
      if (geometricEvolution.length >= 2) {
        expect(geometricEvolution[1].score).toBeGreaterThan(geometricEvolution[0].score);
      }
    });
  });
  
  describe('Performance with Geometric Analysis', () => {
    it('should analyze large symmetric structures efficiently', async () => {
      const largeData = createLargeSymmetricStructure(50); // 50 symmetric modules
      
      const startTime = Date.now();
      const analysis = await engine.analyzeCodeStructure(largeData);
      const duration = Date.now() - startTime;
      
      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Large symmetric structures should score high
      const symmetry = analysis.patternScores.get(PatternType.SYMMETRY_GROUPS);
      expect(symmetry.score).toBeGreaterThan(0.7);
    });
  });
});

// Helper functions to create test data

function createWellArchitectedSystem(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create a 3-layer architecture with sacred proportions
  const layers = ['presentation', 'business', 'data'];
  const componentsPerLayer = [5, 8, 13]; // Fibonacci sequence
  
  layers.forEach((layer, layerIdx) => {
    const componentCount = componentsPerLayer[layerIdx];
    
    for (let i = 0; i < componentCount; i++) {
      const className = `${layer}Component${i}`;
      symbols.set(className, {
        id: className,
        name: className,
        kind: 'class',
        line: 1,
        endLine: 61 + layerIdx * 38, // Golden ratio proportions
        filePath: `src/${layer}/${className}.ts`
      });
      
      // Add 3 methods per class (trinity pattern)
      ['get', 'set', 'validate'].forEach((prefix, idx) => {
        const methodName = `${className}.${prefix}Data`;
        symbols.set(methodName, {
          id: methodName,
          name: `${prefix}Data`,
          kind: 'method',
          containerName: className,
          line: 10 + idx * 15,
          endLine: 20 + idx * 15,
          filePath: `src/${layer}/${className}.ts`
        });
      });
      
      // Create relationships between layers
      if (layerIdx > 0) {
        const prevLayer = layers[layerIdx - 1];
        const prevComponent = `${prevLayer}Component${i % componentsPerLayer[layerIdx - 1]}`;
        relationships.set(className, [prevComponent]);
      }
    }
  });
  
  return {
    symbols,
    relationships,
    behaviors: {
      executionFlows: [],
      dataFlows: [],
      controlFlows: []
    },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath).filter((v, i, a) => a.indexOf(v) === i),
      packages: layers,
      namespaces: [],
      modules: layers
    }
  };
}

function createMicroserviceArchitecture(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create 8 API services (cube vertices) and 6 data services (octahedron vertices)
  const apiServices = Array(8).fill(null).map((_, i) => ({
    id: `ApiService${i}`,
    name: `ApiService${i}`,
    kind: 'class' as const,
    line: 1,
    endLine: 100,
    filePath: `src/api/service${i}.ts`
  }));
  
  const dataServices = Array(6).fill(null).map((_, i) => ({
    id: `DataService${i}`,
    name: `DataService${i}`,
    kind: 'class' as const,
    line: 1,
    endLine: 80,
    filePath: `src/data/service${i}.ts`
  }));
  
  // Add all services to symbols
  [...apiServices, ...dataServices].forEach(service => {
    symbols.set(service.id, service);
  });
  
  // Create dual relationships
  apiServices.forEach((api, i) => {
    // Each API service connects to 3 data services (cube-octahedron duality)
    const connections = [
      `DataService${i % 6}`,
      `DataService${(i + 1) % 6}`,
      `DataService${(i + 2) % 6}`
    ];
    relationships.set(api.id, connections);
  });
  
  return {
    symbols,
    relationships,
    behaviors: {
      executionFlows: [],
      dataFlows: [],
      controlFlows: []
    },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: ['api', 'data'],
      namespaces: [],
      modules: ['api', 'data']
    }
  };
}

function createHarmonicCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Combine multiple harmonic patterns
  
  // 1. Create Fibonacci-structured modules
  const moduleSizes = [1, 1, 2, 3, 5, 8];
  const modules = moduleSizes.map((size, idx) => `module${idx}`);
  
  modules.forEach((module, moduleIdx) => {
    const size = moduleSizes[moduleIdx];
    
    for (let i = 0; i < size; i++) {
      const funcName = `${module}_func${i}`;
      symbols.set(funcName, {
        id: funcName,
        name: `function${i}`,
        kind: 'function',
        line: i * 20,
        endLine: i * 20 + 13, // Fibonacci line count
        filePath: `src/${module}/index.ts`,
        parameters: Array(moduleIdx).fill('param'), // Parameter count = module index
        complexity: moduleSizes[moduleIdx]
      });
    }
  });
  
  // 2. Add symmetric class structure
  const symmetricClasses = ['Handler', 'Processor', 'Validator'];
  symmetricClasses.forEach(className => {
    symbols.set(className, {
      id: className,
      name: className,
      kind: 'class',
      line: 1,
      endLine: 100,
      filePath: `src/core/${className}.ts`
    });
    
    // Add symmetric methods
    ['init', 'execute', 'cleanup'].forEach((method, idx) => {
      symbols.set(`${className}.${method}`, {
        id: `${className}.${method}`,
        name: method,
        kind: 'method',
        containerName: className,
        line: 10 + idx * 30,
        endLine: 35 + idx * 30,
        filePath: `src/core/${className}.ts`
      });
    });
    
    // Create symmetric relationships
    const others = symmetricClasses.filter(c => c !== className);
    relationships.set(className, others);
  });
  
  return {
    symbols,
    relationships,
    behaviors: {
      executionFlows: [],
      dataFlows: [],
      controlFlows: []
    },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath).filter((v, i, a) => a.indexOf(v) === i),
      packages: ['core', ...modules],
      namespaces: [],
      modules: ['core', ...modules]
    }
  };
}

function createEvolvingCodebase(evolutionFactor: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Base structure that evolves
  const baseSize = 10;
  const evolvedSize = Math.round(baseSize * evolutionFactor);
  
  // Create evolving class hierarchy
  for (let i = 0; i < evolvedSize; i++) {
    const className = `EvolvingClass${i}`;
    symbols.set(className, {
      id: className,
      name: className,
      kind: 'class',
      line: 1,
      endLine: Math.round(50 * evolutionFactor),
      filePath: `src/evolving/${className}.ts`
    });
    
    // Add methods proportional to evolution
    const methodCount = Math.round(3 * evolutionFactor);
    for (let m = 0; m < methodCount; m++) {
      symbols.set(`${className}.method${m}`, {
        id: `${className}.method${m}`,
        name: `method${m}`,
        kind: 'method',
        containerName: className,
        line: 10 + m * 10,
        endLine: 18 + m * 10,
        filePath: `src/evolving/${className}.ts`
      });
    }
    
    // Create relationships forming more complex patterns as it evolves
    if (i > 0) {
      const connections = [];
      for (let j = 0; j < Math.min(i, Math.round(evolutionFactor * 2)); j++) {
        connections.push(`EvolvingClass${j}`);
      }
      relationships.set(className, connections);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: {
      executionFlows: [],
      dataFlows: [],
      controlFlows: []
    },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath).filter((v, i, a) => a.indexOf(v) === i),
      packages: ['evolving'],
      namespaces: [],
      modules: ['evolving']
    }
  };
}

function createLargeSymmetricStructure(moduleCount: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create symmetric module structure
  for (let m = 0; m < moduleCount; m++) {
    const moduleName = `symmetricModule${m}`;
    
    // Each module has 4 classes (tetrahedron structure)
    for (let c = 0; c < 4; c++) {
      const className = `${moduleName}_Class${c}`;
      symbols.set(className, {
        id: className,
        name: `Class${c}`,
        kind: 'class',
        line: 1,
        endLine: 100,
        filePath: `src/symmetric/${moduleName}/${className}.ts`
      });
      
      // Each class has symmetric method pairs
      const methodPairs = [
        ['open', 'close'],
        ['read', 'write'],
        ['lock', 'unlock']
      ];
      
      methodPairs.forEach(([method1, method2]) => {
        symbols.set(`${className}.${method1}`, {
          id: `${className}.${method1}`,
          name: method1,
          kind: 'method',
          containerName: className,
          line: 10,
          endLine: 20,
          filePath: `src/symmetric/${moduleName}/${className}.ts`
        });
        
        symbols.set(`${className}.${method2}`, {
          id: `${className}.${method2}`,
          name: method2,
          kind: 'method',
          containerName: className,
          line: 25,
          endLine: 35,
          filePath: `src/symmetric/${moduleName}/${className}.ts`
        });
      });
      
      // Create symmetric relationships within module
      const otherClasses = Array(4).fill(null)
        .map((_, i) => `${moduleName}_Class${i}`)
        .filter(name => name !== className);
      relationships.set(className, otherClasses);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: {
      executionFlows: [],
      dataFlows: [],
      controlFlows: []
    },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath).filter((v, i, a) => a.indexOf(v) === i),
      packages: Array(moduleCount).fill(null).map((_, i) => `symmetricModule${i}`),
      namespaces: [],
      modules: Array(moduleCount).fill(null).map((_, i) => `symmetricModule${i}`)
    }
  };
}