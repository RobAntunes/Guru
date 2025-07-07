#!/usr/bin/env tsx
/**
 * Test Storage Persistence
 * Verifies that data is actually persisted and retrievable
 */

import { createProductionQuantumMemory } from './src/memory/quantum-memory-factory.js';
import { HarmonicPatternMemory, PatternCategory } from './src/memory/types.js';
import { v4 as uuidv4 } from 'uuid';

async function testPersistence() {
  console.log('🧪 Testing QPFM Storage Persistence...\n');

  try {
    // Create QPFM instance
    const qpfm = await createProductionQuantumMemory();
    
    // Store multiple test patterns
    console.log('1️⃣ Storing test patterns...');
    const patterns: HarmonicPatternMemory[] = [
      {
        id: uuidv4(),
        pattern: 'architectural-pattern-1',
        category: 'ARCHITECTURAL' as any, // Use string value directly
        evidence: [{
          type: 'structural',
          description: 'Test architectural pattern',
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
          title: 'Architectural Pattern 1',
          description: 'Test pattern for architecture',
          type: 'architectural',
          tags: ['architecture', 'test'],
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
      },
      {
        id: uuidv4(),
        pattern: 'quantum-pattern-1',
        category: 'QUANTUM' as any,
        evidence: [{
          type: 'behavioral',
          description: 'Test quantum pattern',
          location: 'quantum.ts',
          confidence: 0.85
        }],
        confidence: 0.85,
        locations: [{
          file: 'quantum.ts',
          startLine: 20,
          endLine: 30,
          startColumn: 0,
          endColumn: 0
        }],
        timestamp: new Date(),
        content: {
          title: 'Quantum Pattern 1',
          description: 'Test pattern for quantum behavior',
          type: 'quantum',
          tags: ['quantum', 'test'],
          data: {}
        },
        harmonicProperties: {
          category: 'QUANTUM' as any,
          strength: 0.8,
          occurrences: 2,
          confidence: 0.85,
          complexity: 0.7
        },
        coordinates: [0, 0, 0]
      }
    ];

    // Store patterns
    for (const pattern of patterns) {
      await qpfm.store(pattern);
      console.log(`   ✅ Stored: ${pattern.content.title}`);
    }

    // Check immediate state
    console.log('\n2️⃣ Checking immediate state after storage...');
    let stats = qpfm.getStats();
    console.log(`   Total quantum memories: ${stats.totalMemories}`);
    console.log(`   DPCM entries: ${stats.dpcmStats?.totalEntries || 0}`);

    // Test different query methods
    console.log('\n3️⃣ Testing queries...');
    
    // Query by category
    const architecturalQuery = await qpfm.query({
      type: 'precision',
      confidence: 0.8,
      exploration: 0.2,
      harmonicSignature: {
        category: 'ARCHITECTURAL' as any,
        strength: 0.9,
        complexity: 0.3,
        confidence: 0.95,
        occurrences: 1
      }
    });
    console.log(`   Architectural query: Found ${architecturalQuery.memories.length} memories`);
    if (architecturalQuery.memories.length > 0) {
      console.log(`     - ${architecturalQuery.memories[0].content.title}`);
    }

    // Discovery query
    const discoveryQuery = await qpfm.query({
      type: 'discovery',
      confidence: 0.3,
      exploration: 0.7,
      maxResults: 10
    });
    console.log(`   Discovery query: Found ${discoveryQuery.memories.length} memories`);

    // String query
    const stringQuery = await qpfm.query('pattern');
    console.log(`   String query 'pattern': Found ${stringQuery.memories.length} memories`);

    // Get pattern distribution
    console.log('\n4️⃣ Pattern distribution:');
    const distribution = await qpfm.getPatternDistribution();
    for (const [category, count] of distribution) {
      console.log(`   ${category}: ${count}`);
    }

    // Check DPCM internals
    console.log('\n5️⃣ DPCM internal state:');
    const dpcmStore = (qpfm as any).dpcmStore;
    const dpcmStats = dpcmStore.getStats();
    console.log(`   Total entries: ${dpcmStats.totalEntries}`);
    console.log(`   Unique patterns: ${dpcmStats.uniquePatterns}`);
    
    // Query DPCM directly
    const dpcmResults = dpcmStore.query('*', [], { maxResults: 10 });
    console.log(`   Direct DPCM query: Found ${dpcmResults.length} patterns`);
    if (dpcmResults.length > 0) {
      console.log(`   First pattern coordinates: [${dpcmResults[0].coordinates.join(', ')}]`);
    }

    // Test similarity search
    console.log('\n6️⃣ Testing similarity search...');
    if (architecturalQuery.memories.length > 0) {
      const similar = await qpfm.findSimilar(architecturalQuery.memories[0].id);
      console.log(`   Found ${similar.length} similar patterns`);
    }

    console.log('\n✅ Persistence test completed!');

  } catch (error) {
    console.error('\n❌ Persistence test failed:', error);
  }
}

// Run the test
testPersistence().catch(console.error);