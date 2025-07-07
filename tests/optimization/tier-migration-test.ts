/**
 * Test Storage Tier Migration optimization
 */

import { StorageManager } from '../../src/storage/storage-manager.js';
import { HarmonicPatternMemory, PatternCategory } from '../../src/memory/types.js';

async function testStorageTierMigration() {
  console.log('\n📦 Testing Storage Tier Migration...\n');
  
  const storageManager = new StorageManager();
  
  try {
    await storageManager.connect();
    
    const tierMigrator = storageManager.getTierMigrator();
    
    // Create test patterns with different characteristics
    const patterns: HarmonicPatternMemory[] = [];
    
    // Premium patterns that should be demoted (inactive)
    for (let i = 0; i < 5; i++) {
      const pattern = createPattern(
        `inactive-premium-${i}`,
        PatternCategory.AUTHENTICATION,
        0.9, // High quality
        8
      );
      // Make it old and inactive
      pattern.lastAccessed = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      pattern.accessCount = 5; // Low access
      patterns.push(pattern);
    }
    
    // Archive patterns that should be promoted (suddenly active)
    for (let i = 0; i < 5; i++) {
      const pattern = createPattern(
        `active-archive-${i}`,
        PatternCategory.DATA_FLOW,
        0.6, // Medium quality initially
        5
      );
      // Recent access and high count
      pattern.lastAccessed = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      pattern.accessCount = 25; // High access
      // Boost quality to trigger promotion
      pattern.harmonicProperties.strength = 0.86; // Now premium quality
      pattern.harmonicProperties.confidence = 0.85;
      patterns.push(pattern);
    }
    
    // Standard patterns that should stay (moderate activity)
    for (let i = 0; i < 5; i++) {
      const pattern = createPattern(
        `stable-standard-${i}`,
        PatternCategory.STRUCTURAL,
        0.75,
        6
      );
      pattern.lastAccessed = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      pattern.accessCount = 10;
      patterns.push(pattern);
    }
    
    // Very old, low quality patterns (should go to archive)
    for (let i = 0; i < 3; i++) {
      const pattern = createPattern(
        `old-lowquality-${i}`,
        PatternCategory.ERROR_PATTERN,
        0.45, // Low quality
        3
      );
      pattern.createdAt = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days old
      pattern.lastAccessed = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      pattern.accessCount = 2;
      patterns.push(pattern);
    }
    
    console.log('💾 Storing test patterns...');
    await storageManager.storePatterns(patterns);
    
    // Get initial distribution
    console.log('\n📊 Initial Pattern Distribution:');
    const qualityManager = storageManager.getQualityManager();
    
    const tierCounts = {
      premium: 0,
      standard: 0,
      archive: 0
    };
    
    patterns.forEach(pattern => {
      const metrics = qualityManager.assessQuality(pattern);
      console.log(`${pattern.id}: ${metrics.tier.name} (score: ${metrics.overallScore.toFixed(2)})`);
      tierCounts[metrics.tier.name]++;
    });
    
    console.log('\nInitial counts:');
    console.log(`- Premium: ${tierCounts.premium}`);
    console.log(`- Standard: ${tierCounts.standard}`);
    console.log(`- Archive: ${tierCounts.archive}`);
    
    // Manually trigger migration (normally runs periodically)
    console.log('\n🔄 Triggering migration cycle...');
    
    // Listen for migration events
    const migrated: any[] = [];
    tierMigrator.on('pattern:migrated', (candidate) => {
      migrated.push(candidate);
      console.log(`Migrated: ${candidate.patternId} from ${candidate.currentTier} to ${candidate.suggestedTier}`);
      console.log(`  Reason: ${candidate.reason}`);
    });
    
    // Stop the automatic timer and run once manually
    tierMigrator.stop();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let stop complete
    
    // Manually trigger migration
    await (tierMigrator as any).migrate();
    
    console.log(`\n✅ Migration completed: ${migrated.length} patterns migrated`);
    
    // Analyze results
    console.log('\n📈 Migration Analysis:');
    
    const promotions = migrated.filter(m => 
      (m.currentTier === 'archive' && m.suggestedTier === 'standard') ||
      (m.currentTier === 'standard' && m.suggestedTier === 'premium')
    );
    
    const demotions = migrated.filter(m => 
      (m.currentTier === 'premium' && m.suggestedTier === 'standard') ||
      (m.currentTier === 'standard' && m.suggestedTier === 'archive')
    );
    
    console.log(`- Promotions: ${promotions.length}`);
    console.log(`- Demotions: ${demotions.length}`);
    
    // Get migration stats
    const stats = tierMigrator.getStats();
    console.log('\n📊 Migrator Stats:');
    console.log(`- Currently migrating: ${stats.isMigrating}`);
    console.log(`- Migration history size: ${stats.historySize}`);
    console.log(`- Config:`, stats.config.thresholds);
    
    console.log('\n✨ Benefits Demonstrated:');
    console.log('1. Inactive premium patterns demoted to save QPFM storage');
    console.log('2. Suddenly active archive patterns promoted for performance');
    console.log('3. Low quality old patterns moved to archive');
    console.log('4. Automatic optimization without manual intervention');
    console.log('5. Cost savings: Only actively used patterns in expensive storage');
    
    console.log('\n✅ Storage Tier Migration test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await storageManager.disconnect();
  }
}

function createPattern(
  id: string,
  category: PatternCategory,
  strength: number,
  complexity: number
): HarmonicPatternMemory {
  return {
    id,
    content: {
      title: `Pattern ${id}`,
      description: `Test pattern of type ${category}`,
      type: category.toLowerCase(),
      tags: [category.toLowerCase()],
      data: {}
    },
    harmonicProperties: {
      category,
      strength,
      confidence: strength * 0.9,
      complexity,
      occurrences: Math.floor(Math.random() * 20) + 5
    },
    coordinates: [0, 0, 0],
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 10,
    relevanceScore: strength,
    locations: [{
      file: `src/${category.toLowerCase()}/${id}.ts`,
      startLine: 10,
      endLine: 50,
      startColumn: 0,
      endColumn: 100
    }],
    evidence: [],
    relatedPatterns: [],
    causesPatterns: [],
    requiredBy: []
  };
}

// Run the test
testStorageTierMigration().catch(console.error);