import { FeedbackOrchestrator } from '../self-reflection-engine.js';
import { describe, it, expect } from 'bun:test';

describe('FeedbackOrchestrator', () => {
  it('should instantiate and orchestrate feedback', async () => {
    const orchestrator = new FeedbackOrchestrator();
    const analysis = { healthScores: [{ symbolId: 'foo', score: 80 }] };
    const result = await orchestrator.orchestrateFeedback(analysis as any);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
}); 