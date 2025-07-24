// Test setup file to fix DuckDB initialization issues
import { beforeAll } from 'vitest';

// Fix for duckdb-async initialization error in tests
beforeAll(() => {
  // Ensure global object exists for duckdb
  if (typeof global === 'undefined') {
    (globalThis as any).global = globalThis;
  }
});