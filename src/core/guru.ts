/**
 * GuruCore - The main intelligence engine for code analysis
 * 
 * This class orchestrates symbol graph building, execution tracing,
 * and purpose inference to provide deep code understanding.
 */

import { 
  AnalysisResult, 
  SymbolGraph, 
  ExecutionTrace, 
  CodePurpose,
  GoalSpecification 
} from '../types/index.js';
import { SymbolGraphBuilder } from '../parsers/symbol-graph.js';
import { ExecutionTracer } from '../intelligence/execution-tracer.js';
import { PurposeInferrer } from '../intelligence/purpose-inferrer.js';
import { PatternDetector } from '../intelligence/pattern-detector.js';
import { ChangeImpactAnalyzer, ChangeImpact, ImpactContext } from '../intelligence/change-impact-analyzer.js';
import YAML from 'yaml';
import { PatternMiningEngine } from '../intelligence/pattern-mining-engine.js';
import { PerformanceAnalyzer } from '../intelligence/performance-analyzer.js';
import { MemoryIntelligenceEngine } from '../intelligence/memory-intelligence-engine.js';
import { SelfReflectionEngine, FeedbackOrchestrator } from '../intelligence/self-reflection-engine.js';

export interface AnalyzeCodebaseParams {
  path: string;
  language?: string;
  includeTests?: boolean;
  goalSpec?: string;
}

export interface TraceExecutionParams {
  entryPoint: string;
  maxDepth?: number;
  followBranches?: boolean;
}

export interface InferPurposeParams {
  symbolId?: string;
  codeBlock?: string;
  context?: string;
}

export interface GetSymbolGraphParams {
  format?: 'json' | 'dot' | 'mermaid';
  scope?: string;
  includeBuiltins?: boolean;
}

export interface FindRelatedCodeParams {
  query: string;
  similarity?: number;
  limit?: number;
}

export class GuruCore {
  private symbolGraphBuilder: SymbolGraphBuilder;
  private executionTracer: ExecutionTracer;
  private purposeInferrer: PurposeInferrer;
  private changeImpactAnalyzer: ChangeImpactAnalyzer;
  private currentAnalysis?: AnalysisResult;
  private patternDetector?: PatternDetector;

  constructor() {
    console.error('🚀 Initializing Guru AI-native code intelligence...');
    this.symbolGraphBuilder = new SymbolGraphBuilder();
    this.executionTracer = new ExecutionTracer();
    this.purposeInferrer = new PurposeInferrer();
    this.changeImpactAnalyzer = new ChangeImpactAnalyzer();
    console.error('✅ Guru Core initialized with revolutionary intelligence components!');
  }

  /**
   * Analyze a codebase to build comprehensive understanding
   */
  async analyzeCodebase(params: AnalyzeCodebaseParams): Promise<AnalysisResult> {
    console.error(`🔍 Analyzing codebase at: ${params.path}`);
    
    // Parse goal specification if provided
    let goalSpec: GoalSpecification | undefined;
    if (params.goalSpec) {
      try {
        goalSpec = YAML.parse(params.goalSpec) as GoalSpecification;
        console.error('📋 Goal specification provided');
      } catch (error) {
        console.error('⚠️ Failed to parse goal specification:', error);
      }
    }

    // Build symbol graph with our revolutionary multi-language support
    console.error('🕸️ Building symbol graph with AI-optimized dependency extraction...');
    const symbolGraph = await this.symbolGraphBuilder.build({
      path: params.path,
      language: params.language,
      includeTests: params.includeTests || false
    });

    // Create execution traces with our revolutionary static simulation
    console.error('🏃 Tracing execution paths with probabilistic analysis...');
    const entryPoints = this.findEntryPoints(symbolGraph);
    const executionTraces: ExecutionTrace[] = [];
    
    console.error(`🎯 Found ${entryPoints.length} potential entry points`);
    
    for (const entryPoint of entryPoints.slice(0, 5)) { // Limit to first 5 for performance
      try {
        console.error(`⚡ Tracing execution for ${entryPoint.name}...`);
        const trace = await this.executionTracer.trace({
          symbolGraph,
          entryPoint: entryPoint.id,
          maxDepth: 8,
          includeDataFlow: true
        });
        executionTraces.push(trace);
        console.error(`✅ Trace completed for ${entryPoint.name}`);
      } catch (error) {
        console.error(`⚠️ Failed to trace ${entryPoint.name}:`, error);
      }
    }

    // Infer purposes with our revolutionary multi-layer evidence system
    console.error('🧠 Inferring code purposes with AI-optimized pattern recognition...');
    const inferredPurposes = new Map<string, CodePurpose>();
    
    let analyzed = 0;
    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type === 'function' || symbol.type === 'class') {
        try {
          console.error(`🔍 Analyzing purpose for ${symbol.name}...`);
          const purpose = await this.purposeInferrer.infer({
            symbol,
            symbolGraph,
            executionTraces: this.currentAnalysis?.executionTraces || [],
            goalSpecification: goalSpec
          });
          inferredPurposes.set(symbolId, purpose);
          analyzed++;
          console.error(`✅ Purpose inferred for ${symbol.name}: ${purpose.inferredGoal} (${(purpose.confidence * 100).toFixed(1)}%)`);
        } catch (error) {
          console.error(`⚠️ Failed to infer purpose for ${symbol.name}:`, error);
        }
      }
    }
    
    console.error(`🎉 Purpose inference complete! Analyzed ${analyzed} symbols`);

    // Detect patterns and anti-patterns with our revolutionary pattern recognition
    console.error('🔍 Detecting design patterns and anti-patterns...');
    this.patternDetector = new PatternDetector(symbolGraph);
    const patternAnalysis = this.patternDetector.detectPatterns();
    console.error(`🎊 Pattern detection complete! Found ${patternAnalysis.patterns.length} patterns, ${patternAnalysis.antiPatterns.length} anti-patterns, ${patternAnalysis.summary}`);

    // Performance analysis
    const performanceAnalyzer = new PerformanceAnalyzer(symbolGraph);
    const performanceAnalysis = performanceAnalyzer.analyze();

    // Memory intelligence analysis
    const memoryIntelligenceEngine = new MemoryIntelligenceEngine();
    const memoryIntelligence = await memoryIntelligenceEngine.analyzeMemoryBehavior(symbolGraph);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      symbolGraph, 
      executionTraces, 
      inferredPurposes,
      goalSpec,
      patternAnalysis
    );

    const analysis: AnalysisResult = {
      symbolGraph,
      executionTraces,
      inferredPurposes,
      goalSpecification: goalSpec,
      recommendations,
      performanceAnalysis,
      memoryIntelligence
    };

    this.currentAnalysis = analysis;
    console.error('🎊 ANALYSIS COMPLETE! AI-native code intelligence ready for consumption!');
    console.error(`📊 Results: ${symbolGraph.symbols.size} symbols, ${symbolGraph.edges.length} edges, ${executionTraces.length} traces, ${inferredPurposes.size} purposes`);
    
    // --- Self-Reflection Feedback Integration ---
    const selfReflectionEngine = new SelfReflectionEngine();
    await selfReflectionEngine.reflectOnAnalysis(analysis);
    // --- Full Feedback Loop Integration ---
    try {
      const orchestrator = new FeedbackOrchestrator();
      await orchestrator.orchestrateFeedback(analysis);
    } catch (e) {
      console.error('Feedback orchestration failed:', e);
    }
    return analysis;
  }

  /**
   * Trace execution for a specific entry point
   */
  async traceExecution(params: TraceExecutionParams): Promise<ExecutionTrace> {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }

    return await this.executionTracer.trace({
      symbolGraph: this.currentAnalysis.symbolGraph,
      entryPoint: params.entryPoint,
      maxDepth: params.maxDepth || 8,
      followBranches: params.followBranches !== false
    });
  }

  /**
   * Infer purpose for specific code
   */
  async inferPurpose(params: InferPurposeParams): Promise<CodePurpose> {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }

    if (params.symbolId) {
      const symbol = this.currentAnalysis.symbolGraph.symbols.get(params.symbolId);
      if (!symbol) {
        throw new Error(`Symbol ${params.symbolId} not found`);
      }

      return await this.purposeInferrer.infer({
        symbol,
        symbolGraph: this.currentAnalysis.symbolGraph,
        executionTraces: this.currentAnalysis?.executionTraces || [],
        goalSpecification: this.currentAnalysis?.goalSpecification
      });
    }

    if (params.codeBlock) {
      // For direct code analysis, we'll need to parse it first
      // This is a simplified version for now
      return {
        inferredGoal: 'Direct code analysis not yet implemented',
        confidence: 0,
        evidence: [],
        alternatives: []
      };
    }

    throw new Error('Either symbolId or codeBlock must be provided');
  }

  /**
   * Get symbol graph in various formats
   */
  async getSymbolGraph(params: GetSymbolGraphParams): Promise<any> {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }

    const graph = this.currentAnalysis.symbolGraph;

    switch (params.format) {
      case 'json':
        return this.symbolGraphToJson(graph, params);
      case 'dot':
        return this.symbolGraphToDot(graph, params);
      case 'mermaid':
        return this.symbolGraphToMermaid(graph, params);
      default:
        return this.symbolGraphToJson(graph, params);
    }
  }

  /**
   * Analyze the impact of changing a specific symbol
   */
  async analyzeChangeImpact(
    symbolId: string, 
    changeType: ImpactContext['changeType']
  ): Promise<ChangeImpact> {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }

    const targetSymbol = this.currentAnalysis.symbolGraph.symbols.get(symbolId);
    if (!targetSymbol) {
      throw new Error(`Symbol with ID '${symbolId}' not found in current analysis.`);
    }

    console.error(`🔍 Analyzing impact of ${changeType} change to ${targetSymbol.name || symbolId}...`);
    
    const impact = this.changeImpactAnalyzer.analyzeSymbolChange(
      targetSymbol,
      changeType,
      this.currentAnalysis.symbolGraph.symbols
    );

    console.error(`🎯 Change impact analysis complete: ${impact.riskAssessment.overallRisk} risk`);
    console.error(`📊 Found ${impact.directImpacts.length} direct impacts, ${impact.indirectImpacts.length} indirect impacts`);

    return impact;
  }

  /**
   * Find code related to a natural language query
   */
  async findRelatedCode(params: FindRelatedCodeParams): Promise<any[]> {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }

    // This will be enhanced with semantic search later
    // For now, simple keyword matching
    const results: any[] = [];
    const query = params.query.toLowerCase();

    for (const [symbolId, symbol] of this.currentAnalysis.symbolGraph.symbols) {
      const relevance = this.calculateRelevance(symbol, query);
      if (relevance >= (params.similarity || 0.7)) {
        results.push({
          symbolId,
          symbol,
          relevance,
          purpose: this.currentAnalysis?.inferredPurposes?.get(symbolId)
        });
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, params.limit || 10);
  }

  // Helper methods
  private findEntryPoints(symbolGraph: SymbolGraph) {
    const entryPoints = [];
    
    console.error('🔍 Identifying entry points...');
    
    for (const [id, symbol] of symbolGraph.symbols) {
      // Consider functions/classes with low incoming dependencies as entry points
      const incomingEdges = symbolGraph.edges.filter(edge => edge.to === id).length;
      const outgoingEdges = symbolGraph.edges.filter(edge => edge.from === id).length;
      
      if (symbol.type === 'function' || symbol.type === 'class') {
        // Entry point heuristics:
        // 1. Functions with few or no callers (low fan-in)
        // 2. Functions with meaningful names suggesting entry points
        // 3. Functions that call many others (orchestrators)
        
        const isEntryCandidate = (
          incomingEdges <= 2 || // Low fan-in
          outgoingEdges >= 3 || // High fan-out (orchestrator)
          symbol.name.toLowerCase().includes('main') ||
          symbol.name.toLowerCase().includes('init') ||
          symbol.name.toLowerCase().includes('start') ||
          symbol.name.toLowerCase().includes('handle') ||
          symbol.name.toLowerCase().includes('process')
        );
        
        if (isEntryCandidate) {
          entryPoints.push(symbol);
        }
      }
    }
    
    console.error(`🎯 Identified ${entryPoints.length} entry point candidates`);
    return entryPoints.sort((a, b) => {
      // Prioritize by outgoing edges (orchestrators first)
      const aOut = symbolGraph.edges.filter(e => e.from === a.id).length;
      const bOut = symbolGraph.edges.filter(e => e.from === b.id).length;
      return bOut - aOut;
    });
  }

  private async generateRecommendations(
    symbolGraph: SymbolGraph,
    executionTraces: ExecutionTrace[],
    inferredPurposes: Map<string, CodePurpose>,
    goalSpec?: GoalSpecification,
    patternAnalysis?: any
  ) {
    // Placeholder for recommendation generation
    return [
      {
        type: 'improvement' as const,
        description: 'Consider adding more documentation for complex functions',
        impact: 'medium' as const,
        effort: 'low' as const,
        rationale: 'Several functions have low confidence purpose inference'
      }
    ];
  }

  private symbolGraphToJson(graph: SymbolGraph, params: GetSymbolGraphParams) {
    const symbols = Array.from(graph.symbols.values()); // Just use the symbols directly since they already have id

    return {
      symbols,
      edges: graph.edges,
      metadata: graph.metadata
    };
  }

  private symbolGraphToDot(graph: SymbolGraph, params: GetSymbolGraphParams): string {
    let dot = 'digraph SymbolGraph {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes
    for (const [id, symbol] of graph.symbols) {
      const label = `${symbol.name}\\n(${symbol.type})`;
      dot += `  "${id}" [label="${label}"];\n`;
    }

    // Add edges
    for (const edge of graph.edges) {
      dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];\n`;
    }

    dot += '}';
    return dot;
  }

  private symbolGraphToMermaid(graph: SymbolGraph, params: GetSymbolGraphParams): string {
    let mermaid = 'graph TD\n';

    // Add nodes and edges
    for (const edge of graph.edges) {
      const fromSymbol = graph.symbols.get(edge.from);
      const toSymbol = graph.symbols.get(edge.to);
      
      if (fromSymbol && toSymbol) {
        mermaid += `  ${edge.from}["${fromSymbol.name}"] -->|${edge.type}| ${edge.to}["${toSymbol.name}"]\n`;
      }
    }

    return mermaid;
  }

  private calculateRelevance(symbol: any, query: string): number {
    const name = symbol.name.toLowerCase();
    const type = symbol.type.toLowerCase();
    
    // Simple relevance calculation
    let relevance = 0;
    
    if (name.includes(query)) relevance += 0.8;
    if (type.includes(query)) relevance += 0.3;
    if (symbol.metadata?.docstring?.toLowerCase().includes(query)) relevance += 0.5;
    
    return Math.min(relevance, 1.0);
  }

  /**
   * Run the pattern mining engine and return clusters/outliers
   */
  minePatterns() {
    if (!this.currentAnalysis) {
      throw new Error('No analysis available. Please run analyze_codebase first.');
    }
    const engine = new PatternMiningEngine(this.currentAnalysis.symbolGraph);
    return engine.minePatterns();
  }

  /**
   * Run full E2E analysis and feedback loop orchestration
   */
  async runFullE2EFeedback(params: AnalyzeCodebaseParams) {
    const analysis = await this.analyzeCodebase(params);
    let feedbackResults = null;
    try {
      const orchestrator = new FeedbackOrchestrator();
      feedbackResults = await orchestrator.orchestrateFeedback(analysis);
    } catch (e) {
      console.error('Feedback orchestration failed:', e);
    }
    // Persist or return all outputs
    return {
      analysis,
      feedbackResults
    };
  }
}
