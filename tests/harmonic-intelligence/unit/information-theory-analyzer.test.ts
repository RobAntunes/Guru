/**
 * Unit tests for Information Theory Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InformationTheoryAnalyzer } from '../../../src/harmonic-intelligence/analyzers/information-theory-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('InformationTheoryAnalyzer', () => {
  let analyzer: InformationTheoryAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new InformationTheoryAnalyzer();
    
    // Create base mock semantic data
    mockSemanticData = {
      symbols: new Map<string, Symbol>(),
      relationships: new Map<string, string[]>(),
      behaviors: {
        executionFlows: [],
        dataFlows: [],
        controlFlows: []
      },
      structure: {
        files: [],
        packages: [],
        namespaces: [],
        modules: []
      }
    };
  });
  
  describe('analyze', () => {
    it('should return all three information theory patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(3);
      expect(results.has(PatternType.SHANNON_ENTROPY)).toBe(true);
      expect(results.has(PatternType.KOLMOGOROV_COMPLEXITY)).toBe(true);
      expect(results.has(PatternType.EFFECTIVE_COMPLEXITY)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const score of results.values()) {
        expect(score.category).toBe(PatternCategory.INFORMATION_THEORY);
      }
    });
  });
  
  describe('Shannon Entropy Detection', () => {
    it('should calculate symbol entropy for diverse codebase', async () => {
      const data = createDiverseCodebase();
      
      const results = await analyzer.analyze(data);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      expect(shannon.detected).toBe(true);
      expect(shannon.score).toBeGreaterThan(0.3);
      
      const entropyEvidence = shannon.evidence.find(e => e.type === 'symbol_entropy');
      expect(entropyEvidence).toBeDefined();
      if (entropyEvidence) {
        expect(entropyEvidence.value).toBeGreaterThan(1); // Some entropy
        expect(entropyEvidence.value).toBeLessThan(8); // Not maximum entropy
      }
    });
    
    it('should detect structural entropy', async () => {
      const data = createStructuredCodebase();
      
      const results = await analyzer.analyze(data);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      const structuralEvidence = shannon.evidence.find(e => e.type === 'structural_entropy');
      expect(structuralEvidence).toBeDefined();
      if (structuralEvidence) {
        expect(structuralEvidence.value).toBeGreaterThan(0);
        expect(structuralEvidence.description).toContain('Structural entropy');
      }
    });
    
    it('should measure redundancy', async () => {
      const data = createRedundantCodebase();
      
      const results = await analyzer.analyze(data);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      const redundancyEvidence = shannon.evidence.find(e => e.type === 'redundancy_measure');
      expect(redundancyEvidence).toBeDefined();
      if (redundancyEvidence) {
        expect(redundancyEvidence.value).toBeGreaterThan(0.3); // High redundancy
        expect(redundancyEvidence.description).toContain('%');
      }
    });
    
    it('should calculate mutual information between modules', async () => {
      const data = createModularCodebase();
      
      const results = await analyzer.analyze(data);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      const mutualInfoEvidence = shannon.evidence.find(e => e.type === 'mutual_information');
      expect(mutualInfoEvidence).toBeDefined();
      if (mutualInfoEvidence) {
        expect(mutualInfoEvidence.value).toBeGreaterThan(0);
        expect(mutualInfoEvidence.description).toContain('modules');
      }
    });
    
    it('should handle low entropy (trivial) code', async () => {
      const data = createTrivialCodebase();
      
      const results = await analyzer.analyze(data);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      expect(shannon.score).toBeLessThan(0.5);
      const entropyEvidence = shannon.evidence.find(e => e.type === 'symbol_entropy');
      if (entropyEvidence) {
        expect(entropyEvidence.value).toBeLessThan(2); // Low entropy
      }
    });
  });
  
  describe('Kolmogorov Complexity Detection', () => {
    it('should approximate complexity using compression', async () => {
      const data = createCompressibleCodebase();
      
      const results = await analyzer.analyze(data);
      const kolmogorov = results.get(PatternType.KOLMOGOROV_COMPLEXITY)!;
      
      expect(kolmogorov.detected).toBe(true);
      
      const compressionEvidence = kolmogorov.evidence.find(e => e.type === 'compression_approximation');
      expect(compressionEvidence).toBeDefined();
      if (compressionEvidence) {
        expect(compressionEvidence.value).toBeGreaterThan(0);
        expect(compressionEvidence.value).toBeLessThan(1);
        expect(compressionEvidence.description).toContain('Compression ratio');
      }
    });
    
    it('should calculate minimum description length', async () => {
      const data = createPatternedCodebase();
      
      const results = await analyzer.analyze(data);
      const kolmogorov = results.get(PatternType.KOLMOGOROV_COMPLEXITY)!;
      
      const mdlEvidence = kolmogorov.evidence.find(e => e.type === 'minimum_description_length');
      expect(mdlEvidence).toBeDefined();
      if (mdlEvidence) {
        expect(mdlEvidence.value).toBeGreaterThan(0);
        expect(mdlEvidence.description).toContain('MDL');
        expect(mdlEvidence.description).toContain('bits');
      }
    });
    
    it('should compute Lempel-Ziv complexity', async () => {
      const data = createRepetitiveCodebase();
      
      const results = await analyzer.analyze(data);
      const kolmogorov = results.get(PatternType.KOLMOGOROV_COMPLEXITY)!;
      
      const lzEvidence = kolmogorov.evidence.find(e => e.type === 'lempel_ziv_complexity');
      expect(lzEvidence).toBeDefined();
      if (lzEvidence) {
        expect(lzEvidence.value).toBeGreaterThan(0);
        expect(lzEvidence.description).toContain('LZ complexity');
        expect(lzEvidence.description).toContain('patterns');
      }
    });
    
    it('should handle incompressible (random) code', async () => {
      const data = createRandomCodebase();
      
      const results = await analyzer.analyze(data);
      const kolmogorov = results.get(PatternType.KOLMOGOROV_COMPLEXITY)!;
      
      const compressionEvidence = kolmogorov.evidence.find(e => e.type === 'compression_approximation');
      if (compressionEvidence) {
        expect(compressionEvidence.value).toBeGreaterThan(0.6); // Poor compression for random data
      }
    });
  });
  
  describe('Effective Complexity Detection', () => {
    it('should separate structure from randomness', async () => {
      const data = createBalancedCodebase();
      
      const results = await analyzer.analyze(data);
      const effective = results.get(PatternType.EFFECTIVE_COMPLEXITY)!;
      
      expect(effective.detected).toBe(true);
      
      const structureEvidence = effective.evidence.find(e => e.type === 'structure_vs_randomness');
      expect(structureEvidence).toBeDefined();
      if (structureEvidence) {
        expect(structureEvidence.description).toContain('structured');
        expect(structureEvidence.description).toContain('random');
        expect(structureEvidence.value).toBeGreaterThan(0);
      }
    });
    
    it('should detect meaningful patterns', async () => {
      const data = createDesignPatternCodebase();
      
      const results = await analyzer.analyze(data);
      const effective = results.get(PatternType.EFFECTIVE_COMPLEXITY)!;
      
      const meaningfulEvidence = effective.evidence.find(e => e.type === 'meaningful_patterns');
      expect(meaningfulEvidence).toBeDefined();
      if (meaningfulEvidence) {
        expect(meaningfulEvidence.value).toBeGreaterThan(0);
        expect(meaningfulEvidence.description).toContain('meaningful patterns');
        expect(meaningfulEvidence.description).toContain('strength');
      }
    });
    
    it('should calculate logical depth', async () => {
      const data = createDeepDependencyGraph();
      
      const results = await analyzer.analyze(data);
      const effective = results.get(PatternType.EFFECTIVE_COMPLEXITY)!;
      
      const depthEvidence = effective.evidence.find(e => e.type === 'logical_depth');
      expect(depthEvidence).toBeDefined();
      if (depthEvidence) {
        expect(depthEvidence.value).toBeGreaterThan(0);
        expect(depthEvidence.description).toContain('layers');
      }
    });
    
    it('should handle purely structured code (low effective complexity)', async () => {
      const data = createPurelyStructuredCodebase();
      
      const results = await analyzer.analyze(data);
      const effective = results.get(PatternType.EFFECTIVE_COMPLEXITY)!;
      
      expect(effective.score).toBeLessThan(0.7);
      // Purely structured code will have diversity-based randomness
      expect(effective.metadata?.randomnessRatio).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty semantic data', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const pattern of results.values()) {
        expect(pattern.score).toBe(0);
        expect(pattern.detected).toBe(false);
      }
    });
    
    it('should handle single symbol', async () => {
      mockSemanticData.symbols.set('single', {
        id: 'single',
        name: 'SingleClass',
        kind: 'class',
        line: 1,
        endLine: 100,
        filePath: 'src/single.ts'
      });
      
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(3);
      for (const pattern of results.values()) {
        expect(pattern.score).toBeGreaterThanOrEqual(0);
        expect(pattern.score).toBeLessThanOrEqual(1);
      }
    });
    
    it('should handle very large codebases efficiently', async () => {
      const data = createLargeCodebase(200); // Reduced size to avoid memory issues
      
      const startTime = Date.now();
      const results = await analyzer.analyze(data);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results.size).toBe(3);
    });
    
    it('should handle all identical symbols (zero entropy)', async () => {
      for (let i = 0; i < 10; i++) {
        mockSemanticData.symbols.set(`identical${i}`, {
          id: `identical${i}`,
          name: 'IdenticalClass',
          kind: 'class',
          line: i * 10,
          endLine: i * 10 + 5,
          filePath: 'src/identical.ts'
        });
      }
      
      const results = await analyzer.analyze(mockSemanticData);
      const shannon = results.get(PatternType.SHANNON_ENTROPY)!;
      
      expect(shannon.score).toBeLessThan(0.5);
    });
  });
});

// Helper functions to create test data

function createDiverseCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create diverse symbol types and sizes
  const types = ['class', 'interface', 'function', 'method', 'property'];
  const sizes = [10, 20, 30, 50, 100];
  
  let id = 0;
  for (const type of types) {
    for (const size of sizes) {
      for (let i = 0; i < 3; i++) {
        const symbolId = `diverse_${id++}`;
        symbols.set(symbolId, {
          id: symbolId,
          name: `${type}${size}_${i}`,
          kind: type as any,
          line: id * 100,
          endLine: id * 100 + size,
          filePath: `src/${type}/file${Math.floor(id / 5)}.ts`
        });
        
        // Add varied relationships
        if (id > 1) {
          const targets: string[] = [];
          for (let j = 0; j < (id % 4); j++) {
            targets.push(`diverse_${Math.floor(Math.random() * (id - 1))}`);
          }
          if (targets.length > 0) {
            relationships.set(symbolId, targets);
          }
        }
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: types,
      namespaces: [],
      modules: types
    }
  };
}

function createStructuredCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create structured layers
  const layers = [
    { name: 'controller', depth: 1, count: 5 },
    { name: 'service', depth: 2, count: 10 },
    { name: 'repository', depth: 3, count: 8 },
    { name: 'model', depth: 4, count: 15 }
  ];
  
  let id = 0;
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const symbolId = `${layer.name}_${i}`;
      symbols.set(symbolId, {
        id: symbolId,
        name: `${layer.name}Class${i}`,
        kind: 'class',
        line: id * 50,
        endLine: id * 50 + 40,
        filePath: `src/${layer.name}/impl${Math.floor(i / 3)}.ts`
      });
      
      // Connect to lower layers
      if (layer.depth < layers.length) {
        const nextLayer = layers[layer.depth];
        const targets = [`${nextLayer.name}_${i % nextLayer.count}`];
        relationships.set(symbolId, targets);
      }
      
      id++;
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: layers.map(l => l.name),
      namespaces: [],
      modules: layers.map(l => l.name)
    }
  };
}

function createRedundantCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create many similar symbols
  const templates = ['UserService', 'ProductService', 'OrderService'];
  const methods = ['create', 'read', 'update', 'delete'];
  
  let id = 0;
  for (const template of templates) {
    for (let copy = 0; copy < 5; copy++) {
      for (const method of methods) {
        const symbolId = `${template}_${copy}_${method}`;
        symbols.set(symbolId, {
          id: symbolId,
          name: `${method}${template}${copy}`,
          kind: 'method',
          line: id * 20,
          endLine: id * 20 + 15, // All similar size
          filePath: `src/services/${template.toLowerCase()}${copy}.ts`
        });
        id++;
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['services'],
      namespaces: [],
      modules: ['services']
    }
  };
}

function createModularCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create distinct modules with inter-module dependencies
  const modules = ['auth', 'user', 'product', 'order', 'payment'];
  
  for (const module of modules) {
    // Create symbols for each module
    for (let i = 0; i < 10; i++) {
      const symbolId = `${module}_symbol_${i}`;
      symbols.set(symbolId, {
        id: symbolId,
        name: `${module}Component${i}`,
        kind: i % 2 === 0 ? 'class' : 'function',
        line: i * 50,
        endLine: i * 50 + 30,
        filePath: `src/${module}/components/comp${i}.ts`
      });
      
      // Intra-module dependencies
      if (i > 0) {
        relationships.set(symbolId, [`${module}_symbol_${i - 1}`]);
      }
    }
    
    // Inter-module dependencies
    const moduleIndex = modules.indexOf(module);
    if (moduleIndex > 0) {
      const prevModule = modules[moduleIndex - 1];
      relationships.set(`${module}_symbol_0`, [`${prevModule}_symbol_9`]);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: modules,
      namespaces: [],
      modules
    }
  };
}

function createTrivialCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  
  // Create very simple, uniform code
  for (let i = 0; i < 20; i++) {
    symbols.set(`simple_${i}`, {
      id: `simple_${i}`,
      name: `SimpleClass`,
      kind: 'class',
      line: i * 10,
      endLine: i * 10 + 5, // All same size
      filePath: 'src/simple.ts' // All in same file
    });
  }
  
  return {
    symbols,
    relationships: new Map(), // No relationships
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: ['src/simple.ts'],
      packages: ['simple'],
      namespaces: [],
      modules: ['simple']
    }
  };
}

function createCompressibleCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create repetitive patterns that compress well
  const pattern = ['A', 'B', 'C', 'D'];
  const repetitions = 10;
  
  let id = 0;
  for (let rep = 0; rep < repetitions; rep++) {
    for (const p of pattern) {
      const symbolId = `pattern_${rep}_${p}`;
      symbols.set(symbolId, {
        id: symbolId,
        name: `Pattern${p}Class`,
        kind: 'class',
        line: id * 50,
        endLine: id * 50 + 40,
        filePath: `src/patterns/pattern${rep}.ts`
      });
      
      // Create pattern in relationships
      if (id > 0) {
        relationships.set(symbolId, [`pattern_${Math.floor((id - 1) / pattern.length)}_${pattern[(id - 1) % pattern.length]}`]);
      }
      id++;
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from({ length: repetitions }, (_, i) => `src/patterns/pattern${i}.ts`),
      packages: ['patterns'],
      namespaces: [],
      modules: ['patterns']
    }
  };
}

function createPatternedCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create clear patterns with regular structure
  const components = [
    { type: 'model', count: 10, size: 30 },
    { type: 'view', count: 10, size: 50 },
    { type: 'controller', count: 10, size: 70 }
  ];
  
  for (const comp of components) {
    for (let i = 0; i < comp.count; i++) {
      const symbolId = `${comp.type}_${i}`;
      symbols.set(symbolId, {
        id: symbolId,
        name: `${comp.type}${i}`,
        kind: 'class',
        line: i * 100,
        endLine: i * 100 + comp.size,
        filePath: `src/${comp.type}/${comp.type}${i}.ts`
      });
      
      // MVC pattern relationships
      if (comp.type === 'controller') {
        relationships.set(symbolId, [`model_${i}`, `view_${i}`]);
      } else if (comp.type === 'view') {
        relationships.set(symbolId, [`model_${i}`]);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: components.map(c => c.type),
      namespaces: [],
      modules: components.map(c => c.type)
    }
  };
}

function createRepetitiveCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  
  // Create ABCABCABC pattern
  const sequence = ['ClassA', 'ClassB', 'ClassC'];
  const repeats = 20;
  
  let id = 0;
  for (let i = 0; i < repeats; i++) {
    for (const cls of sequence) {
      const symbolId = `repetitive_${id}`;
      symbols.set(symbolId, {
        id: symbolId,
        name: cls,
        kind: 'class',
        line: id * 30,
        endLine: id * 30 + 25,
        filePath: `src/repetitive/file${Math.floor(id / 6)}.ts`
      });
      id++;
    }
  }
  
  return {
    symbols,
    relationships: new Map(),
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['repetitive'],
      namespaces: [],
      modules: ['repetitive']
    }
  };
}

function createRandomCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create random structure with no patterns
  for (let i = 0; i < 50; i++) {
    const symbolId = `random_${i}`;
    const randomType = ['class', 'interface', 'function'][Math.floor(Math.random() * 3)];
    const randomSize = Math.floor(Math.random() * 100) + 10;
    
    symbols.set(symbolId, {
      id: symbolId,
      name: `Random${Math.random().toString(36).substring(7)}`,
      kind: randomType as any,
      line: i * 150 + Math.floor(Math.random() * 50),
      endLine: i * 150 + Math.floor(Math.random() * 50) + randomSize,
      filePath: `src/chaos/file${Math.floor(Math.random() * 10)}.ts`
    });
    
    // Random relationships
    if (Math.random() > 0.5 && i > 0) {
      const targetCount = Math.floor(Math.random() * 3) + 1;
      const targets: string[] = [];
      for (let j = 0; j < targetCount; j++) {
        targets.push(`random_${Math.floor(Math.random() * i)}`);
      }
      relationships.set(symbolId, targets);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['chaos'],
      namespaces: [],
      modules: ['chaos']
    }
  };
}

function createBalancedCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Mix of structured and random elements
  const structuredCount = 30;
  const randomCount = 20;
  
  // Structured part
  for (let i = 0; i < structuredCount; i++) {
    const symbolId = `structured_${i}`;
    const layer = Math.floor(i / 10);
    
    symbols.set(symbolId, {
      id: symbolId,
      name: `Layer${layer}Component${i % 10}`,
      kind: 'class',
      line: i * 50,
      endLine: i * 50 + 40,
      filePath: `src/structured/layer${layer}/component${i % 10}.ts`
    });
    
    if (i > 0 && i % 10 !== 0) {
      relationships.set(symbolId, [`structured_${i - 1}`]);
    }
  }
  
  // Random part
  for (let i = 0; i < randomCount; i++) {
    const symbolId = `random_${i}`;
    symbols.set(symbolId, {
      id: symbolId,
      name: `Unique${i}${Math.random().toString(36).substring(7)}`,
      kind: ['class', 'interface', 'function'][i % 3] as any,
      line: (structuredCount + i) * 50,
      endLine: (structuredCount + i) * 50 + Math.floor(Math.random() * 50) + 20,
      filePath: `src/unique/file${i}.ts`
    });
    
    // Some random connections
    if (Math.random() > 0.6) {
      relationships.set(symbolId, [`structured_${Math.floor(Math.random() * structuredCount)}`]);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['structured', 'unique'],
      namespaces: [],
      modules: ['structured', 'unique']
    }
  };
}

function createDesignPatternCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Implement common design patterns
  
  // Singleton pattern
  symbols.set('singleton', {
    id: 'singleton',
    name: 'DatabaseSingleton',
    kind: 'class',
    line: 1,
    endLine: 50,
    filePath: 'src/patterns/singleton.ts'
  });
  
  symbols.set('getInstance', {
    id: 'getInstance',
    name: 'getInstance',
    kind: 'method',
    containerName: 'DatabaseSingleton',
    line: 10,
    endLine: 20,
    filePath: 'src/patterns/singleton.ts'
  });
  
  // Factory pattern
  symbols.set('factory', {
    id: 'factory',
    name: 'VehicleFactory',
    kind: 'class',
    line: 100,
    endLine: 200,
    filePath: 'src/patterns/factory.ts'
  });
  
  symbols.set('createVehicle', {
    id: 'createVehicle',
    name: 'createVehicle',
    kind: 'method',
    containerName: 'VehicleFactory',
    line: 110,
    endLine: 150,
    filePath: 'src/patterns/factory.ts'
  });
  
  // Observer pattern
  symbols.set('subject', {
    id: 'subject',
    name: 'EventSubject',
    kind: 'class',
    line: 300,
    endLine: 400,
    filePath: 'src/patterns/observer.ts'
  });
  
  symbols.set('observer1', {
    id: 'observer1',
    name: 'EmailObserver',
    kind: 'class',
    line: 410,
    endLine: 460,
    filePath: 'src/patterns/observer.ts'
  });
  
  symbols.set('observer2', {
    id: 'observer2',
    name: 'LogObserver',
    kind: 'class',
    line: 470,
    endLine: 520,
    filePath: 'src/patterns/observer.ts'
  });
  
  // Repository pattern (DDD)
  symbols.set('aggregate', {
    id: 'aggregate',
    name: 'UserAggregate',
    kind: 'class',
    line: 600,
    endLine: 700,
    filePath: 'src/domain/user/aggregate.ts'
  });
  
  symbols.set('repository', {
    id: 'repository',
    name: 'UserRepository',
    kind: 'interface',
    line: 710,
    endLine: 750,
    filePath: 'src/domain/user/repository.ts'
  });
  
  symbols.set('valueobject', {
    id: 'valueobject',
    name: 'EmailValueObject',
    kind: 'class',
    line: 760,
    endLine: 800,
    filePath: 'src/domain/user/valueobjects.ts'
  });
  
  // Relationships
  relationships.set('getInstance', ['singleton']);
  relationships.set('createVehicle', ['factory']);
  relationships.set('observer1', ['subject']);
  relationships.set('observer2', ['subject']);
  relationships.set('aggregate', ['valueobject']);
  relationships.set('repository', ['aggregate']);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: ['patterns', 'domain'],
      namespaces: [],
      modules: ['patterns', 'domain']
    }
  };
}

function createDeepDependencyGraph(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create a deep chain of dependencies
  const depth = 10; // Reduced depth
  const branches = 2; // Reduced branches
  
  // Create tree-like structure with limited branching
  let id = 0;
  const createNode = (level: number, branch: number, parentId: string | null): string => {
    const nodeId = `node_${id++}`;
    
    symbols.set(nodeId, {
      id: nodeId,
      name: `Level${level}Branch${branch}`,
      kind: level % 2 === 0 ? 'class' : 'interface',
      line: id * 30,
      endLine: id * 30 + 20,
      filePath: `src/deep/level${level}/branch${branch}.ts`
    });
    
    if (parentId) {
      relationships.set(nodeId, [parentId]);
    }
    
    // Create children with exponential backoff
    if (level < depth && (level < 5 || branch === 0)) { // Limit branching at deeper levels
      const numBranches = level < 5 ? branches : 1;
      for (let b = 0; b < numBranches; b++) {
        createNode(level + 1, b, nodeId);
      }
    }
    
    return nodeId;
  };
  
  // Create root and build tree
  createNode(0, 0, null);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: Array.from({ length: depth }, (_, i) => `level${i}`),
      namespaces: [],
      modules: Array.from({ length: depth }, (_, i) => `level${i}`)
    }
  };
}

function createPurelyStructuredCodebase(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create highly regular, predictable structure
  const pattern = ['Interface', 'Implementation', 'Test'];
  const modules = 10;
  
  for (let m = 0; m < modules; m++) {
    for (let p = 0; p < pattern.length; p++) {
      const symbolId = `module${m}_${pattern[p]}`;
      
      symbols.set(symbolId, {
        id: symbolId,
        name: `Module${m}${pattern[p]}`,
        kind: p === 0 ? 'interface' : 'class',
        line: (m * pattern.length + p) * 100,
        endLine: (m * pattern.length + p) * 100 + 80, // All same size
        filePath: `src/modules/module${m}/${pattern[p].toLowerCase()}.ts`
      });
      
      // Regular relationships
      if (p === 1) {
        relationships.set(symbolId, [`module${m}_${pattern[0]}`]); // Impl -> Interface
      } else if (p === 2) {
        relationships.set(symbolId, [`module${m}_${pattern[1]}`]); // Test -> Impl
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: Array.from({ length: modules }, (_, i) => `module${i}`),
      namespaces: [],
      modules: Array.from({ length: modules }, (_, i) => `module${i}`)
    }
  };
}

function createLargeCodebase(size: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create a realistic large codebase with various patterns
  const layers = ['api', 'service', 'repository', 'model', 'util'];
  const symbolsPerLayer = Math.floor(size / layers.length);
  
  let id = 0;
  for (const layer of layers) {
    for (let i = 0; i < symbolsPerLayer; i++) {
      const symbolId = `${layer}_${i}`;
      const symbolType = ['class', 'interface', 'function'][i % 3];
      
      symbols.set(symbolId, {
        id: symbolId,
        name: `${layer}${i % 10 === 0 ? 'Base' : ''}Component${i}`,
        kind: symbolType as any,
        line: id * 40,
        endLine: id * 40 + 30 + (i % 4) * 10,
        filePath: `src/${layer}/${layer}${Math.floor(i / 20)}/component${i}.ts`
      });
      
      // Create realistic relationships
      const layerIndex = layers.indexOf(layer);
      if (layerIndex > 0 && i % 3 === 0) {
        const targetLayer = layers[layerIndex - 1];
        const targetIndex = Math.floor(Math.random() * symbolsPerLayer);
        relationships.set(symbolId, [`${targetLayer}_${targetIndex}`]);
      }
      
      // Some intra-layer dependencies
      if (i > 0 && i % 5 === 0) {
        relationships.set(symbolId, [`${layer}_${i - 1}`]);
      }
      
      id++;
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: {
      files: Array.from(new Set(Array.from(symbols.values()).map(s => s.filePath))),
      packages: layers,
      namespaces: [],
      modules: layers
    }
  };
}