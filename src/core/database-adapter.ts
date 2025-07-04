/**
 * Database Adapter - Integration layer between Guru and database storage
 * Provides unified interface for data persistence with DLGM evolution support
 */

import { GuruDatabase, DatabaseConfig } from './database.js';
import { guruConfig } from './config.js';
import path from 'path';

// Singleton database instance
let dbInstance: GuruDatabase | null = null;

/**
 * Database connection manager that provides unified access to storage
 */
export class DatabaseAdapter {
  private static instance: DatabaseAdapter | null = null;
  private db: GuruDatabase;
  private isConnected: boolean = false;

  private constructor() {
    // Initialize database with Guru config
    const dbConfig: DatabaseConfig = {
      path: path.join(guruConfig.cacheDir, 'guru.db'),
      enableWAL: true,
      memoryOptimized: true,
      pragmas: {
        cache_size: 64000,
        temp_store: 'memory',
        mmap_size: 268435456,
        synchronous: 'NORMAL',
        journal_size_limit: 67108864,
        auto_vacuum: 'INCREMENTAL'
      }
    };

    this.db = new GuruDatabase(dbConfig);
    this.isConnected = true;
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  /**
   * Get the underlying database instance
   */
  getDatabase(): GuruDatabase {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  /**
   * Pattern Learning Persistence
   */
  async savePatternWeights(weights: Map<string, number>, metadata?: any): Promise<void> {
    for (const [pattern, weight] of weights.entries()) {
      await this.db.upsertPatternWeight(pattern, weight, metadata);
    }
  }

  async loadPatternWeights(): Promise<Map<string, number>> {
    const weights = await this.db.getAllPatternWeights();
    const map = new Map<string, number>();
    
    for (const weight of weights) {
      map.set(weight.pattern, weight.weight);
    }
    
    return map;
  }

  async getPatternHistory(pattern: string, limit: number = 100): Promise<any[]> {
    return await this.db.getPatternHistory(pattern, limit);
  }

  /**
   * File Analysis Cache Persistence
   */
  async saveFileAnalysis(filePath: string, hash: string, symbols: any[], dependencies: string[], version: string): Promise<void> {
    await this.db.upsertFileAnalysis({
      file_path: filePath,
      hash,
      last_modified: Date.now(),
      symbols: JSON.stringify(symbols),
      dependencies: JSON.stringify(dependencies),
      version
    });
  }

  async invalidateFileAnalysis(filePath: string): Promise<void> {
    await this.db.deleteFileAnalysis(filePath);
  }

  async loadFileAnalysis(filePath: string): Promise<{ hash: string; symbols: any[]; dependencies: string[]; version: string } | null> {
    const result = await this.db.getFileAnalysis(filePath);
    if (!result) return null;

    return {
      hash: result.hash,
      symbols: JSON.parse(result.symbols),
      dependencies: JSON.parse(result.dependencies),
      version: result.version
    };
  }

  /**
   * Get all file paths that have been analyzed
   */
  async getAllAnalyzedFiles(): Promise<string[]> {
    return await this.db.getAllAnalyzedFiles();
  }

  /**
   * Symbol Storage
   */
  async saveSymbol(symbol: any): Promise<void> {
    await this.db.storeSymbol(symbol);
  }

  async loadSymbol(id: string): Promise<any | null> {
    return await this.db.getSymbol(id);
  }

  async saveSymbolEdge(edge: any): Promise<void> {
    await this.db.storeSymbolEdge(edge);
  }

  /**
   * Self-Reflection Data
   */
  async saveAdversarialTest(testName: string, result: any, confidence: number, metadata?: any): Promise<void> {
    await this.db.storeAdversarialTest({
      test_name: testName,
      result: JSON.stringify(result),
      confidence,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });
  }

  async saveConfidenceCalibration(prediction: number, actual: number, context: string, score: number): Promise<void> {
    await this.db.storeConfidenceCalibration({
      prediction,
      actual,
      context,
      calibration_score: score
    });
  }

  /**
   * Analysis Session Management
   */
  async saveAnalysisSession(sessionId: string, targetPath: string, scanMode: string, stats: any): Promise<void> {
    await this.db.storeAnalysisSession({
      id: sessionId,
      target_path: targetPath,
      scan_mode: scanMode,
      files_analyzed: stats.filesAnalyzed || 0,
      total_files: stats.totalFiles || 0,
      metadata: JSON.stringify(stats)
    });
  }

  async getAnalysisSessions(sessionId: string, limit: number = 10): Promise<any[]> {
    const sessions = await this.db.getAnalysisSessions(sessionId, limit);
    return sessions.map((session: any) => ({
      ...session,
      session_data: session.metadata ? JSON.parse(session.metadata) : {}
    }));
  }

  // Extended Self-Reflection Components
  async storePeerReview(reviewerId: string, targetAnalysis: string, reviewData: any, confidenceScore?: number, metadata?: any): Promise<void> {
    await this.db.storePeerReview({
      reviewer_id: reviewerId,
      target_analysis: targetAnalysis,
      review_data: JSON.stringify(reviewData),
      confidence_score: confidenceScore,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });
    console.log(`💾 Stored peer review from ${reviewerId} for analysis ${targetAnalysis}`);
  }

  async getPeerReviews(limit: number = 100): Promise<any[]> {
    const reviews = await this.db.getPeerReviews(limit);
    return reviews.map(review => ({
      ...review,
      review_data: JSON.parse(review.review_data),
      metadata: review.metadata ? JSON.parse(review.metadata) : undefined
    }));
  }

  async storeConsensusResult(analysisId: string, consensusData: any, confidenceLevel?: number, participantCount?: number, metadata?: any): Promise<void> {
    await this.db.storeConsensusResult({
      analysis_id: analysisId,
      consensus_data: JSON.stringify(consensusData),
      confidence_level: confidenceLevel,
      participant_count: participantCount,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });
    console.log(`💾 Stored consensus result for analysis ${analysisId} with ${participantCount} participants`);
  }

  async getConsensusResult(analysisId: string): Promise<any | null> {
    const result = await this.db.getConsensusResult(analysisId);
    if (!result) return null;
    
    return {
      ...result,
      consensus_data: JSON.parse(result.consensus_data),
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }

  async storeAdaptiveTuning(parameterName: string, parameterValue: number, context?: string, performanceMetric?: number, metadata?: any): Promise<void> {
    await this.db.storeAdaptiveTuning({
      parameter_name: parameterName,
      parameter_value: parameterValue,
      context,
      performance_metric: performanceMetric,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });
    console.log(`🎛️ Stored adaptive tuning: ${parameterName} = ${parameterValue}`);
  }

  async getAdaptiveTuning(parameterName: string, limit: number = 100): Promise<any[]> {
    const tunings = await this.db.getAdaptiveTuning(parameterName, limit);
    return tunings.map(tuning => ({
      ...tuning,
      metadata: tuning.metadata ? JSON.parse(tuning.metadata) : undefined
    }));
  }

  async storeAdaptiveHistory(parameterName: string, oldValue?: number, newValue?: number, reason?: string, performanceDelta?: number): Promise<void> {
    await this.db.storeAdaptiveHistory({
      parameter_name: parameterName,
      old_value: oldValue,
      new_value: newValue,
      reason,
      performance_delta: performanceDelta
    });
    console.log(`📊 Recorded adaptive history: ${parameterName} ${oldValue} → ${newValue} (Δ${performanceDelta})`);
  }

  async getAdaptiveHistory(parameterName: string, limit: number = 100): Promise<any[]> {
    return await this.db.getAdaptiveHistory(parameterName, limit);
  }

  async storeAdversarialHistory(testId: number, iteration: number, inputData: any, outputData: any, passed: boolean): Promise<void> {
    await this.db.storeAdversarialHistory({
      test_id: testId,
      iteration,
      input_data: JSON.stringify(inputData),
      output_data: JSON.stringify(outputData),
      passed
    });
    console.log(`🧪 Recorded adversarial test iteration ${iteration} for test ${testId}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  async getAdversarialHistory(testId: number, limit: number = 100): Promise<any[]> {
    const history = await this.db.getAdversarialHistory(testId, limit);
    return history.map(item => ({
      ...item,
      input_data: JSON.parse(item.input_data),
      output_data: JSON.parse(item.output_data)
    }));
  }

  async storeMetaLearning(learningTask: string, learningData: any, performanceMetric?: number, adaptationStrategy?: string, successRate?: number, metadata?: any): Promise<void> {
    await this.db.storeMetaLearning({
      learning_task: learningTask,
      learning_data: JSON.stringify(learningData),
      performance_metric: performanceMetric,
      adaptation_strategy: adaptationStrategy,
      success_rate: successRate,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });
    console.log(`🧠 Stored meta-learning for task ${learningTask} with ${successRate}% success rate`);
  }

  async getMetaLearning(learningTask: string, limit: number = 100): Promise<any[]> {
    const learning = await this.db.getMetaLearning(learningTask, limit);
    return learning.map(item => ({
      ...item,
      learning_data: JSON.parse(item.learning_data),
      metadata: item.metadata ? JSON.parse(item.metadata) : undefined
    }));
  }

  /**
   * Utility Methods
   */
  async getStorageStats(): Promise<any> {
    return await this.db.getStats();
  }

  async cleanup(): Promise<void> {
    await this.db.vacuum();
  }

  /**
   * Transaction Support
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(() => {
      // For now, just execute the function
      // In a real implementation, we'd handle proper async transactions
      return fn();
    });
  }

  /**
   * DLGM-Ready: Dynamic Parameter Support (Future)
   */
  async setDynamicParameter(key: string, value: any, type: string, lifespanMs: number): Promise<void> {
    await this.db.setDynamicParameter(key, value, type, lifespanMs);
  }

  async getDynamicParameter(key: string): Promise<any> {
    return await this.db.getDynamicParameter(key);
  }

  async cleanupExpiredParameters(): Promise<number> {
    return await this.db.cleanupExpiredParameters();
  }

  /**
   * Graceful shutdown
   */
  close(): void {
    if (this.isConnected && this.db) {
      this.db.close();
      this.isConnected = false;
    }
    DatabaseAdapter.instance = null;
  }
}

/**
 * Convenience function to get database adapter instance
 */
export function getDatabase(): DatabaseAdapter {
  return DatabaseAdapter.getInstance();
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
      // Add more migration handlers as needed
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
    const stats = await db.getStorageStats();
    const issues: string[] = [];

    // Check for basic connectivity
    if (!stats) {
      issues.push('Unable to retrieve database statistics');
    }

    // Check for reasonable data sizes (empty database is fine for new installations)
    const totalRecords = Object.values(stats).reduce((sum: number, count: any) => sum + (count || 0), 0);
    // Don't treat empty database as unhealthy - it's normal for new installations

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