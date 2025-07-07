/**
 * Emergent Behavior Engine
 * Detects and generates emergent insights from quantum memory states
 */

import {
  QuantumMemoryState,
  QuantumMemoryNode,
  EmergentInsight,
  EmergentBehaviors,
  InterferencePattern,
  SystemContext
} from './quantum-types.js';

export interface EmergentDetectionResult {
  insights: EmergentInsight[];
  activatedBehaviors: string[];
  noveltyScore: number;
}

export class EmergentBehaviorEngine {
  private config: EmergentBehaviors;
  private behaviorHistory: Map<string, Date[]> = new Map();

  constructor(config: EmergentBehaviors) {
    this.config = config;
  }

  /**
   * Detect emergent behaviors from quantum state
   */
  async detect(
    quantumState: QuantumMemoryState,
    context: SystemContext,
    options?: { threshold?: number }
  ): Promise<EmergentDetectionResult> {
    const insights: EmergentInsight[] = [];
    const activatedBehaviors: string[] = [];

    // Check for dream state conditions
    if (this.config.dreamState.enabled && this.shouldTriggerDreamState(context)) {
      const dreamInsights = await this.generateDreamStateInsights(quantumState);
      insights.push(...dreamInsights);
      if (dreamInsights.length > 0) activatedBehaviors.push('dreamState');
    }

    // Check for flashback activation
    if (this.config.flashbackActivation.enabled) {
      const flashbackInsights = this.detectFlashbackPatterns(quantumState);
      insights.push(...flashbackInsights);
      if (flashbackInsights.length > 0) activatedBehaviors.push('flashbackActivation');
    }

    // Check for déjà vu exploration
    if (this.config.dejaVuExploration.enabled) {
      const dejaVuInsights = this.detectDejaVuPatterns(quantumState, context);
      insights.push(...dejaVuInsights);
      if (dejaVuInsights.length > 0) activatedBehaviors.push('dejaVuExploration');
    }

    // Check for creative synthesis
    if (this.config.creativeSynthesis.enabled) {
      const synthesisInsights = await this.detectCreativeSynthesis(
        quantumState,
        options?.threshold || this.config.creativeSynthesis.noveltyThreshold
      );
      insights.push(...synthesisInsights);
      if (synthesisInsights.length > 0) activatedBehaviors.push('creativeSynthesis');
    }

    // Calculate overall novelty score
    const noveltyScore = this.calculateOverallNovelty(insights, quantumState);

    return {
      insights,
      activatedBehaviors,
      noveltyScore
    };
  }

  /**
   * Manually trigger a specific behavior
   */
  async triggerBehavior(
    behaviorType: 'dream' | 'flashback' | 'dejavu' | 'synthesis',
    memories: Map<string, QuantumMemoryNode>,
    context: SystemContext
  ): Promise<EmergentInsight[]> {
    // Create synthetic quantum state from memories
    const quantumState = this.createSyntheticQuantumState(memories);

    switch (behaviorType) {
      case 'dream':
        return this.generateDreamStateInsights(quantumState, true);
      case 'flashback':
        return this.forceFlashbackActivation(quantumState);
      case 'dejavu':
        return this.forceDejaVuExploration(quantumState, context);
      case 'synthesis':
        return await this.forceCreativeSynthesis(quantumState);
      default:
        return [];
    }
  }

  /**
   * Dream state - random walks through memory space
   */
  private async generateDreamStateInsights(
    quantumState: QuantumMemoryState,
    forced: boolean = false
  ): Promise<EmergentInsight[]> {
    const insights: EmergentInsight[] = [];

    // Random walk through superposition
    const walkLength = 5 + Math.floor(Math.random() * 10);
    const visitedMemories: Set<string> = new Set();
    let currentState = quantumState.superposition[
      Math.floor(Math.random() * quantumState.superposition.length)
    ];

    for (let i = 0; i < walkLength && currentState; i++) {
      visitedMemories.add(currentState.memory.id);

      // Find next random connection
      const connections = quantumState.superposition.filter(
        s => !visitedMemories.has(s.memory.id) &&
        this.calculateMemorySimilarity(currentState.memory, s.memory) > 0.3
      );

      if (connections.length > 0) {
        currentState = connections[Math.floor(Math.random() * connections.length)];
      } else {
        break;
      }
    }

    // Generate insight from walk
    if (visitedMemories.size >= 3) {
      const memoryArray = Array.from(visitedMemories);
      const description = this.synthesizeWalkDescription(
        memoryArray.map(id => 
          quantumState.superposition.find(s => s.memory.id === id)?.memory
        ).filter((m): m is QuantumMemoryNode => m !== undefined)
      );

      insights.push({
        type: 'novel_connection',
        description: `Dream walk discovered: ${description}`,
        contributingMemories: memoryArray,
        noveltyScore: 0.6 + Math.random() * 0.3,
        confidenceLevel: 0.4 + Math.random() * 0.2,
        suggestedAction: 'Explore connection between distant concepts'
      });
    }

    return insights;
  }

  /**
   * Flashback activation - cascade through strongly connected memories
   */
  private detectFlashbackPatterns(quantumState: QuantumMemoryState): EmergentInsight[] {
    const insights: EmergentInsight[] = [];
    const threshold = this.config.flashbackActivation.threshold;

    // Find high-resonance clusters
    const highResonance = quantumState.superposition.filter(
      s => s.memory.resonanceStrength > threshold
    );

    if (highResonance.length >= 2) {
      // Trace cascade paths
      const cascades = this.traceCascadePaths(
        highResonance,
        quantumState,
        this.config.flashbackActivation.cascadeDepth
      );

      cascades.forEach(cascade => {
        if (cascade.length >= 3) {
          insights.push({
            type: 'pattern_synthesis',
            description: `High-resonance cascade: ${this.describeCascade(cascade)}`,
            contributingMemories: cascade.map(s => s.memory.id),
            noveltyScore: 0.8,
            confidenceLevel: cascade[0].memory.resonanceStrength,
            suggestedAction: 'Deep dive into resonant pattern cluster'
          });
        }
      });
    }

    return insights;
  }

  /**
   * Déjà vu exploration - uncertainty-driven expansion
   */
  private detectDejaVuPatterns(
    quantumState: QuantumMemoryState,
    context: SystemContext
  ): EmergentInsight[] {
    const insights: EmergentInsight[] = [];
    const uncertaintyThreshold = this.config.dejaVuExploration.uncertaintyThreshold;

    // Find partial matches with high uncertainty
    const uncertainMatches = quantumState.superposition.filter(
      s => s.probability > 0.2 && 
           s.probability < 0.6 &&
           s.memory.confidenceScore < uncertaintyThreshold
    );

    if (uncertainMatches.length >= 3) {
      // Group by similarity
      const similarityGroups = this.groupBySimilarity(uncertainMatches);

      similarityGroups.forEach(group => {
        if (group.length >= 2) {
          const commonPatterns = this.findCommonPatterns(group);
          
          insights.push({
            type: 'unexpected_relevance',
            description: `Déjà vu pattern: ${commonPatterns.join(', ')} across uncertain memories`,
            contributingMemories: group.map(s => s.memory.id),
            noveltyScore: 0.65,
            confidenceLevel: 0.3, // Low confidence triggers exploration
            suggestedAction: 'Expand search to clarify uncertain connections'
          });
        }
      });
    }

    return insights;
  }

  /**
   * Creative synthesis - interference-driven insight generation
   */
  private async detectCreativeSynthesis(
    quantumState: QuantumMemoryState,
    noveltyThreshold: number
  ): Promise<EmergentInsight[]> {
    const insights: EmergentInsight[] = [];

    // Analyze interference patterns
    const significantPatterns = quantumState.interferencePatterns.filter(
      pattern => pattern.strength > 0.5 && pattern.noveltyScore > noveltyThreshold
    );

    significantPatterns.forEach(pattern => {
      if (pattern.involvedMemories.length >= this.config.creativeSynthesis.minimumPatterns) {
        const synthesis = this.synthesizeFromInterference(pattern, quantumState);
        
        insights.push({
          type: 'pattern_synthesis',
          description: synthesis.description,
          contributingMemories: pattern.involvedMemories,
          noveltyScore: pattern.noveltyScore,
          confidenceLevel: pattern.confidenceLevel,
          suggestedAction: synthesis.action
        });
      }
    });

    // Cross-category synthesis
    const crossCategoryInsights = this.detectCrossCategorySynthesis(quantumState);
    insights.push(...crossCategoryInsights);

    return insights;
  }

  // Helper methods

  private shouldTriggerDreamState(context: SystemContext): boolean {
    const trigger = this.config.dreamState.trigger;
    
    switch (trigger) {
      case 'system_idle':
        // Check if system has been idle
        const lastQueryTime = context.recentQueries[context.recentQueries.length - 1]?.timestamp;
        const idleTime = lastQueryTime ? Date.now() - lastQueryTime : Infinity;
        return idleTime > 30000; // 30 seconds idle

      case 'scheduled':
        // Check if it's time for scheduled dream state
        const lastDream = this.behaviorHistory.get('dreamState')?.[0];
        const timeSinceLastDream = lastDream ? Date.now() - lastDream.getTime() : Infinity;
        return timeSinceLastDream > 3600000 / this.config.dreamState.frequency; // Based on frequency

      case 'random':
        // Random trigger based on frequency
        return Math.random() < this.config.dreamState.frequency / 100;

      default:
        return false;
    }
  }

  private calculateMemorySimilarity(
    memory1: QuantumMemoryNode,
    memory2: QuantumMemoryNode
  ): number {
    // Coordinate distance
    const dx = memory1.coordinates[0] - memory2.coordinates[0];
    const dy = memory1.coordinates[1] - memory2.coordinates[1];
    const dz = memory1.coordinates[2] - memory2.coordinates[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const spatialSimilarity = 1 - Math.min(distance, 1);

    // Category similarity
    const categorySimilarity = 
      memory1.content.harmonicSignature.category === memory2.content.harmonicSignature.category
        ? 1 : 0.3;

    // Tag overlap
    const tags1 = new Set(memory1.content.tags);
    const tags2 = new Set(memory2.content.tags);
    const commonTags = Array.from(tags1).filter(tag => tags2.has(tag)).length;
    const tagSimilarity = commonTags / Math.max(tags1.size, tags2.size, 1);

    return spatialSimilarity * 0.4 + categorySimilarity * 0.3 + tagSimilarity * 0.3;
  }

  private synthesizeWalkDescription(memories: QuantumMemoryNode[]): string {
    if (memories.length === 0) return 'empty walk';

    const categories = memories.map(m => m.content.harmonicSignature.category);
    const uniqueCategories = Array.from(new Set(categories));
    
    const commonTags = this.findCommonTags(memories);
    
    return `${uniqueCategories.join(' → ')} with ${commonTags.join(', ')} patterns`;
  }

  private traceCascadePaths(
    startNodes: any[],
    quantumState: QuantumMemoryState,
    maxDepth: number
  ): any[][] {
    const paths: any[][] = [];

    startNodes.forEach(start => {
      const path = [start];
      let current = start;

      for (let depth = 0; depth < maxDepth; depth++) {
        // Find strongly connected next node
        const next = quantumState.superposition.find(
          s => s.memory.id !== current.memory.id &&
               this.calculateMemorySimilarity(current.memory, s.memory) > 0.7 &&
               s.memory.resonanceStrength > 0.6
        );

        if (next) {
          path.push(next);
          current = next;
        } else {
          break;
        }
      }

      if (path.length > 1) {
        paths.push(path);
      }
    });

    return paths;
  }

  private describeCascade(cascade: any[]): string {
    const strengths = cascade.map(s => s.memory.resonanceStrength.toFixed(2));
    const categories = cascade.map(s => s.memory.content.harmonicSignature.category);
    return `${categories.join(' → ')} (strengths: ${strengths.join(', ')})`;
  }

  private groupBySimilarity(states: any[]): any[][] {
    const groups: any[][] = [];
    const assigned = new Set<string>();

    states.forEach(state => {
      if (assigned.has(state.memory.id)) return;

      const group = [state];
      assigned.add(state.memory.id);

      // Find similar unassigned states
      states.forEach(other => {
        if (!assigned.has(other.memory.id) &&
            this.calculateMemorySimilarity(state.memory, other.memory) > 0.6) {
          group.push(other);
          assigned.add(other.memory.id);
        }
      });

      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }

  private findCommonPatterns(group: any[]): string[] {
    const patterns: Map<string, number> = new Map();

    group.forEach(state => {
      // Count categories
      const category = state.memory.content.harmonicSignature.category;
      patterns.set(category, (patterns.get(category) || 0) + 1);

      // Count tags
      state.memory.content.tags.forEach((tag: string) => {
        patterns.set(`tag:${tag}`, (patterns.get(`tag:${tag}`) || 0) + 1);
      });
    });

    // Return patterns that appear in at least half the group
    const threshold = group.length / 2;
    return Array.from(patterns.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([pattern, _]) => pattern);
  }

  private findCommonTags(memories: QuantumMemoryNode[]): string[] {
    const tagCounts = new Map<string, number>();

    memories.forEach(memory => {
      memory.content.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Return tags that appear in at least half the memories
    const threshold = memories.length / 2;
    return Array.from(tagCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([tag, _]) => tag);
  }

  private synthesizeFromInterference(
    pattern: InterferencePattern,
    quantumState: QuantumMemoryState
  ): { description: string; action: string } {
    const mechanism = pattern.mechanism;
    const properties = pattern.emergentProperties;

    let description = '';
    let action = '';

    switch (mechanism) {
      case 'phase_coherence':
        description = `Phase-aligned memories reveal ${properties.join(', ')}`;
        action = 'Investigate synchronized patterns for deeper structure';
        break;

      case 'harmonic_resonance':
        description = `Harmonic resonance between ${properties.join(' and ')}`;
        action = 'Explore mathematical relationships in resonant patterns';
        break;

      case 'frequency_matching':
        description = `Frequency-matched patterns suggest ${properties.join(', ')}`;
        action = 'Analyze temporal correlations between matched frequencies';
        break;
    }

    return { description, action };
  }

  private detectCrossCategorySynthesis(quantumState: QuantumMemoryState): EmergentInsight[] {
    const insights: EmergentInsight[] = [];
    
    // Group by category
    const categoryGroups = new Map<string, any[]>();
    quantumState.superposition.forEach(state => {
      const category = state.memory.content.harmonicSignature.category;
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(state);
    });

    // Find cross-category connections
    const categories = Array.from(categoryGroups.keys());
    for (let i = 0; i < categories.length - 1; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const group1 = categoryGroups.get(categories[i])!;
        const group2 = categoryGroups.get(categories[j])!;

        // Check for strong cross-connections
        const connections = this.findCrossConnections(group1, group2);
        if (connections.length >= 2) {
          insights.push({
            type: 'pattern_synthesis',
            description: `Cross-category synthesis: ${categories[i]} ↔ ${categories[j]}`,
            contributingMemories: connections.map(c => [c.from.memory.id, c.to.memory.id]).flat(),
            noveltyScore: 0.85,
            confidenceLevel: 0.6,
            suggestedAction: `Bridge concepts between ${categories[i]} and ${categories[j]}`
          });
        }
      }
    }

    return insights;
  }

  private findCrossConnections(group1: any[], group2: any[]): any[] {
    const connections: any[] = [];

    group1.forEach(state1 => {
      group2.forEach(state2 => {
        const similarity = this.calculateMemorySimilarity(state1.memory, state2.memory);
        if (similarity > 0.5) {
          connections.push({ from: state1, to: state2, similarity });
        }
      });
    });

    return connections.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }

  private calculateOverallNovelty(
    insights: EmergentInsight[],
    quantumState: QuantumMemoryState
  ): number {
    if (insights.length === 0) return 0;

    // Average novelty of insights
    const avgInsightNovelty = insights.reduce((sum, i) => sum + i.noveltyScore, 0) / insights.length;

    // Interference pattern novelty
    const avgInterferenceNovelty = quantumState.interferencePatterns.reduce(
      (sum, p) => sum + p.noveltyScore, 0
    ) / Math.max(quantumState.interferencePatterns.length, 1);

    // Coherence as inverse novelty (low coherence = high novelty)
    const coherenceNovelty = 1 - quantumState.coherenceLevel;

    return avgInsightNovelty * 0.5 + avgInterferenceNovelty * 0.3 + coherenceNovelty * 0.2;
  }

  private createSyntheticQuantumState(
    memories: Map<string, QuantumMemoryNode>
  ): QuantumMemoryState {
    const memoryArray = Array.from(memories.values());
    const superposition = memoryArray.map(memory => ({
      memory,
      amplitude: Math.random(),
      phase: Math.random() * 2 * Math.PI,
      probability: 1 / memoryArray.length,
      activationEnergy: 0.1
    }));

    return {
      superposition,
      totalProbability: 1.0,
      dominantStates: superposition.slice(0, 5),
      interferencePatterns: [],
      coherenceLevel: 0.5
    };
  }

  private forceFlashbackActivation(quantumState: QuantumMemoryState): EmergentInsight[] {
    // Force high resonance values
    quantumState.superposition.forEach(s => {
      s.memory.resonanceStrength = 0.9 + Math.random() * 0.1;
    });
    return this.detectFlashbackPatterns(quantumState);
  }

  private forceDejaVuExploration(
    quantumState: QuantumMemoryState,
    context: SystemContext
  ): EmergentInsight[] {
    // Force uncertainty
    quantumState.superposition.forEach(s => {
      s.probability = 0.3 + Math.random() * 0.3;
      s.memory.confidenceScore = 0.2 + Math.random() * 0.2;
    });
    return this.detectDejaVuPatterns(quantumState, context);
  }

  private async forceCreativeSynthesis(quantumState: QuantumMemoryState): Promise<EmergentInsight[]> {
    // Generate synthetic interference patterns
    const patterns: InterferencePattern[] = [];
    
    for (let i = 0; i < 5; i++) {
      const involvedCount = 3 + Math.floor(Math.random() * 5);
      const involved = quantumState.superposition
        .slice(0, involvedCount)
        .map(s => s.memory.id);

      patterns.push({
        type: 'constructive',
        strength: 0.7 + Math.random() * 0.3,
        mechanism: 'harmonic_resonance',
        emergentProperties: ['forced_synthesis', `pattern_${i}`],
        noveltyScore: 0.8 + Math.random() * 0.2,
        confidenceLevel: 0.6,
        involvedMemories: involved
      });
    }

    quantumState.interferencePatterns = patterns;
    return await this.detectCreativeSynthesis(quantumState, 0.5);
  }

  getStats(): any {
    return {
      behaviorHistory: Object.fromEntries(
        Array.from(this.behaviorHistory.entries()).map(
          ([behavior, dates]) => [behavior, dates.length]
        )
      ),
      config: this.config
    };
  }
}