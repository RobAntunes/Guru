/**
 * Test runner for Guru symbol graph building
 */

import { SymbolGraphBuilder } from '../src/parsers/symbol-graph.ts';
import { writeFile } from 'fs/promises';

async function testSymbolGraph() {
  console.log('🧪 Testing symbol graph building...');
  
  const builder = new SymbolGraphBuilder();
  
  try {
    // Test on our own guru codebase
    const result = await builder.build({
      path: '/Users/boss/Documents/projects/guru/src',
      includeTests: false
    });
    
    console.log(`\n📊 Results:`);
    console.log(`- Symbols found: ${result.symbols.size}`);
    console.log(`- Edges found: ${result.edges.length}`);
    console.log(`- Files analyzed: ${result.metadata.analyzedFiles.length}`);
    
    // Show first few symbols
    console.log(`\n🔍 First 5 symbols:`);
    let count = 0;
    for (const [id, symbol] of result.symbols) {
      if (count++ < 5) {
        console.log(`- ${symbol.type}: ${symbol.name} (${symbol.location.file}:${symbol.location.startLine})`);
      }
    }
    
    // Save results to file for inspection
    const output = {
      symbolCount: result.symbols.size,
      edgeCount: result.edges.length,
      fileCount: result.metadata.analyzedFiles.length,
      symbols: Array.from(result.symbols.entries()).map(([id, symbol]) => ({
        id,
        name: symbol.name,
        type: symbol.type,
        file: symbol.location.file,
        line: symbol.location.startLine
      })),
      files: result.metadata.analyzedFiles
    };
    
    await writeFile('/Users/boss/Documents/projects/guru/test-results.json', JSON.stringify(output, null, 2));
    console.log(`\n💾 Results saved to test-results.json`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSymbolGraph();
