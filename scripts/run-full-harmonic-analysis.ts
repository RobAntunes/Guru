#!/usr/bin/env tsx
/**
 * Run Full Harmonic Analysis on Guru Codebase
 * Analyzes the entire codebase and stores results in the data lake
 */

import { HarmonicAnalysisEngine } from '../src/harmonic-intelligence/core/harmonic-analysis-engine.js';
import { StorageManager } from '../src/storage/storage-manager.js';
import { DuckDBDataLake } from '../src/datalake/duckdb-data-lake.js';
import { MCPPatternGateway } from '../src/mcp/gateway/mcp-pattern-gateway.js';
import { PatternCategory, HarmonicPatternMemory } from '../src/memory/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

interface AnalysisMetrics {
  totalFiles: number;
  totalPatterns: number;
  analysisTime: number;
  storageTime: number;
  patternsByCategory: Record<string, number>;
  filesPerSecond: number;
  patternsPerFile: number;
}

/**
 * Run comprehensive harmonic analysis
 */
async function runFullAnalysis(): Promise<AnalysisMetrics> {
  console.log(chalk.bold.cyan('🎵 Starting Full Harmonic Analysis of Guru Codebase\n'));
  
  const startTime = performance.now();
  
  // Initialize storage and analysis engines
  console.log(chalk.blue('📦 Initializing storage systems...'));
  const storageManager = new StorageManager();
  await storageManager.connect();
  
  const duckdb = new DuckDBDataLake();
  await duckdb.initialize();
  
  const harmonicEngine = new HarmonicAnalysisEngine();
  const mcpGateway = new MCPPatternGateway(storageManager);
  
  console.log(chalk.green('✅ All systems initialized\n'));
  
  // Analyze the codebase
  console.log(chalk.blue('🔍 Analyzing source files...'));
  const srcPath = path.join(process.cwd(), 'src');
  
  const analysisStartTime = performance.now();
  const results = await harmonicEngine.analyzeDirectory(srcPath, {
    recursive: true,
    includeTests: false,
    maxDepth: 10
  });
  const analysisTime = performance.now() - analysisStartTime;
  
  console.log(chalk.green(`✅ Analysis complete in ${(analysisTime / 1000).toFixed(2)}s`));
  console.log(chalk.cyan(`   Files analyzed: ${results.filesAnalyzed}`));
  console.log(chalk.cyan(`   Patterns found: ${results.patterns.length}`));
  
  // Store patterns in the data lake
  console.log(chalk.blue('\n💾 Storing patterns in data lake...'));
  const storageStartTime = performance.now();
  
  // Batch store in DuckDB for time-series analysis
  const batchSize = 100;
  for (let i = 0; i < results.patterns.length; i += batchSize) {
    const batch = results.patterns.slice(i, i + batchSize);
    await duckdb.batchInsertPatterns(batch);
    
    if (i % 1000 === 0 && i > 0) {
      console.log(chalk.gray(`   Stored ${i} patterns...`));
    }
  }
  
  // Also store in main storage (Neo4j, QPFM, etc.)
  await storageManager.storePatterns(results.patterns);
  
  const storageTime = performance.now() - storageStartTime;
  console.log(chalk.green(`✅ Storage complete in ${(storageTime / 1000).toFixed(2)}s`));
  
  // Calculate metrics
  const patternsByCategory: Record<string, number> = {};
  results.patterns.forEach(pattern => {
    const category = pattern.harmonicProperties.category;
    patternsByCategory[category] = (patternsByCategory[category] || 0) + 1;
  });
  
  const metrics: AnalysisMetrics = {
    totalFiles: results.filesAnalyzed,
    totalPatterns: results.patterns.length,
    analysisTime: analysisTime / 1000,
    storageTime: storageTime / 1000,
    patternsByCategory,
    filesPerSecond: results.filesAnalyzed / (analysisTime / 1000),
    patternsPerFile: results.patterns.length / results.filesAnalyzed
  };
  
  // Display summary
  console.log(chalk.bold.cyan('\n📊 Analysis Summary:'));
  console.log(chalk.gray('=' .repeat(50)));
  console.log(chalk.white(`Total Files:        ${metrics.totalFiles}`));
  console.log(chalk.white(`Total Patterns:     ${metrics.totalPatterns}`));
  console.log(chalk.white(`Analysis Time:      ${metrics.analysisTime.toFixed(2)}s`));
  console.log(chalk.white(`Storage Time:       ${metrics.storageTime.toFixed(2)}s`));
  console.log(chalk.white(`Files/Second:       ${metrics.filesPerSecond.toFixed(1)}`));
  console.log(chalk.white(`Patterns/File:      ${metrics.patternsPerFile.toFixed(1)}`));
  
  console.log(chalk.bold.cyan('\n📈 Patterns by Category:'));
  Object.entries(metrics.patternsByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = (count / metrics.totalPatterns * 100).toFixed(1);
      console.log(chalk.gray(`   ${category.padEnd(25)} ${count.toString().padStart(5)} (${percentage}%)`));
    });
  
  // Save detailed results
  const outputPath = 'harmonic_analysis_results.json';
  await fs.writeFile(outputPath, JSON.stringify({
    metrics,
    timestamp: new Date().toISOString(),
    patterns: results.patterns.slice(0, 100) // Sample of patterns
  }, null, 2));
  
  console.log(chalk.cyan(`\n💾 Detailed results saved to ${outputPath}`));
  
  // Test some queries through MCP gateway
  console.log(chalk.bold.cyan('\n🔍 Testing MCP Gateway Queries:'));
  
  // Test 1: Time-series query
  const timeSeriesResult = await mcpGateway.handleMCPRequest({
    type: 'time_series',
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    },
    filters: { category: PatternCategory.HARMONIC }
  });
  console.log(chalk.green(`✅ Time-series query: ${timeSeriesResult.memories.length} patterns`));
  
  // Test 2: Graph traversal
  const graphResult = await mcpGateway.handleMCPRequest({
    type: 'graph_traversal',
    startSymbol: 'HarmonicAnalysisEngine',
    maxDepth: 2
  });
  console.log(chalk.green(`✅ Graph traversal: ${graphResult.memories.length} related patterns`));
  
  // Test 3: Similarity search
  if (results.patterns.length > 0) {
    const similarityResult = await mcpGateway.handleMCPRequest({
      type: 'similarity',
      pattern: results.patterns[0],
      minSimilarity: 0.7
    });
    console.log(chalk.green(`✅ Similarity search: ${similarityResult.memories.length} similar patterns`));
  }
  
  // Cleanup
  await duckdb.close();
  await storageManager.disconnect();
  
  return metrics;
}

/**
 * Generate test data for IO testing
 */
async function generateTestData(): Promise<void> {
  console.log(chalk.bold.yellow('\n🧪 Generating Test Data for IO Tests...'));
  
  const testPatterns: HarmonicPatternMemory[] = [];
  const categories = Object.values(PatternCategory);
  
  // Generate diverse test patterns
  for (let i = 0; i < 1000; i++) {
    const category = categories[i % categories.length];
    const pattern: HarmonicPatternMemory = {
      id: `test_pattern_${i}`,
      coordinates: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
      content: {
        title: `Test Pattern ${i}`,
        description: `Generated test pattern for IO testing - ${category}`,
        type: category,
        tags: [category, 'test', 'io-benchmark'],
        data: {
          index: i,
          timestamp: new Date(),
          metadata: {
            source: 'test-generator',
            version: '1.0.0'
          }
        }
      },
      accessCount: Math.floor(Math.random() * 100),
      lastAccessed: Date.now() - Math.random() * 86400000,
      createdAt: Date.now() - Math.random() * 604800000,
      relevanceScore: Math.random(),
      harmonicProperties: {
        category,
        strength: Math.random(),
        occurrences: Math.floor(Math.random() * 50) + 1,
        confidence: 0.5 + Math.random() * 0.5,
        complexity: Math.floor(Math.random() * 10) + 1
      },
      locations: [{
        file: `test/file${i % 20}.ts`,
        startLine: i * 10,
        endLine: i * 10 + Math.floor(Math.random() * 20),
        startColumn: 0,
        endColumn: 80
      }],
      evidence: [],
      relatedPatterns: i > 0 ? [`test_pattern_${i - 1}`] : [],
      causesPatterns: [],
      requiredBy: []
    };
    
    testPatterns.push(pattern);
  }
  
  // Save test data
  await fs.writeFile(
    'test_patterns.json',
    JSON.stringify(testPatterns, null, 2)
  );
  
  console.log(chalk.green(`✅ Generated ${testPatterns.length} test patterns`));
  console.log(chalk.cyan('💾 Test data saved to test_patterns.json'));
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate-test-data')) {
    generateTestData()
      .then(() => {
        console.log(chalk.bold.green('\n✅ Test data generation complete!'));
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('❌ Error generating test data:'), error);
        process.exit(1);
      });
  } else {
    runFullAnalysis()
      .then((metrics) => {
        console.log(chalk.bold.green('\n✅ Full harmonic analysis complete!'));
        console.log(chalk.cyan(`Total time: ${(metrics.analysisTime + metrics.storageTime).toFixed(2)}s`));
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('❌ Analysis failed:'), error);
        process.exit(1);
      });
  }
}