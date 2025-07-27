#!/usr/bin/env node

const { ProperHarmonicToSILC } = require('./harmonic-to-silc-proper.cjs');

/**
 * Test the proper harmonic to SILC translation with realistic harmonic engine output
 */
async function testProperHarmonicSILC() {
  console.log('🎯 Testing Proper Harmonic to SILC Translation...\n');
  console.log('This test uses realistic output from the TypeScript Harmonic Intelligence Engine\n');
  
  const translator = new ProperHarmonicToSILC();
  
  // Test Case 1: Healthy, well-architected codebase
  const healthyCodebase = {
    metadata: {
      analysisTimestamp: Date.now(),
      analysisVersion: '1.0.0',
      sourceFileCount: 156,
      totalLinesOfCode: 28450,
      analysisMode: 'comprehensive'
    },
    
    harmonicScore: {
      overall: 0.82,
      breakdown: {
        topological: 0.85,
        fractal: 0.78,
        informational: 0.81,
        geometric: 0.88,
        spectral: 0.79
      },
      confidence: 0.92
    },
    
    patterns: {
      topological: {
        density: 0.42,  // Good density - not too sparse, not too dense
        betweennessCentrality: 35.2,  // Moderate centrality
        clusteringCoefficient: 0.68,  // Good clustering
        smallWorldIndex: 0.95,  // Close to optimal 1.0
        averagePathLength: 3.8,
        symmetry: {
          rotationalSymmetry: 0.72,
          reflectionSymmetry: 0.65,
          confidence: 0.78
        }
      },
      
      fractal: {
        fractalDimension: 1.45,  // Healthy complexity
        selfSimilarityIndex: 0.76,
        recursionDepth: 4,
        recursionComplexity: 0.62,
        growthPattern: {
          averageBranchingFactor: 2.8,
          fibonacciSimilarity: 0.73,
          goldenRatioPresence: 0.81,
          growthType: 'logarithmic'
        }
      },
      
      informational: {
        nodeTypeEntropy: 4.2,
        patternEntropy: 3.8,
        structuralEntropy: 3.5,
        totalEntropy: 11.5,
        kolmogorovComplexity: 245,
        compressionRatio: 0.52,
        redundancyRatio: 0.28,
        effectiveComplexity: 0.68
      },
      
      geometric: {
        goldenRatio: {
          overallPhiSimilarity: 0.78,
          modulePhiSimilarity: 0.82,
          functionPhiSimilarity: 0.71,
          classPhiSimilarity: 0.81,
          phiRatioCount: 23
        },
        platonicStructures: {
          tetrahedralCount: 3,
          cubicCount: 1,
          eulerFormulaValid: true,
          platonicSimilarity: 0.72,
          structuralPerfection: 0.85
        }
      },
      
      spectral: {
        dominantFrequencies: [8.5, 12.3, 16.7],
        harmonicContent: 0.74,
        spectralCentroid: 10.2,
        harmonicToNoiseRatio: 6.8,
        standingWaves: {
          wavelength: 24.5,
          frequency: 0.041,
          nodeCount: 8,
          antinodeCount: 7,
          standingWaveQuality: 0.82,
          resonanceStrength: 0.71
        }
      }
    },
    
    guidance: {
      safeModificationZones: [
        { path: 'src/utils/*', confidence: 0.92 },
        { path: 'src/components/shared/*', confidence: 0.88 }
      ],
      refactoringOpportunities: [
        { pattern: 'duplicate-logic', count: 3, impact: 'medium' },
        { pattern: 'deep-nesting', count: 5, impact: 'low' }
      ],
      qualityImprovements: [
        { type: 'add-tests', priority: 'high', modules: 12 },
        { type: 'extract-interface', priority: 'medium', classes: 8 }
      ]
    },
    
    compressedProfile: {
      harmonicCoordinates: [0.82, 0.75, 0.88],
      structuralSignature: 'a7f3b2e9...',
      patternFingerprint: 'phi-dominant-fractal-balanced'
    }
  };
  
  // Test Case 2: Problematic, poorly architected codebase
  const problematicCodebase = {
    metadata: {
      analysisTimestamp: Date.now(),
      analysisVersion: '1.0.0',
      sourceFileCount: 89,
      totalLinesOfCode: 45320,
      analysisMode: 'comprehensive'
    },
    
    harmonicScore: {
      overall: 0.38,
      breakdown: {
        topological: 0.25,  // Poor structure
        fractal: 0.42,
        informational: 0.31,
        geometric: 0.45,
        spectral: 0.47
      },
      confidence: 0.88
    },
    
    patterns: {
      topological: {
        density: 0.85,  // Too dense - spaghetti code
        betweennessCentrality: 125.7,  // Very high - too many critical paths
        clusteringCoefficient: 0.12,  // Poor clustering
        smallWorldIndex: 2.3,  // Far from optimal
        averagePathLength: 8.9,  // Too long
        symmetry: {
          rotationalSymmetry: 0.18,
          reflectionSymmetry: 0.22,
          confidence: 0.35
        }
      },
      
      fractal: {
        fractalDimension: 2.3,  // Too complex
        selfSimilarityIndex: 0.28,  // Poor self-similarity
        recursionDepth: 12,  // Too deep
        recursionComplexity: 0.89,  // Too complex
        growthPattern: {
          averageBranchingFactor: 7.2,  // Too high
          fibonacciSimilarity: 0.15,
          goldenRatioPresence: 0.22,
          growthType: 'exponential'  // Dangerous growth
        }
      },
      
      informational: {
        nodeTypeEntropy: 8.9,  // Too high - chaotic
        patternEntropy: 7.2,
        structuralEntropy: 9.1,
        totalEntropy: 25.2,  // Very high
        kolmogorovComplexity: 892,  // Too complex
        compressionRatio: 0.15,  // Too much redundancy
        redundancyRatio: 0.78,  // Way too redundant
        effectiveComplexity: 0.22  // Poor structure
      },
      
      geometric: {
        goldenRatio: {
          overallPhiSimilarity: 0.18,
          modulePhiSimilarity: 0.15,
          functionPhiSimilarity: 0.22,
          classPhiSimilarity: 0.19,
          phiRatioCount: 2
        },
        platonicStructures: {
          tetrahedralCount: 0,
          cubicCount: 0,
          eulerFormulaValid: false,  // Structural issues
          platonicSimilarity: 0.08,
          structuralPerfection: 0.15
        }
      },
      
      spectral: {
        dominantFrequencies: [42.1, 85.3, 127.8],  // Chaotic frequencies
        harmonicContent: 0.22,  // Poor harmony
        spectralCentroid: 78.5,  // Too high
        harmonicToNoiseRatio: 1.2,  // Very noisy
        standingWaves: {
          wavelength: 3.2,  // Too short
          frequency: 0.31,  // Too high
          nodeCount: 45,  // Too many
          antinodeCount: 44,
          standingWaveQuality: 0.18,  // Poor quality
          resonanceStrength: 0.12  // Weak resonance
        }
      }
    },
    
    guidance: {
      safeModificationZones: [],  // No safe zones!
      refactoringOpportunities: [
        { pattern: 'god-class', count: 8, impact: 'critical' },
        { pattern: 'circular-dependency', count: 15, impact: 'critical' },
        { pattern: 'duplicate-logic', count: 47, impact: 'high' },
        { pattern: 'deep-nesting', count: 89, impact: 'high' }
      ],
      qualityImprovements: [
        { type: 'break-circular-deps', priority: 'critical', modules: 15 },
        { type: 'extract-modules', priority: 'critical', classes: 23 },
        { type: 'reduce-complexity', priority: 'critical', functions: 156 }
      ]
    },
    
    compressedProfile: {
      harmonicCoordinates: [0.38, 0.25, 0.31],
      structuralSignature: 'f2a9c7b1...',
      patternFingerprint: 'chaotic-dense-unstructured'
    }
  };
  
  // Run tests
  console.log('================================================================================');
  console.log('Test Case 1: Healthy, Well-Architected Codebase');
  console.log('================================================================================\n');
  
  testHarmonicResult(translator, healthyCodebase);
  
  console.log('\n================================================================================');
  console.log('Test Case 2: Problematic, Poorly Architected Codebase');
  console.log('================================================================================\n');
  
  testHarmonicResult(translator, problematicCodebase);
  
  // Test edge cases
  console.log('\n================================================================================');
  console.log('Test Case 3: Edge Cases - Missing Data');
  console.log('================================================================================\n');
  
  testEdgeCases(translator);
}

function testHarmonicResult(translator, harmonicResult) {
  // Convert to SILC
  const silcData = translator.harmonicResultToSILC(harmonicResult);
  
  console.log(`📊 Harmonic Analysis Summary:`);
  console.log(`  - Overall Score: ${(harmonicResult.harmonicScore.overall * 100).toFixed(0)}%`);
  console.log(`  - Confidence: ${(harmonicResult.harmonicScore.confidence * 100).toFixed(0)}%`);
  console.log(`  - Files Analyzed: ${harmonicResult.metadata.sourceFileCount}`);
  console.log(`  - Lines of Code: ${harmonicResult.metadata.totalLinesOfCode}`);
  
  console.log(`\n📡 SILC Translation Results:`);
  console.log(`  - Total Signals Generated: ${silcData.signals.length}`);
  console.log(`  - Analysis Mode: ${silcData.metadata.analysisMode}`);
  
  // Analyze signal distribution
  const signalsByCategory = {
    topology: 0,
    fractal: 0,
    info: 0,
    geometric: 0,
    spectral: 0,
    master: 0
  };
  
  const urgencyDistribution = {};
  
  silcData.signals.forEach(signal => {
    // Count by category
    if (signal.type.startsWith('topology_')) signalsByCategory.topology++;
    else if (signal.type.startsWith('fractal_')) signalsByCategory.fractal++;
    else if (signal.type.startsWith('info_')) signalsByCategory.info++;
    else if (signal.type.startsWith('geometric_')) signalsByCategory.geometric++;
    else if (signal.type.startsWith('spectral_')) signalsByCategory.spectral++;
    else if (signal.type === 'master_harmonic') signalsByCategory.master++;
    
    // Count urgency
    const urgency = signal.interpretation.urgency;
    urgencyDistribution[urgency] = (urgencyDistribution[urgency] || 0) + 1;
  });
  
  console.log(`\n📊 Signal Distribution by Category:`);
  Object.entries(signalsByCategory).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`  - ${category}: ${count} signals`);
    }
  });
  
  console.log(`\n🚨 Urgency Distribution:`);
  const urgencyOrder = ['critical', 'urgent', 'important', 'moderate', 'stable', 'excellent', 'perfect'];
  urgencyOrder.forEach(urgency => {
    if (urgencyDistribution[urgency]) {
      console.log(`  - ${urgency}: ${urgencyDistribution[urgency]} signals`);
    }
  });
  
  // Show master signal details
  const masterSignal = silcData.signals.find(s => s.type === 'master_harmonic');
  if (masterSignal) {
    console.log(`\n🎛️ Master Harmonic Signal:`);
    console.log(`  - Amplitude: ${masterSignal.signal.amplitude} (${(parseFloat(masterSignal.signal.amplitude) * 100).toFixed(0)}% health)`);
    console.log(`  - Frequency: Band ${masterSignal.signal.frequency} (${masterSignal.interpretation.urgency})`);
    console.log(`  - Phase: ${masterSignal.signal.phase === '0.000' ? 'Aligned (0)' : 'Misaligned (π)'}`);
    console.log(`  - Noise: ${masterSignal.signal.noise} (${(parseFloat(masterSignal.signal.noise) * 100).toFixed(0)}% uncertainty)`);
    console.log(`  - Status: ${masterSignal.interpretation.status}`);
  }
  
  // Show a few example signals
  console.log(`\n📍 Sample Individual Signals:`);
  const sampleSignals = silcData.signals.filter(s => s.type !== 'master_harmonic').slice(0, 5);
  sampleSignals.forEach(signal => {
    console.log(`\n  ${signal.type}:`);
    console.log(`    - Value: ${signal.interpretation.value.toFixed(3)}`);
    console.log(`    - Urgency: ${signal.interpretation.urgency}`);
    console.log(`    - Status: ${signal.interpretation.status}`);
    console.log(`    - Description: ${signal.interpretation.description}`);
  });
  
  // Test prompt generation
  console.log(`\n📝 SILC Prompt Generation Test:`);
  const prompt = translator.generateSILCPrompt(silcData, harmonicResult);
  console.log(`  - Prompt length: ${prompt.length} characters`);
  console.log(`  - First 200 chars: ${prompt.substring(0, 200)}...`);
  
  // Validate signal properties
  console.log(`\n✅ Signal Validation:`);
  let validSignals = 0;
  let invalidSignals = [];
  
  silcData.signals.forEach(signal => {
    const amplitude = parseFloat(signal.signal.amplitude);
    const frequency = signal.signal.frequency;
    const phase = parseFloat(signal.signal.phase);
    const noise = parseFloat(signal.signal.noise);
    
    const isValid = 
      amplitude >= 0 && amplitude <= 1 &&
      frequency >= 1 && frequency <= 7 &&
      (Math.abs(phase) < 0.001 || Math.abs(phase - Math.PI) < 0.001) &&
      noise >= 0 && noise <= 1;
    
    if (isValid) {
      validSignals++;
    } else {
      invalidSignals.push({
        type: signal.type,
        amplitude, frequency, phase, noise
      });
    }
  });
  
  console.log(`  - Valid signals: ${validSignals}/${silcData.signals.length}`);
  if (invalidSignals.length > 0) {
    console.log(`  - Invalid signals found:`);
    invalidSignals.forEach(sig => {
      console.log(`    - ${sig.type}: amp=${sig.amplitude}, freq=${sig.frequency}, phase=${sig.phase}, noise=${sig.noise}`);
    });
  }
}

function testEdgeCases(translator) {
  // Test with minimal data
  const minimalResult = {
    harmonicScore: {
      overall: 0.5,
      confidence: 0.7
    }
  };
  
  console.log('Testing with minimal harmonic result...');
  const minimalSILC = translator.harmonicResultToSILC(minimalResult);
  console.log(`  - Signals generated: ${minimalSILC.signals.length}`);
  console.log(`  - Master signal found: ${minimalSILC.signals.some(s => s.type === 'master_harmonic')}`);
  
  // Test with partial pattern data
  const partialResult = {
    harmonicScore: {
      overall: 0.6,
      breakdown: {
        topological: 0.7,
        fractal: 0.5
      },
      confidence: 0.8
    },
    patterns: {
      topological: {
        density: 0.5,
        clusteringCoefficient: 0.6
      }
    }
  };
  
  console.log('\nTesting with partial pattern data...');
  const partialSILC = translator.harmonicResultToSILC(partialResult);
  console.log(`  - Signals generated: ${partialSILC.signals.length}`);
  console.log(`  - Categories with signals: ${[...new Set(partialSILC.signals.map(s => s.type.split('_')[0]))].join(', ')}`);
  
  // Test with extreme values
  const extremeResult = {
    harmonicScore: {
      overall: 0.01,  // Very poor
      confidence: 0.99
    },
    patterns: {
      topological: {
        density: 0.99,  // Extreme density
        betweennessCentrality: 500,  // Very high
        smallWorldIndex: 5.0  // Far from optimal
      }
    }
  };
  
  console.log('\nTesting with extreme values...');
  const extremeSILC = translator.harmonicResultToSILC(extremeResult);
  const criticalSignals = extremeSILC.signals.filter(s => s.interpretation.urgency === 'critical');
  console.log(`  - Critical signals: ${criticalSignals.length}`);
  console.log(`  - All signals marked as problematic: ${extremeSILC.signals.every(s => parseFloat(s.signal.phase) > 3)}`);
  
  console.log('\n✅ Edge case testing complete!');
}

// Run the tests
testProperHarmonicSILC();