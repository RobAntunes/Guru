#!/usr/bin/env node

const { HarmonicToSILC } = require('./harmonic-to-silc.cjs');

async function testSILCTranslation() {
  console.log('🎯 Testing Harmonic to SILC Translation...\n');
  
  const translator = new HarmonicToSILC();
  
  // Test with various harmonic scores
  const testCases = [
    {
      name: 'Poor Project',
      harmonics: {
        structuralResonance: 0.35,
        contentCoherence: 0.72,
        patternHarmony: 0.41,
        overallBalance: 0.49
      }
    },
    {
      name: 'Good Project',
      harmonics: {
        structuralResonance: 0.85,
        contentCoherence: 0.92,
        patternHarmony: 0.78,
        overallBalance: 0.85
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log('Harmonic Scores:', test.harmonics);
    
    // Convert to SILC
    const silcData = translator.harmonicsToSILC(test.harmonics);
    
    console.log('\n📡 SILC Signals Generated:');
    silcData.signals.forEach(signal => {
      console.log(`\n${signal.type}:`);
      console.log(`  Amplitude: ${signal.signal.amplitude} (health/quality)`);
      console.log(`  Frequency: Band ${signal.signal.frequency} (${signal.interpretation.urgency})`);
      console.log(`  Phase: ${signal.signal.phase} (${signal.signal.phase === '0.000' ? 'aligned' : 'misaligned'})`);
      console.log(`  Noise: ${signal.signal.noise} (uncertainty)`);
      console.log(`  Status: ${signal.interpretation.status}`);
    });
    
    // Generate prompt
    const projectContext = {
      domain: 'software',
      fileCount: 156,
      directoryCount: 24
    };
    
    const prompt = translator.generateSILCPrompt(silcData, projectContext);
    console.log('\n📝 Generated SILC Prompt Preview:');
    console.log(prompt.split('\n').slice(0, 20).join('\n'));
    console.log('... [truncated]');
  }
  
  console.log('\n✅ SILC translation test complete!');
}

testSILCTranslation();
