/**
 * Bundle Phi-4 Model Script
 * Copies the model files into the app bundle during build
 */

const fs = require('fs-extra');
const path = require('path');

async function bundleModel() {
  console.log('📦 Bundling Phi-4 model with app...');
  
  const modelSource = path.join(__dirname, '../../models/phi4-mini');
  const destinations = [
    // For development
    path.join(__dirname, '../models/phi4-mini'),
    // For Tauri builds - will be included in resources
    path.join(__dirname, '../src-tauri/resources/models/phi4-mini'),
    // For distribution
    path.join(__dirname, '../dist/models/phi4-mini')
  ];
  
  for (const dest of destinations) {
    try {
      await fs.ensureDir(dest);
      
      // Copy model files if they exist
      const modelFile = path.join(modelSource, 'model.onnx');
      const tokenizerFile = path.join(modelSource, 'tokenizer.json');
      
      if (await fs.pathExists(modelFile)) {
        await fs.copy(modelFile, path.join(dest, 'model.onnx'));
        console.log(`✅ Copied model to ${dest}`);
      } else {
        console.log(`⚠️ Model file not found at ${modelFile}`);
      }
      
      if (await fs.pathExists(tokenizerFile)) {
        await fs.copy(tokenizerFile, path.join(dest, 'tokenizer.json'));
        console.log(`✅ Copied tokenizer to ${dest}`);
      } else {
        console.log(`⚠️ Tokenizer file not found at ${tokenizerFile}`);
      }
    } catch (error) {
      console.warn(`Failed to copy to ${dest}:`, error.message);
    }
  }
  
  console.log('✅ Model bundling complete');
}

// Run if called directly
if (require.main === module) {
  bundleModel().catch(console.error);
}

module.exports = { bundleModel };