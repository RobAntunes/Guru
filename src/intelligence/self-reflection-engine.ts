import * as fs from "fs";
import * as path from "path";

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
  private storagePath = path.join(process.cwd(), ".guru", "peer-reviews.json");
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
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let all: PeerReview[] = [];
      if (fs.existsSync(this.storagePath)) {
        all = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
      }
      all.push(review);
      fs.writeFileSync(this.storagePath, JSON.stringify(all, null, 2), "utf-8");
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
  private storagePath = path.join(process.cwd(), ".guru", "consensus.json");
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
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(result, null, 2),
        "utf-8",
      );
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
  private storagePath = path.join(
    process.cwd(),
    ".guru",
    "adaptive-params.json",
  );
  private historyPath = path.join(
    process.cwd(),
    ".guru",
    "adaptive-history.json",
  );
  private confidence_thresholds: Record<FeedbackSource, number> = {
    naming: 0.6,
    clustering: 0.7,
    patterns: 0.8,
  };
  private adjustment_history: any[] = [];
  private learning_rate = 0.05;

  constructor() {
    // Load adjustment history if present
    if (fs.existsSync(this.historyPath)) {
      try {
        this.adjustment_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch (e) {
        this.adjustment_history = [];
      }
    }
  }

  async adjustParameters(
    feedback: FeedbackEvent & { confidence?: number; actual?: boolean },
  ) {
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
    }
    return { ...this.confidence_thresholds };
  }

  async getThresholds() {
    if (fs.existsSync(this.storagePath)) {
      return JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
    }
    return { ...this.confidence_thresholds };
  }

  async persistParams() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.confidence_thresholds, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist adaptive params:", e);
    }
  }

  async recordHistory(entry: any) {
    this.adjustment_history.push(entry);
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.adjustment_history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist adaptive history:", e);
    }
  }

  async getAdjustmentHistory() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.adjustment_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch (e) {
        // fallback to in-memory
      }
    }
    return this.adjustment_history;
  }
}

// --- Pattern Weight Learning ---
export class PatternLearning {
  private storagePath = path.join(
    process.cwd(),
    ".guru",
    "pattern-weights.json",
  );
  private historyPath = path.join(
    process.cwd(),
    ".guru",
    "pattern-weights-history.json",
  );
  private metadataPath = path.join(
    process.cwd(),
    ".guru",
    "pattern-weights-meta.json",
  );
  private pattern_weights = new Map<string, number>();
  private update_history: any[] = [];
  private pattern_metadata: Record<string, any> = {};
  private minWeight = 0.1;
  private maxWeight = 10;

  constructor() {
    // Load weights, history, and metadata if present
    if (fs.existsSync(this.storagePath)) {
      try {
        const obj = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
        for (const k in obj) this.pattern_weights.set(k, obj[k]);
      } catch {}
    }
    if (fs.existsSync(this.historyPath)) {
      try {
        this.update_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
    if (fs.existsSync(this.metadataPath)) {
      try {
        this.pattern_metadata = JSON.parse(
          fs.readFileSync(this.metadataPath, "utf-8"),
        );
      } catch {}
    }
  }

  async updateWeights(
    successful_patterns: string[],
    failed_patterns: string[],
  ) {
    const now = new Date().toISOString();
    // Successes
    successful_patterns.forEach((pattern) => {
      const current = this.pattern_weights.get(pattern) || 1.0;
      const newWeight = Math.min(this.maxWeight, current * 1.05);
      this.pattern_weights.set(pattern, newWeight);
      this.update_history.push({
        pattern,
        type: "success",
        delta: newWeight - current,
        timestamp: now,
      });
      this._updateMeta(pattern, true, now);
    });
    // Fails
    failed_patterns.forEach((pattern) => {
      const current = this.pattern_weights.get(pattern) || 1.0;
      const newWeight = Math.max(this.minWeight, current * 0.95);
      this.pattern_weights.set(pattern, newWeight);
      this.update_history.push({
        pattern,
        type: "fail",
        delta: newWeight - current,
        timestamp: now,
      });
      this._updateMeta(pattern, false, now);
    });
    this._normalizeWeights();
    await this.persistAll();
  }

  _normalizeWeights() {
    const sum = Array.from(this.pattern_weights.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const N = this.pattern_weights.size || 1;
    if (sum === 0) return;
    for (const [k, v] of this.pattern_weights.entries()) {
      let norm = (v * N) / sum;
      norm = Math.max(this.minWeight, Math.min(this.maxWeight, norm));
      this.pattern_weights.set(k, norm);
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
    for (const [k, v] of this.pattern_weights.entries()) {
      const decayed = Math.max(this.minWeight, v * rate);
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
  }

  async getWeights() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const obj = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
        for (const k in obj) this.pattern_weights.set(k, obj[k]);
      } catch {}
    }
    const obj: any = {};
    for (const [k, v] of this.pattern_weights.entries()) obj[k] = v;
    return obj;
  }

  async getHistory() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.update_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
    return this.update_history;
  }

  async getMetadata() {
    if (fs.existsSync(this.metadataPath)) {
      try {
        this.pattern_metadata = JSON.parse(
          fs.readFileSync(this.metadataPath, "utf-8"),
        );
      } catch {}
    }
    return this.pattern_metadata;
  }

  async persistAll() {
    try {
      const obj: any = {};
      for (const [k, v] of this.pattern_weights.entries()) obj[k] = v;
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storagePath, JSON.stringify(obj, null, 2), "utf-8");
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.update_history, null, 2),
        "utf-8",
      );
      fs.writeFileSync(
        this.metadataPath,
        JSON.stringify(this.pattern_metadata, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist pattern weights/history/meta:", e);
    }
  }
}

// --- Adversarial Self-Testing ---
export class AdversarialTester {
  private storagePath = path.join(process.cwd(), ".guru", "adversarial.json");
  private historyPath = path.join(
    process.cwd(),
    ".guru",
    "adversarial-history.json",
  );
  private test_history: any[] = [];

  constructor() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.test_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
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
    await this.persistHistory();
    return result;
  }

  async persistAdversarial(result: any) {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(result, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist adversarial test:", e);
    }
  }
  async persistHistory() {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.test_history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist adversarial history:", e);
    }
  }
  async getHistory() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.test_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
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
  private storagePath = path.join(
    process.cwd(),
    ".guru",
    "confidence-calibration.json",
  );
  private historyPath = path.join(
    process.cwd(),
    ".guru",
    "confidence-calibration-history.json",
  );
  private calibration_history: CalibrationEvent[] = [];

  constructor() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.calibration_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
  }

  async calibrateConfidence(
    prediction: { confidence: number; module?: string; symbolId?: string },
    outcome: { correct: boolean },
  ) {
    const calibration: CalibrationEvent = {
      predicted_confidence: prediction.confidence,
      actual_outcome: outcome.correct,
      module: prediction.module,
      symbolId: prediction.symbolId,
      timestamp: new Date().toISOString(),
    };
    this.calibration_history.push(calibration);
    await this.persistCalibration();
    await this.persistHistory();
    return calibration;
  }
  async getCalibrationStats(windowSize: number = 100, since?: string) {
    if (fs.existsSync(this.storagePath)) {
      this.calibration_history = JSON.parse(
        fs.readFileSync(this.storagePath, "utf-8"),
      );
    }
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
  async persistCalibration() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.calibration_history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist calibration:", e);
    }
  }
  async persistHistory() {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.calibration_history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist calibration history:", e);
    }
  }
  async getHistory() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.calibration_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
    return this.calibration_history;
  }
}

// --- Meta-Learning ---
export class MetaLearner {
  private storagePath = path.join(process.cwd(), ".guru", "meta-learning.json");
  private historyPath = path.join(
    process.cwd(),
    ".guru",
    "meta-learning-history.json",
  );
  private learning_history: any[] = [];
  private strategy_stats: Record<string, { count: number; success: number }> =
    {};

  constructor() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.learning_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
  }

  async learnLearningPatterns(feedbackEvents: any[] = []) {
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
    await this.persistMetaLearning(result);
    await this.persistHistory();
    return result;
  }
  async getMetaLearning() {
    if (fs.existsSync(this.storagePath)) {
      return JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
    }
    return null;
  }
  async persistMetaLearning(result: any) {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(result, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist meta-learning:", e);
    }
  }
  async persistHistory() {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.learning_history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist meta-learning history:", e);
    }
  }
  async getHistory() {
    if (fs.existsSync(this.historyPath)) {
      try {
        this.learning_history = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8"),
        );
      } catch {}
    }
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
