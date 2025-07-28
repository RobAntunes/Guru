/**
 * Quick Start Helper for Adaptive Learning System
 * 
 * Provides a simple way to create and integrate the adaptive learning
 * system with existing Guru components.
 */

import { GuruEnhanced } from '../core/guru-enhanced.js';
import { QuantumLearningSystem } from '../memory/quantum-learning-system.js';
import { EmergentBehaviorEngine } from '../memory/emergent-behavior-engine.js';
import { AdaptiveCacheWarmer } from '../optimization/adaptive-cache-warmer.js';
import { SelfReflectionEngine } from '../intelligence/self-reflection-engine.js';
import { PatternDetector } from '../intelligence/pattern-detector.js';
import { MemoryIntelligenceEngine } from '../intelligence/memory-intelligence-engine.js';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine.js';
import { LivingTaskForest } from '../living-task-forest/core/living-task-forest.js';
import { AdaptiveLearningIntegration, IntegrationConfig } from './adaptive-learning-integration.js';

export interface CreateAdaptiveLearningOptions {
  guru: GuruEnhanced;
  quantumLearning?: QuantumLearningSystem;
  emergentBehavior?: EmergentBehaviorEngine;
  cacheWarmer?: AdaptiveCacheWarmer;
  selfReflection?: SelfReflectionEngine;
  patternDetector?: PatternDetector;
  memoryIntelligence?: MemoryIntelligenceEngine;
  harmonicEngine?: HarmonicAnalysisEngine;
  taskForest?: LivingTaskForest;
  config?: Partial<IntegrationConfig>;
}

/**
 * Create a fully integrated adaptive learning system
 */
export function createAdaptiveLearningSystem(
  options: CreateAdaptiveLearningOptions
): AdaptiveLearningIntegration {
  // Default configuration
  const defaultConfig: IntegrationConfig = {
    enableAdaptiveLearning: true,
    learningConfig: {
      enableQuantumLearning: !!options.quantumLearning,
      enableEmergentBehaviors: !!options.emergentBehavior,
      enablePatternRecognition: !!options.patternDetector,
      enableSelfReflection: !!options.selfReflection,
      learningRateRange: [0.001, 0.5],
      adaptationThreshold: 0.7,
      crossSystemLearning: true
    },
    analyticsConfig: {
      historyRetentionDays: 30,
      patternDetectionWindow: 24, // hours
      trendAnalysisWindow: 48, // hours
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
      performanceWindow: 24, // hours
      adaptationSpeed: 0.1
    },
    transferConfig: {
      enableAutoTransfer: true,
      similarityThreshold: 0.6,
      adaptationDepth: 2,
      knowledgeRetentionDays: 90,
      maxTransferSize: 20,
      transferCooldown: 5000 // 5 seconds
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
    feedbackLoops: true
  };
  
  // Merge with user config
  const config: IntegrationConfig = {
    ...defaultConfig,
    ...options.config,
    learningConfig: {
      ...defaultConfig.learningConfig,
      ...options.config?.learningConfig
    },
    analyticsConfig: {
      ...defaultConfig.analyticsConfig,
      ...options.config?.analyticsConfig
    },
    selectionConfig: {
      ...defaultConfig.selectionConfig,
      ...options.config?.selectionConfig
    },
    transferConfig: {
      ...defaultConfig.transferConfig,
      ...options.config?.transferConfig
    },
    optimizerConfig: {
      ...defaultConfig.optimizerConfig,
      ...options.config?.optimizerConfig
    }
  };
  
  // Create and return integrated system
  return new AdaptiveLearningIntegration(
    options.guru,
    config,
    options.quantumLearning,
    options.emergentBehavior,
    options.cacheWarmer,
    options.selfReflection,
    options.patternDetector,
    options.memoryIntelligence,
    options.harmonicEngine,
    options.taskForest
  );
}

/**
 * Create adaptive learning with minimal configuration
 */
export function createMinimalAdaptiveLearning(guru: GuruEnhanced): AdaptiveLearningIntegration {
  return createAdaptiveLearningSystem({
    guru,
    config: {
      enableAdaptiveLearning: true,
      autoIntegration: true,
      feedbackLoops: false, // Minimal setup doesn't need feedback loops
      learningConfig: {
        enableQuantumLearning: false,
        enableEmergentBehaviors: false,
        enablePatternRecognition: false,
        enableSelfReflection: false,
        learningRateRange: [0.01, 0.1],
        adaptationThreshold: 0.5,
        crossSystemLearning: false
      }
    }
  });
}