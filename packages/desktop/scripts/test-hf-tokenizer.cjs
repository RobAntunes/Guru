#!/usr/bin/env node

const { Phi4HFTokenizer } = require('./phi4-tokenizer-hf.cjs');
const { ModelManager } = require('./model-manager.cjs');

async function testTokenizer() {
  console.log('🧪 Testing Hugging Face Tokenizer...\n');
  
  try {
    // Get model path
    const modelManager = new ModelManager();
    const { modelPath } = await modelManager.ensureModelExists();
    
    // Initialize tokenizer
    const tokenizer = new Phi4HFTokenizer(modelPath);
    await tokenizer.initialize();
    
    // Test text
    const testText = "Hello, this is a test of the Phi-4 tokenizer!";
    console.log('📝 Test text:', testText);
    
    // Tokenize
    const tokens = tokenizer.tokenize(testText);
    console.log('🔤 Tokens:', tokens);
    console.log('   Token count:', tokens.length);
    
    // Decode back
    const decoded = tokenizer.decode(tokens);
    console.log('📄 Decoded:', decoded);
    
    // Test prompt formatting
    const formatted = tokenizer.formatPrompt(
      "You are a helpful assistant.",
      "What is the capital of France?"
    );
    console.log('\n📋 Formatted prompt:');
    console.log(formatted);
    
    console.log('\n✅ Tokenizer test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

testTokenizer();