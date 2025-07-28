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
  ExecutionMetrics,
  HarmonicSignature
} from './quantum-types.js';
import { 
  HarmonicPatternMemory, 
  LogicOperation,
  QueryOptions as DPCMQueryOptions,
  PatternCategory 
} from './types.js';
import { DPCMPatternStore } from '../storage/dpcm-pattern-store.js';
import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';
import { QuantumFieldGenerator } from './quantum-field-generator.js';
import { QuantumSuperpositionEngine } from './quantum-superposition-engine.js';
import { EmergentBehaviorEngine } from './emergent-behavior-engine.js';
import { QuantumLearningSystem } from './quantum-learning-system.js';
import { EnhancedParameterHash } from './enhanced-parameter-hash.js';
import { QuantumThresholdManager, calculateAdaptiveThreshold } from './quantum-threshold-manager.js';

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
  private storageManager?: UnifiedStorageManager;
  private fieldGenerator: QuantumFieldGenerator;
  private superpositionEngine: QuantumSuperpositionEngine;
  private emergenceBehaviorEngine: EmergentBehaviorEngine;
  private learningSystem: QuantumLearningSystem;
  private hasher: EnhancedParameterHash;
  
  // Memory storage
  private quantumMemories: Map<string, QuantumMemoryNode> = new Map();
  private systemContext: SystemContext;
  
  // Configuration
  private config: QPFMConfig;
  
  constructor(config?: Partial<QPFMConfig>, storageManager?: UnifiedStorageManager) {
    this.config = this.mergeConfig(config);
    this.storageManager = storageManager;
    
    // Initialize engines
    // Use StorageManager's DPCM if available, otherwise create in-memory instance
    if (storageManager) {
      // StorageManager already has DPCM instance we can use
      this.dpcmStore = (storageManager as any).dpcm;
    } else {
      this.dpcmStore = new DPCMPatternStore();
    }
    
    this.fieldGenerator = new QuantumFieldGenerator();
    this.superpositionEngine = new QuantumSuperpositionEngine();
    this.emergenceBehaviorEngine = new EmergentBehaviorEngine(this.config.emergent);
    this.learningSystem = new QuantumLearningSystem(this.config.learning);
    this.hasher = new EnhancedParameterHash();
    
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
    const startTime = performance.now(); // High-resolution timing
    
    // Normalize request and capture pattern string
    const pattern = typeof request === 'string' ? request : undefined;
    const memoryQuery = typeof request === 'string' 
      ? this.createMemoryQuery(request, operations)
      : request;
    
    // Update context
    this.updateContext(memoryQuery, context);
    
    let result: QuantumMemoryResult;
    
    // Determine query mode using dynamic threshold
    const queryContext = {
      searchMode: memoryQuery.type as 'precision' | 'discovery' | 'creative' | 'balanced',
      queryComplexity: operations?.length || 0,
      historicalSuccess: this.systemContext.performanceMetrics.hitRate
    };
    const systemState = {
      coordinateSpaceDensity: this.quantumMemories.size / this.config.performance.maxMemories,
      memoryPressure: this.quantumMemories.size / this.config.performance.maxMemories,
      recentQueryPerformance: this.systemContext.performanceMetrics.avgResponseTime
    };
    
    const thresholdManager = new QuantumThresholdManager();
    const confidenceThreshold = thresholdManager.calculateDynamicThreshold(
      [memoryQuery.confidence], 
      queryContext, 
      systemState
    );
    const explorationThreshold = thresholdManager.calculateDynamicThreshold(
      [memoryQuery.exploration || 0], 
      { ...queryContext, searchMode: 'discovery' }, 
      systemState
    );
    
    if (memoryQuery.type === 'precision' && memoryQuery.confidence > confidenceThreshold) {
      // High confidence precision query - use DPCM primarily
      result = await this.precisionQuery(memoryQuery, operations, pattern);
    } else if (memoryQuery.type === 'discovery' || (memoryQuery.exploration || 0) > explorationThreshold) {
      // Discovery mode - use full quantum approach
      result = await this.quantumQuery(memoryQuery, pattern);
    } else {
      // Hybrid approach - DPCM with quantum enhancement
      result = await this.hybridQuery(memoryQuery, operations, pattern);
    }
    
    // Apply learning
    await this.learningSystem.processInteraction(memoryQuery, result, this.systemContext);
    
    // Update performance metrics with high-res timing
    const totalTime = Math.max(0.001, performance.now() - startTime); // Minimum 1μs
    this.updatePerformanceMetrics(result, totalTime);
    
    return result;
  }

  /**
   * Precision query using DPCM with minimal quantum enhancement
   */
  private async precisionQuery(
    query: MemoryQuery,
    operations?: LogicOperation[],
    pattern?: string
  ): Promise<QuantumMemoryResult> {
    const startTime = performance.now();
    
    // Use DPCM for deterministic retrieval
    const dpcmOptions: DPCMQueryOptions = {
      radius: this.config.dpcm.defaultRadius,
      qualityThreshold: this.config.dpcm.qualityThreshold,
      maxResults: query.maxResults || 20
    };
    
    // Use pattern if provided, otherwise try to extract from query
    let dpcmResults: HarmonicPatternMemory[];
    const basePattern = pattern || 'general';
    
    // If we have a pattern string, try to match it to a category
    if (pattern) {
      // Try to match the pattern string to a category enum value
      const categoryMatch = Object.values(PatternCategory).find(
        cat => cat.toLowerCase() === pattern.toLowerCase()
      );
      if (categoryMatch) {
        dpcmResults = this.dpcmStore.queryByCategory(categoryMatch as PatternCategory, dpcmOptions);
      } else {
        // Fall back to general query
        dpcmResults = this.dpcmStore.query(basePattern, operations || [], dpcmOptions);
      }
    } else if (query.harmonicSignature?.category) {
      dpcmResults = this.dpcmStore.queryByCategory(
        query.harmonicSignature.category as any, 
        dpcmOptions
      );
    } else {
      // Use general query with operations
      dpcmResults = this.dpcmStore.query(basePattern, operations || [], dpcmOptions);
    }
    
    // Convert to quantum nodes
    const quantumNodes = await this.convertToQuantumNodes(dpcmResults);
    
    // Create minimal field for coherence calculation
    const field = this.fieldGenerator.generateField(query, this.systemContext, pattern, operations);
    
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
        interferenceTime: Math.max(0.001, performance.now() - startTime),
        collapseTime: 0,
        totalTime: Math.max(0.001, performance.now() - startTime),
        memoriesProcessed: quantumNodes.length,
        emergentPatternsFound: 0
      }
    };
  }

  /**
   * Full quantum query with emergent discovery
   */
  private async quantumQuery(query: MemoryQuery, pattern?: string): Promise<QuantumMemoryResult> {
    const metrics: ExecutionMetrics = {
      superpositionTime: 0,
      interferenceTime: 0,
      collapseTime: 0,
      totalTime: 0,
      memoriesProcessed: 0,
      emergentPatternsFound: 0
    };
    
    const startTime = performance.now();
    
    // Generate adaptive probability field
    const field = this.fieldGenerator.generateField(query, this.systemContext, pattern);
    
    // Apply field morphing for discovery
    if (query.exploration > 0.7) {
      const morphedField = this.fieldGenerator.morphField(field, 0.1);
      Object.assign(field, morphedField);
    }
    
    // Get all quantum memories in field range
    const relevantMemories = this.getMemoriesInField(field);
    metrics.memoriesProcessed = relevantMemories.length;
    
    // Create quantum superposition
    const superpositionStart = performance.now();
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      relevantMemories
    );
    metrics.superpositionTime = Math.max(0.001, performance.now() - superpositionStart);
    
    // Detect emergent behaviors
    const interferenceStart = performance.now();
    const emergentBehaviors = await this.emergenceBehaviorEngine.detect(
      quantumState,
      this.systemContext
    );
    metrics.interferenceTime = Math.max(0.001, performance.now() - interferenceStart);
    metrics.emergentPatternsFound = emergentBehaviors.insights.length;
    
    // Collapse to final memories
    const collapseStart = performance.now();
    const collapsedMemories = this.collapseQuantumState(
      quantumState,
      query.maxResults || 20
    );
    metrics.collapseTime = Math.max(0.001, performance.now() - collapseStart);
    
    metrics.totalTime = Math.max(0.001, performance.now() - startTime);
    
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
    operations?: LogicOperation[],
    pattern?: string
  ): Promise<QuantumMemoryResult> {
    const startTime = performance.now();
    
    // Start with DPCM for initial candidates
    const basePattern = pattern || query.harmonicSignature?.category || 'general';
    const dpcmResults = this.dpcmStore.query(basePattern, operations || [], {
      radius: this.config.dpcm.defaultRadius * 1.5, // Wider initial search
      maxResults: 100 // Get more candidates
    });
    
    // Convert to quantum nodes
    const quantumNodes = await this.convertToQuantumNodes(dpcmResults);
    
    // Generate balanced field
    const field = this.fieldGenerator.generateField(query, this.systemContext, pattern, operations);
    
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
        totalTime: Math.max(0.001, performance.now() - startTime),
        memoriesProcessed: quantumNodes.length,
        emergentPatternsFound: emergentBehaviors.insights.length
      }
    };
  }

  /**
   * Store a new memory in both DPCM and quantum systems
   */
  async store(memory: HarmonicPatternMemory): Promise<void> {
    // If we have StorageManager, use full storage stack
    if (this.storageManager) {
      await this.storageManager.storePattern(memory);
    } else {
      // Otherwise just use in-memory DPCM
      this.dpcmStore.store(memory);
    }
    
    // Convert and store as quantum node
    const quantumNode = await this.createQuantumNode(memory);
    this.quantumMemories.set(quantumNode.id, quantumNode);
    
    // Update field generator's category statistics
    this.fieldGenerator.updateCategoryStats(
      memory.harmonicProperties.category,
      memory.harmonicProperties.strength,
      memory.harmonicProperties.complexity,
      memory.harmonicProperties.occurrences
    );
    
    // Update learning system
    await this.learningSystem.integrateNewMemory(quantumNode);
  }

  /**
   * Bulk store memories
   */
  async bulkStore(memories: HarmonicPatternMemory[]): Promise<void> {
    // If we have StorageManager, use full storage stack
    if (this.storageManager) {
      await this.storageManager.storePatterns(memories);
    } else {
      // Otherwise just use in-memory DPCM
      this.dpcmStore.bulkStore(memories);
    }
    
    // Convert and store quantum nodes
    const quantumNodes = await Promise.all(
      memories.map(m => this.createQuantumNode(m))
    );
    
    quantumNodes.forEach((node, index) => {
      this.quantumMemories.set(node.id, node);
      
      // Update field generator's category statistics
      const memory = memories[index];
      this.fieldGenerator.updateCategoryStats(
        memory.harmonicProperties.category,
        memory.harmonicProperties.strength,
        memory.harmonicProperties.complexity,
        memory.harmonicProperties.occurrences
      );
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
    field.radius = 0.5; // Larger radius for better similarity detection
    
    // Find through quantum superposition
    const relevantMemories = Array.from(this.quantumMemories.values())
      .filter(m => m.id !== memoryId);
    
    const quantumState = await this.superpositionEngine.createSuperposition(
      field,
      relevantMemories
    );
    
    // Filter by similarity using dynamic threshold
    const probabilities = quantumState.superposition.map(s => s.probability);
    const minSim = options?.minSimilarity || calculateAdaptiveThreshold(probabilities, 'permissive');
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
        defaultFieldRadius: 1.5,
        minProbability: 0.001, // Will be replaced dynamically
        interferenceThreshold: 0.5 // Will be replaced dynamically
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
    // Check if pattern matches a known category - if so, use precision
    const isKnownCategory = Object.values(PatternCategory).some(
      cat => cat.toLowerCase() === pattern.toLowerCase()
    );
    
    // Infer query type from operations and pattern
    let type: 'precision' | 'discovery' | 'creative' = isKnownCategory ? 'precision' : 'discovery';
    let confidence = isKnownCategory ? 0.85 : 0.5;
    let exploration = isKnownCategory ? 0.15 : 0.5;
    
    if (operations && operations.length > 0) {
      // More operations = more precision
      type = 'precision';
      confidence = Math.min(0.9, 0.5 + operations.length * 0.1);
      exploration = Math.max(0.1, 0.5 - operations.length * 0.1);
    }
    
    // Create harmonicSignature if pattern matches a category
    let harmonicSignature: HarmonicSignature | undefined;
    if (isKnownCategory) {
      const matchedCategory = Object.values(PatternCategory).find(
        cat => cat.toLowerCase() === pattern.toLowerCase()
      );
      if (matchedCategory) {
        harmonicSignature = {
          category: matchedCategory,
          strength: 0.8,
          complexity: 0.6,
          confidence: 0.9,
          occurrences: 1
        };
      }
    }
    
    return {
      type,
      confidence,
      exploration,
      harmonicSignature,
      maxResults: 20
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
    // CRITICAL FIX: Use DPCM-generated coordinates (pattern.coordinates should be updated by DPCM store)
    // If coordinates are still [0,0,0], regenerate them using DPCM
    let coordinates = pattern.coordinates;
    if (coordinates[0] === 0 && coordinates[1] === 0 && coordinates[2] === 0) {
      // Fallback: regenerate coordinates using DPCM algorithm
      coordinates = this.hasher.generateSemanticCoordinates(
        pattern.harmonicProperties.category,
        pattern.harmonicProperties.strength,
        pattern.harmonicProperties.complexity,
        pattern.harmonicProperties.occurrences
      );
    }
    
    // Calculate harmonic score for proper correlation
    const harmonicScore = this.calculatePatternHarmonicScore(pattern);
    
    return {
      id: pattern.id,
      coordinates,
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
      confidenceScore: pattern.harmonicProperties.confidence * harmonicScore, // Correlate confidence with harmonic score
      resonanceStrength: harmonicScore, // Use harmonic score for resonance
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
    // Add to recent queries with timestamp
    const timestampedQuery = {
      ...query,
      timestamp: Date.now()
    };
    this.systemContext.recentQueries.push(timestampedQuery);
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

  /**
   * Calculate harmonic score for a pattern to ensure correlation with quality
   */
  private calculatePatternHarmonicScore(pattern: HarmonicPatternMemory): number {
    const goldenRatio = 1.618033988749895;
    const props = pattern.harmonicProperties;
    
    // Base score on pattern strength (70% weight ensures correlation)
    let harmonicScore = props.strength * 0.7;
    
    // 1. Fibonacci proximity bonus (gradual, up to 10%)
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    const nearest = fibSequence.reduce((prev, curr) => 
      Math.abs(curr - props.occurrences) < Math.abs(prev - props.occurrences) ? curr : prev
    );
    const fibDistance = Math.abs(props.occurrences - nearest) / Math.max(1, nearest);
    const fibBonus = Math.max(0, 1 - fibDistance) * 0.1;
    
    // 2. Harmonic complexity alignment (up to 10%)
    const complexityFactor = 1 / (1 + Math.exp(-0.5 * (props.complexity - 5)));
    const complexityBonus = complexityFactor * 0.1;
    
    // 3. Golden ratio resonance (up to 10%)
    const goldenFactor = Math.abs(Math.cos(props.strength * Math.PI / goldenRatio));
    const goldenBonus = goldenFactor * 0.1;
    
    // Apply all bonuses
    harmonicScore += fibBonus + complexityBonus + goldenBonus;
    
    return Math.min(1, Math.max(0.1, harmonicScore));
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

  /**
   * Initialize from storage - load existing patterns
   */
  async initialize(): Promise<void> {
    if (!this.storageManager || !this.storageManager.isConnected()) {
      console.log('⚠️  No storage manager connected - running in-memory mode');
      return;
    }

    console.log('🔄 Loading quantum memories from storage...');
    
    // Query all patterns from storage
    const patterns = await this.storageManager.queryPatterns('*', [], {
      maxResults: this.config.performance.maxMemories
    });
    
    console.log(`📥 Found ${patterns.length} patterns in storage`);
    
    // Convert to quantum nodes and populate quantum memory
    for (const pattern of patterns) {
      const quantumNode = await this.createQuantumNode(pattern);
      this.quantumMemories.set(quantumNode.id, quantumNode);
    }
    
    console.log(`✅ Initialized ${this.quantumMemories.size} quantum memories`);
  }

  /**
   * Persist quantum learning state
   */
  async persistLearningState(): Promise<void> {
    if (!this.storageManager) return;
    
    // TODO: Store learning state in Neo4j or dedicated storage
    const learningState = this.learningSystem.getStats();
    console.log('💾 Persisting quantum learning state...', learningState);
  }

  /**
   * Check if connected to persistent storage
   */
  isConnected(): boolean {
    return this.storageManager?.isConnected() || false;
  }


  /**
   * Query similar patterns based on coordinates (DPCM-style interface)
   * This method is used by MCP Gateway
   */
  async querySimilar(params: {
    coordinates: number[];
    radius?: number;
    limit?: number;
  }): Promise<{
    results: HarmonicPatternMemory[];
    clusters?: any[];
  }> {
    // Convert coordinates to pattern base and operations
    const basePattern = params.coordinates.slice(0, 3).join(',');
    const operations: LogicOperation[] = [];
    
    // Use DPCM query with radius
    const results = await this.dpcmStore.query(basePattern, operations, {
      maxResults: params.limit || 20,
      // Additional filtering can be done here based on radius
    });
    
    // Filter by distance if needed
    const filteredResults = params.radius ? 
      results.filter(pattern => {
        // Simple distance calculation
        const patternCoords = [pattern.score, pattern.confidence, 0.5, 0.5, 0.5, 0.5];
        const distance = Math.sqrt(
          params.coordinates.reduce((sum, val, i) => 
            sum + Math.pow(val - (patternCoords[i] || 0.5), 2), 0
          )
        );
        return distance <= params.radius;
      }) : results;
    
    return {
      results: filteredResults,
      clusters: [] // Can be enhanced with actual clustering
    };
  }

  /**
   * Retrieve a specific pattern by ID
   * This method is used by pattern reconciliation and other systems
   */
  async retrieve(patternId: string): Promise<HarmonicPatternMemory | null> {
    // First check quantum memories
    const quantumNode = this.quantumMemories.get(patternId);
    if (quantumNode) {
      return quantumNode.content;
    }

    // If not in quantum memory, try DPCM store
    const patterns = await this.dpcmStore.query(patternId, [], { maxResults: 1 });
    if (patterns.length > 0 && patterns[0].id === patternId) {
      return patterns[0];
    }

    // If we have storage manager, try to retrieve from persistent storage
    if (this.storageManager && this.storageManager.isConnected()) {
      try {
        // Try to find in storage using pattern query
        const results = await this.storageManager.queryPatterns(patternId, [], { maxResults: 1 });
        if (results.length > 0 && results[0].id === patternId) {
          // Cache it in quantum memory for future access
          const quantumNode = await this.createQuantumNode(results[0]);
          this.quantumMemories.set(quantumNode.id, quantumNode);
          return results[0];
        }
      } catch (error) {
        console.warn(`Failed to retrieve pattern ${patternId} from storage:`, error);
      }
    }

    return null;
  }
}