import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',  // Use forks for tests due to DuckDB native module issues
    poolOptions: {
      forks: {
        // Single fork mode can improve test performance
        singleFork: false
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        '**/*.test.ts'
      ]
    },
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@memory': resolve(__dirname, './src/memory'),
      '@storage': resolve(__dirname, './src/storage'),
      '@analysis': resolve(__dirname, './src/analysis')
    }
  }
});