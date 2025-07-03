/**
 * Test Entry Point Detection Feature
 * 
 * This test demonstrates how the entry point detector identifies
 * application entry points with confidence scoring.
 */

import { SymbolGraphBuilder } from './dist/parsers/symbol-graph.js';
import path from 'path';

console.log('🎯 Testing Entry Point Detection...');

async function testEntryPointDetection() {
  try {
    const builder = new SymbolGraphBuilder();
    
    // Test on the current project
    const projectPath = process.cwd();
    console.log(`Analyzing project for entry points at: ${projectPath}`);
    
    const graph = await builder.build({
      path: projectPath,
      includeTests: true
    });
    
    console.log(`\\n📊 Analysis Results:`);
    console.log(`- Total symbols: ${graph.symbols.size}`);
    console.log(`- Total edges: ${graph.edges.length}`);
    console.log(`- Analyzed files: ${graph.metadata.analyzedFiles.length}`);
    console.log(`- Coverage: ${((graph.metadata.coverage || 0) * 100).toFixed(1)}%`);
    
    // Entry Point Analysis
    const entryPointAnalysis = graph.metadata.entryPoints;
    if (!entryPointAnalysis) {
      console.log('\\n❌ No entry point analysis found');
      return;
    }
    
    console.log(`\\n🎯 Entry Point Detection Results:`);
    console.log(`- Total entry points found: ${entryPointAnalysis.entryPoints.length}`);
    console.log(`- Primary entry point confidence: ${(entryPointAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`- Total candidates analyzed: ${entryPointAnalysis.analysisMetadata.totalCandidates}`);
    
    // Confidence distribution
    const meta = entryPointAnalysis.analysisMetadata;
    console.log(`\\n📈 Entry Point Confidence Distribution:`);
    console.log(`- High confidence (>80%): ${meta.highConfidenceCount}`);
    console.log(`- Medium confidence (60-80%): ${meta.mediumConfidenceCount}`);
    console.log(`- Low confidence (≤60%): ${meta.lowConfidenceCount}`);
    
    // Show primary entry point
    if (entryPointAnalysis.primaryEntryPoint) {
      const primary = entryPointAnalysis.primaryEntryPoint;
      console.log(`\\n🏆 Primary Entry Point:`);
      console.log(`    File: ${path.relative(projectPath, primary.file)}`);
      console.log(`    Type: ${primary.type}`);
      console.log(`    Confidence: ${(primary.confidence * 100).toFixed(1)}%`);
      console.log(`    Priority: ${primary.priority}`);
      console.log(`    Environment: ${primary.executionContext.environment}`);
      if (primary.executionContext.framework) {
        console.log(`    Framework: ${primary.executionContext.framework}`);
      }
      if (primary.executionContext.triggers.length > 0) {
        console.log(`    Triggers: ${primary.executionContext.triggers.join(', ')}`);
      }
      console.log(`    Evidence: ${primary.evidence.join(', ')}`);
    }
    
    // Show all entry points by category
    const entryPointsByType = new Map();
    entryPointAnalysis.entryPoints.forEach(ep => {
      if (!entryPointsByType.has(ep.type)) {
        entryPointsByType.set(ep.type, []);
      }
      entryPointsByType.get(ep.type).push(ep);
    });
    
    console.log(`\\n📁 Entry Points by Type:`);
    for (const [type, eps] of entryPointsByType) {
      console.log(`\\n  ${type.toUpperCase()} (${eps.length} found):`);
      eps.sort((a, b) => b.confidence - a.confidence).slice(0, 3).forEach(ep => {
        console.log(`    - ${path.relative(projectPath, ep.file)}`);
        console.log(`      Confidence: ${(ep.confidence * 100).toFixed(1)}%, Priority: ${ep.priority}`);
        console.log(`      Evidence: ${ep.evidence.slice(0, 2).join(', ')}`);
      });
    }
    
    // Show entry points by priority
    const priorityGroups = {
      primary: entryPointAnalysis.entryPoints.filter(ep => ep.priority === 'primary'),
      secondary: entryPointAnalysis.entryPoints.filter(ep => ep.priority === 'secondary'),
      tertiary: entryPointAnalysis.entryPoints.filter(ep => ep.priority === 'tertiary')
    };
    
    console.log(`\\n⭐ Entry Points by Priority:`);
    Object.entries(priorityGroups).forEach(([priority, eps]) => {
      if (eps.length > 0) {
        console.log(`\\n  ${priority.toUpperCase()} (${eps.length} found):`);
        eps.sort((a, b) => b.confidence - a.confidence).slice(0, 3).forEach(ep => {
          console.log(`    - ${path.relative(projectPath, ep.file)} (${ep.type})`);
          console.log(`      Confidence: ${(ep.confidence * 100).toFixed(1)}%`);
          console.log(`      Environment: ${ep.executionContext.environment}`);
        });
      }
    });
    
    // Show execution contexts
    const environments = new Map();
    entryPointAnalysis.entryPoints.forEach(ep => {
      const env = ep.executionContext.environment;
      if (!environments.has(env)) {
        environments.set(env, []);
      }
      environments.get(env).push(ep);
    });
    
    if (environments.size > 0) {
      console.log(`\\n🏃 Execution Environments:`);
      for (const [env, eps] of environments) {
        console.log(`    ${env}: ${eps.length} entry points`);
      }
    }
    
    // Show frameworks detected
    const frameworks = new Set();
    entryPointAnalysis.entryPoints.forEach(ep => {
      if (ep.executionContext.framework) {
        frameworks.add(ep.executionContext.framework);
      }
    });
    
    if (frameworks.size > 0) {
      console.log(`\\n🔧 Frameworks Detected:`);
      frameworks.forEach(framework => {
        console.log(`    - ${framework}`);
      });
    }
    
    // Show indicators summary
    const indicatorTypes = new Map();
    entryPointAnalysis.entryPoints.forEach(ep => {
      ep.indicators.forEach(indicator => {
        if (!indicatorTypes.has(indicator.type)) {
          indicatorTypes.set(indicator.type, 0);
        }
        indicatorTypes.set(indicator.type, indicatorTypes.get(indicator.type) + 1);
      });
    });
    
    if (indicatorTypes.size > 0) {
      console.log(`\\n🔍 Detection Indicators Used:`);
      Array.from(indicatorTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`    ${type}: ${count} matches`);
        });
    }
    
    // AI Agent recommendations
    console.log(`\\n🤖 AI Agent Recommendations:`);
    
    if (entryPointAnalysis.confidence > 0.8) {
      console.log(`    ✅ High confidence primary entry point identified`);
      console.log(`    ✅ Safe to use for automated execution tracing`);
    } else if (entryPointAnalysis.confidence > 0.6) {
      console.log(`    ⚠️  Medium confidence entry point - consider validation`);
      console.log(`    ⚠️  Recommend human review before automated execution`);
    } else {
      console.log(`    ❌ Low confidence entry point detection`);
      console.log(`    ❌ Manual entry point specification recommended`);
    }
    
    if (priorityGroups.primary.length === 0) {
      console.log(`    🔍 No primary entry points found - may need manual specification`);
    } else if (priorityGroups.primary.length > 1) {
      console.log(`    🔄 Multiple primary entry points - application may have multiple modes`);
    }
    
    console.log(`\\n✅ Entry Point Detection test completed successfully!`);
    
  } catch (error) {
    console.error('❌ Entry Point Detection test failed:', error);
    process.exit(1);
  }
}

testEntryPointDetection();
