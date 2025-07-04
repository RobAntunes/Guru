/**
 * Incremental Analysis System for Guru
 * Only reanalyzes changed files and affected dependencies
 */

import { promises as fs } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { SymbolNode, SymbolGraph } from "../types/index.js";

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

  constructor(projectPath: string) {
    this.cacheDir = path.join(projectPath, ".guru", "cache");
  }

  /**
   * Initialize incremental analysis system
   */
  async initialize(): Promise<void> {
    await this.ensureCacheDirectory();
    await this.loadExistingCache();
    await this.buildDependencyGraphs();
  }

  /**
   * Detect changes since last analysis
   */
  async detectChanges(files: string[]): Promise<ChangeDetectionResult> {
    const currentFileInfo = await this.getCurrentFileInfo(files);
    const cachedFiles = new Set(this.fileCache.keys());
    const currentFiles = new Set(files);

    // Identify file changes
    const changedFiles: string[] = [];
    const newFiles: string[] = [];

    for (const file of files) {
      if (!cachedFiles.has(file)) {
        newFiles.push(file);
      } else {
        const cached = this.fileCache.get(file)!;
        const current = currentFileInfo.get(file)!;

        if (
          cached.hash !== current.hash ||
          cached.lastModified !== current.lastModified
        ) {
          changedFiles.push(file);
        }
      }
    }

    // Identify deleted files
    const deletedFiles = Array.from(cachedFiles).filter(
      (file) => !currentFiles.has(file),
    );

    // Calculate affected files through dependency propagation
    const affectedFiles = this.calculateAffectedFiles([
      ...changedFiles,
      ...newFiles,
      ...deletedFiles,
    ]);

    const analysisRequired =
      changedFiles.length > 0 || newFiles.length > 0 || deletedFiles.length > 0;

    return {
      changedFiles,
      newFiles,
      deletedFiles,
      affectedFiles,
      analysisRequired,
    };
  }

  /**
   * Get files that need analysis (changed + affected)
   */
  getFilesRequiringAnalysis(changes: ChangeDetectionResult): string[] {
    const filesToAnalyze = new Set([
      ...changes.changedFiles,
      ...changes.newFiles,
      ...changes.affectedFiles,
    ]);

    // Remove deleted files
    changes.deletedFiles.forEach((file) => filesToAnalyze.delete(file));

    return Array.from(filesToAnalyze);
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
    const checkpoint: AnalysisCheckpoint = {
      projectPath,
      totalFiles,
      analyzedFiles,
      timestamp: Date.now(),
      version: this.currentVersion,
      gitCommit: await this.getCurrentGitCommit(),
    };

    const checkpointPath = path.join(this.cacheDir, "checkpoint.json");
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Load analysis checkpoint
   */
  async loadCheckpoint(): Promise<AnalysisCheckpoint | null> {
    try {
      const checkpointPath = path.join(this.cacheDir, "checkpoint.json");
      const data = await fs.readFile(checkpointPath, "utf-8");
      return JSON.parse(data);
    } catch {
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

  // Private methods

  private async ensureCacheDirectory(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  private async loadExistingCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter((f) => f.endsWith(".cache.json"));

      for (const cacheFile of cacheFiles) {
        const cachePath = path.join(this.cacheDir, cacheFile);
        const data = await fs.readFile(cachePath, "utf-8");
        const cache: FileAnalysisCache = JSON.parse(data);

        // Only load cache entries with compatible version
        if (cache.version === this.currentVersion) {
          const originalFile = this.decodeCacheFileName(cacheFile);
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
    const fileName = this.encodeCacheFileName(file);
    const cachePath = path.join(this.cacheDir, fileName);

    // Add original file path to cache entry for decoding
    const cacheWithPath = { ...cache, originalPath: file };

    await fs.writeFile(cachePath, JSON.stringify(cacheWithPath, null, 2));
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
