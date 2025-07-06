/**
 * Enhanced Parameter Hash for DPCM coordinates
 * Generates deterministic 3D coordinates from pattern properties
 */

import { createHash } from 'crypto';
import { DPCMHash } from './types.js';

export class EnhancedParameterHash implements DPCMHash {
  
  /**
   * Generate deterministic hash from category and composition string
   */
  hash(category: string, composition: string): string {
    const combined = `${category}:${composition}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Convert hash to deterministic 3D coordinates in range [-1, 1]
   */
  toCoordinates(hash: string): [number, number, number] {
    // Take first 24 characters (8 chars per coordinate)
    const xHex = hash.slice(0, 8);
    const yHex = hash.slice(8, 16);
    const zHex = hash.slice(16, 24);

    // Convert to integers
    const xInt = parseInt(xHex, 16);
    const yInt = parseInt(yHex, 16);
    const zInt = parseInt(zHex, 16);

    // Normalize to [-1, 1] range
    const maxInt = 0xFFFFFFFF; // 2^32 - 1
    const x = (xInt / maxInt) * 2 - 1;
    const y = (yInt / maxInt) * 2 - 1;
    const z = (zInt / maxInt) * 2 - 1;

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
      minX: Math.max(-1, x - radius),
      maxX: Math.min(1, x + radius),
      minY: Math.max(-1, y - radius),
      maxY: Math.min(1, y + radius),
      minZ: Math.max(-1, z - radius),
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
    // Create semantic composition that captures pattern essence
    const semanticComposition = [
      `strength:${strength.toFixed(3)}`,
      `complexity:${complexity.toFixed(3)}`,
      `occurrences:${Math.min(occurrences, 1000)}`, // Cap to prevent coordinate drift
      `category:${category}`
    ].join('|');
    
    const hash = this.hash(category, semanticComposition);
    return this.toCoordinates(hash);
  }
}