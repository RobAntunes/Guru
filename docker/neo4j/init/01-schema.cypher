// Neo4j Schema Initialization for Guru Harmonic Intelligence
// This script sets up the complete graph schema for symbols and patterns

// ============================================================================
// CONSTRAINTS (Primary Keys & Uniqueness)
// ============================================================================

// Symbol constraints
CREATE CONSTRAINT symbol_id IF NOT EXISTS FOR (s:Symbol) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT file_path IF NOT EXISTS FOR (f:File) REQUIRE f.path IS UNIQUE;
CREATE CONSTRAINT cluster_id IF NOT EXISTS FOR (c:Cluster) REQUIRE c.id IS UNIQUE;

// Pattern constraints  
CREATE CONSTRAINT pattern_id IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE;

// ============================================================================
// INDEXES (Performance Optimization)
// ============================================================================

// Symbol indexes
CREATE INDEX symbol_type IF NOT EXISTS FOR (s:Symbol) ON (s.type);
CREATE INDEX symbol_file_line IF NOT EXISTS FOR (s:Symbol) ON (s.file, s.startLine);
CREATE INDEX symbol_name IF NOT EXISTS FOR (s:Symbol) ON (s.name);
CREATE INDEX symbol_confidence IF NOT EXISTS FOR (s:Symbol) ON (s.confidence);

// Pattern indexes
CREATE INDEX pattern_category IF NOT EXISTS FOR (p:Pattern) ON (p.category);
CREATE INDEX pattern_strength IF NOT EXISTS FOR (p:Pattern) ON (p.strength);
CREATE INDEX pattern_type IF NOT EXISTS FOR (p:Pattern) ON (p.type);
CREATE INDEX pattern_complexity IF NOT EXISTS FOR (p:Pattern) ON (p.complexity);
CREATE INDEX pattern_coordinates IF NOT EXISTS FOR (p:Pattern) ON (p.coordinates);

// File indexes
CREATE INDEX file_extension IF NOT EXISTS FOR (f:File) ON (f.extension);
CREATE INDEX file_modified IF NOT EXISTS FOR (f:File) ON (f.lastModified);

// Relationship indexes
CREATE INDEX exhibits_strength IF NOT EXISTS FOR ()-[e:EXHIBITS]-() ON (e.strength);
CREATE INDEX calls_frequency IF NOT EXISTS FOR ()-[c:CALLS]-() ON (c.frequency);
CREATE INDEX similar_to_similarity IF NOT EXISTS FOR ()-[s:SIMILAR_TO]-() ON (s.similarity);

// ============================================================================
// SAMPLE DATA (For Testing)
// ============================================================================

// Create sample file
MERGE (f:File {
  path: "src/example.ts",
  name: "example.ts", 
  extension: "ts",
  size: 1024,
  lastModified: datetime()
});

// Create sample cluster
MERGE (c:Cluster {
  id: "core_cluster",
  name: "Core Module",
  purpose: "Central business logic",
  semanticZone: "core",
  cohesion: 0.8,
  coupling: 0.3
});

CALL db.info();