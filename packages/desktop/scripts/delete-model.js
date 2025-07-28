#!/usr/bin/env node
/**
 * Script to delete the downloaded model files for testing
 */

const fs = require('fs').promises;
const path = require('path');

async function deleteModel() {
  const appPath = process.env.APPDATA || (process.platform == 'darwin' ? 
    path.join(process.env.HOME, 'Library', 'Application Support') : 
    path.join(process.env.HOME, '.local', 'share'));
  
  const modelDir = path.join(appPath, 'guru', 'models', 'phi4-mini');
  
  console.log('🗑️  Deleting model directory:', modelDir);
  
  try {
    // Check if directory exists
    await fs.access(modelDir);
    
    // Delete the directory and all its contents
    await fs.rm(modelDir, { recursive: true, force: true });
    
    console.log('✅ Model files deleted successfully!');
    console.log('You can now restart the app to test the download again.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ Model directory does not exist:', modelDir);
    } else {
      console.error('❌ Error deleting model:', error.message);
    }
  }
}

deleteModel();