/**
 * @fileoverview Analyzes the behavioral profile of symbols in a codebase.
 *
 * This module calculates a multi-dimensional "Participation Profile" for each symbol,
 * describing its role in the system based on quantitative graph metrics and data
 * flow characteristics, rather than brittle naming conventions.
 */

import { SymbolGraph, SymbolNode } from '../types/index.js';
import { ApplicationEntryPoint } from '../types/entry-point.js';

// The multi-dimensional behavioral profile for a symbol.
export interface ParticipationProfile {
  // Connectivity
  fanIn: number;
  fanOut: number;
  centrality: number; // Placeholder for a real graph centrality metric like PageRank

  // Abstraction
  graphDepth: number; // Steps from the nearest entrypoint

  // Data Flow & Control
  isSource: boolean; // Introduces new data
  isSink: boolean;   // Terminates data flow
  isTransformer: boolean; // Modifies data
  instantiationCount: number; // Count of `new` keywords
}

export class SymbolProfileAnalyzer {
  constructor() {}

  /**
   * Analyzes the entire graph to produce a participation profile for each symbol.
   *
   * @param symbolGraph The full symbol graph.
   * @param entryPoints An array of identified entry points.
   * @returns A map of SymbolID to its calculated ParticipationProfile.
   */
  analyze(symbolGraph: SymbolGraph, entryPoints: ApplicationEntryPoint[]): Map<string, ParticipationProfile> {
    const profileMap = new Map<string, ParticipationProfile>();
    const entryPointIds = new Set(entryPoints.map(ep => ep.symbol || ep.file));

    // First, calculate graph-wide metrics like centrality (placeholder)
    const centralityMap = this.calculateCentrality(symbolGraph);

    for (const symbol of symbolGraph.symbols.values()) {
      const fanIn = symbolGraph.edges.filter(e => e.to === symbol.id).length;
      const fanOut = symbolGraph.edges.filter(e => e.from === symbol.id).length;

      const profile: ParticipationProfile = {
        fanIn,
        fanOut,
        centrality: centralityMap.get(symbol.id) || 0,
        graphDepth: this.calculateGraphDepth(symbol.id, symbolGraph, entryPointIds),
        isSource: fanIn === 0 && fanOut > 0, // Simple heuristic
        isSink: fanOut === 0 && fanIn > 0,   // Simple heuristic
        isTransformer: fanIn > 0 && fanOut > 0, // Simple heuristic
        instantiationCount: 0, // Placeholder - would require deeper analysis
      };

      profileMap.set(symbol.id, profile);
    }

    return profileMap;
  }

  /**
   * Calculates the shortest path distance from a symbol to any entry point.
   */
  private calculateGraphDepth(symbolId: string, graph: SymbolGraph, entryPointIds: Set<string>): number {
    if (entryPointIds.has(symbolId)) {
      return 0;
    }

    // This is a simplified Breadth-First Search (BFS) for depth.
    // A real implementation would be more optimized.
    const queue: { id: string, depth: number }[] = [{ id: symbolId, depth: 0 }];
    const visited = new Set<string>([symbolId]);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      // Traverse backwards from the symbol to the entry points
      const incomingEdges = graph.edges.filter(e => e.to === id);
      for (const edge of incomingEdges) {
        if (entryPointIds.has(edge.from)) {
          return depth + 1; // Found the shortest path to an entry point
        }
        if (!visited.has(edge.from)) {
          visited.add(edge.from);
          queue.push({ id: edge.from, depth: depth + 1 });
        }
      }
    }

    return -1; // -1 indicates no path from an entrypoint (e.g., dead code)
  }

  /**
   * Placeholder for a real graph centrality algorithm.
   */
  private calculateCentrality(graph: SymbolGraph): Map<string, number> {
    // In a real implementation, this would be something like PageRank.
    // For now, we'll use a simple degree-based centrality.
    const centralityMap = new Map<string, number>();
    const maxDegree = Math.max(...Array.from(graph.symbols.values()).map(s => 
        graph.edges.filter(e => e.to === s.id || e.from === s.id).length
    ));

    for (const symbol of graph.symbols.values()) {
        const degree = graph.edges.filter(e => e.to === symbol.id || e.from === symbol.id).length;
        centralityMap.set(symbol.id, maxDegree > 0 ? degree / maxDegree : 0);
    }
    return centralityMap;
  }
}
