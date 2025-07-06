import Fastify from 'fastify';
import { config } from 'dotenv';
import { StorageManager } from './storage/storage-manager.js';

// Load environment variables
config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Initialize storage manager
const storage = new StorageManager();

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const storageHealth = await storage.healthCheck();
  
  return { 
    status: storageHealth.overall === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      neo4j: storageHealth.neo4j.status,
      redis: storageHealth.redis.status,
      analytics: storageHealth.analytics.status,
      dpcm: storageHealth.dpcm.status
    },
    details: storageHealth
  };
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return { 
    name: 'Guru Harmonic Intelligence Platform',
    version: '0.1.0',
    status: 'running',
    storage: storage.isConnected() ? 'connected' : 'disconnected'
  };
});

// Symbol graph endpoints
fastify.get('/api/symbols/:file', async (request, reply) => {
  const { file } = request.params as { file: string };
  const decodedFile = Buffer.from(file, 'base64').toString('utf-8');
  
  try {
    const symbols = await storage.getSymbolsByFile(decodedFile);
    return { symbols, file: decodedFile };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to fetch symbols', details: error };
  }
});

fastify.get('/api/symbols/:symbolId/callgraph', async (request, reply) => {
  const { symbolId } = request.params as { symbolId: string };
  const { depth = '2' } = request.query as { depth?: string };
  
  try {
    const callGraph = await storage.getSymbolCallGraph(symbolId, parseInt(depth));
    return { callGraph, symbolId, depth: parseInt(depth) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to fetch call graph', details: error };
  }
});

// Pattern endpoints
fastify.get('/api/patterns/similar/:patternId', async (request, reply) => {
  const { patternId } = request.params as { patternId: string };
  const { minSimilarity = '0.7' } = request.query as { minSimilarity?: string };
  
  try {
    const similar = await storage.findSimilarPatterns(patternId, parseFloat(minSimilarity));
    return { similar, patternId, minSimilarity: parseFloat(minSimilarity) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to find similar patterns', details: error };
  }
});

fastify.get('/api/patterns/distribution', async (request, reply) => {
  try {
    const distribution = await storage.getPatternDistribution();
    return { distribution };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get pattern distribution', details: error };
  }
});

fastify.get('/api/patterns/top', async (request, reply) => {
  const { limit = '10' } = request.query as { limit?: string };
  
  try {
    const patterns = await storage.getTopPatternsByStrength(parseInt(limit));
    return { patterns, limit: parseInt(limit) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get top patterns', details: error };
  }
});

// Analytics endpoints
fastify.get('/api/analytics/hotspots', async (request, reply) => {
  const { limit = '10' } = request.query as { limit?: string };
  
  try {
    const hotspots = await storage.getComplexityHotspots(parseInt(limit));
    return { hotspots, limit: parseInt(limit) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get complexity hotspots', details: error };
  }
});

fastify.get('/api/analytics/central', async (request, reply) => {
  const { limit = '10' } = request.query as { limit?: string };
  
  try {
    const central = await storage.getCentralSymbols(parseInt(limit));
    return { central, limit: parseInt(limit) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get central symbols', details: error };
  }
});

fastify.get('/api/analytics/modularity/:file', async (request, reply) => {
  const { file } = request.params as { file: string };
  const decodedFile = Buffer.from(file, 'base64').toString('utf-8');
  
  try {
    const score = await storage.getFileModularityScore(decodedFile);
    return { file: decodedFile, modularityScore: score };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get modularity score', details: error };
  }
});

fastify.get('/api/analytics/trends', async (request, reply) => {
  const { days = '30' } = request.query as { days?: string };
  
  try {
    const trends = await storage.getPatternTrends(parseInt(days));
    return { trends, days: parseInt(days) };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get pattern trends', details: error };
  }
});

// Cache management endpoints
fastify.get('/api/cache/stats', async (request, reply) => {
  try {
    const stats = await storage.getCacheStats();
    return { cache: stats };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get cache stats', details: error };
  }
});

fastify.delete('/api/cache', async (request, reply) => {
  const { type } = request.query as { type?: 'patterns' | 'symbols' | 'all' };
  
  try {
    await storage.clearCache(type);
    return { cleared: type || 'all', timestamp: new Date().toISOString() };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to clear cache', details: error };
  }
});

// Storage stats endpoint
fastify.get('/api/storage/stats', async (request, reply) => {
  try {
    const stats = await storage.getStorageStats();
    return { stats };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get storage stats', details: error };
  }
});

const start = async () => {
  try {
    // Connect to storage layers
    await storage.connect();
    
    // Start the server
    await fastify.listen({ 
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0'
    });
    
    fastify.log.info('🚀 Guru Harmonic Intelligence Platform started successfully');
    fastify.log.info(`Neo4j URI: ${process.env.NEO4J_URI}`);
    fastify.log.info(`Redis URL: ${process.env.REDIS_URL ? 'configured' : 'not configured'}`);
    fastify.log.info('📊 Storage layers connected and ready');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('🛑 Shutting down gracefully...');
  await storage.disconnect();
  await fastify.close();
  process.exit(0);
});

start();