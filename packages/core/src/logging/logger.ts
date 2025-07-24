/**
 * Simple Logger implementation for Guru
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = process.env.LOG_LEVEL ? 
      LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] : 
      LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}