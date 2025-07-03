import { PatternMiningEngine } from '../pattern-mining-engine.js';
import { describe, it, expect } from 'bun:test';

const mockSymbolGraph = {
  symbols: new Map([
    ['foo', { id: 'foo', name: 'foo', type: 'function', location: { file: 'foo.js', startLine: 1 }, metadata: { docstring: 'function foo() {}' }, dependencies: ['bar'], dependents: [] }],
    ['bar', { id: 'bar', name: 'bar', type: 'function', location: { file: 'bar.js', startLine: 1 }, metadata: { docstring: 'function bar() {}' }, dependencies: [], dependents: ['foo'] }],
  ]),
  edges: [
    { from: 'foo', to: 'bar', type: 'calls' },
  ],
};

describe('PatternMiningEngine', () => {
  it('should instantiate and mine patterns from a simple graph', async () => {
    const engine = new PatternMiningEngine(mockSymbolGraph as any);
    const result = engine.minePatterns();
    expect(result).toBeDefined();
    expect(Array.isArray(result.featureMatrix)).toBe(true);
    expect(Array.isArray(result.clusters)).toBe(true);
    expect(Array.isArray(result.outliers)).toBe(true);
  });

  it('should handle an empty symbol graph', async () => {
    const engine = new PatternMiningEngine({ symbols: new Map(), edges: [] } as any);
    const result = engine.minePatterns();
    expect(result.featureMatrix.length).toBe(0);
    expect(result.clusters.length).toBe(0);
    expect(result.outliers.length).toBe(0);
  });
}); 