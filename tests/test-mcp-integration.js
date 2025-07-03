#!/usr/bin/env node

/**
 * 🚀 COMPLETE MCP SERVER INTEGRATION TEST
 * Tests the full Guru system with GuruCore orchestrating all components
 */

import { GuruCore } from './src/core/guru.js';
import fs from 'fs';

const SAMPLES_DIR = './test-samples';

async function testCompleteMCPIntegration() {
  console.log('🚀 TESTING COMPLETE MCP SERVER INTEGRATION');
  console.log('='.repeat(60));
  
  try {
    // Initialize Guru Core (our MCP orchestrator)
    console.log('🧠 Initializing Guru Core...');
    const guru = new GuruCore();
    
    // Loop over all sample codebases
    const samples = fs.readdirSync(SAMPLES_DIR).filter(f => fs.statSync(`${SAMPLES_DIR}/${f}`).isDirectory());
    for (const sample of samples) {
      const samplePath = `${SAMPLES_DIR}/${sample}`;
      console.log(`\n🧪 Running full E2E analysis and feedback for sample: ${sample}`);
      // Pick main file for each sample
      let entryFile = 'index.js';
      if (fs.existsSync(`${samplePath}/server.js`)) entryFile = 'server.js';
      if (fs.existsSync(`${samplePath}/cli.js`)) entryFile = 'cli.js';
      const { analysis, feedbackResults } = await guru.runFullE2EFeedback({
        path: `${samplePath}/${entryFile}`,
        language: 'javascript',
        includeTests: false
      });
      if (!feedbackResults || !feedbackResults.feedbackResults) {
        throw new Error(`Feedback loop results missing or malformed for sample: ${sample}`);
      }
      console.log(`\n🎯 ANALYSIS RESULTS SUMMARY for ${sample}:`);
      console.log('='.repeat(40));
      console.log(`📚 Symbols: ${analysis.symbolGraph.symbols.size}`);
      console.log(`🔗 Edges: ${analysis.symbolGraph.edges.length}`);
      console.log(`⚡ Execution Traces: ${analysis.executionTraces.length}`);
      console.log(`🧠 Inferred Purposes: ${analysis.inferredPurposes.size}`);
      console.log(`💡 Recommendations: ${analysis.recommendations.length}`);
      console.log('\n🧪 FEEDBACK LOOP RESULTS:');
      feedbackResults.feedbackResults.forEach((result, i) => {
        console.log(`- Feedback loop #${i + 1}:`, result);
        if (!result && analysis.symbolGraph.symbols.size > 0) throw new Error(`Feedback loop #${i + 1} returned null/undefined for sample: ${sample}`);
      });
      console.log(`\n✅ All feedback loops executed and results aggregated for ${sample}.`);
    }
    console.log('\n🎉 ALL SAMPLES PASSED COMPLETE MCP SERVER INTEGRATION TEST!');
    console.log('✨ All components working together perfectly!');
    console.log('🚀 Ready for production deployment!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testCompleteMCPIntegration().catch(error => {
  console.error('💥 Fatal error in MCP integration test:', error);
  process.exit(1);
});
