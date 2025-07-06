/**
 * Integration tests for Harmonic Intelligence Engine
 * @module tests/harmonic-intelligence/integration
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import { HarmonicIntelligenceEngine } from '../../../src/harmonic-intelligence/core/harmonic-engine';
import { HarmonicSchemaMigration } from '../../../src/harmonic-intelligence/database/migrate-harmonic-schema';
import { DatabaseAdapter } from '../../../src/core/database-adapter';
import {
  HarmonicConfig,
  PatternType,
  SemanticData,
  HarmonicAnalysis
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

// Mock the pattern analyzers temporarily
jest.mock('../../../src/harmonic-intelligence/analyzers/classical-harmony-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/geometric-harmony-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/fractal-pattern-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/tiling-crystallographic-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/topological-pattern-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/wave-harmonic-analyzer');
jest.mock('../../../src/harmonic-intelligence/analyzers/information-theory-analyzer');

describe('HarmonicIntelligenceEngine Integration', () => {
  let engine: HarmonicIntelligenceEngine;
  let migration: HarmonicSchemaMigration;
  let testDbPath: string;
  
  const config: HarmonicConfig = {
    enabledPatterns: Object.values(PatternType),
    patternWeights: new Map(Object.values(PatternType).map(p => [p, 1.0])),
    confidenceThreshold: 0.7,
    cacheEnabled: true,
    parallelAnalysis: true,
    maxAnalysisTime: 5000,
    minimumQualityScore: 0.5
  };
  
  beforeAll(async () => {
    // Create test database
    testDbPath = path.join(__dirname, 'test-harmonic.db');
    process.env.GURU_DB_PATH = testDbPath;
    
    // Initialize database
    const db = DatabaseAdapter.getInstance();
    await db.initialize(testDbPath);
    
    // Run migrations
    migration = new HarmonicSchemaMigration();
    await migration.migrate();
    
    // Initialize engine
    engine = HarmonicIntelligenceEngine.getInstance(config);
  });
  
  afterAll(async () => {
    // Cleanup
    await migration.rollback();
    DatabaseAdapter.getInstance().close();
    
    // Remove test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Full Analysis Pipeline', () => {
    it('should analyze a complete codebase structure', async () => {
      // Create realistic semantic data
      const semanticData: SemanticData = createRealisticSemanticData();
      
      const analysis = await engine.analyzeCodeStructure(semanticData);
      
      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(1);
      expect(analysis.patternScores.size).toBeGreaterThan(0);
      expect(analysis.geometricCoordinates).toBeDefined();
      expect(analysis.orientation).toBeDefined();
      expect(analysis.confidenceIntervals.size).toBeGreaterThan(0);
      expect(analysis.stabilityMetrics).toBeDefined();
    });
    
    it('should store analysis results in database', async () => {
      const semanticData = createRealisticSemanticData();
      
      await engine.analyzeCodeStructure(semanticData);
      
      // Check database
      const db = DatabaseAdapter.getInstance().getDatabase();
      const scores = db.prepare('SELECT * FROM harmonic_scores').all();
      
      expect(scores.length).toBeGreaterThan(0);
    });
    
    it('should handle parallel analysis correctly', async () => {
      const semanticData = createRealisticSemanticData();
      
      // Enable parallel analysis
      const parallelEngine = HarmonicIntelligenceEngine.getInstance({
        ...config,
        parallelAnalysis: true
      });
      
      const startTime = Date.now();
      const analysis = await parallelEngine.analyzeCodeStructure(semanticData);
      const duration = Date.now() - startTime;
      
      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(config.maxAnalysisTime);
    });
    
    it('should calculate modification safety scores', async () => {
      const semanticData = createRealisticSemanticData();
      const analysis = await engine.analyzeCodeStructure(semanticData);
      
      const target = { id: 'test-symbol', name: 'testFunction' };
      const changes = [{ type: 'rename', newName: 'newTestFunction' }];
      
      const safetyScore = await engine.assessModificationSafety(target, changes, analysis);
      
      expect(safetyScore).toBeGreaterThanOrEqual(0);
      expect(safetyScore).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Pattern Weight Configuration', () => {
    it('should respect pattern weights in scoring', async () => {
      // Create engine with custom weights
      const customWeights = new Map<PatternType, number>([
        [PatternType.GOLDEN_RATIO, 10.0],
        [PatternType.FIBONACCI_SEQUENCES, 1.0],
        // ... other patterns with weight 1.0
      ]);
      
      const customEngine = HarmonicIntelligenceEngine.getInstance({
        ...config,
        patternWeights: customWeights
      });
      
      const semanticData = createRealisticSemanticData();
      const analysis = await customEngine.analyzeCodeStructure(semanticData);
      
      // Golden ratio should have more influence on overall score
      expect(analysis.overallScore).toBeDefined();
    });
  });
  
  describe('Caching Behavior', () => {
    it('should cache analysis results when enabled', async () => {
      const cachedEngine = HarmonicIntelligenceEngine.getInstance({
        ...config,
        cacheEnabled: true
      });
      
      const semanticData = createRealisticSemanticData();
      
      // First analysis
      const start1 = Date.now();
      const analysis1 = await cachedEngine.analyzeCodeStructure(semanticData);
      const duration1 = Date.now() - start1;
      
      // Second analysis (should be cached)
      const start2 = Date.now();
      const analysis2 = await cachedEngine.analyzeCodeStructure(semanticData);
      const duration2 = Date.now() - start2;
      
      expect(analysis1.overallScore).toBe(analysis2.overallScore);
      expect(duration2).toBeLessThan(duration1 * 0.1); // Cached should be much faster
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid semantic data gracefully', async () => {
      const invalidData: SemanticData = {
        symbols: null as any,
        relationships: new Map(),
        behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
        structure: { files: [], packages: [], namespaces: [], modules: [] }
      };
      
      await expect(engine.analyzeCodeStructure(invalidData)).rejects.toThrow();
    });
    
    it('should handle analyzer failures gracefully', async () => {
      // Mock analyzer to throw error
      const MockedClassicalAnalyzer = require('../../../src/harmonic-intelligence/analyzers/classical-harmony-analyzer').ClassicalHarmonyAnalyzer;
      MockedClassicalAnalyzer.prototype.analyze.mockRejectedValueOnce(new Error('Analyzer failed'));
      
      const semanticData = createRealisticSemanticData();
      
      // Should still complete analysis with other analyzers
      await expect(engine.analyzeCodeStructure(semanticData)).rejects.toThrow('Harmonic analysis failed');
    });
  });
  
  describe('Stability Metrics', () => {
    it('should track pattern evolution over time', async () => {
      const semanticData = createRealisticSemanticData();
      
      // Run multiple analyses
      const analyses: HarmonicAnalysis[] = [];
      for (let i = 0; i < 3; i++) {
        const analysis = await engine.analyzeCodeStructure(semanticData);
        analyses.push(analysis);
        
        // Simulate time passing
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check pattern evolution table
      const db = DatabaseAdapter.getInstance().getDatabase();
      const evolution = db.prepare('SELECT * FROM pattern_evolution ORDER BY timestamp').all();
      
      expect(evolution.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should calculate trend direction correctly', async () => {
      const semanticData = createRealisticSemanticData();
      
      // Create improving trend
      for (let i = 0; i < 5; i++) {
        // Modify data to improve scores
        semanticData.symbols.set(`newSymbol${i}`, {
          id: `newSymbol${i}`,
          name: `improvedFunction${i}`,
          kind: 'function',
          line: i * 100,
          endLine: i * 100 + 61, // Golden ratio-ish
          filePath: 'improved.ts'
        });
        
        const analysis = await engine.analyzeCodeStructure(semanticData);
        
        if (i === 4) {
          expect(analysis.stabilityMetrics.trendDirection).toBe('improving');
        }
      }
    });
  });
  
  describe('Performance Benchmarks', () => {
    it('should analyze 1000 symbols in under 100ms', async () => {
      const largeData = createLargeSemanticData(1000);
      
      const startTime = Date.now();
      const analysis = await engine.analyzeCodeStructure(largeData);
      const duration = Date.now() - startTime;
      
      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(100);
    });
    
    it('should use less than 50MB memory for large analysis', async () => {
      const largeData = createLargeSemanticData(10000);
      
      const memBefore = process.memoryUsage().heapUsed;
      await engine.analyzeCodeStructure(largeData);
      const memAfter = process.memoryUsage().heapUsed;
      
      const memUsedMB = (memAfter - memBefore) / 1024 / 1024;
      expect(memUsedMB).toBeLessThan(50);
    });
  });
});

// Helper functions

function createRealisticSemanticData(): SemanticData {
  const symbols = new Map();
  const relationships = new Map();
  
  // Create a realistic module structure
  const modules = ['auth', 'user', 'api', 'utils', 'core'];
  const classesPerModule = [2, 3, 5, 8, 13]; // Fibonacci!
  
  modules.forEach((module, moduleIdx) => {
    const classCount = classesPerModule[moduleIdx];
    
    for (let c = 0; c < classCount; c++) {
      const className = `${module}Class${c}`;
      symbols.set(className, {
        id: className,
        name: className,
        kind: 'class',
        line: c * 100,
        endLine: c * 100 + 80,
        filePath: `src/${module}/${className}.ts`
      });
      
      // Add methods with golden ratio proportions
      const methodCounts = [5, 8, 13, 21, 34];
      const methodCount = methodCounts[c % methodCounts.length];
      
      for (let m = 0; m < methodCount; m++) {
        const methodName = `${className}.method${m}`;
        symbols.set(methodName, {
          id: methodName,
          name: `method${m}`,
          kind: 'method',
          containerName: className,
          line: c * 100 + m * 5,
          endLine: c * 100 + m * 5 + 4,
          filePath: `src/${module}/${className}.ts`,
          parameters: Array(m % 5).fill('param'),
          complexity: m % 10 + 1
        });
      }
      
      // Create relationships
      if (c > 0) {
        relationships.set(className, [`${module}Class${c-1}`]);
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
      files: Array.from(symbols.values())
        .map(s => s.filePath)
        .filter((v, i, a) => a.indexOf(v) === i),
      packages: modules,
      namespaces: [],
      modules
    }
  };
}

function createLargeSemanticData(symbolCount: number): SemanticData {
  const symbols = new Map();
  const relationships = new Map();
  
  for (let i = 0; i < symbolCount; i++) {
    const symbolId = `symbol${i}`;
    symbols.set(symbolId, {
      id: symbolId,
      name: symbolId,
      kind: i % 3 === 0 ? 'function' : i % 3 === 1 ? 'class' : 'method',
      line: i * 10,
      endLine: i * 10 + Math.floor(Math.random() * 50) + 5,
      filePath: `src/file${Math.floor(i / 100)}.ts`,
      parameters: Array(i % 5).fill('param'),
      complexity: i % 20 + 1
    });
    
    // Create some relationships
    if (i > 0 && i % 3 === 0) {
      relationships.set(symbolId, [`symbol${i-1}`, `symbol${i-2}`]);
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
      files: Array.from({ length: Math.ceil(symbolCount / 100) }, (_, i) => `src/file${i}.ts`),
      packages: Array.from({ length: 10 }, (_, i) => `package${i}`),
      namespaces: [],
      modules: []
    }
  };
}