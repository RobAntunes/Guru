# Harmonic Intelligence Usage Guide

## Overview

Harmonic Intelligence provides AI models with intuitive codebase understanding by detecting 23 mathematical patterns across 7 categories. The system delivers raw pattern data without aggregation, allowing AI models to interpret patterns in context.

## MCP Tools for AI Models

### 1. `harmonic_analyze`
Analyze code for mathematical patterns with targeted precision.

```json
{
  "tool": "harmonic_analyze",
  "arguments": {
    "path": "./src/core",
    "patterns": ["network_topology", "golden_ratio_patterns"],
    "includeEvidence": true
  }
}
```

**Returns**: Raw pattern data for each symbol, including scores, confidence, and evidence.

### 2. `harmonic_summarize`
Get architectural insights quickly without massive context.

```json
{
  "tool": "harmonic_summarize", 
  "arguments": {
    "path": "./src"
  }
}
```

**Returns**: Pattern distribution, top patterns, and architectural insights.

### 3. `harmonic_find_pattern`
Find code exhibiting specific mathematical properties.

```json
{
  "tool": "harmonic_find_pattern",
  "arguments": {
    "path": "./src",
    "patterns": ["l_system_growth", "fractal_self_similarity"]
  }
}
```

**Returns**: List of symbols matching the requested patterns.

### 4. `harmonic_symbol_context`
Get pattern context for a specific symbol with minimal overhead.

```json
{
  "tool": "harmonic_symbol_context",
  "arguments": {
    "path": "./src",
    "symbolName": "SymbolGraphBuilder"
  }
}
```

**Returns**: Pattern data and architectural role for the symbol.

## CLI Usage

```bash
# Analyze a directory
npx tsx src/harmonic-intelligence/core/harmonic-cli.ts analyze ./src/core

# Get summary
npx tsx src/harmonic-intelligence/core/harmonic-cli.ts summarize ./src

# Find specific patterns
npx tsx src/harmonic-intelligence/core/harmonic-cli.ts find-pattern ./src network_topology,golden_ratio_patterns

# Get symbol context
npx tsx src/harmonic-intelligence/core/harmonic-cli.ts symbol-context ./src GuruCore
```

## Pattern Categories

### 🎵 Classical Harmony
- `golden_ratio_patterns` - Code with 1.618 proportions
- `fibonacci_sequences` - Sequential Fibonacci relationships
- `Prime Number Harmonics` - Prime number distributions
- `Euler Constant Patterns` - Logarithmic/exponential growth

### 📐 Geometric Harmony
- `sacred_geometry_patterns` - Natural geometric relationships
- `symmetry_groups` - Rotational/reflective symmetries
- `platonic_solid_structures` - Regular polytope organization

### 🌀 Fractal Patterns
- `mandelbrot_complexity` - Self-similar boundaries
- `julia_set_patterns` - Chaotic dynamic systems
- `l_system_growth` - Recursive biological growth
- `hausdorff_dimension` - Fractional dimensions

### 🔷 Tiling & Crystallographic
- `tessellation_patterns` - Regular tiling patterns
- `crystal_lattice_structures` - Periodic arrangements
- `penrose_tilings` - Aperiodic five-fold symmetry

### 🕸️ Topological Patterns
- `network_topology` - Graph structures (hubs, clusters)
- `knot_invariants` - Topological entanglement
- `small_world_networks` - High clustering, short paths

### 🌊 Wave & Harmonic
- `fourier_analysis` - Frequency domain patterns
- `standing_waves` - Resonant nodes/antinodes
- `resonance_patterns` - Harmonic relationships

### 📊 Information Theory
- `shannon_entropy` - Information content measures
- `kolmogorov_complexity` - Compressibility metrics
- `effective_complexity` - Structure vs randomness

## AI Interpretation Guide

### Understanding Raw Pattern Data

Each pattern detection includes:
- **score**: Raw pattern strength (0-1)
- **confidence**: Detection confidence (0-1)
- **evidence**: Array of specific observations
- **detected**: Boolean indicating presence

### Architectural Insights

Use pattern combinations to infer architecture:
- High `network_topology` → Complex dependencies
- `golden_ratio_patterns` → Well-balanced design
- `l_system_growth` → Recursive structures
- `small_world_networks` → Modular architecture
- High `shannon_entropy` → Information-rich components

### Code Quality Indicators

- Multiple `symmetry_groups` → Consistent design
- `tessellation_patterns` → Regular structure
- Low `kolmogorov_complexity` → Simple, maintainable
- `resonance_patterns` → Harmonic integration

## Example AI Workflow

1. **Quick Overview**
   ```
   harmonic_summarize("./src") → Get architectural summary
   ```

2. **Deep Dive**
   ```
   harmonic_analyze("./src/core", patterns=["network_topology"]) → Find complex areas
   ```

3. **Find Similar Code**
   ```
   harmonic_find_pattern("./src", ["golden_ratio_patterns"]) → Find well-designed components
   ```

4. **Understand Symbol**
   ```
   harmonic_symbol_context("./src", "ComplexClass") → Get pattern context
   ```

## Benefits for AI Models

1. **Minimal Context** - Analyze large codebases without loading all code
2. **Mathematical Understanding** - Patterns reveal deep structural properties
3. **Raw Data** - No aggregation, AI interprets patterns directly
4. **Targeted Analysis** - Focus on specific files, symbols, or patterns
5. **Architectural Insights** - Understand design without reading implementation

## Integration Example

```typescript
// In your AI agent
async function understandCodebase(path: string) {
  // 1. Get overview
  const summary = await mcp.call('harmonic_summarize', { path });
  
  // 2. Find problem areas
  const complexCode = await mcp.call('harmonic_find_pattern', {
    path,
    patterns: ['network_topology', 'kolmogorov_complexity']
  });
  
  // 3. Analyze specific components
  for (const symbol of complexCode.matches) {
    const context = await mcp.call('harmonic_symbol_context', {
      path,
      symbolName: symbol.name
    });
    // AI interprets patterns...
  }
}
```

This approach provides intuitive codebase understanding without requiring massive context windows!