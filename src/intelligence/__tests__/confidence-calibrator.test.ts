import { ConfidenceCalibrator } from '../self-reflection-engine';
import { describe, it, expect, beforeEach } from 'bun:test';
import fs from 'fs';

const historyPath = process.cwd() + '/.guru/confidence-calibration-history.json';

describe('ConfidenceCalibrator', () => {
  beforeEach(() => {
    if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
  });

  it('should instantiate and calibrate confidence with metadata', async () => {
    const calibrator = new ConfidenceCalibrator();
    await calibrator.calibrateConfidence({ confidence: 0.8, module: 'test', symbolId: 'foo' }, { correct: true });
    const stats = await calibrator.getCalibrationStats();
    expect(stats).toBeDefined();
    expect(typeof stats.stats).toBe('object');
    expect(['none', 'overconfident', 'underconfident']).toContain(stats.bias);
  });

  it('should provide rolling window stats', async () => {
    const calibrator = new ConfidenceCalibrator();
    for (let i = 0; i < 20; i++) {
      await calibrator.calibrateConfidence({ confidence: 0.5 }, { correct: i % 2 === 0 });
    }
    const stats = await calibrator.getCalibrationStats(10);
    expect(typeof stats.stats).toBe('object');
  });

  it('should provide time-based stats', async () => {
    const calibrator = new ConfidenceCalibrator();
    await calibrator.calibrateConfidence({ confidence: 0.7 }, { correct: true });
    const since = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const stats = await calibrator.getCalibrationStats(100, since);
    expect(typeof stats.stats).toBe('object');
  });

  it('should persist and recover history', async () => {
    let calibrator = new ConfidenceCalibrator();
    await calibrator.calibrateConfidence({ confidence: 0.8 }, { correct: true });
    const history1 = await calibrator.getHistory();
    calibrator = new ConfidenceCalibrator();
    const history2 = await calibrator.getHistory();
    expect(history2.length).toBe(history1.length);
  });

  it('should handle empty and repeated calibrations', async () => {
    const calibrator = new ConfidenceCalibrator();
    await calibrator.calibrateConfidence({ confidence: 0.8 }, { correct: true });
    await calibrator.calibrateConfidence({ confidence: 0.8 }, { correct: false });
    const history = await calibrator.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
}); 