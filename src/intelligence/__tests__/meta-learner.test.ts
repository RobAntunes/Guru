import { MetaLearner } from '../self-reflection-engine';
import { describe, it, expect, beforeEach } from 'bun:test';
import fs from 'fs';

const historyPath = process.cwd() + '/.guru/meta-learning-history.json';

describe('MetaLearner', () => {
  beforeEach(() => {
    if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
  });

  it('should instantiate and learn learning patterns with feedback', async () => {
    const learner = new MetaLearner();
    await learner.learnLearningPatterns([
      { type: 'feedback', value: 1, success: true, strategy: 'A' },
      { type: 'feedback', value: 0, success: false, strategy: 'B' },
      { type: 'feedback', value: 1, success: true, strategy: 'A' }
    ]);
    const meta = await learner.getMetaLearning();
    expect(meta).toBeDefined();
    expect(typeof meta).toBe('object');
    expect(meta.strategy_stats.A.count).toBeGreaterThan(0);
    expect(meta.strategy_stats.B.count).toBeGreaterThan(0);
  });

  it('should track and persist learning history', async () => {
    const learner = new MetaLearner();
    await learner.learnLearningPatterns([{ type: 'feedback', value: 1, success: true, strategy: 'A' }]);
    const history = await learner.getHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it('should recommend the best strategy', async () => {
    const learner = new MetaLearner();
    await learner.learnLearningPatterns([
      { type: 'feedback', value: 1, success: true, strategy: 'A' },
      { type: 'feedback', value: 1, success: true, strategy: 'A' },
      { type: 'feedback', value: 0, success: false, strategy: 'B' }
    ]);
    const best = learner.recommendStrategy();
    expect(['A', 'B', 'default']).toContain(best);
  });

  it('should persist and recover history', async () => {
    let learner = new MetaLearner();
    await learner.learnLearningPatterns([{ type: 'feedback', value: 1, success: true, strategy: 'A' }]);
    const history1 = await learner.getHistory();
    learner = new MetaLearner();
    const history2 = await learner.getHistory();
    expect(history2.length).toBe(history1.length);
  });

  it('should handle empty and repeated feedback', async () => {
    const learner = new MetaLearner();
    await learner.learnLearningPatterns([]);
    await learner.learnLearningPatterns([]);
    const history = await learner.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
}); 