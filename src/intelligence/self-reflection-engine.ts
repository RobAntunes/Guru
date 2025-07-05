import * as fs from "fs";
import * as path from "path";
import { getDatabase, DatabaseAdapter } from "../core/database-adapter.js";

export interface DecisionPoint {
  symbolId: string;
  decision: string;
  confidence: number;
  correct?: boolean;
  evidence?: string[];
}

export interface SelfReflection {
  analysisSession: string;
  decisions: DecisionPoint[];
  confidence_accuracy: number;
  blind_spots: string[];
  overconfidence_patterns: string[];
  uncertainty_patterns: string[];
  improvement_plan: string[];
}

export class SelfReflectionEngine {
  private storagePath = path.join(
    process.cwd(),
    ".guru",
    "self-reflection.json",
  );

  async reflectOnAnalysis(analysis: any): Promise<SelfReflection> {
    const sessionId = new Date().toISOString();
    const decisions = this.extractDecisions(analysis);
    const confidence_accuracy = this.analyzeConfidenceAccuracy(decisions);
    const blind_spots = this.detectBlindSpots(decisions);
    const overconfidence_patterns = this.detectOverconfidence(decisions);
    const uncertainty_patterns = this.detectUncertainty(decisions);
    const improvement_plan = this.generateSelfImprovementPlan({
      decisions,
      confidence_accuracy,
      blind_spots,
      overconfidence_patterns,
      uncertainty_patterns,
    });
    const reflection: SelfReflection = {
      analysisSession: sessionId,
      decisions,
      confidence_accuracy,
      blind_spots,
      overconfidence_patterns,
      uncertainty_patterns,
      improvement_plan,
    };
    await this.persistReflection(reflection);
    return reflection;
  }

  extractDecisions(analysis: any): DecisionPoint[] {
    // Example: extract from healthScores or similar
    if (!analysis || !analysis.healthScores) return [];
    return analysis.healthScores.map((h: any) => ({
      symbolId: h.symbolId,
      decision: h.score < 50 ? "flagged" : "ok",
      confidence: h.score / 100,
      correct: undefined, // To be filled in with feedback
      evidence: h.suggestions || [],
    }));
  }

  analyzeConfidenceAccuracy(decisions: DecisionPoint[]): number {
    // Placeholder: accuracy = % of correct when confident (>0.8)
    const confident = decisions.filter((d) => d.confidence > 0.8);
    if (!confident.length) return 1.0;
    const correct = confident.filter((d) => d.correct !== false).length;
    return correct / confident.length;
  }

  detectBlindSpots(decisions: DecisionPoint[]): string[] {
    // Real logic: flag symbols with low confidence, flagged, and no supporting evidence
    return decisions
      .filter(
        (d) =>
          d.confidence < 0.5 &&
          d.decision === "flagged" &&
          (!d.evidence || d.evidence.length === 0),
      )
      .map((d) => d.symbolId);
  }

  detectOverconfidence(decisions: DecisionPoint[]): string[] {
    // Real logic: high confidence, marked 'ok', but later found incorrect (if feedback present)
    return decisions
      .filter(
        (d) => d.confidence > 0.8 && d.decision === "ok" && d.correct === false,
      )
      .map((d) => d.symbolId);
  }

  detectUncertainty(decisions: DecisionPoint[]): string[] {
    // Real logic: confidence in the middle range, decision not clear, or conflicting evidence
    return decisions
      .filter(
        (d) =>
          d.confidence >= 0.4 &&
          d.confidence <= 0.6 &&
          d.decision !== "flagged",
      )
      .map((d) => d.symbolId);
  }

  generateSelfImprovementPlan(reflection: any): string[] {
    const plan: string[] = [];
    if (reflection.overconfidence_patterns.length)
      plan.push("Lower confidence for similar patterns.");
    if (reflection.blind_spots.length)
      plan.push("Investigate blind spots and add new detectors.");
    if (reflection.uncertainty_patterns.length)
      plan.push("Improve reasoning for uncertain cases.");
    if (!plan.length)
      plan.push("Maintain current strategy, monitor for drift.");
    return plan;
  }

  async persistReflection(reflection: SelfReflection) {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let all: SelfReflection[] = [];
      if (fs.existsSync(this.storagePath)) {
        all = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
      }
      all.push(reflection);
      fs.writeFileSync(this.storagePath, JSON.stringify(all, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist self-reflection:", e);
    }
  }

  // Stubs for future peer review, adaptive tuning, etc.
  // ...
}

// --- Peer Review ---
export interface Critique {
  message: string;
  evidence?: string[];
}
export interface Suggestion {
  message: string;
}
export interface ConfidenceAdjustment {
  symbolId: string;
  adjustment: number;
  reason: string;
}
export interface PeerReview {
  reviewer: string;
  reviewee: string;
  analysis_id: string;
  critiques: Critique[];
  suggestions: Suggestion[];
  confidence_adjustments: ConfidenceAdjustment[];
}

// --- Peer Review Personalities ---
export class ConservativeAnalyst {
  name = "ConservativeAnalyst";
  review(analysis: any): Critique {
    // Critique high confidence with weak evidence
    const highConf = (analysis.healthScores || []).filter(
      (h: any) => h.score > 80 && (h.suggestions || []).length < 2,
    );
    if (highConf.length) {
      return {
        message: `High confidence with weak evidence for ${highConf[0].symbolId}`,
      };
    }
    return { message: "No major issues (conservative)." };
  }
}
export class AggressiveAnalyst {
  name = "AggressiveAnalyst";
  review(analysis: any): Critique {
    // Critique low confidence, suggest bolder inference
    const lowConf = (analysis.healthScores || []).filter(
      (h: any) => h.score < 50 && (h.suggestions || []).length > 2,
    );
    if (lowConf.length) {
      return {
        message: `Too cautious on ${lowConf[0].symbolId}, should infer more boldly.`,
      };
    }
    return { message: "No major issues (aggressive)." };
  }
}
export class SkepticalAnalyst {
  name = "SkepticalAnalyst";
  review(analysis: any): Critique {
    // Critique any contradictions or inconsistencies
    const contradictions = (analysis.healthScores || []).filter(
      (h: any) =>
        h.score > 60 &&
        (h.suggestions || []).includes("Address critical memory issues"),
    );
    if (contradictions.length) {
      return {
        message: `Contradiction: ${contradictions[0].symbolId} has high score but critical issues.`,
      };
    }
    return { message: "No contradictions found." };
  }
}
export class PeerReviewEngine {
  private db: DatabaseAdapter;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading PeerReviewEngine with database integration...");
  }

  async reviewAnalysis(
    analysis: any,
    reviewer: string,
    reviewee: string,
  ): Promise<PeerReview> {
    // Real critique logic
    const critiques: Critique[] = [];
    const suggestions: Suggestion[] = [];
    const healthScores = analysis.healthScores || [];
    for (const h of healthScores) {
      if (h.score > 90 && (!h.suggestions || h.suggestions.length < 1)) {
        critiques.push({
          message: `High confidence for ${h.symbolId} but little evidence.`,
        });
        suggestions.push({
          message: `Add more evidence or tests for ${h.symbolId}.`,
        });
      }
      if (h.score < 50) {
        critiques.push({ message: `Low confidence for ${h.symbolId}.` });
        suggestions.push({ message: `Investigate and improve ${h.symbolId}.` });
      }
      if (
        h.suggestions &&
        h.suggestions.includes("Address critical memory issues")
      ) {
        critiques.push({
          message: `Critical memory issue flagged for ${h.symbolId}.`,
        });
        suggestions.push({
          message: `Prioritize fixing memory issues in ${h.symbolId}.`,
        });
      }
    }
    if (critiques.length === 0)
      critiques.push({ message: "No major issues found." });
    if (suggestions.length === 0)
      suggestions.push({
        message: "Maintain current approach, but monitor for drift.",
      });
    const review: PeerReview = {
      reviewer,
      reviewee,
      analysis_id: analysis.analysisSession || new Date().toISOString(),
      critiques,
      suggestions,
      confidence_adjustments: [],
    };
    await this.persistReview(review);
    return review;
  }

  async persistReview(review: PeerReview) {
    try {
      await this.db.storePeerReview(
        review.reviewer,
        review.analysis_id,
        {
          reviewee: review.reviewee,
          critiques: review.critiques,
          suggestions: review.suggestions,
          confidence_adjustments: review.confidence_adjustments
        }
      );
      console.log(`💾 Persisted peer review from ${review.reviewer} to database`);
    } catch (e) {
      console.error("Failed to persist peer review:", e);
    }
  }
}

// --- Consensus Engine ---
export interface ConsensusResult {
  high_confidence: any[];
  needs_review: any[];
  consensus_confidence: number;
}
export class ConsensusEngine {
  private db: DatabaseAdapter;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading ConsensusEngine with database integration...");
  }

  async buildConsensus(analyses: any[]): Promise<ConsensusResult> {
    // Find agreements: same decision, high confidence
    const symbolMap: {
      [symbolId: string]: { decisions: string[]; confidences: number[] };
    } = {};
    for (const analysis of analyses) {
      for (const h of analysis.healthScores || []) {
        if (!symbolMap[h.symbolId])
          symbolMap[h.symbolId] = { decisions: [], confidences: [] };
        symbolMap[h.symbolId].decisions.push(h.score < 50 ? "flagged" : "ok");
        symbolMap[h.symbolId].confidences.push(h.score / 100);
      }
    }
    const high_confidence: any[] = [];
    const needs_review: any[] = [];
    let totalConfidence = 0,
      count = 0;
    for (const [symbolId, { decisions, confidences }] of Object.entries(
      symbolMap,
    )) {
      const uniqueDecisions = Array.from(new Set(decisions));
      const maxConf = Math.max(...confidences);
      const minConf = Math.min(...confidences);
      const spread = maxConf - minConf;
      const avgConf =
        confidences.reduce((a, b) => a + b, 0) / confidences.length;
      totalConfidence += avgConf;
      count++;
      if (uniqueDecisions.length === 1 && avgConf > 0.8) {
        high_confidence.push({
          symbolId,
          decision: uniqueDecisions[0],
          confidence: avgConf,
        });
      } else if (spread > 0.3) {
        needs_review.push({
          symbolId,
          decisions,
          confidences,
          confidence_spread: spread,
        });
      }
    }
    const consensus_confidence = count ? totalConfidence / count : 0;
    const result: ConsensusResult = {
      high_confidence,
      needs_review,
      consensus_confidence,
    };
    await this.persistConsensus(result);
    return result;
  }

  async persistConsensus(result: ConsensusResult) {
    try {
      const analysisId = `consensus-${Date.now()}`;
      await this.db.storeConsensusResult(
        analysisId,
        result,
        result.consensus_confidence,
        result.high_confidence.length + result.needs_review.length
      );
      console.log(`💾 Persisted consensus result for ${analysisId} to database`);
    } catch (e) {
      console.error("Failed to persist consensus:", e);
    }
  }
}

// --- Adaptive Tuning ---
export type FeedbackSource = "naming" | "clustering" | "patterns";
export interface FeedbackEvent {
  type: string;
  source: FeedbackSource;
}
export class AdaptiveTuning {
  private db: DatabaseAdapter;
  private confidence_thresholds: Record<FeedbackSource, number> = {
    naming: 0.6,
    clustering: 0.7,
    patterns: 0.8,
  };
  private adjustment_history: any[] = [];
  private learning_rate = 0.05;
  private isInitialized = false;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading AdaptiveTuning with database integration...");
  }

  private async ensureInitialized() {
    if (this.isInitialized) return;

    try {
      // Load adjustment history from database
      const history = await this.db.getAdaptiveHistory('*', 1000);
      this.adjustment_history = history;
      console.log(`✅ Loaded ${history.length} adaptive tuning entries from database`);
    } catch (e) {
      console.error("Failed to load adaptive tuning history:", e);
      this.adjustment_history = [];
    }

    this.isInitialized = true;
  }

  async adjustParameters(
    feedback: FeedbackEvent & { confidence?: number; actual?: boolean },
  ) {
    await this.ensureInitialized();
    
    let changed = false;
    const { type, source, confidence, actual } = feedback;
    let prev = this.confidence_thresholds[source];
    let adjustment = 0;
    // Apply moving average logic if confidence/actual are present
    if (
      typeof confidence === "number" &&
      typeof actual === "boolean" &&
      source in this.confidence_thresholds
    ) {
      const error = (actual ? 1 : 0) - confidence;
      adjustment = this.learning_rate * error;
      this.confidence_thresholds[source] = prev + adjustment;
      changed = true;
      console.debug("[AdaptiveTuning] Moving average logic applied:", {
        source,
        prev,
        confidence,
        actual,
        adjustment,
        new: this.confidence_thresholds[source],
      });
    } else {
      if (type === "overconfidence" && source in this.confidence_thresholds) {
        adjustment = -this.learning_rate * prev;
        this.confidence_thresholds[source] = prev + adjustment;
        changed = true;
      }
      if (type === "underconfidence" && source in this.confidence_thresholds) {
        adjustment = this.learning_rate * prev;
        this.confidence_thresholds[source] = prev + adjustment;
        changed = true;
      }
    }
    // Clamp thresholds after any adjustment
    if (changed) {
      this.confidence_thresholds[source] = Math.min(
        0.99,
        Math.max(0.1, this.confidence_thresholds[source]),
      );
      await this.persistParams();
      await this.recordHistory({
        timestamp: new Date().toISOString(),
        type,
        source,
        prev,
        new: this.confidence_thresholds[source],
        adjustment,
        confidence,
        actual,
      });
      console.log(`🎛️ Adjusted ${source} threshold: ${prev.toFixed(3)} → ${this.confidence_thresholds[source].toFixed(3)} (Δ${adjustment.toFixed(3)})`);
    }
    return { ...this.confidence_thresholds };
  }

  async getThresholds() {
    await this.ensureInitialized();
    return { ...this.confidence_thresholds };
  }

  async persistParams() {
    try {
      for (const [paramName, value] of Object.entries(this.confidence_thresholds)) {
        await this.db.storeAdaptiveTuning(
          paramName,
          value,
          'confidence_threshold',
          undefined,
          { type: 'threshold_update' }
        );
      }
      console.log(`💾 Persisted ${Object.keys(this.confidence_thresholds).length} adaptive parameters to database`);
    } catch (e) {
      console.error("Failed to persist adaptive params:", e);
    }
  }

  async recordHistory(entry: any) {
    this.adjustment_history.push(entry);
    try {
      await this.db.storeAdaptiveHistory(
        entry.source,
        entry.prev,
        entry.new,
        `${entry.type} adjustment`,
        entry.adjustment
      );
      console.log(`📊 Recorded adaptive history: ${entry.source} ${entry.prev?.toFixed(3)} → ${entry.new?.toFixed(3)} (Δ${entry.adjustment?.toFixed(3)})`);
    } catch (e) {
      console.error("Failed to persist adaptive history:", e);
    }
  }

  async getAdjustmentHistory() {
    await this.ensureInitialized();
    return this.adjustment_history;
  }
}

// --- Pattern Weight Learning ---
export class PatternLearning {
  private pattern_weights = new Map<string, number>();
  private update_history: any[] = [];
  private pattern_metadata: Record<string, any> = {};
  private minWeight = 0.1;
  private maxWeight = 10;
  private isInitialized = false;

  constructor() {
    // Don't store database reference in constructor - get fresh one each time
    // Lazy load on first use to avoid blocking construction
  }

  private getDatabase(): DatabaseAdapter {
    // Always get fresh database instance to handle resets properly
    return getDatabase();
  }

  private async ensureInitialized() {
    if (this.isInitialized) return;
    
    try {
      console.log('📊 Loading PatternLearning from database...');
      
      // Load weights from database
      this.pattern_weights = await this.getDatabase().loadPatternWeights();
      
      console.log(`✅ Loaded ${this.pattern_weights.size} pattern weights from database`);
      this.isInitialized = true;
    } catch (error) {
      console.warn('⚠️ Failed to load pattern weights from database, using defaults:', error);
      this.isInitialized = true;
    }
  }

  async updateWeights(
    successful_patterns: string[],
    failed_patterns: string[],
  ) {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    const updates: Array<{pattern: string, weight: number, type: string, delta: number}> = [];
    
    // Successes
    successful_patterns.forEach((pattern) => {
      const current = this.pattern_weights.get(pattern) || 1.0;
      const newWeight = Math.min(this.maxWeight, current * 1.05);
      this.pattern_weights.set(pattern, newWeight);
      updates.push({
        pattern,
        weight: newWeight,
        type: "success",
        delta: newWeight - current
      });
      this._updateMeta(pattern, true, now);
    });
    
    // Fails
    failed_patterns.forEach((pattern) => {
      const current = this.pattern_weights.get(pattern) || 1.0;
      const newWeight = Math.max(this.minWeight, current * 0.95);
      this.pattern_weights.set(pattern, newWeight);
      updates.push({
        pattern,
        weight: newWeight,
        type: "fail",
        delta: newWeight - current
      });
      this._updateMeta(pattern, false, now);
    });
    
    this._normalizeWeights();
    await this.persistAll();
    
    console.log(`🔄 Updated ${updates.length} pattern weights: ${updates.map(u => `${u.pattern}=${u.weight.toFixed(3)}`).join(', ')}`);
  }

  _normalizeWeights() {
    const values = Array.from(this.pattern_weights.values());
    if (values.length === 0) return;
    
    // Only normalize if weights are getting too extreme (either too high or too low)
    const maxWeight = Math.max(...values);
    const minWeight = Math.min(...values);
    
    // If all weights are within reasonable bounds, don't normalize
    if (maxWeight <= this.maxWeight && minWeight >= this.minWeight) {
      return;
    }
    
    // If we need to normalize, scale to fit within bounds while preserving relationships
    const scale = Math.min(
      this.maxWeight / maxWeight,
      this.minWeight / minWeight
    );
    
    for (const [k, v] of this.pattern_weights.entries()) {
      const scaled = v * scale;
      const clamped = Math.max(this.minWeight, Math.min(this.maxWeight, scaled));
      this.pattern_weights.set(k, clamped);
    }
  }

  _updateMeta(pattern: string, success: boolean, now: string) {
    if (!this.pattern_metadata[pattern]) {
      this.pattern_metadata[pattern] = {
        lastUpdated: now,
        successCount: 0,
        failCount: 0,
      };
    }
    this.pattern_metadata[pattern].lastUpdated = now;
    if (success) this.pattern_metadata[pattern].successCount++;
    else this.pattern_metadata[pattern].failCount++;
  }

  async decayWeights(rate = 0.99) {
    await this.ensureInitialized();
    
    const updates: Array<{pattern: string, oldWeight: number, newWeight: number}> = [];
    
    for (const [k, v] of this.pattern_weights.entries()) {
      const decayed = Math.max(this.minWeight, v * rate);
      updates.push({pattern: k, oldWeight: v, newWeight: decayed});
      this.pattern_weights.set(k, decayed);
    }
    
    this._normalizeWeights();
    
    // Clamp again after normalization
    for (const [k, v] of this.pattern_weights.entries()) {
      this.pattern_weights.set(
        k,
        Math.max(this.minWeight, Math.min(this.maxWeight, v)),
      );
    }
    
    await this.persistAll();
    
    if (updates.length > 0) {
      const avgDecay = updates.reduce((sum, u) => sum + (u.oldWeight - u.newWeight), 0) / updates.length;
      console.log(`⏰ Decayed ${updates.length} pattern weights by ${(1-rate)*100}% (avg: ${avgDecay.toFixed(4)})`);
    }
  }

  async getWeights() {
    await this.ensureInitialized();
    
    // Always return fresh data from database
    this.pattern_weights = await this.getDatabase().loadPatternWeights();
    
    const obj: any = {};
    for (const [k, v] of this.pattern_weights.entries()) obj[k] = v;
    return obj;
  }

  async getHistory(pattern?: string, limit: number = 100) {
    if (pattern) {
      return await this.getDatabase().getPatternHistory(pattern, limit);
    }
    
    // For all patterns, we'd need to aggregate - for now return empty
    return [];
  }

  async getMetadata() {
    // Pattern metadata is stored as part of pattern weights in database
    // For now, return the in-memory metadata
    return this.pattern_metadata;
  }

  async persistAll() {
    try {
      // Save all current weights to database
      await this.getDatabase().savePatternWeights(this.pattern_weights, {
        timestamp: Date.now(),
        source: 'pattern_learning',
        metadata: this.pattern_metadata
      });
      
      console.log(`💾 Persisted ${this.pattern_weights.size} pattern weights to database`);
    } catch (e) {
      console.error("Failed to persist pattern weights to database:", e);
    }
  }
}

// --- Adversarial Self-Testing ---
export class AdversarialTester {
  private db: DatabaseAdapter;
  private test_history: any[] = [];
  private isInitialized = false;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading AdversarialTester with database integration...");
  }

  private async ensureInitialized() {
    if (this.isInitialized) return;

    try {
      // Load test history from database - we'll implement when we have test IDs
      console.log("✅ AdversarialTester initialized with database");
    } catch (e) {
      console.error("Failed to initialize AdversarialTester:", e);
    }

    this.isInitialized = true;
  }

  // Generate adversarial cases based on analysis
  generateAdversarialCases(analysis: any) {
    const cases = [];
    // Target low-confidence, high-complexity, or flagged anti-patterns
    const lowConf = (analysis.healthScores || []).filter(
      (h: any) => h.score < 60,
    );
    for (const h of lowConf) {
      cases.push({
        symbolId: h.symbolId,
        code: `// Adversarial: mutate ${h.symbolId}`,
      });
    }
    // Add generic ambiguous/edge cases
    cases.push({
      symbolId: "ambiguousHandler",
      code: "function handle(data) { return data; }",
    });
    cases.push({ symbolId: "conflictingPattern", code: "let x = x ? 1 : 0;" });
    return cases;
  }

  async challengeAnalysis(analysis: any): Promise<any> {
    await this.ensureInitialized();
    
    const adversarialCases = this.generateAdversarialCases(analysis);
    const weaknesses = adversarialCases
      .filter(
        (a) =>
          !(analysis.healthScores || []).some(
            (h: any) => h.symbolId === a.symbolId && h.score > 60,
          ),
      )
      .map((a) => a.symbolId);
    const strengths = adversarialCases
      .filter((a) =>
        (analysis.healthScores || []).some(
          (h: any) => h.symbolId === a.symbolId && h.score > 60,
        ),
      )
      .map((a) => a.symbolId);
    const improvement_areas = weaknesses.map(
      (w) => `Add targeted tests or refactor for ${w}`,
    );
    const result = {
      weaknesses,
      strengths,
      improvement_areas,
      timestamp: new Date().toISOString(),
    };
    this.test_history.push(result);
    await this.persistAdversarial(result);
    return result;
  }

  async persistAdversarial(result: any) {
    try {
      await this.db.saveAdversarialTest(
        'adversarial-challenge',
        result,
        0.8, // Default confidence for adversarial tests
        {
          weaknesses: result.weaknesses,
          strengths: result.strengths,
          improvement_areas: result.improvement_areas
        }
      );
      console.log(`💾 Persisted adversarial test with ${result.weaknesses.length} weaknesses and ${result.strengths.length} strengths`);
    } catch (e) {
      console.error("Failed to persist adversarial test:", e);
    }
  }

  async getHistory() {
    await this.ensureInitialized();
    return this.test_history;
  }
  getStats() {
    return {
      total: this.test_history.length,
      weaknesses: this.test_history.flatMap((t) => t.weaknesses || []).length,
      strengths: this.test_history.flatMap((t) => t.strengths || []).length,
    };
  }
}

// --- Confidence Calibration ---
export interface CalibrationEvent {
  predicted_confidence: number;
  actual_outcome: boolean;
  module?: string;
  symbolId?: string;
  timestamp: string;
}
export class ConfidenceCalibrator {
  private db: DatabaseAdapter;
  private calibration_history: CalibrationEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading ConfidenceCalibrator with database integration...");
  }

  private async ensureInitialized() {
    if (this.isInitialized) return;

    try {
      // Load calibration history from database - we'll load when needed
      console.log("✅ ConfidenceCalibrator initialized with database");
    } catch (e) {
      console.error("Failed to initialize ConfidenceCalibrator:", e);
    }

    this.isInitialized = true;
  }

  async calibrateConfidence(
    prediction: { confidence: number; module?: string; symbolId?: string },
    outcome: { correct: boolean },
  ) {
    await this.ensureInitialized();
    
    const calibration: CalibrationEvent = {
      predicted_confidence: prediction.confidence,
      actual_outcome: outcome.correct,
      module: prediction.module,
      symbolId: prediction.symbolId,
      timestamp: new Date().toISOString(),
    };
    this.calibration_history.push(calibration);
    
    await this.db.saveConfidenceCalibration(
      prediction.confidence,
      outcome.correct ? 1 : 0,
      `${prediction.module || 'unknown'}:${prediction.symbolId || 'unknown'}`,
      prediction.confidence
    );
    
    console.log(`📊 Calibrated confidence: predicted=${prediction.confidence.toFixed(3)}, actual=${outcome.correct ? 1 : 0} for ${prediction.symbolId || 'unknown'}`);
    return calibration;
  }
  async getCalibrationStats(windowSize: number = 100, since?: string) {
    await this.ensureInitialized();
    
    let history = this.calibration_history;
    if (since) {
      const sinceDate = new Date(since);
      history = history.filter((c) => new Date(c.timestamp) >= sinceDate);
    }
    if (windowSize > 0 && history.length > windowSize) {
      history = history.slice(-windowSize);
    }
    // Compute accuracy at each confidence level (rounded to nearest 0.1)
    const buckets: { [level: string]: { total: number; correct: number } } = {};
    for (const c of history) {
      const level = (Math.round(c.predicted_confidence * 10) / 10).toFixed(1);
      if (!buckets[level]) buckets[level] = { total: 0, correct: 0 };
      buckets[level].total++;
      if (c.actual_outcome) buckets[level].correct++;
    }
    const stats: { [level: string]: number } = {};
    for (const [level, { total, correct }] of Object.entries(buckets)) {
      stats[level] = total ? correct / total : 0;
    }
    // Systematic bias detection
    const all = Object.values(buckets).reduce((a, b) => a + b.total, 0);
    const correct = Object.values(buckets).reduce((a, b) => a + b.correct, 0);
    const overall = all ? correct / all : 1;
    let bias = "none";
    if (overall < 0.5) bias = "underconfident";
    else if (overall > 0.95) bias = "overconfident";
    return { stats, overall, bias };
  }
  async getHistory() {
    await this.ensureInitialized();
    return this.calibration_history;
  }
}

// --- Meta-Learning ---
export class MetaLearner {
  private db: DatabaseAdapter;
  private learning_history: any[] = [];
  private strategy_stats: Record<string, { count: number; success: number }> =
    {};
  private isInitialized = false;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
    console.log("📊 Loading MetaLearner with database integration...");
  }

  private async ensureInitialized() {
    if (this.isInitialized) return;

    try {
      // Load meta-learning history from database
      const history = await this.db.getMetaLearning('*', 1000);
      this.learning_history = history;
      console.log(`✅ Loaded ${history.length} meta-learning entries from database`);
    } catch (e) {
      console.error("Failed to initialize MetaLearner:", e);
      this.learning_history = [];
    }

    this.isInitialized = true;
  }

  async learnLearningPatterns(feedbackEvents: any[] = []) {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    let effectiveness = "no data";
    let optimal_strategy = "default";
    let success = 0;
    let count = feedbackEvents.length;
    for (const event of feedbackEvents) {
      if (event.success) success++;
      const strat = event.strategy || "default";
      if (!this.strategy_stats[strat])
        this.strategy_stats[strat] = { count: 0, success: 0 };
      this.strategy_stats[strat].count++;
      if (event.success) this.strategy_stats[strat].success++;
    }
    if (count > 0) {
      effectiveness = `${success}/${count} successful`;
      optimal_strategy =
        Object.entries(this.strategy_stats).sort(
          (a, b) => b[1].success / b[1].count - a[1].success / a[1].count,
        )[0]?.[0] || "default";
    }
    const result = {
      feedback_effectiveness: effectiveness,
      optimal_learning_strategy: optimal_strategy,
      updated: now,
      strategy_stats: this.strategy_stats,
    };
    this.learning_history.push({ ...result, feedbackEvents });
    
    await this.db.storeMetaLearning(
      'learning-patterns',
      result,
      success / Math.max(count, 1),
      optimal_strategy,
      success / Math.max(count, 1),
      { feedbackEvents, strategy_stats: this.strategy_stats }
    );
    
    console.log(`🧠 Meta-learned from ${count} feedback events: ${effectiveness}, optimal strategy: ${optimal_strategy}`);
    return result;
  }
  async getMetaLearning() {
    await this.ensureInitialized();
    return this.learning_history.length > 0 ? this.learning_history[this.learning_history.length - 1] : null;
  }

  async getHistory() {
    await this.ensureInitialized();
    return this.learning_history;
  }
  recommendStrategy() {
    // Recommend the strategy with highest success rate
    const best = Object.entries(this.strategy_stats).sort(
      (a, b) => b[1].success / b[1].count - a[1].success / a[1].count,
    )[0];
    return best ? best[0] : "default";
  }
}

// --- Feedback Orchestrator ---
export class FeedbackOrchestrator {
  private loops: any[] = [];
  constructor() {
    // Use real feedback loop instances
    this.loops = [
      new SelfReflectionEngine(),
      new PeerReviewEngine(),
      new AdaptiveTuning(),
      new ConfidenceCalibrator(),
      new AdversarialTester(),
      new MetaLearner(),
    ];
  }
  async orchestrateFeedback(analysis: any) {
    // Run all feedback loops and aggregate results
    const results = await Promise.all(
      this.loops.map(async (loop) => {
        if (typeof loop.reflectOnAnalysis === "function")
          return loop.reflectOnAnalysis(analysis);
        if (typeof loop.reviewAnalysis === "function")
          return loop.reviewAnalysis(
            analysis,
            "auto-reviewer",
            "auto-reviewee",
          );
        if (typeof loop.adjustParameters === "function")
          return loop.adjustParameters({ type: "auto", source: "naming" });
        if (typeof loop.calibrateConfidence === "function")
          return loop.calibrateConfidence(
            { confidence: 0.8 },
            { correct: true },
          );
        if (typeof loop.challengeAnalysis === "function")
          return loop.challengeAnalysis(analysis);
        if (typeof loop.learnLearningPatterns === "function")
          return loop.learnLearningPatterns([{ type: "feedback", value: 1 }]);
        return null;
      }),
    );
    // Aggregate and resolve conflicts (simple merge for now)
    return {
      feedbackResults: results,
      summary: "All feedback loops executed and results aggregated.",
    };
  }
}
