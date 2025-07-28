/**
 * Adaptive Learning Integration
 * 
 * Integrates all adaptive learning components with existing Guru systems,
 * providing a unified interface for intelligent, self-improving code analysis.
 */

import { EventEmitter } from 'events';
import { GuruEnhanced } from '../core/guru-enhanced.js';
import { QuantumLearningSystem } from '../memory/quantum-learning-system.js';
import { EmergentBehaviorEngine } from '../memory/emergent-behavior-engine.js';
import { AdaptiveCacheWarmer } from '../optimization/adaptive-cache-warmer.js';
import { SelfReflectionEngine } from '../intelligence/self-reflection-engine.js';
import { PatternDetector } from '../intelligence/pattern-detector.js';
import { MemoryIntelligenceEngine } from '../intelligence/memory-intelligence-engine.js';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine.js';
import { LivingTaskForest } from '../living-task-forest/core/living-task-forest.js';

import { UnifiedLearningCoordinator, AdaptiveLearningConfig, LearningStrategy } from './unified-learning-coordinator.js';
import { LearningHistoryAnalytics, AnalyticsConfig } from './learning-history-analytics.js';
import { AdaptiveStrategySelector, AdaptiveSelectionConfig } from './adaptive-strategy-selector.js';
import { CrossSystemLearningTransfer, TransferConfig } from './cross-system-learning-transfer.js';
import { LearningRateOptimizer, OptimizerConfig } from './learning-rate-optimizer.js';

export interface AdaptiveLearningSystem {
  coordinator: UnifiedLearningCoordinator;
  analytics: LearningHistoryAnalytics;
  strategySelector: AdaptiveStrategySelector;
  knowledgeTransfer: CrossSystemLearningTransfer;
  rateOptimizer: LearningRateOptimizer;
}

export interface IntegrationConfig {
  enableAdaptiveLearning: boolean;
  learningConfig: AdaptiveLearningConfig;
  analyticsConfig: AnalyticsConfig;
  selectionConfig: AdaptiveSelectionConfig;
  transferConfig: TransferConfig;
  optimizerConfig: OptimizerConfig;
  autoIntegration: boolean;
  feedbackLoops: boolean;
}

export class AdaptiveLearningIntegration extends EventEmitter {
  private adaptiveLearning: AdaptiveLearningSystem;
  private guru: GuruEnhanced;
  private taskForest?: LivingTaskForest;
  private integrationActive: boolean = false;
  private feedbackHandlers: Map<string, Function> = new Map();
  
  constructor(
    guru: GuruEnhanced,
    private config: IntegrationConfig,
    private quantumLearning?: QuantumLearningSystem,
    private emergentBehavior?: EmergentBehaviorEngine,
    private cacheWarmer?: AdaptiveCacheWarmer,
    private selfReflection?: SelfReflectionEngine,
    private patternDetector?: PatternDetector,
    private memoryIntelligence?: MemoryIntelligenceEngine,
    private harmonicEngine?: HarmonicAnalysisEngine,
    taskForest?: LivingTaskForest
  ) {
    super();
    this.guru = guru;
    this.taskForest = taskForest;
    
    // Initialize adaptive learning system
    this.adaptiveLearning = this.initializeAdaptiveLearning();
    
    // Setup integrations if auto-integration is enabled
    if (config.autoIntegration) {
      this.setupIntegrations();
    }
  }
  
  /**
   * Initialize all adaptive learning components
   */
  private initializeAdaptiveLearning(): AdaptiveLearningSystem {
    // Create unified coordinator
    const coordinator = new UnifiedLearningCoordinator(
      this.config.learningConfig,
      this.quantumLearning,
      this.emergentBehavior,
      this.cacheWarmer,
      this.selfReflection,
      this.patternDetector,
      this.memoryIntelligence,
      this.harmonicEngine
    );
    
    // Create analytics system
    const analytics = new LearningHistoryAnalytics(this.config.analyticsConfig);
    
    // Create strategy selector
    const strategies = coordinator['strategies']; // Access private strategies
    const strategySelector = new AdaptiveStrategySelector(
      this.config.selectionConfig,
      strategies
    );
    
    // Create knowledge transfer system
    const knowledgeTransfer = new CrossSystemLearningTransfer(this.config.transferConfig);
    
    // Create rate optimizer
    const rateOptimizer = new LearningRateOptimizer(this.config.optimizerConfig);
    
    // Connect components
    this.connectComponents(coordinator, analytics, strategySelector, knowledgeTransfer, rateOptimizer);
    
    return {
      coordinator,
      analytics,
      strategySelector,
      knowledgeTransfer,
      rateOptimizer
    };
  }
  
  /**
   * Connect adaptive learning components
   */
  private connectComponents(
    coordinator: UnifiedLearningCoordinator,
    analytics: LearningHistoryAnalytics,
    selector: AdaptiveStrategySelector,
    transfer: CrossSystemLearningTransfer,
    optimizer: LearningRateOptimizer
  ): void {
    // Coordinator -> Analytics
    coordinator.on('learning-event', (event) => {
      analytics.addEvent(event);
    });
    
    // Coordinator -> Transfer
    coordinator.on('learning-complete', async (outcome) => {
      // Register insights as transferable knowledge
      for (const insight of outcome.insights) {
        await transfer.registerKnowledge({
          source: 'coordinator',
          type: 'insight',
          domain: 'general',
          content: { insight, outcome },
          metadata: {
            confidence: outcome.metrics.convergence,
            generalizability: outcome.metrics.generalization,
            complexity: 0.5,
            dependencies: []
          }
        });
      }
    });
    
    // Analytics -> Selector
    analytics.on('periodic-analysis', async (report) => {
      // Update strategy selector with performance trends
      for (const trend of report.trends) {
        if (trend.metric === 'success' && trend.direction === 'declining') {
          // Reset underperforming strategies
          selector.resetPerformance();
        }
      }
    });
    
    // Optimizer -> Coordinator
    optimizer.on('rate-optimized', (update) => {
      // Apply optimized learning rates
      if (update.component === 'learning-coordinator') {
        coordinator['globalLearningRate'] = update.newRate;
      }
    });
  }
  
  /**
   * Setup integrations with existing systems
   */
  private setupIntegrations(): void {
    // Integrate with Guru code analysis
    this.integrateWithGuru();
    
    // Integrate with Living Task Forest
    if (this.taskForest) {
      this.integrateWithTaskForest();
    }
    
    // Setup feedback loops
    if (this.config.feedbackLoops) {
      this.setupFeedbackLoops();
    }
    
    this.integrationActive = true;
    this.emit('integration-activated');
  }
  
  /**
   * Integrate with Guru enhanced analysis
   */
  private integrateWithGuru(): void {
    // Hook into analysis pipeline
    const originalAnalyze = this.guru.analyzeCodebaseEnhanced.bind(this.guru);
    
    this.guru.analyzeCodebaseEnhanced = async (targetPath, options) => {
      // Pre-analysis learning
      const context = {
        domain: 'code-analysis',
        complexity: 0.5,
        uncertainty: 0.3,
        previousOutcomes: []
      };
      
      // Select optimal analysis strategy
      const strategy = await this.adaptiveLearning.strategySelector.selectStrategy(context);
      
      // Adjust analysis options based on strategy
      const adaptedOptions = this.adaptAnalysisOptions(options || {}, strategy.primary);
      
      // Perform analysis
      const startTime = Date.now();
      const result = await originalAnalyze(targetPath, adaptedOptions);
      const analysisTime = Date.now() - startTime;
      
      // Learn from analysis results
      const learningContext = {
        domain: 'code-analysis',
        query: targetPath,
        complexity: this.calculateComplexity(result),
        uncertainty: this.calculateUncertainty(result),
        success: true,
        confidence: result.metrics?.overallHealth || 0.5,
        performance: 1 / (1 + analysisTime / 10000) // Normalize performance
      };
      
      const learningOutcome = await this.adaptiveLearning.coordinator.coordinateLearning(learningContext);
      
      // Update strategy performance
      await this.adaptiveLearning.strategySelector.updatePerformance(
        strategy.primary,
        context,
        learningOutcome
      );
      
      // Transfer knowledge about code patterns
      if (result.integratedAnalysis?.insights) {
        for (const insight of result.integratedAnalysis.insights) {
          await this.adaptiveLearning.knowledgeTransfer.registerKnowledge({
            source: 'guru-analysis',
            type: 'pattern',
            domain: 'code-structure',
            content: insight,
            metadata: {
              confidence: 0.8,
              generalizability: 0.7,
              complexity: learningContext.complexity,
              dependencies: ['symbol-graph', 'flow-analysis']
            }
          });
        }
      }
      
      // Optimize learning rates based on performance
      await this.adaptiveLearning.rateOptimizer.optimizeLearningRate(
        'guru-analysis',
        'learning-rate',
        learningContext.performance
      );
      
      return result;
    };
  }
  
  /**
   * Integrate with Living Task Forest
   */
  private integrateWithTaskForest(): void {
    if (!this.taskForest) return;
    
    // Hook into task evolution
    this.taskForest.on('task-evolved', async (evolution) => {
      const context = {
        domain: 'task-evolution',
        type: evolution.evolutionType,
        task: evolution.task,
        fitness: evolution.fitness
      };
      
      // Learn from task evolution patterns
      await this.adaptiveLearning.coordinator.coordinateLearning(context);
    });
    
    // Hook into confidence streams
    this.taskForest.on('confidence-update', async (update) => {
      // Transfer confidence patterns
      await this.adaptiveLearning.knowledgeTransfer.registerKnowledge({
        source: 'task-forest',
        type: 'pattern',
        domain: 'confidence-building',
        content: update,
        metadata: {
          confidence: update.confidence,
          generalizability: 0.6,
          complexity: 0.4,
          dependencies: ['task-genetics']
        }
      });
    });
    
    // Feed learning insights back to task forest
    this.adaptiveLearning.coordinator.on('learning-complete', (outcome) => {
      if (outcome.insights.length > 0 && this.taskForest) {
        // Create insight-based tasks
        for (const insight of outcome.insights) {
          const task = {
            id: `insight-${Date.now()}`,
            description: `Investigate: ${insight}`,
            type: 'research',
            priority: 'medium',
            confidence: outcome.metrics.convergence,
            genetics: {
              generation: 0,
              parentIds: [],
              mutations: [],
              crossoverPoints: []
            }
          };
          
          // Add to forest
          this.taskForest['addTask'](task);
        }
      }
    });
  }
  
  /**
   * Setup feedback loops between components
   */
  private setupFeedbackLoops(): void {
    // Performance feedback loop
    this.feedbackHandlers.set('performance', setInterval(async () => {
      const analytics = await this.adaptiveLearning.analytics.getAnalyticsReport();
      
      // Adjust system based on trends
      for (const trend of analytics.trends) {
        if (trend.direction === 'declining' && trend.confidence > 0.7) {
          // Trigger adaptive response
          this.emit('performance-decline', trend);
          
          // Increase exploration
          this.adaptiveLearning.strategySelector['explorationRate'] *= 1.2;
        }
      }
    }, 60000)); // Every minute
    
    // Knowledge sharing feedback loop
    this.feedbackHandlers.set('knowledge', setInterval(async () => {
      const transferAnalytics = this.adaptiveLearning.knowledgeTransfer.getTransferAnalytics();
      
      // Create domain mappings based on successful transfers
      for (const connection of transferAnalytics.domainConnections) {
        if (connection.transfers > 5 && connection.strength > 0.7) {
          this.adaptiveLearning.knowledgeTransfer.createDomainMapping(
            connection.source,
            connection.target,
            connection.strength
          );
        }
      }
    }, 300000)); // Every 5 minutes
    
    // Learning rate optimization feedback
    this.feedbackHandlers.set('optimization', setInterval(async () => {
      const recommendations = this.adaptiveLearning.rateOptimizer.getOptimizationRecommendations();
      
      // Apply high-priority recommendations
      for (const rec of recommendations) {
        if (rec.priority === 'high') {
          this.emit('optimization-recommendation', rec);
        }
      }
    }, 120000)); // Every 2 minutes
  }
  
  /**
   * Adapt analysis options based on selected strategy
   */
  private adaptAnalysisOptions(options: any, strategy: string): any {
    const adapted = { ...options };
    
    switch (strategy) {
      case 'quantum-learning':
        adapted.enableHarmonicEnrichment = true;
        adapted.enrichmentDepth = 3;
        break;
        
      case 'pattern-recognition':
        adapted.enableFlowAnalysis = true;
        adapted.enableTypeAnalysis = true;
        break;
        
      case 'emergent-behavior':
        adapted.enableCreativeSynthesis = true;
        break;
    }
    
    return adapted;
  }
  
  /**
   * Calculate complexity from analysis results
   */
  private calculateComplexity(result: any): number {
    let complexity = 0;
    
    if (result.symbolGraph) {
      complexity += Math.min(1, result.symbolGraph.symbols.size / 1000) * 0.3;
    }
    
    if (result.integratedAnalysis) {
      complexity += Math.min(1, result.integratedAnalysis.insights.length / 50) * 0.3;
    }
    
    if (result.metrics) {
      complexity += (1 - result.metrics.overallHealth) * 0.4;
    }
    
    return Math.min(1, complexity);
  }
  
  /**
   * Calculate uncertainty from analysis results
   */
  private calculateUncertainty(result: any): number {
    let uncertainty = 0;
    
    if (result.integratedAnalysis?.typeIssues) {
      uncertainty += Math.min(1, result.integratedAnalysis.typeIssues.length / 20) * 0.5;
    }
    
    if (result.integratedAnalysis?.flowIssues) {
      uncertainty += Math.min(1, result.integratedAnalysis.flowIssues.length / 20) * 0.5;
    }
    
    return Math.min(1, uncertainty);
  }
  
  /**
   * Get adaptive learning status
   */
  getAdaptiveLearningStatus(): {
    active: boolean;
    components: {
      coordinator: any;
      analytics: any;
      selector: any;
      transfer: any;
      optimizer: any;
    };
    performance: {
      learningEvents: number;
      successRate: number;
      knowledgeItems: number;
      activeOptimizations: number;
    };
    recommendations: string[];
  } {
    const coordinatorConfig = this.adaptiveLearning.coordinator.getConfiguration();
    const analyticsReport = this.adaptiveLearning.analytics.getAnalyticsReport();
    const selectorAnalytics = this.adaptiveLearning.strategySelector.getSelectionAnalytics();
    const transferAnalytics = this.adaptiveLearning.knowledgeTransfer.getTransferAnalytics();
    const optimizerAnalytics = this.adaptiveLearning.rateOptimizer.getOptimizerAnalytics();
    
    const recommendations: string[] = [];
    
    // Generate recommendations
    if (selectorAnalytics.explorationRate < 0.05) {
      recommendations.push('Consider increasing exploration rate for better strategy discovery');
    }
    
    if (transferAnalytics.queueLength > 10) {
      recommendations.push('Knowledge transfer queue is building up - consider increasing transfer rate');
    }
    
    if (optimizerAnalytics.convergenceStats.oscillating > optimizerAnalytics.convergenceStats.converging) {
      recommendations.push('Many optimizations are oscillating - reduce learning rates');
    }
    
    return {
      active: this.integrationActive,
      components: {
        coordinator: coordinatorConfig,
        analytics: analyticsReport,
        selector: selectorAnalytics,
        transfer: transferAnalytics,
        optimizer: optimizerAnalytics
      },
      performance: {
        learningEvents: analyticsReport.overview.totalEvents,
        successRate: analyticsReport.overview.overallProgress,
        knowledgeItems: transferAnalytics.totalKnowledge,
        activeOptimizations: optimizerAnalytics.activeOptimizations
      },
      recommendations
    };
  }
  
  /**
   * Manually trigger learning from external event
   */
  async triggerLearning(event: {
    source: string;
    type: string;
    context: any;
    outcome?: any;
  }): Promise<void> {
    const learningContext = {
      domain: event.source,
      ...event.context,
      previousOutcomes: []
    };
    
    const outcome = await this.adaptiveLearning.coordinator.coordinateLearning(learningContext);
    
    // If outcome provided, update performance
    if (event.outcome) {
      const strategy = await this.adaptiveLearning.strategySelector.selectStrategy(learningContext);
      await this.adaptiveLearning.strategySelector.updatePerformance(
        strategy.primary,
        learningContext,
        outcome
      );
    }
    
    this.emit('manual-learning-complete', outcome);
  }
  
  /**
   * Export adaptive learning state
   */
  exportState(): any {
    return {
      analytics: this.adaptiveLearning.analytics.exportAnalytics(),
      selector: this.adaptiveLearning.strategySelector.exportSelectionData(),
      transfer: this.adaptiveLearning.knowledgeTransfer.getTransferAnalytics(),
      optimizer: this.adaptiveLearning.rateOptimizer.getOptimizerAnalytics(),
      config: this.config
    };
  }
  
  /**
   * Import adaptive learning state
   */
  importState(state: any): void {
    if (state.analytics) {
      this.adaptiveLearning.analytics.importAnalytics(state.analytics);
    }
    
    if (state.selector) {
      this.adaptiveLearning.strategySelector.importSelectionData(state.selector);
    }
    
    // Note: Transfer and optimizer state import would need to be implemented
    
    this.emit('state-imported');
  }
  
  /**
   * Shutdown adaptive learning
   */
  shutdown(): void {
    // Clear feedback loops
    for (const [name, handler] of this.feedbackHandlers) {
      clearInterval(handler as NodeJS.Timeout);
    }
    this.feedbackHandlers.clear();
    
    this.integrationActive = false;
    this.emit('integration-deactivated');
  }
}