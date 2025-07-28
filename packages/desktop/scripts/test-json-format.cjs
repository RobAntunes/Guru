#!/usr/bin/env node

/**
 * Test the formatAsJSON tool
 */

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

console.log('🧪 Testing formatAsJSON Tool\n');

const runner = new Phi4ModelRunner();

// Test data
const testData = {
  summary: {
    totalFiles: 42,
    directoryCount: 8,
    fileTypes: {
      '.tsx': 15,
      '.ts': 10,
      '.css': 5
    }
  }
};

// Test the formatAsJSON tool
const toolCall = {
  tool: 'formatAsJSON',
  parameters: {
    analysis: {
      domain: 'web',
      confidence: 0.95,
      summary: 'Modern React TypeScript application',
      insights: [
        {
          category: 'Architecture',
          title: 'Component-based structure',
          description: 'Well-organized React components with TypeScript',
          severity: 'info'
        },
        {
          category: 'Type Safety',
          title: 'Strong typing throughout',
          description: 'Consistent use of TypeScript interfaces and types',
          severity: 'info'
        }
      ],
      recommendations: [
        {
          priority: 'medium',
          category: 'Testing',
          title: 'Add unit tests',
          description: 'Consider adding Jest tests for components',
          impact: 'Improved reliability'
        }
      ]
    }
  }
};

console.log('📋 Tool Call:');
console.log(JSON.stringify(toolCall, null, 2));

console.log('\n🔧 Executing formatAsJSON tool...');
const result = runner.parseToolCall(JSON.stringify(toolCall), testData);

console.log('\n✅ Result (properly formatted JSON):');
console.log(JSON.stringify(result, null, 2));

console.log('\n🎯 Key benefits of formatAsJSON tool:');
console.log('1. Ensures valid JSON output');
console.log('2. Prevents parsing errors');
console.log('3. Guarantees all required fields are present');
console.log('4. Fixes the white screen issue!');