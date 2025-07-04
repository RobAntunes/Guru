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
import { guruConfig, guruExcludedDirs } from "./config.js";
import { SymbolCache, CachedSymbol } from "./symbol-cache.js";
import { WorkerPool } from './worker-pool.js';
import { DatabaseAdapter } from "./database-adapter.js";
import * as os from 'os';

export interface FileAnalysisCache {
  hash: string;
  lastModified: number;
  symbols: SymbolNode[];
  dependencies: string[];
  analysisTimestamp: number;
  version: string;
}

export interface AnalysisResult {
  symbolGraph: SymbolGraph;
  entryPoints?: any;
  clusters?: any;
  metadata?: any;
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

interface MemoryLimits {
  maxCacheEntries: number;
  maxDependencyEntries: number;
  memoryCheckIntervalMs: number;
  maxMemoryMB: number;
}

export class IncrementalAnalyzer {
  private cacheDir: string;
  private currentVersion = "1.0.0";
  private db: DatabaseAdapter;
  
  // Memory-bounded caches with LRU eviction
  private fileCache = new Map<string, FileAnalysisCache>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();
  
  // LRU tracking
  private fileCacheAccess: string[] = [];
  private dependencyAccess: string[] = [];
  
  // Memory management
  private memoryLimits: MemoryLimits = {
    maxCacheEntries: 500,  // Limit cache to 500 files max
    maxDependencyEntries: 1000, // Limit dependency graph size
    memoryCheckIntervalMs: 5000, // Check memory every 5 seconds
    maxMemoryMB: 256  // Trigger cleanup at 256MB
  };
  
  private useCompression: boolean;
  private projectPath: string;
  private originalPath: string;
  private symbolCache?: SymbolCache;
  private workerPool: WorkerPool<string, { filePath: string; symbols: any[]; error?: string }> | null = null;
  private quiet: boolean;
  private memoryCheckTimer?: NodeJS.Timeout;

  constructor(projectPath: string, quiet = false) {
    // Store the original path and defer ALL path resolution to initialize()
    this.originalPath = projectPath;
    this.projectPath = projectPath; // Will be resolved in initialize()
    this.quiet = quiet;
    this.db = DatabaseAdapter.getInstance();
    
    // Set a temporary cacheDir to avoid using unresolved file paths
    this.cacheDir = guruConfig.cacheDir.startsWith("/")
      ? guruConfig.cacheDir
      : "/tmp/guru-cache-temp"; // Temporary, will be resolved in initialize()
      
    this.useCompression = guruConfig.cacheCompression;
    if (!quiet) {
      console.error('[IncrementalAnalyzer][DEBUG] constructor originalPath:', this.originalPath);
    }
  }

  /**
   * Initialize the incremental analyzer
   */
  async initialize(): Promise<void> {
    this.projectPath = path.resolve(this.originalPath);
    
    // Use the same cache directory as the global config to ensure database and file cache are aligned
    if (guruConfig.cacheDir.startsWith("/")) {
      this.cacheDir = guruConfig.cacheDir;
    } else {
      this.cacheDir = path.resolve(guruConfig.cacheDir);
    }

    // Initialize symbol cache
    this.symbolCache = new SymbolCache(this.cacheDir);

    // Ensure cache directory exists
    await this.ensureCacheDirectory();

    // Initialize worker pool for parallel analysis
    const maxWorkers = (globalThis as any).guruMaxParallelism || os.cpus().length;
    try {
      // Try to resolve the worker script path - handle both dev and compiled versions
      let workerPath;
      try {
        // First try the compiled version (for production)
        workerPath = require.resolve('./worker-symbol-analyze.js');
      } catch {
        // Fallback to the same directory where this file was compiled from
        workerPath = path.join(__dirname, 'worker-symbol-analyze.js');
      }
      
      this.workerPool = new WorkerPool(workerPath, maxWorkers);
    } catch (error) {
      console.error('[IncrementalAnalyzer][ERROR] Failed to initialize worker pool:', error);
      // Continue without worker pool - analysis will still work without parallelism
    }

    await this.loadExistingCache();
    await this.buildDependencyGraphs();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Start memory monitoring and periodic cleanup
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckTimer = setInterval(() => {
      this.checkAndCleanupMemory();
    }, this.memoryLimits.memoryCheckIntervalMs);
  }

  /**
   * Check memory usage and cleanup if needed
   */
  private checkAndCleanupMemory(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / (1024 * 1024);
    
    if (heapUsedMB > this.memoryLimits.maxMemoryMB) {
      if (!this.quiet) {
        console.error(`[IncrementalAnalyzer][MEMORY] High memory usage detected: ${heapUsedMB.toFixed(2)}MB, cleaning up...`);
      }
      this.performMemoryCleanup();
    }
    
    // Always check cache size limits
    this.enforceCacheLimits();
  }

  /**
   * Enforce cache size limits using LRU eviction
   */
  private enforceCacheLimits(): void {
    // File cache LRU eviction
    while (this.fileCache.size > this.memoryLimits.maxCacheEntries) {
      const lruFile = this.fileCacheAccess.shift();
      if (lruFile) {
        this.fileCache.delete(lruFile);
        if (!this.quiet) {
          console.error(`[IncrementalAnalyzer][LRU] Evicted file cache entry: ${lruFile}`);
        }
      }
    }
    
    // Dependency graph LRU eviction
    while (this.dependencyGraph.size > this.memoryLimits.maxDependencyEntries) {
      const lruDep = this.dependencyAccess.shift();
      if (lruDep) {
        this.dependencyGraph.delete(lruDep);
        this.reverseDependencyGraph.delete(lruDep);
        if (!this.quiet) {
          console.error(`[IncrementalAnalyzer][LRU] Evicted dependency entry: ${lruDep}`);
        }
      }
    }
  }

  /**
   * Perform aggressive memory cleanup
   */
  private performMemoryCleanup(): void {
    // Clear half of the least recently used entries
    const fileCacheTarget = Math.floor(this.memoryLimits.maxCacheEntries / 2);
    const depCacheTarget = Math.floor(this.memoryLimits.maxDependencyEntries / 2);
    
    while (this.fileCache.size > fileCacheTarget) {
      const lruFile = this.fileCacheAccess.shift();
      if (lruFile) {
        this.fileCache.delete(lruFile);
      }
    }
    
    while (this.dependencyGraph.size > depCacheTarget) {
      const lruDep = this.dependencyAccess.shift();
      if (lruDep) {
        this.dependencyGraph.delete(lruDep);
        this.reverseDependencyGraph.delete(lruDep);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    if (!this.quiet) {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / (1024 * 1024);
      console.error(`[IncrementalAnalyzer][MEMORY] Cleanup complete. Memory usage: ${heapUsedMB.toFixed(2)}MB`);
    }
  }

  /**
   * Update LRU access tracking for file cache
   */
  private trackFileCacheAccess(file: string): void {
    // Remove from current position if exists
    const index = this.fileCacheAccess.indexOf(file);
    if (index > -1) {
      this.fileCacheAccess.splice(index, 1);
    }
    // Add to end (most recently used)
    this.fileCacheAccess.push(file);
  }

  /**
   * Update LRU access tracking for dependency cache
   */
  private trackDependencyAccess(file: string): void {
    // Remove from current position if exists
    const index = this.dependencyAccess.indexOf(file);
    if (index > -1) {
      this.dependencyAccess.splice(index, 1);
    }
    // Add to end (most recently used)
    this.dependencyAccess.push(file);
  }

  /**
   * Get cached analysis with LRU tracking
   */
  getCachedAnalysis(file: string): FileAnalysisCache | null {
    const cached = this.fileCache.get(file);
    if (cached) {
      this.trackFileCacheAccess(file);
    }
    return cached || null;
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
    this.trackFileCacheAccess(file);

    // Update dependency graphs with LRU tracking
    this.updateDependencyGraphs(file, dependencies);

    // Persist to both database and disk asynchronously (non-blocking)
    setImmediate(() => {
      this.persistCacheEntry(file, cacheEntry).catch(error => {
        if (!this.quiet) {
          console.error(`[IncrementalAnalyzer][ERROR] Failed to persist cache entry for ${file}:`, error);
        }
      });
      
      // Also save to database
      this.db.saveFileAnalysis(
        file,
        hash,
        symbols,
        dependencies,
        this.currentVersion
      ).catch(error => {
        if (!this.quiet) {
          console.warn(`[IncrementalAnalyzer][WARN] Failed to save to database for ${file}:`, error);
        }
      });
    });

    // Enforce cache limits after update
    this.enforceCacheLimits();
  }

  /**
   * Update dependency graphs with LRU tracking
   */
  private updateDependencyGraphs(file: string, dependencies: string[]): void {
    // Track access
    this.trackDependencyAccess(file);
    
    // Clear old dependencies
    const oldDeps = this.dependencyGraph.get(file) || new Set();
    for (const dep of oldDeps) {
      const reverseDeps = this.reverseDependencyGraph.get(dep);
      if (reverseDeps) {
        reverseDeps.delete(file);
        if (reverseDeps.size === 0) {
          this.reverseDependencyGraph.delete(dep);
        }
      }
    }

    // Set new dependencies
    this.dependencyGraph.set(file, new Set(dependencies));

    // Update reverse dependencies
    for (const dep of dependencies) {
      this.trackDependencyAccess(dep);
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep)!.add(file);
    }
  }

  /**
   * Flush all pending cache writes
   */
  async flush(): Promise<void> {
    if (this.symbolCache) {
      await this.symbolCache.flush();
    }
  }

  /**
   * Cleanup method to be called before analyzer is destroyed
   */
  async cleanup(): Promise<void> {
    // Stop memory monitoring
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
    }
    
    // Flush all pending writes in symbol cache
    if (this.symbolCache) {
      await this.symbolCache.flush();
    }
    
    // Cleanup worker pool
    if (this.workerPool) {
      await this.workerPool.destroy();
    }
    
    // Clear memory caches
    this.fileCache.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.fileCacheAccess.length = 0;
    this.dependencyAccess.length = 0;
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
    if (!this.symbolCache) {
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
        const cached = await this.symbolCache!.getSymbols(file, currentHash);
        

        
                  if (!cached) {
            // Check if file is completely new or just changed
            const anyVersionCached = await this.symbolCache!.hasFileAsync(file);
            if (anyVersionCached) {
              changedFiles.push(file);
            } else {
              newFiles.push(file);
            }
          }
        } catch (error) {
        newFiles.push(file);
      }
    }
    
    // For simplicity, affected files = changed + new
    const affectedFiles = [...changedFiles, ...newFiles];
    

    
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
    // For now, just return the affected files
    // TODO: implement dependency analysis to include dependent files
    const filesToAnalyze = changes.affectedFiles;
    return filesToAnalyze;
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
    const checkpoint: AnalysisCheckpoint = {
      projectPath,
      totalFiles,
      analyzedFiles,
      timestamp: Date.now(),
      version: this.currentVersion,
      gitCommit: await this.getCurrentGitCommit(),
    };
    
    try {
      const checkpointId = `checkpoint-${this.projectPath}`;
      // Save to database (primary)
      await this.db.saveAnalysisSession(
        checkpointId,
        checkpoint.projectPath,
        'incremental',
        { 
          totalFiles, 
          analyzedFiles, 
          gitCommit: checkpoint.gitCommit,
          version: this.currentVersion,
          checkpoint: checkpoint
        }
      );
      console.log(`📊 Saved analysis checkpoint: ${analyzedFiles}/${totalFiles} files analyzed`);
    } catch (error) {
      console.warn("Failed to save checkpoint to database:", error);
      
      // Fallback to file-based checkpoint
      const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
      const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
      await fs.mkdir(baseDir, { recursive: true });
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    }
  }

  /**
   * Load analysis checkpoint
   */
  async loadCheckpoint(): Promise<AnalysisCheckpoint | null> {
    try {
      const checkpointId = `checkpoint-${this.projectPath}`;
      // Try loading from database first
      const sessions = await this.db.getAnalysisSessions(checkpointId, 1);
      if (sessions.length > 0) {
        const session = sessions[0];
        // The checkpoint is stored in the session_data.checkpoint field
        if (session.session_data && session.session_data.checkpoint) {
          return session.session_data.checkpoint as AnalysisCheckpoint;
        }
      }
    } catch (error) {
      console.warn("Failed to load checkpoint from database:", error);
    }

    // Fallback to file-based checkpoint
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
    const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
    if (!fsSync.existsSync(checkpointPath)) {
      return null;
    }
    
    try {
      const data = await fs.readFile(checkpointPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn("Failed to parse checkpoint JSON:", error);
      // Delete corrupted checkpoint file
      try {
        await fs.unlink(checkpointPath);
      } catch {}
      return null;
    }
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
    const excluded = new Set(guruExcludedDirs);
    let fileCount = 0;
    const walk = async (dir: string) => {
      let list: string[];
      try {
        list = await fs.readdir(dir);
      } catch (err) {
        // Only log errors, not debug info in hot paths
        return;
      }
      for (const file of list) {
        const fullPath = path.join(dir, file);
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch (err) {
          continue;
        }
        if (stat.isDirectory()) {
          if (excluded.has(file)) {
            continue;
          }
          await walk(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
          results.push(fullPath);
          fileCount++;
        }
      }
    };
    await walk(rootPath);
    return results;
  }

  // Private methods

  private async ensureCacheDirectory(): Promise<void> {
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
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
          try {
            cache = await this.decompressJson(buf);
          } catch (decompressError) {
            // Corrupted compressed cache file, skip it and delete
            console.warn(`Corrupted compressed cache file ${cachePath}, removing:`, decompressError);
            await fs.unlink(cachePath).catch(() => {});
            continue;
          }
        } else {
          const data = await fs.readFile(cachePath, "utf-8");
          try {
            cache = JSON.parse(data);
          } catch (parseError) {
            // Corrupted cache file, skip it and delete
            console.warn(`Corrupted cache file ${cachePath}, removing:`, parseError);
            await fs.unlink(cachePath).catch(() => {});
            continue;
          }
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
    } catch {
      // File doesn't exist or can't be accessed, assume it's a path
      // For non-existent files, use the parent directory
      return path.dirname(targetPath);
    }
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
    if (!this.symbolCache) {
      return [];
    }
    
    const fileHash = await this.hashFile(filePath);
    
    // Check cache first
    const cached = await this.symbolCache.getSymbols(filePath, fileHash);
    if (cached) {
      return cached;
    }
    
    // Basic symbol extraction - return mock symbols for now
    // TODO: integrate with actual symbol extraction logic
    const symbols: CachedSymbol[] = [
      { name: `symbol_${path.basename(filePath)}`, kind: 'function', location: '1:1' }
    ];
    
    // Store in cache
    this.symbolCache.setSymbols(filePath, fileHash, symbols);
    
    return symbols;
  }

  async analyzeFilesParallel(files: string[]): Promise<any[]> {
    if (!this.workerPool) {
      // Fallback to sequential analysis using analyzeFile method
      const results = [];
      for (const file of files) {
        try {
          const symbols = await this.analyzeFile(file);
          results.push({ filePath: file, symbols, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({ filePath: file, symbols: [], error: errorMessage });
        }
      }
      return results;
    }
    
    const results = await Promise.all(
      files.map(file =>
        this.workerPool!.runTask(file)
      )
    );
    
    // Cache the results from worker analysis
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = results[i];
      
      if (result && !result.error && this.symbolCache) {
        try {
          const fileHash = await this.hashFile(file);
          
          // Transform worker result to CachedSymbol format if needed
          const symbols = result.symbols || [];
          
          // Save to symbol cache
          this.symbolCache.setSymbols(file, fileHash, symbols);
          
          // Also update our internal cache for consistency
          await this.updateCache(file, symbols, []); // TODO: extract dependencies from results
          
        } catch (error) {
          console.error('[IncrementalAnalyzer][ERROR] Failed to cache results for', file, ':', error);
        }
      }
    }
    
    return results;
  }
}

/**
 * Factory for creating incremental analyzer instances with memory management
 */
export class IncrementalAnalyzerFactory {
  private static instances = new Map<string, IncrementalAnalyzer>();
  private static maxInstances = 3; // Limit concurrent analyzer instances
  private static accessOrder: string[] = []; // LRU tracking for instances

  static async create(projectPath: string): Promise<IncrementalAnalyzer> {
    const normalizedPath = path.resolve(projectPath);

    if (!this.instances.has(normalizedPath)) {
      // Cleanup old instances if we're at the limit
      if (this.instances.size >= this.maxInstances) {
        await this.cleanupLRUInstance();
      }

      const analyzer = new IncrementalAnalyzer(normalizedPath);
      await analyzer.initialize();
      this.instances.set(normalizedPath, analyzer);
    }

    // Update access order
    this.updateAccessOrder(normalizedPath);
    
    return this.instances.get(normalizedPath)!;
  }

  /**
   * Update LRU access order for instances
   */
  private static updateAccessOrder(path: string): void {
    const index = this.accessOrder.indexOf(path);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(path);
  }

  /**
   * Cleanup the least recently used instance
   */
  private static async cleanupLRUInstance(): Promise<void> {
    if (this.accessOrder.length === 0) return;
    
    const lruPath = this.accessOrder.shift()!;
    const analyzer = this.instances.get(lruPath);
    
    if (analyzer) {
      await analyzer.cleanup();
      this.instances.delete(lruPath);
      console.error(`[Factory][MEMORY] Cleaned up LRU analyzer instance: ${lruPath}`);
    }
  }

  /**
   * Clear all instances with proper cleanup
   */
  static async clear(): Promise<void> {
    // Cleanup all instances properly
    for (const [path, analyzer] of this.instances) {
      await analyzer.cleanup();
    }
    this.instances.clear();
    this.accessOrder.length = 0;
  }

  /**
   * Get memory statistics for all instances
   */
  static getMemoryStats(): { instanceCount: number; totalCacheEntries: number } {
    let totalCacheEntries = 0;
    for (const analyzer of this.instances.values()) {
      totalCacheEntries += analyzer.getCacheStats().totalCachedFiles;
    }
    return {
      instanceCount: this.instances.size,
      totalCacheEntries
    };
  }
}
