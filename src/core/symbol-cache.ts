import * as fs from "fs";
import * as path from "path";
import { guruConfig } from "./config.js";
import * as zlib from "zlib";
import { DatabaseAdapter } from "./database-adapter.js";

export interface CachedSymbol {
  name: string;
  kind: string;
  location: string;
}

interface CacheEntry {
  fileHash: string;
  symbols: CachedSymbol[];
}

interface CacheIndex {
  [filePath: string]: {
    fileHash: string;
    position: number;
    size: number;
  };
}

export class SymbolCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private db: DatabaseAdapter;
  private cacheFile: string;
  private indexFile: string;
  private compression: boolean;
  private maxMemoryEntries: number = 100; // LRU cache limit
  private cacheIndex: CacheIndex = {};
  private accessOrder: string[] = []; // For LRU eviction
  private dirty: Set<string> = new Set(); // Track unsaved changes
  private useDatabase: boolean = true; // Primary storage
  private useFileBackup: boolean = true; // Fallback/backup storage
  private pendingInvalidations?: Set<string>; // Track files to invalidate from database

  constructor(cacheDir: string) {
    // Use test instance for tests to get proper isolation
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      // Use a test ID based on the cache directory to ensure isolation per test
      const testId = `symbolcache-${cacheDir.replace(/[^a-zA-Z0-9]/g, '_')}`;
      this.db = DatabaseAdapter.getTestInstance(testId);
    } else {
      this.db = DatabaseAdapter.getInstance();
    }
    this.compression = guruConfig.cacheCompression;
    const ext = this.compression ? '.gz' : '.json';
    this.cacheFile = path.join(cacheDir, `symbol-cache${ext}`);
    this.indexFile = path.join(cacheDir, 'symbol-cache-index.json');
    
    // Load file-based index for backward compatibility
    if (this.useFileBackup) {
      this.loadIndex();
    }
    
    console.log("📊 SymbolCache initialized with database integration");
  }

  /**
   * Normalize file path to absolute path for consistent storage/lookup
   */
  private normalizePath(filePath: string): string {
    return path.resolve(filePath);
  }

  async getSymbols(filePath: string, fileHash: string): Promise<CachedSymbol[] | null> {
    const normalizedPath = this.normalizePath(filePath);
    
    // Check memory cache first
    const memCached = this.memoryCache.get(normalizedPath);
    if (memCached) {
      this.updateAccessOrder(normalizedPath);
      if (memCached.fileHash === fileHash) {
        return memCached.symbols;
      } else {
        // Hash mismatch - file changed, invalidate
        this.invalidate(normalizedPath);
        return null;
      }
    }

    // Check database cache first (but skip if pending invalidation)
    if (this.useDatabase && (!this.pendingInvalidations || !this.pendingInvalidations.has(normalizedPath))) {
      try {
        const dbEntry = await this.db.loadFileAnalysis(normalizedPath);
        if (dbEntry && dbEntry.hash === fileHash) {
          const entry: CacheEntry = { 
            fileHash: dbEntry.hash, 
            symbols: dbEntry.symbols as CachedSymbol[] 
          };
          this.putInMemoryCache(normalizedPath, entry);
          return entry.symbols;
        }
      } catch (error) {
        console.warn(`[SymbolCache] Database lookup failed for ${normalizedPath}:`, error);
      }
    }

    // Fallback to file-based cache
    if (this.useFileBackup) {
      const indexEntry = this.cacheIndex[normalizedPath];
      if (indexEntry && indexEntry.fileHash === fileHash) {
        const diskEntry = await this.loadFromDisk(normalizedPath);
        if (diskEntry) {
          this.putInMemoryCache(normalizedPath, diskEntry);
          return diskEntry.symbols;
        }
      }
    }

    return null;
  }

  setSymbols(filePath: string, fileHash: string, symbols: CachedSymbol[]): void {
    console.log(`[DEBUG][SymbolCache.setSymbols] Called for ${filePath}`);
    const normalizedPath = this.normalizePath(filePath);
    const entry: CacheEntry = { fileHash, symbols };
    this.putInMemoryCache(normalizedPath, entry);
    this.dirty.add(normalizedPath);
    // Write will be handled by flush() to avoid race conditions
    console.log(`[DEBUG][SymbolCache.setSymbols] Added to dirty set for ${filePath}`);
  }

  invalidate(filePath: string): void {
    const normalizedPath = this.normalizePath(filePath);
    this.memoryCache.delete(normalizedPath);
    this.accessOrder = this.accessOrder.filter(p => p !== normalizedPath);
    delete this.cacheIndex[normalizedPath];
    this.dirty.delete(normalizedPath);
    
    // Also remove from database synchronously
    if (this.useDatabase) {
      // Store the invalidation task to be processed during flush
      if (!this.pendingInvalidations) {
        this.pendingInvalidations = new Set();
      }
      this.pendingInvalidations.add(normalizedPath);
    }
    
    this.saveIndex();
  }

  hasFile(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    return this.memoryCache.has(normalizedPath) || (normalizedPath in this.cacheIndex);
  }

  async hasFileAsync(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    
    // Check if pending invalidation
    if (this.pendingInvalidations && this.pendingInvalidations.has(normalizedPath)) {
      return false;
    }

    // Check memory cache first
    if (this.memoryCache.has(normalizedPath)) {
      return true;
    }

    // Check database
    if (this.useDatabase) {
      try {
        const dbEntry = await this.db.loadFileAnalysis(normalizedPath);
        return dbEntry !== null;
      } catch (error) {
        console.warn(`[SymbolCache] Database check failed for ${normalizedPath}:`, error);
      }
    }

    // Check file-based index
    return normalizedPath in this.cacheIndex;
  }

  /**
   * Get all files that have been cached
   */
  async getAllCachedFiles(): Promise<string[]> {
    const cachedFiles: string[] = [];
    
    // Get from memory cache (these are absolute paths)
    cachedFiles.push(...this.memoryCache.keys());
    
    // Get from database if available (these should also be absolute paths)
    if (this.useDatabase) {
      try {
        const dbFiles = await this.db.getAllAnalyzedFiles();
        cachedFiles.push(...dbFiles);
      } catch (error) {
        console.warn('[SymbolCache] Failed to get cached files from database:', error);
      }
    }
    
    // Get from file-based index (these are absolute paths)
    cachedFiles.push(...Object.keys(this.cacheIndex));
    
    // Remove duplicates and return
    return Array.from(new Set(cachedFiles));
  }

  /**
   * Flush all pending writes and clean up
   */
  async flush(): Promise<void> {
    const writePromises = Array.from(this.dirty).map(async (filePath) => {
      const entry = this.memoryCache.get(filePath);
      if (entry) {
        await this.writeToStorage(filePath, entry);
      }
    });
    
    // Process pending invalidations
    const invalidationPromises = this.pendingInvalidations ? 
      Array.from(this.pendingInvalidations).map(async (filePath) => {
        try {
          await this.db.invalidateFileAnalysis(filePath);
        } catch (error) {
          console.warn(`[SymbolCache] Failed to invalidate ${filePath} in database:`, error);
        }
      }) : [];
    
    await Promise.all([...writePromises, ...invalidationPromises]);
    this.dirty.clear();
    if (this.pendingInvalidations) {
      this.pendingInvalidations.clear();
    }
    if (this.useFileBackup) {
      this.saveIndex();
    }
    console.log(`✅ Flushed ${writePromises.length} symbol cache entries to storage`);
  }

  private updateAccessOrder(filePath: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter(p => p !== filePath);
    // Add to end (most recent)
    this.accessOrder.push(filePath);
  }

  private putInMemoryCache(filePath: string, entry: CacheEntry): void {
    this.memoryCache.set(filePath, entry);
    this.updateAccessOrder(filePath);
    
    // Evict LRU entries if over limit
    while (this.memoryCache.size > this.maxMemoryEntries) {
      const lru = this.accessOrder.shift();
      if (lru) {
        this.memoryCache.delete(lru);
      }
    }
  }

  private async loadFromDisk(filePath: string): Promise<CacheEntry | null> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const indexEntry = this.cacheIndex[normalizedPath];
      if (!indexEntry || !fs.existsSync(this.cacheFile)) {
        return null;
      }

      // Read specific portion of file based on index
      const fd = fs.openSync(this.cacheFile, 'r');
      const buffer = Buffer.alloc(indexEntry.size);
      fs.readSync(fd, buffer, 0, indexEntry.size, indexEntry.position);
      fs.closeSync(fd);

      let data: string;
      if (this.compression) {
        data = zlib.gunzipSync(buffer).toString();
      } else {
        data = buffer.toString();
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`[SymbolCache] Failed to load ${filePath} from disk:`, error);
      return null;
    }
  }

  private scheduleWrite(filePath: string, entry: CacheEntry): void {
    console.log(`[DEBUG][SymbolCache.scheduleWrite] Scheduling write for ${filePath}`);
    const normalizedPath = this.normalizePath(filePath);
    setImmediate(() => {
      if (this.dirty.has(normalizedPath)) {
        this.writeToStorage(normalizedPath, entry);
      }
    });
    console.log(`[DEBUG][SymbolCache.scheduleWrite] setImmediate called for ${filePath}`);
  }

  private async writeToStorage(filePath: string, entry: CacheEntry): Promise<void> {
    console.log(`[DEBUG][SymbolCache.writeToStorage] Start for ${filePath}`);
    const normalizedPath = this.normalizePath(filePath);
    let dbSuccess = false;
    if (this.useDatabase) {
      try {
        console.log(`[DEBUG][SymbolCache.writeToStorage] Writing to database for ${filePath}`);
        await this.db.saveFileAnalysis(
          normalizedPath,
          entry.fileHash,
          entry.symbols,
          [],
          "1.0"
        );
        dbSuccess = true;
        this.dirty.delete(normalizedPath);
        console.log(`💾 Cached symbols for ${normalizedPath} in database (${entry.symbols.length} symbols)`);
      } catch (error) {
        console.warn(`[SymbolCache] Failed to write ${normalizedPath} to database:`, error);
      }
    }
    if (this.useFileBackup && (!dbSuccess || this.useDatabase)) {
      console.log(`[DEBUG][SymbolCache.writeToStorage] Writing to disk for ${filePath}`);
      await this.writeToDisk(normalizedPath, entry);
    }
    console.log(`[DEBUG][SymbolCache.writeToStorage] End for ${filePath}`);
  }

  private async writeToDisk(filePath: string, entry: CacheEntry): Promise<void> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const data = JSON.stringify(entry);
      let buffer: Buffer;
      
      if (this.compression) {
        buffer = zlib.gzipSync(data);
      } else {
        buffer = Buffer.from(data);
      }

      // Append to cache file and update index
      const fd = fs.openSync(this.cacheFile, 'a');
      const position = fs.fstatSync(fd).size;
      fs.writeSync(fd, buffer);
      fs.closeSync(fd);

      // Update index
      this.cacheIndex[normalizedPath] = {
        fileHash: entry.fileHash,
        position,
        size: buffer.length
      };

      this.dirty.delete(normalizedPath);
      this.saveIndex();

    } catch (error) {
      console.error(`[SymbolCache] Failed to write ${filePath} to disk:`, error);
    }
  }

  private loadIndex(): void {
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = fs.readFileSync(this.indexFile, 'utf-8');
        this.cacheIndex = JSON.parse(data);
      }
    } catch (error) {
      console.error('[SymbolCache] Failed to load index:', error);
      this.cacheIndex = {};
    }
  }

  private saveIndex(): void {
    try {
      const data = JSON.stringify(this.cacheIndex, null, 2);
      fs.writeFileSync(this.indexFile, data);
    } catch (error) {
      console.error('[SymbolCache] Failed to save index:', error);
    }
  }
} 