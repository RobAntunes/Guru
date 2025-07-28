-- Harmonic Intelligence Database Schema
-- This schema extends the existing Guru database with harmonic analysis tables

-- Main harmonic scores table
CREATE TABLE IF NOT EXISTS harmonic_scores (
    symbol_id TEXT PRIMARY KEY,
    overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 1),
    pattern_scores JSON NOT NULL, -- Array of [PatternType, PatternScore] tuples
    confidence_intervals JSON NOT NULL, -- Map of string to ConfidenceInterval
    geometric_coordinates JSON NOT NULL, -- Vector3D
    orientation JSON, -- Quaternion
    stability_metrics JSON, -- StabilityMetrics
    last_updated INTEGER NOT NULL,
    analysis_version TEXT NOT NULL DEFAULT '1.0.0',
    FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

-- Pattern evolution tracking for learning
CREATE TABLE IF NOT EXISTS pattern_evolution (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    pattern_changes JSON NOT NULL, -- Map of pattern changes
    harmonic_delta REAL NOT NULL, -- Change in overall score
    previous_score REAL NOT NULL,
    current_score REAL NOT NULL,
    change_reason TEXT, -- Optional: why the change occurred
    FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

-- Aesthetic profiles for learning preferences
CREATE TABLE IF NOT EXISTS aesthetic_profiles (
    profile_id TEXT PRIMARY KEY,
    preferred_patterns JSON NOT NULL, -- Array of PatternType
    pattern_weights JSON NOT NULL, -- Map of PatternType to weight
    historical_scores JSON NOT NULL, -- Array of scores
    learning_rate REAL NOT NULL DEFAULT 0.1,
    last_updated INTEGER NOT NULL,
    context_type TEXT -- e.g., 'refactoring', 'new_code', 'bug_fix'
);

-- Harmonic relationships between symbols
CREATE TABLE IF NOT EXISTS harmonic_edges (
    from_symbol TEXT NOT NULL,
    to_symbol TEXT NOT NULL,
    harmonic_compatibility REAL NOT NULL CHECK(harmonic_compatibility >= 0 AND harmonic_compatibility <= 1),
    resonance_frequency REAL,
    pattern_alignment JSON, -- Array of aligned PatternTypes
    strength REAL NOT NULL DEFAULT 1.0,
    last_analyzed INTEGER NOT NULL,
    PRIMARY KEY (from_symbol, to_symbol),
    FOREIGN KEY (from_symbol) REFERENCES symbols(id) ON DELETE CASCADE,
    FOREIGN KEY (to_symbol) REFERENCES symbols(id) ON DELETE CASCADE
);

-- Cache for pattern analysis results
CREATE TABLE IF NOT EXISTS pattern_cache (
    cache_key TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL,
    analysis_result JSON NOT NULL,
    semantic_hash TEXT NOT NULL, -- Hash of input data
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    hit_count INTEGER DEFAULT 0
);

-- Harmonic quality gates configuration
CREATE TABLE IF NOT EXISTS quality_gates (
    gate_id TEXT PRIMARY KEY,
    gate_name TEXT NOT NULL,
    minimum_score REAL NOT NULL,
    pattern_requirements JSON, -- Map of PatternType to minimum score
    severity TEXT NOT NULL CHECK(severity IN ('error', 'warning', 'info')),
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Training data curation based on harmony
CREATE TABLE IF NOT EXISTS curated_training_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol_id TEXT NOT NULL,
    harmonic_score REAL NOT NULL,
    pattern_diversity REAL NOT NULL, -- How many different patterns detected
    curation_reason TEXT NOT NULL,
    curated_at INTEGER NOT NULL,
    used_for_training BOOLEAN DEFAULT 0,
    training_results JSON, -- Results when used for training
    FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_harmonic_scores_overall ON harmonic_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_harmonic_scores_updated ON harmonic_scores(last_updated);
CREATE INDEX IF NOT EXISTS idx_pattern_evolution_symbol ON pattern_evolution(symbol_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_pattern_evolution_delta ON pattern_evolution(harmonic_delta);
CREATE INDEX IF NOT EXISTS idx_harmonic_edges_compatibility ON harmonic_edges(harmonic_compatibility);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_expires ON pattern_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_curated_training_score ON curated_training_data(harmonic_score);

-- Views for common queries
CREATE VIEW IF NOT EXISTS high_harmony_symbols AS
SELECT 
    s.id,
    s.name,
    s.kind,
    hs.overall_score,
    hs.geometric_coordinates,
    hs.last_updated
FROM symbols s
JOIN harmonic_scores hs ON s.id = hs.symbol_id
WHERE hs.overall_score > 0.8
ORDER BY hs.overall_score DESC;

CREATE VIEW IF NOT EXISTS harmony_trends AS
SELECT 
    pe.symbol_id,
    s.name,
    COUNT(*) as change_count,
    AVG(pe.harmonic_delta) as avg_delta,
    MAX(pe.current_score) as peak_score,
    MIN(pe.current_score) as lowest_score,
    CASE 
        WHEN AVG(pe.harmonic_delta) > 0.01 THEN 'improving'
        WHEN AVG(pe.harmonic_delta) < -0.01 THEN 'degrading'
        ELSE 'stable'
    END as trend
FROM pattern_evolution pe
JOIN symbols s ON pe.symbol_id = s.id
GROUP BY pe.symbol_id, s.name;

-- Triggers for automatic tracking
CREATE TRIGGER IF NOT EXISTS track_harmonic_changes
AFTER UPDATE ON harmonic_scores
WHEN NEW.overall_score != OLD.overall_score
BEGIN
    INSERT INTO pattern_evolution (
        symbol_id,
        timestamp,
        pattern_changes,
        harmonic_delta,
        previous_score,
        current_score
    ) VALUES (
        NEW.symbol_id,
        NEW.last_updated,
        json_object(
            'old_patterns', OLD.pattern_scores,
            'new_patterns', NEW.pattern_scores
        ),
        NEW.overall_score - OLD.overall_score,
        OLD.overall_score,
        NEW.overall_score
    );
END;