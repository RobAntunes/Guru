/**
 * Living Task Forest (LTF) - Main exports
 * Revolutionary AI-native task management through biological evolution
 */

// Core genetics system
export * from './genetics/task-genetics.js';

// Core task tree
export * from './core/task-tree.js';

// Forest ecosystem
export * from './ecosystem/task-forest.js';

// Discovery engine
export * from './discovery/discovery-engine.js';

// Confidence streams
export * from './confidence/confidence-stream.js';

// Re-export main classes for convenience
export { TaskGeneticsFactory } from './genetics/task-genetics.js';
export { TaskTree, TaskTreeFactory } from './core/task-tree.js';
export { TaskForest } from './ecosystem/task-forest.js';
export { ProjectDiscoveryEngine, TaskEvolutionEngine } from './discovery/discovery-engine.js';
export { ConfidenceStream, ParallelWorkflowOrchestrator } from './confidence/confidence-stream.js';

// Version and metadata
export const LTF_VERSION = '0.1.0';
export const LTF_NAME = 'Living Task Forest';
export const LTF_DESCRIPTION = 'AI-native task management through biological evolution';