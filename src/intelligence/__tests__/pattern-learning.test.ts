import { PatternLearning } from '../self-reflection-engine';
import { describe, it, expect, beforeEach } from 'bun:test';
import fs from 'fs';

const weightsPath = process.cwd() + '/.guru/pattern-weights.json';
const historyPath = process.cwd() + '/.guru/pattern-weights-history.json';
const metaPath = process.cwd() + '/.guru/pattern-weights-meta.json';

describe('PatternLearning', () => {
  beforeEach(() => {
    if (fs.existsSync(weightsPath)) fs.unlinkSync(weightsPath);
    if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  });

  it('should instantiate and update pattern weights', async () => {
    const learning = new PatternLearning();
    await learning.updateWeights(['singleton', 'factory'], ['god_object']);
    const weights = await learning.getWeights();
    expect(weights).toBeDefined();
    expect(typeof weights).toBe('object');
    expect(weights.singleton).toBeGreaterThan(1);
    expect(weights.god_object).toBeLessThan(1);
  });

  it('should enforce min/max bounds', async () => {
    const learning = new PatternLearning();
    for (let i = 0; i < 100; i++) {
      await learning.updateWeights(['singleton'], []);
      await learning.updateWeights([], ['god_object']);
    }
    const weights = await learning.getWeights();
    const eps = 1e-6;
    expect(weights.singleton).toBeLessThanOrEqual(10 + eps);
    expect(weights.god_object).toBeGreaterThanOrEqual(0.1 - eps);
  });

  it('should normalize weights so sum = N', async () => {
    const learning = new PatternLearning();
    await learning.updateWeights(['a', 'b', 'c'], ['d']);
    const weights = await learning.getWeights();
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(Object.keys(weights).length, 2);
  });

  it('should persist and recover weights, history, and metadata', async () => {
    let learning = new PatternLearning();
    await learning.updateWeights(['singleton'], ['god_object']);
    const weights1 = await learning.getWeights();
    const history1 = await learning.getHistory();
    const meta1 = await learning.getMetadata();
    // Re-instantiate
    learning = new PatternLearning();
    const weights2 = await learning.getWeights();
    const history2 = await learning.getHistory();
    const meta2 = await learning.getMetadata();
    expect(weights2.singleton).toBeCloseTo(weights1.singleton, 5);
    expect(history2.length).toBe(history1.length);
    expect(meta2.singleton.successCount).toBe(meta1.singleton.successCount);
  });

  it('should record update history and metadata', async () => {
    const learning = new PatternLearning();
    await learning.updateWeights(['singleton'], ['god_object']);
    const history = await learning.getHistory();
    const meta = await learning.getMetadata();
    expect(history.length).toBeGreaterThan(0);
    expect(meta.singleton.successCount).toBeGreaterThan(0);
    expect(meta.god_object.failCount).toBeGreaterThan(0);
  });

  it('should decay weights', async () => {
    const learning = new PatternLearning();
    await learning.updateWeights(['singleton'], []);
    const before = (await learning.getWeights()).singleton;
    await learning.decayWeights(0.5);
    const after = (await learning.getWeights()).singleton;
    const eps = 1e-6;
    expect(after).toBeLessThan(before + eps);
    expect(after).toBeGreaterThanOrEqual(0.1 - eps);
  });

  it('should handle unknown patterns and empty input', async () => {
    const learning = new PatternLearning();
    await learning.updateWeights([], []);
    const weights = await learning.getWeights();
    expect(typeof weights).toBe('object');
    await learning.updateWeights(['new_pattern'], []);
    const weights2 = await learning.getWeights();
    expect(weights2.new_pattern).toBeDefined();
  });

  it('should handle repeated updates', async () => {
    const learning = new PatternLearning();
    for (let i = 0; i < 10; i++) {
      await learning.updateWeights(['singleton'], ['god_object']);
    }
    const weights = await learning.getWeights();
    expect(weights.singleton).toBeGreaterThan(1);
    expect(weights.god_object).toBeLessThan(1);
  });
}); 