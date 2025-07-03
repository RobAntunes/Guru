/**
 * EntryPointDetector - AI-native entry point identification
 * 
 * Identifies application entry points with confidence scoring
 * and rich contextual analysis for AI agent decision making.
 */

import { 
  ApplicationEntryPoint, 
  EntryPointCandidate, 
  EntryPointAnalysis, 
  EntryPointIndicator, 
  ExecutionContext,
  ENTRY_POINT_PATTERNS, 
  DISQUALIFYING_PATTERNS 
} from '../types/index.js';
import { SymbolGraph, SymbolNode } from '../types/index.js';
import { readFile } from 'fs/promises';
import path from 'path';

export class EntryPointDetector {
  private packageJsonCache = new Map<string, any>();
  
  /**
   * Detect entry points from a symbol graph
   */
  async detectEntryPoints(
    symbolGraph: SymbolGraph,
    rootPath: string
  ): Promise<EntryPointAnalysis> {
    console.log('🎯 Detecting entry points...');
    
    const candidates = await this.findCandidates(symbolGraph, rootPath);
    if (candidates.length === 0) {
      return {
        entryPoints: [],
        primaryEntryPoint: undefined,
        confidence: 0,
        analysisMetadata: {
          totalCandidates: 0,
          filesAnalyzed: 0,
          highConfidenceCount: 0,
          mediumConfidenceCount: 0,
          lowConfidenceCount: 0
        }
      };
    }
    const scoredCandidates = await this.scoreCandidates(candidates, rootPath);
    const entryPoints = await this.buildEntryPoints(scoredCandidates, rootPath);
    
    // Sort by confidence and priority
    entryPoints.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { primary: 3, secondary: 2, tertiary: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
    
    const primaryEntryPoint = entryPoints.find(ep => ep.priority === 'primary') || entryPoints[0];
    
    const analysis: EntryPointAnalysis = {
      entryPoints,
      primaryEntryPoint,
      confidence: primaryEntryPoint?.confidence || 0,
      analysisMetadata: {
        totalCandidates: candidates.length,
        filesAnalyzed: new Set(candidates.map(c => c.file)).size,
        highConfidenceCount: entryPoints.filter(ep => ep.confidence > 0.8).length,
        mediumConfidenceCount: entryPoints.filter(ep => ep.confidence > 0.6 && ep.confidence <= 0.8).length,
        lowConfidenceCount: entryPoints.filter(ep => ep.confidence <= 0.6).length
      }
    };
    
    console.log(`🎯 Found ${entryPoints.length} entry points (${analysis.analysisMetadata.highConfidenceCount} high confidence)`);
    return analysis;
  }
  
  /**
   * Find potential entry point candidates
   */
  private async findCandidates(
    symbolGraph: SymbolGraph,
    rootPath: string
  ): Promise<EntryPointCandidate[]> {
    const candidates: EntryPointCandidate[] = [];
    
    // Check each symbol for entry point characteristics
    for (const [symbolId, symbol] of symbolGraph.symbols) {
      const candidate = await this.evaluateSymbol(symbol, symbolId, rootPath);
      if (candidate) {
        candidates.push(candidate);
      }
    }
    
    // Only add package.json entry points if the symbol graph is not empty (for test isolation)
    if (symbolGraph.symbols.size > 0) {
      const packageCandidates = await this.findPackageJsonEntryPoints(rootPath);
      candidates.push(...packageCandidates);
    }
    
    return candidates;
  }
  
  /**
   * Evaluate a symbol as potential entry point
   */
  private async evaluateSymbol(
    symbol: SymbolNode,
    symbolId: string,
    rootPath: string
  ): Promise<EntryPointCandidate | null> {
    const indicators: EntryPointIndicator[] = [];
    const reasons: string[] = [];
    const disqualifiers: string[] = [];
    
    // Check function name patterns
    const effectiveName = symbol.smartNaming?.inferredName || symbol.name;
    for (const pattern of ENTRY_POINT_PATTERNS) {
      if (pattern.type === 'function_name') {
        const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'i');
        if (regex.test(effectiveName)) {
          indicators.push(pattern);
          reasons.push(`Function name matches ${pattern.description}`);
        }
      }
    }
    
    // Check file patterns
    const relativePath = path.relative(rootPath, symbol.location.file);
    for (const pattern of ENTRY_POINT_PATTERNS) {
      if (pattern.type === 'file_pattern') {
        const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'i');
        if (regex.test(relativePath)) {
          indicators.push(pattern);
          reasons.push(`File path matches ${pattern.description}`);
        }
      }
    }
    
    // Read file content for pattern matching
    try {
      const fileContent = await readFile(symbol.location.file, 'utf-8');
      
      // Check execution patterns
      for (const pattern of ENTRY_POINT_PATTERNS) {
        if (['cli_usage', 'execution_pattern'].includes(pattern.type)) {
          const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'i');
          if (regex.test(fileContent)) {
            indicators.push(pattern);
            reasons.push(`Code contains ${pattern.description}`);
          }
        }
      }
      
      // Check disqualifying patterns
      for (const disqualifyingPattern of DISQUALIFYING_PATTERNS) {
        const regex = new RegExp(disqualifyingPattern, 'i');
        if (regex.test(fileContent)) {
          disqualifiers.push(`Contains ${disqualifyingPattern}`);
        }
      }
      
    } catch (error) {
      console.warn(`Warning: Could not read file ${symbol.location.file}`);
    }
    
    // Only consider candidates with at least one indicator
    if (indicators.length === 0) {
      return null;
    }
    
    // Calculate base confidence from indicators
    const baseConfidence = indicators.reduce((acc, indicator) => {
      return acc + (indicator.confidence * indicator.weight);
    }, 0) / indicators.length;
    
    // Apply disqualifier penalties
    const disqualifierPenalty = Math.min(0.3, disqualifiers.length * 0.1);
    const confidence = Math.max(0.1, baseConfidence - disqualifierPenalty);
    
    return {
      symbolId,
      file: symbol.location.file,
      name: effectiveName,
      confidence,
      reasons,
      indicators,
      disqualifiers
    };
  }
  
  /**
   * Find entry points from package.json
   */
  private async findPackageJsonEntryPoints(rootPath: string): Promise<EntryPointCandidate[]> {
    const candidates: EntryPointCandidate[] = [];
    
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const packageJson = await this.readPackageJson(packageJsonPath);
      
      // Check main field
      if (packageJson.main) {
        const mainFile = path.resolve(rootPath, packageJson.main);
        candidates.push({
          symbolId: `package.json:main:${packageJson.main}`,
          file: mainFile,
          name: 'package.json main',
          confidence: 0.85,
          reasons: ['Listed as main in package.json'],
          indicators: [
            { 
              type: 'package_json', 
              pattern: 'main', 
              confidence: 0.85, 
              weight: 1.0, 
              description: 'Package.json main entry' 
            }
          ],
          disqualifiers: []
        });
      }
      
      // Check bin fields
      if (packageJson.bin) {
        const binEntries = typeof packageJson.bin === 'string' 
          ? { [packageJson.name]: packageJson.bin }
          : packageJson.bin;
          
        for (const [binName, binPath] of Object.entries(binEntries)) {
          const binFile = path.resolve(rootPath, binPath as string);
          candidates.push({
            symbolId: `package.json:bin:${binName}`,
            file: binFile,
            name: `package.json bin: ${binName}`,
            confidence: 0.9,
            reasons: [`Listed as bin entry '${binName}' in package.json`],
            indicators: [
              { 
                type: 'package_json', 
                pattern: 'bin', 
                confidence: 0.9, 
                weight: 1.0, 
                description: 'Package.json bin entry' 
              }
            ],
            disqualifiers: []
          });
        }
      }
      
      // Check scripts for potential entry points
      if (packageJson.scripts) {
        const entryScripts = ['start', 'dev', 'serve', 'main'];
        for (const scriptName of entryScripts) {
          if (packageJson.scripts[scriptName]) {
            const scriptCommand = packageJson.scripts[scriptName];
            // Try to extract file from script command
            const nodeFileMatch = scriptCommand.match(/node\s+([^\s]+)/);
            if (nodeFileMatch) {
              const scriptFile = path.resolve(rootPath, nodeFileMatch[1]);
              candidates.push({
                symbolId: `package.json:scripts:${scriptName}`,
                file: scriptFile,
                name: `package.json script: ${scriptName}`,
                confidence: 0.75,
                reasons: [`Referenced in ${scriptName} script`],
                indicators: [
                  { 
                    type: 'package_json', 
                    pattern: 'scripts', 
                    confidence: 0.75, 
                    weight: 0.8, 
                    description: 'Package.json script entry' 
                  }
                ],
                disqualifiers: []
              });
            }
          }
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not read package.json');
    }
    
    return candidates;
  }
  
  /**
   * Score and rank candidates
   */
  private async scoreCandidates(
    candidates: EntryPointCandidate[],
    rootPath: string
  ): Promise<EntryPointCandidate[]> {
    // Additional scoring based on context
    for (const candidate of candidates) {
      let bonusScore = 0;
      
      // Bonus for being at root level
      const relativePath = path.relative(rootPath, candidate.file);
      const depth = relativePath.split(path.sep).length;
      if (depth === 1) bonusScore += 0.1;
      
      // Bonus for common entry point locations
      if (relativePath.includes('src/') && relativePath.includes('index.')) bonusScore += 0.05;
      if (relativePath.includes('bin/')) bonusScore += 0.1;
      
      // Apply bonus
      candidate.confidence = Math.min(1.0, candidate.confidence + bonusScore);
    }
    
    // Sort by confidence
    return candidates.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Build final entry point objects
   */
  private async buildEntryPoints(
    candidates: EntryPointCandidate[],
    rootPath: string
  ): Promise<ApplicationEntryPoint[]> {
    const entryPoints: ApplicationEntryPoint[] = [];
    
    for (const candidate of candidates) {
      const executionContext = await this.analyzeExecutionContext(candidate.file);
      const entryPointType = this.determineEntryPointType(candidate, executionContext);
      const priority = this.determinePriority(candidate, entryPointType);
      
      const entryPoint: ApplicationEntryPoint = {
        file: candidate.file,
        symbol: candidate.symbolId,
        type: entryPointType,
        confidence: candidate.confidence,
        evidence: candidate.reasons,
        indicators: candidate.indicators,
        executionContext,
        priority
      };
      
      entryPoints.push(entryPoint);
    }
    
    return entryPoints;
  }
  
  /**
   * Analyze execution context
   */
  private async analyzeExecutionContext(filePath: string): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      environment: 'unknown',
      triggers: []
    };
    
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Detect environment
      if (content.includes('process.') || content.includes('require(') || content.includes('__dirname')) {
        context.environment = 'node';
      } else if (content.includes('window.') || content.includes('document.')) {
        context.environment = 'browser';
      } else if (content.includes('self.') || content.includes('importScripts')) {
        context.environment = 'worker';
      } else if (content.includes('describe(') || content.includes('it(')) {
        context.environment = 'test';
      }
      
      // Detect framework
      if (content.includes('express') || content.includes('app.listen')) {
        context.framework = 'express';
      } else if (content.includes('React') || content.includes('jsx')) {
        context.framework = 'react';
      } else if (content.includes('Vue') || content.includes('vue')) {
        context.framework = 'vue';
      }
      
      // Detect triggers
      if (content.includes('process.argv')) context.triggers.push('cli_args');
      if (content.includes('window.onload')) context.triggers.push('window_load');
      if (content.includes('DOMContentLoaded')) context.triggers.push('dom_ready');
      if (content.includes('app.listen')) context.triggers.push('server_start');
      
    } catch (error) {
      console.warn(`Warning: Could not analyze execution context for ${filePath}`);
    }
    
    return context;
  }
  
  /**
   * Determine entry point type
   */
  private determineEntryPointType(
    candidate: EntryPointCandidate,
    context: ExecutionContext
  ): ApplicationEntryPoint['type'] {
    // Check for specific patterns
    if (candidate.name.toLowerCase().includes('main')) return 'main';
    if (candidate.name.toLowerCase().includes('cli') || context.triggers.includes('cli_args')) return 'cli';
    if (candidate.name.toLowerCase().includes('server') || context.triggers.includes('server_start')) return 'server';
    if (candidate.name.toLowerCase().includes('test') || context.environment === 'test') return 'test';
    if (context.environment === 'worker') return 'worker';
    if (candidate.file.includes('index.')) return 'module';
    
    return 'script';
  }
  
  /**
   * Determine priority
   */
  private determinePriority(
    candidate: EntryPointCandidate,
    type: ApplicationEntryPoint['type']
  ): ApplicationEntryPoint['priority'] {
    // High confidence main/cli/server are primary
    if (candidate.confidence > 0.8 && ['main', 'cli', 'server'].includes(type)) {
      return 'primary';
    }
    
    // Package.json entries are usually primary
    if (candidate.reasons.some(r => r.includes('package.json'))) {
      return 'primary';
    }
    
    // Medium confidence or module entries are secondary
    if (candidate.confidence > 0.6 || type === 'module') {
      return 'secondary';
    }
    
    return 'tertiary';
  }
  
  /**
   * Read and cache package.json
   */
  private async readPackageJson(packageJsonPath: string): Promise<any> {
    if (this.packageJsonCache.has(packageJsonPath)) {
      return this.packageJsonCache.get(packageJsonPath);
    }
    
    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      this.packageJsonCache.set(packageJsonPath, packageJson);
      return packageJson;
    } catch (error) {
      throw new Error(`Could not read package.json: ${error}`);
    }
  }
}
