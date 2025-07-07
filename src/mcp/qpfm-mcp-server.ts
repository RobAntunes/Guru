/**
 * MCP Server for QPFM
 * Exposes quantum memory tools to AI models via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system.js';
import { createProductionQuantumMemory } from '../memory/quantum-memory-factory.js';
import { registerQPFMTools } from './qpfm-mcp-tools.js';

// Initialize QPFM with full storage connectivity
let qpfm: QuantumProbabilityFieldMemory;

async function initializeQPFM() {
  try {
    // Try to create with full database connectivity
    qpfm = await createProductionQuantumMemory({
      performance: {
        maxMemories: 1000000, // Support large memory spaces
        maxSuperpositionSize: 50000,
        cacheEnabled: true
      }
    });
    console.log('✅ QPFM initialized with database storage');
  } catch (error) {
    console.error('⚠️  Failed to connect to databases, using in-memory mode:', error);
    // Fall back to in-memory mode
    qpfm = new QuantumProbabilityFieldMemory({
      performance: {
        maxMemories: 1000000,
        maxSuperpositionSize: 50000,
        cacheEnabled: true
      }
    });
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'qpfm-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// These will be populated after QPFM initialization
let qpfmTools: ReturnType<typeof registerQPFMTools>;
let mcpTools: Record<string, Tool> = {};

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(mcpTools),
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = qpfmTools[name as keyof typeof qpfmTools];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  try {
    const result = await tool.execute(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  // Initialize QPFM before starting server
  await initializeQPFM();
  
  // Register tools after QPFM is initialized
  qpfmTools = registerQPFMTools(qpfm);
  
  // Convert tools to MCP format
  Object.entries(qpfmTools).forEach(([name, tool]) => {
    // Convert Zod schema to JSON Schema
    const jsonSchema = {
      type: 'object' as const,
      properties: {},
      required: [] as string[]
    };
    
    // For now, we'll add a simple conversion
    // In production, use a library like zod-to-json-schema
    mcpTools[name] = {
      name: tool.name,
      description: tool.description,
      inputSchema: jsonSchema
    };
  });
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QPFM MCP Server running with storage connectivity...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});