/**
 * Simple logger utility for harmonic intelligence system
 * @module utils
 */

export class Logger {
  private readonly context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  debug(...args: any[]): void {
    if (process.env.NODE_ENV !== 'test') {
      console.debug(`[${this.context}]`, ...args);
    }
  }
  
  info(...args: any[]): void {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`[${this.context}]`, ...args);
    }
  }
  
  warn(...args: any[]): void {
    console.warn(`[${this.context}]`, ...args);
  }
  
  error(...args: any[]): void {
    console.error(`[${this.context}]`, ...args);
  }
}