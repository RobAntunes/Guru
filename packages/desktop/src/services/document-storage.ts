/**
 * Local document storage using Tauri's file system
 */

import { BaseDirectory, readTextFile, writeTextFile, mkdir as createDir, exists } from '@tauri-apps/plugin-fs';

interface StoredDocument {
  id: string;
  filename: string;
  content: string;
  category: string;
  isBase64: boolean;
  metadata?: any;
  addedAt: string;
  knowledgeBaseId: string;
}

class DocumentStorageService {
  private readonly STORAGE_DIR = 'knowledge_bases';
  private readonly DOCUMENTS_FILE = 'documents.json';

  /**
   * Initialize storage directory
   */
  private async ensureStorageDir(): Promise<void> {
    const dirExists = await exists(this.STORAGE_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await createDir(this.STORAGE_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
  }

  /**
   * Get all documents from storage
   */
  async getAllDocuments(): Promise<StoredDocument[]> {
    try {
      await this.ensureStorageDir();
      const filePath = `${this.STORAGE_DIR}/${this.DOCUMENTS_FILE}`;
      const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });
      
      if (!fileExists) {
        return [];
      }

      const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read documents:', error);
      return [];
    }
  }

  /**
   * Save all documents to storage
   */
  async saveAllDocuments(documents: StoredDocument[]): Promise<void> {
    try {
      await this.ensureStorageDir();
      const filePath = `${this.STORAGE_DIR}/${this.DOCUMENTS_FILE}`;
      await writeTextFile(filePath, JSON.stringify(documents, null, 2), { 
        baseDir: BaseDirectory.AppData 
      });
    } catch (error) {
      console.error('Failed to save documents:', error);
      throw error;
    }
  }

  /**
   * Add documents to a knowledge base
   */
  async addDocuments(knowledgeBaseId: string, documents: Array<{
    id: string;
    filename: string;
    content: string;
    category: string;
    isBase64: boolean;
    metadata?: any;
  }>): Promise<void> {
    const allDocs = await this.getAllDocuments();
    
    const newDocs: StoredDocument[] = documents.map(doc => ({
      ...doc,
      knowledgeBaseId,
      addedAt: new Date().toISOString()
    }));

    await this.saveAllDocuments([...allDocs, ...newDocs]);
  }

  /**
   * Get documents for a specific knowledge base
   */
  async getDocumentsByKB(knowledgeBaseId: string): Promise<StoredDocument[]> {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => doc.knowledgeBaseId === knowledgeBaseId);
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const allDocs = await this.getAllDocuments();
    const filtered = allDocs.filter(doc => doc.id !== documentId);
    await this.saveAllDocuments(filtered);
  }

  /**
   * Delete all documents for a knowledge base
   */
  async deleteDocumentsByKB(knowledgeBaseId: string): Promise<void> {
    const allDocs = await this.getAllDocuments();
    const filtered = allDocs.filter(doc => doc.knowledgeBaseId !== knowledgeBaseId);
    await this.saveAllDocuments(filtered);
  }
}

export const documentStorage = new DocumentStorageService();