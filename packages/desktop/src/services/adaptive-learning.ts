/**
 * Adaptive Learning Service
 * Tracks and learns from user interactions and synthesis outcomes
 */

export interface LearningInteraction {
  actionType: string;
  resourceType: string;
  resourceId: string;
  duration: number;
  success: boolean;
  metadata?: any;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  lastSeen: Date;
}

class AdaptiveLearningService {
  private interactions: LearningInteraction[] = [];
  private patterns: Map<string, LearningPattern> = new Map();

  /**
   * Record a user interaction for learning
   */
  async recordInteraction(interaction: LearningInteraction): Promise<void> {
    this.interactions.push(interaction);
    
    // Update patterns
    const patternKey = `${interaction.actionType}-${interaction.resourceType}`;
    const existing = this.patterns.get(patternKey);
    
    if (existing) {
      existing.frequency++;
      existing.successRate = (existing.successRate * (existing.frequency - 1) + (interaction.success ? 1 : 0)) / existing.frequency;
      existing.lastSeen = new Date();
    } else {
      this.patterns.set(patternKey, {
        id: `pattern-${Date.now()}`,
        pattern: patternKey,
        frequency: 1,
        successRate: interaction.success ? 1 : 0,
        lastSeen: new Date()
      });
    }
  }

  /**
   * Get learning patterns
   */
  getPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get recommendations based on patterns
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze patterns for recommendations
    this.patterns.forEach((pattern) => {
      if (pattern.successRate > 0.8 && pattern.frequency > 5) {
        recommendations.push(`Continue using ${pattern.pattern} - high success rate`);
      } else if (pattern.successRate < 0.3 && pattern.frequency > 3) {
        recommendations.push(`Consider alternatives to ${pattern.pattern} - low success rate`);
      }
    });
    
    return recommendations;
  }

  /**
   * Clear learning data
   */
  clearData(): void {
    this.interactions = [];
    this.patterns.clear();
  }

  /**
   * Record a thought pattern from the thought chain
   */
  async recordThoughtPattern(
    pattern: string,
    context: any,
    outcome: { success: boolean; confidence: number }
  ): Promise<void> {
    await this.recordInteraction({
      actionType: 'thought_pattern',
      resourceType: 'reasoning',
      resourceId: pattern,
      duration: 0,
      success: outcome.success,
      metadata: { context, confidence: outcome.confidence }
    });
  }

  /**
   * Record a successful operation
   */
  async recordSuccess(
    operation: string,
    context: any,
    metrics?: { duration?: number; quality?: number }
  ): Promise<void> {
    await this.recordInteraction({
      actionType: 'operation',
      resourceType: 'success',
      resourceId: operation,
      duration: metrics?.duration || 0,
      success: true,
      metadata: { context, quality: metrics?.quality }
    });
  }
}

// Export singleton instance
export const adaptiveLearningService = new AdaptiveLearningService();