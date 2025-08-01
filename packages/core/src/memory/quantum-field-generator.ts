/**
 * Quantum Field Generator
 * Generates probability fields around DPCM coordinates for quantum superposition
 */

import { 
  ProbabilityField, 
  MemoryQuery, 
  SystemContext,
  FieldShapeFunction 
} from './quantum-types.js';
import { HarmonicSignature } from './quantum-types.js';
import { LogicOperation } from './types.js';
import { EnhancedParameterHash } from './enhanced-parameter-hash.js';

export class QuantumFieldGenerator {
  private hasher: EnhancedParameterHash;
  
  // Field shape functions
  private fieldShapes: Map<string, FieldShapeFunction> = new Map();
  
  // Category statistics for dynamic centering
  private categoryStats: Map<string, {
    avgStrength: number;
    avgComplexity: number;
    avgOccurrences: number;
    count: number;
  }> = new Map();
  
  constructor() {
    this.hasher = new EnhancedParameterHash();
    this.initializeFieldShapes();
  }

  /**
   * Initialize field shape functions
   */
  private initializeFieldShapes(): void {
    // Exponential falloff - sharp focus
    this.fieldShapes.set('exponential', (distance: number, field: ProbabilityField) => {
      return field.amplitude * Math.exp(-field.gradientSteepness * distance);
    });

    // Polynomial falloff - balanced
    this.fieldShapes.set('polynomial', (distance: number, field: ProbabilityField) => {
      const normalized = Math.min(distance / field.radius, 1);
      return field.amplitude * Math.pow(1 - normalized, field.gradientSteepness);
    });

    // Gaussian falloff - smooth gradient
    this.fieldShapes.set('gaussian', (distance: number, field: ProbabilityField) => {
      const sigma = field.radius / (2 * field.gradientSteepness);
      return field.amplitude * Math.exp(-(distance * distance) / (2 * sigma * sigma));
    });

    // Sigmoid falloff - sharp boundary
    this.fieldShapes.set('sigmoid', (distance: number, field: ProbabilityField) => {
      const x = (distance - field.radius * 0.5) * field.gradientSteepness;
      return field.amplitude / (1 + Math.exp(x));
    });
  }

  /**
   * Generate probability field from query
   */
  generateField(
    query: MemoryQuery,
    context: SystemContext,
    basePattern?: string,
    operations?: LogicOperation[]
  ): ProbabilityField {
    
    // Calculate field center using DPCM composition
    const center = this.calculateFieldCenter(query.harmonicSignature, basePattern, operations);
    
    // Adapt field configuration based on query parameters
    const fieldConfig = this.adaptFieldGeometry({
      queryType: query.type,
      confidenceLevel: query.confidence,
      explorationDesire: query.exploration,
      timeConstraints: query.urgency,
      context
    });
    
    return {
      center,
      radius: fieldConfig.radius,
      shape: fieldConfig.shape,
      falloffFunction: fieldConfig.falloffFunction,
      amplitude: fieldConfig.amplitude,
      gradientSteepness: fieldConfig.gradientSteepness,
      morphingRate: this.calculateMorphingRate(query, context),
      contextSensitivity: this.calculateContextSensitivity(context),
      explorationBias: query.exploration
    };
  }

  /**
   * Calculate field center using DPCM composition
   */
  private calculateFieldCenter(
    harmonicSignature?: HarmonicSignature,
    basePattern?: string,
    operations?: LogicOperation[]
  ): [number, number, number] {
    
    // Determine base pattern
    let pattern = basePattern;
    if (!pattern && harmonicSignature) {
      pattern = harmonicSignature.category;
    }
    if (!pattern) {
      // Random exploration center for truly open queries
      return [Math.random(), Math.random(), Math.random()];
    }

    // SPEC LORD FIX 1: Normalize to uppercase for coordinate consistency
    pattern = pattern.toUpperCase();

    // CRITICAL FIX: For category queries without operations, use semantic coordinates
    // to match how memories are stored in DPCM
    if ((!operations || operations.length === 0) && !harmonicSignature) {
      // Use dynamic category statistics if available
      const stats = this.categoryStats.get(pattern);
      if (stats && stats.count > 0) {
        // Use actual average values from stored patterns
        return this.hasher.generateSemanticCoordinates(
          pattern,
          stats.avgStrength,
          stats.avgComplexity,
          stats.avgOccurrences
        );
      } else {
        // Fallback: use average values that should be closer to typical patterns
        // This helps queries work before we have category statistics
        return this.hasher.generateSemanticCoordinates(
          pattern,
          0.8,  // typical strength for most patterns
          0.6,  // typical complexity
          50    // typical occurrences
        );
      }
    }

    // If we have harmonic signature, use its properties for better alignment
    if (harmonicSignature && (!operations || operations.length === 0)) {
      // For discovery queries with harmonic signature, we want to find memories
      // in the general area, not an exact coordinate match
      const stats = this.categoryStats.get(pattern);
      if (stats && stats.count > 0) {
        // Blend query signature with category averages for better coverage
        return this.hasher.generateSemanticCoordinates(
          pattern,
          (harmonicSignature.strength + stats.avgStrength) / 2,
          (harmonicSignature.complexity + stats.avgComplexity) / 2,
          harmonicSignature.occurrences || stats.avgOccurrences
        );
      } else {
        // Use harmonic signature values directly
        return this.hasher.generateSemanticCoordinates(
          pattern,
          harmonicSignature.strength || 0.8,
          harmonicSignature.complexity || 0.6,
          harmonicSignature.occurrences || 50
        );
      }
    }

    // For queries with operations, apply DPCM logic gate composition
    const composition = this.serializeLogicOperations(operations || []);
    
    // Generate composed hash using DPCM algorithm
    const composedHash = this.hasher.hash(pattern, composition);
    
    // Convert to coordinates using DPCM mapping
    return this.hasher.toCoordinates(composedHash);
  }

  /**
   * Serialize logic operations for DPCM composition
   */
  private serializeLogicOperations(operations: LogicOperation[]): string {
    // SPEC LORD FIX 2: Handle empty operations consistently for memory storage vs queries
    if (operations.length === 0) {
      return ''; // Empty string for no operations to match memory storage
    }

    return operations.map(op => {
      let serialized = `${op.type}:${op.params.join(',')}`;
      if (op.threshold !== undefined) {
        serialized += `:threshold=${op.threshold}`;
      }
      if (op.weight !== undefined) {
        serialized += `:weight=${op.weight}`;
      }
      return serialized;
    }).join('|');
  }

  /**
   * Adapt field geometry based on query parameters
   */
  private adaptFieldGeometry(params: {
    queryType: 'precision' | 'discovery' | 'creative';
    confidenceLevel: number;
    explorationDesire: number;
    timeConstraints?: number;
    context: SystemContext;
  }): {
    radius: number;
    shape: 'spherical' | 'elliptical' | 'adaptive' | 'fractal';
    falloffFunction: 'exponential' | 'polynomial' | 'gaussian' | 'sigmoid';
    amplitude: number;
    gradientSteepness: number;
  } {
    const { queryType, confidenceLevel, explorationDesire, timeConstraints, context } = params;

    // Base configuration by query type
    let config = {
      radius: 0.35,
      shape: 'spherical' as const,
      falloffFunction: 'polynomial' as const,
      amplitude: 1.0,
      gradientSteepness: 2.0
    };

    switch (queryType) {
      case 'precision':
        config = {
          radius: 0.8 + (1 - confidenceLevel) * 0.2, // Large radius to handle coordinate variance
          shape: 'spherical',
          falloffFunction: 'gaussian', // SPEC LORD FIX 4: Use Gaussian for smoother gradients
          amplitude: 1.5,
          gradientSteepness: 1.2 // Gentler gradient for better coverage
        };
        break;

      case 'discovery':
        config = {
          radius: 0.8 + explorationDesire * 0.3, // Wider for better discovery
          shape: 'elliptical',
          falloffFunction: 'gaussian', // SPEC LORD FIX 4: Use Gaussian for smoother gradients
          amplitude: 1.2,
          gradientSteepness: 1.0 // Very gentle gradient for maximum reach
        };
        break;

      case 'creative':
        config = {
          radius: 0.6 + Math.random() * 0.2, // Variable for creativity
          shape: 'fractal',
          falloffFunction: 'gaussian',
          amplitude: 0.8 + Math.random() * 0.4,
          gradientSteepness: 1.0 + Math.random() * 2.0
        };
        break;
    }

    // Adjust for confidence
    if (confidenceLevel < 0.3) {
      config.radius *= 1.5; // Expand when uncertain
      config.amplitude *= 0.8; // Lower amplitude for broader search
    } else if (confidenceLevel > 0.8) {
      config.radius *= 0.7; // Contract when confident
      config.amplitude *= 1.2; // Higher amplitude for focused search
    }

    // Adjust for time constraints
    if (timeConstraints && timeConstraints < 100) {
      config.radius *= 0.8; // Smaller radius for faster search
      config.gradientSteepness *= 1.2; // Steeper gradient
    }

    // Adjust based on recent performance
    const hitRate = context.performanceMetrics.hitRate;
    if (hitRate < 0.5) {
      config.radius *= 1.2; // Expand if not finding good matches
    } else if (hitRate > 0.9) {
      config.radius *= 0.9; // Can afford to be more focused
    }

    return config;
  }

  /**
   * Calculate morphing rate based on query and context
   */
  private calculateMorphingRate(
    query: MemoryQuery,
    context: SystemContext
  ): number {
    let rate = 0.1; // Base morphing rate

    // Faster morphing for creative queries
    if (query.type === 'creative') {
      rate *= 2.0;
    }

    // Faster morphing when exploring
    rate *= (1 + query.exploration);

    // Slower morphing when system is performing well
    const emergenceFreq = context.performanceMetrics.emergenceFrequency;
    if (emergenceFreq > 0.7) {
      rate *= 0.8;
    }

    // Adjust based on recent query diversity
    const recentTypes = new Set(context.recentQueries.map(q => q.type));
    if (recentTypes.size > 2) {
      rate *= 1.3; // More diverse queries = faster adaptation
    }

    return Math.min(rate, 1.0); // Cap at 1.0
  }

  /**
   * Calculate context sensitivity
   */
  private calculateContextSensitivity(context: SystemContext): number {
    let sensitivity = 0.5; // Base sensitivity

    // Higher sensitivity if user has consistent preferences
    if (context.userPreferences) {
      const prefConsistency = Math.abs(
        context.userPreferences.explorationTendency - 
        context.userPreferences.precisionRequirement
      );
      sensitivity *= (1 + prefConsistency);
    }

    // Lower sensitivity if performance is good
    const avgResponseTime = context.performanceMetrics.avgResponseTime;
    if (avgResponseTime < 50) {
      sensitivity *= 0.8;
    }

    // Higher sensitivity if recent queries are similar
    const recentCategories = context.recentQueries
      .map(q => q.harmonicSignature?.category)
      .filter(c => c);
    const uniqueCategories = new Set(recentCategories);
    if (uniqueCategories.size === 1 && recentCategories.length > 3) {
      sensitivity *= 1.5; // Very focused context
    }

    return Math.min(sensitivity, 1.0);
  }

  /**
   * Calculate probability at a point given field configuration
   */
  calculateProbability(
    point: [number, number, number],
    field: ProbabilityField
  ): number {
    const distance = this.calculateDistance(point, field.center);
    
    // Get shape function
    const shapeFunction = this.fieldShapes.get(field.falloffFunction);
    if (!shapeFunction) {
      throw new Error(`Unknown falloff function: ${field.falloffFunction}`);
    }

    // Calculate base probability using the falloff function
    // Let the falloff function handle distance vs radius logic
    let probability = shapeFunction(distance, field);
    
    // FIXED: Remove hard radius cutoff to allow Gaussian smooth falloff

    // Apply shape modifiers
    switch (field.shape) {
      case 'elliptical':
        // Elliptical shape - stronger along primary axis
        const [dx, dy, dz] = [
          point[0] - field.center[0],
          point[1] - field.center[1],
          point[2] - field.center[2]
        ];
        const ellipticalFactor = 1 + 0.3 * Math.abs(dx); // Elongate along X
        probability *= ellipticalFactor;
        break;

      case 'fractal':
        // Fractal shape - self-similar patterns
        const fractalNoise = this.generateFractalNoise(point, 3);
        probability *= (0.7 + 0.3 * fractalNoise);
        break;

      case 'adaptive':
        // Adaptive shape - context-driven morphing
        const contextFactor = 0.8 + 0.2 * field.contextSensitivity;
        probability *= contextFactor;
        break;
    }

    // Ensure probability is in valid range
    return Math.max(0, Math.min(1, probability));
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

  /**
   * Generate fractal noise for a point
   */
  private generateFractalNoise(
    point: [number, number, number],
    octaves: number
  ): number {
    let noise = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      noise += amplitude * this.simplexNoise(
        point[0] * frequency,
        point[1] * frequency,
        point[2] * frequency
      );
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return noise / maxValue;
  }

  /**
   * Simple 3D noise function (simplified for demonstration)
   */
  private simplexNoise(x: number, y: number, z: number): number {
    // This is a simplified noise function - in production, use a proper
    // simplex noise implementation
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  /**
   * Morph field over time
   */
  morphField(
    field: ProbabilityField,
    deltaTime: number
  ): ProbabilityField {
    const morphAmount = field.morphingRate * deltaTime;

    // Morph radius
    const radiusDelta = (Math.random() - 0.5) * 0.1 * morphAmount;
    const newRadius = Math.max(0.1, Math.min(1.0, field.radius + radiusDelta));

    // Morph center slightly
    const newCenter: [number, number, number] = [
      Math.max(0, Math.min(1, field.center[0] + (Math.random() - 0.5) * 0.05 * morphAmount)),
      Math.max(0, Math.min(1, field.center[1] + (Math.random() - 0.5) * 0.05 * morphAmount)),
      Math.max(0, Math.min(1, field.center[2] + (Math.random() - 0.5) * 0.05 * morphAmount))
    ];

    // Morph steepness
    const steepnessDelta = (Math.random() - 0.5) * 0.5 * morphAmount;
    const newSteepness = Math.max(0.5, Math.min(5.0, field.gradientSteepness + steepnessDelta));

    return {
      ...field,
      center: newCenter,
      radius: newRadius,
      gradientSteepness: newSteepness
    };
  }

  /**
   * Generate field breathing effect
   */
  applyBreathing(
    field: ProbabilityField,
    time: number,
    breathingRate: number = 0.1
  ): ProbabilityField {
    const breathingPhase = Math.sin(time * breathingRate * 2 * Math.PI);
    const breathingAmplitude = 0.1; // 10% variation

    return {
      ...field,
      radius: field.radius * (1 + breathingAmplitude * breathingPhase),
      amplitude: field.amplitude * (1 + breathingAmplitude * 0.5 * breathingPhase)
    };
  }

  /**
   * Generate field pulsing effect
   */
  applyPulsing(
    field: ProbabilityField,
    time: number,
    pulseRate: number = 0.2
  ): ProbabilityField {
    const pulsePhase = (Math.sin(time * pulseRate * 2 * Math.PI) + 1) / 2; // 0 to 1
    const pulseAmplitude = 0.3; // 30% variation

    return {
      ...field,
      amplitude: field.amplitude * (1 - pulseAmplitude + pulseAmplitude * pulsePhase),
      gradientSteepness: field.gradientSteepness * (1 + pulseAmplitude * 0.5 * pulsePhase)
    };
  }

  /**
   * Update category statistics when a new pattern is stored
   * This allows dynamic adaptation to actual stored patterns
   */
  updateCategoryStats(
    category: string,
    strength: number,
    complexity: number,
    occurrences: number
  ): void {
    const normalizedCategory = category.toUpperCase();
    const stats = this.categoryStats.get(normalizedCategory) || {
      avgStrength: 0,
      avgComplexity: 0,
      avgOccurrences: 0,
      count: 0
    };

    // Update running averages
    const newCount = stats.count + 1;
    stats.avgStrength = (stats.avgStrength * stats.count + strength) / newCount;
    stats.avgComplexity = (stats.avgComplexity * stats.count + complexity) / newCount;
    stats.avgOccurrences = (stats.avgOccurrences * stats.count + occurrences) / newCount;
    stats.count = newCount;

    this.categoryStats.set(normalizedCategory, stats);
  }

  /**
   * Get current category statistics (for debugging/monitoring)
   */
  getCategoryStats(): Map<string, any> {
    return new Map(this.categoryStats);
  }
}