#!/usr/bin/env node

/**
 * Guru - AI-native code intelligence MCP server
 *
 * Provides deep code understanding through symbol graphs, execution tracing,
 * and intelligent goal inference for enhanced AI-assisted development.
 */

// Re-export everything from exports for external usage
export * from "./exports.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GuruCore } from "./core/guru.js";
import { z } from "zod";

// Check if running as CLI vs MCP server
const args = process.argv.slice(2);
const isCliMode = args.length > 0 && (args[0] === 'analyze' || args[0] === 'trace' || args[0] === 'graph');

if (isCliMode) {
  // CLI mode - handle command line arguments
  console.error("🚀 Guru CLI mode activated");
  
  async function runCli() {
    const guru = new GuruCore();
    
    try {
      if (args[0] === 'analyze') {
        // Parse CLI arguments for analyze command
        let path = '';
        let debug = false;
        let scanMode = 'auto';
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--path' && i + 1 < args.length) {
            path = args[i + 1];
            i++; // skip next arg
          } else if (args[i] === '--debug') {
            debug = true;
          } else if (args[i] === '--scan-mode' && i + 1 < args.length) {
            scanMode = args[i + 1];
            i++; // skip next arg
          }
        }
        
        if (!path) {
          console.error("❌ Error: --path argument is required");
          process.exit(1);
        }
        
        console.error(`📁 Analyzing codebase at: ${path}`);
        if (debug) {
          console.error("🐛 Debug mode enabled");
        }
        
        const result = await guru.analyzeCodebase(
          path,
          undefined,
          scanMode as any
        );
        
        console.log(JSON.stringify(result, null, 2));
        
      } else {
        console.error(`❌ Unknown command: ${args[0]}`);
        console.error("Usage: guru analyze --path <path> [--debug] [--scan-mode <mode>]");
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ CLI Error:", error);
      process.exit(1);
    }
  }
  
  runCli().catch(error => {
    console.error("❌ Fatal CLI Error:", error);
    process.exit(1);
  });
  
} else {
  // MCP server mode - original functionality
  console.error("Guru MCP server running in Node.js version:", process.version);

  // Zod schemas for validation
  const AnalyzeCodebaseZod = z.object({
    path: z.string().describe("Path to the codebase to analyze"),
    language: z
      .string()
      .optional()
      .describe("Primary language (auto-detected if not provided)"),
    includeTests: z
      .boolean()
      .default(false)
      .describe("Include test files in analysis"),
    goalSpec: z
      .string()
      .optional()
      .describe("YAML string with goal specification"),
    scanMode: z
      .string()
      .optional()
      .describe("Scan mode"),
  });

  const TraceExecutionZod = z.object({
    entryPoint: z.string().describe("Function or method to start tracing from"),
    maxDepth: z
      .number()
      .default(10)
      .describe("Maximum call stack depth to trace"),
    followBranches: z
      .boolean()
      .default(true)
      .describe("Whether to follow all execution branches"),
  });

  const GetSymbolGraphZod = z.object({
    format: z
      .enum(["json", "dot", "mermaid"])
      .default("json")
      .describe("Output format"),
    scope: z
      .string()
      .optional()
      .describe("Limit to specific module or namespace"),
    includeBuiltins: z
      .boolean()
      .default(false)
      .describe("Include built-in symbols"),
  });

  const FindRelatedCodeZod = z.object({
    query: z.string().describe("Natural language description of what to find"),
    similarity: z
      .number()
      .min(0)
      .max(1)
      .default(0.7)
      .describe("Similarity threshold"),
    limit: z.number().default(10).describe("Maximum number of results"),
  });

  // JSON Schema definitions for MCP
  const AnalyzeCodebaseSchema = {
    type: "object" as const,
    properties: {
      path: { type: "string", description: "Path to the codebase to analyze" },
      language: {
        type: "string",
        description: "Primary language (auto-detected if not provided)",
      },
      includeTests: {
        type: "boolean",
        default: false,
        description: "Include test files in analysis",
      },
      goalSpec: {
        type: "string",
        description: "YAML string with goal specification",
      },
      scanMode: {
        type: "string",
        description: "Scan mode",
      },
    },
    required: ["path"],
  };

  const TraceExecutionSchema = {
    type: "object" as const,
    properties: {
      entryPoint: {
        type: "string",
        description: "Function or method to start tracing from",
      },
      maxDepth: {
        type: "number",
        default: 10,
        description: "Maximum call stack depth to trace",
      },
      followBranches: {
        type: "boolean",
        default: true,
        description: "Whether to follow all execution branches",
      },
    },
    required: ["entryPoint"],
  };

  const GetSymbolGraphSchema = {
    type: "object" as const,
    properties: {
      format: {
        type: "string",
        enum: ["json", "dot", "mermaid"],
        default: "json",
        description: "Output format",
      },
      scope: {
        type: "string",
        description: "Limit to specific module or namespace",
      },
      includeBuiltins: {
        type: "boolean",
        default: false,
        description: "Include built-in symbols",
      },
    },
  };

  const FindRelatedCodeSchema = {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Natural language description of what to find",
      },
      similarity: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.7,
        description: "Similarity threshold",
      },
      limit: {
        type: "number",
        default: 10,
        description: "Maximum number of results",
      },
    },
    required: ["query"],
  };

  const guru = new GuruCore();

  const server = new Server(
    {
      name: "guru",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Define available tools
  const tools: Tool[] = [
    {
      name: "analyze_codebase",
      description:
        "Analyze a codebase to build symbol graph and understand structure",
      inputSchema: AnalyzeCodebaseSchema,
    },
    {
      name: "trace_execution",
      description:
        "Trace execution paths without running code using static analysis",
      inputSchema: TraceExecutionSchema,
    },
    {
      name: "get_symbol_graph",
      description:
        "Get the symbol graph in various formats for visualization or analysis",
      inputSchema: GetSymbolGraphSchema,
    },
    {
      name: "find_related_code",
      description:
        "Find code related to a natural language query using semantic understanding",
      inputSchema: FindRelatedCodeSchema,
    },
  ];

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case "analyze_codebase": {
          const params = AnalyzeCodebaseZod.parse(args);
          const result = await guru.analyzeCodebase(
            params.path,
            params.goalSpec,
            params.scanMode as 'auto' | 'incremental' | 'full' | undefined
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case "trace_execution": {
          const params = TraceExecutionZod.parse(args);
          const result = await guru.traceExecution(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case "get_symbol_graph": {
          const params = GetSymbolGraphZod.parse(args);
          const result = await guru.getSymbolGraph(params);
          return {
            content: [
              {
                type: "text",
                text:
                  typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case "find_related_code": {
          const params = FindRelatedCodeZod.parse(args);
          const result = await guru.findRelatedCode(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${err}`,
          },
        ],
      };
    }
  });

  // Start the server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 Initializing Guru AI-native code intelligence...");
    console.error("✅ Guru Core initialized with revolutionary intelligence components!");
    console.error("Guru MCP server running on stdio");
  }

  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
