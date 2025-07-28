/**
 * Unified MCP Server for Guru
 * Exposes QPFM, Living Task Forest, and other Guru tools via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  McpTool
} from '@modelcontextprotocol/sdk/types.js';

// Guru core systems
import { Guru } from '../core/guru.js';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system.js';
import { createProductionQuantumMemory } from '../memory/quantum-memory-factory.js';

// Tool registrations
import { registerQPFMTools } from './qpfm-mcp-tools.js';
import { LTFMcpTools } from './ltf-mcp-tools.js';
import { MCPAnalyticsTools } from './qpfm-analytics-tools.js';
import { MCPEnrichmentTools } from './harmonic-enrichment-tools.js';

// Configuration
import { loadConfig } from '../config/config-loader.js';
import { Logger } from '../logging/logger.js';

const logger = Logger.getInstance();

// Global instances
let guru: Guru;
let qpfm: QuantumProbabilityFieldMemory;
let ltfTools: LTFMcpTools;
let analyticsTools: MCPAnalyticsTools;
let enrichmentTools: MCPEnrichmentTools;

// Combined tool registry
let allTools: Record<string, McpTool> = {};

/**
 * Initialize all Guru systems
 */
async function initializeGuru() {
  logger.info('🚀 Initializing Guru systems...');
  
  // Load configuration
  const config = await loadConfig();
  
  // Initialize Guru core
  guru = new Guru();
  await guru.initialize(config.projectPath || process.cwd());
  logger.info('✅ Guru core initialized');
  
  // Initialize QPFM
  try {
    qpfm = await createProductionQuantumMemory({
      performance: {
        maxMemories: 1000000,
        maxSuperpositionSize: 50000,
        cacheEnabled: true
      }
    });
    logger.info('✅ QPFM initialized with database storage');
  } catch (error) {
    logger.warn('⚠️  Failed to connect to databases, using in-memory QPFM:', error);
    qpfm = new QuantumProbabilityFieldMemory({
      performance: {
        maxMemories: 1000000,
        maxSuperpositionSize: 50000,
        cacheEnabled: true
      }
    });
  }
  
  // Initialize tool sets
  ltfTools = new LTFMcpTools();
  ltfTools.initialize(guru, config.storagePath);
  
  analyticsTools = new MCPAnalyticsTools(qpfm);
  enrichmentTools = new MCPEnrichmentTools(guru);
  
  logger.info('✅ All tool sets initialized');
}

/**
 * Register all tools with the MCP server
 */
function registerAllTools() {
  logger.info('📦 Registering MCP tools...');
  
  // Register QPFM tools
  const qpfmTools = registerQPFMTools(qpfm);
  Object.entries(qpfmTools).forEach(([name, tool]) => {
    allTools[name] = convertToMcpTool(tool);
  });
  
  // Register LTF tools
  const ltfMcpTools = ltfTools.getTools();
  ltfMcpTools.forEach(tool => {
    allTools[tool.name] = tool;
  });
  
  // Register analytics tools
  const analyticsMcpTools = analyticsTools.getTools();
  analyticsMcpTools.forEach(tool => {
    allTools[tool.name] = tool;
  });
  
  // Register enrichment tools
  const enrichmentMcpTools = enrichmentTools.getTools();
  enrichmentMcpTools.forEach(tool => {
    allTools[tool.name] = tool;
  });
  
  logger.info(`✅ Registered ${Object.keys(allTools).length} tools`);
  
  // Log tool categories
  const categories = {
    qpfm: Object.keys(allTools).filter(name => name.startsWith('qpfm_')).length,
    ltf: Object.keys(allTools).filter(name => name.startsWith('ltf_')).length,
    analytics: Object.keys(allTools).filter(name => name.includes('analytics')).length,
    enrichment: Object.keys(allTools).filter(name => name.includes('enrich')).length
  };
  
  logger.info('Tool categories:', categories);
}

/**
 * Convert old-style tool to MCP tool format
 */
function convertToMcpTool(tool: any): McpTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema || {
      type: 'object',
      properties: {},
      required: []
    },
    handler: tool.execute || tool.handler
  };
}

// Create MCP server
const server = new Server(
  {
    name: 'guru-mcp-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.values(allTools).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
  
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = allTools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  try {
    logger.debug(`Executing tool: ${name}`, args);
    
    const result = await tool.handler(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    logger.error(`Error executing ${name}:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            tool: name,
            args: args
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Health check endpoint
server.setRequestHandler({ method: 'health' } as any, async () => {
  const health = {
    status: 'healthy',
    systems: {
      guru: !!guru,
      qpfm: !!qpfm,
      ltf: !!ltfTools,
      analytics: !!analyticsTools,
      enrichment: !!enrichmentTools
    },
    toolCount: Object.keys(allTools).length,
    uptime: process.uptime()
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(health, null, 2)
      }
    ]
  };
});

// Start server
async function main() {
  try {
    logger.info('🌟 Starting Guru MCP Server...\n');
    
    // Initialize all systems
    await initializeGuru();
    
    // Register all tools
    registerAllTools();
    
    // Create and connect transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('\n✨ Guru MCP Server is running!');
    logger.info('Available tool categories:');
    logger.info('  - QPFM (Quantum Memory): Memory storage, recall, and superposition');
    logger.info('  - LTF (Living Task Forest): Biological task management');
    logger.info('  - Analytics: Pattern analysis and insights');
    logger.info('  - Enrichment: Harmonic intelligence enhancement\n');
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down Guru MCP Server...');
  
  // Clean up resources
  if (qpfm) {
    // Save any pending data
  }
  
  if (ltfTools) {
    // Save forest state
  }
  
  process.exit(0);
});

// Run the server
main().catch((error) => {
  logger.error('Fatal server error:', error);
  process.exit(1);
});