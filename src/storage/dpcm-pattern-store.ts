/**
 * DPCM Pattern Store - Layer 1 of Hybrid Storage
 * Implements deterministic parameter composition memory for harmonic patterns
 */

import { 
  HarmonicPatternMemory, 
  LogicOperation, 
  LogicGateType,
  QueryOptions,
  PatternCategory 
} from '../memory/types.js';
import { EnhancedParameterHash } from '../memory/enhanced-parameter-hash.js';

export class DPCMPatternStore {
  private memoryStore: Map<string, HarmonicPatternMemory> = new Map();
  private coordinateIndex: Map<string, string[]> = new Map(); // coord key -> pattern IDs
  private categoryIndex: Map<PatternCategory, string[]> = new Map(); // category -> pattern IDs
  private strengthIndex: Map<string, string[]> = new Map(); // strength range -> pattern IDs
  private hasher: EnhancedParameterHash;

  constructor() {
    this.hasher = new EnhancedParameterHash();
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    // Initialize category indexes
    Object.values(PatternCategory).forEach(category => {
      this.categoryIndex.set(category, []);
    });
  }

  /**
   * Store harmonic pattern with automatic coordinate generation
   */
  store(pattern: HarmonicPatternMemory): void {
    // Generate DPCM coordinates based on pattern properties
    const coordinates = this.generatePatternCoordinates(pattern);
    pattern.coordinates = coordinates;

    // Store in main memory
    this.memoryStore.set(pattern.id, pattern);

    // Index by coordinates for proximity search
    const coordKey = this.coordinateKey(coordinates);
    if (!this.coordinateIndex.has(coordKey)) {
      this.coordinateIndex.set(coordKey, []);
    }
    this.coordinateIndex.get(coordKey)!.push(pattern.id);

    // Index by category
    const categoryPatterns = this.categoryIndex.get(pattern.harmonicProperties.category) || [];
    categoryPatterns.push(pattern.id);
    this.categoryIndex.set(pattern.harmonicProperties.category, categoryPatterns);

    // Index by strength range (bucketed for efficient range queries)
    const strengthBucket = this.getStrengthBucket(pattern.harmonicProperties.strength);
    if (!this.strengthIndex.has(strengthBucket)) {
      this.strengthIndex.set(strengthBucket, []);
    }
    this.strengthIndex.get(strengthBucket)!.push(pattern.id);
  }

  /**
   * DPCM Query with boolean composition
   */
  query(
    basePattern: string,
    operations: LogicOperation[],
    options: QueryOptions = {}
  ): HarmonicPatternMemory[] {
    // Special case: '*' means get all patterns
    if (basePattern === '*' && operations.length === 0) {
      const allPatterns = Array.from(this.memoryStore.values());
      return this.applyQueryOptions(allPatterns, options);
    }
    
    // Generate target coordinates using DPCM composition
    const targetCoords = this.composeCoordinates(basePattern, operations);

    // Find patterns in coordinate neighborhood
    const candidates = this.findInRadius(targetCoords, options.radius || 1.5);

    // Apply boolean logic filtering
    const filtered = this.applyLogicFilters(candidates, operations);

    // Score and rank results
    return this.scoreAndRank(filtered, targetCoords, options);
  }

  /**
   * Bulk store multiple patterns
   */
  bulkStore(patterns: HarmonicPatternMemory[]): void {
    patterns.forEach(pattern => this.store(pattern));
  }

  /**
   * Query patterns by category
   */
  queryByCategory(category: PatternCategory, options: QueryOptions = {}): HarmonicPatternMemory[] {
    const patternIds = this.categoryIndex.get(category) || [];
    const patterns = patternIds
      .map(id => this.memoryStore.get(id))
      .filter((p): p is HarmonicPatternMemory => p !== undefined);

    return this.applyQueryOptions(patterns, options);
  }

  /**
   * Query patterns by strength range
   */
  queryByStrength(minStrength: number, maxStrength: number = 1.0, options: QueryOptions = {}): HarmonicPatternMemory[] {
    const patterns: HarmonicPatternMemory[] = [];
    
    // Get all strength buckets in range
    const minBucket = this.getStrengthBucket(minStrength);
    const maxBucket = this.getStrengthBucket(maxStrength);
    
    for (const [bucket, patternIds] of this.strengthIndex) {
      if (bucket >= minBucket && bucket <= maxBucket) {
        patternIds.forEach(id => {
          const pattern = this.memoryStore.get(id);
          if (pattern && 
              pattern.harmonicProperties.strength >= minStrength && 
              pattern.harmonicProperties.strength <= maxStrength) {
            patterns.push(pattern);
          }
        });
      }
    }

    return this.applyQueryOptions(patterns, options);
  }

  /**
   * Find similar patterns using coordinate proximity
   */
  findSimilar(patternId: string, options: QueryOptions = {}): HarmonicPatternMemory[] {
    const basePattern = this.memoryStore.get(patternId);
    if (!basePattern) return [];

    const candidates = this.findInRadius(basePattern.coordinates, options.radius || 1.5);
    return candidates
      .filter(p => p.id !== patternId) // Exclude self
      .slice(0, options.maxResults || 10);
  }

  /**
   * Get all patterns (for debugging/analytics)
   */
  getAllPatterns(): HarmonicPatternMemory[] {
    return Array.from(this.memoryStore.values());
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): HarmonicPatternMemory | undefined {
    return this.memoryStore.get(id);
  }


  /**
   * Remove pattern from store
   */
  remove(id: string): boolean {
    const pattern = this.memoryStore.get(id);
    if (!pattern) return false;

    // Remove from main store
    this.memoryStore.delete(id);

    // Remove from coordinate index
    const coordKey = this.coordinateKey(pattern.coordinates);
    const coordPatterns = this.coordinateIndex.get(coordKey) || [];
    const coordIndex = coordPatterns.indexOf(id);
    if (coordIndex > -1) {
      coordPatterns.splice(coordIndex, 1);
    }

    // Remove from category index
    const categoryPatterns = this.categoryIndex.get(pattern.harmonicProperties.category) || [];
    const categoryIndex = categoryPatterns.indexOf(id);
    if (categoryIndex > -1) {
      categoryPatterns.splice(categoryIndex, 1);
    }

    // Remove from strength index
    const strengthBucket = this.getStrengthBucket(pattern.harmonicProperties.strength);
    const strengthPatterns = this.strengthIndex.get(strengthBucket) || [];
    const strengthIndex = strengthPatterns.indexOf(id);
    if (strengthIndex > -1) {
      strengthPatterns.splice(strengthIndex, 1);
    }

    return true;
  }

  /**
   * Clear all patterns
   */
  clear(): void {
    this.memoryStore.clear();
    this.coordinateIndex.clear();
    this.categoryIndex.clear();
    this.strengthIndex.clear();
    this.initializeIndexes();
  }

  /**
   * Get pattern count
   */
  getPatternCount(): number {
    return this.memoryStore.size;
  }

  /**
   * Get store statistics
   */
  getStats(): {
    totalPatterns: number;
    categoryCounts: Record<string, number>;
    averageStrength: number;
    coordinateSpread: { min: [number, number, number]; max: [number, number, number] };
    totalEntries?: number;
    uniquePatterns?: number;
    totalOperations?: number;
  } {
    const patterns = this.getAllPatterns();
    const categoryCounts: Record<string, number> = {};
    let totalStrength = 0;
    let minCoords: [number, number, number] = [1, 1, 1];
    let maxCoords: [number, number, number] = [-1, -1, -1];

    patterns.forEach(pattern => {
      // Category counts
      const category = pattern.harmonicProperties.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Strength average
      totalStrength += pattern.harmonicProperties.strength;

      // Coordinate bounds
      const [x, y, z] = pattern.coordinates;
      minCoords[0] = Math.min(minCoords[0], x);
      minCoords[1] = Math.min(minCoords[1], y);
      minCoords[2] = Math.min(minCoords[2], z);
      maxCoords[0] = Math.max(maxCoords[0], x);
      maxCoords[1] = Math.max(maxCoords[1], y);
      maxCoords[2] = Math.max(maxCoords[2], z);
    });

    return {
      totalPatterns: patterns.length,
      categoryCounts,
      averageStrength: patterns.length > 0 ? totalStrength / patterns.length : 0,
      coordinateSpread: { min: minCoords, max: maxCoords },
      totalEntries: this.memoryStore.size,
      uniquePatterns: this.memoryStore.size,
      totalOperations: 0 // Not currently tracked
    };
  }

  // Private methods

  /**
   * Generate coordinates from pattern properties
   */
  private generatePatternCoordinates(pattern: HarmonicPatternMemory): [number, number, number] {
    // SPEC LORD FIX 1: Normalize category to uppercase for coordinate consistency
    const category = pattern.harmonicProperties.category || 'GENERAL';
    const normalizedCategory = category.toUpperCase();
    
    return this.hasher.generateSemanticCoordinates(
      normalizedCategory,
      pattern.harmonicProperties.strength,
      pattern.harmonicProperties.complexity,
      pattern.harmonicProperties.occurrences
    );
  }

  /**
   * Create coordinate key for indexing (bucketed for efficiency)
   */
  private coordinateKey(coordinates: [number, number, number], bucketSize: number = 0.1): string {
    const [x, y, z] = coordinates;
    const bucketX = Math.floor(x / bucketSize) * bucketSize;
    const bucketY = Math.floor(y / bucketSize) * bucketSize;
    const bucketZ = Math.floor(z / bucketSize) * bucketSize;
    return `${bucketX.toFixed(1)},${bucketY.toFixed(1)},${bucketZ.toFixed(1)}`;
  }

  /**
   * Get strength bucket for indexing
   */
  private getStrengthBucket(strength: number, bucketSize: number = 0.1): string {
    const bucket = Math.floor(strength / bucketSize) * bucketSize;
    return bucket.toFixed(1);
  }

  /**
   * Compose target coordinates from base pattern and operations
   */
  private composeCoordinates(basePattern: string, operations: LogicOperation[]): [number, number, number] {
    // SPEC LORD FIX 1: Normalize to uppercase for coordinate consistency
    const normalizedPattern = basePattern.toUpperCase();
    
    // SPEC LORD FIX 2: Handle empty operations consistently
    let operationsPart = '';
    if (operations.length > 0) {
      operationsPart = `_${operations.map(op => `${op.type}_${op.params.join(',')}`).join('_')}`;
    }
    
    // For now, use simple hash-based composition
    // This can be enhanced with more sophisticated DPCM logic
    const compositionString = `${normalizedPattern}${operationsPart}`;
    const hash = this.hasher.hash('composed', compositionString);
    return this.hasher.toCoordinates(hash);
  }

  /**
   * Find patterns within radius of coordinates
   */
  private findInRadius(center: [number, number, number], radius: number): HarmonicPatternMemory[] {
    const candidates: HarmonicPatternMemory[] = [];
    
    // Get coordinate range for efficient searching
    const range = this.hasher.getCoordinateRange(center, radius);
    
    // Check bucketed coordinates in range
    for (const [coordKey, patternIds] of this.coordinateIndex) {
      const [x, y, z] = coordKey.split(',').map(Number);
      
      if (x >= range.minX && x <= range.maxX &&
          y >= range.minY && y <= range.maxY &&
          z >= range.minZ && z <= range.maxZ) {
        
        patternIds.forEach(id => {
          const pattern = this.memoryStore.get(id);
          if (pattern && this.hasher.isWithinRadius(center, pattern.coordinates, radius)) {
            candidates.push(pattern);
          }
        });
      }
    }
    
    return candidates;
  }

  /**
   * Apply boolean logic filters to candidates
   */
  private applyLogicFilters(candidates: HarmonicPatternMemory[], operations: LogicOperation[]): HarmonicPatternMemory[] {
    let filtered = [...candidates];

    operations.forEach(operation => {
      switch (operation.type) {
        case LogicGateType.AND:
          // Keep patterns that match ALL specified categories/types
          filtered = filtered.filter(pattern => 
            operation.params.every(param => 
              pattern.harmonicProperties.category === param ||
              pattern.content.type === param ||
              pattern.content.tags.includes(param)
            )
          );
          break;

        case LogicGateType.OR:
          // Keep patterns that match ANY specified categories/types
          filtered = filtered.filter(pattern =>
            operation.params.some(param =>
              pattern.harmonicProperties.category === param ||
              pattern.content.type === param ||
              pattern.content.tags.includes(param)
            )
          );
          break;

        case LogicGateType.NOT:
          // Exclude patterns that match specified categories/types
          filtered = filtered.filter(pattern =>
            !operation.params.some(param =>
              pattern.harmonicProperties.category === param ||
              pattern.content.type === param ||
              pattern.content.tags.includes(param)
            )
          );
          break;

        case LogicGateType.THRESHOLD:
          // Filter by threshold values
          if (operation.threshold !== undefined) {
            filtered = filtered.filter(pattern => {
              if (operation.params.includes('strength')) {
                return pattern.harmonicProperties.strength >= operation.threshold!;
              }
              if (operation.params.includes('complexity')) {
                return pattern.harmonicProperties.complexity >= operation.threshold!;
              }
              if (operation.params.includes('confidence')) {
                return pattern.harmonicProperties.confidence >= operation.threshold!;
              }
              return true;
            });
          }
          break;

        case LogicGateType.BOOST:
          // Boost scores for patterns with specified properties
          if (operation.weight) {
            filtered.forEach(pattern => {
              if (operation.params.some(param =>
                pattern.harmonicProperties.category === param ||
                pattern.content.type === param ||
                pattern.content.tags.includes(param)
              )) {
                pattern.relevanceScore *= operation.weight!;
              }
            });
          }
          break;

        case LogicGateType.XOR:
          // Keep patterns that match EXACTLY ONE of the specified parameters
          filtered = filtered.filter(pattern => {
            const matches = operation.params.filter(param =>
              pattern.harmonicProperties.category === param ||
              pattern.content.type === param ||
              pattern.content.tags.includes(param)
            );
            return matches.length === 1;
          });
          break;

        case LogicGateType.PATTERN:
          // Pattern-specific filtering - matches specific harmonic patterns
          filtered = filtered.filter(pattern => {
            // Check if pattern matches any of the specified harmonic patterns
            return operation.params.some(param => {
              // Match by pattern category prefix (e.g., 'fractal', 'wave', 'harmonic')
              const categoryMatch = pattern.harmonicProperties.category.toLowerCase().includes(param.toLowerCase());
              // Match by pattern evidence types if available
              const evidenceMatch = pattern.evidence?.some(e => 
                e.type.toLowerCase().includes(param.toLowerCase())
              );
              return categoryMatch || evidenceMatch;
            });
          });
          break;

        case LogicGateType.ARCHITECTURAL:
          // Architecture-specific filtering - for code structure patterns
          filtered = filtered.filter(pattern => {
            return operation.params.some(param => {
              // Check architectural patterns in locations
              const locationMatch = pattern.locations?.some(loc => {
                const architectural = param.toLowerCase();
                return (architectural === 'class' && loc.className) ||
                       (architectural === 'function' && loc.functionName) ||
                       (architectural === 'module' && loc.file.includes('.')) ||
                       (architectural === 'interface' && pattern.content.type === 'interface');
              });
              
              // Check architectural tags
              const tagMatch = pattern.content.tags.some(tag => 
                tag.toLowerCase().includes(param.toLowerCase())
              );
              
              return locationMatch || tagMatch;
            });
          });
          break;
      }
    });

    return filtered;
  }

  /**
   * Score and rank results by relevance
   */
  private scoreAndRank(
    patterns: HarmonicPatternMemory[], 
    targetCoords: [number, number, number],
    options: QueryOptions
  ): HarmonicPatternMemory[] {
    
    // Calculate distance-based scores
    const scoredPatterns = patterns.map(pattern => {
      const distance = this.hasher.distance(targetCoords, pattern.coordinates);
      const proximityScore = Math.max(0, 1 - distance / 2); // Normalize distance to [0,1]
      
      // Combine proximity with pattern quality
      const qualityScore = (
        pattern.harmonicProperties.strength * 0.4 +
        pattern.harmonicProperties.confidence * 0.3 +
        pattern.harmonicProperties.complexity * 0.2 +
        pattern.relevanceScore * 0.1
      );
      
      const totalScore = proximityScore * 0.6 + qualityScore * 0.4;
      
      return {
        pattern,
        score: totalScore,
        distance
      };
    });

    // Filter by quality threshold
    const qualityThreshold = options.qualityThreshold || 0.0;
    const qualifiedPatterns = scoredPatterns.filter(item => item.score >= qualityThreshold);

    // Sort by score and apply limits
    qualifiedPatterns.sort((a, b) => b.score - a.score);
    
    const maxResults = options.maxResults || 50;
    return qualifiedPatterns
      .slice(0, maxResults)
      .map(item => item.pattern);
  }

  /**
   * Apply query options to pattern list
   */
  private applyQueryOptions(patterns: HarmonicPatternMemory[], options: QueryOptions): HarmonicPatternMemory[] {
    let filtered = [...patterns];

    // Apply quality threshold
    if (options.qualityThreshold) {
      filtered = filtered.filter(pattern => 
        pattern.harmonicProperties.strength >= options.qualityThreshold! ||
        pattern.harmonicProperties.confidence >= options.qualityThreshold!
      );
    }

    // Sort by relevance score
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply result limit
    if (options.maxResults) {
      filtered = filtered.slice(0, options.maxResults);
    }

    return filtered;
  }
}