import { MemoryIntelligenceEngine } from '../memory-intelligence-engine.js';
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

describe('MemoryIntelligenceEngine', () => {
  it('should instantiate and analyze memory for a simple graph', async () => {
    const engine = new MemoryIntelligenceEngine();
    const result = await engine.analyzeMemoryBehavior(mockSymbolGraph as any);
    expect(result).toBeDefined();
    expect(typeof result.overallMemoryHealth).toBe('number');
    expect(result.fundamentalAnalysis).toBeDefined();
    expect(Array.isArray(result.fundamentalAnalysis.memoryHealth.criticalIssues)).toBe(true);
  });

  it('should handle an empty symbol graph', async () => {
    const engine = new MemoryIntelligenceEngine();
    const emptyGraph = { symbols: new Map(), edges: [] };
    const result = await engine.analyzeMemoryBehavior(emptyGraph as any);
    expect(result.fundamentalAnalysis.memoryHealth.criticalIssues.length).toBe(0);
  });
}); 