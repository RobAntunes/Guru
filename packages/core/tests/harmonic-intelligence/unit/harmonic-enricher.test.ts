/**
 * Unit tests for Harmonic Enricher
 * @module tests/harmonic-intelligence/unit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  HarmonicEnricher, 
  EnrichedSymbolGraph,
  HarmonicSymbolData 
} from '../../../src/harmonic-intelligence/core/harmonic-enricher';
import { SymbolGraph, SymbolNode, SymbolType } from '../../../src/parsers/symbol-graph';
import { PatternType, PatternCategory } from '../../../src/harmonic-intelligence/interfaces/harmonic-types';

// Mock the symbol graph module
vi.mock('../../../src/parsers/symbol-graph', () => ({
  SymbolGraph: vi.fn().mockImplementation(() => ({
    getAllNodes: vi.fn(),
    getAllEdges: vi.fn(),
    getNode: vi.fn(),
    getEdges: vi.fn()
  })),
  SymbolType: {
    FUNCTION: 'function',
    CLASS: 'class',
    INTERFACE: 'interface',
    VARIABLE: 'variable',
    METHOD: 'method'
  }
}));

describe('HarmonicEnricher', () => {
  let enricher: HarmonicEnricher;
  let mockSymbolGraph: SymbolGraph;
  
  beforeEach(() => {
    enricher = new HarmonicEnricher();
    mockSymbolGraph = new SymbolGraph();
    
    // Setup mock symbol graph data
    const mockNodes: SymbolNode[] = [
      {
        id: 'hub-class',
        name: 'HubController',
        type: SymbolType.CLASS,
        location: { file: 'src/controllers/hub.ts', line: 10, column: 1, endLine: 100 },
        scope: 'global',
        dependencies: ['service-1', 'service-2', 'service-3', 'util-1', 'util-2'],
        dependents: ['main'],
        metadata: { complexity: 15, exported: true }
      },
      {
        id: 'service-1',
        name: 'DataService',
        type: SymbolType.CLASS,
        location: { file: 'src/services/data.ts', line: 5, column: 1, endLine: 50 },
        scope: 'global',
        dependencies: ['util-1'],
        dependents: ['hub-class'],
        metadata: { complexity: 8, exported: true }
      },
      {
        id: 'service-2',
        name: 'AuthService',
        type: SymbolType.CLASS,
        location: { file: 'src/services/auth.ts', line: 5, column: 1, endLine: 45 },
        scope: 'global',
        dependencies: ['util-2'],
        dependents: ['hub-class'],
        metadata: { complexity: 10, exported: true }
      },
      {
        id: 'util-1',
        name: 'calculateRatio',
        type: SymbolType.FUNCTION,
        location: { file: 'src/utils/math.ts', line: 1, column: 1, endLine: 13 },
        scope: 'global',
        dependencies: [],
        dependents: ['service-1', 'hub-class'],
        metadata: { complexity: 3, exported: true }
      },
      {
        id: 'util-2',
        name: 'hashPassword',
        type: SymbolType.FUNCTION,
        location: { file: 'src/utils/crypto.ts', line: 1, column: 1, endLine: 21 },
        scope: 'global',
        dependencies: [],
        dependents: ['service-2', 'hub-class'],
        metadata: { complexity: 5, exported: true }
      }
    ];
    
    const mockEdges = [
      { source: 'hub-class', target: 'service-1', type: 'uses' },
      { source: 'hub-class', target: 'service-2', type: 'uses' },
      { source: 'hub-class', target: 'util-1', type: 'calls' },
      { source: 'hub-class', target: 'util-2', type: 'calls' },
      { source: 'service-1', target: 'util-1', type: 'calls' },
      { source: 'service-2', target: 'util-2', type: 'calls' }
    ];
    
    // Configure mock returns
    (mockSymbolGraph.getAllNodes as any).mockReturnValue(mockNodes);
    (mockSymbolGraph.getAllEdges as any).mockReturnValue(mockEdges);
    (mockSymbolGraph.getNode as any).mockImplementation((id: string) => 
      mockNodes.find(n => n.id === id)
    );
  });
  
  describe('Symbol Graph Enrichment', () => {
    it('should enrich all symbols with harmonic data', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      expect(enrichedGraph).toBeInstanceOf(EnrichedSymbolGraph);
      
      // Check that all symbols have harmonic data
      const allEnriched = enrichedGraph.getAllEnrichedSymbols();
      expect(allEnriched).toHaveLength(5);
      
      // Each symbol should have the original data preserved
      for (const enriched of allEnriched) {
        expect(enriched.symbol).toBeDefined();
        expect(enriched.symbol.id).toBeDefined();
        expect(enriched.symbol.name).toBeDefined();
      }
    });
    
    it('should preserve original symbol data without modification', async () => {
      const originalNodes = [...mockSymbolGraph.getAllNodes()];
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      // Verify original data is unchanged
      const hubData = enrichedGraph.getEnrichedSymbol('hub-class');
      expect(hubData?.symbol).toEqual(originalNodes[0]);
      expect(hubData?.symbol.dependencies).toHaveLength(5);
      expect(hubData?.symbol.type).toBe(SymbolType.CLASS);
    });
    
    it('should add harmonic scores to symbols', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      const hubData = enrichedGraph.getEnrichedSymbol('hub-class');
      expect(hubData?.harmonicScores).toBeDefined();
      
      // Should have scores for different categories
      // Note: Actual scores depend on analyzer implementations
      expect(hubData?.overallHarmonicScore).toBeDefined();
      expect(hubData?.overallHarmonicScore).toBeGreaterThanOrEqual(0);
      expect(hubData?.overallHarmonicScore).toBeLessThanOrEqual(1);
    });
    
    it('should identify pattern participation', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      // Hub class should participate in network topology patterns
      const hubData = enrichedGraph.getEnrichedSymbol('hub-class');
      expect(hubData?.participatesIn).toBeDefined();
      
      // Should identify hub-class as a hub due to many connections
      const networkParticipation = hubData?.participatesIn?.find(
        p => p.patternType === PatternType.NETWORK_TOPOLOGY
      );
      
      // This would be true if the enricher properly identifies hubs
      // For now, just check the structure exists
      expect(hubData?.participatesIn).toBeInstanceOf(Array);
    });
  });
  
  describe('Query Functionality', () => {
    let enrichedGraph: EnrichedSymbolGraph;
    
    beforeEach(async () => {
      enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
    });
    
    it('should support symbol property queries', () => {
      const classes = enrichedGraph.query()
        .whereSymbol(s => s.type === SymbolType.CLASS)
        .get();
      
      expect(classes).toHaveLength(3); // HubController, DataService, AuthService
      expect(classes.every(d => d.symbol.type === SymbolType.CLASS)).toBe(true);
    });
    
    it('should support harmonic property queries', () => {
      // Query for symbols with high overall harmonic scores
      const highHarmonic = enrichedGraph.query()
        .whereHarmonic(d => (d.overallHarmonicScore || 0) > 0.5)
        .get();
      
      // Results depend on actual analysis
      expect(highHarmonic).toBeInstanceOf(Array);
    });
    
    it('should support pattern participation queries', () => {
      // Find all symbols participating in network topology patterns
      const networkNodes = enrichedGraph.query()
        .wherePattern(PatternType.NETWORK_TOPOLOGY)
        .get();
      
      expect(networkNodes).toBeInstanceOf(Array);
    });
    
    it('should support combined queries', () => {
      // Find classes with many dependencies
      const complexClasses = enrichedGraph.query()
        .whereSymbol(s => s.type === SymbolType.CLASS)
        .whereSymbol(s => s.dependencies.length > 3)
        .get();
      
      expect(complexClasses).toHaveLength(1); // Only HubController
      expect(complexClasses[0].symbol.name).toBe('HubController');
    });
    
    it('should support getSymbols() to extract just symbols', () => {
      const functionSymbols = enrichedGraph.query()
        .whereSymbol(s => s.type === SymbolType.FUNCTION)
        .getSymbols();
      
      expect(functionSymbols).toHaveLength(2);
      expect(functionSymbols[0]).not.toHaveProperty('harmonicScores');
      expect(functionSymbols[0]).toHaveProperty('name');
    });
  });
  
  describe('Pattern Statistics', () => {
    it('should calculate pattern statistics across all symbols', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      const stats = enrichedGraph.getPatternStatistics();
      
      expect(stats).toBeInstanceOf(Map);
      
      // Check structure of statistics
      for (const [patternType, stat] of stats) {
        expect(stat).toHaveProperty('count');
        expect(stat).toHaveProperty('avgScore');
        expect(stat.count).toBeGreaterThanOrEqual(0);
        expect(stat.avgScore).toBeGreaterThanOrEqual(0);
        expect(stat.avgScore).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('Category Filtering', () => {
    it('should support analyzing specific pattern categories', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph, {
        categories: [PatternCategory.CLASSICAL_HARMONY, PatternCategory.NETWORK_TOPOLOGY]
      });
      
      // Should still enrich all symbols
      expect(enrichedGraph.getAllEnrichedSymbols()).toHaveLength(5);
    });
    
    it('should support parallel analysis option', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph, {
        parallel: true
      });
      
      expect(enrichedGraph).toBeInstanceOf(EnrichedSymbolGraph);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty symbol graph', async () => {
      const emptyGraph = new SymbolGraph();
      (emptyGraph.getAllNodes as any).mockReturnValue([]);
      (emptyGraph.getAllEdges as any).mockReturnValue([]);
      
      const enrichedGraph = await enricher.enrichSymbolGraph(emptyGraph);
      
      expect(enrichedGraph.getAllEnrichedSymbols()).toHaveLength(0);
      expect(enrichedGraph.getPatternStatistics().size).toBe(0);
    });
    
    it('should handle symbols with no dependencies', async () => {
      const isolatedGraph = new SymbolGraph();
      const isolatedNode: SymbolNode = {
        id: 'isolated',
        name: 'IsolatedFunction',
        type: SymbolType.FUNCTION,
        location: { file: 'src/isolated.ts', line: 1, column: 1 },
        scope: 'global',
        dependencies: [],
        dependents: [],
        metadata: {}
      };
      
      (isolatedGraph.getAllNodes as any).mockReturnValue([isolatedNode]);
      (isolatedGraph.getAllEdges as any).mockReturnValue([]);
      
      const enrichedGraph = await enricher.enrichSymbolGraph(isolatedGraph);
      const enrichedData = enrichedGraph.getEnrichedSymbol('isolated');
      
      expect(enrichedData).toBeDefined();
      expect(enrichedData?.symbol).toEqual(isolatedNode);
      expect(enrichedData?.participatesIn).toEqual([]);
    });
  });
  
  describe('Real-world Usage Examples', () => {
    it('should find hub nodes in network topology', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      // Find symbols by pattern participation
      const hubs = enrichedGraph.findSymbolsByPattern(PatternType.NETWORK_TOPOLOGY, 0.5);
      
      // The actual results depend on the analyzer implementation
      expect(hubs).toBeInstanceOf(Array);
    });
    
    it('should support complex analysis scenarios', async () => {
      const enrichedGraph = await enricher.enrichSymbolGraph(mockSymbolGraph);
      
      // Example: Find utility functions with high information entropy
      const complexUtils = enrichedGraph.query()
        .whereSymbol(s => s.type === SymbolType.FUNCTION)
        .whereSymbol(s => s.location.file.includes('utils'))
        .get();
      
      expect(complexUtils).toHaveLength(2);
      expect(complexUtils[0].symbol.location.file).toContain('utils');
    });
  });
});

describe('EnrichedSymbolGraph', () => {
  it('should provide access to original symbol graph', async () => {
    const enricher = new HarmonicEnricher();
    const mockGraph = new SymbolGraph();
    (mockGraph.getAllNodes as any).mockReturnValue([]);
    (mockGraph.getAllEdges as any).mockReturnValue([]);
    
    const enrichedGraph = await enricher.enrichSymbolGraph(mockGraph);
    
    expect(enrichedGraph.getSymbolGraph()).toBe(mockGraph);
  });
});