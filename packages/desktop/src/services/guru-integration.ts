/**
 * Guru Integration Service
 * Bridges Tauri frontend with Guru backend APIs
 */

import { invoke } from '@tauri-apps/api/core';
import { guruMockService } from './guru-mock-integration';

// Use mock service for now until backend is fully integrated
const USE_MOCK = false;

// Types from our Guru APIs
export interface FileAnalysisResult {
  path: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  category: string;
  cognitiveAnalysis?: {
    summary: string;
    keywords: string[];
    insights: string[];
    recommendations: string[];
  };
}

export interface DocumentBatch {
  id: string;
  name: string;
  documents: ProcessedDocument[];
  createdAt: Date;
  totalSize: number;
  documentCount: number;
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  contentHash: string;
  category: string;
  addedAt: Date;
  metadata?: Record<string, any>;
  analysis?: any;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  lastUpdated: Date;
  documentCount: number;
  chunkCount: number;
  cognitiveSystemsEnabled: string[];
}

export interface QueryResult {
  query: string;
  answer: string;
  sources: Array<{
    documentName: string;
    chunkContent: string;
    relevanceScore: number;
  }>;
  cognitiveInsights?: string[];
  retrievalMetrics: {
    chunksRetrieved: number;
    avgRelevanceScore: number;
    processingTimeMs: number;
  };
}

class GuruIntegrationService {
  /**
   * Filesystem Analysis
   */
  async analyzeFilesystem(options: {
    targetPath: string;
    recursive?: boolean;
    fileTypes?: string[];
    maxFileSize?: number;
    includeHidden?: boolean;
    analysisDepth?: 'surface' | 'moderate' | 'deep' | 'comprehensive';
  }): Promise<{ files: FileAnalysisResult[]; totalSize: number; fileTypeDistribution: Record<string, number> }> {
    if (USE_MOCK) {
      return await guruMockService.analyzeFilesystem(options);
    }
    return await invoke('analyze_filesystem', { options });
  }

  async analyzeFilesManual(
    filePaths: string[],
    analysisMode: 'individual' | 'comparative' | 'collective' | 'evolutionary' | 'batch' = 'individual'
  ): Promise<any> {
    if (USE_MOCK) {
      return await guruMockService.analyzeFilesManual(filePaths, analysisMode);
    }
    return await invoke('analyze_files_manual', { filePaths, analysisMode });
  }

  /**
   * Document Processing
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
  ): Promise<DocumentBatch> {
    if (USE_MOCK) {
      return await guruMockService.uploadDocuments(documents, options);
    }
    return await invoke('upload_documents', { documents, options });
  }

  /**
   * Knowledge Base Management
   */
  async createKnowledgeBase(
    name: string,
    description: string,
    cognitiveSystemsEnabled?: string[]
  ): Promise<KnowledgeBase> {
    if (USE_MOCK) {
      return await guruMockService.createKnowledgeBase(name, description, cognitiveSystemsEnabled);
    }
    return await invoke('create_knowledge_base', { name, description, cognitiveSystemsEnabled });
  }

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
  ): Promise<{ addedDocuments: any[]; skippedDocuments: string[]; totalChunksCreated: number }> {
    if (USE_MOCK) {
      return await guruMockService.addDocumentsToKnowledgeBase(kbName, documents, options);
    }
    return await invoke('add_documents_to_knowledge_base', { kbName, documents, options });
  }

  async queryKnowledgeBase(
    kbName: string,
    query: string,
    options?: {
      maxResults?: number;
      includeCognitiveInsights?: boolean;
      responseMode?: 'comprehensive' | 'concise' | 'analytical';
    }
  ): Promise<QueryResult> {
    if (USE_MOCK) {
      return await guruMockService.queryKnowledgeBase(kbName, query, options);
    }
    return await invoke('query_knowledge_base', { kbName, query, options });
  }

  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    if (USE_MOCK) {
      return await guruMockService.listKnowledgeBases();
    }
    return await invoke('list_knowledge_bases');
  }

  async getKnowledgeBaseInfo(kbName: string): Promise<{
    knowledgeBase: KnowledgeBase;
    statistics: {
      totalDocuments: number;
      totalChunks: number;
      totalSizeBytes: number;
      categoryDistribution: Record<string, number>;
      avgDocumentSize: number;
      avgChunksPerDocument: number;
    };
  }> {
    if (USE_MOCK) {
      return await guruMockService.getKnowledgeBaseInfo(kbName);
    }
    return await invoke('get_knowledge_base_info', { kbName });
  }

  async deleteKnowledgeBase(kbName: string, confirm: boolean = false): Promise<void> {
    if (USE_MOCK) {
      return await guruMockService.deleteKnowledgeBase(kbName, confirm);
    }
    return await invoke('delete_knowledge_base', { kbName, confirm });
  }

  async listDocumentsInKnowledgeBase(kbName: string): Promise<Array<{
    id: string;
    filename: string;
    category: string;
    sizeBytes: number;
    wordCount: number;
    addedAt: Date;
    metadata?: any;
  }>> {
    if (USE_MOCK) {
      return await guruMockService.listDocumentsInKnowledgeBase(kbName);
    }
    return await invoke('list_documents_in_kb', { kbName });
  }

  async deleteDocumentFromKnowledgeBase(kbName: string, documentId: string): Promise<void> {
    if (USE_MOCK) {
      return await guruMockService.deleteDocumentFromKnowledgeBase(kbName, documentId);
    }
    return await invoke('delete_document_from_kb', { kbName, documentId });
  }

  /**
   * File Dialog Helpers
   */
  async openFileDialog(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null> {
    if (USE_MOCK) {
      return await guruMockService.openFileDialog(options);
    }
    
    // Convert filters to format expected by Rust backend
    const filters = options?.filters?.map(f => [f.name, f.extensions] as [string, string[]]);
    
    const result = await invoke<string[] | null>('open_file_dialog', {
      multiple: options?.multiple || false,
      filters
    });
    
    if (!result) return null;
    
    // Return single string if not multiple, array otherwise
    if (!options?.multiple && result.length > 0) {
      return result[0];
    }
    return result;
  }

  async openFolderDialog(): Promise<string | null> {
    if (USE_MOCK) {
      return await guruMockService.openFolderDialog();
    }
    
    return await invoke<string | null>('open_folder_dialog');
  }

  /**
   * File Browser Support
   */
  async scanDirectory(dirPath: string): Promise<any> {
    if (USE_MOCK) {
      return await guruMockService.scanDirectory(dirPath);
    }
    
    return await invoke('scan_directory', { dirPath });
  }

  /**
   * Utility Functions
   */
  async readFileAsBase64(filePath: string): Promise<string> {
    if (USE_MOCK) {
      return await guruMockService.readFileAsBase64(filePath);
    }
    
    return await invoke<string>('read_file_as_base64', { filePath });
  }

  /**
   * Call MCP Tool
   * Invokes an MCP tool through the backend
   */
  async callMCPTool(toolName: string, args: any): Promise<any> {
    if (USE_MOCK) {
      // Return mock data for synthesis tool
      if (toolName === 'guru_knowledge_synthesis') {
        if (args.action === 'start') {
          return {
            session_id: `session-${Date.now()}`,
            status: 'Session started',
            next_action: 'analyze',
            document_count: args.documents?.length || 0
          };
        } else if (args.action === 'analyze') {
          return {
            session_id: args.session_id,
            status: 'Patterns analyzed',
            pattern_templates: [
              {
                id: 'scamper-template-1',
                framework: 'SCAMPER',
                template_type: 'creative_analysis',
                instructions: 'Apply SCAMPER methods',
                document_refs: []
              },
              {
                id: 'gap-template-1',
                framework: 'Gap Analysis',
                template_type: 'missing_elements',
                instructions: 'Identify gaps',
                document_refs: []
              }
            ],
            next_action: 'select_patterns'
          };
        } else if (args.action === 'generate') {
          return {
            session_id: args.session_id,
            status: 'Work generated',
            work_items: [
              {
                id: `work-${Date.now()}`,
                type: args.synthesis_type,
                title: 'Generated Work Item',
                description: 'This is a mock generated work item',
                content: '// Generated code or content would go here'
              }
            ],
            synthesis_type: args.synthesis_type,
            stage: 'complete'
          };
        }
      }
      return {};
    }
    
    return await invoke('call_mcp_tool', { toolName, args });
  }
}

// Export singleton instance
export const guruService = new GuruIntegrationService();