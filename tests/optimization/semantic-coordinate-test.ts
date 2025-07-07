/**
 * Test Semantic Coordinate Space optimization
 */

import { DPCMPatternStore } from '../../src/storage/dpcm-pattern-store.js';
import { HarmonicPatternMemory, PatternCategory } from '../../src/memory/types.js';

async function testSemanticCoordinateMapping() {
  console.log('\n🌍 Testing Semantic Coordinate Space Optimization...\n');
  
  const store = new DPCMPatternStore();
  
  // Create test patterns from different categories
  const testPatterns: HarmonicPatternMemory[] = [
    // Security patterns (should cluster around 0.15-0.2 on X-axis)
    createPattern('auth-1', PatternCategory.AUTHENTICATION, 0.9, 8, 10),
    createPattern('auth-2', PatternCategory.AUTHENTICATION, 0.85, 7, 15),
    createPattern('crypto-1', PatternCategory.CRYPTOGRAPHIC, 0.95, 9, 5),
    
    // Data patterns (should cluster around 0.35-0.4 on X-axis)
    createPattern('data-1', PatternCategory.DATA_FLOW, 0.7, 5, 20),
    createPattern('state-1', PatternCategory.STATE_MANAGEMENT, 0.75, 6, 12),
    
    // Structural patterns (should cluster around 0.55-0.6 on X-axis)
    createPattern('struct-1', PatternCategory.STRUCTURAL, 0.8, 4, 25),
    createPattern('behav-1', PatternCategory.BEHAVIORAL, 0.78, 5, 18),
    
    // Error patterns (should cluster around 0.9-0.95 on X-axis)
    createPattern('error-1', PatternCategory.ERROR_PATTERN, 0.6, 3, 30),
    createPattern('recovery-1', PatternCategory.RECOVERY, 0.65, 4, 22)
  ];
  
  // Test with semantic mapping ENABLED
  console.log('📍 Testing with Semantic Mapping ENABLED:');
  store.setSemanticMapping(true);
  
  // Store patterns
  testPatterns.forEach(pattern => store.store(pattern));
  
  // Analyze coordinate distribution
  const semanticAnalysis = store.analyzeCoordinateSpace();
  console.log('\nSemantic Coordinate Analysis:');
  console.log('- Category Distribution:');
  semanticAnalysis.density.forEach((count, category) => {
    console.log(`  ${category}: ${count} patterns`);
  });
  
  console.log('\n- Detected Clusters:');
  semanticAnalysis.clusters.slice(0, 3).forEach(cluster => {
    console.log(`  Center: [${cluster.center.map(c => c.toFixed(2)).join(', ')}], Count: ${cluster.count}`);
  });
  
  console.log('\n- Recommendations:');
  semanticAnalysis.recommendations.forEach(rec => {
    console.log(`  ${rec}`);
  });
  
  // Test semantic distance
  console.log('\n📏 Semantic Distance Examples:');
  console.log(`- auth-1 ↔ auth-2: ${store.getSemanticDistance('auth-1', 'auth-2')?.toFixed(3)}`);
  console.log(`- auth-1 ↔ crypto-1: ${store.getSemanticDistance('auth-1', 'crypto-1')?.toFixed(3)}`);
  console.log(`- auth-1 ↔ error-1: ${store.getSemanticDistance('auth-1', 'error-1')?.toFixed(3)}`);
  
  // Clear and test with random mapping
  store.clear();
  console.log('\n\n📍 Testing with Semantic Mapping DISABLED (random):');
  store.setSemanticMapping(false);
  
  // Store same patterns with random coordinates
  testPatterns.forEach(pattern => store.store(pattern));
  
  // Get stats to see coordinate spread
  const randomStats = store.getStats();
  console.log('\nRandom Coordinate Spread:');
  console.log(`- Min: [${randomStats.coordinateSpread.min.map(c => c.toFixed(2)).join(', ')}]`);
  console.log(`- Max: [${randomStats.coordinateSpread.max.map(c => c.toFixed(2)).join(', ')}]`);
  
  // Performance comparison
  console.log('\n⚡ Performance Benefits of Semantic Coordinates:');
  console.log('1. Similar patterns cluster together → faster proximity searches');
  console.log('2. Category-based regions → efficient category filtering');
  console.log('3. Time-based Z-axis → natural aging and freshness queries');
  console.log('4. Predictable distribution → better cache locality');
  
  console.log('\n✅ Semantic Coordinate Space test completed!');
}

function createPattern(
  id: string,
  category: PatternCategory,
  strength: number,
  complexity: number,
  occurrences: number
): HarmonicPatternMemory {
  return {
    id,
    content: {
      title: `Test Pattern ${id}`,
      description: `Pattern of category ${category}`,
      type: category.toLowerCase(),
      tags: [category.toLowerCase()],
      data: {}
    },
    harmonicProperties: {
      category,
      strength,
      confidence: strength * 0.9,
      complexity,
      occurrences
    },
    coordinates: [0, 0, 0], // Will be replaced by mapper
    createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random age up to 7 days
    lastAccessed: Date.now(),
    accessCount: occurrences * 2,
    relevanceScore: strength,
    locations: [],
    evidence: [],
    relatedPatterns: [],
    causesPatterns: [],
    requiredBy: []
  };
}

// Run the test
testSemanticCoordinateMapping().catch(console.error);