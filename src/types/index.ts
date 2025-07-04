/**
 * Core type definitions for Guru - AI-native code intelligence
 */

// Import smart naming types first
import type { ConfidenceScore, SymbolContext } from './smart-naming.js';
import type { EntryPointAnalysis, ApplicationEntryPoint } from './entry-point.js';
import type { ClusteringAnalysis } from './clustering.js';
import type { PerformanceAnalysisResult } from './performance.js';

export interface SymbolNode {
  /**
   * Unique, stable identifier for this symbol (e.g., AST hash, canonical path)
   * All references should use this id or the embedding for model-native access.
   */
  id: string;
  name: string; // Human name, optional for model use
  type: SymbolType;
  location: SourceLocation;
  scope: string;
  dependencies: string[]; // IDs of symbols this depends on
  dependents: string[];   // IDs of symbols that depend on this
  metadata: SymbolMetadata;
  /**
   * Optional vector embedding for this symbol (for model-native queries)
   */
  embedding?: number[];
  // Remove or make optional all human-centric fields
  // smartNaming?: {
  //   inferredName: string;
  //   confidence: ConfidenceScore;
  //   context: SymbolContext;
  //   originalName?: string;
  // };
}

export type SymbolType = 
  | 'function'
  | 'class' 
  | 'variable'
  | 'constant'
  | 'interface'
  | 'type'
  | 'module'
  | 'namespace'
  | 'method'
  | 'object';

export interface SourceLocation {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface SymbolMetadata {
  accessibility?: 'public' | 'private' | 'protected';
  isAsync?: boolean;
  isStatic?: boolean;
  returnType?: string;
  parameters?: Parameter[];
  docstring?: string;
  annotations?: string[];
}

export interface Parameter {
  name: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
}

/**
 * SymbolGraph: All symbols are referenced by id or embedding, not by name.
 */
export interface SymbolGraph {
  symbols: Map<string, SymbolNode>;
  edges: SymbolEdge[];
  metadata: GraphMetadata;
}

export interface SymbolEdge {
  from: string;
  to: string;
  type: EdgeType;
  weight: number; // Strength of relationship
}

export type EdgeType = 
  | 'calls'
  | 'imports'
  | 'inherits'
  | 'implements'
  | 'uses'
  | 'defines'
  | 'references';

export interface GraphMetadata {
  language: string;
  rootPath: string;
  analyzedFiles: string[];
  timestamp: Date;
  version: string;
  coverage?: number;
  diagnostic?: string;
  entryPoints?: EntryPointAnalysis;
  clustering?: ClusteringAnalysis;
}

export interface ExecutionTrace {
  entryPoint: string;
  stackFrames: StackFrame[];
  dataFlow: DataFlowEdge[];
  controlFlow: ControlFlowNode[];
  executionPaths: ExecutionPath[];
}

export interface StackFrame {
  functionId: string;
  depth: number;
  localVariables: Variable[];
  calledFrom?: StackFrame;
  callsTo: StackFrame[];
}

export interface Variable {
  name: string;
  type?: string;
  scope: 'local' | 'parameter' | 'closure' | 'global';
  lifetime: VariableLifetime;
}

export interface VariableLifetime {
  created: number; // Step in execution
  lastAccessed: number;
  modified: number[];
}

export interface DataFlowEdge {
  from: string;
  to: string;
  variable: string;
  transformation?: string;
}

export interface ControlFlowNode {
  id: string;
  type: 'entry' | 'exit' | 'decision' | 'loop' | 'call' | 'return';
  condition?: string;
  children: string[];
}

export interface ExecutionPath {
  id: string;
  nodes: string[];
  probability: number; // Estimated likelihood of this path
  conditions: string[]; // Conditions that must be true for this path
}

export interface AnalysisResult {
  symbolGraph: SymbolGraph;
  executionTraces: ExecutionTrace[];
  confidenceMetrics: ConfidenceMetrics;
  analysisMetadata: AnalysisMetadata;
}

export interface ConfidenceMetrics {
  symbolConfidence: Map<string, number>;
  edgeConfidence: Map<string, number>;
  overallQuality: number;
  analysisDepth: string;
}

export interface AnalysisMetadata {
  timestamp: string;
  analysisVersion: string;
  targetPath: string;
  goalSpec: string;
}

// Smart naming types
export * from './smart-naming.js';

// Entry point detection types
export * from './entry-point.js';

// Code clustering types
export * from './clustering.js';

export interface Recommendation {
  type: 'improvement' | 'refactor' | 'optimization' | 'clarification';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  rationale: string;
}

// Pattern Detection Types
export interface DesignPattern {
  type: string;
  symbols: string[];
  confidence: number;
  evidence: any[];
  description: string;
  implications: string[];
}

export interface AntiPattern {
  type: string;
  symbols: string[];
  severity: number;
  evidence: any[];
  description: string;
  problems: string[];
  suggestions: string[];
}

export interface PatternDetectionResult {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  summary: {
    totalPatterns: number;
    designPatternCount: number;
    antiPatternCount: number;
    overallHealth: number;
    recommendations: string[];
  };
}

// Change Impact Analysis Types
export interface CodeChange {
  type: 'signature_change' | 'behavior_change' | 'modification' | 'addition' | 'deletion';
  targetSymbol: string;
  description: string;
  rationale?: string;
}

export interface ChangeImpactAnalysis {
  change: CodeChange;
  directImpacts: string[];
  indirectImpacts: string[];
  risk: any;
  recommendations: any[];
  affectedSymbols: string[];
  metadata: {
    totalImpacts: number;
    riskScore: number;
    safeToAutomate: boolean;
    estimatedEffort: string;
    analysisConfidence: number;
  };
}

// Add missing types for change impact and pattern detection
export type ImpactLevel = 'low' | 'medium' | 'high';
export interface ChangeRisk {
  level: ImpactLevel;
  score: number;
  factors: string[];
  confidence: number;
}
export interface RippleEffect {
  symbol: string;
  impact: string;
  severity: ImpactLevel;
}
export interface ChangeRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  action: string;
  confidence: number;
}
export type PatternConfidence = 'low' | 'medium' | 'high';
export interface PatternEvidence {
  type: string;
  description: string;
  strength: number;
  source?: string;
}

// If needed, define a minimal MemoryIntelligenceAnalysis interface here:
export interface MemoryIntelligenceAnalysis {
  summary: string;
  details?: any;
}

// Update CodeCluster type: remove or make optional all human-centric fields (name, purpose, semanticZone). Only require id, symbolIds, and structural/embedding features. Update comments to clarify model-native usage.
