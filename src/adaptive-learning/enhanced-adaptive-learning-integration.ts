/**
 * Enhanced Adaptive Learning Integration
 * 
 * Extends the base adaptive learning system with confidence awareness,
 * curiosity-driven exploration, breakthrough detection, and failure learning.
 */

import { EventEmitter } from 'events';
import { AdaptiveLearningIntegration, IntegrationConfig } from './adaptive-learning-integration.js';
import { GuruEnhanced } from '../core/guru-enhanced.js';
import { ConfidenceAwareLearning, ConfidenceContext } from './confidence-aware-learning.js';
import { CuriosityDrivenExploration, NoveltySignal } from './curiosity-driven-exploration.js';
import { BreakthroughDetection, Breakthrough } from './breakthrough-detection.js';
import { FailureModeLearning, FailureMode } from './failure-mode-learning.js';
import { LearningOutcome } from './unified-learning-coordinator.js';

export interface EnhancedIntegrationConfig extends IntegrationConfig {
  confidenceAwareness: {
    enabled: boolean;
    calibrationWindow: number;
    adaptiveThresholds: boolean;
  };
  curiosityEngine: {
    enabled: boolean;
    noveltyThreshold: number;
    explorationBudget: {
      timePercentage: number;
      memoryMB: number;
      maxConcurrentExperiments: number;
    };
  };
  breakthroughDetection: {
    enabled: boolean;
    detectionSensitivity: number;
    sharingEnabled: boolean;
  };
  failureLearning: {
    enabled: boolean;
    patternDetectionMinInstances: number;
    preventionAggressiveness: number;
  };
}

export class EnhancedAdaptiveLearningIntegration extends AdaptiveLearningIntegration {
  private confidenceAwareness?: ConfidenceAwareLearning;
  private curiosityEngine?: CuriosityDrivenExploration;
  private breakthroughDetection?: BreakthroughDetection;
  private failureLearning?: FailureModeLearning;
  private enhancedConfig: EnhancedIntegrationConfig;
  
  constructor(
    guru: GuruEnhanced,
    config: EnhancedIntegrationConfig,
    // ... other parameters from base class
    quantumLearning?: any,
    emergentBehavior?: any,
    cacheWarmer?: any,
    selfReflection?: any,
    patternDetector?: any,
    memoryIntelligence?: any,
    harmonicEngine?: any,
    taskForest?: any
  ) {
    super(
      guru,
      config,
      quantumLearning,
      emergentBehavior,
      cacheWarmer,
      selfReflection,
      patternDetector,
      memoryIntelligence,
      harmonicEngine,
      taskForest
    );
    
    this.enhancedConfig = config;
    this.initializeEnhancements();
  }
  
  /**
   * Initialize enhanced learning components
   */
  private initializeEnhancements(): void {
    // Initialize confidence awareness
    if (this.enhancedConfig.confidenceAwareness.enabled) {
      this.confidenceAwareness = new ConfidenceAwareLearning({
        calibrationWindow: this.enhancedConfig.confidenceAwareness.calibrationWindow,
        confidenceThresholds: {
          veryLow: 0.2,
          low: 0.4,
          medium: 0.6,
          high: 0.8,
          veryHigh: 0.95
        },
        adaptiveThresholds: this.enhancedConfig.confidenceAwareness.adaptiveThresholds,
        uncertaintyPenalty: 0.1,
        calibrationFrequency: 20
      });
      
      this.setupConfidenceIntegration();
    }
    
    // Initialize curiosity engine
    if (this.enhancedConfig.curiosityEngine.enabled) {
      this.curiosityEngine = new CuriosityDrivenExploration({
        noveltyThreshold: this.enhancedConfig.curiosityEngine.noveltyThreshold,
        explorationBudget: this.enhancedConfig.curiosityEngine.explorationBudget,
        interestDecayRate: 0.01,
        hypothesisPrioritization: 'balanced',
        experimentTimeout: 30000
      });
      
      this.setupCuriosityIntegration();
    }
    
    // Initialize breakthrough detection
    if (this.enhancedConfig.breakthroughDetection.enabled) {
      this.breakthroughDetection = new BreakthroughDetection({
        detectionSensitivity: this.enhancedConfig.breakthroughDetection.detectionSensitivity,
        paradigmShiftThreshold: 2.0,
        emergenceThreshold: 0.7,
        qualitativeLeapMultiplier: 3.0,
        amplificationBudget: {
          maxResources: 100,
          priorityBoost: 2.0,
          propagationSpeed: 10
        },
        sharingEnabled: this.enhancedConfig.breakthroughDetection.sharingEnabled
      });
      
      this.setupBreakthroughIntegration();
    }
    
    // Initialize failure learning
    if (this.enhancedConfig.failureLearning.enabled) {
      this.failureLearning = new FailureModeLearning({
        failureThreshold: 0.3,
        patternDetectionMinInstances: this.enhancedConfig.failureLearning.patternDetectionMinInstances,
        rootCauseAnalysisDepth: 5,
        preventionAggressiveness: this.enhancedConfig.failureLearning.preventionAggressiveness,
        gracefulDegradationLevels: 3,
        memoryRetentionDays: 30
      });
      
      this.setupFailureIntegration();
    }
  }
  
  /**
   * Setup confidence awareness integration
   */
  private setupConfidenceIntegration(): void {
    if (!this.confidenceAwareness) return;
    
    // Hook into learning coordinator
    const adaptiveLearning = this['adaptiveLearning'];
    
    adaptiveLearning.coordinator.on('learning-event', async (event) => {
      if (event.metrics?.confidence !== undefined) {
        const context: ConfidenceContext = {
          domain: event.context?.domain || 'general',
          currentConfidence: event.metrics.confidence,
          historicalConfidence: [],
          confidenceVariance: 0,
          calibrationError: 0,
          uncertaintySource: 'model'
        };
        
        // Get confidence-aware strategy
        const confidenceStrategy = await this.confidenceAwareness!.selectConfidenceStrategy(context);
        
        // Adjust learning based on confidence
        adaptiveLearning.coordinator['globalLearningRate'] *= confidenceStrategy.adjustments.learningRateMultiplier;
        
        // Update exploration rate
        const explorationBonus = confidenceStrategy.adjustments.explorationBonus;
        adaptiveLearning.strategySelector['explorationRate'] = Math.min(
          1,
          adaptiveLearning.strategySelector['explorationRate'] + explorationBonus
        );
      }
    });
    
    // Learn from outcomes
    adaptiveLearning.coordinator.on('learning-complete', async (outcome) => {
      if (this.confidenceAwareness && outcome.metrics?.confidence !== undefined) {
        await this.confidenceAwareness.learnFromOutcome(
          outcome.context?.domain || 'general',
          outcome.metrics.confidence,
          outcome.success,
          outcome.context
        );
      }
    });
  }
  
  /**
   * Setup curiosity engine integration
   */
  private setupCuriosityIntegration(): void {
    if (!this.curiosityEngine) return;
    
    // Hook into analysis results
    const originalAnalyze = this['guru'].analyzeCodebaseEnhanced.bind(this['guru']);
    
    this['guru'].analyzeCodebaseEnhanced = async (targetPath, options) => {
      const result = await originalAnalyze(targetPath, options);
      
      // Detect novelty in analysis results
      if (this.curiosityEngine && result.symbolGraph) {
        const noveltySignals = await this.curiosityEngine.detectNovelty({
          symbolGraph: result.symbolGraph,
          patterns: result.patterns,
          metrics: result.metrics,
          behavior: result.behavior
        });
        
        // Store novelty signals for future exploration
        result.noveltySignals = noveltySignals;
        
        // Trigger exploration for high-novelty signals
        for (const signal of noveltySignals.filter(s => s.noveltyScore > 0.8)) {
          this.emit('high-novelty-detected', signal);
        }
      }
      
      return result;
    };
    
    // Hook hypothesis testing into experiments
    this.curiosityEngine.on('experiment-designed', async (experiment) => {
      // Use adaptive learning to test hypothesis
      const context = {
        type: 'hypothesis-testing',
        hypothesis: experiment.hypothesis,
        experiment: experiment
      };
      
      const outcome = await this['adaptiveLearning'].coordinator.coordinateLearning(context);
      
      // Update experiment with results
      experiment.results = {
        outcome: outcome.success,
        confidence: outcome.metrics.convergence,
        insights: outcome.insights
      };
    });
  }
  
  /**
   * Setup breakthrough detection integration
   */
  private setupBreakthroughIntegration(): void {
    if (!this.breakthroughDetection) return;
    
    const adaptiveLearning = this['adaptiveLearning'];
    
    // Analyze every learning outcome for breakthroughs
    adaptiveLearning.coordinator.on('learning-complete', async (outcome) => {
      if (!this.breakthroughDetection) return;
      
      const context = {
        previousOutcomes: adaptiveLearning.analytics.getRecentHistory(10),
        currentCapabilities: this.getCurrentCapabilities(),
        performanceMetrics: this.getPerformanceMetrics()
      };
      
      const breakthrough = await this.breakthroughDetection.analyzeForBreakthrough(
        outcome,
        context
      );
      
      if (breakthrough) {
        // Breakthrough detected! Amplify across system
        this.emit('breakthrough-detected', breakthrough);
        
        // Share with all components
        this.broadcastBreakthrough(breakthrough);
      }
    });
    
    // Import external breakthroughs
    this.breakthroughDetection.on('breakthrough-share', async (sharedBreakthrough) => {
      // Transfer breakthrough knowledge
      await adaptiveLearning.knowledgeTransfer.registerKnowledge({
        source: 'breakthrough',
        type: 'insight',
        domain: 'breakthrough',
        content: sharedBreakthrough,
        metadata: {
          confidence: sharedBreakthrough.magnitude,
          generalizability: 0.8,
          complexity: 0.7,
          dependencies: []
        }
      });
    });
  }
  
  /**
   * Setup failure learning integration
   */
  private setupFailureIntegration(): void {
    if (!this.failureLearning) return;
    
    const adaptiveLearning = this['adaptiveLearning'];
    
    // Record failures from learning outcomes
    adaptiveLearning.coordinator.on('learning-complete', async (outcome) => {
      if (!this.failureLearning) return;
      
      // Check if this was a failure
      if (!outcome.success || outcome.metrics.convergence < 0.3) {
        const failure: Omit<FailureMode, 'id' | 'timestamp' | 'rootCause'> = {
          type: this.classifyFailureType(outcome),
          severity: outcome.metrics.convergence < 0.1 ? 'critical' : 
                   outcome.metrics.convergence < 0.2 ? 'high' : 
                   outcome.metrics.convergence < 0.3 ? 'medium' : 'low',
          description: `Learning failure: ${outcome.insights[0] || 'Unknown'}`,
          context: {
            component: 'adaptive-learning',
            operation: outcome.context?.operation || 'learning',
            inputs: outcome.context,
            expectedOutcome: { success: true, convergence: 0.8 },
            actualOutcome: outcome,
            environment: { timestamp: Date.now() }
          }
        };
        
        const analysis = await this.failureLearning.recordFailure(failure);
        
        // Apply prevention if available
        if (analysis.prevention) {
          this.emit('failure-prevention-available', analysis.prevention);
        }
      }
    });
    
    // Predict failures before operations
    this.on('before-operation', async (operation) => {
      if (!this.failureLearning) return;
      
      const prediction = await this.failureLearning.predictFailure(operation.context);
      
      if (prediction.prediction && prediction.confidence > 0.7) {
        this.emit('failure-predicted', prediction);
        
        // Modify operation to prevent failure
        if (prediction.preventionStrategy) {
          operation.context.failurePrevention = prediction.preventionStrategy;
        }
      }
    });
    
    // Handle high failure rates
    this.failureLearning.on('high-failure-rate', async (alert) => {
      // Activate graceful degradation
      const degradation = await this.failureLearning!.activateDegradation(1);
      
      this.emit('degradation-activated', degradation);
      
      // Reduce system load
      adaptiveLearning.coordinator['config'].enableEmergentBehaviors = false;
      adaptiveLearning.coordinator['config'].enablePatternRecognition = false;
    });
  }
  
  /**
   * Helper methods
   */
  
  private getCurrentCapabilities(): string[] {
    const capabilities: string[] = ['base-learning'];
    
    if (this.enhancedConfig.confidenceAwareness.enabled) {
      capabilities.push('confidence-calibration');
    }
    
    if (this.enhancedConfig.curiosityEngine.enabled) {
      capabilities.push('autonomous-exploration');
    }
    
    if (this.enhancedConfig.breakthroughDetection.enabled) {
      capabilities.push('breakthrough-recognition');
    }
    
    if (this.enhancedConfig.failureLearning.enabled) {
      capabilities.push('failure-prevention');
    }
    
    return capabilities;
  }
  
  private getPerformanceMetrics(): Map<string, number> {
    const metrics = new Map<string, number>();
    
    const analytics = this['adaptiveLearning'].analytics.getAnalyticsReport();
    metrics.set('overall-progress', analytics.overview.overallProgress);
    metrics.set('learning-velocity', analytics.overview.totalEvents / Math.max(1, analytics.overview.timeSpan / 3600000));
    
    if (this.confidenceAwareness) {
      const confAnalytics = this.confidenceAwareness.getConfidenceAnalytics();
      metrics.set('confidence-calibration', 1 - (confAnalytics.domainStats[0]?.calibrationError || 0));
    }
    
    if (this.curiosityEngine) {
      const curiosityMetrics = this.curiosityEngine.getCuriosityAnalytics();
      metrics.set('exploration-efficiency', curiosityMetrics.explorationEfficiency);
    }
    
    return metrics;
  }
  
  private classifyFailureType(outcome: LearningOutcome): FailureMode['type'] {
    if (outcome.metrics.confidence > 0.7 && !outcome.success) {
      return 'confidence-miscalibration';
    }
    
    if (outcome.context?.timeout) {
      return 'timeout';
    }
    
    if (outcome.context?.resourceError) {
      return 'resource-exhaustion';
    }
    
    return 'unknown';
  }
  
  private broadcastBreakthrough(breakthrough: Breakthrough): void {
    // Notify all learning components
    const message = {
      type: 'breakthrough',
      data: breakthrough,
      timestamp: new Date()
    };
    
    this.emit('system-wide-broadcast', message);
    
    // Update learning parameters based on breakthrough
    if (breakthrough.type === 'paradigm-shift') {
      // Reset strategy selection to explore new paradigm
      this['adaptiveLearning'].strategySelector.resetPerformance();
    }
  }
  
  /**
   * Get enhanced learning status
   */
  getEnhancedLearningStatus(): any {
    const baseStatus = this.getAdaptiveLearningStatus();
    
    const enhancedStatus = {
      ...baseStatus,
      enhancements: {
        confidenceAwareness: this.confidenceAwareness ? 
          this.confidenceAwareness.getConfidenceAnalytics() : null,
        curiosityEngine: this.curiosityEngine ?
          this.curiosityEngine.getCuriosityAnalytics() : null,
        breakthroughDetection: this.breakthroughDetection ?
          this.breakthroughDetection.getBreakthroughAnalytics() : null,
        failureLearning: this.failureLearning ?
          this.failureLearning.getFailureAnalytics() : null
      }
    };
    
    return enhancedStatus;
  }
}

/**
 * Create enhanced adaptive learning system
 */
export function createEnhancedAdaptiveLearning(
  guru: GuruEnhanced,
  config?: Partial<EnhancedIntegrationConfig>
): EnhancedAdaptiveLearningIntegration {
  const defaultConfig: EnhancedIntegrationConfig = {
    // Base config
    enableAdaptiveLearning: true,
    learningConfig: {
      enableQuantumLearning: true,
      enableEmergentBehaviors: true,
      enablePatternRecognition: true,
      enableSelfReflection: true,
      learningRateRange: [0.001, 0.5],
      adaptationThreshold: 0.7,
      crossSystemLearning: true
    },
    analyticsConfig: {
      historyRetentionDays: 30,
      patternDetectionWindow: 24,
      trendAnalysisWindow: 48,
      milestoneThresholds: {
        performance: 0.8,
        consistency: 0.75,
        breakthrough: 0.9
      },
      domainDecayRate: 0.01
    },
    selectionConfig: {
      explorationRate: 0.2,
      decayRate: 0.001,
      contextualBandit: true,
      ensembleThreshold: 0.8,
      performanceWindow: 24,
      adaptationSpeed: 0.1
    },
    transferConfig: {
      enableAutoTransfer: true,
      similarityThreshold: 0.6,
      adaptationDepth: 2,
      knowledgeRetentionDays: 90,
      maxTransferSize: 20,
      transferCooldown: 5000
    },
    optimizerConfig: {
      algorithm: 'adam',
      learningRate: 0.01,
      momentum: 0.9,
      beta1: 0.9,
      beta2: 0.999,
      epsilon: 1e-8,
      clipGradient: 1.0,
      schedule: {
        type: 'adaptive',
        initialRate: 0.01,
        finalRate: 0.001,
        decaySteps: 10000
      },
      metaLearning: true,
      adaptiveBounds: [0.0001, 0.5]
    },
    autoIntegration: true,
    feedbackLoops: true,
    // Enhanced config
    confidenceAwareness: {
      enabled: true,
      calibrationWindow: 50,
      adaptiveThresholds: true
    },
    curiosityEngine: {
      enabled: true,
      noveltyThreshold: 0.6,
      explorationBudget: {
        timePercentage: 0.1,
        memoryMB: 100,
        maxConcurrentExperiments: 3
      }
    },
    breakthroughDetection: {
      enabled: true,
      detectionSensitivity: 0.7,
      sharingEnabled: true
    },
    failureLearning: {
      enabled: true,
      patternDetectionMinInstances: 3,
      preventionAggressiveness: 0.7
    }
  };
  
  const mergedConfig = {
    ...defaultConfig,
    ...config
  } as EnhancedIntegrationConfig;
  
  return new EnhancedAdaptiveLearningIntegration(
    guru,
    mergedConfig
  );
}