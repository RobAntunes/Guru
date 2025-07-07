#!/usr/bin/env tsx
/**
 * Debug DPCM Store
 */

import { StorageManager } from './src/storage/storage-manager.js';
import { DPCMPatternStore } from './src/storage/dpcm-pattern-store.js';

async function debugDPCM() {
  console.log('🔍 Debugging DPCM Store...\n');

  // Create and connect storage manager
  const storageManager = new StorageManager();
  await storageManager.connect();
  
  // Access DPCM directly
  const dpcm = (storageManager as any).dpcm as DPCMPatternStore;
  
  console.log('📊 DPCM Stats:');
  const stats = dpcm.getStats();
  console.log(`   Total entries: ${stats.totalEntries}`);
  console.log(`   Unique patterns: ${stats.uniquePatterns}`);
  console.log(`   Total operations: ${stats.totalOperations}`);
  
  // Check internal maps
  const memoryStore = (dpcm as any).memoryStore;
  const coordinateIndex = (dpcm as any).coordinateIndex;
  const categoryIndex = (dpcm as any).categoryIndex;
  
  console.log('\n🗺️  Internal state:');
  console.log(`   Memory store size: ${memoryStore?.size || 0}`);
  console.log(`   Coordinate index size: ${coordinateIndex?.size || 0}`);
  console.log(`   Category index size: ${categoryIndex?.size || 0}`);
  
  // List all patterns
  if (memoryStore && memoryStore.size > 0) {
    console.log('\n📦 Stored patterns:');
    let count = 0;
    for (const [id, pattern] of memoryStore.entries()) {
      if (count++ < 5) {  // Show first 5
        console.log(`   ID: ${id}`);
        console.log(`     Category: ${pattern.harmonicProperties?.category}`);
        console.log(`     Coordinates: [${pattern.coordinates.join(', ')}]`);
        console.log(`     Title: ${pattern.content.title}`);
      }
    }
  }
  
  // Test a query
  console.log('\n🔎 Test query:');
  const results = dpcm.query('*', [], { maxResults: 10 });
  console.log(`   Query '*' found: ${results.length} patterns`);
  
  // Query by category  
  if (categoryIndex && categoryIndex.size > 0) {
    console.log('\n📂 Categories in index:');
    for (const [category, ids] of categoryIndex.entries()) {
      console.log(`   ${category}: ${ids.length} patterns`);
    }
  }
  
  await storageManager.disconnect();
}

debugDPCM().catch(console.error);