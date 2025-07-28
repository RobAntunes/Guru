/**
 * Guru Filesystem API - Unified interface for filesystem, document, and RAG features
 * Works both directly and through MCP
 */

import { GuruEnhanced } from '../core/guru-enhanced';
import { FilesystemAnalyzer } from '../filesystem/filesystem-analyzer';
import { DocumentProcessor } from '../filesystem/document-processor';
import { KnowledgeBaseManager } from '../rag/knowledge-base-manager';

export class GuruFilesystemAPI {
  private guru: GuruEnhanced;
  private filesystemAnalyzer: FilesystemAnalyzer;
  private documentProcessor: DocumentProcessor;
  private knowledgeBaseManager: KnowledgeBaseManager;

  constructor(guru: GuruEnhanced) {
    this.guru = guru;
    this.filesystemAnalyzer = new FilesystemAnalyzer(guru);
    this.documentProcessor = new DocumentProcessor(guru);
    this.knowledgeBaseManager = new KnowledgeBaseManager(guru);
  }

  /**
   * Analyze filesystem - works directly without MCP
   */
  async analyzeFilesystem(options: {
    targetPath: string;
    recursive?: boolean;
    fileTypes?: string[];
    maxFileSize?: number;
    includeHidden?: boolean;
    analysisDepth?: 'surface' | 'moderate' | 'deep' | 'comprehensive';
  }) {
    return await this.filesystemAnalyzer.analyzeFilesystem(options);
  }

  /**
   * Analyze specific files manually - works directly without MCP
   */
  async analyzeFilesManual(
    filePaths: string[],
    analysisMode: 'individual' | 'comparative' | 'collective' | 'evolutionary' = 'individual'
  ) {
    return await this.filesystemAnalyzer.analyzeFilesManual(filePaths, analysisMode);
  }

  /**
   * Upload and process documents - works directly without MCP
   */
  async uploadDocuments(
    documents: Array<{
      filename: string;
      content: string;
      mimeType?: string;
      encoding?: string;
      isBase64?: boolean;
      category?: string;
      metadata?: Record<string, any>;
    }>,
    options?: {
      analysisMode?: 'comprehensive' | 'focused' | 'comparative';
      enableCognitiveAnalysis?: boolean;
      preserveFiles?: boolean;
      batchName?: string;
    }
  ) {
    return await this.documentProcessor.processDocuments(documents, options);
  }

  /**
   * Create a new RAG knowledge base - works directly without MCP
   */
  async createKnowledgeBase(
    name: string,
    description: string,
    cognitiveSystemsEnabled?: string[]
  ) {
    return await this.knowledgeBaseManager.createKnowledgeBase(
      name,
      description,
      cognitiveSystemsEnabled
    );
  }

  /**
   * Add documents to a knowledge base - works directly without MCP
   */
  async addDocumentsToKnowledgeBase(
    kbName: string,
    documents: Array<{
      filename: string;
      content: string;
      category?: string;
      metadata?: Record<string, any>;
    }>,
    options?: {
      enableCognitiveAnalysis?: boolean;
      chunkDocuments?: boolean;
    }
  ) {
    return await this.knowledgeBaseManager.addDocuments(kbName, documents, options);
  }

  /**
   * Query a knowledge base - works directly without MCP
   */
  async queryKnowledgeBase(
    kbName: string,
    query: string,
    options?: {
      maxResults?: number;
      includeCognitiveInsights?: boolean;
      responseMode?: 'comprehensive' | 'concise' | 'analytical';
    }
  ) {
    return await this.knowledgeBaseManager.query(kbName, query, options);
  }

  /**
   * List all knowledge bases - works directly without MCP
   */
  async listKnowledgeBases() {
    return await this.knowledgeBaseManager.listKnowledgeBases();
  }

  /**
   * Get knowledge base info - works directly without MCP
   */
  async getKnowledgeBaseInfo(kbName: string) {
    return await this.knowledgeBaseManager.getKnowledgeBaseInfo(kbName);
  }

  /**
   * Delete a knowledge base - works directly without MCP
   */
  async deleteKnowledgeBase(kbName: string, confirm: boolean = false) {
    return await this.knowledgeBaseManager.deleteKnowledgeBase(kbName, confirm);
  }

  /**
   * Update knowledge base configuration - works directly without MCP
   */
  async updateKnowledgeBase(
    kbName: string,
    updates: {
      description?: string;
      cognitiveSystemsEnabled?: string[];
    }
  ) {
    return await this.knowledgeBaseManager.updateKnowledgeBase(kbName, updates);
  }

  /**
   * List documents in a knowledge base - works directly without MCP
   */
  async listDocumentsInKnowledgeBase(kbName: string) {
    return await this.knowledgeBaseManager.listDocuments(kbName);
  }

  /**
   * Delete a document from knowledge base - works directly without MCP
   */
  async deleteDocumentFromKnowledgeBase(kbName: string, documentId: string) {
    return await this.knowledgeBaseManager.deleteDocument(kbName, documentId);
  }

  /**
   * Analyze file from buffer/blob - useful for desktop app file dialogs
   */
  async analyzeFileFromBuffer(
    filename: string,
    buffer: Buffer | Uint8Array | ArrayBuffer,
    options?: {
      analysisDepth?: 'surface' | 'moderate' | 'deep' | 'comprehensive';
      enableCognitiveAnalysis?: boolean;
    }
  ) {
    // Convert buffer to string
    const content = Buffer.isBuffer(buffer) 
      ? buffer.toString('utf-8')
      : Buffer.from(buffer).toString('utf-8');

    // Process as document
    const result = await this.documentProcessor.processDocuments([{
      filename,
      content,
      mimeType: this.getMimeType(filename)
    }], {
      analysisMode: 'comprehensive',
      enableCognitiveAnalysis: options?.enableCognitiveAnalysis ?? true
    });

    return result.documents[0] || null;
  }

  /**
   * Create knowledge base from folder - useful for project import
   */
  async createKnowledgeBaseFromFolder(
    folderPath: string,
    kbName: string,
    description: string,
    options?: {
      fileTypes?: string[];
      recursive?: boolean;
      maxFileSize?: number;
    }
  ) {
    // First create the knowledge base
    const kb = await this.createKnowledgeBase(kbName, description);

    // Analyze the folder
    const analysis = await this.filesystemAnalyzer.analyzeFilesystem({
      targetPath: folderPath,
      recursive: options?.recursive ?? true,
      fileTypes: options?.fileTypes,
      maxFileSize: options?.maxFileSize
    });

    // Add files to knowledge base
    const documents = analysis.files
      .filter(file => file.content)
      .map(file => ({
        filename: file.name,
        content: file.content!,
        category: file.category
      }));

    if (documents.length > 0) {
      await this.addDocumentsToKnowledgeBase(kbName, documents);
    }

    return {
      knowledgeBase: kb,
      filesAdded: documents.length,
      totalFilesFound: analysis.files.length
    };
  }

  /**
   * Compare multiple projects/folders
   */
  async compareProjects(
    projectPaths: string[],
    options?: {
      fileTypes?: string[];
      analysisDepth?: 'surface' | 'moderate' | 'deep' | 'comprehensive';
    }
  ) {
    const projects = [];

    // Analyze each project
    for (const projectPath of projectPaths) {
      const analysis = await this.filesystemAnalyzer.analyzeFilesystem({
        targetPath: projectPath,
        recursive: true,
        fileTypes: options?.fileTypes,
        analysisDepth: options?.analysisDepth
      });

      projects.push({
        path: projectPath,
        name: projectPath.split('/').pop() || projectPath,
        analysis
      });
    }

    // Compare projects
    const comparison = {
      projects,
      similarities: this.findProjectSimilarities(projects),
      differences: this.findProjectDifferences(projects),
      recommendations: this.generateProjectComparisonRecommendations(projects)
    };

    return comparison;
  }

  // Helper methods

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'py': 'text/x-python',
      'java': 'text/x-java',
      'cpp': 'text/x-c++',
      'xml': 'application/xml',
      'yaml': 'application/x-yaml',
      'yml': 'application/x-yaml'
    };

    return mimeMap[ext || ''] || 'text/plain';
  }

  private findProjectSimilarities(projects: any[]): string[] {
    const similarities: string[] = [];

    // Compare file type distributions
    const allCategories = new Set<string>();
    projects.forEach(p => {
      Object.keys(p.analysis.fileTypeDistribution).forEach(cat => allCategories.add(cat));
    });

    const sharedCategories = Array.from(allCategories).filter(cat =>
      projects.every(p => p.analysis.fileTypeDistribution[cat] > 0)
    );

    if (sharedCategories.length > 0) {
      similarities.push(`All projects contain ${sharedCategories.join(', ')} files`);
    }

    // Compare sizes
    const avgSize = projects.reduce((sum, p) => sum + p.analysis.totalSize, 0) / projects.length;
    const sizeVariance = Math.max(...projects.map(p => Math.abs(p.analysis.totalSize - avgSize))) / avgSize;

    if (sizeVariance < 0.3) {
      similarities.push('Projects have similar sizes');
    }

    return similarities;
  }

  private findProjectDifferences(projects: any[]): string[] {
    const differences: string[] = [];

    // File count differences
    const fileCounts = projects.map(p => p.analysis.files.length);
    const maxFiles = Math.max(...fileCounts);
    const minFiles = Math.min(...fileCounts);

    if (maxFiles / minFiles > 2) {
      differences.push(`Significant file count variation: ${minFiles} to ${maxFiles} files`);
    }

    // Unique file types
    projects.forEach(project => {
      const uniqueTypes = Object.keys(project.analysis.fileTypeDistribution).filter(type =>
        !projects.every(p => p.analysis.fileTypeDistribution[type] > 0)
      );

      if (uniqueTypes.length > 0) {
        differences.push(`${project.name} has unique file types: ${uniqueTypes.join(', ')}`);
      }
    });

    return differences;
  }

  private generateProjectComparisonRecommendations(projects: any[]): any[] {
    const recommendations = [];

    // Structure standardization
    const structures = projects.map(p => p.analysis.directories.length);
    const avgStructure = structures.reduce((a, b) => a + b, 0) / structures.length;
    const structureVariance = Math.max(...structures.map(s => Math.abs(s - avgStructure))) / avgStructure;

    if (structureVariance > 0.5) {
      recommendations.push({
        type: 'standardization',
        title: 'Standardize Project Structure',
        description: 'Projects have varying directory structures - consider standardizing',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

// Export for desktop app usage
export default GuruFilesystemAPI;