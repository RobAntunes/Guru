import * as fs from "fs";
import * as path from "path";
import { guruConfig } from "./config.js";
import * as zlib from "zlib";

export interface CachedSymbol {
  name: string;
  kind: string;
  location: string;
}

interface CacheEntry {
  fileHash: string;
  symbols: CachedSymbol[];
}

export class SymbolCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheFile: string;
  private compression: boolean;

  constructor(cacheDir: string) {
    // Use .gz if compression is enabled
    this.compression = guruConfig.cacheCompression;
    const ext = this.compression ? '.gz' : '.json';
    this.cacheFile = path.join(cacheDir, `symbol-cache${ext}`);
    console.log(`[SymbolCache] cacheFile set to: ${this.cacheFile} | compression: ${this.compression}`);
    this.load();
  }

  getSymbols(filePath: string, fileHash: string): CachedSymbol[] | null {
    const cached = this.cache.get(filePath);
    if (cached && cached.fileHash === fileHash) {
      console.log(`[SymbolCache] Cache HIT for ${filePath}`);
      return cached.symbols;
    }
    console.log(`[SymbolCache] Cache MISS for ${filePath}`);
    return null;
  }

  setSymbols(filePath: string, fileHash: string, symbols: CachedSymbol[]): void {
    console.error('[SymbolCache][DEBUG] setSymbols called for:', filePath, '| hash:', fileHash.substring(0, 8), '| symbols:', symbols.length);
    this.cache.set(filePath, { fileHash, symbols });
    this.save();
    console.error('[SymbolCache][DEBUG] setSymbols completed for:', filePath);
  }

  invalidate(filePath: string): void {
    this.cache.delete(filePath);
    console.log(`[SymbolCache] Cache INVALIDATE for ${filePath}`);
    this.save();
  }

  hasFile(filePath: string): boolean {
    return this.cache.has(filePath);
  }

  private load(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        console.error('[SymbolCache][DEBUG] Loading cache from:', this.cacheFile);
        let data: string;
        
        if (this.compression) {
          // Read and decompress .gz file
          const compressed = fs.readFileSync(this.cacheFile);
          data = zlib.gunzipSync(compressed).toString();
          console.error('[SymbolCache][DEBUG] Decompressed cache data loaded');
        } else {
          // Read plain JSON
          data = fs.readFileSync(this.cacheFile, 'utf-8');
          console.error('[SymbolCache][DEBUG] Plain cache data loaded');
        }
        
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
        console.error('[SymbolCache][DEBUG] Cache loaded with', this.cache.size, 'entries');
      } else {
        console.error('[SymbolCache][DEBUG] No cache file found, starting with empty cache');
      }
    } catch (error) {
      console.error('[SymbolCache] Failed to load cache:', error);
      this.cache = new Map();
    }
  }

  private save(): void {
    console.error('[SymbolCache][DEBUG] save() called, writing to:', this.cacheFile);
    try {
      const data = JSON.stringify(Object.fromEntries(this.cache), null, 2);
      if (this.compression) {
        // Write compressed data
        const compressed = zlib.gzipSync(data);
        fs.writeFileSync(this.cacheFile, compressed);
        console.error('[SymbolCache][DEBUG] Compressed cache written to:', this.cacheFile);
      } else {
        // Write plain JSON
        fs.writeFileSync(this.cacheFile, data);
        console.error('[SymbolCache][DEBUG] Plain cache written to:', this.cacheFile);
      }
    } catch (error) {
      console.error('[SymbolCache][ERROR] Failed to save cache:', error);
    }
  }
} 