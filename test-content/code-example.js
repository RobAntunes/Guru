/**
 * Task Prioritization System with Evolutionary Algorithms
 * Demonstrates complex patterns: recursion, async flow, state management
 */

class TaskOrganism {
  constructor(task, generation = 0) {
    this.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.task = task;
    this.generation = generation;
    this.fitness = 0;
    this.mutations = [];
    this.lifecycle = 'embryo'; // embryo -> active -> mature -> complete/dead
    this.energy = 100;
    this.offspring = [];
  }

  /**
   * Calculate fitness based on multiple factors
   * Higher fitness = better survival chance
   */
  calculateFitness(environment) {
    const priorityWeight = this.task.priority * 0.3;
    const deadlineWeight = this.getDeadlineUrgency() * 0.3;
    const dependencyWeight = this.getDependencyScore() * 0.2;
    const complexityWeight = (1 / this.task.complexity) * 0.2;
    
    this.fitness = priorityWeight + deadlineWeight + dependencyWeight + complexityWeight;
    return this.fitness;
  }

  getDeadlineUrgency() {
    if (!this.task.deadline) return 0.5;
    const daysUntilDeadline = (this.task.deadline - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(1, 1 - (daysUntilDeadline / 30)));
  }

  getDependencyScore() {
    if (!this.task.dependencies) return 1;
    const completedDeps = this.task.dependencies.filter(dep => dep.status === 'complete');
    return completedDeps.length / this.task.dependencies.length;
  }

  /**
   * Mutate task properties based on environmental pressure
   */
  mutate(mutationRate = 0.1) {
    if (Math.random() < mutationRate) {
      const mutations = ['priority', 'complexity', 'approach'];
      const selectedMutation = mutations[Math.floor(Math.random() * mutations.length)];
      
      switch(selectedMutation) {
        case 'priority':
          this.task.priority = Math.max(1, Math.min(10, this.task.priority + (Math.random() > 0.5 ? 1 : -1)));
          break;
        case 'complexity':
          this.task.complexity = Math.max(1, Math.min(10, this.task.complexity + (Math.random() > 0.5 ? 1 : -1)));
          break;
        case 'approach':
          this.task.approach = this.generateNewApproach();
          break;
      }
      
      this.mutations.push({
        type: selectedMutation,
        timestamp: Date.now(),
        generation: this.generation
      });
    }
  }

  generateNewApproach() {
    const approaches = ['iterative', 'recursive', 'parallel', 'sequential', 'divide-conquer'];
    return approaches[Math.floor(Math.random() * approaches.length)];
  }

  /**
   * Reproduce if fitness is high enough
   */
  reproduce(minFitness = 0.7) {
    if (this.fitness >= minFitness && this.energy > 50) {
      const childTask = {
        ...this.task,
        name: `${this.task.name} (Gen ${this.generation + 1})`,
        parentId: this.id
      };
      
      const child = new TaskOrganism(childTask, this.generation + 1);
      child.mutate(0.2); // Higher mutation rate for offspring
      this.offspring.push(child);
      this.energy -= 30; // Reproduction costs energy
      
      return child;
    }
    return null;
  }

  /**
   * Age the task through lifecycle stages
   */
  age(environment) {
    this.energy -= 5; // Base energy consumption
    
    switch(this.lifecycle) {
      case 'embryo':
        if (this.energy > 80) {
          this.lifecycle = 'active';
        }
        break;
        
      case 'active':
        // Active tasks consume more energy but can reproduce
        this.energy -= 10;
        if (this.energy < 30) {
          this.lifecycle = 'mature';
        }
        break;
        
      case 'mature':
        // Mature tasks are stable but less adaptive
        this.energy -= 2;
        if (this.energy <= 0 || this.task.progress >= 100) {
          this.lifecycle = 'complete';
        }
        break;
    }
    
    // Environmental effects
    if (environment.pressure > 0.5) {
      this.energy -= environment.pressure * 10;
    }
  }
}

/**
 * Ecosystem for task evolution
 */
class TaskEcosystem {
  constructor() {
    this.population = [];
    this.generation = 0;
    this.environment = {
      pressure: 0.3,
      resources: 100,
      temperature: 0.5 // Affects mutation rate
    };
    this.history = [];
  }

  /**
   * Add a new task to the ecosystem
   */
  addTask(taskData) {
    const organism = new TaskOrganism(taskData);
    this.population.push(organism);
    return organism;
  }

  /**
   * Run one generation of evolution
   */
  async evolve() {
    this.generation++;
    
    // Calculate fitness for all organisms
    this.population.forEach(org => org.calculateFitness(this.environment));
    
    // Sort by fitness
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    // Natural selection - remove bottom 20%
    const survivalCutoff = Math.floor(this.population.length * 0.8);
    const died = this.population.splice(survivalCutoff);
    
    // Reproduction phase
    const newOffspring = [];
    for (const organism of this.population) {
      if (organism.lifecycle === 'active') {
        const child = organism.reproduce();
        if (child) {
          newOffspring.push(child);
        }
      }
    }
    
    // Age all organisms
    this.population.forEach(org => org.age(this.environment));
    
    // Add offspring to population
    this.population.push(...newOffspring);
    
    // Environmental adaptation
    this.adaptEnvironment();
    
    // Record history
    this.history.push({
      generation: this.generation,
      population: this.population.length,
      avgFitness: this.calculateAverageFitness(),
      environment: {...this.environment},
      died: died.length,
      born: newOffspring.length
    });
    
    return {
      survived: this.population,
      died,
      born: newOffspring
    };
  }

  calculateAverageFitness() {
    if (this.population.length === 0) return 0;
    const totalFitness = this.population.reduce((sum, org) => sum + org.fitness, 0);
    return totalFitness / this.population.length;
  }

  /**
   * Adapt environment based on population
   */
  adaptEnvironment() {
    // Increase pressure if population is too large
    if (this.population.length > 50) {
      this.environment.pressure = Math.min(0.9, this.environment.pressure + 0.1);
    } else if (this.population.length < 10) {
      this.environment.pressure = Math.max(0.1, this.environment.pressure - 0.1);
    }
    
    // Temperature affects mutation rate
    this.environment.temperature = 0.5 + Math.sin(this.generation * 0.1) * 0.3;
  }

  /**
   * Get high-priority tasks based on evolution
   */
  getTopTasks(limit = 5) {
    return this.population
      .filter(org => org.lifecycle === 'active')
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, limit)
      .map(org => ({
        task: org.task,
        fitness: org.fitness,
        generation: org.generation,
        mutations: org.mutations.length
      }));
  }
}

// Example usage demonstrating complex async patterns
async function demonstrateEvolution() {
  const ecosystem = new TaskEcosystem();
  
  // Initial task population
  const initialTasks = [
    { name: 'Implement user authentication', priority: 9, complexity: 7, deadline: Date.now() + 7*24*60*60*1000 },
    { name: 'Design database schema', priority: 8, complexity: 6, deadline: Date.now() + 3*24*60*60*1000 },
    { name: 'Create API endpoints', priority: 7, complexity: 5, dependencies: [], deadline: Date.now() + 10*24*60*60*1000 },
    { name: 'Write unit tests', priority: 6, complexity: 4, deadline: Date.now() + 14*24*60*60*1000 },
    { name: 'Setup CI/CD pipeline', priority: 5, complexity: 8, deadline: Date.now() + 21*24*60*60*1000 }
  ];
  
  initialTasks.forEach(task => ecosystem.addTask(task));
  
  // Run evolution for 20 generations
  for (let i = 0; i < 20; i++) {
    const result = await ecosystem.evolve();
    
    if (i % 5 === 0) {
      console.log(`Generation ${i}:`);
      console.log(`  Population: ${ecosystem.population.length}`);
      console.log(`  Avg Fitness: ${ecosystem.calculateAverageFitness().toFixed(3)}`);
      console.log(`  Environment Pressure: ${ecosystem.environment.pressure.toFixed(2)}`);
      console.log('  Top Tasks:', ecosystem.getTopTasks(3).map(t => t.task.name));
      console.log('---');
    }
  }
  
  return ecosystem;
}

// Pattern demonstration: Higher-order functions and closures
const createTaskFilter = (criteria) => {
  return (ecosystem) => {
    return ecosystem.population.filter(organism => {
      return Object.entries(criteria).every(([key, value]) => {
        if (typeof value === 'function') {
          return value(organism.task[key]);
        }
        return organism.task[key] === value;
      });
    });
  };
};

// Recursive pattern finder
function findPatternInTasks(tasks, pattern, depth = 0, maxDepth = 5) {
  if (depth >= maxDepth) return [];
  
  const matches = [];
  
  for (const task of tasks) {
    if (pattern.test(task.name)) {
      matches.push({
        task,
        depth,
        pattern: pattern.source
      });
    }
    
    // Recursively check offspring
    if (task.offspring && task.offspring.length > 0) {
      const childMatches = findPatternInTasks(task.offspring, pattern, depth + 1, maxDepth);
      matches.push(...childMatches);
    }
  }
  
  return matches;
}

// Export for use in other modules
export { TaskOrganism, TaskEcosystem, createTaskFilter, findPatternInTasks, demonstrateEvolution };