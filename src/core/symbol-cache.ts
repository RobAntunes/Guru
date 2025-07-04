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
    this.load();
  }

  getSymbols(filePath: string, fileHash: string): CachedSymbol[] | null {
    const cached = this.cache.get(filePath);
    if (cached && cached.fileHash === fileHash) {
      return cached.symbols;
    }
    return null;
  }

  setSymbols(filePath: string, fileHash: string, symbols: CachedSymbol[]): void {
    this.cache.set(filePath, { fileHash, symbols });
    this.save();
  }

  invalidate(filePath: string): void {
    this.cache.delete(filePath);
    this.save();
  }

  hasFile(filePath: string): boolean {
    return this.cache.has(filePath);
  }

  private load(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        let data: string;
        
        if (this.compression) {
          // Read and decompress .gz file
          const compressed = fs.readFileSync(this.cacheFile);
          data = zlib.gunzipSync(compressed).toString();
        } else {
          // Read plain JSON
          data = fs.readFileSync(this.cacheFile, 'utf-8');
        }
        
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('[SymbolCache] Failed to load cache:', error);
      this.cache = new Map();
    }
  }

  private save(): void {
    try {
      const data = JSON.stringify(Object.fromEntries(this.cache), null, 2);
      if (this.compression) {
        // Write compressed data
        const compressed = zlib.gzipSync(data);
        fs.writeFileSync(this.cacheFile, compressed);
      } else {
        // Write plain JSON
        fs.writeFileSync(this.cacheFile, data);
      }
    } catch (error) {
      console.error('[SymbolCache][ERROR] Failed to save cache:', error);
    }
  }
} 