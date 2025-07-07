/**
 * Guru Integration for Living Task Forest
 * Connects LTF with Guru's code intelligence systems
 */

import { 
  ProjectInsight,
  ProjectGoal,
  CodeAnalysis,
  FileAnalysis,
  SymbolAnalysis,
  CodeIssue,
  PatternInstance,
  CodeMetrics,
  Opportunity,
  Evidence
} from '../discovery/discovery-engine.js';
import { TaskForest } from '../ecosystem/task-forest.js';
import { GuruEnhanced } from '../../core/guru-enhanced.js';
import { PatternDetector } from '../../intelligence/pattern-detector.js';
import { ComplexityAnalyzer } from '../../intelligence/performance-analyzer.js';
import { ChangeImpactAnalyzer } from '../../intelligence/change-impact-analyzer.js';
import { Logger } from '../../logging/logger.js';
import { HarmonicAnalysisEngine } from '../../harmonic-intelligence/core/harmonic-analysis-engine.js';
import path from 'path';

/**
 * Maps Guru analysis to LTF insights
 */
export class GuruToLTFMapper {
  private logger = Logger.getInstance();
  
  /**
   * Convert Guru file analysis to LTF format
   */
  mapFileAnalysis(guruFile: any): FileAnalysis {
    return {
      path: guruFile.path,
      language: guruFile.language || 'typescript',
      size: guruFile.content?.length || 0,
      complexity: guruFile.complexity?.cyclomatic || 0,
      issues: []
    };
  }
  
  /**
   * Convert Guru symbol to LTF format
   */
  mapSymbolAnalysis(symbol: any): SymbolAnalysis {
    return {
      name: symbol.name,
      type: this.mapSymbolType(symbol.type),
      file: symbol.filePath,
      complexity: symbol.complexity || 0,
      usage: symbol.references?.length || 0,
      dependencies: symbol.dependencies || []
    };
  }
  
  /**
   * Convert Guru pattern to LTF pattern instance
   */
  mapPatternInstance(pattern: any): PatternInstance {
    return {
      pattern: pattern.type,
      instances: pattern.instances.map((i: any) => ({
        file: i.filePath,
        startLine: i.startLine,
        endLine: i.endLine,
        symbols: [i.symbol]
      })),
      quality: pattern.confidence || 0.5
    };
  }
  
  /**
   * Convert complexity issues to insights
   */
  complexityToInsight(file: string, complexity: any): ProjectInsight | null {
    if (complexity.cyclomatic > 10) {
      return {
        id: `insight_complexity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'complexity_issue',
        discovery: `High complexity detected in ${path.basename(file)} (cyclomatic: ${complexity.cyclomatic})`,
        evidence: [{
          type: 'metric',
          description: `Cyclomatic complexity: ${complexity.cyclomatic}`,
          strength: Math.min(1, complexity.cyclomatic / 20),
          data: { file, complexity }
        }],
        confidence: 0.9,
        timestamp: Date.now(),
        source: 'complexity_analyzer'
      };
    }
    return null;
  }
  
  /**
   * Convert duplication to insight
   */
  duplicationToInsight(duplication: any): ProjectInsight {
    return {
      id: `insight_duplication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'code_duplication',
      discovery: `Code duplication found: ${duplication.instances.length} instances of ${duplication.lineCount} lines`,
      evidence: duplication.instances.map((i: any) => ({
        type: 'pattern',
        description: `Duplicate in ${path.basename(i.file)}:${i.startLine}-${i.endLine}`,
        strength: 0.8,
        data: i
      })),
      confidence: 1.0,
      timestamp: Date.now(),
      source: 'duplication_detector'
    };
  }
  
  /**
   * Convert architectural issue to insight
   */
  architectureToInsight(issue: any): ProjectInsight {
    return {
      id: `insight_arch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'architectural_issue',
      discovery: issue.description,
      evidence: [{
        type: 'dependency',
        description: issue.details || issue.description,
        strength: issue.severity === 'high' ? 0.9 : 0.6,
        data: issue
      }],
      confidence: 0.8,
      timestamp: Date.now(),
      source: 'architecture_analyzer'
    };
  }
  
  /**
   * Convert harmonic pattern to insight
   */
  harmonicPatternToInsight(pattern: any): ProjectInsight {
    return {
      id: `insight_harmonic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'harmonic_pattern',
      discovery: `${pattern.type} pattern detected with ${(pattern.confidence * 100).toFixed(0)}% confidence`,
      evidence: [{
        type: 'pattern',
        description: pattern.description || `${pattern.type} pattern instance`,
        strength: pattern.confidence,
        data: pattern
      }],
      confidence: pattern.confidence,
      timestamp: Date.now(),
      source: 'harmonic_intelligence'
    };
  }
  
  private mapSymbolType(guruType: string): 'class' | 'function' | 'interface' | 'type' | 'variable' {
    const typeMap: Record<string, any> = {
      'Class': 'class',
      'Function': 'function',
      'Interface': 'interface',
      'TypeAlias': 'type',
      'Variable': 'variable',
      'Method': 'function'
    };
    return typeMap[guruType] || 'variable';
  }
}

/**
 * Enhanced Discovery Engine with Guru Integration
 */
export class GuruDiscoveryEngine {
  private guru: GuruEnhanced;
  private mapper: GuruToLTFMapper;
  private logger = Logger.getInstance();
  private harmonicEngine?: HarmonicAnalysisEngine;
  
  constructor(guru: GuruEnhanced) {
    this.guru = guru;
    this.mapper = new GuruToLTFMapper();
  }
  
  /**
   * Enable harmonic intelligence integration
   */
  enableHarmonicIntelligence(engine: HarmonicAnalysisEngine): void {
    this.harmonicEngine = engine;
    this.logger.info('🎵 Harmonic Intelligence enabled for LTF');
  }
  
  /**
   * Analyze project using Guru and generate insights
   */
  async analyzeProject(projectPath: string): Promise<{
    analysis: CodeAnalysis;
    insights: ProjectInsight[];
  }> {
    this.logger.info(`🔍 Analyzing project with Enhanced Guru: ${projectPath}`);
    
    // Analyze codebase with enhanced Guru (flow + type analysis)
    const guruAnalysis = await this.guru.analyzeCodebaseEnhanced(projectPath, {
      enableFlowAnalysis: true,
      enableTypeAnalysis: true,
      enableHarmonicEnrichment: true
    });
    
    // Initialize detectors
    const patternDetector = new PatternDetector();
    // TODO: Add more analyzers when available
    // const complexityAnalyzer = new ComplexityAnalyzer();
    // const duplicationDetector = new DuplicationDetector();
    // const architectureAnalyzer = new ArchitectureAnalyzer();
    
    const insights: ProjectInsight[] = [];
    const fileAnalyses: FileAnalysis[] = [];
    const symbolAnalyses: SymbolAnalysis[] = [];
    const patternInstances: PatternInstance[] = [];
    
    // Process symbol graph from Guru analysis
    // Note: Guru now returns simplified results with just symbolGraph
    // TODO: Process files when available in Guru results
    
    // Process symbols from symbol graph
    if (guruAnalysis.symbolGraph && guruAnalysis.symbolGraph.nodes) {
      // Process nodes as symbols
      for (const node of guruAnalysis.symbolGraph.nodes || []) {
        symbolAnalyses.push(this.mapper.mapSymbolAnalysis(node));
      }
    }
    
    // TODO: Detect duplication across codebase
    // const duplications = await duplicationDetector.detectDuplication(
    //   guruAnalysis.files.map(f => ({ path: f.path, content: f.content }))
    // );
    // 
    // for (const duplication of duplications) {
    //   insights.push(this.mapper.duplicationToInsight(duplication));
    // }
    // 
    // // Analyze architecture
    // const architectureIssues = await architectureAnalyzer.analyzeArchitecture(guruAnalysis.graph);
    // for (const issue of architectureIssues) {
    //   insights.push(this.mapper.architectureToInsight(issue));
    // }
    
    // Run harmonic analysis if enabled
    if (this.harmonicEngine) {
      try {
        const harmonicPatterns = await this.analyzeHarmonicPatterns(guruAnalysis);
        for (const pattern of harmonicPatterns) {
          insights.push(this.mapper.harmonicPatternToInsight(pattern));
        }
      } catch (error) {
        this.logger.error('Harmonic analysis failed:', error);
      }
    }
    
    // Generate insights from flow and type analysis
    if (guruAnalysis.flowTypeAnalysis) {
      try {
        // Get task discovery insights
        const taskInsights = await this.guru.getTaskDiscoveryInsights(projectPath);
        
        // Convert flow issues to insights
        for (const issue of taskInsights.flowIssues) {
          insights.push({
            id: `insight_flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'flow_issue',
            discovery: issue.title,
            evidence: [{
              type: 'flow',
              description: issue.description,
              strength: issue.severity === 'high' ? 0.9 : issue.severity === 'medium' ? 0.7 : 0.5,
              data: issue
            }],
            confidence: issue.severity === 'high' ? 0.9 : 0.7,
            timestamp: Date.now(),
            source: 'flow_analyzer'
          });
        }
        
        // Convert type issues to insights
        for (const issue of taskInsights.typeIssues) {
          insights.push({
            id: `insight_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'type_issue',
            discovery: issue.message,
            evidence: [{
              type: 'type',
              description: `${issue.type}: ${issue.message}`,
              strength: issue.severity === 'error' ? 0.9 : issue.severity === 'warning' ? 0.7 : 0.5,
              data: issue
            }],
            confidence: issue.severity === 'error' ? 0.9 : 0.7,
            timestamp: Date.now(),
            source: 'type_analyzer'
          });
        }
        
        // Convert optimization opportunities
        for (const opp of taskInsights.optimizationOpportunities) {
          insights.push({
            id: `insight_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'optimization',
            discovery: opp.title,
            evidence: [{
              type: 'performance',
              description: opp.description,
              strength: 0.8,
              data: opp
            }],
            confidence: 0.8,
            timestamp: Date.now(),
            source: 'flow_analyzer'
          });
        }
        
        // Convert refactoring candidates
        for (const refactor of taskInsights.refactoringCandidates) {
          insights.push({
            id: `insight_refactor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'refactor',
            discovery: refactor.title,
            evidence: [{
              type: 'complexity',
              description: refactor.description,
              strength: refactor.severity === 'high' ? 0.9 : 0.7,
              data: refactor
            }],
            confidence: refactor.severity === 'high' ? 0.9 : 0.7,
            timestamp: Date.now(),
            source: 'integrated_analyzer'
          });
        }
        
        this.logger.info(`📊 Generated ${taskInsights.flowIssues.length + taskInsights.typeIssues.length + 
                         taskInsights.optimizationOpportunities.length + taskInsights.refactoringCandidates.length} insights from flow/type analysis`);
      } catch (error) {
        this.logger.error('Flow/type insight generation failed:', error);
      }
    }
    
    // Build code analysis result
    const analysis: CodeAnalysis = {
      files: fileAnalyses,
      symbols: symbolAnalyses,
      patterns: patternInstances,
      metrics: {
        totalFiles: fileAnalyses.length,
        totalLines: fileAnalyses.reduce((sum, f) => sum + (f.size || 0), 0),
        avgComplexity: fileAnalyses.reduce((sum, f) => sum + f.complexity, 0) / Math.max(1, fileAnalyses.length),
        testCoverage: this.estimateTestCoverage(fileAnalyses),
        duplicateRatio: 0 // TODO: Re-enable when duplication detector is available
      },
      dependencies: {
        nodes: symbolAnalyses.map(s => s.name),
        edges: this.extractDependencyEdges(guruAnalysis.symbolGraph),
        cycles: [] // TODO: Add cycle detection when available
      }
    };
    
    // Add basic insights from metadata
    if (guruAnalysis.metadata && guruAnalysis.metadata.filesAnalyzed > 0) {
      insights.push({
        id: `insight_metadata_${Date.now()}`,
        type: 'analysis',
        discovery: `Analyzed ${guruAnalysis.metadata.filesAnalyzed} files in ${guruAnalysis.metadata.targetPath}`,
        evidence: [{
          type: 'metric',
          description: `Files: ${guruAnalysis.metadata.filesAnalyzed}/${guruAnalysis.metadata.totalFiles}`,
          strength: 0.5
        }],
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'guru_analyzer'
      });
    }
    
    // Ensure at least one insight
    if (insights.length === 0) {
      insights.push({
        id: `insight_initial_${Date.now()}`,
        type: 'analysis',
        discovery: 'Initial codebase analysis complete',
        evidence: [{
          type: 'observation',
          description: 'Ready for task generation',
          strength: 0.3
        }],
        confidence: 0.5,
        timestamp: Date.now(),
        source: 'guru_analyzer'
      });
    }
    
    this.logger.info(`✅ Guru analysis complete: ${insights.length} insights generated`);
    
    return { analysis, insights };
  }
  
  /**
   * Generate insights from specific Guru analysis results
   */
  generateInsightsFromSymbolGraph(symbolGraph: any): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    
    try {
      // Basic symbol graph analysis
      if (symbolGraph) {
        // Count symbols
        const symbolCount = symbolGraph.nodes ? symbolGraph.nodes.length : 0;
        
        // Always generate at least one insight for testing
        if (symbolCount > 0) {
          insights.push({
            id: `insight_codebase_${Date.now()}`,
            type: 'analysis',
            discovery: `Codebase contains ${symbolCount} symbols`,
            evidence: [{
              type: 'metric',
              description: `Symbol count: ${symbolCount}`,
              strength: 0.5
            }],
            confidence: 0.7,
            timestamp: Date.now(),
            source: 'guru_analyzer'
          });
        }
        
        if (symbolCount > 100) {
          insights.push({
            id: `insight_complexity_${Date.now()}`,
            type: 'structural_issue',
            discovery: `Large codebase with ${symbolCount} symbols - consider modularization`,
            evidence: [{
              type: 'metric',
              description: `Symbol count: ${symbolCount}`,
              strength: 0.7
            }],
            confidence: 0.6,
            timestamp: Date.now(),
            source: 'guru_analyzer'
          });
        }
        
        // TODO: Add more sophisticated symbol graph analysis when methods are available
      }
    } catch (error) {
      this.logger.warn('Failed to analyze symbol graph:', error);
    }
    
    return insights;
  }
  
  /**
   * Create initial forest from Guru analysis
   */
  async createForestFromAnalysis(
    projectPath: string,
    goals: ProjectGoal[]
  ): Promise<TaskForest> {
    // Analyze project
    const { analysis, insights } = await this.analyzeProject(projectPath);
    
    // Add insights from graph analysis
    // Get additional insights from Guru analysis
    try {
      const guruAnalysis = await this.guru.analyzeCodebase(projectPath);
      if (guruAnalysis.symbolGraph) {
        // Generate insights from symbol graph
        const graphInsights = this.generateInsightsFromSymbolGraph(guruAnalysis.symbolGraph);
        insights.push(...graphInsights);
      }
    } catch (error) {
      this.logger.warn('Failed to get Guru analysis:', error);
    }
    
    // Create forest
    const forest = new TaskForest();
    
    // Sort insights by confidence and relevance to goals
    const scoredInsights = insights.map(insight => {
      let score = insight.confidence;
      
      // Boost score for insights matching goals
      for (const goal of goals) {
        if (insight.type.includes(goal.type)) {
          score *= (1 + goal.priority);
        }
      }
      
      return { insight, score };
    });
    
    scoredInsights.sort((a, b) => b.score - a.score);
    
    // Plant top insights as initial tasks
    const initialCount = Math.min(10, scoredInsights.length);
    for (let i = 0; i < initialCount; i++) {
      await forest.plantSeed(scoredInsights[i].insight);
    }
    
    this.logger.info(`🌲 Created forest with ${initialCount} initial tasks from Guru analysis`);
    
    return forest;
  }
  
  /**
   * Monitor codebase changes and evolve forest
   */
  async monitorAndEvolve(
    forest: TaskForest,
    projectPath: string,
    onChange: (insights: ProjectInsight[]) => void
  ): Promise<void> {
    // This would integrate with file watchers
    // For now, just a placeholder
    this.logger.info('👁️ Monitoring codebase for changes...');
    
    // Set up periodic re-analysis
    setInterval(async () => {
      try {
        const { insights } = await this.analyzeProject(projectPath);
        
        // Filter to only new insights
        const existingIds = new Set(
          Array.from(forest.trees.values()).map(t => t.root.id)
        );
        
        const newInsights = insights.filter(i => !existingIds.has(i.id));
        
        if (newInsights.length > 0) {
          onChange(newInsights);
          
          // Plant new tasks
          for (const insight of newInsights) {
            await forest.plantSeed(insight);
          }
          
          // Evolve forest based on changes
          await forest.evolveForest({
            type: 'environment_change',
            intensity: 0.5,
            duration: 3600000
          });
        }
      } catch (error) {
        this.logger.error('Monitoring error:', error);
      }
    }, 60000); // Check every minute
  }
  
  // Private helper methods
  
  private estimateTestCoverage(files: FileAnalysis[]): number {
    // Simple heuristic: check for test files
    const testFiles = files.filter(f => 
      f.path.includes('.test.') || 
      f.path.includes('.spec.') ||
      f.path.includes('__tests__')
    );
    
    return Math.min(1, testFiles.length / Math.max(1, files.length) * 2);
  }
  
  private extractDependencyEdges(symbolGraph: any): Array<{ from: string; to: string; type: string }> {
    const edges: Array<{ from: string; to: string; type: string }> = [];
    
    // TODO: Extract edges from symbol graph when methods are available
    if (symbolGraph && symbolGraph.edges) {
      // Process edges when available
      for (const edge of symbolGraph.edges || []) {
        edges.push({
          from: edge.source || edge.from || '',
          to: edge.target || edge.to || '',
          type: edge.type || 'depends_on'
        });
      }
    }
    
    return edges;
  }
  
  private async analyzeHarmonicPatterns(guruAnalysis: any): Promise<any[]> {
    if (!this.harmonicEngine) return [];
    
    const patterns: any[] = [];
    
    // Analyze each file for harmonic patterns
    for (const file of guruAnalysis.files) {
      try {
        const filePatterns = await this.harmonicEngine.analyzeCode(
          file.content,
          file.path
        );
        
        patterns.push(...filePatterns);
      } catch (error) {
        this.logger.error(`Harmonic analysis failed for ${file.path}:`, error);
      }
    }
    
    return patterns;
  }
}

/**
 * Task relevance analyzer using Guru's symbol graph
 */
export class TaskRelevanceAnalyzer {
  private guru: GuruEnhanced;
  private logger = Logger.getInstance();
  
  constructor(guru: GuruEnhanced) {
    this.guru = guru;
  }
  
  /**
   * Analyze how relevant a task is to specific code sections
   */
  analyzeTaskRelevance(
    task: any,
    codeSection: { file: string; startLine: number; endLine: number }
  ): number {
    try {
      // This would require access to the current symbol graph
      // For now, return a basic relevance score
      // TODO: Implement proper symbol range analysis once Guru exposes the symbol graph
      
      const taskText = `${task.trunk.title} ${task.trunk.description}`.toLowerCase();
      const fileName = codeSection.file.toLowerCase();
      
      // Simple heuristic: check if task mentions the file
      if (taskText.includes(path.basename(fileName, path.extname(fileName)))) {
        return 0.7;
      }
      
      // Check for common keywords
      const keywords = ['refactor', 'fix', 'optimize', 'update', 'improve'];
      for (const keyword of keywords) {
        if (taskText.includes(keyword)) {
          return 0.3;
        }
      }
      
      return 0;
      
    } catch (error) {
      this.logger.error('Relevance analysis failed:', error);
      return 0;
    }
  }
  
  /**
   * Find code sections affected by a task
   */
  findAffectedCode(task: any): Array<{ file: string; symbols: string[] }> {
    const affected: Array<{ file: string; symbols: string[] }> = [];
    
    // Extract mentioned symbols from task
    const mentionedSymbols = this.extractMentionedSymbols(task);
    
    // For now, return a simplified result
    // TODO: Implement proper symbol lookup once Guru exposes the symbol graph
    if (mentionedSymbols.length > 0) {
      // Group symbols by likely file patterns
      const filePatterns = new Map<string, string[]>();
      
      for (const symbol of mentionedSymbols) {
        // Simple heuristic: convert PascalCase to kebab-case for file names
        const fileName = symbol
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase() + '.ts';
        
        if (!filePatterns.has(fileName)) {
          filePatterns.set(fileName, []);
        }
        filePatterns.get(fileName)!.push(symbol);
      }
      
      // Convert to result format
      for (const [file, symbols] of filePatterns) {
        affected.push({ file, symbols });
      }
    }
    
    return affected;
  }
  
  private extractMentionedSymbols(task: any): string[] {
    const symbols: string[] = [];
    
    // Simple extraction - would be more sophisticated in practice
    const text = `${task.trunk.title} ${task.trunk.description}`;
    const words = text.split(/\s+/);
    
    for (const word of words) {
      // Check if word looks like a symbol (CamelCase, snake_case, etc.)
      if (/^[A-Z][a-zA-Z0-9]*$/.test(word) || // ClassName
          /^[a-z][a-zA-Z0-9]*$/.test(word) || // functionName
          /^[a-z]+_[a-z]+/.test(word)) {      // snake_case
        symbols.push(word);
      }
    }
    
    return symbols;
  }
}