/**
 * Code Clustering and Semantic Zones Types
 * AI-native code organization understanding
 */

export interface CodeCluster {
  id: string;
  name?: string; // Deprecated: human-centric, optional for AI-native
  purpose?: string; // Deprecated: human-centric, optional for AI-native
  confidence: ClusterConfidence;
  symbols: string[];        // symbol IDs in this cluster
  connections: ClusterEdge[];
  metrics: ClusterMetrics;
  semanticZone?: SemanticZone; // Deprecated: human-centric, optional for AI-native
  relationships: ClusterRelationship[];
}

export interface ClusterConfidence {
  overall: number;          // 0.0-1.0 how confident we are this is a real cluster
  cohesion: number;         // how tightly related the symbols are
  separation: number;       // how distinct this cluster is from others
  semanticClarity: number;  // how clear the purpose is
  naming: number;          // how confident we are in the name/purpose
  evidence: string[];       // what led to this clustering
  limitations: string[];    // what might be wrong
}

export interface ClusterMetrics {
  size: number;            // number of symbols
  density: number;         // internal connectivity (0-1)
  cohesion: number;        // average internal edge weight
  coupling: number;        // external dependencies (lower = better)
  complexity: number;      // average complexity of symbols
  centrality: number;      // importance in overall architecture
  stability: number;       // how likely this cluster is to change
}

export interface SemanticZone {
  type: SemanticZoneType;
  domain: string;          // business domain (auth, payments, ui, etc.)
  layer: ArchitecturalLayer;
  patterns: string[];      // detected patterns in this zone
  conventions: string[];   // naming/coding conventions
  responsibilities: string[]; // what this zone is responsible for
}

export type SemanticZoneType = 
  | 'feature'       // business feature (user management, checkout)
  | 'infrastructure' // technical infrastructure (database, auth)
  | 'ui'            // user interface components
  | 'api'           // API/service layer
  | 'data'          // data models/entities
  | 'utility'       // shared utilities/helpers
  | 'test'          // test code
  | 'configuration' // config/setup code
  | 'integration'   // external service integration
  | 'core'          // core business logic
  | 'adapter'       // adapters/interfaces
  | 'mixed';        // unclear/multiple purposes

export type ArchitecturalLayer = 
  | 'presentation'  // UI/presentation layer
  | 'application'   // application/business logic
  | 'domain'        // domain models/entities
  | 'infrastructure' // data access/external services
  | 'cross_cutting'  // logging, auth, validation
  | 'unknown';

export interface ClusterEdge {
  from: string;            // cluster ID
  to: string;              // cluster ID
  type: ClusterEdgeType;
  weight: number;          // strength of relationship
  evidence: string[];      // why these clusters are connected
}

export type ClusterEdgeType = 
  | 'depends_on'     // A depends on B
  | 'uses'           // A uses services from B
  | 'extends'        // A extends/inherits from B
  | 'configures'     // A configures B
  | 'coordinates'    // A orchestrates B
  | 'data_flow'      // A passes data to B
  | 'similar'        // A and B are similar/related
  | 'composed_of';   // A is composed of B

export interface ClusterRelationship {
  clusterId: string;
  relationship: ClusterEdgeType;
  strength: number;
  description: string;
}

export interface ClusteringAlgorithm {
  name: string;
  type: 'connectivity' | 'semantic' | 'structural' | 'hybrid';
  parameters: Record<string, any>;
  minClusterSize: number;
  maxClusterSize: number;
  confidenceThreshold: number;
}

export interface ClusterCandidate {
  symbols: string[];
  score: number;
  reasons: string[];
  algorithmUsed: string;
  cohesionMetrics: {
    connectivity: number;
    semantic: number;
    structural: number;
    naming: number;
  };
}

export interface ClusteringAnalysis {
  clusters: CodeCluster[];
  unclusteredSymbols: string[];
  overlaps: ClusterOverlap[];
  architecture: ArchitecturalInsights;
  recommendations: ClusteringRecommendation[];
  metadata: ClusteringMetadata;
}

export interface ClusterOverlap {
  clusterIds: string[];
  sharedSymbols: string[];
  overlapType: 'boundary' | 'shared_utility' | 'refactor_candidate';
  confidence: number;
  recommendation: string;
}

export interface ArchitecturalInsights {
  layerSeparation: number;     // how well layers are separated
  domainCohesion: number;      // how well domains are clustered
  patternConsistency: number;  // consistency of patterns within clusters
  couplingHealth: number;      // overall coupling health
  modularityScore: number;     // how modular the architecture is
  hotspots: ArchitecturalHotspot[];
}

export interface ArchitecturalHotspot {
  type: 'high_coupling' | 'god_cluster' | 'scattered_feature' | 'layer_violation' | 'pattern_inconsistency';
  description: string;
  affectedClusters: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface ClusteringRecommendation {
  type: 'split_cluster' | 'merge_clusters' | 'extract_utility' | 'move_symbol' | 'create_interface';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  rationale: string;
  affectedClusters: string[];
}

export interface ClusteringMetadata {
  algorithmsUsed: string[];
  totalSymbols: number;
  clusteredSymbols: number;
  clusteringRatio: number;    // percentage of symbols clustered
  averageClusterSize: number;
  clusterSizeDistribution: Record<string, number>;
  processingTime: number;
  qualityMetrics: {
    silhouetteScore: number;  // clustering quality metric
    modularityScore: number;  // network modularity
    cohesionScore: number;    // average intra-cluster cohesion
    separationScore: number;  // average inter-cluster separation
  };
}

// Predefined clustering algorithms
export const CLUSTERING_ALGORITHMS: ClusteringAlgorithm[] = [
  {
    name: 'connectivity_based',
    type: 'connectivity',
    parameters: {
      minEdgeWeight: 0.3,
      communityDetection: 'louvain'
    },
    minClusterSize: 3,
    maxClusterSize: 50,
    confidenceThreshold: 0.6
  },
  {
    name: 'semantic_similarity',
    type: 'semantic',
    parameters: {
      namingSimilarity: 0.7,
      purposeSimilarity: 0.6,
      patternSimilarity: 0.8
    },
    minClusterSize: 2,
    maxClusterSize: 30,
    confidenceThreshold: 0.7
  },
  {
    name: 'structural_cohesion',
    type: 'structural',
    parameters: {
      fileProximity: true,
      moduleRespect: true,
      layerAwareness: true
    },
    minClusterSize: 3,
    maxClusterSize: 40,
    confidenceThreshold: 0.65
  },
  {
    name: 'hybrid_intelligent',
    type: 'hybrid',
    parameters: {
      connectivityWeight: 0.4,
      semanticWeight: 0.3,
      structuralWeight: 0.3,
      smartNamingBoost: 0.2
    },
    minClusterSize: 2,
    maxClusterSize: 35,
    confidenceThreshold: 0.75
  }
];

// Semantic zone detection patterns
export interface SemanticZonePattern {
  type: SemanticZoneType;
  patterns: {
    naming: RegExp[];
    filePatterns: RegExp[];
    dependencies: string[];
    keywords: string[];
  };
  confidence: number;
}

export const SEMANTIC_ZONE_PATTERNS: SemanticZonePattern[] = [
  {
    type: 'feature',
    patterns: {
      naming: [/^(user|auth|payment|order|product|dashboard)/i],
      filePatterns: [/features?\//i, /modules?\//i],
      dependencies: ['business', 'domain', 'service'],
      keywords: ['feature', 'business', 'workflow', 'process']
    },
    confidence: 0.8
  },
  {
    type: 'ui',
    patterns: {
      naming: [/^(component|view|page|screen|widget)/i, /^(render|display|show)/i],
      filePatterns: [/components?\//i, /views?\//i, /pages?\//i, /ui\//i],
      dependencies: ['react', 'vue', 'angular', 'dom'],
      keywords: ['component', 'render', 'props', 'state', 'jsx']
    },
    confidence: 0.85
  },
  {
    type: 'api',
    patterns: {
      naming: [/^(api|endpoint|route|controller)/i, /^(get|post|put|delete)/i],
      filePatterns: [/api\//i, /routes?\//i, /controllers?\//i, /endpoints?\//i],
      dependencies: ['express', 'fastify', 'koa', 'http'],
      keywords: ['endpoint', 'route', 'controller', 'middleware', 'request']
    },
    confidence: 0.9
  },
  {
    type: 'data',
    patterns: {
      naming: [/^(model|entity|schema|repository)/i, /^(data|db|database)/i],
      filePatterns: [/models?\//i, /entities?\//i, /schemas?\//i, /data\//i],
      dependencies: ['mongoose', 'sequelize', 'prisma', 'typeorm'],
      keywords: ['model', 'schema', 'entity', 'repository', 'database']
    },
    confidence: 0.85
  },
  {
    type: 'utility',
    patterns: {
      naming: [/^(util|helper|tool|common)/i],
      filePatterns: [/utils?\//i, /helpers?\//i, /lib\//i, /common\//i],
      dependencies: ['lodash', 'ramda', 'moment'],
      keywords: ['utility', 'helper', 'common', 'shared', 'tool']
    },
    confidence: 0.75
  },
  {
    type: 'test',
    patterns: {
      naming: [/^(test|spec|mock|stub)/i],
      filePatterns: [/test\//i, /spec\//i, /__tests__\//i, /\.test\./i, /\.spec\./i],
      dependencies: ['jest', 'mocha', 'vitest', 'cypress'],
      keywords: ['test', 'spec', 'mock', 'describe', 'it', 'expect']
    },
    confidence: 0.95
  }
];
