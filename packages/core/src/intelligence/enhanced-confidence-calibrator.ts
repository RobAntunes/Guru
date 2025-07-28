/**
 * Enhanced Confidence Calibration System
 * Addresses the low confidence scores we're seeing in test output
 */

import { SymbolNode, ConfidenceScore } from "../types/index.js";
import Parser from "tree-sitter";

export interface Evidence {
  type: "behavioral" | "naming" | "structural" | "contextual";
  content: string;
  strength: number; // 0.0 to 1.0
  source: string;
}

export interface AnalysisContext {
  hasExplicitNaming: boolean;
  consistencyScore: number;
  isGenericName: boolean;
  callPattern?: string;
  fileContext?: string;
  usageFrequency?: number;
}

export interface ConfidenceFactor {
  type:
    | "evidence_quality"
    | "evidence_quantity"
    | "context_clarity"
    | "pattern_strength"
    | "naming_clarity";
  impact: number; // -0.3 to +0.3
  reasoning: string;
}

export interface CalibratedConfidence {
  raw: number; // Original confidence
  calibrated: number; // Adjusted confidence
  factors: ConfidenceFactor[];
  reasoning: string[];
  breakdown: {
    base: number;
    evidenceBoost: number;
    contextBoost: number;
    qualityBoost: number;
    penalties: number;
  };
}

export class SmartConfidenceCalibrator {
  calibrateConfidence(
    baseConfidence: number,
    evidence: Evidence[],
    context: AnalysisContext,
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
  ): CalibratedConfidence {
    const factors: ConfidenceFactor[] = [];
    let evidenceBoost = 0;
    let contextBoost = 0;
    let qualityBoost = 0;
    let penalties = 0;

    // Factor 1: Evidence Quality Boost (up to +0.25)
    const highQualityEvidence = evidence.filter((e) => e.strength > 0.8);
    if (highQualityEvidence.length > 0) {
      const boost = Math.min(0.25, highQualityEvidence.length * 0.12);
      evidenceBoost += boost;
      factors.push({
        type: "evidence_quality",
        impact: boost,
        reasoning: `${highQualityEvidence.length} high-quality evidence pieces (>80% strength)`,
      });
    }

    // Factor 2: Evidence Diversity Boost (up to +0.2)
    const uniqueSources = new Set(evidence.map((e) => e.source)).size;
    const uniqueTypes = new Set(evidence.map((e) => e.type)).size;
    if (uniqueSources >= 3 && uniqueTypes >= 2) {
      const boost = 0.2;
      evidenceBoost += boost;
      factors.push({
        type: "evidence_quantity",
        impact: boost,
        reasoning: `Multiple evidence sources (${uniqueSources}) and types (${uniqueTypes}) increase reliability`,
      });
    } else if (uniqueSources >= 2) {
      const boost = 0.1;
      evidenceBoost += boost;
      factors.push({
        type: "evidence_quantity",
        impact: boost,
        reasoning: `${uniqueSources} evidence sources provide good coverage`,
      });
    }

    // Factor 3: Clear Naming Patterns (+0.25)
    if (context.hasExplicitNaming && !context.isGenericName) {
      const boost = 0.25;
      qualityBoost += boost;
      factors.push({
        type: "naming_clarity",
        impact: boost,
        reasoning: "Explicit, semantic naming pattern provides strong signal",
      });
    }

    // Factor 4: Context Consistency (+0.15)
    if (context.consistencyScore > 0.8) {
      const boost = 0.15;
      contextBoost += boost;
      factors.push({
        type: "context_clarity",
        impact: boost,
        reasoning: `High context consistency (${(context.consistencyScore * 100).toFixed(1)}%) reduces uncertainty`,
      });
    }

    // Factor 5: Strong Pattern Recognition (+0.2)
    const patternStrength = this.assessPatternStrength(symbol, node, evidence);
    if (patternStrength > 0.7) {
      const boost = 0.2;
      qualityBoost += boost;
      factors.push({
        type: "pattern_strength",
        impact: boost,
        reasoning: `Strong behavioral pattern detected (${(patternStrength * 100).toFixed(1)}%)`,
      });
    }

    // Factor 6: Call Pattern Boost (+0.15)
    if (context.callPattern && this.isWellKnownPattern(context.callPattern)) {
      const boost = 0.15;
      contextBoost += boost;
      factors.push({
        type: "context_clarity",
        impact: boost,
        reasoning: `Used in well-known pattern: ${context.callPattern}`,
      });
    }

    // Factor 7: Usage Frequency Boost (+0.1)
    if (context.usageFrequency && context.usageFrequency > 5) {
      const boost = 0.1;
      contextBoost += boost;
      factors.push({
        type: "pattern_strength",
        impact: boost,
        reasoning: `High usage frequency (${context.usageFrequency}) indicates importance`,
      });
    }

    // PENALTIES

    // Penalty 1: Generic Names (-0.2)
    if (context.isGenericName) {
      const penalty = -0.2;
      penalties += penalty;
      factors.push({
        type: "naming_clarity",
        impact: penalty,
        reasoning: "Generic name reduces confidence in inferred purpose",
      });
    }

    // Penalty 2: Single Character Variables (-0.25)
    if (
      symbol.name &&
      symbol.name.length === 1 &&
      !this.isAcceptableSingleChar(symbol.name)
    ) {
      const penalty = -0.25;
      penalties += penalty;
      factors.push({
        type: "naming_clarity",
        impact: penalty,
        reasoning:
          "Single character variable name provides minimal semantic information",
      });
    }

    // Penalty 3: Weak Evidence (-0.15)
    const weakEvidence = evidence.filter((e) => e.strength < 0.4);
    if (weakEvidence.length > evidence.length * 0.6) {
      const penalty = -0.15;
      penalties += penalty;
      factors.push({
        type: "evidence_quality",
        impact: penalty,
        reasoning: `${weakEvidence.length}/${evidence.length} evidence pieces have low strength`,
      });
    }

    // Penalty 4: High Complexity (-0.2)
    const complexity = this.estimateComplexity(node);
    if (complexity > 20) {
      const penalty = -0.2;
      penalties += penalty;
      factors.push({
        type: "pattern_strength",
        impact: penalty,
        reasoning: `High complexity (${complexity}) makes purpose harder to infer`,
      });
    }

    // Penalty 5: Isolated Symbol (-0.1)
    if (symbol.dependencies.length === 0 && symbol.dependents.length === 0) {
      const penalty = -0.1;
      penalties += penalty;
      factors.push({
        type: "context_clarity",
        impact: penalty,
        reasoning: "Symbol appears isolated - relationships unclear",
      });
    }

    // Calculate final calibrated confidence
    const totalAdjustment =
      evidenceBoost + contextBoost + qualityBoost + penalties;
    const calibrated = Math.max(
      0.05,
      Math.min(0.98, baseConfidence + totalAdjustment),
    );

    return {
      raw: baseConfidence,
      calibrated,
      factors,
      reasoning: factors.map((f) => f.reasoning),
      breakdown: {
        base: baseConfidence,
        evidenceBoost,
        contextBoost,
        qualityBoost,
        penalties,
      },
    };
  }

  /**
   * Enhanced purpose confidence booster
   */
  enhancePurposeConfidence(
    basePurpose: string,
    baseConfidence: number,
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    evidence: Evidence[],
  ): {
    purpose: string;
    confidence: number;
    boosters: string[];
    improvement: number;
    specificity: number;
  } {
    let confidenceBoost = 0;
    const boosters: string[] = [];

    // 1. Strong Semantic Signal (+0.2)
    if (this.hasStrongSemanticSignal(symbol.name || "")) {
      confidenceBoost += 0.2;
      boosters.push("Strong semantic signal in function name");
    }

    // 2. Parameter Type Consistency (+0.15)
    if (this.hasConsistentParameterTypes(symbol, node)) {
      confidenceBoost += 0.15;
      boosters.push("Consistent parameter patterns indicate clear purpose");
    }

    // 3. Return Value Analysis (+0.18)
    if (this.hasTypicalReturnPattern(symbol, node, basePurpose)) {
      confidenceBoost += 0.18;
      boosters.push("Return pattern matches inferred purpose");
    }

    // 4. Cross-reference Validation (+0.25)
    const similarFunctions = this.findSimilarFunctions(symbol, basePurpose);
    if (similarFunctions.length >= 2) {
      confidenceBoost += 0.25;
      boosters.push(
        `Cross-validated with ${similarFunctions.length} similar functions`,
      );
    }

    // 5. Documentation Alignment (+0.15)
    if (
      symbol.metadata.docstring &&
      this.docAlignsPurpose(symbol.metadata.docstring, basePurpose)
    ) {
      confidenceBoost += 0.15;
      boosters.push("Documentation aligns with inferred purpose");
    }

    // 6. Context Strength (+0.12)
    const contextStrength = this.assessContextStrength(symbol, node);
    if (contextStrength > 0.7) {
      confidenceBoost += 0.12;
      boosters.push("Strong contextual evidence supports purpose");
    }

    // 7. Pattern Specificity (+0.1)
    const specificity = this.calculatePurposeSpecificity(basePurpose);
    if (specificity > 0.8) {
      confidenceBoost += 0.1;
      boosters.push("Highly specific purpose reduces ambiguity");
    }

    const enhancedConfidence = Math.min(0.96, baseConfidence + confidenceBoost);

    return {
      purpose: basePurpose,
      confidence: enhancedConfidence,
      boosters,
      improvement: enhancedConfidence - baseConfidence,
      specificity,
    };
  }

  /**
   * Assess pattern strength from behavioral analysis
   */
  private assessPatternStrength(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    evidence: Evidence[],
  ): number {
    let strength = 0;

    // Check for multiple behavioral indicators
    const behavioralEvidence = evidence.filter((e) => e.type === "behavioral");
    if (behavioralEvidence.length >= 2) {
      strength += 0.3;
    }

    // Check for consistent naming patterns
    const namingEvidence = evidence.filter((e) => e.type === "naming");
    if (namingEvidence.some((e) => e.strength > 0.8)) {
      strength += 0.2;
    }

    // Check for structural patterns
    const structuralEvidence = evidence.filter((e) => e.type === "structural");
    if (structuralEvidence.length > 0) {
      strength += 0.2;
    }

    // Check for function body patterns
    const bodyText = node.text;
    if (this.hasConsistentBodyPatterns(bodyText)) {
      strength += 0.3;
    }

    return Math.min(1.0, strength);
  }

  /**
   * Check if call pattern is well-known
   */
  private isWellKnownPattern(pattern: string): boolean {
    const wellKnownPatterns = [
      "map",
      "filter",
      "reduce",
      "forEach",
      "find",
      "some",
      "every",
      "sort",
      "flatMap",
      "addEventListener",
      "setTimeout",
      "setInterval",
      "then",
      "catch",
      "finally",
      "Promise.all",
      "Promise.race",
    ];
    return wellKnownPatterns.includes(pattern);
  }

  /**
   * Check if single character is acceptable
   */
  private isAcceptableSingleChar(char: string): boolean {
    // Common acceptable single character variables
    const acceptable = ["i", "j", "k", "x", "y", "z", "n", "m"];
    return acceptable.includes(char.toLowerCase());
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(node: Parser.SyntaxNode): number {
    const text = node.text;
    let complexity = 1;

    // Decision points
    complexity +=
      (text.match(/\b(if|else|switch|case|while|for|do)\b/g) || []).length * 2;

    // Function calls
    complexity += (text.match(/\w+\s*\(/g) || []).length * 0.5;

    // Nested structures
    complexity += (text.match(/[{}\[\]]/g) || []).length * 0.1;

    // Lines of code
    complexity += text.split("\n").length * 0.1;

    return Math.round(complexity);
  }

  /**
   * Check for strong semantic signals
   */
  private hasStrongSemanticSignal(name: string): boolean {
    const strongPatterns = [
      /validate/i,
      /transform/i,
      /process/i,
      /handle/i,
      /create/i,
      /generate/i,
      /parse/i,
      /format/i,
      /calculate/i,
      /compute/i,
      /analyze/i,
      /extract/i,
      /filter/i,
      /mapper?/i,
      /reduce/i,
      /sort/i,
      /find/i,
      /search/i,
    ];
    return strongPatterns.some((pattern) => pattern.test(name));
  }

  /**
   * Check parameter type consistency
   */
  private hasConsistentParameterTypes(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
  ): boolean {
    if (
      !symbol.metadata.parameters ||
      symbol.metadata.parameters.length === 0
    ) {
      return false;
    }

    // Check if parameters follow common patterns
    const params = symbol.metadata.parameters;
    const bodyText = node.text;

    // Check if parameters are used consistently
    for (const param of params) {
      const paramUsage = (
        bodyText.match(new RegExp(`\\b${param}\\b`, "g")) || []
      ).length;
      if (paramUsage < 2) return false; // Parameter should be used at least twice
    }

    return true;
  }

  /**
   * Check return pattern consistency
   */
  private hasTypicalReturnPattern(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    purpose: string,
  ): boolean {
    const bodyText = node.text;

    // Validation functions should return boolean
    if (
      purpose.includes("valid") &&
      /return\s+(true|false|[^;]+===|[^;]+!==)/.test(bodyText)
    ) {
      return true;
    }

    // Transform functions should return modified data
    if (
      purpose.includes("transform") &&
      /return\s+\w+\.\w+|return\s+\{/.test(bodyText)
    ) {
      return true;
    }

    // Filter functions should return boolean
    if (
      purpose.includes("filter") &&
      /return\s+(true|false|[^;]+[<>=]=?)/.test(bodyText)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Find similar functions for cross-validation
   */
  private findSimilarFunctions(
    symbol: SymbolNode,
    purpose: string,
  ): SymbolNode[] {
    // This would need access to all symbols in the graph
    // For now, return empty array - implement when symbol graph is available
    return [];
  }

  /**
   * Check if documentation aligns with purpose
   */
  private docAlignsPurpose(docstring: string, purpose: string): boolean {
    const docLower = docstring.toLowerCase();
    const purposeLower = purpose.toLowerCase();

    // Extract key words from purpose
    const purposeWords = purposeLower
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Check if documentation contains purpose keywords
    return purposeWords.some((word) => docLower.includes(word));
  }

  /**
   * Assess context strength
   */
  private assessContextStrength(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
  ): number {
    let strength = 0;

    // File context
    if (symbol.location.file.includes("validation")) strength += 0.2;
    if (symbol.location.file.includes("transform")) strength += 0.2;
    if (symbol.location.file.includes("util")) strength += 0.1;

    // Function context
    const parentFunction = this.findParentFunction(node);
    if (parentFunction) strength += 0.2;

    // Call context
    const callContext = this.findCallContext(node);
    if (callContext) strength += 0.3;

    // Dependencies
    const deps = symbol.dependencies.length + symbol.dependents.length;
    if (deps > 0) strength += Math.min(0.3, deps * 0.05);

    return Math.min(1.0, strength);
  }

  /**
   * Calculate purpose specificity
   */
  private calculatePurposeSpecificity(purpose: string): number {
    // Generic purposes get low specificity
    const genericTerms = [
      "transforms",
      "processes",
      "handles",
      "performs",
      "operation",
    ];
    if (genericTerms.some((term) => purpose.toLowerCase().includes(term))) {
      return 0.3;
    }

    // Specific purposes get high specificity
    const specificTerms = [
      "validates",
      "extracts",
      "filters",
      "converts",
      "calculates",
      "formats",
    ];
    if (specificTerms.some((term) => purpose.toLowerCase().includes(term))) {
      return 0.9;
    }

    return 0.6; // Medium specificity
  }

  /**
   * Check for consistent body patterns
   */
  private hasConsistentBodyPatterns(bodyText: string): boolean {
    // Check for clear patterns
    const patterns = [
      /return\s+\w+\.\w+/, // Property access
      /return\s+[^;]+[<>=]=?/, // Comparison
      /return\s+\w+\([^)]*\)/, // Function call
      /return\s+\{[^}]+\}/, // Object construction
      /return\s+\[[^\]]*\]/, // Array construction
    ];

    return patterns.some((pattern) => pattern.test(bodyText));
  }

  /**
   * Find parent function (helper)
   */
  private findParentFunction(
    node: Parser.SyntaxNode,
  ): Parser.SyntaxNode | null {
    let current = node.parent;
    while (current) {
      if (
        current.type.includes("function") ||
        current.type.includes("method")
      ) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Find call context (helper)
   */
  private findCallContext(node: Parser.SyntaxNode): string | null {
    let current = node.parent;
    while (current) {
      if (current.type === "call_expression") {
        const callee = current.childForFieldName("function");
        if (callee && callee.type === "member_expression") {
          const property = callee.childForFieldName("property");
          return property?.text || null;
        }
      }
      current = current.parent;
    }
    return null;
  }
}
