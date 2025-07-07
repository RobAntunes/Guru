/**
 * Guru Integration Example - Shows how to integrate harmonic intelligence with Guru
 * @module harmonic-intelligence/examples
 */

import { SymbolGraph } from '../../types/index.js';
import { HarmonicEnricher } from '../core/harmonic-enricher.js';
import { PatternType, PatternCategory } from '../interfaces/harmonic-types.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GuruHarmonicIntegration');

/**
 * Example: Analyze a TypeScript project with harmonic intelligence
 */
export async function analyzeProjectHarmonics(
  projectPath: string,
  symbolGraph: SymbolGraph
): Promise<void> {
  logger.info(`Starting harmonic analysis for project: ${projectPath}`);
  
  // Create the harmonic enricher
  const enricher = new HarmonicEnricher();
  
  // Enrich the symbol graph with harmonic intelligence
  console.log('\n🎵 Enriching symbol graph with harmonic intelligence...\n');
  const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph);
  
  // 1. Architecture Overview
  console.log('=== 🏗️  Architecture Overview ===\n');
  
  const stats = enrichedGraph.getPatternStatistics();
  console.log('Detected Patterns:');
  for (const [pattern, stat] of stats) {
    if (stat.count > 0) {
      console.log(`  ${pattern}: ${stat.count} instances (avg score: ${stat.avgScore.toFixed(3)})`);
    }
  }
  
  // 2. Find architectural hubs
  console.log('\n=== 🌟 Key Architectural Hubs ===\n');
  
  const hubs = enrichedGraph.query()
    .wherePattern(PatternType.NETWORK_TOPOLOGY, { role: 'hub', minStrength: 0.6 })
    .whereSymbol(s => s.type === 'class' || s.type === 'interface')
    .get()
    .sort((a, b) => b.symbol.dependencies.length - a.symbol.dependencies.length)
    .slice(0, 5);
  
  if (hubs.length > 0) {
    console.log('Top architectural hubs (classes/interfaces with many connections):');
    for (const hub of hubs) {
      const deps = hub.symbol.dependencies.length;
      const dependents = hub.symbol.dependents.length;
      console.log(`  📍 ${hub.symbol.name}`);
      console.log(`     - Location: ${hub.symbol.location.file}:${hub.symbol.location.startLine}`);
      console.log(`     - Connections: ${deps} dependencies, ${dependents} dependents`);
      console.log(`     - Harmonic Score: ${hub.overallHarmonicScore?.toFixed(3)}`);
    }
  }
  
  // 3. Code Quality Insights
  console.log('\n=== 🔍 Code Quality Insights ===\n');
  
  // Find complex areas (high Kolmogorov complexity)
  const complexAreas = enrichedGraph.query()
    .whereHarmonic(d => {
      const kolmogorov = d.harmonicScores?.information?.find(
        (s: any) => s.patternName === PatternType.KOLMOGOROV_COMPLEXITY
      );
      return (kolmogorov?.score || 0) > 0.7;
    })
    .get()
    .slice(0, 3);
  
  if (complexAreas.length > 0) {
    console.log('⚠️  High Complexity Areas (consider refactoring):');
    for (const area of complexAreas) {
      console.log(`  - ${area.symbol.name} in ${area.symbol.location.file}`);
      const complexity = area.harmonicScores?.information?.find(
        (s: any) => s.patternName === PatternType.KOLMOGOROV_COMPLEXITY
      );
      console.log(`    Complexity Score: ${complexity?.score.toFixed(3)}`);
    }
  }
  
  // Find well-structured code
  const wellStructured = enrichedGraph.query()
    .wherePattern(PatternType.GOLDEN_RATIO)
    .whereHarmonic(d => (d.overallHarmonicScore || 0) > 0.6)
    .get()
    .slice(0, 3);
  
  if (wellStructured.length > 0) {
    console.log('\n✨ Well-Structured Components:');
    for (const comp of wellStructured) {
      console.log(`  - ${comp.symbol.name}: harmonic score ${comp.overallHarmonicScore?.toFixed(3)}`);
      const goldenRatio = comp.harmonicScores?.classical?.find(
        (s: any) => s.patternName === PatternType.GOLDEN_RATIO
      );
      if (goldenRatio?.detected) {
        console.log('    Exhibits golden ratio proportions');
      }
    }
  }
  
  // 4. Pattern-Based Architecture Analysis
  console.log('\n=== 🔬 Pattern-Based Architecture Analysis ===\n');
  
  // Check for fractal/self-similar architecture
  const fractalNodes = enrichedGraph.findSymbolsByPattern(PatternType.MANDELBROT_COMPLEXITY, 0.5);
  if (fractalNodes.length > 0) {
    console.log(`🌿 Fractal Architecture Detected! (${fractalNodes.length} components)`);
    console.log('   Your codebase exhibits self-similar patterns at different scales.');
    console.log('   This suggests good modular design with consistent patterns.\n');
  }
  
  // Check for small-world network properties
  const smallWorldNodes = enrichedGraph.findSymbolsByPattern(PatternType.SMALL_WORLD_NETWORKS, 0.5);
  if (smallWorldNodes.length > 0) {
    console.log(`🌐 Small-World Network Properties Detected!`);
    console.log('   Your code has good locality with short paths between components.');
    console.log('   This indicates efficient modular boundaries.\n');
  }
  
  // 5. Harmonic Recommendations
  console.log('=== 💡 Harmonic Recommendations ===\n');
  
  // Find imbalanced components
  const imbalanced = enrichedGraph.query()
    .whereSymbol(s => s.type === 'class')
    .whereHarmonic(d => (d.overallHarmonicScore || 0) < 0.3)
    .whereSymbol(s => s.dependencies.length > 5)
    .get();
  
  if (imbalanced.length > 0) {
    console.log('🔧 Components that could benefit from harmonic refactoring:');
    for (const comp of imbalanced.slice(0, 3)) {
      console.log(`\n  ${comp.symbol.name}:`);
      console.log(`    Current: ${comp.symbol.dependencies.length} dependencies`);
      console.log(`    Harmonic score: ${comp.overallHarmonicScore?.toFixed(3)}`);
      
      // Suggest golden ratio structure
      const totalLines = (comp.symbol.location.endLine || comp.symbol.location.startLine) - comp.symbol.location.startLine;
      const suggestedPublic = Math.round(totalLines * 0.618);
      const suggestedPrivate = totalLines - suggestedPublic;
      
      console.log(`    Suggestion: Consider restructuring with golden ratio proportions`);
      console.log(`    - Public interface: ~${suggestedPublic} lines`);
      console.log(`    - Private implementation: ~${suggestedPrivate} lines`);
    }
  }
  
  // 6. Export visualization data
  console.log('\n=== 📊 Visualization Export ===\n');
  
  const vizData = exportVisualizationData(enrichedGraph);
  console.log(`Exported ${vizData.nodes.length} nodes and ${vizData.edges.length} edges`);
  console.log('Data structure ready for D3.js or other visualization tools');
  
  // Summary
  console.log('\n=== 📈 Analysis Summary ===\n');
  const allSymbols = enrichedGraph.getAllEnrichedSymbols();
  const avgScore = allSymbols.reduce((sum, s) => sum + (s.overallHarmonicScore || 0), 0) / allSymbols.length;
  
  console.log(`Total symbols analyzed: ${allSymbols.length}`);
  console.log(`Average harmonic score: ${avgScore.toFixed(3)}`);
  console.log(`Unique patterns detected: ${stats.size}`);
  
  // Pattern distribution
  const patternCounts = new Map<string, number>();
  for (const symbol of allSymbols) {
    for (const participation of symbol.participatesIn || []) {
      const count = patternCounts.get(participation.patternType) || 0;
      patternCounts.set(participation.patternType, count + 1);
    }
  }
  
  console.log('\nPattern participation distribution:');
  for (const [pattern, count] of patternCounts) {
    const percentage = (count / allSymbols.length * 100).toFixed(1);
    console.log(`  ${pattern}: ${count} symbols (${percentage}%)`);
  }
}

/**
 * Export data for visualization
 */
function exportVisualizationData(enrichedGraph: any): any {
  const nodes = enrichedGraph.getAllEnrichedSymbols().map((data: any) => ({
    id: data.symbol.id,
    name: data.symbol.name,
    type: data.symbol.type,
    harmonicScore: data.overallHarmonicScore || 0,
    patterns: data.participatesIn?.map((p: any) => p.patternType) || [],
    size: Math.log(data.symbol.dependencies.length + 1) * 10 + 5,
    color: getColorForScore(data.overallHarmonicScore || 0),
    file: data.symbol.location.file,
    line: data.symbol.location.startLine
  }));
  
  const edges: any[] = [];
  for (const node of enrichedGraph.getAllEnrichedSymbols()) {
    for (const dep of node.symbol.dependencies) {
      edges.push({
        source: node.symbol.id,
        target: dep,
        type: 'dependency',
        weight: node.overallHarmonicScore || 0.5
      });
    }
  }
  
  return { nodes, edges };
}

/**
 * Get color based on harmonic score
 */
function getColorForScore(score: number): string {
  const hue = score * 120; // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Selective analysis example for large codebases
 */
export async function performSelectiveAnalysis(
  symbolGraph: SymbolGraph,
  targetPatterns: PatternCategory[]
): Promise<void> {
  console.log('\n🎯 Performing Selective Harmonic Analysis...\n');
  
  const enricher = new HarmonicEnricher();
  
  // Only analyze specific pattern categories
  const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph, {
    categories: targetPatterns,
    parallel: true
  });
  
  console.log(`Analyzed ${targetPatterns.length} pattern categories:`);
  targetPatterns.forEach(cat => console.log(`  - ${cat}`));
  
  const stats = enrichedGraph.getPatternStatistics();
  console.log('\nDetected patterns:');
  for (const [pattern, stat] of stats) {
    console.log(`  ${pattern}: ${stat.count} occurrences`);
  }
}

/**
 * Real-time analysis example (for development tools)
 */
export async function analyzeFileChange(
  symbolGraph: SymbolGraph,
  changedFileId: string
): Promise<void> {
  console.log(`\n🔄 Analyzing harmonic impact of changes to: ${changedFileId}\n`);
  
  const enricher = new HarmonicEnricher();
  
  // Quick analysis focusing on key patterns
  const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph, {
    categories: [
      PatternCategory.CLASSICAL_HARMONY,
      PatternCategory.TOPOLOGICAL_PATTERNS
    ],
    parallel: true
  });
  
  // Find the changed symbol
  const changedSymbol = enrichedGraph.getEnrichedSymbol(changedFileId);
  if (!changedSymbol) {
    console.log('Symbol not found in graph');
    return;
  }
  
  console.log(`Symbol: ${changedSymbol.symbol.name}`);
  console.log(`Harmonic Score: ${changedSymbol.overallHarmonicScore?.toFixed(3)}`);
  
  // Check if it's a hub
  const isHub = changedSymbol.participatesIn?.some(
    p => p.patternType === PatternType.NETWORK_TOPOLOGY && p.role === 'hub'
  );
  
  if (isHub) {
    console.log('⚠️  This is an architectural hub! Changes may have wide impact.');
    console.log(`   Connected to ${changedSymbol.symbol.dependencies.length} dependencies`);
    console.log(`   Used by ${changedSymbol.symbol.dependents.length} dependents`);
  }
  
  // Find affected components
  const affected = enrichedGraph.query()
    .whereSymbol(s => 
      s.dependencies.includes(changedFileId) || 
      s.dependents.includes(changedFileId)
    )
    .get();
  
  console.log(`\n📊 Impact Analysis:`);
  console.log(`   ${affected.length} components potentially affected`);
  
  // Group by harmonic score
  const highHarmonic = affected.filter(a => (a.overallHarmonicScore || 0) > 0.7);
  const lowHarmonic = affected.filter(a => (a.overallHarmonicScore || 0) < 0.3);
  
  if (highHarmonic.length > 0) {
    console.log(`   ✅ ${highHarmonic.length} well-structured components affected`);
  }
  
  if (lowHarmonic.length > 0) {
    console.log(`   ⚠️  ${lowHarmonic.length} complex components affected (higher risk)`);
    console.log('      Consider extra testing for:');
    lowHarmonic.slice(0, 3).forEach(comp => {
      console.log(`      - ${comp.symbol.name}`);
    });
  }
}