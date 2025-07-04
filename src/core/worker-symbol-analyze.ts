import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { SymbolNode, Parameter, SymbolType } from '../types/index.js';
import { LanguageManager } from '../parsers/language-manager.js';

// Initialize language manager for this worker
let languageManager: LanguageManager | null = null;

async function initializeLanguageManager() {
  if (!languageManager) {
    languageManager = new LanguageManager();
  }
  return languageManager;
}

// Real symbol extraction using the same logic as the main analysis
async function extractSymbols(filePath: string): Promise<SymbolNode[]> {
  try {
    const langManager = await initializeLanguageManager();
    
    // Read file content
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // Parse the file using the language manager
    const parseResult = await langManager.parseFile(filePath, content);
    
    if (!parseResult) {
      console.error(`[Worker] Failed to parse ${filePath}`);
      return [];
    }
    
    // Extract symbols using the same logic as SymbolGraphBuilder
    const symbols = await extractSymbolsFromParseResult(filePath, parseResult, path.dirname(filePath));
    
    return symbols || [];
  } catch (error) {
    console.error(`[Worker] Error extracting symbols from ${filePath}:`, error);
    return [];
  }
}

// Extract symbols from parse result (simplified version of SymbolGraphBuilder.extractSymbols)
async function extractSymbolsFromParseResult(
  filePath: string,
  parseResult: any,
  rootPath: string,
): Promise<SymbolNode[]> {
  const symbols: SymbolNode[] = [];
  const { tree, language, source } = parseResult;
  const dependencies: string[] = [];

  // Walk the AST and extract symbols
  const walk = (node: any, scope: string = "global") => {
    const nodeType = node.type;
    
    // Extract imports/requires first for dependency tracking
    extractImportsAndRequires(node, filePath, dependencies);
    
    // Extract different types of symbols based on language
    switch (language) {
      case "javascript":
      case "js":
      case "typescript":
      case "ts":
      case "tsx":
      case "jsx": {
        const jsSymbols = extractJavaScriptSymbols(node, filePath, source, rootPath, scope);
        symbols.push(...jsSymbols);
        break;
      }
      case "python":
      case "py": {
        const pySymbols = extractPythonSymbols(node, filePath, source, rootPath, scope);
        symbols.push(...pySymbols);
        break;
      }
    }
    
    // Recursively process child nodes
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        walk(child, scope);
      }
    }
  };

  walk(tree.rootNode);
  
  // Add dependency information to symbols
  symbols.forEach(symbol => {
    symbol.dependencies = dependencies;
  });
  
  return symbols;
}

// Extract imports and requires for dependency tracking
function extractImportsAndRequires(node: any, filePath: string, dependencies: string[]): void {
  const nodeType = node.type;
  
  switch (nodeType) {
    case "import_statement":
    case "import_declaration": {
      const importPath = extractImportPath(node);
      if (importPath) {
        const resolvedPath = resolveImportPath(importPath, path.dirname(filePath));
        if (resolvedPath && !dependencies.includes(resolvedPath)) {
          dependencies.push(resolvedPath);
        }
      }
      break;
    }
    case "call_expression": {
      // Handle require() calls
      if (node.text.includes('require(')) {
        const requireMatch = node.text.match(/require\(['"]([^'"]+)['"]\)/);
        if (requireMatch) {
          const requirePath = requireMatch[1];
          const resolvedPath = resolveImportPath(requirePath, path.dirname(filePath));
          if (resolvedPath && !dependencies.includes(resolvedPath)) {
            dependencies.push(resolvedPath);
          }
        }
      }
      break;
    }
  }
}

// Extract import path from import node
function extractImportPath(node: any): string | null {
  // Look for string literals in the import statement
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'string') {
      // Remove quotes
      return child.text.replace(/['"]/g, '');
    }
  }
  return null;
}

// Resolve import path to absolute file path
function resolveImportPath(importPath: string, fromDir: string): string | null {
  try {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolved = path.resolve(fromDir, importPath);
      
      // Try common file extensions
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (require('fs').existsSync(withExt)) {
          return withExt;
        }
      }
      
      return resolved;
    }
    
    // Handle absolute imports (simplified)
    if (importPath.startsWith('/')) {
      return importPath;
    }
    
    // Skip node_modules and other external dependencies for now
    return null;
  } catch (error) {
    return null;
  }
}

// Simplified JavaScript symbol extraction
function extractJavaScriptSymbols(
  node: any,
  filePath: string,
  source: string,
  rootPath: string,
  scope: string,
): SymbolNode[] {
  const symbols: SymbolNode[] = [];
  const nodeType = node.type;

  switch (nodeType) {
    case "function_declaration":
    case "method_definition":
    case "arrow_function": {
      const name = extractName(node);
      if (name) {
        symbols.push(createSymbol(name, 'function', node, filePath, source, rootPath));
      }
      break;
    }
    case "class_declaration": {
      const name = extractName(node);
      if (name) {
        symbols.push(createSymbol(name, 'class', node, filePath, source, rootPath));
      }
      break;
    }
    case "variable_declaration": {
      // Handle variable declarations
      const vars = extractVariableNames(node);
      for (const varName of vars) {
        symbols.push(createSymbol(varName, 'variable', node, filePath, source, rootPath));
      }
      break;
    }
    case "interface_declaration":
    case "type_alias_declaration": {
      const name = extractName(node);
      if (name) {
        symbols.push(createSymbol(name, 'type', node, filePath, source, rootPath));
      }
      break;
    }
  }

  return symbols;
}

// Simplified Python symbol extraction
function extractPythonSymbols(
  node: any,
  filePath: string,
  source: string,
  rootPath: string,
  scope: string,
): SymbolNode[] {
  const symbols: SymbolNode[] = [];
  const nodeType = node.type;

  switch (nodeType) {
    case "function_definition": {
      const name = extractName(node);
      if (name) {
        symbols.push(createSymbol(name, 'function', node, filePath, source, rootPath));
      }
      break;
    }
    case "class_definition": {
      const name = extractName(node);
      if (name) {
        symbols.push(createSymbol(name, 'class', node, filePath, source, rootPath));
      }
      break;
    }
    case "assignment": {
      const vars = extractVariableNames(node);
      for (const varName of vars) {
        symbols.push(createSymbol(varName, 'variable', node, filePath, source, rootPath));
      }
      break;
    }
  }

  return symbols;
}

// Helper functions
function extractName(node: any): string | null {
  // Try to find the name child node
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'identifier') {
      return child.text;
    }
  }
  return null;
}

function extractVariableNames(node: any): string[] {
  const names: string[] = [];
  
  // Walk through declarators or assignment targets
  const walk = (n: any) => {
    if (n.type === 'identifier') {
      names.push(n.text);
    }
    for (let i = 0; i < n.childCount; i++) {
      const child = n.child(i);
      if (child) {
        walk(child);
      }
    }
  };
  
  walk(node);
  return names;
}

function createSymbol(
  name: string,
  kind: string,
  node: any,
  filePath: string,
  source: string,
  rootPath: string,
): SymbolNode {
  const startPoint = node.startPosition;
  const endPoint = node.endPosition;
  
  // Extract references from the node
  const references = extractReferences(node, source);
  
  // Calculate symbol metadata
  const symbolText = source.slice(node.startIndex, node.endIndex);
  const complexity = calculateComplexity(symbolText, kind);
  
  return {
    id: `${path.relative(rootPath, filePath)}:${startPoint.row + 1}:${startPoint.column + 1}:${name}`,
    name,
    type: kind as SymbolType,
    location: {
      file: path.relative(rootPath, filePath),
      startLine: startPoint.row + 1,
      startColumn: startPoint.column + 1,
      endLine: endPoint.row + 1,
      endColumn: endPoint.column + 1,
    },
    scope: 'global', // TODO: Implement proper scope detection
    dependencies: [], // Will be populated later
    dependents: [], // Will be populated later
    metadata: {
      isAsync: isAsync(node),
      parameters: extractParameters(node),
      returnType: extractReturnType(node),
    }
  };
}

// Extract references from a node
function extractReferences(node: any, source: string): Array<{ type: string; target: string; location: string }> {
  const references: Array<{ type: string; target: string; location: string }> = [];
  
  // Walk through child nodes to find references
  const walk = (n: any) => {
    if (n.type === 'identifier' && n.parent !== node) {
      const ref = {
        type: 'reference',
        target: n.text,
        location: `${n.startPosition.row + 1}:${n.startPosition.column + 1}`
      };
      references.push(ref);
    }
    
    for (let i = 0; i < n.childCount; i++) {
      const child = n.child(i);
      if (child) {
        walk(child);
      }
    }
  };
  
  walk(node);
  return references;
}

// Calculate basic complexity metrics
function calculateComplexity(symbolText: string, kind: string): number {
  let complexity = 1; // Base complexity
  
  // Add complexity for control structures
  const controlStructures = ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch'];
  for (const structure of controlStructures) {
    const regex = new RegExp(`\\b${structure}\\b`, 'g');
    const matches = symbolText.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  // Add complexity for logical operators
  const logicalOperators = ['&&', '||', '??'];
  for (const operator of logicalOperators) {
    const regex = new RegExp(`\\${operator}`, 'g');
    const matches = symbolText.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

// Check if a symbol is exported
function isExported(node: any, source: string): boolean {
  // Simple check for export keywords
  const nodeText = source.slice(node.startIndex, node.endIndex);
  return nodeText.includes('export') || nodeText.includes('module.exports');
}

// Check if a function is async
function isAsync(node: any): boolean {
  // Check for async keyword in function declarations
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'async') {
      return true;
    }
  }
  return false;
}

// Extract parameters from function nodes
function extractParameters(node: any): Parameter[] {
  const parameters: Parameter[] = [];
  
  // Look for parameter lists
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && (child.type === 'formal_parameters' || child.type === 'parameters')) {
      extractParameterNames(child, parameters);
    }
  }
  
  return parameters;
}

// Extract parameter names from parameter list
function extractParameterNames(node: any, parameters: Parameter[]): void {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'identifier') {
      parameters.push({
        name: child.text,
        type: undefined,
        optional: false
      });
    } else if (child && child.type === 'parameter') {
      extractParameterNames(child, parameters);
    }
  }
}

// Extract return type information (simplified)
function extractReturnType(node: any): string | undefined {
  // Look for type annotations
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'type_annotation') {
      return child.text;
    }
  }
  return undefined;
}

if (parentPort) {
  parentPort.on('message', async (filePath: string) => {
    try {
      // Extract symbols using real logic
      const symbols = await extractSymbols(filePath);
      
      // Send back the result
      parentPort!.postMessage({ 
        filePath, 
        symbols,
        error: null 
      });
    } catch (error) {
      parentPort!.postMessage({ 
        filePath, 
        symbols: [],
        error: (error as Error).message 
      });
    }
  });
} 