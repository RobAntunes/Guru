/**
 * ChangeImpactAnalyzer - AI-native change impact analysis
 *
 * Predicts ripple effects of code changes with confidence scoring
 * Enables safe autonomous refactoring and modification decisions
 */

import {
  ChangeImpactAnalysis,
  CodeChange,
  ImpactLevel,
  ChangeRisk,
  ChangeRecommendation,
} from "../types/index.js";
import { SymbolGraph, SymbolNode } from "../types/index.js";

export class ChangeImpactAnalyzer {
  /**
   * Analyze impact of a proposed code change
   */
  async analyzeChangeImpact(
    symbolGraph: SymbolGraph,
    change: CodeChange,
  ): Promise<ChangeImpactAnalysis> {
    console.log(
      `🔍 Analyzing impact of ${change.type} change to ${change.targetSymbol}...`,
    );

    const targetSymbol = symbolGraph.symbols.get(change.targetSymbol);
    if (!targetSymbol) {
      throw new Error(`Symbol ${change.targetSymbol} not found in graph`);
    }

    // Analyze direct impacts
    const directImpacts = await this.analyzeDirectImpacts(
      targetSymbol,
      symbolGraph,
      change,
    );

    // Analyze indirect impacts (ripple effects)
    const indirectImpacts = await this.analyzeIndirectImpacts(
      targetSymbol,
      symbolGraph,
      change,
    );

    // Calculate overall risk
    const risk = this.calculateChangeRisk(
      change,
      directImpacts,
      indirectImpacts,
    );

    // Generate recommendations
    const recommendations = this.generateChangeRecommendations(
      change,
      directImpacts,
      indirectImpacts,
      risk,
    );

    const analysis: ChangeImpactAnalysis = {
      change,
      directImpacts,
      indirectImpacts,
      risk,
      recommendations,
      affectedSymbols: [...directImpacts, ...indirectImpacts],
      metadata: {
        totalImpacts: directImpacts.length + indirectImpacts.length,
        riskScore:
          risk.level === "high" ? 0.8 : risk.level === "medium" ? 0.5 : 0.2,
        safeToAutomate: risk.level === "low" && directImpacts.length < 5,
        estimatedEffort: this.estimateChangeEffort(
          directImpacts,
          indirectImpacts,
        ),
        analysisConfidence: this.calculateAnalysisConfidence(
          targetSymbol,
          symbolGraph,
        ),
      },
    };

    console.log(`🎯 Change impact analysis complete: ${risk.level} risk`);
    console.log(
      `📊 Found ${directImpacts.length} direct impacts, ${indirectImpacts.length} indirect impacts`,
    );

    return analysis;
  }

  /**
   * Analyze direct impacts (immediate callers/callees)
   */
  private async analyzeDirectImpacts(
    targetSymbol: SymbolNode,
    symbolGraph: SymbolGraph,
    change: CodeChange,
  ): Promise<string[]> {
    const directImpacts: string[] = [];

    // Find all symbols that directly depend on the target
    for (const edge of symbolGraph.edges) {
      if (edge.from === change.targetSymbol) {
        // Target calls this symbol - may be affected if target behavior changes
        if (this.isChangeTypeAffectingCaller(change.type)) {
          directImpacts.push(edge.to);
        }
      }

      if (edge.to === change.targetSymbol) {
        // This symbol calls target - definitely affected by changes
        directImpacts.push(edge.from);
      }
    }

    return [...new Set(directImpacts)]; // Remove duplicates
  }

  /**
   * Analyze indirect impacts (transitive effects)
   */
  private async analyzeIndirectImpacts(
    targetSymbol: SymbolNode,
    symbolGraph: SymbolGraph,
    change: CodeChange,
  ): Promise<string[]> {
    const indirectImpacts: string[] = [];
    const visited = new Set<string>();
    const directImpacts = await this.analyzeDirectImpacts(
      targetSymbol,
      symbolGraph,
      change,
    );

    // For each direct impact, find its dependencies (2-hop analysis)
    for (const directImpact of directImpacts) {
      if (visited.has(directImpact)) continue;
      visited.add(directImpact);

      // Find symbols that depend on the directly impacted symbol
      for (const edge of symbolGraph.edges) {
        if (edge.to === directImpact && edge.from !== change.targetSymbol) {
          indirectImpacts.push(edge.from);
        }
      }
    }

    return [...new Set(indirectImpacts)]; // Remove duplicates
  }

  /**
   * Calculate overall change risk
   */
  private calculateChangeRisk(
    change: CodeChange,
    directImpacts: string[],
    indirectImpacts: string[],
  ): ChangeRisk {
    let riskScore = 0;
    const factors: string[] = [];

    // Change type risk
    const changeRiskMap = {
      signature_change: 0.8,
      behavior_change: 0.6,
      modification: 0.4,
      addition: 0.2,
      deletion: 0.9,
    };

    const changeTypeRisk = changeRiskMap[change.type] || 0.5;
    riskScore += changeTypeRisk;
    factors.push(`Change type: ${change.type} (${changeTypeRisk})`);

    // Impact scope risk
    const totalImpacts = directImpacts.length + indirectImpacts.length;
    const impactRisk = Math.min(0.5, totalImpacts * 0.05);
    riskScore += impactRisk;
    factors.push(
      `Impact scope: ${totalImpacts} affected symbols (${impactRisk.toFixed(2)})`,
    );

    // Direct impact risk
    const directRisk = Math.min(0.3, directImpacts.length * 0.1);
    riskScore += directRisk;
    factors.push(
      `Direct impacts: ${directImpacts.length} (${directRisk.toFixed(2)})`,
    );

    // Determine risk level
    let level: ImpactLevel;
    if (riskScore >= 1.2) level = "high";
    else if (riskScore >= 0.7) level = "medium";
    else level = "low";

    return {
      level,
      score: Math.min(1.0, riskScore),
      factors,
      confidence: 0.8, // Base confidence for risk assessment
    };
  }

  /**
   * Generate change recommendations
   */
  private generateChangeRecommendations(
    change: CodeChange,
    directImpacts: string[],
    indirectImpacts: string[],
    risk: ChangeRisk,
  ): ChangeRecommendation[] {
    const recommendations: ChangeRecommendation[] = [];

    // Risk-based recommendations
    if (risk.level === "high") {
      recommendations.push({
        type: "caution",
        priority: "high",
        description: "High-risk change detected - proceed with extreme caution",
        action: "Consider breaking change into smaller, safer modifications",
        confidence: 0.9,
      });

      recommendations.push({
        type: "testing",
        priority: "high",
        description: "Comprehensive testing required before deployment",
        action: "Create extensive test coverage for all affected components",
        confidence: 0.95,
      });
    }

    if (risk.level === "medium") {
      recommendations.push({
        type: "review",
        priority: "medium",
        description: "Medium-risk change - peer review recommended",
        action: "Have senior developer review change impact analysis",
        confidence: 0.8,
      });
    }

    if (risk.level === "low" && directImpacts.length < 3) {
      recommendations.push({
        type: "automation",
        priority: "low",
        description: "Low-risk change suitable for automated processing",
        action: "Can proceed with automated refactoring tools",
        confidence: 0.85,
      });
    }

    // Impact-specific recommendations
    if (directImpacts.length > 10) {
      recommendations.push({
        type: "phasing",
        priority: "high",
        description: "Large impact scope - consider phased implementation",
        action: "Break change into multiple phases to reduce risk",
        confidence: 0.9,
      });
    }

    if (change.type === "signature_change") {
      recommendations.push({
        type: "compatibility",
        priority: "high",
        description:
          "Signature change detected - maintain backward compatibility",
        action: "Consider deprecation strategy or wrapper functions",
        confidence: 0.95,
      });
    }

    if (indirectImpacts.length > 5) {
      recommendations.push({
        type: "monitoring",
        priority: "medium",
        description: "Significant indirect impacts - monitor system behavior",
        action: "Set up monitoring for affected downstream components",
        confidence: 0.8,
      });
    }

    return recommendations;
  }

  /**
   * Check if change type affects callers
   */
  private isChangeTypeAffectingCaller(changeType: CodeChange["type"]): boolean {
    return ["signature_change", "behavior_change", "deletion"].includes(
      changeType,
    );
  }

  /**
   * Estimate effort required for change
   */
  private estimateChangeEffort(
    directImpacts: string[],
    indirectImpacts: string[],
  ): "low" | "medium" | "high" {
    const totalImpacts = directImpacts.length + indirectImpacts.length;

    if (totalImpacts <= 3) return "low";
    if (totalImpacts <= 10) return "medium";
    return "high";
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateAnalysisConfidence(
    targetSymbol: SymbolNode,
    symbolGraph: SymbolGraph,
  ): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence if target symbol has good smart naming
    // (Remove this if block entirely or replace with logic using symbol.name or id if needed)

    // Higher confidence if symbol graph is well-connected
    const symbolConnectivity = this.calculateSymbolConnectivity(
      targetSymbol,
      symbolGraph,
    );
    if (symbolConnectivity > 0.5) {
      confidence += 0.1;
    }

    // Lower confidence if symbol appears isolated
    if (symbolConnectivity < 0.2) {
      confidence -= 0.2;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Calculate how well-connected a symbol is in the graph
   */
  private calculateSymbolConnectivity(
    symbol: SymbolNode,
    symbolGraph: SymbolGraph,
  ): number {
    const symbolId = Array.from(symbolGraph.symbols.entries()).find(
      ([id, sym]) => sym === symbol,
    )?.[0];

    if (!symbolId) return 0;

    const connections = symbolGraph.edges.filter(
      (edge) => edge.from === symbolId || edge.to === symbolId,
    ).length;

    const maxPossibleConnections = symbolGraph.symbols.size - 1;
    return connections / Math.max(1, maxPossibleConnections);
  }

  /**
   * Batch analyze multiple changes
   */
  async analyzeBatchChanges(
    symbolGraph: SymbolGraph,
    changes: CodeChange[],
  ): Promise<ChangeImpactAnalysis[]> {
    const analyses: ChangeImpactAnalysis[] = [];

    for (const change of changes) {
      try {
        const analysis = await this.analyzeChangeImpact(symbolGraph, change);
        analyses.push(analysis);
      } catch (error) {
        console.warn(
          `Failed to analyze change to ${change.targetSymbol}:`,
          error,
        );
      }
    }

    return analyses;
  }

  /**
   * Find safe refactoring opportunities
   */
  async findSafeRefactoringOpportunities(
    symbolGraph: SymbolGraph,
  ): Promise<CodeChange[]> {
    const opportunities: CodeChange[] = [];

    // Look for symbols that can be safely modified
    for (const [symbolId, symbol] of symbolGraph.symbols) {
      // Find isolated or low-impact symbols
      const connectivity = this.calculateSymbolConnectivity(
        symbol,
        symbolGraph,
      );

      if (connectivity < 0.3) {
        opportunities.push({
          type: "modification",
          targetSymbol: symbolId,
          description: `Safe to improve naming/structure of ${symbol.name}`,
          rationale: "Low connectivity",
        });
      }
    }

    return opportunities;
  }
}
