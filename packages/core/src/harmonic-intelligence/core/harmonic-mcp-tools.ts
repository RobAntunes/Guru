/**
 * MCP (Model Context Protocol) tools for Harmonic Intelligence
 * Provides AI models with intuitive codebase understanding
 */

import { HarmonicCLI } from './harmonic-cli.js';
import { z } from 'zod';

// Tool schemas for MCP
export const HarmonicAnalyzeSchema = z.object({
  path: z.string().describe('Path to file or directory to analyze'),
  patterns: z.array(z.string()).optional().describe('Specific patterns to detect (optional)'),
  symbols: z.array(z.string()).optional().describe('Specific symbols to analyze (optional)'),
  includeEvidence: z.boolean().default(false).describe('Include detailed evidence')
});

export const HarmonicSummarizeSchema = z.object({
  path: z.string().describe('Path to summarize')
});

export const HarmonicFindPatternSchema = z.object({
  path: z.string().describe('Path to search in'),
  patterns: z.array(z.string()).describe('Patterns to find')
});

export const HarmonicSymbolContextSchema = z.object({
  path: z.string().describe('Path containing the symbol'),
  symbolName: z.string().describe('Name of the symbol')
});

/**
 * MCP tool definitions for Harmonic Intelligence
 */
export const harmonicTools = [
  {
    name: 'harmonic_analyze',
    description: 'Analyze code for mathematical patterns - provides raw pattern data for AI interpretation',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to analyze' },
        patterns: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Specific patterns to detect'
        },
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific symbols to analyze'
        },
        includeEvidence: {
          type: 'boolean',
          default: false,
          description: 'Include detailed evidence'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'harmonic_summarize',
    description: 'Get a quick summary of harmonic patterns in code - ideal for understanding architecture',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to summarize' }
      },
      required: ['path']
    }
  },
  {
    name: 'harmonic_find_pattern',
    description: 'Find code exhibiting specific mathematical patterns',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to search in' },
        patterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Pattern names to find'
        }
      },
      required: ['path', 'patterns']
    }
  },
  {
    name: 'harmonic_symbol_context',
    description: 'Get pattern context for a specific symbol - minimal context for understanding',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path containing the symbol' },
        symbolName: { type: 'string', description: 'Symbol name' }
      },
      required: ['path', 'symbolName']
    }
  }
];

/**
 * MCP tool handlers for Harmonic Intelligence
 */
export class HarmonicMCPTools {
  private cli: HarmonicCLI;
  
  constructor() {
    this.cli = new HarmonicCLI();
  }
  
  /**
   * Handle MCP tool calls
   */
  async handleToolCall(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'harmonic_analyze': {
        const params = HarmonicAnalyzeSchema.parse(args);
        return await this.cli.analyze(params);
      }
      
      case 'harmonic_summarize': {
        const params = HarmonicSummarizeSchema.parse(args);
        return await this.cli.summarize(params.path);
      }
      
      case 'harmonic_find_pattern': {
        const params = HarmonicFindPatternSchema.parse(args);
        return await this.cli.findByPattern(params.path, params.patterns);
      }
      
      case 'harmonic_symbol_context': {
        const params = HarmonicSymbolContextSchema.parse(args);
        return await this.cli.getSymbolContext(params.path, params.symbolName);
      }
      
      default:
        throw new Error(`Unknown harmonic tool: ${toolName}`);
    }
  }
  
  /**
   * Get all available pattern types for reference
   */
  static getAvailablePatterns(): string[] {
    return [
      // Classical Harmony
      'golden_ratio_patterns',
      'fibonacci_sequences', 
      'Prime Number Harmonics',
      'Euler Constant Patterns',
      
      // Geometric Harmony
      'sacred_geometry_patterns',
      'symmetry_groups',
      'platonic_solid_structures',
      
      // Fractal Patterns
      'mandelbrot_complexity',
      'julia_set_patterns',
      'l_system_growth',
      'hausdorff_dimension',
      
      // Tiling & Crystallographic
      'tessellation_patterns',
      'crystal_lattice_structures',
      'penrose_tilings',
      
      // Topological Patterns
      'network_topology',
      'knot_invariants',
      'small_world_networks',
      
      // Wave & Harmonic
      'fourier_analysis',
      'standing_waves',
      'resonance_patterns',
      
      // Information Theory
      'shannon_entropy',
      'kolmogorov_complexity',
      'effective_complexity'
    ];
  }
  
  /**
   * Get pattern descriptions for AI understanding
   */
  static getPatternDescriptions(): Record<string, string> {
    return {
      'golden_ratio_patterns': 'Code structures exhibiting golden ratio (1.618) proportions',
      'fibonacci_sequences': 'Sequential patterns following Fibonacci relationships',
      'Prime Number Harmonics': 'Distribution patterns related to prime numbers',
      'Euler Constant Patterns': 'Logarithmic and exponential growth patterns',
      
      'sacred_geometry_patterns': 'Geometric relationships found in nature and architecture',
      'symmetry_groups': 'Rotational, reflective, and translational symmetries',
      'platonic_solid_structures': 'Regular polytope-like organizational structures',
      
      'mandelbrot_complexity': 'Self-similar fractal boundaries and complexity',
      'julia_set_patterns': 'Dynamic system behavior with chaotic attractors',
      'l_system_growth': 'Recursive growth patterns like biological systems',
      'hausdorff_dimension': 'Fractional dimension measuring space-filling properties',
      
      'tessellation_patterns': 'Regular tiling and space-filling patterns',
      'crystal_lattice_structures': 'Periodic arrangement patterns',
      'penrose_tilings': 'Aperiodic tiling with five-fold symmetry',
      
      'network_topology': 'Graph structure patterns (hubs, clusters, paths)',
      'knot_invariants': 'Topological entanglement and linking patterns',
      'small_world_networks': 'High clustering with short path lengths',
      
      'fourier_analysis': 'Frequency domain patterns and periodicities',
      'standing_waves': 'Resonant patterns with nodes and antinodes',
      'resonance_patterns': 'Harmonic relationships and overtones',
      
      'shannon_entropy': 'Information content and randomness measures',
      'kolmogorov_complexity': 'Minimum description length and compressibility',
      'effective_complexity': 'Balance between structure and randomness'
    };
  }
}