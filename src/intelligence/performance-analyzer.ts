/**
 * PerformanceAnalyzer - AI-native performance bottleneck detection
 *
 * Detects performance issues and optimization opportunities
 */

import { SymbolGraph, SymbolNode } from "../types/index.js";

export class PerformanceAnalyzer {
  /**
   * Analyze performance characteristics of symbol graph
   */
  async analyzePerformance(symbolGraph: SymbolGraph): Promise<any> {
    console.log("⚡ Analyzing performance characteristics...");

    const issues = await this.detectPerformanceIssues(symbolGraph);
    const optimizations = await this.findOptimizationOpportunities(symbolGraph);

    const analysis = {
      issues,
      optimizations,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter((i: any) => i.severity === "high").length,
        optimizationPotential: optimizations.length,
        overallScore: this.calculateOverallScore(issues),
        recommendations: this.generateRecommendations(issues, optimizations),
      },
    };

    console.log(
      `⚡ Performance analysis complete! Found ${issues.length} issues, ${optimizations.length} optimization opportunities`,
    );
    return analysis;
  }

  /**
   * Detect performance issues
   */
  private async detectPerformanceIssues(
    symbolGraph: SymbolGraph,
  ): Promise<any[]> {
    const issues: any[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      const name = symbol.name.toLowerCase();

      // Detect O(n²) patterns
      if (
        /nested|double.*loop|find.*duplicate|compare.*all|sort.*bubble/i.test(
          name,
        )
      ) {
        issues.push({
          type: "algorithmic_complexity",
          severity: "high",
          symbolId,
          symbolName: symbol.name,
          description: `Potential O(n²) complexity in ${symbol.name}`,
          impact: "Performance degrades quadratically with input size",
          confidence: 0.7,
        });
      }

      // Detect inefficient string operations
      if (/build.*string|concat.*string|string.*loop/i.test(name)) {
        issues.push({
          type: "string_performance",
          severity: "medium",
          symbolId,
          symbolName: symbol.name,
          description: `Inefficient string operations in ${symbol.name}`,
          impact:
            "String concatenation in loops creates O(n²) memory allocation",
          confidence: 0.6,
        });
      }

      // Detect blocking operations
      if (
        /sync|blocking|wait|heavy.*computation/i.test(name) &&
        !/async|promise|await/i.test(name)
      ) {
        issues.push({
          type: "blocking_operation",
          severity: "high",
          symbolId,
          symbolName: symbol.name,
          description: `Potential blocking operation in ${symbol.name}`,
          impact: "Synchronous operations block the event loop",
          confidence: 0.6,
        });
      }
    }

    return issues;
  }

  /**
   * Find optimization opportunities
   */
  private async findOptimizationOpportunities(
    symbolGraph: SymbolGraph,
  ): Promise<any[]> {
    const opportunities: any[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      const name = symbol.name.toLowerCase();

      // Caching opportunities
      if (
        /get|fetch|load|retrieve|calculate/i.test(name) &&
        !/cache/i.test(name)
      ) {
        opportunities.push({
          type: "caching",
          symbolId,
          symbolName: symbol.name,
          description: `Add caching to ${symbol.name}`,
          expectedImprovement:
            "Reduce redundant computations and data fetching",
          effort: "medium",
          confidence: 0.6,
        });
      }

      // Memoization opportunities
      if (
        /recursive|calculate|compute|expensive/i.test(name) &&
        !/memo/i.test(name)
      ) {
        opportunities.push({
          type: "memoization",
          symbolId,
          symbolName: symbol.name,
          description: `Add memoization to ${symbol.name}`,
          expectedImprovement:
            "Cache function results to avoid redundant calculations",
          effort: "low",
          confidence: 0.7,
        });
      }
    }

    return opportunities;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(issues: any[]): number {
    const criticalIssues = issues.filter((i) => i.severity === "high").length;
    const mediumIssues = issues.filter((i) => i.severity === "medium").length;
    const lowIssues = issues.filter((i) => i.severity === "low").length;

    let score = 1.0;
    score -= criticalIssues * 0.3;
    score -= mediumIssues * 0.15;
    score -= lowIssues * 0.05;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    issues: any[],
    optimizations: any[],
  ): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter((i) => i.severity === "high");
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical performance issues first`,
      );
    }

    const easyOptimizations = optimizations.filter((o) => o.effort === "low");
    if (easyOptimizations.length > 0) {
      recommendations.push(
        `Implement ${easyOptimizations.length} low-effort optimizations for quick wins`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Performance looks good - monitor for regressions as codebase grows",
      );
    }

    return recommendations;
  }
}
