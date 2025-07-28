#!/usr/bin/env node

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

async function testMarkdownGeneration() {
  console.log('📝 Testing Markdown Generation...\n');
  
  try {
    const runner = new Phi4ModelRunner();
    await runner.initialize();
    
    // Create a project analysis request that emphasizes markdown output
    const projectData = {
      systemPrompt: `You are an expert software architect. Generate your analysis in MARKDOWN format.

IMPORTANT: 
- Start with # Project Analysis as the main heading
- Use proper markdown formatting (headers, lists, bold, code blocks)
- Do NOT generate code - only analysis text
- Focus on insights and recommendations`,
      
      analysisPrompt: `Analyze this simple test project:

**Project Stats:**
- 10 files total
- TypeScript and React project
- Has tests and documentation

Generate a SHORT markdown analysis (3-4 paragraphs max) covering:
1. Project overview
2. Key strengths
3. Areas for improvement

Keep it concise and well-formatted in markdown.`,
      
      projectData: {
        summary: {
          totalFiles: 10,
          fileTypes: { '.tsx': 5, '.ts': 3, '.json': 2 },
          directoryCount: 3
        }
      }
    };
    
    console.log('\n🚀 Generating markdown analysis...');
    const result = await runner.analyzeProject(projectData);
    
    console.log('\n✅ Analysis complete!');
    console.log('\n📄 Response type:', result.responseType);
    console.log('\n📝 Generated Markdown:');
    console.log('='.repeat(60));
    console.log(result.summary);
    console.log('='.repeat(60));
    
    // Check if it's valid markdown
    const hasMarkdownElements = 
      result.summary.includes('#') || 
      result.summary.includes('**') || 
      result.summary.includes('- ') ||
      result.summary.includes('1.');
    
    console.log('\n✅ Contains markdown elements:', hasMarkdownElements);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testMarkdownGeneration();
