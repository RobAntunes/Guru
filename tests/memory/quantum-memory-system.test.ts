/**
 * Tests for Quantum Probability Field Memory System
 * Testing the unified QPFM implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuantumProbabilityFieldMemory, QPFMConfig } from '../../src/memory/quantum-memory-system.js';
import { 
  HarmonicPatternMemory, 
  PatternCategory, 
  LogicOperation, 
  LogicGateType 
} from '../../src/memory/types.js';
import { MemoryQuery } from '../../src/memory/quantum-types.js';

describe('QuantumProbabilityFieldMemory', () => {
  let qpfm: QuantumProbabilityFieldMemory;
  let testConfig: Partial<QPFMConfig>;

  beforeEach(() => {
    testConfig = {
      dpcm: {
        enabled: true,
        defaultRadius: 0.35,
        qualityThreshold: 0.5
      },
      quantum: {
        enabled: true,
        defaultFieldRadius: 0.5,
        minProbability: 0.01,
        interferenceThreshold: 0.5
      },
      performance: {
        maxMemories: 1000,
        maxSuperpositionSize: 100,
        cacheEnabled: false
      }
    };

    qpfm = new QuantumProbabilityFieldMemory(testConfig);
  });

  describe('Memory Storage and Retrieval', () => {
    it('should store memories in both DPCM and quantum systems', async () => {
      const memory: HarmonicPatternMemory = {
        id: 'quantum-test-1',
        timestamp: new Date(),
        content: {
          title: 'Quantum Test Pattern',
          description: 'Testing quantum memory storage',
          type: 'function',
          tags: ['quantum', 'test'],
          data: { quantum: true }
        },
        harmonicProperties: {
          category: PatternCategory.COMPUTATIONAL,
          strength: 0.8,
          complexity: 0.6,
          confidence: 0.9,
          occurrences: 1
        },
        coordinates: [0.5, 0.5, 0.5],
        relevanceScore: 1.0
      };

      await qpfm.store(memory);

      // Query to verify storage
      const result = await qpfm.query('computational', [], {
        recentQueries: [],
        activePatterns: [],
        performanceMetrics: { avgResponseTime: 0, hitRate: 0, emergenceFrequency: 0 }
      });

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.memories.find(m => m.id === 'quantum-test-1')).toBeDefined();
    });

    it('should bulk store memories efficiently', async () => {
      const memories: HarmonicPatternMemory[] = Array.from({ length: 20 }, (_, i) => ({
        id: `bulk-quantum-${i}`,
        timestamp: new Date(),
        content: {
          title: `Bulk Memory ${i}`,
          description: `Testing bulk storage ${i}`,
          type: i % 2 === 0 ? 'function' : 'class',
          tags: ['bulk', `group-${Math.floor(i / 5)}`],
          data: { index: i }
        },
        harmonicProperties: {
          category: Object.values(PatternCategory)[i % Object.values(PatternCategory).length],
          strength: 0.5 + (i * 0.02),
          complexity: 0.4 + (i * 0.02),
          confidence: 0.7 + (i * 0.01),
          occurrences: i + 1
        },
        coordinates: [Math.random(), Math.random(), Math.random()],
        relevanceScore: 0.8
      }));

      await qpfm.bulkStore(memories);

      const stats = qpfm.getStats();
      expect(stats.totalMemories).toBe(20);
    });
  });

  describe('Query Modes', () => {
    beforeEach(async () => {
      // Set up test data
      const testMemories: HarmonicPatternMemory[] = [
        {
          id: 'precise-1',
          timestamp: new Date(),
          content: {
            title: 'Authentication Service',
            description: 'Core auth service',
            type: 'class',
            tags: ['auth', 'security', 'core'],
            data: {}
          },
          harmonicProperties: {
            category: PatternCategory.AUTHENTICATION,
            strength: 0.95,
            complexity: 0.7,
            confidence: 0.98,
            occurrences: 100
          },
          coordinates: [0.1, 0.2, 0.3],
          relevanceScore: 1.0
        },
        {
          id: 'discover-1',
          timestamp: new Date(),
          content: {
            title: 'Session Manager',
            description: 'Manages user sessions',
            type: 'class',
            tags: ['session', 'auth', 'state'],
            data: {}
          },
          harmonicProperties: {
            category: PatternCategory.STATE_MANAGEMENT,
            strength: 0.8,
            complexity: 0.6,
            confidence: 0.85,
            occurrences: 50
          },
          coordinates: [0.15, 0.25, 0.35],
          relevanceScore: 0.9
        },
        {
          id: 'creative-1',
          timestamp: new Date(),
          content: {
            title: 'Token Generator',
            description: 'Generates secure tokens',
            type: 'function',
            tags: ['token', 'security', 'crypto'],
            data: {}
          },
          harmonicProperties: {
            category: PatternCategory.CRYPTOGRAPHIC,
            strength: 0.9,
            complexity: 0.8,
            confidence: 0.92,
            occurrences: 200
          },
          coordinates: [0.2, 0.3, 0.4],
          relevanceScore: 0.95
        }
      ];

      await qpfm.bulkStore(testMemories);
    });

    it('should perform precision queries with high confidence', async () => {
      const query: MemoryQuery = {
        type: 'precision',
        confidence: 0.9,
        exploration: 0.1,
        harmonicSignature: {
          category: PatternCategory.AUTHENTICATION,
          strength: 0.8,
          complexity: 0.5
        },
        maxResults: 5
      };

      const result = await qpfm.query(query);

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.memories[0].content.harmonicSignature.category).toBe(PatternCategory.AUTHENTICATION);
      expect(result.coherenceLevel).toBeGreaterThan(0.5);
      expect(result.emergentInsights.length).toBe(0); // Minimal emergence in precision mode
    });

    it('should perform discovery queries with quantum features', async () => {
      const query: MemoryQuery = {
        type: 'discovery',
        confidence: 0.5,
        exploration: 0.8,
        harmonicSignature: {
          category: PatternCategory.AUTHENTICATION,
          strength: 0.5,
          complexity: 0.5
        },
        maxResults: 10
      };

      const result = await qpfm.query(query);

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.interferencePatterns.length).toBeGreaterThanOrEqual(0);
      expect(result.fieldConfiguration).toBeDefined();
      expect(result.fieldConfiguration.radius).toBeGreaterThan(0);
    });

    it('should perform hybrid queries combining DPCM and quantum', async () => {
      const query: MemoryQuery = {
        type: 'creative',
        confidence: 0.6,
        exploration: 0.6,
        harmonicSignature: {
          category: PatternCategory.AUTHENTICATION,
          strength: 0.7,
          complexity: 0.6
        }
      };

      const operations: LogicOperation[] = [{
        type: LogicGateType.AND,
        params: ['auth', 'security']
      }];

      const result = await qpfm.query(query, operations);

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.coherenceLevel).toBeDefined();
      expect(result.executionMetrics).toBeDefined();
      expect(result.executionMetrics.totalTime).toBeGreaterThan(0);
    });

    it('should handle string queries with automatic conversion', async () => {
      const result = await qpfm.query('authentication');

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.fieldConfiguration).toBeDefined();
    });
  });

  describe('Quantum Interference and Superposition', () => {
    it('should detect interference patterns', async () => {
      // Add memories that should interfere
      const interferingMemories: HarmonicPatternMemory[] = [
        {
          id: 'interfere-1',
          timestamp: new Date(),
          content: {
            title: 'Pattern A',
            description: 'First interfering pattern',
            type: 'function',
            tags: ['harmonic', 'resonate'],
            data: {}
          },
          harmonicProperties: {
            category: PatternCategory.HARMONIC,
            strength: 0.9,
            complexity: 0.7,
            confidence: 0.95,
            occurrences: 10
          },
          coordinates: [0.4, 0.4, 0.4],
          relevanceScore: 1.0
        },
        {
          id: 'interfere-2',
          timestamp: new Date(),
          content: {
            title: 'Pattern B',
            description: 'Second interfering pattern',
            type: 'function',
            tags: ['harmonic', 'resonate'],
            data: {}
          },
          harmonicProperties: {
            category: PatternCategory.HARMONIC,
            strength: 0.85,
            complexity: 0.75,
            confidence: 0.92,
            occurrences: 12
          },
          coordinates: [0.42, 0.42, 0.42], // Close to Pattern A
          relevanceScore: 0.95
        }
      ];

      await qpfm.bulkStore(interferingMemories);

      const query: MemoryQuery = {
        type: 'discovery',
        confidence: 0.5,
        exploration: 0.7,
        harmonicSignature: {
          category: PatternCategory.HARMONIC,
          strength: 0.8,
          complexity: 0.7
        }
      };

      const result = await qpfm.query(query);

      expect(result.interferencePatterns.length).toBeGreaterThan(0);
      const constructivePattern = result.interferencePatterns.find(p => p.type === 'constructive');
      expect(constructivePattern).toBeDefined();
      expect(constructivePattern?.mechanism).toMatch(/phase_coherence|harmonic_resonance|frequency_matching/);
    });

    it('should calculate coherence levels', async () => {
      const query: MemoryQuery = {
        type: 'discovery',
        confidence: 0.7,
        exploration: 0.5
      };

      const result = await qpfm.query(query);

      expect(result.coherenceLevel).toBeDefined();
      expect(result.coherenceLevel).toBeGreaterThanOrEqual(0);
      expect(result.coherenceLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('Emergent Behaviors', () => {
    it('should trigger dream state behavior', async () => {
      const insights = await qpfm.triggerEmergentDiscovery('dream');

      // Dream state may or may not produce insights depending on memory content
      expect(Array.isArray(insights)).toBe(true);
      
      if (insights.length > 0) {
        expect(insights[0].type).toMatch(/novel_connection|pattern_synthesis|unexpected_relevance/);
        expect(insights[0].contributingMemories.length).toBeGreaterThan(0);
      }
    });

    it('should trigger flashback activation', async () => {
      // Add high-resonance memories
      const resonantMemories: HarmonicPatternMemory[] = Array.from({ length: 5 }, (_, i) => ({
        id: `resonant-${i}`,
        timestamp: new Date(),
        content: {
          title: `Resonant Pattern ${i}`,
          description: 'High resonance pattern',
          type: 'function',
          tags: ['resonant', 'cascade'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.HARMONIC,
          strength: 0.9 + i * 0.01,
          complexity: 0.8,
          confidence: 0.95,
          occurrences: 50
        },
        coordinates: [0.5 + i * 0.02, 0.5, 0.5],
        relevanceScore: 0.95
      }));

      await qpfm.bulkStore(resonantMemories);

      const insights = await qpfm.triggerEmergentDiscovery('flashback');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should trigger creative synthesis', async () => {
      const insights = await qpfm.triggerEmergentDiscovery('synthesis');
      
      expect(Array.isArray(insights)).toBe(true);
      if (insights.length > 0) {
        expect(insights[0].suggestedAction).toBeDefined();
        expect(insights[0].noveltyScore).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Similarity Search', () => {
    it('should find similar memories using quantum interference', async () => {
      const baseMemory: HarmonicPatternMemory = {
        id: 'base-quantum',
        timestamp: new Date(),
        content: {
          title: 'Base Quantum Pattern',
          description: 'Pattern to find similar',
          type: 'class',
          tags: ['quantum', 'base', 'search'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.QUANTUM,
          strength: 0.8,
          complexity: 0.7,
          confidence: 0.9,
          occurrences: 20
        },
        coordinates: [0.6, 0.6, 0.6],
        relevanceScore: 1.0
      };

      await qpfm.store(baseMemory);

      // Add similar patterns
      const similarPatterns = Array.from({ length: 5 }, (_, i) => ({
        ...baseMemory,
        id: `similar-quantum-${i}`,
        content: {
          ...baseMemory.content,
          title: `Similar Pattern ${i}`,
          tags: ['quantum', 'similar', `variant-${i}`]
        },
        coordinates: [
          0.6 + (Math.random() - 0.5) * 0.1,
          0.6 + (Math.random() - 0.5) * 0.1,
          0.6 + (Math.random() - 0.5) * 0.1
        ]
      }));

      await qpfm.bulkStore(similarPatterns);

      const similar = await qpfm.findSimilar('base-quantum', {
        minSimilarity: 0.7,
        maxResults: 3
      });

      expect(similar.length).toBeGreaterThan(0);
      expect(similar.length).toBeLessThanOrEqual(3);
      expect(similar.every(m => m.id !== 'base-quantum')).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution metrics', async () => {
      const query: MemoryQuery = {
        type: 'discovery',
        confidence: 0.6,
        exploration: 0.6
      };

      const result = await qpfm.query(query);

      expect(result.executionMetrics).toBeDefined();
      expect(result.executionMetrics.totalTime).toBeGreaterThan(0);
      expect(result.executionMetrics.memoriesProcessed).toBeGreaterThanOrEqual(0);
      
      if (result.executionMetrics.superpositionTime !== undefined) {
        expect(result.executionMetrics.superpositionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should update system performance metrics', async () => {
      // Perform several queries
      for (let i = 0; i < 5; i++) {
        await qpfm.query('test-query');
      }

      const stats = qpfm.getStats();
      
      expect(stats.context.performanceMetrics.avgResponseTime).toBeGreaterThan(0);
      expect(stats.context.performanceMetrics.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.context.performanceMetrics.emergenceFrequency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pattern Distribution', () => {
    it('should analyze pattern distribution', async () => {
      const distribution = await qpfm.getPatternDistribution();
      
      expect(distribution instanceof Map).toBe(true);
      
      // Check that categories are counted correctly
      let totalCount = 0;
      distribution.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
        totalCount += count;
      });
      
      expect(totalCount).toBe(qpfm.getStats().totalMemories);
    });
  });

  describe('Configuration', () => {
    it('should respect configuration settings', () => {
      const config = qpfm.getConfig();
      
      expect(config.dpcm.enabled).toBe(true);
      expect(config.quantum.enabled).toBe(true);
      expect(config.dpcm.defaultRadius).toBe(0.35);
      expect(config.quantum.defaultFieldRadius).toBe(0.5);
    });

    it('should handle disabled quantum features', async () => {
      const noQuantumConfig: Partial<QPFMConfig> = {
        ...testConfig,
        quantum: {
          enabled: false,
          defaultFieldRadius: 0.5,
          minProbability: 0.01,
          interferenceThreshold: 0.5
        }
      };

      const noQuantumQPFM = new QuantumProbabilityFieldMemory(noQuantumConfig);
      
      const memory: HarmonicPatternMemory = {
        id: 'no-quantum-test',
        timestamp: new Date(),
        content: {
          title: 'No Quantum Test',
          description: 'Testing without quantum features',
          type: 'function',
          tags: ['test'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.FUNCTIONAL,
          strength: 0.7,
          complexity: 0.5,
          confidence: 0.8,
          occurrences: 1
        },
        coordinates: [0.5, 0.5, 0.5],
        relevanceScore: 1.0
      };

      await noQuantumQPFM.store(memory);
      const result = await noQuantumQPFM.query('functional');
      
      expect(result.memories.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should clear all memories', async () => {
      // Add some memories
      const memories = Array.from({ length: 10 }, (_, i) => ({
        id: `clear-test-${i}`,
        timestamp: new Date(),
        content: {
          title: `Clear Test ${i}`,
          description: 'To be cleared',
          type: 'function',
          tags: ['clear'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.FUNCTIONAL,
          strength: 0.5,
          complexity: 0.5,
          confidence: 0.5,
          occurrences: 1
        },
        coordinates: [Math.random(), Math.random(), Math.random()],
        relevanceScore: 0.5
      }));

      await qpfm.bulkStore(memories);
      
      let stats = qpfm.getStats();
      expect(stats.totalMemories).toBe(10);

      qpfm.clearMemories();
      
      stats = qpfm.getStats();
      expect(stats.totalMemories).toBe(0);
      expect(stats.dpcmStats.totalPatterns).toBe(0);
    });
  });
});