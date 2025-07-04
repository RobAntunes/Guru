/**
 * GuruCore - The main intelligence engine for code analysis
 *
 * This class orchestrates symbol graph building, execution tracing,
 * and purpose inference to provide deep code understanding.
 */

import { AnalysisResult, SymbolGraph, ExecutionTrace } from "../types/index.js";
import { SymbolGraphBuilder } from "../parsers/symbol-graph.js";
import { ExecutionTracer } from "../intelligence/execution-tracer.js";
import { PatternDetector } from "../intelligence/pattern-detector.js";
import { ChangeImpactAnalyzer } from "../intelligence/change-impact-analyzer.js";
import YAML from "yaml";
import { PatternMiningEngine } from "../intelligence/pattern-mining-engine.js";
import { PerformanceAnalyzer } from "../intelligence/performance-analyzer.js";
import { MemoryIntelligenceEngine } from "../intelligence/memory-intelligence-engine.js";
import {
  SelfReflectionEngine,
  FeedbackOrchestrator,
} from "../intelligence/self-reflection-engine.js";
import { ChangeImpactAnalysis, CodeChange } from "../types/index.js";
import fs from "fs";

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

export interface GetSymbolGraphParams {
  format?: "json" | "dot" | "mermaid";
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
  private changeImpactAnalyzer: ChangeImpactAnalyzer;
  private currentAnalysis?: AnalysisResult;
  private patternDetector?: PatternDetector;

  constructor() {
    console.error("🚀 Initializing Guru AI-native code intelligence...");
    this.symbolGraphBuilder = new SymbolGraphBuilder();
    this.executionTracer = new ExecutionTracer();
    this.changeImpactAnalyzer = new ChangeImpactAnalyzer();
    console.error(
      "✅ Guru Core initialized with revolutionary intelligence components!",
    );
  }

  /**
   * Analyze a codebase to build comprehensive understanding
   */
  async analyzeCodebase(params: {
    path: string;
    goalSpec?: string;
  }): Promise<AnalysisResult> {
    const { path, goalSpec } = params;
    console.error(`🔍 Analyzing codebase at: ${path}`);

    // 🧠 AI-NATIVE: Build rich structural data instead of inferring purpose
    const symbolGraph = await this.symbolGraphBuilder.build({
      path: path,
      language: undefined, // Auto-detect
      includeTests: false,
    });

    // 🚀 AI-NATIVE: Focus on execution relationships and data flows
    const entryPoints = this.findEntryPoints(symbolGraph);
    const executionTraces: any[] = [];

    // Trace execution for key entry points
    for (const entryPoint of entryPoints.slice(0, 3)) {
      // Limit for performance
      try {
        const trace = await this.executionTracer.trace({
          symbolGraph,
          entryPoint: entryPoint.id,
          maxDepth: 6,
          followBranches: true,
          includeDataFlow: true,
        });
        executionTraces.push(trace);
      } catch (error) {
        console.error(`⚠️ Failed to trace ${entryPoint.name}:`, error);
      }
    }

    // 🎯 AI-NATIVE: Provide confidence-weighted analysis instead of text descriptions
    const confidenceMetrics = this.calculateConfidenceMetrics(
      symbolGraph,
      executionTraces,
    );

    console.error(
      `🎊 ANALYSIS COMPLETE! AI-native code intelligence ready for consumption!`,
    );
    console.error(
      `📊 Results: ${symbolGraph.symbols.size} symbols, ${symbolGraph.edges.length} edges, ${executionTraces.length} traces`,
    );

    return {
      symbolGraph,
      executionTraces,
      confidenceMetrics, // AI-NATIVE: Replace inferredPurposes with confidence data
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        analysisVersion: "2.0-ai-native",
        targetPath: path,
        goalSpec: goalSpec || "ai-native-analysis",
      },
    };
  }

  /**
   * Trace execution for a specific entry point
   */
  async traceExecution(params: TraceExecutionParams): Promise<ExecutionTrace> {
    if (!this.currentAnalysis) {
      throw new Error(
        "No analysis available. Please run analyze_codebase first.",
      );
    }

    return await this.executionTracer.trace({
      symbolGraph: this.currentAnalysis.symbolGraph,
      entryPoint: params.entryPoint,
      maxDepth: params.maxDepth || 8,
      followBranches: params.followBranches !== false,
    });
  }

  /**
   * Get symbol graph in various formats
   */
  async getSymbolGraph(params: GetSymbolGraphParams): Promise<any> {
    if (!this.currentAnalysis) {
      throw new Error(
        "No analysis available. Please run analyze_codebase first.",
      );
    }

    const graph = this.currentAnalysis.symbolGraph;

    switch (params.format) {
      case "json":
        return this.symbolGraphToJson(graph, params);
      case "dot":
        return this.symbolGraphToDot(graph, params);
      case "mermaid":
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
    type: CodeChange["type"],
  ): Promise<ChangeImpactAnalysis> {
    if (!this.currentAnalysis) {
      throw new Error(
        "No analysis available. Please run analyze_codebase first.",
      );
    }

    const targetSymbol = this.currentAnalysis.symbolGraph.symbols.get(symbolId);
    if (!targetSymbol) {
      throw new Error(
        `Symbol with ID '${symbolId}' not found in current analysis.`,
      );
    }

    console.error(
      `🔍 Analyzing impact of ${type} change to ${targetSymbol.name || symbolId}...`,
    );

    const impact = await this.changeImpactAnalyzer.analyzeChangeImpact(
      this.currentAnalysis.symbolGraph,
      { type, targetSymbol: symbolId, description: "", rationale: "" },
    );

    console.error(
      `🎯 Change impact analysis complete: ${impact.risk.level} risk`,
    );
    console.error(
      `📊 Found ${impact.directImpacts.length} direct impacts, ${impact.indirectImpacts.length} indirect impacts`,
    );

    return impact;
  }

  /**
   * Find code related to a natural language query
   */
  async findRelatedCode(params: FindRelatedCodeParams): Promise<any[]> {
    if (!this.currentAnalysis) {
      throw new Error(
        "No analysis available. Please run analyze_codebase first.",
      );
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
        });
      }
    }
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, params.limit || 10);
  }

  // Helper methods
  private findEntryPoints(
    symbolGraph: SymbolGraph,
  ): Array<{ id: string; name: string; confidence: number }> {
    const entryPoints: Array<{ id: string; name: string; confidence: number }> =
      [];
    for (const [id, symbol] of symbolGraph.symbols) {
      let confidence = 0;
      // Higher confidence for main/index functions
      if (
        symbol.name === "main" ||
        symbol.name === "index" ||
        symbol.name === "run"
      ) {
        confidence += 0.8;
      }
      // Higher confidence for functions with no dependencies (likely entry points)
      const incomingEdges = symbolGraph.edges.filter((edge) => edge.to === id);
      if (incomingEdges.length === 0 && symbol.type === "function") {
        confidence += 0.4;
      }
      // Add if confidence threshold met
      if (confidence > 0.3) {
        entryPoints.push({ id, name: symbol.name, confidence });
      }
    }
    // Sort by confidence and return top candidates
    return entryPoints.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateRecommendations(
    symbolGraph: SymbolGraph,
    executionTraces: ExecutionTrace[],
    patternAnalysis?: any,
  ) {
    // Placeholder for recommendation generation
    return [
      {
        type: "improvement" as const,
        description: "Consider adding more documentation for complex functions",
        impact: "medium" as const,
        effort: "low" as const,
        rationale: "Several functions have low confidence purpose inference",
      },
    ];
  }

  private symbolGraphToJson(graph: SymbolGraph, params: GetSymbolGraphParams) {
    const symbols = Array.from(graph.symbols.values()); // Just use the symbols directly since they already have id

    return {
      symbols,
      edges: graph.edges,
      metadata: graph.metadata,
    };
  }

  private symbolGraphToDot(
    graph: SymbolGraph,
    params: GetSymbolGraphParams,
  ): string {
    let dot = "digraph SymbolGraph {\n";
    dot += "  rankdir=TB;\n";
    dot += "  node [shape=box];\n\n";

    // Add nodes
    for (const [id, symbol] of graph.symbols) {
      const label = `${symbol.name}\\n(${symbol.type})`;
      dot += `  "${id}" [label="${label}"];\n`;
    }

    // Add edges
    for (const edge of graph.edges) {
      dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];\n`;
    }

    dot += "}";
    return dot;
  }

  private symbolGraphToMermaid(
    graph: SymbolGraph,
    params: GetSymbolGraphParams,
  ): string {
    let mermaid = "graph TD\n";

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
    if (symbol.metadata?.docstring?.toLowerCase().includes(query))
      relevance += 0.5;

    return Math.min(relevance, 1.0);
  }

  /**
   * Run the pattern mining engine and return clusters/outliers
   */
  minePatterns() {
    if (!this.currentAnalysis) {
      throw new Error(
        "No analysis available. Please run analyze_codebase first.",
      );
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
      console.error("Feedback orchestration failed:", e);
    }
    // Persist or return all outputs
    return {
      analysis,
      feedbackResults,
    };
  }

  // 🧠 AI-NATIVE: Calculate confidence metrics for structural relationships
  private calculateConfidenceMetrics(
    symbolGraph: SymbolGraph,
    executionTraces: any[],
  ): any {
    const metrics = {
      symbolConfidence: new Map<string, number>(),
      edgeConfidence: new Map<string, number>(),
      overallQuality: 0,
      analysisDepth: "comprehensive",
    };
    // Calculate symbol confidence based on tree-sitter parse success
    for (const [id, symbol] of symbolGraph.symbols) {
      let confidence = 0.8; // Base confidence for parsed symbols
      // Higher confidence for well-defined symbols
      if (symbol.type === "class" || symbol.type === "function")
        confidence += 0.1;
      metrics.symbolConfidence.set(id, Math.min(confidence, 1.0));
    }
    // Calculate edge confidence based on relationship strength
    symbolGraph.edges.forEach((edge, index) => {
      let confidence = 0.7; // Base confidence for detected relationships
      // Higher confidence for direct calls/imports
      if (edge.type === "calls" || edge.type === "imports") confidence += 0.2;
      metrics.edgeConfidence.set(`edge_${index}`, Math.min(confidence, 1.0));
    });
    // Overall quality score
    const avgSymbolConfidence =
      Array.from(metrics.symbolConfidence.values()).reduce(
        (sum, conf) => sum + conf,
        0,
      ) / metrics.symbolConfidence.size || 0;
    const avgEdgeConfidence =
      Array.from(metrics.edgeConfidence.values()).reduce(
        (sum, conf) => sum + conf,
        0,
      ) / metrics.edgeConfidence.size || 0;
    metrics.overallQuality = (avgSymbolConfidence + avgEdgeConfidence) / 2;
    return metrics;
  }

  // Helper to read package.json, but suppress warning if not found
  private async tryReadPackageJson(path: string): Promise<any | null> {
    try {
      const data = await fs.promises.readFile(path, 'utf-8');
      return JSON.parse(data);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // Only log a debug message, not a warning
        if (process.env.NODE_ENV === 'test') {
          // In test, suppress or clarify
          console.debug(`[Guru] (test) package.json not found at ${path} (expected in some edge cases)`);
        } else {
          console.info(`[Guru] package.json not found at ${path}`);
        }
        return null;
      }
      throw err;
    }
  }

  // In dependency analysis, clarify ENOENT for intentionally missing files
  private handleDependencyReadError(file: string, err: any) {
    if (err.code === 'ENOENT') {
      if (process.env.NODE_ENV === 'test') {
        // In test, clarify this is expected for edge case tests
        console.debug(`[Guru] (test) File not found: ${file} (expected in some edge case tests)`);
      } else {
        console.warn(`[Guru] File not found: ${file}`);
      }
    } else {
      console.error(`[Guru] Failed to analyze dependencies for ${file}:`, err);
    }
  }
}
