#!/usr/bin/env tsx
/**
 * Direct SQLite to SurrealDB migration
 * Migrates only from the existing SQLite database to SurrealDB
 */

import { GuruDatabase } from '../../core/database.js';
import { UnifiedStorageManager } from '../unified-storage-manager.js';
import { SymbolInfo } from '../../core/interfaces.js';
import ora from 'ora';
import chalk from 'chalk';

interface MigrationStats {
  symbols: number;
  relationships: number;
  patterns: number;
  files: number;
  errors: number;
}

export class SQLiteToSurrealDBMigration {
  private guruDb: GuruDatabase;
  private unified: UnifiedStorageManager;
  private stats: MigrationStats = {
    symbols: 0,
    relationships: 0,
    patterns: 0,
    files: 0,
    errors: 0
  };

  constructor() {
    this.guruDb = new GuruDatabase();
    this.unified = new UnifiedStorageManager();
  }

  async run(): Promise<void> {
    console.log(chalk.cyan('\n🚀 SQLite to SurrealDB Migration\n'));
    
    const spinner = ora('Connecting to databases...').start();

    try {
      // Connect to databases
      await this.unified.connect();
      spinner.succeed('Connected to SurrealDB');

      // Migrate data
      await this.migrateSymbols();
      await this.migratePatterns();
      await this.migrateFileAnalysis();

      // Show results
      console.log(chalk.green('\n✅ Migration completed successfully!\n'));
      console.log(chalk.cyan('📊 Migration Statistics:'));
      console.log(`  • Symbols migrated: ${chalk.yellow(this.stats.symbols)}`);
      console.log(`  • Relationships created: ${chalk.yellow(this.stats.relationships)}`);
      console.log(`  • Patterns migrated: ${chalk.yellow(this.stats.patterns)}`);
      console.log(`  • Files migrated: ${chalk.yellow(this.stats.files)}`);
      console.log(`  • Errors: ${chalk.red(this.stats.errors)}`);

    } catch (error) {
      spinner.fail('Migration failed');
      console.error(chalk.red('\n❌ Error during migration:'), error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async migrateSymbols(): Promise<void> {
    const spinner = ora('Migrating symbols...').start();

    try {
      // Get all symbols from SQLite
      const allSymbols = this.guruDb.getAllSymbols();
      
      for (const [filePath, symbols] of allSymbols.entries()) {
        try {
          // Store symbols in SurrealDB
          for (const symbol of symbols) {
            await this.unified.storeSymbol({
              ...symbol,
              filePath
            });
            this.stats.symbols++;

            // Create relationships
            if (symbol.references && symbol.references.length > 0) {
              for (const ref of symbol.references) {
                await this.unified.createRelationship(
                  symbol.id,
                  ref.targetId,
                  ref.type
                );
                this.stats.relationships++;
              }
            }
          }
        } catch (error) {
          console.error(chalk.red(`\nError migrating symbols for ${filePath}:`), error);
          this.stats.errors++;
        }
      }

      spinner.succeed(`Migrated ${this.stats.symbols} symbols with ${this.stats.relationships} relationships`);
    } catch (error) {
      spinner.fail('Symbol migration failed');
      throw error;
    }
  }

  private async migratePatterns(): Promise<void> {
    const spinner = ora('Migrating patterns...').start();

    try {
      // Get patterns from SQLite (if they exist)
      const patterns = this.guruDb.getPatterns?.() || [];
      
      for (const pattern of patterns) {
        try {
          await this.unified.storePattern(pattern);
          this.stats.patterns++;
        } catch (error) {
          console.error(chalk.red(`\nError migrating pattern ${pattern.name}:`), error);
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
      // Get all analyzed files from SQLite
      const files = this.guruDb.getAnalyzedFiles?.() || [];
      
      for (const file of files) {
        try {
          const analysis = this.guruDb.getFileAnalysis?.(file);
          if (analysis) {
            await this.unified.cacheAnalysis(file, analysis);
            this.stats.files++;
          }
        } catch (error) {
          console.error(chalk.red(`\nError migrating file ${file}:`), error);
          this.stats.errors++;
        }
      }

      spinner.succeed(`Migrated ${this.stats.files} file analyses`);
    } catch (error) {
      spinner.fail('File analysis migration failed');
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await this.unified.disconnect();
      this.guruDb.close();
    } catch (error) {
      console.error(chalk.yellow('Warning: Error during cleanup:'), error);
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new SQLiteToSurrealDBMigration();
  migration.run().catch(console.error);
}