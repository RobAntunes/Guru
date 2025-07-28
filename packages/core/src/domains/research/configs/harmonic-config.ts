import { BaseConfig } from '../../../core/base-config';

export interface ResearchPattern {
  type: 'citation' | 'methodology' | 'argument' | 'evidence' | 'synthesis';
  frequency: number;
  amplitude: number;
  phase: number;
  strength: number;
  connections: number;
}

export interface CitationNetwork {
  nodes: CitationNode[];
  edges: CitationEdge[];
  centralityScores: Map<string, number>;
  clusters: CitationCluster[];
}

export interface CitationNode {
  id: string;
  author: string;
  year: number;
  title: string;
  influence: number;
  domain: string;
}

export interface CitationEdge {
  source: string;
  target: string;
  weight: number;
  type: 'supports' | 'challenges' | 'extends' | 'applies';
}

export interface CitationCluster {
  id: string;
  theme: string;
  members: string[];
  coherence: number;
}

export interface ArgumentStructure {
  claims: Claim[];
  evidence: Evidence[];
  methodology: Methodology;
  synthesis: Synthesis;
  logicalFlow: number;
}

export interface Claim {
  id: string;
  statement: string;
  type: 'hypothesis' | 'thesis' | 'conclusion' | 'assumption';
  strength: number;
  support: string[];
}

export interface Evidence {
  id: string;
  type: 'empirical' | 'theoretical' | 'statistical' | 'qualitative';
  source: string;
  reliability: number;
  relevance: number;
}

export interface Methodology {
  approach: string;
  rigor: number;
  reproducibility: number;
  validity: number;
}

export interface Synthesis {
  novelty: number;
  integration: number;
  implications: string[];
  futureWork: string[];
}

export class ResearchHarmonicConfig extends BaseConfig {
  readonly domain = 'research';
  readonly version = '1.0.0';
  
  // FFT parameters for research analysis
  readonly fftConfig = {
    sampleRate: 50,         // Sentences per sample
    windowSize: 256,        // Analysis window
    hopSize: 64,           // Overlap
    frequencyBins: 128,    // Resolution
  };
  
  // Research-specific harmonic patterns
  readonly patternConfig = {
    citationFlow: {
      minFrequency: 0.05,   // Paper-level citation patterns
      maxFrequency: 0.5,    // Section-level citations
      threshold: 0.25,
    },
    argumentStructure: {
      minFrequency: 0.1,    // Major argument arcs
      maxFrequency: 2.0,    // Claim-evidence pairs
      threshold: 0.3,
    },
    methodologyRhythm: {
      minFrequency: 0.2,    // Method sections
      maxFrequency: 1.0,    // Procedural steps
      threshold: 0.35,
    },
    evidenceIntegration: {
      minFrequency: 1.0,    // Evidence presentation
      maxFrequency: 5.0,    // Data points
      threshold: 0.2,
    },
  };
  
  // Research features to analyze
  readonly features = {
    // Citation features
    citationDensity: { weight: 0.15, normalize: true },
    citationDiversity: { weight: 0.10, normalize: true },
    citationRecency: { weight: 0.08, normalize: true },
    
    // Argument features
    claimClarity: { weight: 0.12, normalize: true },
    evidenceStrength: { weight: 0.15, normalize: true },
    logicalCoherence: { weight: 0.10, normalize: true },
    
    // Methodology features
    methodRigor: { weight: 0.10, normalize: true },
    dataQuality: { weight: 0.10, normalize: true },
    
    // Synthesis features
    noveltyScore: { weight: 0.10, normalize: true },
  };
  
  // Transform research text to analyzable signal
  paperToSignal(text: string, metadata?: any): Float32Array {
    const sections = this.extractSections(text);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const signal = new Float32Array(sentences.length * 8);
    
    sentences.forEach((sentence, i) => {
      const baseIndex = i * 8;
      const section = this.identifySection(i, sections);
      
      // Encode research-specific features
      signal[baseIndex] = this.detectCitations(sentence);           // Citation presence
      signal[baseIndex + 1] = this.measureArgumentStrength(sentence); // Argument strength
      signal[baseIndex + 2] = this.detectMethodology(sentence);      // Methodology indicator
      signal[baseIndex + 3] = this.measureEvidence(sentence);        // Evidence quality
      signal[baseIndex + 4] = this.calculateComplexity(sentence);    // Technical complexity
      signal[baseIndex + 5] = this.detectSynthesis(sentence);        // Synthesis indicator
      signal[baseIndex + 6] = this.measureNovelty(sentence);         // Novelty score
      signal[baseIndex + 7] = this.getSectionWeight(section);        // Section importance
    });
    
    return signal;
  }
  
  private extractSections(text: string): Map<string, [number, number]> {
    const sections = new Map<string, [number, number]>();
    const sectionRegex = /(?:^|\n)(?:Abstract|Introduction|Literature Review|Methodology|Methods|Results|Discussion|Conclusion|References)/gim;
    
    const matches = Array.from(text.matchAll(sectionRegex));
    for (let i = 0; i < matches.length; i++) {
      const sectionName = matches[i][0].trim();
      const start = matches[i].index || 0;
      const end = i < matches.length - 1 ? matches[i + 1].index || text.length : text.length;
      sections.set(sectionName.toLowerCase(), [start, end]);
    }
    
    return sections;
  }
  
  private identifySection(sentenceIndex: number, sections: Map<string, [number, number]>): string {
    // Simplified - would need actual position mapping
    const position = sentenceIndex / 100; // Rough approximation
    
    for (const [section, [start, end]] of sections) {
      if (position >= start / 1000 && position <= end / 1000) {
        return section;
      }
    }
    
    return 'body';
  }
  
  private detectCitations(sentence: string): number {
    // Detect various citation formats
    const patterns = [
      /\([A-Z][a-z]+ et al\., \d{4}\)/g,     // (Smith et al., 2023)
      /\([A-Z][a-z]+ \d{4}\)/g,              // (Smith 2023)
      /\[[0-9]+\]/g,                          // [1], [2]
      /\[[A-Z][a-z]+\d{2}\]/g,               // [Smi23]
    ];
    
    let citations = 0;
    patterns.forEach(pattern => {
      const matches = sentence.match(pattern);
      if (matches) citations += matches.length;
    });
    
    return Math.min(citations / 5, 1);
  }
  
  private measureArgumentStrength(sentence: string): number {
    let strength = 0.5;
    
    // Strong argument indicators
    const strongIndicators = /therefore|consequently|thus|demonstrates|proves|confirms/gi;
    const weakIndicators = /perhaps|possibly|might|could|suggests|appears/gi;
    
    const strongMatches = sentence.match(strongIndicators) || [];
    const weakMatches = sentence.match(weakIndicators) || [];
    
    strength += strongMatches.length * 0.15;
    strength -= weakMatches.length * 0.1;
    
    // Evidence markers
    if (/data|results|findings|evidence/gi.test(sentence)) {
      strength += 0.2;
    }
    
    return Math.max(0, Math.min(1, strength));
  }
  
  private detectMethodology(sentence: string): number {
    const methodTerms = /method|procedure|protocol|technique|approach|analysis|measure|sample|participant|experiment/gi;
    const matches = sentence.match(methodTerms) || [];
    return Math.min(matches.length / 3, 1);
  }
  
  private measureEvidence(sentence: string): number {
    let score = 0;
    
    // Quantitative evidence
    if (/\d+\.?\d*%|p\s*[<>=]\s*0\.\d+|n\s*=\s*\d+/g.test(sentence)) {
      score += 0.4;
    }
    
    // Statistical terms
    if (/significant|correlation|regression|mean|median|standard deviation/gi.test(sentence)) {
      score += 0.3;
    }
    
    // Qualitative evidence
    if (/observed|interviewed|theme|pattern|category/gi.test(sentence)) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }
  
  private calculateComplexity(sentence: string): number {
    const words = sentence.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const technicalTerms = words.filter(w => w.length > 10).length;
    const complexity = (avgWordLength / 10 + technicalTerms / words.length) / 2;
    return Math.min(complexity, 1);
  }
  
  private detectSynthesis(sentence: string): number {
    const synthesisMarkers = /integrate|combine|synthesize|together|overall|holistic|comprehensive|unified/gi;
    const matches = sentence.match(synthesisMarkers) || [];
    return Math.min(matches.length / 2, 1);
  }
  
  private measureNovelty(sentence: string): number {
    const noveltyMarkers = /novel|new|first|innovative|unique|original|unprecedented|breakthrough/gi;
    const matches = sentence.match(noveltyMarkers) || [];
    return Math.min(matches.length / 2, 1);
  }
  
  private getSectionWeight(section: string): number {
    const weights = {
      abstract: 0.9,
      introduction: 0.7,
      'literature review': 0.6,
      methodology: 0.8,
      methods: 0.8,
      results: 0.9,
      discussion: 0.8,
      conclusion: 0.9,
      references: 0.3,
      body: 0.5,
    };
    
    return weights[section] || 0.5;
  }
  
  // Interpret FFT results for research patterns
  interpretHarmonics(fftResult: Float32Array): ResearchPattern[] {
    const patterns: ResearchPattern[] = [];
    const binSize = this.fftConfig.sampleRate / this.fftConfig.frequencyBins;
    
    for (let i = 0; i < fftResult.length / 2; i++) {
      const frequency = i * binSize;
      const amplitude = fftResult[i];
      const phase = fftResult[i + fftResult.length / 2];
      
      // Map frequency ranges to research patterns
      let type: ResearchPattern['type'];
      if (frequency < 0.2) {
        type = 'synthesis';     // Paper-level integration
      } else if (frequency < 0.5) {
        type = 'argument';      // Section-level arguments
      } else if (frequency < 1.0) {
        type = 'methodology';   // Method descriptions
      } else if (frequency < 2.0) {
        type = 'evidence';      // Data presentation
      } else {
        type = 'citation';      // Reference patterns
      }
      
      if (amplitude > this.getThreshold(type)) {
        patterns.push({
          type,
          frequency,
          amplitude,
          phase,
          strength: this.calculateStrength(amplitude, frequency),
          connections: this.estimateConnections(type, amplitude),
        });
      }
    }
    
    return patterns;
  }
  
  private getThreshold(type: ResearchPattern['type']): number {
    const thresholds = {
      citation: 0.2,
      methodology: 0.35,
      argument: 0.3,
      evidence: 0.25,
      synthesis: 0.4,
    };
    return thresholds[type];
  }
  
  private calculateStrength(amplitude: number, frequency: number): number {
    // Lower frequencies with high amplitude = stronger patterns
    return amplitude * (1 - frequency / 10);
  }
  
  private estimateConnections(type: ResearchPattern['type'], amplitude: number): number {
    const baseConnections = {
      citation: 5,
      methodology: 3,
      argument: 4,
      evidence: 2,
      synthesis: 6,
    };
    
    return Math.floor(baseConnections[type] * amplitude * 10);
  }
  
  // Build citation network from patterns
  buildCitationNetwork(text: string): CitationNetwork {
    const nodes: CitationNode[] = [];
    const edges: CitationEdge[] = [];
    
    // Extract citations
    const citationRegex = /\(([A-Z][a-z]+)(?:\s+et\s+al\.)?,?\s+(\d{4})\)/g;
    const citations = Array.from(text.matchAll(citationRegex));
    
    // Create nodes
    citations.forEach((match, i) => {
      const author = match[1];
      const year = parseInt(match[2]);
      
      if (!nodes.find(n => n.author === author && n.year === year)) {
        nodes.push({
          id: `${author}-${year}`,
          author,
          year,
          title: `Paper by ${author}`, // Would need actual title
          influence: Math.random() * 0.5 + 0.5,
          domain: this.inferDomain(text, match.index || 0),
        });
      }
    });
    
    // Create edges based on proximity
    for (let i = 0; i < citations.length - 1; i++) {
      const source = `${citations[i][1]}-${citations[i][2]}`;
      const target = `${citations[i + 1][1]}-${citations[i + 1][2]}`;
      
      if (source !== target) {
        edges.push({
          source,
          target,
          weight: 1 / (i + 1), // Closer citations = stronger connection
          type: this.inferRelationType(text, citations[i].index || 0, citations[i + 1].index || 0),
        });
      }
    }
    
    // Calculate centrality
    const centralityScores = this.calculateCentrality(nodes, edges);
    
    // Identify clusters
    const clusters = this.identifyClusters(nodes, edges);
    
    return { nodes, edges, centralityScores, clusters };
  }
  
  private inferDomain(text: string, position: number): string {
    // Look for domain keywords near citation
    const context = text.substring(Math.max(0, position - 100), position + 100);
    
    if (/machine learning|neural|AI|artificial intelligence/gi.test(context)) return 'AI';
    if (/quantum|physics|particle/gi.test(context)) return 'Physics';
    if (/biological|cell|gene|protein/gi.test(context)) return 'Biology';
    if (/social|society|culture|human/gi.test(context)) return 'Social Science';
    
    return 'General';
  }
  
  private inferRelationType(text: string, pos1: number, pos2: number): CitationEdge['type'] {
    const between = text.substring(pos1, pos2);
    
    if (/however|contrast|unlike|whereas/gi.test(between)) return 'challenges';
    if (/extend|build|based on|following/gi.test(between)) return 'extends';
    if (/apply|implement|use/gi.test(between)) return 'applies';
    
    return 'supports';
  }
  
  private calculateCentrality(nodes: CitationNode[], edges: CitationEdge[]): Map<string, number> {
    const centrality = new Map<string, number>();
    
    // Simple degree centrality
    nodes.forEach(node => {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      centrality.set(node.id, degree / nodes.length);
    });
    
    return centrality;
  }
  
  private identifyClusters(nodes: CitationNode[], edges: CitationEdge[]): CitationCluster[] {
    // Simplified clustering - group by domain
    const clusters: CitationCluster[] = [];
    const domains = new Set(nodes.map(n => n.domain));
    
    domains.forEach(domain => {
      const members = nodes.filter(n => n.domain === domain).map(n => n.id);
      if (members.length > 0) {
        clusters.push({
          id: `cluster-${domain}`,
          theme: domain,
          members,
          coherence: 0.7 + Math.random() * 0.3,
        });
      }
    });
    
    return clusters;
  }
  
  // Extract argument structure
  extractArgumentStructure(text: string, patterns: ResearchPattern[]): ArgumentStructure {
    const claims = this.extractClaims(text);
    const evidence = this.extractEvidence(text);
    const methodology = this.extractMethodology(text);
    const synthesis = this.extractSynthesis(text, patterns);
    const logicalFlow = this.calculateLogicalFlow(claims, evidence);
    
    return { claims, evidence, methodology, synthesis, logicalFlow };
  }
  
  private extractClaims(text: string): Claim[] {
    const claims: Claim[] = [];
    const claimIndicators = [
      { regex: /we (propose|argue|claim|hypothesize) that/gi, type: 'hypothesis' as const },
      { regex: /this (demonstrates|shows|proves) that/gi, type: 'conclusion' as const },
      { regex: /we assume that/gi, type: 'assumption' as const },
      { regex: /our thesis is/gi, type: 'thesis' as const },
    ];
    
    claimIndicators.forEach(({ regex, type }) => {
      const matches = Array.from(text.matchAll(regex));
      matches.forEach((match, i) => {
        const start = match.index || 0;
        const end = text.indexOf('.', start) + 1;
        const statement = text.substring(start, end).trim();
        
        claims.push({
          id: `claim-${type}-${i}`,
          statement,
          type,
          strength: this.assessClaimStrength(statement),
          support: [],
        });
      });
    });
    
    return claims;
  }
  
  private assessClaimStrength(statement: string): number {
    let strength = 0.5;
    
    if (/clearly|obviously|certainly|definitely/gi.test(statement)) strength += 0.2;
    if (/may|might|could|possibly/gi.test(statement)) strength -= 0.2;
    if (/evidence|data|results|findings/gi.test(statement)) strength += 0.15;
    
    return Math.max(0.1, Math.min(1, strength));
  }
  
  private extractEvidence(text: string): Evidence[] {
    const evidence: Evidence[] = [];
    const evidencePatterns = [
      { regex: /[Oo]ur (data|results|findings) show/g, type: 'empirical' as const },
      { regex: /[Tt]heoretically|[Aa]ccording to .+ theory/g, type: 'theoretical' as const },
      { regex: /(\d+\.?\d*%|p\s*[<>=]\s*0\.\d+)/g, type: 'statistical' as const },
      { regex: /[Ii]nterviews|observations|qualitative/g, type: 'qualitative' as const },
    ];
    
    evidencePatterns.forEach(({ regex, type }) => {
      const matches = Array.from(text.matchAll(regex));
      matches.forEach((match, i) => {
        evidence.push({
          id: `evidence-${type}-${i}`,
          type,
          source: match[0],
          reliability: type === 'empirical' ? 0.9 : type === 'statistical' ? 0.85 : 0.7,
          relevance: 0.8,
        });
      });
    });
    
    return evidence;
  }
  
  private extractMethodology(text: string): Methodology {
    // Find methodology section
    const methodSection = this.findSection(text, ['methodology', 'methods', 'method']);
    
    let approach = 'mixed';
    let rigor = 0.5;
    let reproducibility = 0.5;
    let validity = 0.5;
    
    if (methodSection) {
      // Determine approach
      if (/quantitative|statistical|experiment/gi.test(methodSection)) approach = 'quantitative';
      else if (/qualitative|interview|ethnograph/gi.test(methodSection)) approach = 'qualitative';
      
      // Assess rigor
      if (/control group|randomized|blind/gi.test(methodSection)) rigor += 0.3;
      if (/validated|reliable|tested/gi.test(methodSection)) rigor += 0.2;
      
      // Assess reproducibility
      if (/protocol|procedure|steps/gi.test(methodSection)) reproducibility += 0.2;
      if (/available|supplementary|repository/gi.test(methodSection)) reproducibility += 0.3;
      
      // Assess validity
      if (/limitation|bias|confound/gi.test(methodSection)) validity += 0.1;
      if (/robust|comprehensive|thorough/gi.test(methodSection)) validity += 0.2;
    }
    
    return {
      approach,
      rigor: Math.min(1, rigor),
      reproducibility: Math.min(1, reproducibility),
      validity: Math.min(1, validity),
    };
  }
  
  private findSection(text: string, sectionNames: string[]): string | null {
    for (const name of sectionNames) {
      const regex = new RegExp(`${name}[\\s\\S]*?(?=\\n[A-Z][a-z]+:|$)`, 'gi');
      const match = text.match(regex);
      if (match) return match[0];
    }
    return null;
  }
  
  private extractSynthesis(text: string, patterns: ResearchPattern[]): Synthesis {
    const synthesisSection = this.findSection(text, ['discussion', 'conclusion']);
    
    let novelty = 0.5;
    let integration = 0.5;
    const implications: string[] = [];
    const futureWork: string[] = [];
    
    if (synthesisSection) {
      // Assess novelty
      const noveltyMatches = synthesisSection.match(/novel|new|first|unique|original/gi) || [];
      novelty = Math.min(0.5 + noveltyMatches.length * 0.1, 1);
      
      // Assess integration
      const synthesisPattern = patterns.find(p => p.type === 'synthesis');
      if (synthesisPattern) {
        integration = synthesisPattern.strength;
      }
      
      // Extract implications
      const implicationMatches = Array.from(
        synthesisSection.matchAll(/implications?.*?[.!?]/gi)
      );
      implications.push(...implicationMatches.map(m => m[0]));
      
      // Extract future work
      const futureMatches = Array.from(
        synthesisSection.matchAll(/future (?:work|research|studies).*?[.!?]/gi)
      );
      futureWork.push(...futureMatches.map(m => m[0]));
    }
    
    return { novelty, integration, implications, futureWork };
  }
  
  private calculateLogicalFlow(claims: Claim[], evidence: Evidence[]): number {
    if (claims.length === 0) return 0.5;
    
    // Check if claims have supporting evidence
    const supportedClaims = claims.filter(claim => 
      evidence.some(e => e.relevance > 0.7)
    ).length;
    
    return supportedClaims / claims.length;
  }
  
  // Generate research recommendations
  generateRecommendations(
    patterns: ResearchPattern[],
    argumentStructure: ArgumentStructure,
    citationNetwork: CitationNetwork
  ): string[] {
    const recommendations: string[] = [];
    
    // Pattern-based recommendations
    const citationPatterns = patterns.filter(p => p.type === 'citation');
    if (citationPatterns.length < 2) {
      recommendations.push('Increase citation diversity to strengthen literature foundation');
    }
    
    const methodPatterns = patterns.filter(p => p.type === 'methodology');
    if (methodPatterns.some(p => p.strength < 0.5)) {
      recommendations.push('Strengthen methodology section with more detail');
    }
    
    // Argument structure recommendations
    if (argumentStructure.logicalFlow < 0.7) {
      recommendations.push('Improve logical flow by better connecting claims to evidence');
    }
    
    if (argumentStructure.claims.filter(c => c.strength > 0.7).length < 2) {
      recommendations.push('Strengthen main claims with more decisive language');
    }
    
    // Citation network recommendations
    if (citationNetwork.nodes.length < 15) {
      recommendations.push('Expand literature review with more diverse sources');
    }
    
    const recentCitations = citationNetwork.nodes.filter(n => n.year >= 2020).length;
    if (recentCitations / citationNetwork.nodes.length < 0.3) {
      recommendations.push('Include more recent publications (2020 or later)');
    }
    
    // Synthesis recommendations
    if (argumentStructure.synthesis.novelty < 0.6) {
      recommendations.push('Emphasize novel contributions more clearly');
    }
    
    if (argumentStructure.synthesis.futureWork.length === 0) {
      recommendations.push('Add future research directions to conclusion');
    }
    
    return recommendations;
  }
}

export const researchHarmonicConfig = new ResearchHarmonicConfig();