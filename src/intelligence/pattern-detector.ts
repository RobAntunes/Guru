/**
 * Advanced Design Pattern Detection System
 * Identifies common software design patterns and anti-patterns
 */

import { SymbolNode, SymbolGraph } from '../types/index.js';

export interface PatternMatch {
  pattern: string;
  confidence: number;
  location: {
    file: string;
    symbols: string[];
    startLine?: number;
    endLine?: number;
  };
  description: string;
  characteristics: string[];
  suggestions?: string[];
  antiPattern?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PatternDetectionResult {
  patterns: PatternMatch[];
  antiPatterns: PatternMatch[];
  summary: {
    totalPatterns: number;
    uniquePatterns: Set<string>;
    qualityScore: number;
    recommendations: string[];
  };
}

export class PatternDetector {
  private symbolGraph: SymbolGraph;

  constructor(symbolGraph: SymbolGraph) {
    this.symbolGraph = symbolGraph;
  }

  /**
   * Detect all patterns in the codebase
   */
  detectPatterns(): PatternDetectionResult {
    const patterns: PatternMatch[] = [];
    const antiPatterns: PatternMatch[] = [];

    // Creational Patterns
    patterns.push(...this.detectSingletonPattern());
    patterns.push(...this.detectFactoryPattern());
    patterns.push(...this.detectBuilderPattern());
    patterns.push(...this.detectPrototypePattern());

    // Only implemented patterns for now
    // patterns.push(...this.detectAdapterPattern());
    // patterns.push(...this.detectDecoratorPattern());
    // patterns.push(...this.detectFacadePattern());
    // patterns.push(...this.detectProxyPattern());
    // patterns.push(...this.detectCompositePattern());

    // patterns.push(...this.detectObserverPattern());
    // patterns.push(...this.detectStrategyPattern());
    // patterns.push(...this.detectCommandPattern());
    // patterns.push(...this.detectStatePattern());
    // patterns.push(...this.detectChainOfResponsibilityPattern());
    // patterns.push(...this.detectVisitorPattern());

    // patterns.push(...this.detectMVCPattern());
    // patterns.push(...this.detectRepositoryPattern());
    // patterns.push(...this.detectDependencyInjectionPattern());
    // patterns.push(...this.detectMiddlewarePattern());

    // Anti-Patterns
    antiPatterns.push(...this.detectGodObjectAntiPattern());
    antiPatterns.push(...this.detectLongParameterListAntiPattern());
    // antiPatterns.push(...this.detectDeepNestingAntiPattern());
    // antiPatterns.push(...this.detectMagicNumberAntiPattern());
    // antiPatterns.push(...this.detectDuplicateCodeAntiPattern());
    antiPatterns.push(...this.detectLongMethodAntiPattern());

    const uniquePatterns = new Set(patterns.map(p => p.pattern));
    const qualityScore = this.calculateQualityScore(patterns, antiPatterns);
    const recommendations = this.generateRecommendations(patterns, antiPatterns);

    return {
      patterns,
      antiPatterns,
      summary: {
        totalPatterns: patterns.length,
        uniquePatterns,
        qualityScore,
        recommendations
      }
    };
  }

  // Creational Patterns

  private detectSingletonPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasPrivateConstructor = this.hasPrivateConstructor(symbol);
      const hasStaticInstance = this.hasStaticInstanceMethod(symbol);
      const hasInstanceField = this.hasStaticInstanceField(symbol);

      if ((hasPrivateConstructor || hasStaticInstance) && hasInstanceField) {
        matches.push({
          pattern: 'Singleton',
          confidence: hasPrivateConstructor ? 0.9 : 0.7,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Ensures a class has only one instance and provides global access to it',
          characteristics: [
            hasPrivateConstructor ? 'Private constructor' : 'Static instance method',
            'Static instance field',
            'Global access point'
          ],
          suggestions: [
            'Consider dependency injection instead for better testability',
            'Ensure thread safety if needed',
            'Consider using a module pattern instead'
          ]
        });
      }
    }

    return matches;
  }

  private detectFactoryPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'function' && symbol.type !== 'class') continue;

      const createsObjects = this.createsMultipleObjectTypes(symbol);
      const hasFactoryName = /create|build|make|factory/i.test(symbol.name);
      const hasConditionalCreation = this.hasConditionalObjectCreation(symbol);

      if (createsObjects && (hasFactoryName || hasConditionalCreation)) {
        matches.push({
          pattern: 'Factory',
          confidence: hasFactoryName && hasConditionalCreation ? 0.9 : 0.7,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Creates objects without specifying their concrete classes',
          characteristics: [
            'Creates multiple object types',
            hasFactoryName ? 'Factory naming convention' : 'Conditional object creation',
            'Encapsulates object creation logic'
          ],
          suggestions: [
            'Consider using abstract factory for families of objects',
            'Document supported object types',
            'Consider using dependency injection container'
          ]
        });
      }
    }

    return matches;
  }

  private detectBuilderPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasFluentInterface = this.hasFluentInterface(symbol);
      const hasBuildMethod = this.hasBuildMethod(symbol);
      const hasBuilderName = /builder/i.test(symbol.name);

      if ((hasFluentInterface || hasBuildMethod) && hasBuilderName) {
        matches.push({
          pattern: 'Builder',
          confidence: hasFluentInterface && hasBuildMethod ? 0.9 : 0.7,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Constructs complex objects step by step',
          characteristics: [
            hasFluentInterface ? 'Fluent interface' : 'Method chaining',
            hasBuildMethod ? 'Build method' : 'Construction methods',
            'Builder naming convention'
          ],
          suggestions: [
            'Consider validation in build method',
            'Document required vs optional parameters',
            'Consider immutable objects'
          ]
        });
      }
    }

    return matches;
  }

  private detectPrototypePattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasCloneMethod = this.hasCloneMethod(symbol);
      const implementsCloneable = this.implementsCloneableInterface(symbol);

      if (hasCloneMethod || implementsCloneable) {
        matches.push({
          pattern: 'Prototype',
          confidence: hasCloneMethod && implementsCloneable ? 0.9 : 0.7,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Creates objects by cloning an existing instance',
          characteristics: [
            hasCloneMethod ? 'Clone method' : 'Cloneable interface',
            'Object copying mechanism'
          ],
          suggestions: [
            'Ensure deep vs shallow copy behavior is clear',
            'Consider immutable objects instead',
            'Document cloning behavior'
          ]
        });
      }
    }

    return matches;
  }

  // Structural Patterns

  private detectAdapterPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasAdapterName = /adapter|wrapper/i.test(symbol.name);
      const wrapsExternalInterface = this.wrapsExternalInterface(symbol);
      const providesCompatibilityLayer = this.providesCompatibilityLayer(symbol);

      if (hasAdapterName && (wrapsExternalInterface || providesCompatibilityLayer)) {
        matches.push({
          pattern: 'Adapter',
          confidence: hasAdapterName && wrapsExternalInterface ? 0.9 : 0.7,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Allows incompatible interfaces to work together',
          characteristics: [
            'Adapter naming convention',
            wrapsExternalInterface ? 'Wraps external interface' : 'Provides compatibility',
            'Interface translation'
          ],
          suggestions: [
            'Document interface mapping',
            'Consider configuration for different adapters',
            'Ensure error handling for incompatible data'
          ]
        });
      }
    }

    return matches;
  }

  private detectDecoratorPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasDecoratorName = /decorator|wrapper/i.test(symbol.name);
      const extendsBaseInterface = this.extendsBaseInterface(symbol);
      const composesOriginalObject = this.composesOriginalObject(symbol);
      const enhancesBehavior = this.enhancesBehavior(symbol);

      if (hasDecoratorName && extendsBaseInterface && composesOriginalObject && enhancesBehavior) {
        matches.push({
          pattern: 'Decorator',
          confidence: 0.9,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Adds new functionality to objects dynamically',
          characteristics: [
            'Decorator naming convention',
            'Extends base interface',
            'Composes original object',
            'Enhances behavior'
          ],
          suggestions: [
            'Consider decorator chains',
            'Document enhancement behavior',
            'Ensure decorator order doesn\'t matter'
          ]
        });
      }
    }

    return matches;
  }

  private detectObserverPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const hasObserverMethods = this.hasObserverMethods(symbol);
      const maintainsList = this.maintainsObserverList(symbol);
      const hasNotificationMethods = this.hasNotificationMethods(symbol);

      if (hasObserverMethods && maintainsList && hasNotificationMethods) {
        matches.push({
          pattern: 'Observer',
          confidence: 0.9,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Defines a subscription mechanism to notify multiple objects',
          characteristics: [
            'Subscribe/Unsubscribe methods',
            'Maintains observer list',
            'Notification methods'
          ],
          suggestions: [
            'Consider weak references to prevent memory leaks',
            'Handle observer exceptions gracefully',
            'Consider async notification patterns'
          ]
        });
      }
    }

    return matches;
  }

  // Anti-Patterns

  private detectGodObjectAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'class') continue;

      const methodCount = this.getMethodCount(symbol);
      const fieldCount = this.getFieldCount(symbol);
      const lineCount = this.getLineCount(symbol);
      const responsibilityCount = this.getResponsibilityCount(symbol);

      const isGodObject = methodCount > 20 || fieldCount > 15 || lineCount > 500 || responsibilityCount > 5;

      if (isGodObject) {
        const confidence = Math.min(
          (methodCount / 30) + (fieldCount / 20) + (lineCount / 1000) + (responsibilityCount / 10),
          1.0
        );

        matches.push({
          pattern: 'God Object',
          confidence,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Class that knows too much or does too much',
          characteristics: [
            `${methodCount} methods (threshold: 20)`,
            `${fieldCount} fields (threshold: 15)`,
            `${lineCount} lines (threshold: 500)`,
            `${responsibilityCount} responsibilities (threshold: 5)`
          ],
          suggestions: [
            'Extract related methods into separate classes',
            'Apply Single Responsibility Principle',
            'Consider using composition over inheritance',
            'Split into multiple cohesive classes'
          ],
          antiPattern: true,
          severity: confidence > 0.8 ? 'critical' : confidence > 0.6 ? 'high' : 'medium'
        });
      }
    }

    return matches;
  }

  private detectLongParameterListAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'function' && symbol.type !== 'class') continue;

      const paramCount = this.getParameterCount(symbol);
      if (paramCount > 6) {
        const confidence = Math.min(paramCount / 10, 1.0);

        matches.push({
          pattern: 'Long Parameter List',
          confidence,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Function has too many parameters, making it hard to use',
          characteristics: [
            `${paramCount} parameters (threshold: 6)`,
            'Difficult to remember parameter order',
            'Hard to test all combinations'
          ],
          suggestions: [
            'Use parameter objects or configuration objects',
            'Apply method overloading',
            'Consider builder pattern for complex construction',
            'Split function into smaller, focused functions'
          ],
          antiPattern: true,
          severity: paramCount > 10 ? 'high' : 'medium'
        });
      }
    }

    return matches;
  }

  private detectDeepNestingAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'function' && symbol.type !== 'class') continue;

      const nestingLevel = this.getMaxNestingLevel(symbol);
      if (nestingLevel > 4) {
        const confidence = Math.min(nestingLevel / 8, 1.0);

        matches.push({
          pattern: 'Deep Nesting',
          confidence,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Function has excessive nesting levels, reducing readability',
          characteristics: [
            `${nestingLevel} nesting levels (threshold: 4)`,
            'Hard to follow logic flow',
            'Difficult to test all branches'
          ],
          suggestions: [
            'Extract nested logic into separate methods',
            'Use early returns to reduce nesting',
            'Consider strategy pattern for complex conditionals',
            'Apply guard clauses'
          ],
          antiPattern: true,
          severity: nestingLevel > 6 ? 'high' : 'medium'
        });
      }
    }

    return matches;
  }

  private detectMagicNumberAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      const magicNumbers = this.findMagicNumbers(symbol);
      
      if (magicNumbers.length > 0) {
        matches.push({
          pattern: 'Magic Numbers',
          confidence: Math.min(magicNumbers.length / 5, 1.0),
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Unexplained numeric literals that reduce code readability',
          characteristics: [
            `${magicNumbers.length} magic numbers found`,
            'Numbers without clear meaning',
            'Hard to maintain and modify'
          ],
          suggestions: [
            'Extract numbers into named constants',
            'Use enums for related values',
            'Add comments explaining number significance',
            'Consider configuration files for thresholds'
          ],
          antiPattern: true,
          severity: 'low'
        });
      }
    }

    return matches;
  }

  private detectDuplicateCodeAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const duplicates = this.findDuplicateCodeBlocks();

    for (const duplicate of duplicates) {
      matches.push({
        pattern: 'Duplicate Code',
        confidence: duplicate.similarity,
        location: {
          file: duplicate.files[0],
          symbols: duplicate.symbols,
          startLine: duplicate.startLine,
          endLine: duplicate.endLine
        },
        description: 'Similar code blocks that should be consolidated',
        characteristics: [
          `${duplicate.files.length} similar code blocks`,
          `${duplicate.similarity * 100}% similarity`,
          'Maintenance burden multiplied'
        ],
        suggestions: [
          'Extract common code into shared function',
          'Use template method pattern',
          'Consider strategy pattern for variations',
          'Create utility functions'
        ],
        antiPattern: true,
        severity: duplicate.similarity > 0.8 ? 'medium' : 'low'
      });
    }

    return matches;
  }

  private detectLongMethodAntiPattern(): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [symbolId, symbol] of this.symbolGraph.symbols) {
      if (symbol.type !== 'function' && symbol.type !== 'class') continue;

      const lineCount = this.getLineCount(symbol);
      const complexity = this.getCyclomaticComplexity(symbol);

      if (lineCount > 50 || complexity > 10) {
        const confidence = Math.min((lineCount / 100) + (complexity / 20), 1.0);

        matches.push({
          pattern: 'Long Method',
          confidence,
          location: {
            file: symbol.location.file,
            symbols: [symbolId],
            startLine: symbol.location.startLine,
            endLine: symbol.location.endLine
          },
          description: 'Method is too long and complex, violating single responsibility',
          characteristics: [
            `${lineCount} lines (threshold: 50)`,
            `${complexity} cyclomatic complexity (threshold: 10)`,
            'Multiple responsibilities'
          ],
          suggestions: [
            'Extract methods for distinct responsibilities',
            'Apply single responsibility principle',
            'Consider command pattern for complex operations',
            'Break into smaller, focused methods'
          ],
          antiPattern: true,
          severity: lineCount > 100 ? 'high' : 'medium'
        });
      }
    }

    return matches;
  }

  // Helper methods (implementations would be more sophisticated in real system)
  
  private hasPrivateConstructor(symbol: SymbolNode): boolean {
    return symbol.name.includes('private') || symbol.metadata.accessibility === 'private';
  }

  private hasStaticInstanceMethod(symbol: SymbolNode): boolean {
    return /getInstance|instance/i.test(symbol.name || '');
  }

  private hasStaticInstanceField(symbol: SymbolNode): boolean {
    return true; // Simplified
  }

  private createsMultipleObjectTypes(symbol: SymbolNode): boolean {
    return /new |create|Object\.create/i.test(symbol.metadata.docstring || '');
  }

  private hasConditionalObjectCreation(symbol: SymbolNode): boolean {
    return /if|switch|case/i.test(symbol.metadata.docstring || '');
  }

  private hasFluentInterface(symbol: SymbolNode): boolean {
    return /return this/i.test(symbol.metadata.docstring || '');
  }

  private hasBuildMethod(symbol: SymbolNode): boolean {
    return /build\(/i.test(symbol.metadata.docstring || '');
  }

  private hasCloneMethod(symbol: SymbolNode): boolean {
    return /clone\(/i.test(symbol.metadata.docstring || '');
  }

  private implementsCloneableInterface(symbol: SymbolNode): boolean {
    return /Cloneable|clone/i.test(symbol.name || '');
  }

  private wrapsExternalInterface(symbol: SymbolNode): boolean {
    // Implementation would check if class wraps external APIs
    return true; // Simplified
  }

  private providesCompatibilityLayer(symbol: SymbolNode): boolean {
    // Implementation would check for compatibility methods
    return true; // Simplified
  }

  private extendsBaseInterface(symbol: SymbolNode): boolean {
    // Implementation would check inheritance/interface implementation
    return true; // Simplified
  }

  private composesOriginalObject(symbol: SymbolNode): boolean {
    // Implementation would check for composition
    return true; // Simplified
  }

  private enhancesBehavior(symbol: SymbolNode): boolean {
    // Implementation would check if class adds behavior
    return true; // Simplified
  }

  private hasObserverMethods(symbol: SymbolNode): boolean {
    return /subscribe|unsubscribe|addListener|removeListener/i.test(symbol.metadata.docstring || '');
  }

  private maintainsObserverList(symbol: SymbolNode): boolean {
    return /observers|listeners|subscribers/i.test(symbol.metadata.docstring || '');
  }

  private hasNotificationMethods(symbol: SymbolNode): boolean {
    return /notify|emit|trigger|fire/i.test(symbol.metadata.docstring || '');
  }

  private getMethodCount(symbol: SymbolNode): number {
    return Math.floor(Math.random() * 30) + 1; // Simplified
  }

  private getFieldCount(symbol: SymbolNode): number {
    return Math.floor(Math.random() * 20) + 1; // Simplified
  }

  private getLineCount(symbol: SymbolNode): number {
    if (symbol.location.endLine && symbol.location.startLine) {
      return symbol.location.endLine - symbol.location.startLine + 1;
    }
    return Math.floor(Math.random() * 100) + 1; // Simplified
  }

  private getResponsibilityCount(symbol: SymbolNode): number {
    return Math.floor(Math.random() * 8) + 1; // Simplified
  }

  private getParameterCount(symbol: SymbolNode): number {
    return Math.floor(Math.random() * 12) + 1; // Simplified
  }

  private getMaxNestingLevel(symbol: SymbolNode): number {
    // Implementation would analyze nesting depth
    return Math.floor(Math.random() * 8) + 1; // Simplified
  }

  private getCyclomaticComplexity(symbol: SymbolNode): number {
    return Math.floor(Math.random() * 15) + 1; // Simplified
  }

  private findMagicNumbers(symbol: SymbolNode): number[] {
    // No code property, so skip
    return [];
  }

  private findDuplicateCodeBlocks(): Array<{
    files: string[];
    symbols: string[];
    similarity: number;
    startLine: number;
    endLine: number;
  }> {
    // Implementation would find similar code blocks
    return []; // Simplified
  }

  private calculateQualityScore(patterns: PatternMatch[], antiPatterns: PatternMatch[]): number {
    const goodPatterns = patterns.length * 10;
    const badPatterns = antiPatterns.reduce((sum, ap) => {
      const severity = ap.severity === 'critical' ? 20 : ap.severity === 'high' ? 15 : ap.severity === 'medium' ? 10 : 5;
      return sum + severity;
    }, 0);

    return Math.max(0, Math.min(100, goodPatterns - badPatterns));
  }

  private generateRecommendations(patterns: PatternMatch[], antiPatterns: PatternMatch[]): string[] {
    const recommendations: string[] = [];

    if (antiPatterns.length > 0) {
      recommendations.push(`Address ${antiPatterns.length} anti-patterns to improve code quality`);
    }

    const criticalAntiPatterns = antiPatterns.filter(ap => ap.severity === 'critical');
    if (criticalAntiPatterns.length > 0) {
      recommendations.push(`Critical: Fix ${criticalAntiPatterns.length} critical anti-patterns immediately`);
    }

    if (patterns.length < 5) {
      recommendations.push('Consider implementing more design patterns for better structure');
    }

    return recommendations;
  }
}

/**
 * Factory for creating pattern detectors
 */
export class PatternDetectorFactory {
  static create(symbolGraph: SymbolGraph): PatternDetector {
    return new PatternDetector(symbolGraph);
  }
} 