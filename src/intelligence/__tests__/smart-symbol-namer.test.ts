import { SmartSymbolNamer } from '../smart-symbol-namer.js';
import { describe, it, expect } from 'bun:test';

// Minimal mock for Parser.SyntaxNode
const mockNode = (name: string) => ({
  type: 'function_declaration',
  text: `function ${name}() {}`,
  parent: null,
  childForFieldName: () => null,
} as any);

const mockSymbolNode = (name: string) => ({
  name,
  type: 'function',
  location: { file: `${name}.js`, startLine: 1 },
  metadata: { docstring: `function ${name}() {}` },
  dependencies: [],
  dependents: [],
});

describe('SmartSymbolNamer', () => {
  it('should infer a semantic name for a named function', () => {
    const namer = new SmartSymbolNamer();
    const symbol = mockSymbolNode('processData');
    const node = mockNode('processData');
    const result = namer.enhanceSymbol(symbol as any, node, 'function processData() {}', new Map());
    console.log('DEBUG result:', result);
    expect(result.inferredName).toContain('processData');
    expect(result.confidence.overall).toBeGreaterThan(0.5);
  });

  it('should generate a fallback name for an anonymous function', () => {
    const namer = new SmartSymbolNamer();
    const symbol = mockSymbolNode('anonymous');
    const node = mockNode('anonymous');
    const result = namer.enhanceSymbol(symbol as any, node, 'function() {}', new Map());
    console.log('DEBUG result:', result);
    expect(result.inferredName).toContain('anon_func_');
    expect(result.confidence.overall).toBeLessThan(0.6);
  });
}); 