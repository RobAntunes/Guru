/**
 * Harmonic Analysis Stream Processor
 * Efficiently processes large harmonic analysis outputs into the data lake
 */

import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as readline from 'readline';
import { HarmonicDataLake } from './harmonic-data-lake.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface StreamProcessorOptions {
  batchSize?: number;
  flushInterval?: number; // ms
  parseMode?: 'json' | 'ndjson' | 'cli-output';
}

export class HarmonicStreamProcessor {
  private dataLake: HarmonicDataLake;
  private options: Required<StreamProcessorOptions>;
  private currentBatch: any[] = [];
  private flushTimer?: NodeJS.Timeout;
  private processedCount = 0;
  private errorCount = 0;

  constructor(dataLake: HarmonicDataLake, options: StreamProcessorOptions = {}) {
    this.dataLake = dataLake;
    this.options = {
      batchSize: options.batchSize || 1000,
      flushInterval: options.flushInterval || 5000,
      parseMode: options.parseMode || 'json'
    };
  }

  /**
   * Process harmonic analysis from a stream
   */
  async processStream(
    input: Readable,
    metadata: {
      codebasePath: string;
      analysisVersion: string;
    }
  ): Promise<{
    processedCount: number;
    errorCount: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const analysisId = uuidv4();
    const codebaseHash = await this.hashCodebase(metadata.codebasePath);

    console.log('🌊 Starting harmonic stream processing...');
    console.log(`   Analysis ID: ${analysisId}`);
    console.log(`   Codebase: ${metadata.codebasePath}`);
    console.log(`   Batch size: ${this.options.batchSize}`);

    // Reset counters
    this.processedCount = 0;
    this.errorCount = 0;

    // Create transform stream based on parse mode
    const parser = this.createParser();
    
    // Create batch processor
    const batcher = new Transform({
      objectMode: true,
      transform: async (pattern, encoding, callback) => {
        try {
          this.currentBatch.push(pattern);
          this.processedCount++;

          // Flush if batch is full
          if (this.currentBatch.length >= this.options.batchSize) {
            await this.flushBatch(analysisId, codebaseHash, metadata.analysisVersion);
          }

          // Progress update
          if (this.processedCount % 10000 === 0) {
            console.log(`   Processed ${this.processedCount.toLocaleString()} patterns...`);
          }

          callback();
        } catch (error) {
          this.errorCount++;
          console.error('Error processing pattern:', error);
          callback(); // Continue processing
        }
      },
      flush: async (callback) => {
        // Final flush
        if (this.currentBatch.length > 0) {
          await this.flushBatch(analysisId, codebaseHash, metadata.analysisVersion);
        }
        callback();
      }
    });

    // Set up flush timer
    this.startFlushTimer(analysisId, codebaseHash, metadata.analysisVersion);

    try {
      // Process the stream
      await pipeline(input, parser, batcher);
    } finally {
      // Clean up timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log('\n✅ Stream processing complete:');
    console.log(`   Total patterns: ${this.processedCount.toLocaleString()}`);
    console.log(`   Errors: ${this.errorCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   Rate: ${(this.processedCount / (duration / 1000)).toFixed(0)} patterns/sec`);

    return {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      duration
    };
  }

  /**
   * Process a file containing harmonic analysis results
   */
  async processFile(
    filePath: string,
    metadata: {
      codebasePath: string;
      analysisVersion: string;
    }
  ): Promise<any> {
    const { createReadStream } = await import('fs');
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    return this.processStream(stream, metadata);
  }

  /**
   * Process CLI output (like from harmonic-cli analyze)
   */
  async processCLIOutput(
    command: string[],
    metadata: {
      codebasePath: string;
      analysisVersion: string;
    }
  ): Promise<any> {
    const { spawn } = await import('child_process');
    
    console.log(`🚀 Running command: ${command.join(' ')}`);
    
    const child = spawn(command[0], command.slice(1), {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle errors
    child.on('error', (error) => {
      console.error('Failed to start process:', error);
    });

    child.stderr.on('data', (data) => {
      console.error('Process stderr:', data.toString());
    });

    return this.processStream(child.stdout, metadata);
  }

  // Private methods

  private createParser(): Transform {
    switch (this.options.parseMode) {
      case 'ndjson':
        return this.createNDJSONParser();
      case 'cli-output':
        return this.createCLIOutputParser();
      case 'json':
      default:
        return this.createJSONParser();
    }
  }

  private createJSONParser(): Transform {
    let buffer = '';
    let inPatterns = false;
    let depth = 0;

    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, encoding, callback) {
        buffer += chunk.toString();
        
        // Simple JSON streaming parser for patterns object
        // In production, use a proper streaming JSON parser
        try {
          // Look for patterns section
          if (!inPatterns && buffer.includes('"patterns"')) {
            inPatterns = true;
            buffer = buffer.substring(buffer.indexOf('"patterns"'));
          }

          if (inPatterns) {
            // Extract complete pattern objects
            const patterns = this.extractPatterns(buffer);
            for (const pattern of patterns) {
              this.push(pattern);
            }
          }
        } catch (error) {
          console.error('JSON parse error:', error);
        }

        callback();
      },

      extractPatterns(text: string): any[] {
        const patterns: any[] = [];
        // Simplified pattern extraction - in production use proper JSON streaming
        const patternRegex = /"([^"]+)":\s*\{[^}]+\}/g;
        let match;
        
        while ((match = patternRegex.exec(text)) !== null) {
          try {
            const patternObj = JSON.parse(`{${match[0]}}`);
            const key = Object.keys(patternObj)[0];
            patterns.push({
              id: key,
              ...patternObj[key]
            });
          } catch (e) {
            // Skip malformed patterns
          }
        }
        
        return patterns;
      }
    });
  }

  private createNDJSONParser(): Transform {
    const rl = readline.createInterface({
      input: new Readable({ read() {} }),
      crlfDelay: Infinity
    });

    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, encoding, callback) {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const pattern = JSON.parse(line);
              this.push(pattern);
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
        
        callback();
      }
    });
  }

  private createCLIOutputParser(): Transform {
    let buffer = '';
    let capturing = false;

    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, encoding, callback) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        
        // Keep last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Detect start of JSON output
          if (line.trim() === '{' || line.includes('"patterns"')) {
            capturing = true;
          }

          if (capturing) {
            // Parse JSON lines
            try {
              const cleaned = line.trim();
              if (cleaned.startsWith('"') && cleaned.includes('": {')) {
                // Extract pattern from line like: "file:symbol:line": { ... }
                const match = cleaned.match(/"([^"]+)":\s*(\{[^}]+\})/);
                if (match) {
                  const pattern = JSON.parse(match[2]);
                  pattern.id = match[1];
                  this.push(pattern);
                }
              }
            } catch (e) {
              // Skip malformed lines
            }
          }
        }

        callback();
      }
    });
  }

  private async flushBatch(
    analysisId: string,
    codebaseHash: string,
    version: string
  ): Promise<void> {
    if (this.currentBatch.length === 0) return;

    console.log(`   💾 Flushing batch of ${this.currentBatch.length} patterns...`);

    try {
      await this.dataLake.storePatternBatch(
        this.currentBatch,
        {
          analysisId,
          codebaseHash,
          version
        }
      );
      
      this.currentBatch = [];
    } catch (error) {
      console.error('Failed to flush batch:', error);
      this.errorCount += this.currentBatch.length;
      this.currentBatch = [];
    }
  }

  private startFlushTimer(
    analysisId: string,
    codebaseHash: string,
    version: string
  ): void {
    this.flushTimer = setInterval(async () => {
      if (this.currentBatch.length > 0) {
        await this.flushBatch(analysisId, codebaseHash, version);
      }
    }, this.options.flushInterval);
  }

  private async hashCodebase(codebasePath: string): Promise<string> {
    // Simple hash based on path and timestamp
    // In production, could hash actual file contents
    const hash = crypto.createHash('sha256');
    hash.update(codebasePath);
    hash.update(new Date().toISOString());
    return hash.digest('hex').substring(0, 16);
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const dataLake = new HarmonicDataLake();
    await dataLake.initialize();

    const processor = new HarmonicStreamProcessor(dataLake, {
      batchSize: 1000,
      parseMode: 'cli-output'
    });

    // Process harmonic analysis output
    const result = await processor.processCLIOutput(
      ['npx', 'tsx', 'src/index.ts', 'analyze', '--path', 'src/'],
      {
        codebasePath: 'src/',
        analysisVersion: '1.0.0'
      }
    );

    console.log('\nAnalysis complete:', result);

    // Query some patterns
    console.log('\n📊 Sample queries:');
    
    const hotspots = await dataLake.findHotspots();
    console.log('\nTop pattern hotspots:');
    hotspots.forEach(h => {
      console.log(`  ${h.file_path}: ${h.unique_patterns} patterns, ${h.avg_score.toFixed(3)} avg score`);
    });

    const stats = await dataLake.getPatternStats();
    console.log('\nPattern statistics:');
    stats.slice(0, 10).forEach((s: any) => {
      console.log(`  ${s.category}/${s.pattern_type}: ${s.count} occurrences, ${s.median.toFixed(3)} median score`);
    });
  }

  main().catch(console.error);
}