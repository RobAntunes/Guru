/**
 * SymbolGraphBuilder - Creates comprehensive symbol graphs using tree-sitter
 * 
 * This is the foundation of Guru's understanding - parsing code into
 * a rich graph of symbols and their relationships.
 */

import { SymbolGraph, SymbolNode, SymbolEdge, GraphMetadata, SymbolType, SourceLocation } from '../types/index.js';
import { languageManagerReady, ParseResult } from './language-manager.js';
import { SmartSymbolNamer } from '../intelligence/smart-symbol-namer.js';
import { EntryPointDetector } from '../intelligence/entry-point-detector.js';
import { CodeClusterer } from '../intelligence/code-clusterer.js';
import { readFile, readdir, stat } from 'fs/promises';
import path from 'node:path';
import Parser from 'tree-sitter';

console.error('[FS][DEBUG] TOP-LEVEL Guru symbol-graph.ts loaded!');

export interface BuildParams {
  path: string;
  language?: string;
  includeTests?: boolean;
}

export class SymbolGraphBuilder {
  
  /**
   * Tracks which files have been indexed for incremental/on-demand expansion
   */
  private indexedFiles: Set<string> = new Set();
  private indexedSymbols: Set<string> = new Set();
  private _currentGraph?: SymbolGraph;
  private smartNamer = new SmartSymbolNamer();
  private entryPointDetector = new EntryPointDetector();
  private codeClusterer = new CodeClusterer();

  /**
   * Main entry: Hybrid + Incremental symbol graph build
   * - Tries entry point tracing first
   * - Falls back to full scan if needed
   * - Supports on-demand expansion
   */
  async build(params: BuildParams & { expandFiles?: string[]; expandSymbols?: string[] }): Promise<SymbolGraph> {
    console.error(`🌳 Building symbol graph for ${params.path}`);
    const languageManager = await languageManagerReady;
    console.error(`[BUILD] Supported languages:`, languageManager.getSupportedLanguages());

    // 1. Recursively find all source files from the given path
    const allSourceFiles = await this.findSourceFiles(params.path, params.includeTests || false);
    console.error(`[BUILD] Total source files discovered from ${params.path}: ${allSourceFiles.length}`);
    if (allSourceFiles.length === 0) {
      console.error(`[BUILD] No source files found. Searched recursively from: ${params.path}`);
      return {
        symbols: new Map(),
        edges: [],
        metadata: {
          language: params.language || 'multi',
          rootPath: params.path,
          analyzedFiles: [],
          timestamp: new Date(),
          version: '0.1.0',
          coverage: 0,
          diagnostic: 'No source files found. Searched recursively from: ' + params.path + '. Specify a different root or check your project structure.'
        }
      };
    }

    // 2. Find likely entry files (heuristic)
    let entryFiles = await this.findLikelyEntryFiles(params.path);
    if (entryFiles.length === 0) {
      entryFiles = [];
    }
    if (params.expandFiles) {
      for (const f of params.expandFiles) {
        if (!entryFiles.includes(f)) entryFiles.push(f);
      }
    }

    // 3. Incremental expansion: only index files as needed
    let filesToIndex: string[] = [];
    if (entryFiles.length > 0) {
      filesToIndex = entryFiles.filter(f => !this.indexedFiles.has(f));
    } else {
      // If no entry points, index all discovered source files (or as many as needed for the query)
      filesToIndex = allSourceFiles.filter(f => !this.indexedFiles.has(f));
    }
    if (filesToIndex.length === 0 && this.indexedFiles.size > 0) {
      return this._currentGraph || { symbols: new Map(), edges: [], metadata: { language: params.language || 'multi', rootPath: params.path, analyzedFiles: Array.from(this.indexedFiles), timestamp: new Date(), version: '0.1.0', coverage: 0 } };
    }
    const symbols = this._currentGraph?.symbols || new Map<string, SymbolNode>();
    const edges = this._currentGraph?.edges || [];
    const analyzedFiles = new Set<string>(this._currentGraph?.metadata.analyzedFiles || []);
    for (const filePath of filesToIndex) {
      try {
        console.error(`[BUILD] Parsing file: ${filePath}`);
        const source = await readFile(filePath, 'utf-8');
        const parseResult = await languageManager.parseFile(filePath, source);
        if (parseResult) {
          console.error(`[BUILD] Detected language: ${parseResult.language} for ${filePath}`);
          const fileSymbols = await this.extractSymbols(filePath, parseResult, params.path);
          console.error(`[BUILD] Extracted ${fileSymbols.length} symbols from ${filePath}`);
          for (const symbol of fileSymbols) {
            if (!this.indexedSymbols.has(symbol.id)) {
              symbols.set(symbol.id, symbol);
              this.indexedSymbols.add(symbol.id);
            }
          }
          analyzedFiles.add(filePath);
          this.indexedFiles.add(filePath);
        } else {
          console.error(`[BUILD] Failed to parse ${filePath}`);
        }
      } catch (error) {
        console.error(`[BUILD] Error processing ${filePath}:`, error);
      }
    }
    const dependencyEdges = await this.buildDependencyEdges(symbols, Array.from(analyzedFiles));
    for (const edge of dependencyEdges) {
      if (!edges.find((e: SymbolEdge) => e.from === edge.from && e.to === edge.to && e.type === edge.type)) {
        edges.push(edge);
      }
    }
    if (params.expandSymbols) {
      for (const symbolId of params.expandSymbols) {
        const symbol = symbols.get(symbolId);
        if (symbol && symbol.location && !this.indexedFiles.has(symbol.location.file)) {
          const absPath = path.join(params.path, symbol.location.file);
          if (!this.indexedFiles.has(absPath)) {
            const source = await readFile(absPath, 'utf-8');
            const parseResult = await languageManager.parseFile(absPath, source);
            if (parseResult) {
              const fileSymbols = await this.extractSymbols(absPath, parseResult, params.path);
              for (const s of fileSymbols) {
                if (!this.indexedSymbols.has(s.id)) {
                  symbols.set(s.id, s);
                  this.indexedSymbols.add(s.id);
                }
              }
              analyzedFiles.add(absPath);
              this.indexedFiles.add(absPath);
            }
          }
        }
      }
    }
    const coverage = allSourceFiles.length > 0 ? this.indexedFiles.size / allSourceFiles.length : 1;
    const metadata: GraphMetadata = {
      language: params.language || 'multi',
      rootPath: params.path,
      analyzedFiles: Array.from(analyzedFiles),
      timestamp: new Date(),
      version: '0.1.0',
      coverage
    };
    this._currentGraph = { symbols, edges, metadata };
    
    // Detect entry points
    console.log('🎯 Detecting entry points...');
    const entryPointAnalysis = await this.entryPointDetector.detectEntryPoints(this._currentGraph, params.path);
    
    // Perform code clustering
    console.log('🧩 Analyzing code clusters...');
    const clusteringAnalysis = await this.codeClusterer.clusterSymbols(this._currentGraph);
    
    // Add analyses to metadata
    metadata.entryPoints = entryPointAnalysis;
    metadata.clustering = clusteringAnalysis;
    
    return this._currentGraph;
  }

  /**
   * Heuristic: Find likely entry files (main, index, cli, etc.)
   */
  private async findLikelyEntryFiles(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    const candidates = ['index.ts', 'index.js', 'main.ts', 'main.js', 'cli.ts', 'cli.js', 'app.ts', 'app.js'];
    for (const candidate of candidates) {
      const abs = path.join(rootPath, candidate);
      try {
        const stats = await stat(abs);
        if (stats.isFile()) files.push(abs);
      } catch {}
    }
    return files;
  }

  private async findSourceFiles(rootPath: string, includeTests: boolean): Promise<string[]> {
    console.error('[FS][DEBUG] Guru traversal debug ACTIVE! If you see this, the new code is running.');
    const files: string[] = [];
    let rootMissing = false;
    const projectRoot = path.resolve(rootPath);
    console.error(`[FS][DEBUG] Computed projectRoot: ${projectRoot}`);
    // Log the current working directory and root entries
    if (rootPath === '.' || rootPath === process.cwd()) {
      try {
        const cwd = process.cwd();
        console.error(`[FS][DEBUG] Current working directory: ${cwd}`);
        const rootEntries = await readdir(cwd);
        console.error(`[FS][DEBUG] Entries in root directory (${cwd}): ${rootEntries.join(', ')}`);
      } catch (err) {
        console.error(`[FS][DEBUG] Error reading root directory:`, err);
      }
    }
    const traverse = async (dir: string, isRoot = false) => {
      let entries: string[] = [];
      const absDir = path.resolve(dir);
      console.error(`[FS][DEBUG] Checking absDir: ${absDir} against projectRoot: ${projectRoot}`);
      if (!absDir.startsWith(projectRoot)) {
        console.error(`[FS][WARN] Skipping directory outside project root: ${absDir} (projectRoot: ${projectRoot})`);
        return;
      }
      try {
        entries = await readdir(dir);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          if (isRoot) {
            rootMissing = true;
            console.error(`[FS] Root directory missing: ${dir}`);
          } else {
            console.error(`[FS] Skipping missing directory: ${dir}`);
          }
        } else {
          console.error(`[FS] Error traversing ${dir}:`, error);
        }
        return; // Don't abort, just skip this directory
      }
      for (const entry of entries) {
        if (entry.startsWith('.')) {
          console.error(`[FS] Skipping hidden file or directory: ${entry}`);
          continue;
        }
        const fullPath = path.join(dir, entry);
        const absFullPath = path.resolve(fullPath);
        let stats;
        try {
          stats = await stat(fullPath);
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            console.error(`[FS] Skipping missing file or directory: ${fullPath}`);
            continue;
          } else {
            console.error(`[FS] Error stating ${fullPath}:`, err);
            continue;
          }
        }
        if (stats.isDirectory()) {
          console.error(`[FS][DEBUG] Checking absSubDir: ${absFullPath} against projectRoot: ${projectRoot}`);
          if (!absFullPath.startsWith(projectRoot)) {
            console.error(`[FS][WARN] Skipping subdirectory outside project root: ${absFullPath} (projectRoot: ${projectRoot})`);
            continue;
          }
          if (!['node_modules', 'dist', 'build', '.next', 'coverage'].includes(entry)) {
            if (includeTests || !entry.match(/^(test|tests|__tests__|spec|specs)$/i)) {
              console.error(`[FS] Recursing into subdirectory: ${absFullPath}`);
              await traverse(fullPath);
            } else {
              console.error(`[FS] Skipping test directory: ${fullPath}`);
            }
          } else {
            console.error(`[FS] Skipping excluded directory: ${fullPath}`);
          }
        } else if (stats.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          console.error(`[FS] Considering file: ${fullPath}`);
          if (['.js', '.jsx', '.ts', '.tsx', '.py', '.pyx', '.pyi'].includes(ext)) {
            if (includeTests || !entry.match(/\.(test|spec)\.(js|jsx|ts|tsx|py)$/i)) {
              files.push(fullPath);
              console.error(`[FS] Found source file: ${fullPath}`);
            } else {
              console.error(`[FS] Skipping test file: ${fullPath}`);
            }
          } else {
            console.error(`[FS] Skipping non-source file: ${fullPath}`);
          }
        }
      }
      console.error(`[FS] Files found so far: ${files.length}`);
    };
    await traverse(rootPath, true);
    if (rootMissing) {
      console.error(`[FS] Aborting: root directory does not exist: ${rootPath}`);
    }
    console.error(`[FS] Total source files found: ${files.length}`);
    return files;
  }

  private async extractSymbols(filePath: string, parseResult: ParseResult, rootPath: string): Promise<SymbolNode[]> {
    const symbols: SymbolNode[] = [];
    const { tree, language, source } = parseResult;
    
    // Walk the AST and extract symbols
    const walk = (node: Parser.SyntaxNode, scope: string = 'global') => {
      const nodeType = node.type;
      // Extract different types of symbols based on language
      switch (language) {
        case 'javascript':
        case 'typescript': {
          const jsSymbols = this.extractJavaScriptSymbols(node, filePath, source, rootPath, scope);
          if (jsSymbols.length > 0) {
          }
          symbols.push(...jsSymbols);
          break;
        }
        case 'python': {
          const pySymbols = this.extractPythonSymbols(node, filePath, source, rootPath, scope);
          if (pySymbols.length > 0) {
          }
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
    return symbols;
  }

  private extractJavaScriptSymbols(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode[] {
    const symbols: SymbolNode[] = [];
    const nodeType = node.type;
    
    switch (nodeType) {
      case 'function_declaration':
      case 'method_definition':
      case 'arrow_function': {
        const sym = this.createFunctionSymbol(node, filePath, source, rootPath, scope);
        symbols.push(sym);
        break;
      }
      
      case 'class_declaration': {
        const sym = this.createClassSymbol(node, filePath, source, rootPath, scope);
        symbols.push(sym);
        break;
      }
      
      case 'variable_declaration': {
        const vars = this.createVariableSymbols(node, filePath, source, rootPath, scope);
        symbols.push(...vars);
        break;
      }
      
      case 'interface_declaration':
      case 'type_alias_declaration': {
        const sym = this.createTypeSymbol(node, filePath, source, rootPath, scope);
        symbols.push(sym);
        break;
      }
    }
    
    return symbols;
  }

  private extractPythonSymbols(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode[] {
    const symbols: SymbolNode[] = [];
    const nodeType = node.type;
    
    switch (nodeType) {
      case 'function_definition': {
        const sym = this.createFunctionSymbol(node, filePath, source, rootPath, scope);
        symbols.push(sym);
        break;
      }
      
      case 'class_definition': {
        const sym = this.createClassSymbol(node, filePath, source, rootPath, scope);
        symbols.push(sym);
        break;
      }
      
      case 'assignment': {
        const vars = this.createVariableSymbols(node, filePath, source, rootPath, scope);
        symbols.push(...vars);
        break;
      }
    }
    
    return symbols;
  }

  private createFunctionSymbol(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode {
    const name = this.extractName(node) || 'anonymous';
    const location = this.createLocation(node, filePath, rootPath);
    
    // Create base symbol
    const symbol: SymbolNode = {
      id: `${path.relative(rootPath, filePath)}:${name}:${location.startLine}`,
      name,
      type: 'function',
      location,
      scope,
      dependencies: [],
      dependents: [],
      metadata: {
        accessibility: 'public',
        parameters: this.extractParameters(node),
        docstring: this.extractDocstring(node, source)
      }
    };
    
    // Enhance with smart naming if needed
    if (name === 'anonymous' || this.shouldEnhanceNaming(name)) {
      const smartSymbol = this.smartNamer.enhanceSymbol(symbol, node, source, new Map());
      symbol.smartNaming = {
        inferredName: smartSymbol.inferredName,
        confidence: smartSymbol.confidence,
        context: smartSymbol.context || {},
        originalName: smartSymbol.originalName
      };
      // Update the symbol ID if it was anonymous
      if (name === 'anonymous') {
        symbol.id = smartSymbol.id;
      }
    }
    
    return symbol;
  }

  private createClassSymbol(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode {
    const name = this.extractName(node) || 'AnonymousClass';
    const location = this.createLocation(node, filePath, rootPath);
    return {
      id: `${path.relative(rootPath, filePath)}:${name}:${location.startLine}`,
      name,
      type: 'class',
      location,
      scope,
      dependencies: [],
      dependents: [],
      metadata: {
        accessibility: 'public',
        docstring: this.extractDocstring(node, source)
      }
    };
  }

  private createVariableSymbols(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode[] {
    const symbols: SymbolNode[] = [];
    // JS/TS: variable_declaration, Python: assignment
    // For JS/TS, look for variable declarators
    if (node.type === 'variable_declaration') {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'variable_declarator') {
          const idNode = child.childForFieldName('name') || child.child(0);
          if (idNode) {
            const name = idNode.text;
            const location = this.createLocation(child, filePath, rootPath);
            symbols.push({
              id: `${path.relative(rootPath, filePath)}:${name}:${location.startLine}`,
              name,
              type: 'variable',
              location,
              scope,
              dependencies: [],
              dependents: [],
              metadata: {
                accessibility: 'public'
              }
            });
          }
        }
      }
    }
    // For Python, look for assignment targets
    if (node.type === 'assignment') {
      const left = node.child(0);
      if (left && left.type === 'identifier') {
        const name = left.text;
        const location = this.createLocation(left, filePath, rootPath);
        symbols.push({
          id: `${path.relative(rootPath, filePath)}:${name}:${location.startLine}`,
          name,
          type: 'variable',
          location,
          scope,
          dependencies: [],
          dependents: [],
          metadata: {
            accessibility: 'public'
          }
        });
      }
    }
    return symbols;
  }

  private createTypeSymbol(
    node: Parser.SyntaxNode, 
    filePath: string, 
    source: string, 
    rootPath: string, 
    scope: string
  ): SymbolNode {
    const name = this.extractName(node) || 'AnonymousType';
    const location = this.createLocation(node, filePath, rootPath);
    return {
      id: `${path.relative(rootPath, filePath)}:${name}:${location.startLine}`,
      name,
      type: 'type',
      location,
      scope,
      dependencies: [],
      dependents: [],
      metadata: {
        accessibility: 'public'
      }
    };
  }

  private extractName(node: Parser.SyntaxNode): string | null {
    // Look for name child node, or search deeper for identifier
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'identifier') {
        return child.text;
      }
      // Search one level deeper
      if (child) {
        for (let j = 0; j < child.childCount; j++) {
          const grandchild = child.child(j);
          if (grandchild && grandchild.type === 'identifier') {
            return grandchild.text;
          }
        }
      }
    }
    return null;
  }

  private extractParameters(node: Parser.SyntaxNode): any[] {
    // Handles both JS/TS and Python
    let params: string[] = [];
    // Try to find a child node named 'parameters'
    let paramNode = null;
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'parameters') {
        paramNode = child;
        break;
      }
      // Python: sometimes parameters are a field
      if (child && child.type === 'parameter_list') {
        paramNode = child;
        break;
      }
    }
    if (paramNode) {
      for (let i = 0; i < paramNode.childCount; i++) {
        const p = paramNode.child(i);
        if (p && (p.type === 'identifier' || p.type === 'required_parameter' || p.type === 'default_parameter')) {
          // JS/TS: identifier; Python: required_parameter/default_parameter
          if (p.type === 'identifier') {
            params.push(p.text);
          } else {
            // Python: parameter node may have identifier as child
            for (let j = 0; j < p.childCount; j++) {
              const id = p.child(j);
              if (id && id.type === 'identifier') {
                params.push(id.text);
              }
            }
          }
        }
      }
    }
    return params;
  }

  private extractDocstring(node: Parser.SyntaxNode, source: string): string | undefined {
    // TODO: Extract comments/docstrings near the node
    return undefined;
  }

  private createLocation(node: Parser.SyntaxNode, filePath: string, rootPath: string): SourceLocation {
    const relativePath = path.relative(process.cwd(), filePath);
    return {
      file: relativePath,
      startLine: node.startPosition.row + 1,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row + 1,
      endColumn: node.endPosition.column
    };
  }

  private async buildDependencyEdges(
    symbols: Map<string, SymbolNode>, 
    analyzedFiles: string[]
  ): Promise<SymbolEdge[]> {
    const edges: SymbolEdge[] = [];
    
    console.error(`🔗 Building dependency edges for ${analyzedFiles.length} files...`);
    
    // Re-parse files to analyze dependencies
    for (const filePath of analyzedFiles) {
      try {
        const source = await readFile(filePath, 'utf-8');
        const languageManager = await languageManagerReady;
        const parseResult = await languageManager.parseFile(filePath, source);
        
        if (parseResult) {
          const fileEdges = await this.extractDependencyEdges(
            filePath, 
            parseResult, 
            symbols,
            source
          );
          edges.push(...fileEdges);
        }
      } catch (error) {
        console.error(`⚠️ Failed to analyze dependencies for ${filePath}:`, error);
      }
    }
    
    // Update symbol dependency lists for AI consumption
    this.populateSymbolDependencies(symbols, edges);
    
    console.error(`🔗 Built ${edges.length} dependency edges`);
    return edges;
  }

  private async extractDependencyEdges(
    filePath: string,
    parseResult: ParseResult,
    allSymbols: Map<string, SymbolNode>,
    source: string
  ): Promise<SymbolEdge[]> {
    const edges: SymbolEdge[] = [];
    const { tree, language } = parseResult;
    
    // AI-optimized: Create a lookup map for fast symbol resolution
    const symbolLookup = this.createSymbolLookup(allSymbols, filePath);
    
    const walk = (node: Parser.SyntaxNode, currentScope?: string) => {
      switch (language) {
        case 'javascript':
        case 'typescript':
          edges.push(...this.extractJavaScriptDependencies(
            node, filePath, allSymbols, symbolLookup, source, currentScope
          ));
          break;
        case 'python':
          edges.push(...this.extractPythonDependencies(
            node, filePath, allSymbols, symbolLookup, source, currentScope
          ));
          break;
      }
      
      // Recursively process children
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          walk(child, currentScope);
        }
      }
    };
    
    walk(tree.rootNode);
    return edges;
  }

  private createSymbolLookup(allSymbols: Map<string, SymbolNode>, currentFile: string): Map<string, string[]> {
    const lookup = new Map<string, string[]>();
    
    for (const [id, symbol] of allSymbols) {
      const name = symbol.name;
      if (!lookup.has(name)) {
        lookup.set(name, []);
      }
      lookup.get(name)!.push(id);
    }
    
    return lookup;
  }

  private extractJavaScriptDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string,
    currentScope?: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    const nodeType = node.type;
    
    switch (nodeType) {
      case 'import_statement':
      case 'import_clause':
        edges.push(...this.extractImportDependencies(node, filePath, allSymbols, source));
        break;
        
      case 'call_expression':
        edges.push(...this.extractCallDependencies(node, filePath, allSymbols, symbolLookup, source));
        break;
        
      case 'member_expression':
        edges.push(...this.extractMemberDependencies(node, filePath, allSymbols, symbolLookup, source));
        break;
        
      case 'identifier':
        edges.push(...this.extractVariableReferences(node, filePath, allSymbols, symbolLookup, source));
        break;
        
      case 'new_expression':
        edges.push(...this.extractConstructorDependencies(node, filePath, allSymbols, symbolLookup, source));
        break;
    }
    
    return edges;
  }

  private extractPythonDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string,
    currentScope?: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    const nodeType = node.type;
    
    switch (nodeType) {
      case 'import_statement':
      case 'import_from_statement':
        edges.push(...this.extractImportDependencies(node, filePath, allSymbols, source));
        break;
        
      case 'call':
        edges.push(...this.extractCallDependencies(node, filePath, allSymbols, symbolLookup, source));
        break;
        
      case 'attribute':
        edges.push(...this.extractMemberDependencies(node, filePath, allSymbols, symbolLookup, source));
        break;
        
      case 'identifier':
        edges.push(...this.extractVariableReferences(node, filePath, allSymbols, symbolLookup, source));
        break;
    }
    
    return edges;
  }

  private extractImportDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    source: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    // AI-focused: Import relationships are critical for understanding module structure
    
    const importText = node.text;
    const importNames = this.parseImportNames(importText);
    
    for (const importName of importNames) {
      // Find the importing symbol in current file
      const fromSymbolId = this.findSymbolInFile(importName, filePath, allSymbols);
      if (fromSymbolId) {
        // Create import edge (AI models love explicit import tracking)
        edges.push({
          from: fromSymbolId,
          to: `external:${importName}`, // External dependency marker
          type: 'imports',
          weight: 1.0 // High confidence for explicit imports
        });
      }
    }
    
    return edges;
  }

  private extractCallDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    
    // Find the function being called
    const calledFunction = this.extractCallTarget(node);
    if (!calledFunction) return edges;
    
    // Find caller context (which function/scope is making this call)
    const callerSymbol = this.findContainingSymbol(node, filePath, allSymbols);
    if (!callerSymbol) return edges;
    
    // Resolve the called function symbol
    const targetSymbols = symbolLookup.get(calledFunction) || [];
    
    for (const targetId of targetSymbols) {
      edges.push({
        from: callerSymbol,
        to: targetId,
        type: 'calls',
        weight: 0.9 // High confidence for direct calls
      });
    }
    
    return edges;
  }

  private extractMemberDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    
    // AI-focused: Member access patterns reveal object relationships
    const memberAccess = this.extractMemberAccess(node);
    if (!memberAccess) return edges;
    
    const { object, property } = memberAccess;
    const callerSymbol = this.findContainingSymbol(node, filePath, allSymbols);
    
    if (callerSymbol) {
      // Object usage
      const objectSymbols = symbolLookup.get(object) || [];
      for (const objectId of objectSymbols) {
        edges.push({
          from: callerSymbol,
          to: objectId,
          type: 'uses',
          weight: 0.7 // Medium confidence for member access
        });
      }
    }
    
    return edges;
  }

  private extractVariableReferences(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    
    // AI-optimized: Only track meaningful variable references, not noise
    if (this.isNoiseIdentifier(node.text)) return edges;
    
    const varName = node.text;
    const callerSymbol = this.findContainingSymbol(node, filePath, allSymbols);
    
    if (callerSymbol) {
      const referencedSymbols = symbolLookup.get(varName) || [];
      for (const refId of referencedSymbols) {
        if (refId !== callerSymbol) { // Don't self-reference
          edges.push({
            from: callerSymbol,
            to: refId,
            type: 'references',
            weight: 0.5 // Lower confidence for variable refs
          });
        }
      }
    }
    
    return edges;
  }

  private extractConstructorDependencies(
    node: Parser.SyntaxNode,
    filePath: string,
    allSymbols: Map<string, SymbolNode>,
    symbolLookup: Map<string, string[]>,
    source: string
  ): SymbolEdge[] {
    const edges: SymbolEdge[] = [];
    
    const constructorTarget = this.extractConstructorTarget(node);
    if (!constructorTarget) return edges;
    
    const callerSymbol = this.findContainingSymbol(node, filePath, allSymbols);
    if (!callerSymbol) return edges;
    
    const targetSymbols = symbolLookup.get(constructorTarget) || [];
    for (const targetId of targetSymbols) {
      edges.push({
        from: callerSymbol,
        to: targetId,
        type: 'uses', // Constructor usage
        weight: 0.8
      });
    }
    
    return edges;
  }

  private populateSymbolDependencies(symbols: Map<string, SymbolNode>, edges: SymbolEdge[]): void {
    // AI-critical: Populate bidirectional dependency lists for fast traversal
    for (const edge of edges) {
      const fromSymbol = symbols.get(edge.from);
      const toSymbol = symbols.get(edge.to);
      
      if (fromSymbol && !fromSymbol.dependencies.includes(edge.to)) {
        fromSymbol.dependencies.push(edge.to);
      }
      
      if (toSymbol && !toSymbol.dependents.includes(edge.from)) {
        toSymbol.dependents.push(edge.from);
      }
    }
  }

  // Helper methods for dependency extraction
  private parseImportNames(importText: string): string[] {
    // Simple regex-based import parsing (could be enhanced)
    const matches = importText.match(/import\s+[{]?([^}]+)[}]?\s+from|from\s+['"]([^'"]+)/g);
    return matches?.map(m => m.trim()) || [];
  }

  private extractCallTarget(node: Parser.SyntaxNode): string | null {
    // Find the function name in call expression
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && (child.type === 'identifier' || child.type === 'member_expression')) {
        return child.text;
      }
    }
    return null;
  }

  private extractMemberAccess(node: Parser.SyntaxNode): { object: string; property: string } | null {
    // Parse member expressions like obj.method or obj.prop
    const text = node.text;
    const dotIndex = text.indexOf('.');
    if (dotIndex > 0) {
      return {
        object: text.substring(0, dotIndex),
        property: text.substring(dotIndex + 1)
      };
    }
    return null;
  }

  private extractConstructorTarget(node: Parser.SyntaxNode): string | null {
    // Extract class name from 'new ClassName()'
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'identifier') {
        return child.text;
      }
    }
    return null;
  }

  private findContainingSymbol(node: Parser.SyntaxNode, filePath: string, allSymbols: Map<string, SymbolNode>): string | null {
    // Walk up the AST to find the containing function/class/scope
    let current = node.parent;
    while (current) {
      // Look for function or class declarations
      if (['function_declaration', 'method_definition', 'class_declaration', 'arrow_function'].includes(current.type)) {
        const symbolName = this.extractName(current);
        if (symbolName) {
          const relativePath = path.relative(process.cwd(), filePath);
          for (const [id, symbol] of allSymbols) {
            if (symbol.name === symbolName && symbol.location.file.includes(relativePath)) {
              return id;
            }
          }
        }
      }
      current = current.parent;
    }
    return null;
  }

  private findSymbolInFile(name: string, filePath: string, allSymbols: Map<string, SymbolNode>): string | null {
    const relativePath = path.relative(process.cwd(), filePath);
    for (const [id, symbol] of allSymbols) {
      if (symbol.name === name && symbol.location.file.includes(relativePath)) {
        return id;
      }
    }
    return null;
  }

  private isNoiseIdentifier(text: string): boolean {
    // AI-optimized: Filter out common noise words that don't represent meaningful dependencies
    const noiseWords = new Set([
      'i', 'j', 'k', 'x', 'y', 'z', 'a', 'b', 'c',
      'if', 'else', 'for', 'while', 'return', 'var', 'let', 'const',
      'true', 'false', 'null', 'undefined', 'this', 'super'
    ]);
    return noiseWords.has(text.toLowerCase()) || text.length < 2;
  }

  private shouldEnhanceNaming(name: string): boolean {
    // Always enhance anonymous symbols
    if (name === 'anonymous') return true;
    
    // Enhance generic names that don't provide much semantic meaning
    const genericNames = new Set([
      'func', 'function', 'method', 'callback', 'handler', 
      'temp', 'tmp', 'fn', 'cb', 'f', 'test'
    ]);
    
    return genericNames.has(name.toLowerCase()) || name.length < 3;
  }
}
