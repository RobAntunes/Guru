/**
 * Confidence Stream System
 * Manages parallel confidence building and threshold-based action triggering
 */

import { EventEmitter } from 'events';
import { Logger } from '../../logging/logger.js';

/**
 * Evidence supporting confidence
 */
export interface Evidence {
  id: string;
  type: 'observation' | 'analysis' | 'test' | 'historical' | 'external';
  description: string;
  source: string;
  strength: number;           // How strong this evidence is (0.0-1.0)
  reliability: number;        // How reliable the source is (0.0-1.0)
  timestamp: number;
  data?: any;                // Evidence-specific data
}

/**
 * Uncertainty that reduces confidence
 */
export interface Uncertainty {
  id: string;
  type: 'unknown' | 'ambiguous' | 'conflicting' | 'missing' | 'risky';
  description: string;
  impact: number;            // How much this affects confidence (0.0-1.0)
  resolvable: boolean;       // Can this be resolved?
  resolutionPath?: string;   // How to resolve it
  data?: any;
}

/**
 * Assumption being made
 */
export interface Assumption {
  id: string;
  description: string;
  confidence: number;        // How confident we are in this assumption (0.0-1.0)
  impact: number;           // How much outcomes depend on this (0.0-1.0)
  validated: boolean;       // Has this been validated?
  validationMethod?: string;
}

/**
 * Confidence data point in history
 */
export interface ConfidencePoint {
  timestamp: number;
  confidence: number;
  evidenceCount: number;
  uncertaintyCount: number;
  trigger?: string;         // What caused this change
}

/**
 * Parallel activity building confidence
 */
export interface ParallelActivity {
  id: string;
  type: 'research' | 'analysis' | 'experiment' | 'validation' | 'monitoring';
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  expectedConfidenceGain: number;
  actualConfidenceGain?: number;
  result?: any;
}

/**
 * Experiment to resolve uncertainty
 */
export interface Experiment {
  id: string;
  hypothesis: string;
  method: string;
  status: 'planned' | 'running' | 'completed' | 'failed';
  targetUncertainty?: string;    // ID of uncertainty to resolve
  expectedDuration: number;      // ms
  startTime?: number;
  results?: any;
  conclusionConfidence?: number;
}

/**
 * Action that can be triggered when confidence is reached
 */
export interface ConditionalAction {
  id: string;
  description: string;
  requiredConfidence: number;    // Threshold to enable (0.0-1.0)
  currentConfidence: number;     // Current confidence for this action
  dependencies?: string[];       // Other action IDs that must complete first
  risks: string[];              // Known risks
  execute: () => Promise<any>;  // Function to execute the action
}

/**
 * Blocked action waiting for confidence
 */
export interface BlockedAction {
  action: ConditionalAction;
  blockers: string[];           // What's blocking it
  estimatedUnblockTime?: number;
  alternativePaths?: string[];  // Other ways to achieve same goal
}

/**
 * Stream dependency on another stream
 */
export interface StreamDependency {
  streamId: string;
  type: 'requires' | 'enhances' | 'conflicts';
  minimumConfidence?: number;   // Minimum confidence needed from that stream
}

/**
 * How this stream influences others
 */
export interface StreamInfluence {
  streamId: string;
  influenceType: 'increases' | 'decreases' | 'validates' | 'invalidates';
  strength: number;            // How strong the influence is (0.0-1.0)
}

/**
 * Result of adding evidence
 */
export interface ConfidenceUpdate {
  previousConfidence: number;
  newConfidence: number;
  delta: number;
  trigger: string;
  actionsEnabled: string[];    // Actions that became available
  actionsDisabled: string[];   // Actions that became unavailable
}

/**
 * Resolution of an uncertainty
 */
export interface Resolution {
  uncertaintyId: string;
  resolutionType: 'resolved' | 'accepted' | 'mitigated' | 'irrelevant';
  evidence?: Evidence;
  newAssumptions?: Assumption[];
  confidence: number;          // Confidence in the resolution
}

/**
 * Cascade of actions triggered
 */
export interface ActionCascade {
  triggered: ConditionalAction[];
  cascaded: ConditionalAction[];  // Actions triggered by other actions
  blocked: BlockedAction[];
  timeline: Array<{
    action: ConditionalAction;
    startTime: number;
    endTime?: number;
    result?: any;
  }>;
}

/**
 * Merged stream result
 */
export interface MergedStream {
  id: string;
  parentStreams: string[];
  combinedConfidence: number;
  mergeStrategy: 'average' | 'minimum' | 'maximum' | 'weighted';
}

/**
 * Stream coordination plan
 */
export interface StreamCoordination {
  streams: ConfidenceStream[];
  syncPoints: SyncPoint[];
  resourceAllocation: Map<string, number>;
  priorityOrder: string[];
}

/**
 * Synchronization point between streams
 */
export interface SyncPoint {
  id: string;
  streams: string[];
  condition: string;           // When to sync
  action: string;             // What to do at sync
  deadline?: number;          // When sync must happen by
}

/**
 * Action trigger configuration
 */
export interface ActionTrigger {
  actionId: string;
  conditions: TriggerCondition[];
  combinationLogic: 'all' | 'any' | 'custom';
  customLogic?: (conditions: TriggerCondition[]) => boolean;
}

/**
 * Condition for triggering an action
 */
export interface TriggerCondition {
  type: 'confidence' | 'evidence_count' | 'time' | 'external';
  threshold: number;
  operator: '>' | '>=' | '=' | '<=' | '<';
  value?: any;
}

/**
 * Confidence Stream - builds confidence through evidence accumulation
 */
export class ConfidenceStream extends EventEmitter {
  // Stream identity
  id: string;
  purpose: string;
  domain: string;
  
  // Confidence tracking
  currentConfidence: number = 0;
  targetConfidence: number = 0.8;
  confidenceHistory: ConfidencePoint[] = [];
  
  // Evidence and uncertainty
  evidence: Map<string, Evidence> = new Map();
  uncertainties: Map<string, Uncertainty> = new Map();
  assumptions: Map<string, Assumption> = new Map();
  
  // Activities and experiments
  activities: Map<string, ParallelActivity> = new Map();
  experiments: Map<string, Experiment> = new Map();
  
  // Actions
  enabledActions: Map<string, ConditionalAction> = new Map();
  blockedActions: Map<string, BlockedAction> = new Map();
  
  // Integration
  dependencies: StreamDependency[] = [];
  influences: StreamInfluence[] = [];
  
  // Configuration
  private decayRate: number = 0.001;        // Confidence decay per hour
  private evidenceWeighting: 'linear' | 'logarithmic' | 'sigmoid' = 'sigmoid';
  
  private logger = Logger.getInstance();
  private lastUpdateTime: number = Date.now();
  
  constructor(purpose: string, domain: string, targetConfidence?: number) {
    super();
    
    this.id = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.purpose = purpose;
    this.domain = domain;
    
    if (targetConfidence) {
      this.targetConfidence = targetConfidence;
    }
    
    // Record initial state
    this.confidenceHistory.push({
      timestamp: Date.now(),
      confidence: 0,
      evidenceCount: 0,
      uncertaintyCount: 0,
      trigger: 'stream_created'
    });
    
    this.logger.info(`🌊 Confidence stream created: ${purpose} (target: ${this.targetConfidence})`);
  }
  
  /**
   * Add evidence to the stream
   */
  addEvidence(evidence: Evidence): ConfidenceUpdate {
    const previousConfidence = this.currentConfidence;
    
    // Store evidence
    this.evidence.set(evidence.id, evidence);
    
    // Calculate confidence change
    const evidenceImpact = this.calculateEvidenceImpact(evidence);
    
    // Update confidence
    this.updateConfidence(evidenceImpact, `evidence_added: ${evidence.type}`);
    
    // Check for newly enabled/disabled actions
    const { enabled, disabled } = this.checkActionThresholds();
    
    const update: ConfidenceUpdate = {
      previousConfidence,
      newConfidence: this.currentConfidence,
      delta: this.currentConfidence - previousConfidence,
      trigger: `evidence: ${evidence.description}`,
      actionsEnabled: enabled,
      actionsDisabled: disabled
    };
    
    this.emit('evidence_added', { evidence, update });
    
    // Check if we've reached target confidence
    if (previousConfidence < this.targetConfidence && 
        this.currentConfidence >= this.targetConfidence) {
      this.emit('target_reached', { 
        stream: this,
        confidence: this.currentConfidence 
      });
    }
    
    return update;
  }
  
  /**
   * Add uncertainty to the stream
   */
  addUncertainty(uncertainty: Uncertainty): void {
    this.uncertainties.set(uncertainty.id, uncertainty);
    
    // Reduce confidence based on uncertainty impact
    const impact = -uncertainty.impact * 0.1;
    this.updateConfidence(impact, `uncertainty_added: ${uncertainty.type}`);
    
    // Start experiment if uncertainty is resolvable
    if (uncertainty.resolvable && uncertainty.resolutionPath) {
      this.planExperiment({
        id: `exp_${uncertainty.id}`,
        hypothesis: `Resolve ${uncertainty.description}`,
        method: uncertainty.resolutionPath,
        status: 'planned',
        targetUncertainty: uncertainty.id,
        expectedDuration: 3600000 // 1 hour default
      });
    }
    
    this.emit('uncertainty_added', uncertainty);
  }
  
  /**
   * Resolve an uncertainty
   */
  resolveUncertainty(resolution: Resolution): ConfidenceChange {
    const uncertainty = this.uncertainties.get(resolution.uncertaintyId);
    if (!uncertainty) {
      throw new Error(`Uncertainty ${resolution.uncertaintyId} not found`);
    }
    
    const previousConfidence = this.currentConfidence;
    
    // Remove or update uncertainty
    if (resolution.resolutionType === 'resolved') {
      this.uncertainties.delete(resolution.uncertaintyId);
      
      // Add evidence if provided
      if (resolution.evidence) {
        this.addEvidence(resolution.evidence);
      }
      
      // Boost confidence for resolution
      const boost = uncertainty.impact * resolution.confidence * 0.2;
      this.updateConfidence(boost, `uncertainty_resolved: ${uncertainty.type}`);
      
    } else if (resolution.resolutionType === 'accepted') {
      // Convert to assumption
      this.assumptions.set(uncertainty.id, {
        id: uncertainty.id,
        description: uncertainty.description,
        confidence: resolution.confidence,
        impact: uncertainty.impact,
        validated: false
      });
      
      // Smaller confidence boost for acceptance
      const boost = uncertainty.impact * resolution.confidence * 0.1;
      this.updateConfidence(boost, `uncertainty_accepted: ${uncertainty.type}`);
    }
    
    // Add new assumptions if any
    if (resolution.newAssumptions) {
      for (const assumption of resolution.newAssumptions) {
        this.assumptions.set(assumption.id, assumption);
      }
    }
    
    const change: ConfidenceChange = {
      previousConfidence,
      newConfidence: this.currentConfidence,
      delta: this.currentConfidence - previousConfidence,
      reason: `Resolved ${uncertainty.type}: ${resolution.resolutionType}`
    };
    
    this.emit('uncertainty_resolved', { resolution, change });
    return change;
  }
  
  /**
   * Launch a parallel activity
   */
  launchActivity(activity: ParallelActivity): void {
    activity.status = 'active';
    activity.startTime = Date.now();
    
    this.activities.set(activity.id, activity);
    
    this.emit('activity_launched', activity);
    
    // Simulate activity completion (would be real async work)
    this.simulateActivity(activity);
  }
  
  /**
   * Plan an experiment
   */
  planExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
    
    this.emit('experiment_planned', experiment);
    
    // Auto-start if conditions are met
    if (this.canRunExperiment(experiment)) {
      this.runExperiment(experiment);
    }
  }
  
  /**
   * Run an experiment
   */
  async runExperiment(experiment: Experiment): Promise<void> {
    const exp = this.experiments.get(experiment.id);
    if (!exp || exp.status !== 'planned') return;
    
    exp.status = 'running';
    exp.startTime = Date.now();
    
    this.emit('experiment_started', exp);
    
    try {
      // Simulate experiment (would be real experimental work)
      await this.simulateExperiment(exp);
      
      exp.status = 'completed';
      
      // Process results
      if (exp.results && exp.conclusionConfidence) {
        // Add as evidence
        this.addEvidence({
          id: `evidence_${exp.id}`,
          type: 'test',
          description: `Experiment result: ${exp.hypothesis}`,
          source: 'experiment',
          strength: exp.conclusionConfidence,
          reliability: 0.9,
          timestamp: Date.now(),
          data: exp.results
        });
      }
      
      this.emit('experiment_completed', exp);
      
    } catch (error) {
      exp.status = 'failed';
      this.emit('experiment_failed', { experiment: exp, error });
    }
  }
  
  /**
   * Register a conditional action
   */
  registerAction(action: ConditionalAction): void {
    if (action.currentConfidence >= action.requiredConfidence) {
      this.enabledActions.set(action.id, action);
    } else {
      this.blockedActions.set(action.id, {
        action,
        blockers: [`confidence < ${action.requiredConfidence}`]
      });
    }
    
    this.emit('action_registered', action);
  }
  
  /**
   * Trigger available actions
   */
  async triggerActions(): Promise<ActionCascade> {
    const cascade: ActionCascade = {
      triggered: [],
      cascaded: [],
      blocked: Array.from(this.blockedActions.values()),
      timeline: []
    };
    
    // Sort actions by dependencies
    const sortedActions = this.sortActionsByDependencies(
      Array.from(this.enabledActions.values())
    );
    
    for (const action of sortedActions) {
      if (this.canExecuteAction(action, cascade.triggered)) {
        const startTime = Date.now();
        
        try {
          const result = await action.execute();
          
          cascade.triggered.push(action);
          cascade.timeline.push({
            action,
            startTime,
            endTime: Date.now(),
            result
          });
          
          this.emit('action_executed', { action, result });
          
          // Check for cascading actions
          const cascaded = this.checkCascadingActions(action, result);
          cascade.cascaded.push(...cascaded);
          
        } catch (error) {
          this.logger.error(`Action ${action.id} failed:`, error);
          this.emit('action_failed', { action, error });
        }
      }
    }
    
    return cascade;
  }
  
  /**
   * Merge with another stream
   */
  mergeWith(other: ConfidenceStream, strategy: 'average' | 'minimum' | 'maximum' | 'weighted' = 'average'): MergedStream {
    const merged: MergedStream = {
      id: `merged_${this.id}_${other.id}`,
      parentStreams: [this.id, other.id],
      combinedConfidence: 0,
      mergeStrategy: strategy
    };
    
    // Calculate combined confidence
    switch (strategy) {
      case 'average':
        merged.combinedConfidence = (this.currentConfidence + other.currentConfidence) / 2;
        break;
      case 'minimum':
        merged.combinedConfidence = Math.min(this.currentConfidence, other.currentConfidence);
        break;
      case 'maximum':
        merged.combinedConfidence = Math.max(this.currentConfidence, other.currentConfidence);
        break;
      case 'weighted':
        // Weight by evidence count
        const totalEvidence = this.evidence.size + other.evidence.size;
        merged.combinedConfidence = (
          this.currentConfidence * this.evidence.size +
          other.currentConfidence * other.evidence.size
        ) / totalEvidence;
        break;
    }
    
    // Merge evidence
    const mergedEvidence = new Map([...this.evidence, ...other.evidence]);
    
    // Merge uncertainties (union)
    const mergedUncertainties = new Map([...this.uncertainties, ...other.uncertainties]);
    
    this.emit('streams_merged', merged);
    return merged;
  }
  
  /**
   * Update stream based on time passage
   */
  update(): void {
    const now = Date.now();
    const deltaHours = (now - this.lastUpdateTime) / 3600000;
    
    // Apply confidence decay
    const decay = this.decayRate * deltaHours;
    if (decay > 0) {
      this.updateConfidence(-decay, 'time_decay');
    }
    
    // Update activities
    for (const [id, activity] of this.activities) {
      if (activity.status === 'active' && activity.endTime && now >= activity.endTime) {
        this.completeActivity(id);
      }
    }
    
    // Check experiments
    for (const [id, experiment] of this.experiments) {
      if (experiment.status === 'planned' && this.canRunExperiment(experiment)) {
        this.runExperiment(experiment);
      }
    }
    
    this.lastUpdateTime = now;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      id: this.id,
      purpose: this.purpose,
      domain: this.domain,
      currentConfidence: this.currentConfidence,
      targetConfidence: this.targetConfidence,
      progress: this.currentConfidence / this.targetConfidence,
      evidence: this.evidence.size,
      uncertainties: this.uncertainties.size,
      assumptions: this.assumptions.size,
      activeActivities: Array.from(this.activities.values()).filter(a => a.status === 'active').length,
      enabledActions: this.enabledActions.size,
      blockedActions: this.blockedActions.size
    };
  }
  
  // Private methods
  
  private calculateEvidenceImpact(evidence: Evidence): number {
    const baseImpact = evidence.strength * evidence.reliability;
    
    switch (this.evidenceWeighting) {
      case 'linear':
        return baseImpact * 0.1;
        
      case 'logarithmic':
        // Diminishing returns on more evidence
        const count = this.evidence.size;
        return baseImpact * 0.1 / Math.log2(count + 2);
        
      case 'sigmoid':
        // S-curve: slow start, rapid middle, plateau
        const x = this.currentConfidence;
        const sigmoidMultiplier = 4 * x * (1 - x); // Peaks at 0.5
        return baseImpact * 0.1 * (0.5 + sigmoidMultiplier);
        
      default:
        return baseImpact * 0.1;
    }
  }
  
  private updateConfidence(delta: number, trigger: string): void {
    const previous = this.currentConfidence;
    this.currentConfidence = Math.max(0, Math.min(1, this.currentConfidence + delta));
    
    // Record history
    this.confidenceHistory.push({
      timestamp: Date.now(),
      confidence: this.currentConfidence,
      evidenceCount: this.evidence.size,
      uncertaintyCount: this.uncertainties.size,
      trigger
    });
    
    // Trim history if too long
    if (this.confidenceHistory.length > 1000) {
      this.confidenceHistory = this.confidenceHistory.slice(-500);
    }
    
    if (previous !== this.currentConfidence) {
      this.emit('confidence_changed', {
        previous,
        current: this.currentConfidence,
        delta: this.currentConfidence - previous,
        trigger
      });
    }
  }
  
  private checkActionThresholds(): { enabled: string[], disabled: string[] } {
    const enabled: string[] = [];
    const disabled: string[] = [];
    
    // Check blocked actions that might now be enabled
    for (const [id, blocked] of this.blockedActions) {
      if (this.currentConfidence >= blocked.action.requiredConfidence) {
        this.enabledActions.set(id, blocked.action);
        this.blockedActions.delete(id);
        enabled.push(id);
      }
    }
    
    // Check enabled actions that might now be blocked
    for (const [id, action] of this.enabledActions) {
      if (this.currentConfidence < action.requiredConfidence) {
        this.blockedActions.set(id, {
          action,
          blockers: [`confidence dropped below ${action.requiredConfidence}`]
        });
        this.enabledActions.delete(id);
        disabled.push(id);
      }
    }
    
    return { enabled, disabled };
  }
  
  private simulateActivity(activity: ParallelActivity): void {
    // Simulate async activity completion
    setTimeout(() => {
      if (activity.status === 'active') {
        activity.status = 'completed';
        activity.endTime = Date.now();
        activity.actualConfidenceGain = activity.expectedConfidenceGain * (0.8 + Math.random() * 0.4);
        
        // Add confidence from activity
        this.updateConfidence(
          activity.actualConfidenceGain,
          `activity_completed: ${activity.type}`
        );
        
        this.emit('activity_completed', activity);
      }
    }, 1000 + Math.random() * 4000); // 1-5 seconds
  }
  
  private canRunExperiment(experiment: Experiment): boolean {
    // Check if we have resources and conditions to run
    if (experiment.targetUncertainty) {
      return this.uncertainties.has(experiment.targetUncertainty);
    }
    return true;
  }
  
  private async simulateExperiment(experiment: Experiment): Promise<void> {
    // Simulate experiment duration
    await new Promise(resolve => setTimeout(resolve, experiment.expectedDuration));
    
    // Generate results
    experiment.results = {
      success: Math.random() > 0.3,
      data: { timestamp: Date.now() }
    };
    
    experiment.conclusionConfidence = experiment.results.success ? 0.8 : 0.3;
  }
  
  private sortActionsByDependencies(actions: ConditionalAction[]): ConditionalAction[] {
    // Simple topological sort
    const sorted: ConditionalAction[] = [];
    const visited = new Set<string>();
    
    const visit = (action: ConditionalAction) => {
      if (visited.has(action.id)) return;
      visited.add(action.id);
      
      // Visit dependencies first
      if (action.dependencies) {
        for (const depId of action.dependencies) {
          const dep = actions.find(a => a.id === depId);
          if (dep) visit(dep);
        }
      }
      
      sorted.push(action);
    };
    
    actions.forEach(visit);
    return sorted;
  }
  
  private canExecuteAction(action: ConditionalAction, executed: ConditionalAction[]): boolean {
    // Check confidence
    if (this.currentConfidence < action.requiredConfidence) return false;
    
    // Check dependencies
    if (action.dependencies) {
      const executedIds = new Set(executed.map(a => a.id));
      return action.dependencies.every(dep => executedIds.has(dep));
    }
    
    return true;
  }
  
  private checkCascadingActions(trigger: ConditionalAction, result: any): ConditionalAction[] {
    // Check if this action enables others
    const cascaded: ConditionalAction[] = [];
    
    // Would implement logic to determine cascading effects
    
    return cascaded;
  }
}

/**
 * Confidence change result
 */
export interface ConfidenceChange {
  previousConfidence: number;
  newConfidence: number;
  delta: number;
  reason: string;
}

/**
 * Parallel Workflow Orchestrator
 */
export class ParallelWorkflowOrchestrator extends EventEmitter {
  // Active streams
  streams: Map<string, ConfidenceStream> = new Map();
  
  // Stream coordination
  coordination: StreamCoordination = {
    streams: [],
    syncPoints: [],
    resourceAllocation: new Map(),
    priorityOrder: []
  };
  
  // Action management
  actionTriggers: Map<string, ActionTrigger> = new Map();
  
  private logger = Logger.getInstance();
  private updateInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.startOrchestration();
  }
  
  /**
   * Launch a new confidence stream
   */
  launchStream(purpose: string, domain: string, targetConfidence?: number): ConfidenceStream {
    const stream = new ConfidenceStream(purpose, domain, targetConfidence);
    
    this.streams.set(stream.id, stream);
    this.coordination.streams.push(stream);
    
    // Set up stream event handlers
    this.setupStreamHandlers(stream);
    
    this.logger.info(`🚀 Launched confidence stream: ${purpose}`);
    this.emit('stream_launched', stream);
    
    return stream;
  }
  
  /**
   * Coordinate multiple streams
   */
  coordinateStreams(streamIds: string[]): StreamCoordination {
    const streams = streamIds
      .map(id => this.streams.get(id))
      .filter((s): s is ConfidenceStream => s !== undefined);
    
    // Update coordination
    this.coordination.streams = streams;
    
    // Determine priority order based on dependencies
    this.coordination.priorityOrder = this.determinePriorityOrder(streams);
    
    // Allocate resources
    this.allocateResources(streams);
    
    // Identify sync points
    this.identifySyncPoints(streams);
    
    this.emit('streams_coordinated', this.coordination);
    return this.coordination;
  }
  
  /**
   * Execute action when ready
   */
  async executeWhenReady(action: ConditionalAction): Promise<any> {
    // Find appropriate stream
    const stream = this.findStreamForAction(action);
    if (!stream) {
      throw new Error(`No stream found for action ${action.id}`);
    }
    
    // Register action with stream
    stream.registerAction(action);
    
    // Create trigger
    this.actionTriggers.set(action.id, {
      actionId: action.id,
      conditions: [{
        type: 'confidence',
        threshold: action.requiredConfidence,
        operator: '>='
      }],
      combinationLogic: 'all'
    });
    
    // Wait for execution
    return new Promise((resolve, reject) => {
      stream.once('action_executed', ({ action: executedAction, result }) => {
        if (executedAction.id === action.id) {
          resolve(result);
        }
      });
      
      stream.once('action_failed', ({ action: failedAction, error }) => {
        if (failedAction.id === action.id) {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Adapt to new information
   */
  adaptToNewInformation(info: any): void {
    // Determine which streams are affected
    const affectedStreams = this.determineAffectedStreams(info);
    
    for (const stream of affectedStreams) {
      // Add as evidence or uncertainty
      if (info.type === 'evidence') {
        stream.addEvidence({
          id: `evidence_${Date.now()}`,
          type: 'external',
          description: info.description,
          source: info.source,
          strength: info.strength || 0.5,
          reliability: info.reliability || 0.7,
          timestamp: Date.now(),
          data: info.data
        });
      } else if (info.type === 'uncertainty') {
        stream.addUncertainty({
          id: `uncertainty_${Date.now()}`,
          type: info.uncertaintyType || 'unknown',
          description: info.description,
          impact: info.impact || 0.5,
          resolvable: info.resolvable !== false,
          resolutionPath: info.resolutionPath
        });
      }
    }
    
    // Re-coordinate if needed
    if (affectedStreams.length > 1) {
      this.coordinateStreams(affectedStreams.map(s => s.id));
    }
    
    this.emit('adapted_to_information', { info, affectedStreams: affectedStreams.length });
  }
  
  /**
   * Get orchestration status
   */
  getStatus() {
    return {
      activeStreams: this.streams.size,
      streamStatuses: Array.from(this.streams.values()).map(s => s.getStatus()),
      coordination: {
        syncPoints: this.coordination.syncPoints.length,
        priorityOrder: this.coordination.priorityOrder,
        totalResources: Array.from(this.coordination.resourceAllocation.values())
          .reduce((sum, val) => sum + val, 0)
      },
      actionTriggers: this.actionTriggers.size
    };
  }
  
  /**
   * Stop orchestration
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    
    this.logger.info('🛑 Workflow orchestration stopped');
  }
  
  // Private methods
  
  private startOrchestration(): void {
    // Update all streams periodically
    this.updateInterval = setInterval(() => {
      for (const stream of this.streams.values()) {
        stream.update();
      }
      
      // Check for sync points
      this.checkSyncPoints();
      
      // Check action triggers
      this.checkActionTriggers();
      
    }, 5000); // Every 5 seconds
  }
  
  private setupStreamHandlers(stream: ConfidenceStream): void {
    stream.on('target_reached', ({ stream: s, confidence }) => {
      this.emit('stream_target_reached', { stream: s, confidence });
      
      // Check if this enables other streams
      this.checkStreamDependencies(s);
    });
    
    stream.on('confidence_changed', (change) => {
      this.emit('stream_confidence_changed', { streamId: stream.id, change });
    });
    
    stream.on('action_executed', ({ action, result }) => {
      this.emit('action_executed', { streamId: stream.id, action, result });
    });
  }
  
  private determinePriorityOrder(streams: ConfidenceStream[]): string[] {
    // Simple priority based on dependencies
    const order: string[] = [];
    const visited = new Set<string>();
    
    const visit = (stream: ConfidenceStream) => {
      if (visited.has(stream.id)) return;
      visited.add(stream.id);
      
      // Visit dependencies first
      for (const dep of stream.dependencies) {
        const depStream = streams.find(s => s.id === dep.streamId);
        if (depStream) visit(depStream);
      }
      
      order.push(stream.id);
    };
    
    streams.forEach(visit);
    return order;
  }
  
  private allocateResources(streams: ConfidenceStream[]): void {
    const totalResources = 100;
    const baseAllocation = totalResources / streams.length;
    
    // Simple equal allocation for now
    for (const stream of streams) {
      this.coordination.resourceAllocation.set(stream.id, baseAllocation);
    }
  }
  
  private identifySyncPoints(streams: ConfidenceStream[]): void {
    // Identify natural sync points
    const syncPoints: SyncPoint[] = [];
    
    // Sync when all streams reach minimum confidence
    syncPoints.push({
      id: 'min_confidence_sync',
      streams: streams.map(s => s.id),
      condition: 'all_streams_confidence > 0.5',
      action: 'coordinate_actions'
    });
    
    this.coordination.syncPoints = syncPoints;
  }
  
  private findStreamForAction(action: ConditionalAction): ConfidenceStream | undefined {
    // Find stream best suited for this action
    for (const stream of this.streams.values()) {
      if (action.description.includes(stream.domain) || 
          action.description.includes(stream.purpose)) {
        return stream;
      }
    }
    
    // Return first stream if no match
    return this.streams.values().next().value;
  }
  
  private determineAffectedStreams(info: any): ConfidenceStream[] {
    const affected: ConfidenceStream[] = [];
    
    for (const stream of this.streams.values()) {
      // Check if info is relevant to stream's domain or purpose
      if (info.domain && info.domain === stream.domain) {
        affected.push(stream);
      } else if (info.keywords) {
        for (const keyword of info.keywords) {
          if (stream.purpose.includes(keyword) || stream.domain.includes(keyword)) {
            affected.push(stream);
            break;
          }
        }
      }
    }
    
    // If no specific match, might affect all streams
    if (affected.length === 0 && info.global) {
      return Array.from(this.streams.values());
    }
    
    return affected;
  }
  
  private checkStreamDependencies(completedStream: ConfidenceStream): void {
    // Check if other streams were waiting for this one
    for (const stream of this.streams.values()) {
      for (const dep of stream.dependencies) {
        if (dep.streamId === completedStream.id && dep.type === 'requires') {
          if (dep.minimumConfidence && completedStream.currentConfidence >= dep.minimumConfidence) {
            // Boost dependent stream
            stream.addEvidence({
              id: `dep_evidence_${Date.now()}`,
              type: 'external',
              description: `Dependency ${completedStream.purpose} reached required confidence`,
              source: completedStream.id,
              strength: 0.5,
              reliability: 1.0,
              timestamp: Date.now()
            });
          }
        }
      }
    }
  }
  
  private checkSyncPoints(): void {
    for (const sync of this.coordination.syncPoints) {
      if (this.evaluateSyncCondition(sync)) {
        this.executeSyncAction(sync);
      }
    }
  }
  
  private evaluateSyncCondition(sync: SyncPoint): boolean {
    // Simple condition evaluation
    if (sync.condition === 'all_streams_confidence > 0.5') {
      return sync.streams.every(id => {
        const stream = this.streams.get(id);
        return stream && stream.currentConfidence > 0.5;
      });
    }
    
    return false;
  }
  
  private executeSyncAction(sync: SyncPoint): void {
    this.logger.info(`🔄 Executing sync point: ${sync.id}`);
    
    if (sync.action === 'coordinate_actions') {
      // Trigger actions across coordinated streams
      for (const streamId of sync.streams) {
        const stream = this.streams.get(streamId);
        if (stream) {
          stream.triggerActions();
        }
      }
    }
    
    this.emit('sync_point_executed', sync);
  }
  
  private checkActionTriggers(): void {
    for (const [actionId, trigger] of this.actionTriggers) {
      if (this.evaluateTrigger(trigger)) {
        this.executeTrigger(actionId);
      }
    }
  }
  
  private evaluateTrigger(trigger: ActionTrigger): boolean {
    // Evaluate trigger conditions
    const results = trigger.conditions.map(condition => {
      switch (condition.type) {
        case 'confidence':
          // Find stream with this action
          for (const stream of this.streams.values()) {
            if (stream.enabledActions.has(trigger.actionId)) {
              return this.evaluateCondition(stream.currentConfidence, condition);
            }
          }
          return false;
          
        default:
          return false;
      }
    });
    
    // Apply combination logic
    if (trigger.combinationLogic === 'all') {
      return results.every(r => r);
    } else if (trigger.combinationLogic === 'any') {
      return results.some(r => r);
    } else if (trigger.customLogic) {
      return trigger.customLogic(trigger.conditions);
    }
    
    return false;
  }
  
  private evaluateCondition(value: number, condition: TriggerCondition): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '>=': return value >= condition.threshold;
      case '=': return value === condition.threshold;
      case '<=': return value <= condition.threshold;
      case '<': return value < condition.threshold;
      default: return false;
    }
  }
  
  private executeTrigger(actionId: string): void {
    // Find and execute action
    for (const stream of this.streams.values()) {
      const action = stream.enabledActions.get(actionId);
      if (action) {
        stream.triggerActions();
        break;
      }
    }
  }
}