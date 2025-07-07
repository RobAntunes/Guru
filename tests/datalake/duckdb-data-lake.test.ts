/**
 * DuckDB Data Lake Tests
 * Ensures proper async initialization and functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDuckDBDataLake, DuckDBDataLake } from '../../src/datalake/duckdb-data-lake.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('DuckDBDataLake', () => {
  let lake: DuckDBDataLake;
  let tempDir: string;

  describe('In-Memory Mode', () => {
    beforeEach(async () => {
      lake = await createDuckDBDataLake();
    });

    afterEach(async () => {
      await lake.close();
    });

    it('should initialize properly', async () => {
      // Should already be initialized from createDuckDBDataLake
      // Try storing data to verify it works
      const patterns = [{
        symbol: 'TestSymbol',
        pattern: 'singleton',
        category: 'ARCHITECTURAL',
        score: 0.85,
        confidence: 0.9,
        location: { file: 'test.ts', line: 10 },
        evidence: {},
        metrics: {}
      }];

      await lake.storePatternBatch(patterns, {
        analysisId: 'test',
        codebaseHash: 'abc',
        version: '1.0.0'
      });

      const results = await lake.queryPatterns({});
      expect(results.length).toBe(1);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      
      // Store multiple batches concurrently
      for (let i = 0; i < 5; i++) {
        const patterns = [{
          symbol: `Symbol${i}`,
          pattern: 'factory',
          category: 'STRUCTURAL',
          score: 0.8,
          confidence: 0.85,
          location: { file: `file${i}.ts`, line: i * 10 },
          evidence: {},
          metrics: {}
        }];

        promises.push(
          lake.storePatternBatch(patterns, {
            analysisId: `test${i}`,
            codebaseHash: 'abc',
            version: '1.0.0'
          })
        );
      }

      await Promise.all(promises);

      const results = await lake.queryPatterns({});
      expect(results.length).toBe(5);
    });

    it('should query patterns with filters', async () => {
      // Store various patterns
      const patterns = [
        {
          symbol: 'HighScore',
          pattern: 'singleton',
          category: 'ARCHITECTURAL',
          score: 0.9,
          confidence: 0.95,
          location: { file: 'high.ts', line: 10 },
          evidence: {},
          metrics: {}
        },
        {
          symbol: 'LowScore',
          pattern: 'observer',
          category: 'BEHAVIORAL',
          score: 0.6,
          confidence: 0.7,
          location: { file: 'low.ts', line: 20 },
          evidence: {},
          metrics: {}
        },
        {
          symbol: 'MidScore',
          pattern: 'factory',
          category: 'ARCHITECTURAL',
          score: 0.75,
          confidence: 0.8,
          location: { file: 'mid.ts', line: 30 },
          evidence: {},
          metrics: {}
        }
      ];

      await lake.storePatternBatch(patterns, {
        analysisId: 'filter_test',
        codebaseHash: 'xyz',
        version: '1.0.0'
      });

      // Test various filters
      const highScoreResults = await lake.queryPatterns({ minScore: 0.8 });
      expect(highScoreResults.length).toBe(1);
      expect(highScoreResults[0].symbol_id).toBe('HighScore');

      const architecturalResults = await lake.queryPatterns({
        categories: ['ARCHITECTURAL']
      });
      expect(architecturalResults.length).toBe(2);

      const specificFileResults = await lake.queryPatterns({
        files: ['mid.ts']
      });
      expect(specificFileResults.length).toBe(1);
    });

    it('should analyze pattern evolution', async () => {
      // Store patterns for evolution analysis
      const patterns = [
        {
          symbol: 'EvolvingClass',
          pattern: 'singleton',
          category: 'ARCHITECTURAL',
          score: 0.85,
          confidence: 0.9,
          location: { file: 'evolve.ts', line: 10 },
          evidence: {},
          metrics: {}
        }
      ];

      await lake.storePatternBatch(patterns, {
        analysisId: 'evolution_test',
        codebaseHash: 'evo123',
        version: '1.0.0'
      });

      const evolution = await lake.analyzePatternEvolution('evolve.ts', {
        granularity: 'day'
      });

      expect(Array.isArray(evolution)).toBe(true);
      // Should have at least one entry for today
      expect(evolution.length).toBeGreaterThanOrEqual(1);
      if (evolution.length > 0) {
        expect(evolution[0]).toHaveProperty('period');
        expect(evolution[0]).toHaveProperty('pattern_type');
        expect(evolution[0]).toHaveProperty('avg_score');
      }
    });

    it('should get pattern statistics', async () => {
      // Store diverse patterns
      const patterns = [
        {
          symbol: 'Stat1',
          pattern: 'singleton',
          category: 'ARCHITECTURAL',
          score: 0.9,
          confidence: 0.95,
          location: { file: 'stat1.ts', line: 10 },
          evidence: {},
          metrics: {}
        },
        {
          symbol: 'Stat2',
          pattern: 'singleton',
          category: 'ARCHITECTURAL',
          score: 0.85,
          confidence: 0.9,
          location: { file: 'stat2.ts', line: 20 },
          evidence: {},
          metrics: {}
        },
        {
          symbol: 'Stat3',
          pattern: 'observer',
          category: 'BEHAVIORAL',
          score: 0.75,
          confidence: 0.8,
          location: { file: 'stat3.ts', line: 30 },
          evidence: {},
          metrics: {}
        }
      ];

      await lake.storePatternBatch(patterns, {
        analysisId: 'stats_test',
        codebaseHash: 'stat123',
        version: '1.0.0'
      });

      const stats = await lake.getPatternStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      // Check architectural patterns
      const archStats = stats.find(s => 
        s.category === 'ARCHITECTURAL' && s.pattern_type === 'singleton'
      );
      expect(archStats).toBeDefined();
      expect(archStats.count).toBe(2);
      expect(archStats.avg_score).toBeCloseTo(0.875, 2);
      expect(archStats.file_count).toBe(2);
    });
  });

  describe('Persistent Mode', () => {
    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'duckdb-test-'));
      const dbPath = join(tempDir, 'test.duckdb');
      lake = await createDuckDBDataLake(dbPath);
    });

    afterEach(async () => {
      await lake.close();
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should create snapshots in persistent mode', async () => {
      const patterns = [{
        symbol: 'SnapshotTest',
        pattern: 'singleton',
        category: 'ARCHITECTURAL',
        score: 0.85,
        confidence: 0.9,
        location: { file: 'snap.ts', line: 10 },
        evidence: {},
        metrics: {}
      }];

      await lake.storePatternBatch(patterns, {
        analysisId: 'snapshot_test',
        codebaseHash: 'snap123',
        version: '1.0.0'
      });

      // Create snapshot
      await lake.createSnapshot('test_snapshot', 'Test snapshot for unit tests');

      // List snapshots
      const snapshots = await lake.listSnapshots();
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].name).toBe('test_snapshot');
      expect(snapshots[0].comment).toBe('Test snapshot for unit tests');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      lake = await createDuckDBDataLake();
    });

    afterEach(async () => {
      await lake.close();
    });

    it('should handle invalid queries gracefully', async () => {
      // Query with invalid time range should still work
      const results = await lake.queryPatterns({
        timeRange: {
          start: new Date('2025-01-01'),
          end: new Date('2024-01-01') // End before start
        }
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle multiple initializations', async () => {
      // Already initialized in beforeEach
      // Try to initialize again - should be idempotent
      await lake.initialize();
      await lake.initialize();

      // Should still work
      const patterns = [{
        symbol: 'MultiInit',
        pattern: 'singleton',
        category: 'ARCHITECTURAL',
        score: 0.85,
        confidence: 0.9,
        location: { file: 'init.ts', line: 10 },
        evidence: {},
        metrics: {}
      }];

      await lake.storePatternBatch(patterns, {
        analysisId: 'init_test',
        codebaseHash: 'init123',
        version: '1.0.0'
      });

      const results = await lake.queryPatterns({});
      expect(results.length).toBe(1);
    });
  });
});