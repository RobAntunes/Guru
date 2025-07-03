/**
 * Core type definitions for Guru - AI-native code intelligence
 */

// Import smart naming types first
import type { ConfidenceScore, SymbolContext } from './smart-naming.js';
import type { EntryPointAnalysis, ApplicationEntryPoint } from './entry-point.js';
import type { ClusteringAnalysis } from './clustering.js';
import type { PerformanceAnalysisResult } from './performance.js';
import type { MemoryIntelligenceAnalysis } from '../intelligence/memory-intelligence-engine.js';

export interface SymbolNode {
  id: string;
  name: string;
  type: SymbolType;
  location: SourceLocation;
  scope: string;
  dependencies: string[]; // IDs of symbols this depends on
  dependents: string[];   // IDs of symbols that depend on this
  metadata: SymbolMetadata;
  // Smart naming enhancements
  smartNaming?: {
    inferredName: string;
    confidence: ConfidenceScore;
    context: SymbolContext;
    originalName?: string;
  };
}

export type SymbolType = 
  | 'function'
  | 'class' 
  | 'variable'
  | 'constant'
  | 'interface'
  | 'type'
  | 'module'
  | 'namespace';

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

export interface CodePurpose {
  inferredGoal: string;
  confidence: number; // 0-1 scale
  evidence: PurposeEvidence[];
  alternatives: AlternativePurpose[];
}

export interface PurposeEvidence {
  type: 'structural' | 'behavioral' | 'naming' | 'dependency';
  description: string;
  strength: number; // 0-1 scale
  source: string; // Where this evidence came from
}

export interface AlternativePurpose {
  goal: string;
  confidence: number;
  reasoning: string;
}

export interface GoalSpecification {
  primary: string;
  secondary: string[];
  constraints: string[];
  successCriteria: string[];
  inputOutput?: {
    inputs: InputSpec[];
    outputs: OutputSpec[];
  };
  behaviorRequirements?: string[];
}

export interface InputSpec {
  name: string;
  type: string;
  description: string;
  constraints?: string[];
}

export interface OutputSpec {
  name: string;
  type: string;
  description: string;
  conditions?: string[];
}

export interface AnalysisResult {
  symbolGraph: SymbolGraph;
  executionTraces?: ExecutionTrace[];
  inferredPurposes?: Map<string, CodePurpose>;
  goalSpecification?: GoalSpecification;
  recommendations?: Recommendation[];
  performanceAnalysis?: PerformanceAnalysisResult;
  memoryIntelligence?: MemoryIntelligenceAnalysis;
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

export type { MemoryIntelligenceAnalysis, StaleClosureAnalysis, DataFlowAnalysis, PseudoStackAnalysis, MemoryHealthScore } from '../intelligence/memory-intelligence-engine.js';
