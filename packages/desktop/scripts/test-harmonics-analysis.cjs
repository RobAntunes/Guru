#!/usr/bin/env node

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

async function testHarmonicsAnalysis() {
  console.log('🎵 Testing Harmonics-Enhanced Analysis...\n');
  
  try {
    const runner = new Phi4ModelRunner();
    await runner.initialize();
    
    // Create a project analysis with explicit harmonic scores
    const projectData = {
      systemPrompt: `You are an expert software architect with deep understanding of harmonic analysis. Analyze the provided project.

IMPORTANT: The Harmonic Analysis scores measure project balance:
- Structural Resonance: How well organized (1.0 = perfect)
- Content Coherence: Consistency of content (1.0 = highly coherent)
- Pattern Harmony: Alignment of patterns (1.0 = excellent)
- Overall Balance: Holistic harmony (1.0 = perfectly balanced)

Integrate these harmonic scores deeply into your analysis.`,
      
      analysisPrompt: `Analyze this project with harmonic awareness:

**HARMONIC ANALYSIS SCORES:**
- Structural Resonance: 0.45 (Poor organization - files scattered)
- Content Coherence: 0.72 (Good consistency)
- Pattern Harmony: 0.38 (Weak patterns - inconsistent coding styles)
- Overall Balance: 0.52 (Unbalanced project structure)

**Project Stats:**
- 156 files across 24 directories (6.5 files/dir average)
- Mixed TypeScript/JavaScript (no clear pattern)
- Tests exist but in random locations
- Large components (300+ lines) disrupting harmony

**Key Observations:**
- Low structural resonance due to poor file organization
- Pattern harmony disrupted by mixed coding styles
- Content coherence is the only strong harmonic aspect

Provide analysis that:
1. Explains what these harmonic scores reveal
2. Links low scores to specific problems
3. Suggests improvements to raise harmonic balance`,
      
      projectData: {
        summary: {
          totalFiles: 156,
          fileTypes: { '.tsx': 45, '.ts': 38, '.js': 25 },
          directoryCount: 24
        },
        harmonics: {
          structuralResonance: 0.45,
          contentCoherence: 0.72,
          patternHarmony: 0.38,
          overallBalance: 0.52
        }
      }
    };
    
    console.log('\n🚀 Starting harmonic analysis...');
    const result = await runner.analyzeProject(projectData);
    
    console.log('\n✅ Analysis complete!');
    console.log('\n📊 Harmonic Integration Check:');
    
    // Check if the response mentions harmonics
    const response = result.fullResponse || '';
    const mentionsHarmonics = response.toLowerCase().includes('harmonic') || 
                             response.toLowerCase().includes('resonance') ||
                             response.toLowerCase().includes('coherence');
    
    console.log('   Mentions harmonics:', mentionsHarmonics ? '✅ Yes' : '❌ No');
    console.log('   Response length:', response.length, 'characters');
    
    console.log('\n📄 Result summary:');
    console.log(JSON.stringify({
      detectedDomain: result.detectedDomain,
      domainConfidence: result.domainConfidence,
      insightCount: result.insights.length,
      recommendationCount: result.recommendations.length,
      mentionsHarmonics: mentionsHarmonics
    }, null, 2));
    
    if (result.fullResponse) {
      console.log('\n🎵 Full Harmonic Analysis:');
      console.log(result.fullResponse);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testHarmonicsAnalysis();
