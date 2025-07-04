/**
 * Memory Analysis Tuning System
 *
 * Addresses the overly aggressive memory analysis that's showing
 * 0/100 health scores with many false positives.
 */

import { SymbolNode } from "../types/index.js";

export interface MemoryAnalysisTuning {
  enableJavaScriptOptimizations: boolean;
  dataLeakThreshold: number;
  recursionWarningThreshold: number;
  complexityPenaltyThreshold: number;
  ignorePatterns: string[];
}

export class MemoryAnalysisTuner {
  private defaultTuning: MemoryAnalysisTuning = {
    enableJavaScriptOptimizations: true,
    dataLeakThreshold: 0.7, // Raise from default 0.1
    recursionWarningThreshold: 0.8, // Raise from default 0.3
    complexityPenaltyThreshold: 30, // Raise from default 10
    ignorePatterns: [
      // Common JavaScript patterns that are safe
      "console.log",
      "console.error",
      "console.warn",
      "console.debug",
      "JSON.stringify",
      "JSON.parse",
      "Array.from",
      "Object.keys",
      "Object.values",
      "Object.entries",
      // Event handling patterns
      "addEventListener",
      "removeEventListener",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      // Promise patterns
      "Promise.all",
      "Promise.race",
      "Promise.resolve",
      "Promise.reject",
      // Common loop variables
      "for\\s*\\(\\s*let\\s+[ijk]\\s*=",
      "for\\s*\\(\\s*const\\s+[ijk]\\s*=",
      // Arrow function parameters in loops
      "\\.map\\s*\\(\\s*[a-z]\\s*=>",
      "\\.filter\\s*\\(\\s*[a-z]\\s*=>",
      "\\.reduce\\s*\\(\\s*[a-z]\\s*=>",
      // Single character variables in callbacks
      "\\([a-z]\\)\\s*=>\\s*[a-z]\\.",
    ],
  };

  /**
   * Tune memory analysis settings based on language and patterns
   */
  getTunedSettings(
    language: string,
    symbols: SymbolNode[],
  ): MemoryAnalysisTuning {
    if (language === "javascript" || language === "typescript") {
      return this.getJavaScriptTuning(symbols);
    }

    return this.defaultTuning;
  }

  /**
   * JavaScript-specific tuning
   */
  private getJavaScriptTuning(symbols: SymbolNode[]): MemoryAnalysisTuning {
    const tuning = { ...this.defaultTuning };

    // Analyze symbol patterns to adjust thresholds
    const hasReactPatterns = symbols.some(
      (s) =>
        s.name?.includes("use") ||
        s.name?.includes("Component") ||
        s.location.file.includes("jsx") ||
        s.location.file.includes("tsx"),
    );

    const hasTestPatterns = symbols.some(
      (s) =>
        s.location.file.includes("test") ||
        s.location.file.includes("spec") ||
        s.name?.includes("test") ||
        s.name?.includes("spec"),
    );

    // React applications have different memory patterns
    if (hasReactPatterns) {
      tuning.dataLeakThreshold = 0.8; // React components often have complex data flows
      tuning.ignorePatterns.push(
        "useState",
        "useEffect",
        "useContext",
        "useCallback",
        "useMemo",
        "useRef",
        "Component",
        "render",
      );
    }

    // Test files have different expectations
    if (hasTestPatterns) {
      tuning.dataLeakThreshold = 0.9; // Tests often have mock data
      tuning.recursionWarningThreshold = 0.9;
      tuning.ignorePatterns.push(
        "describe",
        "it",
        "test",
        "expect",
        "mock",
        "stub",
        "spy",
      );
    }

    return tuning;
  }

  /**
   * Check if a symbol should be ignored by memory analysis
   */
  shouldIgnoreSymbol(
    symbol: SymbolNode,
    tuning: MemoryAnalysisTuning,
  ): boolean {
    const symbolText = `${symbol.name || ""} ${symbol.location.file}`;

    return tuning.ignorePatterns.some((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(symbolText);
    });
  }

  /**
   * Adjust memory health score based on tuning
   */
  adjustMemoryHealthScore(
    rawScore: number,
    symbol: SymbolNode,
    tuning: MemoryAnalysisTuning,
  ): number {
    let adjustedScore = rawScore;

    // Boost score for common safe patterns
    if (this.isCommonSafePattern(symbol)) {
      adjustedScore = Math.min(100, adjustedScore + 30);
    }

    // Boost score for simple functions
    if (this.isSimpleFunction(symbol)) {
      adjustedScore = Math.min(100, adjustedScore + 20);
    }

    // Reduce penalty for JavaScript-specific patterns
    if (tuning.enableJavaScriptOptimizations) {
      if (this.isJavaScriptIdiomatic(symbol)) {
        adjustedScore = Math.min(100, adjustedScore + 15);
      }
    }

    return adjustedScore;
  }

  /**
   * Check if symbol represents a common safe pattern
   */
  private isCommonSafePattern(symbol: SymbolNode): boolean {
    const name = symbol.name?.toLowerCase() || "";
    const file = symbol.location.file.toLowerCase();

    // Getters and simple accessors
    if (
      name.startsWith("get") ||
      name.startsWith("is") ||
      name.startsWith("has")
    ) {
      return true;
    }

    // Utility functions
    if (file.includes("util") || file.includes("helper")) {
      return true;
    }

    // Configuration functions
    if (file.includes("config") || name.includes("config")) {
      return true;
    }

    return false;
  }

  /**
   * Check if symbol represents a simple function
   */
  private isSimpleFunction(symbol: SymbolNode): boolean {
    // Simple functions typically have:
    // - Few parameters (0-2)
    // - Few dependencies
    // - Short names

    const paramCount = symbol.metadata.parameters?.length || 0;
    const depCount = symbol.dependencies.length + symbol.dependents.length;
    const nameLength = symbol.name?.length || 0;

    return paramCount <= 2 && depCount <= 5 && nameLength <= 15;
  }

  /**
   * Check if symbol uses JavaScript idiomatic patterns
   */
  private isJavaScriptIdiomatic(symbol: SymbolNode): boolean {
    const name = symbol.name?.toLowerCase() || "";
    const file = symbol.location.file.toLowerCase();

    // Common JavaScript patterns
    const idiomaticPatterns = [
      "callback",
      "handler",
      "listener",
      "mapper",
      "filter",
      "reducer",
      "validator",
      "transformer",
      "parser",
      "formatter",
    ];

    return (
      idiomaticPatterns.some((pattern) => name.includes(pattern)) ||
      file.includes(".js") ||
      file.includes(".ts") ||
      file.includes(".jsx") ||
      file.includes(".tsx")
    );
  }

  /**
   * Get recommended memory analysis settings
   */
  getRecommendedSettings(codebaseAnalysis: {
    language: string;
    framework?: string;
    testFramework?: string;
    size: "small" | "medium" | "large";
  }): MemoryAnalysisTuning {
    const tuning = { ...this.defaultTuning };

    // Framework-specific adjustments
    if (codebaseAnalysis.framework === "react") {
      tuning.dataLeakThreshold = 0.8;
      tuning.recursionWarningThreshold = 0.85;
    }

    if (codebaseAnalysis.framework === "express") {
      tuning.dataLeakThreshold = 0.75;
      tuning.complexityPenaltyThreshold = 25;
    }

    // Size-based adjustments
    if (codebaseAnalysis.size === "large") {
      tuning.dataLeakThreshold = 0.8; // Be more lenient on large codebases
      tuning.complexityPenaltyThreshold = 35;
    }

    return tuning;
  }
}
