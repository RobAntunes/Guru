#!/usr/bin/env tsx
/**
 * QPFM Harmonic Correlation Verification
 * Tests the actual correlation between harmonic properties and pattern quality
 * without artificial manipulation
 */

import { QuantumProbabilityFieldMemory } from '../src/memory/quantum-memory-system.js';
import { HarmonicAnalysisEngine } from '../src/harmonic-intelligence/core/harmonic-analysis-engine.js';
import { HarmonicEnricher } from '../src/harmonic-intelligence/core/harmonic-enricher.js';
import { GuruCore } from '../src/core/guru.js';
import { HarmonicPatternMemory, PatternCategory } from '../src/memory/types.js';
import { SymbolGraph, Pattern } from '../src/types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

interface HarmonicCorrelationResult {
  correlation: number;
  sampleSize: number;
  significanceLevel: number;
  harmonicScores: number[];
  qualityScores: number[];
  patterns: Array<{
    name: string;
    harmonicScore: number;
    qualityScore: number;
    category: string;
  }>;
}

/**
 * Calculate harmonic score based on actual mathematical properties
 */
function calculateHarmonicScore(pattern: Pattern, symbolGraph: SymbolGraph): number {
  const goldenRatio = 1.618033988749895;
  const pi = 3.141592653589793;
  const e = 2.718281828459045;
  
  let score = 0;
  
  // 1. Golden ratio in structural relationships (25%)
  const dependencies = symbolGraph.getSymbol(pattern.symbolId)?.dependencies || [];
  const dependents = symbolGraph.getSymbol(pattern.symbolId)?.dependents || [];
  if (dependencies.length > 0 && dependents.length > 0) {
    const ratio = Math.max(dependencies.length, dependents.length) / 
                  Math.min(dependencies.length, dependents.length);
    const goldenDeviation = Math.abs(ratio - goldenRatio);
    score += Math.max(0, 0.25 * (1 - goldenDeviation / goldenRatio));
  }
  
  // 2. Fibonacci sequence in occurrence patterns (25%)
  const fibNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  const occurrences = pattern.evidence?.occurrences || 1;
  if (fibNumbers.includes(occurrences)) {
    score += 0.25;
  } else {
    // Partial credit for near-Fibonacci
    const nearest = fibNumbers.reduce((prev, curr) => 
      Math.abs(curr - occurrences) < Math.abs(prev - occurrences) ? curr : prev
    );
    const distance = Math.abs(occurrences - nearest) / nearest;
    score += Math.max(0, 0.25 * (1 - distance));
  }
  
  // 3. Harmonic series in complexity metrics (25%)
  const complexity = pattern.evidence?.metrics?.complexity || 1;
  const harmonicNumber = Array.from({length: Math.floor(complexity)}, (_, i) => 1/(i+1))
    .reduce((sum, n) => sum + n, 0);
  const normalizedHarmonic = harmonicNumber / Math.log(complexity + 1);
  score += normalizedHarmonic * 0.25;
  
  // 4. Mathematical constants in pattern strength (25%)
  const strength = pattern.strength || 0;
  
  // Check for resonance with mathematical constants
  const piResonance = Math.abs(Math.sin(strength * pi));
  const eResonance = Math.abs(Math.cos(strength * e));
  const phiResonance = Math.abs(Math.sin(strength * goldenRatio));
  
  const constantsHarmony = (piResonance + eResonance + phiResonance) / 3;
  score += constantsHarmony * 0.25;
  
  return Math.min(1, score);
}

/**
 * Analyze actual code patterns for harmonic correlation
 */
async function analyzeCodePatterns(): Promise<{patterns: Pattern[], symbolGraph: SymbolGraph}> {
  console.log(chalk.blue('🔍 Analyzing Guru codebase for harmonic patterns...'));
  
  const guru = new GuruCore();
  
  // Analyze core source files
  const srcPath = path.join(process.cwd(), 'src');
  const result = await guru.analyzeCodebase({ path: srcPath });
  
  // Extract patterns from the symbol graph
  const patterns: Pattern[] = [];
  const symbolGraph = result.symbolGraph;
  
  // Get all symbols and their patterns
  for (const symbol of symbolGraph.getAllSymbols()) {
    if (symbol.patterns) {
      for (const pattern of symbol.patterns) {
        patterns.push({
          ...pattern,
          symbolId: symbol.id
        });
      }
    }
  }
  
  console.log(chalk.green(`✅ Found ${patterns.length} patterns in ${symbolGraph.getAllSymbols().length} symbols`));
  
  return { patterns, symbolGraph };
}

/**
 * Load patterns into QPFM and measure correlation
 */
async function measureHarmonicCorrelation(
  patterns: Pattern[],
  symbolGraph: SymbolGraph
): Promise<HarmonicCorrelationResult> {
  console.log(chalk.blue('📊 Measuring harmonic correlation in QPFM...'));
  
  // Initialize QPFM
  const qpfm = new QuantumProbabilityFieldMemory({
    performance: {
      maxMemories: 10000,
      maxSuperpositionSize: 1000,
      cacheEnabled: true
    }
  });
  
  const harmonicScores: number[] = [];
  const qualityScores: number[] = [];
  const patternDetails: any[] = [];
  
  // Load patterns and calculate scores
  for (const pattern of patterns) {
    // Calculate harmonic score
    const harmonicScore = calculateHarmonicScore(pattern, symbolGraph);
    
    // Quality score is the pattern strength/confidence
    const qualityScore = pattern.strength * (pattern.confidence || 1);
    
    harmonicScores.push(harmonicScore);
    qualityScores.push(qualityScore);
    
    patternDetails.push({
      name: `${pattern.type} in ${pattern.symbolId}`,
      harmonicScore,
      qualityScore,
      category: pattern.category || 'unknown'
    });
    
    // Store in QPFM
    const memory: HarmonicPatternMemory = {
      id: `${pattern.symbolId}_${pattern.type}_${Date.now()}`,
      coordinates: [0, 0, 0], // Will be set by QPFM
      content: {
        title: pattern.type,
        description: pattern.description || '',
        type: pattern.category || 'unknown',
        tags: [pattern.type, pattern.category || 'unknown'],
        data: pattern
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: qualityScore,
      harmonicProperties: {
        category: pattern.category as PatternCategory || PatternCategory.STRUCTURAL,
        strength: pattern.strength,
        occurrences: pattern.evidence?.occurrences || 1,
        confidence: pattern.confidence || 0.8,
        complexity: pattern.evidence?.metrics?.complexity || 5
      },
      locations: pattern.locations || [],
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    };
    
    await qpfm.store(memory);
  }
  
  // Calculate Pearson correlation
  const correlation = calculatePearsonCorrelation(harmonicScores, qualityScores);
  const significanceLevel = calculateSignificance(correlation, harmonicScores.length);
  
  console.log(chalk.green(`✅ Analyzed ${patterns.length} patterns`));
  console.log(chalk.cyan(`📊 Harmonic Correlation: r = ${correlation.toFixed(4)}`));
  console.log(chalk.yellow(`🎯 Significance: p < ${significanceLevel.toFixed(4)}`));
  
  // Sort patterns by harmonic score to show examples
  patternDetails.sort((a, b) => b.harmonicScore - a.harmonicScore);
  
  return {
    correlation,
    sampleSize: harmonicScores.length,
    significanceLevel,
    harmonicScores,
    qualityScores,
    patterns: patternDetails.slice(0, 10) // Top 10 patterns
  };
}

/**
 * Calculate Pearson correlation coefficient
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
 * Calculate statistical significance
 */
function calculateSignificance(r: number, n: number): number {
  if (n < 3) return 1;
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  // Simplified p-value approximation
  return Math.exp(-0.717 * t - 0.416 * t * t);
}

/**
 * Main verification
 */
async function verifyHarmonicCorrelation() {
  console.log(chalk.bold.cyan('🎵 QPFM Harmonic Correlation Verification\n'));
  
  try {
    // Analyze codebase
    const { patterns, symbolGraph } = await analyzeCodePatterns();
    
    if (patterns.length === 0) {
      console.log(chalk.red('❌ No patterns found in codebase'));
      return;
    }
    
    // Measure correlation
    const result = await measureHarmonicCorrelation(patterns, symbolGraph);
    
    // Display results
    console.log(chalk.bold.cyan('\n📋 VERIFICATION RESULTS:'));
    console.log(chalk.gray('=' .repeat(50)));
    
    const passed = result.correlation > 0.85;
    console.log(chalk[passed ? 'green' : 'red'](
      `🎯 Harmonic Correlation: r = ${result.correlation.toFixed(4)} (${passed ? '✅ PASSED' : '❌ FAILED'})`
    ));
    
    console.log(chalk.cyan(`📊 Sample Size: ${result.sampleSize} patterns`));
    console.log(chalk.yellow(`📈 Statistical Significance: p < ${result.significanceLevel.toExponential(2)}`));
    
    // Show top harmonic patterns
    console.log(chalk.bold.cyan('\n🌟 Top Harmonic Patterns:'));
    for (const pattern of result.patterns) {
      console.log(chalk.gray(
        `  ${pattern.name}: harmonic=${pattern.harmonicScore.toFixed(3)}, quality=${pattern.qualityScore.toFixed(3)}`
      ));
    }
    
    // Save detailed results
    const outputPath = 'harmonic_correlation_results.json';
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(chalk.cyan(`\n💾 Detailed results saved to ${outputPath}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Verification failed:'), error);
    process.exit(1);
  }
}

// Run verification
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyHarmonicCorrelation()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}