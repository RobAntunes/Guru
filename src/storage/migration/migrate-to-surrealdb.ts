#!/usr/bin/env tsx
/**
 * Migration script from legacy storage (Neo4j + Redis + SQLite) to SurrealDB
 * Run with: tsx src/storage/migration/migrate-to-surrealdb.ts
 */

import { StorageManager } from '../storage-manager.js';
import { UnifiedStorageManager } from '../unified-storage-manager.js';
import { GuruDatabase } from '../../core/database.js';
import ora from 'ora';
import chalk from 'chalk';

interface MigrationStats {
  symbols: number;
  relationships: number;
  patterns: number;
  cache: number;
  files: number;
  errors: number;
}

export class SurrealDBMigration {
  private legacy: StorageManager;
  private unified: UnifiedStorageManager;
  private guruDb: GuruDatabase;
  private stats: MigrationStats = {
    symbols: 0,
    relationships: 0,
    patterns: 0,
    cache: 0,
    files: 0,
    errors: 0
  };

  constructor() {
    this.legacy = new StorageManager();
    this.unified = new UnifiedStorageManager();
    this.guruDb = new GuruDatabase();
  }

  async run(): Promise<void> {
    console.log(chalk.cyan('\n🚀 SurrealDB Migration Tool\n'));
    
    const spinner = ora('Connecting to databases...').start();

    try {
      // Connect to both storage systems
      await this.legacy.connect();
      await this.unified.connect();
      spinner.succeed('Connected to storage systems');

      // Run migration steps
      await this.migrateSymbols();
      await this.migratePatterns();
      await this.migrateFileAnalysis();
      await this.migrateCache();

      // Print summary
      this.printSummary();

    } catch (error) {
      spinner.fail('Migration failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async migrateSymbols(): Promise<void> {
    const spinner = ora('Migrating symbols and relationships...').start();

    try {
      // Get all symbols from SQLite
      const symbols = await this.getAllSymbolsFromSQLite();
      
      // Migrate symbols
      for (const symbol of symbols) {
        try {
          await this.unified.createSymbol(symbol);
          this.stats.symbols++;
        } catch (error) {
          console.error(`Failed to migrate symbol ${symbol.id}:`, error);
          this.stats.errors++;
        }
      }

      // Get all relationships from SQLite
      const relationships = await this.getAllRelationshipsFromSQLite();
      
      // Migrate relationships
      for (const rel of relationships) {
        try {
          await this.unified.createSymbolRelationship(rel);
          this.stats.relationships++;
        } catch (error) {
          console.error(`Failed to migrate relationship ${rel.from}->${rel.to}:`, error);
          this.stats.errors++;
        }
      }

      spinner.succeed(`Migrated ${this.stats.symbols} symbols and ${this.stats.relationships} relationships`);
    } catch (error) {
      spinner.fail('Symbol migration failed');
      throw error;
    }
  }

  private async migratePatterns(): Promise<void> {
    const spinner = ora('Migrating patterns...').start();

    try {
      // Get patterns from various sources
      const detectedPatterns = await this.guruDb.getAllDetectedPatterns();
      
      for (const pattern of detectedPatterns) {
        try {
          // Convert to HarmonicPatternMemory format
          const harmonicPattern = {
            id: pattern.id,
            coordinates: [0, 0, 0], // Would need proper calculation
            content: {
              title: `Pattern ${pattern.id}`,
              description: '',
              type: pattern.type,
              tags: [],
              data: JSON.parse(pattern.metadata || '{}')
            },
            accessCount: 0,
            lastAccessed: pattern.updated_at,
            createdAt: pattern.created_at,
            relevanceScore: pattern.stability_score,
            harmonicProperties: {
              category: pattern.type as any,
              strength: pattern.stability_score,
              occurrences: pattern.frequency,
              confidence: pattern.complexity_score,
              complexity: pattern.complexity_score
            },
            locations: [],
            evidence: [],
            relatedPatterns: [],
            causesPatterns: [],
            requiredBy: []
          };

          await this.unified.storePattern(harmonicPattern);
          this.stats.patterns++;
        } catch (error) {
          console.error(`Failed to migrate pattern ${pattern.id}:`, error);
          this.stats.errors++;
        }
      }

      spinner.succeed(`Migrated ${this.stats.patterns} patterns`);
    } catch (error) {
      spinner.fail('Pattern migration failed');
      throw error;
    }
  }

  private async migrateFileAnalysis(): Promise<void> {
    const spinner = ora('Migrating file analysis cache...').start();

    try {
      const files = await this.guruDb.getAllAnalyzedFiles();
      
      for (const filePath of files) {
        try {
          const analysis = await this.guruDb.getFileAnalysis(filePath);
          if (analysis) {
            await this.unified.surrealdb.storeFileAnalysis(analysis);
            this.stats.files++;
          }
        } catch (error) {
          console.error(`Failed to migrate file analysis for ${filePath}:`, error);
          this.stats.errors++;
        }
      }

      spinner.succeed(`Migrated ${this.stats.files} file analyses`);
    } catch (error) {
      spinner.fail('File analysis migration failed');
      throw error;
    }
  }

  private async migrateCache(): Promise<void> {
    const spinner = ora('Migrating cache entries...').start();

    try {
      // Note: Redis cache is ephemeral, so we might skip this
      // or only migrate specific long-lived cache entries
      
      spinner.succeed('Cache migration skipped (ephemeral data)');
    } catch (error) {
      spinner.fail('Cache migration failed');
      throw error;
    }
  }

  private async getAllSymbolsFromSQLite(): Promise<any[]> {
    const stmt = this.guruDb.prepare('SELECT * FROM symbols');
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      location: {
        file: row.file_path,
        startLine: row.start_line,
        startColumn: row.start_column,
        endLine: row.end_line,
        endColumn: row.end_column
      },
      scope: row.scope,
      dependencies: [],
      dependents: [],
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  private async getAllRelationshipsFromSQLite(): Promise<any[]> {
    const stmt = this.guruDb.prepare('SELECT * FROM symbol_edges');
    const rows = stmt.all();
    
    return rows.map(row => ({
      from: row.from_symbol,
      to: row.to_symbol,
      type: row.edge_type,
      weight: row.weight,
      properties: JSON.parse(row.metadata || '{}')
    }));
  }

  private printSummary(): void {
    console.log(chalk.cyan('\n📊 Migration Summary\n'));
    
    const table = [
      ['Entity Type', 'Count', 'Status'],
      ['Symbols', this.stats.symbols.toString(), chalk.green('✓')],
      ['Relationships', this.stats.relationships.toString(), chalk.green('✓')],
      ['Patterns', this.stats.patterns.toString(), chalk.green('✓')],
      ['File Analyses', this.stats.files.toString(), chalk.green('✓')],
      ['Cache Entries', this.stats.cache.toString(), chalk.yellow('Skipped')],
      ['Errors', this.stats.errors.toString(), this.stats.errors > 0 ? chalk.red('⚠') : chalk.green('✓')]
    ];

    // Simple table rendering
    const colWidths = [20, 10, 10];
    table.forEach((row, index) => {
      const formattedRow = row.map((cell, i) => cell.padEnd(colWidths[i])).join('');
      if (index === 0) {
        console.log(chalk.bold(formattedRow));
        console.log('-'.repeat(40));
      } else {
        console.log(formattedRow);
      }
    });

    console.log('\n' + (this.stats.errors === 0 
      ? chalk.green('✅ Migration completed successfully!')
      : chalk.yellow(`⚠️  Migration completed with ${this.stats.errors} errors`)));
  }

  private async cleanup(): Promise<void> {
    await this.legacy.disconnect();
    await this.unified.disconnect();
    this.guruDb.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new SurrealDBMigration();
  migration.run().catch(console.error);
}