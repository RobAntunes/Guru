/**
 * Task Forest - The living ecosystem of task trees
 * Manages the entire forest, environmental factors, and emergent behaviors
 */

import { EventEmitter } from 'events';
import { 
  TaskTree, 
  TaskLifecycle,
  TaskEnvironment,
  ProjectInsight,
  TreeConnection,
  TaskTreeFactory
} from '../core/task-tree.js';
import { Logger } from '../../logging/logger.js';

/**
 * Forest environment representing current conditions
 */
export interface ForestEnvironment {
  temperature: number;        // Activity level (0-100)
  humidity: number;          // Resource availability (0-100)
  sunlight: number;          // Goal clarity (0-100)
  nutrients: number;         // Knowledge/information richness (0-100)
  season: SeasonType;        // Current development phase
  weather: WeatherPattern;   // Current disruption level
}

/**
 * Seasonal cycles in development
 */
export enum SeasonType {
  SPRING = 'spring',         // New development cycle
  SUMMER = 'summer',         // Peak productivity
  AUTUMN = 'autumn',         // Consolidation phase
  WINTER = 'winter'          // Maintenance mode
}

/**
 * Weather patterns (disruptions)
 */
export enum WeatherPattern {
  SUNNY = 'sunny',           // Clear sailing
  CLOUDY = 'cloudy',         // Some uncertainty
  RAINY = 'rainy',          // Obstacles present
  STORMY = 'stormy',        // Major disruptions
  FOGGY = 'foggy'           // Unclear direction
}

/**
 * Environmental pressure types
 */
export interface EnvironmentalPressure {
  type: 'time' | 'quality' | 'resource' | 'innovation' | 'stability';
  intensity: number;         // 0.0 to 1.0
  direction?: any;          // Specific pressure details
  duration: number;         // How long pressure lasts (ms)
}

/**
 * Selection engine for natural selection
 */
export interface SelectionEngine {
  calculateFitness(tree: TaskTree, environment: ForestEnvironment): number;
  selectForSurvival(trees: TaskTree[], capacity: number): TaskTree[];
  identifyReproductionCandidates(trees: TaskTree[]): TaskTree[];
}

/**
 * Resource management in the forest
 */
export interface ResourceManager {
  totalResources: Map<string, number>;
  allocatedResources: Map<string, Map<string, number>>; // treeId -> resource -> amount
  
  allocate(treeId: string, resource: string, amount: number): boolean;
  release(treeId: string, resource: string, amount: number): void;
  getAvailable(resource: string): number;
}

/**
 * Inter-tree communication system
 */
export interface TreeCommunication {
  messages: CommunicationMessage[];
  channels: Map<string, CommunicationChannel>;
  
  broadcast(message: CommunicationMessage): void;
  send(from: string, to: string, message: any): void;
  subscribe(treeId: string, channel: string): void;
}

export interface CommunicationMessage {
  id: string;
  from: string;
  to?: string;              // Optional - broadcast if not specified
  channel: string;
  type: string;
  content: any;
  timestamp: number;
}

export interface CommunicationChannel {
  name: string;
  subscribers: Set<string>;
  messageHistory: CommunicationMessage[];
}

/**
 * Forest health metrics
 */
export interface ForestHealth {
  biodiversity: number;      // Variety of task types (0-1)
  stability: number;         // How stable the forest is (0-1)
  productivity: number;      // Rate of progress (0-1)
  sustainability: number;    // Long-term viability (0-1)
  overallHealth: number;     // Combined metric (0-1)
}

/**
 * Forest mutation affecting entire ecosystem
 */
export interface ForestMutation {
  type: string;
  timestamp: number;
  affectedTrees: string[];
  environmentBefore: ForestEnvironment;
  environmentAfter: ForestEnvironment;
  impact: string;
}

/**
 * Pending task waiting to sprout
 */
export interface PendingTask {
  insight: ProjectInsight;
  priority: number;
  attempts: number;
  lastAttempt: number;
  blockers: string[];
}

/**
 * Task Forest - The living ecosystem
 */
export class TaskForest extends EventEmitter {
  // Forest composition
  trees: Map<string, TaskTree> = new Map();
  deadTrees: Map<string, TaskTree> = new Map();
  seedlings: PendingTask[] = [];
  
  // Ecosystem properties
  biodiversity: number = 0;
  stability: number = 1;
  productivity: number = 0;
  sustainability: number = 1;
  
  // Environmental factors
  environment: ForestEnvironment;
  pressures: EnvironmentalPressure[] = [];
  
  // Forest management
  selectionEngine: DefaultSelectionEngine;
  resourceManager: DefaultResourceManager;
  communication: DefaultTreeCommunication;
  
  // Statistics
  private totalTreesCreated: number = 0;
  private totalTreesExtinct: number = 0;
  private totalReproductions: number = 0;
  private totalMutations: number = 0;
  
  // Internal
  private logger = Logger.getInstance();
  private updateInterval?: NodeJS.Timeout;
  private lastUpdateTime: number = Date.now();
  
  constructor() {
    super();
    
    // Initialize environment
    this.environment = {
      temperature: 70,      // Moderate activity
      humidity: 60,         // Good resources
      sunlight: 80,         // Clear goals
      nutrients: 50,        // Average information
      season: SeasonType.SPRING,
      weather: WeatherPattern.SUNNY
    };
    
    // Initialize subsystems
    this.selectionEngine = new DefaultSelectionEngine();
    this.resourceManager = new DefaultResourceManager();
    this.communication = new DefaultTreeCommunication();
    
    this.logger.info('🌲 Task Forest initialized');
    
    // Start forest lifecycle
    this.startForestLifecycle();
  }
  
  /**
   * Plant a new seed (create task from insight)
   */
  async plantSeed(insight: ProjectInsight): Promise<TaskTree | null> {
    try {
      // Check if we have capacity
      if (this.trees.size >= 10000) {
        this.logger.warn('Forest at capacity, adding to seedlings');
        this.seedlings.push({
          insight,
          priority: insight.confidence,
          attempts: 0,
          lastAttempt: Date.now(),
          blockers: ['forest_capacity']
        });
        return null;
      }
      
      // Create appropriate tree type based on insight
      let tree: TaskTree;
      if (insight.type.includes('refactor')) {
        tree = TaskTreeFactory.createRefactorTree(insight);
      } else if (insight.type.includes('bug')) {
        tree = TaskTreeFactory.createBugfixTree(insight);
      } else if (insight.type.includes('feature')) {
        tree = TaskTreeFactory.createFeatureTree(insight);
      } else {
        tree = new TaskTree(insight);
      }
      
      // Add to forest
      this.trees.set(tree.id, tree);
      this.totalTreesCreated++;
      
      // Set up tree event handlers
      this.setupTreeHandlers(tree);
      
      // Allocate initial resources
      this.resourceManager.allocate(tree.id, 'cpu', 10);
      this.resourceManager.allocate(tree.id, 'memory', 100);
      
      // Announce new tree
      this.communication.broadcast({
        id: `msg_${Date.now()}`,
        from: 'forest',
        channel: 'lifecycle',
        type: 'tree_planted',
        content: { treeId: tree.id, species: tree.species },
        timestamp: Date.now()
      });
      
      this.emit('tree_planted', tree);
      this.updateForestMetrics();
      
      return tree;
      
    } catch (error) {
      this.logger.error('Failed to plant seed:', error);
      return null;
    }
  }
  
  /**
   * Evolve the entire forest based on environmental pressure
   */
  async evolveForest(pressure: EnvironmentalPressure): Promise<ForestMutation> {
    const mutation: ForestMutation = {
      type: pressure.type,
      timestamp: Date.now(),
      affectedTrees: [],
      environmentBefore: { ...this.environment },
      environmentAfter: { ...this.environment },
      impact: ''
    };
    
    // Add pressure to active pressures
    this.pressures.push(pressure);
    
    // Adjust environment based on pressure
    this.adjustEnvironment(pressure);
    mutation.environmentAfter = { ...this.environment };
    
    // Apply pressure to all trees
    const evolutionPromises: Promise<any>[] = [];
    
    for (const [id, tree] of this.trees) {
      if (tree.lifecycle !== TaskLifecycle.DEAD) {
        evolutionPromises.push(
          tree.evolve(pressure).then(treeMutation => {
            if (treeMutation.success) {
              mutation.affectedTrees.push(id);
              this.totalMutations++;
            }
          })
        );
      }
    }
    
    await Promise.all(evolutionPromises);
    
    // Natural selection based on new fitness
    await this.applyNaturalSelection();
    
    mutation.impact = `${mutation.affectedTrees.length} trees evolved, ${this.totalTreesExtinct} extinct`;
    
    this.emit('forest_evolved', mutation);
    this.updateForestMetrics();
    
    return mutation;
  }
  
  /**
   * Prune dead trees from the forest
   */
  pruneDeadTrees(): { pruned: number; freed: any } {
    let pruned = 0;
    const freed = { cpu: 0, memory: 0 };
    
    for (const [id, tree] of this.trees) {
      if (tree.lifecycle === TaskLifecycle.DEAD) {
        // Move to dead trees archive
        this.deadTrees.set(id, tree);
        this.trees.delete(id);
        
        // Free resources
        const treeResources = this.resourceManager.allocatedResources.get(id);
        if (treeResources) {
          for (const [resource, amount] of treeResources) {
            this.resourceManager.release(id, resource, amount);
            freed[resource] = (freed[resource] || 0) + amount;
          }
        }
        
        pruned++;
      }
    }
    
    // Try to plant seedlings with freed resources
    this.plantSeedlings();
    
    this.logger.info(`🍂 Pruned ${pruned} dead trees, freed resources:`, freed);
    this.updateForestMetrics();
    
    return { pruned, freed };
  }
  
  /**
   * Assess overall forest health
   */
  assessForestHealth(): ForestHealth {
    // Calculate biodiversity (Shannon diversity index)
    const speciesCounts = new Map<string, number>();
    for (const tree of this.trees.values()) {
      const count = speciesCounts.get(tree.species) || 0;
      speciesCounts.set(tree.species, count + 1);
    }
    
    let shannonIndex = 0;
    const total = this.trees.size;
    for (const count of speciesCounts.values()) {
      if (count > 0) {
        const proportion = count / total;
        shannonIndex -= proportion * Math.log(proportion);
      }
    }
    this.biodiversity = Math.min(1, shannonIndex / Math.log(8)); // 8 species max
    
    // Calculate stability (inverse of change rate)
    const changeRate = this.totalMutations / Math.max(1, this.totalTreesCreated);
    this.stability = Math.max(0, 1 - changeRate);
    
    // Calculate productivity (completion rate)
    let totalProgress = 0;
    let activeTrees = 0;
    for (const tree of this.trees.values()) {
      if (tree.lifecycle !== TaskLifecycle.DEAD) {
        totalProgress += tree.trunk.progress;
        activeTrees++;
      }
    }
    this.productivity = activeTrees > 0 ? totalProgress / activeTrees : 0;
    
    // Calculate sustainability (resource usage vs availability)
    const resourceUsage = this.calculateResourceUsage();
    this.sustainability = Math.max(0, 1 - resourceUsage);
    
    // Overall health is weighted average
    const overallHealth = (
      this.biodiversity * 0.25 +
      this.stability * 0.25 +
      this.productivity * 0.25 +
      this.sustainability * 0.25
    );
    
    const health: ForestHealth = {
      biodiversity: this.biodiversity,
      stability: this.stability,
      productivity: this.productivity,
      sustainability: this.sustainability,
      overallHealth
    };
    
    this.emit('health_assessed', health);
    return health;
  }
  
  /**
   * Find trees by criteria
   */
  findTrees(criteria: {
    species?: string;
    lifecycle?: TaskLifecycle;
    minFitness?: number;
    maxAge?: number;
  }): TaskTree[] {
    const results: TaskTree[] = [];
    
    for (const tree of this.trees.values()) {
      let matches = true;
      
      if (criteria.species && tree.species !== criteria.species) matches = false;
      if (criteria.lifecycle && tree.lifecycle !== criteria.lifecycle) matches = false;
      if (criteria.minFitness && tree.dna.currentFitness < criteria.minFitness) matches = false;
      if (criteria.maxAge && tree.age > criteria.maxAge) matches = false;
      
      if (matches) results.push(tree);
    }
    
    return results;
  }
  
  /**
   * Get forest statistics
   */
  getStatistics() {
    const stats = {
      forest: {
        totalTrees: this.trees.size,
        activeTrees: Array.from(this.trees.values()).filter(t => t.lifecycle !== TaskLifecycle.DEAD).length,
        deadTrees: this.deadTrees.size,
        seedlings: this.seedlings.length,
        totalCreated: this.totalTreesCreated,
        totalExtinct: this.totalTreesExtinct,
        totalReproductions: this.totalReproductions,
        totalMutations: this.totalMutations
      },
      health: this.assessForestHealth(),
      environment: this.environment,
      resources: {
        cpu: {
          total: this.resourceManager.totalResources.get('cpu') || 0,
          available: this.resourceManager.getAvailable('cpu')
        },
        memory: {
          total: this.resourceManager.totalResources.get('memory') || 0,
          available: this.resourceManager.getAvailable('memory')
        }
      },
      species: this.getSpeciesDistribution(),
      lifecycle: this.getLifecycleDistribution()
    };
    
    return stats;
  }
  
  /**
   * Stop forest updates
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    
    this.logger.info('🛑 Task Forest stopped');
  }
  
  // Private methods
  
  private startForestLifecycle(): void {
    // Update forest every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateForest();
    }, 30000);
  }
  
  private updateForest(): void {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    
    // Update all trees
    const taskEnv: TaskEnvironment = {
      codebaseState: {},
      resourceAvailability: this.resourceManager.totalResources,
      activeTaskCount: this.trees.size,
      forestHealth: this.assessForestHealth().overallHealth,
      timeOfDay: new Date().toLocaleTimeString(),
      selectionPressure: this.pressures
    };
    
    for (const tree of this.trees.values()) {
      tree.update(deltaTime, taskEnv);
    }
    
    // Check for reproduction opportunities
    this.checkReproductionOpportunities();
    
    // Update environmental factors
    this.updateEnvironment();
    
    // Prune if needed
    if (Math.random() < 0.1) { // 10% chance each update
      this.pruneDeadTrees();
    }
    
    // Try to plant seedlings
    this.plantSeedlings();
    
    this.lastUpdateTime = now;
    this.emit('forest_updated', { deltaTime, treeCount: this.trees.size });
  }
  
  private setupTreeHandlers(tree: TaskTree): void {
    tree.on('evolved', (mutation) => {
      this.emit('tree_evolved', { tree, mutation });
    });
    
    tree.on('reproduced', async ({ parent, offspring }) => {
      this.totalReproductions++;
      
      // Add offspring to forest
      for (const child of offspring) {
        if (this.trees.size < 10000) {
          this.trees.set(child.id, child);
          this.setupTreeHandlers(child);
          this.totalTreesCreated++;
          
          // Allocate resources for child
          this.resourceManager.allocate(child.id, 'cpu', 5);
          this.resourceManager.allocate(child.id, 'memory', 50);
        }
      }
      
      this.emit('trees_reproduced', { parent, offspring });
    });
    
    tree.on('dying', ({ task, reason }) => {
      this.emit('tree_dying', { task, reason });
    });
    
    tree.on('dead', ({ task, reason }) => {
      this.totalTreesExtinct++;
      this.emit('tree_dead', { task, reason });
    });
  }
  
  private adjustEnvironment(pressure: EnvironmentalPressure): void {
    switch (pressure.type) {
      case 'time':
        this.environment.temperature = Math.min(100, this.environment.temperature + pressure.intensity * 20);
        this.environment.weather = WeatherPattern.STORMY;
        break;
        
      case 'quality':
        this.environment.sunlight = Math.min(100, this.environment.sunlight + pressure.intensity * 15);
        this.environment.nutrients = Math.min(100, this.environment.nutrients + pressure.intensity * 10);
        break;
        
      case 'resource':
        this.environment.humidity = Math.max(0, this.environment.humidity - pressure.intensity * 20);
        this.environment.weather = WeatherPattern.CLOUDY;
        break;
        
      case 'innovation':
        this.environment.temperature = Math.min(100, this.environment.temperature + pressure.intensity * 10);
        this.environment.nutrients = Math.min(100, this.environment.nutrients + pressure.intensity * 20);
        this.environment.weather = WeatherPattern.FOGGY;
        break;
        
      case 'stability':
        this.environment.temperature = Math.max(20, this.environment.temperature - pressure.intensity * 15);
        this.environment.weather = WeatherPattern.SUNNY;
        break;
    }
  }
  
  private async applyNaturalSelection(): Promise<void> {
    const trees = Array.from(this.trees.values());
    const capacity = Math.floor(this.environment.humidity / 10) * 100; // Resource-based capacity
    
    if (trees.length > capacity) {
      // Select trees for survival
      const survivors = this.selectionEngine.selectForSurvival(trees, capacity);
      const survivorIds = new Set(survivors.map(t => t.id));
      
      // Terminate non-survivors
      for (const tree of trees) {
        if (!survivorIds.has(tree.id)) {
          await tree.selfTerminate('natural_selection');
        }
      }
    }
  }
  
  private checkReproductionOpportunities(): void {
    const candidates = this.selectionEngine.identifyReproductionCandidates(
      Array.from(this.trees.values())
    );
    
    for (const tree of candidates) {
      // Check if we found any opportunities
      const opportunity = this.findOpportunityForTree(tree);
      if (opportunity) {
        tree.reproduce(opportunity);
      }
    }
  }
  
  private findOpportunityForTree(tree: TaskTree): any {
    // Look for complexity in related trees
    for (const conn of tree.connections) {
      if (conn.type === 'collaborates_with') {
        const related = this.trees.get(conn.treeId);
        if (related && related.branches.length > 5) {
          return {
            type: 'complexity_discovered',
            discovery: `Related task ${related.id} has high complexity`,
            confidence: 0.8
          };
        }
      }
    }
    
    // Random opportunity based on environment
    if (Math.random() < this.environment.nutrients / 200) {
      return {
        type: 'opportunity',
        discovery: 'Environmental conditions favorable',
        confidence: this.environment.sunlight / 100
      };
    }
    
    return null;
  }
  
  private updateEnvironment(): void {
    // Gradual environmental changes
    const target = {
      temperature: 70,
      humidity: 60,
      sunlight: 80,
      nutrients: 50
    };
    
    // Move towards target values
    const rate = 0.05;
    this.environment.temperature += (target.temperature - this.environment.temperature) * rate;
    this.environment.humidity += (target.humidity - this.environment.humidity) * rate;
    this.environment.sunlight += (target.sunlight - this.environment.sunlight) * rate;
    this.environment.nutrients += (target.nutrients - this.environment.nutrients) * rate;
    
    // Update season based on time
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      this.environment.season = SeasonType.SPRING;
    } else if (hour >= 12 && hour < 18) {
      this.environment.season = SeasonType.SUMMER;
    } else if (hour >= 18 && hour < 22) {
      this.environment.season = SeasonType.AUTUMN;
    } else {
      this.environment.season = SeasonType.WINTER;
    }
    
    // Clear weather if no active pressures
    if (this.pressures.length === 0) {
      this.environment.weather = WeatherPattern.SUNNY;
    }
    
    // Remove expired pressures
    this.pressures = this.pressures.filter(p => {
      return Date.now() - p.duration < p.duration;
    });
  }
  
  private plantSeedlings(): void {
    // Try to plant waiting seedlings
    const toPlant: PendingTask[] = [];
    
    for (const seedling of this.seedlings) {
      if (this.trees.size < 10000 && 
          Date.now() - seedling.lastAttempt > 60000) { // 1 minute cooldown
        toPlant.push(seedling);
      }
    }
    
    for (const seedling of toPlant) {
      this.plantSeed(seedling.insight);
      this.seedlings = this.seedlings.filter(s => s !== seedling);
    }
  }
  
  private updateForestMetrics(): void {
    // Metrics updated in assessForestHealth
  }
  
  private calculateResourceUsage(): number {
    let totalUsed = 0;
    let totalAvailable = 0;
    
    for (const [resource, total] of this.resourceManager.totalResources) {
      const available = this.resourceManager.getAvailable(resource);
      const used = total - available;
      totalUsed += used;
      totalAvailable += total;
    }
    
    return totalAvailable > 0 ? totalUsed / totalAvailable : 0;
  }
  
  private getSpeciesDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const tree of this.trees.values()) {
      distribution[tree.species] = (distribution[tree.species] || 0) + 1;
    }
    
    return distribution;
  }
  
  private getLifecycleDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const tree of this.trees.values()) {
      distribution[tree.lifecycle] = (distribution[tree.lifecycle] || 0) + 1;
    }
    
    return distribution;
  }
}

/**
 * Default implementation of selection engine
 */
class DefaultSelectionEngine implements SelectionEngine {
  calculateFitness(tree: TaskTree, environment: ForestEnvironment): number {
    // Use tree's own fitness calculation
    return tree.dna.currentFitness;
  }
  
  selectForSurvival(trees: TaskTree[], capacity: number): TaskTree[] {
    // Sort by fitness and select top performers
    const sorted = trees.sort((a, b) => b.dna.currentFitness - a.dna.currentFitness);
    return sorted.slice(0, capacity);
  }
  
  identifyReproductionCandidates(trees: TaskTree[]): TaskTree[] {
    return trees.filter(tree => 
      tree.lifecycle === TaskLifecycle.FLOWERING &&
      tree.health > 0.7 &&
      tree.energy > 0.5
    );
  }
}

/**
 * Default resource manager implementation
 */
class DefaultResourceManager implements ResourceManager {
  totalResources: Map<string, number> = new Map([
    ['cpu', 1000],
    ['memory', 10000],
    ['bandwidth', 1000]
  ]);
  
  allocatedResources: Map<string, Map<string, number>> = new Map();
  
  allocate(treeId: string, resource: string, amount: number): boolean {
    const available = this.getAvailable(resource);
    if (available >= amount) {
      if (!this.allocatedResources.has(treeId)) {
        this.allocatedResources.set(treeId, new Map());
      }
      
      const treeResources = this.allocatedResources.get(treeId)!;
      const current = treeResources.get(resource) || 0;
      treeResources.set(resource, current + amount);
      
      return true;
    }
    return false;
  }
  
  release(treeId: string, resource: string, amount: number): void {
    const treeResources = this.allocatedResources.get(treeId);
    if (treeResources) {
      const current = treeResources.get(resource) || 0;
      const newAmount = Math.max(0, current - amount);
      
      if (newAmount === 0) {
        treeResources.delete(resource);
        if (treeResources.size === 0) {
          this.allocatedResources.delete(treeId);
        }
      } else {
        treeResources.set(resource, newAmount);
      }
    }
  }
  
  getAvailable(resource: string): number {
    const total = this.totalResources.get(resource) || 0;
    let allocated = 0;
    
    for (const treeResources of this.allocatedResources.values()) {
      allocated += treeResources.get(resource) || 0;
    }
    
    return Math.max(0, total - allocated);
  }
}

/**
 * Default tree communication implementation
 */
class DefaultTreeCommunication implements TreeCommunication {
  messages: CommunicationMessage[] = [];
  channels: Map<string, CommunicationChannel> = new Map();
  
  constructor() {
    // Create default channels
    this.createChannel('lifecycle');
    this.createChannel('resources');
    this.createChannel('discoveries');
    this.createChannel('coordination');
  }
  
  broadcast(message: CommunicationMessage): void {
    this.messages.push(message);
    
    const channel = this.channels.get(message.channel);
    if (channel) {
      channel.messageHistory.push(message);
      
      // Emit to subscribers (would be implemented with actual event system)
      for (const subscriber of channel.subscribers) {
        // Notify subscriber
      }
    }
  }
  
  send(from: string, to: string, message: any): void {
    const msg: CommunicationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      channel: 'direct',
      type: 'direct_message',
      content: message,
      timestamp: Date.now()
    };
    
    this.messages.push(msg);
  }
  
  subscribe(treeId: string, channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribers.add(treeId);
    }
  }
  
  private createChannel(name: string): void {
    this.channels.set(name, {
      name,
      subscribers: new Set(),
      messageHistory: []
    });
  }
}