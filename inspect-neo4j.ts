#!/usr/bin/env tsx
/**
 * Inspect Neo4j Database Structure
 */

import neo4j from 'neo4j-driver';
import { config } from 'dotenv';

config();

async function inspectNeo4j() {
  console.log('🔍 Inspecting Neo4j Database Structure...\n');
  
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    const session = driver.session();
    
    // 1. Count node types
    console.log('📊 Node Types and Counts:');
    const nodeCountsResult = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] as NodeType, count(n) as Count
      ORDER BY Count DESC
    `);
    
    nodeCountsResult.records.forEach(record => {
      console.log(`   ${record.get('NodeType')}: ${record.get('Count').toNumber()}`);
    });
    
    // 2. Sample Symbol nodes
    console.log('\n🔤 Sample Symbol Nodes:');
    const symbolsResult = await session.run(`
      MATCH (s:Symbol)
      RETURN s
      LIMIT 5
    `);
    
    if (symbolsResult.records.length === 0) {
      console.log('   No Symbol nodes found');
    } else {
      symbolsResult.records.forEach(record => {
        const symbol = record.get('s').properties;
        console.log(`   ${symbol.name} (${symbol.type}) - ${symbol.file}`);
      });
    }
    
    // 3. Sample Pattern nodes
    console.log('\n🎨 Sample Pattern Nodes:');
    const patternsResult = await session.run(`
      MATCH (p:Pattern)
      RETURN p
      LIMIT 5
    `);
    
    patternsResult.records.forEach(record => {
      const pattern = record.get('p').properties;
      console.log(`   Category: ${pattern.category}`);
      console.log(`     Strength: ${pattern.strength}`);
      console.log(`     Confidence: ${pattern.confidence}`);
      console.log(`     Coordinates: ${pattern.dpcmCoordinates}`);
      console.log('');
    });
    
    // 4. Count relationships
    console.log('🔗 Relationship Types and Counts:');
    const relCountsResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as RelType, count(r) as Count
      ORDER BY Count DESC
    `);
    
    if (relCountsResult.records.length === 0) {
      console.log('   No relationships found');
    } else {
      relCountsResult.records.forEach(record => {
        console.log(`   ${record.get('RelType')}: ${record.get('Count').toNumber()}`);
      });
    }
    
    // 5. Check Pattern-Symbol connections
    console.log('\n🔄 Pattern-Symbol Connections:');
    const connectionResult = await session.run(`
      MATCH (p:Pattern)-[r:FOUND_IN]->(s:Symbol)
      RETURN count(r) as ConnectionCount
    `);
    
    const connections = connectionResult.records[0]?.get('ConnectionCount')?.toNumber() || 0;
    console.log(`   Patterns connected to Symbols: ${connections}`);
    
    // 6. Database schema
    console.log('\n📋 Database Schema:');
    const schemaResult = await session.run(`
      CALL db.schema.visualization()
    `);
    
    if (schemaResult.records.length > 0) {
      const nodes = schemaResult.records[0].get('nodes');
      const relationships = schemaResult.records[0].get('relationships');
      console.log(`   Node types: ${nodes.length}`);
      console.log(`   Relationship types: ${relationships.length}`);
    }
    
    await session.close();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await driver.close();
  }
}

inspectNeo4j().catch(console.error);