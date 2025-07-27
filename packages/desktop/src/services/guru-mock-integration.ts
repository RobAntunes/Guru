/**
 * Guru Mock Integration Service
 * Provides mock implementation for testing the UI without backend
 */

import { 
  FileAnalysisResult, 
  DocumentBatch, 
  KnowledgeBase, 
  QueryResult
} from './guru-integration';

class GuruMockIntegrationService {
  private mockKnowledgeBases: KnowledgeBase[] = [
    {
      id: 'kb-1',
      name: 'Project Documentation',
      description: 'All project docs and READMEs',
      createdAt: new Date('2024-01-15'),
      lastUpdated: new Date('2024-01-20'),
      documentCount: 25,
      chunkCount: 150,
      cognitiveSystemsEnabled: ['harmonic_analysis', 'quantum_synthesis']
    },
    {
      id: 'kb-2',
      name: 'Code Knowledge Base',
      description: 'Source code analysis and patterns',
      createdAt: new Date('2024-01-10'),
      lastUpdated: new Date('2024-01-18'),
      documentCount: 45,
      chunkCount: 320,
      cognitiveSystemsEnabled: ['pattern_recognition', 'evolution_engine']
    }
  ];

  private mockDocumentBatches: DocumentBatch[] = [];
  private mockDocumentsByKB: Record<string, Array<{
    id: string;
    filename: string;
    category: string;
    sizeBytes: number;
    wordCount: number;
    addedAt: Date;
    metadata?: any;
  }>> = {};

  async analyzeFilesystem(options: any): Promise<{ files: FileAnalysisResult[]; totalSize: number; fileTypeDistribution: Record<string, number> }> {
    // Mock filesystem analysis
    await this.delay(1500);
    
    return {
      files: [
        {
          path: options.targetPath + '/src/index.ts',
          name: 'index.ts',
          type: 'file',
          size: 2048,
          category: 'code',
          content: '// Main entry point',
          cognitiveAnalysis: {
            summary: 'Application entry point with initialization logic',
            keywords: ['init', 'startup', 'bootstrap'],
            insights: ['Well-structured initialization', 'Follows best practices'],
            recommendations: ['Consider adding error boundaries']
          }
        },
        {
          path: options.targetPath + '/README.md',
          name: 'README.md',
          type: 'file',
          size: 4096,
          category: 'documentation',
          content: '# Project README',
          cognitiveAnalysis: {
            summary: 'Comprehensive project documentation',
            keywords: ['setup', 'usage', 'api'],
            insights: ['Clear installation instructions', 'Good examples'],
            recommendations: ['Add troubleshooting section']
          }
        }
      ],
      totalSize: 6144,
      fileTypeDistribution: {
        'code': 1,
        'documentation': 1
      }
    };
  }

  async analyzeFilesManual(filePaths: string[], _analysisMode: string): Promise<FileAnalysisResult[]> {
    await this.delay(1000);
    
    return filePaths.map((path, i) => ({
      path,
      name: path.split('/').pop() || path,
      type: 'file',
      size: 1024 * (i + 1),
      category: path.endsWith('.ts') ? 'code' : 'document',
      cognitiveAnalysis: {
        summary: `Analysis of ${path}`,
        keywords: ['mock', 'test', 'demo'],
        insights: [`File ${i + 1} shows interesting patterns`],
        recommendations: [`Consider refactoring section ${i + 1}`]
      }
    }));
  }

  async uploadDocuments(documents: any[], _options?: any): Promise<DocumentBatch> {
    await this.delay(2000);
    
    const batch: DocumentBatch = {
      id: `batch-${Date.now()}`,
      name: _options?.batchName || `Batch ${new Date().toLocaleString()}`,
      documents: documents.map((doc, i) => ({
        id: `doc-${Date.now()}-${i}`,
        filename: doc.filename,
        mimeType: doc.mimeType || 'text/plain',
        sizeBytes: doc.content.length,
        content: doc.content,
        contentHash: this.hashString(doc.content),
        category: this.categorizeFile(doc.filename),
        addedAt: new Date(),
        metadata: doc.metadata,
        analysis: {
          summary: `Processed ${doc.filename}`,
          insights: ['Document contains valuable information', 'Well-structured content'],
          keywords: ['demo', 'test', 'mock']
        }
      })),
      createdAt: new Date(),
      totalSize: documents.reduce((sum, doc) => sum + doc.content.length, 0),
      documentCount: documents.length
    };
    
    this.mockDocumentBatches.push(batch);
    return batch;
  }

  async createKnowledgeBase(name: string, description: string, cognitiveSystemsEnabled?: string[]): Promise<KnowledgeBase> {
    await this.delay(500);
    
    const kb: KnowledgeBase = {
      id: `kb-${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      lastUpdated: new Date(),
      documentCount: 0,
      chunkCount: 0,
      cognitiveSystemsEnabled: cognitiveSystemsEnabled || ['harmonic_analysis', 'quantum_synthesis']
    };
    
    this.mockKnowledgeBases.push(kb);
    return kb;
  }

  async addDocumentsToKnowledgeBase(kbName: string, documents: any[], _options?: any): Promise<any> {
    await this.delay(1500);
    
    const kb = this.mockKnowledgeBases.find(k => k.id === kbName);
    if (kb) {
      kb.documentCount += documents.length;
      kb.chunkCount += documents.length * 5; // Mock 5 chunks per doc
      kb.lastUpdated = new Date();
    }
    
    // Store documents in our mock storage
    if (!this.mockDocumentsByKB[kbName]) {
      this.mockDocumentsByKB[kbName] = [];
    }
    
    const addedDocs = documents.map((doc, i) => ({
      id: `doc-${Date.now()}-${i}`,
      filename: doc.filename,
      category: doc.category || this.categorizeFile(doc.filename),
      sizeBytes: doc.content.length,
      wordCount: doc.content.split(/\s+/).filter((w: string) => w.length > 0).length,
      addedAt: new Date(),
      metadata: doc.metadata
    }));
    
    this.mockDocumentsByKB[kbName].push(...addedDocs);
    
    return {
      addedDocuments: documents,
      skippedDocuments: [],
      totalChunksCreated: documents.length * 5
    };
  }

  async queryKnowledgeBase(_kbName: string, query: string, _options?: any): Promise<QueryResult> {
    await this.delay(1200);
    
    return {
      query,
      answer: `Based on the knowledge base analysis, ${query} relates to several key concepts in your documents. The system has identified patterns suggesting optimal approaches involve considering both architectural design and implementation details.`,
      sources: [
        {
          documentName: 'architecture.md',
          chunkContent: 'The system architecture follows...',
          relevanceScore: 0.92
        },
        {
          documentName: 'implementation-guide.ts',
          chunkContent: 'Implementation best practices include...',
          relevanceScore: 0.87
        },
        {
          documentName: 'patterns.doc',
          chunkContent: 'Common patterns observed in the codebase...',
          relevanceScore: 0.85
        }
      ],
      cognitiveInsights: [
        'Cross-referenced patterns suggest modular design approach',
        'Harmonic analysis reveals recurring optimization opportunities',
        'Quantum synthesis indicates potential for parallel processing'
      ],
      retrievalMetrics: {
        chunksRetrieved: 15,
        avgRelevanceScore: 0.88,
        processingTimeMs: 1200
      }
    };
  }

  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    await this.delay(300);
    return this.mockKnowledgeBases;
  }

  async getKnowledgeBaseInfo(kbName: string): Promise<any> {
    await this.delay(500);
    
    const kb = this.mockKnowledgeBases.find(k => k.id === kbName);
    if (!kb) throw new Error('Knowledge base not found');
    
    return {
      knowledgeBase: kb,
      statistics: {
        totalDocuments: kb.documentCount,
        totalChunks: kb.chunkCount,
        totalSizeBytes: kb.documentCount * 50000, // Mock 50KB per doc
        categoryDistribution: {
          'documentation': Math.floor(kb.documentCount * 0.4),
          'code': Math.floor(kb.documentCount * 0.4),
          'configuration': Math.floor(kb.documentCount * 0.2)
        },
        avgDocumentSize: 50000,
        avgChunksPerDocument: kb.documentCount > 0 ? kb.chunkCount / kb.documentCount : 0
      }
    };
  }

  async deleteKnowledgeBase(kbName: string, confirm: boolean): Promise<void> {
    if (!confirm) throw new Error('Deletion must be confirmed');
    
    await this.delay(500);
    this.mockKnowledgeBases = this.mockKnowledgeBases.filter(kb => kb.id !== kbName);
    // Also remove associated documents
    delete this.mockDocumentsByKB[kbName];
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
    await this.delay(300);
    
    // Return mock documents for the knowledge base
    const documents = this.mockDocumentsByKB[kbName] || [];
    
    // If it's one of our pre-existing KBs, generate some sample docs
    if (documents.length === 0 && (kbName === 'kb-1' || kbName === 'kb-2')) {
      const sampleDocs = kbName === 'kb-1' ? [
        { filename: 'README.md', category: 'documentation', size: 5120 },
        { filename: 'architecture.md', category: 'documentation', size: 8192 },
        { filename: 'api-guide.md', category: 'documentation', size: 6144 },
        { filename: 'setup.md', category: 'documentation', size: 3072 },
        { filename: 'troubleshooting.md', category: 'documentation', size: 4096 }
      ] : [
        { filename: 'index.ts', category: 'code', size: 4096 },
        { filename: 'utils.ts', category: 'code', size: 2048 },
        { filename: 'components.tsx', category: 'code', size: 6144 },
        { filename: 'types.ts', category: 'code', size: 1024 },
        { filename: 'config.json', category: 'configuration', size: 512 }
      ];
      
      return sampleDocs.map((doc, i) => ({
        id: `doc-${kbName}-${i}`,
        filename: doc.filename,
        category: doc.category,
        sizeBytes: doc.size,
        wordCount: Math.floor(doc.size / 5), // Rough estimate
        addedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        metadata: { source: 'sample' }
      }));
    }
    
    return documents;
  }

  async deleteDocumentFromKnowledgeBase(kbName: string, documentId: string): Promise<void> {
    await this.delay(300);
    
    if (this.mockDocumentsByKB[kbName]) {
      this.mockDocumentsByKB[kbName] = this.mockDocumentsByKB[kbName].filter(
        doc => doc.id !== documentId
      );
      
      // Update KB document count
      const kb = this.mockKnowledgeBases.find(k => k.id === kbName);
      if (kb) {
        kb.documentCount = Math.max(0, kb.documentCount - 1);
        kb.lastUpdated = new Date();
      }
    }
  }

  async openFileDialog(options?: any): Promise<string | string[] | null> {
    // Create a hidden file input element
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple || false;
      
      if (options?.filters && options.filters.length > 0) {
        const extensions = options.filters
          .flatMap((f: any) => f.extensions)
          .filter((ext: string) => ext !== '*')
          .map((ext: string) => `.${ext}`);
        if (extensions.length > 0) {
          input.accept = extensions.join(',');
        }
      }
      
      input.onchange = () => {
        const files = Array.from(input.files || []);
        if (files.length === 0) {
          resolve(null);
        } else if (options?.multiple) {
          // Return mock paths since we can't get real paths in browser
          resolve(files.map(f => `/mock/path/${f.name}`));
        } else {
          resolve(`/mock/path/${files[0].name}`);
        }
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  }

  async openFolderDialog(): Promise<string | null> {
    // Create a hidden input element that accepts directories
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      // This allows folder selection in modern browsers
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = false;
      
      input.onchange = () => {
        const files = Array.from(input.files || []);
        if (files.length > 0) {
          // Get the common directory path from the first file
          const firstFilePath = files[0].webkitRelativePath || files[0].name;
          const folderName = firstFilePath.split('/')[0];
          resolve(`/mock/folder/${folderName}`);
        } else {
          resolve(null);
        }
      };
      
      // Handle cancel
      input.addEventListener('cancel', () => {
        resolve(null);
      });
      
      // Some browsers don't support the cancel event, so we use a trick
      window.addEventListener('focus', function onFocus() {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            resolve(null);
          }
        }, 300);
      });
      
      input.click();
    });
  }

  async readFileAsBase64(filePath: string): Promise<string> {
    // In a real implementation, this would read the actual file
    // For mock, we'll return sample content based on file type
    const ext = filePath.split('.').pop()?.toLowerCase();
    let content = '';
    
    switch (ext) {
      case 'ts':
      case 'js':
        content = `// Sample TypeScript file: ${filePath}\nexport function example() {\n  console.log('Hello from ${filePath}');\n}`;
        break;
      case 'md':
        content = `# Sample Markdown: ${filePath}\n\nThis is a sample markdown file with **bold** and *italic* text.`;
        break;
      case 'json':
        content = `{\n  "name": "${filePath}",\n  "type": "sample",\n  "version": "1.0.0"\n}`;
        break;
      default:
        content = `Sample content for ${filePath}`;
    }
    
    return btoa(content);
  }

  async scanDirectory(dirPath: string): Promise<any> {
    await this.delay(500);
    // Mock file tree
    return {
      path: dirPath,
      name: dirPath.split('/').pop() || 'folder',
      type: 'directory',
      size: 0,
      expanded: true,
      checked: false,
      children: [
        {
          path: `${dirPath}/src`,
          name: 'src',
          type: 'directory',
          size: 0,
          expanded: false,
          checked: false,
          children: []
        },
        {
          path: `${dirPath}/README.md`,
          name: 'README.md',
          type: 'file',
          size: 2048,
          checked: false
        },
        {
          path: `${dirPath}/package.json`,
          name: 'package.json',
          type: 'file',
          size: 1024,
          checked: false
        }
      ]
    };
  }

  // Helper methods
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private categorizeFile(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp'].includes(ext || '')) return 'code';
    if (['md', 'txt', 'doc', 'docx'].includes(ext || '')) return 'documentation';
    if (['json', 'yaml', 'yml', 'toml', 'ini'].includes(ext || '')) return 'configuration';
    return 'other';
  }
}

// Export singleton instance
export const guruMockService = new GuruMockIntegrationService();