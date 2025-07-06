# QPFM MCP Tools Usage Guide

## Overview

The QPFM system is exposed to AI models through 5 MCP tools that provide different levels of interaction with the quantum memory system.

## Available Tools

### 1. `qpfm_query` - Primary Query Interface

**Purpose**: Search quantum memory using patterns and logic operations

**Example Usage**:
```json
// Simple string query
{
  "tool": "qpfm_query",
  "arguments": {
    "query": "fractal recursive"
  }
}

// Structured query with logic operations
{
  "tool": "qpfm_query",
  "arguments": {
    "query": {
      "type": "precision",
      "confidence": 0.9,
      "exploration": 0.1,
      "harmonicSignature": {
        "category": "FRACTAL",
        "strength": 0.8
      }
    },
    "operations": [
      {
        "type": "THRESHOLD",
        "params": ["complexity"],
        "threshold": 0.7
      },
      {
        "type": "BOOST",
        "params": ["recursive"],
        "weight": 1.5
      }
    ]
  }
}
```

### 2. `qpfm_store` - Store New Patterns

**Purpose**: Add new harmonic patterns to quantum memory

**Example Usage**:
```json
{
  "tool": "qpfm_store",
  "arguments": {
    "id": "pattern-123",
    "title": "Observer Pattern Implementation",
    "description": "Classic observer pattern with event emitters",
    "type": "pattern",
    "tags": ["design-pattern", "observer", "events"],
    "category": "STRUCTURAL",
    "strength": 0.85,
    "complexity": 0.6,
    "confidence": 0.95,
    "occurrences": 15
  }
}
```

### 3. `qpfm_distribution` - Analyze Memory Space

**Purpose**: Understand the distribution of patterns in quantum memory

**Example Usage**:
```json
{
  "tool": "qpfm_distribution",
  "arguments": {}
}
```

**Returns**:
```json
{
  "categories": {
    "FRACTAL": 45,
    "WAVE_HARMONIC": 23,
    "STRUCTURAL": 67
  },
  "totalPatterns": 135,
  "coordinateSpace": {
    "min": [-0.8, -0.7, -0.9],
    "max": [0.9, 0.8, 0.7]
  },
  "performance": {
    "avgResponseTime": 12.5,
    "hitRate": 0.78,
    "emergenceFrequency": 0.15
  }
}
```

### 4. `qpfm_emergent` - Trigger Emergent Behaviors

**Purpose**: Explicitly trigger quantum emergence modes

**Example Usage**:
```json
{
  "tool": "qpfm_emergent",
  "arguments": {
    "mode": "synthesis"
  }
}
```

**Available Modes**:
- `dream`: Explore distant memory connections
- `flashback`: Activate related memory chains
- `dejavu`: Find familiar patterns in new contexts
- `synthesis`: Create new insights from pattern combinations

### 5. `qpfm_compose` - Advanced Query Composition

**Purpose**: Build complex multi-step queries

**Example Usage**:
```json
{
  "tool": "qpfm_compose",
  "arguments": {
    "basePattern": "harmonic",
    "operations": [
      {
        "step": 1,
        "type": "OR",
        "params": ["fractal", "wave"],
        "description": "Include fractal or wave patterns"
      },
      {
        "step": 2,
        "type": "ARCHITECTURAL",
        "params": ["function"],
        "description": "Filter to functions only"
      },
      {
        "step": 3,
        "type": "THRESHOLD",
        "params": ["strength"],
        "threshold": 0.8,
        "description": "High strength patterns only"
      },
      {
        "step": 4,
        "type": "NOT",
        "params": ["deprecated"],
        "description": "Exclude deprecated patterns"
      }
    ]
  }
}
```

## Query Strategies for AI Models

### 1. Precision Search
Use high confidence (>0.8) with specific categories:
```json
{
  "query": {
    "type": "precision",
    "confidence": 0.95,
    "exploration": 0.05,
    "harmonicSignature": {
      "category": "FRACTAL",
      "strength": 0.9
    }
  }
}
```

### 2. Discovery Mode
Use high exploration (>0.7) for finding unexpected connections:
```json
{
  "query": {
    "type": "discovery",
    "confidence": 0.3,
    "exploration": 0.9
  }
}
```

### 3. Hybrid Search
Balance precision and discovery:
```json
{
  "query": {
    "type": "discovery",
    "confidence": 0.6,
    "exploration": 0.4,
    "harmonicSignature": {
      "category": "HARMONIC"
    }
  },
  "operations": [
    {
      "type": "OR",
      "params": ["audio", "visual"]
    }
  ]
}
```

## Understanding Results

### Memory Format
Each returned memory includes:
- `id`: Unique identifier
- `title`: Human-readable title
- `description`: Detailed description
- `category`: Harmonic category
- `strength`: Pattern strength (0-1)
- `confidence`: Your confidence in this result
- `tags`: Associated tags

### Metadata
- `totalFound`: Number of memories found
- `coherenceLevel`: Quantum coherence metric
- `interferencePatterns`: Count of interference patterns
- `emergentInsights`: Count of emergent discoveries
- `fieldCenter`: 3D coordinates of probability field center
- `fieldRadius`: Size of the probability field
- `fieldType`: Falloff function (exponential/polynomial/gaussian)

## Best Practices

1. **Start with category queries** for precision tasks
2. **Use discovery mode** when exploring new domains
3. **Combine logic operations** for complex filtering
4. **Monitor coherence levels** - higher = more focused results
5. **Pay attention to interference patterns** - they reveal hidden connections
6. **Use emergent modes** sparingly - they're computationally intensive

## Parameter Composition Effects

Remember: Changing parameters creates different coordinate mappings, but the probability field gradient ensures smooth transitions:

- `['fractal']` → Coordinate A
- `['fractal', 'recursive']` → Coordinate B (nearby A)
- `['fractal', 'recursive', 'tree']` → Coordinate C (nearby B)

The spatial proximity maintains semantic relationships!