/**
 * Semantic Coordinate Mapper
 * Maps patterns to 3D coordinates based on semantic meaning
 */

import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';

export interface SemanticCoordinate {
  x: number; // Category axis (0-1)
  y: number; // Complexity axis (0-1)
  z: number; // Time axis (0-1)
}

export interface CoordinateMapping {
  category: PatternCategory;
  baseX: number;
  variance: number;
}

/**
 * Maps patterns to semantic 3D space for better clustering
 */
export class SemanticCoordinateMapper {
  private logger = Logger.getInstance();
  
  // Category mappings on X-axis (semantic grouping)
  private readonly categoryMappings: Map<PatternCategory, CoordinateMapping> = new Map([
    // Security patterns cluster around 0.1-0.2
    [PatternCategory.AUTHENTICATION, { category: PatternCategory.AUTHENTICATION, baseX: 0.15, variance: 0.05 }],
    [PatternCategory.CRYPTOGRAPHIC, { category: PatternCategory.CRYPTOGRAPHIC, baseX: 0.18, variance: 0.05 }],
    
    // Data patterns cluster around 0.3-0.4
    [PatternCategory.DATA_FLOW, { category: PatternCategory.DATA_FLOW, baseX: 0.35, variance: 0.05 }],
    [PatternCategory.STATE_MANAGEMENT, { category: PatternCategory.STATE_MANAGEMENT, baseX: 0.38, variance: 0.05 }],
    
    // Structural patterns cluster around 0.5-0.6
    [PatternCategory.STRUCTURAL, { category: PatternCategory.STRUCTURAL, baseX: 0.55, variance: 0.05 }],
    [PatternCategory.BEHAVIORAL, { category: PatternCategory.BEHAVIORAL, baseX: 0.58, variance: 0.05 }],
    
    // Computational patterns cluster around 0.7-0.8
    [PatternCategory.COMPUTATIONAL, { category: PatternCategory.COMPUTATIONAL, baseX: 0.75, variance: 0.05 }],
    [PatternCategory.FUNCTIONAL, { category: PatternCategory.FUNCTIONAL, baseX: 0.78, variance: 0.05 }],
    
    // Error/Recovery patterns cluster around 0.9
    [PatternCategory.ERROR_PATTERN, { category: PatternCategory.ERROR_PATTERN, baseX: 0.92, variance: 0.05 }],
    [PatternCategory.RECOVERY, { category: PatternCategory.RECOVERY, baseX: 0.95, variance: 0.05 }]
  ]);
  
  // Fallback for unmapped categories
  private readonly defaultMapping: CoordinateMapping = {
    category: PatternCategory.HARMONIC,
    baseX: 0.5,
    variance: 0.1
  };

  /**
   * Map a pattern to semantic 3D coordinates
   */
  mapToCoordinates(pattern: HarmonicPatternMemory): [number, number, number] {
    const semantic = this.computeSemanticCoordinate(pattern);
    
    // Add slight randomness to prevent exact overlaps
    const jitter = 0.01;
    return [
      this.clamp(semantic.x + this.randomJitter(jitter)),
      this.clamp(semantic.y + this.randomJitter(jitter)),
      this.clamp(semantic.z + this.randomJitter(jitter))
    ];
  }

  /**
   * Compute semantic coordinate based on pattern properties
   */
  private computeSemanticCoordinate(pattern: HarmonicPatternMemory): SemanticCoordinate {
    const props = pattern.harmonicProperties;
    
    // X-axis: Category-based clustering
    const categoryMapping = this.categoryMappings.get(props.category) || this.defaultMapping;
    const x = categoryMapping.baseX + (this.randomJitter(categoryMapping.variance) * props.strength);
    
    // Y-axis: Complexity (normalized 0-1)
    const maxComplexity = 10; // Assumed max
    const y = Math.min(1, props.complexity / maxComplexity);
    
    // Z-axis: Time-based (newer patterns closer to 1)
    const ageHours = (Date.now() - pattern.createdAt) / (1000 * 60 * 60);
    const maxAgeHours = 30 * 24; // 30 days
    const z = Math.max(0, 1 - (ageHours / maxAgeHours));
    
    return { x, y, z };
  }

  /**
   * Get semantic distance between two patterns
   */
  getSemanticDistance(pattern1: HarmonicPatternMemory, pattern2: HarmonicPatternMemory): number {
    const coord1 = this.computeSemanticCoordinate(pattern1);
    const coord2 = this.computeSemanticCoordinate(pattern2);
    
    return Math.sqrt(
      Math.pow(coord1.x - coord2.x, 2) +
      Math.pow(coord1.y - coord2.y, 2) +
      Math.pow(coord1.z - coord2.z, 2)
    );
  }

  /**
   * Find optimal coordinates for a new pattern based on related patterns
   */
  findOptimalCoordinates(
    pattern: HarmonicPatternMemory,
    relatedPatterns: HarmonicPatternMemory[]
  ): [number, number, number] {
    if (relatedPatterns.length === 0) {
      return this.mapToCoordinates(pattern);
    }
    
    // Compute centroid of related patterns
    const centroid = this.computeCentroid(relatedPatterns);
    
    // Place new pattern near the centroid but with some offset
    const baseCoord = this.computeSemanticCoordinate(pattern);
    const weight = 0.7; // 70% based on semantic, 30% based on relationships
    
    return [
      this.clamp(baseCoord.x * weight + centroid[0] * (1 - weight)),
      this.clamp(baseCoord.y * weight + centroid[1] * (1 - weight)),
      this.clamp(baseCoord.z * weight + centroid[2] * (1 - weight))
    ];
  }

  /**
   * Get coordinate region for a category
   */
  getCategoryRegion(category: PatternCategory): {
    center: [number, number, number];
    radius: number;
  } {
    const mapping = this.categoryMappings.get(category) || this.defaultMapping;
    
    return {
      center: [mapping.baseX, 0.5, 0.5], // Center Y and Z
      radius: mapping.variance * 2
    };
  }

  /**
   * Analyze coordinate space usage
   */
  analyzeSpaceUsage(patterns: HarmonicPatternMemory[]): {
    density: Map<PatternCategory, number>;
    clusters: Array<{ center: [number, number, number]; count: number }>;
    recommendations: string[];
  } {
    const density = new Map<PatternCategory, number>();
    const gridSize = 0.1; // 10x10x10 grid
    const grid = new Map<string, number>();
    
    // Calculate density per category
    patterns.forEach(pattern => {
      const category = pattern.harmonicProperties.category;
      density.set(category, (density.get(category) || 0) + 1);
      
      // Track grid usage
      const coord = pattern.coordinates;
      const gridKey = `${Math.floor(coord[0] / gridSize)},${Math.floor(coord[1] / gridSize)},${Math.floor(coord[2] / gridSize)}`;
      grid.set(gridKey, (grid.get(gridKey) || 0) + 1);
    });
    
    // Find clusters
    const clusters = Array.from(grid.entries())
      .filter(([_, count]) => count > 5)
      .map(([key, count]) => {
        const [x, y, z] = key.split(',').map(n => parseInt(n) * gridSize + gridSize / 2);
        return { center: [x, y, z] as [number, number, number], count };
      })
      .sort((a, b) => b.count - a.count);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (clusters.length > 0 && clusters[0].count > patterns.length * 0.1) {
      recommendations.push('High density cluster detected - consider expanding coordinate variance');
    }
    
    const avgDensity = patterns.length / density.size;
    density.forEach((count, category) => {
      if (count > avgDensity * 2) {
        recommendations.push(`Category ${category} is overrepresented - review pattern generation`);
      }
    });
    
    return { density, clusters, recommendations };
  }

  // Helper methods
  
  private computeCentroid(patterns: HarmonicPatternMemory[]): [number, number, number] {
    const sum = patterns.reduce(
      (acc, p) => [
        acc[0] + p.coordinates[0],
        acc[1] + p.coordinates[1],
        acc[2] + p.coordinates[2]
      ],
      [0, 0, 0]
    );
    
    return [
      sum[0] / patterns.length,
      sum[1] / patterns.length,
      sum[2] / patterns.length
    ];
  }
  
  private randomJitter(variance: number): number {
    return (Math.random() - 0.5) * 2 * variance;
  }
  
  private clamp(value: number, min: number = 0, max: number = 1): number {
    return Math.max(min, Math.min(max, value));
  }
}