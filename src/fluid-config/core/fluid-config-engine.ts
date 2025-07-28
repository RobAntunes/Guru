import {
  FluidCognitiveConfig,
  TaskAnalysis,
  CognitiveContext,
  UserCognitiveSignature,
  OptimalCognitiveConfig,
  TaskIntent,
  ComplexityMeasure,
  DomainWeight,
  SynthesisRequirement,
  CognitiveMode,
  DynamicHarmonicConfig,
  DynamicQuantumConfig,
  DynamicTaskConfig,
  DynamicLearningConfig,
} from '../interfaces/fluid-config.interface';

export class FluidConfigEngine {
  private readonly domainPatterns = new Map<string, any>();
  private readonly modeTemplates = new Map<CognitiveMode, Partial<FluidCognitiveConfig>>();
  
  constructor() {
    this.initializeModeTemplates();
    this.initializeDomainPatterns();
  }
  
  async adaptToTask(
    taskInput: string,
    currentContext: CognitiveContext,
    userProfile: UserCognitiveSignature
  ): Promise<OptimalCognitiveConfig> {
    
    // 1. Real-time task analysis
    const taskAnalysis = await this.analyzeTaskDynamics(taskInput, currentContext);
    
    // 2. Generate fluid configuration
    const fluidConfig = await this.generateFluidConfig(taskAnalysis, userProfile);
    
    // 3. Optimize based on user profile
    const optimizedConfig = this.optimizeForUser(fluidConfig, userProfile, taskAnalysis);
    
    // 4. Generate alternatives
    const alternatives = await this.generateAlternativeConfigs(taskAnalysis, userProfile);
    
    // 5. Calculate confidence
    const confidence = this.calculateConfigConfidence(optimizedConfig, taskAnalysis, currentContext);
    
    return {
      ...optimizedConfig,
      confidence,
      alternativeConfigs: alternatives,
      reasoning: this.explainConfiguration(optimizedConfig, taskAnalysis),
    };
  }
  
  private async analyzeTaskDynamics(
    taskInput: string,
    context: CognitiveContext
  ): Promise<TaskAnalysis> {
    const intent = this.extractDeepIntent(taskInput, context);
    const complexity = this.measureCognitiveLoad(taskInput);
    const domain = this.detectPrimaryDomain(taskInput);
    const crossDomains = this.identifyCrossDomainElements(taskInput);
    const creativityLevel = this.assessCreativeRequirements(taskInput);
    const synthesisNeeds = this.detectSynthesisOpportunities(taskInput, crossDomains);
    const noveltyPotential = this.assessNoveltyPotential(taskInput, context);
    
    return {
      intent,
      complexity,
      domain,
      crossDomains,
      creativityLevel,
      synthesisNeeds,
      noveltyPotential,
    };
  }
  
  private extractDeepIntent(taskInput: string, context: CognitiveContext): TaskIntent {
    // Analyze explicit intent
    const primaryIntent = this.detectPrimaryIntent(taskInput);
    
    // Analyze implicit requirements
    const implicitIntents = this.detectImplicitIntents(taskInput, context);
    
    // Extract secondary objectives
    const secondaryIntents = this.detectSecondaryIntents(taskInput);
    
    // Calculate confidence based on clarity and context
    const confidence = this.calculateIntentConfidence(taskInput, context);
    
    return {
      primary: primaryIntent,
      secondary: secondaryIntents,
      implicit: implicitIntents,
      confidence,
    };
  }
  
  private detectPrimaryIntent(taskInput: string): string {
    const intentPatterns = {
      research: /research|investigate|study|analyze|explore/i,
      create: /create|write|design|build|develop/i,
      optimize: /optimize|improve|enhance|fix|speed up/i,
      synthesize: /connect|combine|integrate|synthesize|relate/i,
      execute: /implement|deploy|run|execute|apply/i,
    };
    
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(taskInput)) {
        return intent;
      }
    }
    
    return 'general';
  }
  
  private detectImplicitIntents(taskInput: string, context: CognitiveContext): string[] {
    const implicit: string[] = [];
    
    // Check for quality requirements
    if (/best|optimal|high.?quality|professional/i.test(taskInput)) {
      implicit.push('quality-focus');
    }
    
    // Check for speed requirements
    if (/quick|fast|asap|urgent|immediately/i.test(taskInput)) {
      implicit.push('speed-priority');
    }
    
    // Check for learning intent
    if (/understand|explain|why|how does/i.test(taskInput)) {
      implicit.push('educational');
    }
    
    // Check for innovation requirements
    if (/novel|new|innovative|creative|unique/i.test(taskInput)) {
      implicit.push('innovation-seeking');
    }
    
    // Context-based implicit intents
    if (context.history.length > 0) {
      const recentPatterns = this.analyzeRecentHistory(context.history);
      implicit.push(...recentPatterns);
    }
    
    return implicit;
  }
  
  private detectSecondaryIntents(taskInput: string): string[] {
    const secondary: string[] = [];
    
    // Multiple action detection
    const actions = taskInput.match(/\b(and|then|also|plus)\b/gi);
    if (actions && actions.length > 1) {
      secondary.push('multi-objective');
    }
    
    // Documentation intent
    if (/document|explain|comment/i.test(taskInput)) {
      secondary.push('documentation');
    }
    
    // Validation intent
    if (/test|verify|validate|check/i.test(taskInput)) {
      secondary.push('validation');
    }
    
    return secondary;
  }
  
  private calculateIntentConfidence(taskInput: string, context: CognitiveContext): number {
    let confidence = 0.5;
    
    // Clear action verbs increase confidence
    const actionVerbs = taskInput.match(/\b(create|analyze|optimize|write|build|research)\b/gi);
    if (actionVerbs) {
      confidence += actionVerbs.length * 0.1;
    }
    
    // Specific details increase confidence
    const specificDetails = taskInput.match(/".+"|'.+'|\b\w+\.\w+\b/g);
    if (specificDetails) {
      confidence += Math.min(specificDetails.length * 0.05, 0.2);
    }
    
    // Consistency with recent context
    if (context.history.length > 0) {
      const consistency = this.calculateContextConsistency(taskInput, context);
      confidence += consistency * 0.2;
    }
    
    return Math.min(confidence, 1);
  }
  
  private measureCognitiveLoad(taskInput: string): ComplexityMeasure {
    const factors: string[] = [];
    let level = 0;
    
    // Length complexity
    const wordCount = taskInput.split(/\s+/).length;
    if (wordCount > 50) {
      factors.push('long-description');
      level += 2;
    }
    
    // Technical complexity
    const technicalTerms = taskInput.match(/\b(algorithm|optimize|quantum|neural|synthesis)\b/gi);
    if (technicalTerms) {
      factors.push('technical-content');
      level += technicalTerms.length * 0.5;
    }
    
    // Multi-domain complexity
    const domainIndicators = this.countDomainIndicators(taskInput);
    if (domainIndicators > 1) {
      factors.push('cross-domain');
      level += domainIndicators * 0.5;
    }
    
    // Abstract concept complexity
    if (/theory|hypothesis|abstract|concept|framework/i.test(taskInput)) {
      factors.push('abstract-thinking');
      level += 1.5;
    }
    
    // Constraint complexity
    const constraints = taskInput.match(/\b(must|should|cannot|constraint|requirement)\b/gi);
    if (constraints) {
      factors.push('constrained-problem');
      level += constraints.length * 0.3;
    }
    
    const cognitiveLoad = Math.min(level / 10, 1);
    
    return {
      level: Math.min(level, 10),
      factors,
      cognitiveLoad,
    };
  }
  
  private detectPrimaryDomain(taskInput: string): string {
    const domainScores = new Map<string, number>();
    
    // Check each domain pattern
    for (const [domain, patterns] of this.domainPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = taskInput.match(new RegExp(pattern, 'gi'));
        if (matches) {
          score += matches.length;
        }
      }
      domainScores.set(domain, score);
    }
    
    // Find highest scoring domain
    let maxScore = 0;
    let primaryDomain = 'general';
    
    for (const [domain, score] of domainScores) {
      if (score > maxScore) {
        maxScore = score;
        primaryDomain = domain;
      }
    }
    
    return primaryDomain;
  }
  
  private identifyCrossDomainElements(taskInput: string): DomainWeight[] {
    const domainWeights: DomainWeight[] = [];
    const totalIndicators = new Map<string, number>();
    
    // Count indicators for each domain
    for (const [domain, patterns] of this.domainPatterns) {
      let count = 0;
      for (const pattern of patterns) {
        const matches = taskInput.match(new RegExp(pattern, 'gi'));
        if (matches) {
          count += matches.length;
        }
      }
      if (count > 0) {
        totalIndicators.set(domain, count);
      }
    }
    
    // Calculate total
    const total = Array.from(totalIndicators.values()).reduce((sum, count) => sum + count, 0);
    
    // Convert to weights
    for (const [domain, count] of totalIndicators) {
      domainWeights.push({
        domain,
        weight: count / total,
      });
    }
    
    // Sort by weight
    domainWeights.sort((a, b) => b.weight - a.weight);
    
    return domainWeights;
  }
  
  private assessCreativeRequirements(taskInput: string): number {
    let creativityLevel = 0.3; // Base level
    
    // Creative action words
    if (/create|design|imagine|invent|innovative|novel/i.test(taskInput)) {
      creativityLevel += 0.3;
    }
    
    // Open-ended requirements
    if (/new|unique|original|creative|different/i.test(taskInput)) {
      creativityLevel += 0.2;
    }
    
    // Synthesis requirements
    if (/combine|blend|merge|integrate|synthesize/i.test(taskInput)) {
      creativityLevel += 0.2;
    }
    
    // Constraints reduce creativity needs
    if (/exactly|precisely|specific|follow|match/i.test(taskInput)) {
      creativityLevel -= 0.2;
    }
    
    return Math.max(0, Math.min(1, creativityLevel));
  }
  
  private detectSynthesisOpportunities(
    taskInput: string,
    crossDomains: DomainWeight[]
  ): SynthesisRequirement {
    const synthesisKeywords = /connect|relate|combine|integrate|synthesize|bridge|link/i;
    const needed = synthesisKeywords.test(taskInput) || crossDomains.length > 1;
    
    let depth = 0;
    if (needed) {
      // Base depth from keywords
      const matches = taskInput.match(synthesisKeywords);
      depth = matches ? matches.length * 0.3 : 0.3;
      
      // Increase depth for multiple domains
      depth += crossDomains.length * 0.2;
      
      // Deep synthesis indicators
      if (/fundamental|underlying|universal|core|essence/i.test(taskInput)) {
        depth += 0.4;
      }
    }
    
    return {
      needed,
      depth: Math.min(depth, 1),
      domains: crossDomains.map(d => d.domain),
    };
  }
  
  private assessNoveltyPotential(taskInput: string, context: CognitiveContext): number {
    let novelty = 0.5;
    
    // Novel indicators
    if (/novel|new|innovative|breakthrough|discover|unprecedented/i.test(taskInput)) {
      novelty += 0.3;
    }
    
    // Research/exploration indicators
    if (/research|explore|investigate|hypothesis|theory/i.test(taskInput)) {
      novelty += 0.2;
    }
    
    // Cross-domain work increases novelty potential
    const domains = this.identifyCrossDomainElements(taskInput);
    if (domains.length > 2) {
      novelty += 0.2;
    }
    
    // Reduce if asking for known solutions
    if (/standard|common|typical|usual|traditional/i.test(taskInput)) {
      novelty -= 0.3;
    }
    
    return Math.max(0, Math.min(1, novelty));
  }
  
  private async generateFluidConfig(
    taskAnalysis: TaskAnalysis,
    userProfile: UserCognitiveSignature
  ): Promise<FluidCognitiveConfig> {
    // Select cognitive mode
    const cognitiveMode = this.selectCognitiveMode(taskAnalysis);
    
    // Generate configurations
    const harmonicConfig = this.generateHarmonicConfig(taskAnalysis);
    const quantumConfig = this.generateQuantumConfig(taskAnalysis);
    const taskConfig = this.generateTaskConfig(taskAnalysis);
    const learningConfig = this.generateLearningConfig(taskAnalysis);
    
    // Calculate adaptation speed
    const adaptationSpeed = this.calculateAdaptationSpeed(taskAnalysis);
    
    // Generate cross-pollination insights
    const crossPollination = await this.generateCrossPollination(taskAnalysis);
    
    return {
      dynamicReconfiguration: {
        taskContext: taskAnalysis.intent.primary,
        cognitiveMode,
        adaptationSpeed,
        crossPollination,
      },
      cognitiveBoosts: {
        universalSynthesis: {
          enabled: taskAnalysis.synthesisNeeds.needed || taskAnalysis.crossDomains.length > 1,
          depth: taskAnalysis.synthesisNeeds.depth,
          domainSpan: taskAnalysis.crossDomains.length,
          noveltyThreshold: taskAnalysis.noveltyPotential,
        },
        thoughtExploration: {
          enabled: taskAnalysis.complexity.level > 5 || taskAnalysis.noveltyPotential > 0.5,
          explorationDepth: Math.floor(taskAnalysis.complexity.level),
          pathwayTests: 5,
          confidenceThreshold: 0.7,
        },
        emergentInsights: {
          enabled: taskAnalysis.noveltyPotential > 0.6,
          interferenceMode: taskAnalysis.creativityLevel > 0.7 ? 'constructive' : 'mixed',
          discoveryAmplification: taskAnalysis.noveltyPotential,
        },
      },
      harmonicConfig,
      quantumConfig,
      taskConfig,
      learningConfig,
    };
  }
  
  private selectCognitiveMode(taskAnalysis: TaskAnalysis): CognitiveMode {
    // Complex mode selection based on task characteristics
    if (taskAnalysis.synthesisNeeds.needed && taskAnalysis.domain === 'research') {
      return 'synthesis-heavy-research';
    }
    
    if (taskAnalysis.intent.primary === 'optimize' && taskAnalysis.domain === 'coding') {
      return 'analytical-optimization';
    }
    
    if (taskAnalysis.creativityLevel > 0.7) {
      return 'creative-exploration';
    }
    
    if (taskAnalysis.crossDomains.length > 2) {
      return 'synthesis';
    }
    
    // Map primary intent to mode
    const intentModeMap: Record<string, CognitiveMode> = {
      research: 'research',
      create: 'creative',
      optimize: 'analytical',
      synthesize: 'synthesis',
      execute: 'execution',
    };
    
    return intentModeMap[taskAnalysis.intent.primary] || 'hybrid';
  }
  
  private generateHarmonicConfig(taskAnalysis: TaskAnalysis): DynamicHarmonicConfig {
    // Determine pattern depth based on complexity
    let patternDepth: DynamicHarmonicConfig['patternDepth'];
    if (taskAnalysis.complexity.level < 3) {
      patternDepth = 'shallow';
    } else if (taskAnalysis.complexity.level < 6) {
      patternDepth = 'moderate';
    } else if (taskAnalysis.complexity.level < 9) {
      patternDepth = 'deep';
    } else {
      patternDepth = 'adaptive';
    }
    
    // Select resonance mode
    let resonanceMode: DynamicHarmonicConfig['resonanceMode'];
    if (taskAnalysis.crossDomains.length > 1) {
      resonanceMode = 'cross-domain-discovery';
    } else if (taskAnalysis.intent.primary === 'optimize') {
      resonanceMode = 'efficiency-detection';
    } else if (taskAnalysis.creativityLevel > 0.6) {
      resonanceMode = 'creative-exploration';
    } else if (taskAnalysis.synthesisNeeds.needed) {
      resonanceMode = 'synthesis-optimization';
    } else {
      resonanceMode = 'single-domain';
    }
    
    return {
      patternDepth,
      domainBlending: taskAnalysis.crossDomains,
      resonanceMode,
      creativeAmplification: taskAnalysis.creativityLevel,
    };
  }
  
  private generateQuantumConfig(taskAnalysis: TaskAnalysis): DynamicQuantumConfig {
    // Memory horizon based on task scope
    let memoryHorizon: DynamicQuantumConfig['memoryHorizon'];
    if (taskAnalysis.intent.implicit.includes('speed-priority')) {
      memoryHorizon = 'immediate';
    } else if (taskAnalysis.complexity.level < 4) {
      memoryHorizon = 'short';
    } else if (taskAnalysis.synthesisNeeds.needed) {
      memoryHorizon = 'extended';
    } else if (taskAnalysis.intent.primary === 'optimize') {
      memoryHorizon = 'targeted';
    } else {
      memoryHorizon = 'adaptive';
    }
    
    // Interference patterns
    let interferencePatterns: DynamicQuantumConfig['interferencePatterns'];
    if (taskAnalysis.synthesisNeeds.needed) {
      interferencePatterns = 'constructive-synthesis';
    } else if (taskAnalysis.intent.primary === 'optimize') {
      interferencePatterns = 'solution-convergent';
    } else if (taskAnalysis.creativityLevel > 0.7) {
      interferencePatterns = 'creative-divergent';
    } else if (taskAnalysis.intent.primary === 'research') {
      interferencePatterns = 'discovery-oriented';
    } else {
      interferencePatterns = 'analytical-focused';
    }
    
    // Entanglement depth
    let entanglementDepth: DynamicQuantumConfig['entanglementDepth'];
    if (taskAnalysis.crossDomains.length === 1) {
      entanglementDepth = 'minimal';
    } else if (taskAnalysis.crossDomains.length === 2) {
      entanglementDepth = 'moderate';
    } else if (taskAnalysis.synthesisNeeds.depth > 0.7) {
      entanglementDepth = 'maximum';
    } else {
      entanglementDepth = 'deep';
    }
    
    return {
      memoryHorizon,
      interferencePatterns,
      entanglementDepth,
      discoveryAmplification: taskAnalysis.noveltyPotential,
    };
  }
  
  private generateTaskConfig(taskAnalysis: TaskAnalysis): DynamicTaskConfig {
    // Evolution rate
    const evolutionRate = taskAnalysis.intent.implicit.includes('speed-priority')
      ? 0.1
      : taskAnalysis.complexity.level > 7
      ? 'adaptive'
      : 0.3;
    
    // Mutation probability based on creativity needs
    const mutationProbability = taskAnalysis.creativityLevel;
    
    // Fitness function
    let fitnessFunction: string;
    if (taskAnalysis.intent.primary === 'research') {
      fitnessFunction = 'novelty * rigor * clarity';
    } else if (taskAnalysis.intent.primary === 'optimize') {
      fitnessFunction = 'efficiency * correctness';
    } else if (taskAnalysis.creativityLevel > 0.7) {
      fitnessFunction = 'originality * quality * impact';
    } else {
      fitnessFunction = 'quality * completeness * efficiency';
    }
    
    // Cross-pollination rate
    const crossPollinationRate = Math.min(
      taskAnalysis.crossDomains.length / 3,
      taskAnalysis.synthesisNeeds.depth
    );
    
    return {
      evolutionRate,
      mutationProbability,
      fitnessFunction,
      crossPollinationRate,
    };
  }
  
  private generateLearningConfig(taskAnalysis: TaskAnalysis): DynamicLearningConfig {
    // Exploration rate
    const explorationRate = taskAnalysis.noveltyPotential * 0.5 + 
                          taskAnalysis.creativityLevel * 0.3 +
                          (taskAnalysis.intent.implicit.includes('innovation-seeking') ? 0.2 : 0);
    
    // Strategy evolution
    const strategyEvolution = {
      enabled: taskAnalysis.complexity.level > 5,
      adaptationSpeed: taskAnalysis.intent.implicit.includes('speed-priority') ? 100 : 500,
      strategySpace: this.determineStrategySpace(taskAnalysis),
    };
    
    // Feedback sensitivity
    const feedbackSensitivity = taskAnalysis.intent.implicit.includes('quality-focus') ? 0.9 : 0.7;
    
    // Transfer learning
    const transferLearning = {
      enabled: taskAnalysis.crossDomains.length > 1,
      transferRate: taskAnalysis.synthesisNeeds.depth,
      domains: taskAnalysis.crossDomains.map(d => d.domain),
    };
    
    return {
      explorationRate: Math.min(explorationRate, 0.9),
      strategyEvolution,
      feedbackSensitivity,
      transferLearning,
    };
  }
  
  private calculateAdaptationSpeed(taskAnalysis: TaskAnalysis): number {
    // Base speed (milliseconds)
    let speed = 500;
    
    // Faster for urgent tasks
    if (taskAnalysis.intent.implicit.includes('speed-priority')) {
      speed *= 0.5;
    }
    
    // Slower for complex tasks
    speed *= (1 + taskAnalysis.complexity.level / 10);
    
    // Faster for single domain
    if (taskAnalysis.crossDomains.length === 1) {
      speed *= 0.8;
    }
    
    return Math.floor(speed);
  }
  
  private async generateCrossPollination(taskAnalysis: TaskAnalysis): Promise<any[]> {
    const insights = [];
    
    // Generate insights for each cross-domain combination
    for (let i = 0; i < taskAnalysis.crossDomains.length - 1; i++) {
      for (let j = i + 1; j < taskAnalysis.crossDomains.length; j++) {
        const source = taskAnalysis.crossDomains[i];
        const target = taskAnalysis.crossDomains[j];
        
        insights.push({
          sourceDomain: source.domain,
          targetDomain: target.domain,
          insight: `Apply ${source.domain} patterns to ${target.domain}`,
          confidence: source.weight * target.weight,
          applicability: 0.7,
        });
      }
    }
    
    return insights;
  }
  
  private optimizeForUser(
    config: FluidCognitiveConfig,
    userProfile: UserCognitiveSignature,
    taskAnalysis: TaskAnalysis
  ): FluidCognitiveConfig {
    const optimized = { ...config };
    
    // Adjust for user's preferred modes
    if (userProfile.preferredModes.includes(config.dynamicReconfiguration.cognitiveMode)) {
      // Boost confidence in familiar modes
      optimized.harmonicConfig.creativeAmplification *= 1.1;
    }
    
    // Adjust for user's domain expertise
    const primaryDomainExpertise = userProfile.domainExpertise[taskAnalysis.domain] || 0;
    if (primaryDomainExpertise > 0.7) {
      // Expert users can handle more complexity
      if (optimized.quantumConfig.entanglementDepth === 'moderate') {
        optimized.quantumConfig.entanglementDepth = 'deep';
      }
    }
    
    // Adjust for learning style
    if (userProfile.learningStyle === 'exploratory') {
      optimized.learningConfig.explorationRate = Math.min(
        optimized.learningConfig.explorationRate * 1.2,
        0.9
      );
    }
    
    return optimized;
  }
  
  private async generateAlternativeConfigs(
    taskAnalysis: TaskAnalysis,
    userProfile: UserCognitiveSignature
  ): Promise<FluidCognitiveConfig[]> {
    const alternatives: FluidCognitiveConfig[] = [];
    
    // Generate a more creative alternative
    if (taskAnalysis.creativityLevel < 0.8) {
      const creativeAnalysis = { ...taskAnalysis, creativityLevel: 0.8 };
      const creativeConfig = await this.generateFluidConfig(creativeAnalysis, userProfile);
      alternatives.push(creativeConfig);
    }
    
    // Generate a more analytical alternative
    if (taskAnalysis.intent.primary !== 'optimize') {
      const analyticalAnalysis = { ...taskAnalysis, intent: { ...taskAnalysis.intent, primary: 'optimize' } };
      const analyticalConfig = await this.generateFluidConfig(analyticalAnalysis, userProfile);
      alternatives.push(analyticalConfig);
    }
    
    return alternatives.slice(0, 2); // Max 2 alternatives
  }
  
  private calculateConfigConfidence(
    config: FluidCognitiveConfig,
    taskAnalysis: TaskAnalysis,
    context: CognitiveContext
  ): number {
    let confidence = 0.5;
    
    // Task clarity affects confidence
    confidence += taskAnalysis.intent.confidence * 0.2;
    
    // Domain match
    if (taskAnalysis.crossDomains.length === 1) {
      confidence += 0.1; // Single domain is clearer
    }
    
    // Historical performance
    if (context.performance.taskCompletionRate > 0.8) {
      confidence += 0.1;
    }
    
    // Mode familiarity
    if (context.history.some(h => h.domain === taskAnalysis.domain)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 0.95);
  }
  
  private explainConfiguration(
    config: FluidCognitiveConfig,
    taskAnalysis: TaskAnalysis
  ): string {
    const explanations: string[] = [];
    
    // Explain mode selection
    explanations.push(
      `Selected ${config.dynamicReconfiguration.cognitiveMode} mode based on ${taskAnalysis.intent.primary} intent`
    );
    
    // Explain key configurations
    if (config.quantumConfig.entanglementDepth === 'maximum') {
      explanations.push('Maximum entanglement for deep cross-domain synthesis');
    }
    
    if (config.harmonicConfig.creativeAmplification > 0.7) {
      explanations.push('High creative amplification for innovative solutions');
    }
    
    if (config.cognitiveBoosts.universalSynthesis.enabled) {
      explanations.push(`Knowledge synthesis across ${taskAnalysis.crossDomains.length} domains`);
    }
    
    return explanations.join('. ');
  }
  
  private countDomainIndicators(taskInput: string): number {
    let count = 0;
    for (const [_, patterns] of this.domainPatterns) {
      for (const pattern of patterns) {
        if (new RegExp(pattern, 'i').test(taskInput)) {
          count++;
          break; // Count each domain only once
        }
      }
    }
    return count;
  }
  
  private analyzeRecentHistory(history: TaskAnalysis[]): string[] {
    const patterns: string[] = [];
    
    // Look for repeated domains
    const domainCounts = new Map<string, number>();
    history.forEach(h => {
      const count = domainCounts.get(h.domain) || 0;
      domainCounts.set(h.domain, count + 1);
    });
    
    // Find dominant domain
    for (const [domain, count] of domainCounts) {
      if (count > history.length / 2) {
        patterns.push(`${domain}-focused`);
      }
    }
    
    // Check for exploration pattern
    const uniqueDomains = new Set(history.map(h => h.domain)).size;
    if (uniqueDomains > history.length * 0.7) {
      patterns.push('exploratory');
    }
    
    return patterns;
  }
  
  private calculateContextConsistency(taskInput: string, context: CognitiveContext): number {
    if (context.history.length === 0) return 0.5;
    
    const recentDomain = context.history[context.history.length - 1].domain;
    const currentDomain = this.detectPrimaryDomain(taskInput);
    
    return currentDomain === recentDomain ? 0.8 : 0.3;
  }
  
  private determineStrategySpace(taskAnalysis: TaskAnalysis): string[] {
    const strategies: string[] = [];
    
    // Add strategies based on task characteristics
    if (taskAnalysis.intent.primary === 'research') {
      strategies.push('systematic-exploration', 'hypothesis-driven', 'literature-based');
    }
    
    if (taskAnalysis.creativityLevel > 0.6) {
      strategies.push('divergent-thinking', 'associative', 'generative');
    }
    
    if (taskAnalysis.intent.primary === 'optimize') {
      strategies.push('iterative-refinement', 'constraint-based', 'performance-focused');
    }
    
    if (taskAnalysis.synthesisNeeds.needed) {
      strategies.push('integrative', 'pattern-matching', 'cross-pollination');
    }
    
    // Default strategies
    if (strategies.length === 0) {
      strategies.push('balanced', 'adaptive', 'goal-oriented');
    }
    
    return strategies;
  }
  
  private initializeModeTemplates() {
    // Initialize templates for quick mode switching
    this.modeTemplates.set('research', {
      harmonicConfig: {
        patternDepth: 'deep',
        resonanceMode: 'cross-domain-discovery',
        creativeAmplification: 0.6,
        domainBlending: [],
      },
      quantumConfig: {
        memoryHorizon: 'extended',
        interferencePatterns: 'discovery-oriented',
        entanglementDepth: 'deep',
        discoveryAmplification: 0.8,
      },
    });
    
    this.modeTemplates.set('creative', {
      harmonicConfig: {
        patternDepth: 'adaptive',
        resonanceMode: 'creative-exploration',
        creativeAmplification: 0.9,
        domainBlending: [],
      },
      quantumConfig: {
        memoryHorizon: 'adaptive',
        interferencePatterns: 'creative-divergent',
        entanglementDepth: 'maximum',
        discoveryAmplification: 0.9,
      },
    });
    
    this.modeTemplates.set('analytical', {
      harmonicConfig: {
        patternDepth: 'moderate',
        resonanceMode: 'efficiency-detection',
        creativeAmplification: 0.3,
        domainBlending: [],
      },
      quantumConfig: {
        memoryHorizon: 'targeted',
        interferencePatterns: 'solution-convergent',
        entanglementDepth: 'minimal',
        discoveryAmplification: 0.3,
      },
    });
  }
  
  private initializeDomainPatterns() {
    this.domainPatterns.set('coding', [
      'function', 'variable', 'algorithm', 'code', 'program', 'software',
      'debug', 'optimize', 'implement', 'class', 'method', 'api',
    ]);
    
    this.domainPatterns.set('research', [
      'research', 'study', 'hypothesis', 'theory', 'evidence', 'analysis',
      'paper', 'citation', 'methodology', 'results', 'conclusion', 'experiment',
    ]);
    
    this.domainPatterns.set('writing', [
      'write', 'story', 'narrative', 'character', 'plot', 'chapter',
      'paragraph', 'sentence', 'style', 'tone', 'voice', 'dialogue',
    ]);
    
    this.domainPatterns.set('business', [
      'strategy', 'market', 'revenue', 'customer', 'product', 'service',
      'profit', 'growth', 'competition', 'analysis', 'roi', 'kpi',
    ]);
    
    this.domainPatterns.set('science', [
      'quantum', 'physics', 'biology', 'chemistry', 'experiment', 'data',
      'observation', 'measurement', 'hypothesis', 'control', 'variable',
    ]);
  }
}