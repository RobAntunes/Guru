import { PerformanceAnalyzer } from '../performance-analyzer.js';
import { describe, it, expect } from 'bun:test';

// Mock symbol graph for unit test
const mockSymbolGraph = {
  symbols: new Map([
    ['foo', { id: 'foo', name: 'foo', type: 'function', location: { file: 'foo.js', startLine: 1 }, metadata: { docstring: 'function foo() {}' }, dependencies: [], dependents: [] }],
    ['bar', { id: 'bar', name: 'bar', type: 'function', location: { file: 'bar.js', startLine: 1 }, metadata: { docstring: 'function bar() {}' }, dependencies: [], dependents: [] }],
  ]),
  edges: [],
};

describe('PerformanceAnalyzer', () => {
  it('should instantiate and collect metrics', () => {
    const analyzer = new PerformanceAnalyzer(mockSymbolGraph as any);
    analyzer.analyze();
    expect(analyzer.metrics).toBeDefined();
    expect(Array.isArray(analyzer.issues)).toBe(true);
  });

  it('should handle an empty symbol graph', () => {
    const analyzer = new PerformanceAnalyzer({ symbols: new Map(), edges: [] } as any);
    analyzer.analyze();
    expect(analyzer.metrics).toBeDefined();
    expect(analyzer.issues.length).toBe(0);
  });

  it('should handle a symbol with no docstring', () => {
    const graph = {
      symbols: new Map([
        ['baz', { id: 'baz', name: 'baz', type: 'function', location: { file: 'baz.js', startLine: 1 }, metadata: {}, dependencies: [], dependents: [] }],
      ]),
      edges: [],
    };
    const analyzer = new PerformanceAnalyzer(graph as any);
    analyzer.analyze();
    expect(analyzer.metrics).toBeDefined();
    expect(Array.isArray(analyzer.issues)).toBe(true);
  });
}); 