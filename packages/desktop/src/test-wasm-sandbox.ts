/**
 * Test WASM Sandbox Integration
 * Verifies that the sandbox can execute code through MCP
 */

import { sandboxService } from './services/sandbox-service';

async function testWASMSandbox() {
  console.log('Testing WASM Sandbox Integration...\n');

  // Test 1: Simple JavaScript execution
  console.log('Test 1: JavaScript execution');
  const jsResult = await sandboxService.executeCode(
    'const result = 2 + 2; result',
    'javascript'
  );
  console.log('Result:', jsResult);

  // Test 2: Python execution
  console.log('\nTest 2: Python execution');
  const pyResult = await sandboxService.executeCode(
    'result = 3 * 7\nresult',
    'python'
  );
  console.log('Result:', pyResult);

  // Test 3: Context injection
  console.log('\nTest 3: Context injection');
  const contextResult = await sandboxService.executeCode(
    'const sum = x + y; sum',
    'javascript',
    { context: { x: 10, y: 20 } }
  );
  console.log('Result:', contextResult);

  // Test 4: Error handling
  console.log('\nTest 4: Error handling');
  const errorResult = await sandboxService.executeCode(
    'throw new Error("Test error")',
    'javascript'
  );
  console.log('Result:', errorResult);

  console.log('\nAll tests completed!');
}

// Export for testing
export { testWASMSandbox };