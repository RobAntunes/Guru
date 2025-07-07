#!/usr/bin/env node
/**
 * Enhanced MCP Server for Guru
 * Unified server with QPFM, Analytics, and Gateway tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createQPFMTools } from './qpfm-mcp-tools.js';
import { createAnalyticsTools } from './qpfm-analytics-tools.js';
import { createMCPToolset } from './gateway/mcp-gateway-tools.js';
import { StorageManager } from '../storage/storage-manager.js';
import chalk from 'chalk';

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

// Store all tools and handlers
const toolHandlers = new Map<string, (args: any) => Promise<any>>();
const mcpTools: Record<string, Tool> = {};

// Initialize all systems
async function initialize() {
  console.error(chalk.bold.cyan('🚀 Initializing Guru MCP Server v2.0'));
  console.error(chalk.cyan('=' .repeat(50)));

  // Initialize storage manager
  console.error(chalk.yellow('Initializing storage systems...'));
  const storageManager = new StorageManager();
  await storageManager.connect();
  console.error(chalk.green('✅ Storage systems connected'));

  // Initialize QPFM tools
  console.error(chalk.yellow('Loading QPFM tools...'));
  const qpfmTools = await createQPFMTools(storageManager);
  console.error(chalk.green(`✅ ${qpfmTools.length} QPFM tools loaded`));

  // Initialize Analytics tools
  console.error(chalk.yellow('Loading Analytics tools...'));
  const analyticsTools = await createAnalyticsTools();
  console.error(chalk.green(`✅ ${analyticsTools.length} Analytics tools loaded`));

  // Initialize Gateway tools
  console.error(chalk.yellow('Loading MCP Gateway tools...'));
  const { gateway, tools: gatewayTools, toolList: gatewayToolList } = await createMCPToolset(storageManager);
  console.error(chalk.green(`✅ ${gatewayToolList.length} Gateway tools loaded`));

  // Register all tools
  const allTools = [...qpfmTools, ...analyticsTools, ...gatewayToolList];
  
  for (const tool of allTools) {
    // Store handler
    toolHandlers.set(tool.name, tool.handler);
    
    // Convert to MCP format
    mcpTools[tool.name] = {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    };
  }

  console.error(chalk.cyan('\n📊 Tool Categories:'));
  console.error(chalk.gray('  QPFM Tools (Quantum Memory):'));
  qpfmTools.forEach(t => console.error(chalk.gray(`    • ${t.name}`)));
  
  console.error(chalk.gray('\n  Analytics Tools (Pattern Analysis):'));
  analyticsTools.forEach(t => console.error(chalk.gray(`    • ${t.name}`)));
  
  console.error(chalk.gray('\n  Gateway Tools (Unified Intelligence):'));
  gatewayToolList.forEach(t => console.error(chalk.gray(`    • ${t.name}`)));

  console.error(chalk.bold.green(`\n✅ Total tools available: ${allTools.length}`));
  console.error(chalk.cyan('=' .repeat(50)) + '\n');

  return { gateway, storageManager };
}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(mcpTools),
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const handler = toolHandlers.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  try {
    console.error(chalk.blue(`\n🔧 Executing: ${name}`));
    const startTime = Date.now();
    
    const result = await handler(args);
    
    const executionTime = Date.now() - startTime;
    console.error(chalk.green(`✅ Completed in ${executionTime}ms`));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error}`));
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Error executing ${name}: ${error}`,
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  try {
    // Initialize all systems
    const { gateway, storageManager } = await initialize();
    
    // Create transport
    const transport = new StdioServerTransport();
    
    // Connect server
    await server.connect(transport);
    
    console.error(chalk.bold.cyan('\n🌟 Guru MCP Server is running!'));
    console.error(chalk.cyan('=' .repeat(50)));
    console.error(chalk.gray('\nServer features:'));
    console.error(chalk.gray('  • Quantum Memory (QPFM) for pattern storage'));
    console.error(chalk.gray('  • Time-series analysis (DuckLake)'));
    console.error(chalk.gray('  • Graph intelligence (Neo4j)'));
    console.error(chalk.gray('  • Real-time caching (Redis)'));
    console.error(chalk.gray('  • Unified gateway for AI agents'));
    console.error(chalk.gray('\nWaiting for requests...'));
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error(chalk.yellow('\n\nShutting down gracefully...'));
      
      // Clear gateway cache
      gateway.clearCache();
      
      // Close storage connections
      await storageManager.disconnect();
      
      console.error(chalk.green('✅ Cleanup complete'));
      process.exit(0);
    });
    
  } catch (error) {
    console.error(chalk.red('Failed to start server:'), error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Start the server
main();