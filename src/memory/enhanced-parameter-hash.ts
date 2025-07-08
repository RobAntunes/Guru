/**
 * Enhanced Parameter Hash for DPCM coordinates
 * Generates deterministic 3D coordinates from pattern properties
 */

import { blake3 } from '@noble/hashes/blake3';
import { DPCMHash } from './types.js';

export class EnhancedParameterHash implements DPCMHash {
  
  /**
   * Generate deterministic hash from category and composition string
   */
  hash(category: string, composition: string): string {
    // SPEC LORD FIX 1: Normalize category to uppercase for coordinate consistency
    const normalizedCategory = category.toUpperCase();
    const combined = `${normalizedCategory}:${composition}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashArray = blake3(data);
    return Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hash to deterministic 3D coordinates in range [0, 1]
   */
  toCoordinates(hash: string): [number, number, number] {
    // Ensure hash is long enough
    if (hash.length < 24) {
      console.warn(`Hash too short: ${hash.length} chars, padding with zeros`);
      hash = hash.padEnd(24, '0');
    }
    
    // Take first 24 characters (8 chars per coordinate)
    const xHex = hash.slice(0, 8);
    const yHex = hash.slice(8, 16);
    const zHex = hash.slice(16, 24);

    // Convert to integers
    const xInt = parseInt(xHex, 16);
    const yInt = parseInt(yHex, 16);
    const zInt = parseInt(zHex, 16);
    
    // Check for NaN
    if (isNaN(xInt) || isNaN(yInt) || isNaN(zInt)) {
      console.error(`Invalid hex conversion: x=${xHex}, y=${yHex}, z=${zHex}`);
      return [0, 0, 0];
    }

    // Normalize to [0, 1] range
    const maxInt = 0xFFFFFFFF; // 2^32 - 1
    const x = xInt / maxInt;
    const y = yInt / maxInt;
    const z = zInt / maxInt;

    return [x, y, z];
  }

  /**
   * Calculate Euclidean distance between two coordinates
   */
  distance(coord1: [number, number, number], coord2: [number, number, number]): number {
    const [x1, y1, z1] = coord1;
    const [x2, y2, z2] = coord2;
    
    return Math.sqrt(
      Math.pow(x2 - x1, 2) + 
      Math.pow(y2 - y1, 2) + 
      Math.pow(z2 - z1, 2)
    );
  }

  /**
   * Generate coordinate range for proximity search
   */
  getCoordinateRange(center: [number, number, number], radius: number): {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  } {
    const [x, y, z] = center;
    
    return {
      minX: Math.max(0, x - radius),
      maxX: Math.min(1, x + radius),
      minY: Math.max(0, y - radius),
      maxY: Math.min(1, y + radius),
      minZ: Math.max(0, z - radius),
      maxZ: Math.min(1, z + radius)
    };
  }

  /**
   * Check if coordinate is within radius of center
   */
  isWithinRadius(center: [number, number, number], point: [number, number, number], radius: number): boolean {
    return this.distance(center, point) <= radius;
  }

  /**
   * Generate multiple coordinates for pattern variations
   */
  generateVariations(baseHash: string, count: number = 5): [number, number, number][] {
    const variations: [number, number, number][] = [];
    
    for (let i = 0; i < count; i++) {
      const variationHash = this.hash(baseHash, i.toString());
      variations.push(this.toCoordinates(variationHash));
    }
    
    return variations;
  }

  /**
   * Find closest coordinate from a set
   */
  findClosest(target: [number, number, number], candidates: [number, number, number][]): {
    coordinate: [number, number, number];
    distance: number;
    index: number;
  } | null {
    if (candidates.length === 0) return null;
    
    let minDistance = Infinity;
    let closestIndex = 0;
    let closestCoordinate = candidates[0];
    
    candidates.forEach((candidate, index) => {
      const distance = this.distance(target, candidate);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
        closestCoordinate = candidate;
      }
    });
    
    return {
      coordinate: closestCoordinate,
      distance: minDistance,
      index: closestIndex
    };
  }

  /**
   * Calculate coordinate centroid for clustering
   */
  calculateCentroid(coordinates: [number, number, number][]): [number, number, number] {
    if (coordinates.length === 0) return [0, 0, 0];
    
    const sum = coordinates.reduce(
      (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1], acc[2] + coord[2]],
      [0, 0, 0]
    );
    
    const count = coordinates.length;
    return [sum[0] / count, sum[1] / count, sum[2] / count];
  }

  /**
   * Generate deterministic coordinates based on pattern semantic properties
   */
  generateSemanticCoordinates(
    category: string,
    strength: number,
    complexity: number,
    occurrences: number
  ): [number, number, number] {
    // SPEC LORD FIX 1: Normalize category to uppercase for coordinate consistency
    const normalizedCategory = category.toUpperCase();
    
    // Get semantic neighborhood base coordinates
    const baseCoords = this.getSemanticNeighborhood(normalizedCategory);
    
    // Apply quality-based micro-positioning within neighborhood
    const qualityOffset = this.calculateQualityOffset(strength, complexity, occurrences);
    
    // Calculate final coordinates with NaN protection
    const coords: [number, number, number] = [
      Math.max(0, Math.min(1, baseCoords[0] + qualityOffset[0])),
      Math.max(0, Math.min(1, baseCoords[1] + qualityOffset[1])),
      Math.max(0, Math.min(1, baseCoords[2] + qualityOffset[2]))
    ];
    
    // Final NaN check - should never happen with the fixes above, but just in case
    if (coords.some(c => isNaN(c))) {
      console.error('NaN detected in coordinates!', { category, strength, complexity, occurrences, baseCoords, qualityOffset });
      return baseCoords; // Fallback to base coordinates
    }
    
    return coords;
  }

  /**
   * Get base coordinates for semantic neighborhoods
   */
  private getSemanticNeighborhood(category: string): [number, number, number] {
    // Define semantic neighborhoods based on conceptual similarity
    const neighborhoods: Record<string, [number, number, number]> = {
      // Security domain cluster (0.3-0.4 range)
      'AUTHENTICATION': [0.35, 0.35, 0.35],
      'AUTHORIZATION': [0.37, 0.33, 0.37],
      'SECURITY': [0.33, 0.37, 0.33],
      'CRYPTOGRAPHIC': [0.36, 0.36, 0.39],
      
      // Mathematical patterns cluster (0.6-0.7 range)
      'HARMONIC': [0.65, 0.65, 0.65],
      'FRACTAL': [0.62, 0.68, 0.63],
      'GEOMETRIC': [0.68, 0.62, 0.67],
      'WAVE': [0.63, 0.67, 0.62],
      
      // Computational patterns cluster (0.5 range)
      'COMPUTATIONAL': [0.50, 0.50, 0.50],
      'FUNCTIONAL': [0.52, 0.48, 0.52],
      'STRUCTURAL': [0.48, 0.52, 0.48],
      
      // State management cluster (0.4-0.5 range)
      'STATE_MANAGEMENT': [0.45, 0.45, 0.45],
      'BEHAVIORAL': [0.43, 0.47, 0.43],
      'RECOVERY': [0.47, 0.43, 0.47],
      
      // Quantum cluster (0.7-0.8 range)
      'QUANTUM': [0.75, 0.75, 0.75],
      
      // General/Unknown patterns (0.2 range)
      'GENERAL': [0.25, 0.25, 0.25]
    };
    
    // Return neighborhood center or calculate based on string similarity
    return neighborhoods[category] || this.inferNeighborhoodFromSimilarity(category, neighborhoods);
  }

  /**
   * Infer neighborhood for unknown categories based on string similarity
   */
  private inferNeighborhoodFromSimilarity(
    category: string, 
    knownNeighborhoods: Record<string, [number, number, number]>
  ): [number, number, number] {
    // Find most similar known category
    let bestMatch = 'GENERAL';
    let bestSimilarity = 0;
    
    for (const [known, coords] of Object.entries(knownNeighborhoods)) {
      const similarity = this.stringSimilarity(category, known);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = known;
      }
    }
    
    // Return slightly offset from best match to avoid collisions
    const base = knownNeighborhoods[bestMatch];
    const offset = 0.02;
    return [
      base[0] + (Math.random() - 0.5) * offset,
      base[1] + (Math.random() - 0.5) * offset,
      base[2] + (Math.random() - 0.5) * offset
    ];
  }

  /**
   * Simple string similarity measure
   */
  private stringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance for string similarity
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s2.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s1.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s1.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
   * Calculate quality-based offset within neighborhood
   */
  private calculateQualityOffset(
    strength: number,
    complexity: number,
    occurrences: number
  ): [number, number, number] {
    // Quality affects position within neighborhood (max ±0.05)
    const spread = 0.05;
    
    // Ensure valid values (no NaN or undefined)
    const safeStrength = isNaN(strength) || strength === undefined ? 0.5 : strength;
    const safeComplexity = isNaN(complexity) || complexity === undefined ? 0.5 : complexity;
    const safeOccurrences = isNaN(occurrences) || occurrences === undefined ? 1 : Math.max(1, occurrences);
    
    // Higher quality → toward neighborhood center
    const qualityScore = (safeStrength + safeComplexity) / 2;
    const centerPull = (qualityScore - 0.5) * spread;
    
    // Safe calculation to prevent NaN
    const zOffset = Math.tanh(Math.log10(safeOccurrences) / 3) * spread * 0.4;
    
    return [
      centerPull * 0.8,                                        // Strength affects X
      (safeComplexity - 0.5) * spread * 0.6,                  // Complexity affects Y  
      isNaN(zOffset) ? 0 : zOffset                            // Occurrences affect Z (with NaN check)
    ];
  }
}