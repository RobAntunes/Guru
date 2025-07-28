#!/usr/bin/env node

const ort = require('onnxruntime-node');
const { ModelManager } = require('./model-manager.cjs');

async function benchmarkPhi4() {
  console.log('🏃 Benchmarking Phi-4 Performance...\n');
  
  try {
    const modelManager = new ModelManager();
    const { modelPath } = await modelManager.ensureModelExists();
    
    console.log('🔧 Loading model...');
    const loadStart = Date.now();
    
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      interOpNumThreads: 4,
      intraOpNumThreads: 4,
      graphOptimizationLevel: 'all',
      logSeverityLevel: 3
    });
    
    const loadTime = (Date.now() - loadStart) / 1000;
    console.log(`✅ Model loaded in ${loadTime.toFixed(1)} seconds\n`);
    
    // Test a single forward pass
    console.log('🧪 Testing single inference...');
    
    const batchSize = 1;
    const seqLength = 100; // Reasonable prompt length
    
    // Create test inputs
    const feeds = {
      input_ids: new ort.Tensor('int64',
        new BigInt64Array(seqLength).fill(100n),
        [batchSize, seqLength]
      ),
      attention_mask: new ort.Tensor('int64',
        new BigInt64Array(seqLength).fill(1n),
        [batchSize, seqLength]
      )
    };
    
    // Add empty KV cache
    for (let i = 0; i < 32; i++) {
      feeds[`past_key_values.${i}.key`] = new ort.Tensor('float32',
        new Float32Array(0), [batchSize, 8, 0, 128]);
      feeds[`past_key_values.${i}.value`] = new ort.Tensor('float32',
        new Float32Array(0), [batchSize, 8, 0, 128]);
    }
    
    // Time single inference
    const inferStart = Date.now();
    const output = await session.run(feeds);
    const inferTime = (Date.now() - inferStart) / 1000;
    
    console.log(`✅ Single inference took ${inferTime.toFixed(2)} seconds`);
    console.log(`⚡ That's ${(1/inferTime).toFixed(1)} inferences/second\n`);
    
    // Estimate token generation time
    const tokensToGenerate = 500;
    const estimatedTime = tokensToGenerate * inferTime;
    console.log(`📈 Estimated time for ${tokensToGenerate} tokens: ${estimatedTime.toFixed(0)} seconds (${(estimatedTime/60).toFixed(1)} minutes)`);
    
    // Check CPU info
    console.log('\n💻 System info:');
    console.log('   CPU cores:', require('os').cpus().length);
    console.log('   CPU model:', require('os').cpus()[0].model);
    console.log('   Total memory:', (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(1) + ' GB');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  }
}

benchmarkPhi4();
