/**
 * Memory system types for Harmonic Intelligence
 * Implements the DPCM (Deterministic Parameter Composition Memory) pattern
 */

export interface ContentMemory {
  id: string;
  coordinates: [number, number, number]; // DPCM coordinates
  content: {
    title: string;
    description: string;
    type: string;
    tags: string[];
    data: any;
  };
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  relevanceScore: number;
}

export enum PatternCategory {
  FRACTAL = 'fractal',
  WAVE = 'wave', 
  INFORMATION_THEORY = 'information_theory',
  TOPOLOGICAL = 'topological',
  GEOMETRIC = 'geometric',
  TILING = 'tiling',
  CLASSICAL_HARMONY = 'classical_harmony'
}

export enum EvidenceType {
  ROTATIONAL_SYMMETRY = 'rotational_symmetry',
  REFLECTIONAL_SYMMETRY = 'reflectional_symmetry',
  FRACTAL_DIMENSION = 'fractal_dimension',
  WAVE_FREQUENCY = 'wave_frequency',
  INFORMATION_ENTROPY = 'information_entropy',
  NETWORK_TOPOLOGY = 'network_topology',
  MATHEMATICAL_CONSTANT = 'mathematical_constant'
}

export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  symbolName?: string;
  functionName?: string;
  className?: string;
}

export interface HarmonicEvidence {
  type: EvidenceType;
  measurement: number;
  description: string;
  mathematicalProperties: Record<string, number>;
  confidence: number;
  location?: CodeLocation;
}

export interface HarmonicPatternMemory extends ContentMemory {
  // Pattern-specific extensions
  harmonicProperties: {
    category: PatternCategory;
    strength: number; // 0-1 pattern strength
    occurrences: number; // How many times found
    confidence: number; // Detection confidence
    complexity: number; // Pattern complexity score
  };

  // Code location data
  locations: CodeLocation[];
  evidence: HarmonicEvidence[];

  // Relationship hints for graph layer
  relatedPatterns: string[]; // IDs of related patterns
  causesPatterns: string[]; // Patterns this one creates
  requiredBy: string[]; // Patterns that need this one
}

export enum LogicGateType {
  AND = 'AND',
  OR = 'OR', 
  NOT = 'NOT',
  XOR = 'XOR',
  THRESHOLD = 'THRESHOLD',
  BOOST = 'BOOST',
  PATTERN = 'PATTERN',
  ARCHITECTURAL = 'ARCHITECTURAL'
}

export interface LogicOperation {
  type: LogicGateType;
  params: string[];
  threshold?: number;
  weight?: number;
}

export interface QueryOptions {
  radius?: number;
  maxResults?: number;
  qualityThreshold?: number;
}

// Enhanced DPCM Hash interface
export interface DPCMHash {
  hash(category: string, composition: string): string;
  toCoordinates(hash: string): [number, number, number];
  distance(coord1: [number, number, number], coord2: [number, number, number]): number;
}

// Pattern distribution analytics
export interface PatternDistribution {
  category: string;
  pattern_count: number;
  avg_strength: number;
  total_occurrences: number;
  files_affected: number;
  avg_complexity: number;
}

export interface PatternHotspot {
  file_path: string;
  pattern_count: number;
  avg_strength: number;
  categories: string[];
  category_diversity: number;
}

export interface PatternCorrelation {
  pattern_a: string;
  pattern_b: string;
  cooccurrence_count: number;
  cooccurrence_rate: number;
  correlation_strength: number;
}

// Query interfaces
export interface HarmonicQuery {
  basePattern: string;
  categories?: PatternCategory[];
  minStrength?: number;
  complexityBoost?: number;
  filePatterns?: string[];
  relationshipTypes?: string[];
  maxDepth?: number;
  radius?: number;
  maxResults?: number;
  qualityThreshold?: number;
}

export interface HarmonicQueryResult {
  results: EnrichedPattern[];
  metadata: {
    queryTime: number;
    dpcmMatches: number;
    graphExpansions: number;
    totalPatterns: number;
    confidence: number;
  };
}

export interface EnrichedPattern extends HarmonicPatternMemory {
  relationships: PatternRelationshipResult[];
  graphScore: number;
}

export interface PatternRelationshipResult {
  startPattern: any;
  connectedPattern: any;
  relationship: any;
  pathLength: number;
}

// Graph schema interfaces for Neo4j
export interface GraphNodes {
  // Pattern nodes
  Pattern: {
    id: string;
    type: string;
    category: PatternCategory;
    strength: number;
    occurrences: number;
    complexity: number;
    coordinates: [number, number, number];
  };

  // File nodes
  File: {
    path: string;
    name: string;
    extension: string;
    size: number;
    lastModified: number;
  };

  // Symbol nodes (functions, classes, variables)
  Symbol: {
    id: string;
    name: string;
    type: 'function' | 'class' | 'variable' | 'interface' | 'module';
    file: string;
    startLine: number;
    endLine: number;
    complexity?: number;
    confidence?: number;
    smartName?: string;
    inferredPurpose?: string;
  };

  // Cluster nodes
  Cluster: {
    id: string;
    name: string;
    purpose: string;
    semanticZone: string;
    cohesion: number;
    coupling: number;
  };
}

export interface GraphRelationships {
  // Symbol relationships
  CALLS: { frequency: number; confidence: number };
  INHERITS: { type: 'extends' | 'implements' };
  DEPENDS_ON: { dependency_type: string };
  BELONGS_TO: { role: string }; // Symbol -> Cluster
  CONTAINS: {}; // File -> Symbol

  // Pattern relationships  
  EXHIBITS: { strength: number; confidence: number; overlap: number }; // Symbol -> Pattern
  FOUND_IN: { startLine: number; endLine: number; confidence: number }; // Pattern -> File
  CORRELATES_WITH: { correlation: number }; // Pattern -> Pattern
  INFLUENCES: { influence_strength: number }; // Pattern -> Symbol
  SIMILAR_TO: { similarity: number; reason: string }; // Pattern -> Pattern
  CAUSES: { strength: number; confidence: number }; // Pattern -> Pattern
  REQUIRES: { dependency_type: string }; // Pattern -> Pattern

  // Cross-domain relationships
  ENHANCES: { improvement_factor: number }; // Pattern -> Symbol quality
  SUGGESTS: { recommendation_strength: number }; // Pattern -> refactoring
  VALIDATES: { validation_confidence: number }; // Symbol -> Pattern detection
}

// Symbol with harmonic patterns
export interface SymbolWithHarmonics {
  symbol: GraphNodes['Symbol'];
  patterns: Array<{
    pattern: GraphNodes['Pattern'];
    strength: number;
  }>;
  averageHarmony: number;
}

// Pattern propagation analysis
export interface PatternPropagation {
  patternType: string;
  propagationPaths: Array<{
    sourceStrength: number;
    targetStrength: number;
    pathLength: number;
    frequency: number;
  }>;
}

// Harmonic signature query
export interface HarmonicSignatureQuery {
  categories: PatternCategory[];
  minStrength: number;
  symbolTypes: string[];
  minPatterns: number;
  limit?: number;
}