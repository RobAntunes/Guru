#!/usr/bin/env node
/**
 * Model downloader script for UI-triggered downloads
 * Streams progress updates to stdout for Tauri to capture
 */

const { ModelManager } = require('./model-manager.cjs');

async function downloadWithProgress() {
  const modelManager = new ModelManager();
  
  try {
    await modelManager.downloadModel((progress) => {
      // Output progress as JSON for Tauri to parse
      process.stdout.write(JSON.stringify(progress) + '\n');
    });
    
    // Send completion
    process.stdout.write(JSON.stringify({ 
      stage: 'complete', 
      progress: 100 
    }) + '\n');
    
    process.exit(0);
  } catch (error) {
    // Send error
    process.stdout.write(JSON.stringify({ 
      stage: 'error', 
      progress: 0, 
      error: error.message 
    }) + '\n');
    
    process.exit(1);
  }
}

// Run the downloader
downloadWithProgress();