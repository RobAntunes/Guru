#!/usr/bin/env node
/**
 * Test script to verify model download works
 */

const { ModelManager } = require('./model-manager.cjs');

async function testDownload() {
  const modelManager = new ModelManager();
  
  console.log('Starting test download...');
  
  try {
    await modelManager.downloadModel((progress) => {
      console.log('Progress:', JSON.stringify(progress));
    });
    
    console.log('Download completed successfully!');
  } catch (error) {
    console.error('Download failed:', error.message);
    console.error(error.stack);
  }
}

testDownload();