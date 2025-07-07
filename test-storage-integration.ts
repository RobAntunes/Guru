#!/usr/bin/env tsx
/**
 * Test Storage Integration for QPFM
 * Verifies that QPFM can persist and retrieve data through StorageManager
 */

import { createProductionQuantumMemory, createInMemoryQuantumMemory } from './src/memory/quantum-memory-factory.js';
import { HarmonicPatternMemory, PatternCategory } from './src/memory/types.js';
import { v4 as uuidv4 } from 'uuid';

async function testStorageIntegration() {
  console.log('🧪 Testing QPFM Storage Integration...\n');

  try {
    // Test 1: Create QPFM with storage
    console.log('1️⃣ Creating QPFM with full storage connectivity...');
    const qpfm = await createProductionQuantumMemory();
    const isConnected = qpfm.isConnected();
    console.log(`   Storage connected: ${isConnected ? '✅' : '❌'}`);
    
    if (!isConnected) {
      console.log('   ⚠️  Running in in-memory mode (databases not available)\n');
    }

    // Test 2: Store a test pattern
    console.log('2️⃣ Storing test pattern...');
    const testPattern: HarmonicPatternMemory = {
      id: uuidv4(),
      pattern: 'test-storage-pattern',
      category: PatternCategory.ARCHITECTURAL,
      evidence: [{
        type: 'structural',
        description: 'Test pattern for storage verification',
        location: 'test-storage-integration.ts',
        confidence: 0.95
      }],
      confidence: 0.95,
      locations: [{
        file: 'test-storage-integration.ts',
        startLine: 1,
        endLine: 50,
        startColumn: 0,
        endColumn: 0
      }],
      timestamp: new Date(),
      content: {
        title: 'Storage Integration Test',
        description: 'Testing QPFM storage connectivity',
        type: 'test',
        tags: ['storage', 'integration', 'test'],
        data: {
          purpose: 'verify storage works',
          timestamp: new Date().toISOString()
        }
      },
      harmonicProperties: {
        category: PatternCategory.ARCHITECTURAL as any,
        strength: 0.9,
        occurrences: 1,
        confidence: 0.95,
        complexity: 0.3
      },
      coordinates: [0, 0, 0] // Will be updated by DPCM
    };

    await qpfm.store(testPattern);
    console.log('   ✅ Pattern stored successfully');

    // Test 3: Query the pattern back
    console.log('\n3️⃣ Querying stored pattern...');
    // Query with precision mode for better retrieval
    const queryResult = await qpfm.query({
      type: 'precision',
      confidence: 0.9,
      exploration: 0.1,
      harmonicSignature: {
        category: PatternCategory.ARCHITECTURAL,
        strength: 0.9,
        complexity: 0.3,
        confidence: 0.95,
        occurrences: 1
      }
    });
    console.log(`   Found ${queryResult.memories.length} memories`);
    console.log(`   Coherence level: ${queryResult.coherenceLevel.toFixed(3)}`);
    
    if (queryResult.memories.length > 0) {
      const retrievedMemory = queryResult.memories[0];
      console.log(`   ✅ Retrieved memory: ${retrievedMemory.content.title}`);
      console.log(`   Coordinates: [${retrievedMemory.coordinates.map(c => c.toFixed(3)).join(', ')}]`);
    }

    // Test 4: Find similar patterns
    console.log('\n4️⃣ Testing similarity search...');
    if (queryResult.memories.length > 0) {
      const similar = await qpfm.findSimilar(queryResult.memories[0].id);
      console.log(`   Found ${similar.length} similar patterns`);
    }

    // Test 5: Pattern distribution
    console.log('\n5️⃣ Getting pattern distribution...');
    const distribution = await qpfm.getPatternDistribution();
    console.log('   Pattern distribution:');
    for (const [category, count] of distribution) {
      console.log(`     ${category}: ${count}`);
    }

    // Test 6: System stats
    console.log('\n6️⃣ System statistics:');
    const stats = qpfm.getStats();
    console.log(`   Total memories: ${stats.totalMemories}`);
    console.log(`   DPCM entries: ${stats.dpcmStats?.totalEntries || 0}`);
    console.log(`   Average response time: ${stats.context.performanceMetrics.avgResponseTime.toFixed(2)}ms`);

    console.log('\n✅ Storage integration test completed successfully!');

  } catch (error) {
    console.error('\n❌ Storage integration test failed:', error);
  }
}

// Run the test
testStorageIntegration().catch(console.error);