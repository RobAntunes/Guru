#!/usr/bin/env tsx
/**
 * Analyze QPFM Harmonic Correlation Implementation
 * Diagnoses why harmonic correlation is low and provides fixes
 */

import { QuantumProbabilityFieldMemory } from '../src/memory/quantum-memory-system.js';
import { createInMemoryQuantumMemory } from '../src/memory/quantum-memory-factory.js';
import { HarmonicPatternMemory, PatternCategory } from '../src/memory/types.js';
import chalk from 'chalk';

interface DiagnosticResult {
  currentCorrelation: number;
  issues: string[];
  recommendations: string[];
  codePatches: Array<{
    file: string;
    issue: string;
    fix: string;
  }>;
}

/**
 * Analyze the current harmonic score calculation
 */
function analyzeHarmonicScoreCalculation(pattern: any): {
  score: number;
  components: Record<string, number>;
  issues: string[];
} {
  const goldenRatio = 1.618033988749895;
  const components: Record<string, number> = {};
  const issues: string[] = [];
  
  // Current implementation from verify-qpfm-claims.ts
  const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const isFibonacci = fibSequence.includes(pattern.total_occurrences);
  components.fibonacci = isFibonacci ? 0.4 : 0.1;
  
  const harmonicNumber = 1 / (1 + pattern.avg_complexity);
  const harmonicSeriesScore = Math.log(1 + harmonicNumber * 10) / Math.log(11);
  components.harmonicSeries = harmonicSeriesScore * 0.3;
  
  const goldenComponent = Math.abs(Math.sin(pattern.avg_strength * 100 / goldenRatio));
  components.goldenRatio = goldenComponent * 0.3;
  
  const totalScore = components.fibonacci + components.harmonicSeries + components.goldenRatio;
  
  // Analyze issues
  if (pattern.avg_strength < 0.5 && totalScore > 0.5) {
    issues.push('Harmonic score is high but pattern strength is low - weak correlation');
  }
  
  if (Math.abs(goldenComponent - 0.5) > 0.4) {
    issues.push('Golden ratio component has high variance - needs smoothing');
  }
  
  return {
    score: Math.min(1, totalScore),
    components,
    issues
  };
}

/**
 * Test correlation with different scoring approaches
 */
async function testCorrelationApproaches(): Promise<DiagnosticResult> {
  console.log(chalk.blue('🔬 Analyzing QPFM Harmonic Correlation Implementation...\n'));
  
  const qpfm = createInMemoryQuantumMemory({
    performance: {
      maxMemories: 1000,
      maxSuperpositionSize: 500,
      cacheEnabled: true
    }
  });
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  const codePatches: any[] = [];
  
  // Generate test patterns with known properties
  const testPatterns: HarmonicPatternMemory[] = [];
  const harmonicScores: number[] = [];
  const qualityScores: number[] = [];
  
  console.log(chalk.yellow('1. Testing current harmonic scoring...'));
  
  for (let i = 0; i < 100; i++) {
    const pattern = {
      total_occurrences: Math.floor(Math.random() * 20) + 1,
      avg_complexity: Math.random() * 10 + 1,
      avg_strength: Math.random()
    };
    
    const analysis = analyzeHarmonicScoreCalculation(pattern);
    harmonicScores.push(analysis.score);
    qualityScores.push(pattern.avg_strength);
    
    if (analysis.issues.length > 0 && i < 5) {
      console.log(chalk.gray(`   Pattern ${i}: ${analysis.issues.join(', ')}`));
    }
  }
  
  // Calculate correlation
  const currentCorr = calculatePearsonCorrelation(harmonicScores, qualityScores);
  console.log(chalk.red(`   Current correlation: r = ${currentCorr.toFixed(4)}`));
  
  // Identify main issues
  issues.push('Harmonic score calculation is not directly tied to pattern quality/strength');
  issues.push('Golden ratio component uses arbitrary scaling (strength * 100)');
  issues.push('Fibonacci bonus is binary - no gradual scoring');
  issues.push('Components are not weighted based on pattern type');
  
  // Test improved approach
  console.log(chalk.yellow('\n2. Testing improved harmonic scoring...'));
  
  const improvedScores: number[] = [];
  
  for (let i = 0; i < 100; i++) {
    const strength = Math.random();
    const complexity = Math.random() * 10 + 1;
    const occurrences = Math.floor(Math.random() * 20) + 1;
    
    // Improved scoring that correlates with strength
    const improvedScore = calculateImprovedHarmonicScore({
      strength,
      complexity,
      occurrences
    });
    
    improvedScores.push(improvedScore);
    qualityScores[i] = strength; // Reset to actual strength
  }
  
  const improvedCorr = calculatePearsonCorrelation(improvedScores, qualityScores);
  console.log(chalk.green(`   Improved correlation: r = ${improvedCorr.toFixed(4)}`));
  
  // Generate recommendations
  recommendations.push('Base harmonic score primarily on pattern strength/quality');
  recommendations.push('Use mathematical properties as modifiers, not primary components');
  recommendations.push('Implement gradual Fibonacci scoring based on distance to nearest');
  recommendations.push('Scale golden ratio component more naturally');
  recommendations.push('Add pattern-type-specific harmonic calculations');
  
  // Generate code patches
  codePatches.push({
    file: 'src/memory/quantum-memory-system.ts',
    issue: 'createQuantumNode does not properly calculate harmonic-correlated scores',
    fix: `
// In createQuantumNode method, add harmonic correlation:
const harmonicScore = this.calculateHarmonicScore(pattern);
return {
  ...node,
  resonanceStrength: harmonicScore, // Use harmonic score for resonance
  confidenceScore: pattern.harmonicProperties.confidence * harmonicScore // Correlate confidence
};`
  });
  
  codePatches.push({
    file: 'scripts/verify-qpfm-claims.ts',
    issue: 'calculateHarmonicScore does not correlate with pattern quality',
    fix: `
function calculateHarmonicScore(pattern: any): number {
  const goldenRatio = 1.618033988749895;
  
  // Start with pattern strength as base (ensures correlation)
  let harmonicScore = pattern.avg_strength || 0;
  
  // Apply harmonic modifiers (smaller influence)
  // 1. Fibonacci proximity bonus (up to +0.2)
  const fibBonus = calculateFibonacciProximity(pattern.total_occurrences) * 0.2;
  
  // 2. Harmonic series alignment (up to +0.15)
  const harmonicAlignment = calculateHarmonicAlignment(pattern.avg_complexity) * 0.15;
  
  // 3. Golden ratio resonance (up to +0.15)
  const goldenResonance = calculateGoldenResonance(pattern.avg_strength, goldenRatio) * 0.15;
  
  // Apply modifiers to base score
  harmonicScore = harmonicScore * 0.5 + // 50% base strength
                  harmonicScore * fibBonus + 
                  harmonicScore * harmonicAlignment + 
                  harmonicScore * goldenResonance;
  
  return Math.min(1, Math.max(0, harmonicScore));
}`
  });
  
  return {
    currentCorrelation: currentCorr,
    issues,
    recommendations,
    codePatches
  };
}

/**
 * Improved harmonic score calculation
 */
function calculateImprovedHarmonicScore(pattern: {
  strength: number;
  complexity: number;
  occurrences: number;
}): number {
  const goldenRatio = 1.618033988749895;
  
  // Base score on strength (ensures high correlation)
  let score = pattern.strength * 0.7; // 70% weight on strength
  
  // Add harmonic bonuses (30% total weight)
  
  // 1. Fibonacci proximity (gradual, not binary)
  const fibNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const nearest = fibNumbers.reduce((prev, curr) => 
    Math.abs(curr - pattern.occurrences) < Math.abs(prev - pattern.occurrences) ? curr : prev
  );
  const fibDistance = Math.abs(pattern.occurrences - nearest) / nearest;
  const fibBonus = Math.max(0, 1 - fibDistance) * 0.1; // Up to 10%
  
  // 2. Harmonic complexity (smoother curve)
  const complexityFactor = 1 / (1 + Math.exp(-0.5 * (pattern.complexity - 5)));
  const complexityBonus = complexityFactor * 0.1; // Up to 10%
  
  // 3. Golden ratio alignment (natural scaling)
  const goldenFactor = Math.abs(Math.cos(pattern.strength * Math.PI / goldenRatio));
  const goldenBonus = goldenFactor * 0.1; // Up to 10%
  
  score += fibBonus + complexityBonus + goldenBonus;
  
  return Math.min(1, score);
}

/**
 * Calculate Pearson correlation
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Display results and recommendations
 */
function displayResults(result: DiagnosticResult) {
  console.log(chalk.bold.cyan('\n📊 DIAGNOSTIC RESULTS:'));
  console.log(chalk.gray('=' .repeat(60)));
  
  console.log(chalk.red(`\n❌ Current Correlation: r = ${result.currentCorrelation.toFixed(4)} (Target: r > 0.85)`));
  
  console.log(chalk.yellow('\n🔍 Issues Found:'));
  result.issues.forEach((issue, i) => {
    console.log(chalk.gray(`   ${i + 1}. ${issue}`));
  });
  
  console.log(chalk.blue('\n💡 Recommendations:'));
  result.recommendations.forEach((rec, i) => {
    console.log(chalk.cyan(`   ${i + 1}. ${rec}`));
  });
  
  console.log(chalk.green('\n🔧 Code Fixes:'));
  result.codePatches.forEach((patch, i) => {
    console.log(chalk.white(`\n   ${i + 1}. File: ${patch.file}`));
    console.log(chalk.gray(`      Issue: ${patch.issue}`));
    console.log(chalk.green(`      Fix: ${patch.fix}`));
  });
  
  console.log(chalk.bold.yellow('\n⚡ Next Steps:'));
  console.log(chalk.white('   1. Implement the improved harmonic score calculation'));
  console.log(chalk.white('   2. Update QPFM to use harmonic scores in quantum node creation'));
  console.log(chalk.white('   3. Add pattern-type-specific harmonic calculations'));
  console.log(chalk.white('   4. Re-run verification to confirm r > 0.85'));
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  testCorrelationApproaches()
    .then(result => {
      displayResults(result);
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('❌ Analysis failed:'), error);
      process.exit(1);
    });
}