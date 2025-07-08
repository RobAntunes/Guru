/**
 * Pattern-Symbol Linker
 * Creates relationships between harmonic patterns and the symbols they're found in
 */

import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';
import { StorageManager } from '../storage/storage-manager.js';
import { HarmonicPatternMemory, CodeLocation } from '../memory/types.js';

interface PatternSymbolLink {
  patternId: string;
  symbolId: string;
  strength: number;
  confidence: number;
  evidence: any;
  overlap: {
    percentage: number;
    lines: number;
  };
}

export class PatternSymbolLinker {
  private storage: UnifiedStorageManager;
  private storageManager: StorageManager;

  constructor() {
    this.storage = new UnifiedStorageManager();
    this.storageManager = new StorageManager();
  }

  async connect(): Promise<void> {
    await this.storage.initialize();
    await this.storageManager.connect();
    console.log('✅ Connected for pattern-symbol linking');
  }

  async disconnect(): Promise<void> {
    await this.storage.close();
    await this.storageManager.disconnect();
    console.log('📴 Disconnected from databases');
  }

  /**
   * Main linking method - connects patterns to symbols based on location overlap
   */
  async linkPatternsToSymbols(): Promise<{
    linksCreated: number;
    patternsProcessed: number;
    symbolsLinked: number;
    errors: string[];
  }> {
    console.log('🔗 Starting Pattern-Symbol Linking...\n');
    
    const stats = {
      linksCreated: 0,
      patternsProcessed: 0,
      symbolsLinked: new Set<string>(),
      errors: [] as string[]
    };

    try {
      // 1. Get all patterns from storage
      console.log('1️⃣ Loading patterns from storage...');
      const patterns = await this.storageManager.queryPatterns('*', [], { maxResults: 10000 });
      console.log(`   Found ${patterns.length} patterns to process`);

      // 2. Process each pattern
      for (const pattern of patterns) {
        try {
          const links = await this.findSymbolsForPattern(pattern);
          
          for (const link of links) {
            await this.createPatternSymbolLink(link);
            stats.linksCreated++;
            stats.symbolsLinked.add(link.symbolId);
          }
          
          stats.patternsProcessed++;
          
          if (stats.patternsProcessed % 50 === 0) {
            console.log(`   Progress: ${stats.patternsProcessed}/${patterns.length} patterns`);
          }
        } catch (error) {
          stats.errors.push(`Pattern ${pattern.id}: ${error}`);
        }
      }

      console.log(`\n✅ Linking complete:`);
      console.log(`   Patterns processed: ${stats.patternsProcessed}`);
      console.log(`   Links created: ${stats.linksCreated}`);
      console.log(`   Unique symbols linked: ${stats.symbolsLinked.size}`);

      // 3. Create pattern similarity relationships
      console.log('\n2️⃣ Creating pattern similarity relationships...');
      await this.createPatternSimilarityRelationships(patterns);

      // 4. Calculate pattern propagation metrics
      console.log('\n3️⃣ Calculating pattern propagation metrics...');
      await this.calculatePatternPropagation();

    } catch (error) {
      console.error('❌ Linking failed:', error);
      stats.errors.push(`Fatal: ${error}`);
    }

    return {
      ...stats,
      symbolsLinked: stats.symbolsLinked.size
    };
  }

  /**
   * Find symbols that contain a pattern based on location overlap
   */
  private async findSymbolsForPattern(pattern: HarmonicPatternMemory): Promise<PatternSymbolLink[]> {
    const links: PatternSymbolLink[] = [];

    for (const location of pattern.locations) {
      // Query symbols in the same file that overlap with pattern location
      const result = await this.storage.getDatabase().query(`
        SELECT * FROM symbol WHERE file = $file
      `, { file: location.file });
      
      const overlappingSymbols = result[0]?.result || [];
      
      for (const symbol of overlappingSymbols) {
        const overlap = this.calculateOverlap(
          { start: symbol.startLine, end: symbol.endLine },
          { start: location.startLine, end: location.endLine }
        );

        if (overlap.percentage > 0.3) { // At least 30% overlap
          links.push({
            patternId: pattern.id,
            symbolId: symbol.id,
            strength: pattern.harmonicProperties.strength,
            confidence: pattern.harmonicProperties.confidence,
            evidence: {
              category: pattern.harmonicProperties.category,
              location: location,
              patternEvidence: pattern.evidence
            },
            overlap
          });
        }
      }
    }

    return links;
  }

  /**
   * Calculate overlap between pattern location and symbol location
   */
  private calculateOverlap(
    symbol: { start: number; end: number },
    pattern: { start: number; end: number }
  ): { percentage: number; lines: number } {
    const overlapStart = Math.max(symbol.start, pattern.start);
    const overlapEnd = Math.min(symbol.end, pattern.end);
    
    if (overlapStart > overlapEnd) {
      return { percentage: 0, lines: 0 };
    }

    const overlapLines = overlapEnd - overlapStart + 1;
    const symbolLines = symbol.end - symbol.start + 1;
    const percentage = overlapLines / symbolLines;

    return { percentage, lines: overlapLines };
  }

  /**
   * Create EXHIBITS relationship between symbol and pattern
   */
  private async createPatternSymbolLink(link: PatternSymbolLink): Promise<void> {
    const db = this.storage.getDatabase();
    
    await db.query(`
      LET $pattern = SELECT * FROM pattern WHERE id = $patternId;
      IF !$pattern THEN
        CREATE pattern SET id = $patternId;
      END;
      
      RELATE symbol:⟨$symbolId⟩->exhibits->pattern:⟨$patternId⟩ SET
        strength = $strength,
        confidence = $confidence,
        evidence = $evidence,
        overlapPercentage = $overlapPercentage,
        overlapLines = $overlapLines,
        createdAt = time::now()
    `, {
      symbolId: link.symbolId,
      patternId: link.patternId,
      strength: link.strength,
      confidence: link.confidence,
      evidence: JSON.stringify(link.evidence),
      overlapPercentage: link.overlap.percentage,
      overlapLines: link.overlap.lines
    });
  }

  /**
   * Create SIMILAR_TO relationships between patterns
   */
  private async createPatternSimilarityRelationships(patterns: HarmonicPatternMemory[]): Promise<void> {
    console.log(`   Calculating similarity for ${patterns.length} patterns...`);
    
    let similarityCount = 0;
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const similarity = this.calculatePatternSimilarity(patterns[i], patterns[j]);
        
        if (similarity > 0.7) { // 70% similarity threshold
          // Create similarity relationship in storage
          await this.storage.getDatabase().query(`
            RELATE pattern:⟨$pattern1⟩->similar_to->pattern:⟨$pattern2⟩ SET
              similarity = $similarity,
              sharedFeatures = $sharedFeatures,
              distance = $distance
          `, {
            pattern1: patterns[i].id,
            pattern2: patterns[j].id,
            similarity,
            sharedFeatures: this.getSharedFeatures(patterns[i], patterns[j]),
            distance: this.calculateCoordinateDistance(
              patterns[i].coordinates,
              patterns[j].coordinates
            )
          });
          similarityCount++;
        }
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`   Progress: ${i + 1}/${patterns.length} patterns analyzed`);
      }
    }
    
    console.log(`   ✅ Created ${similarityCount} similarity relationships`);
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculatePatternSimilarity(p1: HarmonicPatternMemory, p2: HarmonicPatternMemory): number {
    const categoryMatch = p1.harmonicProperties.category === p2.harmonicProperties.category ? 0.3 : 0;
    const strengthDiff = Math.abs(p1.harmonicProperties.strength - p2.harmonicProperties.strength);
    const strengthSimilarity = (1 - strengthDiff) * 0.3;
    const complexityDiff = Math.abs(p1.harmonicProperties.complexity - p2.harmonicProperties.complexity);
    const complexitySimilarity = (1 - complexityDiff) * 0.2;
    const coordinateDistance = this.calculateCoordinateDistance(p1.coordinates, p2.coordinates);
    const spatialSimilarity = Math.max(0, 1 - coordinateDistance / 2) * 0.2;
    
    return categoryMatch + strengthSimilarity + complexitySimilarity + spatialSimilarity;
  }

  /**
   * Get shared features between patterns
   */
  private getSharedFeatures(p1: HarmonicPatternMemory, p2: HarmonicPatternMemory): string[] {
    const features: string[] = [];
    
    if (p1.harmonicProperties.category === p2.harmonicProperties.category) {
      features.push(`category:${p1.harmonicProperties.category}`);
    }
    
    if (Math.abs(p1.harmonicProperties.strength - p2.harmonicProperties.strength) < 0.1) {
      features.push('similar-strength');
    }
    
    if (Math.abs(p1.harmonicProperties.complexity - p2.harmonicProperties.complexity) < 0.1) {
      features.push('similar-complexity');
    }
    
    // Check for shared evidence types
    const p1EvidenceTypes = new Set(p1.evidence.map(e => e.type));
    const p2EvidenceTypes = new Set(p2.evidence.map(e => e.type));
    const sharedEvidence = [...p1EvidenceTypes].filter(t => p2EvidenceTypes.has(t));
    features.push(...sharedEvidence.map(t => `evidence:${t}`));
    
    return features;
  }

  /**
   * Calculate distance between coordinates
   */
  private calculateCoordinateDistance(c1: number[], c2: number[]): number {
    const dx = c1[0] - c2[0];
    const dy = c1[1] - c2[1];
    const dz = c1[2] - c2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate how patterns propagate through code
   */
  private async calculatePatternPropagation(): Promise<void> {
    const db = this.storage.getDatabase();
    
    // Find pattern propagation through function calls
    const result = await db.query(`
      SELECT p1.category as category, count() as propagationCount
      FROM symbol as s1
      WHERE s1->calls->symbol as s2
        AND s1->exhibits->pattern as p1
        AND s2->exhibits->pattern as p2
        AND p1.category = p2.category
      GROUP BY category
      ORDER BY propagationCount DESC
    `);

    console.log('   Pattern propagation analysis:');
    result[0]?.result?.forEach((record: any) => {
      console.log(`     ${record.category}: ${record.propagationCount} propagations`);
    });
  }

  /**
   * Get linking statistics
   */
  async getLinkingStats(): Promise<{
    totalPatterns: number;
    totalSymbols: number;
    totalLinks: number;
    avgPatternsPerSymbol: number;
    avgSymbolsPerPattern: number;
  }> {
    const db = this.storage.getDatabase();
    
    const stats = await db.query(`
      LET $patternCount = (SELECT count() FROM pattern);
      LET $symbolCount = (SELECT count() FROM symbol);
      LET $exhibits = (SELECT * FROM exhibits);
      LET $linkCount = count($exhibits);
      LET $linkedSymbols = (SELECT count(DISTINCT in) FROM exhibits);
      LET $linkedPatterns = (SELECT count(DISTINCT out) FROM exhibits);
      
      RETURN {
        patternCount: $patternCount,
        symbolCount: $symbolCount,
        linkCount: $linkCount,
        linkedSymbols: $linkedSymbols,
        linkedPatterns: $linkedPatterns
      };
    `);

    const result = stats[0]?.result?.[0];
    if (!result) {
      return {
        totalPatterns: 0,
        totalSymbols: 0,
        totalLinks: 0,
        avgPatternsPerSymbol: 0,
        avgSymbolsPerPattern: 0
      };
    }
    
    const linkCount = result.linkCount || 0;
    const linkedSymbols = result.linkedSymbols || 0;
    const linkedPatterns = result.linkedPatterns || 0;

    return {
      totalPatterns: result.patternCount || 0,
      totalSymbols: result.symbolCount || 0,
      totalLinks: linkCount,
      avgPatternsPerSymbol: linkedSymbols > 0 ? linkCount / linkedSymbols : 0,
      avgSymbolsPerPattern: linkedPatterns > 0 ? linkCount / linkedPatterns : 0
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const linker = new PatternSymbolLinker();
  
  linker.connect()
    .then(() => linker.linkPatternsToSymbols())
    .then(stats => {
      console.log('\n📊 Linking Complete:');
      console.log(`   Patterns processed: ${stats.patternsProcessed}`);
      console.log(`   Links created: ${stats.linksCreated}`);
      console.log(`   Symbols linked: ${stats.symbolsLinked}`);
      if (stats.errors.length > 0) {
        console.log(`   Errors: ${stats.errors.length}`);
        stats.errors.slice(0, 10).forEach(err => console.log(`     - ${err}`));
      }
      return linker.getLinkingStats();
    })
    .then(stats => {
      console.log('\n📈 Overall Statistics:');
      console.log(`   Total patterns: ${stats.totalPatterns}`);
      console.log(`   Total symbols: ${stats.totalSymbols}`);
      console.log(`   Total links: ${stats.totalLinks}`);
      console.log(`   Avg patterns per symbol: ${stats.avgPatternsPerSymbol.toFixed(2)}`);
      console.log(`   Avg symbols per pattern: ${stats.avgSymbolsPerPattern.toFixed(2)}`);
    })
    .catch(console.error)
    .finally(() => linker.disconnect());
}