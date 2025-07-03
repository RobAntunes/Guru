/**
 * Change Impact Analyzer - Analyzes ripple effects of code changes
 * 
 * Provides comprehensive analysis of how changes propagate through
 * the codebase, including direct dependencies, indirect effects,
 * and potential breaking changes.
 */

import { SymbolNode } from '../types/index.js';
import Parser from 'tree-sitter';

export interface ChangeImpact {
  directImpacts: ImpactNode[];
  indirectImpacts: ImpactNode[];
  crossModuleImpacts: ImpactNode[];
  riskAssessment: RiskAssessment;
  recommendations: string[];
  propagationPaths: PropagationPath[];
  metadata: ChangeImpactMetadata;
}

export interface ImpactNode {
  symbol: SymbolNode;
  impactType: 'breaking' | 'behavioral' | 'performance' | 'compatibility' | 'interface';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reason: string;
  location: {
    file: string;
    startLine: number;
    endLine: number;
  };
  context: ImpactContext;
}

export interface ImpactContext {
  changeType: 'signature' | 'implementation' | 'removal' | 'addition' | 'rename';
  affectedFeatures: string[];
  usagePatterns: string[];
  testCoverage?: number;
  apiSurface?: boolean;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  testingRequirements: string[];
  deploymentConsiderations: string[];
}

export interface RiskFactor {
  type: 'breaking_change' | 'high_usage' | 'core_functionality' | 'external_api' | 'performance_critical';
  description: string;
  weight: number;
  evidence: string[];
}

export interface PropagationPath {
  source: SymbolNode;
  target: SymbolNode;
  path: SymbolNode[];
  propagationType: 'direct_call' | 'inheritance' | 'composition' | 'data_flow' | 'event_chain';
  distance: number;
  strength: number; // 0-1 indicating how strong the coupling is
}

export interface ChangeImpactMetadata {
  analysisTimestamp: Date;
  analysisDuration: number;
  confidenceScore: number;
  limitationsEncountered: string[];
  analysisDepth: number;
  symbolsAnalyzed: number;
}

export class ChangeImpactAnalyzer {
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseGraph = new Map<string, Set<string>>();
  private symbolUsageFrequency = new Map<string, number>();
  private crossModuleReferences = new Map<string, Set<string>>();

  /**
   * Analyze the impact of changing a specific symbol
   */
  analyzeSymbolChange(
    targetSymbol: SymbolNode,
    changeType: ImpactContext['changeType'],
    allSymbols: Map<string, SymbolNode>
  ): ChangeImpact {
    const startTime = Date.now();
    
    // Build dependency graphs
    this.buildDependencyGraphs(allSymbols);
    
    // Analyze direct impacts
    const directImpacts = this.analyzeDirectImpacts(targetSymbol, changeType, allSymbols);
    
    // Analyze indirect impacts through propagation
    const indirectImpacts = this.analyzeIndirectImpacts(targetSymbol, directImpacts, allSymbols);
    
    // Analyze cross-module impacts
    const crossModuleImpacts = this.analyzeCrossModuleImpacts(targetSymbol, allSymbols);
    
    // Calculate propagation paths
    const propagationPaths = this.calculatePropagationPaths(targetSymbol, allSymbols);
    
    // Assess overall risk
    const riskAssessment = this.assessRisk(directImpacts, indirectImpacts, crossModuleImpacts, targetSymbol);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskAssessment, changeType, targetSymbol);
    
    const analysisTime = Date.now() - startTime;
    
    return {
      directImpacts,
      indirectImpacts,
      crossModuleImpacts,
      riskAssessment,
      recommendations,
      propagationPaths,
      metadata: {
        analysisTimestamp: new Date(),
        analysisDuration: analysisTime,
        confidenceScore: this.calculateOverallConfidence(directImpacts, indirectImpacts),
        limitationsEncountered: this.identifyLimitations(targetSymbol, allSymbols),
        analysisDepth: Math.max(
          this.calculateMaxDepth(propagationPaths),
          3
        ),
        symbolsAnalyzed: directImpacts.length + indirectImpacts.length + crossModuleImpacts.length
      }
    };
  }

  /**
   * Analyze changes to multiple symbols (batch analysis)
   */
  analyzeBatchChanges(
    changes: Array<{ symbol: SymbolNode; changeType: ImpactContext['changeType'] }>,
    allSymbols: Map<string, SymbolNode>
  ): Map<string, ChangeImpact> {
    const results = new Map<string, ChangeImpact>();
    
    // Build shared dependency graph once
    this.buildDependencyGraphs(allSymbols);
    
    for (const change of changes) {
      const impact = this.analyzeSymbolChange(change.symbol, change.changeType, allSymbols);
      results.set(change.symbol.id, impact);
    }
    
    // Analyze interactions between changes
    this.analyzeChangeInteractions(results, allSymbols);
    
    return results;
  }

  /**
   * Build dependency graphs for efficient traversal
   */
  private buildDependencyGraphs(allSymbols: Map<string, SymbolNode>): void {
    this.dependencyGraph.clear();
    this.reverseGraph.clear();
    this.symbolUsageFrequency.clear();
    this.crossModuleReferences.clear();

    for (const [id, symbol] of allSymbols) {
      // Forward dependencies (what this symbol depends on)
      this.dependencyGraph.set(id, new Set(symbol.dependencies));
      
      // Calculate usage frequency
      this.symbolUsageFrequency.set(id, symbol.dependents.length);
      
      // Cross-module references
      const symbolModule = this.extractModule(symbol.location.file);
      for (const depId of symbol.dependencies) {
        const depSymbol = allSymbols.get(depId);
        if (depSymbol) {
          const depModule = this.extractModule(depSymbol.location.file);
          if (symbolModule !== depModule) {
            if (!this.crossModuleReferences.has(symbolModule)) {
              this.crossModuleReferences.set(symbolModule, new Set());
            }
            this.crossModuleReferences.get(symbolModule)!.add(depModule);
          }
        }
      }
      
      // Reverse dependencies (what depends on this symbol)
      for (const depId of symbol.dependents) {
        if (!this.reverseGraph.has(depId)) {
          this.reverseGraph.set(depId, new Set());
        }
        this.reverseGraph.get(depId)!.add(id);
      }
    }
  }

  /**
   * Analyze direct impacts on immediate dependents
   */
  private analyzeDirectImpacts(
    targetSymbol: SymbolNode,
    changeType: ImpactContext['changeType'],
    allSymbols: Map<string, SymbolNode>
  ): ImpactNode[] {
    const impacts: ImpactNode[] = [];
    const dependents = this.reverseGraph.get(targetSymbol.id) || new Set();

    for (const dependentId of dependents) {
      const dependent = allSymbols.get(dependentId);
      if (!dependent) continue;

      const impact = this.assessDirectImpact(targetSymbol, dependent, changeType);
      if (impact) {
        impacts.push(impact);
      }
    }

    return impacts.sort((a, b) => this.getImpactWeight(b.severity) - this.getImpactWeight(a.severity));
  }

  /**
   * Assess impact on a specific dependent symbol
   */
  private assessDirectImpact(
    targetSymbol: SymbolNode,
    dependent: SymbolNode,
    changeType: ImpactContext['changeType']
  ): ImpactNode | null {
    const usageFrequency = this.symbolUsageFrequency.get(dependent.id) || 0;
    const isPublicAPI = this.isPublicAPI(targetSymbol);
    const isCoreFunction = this.isCoreFunction(targetSymbol);

    let impactType: ImpactNode['impactType'] = 'behavioral';
    let severity: ImpactNode['severity'] = 'low';
    let confidence = 0.7;
    let reason = '';

    // Analyze based on change type
    switch (changeType) {
      case 'signature':
        impactType = 'breaking';
        severity = isPublicAPI ? 'critical' : 'high';
        confidence = 0.9;
        reason = `Function signature change will break existing calls`;
        break;
        
      case 'removal':
        impactType = 'breaking';
        severity = usageFrequency > 5 ? 'critical' : 'high';
        confidence = 0.95;
        reason = `Symbol removal will cause compilation/runtime errors`;
        break;
        
      case 'rename':
        impactType = 'breaking';
        severity = isPublicAPI ? 'high' : 'medium';
        confidence = 0.8;
        reason = `Symbol rename requires updates to all references`;
        break;
        
      case 'implementation':
        impactType = 'behavioral';
        severity = isCoreFunction ? 'medium' : 'low';
        confidence = 0.6;
        reason = `Implementation change may affect behavior`;
        break;
        
      case 'addition':
        return null; // Additions rarely break existing code
    }

    // Adjust severity based on usage patterns
    if (usageFrequency > 10) {
      severity = this.escalateSeverity(severity);
    }

    return {
      symbol: dependent,
      impactType,
      severity,
      confidence,
      reason,
      location: dependent.location,
      context: {
        changeType,
        affectedFeatures: this.identifyAffectedFeatures(dependent),
        usagePatterns: this.analyzeUsagePatterns(dependent),
        apiSurface: this.isPublicAPI(dependent)
      }
    };
  }

  /**
   * Analyze indirect impacts through dependency chains
   */
  private analyzeIndirectImpacts(
    targetSymbol: SymbolNode,
    directImpacts: ImpactNode[],
    allSymbols: Map<string, SymbolNode>,
    maxDepth: number = 3,
    visited: Set<string> = new Set()
  ): ImpactNode[] {
    if (maxDepth <= 0 || visited.has(targetSymbol.id)) {
      return [];
    }

    visited.add(targetSymbol.id);
    const indirectImpacts: ImpactNode[] = [];

    // Propagate impacts through each direct impact
    for (const directImpact of directImpacts) {
      const propagatedImpacts = this.propagateImpact(
        directImpact,
        allSymbols,
        maxDepth - 1,
        new Set(visited)
      );
      indirectImpacts.push(...propagatedImpacts);
    }

    return indirectImpacts;
  }

  /**
   * Propagate impact through dependency chain
   */
  private propagateImpact(
    impact: ImpactNode,
    allSymbols: Map<string, SymbolNode>,
    remainingDepth: number,
    visited: Set<string>
  ): ImpactNode[] {
    if (remainingDepth <= 0 || visited.has(impact.symbol.id)) {
      return [];
    }

    visited.add(impact.symbol.id);
    const propagatedImpacts: ImpactNode[] = [];
    const dependents = this.reverseGraph.get(impact.symbol.id) || new Set();

    for (const dependentId of dependents) {
      const dependent = allSymbols.get(dependentId);
      if (!dependent || visited.has(dependentId)) continue;

      const propagatedImpact = this.createPropagatedImpact(impact, dependent);
      if (propagatedImpact) {
        propagatedImpacts.push(propagatedImpact);
        
        // Continue propagation
        const furtherImpacts = this.propagateImpact(
          propagatedImpact,
          allSymbols,
          remainingDepth - 1,
          new Set(visited)
        );
        propagatedImpacts.push(...furtherImpacts);
      }
    }

    return propagatedImpacts;
  }

  /**
   * Create propagated impact with reduced severity
   */
  private createPropagatedImpact(
    sourceImpact: ImpactNode,
    targetSymbol: SymbolNode
  ): ImpactNode | null {
    // Reduce severity for indirect impacts
    const reducedSeverity = this.reduceSeverity(sourceImpact.severity);
    const reducedConfidence = sourceImpact.confidence * 0.8; // Reduce confidence for indirect impacts

    if (reducedConfidence < 0.3) {
      return null; // Too uncertain
    }

    return {
      symbol: targetSymbol,
      impactType: sourceImpact.impactType,
      severity: reducedSeverity,
      confidence: reducedConfidence,
      reason: `Indirect impact via ${sourceImpact.symbol.name || sourceImpact.symbol.id}`,
      location: targetSymbol.location,
      context: {
        changeType: sourceImpact.context.changeType,
        affectedFeatures: this.identifyAffectedFeatures(targetSymbol),
        usagePatterns: this.analyzeUsagePatterns(targetSymbol),
        apiSurface: this.isPublicAPI(targetSymbol)
      }
    };
  }

  /**
   * Analyze cross-module impacts
   */
  private analyzeCrossModuleImpacts(
    targetSymbol: SymbolNode,
    allSymbols: Map<string, SymbolNode>
  ): ImpactNode[] {
    const impacts: ImpactNode[] = [];
    const targetModule = this.extractModule(targetSymbol.location.file);
    const referencingModules = this.crossModuleReferences.get(targetModule) || new Set();

    for (const module of referencingModules) {
      const moduleSymbols = this.getModuleSymbols(module, allSymbols);
      for (const symbol of moduleSymbols) {
        if (symbol.dependencies.includes(targetSymbol.id)) {
          const impact = this.assessCrossModuleImpact(targetSymbol, symbol);
          if (impact) {
            impacts.push(impact);
          }
        }
      }
    }

    return impacts;
  }

  /**
   * Assess impact across module boundaries
   */
  private assessCrossModuleImpact(
    targetSymbol: SymbolNode,
    dependentSymbol: SymbolNode
  ): ImpactNode | null {
    return {
      symbol: dependentSymbol,
      impactType: 'interface',
      severity: 'medium',
      confidence: 0.7,
      reason: 'Cross-module dependency may require interface updates',
      location: dependentSymbol.location,
      context: {
        changeType: 'implementation',
        affectedFeatures: ['module_interface'],
        usagePatterns: ['cross_module_reference'],
        apiSurface: true
      }
    };
  }

  /**
   * Calculate propagation paths showing how changes flow through the system
   */
  private calculatePropagationPaths(
    targetSymbol: SymbolNode,
    allSymbols: Map<string, SymbolNode>,
    maxDepth: number = 4
  ): PropagationPath[] {
    const paths: PropagationPath[] = [];
    this.findPropagationPaths(
      targetSymbol,
      targetSymbol,
      [targetSymbol],
      allSymbols,
      paths,
      maxDepth,
      new Set()
    );
    return paths;
  }

  /**
   * Recursively find all propagation paths
   */
  private findPropagationPaths(
    source: SymbolNode,
    current: SymbolNode,
    currentPath: SymbolNode[],
    allSymbols: Map<string, SymbolNode>,
    paths: PropagationPath[],
    remainingDepth: number,
    visited: Set<string>
  ): void {
    if (remainingDepth <= 0 || visited.has(current.id)) {
      return;
    }

    visited.add(current.id);
    const dependents = this.reverseGraph.get(current.id) || new Set();

    for (const dependentId of dependents) {
      const dependent = allSymbols.get(dependentId);
      if (!dependent || visited.has(dependentId)) continue;

      const newPath = [...currentPath, dependent];
      const propagationType = this.determinePropagationType(current, dependent);
      const strength = this.calculateCouplingStrength(current, dependent);

      paths.push({
        source,
        target: dependent,
        path: newPath,
        propagationType,
        distance: newPath.length - 1,
        strength
      });

      // Continue exploring if path is strong enough
      if (strength > 0.3) {
        this.findPropagationPaths(
          source,
          dependent,
          newPath,
          allSymbols,
          paths,
          remainingDepth - 1,
          new Set(visited)
        );
      }
    }
  }

  /**
   * Assess overall risk of the change
   */
  private assessRisk(
    directImpacts: ImpactNode[],
    indirectImpacts: ImpactNode[],
    crossModuleImpacts: ImpactNode[],
    targetSymbol: SymbolNode
  ): RiskAssessment {
    const allImpacts = [...directImpacts, ...indirectImpacts, ...crossModuleImpacts];
    const riskFactors: RiskFactor[] = [];
    
    // Analyze risk factors
    const criticalImpacts = allImpacts.filter(i => i.severity === 'critical');
    const highImpacts = allImpacts.filter(i => i.severity === 'high');
    const breakingChanges = allImpacts.filter(i => i.impactType === 'breaking');
    
    if (criticalImpacts.length > 0) {
      riskFactors.push({
        type: 'breaking_change',
        description: `${criticalImpacts.length} critical impacts detected`,
        weight: 0.9,
        evidence: criticalImpacts.map(i => i.reason)
      });
    }
    
    if (this.isHighUsage(targetSymbol)) {
      riskFactors.push({
        type: 'high_usage',
        description: 'Symbol has high usage across codebase',
        weight: 0.7,
        evidence: [`${this.symbolUsageFrequency.get(targetSymbol.id) || 0} dependents`]
      });
    }
    
    if (this.isCoreFunction(targetSymbol)) {
      riskFactors.push({
        type: 'core_functionality',
        description: 'Change affects core system functionality',
        weight: 0.8,
        evidence: ['Core function classification']
      });
    }

    // Calculate overall risk
    const riskScore = this.calculateRiskScore(riskFactors, allImpacts);
    const overallRisk = this.classifyRisk(riskScore);

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: this.generateMitigationStrategies(riskFactors, allImpacts),
      testingRequirements: this.generateTestingRequirements(allImpacts, targetSymbol),
      deploymentConsiderations: this.generateDeploymentConsiderations(overallRisk, allImpacts)
    };
  }

  // Helper methods for risk assessment and analysis continue...
  // [Additional helper methods would continue here]

  private extractModule(filePath: string): string {
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/') || 'root';
  }

  private getModuleSymbols(module: string, allSymbols: Map<string, SymbolNode>): SymbolNode[] {
    return Array.from(allSymbols.values()).filter(symbol => 
      this.extractModule(symbol.location.file) === module
    );
  }

  private isPublicAPI(symbol: SymbolNode): boolean {
    return symbol.scope === 'global' || 
           symbol.name?.startsWith('export') === true;
  }

  private isCoreFunction(symbol: SymbolNode): boolean {
    return symbol.type === 'function' && 
           (this.symbolUsageFrequency.get(symbol.id) || 0) > 5;
  }

  private isHighUsage(symbol: SymbolNode): boolean {
    return (this.symbolUsageFrequency.get(symbol.id) || 0) > 10;
  }

  private identifyAffectedFeatures(symbol: SymbolNode): string[] {
    const features: string[] = [];
    const moduleName = this.extractModule(symbol.location.file);
    features.push(`module_${moduleName.replace(/[\/\\]/g, '_')}`);
    
    if (symbol.type === 'function') features.push('function_behavior');
    if (symbol.type === 'class') features.push('class_interface');
    if (this.isPublicAPI(symbol)) features.push('public_api');
    
    return features;
  }

  private analyzeUsagePatterns(symbol: SymbolNode): string[] {
    const patterns: string[] = [];
    const usageCount = this.symbolUsageFrequency.get(symbol.id) || 0;
    
    if (usageCount > 10) patterns.push('high_frequency');
    if (usageCount > 0) patterns.push('dependency_target');
    if (symbol.dependencies.length > 5) patterns.push('complex_dependencies');
    
    return patterns;
  }

  private calculateCouplingStrength(source: SymbolNode, target: SymbolNode): number {
    // Simple coupling strength calculation
    let strength = 0.5; // Base strength
    
    // Same module = stronger coupling
    if (this.extractModule(source.location.file) === this.extractModule(target.location.file)) {
      strength += 0.3;
    }
    
    // High usage frequency = stronger coupling
    const usage = this.symbolUsageFrequency.get(target.id) || 0;
    if (usage > 5) strength += 0.2;
    
    return Math.min(1.0, strength);
  }

  private determinePropagationType(source: SymbolNode, target: SymbolNode): PropagationPath['propagationType'] {
    // Simple heuristic - could be enhanced with more sophisticated analysis
    if (source.type === 'class' && target.type === 'class') {
      return 'inheritance';
    }
    if (source.type === 'function' && target.type === 'function') {
      return 'direct_call';
    }
    return 'composition';
  }

  private getImpactWeight(severity: ImpactNode['severity']): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private escalateSeverity(severity: ImpactNode['severity']): ImpactNode['severity'] {
    switch (severity) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'critical';
      case 'critical': return 'critical';
      default: return severity;
    }
  }

  private reduceSeverity(severity: ImpactNode['severity']): ImpactNode['severity'] {
    switch (severity) {
      case 'critical': return 'high';
      case 'high': return 'medium';
      case 'medium': return 'low';
      case 'low': return 'low';
      default: return severity;
    }
  }

  private calculateRiskScore(riskFactors: RiskFactor[], impacts: ImpactNode[]): number {
    let score = 0;
    for (const factor of riskFactors) {
      score += factor.weight;
    }
    
    // Add impact severity contribution
    for (const impact of impacts) {
      score += this.getImpactWeight(impact.severity) * 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private classifyRisk(score: number): RiskAssessment['overallRisk'] {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private generateMitigationStrategies(riskFactors: RiskFactor[], impacts: ImpactNode[]): string[] {
    const strategies: string[] = [];
    
    if (riskFactors.some(f => f.type === 'breaking_change')) {
      strategies.push('Implement backwards compatibility layer');
      strategies.push('Create migration guide for affected code');
    }
    
    if (riskFactors.some(f => f.type === 'high_usage')) {
      strategies.push('Phase rollout gradually');
      strategies.push('Monitor usage metrics during deployment');
    }
    
    return strategies;
  }

  private generateTestingRequirements(impacts: ImpactNode[], targetSymbol: SymbolNode): string[] {
    const requirements: string[] = [];
    
    requirements.push('Unit tests for changed functionality');
    
    if (impacts.some(i => i.impactType === 'breaking')) {
      requirements.push('Integration tests for all affected modules');
    }
    
    if (this.isPublicAPI(targetSymbol)) {
      requirements.push('API contract tests');
    }
    
    return requirements;
  }

  private generateDeploymentConsiderations(risk: RiskAssessment['overallRisk'], impacts: ImpactNode[]): string[] {
    const considerations: string[] = [];
    
    if (risk === 'critical' || risk === 'high') {
      considerations.push('Deploy during low-traffic period');
      considerations.push('Prepare rollback plan');
    }
    
    if (impacts.some(i => i.impactType === 'performance')) {
      considerations.push('Monitor performance metrics post-deployment');
    }
    
    return considerations;
  }

  private generateRecommendations(
    riskAssessment: RiskAssessment,
    changeType: ImpactContext['changeType'],
    targetSymbol: SymbolNode
  ): string[] {
    const recommendations: string[] = [];
    
    // Risk-based recommendations
    if (riskAssessment.overallRisk === 'critical') {
      recommendations.push('Consider redesigning change to reduce impact');
      recommendations.push('Implement feature flag for gradual rollout');
    }
    
    // Change type specific recommendations
    if (changeType === 'signature') {
      recommendations.push('Deprecate old signature before removing');
      recommendations.push('Update all affected documentation');
    }
    
    return recommendations;
  }

  private calculateOverallConfidence(directImpacts: ImpactNode[], indirectImpacts: ImpactNode[]): number {
    const allImpacts = [...directImpacts, ...indirectImpacts];
    if (allImpacts.length === 0) return 0.5;
    
    const avgConfidence = allImpacts.reduce((sum, impact) => sum + impact.confidence, 0) / allImpacts.length;
    return avgConfidence;
  }

  private identifyLimitations(targetSymbol: SymbolNode, allSymbols: Map<string, SymbolNode>): string[] {
    const limitations: string[] = [];
    
    if (targetSymbol.dependencies.length === 0) {
      limitations.push('Symbol appears isolated - may miss dynamic dependencies');
    }
    
    if (!targetSymbol.metadata.docstring) {
      limitations.push('No documentation available for behavior analysis');
    }
    
    return limitations;
  }

  private calculateMaxDepth(paths: PropagationPath[]): number {
    return Math.max(...paths.map(p => p.distance), 0);
  }

  private analyzeChangeInteractions(
    results: Map<string, ChangeImpact>,
    allSymbols: Map<string, SymbolNode>
  ): void {
    // Analyze how multiple changes interact with each other
    // This could identify compounding effects, conflicting changes, etc.
    // Implementation would enhance individual impact analyses
  }
} 