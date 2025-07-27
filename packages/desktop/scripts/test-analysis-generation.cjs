#!/usr/bin/env node

const { Phi4ModelRunner } = require('./phi4-onnx-runner-proper.cjs');

async function testAnalysisGeneration() {
  console.log('🧪 Testing Analysis Generation...\n');
  
  try {
    const runner = new Phi4ModelRunner();
    await runner.initialize();
    
    // Create a realistic project analysis prompt
    const projectData = {
      systemPrompt: `You are an expert software architect. Analyze the provided project.

Provide:
1. Project type and architecture overview
2. Three specific code quality insights
3. Three actionable recommendations
4. Mention specific files or patterns

Be technical and specific.`,
      
      analysisPrompt: `Analyze this JavaScript/TypeScript project:

**Project Stats:**
- 156 files across 24 directories
- File types: .tsx (45), .ts (38), .js (25), .json (15), .css (8), .md (5)
- Has test files: true (12 test files)
- Has documentation: true (README.md, docs/)
- Large files: 2 (bundle.js, vendor.js)

**Key files:**
- src/App.tsx - Main React app component
- src/services/api.ts - API service layer  
- src/components/ - UI components
- src/hooks/ - Custom React hooks
- package.json shows: React 18, TypeScript, Vite, TanStack Query

**Code patterns observed:**
- Heavy use of React hooks and functional components
- API calls using async/await with error boundaries
- Some components exceed 300 lines
- Inconsistent naming (camelCase vs PascalCase)
- No unit tests for hooks
- Redux used for global state`,
      
      projectData: {
        summary: {
          totalFiles: 156,
          fileTypes: { '.tsx': 45, '.ts': 38, '.js': 25, '.json': 15, '.css': 8, '.md': 5 },
          directoryCount: 24,
          projectDomain: 'React TypeScript Web Application'
        }
      }
    };
    
    console.log('\n🚀 Starting analysis...');
    const result = await runner.analyzeProject(projectData);
    
    console.log('\n✅ Analysis complete!');
    console.log('\n📄 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.fullResponse) {
      console.log('\n📝 Full Response:');
      console.log(result.fullResponse);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testAnalysisGeneration();
