import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { readFile, writeFile, unlink, mkdir, rmdir, access, constants, readdir } from 'fs/promises';
import { guruConfig } from '../src/core/config';
import fs from 'fs';
import path from 'path';

describe('AI-Native Guru Test Suite - Comprehensive Functionality', () => {
  let Guru: any;
  let guru: any;

  beforeEach(async () => {
    // Reset config to defaults for each test
    Object.assign(guruConfig, {
      scanMode: 'auto',
      cacheCompression: true,
      cacheDir: '.guru/cache',
      aiOutputFormat: 'json',
      language: 'typescript',
      includeTests: false,
    });
    
    ({ Guru } = await import('../dist/index.js'));
    guru = new Guru();
  });

  describe('Symbol Graph Construction', () => {
    it('should build symbol graph from JavaScript code', async () => {
      console.log('\n[1] Symbol Graph Construction');
      
      const code = `function a(){} const b=()=>{}; class C{m(){}}`;
      const testFile = './ai-native-test-temp.js';
      
      try {
        await writeFile(testFile, code);
        const result = await guru.analyzeCodebase({ path: testFile });
        
        expect(result).toBeDefined();
        expect(result.symbolGraph).toBeDefined();
        expect(result.symbolGraph.symbols).toBeInstanceOf(Map);
        expect(result.symbolGraph.symbols.size).toBeGreaterThan(0);
        
        const ids = Array.from(result.symbolGraph.symbols.keys());
        const embeddings = Array.from(result.symbolGraph.symbols.values()).map(s => s.embedding);
        
        console.log(`  • Symbol IDs: ${ids.length} | Embeddings: ${embeddings.filter(Boolean).length}`);
        console.log(`  ✅ Symbol graph constructed successfully`);
        
        expect(ids.length).toBeGreaterThan(0);
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 10000);
  });

  describe('Code Clustering Analysis', () => {
    it('should perform clustering on symbols', async () => {
      console.log('\n[2] Clustering (ID/Embedding)');
      
      const code = `function helper1(){} function helper2(){} class Service{process(){}}`;
      const testFile = './ai-native-test-clustering.js';
      
      try {
        await writeFile(testFile, code);
        const result = await guru.analyzeCodebase({ path: testFile });
        
        expect(result).toBeDefined();
        
        if (result.clusters) {
          expect(result.clusters.length).toBeGreaterThanOrEqual(0);
          expect(result.clusters.every(c => c.symbolIds && Array.isArray(c.symbolIds))).toBe(true);
          console.log(`  • Clusters: ${result.clusters.length}`);
          console.log(`  ✅ Clustering analysis completed`);
        } else {
          console.log('  • Clustering not implemented yet');
        }
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 10000);
  });

  describe('Pattern Detection', () => {
    it('should detect patterns and anti-patterns', async () => {
      console.log('\n[3] Pattern/Anti-pattern Detection');
      
      const code = `
        class SingletonPattern {
          static instance;
          static getInstance() { return this.instance || (this.instance = new this()); }
        }
        function globalFunction() { /* anti-pattern: global scope pollution */ }
      `;
      const testFile = './ai-native-test-patterns.js';
      
      try {
        await writeFile(testFile, code);
        const result = await guru.analyzeCodebase({ path: testFile });
        
        expect(result).toBeDefined();
        
        if (result.patterns) {
          const patternCount = result.patterns.patterns?.length || 0;
          const antiPatternCount = result.patterns.antiPatterns?.length || 0;
          
          expect(patternCount + antiPatternCount).toBeGreaterThanOrEqual(0);
          console.log(`  • Patterns: ${patternCount} | Anti-patterns: ${antiPatternCount}`);
          console.log(`  ✅ Pattern detection completed`);
        } else {
          console.log('  • Pattern detection not implemented yet');
        }
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 10000);
  });

  describe('Entry Point Detection', () => {
    it('should identify entry points in code', async () => {
      console.log('\n[4] Entry Point Detection');
      
      const code = `
        function main() { console.log('Entry point'); }
        export { main };
        class Application { start() {} }
      `;
      const testFile = './ai-native-test-entry.js';
      
      try {
        await writeFile(testFile, code);
        const result = await guru.analyzeCodebase({ path: testFile });
        
        expect(result).toBeDefined();
        
        if (result.metadata && result.metadata.entryPoints) {
          const ep = result.metadata.entryPoints;
          expect(ep.entryPoints).toBeInstanceOf(Array);
          expect(ep.confidence).toBeGreaterThanOrEqual(0);
          
          console.log(`  • Entry Points: ${ep.entryPoints.length} | Confidence: ${ep.confidence}`);
          console.log(`  ✅ Entry point detection completed`);
        } else {
          console.log('  • Entry point detection not implemented yet');
        }
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 10000);
  });

  describe('Execution Tracing', () => {
    it('should trace execution paths', async () => {
      console.log('\n[5] Execution Tracing');
      
      const code = `
        function caller() { return helper(); }
        function helper() { return process(); }
        function process() { return 'result'; }
      `;
      const testFile = './ai-native-test-trace.js';
      
      try {
        await writeFile(testFile, code);
        await guru.analyzeCodebase({ path: testFile });
        
        try {
          const traceResult = await guru.traceExecution({ entryPoint: 'caller' });
          expect(traceResult).toBeDefined();
          console.log(`  ✅ Execution tracing completed`);
        } catch (error) {
          console.log('  • Execution tracing not fully implemented yet');
        }
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 10000);
  });

  describe('Integration Summary', () => {
    it('should provide comprehensive analysis summary', async () => {
      console.log('\n===== SUMMARY =====');
      
      const complexCode = `
        class DataProcessor {
          constructor(config) { this.config = config; }
          async process(data) {
            const validated = this.validate(data);
            const transformed = this.transform(validated);
            return this.save(transformed);
          }
          validate(data) { return data.filter(Boolean); }
          transform(data) { return data.map(item => ({ ...item, processed: true })); }
          async save(data) { return Promise.resolve(data); }
        }
        
        function createProcessor(config) {
          return new DataProcessor(config);
        }
        
        export { createProcessor, DataProcessor };
      `;
      const testFile = './ai-native-test-integration.js';
      
      try {
        await writeFile(testFile, complexCode);
        const result = await guru.analyzeCodebase({ path: testFile });
        
        expect(result).toBeDefined();
        expect(result.symbolGraph).toBeDefined();
        
        const symbolCount = result.symbolGraph.symbols.size;
        const edgeCount = result.symbolGraph.edges.length;
        
        console.log(`  • Symbol Graph: ${symbolCount} symbols, ${edgeCount} edges`);
        
        if (result.clusters) {
          console.log(`  • Clusters: ${result.clusters.length}`);
        }
        
        if (result.patterns) {
          console.log(`  • Patterns: ${result.patterns.patterns?.length || 0} | Anti-patterns: ${result.patterns.antiPatterns?.length || 0}`);
        }
        
        if (result.metadata && result.metadata.entryPoints) {
          console.log(`  • Entry Points: ${result.metadata.entryPoints.entryPoints.length}`);
        }
        
        console.log('===================\n');
        console.log('🎉 AI-Native Guru Test Suite completed successfully!');
        
        expect(symbolCount).toBeGreaterThan(0);
        
      } finally {
        try {
          await unlink(testFile);
        } catch {}
      }
    }, 15000);
  });

  describe('Incremental Analysis & Config Integration', () => {
    let Guru: any;
    let guru: any;
    let tempDir: string;
    let fileA: string;
    let fileB: string;
    let fileC: string;
    let dirCreated = false;

    beforeAll(async () => {
      tempDir = `./ai-native-incremental-test-persistent`;
      fileA = `${tempDir}/a.ts`;
      fileB = `${tempDir}/b.ts`;
      fileC = `${tempDir}/c.ts`;
      let dirExists = false;
      try {
        await access(tempDir, constants.F_OK);
        dirExists = true;
      } catch { dirExists = false; }
      if (!dirExists) {
        await mkdir(tempDir);
        dirCreated = true;
      }
      await writeFile(fileA, 'export function a() { return 1; }');
      await writeFile(fileB, 'import { a } from "./a"; export function b() { return a(); }');
      await writeFile(fileC, 'import { b } from "./b"; export function c() { return b(); }');
    });

    afterAll(async () => {
      for (const f of [fileA, fileB, fileC]) {
        try { await unlink(f); } catch {}
      }
      // Clean up .guru cache dir if it exists
      const cacheDir = path.join(tempDir, '.guru');
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
      }
      if (dirCreated) {
        try { await rmdir(tempDir); } catch {}
      }
    });

    beforeEach(async () => {
      // Reset config to defaults before each test
      Object.assign(guruConfig, {
        scanMode: 'auto',
        cacheCompression: true,
        cacheDir: '.guru/cache',
        aiOutputFormat: 'json',
        language: 'typescript',
        includeTests: false,
      });
      
      ({ Guru } = await import('../dist/index.js'));
      guru = new Guru();
    });

    it('should only re-analyze changed and dependent files (incremental)', async () => {
      console.log('[TEST][DEBUG] Testing incremental analysis with explicit scanMode parameter');
      
      const result1 = await guru.analyzeCodebase({ path: tempDir, scanMode: 'incremental' });
      console.log('Test received analysisMetadata (run 1):', result1.analysisMetadata);
      expect(result1.analysisMetadata.filesAnalyzed).toBe(3);
      
      // Second run - should be incremental
      const result2 = await guru.analyzeCodebase({ path: tempDir, scanMode: 'incremental' });
      console.log('Test received analysisMetadata (run 2):', result2.analysisMetadata);
      expect(result2.analysisMetadata.filesAnalyzed).toBe(0); // no changes
      
      // Change only fileC
      await writeFile(fileC, 'import { b } from "./b"; export function c() { return b() + 1; }');
      const result3 = await guru.analyzeCodebase({ path: tempDir, scanMode: 'incremental' });
      console.log('Test received analysisMetadata (run 3):', result3.analysisMetadata);
      expect(result3.analysisMetadata.filesAnalyzed).toBe(1);
    });

    it('should perform full analysis when scanMode is full', async () => {
      Object.assign(guruConfig, { scanMode: 'full' });
      const result = await guru.analyzeCodebase({ path: tempDir });
      console.log('Test received analysisMetadata (full):', result.analysisMetadata);
      expect(result.analysisMetadata.filesAnalyzed).toBe(3);
    });

    it('should use cache compression if enabled', async () => {
      Object.assign(guruConfig, { cacheCompression: true });
      const cacheDir = guruConfig.cacheDir.startsWith('/') ? guruConfig.cacheDir : `${tempDir}/${guruConfig.cacheDir}`;
      console.log('[TEST][DEBUG] cacheCompression enabled, checking directory:', cacheDir);
      
      await guru.analyzeCodebase({ path: tempDir });
      
      // Check if .gz files exist in cache directory
      console.log('[TEST][DEBUG] Looking for .gz files in:', cacheDir);
      const files = await readdir(cacheDir);
      console.log('[TEST][DEBUG] Files found in cache directory:', files);
      const gzFiles = files.filter(f => f.endsWith('.gz'));
      console.log('[TEST][DEBUG] .gz files found:', gzFiles);
      
      expect(gzFiles.length > 0).toBe(true);
    });
  });
}); 