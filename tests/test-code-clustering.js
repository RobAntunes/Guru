/**
 * Test Code Clustering Feature
 * 
 * This test demonstrates how the code clusterer groups related symbols
 * into semantic zones with confidence scoring.
 */

import { SymbolGraphBuilder } from '../src/parsers/symbol-graph.js';
import path from 'path';

console.log('🧩 Testing Code Clustering...');

async function testCodeClustering() {
  try {
    const builder = new SymbolGraphBuilder();
    
    // Test on the current project
    const projectPath = process.cwd();
    console.log(`Analyzing project for clusters at: ${projectPath}`);
    
    const graph = await builder.build({
      path: projectPath,
      includeTests: true
    });
    
    console.log(`\\n📊 Analysis Results:`);
    console.log(`- Total symbols: ${graph.symbols.size}`);
    console.log(`- Total edges: ${graph.edges.length}`);
    console.log(`- Analyzed files: ${graph.metadata.analyzedFiles.length}`);
    console.log(`- Coverage: ${((graph.metadata.coverage || 0) * 100).toFixed(1)}%`);
    
    // Clustering Analysis
    const clusteringAnalysis = graph.metadata.clustering;
    if (!clusteringAnalysis) {
      console.log('\\n❌ No clustering analysis found');
      return;
    }
    
    console.log(`\\n🧩 Code Clustering Results:`);
    console.log(`- Total clusters found: ${clusteringAnalysis.clusters.length}`);
    console.log(`- Clustered symbols: ${clusteringAnalysis.metadata.clusteredSymbols}`);
    console.log(`- Clustering ratio: ${(clusteringAnalysis.metadata.clusteringRatio * 100).toFixed(1)}%`);
    console.log(`- Unclustered symbols: ${clusteringAnalysis.unclusteredSymbols.length}`);
    console.log(`- Average cluster size: ${clusteringAnalysis.metadata.averageClusterSize.toFixed(1)}`);
    console.log(`- Processing time: ${clusteringAnalysis.metadata.processingTime}ms`);
    
    // Quality metrics
    const quality = clusteringAnalysis.metadata.qualityMetrics;
    console.log(`\\n📈 Clustering Quality Metrics:`);
    console.log(`- Silhouette score: ${quality.silhouetteScore.toFixed(2)}`);
    console.log(`- Modularity score: ${quality.modularityScore.toFixed(2)}`);
    console.log(`- Cohesion score: ${quality.cohesionScore.toFixed(2)}`);
    console.log(`- Separation score: ${quality.separationScore.toFixed(2)}`);
    
    // Cluster size distribution
    const sizeDistribution = clusteringAnalysis.metadata.clusterSizeDistribution;
    console.log(`\\n📏 Cluster Size Distribution:`);
    Object.entries(sizeDistribution).forEach(([size, count]) => {
      console.log(`    ${size}: ${count} clusters`);
    });
    
    // Show top clusters
    if (clusteringAnalysis.clusters.length > 0) {
      console.log(`\\n🏆 Top Clusters by Confidence:`);
      
      const sortedClusters = clusteringAnalysis.clusters
        .sort((a, b) => b.confidence.overall - a.confidence.overall)
        .slice(0, 5);
      
      sortedClusters.forEach(cluster => {
        console.log(`\\n  📦 ${cluster.name} (${cluster.id})`);
        console.log(`    Purpose: ${cluster.purpose}`);
        console.log(`    Size: ${cluster.metrics.size} symbols`);
        console.log(`    Confidence: ${(cluster.confidence.overall * 100).toFixed(1)}%`);
        console.log(`    Semantic zone: ${cluster.semanticZone.type} (${cluster.semanticZone.domain})`);
        console.log(`    Cohesion: ${cluster.metrics.cohesion.toFixed(2)}`);
        console.log(`    Coupling: ${cluster.metrics.coupling.toFixed(2)}`);
        console.log(`    Evidence: ${cluster.confidence.evidence.slice(0, 2).join(', ')}`);
        
        if (cluster.confidence.limitations.length > 0) {
          console.log(`    Limitations: ${cluster.confidence.limitations.join(', ')}`);
        }
      });
    }
    
    // Semantic zone analysis
    const semanticZones = new Map();
    clusteringAnalysis.clusters.forEach(cluster => {
      const zone = cluster.semanticZone.type;
      if (!semanticZones.has(zone)) {
        semanticZones.set(zone, []);
      }
      semanticZones.get(zone).push(cluster);
    });
    
    if (semanticZones.size > 0) {
      console.log(`\\n🎯 Semantic Zones Detected:`);
      for (const [zoneType, clusters] of semanticZones) {
        console.log(`\\n  ${zoneType.toUpperCase()} (${clusters.length} clusters):`);
        clusters.slice(0, 3).forEach(cluster => {
          console.log(`    - ${cluster.name}: ${cluster.metrics.size} symbols`);
          console.log(`      Domain: ${cluster.semanticZone.domain}`);
          console.log(`      Layer: ${cluster.semanticZone.layer}`);
          if (cluster.semanticZone.patterns.length > 0) {
            console.log(`      Patterns: ${cluster.semanticZone.patterns.join(', ')}`);
          }
        });
      }
    }
    
    // Architectural insights
    const architecture = clusteringAnalysis.architecture;
    console.log(`\\n🏛️ Architectural Insights:`);
    console.log(`- Layer separation: ${(architecture.layerSeparation * 100).toFixed(1)}%`);
    console.log(`- Domain cohesion: ${(architecture.domainCohesion * 100).toFixed(1)}%`);
    console.log(`- Pattern consistency: ${(architecture.patternConsistency * 100).toFixed(1)}%`);
    console.log(`- Coupling health: ${(architecture.couplingHealth * 100).toFixed(1)}%`);
    console.log(`- Modularity score: ${(architecture.modularityScore * 100).toFixed(1)}%`);
    
    // AI Agent recommendations
    console.log(`\\n🤖 AI Agent Insights:`);
    
    const avgConfidence = clusteringAnalysis.clusters.reduce((sum, c) => sum + c.confidence.overall, 0) / clusteringAnalysis.clusters.length;
    
    if (avgConfidence > 0.8) {
      console.log(`    ✅ High confidence clustering (${(avgConfidence * 100).toFixed(1)}%)`);
      console.log(`    ✅ Code organization is clear and well-structured`);
      console.log(`    ✅ Safe for automated refactoring within clusters`);
    } else if (avgConfidence > 0.6) {
      console.log(`    ⚠️  Medium confidence clustering (${(avgConfidence * 100).toFixed(1)}%)`);
      console.log(`    ⚠️  Some code organization patterns detected`);
      console.log(`    ⚠️  Recommend validation before automated changes`);
    } else {
      console.log(`    ❌ Low confidence clustering (${(avgConfidence * 100).toFixed(1)}%)`);
      console.log(`    ❌ Code organization is unclear or scattered`);
      console.log(`    ❌ Manual review recommended for structural changes`);
    }
    
    if (clusteringAnalysis.metadata.clusteringRatio < 0.7) {
      console.log(`    🔍 ${(clusteringAnalysis.unclusteredSymbols.length)} symbols remain unclustered`);
      console.log(`    🔍 Consider refactoring to improve code organization`);
    }
    
    if (architecture.couplingHealth < 0.6) {
      console.log(`    ⚠️  High coupling detected between clusters`);
      console.log(`    💡 Consider dependency injection or interface extraction`);
    }
    
    console.log(`\\n✅ Code Clustering test completed successfully!`);
    
  } catch (error) {
    console.error('❌ Code Clustering test failed:', error);
    process.exit(1);
  }
}

testCodeClustering();
