/**
 * Type Analyzer - Deep TypeScript/JavaScript type analysis
 * Tracks type flow, inference, compatibility, and issues
 */

import ts from 'typescript';
import { Logger } from '../logging/logger.js';
import { SymbolGraph } from '../core/symbol-graph.js';
import { HarmonicEnricher } from '../harmonic-intelligence/core/harmonic-enricher.js';

/**
 * Type information
 */
export interface TypeInfo {
  id: string;
  name: string;
  kind: 'primitive' | 'object' | 'function' | 'union' | 'intersection' | 'generic' | 'unknown';
  flags: ts.TypeFlags;
  literal?: any;
  members?: Map<string, TypeInfo>;
  signatures?: TypeSignature[];
  typeParameters?: TypeInfo[];
  constraint?: TypeInfo;
  default?: TypeInfo;
  unionTypes?: TypeInfo[];
  intersectionTypes?: TypeInfo[];
  harmonicPattern?: string; // From harmonic analysis
}

/**
 * Function/method signature
 */
export interface TypeSignature {
  parameters: Array<{
    name: string;
    type: TypeInfo;
    optional: boolean;
    rest: boolean;
  }>;
  returnType: TypeInfo;
  typeParameters?: TypeInfo[];
}

/**
 * Type flow edge
 */
export interface TypeFlowEdge {
  from: string; // Symbol or location
  to: string;
  type: TypeInfo;
  operation: 'assign' | 'parameter' | 'return' | 'cast' | 'infer' | 'narrow' | 'widen';
  confidence: number;
}

/**
 * Type compatibility issue
 */
export interface TypeIssue {
  type: 'mismatch' | 'unsafe_cast' | 'implicit_any' | 'missing_type' | 'weak_type' | 'circular' | 'orphan';
  severity: 'error' | 'warning' | 'info';
  location: {
    file: string;
    line: number;
    column: number;
  };
  message: string;
  actualType?: TypeInfo;
  expectedType?: TypeInfo;
  suggestion?: string;
}

/**
 * Type analysis result
 */
export interface TypeAnalysis {
  types: Map<string, TypeInfo>;
  flows: TypeFlowEdge[];
  issues: TypeIssue[];
  inference: Map<string, TypeInfo>; // Inferred types
  metrics: {
    totalTypes: number;
    explicitTypes: number;
    inferredTypes: number;
    anyUsage: number;
    unknownUsage: number;
    genericUsage: number;
    complexityScore: number;
  };
}

/**
 * Type analyzer with symbol graph integration
 */
export class TypeAnalyzer {
  private logger = Logger.getInstance();
  private checker: ts.TypeChecker | null = null;
  private symbolGraph: SymbolGraph;
  private harmonicEnricher?: HarmonicEnricher;
  private types: Map<string, TypeInfo> = new Map();
  private flows: TypeFlowEdge[] = [];
  private typeIdCounter = 0;
  
  constructor(symbolGraph: SymbolGraph, harmonicEnricher?: HarmonicEnricher) {
    this.symbolGraph = symbolGraph;
    this.harmonicEnricher = harmonicEnricher;
  }
  
  /**
   * Analyze types in a TypeScript program
   */
  async analyzeProgram(program: ts.Program): Promise<TypeAnalysis> {
    this.logger.debug('Starting type analysis');
    
    this.checker = program.getTypeChecker();
    this.types.clear();
    this.flows = [];
    this.typeIdCounter = 0;
    
    const issues: TypeIssue[] = [];
    const inference = new Map<string, TypeInfo>();
    
    // Analyze each source file
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        await this.analyzeSourceFile(sourceFile);
      }
    }
    
    // Detect type issues
    issues.push(...this.detectTypeIssues());
    
    // Calculate metrics
    const metrics = this.calculateTypeMetrics();
    
    return {
      types: this.types,
      flows: this.flows,
      issues,
      inference,
      metrics
    };
  }
  
  /**
   * Analyze types in a source file
   */
  private async analyzeSourceFile(sourceFile: ts.SourceFile): Promise<void> {
    const visit = async (node: ts.Node): Promise<void> => {
      // Analyze based on node kind
      switch (node.kind) {
        case ts.SyntaxKind.VariableDeclaration:
          await this.analyzeVariableType(node as ts.VariableDeclaration, sourceFile);
          break;
          
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.ArrowFunction:
          await this.analyzeFunctionType(node as ts.FunctionLikeDeclaration, sourceFile);
          break;
          
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
          await this.analyzeClassOrInterfaceType(node as ts.ClassDeclaration | ts.InterfaceDeclaration, sourceFile);
          break;
          
        case ts.SyntaxKind.TypeAliasDeclaration:
          await this.analyzeTypeAlias(node as ts.TypeAliasDeclaration, sourceFile);
          break;
          
        case ts.SyntaxKind.CallExpression:
          await this.analyzeCallExpression(node as ts.CallExpression, sourceFile);
          break;
          
        case ts.SyntaxKind.BinaryExpression:
          await this.analyzeBinaryExpression(node as ts.BinaryExpression, sourceFile);
          break;
      }
      
      // Continue traversal
      for (const child of node.getChildren(sourceFile)) {
        await visit(child);
      }
    };
    
    await visit(sourceFile);
  }
  
  /**
   * Analyze variable type with symbol graph context
   */
  private async analyzeVariableType(node: ts.VariableDeclaration, sourceFile: ts.SourceFile): Promise<void> {
    if (!this.checker) return;
    
    const symbol = this.checker.getSymbolAtLocation(node.name);
    if (!symbol) return;
    
    const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    const typeInfo = await this.extractTypeInfo(type, node);
    
    // Get symbol graph context
    const symbolName = symbol.getName();
    const graphSymbol = this.symbolGraph.symbols.get(symbolName);
    
    if (graphSymbol) {
      // Enrich with harmonic data if available
      if (this.harmonicEnricher && graphSymbol.harmonicSignature) {
        const enrichment = await this.harmonicEnricher.enrichSymbol(graphSymbol);
        if (enrichment?.primaryPattern) {
          typeInfo.harmonicPattern = enrichment.primaryPattern;
        }
      }
      
      // Add symbol graph context
      this.enhanceTypeWithSymbolContext(typeInfo, graphSymbol);
    }
    
    this.types.set(symbolName, typeInfo);
    
    // Track type flow from initializer
    if (node.initializer) {
      const initType = this.checker.getTypeAtLocation(node.initializer);
      const initTypeInfo = await this.extractTypeInfo(initType, node.initializer);
      
      this.flows.push({
        from: this.getNodeLocation(node.initializer, sourceFile),
        to: symbolName,
        type: initTypeInfo,
        operation: 'assign',
        confidence: 1.0
      });
    }
  }
  
  /**
   * Analyze function type with full signature
   */
  private async analyzeFunctionType(node: ts.FunctionLikeDeclaration, sourceFile: ts.SourceFile): Promise<void> {
    if (!this.checker) return;
    
    const symbol = this.checker.getSymbolAtLocation(node.name || node);
    if (!symbol) return;
    
    const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    const typeInfo = await this.extractTypeInfo(type, node);
    
    // Extract detailed signature
    const signature = this.checker.getSignatureFromDeclaration(node);
    if (signature) {
      typeInfo.signatures = [await this.extractSignature(signature, node)];
    }
    
    const functionName = symbol.getName();
    
    // Get symbol graph context
    const graphSymbol = this.symbolGraph.symbols.get(functionName);
    if (graphSymbol) {
      this.enhanceTypeWithSymbolContext(typeInfo, graphSymbol);
      
      // Track parameter and return type flows
      if (node.parameters) {
        for (const param of node.parameters) {
          const paramSymbol = this.checker.getSymbolAtLocation(param.name);
          if (paramSymbol) {
            const paramType = this.checker.getTypeOfSymbolAtLocation(paramSymbol, param);
            const paramTypeInfo = await this.extractTypeInfo(paramType, param);
            
            this.flows.push({
              from: functionName,
              to: paramSymbol.getName(),
              type: paramTypeInfo,
              operation: 'parameter',
              confidence: 1.0
            });
          }
        }
      }
    }
    
    this.types.set(functionName, typeInfo);
  }
  
  /**
   * Analyze class or interface type
   */
  private async analyzeClassOrInterfaceType(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile
  ): Promise<void> {
    if (!this.checker) return;
    
    const symbol = this.checker.getSymbolAtLocation(node.name!);
    if (!symbol) return;
    
    const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    const typeInfo = await this.extractTypeInfo(type, node);
    
    // Extract members
    typeInfo.members = new Map();
    
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
        const memberSymbol = this.checker.getSymbolAtLocation(member.name!);
        if (memberSymbol) {
          const memberType = this.checker.getTypeOfSymbolAtLocation(memberSymbol, member);
          const memberTypeInfo = await this.extractTypeInfo(memberType, member);
          typeInfo.members.set(memberSymbol.getName(), memberTypeInfo);
        }
      }
    }
    
    const className = symbol.getName();
    
    // Get symbol graph context
    const graphSymbol = this.symbolGraph.symbols.get(className);
    if (graphSymbol) {
      this.enhanceTypeWithSymbolContext(typeInfo, graphSymbol);
      
      // Track inheritance/implementation flows
      if (ts.isClassDeclaration(node) && node.heritageClauses) {
        for (const clause of node.heritageClauses) {
          for (const type of clause.types) {
            const baseType = this.checker.getTypeAtLocation(type);
            const baseTypeInfo = await this.extractTypeInfo(baseType, type);
            
            this.flows.push({
              from: this.checker.typeToString(baseType),
              to: className,
              type: baseTypeInfo,
              operation: clause.token === ts.SyntaxKind.ExtendsKeyword ? 'inherit' : 'implement',
              confidence: 1.0
            });
          }
        }
      }
    }
    
    this.types.set(className, typeInfo);
  }
  
  /**
   * Analyze type alias
   */
  private async analyzeTypeAlias(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): Promise<void> {
    if (!this.checker) return;
    
    const symbol = this.checker.getSymbolAtLocation(node.name);
    if (!symbol) return;
    
    const type = this.checker.getTypeFromTypeNode(node.type);
    const typeInfo = await this.extractTypeInfo(type, node);
    
    const aliasName = symbol.getName();
    
    // Get symbol graph context
    const graphSymbol = this.symbolGraph.symbols.get(aliasName);
    if (graphSymbol) {
      this.enhanceTypeWithSymbolContext(typeInfo, graphSymbol);
    }
    
    this.types.set(aliasName, typeInfo);
  }
  
  /**
   * Analyze call expression for type flow
   */
  private async analyzeCallExpression(node: ts.CallExpression, sourceFile: ts.SourceFile): Promise<void> {
    if (!this.checker) return;
    
    const signature = this.checker.getResolvedSignature(node);
    if (!signature) return;
    
    const returnType = this.checker.getReturnTypeOfSignature(signature);
    const returnTypeInfo = await this.extractTypeInfo(returnType, node);
    
    // Track argument type flows
    for (let i = 0; i < node.arguments.length; i++) {
      const arg = node.arguments[i];
      const param = signature.parameters[i];
      
      if (param) {
        const argType = this.checker.getTypeAtLocation(arg);
        const argTypeInfo = await this.extractTypeInfo(argType, arg);
        
        this.flows.push({
          from: this.getNodeLocation(arg, sourceFile),
          to: param.getName(),
          type: argTypeInfo,
          operation: 'parameter',
          confidence: 0.9
        });
      }
    }
    
    // Track return type flow
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.name) {
      const targetSymbol = this.checker.getSymbolAtLocation(parent.name);
      if (targetSymbol) {
        this.flows.push({
          from: this.getNodeLocation(node, sourceFile),
          to: targetSymbol.getName(),
          type: returnTypeInfo,
          operation: 'return',
          confidence: 0.95
        });
      }
    }
  }
  
  /**
   * Analyze binary expression for type narrowing
   */
  private async analyzeBinaryExpression(node: ts.BinaryExpression, sourceFile: ts.SourceFile): Promise<void> {
    if (!this.checker) return;
    
    // Type narrowing in conditions
    if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
      
      if (ts.isIdentifier(node.left)) {
        const symbol = this.checker.getSymbolAtLocation(node.left);
        if (symbol) {
          const narrowedType = this.checker.getTypeAtLocation(node.left);
          const narrowedTypeInfo = await this.extractTypeInfo(narrowedType, node);
          
          this.flows.push({
            from: symbol.getName(),
            to: `${symbol.getName()}_narrowed`,
            type: narrowedTypeInfo,
            operation: 'narrow',
            confidence: 0.9
          });
        }
      }
    }
  }
  
  /**
   * Extract type information with harmonic enrichment
   */
  private async extractTypeInfo(type: ts.Type, node: ts.Node): Promise<TypeInfo> {
    const typeString = this.checker!.typeToString(type);
    const typeId = `type_${this.typeIdCounter++}`;
    
    const typeInfo: TypeInfo = {
      id: typeId,
      name: typeString,
      kind: this.getTypeKind(type),
      flags: type.flags
    };
    
    // Extract union types
    if (type.isUnion()) {
      typeInfo.unionTypes = [];
      for (const unionType of (type as ts.UnionType).types) {
        typeInfo.unionTypes.push(await this.extractTypeInfo(unionType, node));
      }
    }
    
    // Extract intersection types
    if (type.isIntersection()) {
      typeInfo.intersectionTypes = [];
      for (const intersectionType of (type as ts.IntersectionType).types) {
        typeInfo.intersectionTypes.push(await this.extractTypeInfo(intersectionType, node));
      }
    }
    
    // Extract literal value
    if (type.isLiteral()) {
      typeInfo.literal = (type as ts.LiteralType).value;
    }
    
    // Get harmonic pattern if available
    // TODO: Implement analyzeTypePattern in HarmonicEnricher
    // if (this.harmonicEnricher) {
    //   const pattern = await this.harmonicEnricher.analyzeTypePattern(typeString);
    //   if (pattern) {
    //     typeInfo.harmonicPattern = pattern;
    //   }
    // }
    
    return typeInfo;
  }
  
  /**
   * Extract function signature
   */
  private async extractSignature(signature: ts.Signature, node: ts.Node): Promise<TypeSignature> {
    const parameters = signature.getParameters().map(param => {
      const paramType = this.checker!.getTypeOfSymbolAtLocation(param, param.valueDeclaration!);
      const paramDecl = param.valueDeclaration as ts.ParameterDeclaration;
      
      return {
        name: param.getName(),
        type: this.extractTypeInfo(paramType, param.valueDeclaration!),
        optional: !!paramDecl.questionToken,
        rest: !!paramDecl.dotDotDotToken
      };
    });
    
    const returnType = signature.getReturnType();
    
    return {
      parameters: await Promise.all(parameters.map(async p => ({
        ...p,
        type: await p.type
      }))),
      returnType: await this.extractTypeInfo(returnType, node)
    };
  }
  
  /**
   * Enhance type with symbol graph context
   */
  private enhanceTypeWithSymbolContext(typeInfo: TypeInfo, graphSymbol: any): void {
    // Add complexity from symbol graph
    if (graphSymbol.complexity) {
      typeInfo.metadata = {
        ...typeInfo.metadata,
        complexity: graphSymbol.complexity,
        usage: graphSymbol.references?.length || 0
      };
    }
    
    // Add relationships
    if (graphSymbol.dependencies) {
      typeInfo.metadata = {
        ...typeInfo.metadata,
        dependencies: graphSymbol.dependencies
      };
    }
  }
  
  /**
   * Detect type issues
   */
  private detectTypeIssues(): TypeIssue[] {
    const issues: TypeIssue[] = [];
    
    // Check for implicit any
    for (const [name, type] of this.types) {
      if (type.flags & ts.TypeFlags.Any) {
        const graphSymbol = this.symbolGraph.symbols.get(name);
        if (graphSymbol?.location) {
          issues.push({
            type: 'implicit_any',
            severity: 'warning',
            location: graphSymbol.location,
            message: `Implicit any type for '${name}'`,
            actualType: type,
            suggestion: 'Add explicit type annotation'
          });
        }
      }
    }
    
    // Also check for parameters without type annotations
    for (const [funcName, funcType] of this.types) {
      if (funcType.signatures && funcType.signatures.length > 0) {
        for (const sig of funcType.signatures) {
          for (const param of sig.parameters) {
            if (param.type.flags & ts.TypeFlags.Any && !param.type.name.includes('any')) {
              // Find location from symbol graph
              const graphSymbol = this.symbolGraph.symbols.get(funcName);
              if (graphSymbol?.location) {
                issues.push({
                  type: 'implicit_any',
                  severity: 'warning',
                  location: graphSymbol.location,
                  message: `Parameter '${param.name}' has implicit any type in function '${funcName}'`,
                  actualType: param.type,
                  suggestion: `Add type annotation to parameter '${param.name}'`
                });
              }
            }
          }
        }
      }
    }
    
    // Check for type mismatches in flows
    for (const flow of this.flows) {
      if (flow.operation === 'assign' || flow.operation === 'parameter') {
        const targetType = this.types.get(flow.to);
        if (targetType && !this.isTypeCompatible(flow.type, targetType)) {
          issues.push({
            type: 'mismatch',
            severity: 'error',
            location: { file: '', line: 0, column: 0 }, // TODO: Get proper location
            message: `Type '${flow.type.name}' is not assignable to type '${targetType.name}'`,
            actualType: flow.type,
            expectedType: targetType
          });
        }
      }
    }
    
    // Check for circular type dependencies
    const circular = this.detectCircularTypes();
    for (const [typeA, typeB] of circular) {
      issues.push({
        type: 'circular',
        severity: 'warning',
        location: { file: '', line: 0, column: 0 }, // TODO: Get proper location
        message: `Circular type dependency between '${typeA}' and '${typeB}'`
      });
    }
    
    return issues;
  }
  
  /**
   * Check type compatibility
   */
  private isTypeCompatible(source: TypeInfo, target: TypeInfo): boolean {
    // Simple compatibility check
    if (source.name === target.name) return true;
    if (target.flags & ts.TypeFlags.Any) return true;
    if (source.flags & ts.TypeFlags.Any) return false;
    
    // Union type compatibility
    if (target.unionTypes) {
      return target.unionTypes.some(t => this.isTypeCompatible(source, t));
    }
    
    // TODO: Implement more sophisticated type compatibility checking
    
    return false;
  }
  
  /**
   * Detect circular type dependencies
   */
  private detectCircularTypes(): Array<[string, string]> {
    const circular: Array<[string, string]> = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (typeName: string): void => {
      visited.add(typeName);
      recursionStack.add(typeName);
      
      // Check flows from this type
      const outgoingFlows = this.flows.filter(f => f.from === typeName);
      
      for (const flow of outgoingFlows) {
        if (!visited.has(flow.to)) {
          dfs(flow.to);
        } else if (recursionStack.has(flow.to)) {
          circular.push([typeName, flow.to]);
        }
      }
      
      recursionStack.delete(typeName);
    };
    
    for (const typeName of this.types.keys()) {
      if (!visited.has(typeName)) {
        dfs(typeName);
      }
    }
    
    return circular;
  }
  
  /**
   * Calculate type metrics
   */
  private calculateTypeMetrics(): TypeAnalysis['metrics'] {
    let explicitTypes = 0;
    let inferredTypes = 0;
    let anyUsage = 0;
    let unknownUsage = 0;
    let genericUsage = 0;
    let complexityScore = 0;
    
    for (const type of this.types.values()) {
      if (type.flags & ts.TypeFlags.Any) anyUsage++;
      if (type.flags & ts.TypeFlags.Unknown) unknownUsage++;
      if (type.typeParameters) genericUsage++;
      
      // Calculate complexity based on type structure
      complexityScore += this.calculateTypeComplexity(type);
    }
    
    // Inferred types are those in flows without explicit declaration
    const declaredTypes = new Set(this.types.keys());
    for (const flow of this.flows) {
      if (!declaredTypes.has(flow.to)) {
        inferredTypes++;
      }
    }
    
    explicitTypes = this.types.size - inferredTypes;
    
    return {
      totalTypes: this.types.size,
      explicitTypes,
      inferredTypes,
      anyUsage,
      unknownUsage,
      genericUsage,
      complexityScore
    };
  }
  
  /**
   * Calculate type complexity
   */
  private calculateTypeComplexity(type: TypeInfo): number {
    let complexity = 1;
    
    // Union/intersection types add complexity
    if (type.unionTypes) complexity += type.unionTypes.length;
    if (type.intersectionTypes) complexity += type.intersectionTypes.length * 1.5;
    
    // Object types with many members
    if (type.members) complexity += type.members.size * 0.5;
    
    // Generic types
    if (type.typeParameters) complexity += type.typeParameters.length * 2;
    
    // Function signatures
    if (type.signatures) {
      for (const sig of type.signatures) {
        complexity += sig.parameters.length * 0.5;
      }
    }
    
    return complexity;
  }
  
  /**
   * Get type kind
   */
  private getTypeKind(type: ts.Type): TypeInfo['kind'] {
    if (type.flags & ts.TypeFlags.NumberLike || 
        type.flags & ts.TypeFlags.StringLike ||
        type.flags & ts.TypeFlags.BooleanLike) {
      return 'primitive';
    }
    
    if (type.flags & ts.TypeFlags.Object) {
      if (type.getCallSignatures().length > 0) {
        return 'function';
      }
      return 'object';
    }
    
    if (type.isUnion()) return 'union';
    if (type.isIntersection()) return 'intersection';
    if (type.flags & ts.TypeFlags.TypeParameter) return 'generic';
    
    return 'unknown';
  }
  
  /**
   * Get node location
   */
  private getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile): string {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
  }
}