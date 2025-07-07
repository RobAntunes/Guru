/**
 * Living Task Forest Integration Tests
 * Tests the complete LTF system with Guru integration, persistence, and MCP tools
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import {
  TaskForest,
  TaskTree,
  TaskLifecycle,
  ProjectInsight,
  ConfidenceStream,
  ParallelWorkflowOrchestrator,
  TaskPurpose,
  TaskStrategy
} from '../../src/living-task-forest/index.js';
import { GuruDiscoveryEngine, TaskRelevanceAnalyzer } from '../../src/living-task-forest/integration/guru-integration.js';
import { ForestPersistence } from '../../src/living-task-forest/storage/forest-persistence.js';
import { LTFMcpTools } from '../../src/mcp/ltf-mcp-tools.js';
import { GuruEnhanced } from '../../src/core/guru-enhanced.js';

describe('Living Task Forest Integration', () => {
  let guru: GuruEnhanced;
  let forest: TaskForest;
  let discoveryEngine: GuruDiscoveryEngine;
  let persistence: ForestPersistence;
  let orchestrator: ParallelWorkflowOrchestrator;
  let ltfTools: LTFMcpTools;
  
  const testProjectPath = path.join(process.cwd(), 'test-samples');
  const testStoragePath = path.join(process.cwd(), 'test-data', 'ltf-test');
  
  beforeAll(async () => {
    // Initialize Enhanced Guru
    guru = new GuruEnhanced(true); // quiet mode for tests
    
    // Initialize discovery engine
    discoveryEngine = new GuruDiscoveryEngine(guru);
    
    // Initialize persistence
    persistence = new ForestPersistence(testStoragePath);
    await persistence.initialize();
    
    // Initialize MCP tools
    ltfTools = new LTFMcpTools();
    ltfTools.initialize(guru, testStoragePath);
  });
  
  afterAll(async () => {
    // Clean up
    if (persistence) {
      await persistence.close();
    }
    await fs.rm(testStoragePath, { recursive: true, force: true });
  });
  
  beforeEach(() => {
    forest = new TaskForest();
    orchestrator = new ParallelWorkflowOrchestrator();
  });
  
  afterEach(() => {
    forest.stop();
    orchestrator.stop();
  });
  
  describe('Task Emergence from Code Analysis', () => {
    it('should create tasks from Guru code analysis', async () => {
      const goals = [
        {
          id: 'goal_quality',
          type: 'quality' as const,
          description: 'Improve code quality',
          priority: 0.8
        }
      ];
      
      // Analyze project and create forest
      const forest = await discoveryEngine.createForestFromAnalysis(
        testProjectPath,
        goals
      );
      
      expect(forest).toBeDefined();
      expect(forest.trees.size).toBeGreaterThan(0);
      
      // Check that tasks were created from real insights
      const trees = Array.from(forest.trees.values());
      expect(trees.length).toBeGreaterThan(0);
      
      const firstTree = trees[0];
      expect(firstTree.root.source).toBeDefined();
      expect(firstTree.dna.purpose.type).toBeDefined();
      
      forest.stop();
    });
    
    it('should detect code patterns and create appropriate tasks', async () => {
      const { analysis, insights } = await discoveryEngine.analyzeProject(testProjectPath);
      
      expect(analysis).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      
      // Check for various insight types
      const insightTypes = new Set(insights.map(i => i.type));
      expect(insightTypes.size).toBeGreaterThan(0);
      
      // Plant insights as tasks
      for (const insight of insights.slice(0, 3)) {
        const tree = await forest.plantSeed(insight);
        expect(tree).toBeDefined();
        
        if (tree) {
          expect(tree.species).toBeDefined();
          expect(tree.dna.purpose.type).toBeDefined();
        }
      }
    });
  });
  
  describe('Task Evolution and Adaptation', () => {
    it('should evolve tasks under environmental pressure', async () => {
      // Create a test task
      const insight: ProjectInsight = {
        id: 'test_insight_1',
        type: 'refactor',
        discovery: 'Complex function needs refactoring',
        evidence: [{
          type: 'metric',
          description: 'Cyclomatic complexity: 15',
          strength: 0.8
        }],
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'test'
      };
      
      const tree = await forest.plantSeed(insight);
      expect(tree).toBeDefined();
      
      if (tree) {
        const originalStrategy = tree.dna.approach.strategy;
        const originalRiskTolerance = tree.dna.approach.riskTolerance;
        
        // Apply time pressure
        await forest.evolveForest({
          type: 'time_pressure',
          intensity: 0.8,
          duration: 3600000
        });
        
        // Check that task evolved
        expect(tree.dna.approach.riskTolerance).toBeGreaterThan(originalRiskTolerance);
        expect(tree.evolution.length).toBeGreaterThan(0);
      }
    });
    
    it('should handle task reproduction', async () => {
      const parentInsight: ProjectInsight = {
        id: 'parent_insight',
        type: 'feature',
        discovery: 'Complex feature needs implementation',
        evidence: [],
        confidence: 0.9,
        timestamp: Date.now(),
        source: 'test'
      };
      
      const parent = await forest.plantSeed(parentInsight);
      expect(parent).toBeDefined();
      
      if (parent) {
        // Force task to mature state
        parent.lifecycle = TaskLifecycle.FLOWERING;
        parent.energy = 0.9;
        parent.health = 0.9;
        
        const offspring = await parent.reproduce({
          type: 'opportunity',
          discovery: 'Feature has 3 sub-components',
          confidence: 0.8
        });
        
        expect(offspring.length).toBeGreaterThan(0);
        
        // Check offspring properties
        for (const child of offspring) {
          expect(child.generation).toBe(parent.generation + 1);
          expect(child.dna.lineage).toContain(parent.dna.id);
        }
      }
    });
  });
  
  describe('Confidence Streams', () => {
    it('should build confidence through evidence', async () => {
      const stream = new ConfidenceStream(
        'Test refactoring safety',
        'refactoring',
        0.8
      );
      
      expect(stream.currentConfidence).toBe(0);
      
      // Add evidence
      const update1 = stream.addEvidence({
        id: 'ev1',
        type: 'test',
        description: 'All tests pass after refactoring',
        source: 'test_suite',
        strength: 0.7,
        reliability: 0.9,
        timestamp: Date.now()
      });
      
      expect(update1.newConfidence).toBeGreaterThan(0);
      
      // Add more evidence
      const update2 = stream.addEvidence({
        id: 'ev2',
        type: 'analysis',
        description: 'Static analysis shows no issues',
        source: 'analyzer',
        strength: 0.8,
        reliability: 0.95,
        timestamp: Date.now()
      });
      
      expect(update2.newConfidence).toBeGreaterThan(update1.newConfidence);
    });
    
    it('should trigger actions at confidence threshold', async () => {
      const stream = orchestrator.launchStream(
        'Deploy feature',
        'deployment',
        0.7
      );
      
      let actionExecuted = false;
      
      stream.registerAction({
        id: 'deploy',
        description: 'Deploy to staging',
        requiredConfidence: 0.7,
        currentConfidence: 0,
        risks: [],
        execute: async () => {
          actionExecuted = true;
          return { deployed: true };
        }
      });
      
      // Build confidence
      stream.addEvidence({
        id: 'ev1',
        type: 'test',
        description: 'Integration tests pass',
        source: 'ci',
        strength: 0.9,
        reliability: 1.0,
        timestamp: Date.now()
      });
      
      // Trigger actions if threshold met
      if (stream.currentConfidence >= 0.7) {
        await stream.triggerActions();
        expect(actionExecuted).toBe(true);
      }
    });
  });
  
  describe('Forest Persistence', () => {
    it('should save and restore forest state', async () => {
      // Create forest with tasks
      const insights: ProjectInsight[] = [
        {
          id: 'save_test_1',
          type: 'bug',
          discovery: 'Memory leak detected',
          evidence: [],
          confidence: 0.9,
          timestamp: Date.now(),
          source: 'test'
        },
        {
          id: 'save_test_2',
          type: 'performance',
          discovery: 'Slow database queries',
          evidence: [],
          confidence: 0.8,
          timestamp: Date.now(),
          source: 'test'
        }
      ];
      
      for (const insight of insights) {
        await forest.plantSeed(insight);
      }
      
      const originalTreeCount = forest.trees.size;
      const originalHealth = forest.assessForestHealth();
      
      // Save forest
      const snapshotId = await persistence.saveForest(forest);
      expect(snapshotId).toBeDefined();
      
      // Create new forest and load state
      const newForest = new TaskForest();
      const { forest: loadedForest } = await persistence.loadForest(snapshotId);
      
      expect(loadedForest.trees.size).toBe(originalTreeCount);
      
      // Compare health metrics
      const loadedHealth = loadedForest.assessForestHealth();
      expect(loadedHealth.biodiversity).toBeCloseTo(originalHealth.biodiversity, 2);
      
      loadedForest.stop();
    });
    
    it('should list and prune snapshots', async () => {
      // Get initial snapshot count
      const initialSnapshots = await persistence.listSnapshots();
      const initialCount = initialSnapshots.length;
      
      // Create multiple snapshots
      for (let i = 0; i < 3; i++) {
        await forest.plantSeed({
          id: `prune_test_${i}`,
          type: 'test',
          discovery: `Test ${i}`,
          evidence: [],
          confidence: 0.5,
          timestamp: Date.now(),
          source: 'test'
        });
        
        await persistence.saveForest(forest);
      }
      
      // List snapshots
      const snapshots = await persistence.listSnapshots();
      expect(snapshots.length).toBe(initialCount + 3);
      
      // Prune old snapshots, keeping only 1
      const deleted = await persistence.pruneSnapshots(1);
      expect(deleted).toBeGreaterThan(0);
      
      // Check remaining
      const remaining = await persistence.listSnapshots();
      expect(remaining.length).toBe(1);
    });
  });
  
  describe('MCP Tools Integration', () => {
    it('should create forest through MCP tool', async () => {
      const result = await ltfTools.getTools()
        .find(t => t.name === 'ltf_create_forest')
        ?.handler({
          projectPath: testProjectPath,
          goals: [
            {
              type: 'performance',
              description: 'Optimize performance',
              priority: 0.7
            }
          ]
        });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.treesCreated).toBeGreaterThan(0);
    });
    
    it('should get forest status through MCP', async () => {
      // Plant some tasks first
      await forest.plantSeed({
        id: 'mcp_test_1',
        type: 'feature',
        discovery: 'New feature needed',
        evidence: [],
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'test'
      });
      
      const statusTool = ltfTools.getTools()
        .find(t => t.name === 'ltf_forest_status');
      
      const result = await statusTool?.handler({});
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.forest).toBeDefined();
      expect(result.health).toBeDefined();
    });
  });
  
  describe('Task Relevance Analysis', () => {
    it('should analyze task relevance to code sections', async () => {
      const analyzer = new TaskRelevanceAnalyzer(guru);
      
      // Create a task related to specific code
      const task = await forest.plantSeed({
        id: 'relevance_test',
        type: 'refactor',
        discovery: 'Refactor authentication module',
        evidence: [],
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'test'
      });
      
      if (task) {
        const relevance = analyzer.analyzeTaskRelevance(task, {
          file: 'test-samples/simple.ts',
          startLine: 1,
          endLine: 50
        });
        
        expect(relevance).toBeGreaterThanOrEqual(0);
        expect(relevance).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('Forest Health and Metrics', () => {
    it('should track forest health metrics', async () => {
      // Create diverse task ecosystem
      const taskTypes = ['bug', 'feature', 'refactor', 'optimize', 'test'];
      
      for (let i = 0; i < 10; i++) {
        await forest.plantSeed({
          id: `health_test_${i}`,
          type: taskTypes[i % taskTypes.length],
          discovery: `Task ${i}`,
          evidence: [],
          confidence: 0.5 + Math.random() * 0.5,
          timestamp: Date.now(),
          source: 'test'
        });
      }
      
      const health = forest.assessForestHealth();
      
      expect(health.biodiversity).toBeGreaterThan(0);
      expect(health.stability).toBeGreaterThan(0);
      expect(health.productivity).toBeGreaterThanOrEqual(0);
      expect(health.sustainability).toBeGreaterThan(0);
      expect(health.overallHealth).toBeGreaterThan(0);
      
      // Check species distribution
      const stats = forest.getStatistics();
      expect(Object.keys(stats.species).length).toBeGreaterThan(1);
    });
  });
  
  describe('Performance and Scalability', () => {
    it('should handle large numbers of tasks efficiently', async () => {
      const startTime = Date.now();
      const taskCount = 100;
      
      // Create many tasks
      const promises = [];
      for (let i = 0; i < taskCount; i++) {
        promises.push(forest.plantSeed({
          id: `perf_test_${i}`,
          type: 'test',
          discovery: `Performance test ${i}`,
          evidence: [],
          confidence: Math.random(),
          timestamp: Date.now(),
          source: 'test'
        }));
      }
      
      await Promise.all(promises);
      
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should create 100 tasks in < 5s
      
      // Test forest operations at scale
      const evolveStart = Date.now();
      await forest.evolveForest({
        type: 'resource',
        intensity: 0.5,
        duration: 1000
      });
      const evolveTime = Date.now() - evolveStart;
      
      expect(evolveTime).toBeLessThan(1000); // Evolution should be < 1s
      
      // Test querying
      const queryStart = Date.now();
      const matureTasks = forest.findTrees({ lifecycle: TaskLifecycle.MATURE });
      const queryTime = Date.now() - queryStart;
      
      expect(queryTime).toBeLessThan(100); // Queries should be < 100ms
    });
  });
});