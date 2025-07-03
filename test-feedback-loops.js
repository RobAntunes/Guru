import { SelfReflectionEngine, PeerReviewEngine, ConsensusEngine, AdaptiveTuning, PatternLearning, AdversarialTester, ConfidenceCalibrator, MetaLearner } from './src/intelligence/self-reflection-engine.js';
import fs from 'fs';

async function run() {
  // Mock analysis data
  const analysis = {
    analysisSession: 'test-session',
    healthScores: [
      { symbolId: 'foo', score: 90, suggestions: [] },
      { symbolId: 'bar', score: 40, suggestions: ['Address critical memory issues'] },
      { symbolId: 'baz', score: 70, suggestions: ['Review risky operations'] }
    ]
  };
  const analyses = [analysis, { ...analysis, healthScores: [{ symbolId: 'foo', score: 80, suggestions: [] }, { symbolId: 'bar', score: 60, suggestions: [] }] }];

  // Self-Reflection
  const selfReflection = new SelfReflectionEngine();
  const reflection = await selfReflection.reflectOnAnalysis(analysis);
  console.log('\nSelf-Reflection:', reflection);

  // Peer Review
  const peerReview = new PeerReviewEngine();
  const reviews = await peerReview.reviewAnalysis(analysis, 'TestReviewee');
  console.log('\nPeer Reviews:', reviews);

  // Consensus
  const consensus = new ConsensusEngine();
  const consensusResult = await consensus.buildConsensus(analyses);
  console.log('\nConsensus Result:', consensusResult);

  // Adaptive Tuning
  const tuning = new AdaptiveTuning();
  await tuning.adjustParameters({ type: 'overconfidence', source: 'naming' });
  const thresholds = await tuning.getThresholds();
  console.log('\nAdaptive Tuning Thresholds:', thresholds);

  // Pattern Learning
  const patternLearning = new PatternLearning();
  await patternLearning.updateWeights(['fooPattern'], ['barPattern']);
  const weights = await patternLearning.getWeights();
  console.log('\nPattern Weights:', weights);

  // Adversarial Testing
  const adversarial = new AdversarialTester();
  const advResult = await adversarial.challengeAnalysis(analysis);
  console.log('\nAdversarial Test Result:', advResult);

  // Confidence Calibration
  const calibrator = new ConfidenceCalibrator();
  await calibrator.calibrateConfidence({ confidence: 0.9 }, { correct: true });
  await calibrator.calibrateConfidence({ confidence: 0.7 }, { correct: false });
  const calibrationStats = await calibrator.getCalibrationStats();
  console.log('\nConfidence Calibration Stats:', calibrationStats);

  // Meta-Learning
  const meta = new MetaLearner();
  const metaResult = await meta.learnLearningPatterns([{ type: 'feedback', effect: 'positive' }]);
  const metaLearning = await meta.getMetaLearning();
  console.log('\nMeta-Learning:', metaLearning);

  // Check .guru outputs
  console.log('\n.guru contents:');
  for (const file of ['self-reflection.json', 'peer-reviews.json', 'consensus.json', 'adaptive-params.json', 'pattern-weights.json', 'adversarial.json', 'confidence-calibration.json', 'meta-learning.json']) {
    const p = `.guru/${file}`;
    if (fs.existsSync(p)) {
      console.log(`- ${file}:`, fs.readFileSync(p, 'utf-8').slice(0, 200) + '...');
    } else {
      console.log(`- ${file}: (not found)`);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); }); 