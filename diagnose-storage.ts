#!/usr/bin/env tsx
/**
 * Diagnose Storage Issues
 */

import { createProductionQuantumMemory } from './src/memory/quantum-memory-factory.js';
import { PatternCategory } from './src/memory/types.js';

async function diagnose() {
  console.log('🔍 Diagnosing QPFM Storage...\n');

  const qpfm = await createProductionQuantumMemory();
  
  // Check what's in quantum memory
  const stats = qpfm.getStats();
  console.log('📊 Current state:');
  console.log(`   Total quantum memories: ${stats.totalMemories}`);
  console.log(`   DPCM entries: ${stats.dpcmStats?.totalEntries || 0}`);
  
  // Check pattern distribution
  const distribution = await qpfm.getPatternDistribution();
  console.log('\n📈 Pattern distribution:');
  for (const [category, count] of distribution) {
    console.log(`   ${category}: ${count}`);
  }
  
  // Check PatternCategory enum values
  console.log('\n🏷️  PatternCategory enum values:');
  Object.entries(PatternCategory).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  // Try different query approaches
  console.log('\n🔎 Testing different query approaches:');
  
  // 1. Discovery query
  const discoveryResult = await qpfm.query({
    type: 'discovery',
    confidence: 0.5,
    exploration: 0.5,
    maxResults: 10
  });
  console.log(`   Discovery query: Found ${discoveryResult.memories.length} memories`);
  
  // 2. String query
  const stringResult = await qpfm.query('architectural');
  console.log(`   String query: Found ${stringResult.memories.length} memories`);
  
  // 3. Check internal state
  console.log('\n🔬 Checking internal state:');
  const internalStats = (qpfm as any).dpcmStore.getStats();
  console.log(`   DPCM total entries: ${internalStats.totalEntries}`);
  console.log(`   DPCM unique patterns: ${internalStats.uniquePatterns}`);
  console.log(`   DPCM total operations: ${internalStats.totalOperations}`);
  
  // Check a sample from DPCM
  const dpcmQuery = (qpfm as any).dpcmStore.query('*', [], { maxResults: 5 });
  console.log(`\n📦 Sample DPCM entries: ${dpcmQuery.length}`);
  if (dpcmQuery.length > 0) {
    console.log('   First entry:');
    console.log(`     ID: ${dpcmQuery[0].id}`);
    console.log(`     Category: ${dpcmQuery[0].harmonicProperties?.category}`);
    console.log(`     Coordinates: [${dpcmQuery[0].coordinates.join(', ')}]`);
  }
}

diagnose().catch(console.error);