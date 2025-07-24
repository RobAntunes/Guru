/**
 * Storage Module Exports
 * Unified storage with SurrealDB for embedded multi-model database
 */

export { UnifiedStorageManager } from './unified-storage-manager.js';
export { UnifiedStorageManager as StorageManager } from './unified-storage-manager.js'; // Alias for backward compatibility
export { SurrealDBAdapter } from './surrealdb-adapter.js';
export { DPCMPatternStore } from './dpcm-pattern-store.js';
export { AnalyticsStore } from './analytics-store.js';

// Export types
export type {
  StorageHealth,
  SymbolGraphQuery,
  SymbolGraphResult
} from './storage-manager.js';

export type {
  SurrealDBConfig,
  CachedItem,
  StoredPattern,
  StoredSymbol
} from './surrealdb-adapter.js';