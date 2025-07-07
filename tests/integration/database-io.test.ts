/**
 * Database IO Integration Tests
 * Tests real database operations across all storage systems
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { StorageManager } from '../../src/storage/storage-manager.js';
import { DuckDBDataLake } from '../../src/datalake/duckdb-data-lake.js';
import { MCPPatternGateway } from '../../src/mcp/gateway/mcp-pattern-gateway.js';
import { createProductionQuantumMemory } from '../../src/memory/quantum-memory-factory.js';
import { PatternCategory, HarmonicPatternMemory } from '../../src/memory/types.js';
import { performance } from 'perf_hooks';

describe('Database IO Integration Tests', () => {
  let storageManager: StorageManager;
  let duckdb: DuckDBDataLake;
  let mcpGateway: MCPPatternGateway;
  let testPatterns: HarmonicPatternMemory[];

  beforeAll(async () => {
    // Initialize all storage systems
    storageManager = new StorageManager();
    await storageManager.connect();
    
    duckdb = new DuckDBDataLake();
    await duckdb.initialize();
    
    mcpGateway = new MCPPatternGateway(storageManager);
    
    // Generate test patterns
    testPatterns = generateTestPatterns(100);
    
    // Store test patterns
    await duckdb.batchInsertPatterns(testPatterns);
    await storageManager.storePatterns(testPatterns.slice(0, 20)); // Store subset in other DBs
  }, 30000);

  afterAll(async () => {
    await duckdb.close();
    await storageManager.disconnect();
  });

  describe('DuckDB Operations', () => {
    test('should insert and retrieve patterns', async () => {
      const newPattern = generateTestPatterns(1)[0];
      await duckdb.batchInsertPatterns([newPattern]);
      
      const results = await duckdb.queryTimeRange({
        startTime: new Date(Date.now() - 60000),
        endTime: new Date()
      });
      
      expect(results.length).toBeGreaterThan(0);
    });

    test('should perform time-series queries', async () => {
      const results = await duckdb.queryTimeRange({
        startTime: new Date(Date.now() - 3600000), // Last hour
        endTime: new Date(),
        categories: [PatternCategory.AUTHENTICATION]
      });
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(r => {
        expect(r).toHaveProperty('timestamp');
        expect(r).toHaveProperty('category');
      });
    });

    test('should aggregate patterns by category', async () => {
      const aggregation = await duckdb.aggregatePatterns({
        groupBy: 'category',
        metrics: ['count', 'avg_strength']
      });
      
      expect(aggregation.length).toBeGreaterThan(0);
      aggregation.forEach(agg => {
        expect(agg).toHaveProperty('category');
        expect(agg).toHaveProperty('count');
        expect(agg).toHaveProperty('avg_strength');
      });
    });

    test('should handle large batch inserts', async () => {
      const largePatternSet = generateTestPatterns(1000);
      const startTime = performance.now();
      
      await duckdb.batchInsertPatterns(largePatternSet);
      
      const insertTime = performance.now() - startTime;
      const patternsPerSecond = 1000 / (insertTime / 1000);
      
      expect(patternsPerSecond).toBeGreaterThan(5000); // Should handle >5k patterns/sec
    });
  });

  describe('Neo4j Operations', () => {
    test('should create and find similar patterns', async () => {
      if (!storageManager.neo4j) {
        test.skip();
        return;
      }
      
      const pattern = testPatterns[0];
      await storageManager.neo4j.createPattern(pattern);
      
      const similar = await storageManager.neo4j.findSimilarPatterns(
        pattern.id,
        0.5
      );
      
      expect(Array.isArray(similar)).toBe(true);
    });

    test('should get patterns by category', async () => {
      if (!storageManager.neo4j) {
        test.skip();
        return;
      }
      
      const patterns = await storageManager.neo4j.getPatternsByCategory(
        PatternCategory.STRUCTURAL
      );
      
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('QPFM Operations', () => {
    test.skipIf(!storageManager.qpfm)('should store and query patterns with quantum interference', async () => {
      
      const pattern = testPatterns[0];
      await storageManager.qpfm.store(pattern);
      
      const result = await storageManager.qpfm.query({
        type: 'precision',
        harmonicSignature: pattern.harmonicProperties,
        confidence: 0.8,
        exploration: 0.2
      });
      
      expect(result).toHaveProperty('memories');
      expect(result).toHaveProperty('interferencePatterns');
      expect(result.coherenceLevel).toBeGreaterThan(0);
    });

    test.skipIf(!storageManager.qpfm)('should find similar patterns using quantum similarity', async () => {
      
      const pattern = testPatterns[0];
      const similar = await storageManager.qpfm.findSimilar(
        pattern.id,
        { minSimilarity: 0.3, maxResults: 5 }
      );
      
      expect(Array.isArray(similar)).toBe(true);
      expect(similar.length).toBeLessThanOrEqual(5);
    });
  });

  describe('MCP Gateway Operations', () => {
    test('should handle unified queries across all storage systems', async () => {
      const result = await mcpGateway.handleMCPRequest({
        type: 'unified',
        query: 'test patterns',
        filters: {
          categories: [PatternCategory.STRUCTURAL]
        },
        limit: 10
      });
      
      expect(result).toBeDefined();
      expect(result.memories).toBeDefined();
    });

    test('should route time-series queries to DuckDB', async () => {
      const result = await mcpGateway.handleMCPRequest({
        type: 'time_series',
        timeRange: {
          start: new Date(Date.now() - 3600000),
          end: new Date()
        }
      });
      
      expect(result).toBeDefined();
      expect(result.memories).toBeDefined();
    });

    test('should handle similarity searches', async () => {
      const result = await mcpGateway.handleMCPRequest({
        type: 'similarity',
        pattern: testPatterns[0],
        minSimilarity: 0.5
      });
      
      expect(result).toBeDefined();
      expect(result.memories).toBeDefined();
    });
  });

  describe('Cross-Database Consistency', () => {
    test('should maintain consistency across storage systems', async () => {
      const testPattern = generateTestPatterns(1)[0];
      testPattern.id = `consistency_test_${Date.now()}`;
      
      // Store in all systems
      await storageManager.storePattern(testPattern);
      await duckdb.batchInsertPatterns([testPattern]);
      
      // Query from MCP gateway (should find in multiple systems)
      const result = await mcpGateway.handleMCPRequest({
        type: 'unified',
        query: testPattern.id
      });
      
      expect(result.memories).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance targets', async () => {
      const benchmarks = {
        duckdbInsert: 0,
        duckdbQuery: 0,
        neo4jQuery: 0,
        qpfmQuery: 0,
        mcpUnified: 0
      };
      
      // DuckDB insert benchmark
      const insertPatterns = generateTestPatterns(100);
      let start = performance.now();
      await duckdb.batchInsertPatterns(insertPatterns);
      benchmarks.duckdbInsert = performance.now() - start;
      
      // DuckDB query benchmark
      start = performance.now();
      await duckdb.queryTimeRange({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date()
      });
      benchmarks.duckdbQuery = performance.now() - start;
      
      // Neo4j query benchmark (if available)
      if (storageManager.neo4j) {
        start = performance.now();
        await storageManager.neo4j.getPatternsByCategory(PatternCategory.STRUCTURAL);
        benchmarks.neo4jQuery = performance.now() - start;
      }
      
      // QPFM query benchmark (if available)
      if (storageManager.qpfm) {
        start = performance.now();
        await storageManager.qpfm.query('test');
        benchmarks.qpfmQuery = performance.now() - start;
      }
      
      // MCP unified query benchmark
      start = performance.now();
      await mcpGateway.handleMCPRequest({
        type: 'unified',
        query: 'benchmark test'
      });
      benchmarks.mcpUnified = performance.now() - start;
      
      // Performance assertions
      expect(benchmarks.duckdbInsert).toBeLessThan(100); // <100ms for 100 patterns
      expect(benchmarks.duckdbQuery).toBeLessThan(50);   // <50ms for queries
      expect(benchmarks.mcpUnified).toBeLessThan(100);   // <100ms for unified queries
      
      console.log('Performance Benchmarks:', benchmarks);
    });
  });
});

/**
 * Generate test patterns
 */
function generateTestPatterns(count: number): HarmonicPatternMemory[] {
  const patterns: HarmonicPatternMemory[] = [];
  const categories = Object.values(PatternCategory);
  
  for (let i = 0; i < count; i++) {
    patterns.push({
      id: `test_pattern_${Date.now()}_${i}`,
      coordinates: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
      content: {
        title: `Test Pattern ${i}`,
        description: `Test pattern for integration testing`,
        type: 'test',
        tags: ['test', 'integration'],
        data: { index: i }
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: Math.random(),
      harmonicProperties: {
        category: categories[i % categories.length],
        strength: Math.random(),
        occurrences: Math.floor(Math.random() * 10) + 1,
        confidence: 0.5 + Math.random() * 0.5,
        complexity: Math.floor(Math.random() * 10) + 1
      },
      locations: [{
        file: `test/file${i}.ts`,
        startLine: i * 10,
        endLine: i * 10 + 10
      }],
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    });
  }
  
  return patterns;
}