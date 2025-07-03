import { CodeClusterer } from '../code-clusterer.js';
import { describe, it, expect } from 'bun:test';

const mockSymbolGraph = {
  symbols: new Map([
    ['foo', { id: 'foo', name: 'foo', type: 'function', location: { file: 'foo.js', startLine: 1 }, metadata: { docstring: 'function foo() {}' }, dependencies: [], dependents: [] }],
    ['bar', { id: 'bar', name: 'bar', type: 'function', location: { file: 'bar.js', startLine: 1 }, metadata: { docstring: 'function bar() {}' }, dependencies: [], dependents: [] }],
  ]),
  edges: [
    { from: 'foo', to: 'bar', type: 'calls' },
  ],
};

describe('CodeClusterer', () => {
  it('should instantiate and cluster a simple graph', async () => {
    const clusterer = new CodeClusterer();
    const result = await clusterer.clusterSymbols(mockSymbolGraph as any);
    expect(result).toBeDefined();
    expect(Array.isArray(result.clusters)).toBe(true);
  });

  it('should handle an empty symbol graph', async () => {
    const clusterer = new CodeClusterer();
    const emptyGraph = { symbols: new Map(), edges: [] };
    const result = await clusterer.clusterSymbols(emptyGraph as any);
    expect(result.clusters.length).toBe(0);
  });
}); 