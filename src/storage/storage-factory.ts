/**
 * Storage Factory for gradual migration to SurrealDB
 * Allows switching between legacy and unified storage managers
 */

import { StorageManager } from './storage-manager.js';
import { UnifiedStorageManager } from './unified-storage-manager.js';
import { config } from 'dotenv';

config();

export type StorageBackend = 'legacy' | 'unified' | 'auto';

export interface StorageConfig {
  backend?: StorageBackend;
  migrateOnConnect?: boolean;
  fallbackToLegacy?: boolean;
}

export class StorageFactory {
  private static instance: StorageManager | UnifiedStorageManager | null = null;
  private static config: StorageConfig = {
    backend: 'auto',
    migrateOnConnect: false,
    fallbackToLegacy: true
  };

  /**
   * Configure storage factory before creating instances
   */
  static configure(config: StorageConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Create or get storage manager instance
   */
  static async create(): Promise<StorageManager | UnifiedStorageManager> {
    if (this.instance && this.instance.isConnected()) {
      return this.instance;
    }

    const backend = this.resolveBackend();
    console.log(`🏗️  Creating ${backend} storage manager...`);

    switch (backend) {
      case 'unified':
        return this.createUnifiedStorage();
      case 'legacy':
        return this.createLegacyStorage();
      default:
        throw new Error(`Unknown storage backend: ${backend}`);
    }
  }

  /**
   * Get current instance without creating
   */
  static getInstance(): StorageManager | UnifiedStorageManager | null {
    return this.instance;
  }

  /**
   * Reset instance (mainly for testing)
   */
  static reset(): void {
    this.instance = null;
  }

  private static resolveBackend(): 'legacy' | 'unified' {
    // Check environment variable first
    const envBackend = process.env.GURU_STORAGE_BACKEND?.toLowerCase();
    if (envBackend === 'unified' || envBackend === 'surrealdb') {
      return 'unified';
    }
    if (envBackend === 'legacy') {
      return 'legacy';
    }

    // Check config
    if (this.config.backend === 'unified') {
      return 'unified';
    }
    if (this.config.backend === 'legacy') {
      return 'legacy';
    }

    // Auto mode: check if we're in test environment
    if (process.env.NODE_ENV === 'test') {
      // Use legacy for tests until migration is complete
      return 'legacy';
    }

    // Default to unified for new installations
    return 'unified';
  }

  private static async createUnifiedStorage(): Promise<UnifiedStorageManager> {
    try {
      const storage = new UnifiedStorageManager();
      await storage.connect();
      
      if (this.config.migrateOnConnect) {
        console.log('🔄 Running data migration...');
        // TODO: Implement migration
      }
      
      this.instance = storage;
      return storage;
    } catch (error) {
      console.error('❌ Failed to create unified storage:', error);
      
      if (this.config.fallbackToLegacy) {
        console.log('⚠️  Falling back to legacy storage...');
        return this.createLegacyStorage();
      }
      
      throw error;
    }
  }

  private static async createLegacyStorage(): Promise<StorageManager> {
    const storage = new StorageManager();
    await storage.connect();
    this.instance = storage;
    return storage;
  }

  /**
   * Create storage manager with specific backend (for testing)
   */
  static async createWithBackend(backend: 'legacy' | 'unified'): Promise<StorageManager | UnifiedStorageManager> {
    const previousConfig = { ...this.config };
    this.config.backend = backend;
    
    try {
      return await this.create();
    } finally {
      this.config = previousConfig;
    }
  }

  /**
   * Check if unified storage is available
   */
  static async isUnifiedAvailable(): Promise<boolean> {
    try {
      const { Surreal } = await import('surrealdb');
      const { surrealdbNodeEngines } = await import('@surrealdb/node');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get feature compatibility info
   */
  static getCompatibility(): {
    backend: string;
    features: {
      graph: boolean;
      cache: boolean;
      analytics: boolean;
      realtime: boolean;
      transactions: boolean;
    };
  } {
    const backend = this.resolveBackend();
    
    return {
      backend,
      features: {
        graph: true,
        cache: true,
        analytics: true,
        realtime: backend === 'unified',
        transactions: backend === 'unified'
      }
    };
  }
}

// Environment-based auto-configuration
if (process.env.GURU_STORAGE_BACKEND) {
  StorageFactory.configure({
    backend: process.env.GURU_STORAGE_BACKEND as StorageBackend
  });
}