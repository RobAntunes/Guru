/**
 * Simple Harmonic Data Lake (without DuckDB)
 * In-memory implementation for development
 */

import { HarmonicPatternRecord, PatternQuery } from './harmonic-data-lake.js';

export class SimpleHarmonicDataLake {
  private patterns: HarmonicPatternRecord[] = [];
  private snapshots: Map<string, HarmonicPatternRecord[]> = new Map();
  
  async initialize(): Promise<void> {
    console.log('🌊 Simple Harmonic Data Lake initialized (in-memory)');
  }

  async storePatternBatch(patterns: any[], metadata: {
    analysisId: string;
    codebaseHash: string;
    version: string;
  }): Promise<void> {
    const timestamp = new Date();
    
    const records: HarmonicPatternRecord[] = patterns.map(p => ({
      id: `${metadata.analysisId}_${p.symbol}_${p.pattern}`,
      timestamp,
      file_path: p.location.file,
      symbol_id: p.symbol,
      symbol_name: p.symbol.split(':')[1] || p.symbol,
      symbol_type: p.symbol.split(':')[2] || 'unknown',
      line_start: p.location.line,
      line_end: p.location.line,
      pattern_type: p.pattern,
      category: p.category,
      score: p.score,
      confidence: p.confidence,
      evidence: JSON.stringify(p.evidence || {}),
      metrics: JSON.stringify(p.metrics || {}),
      related_patterns: JSON.stringify([]),
      parent_pattern: null,
      analysis_version: metadata.version,
      codebase_hash: metadata.codebaseHash
    }));

    this.patterns.push(...records);
    console.log(`💾 Stored ${records.length} patterns (total: ${this.patterns.length})`);
  }

  async queryPatterns(query: PatternQuery): Promise<HarmonicPatternRecord[]> {
    let results = [...this.patterns];
    
    if (query.categories?.length) {
      results = results.filter(p => query.categories!.includes(p.category));
    }
    
    if (query.patterns?.length) {
      results = results.filter(p => query.patterns!.includes(p.pattern_type));
    }
    
    if (query.minScore !== undefined) {
      results = results.filter(p => p.score >= query.minScore!);
    }
    
    if (query.minConfidence !== undefined) {
      results = results.filter(p => p.confidence >= query.minConfidence!);
    }
    
    if (query.files?.length) {
      results = results.filter(p => query.files!.includes(p.file_path));
    }
    
    if (query.timeRange) {
      results = results.filter(p => 
        p.timestamp >= query.timeRange!.start && 
        p.timestamp <= query.timeRange!.end
      );
    }
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }

  async createSnapshot(name: string, description?: string): Promise<void> {
    this.snapshots.set(name, [...this.patterns]);
    console.log(`📸 Created snapshot: ${name}`);
  }

  async listSnapshots(): Promise<any[]> {
    return Array.from(this.snapshots.keys()).map(name => ({
      name,
      created_at: new Date(),
      comment: `Snapshot ${name}`
    }));
  }

  async analyzePatternEvolution(
    fileOrSymbol: string,
    options?: any
  ): Promise<any[]> {
    const patterns = this.patterns.filter(p => 
      p.file_path === fileOrSymbol || p.symbol_id === fileOrSymbol
    );
    
    // Simple mock evolution data
    return patterns.map(p => ({
      period: p.timestamp,
      pattern_type: p.pattern_type,
      category: p.category,
      avg_score: p.score,
      pattern_count: 1,
      score_change: Math.random() * 0.2 - 0.1
    }));
  }

  async compareSnapshots(
    snapshot1: string,
    snapshot2: string
  ): Promise<any> {
    const snap1 = this.snapshots.get(snapshot1) || [];
    const snap2 = this.snapshots.get(snapshot2) || [];
    
    const ids1 = new Set(snap1.map(p => p.id));
    const ids2 = new Set(snap2.map(p => p.id));
    
    const added = snap2.filter(p => !ids1.has(p.id));
    const removed = snap1.filter(p => !ids2.has(p.id));
    
    const changed: any[] = [];
    for (const p1 of snap1) {
      const p2 = snap2.find(p => p.id === p1.id);
      if (p2 && (p1.score !== p2.score || p1.confidence !== p2.confidence)) {
        changed.push({
          pattern: p2,
          scoreChange: p2.score - p1.score,
          confidenceChange: p2.confidence - p1.confidence
        });
      }
    }
    
    return { added, removed, changed };
  }

  async findHotspots(minPatterns: number = 5): Promise<any[]> {
    const fileStats = new Map<string, any>();
    
    for (const pattern of this.patterns) {
      if (!fileStats.has(pattern.file_path)) {
        fileStats.set(pattern.file_path, {
          file_path: pattern.file_path,
          unique_patterns: new Set(),
          total_patterns: 0,
          total_score: 0,
          categories: new Set()
        });
      }
      
      const stats = fileStats.get(pattern.file_path)!;
      stats.unique_patterns.add(pattern.pattern_type);
      stats.total_patterns++;
      stats.total_score += pattern.score;
      stats.categories.add(pattern.category);
    }
    
    const results = [];
    for (const [file, stats] of fileStats) {
      if (stats.unique_patterns.size >= minPatterns) {
        results.push({
          file_path: file,
          unique_patterns: stats.unique_patterns.size,
          total_patterns: stats.total_patterns,
          avg_score: stats.total_score / stats.total_patterns,
          max_score: Math.max(...this.patterns.filter(p => p.file_path === file).map(p => p.score)),
          categories: Array.from(stats.categories).join(', ')
        });
      }
    }
    
    return results.sort((a, b) => b.avg_score - a.avg_score);
  }

  async getPatternStats(): Promise<any[]> {
    const stats = new Map<string, any>();
    
    for (const pattern of this.patterns) {
      const key = `${pattern.category}/${pattern.pattern_type}`;
      if (!stats.has(key)) {
        stats.set(key, {
          category: pattern.category,
          pattern_type: pattern.pattern_type,
          count: 0,
          scores: []
        });
      }
      
      const stat = stats.get(key)!;
      stat.count++;
      stat.scores.push(pattern.score);
    }
    
    const results = [];
    for (const [key, stat] of stats) {
      const scores = stat.scores.sort((a: number, b: number) => a - b);
      results.push({
        category: stat.category,
        pattern_type: stat.pattern_type,
        count: stat.count,
        avg_score: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
        min_score: Math.min(...scores),
        max_score: Math.max(...scores),
        median: scores[Math.floor(scores.length / 2)]
      });
    }
    
    return results.sort((a, b) => b.count - a.count);
  }
}