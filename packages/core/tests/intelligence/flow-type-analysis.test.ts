/**
 * Tests for Flow Tracking and Type Analysis
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GuruEnhanced } from '../../src/core/guru-enhanced.js';
import { IntegratedFlowTypeAnalyzer } from '../../src/intelligence/integrated-flow-type-analyzer.js';
import { FlowTracker } from '../../src/intelligence/flow-tracker.js';
import { TypeAnalyzer } from '../../src/intelligence/type-analyzer.js';
import path from 'path';
import fs from 'fs/promises';
import ts from 'typescript';

describe('Flow and Type Analysis', () => {
  let guru: GuruEnhanced;
  const testDir = path.join(process.cwd(), 'test-flow-type');
  
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Create test files with various flow and type patterns
    await fs.writeFile(path.join(testDir, 'flow-test.ts'), `
// Test file for flow analysis
export function complexFlow(x: number): string | number {
  if (x > 10) {
    if (x > 20) {
      return "very large";
    }
    return x * 2;
  } else if (x < 0) {
    throw new Error("Negative not allowed");
  }
  
  for (let i = 0; i < x; i++) {
    console.log(i);
  }
  
  return x.toString();
}

export async function asyncFlow(data: any): Promise<void> {
  try {
    const result = await fetch(data.url);
    const json = await result.json();
    
    if (json.error) {
      throw new Error(json.error);
    }
    
    console.log(json);
  } catch (error) {
    console.error("Failed:", error);
  }
}

// Variable with changing types
export function variableTypeFlow() {
  let value: string | number = "hello";
  
  if (Math.random() > 0.5) {
    value = 42;
  }
  
  // Type narrowing
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  } else {
    console.log(value.toFixed(2));
  }
  
  return value;
}
`);

    await fs.writeFile(path.join(testDir, 'type-test.ts'), `
// Test file for type analysis
interface User {
  id: number;
  name: string;
  email?: string;
}

type Status = 'active' | 'inactive' | 'pending';

class UserManager {
  private users: Map<number, User> = new Map();
  
  addUser(user: User): void {
    this.users.set(user.id, user);
  }
  
  getUser(id: number): User | undefined {
    return this.users.get(id);
  }
  
  updateStatus<T extends User>(user: T, status: Status): T & { status: Status } {
    return { ...user, status };
  }
}

// Function with complex signature
export function processData<T>(
  data: T[],
  transform: (item: T) => T,
  filter?: (item: T) => boolean
): T[] {
  let result = data.map(transform);
  
  if (filter) {
    result = result.filter(filter);
  }
  
  return result;
}

// Implicit any issues
export function problematicFunction(data) {
  return data.value; // implicit any
}
`);
    
    // Initialize GuruEnhanced
    guru = new GuruEnhanced(true);
  });
  
  afterAll(async () => {
    // Cleanup
    await guru.cleanup();
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  describe('Enhanced Guru Analysis', () => {
    it('should analyze codebase with flow and type analysis', async () => {
      const result = await guru.analyzeCodebaseEnhanced(testDir, {
        enableFlowAnalysis: true,
        enableTypeAnalysis: true
      });
      
      expect(result).toBeDefined();
      expect(result.symbolGraph).toBeDefined();
      expect(result.flowTypeAnalysis).toBeDefined();
      expect(result.metadata.capabilities).toContain('flow-analysis');
      expect(result.metadata.capabilities).toContain('type-analysis');
    });
    
    it('should generate insights from flow analysis', async () => {
      const insights = await guru.getTaskDiscoveryInsights(testDir);
      
      expect(insights).toBeDefined();
      expect(insights.flowIssues).toBeDefined();
      expect(insights.typeIssues).toBeDefined();
      expect(insights.optimizationOpportunities).toBeDefined();
      expect(insights.refactoringCandidates).toBeDefined();
      
      // Should detect complexity in complexFlow function
      const complexityIssues = insights.refactoringCandidates.filter(
        i => i.title.includes('complexity') || i.title.includes('Complex')
      );
      expect(complexityIssues.length).toBeGreaterThan(0);
    });
    
    it('should track variable flow with type evolution', async () => {
      const tracking = await guru.trackVariableFlow(
        'value',
        path.join(testDir, 'flow-test.ts'),
        testDir
      );
      
      expect(tracking).toBeDefined();
      expect(tracking.flowPath).toBeDefined();
      expect(tracking.typeEvolution).toBeDefined();
      expect(tracking.insights).toBeDefined();
      
      // Should detect type mutations
      const typeMutations = tracking.insights.filter(i => i.type === 'type_mutation');
      expect(typeMutations.length).toBeGreaterThan(0);
    });
    
    it('should analyze function with full context', async () => {
      const analysis = await guru.analyzeFunctionWithContext('complexFlow', testDir);
      
      expect(analysis).toBeDefined();
      expect(analysis.flowPaths).toBeDefined();
      expect(analysis.typeSignature).toBeDefined();
      expect(analysis.insights).toBeDefined();
      
      // Should have multiple flow paths due to branches
      expect(analysis.flowPaths.length).toBeGreaterThan(1);
    });
    
    it('should calculate comprehensive metrics', async () => {
      const metrics = await guru.getEnhancedMetrics(testDir);
      
      expect(metrics).toBeDefined();
      expect(metrics.symbolMetrics).toBeDefined();
      expect(metrics.flowMetrics).toBeDefined();
      expect(metrics.typeMetrics).toBeDefined();
      expect(metrics.overallHealth).toBeGreaterThanOrEqual(0);
      expect(metrics.overallHealth).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Flow Tracker', () => {
    it('should analyze control flow patterns', async () => {
      const analysis = await guru.analyzeCodebaseEnhanced(testDir, {
        enableFlowAnalysis: true
      });
      
      if (analysis.flowTypeAnalysis) {
        const flow = analysis.flowTypeAnalysis.flow;
        
        // Should detect branches, loops, and exception handling
        expect(flow.nodes.size).toBeGreaterThan(0);
        expect(flow.edges.length).toBeGreaterThan(0);
        
        // Check for different node types
        const nodeTypes = new Set(
          Array.from(flow.nodes.values()).map(n => n.nodeKind)
        );
        expect(nodeTypes).toContain('branch');
        expect(nodeTypes).toContain('source');
        expect(nodeTypes).toContain('sink');
      }
    });
    
    it('should detect flow issues', async () => {
      const analysis = await guru.analyzeCodebaseEnhanced(testDir, {
        enableFlowAnalysis: true
      });
      
      if (analysis.flowTypeAnalysis) {
        const issues = analysis.flowTypeAnalysis.flow.issues;
        
        // May detect unreachable code or other issues
        expect(issues).toBeDefined();
        expect(Array.isArray(issues)).toBe(true);
      }
    });
  });
  
  describe('Type Analyzer', () => {
    it('should analyze TypeScript types', async () => {
      const analysis = await guru.analyzeCodebaseEnhanced(testDir, {
        enableTypeAnalysis: true
      });
      
      if (analysis.flowTypeAnalysis) {
        const types = analysis.flowTypeAnalysis.types;
        
        // Should identify various types
        expect(types.types.size).toBeGreaterThan(0);
        
        // Should track type flows
        expect(types.flows.length).toBeGreaterThan(0);
        
        // Should calculate type metrics
        expect(types.metrics.totalTypes).toBeGreaterThan(0);
        expect(types.metrics.explicitTypes).toBeGreaterThan(0);
      }
    });
    
    it('should detect type issues', async () => {
      const analysis = await guru.analyzeCodebaseEnhanced(testDir, {
        enableTypeAnalysis: true
      });
      
      if (analysis.flowTypeAnalysis) {
        const issues = analysis.flowTypeAnalysis.types.issues;
        
        // Should detect implicit any in problematicFunction
        const implicitAnyIssues = issues.filter(i => i.type === 'implicit_any');
        expect(implicitAnyIssues.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Integration with Living Task Forest', () => {
    it('should generate task-relevant insights', async () => {
      const insights = await guru.getTaskDiscoveryInsights(testDir);
      
      // All insights should be actionable
      const allInsights = [
        ...insights.flowIssues,
        ...insights.typeIssues,
        ...insights.optimizationOpportunities,
        ...insights.refactoringCandidates
      ];
      
      expect(allInsights.length).toBeGreaterThan(0);
      
      // Each insight should have necessary properties for task creation
      for (const insight of allInsights) {
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
      }
    });
  });
});