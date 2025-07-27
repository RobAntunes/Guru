/**
 * Full Harmonic to SILC Translator
 * Converts all 23-27 harmonic analysis signals across 7 groups into SILC signal patterns
 * that foundation models can universally interpret
 */

class FullHarmonicToSILC {
  constructor() {
    // SILC base patterns from spec
    this.patterns = {
      confidence: 'amplitude',      // 0.0-1.0
      urgency: 'frequency',         // 0-7 bands
      harmony: 'phase',             // 0 or π
      uncertainty: 'noise'          // Signal noise
    };
    
    // Frequency bands for different harmonic states
    this.frequencyBands = {
      critical: 7,    // < 0.3 harmonic score
      urgent: 6,      // 0.3-0.5
      important: 5,   // 0.5-0.6
      moderate: 4,    // 0.6-0.7
      stable: 3,      // 0.7-0.8
      excellent: 2,   // 0.8-0.9
      perfect: 1      // > 0.9
    };
    
    // Define all 7 harmonic signal groups with their individual signals
    this.harmonicGroups = {
      // Group 1: Structural Harmony (4 signals)
      structural: {
        name: 'Structural Harmony',
        signals: [
          'directoryResonance',      // Directory organization quality
          'moduleCoherence',         // Module boundaries clarity
          'layerHarmony',           // Architectural layer separation
          'namespaceAlignment'       // Namespace consistency
        ]
      },
      
      // Group 2: Content Coherence (4 signals)
      content: {
        name: 'Content Coherence',
        signals: [
          'semanticDensity',        // Information density balance
          'documentationFlow',      // Documentation quality
          'commentResonance',       // Comment-to-code ratio
          'contentFocus'            // Single responsibility adherence
        ]
      },
      
      // Group 3: Pattern Recognition (3 signals)
      pattern: {
        name: 'Pattern Recognition',
        signals: [
          'namingConsistency',      // Naming pattern adherence
          'styleUniformity',        // Code style consistency
          'idiomaticAlignment'      // Language idiom usage
        ]
      },
      
      // Group 4: Dependency Dynamics (4 signals)
      dependency: {
        name: 'Dependency Dynamics',
        signals: [
          'importResonance',        // Import organization
          'circularityIndex',       // Circular dependency detection
          'couplingBalance',        // Module coupling measure
          'externalHarmony'         // External dependency health
        ]
      },
      
      // Group 5: Temporal Evolution (3 signals)
      temporal: {
        name: 'Temporal Evolution',
        signals: [
          'changeVelocity',         // Rate of change
          'evolutionPattern',       // Growth pattern analysis
          'stabilityIndex'          // Code stability over time
        ]
      },
      
      // Group 6: Complexity Measures (4 signals)
      complexity: {
        name: 'Complexity Measures',
        signals: [
          'cyclomaticHarmony',      // Cyclomatic complexity balance
          'cognitiveLoad',          // Cognitive complexity
          'nestingResonance',       // Nesting depth patterns
          'abstractionBalance'      // Abstraction level consistency
        ]
      },
      
      // Group 7: Quality Indicators (3-5 signals, variable)
      quality: {
        name: 'Quality Indicators',
        signals: [
          'testCoverage',           // Test coverage quality
          'errorHandling',          // Error handling patterns
          'performanceSignature',   // Performance characteristics
          'securityPosture',        // Security pattern detection
          'maintainabilityIndex'    // Optional: Overall maintainability
        ]
      }
    };
  }

  /**
   * Convert full harmonic analysis (23-27 signals) to SILC signals
   */
  fullHarmonicsToSILC(harmonicAnalysis) {
    const signals = [];
    const groupResults = {};
    
    // Process each harmonic group
    Object.entries(this.harmonicGroups).forEach(([groupKey, group]) => {
      const groupSignals = [];
      
      group.signals.forEach(signalName => {
        // Get the harmonic score for this signal (simulate if not provided)
        const score = harmonicAnalysis[signalName] || this.calculateSignalScore(signalName, harmonicAnalysis);
        
        if (score !== null) {
          const signal = this.createSignal(
            `${groupKey}_${signalName}`,
            score,
            `${group.name}: ${this.getSignalDescription(signalName)}`
          );
          
          groupSignals.push(signal);
          signals.push(signal);
        }
      });
      
      // Create group summary signal
      if (groupSignals.length > 0) {
        const groupScore = this.calculateGroupScore(groupSignals);
        const groupSignal = this.createGroupSignal(groupKey, group.name, groupScore, groupSignals);
        signals.push(groupSignal);
        groupResults[groupKey] = groupSignal;
      }
    });
    
    // Create master harmonic signal
    const masterSignal = this.createMasterHarmonicSignal(groupResults, harmonicAnalysis);
    signals.push(masterSignal);
    
    return {
      protocol: 'SILC/1.0',
      timestamp: new Date().toISOString(),
      signals: signals,
      dialect: 'full_harmonic_analysis',
      metadata: {
        source: 'guru_full_harmonic_analyzer',
        version: '2.0.0',
        signalCount: signals.length,
        groupCount: Object.keys(groupResults).length
      }
    };
  }
  
  /**
   * Calculate signal score based on available harmonic data
   */
  calculateSignalScore(signalName, harmonicAnalysis) {
    // Map specific signals to available harmonic scores
    const signalMappings = {
      // Structural signals
      directoryResonance: harmonicAnalysis.structuralResonance,
      moduleCoherence: harmonicAnalysis.structuralResonance * 0.9,
      layerHarmony: harmonicAnalysis.structuralResonance * 0.85,
      namespaceAlignment: harmonicAnalysis.structuralResonance * 0.95,
      
      // Content signals
      semanticDensity: harmonicAnalysis.contentCoherence,
      documentationFlow: harmonicAnalysis.contentCoherence * 0.8,
      commentResonance: harmonicAnalysis.contentCoherence * 0.9,
      contentFocus: harmonicAnalysis.contentCoherence * 0.95,
      
      // Pattern signals
      namingConsistency: harmonicAnalysis.patternHarmony,
      styleUniformity: harmonicAnalysis.patternHarmony * 0.9,
      idiomaticAlignment: harmonicAnalysis.patternHarmony * 0.85,
      
      // Dependency signals (derived from overall balance)
      importResonance: harmonicAnalysis.overallBalance * 0.9,
      circularityIndex: Math.min(1.0, harmonicAnalysis.overallBalance * 1.2),
      couplingBalance: harmonicAnalysis.overallBalance * 0.85,
      externalHarmony: harmonicAnalysis.overallBalance * 0.8,
      
      // Temporal signals (simulate based on stability)
      changeVelocity: 0.7 + (harmonicAnalysis.overallBalance - 0.5) * 0.4,
      evolutionPattern: harmonicAnalysis.overallBalance * 0.9,
      stabilityIndex: harmonicAnalysis.overallBalance,
      
      // Complexity signals (inverse relationship)
      cyclomaticHarmony: Math.min(1.0, 1.2 - harmonicAnalysis.overallBalance * 0.3),
      cognitiveLoad: Math.min(1.0, 1.1 - harmonicAnalysis.overallBalance * 0.2),
      nestingResonance: harmonicAnalysis.patternHarmony * 0.9,
      abstractionBalance: harmonicAnalysis.structuralResonance * 0.85,
      
      // Quality signals
      testCoverage: harmonicAnalysis.overallBalance * 0.7,
      errorHandling: harmonicAnalysis.contentCoherence * 0.8,
      performanceSignature: harmonicAnalysis.overallBalance * 0.85,
      securityPosture: harmonicAnalysis.overallBalance * 0.75,
      maintainabilityIndex: harmonicAnalysis.overallBalance
    };
    
    return signalMappings[signalName] || null;
  }
  
  /**
   * Get human-readable description for each signal
   */
  getSignalDescription(signalName) {
    const descriptions = {
      // Structural
      directoryResonance: 'Directory organization and hierarchy quality',
      moduleCoherence: 'Module boundary definition and separation',
      layerHarmony: 'Architectural layer separation and clarity',
      namespaceAlignment: 'Namespace consistency and organization',
      
      // Content
      semanticDensity: 'Information density and balance',
      documentationFlow: 'Documentation quality and completeness',
      commentResonance: 'Comment quality and code explanation',
      contentFocus: 'Single responsibility principle adherence',
      
      // Pattern
      namingConsistency: 'Variable and function naming patterns',
      styleUniformity: 'Code style and formatting consistency',
      idiomaticAlignment: 'Language-specific idiom usage',
      
      // Dependency
      importResonance: 'Import statement organization',
      circularityIndex: 'Absence of circular dependencies',
      couplingBalance: 'Module coupling and cohesion',
      externalHarmony: 'External dependency management',
      
      // Temporal
      changeVelocity: 'Rate of change in codebase',
      evolutionPattern: 'Code evolution and growth patterns',
      stabilityIndex: 'Code stability over time',
      
      // Complexity
      cyclomaticHarmony: 'Cyclomatic complexity balance',
      cognitiveLoad: 'Cognitive complexity for developers',
      nestingResonance: 'Code nesting depth patterns',
      abstractionBalance: 'Abstraction level consistency',
      
      // Quality
      testCoverage: 'Test coverage and quality',
      errorHandling: 'Error handling robustness',
      performanceSignature: 'Performance characteristics',
      securityPosture: 'Security best practices',
      maintainabilityIndex: 'Overall maintainability score'
    };
    
    return descriptions[signalName] || signalName;
  }
  
  /**
   * Calculate group score from individual signals
   */
  calculateGroupScore(groupSignals) {
    const scores = groupSignals.map(s => parseFloat(s.signal.amplitude));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Apply weighted average based on signal importance
    const weighted = scores.map((score, i) => {
      const weight = 1.0 - (i * 0.05); // Slight preference for earlier signals
      return score * weight;
    });
    
    const weightedSum = weighted.reduce((a, b) => a + b, 0);
    const weightSum = scores.map((_, i) => 1.0 - (i * 0.05)).reduce((a, b) => a + b, 0);
    
    return weightedSum / weightSum;
  }
  
  /**
   * Create individual SILC signal from harmonic score
   */
  createSignal(type, score, description) {
    // Amplitude = confidence in the measurement (harmonic score itself)
    const amplitude = score;
    
    // Frequency = urgency based on how far from ideal (0.7-1.0 is ideal)
    const urgency = this.calculateUrgency(score);
    const frequency = this.mapUrgencyToFrequency(urgency);
    
    // Phase = harmony (0 for aligned/good, π for misaligned/bad)
    const phase = score >= 0.7 ? 0 : Math.PI;
    
    // Noise = uncertainty (inverse of score - low scores have high uncertainty)
    const noise = 1.0 - score;
    
    return {
      type: type,
      signal: {
        amplitude: amplitude.toFixed(3),
        frequency: frequency,
        phase: phase.toFixed(3),
        noise: noise.toFixed(3)
      },
      interpretation: {
        score: score,
        urgency: urgency,
        status: this.getStatus(score),
        description: description
      }
    };
  }
  
  /**
   * Create group summary signal
   */
  createGroupSignal(groupKey, groupName, groupScore, groupSignals) {
    const signal = this.createSignal(
      `${groupKey}_group`,
      groupScore,
      `${groupName} - Group harmony measure`
    );
    
    // Add group-specific metadata
    signal.groupMetadata = {
      signalCount: groupSignals.length,
      minScore: Math.min(...groupSignals.map(s => s.interpretation.score)),
      maxScore: Math.max(...groupSignals.map(s => s.interpretation.score)),
      variance: this.calculateVariance(groupSignals.map(s => s.interpretation.score))
    };
    
    return signal;
  }
  
  /**
   * Create master harmonic signal combining all groups
   */
  createMasterHarmonicSignal(groupResults, harmonicAnalysis) {
    // Calculate overall system score from group scores
    const groupScores = Object.values(groupResults).map(g => g.interpretation.score);
    const overallScore = groupScores.reduce((a, b) => a + b, 0) / groupScores.length;
    
    // For master signal, amplitude represents overall system health
    const amplitude = overallScore;
    
    // Frequency is based on the worst group score (highest urgency)
    const worstScore = Math.min(...groupScores);
    const frequency = this.mapUrgencyToFrequency(this.calculateUrgency(worstScore));
    
    // Phase alignment check - all good (0) or some bad (π)
    const allGood = groupScores.every(score => score >= 0.7);
    const phase = allGood ? 0 : Math.PI;
    
    // Noise represents variance between groups
    const noise = Math.min(1.0, this.calculateVariance(groupScores) * 2);
    
    return {
      type: 'master_harmonic',
      signal: {
        amplitude: amplitude.toFixed(3),
        frequency: frequency,
        phase: phase.toFixed(3),
        noise: noise.toFixed(3)
      },
      interpretation: {
        score: overallScore,
        urgency: this.calculateUrgency(worstScore),
        status: this.getStatus(overallScore),
        description: 'Master harmonic signal - Overall system harmony',
        groupCount: Object.keys(groupResults).length,
        totalSignals: Object.values(groupResults).reduce((sum, g) => sum + (g.groupMetadata?.signalCount || 0), 0) + Object.keys(groupResults).length + 1
      },
      groups: Object.fromEntries(
        Object.entries(groupResults).map(([key, result]) => [
          key,
          {
            score: result.interpretation.score,
            status: result.interpretation.status,
            signalCount: result.groupMetadata?.signalCount || 0
          }
        ])
      )
    };
  }
  
  /**
   * Calculate urgency from harmonic score
   */
  calculateUrgency(score) {
    if (score < 0.3) return 'critical';
    if (score < 0.5) return 'urgent';
    if (score < 0.6) return 'important';
    if (score < 0.7) return 'moderate';
    if (score < 0.8) return 'stable';
    if (score < 0.9) return 'excellent';
    return 'perfect';
  }
  
  /**
   * Map urgency to SILC frequency band (0-7)
   */
  mapUrgencyToFrequency(urgency) {
    return this.frequencyBands[urgency] || 4;
  }
  
  /**
   * Get human-readable status
   */
  getStatus(score) {
    if (score >= 0.9) return '🟢 Excellent';
    if (score >= 0.7) return '🟡 Good';
    if (score >= 0.5) return '🟠 Fair';
    return '🔴 Needs Attention';
  }
  
  /**
   * Calculate variance for noise measurement
   */
  calculateVariance(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
  }
  
  /**
   * Generate comprehensive SILC prompt for foundation models
   */
  generateFullSILCPrompt(silcData, projectContext) {
    const masterSignal = silcData.signals.find(s => s.type === 'master_harmonic');
    const groupSignals = silcData.signals.filter(s => s.type.endsWith('_group'));
    const individualSignals = silcData.signals.filter(s => !s.type.endsWith('_group') && s.type !== 'master_harmonic');
    
    return `You are analyzing a complex system using SILC (Self-Interpreting Local Communication) signals.
This analysis contains ${masterSignal.interpretation.totalSignals} harmonic signals across ${masterSignal.interpretation.groupCount} major groups.

## SILC Signal Interpretation Guide:

Think of SILC signals like a comprehensive health checkup for any system:
- **Amplitude** = Health/Quality (0=critical, 1=perfect)
- **Frequency** = Urgency level (1=routine, 7=emergency)
- **Phase** = Alignment (0=harmonious, π=discordant)
- **Noise** = Clarity (0=crystal clear, 1=very noisy)

## Master System Signal:

📡 **Overall System Harmony**
- System Health: ${(parseFloat(masterSignal.signal.amplitude) * 100).toFixed(0)}% ${this.getHealthEmoji(parseFloat(masterSignal.signal.amplitude) * 100)}
- Urgency Level: ${this.getUrgencyDescription(masterSignal.signal.frequency)}
- System Alignment: ${masterSignal.signal.phase === '0.000' ? '✅ All subsystems in harmony' : '⚠️ Some subsystems misaligned'}
- Signal Clarity: ${(100 - parseFloat(masterSignal.signal.noise) * 100).toFixed(0)}%

## Harmonic Group Analysis:

${groupSignals.map(sig => {
  const health = (parseFloat(sig.signal.amplitude) * 100).toFixed(0);
  const urgencyDesc = this.getUrgencyDescription(parseInt(sig.signal.frequency));
  const aligned = sig.signal.phase === '0.000';
  const clarity = (100 - parseFloat(sig.signal.noise) * 100).toFixed(0);
  const groupKey = sig.type.replace('_group', '');
  const groupInfo = masterSignal.groups[groupKey];
  
  return `### ${this.harmonicGroups[groupKey]?.name || sig.type}
- Group Health: ${health}% ${this.getHealthEmoji(health)}
- Urgency: ${urgencyDesc}
- Alignment: ${aligned ? '✅ Harmonious' : '❌ Discordant'}
- Signal Clarity: ${clarity}%
- Signals in Group: ${groupInfo?.signalCount || 0}
- Status: ${groupInfo?.status || 'Unknown'}`;
}).join('\n\n')}

## Detailed Signal Breakdown:

${this.formatDetailedSignals(individualSignals)}

## System Context:
- Domain: ${projectContext.domain || 'Software Development'}
- Total Components: ${projectContext.fileCount || 0}
- Component Groups: ${projectContext.directoryCount || 0}
- Analysis Depth: Full harmonic spectrum (${masterSignal.interpretation.totalSignals} signals)

## Your Analysis Task:

Based on these comprehensive harmonic signals:

1. **System Diagnosis**: What is the overall health of this system based on all ${masterSignal.interpretation.totalSignals} signals?

2. **Critical Issues**: Identify the most urgent issues (high-frequency signals) that need immediate attention.

3. **Improvement Priorities**: Based on the signal groups, what are the top 3-5 areas that would most benefit from improvement?

4. **Harmony Restoration**: For misaligned signals (phase = π), suggest specific actions to restore harmony.

5. **Excellence Path**: For signals already in good health (>70%), how can they be elevated to excellent (>90%)?

Remember: These signals represent the deep harmonic structure of the system. Each signal tells a story about a specific aspect of system health. Your role is to interpret these signals holistically and provide actionable insights.`;
  }
  
  /**
   * Format detailed signals for prompt
   */
  formatDetailedSignals(signals) {
    // Group signals by their group prefix
    const signalsByGroup = {};
    signals.forEach(sig => {
      const groupKey = sig.type.split('_')[0];
      if (!signalsByGroup[groupKey]) {
        signalsByGroup[groupKey] = [];
      }
      signalsByGroup[groupKey].push(sig);
    });
    
    return Object.entries(signalsByGroup).map(([groupKey, groupSignals]) => {
      const groupName = this.harmonicGroups[groupKey]?.name || groupKey;
      
      return `**${groupName} Signals:**
${groupSignals.map(sig => {
  const health = (parseFloat(sig.signal.amplitude) * 100).toFixed(0);
  const signalName = sig.type.split('_').slice(1).join('_');
  
  return `- ${this.getSignalDescription(signalName)}: ${health}% ${this.getHealthEmoji(health)}`;
}).join('\n')}`;
    }).join('\n\n');
  }
  
  /**
   * Get urgency description from frequency
   */
  getUrgencyDescription(frequency) {
    const urgencyMap = {
      1: '🟢 Routine (Band 1)',
      2: '🟢 Low (Band 2)',
      3: '🟡 Moderate (Band 3)',
      4: '🟡 Elevated (Band 4)',
      5: '🟠 High (Band 5)',
      6: '🔴 Urgent (Band 6)',
      7: '🚨 Critical (Band 7)'
    };
    return urgencyMap[frequency] || '❓ Unknown';
  }
  
  /**
   * Get health emoji based on percentage
   */
  getHealthEmoji(health) {
    if (health >= 90) return '💚';
    if (health >= 70) return '💛';
    if (health >= 50) return '🧡';
    return '❤️‍🩹';
  }
}

module.exports = { FullHarmonicToSILC };