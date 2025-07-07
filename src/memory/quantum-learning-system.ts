/**
 * Quantum Learning System
 * Implements Hebbian learning, confidence calibration, and spatial adaptation
 */

import {
  QuantumMemoryNode,
  QuantumMemoryResult,
  MemoryQuery,
  SystemContext,
  QuantumLearningConfig,
  AccessEvent
} from './quantum-types.js';

export interface LearningEvent {
  timestamp: Date;
  type: 'access' | 'success' | 'failure' | 'association';
  memoryId: string;
  context: any;
  metrics: {
    responseTime?: number;
    relevanceScore?: number;
    userFeedback?: number;
  };
}

export interface LearningStats {
  totalEvents: number;
  successRate: number;
  averageConfidenceChange: number;
  spatialClusters: number;
  strongestAssociations: Array<{
    memory1: string;
    memory2: string;
    strength: number;
  }>;
}

export class QuantumLearningSystem {
  private config: QuantumLearningConfig;
  private learningHistory: LearningEvent[] = [];
  private associationMatrix: Map<string, Map<string, number>> = new Map();
  private spatialClusters: Map<string, string[]> = new Map();

  constructor(config: QuantumLearningConfig) {
    this.config = config;
  }

  /**
   * Process interaction and update memory properties
   */
  async processInteraction(
    query: MemoryQuery,
    result: QuantumMemoryResult,
    context: SystemContext
  ): Promise<void> {
    const timestamp = new Date();

    // Record access events
    result.memories.forEach((memory, index) => {
      const relevanceScore = 1 - (index / result.memories.length); // Higher rank = higher relevance
      
      this.recordLearningEvent({
        timestamp,
        type: 'access',
        memoryId: memory.id,
        context: { query, result: 'retrieved' },
        metrics: {
          responseTime: result.executionMetrics.totalTime,
          relevanceScore
        }
      });

      // Update memory access history
      const accessEvent: AccessEvent = {
        timestamp,
        queryType: query.type,
        success: relevanceScore > 0.5,
        activationLevel: memory.currentActivation + relevanceScore * 0.2,
        context: query.type
      };
      
      memory.accessHistory.push(accessEvent);
      if (memory.accessHistory.length > 100) {
        memory.accessHistory.shift(); // Keep last 100 accesses
      }
    });

    // Apply Hebbian strengthening
    await this.applyHebbianLearning(result.memories);

    // Update confidence based on coherence
    await this.updateConfidenceScores(result);

    // Adapt spatial organization
    await this.adaptSpatialOrganization(result.memories);

    // Process associations from interference patterns
    result.interferencePatterns.forEach(pattern => {
      this.strengthenAssociations(pattern.involvedMemories);
    });
  }

  /**
   * Integrate a new memory into the learning system
   */
  async integrateNewMemory(memory: QuantumMemoryNode): Promise<void> {
    // Initialize with base confidence
    memory.confidenceScore = 0.5;
    memory.resonanceStrength = 0.5;

    // Find potential cluster
    const cluster = this.findBestCluster(memory);
    if (cluster) {
      this.spatialClusters.get(cluster)!.push(memory.id);
    } else {
      // Create new cluster
      this.spatialClusters.set(memory.id, [memory.id]);
    }

    this.recordLearningEvent({
      timestamp: new Date(),
      type: 'access',
      memoryId: memory.id,
      context: { action: 'integration' },
      metrics: {}
    });
  }

  /**
   * Batch integrate multiple memories
   */
  async batchIntegrate(memories: QuantumMemoryNode[]): Promise<void> {
    // Process in parallel for efficiency
    await Promise.all(memories.map(m => this.integrateNewMemory(m)));

    // Find cross-memory associations
    for (let i = 0; i < memories.length - 1; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const similarity = this.calculateSimilarity(memories[i], memories[j]);
        if (similarity > 0.6) {
          this.updateAssociation(memories[i].id, memories[j].id, similarity);
        }
      }
    }
  }

  /**
   * Apply Hebbian learning rules
   */
  private async applyHebbianLearning(memories: QuantumMemoryNode[]): Promise<void> {
    const { strengthenRate, weakenRate, associativeBonus } = this.config.hebbianStrengthening;

    memories.forEach((memory, index) => {
      // Strengthen accessed memories
      memory.resonanceStrength = Math.min(
        1.0,
        memory.resonanceStrength + strengthenRate * (1 - index / memories.length)
      );

      // Update activation
      memory.currentActivation = Math.min(
        memory.threshold,
        memory.currentActivation + strengthenRate * 0.5
      );
    });

    // Apply associative strengthening
    for (let i = 0; i < memories.length - 1; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const currentAssociation = this.getAssociation(memories[i].id, memories[j].id);
        const newStrength = Math.min(
          1.0,
          currentAssociation + associativeBonus
        );
        this.updateAssociation(memories[i].id, memories[j].id, newStrength);
      }
    }

    // Decay unused memories (would need to track all memories)
    // This is a placeholder - in production, this would scan all memories
  }

  /**
   * Update confidence scores based on success/failure
   */
  private async updateConfidenceScores(result: QuantumMemoryResult): Promise<void> {
    const { successBonus, failurePenalty, uncertaintyDecay } = this.config.confidenceEvolution;

    // High coherence = success
    const isSuccess = result.coherenceLevel > 0.7;
    const adjustment = isSuccess ? successBonus : -failurePenalty;

    result.memories.forEach((memory, index) => {
      // Top results get more confidence adjustment
      const positionFactor = 1 - (index / result.memories.length);
      const deltaConfidence = adjustment * positionFactor;

      memory.confidenceScore = Math.max(
        0.1,
        Math.min(1.0, memory.confidenceScore + deltaConfidence)
      );

      // Record success/failure
      this.recordLearningEvent({
        timestamp: new Date(),
        type: isSuccess ? 'success' : 'failure',
        memoryId: memory.id,
        context: { coherenceLevel: result.coherenceLevel },
        metrics: { relevanceScore: positionFactor }
      });
    });

    // Apply uncertainty decay to low-confidence memories
    result.memories
      .filter(m => m.confidenceScore < 0.4)
      .forEach(memory => {
        memory.confidenceScore *= (1 - uncertaintyDecay);
      });
  }

  /**
   * Adapt spatial organization of memories
   */
  private async adaptSpatialOrganization(memories: QuantumMemoryNode[]): Promise<void> {
    if (!this.config.spatialAdaptation.dimensionalOptimization) return;

    const { clusteringRate, boundaryFlexibility } = this.config.spatialAdaptation;

    // Calculate centroid of accessed memories
    const centroid = this.calculateCentroid(memories);

    // Move memories slightly toward centroid (clustering)
    memories.forEach(memory => {
      for (let i = 0; i < 3; i++) {
        const delta = (centroid[i] - memory.coordinates[i]) * clusteringRate;
        memory.coordinates[i] = Math.max(
          0,
          Math.min(1, memory.coordinates[i] + delta)
        );
      }
    });

    // Update cluster assignments
    this.updateClusters(memories);
  }

  /**
   * Strengthen associations between memories
   */
  private strengthenAssociations(memoryIds: string[]): void {
    const { associativeBonus } = this.config.hebbianStrengthening;

    for (let i = 0; i < memoryIds.length - 1; i++) {
      for (let j = i + 1; j < memoryIds.length; j++) {
        const current = this.getAssociation(memoryIds[i], memoryIds[j]);
        this.updateAssociation(
          memoryIds[i],
          memoryIds[j],
          Math.min(1.0, current + associativeBonus * 2) // Double bonus for interference
        );

        this.recordLearningEvent({
          timestamp: new Date(),
          type: 'association',
          memoryId: memoryIds[i],
          context: { associatedWith: memoryIds[j] },
          metrics: {}
        });
      }
    }
  }

  /**
   * Get association strength between two memories
   */
  getAssociation(memory1: string, memory2: string): number {
    const map1 = this.associationMatrix.get(memory1);
    if (!map1) return 0;
    return map1.get(memory2) || 0;
  }

  /**
   * Update association strength
   */
  private updateAssociation(memory1: string, memory2: string, strength: number): void {
    // Ensure bidirectional association
    this.setAssociation(memory1, memory2, strength);
    this.setAssociation(memory2, memory1, strength);
  }

  private setAssociation(from: string, to: string, strength: number): void {
    if (!this.associationMatrix.has(from)) {
      this.associationMatrix.set(from, new Map());
    }
    this.associationMatrix.get(from)!.set(to, strength);
  }

  /**
   * Calculate similarity between memories
   */
  private calculateSimilarity(memory1: QuantumMemoryNode, memory2: QuantumMemoryNode): number {
    // Spatial similarity
    const spatialDistance = Math.sqrt(
      Math.pow(memory1.coordinates[0] - memory2.coordinates[0], 2) +
      Math.pow(memory1.coordinates[1] - memory2.coordinates[1], 2) +
      Math.pow(memory1.coordinates[2] - memory2.coordinates[2], 2)
    );
    const spatialSimilarity = 1 - Math.min(spatialDistance, 1);

    // Harmonic similarity
    const harmonicSimilarity = 
      memory1.content.harmonicSignature.category === memory2.content.harmonicSignature.category
        ? 0.8
        : 0.2;

    // Tag similarity
    const tags1 = new Set(memory1.content.tags);
    const tags2 = new Set(memory2.content.tags);
    const commonTags = Array.from(tags1).filter(tag => tags2.has(tag)).length;
    const tagSimilarity = commonTags / Math.max(tags1.size, tags2.size, 1);

    return spatialSimilarity * 0.4 + harmonicSimilarity * 0.3 + tagSimilarity * 0.3;
  }

  /**
   * Find best cluster for a memory
   */
  private findBestCluster(memory: QuantumMemoryNode): string | null {
    let bestCluster: string | null = null;
    let bestScore = 0;

    this.spatialClusters.forEach((members, clusterId) => {
      // Simple distance-based clustering
      const clusterCenter = this.calculateClusterCenter(members);
      const distance = Math.sqrt(
        Math.pow(memory.coordinates[0] - clusterCenter[0], 2) +
        Math.pow(memory.coordinates[1] - clusterCenter[1], 2) +
        Math.pow(memory.coordinates[2] - clusterCenter[2], 2)
      );

      const score = 1 - distance;
      if (score > bestScore && score > 0.7) { // Threshold for joining cluster
        bestScore = score;
        bestCluster = clusterId;
      }
    });

    return bestCluster;
  }

  /**
   * Calculate centroid of memories
   */
  private calculateCentroid(memories: QuantumMemoryNode[]): [number, number, number] {
    const sum = memories.reduce(
      (acc, memory) => [
        acc[0] + memory.coordinates[0],
        acc[1] + memory.coordinates[1],
        acc[2] + memory.coordinates[2]
      ],
      [0, 0, 0]
    );

    return [
      sum[0] / memories.length,
      sum[1] / memories.length,
      sum[2] / memories.length
    ];
  }

  /**
   * Calculate cluster center (placeholder - would need access to all memories)
   */
  private calculateClusterCenter(memberIds: string[]): [number, number, number] {
    // In production, this would look up actual memory coordinates
    // For now, return a random center
    return [0.5, 0.5, 0.5];
  }

  /**
   * Update cluster assignments
   */
  private updateClusters(memories: QuantumMemoryNode[]): void {
    // Re-cluster based on new positions
    memories.forEach(memory => {
      // Remove from old clusters
      this.spatialClusters.forEach((members, clusterId) => {
        const index = members.indexOf(memory.id);
        if (index > -1) {
          members.splice(index, 1);
        }
      });

      // Find new cluster
      const newCluster = this.findBestCluster(memory);
      if (newCluster) {
        this.spatialClusters.get(newCluster)!.push(memory.id);
      } else {
        this.spatialClusters.set(memory.id, [memory.id]);
      }
    });

    // Clean up empty clusters
    Array.from(this.spatialClusters.entries()).forEach(([clusterId, members]) => {
      if (members.length === 0) {
        this.spatialClusters.delete(clusterId);
      }
    });
  }

  /**
   * Record learning event
   */
  private recordLearningEvent(event: LearningEvent): void {
    this.learningHistory.push(event);

    // Keep only recent history
    if (this.learningHistory.length > 10000) {
      this.learningHistory = this.learningHistory.slice(-5000);
    }
  }

  /**
   * Get learning statistics
   */
  getStats(): LearningStats {
    const totalEvents = this.learningHistory.length;
    const successEvents = this.learningHistory.filter(e => e.type === 'success').length;
    const failureEvents = this.learningHistory.filter(e => e.type === 'failure').length;
    const totalOutcomes = successEvents + failureEvents;
    const successRate = totalOutcomes > 0 ? successEvents / totalOutcomes : 0.5;

    // Calculate average confidence change
    const confidenceChanges: number[] = [];
    const memoryConfidences = new Map<string, number[]>();

    this.learningHistory.forEach(event => {
      if (event.type === 'success' || event.type === 'failure') {
        if (!memoryConfidences.has(event.memoryId)) {
          memoryConfidences.set(event.memoryId, []);
        }
        memoryConfidences.get(event.memoryId)!.push(
          event.type === 'success' ? this.config.confidenceEvolution.successBonus : 
          -this.config.confidenceEvolution.failurePenalty
        );
      }
    });

    memoryConfidences.forEach(changes => {
      if (changes.length > 1) {
        const totalChange = changes.reduce((sum, c) => sum + c, 0);
        confidenceChanges.push(totalChange);
      }
    });

    const averageConfidenceChange = confidenceChanges.length > 0
      ? confidenceChanges.reduce((sum, c) => sum + c, 0) / confidenceChanges.length
      : 0;

    // Find strongest associations
    const associations: Array<{ memory1: string; memory2: string; strength: number }> = [];
    this.associationMatrix.forEach((map, memory1) => {
      map.forEach((strength, memory2) => {
        if (memory1 < memory2) { // Avoid duplicates
          associations.push({ memory1, memory2, strength });
        }
      });
    });

    const strongestAssociations = associations
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);

    return {
      totalEvents,
      successRate,
      averageConfidenceChange,
      spatialClusters: this.spatialClusters.size,
      strongestAssociations
    };
  }

  /**
   * Reset learning system
   */
  reset(): void {
    this.learningHistory = [];
    this.associationMatrix.clear();
    this.spatialClusters.clear();
  }
}