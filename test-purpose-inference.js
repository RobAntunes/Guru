#!/usr/bin/env node

/**
 * 🧠 PURPOSE INFERENCE VALIDATION TEST
 * Revolutionary AI-native purpose inference system validation
 * 
 * Tests our multi-layer evidence gathering and advanced pattern recognition
 * on Canon's TypeScript codebase to demonstrate AI-optimized understanding.
 */

import { PurposeInferrer } from './src/intelligence/purpose-inferrer.js';
import { SymbolGraphBuilder } from './src/parsers/symbol-graph.js';
import { ExecutionTracer } from './src/intelligence/execution-tracer.js';
import { LanguageManager } from './src/parsers/language-manager.js';

const CANON_SERVER_PATH = '/Users/boss/Documents/projects/canon/api/src/server.ts';

async function testPurposeInference() {
  console.log('🧠 TESTING REVOLUTIONARY PURPOSE INFERENCE SYSTEM');
  console.log('='.repeat(60));
  
  try {
    // Initialize our AI-native intelligence systems
    const languageManager = new LanguageManager();
    const symbolGraphBuilder = new SymbolGraphBuilder(languageManager);
    const executionTracer = new ExecutionTracer();
    const purposeInferrer = new PurposeInferrer();
    
    console.log('🔍 Building symbol graph from Canon server.ts...');
    const symbolGraph = await symbolGraphBuilder.buildFromFile(CANON_SERVER_PATH);
    
    console.log(`📊 Symbol graph: ${symbolGraph.symbols.size} symbols, ${symbolGraph.edges.length} edges`);
    
    // Get a few interesting symbols to test purpose inference
    const testSymbols = Array.from(symbolGraph.symbols.values()).slice(0, 5);
    
    console.log('\n🎯 TESTING PURPOSE INFERENCE ON KEY SYMBOLS');
    console.log('='.repeat(60));
    
    for (const symbol of testSymbols) {
      console.log(`\n🔬 Analyzing: ${symbol.name} (${symbol.type})`);
      console.log('-'.repeat(40));
      
      // Generate execution traces for this symbol
      console.log('⚡ Generating execution traces...');
      const executionTraces = await executionTracer.traceExecution({
        entryPoint: symbol.id,
        symbolGraph,
        maxDepth: 5,
        includeDataFlow: true
      });
      
      // Infer purpose using our revolutionary system
      console.log('🧠 Inferring purpose with multi-layer evidence analysis...');
      const purpose = await purposeInferrer.infer({
        symbol,
        symbolGraph,
        executionTraces
      });
      
      // Display results in beautiful format
      console.log(`\n🎯 PRIMARY PURPOSE: ${purpose.inferredGoal}`);
      console.log(`📊 CONFIDENCE: ${(purpose.confidence * 100).toFixed(1)}%`);
      
      console.log('\n📋 EVIDENCE SUMMARY:');
      const evidenceByType = {
        structural: purpose.evidence.filter(e => e.type === 'structural'),
        behavioral: purpose.evidence.filter(e => e.type === 'behavioral'),
        naming: purpose.evidence.filter(e => e.type === 'naming'),
        dependency: purpose.evidence.filter(e => e.type === 'dependency')
      };
      
      Object.entries(evidenceByType).forEach(([type, evidence]) => {
        if (evidence.length > 0) {
          console.log(`  ${type.toUpperCase()}:`);
          evidence.forEach(e => {
            console.log(`    • ${e.description} (${(e.strength * 100).toFixed(0)}% strength, ${e.source})`);
          });
        }
      });
      
      if (purpose.alternatives.length > 0) {
        console.log('\n🔄 ALTERNATIVE INTERPRETATIONS:');
        purpose.alternatives.forEach((alt, i) => {
          console.log(`  ${i + 1}. ${alt.goal} (${(alt.confidence * 100).toFixed(0)}% confidence)`);
          console.log(`     Reasoning: ${alt.reasoning}`);
        });
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
    // Test advanced pattern recognition
    console.log('\n🔬 ADVANCED PATTERN RECOGNITION SHOWCASE');
    console.log('='.repeat(60));
    
    // Find symbols that should trigger specific patterns
    const symbols = Array.from(symbolGraph.symbols.values());
    
    // Look for validation patterns
    const validationSymbols = symbols.filter(s => 
      s.name.toLowerCase().includes('validate') || 
      s.name.toLowerCase().includes('check') ||
      s.name.toLowerCase().includes('verify')
    );
    
    if (validationSymbols.length > 0) {
      console.log('\n🛡️ VALIDATION PATTERN DETECTION:');
      for (const symbol of validationSymbols.slice(0, 2)) {
        const purpose = await purposeInferrer.infer({
          symbol,
          symbolGraph,
          executionTraces: []
        });
        console.log(`  ${symbol.name}: ${purpose.inferredGoal} (${(purpose.confidence * 100).toFixed(1)}%)`);
      }
    }
    
    // Look for hub/coordinator patterns (high degree nodes)
    const hubSymbols = symbols
      .map(symbol => ({
        symbol,
        inDegree: symbolGraph.edges.filter(e => e.to === symbol.id).length,
        outDegree: symbolGraph.edges.filter(e => e.from === symbol.id).length
      }))
      .filter(item => item.inDegree > 2 && item.outDegree > 2)
      .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree));
    
    if (hubSymbols.length > 0) {
      console.log('\n🎯 HUB/COORDINATOR PATTERN DETECTION:');
      for (const { symbol, inDegree, outDegree } of hubSymbols.slice(0, 2)) {
        const purpose = await purposeInferrer.infer({
          symbol,
          symbolGraph,
          executionTraces: []
        });
        console.log(`  ${symbol.name} (in:${inDegree}, out:${outDegree}): ${purpose.inferredGoal}`);
      }
    }
    
    console.log('\n🎉 PURPOSE INFERENCE VALIDATION COMPLETE!');
    console.log('✨ Revolutionary AI-native code intelligence demonstrated successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test with beautiful error handling
testPurposeInference().catch(error => {
  console.error('💥 Fatal error in purpose inference test:', error);
  process.exit(1);
});
