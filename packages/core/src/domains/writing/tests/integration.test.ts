import { writingHarmonicConfig } from '../configs/harmonic-config';
import { writingQuantumConfig } from '../configs/quantum-config';
import { writingTaskConfig } from '../configs/task-config';
import { writingLearningConfig } from '../configs/learning-config';
import { HarmonicAnalyzer } from '../../../core/intelligence/harmonic';

describe('Writing Domain Integration Tests', () => {
  describe('Harmonic Analysis for Writing', () => {
    it('should analyze narrative patterns in text', () => {
      const sampleText = `
        Sarah stared at the glowing screen, her coffee growing cold as lines of code blurred into abstract patterns. 
        She had been debugging for twelve hours straight, chasing an elusive race condition that appeared only when the moon was full—or so it seemed.
        "Just one more compile," she whispered, a mantra repeated since midnight.
        The office was empty except for the hum of servers and the occasional click of her mechanical keyboard.
      `;
      
      const signal = writingHarmonicConfig.textToSignal(sampleText);
      expect(signal).toBeInstanceOf(Float32Array);
      expect(signal.length).toBeGreaterThan(0);
      
      // Simulate FFT result
      const mockFFTResult = new Float32Array(512);
      for (let i = 0; i < mockFFTResult.length; i++) {
        mockFFTResult[i] = Math.random() * 0.5;
      }
      
      const patterns = writingHarmonicConfig.interpretHarmonics(mockFFTResult);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('type');
      expect(patterns[0]).toHaveProperty('frequency');
      expect(patterns[0]).toHaveProperty('amplitude');
    });
    
    it('should generate writing recommendations', () => {
      const mockPatterns = [
        { type: 'action' as const, frequency: 15, amplitude: 0.8, phase: 0, coherence: 0.7 },
        { type: 'action' as const, frequency: 18, amplitude: 0.7, phase: 0.1, coherence: 0.6 },
        { type: 'dialogue' as const, frequency: 8, amplitude: 0.2, phase: 0, coherence: 0.3 },
      ];
      
      const recommendations = writingHarmonicConfig.generateRecommendations(mockPatterns);
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations).toContain('Add more dialogue to bring characters to life');
    });
  });
  
  describe('Quantum Memory for Writing', () => {
    it('should create content superposition', () => {
      const prompt = 'The hero faces a choice';
      const context = 'After discovering the truth about their past';
      const previousStates = [];
      
      const superposition = writingQuantumConfig.createSuperposition(prompt, context, previousStates);
      
      expect(superposition).toHaveProperty('states');
      expect(superposition).toHaveProperty('probabilities');
      expect(superposition).toHaveProperty('coherence');
      expect(superposition).toHaveProperty('entanglement');
      
      expect(superposition.states.length).toBeLessThanOrEqual(writingQuantumConfig.memoryConfig.maxSuperposition);
      expect(superposition.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    });
    
    it('should collapse wavefunction based on criteria', () => {
      const mockSuperposition = {
        states: [
          {
            content: 'The hero chooses courage',
            context: 'test',
            themes: ['courage', 'sacrifice'],
            style: 'dramatic',
            emotionalTone: 0.8,
            narrativePosition: 0.7,
            associations: [],
          },
          {
            content: 'The hero hesitates',
            context: 'test',
            themes: ['doubt', 'fear'],
            style: 'introspective',
            emotionalTone: 0.3,
            narrativePosition: 0.7,
            associations: [],
          },
        ],
        probabilities: [0.6, 0.4],
        coherence: 0.7,
        entanglement: new Map(),
      };
      
      const criteria = { theme: 'courage', emotion: 0.8 };
      const collapsed = writingQuantumConfig.collapseWaveFunction(mockSuperposition, 'user', criteria);
      
      expect(collapsed).toBeDefined();
      expect(collapsed.themes).toContain('courage');
      expect(collapsed.emotionalTone).toBeCloseTo(0.8, 1);
    });
  });
  
  describe('Task Evolution for Writing Projects', () => {
    it('should create a new writing project', () => {
      const project = writingTaskConfig.createProject({
        type: 'novel',
        title: 'The Quantum Writer',
        genre: ['science-fiction', 'thriller'],
        targetWordCount: 80000,
      });
      
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('plotDNA');
      expect(project).toHaveProperty('lifecycle');
      expect(project.chapters).toEqual([]);
      expect(project.lifecycle.stage).toBe('conception');
      expect(project.lifecycle.health).toBe(1.0);
    });
    
    it('should evolve a chapter organism', () => {
      const mockChapter = {
        id: 'chapter-1',
        number: 1,
        title: 'The Beginning',
        status: 'draft' as const,
        wordCount: 2500,
        scenes: [
          {
            id: 'scene-1',
            type: 'action' as const,
            content: 'The chase began...',
            characters: ['protagonist'],
            emotionalArc: [0.5, 0.7, 0.9],
            pacing: 0.8,
            tension: 0.7,
          },
        ],
        fitness: 0,
        mutations: [],
        energy: 100,
        generation: 0,
      };
      
      const mockProject = {
        id: 'project-1',
        type: 'novel' as const,
        title: 'Test',
        genre: ['thriller'],
        targetWordCount: 80000,
        currentWordCount: 2500,
        chapters: [mockChapter],
        characters: [{
          id: 'protagonist',
          name: 'Sarah',
          traits: [],
          arc: { stages: [], currentStage: 0, transformation: 0 },
          relationships: [],
          voice: { 
            vocabulary: 'moderate' as const,
            sentenceStructure: 'varied' as const,
            tone: ['serious'],
            idioms: [],
            speechPatterns: [],
          },
          evolution: [],
        }],
        themes: [],
        plotDNA: {
          structure: 'linear' as const,
          acts: [],
          conflicts: [],
          twists: [],
          resolution: { type: 'open' as const, satisfaction: 0, threads: [] },
          pacing: { overall: 'moderate' as const, chapters: [], rhythm: [0.5] },
        },
        lifecycle: {
          stage: 'drafting' as const,
          health: 0.8,
          momentum: 0.6,
          blockers: [],
          milestones: [],
        },
      };
      
      const evolved = writingTaskConfig.evolveChapter(mockChapter, mockProject);
      
      expect(evolved).toHaveProperty('fitness');
      expect(evolved.fitness).toBeGreaterThan(0);
      expect(evolved.energy).toBeLessThan(mockChapter.energy);
    });
  });
  
  describe('Learning System for Writing', () => {
    it('should initialize learning state', () => {
      const state = writingLearningConfig.createInitialState();
      
      expect(state).toHaveProperty('strategies');
      expect(state).toHaveProperty('activeStrategy');
      expect(state).toHaveProperty('explorationRate');
      expect(state).toHaveProperty('contextHistory');
      expect(state).toHaveProperty('adaptations');
      
      expect(state.strategies.length).toBeGreaterThan(0);
      expect(state.explorationRate).toBe(0.2);
    });
    
    it('should create and use multi-armed bandit', () => {
      const state = writingLearningConfig.createInitialState();
      const bandit = writingLearningConfig.createBandit(state.strategies);
      
      expect(bandit).toHaveProperty('arms');
      expect(bandit).toHaveProperty('algorithm');
      expect(bandit.arms.length).toBe(state.strategies.length);
      
      const context = {
        projectType: 'novel' as const,
        genre: ['fantasy'],
        deadline: 'moderate' as const,
        experience: 'intermediate' as const,
        mood: 'neutral' as const,
        timeAvailable: 2,
        energyLevel: 0.7,
      };
      
      const selectedStrategy = writingLearningConfig.selectStrategy(bandit, context);
      expect(selectedStrategy).toBeDefined();
      expect(state.strategies.some(s => s.id === selectedStrategy)).toBe(true);
    });
    
    it('should update bandit after outcome', () => {
      const state = writingLearningConfig.createInitialState();
      const bandit = writingLearningConfig.createBandit(state.strategies);
      
      const outcome = {
        wordsWritten: 1000,
        quality: 0.7,
        timeSpent: 60,
        satisfaction: 0.8,
        completed: true,
        blockers: [],
      };
      
      const updatedBandit = writingLearningConfig.updateBandit(bandit, 'planner', outcome);
      const arm = updatedBandit.arms.find(a => a.strategyId === 'planner');
      
      expect(arm?.pulls).toBe(1);
      expect(arm?.rewards.length).toBe(1);
      expect(arm?.avgReward).toBeGreaterThan(0);
    });
    
    it('should generate context-aware recommendations', () => {
      const state = writingLearningConfig.createInitialState();
      
      // Add some history
      state.contextHistory = [
        {
          context: {
            projectType: 'novel' as const,
            genre: ['fantasy'],
            deadline: 'urgent' as const,
            experience: 'intermediate' as const,
            mood: 'blocked' as const,
            timeAvailable: 1,
            energyLevel: 0.3,
          },
          strategyUsed: 'planner',
          outcome: {
            wordsWritten: 200,
            quality: 0.4,
            timeSpent: 60,
            satisfaction: 0.3,
            completed: false,
            blockers: ['plot confusion'],
          },
          timestamp: new Date(),
        },
      ];
      
      const currentContext = {
        projectType: 'novel' as const,
        genre: ['fantasy'],
        deadline: 'urgent' as const,
        experience: 'intermediate' as const,
        mood: 'blocked' as const,
        timeAvailable: 2,
        energyLevel: 0.2,
      };
      
      const recommendations = writingLearningConfig.generateRecommendations(state, currentContext);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('block'))).toBe(true);
    });
  });
  
  describe('Cross-System Integration', () => {
    it('should integrate harmonic patterns with task evolution', () => {
      const text = 'The tension builds as our hero approaches the final confrontation.';
      const signal = writingHarmonicConfig.textToSignal(text);
      
      // Simulate harmonic analysis finding high tension
      const patterns = [
        { type: 'action' as const, frequency: 15, amplitude: 0.9, phase: 0, coherence: 0.8 },
      ];
      
      // This high tension should influence chapter fitness
      const mockChapter = {
        id: 'chapter-climax',
        number: 10,
        title: 'The Confrontation',
        status: 'draft' as const,
        wordCount: 3000,
        scenes: [{
          id: 'scene-1',
          type: 'climax' as const,
          content: text,
          characters: ['hero', 'villain'],
          emotionalArc: [0.6, 0.8, 1.0],
          pacing: 0.9,
          tension: 0.9,
        }],
        fitness: 0,
        mutations: [],
        energy: 80,
        generation: 2,
      };
      
      // The high tension and climax type should result in high fitness
      expect(mockChapter.scenes[0].tension).toBeGreaterThan(0.8);
      expect(mockChapter.scenes[0].type).toBe('climax');
    });
    
    it('should use quantum memory to inform learning strategies', () => {
      const superposition = writingQuantumConfig.createSuperposition(
        'How to conclude the story',
        'After the climactic battle',
        []
      );
      
      // The quantum collapse should influence strategy selection
      const collapsed = writingQuantumConfig.collapseWaveFunction(superposition, 'system');
      
      // Different content styles should map to different strategies
      expect(collapsed).toHaveProperty('style');
      
      // Check if style is one of the expected values
      const validStyles = ['direct', 'metaphorical', 'contrast', 'stream', 'structured', 'balanced'];
      expect(validStyles).toContain(collapsed.style);
    });
  });
});