// Simplified analytics store interface - will be implemented with DuckDB later
import { HarmonicPatternMemory, PatternCategory } from '../memory/types.js';

export interface AnalyticsQuery {
  patterns?: {
    category?: PatternCategory;
    minStrength?: number;
    timeRange?: { start: Date; end: Date };
  };
  aggregations?: {
    groupBy?: string[];
    metrics?: string[];
  };
  limit?: number;
}

export interface AnalyticsResult {
  data: any[];
  summary: {
    totalCount: number;
    processingTime: number;
    groupedBy?: string[];
  };
}

export interface PatternTrend {
  category: PatternCategory;
  date: string;
  count: number;
  avgStrength: number;
  complexity: number;
}

export interface FileMetrics {
  file: string;
  patternCount: number;
  symbolCount: number;
  complexityScore: number;
  modularityScore: number;
  lastAnalyzed: Date;
}

export class AnalyticsStore {
  private patterns: Map<string, HarmonicPatternMemory> = new Map();
  private metrics: Map<string, FileMetrics> = new Map();

  constructor() {
    console.log('📊 Analytics store initialized (in-memory mode)');
  }

  async connect(): Promise<void> {
    // Placeholder for DuckDB connection
    console.log('✅ Analytics store connected');
  }

  async disconnect(): Promise<void> {
    // Placeholder for DuckDB disconnection
    console.log('📊 Analytics store disconnected');
  }

  // Pattern analytics
  async storePattern(pattern: HarmonicPatternMemory): Promise<void> {
    this.patterns.set(pattern.id, pattern);
  }

  async storePatterns(patterns: HarmonicPatternMemory[]): Promise<void> {
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
    }
  }

  async queryPatterns(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const start = Date.now();
    let results = Array.from(this.patterns.values());

    // Apply filters
    if (query.patterns?.category) {
      results = results.filter(p => p.harmonicProperties.category === query.patterns!.category);
    }

    if (query.patterns?.minStrength) {
      results = results.filter(p => p.harmonicProperties.strength >= query.patterns!.minStrength!);
    }

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    const processingTime = Date.now() - start;

    return {
      data: results,
      summary: {
        totalCount: results.length,
        processingTime,
        groupedBy: query.aggregations?.groupBy
      }
    };
  }

  async getPatternTrends(days: number = 30): Promise<PatternTrend[]> {
    const trends: Map<string, PatternTrend> = new Map();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const pattern of this.patterns.values()) {
      const dateKey = new Date().toISOString().split('T')[0]; // Today as placeholder
      const trendKey = `${pattern.harmonicProperties.category}-${dateKey}`;
      
      if (!trends.has(trendKey)) {
        trends.set(trendKey, {
          category: pattern.harmonicProperties.category,
          date: dateKey,
          count: 0,
          avgStrength: 0,
          complexity: 0
        });
      }

      const trend = trends.get(trendKey)!;
      trend.count++;
      trend.avgStrength = (trend.avgStrength + pattern.harmonicProperties.strength) / 2;
      trend.complexity = (trend.complexity + pattern.harmonicProperties.complexity) / 2;
    }

    return Array.from(trends.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopPatternsByStrength(limit: number = 10): Promise<HarmonicPatternMemory[]> {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.harmonicProperties.strength - a.harmonicProperties.strength)
      .slice(0, limit);
  }

  async getPatternDistribution(): Promise<Record<PatternCategory, number>> {
    const distribution: Record<string, number> = {};
    
    for (const pattern of this.patterns.values()) {
      const category = pattern.harmonicProperties.category;
      distribution[category] = (distribution[category] || 0) + 1;
    }

    return distribution as Record<PatternCategory, number>;
  }

  // File metrics
  async storeFileMetrics(metrics: FileMetrics): Promise<void> {
    this.metrics.set(metrics.file, metrics);
  }

  async getFileMetrics(file: string): Promise<FileMetrics | null> {
    return this.metrics.get(file) || null;
  }

  async getAllFileMetrics(): Promise<FileMetrics[]> {
    return Array.from(this.metrics.values());
  }

  async getComplexityHotspots(limit: number = 10): Promise<FileMetrics[]> {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.complexityScore - a.complexityScore)
      .slice(0, limit);
  }

  async getModularityScores(): Promise<Array<{ file: string; score: number }>> {
    return Array.from(this.metrics.values())
      .map(m => ({ file: m.file, score: m.modularityScore }))
      .sort((a, b) => b.score - a.score);
  }

  // Aggregation queries
  async getPatternCountByCategory(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    for (const pattern of this.patterns.values()) {
      const category = pattern.harmonicProperties.category;
      counts[category] = (counts[category] || 0) + 1;
    }

    return counts;
  }

  async getAverageStrengthByCategory(): Promise<Record<string, number>> {
    const sums: Record<string, { total: number; count: number }> = {};
    
    for (const pattern of this.patterns.values()) {
      const category = pattern.harmonicProperties.category;
      if (!sums[category]) {
        sums[category] = { total: 0, count: 0 };
      }
      sums[category].total += pattern.harmonicProperties.strength;
      sums[category].count++;
    }

    const averages: Record<string, number> = {};
    for (const [category, data] of Object.entries(sums)) {
      averages[category] = data.total / data.count;
    }

    return averages;
  }

  // Export functions for later DuckDB integration
  async exportToCSV(query: AnalyticsQuery): Promise<string> {
    const result = await this.queryPatterns(query);
    const headers = ['id', 'category', 'strength', 'confidence', 'complexity', 'occurrences'];
    
    let csv = headers.join(',') + '\n';
    
    for (const pattern of result.data) {
      const row = [
        pattern.id,
        pattern.harmonicProperties.category,
        pattern.harmonicProperties.strength,
        pattern.harmonicProperties.confidence,
        pattern.harmonicProperties.complexity,
        pattern.harmonicProperties.occurrences
      ];
      csv += row.join(',') + '\n';
    }

    return csv;
  }

  // Health check and statistics
  async getStats(): Promise<any> {
    const patternCount = this.patterns.size;
    const metricsCount = this.metrics.size;
    
    const categories = new Set<string>();
    let totalStrength = 0;
    let totalComplexity = 0;

    for (const pattern of this.patterns.values()) {
      categories.add(pattern.harmonicProperties.category);
      totalStrength += pattern.harmonicProperties.strength;
      totalComplexity += pattern.harmonicProperties.complexity;
    }

    return {
      patterns: {
        total: patternCount,
        categories: categories.size,
        avgStrength: patternCount > 0 ? totalStrength / patternCount : 0,
        avgComplexity: patternCount > 0 ? totalComplexity / patternCount : 0
      },
      files: {
        total: metricsCount,
        avgComplexity: metricsCount > 0 ? 
          Array.from(this.metrics.values()).reduce((sum, m) => sum + m.complexityScore, 0) / metricsCount : 0
      }
    };
  }

  async healthCheck(): Promise<{ status: string; patternCount: number; fileCount: number }> {
    return {
      status: 'healthy',
      patternCount: this.patterns.size,
      fileCount: this.metrics.size
    };
  }
}