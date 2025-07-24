/**
 * Example usage of the Harmonic Enrichment system
 * Shows how to enrich a symbol graph with harmonic intelligence
 * @module harmonic-intelligence/examples
 */

import { HarmonicEnricher, EnrichedSymbolGraph } from '../core/harmonic-enricher.js';
import { SymbolGraph } from '../../types/index.js';
import { PatternType, PatternCategory } from '../interfaces/harmonic-types.js';

/**
 * Example: Basic enrichment of a symbol graph
 */
export async function basicEnrichmentExample(symbolGraph: SymbolGraph): Promise<void> {
  console.log('=== Basic Harmonic Enrichment Example ===\n');
  
  // Create enricher
  const enricher = new HarmonicEnricher();
  
  // Enrich the symbol graph with all harmonic patterns
  const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph);
  
  // Access enriched data for a specific symbol
  const symbolId = 'com.example.UserService';
  const enrichedData = enrichedGraph.getEnrichedSymbol(symbolId);
  
  if (enrichedData) {
    console.log(`Symbol: ${enrichedData.symbol.name}`);
    console.log(`Type: ${enrichedData.symbol.type}`);
    console.log(`Overall Harmonic Score: ${enrichedData.overallHarmonicScore?.toFixed(3)}`);
    console.log(`Participates in ${enrichedData.participatesIn?.length || 0} patterns\n`);
  }
  
  // Get pattern statistics
  const stats = enrichedGraph.getPatternStatistics();
  console.log('Pattern Statistics:');
  for (const [pattern, stat] of stats) {
    console.log(`  ${pattern}: ${stat.count} occurrences, avg score: ${stat.avgScore.toFixed(3)}`);
  }
}

/**
 * Example: Query patterns for specific insights
 */
export async function queryPatternsExample(enrichedGraph: EnrichedSymbolGraph): Promise<void> {
  console.log('\n=== Pattern Query Examples ===\n');
  
  // 1. Find all hub nodes in the network topology
  console.log('1. Network Hubs:');
  const hubs = enrichedGraph.query()
    .wherePattern(PatternType.NETWORK_TOPOLOGY, { role: 'hub', minStrength: 0.7 })
    .get();
  
  for (const hub of hubs) {
    console.log(`  - ${hub.symbol.name}: ${hub.symbol.dependencies.length} dependencies`);
  }
  
  // 2. Find classes with golden ratio proportions
  console.log('\n2. Golden Ratio Classes:');
  const goldenClasses = enrichedGraph.query()
    .whereSymbol(s => s.type === 'class')
    .wherePattern(PatternType.GOLDEN_RATIO)
    .get();
  
  for (const gc of goldenClasses) {
    const goldenScore = gc.harmonicScores?.classical?.find(
      (s: any) => s.patternName === PatternType.GOLDEN_RATIO
    );
    console.log(`  - ${gc.symbol.name}: score ${goldenScore?.score.toFixed(3)}`);
  }
  
  // 3. Find functions with high Shannon entropy
  console.log('\n3. High Entropy Functions:');
  const highEntropyFuncs = enrichedGraph.query()
    .whereSymbol(s => s.type === 'function')
    .whereHarmonic(d => {
      const entropyScore = d.harmonicScores?.information?.find(
        (s: any) => s.patternName === PatternType.SHANNON_ENTROPY
      );
      return (entropyScore?.score || 0) > 0.7;
    })
    .get();
  
  for (const func of highEntropyFuncs) {
    console.log(`  - ${func.symbol.name}: high information complexity`);
  }
}

/**
 * Example: Architecture analysis using harmonic patterns
 */
export async function architectureAnalysisExample(enrichedGraph: EnrichedSymbolGraph): Promise<void> {
  console.log('\n=== Architecture Analysis Example ===\n');
  
  // Find architectural patterns
  const scaleFreeNodes = enrichedGraph.findSymbolsByPattern(
    PatternType.NETWORK_TOPOLOGY,
    0.6
  );
  
  if (scaleFreeNodes.length > 0) {
    console.log('Scale-free network detected!');
    console.log('Key architectural hubs:');
    
    const hubs = scaleFreeNodes
      .filter(n => n.participatesIn?.some(p => p.role === 'hub'))
      .sort((a, b) => b.symbol.dependencies.length - a.symbol.dependencies.length)
      .slice(0, 5);
    
    for (const hub of hubs) {
      console.log(`  - ${hub.symbol.name} (${hub.symbol.dependencies.length} dependencies)`);
    }
  }
  
  // Find modular boundaries using small-world detection
  const smallWorldNodes = enrichedGraph.findSymbolsByPattern(
    PatternType.SMALL_WORLD_NETWORKS,
    0.5
  );
  
  if (smallWorldNodes.length > 0) {
    console.log('\nSmall-world architecture detected!');
    console.log('Suggests good modular structure with efficient communication paths.');
  }
}

/**
 * Example: Code quality insights from harmonic patterns
 */
export async function codeQualityExample(enrichedGraph: EnrichedSymbolGraph): Promise<void> {
  console.log('\n=== Code Quality Insights ===\n');
  
  // 1. Find overly complex areas (high Kolmogorov complexity)
  const complexAreas = enrichedGraph.query()
    .whereHarmonic(d => {
      const kolmogorov = d.harmonicScores?.information?.find(
        (s: any) => s.patternName === PatternType.KOLMOGOROV_COMPLEXITY
      );
      return (kolmogorov?.score || 0) > 0.8;
    })
    .get();
  
  if (complexAreas.length > 0) {
    console.log(`Found ${complexAreas.length} highly complex areas that may need refactoring:`);
    for (const area of complexAreas.slice(0, 5)) {
      console.log(`  - ${area.symbol.name} in ${area.symbol.location.file}`);
    }
  }
  
  // 2. Find well-structured code (good fractal properties)
  const wellStructured = enrichedGraph.query()
    .wherePattern(PatternType.MANDELBROT_COMPLEXITY)
    .whereHarmonic(d => (d.overallHarmonicScore || 0) > 0.7)
    .get();
  
  if (wellStructured.length > 0) {
    console.log(`\nFound ${wellStructured.length} well-structured components with good fractal properties:`);
    for (const comp of wellStructured.slice(0, 5)) {
      console.log(`  - ${comp.symbol.name}: harmonic score ${comp.overallHarmonicScore?.toFixed(3)}`);
    }
  }
}

/**
 * Example: Selective analysis for performance
 */
export async function selectiveAnalysisExample(symbolGraph: SymbolGraph): Promise<void> {
  console.log('\n=== Selective Analysis Example ===\n');
  
  const enricher = new HarmonicEnricher();
  
  // Only analyze specific categories for performance
  console.log('Analyzing only Classical and Topological patterns...');
  const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph, {
    categories: [
      PatternCategory.CLASSICAL_HARMONY,
      PatternCategory.TOPOLOGICAL_PATTERNS
    ],
    parallel: true // Use parallel processing
  });
  
  const stats = enrichedGraph.getPatternStatistics();
  console.log('Analysis complete. Patterns found:');
  for (const [pattern, stat] of stats) {
    console.log(`  ${pattern}: ${stat.count} occurrences`);
  }
}

/**
 * Example: Export harmonic data for visualization
 */
export function exportForVisualization(enrichedGraph: EnrichedSymbolGraph): any {
  console.log('\n=== Export for Visualization ===\n');
  
  // Create a graph structure suitable for D3.js or other visualization libraries
  const nodes = enrichedGraph.getAllEnrichedSymbols().map(data => ({
    id: data.symbol.id,
    name: data.symbol.name,
    type: data.symbol.type,
    harmonicScore: data.overallHarmonicScore || 0,
    patterns: data.participatesIn?.map(p => p.patternType) || [],
    // Size based on dependencies
    size: Math.log(data.symbol.dependencies.length + 1) * 10 + 5,
    // Color based on harmonic score
    color: getColorForScore(data.overallHarmonicScore || 0)
  }));
  
  // Create edges from relationships
  const edges: any[] = [];
  for (const node of enrichedGraph.getAllEnrichedSymbols()) {
    for (const dep of node.symbol.dependencies) {
      edges.push({
        source: node.symbol.id,
        target: dep,
        type: 'dependency'
      });
    }
  }
  
  const graphData = { nodes, edges };
  console.log(`Exported ${nodes.length} nodes and ${edges.length} edges for visualization`);
  
  return graphData;
}

/**
 * Helper: Get color for harmonic score (for visualization)
 */
function getColorForScore(score: number): string {
  // Green (good) to Red (poor) gradient
  const hue = score * 120; // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Example: Pattern-based refactoring suggestions
 */
export async function refactoringSuggestionsExample(enrichedGraph: EnrichedSymbolGraph): Promise<void> {
  console.log('\n=== Refactoring Suggestions Based on Patterns ===\n');
  
  // 1. Identify anti-patterns
  const antiPatterns = enrichedGraph.query()
    .whereHarmonic(d => (d.overallHarmonicScore || 0) < 0.3)
    .whereSymbol(s => s.dependencies.length > 10)
    .get();
  
  if (antiPatterns.length > 0) {
    console.log('⚠️  Potential Anti-patterns Detected:');
    for (const ap of antiPatterns) {
      console.log(`\n  ${ap.symbol.name}:`);
      console.log(`    - Too many dependencies (${ap.symbol.dependencies.length})`);
      console.log(`    - Low harmonic score (${ap.overallHarmonicScore?.toFixed(3)})`);
      console.log('    - Suggestion: Consider breaking into smaller components');
    }
  }
  
  // 2. Find candidates for pattern application
  const patternCandidates = enrichedGraph.query()
    .whereSymbol(s => s.type === 'class')
    .whereSymbol(s => s.dependencies.length >= 3 && s.dependencies.length <= 5)
    .whereHarmonic(d => !d.participatesIn?.some(p => p.patternType === PatternType.GOLDEN_RATIO))
    .get();
  
  if (patternCandidates.length > 0) {
    console.log('\n✨ Classes that could benefit from Golden Ratio structuring:');
    for (const candidate of patternCandidates.slice(0, 3)) {
      const lines = candidate.symbol.location.endLine! - candidate.symbol.location.startLine;
      const suggestedPublic = Math.round(lines * 0.618);
      const suggestedPrivate = lines - suggestedPublic;
      
      console.log(`\n  ${candidate.symbol.name} (${lines} lines):`);
      console.log(`    - Suggested public interface: ~${suggestedPublic} lines`);
      console.log(`    - Suggested private implementation: ~${suggestedPrivate} lines`);
    }
  }
}

/**
 * Main example runner
 */
export async function runAllExamples(symbolGraph: SymbolGraph): Promise<void> {
  try {
    // Basic enrichment
    await basicEnrichmentExample(symbolGraph);
    
    // Create enriched graph for other examples
    const enricher = new HarmonicEnricher();
    const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph);
    
    // Run various analysis examples
    await queryPatternsExample(enrichedGraph);
    await architectureAnalysisExample(enrichedGraph);
    await codeQualityExample(enrichedGraph);
    await refactoringSuggestionsExample(enrichedGraph);
    
    // Selective analysis
    await selectiveAnalysisExample(symbolGraph);
    
    // Export for visualization
    const vizData = exportForVisualization(enrichedGraph);
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('Error running examples:', error);
  }
}