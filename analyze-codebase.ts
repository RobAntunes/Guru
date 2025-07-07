#!/usr/bin/env tsx
/**
 * Analyze codebase and populate SQLite database
 */

import { GuruCore } from './src/core/guru.js';
import path from 'path';

async function analyzeCodebase() {
  console.log('🚀 Running Guru Codebase Analysis...\n');
  
  const targetPath = process.argv[2] || 'src/';
  const absolutePath = path.resolve(targetPath);
  
  console.log(`📁 Analyzing: ${absolutePath}`);
  
  const guru = new GuruCore();
  
  try {
    // Preload components for better performance
    await guru.preloadComponents(['symbolGraphBuilder']);
    
    // Run the analysis - this should populate SQLite
    console.log('🔍 Building symbol graph and analyzing patterns...');
    const result = await guru.analyzeCodebase(absolutePath, undefined, 'full');
    
    console.log('\n📊 Analysis Results:');
    console.log(`   Files analyzed: ${result.filesAnalyzed}`);
    console.log(`   Symbols found: ${result.symbolsAnalyzed}`);
    console.log(`   Relationships: ${result.relationships}`);
    console.log(`   Execution paths: ${result.executionPaths}`);
    
    // Check if SQLite database was created
    const dbPath = path.join('.guru', 'guru.db');
    const fs = await import('fs');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`\n✅ SQLite database created: ${dbPath}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.error('\n⚠️  SQLite database not created at expected location');
    }
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

analyzeCodebase().catch(console.error);