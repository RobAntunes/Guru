#!/usr/bin/env tsx
/**
 * Full Graph Migration Script
 * Migrates symbols from SQLite to Neo4j and links them with patterns
 */

import path from 'path';
import { existsSync } from 'fs';
import { SymbolMigrationEngine } from './src/migration/symbol-migration-engine.js';
import { PatternSymbolLinker } from './src/migration/pattern-symbol-linker.js';

async function runFullMigration() {
  console.log('🚀 Starting Full Graph Migration to Neo4j\n');
  console.log('This will:');
  console.log('  1. Migrate all symbols from SQLite to Neo4j');
  console.log('  2. Create symbol relationships (CALLS, IMPORTS, etc.)');
  console.log('  3. Link patterns to symbols they\'re found in');
  console.log('  4. Create pattern similarity relationships\n');

  // Check if SQLite database exists
  const sqlitePath = path.join(process.cwd(), '.guru', 'cache', 'guru.db');
  if (!existsSync(sqlitePath)) {
    console.error('❌ SQLite database not found at', sqlitePath);
    console.error('   Run "npx tsx analyze-codebase.ts" first to populate the symbol database');
    process.exit(1);
  }

  // Phase 1: Symbol Migration
  console.log('📦 PHASE 1: Symbol Migration\n');
  const symbolEngine = new SymbolMigrationEngine(sqlitePath);
  
  try {
    await symbolEngine.connect();
    
    // Get initial stats
    const beforeStats = await symbolEngine.getMigrationStats();
    console.log('📊 Before migration:');
    console.log(`   SQLite symbols: ${beforeStats.sqliteSymbols}`);
    console.log(`   SQLite references: ${beforeStats.sqliteReferences}`);
    console.log(`   Neo4j nodes: ${beforeStats.neo4jSymbols}`);
    console.log(`   Neo4j relationships: ${beforeStats.neo4jRelationships}\n`);

    // Run migration
    const migrationResult = await symbolEngine.migrateSymbolsToNeo4j();
    
    console.log('\n✅ Symbol migration complete:');
    console.log(`   Symbols created: ${migrationResult.symbolsCreated}`);
    console.log(`   Relationships created: ${migrationResult.relationshipsCreated}`);
    
    if (migrationResult.errors.length > 0) {
      console.log(`\n⚠️  Migration errors: ${migrationResult.errors.length}`);
      migrationResult.errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err}`);
      });
    }
    
    await symbolEngine.disconnect();
  } catch (error) {
    console.error('❌ Symbol migration failed:', error);
    await symbolEngine.disconnect();
    process.exit(1);
  }

  // Phase 2: Pattern-Symbol Linking
  console.log('\n\n📦 PHASE 2: Pattern-Symbol Linking\n');
  const linker = new PatternSymbolLinker();
  
  try {
    await linker.connect();
    
    // Run linking
    const linkingResult = await linker.linkPatternsToSymbols();
    
    console.log('\n✅ Pattern linking complete:');
    console.log(`   Patterns processed: ${linkingResult.patternsProcessed}`);
    console.log(`   Links created: ${linkingResult.linksCreated}`);
    console.log(`   Symbols linked: ${linkingResult.symbolsLinked}`);
    
    if (linkingResult.errors.length > 0) {
      console.log(`\n⚠️  Linking errors: ${linkingResult.errors.length}`);
      linkingResult.errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    // Get final statistics
    const finalStats = await linker.getLinkingStats();
    console.log('\n📈 Final Graph Statistics:');
    console.log(`   Total patterns: ${finalStats.totalPatterns}`);
    console.log(`   Total symbols: ${finalStats.totalSymbols}`);
    console.log(`   Total links: ${finalStats.totalLinks}`);
    console.log(`   Avg patterns per symbol: ${finalStats.avgPatternsPerSymbol.toFixed(2)}`);
    console.log(`   Avg symbols per pattern: ${finalStats.avgSymbolsPerPattern.toFixed(2)}`);
    
    await linker.disconnect();
  } catch (error) {
    console.error('❌ Pattern linking failed:', error);
    await linker.disconnect();
    process.exit(1);
  }

  console.log('\n🎉 Full graph migration completed successfully!');
  console.log('\nYou can now run queries like:');
  console.log('  - Find functions with strong harmonic patterns');
  console.log('  - Track pattern propagation through call chains');
  console.log('  - Identify architectural pattern hotspots');
  console.log('  - Analyze code quality through pattern strength\n');
}

// Run migration
runFullMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});