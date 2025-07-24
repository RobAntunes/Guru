// SILC (Self-Interpreting Local Communication) Protocol Types
export interface SILCMessage {
  id: string;
  timestamp: number;
  from: SILCParticipant;
  to: SILCParticipant;
  type: SILCMessageType;
  payload: unknown;
  metadata?: SILCMetadata;
}

export interface SILCParticipant {
  id: string;
  role: 'external_model' | 'cognitive_specialist' | 'harmonic_analyzer' | 'quantum_synthesizer' | 'task_evolver' | 'adaptive_learner';
  model?: string;
  system?: string;
  capabilities: string[];
}

export type SILCMessageType = 
  | 'cognitive_request'
  | 'cognitive_response' 
  | 'pattern_analysis'
  | 'synthesis_insight'
  | 'task_evolution'
  | 'learning_update'
  | 'collaboration_init'
  | 'collaboration_complete';

export interface SILCMetadata {
  priority: 'low' | 'medium' | 'high' | 'critical';
  requires_response: boolean;
  timeout_ms?: number;
  reasoning_depth: number;
  confidence_threshold: number;
}

export interface SILCConversation {
  id: string;
  participants: SILCParticipant[];
  messages: SILCMessage[];
  status: 'active' | 'completed' | 'error';
  started_at: number;
  completed_at?: number;
}

export interface SILCRequest {
  original_request: string;
  enhanced_prompt: string;
  context_embedding: number[];
  expected_reasoning_type: string[];
  collaboration_goals: string[];
}

export interface SILCResponse {
  cognitive_enhancement: {
    mathematical_insights: string[];
    pattern_analysis: Record<string, unknown>;
    synthesis_results: Record<string, unknown>;
    task_optimization: Record<string, unknown>;
    learning_adaptation: Record<string, unknown>;
  };
  foundation_model_guidance: string;
  confidence_metrics: {
    overall: number;
    mathematical_reasoning: number;
    pattern_recognition: number;
    synthesis_quality: number;
  };
}

// Phi-4 Mini specific types
export interface Phi4Analysis {
  confidence: number;
  mathematical_insights: string;
  reasoning_steps: string[];
  pattern_detection: {
    detected_patterns: string[];
    confidence_scores: number[];
  };
  architectural_analysis?: {
    structure_insights: string[];
    optimization_suggestions: string[];
  };
}