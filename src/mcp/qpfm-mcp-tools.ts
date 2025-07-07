/**
 * MCP (Model Context Protocol) Tools for QPFM
 * Exposes quantum memory system to AI models via standardized tools
 */

import { z } from 'zod';
import { 
  LogicOperation,
  LogicGateType,
  PatternCategory,
  HarmonicPatternMemory
} from '../memory/types.js';
import { MemoryQuery } from '../memory/quantum-types.js';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<MCPToolResponse>;
}

export interface MCPToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Tool schemas for MCP
const LogicOperationSchema = z.object({
  type: z.enum(['AND', 'OR', 'NOT', 'XOR', 'THRESHOLD', 'BOOST', 'PATTERN', 'ARCHITECTURAL']),
  params: z.array(z.string()),
  threshold: z.number().optional(),
  weight: z.number().optional()
});

const HarmonicSignatureSchema = z.object({
  category: z.string().optional(),
  strength: z.number().min(0).max(1).optional(),
  complexity: z.number().min(0).max(1).optional()
});

const MemoryQuerySchema = z.object({
  type: z.enum(['precision', 'discovery', 'creative']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  exploration: z.number().min(0).max(1).optional(),
  harmonicSignature: HarmonicSignatureSchema.optional(),
  maxResults: z.number().positive().optional()
});

/**
 * MCP Tool: Query QPFM
 * Primary interface for AI models to query quantum memory
 */
export const qpfmQueryTool = {
  name: 'qpfm_query',
  description: `Query the Quantum Probability Field Memory system.
  
  This tool allows AI models to search harmonic patterns using:
  - Base pattern (string or structured query)
  - Logic operations to compose parameters
  - Query modes: precision (high confidence), discovery (exploration), creative (emergence)
  
  The system uses content-addressed coordinates with probability field gradients,
  ensuring smooth relevance transitions even when parameters change.`,
  
  inputSchema: z.object({
    query: z.union([
      z.string().describe('Simple pattern string for basic queries'),
      MemoryQuerySchema.describe('Structured query with confidence/exploration parameters')
    ]),
    operations: z.array(LogicOperationSchema).optional()
      .describe('Logic operations to filter/modify results'),
  }),
  
  async execute(args: { 
    query: string | MemoryQuery; 
    operations?: LogicOperation[] 
  }, qpfm: QuantumProbabilityFieldMemory) {
    const result = await qpfm.query(args.query, args.operations);
    
    // Format for AI consumption
    return {
      memories: result.memories.map(m => ({
        id: m.id,
        title: m.content.title,
        description: m.content.description,
        category: m.content.harmonicSignature.category,
        strength: m.content.harmonicSignature.strength,
        confidence: m.confidenceScore,
        tags: m.content.tags
      })),
      metadata: {
        totalFound: result.memories.length,
        coherenceLevel: result.coherenceLevel,
        interferencePatterns: result.interferencePatterns.length,
        emergentInsights: result.emergentInsights.length,
        fieldCenter: result.fieldConfiguration.center,
        fieldRadius: result.fieldConfiguration.radius,
        fieldType: result.fieldConfiguration.falloffFunction
      }
    };
  }
};

/**
 * MCP Tool: Store Pattern
 * Allows AI models to store new patterns in QPFM
 */
export const qpfmStoreTool = {
  name: 'qpfm_store',
  description: `Store a new harmonic pattern in quantum memory.
  
  Patterns are automatically assigned coordinates based on their properties.
  The DPCM system generates deterministic coordinates from the pattern's
  category, strength, complexity, and occurrences.`,
  
  inputSchema: z.object({
    id: z.string().describe('Unique identifier for the pattern'),
    title: z.string().describe('Human-readable title'),
    description: z.string().describe('Detailed description'),
    type: z.string().describe('Pattern type (e.g., function, class, pattern)'),
    tags: z.array(z.string()).describe('Searchable tags'),
    category: z.string().describe('Harmonic category (e.g., FRACTAL, WAVE_HARMONIC)'),
    strength: z.number().min(0).max(1).describe('Pattern strength (0-1)'),
    complexity: z.number().min(0).max(1).describe('Pattern complexity (0-1)'),
    confidence: z.number().min(0).max(1).describe('Detection confidence (0-1)'),
    occurrences: z.number().positive().describe('Number of occurrences found')
  }),
  
  async execute(args: any, qpfm: QuantumProbabilityFieldMemory) {
    const memory: HarmonicPatternMemory = {
      id: args.id,
      coordinates: [0, 0, 0], // Will be overwritten by DPCM
      content: {
        title: args.title,
        description: args.description,
        type: args.type,
        tags: args.tags,
        data: {}
      },
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      relevanceScore: 1.0,
      harmonicProperties: {
        category: args.category as PatternCategory,
        strength: args.strength,
        complexity: args.complexity,
        confidence: args.confidence,
        occurrences: args.occurrences
      },
      locations: [],
      evidence: [],
      relatedPatterns: [],
      causesPatterns: [],
      requiredBy: []
    };
    
    await qpfm.store(memory);
    
    return {
      success: true,
      id: args.id,
      message: 'Pattern stored successfully'
    };
  }
};

/**
 * MCP Tool: Get Pattern Distribution
 * Provides insights into the quantum memory space
 */
export const qpfmDistributionTool = {
  name: 'qpfm_distribution',
  description: `Get the distribution of patterns in quantum memory space.
  
  Shows how patterns are distributed across categories and coordinates,
  helping AI models understand the memory landscape.`,
  
  inputSchema: z.object({}),
  
  async execute(args: {}, qpfm: QuantumProbabilityFieldMemory) {
    const distribution = await qpfm.getPatternDistribution();
    const stats = qpfm.getStats();
    
    return {
      categories: Object.fromEntries(distribution),
      totalPatterns: stats.totalMemories,
      coordinateSpace: {
        min: stats.dpcmStats.coordinateSpread.min,
        max: stats.dpcmStats.coordinateSpread.max
      },
      performance: {
        avgResponseTime: stats.context.performanceMetrics.avgResponseTime,
        hitRate: stats.context.performanceMetrics.hitRate,
        emergenceFrequency: stats.context.performanceMetrics.emergenceFrequency
      }
    };
  }
};

/**
 * MCP Tool: Trigger Emergent Discovery
 * Allows AI to explicitly trigger emergent behaviors
 */
export const qpfmEmergentTool = {
  name: 'qpfm_emergent',
  description: `Trigger emergent discovery behaviors in quantum memory.
  
  Available modes:
  - dream: Explore distant memory connections
  - flashback: Activate related memory chains
  - dejavu: Find familiar patterns in new contexts
  - synthesis: Create new insights from pattern combinations`,
  
  inputSchema: z.object({
    mode: z.enum(['dream', 'flashback', 'dejavu', 'synthesis'])
      .describe('Type of emergent behavior to trigger')
  }),
  
  async execute(args: { mode: 'dream' | 'flashback' | 'dejavu' | 'synthesis' }, 
                qpfm: QuantumProbabilityFieldMemory) {
    const insights = await qpfm.triggerEmergentDiscovery(args.mode);
    
    return {
      mode: args.mode,
      insights: insights.map(i => ({
        type: i.type,
        description: i.description,
        confidence: i.confidenceLevel,
        noveltyScore: i.noveltyScore,
        contributingMemories: i.contributingMemories
      })),
      totalInsights: insights.length
    };
  }
};

/**
 * MCP Tool: Compose Complex Query
 * Advanced tool for complex parameter composition
 */
export const qpfmComposeTool = {
  name: 'qpfm_compose',
  description: `Compose complex queries with multiple logic operations.
  
  This tool helps build sophisticated queries by chaining operations:
  1. Start with base parameters
  2. Apply AND/OR/NOT/XOR for boolean logic
  3. Add THRESHOLD filters for quality control
  4. Use BOOST to emphasize certain patterns
  5. Apply PATTERN/ARCHITECTURAL for domain-specific filtering`,
  
  inputSchema: z.object({
    basePattern: z.string().describe('Starting pattern or category'),
    operations: z.array(z.object({
      step: z.number().describe('Order of operation (1, 2, 3...)'),
      type: z.enum(['AND', 'OR', 'NOT', 'XOR', 'THRESHOLD', 'BOOST', 'PATTERN', 'ARCHITECTURAL']),
      params: z.array(z.string()),
      threshold: z.number().optional(),
      weight: z.number().optional(),
      description: z.string().describe('What this operation does')
    })).describe('Ordered list of operations to apply')
  }),
  
  async execute(args: any, qpfm: QuantumProbabilityFieldMemory) {
    // Sort operations by step
    const sortedOps = args.operations.sort((a: any, b: any) => a.step - b.step);
    
    // Convert to LogicOperation array
    const operations: LogicOperation[] = sortedOps.map((op: any) => ({
      type: op.type as LogicGateType,
      params: op.params,
      threshold: op.threshold,
      weight: op.weight
    }));
    
    // Execute query
    const result = await qpfm.query(args.basePattern, operations);
    
    return {
      query: {
        basePattern: args.basePattern,
        operations: sortedOps.map((op: any) => ({
          step: op.step,
          type: op.type,
          description: op.description
        }))
      },
      results: {
        memories: result.memories.map(m => ({
          id: m.id,
          title: m.content.title,
          relevance: m.confidenceScore
        })),
        totalFound: result.memories.length
      }
    };
  }
};

/**
 * Register all QPFM tools for MCP
 */
export function registerQPFMTools(qpfm: QuantumProbabilityFieldMemory) {
  return {
    qpfm_query: {
      ...qpfmQueryTool,
      execute: (args: any) => qpfmQueryTool.execute(args, qpfm)
    },
    qpfm_store: {
      ...qpfmStoreTool,
      execute: (args: any) => qpfmStoreTool.execute(args, qpfm)
    },
    qpfm_distribution: {
      ...qpfmDistributionTool,
      execute: (args: any) => qpfmDistributionTool.execute(args, qpfm)
    },
    qpfm_emergent: {
      ...qpfmEmergentTool,
      execute: (args: any) => qpfmEmergentTool.execute(args, qpfm)
    },
    qpfm_compose: {
      ...qpfmComposeTool,
      execute: (args: any) => qpfmComposeTool.execute(args, qpfm)
    }
  };
}

/**
 * Create QPFM tools for MCP
 */
export async function createQPFMTools(storageManager: any) {
  const qpfm = storageManager.qpfm || new QuantumProbabilityFieldMemory();
  
  const tools: MCPTool[] = [
    {
      name: qpfmQueryTool.name,
      description: qpfmQueryTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'object',
            properties: {
              coordinates: {
                type: 'array',
                items: { type: 'number' }
              },
              radius: { type: 'number' },
              limit: { type: 'number' },
              categories: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['coordinates']
          }
        },
        required: ['query']
      },
      handler: async (args: any) => qpfmQueryTool.execute(args, qpfm)
    },
    {
      name: qpfmStoreTool.name,
      description: qpfmStoreTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              data: { type: 'object' },
              coordinates: {
                type: 'array',
                items: { type: 'number' }
              },
              metadata: { type: 'object' }
            },
            required: ['id', 'data', 'coordinates']
          }
        },
        required: ['pattern']
      },
      handler: async (args: any) => qpfmStoreTool.execute(args, qpfm)
    },
    {
      name: qpfmDistributionTool.name,
      description: qpfmDistributionTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      handler: async (args: any) => qpfmDistributionTool.execute(args, qpfm)
    },
    {
      name: qpfmEmergentTool.name,
      description: qpfmEmergentTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      handler: async (args: any) => qpfmEmergentTool.execute(args, qpfm)
    },
    {
      name: qpfmComposeTool.name,
      description: qpfmComposeTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          patterns: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['patterns']
      },
      handler: async (args: any) => qpfmComposeTool.execute(args, qpfm)
    }
  ];
  
  return tools;
}