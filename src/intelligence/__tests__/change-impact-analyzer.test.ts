import { ChangeImpactAnalyzer } from '../change-impact-analyzer.js';
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

const allSymbolsMap = mockSymbolGraph.symbols;

describe('ChangeImpactAnalyzer', () => {
  it('should instantiate and analyze impact for a changed symbol', () => {
    const analyzer = new ChangeImpactAnalyzer();
    const symbol = allSymbolsMap.get('foo');
    const result = analyzer.analyzeSymbolChange(symbol, 'implementation', allSymbolsMap);
    expect(result).toBeDefined();
    expect(Array.isArray(result.directImpacts)).toBe(true);
    expect(Array.isArray(result.indirectImpacts)).toBe(true);
    // bar should be impacted (directly or indirectly)
    const impactedIds = [
      ...result.directImpacts.map(i => i.symbol.id),
      ...result.indirectImpacts.map(i => i.symbol.id)
    ];
    expect(impactedIds).toContain('bar');
  });

  it('should handle an empty symbol graph', () => {
    const analyzer = new ChangeImpactAnalyzer();
    const emptyMap = new Map();
    const symbol = { id: 'foo', name: 'foo', type: 'function', location: { file: 'foo.js', startLine: 1 }, metadata: {}, dependencies: [], dependents: [] };
    const result = analyzer.analyzeSymbolChange(symbol, 'implementation', emptyMap);
    expect(result.directImpacts.length).toBe(0);
    expect(result.indirectImpacts.length).toBe(0);
  });
}); 