/**
 * Types for Smart Symbol Naming with AI-native semantic analysis
 */

export interface NamingStrategy {
  name: string;
  confidence: number;
  evidence: string[];
  context?: Record<string, any>;
}

export interface ConfidenceScore {
  overall: number;
  strategy: number;
  context: number;
  evidence: string[];
}

export interface SmartSymbol {
  id: string;
  inferredName: string;
  originalName?: string;
  confidence: ConfidenceScore;
  context?: SymbolContext;
}

export interface SymbolContext {
  assignmentVariable?: string;    // const myFunc = () => {}
  objectProperty?: string;        // obj.method = function() {}
  arrayIndex?: number;           // [function() {}, ...]
  callbackParameter?: string;    // users.map(user => ...)
  exportType?: 'default' | 'named';
  parentClass?: string;          // class methods
  parentFunction?: string;       // nested functions
  usagePattern?: string;         // handler_, validator_, etc.
  originalName?: string;         // for preserving original names
  
  // New behavioral context for AI models
  behavioralType?: 'property_extractor' | 'comparator' | 'predicate' | 'transformer' | 'accumulator' | 'validator' | 'mapper' | 'unknown';
  extractedProperties?: string[];
  operations?: string[];
  callContext?: string;
  
  // Semantic relationships for AI understanding
  semanticRole?: 'data_accessor' | 'business_logic' | 'validation' | 'transformation' | 'aggregation' | 'filtering';
  intentClassification?: 'read' | 'write' | 'compute' | 'validate' | 'transform' | 'compare';
  
  // AI-friendly metadata
  functionalDescription?: string;
  parameterSemantics?: Record<string, string[]>;
  aiHints?: {
    purpose: string;
    businessDomain?: string;
    complexity: 'simple' | 'moderate' | 'complex';
    refactoringHints?: string[];
  };
}

export interface EntryPoint {
  file: string;
  symbol?: string;
  type: 'main' | 'script' | 'module' | 'test' | 'cli';
  confidence: number;
  evidence: string[];
}

export interface SemanticPrefix {
  pattern: RegExp;
  prefix: string;
  confidence: number;
}

// Enhanced semantic prefixes for AI models
export const SEMANTIC_PREFIXES = {
  // Action-based prefixes (verbs)
  accessor: ['get', 'extract', 'retrieve', 'fetch', 'read'],
  comparator: ['compare', 'sort', 'rank', 'order', 'evaluate'],
  predicate: ['is', 'has', 'can', 'should', 'will', 'check', 'validate', 'filter'],
  transformer: ['transform', 'convert', 'process', 'modify', 'format', 'parse'],
  accumulator: ['sum', 'count', 'accumulate', 'aggregate', 'reduce', 'collect'],
  mapper: ['map', 'project', 'translate', 'adapt', 'normalize'],
  
  // Domain-specific prefixes
  business: ['calculate', 'validate', 'process', 'handle', 'manage'],
  data: ['serialize', 'deserialize', 'encode', 'decode', 'sanitize'],
  ui: ['render', 'display', 'show', 'hide', 'update', 'refresh'],
  
  // Quality indicators for AI models
  confidence: ['confident', 'likely', 'possible', 'uncertain'],
  complexity: ['simple', 'moderate', 'complex', 'advanced']
} as const;

// Behavioral pattern classification for AI understanding
export interface BehavioralClassification {
  pattern: 'property_extractor' | 'comparator' | 'predicate' | 'transformer' | 'accumulator' | 'validator' | 'mapper' | 'unknown';
  confidence: number;
  semanticIntent: string;
  businessContext?: string;
  refactoringPotential: 'low' | 'medium' | 'high';
  aiRecommendations: string[];
}

// AI model ingestion metadata
export interface AIModelMetadata {
  symbolId: string;
  semanticFingerprint: string;
  functionalCategory: string;
  complexityScore: number;
  maintainabilityIndex: number;
  reusabilityPotential: 'low' | 'medium' | 'high';
  qualityMetrics: {
    readability: number;
    testability: number;
    modularity: number;
  };
}
