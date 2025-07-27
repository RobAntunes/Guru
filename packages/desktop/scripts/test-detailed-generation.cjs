#!/usr/bin/env node

const ort = require('onnxruntime-node');
const { Phi4HFTokenizer } = require('./phi4-tokenizer-hf.cjs');
const { ModelManager } = require('./model-manager.cjs');

async function testDetailedGeneration() {
  console.log('🧪 Testing Detailed Generation...\n');
  
  try {
    // Initialize
    const modelManager = new ModelManager();
    const { modelPath } = await modelManager.ensureModelExists();
    
    const tokenizer = new Phi4HFTokenizer(modelPath);
    await tokenizer.initialize();
    
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      logSeverityLevel: 3
    });
    
    // Simple prompt
    const prompt = tokenizer.formatPrompt(
      'You are a helpful assistant.',
      'What is 2+2?'
    );
    
    console.log('📝 Prompt:', prompt);
    
    const inputIds = tokenizer.tokenize(prompt);
    console.log('🔤 Input tokens:', inputIds.length, 'tokens');
    console.log('   Tokens:', inputIds);
    
    // Manual generation loop
    let currentIds = [...inputIds];
    let pastKeyValues = null;
    const maxSteps = 20;
    
    for (let step = 0; step < maxSteps; step++) {
      console.log(`\n🔄 Step ${step}:`);
      
      // Prepare inputs
      const inputLength = pastKeyValues ? 1 : currentIds.length;
      const inputSlice = pastKeyValues ? [currentIds[currentIds.length - 1]] : currentIds;
      
      const inputIdsTensor = new ort.Tensor('int64',
        new BigInt64Array(inputSlice.map(id => BigInt(id))),
        [1, inputLength]
      );
      
      const attentionMask = new ort.Tensor('int64',
        new BigInt64Array(currentIds.length).fill(1n),
        [1, currentIds.length]
      );
      
      const feeds = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMask
      };
      
      // Add KV cache
      if (pastKeyValues) {
        Object.assign(feeds, pastKeyValues);
      } else {
        for (let i = 0; i < 32; i++) {
          feeds[`past_key_values.${i}.key`] = new ort.Tensor('float32',
            new Float32Array(0), [1, 8, 0, 128]);
          feeds[`past_key_values.${i}.value`] = new ort.Tensor('float32',
            new Float32Array(0), [1, 8, 0, 128]);
        }
      }
      
      // Run inference
      const output = await session.run(feeds);
      
      // Get logits
      const logits = output.logits;
      const [, seqLen, vocabSize] = logits.dims;
      console.log('   Output shape:', logits.dims);
      
      // Get last token logits
      const offset = (seqLen - 1) * vocabSize;
      const lastLogits = new Float32Array(vocabSize);
      for (let i = 0; i < vocabSize; i++) {
        lastLogits[i] = logits.data[offset + i];
      }
      
      // Simple argmax
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < vocabSize; i++) {
        if (lastLogits[i] > maxVal) {
          maxVal = lastLogits[i];
          maxIdx = i;
        }
      }
      
      console.log('   Next token ID:', maxIdx);
      console.log('   Next token:', tokenizer.decode([maxIdx]));
      
      currentIds.push(maxIdx);
      
      // Check for end
      if (maxIdx === 199999 || maxIdx === 200020) {
        console.log('   🎯 Hit end token!');
        break;
      }
      
      // Update KV cache
      pastKeyValues = {};
      for (let i = 0; i < 32; i++) {
        pastKeyValues[`past_key_values.${i}.key`] = output[`present.${i}.key`];
        pastKeyValues[`past_key_values.${i}.value`] = output[`present.${i}.value`];
      }
    }
    
    // Decode final output
    const generatedIds = currentIds.slice(inputIds.length);
    console.log('\n🎯 Generated token IDs:', generatedIds);
    console.log('📝 Generated text:', tokenizer.decode(generatedIds));
    console.log('📝 Full text:', tokenizer.decode(currentIds));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDetailedGeneration();
