/**
 * Forest Persistence - Save and restore Living Task Forest state
 * Uses DuckDB for efficient storage and querying of forest data
 */

import { Database } from 'duckdb-async';
import { TaskTree, TaskLifecycle, TreeConnection, TaskDependency, TaskResource } from '../core/task-tree.js';
import { TaskForest, ForestEnvironment, SeasonType, WeatherPattern } from '../ecosystem/task-forest.js';
import { TaskGenetics } from '../genetics/task-genetics.js';
import { ConfidenceStream, Evidence, Uncertainty, Assumption } from '../confidence/confidence-stream.js';
import { Logger } from '../../logging/logger.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Serialized forest state
 */
export interface ForestSnapshot {
  id: string;
  timestamp: number;
  environment: ForestEnvironment;
  treeCount: number;
  health: {
    biodiversity: number;
    stability: number;
    productivity: number;
    sustainability: number;
  };
  metadata: {
    version: string;
    totalTreesCreated: number;
    totalExtinct: number;
    totalReproductions: number;
    totalMutations: number;
  };
}

/**
 * Serialized task tree
 */
export interface TreeSnapshot {
  forestId: string;
  treeId: string;
  species: string;
  generation: number;
  age: number;
  lifecycle: TaskLifecycle;
  health: number;
  energy: number;
  growthRate: number;
  
  // Flattened structure
  rootInsight: string; // JSON
  trunk: string; // JSON
  branches: string; // JSON array
  leaves: string; // JSON array
  
  // Genetics
  dna: string; // JSON
  
  // Relationships
  connections: string; // JSON array
  dependencies: string; // JSON array
  provides: string; // JSON array
  
  // History
  evolution: string; // JSON array
  
  savedAt: number;
}

/**
 * Serialized confidence stream
 */
export interface StreamSnapshot {
  forestId: string;
  streamId: string;
  purpose: string;
  domain: string;
  currentConfidence: number;
  targetConfidence: number;
  
  // Data as JSON strings
  evidence: string;
  uncertainties: string;
  assumptions: string;
  activities: string;
  experiments: string;
  
  savedAt: number;
}

/**
 * Forest persistence manager
 */
export class ForestPersistence {
  private db: Database;
  private logger = Logger.getInstance();
  private dbPath: string;
  private initialized: boolean = false;
  
  constructor(storagePath: string = './data/ltf') {
    this.dbPath = path.join(storagePath, 'forest.duckdb');
  }
  
  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    
    // Create database connection
    this.db = await Database.create(this.dbPath);
    
    // Create tables
    await this.createTables();
    
    this.initialized = true;
    this.logger.info(`🗄️ Forest persistence initialized at ${this.dbPath}`);
  }
  
  /**
   * Save complete forest state
   */
  async saveForest(forest: TaskForest, streams?: Map<string, ConfidenceStream>): Promise<string> {
    if (!this.initialized) await this.initialize();
    
    const snapshotId = `forest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.db.run('BEGIN TRANSACTION');
      
      // Save forest metadata
      const health = forest.assessForestHealth();
      const stats = forest.getStatistics();
      
      const snapshot: ForestSnapshot = {
        id: snapshotId,
        timestamp: Date.now(),
        environment: forest.environment,
        treeCount: forest.trees.size,
        health: {
          biodiversity: health.biodiversity,
          stability: health.stability,
          productivity: health.productivity,
          sustainability: health.sustainability
        },
        metadata: {
          version: '1.0',
          totalTreesCreated: stats.forest.totalCreated,
          totalExtinct: stats.forest.totalExtinct,
          totalReproductions: stats.forest.totalReproductions,
          totalMutations: stats.forest.totalMutations
        }
      };
      
      await this.saveForestSnapshot(snapshot);
      
      // Save all trees
      let savedTrees = 0;
      for (const [treeId, tree] of forest.trees) {
        await this.saveTreeSnapshot(snapshotId, tree);
        savedTrees++;
      }
      
      // Save confidence streams if provided
      let savedStreams = 0;
      if (streams) {
        for (const [streamId, stream] of streams) {
          await this.saveStreamSnapshot(snapshotId, stream);
          savedStreams++;
        }
      }
      
      // Save dead trees for history
      for (const [treeId, tree] of forest.deadTrees) {
        await this.saveTreeSnapshot(snapshotId, tree, true);
      }
      
      await this.db.run('COMMIT');
      
      this.logger.info(`💾 Saved forest snapshot: ${snapshotId} (${savedTrees} trees, ${savedStreams} streams)`);
      return snapshotId;
      
    } catch (error) {
      await this.db.run('ROLLBACK');
      this.logger.error('Failed to save forest:', error);
      throw error;
    }
  }
  
  /**
   * Load forest state from snapshot
   */
  async loadForest(snapshotId: string): Promise<{
    forest: TaskForest;
    streams: Map<string, ConfidenceStream>;
  }> {
    if (!this.initialized) await this.initialize();
    
    try {
      // Load forest metadata
      const snapshot = await this.loadForestSnapshot(snapshotId);
      if (!snapshot) {
        throw new Error(`Forest snapshot ${snapshotId} not found`);
      }
      
      // Create new forest
      const forest = new TaskForest();
      
      // Restore environment
      forest.environment = snapshot.environment;
      
      // Load trees
      const trees = await this.loadTrees(snapshotId, false);
      for (const treeData of trees) {
        const tree = await this.deserializeTree(treeData);
        forest.trees.set(tree.id, tree);
      }
      
      // Load dead trees
      const deadTrees = await this.loadTrees(snapshotId, true);
      for (const treeData of deadTrees) {
        const tree = await this.deserializeTree(treeData);
        forest.deadTrees.set(tree.id, tree);
      }
      
      // Load confidence streams
      const streams = new Map<string, ConfidenceStream>();
      const streamData = await this.loadStreams(snapshotId);
      for (const streamSnapshot of streamData) {
        const stream = this.deserializeStream(streamSnapshot);
        streams.set(stream.id, stream);
      }
      
      this.logger.info(`📂 Loaded forest snapshot: ${snapshotId} (${forest.trees.size} trees, ${streams.size} streams)`);
      
      return { forest, streams };
      
    } catch (error) {
      this.logger.error('Failed to load forest:', error);
      throw error;
    }
  }
  
  /**
   * List available forest snapshots
   */
  async listSnapshots(): Promise<ForestSnapshot[]> {
    if (!this.initialized) await this.initialize();
    
    const result = await this.db.all(`
      SELECT 
        id,
        timestamp,
        environment,
        tree_count as treeCount,
        health,
        metadata
      FROM forest_snapshots
      ORDER BY timestamp DESC
    `);
    
    return result.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      environment: JSON.parse(row.environment),
      treeCount: row.treeCount,
      health: JSON.parse(row.health),
      metadata: JSON.parse(row.metadata)
    }));
  }
  
  /**
   * Delete old snapshots
   */
  async pruneSnapshots(keepCount: number = 10): Promise<number> {
    if (!this.initialized) await this.initialize();
    
    // First, get the IDs of snapshots to delete
    const toDelete = await this.db.all(`
      SELECT id FROM forest_snapshots
      WHERE id NOT IN (
        SELECT id FROM forest_snapshots
        ORDER BY timestamp DESC
        LIMIT ?
      )
    `, keepCount);
    
    const deleteIds = toDelete.map(row => row.id);
    
    if (deleteIds.length === 0) {
      // Check total count for debugging
      const totalCount = await this.db.all('SELECT COUNT(*) as count FROM forest_snapshots');
      this.logger.debug(`No snapshots to delete. Total: ${totalCount[0]?.count}, Keep: ${keepCount}`);
      return 0;
    }
    
    // Delete child records first to avoid foreign key constraints
    for (const id of deleteIds) {
      await this.db.run('DELETE FROM tree_snapshots WHERE forest_id = ?', id);
      await this.db.run('DELETE FROM stream_snapshots WHERE forest_id = ?', id);
    }
    
    // Now delete the forest snapshots
    const result = await this.db.run(`
      DELETE FROM forest_snapshots
      WHERE id NOT IN (
        SELECT id FROM forest_snapshots
        ORDER BY timestamp DESC
        LIMIT ?
      )
    `, keepCount);
    
    const deleted = deleteIds.length; // Use the count of IDs we deleted
    
    this.logger.info(`🗑️ Pruned ${deleted} old forest snapshots`);
    return deleted;
  }
  
  /**
   * Get forest history analytics
   */
  async getForestHistory(limit: number = 100): Promise<any[]> {
    if (!this.initialized) await this.initialize();
    
    const result = await this.db.all(`
      SELECT 
        fs.timestamp,
        fs.tree_count,
        JSON_EXTRACT(fs.health, '$.biodiversity') as biodiversity,
        JSON_EXTRACT(fs.health, '$.productivity') as productivity,
        JSON_EXTRACT(fs.health, '$.overallHealth') as overallHealth,
        JSON_EXTRACT(fs.metadata, '$.totalExtinct') as totalExtinct,
        JSON_EXTRACT(fs.metadata, '$.totalReproductions') as totalReproductions,
        COUNT(DISTINCT ts.tree_id) as uniqueTrees
      FROM forest_snapshots fs
      LEFT JOIN tree_snapshots ts ON fs.id = ts.forest_id
      GROUP BY fs.id
      ORDER BY fs.timestamp DESC
      LIMIT ?
    `, limit);
    
    return result;
  }
  
  // Private methods
  
  private async createTables(): Promise<void> {
    // Forest snapshots table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS forest_snapshots (
        id TEXT PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        environment TEXT NOT NULL,
        tree_count INTEGER NOT NULL,
        health TEXT NOT NULL,
        metadata TEXT NOT NULL
      )
    `);
    
    // Tree snapshots table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS tree_snapshots (
        forest_id TEXT NOT NULL,
        tree_id TEXT NOT NULL,
        species TEXT NOT NULL,
        generation INTEGER NOT NULL,
        age BIGINT NOT NULL,
        lifecycle TEXT NOT NULL,
        health REAL NOT NULL,
        energy REAL NOT NULL,
        growth_rate REAL NOT NULL,
        
        root_insight TEXT NOT NULL,
        trunk TEXT NOT NULL,
        branches TEXT NOT NULL,
        leaves TEXT NOT NULL,
        
        dna TEXT NOT NULL,
        
        connections TEXT NOT NULL,
        dependencies TEXT NOT NULL,
        provides TEXT NOT NULL,
        
        evolution TEXT NOT NULL,
        
        is_dead BOOLEAN DEFAULT FALSE,
        saved_at BIGINT NOT NULL,
        
        PRIMARY KEY (forest_id, tree_id),
        FOREIGN KEY (forest_id) REFERENCES forest_snapshots(id)
      )
    `);
    
    // Confidence stream snapshots table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS stream_snapshots (
        forest_id TEXT NOT NULL,
        stream_id TEXT NOT NULL,
        purpose TEXT NOT NULL,
        domain TEXT NOT NULL,
        current_confidence REAL NOT NULL,
        target_confidence REAL NOT NULL,
        
        evidence TEXT NOT NULL,
        uncertainties TEXT NOT NULL,
        assumptions TEXT NOT NULL,
        activities TEXT NOT NULL,
        experiments TEXT NOT NULL,
        
        saved_at BIGINT NOT NULL,
        
        PRIMARY KEY (forest_id, stream_id),
        FOREIGN KEY (forest_id) REFERENCES forest_snapshots(id)
      )
    `);
    
    // Create indexes
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_forest_timestamp ON forest_snapshots(timestamp)');
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_tree_species ON tree_snapshots(species)');
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_tree_lifecycle ON tree_snapshots(lifecycle)');
  }
  
  private async saveForestSnapshot(snapshot: ForestSnapshot): Promise<void> {
    await this.db.run(`
      INSERT INTO forest_snapshots (
        id, timestamp, environment, tree_count, health, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, 
      snapshot.id,
      snapshot.timestamp,
      JSON.stringify(snapshot.environment),
      snapshot.treeCount,
      JSON.stringify(snapshot.health),
      JSON.stringify(snapshot.metadata)
    );
  }
  
  private async saveTreeSnapshot(forestId: string, tree: TaskTree, isDead: boolean = false): Promise<void> {
    const snapshot: TreeSnapshot = {
      forestId,
      treeId: tree.id || '',
      species: tree.species || 'unknown',
      generation: tree.generation || 0,
      age: tree.age || 0,
      lifecycle: tree.lifecycle || 'seed',
      health: tree.health || 1.0,
      energy: tree.energy || 1.0,
      growthRate: tree.growthRate || 0.1,
      
      rootInsight: JSON.stringify(tree.root || {}),
      trunk: JSON.stringify(tree.trunk || {}),
      branches: JSON.stringify(tree.branches || []),
      leaves: JSON.stringify(tree.leaves || []),
      
      dna: JSON.stringify(tree.dna || {}),
      
      connections: JSON.stringify(tree.connections || []),
      dependencies: JSON.stringify(tree.dependencies || []),
      provides: JSON.stringify(tree.provides || []),
      
      evolution: JSON.stringify(tree.evolution || []),
      
      savedAt: Date.now()
    };
    
    await this.db.run(`
      INSERT OR REPLACE INTO tree_snapshots (
        forest_id, tree_id, species, generation, age, lifecycle,
        health, energy, growth_rate,
        root_insight, trunk, branches, leaves,
        dna,
        connections, dependencies, provides,
        evolution,
        is_dead, saved_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?,
        ?,
        ?, ?
      )
    `,
      snapshot.forestId,
      snapshot.treeId,
      snapshot.species,
      snapshot.generation,
      snapshot.age,
      snapshot.lifecycle,
      snapshot.health,
      snapshot.energy,
      snapshot.growthRate,
      snapshot.rootInsight,
      snapshot.trunk,
      snapshot.branches,
      snapshot.leaves,
      snapshot.dna,
      snapshot.connections,
      snapshot.dependencies,
      snapshot.provides,
      snapshot.evolution,
      isDead,
      snapshot.savedAt
    );
  }
  
  private async saveStreamSnapshot(forestId: string, stream: ConfidenceStream): Promise<void> {
    const snapshot: StreamSnapshot = {
      forestId,
      streamId: stream.id,
      purpose: stream.purpose,
      domain: stream.domain,
      currentConfidence: stream.currentConfidence,
      targetConfidence: stream.targetConfidence,
      
      evidence: JSON.stringify(Array.from(stream.evidence.entries())),
      uncertainties: JSON.stringify(Array.from(stream.uncertainties.entries())),
      assumptions: JSON.stringify(Array.from(stream.assumptions.entries())),
      activities: JSON.stringify(Array.from(stream.activities.entries())),
      experiments: JSON.stringify(Array.from(stream.experiments.entries())),
      
      savedAt: Date.now()
    };
    
    await this.db.run(`
      INSERT OR REPLACE INTO stream_snapshots (
        forest_id, stream_id, purpose, domain,
        current_confidence, target_confidence,
        evidence, uncertainties, assumptions, activities, experiments,
        saved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      snapshot.forestId,
      snapshot.streamId,
      snapshot.purpose,
      snapshot.domain,
      snapshot.currentConfidence,
      snapshot.targetConfidence,
      snapshot.evidence,
      snapshot.uncertainties,
      snapshot.assumptions,
      snapshot.activities,
      snapshot.experiments,
      snapshot.savedAt
    );
  }
  
  private async loadForestSnapshot(snapshotId: string): Promise<ForestSnapshot | null> {
    const rows = await this.db.all(`
      SELECT * FROM forest_snapshots WHERE id = ?
    `, snapshotId);
    
    const row = rows[0];
    
    if (!row) return null;
    
    return {
      id: row.id,
      timestamp: row.timestamp,
      environment: JSON.parse(row.environment),
      treeCount: row.tree_count,
      health: JSON.parse(row.health),
      metadata: JSON.parse(row.metadata)
    };
  }
  
  private async loadTrees(forestId: string, isDead: boolean): Promise<TreeSnapshot[]> {
    const rows = await this.db.all(`
      SELECT * FROM tree_snapshots 
      WHERE forest_id = ? AND is_dead = ?
    `, forestId, isDead);
    
    return rows.map(row => ({
      forestId: row.forest_id,
      treeId: row.tree_id,
      species: row.species,
      generation: row.generation,
      age: row.age,
      lifecycle: row.lifecycle,
      health: row.health,
      energy: row.energy,
      growthRate: row.growth_rate,
      rootInsight: row.root_insight,
      trunk: row.trunk,
      branches: row.branches,
      leaves: row.leaves,
      dna: row.dna,
      connections: row.connections,
      dependencies: row.dependencies,
      provides: row.provides,
      evolution: row.evolution,
      savedAt: row.saved_at
    }));
  }
  
  private async loadStreams(forestId: string): Promise<StreamSnapshot[]> {
    const rows = await this.db.all(`
      SELECT * FROM stream_snapshots WHERE forest_id = ?
    `, forestId);
    
    return rows.map(row => ({
      forestId: row.forest_id,
      streamId: row.stream_id,
      purpose: row.purpose,
      domain: row.domain,
      currentConfidence: row.current_confidence,
      targetConfidence: row.target_confidence,
      evidence: row.evidence,
      uncertainties: row.uncertainties,
      assumptions: row.assumptions,
      activities: row.activities,
      experiments: row.experiments,
      savedAt: row.saved_at
    }));
  }
  
  private async deserializeTree(snapshot: TreeSnapshot): Promise<TaskTree> {
    // Create tree with restored state
    const tree = new TaskTree(
      JSON.parse(snapshot.rootInsight),
      JSON.parse(snapshot.dna)
    );
    
    // Restore properties
    tree.id = snapshot.treeId;
    tree.species = snapshot.species as any;
    tree.generation = snapshot.generation;
    tree.age = snapshot.age;
    tree.lifecycle = snapshot.lifecycle as any;
    tree.health = snapshot.health;
    tree.energy = snapshot.energy;
    tree.growthRate = snapshot.growthRate;
    
    // Restore structure
    tree.trunk = JSON.parse(snapshot.trunk);
    tree.branches = JSON.parse(snapshot.branches);
    tree.leaves = JSON.parse(snapshot.leaves);
    
    // Restore relationships
    tree.connections = JSON.parse(snapshot.connections);
    tree.dependencies = JSON.parse(snapshot.dependencies);
    tree.provides = JSON.parse(snapshot.provides);
    
    // Restore history
    tree.evolution = JSON.parse(snapshot.evolution);
    
    return tree;
  }
  
  private deserializeStream(snapshot: StreamSnapshot): ConfidenceStream {
    const stream = new ConfidenceStream(
      snapshot.purpose,
      snapshot.domain,
      snapshot.targetConfidence
    );
    
    // Restore properties
    stream.id = snapshot.streamId;
    stream.currentConfidence = snapshot.currentConfidence;
    
    // Restore evidence
    const evidence = JSON.parse(snapshot.evidence) as Array<[string, Evidence]>;
    stream.evidence = new Map(evidence);
    
    // Restore uncertainties
    const uncertainties = JSON.parse(snapshot.uncertainties) as Array<[string, Uncertainty]>;
    stream.uncertainties = new Map(uncertainties);
    
    // Restore assumptions
    const assumptions = JSON.parse(snapshot.assumptions) as Array<[string, Assumption]>;
    stream.assumptions = new Map(assumptions);
    
    // Restore activities
    const activities = JSON.parse(snapshot.activities) as Array<[string, any]>;
    stream.activities = new Map(activities);
    
    // Restore experiments
    const experiments = JSON.parse(snapshot.experiments) as Array<[string, any]>;
    stream.experiments = new Map(experiments);
    
    return stream;
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.initialized = false;
      this.logger.info('🔒 Forest persistence closed');
    }
  }
}