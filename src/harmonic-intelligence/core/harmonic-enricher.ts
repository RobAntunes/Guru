/**
 * Harmonic Enricher - Augments symbol graph with harmonic intelligence
 * Rather than transforming data, this enriches symbols with harmonic pattern analysis
 * @module harmonic-intelligence/core
 */

import { Logger } from '../../utils/logger.js';
import { SymbolGraph, SymbolNode, SymbolEdge } from '../../types/index.js';
import { 
  SemanticData,
  PatternType, 
  PatternScore,
  PatternCategory,
  BehaviorAnalysis,
  ArchitecturalLayers,
  HarmonicSymbol
} from '../interfaces/harmonic-types';
import { HarmonicAnalysisEngine } from './harmonic-analysis-engine.js';

/**
 * Enriched symbol data combining original symbol information with harmonic analysis
 */
export interface HarmonicSymbolData {
  // Original symbol graph node - unchanged
  symbol: SymbolNode;
  
  // Harmonic intelligence results mapped to this symbol
  harmonicScores?: {
    classical?: PatternScore[];
    geometric?: PatternScore[];
    fractal?: PatternScore[];
    tiling?: PatternScore[];
    topological?: PatternScore[];
    wave?: PatternScore[];
    information?: PatternScore[];
  };
  
  // Raw pattern detection count (no aggregation)
  detectedPatternCount?: number;
  
  // Deprecated - kept for compatibility but not calculated
  overallHarmonicScore?: number;
  
  // Links to patterns this symbol participates in
  participatesIn?: {
    patternType: PatternType;
    patternId: string;
    role: string; // 'hub', 'node', 'center', 'focal-point', etc.
    score: number; // Raw pattern score (0-1)
  }[];
}

/**
 * Enriched symbol graph with harmonic intelligence
 */
export class EnrichedSymbolGraph {
  private harmonicData: Map<string, HarmonicSymbolData>;
  
  constructor(
    private readonly symbolGraph: SymbolGraph,
    harmonicData: Map<string, HarmonicSymbolData>
  ) {
    this.harmonicData = harmonicData;
  }
  
  /**
   * Get enriched data for a symbol
   */
  getEnrichedSymbol(symbolId: string): HarmonicSymbolData | undefined {
    return this.harmonicData.get(symbolId);
  }
  
  /**
   * Get all symbols with harmonic data
   */
  getAllEnrichedSymbols(): HarmonicSymbolData[] {
    return Array.from(this.harmonicData.values());
  }
  
  /**
   * Query builder for complex searches
   */
  query(): EnrichedGraphQuery {
    return new EnrichedGraphQuery(this);
  }
  
  /**
   * Get original symbol graph
   */
  getSymbolGraph(): SymbolGraph {
    return this.symbolGraph;
  }
  
  /**
   * Find symbols by pattern participation
   */
  findSymbolsByPattern(patternType: PatternType, minStrength: number = 0): HarmonicSymbolData[] {
    return this.getAllEnrichedSymbols().filter(data => 
      data.participatesIn?.some(p => 
        p.patternType === patternType && p.strength >= minStrength
      )
    );
  }
  
  /**
   * Get pattern statistics
   */
  getPatternStatistics(): Map<PatternType, { count: number; avgScore: number }> {
    const stats = new Map<PatternType, { count: number; totalScore: number }>();
    
    for (const data of this.harmonicData.values()) {
      for (const category of Object.values(data.harmonicScores || {})) {
        for (const score of category || []) {
          if (score.detected) {
            const current = stats.get(score.patternName as PatternType) || { count: 0, totalScore: 0 };
            current.count++;
            current.totalScore += score.score;
            stats.set(score.patternName as PatternType, current);
          }
        }
      }
    }
    
    // Convert to averages
    const result = new Map<PatternType, { count: number; avgScore: number }>();
    for (const [type, data] of stats) {
      result.set(type, {
        count: data.count,
        avgScore: data.count > 0 ? data.totalScore / data.count : 0
      });
    }
    
    return result;
  }
}

/**
 * Query builder for enriched symbol graph
 */
export class EnrichedGraphQuery {
  private symbolFilters: Array<(symbol: SymbolNode) => boolean> = [];
  private harmonicFilters: Array<(data: HarmonicSymbolData) => boolean> = [];
  private patternFilters: Array<{ type?: PatternType; role?: string; minStrength?: number }> = [];
  
  constructor(private graph: EnrichedSymbolGraph) {}
  
  /**
   * Filter by symbol properties
   */
  whereSymbol(predicate: (symbol: SymbolNode) => boolean): this {
    this.symbolFilters.push(predicate);
    return this;
  }
  
  /**
   * Filter by harmonic properties
   */
  whereHarmonic(predicate: (data: HarmonicSymbolData) => boolean): this {
    this.harmonicFilters.push(predicate);
    return this;
  }
  
  /**
   * Filter by pattern participation
   */
  wherePattern(type: PatternType, options?: { role?: string; minStrength?: number }): this {
    this.patternFilters.push({ type, ...options });
    return this;
  }
  
  /**
   * Execute query and get results
   */
  get(): HarmonicSymbolData[] {
    return this.graph.getAllEnrichedSymbols().filter(data => {
      // Apply symbol filters
      if (!this.symbolFilters.every(f => f(data.symbol))) {
        return false;
      }
      
      // Apply harmonic filters
      if (!this.harmonicFilters.every(f => f(data))) {
        return false;
      }
      
      // Apply pattern filters
      for (const filter of this.patternFilters) {
        const participation = data.participatesIn?.find(p => {
          if (filter.type && p.patternType !== filter.type) return false;
          if (filter.role && p.role !== filter.role) return false;
          if (filter.minStrength && p.strength < filter.minStrength) return false;
          return true;
        });
        
        if (!participation) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Get just the symbols (not enriched data)
   */
  getSymbols(): SymbolNode[] {
    return this.get().map(data => data.symbol);
  }
  
  /**
   * Count matching results
   */
  count(): number {
    return this.get().length;
  }
}

/**
 * Main enricher class that adds harmonic intelligence to symbol graphs
 */
export class HarmonicEnricher {
  private readonly logger = new Logger('HarmonicEnricher');
  private harmonicEngine: HarmonicAnalysisEngine;
  private harmonicResults: Map<string, HarmonicSymbolData> = new Map();
  
  constructor() {
    this.harmonicEngine = new HarmonicAnalysisEngine();
  }
  
  /**
   * Enrich a symbol graph with harmonic intelligence
   */
  async enrichSymbolGraph(
    symbolGraph: SymbolGraph,
    options?: {
      categories?: PatternCategory[];
      parallel?: boolean;
    }
  ): Promise<EnrichedSymbolGraph> {
    this.logger.info('Starting harmonic enrichment of symbol graph');
    
    // Initialize harmonic data for all symbols
    this.initializeHarmonicData(symbolGraph);
    
    // Create semantic data view (adapter pattern - no data copying)
    const semanticView = this.createSemanticDataView(symbolGraph);
    
    // Run harmonic analysis
    const scores = await this.harmonicEngine.analyze(semanticView, {
      categories: options?.categories,
      parallel: options?.parallel ?? true
    });
    
    // Map results back to symbols
    this.mapResultsToSymbols(scores, symbolGraph);
    
    // Identify pattern participation
    this.identifyPatternParticipation(scores, semanticView);
    
    // Calculate overall scores
    this.calculateOverallScores();
    
    this.logger.info(`Enrichment complete. Analyzed ${this.harmonicResults.size} symbols.`);
    
    return new EnrichedSymbolGraph(symbolGraph, this.harmonicResults);
  }
  
  /**
   * Initialize harmonic data structure for all symbols
   */
  private initializeHarmonicData(symbolGraph: SymbolGraph): void {
    // Get list of analyzed files from metadata
    const analyzedFiles = new Set(symbolGraph.metadata.analyzedFiles);
    
    for (const node of Array.from(symbolGraph.symbols.values())) {
      // Only analyze symbols defined in the target files
      if (analyzedFiles.has(node.location.file)) {
        this.harmonicResults.set(node.id, {
          symbol: node,
          harmonicScores: {},
          participatesIn: []
        });
      }
    }
    
    this.logger.debug(`Initialized harmonic data for ${this.harmonicResults.size} symbols from ${analyzedFiles.size} files`);
  }
  
  /**
   * Create a semantic data view of the symbol graph
   * Uses adapter pattern to avoid data duplication
   */
  private createSemanticDataView(symbolGraph: SymbolGraph): SemanticData {
    return {
      symbols: new SymbolMapAdapter(symbolGraph) as Map<string, HarmonicSymbol>,
      relationships: new RelationshipAdapter(symbolGraph),
      behaviors: new BehaviorAdapter(symbolGraph),
      structure: new StructureAdapter(symbolGraph)
    };
  }
  
  /**
   * Map harmonic analysis results back to individual symbols
   */
  private mapResultsToSymbols(scores: any[], symbolGraph: SymbolGraph): void {
    // Don't map to all symbols - let identifyPatternParticipation handle it
    // This method is now a no-op, patterns will be mapped via participation
  }
  
  /**
   * Identify which symbols participate in which patterns
   */
  private identifyPatternParticipation(scores: any[], semanticData: SemanticData): void {
    for (const score of scores) {
      for (const [patternType, patternScore] of score.patterns) {
        if (!patternScore.detected) continue;
        
        // Add the pattern score to the participating symbols
        const participatingSymbolIds = this.findParticipatingSymbols(
          patternScore,
          patternType,
          semanticData
        );
        
        for (const symbolId of participatingSymbolIds) {
          const harmonicData = this.harmonicResults.get(symbolId);
          if (harmonicData) {
            // Initialize scores if needed
            if (!harmonicData.harmonicScores) {
              harmonicData.harmonicScores = {};
            }
            
            const categoryKey = this.getCategoryKey(patternScore.category);
            if (!harmonicData.harmonicScores[categoryKey]) {
              harmonicData.harmonicScores[categoryKey] = [];
            }
            
            // Add this pattern score to this specific symbol
            harmonicData.harmonicScores[categoryKey].push(patternScore);
            
            // Track participation
            if (!harmonicData.participatesIn) {
              harmonicData.participatesIn = [];
            }
            
            harmonicData.participatesIn.push({
              patternType,
              patternId: `${patternType}-${Date.now()}`,
              role: 'participant',
              score: patternScore.score
            });
          }
        }
      }
    }
  }
  
  /**
   * Find which symbols participate in a detected pattern
   */
  private findParticipatingSymbols(
    patternScore: any,
    patternType: PatternType | string,
    semanticData: SemanticData
  ): string[] {
    const symbolIds: string[] = [];
    
    // Extract symbol references from evidence
    if (patternScore.evidence && Array.isArray(patternScore.evidence)) {
      for (const evidence of patternScore.evidence) {
        // Look for symbol references in evidence
        if (evidence.symbolId) {
          symbolIds.push(evidence.symbolId);
        }
        
        // Look for symbol names in evidence descriptions
        if (evidence.description) {
          // Try to match symbol names from the semantic data
          for (const [symbolId, symbol] of semanticData.symbols) {
            if (evidence.description.includes(symbol.name)) {
              symbolIds.push(symbolId);
            }
          }
        }
      }
    }
    
    // If no specific symbols found in evidence, apply pattern-specific logic
    if (symbolIds.length === 0) {
      symbolIds.push(...this.inferParticipatingSymbols(patternType, semanticData));
    }
    
    // Return unique symbol IDs
    return [...new Set(symbolIds)];
  }
  
  /**
   * Infer participating symbols based on pattern type
   */
  private inferParticipatingSymbols(
    patternType: PatternType | string,
    semanticData: SemanticData
  ): string[] {
    const participants: string[] = [];
    
    switch (patternType) {
      case PatternType.NETWORK_TOPOLOGY:
      case 'network_topology':
        // For network patterns, include highly connected symbols
        for (const [symbolId, connections] of semanticData.relationships) {
          if (connections.length > 5) {
            participants.push(symbolId);
          }
        }
        break;
        
      case PatternType.GOLDEN_RATIO:
        // For golden ratio, symbols with specific size ratios participate
        // This would need more sophisticated analysis
        break;
        
      // Add more pattern-specific logic here
    }
    
    return participants;
  }
  
  /**
   * Store raw pattern data without aggregation
   * Let the AI model interpret the patterns
   */
  private calculateOverallScores(): void {
    // Skip calculation - we want raw pattern data
    // Each symbol now has its raw harmonicScores with all detected patterns
    // The AI model will interpret these patterns directly
    
    for (const harmonicData of this.harmonicResults.values()) {
      // Just count detected patterns for basic sorting/filtering
      let detectedCount = 0;
      
      for (const scores of Object.values(harmonicData.harmonicScores || {})) {
        for (const score of scores || []) {
          if (score.detected) {
            detectedCount++;
          }
        }
      }
      
      // Store count for reference, but no aggregated score
      harmonicData.detectedPatternCount = detectedCount;
    }
  }
  
  /**
   * Get category key from pattern category
   */
  private getCategoryKey(category: PatternCategory): keyof NonNullable<HarmonicSymbolData['harmonicScores']> {
    switch (category) {
      case PatternCategory.CLASSICAL_HARMONY:
        return 'classical';
      case PatternCategory.GEOMETRIC_HARMONY:
        return 'geometric';
      case PatternCategory.FRACTAL_PATTERNS:
        return 'fractal';
      case PatternCategory.TILING_CRYSTALLOGRAPHIC:
        return 'tiling';
      case PatternCategory.TOPOLOGICAL_PATTERNS:
        return 'topological';
      case PatternCategory.WAVE_HARMONIC_PATTERNS:
        return 'wave';
      case PatternCategory.INFORMATION_THEORY:
        return 'information';
      default:
        return 'classical'; // fallback
    }
  }
}

/**
 * Adapter to present symbol graph as a Map for SemanticData
 */
class SymbolMapAdapter implements Map<string, any> {
  private symbolMap: Map<string, any>;
  
  constructor(private symbolGraph: SymbolGraph) {
    this.symbolMap = new Map();
    
    // Create adapted symbols on initialization
    for (const node of Array.from(symbolGraph.symbols.values())) {
      this.symbolMap.set(node.id, {
        id: node.id,
        name: node.name,
        kind: node.type.toString(), // Map 'type' to 'kind'
        line: node.location.startLine,
        endLine: node.location.endLine || node.location.startLine,
        filePath: node.location.file,
        // Add more mappings as needed
      });
    }
  }
  
  // Implement Map interface
  get size(): number { return this.symbolMap.size; }
  clear(): void { throw new Error('Read-only adapter'); }
  delete(key: string): boolean { throw new Error('Read-only adapter'); }
  forEach(callbackfn: (value: any, key: string, map: Map<string, any>) => void): void {
    this.symbolMap.forEach(callbackfn);
  }
  get(key: string): any { return this.symbolMap.get(key); }
  has(key: string): boolean { return this.symbolMap.has(key); }
  set(key: string, value: any): this { throw new Error('Read-only adapter'); }
  entries(): MapIterator<[string, any]> { return this.symbolMap.entries(); }
  keys(): MapIterator<string> { return this.symbolMap.keys(); }
  values(): MapIterator<any> { return this.symbolMap.values(); }
  [Symbol.iterator](): MapIterator<[string, any]> { return this.symbolMap[Symbol.iterator](); }
  [Symbol.toStringTag]: string = 'SymbolMapAdapter';
}

/**
 * Adapter to present symbol relationships
 */
class RelationshipAdapter implements Map<string, any[]> {
  private relationshipMap: Map<string, any[]>;
  
  constructor(private symbolGraph: SymbolGraph) {
    this.relationshipMap = new Map();
    
    // Build relationships from symbol dependencies
    for (const node of Array.from(symbolGraph.symbols.values())) {
      if (node.dependencies.length > 0) {
        this.relationshipMap.set(node.id, node.dependencies);
      }
    }
  }
  
  // Implement Map interface
  get size(): number { return this.relationshipMap.size; }
  clear(): void { throw new Error('Read-only adapter'); }
  delete(key: string): boolean { throw new Error('Read-only adapter'); }
  forEach(callbackfn: (value: any[], key: string, map: Map<string, any[]>) => void): void {
    this.relationshipMap.forEach(callbackfn);
  }
  get(key: string): any[] | undefined { return this.relationshipMap.get(key); }
  has(key: string): boolean { return this.relationshipMap.has(key); }
  set(key: string, value: any[]): this { throw new Error('Read-only adapter'); }
  entries(): MapIterator<[string, any[]]> { return this.relationshipMap.entries(); }
  keys(): MapIterator<string> { return this.relationshipMap.keys(); }
  values(): MapIterator<any[]> { return this.relationshipMap.values(); }
  [Symbol.iterator](): MapIterator<[string, any[]]> { return this.relationshipMap[Symbol.iterator](); }
  [Symbol.toStringTag]: string = 'RelationshipAdapter';
}

/**
 * Adapter to extract behaviors from symbol graph
 */
class BehaviorAdapter implements BehaviorAnalysis {
  executionFlows: any[] = [];
  dataFlows: any[] = [];
  controlFlows: any[] = [];
  
  constructor(private symbolGraph: SymbolGraph) {
    // Extract behaviors from edges and execution traces
    const edges = symbolGraph.edges;
    
    for (const edge of edges) {
      switch (edge.type) {
        case 'calls':
          this.executionFlows.push({
            from: edge.from,
            to: edge.to,
            type: edge.type
          });
          break;
          
        case 'uses':
        case 'references':
          this.dataFlows.push({
            from: edge.from,
            to: edge.to,
            type: edge.type
          });
          break;
          
        case 'imports':
        case 'inherits':
        case 'implements':
          this.controlFlows.push({
            from: edge.from,
            to: edge.to,
            type: edge.type
          });
          break;
      }
    }
  }
}

/**
 * Adapter to extract architectural structure
 */
class StructureAdapter implements ArchitecturalLayers {
  files: string[] = [];
  packages: string[] = [];
  namespaces: string[] = [];
  modules: string[] = [];
  
  constructor(private symbolGraph: SymbolGraph) {
    const fileSet = new Set<string>();
    const packageSet = new Set<string>();
    const moduleSet = new Set<string>();
    
    // Extract unique files and derive packages/modules
    for (const node of Array.from(symbolGraph.symbols.values())) {
      fileSet.add(node.location.file);
      
      // Extract package from file path
      const pathParts = node.location.file.split('/');
      if (pathParts.length > 1) {
        packageSet.add(pathParts[0]);
        
        // Assume second level is module
        if (pathParts.length > 2) {
          moduleSet.add(pathParts[1]);
        }
      }
    }
    
    this.files = Array.from(fileSet).sort();
    this.packages = Array.from(packageSet).sort();
    this.modules = Array.from(moduleSet).sort();
  }
}