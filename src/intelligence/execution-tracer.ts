/**
 * ExecutionTracer - AI-Optimized Static Execution Simulation
 *
 * Creates virtual execution traces without running code, providing
 * deep understanding of how code flows and data moves for AI consumption.
 */

import {
  ExecutionTrace,
  StackFrame,
  SymbolGraph,
  DataFlowEdge,
  ControlFlowNode,
  ExecutionPath,
  SymbolNode,
} from "../types/index.js";

export interface TraceParams {
  symbolGraph: SymbolGraph;
  entryPoint: string;
  maxDepth?: number;
  followBranches?: boolean;
  includeDataFlow?: boolean;
}

export interface TraceContext {
  visited: Set<string>;
  callStack: string[];
  currentDepth: number;
  maxDepth: number;
}

export class ExecutionTracer {
  async trace(params: TraceParams): Promise<ExecutionTrace> {
    console.error(
      `🏃 AI-Optimized execution tracing from ${params.entryPoint}`,
    );

    const entrySymbol = params.symbolGraph.symbols.get(params.entryPoint);
    if (!entrySymbol) {
      throw new Error(
        `Entry point ${params.entryPoint} not found in symbol graph`,
      );
    }

    const context: TraceContext = {
      visited: new Set(),
      callStack: [],
      currentDepth: 0,
      maxDepth: params.maxDepth || 10,
    };

    // AI-focused: Build execution simulation using dependency graph
    const stackFrames = await this.buildStackFrames(
      params.symbolGraph,
      params.entryPoint,
      context,
    );

    // Analyze data flow through dependencies (AI-critical for understanding)
    const dataFlow =
      params.includeDataFlow !== false
        ? await this.analyzeDataFlow(params.symbolGraph, stackFrames)
        : [];

    // Build control flow graph (AI-optimized for path understanding)
    const controlFlow = await this.buildControlFlow(
      params.symbolGraph,
      params.entryPoint,
      context,
    );

    // Enumerate possible execution paths with probabilities (AI insights)
    const executionPaths = await this.enumerateExecutionPaths(
      controlFlow,
      params.symbolGraph,
      params.followBranches !== false,
    );

    console.error(
      `✅ Traced: ${stackFrames.length} frames, ${dataFlow.length} data flows, ${executionPaths.length} paths`,
    );

    return {
      entryPoint: params.entryPoint,
      stackFrames,
      dataFlow,
      controlFlow,
      executionPaths,
    };
  }

  private async buildStackFrames(
    symbolGraph: SymbolGraph,
    entryPoint: string,
    context: TraceContext,
  ): Promise<StackFrame[]> {
    const frames: StackFrame[] = [];

    // AI-optimized: Use dependency graph to simulate call stack
    const visited = new Set<string>();
    const frameQueue: Array<{
      symbolId: string;
      depth: number;
      calledFrom?: StackFrame;
    }> = [{ symbolId: entryPoint, depth: 0, calledFrom: undefined }];

    while (frameQueue.length > 0 && frames.length < 100) {
      // Safety limit
      const { symbolId, depth, calledFrom } = frameQueue.shift()!;

      if (visited.has(symbolId) || depth > context.maxDepth) {
        continue;
      }

      visited.add(symbolId);
      const symbol = symbolGraph.symbols.get(symbolId);
      if (!symbol) continue;

      // Create stack frame
      const frame: StackFrame = {
        functionId: symbolId,
        depth,
        localVariables: this.extractLocalVariables(symbol),
        calledFrom: calledFrom || undefined,
        callsTo: [],
      };

      frames.push(frame);

      // AI-critical: Follow 'calls' edges to build call hierarchy
      const callEdges = symbolGraph.edges.filter(
        (edge) => edge.from === symbolId && edge.type === "calls",
      );

      for (const edge of callEdges) {
        const targetSymbol = symbolGraph.symbols.get(edge.to);
        if (targetSymbol && targetSymbol.type === "function") {
          frameQueue.push({
            symbolId: edge.to,
            depth: depth + 1,
            calledFrom: frame,
          });

          // Add to callsTo for parent frame
          frame.callsTo.push({
            functionId: edge.to,
            depth: depth + 1,
            localVariables: [],
            callsTo: [],
          });
        }
      }
    }

    return frames;
  }

  private extractLocalVariables(symbol: SymbolNode): any[] {
    // AI-optimized: Extract parameter information for AI understanding
    const variables = [];

    if (symbol.metadata.parameters) {
      variables.push(
        ...symbol.metadata.parameters.map((param) => ({
          name: param.name,
          type: param.type || "unknown",
          scope: "parameter",
          lifetime: {
            created: 0,
            lastAccessed: 0,
            modified: [],
          },
        })),
      );
    }

    return variables;
  }

  private async analyzeDataFlow(
    symbolGraph: SymbolGraph,
    stackFrames: StackFrame[],
  ): Promise<DataFlowEdge[]> {
    const dataFlowEdges: DataFlowEdge[] = [];

    // AI-focused: Track data flow through function calls and variable usage
    for (const frame of stackFrames) {
      const symbol = symbolGraph.symbols.get(frame.functionId);
      if (!symbol) continue;

      // Find variable references and uses edges
      const useEdges = symbolGraph.edges.filter(
        (edge) =>
          edge.from === frame.functionId &&
          (edge.type === "uses" || edge.type === "references"),
      );

      for (const edge of useEdges) {
        const targetSymbol = symbolGraph.symbols.get(edge.to);
        if (targetSymbol) {
          dataFlowEdges.push({
            from: frame.functionId,
            to: edge.to,
            variable: targetSymbol.name,
            transformation: this.inferTransformation(
              edge,
              symbol,
              targetSymbol,
            ),
          });
        }
      }
    }

    return dataFlowEdges;
  }

  private inferTransformation(
    edge: any,
    fromSymbol: SymbolNode,
    toSymbol: SymbolNode,
  ): string | undefined {
    // AI-insight: Infer what transformation happens to data
    if (edge.type === "calls" && toSymbol.name.includes("process")) {
      return "data_processing";
    }
    if (edge.type === "calls" && toSymbol.name.includes("validate")) {
      return "validation";
    }
    if (edge.type === "uses" && toSymbol.name.includes("logger")) {
      return "logging";
    }
    return undefined;
  }

  private async buildControlFlow(
    symbolGraph: SymbolGraph,
    entryPoint: string,
    context: TraceContext,
  ): Promise<ControlFlowNode[]> {
    const controlFlowNodes: ControlFlowNode[] = [];
    const visited = new Set<string>();

    // AI-optimized: Build control flow from dependency relationships
    const nodeQueue: Array<{ symbolId: string; nodeType: "entry" | "call" }> = [
      { symbolId: entryPoint, nodeType: "entry" },
    ];

    while (nodeQueue.length > 0) {
      const { symbolId, nodeType } = nodeQueue.shift()!;

      if (visited.has(symbolId)) continue;
      visited.add(symbolId);

      const symbol = symbolGraph.symbols.get(symbolId);
      if (!symbol) continue;

      const node: ControlFlowNode = {
        id: `${symbolId}_${nodeType}`,
        type: nodeType,
        children: [],
      };

      controlFlowNodes.push(node);

      // Follow dependencies to build control flow
      const dependencyEdges = symbolGraph.edges.filter(
        (edge) => edge.from === symbolId && edge.type === "calls",
      );

      for (const edge of dependencyEdges) {
        const childNodeId = `${edge.to}_call`;
        node.children.push(childNodeId);

        nodeQueue.push({
          symbolId: edge.to,
          nodeType: "call",
        });
      }

      // Add exit node for functions
      if (symbol.type === "function" && dependencyEdges.length === 0) {
        const exitNode: ControlFlowNode = {
          id: `${symbolId}_exit`,
          type: "exit",
          children: [],
        };
        controlFlowNodes.push(exitNode);
        node.children.push(exitNode.id);
      }
    }

    return controlFlowNodes;
  }

  private async enumerateExecutionPaths(
    controlFlow: ControlFlowNode[],
    symbolGraph: SymbolGraph,
    followBranches: boolean,
  ): Promise<ExecutionPath[]> {
    const paths: ExecutionPath[] = [];

    if (controlFlow.length === 0) return paths;

    // AI-optimized: Generate execution paths with probability estimates
    const entryNodes = controlFlow.filter((node) => node.type === "entry");

    for (const entryNode of entryNodes) {
      const pathNodes: string[] = [];
      const conditions: string[] = [];

      // Simple linear path enumeration (can be enhanced for complex branching)
      this.traversePath(entryNode, controlFlow, pathNodes, conditions);

      if (pathNodes.length > 0) {
        paths.push({
          id: `path_${paths.length + 1}`,
          nodes: pathNodes,
          probability: this.calculatePathProbability(pathNodes, symbolGraph),
          conditions,
        });
      }
    }

    // If no paths found, create a simple single-node path
    if (paths.length === 0 && controlFlow.length > 0) {
      paths.push({
        id: "path_1",
        nodes: [controlFlow[0].id],
        probability: 1.0,
        conditions: [],
      });
    }

    return paths;
  }

  private traversePath(
    currentNode: ControlFlowNode,
    allNodes: ControlFlowNode[],
    pathNodes: string[],
    conditions: string[],
    visited: Set<string> = new Set(),
  ): void {
    if (visited.has(currentNode.id)) return; // Prevent infinite loops

    visited.add(currentNode.id);
    pathNodes.push(currentNode.id);

    // Follow first child (can be enhanced for branch analysis)
    if (currentNode.children.length > 0) {
      const childNode = allNodes.find(
        (node) => node.id === currentNode.children[0],
      );
      if (childNode) {
        this.traversePath(childNode, allNodes, pathNodes, conditions, visited);
      }
    }
  }

  private calculatePathProbability(
    pathNodes: string[],
    symbolGraph: SymbolGraph,
  ): number {
    // AI-insight: Estimate path probability based on edge weights and patterns
    if (pathNodes.length === 0) return 0;
    if (pathNodes.length === 1) return 1.0;

    // Simple heuristic: longer paths are less likely
    const baseProb = Math.max(0.1, 1.0 - (pathNodes.length - 1) * 0.1);

    // Adjust based on function types (error handlers are less likely)
    let adjustment = 1.0;
    for (const nodeId of pathNodes) {
      if (nodeId.includes("error") || nodeId.includes("exception")) {
        adjustment *= 0.3; // Error paths are less likely
      }
      if (nodeId.includes("main") || nodeId.includes("init")) {
        adjustment *= 1.2; // Main paths are more likely
      }
    }

    return Math.min(1.0, baseProb * adjustment);
  }

  // AI-optimized utility methods
  async simulateVariableLifetime(stackFrames: StackFrame[]): Promise<void> {
    // Track when variables are created, accessed, and modified
    for (const frame of stackFrames) {
      frame.localVariables.forEach((variable, index) => {
        variable.lifetime = {
          created: 0,
          lastAccessed: frame.callsTo.length,
          modified: [0], // Assume modified at creation
        };
      });
    }
  }

  detectLoops(controlFlow: ControlFlowNode[]): ControlFlowNode[] {
    // AI-insight: Identify potential infinite loops or recursive patterns
    const loopNodes: ControlFlowNode[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        const node = controlFlow.find((n) => n.id === nodeId);
        if (node) loopNodes.push(node);
        return true;
      }

      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = controlFlow.find((n) => n.id === nodeId);
      if (node) {
        for (const childId of node.children) {
          detectCycle(childId);
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    controlFlow.forEach((node) => {
      if (!visited.has(node.id)) {
        detectCycle(node.id);
      }
    });

    return loopNodes;
  }

  analyzeExceptionPaths(symbolGraph: SymbolGraph): ExecutionPath[] {
    // AI-insight: Identify error handling and exception flows
    const exceptionPaths: ExecutionPath[] = [];

    // Find error-related symbols
    const errorSymbols = Array.from(symbolGraph.symbols.values()).filter(
      (symbol) =>
        symbol.name.toLowerCase().includes("error") ||
        symbol.name.toLowerCase().includes("exception") ||
        symbol.name.toLowerCase().includes("catch"),
    );

    errorSymbols.forEach((symbol, index) => {
      exceptionPaths.push({
        id: `exception_path_${index + 1}`,
        nodes: [symbol.id],
        probability: 0.1, // Exception paths are typically low probability
        conditions: [`${symbol.name} is triggered`],
      });
    });

    return exceptionPaths;
  }

  calculatePathProbabilities(paths: ExecutionPath[]): void {
    // AI-optimization: Normalize probabilities so they sum to reasonable values
    const totalProb = paths.reduce((sum, path) => sum + path.probability, 0);

    if (totalProb > 0) {
      paths.forEach((path) => {
        path.probability = path.probability / totalProb;
      });
    }
  }
}
