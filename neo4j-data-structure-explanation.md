# Neo4j Data Structure in Guru

## Overview

The Guru project uses Neo4j as a graph database to store relationships between code symbols and detected patterns. However, the current implementation has a **critical gap**: symbols are extracted but not synced to Neo4j.

## Current Database Schema

### Node Types

#### 1. **Symbol Nodes** (Currently Empty)
```cypher
(:Symbol {
  id: string,           // Unique identifier
  name: string,         // Symbol name (e.g., "calculateTotal")
  type: string,         // 'function' | 'class' | 'variable' | 'module' | 'import'
  file: string,         // File path
  startLine: number,    // Start line in file
  endLine: number,      // End line in file
  complexity: number,   // Cyclomatic complexity (optional)
  properties: object,   // Additional metadata
  updatedAt: datetime   // Last update timestamp
})
```

#### 2. **Pattern Nodes** (10 nodes present)
```cypher
(:Pattern {
  id: string,               // UUID
  category: string,         // 'ARCHITECTURAL' | 'GENERAL' | 'QUANTUM' | etc.
  strength: number,         // Pattern strength (0.0 - 1.0)
  occurrences: number,      // How many times found
  confidence: number,       // Detection confidence
  complexity: number,       // Pattern complexity
  dpcmCoordinates: array,   // [x, y, z] coordinates in DPCM space
  evidence: string,         // JSON string of evidence
  updatedAt: datetime       // Last update timestamp
})
```

### Relationship Types

#### 1. **Symbol-to-Symbol Relationships** (Currently None)
- `(:Symbol)-[:CALLS]->(:Symbol)` - Function calls
- `(:Symbol)-[:IMPORTS]->(:Symbol)` - Import relationships
- `(:Symbol)-[:EXTENDS]->(:Symbol)` - Class inheritance
- `(:Symbol)-[:IMPLEMENTS]->(:Symbol)` - Interface implementation
- `(:Symbol)-[:CONTAINS]->(:Symbol)` - Containment (e.g., method in class)
- `(:Symbol)-[:REFERENCES]->(:Symbol)` - General references
- `(:Symbol)-[:PATTERN_SIMILARITY]->(:Symbol)` - Similar patterns

#### 2. **Pattern-to-Symbol Relationships** (Currently None)
- `(:Pattern)-[:FOUND_IN]->(:Symbol)` - Pattern detected in symbol

#### 3. **Pattern-to-Pattern Relationships** (Currently None)
- `(:Pattern)-[:SIMILAR_TO]->(:Pattern)` - Pattern similarity

### Indexes and Constraints

**Constraints:**
- `symbol_id_unique`: UNIQUE constraint on Symbol.id
- `pattern_id_unique`: UNIQUE constraint on Pattern.id

**Indexes:**
- `symbol_name_idx`: Index on Symbol.name
- `symbol_file_idx`: Index on Symbol.file
- `pattern_category_idx`: Index on Pattern.category
- `pattern_strength_idx`: Index on Pattern.strength

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  TypeScript/JS  │     │     SQLite      │     │     Neo4j       │
│     Files       │ --> │   Database      │ -X->│  Graph Store    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         |                       |                        |
         v                       v                        v
    AST Parsing          Symbol Storage           Relationships
    & Analysis           (file_analysis)          (Currently Empty)
                              table
```

## Current Issues

1. **Missing Symbol Sync**: Symbols are extracted and stored in SQLite but never synced to Neo4j
2. **Broken Relationships**: Without Symbol nodes, Pattern-Symbol relationships cannot be created
3. **Incomplete Graph**: The graph database only contains Pattern nodes in isolation

## Intended Architecture

When fully implemented, the Neo4j graph should provide:

1. **Code Navigation**: Follow call graphs, import chains, and dependencies
2. **Pattern Discovery**: Find symbols with similar patterns
3. **Impact Analysis**: Understand which code changes affect which patterns
4. **Architectural Insights**: Visualize code structure and pattern distributions

## Example Queries (When Fixed)

```cypher
// Find all functions called by a specific function
MATCH (caller:Symbol {name: "processData"})-[:CALLS]->(callee:Symbol)
RETURN callee

// Find patterns in a specific file
MATCH (p:Pattern)-[:FOUND_IN]->(s:Symbol {file: "/src/main.ts"})
RETURN p, s

// Find architectural patterns with high strength
MATCH (p:Pattern {category: "ARCHITECTURAL"})
WHERE p.strength > 0.8
RETURN p

// Find similar patterns
MATCH (p1:Pattern)-[r:SIMILAR_TO]-(p2:Pattern)
WHERE r.similarity > 0.9
RETURN p1, p2, r.similarity
```

## Pattern Categories

- **ARCHITECTURAL**: Design patterns, module structures
- **GENERAL**: Common coding patterns
- **QUANTUM**: Quantum-inspired patterns (superposition, entanglement)
- **GEOMETRIC**: Structural symmetries and shapes
- **HARMONIC**: Frequency-based patterns
- **TOPOLOGICAL**: Connection and flow patterns

## DPCM Coordinates

Each pattern has 3D coordinates in DPCM (Dimensional Pattern Coordinate Mapping) space:
- X-axis: Structural similarity
- Y-axis: Behavioral similarity  
- Z-axis: Contextual similarity

This enables spatial queries to find nearby patterns in the pattern space.