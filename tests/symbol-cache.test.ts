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

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should miss on first access, set, then hit", () => {
    const cache = new SymbolCache(tempDir);
    expect(cache.getSymbols(testFile, hashA)).toBeNull(); // miss
    cache.setSymbols(testFile, hashA, symbolsA);
    expect(cache.getSymbols(testFile, hashA)).toEqual(symbolsA); // hit
  });

  it("should invalidate and miss after file change", () => {
    const cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    cache.invalidate(testFile);
    expect(cache.getSymbols(testFile, hashA)).toBeNull(); // miss after invalidate
  });

  it("should update symbols after file change and cache new hash", () => {
    const cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    cache.invalidate(testFile);
    cache.setSymbols(testFile, hashB, symbolsB);
    expect(cache.getSymbols(testFile, hashB)).toEqual(symbolsB); // hit new hash
    expect(cache.getSymbols(testFile, hashA)).toBeNull(); // old hash miss
  });

  it("should persist cache to disk and reload", () => {
    let cache = new SymbolCache(tempDir);
    cache.setSymbols(testFile, hashA, symbolsA);
    // Simulate process restart
    cache = new SymbolCache(tempDir);
    expect(cache.getSymbols(testFile, hashA)).toEqual(symbolsA); // hit after reload
  });
}); 