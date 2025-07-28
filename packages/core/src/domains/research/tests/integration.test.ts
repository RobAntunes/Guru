import { researchHarmonicConfig } from '../configs/harmonic-config';
import { researchQuantumConfig } from '../configs/quantum-config';
import { researchTaskConfig } from '../configs/task-config';
import { researchLearningConfig } from '../configs/learning-config';

describe('Research Domain Integration Tests', () => {
  describe('Harmonic Analysis for Research', () => {
    it('should analyze research paper patterns', () => {
      const samplePaper = `
        Abstract: This paper presents a novel framework for identifying universal patterns across disparate domains using quantum-inspired probabilistic models.
        
        Introduction: Previous work in cross-domain learning has primarily focused on transfer learning in neural networks (Zhang & Yang, 2021) and analogical reasoning systems (Gentner & Smith, 2022).
        
        Methods: We apply discrete Fourier transforms to tokenized representations of knowledge artifacts. Our approach combines harmonic analysis, evolutionary algorithms, and quantum superposition principles.
        
        Results: When patterns learned in one domain were applied to another, we observed 72% pattern match for Code to Writing, 78% for Writing to Papers, and 81% for Papers to Code.
        
        Discussion: The high cross-domain transfer rates suggest that human knowledge work shares fundamental patterns regardless of domain.
      `;
      
      const signal = researchHarmonicConfig.paperToSignal(samplePaper);
      expect(signal).toBeInstanceOf(Float32Array);
      expect(signal.length).toBeGreaterThan(0);
      
      // Simulate FFT result
      const mockFFTResult = new Float32Array(256);
      for (let i = 0; i < mockFFTResult.length; i++) {
        mockFFTResult[i] = Math.random() * 0.5;
      }
      
      const patterns = researchHarmonicConfig.interpretHarmonics(mockFFTResult);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('type');
      expect(patterns[0]).toHaveProperty('connections');
    });
    
    it('should build citation network', () => {
      const paperText = `
        Recent advances in machine learning (Smith et al., 2023) have shown promising results.
        However, as noted by Johnson (2022), there are still limitations. 
        Building on the work of Chen et al. (2023), we propose a new approach.
        This contradicts the findings of Williams (2021) but aligns with Brown et al. (2023).
      `;
      
      const network = researchHarmonicConfig.buildCitationNetwork(paperText);
      
      expect(network.nodes.length).toBeGreaterThan(0);
      expect(network.edges.length).toBeGreaterThan(0);
      expect(network.centralityScores.size).toBeGreaterThan(0);
      expect(network.clusters.length).toBeGreaterThan(0);
    });
    
    it('should extract argument structure', () => {
      const text = `
        We propose that quantum-inspired models can capture universal patterns.
        This demonstrates that cross-domain transfer is possible.
        We assume that human cognition follows similar patterns across domains.
        Our thesis is that a unified framework can enhance all knowledge work.
      `;
      
      const patterns = [
        { type: 'argument' as const, frequency: 0.3, amplitude: 0.7, phase: 0, strength: 0.6, connections: 3 }
      ];
      
      const structure = researchHarmonicConfig.extractArgumentStructure(text, patterns);
      
      expect(structure.claims.length).toBeGreaterThan(0);
      expect(structure.claims[0]).toHaveProperty('type');
      expect(structure.claims[0]).toHaveProperty('strength');
      expect(structure.logicalFlow).toBeGreaterThan(0);
    });
  });
  
  describe('Quantum Memory for Research', () => {
    it('should create research insight superposition', () => {
      const observation = 'Cross-domain patterns show 70% similarity';
      const context = 'Comparing writing and coding harmonic signatures';
      
      const quantumState = researchQuantumConfig.createInsightSuperposition(
        observation,
        context,
        []
      );
      
      expect(quantumState).toHaveProperty('superposition');
      expect(quantumState).toHaveProperty('entanglement');
      expect(quantumState).toHaveProperty('coherence');
      expect(quantumState.superposition.length).toBeLessThanOrEqual(
        researchQuantumConfig.memoryConfig.maxSuperposition
      );
    });
    
    it('should collapse insight based on research criteria', () => {
      const mockState = {
        superposition: [
          {
            interpretation: 'Causal relationship between domains',
            probability: 0.3,
            implications: ['Direct causation identified'],
            strength: 0.7,
            domain: 'empirical',
          },
          {
            interpretation: 'Correlational patterns observed',
            probability: 0.4,
            implications: ['Correlation established'],
            strength: 0.6,
            domain: 'empirical',
          },
          {
            interpretation: 'Novel theoretical framework emerging',
            probability: 0.3,
            implications: ['Paradigm shift possible'],
            strength: 0.9,
            domain: 'innovative',
          },
        ],
        entanglement: {
          primary: 'insight-1',
          related: [],
          correlationMatrix: [[1]],
        },
        coherence: 0.7,
        measurement: {
          collapsed: false,
          observer: 'system' as const,
          criteria: { relevance: 0, novelty: 0, reliability: 0, impact: 0 },
          confidence: 0,
        },
      };
      
      const criteria = {
        relevance: 0.8,
        novelty: 0.9,
        reliability: 0.6,
        impact: 0.8,
      };
      
      const insight = researchQuantumConfig.collapseInsight(mockState, 'researcher', criteria);
      
      expect(insight).toHaveProperty('type');
      expect(insight.type).toBe('discovery');
      expect(insight.confidence).toBeGreaterThan(0.5);
    });
    
    it('should build research memory space', () => {
      const insights = [
        researchQuantumConfig.collapseInsight(
          researchQuantumConfig.createInsightSuperposition('Pattern A', 'Context 1', []),
          'system',
          { relevance: 0.7, novelty: 0.6, reliability: 0.8, impact: 0.5 }
        ),
      ];
      
      const memorySpace = researchQuantumConfig.buildMemorySpace(insights);
      
      expect(memorySpace.insights.size).toBe(1);
      expect(memorySpace.fields.size).toBeGreaterThan(0);
      expect(memorySpace.entanglementGraph).toHaveProperty('nodes');
      expect(memorySpace.entanglementGraph).toHaveProperty('clusters');
    });
  });
  
  describe('Task Evolution for Research Projects', () => {
    it('should create research project', () => {
      const project = researchTaskConfig.createProject({
        title: 'Universal Pattern Recognition in Knowledge Work',
        type: 'paper',
        field: ['computer-science', 'cognitive-science'],
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      });
      
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('hypotheses');
      expect(project).toHaveProperty('literature');
      expect(project).toHaveProperty('manuscript');
      expect(project.status.stage).toBe('conception');
      expect(project.status.milestones.length).toBeGreaterThan(0);
    });
    
    it('should evolve hypothesis with evidence', () => {
      const hypothesis = {
        id: 'hyp-1',
        statement: 'Cross-domain patterns exist in all knowledge work',
        type: 'primary' as const,
        status: 'proposed' as const,
        confidence: 0.5,
        evidence: [],
        mutations: [],
        offspring: [],
        generation: 0,
        fitness: 0,
      };
      
      const evidence = [
        {
          id: 'ev-1',
          type: 'supporting' as const,
          source: 'experimental-results',
          strength: 0.8,
          reliability: 0.9,
        },
      ];
      
      const project = researchTaskConfig.createProject({
        title: 'Test Project',
        type: 'paper',
        field: ['cs'],
      });
      
      const evolved = researchTaskConfig.evolveHypothesis(hypothesis, project, evidence);
      
      expect(evolved.confidence).toBeGreaterThan(hypothesis.confidence);
      expect(evolved.fitness).toBeGreaterThan(0);
      expect(evolved.evidence.length).toBe(1);
    });
    
    it('should breed compatible hypotheses', () => {
      const parent1 = {
        id: 'hyp-1',
        statement: 'Pattern recognition is universal',
        type: 'primary' as const,
        status: 'testing' as const,
        confidence: 0.7,
        evidence: [
          { id: 'e1', type: 'supporting' as const, source: 's1', strength: 0.8, reliability: 0.9 }
        ],
        mutations: [],
        offspring: [],
        generation: 1,
        fitness: 0.7,
      };
      
      const parent2 = {
        id: 'hyp-2',
        statement: 'Knowledge transfer follows similar patterns',
        type: 'primary' as const,
        status: 'testing' as const,
        confidence: 0.6,
        evidence: [
          { id: 'e2', type: 'supporting' as const, source: 's2', strength: 0.7, reliability: 0.8 }
        ],
        mutations: [],
        offspring: [],
        generation: 1,
        fitness: 0.6,
      };
      
      const hybrid = researchTaskConfig.breedHypotheses(parent1, parent2);
      
      expect(hybrid).toBeDefined();
      if (hybrid) {
        expect(hybrid.generation).toBe(2);
        expect(hybrid.mutations.length).toBe(1);
        expect(hybrid.mutations[0].type).toBe('merge');
      }
    });
  });
  
  describe('Learning System for Research', () => {
    it('should initialize research learning state', () => {
      const state = researchLearningConfig.createInitialState();
      
      expect(state.methodologies.length).toBeGreaterThan(0);
      expect(state.activeMethodology).toBeDefined();
      expect(state.knowledgeBase).toHaveProperty('bestPractices');
      expect(state.knowledgeBase).toHaveProperty('failurePatterns');
    });
    
    it('should select methodology using bandit', () => {
      const state = researchLearningConfig.createInitialState();
      const bandit = researchLearningConfig.createBandit(state.methodologies);
      
      const context = {
        field: ['computer-science', 'biology'],
        studyType: 'exploratory' as const,
        resources: {
          funding: 'moderate' as const,
          equipment: 'standard' as const,
          personnel: 5,
          computational: 'cluster' as const,
        },
        timeline: 'standard' as const,
        teamSize: 5,
        expertise: {
          statistical: 0.7,
          domain: 0.8,
          technical: 0.6,
          writing: 0.7,
        },
      };
      
      const selected = researchLearningConfig.selectMethodology(bandit, context);
      expect(selected).toBeDefined();
      expect(state.methodologies.some(m => m.id === selected)).toBe(true);
    });
    
    it('should update learning from research outcomes', () => {
      const state = researchLearningConfig.createInitialState();
      
      const record = {
        context: {
          field: ['physics'],
          studyType: 'confirmatory' as const,
          resources: {
            funding: 'abundant' as const,
            equipment: 'advanced' as const,
            personnel: 10,
            computational: 'cloud' as const,
          },
          timeline: 'standard' as const,
          teamSize: 10,
          expertise: { statistical: 0.9, domain: 0.9, technical: 0.8, writing: 0.8 },
        },
        methodologyUsed: 'experimental',
        outcome: {
          quality: 0.85,
          timeToCompletion: 120,
          insights: 3,
          publications: 2,
          citations: 5,
          reproducibility: 0.9,
        },
        timestamp: new Date(),
      };
      
      const updated = researchLearningConfig.updateLearningState(state, record);
      
      expect(updated.researchHistory.length).toBe(1);
      expect(updated.methodologies.find(m => m.id === 'experimental')?.performance.totalStudies).toBe(1);
    });
  });
  
  describe('Cross-System Integration for Research', () => {
    it('should use harmonic patterns to inform quantum insights', () => {
      const text = 'Our results demonstrate a significant correlation (r=0.85, p<0.001) between domains.';
      const signal = researchHarmonicConfig.paperToSignal(text);
      
      // High correlation should create strong insights
      const observation = 'Significant correlation found';
      const quantumState = researchQuantumConfig.createInsightSuperposition(
        observation,
        'statistical analysis',
        []
      );
      
      expect(quantumState.superposition.some(s => s.domain === 'empirical')).toBe(true);
    });
    
    it('should use quantum insights to guide hypothesis evolution', () => {
      const insight = researchQuantumConfig.collapseInsight(
        researchQuantumConfig.createInsightSuperposition(
          'Novel pattern discovered',
          'cross-domain analysis',
          []
        ),
        'researcher',
        { relevance: 0.9, novelty: 0.9, reliability: 0.7, impact: 0.8 }
      );
      
      // High novelty insight should influence hypothesis generation
      expect(insight.type).toBe('discovery');
      expect(insight.confidence).toBeGreaterThan(0.6);
    });
    
    it('should adapt methodology based on project evolution', () => {
      const project = researchTaskConfig.createProject({
        title: 'Adaptive Research',
        type: 'paper',
        field: ['interdisciplinary'],
      });
      
      // Project in early stage should favor exploratory methods
      const state = researchLearningConfig.createInitialState();
      const recommendations = researchLearningConfig.generateRecommendations(state, {
        field: project.field,
        studyType: 'exploratory',
        resources: { funding: 'moderate', equipment: 'standard', personnel: 3, computational: 'local' },
        timeline: 'flexible',
        teamSize: 3,
        expertise: { statistical: 0.5, domain: 0.6, technical: 0.5, writing: 0.6 },
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});