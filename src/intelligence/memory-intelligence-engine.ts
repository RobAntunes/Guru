import { SymbolGraph } from '../types/index.js';

// --- Phase 1 Interfaces ---
export interface StaleClosureAnalysis {
  closureRisks: ClosureRisk[];
  captureAnalysis: CaptureAnalysis;
  lifetimeConflicts: LifetimeConflict[];
  confidence: number;
}
export interface ClosureRisk {
  symbolId: string;
  riskType: 'stale_reference' | 'memory_leak' | 'timing_issue';
  capturedVariables: string[];
  asyncBoundaries: AsyncBoundary[];
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
}
export interface CaptureAnalysis { symbolId: string; captured: string[]; evidence: string[]; }
export interface LifetimeConflict { symbolId: string; conflict: string; evidence: string[]; }
export interface AsyncBoundary { type: string; location: any; }

export interface DataFlowAnalysis {
  dataFlows: DataFlow[];
  sensitiveDataPaths: SensitiveDataPath[];
  dataLifetimes: DataLifetime[];
  flowSecurity: FlowSecurityAnalysis;
}
export interface DataFlow { sourceSymbol: string; sinkSymbols: string[]; flowPath: string[]; dataType: string; retentionRisk: number; leakRisk: number; }
export interface SensitiveDataPath {
  sourceSymbol: string;
  sinkSymbols: string[];
  evidence: string[];
  confidence: number;
}
export interface DataLifetime { symbolId: string; lifetime: number; }
export interface FlowSecurityIssue {
  symbolId: string;
  issue: string;
  evidence: string[];
  confidence: number;
}
export interface FlowSecurityAnalysis {
  issues: FlowSecurityIssue[];
  confidence: number;
}

export interface PseudoStackAnalysis {
  maxStackDepth: number;
  overflowRisk: number;
  recursionPatterns: RecursionPattern[];
  tailCallOpportunities: TailCallOptimization[];
  stackMemoryPressure: StackPressure;
}
export interface RecursionPattern { functionChain: string[]; recursionType: string; terminationCondition: any; growthPattern: string; overflowProbability: number; }
export interface TailCallOptimization { symbolId: string; opportunity: boolean; evidence: string[]; }
export interface StackPressure { symbolId: string; pressure: number; evidence: string[]; }

export interface MemoryHealthScore {
  overallScore: number;
  dimensions: { efficiency: number; safety: number; security: number; maintainability: number; scalability: number; };
  criticalIssues: CriticalMemoryIssue[];
  recommendations: MemoryRecommendation[];
}
export interface CriticalMemoryIssue { symbolId: string; issue: string; severity: string; evidence: string[]; }
export interface MemoryRecommendation { symbolId: string; recommendation: string; evidence: string[]; }

export interface MemoryIntelligenceAnalysis {
  fundamentalAnalysis: {
    staleClosure: StaleClosureAnalysis;
    dataFlow: DataFlowAnalysis;
    pseudoStack: PseudoStackAnalysis;
    memoryHealth: MemoryHealthScore;
  };
  metaMemoryAnalysis?: any;
  sideChannelAnalysis?: any;
  antiPatternAnalysis?: any;
  synthesis?: any;
  overallMemoryHealth: number;
  aiAgentRecommendations: string[];
  ownershipGraph: OwnershipGraph;
  aliasing: AliasingAnalysis[];
  lifetimeRegions: LifetimeRegion[];
  resourceLeaks: ResourceLeak[];
  apiContracts: ApiOwnershipContract[];
  memoryHotspots: MemoryHotspot[];
  dataTypePsychology: DataTypePsychology[];
  sideChannelIssues: SideChannelIssue[];
  universalMemoryAntiPatterns: UniversalMemoryAntiPattern[];
  keywordAnalysis: KeywordAnalysis[];
  flowPrediction: FlowPrediction[];
  impactAnalysis: ImpactAnalysis[];
  healthScores: HealthScore[];
}

// --- Phase 2 Interfaces (Scaffold) ---
export interface AllocationBehaviorFingerprint {
  allocationRhythm: string;
  sizeDistribution: any;
  temporalPatterns: any[];
  complexitySignature: AlgorithmicComplexitySignature;
  architecturalStyle: string;
}
export interface AlgorithmicComplexitySignature {
  memoryGrowthPattern: string;
  accessPattern: string;
  complexityClass: string;
  confidence: number;
}
export interface CacheEfficiencyAnalysis {
  cacheLineUtilization: number;
  cacheMissRisk: number;
  memoryAccessStride: number;
  hotspots: any[];
  coldspots: any[];
}
export interface ScalabilityAnalysis {
  scalabilityBottlenecks: any[];
  resourceGrowthPrediction: any;
  breakingPoints: any[];
  scalabilityScore: number;
}

// --- Ownership Graph and Advanced Borrow Checker Inference ---
export interface OwnershipEdge {
  from: string;
  to: string;
  type: 'transfer' | 'borrow' | 'move';
  evidence: string[];
}
export interface OwnershipGraph {
  nodes: string[];
  edges: OwnershipEdge[];
  cycles: string[][];
}
export interface AliasingAnalysis {
  symbolId: string;
  isAliased: boolean;
  isMutatedAfterShare: boolean;
  evidence: string[];
}
export interface LifetimeRegion {
  symbolId: string;
  validFrom: number;
  validTo: number;
  evidence: string[];
}
export interface ResourceLeak {
  symbolId: string;
  leakType: string;
  evidence: string[];
}
export interface ApiOwnershipContract {
  symbolId: string;
  takesOwnership: boolean;
  borrows: boolean;
  returnsOwnership: boolean;
  evidence: string[];
}

// --- Memory Pressure & Hotspot Analysis ---
export interface MemoryHotspot {
  symbolId: string;
  pressureScore: number;
  churnRate: number;
  allocationFrequency: number;
  retentionScore: number;
  evidence: string[];
}

// --- Data Type Psychology ---
export interface DataTypePsychology {
  symbolId: string;
  inferredType: string; // e.g., cache, buffer, pool, queue, stack, singleton, etc.
  confidence: number;
  evidence: string[];
}

// --- Side-Channel & Anti-Pattern Detection (Scaffold) ---
export interface SideChannelIssue {
  symbolId: string;
  issue: string;
  evidence: string[];
  confidence: number;
  feedback?: MemoryFeedback;
}
export interface UniversalMemoryAntiPattern {
  symbolId: string;
  pattern: string;
  evidence: string[];
  confidence: number;
  feedback?: MemoryFeedback;
}

// --- Feedback Loop Integration ---
export interface MemoryFeedback {
  status: 'none' | 'suppressed' | 'confirmed' | 'false_positive';
  userNotes?: string;
  lastUpdated?: string;
}
export interface MemoryFeedbackProvider {
  getFeedback(symbolId: string, issueType: string, evidence: string[]): Promise<MemoryFeedback>;
}

// --- Keyword Analysis ---
export interface KeywordContext {
  keyword: string;
  context: 'name' | 'docstring' | 'code';
  confidence: number;
  intent?: string;
}
export interface KeywordAnalysis {
  symbolId: string;
  keywords: KeywordContext[];
}

// --- Flow Prediction ---
export interface FlowPrediction {
  symbolId: string;
  downstream: string[];
  upstream: string[];
  confidence: number;
}

// --- Impact Analysis ---
export interface ImpactAnalysis {
  symbolId: string;
  impactedSymbols: string[];
  impactedFiles: string[];
  riskScore: number;
  confidence: number;
}

// --- Health Scoring ---
export interface HealthScore {
  symbolId: string;
  score: number;
  breakdown: { [dimension: string]: number };
  suggestions: string[];
}

export class MemoryIntelligenceEngine {
  async analyzeMemoryBehavior(symbolGraph: SymbolGraph, options: any = {}): Promise<MemoryIntelligenceAnalysis> {
    // Layer 1: Fundamental Analysis
    const staleClosure = this.analyzeStaleClosures(symbolGraph);
    const dataFlow = this.analyzeDataFlow(symbolGraph);
    const pseudoStack = this.analyzePseudoStack(symbolGraph);
    const memoryHealth = this.analyzeMemoryHealth(staleClosure, dataFlow, pseudoStack);
    // Layer 2: Meta/Performance (Phase 2 logic)
    const allocationFingerprint = this.analyzeAllocationBehavior(symbolGraph, dataFlow);
    const cacheEfficiency = this.analyzeCacheEfficiency(symbolGraph, dataFlow);
    const scalability = this.analyzeScalability(symbolGraph, dataFlow);
    // Advanced borrow checker inferences
    const ownershipGraph = this.buildOwnershipGraph(symbolGraph);
    const aliasing = this.analyzeAliasing(symbolGraph);
    const lifetimeRegions = this.mapLifetimeRegions(symbolGraph);
    const resourceLeaks = this.detectResourceLeaks(ownershipGraph);
    const apiContracts = this.inferApiOwnershipContracts(symbolGraph);
    // --- Memory Pressure & Hotspot Analysis ---
    const memoryHotspots: MemoryHotspot[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      // Heuristic: high fan-in/out, many allocations, or long lifetime = hotspot
      const allocationFrequency = (node.dependencies?.length || 0) + (node.dependents?.length || 0);
      const churnRate = Math.random() * 0.5 + 0.1; // stub: random for now
      const retentionScore = Math.random() * 0.5 + 0.1; // stub: random for now
      const pressureScore = allocationFrequency * (churnRate + retentionScore);
      if (pressureScore > 2) {
        memoryHotspots.push({
          symbolId: id,
          pressureScore,
          churnRate,
          allocationFrequency,
          retentionScore,
          evidence: [`High allocation frequency (${allocationFrequency}), churn (${churnRate.toFixed(2)}), retention (${retentionScore.toFixed(2)})`]
        });
      }
    }
    // --- Data Type Psychology ---
    const dataTypePsychology: DataTypePsychology[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      // Heuristic: classify by name, dependencies, and lifetime
      let inferredType = 'unknown';
      let confidence = 0.3;
      const name = id.toLowerCase();
      if (/cache/.test(name)) { inferredType = 'cache'; confidence = 0.9; }
      else if (/queue/.test(name)) { inferredType = 'queue'; confidence = 0.8; }
      else if (/stack/.test(name)) { inferredType = 'stack'; confidence = 0.8; }
      else if (/buffer/.test(name)) { inferredType = 'buffer'; confidence = 0.8; }
      else if (/pool/.test(name)) { inferredType = 'pool'; confidence = 0.8; }
      else if (/singleton/.test(name)) { inferredType = 'singleton'; confidence = 0.8; }
      else if ((node.dependencies?.length || 0) > 10) { inferredType = 'manager'; confidence = 0.7; }
      dataTypePsychology.push({
        symbolId: id,
        inferredType,
        confidence,
        evidence: [`Name: ${name}, dependencies: ${(node.dependencies?.length || 0)}`]
      });
    }
    // --- Side-Channel & Anti-Pattern Detection (Stubs) ---
    const feedbackProvider: MemoryFeedbackProvider | undefined = options.feedbackProvider;
    // --- ML/Heuristic-Driven Anomaly & Anti-Pattern Detection ---
    const anomalies: UniversalMemoryAntiPattern[] = [];
    const sideChannelIssues: SideChannelIssue[] = [];
    // Outlier detection: memory pressure, lifetime, allocation
    const pressureScores = Object.values(symbolGraph.symbols)
      .filter((n: any) => n.type === 'function')
      .map((n: any) => (n.dependencies?.length || 0) + (n.dependents?.length || 0));
    const mean = pressureScores.reduce((a, b) => a + b, 0) / (pressureScores.length || 1);
    const stddev = Math.sqrt(pressureScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pressureScores.length || 1));
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const allocFreq = (node.dependencies?.length || 0) + (node.dependents?.length || 0);
      // Outlier: >2 stddev above mean
      if (allocFreq > mean + 2 * stddev) {
        const evidence = [`Allocation frequency outlier: ${allocFreq} (mean=${mean.toFixed(2)}, stddev=${stddev.toFixed(2)})`];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'pressure_outlier', evidence);
        anomalies.push({
          symbolId: id,
          pattern: 'pressure_outlier',
          evidence,
          confidence: 0.9,
          feedback
        });
      }
      // Classic anti-patterns: unbounded growth, ghost references, etc.
      if (/global|window|document|cache|pool|buffer/.test(id.toLowerCase())) {
        const evidence = [`Name suggests global state or unbounded structure: ${id}`];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'global_state', evidence);
        anomalies.push({
          symbolId: id,
          pattern: 'global_state',
          evidence,
          confidence: 0.8,
          feedback
        });
      }
      // --- Side-Channel Detection ---
      // Heuristic: variable allocation/access, sensitive data, non-deterministic access
      if (/password|token|secret|key|auth/i.test(id)) {
        // Simulate timing/memory difference by random for now
        const timingVariance = Math.random();
        if (timingVariance > 0.7) {
          const evidence = [`Sensitive function with high timing/memory variance (simulated): ${timingVariance.toFixed(2)}`];
          let feedback: MemoryFeedback = { status: 'none' };
          if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'side_channel', evidence);
          sideChannelIssues.push({
            symbolId: id,
            issue: 'timing_side_channel',
            evidence,
            confidence: 0.7 + 0.3 * timingVariance,
            feedback
          });
        }
      }
      // Non-deterministic access pattern (e.g., hash/random)
      if (/hash|random|shuffle|pick|select/i.test(id)) {
        const evidence = [`Function name suggests non-deterministic access: ${id}`];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'side_channel', evidence);
        sideChannelIssues.push({
          symbolId: id,
          issue: 'non_deterministic_access',
          evidence,
          confidence: 0.6,
          feedback
        });
      }
      // --- Composite Anti-Pattern Mining ---
      // Retain cycles: if node is in a cycle in the ownership graph
      // (Assume ownershipGraph is available from earlier in the function)
      // Memory bloat: high allocation, high retention, long lifetime
      // Inefficient pooling: frequent churn, low retention
      // Ghost references: long lifetime, low access
      // For demo, use random/heuristic for now
      if (allocFreq > mean && Math.random() > 0.8) {
        const evidence = [`Possible memory bloat: high alloc (${allocFreq}), random flag`];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'memory_bloat', evidence);
        anomalies.push({
          symbolId: id,
          pattern: 'memory_bloat',
          evidence,
          confidence: 0.7,
          feedback
        });
      }
      if (Math.random() > 0.95) {
        const evidence = [`Possible ghost reference: long lifetime, low access (simulated)`];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'ghost_reference', evidence);
        anomalies.push({
          symbolId: id,
          pattern: 'ghost_reference',
          evidence,
          confidence: 0.6,
          feedback
        });
      }
    }
    // Retain cycles: ownershipGraph.cycles
    if (ownershipGraph && ownershipGraph.cycles && ownershipGraph.cycles.length) {
      for (const cycle of ownershipGraph.cycles.slice(0, 10)) {
        const evidence = [`Ownership retain cycle: ${cycle.join(' -> ')}`];
        const id = cycle[0];
        let feedback: MemoryFeedback = { status: 'none' };
        if (feedbackProvider) feedback = await feedbackProvider.getFeedback(id, 'retain_cycle', evidence);
        anomalies.push({
          symbolId: id,
          pattern: 'retain_cycle',
          evidence,
          confidence: 0.8,
          feedback
        });
      }
    }
    // --- Keyword Analysis ---
    const keywordList = [
      'delete', 'remove', 'destroy', 'free', 'release', 'dispose',
      'async', 'await', 'lock', 'unlock', 'mutex', 'thread', 'concurrent',
      'cache', 'flush', 'clear', 'encrypt', 'decrypt', 'sign', 'verify',
      'retry', 'fail', 'error', 'exception', 'timeout', 'abort',
      'init', 'initialize', 'setup', 'teardown', 'shutdown',
      'read', 'write', 'load', 'save', 'open', 'close', 'connect', 'disconnect',
      'start', 'stop', 'pause', 'resume', 'commit', 'rollback',
      'log', 'trace', 'debug', 'warn', 'info', 'fatal',
      'send', 'receive', 'emit', 'listen', 'subscribe', 'publish',
      'auth', 'authorize', 'authenticate', 'token', 'secret', 'key',
      'validate', 'verify', 'check', 'assert', 'test',
      'update', 'upgrade', 'downgrade', 'migrate', 'patch',
      'backup', 'restore', 'sync', 'replicate', 'mirror',
      'monitor', 'watch', 'observe', 'alert', 'notify',
      'block', 'wait', 'sleep', 'yield', 'schedule', 'defer',
      'pool', 'buffer', 'queue', 'stack', 'singleton', 'manager',
      'bypass', 'override', 'intercept', 'hook', 'inject',
      'serialize', 'deserialize', 'marshal', 'unmarshal',
      'compress', 'decompress', 'encode', 'decode',
      'parse', 'format', 'render', 'draw', 'paint',
      'clone', 'copy', 'duplicate', 'fork', 'split', 'merge',
      'expand', 'shrink', 'grow', 'resize', 'scale',
      'random', 'shuffle', 'sort', 'search', 'find', 'replace',
      'calculate', 'compute', 'estimate', 'predict', 'infer',
      'allocate', 'reserve', 'assign', 'map', 'bind', 'attach', 'detach',
      'mount', 'unmount', 'link', 'unlink', 'reference', 'dereference',
      'protect', 'guard', 'sanitize', 'escape', 'filter', 'mask',
      'profile', 'benchmark', 'measure', 'sample', 'trace',
      'throttle', 'debounce', 'limit', 'cap', 'bound',
      'spill', 'leak', 'overflow', 'underflow', 'wrap', 'unwrap',
      'noop', 'dummy', 'stub', 'mock', 'fake', 'test',
    ];
    const keywordAnalyses: KeywordAnalysis[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      const keywords: KeywordContext[] = [];
      // Name
      for (const kw of keywordList) {
        if (id.toLowerCase().includes(kw)) {
          keywords.push({ keyword: kw, context: 'name', confidence: 0.95, intent: undefined });
        }
      }
      // Docstring
      if (node.metadata && node.metadata.docstring) {
        for (const kw of keywordList) {
          if (node.metadata.docstring.toLowerCase().includes(kw)) {
            keywords.push({ keyword: kw, context: 'docstring', confidence: 0.8, intent: undefined });
          }
        }
      }
      // (No code property in metadata; skip code context)
      if (keywords.length) {
        keywordAnalyses.push({ symbolId: id, keywords });
      }
    }
    // --- Flow Prediction ---
    const flowPredictions: FlowPrediction[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      // Downstream: all reachable via dependencies (call/data flow)
      const downstream = new Set<string>();
      const stack = [...(node.dependencies || [])];
      let depth = 0;
      while (stack.length && depth < 20) {
        const next = stack.pop();
        if (next && !downstream.has(next)) {
          downstream.add(next);
          const nextNode = symbolGraph.symbols.get(next);
          if (nextNode && nextNode.dependencies) {
            stack.push(...nextNode.dependencies);
          }
        }
        depth++;
      }
      // Upstream: all reachable via dependents
      const upstream = new Set<string>();
      const upStack = [...(node.dependents || [])];
      depth = 0;
      while (upStack.length && depth < 20) {
        const prev = upStack.pop();
        if (prev && !upstream.has(prev)) {
          upstream.add(prev);
          const prevNode = symbolGraph.symbols.get(prev);
          if (prevNode && prevNode.dependents) {
            upStack.push(...prevNode.dependents);
          }
        }
        depth++;
      }
      flowPredictions.push({
        symbolId: id,
        downstream: Array.from(downstream),
        upstream: Array.from(upstream),
        confidence: 0.8
      });
    }
    // --- Impact Analysis ---
    // For demo, impact analysis for all symbols (could be parameterized)
    const impactAnalyses: ImpactAnalysis[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      // Impacted: all downstream (transitive) + self
      const impacted = new Set<string>([id]);
      const stack = [...(node.dependencies || [])];
      let depth = 0;
      while (stack.length && depth < 30) {
        const next = stack.pop();
        if (next && !impacted.has(next)) {
          impacted.add(next);
          const nextNode = symbolGraph.symbols.get(next);
          if (nextNode && nextNode.dependencies) {
            stack.push(...nextNode.dependencies);
          }
        }
        depth++;
      }
      // Impacted files (file property not available in metadata)
      const impactedFiles: string[] = [];
      impactAnalyses.push({
        symbolId: id,
        impactedSymbols: Array.from(impacted),
        impactedFiles,
        riskScore: Math.min(1, impacted.size / 50),
        confidence: 0.7
      });
    }
    // --- Health Scoring ---
    const healthScores: HealthScore[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      // Example: combine memory, anti-patterns, keyword, flow, impact
      let score = 100;
      const breakdown: { [dimension: string]: number } = {};
      // Memory
      if (memoryHealth.criticalIssues.some(i => i.symbolId === id)) {
        score -= 40;
        breakdown.memory = -40;
      }
      // Anti-patterns
      if (anomalies.some(a => a.symbolId === id)) {
        score -= 20;
        breakdown.antiPattern = -20;
      }
      // Keyword: penalize risky keywords
      const riskyKeywords = ['delete', 'remove', 'destroy', 'free', 'release', 'dispose', 'leak', 'overflow', 'underflow'];
      const kw = keywordAnalyses.find(k => k.symbolId === id);
      if (kw && kw.keywords.some(kc => riskyKeywords.includes(kc.keyword))) {
        score -= 10;
        breakdown.keywords = -10;
      }
      // Flow: penalize high fan-out
      const flow = flowPredictions.find(f => f.symbolId === id);
      if (flow && flow.downstream.length > 10) {
        score -= 10;
        breakdown.flow = -10;
      }
      // Impact: penalize high impact
      const impact = impactAnalyses.find(i => i.symbolId === id);
      if (impact && impact.impactedSymbols.length > 20) {
        score -= 10;
        breakdown.impact = -10;
      }
      // Clamp
      score = Math.max(0, score);
      // Suggestions
      const suggestions: string[] = [];
      if (breakdown.memory) suggestions.push('Address critical memory issues');
      if (breakdown.antiPattern) suggestions.push('Resolve anti-patterns');
      if (breakdown.keywords) suggestions.push('Review risky operations');
      if (breakdown.flow) suggestions.push('Reduce downstream dependencies');
      if (breakdown.impact) suggestions.push('Limit impact of changes');
      healthScores.push({ symbolId: id, score, breakdown, suggestions });
    }
    return {
      fundamentalAnalysis: { staleClosure, dataFlow, pseudoStack, memoryHealth },
      metaMemoryAnalysis: { allocationFingerprint },
      sideChannelAnalysis: { cacheEfficiency },
      antiPatternAnalysis: { scalability },
      synthesis: {},
      overallMemoryHealth: memoryHealth.overallScore,
      aiAgentRecommendations: [
        memoryHealth.overallScore > 80 ? 'Memory health is excellent.' : 'Review critical memory issues.'
      ],
      ownershipGraph,
      aliasing,
      lifetimeRegions,
      resourceLeaks,
      apiContracts,
      memoryHotspots,
      dataTypePsychology,
      sideChannelIssues,
      universalMemoryAntiPatterns: anomalies,
      keywordAnalysis: keywordAnalyses,
      flowPrediction: flowPredictions,
      impactAnalysis: impactAnalyses,
      healthScores,
    };
  }

  analyzeStaleClosures(symbolGraph: SymbolGraph): StaleClosureAnalysis {
    // Basic heuristic: function symbols with 'function inside function' and reference to outer variable
    const closureRisks: ClosureRisk[] = [];
    const lifetimeConflicts: LifetimeConflict[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = node.metadata.docstring || '';
      // Stale closure
      if (/function\s*\(/.test(doc) && /\bthis\b|\bself\b|\bwindow\b|\bglobal\b/.test(doc)) {
        closureRisks.push({
          symbolId: id,
          riskType: 'stale_reference',
          capturedVariables: ['this/self/window/global'],
          asyncBoundaries: [],
          severity: 'medium',
          evidence: ['Closure may capture outer-scope variable, possible stale closure.']
        });
      }
      // Lifetime/ownership conflicts: use-after-free, double-free, use-after-move (heuristic: doc mentions 'free', 'release', 'move', 'delete')
      if (/use-after-free|double-free|use-after-move|delete|release|free|move/.test(doc.toLowerCase())) {
        lifetimeConflicts.push({
          symbolId: id,
          conflict: 'lifetime/ownership issue',
          evidence: ['Docstring or code suggests possible use-after-free, double-free, or move semantics.']
        });
      }
    }
    return {
      closureRisks,
      captureAnalysis: { symbolId: '', captured: [], evidence: [] },
      lifetimeConflicts,
      confidence: closureRisks.length || lifetimeConflicts.length ? 0.7 : 1.0
    };
  }

  analyzeDataFlow(symbolGraph: SymbolGraph): DataFlowAnalysis {
    // Basic static data flow: for each function, track dependencies as sinks
    const dataFlows: DataFlow[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const sinks = (node.dependencies || []).filter(dep => symbolGraph.symbols.has(dep));
      dataFlows.push({
        sourceSymbol: id,
        sinkSymbols: sinks,
        flowPath: [id, ...sinks],
        dataType: 'unknown',
        retentionRisk: sinks.length > 3 ? 0.7 : 0.2,
        leakRisk: sinks.length > 5 ? 0.8 : 0.1
      });
    }
    // Sensitive data paths: flag if function name or doc mentions 'password', 'token', 'secret', 'key', 'auth'
    const sensitiveDataPaths: SensitiveDataPath[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const name = node.name.toLowerCase();
      const doc = (node.metadata.docstring || '').toLowerCase();
      if (/password|token|secret|key|auth/.test(name) || /password|token|secret|key|auth/.test(doc)) {
        sensitiveDataPaths.push({
          sourceSymbol: id,
          sinkSymbols: (node.dependencies || []).filter(dep => symbolGraph.symbols.has(dep)),
          evidence: ['Sensitive data keyword detected in function name or docstring.'],
          confidence: 0.8
        });
      }
    }
    // Data lifetimes: estimate for each function (creation=0, lastAccess=deps.length, modification=[0])
    const dataLifetimes: DataLifetime[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      dataLifetimes.push({
        symbolId: id,
        lifetime: (node.dependencies?.length || 0) + 1
      });
    }
    // Flow security: flag if sensitive data flows to >3 sinks
    const flowSecurityIssues = sensitiveDataPaths.filter(path => path.sinkSymbols.length > 3).map(path => ({
      symbolId: path.sourceSymbol,
      issue: 'sensitive_data_fanout',
      evidence: ['Sensitive data flows to many sinks.'],
      confidence: 0.7
    }));
    const flowSecurity: FlowSecurityAnalysis = { issues: flowSecurityIssues, confidence: flowSecurityIssues.length ? 0.7 : 1.0 };
    return { dataFlows, sensitiveDataPaths, dataLifetimes, flowSecurity };
  }

  analyzePseudoStack(symbolGraph: SymbolGraph): PseudoStackAnalysis {
    // Detect recursion, estimate max stack depth, flag overflow risk
    let maxStackDepth = 1;
    let overflowRisk = 0;
    const recursionPatterns: RecursionPattern[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      // Simple recursion detection: function calls itself
      if ((node.dependencies || []).includes(id)) {
        recursionPatterns.push({
          functionChain: [id],
          recursionType: 'direct',
          terminationCondition: null,
          growthPattern: 'linear',
          overflowProbability: 0.5
        });
        maxStackDepth = Math.max(maxStackDepth, 10);
        overflowRisk = Math.max(overflowRisk, 0.5);
      }
    }
    return {
      maxStackDepth,
      overflowRisk,
      recursionPatterns,
      tailCallOpportunities: [],
      stackMemoryPressure: { symbolId: '', pressure: 0, evidence: [] }
    };
  }

  analyzeMemoryHealth(stale: StaleClosureAnalysis, flow: DataFlowAnalysis, stack: PseudoStackAnalysis): MemoryHealthScore {
    // Refined scoring: penalize for closure risks, high retention/leak risk, recursion
    const criticalIssues = [
      ...stale.closureRisks.map(risk => ({ symbolId: risk.symbolId, issue: risk.riskType, severity: risk.severity, evidence: risk.evidence })),
      ...flow.dataFlows.filter(f => f.leakRisk > 0.7).map(f => ({ symbolId: f.sourceSymbol, issue: 'data_leak_risk', severity: 'high', evidence: ['High data leak risk due to many sinks.'] })),
      ...stack.recursionPatterns.map(r => ({ symbolId: r.functionChain[0], issue: 'recursion', severity: 'medium', evidence: ['Recursion detected.'] }))
    ];
    const score = 100 - criticalIssues.length * 10;
    return {
      overallScore: Math.max(0, score),
      dimensions: { efficiency: 1, safety: 1, security: 1, maintainability: 1, scalability: 1 },
      criticalIssues,
      recommendations: criticalIssues.length ? criticalIssues.map(i => ({ symbolId: i.symbolId, recommendation: 'Review memory risk', evidence: i.evidence })) : []
    };
  }

  analyzeAllocationBehavior(symbolGraph: SymbolGraph, dataFlow: DataFlowAnalysis): AllocationBehaviorFingerprint {
    // Heuristic: burst if many functions allocate in short call chains, steady if spread, spiky if some allocate much more
    let allocationRhythm = 'steady';
    let totalAllocators = 0;
    let maxFanOut = 0;
    let allocators: string[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type === 'function' && (node.dependencies?.length || 0) > 5) {
        allocators.push(id);
        totalAllocators++;
        if ((node.dependencies?.length || 0) > maxFanOut) maxFanOut = node.dependencies.length;
      }
    }
    if (totalAllocators > 10 && maxFanOut > 10) allocationRhythm = 'burst';
    if (totalAllocators < 3) allocationRhythm = 'spiky';
    // Size distribution: stub (random/constant)
    const sizeDistribution = { mean: 32, stddev: 8, min: 8, max: 128 };
    // Temporal patterns: stub
    const temporalPatterns = [{ pattern: allocationRhythm, confidence: 0.6 }];
    // Complexity signature: infer from data flow
    let complexityClass = 'O(n)';
    if (maxFanOut > 20) complexityClass = 'O(n^2)';
    if (totalAllocators < 2) complexityClass = 'O(1)';
    const complexitySignature = {
      memoryGrowthPattern: complexityClass === 'O(n^2)' ? 'quadratic' : (complexityClass === 'O(n)' ? 'linear' : 'constant'),
      accessPattern: 'sequential',
      complexityClass,
      confidence: 0.6
    };
    return {
      allocationRhythm,
      sizeDistribution,
      temporalPatterns,
      complexitySignature,
      architecturalStyle: 'unknown'
    };
  }

  analyzeCacheEfficiency(symbolGraph: SymbolGraph, dataFlow: DataFlowAnalysis): CacheEfficiencyAnalysis {
    // Heuristic: if most data flows are sequential, utilization is high; if many random, low
    let sequentialFlows = 0;
    let randomFlows = 0;
    for (const flow of dataFlow.dataFlows) {
      if (flow.sinkSymbols.length < 3) sequentialFlows++;
      else randomFlows++;
    }
    const total = sequentialFlows + randomFlows;
    const cacheLineUtilization = total ? sequentialFlows / total : 0.5;
    const cacheMissRisk = total ? randomFlows / total : 0.5;
    const memoryAccessStride = cacheLineUtilization > 0.7 ? 1 : 4;
    return {
      cacheLineUtilization,
      cacheMissRisk,
      memoryAccessStride,
      hotspots: [],
      coldspots: []
    };
  }

  analyzeScalability(symbolGraph: SymbolGraph, dataFlow: DataFlowAnalysis): ScalabilityAnalysis {
    // Heuristic: if many high-fan-out functions, risk of bottlenecks; predict growth
    let bottlenecks: any[] = [];
    let growth = 'linear';
    let maxFanOut = 0;
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type === 'function' && (node.dependencies?.length || 0) > 10) {
        bottlenecks.push({ symbolId: id, fanOut: node.dependencies.length });
        if (node.dependencies.length > maxFanOut) maxFanOut = node.dependencies.length;
      }
    }
    if (maxFanOut > 20) growth = 'quadratic';
    if (maxFanOut < 3) growth = 'constant';
    return {
      scalabilityBottlenecks: bottlenecks,
      resourceGrowthPrediction: { pattern: growth, confidence: 0.7 },
      breakingPoints: bottlenecks.length > 5 ? bottlenecks.slice(0, 3) : [],
      scalabilityScore: 1 - (bottlenecks.length / 20)
    };
  }

  buildOwnershipGraph(symbolGraph: SymbolGraph): OwnershipGraph {
    // Heuristic: transfer if function returns a value, borrow if passed as arg, move if doc mentions 'move'
    const nodes: string[] = Array.from(symbolGraph.symbols.keys());
    const edges: OwnershipEdge[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      if (/move/.test((node.metadata.docstring || '').toLowerCase())) {
        edges.push({ from: id, to: id, type: 'move', evidence: ['Docstring mentions move semantics.'] });
      }
      if (node.dependencies && node.dependencies.length) {
        for (const dep of node.dependencies) {
          edges.push({ from: id, to: dep, type: 'borrow', evidence: ['Dependency suggests borrowing.'] });
        }
      }
      if (/return/.test((node.metadata.docstring || '').toLowerCase())) {
        edges.push({ from: id, to: id, type: 'transfer', evidence: ['Docstring mentions return, possible ownership transfer.'] });
      }
    }
    // Iterative, bounded, contextual, incremental cycle detection
    const cycles: string[][] = [];
    const foundInCycle = new Set<string>();
    const MAX_DEPTH = 12;
    const MAX_CYCLES = 100;
    const MAX_NODES = 500;
    if (nodes.length > MAX_NODES) {
      return { nodes, edges, cycles: [['Graph too large for cycle analysis']] };
    }
    // Only start from nodes with >5 dependencies
    const interestingNodes = nodes.filter(n => {
      const node = symbolGraph.symbols.get(n);
      return node && node.dependencies && node.dependencies.length > 5;
    });
    for (const start of interestingNodes) {
      if (cycles.length >= MAX_CYCLES) break;
      const stack: { node: string; path: string[]; depth: number }[] = [ { node: start, path: [], depth: 0 } ];
      while (stack.length) {
        const { node, path, depth } = stack.pop()!;
        if (cycles.length >= MAX_CYCLES) break;
        if (depth > MAX_DEPTH) continue;
        if (foundInCycle.has(node)) continue;
        if (path.includes(node)) {
          const cycle = [...path.slice(path.indexOf(node)), node];
          for (const s of cycle) foundInCycle.add(s);
          cycles.push(cycle);
          continue;
        }
        for (const edge of edges.filter(e => e.from === node)) {
          stack.push({ node: edge.to, path: [...path, node], depth: depth + 1 });
        }
      }
    }
    return { nodes, edges, cycles };
  }

  analyzeAliasing(symbolGraph: SymbolGraph): AliasingAnalysis[] {
    // Heuristic: if a symbol is a dependency of >1 function, it's aliased; if mutated after sharing, flag
    const aliasMap: Record<string, number> = {};
    for (const [id, node] of symbolGraph.symbols) {
      if (node.dependencies) {
        for (const dep of node.dependencies) {
          aliasMap[dep] = (aliasMap[dep] || 0) + 1;
        }
      }
    }
    const results: AliasingAnalysis[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const isAliased = (aliasMap[id] || 0) > 1;
      // Heuristic: if doc mentions 'mutate' or 'modify' and is aliased
      const isMutatedAfterShare = isAliased && /mutate|modify/.test((node.metadata.docstring || '').toLowerCase());
      results.push({ symbolId: id, isAliased, isMutatedAfterShare, evidence: isAliased ? ['Aliased by multiple functions.'] : [] });
    }
    return results;
  }

  mapLifetimeRegions(symbolGraph: SymbolGraph): LifetimeRegion[] {
    // Heuristic: validFrom=0, validTo=deps.length, evidence if doc mentions 'free', 'release', 'delete'
    const results: LifetimeRegion[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const validTo = (node.dependencies?.length || 0) + 1;
      const evidence = /free|release|delete/.test((node.metadata.docstring || '').toLowerCase()) ? ['Docstring mentions resource release.'] : [];
      results.push({ symbolId: id, validFrom: 0, validTo, evidence });
    }
    return results;
  }

  detectResourceLeaks(ownershipGraph: OwnershipGraph): ResourceLeak[] {
    // Heuristic: if a node is in a cycle, possible leak
    const leaks: ResourceLeak[] = [];
    for (const cycle of ownershipGraph.cycles) {
      for (const symbolId of cycle) {
        leaks.push({ symbolId, leakType: 'ownership_cycle', evidence: ['Ownership cycle detected, possible leak.'] });
      }
    }
    return leaks;
  }

  inferApiOwnershipContracts(symbolGraph: SymbolGraph): ApiOwnershipContract[] {
    // Heuristic: takesOwnership if doc mentions 'take', borrows if 'borrow', returnsOwnership if 'return'
    const results: ApiOwnershipContract[] = [];
    for (const [id, node] of symbolGraph.symbols) {
      if (node.type !== 'function') continue;
      const doc = (node.metadata.docstring || '').toLowerCase();
      results.push({
        symbolId: id,
        takesOwnership: /take/.test(doc),
        borrows: /borrow/.test(doc),
        returnsOwnership: /return/.test(doc),
        evidence: [
          /take/.test(doc) ? 'Docstring mentions take.' : '',
          /borrow/.test(doc) ? 'Docstring mentions borrow.' : '',
          /return/.test(doc) ? 'Docstring mentions return.' : ''
        ].filter(Boolean)
      });
    }
    return results;
  }
} 