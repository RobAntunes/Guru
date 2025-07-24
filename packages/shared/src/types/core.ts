// Core Guru types shared across packages
export interface AnalysisResult {
  id: string;
  timestamp: Date;
  confidence: number;
  insights: string[];
  patterns: PatternData[];
  fluidConfig?: FluidCognitiveConfig;
}

export interface PatternData {
  id: string;
  type: string;
  confidence: number;
  description: string;
  harmonics?: number[];
}

export interface FluidCognitiveConfig {
  dynamicReconfiguration: {
    cognitiveMode: string;
    crossPollination: string[];
  };
  harmonicConfig: {
    creativeAmplification: number;
    patternDepth: string;
    resonanceMode: string;
  };
  quantumConfig: {
    discoveryAmplification: number;
    memoryHorizon: string;
  };
  taskConfig: {
    evolutionRate: number;
  };
  learningConfig: {
    explorationRate: number;
    strategyEvolution: {
      enabled: boolean;
    };
  };
  cognitiveBoosts: {
    universalSynthesis: {
      enabled: boolean;
      depth: number;
    };
    thoughtExploration: {
      enabled: boolean;
    };
  };
}

export interface Domain {
  name: string;
  concepts: Map<string, ConceptNode>;
  patterns: DomainPattern[];
  knowledgeBase: KnowledgeEntry[];
}

export interface ConceptNode {
  id: string;
  name: string;
  definition: string;
  connections: Connection[];
  embedding: number[];
}

export interface Connection {
  targetId: string;
  type: 'is-a' | 'has-a' | 'causes' | 'relates-to' | 'contrasts-with';
  strength: number;
}

export interface DomainPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  instances: string[];
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  domain: string;
  timestamp: Date;
  confidence: number;
  sources: string[];
}