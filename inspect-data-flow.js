import neo4j from 'neo4j-driver';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';

config();

async function inspectDataFlow() {
  console.log('🔍 GURU DATA FLOW INSPECTION');
  console.log('============================\n');

  // 1. Check SQLite database for symbols
  console.log('📊 SQLITE DATABASE (Primary Symbol Storage):');
  console.log('==========================================');
  
  const sqliteDbPath = path.join(process.cwd(), '.guru', 'guru.db');
  try {
    const db = new Database(sqliteDbPath, { readonly: true });
    
    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    // Check file_analysis table
    const fileCount = db.prepare("SELECT COUNT(*) as count FROM file_analysis").get();
    console.log(`\nfile_analysis table: ${fileCount.count} files`);
    
    // Sample file analysis
    const sampleFile = db.prepare("SELECT * FROM file_analysis LIMIT 1").get();
    if (sampleFile) {
      console.log('\nSample file_analysis entry:');
      console.log(`  - path: ${sampleFile.path}`);
      console.log(`  - hash: ${sampleFile.hash}`);
      console.log(`  - analyzed_at: ${sampleFile.analyzed_at}`);
      
      // Parse symbols JSON
      if (sampleFile.symbols) {
        const symbols = JSON.parse(sampleFile.symbols);
        console.log(`  - symbols count: ${symbols.length}`);
        if (symbols.length > 0) {
          console.log('  - sample symbol:', symbols[0]);
        }
      }
      
      // Parse imports JSON
      if (sampleFile.imports) {
        const imports = JSON.parse(sampleFile.imports);
        console.log(`  - imports count: ${imports.length}`);
      }
      
      // Parse exports JSON
      if (sampleFile.exports) {
        const exports = JSON.parse(sampleFile.exports);
        console.log(`  - exports count: ${exports.length}`);
      }
    }
    
    // Check dependencies table
    const depCount = db.prepare("SELECT COUNT(*) as count FROM dependencies").get();
    console.log(`\ndependencies table: ${depCount.count} entries`);
    
    db.close();
  } catch (error) {
    console.log('SQLite database error:', error.message);
  }

  // 2. Check Neo4j for graph relationships
  console.log('\n\n📈 NEO4J GRAPH DATABASE (Relationships & Patterns):');
  console.log('=================================================');
  
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    await driver.verifyConnectivity();
    const session = driver.session();
    
    try {
      // Check if symbols are being synced to Neo4j
      const symbolCount = await session.run('MATCH (s:Symbol) RETURN count(s) as count');
      console.log(`Symbol nodes: ${symbolCount.records[0].get('count').toNumber()}`);
      
      // Check patterns
      const patternCount = await session.run('MATCH (p:Pattern) RETURN count(p) as count');
      console.log(`Pattern nodes: ${patternCount.records[0].get('count').toNumber()}`);
      
      // Show a sample pattern with its properties
      const samplePattern = await session.run(`
        MATCH (p:Pattern)
        RETURN p
        LIMIT 1
      `);
      
      if (samplePattern.records.length > 0) {
        const pattern = samplePattern.records[0].get('p').properties;
        console.log('\nSample Pattern:');
        console.log(`  - ID: ${pattern.id}`);
        console.log(`  - Category: ${pattern.category}`);
        console.log(`  - Strength: ${pattern.strength}`);
        console.log(`  - Occurrences: ${pattern.occurrences}`);
        console.log(`  - DPCM Coordinates: ${JSON.stringify(pattern.dpcmCoordinates)}`);
      }
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.log('Neo4j error:', error.message);
  } finally {
    await driver.close();
  }

  // 3. Explain the data flow
  console.log('\n\n📋 DATA FLOW EXPLANATION:');
  console.log('========================');
  console.log(`
1. SYMBOL EXTRACTION (SQLite):
   - Guru analyzes TypeScript/JavaScript files using AST parsing
   - Extracts symbols (functions, classes, variables, imports, exports)
   - Stores in SQLite database (file_analysis table) as JSON
   - Primary storage for code structure and symbols

2. PATTERN DETECTION:
   - Harmonic Intelligence analyzers scan code for patterns
   - Patterns include: architectural, quantum, geometric, etc.
   - Each pattern has DPCM coordinates for multi-dimensional positioning

3. GRAPH RELATIONSHIPS (Neo4j):
   - Patterns are stored as nodes with properties
   - Symbol nodes SHOULD be created from SQLite data (but currently missing)
   - Relationships: FOUND_IN (pattern->symbol), SIMILAR_TO (pattern->pattern)
   - Enables graph queries for pattern discovery and code insights

4. CURRENT STATE:
   - ✅ Symbols are extracted and stored in SQLite
   - ✅ Patterns are detected and stored in Neo4j
   - ❌ Symbols are NOT being synced to Neo4j (0 Symbol nodes)
   - ❌ Pattern-Symbol relationships cannot be created without Symbol nodes

5. MISSING CONNECTION:
   - The Neo4jRelationshipStore.createSymbol() method exists
   - But it's not being called during the analysis pipeline
   - Need to sync symbols from SQLite to Neo4j after analysis
  `);
}

// Run the inspection
inspectDataFlow().catch(console.error);