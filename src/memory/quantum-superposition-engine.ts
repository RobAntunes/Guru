/**
 * Quantum Superposition Engine
 * Creates quantum superposition states from probability fields and memory nodes
 */

import {
  QuantumMemoryNode,
  QuantumSuperposition,
  QuantumMemoryState,
  ProbabilityField,
  InterferencePattern,
  PhaseFunction,
  ActivationEnergyFunction
} from './quantum-types.js';
import { HarmonicPatternMemory } from './types.js';
import { QuantumFieldGenerator } from './quantum-field-generator.js';

export class QuantumSuperpositionEngine {
  private fieldGenerator: QuantumFieldGenerator;
  private phaseFunction: PhaseFunction;
  private activationFunction: ActivationEnergyFunction;

  constructor() {
    this.fieldGenerator = new QuantumFieldGenerator();
    this.initializeFunctions();
  }

  /**
   * Initialize phase and activation functions
   */
  private initializeFunctions(): void {
    // Phase calculation based on harmonic resonance
    this.phaseFunction = (memory: QuantumMemoryNode, field: ProbabilityField) => {
      const harmonicPhase = this.calculateHarmonicPhase(
        memory.content.harmonicSignature,
        field.center
      );
      
      const distancePhase = this.calculateDistancePhase(
        memory.coordinates,
        field.center
      );
      
      return (harmonicPhase + distancePhase) % (2 * Math.PI);
    };

    // Activation energy based on threshold dynamics
    this.activationFunction = (memory: QuantumMemoryNode, field: ProbabilityField, context: any) => {
      const baseEnergy = memory.threshold - memory.currentActivation;
      const fieldBoost = field.amplitude * 0.3;
      const confidenceModifier = memory.confidenceScore * 0.2;
      
      return Math.max(0, baseEnergy - fieldBoost - confidenceModifier);
    };
  }

  /**
   * Create quantum superposition from field and memories
   */
  async createSuperposition(
    field: ProbabilityField,
    memories: QuantumMemoryNode[]
  ): Promise<QuantumMemoryState> {
    
    // Calculate probability for each memory
    const superpositionStates = memories.map(memory => {
      const probability = this.fieldGenerator.calculateProbability(
        memory.coordinates,
        field
      );
      
      // FIXED: More permissive threshold for better memory discovery
      if (probability < 0.0001) {
        return null;
      }

      const amplitude = Math.sqrt(probability);
      const phase = this.phaseFunction(memory, field);
      const activationEnergy = this.activationFunction(memory, field, {});

      return {
        memory,
        amplitude,
        phase,
        probability,
        activationEnergy
      } as QuantumSuperposition;
    }).filter((state): state is QuantumSuperposition => state !== null);

    // Normalize probabilities
    const totalProbability = superpositionStates.reduce(
      (sum, state) => sum + state.probability, 
      0
    );

    if (totalProbability > 0) {
      superpositionStates.forEach(state => {
        state.probability = state.probability / totalProbability;
        state.amplitude = Math.sqrt(state.probability);
      });
    }

    // Find dominant states
    const sortedStates = [...superpositionStates].sort(
      (a, b) => b.probability - a.probability
    );
    const dominantThreshold = Math.max(
      0.1, // At least 10% probability
      sortedStates.length > 0 ? sortedStates[0].probability * 0.3 : 0 // Or 30% of max
    );
    const dominantStates = sortedStates.filter(
      state => state.probability >= dominantThreshold
    );

    // Calculate interference patterns
    const interferencePatterns = await this.calculateInterference(superpositionStates);

    // Calculate coherence level
    const coherenceLevel = this.calculateCoherence(superpositionStates);

    return {
      superposition: superpositionStates,
      totalProbability: 1.0,
      dominantStates,
      interferencePatterns,
      coherenceLevel
    };
  }

  /**
   * Calculate interference patterns between superposed states
   */
  async calculateInterference(
    superposition: QuantumSuperposition[]
  ): Promise<InterferencePattern[]> {
    const patterns: InterferencePattern[] = [];
    
    // Phase-based interference
    const phasePatterns = this.detectPhaseInterference(superposition);
    patterns.push(...phasePatterns);

    // Harmonic resonance interference
    const harmonicPatterns = this.detectHarmonicInterference(superposition);
    patterns.push(...harmonicPatterns);

    // Frequency matching interference
    const frequencyPatterns = this.detectFrequencyInterference(superposition);
    patterns.push(...frequencyPatterns);

    // Sort by strength
    patterns.sort((a, b) => b.strength - a.strength);

    return patterns;
  }

  /**
   * Detect phase-based interference patterns
   */
  private detectPhaseInterference(
    superposition: QuantumSuperposition[]
  ): InterferencePattern[] {
    const patterns: InterferencePattern[] = [];
    const phaseThreshold = Math.PI / 3; // FIXED: 60 degrees - more permissive grouping

    // Group memories by similar phase
    const phaseGroups = new Map<number, QuantumSuperposition[]>();
    
    superposition.forEach(state => {
      const phaseBucket = Math.floor(state.phase / phaseThreshold) * phaseThreshold;
      if (!phaseGroups.has(phaseBucket)) {
        phaseGroups.set(phaseBucket, []);
      }
      phaseGroups.get(phaseBucket)!.push(state);
    });

    // Find constructive interference
    phaseGroups.forEach((group, phase) => {
      if (group.length > 1) {
        const totalAmplitude = group.reduce((sum, s) => sum + s.amplitude, 0);
        
        if (totalAmplitude > 0.2) { // FIXED: Lower threshold for interference detection
          patterns.push({
            type: 'constructive',
            strength: totalAmplitude,
            mechanism: 'phase_coherence',
            emergentProperties: this.extractEmergentProperties(group),
            noveltyScore: this.calculateNovelty(group),
            confidenceLevel: this.calculateGroupConfidence(group),
            involvedMemories: group.map(s => s.memory.id)
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Detect harmonic resonance interference
   */
  private detectHarmonicInterference(
    superposition: QuantumSuperposition[]
  ): InterferencePattern[] {
    const patterns: InterferencePattern[] = [];
    
    // Group by harmonic category
    const harmonicGroups = new Map<string, QuantumSuperposition[]>();
    
    superposition.forEach(state => {
      const category = state.memory.content.harmonicSignature.category;
      if (!harmonicGroups.has(category)) {
        harmonicGroups.set(category, []);
      }
      harmonicGroups.get(category)!.push(state);
    });

    // Find resonance patterns
    harmonicGroups.forEach((group, category) => {
      if (group.length >= 2) { // FIXED: Allow pairs to create patterns
        const avgStrength = group.reduce(
          (sum, s) => sum + s.memory.content.harmonicSignature.strength, 0
        ) / group.length;

        if (avgStrength > 0.3) { // FIXED: Lower threshold for harmonic interference
          patterns.push({
            type: 'constructive',
            strength: avgStrength * group.length / 10, // Scale by group size
            mechanism: 'harmonic_resonance',
            emergentProperties: [`${category}_cluster`, `strength_${avgStrength.toFixed(2)}`],
            noveltyScore: this.calculateHarmonicNovelty(group),
            confidenceLevel: avgStrength,
            involvedMemories: group.map(s => s.memory.id)
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Detect frequency matching interference
   */
  private detectFrequencyInterference(
    superposition: QuantumSuperposition[]
  ): InterferencePattern[] {
    const patterns: InterferencePattern[] = [];
    
    // Compare activation frequencies
    for (let i = 0; i < superposition.length - 1; i++) {
      for (let j = i + 1; j < superposition.length; j++) {
        const state1 = superposition[i];
        const state2 = superposition[j];
        
        // Check if activation patterns match
        const freq1 = this.calculateActivationFrequency(state1.memory);
        const freq2 = this.calculateActivationFrequency(state2.memory);
        
        const freqRatio = Math.min(freq1, freq2) / Math.max(freq1, freq2);
        
        // Harmonic frequency ratios (1:1, 2:1, 3:2, etc.)
        const harmonicRatios = [1, 0.5, 0.667, 0.75];
        const isHarmonic = harmonicRatios.some(
          ratio => Math.abs(freqRatio - ratio) < 0.05
        );
        
        if (isHarmonic && state1.amplitude * state2.amplitude > 0.2) {
          patterns.push({
            type: 'constructive',
            strength: state1.amplitude * state2.amplitude,
            mechanism: 'frequency_matching',
            emergentProperties: [`freq_ratio_${freqRatio.toFixed(2)}`],
            noveltyScore: 0.7,
            confidenceLevel: (state1.memory.confidenceScore + state2.memory.confidenceScore) / 2,
            involvedMemories: [state1.memory.id, state2.memory.id]
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Calculate coherence level of the superposition
   */
  private calculateCoherence(superposition: QuantumSuperposition[]): number {
    if (superposition.length === 0) return 0;

    // Phase coherence
    const avgPhase = superposition.reduce((sum, s) => sum + s.phase, 0) / superposition.length;
    const phaseVariance = superposition.reduce(
      (sum, s) => sum + Math.pow(s.phase - avgPhase, 2), 0
    ) / superposition.length;
    const phaseCoherence = 1 / (1 + phaseVariance);

    // Amplitude coherence
    const amplitudes = superposition.map(s => s.amplitude);
    const maxAmplitude = Math.max(...amplitudes);
    const minAmplitude = Math.min(...amplitudes);
    const amplitudeCoherence = minAmplitude / maxAmplitude;

    // Spatial coherence
    const spatialCoherence = this.calculateSpatialCoherence(superposition);

    // Combined coherence
    return (phaseCoherence * 0.4 + amplitudeCoherence * 0.3 + spatialCoherence * 0.3);
  }

  /**
   * Calculate spatial coherence based on coordinate clustering
   */
  private calculateSpatialCoherence(superposition: QuantumSuperposition[]): number {
    if (superposition.length < 2) return 1;

    // Calculate centroid
    const centroid = superposition.reduce(
      (acc, s) => [
        acc[0] + s.memory.coordinates[0],
        acc[1] + s.memory.coordinates[1],
        acc[2] + s.memory.coordinates[2]
      ],
      [0, 0, 0]
    ).map(v => v / superposition.length) as [number, number, number];

    // Calculate average distance from centroid
    const avgDistance = superposition.reduce((sum, s) => {
      const dx = s.memory.coordinates[0] - centroid[0];
      const dy = s.memory.coordinates[1] - centroid[1];
      const dz = s.memory.coordinates[2] - centroid[2];
      return sum + Math.sqrt(dx * dx + dy * dy + dz * dz);
    }, 0) / superposition.length;

    // Convert to coherence (closer = more coherent)
    return Math.exp(-avgDistance * 2);
  }

  /**
   * Extract emergent properties from a group of states
   */
  private extractEmergentProperties(group: QuantumSuperposition[]): string[] {
    const properties: Set<string> = new Set();

    // Common tags
    const tagCounts = new Map<string, number>();
    group.forEach(state => {
      state.memory.content.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Add frequently occurring tags
    tagCounts.forEach((count, tag) => {
      if (count >= group.length * 0.5) {
        properties.add(`common_${tag}`);
      }
    });

    // Phase alignment
    const phases = group.map(s => s.phase);
    const phaseStd = this.calculateStandardDeviation(phases);
    if (phaseStd < Math.PI / 4) {
      properties.add('phase_aligned');
    }

    // Confidence convergence
    const confidences = group.map(s => s.memory.confidenceScore);
    const confStd = this.calculateStandardDeviation(confidences);
    if (confStd < 0.1) {
      properties.add('confidence_consensus');
    }

    return Array.from(properties);
  }

  /**
   * Calculate novelty score for a group
   */
  private calculateNovelty(group: QuantumSuperposition[]): number {
    // Diversity of harmonic signatures
    const categories = new Set(
      group.map(s => s.memory.content.harmonicSignature.category)
    );
    const categoryDiversity = categories.size / group.length;

    // Spatial spread
    const coordinates = group.map(s => s.memory.coordinates);
    const spatialSpread = this.calculateSpatialSpread(coordinates);

    // Temporal diversity
    const accessTimes = group.map(s => 
      s.memory.lastEvolution.getTime()
    );
    const temporalSpread = this.calculateTemporalSpread(accessTimes);

    return (categoryDiversity * 0.4 + spatialSpread * 0.3 + temporalSpread * 0.3);
  }

  /**
   * Calculate harmonic novelty
   */
  private calculateHarmonicNovelty(group: QuantumSuperposition[]): number {
    const patterns = group.map(s => s.memory.content.harmonicSignature);
    
    // Complexity variance
    const complexities = patterns.map(p => p.complexity || 0);
    const complexityVar = this.calculateVariance(complexities);
    
    // Strength distribution
    const strengths = patterns.map(p => p.strength || 0);
    const strengthVar = this.calculateVariance(strengths);
    
    return Math.min(1, complexityVar + strengthVar);
  }

  /**
   * Calculate group confidence
   */
  private calculateGroupConfidence(group: QuantumSuperposition[]): number {
    const confidences = group.map(s => s.memory.confidenceScore);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    
    // Penalize if confidences vary too much
    const confStd = this.calculateStandardDeviation(confidences);
    const penalty = Math.min(0.3, confStd);
    
    return Math.max(0, avgConfidence - penalty);
  }

  /**
   * Calculate activation frequency from access history
   */
  private calculateActivationFrequency(memory: QuantumMemoryNode): number {
    const history = memory.accessHistory;
    if (history.length < 2) return 0;

    // Calculate average time between accesses
    let totalInterval = 0;
    for (let i = 1; i < history.length; i++) {
      totalInterval += history[i].timestamp.getTime() - history[i-1].timestamp.getTime();
    }
    
    const avgInterval = totalInterval / (history.length - 1);
    
    // Convert to frequency (accesses per hour)
    return 3600000 / avgInterval;
  }

  // Utility methods

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateSpatialSpread(coordinates: [number, number, number][]): number {
    if (coordinates.length < 2) return 0;

    // Calculate bounding box
    let minX = 1, minY = 1, minZ = 1;
    let maxX = 0, maxY = 0, maxZ = 0;

    coordinates.forEach(([x, y, z]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    });

    // Volume of bounding box (normalized)
    return (maxX - minX) * (maxY - minY) * (maxZ - minZ);
  }

  private calculateTemporalSpread(times: number[]): number {
    if (times.length < 2) return 0;

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const spread = maxTime - minTime;

    // Normalize to 0-1 (1 week = 1.0)
    return Math.min(1, spread / (7 * 24 * 3600 * 1000));
  }

  /**
   * Calculate harmonic phase based on pattern signature
   */
  private calculateHarmonicPhase(
    signature: any,
    fieldCenter: [number, number, number]
  ): number {
    // Use signature properties to generate a phase
    const categoryHash = this.hashString(signature.category || 'default');
    const strengthComponent = (signature.strength || 0.5) * Math.PI;
    const complexityComponent = (signature.complexity || 0.5) * Math.PI;
    
    // Combine with field center for context
    const fieldInfluence = (fieldCenter[0] + fieldCenter[1] + fieldCenter[2]) / 3;
    
    return (categoryHash + strengthComponent + complexityComponent + fieldInfluence) % (2 * Math.PI);
  }

  /**
   * Calculate distance-based phase
   */
  private calculateDistancePhase(
    coord1: [number, number, number],
    coord2: [number, number, number]
  ): number {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    const dz = coord1[2] - coord2[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Convert distance to phase (wavelength = 0.5)
    return (distance / 0.5) * 2 * Math.PI;
  }

  /**
   * Simple string hash for phase calculation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    point1: [number, number, number],
    point2: [number, number, number]
  ): number {
    const [dx, dy, dz] = [
      point1[0] - point2[0],
      point1[1] - point2[1],
      point1[2] - point2[2]
    ];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}