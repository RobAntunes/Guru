import * as fs from "fs";
import * as path from "path";
import * as process from "process";
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
}

const DEFAULT_CONFIG: GuruConfig = {
  scanMode: "auto",
  cacheCompression: true,
  cacheDir: ".guru/cache",
  aiOutputFormat: "json",
  language: "typescript",
  includeTests: false,
};

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
  return env;
}

function validateConfig(config: Partial<GuruConfig>): GuruConfig {
  return {
    scanMode: ["full", "incremental", "auto"].indexOf(config.scanMode as string) !== -1
      ? (config.scanMode as ScanMode)
      : DEFAULT_CONFIG.scanMode,
    cacheCompression:
      typeof config.cacheCompression === "boolean"
        ? config.cacheCompression
        : DEFAULT_CONFIG.cacheCompression,
    cacheDir: typeof config.cacheDir === "string" && config.cacheDir.length > 0
      ? config.cacheDir
      : DEFAULT_CONFIG.cacheDir,
    aiOutputFormat: ["json", "protobuf"].indexOf(config.aiOutputFormat as string) !== -1
      ? (config.aiOutputFormat as AIOutputFormat)
      : DEFAULT_CONFIG.aiOutputFormat,
    language: typeof config.language === "string" && config.language.length > 0
      ? config.language
      : DEFAULT_CONFIG.language,
    includeTests: typeof config.includeTests === "boolean" 
      ? config.includeTests 
      : DEFAULT_CONFIG.includeTests,
  };
}

function loadGuruConfig(projectRoot: string = process.cwd()): GuruConfig {
  const fileConfig = loadConfigFile(projectRoot);
  const envConfig = loadEnvOverrides();
  const merged = { ...DEFAULT_CONFIG, ...fileConfig, ...envConfig };
  return validateConfig(merged);
}

export let guruConfig = loadGuruConfig();

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