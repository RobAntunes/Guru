import { createClient, RedisClientType } from 'redis';
import { HarmonicPatternMemory } from '../memory/types.js';
import { config } from 'dotenv';

config();

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keyCount: number;
  memoryUsage: string;
}

export class RedisCache {
  private client: RedisClientType;
  private connected: boolean = false;
  private stats = { hits: 0, misses: 0 };

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
    
    this.client.on('connect', () => {
      console.log('🔗 Redis connected');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Redis cache connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  // Pattern caching
  async cachePattern(pattern: HarmonicPatternMemory, ttl: number = 3600): Promise<void> {
    if (!this.connected) return;
    
    const key = `pattern:${pattern.id}`;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(pattern));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getPattern(patternId: string): Promise<HarmonicPatternMemory | null> {
    if (!this.connected) return null;

    try {
      const cached = await this.client.get(`pattern:${patternId}`);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Symbol caching
  async cacheSymbolAnalysis(symbolId: string, analysis: any, ttl: number = 1800): Promise<void> {
    if (!this.connected) return;
    
    const key = `symbol:analysis:${symbolId}`;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(analysis));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getSymbolAnalysis(symbolId: string): Promise<any | null> {
    if (!this.connected) return null;

    try {
      const cached = await this.client.get(`symbol:analysis:${symbolId}`);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // File-level caching
  async cacheFileSymbols(file: string, symbols: any[], ttl: number = 900): Promise<void> {
    if (!this.connected) return;
    
    const key = `file:symbols:${Buffer.from(file).toString('base64')}`;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(symbols));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getFileSymbols(file: string): Promise<any[] | null> {
    if (!this.connected) return null;

    try {
      const key = `file:symbols:${Buffer.from(file).toString('base64')}`;
      const cached = await this.client.get(key);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // DPCM coordinate caching
  async cacheDPCMQuery(queryKey: string, results: any[], ttl: number = 600): Promise<void> {
    if (!this.connected) return;
    
    const key = `dpcm:query:${queryKey}`;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(results));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getDPCMQuery(queryKey: string): Promise<any[] | null> {
    if (!this.connected) return null;

    try {
      const cached = await this.client.get(`dpcm:query:${queryKey}`);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Session-based caching for analysis workflows
  async createAnalysisSession(sessionId: string, metadata: any, ttl: number = 7200): Promise<void> {
    if (!this.connected) return;
    
    const key = `session:${sessionId}`;
    try {
      await this.client.setEx(key, ttl, JSON.stringify({
        ...metadata,
        createdAt: new Date().toISOString(),
        status: 'active'
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async updateAnalysisSession(sessionId: string, updates: any): Promise<void> {
    if (!this.connected) return;

    try {
      const key = `session:${sessionId}`;
      const existing = await this.client.get(key);
      if (existing) {
        const session = JSON.parse(existing);
        const updated = {
          ...session,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        await this.client.setEx(key, 7200, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Session update error:', error);
    }
  }

  async getAnalysisSession(sessionId: string): Promise<any | null> {
    if (!this.connected) return null;

    try {
      const cached = await this.client.get(`session:${sessionId}`);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Session read error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Bulk operations for performance
  async cacheMultiplePatterns(patterns: HarmonicPatternMemory[], ttl: number = 3600): Promise<void> {
    if (!this.connected || patterns.length === 0) return;

    try {
      const pipeline = this.client.multi();
      for (const pattern of patterns) {
        const key = `pattern:${pattern.id}`;
        pipeline.setEx(key, ttl, JSON.stringify(pattern));
      }
      await pipeline.exec();
    } catch (error) {
      console.error('Bulk cache write error:', error);
    }
  }

  async invalidatePatternCache(patternId?: string): Promise<void> {
    if (!this.connected) return;

    try {
      if (patternId) {
        await this.client.del(`pattern:${patternId}`);
      } else {
        const keys = await this.client.keys('pattern:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateFileCache(file?: string): Promise<void> {
    if (!this.connected) return;

    try {
      if (file) {
        const key = `file:symbols:${Buffer.from(file).toString('base64')}`;
        await this.client.del(key);
      } else {
        const keys = await this.client.keys('file:symbols:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }
    } catch (error) {
      console.error('File cache invalidation error:', error);
    }
  }

  // Statistics and monitoring
  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    let keyCount = 0;
    let memoryUsage = 'unknown';
    
    if (this.connected) {
      try {
        const keys = await this.client.keys('*');
        keyCount = keys.length;
        
        const info = await this.client.info('memory');
        const memMatch = info.match(/used_memory_human:(.+)/);
        if (memMatch) {
          memoryUsage = memMatch[1].trim();
        }
      } catch (error) {
        console.error('Stats collection error:', error);
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      keyCount,
      memoryUsage
    };
  }

  async resetStats(): Promise<void> {
    this.stats = { hits: 0, misses: 0 };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency: number }> {
    if (!this.connected) {
      return { status: 'disconnected', latency: -1 };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'error', latency: -1 };
    }
  }
}