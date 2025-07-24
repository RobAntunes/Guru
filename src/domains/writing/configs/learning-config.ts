import { BaseConfig } from '../../../core/base-config';

export interface WritingStrategy {
  id: string;
  name: string;
  type: 'planning' | 'discovery' | 'hybrid' | 'iterative' | 'structured';
  techniques: WritingTechnique[];
  performance: StrategyPerformance;
  contexts: ContextualFitness[];
}

export interface WritingTechnique {
  name: string;
  category: 'prewriting' | 'drafting' | 'revision' | 'editing';
  effectiveness: number;
  timeInvestment: number;
  skillRequired: number;
  apply: (context: WritingContext) => TechniqueResult;
}

export interface TechniqueResult {
  wordCount: number;
  quality: number;
  timeSpent: number;
  energyCost: number;
  insights: string[];
}

export interface StrategyPerformance {
  totalWords: number;
  avgQuality: number;
  completionRate: number;
  avgTimePerWord: number;
  successfulProjects: number;
  abandonedProjects: number;
}

export interface ContextualFitness {
  context: WritingContext;
  fitness: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface WritingContext {
  projectType: 'novel' | 'short-story' | 'article' | 'essay' | 'poetry';
  genre: string[];
  deadline: 'urgent' | 'moderate' | 'flexible' | 'none';
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mood: 'inspired' | 'neutral' | 'struggling' | 'blocked';
  timeAvailable: number; // hours
  energyLevel: number; // 0-1
}

export interface LearningState {
  strategies: WritingStrategy[];
  activeStrategy: string;
  explorationRate: number;
  contextHistory: ContextRecord[];
  adaptations: Adaptation[];
}

export interface ContextRecord {
  context: WritingContext;
  strategyUsed: string;
  outcome: WritingOutcome;
  timestamp: Date;
}

export interface WritingOutcome {
  wordsWritten: number;
  quality: number; // 0-1
  timeSpent: number; // minutes
  satisfaction: number; // 0-1
  completed: boolean;
  blockers: string[];
}

export interface Adaptation {
  trigger: string;
  condition: (history: ContextRecord[]) => boolean;
  action: (state: LearningState) => LearningState;
  appliedCount: number;
  successRate: number;
}

export interface MultiArmedBandit {
  arms: BanditArm[];
  algorithm: 'epsilon-greedy' | 'ucb' | 'thompson-sampling';
  parameters: BanditParameters;
}

export interface BanditArm {
  strategyId: string;
  pulls: number;
  rewards: number[];
  avgReward: number;
  confidence: number;
}

export interface BanditParameters {
  epsilon?: number; // For epsilon-greedy
  c?: number; // For UCB
  alpha?: number; // For Thompson sampling
  beta?: number; // For Thompson sampling
}

export class WritingLearningConfig extends BaseConfig {
  readonly domain = 'writing';
  readonly version = '1.0.0';
  
  // Multi-armed bandit configuration
  readonly banditConfig = {
    algorithm: 'ucb' as const,
    parameters: {
      c: 2, // Exploration constant for UCB
      initialConfidence: 1.0,
    },
    rewardWeights: {
      wordCount: 0.3,
      quality: 0.4,
      completion: 0.2,
      satisfaction: 0.1,
    },
    contextualBonus: 0.2, // Bonus for context match
  };
  
  // Strategy definitions
  readonly strategies: Omit<WritingStrategy, 'performance' | 'contexts'>[] = [
    {
      id: 'planner',
      name: 'The Architect',
      type: 'planning',
      techniques: [
        {
          name: 'Detailed Outline',
          category: 'prewriting',
          effectiveness: 0.8,
          timeInvestment: 0.9,
          skillRequired: 0.7,
          apply: (context) => this.applyDetailedOutline(context),
        },
        {
          name: 'Scene Cards',
          category: 'prewriting',
          effectiveness: 0.7,
          timeInvestment: 0.6,
          skillRequired: 0.5,
          apply: (context) => this.applySceneCards(context),
        },
        {
          name: 'Linear Drafting',
          category: 'drafting',
          effectiveness: 0.6,
          timeInvestment: 0.5,
          skillRequired: 0.4,
          apply: (context) => this.applyLinearDrafting(context),
        },
      ],
    },
    {
      id: 'pantser',
      name: 'The Explorer',
      type: 'discovery',
      techniques: [
        {
          name: 'Free Writing',
          category: 'drafting',
          effectiveness: 0.6,
          timeInvestment: 0.3,
          skillRequired: 0.3,
          apply: (context) => this.applyFreeWriting(context),
        },
        {
          name: 'Character Interview',
          category: 'prewriting',
          effectiveness: 0.7,
          timeInvestment: 0.4,
          skillRequired: 0.5,
          apply: (context) => this.applyCharacterInterview(context),
        },
        {
          name: 'Stream of Consciousness',
          category: 'drafting',
          effectiveness: 0.5,
          timeInvestment: 0.2,
          skillRequired: 0.6,
          apply: (context) => this.applyStreamOfConsciousness(context),
        },
      ],
    },
    {
      id: 'methodical',
      name: 'The Craftsperson',
      type: 'structured',
      techniques: [
        {
          name: 'Three-Act Structure',
          category: 'prewriting',
          effectiveness: 0.8,
          timeInvestment: 0.7,
          skillRequired: 0.6,
          apply: (context) => this.applyThreeActStructure(context),
        },
        {
          name: 'Daily Word Goals',
          category: 'drafting',
          effectiveness: 0.7,
          timeInvestment: 0.5,
          skillRequired: 0.3,
          apply: (context) => this.applyDailyWordGoals(context),
        },
        {
          name: 'Systematic Revision',
          category: 'revision',
          effectiveness: 0.9,
          timeInvestment: 0.8,
          skillRequired: 0.7,
          apply: (context) => this.applySystematicRevision(context),
        },
      ],
    },
    {
      id: 'hybrid',
      name: 'The Adapter',
      type: 'hybrid',
      techniques: [
        {
          name: 'Flexible Outline',
          category: 'prewriting',
          effectiveness: 0.7,
          timeInvestment: 0.5,
          skillRequired: 0.5,
          apply: (context) => this.applyFlexibleOutline(context),
        },
        {
          name: 'Sprint Writing',
          category: 'drafting',
          effectiveness: 0.8,
          timeInvestment: 0.4,
          skillRequired: 0.4,
          apply: (context) => this.applySprintWriting(context),
        },
        {
          name: 'Iterative Development',
          category: 'revision',
          effectiveness: 0.8,
          timeInvestment: 0.6,
          skillRequired: 0.6,
          apply: (context) => this.applyIterativeDevelopment(context),
        },
      ],
    },
  ];
  
  // Adaptation rules
  readonly adaptations: Omit<Adaptation, 'appliedCount' | 'successRate'>[] = [
    {
      trigger: 'repeated_blocks',
      condition: (history) => {
        const recent = history.slice(-5);
        const blocked = recent.filter(r => r.outcome.blockers.length > 0);
        return blocked.length >= 3;
      },
      action: (state) => {
        // Switch to more exploratory strategy
        state.explorationRate = Math.min(0.5, state.explorationRate + 0.1);
        state.activeStrategy = 'pantser';
        return state;
      },
    },
    {
      trigger: 'consistent_success',
      condition: (history) => {
        const recent = history.slice(-10);
        const successful = recent.filter(r => r.outcome.completed && r.outcome.quality > 0.7);
        return successful.length >= 8;
      },
      action: (state) => {
        // Reduce exploration, exploit successful strategy
        state.explorationRate = Math.max(0.05, state.explorationRate - 0.1);
        return state;
      },
    },
    {
      trigger: 'deadline_pressure',
      condition: (history) => {
        const current = history[history.length - 1];
        return current?.context.deadline === 'urgent';
      },
      action: (state) => {
        // Switch to high-efficiency strategies
        const efficient = state.strategies
          .filter(s => s.type === 'structured' || s.type === 'hybrid')
          .map(s => s.id);
        if (efficient.length > 0) {
          state.activeStrategy = efficient[0];
        }
        return state;
      },
    },
    {
      trigger: 'low_energy',
      condition: (history) => {
        const current = history[history.length - 1];
        return current?.context.energyLevel < 0.3;
      },
      action: (state) => {
        // Switch to low-investment techniques
        const lowEnergy = state.strategies
          .filter(s => s.techniques.some(t => t.timeInvestment < 0.5))
          .map(s => s.id);
        if (lowEnergy.length > 0) {
          state.activeStrategy = lowEnergy[0];
        }
        return state;
      },
    },
  ];
  
  // Initialize learning state
  createInitialState(): LearningState {
    const strategies = this.strategies.map(s => ({
      ...s,
      performance: {
        totalWords: 0,
        avgQuality: 0,
        completionRate: 0,
        avgTimePerWord: 0,
        successfulProjects: 0,
        abandonedProjects: 0,
      },
      contexts: [],
    }));
    
    return {
      strategies,
      activeStrategy: strategies[0].id,
      explorationRate: 0.2,
      contextHistory: [],
      adaptations: this.adaptations.map(a => ({
        ...a,
        appliedCount: 0,
        successRate: 0,
      })),
    };
  }
  
  // Multi-armed bandit implementation
  createBandit(strategies: WritingStrategy[]): MultiArmedBandit {
    const arms = strategies.map(s => ({
      strategyId: s.id,
      pulls: 0,
      rewards: [],
      avgReward: 0,
      confidence: this.banditConfig.parameters.initialConfidence || 1,
    }));
    
    return {
      arms,
      algorithm: this.banditConfig.algorithm,
      parameters: this.banditConfig.parameters,
    };
  }
  
  selectStrategy(bandit: MultiArmedBandit, context: WritingContext): string {
    switch (bandit.algorithm) {
      case 'epsilon-greedy':
        return this.epsilonGreedySelection(bandit, context);
      case 'ucb':
        return this.ucbSelection(bandit, context);
      case 'thompson-sampling':
        return this.thompsonSamplingSelection(bandit, context);
      default:
        return bandit.arms[0].strategyId;
    }
  }
  
  private epsilonGreedySelection(bandit: MultiArmedBandit, context: WritingContext): string {
    const epsilon = bandit.parameters.epsilon || 0.1;
    
    if (Math.random() < epsilon) {
      // Explore: random selection
      const randomIndex = Math.floor(Math.random() * bandit.arms.length);
      return bandit.arms[randomIndex].strategyId;
    } else {
      // Exploit: select best performing
      const contextualRewards = bandit.arms.map(arm => ({
        arm,
        reward: this.calculateContextualReward(arm, context),
      }));
      
      const best = contextualRewards.reduce((a, b) => 
        a.reward > b.reward ? a : b
      );
      
      return best.arm.strategyId;
    }
  }
  
  private ucbSelection(bandit: MultiArmedBandit, context: WritingContext): string {
    const c = bandit.parameters.c || 2;
    const totalPulls = bandit.arms.reduce((sum, arm) => sum + arm.pulls, 0);
    
    if (totalPulls < bandit.arms.length) {
      // Each arm should be pulled at least once
      const unpulled = bandit.arms.find(arm => arm.pulls === 0);
      if (unpulled) return unpulled.strategyId;
    }
    
    // Calculate UCB for each arm
    const ucbScores = bandit.arms.map(arm => {
      const exploitation = this.calculateContextualReward(arm, context);
      const exploration = c * Math.sqrt(Math.log(totalPulls) / arm.pulls);
      return {
        arm,
        score: exploitation + exploration,
      };
    });
    
    // Select arm with highest UCB
    const best = ucbScores.reduce((a, b) => a.score > b.score ? a : b);
    return best.arm.strategyId;
  }
  
  private thompsonSamplingSelection(bandit: MultiArmedBandit, context: WritingContext): string {
    const alpha = bandit.parameters.alpha || 1;
    const beta = bandit.parameters.beta || 1;
    
    // Sample from Beta distribution for each arm
    const samples = bandit.arms.map(arm => {
      const successes = arm.rewards.filter(r => r > 0.5).length;
      const failures = arm.pulls - successes;
      
      // Beta distribution sampling (simplified)
      const sample = this.sampleBeta(successes + alpha, failures + beta);
      const contextBonus = this.calculateContextBonus(arm.strategyId, context);
      
      return {
        arm,
        sample: sample + contextBonus * this.banditConfig.contextualBonus,
      };
    });
    
    // Select arm with highest sample
    const best = samples.reduce((a, b) => a.sample > b.sample ? a : b);
    return best.arm.strategyId;
  }
  
  private calculateContextualReward(arm: BanditArm, context: WritingContext): number {
    const baseReward = arm.avgReward;
    const contextBonus = this.calculateContextBonus(arm.strategyId, context);
    return baseReward + contextBonus * this.banditConfig.contextualBonus;
  }
  
  private calculateContextBonus(strategyId: string, context: WritingContext): number {
    // Calculate how well strategy fits context
    let bonus = 0;
    
    // Match strategy type to context
    if (context.deadline === 'urgent' && 
        (strategyId === 'methodical' || strategyId === 'hybrid')) {
      bonus += 0.3;
    }
    
    if (context.mood === 'inspired' && strategyId === 'pantser') {
      bonus += 0.3;
    }
    
    if (context.experience === 'beginner' && strategyId === 'methodical') {
      bonus += 0.2;
    }
    
    if (context.timeAvailable < 2 && strategyId === 'hybrid') {
      bonus += 0.2;
    }
    
    return Math.min(1, bonus);
  }
  
  private sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta distribution sampling
    // In production, use proper statistical library
    const x = Math.random();
    const y = Math.random();
    
    const gammaAlpha = -Math.log(x) * alpha;
    const gammaBeta = -Math.log(y) * beta;
    
    return gammaAlpha / (gammaAlpha + gammaBeta);
  }
  
  // Update bandit after outcome
  updateBandit(
    bandit: MultiArmedBandit,
    strategyId: string,
    outcome: WritingOutcome
  ): MultiArmedBandit {
    const arm = bandit.arms.find(a => a.strategyId === strategyId);
    if (!arm) return bandit;
    
    // Calculate reward
    const reward = this.calculateReward(outcome);
    
    // Update arm statistics
    arm.pulls++;
    arm.rewards.push(reward);
    arm.avgReward = arm.rewards.reduce((a, b) => a + b, 0) / arm.rewards.length;
    arm.confidence = 1 / Math.sqrt(arm.pulls);
    
    return bandit;
  }
  
  private calculateReward(outcome: WritingOutcome): number {
    const weights = this.banditConfig.rewardWeights;
    
    const wordCountReward = Math.min(outcome.wordsWritten / 1000, 1);
    const qualityReward = outcome.quality;
    const completionReward = outcome.completed ? 1 : 0;
    const satisfactionReward = outcome.satisfaction;
    
    return (
      wordCountReward * weights.wordCount +
      qualityReward * weights.quality +
      completionReward * weights.completion +
      satisfactionReward * weights.satisfaction
    );
  }
  
  // Technique implementations (simplified)
  private applyDetailedOutline(context: WritingContext): TechniqueResult {
    const baseWords = context.projectType === 'novel' ? 500 : 200;
    const quality = 0.8 + Math.random() * 0.2;
    const time = 60 + Math.random() * 60;
    
    return {
      wordCount: baseWords,
      quality,
      timeSpent: time,
      energyCost: 0.7,
      insights: ['Clear structure established', 'Plot holes identified'],
    };
  }
  
  private applySceneCards(context: WritingContext): TechniqueResult {
    return {
      wordCount: 300,
      quality: 0.7,
      timeSpent: 45,
      energyCost: 0.5,
      insights: ['Visual scene layout created'],
    };
  }
  
  private applyLinearDrafting(context: WritingContext): TechniqueResult {
    const speed = context.energyLevel * 30 + 20;
    const words = speed * (context.timeAvailable || 1);
    
    return {
      wordCount: words,
      quality: 0.6 + context.mood === 'inspired' ? 0.2 : 0,
      timeSpent: context.timeAvailable * 60,
      energyCost: 0.5,
      insights: ['Steady progress made'],
    };
  }
  
  private applyFreeWriting(context: WritingContext): TechniqueResult {
    const flowState = Math.random() > 0.7;
    const words = flowState ? 1000 : 400;
    
    return {
      wordCount: words,
      quality: flowState ? 0.7 : 0.5,
      timeSpent: 30,
      energyCost: 0.3,
      insights: flowState ? ['Flow state achieved!'] : ['Ideas explored'],
    };
  }
  
  private applyCharacterInterview(context: WritingContext): TechniqueResult {
    return {
      wordCount: 600,
      quality: 0.8,
      timeSpent: 40,
      energyCost: 0.4,
      insights: ['Character voice discovered', 'Backstory revealed'],
    };
  }
  
  private applyStreamOfConsciousness(context: WritingContext): TechniqueResult {
    const inspired = context.mood === 'inspired';
    
    return {
      wordCount: inspired ? 800 : 300,
      quality: inspired ? 0.6 : 0.4,
      timeSpent: 20,
      energyCost: 0.2,
      insights: ['Subconscious connections made'],
    };
  }
  
  private applyThreeActStructure(context: WritingContext): TechniqueResult {
    return {
      wordCount: 400,
      quality: 0.85,
      timeSpent: 90,
      energyCost: 0.6,
      insights: ['Strong narrative arc established'],
    };
  }
  
  private applyDailyWordGoals(context: WritingContext): TechniqueResult {
    const goal = context.projectType === 'novel' ? 1000 : 500;
    const achieved = context.energyLevel > 0.5 ? goal : goal * 0.7;
    
    return {
      wordCount: achieved,
      quality: 0.65,
      timeSpent: achieved / 15,
      energyCost: 0.5,
      insights: [`${achieved} words achieved`],
    };
  }
  
  private applySystematicRevision(context: WritingContext): TechniqueResult {
    return {
      wordCount: -200, // Net reduction from editing
      quality: 0.9,
      timeSpent: 120,
      energyCost: 0.8,
      insights: ['Prose tightened', 'Clarity improved'],
    };
  }
  
  private applyFlexibleOutline(context: WritingContext): TechniqueResult {
    return {
      wordCount: 350,
      quality: 0.75,
      timeSpent: 50,
      energyCost: 0.45,
      insights: ['Adaptable structure created'],
    };
  }
  
  private applySprintWriting(context: WritingContext): TechniqueResult {
    const sprintWords = context.energyLevel * 500 + 300;
    
    return {
      wordCount: sprintWords,
      quality: 0.7,
      timeSpent: 25,
      energyCost: 0.6,
      insights: ['Momentum built'],
    };
  }
  
  private applyIterativeDevelopment(context: WritingContext): TechniqueResult {
    return {
      wordCount: 400,
      quality: 0.8,
      timeSpent: 60,
      energyCost: 0.55,
      insights: ['Incremental improvements made'],
    };
  }
  
  // Generate recommendations based on learning
  generateRecommendations(state: LearningState, context: WritingContext): string[] {
    const recommendations: string[] = [];
    const history = state.contextHistory.slice(-20);
    
    // Analyze recent performance
    const recentOutcomes = history.map(h => h.outcome);
    const avgQuality = recentOutcomes.reduce((sum, o) => sum + o.quality, 0) / recentOutcomes.length;
    const avgWords = recentOutcomes.reduce((sum, o) => sum + o.wordsWritten, 0) / recentOutcomes.length;
    
    // Strategy-specific recommendations
    const currentStrategy = state.strategies.find(s => s.id === state.activeStrategy);
    if (currentStrategy) {
      if (currentStrategy.performance.completionRate < 0.5) {
        recommendations.push(`Consider switching from ${currentStrategy.name} strategy`);
      }
      
      if (avgQuality < 0.6) {
        recommendations.push('Focus on quality over quantity in next session');
      }
      
      if (avgWords < 300 && context.projectType !== 'poetry') {
        recommendations.push('Try sprint writing to boost word count');
      }
    }
    
    // Context-specific recommendations
    if (context.mood === 'blocked') {
      recommendations.push('Try free writing or character interviews to break the block');
    }
    
    if (context.deadline === 'urgent') {
      recommendations.push('Switch to structured approach with daily goals');
    }
    
    if (context.energyLevel < 0.3) {
      recommendations.push('Consider lighter techniques like scene cards or brainstorming');
    }
    
    // Pattern-based recommendations
    const blockerPattern = this.detectBlockerPattern(history);
    if (blockerPattern) {
      recommendations.push(`Recurring blocker detected: ${blockerPattern}`);
    }
    
    return recommendations;
  }
  
  private detectBlockerPattern(history: ContextRecord[]): string | null {
    const blockers = history.flatMap(h => h.outcome.blockers);
    const counts: Record<string, number> = {};
    
    blockers.forEach(blocker => {
      counts[blocker] = (counts[blocker] || 0) + 1;
    });
    
    const recurring = Object.entries(counts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);
    
    return recurring.length > 0 ? recurring[0][0] : null;
  }
}

export const writingLearningConfig = new WritingLearningConfig();