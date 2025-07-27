/**
 * Local knowledge base storage using Tauri's file system
 */

import { BaseDirectory, readTextFile, writeTextFile, mkdir as createDir, exists } from '@tauri-apps/plugin-fs';
import { KnowledgeBase } from './guru-integration';
import { documentGroupsStorage } from './document-groups-storage';

interface StoredKnowledgeBase extends KnowledgeBase {
  // Additional fields for local storage
  localId: string;
  isLocal: boolean;
}

class KnowledgeBaseStorageService {
  private readonly STORAGE_DIR = 'knowledge_bases';
  private readonly KB_FILE = 'knowledge_bases.json';

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
   * Get all knowledge bases from storage
   */
  async getAllKnowledgeBases(): Promise<StoredKnowledgeBase[]> {
    try {
      await this.ensureStorageDir();
      const filePath = `${this.STORAGE_DIR}/${this.KB_FILE}`;
      const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });
      
      if (!fileExists) {
        return [];
      }

      const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read knowledge bases:', error);
      return [];
    }
  }

  /**
   * Save all knowledge bases to storage
   */
  async saveAllKnowledgeBases(knowledgeBases: StoredKnowledgeBase[]): Promise<void> {
    try {
      await this.ensureStorageDir();
      const filePath = `${this.STORAGE_DIR}/${this.KB_FILE}`;
      await writeTextFile(filePath, JSON.stringify(knowledgeBases, null, 2), { 
        baseDir: BaseDirectory.AppData 
      });
    } catch (error) {
      console.error('Failed to save knowledge bases:', error);
      throw error;
    }
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(
    name: string, 
    description: string,
    cognitiveSystemsEnabled: string[] = ['harmonic', 'quantum']
  ): Promise<StoredKnowledgeBase> {
    const allKBs = await this.getAllKnowledgeBases();
    
    // Generate a unique ID
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newKB: StoredKnowledgeBase = {
      id,
      localId: id,
      name,
      description,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      documentCount: 0,
      chunkCount: 0,
      cognitiveSystemsEnabled,
      isLocal: true
    };

    await this.saveAllKnowledgeBases([...allKBs, newKB]);
    
    // Create default "Ungrouped" group for this KB
    await documentGroupsStorage.createGroup(id, 'Ungrouped', 'Documents not assigned to any group');
    
    return newKB;
  }

  /**
   * Update a knowledge base
   */
  async updateKnowledgeBase(id: string, updates: Partial<StoredKnowledgeBase>): Promise<void> {
    const allKBs = await this.getAllKnowledgeBases();
    const updatedKBs = allKBs.map(kb => 
      kb.id === id 
        ? { ...kb, ...updates, lastUpdated: new Date().toISOString() }
        : kb
    );
    await this.saveAllKnowledgeBases(updatedKBs);
  }

  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    const allKBs = await this.getAllKnowledgeBases();
    const filtered = allKBs.filter(kb => kb.id !== id);
    await this.saveAllKnowledgeBases(filtered);
    
    // Also delete all groups for this KB
    await documentGroupsStorage.deleteGroupsByKB(id);
  }

  /**
   * Get a single knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<StoredKnowledgeBase | null> {
    const allKBs = await this.getAllKnowledgeBases();
    return allKBs.find(kb => kb.id === id) || null;
  }
}

export const knowledgeBaseStorage = new KnowledgeBaseStorageService();