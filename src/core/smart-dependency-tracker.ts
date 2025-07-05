/**
 * @fileoverview Smart Dependency Tracker for AI-native code analysis.
 *
 * This module implements the logic for tracking dependencies between symbols
 * with a focus on providing rich, contextual information for AI consumption.
 * It leverages the enhanced database schema to store and retrieve dependency
 * information with confidence scores, primary status, and metadata.
 */

import { GuruDatabase } from './database.js';
import { SymbolNode, SymbolEdge, EdgeType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class SmartDependencyTracker {
  private db: GuruDatabase;

  constructor(db: GuruDatabase) {
    this.db = db;
  }

  /**
   * Analyzes and stores a dependency between two symbols.
   *
   * @param from The symbol that has the dependency.
   * @param to The symbol that is being depended on.
   * @param edgeType The type of dependency.
   * @param metadata Additional context about the dependency.
   * @returns The newly created SymbolEdge.
   */
  async addDependency(
    from: SymbolNode,
    to: SymbolNode,
    edgeType: EdgeType,
    metadata: Record<string, any>
  ): Promise<SymbolEdge> {
    const edge: SymbolEdge = {
      id: uuidv4(),
      from: from.id,
      to: to.id,
      type: edgeType,
      weight: 1.0, // Initial weight, can be adjusted by AI
      is_primary: metadata.is_primary || false,
      confidence: metadata.confidence || 1.0,
      metadata: JSON.stringify(metadata),
    };

    await this.db.storeSymbolEdge(edge);
    return edge;
  }
}
