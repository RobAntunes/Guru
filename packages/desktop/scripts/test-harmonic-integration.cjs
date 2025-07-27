#!/usr/bin/env node

// Test harmonic integration in the analysis pipeline

const path = require('path');

// Mock the harmonics calculation
function calculateHarmonics(files, structure) {
  const dirCount = structure.directories.size || 1;
  const avgFilesPerDir = files.length / Math.max(1, dirCount);
  const structuralResonance = Math.min(1.0, 1.0 - Math.abs(avgFilesPerDir - 7) / 20);
  
  const hasStandardStructure = structure.directories.has('src') || structure.directories.has('lib');
  const contentCoherence = hasStandardStructure ? 0.8 : 0.5;
  
  const fileTypes = Object.keys(structure.fileTypes || {});
  const typeCount = fileTypes.length;
  const patternHarmony = Math.max(0, 1.0 - (typeCount - 3) * 0.1);
  
  const overallBalance = (structuralResonance + contentCoherence + patternHarmony) / 3;
  
  return {
    structuralResonance,
    contentCoherence,
    patternHarmony,
    overallBalance
  };
}

// Test the harmonic prompt generation
function testHarmonicPrompt() {
  console.log('🎵 Testing Harmonic Prompt Generation\n');
  
  // Mock data
  const harmonics = {
    structuralResonance: 0.45,
    contentCoherence: 0.72,
    patternHarmony: 0.38,
    overallBalance: 0.52
  };
  
  const projectSummary = {
    fileCount: 156,
    directoryCount: 24,
    fileTypes: '.tsx: 45, .ts: 38, .js: 25',
    projectDomain: 'React TypeScript Web Application'
  };
  
  const structureAnalysis = {
    avgFilesPerDir: 6.5,
    hasTests: true,
    hasDocs: true,
    largeFiles: 2
  };
  
  // Generate the harmonic section
  let harmonicSection = '';
  if (harmonics && typeof harmonics.structuralResonance === 'number') {
    harmonicSection = `**HARMONIC ANALYSIS SCORES:**
- Structural Resonance: ${harmonics.structuralResonance.toFixed(2)} (${harmonics.structuralResonance >= 0.7 ? 'Good' : harmonics.structuralResonance >= 0.5 ? 'Fair' : 'Poor'} organization)
- Content Coherence: ${harmonics.contentCoherence.toFixed(2)} (${harmonics.contentCoherence >= 0.7 ? 'High' : harmonics.contentCoherence >= 0.5 ? 'Medium' : 'Low'} consistency)
- Pattern Harmony: ${harmonics.patternHarmony.toFixed(2)} (${harmonics.patternHarmony >= 0.7 ? 'Strong' : harmonics.patternHarmony >= 0.5 ? 'Moderate' : 'Weak'} patterns)
- Overall Balance: ${harmonics.overallBalance.toFixed(2)} (${harmonics.overallBalance >= 0.7 ? 'Balanced' : harmonics.overallBalance >= 0.5 ? 'Unbalanced' : 'Chaotic'})

`;
  }
  
  const analysisPrompt = `Analyze this project based on the following data:

${harmonicSection}**Project Statistics:**
- Total files: ${projectSummary.fileCount} across ${projectSummary.directoryCount} directories
- File types: ${projectSummary.fileTypes}
- Average files per directory: ${structureAnalysis.avgFilesPerDir.toFixed(1)}
- Has test files: ${structureAnalysis.hasTests}
- Has documentation: ${structureAnalysis.hasDocs}
- Large files (>500KB): ${structureAnalysis.largeFiles}

**Main Technologies:** ${projectSummary.projectDomain}${harmonics ? '\n\nUse the harmonic scores to guide your analysis. Low scores indicate areas needing improvement.' : ''}`;
  
  console.log('Generated Prompt:');
  console.log('=================');
  console.log(analysisPrompt);
  console.log('\n=================\n');
  
  // Check if harmonics are mentioned
  const mentionsHarmonics = analysisPrompt.includes('HARMONIC ANALYSIS SCORES');
  console.log('✅ Includes harmonic scores:', mentionsHarmonics);
  console.log('✅ Structural Resonance interpretation:', harmonics.structuralResonance < 0.5 ? 'Poor' : 'Fair/Good');
  console.log('✅ Overall project health:', harmonics.overallBalance < 0.6 ? 'Needs improvement' : 'Acceptable');
}

// Test harmonic calculation
function testHarmonicCalculation() {
  console.log('\n🎵 Testing Harmonic Calculation\n');
  
  const mockFiles = Array(156).fill({}).map((_, i) => ({
    name: `file${i}.tsx`,
    size: 1000 + i * 100
  }));
  
  const mockStructure = {
    directories: new Set(['src', 'components', 'services', 'hooks']),
    fileTypes: { '.tsx': 45, '.ts': 38, '.js': 25 }
  };
  
  const harmonics = calculateHarmonics(mockFiles, mockStructure);
  
  console.log('Calculated Harmonics:');
  console.log(JSON.stringify(harmonics, null, 2));
  console.log('\nInterpretation:');
  console.log(`- Files per directory: ${(mockFiles.length / mockStructure.directories.size).toFixed(1)} (optimal is ~7)`);
  console.log(`- Structural organization: ${harmonics.structuralResonance >= 0.7 ? 'Well organized' : 'Could be better organized'}`);
  console.log(`- Content consistency: ${harmonics.contentCoherence >= 0.7 ? 'High consistency' : 'Moderate consistency'}`);
  console.log(`- Pattern alignment: ${harmonics.patternHarmony >= 0.7 ? 'Good patterns' : 'Mixed patterns'}`);
}

// Run tests
testHarmonicPrompt();
testHarmonicCalculation();

console.log('\n✅ Harmonic integration test complete!');
