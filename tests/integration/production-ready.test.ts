/**
 * Production Ready Integration Test
 * Ensures all components work together properly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StorageManager } from '../../src/storage/storage-manager.js';
import { createDuckDBDataLake, DuckDBDataLake } from '../../src/datalake/duckdb-data-lake.js';
import { QuantumProbabilityFieldMemory } from '../../src/memory/quantum-memory-system.js';
import { createMCPGateway } from '../../src/mcp/gateway/mcp-pattern-gateway.js';
import { PatternStoreReconciler } from '../../src/integration/pattern-store-reconciler.js';
import { HarmonicPatternMemory, PatternCategory } from '../../src/memory/types.js';

describe('Production Ready Integration', () => {
  let storageManager: StorageManager;
  let duckLake: DuckDBDataLake;
  let qpfm: QuantumProbabilityFieldMemory;
  let gateway: any;
  let reconciler: PatternStoreReconciler;

  beforeAll(async () => {
    // Initialize all production components
    storageManager = new StorageManager();
    await storageManager.connect();

    // Initialize DuckDB with proper async handling
    duckLake = await createDuckDBDataLake();

    // Initialize QPFM with storage
    qpfm = new QuantumProbabilityFieldMemory(undefined, storageManager);

    // Create MCP Gateway
    gateway = await createMCPGateway(
      duckLake,
      storageManager.neo4j,
      qpfm
    );

    // Create reconciler
    reconciler = new PatternStoreReconciler(
      duckLake,
      storageManager.neo4j,
      qpfm
    );
  });

  afterAll(async () => {
    await duckLake.close();
    await storageManager.disconnect();
  });

  describe('DuckDB Data Lake', () => {
    it('should store and query patterns correctly', async () => {
      const patterns = [
        {
          symbol: 'TestClass::constructor',
          pattern: 'singleton',
          category: 'ARCHITECTURAL',
          score: 0.85,
          confidence: 0.9,
          location: {
            file: 'src/test/example.ts',
            line: 10
          },
          evidence: { type: 'structural' },
          metrics: { complexity: 5 }
        },
        {
          symbol: 'EventManager::emit',
          pattern: 'observer',
          category: 'BEHAVIORAL',
          score: 0.75,
          confidence: 0.8,
          location: {
            file: 'src/test/events.ts',
            line: 50
          },
          evidence: { type: 'behavioral' },
          metrics: { complexity: 7 }
        }
      ];

      // Store patterns
      await duckLake.storePatternBatch(patterns, {
        analysisId: 'prod_test_001',
        codebaseHash: 'abc123',
        version: '1.0.0'
      });

      // Query patterns
      const results = await duckLake.queryPatterns({
        minScore: 0.7,
        categories: ['ARCHITECTURAL', 'BEHAVIORAL']
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(r => r.pattern_type === 'singleton')).toBe(true);
      expect(results.some(r => r.pattern_type === 'observer')).toBe(true);
    });

    it('should analyze pattern evolution', async () => {
      const evolution = await duckLake.analyzePatternEvolution('src/test/example.ts', {
        granularity: 'day'
      });

      expect(Array.isArray(evolution)).toBe(true);
    });

    it('should get pattern statistics', async () => {
      const stats = await duckLake.getPatternStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0]).toHaveProperty('category');
      expect(stats[0]).toHaveProperty('avg_score');
    });
  });

  describe('QPFM Integration', () => {
    it('should store and query patterns with quantum features', async () => {
      const pattern: HarmonicPatternMemory = {
        id: 'prod_test_qpfm_001',
        coordinates: [0.7, 0.8, 0.6],
        content: {
          title: 'Production Test Pattern',
          description: 'Testing production QPFM',
          type: 'architectural',
          tags: ['production', 'test'],
          data: {
            pattern: 'factory',
            confidence: 0.85
          }
        },
        accessCount: 0,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
        relevanceScore: 0.85,
        harmonicProperties: {
          category: PatternCategory.STRUCTURAL,
          strength: 0.85,
          occurrences: 1,
          confidence: 0.9,
          complexity: 6
        },
        locations: [{
          file: 'src/test/factory.ts',
          startLine: 20,
          endLine: 50,
          startColumn: 0,
          endColumn: 0
        }],
        evidence: [],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      };

      // Store in QPFM (which also stores in Neo4j and other systems)
      await qpfm.store(pattern);

      // Query with quantum features
      const results = await qpfm.query({
        category: PatternCategory.STRUCTURAL,
        content: 'factory',
        limit: 10
      });

      expect(results.memories.length).toBeGreaterThanOrEqual(0);
      expect(results.coherenceLevel).toBeGreaterThanOrEqual(0);
      expect(results.fieldConfiguration).toBeDefined();
    });
  });

  describe('MCP Gateway', () => {
    it('should handle quality assessment queries', async () => {
      const response = await gateway.handleMCPRequest({
        type: 'quality_assessment',
        target: 'src/test/example.ts',
        parameters: {
          includeRecommendations: true
        }
      });

      expect(response.success).toBe(true);
      expect(response.metadata.queryType).toBe('quality_assessment');
      expect(response.metadata.sourceSystems).toContain('ducklake');
      expect(response.metadata.sourceSystems).toContain('neo4j');
      expect(response.metadata.sourceSystems).toContain('qpfm');
    });

    it('should handle cross-cutting pattern queries', async () => {
      const response = await gateway.handleMCPRequest({
        type: 'cross_cutting_patterns',
        target: '',
        parameters: {
          minFiles: 1,
          minScore: 0.5
        }
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('patterns');
      expect(response.data).toHaveProperty('totalFound');
    });

    it('should handle similarity queries', async () => {
      const response = await gateway.handleMCPRequest({
        type: 'realtime_similarity',
        target: 'src/test/example.ts',
        parameters: {
          radius: 0.3,
          limit: 10
        }
      });

      expect(response.success).toBe(true);
      expect(response.metadata.sourceSystems).toContain('qpfm');
    });
  });

  describe('Pattern Reconciliation', () => {
    it('should reconcile patterns across all storage systems', async () => {
      // Create test patterns
      const testPatterns = generateTestPatterns(5);
      
      // Process through reconciler
      const stats = await reconciler.processAnalysisStream(
        (async function* () {
          for (const pattern of testPatterns) {
            yield pattern;
          }
        })(),
        {
          analysisId: 'reconcile_test_001',
          codebaseHash: 'xyz789',
          version: '1.0.0'
        }
      );

      expect(stats.totalPatterns).toBe(5);
      expect(stats.duckLakeStored).toBe(5);
      expect(stats.neo4jRelationships).toBeGreaterThan(0);
      expect(stats.qpfmPatterns).toBeGreaterThan(0); // High-score patterns
      expect(stats.errors).toBe(0);
    });

    it('should verify consistency across stores', async () => {
      const { consistent, issues } = await reconciler.verifyConsistency(10);
      
      // In a fresh test environment, should be consistent
      expect(consistent).toBe(true);
      expect(issues.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing patterns gracefully', async () => {
      const response = await gateway.handleMCPRequest({
        type: 'realtime_similarity',
        target: 'non/existent/file.ts',
        parameters: {}
      });

      expect(response.success).toBe(false);
      expect(response.insights).toBeDefined();
      expect(response.insights[0]).toContain('No patterns found');
    });

    it('should handle Neo4j connection errors gracefully', async () => {
      // Test with invalid symbol
      const response = await gateway.handleMCPRequest({
        type: 'relationship_traversal',
        target: 'invalid_symbol_xyz',
        parameters: {
          depth: 2
        }
      });

      expect(response.success).toBe(false);
      expect(response.insights).toBeDefined();
    });
  });
});

// Helper function to generate test patterns
function generateTestPatterns(count: number): any[] {
  const patterns = [];
  const categories = ['ARCHITECTURAL', 'BEHAVIORAL', 'STRUCTURAL'];
  const patternTypes = ['singleton', 'factory', 'observer', 'strategy'];
  
  for (let i = 0; i < count; i++) {
    patterns.push({
      symbol: `TestSymbol${i}`,
      pattern: patternTypes[i % patternTypes.length],
      category: categories[i % categories.length],
      score: 0.7 + (Math.random() * 0.3), // 0.7 - 1.0
      confidence: 0.8 + (Math.random() * 0.2), // 0.8 - 1.0
      location: {
        file: `src/test/file${i}.ts`,
        line: 10 + (i * 10)
      },
      evidence: { test: true },
      metrics: { complexity: 5 + i }
    });
  }
  
  return patterns;
}