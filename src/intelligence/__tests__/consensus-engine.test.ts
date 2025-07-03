import { ConsensusEngine } from '../self-reflection-engine.js';
import { describe, it, expect } from 'bun:test';

describe('ConsensusEngine', () => {
  it('should instantiate and build consensus from analyses', async () => {
    const engine = new ConsensusEngine();
    const analyses = [
      { healthScores: [{ symbolId: 'foo', score: 90 }], confidence: 0.9 },
      { healthScores: [{ symbolId: 'foo', score: 80 }], confidence: 0.8 },
      { healthScores: [{ symbolId: 'bar', score: 60 }], confidence: 0.6 },
    ];
    const result = await engine.buildConsensus(analyses as any);
    expect(result).toBeDefined();
    expect(Array.isArray(result.high_confidence)).toBe(true);
    expect(Array.isArray(result.needs_review)).toBe(true);
    expect(typeof result.consensus_confidence).toBe('number');
  });

  it('should handle empty analyses', async () => {
    const engine = new ConsensusEngine();
    const result = await engine.buildConsensus([]);
    expect(result).toBeDefined();
    expect(Array.isArray(result.high_confidence)).toBe(true);
    expect(Array.isArray(result.needs_review)).toBe(true);
  });
}); 