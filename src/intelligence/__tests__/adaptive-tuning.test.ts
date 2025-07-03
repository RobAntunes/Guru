import { AdaptiveTuning } from '../self-reflection-engine';
import { describe, it, expect } from 'bun:test';

describe('AdaptiveTuning', () => {
  it('should instantiate and adjust parameters for overconfidence', async () => {
    const tuning = new AdaptiveTuning();
    const feedback = { type: 'overconfidence', source: 'naming' };
    await tuning.adjustParameters(feedback as any);
    const thresholds = await tuning.getThresholds();
    expect(thresholds).toBeDefined();
    expect(typeof thresholds.naming).toBe('number');
  });

  it('should instantiate and adjust parameters for underconfidence', async () => {
    const tuning = new AdaptiveTuning();
    const feedback = { type: 'underconfidence', source: 'clustering' };
    await tuning.adjustParameters(feedback as any);
    const thresholds = await tuning.getThresholds();
    expect(thresholds).toBeDefined();
    expect(typeof thresholds.clustering).toBe('number');
  });

  it('should adjust using confidence and actual outcome (moving average)', async () => {
    const tuning = new AdaptiveTuning();
    const feedback = { type: 'feedback', source: 'patterns', confidence: 0.3, actual: true };
    const before = (await tuning.getThresholds()).patterns;
    await tuning.adjustParameters(feedback as any);
    const after = (await tuning.getThresholds()).patterns;
    expect(after).not.toBe(before);
  });

  it('should not allow thresholds to go below 0.1 or above 0.99', async () => {
    const tuning = new AdaptiveTuning();
    // Try to lower below 0.1
    for (let i = 0; i < 50; i++) {
      await tuning.adjustParameters({ type: 'overconfidence', source: 'naming' } as any);
    }
    const thresholds = await tuning.getThresholds();
    expect(thresholds.naming).toBeGreaterThanOrEqual(0.1);
    // Try to raise above 0.99
    for (let i = 0; i < 50; i++) {
      await tuning.adjustParameters({ type: 'underconfidence', source: 'clustering' } as any);
    }
    const thresholds2 = await tuning.getThresholds();
    expect(thresholds2.clustering).toBeLessThanOrEqual(0.99);
  });

  it('should record and retrieve adjustment history', async () => {
    const tuning = new AdaptiveTuning();
    await tuning.adjustParameters({ type: 'overconfidence', source: 'patterns' } as any);
    const history = await tuning.getAdjustmentHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });
}); 