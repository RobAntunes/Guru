import { SymbolGraph, SymbolNode } from '../types/index.js';
import { PerformanceAnalysisResult, PerformanceIssue } from '../types/performance.js';

function countLOC(docstring: string | undefined): number {
  if (!docstring) return 0;
  return docstring.split('\n').length;
}

function estimateCyclomaticComplexity(docstring: string | undefined): number {
  if (!docstring) return 1;
  // Count branching keywords as a proxy
  const matches = docstring.match(/\b(if|for|while|case|catch|elif|else if)\b/g);
  return 1 + (matches ? matches.length : 0);
}

export class PerformanceAnalyzer {
  private symbolGraph: SymbolGraph;
  private issues: PerformanceIssue[] = [];
  private metrics: Record<string, any> = {};
  private detectorsRun: string[] = [];

  constructor(symbolGraph: SymbolGraph) {
    this.symbolGraph = symbolGraph;
  }

  analyze(): PerformanceAnalysisResult {
    this.issues = [];
    this.metrics = {};
    this.detectorsRun = [];
    this.runQuadraticComplexityDetector();
    this.runMemoryLeakDetector();
    this.runInefficientDbIoDetector();
    this.runRecomputationDetector();
    this.runOwnershipLifetimeDetector();
    this.collectCodeMetrics();
    return {
      issues: this.issues,
      metrics: this.metrics,
      detectorsRun: this.detectorsRun
    };
  }

  // --- Realistic Detectors ---

  private runQuadraticComplexityDetector() {
    this.detectorsRun.push('quadratic_complexity');
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Heuristic: two or more nested for/while loops in docstring
      const nestedLoops = (doc.match(/for|while/g) || []).length;
      if (nestedLoops >= 2) {
        this.issues.push({
          symbolId: id,
          type: 'quadratic_complexity',
          severity: 'warning',
          evidence: ['Multiple nested loops detected in function body.'],
          location: node.location,
          meta: { nestedLoops }
        });
      }
    }
  }

  private runMemoryLeakDetector() {
    this.detectorsRun.push('memory_leak');
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Heuristic: closure (function inside function) + reference to outer variable
      if (/function\s*\(/.test(doc) && /\bthis\b|\bself\b|\bwindow\b|\bglobal\b/.test(doc)) {
        this.issues.push({
          symbolId: id,
          type: 'memory_leak',
          severity: 'warning',
          evidence: ['Closure may capture outer-scope variable, possible stale closure.'],
          location: node.location,
          meta: {}
        });
      }
      // Heuristic: event handler assignment
      if (/addEventListener|on\w+\s*=\s*function/.test(doc)) {
        this.issues.push({
          symbolId: id,
          type: 'memory_leak',
          severity: 'info',
          evidence: ['Event handler assignment detected, check for proper removal.'],
          location: node.location,
          meta: {}
        });
      }
    }
  }

  private runInefficientDbIoDetector() {
    this.detectorsRun.push('inefficient_db_io');
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Heuristic: db/io keywords inside loop
      if ((/for|while/.test(doc)) && /(query|fetch|db|database|read|write|insert|update|delete|axios|fetch|request)/i.test(doc)) {
        this.issues.push({
          symbolId: id,
          type: 'inefficient_db_io',
          severity: 'warning',
          evidence: ['Possible DB/IO call inside loop.'],
          location: node.location,
          meta: {}
        });
      }
    }
  }

  private runRecomputationDetector() {
    this.detectorsRun.push('recomputation');
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Heuristic: repeated assignment to same variable
      const assignments = (doc.match(/\w+\s*=\s*.+/g) || []);
      const assignmentCounts: Record<string, number> = {};
      for (const line of assignments) {
        const varName = line.split('=')[0].trim();
        assignmentCounts[varName] = (assignmentCounts[varName] || 0) + 1;
      }
      for (const [varName, count] of Object.entries(assignmentCounts)) {
        if (count > 2) {
          this.issues.push({
            symbolId: id,
            type: 'recomputation',
            severity: 'info',
            evidence: [`Variable '${varName}' assigned ${count} times, possible unnecessary recomputation.`],
            location: node.location,
            meta: { varName, count }
          });
        }
      }
    }
  }

  private runOwnershipLifetimeDetector() {
    this.detectorsRun.push('ownership_lifetime');
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Heuristic: function returns a closure or object referencing outer scope
      if (/return\s+function|return\s+\(/.test(doc) && /\bthis\b|\bself\b|\bwindow\b|\bglobal\b/.test(doc)) {
        this.issues.push({
          symbolId: id,
          type: 'ownership_violation',
          severity: 'warning',
          evidence: ['Returned closure/object may reference outer scope, possible ownership/lifetime issue.'],
          location: node.location,
          meta: {}
        });
      }
    }
  }

  // --- Metrics ---

  private collectCodeMetrics() {
    let totalLOC = 0;
    let totalComplexity = 0;
    let functionCount = 0;
    for (const [id, node] of this.symbolGraph.symbols) {
      if (node.type === 'function') {
        const doc = node.metadata.docstring || '';
        const loc = countLOC(doc);
        const complexity = estimateCyclomaticComplexity(doc);
        totalLOC += loc;
        totalComplexity += complexity;
        functionCount++;
        // Optionally, store per-function metrics
        this.metrics[id] = { loc, complexity };
      }
    }
    this.metrics['totalLOC'] = totalLOC;
    this.metrics['avgCyclomaticComplexity'] = functionCount ? totalComplexity / functionCount : 0;
    this.metrics['functionCount'] = functionCount;
    // Call graph stats
    this.metrics['callGraphEdges'] = this.symbolGraph.edges.length;
    this.metrics['symbolCount'] = this.symbolGraph.symbols.size;
  }
} 