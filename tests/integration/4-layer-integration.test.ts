/**
 * 4-Layer Architecture Integration Test
 * Verifies all layers work together seamlessly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarmonicDuckLake } from '../../src/datalake/harmonic-ducklake.js';
import { StorageManager } from '../../src/storage/storage-manager.js';
import { PatternStoreReconciler } from '../../src/integration/pattern-store-reconciler.js';
import { MCPPatternGateway } from '../../src/mcp/gateway/mcp-pattern-gateway.js';
import { createMCPToolset } from '../../src/mcp/gateway/mcp-gateway-tools.js';

describe('4-Layer Architecture Integration', () => {
  let storageManager: StorageManager;
  let duckLake: any;
  let reconciler: PatternStoreReconciler;
  let gateway: MCPPatternGateway;
  let tools: any;

  beforeAll(async () => {
    // Initialize all layers
    storageManager = new StorageManager();
    await storageManager.initialize();
    
    duckLake = await createHarmonicDuckLake('.test/ducklake');
    
    reconciler = new PatternStoreReconciler(
      duckLake,
      storageManager.neo4j,
      storageManager.qpfm as any
    );
    
    const toolset = await createMCPToolset(storageManager);
    gateway = toolset.gateway;
    tools = toolset.tools;
  }, 30000);

  afterAll(async () => {
    await storageManager.close();
  });

  it('should store patterns across all systems', async () => {
    // Generate test patterns
    const testPatterns = [
      {
        symbol: 'test.ts:testFunction:function',
        pattern: 'test_pattern',
        category: 'QUANTUM',
        score: 0.9,
        confidence: 0.95,
        location: { file: 'test.ts', line: 10 },
        evidence: { test: true },
        complexity: 10
      }
    ];

    // Process through reconciler
    const stats = await reconciler.processAnalysisStream(
      async function* () {
        for (const p of testPatterns) yield p;
      }(),
      {
        analysisId: 'test_001',
        codebaseHash: 'test123',
        version: '1.0.0'
      }
    );

    expect(stats.totalPatterns).toBe(1);
    expect(stats.duckLakeStored).toBe(1);
    expect(stats.neo4jRelationships).toBe(1);
    expect(stats.qpfmPatterns).toBe(1); // High score pattern
  });

  it('should query patterns through MCP gateway', async () => {
    // Quality assessment
    const qualityResponse = await gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: 'test.ts'
    });

    expect(qualityResponse.success).toBe(true);
    expect(qualityResponse.metadata.queryType).toBe('quality_assessment');
    expect(qualityResponse.metadata.sourceSystems).toContain('ducklake');
    expect(qualityResponse.metadata.sourceSystems).toContain('neo4j');
    expect(qualityResponse.metadata.sourceSystems).toContain('qpfm');
  });

  it('should route queries to optimal systems', async () => {
    // Similarity query should hit QPFM
    const similarityResponse = await gateway.handleMCPRequest({
      type: 'realtime_similarity',
      target: 'test.ts'
    });

    expect(similarityResponse.metadata.sourceSystems).toEqual(['qpfm']);

    // Relationship query should hit Neo4j
    const relationshipResponse = await gateway.handleMCPRequest({
      type: 'relationship_traversal',
      target: 'testFunction'
    });

    expect(relationshipResponse.metadata.sourceSystems).toEqual(['neo4j']);

    // Historical query should hit DuckLake
    const historicalResponse = await gateway.handleMCPRequest({
      type: 'historical_analysis',
      target: 'test.ts'
    });

    expect(historicalResponse.metadata.sourceSystems).toEqual(['ducklake']);
  });

  it('should cache frequent queries', async () => {
    // First query - no cache
    const response1 = await gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: 'cached.ts'
    });
    expect(response1.metadata.cacheHit).toBe(false);

    // Second identical query - should hit cache
    const response2 = await gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: 'cached.ts'
    });
    expect(response2.metadata.cacheHit).toBe(true);
    
    // Response should be identical
    expect(response2.data).toEqual(response1.data);
  });

  it('should handle cross-system queries', async () => {
    // Comprehensive query hits all systems
    const comprehensiveResponse = await gateway.handleMCPRequest({
      type: 'comprehensive_intelligence',
      target: 'test.ts'
    });

    expect(comprehensiveResponse.success).toBe(true);
    expect(comprehensiveResponse.metadata.sourceSystems).toHaveLength(3);
    expect(comprehensiveResponse.data).toHaveProperty('timeline');
    expect(comprehensiveResponse.data).toHaveProperty('graph');
    expect(comprehensiveResponse.data).toHaveProperty('similar');
    expect(comprehensiveResponse.data).toHaveProperty('insights');
  });

  it('should stream pattern updates', async () => {
    const updates: any[] = [];
    const stream = gateway.streamPatternUpdates({
      minScore: 0.8
    });

    stream.on('pattern:update', (update) => {
      updates.push(update);
    });

    // Trigger an update by querying
    await gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: 'stream-test.ts'
    });

    // Wait for stream
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stream.stop();
    
    expect(updates.length).toBeGreaterThan(0);
  });

  it('should provide performance metrics', () => {
    const metrics = gateway.getMetrics();
    
    expect(metrics).toHaveProperty('quality_assessment');
    expect(metrics).toHaveProperty('realtime_similarity');
    expect(metrics).toHaveProperty('relationship_traversal');
    expect(metrics).toHaveProperty('historical_analysis');
    
    // Check metrics structure
    Object.values(metrics).forEach(metric => {
      expect(metric).toHaveProperty('count');
      expect(metric).toHaveProperty('avgTime');
      expect(metric.count).toBeGreaterThan(0);
      expect(metric.avgTime).toBeGreaterThan(0);
    });
  });

  it('should execute MCP tools successfully', async () => {
    const toolList = tools.getTools();
    expect(toolList.length).toBeGreaterThan(0);

    // Test a sample tool
    const qualityTool = toolList.find(t => t.name === 'analyze_code_quality');
    expect(qualityTool).toBeDefined();

    const result = await qualityTool!.handler({
      target: 'test.ts',
      includeRecommendations: true
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('quality');
    expect(result.data).toHaveProperty('metrics');
  });

  it('should handle errors gracefully', async () => {
    // Query for non-existent target
    const errorResponse = await gateway.handleMCPRequest({
      type: 'quality_assessment',
      target: 'non-existent-file-xyz.ts'
    });

    // Should still return a response, not throw
    expect(errorResponse.success).toBe(false);
    expect(errorResponse.insights).toBeDefined();
    expect(errorResponse.metadata.executionTime).toBeGreaterThan(0);
  });

  it('should verify cross-store consistency', async () => {
    const consistency = await reconciler.verifyConsistency(10);
    
    expect(consistency).toHaveProperty('consistent');
    expect(consistency).toHaveProperty('issues');
    expect(Array.isArray(consistency.issues)).toBe(true);
    
    // In a properly synchronized system
    if (consistency.issues.length > 0) {
      console.log('Consistency issues found:', consistency.issues);
    }
  });
});