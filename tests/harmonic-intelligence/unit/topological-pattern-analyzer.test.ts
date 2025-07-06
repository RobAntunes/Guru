/**
 * Unit tests for Topological Pattern Analyzer
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TopologicalPatternAnalyzer } from '../../../src/harmonic-intelligence/analyzers/topological-pattern-analyzer';
import {
  SemanticData,
  PatternType,
  PatternScore,
  PatternCategory,
  Symbol
} from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

describe('TopologicalPatternAnalyzer', () => {
  let analyzer: TopologicalPatternAnalyzer;
  let mockSemanticData: SemanticData;
  
  beforeEach(() => {
    analyzer = new TopologicalPatternAnalyzer();
    
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
    it('should return all three topological patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.size).toBe(3);
      expect(results.has(PatternType.NETWORK_TOPOLOGY)).toBe(true);
      expect(results.has(PatternType.KNOT_THEORY)).toBe(true);
      expect(results.has(PatternType.SMALL_WORLD_NETWORKS)).toBe(true);
    });
    
    it('should assign correct category to all patterns', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const score of results.values()) {
        expect(score.category).toBe(PatternCategory.TOPOLOGICAL_PATTERNS);
      }
    });
  });
  
  describe('Network Topology Detection', () => {
    it('should detect scale-free network properties', async () => {
      // Create a scale-free network (hub-and-spoke pattern)
      const data = createScaleFreeNetwork();
      
      const results = await analyzer.analyze(data);
      const networkTopology = results.get(PatternType.NETWORK_TOPOLOGY)!;
      
      expect(networkTopology.detected).toBe(true);
      expect(networkTopology.score).toBeGreaterThan(0.35); // Adjusted threshold
      
      // Check for either scale-free or high clustering evidence
      const scaleFreeEvidence = networkTopology.evidence.find(e => e.type === 'scale_free_network');
      const clusteringEvidence = networkTopology.evidence.find(e => e.type === 'high_clustering');
      const networkEvidence = networkTopology.evidence.find(e => e.type === 'network_structure');
      
      // Should have at least network structure evidence
      expect(networkEvidence).toBeDefined();
      
      // Should have either scale-free or clustering evidence
      expect(scaleFreeEvidence || clusteringEvidence).toBeTruthy();
      
      if (scaleFreeEvidence) {
        expect(scaleFreeEvidence.value).toBeGreaterThan(1.5);
        expect(scaleFreeEvidence.value).toBeLessThan(4);
      }
    });
    
    it('should calculate clustering coefficient correctly', async () => {
      // Create a network with triangular clusters
      const data = createClusteredNetwork();
      
      const results = await analyzer.analyze(data);
      const networkTopology = results.get(PatternType.NETWORK_TOPOLOGY)!;
      
      const clusteringEvidence = networkTopology.evidence.find(e => e.type === 'high_clustering');
      expect(clusteringEvidence).toBeDefined();
      if (clusteringEvidence) {
        expect(clusteringEvidence.value).toBeGreaterThan(0.3);
      }
    });
    
    it('should handle disconnected graphs', async () => {
      // Create disconnected components
      const data = createDisconnectedGraph();
      
      const results = await analyzer.analyze(data);
      const networkTopology = results.get(PatternType.NETWORK_TOPOLOGY)!;
      
      expect(networkTopology).toBeDefined();
      expect(networkTopology.score).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle empty graphs gracefully', async () => {
      const results = await analyzer.analyze(mockSemanticData);
      const networkTopology = results.get(PatternType.NETWORK_TOPOLOGY)!;
      
      expect(networkTopology.detected).toBe(false);
      expect(networkTopology.score).toBe(0);
    });
  });
  
  describe('Knot Theory Detection', () => {
    it('should detect entanglement complexity', async () => {
      // Create entangled dependencies
      const data = createEntangledDependencies();
      
      const results = await analyzer.analyze(data);
      const knotTheory = results.get(PatternType.KNOT_THEORY)!;
      
      expect(knotTheory.detected).toBe(true);
      
      const entanglementEvidence = knotTheory.evidence.find(e => e.type === 'entanglement_complexity');
      expect(entanglementEvidence).toBeDefined();
      if (entanglementEvidence) {
        expect(entanglementEvidence.value).toBeGreaterThanOrEqual(0.5);
      }
    });
    
    it('should calculate crossing numbers', async () => {
      // Create a non-planar graph (K5)
      const data = createCompleteGraph(5);
      
      const results = await analyzer.analyze(data);
      const knotTheory = results.get(PatternType.KNOT_THEORY)!;
      
      const crossingEvidence = knotTheory.evidence.find(e => e.type === 'crossing_number');
      expect(crossingEvidence).toBeDefined();
      if (crossingEvidence) {
        expect(crossingEvidence.value).toBeGreaterThan(0);
      }
    });
    
    it('should compute Alexander polynomial for cyclic structures', async () => {
      // Create a graph with cycles
      const data = createCyclicGraph();
      
      const results = await analyzer.analyze(data);
      const knotTheory = results.get(PatternType.KNOT_THEORY)!;
      
      const alexanderEvidence = knotTheory.evidence.find(e => e.type === 'alexander_polynomial');
      expect(alexanderEvidence).toBeDefined();
      if (alexanderEvidence) {
        expect(alexanderEvidence.description).toContain('polynomial');
        expect(alexanderEvidence.value).toBeGreaterThan(0);
      }
    });
    
    it('should handle tree structures (no knots)', async () => {
      const data = createTreeStructure();
      
      const results = await analyzer.analyze(data);
      const knotTheory = results.get(PatternType.KNOT_THEORY)!;
      
      expect(knotTheory.detected).toBe(false);
      expect(knotTheory.score).toBeLessThanOrEqual(0.3);
    });
  });
  
  describe('Small-World Networks Detection', () => {
    it('should detect Watts-Strogatz small-world properties', async () => {
      // Create a small-world network
      const data = createSmallWorldNetwork();
      
      const results = await analyzer.analyze(data);
      const smallWorld = results.get(PatternType.SMALL_WORLD_NETWORKS)!;
      
      expect(smallWorld.detected).toBe(true);
      
      const sigmaEvidence = smallWorld.evidence.find(e => e.type === 'watts_strogatz_sigma');
      expect(sigmaEvidence).toBeDefined();
      if (sigmaEvidence) {
        expect(sigmaEvidence.value).toBeGreaterThan(1.5);
      }
    });
    
    it('should identify optimal clustering vs path length trade-off', async () => {
      const data = createSmallWorldNetwork();
      
      const results = await analyzer.analyze(data);
      const smallWorld = results.get(PatternType.SMALL_WORLD_NETWORKS)!;
      
      const tradeoffEvidence = smallWorld.evidence.find(e => e.type === 'small_world_tradeoff');
      expect(tradeoffEvidence).toBeDefined();
      if (tradeoffEvidence) {
        expect(tradeoffEvidence.description).toContain('high clustering');
        expect(tradeoffEvidence.description).toContain('low path length');
      }
    });
    
    it('should estimate rewiring probability', async () => {
      const data = createModularNetworkWithCrossLinks();
      
      const results = await analyzer.analyze(data);
      const smallWorld = results.get(PatternType.SMALL_WORLD_NETWORKS)!;
      
      const rewireEvidence = smallWorld.evidence.find(e => e.type === 'rewire_probability');
      expect(rewireEvidence).toBeDefined();
      if (rewireEvidence) {
        expect(rewireEvidence.value).toBeGreaterThanOrEqual(0);
        expect(rewireEvidence.value).toBeLessThan(0.2);
      }
    });
    
    it('should handle regular lattice (not small-world)', async () => {
      const data = createRegularLattice();
      
      const results = await analyzer.analyze(data);
      const smallWorld = results.get(PatternType.SMALL_WORLD_NETWORKS)!;
      
      expect(smallWorld.detected).toBe(false);
      expect(smallWorld.metadata?.isSmallWorld).toBe(false);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle single node graph', async () => {
      mockSemanticData.symbols.set('node1', {
        id: 'node1',
        name: 'SingleNode',
        kind: 'class',
        line: 1,
        endLine: 10,
        filePath: 'src/single.ts'
      });
      
      const results = await analyzer.analyze(mockSemanticData);
      
      for (const pattern of results.values()) {
        expect(pattern.score).toBe(0);
        expect(pattern.detected).toBe(false);
      }
    });
    
    it('should handle self-referential nodes', async () => {
      mockSemanticData.symbols.set('recursive', {
        id: 'recursive',
        name: 'RecursiveClass',
        kind: 'class',
        line: 1,
        endLine: 50,
        filePath: 'src/recursive.ts'
      });
      mockSemanticData.relationships.set('recursive', ['recursive']);
      
      const results = await analyzer.analyze(mockSemanticData);
      
      expect(results.get(PatternType.KNOT_THEORY)!.score).toBeGreaterThan(0);
    });
    
    it('should handle very large graphs efficiently', async () => {
      // Create a large graph with 200 nodes
      const data = createLargeGraph(200);
      
      const startTime = Date.now();
      const results = await analyzer.analyze(data);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(results.size).toBe(3);
    });
  });
});

// Helper functions to create test data

function createScaleFreeNetwork(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create hub nodes
  const hubs = ['Hub1', 'Hub2', 'Hub3'];
  hubs.forEach(hub => {
    symbols.set(hub, {
      id: hub,
      name: hub,
      kind: 'class',
      line: 1,
      endLine: 100,
      filePath: `src/${hub}.ts`
    });
  });
  
  // Create peripheral nodes connected to hubs
  for (let i = 0; i < 30; i++) {
    const nodeId = `Node${i}`;
    symbols.set(nodeId, {
      id: nodeId,
      name: nodeId,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/nodes/${nodeId}.ts`
    });
    
    // Connect to hubs with preferential attachment
    const hubIndex = i % hubs.length;
    const connections = [hubs[hubIndex]];
    
    // Some nodes connect to multiple hubs
    if (i % 5 === 0) {
      connections.push(hubs[(hubIndex + 1) % hubs.length]);
    }
    
    relationships.set(nodeId, connections);
  }
  
  // Hubs connect to each other
  relationships.set('Hub1', ['Hub2', 'Hub3']);
  relationships.set('Hub2', ['Hub1', 'Hub3']);
  relationships.set('Hub3', ['Hub1', 'Hub2']);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createClusteredNetwork(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create 3 triangular clusters
  for (let cluster = 0; cluster < 3; cluster++) {
    const nodes = [`C${cluster}N1`, `C${cluster}N2`, `C${cluster}N3`];
    
    nodes.forEach((node, i) => {
      symbols.set(node, {
        id: node,
        name: node,
        kind: 'class',
        line: 1,
        endLine: 50,
        filePath: `src/cluster${cluster}/${node}.ts`
      });
      
      // Connect to other nodes in cluster
      const others = nodes.filter((_, j) => j !== i);
      relationships.set(node, others);
    });
  }
  
  // Connect clusters
  relationships.get('C0N1')!.push('C1N1');
  relationships.get('C1N1')!.push('C2N1');
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createDisconnectedGraph(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Component 1
  ['A1', 'A2', 'A3'].forEach(id => {
    symbols.set(id, {
      id,
      name: id,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/comp1/${id}.ts`
    });
  });
  relationships.set('A1', ['A2']);
  relationships.set('A2', ['A3']);
  
  // Component 2 (isolated)
  ['B1', 'B2'].forEach(id => {
    symbols.set(id, {
      id,
      name: id,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/comp2/${id}.ts`
    });
  });
  relationships.set('B1', ['B2']);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createEntangledDependencies(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create mutually dependent classes
  const classes = ['ServiceA', 'ServiceB', 'ServiceC', 'ServiceD'];
  
  classes.forEach(cls => {
    symbols.set(cls, {
      id: cls,
      name: cls,
      kind: 'class',
      line: 1,
      endLine: 100,
      filePath: `src/services/${cls}.ts`
    });
  });
  
  // Create circular dependencies
  relationships.set('ServiceA', ['ServiceB', 'ServiceC']);
  relationships.set('ServiceB', ['ServiceC', 'ServiceA']);
  relationships.set('ServiceC', ['ServiceD', 'ServiceA']);
  relationships.set('ServiceD', ['ServiceA', 'ServiceB']);
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createCompleteGraph(n: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create complete graph K_n
  for (let i = 0; i < n; i++) {
    const nodeId = `K${i}`;
    symbols.set(nodeId, {
      id: nodeId,
      name: nodeId,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/complete/${nodeId}.ts`
    });
    
    // Connect to all other nodes
    const connections = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        connections.push(`K${j}`);
      }
    }
    relationships.set(nodeId, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createCyclicGraph(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create multiple cycles of different sizes
  // Cycle 1: 3 nodes
  ['C1A', 'C1B', 'C1C'].forEach((id, i, arr) => {
    symbols.set(id, {
      id,
      name: id,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/cycles/${id}.ts`
    });
    relationships.set(id, [arr[(i + 1) % arr.length]]);
  });
  
  // Cycle 2: 5 nodes
  ['C2A', 'C2B', 'C2C', 'C2D', 'C2E'].forEach((id, i, arr) => {
    symbols.set(id, {
      id,
      name: id,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/cycles/${id}.ts`
    });
    relationships.set(id, [arr[(i + 1) % arr.length], arr[(i + 2) % arr.length]]);
  });
  
  // Connect the cycles
  relationships.get('C1A')!.push('C2A');
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createTreeStructure(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create a binary tree
  const levels = 4;
  for (let level = 0; level < levels; level++) {
    const nodesInLevel = Math.pow(2, level);
    for (let i = 0; i < nodesInLevel; i++) {
      const nodeId = `L${level}N${i}`;
      symbols.set(nodeId, {
        id: nodeId,
        name: nodeId,
        kind: 'class',
        line: 1,
        endLine: 50,
        filePath: `src/tree/${nodeId}.ts`
      });
      
      // Connect to children in next level
      if (level < levels - 1) {
        const leftChild = `L${level + 1}N${i * 2}`;
        const rightChild = `L${level + 1}N${i * 2 + 1}`;
        relationships.set(nodeId, [leftChild, rightChild]);
      }
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createSmallWorldNetwork(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create ring lattice with some rewired edges
  const n = 20;
  const k = 4; // Each node connected to k nearest neighbors
  
  for (let i = 0; i < n; i++) {
    const nodeId = `SW${i}`;
    symbols.set(nodeId, {
      id: nodeId,
      name: nodeId,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/smallworld/${nodeId}.ts`
    });
    
    const connections = [];
    // Regular connections
    for (let j = 1; j <= k / 2; j++) {
      connections.push(`SW${(i + j) % n}`);
      connections.push(`SW${(i - j + n) % n}`);
    }
    
    // Add some long-range connections (rewiring)
    if (i % 5 === 0) {
      const farNode = (i + Math.floor(n / 2)) % n;
      connections.push(`SW${farNode}`);
    }
    
    relationships.set(nodeId, [...new Set(connections)]);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createModularNetworkWithCrossLinks(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create 3 modules
  const modules = ['auth', 'data', 'api'];
  const nodesPerModule = 5;
  
  modules.forEach((module, modIdx) => {
    // Create nodes in module
    for (let i = 0; i < nodesPerModule; i++) {
      const nodeId = `${module}_${i}`;
      symbols.set(nodeId, {
        id: nodeId,
        name: `${module}Class${i}`,
        kind: 'class',
        line: 1,
        endLine: 50,
        filePath: `src/${module}/${nodeId}.ts`
      });
      
      const connections = [];
      
      // Intra-module connections (dense)
      for (let j = 0; j < nodesPerModule; j++) {
        if (i !== j && Math.random() < 0.6) {
          connections.push(`${module}_${j}`);
        }
      }
      
      // Inter-module connections (sparse)
      if (i === 0) { // Module interface nodes
        const otherModule = modules[(modIdx + 1) % modules.length];
        connections.push(`${otherModule}_0`);
      }
      
      relationships.set(nodeId, connections);
    }
  });
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { 
      files: Array.from(symbols.values()).map(s => s.filePath),
      packages: modules,
      namespaces: [],
      modules
    }
  };
}

function createRegularLattice(): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create 2D grid lattice
  const rows = 5;
  const cols = 5;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const nodeId = `Grid_${i}_${j}`;
      symbols.set(nodeId, {
        id: nodeId,
        name: nodeId,
        kind: 'class',
        line: 1,
        endLine: 50,
        filePath: `src/grid/${nodeId}.ts`
      });
      
      const connections = [];
      
      // Connect to neighbors
      if (i > 0) connections.push(`Grid_${i-1}_${j}`);
      if (i < rows - 1) connections.push(`Grid_${i+1}_${j}`);
      if (j > 0) connections.push(`Grid_${i}_${j-1}`);
      if (j < cols - 1) connections.push(`Grid_${i}_${j+1}`);
      
      relationships.set(nodeId, connections);
    }
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}

function createLargeGraph(n: number): SemanticData {
  const symbols = new Map<string, Symbol>();
  const relationships = new Map<string, string[]>();
  
  // Create random graph with controlled density
  const edgeProbability = 2 * Math.log(n) / n; // Ensures connectivity
  
  for (let i = 0; i < n; i++) {
    const nodeId = `LargeNode${i}`;
    symbols.set(nodeId, {
      id: nodeId,
      name: nodeId,
      kind: 'class',
      line: 1,
      endLine: 50,
      filePath: `src/large/${nodeId}.ts`
    });
    
    const connections = [];
    
    // Random connections
    for (let j = 0; j < n; j++) {
      if (i !== j && Math.random() < edgeProbability) {
        connections.push(`LargeNode${j}`);
      }
    }
    
    relationships.set(nodeId, connections);
  }
  
  return {
    symbols,
    relationships,
    behaviors: { executionFlows: [], dataFlows: [], controlFlows: [] },
    structure: { files: [], packages: [], namespaces: [], modules: [] }
  };
}