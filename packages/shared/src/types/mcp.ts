// MCP protocol types
export interface MCPRequest {
  method: string;
  params: Record<string, unknown>;
  id?: string;
}

export interface MCPResponse {
  result?: unknown;
  error?: MCPError;
  id?: string;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Guru-specific MCP tool requests
export interface HarmonicAnalysisRequest {
  content: string;
  domain?: 'coding' | 'writing' | 'research' | 'auto-detect';
  analysis_depth?: 'surface' | 'deep' | 'architectural';
}

export interface QuantumSynthesisRequest {
  query: string;
  context?: string[];
  cross_domain?: boolean;
  discovery_mode?: 'conservative' | 'balanced' | 'creative';
}

export interface TaskEvolutionRequest {
  objective: string;
  constraints?: string[];
  current_approach?: string;
  evolution_pressure?: 'efficiency' | 'quality' | 'innovation' | 'balanced';
}

export interface AdaptiveLearningRequest {
  strategy_space: string[];
  performance_history?: Array<{
    strategy: string;
    outcome: number;
    context: string;
  }>;
  exploration_rate?: number;
}

export interface SILCConversationRequest {
  request: string;
  requesting_model: string;
  collaboration_type?: 'cognitive_analysis' | 'problem_decomposition' | 'strategy_optimization' | 'creative_synthesis';
  complexity_level?: 'simple' | 'moderate' | 'complex' | 'expert';
  domain_context?: string;
}