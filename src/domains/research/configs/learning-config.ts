import { BaseConfig } from '../../../core/base-config';

export interface ResearchMethodology {
  id: string;
  name: string;
  type: 'quantitative' | 'qualitative' | 'mixed' | 'theoretical' | 'computational';
  approaches: MethodApproach[];
  performance: MethodologyPerformance;
  domains: DomainFitness[];
}

export interface MethodApproach {
  name: string;
  category: 'design' | 'collection' | 'analysis' | 'validation';
  effectiveness: number;
  resourceRequirement: number;
  skillLevel: number;
  apply: (context: ResearchContext) => ApproachResult;
}

export interface ApproachResult {
  dataQuality: number;
  timeSpent: number;
  insights: number;
  reproducibility: number;
  costEfficiency: number;
}

export interface MethodologyPerformance {
  totalStudies: number;
  successRate: number;
  avgQuality: number;
  avgTimeToCompletion: number;
  citationImpact: number;
  reproducibilityRate: number;
}

export interface DomainFitness {
  domain: string;
  fitness: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface ResearchContext {
  field: string[];
  studyType: 'exploratory' | 'confirmatory' | 'replication' | 'meta-analysis';
  resources: ResourceAvailability;
  timeline: 'urgent' | 'standard' | 'flexible';
  teamSize: number;
  expertise: ExpertiseLevel;
}

export interface ResourceAvailability {
  funding: 'limited' | 'moderate' | 'abundant';
  equipment: 'basic' | 'standard' | 'advanced';
  personnel: number;
  computational: 'local' | 'cluster' | 'cloud';
}

export interface ExpertiseLevel {
  statistical: number; // 0-1
  domain: number;
  technical: number;
  writing: number;
}

export interface LearningState {
  methodologies: ResearchMethodology[];
  activeMethodology: string;
  explorationRate: number;
  researchHistory: ResearchRecord[];
  adaptations: MethodAdaptation[];
  knowledgeBase: KnowledgeBase;
}

export interface ResearchRecord {
  context: ResearchContext;
  methodologyUsed: string;
  outcome: ResearchOutcome;
  timestamp: Date;
}

export interface ResearchOutcome {
  quality: number;
  timeToCompletion: number;
  insights: number;
  publications: number;
  citations: number;
  reproducibility: number;
}

export interface MethodAdaptation {
  trigger: string;
  condition: (history: ResearchRecord[]) => boolean;
  action: (state: LearningState) => LearningState;
  appliedCount: number;
  effectiveness: number;
}

export interface KnowledgeBase {
  bestPractices: BestPractice[];
  failurePatterns: FailurePattern[];
  innovativeMethods: Innovation[];
}

export interface BestPractice {
  context: string;
  method: string;
  description: string;
  successRate: number;
  requirements: string[];
}

export interface FailurePattern {
  pattern: string;
  causes: string[];
  prevention: string[];
  frequency: number;
}

export interface Innovation {
  method: string;
  description: string;
  potentialImpact: number;
  riskLevel: number;
  tested: boolean;
}

export interface ResearchBandit {
  arms: MethodologyArm[];
  algorithm: 'thompson' | 'ucb' | 'exp3';
  parameters: BanditParameters;
  contextualFactors: string[];
}

export interface MethodologyArm {
  methodologyId: string;
  pulls: number;
  successes: number;
  totalReward: number;
  contextualRewards: Map<string, number>;
}

export interface BanditParameters {
  alpha?: number;
  beta?: number;
  gamma?: number;
  c?: number;
}

export class ResearchLearningConfig extends BaseConfig {
  readonly domain = 'research';
  readonly version = '1.0.0';
  
  // Multi-armed bandit for methodology selection
  readonly banditConfig = {
    algorithm: 'thompson' as const,
    parameters: {
      alpha: 1,    // Prior successes
      beta: 1,     // Prior failures
      gamma: 0.1,  // EXP3 learning rate
    },
    rewardWeights: {
      quality: 0.35,
      efficiency: 0.25,
      impact: 0.25,
      reproducibility: 0.15,
    },
    contextualMultiplier: 1.5,
  };
  
  // Research methodology definitions
  readonly methodologies: Omit<ResearchMethodology, 'performance' | 'domains'>[] = [
    {
      id: 'experimental',
      name: 'Controlled Experimentation',
      type: 'quantitative',
      approaches: [
        {
          name: 'RCT Design',
          category: 'design',
          effectiveness: 0.9,
          resourceRequirement: 0.8,
          skillLevel: 0.7,
          apply: (context) => this.applyRCT(context),
        },
        {
          name: 'Statistical Power Analysis',
          category: 'design',
          effectiveness: 0.85,
          resourceRequirement: 0.3,
          skillLevel: 0.8,
          apply: (context) => this.applyPowerAnalysis(context),
        },
        {
          name: 'Blinding Protocols',
          category: 'collection',
          effectiveness: 0.8,
          resourceRequirement: 0.5,
          skillLevel: 0.6,
          apply: (context) => this.applyBlinding(context),
        },
      ],
    },
    {
      id: 'observational',
      name: 'Observational Studies',
      type: 'mixed',
      approaches: [
        {
          name: 'Longitudinal Design',
          category: 'design',
          effectiveness: 0.75,
          resourceRequirement: 0.9,
          skillLevel: 0.6,
          apply: (context) => this.applyLongitudinal(context),
        },
        {
          name: 'Natural Experiments',
          category: 'design',
          effectiveness: 0.7,
          resourceRequirement: 0.4,
          skillLevel: 0.7,
          apply: (context) => this.applyNaturalExperiment(context),
        },
        {
          name: 'Mixed Methods Integration',
          category: 'analysis',
          effectiveness: 0.8,
          resourceRequirement: 0.6,
          skillLevel: 0.8,
          apply: (context) => this.applyMixedMethods(context),
        },
      ],
    },
    {
      id: 'computational',
      name: 'Computational Research',
      type: 'computational',
      approaches: [
        {
          name: 'Simulation Studies',
          category: 'design',
          effectiveness: 0.8,
          resourceRequirement: 0.7,
          skillLevel: 0.9,
          apply: (context) => this.applySimulation(context),
        },
        {
          name: 'Machine Learning Analysis',
          category: 'analysis',
          effectiveness: 0.85,
          resourceRequirement: 0.8,
          skillLevel: 0.9,
          apply: (context) => this.applyML(context),
        },
        {
          name: 'Big Data Mining',
          category: 'collection',
          effectiveness: 0.75,
          resourceRequirement: 0.9,
          skillLevel: 0.85,
          apply: (context) => this.applyBigData(context),
        },
      ],
    },
    {
      id: 'theoretical',
      name: 'Theoretical Development',
      type: 'theoretical',
      approaches: [
        {
          name: 'Mathematical Modeling',
          category: 'design',
          effectiveness: 0.85,
          resourceRequirement: 0.3,
          skillLevel: 0.95,
          apply: (context) => this.applyMathModeling(context),
        },
        {
          name: 'Conceptual Framework',
          category: 'design',
          effectiveness: 0.7,
          resourceRequirement: 0.2,
          skillLevel: 0.8,
          apply: (context) => this.applyConceptual(context),
        },
        {
          name: 'Formal Proofs',
          category: 'validation',
          effectiveness: 0.95,
          resourceRequirement: 0.4,
          skillLevel: 0.95,
          apply: (context) => this.applyFormalProof(context),
        },
      ],
    },
    {
      id: 'qualitative',
      name: 'Qualitative Investigation',
      type: 'qualitative',
      approaches: [
        {
          name: 'Grounded Theory',
          category: 'analysis',
          effectiveness: 0.8,
          resourceRequirement: 0.6,
          skillLevel: 0.75,
          apply: (context) => this.applyGroundedTheory(context),
        },
        {
          name: 'Ethnographic Study',
          category: 'collection',
          effectiveness: 0.75,
          resourceRequirement: 0.8,
          skillLevel: 0.7,
          apply: (context) => this.applyEthnography(context),
        },
        {
          name: 'Thematic Analysis',
          category: 'analysis',
          effectiveness: 0.7,
          resourceRequirement: 0.4,
          skillLevel: 0.6,
          apply: (context) => this.applyThematicAnalysis(context),
        },
      ],
    },
  ];
  
  // Adaptation rules for research
  readonly adaptations: Omit<MethodAdaptation, 'appliedCount' | 'effectiveness'>[] = [
    {
      trigger: 'low_reproducibility',
      condition: (history) => {
        const recent = history.slice(-5);
        const avgReproducibility = recent.reduce((sum, r) => sum + r.outcome.reproducibility, 0) / recent.length;
        return avgReproducibility < 0.5;
      },
      action: (state) => {
        // Switch to more rigorous methodology
        state.activeMethodology = 'experimental';
        state.knowledgeBase.bestPractices.push({
          context: 'reproducibility_crisis',
          method: 'pre-registration',
          description: 'Pre-register studies to improve reproducibility',
          successRate: 0.8,
          requirements: ['detailed_protocol', 'public_commitment'],
        });
        return state;
      },
    },
    {
      trigger: 'resource_constraints',
      condition: (history) => {
        const current = history[history.length - 1];
        return current?.context.resources.funding === 'limited';
      },
      action: (state) => {
        // Switch to resource-efficient methods
        const efficient = state.methodologies
          .filter(m => m.approaches.some(a => a.resourceRequirement < 0.5))
          .map(m => m.id);
        if (efficient.length > 0) {
          state.activeMethodology = efficient[0];
        }
        return state;
      },
    },
    {
      trigger: 'breakthrough_opportunity',
      condition: (history) => {
        const recent = history.slice(-3);
        const highInsights = recent.filter(r => r.outcome.insights > 3);
        return highInsights.length >= 2;
      },
      action: (state) => {
        // Increase exploration for innovative methods
        state.explorationRate = Math.min(0.5, state.explorationRate + 0.15);
        state.knowledgeBase.innovativeMethods.push({
          method: 'hybrid_approach',
          description: 'Combine successful methods for breakthrough',
          potentialImpact: 0.9,
          riskLevel: 0.6,
          tested: false,
        });
        return state;
      },
    },
    {
      trigger: 'publication_pressure',
      condition: (history) => {
        const recent = history.slice(-10);
        const publications = recent.reduce((sum, r) => sum + r.outcome.publications, 0);
        return publications < 2;
      },
      action: (state) => {
        // Focus on publication-friendly methods
        const pubFriendly = state.methodologies
          .filter(m => m.type === 'quantitative' || m.type === 'computational')
          .map(m => m.id);
        if (pubFriendly.length > 0) {
          state.activeMethodology = pubFriendly[0];
        }
        return state;
      },
    },
  ];
  
  // Initialize learning state
  createInitialState(): LearningState {
    const methodologies = this.methodologies.map(m => ({
      ...m,
      performance: {
        totalStudies: 0,
        successRate: 0,
        avgQuality: 0,
        avgTimeToCompletion: 0,
        citationImpact: 0,
        reproducibilityRate: 0,
      },
      domains: [],
    }));
    
    return {
      methodologies,
      activeMethodology: methodologies[0].id,
      explorationRate: 0.25,
      researchHistory: [],
      adaptations: this.adaptations.map(a => ({
        ...a,
        appliedCount: 0,
        effectiveness: 0,
      })),
      knowledgeBase: {
        bestPractices: [],
        failurePatterns: [],
        innovativeMethods: [],
      },
    };
  }
  
  // Create research bandit
  createBandit(methodologies: ResearchMethodology[]): ResearchBandit {
    const arms = methodologies.map(m => ({
      methodologyId: m.id,
      pulls: 0,
      successes: 0,
      totalReward: 0,
      contextualRewards: new Map<string, number>(),
    }));
    
    return {
      arms,
      algorithm: this.banditConfig.algorithm,
      parameters: this.banditConfig.parameters,
      contextualFactors: ['field', 'resources', 'timeline', 'expertise'],
    };
  }
  
  // Select methodology using bandit
  selectMethodology(bandit: ResearchBandit, context: ResearchContext): string {
    switch (bandit.algorithm) {
      case 'thompson':
        return this.thompsonSampling(bandit, context);
      case 'ucb':
        return this.upperConfidenceBound(bandit, context);
      case 'exp3':
        return this.exponentialWeightExploration(bandit, context);
      default:
        return bandit.arms[0].methodologyId;
    }
  }
  
  private thompsonSampling(bandit: ResearchBandit, context: ResearchContext): string {
    const samples = bandit.arms.map(arm => {
      const alpha = arm.successes + (bandit.parameters.alpha || 1);
      const beta = arm.pulls - arm.successes + (bandit.parameters.beta || 1);
      
      // Sample from Beta distribution
      const sample = this.sampleBeta(alpha, beta);
      
      // Add contextual bonus
      const contextBonus = this.calculateContextualBonus(arm, context);
      
      return {
        arm,
        score: sample * (1 + contextBonus * this.banditConfig.contextualMultiplier),
      };
    });
    
    // Select highest scoring arm
    const best = samples.reduce((a, b) => a.score > b.score ? a : b);
    return best.arm.methodologyId;
  }
  
  private upperConfidenceBound(bandit: ResearchBandit, context: ResearchContext): string {
    const totalPulls = bandit.arms.reduce((sum, arm) => sum + arm.pulls, 0);
    const c = bandit.parameters.c || 2;
    
    if (totalPulls < bandit.arms.length) {
      // Ensure each arm is pulled at least once
      const unpulled = bandit.arms.find(arm => arm.pulls === 0);
      if (unpulled) return unpulled.methodologyId;
    }
    
    const ucbScores = bandit.arms.map(arm => {
      const avgReward = arm.pulls > 0 ? arm.totalReward / arm.pulls : 0;
      const exploration = c * Math.sqrt(Math.log(totalPulls) / arm.pulls);
      const contextBonus = this.calculateContextualBonus(arm, context);
      
      return {
        arm,
        score: avgReward + exploration + contextBonus,
      };
    });
    
    const best = ucbScores.reduce((a, b) => a.score > b.score ? a : b);
    return best.arm.methodologyId;
  }
  
  private exponentialWeightExploration(bandit: ResearchBandit, context: ResearchContext): string {
    const gamma = bandit.parameters.gamma || 0.1;
    
    // Calculate weights
    const weights = bandit.arms.map(arm => {
      const avgReward = arm.pulls > 0 ? arm.totalReward / arm.pulls : 0.5;
      const contextBonus = this.calculateContextualBonus(arm, context);
      const adjustedReward = avgReward + contextBonus;
      
      return {
        arm,
        weight: Math.exp(gamma * adjustedReward * arm.pulls),
      };
    });
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const probabilities = weights.map(w => ({
      arm: w.arm,
      probability: w.weight / totalWeight,
    }));
    
    // Sample according to probabilities
    const random = Math.random();
    let cumulative = 0;
    
    for (const p of probabilities) {
      cumulative += p.probability;
      if (random <= cumulative) {
        return p.arm.methodologyId;
      }
    }
    
    return probabilities[probabilities.length - 1].arm.methodologyId;
  }
  
  private calculateContextualBonus(arm: MethodologyArm, context: ResearchContext): number {
    let bonus = 0;
    
    // Field-specific performance
    const fieldKey = context.field.join('-');
    const fieldReward = arm.contextualRewards.get(fieldKey) || 0;
    bonus += fieldReward * 0.3;
    
    // Resource matching
    const resourceKey = `${context.resources.funding}-${context.resources.equipment}`;
    const resourceReward = arm.contextualRewards.get(resourceKey) || 0;
    bonus += resourceReward * 0.2;
    
    // Timeline appropriateness
    if (context.timeline === 'urgent' && arm.methodologyId === 'computational') {
      bonus += 0.2;
    }
    
    // Expertise alignment
    const expertiseKey = `expertise-${Math.round(context.expertise.statistical * 10)}`;
    const expertiseReward = arm.contextualRewards.get(expertiseKey) || 0;
    bonus += expertiseReward * 0.1;
    
    return Math.min(1, bonus);
  }
  
  private sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta sampling using gamma distribution approximation
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }
  
  private sampleGamma(shape: number): number {
    // Marsaglia and Tsang method (simplified)
    if (shape < 1) {
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      const z = this.normalRandom();
      const v = Math.pow(1 + c * z, 3);
      const u = Math.random();
      
      if (v > 0 && Math.log(u) < 0.5 * z * z + d - d * v + d * Math.log(v)) {
        return d * v;
      }
    }
  }
  
  private normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  
  // Update bandit after research outcome
  updateBandit(
    bandit: ResearchBandit,
    methodologyId: string,
    outcome: ResearchOutcome,
    context: ResearchContext
  ): ResearchBandit {
    const arm = bandit.arms.find(a => a.methodologyId === methodologyId);
    if (!arm) return bandit;
    
    // Calculate reward
    const reward = this.calculateReward(outcome);
    
    // Update arm statistics
    arm.pulls++;
    arm.totalReward += reward;
    if (reward > 0.7) arm.successes++;
    
    // Update contextual rewards
    const fieldKey = context.field.join('-');
    arm.contextualRewards.set(fieldKey, 
      (arm.contextualRewards.get(fieldKey) || 0) * 0.9 + reward * 0.1
    );
    
    const resourceKey = `${context.resources.funding}-${context.resources.equipment}`;
    arm.contextualRewards.set(resourceKey,
      (arm.contextualRewards.get(resourceKey) || 0) * 0.9 + reward * 0.1
    );
    
    return bandit;
  }
  
  private calculateReward(outcome: ResearchOutcome): number {
    const weights = this.banditConfig.rewardWeights;
    
    const qualityReward = outcome.quality;
    const efficiencyReward = Math.max(0, 1 - outcome.timeToCompletion / 365); // Normalize to year
    const impactReward = Math.min(1, outcome.citations / 10); // Normalize to 10 citations
    const reproducibilityReward = outcome.reproducibility;
    
    return (
      qualityReward * weights.quality +
      efficiencyReward * weights.efficiency +
      impactReward * weights.impact +
      reproducibilityReward * weights.reproducibility
    );
  }
  
  // Apply specific approaches (simplified implementations)
  private applyRCT(context: ResearchContext): ApproachResult {
    const base = {
      dataQuality: 0.9,
      timeSpent: 180,
      insights: 2,
      reproducibility: 0.9,
      costEfficiency: 0.4,
    };
    
    // Adjust based on context
    if (context.resources.funding === 'limited') {
      base.dataQuality *= 0.8;
      base.costEfficiency *= 0.6;
    }
    
    if (context.expertise.statistical > 0.8) {
      base.dataQuality *= 1.1;
      base.insights += 1;
    }
    
    return base;
  }
  
  private applyPowerAnalysis(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.8,
      timeSpent: 10,
      insights: 1,
      reproducibility: 0.95,
      costEfficiency: 0.9,
    };
  }
  
  private applyBlinding(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.85,
      timeSpent: 30,
      insights: 0,
      reproducibility: 0.85,
      costEfficiency: 0.7,
    };
  }
  
  private applyLongitudinal(context: ResearchContext): ApproachResult {
    const months = context.timeline === 'urgent' ? 6 : 24;
    return {
      dataQuality: 0.75,
      timeSpent: months * 30,
      insights: 3,
      reproducibility: 0.7,
      costEfficiency: 0.3,
    };
  }
  
  private applyNaturalExperiment(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.7,
      timeSpent: 60,
      insights: 2,
      reproducibility: 0.65,
      costEfficiency: 0.8,
    };
  }
  
  private applyMixedMethods(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.8,
      timeSpent: 90,
      insights: 3,
      reproducibility: 0.75,
      costEfficiency: 0.6,
    };
  }
  
  private applySimulation(context: ResearchContext): ApproachResult {
    const computePower = context.resources.computational === 'cloud' ? 1.5 : 1;
    return {
      dataQuality: 0.8,
      timeSpent: 45 / computePower,
      insights: 2,
      reproducibility: 0.95,
      costEfficiency: 0.7,
    };
  }
  
  private applyML(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.85,
      timeSpent: 60,
      insights: 3,
      reproducibility: 0.8,
      costEfficiency: 0.6,
    };
  }
  
  private applyBigData(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.75,
      timeSpent: 120,
      insights: 4,
      reproducibility: 0.7,
      costEfficiency: 0.4,
    };
  }
  
  private applyMathModeling(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.9,
      timeSpent: 90,
      insights: 2,
      reproducibility: 1.0,
      costEfficiency: 0.9,
    };
  }
  
  private applyConceptual(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.7,
      timeSpent: 45,
      insights: 3,
      reproducibility: 0.6,
      costEfficiency: 0.95,
    };
  }
  
  private applyFormalProof(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 1.0,
      timeSpent: 180,
      insights: 1,
      reproducibility: 1.0,
      costEfficiency: 0.8,
    };
  }
  
  private applyGroundedTheory(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.8,
      timeSpent: 120,
      insights: 4,
      reproducibility: 0.6,
      costEfficiency: 0.7,
    };
  }
  
  private applyEthnography(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.75,
      timeSpent: 240,
      insights: 5,
      reproducibility: 0.5,
      costEfficiency: 0.3,
    };
  }
  
  private applyThematicAnalysis(context: ResearchContext): ApproachResult {
    return {
      dataQuality: 0.7,
      timeSpent: 60,
      insights: 3,
      reproducibility: 0.65,
      costEfficiency: 0.8,
    };
  }
  
  // Generate research recommendations
  generateRecommendations(
    state: LearningState,
    context: ResearchContext
  ): string[] {
    const recommendations: string[] = [];
    
    // Analyze recent performance
    const recentHistory = state.researchHistory.slice(-10);
    if (recentHistory.length > 0) {
      const avgQuality = recentHistory.reduce((sum, r) => sum + r.outcome.quality, 0) / recentHistory.length;
      const avgTime = recentHistory.reduce((sum, r) => sum + r.outcome.timeToCompletion, 0) / recentHistory.length;
      
      if (avgQuality < 0.7) {
        recommendations.push('Consider more rigorous methodology to improve research quality');
      }
      
      if (avgTime > 180) {
        recommendations.push('Explore more efficient research designs to reduce time to completion');
      }
    }
    
    // Context-specific recommendations
    if (context.resources.funding === 'limited') {
      recommendations.push('Focus on theoretical or computational methods to maximize resource efficiency');
    }
    
    if (context.timeline === 'urgent') {
      recommendations.push('Consider secondary data analysis or computational approaches for faster results');
    }
    
    if (context.expertise.statistical < 0.5) {
      recommendations.push('Collaborate with statistician or use simpler analytical methods');
    }
    
    // Knowledge base recommendations
    const relevantPractices = state.knowledgeBase.bestPractices
      .filter(bp => bp.successRate > 0.7)
      .slice(0, 2);
    
    relevantPractices.forEach(bp => {
      recommendations.push(`Best practice: ${bp.description}`);
    });
    
    // Failure prevention
    const commonFailures = state.knowledgeBase.failurePatterns
      .filter(fp => fp.frequency > 0.3)
      .slice(0, 1);
    
    commonFailures.forEach(fp => {
      recommendations.push(`Avoid: ${fp.pattern}. Prevention: ${fp.prevention[0]}`);
    });
    
    // Innovation opportunities
    if (state.explorationRate > 0.3) {
      const innovations = state.knowledgeBase.innovativeMethods
        .filter(i => !i.tested && i.riskLevel < 0.7)
        .slice(0, 1);
      
      innovations.forEach(i => {
        recommendations.push(`Consider innovative approach: ${i.description}`);
      });
    }
    
    return recommendations;
  }
  
  // Learn from research outcome
  updateLearningState(
    state: LearningState,
    record: ResearchRecord
  ): LearningState {
    // Add to history
    state.researchHistory.push(record);
    
    // Update methodology performance
    const methodology = state.methodologies.find(m => m.id === record.methodologyUsed);
    if (methodology) {
      const perf = methodology.performance;
      perf.totalStudies++;
      
      if (record.outcome.quality > 0.7) perf.successRate = (perf.successRate * (perf.totalStudies - 1) + 1) / perf.totalStudies;
      else perf.successRate = (perf.successRate * (perf.totalStudies - 1)) / perf.totalStudies;
      
      perf.avgQuality = (perf.avgQuality * (perf.totalStudies - 1) + record.outcome.quality) / perf.totalStudies;
      perf.avgTimeToCompletion = (perf.avgTimeToCompletion * (perf.totalStudies - 1) + record.outcome.timeToCompletion) / perf.totalStudies;
      perf.citationImpact = (perf.citationImpact * (perf.totalStudies - 1) + record.outcome.citations) / perf.totalStudies;
      perf.reproducibilityRate = (perf.reproducibilityRate * (perf.totalStudies - 1) + record.outcome.reproducibility) / perf.totalStudies;
      
      // Update domain fitness
      const fieldKey = record.context.field.join('-');
      const domainFitness = methodology.domains.find(d => d.domain === fieldKey);
      
      if (domainFitness) {
        domainFitness.fitness = (domainFitness.fitness * domainFitness.sampleSize + record.outcome.quality) / (domainFitness.sampleSize + 1);
        domainFitness.sampleSize++;
        domainFitness.lastUpdated = new Date();
      } else {
        methodology.domains.push({
          domain: fieldKey,
          fitness: record.outcome.quality,
          sampleSize: 1,
          lastUpdated: new Date(),
        });
      }
    }
    
    // Check for adaptations
    state.adaptations.forEach(adaptation => {
      if (adaptation.condition(state.researchHistory)) {
        state = adaptation.action(state);
        adaptation.appliedCount++;
        
        // Track effectiveness
        const beforeQuality = state.researchHistory.slice(-5, -1).reduce((sum, r) => sum + r.outcome.quality, 0) / 4 || 0.5;
        const afterQuality = record.outcome.quality;
        adaptation.effectiveness = (adaptation.effectiveness * (adaptation.appliedCount - 1) + (afterQuality - beforeQuality)) / adaptation.appliedCount;
      }
    });
    
    // Update exploration rate
    if (state.researchHistory.length % 10 === 0) {
      // Decay exploration over time
      state.explorationRate = Math.max(0.05, state.explorationRate * 0.95);
    }
    
    // Learn from failures
    if (record.outcome.quality < 0.5) {
      const pattern: FailurePattern = {
        pattern: `Low quality in ${record.methodologyUsed} for ${record.context.field.join(', ')}`,
        causes: ['methodology_mismatch', 'resource_constraints', 'expertise_gap'],
        prevention: ['better_methodology_selection', 'resource_planning', 'collaboration'],
        frequency: 0.1,
      };
      
      // Check if pattern exists
      const existing = state.knowledgeBase.failurePatterns.find(fp => 
        fp.pattern.includes(record.methodologyUsed) && fp.pattern.includes(record.context.field[0])
      );
      
      if (existing) {
        existing.frequency = Math.min(1, existing.frequency + 0.1);
      } else {
        state.knowledgeBase.failurePatterns.push(pattern);
      }
    }
    
    // Learn from successes
    if (record.outcome.quality > 0.8 && record.outcome.reproducibility > 0.7) {
      const practice: BestPractice = {
        context: `${record.context.field.join(', ')} research`,
        method: record.methodologyUsed,
        description: `${record.methodologyUsed} effective for ${record.context.studyType} studies`,
        successRate: record.outcome.quality,
        requirements: Object.entries(record.context.resources)
          .filter(([_, v]) => v !== 'limited' && v !== 'basic')
          .map(([k, v]) => `${k}: ${v}`),
      };
      
      state.knowledgeBase.bestPractices.push(practice);
    }
    
    return state;
  }
}

export const researchLearningConfig = new ResearchLearningConfig();