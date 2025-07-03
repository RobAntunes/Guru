import { EntryPointDetector } from '../entry-point-detector.js';
import { describe, it, expect } from 'bun:test';

const mockSymbol = (name: string, type: string = 'function') => ({
  name,
  type,
  location: { file: `${name}.js`, startLine: 1 },
  smartNaming: { inferredName: name },
});

describe('EntryPointDetector', () => {
  it('should instantiate and detect entry points in a simple graph', async () => {
    const detector = new EntryPointDetector();
    const graph = {
      symbols: new Map([
        ['main', mockSymbol('main')],
        ['helper', mockSymbol('helper')],
      ]),
      edges: [
        { from: 'main', to: 'helper', type: 'calls' },
      ],
      metadata: { analyzedFiles: ['main.js', 'helper.js'] },
    };
    const result = await detector.detectEntryPoints(graph as any, process.cwd());
    console.log('DEBUG entry point types:', result.entryPoints.map(ep => ep.type));
    expect(result.entryPoints.length).toBeGreaterThan(0);
    expect(result.entryPoints.some(ep => ep.type === 'main')).toBe(true);
  });

  it('should handle empty symbol graph', async () => {
    const detector = new EntryPointDetector();
    const graph = { symbols: new Map(), edges: [], metadata: { analyzedFiles: [] } };
    const result = await detector.detectEntryPoints(graph as any, process.cwd());
    expect(result.entryPoints.length).toBe(0);
  });
}); 