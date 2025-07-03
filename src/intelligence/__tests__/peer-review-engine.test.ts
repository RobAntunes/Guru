import { PeerReviewEngine } from '../self-reflection-engine.js';
import { describe, it, expect } from 'bun:test';

const mockAnalysis = {
  analysisSession: 'session-1',
  healthScores: [{ symbolId: 'foo', score: 80, suggestions: ['Looks good'] }],
};

describe('PeerReviewEngine', () => {
  it('should instantiate and perform a peer review', async () => {
    const engine = new PeerReviewEngine();
    const result = await engine.reviewAnalysis(mockAnalysis as any, 'reviewer', 'reviewee');
    expect(result).toBeDefined();
    expect(result.reviewer).toBe('reviewer');
    expect(result.reviewee).toBe('reviewee');
    expect(Array.isArray(result.critiques)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should handle empty analysis', async () => {
    const engine = new PeerReviewEngine();
    const result = await engine.reviewAnalysis({} as any, 'reviewer', 'reviewee');
    expect(result).toBeDefined();
    expect(Array.isArray(result.critiques)).toBe(true);
  });
}); 