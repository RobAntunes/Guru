/**
 * Integrated Flow & Type Analyzer
 * Combines flow tracking, type analysis, symbol graph, and harmonic data
 * for comprehensive code intelligence
 */

import ts from 'typescript';
import { Logger } from '../logging/logger.js';
import { SymbolGraph } from '../core/symbol-graph.js';
import { FlowTracker, FlowAnalysis, FlowNode, FlowPath, FlowIssue } from './flow-tracker.js';
import { TypeAnalyzer, TypeAnalysis, TypeInfo, TypeIssue } from './type-analyzer.js';
import { HarmonicEnricher } from '../harmonic-intelligence/core/harmonic-enricher.js';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine.js';

/**
 * Enriched flow node with full context
 */
export interface EnrichedFlowNode extends FlowNode {
  symbolInfo?: {
    name: string;
    type: TypeInfo;
    complexity: number;
    usage: number;
    dependencies: string[];
  };
  harmonicContext?: {
    pattern: string;
    confidence: number;
    resonance: number;
    fieldStrength: number;
  };
  typeContext?: {
    declaredType?: TypeInfo;
    inferredType?: TypeInfo;
    typeFlow: Array<{
      from: TypeInfo;
      to: TypeInfo;
      operation: string;
    }>;
  };
}

/**
 * Enriched flow path with analysis
 */
export interface EnrichedFlowPath extends FlowPath {
  enrichedNodes: EnrichedFlowNode[];
  harmonicCoherence: number;
  typeConsistency: number;
  symbolDensity: number;
  insights: FlowInsight[];
}

/**
 * Flow insight from integrated analysis
 */
export interface FlowInsight {
  type: 'optimization' | 'refactor' | 'bug_risk' | 'pattern' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  evidence: {
    flowPattern?: string;
    typePattern?: string;
    harmonicPattern?: string;
    symbolRelations?: string[];
  };
  suggestion?: string;
}

/**
 * Integrated analysis result
 */
export interface IntegratedAnalysis {
  flow: FlowAnalysis;
  types: TypeAnalysis;
  enrichedPaths: EnrichedFlowPath[];
  insights: FlowInsight[];
  metrics: {
    flowComplexity: number;
    typeComplexity: number;
    harmonicCoherence: number;
    integrationScore: number;
  };
}

/**
 * Integrated analyzer for comprehensive code analysis
 */
export class IntegratedFlowTypeAnalyzer {
  private logger = Logger.getInstance();
  private symbolGraph: SymbolGraph;
  public flowTracker: FlowTracker;
  private typeAnalyzer: TypeAnalyzer;
  private harmonicEnricher?: HarmonicEnricher;
  private harmonicEngine?: HarmonicAnalysisEngine;
  
  constructor(
    symbolGraph: SymbolGraph,
    harmonicEnricher?: HarmonicEnricher,
    harmonicEngine?: HarmonicAnalysisEngine
  ) {
    this.symbolGraph = symbolGraph;
    this.harmonicEnricher = harmonicEnricher;
    this.harmonicEngine = harmonicEngine;
    this.flowTracker = new FlowTracker(symbolGraph);
    this.typeAnalyzer = new TypeAnalyzer(symbolGraph, harmonicEnricher);
  }
  
  /**
   * Perform integrated analysis on a TypeScript program
   */
  async analyzeProgram(program: ts.Program): Promise<IntegratedAnalysis> {
    this.logger.info('🔬 Starting integrated flow & type analysis');
    
    // Run type analysis first to get type context
    const typeAnalysis = await this.typeAnalyzer.analyzeProgram(program);
    
    // Analyze flow for each source file
    const flowAnalyses: FlowAnalysis[] = [];
    
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        const flowAnalysis = await this.flowTracker.analyzeFile(
          sourceFile,
          sourceFile.fileName
        );
        flowAnalyses.push(flowAnalysis);
      }
    }
    
    // Merge flow analyses
    const mergedFlow = this.mergeFlowAnalyses(flowAnalyses);
    
    // Enrich flow paths with full context
    const enrichedPaths = await this.enrichFlowPaths(
      mergedFlow.paths,
      typeAnalysis,
      program
    );
    
    // Generate integrated insights
    const insights = await this.generateIntegratedInsights(
      enrichedPaths,
      typeAnalysis,
      mergedFlow
    );
    
    // Calculate integrated metrics
    const metrics = this.calculateIntegratedMetrics(
      mergedFlow,
      typeAnalysis,
      enrichedPaths
    );
    
    this.logger.info(`✅ Integrated analysis complete: ${insights.length} insights generated`);
    
    return {
      flow: mergedFlow,
      types: typeAnalysis,
      enrichedPaths,
      insights,
      metrics
    };
  }
  
  /**
   * Analyze a specific function with full context
   */
  async analyzeFunctionIntegrated(
    functionName: string,
    program: ts.Program
  ): Promise<{
    flowPaths: EnrichedFlowPath[];
    typeSignature: TypeInfo;
    insights: FlowInsight[];
  }> {
    // Get function symbol from graph
    const symbol = this.symbolGraph.symbols.get(functionName);
    if (!symbol) {
      throw new Error(`Function ${functionName} not found in symbol graph`);
    }
    
    // Get source file and node
    const sourceFile = program.getSourceFile(symbol.location.file);
    if (!sourceFile) {
      throw new Error(`Source file ${symbol.location.file} not found`);
    }
    
    // Find function node
    const functionNode = this.findFunctionNode(sourceFile, functionName);
    if (!functionNode) {
      throw new Error(`Function node for ${functionName} not found`);
    }
    
    // Analyze function flow
    const flowPaths = await this.flowTracker.analyzeFunctionFlow(
      functionNode,
      symbol.location.file
    );
    
    // Get type signature
    const typeAnalysis = await this.typeAnalyzer.analyzeProgram(program);
    const typeSignature = typeAnalysis.types.get(functionName);
    
    if (!typeSignature) {
      throw new Error(`Type signature for ${functionName} not found`);
    }
    
    // Enrich flow paths
    const enrichedPaths = await this.enrichFlowPaths(
      flowPaths,
      typeAnalysis,
      program
    );
    
    // Generate function-specific insights
    const insights = await this.generateFunctionInsights(
      enrichedPaths,
      typeSignature,
      symbol
    );
    
    return {
      flowPaths: enrichedPaths,
      typeSignature,
      insights
    };
  }
  
  /**
   * Track variable flow with type evolution
   */
  async trackVariableWithTypes(
    variableName: string,
    scope: ts.Node,
    program: ts.Program
  ): Promise<{
    flowPath: EnrichedFlowPath;
    typeEvolution: Array<{
      location: string;
      type: TypeInfo;
      operation: string;
    }>;
  }> {
    const sourceFile = scope.getSourceFile();
    
    // Track variable flow
    const flowPath = await this.flowTracker.trackVariableFlow(
      variableName,
      scope,
      sourceFile.fileName
    );
    
    // Get type analysis
    const typeAnalysis = await this.typeAnalyzer.analyzeProgram(program);
    
    // Track type evolution along the flow
    const typeEvolution: Array<{
      location: string;
      type: TypeInfo;
      operation: string;
    }> = [];
    
    for (const node of flowPath.nodes) {
      const typeAtLocation = this.getTypeAtFlowNode(node, typeAnalysis);
      if (typeAtLocation) {
        typeEvolution.push({
          location: `${node.location.file}:${node.location.line}:${node.location.column}`,
          type: typeAtLocation,
          operation: node.nodeKind
        });
      }
    }
    
    // Enrich the flow path
    const [enrichedPath] = await this.enrichFlowPaths(
      [flowPath],
      typeAnalysis,
      program
    );
    
    return {
      flowPath: enrichedPath,
      typeEvolution
    };
  }
  
  /**
   * Analyze async flow with type safety
   */
  async analyzeAsyncFlowIntegrated(
    sourceFile: ts.SourceFile,
    program: ts.Program
  ): Promise<{
    asyncPaths: EnrichedFlowPath[];
    typeIssues: TypeIssue[];
    concurrencyRisks: FlowInsight[];
  }> {
    // Get async flow paths
    const asyncPaths = await this.flowTracker.analyzeAsyncFlow(
      sourceFile,
      sourceFile.fileName
    );
    
    // Get type analysis
    const typeAnalysis = await this.typeAnalyzer.analyzeProgram(program);
    
    // Enrich async paths
    const enrichedPaths = await this.enrichFlowPaths(
      asyncPaths,
      typeAnalysis,
      program
    );
    
    // Find type issues in async flows
    const typeIssues = this.findAsyncTypeIssues(enrichedPaths, typeAnalysis);
    
    // Detect concurrency risks
    const concurrencyRisks = this.detectConcurrencyRisks(enrichedPaths);
    
    return {
      asyncPaths: enrichedPaths,
      typeIssues,
      concurrencyRisks
    };
  }
  
  // Private helper methods
  
  private mergeFlowAnalyses(analyses: FlowAnalysis[]): FlowAnalysis {
    const mergedNodes = new Map<string, FlowNode>();
    const mergedEdges: FlowAnalysis['edges'] = [];
    const mergedPaths: FlowPath[] = [];
    const mergedIssues: FlowIssue[] = [];
    
    for (const analysis of analyses) {
      // Merge nodes
      for (const [id, node] of analysis.nodes) {
        mergedNodes.set(id, node);
      }
      
      // Merge edges
      mergedEdges.push(...analysis.edges);
      
      // Merge paths
      mergedPaths.push(...analysis.paths);
      
      // Merge issues
      mergedIssues.push(...analysis.issues);
    }
    
    // Recalculate metrics
    const metrics = {
      totalPaths: mergedPaths.length,
      avgPathLength: mergedPaths.reduce((sum, p) => sum + p.nodes.length, 0) / Math.max(1, mergedPaths.length),
      maxPathComplexity: Math.max(...mergedPaths.map(p => p.complexity), 0),
      branchingFactor: mergedEdges.length / Math.max(1, mergedNodes.size),
      cyclomaticComplexity: mergedEdges.filter(e => e.type === 'CONTROL').length - mergedNodes.size + 2
    };
    
    return {
      paths: mergedPaths,
      nodes: mergedNodes,
      edges: mergedEdges,
      issues: mergedIssues,
      metrics
    };
  }
  
  private async enrichFlowPaths(
    paths: FlowPath[],
    typeAnalysis: TypeAnalysis,
    program: ts.Program
  ): Promise<EnrichedFlowPath[]> {
    const enrichedPaths: EnrichedFlowPath[] = [];
    
    for (const path of paths) {
      const enrichedNodes: EnrichedFlowNode[] = [];
      
      for (const node of path.nodes) {
        const enrichedNode = await this.enrichFlowNode(
          node,
          typeAnalysis,
          program
        );
        enrichedNodes.push(enrichedNode);
      }
      
      // Calculate path-level metrics
      const harmonicCoherence = await this.calculateHarmonicCoherence(enrichedNodes);
      const typeConsistency = this.calculateTypeConsistency(enrichedNodes);
      const symbolDensity = this.calculateSymbolDensity(enrichedNodes);
      
      // Generate path-specific insights
      const pathInsights = await this.generatePathInsights(enrichedNodes, path);
      
      enrichedPaths.push({
        ...path,
        enrichedNodes,
        harmonicCoherence,
        typeConsistency,
        symbolDensity,
        insights: pathInsights
      });
    }
    
    return enrichedPaths;
  }
  
  private async enrichFlowNode(
    node: FlowNode,
    typeAnalysis: TypeAnalysis,
    program: ts.Program
  ): Promise<EnrichedFlowNode> {
    const enrichedNode: EnrichedFlowNode = { ...node };
    
    // Add symbol information
    if (node.symbol) {
      const graphSymbol = this.symbolGraph.symbols.get(node.symbol);
      if (graphSymbol) {
        const symbolType = typeAnalysis.types.get(node.symbol);
        
        enrichedNode.symbolInfo = {
          name: node.symbol,
          type: symbolType || { id: 'unknown', name: 'unknown', kind: 'unknown', flags: 0 },
          complexity: graphSymbol.complexity || 0,
          usage: graphSymbol.references?.length || 0,
          dependencies: graphSymbol.dependencies || []
        };
        
        // Add harmonic context if available
        if (this.harmonicEnricher && graphSymbol.harmonicSignature) {
          const enrichment = await this.harmonicEnricher.enrichSymbol(graphSymbol);
          if (enrichment) {
            enrichedNode.harmonicContext = {
              pattern: enrichment.primaryPattern || 'unknown',
              confidence: enrichment.confidence || 0,
              resonance: enrichment.resonance || 0,
              fieldStrength: enrichment.fieldStrength || 0
            };
          }
        }
      }
    }
    
    // Add type context
    const typeAtNode = this.getTypeAtFlowNode(node, typeAnalysis);
    if (typeAtNode) {
      enrichedNode.typeContext = {
        declaredType: typeAtNode,
        inferredType: this.inferTypeAtNode(node, typeAnalysis),
        typeFlow: this.getTypeFlowAtNode(node, typeAnalysis)
      };
    }
    
    return enrichedNode;
  }
  
  private async generateIntegratedInsights(
    enrichedPaths: EnrichedFlowPath[],
    typeAnalysis: TypeAnalysis,
    flowAnalysis: FlowAnalysis
  ): Promise<FlowInsight[]> {
    const insights: FlowInsight[] = [];
    
    // Complex flow patterns
    for (const path of enrichedPaths) {
      if (path.complexity > 10) {
        insights.push({
          type: 'refactor',
          severity: 'high',
          title: 'Complex control flow detected',
          description: `Path has complexity score of ${path.complexity}. Consider breaking down into smaller functions.`,
          location: path.nodes[0].location,
          evidence: {
            flowPattern: `${path.nodes.length} nodes with ${path.edges.length} edges`
          },
          suggestion: 'Extract complex logic into separate functions'
        });
      }
      
      // Type inconsistencies in flow
      if (path.typeConsistency < 0.7) {
        insights.push({
          type: 'bug_risk',
          severity: 'medium',
          title: 'Type inconsistency in flow path',
          description: 'Types change unexpectedly along this execution path',
          location: path.nodes[Math.floor(path.nodes.length / 2)].location,
          evidence: {
            typePattern: `Type consistency: ${(path.typeConsistency * 100).toFixed(0)}%`
          }
        });
      }
      
      // Low harmonic coherence
      if (path.harmonicCoherence < 0.5) {
        insights.push({
          type: 'pattern',
          severity: 'low',
          title: 'Low harmonic coherence',
          description: 'Code patterns in this path lack harmonic alignment',
          location: path.nodes[0].location,
          evidence: {
            harmonicPattern: `Coherence: ${(path.harmonicCoherence * 100).toFixed(0)}%`
          },
          suggestion: 'Consider refactoring to improve pattern consistency'
        });
      }
    }
    
    // Type-specific insights
    if (typeAnalysis.metrics.anyUsage > 5) {
      insights.push({
        type: 'refactor',
        severity: 'medium',
        title: 'Excessive use of "any" type',
        description: `Found ${typeAnalysis.metrics.anyUsage} uses of "any" type, reducing type safety`,
        location: { file: '', line: 0, column: 0 }, // TODO: Get specific locations
        evidence: {
          typePattern: `${typeAnalysis.metrics.anyUsage} any types out of ${typeAnalysis.metrics.totalTypes} total`
        },
        suggestion: 'Add explicit type annotations'
      });
    }
    
    // Flow anomalies
    for (const issue of flowAnalysis.issues) {
      if (issue.type === 'unreachable' || issue.type === 'infinite_loop') {
        insights.push({
          type: 'bug_risk',
          severity: 'high',
          title: issue.type === 'unreachable' ? 'Unreachable code' : 'Potential infinite loop',
          description: issue.message,
          location: issue.location,
          evidence: {
            flowPattern: issue.type
          },
          suggestion: issue.type === 'unreachable' ? 
            'Remove unreachable code' : 
            'Add termination condition to loop'
        });
      }
    }
    
    return insights;
  }
  
  private async generatePathInsights(
    nodes: EnrichedFlowNode[],
    path: FlowPath
  ): Promise<FlowInsight[]> {
    const insights: FlowInsight[] = [];
    
    // Look for specific patterns in the enriched nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      
      // Type narrowing opportunities
      if (current.typeContext && next.typeContext) {
        if (current.typeContext.inferredType?.unionTypes && 
            !next.typeContext.inferredType?.unionTypes) {
          insights.push({
            type: 'optimization',
            severity: 'low',
            title: 'Type narrowing opportunity',
            description: 'Union type can be narrowed here',
            location: current.location,
            evidence: {
              typePattern: 'Union to specific type'
            }
          });
        }
      }
      
      // Harmonic disruptions
      if (current.harmonicContext && next.harmonicContext) {
        const resonanceDiff = Math.abs(
          current.harmonicContext.resonance - next.harmonicContext.resonance
        );
        
        if (resonanceDiff > 0.5) {
          insights.push({
            type: 'pattern',
            severity: 'low',
            title: 'Harmonic disruption detected',
            description: 'Large change in harmonic resonance between nodes',
            location: next.location,
            evidence: {
              harmonicPattern: `Resonance change: ${resonanceDiff.toFixed(2)}`
            }
          });
        }
      }
    }
    
    return insights;
  }
  
  private async generateFunctionInsights(
    paths: EnrichedFlowPath[],
    typeSignature: TypeInfo,
    symbol: any
  ): Promise<FlowInsight[]> {
    const insights: FlowInsight[] = [];
    
    // Function complexity
    const avgComplexity = paths.reduce((sum, p) => sum + p.complexity, 0) / paths.length;
    if (avgComplexity > 8) {
      insights.push({
        type: 'refactor',
        severity: 'medium',
        title: 'High function complexity',
        description: `Function has average path complexity of ${avgComplexity.toFixed(1)}`,
        location: symbol.location,
        evidence: {
          flowPattern: `${paths.length} execution paths`
        },
        suggestion: 'Consider breaking down into smaller functions'
      });
    }
    
    // Check for consistent return types
    const returnTypes = new Set<string>();
    for (const path of paths) {
      const returnNodes = path.enrichedNodes.filter(n => n.nodeKind === 'sink');
      for (const node of returnNodes) {
        if (node.typeContext?.declaredType) {
          returnTypes.add(node.typeContext.declaredType.name);
        }
      }
    }
    
    if (returnTypes.size > 1) {
      insights.push({
        type: 'bug_risk',
        severity: 'medium',
        title: 'Inconsistent return types',
        description: `Function returns ${returnTypes.size} different types`,
        location: symbol.location,
        evidence: {
          typePattern: Array.from(returnTypes).join(', ')
        }
      });
    }
    
    return insights;
  }
  
  private calculateIntegratedMetrics(
    flow: FlowAnalysis,
    types: TypeAnalysis,
    enrichedPaths: EnrichedFlowPath[]
  ): IntegratedAnalysis['metrics'] {
    const flowComplexity = flow.metrics.maxPathComplexity;
    const typeComplexity = types.metrics.complexityScore;
    
    // Average harmonic coherence across all paths
    const harmonicCoherence = enrichedPaths.length > 0 ?
      enrichedPaths.reduce((sum, p) => sum + p.harmonicCoherence, 0) / enrichedPaths.length :
      0;
    
    // Integration score combines all aspects
    const integrationScore = (
      (1 - Math.min(1, flowComplexity / 20)) * 0.3 +
      (1 - Math.min(1, typeComplexity / 100)) * 0.3 +
      harmonicCoherence * 0.2 +
      (1 - Math.min(1, types.metrics.anyUsage / types.metrics.totalTypes)) * 0.2
    );
    
    return {
      flowComplexity,
      typeComplexity,
      harmonicCoherence,
      integrationScore
    };
  }
  
  private async calculateHarmonicCoherence(nodes: EnrichedFlowNode[]): Promise<number> {
    if (!this.harmonicEngine || nodes.length === 0) return 0;
    
    let totalCoherence = 0;
    let count = 0;
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      
      if (current.harmonicContext && next.harmonicContext) {
        // Simple coherence based on pattern similarity
        const coherence = current.harmonicContext.pattern === next.harmonicContext.pattern ? 1 : 0.5;
        totalCoherence += coherence;
        count++;
      }
    }
    
    return count > 0 ? totalCoherence / count : 0;
  }
  
  private calculateTypeConsistency(nodes: EnrichedFlowNode[]): number {
    let consistentTransitions = 0;
    let totalTransitions = 0;
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      
      if (current.typeContext && next.typeContext) {
        totalTransitions++;
        
        // Check if types are compatible
        if (this.areTypesConsistent(
          current.typeContext.inferredType || current.typeContext.declaredType,
          next.typeContext.inferredType || next.typeContext.declaredType
        )) {
          consistentTransitions++;
        }
      }
    }
    
    return totalTransitions > 0 ? consistentTransitions / totalTransitions : 1;
  }
  
  private calculateSymbolDensity(nodes: EnrichedFlowNode[]): number {
    const nodesWithSymbols = nodes.filter(n => n.symbolInfo).length;
    return nodes.length > 0 ? nodesWithSymbols / nodes.length : 0;
  }
  
  private areTypesConsistent(type1?: TypeInfo, type2?: TypeInfo): boolean {
    if (!type1 || !type2) return true;
    if (type1.name === type2.name) return true;
    
    // Check for subtype relationships
    // TODO: Implement proper subtype checking
    
    return false;
  }
  
  private getTypeAtFlowNode(node: FlowNode, typeAnalysis: TypeAnalysis): TypeInfo | undefined {
    if (!node.symbol) return undefined;
    return typeAnalysis.types.get(node.symbol);
  }
  
  private inferTypeAtNode(node: FlowNode, typeAnalysis: TypeAnalysis): TypeInfo | undefined {
    // Look for type flows that target this node's location
    for (const flow of typeAnalysis.flows) {
      if (flow.to === node.symbol || flow.to === this.getNodeLocationString(node)) {
        return flow.type;
      }
    }
    return undefined;
  }
  
  private getTypeFlowAtNode(node: FlowNode, typeAnalysis: TypeAnalysis): Array<{
    from: TypeInfo;
    to: TypeInfo;
    operation: string;
  }> {
    const flows: Array<{
      from: TypeInfo;
      to: TypeInfo;
      operation: string;
    }> = [];
    
    // Find type flows involving this node
    for (const flow of typeAnalysis.flows) {
      if (flow.from === node.symbol || flow.to === node.symbol) {
        const fromType = typeAnalysis.types.get(flow.from) || flow.type;
        const toType = typeAnalysis.types.get(flow.to) || flow.type;
        
        flows.push({
          from: fromType,
          to: toType,
          operation: flow.operation
        });
      }
    }
    
    return flows;
  }
  
  private getNodeLocationString(node: FlowNode): string {
    return `${node.location.file}:${node.location.line}:${node.location.column}`;
  }
  
  private findFunctionNode(
    sourceFile: ts.SourceFile,
    functionName: string
  ): ts.FunctionLikeDeclaration | undefined {
    let result: ts.FunctionLikeDeclaration | undefined;
    
    const visit = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) || 
          ts.isMethodDeclaration(node) || 
          ts.isArrowFunction(node)) {
        if (node.name?.getText() === functionName) {
          result = node;
        }
      }
      
      if (!result) {
        ts.forEachChild(node, visit);
      }
    };
    
    visit(sourceFile);
    return result;
  }
  
  private findAsyncTypeIssues(
    paths: EnrichedFlowPath[],
    typeAnalysis: TypeAnalysis
  ): TypeIssue[] {
    const issues: TypeIssue[] = [];
    
    for (const path of paths) {
      for (const node of path.enrichedNodes) {
        if (node.type === 'ASYNC' && node.typeContext) {
          // Check for unhandled promise types
          if (node.typeContext.declaredType?.name.includes('Promise') &&
              !node.typeContext.inferredType?.name.includes('await')) {
            issues.push({
              type: 'missing_await',
              severity: 'warning',
              location: node.location,
              message: 'Promise not awaited',
              actualType: node.typeContext.declaredType,
              suggestion: 'Add await keyword or handle promise explicitly'
            });
          }
        }
      }
    }
    
    return issues;
  }
  
  private detectConcurrencyRisks(paths: EnrichedFlowPath[]): FlowInsight[] {
    const risks: FlowInsight[] = [];
    
    // Look for shared state accessed in async paths
    const asyncPaths = paths.filter(p => 
      p.enrichedNodes.some(n => n.type === 'ASYNC')
    );
    
    // Track accessed symbols across async paths
    const symbolAccess = new Map<string, number>();
    
    for (const path of asyncPaths) {
      for (const node of path.enrichedNodes) {
        if (node.symbolInfo) {
          const count = symbolAccess.get(node.symbolInfo.name) || 0;
          symbolAccess.set(node.symbolInfo.name, count + 1);
        }
      }
    }
    
    // Identify potential race conditions
    for (const [symbol, count] of symbolAccess) {
      if (count > 1) {
        risks.push({
          type: 'bug_risk',
          severity: 'high',
          title: 'Potential race condition',
          description: `Symbol '${symbol}' accessed in ${count} async paths`,
          location: { file: '', line: 0, column: 0 }, // TODO: Get actual location
          evidence: {
            flowPattern: `${count} concurrent accesses`,
            symbolRelations: [symbol]
          },
          suggestion: 'Use synchronization mechanisms or immutable data'
        });
      }
    }
    
    return risks;
  }
}