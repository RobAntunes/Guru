import { describe, it, expect, beforeEach } from 'vitest';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { performance } from 'perf_hooks';

describe('Guru Stress & Edge Case Testing', () => {
  let Guru: any;
  let guru: any;

  beforeEach(async () => {
    ({ Guru } = await import('../dist/index.js'));
    guru = new Guru();
  });

  describe('Large Codebase Stress Testing', () => {
    it('should handle massive files efficiently', async () => {
      console.log('\n🔥 STRESS TEST: Large File Handling');
      
      // Generate a large TypeScript file (1000+ lines)
      const largeCode = Array.from({ length: 1000 }, (_, i) => `
        class Component${i} {
          private data${i}: string = "value${i}";
          
          process${i}(input: any): any {
            const result = this.transform${i}(input);
            return this.validate${i}(result);
          }
          
          private transform${i}(data: any): any {
            return { ...data, id: ${i} };
          }
          
          private validate${i}(data: any): any {
            if (!data) throw new Error('Invalid data ${i}');
            return data;
          }
        }
        
        export const component${i} = new Component${i}();
      `).join('\n');
      
      const testFile = './stress-large-file.ts';
      
      try {
        await writeFile(testFile, largeCode);
        
        const startTime = performance.now();
        const result = await guru.analyzeCodebase({ path: testFile });
        const analysisTime = performance.now() - startTime;
        
        console.log(`    📊 Large file (${largeCode.length} chars): ${analysisTime.toFixed(2)}ms`);
        console.log(`    🎯 Symbols extracted: ${result.symbolGraph.symbols.size}`);
        console.log(`    🔗 Relationships: ${result.symbolGraph.edges.length}`);
        
        // Should handle large files under 5 seconds
        expect(analysisTime).toBeLessThan(5000);
        // Should extract significant number of symbols
        expect(result.symbolGraph.symbols.size).toBeGreaterThan(100);
        
      } finally {
        await unlink(testFile).catch(() => {});
      }
    });

    it('should handle deeply nested structures', async () => {
      console.log('\n🌀 STRESS TEST: Deep Nesting');
      
      const deepNestingCode = `
        function level1() {
          function level2() {
            function level3() {
              function level4() {
                function level5() {
                  function level6() {
                    function level7() {
                      function level8() {
                        function level9() {
                          function level10() {
                            return "deeply nested";
                          }
                          return level10();
                        }
                        return level9();
                      }
                      return level8();
                    }
                    return level7();
                  }
                  return level6();
                }
                return level5();
              }
              return level4();
            }
            return level3();
          }
          return level2();
        }
      `;
      
      const testFile = './stress-deep-nesting.ts';
      
      try {
        await writeFile(testFile, deepNestingCode);
        
        const startTime = performance.now();
        const result = await guru.analyzeCodebase({ path: testFile });
        const analysisTime = performance.now() - startTime;
        
        console.log(`    🌀 Deep nesting analysis: ${analysisTime.toFixed(2)}ms`);
        console.log(`    🎯 Functions detected: ${result.symbolGraph.symbols.size}`);
        
        // Should handle deep nesting without stack overflow
        expect(analysisTime).toBeLessThan(1000);
        expect(result.symbolGraph.symbols.size).toBeGreaterThan(5);
        
      } finally {
        await unlink(testFile).catch(() => {});
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should gracefully handle malformed code', async () => {
      console.log('\n⚠️  EDGE CASE: Malformed Code');
      
      const malformedCodes = [
        'function incomplete() { // missing closing brace',
        'class { // no name',
        '((((((((( // unmatched parens',
        'import { from // incomplete import',
        'const x = ; // missing value'
      ];
      
      for (const [index, code] of malformedCodes.entries()) {
        const testFile = `./edge-malformed-${index}.ts`;
        
        try {
          await writeFile(testFile, code);
          
          const result = await guru.analyzeCodebase({ path: testFile });
          
          // Should not crash on malformed code
          expect(result).toBeDefined();
          expect(result.symbolGraph).toBeDefined();
          
          console.log(`    ✅ Handled malformed code ${index + 1}: ${result.symbolGraph.symbols.size} symbols`);
          
        } finally {
          await unlink(testFile).catch(() => {});
        }
      }
    });

    it('should handle empty and minimal files', async () => {
      console.log('\n📭 EDGE CASE: Empty & Minimal Files');
      
      const edgeCases = [
        '', // completely empty
        '// just a comment',
        '\n\n\n', // just whitespace
        'const x = 1;', // minimal code
        'export default {};' // minimal export
      ];
      
      for (const [index, code] of edgeCases.entries()) {
        const testFile = `./edge-minimal-${index}.ts`;
        
        try {
          await writeFile(testFile, code);
          
          const result = await guru.analyzeCodebase({ path: testFile });
          
          expect(result).toBeDefined();
          expect(result.symbolGraph.symbols.size).toBeGreaterThanOrEqual(0);
          
          console.log(`    ✅ Handled edge case ${index + 1}: ${result.symbolGraph.symbols.size} symbols`);
          
        } finally {
          await unlink(testFile).catch(() => {});
        }
      }
    });

    it('should handle non-existent files gracefully', async () => {
      console.log('\n🚫 EDGE CASE: Non-existent Files');
      
      const result = await guru.analyzeCodebase({ path: './does-not-exist.ts' });
      
      // Should return a defined result even for missing files
      expect(result).toBeDefined();
      expect(result.symbolGraph.symbols.size).toBe(0);
      
      console.log('    ✅ Handled non-existent file gracefully');
    });
  });

  describe('Memory & Performance Stress', () => {
    it('should not leak memory on repeated analysis', async () => {
      console.log('\n🧠 STRESS TEST: Memory Leak Detection');
      
      const testCode = `
        class TestClass {
          method() { return "test"; }
        }
        export default TestClass;
      `;
      
      const testFile = './stress-memory-test.ts';
      
      try {
        await writeFile(testFile, testCode);
        
        const iterations = 50;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          await guru.analyzeCodebase({ path: testFile });
          const analysisTime = performance.now() - startTime;
          times.push(analysisTime);
        }
        
        // Performance should remain consistent (no memory leaks causing slowdown)
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        console.log(`    📊 ${iterations} iterations - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
        
        // Max time shouldn't be more than 3x average (indicating memory issues)
        expect(maxTime).toBeLessThan(avgTime * 3);
        
      } finally {
        await unlink(testFile).catch(() => {});
      }
    });

    it('should handle concurrent analysis requests', async () => {
      console.log('\n⚡ STRESS TEST: Concurrent Analysis');
      
      const testCodes = Array.from({ length: 10 }, (_, i) => ({
        code: `
          class Concurrent${i} {
            async process${i}() {
              return Promise.resolve("result${i}");
            }
          }
        `,
        file: `./stress-concurrent-${i}.ts`
      }));
      
      try {
        // Create all test files
        await Promise.all(testCodes.map(({ code, file }) => writeFile(file, code)));
        
        const startTime = performance.now();
        
        // Run concurrent analyses
        const results = await Promise.all(
          testCodes.map(({ file }) => guru.analyzeCodebase({ path: file }))
        );
        
        const totalTime = performance.now() - startTime;
        
        console.log(`    ⚡ ${testCodes.length} concurrent analyses: ${totalTime.toFixed(2)}ms`);
        
        // All should succeed
        expect(results).toHaveLength(testCodes.length);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result.symbolGraph.symbols.size).toBeGreaterThan(0);
        });
        
        // Should complete in reasonable time
        expect(totalTime).toBeLessThan(3000);
        
      } finally {
        // Cleanup
        await Promise.all(testCodes.map(({ file }) => unlink(file).catch(() => {})));
      }
    });
  });

  describe('Real-World Scenario Testing', () => {
    it('should handle mixed language project structure', async () => {
      console.log('\n🌍 REAL-WORLD: Mixed Language Project');
      
      const projectStructure = {
        'project/src/utils.ts': `
          export function calculateHash(data: string): string {
            return data.split('').reverse().join('');
          }
        `,
        'project/src/main.js': `
          import { calculateHash } from './utils.js';
          
          function main() {
            const result = calculateHash("test");
            console.log(result);
          }
          
          main();
        `,
        'project/scripts/process.py': `
          def process_data(input_data):
              return input_data.upper()
          
          if __name__ == "__main__":
              result = process_data("hello")
              print(result)
        `
      };
      
      try {
        // Create directory structure
        await mkdir('project/src', { recursive: true });
        await mkdir('project/scripts', { recursive: true });
        
        // Create all files
        await Promise.all(
          Object.entries(projectStructure).map(([file, code]) => writeFile(file, code))
        );
        
        // Analyze each file
        const results = await Promise.all(
          Object.keys(projectStructure).map(file => guru.analyzeCodebase({ path: file }))
        );
        
        console.log(`    📁 Analyzed ${results.length} files in mixed project`);
        
        results.forEach((result, index) => {
          const file = Object.keys(projectStructure)[index];
          console.log(`    ✅ ${file}: ${result.symbolGraph.symbols.size} symbols`);
          expect(result.symbolGraph.symbols.size).toBeGreaterThan(0);
        });
        
      } finally {
        // Cleanup
        await Promise.all(
          Object.keys(projectStructure).map(file => unlink(file).catch(() => {}))
        );
        await unlink('project/src').catch(() => {});
        await unlink('project/scripts').catch(() => {});
        await unlink('project').catch(() => {});
      }
    });
  });
}); 