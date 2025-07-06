#!/usr/bin/env node

/**
 * Demonstrate the various filtering options for harmonic analysis
 */

import { HarmonicCLI } from "./src/harmonic-intelligence/core/harmonic-cli.js";

async function testFilteringOptions() {
  const harmonicCLI = new HarmonicCLI();
  const path = 'src/core';
  
  console.log('🎵 Testing Harmonic Analysis Filtering Options\n');
  
  // Test 1: High confidence filtering
  console.log('📊 Test 1: High confidence only (0.9+)');
  console.time('high-confidence');
  const highConfidenceResult = await harmonicCLI.analyze({
    path,
    confidenceThreshold: 0.9,
    includeEvidence: false
  });
  console.timeEnd('high-confidence');
  console.log(`   Patterns found: ${highConfidenceResult.metadata.patternsDetected}\n`);
  
  // Test 2: Limited patterns per symbol
  console.log('📊 Test 2: Max 2 patterns per symbol');
  console.time('limited-patterns');
  const limitedPatternsResult = await harmonicCLI.analyze({
    path,
    maxPatternsPerSymbol: 2,
    includeEvidence: false
  });
  console.timeEnd('limited-patterns');
  console.log(`   Patterns found: ${limitedPatternsResult.metadata.patternsDetected}\n`);
  
  // Test 3: Exclude geometric patterns
  console.log('📊 Test 3: Exclude geometric category');
  console.time('exclude-geometric');
  const excludeGeometricResult = await harmonicCLI.analyze({
    path,
    excludeCategories: ['geometric'],
    includeEvidence: false
  });
  console.timeEnd('exclude-geometric');
  console.log(`   Patterns found: ${excludeGeometricResult.metadata.patternsDetected}\n`);
  
  // Test 4: Summary-only mode (ultra-compact)
  console.log('📊 Test 4: Summary-only mode');
  console.time('summary-only');
  const summaryResult = await harmonicCLI.analyze({
    path,
    summaryOnly: true
  });
  console.timeEnd('summary-only');
  console.log(`   Output size: ${JSON.stringify(summaryResult).length} characters`);
  console.log(`   Patterns detected: ${summaryResult.metadata.patternsDetected}\n`);
  
  // Test 5: Ultra-filtered (combining all filters)
  console.log('📊 Test 5: Ultra-filtered (0.8+ confidence, max 3 patterns, no geometric/wave)');
  console.time('ultra-filtered');
  const ultraFilteredResult = await harmonicCLI.analyze({
    path,
    confidenceThreshold: 0.8,
    maxPatternsPerSymbol: 3,
    excludeCategories: ['geometric', 'wave'],
    includeEvidence: false
  });
  console.timeEnd('ultra-filtered');
  console.log(`   Patterns found: ${ultraFilteredResult.metadata.patternsDetected}\n`);
  
  console.log('✅ All filtering tests completed!');
  console.log('\n📋 Summary of output reduction options:');
  console.log('   --confidence 0.8        → Filter by minimum confidence');
  console.log('   --max-patterns 3        → Limit patterns per symbol');
  console.log('   --summary-only          → Ultra-compact summary mode');
  console.log('   --exclude-categories    → Skip specific pattern types');
  console.log('   --no-evidence           → Remove detailed evidence (default)');
}

testFilteringOptions().catch(console.error);