/**
 * Guru Database Layer - Direct replacement for JSON persistence
 * Designed to evolve toward DLGM Dynamic Logic Gate Memory architecture
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { guruConfig } from './config.js';
import { SymbolNode, SymbolEdge, SymbolGraph } from '../types/index.js';

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  memoryOptimized?: boolean;
  pragmas?: Record<string, any>;
}

// DEPRECATED: Human-centric pattern learning data
export interface PatternWeight {
  pattern: string;
  weight: number;
  updated_at: number;
  metadata?: string;
}

export interface PatternHistory {
  id: number;
  pattern: string;
  weight: number;
  timestamp: number;
  event_type: 'created' | 'updated' | 'decayed';
  source: string;
}

// AI-Native Pattern Detection
export interface DetectedPattern {
  id: string; // UUID
  hash: string; // Structural hash of the pattern
  type: 'emergent' | 'intended' | 'drifted';
  vector_embedding: string; // JSON serialized vector
  stability_score: number;
  complexity_score: number;
  frequency: number;
  created_at: number;
  updated_at: number;
  metadata: string; // JSON for extended features
}

export interface PatternInstance {
  id: string; // UUID
  pattern_id: string;
  symbol_id: string;
  role_in_pattern: string; // e.g., 'entry', 'exit', 'participant'
  confidence: number;
  created_at: number;
  metadata: string;
}

// Self-Reflection Data
export interface AdversarialTest {
  id: number;
  test_name: string;
  result: string; // JSON for complex results
  confidence: number;
  timestamp: number;
  metadata?: string;
}

export interface ConfidenceCalibration {
  id: number;
  prediction: number;
  actual: number;
  context: string;
  timestamp: number;
  calibration_score: number;
}

export interface PeerReview {
  id: number;
  reviewer_id: string;
  target_analysis: string;
  review_data: string; // JSON serialized review data
  confidence_score?: number;
  timestamp: number;
  metadata?: string;
}

export interface ConsensusResult {
  id: number;
  analysis_id: string;
  consensus_data: string; // JSON serialized consensus data
  confidence_level?: number;
  participant_count?: number;
  timestamp: number;
  metadata?: string;
}

export interface AdaptiveTuning {
  id: number;
  parameter_name: string;
  parameter_value: number;
  context?: string;
  performance_metric?: number;
  timestamp: number;
  metadata?: string;
}

export interface AdaptiveHistory {
  id: number;
  parameter_name: string;
  old_value?: number;
  new_value?: number;
  reason?: string;
  performance_delta?: number;
  timestamp: number;
}

export interface AdversarialHistory {
  id: number;
  test_id: number;
  iteration: number;
  input_data: string; // JSON serialized input
  output_data: string; // JSON serialized output
  passed: boolean;
  timestamp: number;
}

export interface MetaLearning {
  id: number;
  learning_task: string;
  learning_data: string; // JSON serialized learning data
  performance_metric?: number;
  adaptation_strategy?: string;
  success_rate?: number;
  timestamp: number;
  metadata?: string;
}

// File Analysis Cache
export interface FileAnalysisEntry {
  file_path: string;
  hash: string;
  last_modified: number;
  symbols: string; // JSON serialized SymbolNode[]
  dependencies: string; // JSON serialized string[]
  analysis_timestamp: number;
  version: string;
}

// Symbol Storage
export interface StoredSymbol {
  id: string;
  name: string;
  type: string;
  file_path: string;
  start_line: number;
  start_column: number;
  end_line: number;
  end_column: number;
  scope: string;
  metadata: string; // JSON serialized metadata
  embedding?: string; // JSON serialized number[] for future DLGM
  created_at: number;
  updated_at: number;
}

export interface StoredSymbolEdge {
  id: string;
  from_symbol: string;
  to_symbol: string;
  edge_type: string;
  weight: number;
  is_primary?: boolean; // For Smart Dependency Tracking
  confidence?: number; // For AI-native confidence scoring
  metadata?: string; // For rich context
  created_at: number;
}

// Analysis Results
export interface AnalysisSession {
  id: string;
  target_path: string;
  scan_mode: string;
  files_analyzed: number;
  total_files: number;
  timestamp: number;
  metadata: string; // JSON serialized analysis metadata
}

export class GuruDatabase {
  private db: Database.Database;
  private prepared: Map<string, Database.Statement> = new Map();

  constructor(config?: Partial<DatabaseConfig>) {
    const dbPath = config?.path || path.join(guruConfig.cacheDir, 'guru.db');
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    
    // Configure for performance
    if (config?.enableWAL !== false) {
      try {
        this.db.pragma('journal_mode = WAL');
      } catch (error) {
        console.warn('Failed to set WAL mode, falling back to DELETE mode:', error);
        this.db.pragma('journal_mode = DELETE');
      }
    }
    
    if (config?.memoryOptimized !== false) {
      // Memory-optimized settings
      this.db.pragma('cache_size = 64000'); // 64MB cache
      this.db.pragma('temp_store = memory');
      this.db.pragma('mmap_size = 268435456'); // 256MB
      this.db.pragma('synchronous = NORMAL');
    }

    // Apply custom pragmas
    if (config?.pragmas) {
      for (const [key, value] of Object.entries(config.pragmas)) {
        this.db.pragma(`${key} = ${value}`);
      }
    }

    this.initializeSchema();
    this.prepareStatements();
  }

  private initializeSchema(): void {
    // DEPRECATED: Human-centric pattern learning tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pattern_weights (
        pattern TEXT PRIMARY KEY,
        weight REAL NOT NULL,
        updated_at INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS pattern_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        weight REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        FOREIGN KEY (pattern) REFERENCES pattern_weights(pattern)
      );

      CREATE INDEX IF NOT EXISTS idx_pattern_history_pattern ON pattern_history(pattern);
      CREATE INDEX IF NOT EXISTS idx_pattern_history_timestamp ON pattern_history(timestamp);
    `);

    // AI-Native Pattern Detection Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detected_patterns (
        id TEXT PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        vector_embedding TEXT,
        stability_score REAL NOT NULL DEFAULT 0,
        complexity_score REAL NOT NULL DEFAULT 0,
        frequency INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS pattern_instances (
        id TEXT PRIMARY KEY,
        pattern_id TEXT NOT NULL,
        symbol_id TEXT NOT NULL,
        role_in_pattern TEXT,
        confidence REAL NOT NULL,
        created_at INTEGER NOT NULL,
        metadata TEXT,
        FOREIGN KEY (pattern_id) REFERENCES detected_patterns(id) ON DELETE CASCADE,
        FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_detected_patterns_hash ON detected_patterns(hash);
      CREATE INDEX IF NOT EXISTS idx_pattern_instances_pattern_id ON pattern_instances(pattern_id);
      CREATE INDEX IF NOT EXISTS idx_pattern_instances_symbol_id ON pattern_instances(symbol_id);
    `);

    // Self-Reflection Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS adversarial_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        result TEXT NOT NULL,
        confidence REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS confidence_calibration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction REAL NOT NULL,
        actual REAL NOT NULL,
        context TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        calibration_score REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS peer_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewer_id TEXT NOT NULL,
        target_analysis TEXT NOT NULL,
        review_data TEXT NOT NULL,
        confidence_score REAL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS consensus_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT UNIQUE NOT NULL,
        consensus_data TEXT NOT NULL,
        confidence_level REAL,
        participant_count INTEGER,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS adaptive_tuning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parameter_name TEXT NOT NULL,
        parameter_value REAL NOT NULL,
        context TEXT,
        performance_metric REAL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS adaptive_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parameter_name TEXT NOT NULL,
        old_value REAL,
        new_value REAL,
        reason TEXT,
        performance_delta REAL,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS adversarial_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        iteration INTEGER NOT NULL,
        input_data TEXT NOT NULL,
        output_data TEXT NOT NULL,
        passed BOOLEAN NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (test_id) REFERENCES adversarial_tests(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meta_learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_task TEXT NOT NULL,
        learning_data TEXT NOT NULL,
        performance_metric REAL,
        adaptation_strategy TEXT,
        success_rate REAL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_adversarial_timestamp ON adversarial_tests(timestamp);
      CREATE INDEX IF NOT EXISTS idx_confidence_timestamp ON confidence_calibration(timestamp);
      CREATE INDEX IF NOT EXISTS idx_peer_reviews_timestamp ON peer_reviews(timestamp);
      CREATE INDEX IF NOT EXISTS idx_consensus_analysis ON consensus_results(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_adaptive_tuning_param ON adaptive_tuning(parameter_name);
      CREATE INDEX IF NOT EXISTS idx_adaptive_history_param ON adaptive_history(parameter_name);
      CREATE INDEX IF NOT EXISTS idx_adversarial_history_test ON adversarial_history(test_id);
      CREATE INDEX IF NOT EXISTS idx_meta_learning_task ON meta_learning(learning_task);
    `);

    // File Analysis Cache
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_analysis_cache (
        file_path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        last_modified INTEGER NOT NULL,
        symbols TEXT NOT NULL,
        dependencies TEXT NOT NULL,
        analysis_timestamp INTEGER NOT NULL,
        version TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_file_cache_hash ON file_analysis_cache(hash);
      CREATE INDEX IF NOT EXISTS idx_file_cache_modified ON file_analysis_cache(last_modified);
    `);

    // Symbol Storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS symbols (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        start_column INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        end_column INTEGER NOT NULL,
        scope TEXT NOT NULL,
        metadata TEXT NOT NULL,
        embedding TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS symbol_edges (
        id TEXT PRIMARY KEY,
        from_symbol TEXT NOT NULL,
        to_symbol TEXT NOT NULL,
        edge_type TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1.0,
        is_primary BOOLEAN DEFAULT FALSE,
        confidence REAL DEFAULT 1.0,
        metadata TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_path);
      CREATE INDEX IF NOT EXISTS idx_symbols_type ON symbols(type);
      CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
      CREATE INDEX IF NOT EXISTS idx_edges_from ON symbol_edges(from_symbol);
      CREATE INDEX IF NOT EXISTS idx_edges_to ON symbol_edges(to_symbol);
    `);

    // Analysis Sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_sessions (
        id TEXT PRIMARY KEY,
        target_path TEXT NOT NULL,
        scan_mode TEXT NOT NULL,
        files_analyzed INTEGER NOT NULL,
        total_files INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_path ON analysis_sessions(target_path);
      CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON analysis_sessions(timestamp);
    `);

    // DLGM-Ready Extensions (Future)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dynamic_parameters (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        parameter_type TEXT NOT NULL,
        source TEXT NOT NULL,
        influence REAL NOT NULL DEFAULT 1.0,
        lifespan INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS parameter_cascade_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parameter_key TEXT NOT NULL,
        affected_component TEXT NOT NULL,
        cascade_type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT,
        FOREIGN KEY (parameter_key) REFERENCES dynamic_parameters(key)
      );

      CREATE INDEX IF NOT EXISTS idx_params_expires ON dynamic_parameters(expires_at);
      CREATE INDEX IF NOT EXISTS idx_cascade_timestamp ON parameter_cascade_log(timestamp);
    `);
  }

  private prepareStatements(): void {
    // Pattern Learning
    this.prepared.set('upsertPatternWeight', this.db.prepare(`
      INSERT OR REPLACE INTO pattern_weights (pattern, weight, updated_at, metadata)
      VALUES (?, ?, ?, ?)
    `));

    this.prepared.set('getPatternWeight', this.db.prepare(`
      SELECT * FROM pattern_weights WHERE pattern = ?
    `));

    this.prepared.set('getAllPatternWeights', this.db.prepare(`
      SELECT * FROM pattern_weights ORDER BY updated_at DESC
    `));

    this.prepared.set('insertPatternHistory', this.db.prepare(`
      INSERT INTO pattern_history (pattern, weight, timestamp, event_type, source)
      VALUES (?, ?, ?, ?, ?)
    `));

    this.prepared.set('getPatternHistory', this.db.prepare(`
      SELECT * FROM pattern_history WHERE pattern = ? ORDER BY timestamp DESC LIMIT ?
    `));

    // AI-Native Pattern Detection
    this.prepared.set('upsertDetectedPattern', this.db.prepare(`
      INSERT INTO detected_patterns (id, hash, type, vector_embedding, stability_score, complexity_score, frequency, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(hash) DO UPDATE SET
        frequency = frequency + 1,
        updated_at = excluded.updated_at
    `));

    this.prepared.set('upsertPatternInstance', this.db.prepare(`
      INSERT OR REPLACE INTO pattern_instances (id, pattern_id, symbol_id, role_in_pattern, confidence, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getAllDetectedPatterns', this.db.prepare(`
      SELECT * FROM detected_patterns
    `));

    this.prepared.set('getAllPatternInstances', this.db.prepare(`
      SELECT * FROM pattern_instances
    `));

    // File Analysis Cache
    this.prepared.set('upsertFileCache', this.db.prepare(`
      INSERT OR REPLACE INTO file_analysis_cache 
      (file_path, hash, last_modified, symbols, dependencies, analysis_timestamp, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getFileCache', this.db.prepare(`
      SELECT * FROM file_analysis_cache WHERE file_path = ?
    `));

    this.prepared.set('deleteFileCache', this.db.prepare(`
      DELETE FROM file_analysis_cache WHERE file_path = ?
    `));

    this.prepared.set('getFileCacheByHash', this.db.prepare(`
      SELECT * FROM file_analysis_cache WHERE hash = ?
    `));

    // Symbol Storage
    this.prepared.set('upsertSymbol', this.db.prepare(`
      INSERT OR REPLACE INTO symbols 
      (id, name, type, file_path, start_line, start_column, end_line, end_column, scope, metadata, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getSymbol', this.db.prepare(`
      SELECT * FROM symbols WHERE id = ?
    `));

    this.prepared.set('getSymbolsByFile', this.db.prepare(`
      SELECT * FROM symbols WHERE file_path = ?
    `));

    this.prepared.set('insertSymbolEdge', this.db.prepare(`
      INSERT OR REPLACE INTO symbol_edges (id, from_symbol, to_symbol, edge_type, weight, is_primary, confidence, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `));

    // Analysis Sessions
    this.prepared.set('insertAnalysisSession', this.db.prepare(`
      INSERT OR REPLACE INTO analysis_sessions (id, target_path, scan_mode, files_analyzed, total_files, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getLatestAnalysisSession', this.db.prepare(`
      SELECT * FROM analysis_sessions WHERE target_path = ? ORDER BY timestamp DESC LIMIT 1
    `));

    this.prepared.set('getAnalysisSessions', this.db.prepare(`
      SELECT * FROM analysis_sessions WHERE id = ? ORDER BY timestamp DESC LIMIT ?
    `));

    // Self-Reflection
    this.prepared.set('insertAdversarialTest', this.db.prepare(`
      INSERT INTO adversarial_tests (test_name, result, confidence, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?)
    `));

    this.prepared.set('insertConfidenceCalibration', this.db.prepare(`
      INSERT INTO confidence_calibration (prediction, actual, context, timestamp, calibration_score)
      VALUES (?, ?, ?, ?, ?)
    `));

    // Extended Self-Reflection Components
    this.prepared.set('insertPeerReview', this.db.prepare(`
      INSERT INTO peer_reviews (reviewer_id, target_analysis, review_data, confidence_score, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getPeerReviews', this.db.prepare(`
      SELECT * FROM peer_reviews ORDER BY timestamp DESC LIMIT ?
    `));

    this.prepared.set('insertConsensusResult', this.db.prepare(`
      INSERT OR REPLACE INTO consensus_results (analysis_id, consensus_data, confidence_level, participant_count, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getConsensusResult', this.db.prepare(`
      SELECT * FROM consensus_results WHERE analysis_id = ?
    `));

    this.prepared.set('insertAdaptiveTuning', this.db.prepare(`
      INSERT INTO adaptive_tuning (parameter_name, parameter_value, context, performance_metric, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getAdaptiveTuning', this.db.prepare(`
      SELECT * FROM adaptive_tuning WHERE parameter_name = ? ORDER BY timestamp DESC LIMIT ?
    `));

    this.prepared.set('insertAdaptiveHistory', this.db.prepare(`
      INSERT INTO adaptive_history (parameter_name, old_value, new_value, reason, performance_delta, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getAdaptiveHistory', this.db.prepare(`
      SELECT * FROM adaptive_history WHERE parameter_name = ? ORDER BY timestamp DESC LIMIT ?
    `));

    this.prepared.set('insertAdversarialHistory', this.db.prepare(`
      INSERT INTO adversarial_history (test_id, iteration, input_data, output_data, passed, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getAdversarialHistory', this.db.prepare(`
      SELECT * FROM adversarial_history WHERE test_id = ? ORDER BY timestamp DESC LIMIT ?
    `));

    this.prepared.set('insertMetaLearning', this.db.prepare(`
      INSERT INTO meta_learning (learning_task, learning_data, performance_metric, adaptation_strategy, success_rate, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `));

    this.prepared.set('getMetaLearning', this.db.prepare(`
      SELECT * FROM meta_learning WHERE learning_task = ? ORDER BY timestamp DESC LIMIT ?
    `));
  }

  // Pattern Learning API
  async upsertPatternWeight(pattern: string, weight: number, metadata?: any): Promise<void> {
    const stmt = this.prepared.get('upsertPatternWeight')!;
    const timestamp = Date.now();
    
    stmt.run(pattern, weight, timestamp, metadata ? JSON.stringify(metadata) : null);
    
    // Log to history
    const historyStmt = this.prepared.get('insertPatternHistory')!;
    historyStmt.run(pattern, weight, timestamp, 'updated', 'pattern_learning');
  }

  async getPatternWeight(pattern: string): Promise<PatternWeight | null> {
    const stmt = this.prepared.get('getPatternWeight')!;
    return stmt.get(pattern) as PatternWeight | null;
  }

  async getAllPatternWeights(): Promise<PatternWeight[]> {
    const stmt = this.prepared.get('getAllPatternWeights')!;
    return stmt.all() as PatternWeight[];
  }

  async getPatternHistory(pattern: string, limit: number = 100): Promise<PatternHistory[]> {
    const stmt = this.prepared.get('getPatternHistory')!;
    return stmt.all(pattern, limit) as PatternHistory[];
  }

  // AI-Native Pattern Detection API
  async upsertDetectedPattern(pattern: DetectedPattern): Promise<void> {
    const stmt = this.prepared.get('upsertDetectedPattern')!;
    stmt.run(
      pattern.id,
      pattern.hash,
      pattern.type,
      pattern.vector_embedding,
      pattern.stability_score,
      pattern.complexity_score,
      pattern.frequency,
      pattern.created_at,
      pattern.updated_at,
      pattern.metadata
    );
  }

  async upsertPatternInstance(instance: PatternInstance): Promise<void> {
    const stmt = this.prepared.get('upsertPatternInstance')!;
    stmt.run(
      instance.id,
      instance.pattern_id,
      instance.symbol_id,
      instance.role_in_pattern,
      instance.confidence,
      instance.created_at,
      instance.metadata
    );
  }

  async getAllDetectedPatterns(): Promise<DetectedPattern[]> {
    const stmt = this.prepared.get('getAllDetectedPatterns')!;
    return stmt.all() as DetectedPattern[];
  }

  async getAllPatternInstances(): Promise<PatternInstance[]> {
    const stmt = this.prepared.get('getAllPatternInstances')!;
    return stmt.all() as PatternInstance[];
  }

  // File Analysis Cache API
  async upsertFileAnalysis(entry: Omit<FileAnalysisEntry, 'analysis_timestamp'>): Promise<void> {
    const stmt = this.prepared.get('upsertFileCache')!;
    stmt.run(
      entry.file_path,
      entry.hash,
      entry.last_modified,
      entry.symbols,
      entry.dependencies,
      Date.now(),
      entry.version
    );
  }

  async getFileAnalysis(filePath: string): Promise<FileAnalysisEntry | null> {
    const stmt = this.prepared.get('getFileCache')!;
    return stmt.get(filePath) as FileAnalysisEntry | null;
  }

  async deleteFileAnalysis(filePath: string): Promise<void> {
    const stmt = this.prepared.get('deleteFileCache')!;
    stmt.run(filePath);
  }

  // Symbol Storage API
  async storeSymbol(symbol: SymbolNode): Promise<void> {
    const stmt = this.prepared.get('upsertSymbol')!;
    const now = Date.now();
    
    stmt.run(
      symbol.id,
      symbol.name,
      symbol.type,
      symbol.location.file,
      symbol.location.startLine,
      symbol.location.startColumn,
      symbol.location.endLine,
      symbol.location.endColumn,
      symbol.scope,
      JSON.stringify(symbol.metadata),
      symbol.embedding ? JSON.stringify(symbol.embedding) : null,
      now,
      now
    );
  }

  async getSymbol(id: string): Promise<SymbolNode | null> {
    const stmt = this.prepared.get('getSymbol')!;
    const row = stmt.get(id) as StoredSymbol | null;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      type: row.type as any,
      location: {
        file: row.file_path,
        startLine: row.start_line,
        startColumn: row.start_column,
        endLine: row.end_line,
        endColumn: row.end_column
      },
      scope: row.scope,
      dependencies: [], // Would need to join with edges
      dependents: [],   // Would need to join with edges
      metadata: JSON.parse(row.metadata),
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined
    };
  }

  storeSymbolEdge(edge: SymbolEdge): void {
    // Ensure all values are SQLite-compatible
    const safe = (v: any) => {
      if (v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint' || Buffer.isBuffer(v)) return v;
      return JSON.stringify(v);
    };
    this.db.prepare(
      `INSERT OR REPLACE INTO symbol_edges (id, from_symbol, to_symbol, edge_type, weight, is_primary, confidence, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      safe(edge.id),
      safe(edge.from), 
      safe(edge.to), 
      safe(edge.type), 
      safe(edge.weight || 1.0),
      safe(edge.is_primary || false),
      safe(edge.confidence || 1.0),
      safe(edge.metadata),
      Date.now()
    );
  }

  // Analysis Session API
  async storeAnalysisSession(session: Omit<AnalysisSession, 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertAnalysisSession')!;
    stmt.run(
      session.id,
      session.target_path,
      session.scan_mode,
      session.files_analyzed,
      session.total_files,
      Date.now(),
      session.metadata
    );
  }

  async getAnalysisSessions(sessionId: string, limit: number = 10): Promise<AnalysisSession[]> {
    const stmt = this.prepared.get('getAnalysisSessions')!;
    return stmt.all(sessionId, limit) as AnalysisSession[];
  }

  // Self-Reflection API
  async storeAdversarialTest(test: Omit<AdversarialTest, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertAdversarialTest')!;
    stmt.run(test.test_name, test.result, test.confidence, Date.now(), test.metadata || null);
  }

  async storeConfidenceCalibration(calibration: Omit<ConfidenceCalibration, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertConfidenceCalibration')!;
    stmt.run(
      calibration.prediction,
      calibration.actual,
      calibration.context,
      Date.now(),
      calibration.calibration_score
    );
  }

  // Extended Self-Reflection Component Methods
  async storePeerReview(review: Omit<PeerReview, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertPeerReview')!;
    stmt.run(
      review.reviewer_id,
      review.target_analysis,
      review.review_data,
      review.confidence_score || null,
      Date.now(),
      review.metadata || null
    );
  }

  async getPeerReviews(limit: number = 100): Promise<PeerReview[]> {
    const stmt = this.prepared.get('getPeerReviews')!;
    return stmt.all(limit) as PeerReview[];
  }

  async storeConsensusResult(consensus: Omit<ConsensusResult, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertConsensusResult')!;
    stmt.run(
      consensus.analysis_id,
      consensus.consensus_data,
      consensus.confidence_level || null,
      consensus.participant_count || null,
      Date.now(),
      consensus.metadata || null
    );
  }

  async getConsensusResult(analysisId: string): Promise<ConsensusResult | null> {
    const stmt = this.prepared.get('getConsensusResult')!;
    return stmt.get(analysisId) as ConsensusResult | null;
  }

  async storeAdaptiveTuning(tuning: Omit<AdaptiveTuning, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertAdaptiveTuning')!;
    stmt.run(
      tuning.parameter_name,
      tuning.parameter_value,
      tuning.context || null,
      tuning.performance_metric || null,
      Date.now(),
      tuning.metadata || null
    );
  }

  async getAdaptiveTuning(parameterName: string, limit: number = 100): Promise<AdaptiveTuning[]> {
    const stmt = this.prepared.get('getAdaptiveTuning')!;
    return stmt.all(parameterName, limit) as AdaptiveTuning[];
  }

  async storeAdaptiveHistory(history: Omit<AdaptiveHistory, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertAdaptiveHistory')!;
    stmt.run(
      history.parameter_name,
      history.old_value || null,
      history.new_value || null,
      history.reason || null,
      history.performance_delta || null,
      Date.now()
    );
  }

  async getAdaptiveHistory(parameterName: string, limit: number = 100): Promise<AdaptiveHistory[]> {
    const stmt = this.prepared.get('getAdaptiveHistory')!;
    return stmt.all(parameterName, limit) as AdaptiveHistory[];
  }

  async storeAdversarialHistory(history: Omit<AdversarialHistory, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertAdversarialHistory')!;
    stmt.run(
      history.test_id,
      history.iteration,
      history.input_data,
      history.output_data,
      history.passed,
      Date.now()
    );
  }

  async getAdversarialHistory(testId: number, limit: number = 100): Promise<AdversarialHistory[]> {
    const stmt = this.prepared.get('getAdversarialHistory')!;
    return stmt.all(testId, limit) as AdversarialHistory[];
  }

  async storeMetaLearning(learning: Omit<MetaLearning, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.prepared.get('insertMetaLearning')!;
    stmt.run(
      learning.learning_task,
      learning.learning_data,
      learning.performance_metric || null,
      learning.adaptation_strategy || null,
      learning.success_rate || null,
      Date.now(),
      learning.metadata || null
    );
  }

  async getMetaLearning(learningTask: string, limit: number = 100): Promise<MetaLearning[]> {
    const stmt = this.prepared.get('getMetaLearning')!;
    return stmt.all(learningTask, limit) as MetaLearning[];
  }

  // Utility Methods
  async vacuum(): Promise<void> {
    this.db.exec('VACUUM');
  }

  async getStats(): Promise<any> {
    const tables = [
      'pattern_weights',
      'pattern_history', 
      'file_analysis_cache',
      'symbols',
      'symbol_edges',
      'analysis_sessions'
    ];

    const stats: any = {};
    for (const table of tables) {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
      stats[table] = result.count;
    }

    return stats;
  }

  close(): void {
    this.db.close();
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  // Execute raw SQL (for migrations and schema operations)
  exec(sql: string): void {
    this.db.exec(sql);
  }

  // Prepare a statement (for migrations and direct queries)
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    const tables = [
      'file_analysis_cache',
      'symbols',
      'symbol_edges',
      'analysis_sessions',
      'detected_patterns',
      'pattern_instances'
    ];
    
    for (const table of tables) {
      try {
        const stmt = this.db.prepare(`DELETE FROM ${table}`);
        stmt.run();
      } catch (error) {
        // Ignore errors for non-existent tables
      }
    }
  }

  // DLGM-Ready: Future dynamic parameter support
  async setDynamicParameter(key: string, value: any, type: string, lifespan: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dynamic_parameters 
      (key, value, parameter_type, source, lifespan, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Date.now();
    stmt.run(key, JSON.stringify(value), type, 'system', lifespan, now + lifespan, now);
  }

  async getDynamicParameter(key: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM dynamic_parameters 
      WHERE key = ? AND expires_at > ?
    `);
    
    const row = stmt.get(key, Date.now()) as any;
    return row ? JSON.parse(row.value) : null;
  }

  async cleanupExpiredParameters(): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM dynamic_parameters WHERE expires_at <= ?
    `);
    
    const result = stmt.run(Date.now());
    return result.changes;
  }

  /**
   * Get all file paths that have been analyzed
   */
  async getAllAnalyzedFiles(): Promise<string[]> {
    const stmt = this.db.prepare('SELECT file_path FROM file_analysis_cache');
    const results = stmt.all() as { file_path: string }[];
    return results.map(row => row.file_path);
  }
} 