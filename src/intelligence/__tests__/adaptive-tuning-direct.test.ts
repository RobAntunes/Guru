import { AdaptiveTuning } from '../self-reflection-engine';

(async () => {
  const tuning = new AdaptiveTuning();
  console.log('Instance:', tuning);
  console.log('Prototype:', Object.getPrototypeOf(tuning));
  console.log('getAdjustmentHistory type:', typeof tuning.getAdjustmentHistory);
  if (typeof tuning.getAdjustmentHistory !== 'function') {
    throw new Error('getAdjustmentHistory is not a function');
  }
  const history = await tuning.getAdjustmentHistory();
  console.log('Adjustment history:', history);
  await tuning.adjustParameters({ type: 'overconfidence', source: 'naming' });
  const thresholds = await tuning.getThresholds();
  console.log('Thresholds after adjustment:', thresholds);
  if (thresholds.naming < 0.1) {
    throw new Error('Threshold dropped below 0.1');
  }
  console.log('Minimal direct test passed.');
})(); 