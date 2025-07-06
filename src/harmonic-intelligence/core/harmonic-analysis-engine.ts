/**
 * Harmonic Analysis Engine - Core engine for pattern analysis
 * @module harmonic-intelligence/core
 */

import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory
} from '../interfaces/harmonic-types';
import { Logger } from '../../utils/logger';

// Pattern Analyzers
import { ClassicalHarmonyAnalyzer } from '../analyzers/classical-harmony-analyzer';
import { GeometricHarmonyAnalyzer } from '../analyzers/geometric-harmony-analyzer';
import { FractalPatternAnalyzer } from '../analyzers/fractal-pattern-analyzer';
import { TilingCrystallographicAnalyzer } from '../analyzers/tiling-crystallographic-analyzer';
import { TopologicalPatternAnalyzer } from '../analyzers/topological-pattern-analyzer';
import { WaveHarmonicAnalyzer } from '../analyzers/wave-harmonic-analyzer';
import { InformationTheoryAnalyzer } from '../analyzers/information-theory-analyzer';

/**
 * Options for harmonic analysis
 */
export interface AnalysisOptions {
  categories?: PatternCategory[];
  parallel?: boolean;
}

/**
 * Engine for running harmonic pattern analysis
 */
export class HarmonicAnalysisEngine {
  private readonly logger = new Logger('HarmonicAnalysisEngine');
  
  // Pattern analyzers
  private readonly analyzers: Map<PatternCategory, any>;
  
  constructor() {
    // Initialize analyzers map
    this.analyzers = new Map<PatternCategory, any>();
    this.analyzers.set(PatternCategory.CLASSICAL_HARMONY, new ClassicalHarmonyAnalyzer());
    this.analyzers.set(PatternCategory.GEOMETRIC_HARMONY, new GeometricHarmonyAnalyzer());
    this.analyzers.set(PatternCategory.FRACTAL_PATTERNS, new FractalPatternAnalyzer());
    this.analyzers.set(PatternCategory.TILING_CRYSTALLOGRAPHIC, new TilingCrystallographicAnalyzer());
    this.analyzers.set(PatternCategory.TOPOLOGICAL_PATTERNS, new TopologicalPatternAnalyzer());
    this.analyzers.set(PatternCategory.WAVE_HARMONIC_PATTERNS, new WaveHarmonicAnalyzer());
    this.analyzers.set(PatternCategory.INFORMATION_THEORY, new InformationTheoryAnalyzer());
    
    this.logger.info('Harmonic Analysis Engine initialized');
  }
  
  /**
   * Analyze semantic data and return harmonic scores
   */
  async analyze(
    semanticData: SemanticData, 
    options: AnalysisOptions = {}
  ): Promise<any[]> {
    const startTime = Date.now();
    this.logger.info('Starting harmonic analysis');
    
    try {
      // Determine which analyzers to run
      const categoriesToRun = options.categories || Array.from(this.analyzers.keys());
      const analyzersToRun = categoriesToRun
        .filter(cat => this.analyzers.has(cat))
        .map(cat => ({ category: cat, analyzer: this.analyzers.get(cat)! }));
      
      // Run analysis
      const patternScores = options.parallel
        ? await this.runParallel(analyzersToRun, semanticData)
        : await this.runSequential(analyzersToRun, semanticData);
      
      // Create harmonic scores
      const harmonicScores: any[] = [{
        category: 'combined',
        patterns: patternScores,
        timestamp: Date.now()
      }];
      
      const duration = Date.now() - startTime;
      this.logger.info(`Harmonic analysis completed in ${duration}ms`);
      
      return harmonicScores;
      
    } catch (error) {
      this.logger.error('Harmonic analysis failed', error);
      throw new Error(`Harmonic analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Run analyzers in parallel
   */
  private async runParallel(
    analyzersToRun: Array<{ category: PatternCategory; analyzer: any }>,
    semanticData: SemanticData
  ): Promise<Map<PatternType, PatternScore>> {
    const promises = analyzersToRun.map(({ analyzer }) => 
      analyzer.analyze(semanticData)
    );
    
    const results = await Promise.all(promises);
    
    // Merge all pattern scores
    const patternScores = new Map<PatternType, PatternScore>();
    for (const result of results) {
      for (const [pattern, score] of result) {
        patternScores.set(pattern, score);
      }
    }
    
    return patternScores;
  }
  
  /**
   * Run analyzers sequentially
   */
  private async runSequential(
    analyzersToRun: Array<{ category: PatternCategory; analyzer: any }>,
    semanticData: SemanticData
  ): Promise<Map<PatternType, PatternScore>> {
    const patternScores = new Map<PatternType, PatternScore>();
    
    for (const { analyzer } of analyzersToRun) {
      const result = await analyzer.analyze(semanticData);
      for (const [pattern, score] of result) {
        patternScores.set(pattern, score);
      }
    }
    
    return patternScores;
  }
}