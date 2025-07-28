/**
 * Task Genetics System
 * Defines the DNA structure for tasks in the Living Task Forest
 * Each task has genetic information that determines its behavior, evolution, and interactions
 */

import { z } from 'zod';

/**
 * Task purpose types - WHY a task exists
 */
export enum TaskPurpose {
  IMPROVE = 'improve',      // Enhance existing functionality
  FIX = 'fix',             // Repair broken functionality
  CREATE = 'create',       // Build new functionality
  ANALYZE = 'analyze',     // Understand existing code
  OPTIMIZE = 'optimize',   // Make code more efficient
  SECURE = 'secure',       // Improve security
  REFACTOR = 'refactor',   // Restructure code
  DOCUMENT = 'document',   // Add documentation
  TEST = 'test'           // Add or improve tests
}

/**
 * Task approach strategies - HOW a task works
 */
export enum TaskStrategy {
  INCREMENTAL = 'incremental',       // Small, safe changes
  COMPREHENSIVE = 'comprehensive',   // Large, thorough changes
  EXPERIMENTAL = 'experimental',     // Try new approaches
  PROVEN = 'proven'                 // Use established patterns
}

/**
 * Success metrics for measuring task completion
 */
export interface SuccessMetric {
  type: 'coverage' | 'performance' | 'quality' | 'completion' | 'user_satisfaction';
  target: number;                    // Target value (0.0-1.0 or absolute)
  current: number;                   // Current value
  unit?: string;                     // Optional unit (ms, %, etc)
}

/**
 * Purpose gene - defines WHY this task exists
 */
export interface PurposeGene {
  type: TaskPurpose;
  target: string;                    // What specifically to work on
  metric: SuccessMetric;             // How to measure completion
  priority: number;                  // Base priority (0.0-1.0)
  rationale: string;                 // Why this task is needed
}

/**
 * Approach gene - defines HOW to accomplish the task
 */
export interface ApproachGene {
  strategy: TaskStrategy;
  riskTolerance: number;             // 0.0 (safe) to 1.0 (experimental)
  confidenceThreshold: number;       // When to act vs. keep analyzing (0.0-1.0)
  parallelizability: number;         // How much can be done in parallel (0.0-1.0)
  learningRate: number;              // How quickly to adapt approach (0.0-1.0)
}

/**
 * Time constraints for tasks
 */
export interface TimeLimit {
  type: 'deadline' | 'duration' | 'effort';
  value: number;                     // Timestamp, milliseconds, or hours
  flexibility: number;               // How flexible the limit is (0.0-1.0)
}

/**
 * Resource constraints
 */
export interface ResourceLimit {
  type: 'memory' | 'cpu' | 'human_time' | 'budget';
  value: number;
  unit: string;
  shareable: boolean;                // Can this resource be shared?
}

/**
 * Technical constraints
 */
export interface TechnicalLimit {
  type: 'compatibility' | 'performance' | 'architecture' | 'dependency';
  description: string;
  severity: 'hard' | 'soft';         // Hard = must comply, Soft = should comply
}

/**
 * Business constraints
 */
export interface BusinessLimit {
  type: 'user_impact' | 'regulatory' | 'sla' | 'release_cycle';
  description: string;
  stakeholders: string[];            // Who cares about this constraint
}

/**
 * Constraint gene - defines WHAT limits exist
 */
export interface ConstraintGene {
  timeConstraints: TimeLimit[];
  resourceConstraints: ResourceLimit[];
  technicalConstraints: TechnicalLimit[];
  businessConstraints: BusinessLimit[];
  flexibility: number;               // Overall constraint flexibility (0.0-1.0)
}

/**
 * Code context information
 */
export interface CodeContext {
  files: string[];                   // Files this task affects
  symbols: string[];                 // Classes/functions involved
  patterns: string[];                // Architectural patterns involved
  dependencies: string[];            // External dependencies
}

/**
 * Architectural context
 */
export interface ArchitecturalContext {
  layer: 'presentation' | 'business' | 'data' | 'infrastructure';
  components: string[];              // Architectural components involved
  boundaries: string[];              // Service/module boundaries crossed
  impacts: string[];                 // Architectural impacts
}

/**
 * Team context
 */
export interface TeamContext {
  owners: string[];                  // Who owns affected code
  reviewers: string[];               // Who should review changes
  stakeholders: string[];            // Who is interested in outcome
  expertise: string[];               // Required expertise areas
}

/**
 * Environmental context
 */
export interface EnvironmentalContext {
  environments: ('development' | 'staging' | 'production')[];
  deploymentStrategy: 'immediate' | 'staged' | 'feature_flag' | 'canary';
  rollbackStrategy: 'automatic' | 'manual' | 'none';
  monitoringRequirements: string[]; // What to monitor during/after deployment
}

/**
 * Context gene - defines WHERE/WHEN this applies
 */
export interface ContextGene {
  codebaseContext: CodeContext;
  architecturalContext: ArchitecturalContext;
  teamContext: TeamContext;
  environmentalContext: EnvironmentalContext;
  temporalContext: {
    bestTimes: string[];             // When to work on this (cron expressions)
    avoidTimes: string[];            // When not to work on this
  };
}

/**
 * Reproduction rules - when to spawn offspring
 */
export interface ReproductionRule {
  trigger: 'complexity_threshold' | 'opportunity_found' | 'resource_available' | 'pattern_match';
  condition: any;                    // Specific condition data
  strategy: 'mitosis' | 'budding' | 'hybridization' | 'templating';
  maxOffspring: number;              // Maximum children to create
}

/**
 * Extinction rules - when to self-terminate
 */
export interface ExtinctionRule {
  trigger: 'success' | 'failure' | 'obsolescence' | 'resource_starvation' | 'conflict';
  condition: any;                    // Specific condition data
  gracePeriod: number;               // Time before extinction (ms)
}

/**
 * Adaptation rules - how to respond to changes
 */
export interface AdaptationRule {
  trigger: 'environment_change' | 'failure' | 'new_information' | 'resource_change';
  response: 'mutate_approach' | 'adjust_priority' | 'change_strategy' | 'hibernate';
  intensity: number;                 // How much to change (0.0-1.0)
}

/**
 * Complete Task Genetics - the DNA of a task
 */
export interface TaskGenetics {
  // Identity genome
  id: string;                        // Unique genetic ID
  generation: number;                // Which generation this is
  lineage: string[];                 // Parent task IDs
  
  // Core genes
  purpose: PurposeGene;              // WHY this task exists
  approach: ApproachGene;            // HOW to accomplish it
  constraints: ConstraintGene;       // WHAT limits exist
  context: ContextGene;              // WHERE/WHEN this applies
  
  // Evolution genome
  mutationRate: number;              // How easily this evolves (0.0-1.0)
  reproductionTriggers: ReproductionRule[];
  extinctionTriggers: ExtinctionRule[];
  adaptationRules: AdaptationRule[];
  
  // Inheritance genome
  dominantTraits: string[];          // Core characteristics that persist
  recessiveTraits: string[];         // Traits that might emerge later
  heritability: number;              // How much offspring inherit (0.0-1.0)
  
  // Fitness tracking
  fitnessHistory: number[];          // Historical fitness scores
  currentFitness: number;            // Current fitness (0.0-1.0)
  
  // Metadata
  createdAt: number;                 // When this genetics was created
  lastMutation: number;              // When last mutated
  mutations: string[];               // History of mutations applied
}

/**
 * Task Genetics Factory - creates and manipulates task DNA
 */
export class TaskGeneticsFactory {
  /**
   * Create genetics for a new task based on discovered insight
   */
  static createFromInsight(insight: {
    type: string;
    target: string;
    evidence: any[];
    confidence: number;
  }): TaskGenetics {
    const id = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Infer purpose from insight type
    const purpose = this.inferPurpose(insight);
    
    // Determine approach based on confidence and risk
    const approach = this.determineApproach(insight.confidence);
    
    // Extract constraints from context
    const constraints = this.extractConstraints(insight.evidence);
    
    // Build context from evidence
    const context = this.buildContext(insight.evidence);
    
    return {
      id,
      generation: 1,
      lineage: [],
      
      purpose,
      approach,
      constraints,
      context,
      
      // Evolution parameters (can be tuned)
      mutationRate: 0.1,
      reproductionTriggers: this.getDefaultReproductionTriggers(),
      extinctionTriggers: this.getDefaultExtinctionTriggers(),
      adaptationRules: this.getDefaultAdaptationRules(),
      
      // Inheritance
      dominantTraits: [purpose.type, approach.strategy],
      recessiveTraits: [],
      heritability: 0.8,
      
      // Fitness
      fitnessHistory: [],
      currentFitness: 0.5, // Start at neutral fitness
      
      // Metadata
      createdAt: Date.now(),
      lastMutation: Date.now(),
      mutations: []
    };
  }
  
  /**
   * Create offspring genetics through reproduction
   */
  static reproduce(
    parent1: TaskGenetics,
    parent2?: TaskGenetics,
    strategy: 'mitosis' | 'hybridization' = 'mitosis'
  ): TaskGenetics {
    const id = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (strategy === 'mitosis') {
      // Simple reproduction - mostly inherit from parent
      return {
        ...parent1,
        id,
        generation: parent1.generation + 1,
        lineage: [...parent1.lineage, parent1.id],
        
        // Slight mutations
        approach: {
          ...parent1.approach,
          confidenceThreshold: this.mutateValue(parent1.approach.confidenceThreshold, 0.05),
          learningRate: this.mutateValue(parent1.approach.learningRate, 0.05)
        },
        
        // Reset fitness for new task
        fitnessHistory: [],
        currentFitness: parent1.currentFitness * 0.8, // Inherit some parent fitness
        
        // Update metadata
        createdAt: Date.now(),
        lastMutation: Date.now(),
        mutations: [`mitosis_from_${parent1.id}`]
      };
    } else if (strategy === 'hybridization' && parent2) {
      // Cross-pollination - combine traits from both parents
      return {
        id,
        generation: Math.max(parent1.generation, parent2.generation) + 1,
        lineage: [...parent1.lineage, parent1.id, parent2.id],
        
        // Mix genes based on dominance
        purpose: this.selectDominantGene(parent1.purpose, parent2.purpose, parent1.dominantTraits),
        approach: this.combineApproaches(parent1.approach, parent2.approach),
        constraints: this.mergeConstraints(parent1.constraints, parent2.constraints),
        context: this.mergeContexts(parent1.context, parent2.context),
        
        // Average evolution parameters
        mutationRate: (parent1.mutationRate + parent2.mutationRate) / 2,
        reproductionTriggers: [...parent1.reproductionTriggers, ...parent2.reproductionTriggers],
        extinctionTriggers: [...parent1.extinctionTriggers, ...parent2.extinctionTriggers],
        adaptationRules: [...parent1.adaptationRules, ...parent2.adaptationRules],
        
        // Combine traits
        dominantTraits: Array.from(new Set([...parent1.dominantTraits, ...parent2.dominantTraits])),
        recessiveTraits: Array.from(new Set([...parent1.recessiveTraits, ...parent2.recessiveTraits])),
        heritability: (parent1.heritability + parent2.heritability) / 2,
        
        // Average parent fitness
        fitnessHistory: [],
        currentFitness: (parent1.currentFitness + parent2.currentFitness) / 2,
        
        // Metadata
        createdAt: Date.now(),
        lastMutation: Date.now(),
        mutations: [`hybrid_of_${parent1.id}_and_${parent2.id}`]
      };
    }
    
    throw new Error(`Unknown reproduction strategy: ${strategy}`);
  }
  
  /**
   * Mutate genetics based on environmental pressure
   */
  static mutate(
    genetics: TaskGenetics,
    pressure: {
      type: string;
      intensity: number;
      direction?: any;
    }
  ): TaskGenetics {
    const mutated = { ...genetics };
    const mutationIntensity = genetics.mutationRate * pressure.intensity;
    
    // Record mutation
    mutated.mutations.push(`${pressure.type}_mutation_${Date.now()}`);
    mutated.lastMutation = Date.now();
    
    // Apply mutations based on pressure type
    switch (pressure.type) {
      case 'time_pressure':
        // Increase risk tolerance and reduce confidence threshold
        mutated.approach.riskTolerance = Math.min(1, mutated.approach.riskTolerance + mutationIntensity);
        mutated.approach.confidenceThreshold = Math.max(0, mutated.approach.confidenceThreshold - mutationIntensity);
        break;
        
      case 'quality_pressure':
        // Decrease risk tolerance and increase confidence threshold
        mutated.approach.riskTolerance = Math.max(0, mutated.approach.riskTolerance - mutationIntensity);
        mutated.approach.confidenceThreshold = Math.min(1, mutated.approach.confidenceThreshold + mutationIntensity);
        break;
        
      case 'resource_pressure':
        // Increase parallelizability and efficiency focus
        mutated.approach.parallelizability = Math.min(1, mutated.approach.parallelizability + mutationIntensity);
        mutated.constraints.flexibility = Math.min(1, mutated.constraints.flexibility + mutationIntensity);
        break;
        
      case 'failure_pressure':
        // Change strategy and increase learning rate
        mutated.approach.learningRate = Math.min(1, mutated.approach.learningRate + mutationIntensity * 2);
        if (Math.random() < mutationIntensity) {
          // Randomly switch strategy
          const strategies = Object.values(TaskStrategy);
          mutated.approach.strategy = strategies[Math.floor(Math.random() * strategies.length)];
        }
        break;
    }
    
    return mutated;
  }
  
  // Helper methods
  
  private static inferPurpose(insight: any): PurposeGene {
    // Simple inference logic - would be more sophisticated in practice
    const typeMap: Record<string, TaskPurpose> = {
      'code_smell': TaskPurpose.REFACTOR,
      'bug': TaskPurpose.FIX,
      'performance_issue': TaskPurpose.OPTIMIZE,
      'security_vulnerability': TaskPurpose.SECURE,
      'missing_feature': TaskPurpose.CREATE,
      'complex_code': TaskPurpose.REFACTOR,
      'missing_tests': TaskPurpose.TEST,
      'missing_docs': TaskPurpose.DOCUMENT
    };
    
    return {
      type: typeMap[insight.type] || TaskPurpose.ANALYZE,
      target: insight.target,
      metric: {
        type: 'completion',
        target: 1.0,
        current: 0.0
      },
      priority: insight.confidence * 0.8,
      rationale: `Discovered ${insight.type} in ${insight.target}`
    };
  }
  
  private static determineApproach(confidence: number): ApproachGene {
    return {
      strategy: confidence > 0.8 ? TaskStrategy.PROVEN : TaskStrategy.EXPERIMENTAL,
      riskTolerance: 1 - confidence,
      confidenceThreshold: Math.max(0.7, confidence),
      parallelizability: 0.5,
      learningRate: 0.2
    };
  }
  
  private static extractConstraints(evidence: any[]): ConstraintGene {
    // Extract constraints from evidence - simplified
    return {
      timeConstraints: [],
      resourceConstraints: [],
      technicalConstraints: [],
      businessConstraints: [],
      flexibility: 0.5
    };
  }
  
  private static buildContext(evidence: any[]): ContextGene {
    // Build context from evidence - simplified
    return {
      codebaseContext: {
        files: [],
        symbols: [],
        patterns: [],
        dependencies: []
      },
      architecturalContext: {
        layer: 'business',
        components: [],
        boundaries: [],
        impacts: []
      },
      teamContext: {
        owners: [],
        reviewers: [],
        stakeholders: [],
        expertise: []
      },
      environmentalContext: {
        environments: ['development'],
        deploymentStrategy: 'immediate',
        rollbackStrategy: 'automatic',
        monitoringRequirements: []
      },
      temporalContext: {
        bestTimes: [],
        avoidTimes: []
      }
    };
  }
  
  private static getDefaultReproductionTriggers(): ReproductionRule[] {
    return [
      {
        trigger: 'complexity_threshold',
        condition: { threshold: 0.8 },
        strategy: 'mitosis',
        maxOffspring: 3
      },
      {
        trigger: 'opportunity_found',
        condition: { minConfidence: 0.7 },
        strategy: 'budding',
        maxOffspring: 1
      }
    ];
  }
  
  private static getDefaultExtinctionTriggers(): ExtinctionRule[] {
    return [
      {
        trigger: 'success',
        condition: { metricComplete: true },
        gracePeriod: 0
      },
      {
        trigger: 'obsolescence',
        condition: { unusedDays: 7 },
        gracePeriod: 86400000 // 1 day
      },
      {
        trigger: 'failure',
        condition: { consecutiveFailures: 5 },
        gracePeriod: 3600000 // 1 hour
      }
    ];
  }
  
  private static getDefaultAdaptationRules(): AdaptationRule[] {
    return [
      {
        trigger: 'failure',
        response: 'mutate_approach',
        intensity: 0.2
      },
      {
        trigger: 'environment_change',
        response: 'adjust_priority',
        intensity: 0.1
      },
      {
        trigger: 'resource_change',
        response: 'change_strategy',
        intensity: 0.15
      }
    ];
  }
  
  private static mutateValue(value: number, intensity: number): number {
    const change = (Math.random() - 0.5) * 2 * intensity;
    return Math.max(0, Math.min(1, value + change));
  }
  
  private static selectDominantGene<T>(gene1: T, gene2: T, dominantTraits: string[]): T {
    // Simplified dominance selection
    return Math.random() > 0.5 ? gene1 : gene2;
  }
  
  private static combineApproaches(a1: ApproachGene, a2: ApproachGene): ApproachGene {
    return {
      strategy: Math.random() > 0.5 ? a1.strategy : a2.strategy,
      riskTolerance: (a1.riskTolerance + a2.riskTolerance) / 2,
      confidenceThreshold: (a1.confidenceThreshold + a2.confidenceThreshold) / 2,
      parallelizability: (a1.parallelizability + a2.parallelizability) / 2,
      learningRate: (a1.learningRate + a2.learningRate) / 2
    };
  }
  
  private static mergeConstraints(c1: ConstraintGene, c2: ConstraintGene): ConstraintGene {
    return {
      timeConstraints: [...c1.timeConstraints, ...c2.timeConstraints],
      resourceConstraints: [...c1.resourceConstraints, ...c2.resourceConstraints],
      technicalConstraints: [...c1.technicalConstraints, ...c2.technicalConstraints],
      businessConstraints: [...c1.businessConstraints, ...c2.businessConstraints],
      flexibility: (c1.flexibility + c2.flexibility) / 2
    };
  }
  
  private static mergeContexts(ctx1: ContextGene, ctx2: ContextGene): ContextGene {
    return {
      codebaseContext: {
        files: Array.from(new Set([...ctx1.codebaseContext.files, ...ctx2.codebaseContext.files])),
        symbols: Array.from(new Set([...ctx1.codebaseContext.symbols, ...ctx2.codebaseContext.symbols])),
        patterns: Array.from(new Set([...ctx1.codebaseContext.patterns, ...ctx2.codebaseContext.patterns])),
        dependencies: Array.from(new Set([...ctx1.codebaseContext.dependencies, ...ctx2.codebaseContext.dependencies]))
      },
      architecturalContext: {
        layer: ctx1.architecturalContext.layer, // Take first parent's layer
        components: Array.from(new Set([...ctx1.architecturalContext.components, ...ctx2.architecturalContext.components])),
        boundaries: Array.from(new Set([...ctx1.architecturalContext.boundaries, ...ctx2.architecturalContext.boundaries])),
        impacts: Array.from(new Set([...ctx1.architecturalContext.impacts, ...ctx2.architecturalContext.impacts]))
      },
      teamContext: {
        owners: Array.from(new Set([...ctx1.teamContext.owners, ...ctx2.teamContext.owners])),
        reviewers: Array.from(new Set([...ctx1.teamContext.reviewers, ...ctx2.teamContext.reviewers])),
        stakeholders: Array.from(new Set([...ctx1.teamContext.stakeholders, ...ctx2.teamContext.stakeholders])),
        expertise: Array.from(new Set([...ctx1.teamContext.expertise, ...ctx2.teamContext.expertise]))
      },
      environmentalContext: {
        environments: Array.from(new Set([...ctx1.environmentalContext.environments, ...ctx2.environmentalContext.environments])) as any,
        deploymentStrategy: ctx1.environmentalContext.deploymentStrategy,
        rollbackStrategy: ctx1.environmentalContext.rollbackStrategy,
        monitoringRequirements: Array.from(new Set([...ctx1.environmentalContext.monitoringRequirements, ...ctx2.environmentalContext.monitoringRequirements]))
      },
      temporalContext: {
        bestTimes: Array.from(new Set([...ctx1.temporalContext.bestTimes, ...ctx2.temporalContext.bestTimes])),
        avoidTimes: Array.from(new Set([...ctx1.temporalContext.avoidTimes, ...ctx2.temporalContext.avoidTimes]))
      }
    };
  }
}

/**
 * Zod schemas for validation
 */
export const TaskGeneticsSchema = z.object({
  id: z.string(),
  generation: z.number(),
  lineage: z.array(z.string()),
  purpose: z.object({
    type: z.nativeEnum(TaskPurpose),
    target: z.string(),
    metric: z.object({
      type: z.enum(['coverage', 'performance', 'quality', 'completion', 'user_satisfaction']),
      target: z.number(),
      current: z.number(),
      unit: z.string().optional()
    }),
    priority: z.number().min(0).max(1),
    rationale: z.string()
  }),
  approach: z.object({
    strategy: z.nativeEnum(TaskStrategy),
    riskTolerance: z.number().min(0).max(1),
    confidenceThreshold: z.number().min(0).max(1),
    parallelizability: z.number().min(0).max(1),
    learningRate: z.number().min(0).max(1)
  }),
  constraints: z.object({
    timeConstraints: z.array(z.any()),
    resourceConstraints: z.array(z.any()),
    technicalConstraints: z.array(z.any()),
    businessConstraints: z.array(z.any()),
    flexibility: z.number().min(0).max(1)
  }),
  context: z.object({
    codebaseContext: z.any(),
    architecturalContext: z.any(),
    teamContext: z.any(),
    environmentalContext: z.any(),
    temporalContext: z.any()
  }),
  mutationRate: z.number().min(0).max(1),
  reproductionTriggers: z.array(z.any()),
  extinctionTriggers: z.array(z.any()),
  adaptationRules: z.array(z.any()),
  dominantTraits: z.array(z.string()),
  recessiveTraits: z.array(z.string()),
  heritability: z.number().min(0).max(1),
  fitnessHistory: z.array(z.number()),
  currentFitness: z.number().min(0).max(1),
  createdAt: z.number(),
  lastMutation: z.number(),
  mutations: z.array(z.string())
});