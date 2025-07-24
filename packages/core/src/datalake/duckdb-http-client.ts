/**
 * HTTP client for DuckDB server
 * Provides an alternative to embedded DuckDB that works better in test environments
 */

export interface DuckDBHttpConfig {
  baseUrl: string;
  timeout?: number;
}

export interface QueryResult {
  columns: string[];
  data: any[][];
  row_count: number;
  execution_time_ms: number;
}

export class DuckDBHttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: DuckDBHttpConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:8080';
    this.timeout = config.timeout || 30000;
  }

  async query(sql: string, params: Record<string, any> = {}): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DuckDB query failed: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create a compatibility layer that mimics duckdb-async API
   */
  createCompatibilityLayer() {
    const client = this;
    
    return {
      all: async (sql: string) => {
        const result = await client.query(sql);
        // Transform to match duckdb-async format
        return result.data.map(row => {
          const obj: any = {};
          result.columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });
      },
      run: async (sql: string) => {
        const result = await client.query(sql);
        return { changes: result.row_count };
      },
      exec: async (sql: string) => {
        await client.query(sql);
      },
      prepare: (sql: string) => ({
        all: async (...params: any[]) => {
          const result = await client.query(sql, { params });
          return result.data.map(row => {
            const obj: any = {};
            result.columns.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });
        },
        run: async (...params: any[]) => {
          const result = await client.query(sql, { params });
          return { changes: result.row_count };
        },
        get: async (...params: any[]) => {
          const result = await client.query(sql, { params });
          if (result.data.length === 0) return undefined;
          const obj: any = {};
          result.columns.forEach((col, idx) => {
            obj[col] = result.data[0][idx];
          });
          return obj;
        }
      }),
      close: () => Promise.resolve(),
      transaction: (fn: Function) => fn
    };
  }
}

/**
 * Factory function to create DuckDB client based on environment
 */
export async function createDuckDBClient(preferHttp = false): Promise<any> {
  // Only use HTTP client for tests or if explicitly requested
  const useHttp = preferHttp || 
    process.env.DUCKDB_USE_HTTP === 'true' ||
    (process.env.NODE_ENV === 'test' && process.env.DUCKDB_FORCE_EMBEDDED !== 'true');

  if (useHttp) {
    const httpClient = new DuckDBHttpClient({
      baseUrl: process.env.DUCKDB_HTTP_URL || 'http://localhost:8080'
    });
    
    // Check if server is available
    const isHealthy = await httpClient.health();
    if (isHealthy) {
      console.log('🦆 Using DuckDB HTTP server');
      return httpClient.createCompatibilityLayer();
    }
  }

  // Fall back to embedded DuckDB
  try {
    const { Database } = await import('duckdb-async');
    console.log('🦆 Using embedded DuckDB');
    return new Database(':memory:');
  } catch (error) {
    console.warn('Failed to load embedded DuckDB:', error);
    throw new Error('No DuckDB implementation available');
  }
}