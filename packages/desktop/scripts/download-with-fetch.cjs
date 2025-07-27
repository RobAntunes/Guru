#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

async function downloadFile(url, destination) {
  console.log(`Downloading ${url} to ${destination}`);
  
  try {
    // Use node's built-in fetch (Node 18+) or fallback to https
    if (global.fetch) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(destination, Buffer.from(buffer));
      
      const stats = await fs.promises.stat(destination);
      console.log(`Downloaded ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      // Fallback for older Node versions
      const https = require('https');
      const file = fs.createWriteStream(destination);
      
      return new Promise((resolve, reject) => {
        const makeRequest = (url) => {
          https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
              file.close();
              fs.unlinkSync(destination);
              return makeRequest(response.headers.location);
            }
            
            if (response.statusCode !== 200) {
              file.close();
              fs.unlinkSync(destination);
              reject(new Error(`HTTP ${response.statusCode}`));
              return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
              file.close(resolve);
            });
          }).on('error', (err) => {
            file.close();
            fs.unlinkSync(destination);
            reject(err);
          });
        };
        
        makeRequest(url);
      });
    }
  } catch (error) {
    console.error(`Failed to download: ${error.message}`);
    throw error;
  }
}

// Test download
async function test() {
  const testUrl = 'https://huggingface.co/microsoft/Phi-4-mini-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/config.json';
  const testDest = path.join(__dirname, 'test-config.json');
  
  try {
    await downloadFile(testUrl, testDest);
    const content = await fs.promises.readFile(testDest, 'utf8');
    console.log('File content preview:', content.substring(0, 200) + '...');
    await fs.promises.unlink(testDest);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();