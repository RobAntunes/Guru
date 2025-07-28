#!/usr/bin/env node
/**
 * Post-install script to download Phi-4 model
 * Runs after app installation to download the 4GB model
 */

const { ModelManager } = require('./model-manager.cjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function downloadModelWithProgress() {
  const modelManager = new ModelManager();
  
  console.log('\n🤖 Guru Desktop - Model Installation');
  console.log('====================================');
  console.log('The Phi-4 analysis model needs to be downloaded for project analysis.');
  console.log('This is a one-time download of approximately 4GB.\n');
  
  // Check if model already exists
  try {
    await modelManager.ensureModelExists();
    console.log('✅ Model already installed!');
    process.exit(0);
  } catch (error) {
    // Model doesn't exist, continue with download
  }
  
  // Ask user if they want to download now
  const answer = await new Promise(resolve => {
    rl.question('Download model now? (y/n): ', resolve);
  });
  
  if (answer.toLowerCase() !== 'y') {
    console.log('\n⚠️  Model download skipped.');
    console.log('You can download the model later from the app when needed.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n📥 Starting model download...\n');
  
  let lastProgress = -1;
  try {
    await modelManager.downloadModel((progress) => {
      // Update progress bar
      if (progress.progress !== lastProgress) {
        lastProgress = progress.progress;
        const bar = createProgressBar(progress.progress);
        const status = progress.stage === 'model' ? 'Model' : 'Tokenizer';
        
        process.stdout.write(`\r${status}: ${bar} ${progress.progress}%`);
        
        if (progress.speed) {
          process.stdout.write(` - ${progress.downloaded}/${progress.total} at ${progress.speed}`);
        }
      }
      
      if (progress.stage === 'complete') {
        console.log('\n\n✅ Model installation complete!');
      }
    });
  } catch (error) {
    console.error('\n\n❌ Model download failed:', error.message);
    console.log('You can retry the download later from the app.');
    process.exit(1);
  }
  
  rl.close();
  process.exit(0);
}

function createProgressBar(percent) {
  const width = 40;
  const filled = Math.round((width * percent) / 100);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Installation error:', error.message);
  process.exit(1);
});

// Run the installer
downloadModelWithProgress();