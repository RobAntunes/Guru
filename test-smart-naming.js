/**
 * Test Smart Symbol Naming Feature
 * 
 * This test demonstrates how the smart symbol namer enhances
 * anonymous functions and provides confidence-scored naming.
 */

import { SymbolGraphBuilder } from './dist/parsers/symbol-graph.js';
import path from 'path';

console.log('🧠 Testing Smart Symbol Naming...');

async function testSmartNaming() {
  try {
    const builder = new SymbolGraphBuilder();
    
    // Test on the current project
    const projectPath = process.cwd();
    console.log(`Analyzing project at: ${projectPath}`);
    
    const graph = await builder.build({
      path: projectPath,
      includeTests: true
    });
    
    console.log(`\\n📊 Analysis Results:`);
    console.log(`- Total symbols: ${graph.symbols.size}`);
    console.log(`- Total edges: ${graph.edges.length}`);
    console.log(`- Analyzed files: ${graph.metadata.analyzedFiles.length}`);
    console.log(`- Coverage: ${((graph.metadata.coverage || 0) * 100).toFixed(1)}%`);
    
    // Find symbols with smart naming enhancements
    const enhancedSymbols = Array.from(graph.symbols.values())
      .filter(symbol => symbol.smartNaming);
    
    console.log(`\\n🎯 Smart Naming Results:`);
    console.log(`- Enhanced symbols: ${enhancedSymbols.length}`);
    
    if (enhancedSymbols.length > 0) {
      console.log(`\\n📝 Sample Enhanced Symbols:`);
      enhancedSymbols.slice(0, 5).forEach(symbol => {
        const smart = symbol.smartNaming;
        console.log(`\\n  Symbol: ${symbol.name}`);
        console.log(`    Inferred: ${smart.inferredName}`);
        console.log(`    Confidence: ${(smart.confidence.overall * 100).toFixed(1)}%`);
        const dims = smart.confidence.dimensions || {};
        const identity = typeof dims.identity === 'number' ? (dims.identity * 100).toFixed(1) + '%' : 'N/A';
        const purpose = typeof dims.purpose === 'number' ? (dims.purpose * 100).toFixed(1) + '%' : 'N/A';
        console.log(`    Identity: ${identity}`);
        console.log(`    Purpose: ${purpose}`);
        console.log(`    Location: ${symbol.location.file}:${symbol.location.startLine}`);
        
        if (smart.context.assignmentVariable) {
          console.log(`    Context: Variable assignment (${smart.context.assignmentVariable})`);
        } else if (smart.context.objectProperty) {
          console.log(`    Context: Object property (${smart.context.objectProperty})`);
        } else if (smart.context.callbackParameter) {
          console.log(`    Context: Callback parameter (${smart.context.callbackParameter})`);
        }
        
        if (Array.isArray(smart.confidence.evidence) && smart.confidence.evidence.length > 0) {
          console.log(`    Evidence: ${smart.confidence.evidence.join(', ')}`);
        }
        
        if (Array.isArray(smart.confidence.limitations) && smart.confidence.limitations.length > 0) {
          console.log(`    Limitations: ${smart.confidence.limitations.join(', ')}`);
        }
      });
    }
    
    // Find anonymous functions that got enhanced
    const anonymousFunctions = Array.from(graph.symbols.values())
      .filter(symbol => 
        symbol.type === 'function' && 
        (symbol.name === 'anonymous' || symbol.smartNaming)
      );
    
    console.log(`\\n🔍 Anonymous Function Analysis:`);
    console.log(`- Anonymous functions found: ${anonymousFunctions.length}`);
    
    // Confidence score distribution
    if (enhancedSymbols.length > 0) {
      const confidenceScores = enhancedSymbols.map(s => s.smartNaming.confidence.overall);
      const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
      const highConfidence = confidenceScores.filter(c => c > 0.7).length;
      
      console.log(`\\n📈 Confidence Analysis:`);
      console.log(`- Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
      console.log(`- High confidence (>70%): ${highConfidence}/${enhancedSymbols.length}`);
    }
    
    console.log(`\\n✅ Smart Symbol Naming test completed successfully!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSmartNaming();
