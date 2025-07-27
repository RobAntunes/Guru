/**
 * Direct RAG Knowledge Base Manager for Guru
 * Provides RAG capabilities without MCP dependency
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import Database from 'better-sqlite3';
import { GuruEnhanced } from '../core/guru-enhanced';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine';

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

export interface Document {
  id: string;
  filename: string;
  content: string;
  contentHash: string;
  category: string;
  sizeBytes: number;
  wordCount: number;
  addedAt: Date;
  metadata?: Record<string, any>;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  contentHash: string;
  startPosition: number;
  endPosition: number;
  vectorEmbedding: number[];
  createdAt: Date;
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

export class KnowledgeBaseManager {
  private guru: GuruEnhanced;
  private quantumMemory: QuantumProbabilityFieldMemory;
  private harmonicEngine: HarmonicAnalysisEngine;
  private kbDirectory: string;
  private chunkSize: number = 1000;
  private chunkOverlap: number = 200;
  private maxRetrievalChunks: number = 10;

  constructor(guru: GuruEnhanced) {
    this.guru = guru;
    this.quantumMemory = new QuantumProbabilityFieldMemory({
      dimensions: 512,
      fieldStrength: 0.8,
      coherenceThreshold: 0.6
    });
    this.harmonicEngine = new HarmonicAnalysisEngine();
    this.kbDirectory = path.join(process.env.HOME || '', '.guru', 'knowledge_bases');
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(
    name: string,
    description: string,
    cognitiveSystemsEnabled: string[] = ['harmonic_analysis', 'quantum_synthesis']
  ): Promise<KnowledgeBase> {
    // Ensure KB directory exists
    await fs.mkdir(this.kbDirectory, { recursive: true });

    // Sanitize name for filesystem
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const kbPath = path.join(this.kbDirectory, safeName);

    // Check if already exists
    try {
      await fs.access(kbPath);
      throw new Error(`Knowledge base '${name}' already exists`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create KB directory structure
    await fs.mkdir(kbPath, { recursive: true });
    await fs.mkdir(path.join(kbPath, 'documents'));
    await fs.mkdir(path.join(kbPath, 'chunks'));
    await fs.mkdir(path.join(kbPath, 'vectors'));

    // Initialize database
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    // Create tables
    this.initializeDatabase(db);

    // Create KB metadata
    const kb: KnowledgeBase = {
      id: safeName,
      name,
      description,
      createdAt: new Date(),
      lastUpdated: new Date(),
      documentCount: 0,
      chunkCount: 0,
      cognitiveSystemsEnabled
    };

    // Save metadata
    const configPath = path.join(kbPath, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(kb, null, 2));

    // Insert into database metadata
    db.prepare(`
      INSERT INTO metadata (key, value) VALUES 
      ('kb_name', ?),
      ('description', ?),
      ('cognitive_systems', ?),
      ('created_at', ?),
      ('version', '1.0')
    `).run(name, description, JSON.stringify(cognitiveSystemsEnabled), kb.createdAt.toISOString());

    db.close();

    return kb;
  }

  /**
   * Add documents to a knowledge base
   */
  async addDocuments(
    kbName: string,
    documents: Array<{
      filename: string;
      content: string;
      category?: string;
      metadata?: Record<string, any>;
    }>,
    options: {
      enableCognitiveAnalysis?: boolean;
      chunkDocuments?: boolean;
    } = {}
  ): Promise<{
    addedDocuments: Document[];
    skippedDocuments: string[];
    totalChunksCreated: number;
  }> {
    const { enableCognitiveAnalysis = true, chunkDocuments = true } = options;

    const kbPath = await this.getKnowledgeBasePath(kbName);
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    const addedDocuments: Document[] = [];
    const skippedDocuments: string[] = [];
    let totalChunksCreated = 0;

    for (const doc of documents) {
      try {
        // Check if document already exists
        const contentHash = this.hashContent(doc.content);
        const existing = db.prepare('SELECT id FROM documents WHERE content_hash = ?').get(contentHash);

        if (existing) {
          skippedDocuments.push(doc.filename);
          continue;
        }

        // Create document
        const document: Document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: doc.filename,
          content: doc.content,
          contentHash,
          category: doc.category || this.categorizeContent(doc.filename, doc.content),
          sizeBytes: Buffer.byteLength(doc.content, 'utf-8'),
          wordCount: doc.content.split(/\s+/).filter(w => w.length > 0).length,
          addedAt: new Date(),
          metadata: doc.metadata
        };

        // Insert document
        db.prepare(`
          INSERT INTO documents (id, filename, content_hash, content, category, size_bytes, word_count, added_at, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          document.id,
          document.filename,
          document.contentHash,
          document.content,
          document.category,
          document.sizeBytes,
          document.wordCount,
          document.addedAt.toISOString(),
          JSON.stringify(document.metadata || {})
        );

        // Create chunks if requested
        if (chunkDocuments) {
          const chunks = this.createChunks(document.content);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkId = `chunk-${Date.now()}-${i}`;
            const embedding = await this.createEmbedding(chunk.content);

            db.prepare(`
              INSERT INTO chunks (id, document_id, chunk_index, content, content_hash, start_position, end_position, vector_embedding, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              chunkId,
              document.id,
              i,
              chunk.content,
              this.hashContent(chunk.content),
              chunk.start,
              chunk.end,
              JSON.stringify(embedding),
              new Date().toISOString()
            );

            totalChunksCreated++;

            // Apply cognitive analysis if enabled
            if (enableCognitiveAnalysis) {
              await this.applyCognitiveAnalysis(db, document.id, chunkId, chunk.content);
            }
          }
        }

        addedDocuments.push(document);
      } catch (error) {
        console.error(`Error adding document ${doc.filename}:`, error);
        skippedDocuments.push(doc.filename);
      }
    }

    // Update KB metadata
    const config = await this.loadKnowledgeBaseConfig(kbPath);
    config.documentCount += addedDocuments.length;
    config.chunkCount += totalChunksCreated;
    config.lastUpdated = new Date();
    await fs.writeFile(path.join(kbPath, 'config.json'), JSON.stringify(config, null, 2));

    db.close();

    return {
      addedDocuments,
      skippedDocuments,
      totalChunksCreated
    };
  }

  /**
   * Query a knowledge base
   */
  async query(
    kbName: string,
    query: string,
    options: {
      maxResults?: number;
      includeCognitiveInsights?: boolean;
      responseMode?: 'comprehensive' | 'concise' | 'analytical';
    } = {}
  ): Promise<QueryResult> {
    const {
      maxResults = this.maxRetrievalChunks,
      includeCognitiveInsights = true,
      responseMode = 'comprehensive'
    } = options;

    const startTime = Date.now();

    const kbPath = await this.getKnowledgeBasePath(kbName);
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    // Create query embedding
    const queryEmbedding = await this.createEmbedding(query);

    // Retrieve relevant chunks
    const relevantChunks = await this.retrieveRelevantChunks(db, queryEmbedding, maxResults);

    if (relevantChunks.length === 0) {
      db.close();
      return {
        query,
        answer: 'No relevant information found in the knowledge base.',
        sources: [],
        retrievalMetrics: {
          chunksRetrieved: 0,
          avgRelevanceScore: 0,
          processingTimeMs: Date.now() - startTime
        }
      };
    }

    // Generate answer using retrieved context
    const answer = await this.generateAnswer(query, relevantChunks, responseMode);

    // Get cognitive insights if requested
    let cognitiveInsights: string[] = [];
    if (includeCognitiveInsights) {
      cognitiveInsights = await this.generateCognitiveInsights(query, relevantChunks);
    }

    db.close();

    // Calculate metrics
    const avgRelevanceScore = relevantChunks.reduce((sum, chunk) => sum + chunk.score, 0) / relevantChunks.length;

    return {
      query,
      answer,
      sources: relevantChunks.map(chunk => ({
        documentName: chunk.filename,
        chunkContent: chunk.content.substring(0, 200) + '...',
        relevanceScore: chunk.score
      })),
      cognitiveInsights,
      retrievalMetrics: {
        chunksRetrieved: relevantChunks.length,
        avgRelevanceScore,
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      await fs.access(this.kbDirectory);
    } catch {
      return [];
    }

    const entries = await fs.readdir(this.kbDirectory, { withFileTypes: true });
    const knowledgeBases: KnowledgeBase[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const configPath = path.join(this.kbDirectory, entry.name, 'config.json');
          const configData = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configData);
          knowledgeBases.push({
            ...config,
            createdAt: new Date(config.createdAt),
            lastUpdated: new Date(config.lastUpdated)
          });
        } catch (error) {
          console.error(`Error loading KB ${entry.name}:`, error);
        }
      }
    }

    return knowledgeBases;
  }

  /**
   * Get information about a specific knowledge base
   */
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
    const kbPath = await this.getKnowledgeBasePath(kbName);
    const config = await this.loadKnowledgeBaseConfig(kbPath);
    
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    // Get statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(size_bytes) as total_size_bytes,
        AVG(size_bytes) as avg_document_size,
        SUM(word_count) as total_words
      FROM documents
    `).get() as any;

    const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks').get() as any;

    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM documents 
      GROUP BY category
    `).all() as any[];

    const categoryDistribution: Record<string, number> = {};
    for (const cat of categories) {
      categoryDistribution[cat.category] = cat.count;
    }

    db.close();

    return {
      knowledgeBase: config,
      statistics: {
        totalDocuments: stats.total_documents || 0,
        totalChunks: chunkCount.count || 0,
        totalSizeBytes: stats.total_size_bytes || 0,
        categoryDistribution,
        avgDocumentSize: stats.avg_document_size || 0,
        avgChunksPerDocument: stats.total_documents ? chunkCount.count / stats.total_documents : 0
      }
    };
  }

  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(kbName: string, confirm: boolean = false): Promise<void> {
    if (!confirm) {
      throw new Error('Deletion must be confirmed');
    }

    const kbPath = await this.getKnowledgeBasePath(kbName);
    await fs.rm(kbPath, { recursive: true, force: true });
  }

  /**
   * Update knowledge base configuration
   */
  async updateKnowledgeBase(
    kbName: string,
    updates: {
      description?: string;
      cognitiveSystemsEnabled?: string[];
    }
  ): Promise<KnowledgeBase> {
    const kbPath = await this.getKnowledgeBasePath(kbName);
    const config = await this.loadKnowledgeBaseConfig(kbPath);

    if (updates.description !== undefined) {
      config.description = updates.description;
    }

    if (updates.cognitiveSystemsEnabled !== undefined) {
      config.cognitiveSystemsEnabled = updates.cognitiveSystemsEnabled;
    }

    config.lastUpdated = new Date();

    await fs.writeFile(path.join(kbPath, 'config.json'), JSON.stringify(config, null, 2));

    return config;
  }

  /**
   * List all documents in a knowledge base
   */
  async listDocuments(kbName: string): Promise<Document[]> {
    const kbPath = await this.getKnowledgeBasePath(kbName);
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    try {
      const documents = db.prepare(`
        SELECT id, filename, content_hash, content, category, size_bytes, word_count, added_at, metadata
        FROM documents
        ORDER BY added_at DESC
      `).all() as any[];

      return documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        content: doc.content,
        contentHash: doc.content_hash,
        category: doc.category,
        sizeBytes: doc.size_bytes,
        wordCount: doc.word_count,
        addedAt: new Date(doc.added_at),
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined
      }));
    } finally {
      db.close();
    }
  }

  /**
   * Delete a document from knowledge base
   */
  async deleteDocument(kbName: string, documentId: string): Promise<void> {
    const kbPath = await this.getKnowledgeBasePath(kbName);
    const dbPath = path.join(kbPath, 'knowledge_base.db');
    const db = new Database(dbPath);

    try {
      // Delete chunks first (foreign key constraint)
      db.prepare('DELETE FROM chunks WHERE document_id = ?').run(documentId);
      
      // Delete cognitive analysis
      db.prepare('DELETE FROM cognitive_analysis WHERE document_id = ?').run(documentId);
      
      // Delete document
      const result = db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
      
      if (result.changes === 0) {
        throw new Error('Document not found');
      }

      // Update knowledge base stats
      const config = await this.loadKnowledgeBaseConfig(kbPath);
      config.documentCount = Math.max(0, config.documentCount - 1);
      config.chunkCount = Math.max(0, config.chunkCount - 5); // Rough estimate
      config.lastUpdated = new Date();
      await fs.writeFile(path.join(kbPath, 'config.json'), JSON.stringify(config, null, 2));
    } finally {
      db.close();
    }
  }

  // Private helper methods

  private initializeDatabase(db: Database): void {
    // Metadata table
    db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content_hash TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        size_bytes INTEGER,
        word_count INTEGER,
        added_at TEXT,
        metadata TEXT
      )
    `);

    // Chunks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT,
        chunk_index INTEGER,
        content TEXT NOT NULL,
        content_hash TEXT UNIQUE NOT NULL,
        start_position INTEGER,
        end_position INTEGER,
        vector_embedding TEXT,
        created_at TEXT,
        FOREIGN KEY (document_id) REFERENCES documents (id)
      )
    `);

    // Cognitive analysis table
    db.exec(`
      CREATE TABLE IF NOT EXISTS cognitive_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT,
        chunk_id TEXT,
        system_name TEXT NOT NULL,
        analysis_result TEXT,
        confidence_score REAL,
        created_at TEXT,
        FOREIGN KEY (document_id) REFERENCES documents (id),
        FOREIGN KEY (chunk_id) REFERENCES chunks (id)
      )
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id);
      CREATE INDEX IF NOT EXISTS idx_chunks_content_hash ON chunks (content_hash);
      CREATE INDEX IF NOT EXISTS idx_cognitive_analysis_document_id ON cognitive_analysis (document_id);
    `);
  }

  private async getKnowledgeBasePath(kbName: string): Promise<string> {
    const safeName = kbName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const kbPath = path.join(this.kbDirectory, safeName);

    try {
      await fs.access(kbPath);
      return kbPath;
    } catch {
      throw new Error(`Knowledge base '${kbName}' not found`);
    }
  }

  private async loadKnowledgeBaseConfig(kbPath: string): Promise<KnowledgeBase> {
    const configPath = path.join(kbPath, 'config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    return {
      ...config,
      createdAt: new Date(config.createdAt),
      lastUpdated: new Date(config.lastUpdated)
    };
  }

  private createChunks(content: string): Array<{ content: string; start: number; end: number }> {
    const chunks: Array<{ content: string; start: number; end: number }> = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + this.chunkSize, content.length);

      // Try to end at sentence boundary
      if (end < content.length) {
        const lastSentenceEnd = Math.max(
          content.lastIndexOf('.', end),
          content.lastIndexOf('!', end),
          content.lastIndexOf('?', end)
        );

        if (lastSentenceEnd > start + this.chunkSize / 2) {
          end = lastSentenceEnd + 1;
        }
      }

      const chunkContent = content.substring(start, end).trim();
      if (chunkContent) {
        chunks.push({
          content: chunkContent,
          start,
          end
        });
      }

      start = Math.max(start + this.chunkSize - this.chunkOverlap, end);
    }

    return chunks;
  }

  private async createEmbedding(text: string): Promise<number[]> {
    // Simple embedding based on word frequency
    // In production, use proper embeddings (e.g., sentence-transformers)
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};

    for (const word of words) {
      if (word.length > 2 && /^[a-z]+$/.test(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    // Create fixed-size vector
    const vectorSize = 64;
    const vector = new Array(vectorSize).fill(0);

    // Map words to vector positions
    for (const [word, freq] of Object.entries(wordFreq)) {
      const hash = this.simpleHash(word) % vectorSize;
      vector[hash] += freq / words.length;
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  private async retrieveRelevantChunks(
    db: Database,
    queryEmbedding: number[],
    maxResults: number
  ): Promise<Array<{
    id: string;
    content: string;
    documentId: string;
    filename: string;
    score: number;
  }>> {
    // Get all chunks with embeddings
    const chunks = db.prepare(`
      SELECT c.id, c.content, c.vector_embedding, c.document_id, d.filename
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
    `).all() as any[];

    // Calculate similarities
    const scoredChunks = chunks.map(chunk => {
      const embedding = JSON.parse(chunk.vector_embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      return {
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.document_id,
        filename: chunk.filename,
        score: similarity
      };
    });

    // Sort by score and return top results
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .filter(chunk => chunk.score > 0.1);
  }

  private async generateAnswer(
    query: string,
    relevantChunks: any[],
    responseMode: string
  ): Promise<string> {
    // Compile context
    const context = relevantChunks
      .map(chunk => `[${chunk.filename}]: ${chunk.content}`)
      .join('\n\n');

    // Use quantum synthesis for answer generation
    await this.quantumMemory.addMemory({
      id: `query-${Date.now()}`,
      content: context,
      timestamp: new Date(),
      context: { query },
      metadata: { responseMode }
    });

    const synthesisResult = await this.quantumMemory.synthesize(query);

    // Format answer based on mode
    let answer = synthesisResult.insights.join(' ');

    if (responseMode === 'comprehensive') {
      answer = `Based on the knowledge base:\n\n${answer}\n\nThis answer synthesizes information from ${relevantChunks.length} relevant sources.`;
    } else if (responseMode === 'concise') {
      answer = answer.substring(0, 500) + (answer.length > 500 ? '...' : '');
    }

    return answer;
  }

  private async generateCognitiveInsights(
    query: string,
    relevantChunks: any[]
  ): Promise<string[]> {
    const insights: string[] = [];

    // Use quantum synthesis for cross-connections
    const quantumResult = await this.quantumMemory.synthesize(
      `Find insights and connections for: ${query}`,
      { maxInsights: 3 }
    );

    insights.push(...quantumResult.insights);

    // Use harmonic analysis for patterns
    const combinedContent = relevantChunks.map(c => c.content).join('\n');
    const harmonicPatterns = await this.harmonicEngine.analyzeHarmonicPatterns(combinedContent);

    if (harmonicPatterns.dominantFrequencies.length > 0) {
      insights.push('Detected recurring patterns across retrieved information');
    }

    return insights.slice(0, 5);
  }

  private async applyCognitiveAnalysis(
    db: Database,
    documentId: string,
    chunkId: string,
    content: string
  ): Promise<void> {
    try {
      // Harmonic analysis
      const harmonicResult = await this.harmonicEngine.analyzeHarmonicPatterns(content);
      
      db.prepare(`
        INSERT INTO cognitive_analysis (document_id, chunk_id, system_name, analysis_result, confidence_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        documentId,
        chunkId,
        'harmonic_analysis',
        JSON.stringify(harmonicResult),
        0.8,
        new Date().toISOString()
      );

      // Quantum synthesis (for substantial chunks)
      if (content.length > 200) {
        await this.quantumMemory.addMemory({
          id: chunkId,
          content: content.substring(0, 500),
          timestamp: new Date(),
          context: { documentId },
          metadata: { chunkId }
        });

        const quantumResult = await this.quantumMemory.synthesize(
          'Extract key insights from chunk'
        );

        db.prepare(`
          INSERT INTO cognitive_analysis (document_id, chunk_id, system_name, analysis_result, confidence_score, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          documentId,
          chunkId,
          'quantum_synthesis',
          JSON.stringify(quantumResult),
          0.85,
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error(`Cognitive analysis failed for chunk ${chunkId}:`, error);
    }
  }

  private categorizeContent(filename: string, content: string): string {
    const lowerName = filename.toLowerCase();

    if (['.js', '.ts', '.py', '.java', '.cpp', '.c'].some(ext => lowerName.endsWith(ext))) {
      return 'code';
    }

    if (['.md', '.txt'].some(ext => lowerName.endsWith(ext)) || lowerName.includes('readme')) {
      return 'documentation';
    }

    if (['.json', '.yaml', '.yml', '.toml', '.ini'].some(ext => lowerName.endsWith(ext))) {
      return 'configuration';
    }

    if (['.csv', '.xml'].some(ext => lowerName.endsWith(ext))) {
      return 'data';
    }

    return 'document';
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }
}