#!/usr/bin/env node

/**
 * Demo script showing Phi-4 tool calling capabilities
 */

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

console.log('🎯 Phi-4 Tool Calling Demo\n');

// Demonstrate the tool calling format
console.log('📋 Tool Call Format:');
console.log('[TOOL_CALL]{"tool": "toolName", "parameters": {...}}[/TOOL_CALL]\n');

console.log('🛠️  Available Tools:');
console.log('1. analyzeFileStructure - Analyzes project file structure');
console.log('2. checkDependencies - Checks project dependencies');
console.log('3. generateSummary - Generates a project summary\n');

// Example tool call
const exampleToolCall = {
  tool: 'analyzeFileStructure',
  parameters: {
    includeHidden: false
  }
};

console.log('📝 Example Tool Call:');
console.log(`[TOOL_CALL]${JSON.stringify(exampleToolCall, null, 2)}[/TOOL_CALL]\n`);

// Demonstrate parsing
const runner = new Phi4ModelRunner();
const testData = {
  summary: {
    totalFiles: 42,
    directoryCount: 8,
    fileTypes: {
      '.tsx': 15,
      '.ts': 10,
      '.css': 5,
      '.json': 3
    }
  }
};

console.log('🔍 Parsing Tool Call...');
const result = runner.parseToolCall(JSON.stringify(exampleToolCall), testData);

console.log('\n📊 Tool Execution Result:');
console.log('   Tool Used:', result.toolsUsed?.[0] || 'N/A');
console.log('   Summary:', result.summary);
console.log('   Insights:', result.insights.length, 'found');

console.log('\n✅ Tool calling is supported!');
console.log('\nNote: When the full model runs, it can dynamically choose which tools to use');
console.log('based on the analysis requirements. The model has been prompted to use');
console.log('this format when it needs to call tools for deeper analysis.');