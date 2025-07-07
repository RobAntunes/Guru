import neo4j from 'neo4j-driver';
import { config } from 'dotenv';

config();

async function inspectNeo4jDatabase() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j\n');
    
    const session = driver.session();
    
    try {
      // 1. Get all node labels and their counts
      console.log('📊 NODE TYPES AND COUNTS:');
      console.log('========================');
      const labelResult = await session.run(`
        CALL db.labels() YIELD label
        RETURN label
        ORDER BY label
      `);
      
      for (const record of labelResult.records) {
        const label = record.get('label');
        const countResult = await session.run(
          `MATCH (n:${label}) RETURN count(n) as count`
        );
        const count = countResult.records[0].get('count').toNumber();
        console.log(`${label}: ${count} nodes`);
      }
      
      // 2. Get all relationship types and their counts
      console.log('\n📐 RELATIONSHIP TYPES AND COUNTS:');
      console.log('=================================');
      const relResult = await session.run(`
        CALL db.relationshipTypes() YIELD relationshipType
        RETURN relationshipType
        ORDER BY relationshipType
      `);
      
      for (const record of relResult.records) {
        const relType = record.get('relationshipType');
        const countResult = await session.run(
          `MATCH ()-[r:${relType}]->() RETURN count(r) as count`
        );
        const count = countResult.records[0].get('count').toNumber();
        console.log(`${relType}: ${count} relationships`);
      }
      
      // 3. Inspect Symbol node properties
      console.log('\n🔍 SYMBOL NODE PROPERTIES:');
      console.log('==========================');
      const symbolSample = await session.run(`
        MATCH (s:Symbol)
        RETURN s, labels(s) as labels
        LIMIT 1
      `);
      
      if (symbolSample.records.length > 0) {
        const symbolNode = symbolSample.records[0].get('s');
        console.log('Sample Symbol node properties:');
        Object.entries(symbolNode.properties).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} (${value?.constructor?.name || 'null'})`);
        });
      } else {
        console.log('No Symbol nodes found');
      }
      
      // 4. Inspect Pattern node properties
      console.log('\n🎯 PATTERN NODE PROPERTIES:');
      console.log('===========================');
      const patternSample = await session.run(`
        MATCH (p:Pattern)
        RETURN p, labels(p) as labels
        LIMIT 1
      `);
      
      if (patternSample.records.length > 0) {
        const patternNode = patternSample.records[0].get('p');
        console.log('Sample Pattern node properties:');
        Object.entries(patternNode.properties).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} (${value?.constructor?.name || 'null'})`);
        });
        
        // Show pattern categories
        console.log('\nPattern categories found:');
        const categoryResult = await session.run(`
          MATCH (p:Pattern)
          RETURN DISTINCT p.category as category, count(*) as count
          ORDER BY count DESC
        `);
        
        categoryResult.records.forEach(record => {
          console.log(`  - ${record.get('category')}: ${record.get('count').toNumber()} patterns`);
        });
      } else {
        console.log('No Pattern nodes found');
      }
      
      // 5. Show relationships between Symbols and Patterns
      console.log('\n🔗 SYMBOL-PATTERN RELATIONSHIPS:');
      console.log('================================');
      const symbolPatternRels = await session.run(`
        MATCH (s:Symbol)<-[r]-(p:Pattern)
        RETURN type(r) as relType, count(*) as count
        ORDER BY count DESC
      `);
      
      symbolPatternRels.records.forEach(record => {
        console.log(`${record.get('relType')}: ${record.get('count').toNumber()} connections`);
      });
      
      // 6. Show Symbol-to-Symbol relationships
      console.log('\n🔗 SYMBOL-TO-SYMBOL RELATIONSHIPS:');
      console.log('==================================');
      const symbolSymbolRels = await session.run(`
        MATCH (s1:Symbol)-[r]->(s2:Symbol)
        RETURN type(r) as relType, count(*) as count
        ORDER BY count DESC
      `);
      
      symbolSymbolRels.records.forEach(record => {
        console.log(`${record.get('relType')}: ${record.get('count').toNumber()} connections`);
      });
      
      // 7. Show Pattern-to-Pattern relationships
      console.log('\n🔗 PATTERN-TO-PATTERN RELATIONSHIPS:');
      console.log('====================================');
      const patternPatternRels = await session.run(`
        MATCH (p1:Pattern)-[r]-(p2:Pattern)
        WHERE id(p1) < id(p2)
        RETURN type(r) as relType, count(*) as count
        ORDER BY count DESC
      `);
      
      patternPatternRels.records.forEach(record => {
        console.log(`${record.get('relType')}: ${record.get('count').toNumber()} connections`);
      });
      
      // 8. Sample complex queries
      console.log('\n📈 SAMPLE INSIGHTS:');
      console.log('==================');
      
      // Most connected symbols
      const hubSymbols = await session.run(`
        MATCH (s:Symbol)
        OPTIONAL MATCH (s)-[r]-()
        WITH s, count(r) as connections
        ORDER BY connections DESC
        LIMIT 5
        RETURN s.name as name, s.type as type, connections
      `);
      
      console.log('\nMost connected symbols:');
      hubSymbols.records.forEach(record => {
        console.log(`  - ${record.get('name')} (${record.get('type')}): ${record.get('connections').toNumber()} connections`);
      });
      
      // Patterns with most symbol associations
      const patternSymbolCount = await session.run(`
        MATCH (p:Pattern)-[:FOUND_IN]->(s:Symbol)
        WITH p, count(DISTINCT s) as symbolCount
        ORDER BY symbolCount DESC
        LIMIT 5
        RETURN p.id as id, p.category as category, symbolCount
      `);
      
      console.log('\nPatterns found in most symbols:');
      patternSymbolCount.records.forEach(record => {
        console.log(`  - Pattern ${record.get('id')} (${record.get('category')}): found in ${record.get('symbolCount').toNumber()} symbols`);
      });
      
      // 9. Show indexes and constraints
      console.log('\n🔐 INDEXES AND CONSTRAINTS:');
      console.log('===========================');
      const constraints = await session.run('SHOW CONSTRAINTS');
      console.log('Constraints:');
      constraints.records.forEach(record => {
        console.log(`  - ${record.get('name')}: ${record.get('type')} on ${record.get('labelsOrTypes')} (${record.get('properties')})`);
      });
      
      const indexes = await session.run('SHOW INDEXES');
      console.log('\nIndexes:');
      indexes.records.forEach(record => {
        console.log(`  - ${record.get('name')}: ${record.get('type')} on ${record.get('labelsOrTypes')} (${record.get('properties')})`);
      });
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('❌ Error inspecting Neo4j:', error.message);
  } finally {
    await driver.close();
  }
}

// Run the inspection
inspectNeo4jDatabase().catch(console.error);