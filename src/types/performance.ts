import { SourceLocation } from './index.js';

export interface PerformanceIssue {
  symbolId: string;
  type: string; // e.g., 'quadratic_complexity', 'memory_leak', 'ownership_violation'
  severity: 'info' | 'warning' | 'critical';
  evidence: string[];
  location: SourceLocation;
  meta?: Record<string, any>;
}

export interface PerformanceAnalysisResult {
  issues: PerformanceIssue[];
  metrics: Record<string, any>;
  detectorsRun: string[];
} 