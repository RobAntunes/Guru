/**
 * Database migration for Harmonic Intelligence schema
 * @module harmonic-intelligence/database
 */

import { DatabaseAdapter } from '../../core/database-adapter.js';
import { Logger } from '../../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

export class HarmonicSchemaMigration {
  private readonly logger = new Logger('HarmonicSchemaMigration');
  private readonly db = DatabaseAdapter.getInstance();
  
  /**
   * Run the migration to add harmonic intelligence tables
   */
  public async migrate(): Promise<void> {
    this.logger.info('Starting Harmonic Intelligence schema migration');
    
    try {
      const database = this.db.getDatabase() as any;
      
      // Read schema SQL
      const schemaPath = path.join(__dirname, 'harmonic-schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      
      // Split into individual statements
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      // Execute in a transaction
      const executeStatements = () => {
        for (const statement of statements) {
          this.logger.debug(`Executing: ${statement.substring(0, 50)}...`);
          database.exec(statement + ';');
        }
      };
      
      database.transaction(executeStatements)();
      
      // Verify migration
      const tables = database.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE 'harmonic_%' OR name LIKE '%_harmony%'
        ORDER BY name
      `).all() as { name: string }[];
      
      this.logger.info(`Created ${tables.length} harmonic tables:`, tables.map(t => t.name));
      
      // Update schema version
      this.updateSchemaVersion();
      
      this.logger.info('Harmonic Intelligence schema migration completed successfully');
      
    } catch (error) {
      this.logger.error('Schema migration failed', error);
      throw new Error(`Harmonic schema migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if migration is needed
   */
  public async isMigrationNeeded(): Promise<boolean> {
    try {
      const database = this.db.getDatabase() as any;
      
      // Check if harmonic_scores table exists
      const table = database.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='harmonic_scores'
      `).get();
      
      return !table;
    } catch (error) {
      this.logger.error('Failed to check migration status', error);
      return true; // Assume migration needed if check fails
    }
  }
  
  /**
   * Rollback the migration (for testing)
   */
  public async rollback(): Promise<void> {
    this.logger.info('Rolling back Harmonic Intelligence schema');
    
    try {
      const database = this.db.getDatabase() as any;
      
      const tables = [
        'curated_training_data',
        'quality_gates',
        'pattern_cache',
        'harmonic_edges',
        'aesthetic_profiles',
        'pattern_evolution',
        'harmonic_scores'
      ];
      
      database.transaction(() => {
        // Drop views first
        database.exec('DROP VIEW IF EXISTS harmony_trends');
        database.exec('DROP VIEW IF EXISTS high_harmony_symbols');
        
        // Drop tables
        for (const table of tables) {
          database.exec(`DROP TABLE IF EXISTS ${table}`);
        }
      })();
      
      this.logger.info('Harmonic schema rollback completed');
      
    } catch (error) {
      this.logger.error('Rollback failed', error);
      throw new Error(`Harmonic schema rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update schema version tracking
   */
  private updateSchemaVersion(): void {
    const database = this.db.getDatabase();
    
    // TODO: GuruDatabase doesn't expose exec/prepare methods directly
    // Need to update GuruDatabase or use a different approach
    
    // // Ensure schema_versions table exists
    // database.exec(`
    //   CREATE TABLE IF NOT EXISTS schema_versions (
    //     version TEXT PRIMARY KEY,
    //     applied_at INTEGER NOT NULL,
    //     description TEXT
    //   )
    // `);
    
    // // Record this migration
    // database.prepare(`
    //   INSERT OR REPLACE INTO schema_versions (version, applied_at, description)
    //   VALUES (?, ?, ?)
    // `).run(
    //   'harmonic_v1.0.0',
    //   Date.now(),
    //   'Added Harmonic Intelligence schema with 23 pattern analysis support'
    // );
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  const migration = new HarmonicSchemaMigration();
  
  migration.isMigrationNeeded().then(needed => {
    if (needed) {
      console.log('Running Harmonic Intelligence schema migration...');
      return migration.migrate();
    } else {
      console.log('Harmonic Intelligence schema already up to date');
    }
  }).then(() => {
    console.log('Migration check complete');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}