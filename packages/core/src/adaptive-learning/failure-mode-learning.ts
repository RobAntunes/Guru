/**
 * Failure Mode Learning System
 * 
 * Learns from mistakes, failures, and edge cases to improve system resilience.
 * Implements preventive learning and graceful degradation strategies.
 */

import { EventEmitter } from 'events';
import { LearningOutcome } from './unified-learning-coordinator.js';

export interface FailureMode {
  id: string;
  type: 'false-positive' | 'false-negative' | 'timeout' | 'resource-exhaustion' | 
        'confidence-miscalibration' | 'pattern-mismatch' | 'integration-error' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: {
    component: string;
    operation: string;
    inputs: any;
    expectedOutcome: any;
    actualOutcome: any;
    environment: any;
  };
  rootCause?: RootCauseAnalysis;
  timestamp: Date;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  causalChain: string[];
  confidence: number;
  evidence: Array<{
    type: string;
    description: string;
    data: any;
  }>;
}

export interface FailurePattern {
  id: string;
  name: string;
  description: string;
  instances: FailureMode[];
  commonalities: {
    contexts: string[];
    conditions: string[];
    symptoms: string[];
  };
  predictors: FailurePredictor[];
  preventionStrategies: PreventionStrategy[];
}

export interface FailurePredictor {
  name: string;
  conditions: Array<{
    metric: string;
    operator: '>' | '<' | '==' | '!=' | 'contains' | 'matches';
    value: any;
  }>;
  confidence: number;
  leadTime: number; // ms before failure
}

export interface PreventionStrategy {
  id: string;
  name: string;
  type: 'proactive' | 'reactive' | 'adaptive';
  trigger: FailurePredictor;
  actions: Array<{
    type: 'throttle' | 'fallback' | 'cache' | 'simplify' | 'abort' | 'retry';
    parameters: any;
  }>;
  effectiveness: number;
  sideEffects: string[];
}

export interface GracefulDegradation {
  mode: string;
  capabilities: string[];
  limitations: string[];
  performance: number; // 0-1, relative to full capability
  activationConditions: string[];
}

export interface FailureLearningConfig {
  failureThreshold: number; // Confidence below this = failure
  patternDetectionMinInstances: number;
  rootCauseAnalysisDepth: number;
  preventionAggressiveness: number; // 0-1, how eager to prevent
  gracefulDegradationLevels: number;
  memoryRetentionDays: number;
}

export class FailureModeLearning extends EventEmitter {
  private failures: Map<string, FailureMode> = new Map();
  private patterns: Map<string, FailurePattern> = new Map();
  private preventionStrategies: Map<string, PreventionStrategy> = new Map();
  private degradationModes: Map<string, GracefulDegradation> = new Map();
  private activePrevention: Set<string> = new Set();
  private metrics: {
    totalFailures: number;
    preventedFailures: number;
    patternsDetected: number;
    falseAlarms: number;
    recoverySuccess: number;
  } = {
    totalFailures: 0,
    preventedFailures: 0,
    patternsDetected: 0,
    falseAlarms: 0,
    recoverySuccess: 0
  };
  
  constructor(private config: FailureLearningConfig) {
    super();
    this.initializeDegradationModes();
    this.startFailureAnalysis();
  }
  
  /**
   * Record and analyze a failure
   */
  async recordFailure(
    failure: Omit<FailureMode, 'id' | 'timestamp' | 'rootCause'>
  ): Promise<{
    analysis: RootCauseAnalysis | null;
    pattern: FailurePattern | null;
    prevention: PreventionStrategy | null;
  }> {
    const failureMode: FailureMode = {
      ...failure,
      id: `failure-${failure.type}-${Date.now()}`,
      timestamp: new Date()
    };
    
    // Perform root cause analysis
    const rootCause = await this.analyzeRootCause(failureMode);
    if (rootCause) {
      failureMode.rootCause = rootCause;
    }
    
    // Store failure
    this.failures.set(failureMode.id, failureMode);
    this.metrics.totalFailures++;
    
    // Detect patterns
    const pattern = await this.detectFailurePattern(failureMode);
    
    // Generate prevention strategy
    const prevention = pattern ? await this.generatePreventionStrategy(pattern) : null;
    
    // Learn from failure
    await this.learnFromFailure(failureMode, pattern, prevention);
    
    this.emit('failure-analyzed', {
      failure: failureMode,
      rootCause,
      pattern,
      prevention
    });
    
    return {
      analysis: rootCause,
      pattern,
      prevention
    };
  }
  
  /**
   * Analyze root cause of failure
   */
  private async analyzeRootCause(failure: FailureMode): Promise<RootCauseAnalysis | null> {
    const evidence: any[] = [];
    const contributingFactors: string[] = [];
    const causalChain: string[] = [];
    
    // Analyze based on failure type
    switch (failure.type) {
      case 'false-positive':
        return this.analyzeFalsePositive(failure);
        
      case 'timeout':
        return this.analyzeTimeout(failure);
        
      case 'resource-exhaustion':
        return this.analyzeResourceExhaustion(failure);
        
      case 'confidence-miscalibration':
        return this.analyzeConfidenceMiscalibration(failure);
        
      case 'pattern-mismatch':
        return this.analyzePatternMismatch(failure);
        
      default:
        return this.analyzeGenericFailure(failure);
    }
  }
  
  /**
   * Analyze false positive failure
   */
  private analyzeFalsePositive(failure: FailureMode): RootCauseAnalysis {
    const evidence: any[] = [];
    const factors: string[] = [];
    
    // Check if threshold was too sensitive
    if (failure.context.inputs?.threshold && failure.context.inputs.threshold < 0.3) {
      factors.push('Overly sensitive detection threshold');
      evidence.push({
        type: 'configuration',
        description: 'Low threshold setting',
        data: { threshold: failure.context.inputs.threshold }
      });
    }
    
    // Check if pattern was overfit
    if (failure.context.inputs?.patternMatches > 10) {
      factors.push('Pattern overfitting to training data');
      evidence.push({
        type: 'statistical',
        description: 'High pattern match count suggests overfitting',
        data: { matches: failure.context.inputs.patternMatches }
      });
    }
    
    // Check environmental factors
    if (failure.context.environment?.noise > 0.5) {
      factors.push('High environmental noise');
      evidence.push({
        type: 'environmental',
        description: 'Noisy environment affecting detection',
        data: { noiseLevel: failure.context.environment.noise }
      });
    }
    
    return {
      primaryCause: factors[0] || 'Unknown false positive cause',
      contributingFactors: factors.slice(1),
      causalChain: [
        'Initial detection triggered',
        'Confidence calculation inflated',
        'Threshold exceeded despite invalid match',
        'False positive reported'
      ],
      confidence: 0.7,
      evidence
    };
  }
  
  /**
   * Analyze timeout failure
   */
  private analyzeTimeout(failure: FailureMode): RootCauseAnalysis {
    const evidence: any[] = [];
    const factors: string[] = [];
    
    // Check computation complexity
    if (failure.context.inputs?.complexity > 1000) {
      factors.push('Excessive computational complexity');
      evidence.push({
        type: 'performance',
        description: 'High complexity input',
        data: { complexity: failure.context.inputs.complexity }
      });
    }
    
    // Check resource contention
    if (failure.context.environment?.cpuUsage > 0.8) {
      factors.push('Resource contention');
      evidence.push({
        type: 'resource',
        description: 'High CPU usage during operation',
        data: { cpuUsage: failure.context.environment.cpuUsage }
      });
    }
    
    // Check for infinite loops
    if (failure.context.actualOutcome?.loopDetected) {
      factors.push('Potential infinite loop');
      evidence.push({
        type: 'algorithmic',
        description: 'Loop detection triggered',
        data: { location: failure.context.actualOutcome.loopLocation }
      });
    }
    
    return {
      primaryCause: factors[0] || 'Execution time exceeded limit',
      contributingFactors: factors.slice(1),
      causalChain: [
        'Operation initiated',
        'Processing began normally',
        'Execution time increased unexpectedly',
        'Timeout threshold reached',
        'Operation aborted'
      ],
      confidence: 0.8,
      evidence
    };
  }
  
  /**
   * Analyze resource exhaustion
   */
  private analyzeResourceExhaustion(failure: FailureMode): RootCauseAnalysis {
    const evidence: any[] = [];
    const factors: string[] = [];
    
    // Memory leak detection
    if (failure.context.environment?.memoryGrowthRate > 10) {
      factors.push('Memory leak detected');
      evidence.push({
        type: 'memory',
        description: 'Rapid memory growth',
        data: { growthRate: failure.context.environment.memoryGrowthRate }
      });
    }
    
    // Unbounded data structures
    if (failure.context.inputs?.dataSize > 1000000) {
      factors.push('Unbounded data structure growth');
      evidence.push({
        type: 'data',
        description: 'Large data structure size',
        data: { size: failure.context.inputs.dataSize }
      });
    }
    
    return {
      primaryCause: factors[0] || 'Resource limit exceeded',
      contributingFactors: factors.slice(1),
      causalChain: [
        'Resource allocation started',
        'Usage grew beyond expectations',
        'No cleanup or limits applied',
        'System resource exhausted'
      ],
      confidence: 0.85,
      evidence
    };
  }
  
  /**
   * Analyze confidence miscalibration
   */
  private analyzeConfidenceMiscalibration(failure: FailureMode): RootCauseAnalysis {
    const evidence: any[] = [];
    const factors: string[] = [];
    
    const expectedConf = failure.context.expectedOutcome?.confidence || 0;
    const actualConf = failure.context.actualOutcome?.confidence || 0;
    const delta = Math.abs(expectedConf - actualConf);
    
    if (delta > 0.3) {
      factors.push(`Large confidence delta: ${delta.toFixed(2)}`);
      evidence.push({
        type: 'calibration',
        description: 'Significant confidence mismatch',
        data: { expected: expectedConf, actual: actualConf, delta }
      });
    }
    
    // Check for overconfidence
    if (actualConf > 0.8 && failure.context.actualOutcome?.correct === false) {
      factors.push('Overconfidence in incorrect prediction');
      evidence.push({
        type: 'prediction',
        description: 'High confidence despite being wrong',
        data: { confidence: actualConf, correct: false }
      });
    }
    
    return {
      primaryCause: 'Confidence calibration error',
      contributingFactors: factors,
      causalChain: [
        'Prediction made with confidence estimate',
        'Confidence calculation used incomplete information',
        'Calibration model outdated or biased',
        'Miscalibrated confidence reported'
      ],
      confidence: 0.75,
      evidence
    };
  }
  
  /**
   * Analyze pattern mismatch
   */
  private analyzePatternMismatch(failure: FailureMode): RootCauseAnalysis {
    const evidence: any[] = [];
    const factors: string[] = [];
    
    // Check pattern drift
    if (failure.context.inputs?.patternAge > 30) {
      factors.push('Pattern drift over time');
      evidence.push({
        type: 'temporal',
        description: 'Old pattern no longer valid',
        data: { patternAgeDays: failure.context.inputs.patternAge }
      });
    }
    
    // Check context change
    if (failure.context.environment?.contextChanged) {
      factors.push('Context changed since pattern learned');
      evidence.push({
        type: 'contextual',
        description: 'Environmental context shift',
        data: failure.context.environment.changes
      });
    }
    
    return {
      primaryCause: factors[0] || 'Pattern no longer matches reality',
      contributingFactors: factors.slice(1),
      causalChain: [
        'Pattern applied to input',
        'Expected match not found',
        'Fallback matching attempted',
        'No valid match identified'
      ],
      confidence: 0.7,
      evidence
    };
  }
  
  /**
   * Analyze generic failure
   */
  private analyzeGenericFailure(failure: FailureMode): RootCauseAnalysis {
    return {
      primaryCause: 'Generic failure - requires investigation',
      contributingFactors: [
        'Unexpected input conditions',
        'System state inconsistency',
        'External dependency failure'
      ],
      causalChain: [
        'Operation attempted',
        'Unexpected condition encountered',
        'Error propagated',
        'Failure recorded'
      ],
      confidence: 0.4,
      evidence: [{
        type: 'generic',
        description: 'Basic failure information',
        data: failure.context
      }]
    };
  }
  
  /**
   * Detect failure patterns
   */
  private async detectFailurePattern(failure: FailureMode): Promise<FailurePattern | null> {
    const similarFailures = this.findSimilarFailures(failure);
    
    if (similarFailures.length < this.config.patternDetectionMinInstances) {
      return null;
    }
    
    // Extract commonalities
    const commonalities = this.extractCommonalities(similarFailures);
    
    // Check if pattern already exists
    for (const [id, pattern] of this.patterns) {
      if (this.matchesPattern(failure, pattern)) {
        // Update pattern with new instance
        pattern.instances.push(failure);
        this.updatePatternCommonalities(pattern);
        return pattern;
      }
    }
    
    // Create new pattern
    const pattern: FailurePattern = {
      id: `pattern-${Date.now()}`,
      name: this.generatePatternName(commonalities),
      description: this.generatePatternDescription(commonalities),
      instances: similarFailures,
      commonalities,
      predictors: await this.generatePredictors(similarFailures, commonalities),
      preventionStrategies: []
    };
    
    this.patterns.set(pattern.id, pattern);
    this.metrics.patternsDetected++;
    
    return pattern;
  }
  
  /**
   * Generate prevention strategy
   */
  private async generatePreventionStrategy(pattern: FailurePattern): Promise<PreventionStrategy | null> {
    if (pattern.predictors.length === 0) {
      return null;
    }
    
    // Select best predictor
    const bestPredictor = pattern.predictors
      .sort((a, b) => b.confidence * b.leadTime - a.confidence * a.leadTime)[0];
    
    // Generate strategy based on pattern type
    const strategy: PreventionStrategy = {
      id: `prevention-${pattern.id}-${Date.now()}`,
      name: `Prevent ${pattern.name}`,
      type: bestPredictor.leadTime > 5000 ? 'proactive' : 'reactive',
      trigger: bestPredictor,
      actions: this.generatePreventionActions(pattern),
      effectiveness: 0, // Will be updated based on results
      sideEffects: this.identifySideEffects(pattern)
    };
    
    // Add to pattern
    pattern.preventionStrategies.push(strategy);
    this.preventionStrategies.set(strategy.id, strategy);
    
    return strategy;
  }
  
  /**
   * Predict potential failure
   */
  async predictFailure(context: any): Promise<{
    prediction: boolean;
    confidence: number;
    pattern?: FailurePattern;
    preventionStrategy?: PreventionStrategy;
  }> {
    let highestRisk = 0;
    let riskPattern: FailurePattern | undefined;
    let prevention: PreventionStrategy | undefined;
    
    // Check all patterns
    for (const [_, pattern] of this.patterns) {
      for (const predictor of pattern.predictors) {
        if (this.evaluatePredictor(predictor, context)) {
          const risk = predictor.confidence;
          if (risk > highestRisk) {
            highestRisk = risk;
            riskPattern = pattern;
            prevention = pattern.preventionStrategies[0]; // Use first strategy
          }
        }
      }
    }
    
    // Apply prevention if high risk
    if (highestRisk > 0.7 && prevention) {
      await this.applyPrevention(prevention, context);
    }
    
    return {
      prediction: highestRisk > 0.5,
      confidence: highestRisk,
      pattern: riskPattern,
      preventionStrategy: prevention
    };
  }
  
  /**
   * Apply prevention strategy
   */
  private async applyPrevention(strategy: PreventionStrategy, context: any): Promise<void> {
    if (this.activePrevention.has(strategy.id)) {
      return; // Already active
    }
    
    this.activePrevention.add(strategy.id);
    
    try {
      for (const action of strategy.actions) {
        await this.executePreventionAction(action, context);
      }
      
      this.metrics.preventedFailures++;
      
      // Update effectiveness
      strategy.effectiveness = (strategy.effectiveness * 0.9) + 0.1;
      
      this.emit('prevention-applied', {
        strategy,
        context,
        success: true
      });
      
    } catch (error) {
      // Prevention failed
      strategy.effectiveness = strategy.effectiveness * 0.9;
      
      this.emit('prevention-failed', {
        strategy,
        context,
        error
      });
    } finally {
      this.activePrevention.delete(strategy.id);
    }
  }
  
  /**
   * Execute prevention action
   */
  private async executePreventionAction(action: any, context: any): Promise<void> {
    switch (action.type) {
      case 'throttle':
        // Reduce processing rate
        context.throttleRate = action.parameters.rate || 0.5;
        break;
        
      case 'fallback':
        // Switch to fallback mode
        context.useFallback = true;
        context.fallbackMethod = action.parameters.method;
        break;
        
      case 'cache':
        // Enable aggressive caching
        context.cacheEnabled = true;
        context.cacheTTL = action.parameters.ttl || 60000;
        break;
        
      case 'simplify':
        // Reduce complexity
        context.simplified = true;
        context.simplificationLevel = action.parameters.level || 1;
        break;
        
      case 'abort':
        // Abort risky operation
        throw new Error('Operation aborted by prevention strategy');
        
      case 'retry':
        // Configure retry parameters
        context.retryEnabled = true;
        context.maxRetries = action.parameters.maxRetries || 3;
        context.retryDelay = action.parameters.delay || 1000;
        break;
    }
  }
  
  /**
   * Implement graceful degradation
   */
  async activateDegradation(level: number): Promise<GracefulDegradation> {
    const mode = this.selectDegradationMode(level);
    
    if (!mode) {
      throw new Error('No degradation mode available for level ' + level);
    }
    
    // Apply degradation
    this.emit('degradation-activated', mode);
    
    return mode;
  }
  
  /**
   * Learn from failure
   */
  private async learnFromFailure(
    failure: FailureMode,
    pattern: FailurePattern | null,
    prevention: PreventionStrategy | null
  ): Promise<void> {
    // Update pattern confidence
    if (pattern) {
      // Increase predictor confidence for predictors that would have caught this
      for (const predictor of pattern.predictors) {
        if (this.evaluatePredictor(predictor, failure.context)) {
          predictor.confidence = Math.min(1, predictor.confidence * 1.1);
        }
      }
    }
    
    // Generate new predictors based on failure
    if (failure.rootCause) {
      const newPredictors = this.generatePredictorsFromRootCause(failure.rootCause);
      if (pattern) {
        pattern.predictors.push(...newPredictors);
      }
    }
    
    // Update prevention effectiveness
    if (prevention && this.activePrevention.has(prevention.id)) {
      // Prevention was active but still failed
      prevention.effectiveness *= 0.8;
      this.metrics.falseAlarms++;
    }
    
    this.emit('failure-learning-complete', {
      failure,
      pattern,
      updates: {
        predictorsAdded: pattern ? newPredictors.length : 0,
        preventionAdjusted: prevention ? true : false
      }
    });
  }
  
  /**
   * Helper methods
   */
  
  private findSimilarFailures(failure: FailureMode): FailureMode[] {
    const similar: FailureMode[] = [failure];
    
    for (const [_, other] of this.failures) {
      if (other.id === failure.id) continue;
      
      // Check similarity
      if (other.type === failure.type &&
          other.context.component === failure.context.component &&
          this.contextSimilarity(other.context, failure.context) > 0.7) {
        similar.push(other);
      }
    }
    
    return similar;
  }
  
  private contextSimilarity(ctx1: any, ctx2: any): number {
    let similarity = 0;
    let factors = 0;
    
    // Component match
    if (ctx1.component === ctx2.component) {
      similarity += 0.3;
    }
    factors += 0.3;
    
    // Operation match
    if (ctx1.operation === ctx2.operation) {
      similarity += 0.3;
    }
    factors += 0.3;
    
    // Input similarity (simplified)
    if (ctx1.inputs && ctx2.inputs) {
      const keys1 = Object.keys(ctx1.inputs);
      const keys2 = Object.keys(ctx2.inputs);
      const commonKeys = keys1.filter(k => keys2.includes(k));
      similarity += (commonKeys.length / Math.max(keys1.length, keys2.length)) * 0.4;
    }
    factors += 0.4;
    
    return similarity / factors;
  }
  
  private extractCommonalities(failures: FailureMode[]): any {
    const contexts = new Set<string>();
    const conditions = new Set<string>();
    const symptoms = new Set<string>();
    
    for (const failure of failures) {
      contexts.add(failure.context.component);
      contexts.add(failure.context.operation);
      
      // Extract conditions
      if (failure.rootCause) {
        conditions.add(failure.rootCause.primaryCause);
        failure.rootCause.contributingFactors.forEach(f => conditions.add(f));
      }
      
      // Extract symptoms
      if (failure.description) {
        symptoms.add(failure.description);
      }
    }
    
    return {
      contexts: Array.from(contexts),
      conditions: Array.from(conditions),
      symptoms: Array.from(symptoms)
    };
  }
  
  private matchesPattern(failure: FailureMode, pattern: FailurePattern): boolean {
    // Check if failure matches pattern commonalities
    const contextMatch = pattern.commonalities.contexts.includes(failure.context.component) ||
                        pattern.commonalities.contexts.includes(failure.context.operation);
    
    const conditionMatch = failure.rootCause ? 
      pattern.commonalities.conditions.some(c => 
        failure.rootCause!.primaryCause.includes(c) ||
        failure.rootCause!.contributingFactors.some(f => f.includes(c))
      ) : false;
    
    return contextMatch || conditionMatch;
  }
  
  private updatePatternCommonalities(pattern: FailurePattern): void {
    // Recalculate commonalities with new instance
    const newCommonalities = this.extractCommonalities(pattern.instances);
    pattern.commonalities = newCommonalities;
  }
  
  private generatePatternName(commonalities: any): string {
    const component = commonalities.contexts[0] || 'Unknown';
    const condition = commonalities.conditions[0] || 'Failure';
    return `${component} ${condition} Pattern`;
  }
  
  private generatePatternDescription(commonalities: any): string {
    return `Recurring failure in ${commonalities.contexts.join(', ')} ` +
           `caused by ${commonalities.conditions.slice(0, 2).join(' and ')}`;
  }
  
  private async generatePredictors(
    failures: FailureMode[],
    commonalities: any
  ): Promise<FailurePredictor[]> {
    const predictors: FailurePredictor[] = [];
    
    // Generate predictor for each common condition
    for (const condition of commonalities.conditions.slice(0, 3)) {
      predictors.push({
        name: `${condition} detector`,
        conditions: this.generatePredictorConditions(condition, failures),
        confidence: 0.7, // Initial confidence
        leadTime: 5000 // 5 second warning
      });
    }
    
    return predictors;
  }
  
  private generatePredictorConditions(condition: string, failures: FailureMode[]): any[] {
    const conditions: any[] = [];
    
    // Simple heuristics based on condition type
    if (condition.includes('threshold')) {
      conditions.push({
        metric: 'threshold',
        operator: '<',
        value: 0.3
      });
    }
    
    if (condition.includes('timeout')) {
      conditions.push({
        metric: 'executionTime',
        operator: '>',
        value: 10000
      });
    }
    
    if (condition.includes('memory')) {
      conditions.push({
        metric: 'memoryUsage',
        operator: '>',
        value: 0.8
      });
    }
    
    return conditions;
  }
  
  private evaluatePredictor(predictor: FailurePredictor, context: any): boolean {
    for (const condition of predictor.conditions) {
      const value = this.getMetricValue(condition.metric, context);
      
      if (!this.evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }
    
    return true;
  }
  
  private getMetricValue(metric: string, context: any): any {
    // Navigate context to find metric
    const paths = metric.split('.');
    let value = context;
    
    for (const path of paths) {
      value = value?.[path];
    }
    
    return value;
  }
  
  private evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case '>': return value > target;
      case '<': return value < target;
      case '==': return value === target;
      case '!=': return value !== target;
      case 'contains': return String(value).includes(String(target));
      case 'matches': return new RegExp(String(target)).test(String(value));
      default: return false;
    }
  }
  
  private generatePreventionActions(pattern: FailurePattern): any[] {
    const actions: any[] = [];
    
    // Generate actions based on pattern type
    if (pattern.name.includes('timeout')) {
      actions.push({
        type: 'throttle',
        parameters: { rate: 0.5 }
      });
      actions.push({
        type: 'simplify',
        parameters: { level: 2 }
      });
    }
    
    if (pattern.name.includes('memory')) {
      actions.push({
        type: 'cache',
        parameters: { ttl: 300000 }
      });
      actions.push({
        type: 'simplify',
        parameters: { level: 1 }
      });
    }
    
    if (pattern.name.includes('false')) {
      actions.push({
        type: 'fallback',
        parameters: { method: 'conservative' }
      });
    }
    
    // Default retry action
    actions.push({
      type: 'retry',
      parameters: { maxRetries: 2, delay: 1000 }
    });
    
    return actions;
  }
  
  private identifySideEffects(pattern: FailurePattern): string[] {
    const sideEffects: string[] = [];
    
    // Identify based on prevention actions
    for (const strategy of pattern.preventionStrategies) {
      for (const action of strategy.actions) {
        switch (action.type) {
          case 'throttle':
            sideEffects.push('Reduced processing speed');
            break;
          case 'simplify':
            sideEffects.push('Reduced accuracy or detail');
            break;
          case 'cache':
            sideEffects.push('Potentially stale data');
            break;
          case 'fallback':
            sideEffects.push('Limited functionality');
            break;
        }
      }
    }
    
    return Array.from(new Set(sideEffects));
  }
  
  private generatePredictorsFromRootCause(rootCause: RootCauseAnalysis): FailurePredictor[] {
    const predictors: FailurePredictor[] = [];
    
    // Generate predictor for primary cause
    if (rootCause.primaryCause) {
      const conditions = this.generatePredictorConditions(rootCause.primaryCause, []);
      if (conditions.length > 0) {
        predictors.push({
          name: `${rootCause.primaryCause} early warning`,
          conditions,
          confidence: rootCause.confidence * 0.8,
          leadTime: 3000
        });
      }
    }
    
    return predictors;
  }
  
  private initializeDegradationModes(): void {
    // Level 1: Minor degradation
    this.degradationModes.set('level-1', {
      mode: 'performance-reduced',
      capabilities: ['core-analysis', 'basic-learning', 'simple-patterns'],
      limitations: ['No deep analysis', 'Limited pattern complexity'],
      performance: 0.8,
      activationConditions: ['Minor resource pressure', 'Occasional timeouts']
    });
    
    // Level 2: Moderate degradation
    this.degradationModes.set('level-2', {
      mode: 'essential-only',
      capabilities: ['core-analysis', 'cached-results'],
      limitations: ['No learning', 'No pattern detection', 'Cache-only'],
      performance: 0.5,
      activationConditions: ['Significant failures', 'Resource constraints']
    });
    
    // Level 3: Severe degradation
    this.degradationModes.set('level-3', {
      mode: 'survival',
      capabilities: ['basic-read', 'simple-response'],
      limitations: ['No analysis', 'No intelligence features'],
      performance: 0.2,
      activationConditions: ['Critical failures', 'System instability']
    });
  }
  
  private selectDegradationMode(level: number): GracefulDegradation | null {
    const modeKey = `level-${Math.min(level, 3)}`;
    return this.degradationModes.get(modeKey) || null;
  }
  
  /**
   * Start failure analysis loop
   */
  private startFailureAnalysis(): void {
    // Periodic pattern analysis
    setInterval(() => {
      this.analyzeFailureTrends();
      this.updatePreventionEffectiveness();
      this.cleanupOldFailures();
    }, 60000); // Every minute
  }
  
  private analyzeFailureTrends(): void {
    const recentFailures = Array.from(this.failures.values())
      .filter(f => Date.now() - f.timestamp.getTime() < 3600000); // Last hour
    
    if (recentFailures.length > 10) {
      // High failure rate alert
      this.emit('high-failure-rate', {
        count: recentFailures.length,
        types: Array.from(new Set(recentFailures.map(f => f.type))),
        severity: recentFailures.filter(f => f.severity === 'high').length
      });
    }
  }
  
  private updatePreventionEffectiveness(): void {
    for (const [_, strategy] of this.preventionStrategies) {
      // Decay effectiveness over time if not used
      if (!this.activePrevention.has(strategy.id)) {
        strategy.effectiveness *= 0.99;
      }
    }
  }
  
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.memoryRetentionDays * 86400000;
    
    for (const [id, failure] of this.failures) {
      if (failure.timestamp.getTime() < cutoff) {
        this.failures.delete(id);
      }
    }
  }
  
  /**
   * Get failure analytics
   */
  getFailureAnalytics(): {
    metrics: typeof this.metrics;
    topFailureTypes: Array<{ type: string; count: number; severity: string }>;
    patterns: Array<{
      name: string;
      instances: number;
      preventionSuccess: number;
    }>;
    preventionEffectiveness: {
      overall: number;
      byStrategy: Map<string, number>;
    };
    degradationStatus: {
      currentLevel: number;
      activations: number;
    };
  } {
    // Calculate top failure types
    const typeCount = new Map<string, { count: number; severity: string }>();
    for (const failure of this.failures.values()) {
      const key = failure.type;
      const current = typeCount.get(key) || { count: 0, severity: failure.severity };
      current.count++;
      typeCount.set(key, current);
    }
    
    const topFailureTypes = Array.from(typeCount.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate pattern statistics
    const patterns = Array.from(this.patterns.values()).map(pattern => ({
      name: pattern.name,
      instances: pattern.instances.length,
      preventionSuccess: pattern.preventionStrategies
        .reduce((sum, s) => sum + s.effectiveness, 0) / 
        Math.max(1, pattern.preventionStrategies.length)
    }));
    
    // Calculate prevention effectiveness
    const overallEffectiveness = this.metrics.preventedFailures / 
      Math.max(1, this.metrics.totalFailures);
    
    const byStrategy = new Map<string, number>();
    for (const [id, strategy] of this.preventionStrategies) {
      byStrategy.set(strategy.name, strategy.effectiveness);
    }
    
    return {
      metrics: { ...this.metrics },
      topFailureTypes,
      patterns,
      preventionEffectiveness: {
        overall: overallEffectiveness,
        byStrategy
      },
      degradationStatus: {
        currentLevel: 0, // Would track actual level
        activations: 0 // Would track activation count
      }
    };
  }
}