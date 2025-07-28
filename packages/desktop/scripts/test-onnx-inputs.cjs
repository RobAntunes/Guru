#!/usr/bin/env node

const ort = require('onnxruntime-node');
const path = require('path');
const { ModelManager } = require('./model-manager.cjs');

async function testOnnxInputs() {
  console.log('🔍 Testing ONNX Model Inputs...\n');
  
  try {
    // Get model path
    const modelManager = new ModelManager();
    const { modelPath } = await modelManager.ensureModelExists();
    
    console.log('📂 Model path:', modelPath);
    
    // Create inference session
    console.log('\n🔧 Loading ONNX model...');
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      logSeverityLevel: 3
    });
    
    console.log('\n✅ Model loaded successfully!');
    console.log('\n📊 Model Input Names:');
    session.inputNames.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
    
    console.log('\n📊 Model Output Names:');
    session.outputNames.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
    
    // Try to run a minimal inference
    console.log('\n🧪 Testing minimal inference...');
    
    // Create minimal inputs
    const batchSize = 1;
    const seqLength = 5;
    
    const feeds = {
      input_ids: new ort.Tensor('int64', 
        new BigInt64Array([1n, 2n, 3n, 4n, 5n]), 
        [batchSize, seqLength]
      ),
      attention_mask: new ort.Tensor('int64',
        new BigInt64Array([1n, 1n, 1n, 1n, 1n]),
        [batchSize, seqLength]
      )
    };
    
    // Add empty KV cache based on config.json
    const numLayers = 32;
    const numHeads = 8; // num_key_value_heads from config
    const headDim = 128; // hidden_size / num_attention_heads = 3072 / 24 = 128
    
    console.log('\n📐 KV Cache dimensions:');
    console.log(`   Layers: ${numLayers}`);
    console.log(`   KV Heads: ${numHeads}`);
    console.log(`   Head Dim: ${headDim}`);
    
    for (let i = 0; i < numLayers; i++) {
      feeds[`past_key_values.${i}.key`] = new ort.Tensor('float32', 
        new Float32Array(0), [batchSize, numHeads, 0, headDim]);
      feeds[`past_key_values.${i}.value`] = new ort.Tensor('float32', 
        new Float32Array(0), [batchSize, numHeads, 0, headDim]);
    }
    
    console.log('\n🚀 Running inference...');
    const output = await session.run(feeds);
    
    console.log('\n✅ Inference successful!');
    console.log('\n📊 Output shapes:');
    Object.entries(output).forEach(([name, tensor]) => {
      if (tensor.dims) {
        console.log(`   ${name}: [${tensor.dims.join(', ')}]`);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testOnnxInputs();
