#!/usr/bin/env node

// Minimal test to isolate the fake file generation issue
import { SymbolGraphBuilder } from "./src/parsers/symbol-graph.js";

console.log('Testing SymbolGraphBuilder only...');
const builder = new SymbolGraphBuilder(false); // not quiet so we see output

console.log('Building graph for src/core...');
builder.build({ 
  path: 'src/core',
  language: 'typescript',
  includeTests: false
}).then(graph => {
  console.log('Graph built successfully');
  console.log(`Found ${graph.symbols.size} symbols`);
  console.log(`Analyzed files:`, graph.metadata.analyzedFiles.slice(0, 10));
}).catch(err => {
  console.error('Graph building failed:', err);
});