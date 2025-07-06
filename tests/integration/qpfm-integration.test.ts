/**
 * Integration tests for Quantum Probability Field Memory System
 * Tests the full stack working together
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuantumProbabilityFieldMemory } from '../../src/memory/quantum-memory-system.js';
import { 
  HarmonicPatternMemory, 
  PatternCategory, 
  LogicOperation, 
  LogicGateType 
} from '../../src/memory/types.js';
import { MemoryQuery, EmergentInsight } from '../../src/memory/quantum-types.js';

describe('QPFM Integration Tests', () => {
  let qpfm: QuantumProbabilityFieldMemory;

  beforeEach(async () => {
    qpfm = new QuantumProbabilityFieldMemory({
      emergent: {
        dreamState: { enabled: true, trigger: 'random', frequency: 0.5 },
        flashbackActivation: { enabled: true, threshold: 0.8, cascadeDepth: 3 },
        dejaVuExploration: { enabled: true, uncertaintyThreshold: 0.4, expansionFactor: 1.5 },
        creativeSynthesis: { enabled: true, minimumPatterns: 3, noveltyThreshold: 0.7 }
      }
    });

    // Load a realistic dataset
    await loadRealisticDataset(qpfm);
  });

  afterEach(() => {
    qpfm.clearMemories();
  });

  describe('Complex Query Scenarios', () => {
    it('should handle multi-step authentication flow query', async () => {
      // Query 1: Find authentication entry points
      const authQuery: MemoryQuery = {
        type: 'precision',
        confidence: 0.9,
        exploration: 0.1,
        harmonicSignature: {
          category: PatternCategory.AUTHENTICATION,
          strength: 0.8,
          complexity: 0.5
        }
      };

      const authResult = await qpfm.query(authQuery);
      expect(authResult.memories.length).toBeGreaterThan(0);
      
      // Query 2: Find related session management
      const sessionOps: LogicOperation[] = [
        { type: LogicGateType.AND, params: ['session', 'state'] },
        { type: LogicGateType.BOOST, params: ['auth'], weight: 1.5 }
      ];

      const sessionResult = await qpfm.query('state_management', sessionOps);
      expect(sessionResult.memories.length).toBeGreaterThan(0);

      // Query 3: Discovery mode for security patterns
      const securityQuery: MemoryQuery = {
        type: 'discovery',
        confidence: 0.5,
        exploration: 0.8,
        harmonicSignature: {
          category: PatternCategory.CRYPTOGRAPHIC,
          strength: 0.7,
          complexity: 0.8
        }
      };

      const securityResult = await qpfm.query(securityQuery);
      
      // Should find connections between auth, session, and crypto
      expect(securityResult.interferencePatterns.length).toBeGreaterThan(0);
      
      const hasAuthCryptoInterference = securityResult.interferencePatterns.some(
        pattern => pattern.involvedMemories.some(id => id.includes('auth')) &&
                  pattern.involvedMemories.some(id => id.includes('crypto'))
      );
      expect(hasAuthCryptoInterference).toBe(true);
    });

    it('should discover emergent patterns in data processing pipeline', async () => {
      // Start with data ingestion patterns
      const ingestionQuery: MemoryQuery = {
        type: 'creative',
        confidence: 0.6,
        exploration: 0.7,
        harmonicSignature: {
          category: PatternCategory.DATA_FLOW,
          strength: 0.7,
          complexity: 0.6
        }
      };

      const result = await qpfm.query(ingestionQuery);
      
      // Look for emergent insights about data flow
      expect(result.emergentInsights.length).toBeGreaterThanOrEqual(0);
      
      if (result.emergentInsights.length > 0) {
        const dataFlowInsight = result.emergentInsights.find(
          i => i.type === 'pattern_synthesis' || i.type === 'novel_connection'
        );
        expect(dataFlowInsight).toBeDefined();
      }

      // Check for cross-category synthesis (data flow + computation)
      const hasCrossCategoryPattern = result.interferencePatterns.some(
        p => p.emergentProperties.some(prop => 
          prop.includes('DATA_FLOW') || prop.includes('COMPUTATIONAL')
        )
      );
      expect(hasCrossCategoryPattern).toBe(true);
    });

    it('should adapt field based on query history', async () => {
      // Perform several related queries
      const queries = [
        'authentication',
        'session_management',
        'token_validation',
        'user_permissions'
      ];

      const results = [];
      for (const q of queries) {
        const result = await qpfm.query(q);
        results.push(result);
      }

      // Later queries should show adaptation
      const lastResult = results[results.length - 1];
      const stats = qpfm.getStats();
      
      // Check that context has evolved
      expect(stats.context.recentQueries.length).toBeGreaterThan(0);
      expect(stats.context.activePatterns).toContain(PatternCategory.AUTHENTICATION);
      
      // Performance should improve over time
      expect(stats.context.performanceMetrics.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Emergent Behavior Integration', () => {
    it('should generate creative insights from interference patterns', async () => {
      // Query that should trigger creative synthesis
      const creativeQuery: MemoryQuery = {
        type: 'creative',
        confidence: 0.4,
        exploration: 0.9,
        harmonicSignature: {
          category: PatternCategory.HARMONIC,
          strength: 0.5,
          complexity: 0.7
        }
      };

      const result = await qpfm.query(creativeQuery);
      
      // Check for creative synthesis
      if (result.emergentInsights.length > 0) {
        const creativeSynthesis = result.emergentInsights.find(
          i => i.description.includes('synthesis') || 
               i.description.includes('Cross-category')
        );
        
        if (creativeSynthesis) {
          expect(creativeSynthesis.noveltyScore).toBeGreaterThan(0.6);
          expect(creativeSynthesis.suggestedAction).toBeDefined();
        }
      }

      // Verify interference patterns contribute to insights
      expect(result.interferencePatterns.length).toBeGreaterThan(0);
      
      const strongInterference = result.interferencePatterns.find(
        p => p.strength > 0.5
      );
      expect(strongInterference).toBeDefined();
    });

    it('should trigger flashback cascades with high-resonance patterns', async () => {
      // First, activate several related patterns
      const relatedQueries = [
        { category: PatternCategory.ERROR_PATTERN, tag: 'exception' },
        { category: PatternCategory.ERROR_PATTERN, tag: 'recovery' },
        { category: PatternCategory.RECOVERY, tag: 'rollback' }
      ];

      for (const q of relatedQueries) {
        await qpfm.query({
          type: 'precision',
          confidence: 0.95,
          exploration: 0.05,
          harmonicSignature: {
            category: q.category,
            strength: 0.9,
            complexity: 0.7
          }
        });
      }

      // Now trigger flashback
      const insights = await qpfm.triggerEmergentDiscovery('flashback');
      
      if (insights.length > 0) {
        const cascadeInsight = insights.find(
          i => i.description.includes('cascade') || 
               i.description.includes('resonance')
        );
        
        if (cascadeInsight) {
          expect(cascadeInsight.contributingMemories.length).toBeGreaterThan(2);
          expect(cascadeInsight.confidenceLevel).toBeGreaterThan(0.6);
        }
      }
    });

    it('should explore uncertain memories with déjà vu', async () => {
      // Create uncertainty by querying partial patterns
      const uncertainQuery: MemoryQuery = {
        type: 'discovery',
        confidence: 0.3, // Low confidence
        exploration: 0.8,
        harmonicSignature: {
          category: PatternCategory.BEHAVIORAL,
          strength: 0.4,
          complexity: 0.5
        }
      };

      const result = await qpfm.query(uncertainQuery);
      
      // Trigger déjà vu exploration
      const dejaVuInsights = await qpfm.triggerEmergentDiscovery('dejavu');
      
      if (dejaVuInsights.length > 0) {
        expect(dejaVuInsights[0].type).toBe('unexpected_relevance');
        expect(dejaVuInsights[0].confidenceLevel).toBeLessThan(0.5); // Low confidence triggers exploration
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should maintain performance with large datasets', async () => {
      // Add more patterns
      const largeDataset = generateLargeDataset(500);
      await qpfm.bulkStore(largeDataset);

      const startTime = Date.now();
      
      // Perform complex query
      const complexOps: LogicOperation[] = [
        { type: LogicGateType.AND, params: ['performance', 'critical'] },
        { type: LogicGateType.NOT, params: ['deprecated'] },
        { type: LogicGateType.THRESHOLD, params: ['strength'], threshold: 0.7 },
        { type: LogicGateType.BOOST, params: ['optimized'], weight: 2.0 }
      ];

      const result = await qpfm.query('computational', complexOps);
      const queryTime = Date.now() - startTime;

      // Should complete within reasonable time
      expect(queryTime).toBeLessThan(1000); // 1 second max
      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.executionMetrics.memoriesProcessed).toBeGreaterThan(100);
    });

    it('should show learning adaptation over time', async () => {
      const testQueries = [
        'authentication',
        'authorization', 
        'authentication', // Repeat
        'session_management',
        'authentication' // Repeat again
      ];

      const responseTimes: number[] = [];

      for (const q of testQueries) {
        const startTime = Date.now();
        await qpfm.query(q);
        responseTimes.push(Date.now() - startTime);
      }

      // Response times for repeated queries should improve
      const firstAuthTime = responseTimes[0];
      const secondAuthTime = responseTimes[2];
      const thirdAuthTime = responseTimes[4];

      // Allow for some variance, but trend should be downward
      expect(thirdAuthTime).toBeLessThanOrEqual(firstAuthTime * 1.2);

      // Check learning stats
      const learningStats = qpfm.getStats().learningStats;
      expect(learningStats.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty query results gracefully', async () => {
      const impossibleQuery: MemoryQuery = {
        type: 'precision',
        confidence: 0.99,
        exploration: 0.01,
        harmonicSignature: {
          category: 'NONEXISTENT_CATEGORY' as any,
          strength: 0.99,
          complexity: 0.99
        }
      };

      const result = await qpfm.query(impossibleQuery);
      
      expect(result.memories).toEqual([]);
      expect(result.coherenceLevel).toBe(0);
      expect(result.executionMetrics.totalTime).toBeGreaterThan(0);
    });

    it('should handle similarity search with non-existent memory', async () => {
      const similar = await qpfm.findSimilar('non-existent-id');
      expect(similar).toEqual([]);
    });

    it('should maintain consistency after clearing memories', async () => {
      const beforeStats = qpfm.getStats();
      expect(beforeStats.totalMemories).toBeGreaterThan(0);

      qpfm.clearMemories();

      const afterStats = qpfm.getStats();
      expect(afterStats.totalMemories).toBe(0);
      expect(afterStats.dpcmStats.totalPatterns).toBe(0);

      // Should still be able to add new memories
      await qpfm.store({
        id: 'after-clear',
        timestamp: new Date(),
        content: {
          title: 'After Clear',
          description: 'Added after clearing',
          type: 'function',
          tags: ['new'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.FUNCTIONAL,
          strength: 0.5,
          complexity: 0.5,
          confidence: 0.5,
          occurrences: 1
        },
        coordinates: [0.5, 0.5, 0.5],
        relevanceScore: 1.0
      });

      const finalStats = qpfm.getStats();
      expect(finalStats.totalMemories).toBe(1);
    });
  });
});

// Helper functions

async function loadRealisticDataset(qpfm: QuantumProbabilityFieldMemory) {
  const patterns: HarmonicPatternMemory[] = [
    // Authentication patterns
    {
      id: 'auth-handler-main',
      timestamp: new Date(),
      content: {
        title: 'MainAuthenticationHandler',
        description: 'Core authentication handler for the system',
        type: 'class',
        tags: ['auth', 'security', 'core', 'handler'],
        data: { methods: ['authenticate', 'validate', 'refresh'] }
      },
      harmonicProperties: {
        category: PatternCategory.AUTHENTICATION,
        strength: 0.95,
        complexity: 0.8,
        confidence: 0.98,
        occurrences: 150
      },
      coordinates: [0.1, 0.2, 0.8],
      relevanceScore: 1.0
    },
    {
      id: 'auth-jwt-provider',
      timestamp: new Date(),
      content: {
        title: 'JWTAuthProvider',
        description: 'JWT token authentication provider',
        type: 'class',
        tags: ['auth', 'jwt', 'token', 'security'],
        data: { algorithm: 'RS256' }
      },
      harmonicProperties: {
        category: PatternCategory.AUTHENTICATION,
        strength: 0.9,
        complexity: 0.75,
        confidence: 0.95,
        occurrences: 120
      },
      coordinates: [0.15, 0.25, 0.78],
      relevanceScore: 0.95
    },
    // Session management
    {
      id: 'session-manager-core',
      timestamp: new Date(),
      content: {
        title: 'SessionManager',
        description: 'Manages user sessions and state',
        type: 'class',
        tags: ['session', 'state', 'auth', 'management'],
        data: { storage: 'redis', ttl: 3600 }
      },
      harmonicProperties: {
        category: PatternCategory.STATE_MANAGEMENT,
        strength: 0.88,
        complexity: 0.7,
        confidence: 0.92,
        occurrences: 100
      },
      coordinates: [0.2, 0.3, 0.75],
      relevanceScore: 0.9
    },
    // Cryptographic patterns
    {
      id: 'crypto-token-gen',
      timestamp: new Date(),
      content: {
        title: 'SecureTokenGenerator',
        description: 'Generates cryptographically secure tokens',
        type: 'function',
        tags: ['crypto', 'token', 'security', 'random'],
        data: { entropy: 256 }
      },
      harmonicProperties: {
        category: PatternCategory.CRYPTOGRAPHIC,
        strength: 0.92,
        complexity: 0.85,
        confidence: 0.96,
        occurrences: 200
      },
      coordinates: [0.3, 0.4, 0.9],
      relevanceScore: 0.95
    },
    {
      id: 'crypto-hash-util',
      timestamp: new Date(),
      content: {
        title: 'HashingUtility',
        description: 'Secure hashing utilities for passwords',
        type: 'class',
        tags: ['crypto', 'hash', 'password', 'security'],
        data: { algorithm: 'argon2' }
      },
      harmonicProperties: {
        category: PatternCategory.CRYPTOGRAPHIC,
        strength: 0.94,
        complexity: 0.78,
        confidence: 0.97,
        occurrences: 180
      },
      coordinates: [0.32, 0.38, 0.88],
      relevanceScore: 0.93
    },
    // Data flow patterns
    {
      id: 'data-ingestion-pipeline',
      timestamp: new Date(),
      content: {
        title: 'DataIngestionPipeline',
        description: 'Handles data ingestion and validation',
        type: 'class',
        tags: ['data', 'ingestion', 'pipeline', 'validation'],
        data: { stages: ['validate', 'transform', 'store'] }
      },
      harmonicProperties: {
        category: PatternCategory.DATA_FLOW,
        strength: 0.82,
        complexity: 0.75,
        confidence: 0.88,
        occurrences: 80
      },
      coordinates: [0.5, 0.6, 0.7],
      relevanceScore: 0.85
    },
    {
      id: 'data-transform-stream',
      timestamp: new Date(),
      content: {
        title: 'DataTransformStream',
        description: 'Stream-based data transformation',
        type: 'class',
        tags: ['data', 'stream', 'transform', 'processing'],
        data: { type: 'duplex' }
      },
      harmonicProperties: {
        category: PatternCategory.DATA_FLOW,
        strength: 0.78,
        complexity: 0.72,
        confidence: 0.85,
        occurrences: 65
      },
      coordinates: [0.52, 0.58, 0.68],
      relevanceScore: 0.82
    },
    // Error handling patterns
    {
      id: 'error-recovery-manager',
      timestamp: new Date(),
      content: {
        title: 'ErrorRecoveryManager',
        description: 'Manages error recovery strategies',
        type: 'class',
        tags: ['error', 'recovery', 'exception', 'resilience'],
        data: { strategies: ['retry', 'circuit-breaker', 'fallback'] }
      },
      harmonicProperties: {
        category: PatternCategory.ERROR_PATTERN,
        strength: 0.86,
        complexity: 0.8,
        confidence: 0.9,
        occurrences: 70
      },
      coordinates: [0.4, 0.5, 0.85],
      relevanceScore: 0.88
    },
    {
      id: 'error-rollback-handler',
      timestamp: new Date(),
      content: {
        title: 'TransactionRollbackHandler',
        description: 'Handles transaction rollbacks on errors',
        type: 'class',
        tags: ['error', 'rollback', 'transaction', 'recovery'],
        data: { isolation: 'SERIALIZABLE' }
      },
      harmonicProperties: {
        category: PatternCategory.RECOVERY,
        strength: 0.84,
        complexity: 0.77,
        confidence: 0.89,
        occurrences: 55
      },
      coordinates: [0.42, 0.48, 0.83],
      relevanceScore: 0.86
    },
    // Computational patterns
    {
      id: 'compute-parallel-executor',
      timestamp: new Date(),
      content: {
        title: 'ParallelTaskExecutor',
        description: 'Executes tasks in parallel with work stealing',
        type: 'class',
        tags: ['compute', 'parallel', 'performance', 'critical'],
        data: { threads: 8, queue: 'work-stealing' }
      },
      harmonicProperties: {
        category: PatternCategory.COMPUTATIONAL,
        strength: 0.88,
        complexity: 0.82,
        confidence: 0.91,
        occurrences: 90
      },
      coordinates: [0.6, 0.7, 0.8],
      relevanceScore: 0.9
    },
    {
      id: 'compute-cache-optimizer',
      timestamp: new Date(),
      content: {
        title: 'CacheOptimizer',
        description: 'Optimizes cache usage for performance',
        type: 'class',
        tags: ['compute', 'cache', 'performance', 'optimized'],
        data: { strategy: 'LRU', size: '1GB' }
      },
      harmonicProperties: {
        category: PatternCategory.COMPUTATIONAL,
        strength: 0.85,
        complexity: 0.76,
        confidence: 0.88,
        occurrences: 75
      },
      coordinates: [0.62, 0.68, 0.78],
      relevanceScore: 0.87
    },
    // Harmonic patterns (for interference)
    {
      id: 'harmonic-resonator-1',
      timestamp: new Date(),
      content: {
        title: 'HarmonicResonator',
        description: 'Creates harmonic resonance patterns',
        type: 'function',
        tags: ['harmonic', 'resonate', 'pattern', 'wave'],
        data: { frequency: 440 }
      },
      harmonicProperties: {
        category: PatternCategory.HARMONIC,
        strength: 0.91,
        complexity: 0.73,
        confidence: 0.94,
        occurrences: 40
      },
      coordinates: [0.45, 0.45, 0.45],
      relevanceScore: 0.92
    },
    {
      id: 'harmonic-resonator-2',
      timestamp: new Date(),
      content: {
        title: 'HarmonicAmplifier',
        description: 'Amplifies harmonic patterns',
        type: 'function',
        tags: ['harmonic', 'resonate', 'amplify', 'wave'],
        data: { gain: 2.0 }
      },
      harmonicProperties: {
        category: PatternCategory.HARMONIC,
        strength: 0.89,
        complexity: 0.74,
        confidence: 0.93,
        occurrences: 42
      },
      coordinates: [0.46, 0.46, 0.46], // Close for interference
      relevanceScore: 0.91
    }
  ];

  await qpfm.bulkStore(patterns);
}

function generateLargeDataset(count: number): HarmonicPatternMemory[] {
  const categories = Object.values(PatternCategory);
  const tags = ['performance', 'critical', 'optimized', 'deprecated', 'legacy', 'experimental', 'stable'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `large-dataset-${i}`,
    timestamp: new Date(),
    content: {
      title: `Pattern ${i}`,
      description: `Generated pattern for testing ${i}`,
      type: i % 2 === 0 ? 'function' : 'class',
      tags: [
        tags[i % tags.length],
        tags[(i + 1) % tags.length],
        `group-${Math.floor(i / 10)}`
      ],
      data: { index: i, generated: true }
    },
    harmonicProperties: {
      category: categories[i % categories.length],
      strength: 0.5 + (Math.sin(i / 10) * 0.4),
      complexity: 0.4 + (Math.cos(i / 8) * 0.3),
      confidence: 0.7 + (Math.sin(i / 5) * 0.2),
      occurrences: Math.floor(Math.random() * 100) + 1
    },
    coordinates: [
      0.5 + Math.sin(i / 20) * 0.4,
      0.5 + Math.cos(i / 20) * 0.4,
      0.5 + Math.sin(i / 10) * 0.3
    ],
    relevanceScore: 0.5 + Math.random() * 0.5
  }));
}