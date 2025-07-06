#!/usr/bin/env node

/**
 * Direct Harmonic Analysis - Bypass all extra components
 * Run raw harmonic pattern detection on codebase
 */

import { HarmonicCLI } from "./src/harmonic-intelligence/core/harmonic-cli.js";

async function runHarmonicAnalysis() {
  console.time('harmonic-analysis');
  console.log('🎵 Starting Raw Harmonic Analysis...');
  
  try {
    const harmonicCLI = new HarmonicCLI();
    
    const result = await harmonicCLI.analyze({
      path: process.argv[2] || '.',
      format: 'json',
      includeEvidence: false,  // Disable evidence to reduce size
      maxDepth: 5,
      
      // FILTERING OPTIONS TO REDUCE OUTPUT SIZE
      confidenceThreshold: 0.7,    // Only patterns with 70%+ confidence
      maxPatternsPerSymbol: 5,     // Max 5 patterns per symbol
      excludeCategories: [],       // Can exclude specific categories
      summaryOnly: process.env.SUMMARY_ONLY === 'true'  // Use env var for summary mode
    });
    
    console.timeEnd('harmonic-analysis');
    console.log('✅ Harmonic Analysis Complete!');
    
    // Output to file
    const outputPath = '.guru/results/harmonic-analysis.json';
    await import('fs').then(fs => {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    });
    console.log(`📁 Results saved to: ${outputPath}`);
    console.log(`📊 Analyzed ${result.metadata.filesAnalyzed} files, found ${result.metadata.patternsDetected} patterns`);
    
  } catch (error) {
    console.error('❌ Harmonic Analysis Failed:', error);
    process.exit(1);
  }
}

runHarmonicAnalysis();