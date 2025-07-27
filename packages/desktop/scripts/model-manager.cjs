/**
 * Model Manager for Phi-4 ONNX
 * Downloads model on first use (not bundled due to 4GB size)
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { createWriteStream, existsSync } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// Use node-fetch if available, otherwise use built-in fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  fetch = global.fetch;
}

class ModelManager {
  constructor() {
    // Model will be downloaded to user's app data directory
    this.appPath = process.env.APPDATA || (process.platform == 'darwin' ? 
      path.join(process.env.HOME, 'Library', 'Application Support') : 
      path.join(process.env.HOME, '.local', 'share'));
    
    this.modelDir = path.join(this.appPath, 'guru', 'models', 'phi4-mini');
    this.modelPath = path.join(this.modelDir, 'model.onnx');
    this.modelDataPath = path.join(this.modelDir, 'model.onnx.data');
    this.tokenizerPath = path.join(this.modelDir, 'tokenizer.json');
    this.configPath = path.join(this.modelDir, 'config.json');
    this.genaiConfigPath = path.join(this.modelDir, 'genai_config.json');
    
    // Base URL for phi-4-mini-instruct-onnx CPU variant
    this.baseUrl = 'https://huggingface.co/microsoft/Phi-4-mini-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/';
    
    // Files to download
    this.filesToDownload = [
      { name: 'model.onnx', path: this.modelPath, size: '52.1 MB' },
      { name: 'model.onnx.data', path: this.modelDataPath, size: '4.86 GB' },
      { name: 'tokenizer.json', path: this.tokenizerPath, size: '15.5 MB' },
      { name: 'config.json', path: this.configPath, size: '2.5 KB' },
      { name: 'genai_config.json', path: this.genaiConfigPath, size: '1.52 KB' }
    ];
    
    // Download progress tracking
    this.downloadProgress = null;
    this.isDownloading = false;
  }

  async ensureModelExists() {
    console.log('🔍 Checking for Phi-4-mini model...');
    
    // Check if all required files exist
    const allFilesExist = await Promise.all(
      this.filesToDownload.map(file => this.checkFile(file.path))
    );
    
    if (allFilesExist.every(exists => exists)) {
      console.log('✅ Phi-4-mini model found');
      const stats = await fs.stat(this.modelDataPath);
      console.log(`   Model size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
      return { 
        modelPath: this.modelPath,
        modelDataPath: this.modelDataPath,
        tokenizerPath: this.tokenizerPath,
        configPath: this.configPath
      };
    }
    
    // Model not found - need to download
    if (this.isDownloading) {
      throw new Error('Model download already in progress. Please wait...');
    }
    
    console.log('📥 Phi-4-mini model not found. Need to download (~5GB)...');
    throw new Error('Phi-4-mini model not installed. Please download it first using the model installer.');
  }

  async checkFile(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async downloadModel(progressCallback) {
    if (this.isDownloading) {
      throw new Error('Download already in progress');
    }
    
    this.isDownloading = true;
    
    try {
      // Create model directory
      await fs.mkdir(this.modelDir, { recursive: true });
      
      console.log('📥 Downloading Phi-4-mini ONNX model files...');
      
      // Download all required files
      for (let i = 0; i < this.filesToDownload.length; i++) {
        const file = this.filesToDownload[i];
        const fileUrl = this.baseUrl + file.name;
        
        console.log(`📥 Downloading ${file.name} (${file.size})...`);
        console.log(`   URL: ${fileUrl}`);
        
        if (progressCallback) {
          progressCallback({ 
            stage: 'model', 
            progress: Math.round((i / this.filesToDownload.length) * 100),
            currentFile: file.name,
            fileSize: file.size
          });
        }
        
        try {
          await this.downloadFileWithProgress(fileUrl, file.path, (progress) => {
            if (progressCallback) {
              const overallProgress = Math.round(((i + progress.percent / 100) / this.filesToDownload.length) * 100);
              progressCallback({
                stage: 'model',
                progress: overallProgress,
                currentFile: file.name,
                downloaded: this.formatBytes(progress.downloaded),
                total: this.formatBytes(progress.total),
                speed: this.formatBytes(progress.speed) + '/s'
              });
            }
          });
          console.log(`✅ Downloaded ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to download ${file.name}:`, error.message);
          throw error;
        }
      }
      
      console.log('✅ Phi-4-mini model downloaded successfully');
      if (progressCallback) progressCallback({ stage: 'complete', progress: 100 });
      
    } finally {
      this.isDownloading = false;
    }
  }

  async downloadFileWithProgress(url, destination, onProgress) {
    // If fetch is available and works well with redirects
    if (fetch) {
      try {
        console.log(`Fetching ${url}...`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        const reader = response.body.getReader();
        const writer = createWriteStream(destination);
        
        let downloaded = 0;
        const startTime = Date.now();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            downloaded += value.length;
            writer.write(value);
            
            if (onProgress && contentLength > 0) {
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = downloaded / elapsed;
              const percent = (downloaded / contentLength) * 100;
              
              onProgress({
                downloaded,
                total: contentLength,
                percent: Math.round(percent),
                speed
              });
            }
          }
          
          writer.end();
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          return;
        } catch (error) {
          writer.destroy();
          throw error;
        }
      } catch (fetchError) {
        console.log('Fetch failed, falling back to https module:', fetchError.message);
      }
    }
    
    // Fallback to https module
    return new Promise((resolve, reject) => {
      const file = createWriteStream(destination);
      let downloaded = 0;
      let total = 0;
      let startTime = Date.now();
      
      const makeRequest = (requestUrl, redirectCount = 0) => {
        if (redirectCount > 10) {
          file.close();
          reject(new Error('Too many redirects'));
          return;
        }
        
        // Determine protocol
        const protocol = requestUrl.startsWith('https:') ? https : http;
        
        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        };
        
        protocol.get(requestUrl, options, (response) => {
          console.log(`Response status: ${response.statusCode}`);
          
          if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 307 || response.statusCode === 308) {
            // Handle redirect
            response.resume(); // Consume response data to free up memory
            const redirectUrl = response.headers.location;
            console.log(`Following redirect to: ${redirectUrl}`);
            return makeRequest(redirectUrl, redirectCount + 1);
          }
          
          if (response.statusCode !== 200) {
            file.close();
            reject(new Error(`Failed to download from ${requestUrl}: ${response.statusCode} - ${response.statusMessage}`));
            return;
          }
        
        total = parseInt(response.headers['content-length'], 10);
        
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = downloaded / elapsed;
          const percent = total > 0 ? (downloaded / total) * 100 : 0;
          
          if (onProgress) {
            onProgress({
              downloaded,
              total,
              percent: Math.round(percent),
              speed
            });
          }
        });
        
        response.on('end', () => {
          file.end();
          console.log(`Download complete: ${destination}`);
          resolve();
        });
        
        response.on('error', (err) => {
          file.close();
          reject(err);
        });
      }).on('error', reject);
      };
      
      makeRequest(url);
    });
  }
  
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  async getModelInfo() {
    const exists = await this.checkFile(this.modelPath);
    if (exists) {
      const stats = await fs.stat(this.modelPath);
      return {
        exists: true,
        path: this.modelPath,
        size: stats.size,
        lastModified: stats.mtime
      };
    }
    return { exists: false };
  }
}

module.exports = { ModelManager };