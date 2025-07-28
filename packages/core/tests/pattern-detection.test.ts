/**
 * @fileoverview Tests for the AI-native pattern detection system.
 *
 * This test suite validates that the full pipeline (SymbolGraph -> Profile Analysis -> Pattern Detection)
 * correctly identifies recurring, profile-based interaction patterns.
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Guru } from '../dist/index.js';
import { GuruDatabase } from '../dist/core/database.js';
import * as path from 'path';
import * as fs from 'fs';

describe('AI-Native Profile-Based Pattern Detection', () => {
  let guru: Guru;
  let db: GuruDatabase;
  const dbPath = path.resolve(__dirname, './test.db');

  beforeEach(async () => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    guru = new Guru(true);
    db = new GuruDatabase({ path: dbPath });
    (guru as any).incrementalAnalyzer = {
      getDatabase: () => db,
      cleanup: async () => { /* do nothing for mock */ },
      initialize: async () => { /* do nothing for mock */ },
      getAllSourceFiles: async () => [],
      detectChanges: async () => ({ changedFiles: [], newFiles: [], deletedFiles: [], affectedFiles: [], analysisRequired: false }),
      analyzeFilesParallel: async () => [],
      saveCheckpoint: async () => {},
      loadCheckpoint: async () => null,
    }; // Mock for testing
    await guru.preloadComponents();
  });

  afterEach(async () => {
    try {
      console.log('[CLEANUP][afterEach] Calling guru.cleanup()');
      await guru.cleanup();
      console.log('[CLEANUP][afterEach] guru.cleanup() complete');
    } catch (e) {
      console.error('[CLEANUP][afterEach] guru.cleanup() error', e);
    }
    try {
      db.close();
      console.log('[CLEANUP][afterEach] db.close() complete');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`[CLEANUP][afterEach] Deleted temp DB: ${dbPath}`);
      }
    } catch (e) {
      console.error('[CLEANUP][afterEach] DB/file cleanup error', e);
    }
  });

  afterAll(async () => {
    try {
      console.log('[CLEANUP][afterAll] Calling guru.cleanup()');
      await guru.cleanup();
      console.log('[CLEANUP][afterAll] guru.cleanup() complete');
    } catch (e) {
      console.error('[CLEANUP][afterAll] guru.cleanup() error', e);
    }
    // TEMP: Uncomment to force exit if hangs persist
    // process.exit(0);
  });

  it.skip('should identify recurring interaction patterns based on symbol profiles', async () => {
    // 1. Construct a test symbol graph with a clear A -> B -> C pattern
    const symbolGraph = {
      symbols: new Map(),
      edges: [],
      metadata: {
        language: 'javascript',
        rootPath: '/test',
        analyzedFiles: [],
        timestamp: new Date(),
        version: '0.1.0'
      }
    };
    
    // Create a more complex graph with different participation profiles
    // Hub nodes (high fan-out) - these will be "mid" depth from entry points
    const hub1 = { 
      id: 'hub1', 
      type: 'function', 
      name: 'centralHub1',
      location: { file: '/test/hub1.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    const hub2 = { 
      id: 'hub2', 
      type: 'function', 
      name: 'centralHub2',
      location: { file: '/test/hub2.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    
    // Entry points (low fan-in, high fan-out)
    const entry1 = { 
      id: 'entry1', 
      type: 'function', 
      name: 'entryPoint1',
      location: { file: '/test/entry1.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    const entry2 = { 
      id: 'entry2', 
      type: 'function', 
      name: 'entryPoint2',
      location: { file: '/test/entry2.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    
    // Leaf nodes (high fan-in, low fan-out) - these will be "deep" from entry points
    const leaf1 = { 
      id: 'leaf1', 
      type: 'function', 
      name: 'leafNode1',
      location: { file: '/test/leaf1.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    const leaf2 = { 
      id: 'leaf2', 
      type: 'function', 
      name: 'leafNode2',
      location: { file: '/test/leaf2.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    const leaf3 = { 
      id: 'leaf3', 
      type: 'function', 
      name: 'leafNode3',
      location: { file: '/test/leaf3.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };
    const leaf4 = { 
      id: 'leaf4', 
      type: 'function', 
      name: 'leafNode4',
      location: { file: '/test/leaf4.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
      scope: 'global',
      dependencies: [],
      dependents: [],
      metadata: {}
    };

    symbolGraph.symbols.set(hub1.id, hub1); 
    symbolGraph.symbols.set(hub2.id, hub2); 
    symbolGraph.symbols.set(entry1.id, entry1);
    symbolGraph.symbols.set(entry2.id, entry2); 
    symbolGraph.symbols.set(leaf1.id, leaf1); 
    symbolGraph.symbols.set(leaf2.id, leaf2);
    symbolGraph.symbols.set(leaf3.id, leaf3);
    symbolGraph.symbols.set(leaf4.id, leaf4);

    // Create edges that will result in different participation profiles
    // Pattern 1: Entry -> Hub (low fan-in, low fan-out -> high fan-in, high fan-out)
    symbolGraph.edges.push({ id: 'e1', from: entry1.id, to: hub1.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    symbolGraph.edges.push({ id: 'e2', from: entry2.id, to: hub2.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    
    // Pattern 2: Hub -> Leaf (high fan-in, high fan-out -> high fan-in, low fan-out)
    symbolGraph.edges.push({ id: 'e3', from: hub1.id, to: leaf1.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    symbolGraph.edges.push({ id: 'e4', from: hub1.id, to: leaf2.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    symbolGraph.edges.push({ id: 'e5', from: hub2.id, to: leaf3.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    symbolGraph.edges.push({ id: 'e6', from: hub2.id, to: leaf4.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    
    // Additional edges to create different fan-in/fan-out patterns
    symbolGraph.edges.push({ id: 'e7', from: entry1.id, to: hub2.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });
    symbolGraph.edges.push({ id: 'e8', from: entry2.id, to: hub1.id, type: 'calls', weight: 1, is_primary: true, confidence: 1, metadata: '' });

    // Store symbols in database to satisfy foreign key constraints
    await db.storeSymbol(hub1);
    await db.storeSymbol(hub2);
    await db.storeSymbol(entry1);
    await db.storeSymbol(entry2);
    await db.storeSymbol(leaf1);
    await db.storeSymbol(leaf2);
    await db.storeSymbol(leaf3);
    await db.storeSymbol(leaf4);

    const entryPoints = [{ id: entry1.id, name: entry1.name, confidence: 1 }, { id: entry2.id, name: entry2.name, confidence: 1 }];

    // 2. Run the analysis pipeline
    const profileAnalyzer = await (guru as any).getSymbolProfileAnalyzer();
    const profileMap = profileAnalyzer.analyze(symbolGraph, entryPoints);
    const patternDetector = await (guru as any).getPatternDetector();
    await patternDetector.detectPatterns(symbolGraph, profileMap);

    // 3. Assertions
    const patterns = await db.getAllDetectedPatterns();
    const instances = await db.getAllPatternInstances();

    // Debug: Let's see what patterns were actually detected
    console.log('Detected patterns:', patterns.map(p => ({ 
      id: p.id, 
      type: p.type, 
      frequency: p.frequency, 
      metadata: p.metadata 
    })));
    console.log('Pattern instances:', instances.map(i => ({ 
      pattern_id: i.pattern_id, 
      symbol_id: i.symbol_id, 
      role: i.role_in_pattern, 
      metadata: i.metadata 
    })));

    // We expect two dominant patterns based on different participation profiles:
    // 1. Entry -> Hub: (fi:low,fo:medium,d:shallow) -> calls -> (fi:high,fo:high,d:mid)  
    // 2. Hub -> Leaf: (fi:high,fo:high,d:mid) -> calls -> (fi:low,fo:low,d:deep)
    expect(patterns.length).to.be.greaterThanOrEqual(1, 'Should detect at least one interaction pattern');
    
    if (patterns.length >= 2) {
      // If we have 2+ patterns, verify they have different canonical forms
      const canonicalForms = patterns.map(p => JSON.parse(p.metadata).canonical_form);
      const uniqueForms = new Set(canonicalForms);
      expect(uniqueForms.size).to.equal(patterns.length, 'All patterns should have different canonical forms');
      
      // Each pattern should have multiple instances
      patterns.forEach(pattern => {
        expect(pattern.frequency).to.be.greaterThanOrEqual(2, `Pattern should have at least 2 instances, got ${pattern.frequency}`);
      });
    } else {
      // If only 1 pattern, it should have multiple instances
      expect(patterns[0].frequency).to.be.greaterThanOrEqual(2, 'Single pattern should have multiple instances');
    }

  }, 10000);
});