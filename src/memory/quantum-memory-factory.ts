/**
 * Factory for creating QuantumProbabilityFieldMemory instances
 * with optional full database connectivity
 */

import { QuantumProbabilityFieldMemory, QPFMConfig } from './quantum-memory-system.js';
import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';

export interface CreateQPFMOptions {
  config?: Partial<QPFMConfig>;
  useStorage?: boolean;
  autoInitialize?: boolean;
}

/**
 * Create a QPFM instance with optional database connectivity
 */
export async function createQuantumMemory(
  options: CreateQPFMOptions = {}
): Promise<QuantumProbabilityFieldMemory> {
  const { 
    config, 
    useStorage = false, 
    autoInitialize = true 
  } = options;

  let storageManager: UnifiedStorageManager | undefined;

  // If storage is requested, create and connect StorageManager
  if (useStorage) {
    console.log('🔌 Connecting to storage layers for QPFM...');
    storageManager = new UnifiedStorageManager();
    
    try {
      await storageManager.connect();
      console.log('✅ Storage manager connected successfully');
    } catch (error) {
      console.error('⚠️  Storage connection failed, falling back to in-memory mode:', error);
      storageManager = undefined;
    }
  }

  // Create QPFM instance with or without storage
  const qpfm = new QuantumProbabilityFieldMemory(config, storageManager);

  // Auto-initialize from storage if connected
  if (autoInitialize && storageManager?.isConnected()) {
    await qpfm.initialize();
  }

  return qpfm;
}

/**
 * Create an in-memory only QPFM instance (no database)
 */
export function createInMemoryQuantumMemory(
  config?: Partial<QPFMConfig>
): QuantumProbabilityFieldMemory {
  return new QuantumProbabilityFieldMemory(config);
}

/**
 * Create a production QPFM instance with full storage
 */
export async function createProductionQuantumMemory(
  config?: Partial<QPFMConfig>
): Promise<QuantumProbabilityFieldMemory> {
  return createQuantumMemory({
    config,
    useStorage: true,
    autoInitialize: true
  });
}