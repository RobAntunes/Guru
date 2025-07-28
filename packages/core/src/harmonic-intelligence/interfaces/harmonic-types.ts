/**
 * Core types and interfaces for the Harmonic Intelligence System
 * @module harmonic-intelligence/interfaces
 */

/**
 * 3D Vector for geometric coordinate representation
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Quaternion for orientation representation
 */
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Individual pattern score with confidence
 */
export interface PatternScore {
  patternName: string;
  category: PatternCategory;
  score: number; // 0-1
  confidence: number; // 0-1
  detected: boolean;
  evidence: PatternEvidence[];
  metadata?: Record<string, any>;
}

/**
 * Evidence supporting a pattern detection
 */
export interface PatternEvidence {
  type: string;
  value: any;
  weight: number;
  description: string;
  location?: string;
}

/**
 * Pattern categories matching the 7 mathematical categories
 */
export enum PatternCategory {
  CLASSICAL_HARMONY = 'classical_harmony',
  GEOMETRIC_HARMONY = 'geometric_harmony',
  FRACTAL_PATTERNS = 'fractal_patterns',
  TILING_CRYSTALLOGRAPHIC = 'tiling_crystallographic',
  TOPOLOGICAL_PATTERNS = 'topological_patterns',
  WAVE_HARMONIC_PATTERNS = 'wave_harmonic_patterns',
  INFORMATION_THEORY = 'information_theory'
}

/**
 * All 23 mathematical patterns
 */
export enum PatternType {
  // Classical Harmony (4)
  GOLDEN_RATIO = 'golden_ratio_patterns',
  FIBONACCI_SEQUENCES = 'fibonacci_sequences',
  PRIME_NUMBER_HARMONICS = 'prime_number_harmonics',
  EULER_CONSTANT_PATTERNS = 'euler_constant_patterns',
  
  // Geometric Harmony (3)
  SACRED_GEOMETRY = 'sacred_geometry',
  SYMMETRY_GROUPS = 'symmetry_groups',
  PLATONIC_SOLIDS = 'platonic_solids',
  
  // Fractal Patterns (4)
  MANDELBROT_COMPLEXITY = 'mandelbrot_complexity',
  JULIA_SET_PATTERNS = 'julia_set_patterns',
  L_SYSTEM_GROWTH = 'l_system_growth',
  HAUSDORFF_DIMENSION = 'hausdorff_dimension',
  
  // Tiling & Crystallographic (3)
  TESSELLATION_PATTERNS = 'tessellation_patterns',
  CRYSTAL_LATTICES = 'crystal_lattices',
  PENROSE_TILINGS = 'penrose_tilings',
  
  // Topological Patterns (3)
  NETWORK_TOPOLOGY = 'network_topology',
  KNOT_THEORY = 'knot_theory',
  SMALL_WORLD_NETWORKS = 'small_world_networks',
  
  // Wave & Harmonic (3)
  FOURIER_ANALYSIS = 'fourier_analysis',
  STANDING_WAVES = 'standing_waves',
  RESONANCE_PATTERNS = 'resonance_patterns',
  
  // Information Theory (3)
  SHANNON_ENTROPY = 'shannon_entropy',
  KOLMOGOROV_COMPLEXITY = 'kolmogorov_complexity',
  EFFECTIVE_COMPLEXITY = 'effective_complexity'
}

/**
 * Confidence interval for statistical reliability
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95% confidence
}

/**
 * Stability metrics over time
 */
export interface StabilityMetrics {
  temporalVariance: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
  volatility: number;
  lastStableValue: number;
  stabilityScore: number; // 0-1
}

/**
 * Complete harmonic analysis result
 */
export interface HarmonicAnalysis {
  overallScore: number; // 0-1 composite score
  patternScores: Map<PatternType, PatternScore>;
  geometricCoordinates: Vector3D;
  orientation: Quaternion;
  confidenceIntervals: Map<string, ConfidenceInterval>;
  stabilityMetrics: StabilityMetrics;
  timestamp: number;
  analysisVersion: string;
}

/**
 * Harmonic constraint for maintaining quality
 */
export interface HarmonicConstraint {
  type: 'minimum' | 'maximum' | 'range' | 'pattern';
  patternType?: PatternType;
  threshold?: number;
  range?: { min: number; max: number };
  severity: 'error' | 'warning' | 'info';
  message: string;
}

/**
 * Quality thresholds for different contexts
 */
export interface QualityThresholds {
  minimum: number;
  recommended: number;
  excellent: number;
  patternSpecific?: Map<PatternType, number>;
}

/**
 * Aesthetic profile learned over time
 */
export interface AestheticProfile {
  preferredPatterns: PatternType[];
  patternWeights: Map<PatternType, number>;
  historicalScores: number[];
  learningRate: number;
  lastUpdated: number;
}

/**
 * Pattern evolution over time
 */
export interface PatternEvolution {
  symbolId: string;
  timestamp: number;
  previousPatterns: Map<PatternType, number>;
  currentPatterns: Map<PatternType, number>;
  harmonicDelta: number;
  changeReason?: string;
}

/**
 * Symbol interface for harmonic analysis
 */
export interface HarmonicSymbol {
  id: string;
  name: string;
  kind: string;
  filePath: string;
  line: number;
  endLine: number;
  containerName?: string;
  depth?: number;
  complexity?: number;
  parameters?: any[];
}

/**
 * Semantic data input for analysis
 */
export interface SemanticData {
  symbols: Map<string, HarmonicSymbol>; // Symbol graph
  relationships: Map<string, string[]>; // Dependency map
  behaviors: BehaviorAnalysis;
  structure: ArchitecturalLayers;
}

/**
 * Behavior analysis data
 */
export interface BehaviorAnalysis {
  executionFlows: any[];
  dataFlows: any[];
  controlFlows: any[];
}

/**
 * Architectural layer information
 */
export interface ArchitecturalLayers {
  files: string[];
  packages: string[];
  namespaces: string[];
  modules: string[];
}

/**
 * Harmonic edge in relationship graph
 */
export interface HarmonicEdge {
  from: string;
  to: string;
  harmonicCompatibility: number; // 0-1
  resonanceFrequency: number;
  patternAlignment: PatternType[];
  strength: number;
}

/**
 * Pattern priority for context selection
 */
export interface PatternPriority {
  pattern: PatternType;
  priority: number; // 0-1
  reason: string;
}

/**
 * Harmonic context for AI decision making
 */
export interface HarmonicContext {
  relevantPatterns: PatternPriority[];
  harmonicConstraints: HarmonicConstraint[];
  qualityThresholds: QualityThresholds;
  aestheticPreferences: AestheticProfile;
}

/**
 * Configuration for harmonic analysis
 */
export interface HarmonicConfig {
  enabledPatterns: PatternType[];
  patternWeights: Map<PatternType, number>;
  confidenceThreshold: number;
  cacheEnabled: boolean;
  parallelAnalysis: boolean;
  maxAnalysisTime: number; // milliseconds
  minimumQualityScore: number;
}