/**
 * Tests for DPCM Pattern Store
 * Testing deterministic parameter composition memory functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DPCMPatternStore } from '../../src/storage/dpcm-pattern-store.js';
import { 
  HarmonicPatternMemory, 
  PatternCategory, 
  LogicOperation, 
  LogicGateType 
} from '../../src/memory/types.js';

describe('DPCMPatternStore', () => {
  let store: DPCMPatternStore;

  beforeEach(() => {
    store = new DPCMPatternStore();
  });

  describe('Basic Storage and Retrieval', () => {
    it('should store and retrieve patterns by ID', () => {
      const pattern: HarmonicPatternMemory = {
        id: 'test-pattern-1',
        accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
        content: {
          title: 'Test Pattern',
          description: 'A test pattern for DPCM',
          type: 'function',
          tags: ['test', 'sample'],
          data: { foo: 'bar' }
        },
        harmonicProperties: {
          category: PatternCategory.STRUCTURAL,
          strength: 0.8,
          complexity: 0.5,
          confidence: 0.9,
          occurrences: 1
        },
        coordinates: [0, 0, 0], // Will be overwritten
        relevanceScore: 1.0
      };

      store.store(pattern);
      const retrieved = store.getPattern('test-pattern-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-pattern-1');
      expect(retrieved?.content.title).toBe('Test Pattern');
      expect(retrieved?.coordinates).toBeDefined();
      expect(retrieved?.coordinates).not.toEqual([0, 0, 0]); // Should generate new coordinates
    });

    it('should bulk store multiple patterns', () => {
      const patterns: HarmonicPatternMemory[] = Array.from({ length: 10 }, (_, i) => ({
        id: `pattern-${i}`,
        accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
        content: {
          title: `Pattern ${i}`,
          description: `Description ${i}`,
          type: 'function',
          tags: ['bulk', `tag-${i}`],
          data: { index: i }
        },
        harmonicProperties: {
          category: i % 2 === 0 ? PatternCategory.FUNCTIONAL : PatternCategory.BEHAVIORAL,
          strength: 0.5 + (i * 0.05),
          complexity: 0.3 + (i * 0.05),
          confidence: 0.8,
          occurrences: i + 1
        },
        coordinates: [0, 0, 0],
        relevanceScore: 1.0
      }));

      store.bulkStore(patterns);
      expect(store.getPatternCount()).toBe(10);
    });

    it('should remove patterns correctly', () => {
      const pattern: HarmonicPatternMemory = {
        id: 'removable-pattern',
        accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
        content: {
          title: 'Removable',
          description: 'To be removed',
          type: 'function',
          tags: ['temp'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.COMPUTATIONAL,
          strength: 0.5,
          complexity: 0.5,
          confidence: 0.5,
          occurrences: 1
        },
        coordinates: [0, 0, 0],
        relevanceScore: 1.0
      };

      store.store(pattern);
      expect(store.getPattern('removable-pattern')).toBeDefined();

      const removed = store.remove('removable-pattern');
      expect(removed).toBe(true);
      expect(store.getPattern('removable-pattern')).toBeUndefined();
    });
  });

  describe('DPCM Query Functionality', () => {
    beforeEach(() => {
      // Set up test patterns with known properties
      const testPatterns: HarmonicPatternMemory[] = [
        {
          id: 'auth-1',
          accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
          content: {
            title: 'Authentication Handler',
            description: 'Handles user authentication',
            type: 'function',
            tags: ['auth', 'security'],
            data: { method: 'jwt' }
          },
          harmonicProperties: {
            category: PatternCategory.AUTHENTICATION,
            strength: 0.9,
            complexity: 0.7,
            confidence: 0.95,
            occurrences: 50
          },
          coordinates: [0, 0, 0],
          relevanceScore: 1.0
        },
        {
          id: 'auth-2',
          accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
          content: {
            title: 'OAuth Provider',
            description: 'OAuth2 authentication provider',
            type: 'class',
            tags: ['auth', 'oauth', 'security'],
            data: { provider: 'google' }
          },
          harmonicProperties: {
            category: PatternCategory.AUTHENTICATION,
            strength: 0.85,
            complexity: 0.8,
            confidence: 0.9,
            occurrences: 30
          },
          coordinates: [0, 0, 0],
          relevanceScore: 1.0
        },
        {
          id: 'data-1',
          accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
          content: {
            title: 'Data Processor',
            description: 'Processes incoming data streams',
            type: 'function',
            tags: ['data', 'processing'],
            data: { type: 'stream' }
          },
          harmonicProperties: {
            category: PatternCategory.DATA_FLOW,
            strength: 0.7,
            complexity: 0.6,
            confidence: 0.8,
            occurrences: 100
          },
          coordinates: [0, 0, 0],
          relevanceScore: 1.0
        }
      ];

      store.bulkStore(testPatterns);
    });

    it('should perform basic DPCM query', () => {
      const results = store.query('authentication', [], {
        radius: 1.5,
        maxResults: 10
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].harmonicProperties.category).toBe(PatternCategory.AUTHENTICATION);
    });

    it('should apply AND logic operations', () => {
      const operations: LogicOperation[] = [{
        type: LogicGateType.AND,
        params: ['auth', 'security']
      }];

      const results = store.query('authentication', operations, {
        radius: 2.5,
        maxResults: 5
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.content.tags).toContain('auth');
        expect(result.content.tags).toContain('security');
      });
    });

    it('should apply OR logic operations', () => {
      const operations: LogicOperation[] = [{
        type: LogicGateType.OR,
        params: ['oauth', 'processing']
      }];

      const results = store.query('general', operations, {
        maxResults: 10
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        const hasOAuth = result.content.tags.includes('oauth');
        const hasProcessing = result.content.tags.includes('processing');
        expect(hasOAuth || hasProcessing).toBe(true);
      });
    });

    it('should apply NOT logic operations', () => {
      const operations: LogicOperation[] = [{
        type: LogicGateType.NOT,
        params: ['oauth']
      }];

      const results = store.query('authentication', operations, {
        maxResults: 10
      });

      results.forEach(result => {
        expect(result.content.tags).not.toContain('oauth');
      });
    });

    it('should apply THRESHOLD operations', () => {
      const operations: LogicOperation[] = [{
        type: LogicGateType.THRESHOLD,
        params: ['strength'],
        threshold: 0.8
      }];

      const results = store.query('authentication', operations, {
        maxResults: 10
      });

      results.forEach(result => {
        expect(result.harmonicProperties.strength).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should apply BOOST operations', () => {
      const operations: LogicOperation[] = [{
        type: LogicGateType.BOOST,
        params: ['oauth'],
        weight: 2.0
      }];

      const results = store.query('authentication', operations, {
        maxResults: 10
      });

      // OAuth patterns should be ranked higher
      const oauthIndex = results.findIndex(r => r.content.tags.includes('oauth'));
      expect(oauthIndex).toBeLessThan(2); // Should be in top 2
    });
  });

  describe('Category and Strength Queries', () => {
    beforeEach(() => {
      // Add diverse patterns
      const patterns: HarmonicPatternMemory[] = Array.from({ length: 20 }, (_, i) => ({
        id: `diverse-${i}`,
        accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
        content: {
          title: `Pattern ${i}`,
          description: `Description ${i}`,
          type: 'function',
          tags: [`tag-${i % 5}`],
          data: { index: i }
        },
        harmonicProperties: {
          category: Object.values(PatternCategory)[i % Object.values(PatternCategory).length],
          strength: 0.1 + (i * 0.04), // 0.1 to 0.86
          complexity: Math.random(),
          confidence: 0.5 + Math.random() * 0.5,
          occurrences: i + 1
        },
        coordinates: [0, 0, 0],
        relevanceScore: 1.0
      }));

      store.bulkStore(patterns);
    });

    it('should query by category', () => {
      const results = store.queryByCategory(PatternCategory.FUNCTIONAL);
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.harmonicProperties.category).toBe(PatternCategory.FUNCTIONAL);
      });
    });

    it('should query by strength range', () => {
      const results = store.queryByStrength(0.5, 0.7);
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.harmonicProperties.strength).toBeGreaterThanOrEqual(0.5);
        expect(result.harmonicProperties.strength).toBeLessThanOrEqual(0.7);
      });
    });

    it('should apply query options correctly', () => {
      const results = store.queryByCategory(PatternCategory.BEHAVIORAL, {
        qualityThreshold: 0.7,
        maxResults: 3
      });

      expect(results.length).toBeLessThanOrEqual(3);
      results.forEach(result => {
        expect(
          result.harmonicProperties.strength >= 0.7 ||
          result.harmonicProperties.confidence >= 0.7
        ).toBe(true);
      });
    });
  });

  describe('Similarity Search', () => {
    it('should find similar patterns based on coordinates', () => {
      const basePattern: HarmonicPatternMemory = {
        id: 'base-similarity',
        accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
        content: {
          title: 'Base Pattern',
          description: 'Pattern to find similar to',
          type: 'function',
          tags: ['base', 'similar'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.STRUCTURAL,
          strength: 0.75,
          complexity: 0.6,
          confidence: 0.85,
          occurrences: 25
        },
        coordinates: [0, 0, 0],
        relevanceScore: 1.0
      };

      // Add base and similar patterns
      store.store(basePattern);

      // Add patterns with similar properties (should have close coordinates)
      const similarPatterns = Array.from({ length: 5 }, (_, i) => ({
        ...basePattern,
        id: `similar-${i}`,
        harmonicProperties: {
          ...basePattern.harmonicProperties,
          strength: 0.7 + i * 0.01,
          complexity: 0.55 + i * 0.01
        }
      }));

      store.bulkStore(similarPatterns);

      const similar = store.findSimilar('base-similarity', {
        radius: 1.5,
        maxResults: 10
      });

      expect(similar.length).toBeGreaterThan(0);
      expect(similar.map(p => p.id)).not.toContain('base-similarity');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate statistics', () => {
      // Clear and add known patterns
      store.clear();

      const patterns: HarmonicPatternMemory[] = [
        {
          id: 'stat-1',
          accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
          content: { title: 'Stat 1', description: '', type: 'function', tags: [], data: {} },
          harmonicProperties: {
            category: PatternCategory.FUNCTIONAL,
            strength: 0.8,
            complexity: 0.5,
            confidence: 0.9,
            occurrences: 1
          },
          coordinates: [0, 0, 0],
          relevanceScore: 1.0
        },
        {
          id: 'stat-2',
          accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now(), locations: [], evidence: [], relatedPatterns: [], causesPatterns: [], requiredBy: [],
          content: { title: 'Stat 2', description: '', type: 'function', tags: [], data: {} },
          harmonicProperties: {
            category: PatternCategory.FUNCTIONAL,
            strength: 0.6,
            complexity: 0.5,
            confidence: 0.9,
            occurrences: 1
          },
          coordinates: [0, 0, 0],
          relevanceScore: 1.0
        }
      ];

      store.bulkStore(patterns);

      const stats = store.getStats();
      
      expect(stats.totalPatterns).toBe(2);
      expect(stats.categoryCounts[PatternCategory.FUNCTIONAL]).toBe(2);
      expect(stats.averageStrength).toBeCloseTo(0.7, 2);
      expect(stats.coordinateSpread).toBeDefined();
      expect(stats.coordinateSpread.min).toBeDefined();
      expect(stats.coordinateSpread.max).toBeDefined();
    });
  });
});