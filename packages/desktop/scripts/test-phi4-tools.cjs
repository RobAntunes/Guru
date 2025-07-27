#!/usr/bin/env node

/**
 * Test script for Phi-4 tool calling functionality
 */

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

async function testToolCalling() {
  console.log('🧪 Testing Phi-4 tool calling functionality...\n');
  
  const runner = new Phi4ModelRunner();
  
  try {
    // Initialize the model
    await runner.initialize();
    
    // Test data
    const testProjectData = {
      systemPrompt: "You are an advanced code analysis assistant. Use available tools to analyze the project structure and provide insights.",
      analysisPrompt: "Analyze this TypeScript React project and use the analyzeFileStructure tool to understand its organization.",
      projectData: {
        summary: {
          totalFiles: 42,
          totalSize: 1024000,
          directoryCount: 8,
          projectDomain: 'web',
          fileTypes: {
            '.tsx': 15,
            '.ts': 10,
            '.css': 5,
            '.json': 3,
            '.md': 2,
            '.js': 7
          }
        }
      }
    };
    
    // Run analysis
    console.log('🚀 Running analysis with tool support...\n');
    const result = await runner.analyzeProject(testProjectData);
    
    // Display results
    console.log('📊 Analysis Results:');
    console.log('   Domain:', result.detectedDomain);
    console.log('   Confidence:', result.confidence);
    console.log('   Tools Used:', result.toolsUsed || 'None');
    console.log('\n📝 Summary:');
    console.log(result.summary);
    
    if (result.insights.length > 0) {
      console.log('\n💡 Insights:');
      result.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. [${insight.category}] ${insight.title}`);
        console.log(`      ${insight.description}`);
      });
    }
    
    if (result.toolsUsed && result.toolsUsed.length > 0) {
      console.log('\n✅ Tool calling working! Used tools:', result.toolsUsed.join(', '));
    } else {
      console.log('\n⚠️  No tools were called in this response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testToolCalling().catch(console.error);