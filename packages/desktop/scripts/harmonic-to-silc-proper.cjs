/**
 * Proper Harmonic to SILC Translator
 * Translates actual harmonic engine output into SILC signals
 * Works with the real TypeScript harmonic intelligence system
 */

class ProperHarmonicToSILC {
  constructor() {
    // SILC base patterns from spec
    this.patterns = {
      confidence: 'amplitude',      // 0.0-1.0
      urgency: 'frequency',         // 0-7 bands
      harmony: 'phase',             // 0 or π
      uncertainty: 'noise'          // Signal noise
    };
    
    // Define mapping from harmonic metrics to urgency bands
    this.urgencyMapping = {
      critical: 7,    // Critical issues found
      urgent: 6,      // Major architectural problems
      important: 5,   // Significant concerns
      moderate: 4,    // Moderate issues
      stable: 3,      // Generally healthy
      excellent: 2,   // Very good patterns
      perfect: 1      // Near-perfect harmony
    };
  }

  /**
   * Convert actual harmonic analysis result to SILC signals
   */
  harmonicResultToSILC(harmonicResult) {
    const signals = [];
    
    // Process Topological Structure signals
    if (harmonicResult.patterns?.topological) {
      signals.push(...this.processTopologicalSignals(harmonicResult.patterns.topological));
    }
    
    // Process Fractal Complexity signals
    if (harmonicResult.patterns?.fractal) {
      signals.push(...this.processFractalSignals(harmonicResult.patterns.fractal));
    }
    
    // Process Information-Theoretic signals
    if (harmonicResult.patterns?.informational) {
      signals.push(...this.processInformationalSignals(harmonicResult.patterns.informational));
    }
    
    // Process Geometric Harmony signals
    if (harmonicResult.patterns?.geometric) {
      signals.push(...this.processGeometricSignals(harmonicResult.patterns.geometric));
    }
    
    // Process Wave Pattern signals
    if (harmonicResult.patterns?.spectral) {
      signals.push(...this.processSpectralSignals(harmonicResult.patterns.spectral));
    }
    
    // Create master harmonic signal from overall scores
    const masterSignal = this.createMasterSignal(harmonicResult.harmonicScore);
    signals.push(masterSignal);
    
    return {
      protocol: 'SILC/1.0',
      timestamp: new Date().toISOString(),
      signals: signals,
      dialect: 'harmonic_intelligence',
      metadata: {
        source: 'guru_harmonic_intelligence_engine',
        version: '3.0.0',
        signalCount: signals.length,
        analysisMode: harmonicResult.metadata?.analysisMode || 'comprehensive',
        sourceFileCount: harmonicResult.metadata?.sourceFileCount || 0,
        totalLinesOfCode: harmonicResult.metadata?.totalLinesOfCode || 0
      }
    };
  }
  
  /**
   * Process topological structure analysis into SILC signals
   */
  processTopologicalSignals(topologicalData) {
    const signals = [];
    
    // Graph density signal
    if (topologicalData.density !== undefined) {
      signals.push(this.createSignal(
        'topology_graph_density',
        topologicalData.density,
        'Graph density - interconnectedness of code structure',
        this.calculateUrgencyFromDensity(topologicalData.density)
      ));
    }
    
    // Centrality measures
    if (topologicalData.betweennessCentrality) {
      signals.push(this.createSignal(
        'topology_betweenness_centrality',
        this.normalizeCentrality(topologicalData.betweennessCentrality),
        'Betweenness centrality - critical path dependencies',
        this.calculateUrgencyFromCentrality(topologicalData.betweennessCentrality)
      ));
    }
    
    if (topologicalData.clusteringCoefficient) {
      signals.push(this.createSignal(
        'topology_clustering_coefficient',
        topologicalData.clusteringCoefficient,
        'Clustering coefficient - module cohesion',
        this.calculateUrgencyFromClustering(topologicalData.clusteringCoefficient)
      ));
    }
    
    // Small world index (optimal is around 1)
    if (topologicalData.smallWorldIndex) {
      signals.push(this.createSignal(
        'topology_small_world_index',
        this.normalizeSmallWorld(topologicalData.smallWorldIndex),
        'Small world property - efficient organization',
        this.calculateUrgencyFromSmallWorld(topologicalData.smallWorldIndex)
      ));
    }
    
    // Symmetry detection
    if (topologicalData.symmetry) {
      signals.push(this.createSignal(
        'topology_structural_symmetry',
        topologicalData.symmetry.confidence || 0,
        'Structural symmetry - architectural consistency',
        this.calculateUrgencyFromSymmetry(topologicalData.symmetry)
      ));
    }
    
    return signals;
  }
  
  /**
   * Process fractal complexity analysis into SILC signals
   */
  processFractalSignals(fractalData) {
    const signals = [];
    
    // Fractal dimension (ideal around 1.2-1.8 for code)
    if (fractalData.fractalDimension !== undefined) {
      const normalized = this.normalizeFractalDimension(fractalData.fractalDimension);
      signals.push(this.createSignal(
        'fractal_dimension',
        normalized,
        'Fractal dimension - self-similar complexity patterns',
        this.calculateUrgencyFromFractalDimension(fractalData.fractalDimension)
      ));
    }
    
    // Self-similarity index
    if (fractalData.selfSimilarityIndex !== undefined) {
      signals.push(this.createSignal(
        'fractal_self_similarity',
        fractalData.selfSimilarityIndex,
        'Self-similarity - consistent patterns across scales',
        this.calculateUrgencyFromSelfSimilarity(fractalData.selfSimilarityIndex)
      ));
    }
    
    // Growth patterns
    if (fractalData.growthPattern) {
      const fibonacciScore = fractalData.growthPattern.fibonacciSimilarity || 0;
      signals.push(this.createSignal(
        'fractal_fibonacci_growth',
        fibonacciScore,
        'Fibonacci-like growth patterns - natural scaling',
        this.calculateUrgencyFromGrowthPattern(fibonacciScore)
      ));
      
      if (fractalData.growthPattern.goldenRatioPresence) {
        signals.push(this.createSignal(
          'fractal_golden_ratio',
          fractalData.growthPattern.goldenRatioPresence,
          'Golden ratio presence - optimal proportions',
          this.calculateUrgencyFromGoldenRatio(fractalData.growthPattern.goldenRatioPresence)
        ));
      }
    }
    
    return signals;
  }
  
  /**
   * Process information-theoretic analysis into SILC signals
   */
  processInformationalSignals(informationalData) {
    const signals = [];
    
    // Shannon entropy (normalized)
    if (informationalData.totalEntropy !== undefined) {
      const normalized = this.normalizeEntropy(informationalData.totalEntropy);
      signals.push(this.createSignal(
        'info_shannon_entropy',
        normalized,
        'Information entropy - code complexity and unpredictability',
        this.calculateUrgencyFromEntropy(normalized)
      ));
    }
    
    // Kolmogorov complexity approximation
    if (informationalData.kolmogorovComplexity !== undefined) {
      signals.push(this.createSignal(
        'info_kolmogorov_complexity',
        this.normalizeKolmogorov(informationalData.kolmogorovComplexity),
        'Algorithmic complexity - minimum description length',
        this.calculateUrgencyFromKolmogorov(informationalData.kolmogorovComplexity)
      ));
    }
    
    // Effective complexity
    if (informationalData.effectiveComplexity) {
      signals.push(this.createSignal(
        'info_effective_complexity',
        informationalData.effectiveComplexity,
        'Effective complexity - meaningful vs random structure',
        this.calculateUrgencyFromEffectiveComplexity(informationalData.effectiveComplexity)
      ));
    }
    
    // Compression ratio
    if (informationalData.compressionRatio !== undefined) {
      signals.push(this.createSignal(
        'info_compression_ratio',
        informationalData.compressionRatio,
        'Compressibility - redundancy and patterns',
        this.calculateUrgencyFromCompression(informationalData.compressionRatio)
      ));
    }
    
    return signals;
  }
  
  /**
   * Process geometric harmony analysis into SILC signals
   */
  processGeometricSignals(geometricData) {
    const signals = [];
    
    // Golden ratio detection
    if (geometricData.goldenRatio) {
      signals.push(this.createSignal(
        'geometric_phi_similarity',
        geometricData.goldenRatio.overallPhiSimilarity || 0,
        'Golden ratio similarity - divine proportions in architecture',
        this.calculateUrgencyFromPhiSimilarity(geometricData.goldenRatio.overallPhiSimilarity)
      ));
      
      // Module-level phi
      if (geometricData.goldenRatio.modulePhiSimilarity !== undefined) {
        signals.push(this.createSignal(
          'geometric_module_phi',
          geometricData.goldenRatio.modulePhiSimilarity,
          'Module size golden ratio alignment',
          this.calculateUrgencyFromPhiSimilarity(geometricData.goldenRatio.modulePhiSimilarity)
        ));
      }
    }
    
    // Platonic structure detection
    if (geometricData.platonicStructures) {
      signals.push(this.createSignal(
        'geometric_platonic_similarity',
        geometricData.platonicStructures.platonicSimilarity || 0,
        'Platonic solid structural patterns',
        this.calculateUrgencyFromPlatonic(geometricData.platonicStructures)
      ));
    }
    
    // Sacred geometry patterns
    if (geometricData.sacredGeometry) {
      signals.push(this.createSignal(
        'geometric_sacred_patterns',
        geometricData.sacredGeometry.patternStrength || 0,
        'Sacred geometry in code organization',
        this.calculateUrgencyFromSacredGeometry(geometricData.sacredGeometry)
      ));
    }
    
    return signals;
  }
  
  /**
   * Process wave pattern analysis into SILC signals
   */
  processSpectralSignals(spectralData) {
    const signals = [];
    
    // Dominant frequencies
    if (spectralData.dominantFrequencies && spectralData.dominantFrequencies.length > 0) {
      const avgFreq = this.calculateAverageFrequency(spectralData.dominantFrequencies);
      signals.push(this.createSignal(
        'spectral_dominant_frequency',
        this.normalizeFrequency(avgFreq),
        'Dominant frequency patterns in code rhythm',
        this.calculateUrgencyFromSpectralFrequency(avgFreq)
      ));
    }
    
    // Harmonic content
    if (spectralData.harmonicContent !== undefined) {
      signals.push(this.createSignal(
        'spectral_harmonic_content',
        spectralData.harmonicContent,
        'Harmonic richness - pattern resonance',
        this.calculateUrgencyFromHarmonicContent(spectralData.harmonicContent)
      ));
    }
    
    // Standing wave patterns
    if (spectralData.standingWaves) {
      signals.push(this.createSignal(
        'spectral_standing_waves',
        spectralData.standingWaves.standingWaveQuality || 0,
        'Standing wave patterns - structural resonance',
        this.calculateUrgencyFromStandingWaves(spectralData.standingWaves)
      ));
    }
    
    // Harmonic to noise ratio
    if (spectralData.harmonicToNoiseRatio !== undefined) {
      signals.push(this.createSignal(
        'spectral_signal_clarity',
        this.normalizeHarmonicToNoise(spectralData.harmonicToNoiseRatio),
        'Signal clarity - pattern vs chaos ratio',
        this.calculateUrgencyFromNoiseRatio(spectralData.harmonicToNoiseRatio)
      ));
    }
    
    return signals;
  }
  
  /**
   * Create master harmonic signal from overall scores
   */
  createMasterSignal(harmonicScore) {
    if (!harmonicScore) {
      return this.createSignal(
        'master_harmonic',
        0,
        'Master harmonic signal - no data available',
        'critical'
      );
    }
    
    const overallScore = harmonicScore.overall || 0;
    const confidence = harmonicScore.confidence || 0;
    
    // Calculate urgency based on overall score
    let urgency;
    if (overallScore < 0.3) urgency = 'critical';
    else if (overallScore < 0.5) urgency = 'urgent';
    else if (overallScore < 0.6) urgency = 'important';
    else if (overallScore < 0.7) urgency = 'moderate';
    else if (overallScore < 0.8) urgency = 'stable';
    else if (overallScore < 0.9) urgency = 'excellent';
    else urgency = 'perfect';
    
    // Create the master signal with additional metadata
    const signal = this.createSignal(
      'master_harmonic',
      overallScore,
      'Master harmonic signal - overall system harmony',
      urgency
    );
    
    // Add breakdown information
    signal.breakdown = harmonicScore.breakdown;
    signal.confidence = confidence;
    
    return signal;
  }
  
  /**
   * Create individual SILC signal
   */
  createSignal(type, value, description, urgency) {
    // Ensure value is normalized to 0-1 range
    const normalizedValue = Math.max(0, Math.min(1, value));
    
    // Map urgency to frequency band
    const frequency = typeof urgency === 'string' 
      ? this.urgencyMapping[urgency] || 4 
      : urgency;
    
    // Phase: 0 for healthy (>0.7), π for unhealthy
    const phase = normalizedValue >= 0.7 ? 0 : Math.PI;
    
    // Noise: inverse of confidence/clarity
    const noise = 1.0 - normalizedValue;
    
    return {
      type: type,
      signal: {
        amplitude: normalizedValue.toFixed(3),
        frequency: frequency,
        phase: phase.toFixed(3),
        noise: noise.toFixed(3)
      },
      interpretation: {
        value: normalizedValue,
        urgency: typeof urgency === 'string' ? urgency : this.getUrgencyName(urgency),
        status: this.getStatus(normalizedValue),
        description: description
      }
    };
  }
  
  // Normalization functions for different metrics
  
  normalizeCentrality(centrality) {
    // Centrality can be very high, normalize to 0-1
    return Math.min(1, centrality / 100);
  }
  
  normalizeSmallWorld(index) {
    // Small world index optimal around 1, normalize distance from 1
    const distance = Math.abs(index - 1);
    return Math.max(0, 1 - distance);
  }
  
  normalizeFractalDimension(dimension) {
    // Ideal fractal dimension for code is 1.2-1.8
    if (dimension >= 1.2 && dimension <= 1.8) {
      return 0.9 + 0.1 * (1 - Math.abs(dimension - 1.5) / 0.3);
    }
    return Math.max(0, 1 - Math.abs(dimension - 1.5) / 2);
  }
  
  normalizeEntropy(entropy) {
    // Normalize entropy to 0-1 (assuming max entropy around 10)
    return Math.min(1, entropy / 10);
  }
  
  normalizeKolmogorov(complexity) {
    // Normalize Kolmogorov complexity (inverse - lower is better)
    return Math.max(0, 1 - complexity / 1000);
  }
  
  normalizeFrequency(freq) {
    // Normalize frequency to 0-1 range
    return Math.min(1, freq / 100);
  }
  
  normalizeHarmonicToNoise(ratio) {
    // Higher ratio is better, normalize to 0-1
    return Math.min(1, ratio / 10);
  }
  
  // Urgency calculation functions
  
  calculateUrgencyFromDensity(density) {
    if (density > 0.8) return 'urgent'; // Too dense
    if (density < 0.2) return 'urgent'; // Too sparse
    if (density >= 0.4 && density <= 0.6) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromCentrality(centrality) {
    if (centrality > 80) return 'urgent'; // Too many critical paths
    if (centrality > 60) return 'important';
    if (centrality > 40) return 'moderate';
    return 'stable';
  }
  
  calculateUrgencyFromClustering(coefficient) {
    if (coefficient < 0.3) return 'urgent'; // Poor cohesion
    if (coefficient > 0.8) return 'important'; // Might be too tightly coupled
    if (coefficient >= 0.5 && coefficient <= 0.7) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromSmallWorld(index) {
    const distance = Math.abs(index - 1);
    if (distance > 0.5) return 'urgent';
    if (distance > 0.3) return 'important';
    if (distance > 0.1) return 'moderate';
    return 'excellent';
  }
  
  calculateUrgencyFromSymmetry(symmetry) {
    const confidence = symmetry.confidence || 0;
    if (confidence < 0.3) return 'urgent';
    if (confidence < 0.5) return 'important';
    if (confidence < 0.7) return 'moderate';
    if (confidence >= 0.8) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromFractalDimension(dimension) {
    if (dimension < 1.0 || dimension > 2.0) return 'urgent';
    if (dimension < 1.2 || dimension > 1.8) return 'important';
    if (dimension >= 1.3 && dimension <= 1.7) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromSelfSimilarity(similarity) {
    if (similarity < 0.3) return 'urgent';
    if (similarity < 0.5) return 'important';
    if (similarity > 0.8) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromGrowthPattern(fibonacciScore) {
    if (fibonacciScore > 0.8) return 'excellent';
    if (fibonacciScore > 0.6) return 'stable';
    if (fibonacciScore < 0.3) return 'important';
    return 'moderate';
  }
  
  calculateUrgencyFromGoldenRatio(presence) {
    if (presence > 0.8) return 'perfect';
    if (presence > 0.6) return 'excellent';
    if (presence < 0.2) return 'moderate';
    return 'stable';
  }
  
  calculateUrgencyFromEntropy(normalizedEntropy) {
    if (normalizedEntropy > 0.8) return 'urgent'; // Too chaotic
    if (normalizedEntropy < 0.2) return 'important'; // Too rigid
    if (normalizedEntropy >= 0.4 && normalizedEntropy <= 0.6) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromKolmogorov(complexity) {
    if (complexity > 800) return 'urgent';
    if (complexity > 600) return 'important';
    if (complexity < 200) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromEffectiveComplexity(complexity) {
    if (complexity < 0.3) return 'urgent'; // Too simple or chaotic
    if (complexity > 0.8) return 'important'; // Too complex
    if (complexity >= 0.5 && complexity <= 0.7) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromCompression(ratio) {
    if (ratio < 0.2) return 'urgent'; // Too much redundancy
    if (ratio > 0.8) return 'important'; // Too little pattern
    if (ratio >= 0.4 && ratio <= 0.6) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromPhiSimilarity(similarity) {
    if (similarity > 0.8) return 'perfect';
    if (similarity > 0.6) return 'excellent';
    if (similarity < 0.2) return 'moderate';
    return 'stable';
  }
  
  calculateUrgencyFromPlatonic(platonic) {
    if (platonic.structuralPerfection > 0.8) return 'excellent';
    if (platonic.eulerFormulaValid === false) return 'important';
    return 'stable';
  }
  
  calculateUrgencyFromSacredGeometry(sacred) {
    const strength = sacred.patternStrength || 0;
    if (strength > 0.8) return 'perfect';
    if (strength > 0.6) return 'excellent';
    return 'stable';
  }
  
  calculateUrgencyFromSpectralFrequency(freq) {
    // Optimal frequencies for code rhythm
    if (freq >= 5 && freq <= 15) return 'excellent';
    if (freq < 2 || freq > 30) return 'important';
    return 'stable';
  }
  
  calculateUrgencyFromHarmonicContent(content) {
    if (content > 0.8) return 'excellent';
    if (content < 0.3) return 'important';
    return 'stable';
  }
  
  calculateUrgencyFromStandingWaves(waves) {
    const quality = waves.standingWaveQuality || 0;
    if (quality > 0.8) return 'excellent';
    if (quality < 0.3) return 'important';
    return 'stable';
  }
  
  calculateUrgencyFromNoiseRatio(ratio) {
    if (ratio > 8) return 'excellent';
    if (ratio < 2) return 'urgent';
    if (ratio < 4) return 'important';
    return 'stable';
  }
  
  // Helper functions
  
  calculateAverageFrequency(frequencies) {
    if (!frequencies || frequencies.length === 0) return 0;
    return frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
  }
  
  getStatus(score) {
    if (score >= 0.9) return '🟢 Excellent';
    if (score >= 0.7) return '🟡 Good';
    if (score >= 0.5) return '🟠 Fair';
    return '🔴 Needs Attention';
  }
  
  getUrgencyName(frequency) {
    const reverseMap = Object.entries(this.urgencyMapping).find(([_, val]) => val === frequency);
    return reverseMap ? reverseMap[0] : 'moderate';
  }
  
  /**
   * Generate comprehensive SILC prompt for foundation models
   */
  generateSILCPrompt(silcData, harmonicResult) {
    const masterSignal = silcData.signals.find(s => s.type === 'master_harmonic');
    const categorySignals = this.groupSignalsByCategory(silcData.signals);
    
    return `You are analyzing a complex software system using SILC (Self-Interpreting Local Communication) signals derived from deep harmonic intelligence analysis.

## SILC Signal Interpretation Guide:

SILC signals represent mathematical patterns found in actual code structure:
- **Amplitude** = Pattern strength/health (0=absent, 1=perfect)
- **Frequency** = Urgency level (1=excellent, 7=critical)
- **Phase** = Alignment (0=harmonious, π=discordant)
- **Noise** = Uncertainty/chaos (0=clear pattern, 1=noisy)

## Master System Analysis:

📡 **Overall Harmonic Health**
- System Harmony: ${(parseFloat(masterSignal.signal.amplitude) * 100).toFixed(0)}%
- Urgency: ${this.getUrgencyDescription(masterSignal.signal.frequency)}
- Pattern Alignment: ${masterSignal.signal.phase === '0.000' ? '✅ Harmonious patterns' : '⚠️ Discordant patterns detected'}
- Signal Clarity: ${(100 - parseFloat(masterSignal.signal.noise) * 100).toFixed(0)}%
${masterSignal.breakdown ? `
- Breakdown:
  - Topological: ${(masterSignal.breakdown.topological * 100).toFixed(0)}%
  - Fractal: ${(masterSignal.breakdown.fractal * 100).toFixed(0)}%
  - Informational: ${(masterSignal.breakdown.informational * 100).toFixed(0)}%
  - Geometric: ${(masterSignal.breakdown.geometric * 100).toFixed(0)}%
  - Spectral: ${(masterSignal.breakdown.spectral * 100).toFixed(0)}%` : ''}

## Detailed Pattern Analysis:

${this.formatCategorySignals(categorySignals)}

## System Context:
- Analysis Mode: ${harmonicResult.metadata?.analysisMode || 'comprehensive'}
- Source Files: ${harmonicResult.metadata?.sourceFileCount || 'unknown'}
- Lines of Code: ${harmonicResult.metadata?.totalLinesOfCode || 'unknown'}
- Total Patterns Detected: ${silcData.signals.length}

## Architectural Insights:

Based on these harmonic patterns detected through AST analysis:

1. **Structural Health**: What does the topology tell us about code organization?
2. **Complexity Patterns**: Are fractal patterns indicating healthy or problematic growth?
3. **Information Architecture**: Is the code efficiently organized or chaotic?
4. **Design Harmony**: Do we see golden ratios and geometric balance?
5. **Rhythmic Patterns**: Are there healthy oscillations or concerning resonances?

## AI Guidance:

${this.generateAIGuidance(harmonicResult)}

Remember: These signals represent deep mathematical analysis of actual code structure, not superficial metrics. Each pattern reveals fundamental architectural properties that affect maintainability, evolvability, and quality.`;
  }
  
  groupSignalsByCategory(signals) {
    const categories = {
      topology: [],
      fractal: [],
      info: [],
      geometric: [],
      spectral: []
    };
    
    signals.forEach(signal => {
      if (signal.type.startsWith('topology_')) categories.topology.push(signal);
      else if (signal.type.startsWith('fractal_')) categories.fractal.push(signal);
      else if (signal.type.startsWith('info_')) categories.info.push(signal);
      else if (signal.type.startsWith('geometric_')) categories.geometric.push(signal);
      else if (signal.type.startsWith('spectral_')) categories.spectral.push(signal);
    });
    
    return categories;
  }
  
  formatCategorySignals(categories) {
    let output = '';
    
    if (categories.topology.length > 0) {
      output += '### 🌐 Topological Structure Patterns\n';
      output += this.formatSignalList(categories.topology);
    }
    
    if (categories.fractal.length > 0) {
      output += '\n### 🌀 Fractal Complexity Patterns\n';
      output += this.formatSignalList(categories.fractal);
    }
    
    if (categories.info.length > 0) {
      output += '\n### 📊 Information-Theoretic Patterns\n';
      output += this.formatSignalList(categories.info);
    }
    
    if (categories.geometric.length > 0) {
      output += '\n### 📐 Geometric Harmony Patterns\n';
      output += this.formatSignalList(categories.geometric);
    }
    
    if (categories.spectral.length > 0) {
      output += '\n### 🌊 Wave & Spectral Patterns\n';
      output += this.formatSignalList(categories.spectral);
    }
    
    return output;
  }
  
  formatSignalList(signals) {
    return signals.map(signal => {
      const amplitude = (parseFloat(signal.signal.amplitude) * 100).toFixed(0);
      const urgency = this.getUrgencyDescription(signal.signal.frequency);
      return `- **${signal.interpretation.description}**
  - Strength: ${amplitude}% ${this.getHealthEmoji(amplitude)}
  - Urgency: ${urgency}
  - Status: ${signal.interpretation.status}`;
    }).join('\n\n');
  }
  
  generateAIGuidance(harmonicResult) {
    if (!harmonicResult.guidance) {
      return 'No specific architectural guidance available.';
    }
    
    let guidance = '';
    
    if (harmonicResult.guidance.safeModificationZones?.length > 0) {
      guidance += `**Safe Modification Zones**: ${harmonicResult.guidance.safeModificationZones.length} areas identified for safe refactoring\n`;
    }
    
    if (harmonicResult.guidance.refactoringOpportunities?.length > 0) {
      guidance += `**Refactoring Opportunities**: ${harmonicResult.guidance.refactoringOpportunities.length} patterns could be improved\n`;
    }
    
    if (harmonicResult.guidance.qualityImprovements?.length > 0) {
      guidance += `**Quality Improvements**: ${harmonicResult.guidance.qualityImprovements.length} specific enhancements recommended\n`;
    }
    
    if (harmonicResult.compressedProfile?.harmonicCoordinates) {
      const [x, y, z] = harmonicResult.compressedProfile.harmonicCoordinates;
      guidance += `\n**Harmonic Coordinates**: [${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}] - Unique architectural signature`;
    }
    
    return guidance || 'Analyze patterns above to guide architectural decisions.';
  }
  
  getUrgencyDescription(frequency) {
    const urgencyMap = {
      1: '🟢 Perfect (Band 1)',
      2: '🟢 Excellent (Band 2)',
      3: '🟡 Stable (Band 3)',
      4: '🟡 Moderate (Band 4)',
      5: '🟠 Important (Band 5)',
      6: '🔴 Urgent (Band 6)',
      7: '🚨 Critical (Band 7)'
    };
    return urgencyMap[frequency] || '❓ Unknown';
  }
  
  getHealthEmoji(health) {
    if (health >= 90) return '💚';
    if (health >= 70) return '💛';
    if (health >= 50) return '🧡';
    return '❤️‍🩹';
  }
}

// Export both names for compatibility
module.exports = { 
  ProperHarmonicToSILC,
  HarmonicToSILC: ProperHarmonicToSILC 
};