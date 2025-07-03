import { AdversarialTester } from '../self-reflection-engine';
import { describe, it, expect, beforeEach } from 'bun:test';
import fs from 'fs';

const historyPath = process.cwd() + '/.guru/adversarial-history.json';

describe('AdversarialTester', () => {
  beforeEach(() => {
    if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
  });

  it('should instantiate and challenge an analysis with diverse cases', async () => {
    const tester = new AdversarialTester();
    const analysis = { healthScores: [
      { symbolId: 'foo', score: 80 },
      { symbolId: 'bar', score: 40 },
      { symbolId: 'baz', score: 30 }
    ] };
    const result = await tester.challengeAnalysis(analysis as any);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.weaknesses)).toBe(true);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.improvement_areas)).toBe(true);
    expect(result.improvement_areas.some(s => s.includes('bar') || s.includes('baz'))).toBe(true);
  });

  it('should track and persist test history', async () => {
    const tester = new AdversarialTester();
    await tester.challengeAnalysis({ healthScores: [{ symbolId: 'foo', score: 40 }] });
    const history = await tester.getHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it('should provide stats', async () => {
    const tester = new AdversarialTester();
    await tester.challengeAnalysis({ healthScores: [{ symbolId: 'foo', score: 40 }] });
    const stats = tester.getStats();
    expect(typeof stats).toBe('object');
    expect(stats.total).toBeGreaterThan(0);
  });

  it('should persist and recover history', async () => {
    let tester = new AdversarialTester();
    await tester.challengeAnalysis({ healthScores: [{ symbolId: 'foo', score: 40 }] });
    const history1 = await tester.getHistory();
    tester = new AdversarialTester();
    const history2 = await tester.getHistory();
    expect(history2.length).toBe(history1.length);
  });

  it('should handle empty analysis and repeated calls', async () => {
    const tester = new AdversarialTester();
    await tester.challengeAnalysis({ healthScores: [] });
    await tester.challengeAnalysis({});
    const history = await tester.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
}); 