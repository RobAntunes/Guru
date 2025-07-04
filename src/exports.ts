/**
 * Main exports for Guru - AI-native code intelligence
 *
 * This file provides the main exports for external usage
 */

// Export main classes and types for external usage
export { GuruCore as Guru } from "./core/guru.js";
export { IncrementalAnalyzer } from "./core/incremental-analyzer.js";
export * from "./types/index.js";
export * from "./parsers/symbol-graph.js";
export * from "./intelligence/execution-tracer.js";
export * from "./intelligence/smart-symbol-namer.js";
export * from "./intelligence/entry-point-detector.js";
export * from "./intelligence/code-clusterer.js";

// Export our new modules!
export * from "./intelligence/pattern-detector.js";
export * from "./intelligence/change-impact-analyzer.js";
export * from "./intelligence/performance-analyzer.js";
export * from "./intelligence/memory-intelligence-engine.js";

// Re-export key interfaces for convenience
export type {
  AnalyzeCodebaseParams,
  TraceExecutionParams,
  GetSymbolGraphParams,
  FindRelatedCodeParams,
} from "./core/guru.js";
