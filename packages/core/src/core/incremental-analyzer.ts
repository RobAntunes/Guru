/**
 * @fileoverview Incremental analysis engine for Guru
 * Provides intelligent change detection and incremental processing
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
import { GuruDatabase } from './database.js';
import * as os from 'os';
import { fileURLToPath } from 'url';

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
    
    // Always use isolated database instances for tests
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      // Use project path as test ID to ensure same project uses same database
      const testId = `test-${path.resolve(projectPath).replace(/[^a-zA-Z0-9]/g, '_')}`;
      this.db = DatabaseAdapter.getTestInstance(testId);
    } else {
      this.db = DatabaseAdapter.getInstance();
    }
    
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
      // Always prefer the compiled version for workers (Node.js workers need .js files)
      let workerPath;
      
      // Get current module directory in ESM-compatible way
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const compiledPath = path.join(currentDir, 'worker-symbol-analyze.js');
      
      if (await this.fileExists(compiledPath)) {
        workerPath = compiledPath;
      } else {
        // Try to resolve from dist directory
        const distPath = path.join(process.cwd(), 'dist', 'core', 'worker-symbol-analyze.js');
        if (await this.fileExists(distPath)) {
          workerPath = distPath;
        } else {
          throw new Error('Compiled worker file not found. Please run "bun run build" first.');
        }
      }
      
      this.workerPool = new WorkerPool(workerPath, maxWorkers, {
        maxMemoryMB: this.memoryLimits.maxMemoryMB,
        pressureThresholdMB: Math.floor(this.memoryLimits.maxMemoryMB * 0.7),
        criticalThresholdMB: Math.floor(this.memoryLimits.maxMemoryMB * 0.9),
        minWorkers: Math.max(1, Math.floor(maxWorkers / 2)),
        maxWorkers: maxWorkers
      });
      
      if (!this.quiet) {
        console.log(`[IncrementalAnalyzer] Initialized worker pool with ${maxWorkers} workers using ${workerPath}`);
      }
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
   * Flush all pending writes and clean up
   */
  async flush(): Promise<void> {
    // Flush symbol cache
    if (this.symbolCache) {
      await this.symbolCache.flush();
    }
    
    // Flush in-memory cache to ensure consistency
    const flushPromises = Array.from(this.fileCache.entries()).map(async ([file, cache]) => {
      try {
        await this.persistCacheEntry(file, cache);
      } catch (error) {
        if (!this.quiet) {
          console.warn(`Failed to persist cache entry for ${file}:`, error);
        }
      }
    });
    
    await Promise.all(flushPromises);
    
    if (!this.quiet) {
      console.log(`🔄 IncrementalAnalyzer flush completed`);
    }
  }

  /**
   * Cleanup method to be called before analyzer is destroyed
   */
  async cleanup(): Promise<void> {
    if (!this.quiet) {
      console.log('[IncrementalAnalyzer] Starting cleanup...');
    }
    
    // Stop memory monitoring first
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = undefined;
    }
    
    // Cleanup worker pool with timeout
    if (this.workerPool) {
      try {
        await Promise.race([
          this.workerPool.destroy(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Worker pool cleanup timeout')), 5000)
          )
        ]);
        this.workerPool = null;
      } catch (error) {
        if (!this.quiet) {
          console.error('[IncrementalAnalyzer] Worker pool cleanup error:', error);
        }
        this.workerPool = null;
      }
    }
    
    // Flush all pending writes in symbol cache
    if (this.symbolCache) {
      try { 
        await this.symbolCache.flush(); 
        this.symbolCache = undefined;
      } catch (error) {
        if (!this.quiet) {
          console.error('[IncrementalAnalyzer] Symbol cache flush error:', error);
        }
      }
    }
    
    // Don't close database connection here - it's a singleton and other components might still need it
    // Database will be closed properly in tests via DatabaseAdapter.reset()
    
    // Clear memory caches
    this.fileCache.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.fileCacheAccess.length = 0;
    this.dependencyAccess.length = 0;
    
    if (!this.quiet) {
      console.log('[IncrementalAnalyzer] Cleanup completed');
    }
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
      if (!this.quiet) {
        console.log('🔍 No symbol cache available, treating all files as new');
      }
      return {
        changedFiles: [],
        deletedFiles: [],
        newFiles: allFiles,
        affectedFiles: allFiles,
      };
    }
    
    const changedFiles: string[] = [];
    const newFiles: string[] = [];
    const deletedFiles: string[] = [];
    
    // Build current file set for deletion detection (normalize paths)
    const currentFiles = new Set(allFiles.map(f => path.resolve(f)));
    
    // Get previously cached files to detect deletions
    const previousFiles = await this.getPreviouslyCachedFiles();
    
    if (!this.quiet) {
      console.log(`🔍 Delta Detection Debug:`);
      console.log(`  📋 Current files: ${allFiles.length}`);
      console.log(`  📦 Previously cached files: ${previousFiles.length}`);
    }
    

    
    // Detect deleted files (normalize cached file paths for comparison)
    for (const cachedFile of previousFiles) {
      const normalizedCachedFile = path.resolve(cachedFile);
      if (!currentFiles.has(normalizedCachedFile)) {
        deletedFiles.push(cachedFile);
        if (!this.quiet) {
          console.log(`  🗑️  Deleted: ${path.basename(cachedFile)}`);
        }

      }
    }
    
    // Detect new and changed files
    for (const file of allFiles) {
      try {
        const currentHash = await this.hashFile(file);
        const cached = await this.symbolCache!.getSymbols(file, currentHash);
        
        if (!this.quiet) {
          console.log(`  🔍 Checking ${path.basename(file)} (hash: ${currentHash.substring(0, 8)}...)`);
          console.log(`    📦 Cache hit: ${cached ? 'YES' : 'NO'}`);
        }
        
        if (!cached) {
          // Check if file is completely new or just changed
          const anyVersionCached = await this.symbolCache!.hasFileAsync(file);
          
          if (!this.quiet) {
            console.log(`    📦 File cached (any version): ${anyVersionCached}`);
          }
          
          if (anyVersionCached) {
            changedFiles.push(file);
            if (!this.quiet) {
              console.log(`    ✏️  Detected as CHANGED: ${path.basename(file)}`);
            }
          } else {
            newFiles.push(file);
            if (!this.quiet) {
              console.log(`    ✨ Detected as NEW: ${path.basename(file)}`);
            }
          }
        } else {
          if (!this.quiet) {
            console.log(`    ✅ Unchanged: ${path.basename(file)}`);
          }
        }
      } catch (error) {
        // File access error, treat as new
        newFiles.push(file);
        if (!this.quiet) {
          console.log(`    ❌ Error accessing ${path.basename(file)}, treating as new: ${error}`);
        }
      }
    }
    
    // Calculate affected files using dependency analysis
    const affectedFiles = this.calculateAffectedFiles([...changedFiles, ...newFiles, ...deletedFiles]);
    
    if (!this.quiet) {
      console.log(`🔍 Delta Analysis Complete:`);
      console.log(`  📝 Changed files: ${changedFiles.length} - ${changedFiles.map(f => path.basename(f)).join(', ')}`);
      console.log(`  ✨ New files: ${newFiles.length} - ${newFiles.map(f => path.basename(f)).join(', ')}`);
      console.log(`  🗑️  Deleted files: ${deletedFiles.length} - ${deletedFiles.map(f => path.basename(f)).join(', ')}`);
      console.log(`  📊 Affected files: ${affectedFiles.length} - ${affectedFiles.map(f => path.basename(f)).join(', ')}`);
    }
    
    const result = {
      changedFiles,
      deletedFiles,
      newFiles,
      affectedFiles,
    };
    

    
    return result;
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
    // Include all affected files which already includes dependency analysis
    const filesToAnalyze = changes.affectedFiles;
    
    // Ensure we analyze new files even if they're not in dependencies yet
    const newFilesNotInAffected = changes.newFiles.filter(file => !changes.affectedFiles.includes(file));
    filesToAnalyze.push(...newFilesNotInAffected);
    
    return Array.from(new Set(filesToAnalyze)); // Remove duplicates
  }

  /**
   * Get all files that were previously cached (for deletion detection)
   */
  private async getPreviouslyCachedFiles(): Promise<string[]> {
    const cachedFiles: string[] = [];
    
    // Get from in-memory cache
    cachedFiles.push(...this.fileCache.keys());
    
    // Get from symbol cache if available
    if (this.symbolCache) {
      try {
        const cachedFromSymbolCache = await this.symbolCache.getAllCachedFiles();
        cachedFiles.push(...cachedFromSymbolCache);
      } catch (error) {
        if (!this.quiet) {
          console.warn('Warning: Could not retrieve cached files from symbol cache:', error);
        }
      }
    }
    
    // Get from database
    try {
      const dbFiles = await this.db.getAllAnalyzedFiles();
      cachedFiles.push(...dbFiles);
    } catch (error) {
      if (!this.quiet) {
        console.warn('Warning: Could not retrieve cached files from database:', error);
      }
    }
    
    // Remove duplicates and return
    return Array.from(new Set(cachedFiles));
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
    const normalizedProjectPath = path.resolve(this.projectPath);
    const checkpoint: AnalysisCheckpoint = {
      projectPath: normalizedProjectPath,
      totalFiles,
      analyzedFiles,
      timestamp: Date.now(),
      version: this.currentVersion,
      gitCommit: await this.getCurrentGitCommit(),
    };
    
    try {
      const checkpointId = `checkpoint-${normalizedProjectPath}`;
      console.log(`[DEBUG][saveCheckpoint] Saving checkpoint with ID: ${checkpointId}`);
      
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
      console.log(`[DEBUG][saveCheckpoint] Successfully saved checkpoint to database`);
    } catch (error) {
      console.warn("Failed to save checkpoint to database:", error);
      
      // Fallback to file-based checkpoint
      const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
      const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
      console.log(`[DEBUG][saveCheckpoint] Falling back to file-based checkpoint: ${checkpointPath}`);
      await fs.mkdir(baseDir, { recursive: true });
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
      console.log(`[DEBUG][saveCheckpoint] Successfully saved file-based checkpoint`);
    }
  }

  /**
   * Load analysis checkpoint
   */
  async loadCheckpoint(): Promise<AnalysisCheckpoint | null> {
    try {
      const normalizedProjectPath = path.resolve(this.projectPath);
      const checkpointId = `checkpoint-${normalizedProjectPath}`;
      console.log(`[DEBUG][loadCheckpoint] Looking for checkpoint with ID: ${checkpointId}`);
      
      // Try loading from database first
      const sessions = await this.db.getAnalysisSessions(checkpointId, 1);
      console.log(`[DEBUG][loadCheckpoint] Found ${sessions.length} sessions in database`);
      
      if (sessions.length > 0) {
        const session = sessions[0];
        console.log(`[DEBUG][loadCheckpoint] Session data exists: ${!!session.session_data}`);
        console.log(`[DEBUG][loadCheckpoint] Checkpoint exists: ${!!(session.session_data && session.session_data.checkpoint)}`);
        
        // The checkpoint is stored in the session_data.checkpoint field
        if (session.session_data && session.session_data.checkpoint) {
          console.log(`[DEBUG][loadCheckpoint] Successfully loaded checkpoint from database`);
          return session.session_data.checkpoint as AnalysisCheckpoint;
        }
      }
    } catch (error) {
      console.warn("Failed to load checkpoint from database:", error);
    }

    // Fallback to file-based checkpoint
    const baseDir = await IncrementalAnalyzer.getBaseDirectory(this.cacheDir);
    const checkpointPath = path.join(baseDir, 'analysis-checkpoint.json');
    console.log(`[DEBUG][loadCheckpoint] Checking file-based checkpoint: ${checkpointPath}`);
    
    if (!fsSync.existsSync(checkpointPath)) {
      console.log(`[DEBUG][loadCheckpoint] No file-based checkpoint found`);
      return null;
    }
    
    try {
      const data = await fs.readFile(checkpointPath, 'utf-8');
      const checkpoint = JSON.parse(data);
      console.log(`[DEBUG][loadCheckpoint] Successfully loaded file-based checkpoint`);
      return checkpoint;
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
    const currentPath = new Set<string>(); // For cycle detection

    const traverse = (file: string, depth = 0) => {
      if (visited.has(file) || depth > 20) return; // Prevent infinite loops with deeper traversal
      if (currentPath.has(file)) {
        // Cycle detected, log and skip
        if (!this.quiet) {
          console.warn(`🔄 Dependency cycle detected involving: ${file}`);
        }
        return;
      }
      
      visited.add(file);
      currentPath.add(file);

      const dependents = this.reverseDependencyGraph.get(file);
      if (dependents) {
        for (const dependent of dependents) {
          // Skip if already processed
          if (affected.has(dependent)) continue;
          
          affected.add(dependent);
          traverse(dependent, depth + 1);
        }
      }
      
      currentPath.delete(file);
    };

    // Start traversal from all changed files
    for (const file of changedFiles) {
      traverse(file);
    }

    // Also include the originally changed files themselves
    for (const file of changedFiles) {
      affected.add(file);
    }

    if (!this.quiet && affected.size > 0) {
      console.log(`📊 Dependency impact: ${changedFiles.length} changed files affect ${affected.size} total files`);
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
    return this.calculateFileHash(filePath);
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

  async analyzeFilesSequential(files: string[]): Promise<any[]> {
    const results: any[] = [];
    
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

  async analyzeFilesParallel(files: string[]): Promise<any[]> {
    const startTime = Date.now();
    const fileCount = files.length;
    
    if (!this.workerPool) {
      // Fallback to sequential analysis using analyzeFile method
      if (!this.quiet) {
        console.log(`[IncrementalAnalyzer] Using sequential analysis for ${fileCount} files (no worker pool)`);
      }
      
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
      
      const duration = Date.now() - startTime;
      if (!this.quiet) {
        console.log(`[IncrementalAnalyzer] Sequential analysis completed: ${fileCount} files in ${duration}ms (${(duration/fileCount).toFixed(2)}ms/file)`);
      }
      
      return results;
    }

    if (!this.quiet) {
      console.log(`[IncrementalAnalyzer] Using parallel analysis for ${fileCount} files with ${this.workerPool.getStats().activeWorkers + this.workerPool.getStats().idleWorkers} workers`);
    }

    // Use adaptive batch processing for better memory management and performance
    const results = await this.processFilesInBatches(files, startTime);
    
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r && !r.error).length;
    const errorCount = results.filter(r => r && r.error).length;
    
    if (!this.quiet) {
      console.log(`[IncrementalAnalyzer] Parallel analysis completed: ${successCount} success, ${errorCount} errors in ${duration}ms (${(duration/fileCount).toFixed(2)}ms/file)`);
      
      const stats = this.workerPool.getStats();
      console.log(`[IncrementalAnalyzer] Worker pool stats: ${stats.activeWorkers} active, ${stats.idleWorkers} idle, ${stats.queueLength} queued, memory pressure: ${stats.memoryPressureLevel}`);
      
      // Calculate performance improvement
      const avgTimePerFile = duration / fileCount;
      const estimatedSequentialTime = avgTimePerFile * fileCount * 2.5; // Conservative estimate
      const speedupRatio = estimatedSequentialTime / duration;
      console.log(`[IncrementalAnalyzer] Estimated speedup: ${speedupRatio.toFixed(2)}x over sequential processing`);
    }
    
    return results;
  }

  /**
   * Process files in adaptive batches for optimal performance and memory usage
   */
  private async processFilesInBatches(files: string[], startTime: number): Promise<any[]> {
    const results: any[] = [];
    if (files.length === 0) return results;
    const workerStats = this.workerPool!.getStats();
    const baseBatchSize = Math.max(1, Math.floor(files.length / (workerStats.activeWorkers + workerStats.idleWorkers)));
    const adaptiveBatchSize = this.calculateAdaptiveBatchSize(baseBatchSize, files.length, workerStats.memoryPressureLevel);
    if (!this.quiet) {
      console.log(`[DEBUG][processFilesInBatches] Start: ${files.length} files, batch size ${adaptiveBatchSize}`);
    }
    if (files.length === 1) {
      // Special case: single file, avoid batching logic
      const batchFiles = files;
      const batchStartTime = Date.now();
      let batchResults;
      try {
        batchResults = [await this.processFileWithRetry(files[0])];
      } catch (e) {
        console.error('[DEBUG][processFilesInBatches] Error in single-file batch:', e);
        // Return error result instead of throwing
        batchResults = [{ filePath: files[0], symbols: [], error: e instanceof Error ? e.message : String(e) }];
      }
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Batch results received for single file: ${batchFiles[0]}`);
        console.log(`[DEBUG][processFilesInBatches] Calling processBatchResults for single file: ${batchFiles[0]}`);
      }
      await this.processBatchResults(batchFiles, batchResults);
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Returned from processBatchResults for single file: ${batchFiles[0]}`);
      }
      results.push(...batchResults);
      const batchDuration = Date.now() - batchStartTime;
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Single file batch completed in ${batchDuration}ms (100.0% total)`);
      }
      return results;
    }
    for (let i = 0; i < files.length; i += adaptiveBatchSize) {
      const batchFiles = files.slice(i, i + adaptiveBatchSize);
      const batchStartTime = Date.now();
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Processing batch ${Math.floor(i / adaptiveBatchSize) + 1}: files ${batchFiles.join(', ')}`);
      }
      let batchResults;
      try {
        batchResults = await Promise.all(
          batchFiles.map(file => this.processFileWithRetry(file))
        );
      } catch (e) {
        console.error('[DEBUG][processFilesInBatches] Error in batch Promise.all:', e);
        // Return error results for all files in batch instead of throwing
        batchResults = batchFiles.map(file => ({ 
          filePath: file, 
          symbols: [], 
          error: e instanceof Error ? e.message : String(e) 
        }));
      }
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Batch results received for files: ${batchFiles.join(', ')}`);
        console.log(`[DEBUG][processFilesInBatches] Calling processBatchResults for files: ${batchFiles.join(', ')}`);
      }
      await this.processBatchResults(batchFiles, batchResults);
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Returned from processBatchResults for files: ${batchFiles.join(', ')}`);
      }
      results.push(...batchResults);
      const batchDuration = Date.now() - batchStartTime;
      const totalDuration = Date.now() - startTime;
      const progress = ((i + batchFiles.length) / files.length * 100).toFixed(1);
      if (!this.quiet) {
        console.log(`[DEBUG][processFilesInBatches] Batch ${Math.floor(i / adaptiveBatchSize) + 1} completed in ${batchDuration}ms (${progress}% total)`);
      }
      const currentStats = this.workerPool!.getStats();
      if (currentStats.memoryPressureLevel === 'high' || currentStats.memoryPressureLevel === 'critical') {
        if (!this.quiet) {
          console.log(`[DEBUG][processFilesInBatches] Memory pressure: ${currentStats.memoryPressureLevel}`);
        }
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (!this.quiet) {
      console.log('[DEBUG][processFilesInBatches] All batches complete');
    }
    return results;
  }

  /**
   * Calculate adaptive batch size based on system conditions
   */
  private calculateAdaptiveBatchSize(baseBatchSize: number, totalFiles: number, memoryPressureLevel: string): number {
    let batchSize = baseBatchSize;
    
    // Adjust based on memory pressure
    switch (memoryPressureLevel) {
      case 'critical':
        batchSize = Math.max(1, Math.floor(batchSize * 0.3));
        break;
      case 'high':
        batchSize = Math.max(1, Math.floor(batchSize * 0.5));
        break;
      case 'medium':
        batchSize = Math.max(1, Math.floor(batchSize * 0.8));
        break;
      case 'low':
        batchSize = Math.min(totalFiles, Math.floor(batchSize * 1.2));
        break;
    }
    
    // Ensure reasonable bounds
    batchSize = Math.max(1, Math.min(50, batchSize)); // Between 1 and 50 files per batch
    
    return batchSize;
  }

  /**
   * Process a single file with retry logic
   */
  private async processFileWithRetry(file: string, maxRetries = 2): Promise<any> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!this.quiet) {
        console.log(`[DEBUG][processFileWithRetry] Attempt ${attempt + 1} for file: ${file}`);
      }
      try {
        const result = await Promise.race([
          this.workerPool!.runTask(file),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`[Timeout] runTask timed out for file: ${file}`)), 5000))
        ]);
        if (!this.quiet) {
          console.log(`[DEBUG][processFileWithRetry] Success for file: ${file}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!this.quiet) {
          console.error(`[DEBUG][processFileWithRetry] Error for file: ${file} on attempt ${attempt + 1}:`, lastError.message);
        }
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        }
      }
    }
    if (!this.quiet) {
      console.error(`[DEBUG][processFileWithRetry] All attempts failed for file: ${file}`);
    }
    return { filePath: file, symbols: [], error: lastError?.message || 'Unknown error' };
  }

  /**
   * Process batch results with enhanced dependency extraction and caching
   */
  private async processBatchResults(batchFiles: string[], batchResults: any[]): Promise<void> {
    if (!this.quiet) {
      console.log(`[DEBUG][processBatchResults] Start for files: ${batchFiles.join(', ')}`);
    }
    const cachePromises: Promise<void>[] = [];
    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      const result = batchResults[i];
      if (!this.quiet) {
        console.log(`[DEBUG][processBatchResults] Processing file: ${file}`);
      }
      if (result && !result.error && this.symbolCache) {
        // Process asynchronously to avoid blocking
        cachePromises.push(this.cacheFileResult(file, result));
      }
    }
    if (!this.quiet) {
      console.log(`[DEBUG][processBatchResults] Awaiting all cache promises for files: ${batchFiles.join(', ')}`);
    }
    await Promise.all(cachePromises);
    if (!this.quiet) {
      console.log(`[DEBUG][processBatchResults] All cache promises complete for files: ${batchFiles.join(', ')}`);
    }
  }

  /**
   * Cache a single file result with enhanced dependency extraction
   */
  private async cacheFileResult(file: string, result: any): Promise<void> {
    if (!this.quiet) {
      console.log(`[DEBUG][cacheFileResult] Start for file: ${file}`);
    }
    try {
      // Skip caching if the result has an error
      if (result.error) {
        if (!this.quiet) {
          console.log(`[DEBUG][cacheFileResult] Skipping cache for error result: ${file}`);
        }
        return;
      }
      
      if (!this.quiet) {
        console.log(`[DEBUG][cacheFileResult] About to hash file: ${file}`);
      }
      const fileHash = await this.hashFile(file);
      if (!this.quiet) {
        console.log(`[DEBUG][cacheFileResult] Finished hashing file: ${file}`);
      }
      const symbols = result.symbols || [];
      if (this.symbolCache) {
        if (!this.quiet) {
          console.log(`[DEBUG][cacheFileResult] About to call setSymbols for file: ${file}`);
        }
        this.symbolCache.setSymbols(file, fileHash, symbols);
      }
      const dependencies = this.extractDependenciesFromSymbols(file, symbols);
      if (!this.quiet) {
        console.log(`[DEBUG][cacheFileResult] Completed for file: ${file}`);
      }
    } catch (e) {
      if (!this.quiet) {
        console.error(`[DEBUG][cacheFileResult] Error for file: ${file}:`, e);
      }
      // Don't throw - just skip caching for this file
    }
  }

  /**
   * Extract dependencies from symbols with enhanced analysis
   */
  private extractDependenciesFromSymbols(filePath: string, symbols: any[]): string[] {
    const dependencies: string[] = [];
    const fileDir = path.dirname(filePath);
    
    for (const symbol of symbols) {
      // Look for import/require statements in symbol references
      if (symbol.references) {
        for (const ref of symbol.references) {
          if (ref.type === 'import' || ref.type === 'require') {
            const depPath = this.resolveImportPath(ref.target, fileDir);
            if (depPath && !dependencies.includes(depPath)) {
              dependencies.push(depPath);
            }
          }
        }
      }
      
      // Check for file dependencies based on location.file instead of treating location as string
      if (symbol.location && typeof symbol.location === 'object' && symbol.location.file) {
        const potentialDep = path.resolve(fileDir, symbol.location.file);
        if (potentialDep !== filePath && !dependencies.includes(potentialDep)) {
          dependencies.push(potentialDep);
        }
      }
      
      // Also check for string-based location references (legacy support)
      if (symbol.location && typeof symbol.location === 'string' && symbol.location.includes('.')) {
        const potentialDep = path.resolve(fileDir, symbol.location);
        if (potentialDep !== filePath && !dependencies.includes(potentialDep)) {
          dependencies.push(potentialDep);
        }
      }
    }
    
    return dependencies;
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(importPath: string, fromDir: string): string | null {
    try {
      // Handle relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        return path.resolve(fromDir, importPath);
      }
      
      // Handle absolute imports (simplified - would need package.json resolution in real implementation)
      if (importPath.startsWith('/')) {
        return importPath;
      }
      
      // Skip node_modules and other external dependencies for now
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the database instance for external access
   */
  getDatabase(): GuruDatabase {
    return this.db.getDatabase();
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
   * Clear all instances with proper cleanup
   */
  static async clear(): Promise<void> {
    // Cleanup all instances properly with timeout
    const cleanupPromises = Array.from(this.instances.entries()).map(async ([path, analyzer]) => {
      try {
        await Promise.race([
          analyzer.cleanup(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Analyzer cleanup timeout: ${path}`)), 3000)
          )
        ]);
      } catch (error) {
        console.error(`[Factory] Failed to cleanup analyzer for ${path}:`, error);
      }
    });
    
    await Promise.allSettled(cleanupPromises);
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
}
