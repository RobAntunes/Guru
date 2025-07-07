#!/usr/bin/env tsx
/**
 * Graph Intelligence Queries
 * Showcase the power of the integrated Symbol-Pattern graph
 */

import neo4j from 'neo4j-driver';
import { config } from 'dotenv';

config();

class GraphIntelligenceQueries {
  private driver: neo4j.Driver;

  constructor() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async close() {
    await this.driver.close();
  }

  /**
   * Find the most harmonically beautiful functions
   */
  async findMostHarmonicFunctions(limit: number = 10) {
    console.log('\n🎵 Most Harmonically Beautiful Functions:\n');
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (f:Symbol {type: 'function'})-[:EXHIBITS]->(p:Pattern)
        WITH f, avg(p.strength) as harmonyScore, count(p) as patternCount,
             collect(DISTINCT p.category) as categories
        WHERE patternCount >= 2
        RETURN f.name as function, f.file as file, f.startLine as line,
               harmonyScore, patternCount, categories
        ORDER BY harmonyScore DESC
        LIMIT $limit
      `, { limit: Math.floor(limit) });

      result.records.forEach((record, idx) => {
        console.log(`${idx + 1}. ${record.get('function')} (${record.get('harmonyScore').toFixed(3)} harmony)`);
        console.log(`   📁 ${record.get('file')}:${record.get('line')}`);
        console.log(`   🎨 ${record.get('patternCount')} patterns: ${record.get('categories').join(', ')}`);
        console.log('');
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Find architectural pattern hotspots
   */
  async findArchitecturalHotspots() {
    console.log('\n🏛️  Architectural Pattern Hotspots:\n');
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)-[:EXHIBITS]->(p:Pattern {category: 'ARCHITECTURAL'})
        WITH s.file as file, count(DISTINCT s) as symbolCount, 
             avg(p.strength) as avgStrength, collect(DISTINCT s.name) as symbols
        WHERE symbolCount >= 3
        RETURN file, symbolCount, avgStrength, symbols[0..5] as topSymbols
        ORDER BY symbolCount DESC, avgStrength DESC
        LIMIT 10
      `);

      result.records.forEach(record => {
        console.log(`📁 ${record.get('file')}`);
        console.log(`   ${record.get('symbolCount')} symbols with avg strength ${record.get('avgStrength').toFixed(3)}`);
        console.log(`   Key symbols: ${record.get('topSymbols').join(', ')}`);
        console.log('');
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Track pattern propagation through call chains
   */
  async trackPatternPropagation(category: string = 'QUANTUM') {
    console.log(`\n🌊 ${category} Pattern Propagation:\n`);
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH path = (s1:Symbol)-[:CALLS*1..3]->(s2:Symbol)
        WHERE (s1)-[:EXHIBITS]->(:Pattern {category: $category})
          AND (s2)-[:EXHIBITS]->(:Pattern {category: $category})
        WITH path, length(path) as depth, 
             [n in nodes(path) | n.name] as callChain
        RETURN callChain, depth
        ORDER BY depth DESC
        LIMIT 10
      `, { category });

      result.records.forEach(record => {
        const chain = record.get('callChain');
        const depth = record.get('depth').toNumber();
        console.log(`📞 Call chain (depth ${depth}):`);
        console.log(`   ${chain.join(' → ')}`);
        console.log('');
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Find refactoring candidates (low harmony, high complexity)
   */
  async findRefactoringCandidates() {
    console.log('\n🔧 Refactoring Candidates:\n');
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)
        WHERE s.type IN ['class', 'function']
        OPTIONAL MATCH (s)-[:EXHIBITS]->(p:Pattern)
        WITH s, avg(p.strength) as harmonyScore, 
             count(p) as patternCount,
             s.complexity as complexity
        WHERE (harmonyScore < 0.5 OR harmonyScore IS NULL) 
          AND complexity > 10
        RETURN s.name as symbol, s.type as type, s.file as file,
               harmonyScore, patternCount, complexity
        ORDER BY complexity DESC, harmonyScore ASC
        LIMIT 10
      `);

      result.records.forEach((record, idx) => {
        const harmony = record.get('harmonyScore');
        console.log(`${idx + 1}. ${record.get('symbol')} (${record.get('type')})`);
        console.log(`   📁 ${record.get('file')}`);
        console.log(`   ⚠️  Complexity: ${record.get('complexity')?.toNumber() || 'N/A'}`);
        console.log(`   🎵 Harmony: ${harmony ? harmony.toFixed(3) : 'No patterns'} (${record.get('patternCount')} patterns)`);
        console.log('');
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Find code quality leaders (symbols with multiple strong patterns)
   */
  async findQualityLeaders() {
    console.log('\n⭐ Code Quality Leaders:\n');
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)-[:EXHIBITS]->(p:Pattern)
        WHERE p.strength > 0.8
        WITH s, count(DISTINCT p.category) as uniquePatterns,
             avg(p.strength) as avgStrength,
             collect(DISTINCT p.category) as categories
        WHERE uniquePatterns >= 3
        RETURN s.name as symbol, s.type as type, s.file as file,
               uniquePatterns, avgStrength, categories
        ORDER BY uniquePatterns DESC, avgStrength DESC
        LIMIT 10
      `);

      result.records.forEach((record, idx) => {
        console.log(`${idx + 1}. ${record.get('symbol')} (${record.get('type')})`);
        console.log(`   📁 ${record.get('file')}`);
        console.log(`   🏆 ${record.get('uniquePatterns')} unique patterns, ${record.get('avgStrength').toFixed(3)} avg strength`);
        console.log(`   🎨 Patterns: ${record.get('categories').join(', ')}`);
        console.log('');
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Analyze pattern distribution across the codebase
   */
  async analyzePatternDistribution() {
    console.log('\n📊 Pattern Distribution Analysis:\n');
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Symbol)-[:EXHIBITS]->(p:Pattern)
        WITH p.category as category, 
             count(DISTINCT s) as symbolCount,
             count(DISTINCT p) as patternCount,
             avg(p.strength) as avgStrength
        RETURN category, symbolCount, patternCount, avgStrength
        ORDER BY symbolCount DESC
      `);

      console.log('Category            | Symbols | Patterns | Avg Strength');
      console.log('-------------------|---------|----------|-------------');
      result.records.forEach(record => {
        const cat = record.get('category').padEnd(18);
        const symbols = record.get('symbolCount').toNumber().toString().padEnd(7);
        const patterns = record.get('patternCount').toNumber().toString().padEnd(8);
        const strength = record.get('avgStrength').toFixed(3);
        console.log(`${cat} | ${symbols} | ${patterns} | ${strength}`);
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Find similar code structures based on pattern similarity
   */
  async findSimilarCodeStructures(symbolName: string) {
    console.log(`\n🔍 Code Similar to "${symbolName}":\n`);
    
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (source:Symbol {name: $symbolName})-[:EXHIBITS]->(p1:Pattern)
        MATCH (p1)-[:SIMILAR_TO]-(p2:Pattern)<-[:EXHIBITS]-(target:Symbol)
        WHERE source <> target
        WITH target, count(DISTINCT p2) as sharedPatterns,
             avg(p2.strength) as avgStrength
        RETURN target.name as symbol, target.file as file,
               sharedPatterns, avgStrength
        ORDER BY sharedPatterns DESC, avgStrength DESC
        LIMIT 10
      `, { symbolName });

      if (result.records.length === 0) {
        console.log('No similar code structures found.');
      } else {
        result.records.forEach((record, idx) => {
          console.log(`${idx + 1}. ${record.get('symbol')}`);
          console.log(`   📁 ${record.get('file')}`);
          console.log(`   🔗 ${record.get('sharedPatterns')} shared patterns, ${record.get('avgStrength').toFixed(3)} avg strength`);
          console.log('');
        });
      }
    } finally {
      await session.close();
    }
  }
}

// CLI interface
async function main() {
  const queries = new GraphIntelligenceQueries();
  
  try {
    console.log('🧠 Graph Intelligence Query Showcase');
    console.log('=====================================');
    
    // Run all showcase queries
    await queries.findMostHarmonicFunctions();
    await queries.findArchitecturalHotspots();
    await queries.trackPatternPropagation('QUANTUM');
    await queries.findRefactoringCandidates();
    await queries.findQualityLeaders();
    await queries.analyzePatternDistribution();
    
    // Example of finding similar code
    // await queries.findSimilarCodeStructures('processQuantumState');
    
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await queries.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}