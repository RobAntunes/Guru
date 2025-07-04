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
    this.db = DatabaseAdapter.getInstance();
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

  async getSymbols(filePath: string, fileHash: string): Promise<CachedSymbol[] | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(filePath);
    if (memCached) {
      this.updateAccessOrder(filePath);
      if (memCached.fileHash === fileHash) {
        return memCached.symbols;
      } else {
        // Hash mismatch - file changed, invalidate
        this.invalidate(filePath);
        return null;
      }
    }

    // Check database cache first (but skip if pending invalidation)
    if (this.useDatabase && (!this.pendingInvalidations || !this.pendingInvalidations.has(filePath))) {
      try {
        const dbEntry = await this.db.loadFileAnalysis(filePath);
        if (dbEntry && dbEntry.hash === fileHash) {
          const entry: CacheEntry = { 
            fileHash: dbEntry.hash, 
            symbols: dbEntry.symbols as CachedSymbol[] 
          };
          this.putInMemoryCache(filePath, entry);
          return entry.symbols;
        }
      } catch (error) {
        console.warn(`[SymbolCache] Database lookup failed for ${filePath}:`, error);
      }
    }

    // Fallback to file-based cache
    if (this.useFileBackup) {
      const indexEntry = this.cacheIndex[filePath];
      if (indexEntry && indexEntry.fileHash === fileHash) {
        const diskEntry = await this.loadFromDisk(filePath);
        if (diskEntry) {
          this.putInMemoryCache(filePath, diskEntry);
          return diskEntry.symbols;
        }
      }
    }

    return null;
  }

  setSymbols(filePath: string, fileHash: string, symbols: CachedSymbol[]): void {
    const entry: CacheEntry = { fileHash, symbols };
    this.putInMemoryCache(filePath, entry);
    this.dirty.add(filePath);
    
    // Async write to database (primary) and disk (backup)
    this.scheduleWrite(filePath, entry);
  }

  invalidate(filePath: string): void {
    this.memoryCache.delete(filePath);
    this.accessOrder = this.accessOrder.filter(p => p !== filePath);
    delete this.cacheIndex[filePath];
    this.dirty.delete(filePath);
    
    // Also remove from database synchronously
    if (this.useDatabase) {
      // Store the invalidation task to be processed during flush
      if (!this.pendingInvalidations) {
        this.pendingInvalidations = new Set();
      }
      this.pendingInvalidations.add(filePath);
    }
    
    this.saveIndex();
  }

  hasFile(filePath: string): boolean {
    return this.memoryCache.has(filePath) || (filePath in this.cacheIndex);
  }

  async hasFileAsync(filePath: string): Promise<boolean> {
    // Check if pending invalidation
    if (this.pendingInvalidations && this.pendingInvalidations.has(filePath)) {
      return false;
    }

    // Check memory cache first
    if (this.memoryCache.has(filePath)) {
      return true;
    }

    // Check database
    if (this.useDatabase) {
      try {
        const dbEntry = await this.db.loadFileAnalysis(filePath);
        return dbEntry !== null;
      } catch (error) {
        console.warn(`[SymbolCache] Database check failed for ${filePath}:`, error);
      }
    }

    // Check file-based index
    return filePath in this.cacheIndex;
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
      const indexEntry = this.cacheIndex[filePath];
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
    // Use setImmediate to batch writes and avoid blocking
    setImmediate(() => {
      if (this.dirty.has(filePath)) {
        this.writeToStorage(filePath, entry);
      }
    });
  }

  private async writeToStorage(filePath: string, entry: CacheEntry): Promise<void> {
    let dbSuccess = false;
    
    // Primary: Write to database
    if (this.useDatabase) {
      try {
        await this.db.saveFileAnalysis(
          filePath,
          entry.fileHash,
          entry.symbols,
          [], // dependencies - can be populated later
          "1.0" // version
        );
        dbSuccess = true;
        this.dirty.delete(filePath);
        console.log(`💾 Cached symbols for ${filePath} in database (${entry.symbols.length} symbols)`);
      } catch (error) {
        console.warn(`[SymbolCache] Failed to write ${filePath} to database:`, error);
      }
    }
    
    // Backup: Write to disk if database failed or as backup
    if (this.useFileBackup && (!dbSuccess || this.useDatabase)) {
      await this.writeToDisk(filePath, entry);
    }
  }

  private async writeToDisk(filePath: string, entry: CacheEntry): Promise<void> {
    try {
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
      this.cacheIndex[filePath] = {
        fileHash: entry.fileHash,
        position,
        size: buffer.length
      };

      this.dirty.delete(filePath);
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