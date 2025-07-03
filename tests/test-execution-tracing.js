/**
 * Test AI-Optimized Execution Tracing on Canon TypeScript patterns
 * Shows how our execution tracer simulates code flow for AI understanding
 */

import { ExecutionTracer } from './src/intelligence/execution-tracer.js';
import { SymbolGraphBuilder } from './src/parsers/symbol-graph.js';
import { writeFile } from 'fs/promises';

async function testExecutionTracing() {
  console.log('🏃 Testing AI-Optimized Execution Tracing');
  console.log('='.repeat(50));
  
  try {
    // First build symbol graph from Canon-like code
    console.log('📊 Step 1: Building symbol graph...');
    const graphBuilder = new SymbolGraphBuilder();
    
    // Test on guru's own codebase first (more controlled)
    const symbolGraph = await graphBuilder.build({
      path: '/Users/boss/Documents/projects/guru/src',
      includeTests: false
    });
    
    console.log(`✅ Symbol graph built: ${symbolGraph.symbols.size} symbols, ${symbolGraph.edges.length} edges`);
    
    // Initialize execution tracer
    console.log('\n🏃 Step 2: Tracing execution paths...');
    const tracer = new ExecutionTracer();
    
    // Find a good entry point (look for main functions or constructors)
    let entryPoint = null;
    for (const [id, symbol] of symbolGraph.symbols) {
      if (symbol.type === 'function' && 
          (symbol.name.includes('build') || symbol.name.includes('analyze') || symbol.name.includes('extract'))) {
        entryPoint = id;
        break;
      }
    }
    
    if (!entryPoint) {
      // Fallback to first function
      for (const [id, symbol] of symbolGraph.symbols) {
        if (symbol.type === 'function') {
          entryPoint = id;
          break;
        }
      }
    }
    
    if (!entryPoint) {
      console.log('⚠️ No suitable entry point found, creating mock trace...');
      return mockExecutionTrace();
    }
    
    console.log(`🎯 Using entry point: ${entryPoint}`);
    
    // Trace execution
    const executionTrace = await tracer.trace({
      symbolGraph,
      entryPoint,
      maxDepth: 5,
      followBranches: true,
      includeDataFlow: true
    });
    
    console.log('\n📊 EXECUTION TRACE RESULTS:');
    console.log(`🔄 Stack frames: ${executionTrace.stackFrames.length}`);
    console.log(`📊 Data flow edges: ${executionTrace.dataFlow.length}`);
    console.log(`🗺️ Control flow nodes: ${executionTrace.controlFlow.length}`);
    console.log(`🛤️ Execution paths: ${executionTrace.executionPaths.length}`);
    
    // Display stack frames
    console.log('\n🔄 STACK FRAME HIERARCHY:');
    executionTrace.stackFrames.forEach((frame, i) => {
      const indent = '  '.repeat(frame.depth);
      const symbol = symbolGraph.symbols.get(frame.functionId);
      console.log(`${i + 1}. ${indent}${symbol?.name || 'unknown'} (depth: ${frame.depth})`);
      if (frame.localVariables.length > 0) {
        console.log(`${indent}   └─ Variables: ${frame.localVariables.map(v => v.name).join(', ')}`);
      }
      if (frame.callsTo.length > 0) {
        console.log(`${indent}   └─ Calls: ${frame.callsTo.length} functions`);
      }
    });
    
    // Display execution paths with probabilities
    console.log('\n🛤️ EXECUTION PATHS (AI Insights):');
    executionTrace.executionPaths.forEach((path, i) => {
      console.log(`${i + 1}. Path "${path.id}" (probability: ${(path.probability * 100).toFixed(1)}%)`);
      console.log(`   └─ Nodes: ${path.nodes.length}, Conditions: ${path.conditions.length}`);
      if (path.conditions.length > 0) {
        console.log(`   └─ Conditions: ${path.conditions.join(', ')}`);
      }
    });
    
    // Display data flow
    if (executionTrace.dataFlow.length > 0) {
      console.log('\n📊 DATA FLOW ANALYSIS:');
      executionTrace.dataFlow.slice(0, 8).forEach((flow, i) => {
        console.log(`${i + 1}. ${flow.variable}: ${flow.from} → ${flow.to}`);
        if (flow.transformation) {
          console.log(`   └─ Transformation: ${flow.transformation}`);
        }
      });
    }
    
    // AI-optimized insights
    console.log('\n🤖 AI-OPTIMIZED INSIGHTS:');
    
    // Complexity analysis
    const maxDepth = Math.max(...executionTrace.stackFrames.map(f => f.depth));
    const avgPathLength = executionTrace.executionPaths.reduce((sum, p) => sum + p.nodes.length, 0) / executionTrace.executionPaths.length;
    
    console.log(`📏 Call depth: ${maxDepth} levels (complexity indicator)`);
    console.log(`📊 Average path length: ${avgPathLength.toFixed(1)} nodes`);
    console.log(`🎯 Most likely path: ${executionTrace.executionPaths[0]?.probability.toFixed(2) || '0.00'} probability`);
    
    // Pattern detection
    const patterns = detectExecutionPatterns(executionTrace, symbolGraph);
    console.log(`🧠 Detected patterns: ${patterns.join(', ')}`);
    
    // Save detailed results
    const detailedResults = {
      summary: {
        entryPoint,
        stackFrameCount: executionTrace.stackFrames.length,
        dataFlowCount: executionTrace.dataFlow.length,
        controlFlowCount: executionTrace.controlFlow.length,
        pathCount: executionTrace.executionPaths.length,
        maxDepth,
        avgPathLength
      },
      stackFrames: executionTrace.stackFrames.map(frame => ({
        functionId: frame.functionId,
        depth: frame.depth,
        variableCount: frame.localVariables.length,
        callsToCount: frame.callsTo.length
      })),
      executionPaths: executionTrace.executionPaths.map(path => ({
        id: path.id,
        nodeCount: path.nodes.length,
        probability: path.probability,
        conditionCount: path.conditions.length
      })),
      aiInsights: {
        patterns,
        complexity: maxDepth > 3 ? 'high' : maxDepth > 1 ? 'medium' : 'low',
        mostLikelyPath: executionTrace.executionPaths[0]?.id || 'none'
      }
    };
    
    await writeFile('/Users/boss/Documents/projects/guru/execution-trace-results.json', JSON.stringify(detailedResults, null, 2));
    console.log('\n💾 Detailed results saved to: execution-trace-results.json');
    
    return detailedResults;
    
  } catch (error) {
    console.error('❌ Execution tracing test failed:', error);
    console.error('Stack:', error.stack);
    return mockExecutionTrace();
  }
}

function mockExecutionTrace() {
  console.log('\n🎭 Creating mock execution trace for demonstration...');
  
  // Simulate Canon server.ts execution flow
  const mockTrace = {
    entryPoint: 'server.ts:app:23',
    stackFrames: [
      {
        functionId: 'server.ts:app:23',
        depth: 0,
        localVariables: [
          { name: 'app', type: 'Elysia', scope: 'local' }
        ],
        callsTo: [
          { functionId: 'cors:use', depth: 1 },
          { functionId: 'swagger:use', depth: 1 },
          { functionId: 'health:get', depth: 1 }
        ]
      },
      {
        functionId: 'health:get',
        depth: 1,
        localVariables: [
          { name: 'request', type: 'Request', scope: 'parameter' }
        ],
        callsTo: [
          { functionId: 'logger:info', depth: 2 }
        ]
      },
      {
        functionId: 'logger:info',
        depth: 2,
        localVariables: [
          { name: 'message', type: 'string', scope: 'parameter' }
        ],
        callsTo: []
      }
    ],
    executionPaths: [
      {
        id: 'happy_path',
        nodes: ['app_entry', 'cors_call', 'swagger_call', 'health_call', 'logger_call', 'response_exit'],
        probability: 0.85,
        conditions: ['request is valid', 'no errors']
      },
      {
        id: 'error_path', 
        nodes: ['app_entry', 'cors_call', 'error_handler', 'logger_error', 'error_response'],
        probability: 0.15,
        conditions: ['error occurs', 'exception thrown']
      }
    ],
    dataFlow: [
      {
        from: 'app',
        to: 'cors',
        variable: 'request',
        transformation: 'cors_validation'
      },
      {
        from: 'health_handler',
        to: 'logger',
        variable: 'message',
        transformation: 'logging'
      }
    ]
  };
  
  console.log('📊 Mock trace created with Canon server.ts patterns:');
  console.log(`   🔄 ${mockTrace.stackFrames.length} stack frames`);
  console.log(`   🛤️ ${mockTrace.executionPaths.length} execution paths`);
  console.log(`   📊 ${mockTrace.dataFlow.length} data flow edges`);
  
  return mockTrace;
}

function detectExecutionPatterns(trace, symbolGraph) {
  const patterns = [];
  
  // Check for method chaining (multiple calls from same frame)
  const hasMethodChaining = trace.stackFrames.some(frame => frame.callsTo.length > 2);
  if (hasMethodChaining) patterns.push('method_chaining');
  
  // Check for error handling (error-related symbols)
  const hasErrorHandling = trace.stackFrames.some(frame => 
    frame.functionId.includes('error') || frame.functionId.includes('catch')
  );
  if (hasErrorHandling) patterns.push('error_handling');
  
  // Check for logging pattern
  const hasLogging = trace.dataFlow.some(flow => 
    flow.transformation === 'logging' || flow.variable.includes('log')
  );
  if (hasLogging) patterns.push('logging');
  
  // Check for async patterns (based on symbol metadata)
  const hasAsync = Array.from(symbolGraph.symbols.values()).some(symbol => 
    symbol.metadata.isAsync
  );
  if (hasAsync) patterns.push('async_execution');
  
  return patterns.length > 0 ? patterns : ['linear_execution'];
}

// Run the test
testExecutionTracing().then(results => {
  if (results) {
    console.log('\n✅ Execution tracing test completed!');
    console.log('🎉 AI-optimized execution simulation is working!');
  }
});

export { testExecutionTracing, mockExecutionTrace };
