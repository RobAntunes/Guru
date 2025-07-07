#!/usr/bin/env tsx
/**
 * Test Script: Analyze Guru Codebase Using Its Own Intelligence Systems
 * This script demonstrates the power of our harmonic intelligence + quantum memory
 */

import { Guru } from './src/core/guru.js';
import { QuantumProbabilityFieldMemory } from './src/memory/quantum-memory-system.js';
import { HarmonicEnricher } from './src/harmonic-intelligence/core/harmonic-enricher.js';
import { PatternCategory, PatternType } from './src/memory/types.js';
import { MemoryQuery } from './src/memory/quantum-types.js';

async function analyzeGuruOnItself() {
  console.log('🚀 GURU ANALYZING ITSELF: Testing Our Intelligence Systems\n');
  console.log('=' .repeat(80));
  
  // Initialize Guru to analyze its own codebase
  const guru = new Guru();
  
  // Analyze the guru project itself
  const projectPath = process.cwd();
  console.log(`📁 Analyzing project: ${projectPath}\n`);
  
  try {
    // Step 1: Generate symbol graph 
    console.log('🔍 Step 1: Building Symbol Graph...');
    const symbolGraph = await guru.analyzeProject(projectPath);
    const symbols = symbolGraph.getAllSymbols();
    console.log(`   ✅ Found ${symbols.length} symbols across the codebase\n`);
    
    // Step 2: Apply harmonic intelligence
    console.log('🎵 Step 2: Applying Harmonic Intelligence...');
    const enricher = new HarmonicEnricher();
    const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph);
    console.log('   ✅ Harmonic analysis complete\n');
    
    // Step 3: Initialize Quantum Memory
    console.log('⚛️  Step 3: Initializing Quantum Memory...');
    const qpfm = new QuantumProbabilityFieldMemory();
    
    // Store patterns in quantum memory
    const allEnriched = enrichedGraph.getAllEnrichedSymbols();
    const patterns = allEnriched.slice(0, 20).map((enriched, i) => ({
      id: `guru-symbol-${i}`,
      coordinates: [0, 0, 0], // DPCM will calculate
      content: {
        title: enriched.symbol.name,
        description: `${enriched.symbol.type} in ${enriched.symbol.location.file}`,
        type: enriched.symbol.type,
        tags: [enriched.symbol.type, 'guru', 'analysis'],
        data: { location: enriched.symbol.location }
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: enriched.overallHarmonicScore || 0.5,
      harmonicProperties: {
        category: PatternCategory.ARCHITECTURAL,
        strength: enriched.overallHarmonicScore || 0.5,
        complexity: Math.random() * 0.5 + 0.2,
        confidence: enriched.overallHarmonicScore || 0.5,
        occurrences: 1
      },
      locations: [enriched.symbol.location],
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    }));
    
    await qpfm.bulkStore(patterns);
    console.log(`   ✅ Stored ${patterns.length} patterns in quantum memory\n`);
    
    // Step 4: Intelligent Analysis
    console.log('🧠 Step 4: Intelligent Analysis Results\n');
    console.log('-'.repeat(60));
    
    // Analyze architecture
    console.log('📊 ARCHITECTURAL ANALYSIS:');
    const stats = enrichedGraph.getPatternStatistics();
    console.log('   Detected Pattern Types:');
    let patternCount = 0;
    for (const [pattern, stat] of stats) {
      if (stat.count > 0) {
        console.log(`     • ${pattern}: ${stat.count} instances (avg: ${stat.avgScore.toFixed(3)})`);
        patternCount++;
      }
    }
    console.log(`   Total pattern types detected: ${patternCount}\n`);
    
    // Find architectural hubs using harmonic intelligence
    console.log('🌟 ARCHITECTURAL HUBS:');
    const hubs = enrichedGraph.query()
      .whereSymbol(s => s.type === 'class' || s.type === 'function')
      .whereHarmonic(d => (d.overallHarmonicScore || 0) > 0.4)
      .get()
      .sort((a, b) => (b.overallHarmonicScore || 0) - (a.overallHarmonicScore || 0))
      .slice(0, 5);
    
    if (hubs.length > 0) {
      for (const hub of hubs) {
        const deps = hub.symbol.dependencies.length;
        const dependents = hub.symbol.dependents.length;
        console.log(`   🎯 ${hub.symbol.name}`);
        console.log(`      File: ${hub.symbol.location.file.replace(projectPath, '')}`);
        console.log(`      Connections: ${deps} deps, ${dependents} dependents`);
        console.log(`      Harmonic Score: ${(hub.overallHarmonicScore || 0).toFixed(3)}`);
      }
    } else {
      console.log('   No high-scoring architectural hubs found in sample');
    }
    console.log();
    
    // Test quantum memory queries
    console.log('⚛️  QUANTUM MEMORY TESTS:');
    
    // Test 1: Precision query
    console.log('   Test 1: Precision Query for "class" patterns');
    const precisionQuery: MemoryQuery = {
      type: 'precision',
      harmonicSignature: {
        category: PatternCategory.ARCHITECTURAL,
        strength: 0.5,
        complexity: 0.3
      },
      confidence: 0.8,
      exploration: 0.2,
      maxResults: 3
    };
    const precisionResult = await qpfm.query(precisionQuery);
    
    console.log(`     • Found ${precisionResult.memories.length} memories`);
    console.log(`     • Coherence Level: ${precisionResult.coherenceLevel.toFixed(3)}`);
    console.log(`     • Interference Patterns: ${precisionResult.interferencePatterns.length}`);
    
    // Test 2: Discovery query
    console.log('   Test 2: Discovery Query for architectural patterns');
    const discoveryQuery: MemoryQuery = {
      type: 'discovery',
      confidence: 0.3,
      exploration: 0.8,
      maxResults: 5
    };
    const discoveryResult = await qpfm.query(discoveryQuery);
    
    console.log(`     • Found ${discoveryResult.memories.length} memories`);
    console.log(`     • Emergent Insights: ${discoveryResult.emergentInsights.length}`);
    console.log(`     • Field Radius: ${discoveryResult.fieldConfiguration.radius.toFixed(3)}`);
    
    // Test 3: Similarity search
    if (patterns.length > 1) {
      console.log('   Test 3: Similarity Search');
      const similar = await qpfm.findSimilar(patterns[0].id, {
        minSimilarity: 0.1,
        maxResults: 3
      });
      console.log(`     • Found ${similar.length} similar patterns`);
    }
    
    // Test 4: Emergent discovery
    console.log('   Test 4: Emergent Discovery (Dream Mode)');
    const insights = await qpfm.triggerEmergentDiscovery('dream');
    console.log(`     • Generated ${insights.length} emergent insights`);
    
    console.log();
    
    // Performance metrics
    console.log('📈 QUANTUM MEMORY PERFORMANCE:');
    const qpfmStats = qpfm.getStats();
    console.log(`   • Total Patterns Stored: ${qpfmStats.totalMemories}`);
    console.log(`   • Average Response Time: ${qpfmStats.context.performanceMetrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`   • Hit Rate: ${(qpfmStats.context.performanceMetrics.hitRate * 100).toFixed(1)}%`);
    console.log(`   • Emergence Frequency: ${(qpfmStats.context.performanceMetrics.emergenceFrequency * 100).toFixed(1)}%`);
    
    console.log();
    console.log('🎉 ANALYSIS COMPLETE!');
    console.log('=' .repeat(80));
    
    return {
      symbolCount: symbols.length,
      patternTypes: patternCount,
      quantumMemories: qpfmStats.totalMemories,
      averageHarmonicScore: allEnriched.reduce((sum, s) => sum + (s.overallHarmonicScore || 0), 0) / allEnriched.length,
      topArchitecturalHub: hubs[0]?.symbol.name || 'N/A',
      quantumPerformance: {
        avgResponseTime: qpfmStats.context.performanceMetrics.avgResponseTime,
        hitRate: qpfmStats.context.performanceMetrics.hitRate,
        emergenceFrequency: qpfmStats.context.performanceMetrics.emergenceFrequency
      }
    };
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    // Cleanup
    await guru.cleanup();
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeGuruOnItself()
    .then(results => {
      console.log('\n📋 SUMMARY REPORT:');
      console.log(`   Symbols Analyzed: ${results.symbolCount}`);
      console.log(`   Pattern Types Found: ${results.patternTypes}`);
      console.log(`   Quantum Memories: ${results.quantumMemories}`);
      console.log(`   Avg Harmonic Score: ${results.averageHarmonicScore.toFixed(3)}`);
      console.log(`   Top Hub: ${results.topArchitecturalHub}`);
      console.log(`   Quantum Hit Rate: ${(results.quantumPerformance.hitRate * 100).toFixed(1)}%`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { analyzeGuruOnItself };