/**
 * Tree-sitter Language Support
 *
 * Handles loading and managing tree-sitter parsers for different languages
 */

import Parser from "tree-sitter";

// Language imports - these will be installed via npm
let JavaScript: any;
let TypeScript: any = null;
let Python: any;
let TSX: any = null;

// Track initialization state
let languagesInitialized = false;
let initializationError: Error | null = null;

// Lazy load languages to avoid import issues
const loadLanguages = async () => {
  if (languagesInitialized) return;

  try {
    console.error("[LANG][DEBUG] Loading tree-sitter languages...");

    // Try to load each language with individual error handling
    try {
      JavaScript = (await import("tree-sitter-javascript")).default;
      console.error("[LANG][DEBUG] ✅ JavaScript parser loaded");
    } catch (error) {
      console.error(
        "[LANG][ERROR] Failed to load tree-sitter-javascript:",
        error instanceof Error ? error.message : String(error),
      );
    }

    try {
      const tsModule = await import("tree-sitter-typescript");
      TypeScript = tsModule.default.typescript;
      TSX = tsModule.default.tsx;
      console.error("[LANG][DEBUG] ✅ TypeScript parsers loaded");
    } catch (error) {
      console.error(
        "[LANG][ERROR] Failed to load tree-sitter-typescript:",
        error instanceof Error ? error.message : String(error),
      );
    }

    try {
      Python = (await import("tree-sitter-python")).default;
      console.error("[LANG][DEBUG] ✅ Python parser loaded");
    } catch (error) {
      console.error(
        "[LANG][ERROR] Failed to load tree-sitter-python:",
        error instanceof Error ? error.message : String(error),
      );
    }

    languagesInitialized = true;
    console.error("[LANG][DEBUG] Language loading complete");
  } catch (error) {
    initializationError = error as Error;
    console.error("[LANG][ERROR] Failed to load tree-sitter languages:", error);
    throw error;
  }
};

export interface ParseResult {
  tree: Parser.Tree;
  language: string;
  source: string;
}

export class LanguageManager {
  private parsers: Map<string, Parser> = new Map();
  parserMap!: Record<string, any>;
  supportedLanguages!: string[];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load languages directly in this method for reliability
      console.error("[LANG][DEBUG] Loading tree-sitter languages directly...");

      let localJavaScript: any = null;
      let localTypeScript: any = null;
      let localTSX: any = null;
      let localPython: any = null;

      // Load each language with individual error handling
      try {
        localJavaScript = (await import("tree-sitter-javascript")).default;
        console.error("[LANG][DEBUG] ✅ JavaScript parser loaded");
      } catch (error) {
        console.error(
          "[LANG][ERROR] Failed to load tree-sitter-javascript:",
          error instanceof Error ? error.message : String(error),
        );
      }

      try {
        const tsModule = await import("tree-sitter-typescript");
        // TypeScript module loaded successfully

        localTypeScript = tsModule.default.typescript;
        localTSX = tsModule.default.tsx;
        console.error("[LANG][DEBUG] ✅ TypeScript parsers loaded");
      } catch (error) {
        console.error(
          "[LANG][ERROR] Failed to load tree-sitter-typescript:",
          error instanceof Error ? error.message : String(error),
        );
      }

      try {
        localPython = (await import("tree-sitter-python")).default;
        console.error("[LANG][DEBUG] ✅ Python parser loaded");
      } catch (error) {
        console.error(
          "[LANG][ERROR] Failed to load tree-sitter-python:",
          error instanceof Error ? error.message : String(error),
        );
      }

      // Initialize parsers for each language with safe error handling
      let parsersCreated = 0;

      if (localJavaScript) {
        try {
          const jsParser = new Parser();
          jsParser.setLanguage(localJavaScript);
          this.parsers.set("javascript", jsParser);
          this.parsers.set("js", jsParser);
          console.error(
            "[LANG][DEBUG] ✅ JavaScript parser created and registered",
          );
          parsersCreated++;
        } catch (error) {
          console.error(
            "[LANG][ERROR] Failed to create JavaScript parser:",
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      if (localTypeScript) {
        try {
          console.error("[LANG][DEBUG] Creating TypeScript parser...");
          const tsParser = new Parser();
          tsParser.setLanguage(localTypeScript);
          this.parsers.set("typescript", tsParser);
          this.parsers.set("ts", tsParser);
          console.error(
            "[LANG][DEBUG] ✅ TypeScript parser created and registered",
          );
          parsersCreated++;
        } catch (error) {
          console.error(
            "[LANG][ERROR] Failed to create TypeScript parser:",
            error instanceof Error ? error.message : String(error),
          );
        }
      } else {
        console.error(
          "[LANG][DEBUG] ❌ TypeScript language module not available",
        );
      }

      if (localTSX) {
        try {
          console.error("[LANG][DEBUG] Creating TSX parser...");
          const tsxParser = new Parser();
          tsxParser.setLanguage(localTSX);
          this.parsers.set("tsx", tsxParser);
          console.error("[LANG][DEBUG] ✅ TSX parser created and registered");
          parsersCreated++;
        } catch (error) {
          console.error(
            "[LANG][ERROR] Failed to create TSX parser:",
            error instanceof Error ? error.message : String(error),
          );
        }
      } else {
        console.error("[LANG][DEBUG] ❌ TSX language module not available");
      }

      if (localPython) {
        try {
          const pyParser = new Parser();
          pyParser.setLanguage(localPython);
          this.parsers.set("python", pyParser);
          this.parsers.set("py", pyParser);
          console.error(
            "[LANG][DEBUG] ✅ Python parser created and registered",
          );
          parsersCreated++;
        } catch (error) {
          console.error(
            "[LANG][ERROR] Failed to create Python parser:",
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      console.error(
        `🌳 Initialized ${parsersCreated} language parsers successfully`,
      );
      this.isInitialized = true;
    } catch (error) {
      console.error(
        "[LANG][ERROR] Failed to initialize LanguageManager:",
        error,
      );
      // Don't throw - let the system continue with limited functionality
      this.isInitialized = true; // Mark as initialized even if partial failure
    }
  }

  detectLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const extMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      ts: "typescript",
      tsx: "tsx", // Keep TSX separate if available
      py: "python",
      pyx: "python",
      pyi: "python",
    };

    return extMap[ext || ""] || "unknown";
  }

  async parseFile(
    filePath: string,
    source: string,
  ): Promise<ParseResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const language = this.detectLanguage(filePath);
    const parser = this.parsers.get(language);

    if (!parser) {
      console.error(
        `⚠️ No parser available for language: ${language} (${filePath})`,
      );
      return null;
    }

    // Validate parser and source
    if (typeof parser.parse !== "function") {
      console.error(
        `❌ Parser for ${language} does not have a parse() method. (${filePath})`,
      );
      return null;
    }

    if (typeof source !== "string" || !source.trim()) {
      console.error(`❌ Invalid source for ${filePath}`);
      return null;
    }

    try {
      // Add timeout protection for parsing
      const parsePromise = new Promise<Parser.Tree>((resolve, reject) => {
        try {
          const tree = parser.parse(source);
          resolve(tree);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<Parser.Tree>((_, reject) => {
        setTimeout(() => reject(new Error("Parse timeout")), 5000); // 5 second timeout
      });

      const tree = await Promise.race([parsePromise, timeoutPromise]);

      if (!tree || !tree.rootNode) {
        console.error(`❌ Tree-sitter returned invalid tree for ${filePath}`);
        return null;
      }

      return {
        tree,
        language,
        source,
      };
    } catch (error) {
      console.error(
        `❌ Tree-sitter failed to parse ${filePath}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }
}

// Supported languages must include TypeScript and TSX
const supportedLanguages = [
  "javascript",
  "js",
  "typescript",
  "ts",
  "tsx",
  "python",
  "py",
];

// Language parser map
const parserMap: Record<string, any> = {};

let languageManager: LanguageManager | null = null;

async function loadParsers() {
  try {
    await loadLanguages();

    if (JavaScript) {
      parserMap["javascript"] = JavaScript;
      parserMap["js"] = JavaScript;
    }

    if (TypeScript) {
      parserMap["typescript"] = TypeScript;
      parserMap["ts"] = TypeScript;
    }

    if (TSX) {
      parserMap["tsx"] = TSX;
    }

    if (Python) {
      parserMap["python"] = Python;
      parserMap["py"] = Python;
    }

    languageManager = new LanguageManager();
    languageManager.parserMap = parserMap;
    languageManager.supportedLanguages = supportedLanguages;
  } catch (error) {
    console.error("[LANG][ERROR] Failed to load parsers:", error);
    // Create a minimal language manager even if parsing fails
    languageManager = new LanguageManager();
    languageManager.parserMap = {};
    languageManager.supportedLanguages = [];
  }
}

// Export a promise that resolves to the ready languageManager
export const languageManagerReady: Promise<LanguageManager> = (async () => {
  console.error("[LANG][DEBUG] Starting parser loading at startup");
  await loadParsers();
  console.error("[LANG][DEBUG] Finished parser loading at startup");

  if (!languageManager) {
    throw new Error("LanguageManager not initialized");
  }

  // Initialize the parsers - we know languageManager is not null here
  const manager = languageManager as LanguageManager;
  await manager.initialize();
  console.error("[LANG][DEBUG] LanguageManager initialized with parsers");

  return manager;
})();

export { supportedLanguages, parserMap };
