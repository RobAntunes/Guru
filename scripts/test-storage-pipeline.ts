#!/usr/bin/env tsx
/**
 * Test Storage Pipeline with Generated Data
 * Tests all database operations and MCP gateway
 */

import { StorageManager } from '../src/storage/storage-manager.js';
import { DuckDBDataLake } from '../src/datalake/duckdb-data-lake.js';
import { MCPPatternGateway } from '../src/mcp/gateway/mcp-pattern-gateway.js';
import { PatternCategory, HarmonicPatternMemory } from '../src/memory/types.js';
import { createProductionQuantumMemory } from '../src/memory/quantum-memory-factory.js';
import * as fs from 'fs/promises';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

/**
 * Generate realistic test patterns
 */
function generateTestPatterns(count: number): HarmonicPatternMemory[] {
  const patterns: HarmonicPatternMemory[] = [];
  const categories = Object.values(PatternCategory);
  const patternTypes = [
    'singleton', 'factory', 'observer', 'strategy', 'composite',
    'authentication_flow', 'error_handler', 'data_validator',
    'cache_manager', 'state_machine', 'api_endpoint'
  ];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const patternType = patternTypes[i % patternTypes.length];
    
    const pattern: HarmonicPatternMemory = {
      id: `pattern_${Date.now()}_${i}`,
      coordinates: [0, 0, 0], // Will be set by storage
      content: {
        title: `${patternType} Pattern ${i}`,
        description: `${category} pattern implementing ${patternType}`,
        type: patternType,
        tags: [category, patternType, 'test', 'benchmark'],
        data: {
          index: i,
          timestamp: new Date(),
          metadata: {
            source: 'test-generator',
            version: '1.0.0',
            complexity: Math.floor(Math.random() * 10) + 1
          }
        }
      },
      accessCount: Math.floor(Math.random() * 100),
      lastAccessed: Date.now() - Math.random() * 86400000,
      createdAt: Date.now() - Math.random() * 604800000,
      relevanceScore: Math.random(),
      harmonicProperties: {
        category,
        strength: 0.5 + Math.random() * 0.5,
        occurrences: Math.floor(Math.random() * 20) + 1,
        confidence: 0.6 + Math.random() * 0.4,
        complexity: Math.floor(Math.random() * 10) + 1
      },
      locations: [{
        file: `src/${category.toLowerCase()}/file${i % 20}.ts`,
        startLine: i * 10,
        endLine: i * 10 + Math.floor(Math.random() * 50),
        startColumn: 0,
        endColumn: 120
      }],
      evidence: [],
      relatedPatterns: i > 0 ? [`pattern_${Date.now()}_${i - 1}`] : [],
      causesPatterns: [],
      requiredBy: []
    };
    
    patterns.push(pattern);
  }
  
  return patterns;
}

/**
 * Test storage pipeline
 */
async function testStoragePipeline() {
  console.log(chalk.bold.cyan('🧪 Testing Storage Pipeline with Generated Data\n'));
  
  // Initialize storage systems
  console.log(chalk.blue('📦 Initializing storage systems...'));
  const storageManager = new StorageManager();
  await storageManager.connect();
  
  const duckdb = new DuckDBDataLake();
  await duckdb.initialize();
  
  const mcpGateway = new MCPPatternGateway(storageManager);
  
  console.log(chalk.green('✅ All storage systems connected\n'));
  
  // Generate test patterns
  console.log(chalk.blue('🔨 Generating test patterns...'));
  const testPatterns = generateTestPatterns(1000);
  console.log(chalk.green(`✅ Generated ${testPatterns.length} test patterns\n`));
  
  // Test 1: Bulk storage
  console.log(chalk.bold.yellow('Test 1: Bulk Storage Performance'));
  const storageStart = performance.now();
  
  // Store in DuckDB
  console.log(chalk.gray('   Storing in DuckDB...'));
  const duckdbStart = performance.now();
  await duckdb.batchInsertPatterns(testPatterns);
  const duckdbTime = performance.now() - duckdbStart;
  console.log(chalk.green(`   ✅ DuckDB: ${duckdbTime.toFixed(1)}ms (${(testPatterns.length / (duckdbTime / 1000)).toFixed(0)} patterns/sec)`));
  
  // Store in unified storage (Neo4j, QPFM, Redis)
  console.log(chalk.gray('   Storing in Neo4j, QPFM, Redis...'));
  const unifiedStart = performance.now();
  await storageManager.storePatterns(testPatterns.slice(0, 100)); // Store subset to avoid overwhelming
  const unifiedTime = performance.now() - unifiedStart;
  console.log(chalk.green(`   ✅ Unified: ${unifiedTime.toFixed(1)}ms`));
  
  const totalStorageTime = performance.now() - storageStart;
  console.log(chalk.cyan(`   Total storage time: ${totalStorageTime.toFixed(1)}ms\n`));
  
  // Test 2: Query performance
  console.log(chalk.bold.yellow('Test 2: Query Performance'));
  
  // DuckDB time-series query
  console.log(chalk.gray('   Testing DuckDB time-series query...'));
  const tsStart = performance.now();
  const timeSeriesResults = await duckdb.queryTimeRange({
    startTime: new Date(Date.now() - 3600000), // Last hour
    endTime: new Date(),
    categories: [PatternCategory.AUTHENTICATION]
  });
  const tsTime = performance.now() - tsStart;
  console.log(chalk.green(`   ✅ Time-series: ${timeSeriesResults.length} results in ${tsTime.toFixed(1)}ms`));
  
  // Pattern aggregation query
  console.log(chalk.gray('   Testing pattern aggregation...'));
  const aggStart = performance.now();
  const aggregation = await duckdb.aggregatePatterns({
    groupBy: 'category',
    metrics: ['count', 'avg_strength', 'max_complexity']
  });
  const aggTime = performance.now() - aggStart;
  console.log(chalk.green(`   ✅ Aggregation: ${aggregation.length} groups in ${aggTime.toFixed(1)}ms`));
  
  // MCP Gateway unified query
  console.log(chalk.gray('   Testing MCP Gateway unified query...'));
  const mcpStart = performance.now();
  const mcpResult = await mcpGateway.handleMCPRequest({
    type: 'unified',
    query: 'authentication patterns',
    filters: {
      categories: [PatternCategory.AUTHENTICATION],
      minStrength: 0.7
    },
    limit: 20
  });
  const mcpTime = performance.now() - mcpStart;
  console.log(chalk.green(`   ✅ MCP Gateway: ${mcpResult.memories?.length || 0} results in ${mcpTime.toFixed(1)}ms\n`));
  
  // Test 3: Complex queries
  console.log(chalk.bold.yellow('Test 3: Complex Query Scenarios'));
  
  // Similarity search
  if (storageManager.qpfm && testPatterns.length > 0) {
    console.log(chalk.gray('   Testing QPFM similarity search...'));
    const simStart = performance.now();
    const similarPatterns = await storageManager.qpfm.findSimilar(
      testPatterns[0].id,
      { minSimilarity: 0.5, maxResults: 10 }
    );
    const simTime = performance.now() - simStart;
    console.log(chalk.green(`   ✅ Similarity: ${similarPatterns.length} matches in ${simTime.toFixed(1)}ms`));
  }
  
  // Graph traversal
  if (storageManager.neo4j) {
    console.log(chalk.gray('   Testing Neo4j similarity search...'));
    const graphStart = performance.now();
    const similarPatterns = await storageManager.neo4j.findSimilarPatterns(
      testPatterns[0].id,
      0.5 // min similarity
    );
    const graphTime = performance.now() - graphStart;
    console.log(chalk.green(`   ✅ Neo4j similarity: ${similarPatterns.length} similar patterns in ${graphTime.toFixed(1)}ms`));
  }
  
  // Historical analysis
  console.log(chalk.gray('   Testing historical pattern analysis...'));
  const histStart = performance.now();
  const historical = await duckdb.query({
    timeRange: {
      start: new Date(Date.now() - 86400000), // Last 24 hours
      end: new Date()
    },
    groupBy: 'hour',
    metrics: ['pattern_count', 'avg_strength']
  });
  const histTime = performance.now() - histStart;
  console.log(chalk.green(`   ✅ Historical: ${historical.length} time buckets in ${histTime.toFixed(1)}ms\n`));
  
  // Test 4: Concurrent operations
  console.log(chalk.bold.yellow('Test 4: Concurrent Operations'));
  console.log(chalk.gray('   Running 10 concurrent queries...'));
  
  const concurrentStart = performance.now();
  const concurrentQueries = Array(10).fill(null).map((_, i) => 
    mcpGateway.handleMCPRequest({
      type: 'unified',
      query: `test query ${i}`,
      filters: {
        categories: [Object.values(PatternCategory)[i % Object.values(PatternCategory).length]]
      },
      limit: 10
    })
  );
  
  const concurrentResults = await Promise.all(concurrentQueries);
  const concurrentTime = performance.now() - concurrentStart;
  const totalResults = concurrentResults.reduce((sum, r) => sum + (r.memories?.length || 0), 0);
  console.log(chalk.green(`   ✅ Concurrent: ${totalResults} total results in ${concurrentTime.toFixed(1)}ms\n`));
  
  // Display summary
  console.log(chalk.bold.cyan('📊 Performance Summary:'));
  console.log(chalk.gray('=' .repeat(50)));
  console.log(chalk.white(`Storage Rate:       ${(1000 / (duckdbTime / 1000)).toFixed(0)} patterns/sec (DuckDB)`));
  console.log(chalk.white(`Query Latency:      ${tsTime.toFixed(1)}ms (time-series)`));
  console.log(chalk.white(`Aggregation Speed:  ${aggTime.toFixed(1)}ms`));
  console.log(chalk.white(`MCP Gateway:        ${mcpTime.toFixed(1)}ms`));
  console.log(chalk.white(`Concurrent Queries: ${(concurrentTime / 10).toFixed(1)}ms avg per query`));
  
  // Save test results
  const results = {
    timestamp: new Date().toISOString(),
    patternCount: testPatterns.length,
    performance: {
      storage: {
        duckdb: duckdbTime,
        unified: unifiedTime,
        total: totalStorageTime
      },
      queries: {
        timeSeries: { time: tsTime, results: timeSeriesResults.length },
        aggregation: { time: aggTime, groups: aggregation.length },
        mcpGateway: { time: mcpTime, results: mcpResult.memories?.length || 0 },
        concurrent: { time: concurrentTime, totalResults }
      }
    },
    samplePatterns: testPatterns.slice(0, 5),
    aggregationResults: aggregation
  };
  
  // Convert BigInt to string for JSON serialization
  const resultsForJson = JSON.parse(JSON.stringify(results, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  
  await fs.writeFile('storage_pipeline_test_results.json', JSON.stringify(resultsForJson, null, 2));
  console.log(chalk.cyan('\n💾 Test results saved to storage_pipeline_test_results.json'));
  
  // Cleanup
  await duckdb.close();
  await storageManager.disconnect();
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testStoragePipeline()
    .then(() => {
      console.log(chalk.bold.green('\n✅ Storage pipeline test complete!'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('❌ Test failed:'), error);
      process.exit(1);
    });
}