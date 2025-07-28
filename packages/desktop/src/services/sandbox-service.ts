/**
 * Sandbox Service
 * Provides secure code execution through MCP WASM sandbox
 */

import { invoke } from '@tauri-apps/api/core';

export interface SandboxResult {
  success: boolean;
  output?: any;
  error?: string;
  logs: string[];
  executionTime: number;
  memoryUsed?: number;
  context?: Record<string, any>;
}

export interface SandboxOptions {
  timeout?: number; // milliseconds
  memoryLimit?: number; // bytes
  context?: Record<string, any>; // Variables to inject
  allowedAPIs?: string[]; // Which APIs to expose
}

class SandboxService {
  private experiments: any[] = [];
  private successfulStrategies: Record<string, any[]> = {};

  /**
   * Execute code in the WASM sandbox through MCP
   */
  async executeMCPSandbox(
    code: string,
    language: 'javascript' | 'python' = 'javascript',
    context: Record<string, any> = {}
  ): Promise<SandboxResult> {
    const startTime = Date.now();
    
    try {
      // Call MCP WASM sandbox through Tauri
      const result = await invoke('execute_mcp_tool', {
        tool: 'guru_wasm_sandbox',
        args: {
          experiment_type: 'code_execution',
          problem_context: {
            language,
            ...context
          },
          hypothesis: `Execute ${language} code in sandbox`,
          code_attempts: [{
            code,
            approach: 'direct_execution',
            language
          }],
          success_criteria: {
            min_efficiency: 0.5
          }
        }
      });

      // Parse the result
      const response = result as any;
      if (response.success && response.results && response.results.length > 0) {
        const execution = response.results[0];
        return {
          success: execution.success,
          output: execution.output,
          logs: execution.logs || [],
          executionTime: Date.now() - startTime,
          memoryUsed: execution.metrics?.memory_peak_kb || 0,
          context: this.extractContext(code, language)
        };
      }

      return {
        success: false,
        error: 'No execution results returned',
        logs: [],
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        logs: [],
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute code in the sandbox
   */
  async executeCode(
    code: string,
    language: 'javascript' | 'python' = 'javascript',
    options: SandboxOptions = {}
  ): Promise<SandboxResult> {
    // Use MCP sandbox for actual execution
    return this.executeMCPSandbox(code, language, options.context || {});
  }


  /**
   * Prepare context injection code
   */
  private prepareContext(
    context: Record<string, any>,
    language: 'javascript' | 'python'
  ): string {
    if (Object.keys(context).length === 0) return '';

    if (language === 'javascript') {
      return Object.entries(context)
        .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
        .join('\n');
    } else if (language === 'python') {
      return Object.entries(context)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join('\n');
    }

    return '';
  }

  /**
   * Extract variables from code to return in context
   */
  private extractContext(
    code: string,
    language: 'javascript' | 'python'
  ): Record<string, any> {
    // This is a simplified version - in production, you'd want proper parsing
    const context: Record<string, any> = {};

    if (language === 'javascript') {
      // Look for const/let/var declarations
      const varRegex = /(?:const|let|var)\s+(\w+)\s*=\s*([^;]+);/g;
      let match;
      while ((match = varRegex.exec(code)) !== null) {
        try {
          context[match[1]] = JSON.parse(match[2]);
        } catch {
          // If not valid JSON, store as string
          context[match[1]] = match[2].trim();
        }
      }
    }

    return context;
  }

  /**
   * Execute a simple expression and return the result
   */
  async evaluate(
    expression: string,
    language: 'javascript' | 'python' = 'javascript'
  ): Promise<any> {
    const code = language === 'javascript' 
      ? `const __result = ${expression}; __result`
      : `__result = ${expression}; __result`;
    
    const result = await this.executeCode(code, language);
    return result.success ? result.output : null;
  }

  /**
   * Test if the sandbox is working
   */
  async test(): Promise<boolean> {
    try {
      const jsResult = await this.executeMCPSandbox('2 + 2', 'javascript');
      const pyResult = await this.executeMCPSandbox('2 + 2', 'python');
      return jsResult.success && pyResult.success;
    } catch {
      return false;
    }
  }

  /**
   * Create a sandboxed function
   */
  createFunction(
    code: string,
    language: 'javascript' | 'python' = 'javascript'
  ): (...args: any[]) => Promise<any> {
    return async (...args: any[]) => {
      const argNames = Array.from({ length: args.length }, (_, i) => `arg${i}`);
      const context = Object.fromEntries(
        argNames.map((name, i) => [name, args[i]])
      );

      let funcCode: string;
      if (language === 'javascript') {
        funcCode = `
          const __func = ${code};
          const __result = __func(${argNames.join(', ')});
          __result;
        `;
      } else {
        funcCode = `
${code}
__result = func(${argNames.join(', ')})
__result
        `;
      }

      const result = await this.executeCode(funcCode, language, { context });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.output;
    };
  }

  /**
   * Get strategy recommendations for code execution
   */
  async getStrategyRecommendations(
    problemType: string,
    context: Record<string, any>
  ): Promise<any[]> {
    try {
      const result = await invoke('execute_mcp_tool', {
        tool: 'guru_wasm_sandbox',
        args: {
          action: 'get_recommendations',
          problem_type: problemType,
          context
        }
      });

      return (result as any).recommendations || [];
    } catch (error) {
      console.error('Failed to get strategy recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sandboxService = new SandboxService();