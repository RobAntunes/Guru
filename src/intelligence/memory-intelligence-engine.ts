/**
 * MemoryIntelligenceEngine - AI-native memory analysis and leak detection
 *
 * Analyzes memory usage patterns, detects potential leaks,
 * and provides optimization recommendations
 */

import { SymbolGraph, SymbolNode } from "../types/index.js";

export class MemoryIntelligenceEngine {
  /**
   * Analyze memory characteristics of symbol graph
   */
  async analyzeMemory(symbolGraph: SymbolGraph): Promise<any> {
    console.log("🧠 Analyzing memory characteristics...");

    const leaks = await this.detectMemoryLeaks(symbolGraph);
    const optimizations = await this.findMemoryOptimizations(symbolGraph);
    const usage = await this.analyzeMemoryUsage(symbolGraph);

    const analysis = {
      leaks,
      optimizations,
      usage,
      summary: {
        totalLeaks: leaks.length,
        criticalLeaks: leaks.filter((l: any) => l.severity === "high").length,
        optimizationOpportunities: optimizations.length,
        memoryScore: this.calculateMemoryScore(leaks, optimizations),
        recommendations: this.generateMemoryRecommendations(
          leaks,
          optimizations,
        ),
      },
    };

    console.log(
      `🧠 Memory analysis complete! Found ${leaks.length} potential leaks, ${optimizations.length} optimization opportunities`,
    );
    return analysis;
  }

  /**
   * Detect potential memory leaks
   */
  private async detectMemoryLeaks(symbolGraph: SymbolGraph): Promise<any[]> {
    const leaks: any[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const name = symbol.name.toLowerCase();

      // Detect event listener leaks
      if (/add.*listener|on.*event|subscribe/i.test(name)) {
        const hasCleanup = this.hasEventCleanup(symbol, symbolGraph);
        if (!hasCleanup) {
          leaks.push({
            type: "event_listener_leak",
            severity: "medium",
            symbolId,
            symbolName: symbol.name,
            description: `Potential event listener leak in ${symbol.name}`,
            impact: "Event listeners may accumulate without cleanup",
            evidence: ["Adds event listeners without corresponding removal"],
            suggestions: [
              "Add removeEventListener calls",
              "Use AbortController for cleanup",
              "Implement cleanup in component unmount",
            ],
            confidence: 0.6,
          });
        }
      }

      // Detect closure leaks
      if (/create.*handler|setup.*callback|return.*function/i.test(name)) {
        leaks.push({
          type: "closure_leak",
          severity: "low",
          symbolId,
          symbolName: symbol.name,
          description: `Potential closure leak in ${symbol.name}`,
          impact: "Closures may retain references to large objects",
          evidence: ["Creates functions that may capture scope"],
          suggestions: [
            "Minimize closure scope",
            "Null out unused references",
            "Use WeakRef for large objects",
          ],
          confidence: 0.4,
        });
      }

      // Detect timer leaks
      if (/set.*interval|set.*timeout|timer/i.test(name)) {
        const hasTimerCleanup = this.hasTimerCleanup(symbol, symbolGraph);
        if (!hasTimerCleanup) {
          leaks.push({
            type: "timer_leak",
            severity: "high",
            symbolId,
            symbolName: symbol.name,
            description: `Potential timer leak in ${symbol.name}`,
            impact: "Timers continue running and prevent garbage collection",
            evidence: ["Creates timers without corresponding clear calls"],
            suggestions: [
              "Call clearInterval/clearTimeout",
              "Store timer IDs for cleanup",
              "Use cleanup patterns in frameworks",
            ],
            confidence: 0.8,
          });
        }
      }
    }

    return leaks;
  }

  /**
   * Find memory optimization opportunities
   */
  private async findMemoryOptimizations(
    symbolGraph: SymbolGraph,
  ): Promise<any[]> {
    const optimizations: any[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const name = symbol.name.toLowerCase();

      // Object pooling opportunities
      if (/create.*object|new.*instance|generate.*data/i.test(name)) {
        optimizations.push({
          type: "object_pooling",
          symbolId,
          symbolName: symbol.name,
          description: `Object pooling opportunity in ${symbol.name}`,
          expectedImprovement: "Reduce garbage collection pressure",
          effort: "medium",
          confidence: 0.5,
          implementation: [
            "Implement object pool for frequently created objects",
            "Reuse objects instead of creating new ones",
            "Add pool size limits and cleanup",
          ],
        });
      }

      // Lazy loading opportunities
      if (/load.*all|get.*everything|fetch.*complete/i.test(name)) {
        optimizations.push({
          type: "lazy_loading",
          symbolId,
          symbolName: symbol.name,
          description: `Lazy loading opportunity in ${symbol.name}`,
          expectedImprovement: "Load data only when needed",
          effort: "high",
          confidence: 0.6,
          implementation: [
            "Implement on-demand loading",
            "Use virtual scrolling for large lists",
            "Add progressive data fetching",
          ],
        });
      }

      // Memory cleanup opportunities
      if (/cache|store|keep.*reference/i.test(name)) {
        optimizations.push({
          type: "memory_cleanup",
          symbolId,
          symbolName: symbol.name,
          description: `Memory cleanup opportunity in ${symbol.name}`,
          expectedImprovement: "Prevent memory accumulation",
          effort: "low",
          confidence: 0.7,
          implementation: [
            "Add cache size limits",
            "Implement LRU eviction",
            "Use WeakMap for temporary references",
          ],
        });
      }
    }

    return optimizations;
  }

  /**
   * Analyze overall memory usage patterns
   */
  private async analyzeMemoryUsage(symbolGraph: SymbolGraph): Promise<any> {
    const patterns = {
      dataCreators: 0,
      eventHandlers: 0,
      cacheUsers: 0,
      memoryIntensive: 0,
    };

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      const name = symbol.name.toLowerCase();

      if (/create|generate|build|new/i.test(name)) patterns.dataCreators++;
      if (/handle|listen|on.*event/i.test(name)) patterns.eventHandlers++;
      if (/cache|store|save/i.test(name)) patterns.cacheUsers++;
      if (/large|heavy|massive|process.*all/i.test(name))
        patterns.memoryIntensive++;
    }

    return {
      patterns,
      riskFactors: this.calculateRiskFactors(patterns),
      recommendations: this.generateUsageRecommendations(patterns),
    };
  }

  /**
   * Check if symbol has event cleanup
   */
  private hasEventCleanup(
    symbol: SymbolNode,
    symbolGraph: SymbolGraph,
  ): boolean {
    // Simple heuristic: look for remove/cleanup patterns
    const name = symbol.name.toLowerCase();
    return /remove|cleanup|destroy|unmount|dispose/i.test(name);
  }

  /**
   * Check if symbol has timer cleanup
   */
  private hasTimerCleanup(
    symbol: SymbolNode,
    symbolGraph: SymbolGraph,
  ): boolean {
    // Simple heuristic: look for clear patterns
    const name = symbol.name.toLowerCase();
    return /clear|cleanup|cancel|stop/i.test(name);
  }

  /**
   * Calculate memory score
   */
  private calculateMemoryScore(leaks: any[], optimizations: any[]): number {
    const criticalLeaks = leaks.filter((l) => l.severity === "high").length;
    const mediumLeaks = leaks.filter((l) => l.severity === "medium").length;
    const lowLeaks = leaks.filter((l) => l.severity === "low").length;

    let score = 1.0;
    score -= criticalLeaks * 0.4;
    score -= mediumLeaks * 0.2;
    score -= lowLeaks * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate risk factors
   */
  private calculateRiskFactors(patterns: any): string[] {
    const risks: string[] = [];

    if (patterns.dataCreators > 10) {
      risks.push("High number of data creators - monitor object creation");
    }

    if (patterns.eventHandlers > 5) {
      risks.push("Many event handlers - ensure proper cleanup");
    }

    if (patterns.memoryIntensive > 3) {
      risks.push(
        "Memory-intensive operations detected - consider optimization",
      );
    }

    return risks;
  }

  /**
   * Generate memory recommendations
   */
  private generateMemoryRecommendations(
    leaks: any[],
    optimizations: any[],
  ): string[] {
    const recommendations: string[] = [];

    const criticalLeaks = leaks.filter((l) => l.severity === "high");
    if (criticalLeaks.length > 0) {
      recommendations.push(
        `Fix ${criticalLeaks.length} critical memory leaks immediately`,
      );
    }

    const timerLeaks = leaks.filter((l) => l.type === "timer_leak");
    if (timerLeaks.length > 0) {
      recommendations.push("Add proper timer cleanup to prevent leaks");
    }

    const poolingOps = optimizations.filter((o) => o.type === "object_pooling");
    if (poolingOps.length > 2) {
      recommendations.push(
        "Consider implementing object pooling for frequently created objects",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Memory usage looks good - continue monitoring growth",
      );
    }

    return recommendations;
  }

  /**
   * Generate usage recommendations
   */
  private generateUsageRecommendations(patterns: any): string[] {
    const recommendations: string[] = [];

    if (patterns.cacheUsers > 3) {
      recommendations.push(
        "Multiple caches detected - consider unified caching strategy",
      );
    }

    if (patterns.eventHandlers > patterns.dataCreators) {
      recommendations.push(
        "Event-heavy application - focus on listener cleanup",
      );
    }

    return recommendations;
  }
}
