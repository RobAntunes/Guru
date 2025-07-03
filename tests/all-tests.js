#!/usr/bin/env bun

const { execSync } = require('child_process');
const fs = require('fs');

const TESTS = [
  'test-canon-analysis.js',
  'test-code-clustering.js',
  'test-dependencies.js',
  'test-enhanced-smart-naming.js',
  'test-entry-point-detection.js',
  'test-execution-tracing.js',
  'test-feedback-loops.js',
  'test-mcp-integration.js',
  'test-memory-analysis.js',
  'test-pattern-detection.js',
  'test-pattern-mining.js',
  'test-performance-analysis.js',
  'test-smart-naming.js',
  'test-symbol-graph.js',
  'validate-purpose-inference.js',
  'live-test-canon.js',
  'test-purpose-inference.js',
];

let passed = 0;
let failed = 0;

for (const test of TESTS) {
  if (!fs.existsSync(`./tests/${test}`)) continue;
  console.log(`\n==============================`);
  console.log(`RUNNING: ${test}`);
  console.log(`==============================`);
  try {
    execSync(`bun ./tests/${test}`, { stdio: 'inherit' });
    passed++;
  } catch (e) {
    console.error(`❌ Test failed: ${test}`);
    failed++;
    process.exit(1);
  }
}

console.log(`\n==============================`);
console.log(`ALL TESTS COMPLETED`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed.');
  process.exit(1);
} 