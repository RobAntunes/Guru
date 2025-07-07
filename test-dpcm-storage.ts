#!/usr/bin/env tsx
/**
 * Test DPCM Storage Directly
 */

import { StorageManager } from './src/storage/storage-manager.js';
import { HarmonicPatternMemory, PatternCategory } from './src/memory/types.js';
import { v4 as uuidv4 } from 'uuid';

async function testDPCMStorage() {
  console.log('🧪 Testing DPCM Storage Directly...\n');

  // Create and connect storage manager
  const storageManager = new StorageManager();
  await storageManager.connect();
  
  // Create a test pattern
  const testPattern: HarmonicPatternMemory = {
    id: uuidv4(),
    pattern: 'dpcm-test-pattern',
    category: 'ARCHITECTURAL' as any,
    evidence: [{
      type: 'structural',
      description: 'Direct DPCM test',
      location: 'test.ts',
      confidence: 0.95
    }],
    confidence: 0.95,
    locations: [{
      file: 'test.ts',
      startLine: 1,
      endLine: 10,
      startColumn: 0,
      endColumn: 0
    }],
    timestamp: new Date(),
    content: {
      title: 'DPCM Test Pattern',
      description: 'Testing DPCM storage directly',
      type: 'test',
      tags: ['dpcm', 'test'],
      data: {}
    },
    harmonicProperties: {
      category: 'ARCHITECTURAL' as any,
      strength: 0.9,
      occurrences: 1,
      confidence: 0.95,
      complexity: 0.3
    },
    coordinates: [0, 0, 0]
  };

  // Store via StorageManager
  console.log('1️⃣ Storing pattern via StorageManager...');
  await storageManager.storePattern(testPattern);
  console.log('   ✅ Pattern stored');

  // Check DPCM directly
  const dpcm = (storageManager as any).dpcm;
  console.log('\n2️⃣ Checking DPCM state:');
  const stats = dpcm.getStats();
  console.log(`   Total entries: ${stats.totalEntries}`);
  console.log(`   Unique patterns: ${stats.uniquePatterns}`);
  
  // Query from DPCM
  console.log('\n3️⃣ Querying from DPCM:');
  const results = dpcm.query('*', [], { maxResults: 10 });
  console.log(`   Found ${results.length} patterns`);
  
  // Query via StorageManager
  console.log('\n4️⃣ Querying via StorageManager:');
  const managerResults = await storageManager.queryPatterns('*', [], { maxResults: 10 });
  console.log(`   Found ${managerResults.length} patterns`);
  
  // Check internal maps
  const memoryStore = (dpcm as any).memoryStore;
  console.log('\n5️⃣ Internal memory store:');
  console.log(`   Map size: ${memoryStore?.size || 0}`);
  if (memoryStore && memoryStore.size > 0) {
    console.log('   First pattern:');
    const firstPattern = memoryStore.values().next().value;
    console.log(`     ID: ${firstPattern.id}`);
    console.log(`     Coordinates: [${firstPattern.coordinates.join(', ')}]`);
  }
  
  // Now test with QPFM
  console.log('\n6️⃣ Testing with QPFM using same StorageManager...');
  const { QuantumProbabilityFieldMemory } = await import('./src/memory/quantum-memory-system.js');
  const qpfm = new QuantumProbabilityFieldMemory({}, storageManager);
  
  // Check if QPFM sees the same DPCM
  const qpfmDpcm = (qpfm as any).dpcmStore;
  console.log(`   QPFM DPCM same as StorageManager DPCM: ${qpfmDpcm === dpcm}`);
  
  // Initialize QPFM to load existing patterns
  await qpfm.initialize();
  
  const qpfmStats = qpfm.getStats();
  console.log(`   QPFM total memories: ${qpfmStats.totalMemories}`);
  console.log(`   QPFM DPCM entries: ${qpfmStats.dpcmStats?.totalEntries || 0}`);
  
  await storageManager.disconnect();
  console.log('\n✅ Test completed');
}

testDPCMStorage().catch(console.error);