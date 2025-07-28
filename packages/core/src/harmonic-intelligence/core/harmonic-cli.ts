/**
 * CLI interface for Harmonic Intelligence
 * Provides targeted pattern analysis for AI models
 */

import { SymbolGraphBuilder } from '../../parsers/symbol-graph.js';
import { HarmonicEnricher } from './harmonic-enricher.js';
import { PatternType } from '../interfaces/harmonic-types';

export interface HarmonicAnalysisOptions {
  path: string;
  patterns?: string[];  // Specific patterns to detect
  symbols?: string[];   // Specific symbols to analyze
  maxDepth?: number;    // Limit analysis depth
  includeEvidence?: boolean; // Include detailed evidence
  format?: 'json' | 'summary' | 'raw';
  
  // OUTPUT FILTERING OPTIONS
  confidenceThreshold?: number;  // Filter patterns by minimum confidence (0-1)
  maxPatternsPerSymbol?: number; // Limit patterns per symbol
  excludeCategories?: string[];  // Skip pattern categories
  summaryOnly?: boolean;         // Return only high-level summary
}

export interface HarmonicAnalysisResult {
  metadata: {
    path: string;
    filesAnalyzed: number;
    symbolsAnalyzed: number;
    patternsDetected: number;
    analysisTime: number;
  };
  patterns: {
    [symbolId: string]: {
      symbol: {
        name: string;
        type: string;
        location: {
          file: string;
          line: number;
        };
      };
      detectedPatterns: Array<{
        pattern: string;
        category: string;
        score: number;
        confidence: number;
        evidence?: any[];
      }>;
    };
  };
}

export class HarmonicCLI {
  /**
   * Analyze specific files or directories for harmonic patterns
   * Returns raw pattern data optimized for AI consumption
   */
  async analyze(options: HarmonicAnalysisOptions): Promise<HarmonicAnalysisResult> {
    const startTime = Date.now();
    
    // Build complete symbol graph for target path
    const builder = new SymbolGraphBuilder(true); // quiet mode
    const symbolGraph = await builder.build({
      path: options.path,
      includeTests: false,
      analyzeAll: true  // Analyze all files for Harmonic Intelligence
    });
    
    // Filter symbols if specific ones requested
    if (options.symbols && options.symbols.length > 0) {
      const requestedSymbols = new Set(options.symbols);
      const filteredSymbols = new Map();
      
      for (const [id, symbol] of symbolGraph.symbols) {
        if (requestedSymbols.has(symbol.name) || requestedSymbols.has(id)) {
          filteredSymbols.set(id, symbol);
        }
      }
      
      symbolGraph.symbols = filteredSymbols;
    }
    
    // Run harmonic analysis
    const enricher = new HarmonicEnricher();
    const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph, {
      parallel: true,
      debug: false
    });
    
    // Check if summary-only mode requested
    if (options.summaryOnly) {
      return this.buildSummaryResult(options.path, symbolGraph, enrichedGraph, startTime);
    }
    
    // Extract results
    const result: HarmonicAnalysisResult = {
      metadata: {
        path: options.path,
        filesAnalyzed: symbolGraph.metadata.analyzedFiles.length,
        symbolsAnalyzed: enrichedGraph.getAllEnrichedSymbols().length,
        patternsDetected: 0,
        analysisTime: Date.now() - startTime
      },
      patterns: {}
    };
    
    // Build pattern data for each symbol
    const allSymbols = enrichedGraph.getAllEnrichedSymbols();
    
    for (const symbolData of allSymbols) {
      if (!symbolData.detectedPatternCount || symbolData.detectedPatternCount === 0) {
        continue;
      }
      
      const patterns: Array<{
        pattern: string;
        category: string;
        score: number;
        confidence: number;
        evidence?: any[];
      }> = [];
      
      if (symbolData.harmonicScores) {
        for (const [category, scores] of Object.entries(symbolData.harmonicScores)) {
          // Skip excluded categories
          if (options.excludeCategories && options.excludeCategories.includes(category)) {
            continue;
          }
          
          for (const score of scores || []) {
            if (score.detected) {
              // Filter by requested patterns if specified
              if (options.patterns && !options.patterns.includes(score.patternName)) {
                continue;
              }
              
              // Filter by confidence threshold
              if (options.confidenceThreshold && score.confidence < options.confidenceThreshold) {
                continue;
              }
              
              patterns.push({
                pattern: score.patternName,
                category,
                score: score.score,
                confidence: score.confidence,
                evidence: options.includeEvidence ? this.compressEvidence(score.evidence) : undefined
              });
              
              result.metadata.patternsDetected++;
            }
          }
        }
      }
      
      // Limit patterns per symbol if specified
      if (options.maxPatternsPerSymbol && patterns.length > options.maxPatternsPerSymbol) {
        // Sort by confidence * score and take top N
        patterns.sort((a, b) => (b.confidence * b.score) - (a.confidence * a.score));
        patterns.splice(options.maxPatternsPerSymbol);
      }
      
      if (patterns.length > 0) {
        result.patterns[symbolData.symbol.id] = {
          symbol: {
            name: symbolData.symbol.name,
            type: symbolData.symbol.type,
            location: {
              file: symbolData.symbol.location.file,
              line: symbolData.symbol.location.startLine
            }
          },
          detectedPatterns: patterns
        };
      }
    }
    
    return result;
  }
  
  /**
   * Get pattern summary for a file or directory
   * Optimized for quick AI understanding
   */
  async summarize(path: string): Promise<any> {
    const result = await this.analyze({
      path,
      includeEvidence: false,
      format: 'summary'
    });
    
    // Build summary
    const summary = {
      path,
      overview: {
        files: result.metadata.filesAnalyzed,
        symbols: result.metadata.symbolsAnalyzed,
        patternsFound: result.metadata.patternsDetected
      },
      patternDistribution: {} as any,
      topPatterns: [] as any[],
      architecturalInsights: [] as string[]
    };
    
    // Count patterns
    const patternCounts = new Map<string, number>();
    for (const symbolData of Object.values(result.patterns)) {
      for (const pattern of symbolData.detectedPatterns) {
        patternCounts.set(pattern.pattern, (patternCounts.get(pattern.pattern) || 0) + 1);
      }
    }
    
    // Top patterns
    summary.topPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
    
    // Pattern distribution by category
    const categoryMap = new Map<string, number>();
    for (const symbolData of Object.values(result.patterns)) {
      for (const pattern of symbolData.detectedPatterns) {
        categoryMap.set(pattern.category, (categoryMap.get(pattern.category) || 0) + 1);
      }
    }
    summary.patternDistribution = Object.fromEntries(categoryMap);
    
    // Architectural insights based on patterns
    if (patternCounts.has('network_topology')) {
      summary.architecturalInsights.push('Complex network topology detected - consider modularization');
    }
    if (patternCounts.has('l_system_growth')) {
      summary.architecturalInsights.push('Recursive growth patterns found - check for unbounded recursion');
    }
    if (patternCounts.has('golden_ratio_patterns')) {
      summary.architecturalInsights.push('Golden ratio proportions detected - well-balanced architecture');
    }
    
    return summary;
  }
  
  /**
   * Find symbols exhibiting specific patterns
   * Useful for AI to locate code with certain mathematical properties
   */
  async findByPattern(path: string, patterns: string[]): Promise<any> {
    const result = await this.analyze({
      path,
      patterns,
      includeEvidence: false
    });
    
    const matches = [];
    for (const [symbolId, data] of Object.entries(result.patterns)) {
      const matchedPatterns = data.detectedPatterns
        .filter(p => patterns.includes(p.pattern))
        .map(p => p.pattern);
      
      if (matchedPatterns.length > 0) {
        matches.push({
          symbol: data.symbol,
          patterns: matchedPatterns
        });
      }
    }
    
    return {
      query: patterns,
      matches,
      totalMatches: matches.length
    };
  }
  
  /**
   * Get pattern context for a specific symbol
   * Minimal context for AI understanding
   */
  async getSymbolContext(path: string, symbolName: string): Promise<any> {
    const result = await this.analyze({
      path,
      symbols: [symbolName],
      includeEvidence: true
    });
    
    const symbolData = Object.values(result.patterns)[0];
    if (!symbolData) {
      return { error: `Symbol '${symbolName}' not found or has no patterns` };
    }
    
    return {
      symbol: symbolData.symbol,
      patterns: symbolData.detectedPatterns,
      context: {
        relatedSymbols: [], // Could be enhanced to find related symbols
        architecturalRole: this.inferArchitecturalRole(symbolData.detectedPatterns)
      }
    };
  }
  
  private inferArchitecturalRole(patterns: Array<{pattern: string}>): string {
    const patternNames = patterns.map(p => p.pattern);
    
    if (patternNames.includes('network_topology')) {
      return 'Network hub or connector';
    }
    if (patternNames.includes('golden_ratio_patterns')) {
      return 'Well-proportioned component';
    }
    if (patternNames.includes('fractal_self_similarity')) {
      return 'Self-similar recursive structure';
    }
    if (patternNames.includes('shannon_entropy')) {
      return 'Information-rich component';
    }
    
    return 'Standard component';
  }
  
  /**
   * Compress evidence data to remove redundancy and reduce size
   */
  private compressEvidence(evidence: any[]): any[] {
    if (!evidence || evidence.length === 0) {
      return [];
    }
    
    // Group evidence by type and compress duplicates
    const groupedEvidence = new Map<string, {count: number, examples: any[]}>();
    
    for (const item of evidence) {
      const key = `${item.type}_${item.weight || 0}_${item.value || 'none'}`;
      
      if (!groupedEvidence.has(key)) {
        groupedEvidence.set(key, {
          count: 0,
          examples: []
        });
      }
      
      const group = groupedEvidence.get(key)!;
      group.count++;
      
      // Only keep first 2 examples to avoid massive repetition
      if (group.examples.length < 2) {
        group.examples.push(item);
      }
    }
    
    // Convert back to compressed format
    const compressed = [];
    for (const [key, group] of groupedEvidence) {
      if (group.count === 1) {
        // Single occurrence - keep as is
        compressed.push(group.examples[0]);
      } else {
        // Multiple occurrences - create summary
        const example = group.examples[0];
        compressed.push({
          ...example,
          description: `${example.description} (x${group.count})`,
          compressed: true,
          count: group.count
        });
      }
    }
    
    // Limit total evidence items to prevent huge arrays
    return compressed.slice(0, 10);
  }
  
  /**
   * Build compact summary result to drastically reduce output size
   */
  private buildSummaryResult(path: string, symbolGraph: any, enrichedGraph: any, startTime: number): HarmonicAnalysisResult {
    const allSymbols = enrichedGraph.getAllEnrichedSymbols();
    
    // Count patterns by category and type
    const patternCounts = new Map<string, number>();
    const categoryTotals = new Map<string, number>();
    let totalPatterns = 0;
    let symbolsWithPatterns = 0;
    
    for (const symbolData of allSymbols) {
      if (!symbolData.detectedPatternCount || symbolData.detectedPatternCount === 0) {
        continue;
      }
      
      symbolsWithPatterns++;
      
      if (symbolData.harmonicScores) {
        for (const [category, scores] of Object.entries(symbolData.harmonicScores)) {
          for (const score of scores || []) {
            if (score.detected) {
              patternCounts.set(score.patternName, (patternCounts.get(score.patternName) || 0) + 1);
              categoryTotals.set(category, (categoryTotals.get(category) || 0) + 1);
              totalPatterns++;
            }
          }
        }
      }
    }
    
    // Build compact summary with only top patterns
    const topPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Only top 10 patterns
      .map(([pattern, count]) => ({ pattern, count }));
    
    return {
      metadata: {
        path,
        filesAnalyzed: symbolGraph.metadata.analyzedFiles.length,
        symbolsAnalyzed: allSymbols.length,
        patternsDetected: totalPatterns,
        analysisTime: Date.now() - startTime
      },
      patterns: {
        // Instead of full pattern data, provide compact summary
        '_summary': {
          symbol: {
            name: 'SUMMARY',
            type: 'summary',
            location: { file: 'multiple', line: 0 }
          },
          detectedPatterns: [
            {
              pattern: 'summary_stats',
              category: 'meta',
              score: symbolsWithPatterns / allSymbols.length,
              confidence: 1,
              evidence: [
                { type: 'top_patterns', data: topPatterns },
                { type: 'category_distribution', data: Object.fromEntries(categoryTotals) },
                { type: 'coverage', data: { symbolsWithPatterns, totalSymbols: allSymbols.length } }
              ]
            }
          ]
        }
      } as any
    };
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new HarmonicCLI();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  harmonic analyze <path> [--patterns pattern1,pattern2] [--symbols symbol1,symbol2]');
    console.log('  harmonic summarize <path>');
    console.log('  harmonic find-pattern <path> <pattern1,pattern2,...>');
    console.log('  harmonic symbol-context <path> <symbolName>');
    process.exit(1);
  }
  
  const command = args[0];
  const path = args[1] || '.';
  
  (async () => {
    try {
      switch (command) {
        case 'analyze': {
          const patterns = args.find(a => a.startsWith('--patterns'))?.split('=')[1]?.split(',');
          const symbols = args.find(a => a.startsWith('--symbols'))?.split('=')[1]?.split(',');
          const result = await cli.analyze({ path, patterns, symbols });
          console.log(JSON.stringify(result, null, 2));
          break;
        }
        
        case 'summarize': {
          const summary = await cli.summarize(path);
          console.log(JSON.stringify(summary, null, 2));
          break;
        }
        
        case 'find-pattern': {
          const patterns = args[2]?.split(',') || [];
          const matches = await cli.findByPattern(path, patterns);
          console.log(JSON.stringify(matches, null, 2));
          break;
        }
        
        case 'symbol-context': {
          const symbolName = args[2];
          const context = await cli.getSymbolContext(path, symbolName);
          console.log(JSON.stringify(context, null, 2));
          break;
        }
        
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}