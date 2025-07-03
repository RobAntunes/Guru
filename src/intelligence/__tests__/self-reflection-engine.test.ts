import { SelfReflectionEngine } from '../self-reflection-engine.js';
import { describe, it, expect } from 'bun:test';

const mockAnalysisResult = {
  overallMemoryHealth: 0.8,
  fundamentalAnalysis: {
    memoryHealth: { overallScore: 0.8, dimensions: { efficiency: 0.8, safety: 0.8, security: 0.8, maintainability: 0.8, scalability: 0.8 }, criticalIssues: [], recommendations: [] },
    staleClosure: {},
    dataFlow: {},
    pseudoStack: {},
  },
  aiAgentRecommendations: ['Improve memory efficiency'],
  healthScores: [{ symbolId: 'foo', score: 0.8, breakdown: {}, suggestions: [] }],
};

describe('SelfReflectionEngine', () => {
  it('should instantiate and perform self-analysis', async () => {
    const engine = new SelfReflectionEngine();
    const result = await engine.reflectOnAnalysis(mockAnalysisResult as any);
    expect(result).toBeDefined();
    expect(typeof result.confidence_accuracy).toBe('number');
    expect(Array.isArray(result.blind_spots)).toBe(true);
    expect(Array.isArray(result.improvement_plan)).toBe(true);
  });

  it('should handle empty analysis result', async () => {
    const engine = new SelfReflectionEngine();
    const result = await engine.reflectOnAnalysis({} as any);
    expect(result).toBeDefined();
    expect(Array.isArray(result.blind_spots)).toBe(true);
  });
}); 