/**
 * Test Pattern Quality Filtering optimization
 */

import { StorageManager } from '../../src/storage/storage-manager.js';
import { HarmonicPatternMemory, PatternCategory } from '../../src/memory/types.js';
import { Logger } from '../../src/logging/logger.js';

const logger = Logger.getInstance();

async function testPatternQualityRouting() {
  const storageManager = new StorageManager();
  
  try {
    await storageManager.connect();
    
    // Create test patterns with different quality levels
    const testPatterns: HarmonicPatternMemory[] = [
      // Premium pattern (0.85+ score)
      {
        id: 'test-premium-1',
        content: {
          title: 'Premium Security Pattern',
          description: 'High-quality authentication pattern',
          type: 'authentication',
          tags: ['security', 'premium'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.AUTHENTICATION,
          strength: 0.92,
          confidence: 0.88,
          complexity: 8,
          occurrences: 15
        },
        coordinates: [0.9, 0.9, 0.9],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 50,
        relevanceScore: 0.9,
        locations: [],
        evidence: [],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      },
      
      // Standard pattern (0.70-0.84 score)
      {
        id: 'test-standard-1',
        content: {
          title: 'Standard Data Flow',
          description: 'Common data flow pattern',
          type: 'data_flow',
          tags: ['data', 'standard'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.DATA_FLOW,
          strength: 0.75,
          confidence: 0.72,
          complexity: 5,
          occurrences: 8
        },
        coordinates: [0.7, 0.7, 0.7],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 20,
        relevanceScore: 0.75,
        locations: [],
        evidence: [],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      },
      
      // Archive pattern (0.50-0.69 score)
      {
        id: 'test-archive-1',
        content: {
          title: 'Legacy Pattern',
          description: 'Old pattern with low usage',
          type: 'structural',
          tags: ['legacy', 'archive'],
          data: {}
        },
        harmonicProperties: {
          category: PatternCategory.STRUCTURAL,
          strength: 0.55,
          confidence: 0.60,
          complexity: 3,
          occurrences: 2
        },
        coordinates: [0.5, 0.5, 0.5],
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days old
        lastAccessed: Date.now() - 5 * 24 * 60 * 60 * 1000,
        accessCount: 5,
        relevanceScore: 0.55,
        locations: [],
        evidence: [],
        relatedPatterns: [],
        causesPatterns: [],
        requiredBy: []
      }
    ];
    
    console.log('\n🧪 Testing Pattern Quality Routing...');
    
    // Test individual pattern routing
    for (const pattern of testPatterns) {
      const qualityManager = storageManager.getQualityManager();
      const metrics = qualityManager.assessQuality(pattern);
      
      console.log(`\nPattern ${pattern.id}:`);
      console.log(`  - Overall Score: ${metrics.overallScore.toFixed(3)}`);
      console.log(`  - Tier: ${metrics.tier.name}`);
      console.log(`  - Storage: ${metrics.tier.storage}`);
      console.log(`  - Cache: ${metrics.tier.cache} (TTL: ${metrics.tier.ttl}s)`);
      console.log(`  - Breakdown:`, metrics.breakdown);
    }
    
    // Test bulk routing
    console.log('\n📦 Testing bulk pattern routing...');
    const startTime = Date.now();
    await storageManager.storePatterns(testPatterns);
    const duration = Date.now() - startTime;
    console.log(`Bulk routing completed in ${duration}ms`);
    
    // Get storage recommendations
    const recommendations = await storageManager.getStorageOptimizationRecommendations();
    console.log('\n📊 Storage Optimization Recommendations:');
    console.log(`  - Storage Efficiency: ${(recommendations.storageEfficiency * 100).toFixed(1)}%`);
    console.log(`  - Quality Distribution:`, recommendations.qualityDistribution);
    recommendations.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    // Test quality-based retrieval
    console.log('\n🔍 Testing pattern retrieval by quality tier...');
    
    // Simulate retrieving premium patterns (would come from cache)
    const premiumPattern = testPatterns.find(p => p.id === 'test-premium-1');
    if (premiumPattern) {
      console.log(`Premium pattern ${premiumPattern.id} would be served from hot cache`);
    }
    
    console.log('\n✅ Pattern Quality Filtering test completed!');
    
  } catch (error) {
    logger.error('Test failed:', error);
  } finally {
    await storageManager.disconnect();
  }
}

// Run the test
testPatternQualityRouting().catch(console.error);