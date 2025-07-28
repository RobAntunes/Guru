#!/usr/bin/env node

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

async function testSimpleGeneration() {
  console.log('🧪 Testing Simple Generation...\n');
  
  try {
    const runner = new Phi4ModelRunner();
    await runner.initialize();
    
    // Create a very simple prompt
    const projectData = {
      systemPrompt: 'You are a helpful assistant.',
      analysisPrompt: 'Say hello.',
      projectData: {
        summary: {
          totalFiles: 10,
          fileTypes: { '.js': 5, '.json': 5 },
          directoryCount: 2
        }
      }
    };
    
    console.log('\n🚀 Starting analysis...');
    const result = await runner.analyzeProject(projectData);
    
    console.log('\n✅ Analysis complete!');
    console.log('\n📄 Result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testSimpleGeneration();
