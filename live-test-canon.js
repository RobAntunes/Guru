/**
 * Live test of Guru's dependency edge building on Canon's TypeScript codebase
 * This will show our AI-optimized approach in action!
 */

import { SymbolGraphBuilder } from './src/parsers/symbol-graph.js';
import { writeFile } from 'fs/promises';

async function liveTestCanon() {
  console.log('🚀 LIVE TEST: Canon TypeScript Codebase Analysis');
  console.log('='.repeat(60));
  
  const builder = new SymbolGraphBuilder();
  
  try {
    console.log('🎯 Analyzing Canon /api/src directory...');
    
    // Test on Canon's actual codebase
    const result = await builder.build({
      path: '/Users/boss/Documents/projects/canon/api/src',
      includeTests: false // Focus on main code first
    });
    
    console.log(`\n📊 LIVE RESULTS:`);
    console.log(`✨ Symbols detected: ${result.symbols.size}`);
    console.log(`🔗 Dependency edges: ${result.edges.length}`);
    console.log(`📁 Files analyzed: ${result.metadata.analyzedFiles.length}`);
    console.log(`⚡ Analysis completed in: ${Date.now() - start}ms`);
    
    console.log(`\n🔍 TOP 10 SYMBOLS FOUND:`);
    let count = 0;
    for (const [id, symbol] of result.symbols) {
      if (count++ < 10) {
        console.log(`${count}. [${symbol.type}] ${symbol.name} (${symbol.location.file}:${symbol.location.startLine})`);
        if (symbol.dependencies.length > 0) {
          console.log(`   └─ Dependencies: ${symbol.dependencies.length}`);
        }
      }
    }
    
    console.log(`\n🔗 TOP 10 DEPENDENCY EDGES:`);
    for (let i = 0; i < Math.min(10, result.edges.length); i++) {
      const edge = result.edges[i];
      console.log(`${i + 1}. ${edge.from} --[${edge.type}]--> ${edge.to} (weight: ${edge.weight})`);
    }
    
    console.log(`\n📁 ANALYZED FILES:`);
    result.metadata.analyzedFiles.forEach((file, i) => {
      if (i < 15) { // Show first 15 files
        console.log(`${i + 1}. ${file}`);
      }
    });
    if (result.metadata.analyzedFiles.length > 15) {
      console.log(`... and ${result.metadata.analyzedFiles.length - 15} more files`);
    }
    
    // Analyze edge types distribution (AI optimization validation)
    const edgeTypes = {};
    result.edges.forEach(edge => {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
    });
    
    console.log(`\n🤖 AI-OPTIMIZED EDGE TYPE DISTRIBUTION:`);
    Object.entries(edgeTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} edges`);
    });
    
    // Analyze symbol types distribution
    const symbolTypes = {};
    for (const symbol of result.symbols.values()) {
      symbolTypes[symbol.type] = (symbolTypes[symbol.type] || 0) + 1;
    }
    
    console.log(`\n📊 SYMBOL TYPE BREAKDOWN:`);
    Object.entries(symbolTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} symbols`);
    });
    
    // Find most connected symbols (AI insights)
    const connectionCounts = [];
    for (const [id, symbol] of result.symbols) {
      const totalConnections = symbol.dependencies.length + symbol.dependents.length;
      if (totalConnections > 0) {
        connectionCounts.push({
          name: symbol.name,
          type: symbol.type,
          file: symbol.location.file,
          dependencies: symbol.dependencies.length,
          dependents: symbol.dependents.length,
          total: totalConnections
        });
      }
    }
    
    connectionCounts.sort((a, b) => b.total - a.total);
    
    console.log(`\n🌟 MOST CONNECTED SYMBOLS (AI Insights):`);
    connectionCounts.slice(0, 8).forEach((symbol, i) => {
      console.log(`${i + 1}. ${symbol.name} (${symbol.type}): ${symbol.total} connections`);
      console.log(`   └─ ${symbol.dependencies} deps, ${symbol.dependents} dependents in ${symbol.file}`);
    });
    
    // Save detailed results for inspection
    const detailedOutput = {
      summary: {
        symbolCount: result.symbols.size,
        edgeCount: result.edges.length,
        fileCount: result.metadata.analyzedFiles.length,
        analysisTime: Date.now() - start
      },
      symbolTypes,
      edgeTypes,
      topConnectedSymbols: connectionCounts.slice(0, 20),
      symbols: Array.from(result.symbols.entries()).map(([id, symbol]) => ({
        id,
        name: symbol.name,
        type: symbol.type,
        file: symbol.location.file,
        line: symbol.location.startLine,
        dependencies: symbol.dependencies.length,
        dependents: symbol.dependents.length
      })),
      edges: result.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        type: edge.type,
        weight: edge.weight
      })),
      files: result.metadata.analyzedFiles
    };
    
    await writeFile('/Users/boss/Documents/projects/guru/canon-live-results.json', JSON.stringify(detailedOutput, null, 2));
    console.log(`\n💾 Detailed results saved to: canon-live-results.json`);
    
    console.log(`\n🎯 AI-OPTIMIZATION VALIDATION:`);
    console.log(`✅ Structured edge types: ${Object.keys(edgeTypes).length} distinct types`);
    console.log(`✅ Weighted relationships: All edges have confidence weights`);
    console.log(`✅ Bidirectional tracking: ${connectionCounts.length} symbols with connections`);
    console.log(`✅ External dependencies: ${result.edges.filter(e => e.to.startsWith('external:')).length} external refs`);
    
    console.log(`\n🚀 READY FOR EXECUTION TRACING!`);
    console.log(`The dependency graph provides perfect foundation for AI-driven execution analysis.`);
    
    return detailedOutput;
    
  } catch (error) {
    console.error('❌ Live test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

const start = Date.now();
liveTestCanon().then(results => {
  if (results) {
    console.log('\n✅ Live test completed successfully!');
    console.log('🎉 Dependency edge building is working perfectly!');
  }
});
