import { BaseConfig } from '../../../core/base-config';

export interface ResearchInsight {
  id: string;
  content: string;
  type: 'discovery' | 'connection' | 'contradiction' | 'gap' | 'synthesis';
  confidence: number;
  sources: string[];
  timestamp: Date;
  quantumState: InsightQuantumState;
}

export interface InsightQuantumState {
  superposition: InsightPossibility[];
  entanglement: EntangledInsights;
  coherence: number;
  measurement: MeasurementState;
}

export interface InsightPossibility {
  interpretation: string;
  probability: number;
  implications: string[];
  strength: number;
  domain: string;
}

export interface EntangledInsights {
  primary: string;
  related: EntangledRelation[];
  correlationMatrix: number[][];
}

export interface EntangledRelation {
  insightId: string;
  entanglementType: 'causal' | 'correlational' | 'contradictory' | 'complementary';
  strength: number;
  bidirectional: boolean;
}

export interface MeasurementState {
  collapsed: boolean;
  observer: 'researcher' | 'peer' | 'system' | 'reader';
  criteria: MeasurementCriteria;
  confidence: number;
}

export interface MeasurementCriteria {
  relevance: number;
  novelty: number;
  reliability: number;
  impact: number;
}

export interface KnowledgeField {
  dimensions: number;
  basis: string[];
  operators: FieldOperator[];
  potential: number[][];
}

export interface FieldOperator {
  name: string;
  type: 'creation' | 'annihilation' | 'transformation';
  effect: (state: InsightQuantumState) => InsightQuantumState;
}

export interface ResearchMemorySpace {
  insights: Map<string, ResearchInsight>;
  fields: Map<string, KnowledgeField>;
  entanglementGraph: EntanglementGraph;
  coherenceThreshold: number;
}

export interface EntanglementGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: InsightCluster[];
}

export interface GraphNode {
  insightId: string;
  position: number[]; // N-dimensional position
  field: string;
  energy: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export interface InsightCluster {
  id: string;
  members: string[];
  centroid: number[];
  coherence: number;
  theme: string;
}

export class ResearchQuantumConfig extends BaseConfig {
  readonly domain = 'research';
  readonly version = '1.0.0';
  
  // Quantum memory configuration for research
  readonly memoryConfig = {
    maxSuperposition: 7,          // Max interpretations per insight
    minCoherence: 0.6,           // Minimum coherence for stability
    entanglementDecay: 0.95,     // How entanglement weakens over distance
    measurementThreshold: 0.75,   // Confidence needed to collapse
    fieldDimensions: 10,         // Dimensions of knowledge field
  };
  
  // Knowledge field configurations
  readonly fieldConfig = {
    theoretical: {
      dimensions: 5,
      basis: ['axioms', 'theorems', 'proofs', 'conjectures', 'frameworks'],
      strength: 0.9,
    },
    empirical: {
      dimensions: 6,
      basis: ['observations', 'experiments', 'data', 'analysis', 'validation', 'replication'],
      strength: 0.85,
    },
    methodological: {
      dimensions: 4,
      basis: ['qualitative', 'quantitative', 'mixed', 'computational'],
      strength: 0.8,
    },
    interdisciplinary: {
      dimensions: 8,
      basis: ['physics', 'biology', 'psychology', 'computer-science', 'mathematics', 'sociology', 'philosophy', 'engineering'],
      strength: 0.7,
    },
  };
  
  // Quantum operators for research insights
  readonly operators = {
    synthesis: {
      type: 'creation' as const,
      strength: 0.8,
      effect: (insights: ResearchInsight[]) => this.synthesizeInsights(insights),
    },
    critique: {
      type: 'annihilation' as const,
      strength: 0.6,
      effect: (insight: ResearchInsight) => this.critiqueInsight(insight),
    },
    connection: {
      type: 'transformation' as const,
      strength: 0.7,
      effect: (insights: ResearchInsight[]) => this.connectInsights(insights),
    },
  };
  
  // Create superposition of research interpretations
  createInsightSuperposition(
    observation: string,
    context: string,
    existingInsights: ResearchInsight[]
  ): InsightQuantumState {
    const possibilities = this.generatePossibilities(observation, context);
    const entanglement = this.calculateEntanglement(possibilities, existingInsights);
    const coherence = this.measureCoherence(possibilities, entanglement);
    
    return {
      superposition: possibilities,
      entanglement,
      coherence,
      measurement: {
        collapsed: false,
        observer: 'system',
        criteria: {
          relevance: 0,
          novelty: 0,
          reliability: 0,
          impact: 0,
        },
        confidence: 0,
      },
    };
  }
  
  private generatePossibilities(observation: string, context: string): InsightPossibility[] {
    const possibilities: InsightPossibility[] = [];
    
    // Generate different interpretations
    const interpretationStrategies = [
      { method: 'causal', func: () => this.causalInterpretation(observation, context) },
      { method: 'correlational', func: () => this.correlationalInterpretation(observation, context) },
      { method: 'theoretical', func: () => this.theoreticalInterpretation(observation, context) },
      { method: 'practical', func: () => this.practicalInterpretation(observation, context) },
      { method: 'critical', func: () => this.criticalInterpretation(observation, context) },
      { method: 'synthetic', func: () => this.syntheticInterpretation(observation, context) },
      { method: 'novel', func: () => this.novelInterpretation(observation, context) },
    ];
    
    interpretationStrategies.forEach(({ method, func }) => {
      const interpretation = func();
      possibilities.push({
        interpretation: interpretation.text,
        probability: interpretation.probability,
        implications: interpretation.implications,
        strength: interpretation.strength,
        domain: interpretation.domain,
      });
    });
    
    // Normalize probabilities
    const sum = possibilities.reduce((acc, p) => acc + p.probability, 0);
    possibilities.forEach(p => p.probability /= sum);
    
    return possibilities.slice(0, this.memoryConfig.maxSuperposition);
  }
  
  private causalInterpretation(observation: string, context: string): any {
    return {
      text: `Causal analysis: ${observation} directly causes effects in ${context}`,
      probability: 0.2,
      implications: ['Direct causation identified', 'Mechanism requires validation'],
      strength: 0.7,
      domain: 'empirical',
    };
  }
  
  private correlationalInterpretation(observation: string, context: string): any {
    return {
      text: `Correlational finding: ${observation} correlates with patterns in ${context}`,
      probability: 0.25,
      implications: ['Correlation established', 'Causation not determined'],
      strength: 0.6,
      domain: 'empirical',
    };
  }
  
  private theoreticalInterpretation(observation: string, context: string): any {
    return {
      text: `Theoretical framework: ${observation} aligns with theoretical predictions for ${context}`,
      probability: 0.15,
      implications: ['Theory supported', 'Further testing needed'],
      strength: 0.8,
      domain: 'theoretical',
    };
  }
  
  private practicalInterpretation(observation: string, context: string): any {
    return {
      text: `Practical application: ${observation} suggests actionable insights for ${context}`,
      probability: 0.15,
      implications: ['Implementation possible', 'Real-world testing required'],
      strength: 0.65,
      domain: 'applied',
    };
  }
  
  private criticalInterpretation(observation: string, context: string): any {
    return {
      text: `Critical perspective: ${observation} challenges assumptions about ${context}`,
      probability: 0.1,
      implications: ['Paradigm questioned', 'Alternative explanations needed'],
      strength: 0.5,
      domain: 'critical',
    };
  }
  
  private syntheticInterpretation(observation: string, context: string): any {
    return {
      text: `Synthetic insight: ${observation} integrates multiple perspectives on ${context}`,
      probability: 0.1,
      implications: ['Holistic understanding', 'Cross-domain connections'],
      strength: 0.75,
      domain: 'interdisciplinary',
    };
  }
  
  private novelInterpretation(observation: string, context: string): any {
    return {
      text: `Novel discovery: ${observation} reveals unprecedented aspects of ${context}`,
      probability: 0.05,
      implications: ['Breakthrough potential', 'Paradigm shift possible'],
      strength: 0.9,
      domain: 'innovative',
    };
  }
  
  private calculateEntanglement(
    possibilities: InsightPossibility[],
    existingInsights: ResearchInsight[]
  ): EntangledInsights {
    const primary = `insight-${Date.now()}`;
    const related: EntangledRelation[] = [];
    
    // Find entangled insights
    existingInsights.forEach(insight => {
      const entanglementStrength = this.measureEntanglementStrength(possibilities, insight);
      if (entanglementStrength > 0.3) {
        related.push({
          insightId: insight.id,
          entanglementType: this.determineEntanglementType(possibilities, insight),
          strength: entanglementStrength,
          bidirectional: entanglementStrength > 0.7,
        });
      }
    });
    
    // Build correlation matrix
    const n = related.length + 1;
    const correlationMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Self-correlation
    correlationMatrix[0][0] = 1;
    
    // Cross-correlations
    for (let i = 0; i < related.length; i++) {
      correlationMatrix[0][i + 1] = related[i].strength;
      correlationMatrix[i + 1][0] = related[i].strength;
      
      // Inter-insight correlations
      for (let j = i + 1; j < related.length; j++) {
        const correlation = this.calculateInterInsightCorrelation(related[i], related[j]);
        correlationMatrix[i + 1][j + 1] = correlation;
        correlationMatrix[j + 1][i + 1] = correlation;
      }
    }
    
    return { primary, related, correlationMatrix };
  }
  
  private measureEntanglementStrength(
    possibilities: InsightPossibility[],
    insight: ResearchInsight
  ): number {
    let strength = 0;
    
    // Domain overlap
    possibilities.forEach(p => {
      if (p.domain === insight.quantumState.superposition[0]?.domain) {
        strength += 0.2;
      }
    });
    
    // Implication overlap
    const insightImplications = insight.quantumState.superposition.flatMap(s => s.implications);
    possibilities.forEach(p => {
      p.implications.forEach(imp => {
        if (insightImplications.some(i => this.similarityScore(i, imp) > 0.7)) {
          strength += 0.1;
        }
      });
    });
    
    return Math.min(1, strength);
  }
  
  private determineEntanglementType(
    possibilities: InsightPossibility[],
    insight: ResearchInsight
  ): EntangledRelation['entanglementType'] {
    // Analyze relationship between insights
    const avgStrength = possibilities.reduce((sum, p) => sum + p.strength, 0) / possibilities.length;
    const insightStrength = insight.quantumState.superposition[0]?.strength || 0;
    
    if (Math.abs(avgStrength - insightStrength) < 0.1) return 'correlational';
    if (avgStrength > insightStrength + 0.3) return 'causal';
    if (avgStrength < insightStrength - 0.3) return 'contradictory';
    
    return 'complementary';
  }
  
  private calculateInterInsightCorrelation(
    relation1: EntangledRelation,
    relation2: EntangledRelation
  ): number {
    if (relation1.entanglementType === relation2.entanglementType) return 0.5;
    if (relation1.entanglementType === 'contradictory' || relation2.entanglementType === 'contradictory') return -0.3;
    return 0.2;
  }
  
  private similarityScore(str1: string, str2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  
  private measureCoherence(
    possibilities: InsightPossibility[],
    entanglement: EntangledInsights
  ): number {
    // Internal coherence
    let internalCoherence = 0;
    for (let i = 0; i < possibilities.length - 1; i++) {
      for (let j = i + 1; j < possibilities.length; j++) {
        const similarity = this.calculatePossibilitySimilarity(possibilities[i], possibilities[j]);
        internalCoherence += similarity;
      }
    }
    internalCoherence /= (possibilities.length * (possibilities.length - 1)) / 2;
    
    // External coherence (with entangled insights)
    const externalCoherence = entanglement.related.length > 0
      ? entanglement.related.reduce((sum, r) => sum + r.strength, 0) / entanglement.related.length
      : 0.5;
    
    return internalCoherence * 0.6 + externalCoherence * 0.4;
  }
  
  private calculatePossibilitySimilarity(p1: InsightPossibility, p2: InsightPossibility): number {
    const domainMatch = p1.domain === p2.domain ? 0.3 : 0;
    const strengthDiff = 1 - Math.abs(p1.strength - p2.strength);
    const implicationOverlap = this.calculateImplicationOverlap(p1.implications, p2.implications);
    
    return domainMatch + strengthDiff * 0.3 + implicationOverlap * 0.4;
  }
  
  private calculateImplicationOverlap(imp1: string[], imp2: string[]): number {
    let overlap = 0;
    imp1.forEach(i1 => {
      imp2.forEach(i2 => {
        overlap += this.similarityScore(i1, i2);
      });
    });
    return overlap / (imp1.length * imp2.length);
  }
  
  // Collapse quantum state to specific insight
  collapseInsight(
    state: InsightQuantumState,
    observer: MeasurementState['observer'],
    criteria: MeasurementCriteria
  ): ResearchInsight {
    // Calculate weighted scores for each possibility
    const scores = state.superposition.map(possibility => {
      const relevanceScore = this.assessRelevance(possibility, criteria.relevance);
      const noveltyScore = this.assessNovelty(possibility, criteria.novelty);
      const reliabilityScore = possibility.strength * criteria.reliability;
      const impactScore = this.assessImpact(possibility, criteria.impact);
      
      return {
        possibility,
        score: relevanceScore * 0.3 + noveltyScore * 0.25 + reliabilityScore * 0.25 + impactScore * 0.2,
      };
    });
    
    // Select highest scoring possibility
    const selected = scores.reduce((a, b) => a.score > b.score ? a : b);
    
    // Create collapsed insight
    const insight: ResearchInsight = {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: selected.possibility.interpretation,
      type: this.determineInsightType(selected.possibility),
      confidence: selected.score,
      sources: [], // Would be populated from context
      timestamp: new Date(),
      quantumState: {
        ...state,
        measurement: {
          collapsed: true,
          observer,
          criteria,
          confidence: selected.score,
        },
      },
    };
    
    return insight;
  }
  
  private assessRelevance(possibility: InsightPossibility, targetRelevance: number): number {
    // Simulate relevance assessment
    return possibility.probability * targetRelevance;
  }
  
  private assessNovelty(possibility: InsightPossibility, targetNovelty: number): number {
    const novelDomains = ['innovative', 'interdisciplinary', 'critical'];
    const domainBonus = novelDomains.includes(possibility.domain) ? 0.3 : 0;
    return (possibility.strength * targetNovelty + domainBonus) / 1.3;
  }
  
  private assessImpact(possibility: InsightPossibility, targetImpact: number): number {
    const impactfulImplications = possibility.implications.filter(imp => 
      /breakthrough|paradigm|novel|transform/i.test(imp)
    ).length;
    return (impactfulImplications / possibility.implications.length) * targetImpact;
  }
  
  private determineInsightType(possibility: InsightPossibility): ResearchInsight['type'] {
    if (possibility.domain === 'innovative') return 'discovery';
    if (possibility.domain === 'interdisciplinary') return 'synthesis';
    if (possibility.domain === 'critical') return 'contradiction';
    if (possibility.implications.some(i => /gap|missing|needed/i.test(i))) return 'gap';
    return 'connection';
  }
  
  // Apply quantum operators
  private synthesizeInsights(insights: ResearchInsight[]): ResearchInsight {
    const synthesized = {
      interpretation: `Synthesis of ${insights.length} insights reveals emergent patterns`,
      probability: 0.8,
      implications: insights.flatMap(i => i.quantumState.superposition[0]?.implications || []),
      strength: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
      domain: 'interdisciplinary',
    };
    
    const quantumState = this.createInsightSuperposition(
      synthesized.interpretation,
      'synthesis operation',
      insights
    );
    
    return this.collapseInsight(quantumState, 'system', {
      relevance: 0.9,
      novelty: 0.8,
      reliability: 0.7,
      impact: 0.85,
    });
  }
  
  private critiqueInsight(insight: ResearchInsight): ResearchInsight | null {
    // Analyze weaknesses
    if (insight.confidence < this.memoryConfig.measurementThreshold) {
      return null; // Annihilate low-confidence insights
    }
    
    // Transform into critical perspective
    const critique = {
      interpretation: `Critical analysis of: ${insight.content}`,
      probability: 0.6,
      implications: [`Assumption questioned`, `Alternative needed`],
      strength: 1 - insight.confidence,
      domain: 'critical',
    };
    
    const quantumState = this.createInsightSuperposition(
      critique.interpretation,
      'critique operation',
      [insight]
    );
    
    return this.collapseInsight(quantumState, 'system', {
      relevance: 0.7,
      novelty: 0.6,
      reliability: 0.8,
      impact: 0.5,
    });
  }
  
  private connectInsights(insights: ResearchInsight[]): ResearchInsight {
    // Find connections between insights
    const connections = this.findConnections(insights);
    
    const connected = {
      interpretation: `Connected pattern: ${connections.pattern}`,
      probability: connections.strength,
      implications: connections.implications,
      strength: connections.confidence,
      domain: 'theoretical',
    };
    
    const quantumState = this.createInsightSuperposition(
      connected.interpretation,
      'connection operation',
      insights
    );
    
    return this.collapseInsight(quantumState, 'system', {
      relevance: 0.8,
      novelty: 0.7,
      reliability: 0.75,
      impact: 0.8,
    });
  }
  
  private findConnections(insights: ResearchInsight[]): any {
    // Analyze insights for patterns
    const domains = insights.map(i => i.quantumState.superposition[0]?.domain).filter(Boolean);
    const domainCounts = domains.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantDomain = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
    
    return {
      pattern: `${dominantDomain} convergence across ${insights.length} insights`,
      strength: 0.7,
      implications: [
        'Pattern identified across multiple insights',
        'Theoretical framework emerging',
      ],
      confidence: 0.75,
    };
  }
  
  // Create knowledge field
  createKnowledgeField(domain: string): KnowledgeField {
    const config = this.fieldConfig[domain as keyof typeof this.fieldConfig] || this.fieldConfig.theoretical;
    
    // Initialize field potential
    const potential = Array(config.dimensions)
      .fill(null)
      .map(() => Array(config.dimensions).fill(0));
    
    // Set diagonal elements (self-interaction)
    for (let i = 0; i < config.dimensions; i++) {
      potential[i][i] = config.strength;
    }
    
    // Create field operators
    const operators: FieldOperator[] = [
      {
        name: 'expand',
        type: 'creation',
        effect: (state) => this.expandField(state),
      },
      {
        name: 'contract',
        type: 'annihilation',
        effect: (state) => this.contractField(state),
      },
      {
        name: 'rotate',
        type: 'transformation',
        effect: (state) => this.rotateField(state),
      },
    ];
    
    return {
      dimensions: config.dimensions,
      basis: config.basis,
      operators,
      potential,
    };
  }
  
  private expandField(state: InsightQuantumState): InsightQuantumState {
    // Increase superposition possibilities
    return {
      ...state,
      coherence: state.coherence * 0.9, // Slight decoherence from expansion
    };
  }
  
  private contractField(state: InsightQuantumState): InsightQuantumState {
    // Reduce to most probable states
    const topStates = state.superposition
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);
    
    return {
      ...state,
      superposition: topStates,
      coherence: Math.min(1, state.coherence * 1.1), // Increased coherence
    };
  }
  
  private rotateField(state: InsightQuantumState): InsightQuantumState {
    // Rotate perspective (change domains)
    const rotatedSuperposition = state.superposition.map(s => ({
      ...s,
      domain: this.rotateDomain(s.domain),
    }));
    
    return {
      ...state,
      superposition: rotatedSuperposition,
    };
  }
  
  private rotateDomain(domain: string): string {
    const domains = ['empirical', 'theoretical', 'applied', 'critical', 'interdisciplinary'];
    const index = domains.indexOf(domain);
    return domains[(index + 1) % domains.length];
  }
  
  // Build research memory space
  buildMemorySpace(insights: ResearchInsight[]): ResearchMemorySpace {
    const insightMap = new Map(insights.map(i => [i.id, i]));
    const fields = new Map<string, KnowledgeField>();
    
    // Create fields for each domain
    ['theoretical', 'empirical', 'methodological', 'interdisciplinary'].forEach(domain => {
      fields.set(domain, this.createKnowledgeField(domain));
    });
    
    // Build entanglement graph
    const entanglementGraph = this.buildEntanglementGraph(insights);
    
    return {
      insights: insightMap,
      fields,
      entanglementGraph,
      coherenceThreshold: this.memoryConfig.minCoherence,
    };
  }
  
  private buildEntanglementGraph(insights: ResearchInsight[]): EntanglementGraph {
    const nodes: GraphNode[] = insights.map(insight => ({
      insightId: insight.id,
      position: this.calculatePosition(insight),
      field: insight.quantumState.superposition[0]?.domain || 'general',
      energy: insight.confidence,
    }));
    
    const edges: GraphEdge[] = [];
    insights.forEach((insight1, i) => {
      insights.slice(i + 1).forEach(insight2 => {
        const weight = this.calculateEdgeWeight(insight1, insight2);
        if (weight > 0.1) {
          edges.push({
            source: insight1.id,
            target: insight2.id,
            weight,
            type: 'entanglement',
          });
        }
      });
    });
    
    const clusters = this.identifyClusters(nodes, edges);
    
    return { nodes, edges, clusters };
  }
  
  private calculatePosition(insight: ResearchInsight): number[] {
    // Map insight to N-dimensional space
    const dimensions = this.memoryConfig.fieldDimensions;
    const position = new Array(dimensions).fill(0);
    
    // Use various features to determine position
    position[0] = insight.confidence;
    position[1] = insight.quantumState.coherence;
    position[2] = insight.quantumState.superposition.length / this.memoryConfig.maxSuperposition;
    
    // Fill remaining dimensions with random values
    for (let i = 3; i < dimensions; i++) {
      position[i] = Math.random();
    }
    
    return position;
  }
  
  private calculateEdgeWeight(insight1: ResearchInsight, insight2: ResearchInsight): number {
    const pos1 = this.calculatePosition(insight1);
    const pos2 = this.calculatePosition(insight2);
    
    // Euclidean distance in N-dimensional space
    const distance = Math.sqrt(
      pos1.reduce((sum, val, i) => sum + Math.pow(val - pos2[i], 2), 0)
    );
    
    // Convert distance to weight (inverse relationship)
    return Math.exp(-distance * this.memoryConfig.entanglementDecay);
  }
  
  private identifyClusters(nodes: GraphNode[], edges: GraphEdge[]): InsightCluster[] {
    // Simple clustering by field/domain
    const clusters: InsightCluster[] = [];
    const fieldGroups = new Map<string, GraphNode[]>();
    
    nodes.forEach(node => {
      const field = node.field;
      if (!fieldGroups.has(field)) {
        fieldGroups.set(field, []);
      }
      fieldGroups.get(field)!.push(node);
    });
    
    fieldGroups.forEach((nodes, field) => {
      if (nodes.length > 1) {
        const centroid = this.calculateCentroid(nodes);
        clusters.push({
          id: `cluster-${field}`,
          members: nodes.map(n => n.insightId),
          centroid,
          coherence: this.calculateClusterCoherence(nodes, edges),
          theme: field,
        });
      }
    });
    
    return clusters;
  }
  
  private calculateCentroid(nodes: GraphNode[]): number[] {
    const dimensions = nodes[0].position.length;
    const centroid = new Array(dimensions).fill(0);
    
    nodes.forEach(node => {
      node.position.forEach((val, i) => {
        centroid[i] += val;
      });
    });
    
    return centroid.map(val => val / nodes.length);
  }
  
  private calculateClusterCoherence(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length < 2) return 1;
    
    const nodeIds = new Set(nodes.map(n => n.insightId));
    const internalEdges = edges.filter(e => 
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    
    const maxEdges = (nodes.length * (nodes.length - 1)) / 2;
    const density = internalEdges.length / maxEdges;
    const avgWeight = internalEdges.reduce((sum, e) => sum + e.weight, 0) / internalEdges.length || 0;
    
    return density * 0.5 + avgWeight * 0.5;
  }
}

export const researchQuantumConfig = new ResearchQuantumConfig();