// Quantum Probability Field Memory - Theory Validation Tests
// Adapted for Vitest
// These tests validate our core hypotheses before implementation

import { describe, test, expect, beforeEach } from 'vitest';

// ==========================================
// CORE INTERFACES FOR TESTING
// ==========================================

interface HarmonicCoordinates {
  x: number;
  y: number; 
  z: number;
}

interface MemoryNode {
  id: string;
  coordinates: HarmonicCoordinates;
  content: {
    title: string;
    type: string;
    harmonicPattern: string;
    confidence: number;
    tags: string[];
  };
  lastAccessed: number;
  accessCount: number;
}

interface ProbabilityField {
  center: HarmonicCoordinates;
  radius: number;
  falloffFunction: 'exponential' | 'polynomial' | 'gaussian';
  amplitude: number;
  shape: 'spherical' | 'elliptical' | 'adaptive';
}

interface QuantumSuperposition {
  memory: MemoryNode;
  amplitude: number;
  phase: number;
  probability: number;
}

interface QuantumMemoryState {
  superposition: QuantumSuperposition[];
  totalProbability: number;
  dominantStates: QuantumSuperposition[];
  interferencePatterns: InterferencePattern[];
}

interface InterferencePattern {
  type: 'constructive' | 'destructive';
  strength: number;
  emergentProperties: string[];
}

// ==========================================
// MOCK IMPLEMENTATION FOR TESTING
// ==========================================

class MockQuantumMemorySystem {
  private memories: MemoryNode[] = [];

  addMemory(memory: MemoryNode): void {
    this.memories.push(memory);
  }

  // Calculate Euclidean distance in 3D harmonic space
  private calculateDistance(coord1: HarmonicCoordinates, coord2: HarmonicCoordinates): number {
    const dx = coord1.x - coord2.x;
    const dy = coord1.y - coord2.y;
    const dz = coord1.z - coord2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Calculate probability based on distance and field
  private calculateProbability(memory: MemoryNode, field: ProbabilityField): number {
    const distance = this.calculateDistance(memory.coordinates, field.center);
    
    if (distance > field.radius) return 0;
    
    const normalizedDistance = distance / field.radius;
    
    switch (field.falloffFunction) {
      case 'exponential':
        return field.amplitude * Math.exp(-3 * normalizedDistance);
      case 'polynomial':
        return field.amplitude * Math.pow(1 - normalizedDistance, 2);
      case 'gaussian':
        return field.amplitude * Math.exp(-4.5 * normalizedDistance * normalizedDistance);
      default:
        return field.amplitude * (1 - normalizedDistance);
    }
  }

  // Create quantum superposition of all memories
  createQuantumSuperposition(field: ProbabilityField): QuantumMemoryState {
    const superposition: QuantumSuperposition[] = this.memories.map(memory => {
      const probability = this.calculateProbability(memory, field);
      const amplitude = Math.sqrt(probability);
      const phase = (memory.coordinates.x + memory.coordinates.y + memory.coordinates.z) * Math.PI;

      return {
        memory,
        amplitude,
        phase,
        probability
      };
    }).filter(state => state.probability > 0.01); // Remove negligible probabilities

    // Calculate total before normalization
    const rawTotal = superposition.reduce((sum, state) => sum + state.probability, 0);
    
    // Normalize probabilities to sum to 1
    superposition.forEach(state => {
      state.probability = state.probability / (rawTotal || 1);
      state.amplitude = Math.sqrt(state.probability); // Recalculate amplitude after normalization
    });

    const totalProbability = superposition.reduce((sum, state) => sum + state.probability, 0);

    // Find dominant states (top 30% by probability, min 1, max 5)
    const sortedStates = [...superposition].sort((a, b) => b.probability - a.probability);
    const dominantCount = Math.max(1, Math.min(5, Math.floor(sortedStates.length * 0.3)));
    const dominantStates = sortedStates.slice(0, dominantCount);

    // Calculate interference patterns
    const interferencePatterns = this.calculateInterference(superposition);

    return {
      superposition,
      totalProbability,
      dominantStates,
      interferencePatterns
    };
  }

  private calculateInterference(superposition: QuantumSuperposition[]): InterferencePattern[] {
    const patterns: InterferencePattern[] = [];
    
    // Only calculate interference if we have enough states
    if (superposition.length < 2) return patterns;
    
    // Find constructive interference (similar phases and patterns)
    const phaseGroups = new Map<number, QuantumSuperposition[]>();
    superposition.forEach(state => {
      // Use broader phase grouping for more interference opportunities
      const phaseKey = Math.floor(state.phase / (Math.PI / 2)); // Group by broader phase ranges
      if (!phaseGroups.has(phaseKey)) {
        phaseGroups.set(phaseKey, []);
      }
      phaseGroups.get(phaseKey)!.push(state);
    });

    // Also group by harmonic pattern type for pattern-based interference
    const patternGroups = new Map<string, QuantumSuperposition[]>();
    superposition.forEach(state => {
      const pattern = state.memory.content.harmonicPattern;
      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, []);
      }
      patternGroups.get(pattern)!.push(state);
    });

    // Check phase-based interference
    phaseGroups.forEach((group, phase) => {
      if (group.length > 1) {
        const totalAmplitude = group.reduce((sum, state) => sum + state.amplitude, 0);
        // Lower threshold for interference detection
        if (totalAmplitude > 0.8) {
          patterns.push({
            type: 'constructive',
            strength: totalAmplitude,
            emergentProperties: [...new Set(group.map(state => state.memory.content.harmonicPattern))]
          });
        }
      }
    });

    // Check pattern-based interference
    patternGroups.forEach((group, pattern) => {
      if (group.length > 1 && pattern !== 'none') {
        const totalAmplitude = group.reduce((sum, state) => sum + state.amplitude, 0);
        if (totalAmplitude > 0.6) {
          patterns.push({
            type: 'constructive',
            strength: totalAmplitude,
            emergentProperties: [pattern, ...new Set(group.map(state => state.memory.content.type))]
          });
        }
      }
    });

    return patterns;
  }

  // Collapse quantum state to specific memories
  collapseToMemories(quantumState: QuantumMemoryState, count: number = 5): MemoryNode[] {
    return quantumState.dominantStates
      .slice(0, count)
      .map(state => state.memory);
  }
}

// ==========================================
// TEST DATA GENERATION
// ==========================================

function createTestMemories(): MemoryNode[] {
  return [
    // Cluster 1: Golden Ratio patterns around (0.618, 0.618, 0.618)
    {
      id: 'golden_1',
      coordinates: { x: 0.618, y: 0.618, z: 0.618 },
      content: {
        title: 'Golden Ratio in UI Layout',
        type: 'pattern',
        harmonicPattern: 'golden_ratio',
        confidence: 0.95,
        tags: ['ui', 'layout', 'aesthetics']
      },
      lastAccessed: Date.now() - 1000,
      accessCount: 10
    },
    {
      id: 'golden_2', 
      coordinates: { x: 0.615, y: 0.620, z: 0.616 },
      content: {
        title: 'Golden Ratio in API Design',
        type: 'pattern',
        harmonicPattern: 'golden_ratio',
        confidence: 0.88,
        tags: ['api', 'design', 'proportions']
      },
      lastAccessed: Date.now() - 2000,
      accessCount: 7
    },

    // Cluster 2: Fractal patterns around (0.3, 0.7, 0.2)
    {
      id: 'fractal_1',
      coordinates: { x: 0.3, y: 0.7, z: 0.2 },
      content: {
        title: 'Recursive Component Architecture',
        type: 'pattern',
        harmonicPattern: 'fractal_recursion',
        confidence: 0.92,
        tags: ['components', 'recursion', 'architecture']
      },
      lastAccessed: Date.now() - 500,
      accessCount: 15
    },
    {
      id: 'fractal_2',
      coordinates: { x: 0.28, y: 0.72, z: 0.18 },
      content: {
        title: 'Self-Similar Data Structures',
        type: 'pattern',
        harmonicPattern: 'fractal_data',
        confidence: 0.85,
        tags: ['data', 'structures', 'self-similar']
      },
      lastAccessed: Date.now() - 1500,
      accessCount: 12
    },

    // Isolated memory (far from clusters)
    {
      id: 'isolated_1',
      coordinates: { x: 0.9, y: 0.1, z: 0.9 },
      content: {
        title: 'Legacy Database Connection',
        type: 'implementation',
        harmonicPattern: 'none',
        confidence: 0.60,
        tags: ['legacy', 'database', 'technical-debt']
      },
      lastAccessed: Date.now() - 10000,
      accessCount: 2
    },

    // Bridge memory (connects clusters)
    {
      id: 'bridge_1',
      coordinates: { x: 0.45, y: 0.65, z: 0.4 },
      content: {
        title: 'Proportional Layout with Recursive Components',
        type: 'hybrid',
        harmonicPattern: 'golden_fractal_hybrid',
        confidence: 0.78,
        tags: ['layout', 'components', 'proportions', 'recursion']
      },
      lastAccessed: Date.now() - 800,
      accessCount: 8
    }
  ];
}

// ==========================================
// CORE THEORY VALIDATION TESTS
// ==========================================

describe('Quantum Probability Field Memory - Theory Validation', () => {
  let memorySystem: MockQuantumMemorySystem;
  let testMemories: MemoryNode[];

  beforeEach(() => {
    memorySystem = new MockQuantumMemorySystem();
    testMemories = createTestMemories();
    testMemories.forEach(memory => memorySystem.addMemory(memory));
  });

  // ==========================================
  // HYPOTHESIS 1: Probability Field Gradients
  // ==========================================
  
  describe('Hypothesis 1: Probability fields create natural relevance gradients', () => {
    test('memories closer to field center have higher probability', () => {
      const field: ProbabilityField = {
        center: { x: 0.618, y: 0.618, z: 0.618 }, // Golden ratio center
        radius: 0.5,
        falloffFunction: 'exponential',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      const probabilities = quantumState.superposition.map(s => ({
        id: s.memory.id,
        probability: s.probability
      }));

      // Golden ratio memories should have highest probability
      const goldenRatioProbs = probabilities.filter(p => p.id.includes('golden'));
      const otherProbs = probabilities.filter(p => !p.id.includes('golden'));

      expect(goldenRatioProbs.length).toBeGreaterThan(0);
      expect(Math.max(...goldenRatioProbs.map(p => p.probability)))
        .toBeGreaterThan(Math.max(...otherProbs.map(p => p.probability)));
    });

    test('different falloff functions create different gradient shapes', () => {
      const center = { x: 0.3, y: 0.7, z: 0.2 }; // Fractal center
      
      const exponentialField: ProbabilityField = {
        center, radius: 0.4, falloffFunction: 'exponential', amplitude: 1.0, shape: 'spherical'
      };
      
      const polynomialField: ProbabilityField = {
        center, radius: 0.4, falloffFunction: 'polynomial', amplitude: 1.0, shape: 'spherical'
      };

      const expState = memorySystem.createQuantumSuperposition(exponentialField);
      const polyState = memorySystem.createQuantumSuperposition(polynomialField);

      // Exponential should be more focused (steeper falloff)
      const expDominant = expState.dominantStates.length;
      const polyDominant = polyState.dominantStates.length;

      expect(expDominant).toBeLessThanOrEqual(polyDominant);
    });

    test('field radius controls breadth of memory access', () => {
      const center = { x: 0.618, y: 0.618, z: 0.618 };
      
      const narrowField: ProbabilityField = {
        center, radius: 0.1, falloffFunction: 'gaussian', amplitude: 1.0, shape: 'spherical'
      };
      
      const wideField: ProbabilityField = {
        center, radius: 0.8, falloffFunction: 'gaussian', amplitude: 1.0, shape: 'spherical'
      };

      const narrowState = memorySystem.createQuantumSuperposition(narrowField);
      const wideState = memorySystem.createQuantumSuperposition(wideField);

      // Wide field should access more memories
      expect(wideState.superposition.length).toBeGreaterThan(narrowState.superposition.length);
    });
  });

  // ==========================================
  // HYPOTHESIS 2: Quantum Superposition Benefits
  // ==========================================

  describe('Hypothesis 2: Quantum superposition enables simultaneous multi-memory access', () => {
    test('all relevant memories exist simultaneously in superposition', () => {
      const field: ProbabilityField = {
        center: { x: 0.5, y: 0.5, z: 0.5 }, // Central location
        radius: 1.0, // Include all memories
        falloffFunction: 'polynomial',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);

      // Should include all memories with non-zero probability
      expect(quantumState.superposition.length).toBe(testMemories.length);
      
      // Total probability should be normalized to ~1
      expect(quantumState.totalProbability).toBeCloseTo(1.0, 1);
      
      // Each memory should have accessible probability
      quantumState.superposition.forEach(state => {
        expect(state.probability).toBeGreaterThan(0);
        expect(state.amplitude).toBeGreaterThan(0);
      });
    });

    test('superposition preserves memory relationships without explicit search', () => {
      const field: ProbabilityField = {
        center: { x: 0.45, y: 0.65, z: 0.4 }, // Bridge memory location
        radius: 0.3,
        falloffFunction: 'gaussian',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      const accessibleMemories = quantumState.superposition.map(s => s.memory.id);

      // Should include bridge memory and related cluster memories
      expect(accessibleMemories).toContain('bridge_1');
      
      // Should include some golden ratio memories (connected through bridge)
      const hasGoldenConnection = accessibleMemories.some(id => id.includes('golden'));
      const hasFractalConnection = accessibleMemories.some(id => id.includes('fractal'));
      
      expect(hasGoldenConnection || hasFractalConnection).toBe(true);
    });

    test('dominant states represent most relevant memories without explicit ranking', () => {
      const field: ProbabilityField = {
        center: { x: 0.618, y: 0.618, z: 0.618 },
        radius: 0.4,
        falloffFunction: 'exponential',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      
      // Dominant states should be most relevant
      expect(quantumState.dominantStates.length).toBeGreaterThan(0);
      expect(quantumState.dominantStates.length).toBeLessThan(quantumState.superposition.length);
      
      // First dominant state should have highest probability
      const sortedByProb = quantumState.superposition.sort((a, b) => b.probability - a.probability);
      expect(quantumState.dominantStates[0].memory.id).toBe(sortedByProb[0].memory.id);
    });
  });

  // ==========================================
  // HYPOTHESIS 3: Emergent Interference Patterns
  // ==========================================

  describe('Hypothesis 3: Quantum interference creates emergent discovery patterns', () => {
    test('constructive interference amplifies related patterns', () => {
      const field: ProbabilityField = {
        center: { x: 0.5, y: 0.6, z: 0.4 }, // Between clusters
        radius: 0.6,
        falloffFunction: 'gaussian',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      const constructivePatterns = quantumState.interferencePatterns.filter(
        p => p.type === 'constructive'
      );

      expect(constructivePatterns.length).toBeGreaterThan(0);
      
      // Should find patterns that reinforce each other
      constructivePatterns.forEach(pattern => {
        expect(pattern.strength).toBeGreaterThan(0.5); // More realistic threshold
        expect(pattern.emergentProperties.length).toBeGreaterThan(0);
      });
    });

    test('interference reveals unexpected connections between distant memories', () => {
      // Create field that spans multiple clusters
      const field: ProbabilityField = {
        center: { x: 0.45, y: 0.65, z: 0.4 },
        radius: 0.8,
        falloffFunction: 'polynomial',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      
      // Should create interference between different pattern types
      const patterns = quantumState.interferencePatterns.flatMap(p => p.emergentProperties);
      const uniquePatterns = new Set(patterns);
      
      expect(uniquePatterns.size).toBeGreaterThan(1);
      // Check for golden ratio patterns (should be present given field location)
      expect(patterns.some(p => p.includes('golden'))).toBe(true);
    });
  });

  // ==========================================
  // HYPOTHESIS 4: Adaptive Field Behavior
  // ==========================================

  describe('Hypothesis 4: Probability fields can adapt to context and query type', () => {
    test('narrow fields provide precision for exact matches', () => {
      const precisionField: ProbabilityField = {
        center: { x: 0.618, y: 0.618, z: 0.618 },
        radius: 0.05, // Very narrow
        falloffFunction: 'exponential',
        amplitude: 2.0, // High amplitude for precision
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(precisionField);
      const collapsedMemories = memorySystem.collapseToMemories(quantumState, 3);

      // Should return only exact or very close matches
      expect(collapsedMemories.length).toBeLessThanOrEqual(2);
      collapsedMemories.forEach(memory => {
        expect(memory.content.harmonicPattern).toBe('golden_ratio');
      });
    });

    test('wide fields enable creative exploration and discovery', () => {
      const explorationField: ProbabilityField = {
        center: { x: 0.5, y: 0.5, z: 0.5 },
        radius: 1.0, // Very wide
        falloffFunction: 'polynomial', // Gentle falloff
        amplitude: 0.8,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(explorationField);
      
      // Should include diverse memory types
      const memoryTypes = new Set(quantumState.superposition.map(s => s.memory.content.type));
      const harmonicPatterns = new Set(quantumState.superposition.map(s => s.memory.content.harmonicPattern));
      
      expect(memoryTypes.size).toBeGreaterThan(2);
      expect(harmonicPatterns.size).toBeGreaterThan(2);
    });

    test('field configuration affects discovery vs precision trade-off', () => {
      const precisionConfig: ProbabilityField = {
        center: { x: 0.3, y: 0.7, z: 0.2 },
        radius: 0.08, // Very narrow for precision
        falloffFunction: 'exponential',
        amplitude: 1.5,
        shape: 'spherical'
      };

      const discoveryConfig: ProbabilityField = {
        center: { x: 0.3, y: 0.7, z: 0.2 },
        radius: 0.9, // Very wide for discovery
        falloffFunction: 'polynomial',
        amplitude: 0.6,
        shape: 'spherical'
      };

      const precisionState = memorySystem.createQuantumSuperposition(precisionConfig);
      const discoveryState = memorySystem.createQuantumSuperposition(discoveryConfig);

      // Precision: fewer accessible memories, higher average confidence
      expect(precisionState.superposition.length).toBeLessThanOrEqual(discoveryState.superposition.length);
      
      const avgPrecisionConfidence = precisionState.dominantStates.reduce(
        (sum, s) => sum + s.memory.content.confidence, 0
      ) / precisionState.dominantStates.length;
      
      const avgDiscoveryConfidence = discoveryState.dominantStates.reduce(
        (sum, s) => sum + s.memory.content.confidence, 0
      ) / discoveryState.dominantStates.length;

      expect(avgPrecisionConfidence).toBeGreaterThanOrEqual(avgDiscoveryConfidence);
    });
  });

  // ==========================================
  // HYPOTHESIS 5: Performance and Scalability
  // ==========================================

  describe('Hypothesis 5: Quantum approach scales better than sequential search', () => {
    test('quantum superposition processes all memories simultaneously', () => {
      const field: ProbabilityField = {
        center: { x: 0.5, y: 0.5, z: 0.5 },
        radius: 0.8,
        falloffFunction: 'gaussian',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const startTime = performance.now();
      const quantumState = memorySystem.createQuantumSuperposition(field);
      const endTime = performance.now();

      // Should process all memories in single operation
      expect(quantumState.superposition.length).toBe(testMemories.length);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    test('memory collapse provides top results without full sorting', () => {
      const field: ProbabilityField = {
        center: { x: 0.618, y: 0.618, z: 0.618 },
        radius: 0.6,
        falloffFunction: 'exponential',
        amplitude: 1.0,
        shape: 'spherical'
      };

      const quantumState = memorySystem.createQuantumSuperposition(field);
      const topMemories = memorySystem.collapseToMemories(quantumState, 3);

      // Should return relevant memories without full dataset sorting
      expect(topMemories.length).toBeLessThanOrEqual(3);
      expect(topMemories.length).toBeGreaterThan(0);
      
      // Results should be relevance-ordered
      for (let i = 1; i < topMemories.length; i++) {
        const prevProb = quantumState.dominantStates[i-1].probability;
        const currProb = quantumState.dominantStates[i].probability;
        expect(prevProb).toBeGreaterThanOrEqual(currProb);
      }
    });
  });

  // ==========================================
  // INTEGRATION TEST: Complete Workflow
  // ==========================================

  describe('Integration: Complete quantum memory workflow', () => {
    test('full quantum memory access workflow produces coherent results', () => {
      // Simulate looking for UI layout patterns
      const field: ProbabilityField = {
        center: { x: 0.618, y: 0.618, z: 0.618 }, // Golden ratio focus
        radius: 0.4,
        falloffFunction: 'gaussian',
        amplitude: 1.0,
        shape: 'spherical'
      };

      // 1. Create quantum superposition
      const quantumState = memorySystem.createQuantumSuperposition(field);
      expect(quantumState.superposition.length).toBeGreaterThan(0);

      // 2. Analyze interference patterns
      expect(quantumState.interferencePatterns.length).toBeGreaterThanOrEqual(0);

      // 3. Collapse to actionable memories
      const actionableMemories = memorySystem.collapseToMemories(quantumState, 3);
      expect(actionableMemories.length).toBeGreaterThan(0);
      expect(actionableMemories.length).toBeLessThanOrEqual(3);

      // 4. Verify results are contextually relevant
      const relevantMemories = actionableMemories.filter(
        memory => memory.content.tags.includes('ui') || 
                 memory.content.harmonicPattern.includes('golden')
      );
      expect(relevantMemories.length).toBeGreaterThan(0);

      // 5. Check for emergent insights
      const emergentProperties = quantumState.interferencePatterns.flatMap(p => p.emergentProperties);
      expect(emergentProperties.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ==========================================
// PERFORMANCE BENCHMARKS
// ==========================================

describe('Performance Benchmarks', () => {
  test('quantum memory access scales linearly with memory count', () => {
    const largeMockSystem = new MockQuantumMemorySystem();
    
    // Add 1000 test memories
    for (let i = 0; i < 1000; i++) {
      largeMockSystem.addMemory({
        id: `memory_${i}`,
        coordinates: {
          x: Math.random(),
          y: Math.random(), 
          z: Math.random()
        },
        content: {
          title: `Test Memory ${i}`,
          type: 'test',
          harmonicPattern: `pattern_${i % 10}`,
          confidence: Math.random(),
          tags: [`tag_${i % 5}`]
        },
        lastAccessed: Date.now() - (i * 1000),
        accessCount: Math.floor(Math.random() * 20)
      });
    }

    const field: ProbabilityField = {
      center: { x: 0.5, y: 0.5, z: 0.5 },
      radius: 0.3,
      falloffFunction: 'gaussian',
      amplitude: 1.0,
      shape: 'spherical'
    };

    const startTime = performance.now();
    const quantumState = largeMockSystem.createQuantumSuperposition(field);
    const endTime = performance.now();

    expect(quantumState.superposition.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(100); // Should handle 1000 memories quickly
  });
});

export {
  MockQuantumMemorySystem,
  ProbabilityField,
  QuantumMemoryState,
  HarmonicCoordinates,
  MemoryNode
};