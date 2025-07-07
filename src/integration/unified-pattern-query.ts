/**
 * Unified Pattern Query Interface
 * Query patterns across DuckLake, Neo4j, and QPFM
 */

import { DuckDBDataLake } from '../datalake/duckdb-data-lake.js';
import { Neo4jRelationshipStore } from '../storage/neo4j-relationship-store.js';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system.js';
import { Logger } from '../logging/logger.js';

export interface UnifiedQueryResult {
  // From DuckLake - Historical data
  timeline?: {
    evolution: any[];
    snapshots: string[];
    statistics: any;
  };
  
  // From Neo4j - Relationships
  graph?: {
    symbol: any;
    patterns: any[];
    relatedSymbols: any[];
    callChains: any[];
  };
  
  // From QPFM - Similarity
  similar?: {
    patterns: any[];
    clusters: any[];
    coordinates: number[];
  };
  
  // Combined insights
  insights: {
    quality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    trends: string[];
    recommendations: string[];
    hotspots: string[];
  };
}

export class UnifiedPatternQuery {
  private logger = Logger.getInstance();
  
  constructor(
    private duckLake: DuckDBDataLake,
    private neo4j: Neo4jRelationshipStore,
    private qpfm: QuantumProbabilityFieldMemory
  ) {}

  /**
   * Get comprehensive analysis for a symbol or file
   */
  async getComprehensiveAnalysis(
    target: string,
    options: {
      includeTimeline?: boolean;
      includeGraph?: boolean;
      includeSimilar?: boolean;
      timeRange?: { start: Date; end: Date };
      depth?: number;
    } = {}
  ): Promise<UnifiedQueryResult> {
    console.log(`\n🔍 Comprehensive analysis for: ${target}`);
    
    const promises: Promise<any>[] = [];
    const result: UnifiedQueryResult = {
      insights: {
        quality: 'good',
        trends: [],
        recommendations: [],
        hotspots: []
      }
    };

    // 1. Timeline from DuckLake
    if (options.includeTimeline !== false) {
      promises.push(
        this.getTimeline(target, options.timeRange)
          .then(timeline => result.timeline = timeline)
          .catch(err => this.logger.error('Timeline query failed:', err))
      );
    }

    // 2. Graph from Neo4j
    if (options.includeGraph !== false) {
      promises.push(
        this.getGraph(target, options.depth || 2)
          .then(graph => result.graph = graph)
          .catch(err => this.logger.error('Graph query failed:', err))
      );
    }

    // 3. Similar patterns from QPFM
    if (options.includeSimilar !== false) {
      promises.push(
        this.getSimilar(target)
          .then(similar => result.similar = similar)
          .catch(err => this.logger.error('Similarity query failed:', err))
      );
    }

    // Wait for all queries
    await Promise.all(promises);

    // Generate insights
    result.insights = this.generateInsights(result);

    return result;
  }

  /**
   * Get pattern evolution timeline from DuckLake
   */
  private async getTimeline(
    target: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    console.log('   📊 Querying DuckLake for timeline...');
    
    // Get pattern evolution
    const evolution = await this.duckLake.analyzePatternEvolution(target, {
      timeRange,
      granularity: 'day'
    });

    // Get available snapshots
    const snapshots = await this.duckLake.listSnapshots();
    const relevantSnapshots = snapshots
      .filter(s => s.comment?.includes(target))
      .map(s => s.name);

    // Get statistics
    const stats = await this.duckLake.getPatternStats();
    const targetStats = stats.filter((s: any) => 
      s.file_path === target || s.symbol_id === target
    );

    return {
      evolution,
      snapshots: relevantSnapshots,
      statistics: targetStats
    };
  }

  /**
   * Get relationship graph from Neo4j
   */
  private async getGraph(target: string, depth: number): Promise<any> {
    console.log('   🕸️  Querying Neo4j for relationships...');
    
    const session = this.neo4j.driver.session();
    
    try {
      // Get symbol and its patterns
      const symbolResult = await session.run(`
        MATCH (s:Symbol)
        WHERE s.name = $target OR s.file = $target OR s.id = $target
        OPTIONAL MATCH (s)-[:EXHIBITS]->(p:Pattern)
        RETURN s, collect(p) as patterns
        LIMIT 1
      `, { target });

      if (symbolResult.records.length === 0) {
        return null;
      }

      const record = symbolResult.records[0];
      const symbol = record.get('s').properties;
      const patterns = record.get('patterns').map((p: any) => p.properties);

      // Get related symbols through shared patterns
      const relatedResult = await session.run(`
        MATCH (s1:Symbol)-[:EXHIBITS]->(p:Pattern)<-[:EXHIBITS]-(s2:Symbol)
        WHERE s1.id = $symbolId AND s1 <> s2
        WITH s2, count(DISTINCT p) as sharedPatterns
        ORDER BY sharedPatterns DESC
        LIMIT 10
        RETURN s2, sharedPatterns
      `, { symbolId: symbol.id });

      const relatedSymbols = relatedResult.records.map(r => ({
        symbol: r.get('s2').properties,
        sharedPatterns: r.get('sharedPatterns').toNumber()
      }));

      // Get call chains
      const callChainResult = await session.run(`
        MATCH path = (s1:Symbol)-[:CALLS*1..${depth}]->(s2:Symbol)
        WHERE s1.id = $symbolId
        RETURN [n in nodes(path) | n.name] as chain
        LIMIT 20
      `, { symbolId: symbol.id });

      const callChains = callChainResult.records.map(r => r.get('chain'));

      return {
        symbol,
        patterns,
        relatedSymbols,
        callChains
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Get similar patterns from QPFM
   */
  private async getSimilar(target: string): Promise<any> {
    console.log('   🧠 Querying QPFM for similar patterns...');
    
    // First, get pattern coordinates from DuckLake
    const patterns = await this.duckLake.queryPatterns({
      files: [target],
      limit: 1
    });

    if (patterns.length === 0) {
      return null;
    }

    // Convert to coordinates (simplified - use actual embeddings in production)
    const coordinates = [
      patterns[0].score,
      patterns[0].confidence,
      this.categoryToNumeric(patterns[0].category),
      0.5, // Placeholder dimensions
      0.5,
      0.5
    ];

    // Query QPFM for similar patterns
    const similar = await this.qpfm.querySimilar({
      coordinates,
      radius: 0.3,
      limit: 20
    });

    // Get pattern clusters
    const clusters = await this.qpfm.getClusters({
      minClusterSize: 3,
      maxDistance: 0.2
    });

    return {
      patterns: similar.results,
      clusters: clusters.filter((c: any) => 
        c.members.some((m: any) => m.id.includes(target))
      ),
      coordinates
    };
  }

  /**
   * Generate insights from combined data
   */
  private generateInsights(result: UnifiedQueryResult): UnifiedQueryResult['insights'] {
    const insights: UnifiedQueryResult['insights'] = {
      quality: 'good',
      trends: [],
      recommendations: [],
      hotspots: []
    };

    // Analyze timeline trends
    if (result.timeline?.evolution) {
      const evolution = result.timeline.evolution;
      
      // Find improving patterns
      const improving = evolution.filter((e: any) => e.score_change > 0.1);
      if (improving.length > 0) {
        insights.trends.push(`📈 ${improving.length} patterns showing improvement`);
      }

      // Find declining patterns
      const declining = evolution.filter((e: any) => e.score_change < -0.1);
      if (declining.length > 0) {
        insights.trends.push(`📉 ${declining.length} patterns declining in quality`);
      }
    }

    // Analyze graph relationships
    if (result.graph) {
      const patternCount = result.graph.patterns.length;
      const avgScore = result.graph.patterns.reduce((sum: number, p: any) => 
        sum + p.strength, 0) / patternCount;

      // Determine quality
      if (avgScore > 0.85) {
        insights.quality = 'excellent';
      } else if (avgScore > 0.7) {
        insights.quality = 'good';
      } else if (avgScore > 0.5) {
        insights.quality = 'needs-improvement';
      } else {
        insights.quality = 'poor';
      }

      // Find hotspots
      if (result.graph.relatedSymbols.length > 5) {
        insights.hotspots.push('High pattern connectivity - architectural hotspot');
      }

      // Call chain analysis
      if (result.graph.callChains.length > 10) {
        insights.recommendations.push('Consider refactoring deep call chains');
      }
    }

    // Analyze similarity
    if (result.similar) {
      if (result.similar.clusters.length > 0) {
        insights.trends.push(`Part of ${result.similar.clusters.length} pattern clusters`);
      }

      if (result.similar.patterns.length > 15) {
        insights.recommendations.push('Many similar patterns - consider abstraction');
      }
    }

    // Generate recommendations based on quality
    switch (insights.quality) {
      case 'poor':
        insights.recommendations.push('Major refactoring recommended');
        insights.recommendations.push('Consider breaking down complex functions');
        break;
      case 'needs-improvement':
        insights.recommendations.push('Focus on improving pattern scores');
        insights.recommendations.push('Review architectural patterns');
        break;
      case 'good':
        insights.recommendations.push('Continue current practices');
        break;
      case 'excellent':
        insights.recommendations.push('Use as reference for other modules');
        break;
    }

    return insights;
  }

  /**
   * Find cross-cutting patterns
   */
  async findCrossCuttingPatterns(
    options: {
      minFiles?: number;
      minScore?: number;
      categories?: string[];
    } = {}
  ): Promise<{
    patterns: any[];
    impact: Map<string, number>;
  }> {
    console.log('\n🔗 Finding cross-cutting patterns...');
    
    // Use simple data lake queries
    const allPatterns = await this.duckLake.queryPatterns({
      minScore: options.minScore || 0.7,
      categories: options.categories
    });

    // Group patterns by type to find cross-cutting ones
    const patternGroups = new Map<string, {
      pattern_type: string;
      category: string;
      file_count: number;
      total_occurrences: number;
      avg_score: number;
      files: Set<string>;
    }>();

    for (const pattern of allPatterns) {
      const key = `${pattern.pattern_type}_${pattern.category}`;
      if (!patternGroups.has(key)) {
        patternGroups.set(key, {
          pattern_type: pattern.pattern_type,
          category: pattern.category,
          file_count: 0,
          total_occurrences: 0,
          avg_score: 0,
          files: new Set()
        });
      }
      
      const group = patternGroups.get(key)!;
      group.files.add(pattern.file_path);
      group.total_occurrences++;
      group.avg_score = (group.avg_score * (group.total_occurrences - 1) + pattern.score) / group.total_occurrences;
    }

    // Filter by minimum files and convert to array
    const patterns = Array.from(patternGroups.values())
      .map(g => ({
        ...g,
        file_count: g.files.size,
        files: Array.from(g.files)
      }))
      .filter(g => g.file_count >= (options.minFiles || 3))
      .sort((a, b) => b.file_count - a.file_count || b.avg_score - a.avg_score);

    // Calculate impact using Neo4j
    const impact = new Map<string, number>();
    
    for (const pattern of patterns) {
      const session = this.neo4j.driver.session();
      try {
        const result = await session.run(`
          MATCH (s:Symbol)-[:EXHIBITS]->(p:Pattern {type: $patternType})
          MATCH (s)-[:CALLS*0..2]->(downstream:Symbol)
          RETURN COUNT(DISTINCT downstream) as impactedSymbols
        `, { patternType: pattern.pattern_type });

        if (result.records.length > 0) {
          impact.set(
            pattern.pattern_type,
            result.records[0].get('impactedSymbols').toNumber()
          );
        }
      } finally {
        await session.close();
      }
    }

    return { patterns, impact };
  }

  /**
   * Get pattern recommendations for a symbol
   */
  async getPatternRecommendations(
    symbolId: string
  ): Promise<{
    missing: string[];
    improvements: Array<{ pattern: string; currentScore: number; potential: number }>;
    similar: Array<{ symbol: string; patterns: string[] }>;
  }> {
    console.log(`\n💡 Getting pattern recommendations for: ${symbolId}`);
    
    // Get current patterns
    const current = await this.duckLake.queryPatterns({
      files: [symbolId],
      limit: 100
    });

    // Find similar high-quality symbols
    const coordinates = current.length > 0 ? [
      current[0].score,
      current[0].confidence,
      0.5, 0.5, 0.5, 0.5
    ] : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    const similar = await this.qpfm.querySimilar({
      coordinates,
      radius: 0.2,
      limit: 10
    });

    // Analyze what patterns similar high-quality code has
    const recommendations = {
      missing: [] as string[],
      improvements: [] as any[],
      similar: [] as any[]
    };

    // Find patterns that similar code has but we don't
    const currentPatternTypes = new Set(current.map(p => p.pattern_type));
    
    for (const sim of similar.results) {
      if (sim.metadata?.score > 0.85) {
        const simPatterns = await this.duckLake.queryPatterns({
          files: [sim.metadata.file],
          minScore: 0.8
        });

        const theirPatternTypes = simPatterns.map(p => p.pattern_type);
        const missing = theirPatternTypes.filter(p => !currentPatternTypes.has(p));
        
        recommendations.missing.push(...missing);
        recommendations.similar.push({
          symbol: sim.id,
          patterns: theirPatternTypes
        });
      }
    }

    // Find patterns that could be improved
    for (const pattern of current) {
      if (pattern.score < 0.8) {
        recommendations.improvements.push({
          pattern: pattern.pattern_type,
          currentScore: pattern.score,
          potential: Math.min(1.0, pattern.score + 0.2)
        });
      }
    }

    // Deduplicate
    recommendations.missing = [...new Set(recommendations.missing)];

    return recommendations;
  }

  private categoryToNumeric(category: string): number {
    const categories: Record<string, number> = {
      'QUANTUM': 0.9,
      'GEOMETRIC': 0.8,
      'ARCHITECTURAL': 0.7,
      'TOPOLOGICAL': 0.6,
      'WAVE': 0.5,
      'INFORMATION': 0.4,
      'FRACTAL': 0.3,
      'CLASSICAL': 0.2
    };
    return categories[category] || 0.1;
  }
}

// Demo usage
async function demoUnifiedQueries() {
  console.log('🎯 Unified Pattern Query Demo');
  console.log('============================');

  // Initialize stores (in production, these would be injected)
  const duckLake = new HarmonicDuckLake();
  await duckLake.initialize();
  
  const neo4j = new Neo4jRelationshipStore(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  );
  await neo4j.connect();

  const qpfm = new QuantumProbabilityFieldMemory();

  const unifiedQuery = new UnifiedPatternQuery(duckLake, neo4j, qpfm);

  // 1. Comprehensive analysis
  console.log('\n1️⃣ Comprehensive Analysis of src/core/guru.ts:');
  const analysis = await unifiedQuery.getComprehensiveAnalysis('src/core/guru.ts');
  
  console.log('\n📊 Timeline:', analysis.timeline?.evolution.length || 0, 'data points');
  console.log('🕸️  Graph:', analysis.graph?.patterns.length || 0, 'patterns');
  console.log('🧠 Similar:', analysis.similar?.patterns.length || 0, 'similar patterns');
  console.log('\n💡 Insights:');
  console.log('   Quality:', analysis.insights.quality);
  console.log('   Trends:', analysis.insights.trends);
  console.log('   Recommendations:', analysis.insights.recommendations);

  // 2. Cross-cutting patterns
  console.log('\n2️⃣ Cross-cutting Patterns:');
  const crossCutting = await unifiedQuery.findCrossCuttingPatterns({
    minFiles: 3,
    minScore: 0.7
  });
  
  console.log(`Found ${crossCutting.patterns.length} cross-cutting patterns`);
  crossCutting.patterns.slice(0, 5).forEach((p: any) => {
    const impact = crossCutting.impact.get(p.pattern_type) || 0;
    console.log(`   ${p.pattern_type}: ${p.file_count} files, ${impact} impacted symbols`);
  });

  // 3. Pattern recommendations
  console.log('\n3️⃣ Pattern Recommendations:');
  const recommendations = await unifiedQuery.getPatternRecommendations('processQuantumState');
  
  console.log(`   Missing patterns: ${recommendations.missing.join(', ')}`);
  console.log(`   Improvements needed: ${recommendations.improvements.length}`);
  console.log(`   Similar high-quality code: ${recommendations.similar.length} examples`);

  await neo4j.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demoUnifiedQueries().catch(console.error);
}