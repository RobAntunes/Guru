import { BaseConfig } from '../../../core/base-config';

export interface ResearchProject {
  id: string;
  title: string;
  type: 'paper' | 'thesis' | 'grant' | 'review' | 'meta-analysis' | 'report';
  field: string[];
  status: ProjectLifecycle;
  hypotheses: HypothesisOrganism[];
  experiments: ExperimentCell[];
  literature: LiteratureGenome;
  data: DataEcosystem;
  manuscript: ManuscriptEvolution;
  collaborators: ResearcherDNA[];
  fitness: ProjectFitness;
}

export interface ProjectLifecycle {
  stage: 'conception' | 'planning' | 'execution' | 'analysis' | 'writing' | 'review' | 'published';
  health: number;
  momentum: number;
  barriers: string[];
  milestones: ResearchMilestone[];
  startDate: Date;
  currentDate: Date;
  deadline?: Date;
}

export interface HypothesisOrganism {
  id: string;
  statement: string;
  type: 'primary' | 'secondary' | 'null' | 'alternative';
  status: 'proposed' | 'testing' | 'supported' | 'rejected' | 'revised';
  confidence: number;
  evidence: EvidenceStrand[];
  mutations: HypothesisMutation[];
  offspring: HypothesisOrganism[];
  generation: number;
  fitness: number;
}

export interface EvidenceStrand {
  id: string;
  type: 'supporting' | 'contradicting' | 'neutral';
  source: string;
  strength: number;
  reliability: number;
}

export interface HypothesisMutation {
  type: 'refinement' | 'expansion' | 'constraint' | 'pivot' | 'merge';
  reason: string;
  timestamp: Date;
  impact: number;
}

export interface ExperimentCell {
  id: string;
  name: string;
  type: 'pilot' | 'main' | 'replication' | 'control' | 'validation';
  hypothesis: string; // ID reference
  design: ExperimentDesign;
  status: 'planned' | 'running' | 'completed' | 'failed' | 'paused';
  results: ResultOrganism[];
  health: number;
  replicationCount: number;
}

export interface ExperimentDesign {
  methodology: string;
  sampleSize: number;
  variables: Variable[];
  controls: string[];
  timeline: number; // days
  resources: ResourceRequirement[];
}

export interface Variable {
  name: string;
  type: 'independent' | 'dependent' | 'confounding' | 'mediating';
  measurement: string;
  range?: [number, number];
}

export interface ResourceRequirement {
  type: 'equipment' | 'personnel' | 'funding' | 'time' | 'computational';
  amount: number;
  unit: string;
  available: boolean;
}

export interface ResultOrganism {
  id: string;
  experimentId: string;
  data: any;
  significance: number;
  effectSize: number;
  interpretation: string;
  mutations: ResultMutation[];
  reproducibility: number;
}

export interface ResultMutation {
  type: 'reanalysis' | 'correction' | 'extension' | 'reinterpretation';
  description: string;
  impact: number;
}

export interface LiteratureGenome {
  papers: PaperGene[];
  reviews: ReviewChromosome[];
  gaps: KnowledgeGap[];
  trends: TrendSequence[];
  citations: CitationNetwork;
  coverage: number;
}

export interface PaperGene {
  id: string;
  title: string;
  authors: string[];
  year: number;
  relevance: number;
  quality: number;
  cited: boolean;
  notes: string;
}

export interface ReviewChromosome {
  topic: string;
  papers: string[]; // Paper IDs
  synthesis: string;
  gaps: string[];
  futureDirections: string[];
}

export interface KnowledgeGap {
  description: string;
  importance: number;
  feasibility: number;
  addressedBy?: string; // Hypothesis ID
}

export interface TrendSequence {
  pattern: string;
  timespan: [number, number];
  strength: number;
  direction: 'emerging' | 'stable' | 'declining';
}

export interface CitationNetwork {
  nodes: string[]; // Paper IDs
  edges: [string, string, number][]; // [source, target, weight]
  centrality: Map<string, number>;
  clusters: string[][];
}

export interface DataEcosystem {
  datasets: DataOrganism[];
  preprocessing: ProcessingPipeline[];
  analysis: AnalysisSpecies[];
  quality: DataQuality;
  storage: StorageHabitat;
}

export interface DataOrganism {
  id: string;
  name: string;
  type: 'raw' | 'processed' | 'derived' | 'synthetic';
  source: string;
  size: number;
  format: string;
  variables: string[];
  quality: number;
  mutations: DataMutation[];
  lineage: string[]; // Parent dataset IDs
}

export interface DataMutation {
  type: 'cleaning' | 'transformation' | 'augmentation' | 'reduction';
  operation: string;
  timestamp: Date;
  reversible: boolean;
}

export interface ProcessingPipeline {
  id: string;
  name: string;
  steps: ProcessingStep[];
  input: string[]; // Dataset IDs
  output: string[]; // Dataset IDs
  validated: boolean;
}

export interface ProcessingStep {
  operation: string;
  parameters: any;
  validation: string;
}

export interface AnalysisSpecies {
  id: string;
  name: string;
  type: 'descriptive' | 'inferential' | 'predictive' | 'exploratory';
  method: string;
  datasets: string[];
  results: any;
  confidence: number;
  reproducible: boolean;
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
}

export interface StorageHabitat {
  location: 'local' | 'cloud' | 'institutional' | 'public';
  backup: boolean;
  versioned: boolean;
  accessible: boolean;
  compliance: string[];
}

export interface ManuscriptEvolution {
  sections: SectionOrganism[];
  version: number;
  wordCount: number;
  citations: number;
  figures: FigureCell[];
  tables: TableCell[];
  revisions: RevisionHistory[];
  quality: ManuscriptQuality;
}

export interface SectionOrganism {
  id: string;
  type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion';
  content: string;
  status: 'outline' | 'draft' | 'revised' | 'final';
  wordCount: number;
  keyPoints: string[];
  mutations: SectionMutation[];
  fitness: number;
}

export interface SectionMutation {
  type: 'expansion' | 'contraction' | 'reorganization' | 'clarification';
  description: string;
  wordDelta: number;
}

export interface FigureCell {
  id: string;
  caption: string;
  type: 'graph' | 'diagram' | 'image' | 'schematic';
  dataSource: string[];
  quality: number;
}

export interface TableCell {
  id: string;
  caption: string;
  rows: number;
  columns: number;
  dataSource: string[];
  type: 'summary' | 'comparison' | 'results' | 'parameters';
}

export interface RevisionHistory {
  version: number;
  date: Date;
  author: string;
  changes: string[];
  improvement: number;
}

export interface ManuscriptQuality {
  clarity: number;
  coherence: number;
  novelty: number;
  rigor: number;
  impact: number;
}

export interface ResearcherDNA {
  id: string;
  name: string;
  role: 'lead' | 'co-author' | 'advisor' | 'analyst' | 'reviewer';
  expertise: string[];
  contribution: ContributionGene[];
  availability: number;
  reliability: number;
}

export interface ContributionGene {
  type: 'conceptualization' | 'methodology' | 'analysis' | 'writing' | 'review';
  percentage: number;
  quality: number;
}

export interface ProjectFitness {
  scientific: number;
  feasibility: number;
  impact: number;
  progress: number;
  overall: number;
}

export interface ResearchMilestone {
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  deliverables: string[];
  dependencies: string[];
  critical: boolean;
}

export class ResearchTaskConfig extends BaseConfig {
  readonly domain = 'research';
  readonly version = '1.0.0';
  
  // Evolution parameters for research projects
  readonly evolutionConfig = {
    mutationRate: 0.2,           // Higher for research flexibility
    fitnessWeights: {
      novelty: 0.25,             // Innovation importance
      rigor: 0.25,               // Methodological soundness
      feasibility: 0.20,         // Practical constraints
      impact: 0.20,              // Potential influence
      progress: 0.10,            // Completion rate
    },
    generationInterval: 14,       // Days between evolution cycles
    survivalThreshold: 0.5,       // Min fitness for continuation
  };
  
  // DNA configurations for research elements
  readonly dnaConfig = {
    hypothesis: {
      genes: ['clarity', 'testability', 'novelty', 'scope', 'relevance'],
      mutability: 0.4,           // Hypotheses should be flexible
      breedingCompatibility: 0.6, // Can merge related hypotheses
    },
    experiment: {
      genes: ['design', 'power', 'controls', 'reproducibility', 'efficiency'],
      mutability: 0.3,
      replicationBonus: 0.2,     // Fitness boost for replications
    },
    data: {
      genes: ['quality', 'quantity', 'diversity', 'accessibility', 'validity'],
      mutability: 0.2,
      inheritanceStrength: 0.8,  // Derived data inherits parent quality
    },
    manuscript: {
      genes: ['clarity', 'structure', 'argumentation', 'evidence', 'impact'],
      mutability: 0.5,           // High revision capability
      maturityThreshold: 0.8,    // Quality needed for submission
    },
  };
  
  // Lifecycle configurations
  readonly lifecycleConfig = {
    stages: {
      conception: { duration: 30, requiredFitness: 0.6 },
      planning: { duration: 60, requiredFitness: 0.7 },
      execution: { duration: 180, requiredFitness: 0.6 },
      analysis: { duration: 90, requiredFitness: 0.7 },
      writing: { duration: 90, requiredFitness: 0.75 },
      review: { duration: 60, requiredFitness: 0.8 },
      published: { duration: Infinity, requiredFitness: 0.9 },
    },
    healthFactors: {
      momentum: 0.3,
      resources: 0.25,
      collaboration: 0.25,
      quality: 0.20,
    },
  };
  
  // Create new research project
  createProject(config: {
    title: string;
    type: ResearchProject['type'];
    field: string[];
    deadline?: Date;
  }): ResearchProject {
    const projectId = `research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: projectId,
      title: config.title,
      type: config.type,
      field: config.field,
      status: {
        stage: 'conception',
        health: 1.0,
        momentum: 0.8,
        barriers: [],
        milestones: this.generateMilestones(config.type, config.deadline),
        startDate: new Date(),
        currentDate: new Date(),
        deadline: config.deadline,
      },
      hypotheses: [],
      experiments: [],
      literature: this.initializeLiteratureGenome(),
      data: this.initializeDataEcosystem(),
      manuscript: this.initializeManuscript(config.type),
      collaborators: [],
      fitness: {
        scientific: 0,
        feasibility: 0.5,
        impact: 0,
        progress: 0,
        overall: 0,
      },
    };
  }
  
  private generateMilestones(type: ResearchProject['type'], deadline?: Date): ResearchMilestone[] {
    const milestones: ResearchMilestone[] = [];
    const start = new Date();
    
    // Common milestones
    milestones.push({
      name: 'Literature Review Complete',
      description: 'Comprehensive review of existing research',
      targetDate: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000),
      deliverables: ['Literature summary', 'Gap analysis'],
      dependencies: [],
      critical: true,
    });
    
    milestones.push({
      name: 'Hypothesis Finalized',
      description: 'Clear, testable hypotheses established',
      targetDate: new Date(start.getTime() + 45 * 24 * 60 * 60 * 1000),
      deliverables: ['Hypothesis document', 'Experimental design'],
      dependencies: ['Literature Review Complete'],
      critical: true,
    });
    
    if (type === 'paper' || type === 'thesis') {
      milestones.push({
        name: 'Data Collection Complete',
        description: 'All experimental data collected',
        targetDate: new Date(start.getTime() + 180 * 24 * 60 * 60 * 1000),
        deliverables: ['Raw datasets', 'Data documentation'],
        dependencies: ['Hypothesis Finalized'],
        critical: true,
      });
      
      milestones.push({
        name: 'First Draft Complete',
        description: 'Complete manuscript draft',
        targetDate: new Date(start.getTime() + 270 * 24 * 60 * 60 * 1000),
        deliverables: ['Manuscript draft', 'Figures and tables'],
        dependencies: ['Data Collection Complete'],
        critical: true,
      });
    }
    
    if (deadline) {
      milestones.push({
        name: 'Submission Ready',
        description: 'Final manuscript ready for submission',
        targetDate: new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000),
        deliverables: ['Final manuscript', 'Supplementary materials'],
        dependencies: ['First Draft Complete'],
        critical: true,
      });
    }
    
    return milestones;
  }
  
  private initializeLiteratureGenome(): LiteratureGenome {
    return {
      papers: [],
      reviews: [],
      gaps: [],
      trends: [],
      citations: {
        nodes: [],
        edges: [],
        centrality: new Map(),
        clusters: [],
      },
      coverage: 0,
    };
  }
  
  private initializeDataEcosystem(): DataEcosystem {
    return {
      datasets: [],
      preprocessing: [],
      analysis: [],
      quality: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        timeliness: 1,
        validity: 0,
      },
      storage: {
        location: 'local',
        backup: false,
        versioned: false,
        accessible: true,
        compliance: [],
      },
    };
  }
  
  private initializeManuscript(type: ResearchProject['type']): ManuscriptEvolution {
    const sections = this.getDefaultSections(type);
    
    return {
      sections: sections.map(type => ({
        id: `section-${type}`,
        type,
        content: '',
        status: 'outline',
        wordCount: 0,
        keyPoints: [],
        mutations: [],
        fitness: 0,
      })),
      version: 0,
      wordCount: 0,
      citations: 0,
      figures: [],
      tables: [],
      revisions: [],
      quality: {
        clarity: 0,
        coherence: 0,
        novelty: 0,
        rigor: 0,
        impact: 0,
      },
    };
  }
  
  private getDefaultSections(type: ResearchProject['type']): SectionOrganism['type'][] {
    switch (type) {
      case 'paper':
        return ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];
      case 'thesis':
        return ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];
      case 'review':
        return ['abstract', 'introduction', 'methods', 'discussion', 'conclusion'];
      case 'meta-analysis':
        return ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];
      case 'grant':
        return ['abstract', 'introduction', 'methods', 'results'];
      case 'report':
        return ['abstract', 'introduction', 'methods', 'results', 'conclusion'];
      default:
        return ['abstract', 'introduction', 'discussion', 'conclusion'];
    }
  }
  
  // Evolve hypothesis organism
  evolveHypothesis(
    hypothesis: HypothesisOrganism,
    project: ResearchProject,
    evidence: EvidenceStrand[]
  ): HypothesisOrganism {
    const evolved = { ...hypothesis };
    
    // Add new evidence
    evolved.evidence.push(...evidence);
    
    // Update confidence based on evidence
    evolved.confidence = this.calculateHypothesisConfidence(evolved.evidence);
    
    // Calculate fitness
    evolved.fitness = this.calculateHypothesisFitness(evolved, project);
    
    // Update status
    evolved.status = this.updateHypothesisStatus(evolved);
    
    // Possible mutation
    if (Math.random() < this.evolutionConfig.mutationRate) {
      const mutation = this.generateHypothesisMutation(evolved, project);
      evolved.mutations.push(mutation);
      
      // Apply mutation
      evolved.statement = this.applyHypothesisMutation(evolved.statement, mutation);
      evolved.generation++;
      
      // Possible offspring
      if (evolved.fitness > 0.7 && evolved.generation > 2) {
        const offspring = this.generateHypothesisOffspring(evolved, project);
        if (offspring) {
          evolved.offspring.push(offspring);
        }
      }
    }
    
    return evolved;
  }
  
  private calculateHypothesisConfidence(evidence: EvidenceStrand[]): number {
    if (evidence.length === 0) return 0.5;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    evidence.forEach(e => {
      const weight = e.reliability;
      const value = e.type === 'supporting' ? 1 : e.type === 'contradicting' ? 0 : 0.5;
      weightedSum += value * weight * e.strength;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }
  
  private calculateHypothesisFitness(
    hypothesis: HypothesisOrganism,
    project: ResearchProject
  ): number {
    const weights = this.evolutionConfig.fitnessWeights;
    
    // Assess different aspects
    const novelty = this.assessNovelty(hypothesis, project);
    const rigor = this.assessTestability(hypothesis);
    const feasibility = this.assessFeasibility(hypothesis, project);
    const impact = this.assessPotentialImpact(hypothesis, project);
    const progress = hypothesis.status === 'supported' ? 1 : 
                    hypothesis.status === 'testing' ? 0.5 : 0.2;
    
    return (
      novelty * weights.novelty +
      rigor * weights.rigor +
      feasibility * weights.feasibility +
      impact * weights.impact +
      progress * weights.progress
    );
  }
  
  private assessNovelty(hypothesis: HypothesisOrganism, project: ResearchProject): number {
    // Check against literature
    const literatureOverlap = project.literature.papers.filter(p => 
      this.similarityScore(p.title, hypothesis.statement) > 0.7
    ).length;
    
    return Math.max(0, 1 - literatureOverlap / 10);
  }
  
  private assessTestability(hypothesis: HypothesisOrganism): number {
    // Check for measurable terms
    const measurableTerms = /measure|compare|correlate|predict|test|quantify/gi;
    const matches = hypothesis.statement.match(measurableTerms) || [];
    
    // Check for specificity
    const specificTerms = /specific|particular|defined|exact/gi;
    const specificMatches = hypothesis.statement.match(specificTerms) || [];
    
    return Math.min(1, (matches.length + specificMatches.length) / 5);
  }
  
  private assessFeasibility(hypothesis: HypothesisOrganism, project: ResearchProject): number {
    // Check against available resources
    const requiredExperiments = project.experiments.filter(e => e.hypothesis === hypothesis.id);
    const feasibleExperiments = requiredExperiments.filter(e => 
      e.design.resources.every(r => r.available)
    );
    
    if (requiredExperiments.length === 0) return 0.5;
    return feasibleExperiments.length / requiredExperiments.length;
  }
  
  private assessPotentialImpact(hypothesis: HypothesisOrganism, project: ResearchProject): number {
    // Estimate based on field and type
    let impact = 0.5;
    
    if (hypothesis.type === 'primary') impact += 0.2;
    if (project.field.includes('medicine') || project.field.includes('climate')) impact += 0.15;
    if (hypothesis.statement.includes('novel') || hypothesis.statement.includes('first')) impact += 0.15;
    
    return Math.min(1, impact);
  }
  
  private similarityScore(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  
  private updateHypothesisStatus(hypothesis: HypothesisOrganism): HypothesisOrganism['status'] {
    if (hypothesis.confidence > 0.8 && hypothesis.evidence.length > 5) {
      return 'supported';
    } else if (hypothesis.confidence < 0.2 && hypothesis.evidence.length > 5) {
      return 'rejected';
    } else if (hypothesis.evidence.length > 0) {
      return 'testing';
    } else if (hypothesis.mutations.length > 2) {
      return 'revised';
    }
    return 'proposed';
  }
  
  private generateHypothesisMutation(
    hypothesis: HypothesisOrganism,
    project: ResearchProject
  ): HypothesisMutation {
    const mutationTypes: HypothesisMutation['type'][] = [
      'refinement', 'expansion', 'constraint', 'pivot', 'merge'
    ];
    
    // Choose mutation based on evidence
    let type: HypothesisMutation['type'];
    if (hypothesis.confidence < 0.4) {
      type = 'pivot';
    } else if (hypothesis.evidence.some(e => e.type === 'contradicting')) {
      type = 'refinement';
    } else if (hypothesis.fitness > 0.7) {
      type = 'expansion';
    } else {
      type = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
    }
    
    return {
      type,
      reason: this.getMutationReason(type, hypothesis),
      timestamp: new Date(),
      impact: type === 'pivot' ? 0.8 : type === 'expansion' ? 0.4 : 0.3,
    };
  }
  
  private getMutationReason(
    type: HypothesisMutation['type'],
    hypothesis: HypothesisOrganism
  ): string {
    switch (type) {
      case 'refinement':
        return 'Clarifying based on initial evidence';
      case 'expansion':
        return 'Broadening scope due to promising results';
      case 'constraint':
        return 'Narrowing focus for better testability';
      case 'pivot':
        return 'Redirecting based on contradictory evidence';
      case 'merge':
        return 'Combining with related hypothesis';
      default:
        return 'Evolutionary optimization';
    }
  }
  
  private applyHypothesisMutation(
    statement: string,
    mutation: HypothesisMutation
  ): string {
    switch (mutation.type) {
      case 'refinement':
        return statement.replace('may', 'specifically').replace('could', 'will');
      case 'expansion':
        return statement + ' and related phenomena';
      case 'constraint':
        return statement.replace('all', 'specific').replace('general', 'particular');
      case 'pivot':
        return 'Alternative: ' + statement.replace('increases', 'decreases').replace('positive', 'negative');
      case 'merge':
        return statement + ' [merged]';
      default:
        return statement;
    }
  }
  
  private generateHypothesisOffspring(
    parent: HypothesisOrganism,
    project: ResearchProject
  ): HypothesisOrganism | null {
    if (parent.offspring.length >= 3) return null; // Limit offspring
    
    const offspring: HypothesisOrganism = {
      id: `${parent.id}-offspring-${parent.offspring.length + 1}`,
      statement: `Derived from ${parent.statement}: exploring specific mechanisms`,
      type: 'secondary',
      status: 'proposed',
      confidence: parent.confidence * 0.8,
      evidence: [],
      mutations: [],
      offspring: [],
      generation: parent.generation + 1,
      fitness: 0,
    };
    
    return offspring;
  }
  
  // Evolve experiment
  evolveExperiment(
    experiment: ExperimentCell,
    project: ResearchProject,
    results: ResultOrganism[]
  ): ExperimentCell {
    const evolved = { ...experiment };
    
    // Add results
    evolved.results.push(...results);
    
    // Update status based on results
    if (results.some(r => r.significance < 0.05)) {
      evolved.status = 'completed';
    } else if (results.length > 0 && evolved.status === 'running') {
      evolved.status = results.some(r => r.reproducibility < 0.5) ? 'paused' : 'running';
    }
    
    // Update health
    evolved.health = this.calculateExperimentHealth(evolved);
    
    // Check for replication
    if (evolved.status === 'completed' && evolved.health > 0.8) {
      evolved.replicationCount++;
    }
    
    return evolved;
  }
  
  private calculateExperimentHealth(experiment: ExperimentCell): number {
    let health = 1.0;
    
    // Penalize failed experiments
    if (experiment.status === 'failed') health -= 0.5;
    
    // Penalize paused experiments
    if (experiment.status === 'paused') health -= 0.3;
    
    // Reward completed experiments
    if (experiment.status === 'completed') health += 0.2;
    
    // Consider result quality
    const avgReproducibility = experiment.results.length > 0
      ? experiment.results.reduce((sum, r) => sum + r.reproducibility, 0) / experiment.results.length
      : 0.5;
    
    health *= avgReproducibility;
    
    return Math.max(0, Math.min(1, health));
  }
  
  // Update project fitness
  updateProjectFitness(project: ResearchProject): ProjectFitness {
    const scientific = this.calculateScientificFitness(project);
    const feasibility = this.calculateFeasibilityFitness(project);
    const impact = this.calculateImpactFitness(project);
    const progress = this.calculateProgressFitness(project);
    
    const overall = (
      scientific * 0.3 +
      feasibility * 0.2 +
      impact * 0.3 +
      progress * 0.2
    );
    
    return { scientific, feasibility, impact, progress, overall };
  }
  
  private calculateScientificFitness(project: ResearchProject): number {
    // Hypothesis quality
    const hypothesisScore = project.hypotheses.length > 0
      ? project.hypotheses.reduce((sum, h) => sum + h.fitness, 0) / project.hypotheses.length
      : 0;
    
    // Experiment quality
    const experimentScore = project.experiments.length > 0
      ? project.experiments.reduce((sum, e) => sum + e.health, 0) / project.experiments.length
      : 0;
    
    // Data quality
    const dataScore = project.data.quality.validity;
    
    // Literature coverage
    const literatureScore = project.literature.coverage;
    
    return (hypothesisScore + experimentScore + dataScore + literatureScore) / 4;
  }
  
  private calculateFeasibilityFitness(project: ResearchProject): number {
    // Resource availability
    const resourceScore = project.experiments
      .flatMap(e => e.design.resources)
      .filter(r => r.available).length / 
      Math.max(1, project.experiments.flatMap(e => e.design.resources).length);
    
    // Time feasibility
    const timeScore = project.status.deadline
      ? Math.max(0, 1 - (project.status.currentDate.getTime() - project.status.startDate.getTime()) / 
        (project.status.deadline.getTime() - project.status.startDate.getTime()))
      : 0.5;
    
    // Collaboration health
    const collaborationScore = project.collaborators.length > 0
      ? project.collaborators.reduce((sum, c) => sum + c.availability * c.reliability, 0) / project.collaborators.length
      : 0.5;
    
    return (resourceScore + timeScore + collaborationScore) / 3;
  }
  
  private calculateImpactFitness(project: ResearchProject): number {
    // Field importance
    const fieldScore = project.field.some(f => 
      ['medicine', 'climate', 'AI', 'quantum'].includes(f)
    ) ? 0.8 : 0.5;
    
    // Novelty of findings
    const noveltyScore = project.hypotheses.filter(h => h.status === 'supported').length > 0
      ? project.manuscript.quality.novelty
      : 0.3;
    
    // Potential citations (estimated)
    const citationPotential = Math.min(1, project.literature.papers.length / 50);
    
    return (fieldScore + noveltyScore + citationPotential) / 3;
  }
  
  private calculateProgressFitness(project: ResearchProject): number {
    // Milestone completion
    const completedMilestones = project.status.milestones.filter(m => m.completedDate).length;
    const totalMilestones = project.status.milestones.length;
    const milestoneScore = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;
    
    // Stage progression
    const stages = Object.keys(this.lifecycleConfig.stages);
    const currentStageIndex = stages.indexOf(project.status.stage);
    const stageScore = currentStageIndex / (stages.length - 1);
    
    // Manuscript progress
    const manuscriptScore = project.manuscript.wordCount > 0
      ? Math.min(1, project.manuscript.wordCount / 5000) // Assume 5000 words target
      : 0;
    
    return (milestoneScore + stageScore + manuscriptScore) / 3;
  }
  
  // Breed hypotheses
  breedHypotheses(
    parent1: HypothesisOrganism,
    parent2: HypothesisOrganism
  ): HypothesisOrganism | null {
    // Check compatibility
    const compatibility = this.calculateBreedingCompatibility(parent1, parent2);
    if (compatibility < this.dnaConfig.hypothesis.breedingCompatibility) {
      return null;
    }
    
    // Create hybrid hypothesis
    const hybrid: HypothesisOrganism = {
      id: `hybrid-${parent1.id}-${parent2.id}`,
      statement: this.mergeStatements(parent1.statement, parent2.statement),
      type: parent1.type === 'primary' || parent2.type === 'primary' ? 'primary' : 'secondary',
      status: 'proposed',
      confidence: (parent1.confidence + parent2.confidence) / 2,
      evidence: [],
      mutations: [{
        type: 'merge',
        reason: `Bred from ${parent1.id} and ${parent2.id}`,
        timestamp: new Date(),
        impact: 0.5,
      }],
      offspring: [],
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      fitness: 0,
    };
    
    return hybrid;
  }
  
  private calculateBreedingCompatibility(h1: HypothesisOrganism, h2: HypothesisOrganism): number {
    // Similar confidence levels
    const confidenceSimilarity = 1 - Math.abs(h1.confidence - h2.confidence);
    
    // Compatible evidence
    const evidenceCompatibility = this.assessEvidenceCompatibility(h1.evidence, h2.evidence);
    
    // Statement similarity (not too similar, not too different)
    const similarity = this.similarityScore(h1.statement, h2.statement);
    const optimalSimilarity = 1 - Math.abs(similarity - 0.5) * 2; // Peak at 0.5
    
    return (confidenceSimilarity + evidenceCompatibility + optimalSimilarity) / 3;
  }
  
  private assessEvidenceCompatibility(e1: EvidenceStrand[], e2: EvidenceStrand[]): number {
    if (e1.length === 0 || e2.length === 0) return 0.5;
    
    // Check if evidence types align
    const types1 = e1.map(e => e.type);
    const types2 = e2.map(e => e.type);
    
    const bothSupporting = types1.includes('supporting') && types2.includes('supporting');
    const bothContradicting = types1.includes('contradicting') && types2.includes('contradicting');
    
    if (bothSupporting || bothContradicting) return 0.8;
    if (types1.includes('neutral') || types2.includes('neutral')) return 0.5;
    
    return 0.2; // Conflicting evidence
  }
  
  private mergeStatements(s1: string, s2: string): string {
    // Extract key concepts from both
    const concepts1 = s1.match(/\b\w{4,}\b/g) || [];
    const concepts2 = s2.match(/\b\w{4,}\b/g) || [];
    
    // Find unique concepts
    const uniqueConcepts = [...new Set([...concepts1, ...concepts2])];
    
    // Create merged statement
    return `Integrated hypothesis combining aspects of: ${uniqueConcepts.slice(0, 5).join(', ')}`;
  }
}

export const researchTaskConfig = new ResearchTaskConfig();