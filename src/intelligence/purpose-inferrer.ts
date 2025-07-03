/**
 * PurposeInferrer - Infers code purpose through structural and behavioral analysis
 * 
 * The core intelligence for understanding "why" code exists by analyzing
 * patterns, goals, and contextual clues without explicit documentation.
 */

import { 
  CodePurpose, 
  PurposeEvidence, 
  AlternativePurpose,
  SymbolNode,
  SymbolGraph,
  ExecutionTrace,
  GoalSpecification 
} from '../types/index.js';

export interface InferParams {
  symbol: SymbolNode;
  symbolGraph: SymbolGraph;
  executionTraces: ExecutionTrace[];
  goalSpecification?: GoalSpecification;
}

export class PurposeInferrer {
  
  async infer(params: InferParams): Promise<CodePurpose> {
    console.error(`🧠 Inferring purpose for ${params.symbol.name}`);
    
    // REVOLUTIONARY MULTI-LAYER EVIDENCE GATHERING
    const evidence: PurposeEvidence[] = [];
    
    // LAYER 1: Basic evidence gathering
    evidence.push(...await this.gatherStructuralEvidence(params));
    evidence.push(...await this.gatherBehavioralEvidence(params));
    evidence.push(...await this.gatherNamingEvidence(params));
    evidence.push(...await this.gatherDependencyEvidence(params));
    
    // LAYER 2: Advanced AI-optimized pattern analysis
    evidence.push(...await this.inferFromDataTransformations(params.executionTraces, params.symbol));
    evidence.push(...await this.inferFromErrorHandling(params.symbol, params.symbolGraph));
    evidence.push(...await this.inferFromInteractionPatterns(params.symbol, params.symbolGraph));
    evidence.push(...await this.matchBehavioralFingerprint(params.executionTraces, params.symbol));
    
    console.log(`🧠 Gathered ${evidence.length} pieces of evidence for ${params.symbol.name}`);
    
    // Synthesize primary goal from evidence
    const inferredGoal = await this.synthesizePrimaryGoal(evidence, params);
    
    // Calculate confidence based on evidence strength
    const confidence = this.calculateConfidence(evidence);
    
    // Generate alternative interpretations
    const alternatives = await this.generateAlternatives(evidence, params);
    
    return {
      inferredGoal,
      confidence,
      evidence,
      alternatives
    };
  }

  private async gatherStructuralEvidence(params: InferParams): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    const { symbol, symbolGraph } = params;
    
    // Analyze symbol position in graph
    const inDegree = symbolGraph.edges.filter(e => e.to === symbol.id).length;
    const outDegree = symbolGraph.edges.filter(e => e.from === symbol.id).length;
    
    if (inDegree > outDegree) {
      evidence.push({
        type: 'structural',
        description: 'High fan-in suggests this is a utility or core function',
        strength: Math.min(inDegree / 10, 1.0),
        source: 'dependency-analysis'
      });
    }
    
    if (outDegree > inDegree) {
      evidence.push({
        type: 'structural', 
        description: 'High fan-out suggests this is a coordinator or orchestrator',
        strength: Math.min(outDegree / 10, 1.0),
        source: 'dependency-analysis'
      });
    }
    
    // Advanced structural patterns now handled by inferFromInteractionPatterns()
    
    return evidence;
  }

  private async gatherBehavioralEvidence(params: InferParams): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    const { symbol, executionTraces } = params;
    
    // Find traces that include this symbol
    const relevantTraces = executionTraces.filter(trace => 
      trace.stackFrames.some(frame => frame.functionId === symbol.id)
    );
    
    if (relevantTraces.length > 0) {
      // Analyze execution patterns
      const avgStackDepth = relevantTraces.reduce((sum, trace) => {
        const frame = trace.stackFrames.find(f => f.functionId === symbol.id);
        return sum + (frame?.depth || 0);
      }, 0) / relevantTraces.length;
      
      if (avgStackDepth < 2) {
        evidence.push({
          type: 'behavioral',
          description: 'Low stack depth suggests this is an entry point or high-level function',
          strength: 0.7,
          source: 'execution-analysis'
        });
      }
      
      if (avgStackDepth > 5) {
        evidence.push({
          type: 'behavioral',
          description: 'High stack depth suggests this is a helper or utility function',
          strength: 0.6,
          source: 'execution-analysis'
        });
      }
    }
    
    // Advanced behavioral analysis now handled by specialized methods
    
    return evidence;
  }

  private async gatherNamingEvidence(params: InferParams): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    const { symbol } = params;
    
    const name = symbol.name.toLowerCase();
    
    // Common naming patterns
    const patterns = [
      { pattern: /^(get|fetch|retrieve|load)/, purpose: 'data retrieval', strength: 0.8 },
      { pattern: /^(set|save|store|write|update)/, purpose: 'data modification', strength: 0.8 },
      { pattern: /^(validate|check|verify|ensure)/, purpose: 'validation', strength: 0.9 },
      { pattern: /^(handle|process|execute|run)/, purpose: 'processing', strength: 0.7 },
      { pattern: /^(create|make|build|generate)/, purpose: 'creation', strength: 0.8 },
      { pattern: /^(delete|remove|destroy|clean)/, purpose: 'cleanup', strength: 0.8 },
      { pattern: /^(send|transmit|emit|publish)/, purpose: 'communication', strength: 0.8 },
      { pattern: /^(parse|decode|transform|convert)/, purpose: 'transformation', strength: 0.9 }
    ];
    
    for (const { pattern, purpose, strength } of patterns) {
      if (pattern.test(name)) {
        evidence.push({
          type: 'naming',
          description: `Name suggests ${purpose} functionality`,
          strength,
          source: 'naming-analysis'
        });
      }
    }
    
    // Analyze documentation if available
    if (symbol.metadata?.docstring) {
      const docstring = symbol.metadata.docstring.toLowerCase();
      // Simple keyword analysis
      if (docstring.includes('validate') || docstring.includes('check')) {
        evidence.push({
          type: 'naming',
          description: 'Documentation suggests validation purpose',
          strength: 0.6,
          source: 'documentation-analysis'
        });
      }
    }
    
    return evidence;
  }

  private async gatherDependencyEvidence(params: InferParams): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    const { symbol, symbolGraph } = params;
    
    // Analyze what this symbol depends on
    const dependencies = symbol.dependencies.map(id => symbolGraph.symbols.get(id)).filter(Boolean);
    
    // Security-related dependencies
    const securityKeywords = ['crypto', 'hash', 'encrypt', 'decrypt', 'security', 'auth'];
    const securityDeps = dependencies.filter(dep => 
      securityKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    if (securityDeps.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Dependencies suggest security-related functionality',
        strength: 0.8,
        source: 'dependency-analysis'
      });
    }
    
    // Enhanced dependency analysis with pattern recognition
    const databaseKeywords = ['db', 'database', 'sql', 'query', 'table', 'collection'];
    const networkKeywords = ['http', 'api', 'request', 'response', 'client', 'server', 'socket'];
    const testKeywords = ['test', 'spec', 'mock', 'assert', 'expect'];
    
    const dbDeps = dependencies.filter(dep => 
      databaseKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    const networkDeps = dependencies.filter(dep => 
      networkKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    const testDeps = dependencies.filter(dep => 
      testKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    if (dbDeps.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Handles data persistence and storage operations',
        strength: 0.85,
        source: 'dependency-analysis'
      });
    }
    
    if (networkDeps.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Manages network communication and API interactions',
        strength: 0.8,
        source: 'dependency-analysis'
      });
    }
    
    if (testDeps.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Supports testing and quality assurance processes',
        strength: 0.7,
        source: 'dependency-analysis'
      });
    }
    
    return evidence;
  }

  private async synthesizePrimaryGoal(evidence: PurposeEvidence[], params: InferParams): Promise<string> {
    if (evidence.length === 0) {
      return `Unknown purpose for ${params.symbol.name}`;
    }
    
    // AI-OPTIMIZED EVIDENCE SYNTHESIS
    // Group evidence by type and calculate consensus
    const structuralEvidence = evidence.filter(e => e.type === 'structural');
    const behavioralEvidence = evidence.filter(e => e.type === 'behavioral');
    const namingEvidence = evidence.filter(e => e.type === 'naming');
    const dependencyEvidence = evidence.filter(e => e.type === 'dependency');
    
    const evidenceGroups = [
      { type: 'structural', evidence: structuralEvidence, weight: 0.9 },
      { type: 'behavioral', evidence: behavioralEvidence, weight: 0.95 },
      { type: 'naming', evidence: namingEvidence, weight: 0.8 },
      { type: 'dependency', evidence: dependencyEvidence, weight: 0.7 }
    ];
    
    let bestEvidence: PurposeEvidence | null = null;
    let maxScore = 0;
    
    for (const group of evidenceGroups) {
      if (group.evidence.length > 0) {
        const avgStrength = group.evidence.reduce((sum, e) => sum + e.strength, 0) / group.evidence.length;
        const score = avgStrength * group.weight * Math.min(group.evidence.length / 3, 1); // Bonus for multiple evidence
        
        if (score > maxScore) {
          maxScore = score;
          const sortedEvidence = group.evidence.sort((a, b) => b.strength - a.strength);
          bestEvidence = sortedEvidence[0];
        }
      }
    }
    
    if (bestEvidence) {
      // Extract key purpose from evidence description
      const description = bestEvidence.description.toLowerCase();
      
      // Pattern matching for cleaner synthesis
      if (description.includes('central hub') || description.includes('coordinator')) {
        return `Orchestrates and coordinates multiple system components`;
      } else if (description.includes('validation') || description.includes('check')) {
        return `Validates inputs and ensures data integrity`;
      } else if (description.includes('transformation') || description.includes('processing')) {
        return `Transforms and processes data between system layers`;
      } else if (description.includes('entry point') || description.includes('initialization')) {
        return `Serves as system entry point and initialization handler`;
      } else if (description.includes('error') || description.includes('handling')) {
        return `Manages error conditions and system resilience`;
      } else {
        return `${description.charAt(0).toUpperCase() + description.slice(1)}`;
      }
    }
    
    return `Purpose unclear for ${params.symbol.name}`;
  }

  private calculateConfidence(evidence: PurposeEvidence[]): number {
    if (evidence.length === 0) return 0;
    
    // ADVANCED CONFIDENCE CALCULATION
    // Factor in evidence diversity, strength, and consensus
    
    // Base confidence from average strength
    const avgStrength = evidence.reduce((sum, e) => sum + e.strength, 0) / evidence.length;
    
    // Diversity bonus: more evidence types = higher confidence
    const evidenceTypes = new Set(evidence.map(e => e.type));
    const diversityBonus = Math.min(evidenceTypes.size / 4, 1); // Max 4 types
    
    // Quantity bonus: more evidence pieces = higher confidence (with diminishing returns)
    const quantityBonus = Math.min(evidence.length / 8, 1);
    
    // Consensus penalty: conflicting evidence reduces confidence
    const strongEvidence = evidence.filter(e => e.strength > 0.7);
    const consensusPenalty = strongEvidence.length > 1 ? 
      1 - (Math.abs(strongEvidence[0].strength - strongEvidence[1].strength) * 0.3) : 1;
    
    // Source credibility: weight different analysis sources
    const sourceWeights = {
      'behavioral-fingerprint': 1.0,
      'topology-analysis': 0.95,
      'data-flow-analysis': 0.9,
      'naming-analysis': 0.8,
      'dependency-analysis': 0.85
    };
    
    const weightedStrength = evidence.reduce((sum, e) => {
      const weight = sourceWeights[e.source as keyof typeof sourceWeights] || 0.7;
      return sum + (e.strength * weight);
    }, 0) / evidence.length;
    
    // Final confidence calculation
    const confidence = (weightedStrength * 0.6) + 
                     (diversityBonus * 0.2) + 
                     (quantityBonus * 0.1) + 
                     (avgStrength * consensusPenalty * 0.1);
    
    return Math.min(confidence, 0.98); // Cap at 98% - never 100% certain
  }

  private async generateAlternatives(evidence: PurposeEvidence[], params: InferParams): Promise<AlternativePurpose[]> {
    const alternatives: AlternativePurpose[] = [];
    
    if (evidence.length < 2) return alternatives;
    
    // INTELLIGENT ALTERNATIVE GENERATION
    // Group evidence by strength tiers
    const strongEvidence = evidence.filter(e => e.strength > 0.7);
    const moderateEvidence = evidence.filter(e => e.strength > 0.4 && e.strength <= 0.7);
    
    // Generate alternatives from secondary evidence
    if (moderateEvidence.length > 0) {
      const secondaryEvidence = moderateEvidence
        .sort((a, b) => b.strength - a.strength)[0];
      
      alternatives.push({
        goal: `May also ${secondaryEvidence.description.toLowerCase()}`,
        confidence: secondaryEvidence.strength * 0.8, // Reduced confidence for alternative
        reasoning: `Secondary evidence from ${secondaryEvidence.source} suggests this possibility`
      });
    }
    
    // Generate conflicting interpretation if evidence suggests multiple patterns
    const structuralEvidence = evidence.filter(e => e.type === 'structural');
    const behavioralEvidence = evidence.filter(e => e.type === 'behavioral');
    
    if (structuralEvidence.length > 0 && behavioralEvidence.length > 0) {
      const structuralPattern = structuralEvidence[0].description;
      const behavioralPattern = behavioralEvidence[0].description;
      
      if (!structuralPattern.includes(behavioralPattern.split(' ')[0])) {
        alternatives.push({
          goal: `Could be ${behavioralPattern.toLowerCase()} despite structural appearance`,
          confidence: 0.4,
          reasoning: 'Behavioral evidence conflicts with structural interpretation'
        });
      }
    }
    
    // Add context-dependent alternative if symbol name suggests multiple uses
    const name = params.symbol.name.toLowerCase();
    const ambiguousTerms = ['handle', 'process', 'manage', 'execute', 'run', 'get', 'set'];
    
    if (ambiguousTerms.some(term => name.includes(term))) {
      alternatives.push({
        goal: `Generic utility function with context-dependent purpose`,
        confidence: 0.35,
        reasoning: 'Function name suggests multiple possible interpretations depending on usage context'
      });
    }
    
    return alternatives.slice(0, 3); // Limit to top 3 alternatives
  }

  /**
   * ADVANCED INFERENCE METHODS
   * Revolutionary AI-optimized pattern detection for deep purpose understanding
   */

  private async inferFromDataTransformations(traces: ExecutionTrace[], symbol: SymbolNode): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    
    // Find traces involving this symbol
    const relevantTraces = traces.filter(trace => 
      trace.stackFrames.some(frame => frame.functionId === symbol.id)
    );
    
    for (const trace of relevantTraces) {
      // Analyze data flow patterns
      const inputTypes = new Set<string>();
      const outputTypes = new Set<string>();
      
      trace.dataFlow.forEach(edge => {
        if (edge.from === symbol.id) outputTypes.add(edge.variable);
        if (edge.to === symbol.id) inputTypes.add(edge.variable);
      });
      
      // Detect transformation patterns
      if (inputTypes.size > 0 && outputTypes.size > 0) {
        if (trace.dataFlow.some(df => df.transformation)) {
          evidence.push({
            type: 'behavioral',
            description: 'Performs data transformation/processing',
            strength: 0.85,
            source: 'data-flow-analysis'
          });
        }
      }
      
      // Detect aggregation patterns (many inputs -> few outputs)
      if (inputTypes.size > outputTypes.size * 2) {
        evidence.push({
          type: 'behavioral',
          description: 'Aggregates or reduces data',
          strength: 0.8,
          source: 'data-flow-analysis'
        });
      }
      
      // Detect expansion patterns (few inputs -> many outputs)
      if (outputTypes.size > inputTypes.size * 2) {
        evidence.push({
          type: 'behavioral',
          description: 'Expands or generates data',
          strength: 0.8,
          source: 'data-flow-analysis'
        });
      }
    }
    
    return evidence;
  }

  private async inferFromErrorHandling(symbol: SymbolNode, symbolGraph: SymbolGraph): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    
    // Check for error handling patterns in dependencies
    const dependencies = symbol.dependencies
      .map(id => symbolGraph.symbols.get(id))
      .filter(Boolean);
    
    const errorKeywords = ['error', 'exception', 'throw', 'catch', 'try', 'fail', 'abort'];
    const logKeywords = ['log', 'debug', 'warn', 'info', 'trace'];
    
    const errorRelated = dependencies.filter(dep => 
      errorKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    const logRelated = dependencies.filter(dep => 
      logKeywords.some(keyword => dep!.name.toLowerCase().includes(keyword))
    );
    
    if (errorRelated.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Handles errors or exceptional conditions',
        strength: 0.75,
        source: 'error-handling-analysis'
      });
    }
    
    if (logRelated.length > 0) {
      evidence.push({
        type: 'dependency',
        description: 'Provides observability or debugging support',
        strength: 0.7,
        source: 'error-handling-analysis'
      });
    }
    
    // Check if this symbol is used in error contexts by others
    const errorUsage = symbolGraph.edges.filter(edge => 
      edge.to === symbol.id && 
      errorKeywords.some(keyword => edge.from.toLowerCase().includes(keyword))
    );
    
    if (errorUsage.length > 0) {
      evidence.push({
        type: 'structural',
        description: 'Called in error handling contexts',
        strength: 0.8,
        source: 'error-context-analysis'
      });
    }
    
    return evidence;
  }

  private async inferFromInteractionPatterns(symbol: SymbolNode, symbolGraph: SymbolGraph): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    
    // Analyze graph topology around this symbol
    const inEdges = symbolGraph.edges.filter(e => e.to === symbol.id);
    const outEdges = symbolGraph.edges.filter(e => e.from === symbol.id);
    
    const inDegree = inEdges.length;
    const outDegree = outEdges.length;
    
    // HUB PATTERN: Central coordinator
    if (inDegree > 3 && outDegree > 3) {
      evidence.push({
        type: 'structural',
        description: 'Acts as central hub/coordinator',
        strength: 0.9,
        source: 'topology-analysis'
      });
    }
    
    // FACADE PATTERN: Single entry point
    else if (inDegree > outDegree * 2 && inDegree > 2) {
      evidence.push({
        type: 'structural',
        description: 'Provides unified interface/facade',
        strength: 0.85,
        source: 'topology-analysis'
      });
    }
    
    // FACTORY PATTERN: Single producer, many consumers
    else if (outDegree > inDegree * 2 && outDegree > 2) {
      evidence.push({
        type: 'structural',
        description: 'Creates or generates multiple outputs',
        strength: 0.8,
        source: 'topology-analysis'
      });
    }
    
    // LEAF PATTERN: Terminal node
    else if (outDegree === 0 && inDegree > 0) {
      evidence.push({
        type: 'structural',
        description: 'Terminal operation or final step',
        strength: 0.7,
        source: 'topology-analysis'
      });
    }
    
    // ROOT PATTERN: Entry point
    else if (inDegree === 0 && outDegree > 0) {
      evidence.push({
        type: 'structural',
        description: 'Entry point or initialization',
        strength: 0.8,
        source: 'topology-analysis'
      });
    }
    
    // Analyze edge types for more specific patterns
    const callEdges = outEdges.filter(e => e.type === 'calls');
    const importEdges = inEdges.filter(e => e.type === 'imports');
    
    if (callEdges.length > 5) {
      evidence.push({
        type: 'behavioral',
        description: 'Orchestrates multiple operations',
        strength: 0.75,
        source: 'interaction-analysis'
      });
    }
    
    if (importEdges.length > 3) {
      evidence.push({
        type: 'structural',
        description: 'Heavily imported utility or core component',
        strength: 0.8,
        source: 'interaction-analysis'
      });
    }
    
    return evidence;
  }

  private async matchBehavioralFingerprint(traces: ExecutionTrace[], symbol: SymbolNode): Promise<PurposeEvidence[]> {
    const evidence: PurposeEvidence[] = [];
    
    // Find traces that include this symbol
    const relevantTraces = traces.filter(trace => 
      trace.stackFrames.some(frame => frame.functionId === symbol.id)
    );
    
    if (relevantTraces.length === 0) return evidence;
    
    // Analyze execution patterns
    const patterns = {
      validation: { score: 0, indicators: ['check', 'validate', 'verify', 'ensure', 'assert'] },
      transformation: { score: 0, indicators: ['convert', 'transform', 'parse', 'serialize', 'format'] },
      communication: { score: 0, indicators: ['send', 'receive', 'emit', 'listen', 'connect'] },
      persistence: { score: 0, indicators: ['save', 'load', 'store', 'fetch', 'cache'] },
      coordination: { score: 0, indicators: ['manage', 'handle', 'process', 'execute', 'run'] },
      security: { score: 0, indicators: ['auth', 'encrypt', 'decrypt', 'hash', 'verify'] }
    };
    
    // Score based on naming and execution context
    const symbolName = symbol.name.toLowerCase();
    
    Object.entries(patterns).forEach(([patternName, pattern]) => {
      pattern.indicators.forEach(indicator => {
        if (symbolName.includes(indicator)) {
          pattern.score += 0.8; // High weight for name match
        }
      });
    });
    
    // Analyze execution paths for behavioral evidence
    relevantTraces.forEach(trace => {
      trace.executionPaths.forEach(path => {
        // High probability paths are more indicative
        const weight = path.probability;
        
        // Analyze control flow patterns
        const controlNodes = trace.controlFlow.filter(node => 
          path.nodes.includes(node.id)
        );
        
        const hasLoops = controlNodes.some(node => node.type === 'loop');
        const hasDecisions = controlNodes.some(node => node.type === 'decision');
        const hasCalls = controlNodes.some(node => node.type === 'call');
        
        if (hasLoops && hasDecisions) {
          patterns.transformation.score += weight * 0.6;
        }
        
        if (hasCalls && controlNodes.length > 3) {
          patterns.coordination.score += weight * 0.7;
        }
        
        if (hasDecisions && !hasLoops) {
          patterns.validation.score += weight * 0.5;
        }
      });
    });
    
    // Convert high-scoring patterns to evidence
    Object.entries(patterns).forEach(([patternName, pattern]) => {
      if (pattern.score > 0.4) {
        evidence.push({
          type: 'behavioral',
          description: `Exhibits ${patternName} behavioral patterns`,
          strength: Math.min(pattern.score, 1.0),
          source: 'behavioral-fingerprint'
        });
      }
    });
    
    return evidence;
  }
}
