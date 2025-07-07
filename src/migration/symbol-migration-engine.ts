/**
 * Symbol Migration Engine
 * Migrates symbols from SQLite to Neo4j and creates the full code graph
 */

import sqlite3 from 'sqlite3';
import { Neo4jRelationshipStore, SymbolNode, SymbolRelationship } from '../storage/neo4j-relationship-store.js';
import { promisify } from 'util';
import path from 'path';

interface SQLiteSymbol {
  id: string;
  name: string;
  type: string;
  file_path: string;
  start_line: number;
  end_line: number;
  start_column: number;
  end_column: number;
  scope: string;
  metadata: string;
  embedding?: string;
}

interface SQLiteReference {
  source_id: string;
  target_id: string;
  reference_type: string;
  line: number;
}

export class SymbolMigrationEngine {
  private db: sqlite3.Database;
  private neo4j: Neo4jRelationshipStore;
  private dbGet: (sql: string, params?: any[]) => Promise<any>;
  private dbAll: (sql: string, params?: any[]) => Promise<any[]>;

  constructor(sqlitePath: string) {
    this.db = new sqlite3.Database(sqlitePath);
    this.neo4j = new Neo4jRelationshipStore();
    
    // Promisify database methods
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
  }

  async connect(): Promise<void> {
    await this.neo4j.connect();
    console.log('✅ Connected to Neo4j for symbol migration');
  }

  async disconnect(): Promise<void> {
    await this.neo4j.disconnect();
    this.db.close();
    console.log('📴 Disconnected from databases');
  }

  /**
   * Main migration method
   */
  async migrateSymbolsToNeo4j(): Promise<{
    symbolsCreated: number;
    relationshipsCreated: number;
    errors: string[];
  }> {
    console.log('🚀 Starting Symbol Migration to Neo4j...\n');
    
    const stats = {
      symbolsCreated: 0,
      relationshipsCreated: 0,
      errors: [] as string[]
    };

    try {
      // 1. Migrate all symbols
      console.log('1️⃣ Migrating symbols...');
      const symbols = await this.getAllSymbols();
      console.log(`   Found ${symbols.length} symbols in SQLite`);

      for (const symbol of symbols) {
        try {
          await this.createSymbolNode(symbol);
          stats.symbolsCreated++;
          
          if (stats.symbolsCreated % 100 === 0) {
            console.log(`   Progress: ${stats.symbolsCreated}/${symbols.length} symbols`);
          }
        } catch (error) {
          stats.errors.push(`Symbol ${symbol.id}: ${error}`);
        }
      }

      console.log(`   ✅ Created ${stats.symbolsCreated} symbol nodes`);

      // 2. Migrate relationships
      console.log('\n2️⃣ Migrating symbol relationships...');
      const references = await this.getAllReferences();
      console.log(`   Found ${references.length} references in SQLite`);

      for (const ref of references) {
        try {
          await this.createSymbolRelationship(ref);
          stats.relationshipsCreated++;
          
          if (stats.relationshipsCreated % 100 === 0) {
            console.log(`   Progress: ${stats.relationshipsCreated}/${references.length} relationships`);
          }
        } catch (error) {
          stats.errors.push(`Relationship ${ref.source_id}->${ref.target_id}: ${error}`);
        }
      }

      console.log(`   ✅ Created ${stats.relationshipsCreated} relationships`);

      // 3. Create additional structural relationships
      console.log('\n3️⃣ Creating structural relationships...');
      await this.createStructuralRelationships(symbols);

      // 4. Calculate and store complexity metrics
      console.log('\n4️⃣ Calculating complexity metrics...');
      await this.calculateComplexityMetrics();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      stats.errors.push(`Fatal: ${error}`);
    }

    return stats;
  }

  /**
   * Get all symbols from SQLite
   */
  private async getAllSymbols(): Promise<SQLiteSymbol[]> {
    const query = `
      SELECT 
        id, name, type, file_path, 
        start_line, end_line, 
        start_column, end_column,
        scope, metadata, embedding
      FROM symbols
      ORDER BY file_path, start_line
    `;
    
    return await this.dbAll(query);
  }

  /**
   * Get all references from SQLite
   */
  private async getAllReferences(): Promise<SQLiteReference[]> {
    const query = `
      SELECT 
        from_symbol as source_id, to_symbol as target_id, edge_type as reference_type, 1 as line
      FROM symbol_edges
    `;
    
    return await this.dbAll(query);
  }

  /**
   * Create a symbol node in Neo4j
   */
  private async createSymbolNode(symbol: SQLiteSymbol): Promise<void> {
    // Calculate simple complexity based on lines of code
    const complexity = Math.max(1, symbol.end_line - symbol.start_line);
    
    const symbolNode: SymbolNode = {
      id: symbol.id,
      name: symbol.name,
      type: this.mapSymbolType(symbol.type),
      file: symbol.file_path,
      startLine: symbol.start_line,
      endLine: symbol.end_line,
      complexity: complexity,
      properties: {
        startColumn: symbol.start_column,
        endColumn: symbol.end_column,
        scope: symbol.scope,
        metadata: symbol.metadata ? JSON.parse(symbol.metadata) : {},
        embedding: symbol.embedding
      }
    };

    await this.neo4j.createSymbol(symbolNode);
  }

  /**
   * Create a relationship between symbols
   */
  private async createSymbolRelationship(ref: SQLiteReference): Promise<void> {
    const relationship: SymbolRelationship = {
      from: ref.source_id,
      to: ref.target_id,
      type: this.mapReferenceType(ref.reference_type),
      properties: {
        line: ref.line
      }
    };

    await this.neo4j.createSymbolRelationship(relationship);
  }

  /**
   * Create structural relationships based on file hierarchy and containment
   */
  private async createStructuralRelationships(symbols: SQLiteSymbol[]): Promise<void> {
    // Group symbols by file
    const symbolsByFile = new Map<string, SQLiteSymbol[]>();
    for (const symbol of symbols) {
      const fileSymbols = symbolsByFile.get(symbol.file_path) || [];
      fileSymbols.push(symbol);
      symbolsByFile.set(symbol.file_path, fileSymbols);
    }

    // Create CONTAINS relationships for nested symbols
    for (const [file, fileSymbols] of symbolsByFile) {
      // Sort by start position to ensure proper nesting
      fileSymbols.sort((a, b) => a.start_line - b.start_line);

      for (let i = 0; i < fileSymbols.length; i++) {
        const parent = fileSymbols[i];
        
        // Find all symbols contained within this symbol
        for (let j = i + 1; j < fileSymbols.length; j++) {
          const child = fileSymbols[j];
          
          // Check if child is contained within parent
          if (child.start_line >= parent.start_line && 
              child.end_line <= parent.end_line &&
              child.id !== parent.id) {
            
            // Check if this is a direct containment (no intermediate parent)
            let isDirectChild = true;
            for (let k = i + 1; k < j; k++) {
              const intermediate = fileSymbols[k];
              if (child.start_line >= intermediate.start_line &&
                  child.end_line <= intermediate.end_line &&
                  intermediate.start_line >= parent.start_line &&
                  intermediate.end_line <= parent.end_line) {
                isDirectChild = false;
                break;
              }
            }
            
            if (isDirectChild) {
              await this.neo4j.createSymbolRelationship({
                from: parent.id,
                to: child.id,
                type: 'contains',
                properties: {
                  direct: true
                }
              });
            }
          }
        }
      }
    }
  }

  /**
   * Calculate cyclomatic complexity for functions
   */
  private async calculateComplexityMetrics(): Promise<void> {
    // This would analyze the code to calculate complexity
    // For now, we'll use a simple heuristic based on lines of code
    console.log('   Complexity calculation would be implemented here');
  }

  /**
   * Map SQLite symbol types to our symbol types
   */
  private mapSymbolType(type: string): SymbolNode['type'] {
    const mapping: Record<string, SymbolNode['type']> = {
      'function': 'function',
      'method': 'function',
      'class': 'class',
      'interface': 'class',
      'variable': 'variable',
      'constant': 'variable',
      'module': 'module',
      'namespace': 'module',
      'import': 'import',
      'export': 'import'
    };

    return mapping[type.toLowerCase()] || 'variable';
  }

  /**
   * Map reference types to relationship types
   */
  private mapReferenceType(refType: string): SymbolRelationship['type'] {
    const mapping: Record<string, SymbolRelationship['type']> = {
      'call': 'calls',
      'import': 'imports',
      'extends': 'extends',
      'implements': 'implements',
      'uses': 'references',
      'type': 'references'
    };

    return mapping[refType.toLowerCase()] || 'references';
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(): Promise<{
    sqliteSymbols: number;
    sqliteReferences: number;
    neo4jSymbols: number;
    neo4jRelationships: number;
  }> {
    const sqliteSymbolCount = await this.dbGet('SELECT COUNT(*) as count FROM symbols');
    const sqliteRefCount = await this.dbGet('SELECT COUNT(*) as count FROM symbol_edges');
    
    const neo4jStats = await this.neo4j.healthCheck();
    
    return {
      sqliteSymbols: sqliteSymbolCount?.count || 0,
      sqliteReferences: sqliteRefCount?.count || 0,
      neo4jSymbols: neo4jStats.nodeCount,
      neo4jRelationships: neo4jStats.relationshipCount
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const sqlitePath = path.join(process.cwd(), '.guru', 'guru.db');
  const engine = new SymbolMigrationEngine(sqlitePath);
  
  engine.connect()
    .then(() => engine.migrateSymbolsToNeo4j())
    .then(stats => {
      console.log('\n📊 Migration Complete:');
      console.log(`   Symbols created: ${stats.symbolsCreated}`);
      console.log(`   Relationships created: ${stats.relationshipsCreated}`);
      if (stats.errors.length > 0) {
        console.log(`   Errors: ${stats.errors.length}`);
        stats.errors.slice(0, 10).forEach(err => console.log(`     - ${err}`));
      }
    })
    .catch(console.error)
    .finally(() => engine.disconnect());
}