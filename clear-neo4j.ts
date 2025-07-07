#!/usr/bin/env tsx
/**
 * Clear Neo4j database
 */

import neo4j from 'neo4j-driver';
import { config } from 'dotenv';

config();

async function clearNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    const session = driver.session();
    
    console.log('🗑️  Clearing Neo4j database...');
    
    // Delete all relationships first
    await session.run('MATCH ()-[r]->() DELETE r');
    console.log('   ✅ Deleted all relationships');
    
    // Then delete all nodes
    await session.run('MATCH (n) DELETE n');
    console.log('   ✅ Deleted all nodes');
    
    await session.close();
    console.log('\n✅ Neo4j database cleared');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await driver.close();
  }
}

clearNeo4j().catch(console.error);