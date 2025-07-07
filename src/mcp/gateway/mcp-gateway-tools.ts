/**
 * MCP Gateway Tools
 * Complete toolset for AI agents to interact with the pattern intelligence system
 */

import { MCPTool, MCPToolResponse } from '../qpfm-mcp-tools.js';
import { MCPPatternGateway, MCPQuery, MCPQueryType } from './mcp-pattern-gateway.js';
import { createDuckDBDataLake, DuckDBDataLake } from '../../datalake/duckdb-data-lake.js';
import { Neo4jRelationshipStore } from '../../storage/neo4j-relationship-store.js';
import { QuantumProbabilityFieldMemory } from '../../memory/quantum-memory-system.js';
import { StorageManager } from '../../storage/storage-manager.js';

/**
 * Complete MCP tool suite for pattern intelligence
 */
export class MCPGatewayTools {
  private gateway: MCPPatternGateway;
  private tools: Map<string, MCPTool> = new Map();

  constructor(gateway: MCPPatternGateway) {
    this.gateway = gateway;
    this.initializeTools();
  }

  private initializeTools() {
    // Core analysis tools
    this.registerTool({
      name: 'analyze_code_quality',
      description: 'Get comprehensive quality assessment for any code file or symbol',
      inputSchema: {
        type: 'object',
        properties: {
          target: { 
            type: 'string', 
            description: 'File path or symbol name to analyze' 
          },
          includeRecommendations: { 
            type: 'boolean', 
            default: true,
            description: 'Include actionable recommendations' 
          }
        },
        required: ['target']
      },
      handler: async (params) => this.analyzeCodeQuality(params)
    });

    this.registerTool({
      name: 'find_similar_patterns',
      description: 'Find code with similar harmonic patterns using quantum memory',
      inputSchema: {
        type: 'object',
        properties: {
          target: { 
            type: 'string', 
            description: 'Code to find similarities for' 
          },
          radius: { 
            type: 'number', 
            default: 0.3,
            description: 'Similarity threshold (0-1)' 
          },
          limit: { 
            type: 'number', 
            default: 10,
            description: 'Maximum results to return' 
          }
        },
        required: ['target']
      },
      handler: async (params) => this.findSimilarPatterns(params)
    });

    this.registerTool({
      name: 'trace_pattern_evolution',
      description: 'Track how patterns evolved over time in the codebase',
      inputSchema: {
        type: 'object',
        properties: {
          target: { 
            type: 'string', 
            description: 'File or symbol to track' 
          },
          timeRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            },
            description: 'Time range to analyze'
          },
          granularity: {
            type: 'string',
            enum: ['hour', 'day', 'week'],
            default: 'day'
          }
        },
        required: ['target']
      },
      handler: async (params) => this.tracePatternEvolution(params)
    });

    this.registerTool({
      name: 'explore_code_relationships',
      description: 'Explore how code elements are related through patterns and calls',
      inputSchema: {
        type: 'object',
        properties: {
          target: { 
            type: 'string', 
            description: 'Starting point for exploration' 
          },
          depth: { 
            type: 'number', 
            default: 2,
            description: 'How deep to traverse relationships' 
          },
          includePatterns: { 
            type: 'boolean', 
            default: true 
          }
        },
        required: ['target']
      },
      handler: async (params) => this.exploreCodeRelationships(params)
    });

    this.registerTool({
      name: 'find_architectural_hotspots',
      description: 'Identify architectural hotspots and cross-cutting patterns',
      inputSchema: {
        type: 'object',
        properties: {
          minFiles: { 
            type: 'number', 
            default: 3,
            description: 'Minimum files for cross-cutting pattern' 
          },
          minScore: { 
            type: 'number', 
            default: 0.7,
            description: 'Minimum pattern score' 
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Pattern categories to focus on'
          }
        }
      },
      handler: async (params) => this.findArchitecturalHotspots(params)
    });

    this.registerTool({
      name: 'compare_code_snapshots',
      description: 'Compare code quality between different analysis snapshots',
      inputSchema: {
        type: 'object',
        properties: {
          snapshot1: { 
            type: 'string', 
            description: 'First snapshot name' 
          },
          snapshot2: { 
            type: 'string', 
            description: 'Second snapshot name' 
          },
          target: {
            type: 'string',
            description: 'Optional: specific file/symbol to focus on'
          }
        },
        required: ['snapshot1', 'snapshot2']
      },
      handler: async (params) => this.compareSnapshots(params)
    });

    this.registerTool({
      name: 'get_comprehensive_analysis',
      description: 'Get complete intelligence combining all storage systems',
      inputSchema: {
        type: 'object',
        properties: {
          target: { 
            type: 'string', 
            description: 'Code element to analyze comprehensively' 
          },
          includeTimeline: { type: 'boolean', default: true },
          includeGraph: { type: 'boolean', default: true },
          includeSimilar: { type: 'boolean', default: true }
        },
        required: ['target']
      },
      handler: async (params) => this.getComprehensiveAnalysis(params)
    });

    this.registerTool({
      name: 'suggest_refactoring_targets',
      description: 'Identify code that would benefit most from refactoring',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { 
            type: 'number', 
            default: 10,
            description: 'Number of targets to suggest' 
          },
          focusArea: {
            type: 'string',
            enum: ['complexity', 'patterns', 'relationships', 'all'],
            default: 'all'
          }
        }
      },
      handler: async (params) => this.suggestRefactoringTargets(params)
    });

    this.registerTool({
      name: 'stream_pattern_updates',
      description: 'Stream real-time pattern updates matching criteria',
      inputSchema: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Pattern categories to monitor'
          },
          minScore: {
            type: 'number',
            description: 'Minimum pattern score'
          },
          duration: {
            type: 'number',
            default: 60000,
            description: 'Stream duration in milliseconds'
          }
        }
      },
      handler: async (params) => this.streamPatternUpdates(params)
    });

    this.registerTool({
      name: 'get_pattern_insights',
      description: 'Get high-level insights about the codebase patterns',
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['global', 'directory', 'file'],
            default: 'global'
          },
          path: {
            type: 'string',
            description: 'Path for directory/file scope'
          }
        }
      },
      handler: async (params) => this.getPatternInsights(params)
    });
  }

  private registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  // Tool implementations

  private async analyzeCodeQuality(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: params.target,
      parameters: params
    });

    return {
      success: response.success,
      data: {
        target: params.target,
        quality: response.data?.metrics?.overallQuality || 'unknown',
        metrics: response.data?.metrics,
        insights: response.insights,
        recommendations: params.includeRecommendations ? response.recommendations : undefined
      },
      error: response.success ? undefined : 'Analysis failed'
    };
  }

  private async findSimilarPatterns(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'realtime_similarity',
      target: params.target,
      parameters: {
        radius: params.radius,
        limit: params.limit
      }
    });

    return {
      success: response.success,
      data: {
        query: params.target,
        similar: response.data?.similar || [],
        totalFound: response.data?.similar?.length || 0,
        insights: response.insights
      }
    };
  }

  private async tracePatternEvolution(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'pattern_evolution',
      target: params.target,
      parameters: {
        timeRange: params.timeRange,
        granularity: params.granularity
      }
    });

    return {
      success: response.success,
      data: {
        target: params.target,
        evolution: response.data?.evolution || [],
        trends: response.data?.trends,
        insights: response.insights,
        recommendations: response.recommendations
      }
    };
  }

  private async exploreCodeRelationships(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'relationship_traversal',
      target: params.target,
      parameters: {
        depth: params.depth,
        includePatterns: params.includePatterns
      }
    });

    return {
      success: response.success,
      data: {
        symbol: response.data?.symbol,
        patterns: params.includePatterns ? response.data?.patterns : undefined,
        calls: response.data?.calls || [],
        calledBy: response.data?.calledBy || [],
        insights: response.insights
      }
    };
  }

  private async findArchitecturalHotspots(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'cross_cutting_patterns',
      target: '',
      parameters: params
    });

    return {
      success: response.success,
      data: {
        hotspots: response.data?.patterns || [],
        totalFound: response.data?.totalFound || 0,
        impactAnalysis: response.data?.impactAnalysis,
        insights: response.insights,
        recommendations: response.recommendations
      }
    };
  }

  private async compareSnapshots(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'pattern_evolution',
      target: params.target || 'global',
      parameters: {
        snapshot1: params.snapshot1,
        snapshot2: params.snapshot2
      }
    });

    return {
      success: response.success,
      data: {
        comparison: response.data,
        insights: response.insights,
        recommendations: response.recommendations
      }
    };
  }

  private async getComprehensiveAnalysis(params: any): Promise<MCPToolResponse> {
    const response = await this.gateway.handleMCPRequest({
      type: 'comprehensive_intelligence',
      target: params.target,
      parameters: {
        includeTimeline: params.includeTimeline,
        includeGraph: params.includeGraph,
        includeSimilar: params.includeSimilar
      }
    });

    return {
      success: response.success,
      data: response.data
    };
  }

  private async suggestRefactoringTargets(params: any): Promise<MCPToolResponse> {
    // Query for poor quality code
    const queries: Promise<any>[] = [];
    
    if (params.focusArea === 'all' || params.focusArea === 'complexity') {
      queries.push(this.gateway.handleMCPRequest({
        type: 'cross_cutting_patterns',
        target: '',
        parameters: { minFiles: 5 }
      }));
    }

    // Get results
    const results = await Promise.all(queries);
    
    // Compile refactoring targets
    const targets: any[] = [];
    
    for (const result of results) {
      if (result.success && result.data?.patterns) {
        targets.push(...result.data.patterns.map((p: any) => ({
          target: p.pattern_type,
          reason: 'Cross-cutting pattern',
          impact: p.file_count,
          priority: p.file_count > 10 ? 'high' : 'medium'
        })));
      }
    }

    // Sort by priority and limit
    targets.sort((a, b) => b.impact - a.impact);
    const topTargets = targets.slice(0, params.limit);

    return {
      success: true,
      data: {
        targets: topTargets,
        totalFound: targets.length,
        focusArea: params.focusArea
      }
    };
  }

  private async streamPatternUpdates(params: any): Promise<MCPToolResponse> {
    const stream = this.gateway.streamPatternUpdates({
      categories: params.categories,
      minScore: params.minScore
    });

    const updates: any[] = [];
    const startTime = Date.now();

    return new Promise((resolve) => {
      stream.on('pattern:update', (update) => {
        updates.push({
          timestamp: update.timestamp,
          pattern: update.response.data
        });
      });

      setTimeout(() => {
        stream.stop();
        resolve({
          success: true,
          data: {
            updates,
            totalUpdates: updates.length,
            duration: Date.now() - startTime
          }
        });
      }, params.duration);
    });
  }

  private async getPatternInsights(params: any): Promise<MCPToolResponse> {
    // Get metrics from gateway
    const metrics = this.gateway.getMetrics();
    
    // Get pattern statistics based on scope
    let insights: any = {
      scope: params.scope,
      queryMetrics: metrics,
      topQueryTypes: Object.entries(metrics)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3)
        .map(([type, data]) => ({ type, ...data }))
    };

    if (params.scope === 'global') {
      // Add global insights
      const response = await this.gateway.handleMCPRequest({
        type: 'cross_cutting_patterns',
        target: '',
        parameters: { minFiles: 2 }
      });
      
      insights.globalPatterns = response.data?.totalFound || 0;
      insights.topPatterns = response.data?.patterns?.slice(0, 5) || [];
    }

    return {
      success: true,
      data: insights
    };
  }
}

/**
 * Create and configure the complete MCP toolset
 */
export async function createMCPToolset(
  storageManager: StorageManager
): Promise<{
  gateway: MCPPatternGateway;
  tools: MCPGatewayTools;
  toolList: MCPTool[];
}> {
  // Initialize storage systems
  const duckLake = await createDuckDBDataLake();
  
  const neo4j = storageManager.neo4j;
  const qpfm = new QuantumProbabilityFieldMemory(undefined, storageManager);

  // Create gateway
  const gateway = new MCPPatternGateway(duckLake as any, neo4j, qpfm, {
    cacheSize: 1000,
    cacheTTL: 300000,
    enableStreaming: true,
    routingStrategy: 'optimal'
  });

  // Create tools
  const tools = new MCPGatewayTools(gateway);

  return {
    gateway,
    tools,
    toolList: tools.getTools()
  };
}

/**
 * MCP server integration
 */
export function registerMCPGatewayTools(server: any, tools: MCPGatewayTools) {
  const toolList = tools.getTools();
  
  // Register each tool with the MCP server
  for (const tool of toolList) {
    server.registerTool(tool);
  }
  
  console.log(`🌟 Registered ${toolList.length} MCP gateway tools`);
}