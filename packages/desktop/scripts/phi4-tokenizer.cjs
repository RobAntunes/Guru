/**
 * Phi-4 Tokenizer Implementation
 * Handles tokenization for the Phi-4 ONNX model
 */

const fs = require('fs').promises;
const path = require('path');

class Phi4Tokenizer {
  constructor(tokenizerPath) {
    this.tokenizerPath = tokenizerPath;
    this.tokenizer = null;
    this.vocab = null;
    this.merges = null;
    this.specialTokens = {};
  }

  async initialize() {
    try {
      // Load tokenizer configuration
      const tokenizerData = await fs.readFile(this.tokenizerPath, 'utf8');
      const tokenizerConfig = JSON.parse(tokenizerData);
      
      // Extract vocabulary and merges
      this.vocab = tokenizerConfig.model.vocab;
      this.merges = tokenizerConfig.model.merges || [];
      
      // Load special tokens
      if (tokenizerConfig.added_tokens) {
        tokenizerConfig.added_tokens.forEach(token => {
          this.specialTokens[token.content] = token.id;
        });
      }
      
      // Set special token IDs for Phi-4
      this.padTokenId = 199999; // From config.json
      this.eosTokenId = this.getTokenId('<|end|>') || this.getTokenId('<|im_end|>') || 199999;
      this.bosTokenId = this.getTokenId('<|system|>') || 199999;
      this.endTokenId = this.getTokenId('<|end|>') || 199999;
      
      console.log('✅ Tokenizer initialized');
      console.log(`   Vocabulary size: ${Object.keys(this.vocab).length}`);
      console.log(`   Special tokens: ${Object.keys(this.specialTokens).length}`);
      
    } catch (error) {
      console.error('Failed to initialize tokenizer:', error);
      throw error;
    }
  }

  getTokenId(token) {
    return this.vocab[token] || this.specialTokens[token];
  }

  // Simple BPE tokenization (basic implementation)
  tokenize(text) {
    const tokens = [];
    
    // Add BOS token if exists
    if (this.bosTokenId) {
      tokens.push(this.bosTokenId);
    }
    
    // Simple word-level tokenization as fallback
    // In production, this should use proper BPE
    const words = text.split(/(\s+|[^\w\s]+)/g).filter(w => w.length > 0);
    
    for (const word of words) {
      if (this.vocab[word] !== undefined) {
        tokens.push(this.vocab[word]);
      } else if (this.specialTokens[word] !== undefined) {
        tokens.push(this.specialTokens[word]);
      } else {
        // Character-level fallback
        for (const char of word) {
          let tokenId = this.vocab[char];
          if (tokenId === undefined) {
            tokenId = this.vocab['<unk>'];
          }
          if (tokenId === undefined) {
            tokenId = 0; // Ultimate fallback
          }
          tokens.push(tokenId);
        }
      }
    }
    
    // Ensure all tokens are valid numbers
    return tokens.filter(t => t !== undefined && !isNaN(t));
  }

  // Decode token IDs back to text
  decode(tokenIds) {
    const reverseVocab = {};
    Object.entries(this.vocab).forEach(([token, id]) => {
      reverseVocab[id] = token;
    });
    
    // Add special tokens to reverse vocab
    Object.entries(this.specialTokens).forEach(([token, id]) => {
      reverseVocab[id] = token;
    });
    
    let text = '';
    let skipNext = false;
    
    for (let i = 0; i < tokenIds.length; i++) {
      const id = tokenIds[i];
      
      // Skip invalid token IDs
      if (id < 0 || id >= 200064) continue;
      
      // Skip special tokens that shouldn't appear in output
      if (id === 199999 || id === this.padTokenId || id === this.eosTokenId) {
        continue;
      }
      
      const token = reverseVocab[id];
      if (token) {
        // Skip corrupted patterns
        if (token === 'detaie' || token === '!false') {
          skipNext = true;
          continue;
        }
        if (skipNext) {
          skipNext = false;
          continue;
        }
        text += token;
      }
    }
    
    // Clean up tokenization artifacts
    text = text.replace(/▁/g, ' '); // Replace sentencepiece underscore with space
    text = text.replace(/\s+/g, ' ').trim();
    
    // Additional cleanup for known corrupted patterns
    text = text.replace(/<\|i_m_ends\|>/g, '');
    text = text.replace(/\[{"detaie":!false}.*?\]/g, '');
    
    return text;
  }

  // Format the prompt for Phi-4 chat
  formatPrompt(systemPrompt, userPrompt, enableTools = false) {
    // Phi-4 uses specific chat format with <|system|>, <|user|>, <|assistant|> tags
    let enhancedSystemPrompt = systemPrompt;
    
    if (enableTools) {
      // Use Phi-4's tool format
      const toolDefinition = {
        name: "createAnalysisResponse",
        description: "Creates a properly formatted JSON analysis response",
        parameters: {
          type: "object",
          properties: {
            detectedDomain: { type: "string", description: "The detected project domain" },
            summary: { type: "string", description: "Analysis summary" },
            domainConfidence: { type: "number", description: "Confidence in domain detection" },
            insights: { type: "array", description: "List of insights" },
            recommendations: { type: "array", description: "List of recommendations" }
          }
        }
      };
      
      enhancedSystemPrompt += `<|tool|>${JSON.stringify([toolDefinition])}<|/tool|>`;
    }
    
    return `<|system|>${enhancedSystemPrompt}<|end|>
<|user|>${userPrompt}<|end|>
<|assistant|>`;
  }
}

module.exports = { Phi4Tokenizer };