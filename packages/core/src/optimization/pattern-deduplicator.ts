/**
 * Pattern Deduplicator
 * Identifies and merges nearly identical patterns to save storage and improve efficiency
 */

import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';
import * as crypto from 'crypto';

export interface DuplicationCandidate {
  pattern1: HarmonicPatternMemory;
  pattern2: HarmonicPatternMemory;
  similarity: number;
  reason: string;
}

export interface DeduplicationResult {
  merged: number;
  spaceSaved: number;
  candidatesFound: number;
  processingTime: number;
}

export interface PatternSignature {
  structural: string;
  semantic: string;
  location: string;
  combined: string;
}

export interface DeduplicationConfig {
  enabled: boolean;
  minSimilarity: number; // 0.0 - 1.0
  strategies: {
    structural: boolean;  // Same code structure
    semantic: boolean;    // Same meaning/purpose
    location: boolean;    // Same file/location
  };
  autoMerge: boolean;
  batchSize: number;
}

/**
 * Identifies and merges duplicate patterns
 */
export class PatternDeduplicator {
  private logger = Logger.getInstance();
  private signatureCache: Map<string, PatternSignature> = new Map();
  private mergeHistory: Map<string, string> = new Map(); // old ID -> new ID
  
  private readonly defaultConfig: DeduplicationConfig = {
    enabled: true,
    minSimilarity: 0.95, // 95% similarity threshold
    strategies: {
      structural: true,
      semantic: true,
      location: true
    },
    autoMerge: false, // Manual review by default
    batchSize: 100
  };

  constructor(private config: DeduplicationConfig = {} as DeduplicationConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Find duplicate patterns in a collection
   */
  findDuplicates(patterns: HarmonicPatternMemory[]): DuplicationCandidate[] {
    const candidates: DuplicationCandidate[] = [];
    const startTime = Date.now();
    
    this.logger.info(`Analyzing ${patterns.length} patterns for duplicates...`);
    
    // Build signature index
    const signatureMap = new Map<string, HarmonicPatternMemory[]>();
    
    for (const pattern of patterns) {
      const signature = this.generateSignature(pattern);
      this.signatureCache.set(pattern.id, signature);
      
      // Group by signature components
      if (this.config.strategies.structural) {
        const key = `struct:${signature.structural}`;
        if (!signatureMap.has(key)) signatureMap.set(key, []);
        signatureMap.get(key)!.push(pattern);
      }
      
      if (this.config.strategies.semantic) {
        const key = `sem:${signature.semantic}`;
        if (!signatureMap.has(key)) signatureMap.set(key, []);
        signatureMap.get(key)!.push(pattern);
      }
      
      if (this.config.strategies.location) {
        const key = `loc:${signature.location}`;
        if (!signatureMap.has(key)) signatureMap.set(key, []);
        signatureMap.get(key)!.push(pattern);
      }
    }
    
    // Find candidates within each signature group
    for (const [key, group] of signatureMap) {
      if (group.length < 2) continue;
      
      // Compare all pairs in the group
      for (let i = 0; i < group.length - 1; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const similarity = this.calculateSimilarity(group[i], group[j]);
          
          if (similarity >= this.config.minSimilarity) {
            candidates.push({
              pattern1: group[i],
              pattern2: group[j],
              similarity,
              reason: this.getSimilarityReason(group[i], group[j], similarity)
            });
          }
        }
      }
    }
    
    // Sort by similarity (highest first)
    candidates.sort((a, b) => b.similarity - a.similarity);
    
    const duration = Date.now() - startTime;
    this.logger.info(
      `Found ${candidates.length} duplicate candidates in ${duration}ms`
    );
    
    return candidates;
  }

  /**
   * Merge duplicate patterns
   */
  merge(
    pattern1: HarmonicPatternMemory,
    pattern2: HarmonicPatternMemory
  ): HarmonicPatternMemory {
    // Determine which pattern to keep (higher quality)
    const quality1 = this.calculateQuality(pattern1);
    const quality2 = this.calculateQuality(pattern2);
    
    const [keep, merge] = quality1 >= quality2 
      ? [pattern1, pattern2] 
      : [pattern2, pattern1];
    
    // Merge properties
    const merged: HarmonicPatternMemory = {
      ...keep,
      // Combine access counts
      accessCount: keep.accessCount + merge.accessCount,
      // Keep most recent access
      lastAccessed: Math.max(keep.lastAccessed, merge.lastAccessed),
      // Combine occurrences
      harmonicProperties: {
        ...keep.harmonicProperties,
        occurrences: keep.harmonicProperties.occurrences + merge.harmonicProperties.occurrences,
        // Average confidence
        confidence: (keep.harmonicProperties.confidence + merge.harmonicProperties.confidence) / 2,
        // Max strength
        strength: Math.max(keep.harmonicProperties.strength, merge.harmonicProperties.strength)
      },
      // Combine locations
      locations: this.mergeLocations(keep.locations, merge.locations),
      // Combine evidence
      evidence: [...new Set([...keep.evidence, ...merge.evidence])],
      // Combine related patterns
      relatedPatterns: [...new Set([...keep.relatedPatterns, ...merge.relatedPatterns])],
      // Update relevance score
      relevanceScore: Math.max(keep.relevanceScore, merge.relevanceScore)
    };
    
    // Record merge in history
    this.mergeHistory.set(merge.id, keep.id);
    
    this.logger.debug(
      `Merged pattern ${merge.id} into ${keep.id} (similarity: ${quality2.toFixed(2)})`
    );
    
    return merged;
  }

  /**
   * Bulk deduplicate patterns
   */
  async deduplicate(
    patterns: HarmonicPatternMemory[],
    onMerge?: (merged: HarmonicPatternMemory, removed: string) => Promise<void>
  ): Promise<DeduplicationResult> {
    const startTime = Date.now();
    const result: DeduplicationResult = {
      merged: 0,
      spaceSaved: 0,
      candidatesFound: 0,
      processingTime: 0
    };
    
    if (!this.config.enabled) {
      return result;
    }
    
    // Process in batches
    for (let i = 0; i < patterns.length; i += this.config.batchSize) {
      const batch = patterns.slice(i, i + this.config.batchSize);
      const candidates = this.findDuplicates(batch);
      result.candidatesFound += candidates.length;
      
      // Process candidates
      const processed = new Set<string>();
      
      for (const candidate of candidates) {
        // Skip if already processed
        if (processed.has(candidate.pattern1.id) || processed.has(candidate.pattern2.id)) {
          continue;
        }
        
        if (this.config.autoMerge || candidate.similarity >= 0.99) {
          // Merge patterns
          const merged = this.merge(candidate.pattern1, candidate.pattern2);
          const removedId = merged.id === candidate.pattern1.id 
            ? candidate.pattern2.id 
            : candidate.pattern1.id;
          
          // Calculate space saved (approximate)
          result.spaceSaved += this.estimatePatternSize(
            removedId === candidate.pattern1.id ? candidate.pattern1 : candidate.pattern2
          );
          
          // Callback for external storage update
          if (onMerge) {
            await onMerge(merged, removedId);
          }
          
          processed.add(candidate.pattern1.id);
          processed.add(candidate.pattern2.id);
          result.merged++;
        }
      }
    }
    
    result.processingTime = Date.now() - startTime;
    
    this.logger.info(
      `Deduplication complete: ${result.merged} patterns merged, ` +
      `${(result.spaceSaved / 1024).toFixed(1)}KB saved in ${result.processingTime}ms`
    );
    
    return result;
  }

  /**
   * Generate signature for a pattern
   */
  private generateSignature(pattern: HarmonicPatternMemory): PatternSignature {
    // Structural signature (based on pattern type and properties)
    const structural = crypto.createHash('md5')
      .update(pattern.content.type)
      .update(pattern.harmonicProperties.category)
      .update(pattern.harmonicProperties.complexity.toString())
      .digest('hex')
      .substring(0, 8);
    
    // Semantic signature (based on content)
    const semantic = crypto.createHash('md5')
      .update(pattern.content.title.toLowerCase())
      .update(pattern.content.description.toLowerCase())
      .update(pattern.content.tags.sort().join(','))
      .digest('hex')
      .substring(0, 8);
    
    // Location signature (based on file paths)
    const locationStr = pattern.locations
      .map(loc => `${loc.file}:${loc.startLine}-${loc.endLine}`)
      .sort()
      .join('|');
    const location = crypto.createHash('md5')
      .update(locationStr)
      .digest('hex')
      .substring(0, 8);
    
    // Combined signature
    const combined = crypto.createHash('md5')
      .update(structural + semantic + location)
      .digest('hex')
      .substring(0, 16);
    
    return { structural, semantic, location, combined };
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculateSimilarity(
    pattern1: HarmonicPatternMemory,
    pattern2: HarmonicPatternMemory
  ): number {
    const sig1 = this.signatureCache.get(pattern1.id) || this.generateSignature(pattern1);
    const sig2 = this.signatureCache.get(pattern2.id) || this.generateSignature(pattern2);
    
    let score = 0;
    let weight = 0;
    
    // Structural similarity
    if (this.config.strategies.structural) {
      const structSim = sig1.structural === sig2.structural ? 1.0 : 0.0;
      score += structSim * 0.3;
      weight += 0.3;
    }
    
    // Semantic similarity
    if (this.config.strategies.semantic) {
      const semSim = this.stringSimilarity(
        pattern1.content.title + ' ' + pattern1.content.description,
        pattern2.content.title + ' ' + pattern2.content.description
      );
      score += semSim * 0.4;
      weight += 0.4;
    }
    
    // Location similarity
    if (this.config.strategies.location) {
      const locSim = this.locationSimilarity(pattern1.locations, pattern2.locations);
      score += locSim * 0.3;
      weight += 0.3;
    }
    
    // Property similarity
    const propSim = this.propertySimilarity(
      pattern1.harmonicProperties,
      pattern2.harmonicProperties
    );
    score += propSim * 0.2;
    weight += 0.2;
    
    return weight > 0 ? score / weight : 0;
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance implementation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate location similarity
   */
  private locationSimilarity(
    locs1: HarmonicPatternMemory['locations'],
    locs2: HarmonicPatternMemory['locations']
  ): number {
    if (locs1.length === 0 || locs2.length === 0) return 0;
    
    let matches = 0;
    
    for (const loc1 of locs1) {
      for (const loc2 of locs2) {
        if (loc1.file === loc2.file) {
          // Check line overlap
          const overlap = Math.max(0,
            Math.min(loc1.endLine, loc2.endLine) - 
            Math.max(loc1.startLine, loc2.startLine)
          );
          
          if (overlap > 0) {
            matches++;
          }
        }
      }
    }
    
    return matches / Math.max(locs1.length, locs2.length);
  }

  /**
   * Calculate property similarity
   */
  private propertySimilarity(
    props1: HarmonicPatternMemory['harmonicProperties'],
    props2: HarmonicPatternMemory['harmonicProperties']
  ): number {
    if (props1.category !== props2.category) return 0;
    
    const strengthDiff = Math.abs(props1.strength - props2.strength);
    const confidenceDiff = Math.abs(props1.confidence - props2.confidence);
    const complexityDiff = Math.abs(props1.complexity - props2.complexity) / 10;
    
    return 1 - (strengthDiff + confidenceDiff + complexityDiff) / 3;
  }

  /**
   * Calculate pattern quality score
   */
  private calculateQuality(pattern: HarmonicPatternMemory): number {
    return (
      pattern.harmonicProperties.strength * 0.3 +
      pattern.harmonicProperties.confidence * 0.2 +
      (pattern.accessCount / 100) * 0.2 +
      (pattern.harmonicProperties.occurrences / 50) * 0.2 +
      pattern.relevanceScore * 0.1
    );
  }

  /**
   * Get reason for similarity
   */
  private getSimilarityReason(
    pattern1: HarmonicPatternMemory,
    pattern2: HarmonicPatternMemory,
    similarity: number
  ): string {
    const reasons: string[] = [];
    
    const sig1 = this.signatureCache.get(pattern1.id)!;
    const sig2 = this.signatureCache.get(pattern2.id)!;
    
    if (sig1.structural === sig2.structural) {
      reasons.push('identical structure');
    }
    
    if (sig1.semantic === sig2.semantic) {
      reasons.push('same semantic meaning');
    }
    
    if (sig1.location === sig2.location) {
      reasons.push('same location');
    }
    
    if (similarity >= 0.99) {
      reasons.push('nearly identical');
    } else if (similarity >= 0.95) {
      reasons.push('very similar');
    }
    
    return reasons.join(', ');
  }

  /**
   * Merge location arrays
   */
  private mergeLocations(
    locs1: HarmonicPatternMemory['locations'],
    locs2: HarmonicPatternMemory['locations']
  ): HarmonicPatternMemory['locations'] {
    const merged = [...locs1];
    
    for (const loc2 of locs2) {
      const exists = merged.some(loc1 => 
        loc1.file === loc2.file &&
        loc1.startLine === loc2.startLine &&
        loc1.endLine === loc2.endLine
      );
      
      if (!exists) {
        merged.push(loc2);
      }
    }
    
    return merged;
  }

  /**
   * Estimate pattern size in bytes
   */
  private estimatePatternSize(pattern: HarmonicPatternMemory): number {
    // Rough estimation
    return (
      JSON.stringify(pattern).length +
      pattern.evidence.length * 50 +
      pattern.locations.length * 100
    );
  }

  /**
   * Get deduplication statistics
   */
  getStats(): {
    signaturesGenerated: number;
    mergeHistorySize: number;
    config: DeduplicationConfig;
  } {
    return {
      signaturesGenerated: this.signatureCache.size,
      mergeHistorySize: this.mergeHistory.size,
      config: this.config
    };
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.signatureCache.clear();
    this.logger.info('Cleared deduplication caches');
  }

  /**
   * Get merge history
   */
  getMergeHistory(): Map<string, string> {
    return new Map(this.mergeHistory);
  }
}