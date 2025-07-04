/**
 * Incremental Analysis System for Guru
 * Only reanalyzes changed files and affected dependencies
 */

import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { SymbolNode, SymbolGraph } from "../types/index.js";
import * as zlib from "zlib";
import { guruConfig } from "./config.js";
import { SymbolCache, CachedSymbol } from "./symbol-cache.js";

export interface FileAnalysisCache {
  hash: string;
  lastModified: number;
  symbols: SymbolNode[];
  dependencies: string[];
  analysisTimestamp: number;
  version: string;
}

export interface AnalysisCheckpoint {
  projectPath: string;
  totalFiles: number;
  analyzedFiles: number;
  timestamp: number;
  version: string;
  gitCommit?: string;
}

export interface ChangeDetectionResult {
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
  affectedFiles: string[];
  analysisRequired: boolean;
}

export class IncrementalAnalyzer {
  private cacheDir: string;
  private currentVersion = "1.0.0";
  private fileCache = new Map<string, FileAnalysisCache>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();
  private useCompression: boolean;
  private projectPath: string;
  private originalPath: string;
  private symbolCache?: SymbolCache;

  constructor(projectPath: string) {
    // Store the original path and defer ALL path resolution to initialize()
    this.originalPath = projectPath;
    this.projectPath = projectPath; // Will be resolved in initialize()
    
    // Set a temporary cacheDir to avoid using unresolved file paths
    this.cacheDir = guruConfig.cacheDir.startsWith("/")
      ? guruConfig.cacheDir
      : "/tmp/guru-cache-temp"; // Temporary, will be resolved in initialize()
      
    this.useCompression = guruConfig.cacheCompression;
    console.error('[IncrementalAnalyzer][DEBUG] constructor originalPath:', this.originalPath);
  }

  /**
   * Initialize incremental analysis system
   */
  async initialize(): Promise<void> {
    // Resolve file vs directory asynchronously
    let basePath = this.originalPath;
    try {
      const stat = await fs.stat(this.originalPath);
      if (stat.isFile()) {
        basePath = path.dirname(this.originalPath);
      }
    } catch {
      // If stat fails, fallback to original logic
    }
    this.projectPath = basePath;
    
    // Update cacheDir with resolved basePath BEFORE calling ensureCacheDirectory
    this.cacheDir = guruConfig.cacheDir.startsWith("/")
      ? guruConfig.cacheDir
      : path.join(basePath, guruConfig.cacheDir);
    
    console.error('[IncrementalAnalyzer][DEBUG] initialize resolved projectPath:', this.projectPath);
    console.error('[IncrementalAnalyzer][DEBUG] initialize resolved cacheDir:', this.cacheDir);

    await this.ensureCacheDirectory();
    await this.loadExistingCache();
    await this.buildDependencyGraphs();
    this.symbolCache = new SymbolCache(this.cacheDir);
  }

  /**
   * Detect changes since last analysis
   */
  async detectChanges(allFiles: string[]): Promise<{
    changedFiles: string[];
    deletedFiles: string[];
    newFiles: string[];
    affectedFiles: string[];
  }> {
    console.error('[IncrementalAnalyzer][DEBUG] detectChanges called for', allFiles.length, 'files');
    
    if (!this.symbolCache) {
      console.error('[IncrementalAnalyzer][DEBUG] No symbol cache, treating all files as new');
      return {
        changedFiles: [],
        deletedFiles: [],
        newFiles: allFiles,
        affectedFiles: allFiles,
      };
    }
    
    const changedFiles: string[] = [];
    const newFiles: string[] = [];
    
    for (const file of allFiles) {
      try {
        const currentHash = await this.hashFile(file);
        const cached = this.symbolCache.getSymbols(file, currentHash);
        
        if (!cached) {
          // Check if file is completely new or just changed
          const anyVersionCached = this.symbolCache.hasFile(file);
          if (anyVersionCached) {
            changedFiles.push(file);
            console.error('[IncrementalAnalyzer][DEBUG] File changed:', file);
          } else {
            newFiles.push(file);
            console.error('[IncrementalAnalyzer][DEBUG] New file:', file);
          }
        }
      } catch (error) {
        console.error('[IncrementalAnalyzer][DEBUG] Error checking file', file, ':', error);
        newFiles.push(file);
      }
    }
    
    // For simplicity, affected files = changed + new
    const affectedFiles = [...changedFiles, ...newFiles];
    
    console.error('[IncrementalAnalyzer][DEBUG] detectChanges result:', {
      changed: changedFiles.length,
      new: newFiles.length,
      affected: affectedFiles.length
    });
    
    return {
      changedFiles,
      deletedFiles: [], // TODO: implement deleted file detection
      newFiles,
      affectedFiles,
    };
  }

  /**
   * Get files that need analysis (changed + affected), using symbol graph if available
   */
  getFilesRequiringAnalysis(changes: {
    changedFiles: string[];
    deletedFiles: string[];
    newFiles: string[];
    affectedFiles: string[];
  }): string[] {
    console.error('[IncrementalAnalyzer][DEBUG] getFilesRequiringAnalysis called with:', {
      changed: changes.changedFiles.length,
      deleted: changes.deletedFiles.length,
      new: changes.newFiles.length,
      affected: changes.affectedFiles.length
    });
    
    // For now, just return the affected files
    // TODO: implement dependency analysis to include dependent files
    const filesToAnalyze = changes.affectedFiles;
    console.error('[IncrementalAnalyzer][DEBUG] Files requiring analysis:', filesToAnalyze.length);
    return filesToAnalyze;
  }

  /**
   * Update cache with new analysis results
   */
  async updateCache(
    file: string,
    symbols: SymbolNode[],
    dependencies: string[],
  ): Promise<void> {
    const stat = await fs.stat(file);
    const hash = await this.calculateFileHash(file);

    const cacheEntry: FileAnalysisCache = {
      hash,
      lastModified: stat.mtimeMs,
      symbols,
      dependencies,
      analysisTimestamp: Date.now(),
      version: this.currentVersion,
    };

    this.fileCache.set(file, cacheEntry);

    // Update dependency graphs
    this.updateDependencyGraphs(file, dependencies);

    // Persist to disk
    await this.persistCacheEntry(file, cacheEntry);
  }

  /**
   * Restore symbols from cache for unchanged files
   */
  getCachedSymbols(file: string): SymbolNode[] | null {
    const cached = this.fileCache.get(file);
    return cached ? cached.symbols : null;
  }

  /**
   * Get cached dependencies for a file
   */
  getCachedDependencies(file: string): string[] | null {
    const cached = this.fileCache.get(file);
    return cached ? cached.dependencies : null;
  }

  /**
   * Clean up cache for deleted files
   */
  async cleanupDeletedFiles(deletedFiles: string[]): Promise<void> {
    for (const file of deletedFiles) {
      this.fileCache.delete(file);
      this.removeDependencyGraphEntries(file);
      await this.deleteCacheFile(file);
    }
  }

  /**
   * Save analysis checkpoint
   */
  async saveCheckpoint(
    projectPath: string,
    totalFiles: number,
    analyzedFiles: number,
  ): Promise<void> {
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
    const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
    console.error('[IncrementalAnalyzer][DEBUG] saveCheckpoint path:', checkpointPath);
    await fs.mkdir(baseDir, { recursive: true });
    const checkpoint: AnalysisCheckpoint = {
      projectPath,
      totalFiles,
      analyzedFiles,
      timestamp: Date.now(),
      version: this.currentVersion,
      gitCommit: await this.getCurrentGitCommit(),
    };
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    console.error('[IncrementalAnalyzer][DEBUG] saveCheckpoint completed for:', checkpointPath);
  }

  /**
   * Load analysis checkpoint
   */
  async loadCheckpoint(): Promise<AnalysisCheckpoint | null> {
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
    const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
    console.error('[IncrementalAnalyzer][DEBUG] loadCheckpoint path:', checkpointPath);
    if (!fsSync.existsSync(checkpointPath)) {
      console.error('[IncrementalAnalyzer][DEBUG] no checkpoint file found');
      return null;
    }
    const data = await fs.readFile(checkpointPath, 'utf-8');
    console.error('[IncrementalAnalyzer][DEBUG] checkpoint loaded successfully');
    return JSON.parse(data);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCachedFiles: number;
    cacheSize: number;
    oldestCache: number;
    newestCache: number;
  } {
    const cached = Array.from(this.fileCache.values());

    return {
      totalCachedFiles: cached.length,
      cacheSize: this.calculateCacheSize(),
      oldestCache:
        cached.length > 0
          ? Math.min(...cached.map((c) => c.analysisTimestamp))
          : 0,
      newestCache:
        cached.length > 0
          ? Math.max(...cached.map((c) => c.analysisTimestamp))
          : 0,
    };
  }

  /**
   * Invalidate cache entries older than specified time
   */
  async invalidateOldCache(maxAgeMs: number): Promise<void> {
    const cutoff = Date.now() - maxAgeMs;
    const filesToInvalidate: string[] = [];

    for (const [file, cache] of this.fileCache.entries()) {
      if (cache.analysisTimestamp < cutoff) {
        filesToInvalidate.push(file);
      }
    }

    await this.cleanupDeletedFiles(filesToInvalidate);
  }

  /**
   * Recursively find all .js and .ts files in a directory, or return the file if input is a file
   */
  async getAllSourceFiles(rootPath: string): Promise<string[]> {
    const stat = await fs.stat(rootPath);
    if (stat.isFile()) {
      if (rootPath.endsWith('.js') || rootPath.endsWith('.ts')) {
        return [rootPath];
      } else {
        return [];
      }
    }
    const results: string[] = [];
    const walk = async (dir: string) => {
      const list = await fs.readdir(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
          results.push(fullPath);
        }
      }
    };
    await walk(rootPath);
    return results;
  }

  // Private methods

  private async ensureCacheDirectory(): Promise<void> {
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
    console.error('[IncrementalAnalyzer][DEBUG] ensureCacheDirectory using:', baseDir);
    await fs.mkdir(baseDir, { recursive: true });
  }

  private async loadExistingCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter((f) => f.endsWith(this.useCompression ? ".cache.json.gz" : ".cache.json"));
      for (const cacheFile of cacheFiles) {
        const cachePath = path.join(this.cacheDir, cacheFile);
        let cache: FileAnalysisCache;
        if (this.useCompression) {
          const buf = await fs.readFile(cachePath);
          cache = await this.decompressJson(buf);
        } else {
          const data = await fs.readFile(cachePath, "utf-8");
          cache = JSON.parse(data);
        }
        if (cache.version === this.currentVersion) {
          const originalFile = this.decodeCacheFileName(cacheFile.replace(/\.gz$/, ""));
          this.fileCache.set(originalFile, cache);
        }
      }
    } catch (error) {
      console.warn("Failed to load existing cache:", error);
    }
  }

  private async buildDependencyGraphs(): Promise<void> {
    for (const [file, cache] of this.fileCache.entries()) {
      this.updateDependencyGraphs(file, cache.dependencies);
    }
  }

  private updateDependencyGraphs(file: string, dependencies: string[]): void {
    // Update forward dependency graph
    this.dependencyGraph.set(file, new Set(dependencies));

    // Update reverse dependency graph
    for (const dep of dependencies) {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep)!.add(file);
    }
  }

  private removeDependencyGraphEntries(file: string): void {
    // Remove from forward graph
    const deps = this.dependencyGraph.get(file);
    this.dependencyGraph.delete(file);

    // Remove from reverse graph
    if (deps) {
      for (const dep of deps) {
        const reverseDeps = this.reverseDependencyGraph.get(dep);
        if (reverseDeps) {
          reverseDeps.delete(file);
          if (reverseDeps.size === 0) {
            this.reverseDependencyGraph.delete(dep);
          }
        }
      }
    }

    // Remove as dependency from reverse graph
    this.reverseDependencyGraph.delete(file);
  }

  private calculateAffectedFiles(changedFiles: string[]): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const traverse = (file: string, depth = 0) => {
      if (visited.has(file) || depth > 10) return; // Prevent infinite loops
      visited.add(file);

      const dependents = this.reverseDependencyGraph.get(file);
      if (dependents) {
        for (const dependent of dependents) {
          affected.add(dependent);
          traverse(dependent, depth + 1);
        }
      }
    };

    for (const file of changedFiles) {
      traverse(file);
    }

    return Array.from(affected);
  }

  private async getCurrentFileInfo(
    files: string[],
  ): Promise<Map<string, { hash: string; lastModified: number }>> {
    const fileInfo = new Map<string, { hash: string; lastModified: number }>();

    for (const file of files) {
      try {
        const stat = await fs.stat(file);
        const hash = await this.calculateFileHash(file);
        fileInfo.set(file, { hash, lastModified: stat.mtimeMs });
      } catch (error) {
        // File might not exist anymore, skip it
      }
    }

    return fileInfo;
  }

  private async calculateFileHash(file: string): Promise<string> {
    const content = await fs.readFile(file);
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private encodeCacheFileName(file: string): string {
    return crypto.createHash("md5").update(file).digest("hex") + ".cache.json";
  }

  private decodeCacheFileName(cacheFile: string): string {
    // This is a limitation - we'd need to store a mapping
    // For now, we'll store the original path in the cache entry
    return cacheFile.replace(".cache.json", "");
  }

  private async persistCacheEntry(
    file: string,
    cache: FileAnalysisCache,
  ): Promise<void> {
    await this.ensureCacheDirectory();
    const cacheFile = this.encodeCacheFileName(file) + (this.useCompression ? ".gz" : "");
    const cachePath = path.join(this.cacheDir, cacheFile);
    if (this.useCompression) {
      const compressed = await this.compressJson(cache);
      await fs.writeFile(cachePath, compressed);
      const legacyPath = path.join(this.cacheDir, this.encodeCacheFileName(file));
      if (await this.fileExists(legacyPath)) {
        await fs.unlink(legacyPath);
      }
    } else {
      await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
      const legacyPath = path.join(this.cacheDir, this.encodeCacheFileName(file) + ".gz");
      if (await this.fileExists(legacyPath)) {
        await fs.unlink(legacyPath);
      }
    }
  }

  private async deleteCacheFile(file: string): Promise<void> {
    try {
      const fileName = this.encodeCacheFileName(file);
      const cachePath = path.join(this.cacheDir, fileName);
      await fs.unlink(cachePath);
    } catch {
      // File might not exist, ignore
    }
  }

  private calculateCacheSize(): number {
    let size = 0;
    for (const cache of this.fileCache.values()) {
      size += JSON.stringify(cache).length;
    }
    return size;
  }

  private async getCurrentGitCommit(): Promise<string | undefined> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync("git rev-parse HEAD");
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  // --- Compression helpers ---
  private async compressJson(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(data);
      zlib.gzip(json, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private async decompressJson(buffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(JSON.parse(result.toString()));
      });
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // In all cache/checkpoint methods, ensure parent directory is used for files
  private getCacheDirForPath(targetPath: string): string {
    // If targetPath is a file, use its parent directory
    try {
      const stat = fsSync.statSync(targetPath);
      if (stat.isFile()) {
        return path.dirname(targetPath);
      }
    } catch {}
    return targetPath;
  }

  /**
   * Utility: Get the base directory for a path (parent if file, self if directory)
   */
  static async getBaseDirectory(targetPath: string): Promise<string> {
    try {
      const stat = await fs.stat(targetPath);
      if (stat.isFile()) {
        return path.dirname(targetPath);
      }
    } catch {}
    return targetPath;
  }

  private async hashFile(filePath: string): Promise<string> {
    const hash = crypto.createHash("sha256");
    const stream = fsSync.createReadStream(filePath);
    stream.on("data", (data: any) => hash.update(data));
    return new Promise((resolve, reject) => {
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  async analyzeFile(filePath: string): Promise<CachedSymbol[]> {
    console.error('[IncrementalAnalyzer][DEBUG] analyzeFile called for:', filePath);
    
    if (!this.symbolCache) {
      console.error('[IncrementalAnalyzer][DEBUG] No symbol cache available');
      return [];
    }
    
    const fileHash = await this.hashFile(filePath);
    console.error('[IncrementalAnalyzer][DEBUG] File hash calculated:', fileHash.substring(0, 8));
    
    // Check cache first
    const cached = this.symbolCache.getSymbols(filePath, fileHash);
    if (cached) {
      console.error('[IncrementalAnalyzer][DEBUG] Cache hit for:', filePath);
      return cached;
    }
    
    console.error('[IncrementalAnalyzer][DEBUG] Cache miss, generating symbols for:', filePath);
    
    // Basic symbol extraction - return mock symbols for now
    // TODO: integrate with actual symbol extraction logic
    const symbols: CachedSymbol[] = [
      { name: `symbol_${path.basename(filePath)}`, kind: 'function', location: '1:1' }
    ];
    
    // Store in cache
    this.symbolCache.setSymbols(filePath, fileHash, symbols);
    console.error('[IncrementalAnalyzer][DEBUG] Symbols cached for:', filePath);
    
    return symbols;
  }
}

/**
 * Factory for creating incremental analyzer instances
 */
export class IncrementalAnalyzerFactory {
  private static instances = new Map<string, IncrementalAnalyzer>();

  static async create(projectPath: string): Promise<IncrementalAnalyzer> {
    const normalizedPath = path.resolve(projectPath);

    if (!this.instances.has(normalizedPath)) {
      const analyzer = new IncrementalAnalyzer(normalizedPath);
      await analyzer.initialize();
      this.instances.set(normalizedPath, analyzer);
    }

    return this.instances.get(normalizedPath)!;
  }

  static clear(): void {
    this.instances.clear();
  }
}
