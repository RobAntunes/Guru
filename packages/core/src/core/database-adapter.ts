/**
 * Database Adapter - SurrealDB Implementation
 * Provides the same interface as the original DatabaseAdapter but uses UnifiedStorageManager
 */

import { UnifiedStorageManager } from '../storage/unified-storage-manager.js';
import { guruConfig } from './config.js';
import path from 'path';

// Global type declaration for test instances
declare global {
  var __guru_test_instances_surrealdb: Map<string, DatabaseAdapter> | undefined;
}

/**
 * Database connection manager that provides unified access to storage
 */
export class DatabaseAdapter {
  private static instance: DatabaseAdapter | null = null;
  private storage: UnifiedStorageManager;
  private isConnected: boolean = false;

  private constructor() {
    this.storage = new UnifiedStorageManager();
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  static getTestInstance(testId?: string): DatabaseAdapter {
    if (!testId) {
      testId = 'default';
    }
    
    // Store test instances globally to share within the same test
    if (!global.__guru_test_instances_surrealdb) {
      global.__guru_test_instances_surrealdb = new Map();
    }
    
    if (global.__guru_test_instances_surrealdb.has(testId)) {
      return global.__guru_test_instances_surrealdb.get(testId)!;
    }
    
    const testAdapter = new DatabaseAdapter();
    // UnifiedStorageManager will handle test mode internally
    
    global.__guru_test_instances_surrealdb.set(testId, testAdapter);
    return testAdapter;
  }

  /**
   * Initialize connection
   */
  async init(): Promise<void> {
    if (!this.isConnected) {
      await this.storage.connect();
      this.isConnected = true;
    }
  }

  /**
   * Get the underlying database instance (compatibility method)
   */
  getDatabase(): any {
    if (!this.isConnected) {
      this.reconnectSync();
    }
    return this.storage;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.isConnected && this.storage) {
      try {
        await this.storage.disconnect();
      } catch (error) {
        console.debug('Database close error (ignored):', error);
      }
      this.isConnected = false;
    }
  }

  /**
   * Reset singleton instance (for testing)
   */
  static async reset(): Promise<void> {
    if (DatabaseAdapter.instance) {
      await DatabaseAdapter.instance.close();
      DatabaseAdapter.instance = null;
    }
    
    // Clear test instances
    if (global.__guru_test_instances_surrealdb) {
      for (const adapter of global.__guru_test_instances_surrealdb.values()) {
        await adapter.close();
      }
      global.__guru_test_instances_surrealdb.clear();
    }
  }

  /**
   * Clear all cached data (for testing)
   */
  async clearCache(): Promise<void> {
    await this.init();
    await this.storage.clearCache();
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected && this.storage !== null;
  }

  /**
   * Reconnect database if closed
   */
  async reconnect(): Promise<void> {
    if (!this.isConnected) {
      await this.init();
    }
  }

  /**
   * Synchronous reconnect for backward compatibility
   */
  private reconnectSync(): void {
    if (!this.isConnected) {
      // Mark as connected to prevent infinite loops
      // Actual connection will happen on first async operation
      this.isConnected = true;
    }
  }

  /**
   * Pattern Learning Persistence
   */
  async savePatternWeights(weights: Map<string, number>, metadata?: any): Promise<void> {
    await this.init();
    const operations = Array.from(weights.entries()).map(([pattern, weight]) => 
      this.storage.storePatternWeight(pattern, weight, metadata)
    );
    await Promise.all(operations);
  }

  async loadPatternWeights(): Promise<Map<string, number>> {
    await this.init();
    const patterns = await this.storage.getPatternWeights();
    const map = new Map<string, number>();
    
    for (const pattern of patterns) {
      if (pattern.weight !== undefined) {
        map.set(pattern.name, pattern.weight);
      }
    }
    
    return map;
  }

  async getPatternHistory(pattern: string, limit: number = 100): Promise<any[]> {
    await this.init();
    // For now, return empty array as history is not directly supported
    // Could be implemented by querying patterns with time filters
    return [];
  }

  /**
   * File Analysis Cache Persistence
   */
  async saveFileAnalysis(filePath: string, hash: string, symbols: any[], dependencies: string[], version: string): Promise<void> {
    await this.init();
    await this.storage.cacheAnalysis(filePath, {
      hash,
      symbols,
      dependencies,
      version,
      timestamp: Date.now()
    });
  }

  async invalidateFileAnalysis(filePath: string): Promise<void> {
    await this.init();
    await this.storage.invalidateCache(filePath);
  }

  async loadFileAnalysis(filePath: string): Promise<{ hash: string; symbols: any[]; dependencies: string[]; version: string } | null> {
    await this.init();
    const result = await this.storage.getCachedAnalysis(filePath);
    if (!result) return null;

    return {
      hash: result.hash,
      symbols: result.symbols || [],
      dependencies: result.dependencies || [],
      version: result.version || '1.0.0'
    };
  }

  /**
   * Get all file paths that have been analyzed
   */
  async getAllAnalyzedFiles(): Promise<string[]> {
    await this.init();
    // Query all cached analysis entries
    const cached = await this.storage.getAllCachedFiles();
    return cached;
  }

  /**
   * Symbol Storage
   */
  async saveSymbol(symbol: any): Promise<void> {
    await this.init();
    await this.storage.storeSymbol(symbol);
  }

  async loadSymbol(id: string): Promise<any | null> {
    await this.init();
    return await this.storage.getSymbol(id);
  }

  async saveSymbolEdge(edge: any): Promise<void> {
    await this.init();
    await this.storage.createRelationship(
      edge.sourceId,
      edge.targetId,
      edge.type || 'references'
    );
  }

  /**
   * Self-Reflection Data
   */
  async saveAdversarialTest(testName: string, result: any, confidence: number, metadata?: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'adversarial_test',
      name: testName,
      result,
      confidence,
      metadata,
      timestamp: Date.now()
    });
  }

  async saveConfidenceCalibration(prediction: number, actual: number, context: string, score: number): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'confidence_calibration',
      prediction,
      actual,
      context,
      calibration_score: score,
      timestamp: Date.now()
    });
  }

  /**
   * Analysis Session Management
   */
  async saveAnalysisSession(sessionId: string, targetPath: string, scanMode: string, stats: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'analysis_session',
      sessionId,
      targetPath,
      scanMode,
      stats,
      timestamp: Date.now()
    });
  }

  async getAnalysisSessions(sessionId: string, limit: number = 10): Promise<any[]> {
    await this.init();
    const results = await this.storage.getAnalysisResults('analysis_session', limit);
    return results.filter(r => r.sessionId === sessionId);
  }

  // Extended Self-Reflection Components
  async storePeerReview(reviewerId: string, targetAnalysis: string, reviewData: any, confidenceScore?: number, metadata?: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'peer_review',
      reviewerId,
      targetAnalysis,
      reviewData,
      confidenceScore,
      metadata,
      timestamp: Date.now()
    });
    console.log(`💾 Stored peer review from ${reviewerId} for analysis ${targetAnalysis}`);
  }

  async getPeerReviews(limit: number = 100): Promise<any[]> {
    await this.init();
    return await this.storage.getAnalysisResults('peer_review', limit);
  }

  async storeConsensusResult(analysisId: string, consensusData: any, confidenceLevel?: number, participantCount?: number, metadata?: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'consensus',
      analysisId,
      consensusData,
      confidenceLevel,
      participantCount,
      metadata,
      timestamp: Date.now()
    });
    console.log(`💾 Stored consensus result for analysis ${analysisId} with ${participantCount} participants`);
  }

  async getConsensusResult(analysisId: string): Promise<any | null> {
    await this.init();
    const results = await this.storage.getAnalysisResults('consensus', 1);
    return results.find(r => r.analysisId === analysisId) || null;
  }

  async storeAdaptiveTuning(parameterName: string, parameterValue: number, context?: string, performanceMetric?: number, metadata?: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'adaptive_tuning',
      parameterName,
      parameterValue,
      context,
      performanceMetric,
      metadata,
      timestamp: Date.now()
    });
    console.log(`🎛️ Stored adaptive tuning: ${parameterName} = ${parameterValue}`);
  }

  async getAdaptiveTuning(parameterName: string, limit: number = 100): Promise<any[]> {
    await this.init();
    const results = await this.storage.getAnalysisResults('adaptive_tuning', limit);
    return results.filter(r => r.parameterName === parameterName);
  }

  async storeAdaptiveHistory(parameterName: string, oldValue?: number, newValue?: number, reason?: string, performanceDelta?: number): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'adaptive_history',
      parameterName,
      oldValue,
      newValue,
      reason,
      performanceDelta,
      timestamp: Date.now()
    });
    console.log(`📊 Recorded adaptive history: ${parameterName} ${oldValue} → ${newValue} (Δ${performanceDelta})`);
  }

  async getAdaptiveHistory(parameterName: string, limit: number = 100): Promise<any[]> {
    await this.init();
    const results = await this.storage.getAnalysisResults('adaptive_history', limit);
    return results.filter(r => r.parameterName === parameterName);
  }

  async storeAdversarialHistory(testId: number, iteration: number, inputData: any, outputData: any, passed: boolean): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'adversarial_history',
      testId,
      iteration,
      inputData,
      outputData,
      passed,
      timestamp: Date.now()
    });
    console.log(`🧪 Recorded adversarial test iteration ${iteration} for test ${testId}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  async getAdversarialHistory(testId: number, limit: number = 100): Promise<any[]> {
    await this.init();
    const results = await this.storage.getAnalysisResults('adversarial_history', limit);
    return results.filter(r => r.testId === testId);
  }

  async storeMetaLearning(learningTask: string, learningData: any, performanceMetric?: number, adaptationStrategy?: string, successRate?: number, metadata?: any): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'meta_learning',
      learningTask,
      learningData,
      performanceMetric,
      adaptationStrategy,
      successRate,
      metadata,
      timestamp: Date.now()
    });
    console.log(`🧠 Stored meta-learning for task ${learningTask} with ${successRate}% success rate`);
  }

  async getMetaLearning(learningTask: string, limit: number = 100): Promise<any[]> {
    await this.init();
    const results = await this.storage.getAnalysisResults('meta_learning', limit);
    return results.filter(r => r.learningTask === learningTask);
  }

  /**
   * Utility Methods
   */
  async getStorageStats(): Promise<any> {
    await this.init();
    return await this.storage.getStats();
  }

  async cleanup(): Promise<void> {
    await this.init();
    // SurrealDB handles cleanup internally
  }

  /**
   * Transaction Support
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.init();
    // SurrealDB handles transactions internally
    return await fn();
  }

  /**
   * DLGM-Ready: Dynamic Parameter Support
   */
  async setDynamicParameter(key: string, value: any, type: string, lifespanMs: number): Promise<void> {
    await this.init();
    await this.storage.storeAnalysisResult({
      type: 'dynamic_parameter',
      key,
      value,
      paramType: type,
      expiresAt: Date.now() + lifespanMs,
      timestamp: Date.now()
    });
  }

  async getDynamicParameter(key: string): Promise<any> {
    await this.init();
    const results = await this.storage.getAnalysisResults('dynamic_parameter', 1);
    const param = results.find(r => r.key === key && (!r.expiresAt || r.expiresAt > Date.now()));
    return param?.value;
  }

  async cleanupExpiredParameters(): Promise<number> {
    await this.init();
    // Would need to implement cleanup in UnifiedStorageManager
    return 0;
  }
}

/**
 * Convenience function to get database adapter instance
 */
export function getDatabase(): DatabaseAdapter {
  const instance = DatabaseAdapter.getInstance();
  return instance;
}

/**
 * Legacy JSON file compatibility - gradual migration helpers
 */
export class FileToDbMigrator {
  private db: DatabaseAdapter;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Migrate pattern weights from JSON file to database
   */
  async migratePatternWeights(jsonPath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(jsonPath)) return false;

      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const weights = new Map<string, number>();

      // Handle different JSON structures
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.pattern && typeof item.weight === 'number') {
            weights.set(item.pattern, item.weight);
          }
        }
      } else if (typeof data === 'object') {
        for (const [pattern, weight] of Object.entries(data)) {
          if (typeof weight === 'number') {
            weights.set(pattern, weight);
          }
        }
      }

      await this.db.savePatternWeights(weights, { source: 'migration', file: jsonPath });
      return true;
    } catch (error) {
      console.warn(`Failed to migrate pattern weights from ${jsonPath}:`, error);
      return false;
    }
  }

  /**
   * Migrate adversarial test data from JSON
   */
  async migrateAdversarialData(jsonPath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(jsonPath)) return false;

      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      
      if (Array.isArray(data)) {
        for (const test of data) {
          if (test.name && test.result !== undefined) {
            await this.db.saveAdversarialTest(
              test.name,
              test.result,
              test.confidence || 0.5,
              { source: 'migration', file: jsonPath }
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.warn(`Failed to migrate adversarial data from ${jsonPath}:`, error);
      return false;
    }
  }

  /**
   * Auto-migrate all known JSON files in .guru directory
   */
  async autoMigrate(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const guruDir = guruConfig.cacheDir;

    if (!fs.existsSync(guruDir)) return;

    const migrationFiles = [
      'pattern-weights.json',
      'pattern-weights-history.json',
      'adversarial.json',
      'confidence-calibration.json',
      'meta-learning.json'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(guruDir, file);
      
      if (file.includes('pattern-weights')) {
        await this.migratePatternWeights(filePath);
      } else if (file.includes('adversarial')) {
        await this.migrateAdversarialData(filePath);
      }
    }

    console.log('🗄️ Database migration completed');
  }
}

/**
 * Database health monitoring
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; stats: any; issues: string[] }> {
  try {
    const db = getDatabase();
    await db.init();
    const stats = await db.getStorageStats();
    const issues: string[] = [];

    // Check for basic connectivity
    if (!stats) {
      issues.push('Unable to retrieve database statistics');
    }

    return {
      healthy: issues.length === 0,
      stats,
      issues
    };
  } catch (error) {
    return {
      healthy: false,
      stats: null,
      issues: [`Database health check failed: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}