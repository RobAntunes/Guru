#!/usr/bin/env node

const { Phi4Tokenizer } = require('./phi4-tokenizer.cjs');
const path = require('path');

async function testTokenizer() {
  const tokenizerPath = path.join(
    process.env.HOME,
    'Library/Application Support/guru/models/phi4-mini/tokenizer.json'
  );
  
  console.log('Testing Phi-4 tokenizer...');
  console.log('Tokenizer path:', tokenizerPath);
  
  try {
    const tokenizer = new Phi4Tokenizer(tokenizerPath);
    await tokenizer.initialize();
    
    // Test tokenization
    const testText = "Hello, this is a test of the Phi-4 tokenizer.";
    console.log('\nTest text:', testText);
    
    const tokens = tokenizer.tokenize(testText);
    console.log('Tokens:', tokens.slice(0, 20), '... (showing first 20)');
    console.log('Total tokens:', tokens.length);
    
    // Test formatting
    const formatted = tokenizer.formatPrompt(
      "You are a helpful assistant.",
      "What is the capital of France?"
    );
    console.log('\nFormatted prompt:');
    console.log(formatted);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTokenizer();