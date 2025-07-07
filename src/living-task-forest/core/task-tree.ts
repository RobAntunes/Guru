/**
 * Task Tree - Core biological unit of the Living Task Forest
 * Represents a single task with full lifecycle, evolution, and ecosystem relationships
 */

import { EventEmitter } from 'events';
import { 
  TaskGenetics, 
  TaskGeneticsFactory,
  TaskPurpose,
  TaskStrategy,
  ReproductionRule,
  ExtinctionRule
} from '../genetics/task-genetics.js';
import { Logger } from '../../logging/logger.js';

/**
 * Task lifecycle stages - like biological life stages
 */
export enum TaskLifecycle {
  SEED = 'seed',               // Just created, not yet active
  GERMINATING = 'germinating', // Beginning to understand scope
  SAPLING = 'sapling',         // Young, actively growing
  MATURE = 'mature',           // Fully developed, productive
  FLOWERING = 'flowering',     // Ready to reproduce
  DECLINING = 'declining',     // Past peak productivity
  DYING = 'dying',            // Preparing for extinction
  DEAD = 'dead'               // Extinct, kept for history
}

/**
 * Task species classification
 */
export enum TaskSpecies {
  REFACTOR = 'refactor_tree',
  FEATURE = 'feature_tree',
  BUGFIX = 'bugfix_tree',
  OPTIMIZATION = 'optimization_tree',
  SECURITY = 'security_tree',
  TESTING = 'testing_tree',
  DOCUMENTATION = 'documentation_tree',
  ANALYSIS = 'analysis_tree'
}

/**
 * Project insight that spawned this tree
 */
export interface ProjectInsight {
  id: string;
  type: string;
  discovery: string;
  evidence: any[];
  confidence: number;
  timestamp: number;
  source: string; // Which analyzer found this
}

/**
 * Core task representation
 */
export interface CoreTask {
  id: string;
  title: string;
  description: string;
  objective: string;
  approach: string;
  estimatedEffort: number; // Hours
  actualEffort: number;    // Hours spent so far
  progress: number;         // 0.0 to 1.0
}

/**
 * Subtask branching from main task
 */
export interface SubTask extends CoreTask {
  parentId: string;
  dependency?: string; // ID of task this depends on
  priority: number;    // Within this tree
}

/**
 * Micro task - leaf level work
 */
export interface MicroTask {
  id: string;
  action: string;      // Specific action to take
  target: string;      // File, function, etc.
  completed: boolean;
  result?: any;        // Result of action
  error?: string;      // If failed
}

/**
 * Connection to another tree
 */
export interface TreeConnection {
  treeId: string;
  type: 'depends_on' | 'provides_to' | 'conflicts_with' | 'collaborates_with';
  strength: number;    // How strong the connection is (0.0-1.0)
  data?: any;         // Connection-specific data
}

/**
 * Task dependency
 */
export interface TaskDependency {
  resourceType: 'data' | 'code' | 'knowledge' | 'completion';
  resourceId: string;
  required: boolean;   // Hard vs soft dependency
  status: 'available' | 'waiting' | 'blocked';
}

/**
 * Resource this task provides
 */
export interface TaskResource {
  resourceType: 'data' | 'code' | 'knowledge' | 'completion';
  resourceId: string;
  quality: number;     // Quality of resource (0.0-1.0)
  availability: 'immediate' | 'on_completion' | 'conditional';
}

/**
 * Task mutation record
 */
export interface TaskMutation {
  timestamp: number;
  type: string;
  before: any;
  after: any;
  reason: string;
  success: boolean;
}

/**
 * Evolution history entry
 */
export interface EvolutionHistory {
  generation: number;
  timestamp: number;
  event: string;
  fitness: number;
  mutations: TaskMutation[];
}

/**
 * Environmental factors affecting the task
 */
export interface TaskEnvironment {
  codebaseState: any;      // Current state of codebase
  resourceAvailability: Map<string, number>;
  activeTaskCount: number;
  forestHealth: number;
  timeOfDay: string;
  selectionPressure: any;
}

/**
 * Task Tree - A living, evolving task
 */
export class TaskTree extends EventEmitter {
  // Biological identity
  id: string;
  species: TaskSpecies;
  generation: number;
  age: number; // Milliseconds since creation
  
  // Tree structure
  root: ProjectInsight;
  trunk: CoreTask;
  branches: SubTask[] = [];
  leaves: MicroTask[] = [];
  
  // Biological properties
  dna: TaskGenetics;
  health: number = 1.0;
  energy: number = 1.0;
  growthRate: number = 0.1;
  
  // Ecosystem relationships
  connections: TreeConnection[] = [];
  dependencies: TaskDependency[] = [];
  provides: TaskResource[] = [];
  
  // Lifecycle management
  lifecycle: TaskLifecycle = TaskLifecycle.SEED;
  evolution: EvolutionHistory[] = [];
  
  // Internal state
  private logger = Logger.getInstance();
  private birthTime: number;
  private lastUpdateTime: number;
  private reproductionCooldown: number = 0;
  
  constructor(
    insight: ProjectInsight,
    dna?: TaskGenetics
  ) {
    super();
    
    this.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.birthTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    // Set root insight
    this.root = insight;
    
    // Create or use provided genetics
    this.dna = dna || TaskGeneticsFactory.createFromInsight(insight);
    
    // Determine species from genetics
    this.species = this.determineSpecies(this.dna.purpose.type);
    this.generation = this.dna.generation;
    
    // Create trunk task from insight
    this.trunk = this.createCoreTasк(insight);
    
    // Start lifecycle
    this.lifecycle = TaskLifecycle.GERMINATING;
    
    // Log birth
    this.logger.info(`🌱 Task tree ${this.id} (${this.species}) germinated from insight: ${insight.discovery}`);
    
    // Start lifecycle management
    this.startLifecycleManagement();
  }
  
  /**
   * Evolve the task based on environmental pressure
   */
  async evolve(pressure: any): Promise<TaskMutation> {
    const before = {
      dna: { ...this.dna },
      health: this.health,
      lifecycle: this.lifecycle
    };
    
    try {
      // Mutate DNA based on pressure
      this.dna = TaskGeneticsFactory.mutate(this.dna, pressure);
      
      // Adapt task structure based on new DNA
      await this.adaptStructure();
      
      // Update fitness
      this.updateFitness();
      
      // Record evolution
      const mutation: TaskMutation = {
        timestamp: Date.now(),
        type: pressure.type,
        before,
        after: {
          dna: { ...this.dna },
          health: this.health,
          lifecycle: this.lifecycle
        },
        reason: `Environmental pressure: ${pressure.type}`,
        success: true
      };
      
      this.evolution.push({
        generation: this.generation,
        timestamp: Date.now(),
        event: 'evolution',
        fitness: this.dna.currentFitness,
        mutations: [mutation]
      });
      
      this.emit('evolved', mutation);
      return mutation;
      
    } catch (error) {
      this.logger.error(`Evolution failed for task ${this.id}:`, error);
      return {
        timestamp: Date.now(),
        type: pressure.type,
        before,
        after: before,
        reason: `Evolution failed: ${error}`,
        success: false
      };
    }
  }
  
  /**
   * Attempt reproduction based on current state
   */
  async reproduce(opportunity: any): Promise<TaskTree[]> {
    if (this.lifecycle !== TaskLifecycle.FLOWERING || this.reproductionCooldown > 0) {
      return [];
    }
    
    const offspring: TaskTree[] = [];
    
    // Check reproduction triggers
    let canReproduce = false;
    let maxOffspring = 3;
    
    for (const trigger of this.dna.reproductionTriggers) {
      if (this.checkReproductionTrigger(trigger, opportunity)) {
        canReproduce = true;
        maxOffspring = trigger.maxOffspring;
        break;
      }
    }
    
    // Fallback: Allow reproduction if triggers array is empty and opportunity has high confidence
    if (!canReproduce && this.dna.reproductionTriggers.length === 0 && opportunity.confidence > 0.7) {
      canReproduce = true;
    }
    
    if (canReproduce) {
      const childCount = Math.min(
        maxOffspring,
        Math.max(1, Math.floor(this.energy * maxOffspring))
      );
      
      for (let i = 0; i < childCount; i++) {
        const childDna = TaskGeneticsFactory.reproduce(this.dna, undefined, 'mitosis');
        const childInsight = this.createChildInsight(opportunity, i);
        const child = new TaskTree(childInsight, childDna);
        
        // Establish parent-child connection
        child.connections.push({
          treeId: this.id,
          type: 'depends_on',
          strength: 0.8,
          data: { relationship: 'parent' }
        });
        
        offspring.push(child);
      }
      
      // Reproduction costs energy
      this.energy *= 0.7;
      this.reproductionCooldown = 3600000; // 1 hour cooldown
      
      this.emit('reproduced', { parent: this, offspring });
      this.logger.info(`🌿 Task ${this.id} reproduced ${offspring.length} offspring`);
    }
    
    return offspring;
  }
  
  /**
   * Assess fitness in current environment
   */
  assessFitness(environment: TaskEnvironment): number {
    let fitness = 0;
    
    // Base fitness from progress
    fitness += this.trunk.progress * 0.3;
    
    // Health and energy contribution
    fitness += (this.health * 0.2) + (this.energy * 0.1);
    
    // Lifecycle stage bonus
    const lifecycleBonus: Record<TaskLifecycle, number> = {
      [TaskLifecycle.SEED]: 0.1,
      [TaskLifecycle.GERMINATING]: 0.3,
      [TaskLifecycle.SAPLING]: 0.5,
      [TaskLifecycle.MATURE]: 1.0,
      [TaskLifecycle.FLOWERING]: 0.9,
      [TaskLifecycle.DECLINING]: 0.4,
      [TaskLifecycle.DYING]: 0.1,
      [TaskLifecycle.DEAD]: 0
    };
    fitness += lifecycleBonus[this.lifecycle] * 0.2;
    
    // Environmental adaptation
    const resourceFit = this.calculateResourceFitness(environment.resourceAvailability);
    fitness += resourceFit * 0.1;
    
    // Relationship quality
    const relationshipFit = this.calculateRelationshipFitness();
    fitness += relationshipFit * 0.1;
    
    // Update DNA fitness
    this.dna.currentFitness = Math.max(0, Math.min(1, fitness));
    this.dna.fitnessHistory.push(this.dna.currentFitness);
    
    return this.dna.currentFitness;
  }
  
  /**
   * Self-terminate when conditions are met
   */
  async selfTerminate(reason: string): Promise<void> {
    if (this.lifecycle === TaskLifecycle.DEAD) return;
    
    this.logger.info(`💀 Task ${this.id} self-terminating: ${reason}`);
    
    // Enter dying phase
    this.lifecycle = TaskLifecycle.DYING;
    this.emit('dying', { task: this, reason });
    
    // Clean up resources
    await this.cleanup();
    
    // Mark as dead
    this.lifecycle = TaskLifecycle.DEAD;
    this.health = 0;
    this.energy = 0;
    
    // Record death in evolution history
    this.evolution.push({
      generation: this.generation,
      timestamp: Date.now(),
      event: 'extinction',
      fitness: this.dna.currentFitness,
      mutations: []
    });
    
    this.emit('dead', { task: this, reason });
  }
  
  /**
   * Update task state based on time passage
   */
  update(deltaTime: number, environment: TaskEnvironment): void {
    // Update age
    this.age = Date.now() - this.birthTime;
    
    // Reduce reproduction cooldown
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaTime);
    
    // Update lifecycle
    this.updateLifecycle();
    
    // Check extinction triggers
    this.checkExtinctionTriggers();
    
    // Consume energy
    this.energy = Math.max(0, this.energy - (0.01 * deltaTime / 3600000)); // Lose 1% per hour
    
    // Health degrades if low energy
    if (this.energy < 0.2) {
      this.health = Math.max(0, this.health - (0.02 * deltaTime / 3600000));
    }
    
    // Update progress based on completed microtasks
    this.updateProgress();
    
    // Assess and update fitness
    this.assessFitness(environment);
    
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Process new information/discovery
   */
  async processDiscovery(discovery: any): Promise<any> {
    // Determine if this discovery is relevant
    const relevance = this.calculateRelevance(discovery);
    
    if (relevance > 0.5) {
      // High relevance - might trigger evolution or reproduction
      if (discovery.type === 'complexity' && this.lifecycle === TaskLifecycle.MATURE) {
        // Complexity discovery might trigger reproduction
        const opportunity = {
          type: 'complexity_discovered',
          discovery,
          relevance
        };
        await this.reproduce(opportunity);
      } else if (discovery.type === 'constraint') {
        // New constraint might trigger evolution
        await this.evolve({
          type: 'constraint_pressure',
          intensity: relevance,
          direction: discovery
        });
      }
      
      // Add to our knowledge
      this.branches.push({
        id: `branch_${Date.now()}`,
        parentId: this.trunk.id,
        title: `Handle ${discovery.type}`,
        description: discovery.description,
        objective: `Address discovered ${discovery.type}`,
        approach: 'adaptive',
        estimatedEffort: relevance * 10,
        actualEffort: 0,
        progress: 0,
        priority: relevance
      });
      
      this.emit('discovery_processed', { task: this, discovery, relevance });
    }
    
    return { processed: true, relevance, action: relevance > 0.5 ? 'branched' : 'ignored' };
  }
  
  /**
   * Get current task status
   */
  getStatus(): any {
    return {
      id: this.id,
      species: this.species,
      generation: this.generation,
      age: this.age,
      lifecycle: this.lifecycle,
      health: this.health,
      energy: this.energy,
      fitness: this.dna.currentFitness,
      progress: this.trunk.progress,
      branches: this.branches.length,
      leaves: this.leaves.length,
      connections: this.connections.length,
      completed: this.leaves.filter(l => l.completed).length,
      totalEffort: this.trunk.actualEffort + this.branches.reduce((sum, b) => sum + b.actualEffort, 0)
    };
  }
  
  // Private helper methods
  
  private determineSpecies(purpose: TaskPurpose): TaskSpecies {
    const speciesMap: Record<TaskPurpose, TaskSpecies> = {
      [TaskPurpose.REFACTOR]: TaskSpecies.REFACTOR,
      [TaskPurpose.CREATE]: TaskSpecies.FEATURE,
      [TaskPurpose.FIX]: TaskSpecies.BUGFIX,
      [TaskPurpose.OPTIMIZE]: TaskSpecies.OPTIMIZATION,
      [TaskPurpose.SECURE]: TaskSpecies.SECURITY,
      [TaskPurpose.TEST]: TaskSpecies.TESTING,
      [TaskPurpose.DOCUMENT]: TaskSpecies.DOCUMENTATION,
      [TaskPurpose.ANALYZE]: TaskSpecies.ANALYSIS,
      [TaskPurpose.IMPROVE]: TaskSpecies.REFACTOR
    };
    
    return speciesMap[purpose] || TaskSpecies.ANALYSIS;
  }
  
  private createCoreTasк(insight: ProjectInsight): CoreTask {
    return {
      id: `core_${this.id}`,
      title: `${this.dna.purpose.type} ${this.dna.purpose.target}`,
      description: insight.discovery,
      objective: this.dna.purpose.rationale,
      approach: this.dna.approach.strategy,
      estimatedEffort: this.estimateEffort(insight),
      actualEffort: 0,
      progress: 0
    };
  }
  
  private estimateEffort(insight: ProjectInsight): number {
    // Simple estimation based on confidence and complexity
    const baseEffort = 8; // Base 8 hours
    const complexityFactor = 1 / insight.confidence; // Lower confidence = more effort
    return Math.round(baseEffort * complexityFactor);
  }
  
  private async adaptStructure(): Promise<void> {
    // Adapt task structure based on DNA changes
    
    // Update approach
    this.trunk.approach = this.dna.approach.strategy;
    
    // Adjust estimated effort based on new risk tolerance
    this.trunk.estimatedEffort *= (2 - this.dna.approach.riskTolerance);
    
    // Update priorities of branches
    this.branches.forEach(branch => {
      branch.priority *= this.dna.approach.confidenceThreshold;
    });
  }
  
  private updateFitness(): void {
    // Fitness updated in assessFitness method
  }
  
  private checkReproductionTrigger(trigger: ReproductionRule, opportunity: any): boolean {
    switch (trigger.trigger) {
      case 'complexity_threshold':
        return this.branches.length > trigger.condition.threshold * 10;
        
      case 'opportunity_found':
        return opportunity.type === 'opportunity' && 
               opportunity.confidence > trigger.condition.minConfidence;
               
      case 'resource_available':
        return this.energy > 0.8 && this.health > 0.7;
        
      case 'pattern_match':
        return opportunity.pattern === trigger.condition.pattern;
        
      default:
        return false;
    }
  }
  
  private createChildInsight(opportunity: any, index: number): ProjectInsight {
    return {
      id: `insight_${Date.now()}_${index}`,
      type: opportunity.type,
      discovery: `Spawned from ${this.trunk.title}: ${opportunity.discovery || 'subdivision'}`,
      evidence: opportunity.evidence || [],
      confidence: opportunity.confidence || this.dna.approach.confidenceThreshold,
      timestamp: Date.now(),
      source: `parent_task_${this.id}`
    };
  }
  
  private updateLifecycle(): void {
    const age = this.age;
    const progress = this.trunk.progress;
    
    // Lifecycle progression based on age and progress
    if (this.lifecycle === TaskLifecycle.GERMINATING && progress > 0.1) {
      this.lifecycle = TaskLifecycle.SAPLING;
      this.emit('lifecycle_change', { from: TaskLifecycle.GERMINATING, to: TaskLifecycle.SAPLING });
    } else if (this.lifecycle === TaskLifecycle.SAPLING && progress > 0.5) {
      this.lifecycle = TaskLifecycle.MATURE;
      this.emit('lifecycle_change', { from: TaskLifecycle.SAPLING, to: TaskLifecycle.MATURE });
    } else if (this.lifecycle === TaskLifecycle.MATURE && progress > 0.8 && this.branches.length > 2) {
      this.lifecycle = TaskLifecycle.FLOWERING;
      this.emit('lifecycle_change', { from: TaskLifecycle.MATURE, to: TaskLifecycle.FLOWERING });
    } else if (this.health < 0.3 || this.energy < 0.1) {
      if (this.lifecycle !== TaskLifecycle.DECLINING && this.lifecycle !== TaskLifecycle.DYING) {
        this.lifecycle = TaskLifecycle.DECLINING;
        this.emit('lifecycle_change', { from: this.lifecycle, to: TaskLifecycle.DECLINING });
      }
    }
  }
  
  private checkExtinctionTriggers(): void {
    for (const trigger of this.dna.extinctionTriggers) {
      let shouldExtinct = false;
      
      switch (trigger.trigger) {
        case 'success':
          shouldExtinct = this.trunk.progress >= 1.0 && trigger.condition.metricComplete;
          break;
          
        case 'obsolescence':
          const daysSinceUpdate = (Date.now() - this.lastUpdateTime) / 86400000;
          shouldExtinct = daysSinceUpdate > trigger.condition.unusedDays;
          break;
          
        case 'failure':
          shouldExtinct = this.evolution.filter(e => e.event === 'failure').length > trigger.condition.consecutiveFailures;
          break;
          
        case 'resource_starvation':
          shouldExtinct = this.energy <= 0;
          break;
          
        case 'conflict':
          shouldExtinct = this.connections.filter(c => c.type === 'conflicts_with').length > 3;
          break;
      }
      
      if (shouldExtinct) {
        setTimeout(() => this.selfTerminate(trigger.trigger), trigger.gracePeriod);
        break;
      }
    }
  }
  
  private updateProgress(): void {
    // Update trunk progress based on completed leaves
    if (this.leaves.length > 0) {
      const completedLeaves = this.leaves.filter(l => l.completed).length;
      this.trunk.progress = completedLeaves / this.leaves.length;
    }
    
    // Update branch progress
    this.branches.forEach(branch => {
      const branchLeaves = this.leaves.filter(l => l.target.includes(branch.id));
      if (branchLeaves.length > 0) {
        const completed = branchLeaves.filter(l => l.completed).length;
        branch.progress = completed / branchLeaves.length;
      }
    });
  }
  
  private calculateResourceFitness(availability: Map<string, number>): number {
    let fitness = 0;
    let resourceCount = 0;
    
    for (const dep of this.dependencies) {
      const available = availability.get(dep.resourceId) || 0;
      fitness += available;
      resourceCount++;
    }
    
    return resourceCount > 0 ? fitness / resourceCount : 0.5;
  }
  
  private calculateRelationshipFitness(): number {
    if (this.connections.length === 0) return 0.5;
    
    let fitness = 0;
    for (const conn of this.connections) {
      switch (conn.type) {
        case 'collaborates_with':
          fitness += conn.strength;
          break;
        case 'provides_to':
          fitness += conn.strength * 0.8;
          break;
        case 'depends_on':
          fitness += conn.strength * 0.6;
          break;
        case 'conflicts_with':
          fitness -= conn.strength;
          break;
      }
    }
    
    return Math.max(0, Math.min(1, fitness / this.connections.length));
  }
  
  private calculateRelevance(discovery: any): number {
    // Simple relevance calculation
    let relevance = 0;
    
    // Check if discovery relates to our target
    if (discovery.target && this.dna.purpose.target.includes(discovery.target)) {
      relevance += 0.5;
    }
    
    // Check if discovery type matches our purpose
    if (discovery.type && discovery.type.includes(this.dna.purpose.type)) {
      relevance += 0.3;
    }
    
    // Confidence contribution
    relevance += (discovery.confidence || 0) * 0.2;
    
    return Math.min(1, relevance);
  }
  
  private async cleanup(): Promise<void> {
    // Release resources
    this.connections = [];
    this.dependencies = [];
    this.provides = [];
    
    // Clear event listeners
    this.removeAllListeners();
  }
  
  private startLifecycleManagement(): void {
    // Set up periodic lifecycle updates
    const updateInterval = setInterval(() => {
      if (this.lifecycle === TaskLifecycle.DEAD) {
        clearInterval(updateInterval);
        return;
      }
      
      this.update(60000, {} as TaskEnvironment); // Update every minute
    }, 60000);
  }
}

/**
 * Task Tree Factory for creating trees with specific characteristics
 */
export class TaskTreeFactory {
  static createRefactorTree(insight: ProjectInsight): TaskTree {
    const dna = TaskGeneticsFactory.createFromInsight(insight);
    dna.purpose.type = TaskPurpose.REFACTOR;
    dna.approach.strategy = TaskStrategy.INCREMENTAL;
    dna.approach.riskTolerance = 0.3;
    
    return new TaskTree(insight, dna);
  }
  
  static createFeatureTree(insight: ProjectInsight): TaskTree {
    const dna = TaskGeneticsFactory.createFromInsight(insight);
    dna.purpose.type = TaskPurpose.CREATE;
    dna.approach.strategy = TaskStrategy.COMPREHENSIVE;
    dna.approach.confidenceThreshold = 0.8;
    
    return new TaskTree(insight, dna);
  }
  
  static createBugfixTree(insight: ProjectInsight): TaskTree {
    const dna = TaskGeneticsFactory.createFromInsight(insight);
    dna.purpose.type = TaskPurpose.FIX;
    dna.approach.strategy = TaskStrategy.PROVEN;
    dna.approach.riskTolerance = 0.1;
    dna.purpose.priority = 0.9;
    
    return new TaskTree(insight, dna);
  }
}