#!/usr/bin/env node
/**
 * Script to check the downloaded model files
 */

const fs = require('fs').promises;
const path = require('path');

async function checkModelFiles() {
  const appPath = process.env.APPDATA || (process.platform == 'darwin' ? 
    path.join(process.env.HOME, 'Library', 'Application Support') : 
    path.join(process.env.HOME, '.local', 'share'));
  
  const modelDir = path.join(appPath, 'guru', 'models', 'phi4-mini');
  
  console.log('📁 Checking model directory:', modelDir);
  
  try {
    // Check if directory exists
    await fs.access(modelDir);
    console.log('✅ Model directory exists');
    
    // List all files
    const files = await fs.readdir(modelDir);
    console.log('\n📄 Files in directory:');
    
    for (const file of files) {
      const filePath = path.join(modelDir, file);
      const stats = await fs.stat(filePath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ${file}: ${sizeInMB} MB`);
    }
    
    // Check specific files
    const expectedFiles = [
      { name: 'model.onnx', expectedSize: 52.1 },
      { name: 'model.onnx.data', expectedSize: 4860 },
      { name: 'tokenizer.json', expectedSize: 15.5 },
      { name: 'config.json', expectedSize: 0.0025 },
      { name: 'genai_config.json', expectedSize: 0.0015 }
    ];
    
    console.log('\n🔍 Checking expected files:');
    for (const expected of expectedFiles) {
      try {
        const filePath = path.join(modelDir, expected.name);
        const stats = await fs.stat(filePath);
        const sizeInMB = stats.size / 1024 / 1024;
        const status = Math.abs(sizeInMB - expected.expectedSize) < expected.expectedSize * 0.1 ? '✅' : '⚠️';
        console.log(`   ${status} ${expected.name}: ${sizeInMB.toFixed(2)} MB (expected ~${expected.expectedSize} MB)`);
      } catch (error) {
        console.log(`   ❌ ${expected.name}: Missing`);
      }
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ Model directory does not exist:', modelDir);
    } else {
      console.error('❌ Error checking model:', error.message);
    }
  }
}

checkModelFiles();