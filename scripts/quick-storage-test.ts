#!/usr/bin/env tsx
/**
 * Quick Storage Test
 * Verify all databases are working correctly
 */

import { StorageManager } from '../src/storage/storage-manager.js';
import { DuckDBDataLake } from '../src/datalake/duckdb-data-lake.js';
import { MCPPatternGateway } from '../src/mcp/gateway/mcp-pattern-gateway.js';
import { PatternCategory } from '../src/memory/types.js';
import chalk from 'chalk';

async function quickTest() {
  console.log(chalk.bold.cyan('🧪 Quick Storage Test\n'));
  
  try {
    // Test 1: Storage Manager
    console.log(chalk.yellow('1. Testing StorageManager...'));
    const storageManager = new StorageManager();
    await storageManager.connect();
    console.log(chalk.green('   ✅ StorageManager connected'));
    
    // Test 2: DuckDB
    console.log(chalk.yellow('\n2. Testing DuckDB...'));
    const duckdb = new DuckDBDataLake();
    await duckdb.initialize();
    console.log(chalk.green('   ✅ DuckDB initialized'));
    
    // Store test data
    const testPattern = {
      id: `test_${Date.now()}`,
      coordinates: [0, 0, 0],
      content: {
        title: 'Test Pattern',
        description: 'Quick test pattern',
        type: 'test',
        tags: ['test'],
        data: {}
      },
      harmonicProperties: {
        category: PatternCategory.STRUCTURAL,
        strength: 0.8,
        occurrences: 1,
        confidence: 0.9,
        complexity: 5
      },
      locations: [{ file: 'test.ts', startLine: 1, endLine: 10 }],
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: 0.8,
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    };
    
    await duckdb.batchInsertPatterns([testPattern]);
    console.log(chalk.green('   ✅ Test pattern stored in DuckDB'));
    
    // Test 3: MCP Gateway
    console.log(chalk.yellow('\n3. Testing MCP Gateway...'));
    const mcpGateway = new MCPPatternGateway(storageManager);
    
    // Wait a bit for DuckDB to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await mcpGateway.handleMCPRequest({
      type: 'unified',
      target: 'test',
      query: 'test patterns',
      filters: {
        categories: [PatternCategory.STRUCTURAL]
      },
      limit: 10
    });
    
    console.log(chalk.green(`   ✅ MCP Gateway query returned ${result.memories?.length || 0} results`));
    console.log(chalk.cyan(`   Success: ${result.success}`));
    console.log(chalk.cyan(`   Source systems: ${result.metadata?.sourceSystems?.join(', ') || 'none'}`));
    
    // Cleanup
    await duckdb.close();
    await storageManager.disconnect();
    
    console.log(chalk.bold.green('\n✅ All tests passed!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  }
}

quickTest();