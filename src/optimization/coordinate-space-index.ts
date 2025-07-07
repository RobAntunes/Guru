/**
 * Coordinate Space Index
 * R-tree based spatial indexing for O(log n) proximity searches
 */

import { HarmonicPatternMemory } from '../memory/types.js';
import { Logger } from '../logging/logger.js';

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

export interface RTreeNode {
  id: string;
  bbox: BoundingBox;
  isLeaf: boolean;
  entries: RTreeEntry[];
  parent?: RTreeNode;
}

export interface RTreeEntry {
  patternId?: string;
  pattern?: HarmonicPatternMemory;
  childNode?: RTreeNode;
  bbox: BoundingBox;
}

export interface SearchResult {
  pattern: HarmonicPatternMemory;
  distance: number;
}

export interface IndexStats {
  nodeCount: number;
  leafCount: number;
  height: number;
  patterns: number;
  avgNodeOccupancy: number;
}

/**
 * R-tree implementation for 3D coordinate indexing
 */
export class CoordinateSpaceIndex {
  private logger = Logger.getInstance();
  private root: RTreeNode;
  private nodeCount: number = 0;
  private patternCount: number = 0;
  private readonly maxEntries: number = 16; // M in R-tree terminology
  private readonly minEntries: number = 6;  // m in R-tree terminology (40% of M)
  
  // Pattern lookup for fast access
  private patternMap: Map<string, HarmonicPatternMemory> = new Map();

  constructor() {
    this.root = this.createNode(true);
  }

  /**
   * Insert a pattern into the index
   */
  insert(pattern: HarmonicPatternMemory): void {
    const bbox = this.patternToBBox(pattern);
    const entry: RTreeEntry = {
      patternId: pattern.id,
      pattern,
      bbox
    };
    
    this.patternMap.set(pattern.id, pattern);
    this.insertEntry(this.root, entry);
    this.patternCount++;
  }

  /**
   * Bulk insert patterns
   */
  bulkInsert(patterns: HarmonicPatternMemory[]): void {
    // Sort patterns by Hilbert curve value for better tree balance
    const sorted = this.sortByHilbertValue(patterns);
    
    sorted.forEach(pattern => this.insert(pattern));
    
    this.logger.info(`Bulk inserted ${patterns.length} patterns into R-tree`);
  }

  /**
   * Find patterns within radius of a point
   */
  searchRadius(
    center: [number, number, number],
    radius: number,
    limit?: number
  ): SearchResult[] {
    const searchBox: BoundingBox = {
      min: [center[0] - radius, center[1] - radius, center[2] - radius],
      max: [center[0] + radius, center[1] + radius, center[2] + radius]
    };
    
    const candidates: HarmonicPatternMemory[] = [];
    this.searchNode(this.root, searchBox, candidates);
    
    // Calculate actual distances and filter
    const results: SearchResult[] = candidates
      .map(pattern => ({
        pattern,
        distance: this.euclideanDistance(center, pattern.coordinates)
      }))
      .filter(result => result.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Find k nearest neighbors
   */
  searchKNN(
    center: [number, number, number],
    k: number
  ): SearchResult[] {
    // Priority queue for nearest neighbors
    const nearest: SearchResult[] = [];
    const visited = new Set<string>();
    
    // Start with a large search radius and refine
    let searchRadius = 1.0;
    
    while (nearest.length < k && searchRadius <= 2.0) {
      const candidates = this.searchRadius(center, searchRadius, k * 2);
      
      for (const candidate of candidates) {
        if (!visited.has(candidate.pattern.id)) {
          visited.add(candidate.pattern.id);
          nearest.push(candidate);
        }
      }
      
      // Sort and keep only k nearest
      nearest.sort((a, b) => a.distance - b.distance);
      if (nearest.length > k) {
        nearest.length = k;
      }
      
      searchRadius *= 1.5;
    }
    
    return nearest.slice(0, k);
  }

  /**
   * Search patterns within a bounding box
   */
  searchBox(bbox: BoundingBox): HarmonicPatternMemory[] {
    const results: HarmonicPatternMemory[] = [];
    this.searchNode(this.root, bbox, results);
    return results;
  }

  /**
   * Remove a pattern from the index
   */
  remove(patternId: string): boolean {
    const pattern = this.patternMap.get(patternId);
    if (!pattern) return false;
    
    const removed = this.removeFromNode(this.root, patternId);
    if (removed) {
      this.patternMap.delete(patternId);
      this.patternCount--;
    }
    
    return removed;
  }

  /**
   * Update pattern coordinates
   */
  update(pattern: HarmonicPatternMemory): void {
    // Remove and re-insert (simplest approach)
    this.remove(pattern.id);
    this.insert(pattern);
  }

  /**
   * Get index statistics
   */
  getStats(): IndexStats {
    const stats = {
      nodeCount: 0,
      leafCount: 0,
      height: 0,
      totalEntries: 0
    };
    
    this.collectStats(this.root, 0, stats);
    
    return {
      nodeCount: stats.nodeCount,
      leafCount: stats.leafCount,
      height: stats.height,
      patterns: this.patternCount,
      avgNodeOccupancy: stats.totalEntries / Math.max(1, stats.nodeCount)
    };
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.root = this.createNode(true);
    this.patternMap.clear();
    this.nodeCount = 0;
    this.patternCount = 0;
  }

  // Private methods

  private createNode(isLeaf: boolean): RTreeNode {
    this.nodeCount++;
    return {
      id: `node_${this.nodeCount}`,
      bbox: this.emptyBBox(),
      isLeaf,
      entries: []
    };
  }

  private patternToBBox(pattern: HarmonicPatternMemory): BoundingBox {
    const [x, y, z] = pattern.coordinates;
    const epsilon = 0.001; // Small bbox for point data
    
    return {
      min: [x - epsilon, y - epsilon, z - epsilon],
      max: [x + epsilon, y + epsilon, z + epsilon]
    };
  }

  private emptyBBox(): BoundingBox {
    return {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity]
    };
  }

  private insertEntry(node: RTreeNode, entry: RTreeEntry): void {
    if (node.isLeaf) {
      // Add to leaf node
      node.entries.push(entry);
      this.updateBBox(node);
      
      // Split if necessary
      if (node.entries.length > this.maxEntries) {
        this.splitNode(node);
      }
    } else {
      // Choose subtree with minimum enlargement
      const bestChild = this.chooseSubtree(node, entry.bbox);
      this.insertEntry(bestChild, entry);
      this.updateBBox(node);
    }
  }

  private chooseSubtree(node: RTreeNode, bbox: BoundingBox): RTreeNode {
    let minEnlargement = Infinity;
    let bestEntry: RTreeEntry | null = null;
    
    for (const entry of node.entries) {
      if (!entry.childNode) continue;
      
      const enlargement = this.bboxEnlargement(entry.bbox, bbox);
      if (enlargement < minEnlargement) {
        minEnlargement = enlargement;
        bestEntry = entry;
      }
    }
    
    return bestEntry?.childNode || node;
  }

  private splitNode(node: RTreeNode): void {
    if (!node.parent) {
      // Split root - create new root
      const newRoot = this.createNode(false);
      const sibling = this.createNode(node.isLeaf);
      
      // Distribute entries
      const [group1, group2] = this.linearSplit(node.entries);
      
      node.entries = group1;
      sibling.entries = group2;
      
      // Update bounding boxes
      this.updateBBox(node);
      this.updateBBox(sibling);
      
      // Create entries in new root
      newRoot.entries = [
        { childNode: node, bbox: node.bbox },
        { childNode: sibling, bbox: sibling.bbox }
      ];
      
      node.parent = newRoot;
      sibling.parent = newRoot;
      this.root = newRoot;
      
      this.updateBBox(newRoot);
    } else {
      // Split non-root node
      const sibling = this.createNode(node.isLeaf);
      const [group1, group2] = this.linearSplit(node.entries);
      
      node.entries = group1;
      sibling.entries = group2;
      
      this.updateBBox(node);
      this.updateBBox(sibling);
      
      // Add sibling to parent
      node.parent.entries.push({
        childNode: sibling,
        bbox: sibling.bbox
      });
      
      sibling.parent = node.parent;
      
      // Propagate split upward if necessary
      if (node.parent.entries.length > this.maxEntries) {
        this.splitNode(node.parent);
      }
    }
  }

  private linearSplit(entries: RTreeEntry[]): [RTreeEntry[], RTreeEntry[]] {
    // Simple linear split - find two seeds with maximum separation
    let maxSeparation = -Infinity;
    let seed1 = 0, seed2 = 1;
    
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const separation = this.bboxSeparation(entries[i].bbox, entries[j].bbox);
        if (separation > maxSeparation) {
          maxSeparation = separation;
          seed1 = i;
          seed2 = j;
        }
      }
    }
    
    const group1: RTreeEntry[] = [entries[seed1]];
    const group2: RTreeEntry[] = [entries[seed2]];
    
    // Distribute remaining entries
    for (let i = 0; i < entries.length; i++) {
      if (i === seed1 || i === seed2) continue;
      
      const entry = entries[i];
      const enlargement1 = this.bboxEnlargement(this.groupBBox(group1), entry.bbox);
      const enlargement2 = this.bboxEnlargement(this.groupBBox(group2), entry.bbox);
      
      if (enlargement1 < enlargement2) {
        group1.push(entry);
      } else {
        group2.push(entry);
      }
      
      // Ensure minimum entries
      if (group1.length + group2.length === entries.length) {
        if (group1.length < this.minEntries) {
          while (group1.length < this.minEntries && group2.length > this.minEntries) {
            group1.push(group2.pop()!);
          }
        } else if (group2.length < this.minEntries) {
          while (group2.length < this.minEntries && group1.length > this.minEntries) {
            group2.push(group1.pop()!);
          }
        }
      }
    }
    
    return [group1, group2];
  }

  private searchNode(
    node: RTreeNode,
    searchBox: BoundingBox,
    results: HarmonicPatternMemory[]
  ): void {
    if (!this.bboxIntersects(node.bbox, searchBox)) {
      return;
    }
    
    if (node.isLeaf) {
      // Check leaf entries
      for (const entry of node.entries) {
        if (entry.pattern && this.bboxIntersects(entry.bbox, searchBox)) {
          results.push(entry.pattern);
        }
      }
    } else {
      // Recursively search child nodes
      for (const entry of node.entries) {
        if (entry.childNode && this.bboxIntersects(entry.bbox, searchBox)) {
          this.searchNode(entry.childNode, searchBox, results);
        }
      }
    }
  }

  private removeFromNode(node: RTreeNode, patternId: string): boolean {
    if (node.isLeaf) {
      const index = node.entries.findIndex(e => e.patternId === patternId);
      if (index >= 0) {
        node.entries.splice(index, 1);
        this.updateBBox(node);
        return true;
      }
    } else {
      for (const entry of node.entries) {
        if (entry.childNode && this.removeFromNode(entry.childNode, patternId)) {
          this.updateBBox(node);
          return true;
        }
      }
    }
    return false;
  }

  private updateBBox(node: RTreeNode): void {
    if (node.entries.length === 0) {
      node.bbox = this.emptyBBox();
      return;
    }
    
    const bbox = this.emptyBBox();
    
    for (const entry of node.entries) {
      for (let i = 0; i < 3; i++) {
        bbox.min[i] = Math.min(bbox.min[i], entry.bbox.min[i]);
        bbox.max[i] = Math.max(bbox.max[i], entry.bbox.max[i]);
      }
    }
    
    node.bbox = bbox;
  }

  private groupBBox(entries: RTreeEntry[]): BoundingBox {
    const bbox = this.emptyBBox();
    
    for (const entry of entries) {
      for (let i = 0; i < 3; i++) {
        bbox.min[i] = Math.min(bbox.min[i], entry.bbox.min[i]);
        bbox.max[i] = Math.max(bbox.max[i], entry.bbox.max[i]);
      }
    }
    
    return bbox;
  }

  private bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
    for (let i = 0; i < 3; i++) {
      if (a.max[i] < b.min[i] || a.min[i] > b.max[i]) {
        return false;
      }
    }
    return true;
  }

  private bboxEnlargement(bbox: BoundingBox, other: BoundingBox): number {
    const enlarged = {
      min: [
        Math.min(bbox.min[0], other.min[0]),
        Math.min(bbox.min[1], other.min[1]),
        Math.min(bbox.min[2], other.min[2])
      ],
      max: [
        Math.max(bbox.max[0], other.max[0]),
        Math.max(bbox.max[1], other.max[1]),
        Math.max(bbox.max[2], other.max[2])
      ]
    };
    
    return this.bboxVolume(enlarged) - this.bboxVolume(bbox);
  }

  private bboxVolume(bbox: BoundingBox): number {
    return (bbox.max[0] - bbox.min[0]) *
           (bbox.max[1] - bbox.min[1]) *
           (bbox.max[2] - bbox.min[2]);
  }

  private bboxSeparation(a: BoundingBox, b: BoundingBox): number {
    let separation = 0;
    
    for (let i = 0; i < 3; i++) {
      const gap = Math.max(0, b.min[i] - a.max[i], a.min[i] - b.max[i]);
      separation += gap * gap;
    }
    
    return Math.sqrt(separation);
  }

  private euclideanDistance(a: [number, number, number], b: [number, number, number]): number {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
    );
  }

  private sortByHilbertValue(patterns: HarmonicPatternMemory[]): HarmonicPatternMemory[] {
    // Simple Hilbert curve approximation for 3D
    return patterns.sort((a, b) => {
      const ha = this.hilbert3D(a.coordinates);
      const hb = this.hilbert3D(b.coordinates);
      return ha - hb;
    });
  }

  private hilbert3D(coord: [number, number, number]): number {
    // Simple Z-order curve as Hilbert approximation
    const scale = 1000;
    const x = Math.floor(coord[0] * scale);
    const y = Math.floor(coord[1] * scale);
    const z = Math.floor(coord[2] * scale);
    
    // Interleave bits (Morton encoding)
    let result = 0;
    for (let i = 0; i < 10; i++) {
      result |= ((x >> i) & 1) << (3 * i);
      result |= ((y >> i) & 1) << (3 * i + 1);
      result |= ((z >> i) & 1) << (3 * i + 2);
    }
    
    return result;
  }

  private collectStats(node: RTreeNode, depth: number, stats: any): void {
    stats.nodeCount++;
    stats.height = Math.max(stats.height, depth);
    stats.totalEntries += node.entries.length;
    
    if (node.isLeaf) {
      stats.leafCount++;
    } else {
      for (const entry of node.entries) {
        if (entry.childNode) {
          this.collectStats(entry.childNode, depth + 1, stats);
        }
      }
    }
  }
}