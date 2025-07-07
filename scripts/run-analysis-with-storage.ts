#!/usr/bin/env tsx
/**
 * Run Analysis and Store Results in Databases
 * Tests the complete storage pipeline with real data
 */

import { GuruCore } from '../src/core/guru.js';
import { StorageManager } from '../src/storage/storage-manager.js';
import { DuckDBDataLake } from '../src/datalake/duckdb-data-lake.js';
import { MCPPatternGateway } from '../src/mcp/gateway/mcp-pattern-gateway.js';
import { HarmonicEnricher } from '../src/harmonic-intelligence/core/harmonic-enricher.js';
import { PatternCategory, HarmonicPatternMemory } from '../src/memory/types.js';
import { Pattern } from '../src/types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

interface AnalysisMetrics {
  totalFiles: number;
  totalSymbols: number;
  totalPatterns: number;
  analysisTime: number;
  enrichmentTime: number;
  storageTime: number;
  patternsByCategory: Record<string, number>;
}

/**
 * Convert Guru patterns to harmonic patterns
 */
async function convertToHarmonicPatterns(
  patterns: Pattern[],
  enricher: HarmonicEnricher
): Promise<HarmonicPatternMemory[]> {
  const harmonicPatterns: HarmonicPatternMemory[] = [];
  
  for (const pattern of patterns) {
    // Enrich pattern with harmonic analysis
    const enrichedData = await enricher.enrichPattern({
      patternType: pattern.type,
      symbolType: pattern.category || 'unknown',
      complexity: pattern.evidence?.metrics?.complexity || 5,
      dependencies: pattern.evidence?.dependencies || [],
      codeStructure: {
        depth: pattern.evidence?.metrics?.depth || 1,
        breadth: pattern.evidence?.metrics?.breadth || 1
      }
    });
    
    // Map pattern category to harmonic category
    const harmonicCategory = mapToHarmonicCategory(pattern.category);
    
    const harmonicPattern: HarmonicPatternMemory = {
      id: `${pattern.symbolId}_${pattern.type}_${Date.now()}`,
      coordinates: [0, 0, 0], // Will be set by storage
      content: {
        title: pattern.type,
        description: pattern.description || `${pattern.type} pattern in ${pattern.symbolId}`,
        type: pattern.category || 'structural',
        tags: [pattern.type, pattern.category || 'unknown'],
        data: {
          originalPattern: pattern,
          enrichment: enrichedData
        }
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: pattern.strength,
      harmonicProperties: {
        category: harmonicCategory,
        strength: pattern.strength,
        occurrences: pattern.evidence?.occurrences || 1,
        confidence: pattern.confidence || 0.8,
        complexity: pattern.evidence?.metrics?.complexity || 5
      },
      locations: pattern.locations || [],
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    };
    
    harmonicPatterns.push(harmonicPattern);
  }
  
  return harmonicPatterns;
}

/**
 * Map pattern categories to harmonic categories
 */
function mapToHarmonicCategory(category?: string): PatternCategory {
  const mapping: Record<string, PatternCategory> = {
    'structural': PatternCategory.STRUCTURAL,
    'behavioral': PatternCategory.BEHAVIORAL,
    'functional': PatternCategory.FUNCTIONAL,
    'error': PatternCategory.ERROR_PATTERN,
    'authentication': PatternCategory.AUTHENTICATION,
    'cryptographic': PatternCategory.CRYPTOGRAPHIC,
    'computational': PatternCategory.COMPUTATIONAL,
    'network': PatternCategory.NETWORK_TOPOLOGY,
    'state': PatternCategory.STATE_MANAGEMENT,
    'data': PatternCategory.DATA_FLOW
  };
  
  return mapping[category?.toLowerCase() || ''] || PatternCategory.STRUCTURAL;
}

/**
 * Run analysis with full storage pipeline
 */
async function runAnalysisWithStorage(): Promise<AnalysisMetrics> {
  console.log(chalk.bold.cyan('🚀 Starting Guru Analysis with Full Storage Pipeline\n'));
  
  const startTime = performance.now();
  
  // Initialize components
  console.log(chalk.blue('📦 Initializing systems...'));
  const guru = new GuruCore();
  const storageManager = new StorageManager();
  await storageManager.connect();
  
  const duckdb = new DuckDBDataLake();
  await duckdb.initialize();
  
  const enricher = new HarmonicEnricher();
  const mcpGateway = new MCPPatternGateway(storageManager);
  
  console.log(chalk.green('✅ All systems initialized\n'));
  
  // Run Guru analysis
  console.log(chalk.blue('🔍 Analyzing codebase with Guru...'));
  const analysisStartTime = performance.now();
  
  const srcPath = path.join(process.cwd(), 'src');
  const result = await guru.analyzeCodebase({ 
    path: srcPath,
    includeTests: false 
  });
  
  const analysisTime = performance.now() - analysisStartTime;
  
  // Extract patterns from symbol graph
  const patterns: Pattern[] = [];
  const symbolGraph = result.symbolGraph;
  
  for (const symbol of symbolGraph.getAllSymbols()) {
    if (symbol.patterns) {
      patterns.push(...symbol.patterns.map(p => ({
        ...p,
        symbolId: symbol.id
      })));
    }
  }
  
  console.log(chalk.green(`✅ Analysis complete in ${(analysisTime / 1000).toFixed(2)}s`));
  console.log(chalk.cyan(`   Symbols found: ${symbolGraph.getAllSymbols().length}`));
  console.log(chalk.cyan(`   Patterns found: ${patterns.length}`));
  
  // Enrich patterns with harmonic analysis
  console.log(chalk.blue('\n🎵 Enriching patterns with harmonic analysis...'));
  const enrichmentStartTime = performance.now();
  
  const harmonicPatterns = await convertToHarmonicPatterns(patterns, enricher);
  
  const enrichmentTime = performance.now() - enrichmentStartTime;
  console.log(chalk.green(`✅ Enrichment complete in ${(enrichmentTime / 1000).toFixed(2)}s`));
  
  // Store in all databases
  console.log(chalk.blue('\n💾 Storing patterns in all databases...'));
  const storageStartTime = performance.now();
  
  // Batch store in DuckDB
  console.log(chalk.gray('   Storing in DuckDB data lake...'));
  const batchSize = 100;
  for (let i = 0; i < harmonicPatterns.length; i += batchSize) {
    const batch = harmonicPatterns.slice(i, i + batchSize);
    await duckdb.batchInsertPatterns(batch);
  }
  
  // Store in main storage (Neo4j, QPFM, Redis)
  console.log(chalk.gray('   Storing in Neo4j, QPFM, and Redis...'));
  await storageManager.storePatterns(harmonicPatterns);
  
  const storageTime = performance.now() - storageStartTime;
  console.log(chalk.green(`✅ Storage complete in ${(storageTime / 1000).toFixed(2)}s`));
  
  // Calculate metrics
  const patternsByCategory: Record<string, number> = {};
  harmonicPatterns.forEach(pattern => {
    const category = pattern.harmonicProperties.category;
    patternsByCategory[category] = (patternsByCategory[category] || 0) + 1;
  });
  
  const metrics: AnalysisMetrics = {
    totalFiles: result.filesAnalyzed,
    totalSymbols: symbolGraph.getAllSymbols().length,
    totalPatterns: harmonicPatterns.length,
    analysisTime: analysisTime / 1000,
    enrichmentTime: enrichmentTime / 1000,
    storageTime: storageTime / 1000,
    patternsByCategory
  };
  
  // Display results
  console.log(chalk.bold.cyan('\n📊 Analysis Summary:'));
  console.log(chalk.gray('=' .repeat(50)));
  console.log(chalk.white(`Total Files:        ${metrics.totalFiles}`));
  console.log(chalk.white(`Total Symbols:      ${metrics.totalSymbols}`));
  console.log(chalk.white(`Total Patterns:     ${metrics.totalPatterns}`));
  console.log(chalk.white(`Analysis Time:      ${metrics.analysisTime.toFixed(2)}s`));
  console.log(chalk.white(`Enrichment Time:    ${metrics.enrichmentTime.toFixed(2)}s`));
  console.log(chalk.white(`Storage Time:       ${metrics.storageTime.toFixed(2)}s`));
  
  console.log(chalk.bold.cyan('\n📈 Patterns by Category:'));
  Object.entries(metrics.patternsByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = (count / metrics.totalPatterns * 100).toFixed(1);
      console.log(chalk.gray(`   ${category.padEnd(25)} ${count.toString().padStart(5)} (${percentage}%)`));
    });
  
  // Test queries
  console.log(chalk.bold.cyan('\n🔍 Testing Storage Queries:'));
  
  // Test 1: DuckDB time-series query
  console.log(chalk.yellow('\n1. DuckDB Time-Series Query:'));
  const timeSeriesPatterns = await duckdb.queryTimeRange({
    startTime: new Date(Date.now() - 60000), // Last minute
    endTime: new Date(),
    categories: [PatternCategory.STRUCTURAL]
  });
  console.log(chalk.green(`   Found ${timeSeriesPatterns.length} recent structural patterns`));
  
  // Test 2: Neo4j graph traversal
  console.log(chalk.yellow('\n2. Neo4j Graph Traversal:'));
  if (storageManager.neo4j) {
    const relatedPatterns = await storageManager.neo4j.findRelatedPatterns(
      harmonicPatterns[0]?.id || 'test',
      2
    );
    console.log(chalk.green(`   Found ${relatedPatterns.length} related patterns`));
  }
  
  // Test 3: QPFM similarity search
  console.log(chalk.yellow('\n3. QPFM Similarity Search:'));
  if (storageManager.qpfm && harmonicPatterns.length > 0) {
    const similarPatterns = await storageManager.qpfm.findSimilar(
      harmonicPatterns[0].id,
      { minSimilarity: 0.5, maxResults: 5 }
    );
    console.log(chalk.green(`   Found ${similarPatterns.length} similar patterns`));
  }
  
  // Test 4: MCP Gateway unified query
  console.log(chalk.yellow('\n4. MCP Gateway Unified Query:'));
  const unifiedResult = await mcpGateway.handleMCPRequest({
    type: 'unified',
    query: 'structural patterns',
    filters: {
      minStrength: 0.5,
      categories: [PatternCategory.STRUCTURAL]
    },
    limit: 10
  });
  console.log(chalk.green(`   Found ${unifiedResult.memories.length} patterns across all storage systems`));
  
  // Save detailed results
  const outputPath = 'analysis_with_storage_results.json';
  await fs.writeFile(outputPath, JSON.stringify({
    metrics,
    timestamp: new Date().toISOString(),
    samplePatterns: harmonicPatterns.slice(0, 10),
    queryResults: {
      timeSeriesCount: timeSeriesPatterns.length,
      unifiedQueryCount: unifiedResult.memories.length
    }
  }, null, 2));
  
  console.log(chalk.cyan(`\n💾 Detailed results saved to ${outputPath}`));
  
  // Cleanup
  await duckdb.close();
  await storageManager.disconnect();
  
  return metrics;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalysisWithStorage()
    .then((metrics) => {
      console.log(chalk.bold.green('\n✅ Analysis and storage test complete!'));
      console.log(chalk.cyan(`Total processing time: ${(metrics.analysisTime + metrics.enrichmentTime + metrics.storageTime).toFixed(2)}s`));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('❌ Analysis failed:'), error);
      process.exit(1);
    });
}