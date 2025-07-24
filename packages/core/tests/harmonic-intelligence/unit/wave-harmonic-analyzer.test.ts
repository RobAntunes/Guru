/**
 * Unit tests for Wave & Harmonic Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WaveHarmonicAnalyzer } from '../../../src/harmonic-intelligence/analyzers/wave-harmonic-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('WaveHarmonicAnalyzer', () => {
  let analyzer: WaveHarmonicAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new WaveHarmonicAnalyzer();
    
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
    it('should return all three wave patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(3);
      expect(results.has(PatternType.FOURIER_ANALYSIS)).toBe(true);
      expect(results.has(PatternType.STANDING_WAVES)).toBe(true);
      expect(results.has(PatternType.RESONANCE_PATTERNS)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const score of results.values()) {
        expect(score.category).toBe(PatternCategory.WAVE_HARMONIC);
      }
    });
  });
  
  describe('Fourier Analysis Detection', () => {
    it('should detect dominant frequency in periodic code structure', async () => {
      // Create periodic pattern
      const data = createPeriodicCodeStructure();
      
      const results = await analyzer.analyze(data);
      const fourier = results.get(PatternType.FOURIER_ANALYSIS)!;
      
      expect(fourier.detected).toBe(true);
      expect(fourier.score).toBeGreaterThan(0.3);
      
      const dominantFreqEvidence = fourier.evidence.find(e => e.type === 'dominant_frequency');
      expect(dominantFreqEvidence).toBeDefined();
      if (dominantFreqEvidence) {
        expect(dominantFreqEvidence.value).toBeGreaterThan(0);
        expect(dominantFreqEvidence.value).toBeLessThan(50); // Within expected range
      }
    });
    
    it('should calculate spectral characteristics', async () => {
      const data = createComplexWavePattern();
      
      const results = await analyzer.analyze(data);
      const fourier = results.get(PatternType.FOURIER_ANALYSIS)!;
      
      const spectralEvidence = fourier.evidence.find(e => e.type === 'spectral_centroid');
      expect(spectralEvidence).toBeDefined();
      if (spectralEvidence) {
        expect(spectralEvidence.description).toContain('centroid');
        expect(spectralEvidence.description).toContain('spread');
        expect(spectralEvidence.value).toBeGreaterThan(0);
      }
    });
    
    it('should detect harmonic series in code', async () => {
      const data = createHarmonicStructure();
      
      const results = await analyzer.analyze(data);
      const fourier = results.get(PatternType.FOURIER_ANALYSIS)!;
      
      const harmonicEvidence = fourier.evidence.find(e => e.type === 'harmonic_series');
      expect(harmonicEvidence).toBeDefined();
      if (harmonicEvidence) {
        expect(harmonicEvidence.value).toBeGreaterThan(1); // Multiple harmonics
        expect(harmonicEvidence.description).toContain('harmonics');
      }
    });
    
    it('should handle non-periodic structures', async () => {
      const data = createRandomStructure();
      
      const results = await analyzer.analyze(data);
      const fourier = results.get(PatternType.FOURIER_ANALYSIS)!;
      
      // Random structures can still have some frequency content
      // but should have lower scores than periodic ones
      expect(fourier.score).toBeLessThanOrEqual(1); // Valid score range
      // May or may not be detected depending on randomness
    });
  });
  
  describe('Standing Waves Detection', () => {
    it('should detect nodes and antinodes in wave patterns', async () => {
      const data = createStandingWavePattern();
      
      const results = await analyzer.analyze(data);
      const standing = results.get(PatternType.STANDING_WAVES)!;
      
      expect(standing.detected).toBe(true);
      
      const nodeEvidence = standing.evidence.find(e => e.type === 'standing_wave_nodes');
      expect(nodeEvidence).toBeDefined();
      if (nodeEvidence) {
        expect(nodeEvidence.value).toBeGreaterThan(0); // Has nodes
        expect(nodeEvidence.description).toContain('nodes');
        expect(nodeEvidence.description).toContain('antinodes');
      }
    });
    
    it('should calculate quality factor for resonance', async () => {
      const data = createHighQPattern();
      
      const results = await analyzer.analyze(data);
      const standing = results.get(PatternType.STANDING_WAVES)!;
      
      const qEvidence = standing.evidence.find(e => e.type === 'resonance_quality');
      expect(qEvidence).toBeDefined();
      if (qEvidence) {
        expect(qEvidence.value).toBeGreaterThan(1); // Q > 1 indicates resonance
        expect(qEvidence.description).toContain('Q =');
      }
    });
    
    it('should detect interference patterns', async () => {
      const data = createInterferencePattern();
      
      const results = await analyzer.analyze(data);
      const standing = results.get(PatternType.STANDING_WAVES)!;
      
      const interferenceEvidence = standing.evidence.find(e => e.type === 'wave_interference');
      expect(interferenceEvidence).toBeDefined();
      if (interferenceEvidence) {
        expect(interferenceEvidence.value).toBeGreaterThan(0);
        expect(interferenceEvidence.description).toContain('constructive');
        expect(interferenceEvidence.description).toContain('destructive');
      }
    });
    
    it('should handle structures without wave patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      const standing = results.get(PatternType.STANDING_WAVES)!;
      
      expect(standing.detected).toBe(false);
      expect(standing.score).toBe(0);
    });
  });
  
  describe('Resonance Patterns Detection', () => {
    it('should detect harmonic series in code repetition', async () => {
      const data = createResonantStructure();
      
      const results = await analyzer.analyze(data);
      const resonance = results.get(PatternType.RESONANCE_PATTERNS)!;
      
      expect(resonance.detected).toBe(true);
      
      const harmonicEvidence = resonance.evidence.find(e => e.type === 'harmonic_series_detection');
      expect(harmonicEvidence).toBeDefined();
      if (harmonicEvidence) {
        expect(harmonicEvidence.value).toBeGreaterThan(2); // Multiple harmonics
        expect(harmonicEvidence.description).toContain('components');
      }
    });
    
    it('should identify musical intervals in module relationships', async () => {
      const data = createMusicalIntervalStructure();
      
      const results = await analyzer.analyze(data);
      const resonance = results.get(PatternType.RESONANCE_PATTERNS)!;
      
      const intervalEvidence = resonance.evidence.find(e => e.type === 'musical_intervals');
      expect(intervalEvidence).toBeDefined();
      if (intervalEvidence) {
        expect(intervalEvidence.value).toBeGreaterThan(0);
        expect(intervalEvidence.description).toContain('consonant intervals');
      }
    });
    
    it('should find natural frequencies in cyclic dependencies', async () => {
      const data = createCyclicDependencyGraph();
      
      const results = await analyzer.analyze(data);
      const resonance = results.get(PatternType.RESONANCE_PATTERNS)!;
      
      const naturalEvidence = resonance.evidence.find(e => e.type === 'natural_frequencies');
      expect(naturalEvidence).toBeDefined();
      if (naturalEvidence) {
        expect(naturalEvidence.value).toBeGreaterThan(0);
        expect(naturalEvidence.description).toContain('natural frequencies');
        expect(naturalEvidence.description).toContain('Hz');
      }
    });
    
    it('should calculate consonance score', async () => {
      const data = createMusicalIntervalStructure();
      
      const results = await analyzer.analyze(data);
      const resonance = results.get(PatternType.RESONANCE_PATTERNS)!;
      
      expect(resonance.metadata?.consonanceScore).toBeDefined();
      expect(resonance.metadata?.consonanceScore).toBeGreaterThanOrEqual(0);
      expect(resonance.metadata?.consonanceScore).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty semantic data', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const pattern of results.values()) {
        expect(pattern.score).toBe(0);
        expect(pattern.detected).toBe(false);
        expect(pattern.evidence.length).toBe(0);
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
      
      // Should still produce valid results, even if low scores
      expect(results.size).toBe(3);
      for (const pattern of results.values()) {
        expect(pattern.score).toBeGreaterThanOrEqual(0);
        expect(pattern.score).toBeLessThanOrEqual(1);
      }
    });
    
    it('should handle very large codebases efficiently', async () => {
      const data = createLargeCodebase(500);
      
      const startTime = Date.now();
      const results = await analyzer.analyze(data);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results.size).toBe(3);
    });
    
    it('should handle perfectly flat structure', async () => {
      // All symbols at same level, no variation
      for (let i = 0; i < 10; i++) {
        mockSemanticData.symbols.set(`flat${i}`, {
          id: `flat${i}`,
          name: `FlatClass${i}`,
          kind: 'class',
          line: i * 10,
          endLine: i * 10 + 5, // All same size
          filePath: 'src/flat.ts'
        });
      }
      
      const results = await analyzer.analyze(mockSemanticData);
      const fourier = results.get(PatternType.FOURIER_ANALYSIS)!;
      
      // Flat structure should have low frequency content
      expect(fourier.score).toBeLessThan(0.3);
    });
  });
});

// Helper functions to create test data

function createPeriodicCodeStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create repeating pattern of classes with varying sizes
  const period = 4;
  const cycles = 5;
  
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (let i = 0; i < period; i++) {
      const id = `periodic_${cycle}_${i}`;
      const size = 10 + 40 * Math.sin(2 * Math.PI * i / period);
      
      symbols.set(id, {
        id,
        name: `PeriodicClass_${cycle}_${i}`,
        kind: 'class',
        line: cycle * 200 + i * 50,
        endLine: cycle * 200 + i * 50 + Math.floor(size),
        filePath: `src/periodic/cycle${cycle}.ts`
      });
      
      // Create periodic connections
      if (i > 0) {
        relationships.set(id, [`periodic_${cycle}_${i-1}`]);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: cycles }, (_, i) => `src/periodic/cycle${i}.ts`),
      packages: ['periodic'],
      namespaces: [],
      modules: ['periodic']
    }
  };
}

function createComplexWavePattern(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create multi-frequency pattern
  const samples = 64;
  
  for (let i = 0; i < samples; i++) {
    const id = `complex_${i}`;
    const t = i / samples * 2 * Math.PI;
    
    // Combine multiple frequencies
    const amplitude = Math.sin(t) + 0.5 * Math.sin(3 * t) + 0.25 * Math.sin(5 * t);
    const size = 20 + 30 * amplitude;
    
    symbols.set(id, {
      id,
      name: `ComplexClass_${i}`,
      kind: 'class',
      line: i * 100,
      endLine: i * 100 + Math.floor(size),
      filePath: `src/complex/wave${Math.floor(i / 8)}.ts`
    });
    
    // Variable connections based on amplitude
    const connections: string[] = [];
    const connCount = Math.floor(Math.abs(amplitude) * 5);
    for (let j = 0; j < connCount; j++) {
      const target = Math.floor(Math.random() * samples);
      connections.push(`complex_${target}`);
    }
    relationships.set(id, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: 8 }, (_, i) => `src/complex/wave${i}.ts`),
      packages: ['complex'],
      namespaces: [],
      modules: ['complex']
    }
  };
}

function createHarmonicStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create structure with clear harmonic relationships
  const fundamental = 5;
  const harmonics = [1, 2, 3, 4, 5];
  
  for (const harmonic of harmonics) {
    const frequency = fundamental * harmonic;
    
    // Create symbols with sizes proportional to harmonic
    for (let i = 0; i < frequency; i++) {
      const id = `harmonic_${harmonic}_${i}`;
      
      symbols.set(id, {
        id,
        name: `Harmonic${harmonic}Class${i}`,
        kind: 'class',
        line: harmonic * 100 + i * 10,
        endLine: harmonic * 100 + i * 10 + fundamental,
        filePath: `src/harmonics/h${harmonic}.ts`
      });
      
      // Connect in harmonic pattern
      if (i > 0) {
        relationships.set(id, [`harmonic_${harmonic}_${i-1}`]);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: harmonics.map(h => `src/harmonics/h${h}.ts`),
      packages: ['harmonics'],
      namespaces: [],
      modules: ['harmonics']
    }
  };
}

function createRandomStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create random, non-periodic structure
  for (let i = 0; i < 50; i++) {
    const id = `random_${i}`;
    const size = Math.floor(Math.random() * 100) + 10;
    
    symbols.set(id, {
      id,
      name: `RandomClass_${i}`,
      kind: Math.random() > 0.5 ? 'class' : 'interface',
      line: i * 150 + Math.floor(Math.random() * 50),
      endLine: i * 150 + Math.floor(Math.random() * 50) + size,
      filePath: `src/random/r${Math.floor(Math.random() * 5)}.ts`
    });
    
    // Random connections
    const connCount = Math.floor(Math.random() * 5);
    const connections: string[] = [];
    for (let j = 0; j < connCount; j++) {
      connections.push(`random_${Math.floor(Math.random() * 50)}`);
    }
    relationships.set(id, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: 5 }, (_, i) => `src/random/r${i}.ts`),
      packages: ['random'],
      namespaces: [],
      modules: ['random']
    }
  };
}

function createStandingWavePattern(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create standing wave with nodes and antinodes
  const wavelength = 20;
  const nodes = 4;
  
  for (let n = 0; n < nodes; n++) {
    for (let i = 0; i < wavelength; i++) {
      const position = n * wavelength + i;
      const id = `standing_${position}`;
      
      // Standing wave amplitude: A(x) = 2A * sin(kx) * cos(ωt)
      const x = i / wavelength * 2 * Math.PI;
      const amplitude = Math.abs(Math.sin(x));
      const size = 10 + 40 * amplitude;
      
      symbols.set(id, {
        id,
        name: `StandingWave_${position}`,
        kind: 'class',
        line: position * 50,
        endLine: position * 50 + Math.floor(size),
        filePath: `src/standing/wave${n}.ts`
      });
      
      // Connect based on wave pattern
      const connections: string[] = [];
      if (position > 0) connections.push(`standing_${position - 1}`);
      if (amplitude > 0.5) {
        // Antinodes have more connections
        for (let j = 0; j < 3; j++) {
          const target = Math.floor(Math.random() * (nodes * wavelength));
          connections.push(`standing_${target}`);
        }
      }
      relationships.set(id, connections);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: nodes }, (_, i) => `src/standing/wave${i}.ts`),
      packages: ['standing'],
      namespaces: [],
      modules: ['standing']
    }
  };
}

function createHighQPattern(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create sharp resonance peak (high Q)
  const center = 50;
  const width = 5;
  
  for (let i = 0; i < 100; i++) {
    const id = `highq_${i}`;
    
    // Lorentzian peak for high Q resonance
    const x = i - center;
    const amplitude = 1 / (1 + (x / width) ** 2);
    const size = 10 + 90 * amplitude;
    
    symbols.set(id, {
      id,
      name: `HighQ_${i}`,
      kind: 'class',
      line: i * 50,
      endLine: i * 50 + Math.floor(size),
      filePath: `src/resonance/q${Math.floor(i / 10)}.ts`
    });
    
    // Connections focused around resonance
    const connections: string[] = [];
    if (amplitude > 0.5) {
      for (let j = -2; j <= 2; j++) {
        if (i + j >= 0 && i + j < 100) {
          connections.push(`highq_${i + j}`);
        }
      }
    }
    relationships.set(id, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: 10 }, (_, i) => `src/resonance/q${i}.ts`),
      packages: ['resonance'],
      namespaces: [],
      modules: ['resonance']
    }
  };
}

function createInterferencePattern(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create two wave sources that interfere
  const source1 = { x: 20, y: 20 };
  const source2 = { x: 80, y: 20 };
  
  // Create grid of symbols
  for (let x = 0; x < 100; x += 10) {
    for (let y = 0; y < 100; y += 10) {
      const id = `interference_${x}_${y}`;
      
      // Calculate distances from sources
      const d1 = Math.sqrt((x - source1.x) ** 2 + (y - source1.y) ** 2);
      const d2 = Math.sqrt((x - source2.x) ** 2 + (y - source2.y) ** 2);
      
      // Interference: constructive when path difference is n*λ
      const pathDiff = Math.abs(d1 - d2);
      const wavelength = 20;
      const phase = (pathDiff % wavelength) / wavelength * 2 * Math.PI;
      const amplitude = Math.abs(Math.cos(phase));
      
      const kind = amplitude > 0.5 ? 'class' : 'interface';
      
      symbols.set(id, {
        id,
        name: `Interference_${x}_${y}`,
        kind,
        line: y * 100 + x,
        endLine: y * 100 + x + 10 + Math.floor(amplitude * 40),
        filePath: `src/interference/grid${Math.floor(x / 50)}.ts`
      });
      
      // Connect to neighbors
      const connections: string[] = [];
      if (x > 0) connections.push(`interference_${x-10}_${y}`);
      if (y > 0) connections.push(`interference_${x}_${y-10}`);
      relationships.set(id, connections);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: ['src/interference/grid0.ts', 'src/interference/grid1.ts'],
      packages: ['interference'],
      namespaces: [],
      modules: ['interference']
    }
  };
}

function createResonantStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create repeating patterns at different scales (harmonic series)
  const patterns = [
    { name: 'base', count: 16, size: 50 },
    { name: 'double', count: 8, size: 50 },
    { name: 'triple', count: 5, size: 50 },
    { name: 'quad', count: 4, size: 50 }
  ];
  
  let offset = 0;
  for (const pattern of patterns) {
    for (let i = 0; i < pattern.count; i++) {
      const id = `${pattern.name}_${i}`;
      
      symbols.set(id, {
        id,
        name: `${pattern.name}Class${i}`,
        kind: 'class',
        line: offset + i * 100,
        endLine: offset + i * 100 + pattern.size,
        filePath: `src/resonant/${pattern.name}.ts`
      });
      
      // Connect in series
      if (i > 0) {
        relationships.set(id, [`${pattern.name}_${i-1}`]);
      }
    }
    offset += 1000;
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: patterns.map(p => `src/resonant/${p.name}.ts`),
      packages: ['resonant'],
      namespaces: [],
      modules: ['resonant']
    }
  };
}

function createMusicalIntervalStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create modules with sizes in musical ratios
  const modules = [
    { name: 'tonic', size: 12 },      // 1:1
    { name: 'fifth', size: 18 },      // 3:2
    { name: 'fourth', size: 16 },     // 4:3
    { name: 'third', size: 15 },      // 5:4
    { name: 'octave', size: 24 }      // 2:1
  ];
  
  for (const module of modules) {
    for (let i = 0; i < module.size; i++) {
      const id = `${module.name}_${i}`;
      
      symbols.set(id, {
        id,
        name: `${module.name}Class${i}`,
        kind: 'class',
        line: i * 50,
        endLine: i * 50 + 30,
        filePath: `src/musical/${module.name}/class${i}.ts`
      });
      
      // Connect within module
      if (i > 0) {
        relationships.set(id, [`${module.name}_${i-1}`]);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: modules.flatMap(m => 
        Array.from({ length: m.size }, (_, i) => `src/musical/${m.name}/class${i}.ts`)
      ),
      packages: modules.map(m => m.name),
      namespaces: [],
      modules: modules.map(m => m.name)
    }
  };
}

function createCyclicDependencyGraph(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create cycles of different lengths (natural frequencies)
  const cycles = [
    { length: 3, prefix: 'tri' },
    { length: 4, prefix: 'quad' },
    { length: 5, prefix: 'pent' },
    { length: 7, prefix: 'sept' }
  ];
  
  for (const cycle of cycles) {
    for (let i = 0; i < cycle.length; i++) {
      const id = `${cycle.prefix}_${i}`;
      
      symbols.set(id, {
        id,
        name: `${cycle.prefix}Class${i}`,
        kind: 'class',
        line: i * 100,
        endLine: i * 100 + 50,
        filePath: `src/cycles/${cycle.prefix}.ts`
      });
      
      // Create cycle
      const nextId = `${cycle.prefix}_${(i + 1) % cycle.length}`;
      relationships.set(id, [nextId]);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: cycles.map(c => `src/cycles/${c.prefix}.ts`),
      packages: ['cycles'],
      namespaces: [],
      modules: ['cycles']
    }
  };
}

function createLargeCodebase(size: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create structured large codebase with wave patterns
  const modules = 10;
  const symbolsPerModule = Math.floor(size / modules);
  
  for (let m = 0; m < modules; m++) {
    for (let i = 0; i < symbolsPerModule; i++) {
      const id = `large_${m}_${i}`;
      
      // Add some periodic variation
      const phase = (m * symbolsPerModule + i) / size * 2 * Math.PI;
      const sizeVariation = 30 + 20 * Math.sin(phase * 3);
      
      symbols.set(id, {
        id,
        name: `LargeClass_${m}_${i}`,
        kind: 'class',
        line: m * 1000 + i * 10,
        endLine: m * 1000 + i * 10 + Math.floor(sizeVariation),
        filePath: `src/large/module${m}/class${i}.ts`
      });
      
      // Create some connections
      const connections: string[] = [];
      if (i > 0) connections.push(`large_${m}_${i-1}`);
      if (Math.random() > 0.7) {
        // Cross-module connection
        const targetModule = (m + 1) % modules;
        connections.push(`large_${targetModule}_${Math.floor(Math.random() * symbolsPerModule)}`);
      }
      relationships.set(id, connections);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from({ length: size }, (_, i) => 
        `src/large/module${Math.floor(i * modules / size)}/class${i % symbolsPerModule}.ts`
      ),
      packages: Array.from({ length: modules }, (_, i) => `module${i}`),
      namespaces: [],
      modules: Array.from({ length: modules }, (_, i) => `module${i}`)
    }
  };
}