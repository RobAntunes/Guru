/**
 * Entry Point Detection Types - AI-native entry point identification
 */

export interface ApplicationEntryPoint {
  file: string;
  symbol?: string;
  type: 'main' | 'script' | 'module' | 'test' | 'cli' | 'server' | 'worker';
  confidence: number;
  evidence: string[];
  indicators: EntryPointIndicator[];
  executionContext: ExecutionContext;
  priority: 'primary' | 'secondary' | 'tertiary';
}

export interface EntryPointIndicator {
  type: 'function_name' | 'file_pattern' | 'package_json' | 'cli_usage' | 'imports' | 'exports' | 'execution_pattern';
  pattern: RegExp | string;
  confidence: number;
  weight: number;
  description: string;
}

export interface ExecutionContext {
  environment: 'node' | 'browser' | 'worker' | 'test' | 'unknown';
  framework?: string;  // express, react, vue, etc.
  runtime?: string;    // nodejs, deno, browser
  triggers: string[];  // process.argv, window.onload, etc.
}

export interface EntryPointCandidate {
  symbolId: string;
  file: string;
  name: string;
  confidence: number;
  reasons: string[];
  indicators: EntryPointIndicator[];
  disqualifiers: string[];
}

// High-confidence entry point patterns
export const ENTRY_POINT_PATTERNS: EntryPointIndicator[] = [
  // Function name patterns
  { type: 'function_name', pattern: /^main$/i, confidence: 0.95, weight: 1.0, description: 'Function named main' },
  { type: 'function_name', pattern: /^start$/i, confidence: 0.9, weight: 0.9, description: 'Function named start' },
  { type: 'function_name', pattern: /^init$/i, confidence: 0.85, weight: 0.8, description: 'Function named init' },
  { type: 'function_name', pattern: /^run$/i, confidence: 0.8, weight: 0.8, description: 'Function named run' },
  { type: 'function_name', pattern: /^bootstrap$/i, confidence: 0.8, weight: 0.7, description: 'Function named bootstrap' },
  { type: 'function_name', pattern: /^launch$/i, confidence: 0.75, weight: 0.7, description: 'Function named launch' },
  { type: 'function_name', pattern: /^app$/i, confidence: 0.7, weight: 0.6, description: 'Function named app' },
  
  // File pattern indicators
  { type: 'file_pattern', pattern: /index\.(js|ts|jsx|tsx)$/i, confidence: 0.85, weight: 0.8, description: 'Index file' },
  { type: 'file_pattern', pattern: /main\.(js|ts|jsx|tsx)$/i, confidence: 0.9, weight: 0.9, description: 'Main file' },
  { type: 'file_pattern', pattern: /app\.(js|ts|jsx|tsx)$/i, confidence: 0.8, weight: 0.8, description: 'App file' },
  { type: 'file_pattern', pattern: /server\.(js|ts)$/i, confidence: 0.8, weight: 0.8, description: 'Server file' },
  { type: 'file_pattern', pattern: /cli\.(js|ts)$/i, confidence: 0.85, weight: 0.8, description: 'CLI file' },
  { type: 'file_pattern', pattern: /bin\/.*\.(js|ts)$/i, confidence: 0.8, weight: 0.7, description: 'Binary file' },
  
  // CLI usage patterns
  { type: 'cli_usage', pattern: /process\.argv/i, confidence: 0.9, weight: 0.9, description: 'Command line argument processing' },
  { type: 'cli_usage', pattern: /commander\./i, confidence: 0.85, weight: 0.8, description: 'Commander.js usage' },
  { type: 'cli_usage', pattern: /yargs\./i, confidence: 0.85, weight: 0.8, description: 'Yargs usage' },
  { type: 'cli_usage', pattern: /minimist\(/i, confidence: 0.8, weight: 0.7, description: 'Minimist usage' },
  
  // Server patterns
  { type: 'execution_pattern', pattern: /app\.listen\(/i, confidence: 0.9, weight: 0.9, description: 'Express server listen' },
  { type: 'execution_pattern', pattern: /server\.listen\(/i, confidence: 0.85, weight: 0.8, description: 'HTTP server listen' },
  { type: 'execution_pattern', pattern: /createServer\(/i, confidence: 0.8, weight: 0.8, description: 'HTTP server creation' },
  
  // Module patterns
  { type: 'execution_pattern', pattern: /if\s*\(\s*require\.main\s*===\s*module\s*\)/i, confidence: 0.95, weight: 1.0, description: 'Main module check' },
  { type: 'execution_pattern', pattern: /if\s*\(\s*import\.meta\.main\s*\)/i, confidence: 0.9, weight: 0.9, description: 'ES module main check' },
  
  // Browser patterns
  { type: 'execution_pattern', pattern: /window\.onload/i, confidence: 0.8, weight: 0.7, description: 'Window onload handler' },
  { type: 'execution_pattern', pattern: /document\.addEventListener\s*\(\s*['"](DOMContentLoaded|load)['"]/i, confidence: 0.8, weight: 0.8, description: 'DOM ready handler' },
  { type: 'execution_pattern', pattern: /document\.ready/i, confidence: 0.75, weight: 0.7, description: 'jQuery ready handler' },
  
  // Test patterns (lower confidence for entry points)
  { type: 'execution_pattern', pattern: /describe\s*\(/i, confidence: 0.3, weight: 0.3, description: 'Test suite (not primary entry)' },
  { type: 'execution_pattern', pattern: /it\s*\(/i, confidence: 0.2, weight: 0.2, description: 'Test case (not primary entry)' },
  { type: 'execution_pattern', pattern: /test\s*\(/i, confidence: 0.25, weight: 0.25, description: 'Test function (not primary entry)' },
];

// Disqualifying patterns that reduce entry point confidence
export const DISQUALIFYING_PATTERNS: string[] = [
  'export\\s+(?:default\\s+)?(?:function|class|const|let|var)',  // Exported items are usually libraries
  'module\\.exports\\s*=',  // Module exports indicate library code
  'import\\s+.*\\s+from',   // Files with many imports might be library code
  '\\.test\\.',             // Test files
  '\\.spec\\.',             // Spec files
  'describe\\s*\\(',        // Test frameworks
  'it\\s*\\(',              // Test frameworks
];

export interface EntryPointAnalysis {
  entryPoints: ApplicationEntryPoint[];
  primaryEntryPoint?: ApplicationEntryPoint;
  confidence: number;
  analysisMetadata: {
    totalCandidates: number;
    filesAnalyzed: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
  };
}
