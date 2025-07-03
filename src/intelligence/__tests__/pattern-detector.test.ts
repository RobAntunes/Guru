import { PatternDetector } from '../pattern-detector.js';
import { describe, it, expect } from 'bun:test';

const mockSymbolGraph = {
  symbols: new Map([
    ['foo', { id: 'foo', name: 'foo', type: 'function', location: { file: 'foo.js', startLine: 1 }, metadata: { docstring: 'function foo() {}' }, dependencies: [], dependents: [] }],
    ['bar', { id: 'bar', name: 'bar', type: 'function', location: { file: 'bar.js', startLine: 1 }, metadata: { docstring: 'function bar() {}' }, dependencies: [], dependents: [] }],
  ]),
  edges: [],
};

describe('PatternDetector', () => {
  it('should instantiate and detect patterns in a simple graph', async () => {
    const detector = new PatternDetector(mockSymbolGraph as any);
    const result = detector.detectPatterns();
    expect(result).toBeDefined();
    expect(Array.isArray(result.patterns)).toBe(true);
  });

  it('should handle an empty symbol graph', async () => {
    const detector = new PatternDetector({ symbols: new Map(), edges: [] } as any);
    const result = detector.detectPatterns();
    expect(result.patterns.length).toBe(0);
  });
}); 