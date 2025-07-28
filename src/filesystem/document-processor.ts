/**
 * Direct Document Processor for Guru
 * Provides document upload and analysis capabilities without MCP dependency
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { GuruEnhanced } from '../core/guru-enhanced';
import { HarmonicAnalysisEngine } from '../harmonic-intelligence/core/harmonic-analysis-engine';
import { QuantumProbabilityFieldMemory } from '../memory/quantum-memory-system';

export interface DocumentInput {
  filename: string;
  content: string;
  mimeType?: string;
  encoding?: string;
  isBase64?: boolean;
  category?: string;
  metadata?: Record<string, any>;
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  content: string;
  size: number;
  wordCount: number;
  lineCount: number;
  category: string;
  contentHash: string;
  insights: string[];
  cognitiveAnalysis?: any;
  recommendations?: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface DocumentBatch {
  id: string;
  name: string;
  documents: ProcessedDocument[];
  totalSize: number;
  categories: Record<string, number>;
  crossDocumentInsights: string[];
  knowledgeExtraction: {
    keyConcepts: Array<{ concept: string; frequency: number; documents: string[] }>;
    relationships: Array<{ from: string; to: string; type: string; strength: number }>;
    summaries: Array<{ document: string; summary: string }>;
  };
}

export class DocumentProcessor {
  private guru: GuruEnhanced;
  private harmonicEngine: HarmonicAnalysisEngine;
  private quantumMemory: QuantumProbabilityFieldMemory;
  private tempDir: string;

  constructor(guru: GuruEnhanced) {
    this.guru = guru;
    this.harmonicEngine = new HarmonicAnalysisEngine();
    this.quantumMemory = new QuantumProbabilityFieldMemory({
      dimensions: 512,
      fieldStrength: 0.8,
      coherenceThreshold: 0.6
    });
    this.tempDir = path.join(process.env.TMPDIR || '/tmp', 'guru-documents');
  }

  /**
   * Process uploaded documents with cognitive enhancement
   */
  async processDocuments(
    documents: DocumentInput[],
    options: {
      analysisMode?: 'comprehensive' | 'focused' | 'comparative';
      enableCognitiveAnalysis?: boolean;
      preserveFiles?: boolean;
      batchName?: string;
    } = {}
  ): Promise<DocumentBatch> {
    const {
      analysisMode = 'comprehensive',
      enableCognitiveAnalysis = true,
      preserveFiles = false,
      batchName = `batch-${Date.now()}`
    } = options;

    // Ensure temp directory exists
    await fs.mkdir(this.tempDir, { recursive: true });

    const processedDocuments: ProcessedDocument[] = [];

    // Process each document
    for (const doc of documents) {
      const processed = await this.processDocument(doc, enableCognitiveAnalysis);
      if (processed) {
        processedDocuments.push(processed);

        // Save to temp if requested
        if (preserveFiles) {
          const tempPath = path.join(this.tempDir, batchName, processed.filename);
          await fs.mkdir(path.dirname(tempPath), { recursive: true });
          await fs.writeFile(tempPath, processed.content);
        }
      }
    }

    // Perform batch analysis
    const batch: DocumentBatch = {
      id: `batch-${Date.now()}`,
      name: batchName,
      documents: processedDocuments,
      totalSize: processedDocuments.reduce((sum, doc) => sum + doc.size, 0),
      categories: this.calculateCategoryDistribution(processedDocuments),
      crossDocumentInsights: [],
      knowledgeExtraction: {
        keyConcepts: [],
        relationships: [],
        summaries: []
      }
    };

    // Cross-document analysis
    if (analysisMode === 'comprehensive' || analysisMode === 'comparative') {
      batch.crossDocumentInsights = await this.performCrossDocumentAnalysis(processedDocuments);
      batch.knowledgeExtraction = await this.extractKnowledge(processedDocuments);
    }

    // Clean up temp files if not preserving
    if (!preserveFiles) {
      await this.cleanupTempFiles(batchName);
    }

    return batch;
  }

  /**
   * Process a single document
   */
  private async processDocument(
    input: DocumentInput,
    enableCognitiveAnalysis: boolean
  ): Promise<ProcessedDocument | null> {
    try {
      // Decode content if base64
      let content = input.content;
      if (input.isBase64) {
        content = Buffer.from(content, 'base64').toString(input.encoding || 'utf-8');
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        return null;
      }

      // Calculate metrics
      const size = Buffer.byteLength(content, 'utf-8');
      const lines = content.split('\n');
      const words = content.split(/\s+/).filter(w => w.length > 0);
      const contentHash = this.hashContent(content);

      // Determine category
      const category = input.category || this.categorizeContent(input.filename, content);

      // Create processed document
      const processed: ProcessedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: input.filename,
        content,
        size,
        wordCount: words.length,
        lineCount: lines.length,
        category,
        contentHash,
        insights: []
      };

      // Perform cognitive analysis
      if (enableCognitiveAnalysis) {
        processed.cognitiveAnalysis = await this.performCognitiveAnalysis(content, category);
        processed.insights = this.generateInsights(processed);
        processed.recommendations = this.generateRecommendations(processed);
      }

      return processed;
    } catch (error) {
      console.error(`Error processing document ${input.filename}:`, error);
      return null;
    }
  }

  /**
   * Categorize content based on filename and content analysis
   */
  private categorizeContent(filename: string, content: string): string {
    const lowerName = filename.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Code detection
    if (this.isCode(filename, content)) {
      return 'code';
    }

    // Documentation detection
    if (lowerName.includes('readme') || lowerName.endsWith('.md') || 
        content.includes('# ') || content.includes('## ')) {
      return 'documentation';
    }

    // Configuration detection
    if (['.json', '.yaml', '.yml', '.toml', '.ini'].some(ext => lowerName.endsWith(ext))) {
      return 'configuration';
    }

    // Data detection
    if (['.csv', '.tsv', '.xml'].some(ext => lowerName.endsWith(ext))) {
      return 'data';
    }

    // Academic detection
    if (['abstract', 'introduction', 'methodology', 'results', 'conclusion', 'references']
        .some(keyword => lowerContent.includes(keyword))) {
      return 'academic';
    }

    // Business detection
    if (['executive summary', 'business plan', 'proposal', 'requirements']
        .some(keyword => lowerContent.includes(keyword))) {
      return 'business';
    }

    return 'document';
  }

  /**
   * Check if content is code
   */
  private isCode(filename: string, content: string): boolean {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.dart'
    ];

    if (codeExtensions.some(ext => filename.endsWith(ext))) {
      return true;
    }

    const codeIndicators = [
      'function ', 'def ', 'class ', 'import ', '#include',
      'public class', 'namespace ', 'package ', 'const ', 'let ', 'var '
    ];

    return codeIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Perform cognitive analysis on content
   */
  private async performCognitiveAnalysis(content: string, category: string): Promise<any> {
    // Harmonic analysis
    const harmonicPatterns = await this.harmonicEngine.analyzeHarmonicPatterns(
      content.substring(0, 5000) // Limit for performance
    );

    // Add to quantum memory
    await this.quantumMemory.addMemory({
      id: `doc-${Date.now()}`,
      content: content.substring(0, 2000),
      timestamp: new Date(),
      context: { category },
      metadata: { contentLength: content.length }
    });

    // Quantum synthesis
    const quantumInsights = await this.quantumMemory.synthesize(
      `Extract key insights from ${category} document`
    );

    return {
      harmonicPatterns,
      quantumInsights,
      category
    };
  }

  /**
   * Generate insights for a processed document
   */
  private generateInsights(doc: ProcessedDocument): string[] {
    const insights: string[] = [];

    // Size insights
    insights.push(`Document contains ${doc.wordCount} words across ${doc.lineCount} lines`);

    // Category-specific insights
    switch (doc.category) {
      case 'code':
        const functions = (doc.content.match(/function |def |class /g) || []).length;
        if (functions > 0) {
          insights.push(`Code contains approximately ${functions} functions or classes`);
        }
        break;

      case 'documentation':
        const headers = (doc.content.match(/^#+\s/gm) || []).length;
        if (headers > 0) {
          insights.push(`Documentation has ${headers} sections`);
        }
        break;

      case 'data':
        if (doc.content.includes(',') && doc.content.includes('\n')) {
          insights.push('Structured data format detected');
        }
        break;
    }

    // Cognitive insights
    if (doc.cognitiveAnalysis?.harmonicPatterns?.dominantFrequencies?.length > 0) {
      insights.push('Detected recurring patterns in content structure');
    }

    if (doc.cognitiveAnalysis?.quantumInsights?.insights?.length > 0) {
      insights.push(...doc.cognitiveAnalysis.quantumInsights.insights.slice(0, 2));
    }

    return insights;
  }

  /**
   * Generate recommendations for a document
   */
  private generateRecommendations(doc: ProcessedDocument): any[] {
    const recommendations = [];

    // Size recommendations
    if (doc.size > 100000) {
      recommendations.push({
        type: 'structure',
        title: 'Consider Breaking Down Large Document',
        description: `Document is ${(doc.size / 1024).toFixed(0)}KB - consider splitting into sections`,
        priority: 'medium' as const
      });
    }

    // Category-specific recommendations
    switch (doc.category) {
      case 'code':
        if (doc.wordCount / doc.lineCount < 5) {
          recommendations.push({
            type: 'quality',
            title: 'Add More Comments',
            description: 'Code appears to have minimal comments',
            priority: 'low' as const
          });
        }
        break;

      case 'documentation':
        if (!doc.content.includes('##')) {
          recommendations.push({
            type: 'structure',
            title: 'Add Section Headers',
            description: 'Documentation would benefit from clear section headers',
            priority: 'medium' as const
          });
        }
        break;
    }

    return recommendations;
  }

  /**
   * Perform cross-document analysis
   */
  private async performCrossDocumentAnalysis(documents: ProcessedDocument[]): Promise<string[]> {
    const insights: string[] = [];

    // Category distribution
    const categories = new Set(documents.map(d => d.category));
    if (categories.size > 1) {
      insights.push(`Mixed document types: ${Array.from(categories).join(', ')}`);
    }

    // Size variation
    const sizes = documents.map(d => d.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);

    if (maxSize / minSize > 10) {
      insights.push('Significant size variation between documents');
    }

    // Content similarity
    if (documents.length > 1 && documents.length <= 10) {
      let highSimilarity = 0;
      for (let i = 0; i < documents.length; i++) {
        for (let j = i + 1; j < documents.length; j++) {
          const similarity = this.calculateContentSimilarity(
            documents[i].content,
            documents[j].content
          );
          if (similarity > 0.7) {
            highSimilarity++;
          }
        }
      }

      if (highSimilarity > 0) {
        insights.push(`Found ${highSimilarity} pairs of highly similar documents`);
      }
    }

    return insights;
  }

  /**
   * Extract knowledge from documents
   */
  private async extractKnowledge(documents: ProcessedDocument[]): Promise<any> {
    const keyConcepts: Map<string, { frequency: number; documents: Set<string> }> = new Map();
    const relationships: any[] = [];
    const summaries: any[] = [];

    // Extract key concepts
    for (const doc of documents) {
      const words = doc.content.toLowerCase().split(/\s+/);
      const seen = new Set<string>();

      for (const word of words) {
        if (word.length > 4 && !seen.has(word) && /^[a-z]+$/.test(word)) {
          seen.add(word);
          const existing = keyConcepts.get(word) || { frequency: 0, documents: new Set() };
          existing.frequency++;
          existing.documents.add(doc.filename);
          keyConcepts.set(word, existing);
        }
      }

      // Generate summary
      const firstParagraph = doc.content.split('\n\n')[0];
      const summary = firstParagraph.substring(0, 200) + (firstParagraph.length > 200 ? '...' : '');
      summaries.push({
        document: doc.filename,
        summary
      });
    }

    // Convert to array and filter
    const conceptArray = Array.from(keyConcepts.entries())
      .filter(([_, data]) => data.frequency > 2)
      .map(([concept, data]) => ({
        concept,
        frequency: data.frequency,
        documents: Array.from(data.documents)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    // Extract relationships (simplified)
    for (let i = 0; i < conceptArray.length; i++) {
      for (let j = i + 1; j < conceptArray.length; j++) {
        const concept1 = conceptArray[i];
        const concept2 = conceptArray[j];
        
        // Check if concepts appear in same documents
        const sharedDocs = concept1.documents.filter(d => concept2.documents.includes(d));
        
        if (sharedDocs.length > 0) {
          relationships.push({
            from: concept1.concept,
            to: concept2.concept,
            type: 'co-occurrence',
            strength: sharedDocs.length / Math.max(concept1.documents.length, concept2.documents.length)
          });
        }
      }
    }

    return {
      keyConcepts: conceptArray,
      relationships: relationships.slice(0, 50),
      summaries
    };
  }

  /**
   * Calculate content similarity between two texts
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate category distribution
   */
  private calculateCategoryDistribution(documents: ProcessedDocument[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const doc of documents) {
      distribution[doc.category] = (distribution[doc.category] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Hash content for deduplication
   */
  private hashContent(content: string): string {
    // Simple hash for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(batchName: string): Promise<void> {
    try {
      const batchDir = path.join(this.tempDir, batchName);
      await fs.rm(batchDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}