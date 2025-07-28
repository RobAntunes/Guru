import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as os from 'os';
import YAML from "yaml";

export type ScanMode = "full" | "incremental" | "auto";
export type AIOutputFormat = "json" | "protobuf";

export interface GuruConfig {
  scanMode: ScanMode;
  cacheCompression: boolean;
  cacheDir: string;
  aiOutputFormat: AIOutputFormat;
  language?: string;
  includeTests: boolean;
  maxParallelism?: string;
  excludedDirs?: string[];
  maxFileSize: number;
  excludePatterns: string[];
  includeExtensions: string[];
  workerPoolSize: number;
  chunkSize: number;
  memoryLimit: number;
  
  // Database configuration
  database: {
    enabled: boolean;
    path?: string;
    enableWAL: boolean;
    memoryOptimized: boolean;
    pragmas: Record<string, any>;
    maxConnections: number;
    busyTimeout: number;
  };
  
  // Memory optimization settings
  memory: {
    symbolCacheSize: number;
    fileCacheSize: number;
    dependencyGraphSize: number;
    workerMemoryThreshold: number;
    gcThreshold: number;
  };
  
  // Performance settings
  performance: {
    enableStreaming: boolean;
    batchSize: number;
    concurrentAnalysis: boolean;
    adaptiveWorkerScaling: boolean;
  };
}

const DEFAULT_CONFIG: GuruConfig = {
  scanMode: "auto",
  cacheCompression: true,
  cacheDir: ".guru/cache",
  aiOutputFormat: "json",
  language: "typescript",
  includeTests: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/.vscode/**',
    '**/.idea/**',
    '**/target/**',
    '**/out/**',
    '**/.next/**',
    '**/*.log',
    '**/*.tmp',
    '**/*.temp'
  ],
  includeExtensions: [
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
    '.py', '.rb', '.go', '.rs', '.java', '.kt', '.scala',
    '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.swift',
    '.dart', '.lua', '.r', '.m', '.pl', '.sh', '.ps1',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.md',
    '.sql', '.graphql', '.proto', '.thrift'
  ],
  workerPoolSize: Math.max(2, Math.min(8, os.cpus().length)),
  chunkSize: 100,
  memoryLimit: 512 * 1024 * 1024, // 512MB

  // Database configuration
  database: {
    enabled: true,
    enableWAL: true,
    memoryOptimized: true,
    pragmas: {
      cache_size: 64000,        // 64MB cache
      temp_store: 'memory',
      mmap_size: 268435456,     // 256MB
      synchronous: 'NORMAL',
      journal_size_limit: 67108864, // 64MB journal
      auto_vacuum: 'INCREMENTAL'
    },
    maxConnections: 10,
    busyTimeout: 5000
  },

  // Memory optimization settings
  memory: {
    symbolCacheSize: 100,        // LRU cache entries
    fileCacheSize: 500,          // File analysis cache entries
    dependencyGraphSize: 1000,   // Dependency graph entries
    workerMemoryThreshold: 256 * 1024 * 1024, // 256MB
    gcThreshold: 384 * 1024 * 1024 // 384MB
  },

  // Performance settings
  performance: {
    enableStreaming: true,
    batchSize: 50,
    concurrentAnalysis: true,
    adaptiveWorkerScaling: true
  }
};

export const DEFAULT_EXCLUDED_DIRS = [
  'node_modules', '.git', 'build', 'dist', '.next', '.expo', 'coverage', '.cache', '.turbo', 'out', 'tmp', 'temp', '.vscode', '.idea', '.husky', '.storybook', '.expo-shared', '.env', '.DS_Store'
];

function loadConfigFile(projectRoot: string): Partial<GuruConfig> {
  const jsonPath = path.join(projectRoot, "guru.config.json");
  const yamlPath = path.join(projectRoot, "guru.config.yaml");
  if (fs.existsSync(jsonPath)) {
    try {
      const data = fs.readFileSync(jsonPath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse guru.config.json:", e);
    }
  } else if (fs.existsSync(yamlPath)) {
    try {
      const data = fs.readFileSync(yamlPath, "utf-8");
      return YAML.parse(data);
    } catch (e) {
      console.error("Failed to parse guru.config.yaml:", e);
    }
  }
  return {};
}

function loadEnvOverrides(): Partial<GuruConfig> {
  const env: Partial<GuruConfig> = {};
  if (process.env.GURU_SCAN_MODE) env.scanMode = process.env.GURU_SCAN_MODE as ScanMode;
  if (process.env.GURU_CACHE_COMPRESSION)
    env.cacheCompression = process.env.GURU_CACHE_COMPRESSION === "true";
  if (process.env.GURU_CACHE_DIR) env.cacheDir = process.env.GURU_CACHE_DIR;
  if (process.env.GURU_AI_OUTPUT_FORMAT)
    env.aiOutputFormat = process.env.GURU_AI_OUTPUT_FORMAT as AIOutputFormat;
  if (process.env.GURU_MAX_PARALLELISM) env.maxParallelism = process.env.GURU_MAX_PARALLELISM;
  if (process.env.GURU_EXCLUDED_DIRS) env.excludedDirs = process.env.GURU_EXCLUDED_DIRS.split(',');
  if (process.env.GURU_WORKER_POOL_SIZE) env.workerPoolSize = parseInt(process.env.GURU_WORKER_POOL_SIZE, 10);
  if (process.env.GURU_MEMORY_LIMIT) env.memoryLimit = parseInt(process.env.GURU_MEMORY_LIMIT, 10);
  if (process.env.GURU_DB_DISABLED === 'true') env.database = { ...DEFAULT_CONFIG.database, enabled: false };
  return env;
}

function validateConfig(config: Partial<GuruConfig>): GuruConfig {
  const validated = { ...DEFAULT_CONFIG, ...config };
  
  // Ensure cache directory exists
  if (!fs.existsSync(validated.cacheDir)) {
    fs.mkdirSync(validated.cacheDir, { recursive: true });
  }
  
  // Validate worker pool size
  validated.workerPoolSize = Math.max(1, Math.min(validated.workerPoolSize, 16));
  
  // Validate memory limits
  validated.memoryLimit = Math.max(128 * 1024 * 1024, validated.memoryLimit); // Min 128MB
  validated.memory.workerMemoryThreshold = Math.min(
    validated.memory.workerMemoryThreshold,
    validated.memoryLimit * 0.8
  );
  
  // Validate database settings
  if (validated.database.enabled && !validated.database.path) {
    validated.database.path = path.join(validated.cacheDir, 'guru.db');
  }
  
  return validated;
}

function loadGuruConfig(projectRoot: string = process.cwd()): GuruConfig {
  const fileConfig = loadConfigFile(projectRoot);
  const envConfig = loadEnvOverrides();
  const merged = validateConfig(fileConfig);
  return merged;
}

export let guruConfig = loadGuruConfig();

// Allow max parallelism to be set via env or config
export const guruMaxParallelism =
  Number(process.env.GURU_MAX_PARALLELISM) ||
  (guruConfig.maxParallelism ? Number(guruConfig.maxParallelism) : os.cpus().length);

export const guruExcludedDirs =
  (process.env.GURU_EXCLUDED_DIRS ? process.env.GURU_EXCLUDED_DIRS.split(',') :
    (guruConfig.excludedDirs ? guruConfig.excludedDirs : DEFAULT_EXCLUDED_DIRS));

function findConfigFile(): string | null {
  const configNames = [".guru.yaml", ".guru.yml", "guru.config.yaml", "guru.config.yml"];
  
  for (const name of configNames) {
    try {
      const configPath = path.resolve(process.cwd(), name);
      fs.statSync(configPath);
      return configPath;
    } catch {
      continue;
    }
  }
  
  return null;
} 