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
import { registerQPFMTools } from './qpfm-mcp-tools.js';

// Initialize QPFM
const qpfm = new QuantumProbabilityFieldMemory({
  performance: {
    maxMemories: 1000000, // Support large memory spaces
    maxSuperpositionSize: 50000,
    cacheEnabled: true
  }
});

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

// Register QPFM tools
const qpfmTools = registerQPFMTools(qpfm);

// Convert our tools to MCP format
const mcpTools: Record<string, Tool> = {};
Object.entries(qpfmTools).forEach(([name, tool]) => {
  mcpTools[name] = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  };
});

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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QPFM MCP Server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});