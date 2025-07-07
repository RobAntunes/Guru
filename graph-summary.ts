#!/usr/bin/env tsx
/**
 * Graph Database Summary
 * Shows what's currently in the Neo4j graph
 */

import neo4j from 'neo4j-driver';
import { config } from 'dotenv';

config();

async function graphSummary() {
  console.log('📊 Neo4j Graph Database Summary\n');
  
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    const session = driver.session();
    
    // 1. Symbol statistics
    console.log('🔤 Symbol Statistics:');
    const symbolStats = await session.run(`
      MATCH (s:Symbol)
      RETURN s.type as type, count(s) as count
      ORDER BY count DESC
    `);
    
    let totalSymbols = 0;
    symbolStats.records.forEach(record => {
      const count = record.get('count').toNumber();
      totalSymbols += count;
      console.log(`   ${record.get('type')}: ${count}`);
    });
    console.log(`   Total: ${totalSymbols} symbols\n`);
    
    // 2. File statistics
    console.log('📁 Top Files by Symbol Count:');
    const fileStats = await session.run(`
      MATCH (s:Symbol)
      WITH s.file as file, count(s) as symbolCount
      RETURN file, symbolCount
      ORDER BY symbolCount DESC
      LIMIT 10
    `);
    
    fileStats.records.forEach(record => {
      console.log(`   ${record.get('symbolCount').toNumber()} symbols in ${record.get('file')}`);
    });
    
    // 3. Relationship statistics
    console.log('\n🔗 Relationship Types:');
    const relStats = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as relType, count(r) as count
      ORDER BY count DESC
    `);
    
    if (relStats.records.length === 0) {
      console.log('   No relationships yet (need to analyze codebase with patterns)');
    } else {
      relStats.records.forEach(record => {
        console.log(`   ${record.get('relType')}: ${record.get('count').toNumber()}`);
      });
    }
    
    // 4. Pattern statistics
    console.log('\n🎨 Pattern Statistics:');
    const patternStats = await session.run(`
      MATCH (p:Pattern)
      RETURN p.category as category, count(p) as count
      ORDER BY count DESC
    `);
    
    if (patternStats.records.length === 0) {
      console.log('   No patterns yet (need to store harmonic analysis results)');
    } else {
      patternStats.records.forEach(record => {
        console.log(`   ${record.get('category')}: ${record.get('count').toNumber()}`);
      });
    }
    
    // 5. Complex functions
    console.log('\n🔧 Most Complex Functions:');
    const complexFunctions = await session.run(`
      MATCH (f:Symbol {type: 'function'})
      WHERE f.complexity IS NOT NULL
      RETURN f.name as name, f.file as file, f.complexity as complexity
      ORDER BY complexity DESC
      LIMIT 10
    `);
    
    complexFunctions.records.forEach((record, idx) => {
      console.log(`   ${idx + 1}. ${record.get('name')} (complexity: ${record.get('complexity')})`);
      console.log(`      📁 ${record.get('file')}`);
    });
    
    // 6. Next steps
    console.log('\n📋 Next Steps:');
    console.log('   1. Store harmonic analysis patterns in the database');
    console.log('   2. Run pattern-symbol linking to connect patterns to code');
    console.log('   3. Execute graph intelligence queries to find:');
    console.log('      - Most harmonically beautiful functions');
    console.log('      - Architectural pattern hotspots');
    console.log('      - Pattern propagation through call chains');
    console.log('      - Code quality leaders\n');
    
    await session.close();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await driver.close();
  }
}

graphSummary().catch(console.error);