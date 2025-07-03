/**
 * Tree-sitter Language Support
 * 
 * Handles loading and managing tree-sitter parsers for different languages
 */

import Parser from 'tree-sitter';

// Language imports - these will be installed via npm
let JavaScript: any;
let TypeScript: any = null;
let Python: any;
let TSX: any = null;

// Lazy load languages to avoid import issues
const loadLanguages = async () => {
  if (!JavaScript) {
    try {
      JavaScript = (await import('tree-sitter-javascript')).default;
      TypeScript = (await import('tree-sitter-typescript')).typescript;
      Python = (await import('tree-sitter-python')).default;
    } catch (error) {
      console.error('Failed to load tree-sitter languages:', error);
    }
  }
  try {
    TypeScript = (await import('tree-sitter-typescript')).typescript;
    console.error('[LANG][DEBUG] Loaded tree-sitter-typescript parser');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[LANG][ERROR] Failed to load tree-sitter-typescript:', err.stack || err.message);
    } else {
      console.error('[LANG][ERROR] Failed to load tree-sitter-typescript:', err);
    }
  }
  try {
    TSX = (await import('tree-sitter-typescript')).tsx;
    console.error('[LANG][DEBUG] Loaded tree-sitter-tsx parser');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[LANG][ERROR] Failed to load tree-sitter-tsx:', err.stack || err.message);
    } else {
      console.error('[LANG][ERROR] Failed to load tree-sitter-tsx:', err);
    }
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

  async initialize() {
    await loadLanguages();
    
    // Initialize parsers for each language
    if (JavaScript) {
      const jsParser = new Parser();
      jsParser.setLanguage(JavaScript);
      this.parsers.set('javascript', jsParser);
      this.parsers.set('js', jsParser);
    }

    if (TypeScript) {
      const tsParser = new Parser();
      tsParser.setLanguage(TypeScript);
      this.parsers.set('typescript', tsParser);
      this.parsers.set('ts', tsParser);
    }

    if (Python) {
      const pyParser = new Parser();
      pyParser.setLanguage(Python);
      this.parsers.set('python', pyParser);
      this.parsers.set('py', pyParser);
    }

    console.error(`🌳 Initialized ${this.parsers.size} language parsers`);
  }

  detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const extMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'mjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'pyx': 'python',
      'pyi': 'python'
    };

    return extMap[ext || ''] || 'unknown';
  }

  async parseFile(filePath: string, source: string): Promise<ParseResult | null> {
    const language = this.detectLanguage(filePath);
    const parser = this.parsers.get(language);

    if (!parser) {
      console.error(`⚠️ No parser available for language: ${language}`);
      return null;
    }

    try {
      const tree = parser.parse(source);
      return {
        tree,
        language,
        source
      };
    } catch (error) {
      console.error(`❌ Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }
}

// Supported languages must include TypeScript and TSX
const supportedLanguages = [
  'javascript', 'js', 'typescript', 'ts', 'tsx', 'python', 'py'
];

// Language parser map
const parserMap: Record<string, any> = {};

let languageManager: LanguageManager | null = null;

async function loadParsers() {
  console.error('[LANG][DEBUG] loadParsers() called');
  try {
    const JavaScript = (await import('tree-sitter-javascript')).default;
    parserMap['javascript'] = JavaScript;
    parserMap['js'] = JavaScript;
    console.error('[LANG][DEBUG] Loaded tree-sitter-javascript parser');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[LANG][ERROR] Failed to load tree-sitter-javascript:', err.stack || err.message);
    } else {
      console.error('[LANG][ERROR] Failed to load tree-sitter-javascript:', err);
    }
  }
  try {
    const TypeScriptPkg = await import('tree-sitter-typescript');
    const TypeScript = TypeScriptPkg.typescript;
    const TSX = TypeScriptPkg.tsx;
    parserMap['typescript'] = TypeScript;
    parserMap['ts'] = TypeScript;
    parserMap['tsx'] = TSX;
    console.error('[LANG][DEBUG] Loaded tree-sitter-typescript and tsx parsers');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[LANG][ERROR] Failed to load tree-sitter-typescript:', err.stack || err.message);
    } else {
      console.error('[LANG][ERROR] Failed to load tree-sitter-typescript:', err);
    }
  }
  try {
    const Python = (await import('tree-sitter-python')).default;
    parserMap['python'] = Python;
    parserMap['py'] = Python;
    console.error('[LANG][DEBUG] Loaded tree-sitter-python parser');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[LANG][ERROR] Failed to load tree-sitter-python:', err.stack || err.message);
    } else {
      console.error('[LANG][ERROR] Failed to load tree-sitter-python:', err);
    }
  }
  console.error('[LANG][DEBUG] Supported languages after loading:', supportedLanguages);
  console.error('[LANG][DEBUG] Parser map keys after loading:', Object.keys(parserMap));
  languageManager = new LanguageManager();
  languageManager.parserMap = parserMap;
  languageManager.supportedLanguages = supportedLanguages;
  console.error('[LANG][DEBUG] LanguageManager constructed with loaded parsers');
}

// Export a promise that resolves to the ready languageManager
export const languageManagerReady: Promise<LanguageManager> = (async () => {
  console.error('[LANG][DEBUG] Starting parser loading at startup');
  await loadParsers();
  console.error('[LANG][DEBUG] Finished parser loading at startup');
  if (!languageManager) throw new Error('LanguageManager not initialized');
  
  // Initialize the parsers - we know languageManager is not null here
  const manager = languageManager as LanguageManager;
  await manager.initialize();
  console.error('[LANG][DEBUG] LanguageManager initialized with parsers');
  
  return manager;
})();
