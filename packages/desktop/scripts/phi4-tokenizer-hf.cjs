/**
 * Phi-4 Tokenizer using Hugging Face transformers
 */

const { AutoTokenizer } = require('@huggingface/transformers');
const path = require('path');

class Phi4HFTokenizer {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.tokenizer = null;
  }

  async initialize() {
    try {
      console.log('🔧 Loading Phi-4 tokenizer from local files...');
      
      // Load the tokenizer from the local model directory
      // The tokenizer.json file should be in the same directory as the model
      const tokenizerPath = path.dirname(this.modelPath);
      
      // Load from local directory - transformers.js will look for tokenizer.json
      this.tokenizer = await AutoTokenizer.from_pretrained(tokenizerPath);
      
      console.log('✅ Tokenizer loaded successfully');
      console.log('   Vocab size:', this.tokenizer.model.vocab.length || 'N/A');
      
    } catch (error) {
      console.error('Failed to initialize HF tokenizer:', error);
      throw error;
    }
  }

  tokenize(text) {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not initialized');
    }
    
    // Use the tokenizer to encode text
    const encoded = this.tokenizer(text, {
      add_special_tokens: true,
      return_tensor: false
    });
    
    return encoded.input_ids;
  }

  decode(tokenIds) {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not initialized');
    }
    
    // Filter out invalid tokens
    const validTokenIds = tokenIds.filter(id => 
      id !== undefined && 
      id !== null && 
      !isNaN(id) && 
      id >= 0
    );
    
    if (validTokenIds.length === 0) {
      console.warn('No valid tokens to decode');
      return '';
    }
    
    // Decode token IDs back to text
    return this.tokenizer.decode(validTokenIds, {
      skip_special_tokens: false
    });
  }

  formatPrompt(systemPrompt, userPrompt, enableTools = false) {
    // Use the apply_chat_template if available
    if (this.tokenizer.apply_chat_template) {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      return this.tokenizer.apply_chat_template(messages, {
        tokenize: false,
        add_generation_prompt: true
      });
    }
    
    // Fallback to Phi-4 format
    return `<|system|>${systemPrompt}<|end|>\n<|user|>${userPrompt}<|end|>\n<|assistant|>`;
  }
}

module.exports = { Phi4HFTokenizer };