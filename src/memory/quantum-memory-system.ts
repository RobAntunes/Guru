/**
 * Quantum Probability Field Memory System
 * The unified API that combines DPCM deterministic retrieval with quantum emergent discovery
 */

import {
  QuantumMemoryNode,
  QuantumMemoryState,
  QuantumMemoryResult,
  ProbabilityField,
  MemoryQuery,
  SystemContext,
  EmergentBehaviors,
  QuantumLearningConfig,
  EmergentInsight,
  ExecutionMetrics
} from './quantum-types.js';
import { 
  HarmonicPatternMemory, 
  LogicOperation,
  QueryOptions as DPCMQueryOptions 
} from './types.js';
import { DPCMPatternStore } from '../storage/dpcm-pattern-store.js';
import { QuantumFieldGenerator } from './quantum-field-generator.js';
import { QuantumSuperpositionEngine } from './quantum-superposition-engine.js';
import { EmergentBehaviorEngine } from './emergent-behavior-engine.js';
import { QuantumLearningSystem } from './quantum-learning-system.js';

export interface QPFMConfig {
  dpcm: {
    enabled: boolean;
    defaultRadius: number;
    qualityThreshold: number;
  };
  quantum: {
    enabled: boolean;
    defaultFieldRadius: number;
    minProbability: number;
    interferenceThreshold: number;
  };
  emergent: EmergentBehaviors;
  learning: QuantumLearningConfig;
  performance: {
    maxMemories: number;
    maxSuperpositionSize: number;
    cacheEnabled: boolean;
  };
}

export class QuantumProbabilityFieldMemory {
  // Core engines
  private dpcmStore: DPCMPatternStore;
  private fieldGenerator: QuantumFieldGenerator;
  private superpositionEngine: QuantumSuperpositionEngine;
  private emergenceBehaviorEngine: EmergentBehaviorEngine;
  private learningSystem: QuantumLearningSystem;
  
  // Memory storage
  private quantumMemories: Map<string, QuantumMemoryNode> = new Map();
  private systemContext: SystemContext;
  
  // Configuration
  private config: QPFMConfig;
  
  constructor(config?: Partial<QPFMConfig>) {
    this.config = this.mergeConfig(config);
    
    // Initialize engines
    this.dpcmStore = new DPCMPatternStore();
    this.fieldGenerator = new QuantumFieldGenerator();
    this.superpositionEngine = new QuantumSuperpositionEngine();
    this.emergenceBehaviorEngine = new EmergentBehaviorEngine(this.config.emergent);
    this.learningSystem = new QuantumLearningSystem(this.config.learning);
    
    // Initialize context
    this.systemContext = {
      recentQueries: [],
      activePatterns: [],
      performanceMetrics: {
        avgResponseTime: 0,
        hitRate: 0,
        emergenceFrequency: 0
      }
    };
  }

  /**
   * Main unified query interface - combines DPCM and quantum approaches
   */
  async query(
    request: MemoryQuery | string,
    operations?: LogicOperation[],
    context?: Partial<SystemContext>
  ): Promise<QuantumMemoryResult> {
    const startTime = Date.now();
    
    // Normalize request
    const memoryQuery = typeof request === 'string' 
      ? this.createMemoryQuery(request, operations)
      : request;
    
    // Update context
    this.updateContext(memoryQuery, context);
    
    let result: QuantumMemoryResult;
    
    // Determine query mode
    if (memoryQuery.type === 'precision' && memoryQuery.confidence > 0.8) {
      // High confidence precision query - use DPCM primarily
      result = await this.precisionQuery(memoryQuery, operations);
    } else if (memoryQuery.type === 'discovery' || memoryQuery.exploration > 0.5) {
      // Discovery mode - use full quantum approach
      result = await this.quantumQuery(memoryQuery);
    } else {
      // Hybrid approach - DPCM with quantum enhancement
      result = await this.hybridQuery(memoryQuery, operations);
    }
    
    // Apply learning
    await this.learningSystem.processInteraction(memoryQuery, result, this.systemContext);
    
    // Update performance metrics
    this.updatePerformanceMetrics(result, Date.now() - startTime);
    
    return result;
  }

  /**
   * Precision query using DPCM with minimal quantum enhancement
   */
  private async precisionQuery(
    query: MemoryQuery,
    operations?: LogicOperation[]
  ): Promise<QuantumMemoryResult> {
    const startTime = Date.now();
    
    // Use DPCM for deterministic retrieval
    const basePattern = query.harmonicSignature?.category || 'general';
    const dpcmOptions: DPCMQueryOptions = {
      radius: this.config.dpcm.defaultRadius,
      qualityThreshold: this.config.dpcm.qualityThreshold,
      maxResults: query.maxResults || 20
    };
    
    const dpcmResults = this.dpcmStore.query(basePattern, operations || [], dpcmOptions);
    
    // Convert to quantum nodes
    const quantumNodes = await this.convertToQuantumNodes(dpcmResults);
    
    // Create minimal field for coherence calculation
    const field = this.fieldGenerator.generateField(query, this.systemContext);
    field.radius = 0.1; // Narrow field for precision
    
    // Quick superposition for interference detection
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      quantumNodes
    );
    
    return {
      memories: quantumNodes.slice(0, query.maxResults || 10),
      emergentInsights: [], // Minimal emergence in precision mode
      interferencePatterns: quantumState.interferencePatterns.slice(0, 3),
      coherenceLevel: quantumState.coherenceLevel,
      fieldConfiguration: field,
      executionMetrics: {
        superpositionTime: 0,
        interferenceTime: Date.now() - startTime,
        collapseTime: 0,
        totalTime: Date.now() - startTime,
        memoriesProcessed: quantumNodes.length,
        emergentPatternsFound: 0
      }
    };
  }

  /**
   * Full quantum query with emergent discovery
   */
  private async quantumQuery(query: MemoryQuery): Promise<QuantumMemoryResult> {
    const metrics: ExecutionMetrics = {
      superpositionTime: 0,
      interferenceTime: 0,
      collapseTime: 0,
      totalTime: 0,
      memoriesProcessed: 0,
      emergentPatternsFound: 0
    };
    
    const startTime = Date.now();
    
    // Generate adaptive probability field
    const field = this.fieldGenerator.generateField(query, this.systemContext);
    
    // Apply field morphing for discovery
    if (query.exploration > 0.7) {
      const morphedField = this.fieldGenerator.morphField(field, 0.1);
      Object.assign(field, morphedField);
    }
    
    // Get all quantum memories in field range
    const relevantMemories = this.getMemoriesInField(field);
    metrics.memoriesProcessed = relevantMemories.length;
    
    // Create quantum superposition
    const superpositionStart = Date.now();
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      relevantMemories
    );
    metrics.superpositionTime = Date.now() - superpositionStart;
    
    // Detect emergent behaviors
    const interferenceStart = Date.now();
    const emergentBehaviors = await this.emergenceBehaviorEngine.detect(
      quantumState,
      this.systemContext
    );
    metrics.interferenceTime = Date.now() - interferenceStart;
    metrics.emergentPatternsFound = emergentBehaviors.insights.length;
    
    // Collapse to final memories
    const collapseStart = Date.now();
    const collapsedMemories = this.collapseQuantumState(
      quantumState,
      query.maxResults || 20
    );
    metrics.collapseTime = Date.now() - collapseStart;
    
    metrics.totalTime = Date.now() - startTime;
    
    return {
      memories: collapsedMemories,
      emergentInsights: emergentBehaviors.insights,
      interferencePatterns: quantumState.interferencePatterns,
      coherenceLevel: quantumState.coherenceLevel,
      fieldConfiguration: field,
      executionMetrics: metrics
    };
  }

  /**
   * Hybrid query combining DPCM and quantum approaches
   */
  private async hybridQuery(
    query: MemoryQuery,
    operations?: LogicOperation[]
  ): Promise<QuantumMemoryResult> {
    const startTime = Date.now();
    
    // Start with DPCM for initial candidates
    const basePattern = query.harmonicSignature?.category || 'general';
    const dpcmResults = this.dpcmStore.query(basePattern, operations || [], {
      radius: this.config.dpcm.defaultRadius * 1.5, // Wider initial search
      maxResults: 100 // Get more candidates
    });
    
    // Convert to quantum nodes
    const quantumNodes = await this.convertToQuantumNodes(dpcmResults);
    
    // Generate balanced field
    const field = this.fieldGenerator.generateField(query, this.systemContext);
    
    // Full quantum processing
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      quantumNodes
    );
    
    // Moderate emergence detection
    const emergentBehaviors = await this.emergenceBehaviorEngine.detect(
      quantumState,
      this.systemContext,
      { threshold: 0.5 } // Moderate threshold
    );
    
    // Collapse with quality filtering
    const collapsedMemories = this.collapseQuantumState(
      quantumState,
      query.maxResults || 15
    );
    
    return {
      memories: collapsedMemories,
      emergentInsights: emergentBehaviors.insights,
      interferencePatterns: quantumState.interferencePatterns,
      coherenceLevel: quantumState.coherenceLevel,
      fieldConfiguration: field,
      executionMetrics: {
        superpositionTime: 0,
        interferenceTime: 0,
        collapseTime: 0,
        totalTime: Date.now() - startTime,
        memoriesProcessed: quantumNodes.length,
        emergentPatternsFound: emergentBehaviors.insights.length
      }
    };
  }

  /**
   * Store a new memory in both DPCM and quantum systems
   */
  async store(memory: HarmonicPatternMemory): Promise<void> {
    // Store in DPCM
    this.dpcmStore.store(memory);
    
    // Convert and store as quantum node
    const quantumNode = await this.createQuantumNode(memory);
    this.quantumMemories.set(quantumNode.id, quantumNode);
    
    // Update learning system
    await this.learningSystem.integrateNewMemory(quantumNode);
  }

  /**
   * Bulk store memories
   */
  async bulkStore(memories: HarmonicPatternMemory[]): Promise<void> {
    // Bulk store in DPCM
    this.dpcmStore.bulkStore(memories);
    
    // Convert and store quantum nodes
    const quantumNodes = await Promise.all(
      memories.map(m => this.createQuantumNode(m))
    );
    
    quantumNodes.forEach(node => {
      this.quantumMemories.set(node.id, node);
    });
    
    // Batch learning update
    await this.learningSystem.batchIntegrate(quantumNodes);
  }

  /**
   * Find similar memories using quantum interference
   */
  async findSimilar(
    memoryId: string,
    options?: { minSimilarity?: number; maxResults?: number }
  ): Promise<QuantumMemoryNode[]> {
    const sourceMemory = this.quantumMemories.get(memoryId);
    if (!sourceMemory) return [];
    
    // Create focused field around source memory
    const query: MemoryQuery = {
      type: 'precision',
      harmonicSignature: sourceMemory.content.harmonicSignature,
      confidence: 0.9,
      exploration: 0.1
    };
    
    const field = this.fieldGenerator.generateField(query, this.systemContext);
    field.center = sourceMemory.coordinates;
    field.radius = 0.3;
    
    // Find through quantum superposition
    const relevantMemories = Array.from(this.quantumMemories.values())
      .filter(m => m.id !== memoryId);
    
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      relevantMemories
    );
    
    // Filter by similarity
    const minSim = options?.minSimilarity || 0.7;
    const similar = quantumState.superposition
      .filter(s => s.probability >= minSim)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, options?.maxResults || 10)
      .map(s => s.memory);
    
    return similar;
  }

  /**
   * Get pattern distribution using quantum analysis
   */
  async getPatternDistribution(): Promise<Map<string, number>> {
    const distribution = new Map<string, number>();
    
    // Analyze quantum memory distribution
    for (const memory of this.quantumMemories.values()) {
      const category = memory.content.harmonicSignature.category;
      distribution.set(category, (distribution.get(category) || 0) + 1);
    }
    
    return distribution;
  }

  /**
   * Trigger emergent discovery behaviors
   */
  async triggerEmergentDiscovery(
    type: 'dream' | 'flashback' | 'dejavu' | 'synthesis'
  ): Promise<EmergentInsight[]> {
    return this.emergenceBehaviorEngine.triggerBehavior(
      type,
      this.quantumMemories,
      this.systemContext
    );
  }

  // Private helper methods

  private mergeConfig(partial?: Partial<QPFMConfig>): QPFMConfig {
    const defaultConfig: QPFMConfig = {
      dpcm: {
        enabled: true,
        defaultRadius: 0.35,
        qualityThreshold: 0.6
      },
      quantum: {
        enabled: true,
        defaultFieldRadius: 0.5,
        minProbability: 0.01,
        interferenceThreshold: 0.5
      },
      emergent: {
        dreamState: {
          enabled: true,
          trigger: 'system_idle',
          frequency: 0.1
        },
        flashbackActivation: {
          enabled: true,
          threshold: 0.8,
          cascadeDepth: 3
        },
        dejaVuExploration: {
          enabled: true,
          uncertaintyThreshold: 0.4,
          expansionFactor: 1.5
        },
        creativeSynthesis: {
          enabled: true,
          minimumPatterns: 3,
          noveltyThreshold: 0.7
        }
      },
      learning: {
        hebbianStrengthening: {
          strengthenRate: 0.1,
          weakenRate: 0.01,
          associativeBonus: 0.05
        },
        confidenceEvolution: {
          successBonus: 0.1,
          failurePenalty: 0.2,
          uncertaintyDecay: 0.05
        },
        spatialAdaptation: {
          clusteringRate: 0.05,
          boundaryFlexibility: 0.2,
          dimensionalOptimization: true
        }
      },
      performance: {
        maxMemories: 100000,
        maxSuperpositionSize: 10000,
        cacheEnabled: true
      }
    };
    
    return { ...defaultConfig, ...partial };
  }

  private createMemoryQuery(
    pattern: string,
    operations?: LogicOperation[]
  ): MemoryQuery {
    // Infer query type from operations
    let type: 'precision' | 'discovery' | 'creative' = 'discovery';
    let confidence = 0.5;
    let exploration = 0.5;
    
    if (operations && operations.length > 0) {
      // More operations = more precision
      type = 'precision';
      confidence = Math.min(0.9, 0.5 + operations.length * 0.1);
      exploration = Math.max(0.1, 0.5 - operations.length * 0.1);
    }
    
    return {
      type,
      confidence,
      exploration,
      harmonicSignature: {
        category: pattern,
        strength: 0.5,
        complexity: 0.5
      }
    };
  }

  private async convertToQuantumNodes(
    patterns: HarmonicPatternMemory[]
  ): Promise<QuantumMemoryNode[]> {
    return Promise.all(patterns.map(p => this.createQuantumNode(p)));
  }

  private async createQuantumNode(
    pattern: HarmonicPatternMemory
  ): Promise<QuantumMemoryNode> {
    return {
      id: pattern.id,
      coordinates: pattern.coordinates || pattern.dpcmCoordinates || [0.5, 0.5, 0.5],
      content: {
        title: pattern.content.title,
        description: pattern.content.description,
        type: pattern.content.type,
        harmonicSignature: pattern.harmonicProperties,
        tags: pattern.content.tags,
        data: pattern.content.data
      },
      restingPotential: -0.7,
      threshold: -0.55,
      currentActivation: -0.7,
      accessHistory: [],
      confidenceScore: pattern.harmonicProperties.confidence,
      resonanceStrength: pattern.harmonicProperties.strength,
      lastEvolution: new Date()
    };
  }

  private getMemoriesInField(field: ProbabilityField): QuantumMemoryNode[] {
    const memories: QuantumMemoryNode[] = [];
    const maxDistance = field.radius * 1.5; // Include some margin
    
    for (const memory of this.quantumMemories.values()) {
      const distance = this.calculateDistance(memory.coordinates, field.center);
      if (distance <= maxDistance) {
        memories.push(memory);
      }
    }
    
    return memories;
  }

  private calculateDistance(
    coord1: [number, number, number],
    coord2: [number, number, number]
  ): number {
    const [dx, dy, dz] = [
      coord1[0] - coord2[0],
      coord1[1] - coord2[1],
      coord1[2] - coord2[2]
    ];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private collapseQuantumState(
    state: QuantumMemoryState,
    maxResults: number
  ): QuantumMemoryNode[] {
    // Use dominant states first
    const results = state.dominantStates
      .map(s => s.memory)
      .slice(0, maxResults);
    
    // Fill with high-probability states if needed
    if (results.length < maxResults) {
      const additional = state.superposition
        .filter(s => !results.includes(s.memory))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, maxResults - results.length)
        .map(s => s.memory);
      
      results.push(...additional);
    }
    
    return results;
  }

  private updateContext(query: MemoryQuery, context?: Partial<SystemContext>): void {
    // Add to recent queries
    this.systemContext.recentQueries.push(query);
    if (this.systemContext.recentQueries.length > 10) {
      this.systemContext.recentQueries.shift();
    }
    
    // Update active patterns
    if (query.harmonicSignature?.category) {
      const category = query.harmonicSignature.category as any;
      if (!this.systemContext.activePatterns.includes(category)) {
        this.systemContext.activePatterns.push(category);
      }
    }
    
    // Merge provided context
    if (context) {
      Object.assign(this.systemContext, context);
    }
  }

  private updatePerformanceMetrics(result: QuantumMemoryResult, responseTime: number): void {
    const metrics = this.systemContext.performanceMetrics;
    
    // Update average response time
    metrics.avgResponseTime = metrics.avgResponseTime * 0.9 + responseTime * 0.1;
    
    // Update hit rate (memories with high relevance)
    const relevantCount = result.memories.filter(m => m.confidenceScore > 0.7).length;
    const hitRate = result.memories.length > 0 ? relevantCount / result.memories.length : 0;
    metrics.hitRate = metrics.hitRate * 0.9 + hitRate * 0.1;
    
    // Update emergence frequency
    const hasEmergence = result.emergentInsights.length > 0;
    metrics.emergenceFrequency = metrics.emergenceFrequency * 0.95 + (hasEmergence ? 1 : 0) * 0.05;
  }

  // Public utility methods

  getConfig(): QPFMConfig {
    return { ...this.config };
  }

  getStats(): any {
    return {
      totalMemories: this.quantumMemories.size,
      dpcmStats: this.dpcmStore.getStats(),
      context: this.systemContext,
      learningStats: this.learningSystem.getStats()
    };
  }

  clearMemories(): void {
    this.dpcmStore.clear();
    this.quantumMemories.clear();
    this.learningSystem.reset();
  }
}