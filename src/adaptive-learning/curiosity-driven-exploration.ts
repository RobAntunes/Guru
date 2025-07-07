/**
 * Curiosity-Driven Exploration Engine
 * 
 * Implements autonomous exploration of code patterns through novelty detection,
 * hypothesis generation, and experimental design. The engine actively seeks
 * interesting patterns and generates questions to test.
 */

import { EventEmitter } from 'events';
import { SymbolGraph } from '../parsers/symbol-graph.js';

export interface NoveltySignal {
  id: string;
  type: 'structural' | 'behavioral' | 'statistical' | 'temporal' | 'relational';
  noveltyScore: number; // 0-1, higher is more novel
  location: {
    file?: string;
    symbol?: string;
    pattern?: string;
  };
  description: string;
  timestamp: Date;
}

export interface Hypothesis {
  id: string;
  question: string;
  type: 'correlation' | 'causation' | 'pattern' | 'anomaly' | 'optimization';
  noveltySource: NoveltySignal;
  testableConditions: string[];
  expectedOutcome: any;
  confidence: number;
  priority: number;
  status: 'proposed' | 'testing' | 'validated' | 'rejected' | 'inconclusive';
}

export interface Experiment {
  id: string;
  hypothesis: Hypothesis;
  design: {
    controlGroup: any;
    testGroup: any;
    variables: string[];
    metrics: string[];
  };
  budget: {
    timeMs: number;
    memoryMB: number;
    complexity: number;
  };
  results?: {
    outcome: any;
    confidence: number;
    insights: string[];
  };
}

export interface CuriosityMetrics {
  noveltyDetectionRate: number;
  hypothesisGenerationRate: number;
  validationSuccessRate: number;
  explorationEfficiency: number;
  knowledgeGainRate: number;
}

export interface CuriosityConfig {
  noveltyThreshold: number; // Minimum novelty score to trigger investigation
  explorationBudget: {
    timePercentage: number; // % of time for exploration
    memoryMB: number;
    maxConcurrentExperiments: number;
  };
  interestDecayRate: number; // How fast novelty becomes mundane
  hypothesisPrioritization: 'novelty' | 'impact' | 'feasibility' | 'balanced';
  experimentTimeout: number; // ms
}

export class CuriosityDrivenExploration extends EventEmitter {
  private noveltyHistory: Map<string, NoveltySignal[]> = new Map();
  private hypotheses: Map<string, Hypothesis> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private knownPatterns: Set<string> = new Set();
  private interestingPatterns: Map<string, number> = new Map(); // pattern -> interest score
  private explorationBudgetUsed: {
    timeMs: number;
    memoryMB: number;
    startTime: Date;
  };
  
  constructor(private config: CuriosityConfig) {
    super();
    this.explorationBudgetUsed = {
      timeMs: 0,
      memoryMB: 0,
      startTime: new Date()
    };
    this.startExplorationCycle();
  }
  
  /**
   * Detect novelty in code structure or behavior
   */
  async detectNovelty(
    context: {
      symbolGraph?: SymbolGraph;
      patterns?: any[];
      metrics?: any;
      behavior?: any;
    }
  ): Promise<NoveltySignal[]> {
    const signals: NoveltySignal[] = [];
    
    // Structural novelty
    if (context.symbolGraph) {
      const structuralSignals = this.detectStructuralNovelty(context.symbolGraph);
      signals.push(...structuralSignals);
    }
    
    // Pattern novelty
    if (context.patterns) {
      const patternSignals = this.detectPatternNovelty(context.patterns);
      signals.push(...patternSignals);
    }
    
    // Statistical novelty
    if (context.metrics) {
      const statisticalSignals = this.detectStatisticalNovelty(context.metrics);
      signals.push(...statisticalSignals);
    }
    
    // Behavioral novelty
    if (context.behavior) {
      const behavioralSignals = this.detectBehavioralNovelty(context.behavior);
      signals.push(...behavioralSignals);
    }
    
    // Filter by threshold and decay interest
    const filteredSignals = signals.filter(signal => {
      const decayedScore = this.applyInterestDecay(signal);
      return decayedScore >= this.config.noveltyThreshold;
    });
    
    // Record signals
    for (const signal of filteredSignals) {
      const key = signal.type;
      const history = this.noveltyHistory.get(key) || [];
      history.push(signal);
      this.noveltyHistory.set(key, history.slice(-100)); // Keep last 100
    }
    
    // Generate hypotheses for interesting signals
    for (const signal of filteredSignals.slice(0, 5)) { // Top 5 most novel
      const hypotheses = await this.generateHypotheses(signal);
      for (const hypothesis of hypotheses) {
        this.hypotheses.set(hypothesis.id, hypothesis);
      }
    }
    
    this.emit('novelty-detected', filteredSignals);
    
    return filteredSignals;
  }
  
  /**
   * Detect structural novelty in symbol graph
   */
  private detectStructuralNovelty(symbolGraph: SymbolGraph): NoveltySignal[] {
    const signals: NoveltySignal[] = [];
    
    // Look for unusual graph structures
    for (const [name, symbol] of symbolGraph.symbols) {
      // Unusual connectivity
      const inDegree = symbol.referencedBy.length;
      const outDegree = symbol.dependencies.length;
      const connectivity = inDegree + outDegree;
      
      // High fan-out (many dependencies)
      if (outDegree > 20) {
        const patternKey = `high-fanout-${Math.floor(outDegree / 10) * 10}`;
        const novelty = this.calculatePatternNovelty(patternKey);
        
        if (novelty > 0) {
          signals.push({
            id: `structural-fanout-${name}`,
            type: 'structural',
            noveltyScore: novelty,
            location: { symbol: name },
            description: `Unusually high fan-out: ${outDegree} dependencies`,
            timestamp: new Date()
          });
        }
      }
      
      // Isolated islands (no connections)
      if (connectivity === 0 && symbol.type !== 'type') {
        const patternKey = 'isolated-symbol';
        const novelty = this.calculatePatternNovelty(patternKey);
        
        if (novelty > 0) {
          signals.push({
            id: `structural-isolated-${name}`,
            type: 'structural',
            noveltyScore: novelty,
            location: { symbol: name },
            description: 'Completely isolated symbol with no connections',
            timestamp: new Date()
          });
        }
      }
      
      // Circular dependencies
      const cycles = this.detectCycles(symbolGraph, name);
      if (cycles.length > 0) {
        const patternKey = `circular-dep-${cycles[0].length}`;
        const novelty = this.calculatePatternNovelty(patternKey);
        
        if (novelty > 0) {
          signals.push({
            id: `structural-cycle-${name}`,
            type: 'structural',
            noveltyScore: novelty,
            location: { symbol: name },
            description: `Part of circular dependency chain of length ${cycles[0].length}`,
            timestamp: new Date()
          });
        }
      }
    }
    
    return signals;
  }
  
  /**
   * Detect pattern novelty
   */
  private detectPatternNovelty(patterns: any[]): NoveltySignal[] {
    const signals: NoveltySignal[] = [];
    
    for (const pattern of patterns) {
      const patternKey = `${pattern.type}-${pattern.subtype || 'default'}`;
      const novelty = this.calculatePatternNovelty(patternKey);
      
      if (novelty > 0) {
        // Check for rare combinations
        if (pattern.combinations) {
          for (const combo of pattern.combinations) {
            const comboKey = `combo-${combo.patterns.join('-')}`;
            const comboNovelty = this.calculatePatternNovelty(comboKey);
            
            if (comboNovelty > 0.7) {
              signals.push({
                id: `pattern-combo-${Date.now()}`,
                type: 'behavioral',
                noveltyScore: comboNovelty,
                location: { pattern: comboKey },
                description: `Rare pattern combination: ${combo.patterns.join(' + ')}`,
                timestamp: new Date()
              });
            }
          }
        }
        
        // Check for anomalous instances
        if (pattern.confidence < 0.3 && pattern.instances.length > 5) {
          signals.push({
            id: `pattern-anomaly-${Date.now()}`,
            type: 'statistical',
            noveltyScore: 0.8,
            location: { pattern: patternKey },
            description: `Low confidence pattern with many instances: ${pattern.instances.length}`,
            timestamp: new Date()
          });
        }
      }
    }
    
    return signals;
  }
  
  /**
   * Detect statistical novelty
   */
  private detectStatisticalNovelty(metrics: any): NoveltySignal[] {
    const signals: NoveltySignal[] = [];
    
    // Look for statistical outliers
    const metricValues = Object.entries(metrics);
    
    for (const [metric, value] of metricValues) {
      if (typeof value !== 'number') continue;
      
      // Check if value is an outlier (simple z-score)
      const history = this.getMetricHistory(metric);
      if (history.length > 10) {
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        const stdDev = Math.sqrt(
          history.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / history.length
        );
        
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > 3) {
          const novelty = Math.min(1, zScore / 5);
          signals.push({
            id: `statistical-outlier-${metric}-${Date.now()}`,
            type: 'statistical',
            noveltyScore: novelty,
            location: { pattern: metric },
            description: `Statistical outlier: ${metric} = ${value} (z-score: ${zScore.toFixed(2)})`,
            timestamp: new Date()
          });
        }
      }
    }
    
    return signals;
  }
  
  /**
   * Detect behavioral novelty
   */
  private detectBehavioralNovelty(behavior: any): NoveltySignal[] {
    const signals: NoveltySignal[] = [];
    
    // Look for unexpected execution patterns
    if (behavior.executionPaths) {
      for (const path of behavior.executionPaths) {
        const pathKey = path.signature || path.id;
        const novelty = this.calculatePatternNovelty(`exec-path-${pathKey}`);
        
        if (novelty > 0.6) {
          signals.push({
            id: `behavioral-path-${Date.now()}`,
            type: 'behavioral',
            noveltyScore: novelty,
            location: { pattern: pathKey },
            description: `Novel execution path: ${path.description || pathKey}`,
            timestamp: new Date()
          });
        }
      }
    }
    
    // Look for performance anomalies
    if (behavior.performance) {
      const perfKey = `perf-${behavior.performance.category}`;
      const novelty = this.calculatePatternNovelty(perfKey);
      
      if (novelty > 0.5 && behavior.performance.anomaly) {
        signals.push({
          id: `behavioral-perf-${Date.now()}`,
          type: 'behavioral',
          noveltyScore: novelty,
          location: { pattern: perfKey },
          description: `Performance anomaly: ${behavior.performance.description}`,
          timestamp: new Date()
        });
      }
    }
    
    return signals;
  }
  
  /**
   * Generate hypotheses from novelty signals
   */
  private async generateHypotheses(signal: NoveltySignal): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];
    
    switch (signal.type) {
      case 'structural':
        hypotheses.push(...this.generateStructuralHypotheses(signal));
        break;
      case 'behavioral':
        hypotheses.push(...this.generateBehavioralHypotheses(signal));
        break;
      case 'statistical':
        hypotheses.push(...this.generateStatisticalHypotheses(signal));
        break;
      case 'temporal':
        hypotheses.push(...this.generateTemporalHypotheses(signal));
        break;
      case 'relational':
        hypotheses.push(...this.generateRelationalHypotheses(signal));
        break;
    }
    
    // Prioritize hypotheses
    const prioritized = this.prioritizeHypotheses(hypotheses);
    
    this.emit('hypotheses-generated', {
      signal,
      hypotheses: prioritized
    });
    
    return prioritized;
  }
  
  /**
   * Generate structural hypotheses
   */
  private generateStructuralHypotheses(signal: NoveltySignal): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    
    if (signal.description.includes('high fan-out')) {
      hypotheses.push({
        id: `hyp-fanout-${signal.id}`,
        question: 'Does high fan-out correlate with higher bug density?',
        type: 'correlation',
        noveltySource: signal,
        testableConditions: [
          'Measure bug density in high fan-out modules',
          'Compare with average fan-out modules',
          'Control for module size and complexity'
        ],
        expectedOutcome: {
          correlation: 'positive',
          strength: 'moderate'
        },
        confidence: 0.6,
        priority: signal.noveltyScore * 0.8,
        status: 'proposed'
      });
      
      hypotheses.push({
        id: `hyp-refactor-${signal.id}`,
        question: 'Can fan-out be reduced without losing functionality?',
        type: 'optimization',
        noveltySource: signal,
        testableConditions: [
          'Identify common dependency patterns',
          'Propose abstraction layers',
          'Simulate refactoring impact'
        ],
        expectedOutcome: {
          reduction: '30-50%',
          sideEffects: 'minimal'
        },
        confidence: 0.4,
        priority: signal.noveltyScore * 0.6,
        status: 'proposed'
      });
    }
    
    if (signal.description.includes('isolated')) {
      hypotheses.push({
        id: `hyp-dead-code-${signal.id}`,
        question: 'Is this isolated symbol dead code?',
        type: 'anomaly',
        noveltySource: signal,
        testableConditions: [
          'Check for dynamic references',
          'Analyze test coverage',
          'Search for reflection usage'
        ],
        expectedOutcome: {
          deadCode: true,
          probability: 0.7
        },
        confidence: 0.7,
        priority: signal.noveltyScore * 0.9,
        status: 'proposed'
      });
    }
    
    return hypotheses;
  }
  
  /**
   * Generate behavioral hypotheses
   */
  private generateBehavioralHypotheses(signal: NoveltySignal): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    
    if (signal.description.includes('execution path')) {
      hypotheses.push({
        id: `hyp-path-${signal.id}`,
        question: 'Is this novel path a performance optimization opportunity?',
        type: 'optimization',
        noveltySource: signal,
        testableConditions: [
          'Profile path execution time',
          'Identify bottlenecks',
          'Compare with alternative paths'
        ],
        expectedOutcome: {
          optimizationPotential: 'high',
          estimatedGain: '20-40%'
        },
        confidence: 0.5,
        priority: signal.noveltyScore * 0.7,
        status: 'proposed'
      });
    }
    
    if (signal.description.includes('pattern combination')) {
      hypotheses.push({
        id: `hyp-pattern-${signal.id}`,
        question: 'Does this pattern combination indicate a design pattern?',
        type: 'pattern',
        noveltySource: signal,
        testableConditions: [
          'Compare with known design patterns',
          'Analyze structural similarities',
          'Check for intentional design'
        ],
        expectedOutcome: {
          isDesignPattern: true,
          patternType: 'unknown'
        },
        confidence: 0.6,
        priority: signal.noveltyScore * 0.8,
        status: 'proposed'
      });
    }
    
    return hypotheses;
  }
  
  /**
   * Generate statistical hypotheses
   */
  private generateStatisticalHypotheses(signal: NoveltySignal): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    
    if (signal.description.includes('outlier')) {
      hypotheses.push({
        id: `hyp-outlier-${signal.id}`,
        question: 'Is this statistical outlier indicative of a bug or feature?',
        type: 'anomaly',
        noveltySource: signal,
        testableConditions: [
          'Analyze historical context',
          'Check for recent changes',
          'Compare with similar metrics'
        ],
        expectedOutcome: {
          classification: 'unknown',
          probability: {
            bug: 0.3,
            feature: 0.5,
            noise: 0.2
          }
        },
        confidence: 0.4,
        priority: signal.noveltyScore * 0.9,
        status: 'proposed'
      });
    }
    
    return hypotheses;
  }
  
  /**
   * Generate temporal hypotheses
   */
  private generateTemporalHypotheses(signal: NoveltySignal): Hypothesis[] {
    return [{
      id: `hyp-temporal-${signal.id}`,
      question: 'Does this temporal pattern predict future behavior?',
      type: 'correlation',
      noveltySource: signal,
      testableConditions: [
        'Analyze historical patterns',
        'Build predictive model',
        'Validate on recent data'
      ],
      expectedOutcome: {
        predictive: true,
        accuracy: 'unknown'
      },
      confidence: 0.5,
      priority: signal.noveltyScore * 0.6,
      status: 'proposed'
    }];
  }
  
  /**
   * Generate relational hypotheses
   */
  private generateRelationalHypotheses(signal: NoveltySignal): Hypothesis[] {
    return [{
      id: `hyp-relational-${signal.id}`,
      question: 'Does this relationship pattern indicate hidden coupling?',
      type: 'pattern',
      noveltySource: signal,
      testableConditions: [
        'Analyze change propagation',
        'Measure coupling metrics',
        'Identify common changes'
      ],
      expectedOutcome: {
        hiddenCoupling: true,
        strength: 'unknown'
      },
      confidence: 0.6,
      priority: signal.noveltyScore * 0.7,
      status: 'proposed'
    }];
  }
  
  /**
   * Design experiment to test hypothesis
   */
  async designExperiment(hypothesis: Hypothesis): Promise<Experiment> {
    const experiment: Experiment = {
      id: `exp-${hypothesis.id}-${Date.now()}`,
      hypothesis,
      design: {
        controlGroup: this.selectControlGroup(hypothesis),
        testGroup: this.selectTestGroup(hypothesis),
        variables: this.identifyVariables(hypothesis),
        metrics: this.selectMetrics(hypothesis)
      },
      budget: this.calculateExperimentBudget(hypothesis)
    };
    
    this.experiments.set(experiment.id, experiment);
    
    this.emit('experiment-designed', experiment);
    
    return experiment;
  }
  
  /**
   * Run experiment
   */
  async runExperiment(experiment: Experiment): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check budget
      if (!this.checkBudget(experiment.budget)) {
        experiment.results = {
          outcome: 'budget-exceeded',
          confidence: 0,
          insights: ['Experiment skipped due to budget constraints']
        };
        return;
      }
      
      // Run experiment based on hypothesis type
      const results = await this.executeExperiment(experiment);
      
      experiment.results = results;
      
      // Update hypothesis status
      const hypothesis = experiment.hypothesis;
      if (results.confidence > 0.7) {
        hypothesis.status = results.outcome.validated ? 'validated' : 'rejected';
      } else {
        hypothesis.status = 'inconclusive';
      }
      
      // Update budget usage
      this.explorationBudgetUsed.timeMs += Date.now() - startTime;
      
      // Learn from results
      await this.learnFromExperiment(experiment);
      
      this.emit('experiment-completed', experiment);
      
    } catch (error) {
      experiment.results = {
        outcome: 'error',
        confidence: 0,
        insights: [`Experiment failed: ${error}`]
      };
    }
  }
  
  /**
   * Execute experiment based on type
   */
  private async executeExperiment(experiment: Experiment): Promise<any> {
    const { hypothesis } = experiment;
    
    switch (hypothesis.type) {
      case 'correlation':
        return this.executeCorrelationExperiment(experiment);
      case 'causation':
        return this.executeCausationExperiment(experiment);
      case 'pattern':
        return this.executePatternExperiment(experiment);
      case 'anomaly':
        return this.executeAnomalyExperiment(experiment);
      case 'optimization':
        return this.executeOptimizationExperiment(experiment);
      default:
        return {
          outcome: 'unknown-type',
          confidence: 0,
          insights: ['Unknown hypothesis type']
        };
    }
  }
  
  /**
   * Execute correlation experiment
   */
  private async executeCorrelationExperiment(experiment: Experiment): Promise<any> {
    // Simplified correlation test
    const { controlGroup, testGroup, metrics } = experiment.design;
    
    // Simulate measurement
    const controlMeasurements = metrics.map(() => Math.random());
    const testMeasurements = metrics.map(() => Math.random() * 1.5); // Assume some correlation
    
    // Calculate correlation coefficient
    const correlation = this.calculateCorrelation(controlMeasurements, testMeasurements);
    
    return {
      outcome: {
        validated: Math.abs(correlation) > 0.3,
        correlation,
        measurements: {
          control: controlMeasurements,
          test: testMeasurements
        }
      },
      confidence: Math.min(1, Math.abs(correlation) * 2),
      insights: [
        `Correlation coefficient: ${correlation.toFixed(3)}`,
        correlation > 0.3 ? 'Positive correlation detected' : 
        correlation < -0.3 ? 'Negative correlation detected' : 
        'No significant correlation'
      ]
    };
  }
  
  /**
   * Execute pattern experiment
   */
  private async executePatternExperiment(experiment: Experiment): Promise<any> {
    // Simulate pattern matching
    const patternMatch = Math.random() > 0.3;
    const confidence = patternMatch ? 0.8 : 0.2;
    
    return {
      outcome: {
        validated: patternMatch,
        patternType: patternMatch ? 'structural-pattern-x' : 'none',
        instances: patternMatch ? Math.floor(Math.random() * 10) + 1 : 0
      },
      confidence,
      insights: [
        patternMatch ? 'Pattern match confirmed' : 'No pattern match found',
        `Found in ${experiment.design.testGroup.length} locations`
      ]
    };
  }
  
  /**
   * Execute other experiment types (simplified)
   */
  private async executeCausationExperiment(experiment: Experiment): Promise<any> {
    return {
      outcome: { validated: false, causation: 'inconclusive' },
      confidence: 0.4,
      insights: ['Causation testing requires more data']
    };
  }
  
  private async executeAnomalyExperiment(experiment: Experiment): Promise<any> {
    const isAnomaly = Math.random() > 0.6;
    return {
      outcome: { validated: isAnomaly, anomalyType: isAnomaly ? 'statistical' : 'none' },
      confidence: 0.7,
      insights: [isAnomaly ? 'Anomaly confirmed' : 'Not an anomaly']
    };
  }
  
  private async executeOptimizationExperiment(experiment: Experiment): Promise<any> {
    const improvement = Math.random() * 0.4; // 0-40% improvement
    return {
      outcome: { 
        validated: improvement > 0.1, 
        improvement: improvement,
        optimizationType: 'performance'
      },
      confidence: 0.6,
      insights: [`Potential improvement: ${(improvement * 100).toFixed(1)}%`]
    };
  }
  
  /**
   * Learn from experiment results
   */
  private async learnFromExperiment(experiment: Experiment): Promise<void> {
    const { hypothesis, results } = experiment;
    
    if (!results) return;
    
    // Update pattern knowledge
    const patternKey = `${hypothesis.type}-${hypothesis.noveltySource.type}`;
    const currentInterest = this.interestingPatterns.get(patternKey) || 0.5;
    
    if (results.outcome.validated) {
      // Increase interest in validated patterns
      this.interestingPatterns.set(patternKey, Math.min(1, currentInterest + 0.1));
      
      // Mark pattern as known if highly validated
      if (results.confidence > 0.8) {
        this.knownPatterns.add(patternKey);
      }
    } else {
      // Decrease interest in rejected patterns
      this.interestingPatterns.set(patternKey, Math.max(0, currentInterest - 0.05));
    }
    
    // Generate new hypotheses based on results
    if (results.confidence > 0.6 && results.outcome.validated) {
      // Success leads to deeper exploration
      const followUpSignal: NoveltySignal = {
        ...hypothesis.noveltySource,
        id: `followup-${hypothesis.noveltySource.id}`,
        noveltyScore: hypothesis.noveltySource.noveltyScore * 0.8,
        description: `Follow-up to validated hypothesis: ${hypothesis.question}`
      };
      
      const newHypotheses = await this.generateHypotheses(followUpSignal);
      for (const hyp of newHypotheses) {
        this.hypotheses.set(hyp.id, hyp);
      }
    }
    
    this.emit('learning-from-experiment', {
      experiment,
      patternUpdate: { key: patternKey, interest: this.interestingPatterns.get(patternKey) },
      newHypotheses: results.outcome.validated ? 'generated' : 'none'
    });
  }
  
  /**
   * Helper methods
   */
  
  private calculatePatternNovelty(patternKey: string): number {
    if (this.knownPatterns.has(patternKey)) {
      return 0; // Already known
    }
    
    const baseNovelty = 1.0;
    const interest = this.interestingPatterns.get(patternKey) || baseNovelty;
    
    // Apply decay based on how often we've seen similar patterns
    const similarCount = Array.from(this.knownPatterns).filter(p => 
      p.startsWith(patternKey.split('-')[0])
    ).length;
    
    const novelty = interest * Math.exp(-similarCount * 0.1);
    
    return Math.max(0, Math.min(1, novelty));
  }
  
  private applyInterestDecay(signal: NoveltySignal): number {
    const age = Date.now() - signal.timestamp.getTime();
    const decayFactor = Math.exp(-age * this.config.interestDecayRate / 3600000); // Per hour
    return signal.noveltyScore * decayFactor;
  }
  
  private detectCycles(graph: SymbolGraph, startNode: string): string[][] {
    // Simplified cycle detection
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];
    
    const dfs = (node: string) => {
      if (path.includes(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      path.push(node);
      
      const symbol = graph.symbols.get(node);
      if (symbol) {
        for (const dep of symbol.dependencies) {
          dfs(dep);
        }
      }
      
      path.pop();
    };
    
    dfs(startNode);
    return cycles;
  }
  
  private getMetricHistory(metric: string): number[] {
    // Placeholder - would integrate with actual metric storage
    return Array(20).fill(0).map(() => Math.random() * 100);
  }
  
  private prioritizeHypotheses(hypotheses: Hypothesis[]): Hypothesis[] {
    const prioritized = [...hypotheses];
    
    switch (this.config.hypothesisPrioritization) {
      case 'novelty':
        prioritized.sort((a, b) => b.noveltySource.noveltyScore - a.noveltySource.noveltyScore);
        break;
      case 'impact':
        prioritized.sort((a, b) => b.priority - a.priority);
        break;
      case 'feasibility':
        prioritized.sort((a, b) => a.testableConditions.length - b.testableConditions.length);
        break;
      case 'balanced':
        prioritized.sort((a, b) => {
          const scoreA = a.priority * a.confidence * (1 / (a.testableConditions.length + 1));
          const scoreB = b.priority * b.confidence * (1 / (b.testableConditions.length + 1));
          return scoreB - scoreA;
        });
        break;
    }
    
    return prioritized;
  }
  
  private selectControlGroup(hypothesis: Hypothesis): any {
    // Placeholder - would select appropriate control based on hypothesis
    return { type: 'control', size: 10 };
  }
  
  private selectTestGroup(hypothesis: Hypothesis): any {
    // Placeholder - would select appropriate test group
    return { type: 'test', size: 10 };
  }
  
  private identifyVariables(hypothesis: Hypothesis): string[] {
    // Extract variables from hypothesis
    return hypothesis.testableConditions.map((_, i) => `var${i}`);
  }
  
  private selectMetrics(hypothesis: Hypothesis): string[] {
    // Select appropriate metrics based on hypothesis type
    switch (hypothesis.type) {
      case 'correlation':
        return ['metric1', 'metric2'];
      case 'optimization':
        return ['performance', 'memory', 'complexity'];
      case 'pattern':
        return ['frequency', 'consistency', 'coverage'];
      default:
        return ['generic_metric'];
    }
  }
  
  private calculateExperimentBudget(hypothesis: Hypothesis): any {
    return {
      timeMs: hypothesis.testableConditions.length * 1000,
      memoryMB: 10,
      complexity: hypothesis.testableConditions.length
    };
  }
  
  private checkBudget(budget: any): boolean {
    const totalBudgetMs = this.config.explorationBudget.timePercentage * 3600000; // Per hour
    return this.explorationBudgetUsed.timeMs + budget.timeMs < totalBudgetMs;
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return den === 0 ? 0 : num / den;
  }
  
  /**
   * Start exploration cycle
   */
  private startExplorationCycle(): void {
    setInterval(async () => {
      // Get top hypothesis to test
      const untested = Array.from(this.hypotheses.values())
        .filter(h => h.status === 'proposed')
        .sort((a, b) => b.priority - a.priority);
      
      if (untested.length > 0) {
        const hypothesis = untested[0];
        hypothesis.status = 'testing';
        
        // Design and run experiment
        const experiment = await this.designExperiment(hypothesis);
        await this.runExperiment(experiment);
      }
      
      // Clean up old experiments
      this.cleanupOldExperiments();
      
    }, 30000); // Every 30 seconds
  }
  
  private cleanupOldExperiments(): void {
    const cutoff = Date.now() - 3600000; // 1 hour
    
    for (const [id, experiment] of this.experiments) {
      if (experiment.hypothesis.noveltySource.timestamp.getTime() < cutoff) {
        this.experiments.delete(id);
      }
    }
  }
  
  /**
   * Get curiosity analytics
   */
  getCuriosityAnalytics(): CuriosityMetrics & {
    activeHypotheses: number;
    validatedHypotheses: number;
    totalExperiments: number;
    budgetUsage: {
      timePercentage: number;
      memoryMB: number;
    };
    topPatterns: Array<{ pattern: string; interest: number }>;
  } {
    const hypothesesArray = Array.from(this.hypotheses.values());
    const experimentsArray = Array.from(this.experiments.values());
    
    const validated = hypothesesArray.filter(h => h.status === 'validated').length;
    const total = hypothesesArray.length;
    
    const hourlyBudget = this.config.explorationBudget.timePercentage * 3600000;
    const timeUsagePercent = (this.explorationBudgetUsed.timeMs / hourlyBudget) * 100;
    
    const topPatterns = Array.from(this.interestingPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, interest]) => ({ pattern, interest }));
    
    return {
      noveltyDetectionRate: this.noveltyHistory.size / Math.max(1, experimentsArray.length),
      hypothesisGenerationRate: hypothesesArray.length / Math.max(1, this.noveltyHistory.size),
      validationSuccessRate: validated / Math.max(1, total),
      explorationEfficiency: validated / Math.max(1, this.explorationBudgetUsed.timeMs / 1000),
      knowledgeGainRate: this.knownPatterns.size / Math.max(1, total),
      activeHypotheses: hypothesesArray.filter(h => h.status === 'testing').length,
      validatedHypotheses: validated,
      totalExperiments: experimentsArray.length,
      budgetUsage: {
        timePercentage: timeUsagePercent,
        memoryMB: this.explorationBudgetUsed.memoryMB
      },
      topPatterns
    };
  }
}