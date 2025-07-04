#!/usr/bin/env node

/**
 * Guru - AI-native code intelligence MCP server
 * 
 * Provides deep code understanding through symbol graphs, execution tracing,
 * and intelligent goal inference for enhanced AI-assisted development.
 */

// Re-export everything from exports for external usage
export * from './exports.js';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GuruCore } from './core/guru.js';
import { z } from 'zod';

// Only run MCP server if this file is the main module
const isMainModule = process.argv[1] && process.argv[1].includes('index.js');

if (isMainModule) {
  console.error('Guru MCP server running in Node.js version:', process.version);

  // Zod schemas for validation
  const AnalyzeCodebaseZod = z.object({
    path: z.string().describe('Path to the codebase to analyze'),
    language: z.string().optional().describe('Primary language (auto-detected if not provided)'),
    includeTests: z.boolean().default(false).describe('Include test files in analysis'),
    goalSpec: z.string().optional().describe('YAML string with goal specification')
  });

  const TraceExecutionZod = z.object({
    entryPoint: z.string().describe('Function or method to start tracing from'),
    maxDepth: z.number().default(10).describe('Maximum call stack depth to trace'),
    followBranches: z.boolean().default(true).describe('Whether to follow all execution branches')
  });

  const GetSymbolGraphZod = z.object({
    format: z.enum(['json', 'dot', 'mermaid']).default('json').describe('Output format'),
    scope: z.string().optional().describe('Limit to specific module or namespace'),
    includeBuiltins: z.boolean().default(false).describe('Include built-in symbols')
  });

  const FindRelatedCodeZod = z.object({
    query: z.string().describe('Natural language description of what to find'),
    similarity: z.number().min(0).max(1).default(0.7).describe('Similarity threshold'),
    limit: z.number().default(10).describe('Maximum number of results')
  });

  // JSON Schema definitions for MCP
  const AnalyzeCodebaseSchema = {
    type: "object" as const,
    properties: {
      path: { type: "string", description: "Path to the codebase to analyze" },
      language: { type: "string", description: "Primary language (auto-detected if not provided)" },
      includeTests: { type: "boolean", default: false, description: "Include test files in analysis" },
      goalSpec: { type: "string", description: "YAML string with goal specification" }
    },
    required: ["path"]
  };

  const TraceExecutionSchema = {
    type: "object" as const,
    properties: {
      entryPoint: { type: "string", description: "Function or method to start tracing from" },
      maxDepth: { type: "number", default: 10, description: "Maximum call stack depth to trace" },
      followBranches: { type: "boolean", default: true, description: "Whether to follow all execution branches" }
    },
    required: ["entryPoint"]
  };

  const GetSymbolGraphSchema = {
    type: "object" as const,
    properties: {
      format: { type: "string", enum: ["json", "dot", "mermaid"], default: "json", description: "Output format" },
      scope: { type: "string", description: "Limit to specific module or namespace" },
      includeBuiltins: { type: "boolean", default: false, description: "Include built-in symbols" }
    }
  };

  const FindRelatedCodeSchema = {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Natural language description of what to find" },
      similarity: { type: "number", minimum: 0, maximum: 1, default: 0.7, description: "Similarity threshold" },
      limit: { type: "number", default: 10, description: "Maximum number of results" }
    },
    required: ["query"]
  };

  const guru = new GuruCore();

  const server = new Server(
    {
      name: 'guru',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  const tools: Tool[] = [
    {
      name: 'analyze_codebase',
      description: 'Analyze a codebase to build symbol graph and understand structure',
      inputSchema: AnalyzeCodebaseSchema,
    },
    {
      name: 'trace_execution',
      description: 'Trace execution paths without running code using static analysis',
      inputSchema: TraceExecutionSchema,
    },
    {
      name: 'get_symbol_graph',
      description: 'Get the symbol graph in various formats for visualization or analysis',
      inputSchema: GetSymbolGraphSchema,
    },
    {
      name: 'find_related_code',
      description: 'Find code related to a natural language query using semantic understanding',
      inputSchema: FindRelatedCodeSchema,
    }
  ];

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case 'analyze_codebase': {
          const params = AnalyzeCodebaseZod.parse(args);
          const result = await guru.analyzeCodebase(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        case 'trace_execution': {
          const params = TraceExecutionZod.parse(args);
          const result = await guru.traceExecution(params);
          return {
            content: [
              {
                type: 'text', 
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        case 'get_symbol_graph': {
          const params = GetSymbolGraphZod.parse(args);
          const result = await guru.getSymbolGraph(params);
          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        case 'find_related_code': {
          const params = FindRelatedCodeZod.parse(args);
          const result = await guru.findRelatedCode(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${err}`
          }
        ]
      };
    }
  });

  // Start the server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Guru MCP server running on stdio');
  }

  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
