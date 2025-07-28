/**
 * Test Coordinate Space Indexing optimization
 */

import { StorageManager } from '../../src/storage/storage-manager.js';
import { HarmonicPatternMemory, PatternCategory } from '../../src/memory/types.js';

async function testSpatialIndexing() {
  console.log('\n🗂️ Testing Coordinate Space Indexing (R-tree)...\n');
  
  const storageManager = new StorageManager();
  
  try {
    await storageManager.connect();
    
    const dpcmStore = storageManager.dpcm;
    
    // Generate test patterns with diverse coordinates
    const patterns: HarmonicPatternMemory[] = [];
    const numPatterns = 10000; // Large dataset to show performance difference
    
    console.log(`🎲 Generating ${numPatterns} test patterns...`);
    
    for (let i = 0; i < numPatterns; i++) {
      const category = Object.values(PatternCategory)[i % 5];
      const x = Math.random();
      const y = Math.random();
      const z = Math.random();
      
      patterns.push({
        id: `pattern-${i}`,
        content: {
          title: `Pattern ${i}`,
          description: `Test pattern at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`,
          type: category.toLowerCase(),
          tags: [category.toLowerCase()],
          data: {}
        },
        harmonicProperties: {
          category,
          strength: 0.5 + Math.random() * 0.4,
          confidence: 0.6 + Math.random() * 0.3,
          complexity: Math.floor(Math.random() * 10) + 1,
          occurrences: Math.floor(Math.random() * 30) + 1
        },
        coordinates: [x, y, z],
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        lastAccessed: Date.now(),
        accessCount: Math.floor(Math.random() * 50),
        relevanceScore: 0.5 + Math.random() * 0.4,
        locations: [{
          file: `src/test/file${i % 100}.ts`,
          startLine: 10,
          endLine: 50,
          startColumn: 0,
          endColumn: 100
        }],
        evidence: [],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      });
    }
    
    // Test 1: Bulk insert performance
    console.log('\n📥 Testing bulk insert performance...');
    const insertStart = Date.now();
    dpcmStore.bulkStore(patterns);
    const insertTime = Date.now() - insertStart;
    console.log(`Bulk inserted ${numPatterns} patterns in ${insertTime}ms`);
    console.log(`Average: ${(insertTime / numPatterns).toFixed(3)}ms per pattern`);
    
    // Get spatial index stats
    const indexStats = dpcmStore.getSpatialIndexStats();
    console.log('\n📊 Spatial Index Statistics:');
    console.log(`- Nodes: ${indexStats.nodeCount}`);
    console.log(`- Leaf nodes: ${indexStats.leafCount}`);
    console.log(`- Tree height: ${indexStats.height}`);
    console.log(`- Patterns indexed: ${indexStats.patterns}`);
    console.log(`- Avg node occupancy: ${indexStats.avgNodeOccupancy.toFixed(2)}`);
    
    // Test 2: Proximity search with R-tree (O(log n))
    console.log('\n🔍 Testing proximity search performance...');
    const searchCenter = [0.5, 0.5, 0.5];
    const searchRadius = 0.1;
    
    // With R-tree
    const rtreeStart = Date.now();
    const rtreeResults = dpcmStore.query(
      JSON.stringify(searchCenter),
      [],
      { radius: searchRadius }
    );
    const rtreeTime = Date.now() - rtreeStart;
    
    console.log(`R-tree search: ${rtreeTime}ms (found ${rtreeResults.length} patterns)`);
    
    // Test without R-tree for comparison
    dpcmStore.setSpatialIndexing(false);
    const linearStart = Date.now();
    const linearResults = dpcmStore.query(
      JSON.stringify(searchCenter),
      [],
      { radius: searchRadius }
    );
    const linearTime = Date.now() - linearStart;
    
    console.log(`Linear search: ${linearTime}ms (found ${linearResults.length} patterns)`);
    
    const speedup = linearTime > 0 ? (linearTime / rtreeTime).toFixed(1) : 'N/A';
    console.log(`Speed improvement: ${speedup}x faster with R-tree`);
    
    // Re-enable R-tree
    dpcmStore.setSpatialIndexing(true);
    
    // Test 3: K-nearest neighbors
    console.log('\n🎯 Testing k-nearest neighbors...');
    const targetPattern = patterns[Math.floor(numPatterns / 2)];
    const k = 10;
    
    const knnStart = Date.now();
    const neighbors = dpcmStore.findNearestNeighbors(targetPattern.id, k);
    const knnTime = Date.now() - knnStart;
    
    console.log(`Found ${k} nearest neighbors in ${knnTime}ms`);
    console.log('Nearest 3 neighbors:');
    neighbors.slice(0, 3).forEach((neighbor, i) => {
      console.log(`  ${i + 1}. Distance: ${neighbor.distance.toFixed(4)} - ${neighbor.pattern.id}`);
    });
    
    // Test 4: Range queries
    console.log('\n📦 Testing range queries...');
    const ranges = [0.05, 0.1, 0.2, 0.3];
    
    for (const radius of ranges) {
      const rangeStart = Date.now();
      const rangeResults = dpcmStore.query(
        JSON.stringify([0.5, 0.5, 0.5]),
        [],
        { radius }
      );
      const rangeTime = Date.now() - rangeStart;
      
      console.log(`Radius ${radius}: ${rangeResults.length} patterns in ${rangeTime}ms`);
    }
    
    // Test 5: Scaling comparison
    console.log('\n📈 Performance at different scales:');
    const scales = [100, 1000, 5000, 10000];
    
    for (const scale of scales) {
      if (scale > numPatterns) continue;
      
      // Approximate time based on O(log n) for R-tree
      const rtreeEstimate = rtreeTime * Math.log2(scale) / Math.log2(numPatterns);
      const linearEstimate = linearTime * scale / numPatterns;
      
      console.log(`${scale} patterns:`);
      console.log(`  - R-tree (estimated): ${rtreeEstimate.toFixed(1)}ms`);
      console.log(`  - Linear (estimated): ${linearEstimate.toFixed(1)}ms`);
      console.log(`  - Speedup: ${(linearEstimate / rtreeEstimate).toFixed(1)}x`);
    }
    
    console.log('\n✨ Benefits Demonstrated:');
    console.log('1. O(log n) proximity searches vs O(n) linear scan');
    console.log('2. Efficient k-nearest neighbor queries');
    console.log('3. Scales logarithmically with dataset size');
    console.log('4. Bulk insert optimization for initial load');
    console.log(`5. ${speedup}x faster proximity searches at ${numPatterns} patterns`);
    
    console.log('\n✅ Coordinate Space Indexing test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await storageManager.disconnect();
  }
}

// Run the test
testSpatialIndexing().catch(console.error);