import { BaseConfig } from '../../../core/base-config';

export interface WritingProject {
  id: string;
  type: 'novel' | 'short-story' | 'article' | 'essay' | 'poetry' | 'screenplay';
  title: string;
  genre: string[];
  targetWordCount: number;
  currentWordCount: number;
  chapters: ChapterOrganism[];
  characters: CharacterDNA[];
  themes: ThemeEvolution[];
  plotDNA: PlotGenome;
  lifecycle: ProjectLifecycle;
}

export interface ChapterOrganism {
  id: string;
  number: number;
  title: string;
  status: 'embryo' | 'draft' | 'revision' | 'mature' | 'final';
  wordCount: number;
  scenes: SceneCell[];
  fitness: number;
  mutations: ChapterMutation[];
  energy: number;
  generation: number;
}

export interface SceneCell {
  id: string;
  type: 'action' | 'dialogue' | 'description' | 'transition' | 'climax';
  content: string;
  characters: string[];
  emotionalArc: number[];
  pacing: number;
  tension: number;
}

export interface CharacterDNA {
  id: string;
  name: string;
  traits: Trait[];
  arc: CharacterArc;
  relationships: Relationship[];
  voice: VoiceProfile;
  evolution: CharacterEvolution[];
}

export interface Trait {
  name: string;
  strength: number;
  mutable: boolean;
  expression: (context: string) => string;
}

export interface CharacterArc {
  stages: ArcStage[];
  currentStage: number;
  transformation: number;
}

export interface ArcStage {
  name: string;
  description: string;
  triggerCondition: (project: WritingProject) => boolean;
  mutations: TraitMutation[];
}

export interface TraitMutation {
  trait: string;
  change: number;
  reason: string;
}

export interface Relationship {
  characterId: string;
  type: 'ally' | 'enemy' | 'love' | 'mentor' | 'rival' | 'family';
  strength: number;
  dynamic: 'stable' | 'evolving' | 'deteriorating' | 'complex';
}

export interface VoiceProfile {
  vocabulary: 'simple' | 'moderate' | 'complex' | 'archaic';
  sentenceStructure: 'short' | 'varied' | 'long' | 'fragmentary';
  tone: string[];
  idioms: string[];
  speechPatterns: string[];
}

export interface CharacterEvolution {
  chapterId: string;
  changes: TraitMutation[];
  relationships: Relationship[];
  growth: number;
}

export interface ThemeEvolution {
  theme: string;
  introduction: number; // Chapter where introduced
  development: ThemeDevelopment[];
  culmination: number; // Chapter where resolved/peaked
  strength: number;
  symbols: string[];
}

export interface ThemeDevelopment {
  chapterId: string;
  expression: 'subtle' | 'moderate' | 'explicit';
  examples: string[];
  resonance: number;
}

export interface PlotGenome {
  structure: 'linear' | 'nonlinear' | 'circular' | 'parallel' | 'mosaic';
  acts: Act[];
  conflicts: Conflict[];
  twists: PlotTwist[];
  resolution: Resolution;
  pacing: PacingProfile;
}

export interface Act {
  number: number;
  purpose: string;
  chapters: string[];
  tensionCurve: number[];
  keyEvents: string[];
}

export interface Conflict {
  type: 'man-vs-man' | 'man-vs-self' | 'man-vs-nature' | 'man-vs-society';
  description: string;
  intensity: number;
  resolution: 'resolved' | 'ongoing' | 'escalated' | 'transformed';
}

export interface PlotTwist {
  chapterId: string;
  type: 'revelation' | 'betrayal' | 'reversal' | 'discovery';
  impact: number;
  foreshadowing: string[];
}

export interface Resolution {
  type: 'closed' | 'open' | 'ambiguous' | 'cyclical';
  satisfaction: number;
  threads: ResolutionThread[];
}

export interface ResolutionThread {
  conflict: string;
  resolution: string;
  completeness: number;
}

export interface PacingProfile {
  overall: 'slow' | 'moderate' | 'fast' | 'variable';
  chapters: ChapterPacing[];
  rhythm: number[];
}

export interface ChapterPacing {
  chapterId: string;
  pace: number; // 0-1, 0=slow, 1=fast
  techniques: string[];
}

export interface ProjectLifecycle {
  stage: 'conception' | 'outlining' | 'drafting' | 'revision' | 'final' | 'published';
  health: number;
  momentum: number;
  blockers: string[];
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  target: Date;
  achieved?: Date;
  wordCount: number;
  quality: number;
}

export interface ChapterMutation {
  type: 'split' | 'merge' | 'reorder' | 'expand' | 'compress' | 'transform';
  timestamp: Date;
  reason: string;
  impact: number;
}

export class WritingTaskConfig extends BaseConfig {
  readonly domain = 'writing';
  readonly version = '1.0.0';
  
  // Evolution parameters for writing projects
  readonly evolutionConfig = {
    mutationRate: 0.15,         // How often chapters mutate
    fitnessWeights: {
      coherence: 0.25,          // How well chapter fits story
      pacing: 0.20,             // Rhythm and flow
      characterDevelopment: 0.20, // Character growth
      themeResonance: 0.15,     // Theme expression
      readerEngagement: 0.20,   // Predicted engagement
    },
    generationInterval: 7,      // Days between evolution cycles
    survivalThreshold: 0.6,     // Min fitness to survive
  };
  
  // DNA for different writing elements
  readonly dnaConfig = {
    chapter: {
      genes: ['opening', 'development', 'climax', 'resolution', 'hook'],
      dominantTraits: ['action', 'emotion', 'revelation', 'contemplation'],
      recessiveTraits: ['exposition', 'description', 'transition'],
    },
    character: {
      genes: ['motivation', 'flaw', 'strength', 'secret', 'desire'],
      mutability: 0.3,          // How much characters can change
      arcVelocity: 0.1,         // Speed of character change
    },
    plot: {
      genes: ['inciting', 'rising', 'climax', 'falling', 'denouement'],
      twistProbability: 0.2,    // Chance of plot twist
      subplotLimit: 3,          // Max parallel plots
    },
  };
  
  // Lifecycle stages and health metrics
  readonly lifecycleConfig = {
    stages: {
      conception: { minHealth: 0.8, maxDuration: 14 }, // days
      outlining: { minHealth: 0.7, maxDuration: 30 },
      drafting: { minHealth: 0.5, maxDuration: 180 },
      revision: { minHealth: 0.6, maxDuration: 90 },
      final: { minHealth: 0.8, maxDuration: 30 },
      published: { minHealth: 0.9, maxDuration: Infinity },
    },
    healthFactors: {
      consistency: 0.3,         // Regular writing
      quality: 0.25,           // Writing quality
      progress: 0.25,          // Toward goals
      feedback: 0.20,          // Reader response
    },
    momentumDecay: 0.05,       // Daily momentum loss
  };
  
  // Create new writing project organism
  createProject(config: {
    type: WritingProject['type'];
    title: string;
    genre: string[];
    targetWordCount: number;
  }): WritingProject {
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: projectId,
      type: config.type,
      title: config.title,
      genre: config.genre,
      targetWordCount: config.targetWordCount,
      currentWordCount: 0,
      chapters: [],
      characters: [],
      themes: [],
      plotDNA: this.generatePlotDNA(config.type, config.genre),
      lifecycle: {
        stage: 'conception',
        health: 1.0,
        momentum: 0.8,
        blockers: [],
        milestones: this.generateMilestones(config.targetWordCount),
      },
    };
  }
  
  private generatePlotDNA(type: WritingProject['type'], genre: string[]): PlotGenome {
    // Generate plot structure based on type and genre
    const structure = this.selectStructure(type, genre);
    const acts = this.generateActs(structure, type);
    
    return {
      structure,
      acts,
      conflicts: this.generateConflicts(genre),
      twists: [],
      resolution: {
        type: 'open', // Will evolve
        satisfaction: 0,
        threads: [],
      },
      pacing: {
        overall: 'moderate',
        chapters: [],
        rhythm: this.generateRhythm(type),
      },
    };
  }
  
  private selectStructure(
    type: WritingProject['type'],
    genre: string[]
  ): PlotGenome['structure'] {
    if (type === 'short-story') return 'linear';
    if (genre.includes('mystery')) return 'nonlinear';
    if (genre.includes('literary')) return 'mosaic';
    if (genre.includes('epic')) return 'parallel';
    return 'linear';
  }
  
  private generateActs(structure: PlotGenome['structure'], type: WritingProject['type']): Act[] {
    const actCount = type === 'novel' ? 3 : type === 'short-story' ? 1 : 2;
    const acts: Act[] = [];
    
    for (let i = 1; i <= actCount; i++) {
      acts.push({
        number: i,
        purpose: this.getActPurpose(i, actCount),
        chapters: [],
        tensionCurve: this.generateTensionCurve(i, actCount),
        keyEvents: [],
      });
    }
    
    return acts;
  }
  
  private getActPurpose(actNumber: number, totalActs: number): string {
    if (totalActs === 1) return 'complete arc';
    if (totalActs === 2) {
      return actNumber === 1 ? 'setup and conflict' : 'resolution';
    }
    // Three act structure
    switch (actNumber) {
      case 1: return 'setup and inciting incident';
      case 2: return 'rising action and complications';
      case 3: return 'climax and resolution';
      default: return 'development';
    }
  }
  
  private generateTensionCurve(actNumber: number, totalActs: number): number[] {
    const points = 10;
    const curve: number[] = [];
    
    for (let i = 0; i < points; i++) {
      const progress = i / points;
      let tension = 0;
      
      if (actNumber === 1) {
        // Rising from calm
        tension = progress * 0.6;
      } else if (actNumber === totalActs) {
        // Peak then resolve
        tension = i < points / 2 
          ? 0.6 + progress * 0.4 
          : 1.0 - (progress - 0.5) * 0.8;
      } else {
        // Steady rise with variations
        tension = 0.4 + progress * 0.4 + Math.sin(progress * Math.PI * 2) * 0.1;
      }
      
      curve.push(Math.max(0, Math.min(1, tension)));
    }
    
    return curve;
  }
  
  private generateConflicts(genre: string[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Primary conflict based on genre
    if (genre.includes('thriller') || genre.includes('mystery')) {
      conflicts.push({
        type: 'man-vs-man',
        description: 'Protagonist versus antagonist',
        intensity: 0.8,
        resolution: 'ongoing',
      });
    }
    
    if (genre.includes('literary') || genre.includes('drama')) {
      conflicts.push({
        type: 'man-vs-self',
        description: 'Internal struggle',
        intensity: 0.7,
        resolution: 'ongoing',
      });
    }
    
    if (genre.includes('dystopian') || genre.includes('political')) {
      conflicts.push({
        type: 'man-vs-society',
        description: 'Individual against system',
        intensity: 0.9,
        resolution: 'ongoing',
      });
    }
    
    // Always add internal conflict for depth
    if (!conflicts.some(c => c.type === 'man-vs-self')) {
      conflicts.push({
        type: 'man-vs-self',
        description: 'Personal growth challenge',
        intensity: 0.5,
        resolution: 'ongoing',
      });
    }
    
    return conflicts;
  }
  
  private generateRhythm(type: WritingProject['type']): number[] {
    // Generate pacing rhythm pattern
    const rhythm: number[] = [];
    const segments = type === 'novel' ? 20 : type === 'short-story' ? 5 : 10;
    
    for (let i = 0; i < segments; i++) {
      // Create wave pattern with variation
      const base = 0.5;
      const wave = Math.sin(i * Math.PI / 4) * 0.3;
      const noise = (Math.random() - 0.5) * 0.1;
      rhythm.push(Math.max(0.2, Math.min(0.9, base + wave + noise)));
    }
    
    return rhythm;
  }
  
  private generateMilestones(targetWordCount: number): Milestone[] {
    const milestones: Milestone[] = [];
    const now = new Date();
    
    // Standard milestones
    milestones.push({
      name: 'First Chapter',
      target: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      wordCount: Math.floor(targetWordCount * 0.05),
      quality: 0,
    });
    
    milestones.push({
      name: '25% Complete',
      target: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      wordCount: Math.floor(targetWordCount * 0.25),
      quality: 0,
    });
    
    milestones.push({
      name: 'Midpoint',
      target: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      wordCount: Math.floor(targetWordCount * 0.5),
      quality: 0,
    });
    
    milestones.push({
      name: 'First Draft',
      target: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      wordCount: targetWordCount,
      quality: 0,
    });
    
    return milestones;
  }
  
  // Evolve a chapter organism
  evolveChapter(chapter: ChapterOrganism, project: WritingProject): ChapterOrganism {
    const evolved = { ...chapter };
    
    // Calculate fitness
    evolved.fitness = this.calculateChapterFitness(chapter, project);
    
    // Age the chapter
    evolved.energy = Math.max(0, chapter.energy - 0.1);
    
    // Possible mutations
    if (Math.random() < this.evolutionConfig.mutationRate) {
      const mutation = this.generateMutation(chapter, project);
      evolved.mutations.push(mutation);
      evolved.generation++;
      
      // Apply mutation effects
      evolved.scenes = this.applyMutation(chapter.scenes, mutation);
    }
    
    // Update status based on energy and fitness
    evolved.status = this.updateChapterStatus(evolved);
    
    return evolved;
  }
  
  private calculateChapterFitness(chapter: ChapterOrganism, project: WritingProject): number {
    const weights = this.evolutionConfig.fitnessWeights;
    
    const coherence = this.measureCoherence(chapter, project);
    const pacing = this.measurePacing(chapter, project);
    const charDev = this.measureCharacterDevelopment(chapter, project);
    const themeRes = this.measureThemeResonance(chapter, project);
    const engagement = this.predictEngagement(chapter);
    
    return (
      coherence * weights.coherence +
      pacing * weights.pacing +
      charDev * weights.characterDevelopment +
      themeRes * weights.themeResonance +
      engagement * weights.readerEngagement
    );
  }
  
  private measureCoherence(chapter: ChapterOrganism, project: WritingProject): number {
    // How well chapter fits with overall story
    let score = 0.5;
    
    // Check character consistency
    const chapterChars = new Set(chapter.scenes.flatMap(s => s.characters));
    const projectChars = new Set(project.characters.map(c => c.id));
    const overlap = [...chapterChars].filter(c => projectChars.has(c)).length;
    score += (overlap / chapterChars.size) * 0.2;
    
    // Check theme presence
    const themePresence = project.themes.some(t => 
      t.development.some(d => d.chapterId === chapter.id)
    );
    if (themePresence) score += 0.2;
    
    // Check plot advancement
    const plotAlignment = this.checkPlotAlignment(chapter, project);
    score += plotAlignment * 0.1;
    
    return Math.min(1, score);
  }
  
  private measurePacing(chapter: ChapterOrganism, project: WritingProject): number {
    const scenePacing = chapter.scenes.map(s => s.pacing);
    const avgPacing = scenePacing.reduce((a, b) => a + b, 0) / scenePacing.length;
    
    // Check pacing variation
    const variance = this.calculateVariance(scenePacing);
    const variation = Math.min(variance / 0.3, 1); // Ideal variance ~0.3
    
    // Check against project rhythm
    const projectRhythm = project.plotDNA.pacing.rhythm;
    const chapterIndex = project.chapters.findIndex(c => c.id === chapter.id);
    const expectedPacing = projectRhythm[chapterIndex % projectRhythm.length];
    const alignment = 1 - Math.abs(avgPacing - expectedPacing);
    
    return (variation * 0.5 + alignment * 0.5);
  }
  
  private measureCharacterDevelopment(chapter: ChapterOrganism, project: WritingProject): number {
    const chapterChars = new Set(chapter.scenes.flatMap(s => s.characters));
    if (chapterChars.size === 0) return 0.5;
    
    let developmentScore = 0;
    
    chapterChars.forEach(charId => {
      const character = project.characters.find(c => c.id === charId);
      if (character) {
        const evolution = character.evolution.find(e => e.chapterId === chapter.id);
        if (evolution) {
          developmentScore += evolution.growth;
        }
      }
    });
    
    return Math.min(developmentScore / chapterChars.size, 1);
  }
  
  private measureThemeResonance(chapter: ChapterOrganism, project: WritingProject): number {
    let resonance = 0;
    let themeCount = 0;
    
    project.themes.forEach(theme => {
      const development = theme.development.find(d => d.chapterId === chapter.id);
      if (development) {
        resonance += development.resonance;
        themeCount++;
      }
    });
    
    return themeCount > 0 ? resonance / themeCount : 0.3;
  }
  
  private predictEngagement(chapter: ChapterOrganism): number {
    // Predict reader engagement based on scene composition
    const sceneTypes = chapter.scenes.map(s => s.type);
    const typeDistribution = this.calculateDistribution(sceneTypes);
    
    // Ideal distribution
    const ideal = {
      action: 0.25,
      dialogue: 0.35,
      description: 0.20,
      transition: 0.10,
      climax: 0.10,
    };
    
    // Calculate distance from ideal
    let distance = 0;
    Object.entries(ideal).forEach(([type, idealRatio]) => {
      const actualRatio = typeDistribution[type] || 0;
      distance += Math.abs(actualRatio - idealRatio);
    });
    
    // Check emotional arc variation
    const emotionalVariation = this.calculateEmotionalVariation(chapter);
    
    // Check tension progression
    const tensionProgression = this.calculateTensionProgression(chapter);
    
    return (1 - distance / 2) * 0.5 + emotionalVariation * 0.25 + tensionProgression * 0.25;
  }
  
  private checkPlotAlignment(chapter: ChapterOrganism, project: WritingProject): number {
    // Find which act this chapter belongs to
    const act = project.plotDNA.acts.find(a => a.chapters.includes(chapter.id));
    if (!act) return 0.5;
    
    // Check if chapter advances key events
    const advancesPlot = chapter.scenes.some(s => s.type === 'climax' || s.tension > 0.7);
    
    return advancesPlot ? 0.8 : 0.5;
  }
  
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  }
  
  private calculateDistribution(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    const total = items.length;
    const distribution: Record<string, number> = {};
    Object.entries(counts).forEach(([key, count]) => {
      distribution[key] = count / total;
    });
    
    return distribution;
  }
  
  private calculateEmotionalVariation(chapter: ChapterOrganism): number {
    const emotions = chapter.scenes.flatMap(s => s.emotionalArc);
    if (emotions.length < 2) return 0.5;
    
    const variance = this.calculateVariance(emotions);
    return Math.min(variance / 0.4, 1); // Ideal variance ~0.4
  }
  
  private calculateTensionProgression(chapter: ChapterOrganism): number {
    const tensions = chapter.scenes.map(s => s.tension);
    if (tensions.length < 2) return 0.5;
    
    // Check if tension generally increases
    let increasing = 0;
    for (let i = 1; i < tensions.length; i++) {
      if (tensions[i] >= tensions[i - 1]) increasing++;
    }
    
    const progression = increasing / (tensions.length - 1);
    
    // Also check for good climax
    const maxTension = Math.max(...tensions);
    const climaxBonus = maxTension > 0.8 ? 0.2 : 0;
    
    return Math.min(progression + climaxBonus, 1);
  }
  
  private generateMutation(chapter: ChapterOrganism, project: WritingProject): ChapterMutation {
    const mutationTypes: ChapterMutation['type'][] = [
      'split', 'merge', 'reorder', 'expand', 'compress', 'transform'
    ];
    
    const type = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
    
    return {
      type,
      timestamp: new Date(),
      reason: this.getMutationReason(type, chapter, project),
      impact: Math.random() * 0.5 + 0.5,
    };
  }
  
  private getMutationReason(
    type: ChapterMutation['type'],
    chapter: ChapterOrganism,
    project: WritingProject
  ): string {
    switch (type) {
      case 'split':
        return 'Chapter too long, natural break point found';
      case 'merge':
        return 'Adjacent chapter too short, combining for better flow';
      case 'reorder':
        return 'Better narrative sequence discovered';
      case 'expand':
        return 'Key scene needs more development';
      case 'compress':
        return 'Pacing too slow, tightening narrative';
      case 'transform':
        return 'New perspective enhances story impact';
      default:
        return 'Evolutionary optimization';
    }
  }
  
  private applyMutation(scenes: SceneCell[], mutation: ChapterMutation): SceneCell[] {
    const mutated = [...scenes];
    
    switch (mutation.type) {
      case 'reorder':
        // Swap two random scenes
        if (mutated.length >= 2) {
          const i = Math.floor(Math.random() * mutated.length);
          const j = Math.floor(Math.random() * mutated.length);
          [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
        }
        break;
        
      case 'expand':
        // Duplicate and modify a scene
        if (mutated.length > 0) {
          const index = Math.floor(Math.random() * mutated.length);
          const scene = { ...mutated[index] };
          scene.id = `${scene.id}-expanded`;
          scene.content += ' [expanded content]';
          mutated.splice(index + 1, 0, scene);
        }
        break;
        
      case 'compress':
        // Remove a transition scene
        const transitionIndex = mutated.findIndex(s => s.type === 'transition');
        if (transitionIndex >= 0) {
          mutated.splice(transitionIndex, 1);
        }
        break;
        
      case 'transform':
        // Change scene type
        if (mutated.length > 0) {
          const index = Math.floor(Math.random() * mutated.length);
          const types: SceneCell['type'][] = ['action', 'dialogue', 'description'];
          mutated[index].type = types[Math.floor(Math.random() * types.length)];
        }
        break;
    }
    
    return mutated;
  }
  
  private updateChapterStatus(chapter: ChapterOrganism): ChapterOrganism['status'] {
    if (chapter.energy < 0.2) return 'final';
    if (chapter.fitness > 0.8 && chapter.generation > 3) return 'mature';
    if (chapter.generation > 1) return 'revision';
    if (chapter.wordCount > 100) return 'draft';
    return 'embryo';
  }
}

export const writingTaskConfig = new WritingTaskConfig();