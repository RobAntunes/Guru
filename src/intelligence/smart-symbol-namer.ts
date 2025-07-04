/**
 * SmartSymbolNamer - AI-native contextual symbol naming
 *
 * Provides confidence-scored semantic naming for anonymous functions
 * and enhances symbol identity resolution for AI agents.
 */

import {
  SymbolNode,
  SmartSymbol,
  SymbolContext,
  ConfidenceScore,
  NamingStrategy,
} from "../types/index.js";
import { SEMANTIC_PREFIXES } from "../types/smart-naming.js";
import { createHash } from "crypto";
import Parser from "tree-sitter";
import {
  SmartConfidenceCalibrator,
  Evidence,
  AnalysisContext,
  CalibratedConfidence,
} from "./enhanced-confidence-calibrator.js";

interface BehavioralPattern {
  type:
    | "property_extractor"
    | "comparator"
    | "predicate"
    | "transformer"
    | "accumulator"
    | "validator"
    | "mapper"
    | "event_handler"
    | "formatter"
    | "filter"
    | "reducer"
    | "selector"
    | "converter"
    | "checker"
    | "unknown";
  confidence: number;
  evidence: string[];
  extractedName?: string;
  operations: string[];
  intent?: string; // AI-friendly description
  usageContext?: string; // Where/how it's used
  dataFlow?: string; // Input -> Output description
  semanticCategory?: string; // High-level categorization
}

interface SemanticContext {
  methodName?: string;
  propertyAccess: string[];
  returnType: "boolean" | "number" | "string" | "object" | "array" | "unknown";
  operations: string[];
  parameterUsage: Map<string, string[]>;
}

interface AISemanticContext {
  intent: string; // "Filters array elements based on confidence threshold"
  purpose: string; // "Data validation in analysis pipeline"
  behavior: string; // "Takes item, returns boolean based on confidence > 0.7"
  category:
    | "data_processing"
    | "validation"
    | "transformation"
    | "event_handling"
    | "utility"
    | "business_logic";
  complexity: "simple" | "moderate" | "complex";
  dataTypes: string[]; // ["object", "boolean"]
  relationships: string[]; // ["used_by_filter", "called_in_loop"]
}

export class SmartSymbolNamer {
  private hashCache = new Map<string, string>();
  private behavioralPatterns = new Map<string, BehavioralPattern>();
  private confidenceCalibrator = new SmartConfidenceCalibrator();
  private symbolRegistry = new Map<string, SymbolNode>(); // For cross-validation

  /**
   * Enhance a symbol with smart naming and confidence scoring
   */
  enhanceSymbol(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
    allSymbols: Map<string, SymbolNode>,
  ): SmartSymbol {
    // Register symbol for cross-validation
    this.symbolRegistry.set(symbol.id, symbol);
    // For anonymous functions, prioritize behavioral analysis
    if (symbol.name === "anonymous") {
      const behavioralStrategy = this.generateBehavioralNamingStrategy(
        symbol,
        node,
        source,
      );
      if (behavioralStrategy && behavioralStrategy.confidence > 0.5) {
        // Generate enhanced confidence with calibration
        const evidence = this.generateEvidence(
          symbol,
          node,
          source,
          behavioralStrategy,
        );
        const analysisContext = this.buildAnalysisContext(
          symbol,
          node,
          source,
          behavioralStrategy,
        );
        const baseConfidence = this.calculateConfidenceScore(
          symbol,
          behavioralStrategy,
          node,
          source,
        );
        const calibratedConf = this.confidenceCalibrator.calibrateConfidence(
          baseConfidence.overall,
          evidence,
          analysisContext,
          symbol,
          node,
        );

        const enhancedSymbol: SmartSymbol = {
          id: this.generateSemanticId(
            symbol,
            node,
            source,
            behavioralStrategy.name,
          ),
          inferredName: behavioralStrategy.name,
          originalName: undefined,
          confidence: {
            overall: calibratedConf.calibrated,
            strategy: baseConfidence.strategy,
            context: calibratedConf.calibrated,
            evidence: [...baseConfidence.evidence, ...calibratedConf.reasoning],
            breakdown: calibratedConf.breakdown,
          },
          context: behavioralStrategy.context,
          calibration: calibratedConf,
        };
        return enhancedSymbol;
      }
    }

    // Fallback to existing strategy system
    const strategies = this.generateNamingStrategies(
      symbol,
      node,
      source,
      allSymbols,
    );
    const bestStrategy = this.selectBestStrategy(strategies);

    const enhancedSymbol: SmartSymbol = {
      id:
        symbol.name === "anonymous"
          ? this.generateSemanticId(symbol, node, source, bestStrategy.name)
          : symbol.id,
      inferredName: bestStrategy.name,
      originalName: symbol.name !== "anonymous" ? symbol.name : undefined,
      confidence: this.calculateConfidenceScore(
        symbol,
        bestStrategy,
        node,
        source,
      ),
      context: bestStrategy.context,
    };

    return enhancedSymbol;
  }

  /**
   * Generate multiple naming strategies for a symbol
   */
  private generateNamingStrategies(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
    allSymbols: Map<string, SymbolNode>,
  ): NamingStrategy[] {
    const strategies: NamingStrategy[] = [];

    // Strategy 1: Use original name if available
    if (symbol.name && symbol.name !== "anonymous") {
      strategies.push({
        name: this.applySemanticPrefix(symbol.name),
        confidence: 1.0,
        evidence: ["Original named symbol"],
        context: { originalName: symbol.name },
      });
    }

    // Strategy 2: Variable assignment context
    const assignmentContext = this.extractAssignmentContext(node, source);
    if (assignmentContext) {
      strategies.push({
        name: this.applySemanticPrefix(assignmentContext.name),
        confidence: 0.9,
        evidence: [`Variable assignment: ${assignmentContext.pattern}`],
        context: { assignmentVariable: assignmentContext.name },
      });
    }

    // Strategy 3: Object property context
    const propertyContext = this.extractPropertyContext(node, source);
    if (propertyContext) {
      strategies.push({
        name: `${propertyContext.object}_${this.applySemanticPrefix(propertyContext.property)}`,
        confidence: 0.8,
        evidence: [
          `Object property: ${propertyContext.object}.${propertyContext.property}`,
        ],
        context: { objectProperty: propertyContext.property },
      });
    }

    // Strategy 4: Callback parameter context
    const callbackContext = this.extractCallbackContext(node, source);
    if (callbackContext) {
      strategies.push({
        name: `${callbackContext.method}_${callbackContext.parameter}_callback`,
        confidence: 0.7,
        evidence: [`Callback parameter in ${callbackContext.method}`],
        context: { callbackParameter: callbackContext.parameter },
      });
    }

    // Strategy 5: Export context
    const exportContext = this.extractExportContext(node, source);
    if (exportContext) {
      strategies.push({
        name:
          exportContext.type === "default"
            ? "default_export"
            : exportContext.name,
        confidence: 0.8,
        evidence: [`${exportContext.type} export`],
        context: { exportType: exportContext.type },
      });
    }

    // Strategy 6: Class method context
    const methodContext = this.extractMethodContext(node, source);
    if (methodContext) {
      strategies.push({
        name: `${methodContext.className}_${this.applySemanticPrefix(methodContext.methodName)}`,
        confidence: 0.8,
        evidence: [
          `Class method: ${methodContext.className}.${methodContext.methodName}`,
        ],
        context: { parentClass: methodContext.className },
      });
    }

    // Strategy 7: Hash-based fallback for completely anonymous functions
    if (strategies.length === 0) {
      const hashId = this.generateHashId(node, source);
      strategies.push({
        name: `anon_func_${hashId}`,
        confidence: 0.3,
        evidence: ["Anonymous function with stable hash"],
        context: {},
      });
    }

    return strategies;
  }

  /**
   * Select the best naming strategy based on confidence and context
   */
  private selectBestStrategy(strategies: NamingStrategy[]): NamingStrategy {
    if (strategies.length === 0) {
      return {
        name: "unknown_symbol",
        confidence: 0.1,
        evidence: ["No naming strategy found"],
        context: {},
      };
    }

    // Sort by confidence, prefer higher confidence
    strategies.sort((a, b) => b.confidence - a.confidence);
    return strategies[0];
  }

  /**
   * Calculate comprehensive confidence score
   */
  private calculateConfidenceScore(
    symbol: SymbolNode,
    strategy: NamingStrategy,
    node: Parser.SyntaxNode,
    source: string,
  ): ConfidenceScore {
    const identity = this.calculateIdentityConfidence(symbol, strategy);
    const purpose = this.calculatePurposeConfidence(symbol, node, source);
    const relationships = this.calculateRelationshipConfidence(symbol);
    const impact = this.calculateImpactConfidence(symbol, node);

    const overall = (identity + purpose + relationships + impact) / 4;

    return {
      overall,
      strategy: strategy.confidence,
      context: overall,
      evidence: strategy.evidence,
    };
  }

  private calculateIdentityConfidence(
    symbol: SymbolNode,
    strategy: NamingStrategy,
  ): number {
    // Higher confidence for original names, lower for inferred
    if (symbol.name && symbol.name !== "anonymous") return 1.0;
    if (strategy.context?.assignmentVariable) return 0.9;
    if (strategy.context?.objectProperty) return 0.8;
    if (strategy.context?.callbackParameter) return 0.7;
    return 0.3; // Hash-based fallback
  }

  private calculatePurposeConfidence(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for functions with clear names
    if (symbol.name && this.hasSemanticNaming(symbol.name)) confidence += 0.3;

    // Higher confidence for functions with parameters indicating purpose
    if (symbol.metadata.parameters && symbol.metadata.parameters.length > 0)
      confidence += 0.1;

    // Higher confidence for functions with documentation
    if (symbol.metadata.docstring) confidence += 0.2;

    // Analyze function body for semantic clues
    const bodyAnalysis = this.analyzeFunctionBody(node, source);
    confidence += bodyAnalysis.semanticClues * 0.1;

    // Higher confidence for common patterns
    if (bodyAnalysis.hasAsyncAwait) confidence += 0.1;
    if (bodyAnalysis.hasErrorHandling) confidence += 0.1;
    if (bodyAnalysis.hasReturnValue) confidence += 0.05;

    // Lower confidence for complex functions
    const complexity = this.estimateComplexity(node, source);
    if (complexity > 15) confidence -= 0.3;
    else if (complexity > 10) confidence -= 0.2;
    else if (complexity > 5) confidence -= 0.1;

    // Higher confidence for small, focused functions
    if (complexity <= 3) confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateRelationshipConfidence(symbol: SymbolNode): number {
    // Higher confidence when we have clear dependency relationships
    const totalConnections =
      symbol.dependencies.length + symbol.dependents.length;
    if (totalConnections === 0) return 0.3; // Isolated symbols are harder to understand
    if (totalConnections < 3) return 0.6;
    if (totalConnections < 10) return 0.8;
    return 0.9; // Well-connected symbols are easier to understand
  }

  private calculateImpactConfidence(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
  ): number {
    // Higher confidence for symbols we can statically analyze
    let confidence = 0.5;

    // Functions are easier to analyze than variables
    if (symbol.type === "function") confidence += 0.2;

    // Simpler scopes are easier to analyze
    if (symbol.scope === "global") confidence += 0.1;
    if (symbol.scope === "local") confidence += 0.2;

    // Static symbols are easier than dynamic
    if (symbol.metadata.isStatic) confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  private identifyLimitations(
    symbol: SymbolNode,
    strategy: NamingStrategy,
    node: Parser.SyntaxNode,
  ): string[] {
    const limitations: string[] = [];

    if (strategy.confidence < 0.5) {
      limitations.push("Low confidence in symbol identity");
    }

    if (!symbol.name || symbol.name === "anonymous") {
      limitations.push("Symbol has no original name");
    }

    if (symbol.dependencies.length === 0 && symbol.dependents.length === 0) {
      limitations.push("Symbol appears isolated - relationships unclear");
    }

    if (this.estimateComplexity(node, node.text) > 15) {
      limitations.push("High complexity function - behavior may be unclear");
    }

    return limitations;
  }

  /**
   * Extract variable assignment context (const myFunc = () => {})
   */
  private extractAssignmentContext(
    node: Parser.SyntaxNode,
    source: string,
  ): { name: string; pattern: string } | null {
    let current = node.parent;

    while (current) {
      if (current.type === "variable_declarator") {
        const nameNode = current.childForFieldName("name");
        if (nameNode) {
          return {
            name: nameNode.text,
            pattern: current.text.substring(0, 50) + "...",
          };
        }
      }

      if (current.type === "assignment_expression") {
        const left = current.childForFieldName("left");
        if (left) {
          return {
            name: left.text,
            pattern: current.text.substring(0, 50) + "...",
          };
        }
      }

      current = current.parent;
    }

    return null;
  }

  /**
   * Extract object property context (obj.method = function() {})
   */
  private extractPropertyContext(
    node: Parser.SyntaxNode,
    source: string,
  ): { object: string; property: string } | null {
    let current = node.parent;

    while (current) {
      if (current.type === "assignment_expression") {
        const left = current.childForFieldName("left");
        if (left && left.type === "member_expression") {
          const object = left.childForFieldName("object");
          const property = left.childForFieldName("property");
          if (object && property) {
            return {
              object: object.text,
              property: property.text,
            };
          }
        }
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Extract callback parameter context (users.map(user => {}))
   */
  private extractCallbackContext(
    node: Parser.SyntaxNode,
    source: string,
  ): { method: string; parameter: string } | null {
    let current = node.parent;

    while (current) {
      if (current.type === "call_expression") {
        const callee = current.childForFieldName("function");
        if (callee && callee.type === "member_expression") {
          const method = callee.childForFieldName("property");
          if (method) {
            // Look for arrow function parameter
            const args = current.childForFieldName("arguments");
            if (args) {
              for (let i = 0; i < args.childCount; i++) {
                const arg = args.child(i);
                if (arg && arg.type === "arrow_function") {
                  const params = arg.childForFieldName("parameters");
                  if (params && params.childCount > 0) {
                    const firstParam = params.child(0);
                    if (firstParam && firstParam.type === "identifier") {
                      return {
                        method: method.text,
                        parameter: firstParam.text,
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Extract export context (export default function() {})
   */
  private extractExportContext(
    node: Parser.SyntaxNode,
    source: string,
  ): { type: "default" | "named"; name: string } | null {
    let current = node.parent;

    while (current) {
      if (current.type === "export_statement") {
        const defaultKeyword = current.children.find(
          (child) => child.text === "default",
        );
        if (defaultKeyword) {
          return { type: "default", name: "default_export" };
        }
        return { type: "named", name: "named_export" };
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Extract class method context (class MyClass { method() {} })
   */
  private extractMethodContext(
    node: Parser.SyntaxNode,
    source: string,
  ): { className: string; methodName: string } | null {
    let current = node.parent;

    while (current) {
      if (current.type === "method_definition") {
        const methodName = current.childForFieldName("name");
        if (methodName) {
          // Look for containing class
          let classNode = current.parent;
          while (classNode) {
            if (classNode.type === "class_declaration") {
              const className = classNode.childForFieldName("name");
              if (className) {
                return {
                  className: className.text,
                  methodName: methodName.text,
                };
              }
            }
            classNode = classNode.parent;
          }
        }
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Apply semantic prefixes based on naming patterns
   */
  private applySemanticPrefix(name: string): string {
    // Check if name matches any semantic patterns
    const lowerName = name.toLowerCase();
    for (const [category, prefixes] of Object.entries(SEMANTIC_PREFIXES)) {
      for (const prefix of prefixes) {
        if (lowerName.startsWith(prefix.toLowerCase())) {
          return `${category}_${name}`;
        }
      }
    }
    return name;
  }

  /**
   * Check if a name has semantic meaning
   */
  private hasSemanticNaming(name: string): boolean {
    // Avoid generic names
    const genericNames = [
      "func",
      "function",
      "method",
      "callback",
      "handler",
      "temp",
      "tmp",
      "test",
    ];
    if (genericNames.includes(name.toLowerCase())) return false;

    // Check for semantic patterns
    const lowerName = name.toLowerCase();
    for (const prefixes of Object.values(SEMANTIC_PREFIXES)) {
      for (const prefix of prefixes) {
        if (lowerName.startsWith(prefix.toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Analyze function body for semantic clues
   */
  private analyzeFunctionBody(
    node: Parser.SyntaxNode,
    source: string,
  ): {
    semanticClues: number;
    hasAsyncAwait: boolean;
    hasErrorHandling: boolean;
    hasReturnValue: boolean;
    patterns: string[];
  } {
    const text = node.text.toLowerCase();
    const patterns: string[] = [];
    let semanticClues = 0;

    // Check for async/await patterns
    const hasAsyncAwait = text.includes("await") || text.includes("async");
    if (hasAsyncAwait) {
      patterns.push("async");
      semanticClues += 1;
    }

    // Check for error handling
    const hasErrorHandling =
      text.includes("try") || text.includes("catch") || text.includes("throw");
    if (hasErrorHandling) {
      patterns.push("error-handling");
      semanticClues += 1;
    }

    // Check for return statements
    const hasReturnValue = text.includes("return") && !text.includes("return;");
    if (hasReturnValue) {
      patterns.push("return-value");
      semanticClues += 0.5;
    }

    // Check for API/HTTP patterns
    if (
      text.includes("fetch") ||
      text.includes("axios") ||
      text.includes("request")
    ) {
      patterns.push("api-call");
      semanticClues += 1;
    }

    // Check for DOM manipulation
    if (
      text.includes("document.") ||
      text.includes("element.") ||
      text.includes("queryselector")
    ) {
      patterns.push("dom-manipulation");
      semanticClues += 1;
    }

    // Check for event handling
    if (
      text.includes("addeventlistener") ||
      text.includes("onclick") ||
      text.includes("event")
    ) {
      patterns.push("event-handling");
      semanticClues += 1;
    }

    // Check for data transformation
    if (
      text.includes("map") ||
      text.includes("filter") ||
      text.includes("reduce") ||
      text.includes("transform")
    ) {
      patterns.push("data-transformation");
      semanticClues += 1;
    }

    // Check for validation patterns
    if (
      text.includes("validate") ||
      text.includes("check") ||
      text.includes("verify")
    ) {
      patterns.push("validation");
      semanticClues += 1;
    }

    // Check for logging/debugging
    if (
      text.includes("console.") ||
      text.includes("log") ||
      text.includes("debug")
    ) {
      patterns.push("logging");
      semanticClues += 0.5;
    }

    return {
      semanticClues,
      hasAsyncAwait,
      hasErrorHandling,
      hasReturnValue,
      patterns,
    };
  }
  private estimateComplexity(node: Parser.SyntaxNode, source: string): number {
    let complexity = 1; // Base complexity

    const text = node.text;

    // Count decision points
    complexity += (text.match(/\b(if|else|switch|case|while|for|do)\b/g) || [])
      .length;

    // Count function calls
    complexity += (text.match(/\w+\s*\(/g) || []).length * 0.1;

    // Count lines (rough metric)
    complexity += (text.split("\n").length - 1) * 0.05;

    return Math.round(complexity);
  }

  /**
   * Generate stable hash-based ID for anonymous functions
   */
  private generateStableId(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
  ): string {
    const key = `${symbol.location.file}:${symbol.location.startLine}:${node.text.substring(0, 100)}`;

    if (this.hashCache.has(key)) {
      return this.hashCache.get(key)!;
    }

    const hash = createHash("sha256").update(key).digest("hex").substring(0, 8);
    const stableId = `${symbol.location.file}:anon_${hash}:${symbol.location.startLine}`;

    this.hashCache.set(key, stableId);
    return stableId;
  }

  /**
   * Generate short hash for completely anonymous functions
   */
  private generateHashId(node: Parser.SyntaxNode, source: string): string {
    const content = node.text.substring(0, 200); // First 200 chars
    return createHash("sha256").update(content).digest("hex").substring(0, 8);
  }

  /**
   * Generate semantic naming strategy based on behavioral analysis
   */
  private generateBehavioralNamingStrategy(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
  ): NamingStrategy | null {
    const semanticContext = this.extractSemanticContext(node, source);
    const behavioralPattern = this.analyzeBehavioralPattern(
      node,
      source,
      semanticContext,
    );

    if (
      behavioralPattern.type === "unknown" ||
      behavioralPattern.confidence < 0.4
    ) {
      return null;
    }

    const semanticName = this.generateSemanticName(
      behavioralPattern,
      semanticContext,
    );
    const callContext = this.extractCallContext(node, source);

    return {
      name: semanticName,
      confidence: behavioralPattern.confidence,
      evidence: [
        `Behavioral pattern: ${behavioralPattern.type}`,
        ...behavioralPattern.evidence,
        ...(callContext ? [`Called in ${callContext} context`] : []),
      ],
      context: {
        behavioralType: behavioralPattern.type,
        extractedProperties: semanticContext.propertyAccess,
        operations: behavioralPattern.operations,
        callContext,
      },
    };
  }

  /**
   * Extract semantic context from function body and parameters
   */
  private extractSemanticContext(
    node: Parser.SyntaxNode,
    source: string,
  ): SemanticContext {
    const context: SemanticContext = {
      propertyAccess: [],
      returnType: "unknown",
      operations: [],
      parameterUsage: new Map(),
    };

    // Extract method name from call context
    const callExpression = this.findParentCallExpression(node);
    if (callExpression) {
      const method = this.extractMethodFromCall(callExpression, source);
      if (method) context.methodName = method;
    }

    // Analyze function body
    this.traverseNode(node, (child) => {
      switch (child.type) {
        case "member_expression":
          const property = this.extractPropertyName(child, source);
          if (property && !context.propertyAccess.includes(property)) {
            context.propertyAccess.push(property);
          }
          break;

        case "binary_expression":
          const operator = this.extractOperator(child, source);
          if (operator && !context.operations.includes(operator)) {
            context.operations.push(operator);
          }
          break;

        case "return_statement":
          context.returnType = this.inferReturnType(child, source);
          break;
      }
    });

    // Analyze parameter usage
    const params = this.extractParameters(node);
    params.forEach((param) => {
      const usage = this.analyzeParameterUsage(node, param, source);
      context.parameterUsage.set(param, usage);
    });

    return context;
  }

  /**
   * Analyze behavioral pattern of the function
   */
  private analyzeBehavioralPattern(
    node: Parser.SyntaxNode,
    source: string,
    context: SemanticContext,
  ): BehavioralPattern {
    const bodyText = node.text;
    const evidence: string[] = [];
    let confidence = 0;
    let type: BehavioralPattern["type"] = "unknown";
    let extractedName = "";

    // Enhanced pattern detection with AI-friendly context
    const patterns = this.detectAdvancedPatterns(bodyText);
    const semanticContext = this.generateSemanticContext(bodyText, patterns);

    // Array method specific patterns (higher priority)
    if (context.methodName === "filter" && context.returnType === "boolean") {
      type = "filter";
      extractedName = this.generateFilterName(bodyText);
      confidence = 0.9;
      evidence.push("Filter callback function");
    } else if (context.methodName === "map") {
      type = "mapper";
      extractedName = this.generateMapperName(bodyText);
      confidence = 0.85;
      evidence.push("Map transformation function");
    } else if (
      context.methodName === "reduce" &&
      this.hasAccumulatorPattern(node, source)
    ) {
      type = "reducer";
      extractedName = this.generateReducerName(bodyText);
      confidence = 0.9;
      evidence.push("Reduce accumulator function");
    }

    // Event handling patterns
    else if (
      patterns.get("dom_manipulation")! > 0.7 ||
      bodyText.includes("event") ||
      bodyText.includes("preventDefault")
    ) {
      type = "event_handler";
      extractedName = "handleEvent";
      confidence = 0.9;
      evidence.push("DOM event handler");
    }

    // Validation patterns
    else if (
      patterns.get("data_validation")! > 0.7 &&
      context.returnType === "boolean"
    ) {
      type = "validator";
      extractedName = this.generateValidatorName(bodyText);
      confidence = 0.85;
      evidence.push("Data validation function");
    }

    // Conversion patterns
    else if (patterns.get("type_conversion")! > 0.7) {
      type = "converter";
      extractedName = this.generateConverterName(bodyText);
      confidence = 0.8;
      evidence.push("Type conversion function");
    }

    // Formatting patterns
    else if (patterns.get("string_formatting")! > 0.6) {
      type = "formatter";
      extractedName = this.generateFormatterName(bodyText);
      confidence = 0.8;
      evidence.push("String formatting function");
    }

    // Property extractor pattern: e => e.property
    else if (
      context.propertyAccess.length === 1 &&
      context.operations.length === 0
    ) {
      type = "property_extractor";
      extractedName = context.propertyAccess[0];
      confidence = 0.85;
      evidence.push(`Extracts property '${extractedName}'`);
    }

    // Comparator pattern: (a, b) => a.prop - b.prop or similar
    else if (
      context.operations.includes("-") ||
      context.operations.includes("<") ||
      context.operations.includes(">")
    ) {
      if (context.propertyAccess.length > 0) {
        type = "comparator";
        extractedName = context.propertyAccess[0];
        confidence = 0.8;
        evidence.push(`Compares by '${extractedName}'`);
      } else {
        type = "comparator";
        extractedName = "value";
        confidence = 0.7;
        evidence.push("Performs comparison operation");
      }
    }

    // Predicate pattern: returns boolean, uses logical operators
    else if (
      context.returnType === "boolean" ||
      context.operations.includes("&&") ||
      context.operations.includes("||") ||
      context.operations.includes("===") ||
      context.operations.includes("!==")
    ) {
      type = "predicate";
      if (context.propertyAccess.length > 0) {
        extractedName = context.propertyAccess[0];
        confidence = 0.8;
        evidence.push(`Filters by '${extractedName}'`);
      } else {
        extractedName = "condition";
        confidence = 0.7;
        evidence.push("Boolean predicate function");
      }
    }

    // Accumulator pattern: (acc, curr) => acc + curr
    else if (
      context.operations.includes("+") &&
      this.hasAccumulatorPattern(node, source)
    ) {
      type = "accumulator";
      if (context.propertyAccess.length > 0) {
        extractedName = context.propertyAccess[0];
        confidence = 0.8;
        evidence.push(`Accumulates '${extractedName}'`);
      } else {
        extractedName = "sum";
        confidence = 0.75;
        evidence.push("Accumulation operation");
      }
    }

    // Transformer pattern: takes input, returns modified output
    else if (
      context.propertyAccess.length > 1 ||
      context.operations.length > 0
    ) {
      type = "transformer";
      extractedName = context.propertyAccess[0] || "item";
      confidence = 0.6;
      evidence.push("Transforms input data");
    }

    // Boost confidence based on context method
    if (context.methodName) {
      const methodBonus = this.getMethodContextBonus(context.methodName, type);
      confidence = Math.min(0.95, confidence + methodBonus);
      evidence.push(`Used in ${context.methodName}() context`);
    }

    // Add AI-friendly context information
    return {
      type,
      confidence,
      evidence,
      extractedName,
      operations: context.operations,
      intent: semanticContext.intent,
      usageContext: semanticContext.purpose,
      dataFlow: this.generateDataFlow(type, context),
      semanticCategory: this.mapTypeToCategory(type),
    };
  }

  /**
   * Generate semantic name based on behavioral pattern and context
   */
  private generateSemanticName(
    pattern: BehavioralPattern,
    context: SemanticContext,
  ): string {
    const baseName = pattern.extractedName || "item";
    const cleanName = this.cleanPropertyName(baseName);

    switch (pattern.type) {
      case "property_extractor":
        return (
          `get${this.capitalize(cleanName)}` ||
          `extract${this.capitalize(cleanName)}`
        );

      case "comparator":
        return (
          `compare${this.capitalize(cleanName)}` || `${cleanName}Comparator`
        );

      case "predicate":
        if (context.methodName === "filter") {
          return `is${this.capitalize(cleanName)}Valid` || `${cleanName}Filter`;
        }
        return `check${this.capitalize(cleanName)}` || `${cleanName}Predicate`;

      case "accumulator":
        return (
          `accumulate${this.capitalize(cleanName)}` ||
          `sum${this.capitalize(cleanName)}`
        );

      case "transformer":
        return (
          `transform${this.capitalize(cleanName)}` ||
          `process${this.capitalize(cleanName)}`
        );

      case "mapper":
        return `map${this.capitalize(cleanName)}` || `${cleanName}Mapper`;

      case "validator":
        return (
          `validate${this.capitalize(cleanName)}` || `${cleanName}Validator`
        );

      default:
        // Context-based fallback
        if (context.methodName) {
          return `${context.methodName}${this.capitalize(cleanName)}Callback`;
        }
        return `process${this.capitalize(cleanName)}`;
    }
  }

  /**
   * Generate semantic ID that's stable and meaningful
   */
  private generateSemanticId(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
    semanticName: string,
  ): string {
    const location = symbol.location;
    const fileRelative = location.file.split("/").pop() || "unknown";
    const contextHash = this.generateContextHash(node, source);

    // Create stable, semantic ID
    return `${fileRelative}:${semanticName}:${location.startLine}:${contextHash.slice(0, 8)}`;
  }

  /**
   * Generate context hash for stable identification
   */
  private generateContextHash(node: Parser.SyntaxNode, source: string): string {
    // Use function body + immediate context for hash
    const contextText = this.extractContextualText(node, source);
    return createHash("sha256").update(contextText).digest("hex");
  }

  /**
   * Extract contextual text for hashing (function body + parent context)
   */
  private extractContextualText(
    node: Parser.SyntaxNode,
    source: string,
  ): string {
    const functionText = node.text;
    const parentContext = node.parent?.text.slice(0, 100) || "";
    return `${functionText}:${parentContext}`;
  }

  /**
   * Find parent call expression to determine context
   */
  private findParentCallExpression(
    node: Parser.SyntaxNode,
  ): Parser.SyntaxNode | null {
    let current = node.parent;
    while (current) {
      if (current.type === "call_expression") {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Extract method name from call expression
   */
  private extractMethodFromCall(
    callNode: Parser.SyntaxNode,
    source: string,
  ): string | null {
    const callee = callNode.childForFieldName("function");
    if (callee && callee.type === "member_expression") {
      const property = callee.childForFieldName("property");
      return property?.text || null;
    }
    return null;
  }

  /**
   * Traverse AST node and call callback for each child
   */
  private traverseNode(
    node: Parser.SyntaxNode,
    callback: (node: Parser.SyntaxNode) => void,
  ): void {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.traverseNode(child, callback);
      }
    }
  }

  /**
   * Extract property name from member expression
   */
  private extractPropertyName(
    node: Parser.SyntaxNode,
    source: string,
  ): string | null {
    const property = node.childForFieldName("property");
    return property?.text || null;
  }

  /**
   * Extract operator from binary expression
   */
  private extractOperator(
    node: Parser.SyntaxNode,
    source: string,
  ): string | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (
        child &&
        [
          "+",
          "-",
          "*",
          "/",
          "===",
          "!==",
          "<",
          ">",
          "<=",
          ">=",
          "&&",
          "||",
        ].includes(child.text)
      ) {
        return child.text;
      }
    }
    return null;
  }

  /**
   * Infer return type from return statement
   */
  private inferReturnType(
    node: Parser.SyntaxNode,
    source: string,
  ): "boolean" | "number" | "string" | "object" | "array" | "unknown" {
    const returnValue = node.children.find((child) => child.type !== "return");
    if (!returnValue) return "unknown";

    const text = returnValue.text;

    // Boolean patterns
    if (
      text.includes("===") ||
      text.includes("!==") ||
      text.includes("&&") ||
      text.includes("||") ||
      text === "true" ||
      text === "false"
    ) {
      return "boolean";
    }

    // Number patterns
    if (
      /^\d+(\.\d+)?$/.test(text) ||
      text.includes("+") ||
      text.includes("-") ||
      text.includes("*") ||
      text.includes("/")
    ) {
      return "number";
    }

    // String patterns
    if (text.startsWith('"') || text.startsWith("'") || text.startsWith("`")) {
      return "string";
    }

    // Array patterns
    if (
      text.startsWith("[") ||
      text.includes(".map(") ||
      text.includes(".filter(")
    ) {
      return "array";
    }

    // Object patterns
    if (text.startsWith("{")) {
      return "object";
    }

    return "unknown";
  }

  /**
   * Analyze how a parameter is used within the function
   */
  private analyzeParameterUsage(
    node: Parser.SyntaxNode,
    paramName: string,
    source: string,
  ): string[] {
    const usage: string[] = [];

    this.traverseNode(node, (child) => {
      if (child.type === "identifier" && child.text === paramName) {
        const parent = child.parent;
        if (parent) {
          switch (parent.type) {
            case "member_expression":
              const property = parent.childForFieldName("property");
              if (property) usage.push(`accesses .${property.text}`);
              break;
            case "binary_expression":
              usage.push("used in comparison");
              break;
            case "call_expression":
              usage.push("called as function");
              break;
          }
        }
      }
    });

    return usage;
  }

  /**
   * Check if function has accumulator pattern (acc, curr) => acc + curr
   */
  private hasAccumulatorPattern(
    node: Parser.SyntaxNode,
    source: string,
  ): boolean {
    const params = this.extractParameters(node);
    if (params.length !== 2) return false;

    const [first, second] = params;
    const text = node.text;

    // Check if first parameter is used in accumulation pattern
    return (
      text.includes(`${first} +`) ||
      text.includes(`${first}.push`) ||
      text.includes(`${first}[`)
    );
  }

  /**
   * Get confidence bonus based on method context
   */
  private getMethodContextBonus(
    methodName: string,
    behaviorType: BehavioralPattern["type"],
  ): number {
    const contextBonus: Record<string, Record<string, number>> = {
      map: { transformer: 0.2, mapper: 0.3, property_extractor: 0.15 },
      filter: { predicate: 0.3, comparator: 0.15 },
      reduce: { accumulator: 0.3, transformer: 0.1 },
      sort: { comparator: 0.3 },
      find: { predicate: 0.25, comparator: 0.1 },
      every: { predicate: 0.3 },
      some: { predicate: 0.3 },
    };

    return contextBonus[methodName]?.[behaviorType] || 0;
  }

  /**
   * Extract call context for better naming
   */
  private extractCallContext(
    node: Parser.SyntaxNode,
    source: string,
  ): string | null {
    const callExpression = this.findParentCallExpression(node);
    if (!callExpression) return null;

    const method = this.extractMethodFromCall(callExpression, source);
    if (method) return method;

    // Check for assignment context
    let current = callExpression.parent;
    while (current) {
      if (current.type === "variable_declarator") {
        const name = current.childForFieldName("name");
        return name?.text || null;
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Clean and normalize property names
   */
  private cleanPropertyName(name: string): string {
    // Remove common prefixes/suffixes
    return (
      name
        .replace(/^(get|set|is|has|can|should|will)/, "")
        .replace(/(Value|Data|Info|Property)$/, "")
        .replace(/[^a-zA-Z0-9]/g, "") || "value"
    );
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Extract parameter names from function node
   */
  private extractParameters(node: Parser.SyntaxNode): string[] {
    const parameters: string[] = [];

    // Handle different function types
    const paramNode = node.childForFieldName("parameters");
    if (paramNode) {
      for (let i = 0; i < paramNode.childCount; i++) {
        const param = paramNode.child(i);
        if (param && param.type === "identifier") {
          parameters.push(param.text);
        } else if (param && param.type === "formal_parameters") {
          // Nested parameters
          for (let j = 0; j < param.childCount; j++) {
            const nestedParam = param.child(j);
            if (nestedParam && nestedParam.type === "identifier") {
              parameters.push(nestedParam.text);
            }
          }
        }
      }
    }

    return parameters;
  }

  // Enhanced AI-friendly pattern analysis helpers
  private detectAdvancedPatterns(bodyText: string): Map<string, number> {
    const patterns = new Map<string, number>();

    // Advanced pattern detection
    patterns.set(
      "async_pattern",
      /async|await|Promise/.test(bodyText) ? 0.9 : 0,
    );
    patterns.set(
      "error_handling",
      /try|catch|throw|Error/.test(bodyText) ? 0.8 : 0,
    );
    patterns.set(
      "data_validation",
      /\.length|\.test\(|\.includes\(|\.startsWith\(/.test(bodyText) ? 0.7 : 0,
    );
    patterns.set(
      "array_processing",
      /\.(map|filter|reduce|forEach|find|some|every)/.test(bodyText) ? 0.9 : 0,
    );
    patterns.set(
      "dom_manipulation",
      /document\.|\.querySelector|\.addEventListener/.test(bodyText) ? 0.8 : 0,
    );
    patterns.set(
      "type_conversion",
      /Number\(|String\(|Boolean\(|parseInt|parseFloat/.test(bodyText)
        ? 0.7
        : 0,
    );
    patterns.set(
      "string_formatting",
      /\.toString|\.toFixed|template literal|\$\{/.test(bodyText) ? 0.6 : 0,
    );

    return patterns;
  }

  private generateSemanticContext(
    bodyText: string,
    patterns: Map<string, number>,
  ): AISemanticContext {
    const intent = this.generateIntentDescription(bodyText, patterns);
    const category = this.categorizeFunction(patterns);
    const complexity = this.assessComplexity(bodyText);
    const dataTypes = this.inferDataTypes(bodyText);

    return {
      intent,
      purpose: `${category} function for ${intent.toLowerCase()}`,
      behavior: this.describeBehavior(bodyText),
      category,
      complexity,
      dataTypes,
      relationships: this.extractRelationships(bodyText),
    };
  }

  private generateIntentDescription(
    bodyText: string,
    patterns: Map<string, number>,
  ): string {
    if (patterns.get("array_processing")! > 0.5) {
      if (bodyText.includes(".filter")) return "Filters array elements";
      if (bodyText.includes(".map")) return "Transforms array elements";
      if (bodyText.includes(".reduce")) return "Aggregates array data";
      if (bodyText.includes(".find")) return "Finds specific array element";
    }

    if (patterns.get("data_validation")! > 0.5) {
      return "Validates input data";
    }

    if (patterns.get("type_conversion")! > 0.5) {
      return "Converts data types";
    }

    if (patterns.get("string_formatting")! > 0.5) {
      return "Formats string output";
    }

    if (bodyText.includes("return")) {
      if (/[<>]=?|===?|!==?/.test(bodyText)) return "Evaluates condition";
      if (/\w+\.\w+/.test(bodyText)) return "Extracts property value";
    }

    return "Performs operation";
  }

  private categorizeFunction(
    patterns: Map<string, number>,
  ): AISemanticContext["category"] {
    if (patterns.get("data_validation")! > 0.5) return "validation";
    if (patterns.get("array_processing")! > 0.5) return "data_processing";
    if (patterns.get("dom_manipulation")! > 0.5) return "event_handling";
    if (patterns.get("type_conversion")! > 0.5) return "transformation";
    return "utility";
  }

  private assessComplexity(bodyText: string): AISemanticContext["complexity"] {
    const lines = bodyText.split("\n").length;
    const cyclomaticComplexity = (
      bodyText.match(/if|else|for|while|switch|case|\?|\&\&|\|\|/g) || []
    ).length;

    if (lines < 5 && cyclomaticComplexity < 3) return "simple";
    if (lines < 15 && cyclomaticComplexity < 8) return "moderate";
    return "complex";
  }

  private inferDataTypes(bodyText: string): string[] {
    const types: string[] = [];

    if (/\.length|\.push|\.pop|\[/.test(bodyText)) types.push("array");
    if (/\.\w+|Object\./.test(bodyText)) types.push("object");
    if (/[+\-*/]|\d+/.test(bodyText)) types.push("number");
    if (/['"`]|\.toString|\.trim/.test(bodyText)) types.push("string");
    if (/true|false|!/.test(bodyText)) types.push("boolean");

    return types.length > 0 ? types : ["unknown"];
  }

  private extractRelationships(bodyText: string): string[] {
    const relationships: string[] = [];

    if (bodyText.includes(".map("))
      relationships.push("used_in_array_transformation");
    if (bodyText.includes(".filter("))
      relationships.push("used_in_array_filtering");
    if (bodyText.includes(".reduce("))
      relationships.push("used_in_aggregation");
    if (/\.then|\.catch|async/.test(bodyText))
      relationships.push("async_operation");
    if (/callback|handler/.test(bodyText)) relationships.push("event_callback");

    return relationships;
  }

  private describeBehavior(bodyText: string): string {
    if (bodyText.includes("=>")) {
      const match = bodyText.match(/(\w+)\s*=>\s*(.+)/);
      if (match) {
        return `Takes ${match[1]}, returns ${this.simplifyExpression(match[2])}`;
      }
    }
    return "Function behavior unclear";
  }

  private simplifyExpression(expr: string): string {
    if (expr.includes(".") && !expr.includes("(")) return "property value";
    if (/[<>]=?|===?|!==?/.test(expr)) return "boolean result";
    if (/[+\-*/]/.test(expr)) return "calculated value";
    return "processed result";
  }

  // Enhanced name generators for specific patterns
  private generateValidatorName(bodyText: string): string {
    if (bodyText.includes(".length")) return "checkLength";
    if (bodyText.includes(".includes")) return "checkIncludes";
    if (bodyText.includes(".startsWith")) return "checkPrefix";
    if (bodyText.includes(".test")) return "checkPattern";
    return "validate";
  }

  private generateFilterName(bodyText: string): string {
    if (bodyText.includes("confidence")) return "filterByConfidence";
    if (bodyText.includes("active")) return "filterActive";
    if (bodyText.includes("valid")) return "filterValid";
    if (bodyText.includes("type")) return "filterByType";
    return "filterItems";
  }

  private generateReducerName(bodyText: string): string {
    if (bodyText.includes("sum") || bodyText.includes("+")) return "sumValues";
    if (bodyText.includes("max")) return "findMax";
    if (bodyText.includes("min")) return "findMin";
    if (bodyText.includes("count")) return "countItems";
    return "aggregateData";
  }

  private generateFormatterName(bodyText: string): string {
    if (bodyText.includes("toFixed")) return "formatNumber";
    if (bodyText.includes("toLowerCase")) return "formatLowerCase";
    if (bodyText.includes("toUpperCase")) return "formatUpperCase";
    if (bodyText.includes("trim")) return "formatTrim";
    return "formatValue";
  }

  private generateConverterName(bodyText: string): string {
    if (bodyText.includes("Number(")) return "toNumber";
    if (bodyText.includes("String(")) return "toString";
    if (bodyText.includes("Boolean(")) return "toBoolean";
    if (bodyText.includes("parseInt")) return "parseInteger";
    return "convertValue";
  }

  private generateMapperName(bodyText: string): string {
    if (bodyText.includes(".name")) return "extractNames";
    if (bodyText.includes(".id")) return "extractIds";
    if (bodyText.includes(".value")) return "extractValues";
    if (bodyText.includes(".type")) return "extractTypes";
    return "mapItems";
  }

  private extractValidationCriteria(bodyText: string): string {
    if (bodyText.includes(".length")) return "length constraints";
    if (bodyText.includes("confidence")) return "confidence thresholds";
    if (bodyText.includes("type")) return "type requirements";
    return "validation rules";
  }

  private extractFilterCriteria(bodyText: string): string {
    if (bodyText.includes("confidence")) return "confidence level";
    if (bodyText.includes("active")) return "active status";
    if (bodyText.includes("type")) return "type matching";
    return "filter criteria";
  }

  private extractReduceTarget(bodyText: string): string {
    if (bodyText.includes("sum") || bodyText.includes("+")) return "sum";
    if (bodyText.includes("max")) return "maximum value";
    if (bodyText.includes("min")) return "minimum value";
    return "aggregated result";
  }

  private extractFormatMethods(bodyText: string): string {
    const methods = [];
    if (bodyText.includes("toFixed")) methods.push("decimal formatting");
    if (bodyText.includes("toLowerCase")) methods.push("lowercase conversion");
    if (bodyText.includes("trim")) methods.push("whitespace trimming");
    return methods.join(", ") || "formatting operations";
  }

  private extractConversionTarget(bodyText: string): string {
    if (bodyText.includes("Number(")) return "number";
    if (bodyText.includes("String(")) return "string";
    if (bodyText.includes("Boolean(")) return "boolean";
    return "converted type";
  }

  private extractMapTarget(bodyText: string): string {
    if (bodyText.includes(".name")) return "names";
    if (bodyText.includes(".id")) return "identifiers";
    if (bodyText.includes(".value")) return "values";
    return "mapped properties";
  }

  private extractCondition(bodyText: string): string {
    const match = bodyText.match(
      /(\w+(?:\.\w+)*)\s*([<>=!]+)\s*(\w+(?:\.\w+)*|\d+|['"`][^'"`]*['"`])/,
    );
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
    return "condition check";
  }

  private extractPropertyFromBody(bodyText: string): string {
    const match = bodyText.match(/\.(\w+)/);
    return match ? match[1] : "property";
  }

  private extractMathOps(bodyText: string): string {
    const ops = [];
    if (bodyText.includes("+")) ops.push("addition");
    if (bodyText.includes("-")) ops.push("subtraction");
    if (bodyText.includes("*")) ops.push("multiplication");
    if (bodyText.includes("/")) ops.push("division");
    return ops.join(", ") || "mathematical operations";
  }

  /**
   * Generate data flow description for AI understanding
   */
  private generateDataFlow(
    type: BehavioralPattern["type"],
    context: SemanticContext,
  ): string {
    switch (type) {
      case "filter":
        return "Array -> Filtered Array";
      case "mapper":
        return "Array<T> -> Array<U>";
      case "reducer":
        return "Array -> Single Value";
      case "property_extractor":
        return "Object -> Property Value";
      case "comparator":
        return "(A, B) -> Number";
      case "predicate":
        return "Input -> Boolean";
      case "validator":
        return "Input -> Boolean";
      case "converter":
        return "Input Type -> Output Type";
      case "formatter":
        return "Raw Data -> Formatted String";
      case "transformer":
        return "Input -> Transformed Output";
      case "accumulator":
        return "Previous + Current -> Next";
      case "event_handler":
        return "Event -> Side Effects";
      default:
        return "Input -> Output";
    }
  }

  /**
   * Map function type to semantic category for AI models
   */
  private mapTypeToCategory(type: BehavioralPattern["type"]): string {
    switch (type) {
      case "filter":
      case "mapper":
      case "reducer":
        return "data_processing";
      case "validator":
      case "predicate":
        return "validation";
      case "converter":
      case "transformer":
      case "formatter":
        return "transformation";
      case "event_handler":
        return "event_handling";
      case "property_extractor":
        return "access";
      case "comparator":
        return "comparison";
      case "accumulator":
        return "aggregation";
      default:
        return "utility";
    }
  }

  /**
   * Generate evidence for confidence calibration
   */
  private generateEvidence(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
    strategy?: NamingStrategy,
  ): Evidence[] {
    const evidence: Evidence[] = [];

    // Naming evidence
    if (symbol.name && symbol.name !== "anonymous") {
      evidence.push({
        type: "naming",
        content: `Function has explicit name: ${symbol.name}`,
        strength: this.hasSemanticNaming(symbol.name) ? 0.9 : 0.7,
        source: "symbol-name",
      });
    }

    // Behavioral evidence from function analysis
    const bodyAnalysis = this.analyzeFunctionBody(node, source);
    if (bodyAnalysis.patterns.length > 0) {
      evidence.push({
        type: "behavioral",
        content: `Detected patterns: ${bodyAnalysis.patterns.join(", ")}`,
        strength: Math.min(0.9, bodyAnalysis.patterns.length * 0.2 + 0.3),
        source: "function-body-analysis",
      });
    }

    // Structural evidence
    if (symbol.metadata.parameters && symbol.metadata.parameters.length > 0) {
      evidence.push({
        type: "structural",
        content: `Function has ${symbol.metadata.parameters.length} parameters`,
        strength: 0.6,
        source: "parameter-analysis",
      });
    }

    // Context evidence
    const callContext = this.extractCallContext(node, source);
    if (callContext) {
      evidence.push({
        type: "contextual",
        content: `Used in ${callContext} context`,
        strength: this.isWellKnownPattern(callContext) ? 0.8 : 0.6,
        source: "call-context",
      });
    }

    // Documentation evidence
    if (symbol.metadata.docstring) {
      evidence.push({
        type: "contextual",
        content: "Function has documentation",
        strength: 0.7,
        source: "documentation",
      });
    }

    // Strategy-specific evidence
    if (strategy) {
      evidence.push({
        type: "contextual",
        content: `Applied strategy: ${strategy.evidence.join(", ")}`,
        strength: strategy.confidence,
        source: "naming-strategy",
      });
    }

    return evidence;
  }

  /**
   * Build analysis context for confidence calibration
   */
  private buildAnalysisContext(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
    source: string,
    strategy?: NamingStrategy,
  ): AnalysisContext {
    const hasExplicitNaming = !!(
      symbol.name &&
      symbol.name !== "anonymous" &&
      symbol.name.length > 1
    );
    const isGenericName = this.isGenericName(symbol.name || "");
    const callPattern = this.extractCallContext(node, source);
    const consistencyScore = this.calculateConsistencyScore(symbol, node);

    return {
      hasExplicitNaming,
      consistencyScore,
      isGenericName,
      callPattern: callPattern || undefined,
      fileContext: symbol.location.file.split("/").pop(),
      usageFrequency: symbol.dependencies.length + symbol.dependents.length,
    };
  }

  /**
   * Check if name is generic
   */
  private isGenericName(name: string): boolean {
    const genericNames = [
      "func",
      "function",
      "method",
      "callback",
      "handler",
      "temp",
      "tmp",
      "test",
      "data",
      "item",
      "value",
      "obj",
      "result",
      "output",
      "input",
      "x",
      "y",
      "z",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "anonymous",
      "unknown",
      "default",
    ];
    return genericNames.includes(name.toLowerCase());
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(
    symbol: SymbolNode,
    node: Parser.SyntaxNode,
  ): number {
    let score = 0.5; // Base score

    // Parameter usage consistency
    if (symbol.metadata.parameters) {
      const bodyText = node.text;
      const usedParams = symbol.metadata.parameters.filter(
        (param) =>
          (bodyText.match(new RegExp(`\\b${param}\\b`, "g")) || []).length >= 2,
      );
      score += (usedParams.length / symbol.metadata.parameters.length) * 0.3;
    }

    // Return pattern consistency
    const returnStatements = (node.text.match(/return\s+/g) || []).length;
    if (returnStatements === 1) score += 0.2; // Single return path is consistent

    return Math.min(1.0, score);
  }

  /**
   * Check if pattern is well-known
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
}
