/**
 * Flow Tracker - Analyzes data and control flow through code
 * Tracks how values propagate and how execution paths branch
 */

import ts from 'typescript';
import { Logger } from '../logging/logger.js';
import { SymbolGraph } from '../core/symbol-graph.js';

/**
 * Flow types we track
 */
export enum FlowType {
  DATA = 'data',           // Data flow (assignments, parameters, returns)
  CONTROL = 'control',     // Control flow (if, switch, loops)
  EXCEPTION = 'exception', // Exception flow (try/catch, throw)
  ASYNC = 'async',        // Async flow (promises, async/await)
  EFFECT = 'effect'       // Side effects (I/O, mutations)
}

/**
 * Flow node in the flow graph
 */
export interface FlowNode {
  id: string;
  type: FlowType;
  nodeKind: 'source' | 'sink' | 'transform' | 'branch' | 'merge';
  location: {
    file: string;
    line: number;
    column: number;
  };
  symbol?: string;
  value?: any;
  metadata?: any;
}

/**
 * Flow edge connecting nodes
 */
export interface FlowEdge {
  from: string;
  to: string;
  type: FlowType;
  condition?: string;  // For conditional flows
  probability?: number; // Likelihood of this path
}

/**
 * Flow path through the code
 */
export interface FlowPath {
  id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  type: FlowType;
  confidence: number;
  complexity: number;
  issues?: FlowIssue[];
}

/**
 * Flow analysis issue
 */
export interface FlowIssue {
  type: 'dead_code' | 'unreachable' | 'infinite_loop' | 'race_condition' | 'data_leak' | 'null_flow' | 'type_mismatch';
  severity: 'error' | 'warning' | 'info';
  location: {
    file: string;
    line: number;
    column: number;
  };
  message: string;
  flowPath?: string;
}

/**
 * Flow analysis result
 */
export interface FlowAnalysis {
  paths: FlowPath[];
  nodes: Map<string, FlowNode>;
  edges: FlowEdge[];
  issues: FlowIssue[];
  metrics: {
    totalPaths: number;
    avgPathLength: number;
    maxPathComplexity: number;
    branchingFactor: number;
    cyclomaticComplexity: number;
  };
}

/**
 * Flow tracker for analyzing code flow
 */
export class FlowTracker {
  private logger = Logger.getInstance();
  private symbolGraph: SymbolGraph;
  private nodes: Map<string, FlowNode> = new Map();
  private edges: FlowEdge[] = [];
  private flowIdCounter = 0;
  
  constructor(symbolGraph: SymbolGraph) {
    this.symbolGraph = symbolGraph;
  }
  
  /**
   * Analyze flow in a TypeScript source file
   */
  async analyzeFile(sourceFile: ts.SourceFile, filePath: string): Promise<FlowAnalysis> {
    this.logger.debug(`Analyzing flow in ${filePath}`);
    
    // Reset state for new file
    this.nodes.clear();
    this.edges = [];
    this.flowIdCounter = 0;
    
    // Visit AST and build flow graph
    this.visitNode(sourceFile, filePath);
    
    // Identify flow paths
    const paths = this.identifyFlowPaths();
    
    // Detect flow issues
    const issues = this.detectFlowIssues(paths);
    
    // Calculate metrics
    const metrics = this.calculateFlowMetrics(paths);
    
    return {
      paths,
      nodes: this.nodes,
      edges: this.edges,
      issues,
      metrics
    };
  }
  
  /**
   * Analyze flow for a specific function
   */
  async analyzeFunctionFlow(
    functionNode: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
    filePath: string
  ): Promise<FlowPath[]> {
    const functionName = this.getFunctionName(functionNode);
    this.logger.debug(`Analyzing flow for function: ${functionName}`);
    
    // Create entry node
    const entryNode = this.createFlowNode(
      FlowType.CONTROL,
      'source',
      filePath,
      functionNode.getStart(),
      `${functionName}_entry`
    );
    
    // Analyze function body
    if (functionNode.body) {
      this.analyzeBlockFlow(functionNode.body, filePath, entryNode.id);
    }
    
    // Create exit node
    const exitNode = this.createFlowNode(
      FlowType.CONTROL,
      'sink',
      filePath,
      functionNode.getEnd(),
      `${functionName}_exit`
    );
    
    // Find all paths from entry to exit
    return this.findPaths(entryNode.id, exitNode.id);
  }
  
  /**
   * Track data flow for a variable
   */
  async trackVariableFlow(variableName: string, scope: ts.Node, filePath: string): Promise<FlowPath> {
    this.logger.debug(`Tracking flow for variable: ${variableName}`);
    
    const flowNodes: FlowNode[] = [];
    const flowEdges: FlowEdge[] = [];
    
    // Find all references to the variable
    const references = this.findVariableReferences(variableName, scope);
    
    // Build flow path
    let prevNodeId: string | null = null;
    
    for (const ref of references) {
      const node = this.createFlowNode(
        FlowType.DATA,
        this.getNodeKind(ref),
        filePath,
        ref.getStart(),
        variableName
      );
      
      flowNodes.push(node);
      
      if (prevNodeId) {
        flowEdges.push({
          from: prevNodeId,
          to: node.id,
          type: FlowType.DATA
        });
      }
      
      prevNodeId = node.id;
    }
    
    return {
      id: `flow_var_${variableName}`,
      nodes: flowNodes,
      edges: flowEdges,
      type: FlowType.DATA,
      confidence: 0.9,
      complexity: this.calculatePathComplexity(flowNodes, flowEdges)
    };
  }
  
  /**
   * Analyze async flow patterns
   */
  async analyzeAsyncFlow(sourceFile: ts.SourceFile, filePath: string): Promise<FlowPath[]> {
    const asyncPaths: FlowPath[] = [];
    
    // Find all async operations
    const asyncOps = this.findAsyncOperations(sourceFile);
    
    for (const op of asyncOps) {
      const path = await this.buildAsyncFlowPath(op, filePath);
      if (path) {
        asyncPaths.push(path);
      }
    }
    
    return asyncPaths;
  }
  
  // Private helper methods
  
  private visitNode(node: ts.Node, filePath: string, parentId?: string): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.ArrowFunction:
        this.visitFunction(node as ts.FunctionLikeDeclaration, filePath);
        break;
        
      case ts.SyntaxKind.IfStatement:
        this.visitIfStatement(node as ts.IfStatement, filePath, parentId);
        break;
        
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
        this.visitLoop(node, filePath, parentId);
        break;
        
      case ts.SyntaxKind.SwitchStatement:
        this.visitSwitch(node as ts.SwitchStatement, filePath, parentId);
        break;
        
      case ts.SyntaxKind.TryStatement:
        this.visitTry(node as ts.TryStatement, filePath, parentId);
        break;
        
      case ts.SyntaxKind.ThrowStatement:
        this.visitThrow(node as ts.ThrowStatement, filePath, parentId);
        break;
        
      case ts.SyntaxKind.ReturnStatement:
        this.visitReturn(node as ts.ReturnStatement, filePath, parentId);
        break;
        
      case ts.SyntaxKind.VariableDeclaration:
        this.visitVariableDeclaration(node as ts.VariableDeclaration, filePath, parentId);
        break;
        
      case ts.SyntaxKind.CallExpression:
        this.visitCallExpression(node as ts.CallExpression, filePath, parentId);
        break;
    }
    
    // Continue traversing
    ts.forEachChild(node, child => this.visitNode(child, filePath, parentId));
  }
  
  private visitFunction(node: ts.FunctionLikeDeclaration, filePath: string): void {
    const name = this.getFunctionName(node);
    
    const entryNode = this.createFlowNode(
      FlowType.CONTROL,
      'source',
      filePath,
      node.getStart(),
      name
    );
    
    if (node.body) {
      this.analyzeBlockFlow(node.body, filePath, entryNode.id);
    }
  }
  
  private visitIfStatement(node: ts.IfStatement, filePath: string, parentId?: string): void {
    const branchNode = this.createFlowNode(
      FlowType.CONTROL,
      'branch',
      filePath,
      node.getStart(),
      'if'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: branchNode.id,
        type: FlowType.CONTROL
      });
    }
    
    // Then branch
    const thenNode = this.createFlowNode(
      FlowType.CONTROL,
      'transform',
      filePath,
      node.thenStatement.getStart(),
      'then'
    );
    
    this.edges.push({
      from: branchNode.id,
      to: thenNode.id,
      type: FlowType.CONTROL,
      condition: 'true',
      probability: 0.5
    });
    
    this.visitNode(node.thenStatement, filePath, thenNode.id);
    
    // Else branch
    if (node.elseStatement) {
      const elseNode = this.createFlowNode(
        FlowType.CONTROL,
        'transform',
        filePath,
        node.elseStatement.getStart(),
        'else'
      );
      
      this.edges.push({
        from: branchNode.id,
        to: elseNode.id,
        type: FlowType.CONTROL,
        condition: 'false',
        probability: 0.5
      });
      
      this.visitNode(node.elseStatement, filePath, elseNode.id);
    }
  }
  
  private visitLoop(node: ts.Node, filePath: string, parentId?: string): void {
    const loopNode = this.createFlowNode(
      FlowType.CONTROL,
      'branch',
      filePath,
      node.getStart(),
      'loop'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: loopNode.id,
        type: FlowType.CONTROL
      });
    }
    
    // Create back edge for loop
    const bodyNode = this.createFlowNode(
      FlowType.CONTROL,
      'transform',
      filePath,
      node.getStart() + 1,
      'loop_body'
    );
    
    this.edges.push({
      from: loopNode.id,
      to: bodyNode.id,
      type: FlowType.CONTROL,
      condition: 'continue',
      probability: 0.8
    });
    
    // Back edge
    this.edges.push({
      from: bodyNode.id,
      to: loopNode.id,
      type: FlowType.CONTROL,
      condition: 'iterate',
      probability: 0.7
    });
  }
  
  private visitSwitch(node: ts.SwitchStatement, filePath: string, parentId?: string): void {
    const switchNode = this.createFlowNode(
      FlowType.CONTROL,
      'branch',
      filePath,
      node.getStart(),
      'switch'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: switchNode.id,
        type: FlowType.CONTROL
      });
    }
    
    // Process cases
    for (const caseClause of node.caseBlock.clauses) {
      const caseNode = this.createFlowNode(
        FlowType.CONTROL,
        'transform',
        filePath,
        caseClause.getStart(),
        'case'
      );
      
      this.edges.push({
        from: switchNode.id,
        to: caseNode.id,
        type: FlowType.CONTROL,
        condition: ts.isDefaultClause(caseClause) ? 'default' : 'case',
        probability: 1 / node.caseBlock.clauses.length
      });
      
      for (const statement of caseClause.statements) {
        this.visitNode(statement, filePath, caseNode.id);
      }
    }
  }
  
  private visitTry(node: ts.TryStatement, filePath: string, parentId?: string): void {
    const tryNode = this.createFlowNode(
      FlowType.EXCEPTION,
      'branch',
      filePath,
      node.getStart(),
      'try'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: tryNode.id,
        type: FlowType.CONTROL
      });
    }
    
    // Try block
    this.visitNode(node.tryBlock, filePath, tryNode.id);
    
    // Catch block
    if (node.catchClause) {
      const catchNode = this.createFlowNode(
        FlowType.EXCEPTION,
        'transform',
        filePath,
        node.catchClause.getStart(),
        'catch'
      );
      
      this.edges.push({
        from: tryNode.id,
        to: catchNode.id,
        type: FlowType.EXCEPTION,
        condition: 'exception',
        probability: 0.1
      });
      
      this.visitNode(node.catchClause.block, filePath, catchNode.id);
    }
    
    // Finally block
    if (node.finallyBlock) {
      const finallyNode = this.createFlowNode(
        FlowType.CONTROL,
        'transform',
        filePath,
        node.finallyBlock.getStart(),
        'finally'
      );
      
      this.edges.push({
        from: tryNode.id,
        to: finallyNode.id,
        type: FlowType.CONTROL,
        condition: 'always',
        probability: 1
      });
      
      this.visitNode(node.finallyBlock, filePath, finallyNode.id);
    }
  }
  
  private visitThrow(node: ts.ThrowStatement, filePath: string, parentId?: string): void {
    const throwNode = this.createFlowNode(
      FlowType.EXCEPTION,
      'source',
      filePath,
      node.getStart(),
      'throw'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: throwNode.id,
        type: FlowType.EXCEPTION
      });
    }
  }
  
  private visitReturn(node: ts.ReturnStatement, filePath: string, parentId?: string): void {
    const returnNode = this.createFlowNode(
      FlowType.DATA,
      'sink',
      filePath,
      node.getStart(),
      'return'
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: returnNode.id,
        type: FlowType.CONTROL
      });
    }
    
    if (node.expression) {
      this.visitNode(node.expression, filePath, returnNode.id);
    }
  }
  
  private visitVariableDeclaration(node: ts.VariableDeclaration, filePath: string, parentId?: string): void {
    const varNode = this.createFlowNode(
      FlowType.DATA,
      'source',
      filePath,
      node.getStart(),
      node.name.getText()
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: varNode.id,
        type: FlowType.DATA
      });
    }
    
    if (node.initializer) {
      this.visitNode(node.initializer, filePath, varNode.id);
    }
  }
  
  private visitCallExpression(node: ts.CallExpression, filePath: string, parentId?: string): void {
    const callNode = this.createFlowNode(
      FlowType.EFFECT,
      'transform',
      filePath,
      node.getStart(),
      node.expression.getText()
    );
    
    if (parentId) {
      this.edges.push({
        from: parentId,
        to: callNode.id,
        type: FlowType.CONTROL
      });
    }
    
    // Track async calls
    if (this.isAsyncCall(node)) {
      callNode.type = FlowType.ASYNC;
    }
  }
  
  private createFlowNode(
    type: FlowType,
    nodeKind: FlowNode['nodeKind'],
    file: string,
    position: number,
    symbol?: string
  ): FlowNode {
    const id = `flow_${this.flowIdCounter++}`;
    const sourceFile = ts.createSourceFile(file, '', ts.ScriptTarget.Latest);
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(position);
    
    const node: FlowNode = {
      id,
      type,
      nodeKind,
      location: {
        file,
        line: line + 1,
        column: character + 1
      },
      symbol
    };
    
    this.nodes.set(id, node);
    return node;
  }
  
  private getFunctionName(node: ts.FunctionLikeDeclaration): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || 'anonymous';
    }
    return 'arrow_function';
  }
  
  private analyzeBlockFlow(block: ts.Node, filePath: string, parentId: string): void {
    if (ts.isBlock(block)) {
      let prevNodeId = parentId;
      
      for (const statement of block.statements) {
        const stmtNode = this.createFlowNode(
          FlowType.CONTROL,
          'transform',
          filePath,
          statement.getStart()
        );
        
        this.edges.push({
          from: prevNodeId,
          to: stmtNode.id,
          type: FlowType.CONTROL
        });
        
        this.visitNode(statement, filePath, stmtNode.id);
        prevNodeId = stmtNode.id;
      }
    } else {
      this.visitNode(block, filePath, parentId);
    }
  }
  
  private identifyFlowPaths(): FlowPath[] {
    const paths: FlowPath[] = [];
    
    // Find all source nodes
    const sourceNodes = Array.from(this.nodes.values()).filter(n => n.nodeKind === 'source');
    
    for (const source of sourceNodes) {
      // Find all sink nodes reachable from this source
      const sinkNodes = Array.from(this.nodes.values()).filter(n => n.nodeKind === 'sink');
      
      for (const sink of sinkNodes) {
        const pathsToSink = this.findPaths(source.id, sink.id);
        paths.push(...pathsToSink);
      }
    }
    
    return paths;
  }
  
  private findPaths(startId: string, endId: string): FlowPath[] {
    const paths: FlowPath[] = [];
    const visited = new Set<string>();
    
    const dfs = (currentId: string, path: FlowNode[], edges: FlowEdge[]): void => {
      if (currentId === endId) {
        paths.push({
          id: `path_${paths.length}`,
          nodes: [...path, this.nodes.get(currentId)!],
          edges: [...edges],
          type: path[0]?.type || FlowType.CONTROL,
          confidence: this.calculatePathConfidence(edges),
          complexity: this.calculatePathComplexity(path, edges)
        });
        return;
      }
      
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const currentNode = this.nodes.get(currentId);
      if (!currentNode) return;
      
      const outgoingEdges = this.edges.filter(e => e.from === currentId);
      
      for (const edge of outgoingEdges) {
        dfs(edge.to, [...path, currentNode], [...edges, edge]);
      }
      
      visited.delete(currentId);
    };
    
    dfs(startId, [], []);
    return paths;
  }
  
  private detectFlowIssues(paths: FlowPath[]): FlowIssue[] {
    const issues: FlowIssue[] = [];
    
    // Detect unreachable code
    const reachableNodes = new Set<string>();
    for (const path of paths) {
      for (const node of path.nodes) {
        reachableNodes.add(node.id);
      }
    }
    
    for (const [nodeId, node] of this.nodes) {
      if (!reachableNodes.has(nodeId) && node.nodeKind !== 'source') {
        issues.push({
          type: 'unreachable',
          severity: 'warning',
          location: node.location,
          message: `Unreachable code detected${node.symbol ? ` at ${node.symbol}` : ''}`
        });
      }
    }
    
    // Detect potential infinite loops
    for (const path of paths) {
      const visitedNodes = new Set<string>();
      for (const node of path.nodes) {
        if (visitedNodes.has(node.id)) {
          issues.push({
            type: 'infinite_loop',
            severity: 'warning',
            location: node.location,
            message: 'Potential infinite loop detected',
            flowPath: path.id
          });
          break;
        }
        visitedNodes.add(node.id);
      }
    }
    
    // Detect null flows
    for (const path of paths) {
      const nullFlows = this.detectNullFlows(path);
      issues.push(...nullFlows);
    }
    
    return issues;
  }
  
  private detectNullFlows(path: FlowPath): FlowIssue[] {
    const issues: FlowIssue[] = [];
    
    for (let i = 0; i < path.nodes.length - 1; i++) {
      const node = path.nodes[i];
      const nextNode = path.nodes[i + 1];
      
      // Simple null flow detection
      if (node.symbol && nextNode.symbol === node.symbol) {
        // Check if value might be null
        if (node.metadata?.nullable && !nextNode.metadata?.nullChecked) {
          issues.push({
            type: 'null_flow',
            severity: 'warning',
            location: nextNode.location,
            message: `Potential null reference: ${node.symbol}`,
            flowPath: path.id
          });
        }
      }
    }
    
    return issues;
  }
  
  private calculateFlowMetrics(paths: FlowPath[]): FlowAnalysis['metrics'] {
    const pathLengths = paths.map(p => p.nodes.length);
    const complexities = paths.map(p => p.complexity);
    
    // Calculate branching factor
    const branchNodes = Array.from(this.nodes.values()).filter(n => n.nodeKind === 'branch');
    let totalBranches = 0;
    
    for (const branch of branchNodes) {
      const outgoing = this.edges.filter(e => e.from === branch.id);
      totalBranches += outgoing.length;
    }
    
    const branchingFactor = branchNodes.length > 0 ? totalBranches / branchNodes.length : 1;
    
    return {
      totalPaths: paths.length,
      avgPathLength: pathLengths.length > 0 ? pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length : 0,
      maxPathComplexity: Math.max(...complexities, 0),
      branchingFactor,
      cyclomaticComplexity: this.edges.filter(e => e.type === FlowType.CONTROL).length - this.nodes.size + 2
    };
  }
  
  private calculatePathConfidence(edges: FlowEdge[]): number {
    if (edges.length === 0) return 1;
    
    // Calculate confidence based on edge probabilities
    let confidence = 1;
    for (const edge of edges) {
      if (edge.probability !== undefined) {
        confidence *= edge.probability;
      }
    }
    
    return confidence;
  }
  
  private calculatePathComplexity(nodes: FlowNode[], edges: FlowEdge[]): number {
    let complexity = 1;
    
    // Add complexity for branches
    complexity += nodes.filter(n => n.nodeKind === 'branch').length * 2;
    
    // Add complexity for loops (back edges)
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
        const fromIndex = nodes.findIndex(n => n.id === edge.from);
        const toIndex = nodes.findIndex(n => n.id === edge.to);
        if (toIndex < fromIndex) {
          complexity += 3; // Loop adds significant complexity
        }
      }
    }
    
    // Add complexity for exception handling
    complexity += nodes.filter(n => n.type === FlowType.EXCEPTION).length * 1.5;
    
    return Math.round(complexity);
  }
  
  private findVariableReferences(variableName: string, scope: ts.Node): ts.Node[] {
    const references: ts.Node[] = [];
    
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && node.text === variableName) {
        references.push(node);
      }
      ts.forEachChild(node, visit);
    };
    
    visit(scope);
    return references;
  }
  
  private getNodeKind(node: ts.Node): FlowNode['nodeKind'] {
    if (ts.isVariableDeclaration(node)) return 'source';
    if (ts.isReturnStatement(node)) return 'sink';
    if (ts.isIfStatement(node) || ts.isSwitchStatement(node)) return 'branch';
    return 'transform';
  }
  
  private findAsyncOperations(node: ts.Node): ts.Node[] {
    const asyncOps: ts.Node[] = [];
    
    const visit = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && this.isAsyncCall(n)) {
        asyncOps.push(n);
      } else if (ts.isAwaitExpression(n)) {
        asyncOps.push(n);
      } else if (ts.isFunctionLike(n) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
        asyncOps.push(n);
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    return asyncOps;
  }
  
  private isAsyncCall(node: ts.CallExpression): boolean {
    const text = node.expression.getText();
    return text.includes('Promise') || 
           text.includes('async') || 
           text.includes('await') ||
           text.endsWith('.then') ||
           text.endsWith('.catch') ||
           text.endsWith('.finally');
  }
  
  private async buildAsyncFlowPath(asyncOp: ts.Node, filePath: string): Promise<FlowPath | null> {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    
    const startNode = this.createFlowNode(
      FlowType.ASYNC,
      'source',
      filePath,
      asyncOp.getStart(),
      'async_start'
    );
    
    nodes.push(startNode);
    
    // TODO: Implement detailed async flow analysis
    
    return {
      id: `async_flow_${nodes.length}`,
      nodes,
      edges,
      type: FlowType.ASYNC,
      confidence: 0.8,
      complexity: 2
    };
  }
}