# Harmonic Intelligence System

A mathematical pattern recognition system that analyzes code structure using 23 distinct harmonic patterns across 7 categories. This system enriches symbol graphs with harmonic scores and pattern participation data.

## Overview

The Harmonic Intelligence system identifies mathematical patterns in code structure, providing insights into:
- Architectural quality
- Code complexity
- Design patterns
- Refactoring opportunities
- Structural harmony

## Pattern Categories

### 1. Classical Harmony (3 patterns)
- **Golden Ratio**: Detects φ proportions in code structure
- **Fibonacci Sequences**: Identifies growth patterns
- **Rule of Thirds**: Finds balanced compositions

### 2. Geometric Patterns (3 patterns)
- **Sacred Geometry**: Detects geometric relationships
- **Platonic Solids**: Identifies perfect structural forms
- **Voronoi Tessellation**: Analyzes spatial partitioning

### 3. Fractal Patterns (4 patterns)
- **Mandelbrot Complexity**: Measures self-similarity
- **Julia Set Patterns**: Detects parameter sensitivity
- **L-System Growth**: Identifies recursive patterns
- **Hausdorff Dimension**: Calculates fractal dimensions

### 4. Tiling & Crystallographic (3 patterns)
- **Penrose Tiling**: Detects aperiodic patterns
- **Islamic Geometric Patterns**: Finds symmetric designs
- **Crystallographic Groups**: Identifies symmetry groups

### 5. Topological Patterns (3 patterns)
- **Network Topology**: Analyzes graph structure
- **Knot Theory**: Detects entanglement
- **Small-World Networks**: Identifies efficient connectivity

### 6. Wave & Harmonic (3 patterns)
- **Fourier Analysis**: Detects frequency patterns
- **Standing Waves**: Identifies resonance
- **Resonance Patterns**: Finds harmonic relationships

### 7. Information Theory (3 patterns)
- **Shannon Entropy**: Measures information content
- **Kolmogorov Complexity**: Estimates algorithmic complexity
- **Effective Complexity**: Balances regularity and randomness

## Architecture

```
harmonic-intelligence/
├── analyzers/              # Pattern analyzers (one per category)
├── core/                   # Core engine and enricher
├── database/              # Database schema and models
├── interfaces/            # TypeScript interfaces
├── examples/              # Usage examples
└── tests/                 # Comprehensive test suite
```

## Usage

### Basic Enrichment

```typescript
import { HarmonicEnricher } from './core/harmonic-enricher';
import { SymbolGraph } from '../parsers/symbol-graph';

// Create enricher
const enricher = new HarmonicEnricher();

// Enrich symbol graph
const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph);

// Access enriched data
const symbol = enrichedGraph.getEnrichedSymbol('symbolId');
console.log(`Harmonic Score: ${symbol.overallHarmonicScore}`);
```

### Query Patterns

```typescript
// Find architectural hubs
const hubs = enrichedGraph.query()
  .wherePattern(PatternType.NETWORK_TOPOLOGY, { role: 'hub' })
  .whereSymbol(s => s.type === 'class')
  .get();

// Find complex functions
const complex = enrichedGraph.query()
  .wherePattern(PatternType.KOLMOGOROV_COMPLEXITY)
  .whereHarmonic(d => d.overallHarmonicScore > 0.8)
  .get();
```

### Selective Analysis

```typescript
// Analyze only specific categories
const enrichedGraph = await enricher.enrichSymbolGraph(symbolGraph, {
  categories: [
    PatternCategory.CLASSICAL_HARMONY,
    PatternCategory.TOPOLOGICAL_PATTERNS
  ],
  parallel: true
});
```

## Key Features

### Zero-Copy Architecture
The enricher uses adapter patterns to avoid duplicating symbol graph data, ensuring memory efficiency.

### Parallel Analysis
Pattern analyzers can run in parallel for improved performance on large codebases.

### Query Builder
Fluent API for complex queries combining symbol properties and harmonic patterns.

### Pattern Statistics
Aggregate statistics showing pattern distribution across the codebase.

## Integration with Guru

The Harmonic Intelligence system seamlessly integrates with Guru's symbol graph:

1. **Symbol Graph Input**: Takes existing symbol graph as input
2. **Non-Invasive**: Doesn't modify original symbol data
3. **Enrichment**: Adds harmonic scores and pattern participation
4. **Query API**: Powerful querying for analysis

## Examples

See the `examples/` directory for:
- `enrichment-usage.ts`: Basic usage patterns
- `guru-integration.ts`: Full integration example
- Pattern-specific analysis examples
- Visualization export

## Testing

```bash
# Run all harmonic intelligence tests
npm test -- tests/harmonic-intelligence/

# Run specific analyzer tests
npm test -- tests/harmonic-intelligence/unit/classical-harmony-analyzer.test.ts
```

## Performance Considerations

- **Memory**: Uses adapter pattern to avoid data duplication
- **CPU**: Parallel analysis available for multi-core systems
- **Caching**: Results can be cached (when database integration added)
- **Selective**: Analyze only needed pattern categories

## Future Enhancements

1. **Real-time Analysis**: Incremental updates on file changes
2. **Machine Learning**: Pattern prediction and anomaly detection
3. **Visualization**: D3.js integration for pattern visualization
4. **IDE Integration**: VSCode extension for live harmonic scores
5. **CI/CD Integration**: Harmonic quality gates in pipelines