import { z } from 'zod';

// Validation schemas for Guru types
export const AnalysisResultSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  confidence: z.number().min(0).max(1),
  insights: z.array(z.string()),
  patterns: z.array(z.object({
    id: z.string(),
    type: z.string(),
    confidence: z.number().min(0).max(1),
    description: z.string(),
    harmonics: z.array(z.number()).optional()
  })),
  fluidConfig: z.object({
    dynamicReconfiguration: z.object({
      cognitiveMode: z.string(),
      crossPollination: z.array(z.string())
    }),
    harmonicConfig: z.object({
      creativeAmplification: z.number(),
      patternDepth: z.string(),
      resonanceMode: z.string()
    }),
    quantumConfig: z.object({
      discoveryAmplification: z.number(),
      memoryHorizon: z.string()
    }),
    taskConfig: z.object({
      evolutionRate: z.number()
    }),
    learningConfig: z.object({
      explorationRate: z.number(),
      strategyEvolution: z.object({
        enabled: z.boolean()
      })
    }),
    cognitiveBoosts: z.object({
      universalSynthesis: z.object({
        enabled: z.boolean(),
        depth: z.number()
      }),
      thoughtExploration: z.object({
        enabled: z.boolean()
      })
    })
  }).optional()
});

export const HarmonicAnalysisRequestSchema = z.object({
  content: z.string().min(1),
  domain: z.enum(['coding', 'writing', 'research', 'auto-detect']).optional(),
  analysis_depth: z.enum(['surface', 'deep', 'architectural']).optional()
});

export const QuantumSynthesisRequestSchema = z.object({
  query: z.string().min(1),
  context: z.array(z.string()).optional(),
  cross_domain: z.boolean().optional(),
  discovery_mode: z.enum(['conservative', 'balanced', 'creative']).optional()
});

export const SILCMessageSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  from: z.object({
    id: z.string(),
    role: z.enum(['external_model', 'cognitive_specialist', 'harmonic_analyzer', 'quantum_synthesizer', 'task_evolver', 'adaptive_learner']),
    model: z.string().optional(),
    system: z.string().optional(),
    capabilities: z.array(z.string())
  }),
  to: z.object({
    id: z.string(),
    role: z.enum(['external_model', 'cognitive_specialist', 'harmonic_analyzer', 'quantum_synthesizer', 'task_evolver', 'adaptive_learner']),
    model: z.string().optional(),
    system: z.string().optional(),
    capabilities: z.array(z.string())
  }),
  type: z.enum(['cognitive_request', 'cognitive_response', 'pattern_analysis', 'synthesis_insight', 'task_evolution', 'learning_update', 'collaboration_init', 'collaboration_complete']),
  payload: z.unknown(),
  metadata: z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    requires_response: z.boolean(),
    timeout_ms: z.number().optional(),
    reasoning_depth: z.number(),
    confidence_threshold: z.number()
  }).optional()
});

// Utility functions
export function validateAnalysisResult(data: unknown) {
  return AnalysisResultSchema.safeParse(data);
}

export function validateHarmonicAnalysisRequest(data: unknown) {
  return HarmonicAnalysisRequestSchema.safeParse(data);
}

export function validateQuantumSynthesisRequest(data: unknown) {
  return QuantumSynthesisRequestSchema.safeParse(data);
}

export function validateSILCMessage(data: unknown) {
  return SILCMessageSchema.safeParse(data);
}