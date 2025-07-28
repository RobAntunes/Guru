/**
 * Phi-4 Text Generator with proper KV cache handling
 * Implements iterative text generation for SILC protocol compatibility
 */

const ort = require('onnxruntime-node');
const fs = require('fs').promises;
const path = require('path');

class Phi4TextGenerator {
  constructor(modelPath, tokenizerPath) {
    this.modelPath = modelPath;
    this.tokenizerPath = tokenizerPath;
    this.session = null;
    this.tokenizer = null;
    this.initialized = false;
    
    // Model configuration (from config.json)
    this.numLayers = 32;
    this.numHeads = 8; // num_key_value_heads from config
    this.headDim = 128; // hidden_size (3072) / num_attention_heads (24)
    this.vocabSize = 200064; // From config.json
    
    // Generation parameters
    this.maxLength = 2048;
    this.temperature = 0.7;
    this.topP = 0.9;
    this.topK = 50;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load tokenizer
      const { Phi4Tokenizer } = require('./phi4-tokenizer.cjs');
      this.tokenizer = new Phi4Tokenizer(this.tokenizerPath);
      await this.tokenizer.initialize();
      
      // Create ONNX session
      console.log('🔧 Loading Phi-4 model for text generation...');
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true
      });
      
      this.initialized = true;
      console.log('✅ Text generator initialized');
    } catch (error) {
      console.error('Failed to initialize text generator:', error);
      throw error;
    }
  }

  /**
   * Generate text completion for the given prompt
   */
  async generate(prompt, maxNewTokens = 500) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log('🔤 Tokenizing prompt...');
    const inputIds = this.tokenizer.tokenize(prompt);
    console.log(`   Input tokens: ${inputIds.length}`);
    
    if (inputIds.length > this.maxLength - maxNewTokens) {
      console.warn('⚠️  Truncating input to fit context window');
      inputIds.splice(0, inputIds.length - (this.maxLength - maxNewTokens));
    }
    
    // Generate tokens
    const generatedIds = await this.generateTokens(inputIds, maxNewTokens);
    
    // Decode to text
    const generatedText = this.tokenizer.decode(generatedIds);
    
    return generatedText;
  }

  /**
   * Core token generation loop with KV cache
   */
  async generateTokens(inputIds, maxNewTokens) {
    const batchSize = 1;
    let currentIds = [...inputIds];
    const generatedTokens = [];
    let pastKeyValues = null;
    
    console.log('🤖 Generating text...');
    const startTime = Date.now();
    
    for (let step = 0; step < maxNewTokens; step++) {
      try {
        // Prepare inputs for this step
        const stepInputs = this.prepareInputs(currentIds, pastKeyValues, batchSize);
        
        // Run model inference
        const outputs = await this.session.run(stepInputs);
        
        // Extract and process logits
        const nextTokenId = this.processLogits(outputs.logits);
        
        // Check for stopping conditions
        if (this.shouldStop(nextTokenId, generatedTokens)) {
          console.log('\n🛑 Generation stopped (end token or repetition)');
          break;
        }
        
        // Update state
        generatedTokens.push(nextTokenId);
        currentIds.push(nextTokenId);
        
        // Update KV cache for next iteration
        pastKeyValues = this.extractPastKeyValues(outputs);
        
        // Progress indicator
        if (step % 20 === 0 && step > 0) {
          const tokensPerSecond = (step / ((Date.now() - startTime) / 1000)).toFixed(1);
          process.stderr.write(`\n   Generated ${step} tokens (${tokensPerSecond} t/s)`);
        } else if (step % 5 === 0) {
          process.stderr.write('.');
        }
        
      } catch (error) {
        console.error('\n❌ Generation error at step', step, ':', error.message);
        break;
      }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Generated ${generatedTokens.length} tokens in ${elapsed}s`);
    
    return generatedTokens;
  }

  /**
   * Prepare model inputs for the current generation step
   */
  prepareInputs(currentIds, pastKeyValues, batchSize) {
    const isFirstStep = !pastKeyValues;
    const inputLength = isFirstStep ? currentIds.length : 1;
    const inputSlice = isFirstStep ? currentIds : [currentIds[currentIds.length - 1]];
    
    // Create input_ids tensor
    const inputIds = new ort.Tensor('int64',
      new BigInt64Array(inputSlice.map(id => BigInt(id))),
      [batchSize, inputLength]
    );
    
    // Create attention mask
    const totalLength = currentIds.length;
    const attentionMask = new ort.Tensor('int64',
      new BigInt64Array(totalLength).fill(1n),
      [batchSize, totalLength]
    );
    
    // Start with basic inputs
    const inputs = {
      input_ids: inputIds,
      attention_mask: attentionMask
    };
    
    // Add KV cache inputs
    if (pastKeyValues) {
      // Use existing KV cache
      Object.assign(inputs, pastKeyValues);
    } else {
      // Initialize empty KV cache for first step
      for (let i = 0; i < this.numLayers; i++) {
        const emptyShape = [batchSize, this.numHeads, 0, this.headDim];
        inputs[`past_key_values.${i}.key`] = new ort.Tensor('float32', 
          new Float32Array(0), emptyShape);
        inputs[`past_key_values.${i}.value`] = new ort.Tensor('float32', 
          new Float32Array(0), emptyShape);
      }
    }
    
    return inputs;
  }

  /**
   * Extract next token from model logits
   */
  processLogits(logitsTensor) {
    const logitsData = logitsTensor.data;
    const lastPosition = logitsTensor.dims[1] - 1;
    
    // Get logits for the last token position
    const startIdx = lastPosition * this.vocabSize;
    const endIdx = startIdx + this.vocabSize;
    const logits = Array.from(logitsData.slice(startIdx, endIdx));
    
    // Apply temperature
    const scaledLogits = logits.map(l => l / this.temperature);
    
    // Apply top-k filtering
    const topKLogits = this.applyTopK(scaledLogits, this.topK);
    
    // Apply top-p (nucleus) filtering
    const filteredLogits = this.applyTopP(topKLogits, this.topP);
    
    // Sample from the filtered distribution
    return this.sampleFromLogits(filteredLogits);
  }

  /**
   * Apply top-k filtering to logits
   */
  applyTopK(logits, k) {
    if (k <= 0 || k >= logits.length) return logits;
    
    // Get indices of top-k values
    const indexed = logits.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);
    
    const topKIndices = new Set(indexed.slice(0, k).map(item => item.idx));
    
    // Set non-top-k values to -Infinity
    return logits.map((val, idx) => topKIndices.has(idx) ? val : -Infinity);
  }

  /**
   * Apply top-p (nucleus) filtering to logits
   */
  applyTopP(logits, p) {
    if (p <= 0 || p >= 1) return logits;
    
    // Convert to probabilities
    const maxLogit = Math.max(...logits.filter(l => l > -Infinity));
    const expLogits = logits.map(l => l > -Infinity ? Math.exp(l - maxLogit) : 0);
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / sumExp);
    
    // Sort by probability
    const indexed = probs.map((prob, idx) => ({ prob, idx, logit: logits[idx] }));
    indexed.sort((a, b) => b.prob - a.prob);
    
    // Find cutoff for top-p
    let cumSum = 0;
    let cutoffIdx = 0;
    for (let i = 0; i < indexed.length; i++) {
      cumSum += indexed[i].prob;
      if (cumSum >= p) {
        cutoffIdx = i;
        break;
      }
    }
    
    // Keep only tokens in top-p
    const topPIndices = new Set(indexed.slice(0, cutoffIdx + 1).map(item => item.idx));
    return logits.map((val, idx) => topPIndices.has(idx) ? val : -Infinity);
  }

  /**
   * Sample token from filtered logits distribution
   */
  sampleFromLogits(logits) {
    // Convert to probabilities
    const validLogits = logits.filter(l => l > -Infinity);
    if (validLogits.length === 0) return 0; // Fallback
    
    const maxLogit = Math.max(...validLogits);
    const expLogits = logits.map(l => l > -Infinity ? Math.exp(l - maxLogit) : 0);
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / sumExp);
    
    // Sample from distribution
    const random = Math.random();
    let cumProb = 0;
    for (let i = 0; i < probs.length; i++) {
      cumProb += probs[i];
      if (random < cumProb) {
        return i;
      }
    }
    
    return probs.length - 1; // Fallback
  }

  /**
   * Extract KV cache from model outputs
   */
  extractPastKeyValues(outputs) {
    const pastKV = {};
    
    for (let i = 0; i < this.numLayers; i++) {
      pastKV[`past_key_values.${i}.key`] = outputs[`present.${i}.key`];
      pastKV[`past_key_values.${i}.value`] = outputs[`present.${i}.value`];
    }
    
    return pastKV;
  }

  /**
   * Check if generation should stop
   */
  shouldStop(tokenId, generatedTokens) {
    // Check for EOS token
    if (tokenId === this.tokenizer.eosTokenId || tokenId === this.tokenizer.padTokenId) {
      return true;
    }
    
    // Check for repetition (simple check for repeated sequences)
    if (generatedTokens.length >= 20) {
      const recent = generatedTokens.slice(-20);
      const pattern = recent.slice(-10).join(',');
      const earlier = recent.slice(0, 10).join(',');
      if (pattern === earlier) {
        console.log('\n⚠️  Repetition detected');
        return true;
      }
    }
    
    // Check if we're generating JSON and found closing brace
    const lastTokens = generatedTokens.slice(-5);
    const decoded = this.tokenizer.decode(lastTokens);
    if (decoded.includes('}') && decoded.includes('\n')) {
      // Likely end of JSON response
      return true;
    }
    
    return false;
  }
}

module.exports = { Phi4TextGenerator };