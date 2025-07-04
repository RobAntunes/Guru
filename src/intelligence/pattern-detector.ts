/**
 * PatternDetector - AI-native design pattern and anti-pattern detection
 *
 * Detects common design patterns and anti-patterns in code with confidence scoring
 * Built specifically for AI agent consumption and decision making
 */

import {
  DesignPattern,
  AntiPattern,
  PatternDetectionResult,
  PatternConfidence,
  PatternEvidence,
} from "../types/index.js";
import { SymbolGraph, SymbolNode } from "../types/index.js";

export class PatternDetector {
  /**
   * Detect all patterns (design patterns + anti-patterns) in symbol graph
   */
  async detectPatterns(
    symbolGraph: SymbolGraph,
  ): Promise<PatternDetectionResult> {
    console.log("🔍 Detecting design patterns and anti-patterns...");

    const designPatterns = await this.detectDesignPatterns(symbolGraph);
    const antiPatterns = await this.detectAntiPatterns(symbolGraph);

    const result: PatternDetectionResult = {
      designPatterns,
      antiPatterns,
      summary: {
        totalPatterns: designPatterns.length + antiPatterns.length,
        designPatternCount: designPatterns.length,
        antiPatternCount: antiPatterns.length,
        overallHealth: this.calculateCodeHealth(designPatterns, antiPatterns),
        recommendations: this.generateRecommendations(
          designPatterns,
          antiPatterns,
        ),
      },
    };

    console.log(
      `🎊 Pattern detection complete! Found ${designPatterns.length} patterns, ${antiPatterns.length} anti-patterns`,
    );
    return result;
  }

  /**
   * Detect design patterns
   */
  private async detectDesignPatterns(
    symbolGraph: SymbolGraph,
  ): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    // Singleton Pattern Detection
    patterns.push(...(await this.detectSingletonPattern(symbolGraph)));

    // Factory Pattern Detection
    patterns.push(...(await this.detectFactoryPattern(symbolGraph)));

    // Observer Pattern Detection
    patterns.push(...(await this.detectObserverPattern(symbolGraph)));

    // Strategy Pattern Detection
    patterns.push(...(await this.detectStrategyPattern(symbolGraph)));

    return patterns;
  }

  /**
   * Detect anti-patterns
   */
  private async detectAntiPatterns(
    symbolGraph: SymbolGraph,
  ): Promise<AntiPattern[]> {
    const antiPatterns: AntiPattern[] = [];

    // God Function Anti-Pattern
    antiPatterns.push(...(await this.detectGodFunction(symbolGraph)));

    // Callback Hell Anti-Pattern
    antiPatterns.push(...(await this.detectCallbackHell(symbolGraph)));

    // Spaghetti Code Anti-Pattern
    antiPatterns.push(...(await this.detectSpaghettiCode(symbolGraph)));

    // Magic Number Anti-Pattern
    antiPatterns.push(...(await this.detectMagicNumbers(symbolGraph)));

    return antiPatterns;
  }

  /**
   * Detect Singleton Pattern
   */
  private async detectSingletonPattern(
    symbolGraph: SymbolGraph,
  ): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "class") continue;

      const evidence: PatternEvidence[] = [];
      let confidence = 0;

      // Check for getInstance method
      const hasGetInstance = this.symbolHasMethod(
        symbol,
        symbolGraph,
        "getInstance",
      );
      if (hasGetInstance) {
        evidence.push({
          type: "method_name",
          description: "Has getInstance method",
          strength: 0.4,
        });
        confidence += 0.4;
      }

      // Check for private constructor
      const hasPrivateConstructor = this.symbolHasPrivateConstructor(
        symbol,
        symbolGraph,
      );
      if (hasPrivateConstructor) {
        evidence.push({
          type: "access_modifier",
          description: "Has private constructor",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      // Check for static instance
      const hasStaticInstance = this.symbolHasStaticInstance(
        symbol,
        symbolGraph,
      );
      if (hasStaticInstance) {
        evidence.push({
          type: "static_field",
          description: "Has static instance field",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      if (confidence >= 0.6) {
        patterns.push({
          type: "singleton",
          symbols: [symbolId],
          confidence,
          evidence,
          description: `Singleton pattern detected in ${symbol.name}`,
          implications: [
            "Single instance enforced globally",
            "Potential testing difficulties",
            "Global state management",
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect Factory Pattern
   */
  private async detectFactoryPattern(
    symbolGraph: SymbolGraph,
  ): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const evidence: PatternEvidence[] = [];
      let confidence = 0;

      const effectiveName = symbol.name;

      // Check naming patterns
      if (/create|make|build|factory|generate/i.test(effectiveName)) {
        evidence.push({
          type: "naming_convention",
          description: "Factory-like naming pattern",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      // Check for return type diversity (factory returns different types)
      const returnsMultipleTypes = this.symbolReturnsMultipleTypes(
        symbol,
        symbolGraph,
      );
      if (returnsMultipleTypes) {
        evidence.push({
          type: "return_pattern",
          description: "Returns different types based on input",
          strength: 0.4,
        });
        confidence += 0.4;
      }

      // Check for conditional creation logic
      const hasConditionalLogic = this.symbolHasConditionalCreation(
        symbol,
        symbolGraph,
      );
      if (hasConditionalLogic) {
        evidence.push({
          type: "control_flow",
          description: "Conditional object creation",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      if (confidence >= 0.6) {
        patterns.push({
          type: "factory",
          symbols: [symbolId],
          confidence,
          evidence,
          description: `Factory pattern detected in ${effectiveName}`,
          implications: [
            "Centralizes object creation logic",
            "Supports polymorphic instantiation",
            "Decouples creation from usage",
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect Observer Pattern
   */
  private async detectObserverPattern(
    symbolGraph: SymbolGraph,
  ): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "class" && symbol.type !== "object") continue;

      const evidence: PatternEvidence[] = [];
      let confidence = 0;

      // Check for event-related methods
      const hasEventMethods = this.symbolHasEventMethods(symbol, symbolGraph);
      if (hasEventMethods.subscribe || hasEventMethods.notify) {
        evidence.push({
          type: "method_pattern",
          description: "Has event subscription/notification methods",
          strength: 0.4,
        });
        confidence += 0.4;
      }

      // Check for listener management
      const hasListenerManagement = this.symbolHasListenerManagement(
        symbol,
        symbolGraph,
      );
      if (hasListenerManagement) {
        evidence.push({
          type: "data_structure",
          description: "Manages collection of listeners",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      // Check for event emission patterns
      const hasEventEmission = this.symbolHasEventEmission(symbol, symbolGraph);
      if (hasEventEmission) {
        evidence.push({
          type: "behavior_pattern",
          description: "Emits events to multiple listeners",
          strength: 0.3,
        });
        confidence += 0.3;
      }

      if (confidence >= 0.6) {
        patterns.push({
          type: "observer",
          symbols: [symbolId],
          confidence,
          evidence,
          description: `Observer pattern detected in ${symbol.name}`,
          implications: [
            "Loose coupling between subjects and observers",
            "Dynamic subscription/unsubscription",
            "Broadcast communication",
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect Strategy Pattern
   */
  private async detectStrategyPattern(
    symbolGraph: SymbolGraph,
  ): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "class") continue;

      const evidence: PatternEvidence[] = [];
      let confidence = 0;

      // Check for strategy-like naming
      const effectiveName = symbol.name;
      if (/strategy|algorithm|policy|handler/i.test(effectiveName)) {
        evidence.push({
          type: "naming_convention",
          description: "Strategy-like naming",
          strength: 0.2,
        });
        confidence += 0.2;
      }

      // Check for common interface/method
      const hasCommonInterface = this.symbolImplementsCommonInterface(
        symbol,
        symbolGraph,
      );
      if (hasCommonInterface) {
        evidence.push({
          type: "interface_pattern",
          description: "Implements common interface",
          strength: 0.4,
        });
        confidence += 0.4;
      }

      // Check for runtime strategy switching
      const hasRuntimeSwitching = this.symbolHasRuntimeSwitching(
        symbol,
        symbolGraph,
      );
      if (hasRuntimeSwitching) {
        evidence.push({
          type: "behavior_pattern",
          description: "Runtime strategy switching",
          strength: 0.4,
        });
        confidence += 0.4;
      }

      if (confidence >= 0.6) {
        patterns.push({
          type: "strategy",
          symbols: [symbolId],
          confidence,
          evidence,
          description: `Strategy pattern detected in ${effectiveName}`,
          implications: [
            "Encapsulates family of algorithms",
            "Runtime algorithm selection",
            "Easy to extend with new strategies",
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect God Function Anti-Pattern
   */
  private async detectGodFunction(
    symbolGraph: SymbolGraph,
  ): Promise<AntiPattern[]> {
    const antiPatterns: AntiPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const evidence: PatternEvidence[] = [];
      let severity = 0;

      // Check function length (lines of code)
      const lineCount = this.estimateLineCount(symbol);
      if (lineCount > 50) {
        evidence.push({
          type: "size_metric",
          description: `Function has ${lineCount} lines`,
          strength: 0.3,
        });
        severity += 0.3;
      }

      // Check cyclomatic complexity
      const complexity = this.estimateCyclomaticComplexity(symbol);
      if (complexity > 10) {
        evidence.push({
          type: "complexity_metric",
          description: `High cyclomatic complexity: ${complexity}`,
          strength: 0.4,
        });
        severity += 0.4;
      }

      // Check number of responsibilities
      const responsibilities = this.estimateResponsibilities(symbol);
      if (responsibilities > 3) {
        evidence.push({
          type: "responsibility_metric",
          description: `Multiple responsibilities: ${responsibilities}`,
          strength: 0.3,
        });
        severity += 0.3;
      }

      if (severity >= 0.6) {
        antiPatterns.push({
          type: "god_function",
          symbols: [symbolId],
          severity,
          evidence,
          description: `God function detected: ${symbol.name}`,
          problems: [
            "Single function doing too many things",
            "Difficult to understand and maintain",
            "Hard to test individual responsibilities",
          ],
          suggestions: [
            "Break into smaller, focused functions",
            "Extract common logic into utilities",
            "Apply Single Responsibility Principle",
          ],
        });
      }
    }

    return antiPatterns;
  }

  /**
   * Detect Callback Hell Anti-Pattern
   */
  private async detectCallbackHell(
    symbolGraph: SymbolGraph,
  ): Promise<AntiPattern[]> {
    const antiPatterns: AntiPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const evidence: PatternEvidence[] = [];
      let severity = 0;

      // Check for nested callback depth
      const callbackDepth = this.estimateCallbackDepth(symbol);
      if (callbackDepth > 3) {
        evidence.push({
          type: "nesting_depth",
          description: `Callback nesting depth: ${callbackDepth}`,
          strength: 0.5,
        });
        severity += 0.5;
      }

      // Check for error handling complexity
      const errorHandlingComplexity =
        this.estimateErrorHandlingComplexity(symbol);
      if (errorHandlingComplexity > 0.3) {
        evidence.push({
          type: "error_handling",
          description: "Complex error handling in callbacks",
          strength: 0.3,
        });
        severity += 0.3;
      }

      // Check for promise/async patterns (good) vs callback patterns (bad)
      const usesModernAsync = this.usesModernAsyncPatterns(symbol);
      if (!usesModernAsync && callbackDepth > 2) {
        evidence.push({
          type: "async_pattern",
          description: "Uses callbacks instead of promises/async",
          strength: 0.2,
        });
        severity += 0.2;
      }

      if (severity >= 0.6) {
        antiPatterns.push({
          type: "callback_hell",
          symbols: [symbolId],
          severity,
          evidence,
          description: `Callback hell detected in ${symbol.name}`,
          problems: [
            "Deeply nested callback structure",
            "Difficult error handling",
            "Poor readability and maintenance",
          ],
          suggestions: [
            "Convert to Promise-based approach",
            "Use async/await syntax",
            "Extract nested callbacks into named functions",
          ],
        });
      }
    }

    return antiPatterns;
  }

  /**
   * Detect Spaghetti Code Anti-Pattern
   */
  private async detectSpaghettiCode(
    symbolGraph: SymbolGraph,
  ): Promise<AntiPattern[]> {
    const antiPatterns: AntiPattern[] = [];

    // Analyze overall graph structure for spaghetti patterns
    const graphMetrics = this.analyzeGraphStructure(symbolGraph);

    if (
      graphMetrics.cyclomaticComplexity > 0.7 ||
      graphMetrics.coupling > 0.8
    ) {
      const evidence: PatternEvidence[] = [];
      let severity = 0;

      if (graphMetrics.cyclomaticComplexity > 0.7) {
        evidence.push({
          type: "graph_metric",
          description: `High graph complexity: ${graphMetrics.cyclomaticComplexity.toFixed(2)}`,
          strength: 0.4,
        });
        severity += 0.4;
      }

      if (graphMetrics.coupling > 0.8) {
        evidence.push({
          type: "coupling_metric",
          description: `High coupling: ${graphMetrics.coupling.toFixed(2)}`,
          strength: 0.3,
        });
        severity += 0.3;
      }

      if (graphMetrics.cohesion < 0.3) {
        evidence.push({
          type: "cohesion_metric",
          description: `Low cohesion: ${graphMetrics.cohesion.toFixed(2)}`,
          strength: 0.3,
        });
        severity += 0.3;
      }

      if (severity >= 0.6) {
        antiPatterns.push({
          type: "spaghetti_code",
          symbols: Array.from(symbolGraph.symbols.keys()).slice(0, 10), // Sample of affected symbols
          severity,
          evidence,
          description: "Spaghetti code pattern detected in codebase structure",
          problems: [
            "High coupling between components",
            "Poor separation of concerns",
            "Difficult to understand control flow",
          ],
          suggestions: [
            "Refactor to improve separation of concerns",
            "Reduce coupling between modules",
            "Introduce clear architectural layers",
          ],
        });
      }
    }

    return antiPatterns;
  }

  /**
   * Detect Magic Numbers Anti-Pattern
   */
  private async detectMagicNumbers(
    symbolGraph: SymbolGraph,
  ): Promise<AntiPattern[]> {
    const antiPatterns: AntiPattern[] = [];

    for (const [symbolId, symbol] of symbolGraph.symbols) {
      if (symbol.type !== "function" && symbol.type !== "method") continue;

      const evidence: PatternEvidence[] = [];
      let severity = 0;

      // Simple heuristic: look for numeric literals in function bodies
      // In a real implementation, this would parse the AST
      const hasMagicNumbers = this.detectMagicNumbersInSymbol(symbol);
      if (hasMagicNumbers.count > 2) {
        evidence.push({
          type: "literal_count",
          description: `${hasMagicNumbers.count} magic numbers found`,
          strength: 0.4,
        });
        severity += 0.4;
      }

      if (hasMagicNumbers.hasComplexCalculations) {
        evidence.push({
          type: "calculation_pattern",
          description: "Complex calculations with magic numbers",
          strength: 0.3,
        });
        severity += 0.3;
      }

      if (severity >= 0.6) {
        antiPatterns.push({
          type: "magic_numbers",
          symbols: [symbolId],
          severity,
          evidence,
          description: `Magic numbers detected in ${symbol.name}`,
          problems: [
            "Unexplained numeric literals",
            "Difficult to understand calculations",
            "Hard to maintain and modify",
          ],
          suggestions: [
            "Extract numbers into named constants",
            "Add comments explaining calculations",
            "Use configuration files for magic values",
          ],
        });
      }
    }

    return antiPatterns;
  }

  // Helper methods for pattern detection
  private symbolHasMethod(
    symbol: SymbolNode,
    graph: SymbolGraph,
    methodName: string,
  ): boolean {
    // Check if symbol has a method with given name
    // This would need to traverse the symbol's methods in a real implementation
    return symbol.name.toLowerCase().includes(methodName.toLowerCase());
  }

  private symbolHasPrivateConstructor(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Check for private constructor pattern
    return (
      symbol.name.toLowerCase().includes("private") ||
      symbol.name.toLowerCase().includes("constructor")
    );
  }

  private symbolHasStaticInstance(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Check for static instance field
    return (
      symbol.name.toLowerCase().includes("instance") ||
      symbol.name.toLowerCase().includes("static")
    );
  }

  private symbolReturnsMultipleTypes(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Analyze if function returns different types based on input
    const effectiveName = symbol.name;
    return /create|make|build|factory/i.test(effectiveName);
  }

  private symbolHasConditionalCreation(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Check for conditional object creation logic
    const effectiveName = symbol.name;
    return /switch|case|if|condition/i.test(effectiveName);
  }

  private symbolHasEventMethods(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): { subscribe: boolean; notify: boolean } {
    const name = symbol.name.toLowerCase();
    return {
      subscribe: /subscribe|listen|on|add.*listener/i.test(name),
      notify: /notify|emit|trigger|fire|publish/i.test(name),
    };
  }

  private symbolHasListenerManagement(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    const name = symbol.name.toLowerCase();
    return /listener|observer|subscriber|callback/i.test(name);
  }

  private symbolHasEventEmission(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    const name = symbol.name.toLowerCase();
    return /emit|fire|trigger|publish|broadcast/i.test(name);
  }

  private symbolImplementsCommonInterface(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Check if symbol implements a common interface pattern
    const name = symbol.name.toLowerCase();
    return /execute|process|handle|apply|run/i.test(name);
  }

  private symbolHasRuntimeSwitching(
    symbol: SymbolNode,
    graph: SymbolGraph,
  ): boolean {
    // Check for runtime strategy switching patterns
    const name = symbol.name.toLowerCase();
    return /switch|select|choose|strategy|algorithm/i.test(name);
  }

  private estimateLineCount(symbol: SymbolNode): number {
    // Estimate lines of code - simplified heuristic
    const location = symbol.location;
    if (location.endLine && location.startLine) {
      return location.endLine - location.startLine + 1;
    }
    return 10; // Default estimate
  }

  private estimateCyclomaticComplexity(symbol: SymbolNode): number {
    // Simplified cyclomatic complexity estimation
    const name = symbol.name.toLowerCase();
    let complexity = 1;

    // Estimate based on naming patterns and function characteristics
    if (/complex|process|handle|manage|control/i.test(name)) complexity += 3;
    if (/if|switch|case|for|while|loop/i.test(name)) complexity += 2;
    if (/everything|all|total|complete/i.test(name)) complexity += 4;

    return complexity;
  }

  private estimateResponsibilities(symbol: SymbolNode): number {
    // Estimate number of responsibilities based on naming and context
    const name = symbol.name.toLowerCase();
    let responsibilities = 1;

    if (/and|plus|also|additionally/i.test(name)) responsibilities += 1;
    if (/everything|all|complete|total/i.test(name)) responsibilities += 2;
    if (/process.*and|handle.*and|manage.*and/i.test(name))
      responsibilities += 1;

    return responsibilities;
  }

  private estimateCallbackDepth(symbol: SymbolNode): number {
    // Estimate callback nesting depth
    const name = symbol.name.toLowerCase();
    if (/callback|nested|deep|hell/i.test(name)) return 4;
    if (/async|promise|then/i.test(name)) return 1;
    return 2;
  }

  private estimateErrorHandlingComplexity(symbol: SymbolNode): number {
    // Estimate error handling complexity
    const name = symbol.name.toLowerCase();
    if (/error|catch|handle.*error|try/i.test(name)) return 0.5;
    return 0.1;
  }

  private usesModernAsyncPatterns(symbol: SymbolNode): boolean {
    // Check if uses modern async patterns
    const name = symbol.name.toLowerCase();
    return /async|await|promise|then/i.test(name);
  }

  private analyzeGraphStructure(graph: SymbolGraph): {
    cyclomaticComplexity: number;
    coupling: number;
    cohesion: number;
  } {
    const totalSymbols = graph.symbols.size;
    const totalEdges = graph.edges.length;

    // Simplified metrics
    const cyclomaticComplexity = totalEdges / Math.max(totalSymbols, 1);
    const coupling = Math.min(1.0, totalEdges / (totalSymbols * 2));
    const cohesion = Math.max(0.1, 1 - coupling);

    return { cyclomaticComplexity, coupling, cohesion };
  }

  private detectMagicNumbersInSymbol(symbol: SymbolNode): {
    count: number;
    hasComplexCalculations: boolean;
  } {
    // Simplified magic number detection
    const name = symbol.name.toLowerCase();

    let count = 0;
    if (/\d+/g.test(name)) count += 1;
    if (/calculate|compute|math|number/i.test(name)) count += 2;

    const hasComplexCalculations =
      /calculate|compute|algorithm|math|formula/i.test(name);

    return { count, hasComplexCalculations };
  }

  private calculateCodeHealth(
    designPatterns: DesignPattern[],
    antiPatterns: AntiPattern[],
  ): number {
    const patternBonus = designPatterns.length * 0.1;
    const antiPatternPenalty =
      antiPatterns.reduce((sum, ap) => sum + ap.severity, 0) * 0.2;

    return Math.max(0, Math.min(1, 0.7 + patternBonus - antiPatternPenalty));
  }

  private generateRecommendations(
    designPatterns: DesignPattern[],
    antiPatterns: AntiPattern[],
  ): string[] {
    const recommendations: string[] = [];

    if (antiPatterns.length > 3) {
      recommendations.push(
        "High number of anti-patterns detected - consider architectural refactoring",
      );
    }

    if (designPatterns.length === 0) {
      recommendations.push(
        "No design patterns detected - consider introducing proven patterns",
      );
    }

    const godFunctions = antiPatterns.filter(
      (ap) => ap.type === "god_function",
    );
    if (godFunctions.length > 0) {
      recommendations.push(
        "Break down large functions into smaller, focused units",
      );
    }

    const callbackHell = antiPatterns.filter(
      (ap) => ap.type === "callback_hell",
    );
    if (callbackHell.length > 0) {
      recommendations.push("Modernize async code with promises/async-await");
    }

    return recommendations;
  }
}
