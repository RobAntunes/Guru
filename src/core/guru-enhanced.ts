/**
 * Enhanced Guru with Flow Tracking and Type Analysis
 * Extends core Guru with advanced code intelligence capabilities
 */

import { GuruCore } from './guru.js';
import { SymbolGraph } from '../types/index.js';
import { IntegratedFlowTypeAnalyzer, IntegratedAnalysis } from '../intelligence/integrated-flow-type-analyzer.js';
import { HarmonicEnricher } from '../harmonic-intelligence/core/harmonic-enricher.js';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine.js';
import { Logger } from '../logging/logger.js';
import ts from 'typescript';
import path from 'path';
import fs from 'fs/promises';
import { findNodeByName, getVariableScope } from '../intelligence/flow-type-analyzer-utils.js';

/**
 * Enhanced analysis result with flow and type information
 */
export interface EnhancedAnalysisResult {
  symbolGraph: SymbolGraph;
  flowTypeAnalysis?: IntegratedAnalysis;
  metadata: {
    timestamp: string;
    analysisVersion: string;
    targetPath: string;
    filesAnalyzed: number;
    totalFiles: number;
    mode: string;
    capabilities: string[];
  };
}

/**
 * Enhanced Guru with integrated flow and type analysis
 */
export class GuruEnhanced extends GuruCore {
  private logger = Logger.getInstance();
  private integratedAnalyzer?: IntegratedFlowTypeAnalyzer;
  private harmonicEnricher?: HarmonicEnricher;
  private harmonicEngine?: HarmonicAnalysisEngine;
  private typeScriptProgram?: ts.Program;
  
  constructor(quiet = false) {
    super(quiet);
    if (!quiet) {
      this.logger.info('🚀 Initializing Enhanced Guru with Flow & Type Analysis...');
    }
  }
  
  /**
   * Initialize harmonic intelligence components
   */
  async initializeHarmonicIntelligence(): Promise<void> {
    try {
      // Initialize harmonic engine
      this.harmonicEngine = new HarmonicAnalysisEngine();
      
      // Initialize harmonic enricher
      this.harmonicEnricher = new HarmonicEnricher(this.harmonicEngine);
      
      this.logger.info('🎵 Harmonic Analysis Engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize harmonic intelligence:', error);
    }
  }
  
  /**
   * Enhanced analyze codebase with flow and type analysis
   */
  async analyzeCodebaseEnhanced(
    targetPath: string,
    options?: {
      goalSpec?: string;
      scanMode?: 'auto' | 'incremental' | 'full';
      enableFlowAnalysis?: boolean;
      enableTypeAnalysis?: boolean;
      enableHarmonicEnrichment?: boolean;
    }
  ): Promise<EnhancedAnalysisResult> {
    const startTime = Date.now();
    
    // Run base analysis
    const baseAnalysis = await this.analyzeCodebase(
      targetPath,
      options?.goalSpec,
      options?.scanMode
    );
    
    // Initialize result
    const result: EnhancedAnalysisResult = {
      symbolGraph: baseAnalysis.symbolGraph,
      metadata: {
        ...baseAnalysis.metadata,
        capabilities: ['symbol-graph']
      }
    };
    
    // Run enhanced analysis if requested
    if (options?.enableFlowAnalysis || options?.enableTypeAnalysis) {
      try {
        // Initialize harmonic components if requested
        if (options.enableHarmonicEnrichment && !this.harmonicEngine) {
          await this.initializeHarmonicIntelligence();
        }
        
        // Create integrated analyzer
        this.integratedAnalyzer = new IntegratedFlowTypeAnalyzer(
          baseAnalysis.symbolGraph,
          this.harmonicEnricher,
          this.harmonicEngine
        );
        
        // Create TypeScript program for analysis
        const program = await this.createTypeScriptProgram(targetPath);
        
        if (program) {
          // Run integrated analysis
          const integratedAnalysis = await this.integratedAnalyzer.analyzeProgram(program);
          
          result.flowTypeAnalysis = integratedAnalysis;
          result.metadata.capabilities.push('flow-analysis', 'type-analysis');
          
          if (options.enableHarmonicEnrichment) {
            result.metadata.capabilities.push('harmonic-enrichment');
          }
          
          // Log insights summary
          this.logger.info(`📊 Analysis complete in ${Date.now() - startTime}ms:`);
          this.logger.info(`  - ${integratedAnalysis.insights.length} insights generated`);
          this.logger.info(`  - ${integratedAnalysis.enrichedPaths.length} flow paths analyzed`);
          this.logger.info(`  - ${integratedAnalysis.types.types.size} types identified`);
          this.logger.info(`  - Integration score: ${(integratedAnalysis.metrics.integrationScore * 100).toFixed(0)}%`);
        } else {
          this.logger.warn('TypeScript program creation failed - flow/type analysis skipped');
        }
      } catch (error) {
        this.logger.error('Enhanced analysis failed:', error);
        // Continue with base analysis result
      }
    }
    
    return result;
  }
  
  /**
   * Analyze a specific function with full context
   */
  async analyzeFunctionWithContext(
    functionName: string,
    targetPath: string
  ): Promise<{
    flowPaths: any[];
    typeSignature: any;
    insights: any[];
    harmonicContext?: any;
  }> {
    // Ensure we have analyzed the codebase
    const analysis = await this.analyzeCodebaseEnhanced(targetPath, {
      enableFlowAnalysis: true,
      enableTypeAnalysis: true,
      enableHarmonicEnrichment: true
    });
    
    if (!this.integratedAnalyzer || !this.typeScriptProgram) {
      throw new Error('Enhanced analysis not available');
    }
    
    try {
      // Get function analysis
      const result = await this.integratedAnalyzer.analyzeFunctionIntegrated(
        functionName,
        this.typeScriptProgram
      );
      
      // Add harmonic context if available
      if (this.harmonicEnricher) {
        const symbol = analysis.symbolGraph.symbols.get(functionName);
        if (symbol) {
          const harmonicContext = await this.harmonicEnricher.enrichSymbol(symbol);
          return {
            ...result,
            harmonicContext
          };
        }
      }
      
      return result;
    } catch (error: any) {
      // If function not found in symbol graph, try to find it directly
      if (error.message.includes('not found in symbol graph')) {
        // Find the function in source files
        for (const sourceFile of this.typeScriptProgram.getSourceFiles()) {
          if (!sourceFile.isDeclarationFile) {
            const funcNode = findNodeByName(sourceFile, functionName);
            if (funcNode && ts.isFunctionLike(funcNode)) {
              // Analyze the function directly
              const flowPaths = await this.integratedAnalyzer.flowTracker.analyzeFunctionFlow(
                funcNode as any,
                sourceFile.fileName
              );
              
              // Get type info
              const checker = this.typeScriptProgram.getTypeChecker();
              const symbol = checker.getSymbolAtLocation(funcNode);
              const type = symbol ? checker.getTypeOfSymbolAtLocation(symbol, funcNode) : undefined;
              
              return {
                flowPaths,
                typeSignature: type ? { name: functionName, type: checker.typeToString(type) } : undefined,
                insights: []
              };
            }
          }
        }
      }
      throw error;
    }
  }
  
  /**
   * Track variable flow with type evolution
   */
  async trackVariableFlow(
    variableName: string,
    scopePath: string,
    targetPath: string
  ): Promise<{
    flowPath: any;
    typeEvolution: any[];
    insights: any[];
  }> {
    // Ensure enhanced analysis
    await this.analyzeCodebaseEnhanced(targetPath, {
      enableFlowAnalysis: true,
      enableTypeAnalysis: true
    });
    
    if (!this.integratedAnalyzer || !this.typeScriptProgram) {
      throw new Error('Enhanced analysis not available');
    }
    
    // Find source file
    let sourceFile: ts.SourceFile | undefined;
    
    // If scopePath is a file path, get that specific file
    if (scopePath.endsWith('.ts') || scopePath.endsWith('.js')) {
      sourceFile = this.typeScriptProgram.getSourceFile(scopePath);
    } else {
      // Otherwise search all files in the target path
      for (const sf of this.typeScriptProgram.getSourceFiles()) {
        if (!sf.isDeclarationFile && sf.fileName.includes(targetPath)) {
          const varNode = findNodeByName(sf, variableName);
          if (varNode) {
            sourceFile = sf;
            break;
          }
        }
      }
    }
    
    if (!sourceFile) {
      throw new Error(`Source file not found for variable: ${variableName}`);
    }
    
    // Get the scope containing the variable
    const scope = getVariableScope(sourceFile, variableName) || sourceFile;
    
    // Track variable
    const tracking = await this.integratedAnalyzer.trackVariableWithTypes(
      variableName,
      scope,
      this.typeScriptProgram
    );
    
    // Generate insights specific to this variable
    const insights = this.generateVariableInsights(tracking);
    
    return {
      ...tracking,
      insights
    };
  }
  
  /**
   * Get flow and type insights for Living Task Forest
   */
  async getTaskDiscoveryInsights(targetPath: string): Promise<{
    flowIssues: any[];
    typeIssues: any[];
    optimizationOpportunities: any[];
    refactoringCandidates: any[];
  }> {
    const analysis = await this.analyzeCodebaseEnhanced(targetPath, {
      enableFlowAnalysis: true,
      enableTypeAnalysis: true,
      enableHarmonicEnrichment: true
    });
    
    if (!analysis.flowTypeAnalysis) {
      return {
        flowIssues: [],
        typeIssues: [],
        optimizationOpportunities: [],
        refactoringCandidates: []
      };
    }
    
    const { insights, flow, types } = analysis.flowTypeAnalysis;
    
    // Categorize insights for task discovery
    const flowIssues = insights.filter(i => i.type === 'bug_risk' && i.evidence.flowPattern);
    
    // Convert type issues to have consistent structure
    const typeIssues = types.issues.map(issue => ({
      type: issue.type,
      severity: issue.severity,
      title: issue.message,
      description: issue.message,
      location: issue.location
    }));
    
    const optimizationOpportunities = insights.filter(i => i.type === 'optimization');
    const refactoringCandidates = insights.filter(i => i.type === 'refactor');
    
    return {
      flowIssues,
      typeIssues,
      optimizationOpportunities,
      refactoringCandidates
    };
  }
  
  /**
   * Get comprehensive code metrics including flow and type complexity
   */
  async getEnhancedMetrics(targetPath: string): Promise<{
    symbolMetrics: any;
    flowMetrics: any;
    typeMetrics: any;
    harmonicMetrics: any;
    overallHealth: number;
  }> {
    const analysis = await this.analyzeCodebaseEnhanced(targetPath, {
      enableFlowAnalysis: true,
      enableTypeAnalysis: true,
      enableHarmonicEnrichment: true
    });
    
    // Basic symbol metrics
    const symbolMetrics = {
      totalSymbols: analysis.symbolGraph.symbols.size,
      totalEdges: analysis.symbolGraph.edges.length,
      avgDependencies: analysis.symbolGraph.edges.length / Math.max(1, analysis.symbolGraph.symbols.size)
    };
    
    // Flow and type metrics
    let flowMetrics = {};
    let typeMetrics = {};
    let harmonicMetrics = {};
    
    if (analysis.flowTypeAnalysis) {
      flowMetrics = analysis.flowTypeAnalysis.flow.metrics;
      typeMetrics = analysis.flowTypeAnalysis.types.metrics;
      harmonicMetrics = {
        coherence: analysis.flowTypeAnalysis.metrics.harmonicCoherence,
        integrationScore: analysis.flowTypeAnalysis.metrics.integrationScore
      };
    }
    
    // Calculate overall health score
    const overallHealth = this.calculateOverallHealth({
      symbolMetrics,
      flowMetrics,
      typeMetrics,
      harmonicMetrics
    });
    
    return {
      symbolMetrics,
      flowMetrics,
      typeMetrics,
      harmonicMetrics,
      overallHealth
    };
  }
  
  // Private helper methods
  
  private async createTypeScriptProgram(targetPath: string): Promise<ts.Program | null> {
    try {
      // Find tsconfig.json
      const tsconfigPath = await this.findTsConfig(targetPath);
      
      let compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        lib: ['es2020'],
        allowJs: true,
        checkJs: false,
        strict: false,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs
      };
      
      if (tsconfigPath) {
        // Load tsconfig
        const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(tsconfigPath)
        );
        compilerOptions = parsedConfig.options;
      }
      
      // Get all TypeScript/JavaScript files
      const files = await this.getSourceFiles(targetPath);
      
      // Create program
      this.typeScriptProgram = ts.createProgram(files, compilerOptions);
      
      return this.typeScriptProgram;
    } catch (error) {
      this.logger.error('Failed to create TypeScript program:', error);
      return null;
    }
  }
  
  private async findTsConfig(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    
    while (currentPath !== path.dirname(currentPath)) {
      const tsconfigPath = path.join(currentPath, 'tsconfig.json');
      try {
        await fs.access(tsconfigPath);
        return tsconfigPath;
      } catch {
        // Continue searching up
      }
      currentPath = path.dirname(currentPath);
    }
    
    return null;
  }
  
  private async getSourceFiles(targetPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          // Include TypeScript and JavaScript files
          if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      }
    }
    
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      await walk(targetPath);
    } else {
      files.push(targetPath);
    }
    
    return files;
  }
  
  private generateVariableInsights(tracking: any): any[] {
    const insights: any[] = [];
    
    // Check for type mutations
    const uniqueTypes = new Set(tracking.typeEvolution.map((t: any) => t.type.name));
    if (uniqueTypes.size > 1) {
      insights.push({
        type: 'type_mutation',
        severity: 'medium',
        title: 'Variable type changes during flow',
        description: `Variable type mutates through ${uniqueTypes.size} different types`,
        types: Array.from(uniqueTypes)
      });
    }
    
    // Check for null/undefined in flow
    const hasNullable = tracking.typeEvolution.some((t: any) => 
      t.type.name.includes('null') || t.type.name.includes('undefined')
    );
    
    if (hasNullable) {
      insights.push({
        type: 'nullable_flow',
        severity: 'low',
        title: 'Nullable type in flow',
        description: 'Variable may be null or undefined at some points'
      });
    }
    
    return insights;
  }
  
  private calculateOverallHealth(metrics: any): number {
    let score = 0;
    let weights = 0;
    
    // Symbol health (lower complexity is better)
    if (metrics.symbolMetrics.avgDependencies !== undefined) {
      const depScore = Math.max(0, 1 - metrics.symbolMetrics.avgDependencies / 10);
      score += depScore * 0.2;
      weights += 0.2;
    }
    
    // Flow health (lower complexity is better)
    if (metrics.flowMetrics.cyclomaticComplexity !== undefined) {
      const flowScore = Math.max(0, 1 - metrics.flowMetrics.cyclomaticComplexity / 50);
      score += flowScore * 0.3;
      weights += 0.3;
    }
    
    // Type health (less any usage is better)
    if (metrics.typeMetrics.totalTypes > 0) {
      const typeScore = 1 - (metrics.typeMetrics.anyUsage / metrics.typeMetrics.totalTypes);
      score += Math.max(0, Math.min(1, typeScore)) * 0.3;
      weights += 0.3;
    }
    
    // Harmonic health
    if (metrics.harmonicMetrics.integrationScore !== undefined) {
      score += Math.max(0, Math.min(1, metrics.harmonicMetrics.integrationScore)) * 0.2;
      weights += 0.2;
    }
    
    // Ensure result is between 0 and 1
    const result = weights > 0 ? score / weights : 0;
    return Math.max(0, Math.min(1, result));
  }
  
  /**
   * Enhanced cleanup
   */
  async cleanup(): Promise<void> {
    await super.cleanup();
    
    // Cleanup TypeScript program
    this.typeScriptProgram = undefined;
    
    // Cleanup analyzers
    this.integratedAnalyzer = undefined;
    
    // Cleanup harmonic components
    if (this.harmonicEngine) {
      // TODO: Add cleanup method to harmonic engine
      this.harmonicEngine = undefined;
    }
    
    this.harmonicEnricher = undefined;
  }
}