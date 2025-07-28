/**
 * Direct Filesystem Analyzer for Guru
 * Provides filesystem analysis capabilities without MCP dependency
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { GuruEnhanced } from '../core/guru-enhanced';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system';
import { TaskEvolutionEngine } from '../task-evolution/core/evolution-engine';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  extension: string;
  modifiedTime: Date;
  content?: string;
  category?: string;
}

export interface FilesystemAnalysisOptions {
  targetPath: string;
  recursive?: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
  includeHidden?: boolean;
  analysisDepth?: 'surface' | 'moderate' | 'deep' | 'comprehensive';
}

export interface FilesystemAnalysisResult {
  files: FileInfo[];
  directories: string[];
  totalSize: number;
  fileTypeDistribution: Record<string, number>;
  insights: string[];
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  cognitiveAnalysis?: any;
}

export class FilesystemAnalyzer {
  private guru: GuruEnhanced;
  private harmonicEngine: HarmonicAnalysisEngine;
  private quantumMemory: QuantumProbabilityFieldMemory;
  private evolutionEngine: TaskEvolutionEngine;

  // Security: Allowed paths for analysis
  private allowedPaths = [
    process.env.HOME + '/Documents',
    process.env.HOME + '/Desktop',
    process.env.HOME + '/Downloads',
    '/tmp',
    '/var/tmp'
  ];

  constructor(guru: GuruEnhanced) {
    this.guru = guru;
    this.harmonicEngine = new HarmonicAnalysisEngine();
    this.quantumMemory = new QuantumProbabilityFieldMemory({
      dimensions: 512,
      fieldStrength: 0.8,
      coherenceThreshold: 0.6
    });
    this.evolutionEngine = new TaskEvolutionEngine({
      populationSize: 50,
      mutationRate: 0.2,
      crossoverRate: 0.7,
      maxGenerations: 100
    });
  }

  /**
   * Analyze filesystem with Guru's cognitive enhancement
   */
  async analyzeFilesystem(options: FilesystemAnalysisOptions): Promise<FilesystemAnalysisResult> {
    // Validate security
    if (!this.isPathAllowed(options.targetPath)) {
      throw new Error(`Path ${options.targetPath} is not in allowed directories`);
    }

    const targetPath = path.resolve(options.targetPath);
    const stats = await fs.stat(targetPath);

    let files: FileInfo[] = [];
    let directories: string[] = [];

    if (stats.isDirectory()) {
      const result = await this.scanDirectory(targetPath, options);
      files = result.files;
      directories = result.directories;
    } else {
      const fileInfo = await this.getFileInfo(targetPath);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }

    // Calculate metrics
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileTypeDistribution = this.calculateFileTypeDistribution(files);

    // Perform cognitive analysis
    const cognitiveAnalysis = await this.performCognitiveAnalysis(files, options.analysisDepth || 'moderate');

    // Generate insights
    const insights = await this.generateInsights(files, directories, cognitiveAnalysis);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(files, directories, cognitiveAnalysis);

    return {
      files,
      directories,
      totalSize,
      fileTypeDistribution,
      insights,
      recommendations,
      cognitiveAnalysis
    };
  }

  /**
   * Analyze specific files with manual selection
   */
  async analyzeFilesManual(
    filePaths: string[],
    analysisMode: 'individual' | 'comparative' | 'collective' | 'evolutionary' = 'individual'
  ): Promise<any> {
    // Validate all paths
    for (const filePath of filePaths) {
      if (!this.isPathAllowed(filePath)) {
        throw new Error(`Path ${filePath} is not in allowed directories`);
      }
    }

    // Get file information
    const files: FileInfo[] = [];
    for (const filePath of filePaths) {
      const fileInfo = await this.getFileInfo(filePath);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }

    // Perform analysis based on mode
    switch (analysisMode) {
      case 'individual':
        return await this.analyzeIndividual(files);
      case 'comparative':
        return await this.analyzeComparative(files);
      case 'collective':
        return await this.analyzeCollective(files);
      case 'evolutionary':
        return await this.analyzeEvolutionary(files);
    }
  }

  private async scanDirectory(
    dirPath: string,
    options: FilesystemAnalysisOptions,
    currentDepth: number = 0
  ): Promise<{ files: FileInfo[], directories: string[] }> {
    const files: FileInfo[] = [];
    const directories: string[] = [dirPath];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip hidden files if not requested
        if (!options.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          directories.push(fullPath);

          // Recurse if requested
          if (options.recursive && currentDepth < 10) {
            const subResult = await this.scanDirectory(fullPath, options, currentDepth + 1);
            files.push(...subResult.files);
            directories.push(...subResult.directories);
          }
        } else if (entry.isFile()) {
          const fileInfo = await this.getFileInfo(fullPath);
          if (fileInfo && this.shouldAnalyzeFile(fileInfo, options)) {
            files.push(fileInfo);
          }

          // Limit number of files
          if (files.length >= 100) {
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return { files, directories };
  }

  private async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const parsedPath = path.parse(filePath);

      let content: string | undefined;
      let category: string | undefined;

      // Read content for small text files
      if (stats.size < 1024 * 1024 && this.isTextFile(parsedPath.ext)) {
        try {
          content = await fs.readFile(filePath, 'utf-8');
          category = this.categorizeFile(parsedPath.name, parsedPath.ext, content);
        } catch (error) {
          // Ignore read errors
        }
      }

      return {
        path: filePath,
        name: parsedPath.base,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        extension: parsedPath.ext,
        modifiedTime: stats.mtime,
        content,
        category
      };
    } catch (error) {
      console.error(`Error getting file info for ${filePath}:`, error);
      return null;
    }
  }

  private shouldAnalyzeFile(fileInfo: FileInfo, options: FilesystemAnalysisOptions): boolean {
    // Check file size
    if (options.maxFileSize && fileInfo.size > options.maxFileSize) {
      return false;
    }

    // Check file types
    if (options.fileTypes && options.fileTypes.length > 0) {
      const fileType = this.getFileType(fileInfo.extension);
      if (!options.fileTypes.includes(fileType)) {
        return false;
      }
    }

    return true;
  }

  private isTextFile(extension: string): boolean {
    const textExtensions = [
      '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java',
      '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs',
      '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml',
      '.toml', '.ini', '.conf', '.sh', '.bash', '.sql'
    ];
    return textExtensions.includes(extension.toLowerCase());
  }

  private categorizeFile(name: string, extension: string, content?: string): string {
    // Code files
    if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'].includes(extension)) {
      return 'code';
    }

    // Documentation
    if (['.md', '.txt', '.rst', '.adoc'].includes(extension) || name.toLowerCase().includes('readme')) {
      return 'documentation';
    }

    // Configuration
    if (['.json', '.yaml', '.yml', '.toml', '.ini', '.conf'].includes(extension)) {
      return 'configuration';
    }

    // Data files
    if (['.csv', '.tsv', '.xml', '.sql'].includes(extension)) {
      return 'data';
    }

    return 'other';
  }

  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.js': 'code',
      '.ts': 'code',
      '.py': 'code',
      '.java': 'code',
      '.cpp': 'code',
      '.c': 'code',
      '.go': 'code',
      '.rs': 'code',
      '.md': 'docs',
      '.txt': 'docs',
      '.rst': 'docs',
      '.json': 'config',
      '.yaml': 'config',
      '.yml': 'config',
      '.toml': 'config',
      '.ini': 'config',
      '.csv': 'data',
      '.xml': 'data',
      '.sql': 'data'
    };

    return typeMap[extension.toLowerCase()] || 'other';
  }

  private calculateFileTypeDistribution(files: FileInfo[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const file of files) {
      const type = this.getFileType(file.extension);
      distribution[type] = (distribution[type] || 0) + 1;
    }

    return distribution;
  }

  private async performCognitiveAnalysis(files: FileInfo[], depth: string): Promise<any> {
    // Sample content for analysis
    const sampleContent = files
      .filter(f => f.content)
      .slice(0, 5)
      .map(f => f.content)
      .join('\n\n');

    // Harmonic analysis
    const harmonicPatterns = await this.harmonicEngine.analyzeHarmonicPatterns(sampleContent);

    // Quantum synthesis
    await this.quantumMemory.addMemory({
      id: `filesystem-${Date.now()}`,
      content: sampleContent,
      timestamp: new Date(),
      context: { files: files.map(f => f.name) },
      metadata: { analysisDepth: depth }
    });

    const quantumInsights = await this.quantumMemory.synthesize(
      'Extract insights from filesystem structure and content'
    );

    return {
      harmonicPatterns,
      quantumInsights,
      analysisDepth: depth
    };
  }

  private async generateInsights(
    files: FileInfo[],
    directories: string[],
    cognitiveAnalysis: any
  ): Promise<string[]> {
    const insights: string[] = [];

    // Size insights
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    insights.push(`Analyzed ${files.length} files totaling ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

    // Category insights
    const categories = new Set(files.map(f => f.category).filter(Boolean));
    if (categories.size > 0) {
      insights.push(`Found ${categories.size} different file categories: ${Array.from(categories).join(', ')}`);
    }

    // Structure insights
    if (directories.length > 10) {
      insights.push(`Complex directory structure with ${directories.length} directories`);
    }

    // Cognitive insights
    if (cognitiveAnalysis.harmonicPatterns?.dominantFrequencies?.length > 0) {
      insights.push('Detected recurring patterns in code structure');
    }

    if (cognitiveAnalysis.quantumInsights?.insights?.length > 0) {
      insights.push(...cognitiveAnalysis.quantumInsights.insights.slice(0, 2));
    }

    return insights;
  }

  private async generateRecommendations(
    files: FileInfo[],
    directories: string[],
    cognitiveAnalysis: any
  ): Promise<any[]> {
    const recommendations = [];

    // Size recommendations
    const largeFiles = files.filter(f => f.size > 1024 * 1024);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Large File Optimization',
        description: `Found ${largeFiles.length} files over 1MB that could be optimized`,
        priority: 'medium' as const
      });
    }

    // Organization recommendations
    const avgFilesPerDir = files.length / Math.max(directories.length, 1);
    if (avgFilesPerDir > 20) {
      recommendations.push({
        type: 'organization',
        title: 'Improve Directory Organization',
        description: 'High concentration of files in directories - consider better organization',
        priority: 'low' as const
      });
    }

    return recommendations;
  }

  private async analyzeIndividual(files: FileInfo[]): Promise<any> {
    const analyses = [];

    for (const file of files) {
      const analysis = {
        file: file.name,
        size: file.size,
        category: file.category,
        insights: [],
        recommendations: []
      };

      if (file.content) {
        // Harmonic analysis
        const patterns = await this.harmonicEngine.analyzeHarmonicPatterns(file.content);
        if (patterns.dominantFrequencies.length > 0) {
          analysis.insights.push(`Detected ${patterns.dominantFrequencies.length} dominant patterns`);
        }
      }

      analyses.push(analysis);
    }

    return { mode: 'individual', analyses };
  }

  private async analyzeComparative(files: FileInfo[]): Promise<any> {
    const comparisons = [];

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const similarity = this.calculateSimilarity(files[i], files[j]);
        comparisons.push({
          file1: files[i].name,
          file2: files[j].name,
          similarity,
          sameCateogry: files[i].category === files[j].category
        });
      }
    }

    return { mode: 'comparative', comparisons };
  }

  private async analyzeCollective(files: FileInfo[]): Promise<any> {
    const collective = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      categories: this.calculateFileTypeDistribution(files),
      systemComplexity: this.calculateSystemComplexity(files)
    };

    // Collective cognitive analysis
    const allContent = files
      .filter(f => f.content)
      .map(f => f.content)
      .join('\n\n');

    if (allContent) {
      const insights = await this.quantumMemory.synthesize(
        'Analyze the collective system of files'
      );
      collective['systemInsights'] = insights;
    }

    return { mode: 'collective', collective };
  }

  private async analyzeEvolutionary(files: FileInfo[]): Promise<any> {
    // Use task evolution to optimize file organization
    const currentState = {
      files: files.map(f => ({ name: f.name, size: f.size, category: f.category })),
      score: this.calculateOrganizationScore(files)
    };

    const evolution = await this.evolutionEngine.evolve({
      objective: 'Optimize file organization and structure',
      constraints: ['Maintain file integrity', 'Preserve relationships'],
      currentApproach: JSON.stringify(currentState),
      parameters: { maxGenerations: 50 }
    });

    return { 
      mode: 'evolutionary', 
      currentState,
      evolution,
      improvements: this.generateImprovements(files, evolution)
    };
  }

  private calculateSimilarity(file1: FileInfo, file2: FileInfo): number {
    let similarity = 0;

    // Category similarity
    if (file1.category === file2.category) {
      similarity += 0.3;
    }

    // Extension similarity
    if (file1.extension === file2.extension) {
      similarity += 0.2;
    }

    // Size similarity
    const sizeDiff = Math.abs(file1.size - file2.size) / Math.max(file1.size, file2.size);
    similarity += (1 - sizeDiff) * 0.2;

    // Content similarity (if available)
    if (file1.content && file2.content) {
      const contentSim = this.calculateContentSimilarity(file1.content, file2.content);
      similarity += contentSim * 0.3;
    }

    return Math.min(similarity, 1.0);
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple word-based similarity
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private calculateSystemComplexity(files: FileInfo[]): number {
    const avgSize = files.reduce((sum, f) => sum + f.size, 0) / files.length;
    const categories = new Set(files.map(f => f.category).filter(Boolean)).size;
    
    return Math.min((files.length / 100) + (categories / 10) + (avgSize / 1024 / 1024), 1.0);
  }

  private calculateOrganizationScore(files: FileInfo[]): number {
    // Simple organization score based on file distribution
    const categories = this.calculateFileTypeDistribution(files);
    const categoryBalance = Object.values(categories).reduce((acc, count) => {
      const expected = files.length / Object.keys(categories).length;
      return acc + Math.abs(count - expected) / expected;
    }, 0) / Object.keys(categories).length;

    return Math.max(0, 1 - categoryBalance);
  }

  private generateImprovements(files: FileInfo[], evolution: any): any[] {
    const improvements = [];

    // Based on evolution results
    if (evolution.bestSolution?.fitness > 0.8) {
      improvements.push({
        type: 'organization',
        suggestion: 'Reorganize files according to evolved structure',
        impact: 'high'
      });
    }

    return improvements;
  }

  private isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    return this.allowedPaths.some(allowed => 
      resolved.startsWith(path.resolve(allowed))
    );
  }
}