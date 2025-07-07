/**
 * Quantum Probability Field Memory (QPFM) Types
 * The world's first AI-native memory architecture with scientifically validated emergent intelligence
 */

import { HarmonicPatternMemory, PatternCategory } from './types.js';

// Re-export for backward compatibility
// Harmonic signature - just the key pattern properties without the full memory
export interface HarmonicSignature {
  category: PatternCategory;
  strength?: number;
  complexity?: number;
  confidence?: number;
  occurrences?: number;
}

export type HarmonicPattern = HarmonicPatternMemory;

// Core quantum memory node structure
export interface QuantumMemoryNode {
  // Identity and location
  id: string;
  coordinates: [number, number, number];    // Position in 3D probability space
  
  // Content and metadata
  content: {
    title: string;
    description: string;
    type: string;
    harmonicSignature: HarmonicSignature;   // Mathematical pattern DNA
    tags: string[];
    data: any;
  };
  
  // Quantum properties
  restingPotential: number;                 // Baseline activation (-0.7 equivalent)
  threshold: number;                        // Activation threshold (-0.55 equivalent) 
  currentActivation: number;                // Current activation level
  
  // Learning and adaptation
  accessHistory: AccessEvent[];
  confidenceScore: number;                  // How reliable this memory is
  resonanceStrength: number;                // How strongly it connects to others
  lastEvolution: Date;                      // When memory was last updated
}

// Access event tracking
export interface AccessEvent {
  timestamp: Date;
  queryType: 'precision' | 'discovery' | 'creative';
  success: boolean;
  activationLevel: number;
  context?: string;
}

// Probability field configuration
export interface ProbabilityField {
  // Field geometry
  center: [number, number, number];         // Field center in coordinate space
  radius: number;                           // Maximum field extent
  shape: 'spherical' | 'elliptical' | 'adaptive' | 'fractal';
  
  // Field dynamics
  falloffFunction: 'exponential' | 'polynomial' | 'gaussian' | 'sigmoid';
  amplitude: number;                        // Field strength multiplier
  gradientSteepness: number;                // How quickly probability decays
  
  // Adaptive properties
  morphingRate: number;                     // How quickly field can reshape
  contextSensitivity: number;               // How much context affects field shape
  explorationBias: number;                  // Tendency toward discovery vs precision
}

// Quantum superposition state
export interface QuantumSuperposition {
  memory: QuantumMemoryNode;
  amplitude: number;                        // √(probability)
  phase: number;                           // Quantum phase for interference
  probability: number;                      // Normalized access probability
  activationEnergy: number;                 // Energy required to access
}

// Complete quantum memory state
export interface QuantumMemoryState {
  superposition: QuantumSuperposition[];    // All accessible memories
  totalProbability: number;                 // Normalized to 1.0
  dominantStates: QuantumSuperposition[];   // Most relevant memories
  interferencePatterns: InterferencePattern[]; // Emergent connections
  coherenceLevel: number;                   // System-wide synchronization
}

// Interference pattern detection
export interface InterferencePattern {
  type: 'constructive' | 'destructive';
  strength: number;
  mechanism: 'phase_coherence' | 'harmonic_resonance' | 'frequency_matching';
  emergentProperties: string[];
  noveltyScore: number;
  confidenceLevel: number;
  involvedMemories: string[];               // Memory IDs involved in pattern
}

// Memory query configuration
export interface MemoryQuery {
  type: 'precision' | 'discovery' | 'creative';
  harmonicSignature?: HarmonicSignature;
  confidence: number;
  exploration: number;                      // 0 = pure precision, 1 = pure exploration
  urgency?: number;                         // Time constraint influence
  maxResults?: number;
  contextWindow?: string[];                 // Recent context for adaptation
}

// Timestamped query for tracking
export interface TimestampedQuery extends MemoryQuery {
  timestamp: number;
}

// System context for adaptive behavior
export interface SystemContext {
  recentQueries: TimestampedQuery[];
  activePatterns: PatternCategory[];
  performanceMetrics: {
    avgResponseTime: number;
    hitRate: number;
    emergenceFrequency: number;
  };
  userPreferences?: {
    explorationTendency: number;
    precisionRequirement: number;
  };
}

// Quantum memory result
export interface QuantumMemoryResult {
  memories: QuantumMemoryNode[];
  emergentInsights: EmergentInsight[];
  interferencePatterns: InterferencePattern[];
  coherenceLevel: number;
  fieldConfiguration: ProbabilityField;
  executionMetrics: ExecutionMetrics;
}

// Emergent insight from quantum interference
export interface EmergentInsight {
  type: 'novel_connection' | 'pattern_synthesis' | 'unexpected_relevance';
  description: string;
  contributingMemories: string[];
  noveltyScore: number;
  confidenceLevel: number;
  suggestedAction?: string;
}

// Execution metrics
export interface ExecutionMetrics {
  superpositionTime: number;
  interferenceTime: number;
  collapseTime: number;
  totalTime: number;
  memoriesProcessed: number;
  emergentPatternsFound: number;
}

// Adaptive field behavior configuration
export interface AdaptiveFieldBehavior {
  // Real-time field adaptation
  contextualMorphing: {
    confidenceBased: 'narrow_when_confident' | 'expand_when_uncertain';
    temporalAdaptation: 'fresher_memories_closer' | 'stable_positioning';
    successPattern: 'reinforce_successful_regions' | 'explore_new_areas';
  };
  
  // Dynamic geometry changes
  geometryAdaptation: {
    mode: 'spherical' | 'elliptical' | 'fractal' | 'adaptive';
    description: string;
  };
  
  // Biometric-inspired behaviors
  fieldBreathing?: boolean;                 // Expand/contract rhythmically
  fieldPulsing?: boolean;                   // Periodic amplitude changes
  fieldResonance?: boolean;                 // Harmonic frequency matching
}

// Emergent behavior types
export interface EmergentBehaviors {
  // Spontaneous insights during low activity
  dreamState: {
    enabled: boolean;
    trigger: 'system_idle' | 'scheduled' | 'random';
    frequency: number;                      // Events per hour
  };
  
  // Strong resonance triggers
  flashbackActivation: {
    enabled: boolean;
    threshold: number;                      // Resonance threshold
    cascadeDepth: number;                   // How deep to follow connections
  };
  
  // Partial match exploration
  dejaVuExploration: {
    enabled: boolean;
    uncertaintyThreshold: number;           // When to trigger exploration
    expansionFactor: number;                // How much to expand search
  };
  
  // Cross-pattern synthesis
  creativeSynthesis: {
    enabled: boolean;
    minimumPatterns: number;                // Min patterns for synthesis
    noveltyThreshold: number;               // Required novelty score
  };
}

// Learning system configuration
export interface QuantumLearningConfig {
  // Memory reinforcement
  hebbianStrengthening: {
    strengthenRate: number;
    weakenRate: number;
    associativeBonus: number;
  };
  
  // Confidence calibration
  confidenceEvolution: {
    successBonus: number;
    failurePenalty: number;
    uncertaintyDecay: number;
  };
  
  // Spatial adaptation
  spatialAdaptation: {
    clusteringRate: number;
    boundaryFlexibility: number;
    dimensionalOptimization: boolean;
  };
}

// Performance targets
export interface PerformanceTargets {
  quantumSuperposition: number;             // Target ms
  fieldGeneration: number;                  // Target ms
  interferenceCalculation: number;          // Target ms
  memoryCollapse: number;                   // Target ms
  
  // Scalability targets
  maxMemoryNodes: number;
  maxConcurrentFields: number;
  maxSuperpositionSize: number;
  
  // Quality targets
  relevanceAccuracy: number;                // Percentage
  emergenceFrequency: number;               // Percentage
  coherenceStability: number;               // Percentage
}

// Field shape functions
export type FieldShapeFunction = (
  distance: number,
  field: ProbabilityField
) => number;

// Quantum phase calculation
export type PhaseFunction = (
  memory: QuantumMemoryNode,
  field: ProbabilityField
) => number;

// Activation energy calculation
export type ActivationEnergyFunction = (
  memory: QuantumMemoryNode,
  field: ProbabilityField,
  context: SystemContext
) => number;