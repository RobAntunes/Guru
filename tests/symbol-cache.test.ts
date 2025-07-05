import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { SymbolCache, CachedSymbol } from "../src/core/symbol-cache";
import * as fs from "fs";
import * as path from "path";

describe("SymbolCache", () => {
  const tempDir = path.join(__dirname, "temp-symbol-cache");
  const cacheFile = path.join(tempDir, "symbol-cache.json");
  const testFile = path.join(tempDir, "test.ts");
  const symbolsA: CachedSymbol[] = [
    { name: "foo", kind: "function", location: "1:1" },
  ];
  const symbolsB: CachedSymbol[] = [
    { name: "bar", kind: "function", location: "2:1" },
  ];
  const hashA = "hashA";
  const hashB = "hashB";

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(testFile, "export function foo() {}\n");
  });

  afterEach(async () => {
    if (global.guru) {
      try {
        console.log('[CLEANUP][afterEach] Calling global.guru.cleanup()');
        await global.guru.cleanup();
        console.log('[CLEANUP][afterEach] global.guru.cleanup() complete');
      } catch (e) {
        console.error('[CLEANUP][afterEach] global.guru.cleanup() error', e);
      }
    }
    // Add any temp file/dir cleanup here
  });

  afterAll(async () => {
    if (global.guru) {
      try {
        console.log('[CLEANUP][afterAll] Calling global.guru.cleanup()');
        await global.guru.cleanup();
        console.log('[CLEANUP][afterAll] global.guru.cleanup() complete');
      } catch (e) {
        console.error('[CLEANUP][afterAll] global.guru.cleanup() error', e);
      }
    }
    // TEMP: Uncomment to force exit if hangs persist
    // process.exit(0);
    // Clean up any pending writes
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("should miss on first access, set, then hit", async () => {
    const cache = new SymbolCache(tempDir);
    expect(await cache.getSymbols(testFile, hashA)).toBeNull(); // miss
    cache.setSymbols(testFile, hashA, symbolsA);
    expect(await cache.getSymbols(testFile, hashA)).toEqual(symbolsA); // hit
    await cache.flush(); // Clean up
  });

  it("should invalidate and miss after file change", async () => {
    const cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    expect(await cache.getSymbols(testFile, hashA)).toEqual(symbolsA); // verify set
    cache.invalidate(testFile);
    expect(await cache.getSymbols(testFile, hashA)).toBeNull(); // miss after invalidate
    await cache.flush(); // Clean up
  });

  it("should update symbols after file change and cache new hash", async () => {
    const cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    cache.invalidate(testFile);
    cache.setSymbols(testFile, hashB, symbolsB);
    expect(await cache.getSymbols(testFile, hashB)).toEqual(symbolsB); // hit new hash
    expect(await cache.getSymbols(testFile, hashA)).toBeNull(); // old hash miss
    await cache.flush(); // Clean up
  });

  it("should persist cache to disk and reload", async () => {
    let cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    await cache.flush(); // Ensure write to disk
    
    // Simulate process restart
    cache = new SymbolCache(tempDir);
    expect(await cache.getSymbols(testFile, hashA)).toEqual(symbolsA); // hit after reload
    await cache.flush(); // Clean up
  });
}); 