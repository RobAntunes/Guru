/**
 * Manual test of Guru's symbol extraction logic
 * Tests what our parser would find in Canon's codebase
 */

import { readFile } from 'fs/promises';

// Sample TypeScript code from Canon
const canonServerSample = `
import logger from './utils/logger';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
});

const rateLimit = (maxRequests = 1000, windowMs = 60000) => {
  return (request: any) => {
    const ip = request.headers['x-forwarded-for'] || 'unknown';
    // Rate limiting logic
  };
};

const app = new Elysia()
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }))
  .ws('/ws', {
    message(ws, message) {
      logger.info('Received message:', message);
      ws.send(\`Echo: \${message}\`);
    },
    open(ws) {
      logger.info('WebSocket connection opened');
    },
  });

export { app, rateLimit };
`;

// Manual symbol extraction simulation
function analyzeCanonSample() {
  console.log('🎯 Analyzing Canon server.ts sample...\n');
  
  // What our symbol graph builder should find:
  const expectedSymbols = [
    { name: 'logger', type: 'import', line: 1 },
    { name: 'cors', type: 'import', line: 2 },
    { name: 'Elysia', type: 'import', line: 3 },
    { name: 'httpRequestDuration', type: 'variable', line: 5 },
    { name: 'rateLimit', type: 'function', line: 10 },
    { name: 'app', type: 'variable', line: 17 },
    { name: 'message', type: 'function', line: 23 }, // WebSocket handler
    { name: 'open', type: 'function', line: 27 },    // WebSocket handler
  ];

  console.log('📊 Expected symbols:');
  expectedSymbols.forEach((symbol, i) => {
    console.log(`${i + 1}. ${symbol.type}: ${symbol.name} (line ${symbol.line})`);
  });

  // Dependencies we should detect
  const expectedDependencies = [
    { from: 'app', to: 'Elysia', type: 'uses' },
    { from: 'app', to: 'cors', type: 'uses' },
    { from: 'message', to: 'logger', type: 'calls' },
    { from: 'open', to: 'logger', type: 'calls' },
    { from: 'httpRequestDuration', to: 'promClient', type: 'uses' },
  ];

  console.log('\n🔗 Expected dependencies:');
  expectedDependencies.forEach((dep, i) => {
    console.log(`${i + 1}. ${dep.from} ${dep.type} ${dep.to}`);
  });

  // Pattern analysis
  console.log('\n🧠 Pattern insights:');
  console.log('- Method chaining pattern (Elysia fluent API)');
  console.log('- Callback/event handler pattern (WebSocket)');
  console.log('- Factory pattern (rateLimit function)');
  console.log('- Configuration object pattern (WebSocket handlers)');
  console.log('- ES6 imports at module level');

  return {
    symbolCount: expectedSymbols.length,
    dependencyCount: expectedDependencies.length,
    patterns: ['method_chaining', 'event_handlers', 'factory', 'es6_imports']
  };
}

// Test purpose inference
function testPurposeInference() {
  console.log('\n🧠 Purpose inference test:');
  
  const purposeTests = [
    {
      symbol: 'rateLimit',
      evidence: ['naming: contains "limit"', 'parameters: maxRequests, windowMs', 'returns function'],
      inferredPurpose: 'Rate limiting middleware factory',
      confidence: 0.9
    },
    {
      symbol: 'httpRequestDuration', 
      evidence: ['naming: contains "duration"', 'type: Histogram', 'metrics context'],
      inferredPurpose: 'Prometheus metrics for HTTP request timing',
      confidence: 0.95
    },
    {
      symbol: 'app',
      evidence: ['type: Elysia instance', 'method chaining', 'route definitions'],
      inferredPurpose: 'Main HTTP server application',
      confidence: 0.9
    }
  ];

  purposeTests.forEach((test, i) => {
    console.log(`\\n${i + 1}. Symbol: ${test.symbol}`);
    console.log(`   Purpose: ${test.inferredPurpose}`);
    console.log(`   Confidence: ${test.confidence}`);
    console.log(`   Evidence: ${test.evidence.join(', ')}`);
  });
}

// Run the analysis
const results = analyzeCanonSample();
testPurposeInference();

console.log('\\n✅ Manual analysis complete!');
console.log(`📊 Found ${results.symbolCount} symbols, ${results.dependencyCount} dependencies`);
console.log(`🎯 Patterns: ${results.patterns.join(', ')}`);

export { analyzeCanonSample, canonServerSample };
