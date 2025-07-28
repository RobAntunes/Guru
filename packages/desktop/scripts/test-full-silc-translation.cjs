#!/usr/bin/env node

const { FullHarmonicToSILC } = require('./harmonic-to-silc-full.cjs');

async function testFullSILCTranslation() {
  console.log('🎯 Testing Full Harmonic to SILC Translation (23-27 signals)...\n');
  
  const translator = new FullHarmonicToSILC();
  
  // Test with various harmonic scores
  const testCases = [
    {
      name: 'Struggling Project',
      harmonics: {
        structuralResonance: 0.35,
        contentCoherence: 0.42,
        patternHarmony: 0.41,
        overallBalance: 0.39
      }
    },
    {
      name: 'Healthy Project',
      harmonics: {
        structuralResonance: 0.85,
        contentCoherence: 0.92,
        patternHarmony: 0.78,
        overallBalance: 0.85
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log('Base Harmonic Scores:', test.harmonics);
    
    // Convert to full SILC
    const silcData = translator.fullHarmonicsToSILC(test.harmonics);
    
    console.log(`\n📡 SILC Signals Generated: ${silcData.metadata.signalCount} total signals`);
    console.log(`📊 Signal Groups: ${silcData.metadata.groupCount} groups`);
    
    // Find and display master signal
    const masterSignal = silcData.signals.find(s => s.type === 'master_harmonic');
    console.log('\n🎛️ Master Harmonic Signal:');
    console.log(`  Overall Health: ${(parseFloat(masterSignal.signal.amplitude) * 100).toFixed(0)}%`);
    console.log(`  System Urgency: Band ${masterSignal.signal.frequency} (${masterSignal.interpretation.urgency})`);
    console.log(`  System Alignment: ${masterSignal.signal.phase === '0.000' ? 'Harmonious' : 'Discordant'}`);
    console.log(`  Signal Clarity: ${(100 - parseFloat(masterSignal.signal.noise) * 100).toFixed(0)}%`);
    
    // Display group summaries
    console.log('\n📊 Group Summaries:');
    Object.entries(masterSignal.groups).forEach(([groupKey, groupInfo]) => {
      console.log(`\n  ${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)} Group:`);
      console.log(`    - Health: ${(groupInfo.score * 100).toFixed(0)}%`);
      console.log(`    - Status: ${groupInfo.status}`);
      console.log(`    - Signals: ${groupInfo.signalCount}`);
    });
    
    // Count signals by urgency
    const urgencyCounts = {};
    silcData.signals.forEach(signal => {
      const urgency = signal.interpretation.urgency;
      urgencyCounts[urgency] = (urgencyCounts[urgency] || 0) + 1;
    });
    
    console.log('\n📈 Signal Distribution by Urgency:');
    Object.entries(urgencyCounts).forEach(([urgency, count]) => {
      console.log(`  ${urgency}: ${count} signals`);
    });
    
    // Show a few individual signals as examples
    console.log('\n🔍 Sample Individual Signals:');
    const sampleSignals = silcData.signals
      .filter(s => !s.type.endsWith('_group') && s.type !== 'master_harmonic')
      .slice(0, 5);
    
    sampleSignals.forEach(signal => {
      const signalName = signal.type.split('_').slice(1).join(' ');
      console.log(`\n  ${signalName}:`);
      console.log(`    - Health: ${(parseFloat(signal.signal.amplitude) * 100).toFixed(0)}%`);
      console.log(`    - Urgency: Band ${signal.signal.frequency}`);
      console.log(`    - Status: ${signal.interpretation.status}`);
    });
    
    // Generate and show prompt preview
    const projectContext = {
      domain: 'software',
      fileCount: 156,
      directoryCount: 24
    };
    
    const prompt = translator.generateFullSILCPrompt(silcData, projectContext);
    console.log('\n📝 Generated SILC Prompt Preview:');
    console.log(prompt.split('\n').slice(0, 25).join('\n'));
    console.log('... [truncated]');
    
    // Summary statistics
    console.log('\n📊 Analysis Summary:');
    console.log(`  - Total Signals: ${silcData.metadata.signalCount}`);
    console.log(`  - Signal Groups: ${silcData.metadata.groupCount}`);
    console.log(`  - Critical Issues: ${urgencyCounts.critical || 0}`);
    console.log(`  - Urgent Issues: ${urgencyCounts.urgent || 0}`);
    console.log(`  - Areas Needing Attention: ${(urgencyCounts.critical || 0) + (urgencyCounts.urgent || 0) + (urgencyCounts.important || 0)}`);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Full SILC translation test complete!');
  console.log(`${'='.repeat(80)}`);
}

testFullSILCTranslation();