/**
 * GuruCore - The main intelligence engine for code analysis
 *
 * This class orchestrates symbol graph building, execution tracing,
 * and purpose inference to provide deep code understanding.
 */

import { AnalysisResult, SymbolGraph, ExecutionTrace } from "../types/index.js";
import { SymbolGraphBuilder } from "../parsers/symbol-graph.js";
import { ExecutionTracer } from "../intelligence/execution-tracer.js";
import YAML from "yaml";
import fs from "fs";
import { IncrementalAnalyzer } from "./incremental-analyzer.js";
import { guruConfig } from "./config.js";
import pathLib from "path";
import { dirname } from "path";

export interface AnalyzeCodebaseParams {
  path: string;
  language?: string;
  includeTests?: boolean;
  goalSpec?: string;
  scanMode?: 'auto' | 'incremental' | 'full';
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

interface LazyLoadedComponents {
  symbolGraphBuilder?: SymbolGraphBuilder;
  executionTracer?: ExecutionTracer;
}

export class GuruCore {
  private components: LazyLoadedComponents = {};
  private currentAnalysis?: AnalysisResult;
  private incrementalAnalyzer?: IncrementalAnalyzer;
  private quiet: boolean;
  private initializedComponents = new Set<string>();

  constructor(quiet = false) {
    this.quiet = quiet;
    if (!quiet) {
      console.error("🚀 Initializing Guru AI-native code intelligence...");
    }
    // Only basic initialization - all heavy components are lazy-loaded
    if (!quiet) {
      console.error(
        "✅ Guru Core initialized with revolutionary intelligence components!",
      );
    }
  }

  /**
   * Lazy-load SymbolGraphBuilder when first needed
   */
  private async getSymbolGraphBuilder(): Promise<SymbolGraphBuilder> {
    if (!this.components.symbolGraphBuilder) {
      if (!this.quiet && !this.initializedComponents.has('SymbolGraphBuilder')) {
        console.error("📚 Loading SymbolGraphBuilder...");
        this.initializedComponents.add('SymbolGraphBuilder');
      }
      this.components.symbolGraphBuilder = new SymbolGraphBuilder(this.quiet);
    }
    return this.components.symbolGraphBuilder;
  }

  /**
   * Lazy-load ExecutionTracer when first needed
   */
  private async getExecutionTracer(): Promise<ExecutionTracer> {
    if (!this.components.executionTracer) {
      if (!this.quiet && !this.initializedComponents.has('ExecutionTracer')) {
        console.error("🔍 Loading ExecutionTracer...");
        this.initializedComponents.add('ExecutionTracer');
      }
      this.components.executionTracer = new ExecutionTracer();
    }
    return this.components.executionTracer;
  }

  // REMOVED: All interpretation components for raw harmonic analysis only

  /**
   * Preload commonly used components for better performance
   */
  async preloadComponents(components: string[] = ['symbolGraphBuilder']): Promise<void> {
    const preloadPromises = components.map(async (component) => {
      switch (component) {
        case 'symbolGraphBuilder':
          await this.getSymbolGraphBuilder();
          break;
        case 'executionTracer':
          await this.getExecutionTracer();
          break;
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Analyze a codebase to build comprehensive understanding (incremental, checkpointed)
   */
  async analyzeCodebase(
    path: string,
    goalSpec?: string,
    scanMode?: 'auto' | 'incremental' | 'full'
  ): Promise<AnalysisResult> {
    try {
      let isFile = false;
      try {
        isFile = (await fs.promises.stat(path)).isFile();
      } catch {
        // File doesn't exist - assume it's a path and continue with empty analysis
        // This allows graceful handling of non-existent files
      }
      
      const analysisBasePath = isFile ? dirname(path) : path;

      // Create new IncrementalAnalyzer for this analysis
      this.incrementalAnalyzer = new IncrementalAnalyzer(analysisBasePath, this.quiet);
      await this.incrementalAnalyzer.initialize();

      // Load checkpoint
      const checkpoint = await this.incrementalAnalyzer.loadCheckpoint();
      
      // Determine incremental mode
      const importedScanMode = scanMode || (guruConfig as any).scanMode;
      const freshScanMode = importedScanMode || 'auto';
      let effectiveScanMode = freshScanMode;
      
      // For 'auto' mode, use incremental if we have a checkpoint
      if (effectiveScanMode === 'auto' && checkpoint) {
        effectiveScanMode = 'incremental';
      }
      
      let useIncremental = effectiveScanMode === 'incremental' && checkpoint;
      


      let filesToAnalyze: string[] = [];
      let allFilesArr: string[] = [];
      let filesAnalyzedCount = 0;
      let changedFiles: string[] = [];
      let deletedFiles: string[] = [];
      let newFiles: string[] = [];
      let affectedFiles: string[] = [];

      if (isFile) {
        filesToAnalyze = [path];
        allFilesArr = [path];
        filesAnalyzedCount = 1;
      } else if (await this.fileExists(path)) {
        // Directory exists, proceed normally
        try {
          allFilesArr = await this.incrementalAnalyzer.getAllSourceFiles(path);
        } catch (err) {
          console.error('[GuruCore][ERROR] getAllSourceFiles failed:', err);
          throw err;
        }
        if (useIncremental) {
          // Detect changes
          const changes = await this.incrementalAnalyzer.detectChanges(allFilesArr);
          changedFiles = changes.changedFiles;
          deletedFiles = changes.deletedFiles;
          newFiles = changes.newFiles;
          affectedFiles = changes.affectedFiles;
          
          // Filter out deleted files from analysis (they don't exist)
          filesToAnalyze = affectedFiles.filter(file => !deletedFiles.includes(file));
          filesAnalyzedCount = filesToAnalyze.length;
        } else {
          filesToAnalyze = allFilesArr;
          filesAnalyzedCount = filesToAnalyze.length;
        }
      } else {
        // Path doesn't exist (file or directory) - create empty analysis
        filesToAnalyze = [];
        allFilesArr = [];
        filesAnalyzedCount = 0;
        if (!this.quiet) {
          console.error(`[GuruCore][WARNING] Path does not exist: ${path}`);
        }
      }

      // Run analysis
      const analysisResults = await this.incrementalAnalyzer.analyzeFilesParallel(filesToAnalyze);
      
      // Lazy-load components as needed
      const symbolGraphBuilder = await this.getSymbolGraphBuilder();
      
      // Build symbol graph
      const symbolGraph = await symbolGraphBuilder.build({
        path: analysisBasePath,
        language: guruConfig.language || 'typescript',
        includeTests: guruConfig.includeTests,
        expandFiles: filesToAnalyze,
      });
      
      // SIMPLIFIED FOR RAW HARMONIC ANALYSIS - Only basic symbol graph
      console.log('✅ Symbol graph built - ready for harmonic analysis')

      // Flush cache to ensure all writes are completed before returning
      if (this.incrementalAnalyzer) {
        try {
          await this.incrementalAnalyzer.flush();
        } catch (error) {
          console.error('[GuruCore][ERROR] cache flush failed:', error);
        }
      }

      // Always save checkpoint after analysis for both file and directory analysis
      try {
        await this.incrementalAnalyzer.saveCheckpoint(analysisBasePath, allFilesArr.length, filesAnalyzedCount);
      } catch (error) {
        console.error('[GuruCore][ERROR] saveCheckpoint failed:', error);
      }

      // SIMPLIFIED RESULT FOR RAW HARMONIC ANALYSIS
      const analysisResult: any = {
        symbolGraph,
        metadata: {
          timestamp: new Date().toISOString(),
          analysisVersion: '3.0-harmonic-raw',
          targetPath: path,
          filesAnalyzed: filesAnalyzedCount,
          totalFiles: allFilesArr.length,
          mode: 'raw-harmonic-only'
        }
      };

      this.currentAnalysis = analysisResult;

      return analysisResult;
    } catch (err) {
      console.error('[GuruCore][ERROR] Analysis failed:', err);
      throw err;
    }
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

    const executionTracer = await this.getExecutionTracer();
    return await executionTracer.trace({
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

  // REMOVED: Change impact analysis for raw harmonic analysis only

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
    // TODO: Implement PatternMiningEngine
    // const engine = new PatternMiningEngine(this.currentAnalysis.symbolGraph);
    // return engine.minePatterns();
    return { patterns: [], miningMetadata: { totalPatternsFound: 0 } };
  }

  /**
   * Run full E2E analysis and feedback loop orchestration
   */
  async runFullE2EFeedback(params: AnalyzeCodebaseParams) {
    const analysis = await this.analyzeCodebase(params.path, params.goalSpec, params.scanMode);
    let feedbackResults = null;
    try {
      // TODO: Implement FeedbackOrchestrator
      // const orchestrator = new FeedbackOrchestrator();
      // feedbackResults = await orchestrator.orchestrateFeedback(analysis);
      feedbackResults = { success: false, message: "FeedbackOrchestrator not implemented" };
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup method to properly release resources
   */
  async cleanup(): Promise<void> {
    // Cleanup incremental analyzer if it exists
    if (this.incrementalAnalyzer) {
      try {
        await Promise.race([
          this.incrementalAnalyzer.cleanup(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Incremental analyzer cleanup timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.error('[GuruCore] Incremental analyzer cleanup error:', error);
      }
      this.incrementalAnalyzer = undefined;
    }

    // Clear component references
    this.components = {};
    this.initializedComponents.clear();
    this.currentAnalysis = undefined;
  }
}
