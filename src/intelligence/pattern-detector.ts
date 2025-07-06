/**
 * @fileoverview AI-native pattern detector.
 *
 * This module detects emergent patterns by analyzing the relationships between
 * the behavioral profiles of symbols, allowing it to find recurring architectural
 * motifs regardless of specific implementation details.
 */

import { GuruDatabase, DetectedPattern, PatternInstance } from '../core/database.js';
import { SymbolGraph, SymbolEdge } from '../types/index.js';
import { ParticipationProfile } from './symbol-profile-analyzer.js';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface ProfiledInteraction {
  hash: string;
  edge: SymbolEdge;
  fromProfile: ParticipationProfile;
  toProfile: ParticipationProfile;
}

export class PatternDetector {
  private db: GuruDatabase;

  constructor(db: GuruDatabase) {
    this.db = db;
  }

  /**
   * Detects patterns based on the interaction between symbol profiles.
   *
   * @param symbolGraph The full symbol graph.
   * @param profileMap A map of SymbolID to its ParticipationProfile.
   */
  async detectPatterns(symbolGraph: SymbolGraph, profileMap: Map<string, ParticipationProfile>): Promise<void> {
    console.log('Detecting patterns from symbol participation profiles...');

    // 1. Generate fingerprints for every interaction based on the *profiles* of the participants
    const profiledInteractions = this.generateProfiledInteractions(symbolGraph, profileMap);

    // 2. Group identical interactions
    const interactionGroups = new Map<string, ProfiledInteraction[]>();
    for (const interaction of profiledInteractions) {
      if (!interactionGroups.has(interaction.hash)) {
        interactionGroups.set(interaction.hash, []);
      }
      interactionGroups.get(interaction.hash)!.push(interaction);
    }

    // 3. Store these fundamental, profile-based patterns
    for (const [hash, interactions] of interactionGroups.entries()) {
      if (interactions.length > 1) { // A pattern needs at least two instances
        await this.storeProfiledPattern(hash, interactions, symbolGraph);
      }
    }

    console.log(`Stored ${interactionGroups.size} fundamental profile-based interaction patterns.`);
  }

  private generateProfiledInteractions(graph: SymbolGraph, profileMap: Map<string, ParticipationProfile>): ProfiledInteraction[] {
    const interactions: ProfiledInteraction[] = [];
    for (const edge of graph.edges) {
      const fromProfile = profileMap.get(edge.from);
      const toProfile = profileMap.get(edge.to);

      if (fromProfile && toProfile) {
        // The canonical representation is now based on the behavioral profiles!
        const canonicalRepresentation = this.createCanonicalProfileString(fromProfile) + ` -> ${edge.type} -> ` + this.createCanonicalProfileString(toProfile);
        const hash = createHash('sha256').update(canonicalRepresentation).digest('hex');
        interactions.push({ hash, edge, fromProfile, toProfile });
      }
    }
    return interactions;
  }

  /**
   * Creates a simplified, stable string representation of a profile for hashing.
   */
  private createCanonicalProfileString(profile: ParticipationProfile): string {
    // We discretize the continuous values to make the representation more general.
    const fanIn = profile.fanIn < 5 ? 'low' : profile.fanIn < 20 ? 'medium' : 'high';
    const fanOut = profile.fanOut < 5 ? 'low' : profile.fanOut < 20 ? 'medium' : 'high';
    const depth = profile.graphDepth < 2 ? 'shallow' : profile.graphDepth < 5 ? 'mid' : 'deep';
    return `(fi:${fanIn},fo:${fanOut},d:${depth})`;
  }

  private async storeProfiledPattern(hash: string, interactions: ProfiledInteraction[], symbolGraph: SymbolGraph): Promise<void> {
    const patternId = uuidv4();
    const now = Date.now();

    const pattern: DetectedPattern = {
      id: patternId,
      hash: hash,
      type: 'emergent',
      vector_embedding: '[]', // Placeholder
      stability_score: 0.5, // Placeholder
      complexity_score: 1, // Placeholder
      frequency: interactions.length,
      created_at: now,
      updated_at: now,
      metadata: JSON.stringify({ canonical_form: this.decodeProfileHash(interactions[0]) }),
    };

    await this.db.upsertDetectedPattern(pattern);

    // Save pattern instances only if the symbols exist in the database - use parallel operations
    const instanceOperations = interactions.map(async (interaction) => {
      try {
        // Check if symbol exists first
        const symbol = symbolGraph.symbols.get(interaction.edge.from);
        if (symbol) {
          // Try to save the symbol to database first
          await this.db.storeSymbol(symbol);
          
          const instance: PatternInstance = {
            id: uuidv4(),
            pattern_id: patternId,
            symbol_id: interaction.edge.from,
            role_in_pattern: 'source',
            confidence: 0.95,
            created_at: now,
            metadata: JSON.stringify({ edge_from: interaction.edge.from, edge_to: interaction.edge.to }),
          };
          await this.db.upsertPatternInstance(instance);
        }
      } catch (error) {
        console.warn(`[PatternDetector] Could not create pattern instance for ${interaction.edge.from}:`, error);
        // Continue with next instance instead of failing
      }
    });
    
    await Promise.allSettled(instanceOperations);
  }

  private decodeProfileHash(interaction: ProfiledInteraction): string {
      return this.createCanonicalProfileString(interaction.fromProfile) + ` -> ${interaction.edge.type} -> ` + this.createCanonicalProfileString(interaction.toProfile);
  }
}
