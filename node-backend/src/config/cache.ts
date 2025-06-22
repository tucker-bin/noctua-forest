import NodeCache from 'node-cache';

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
}

interface Cache {
  get: (key: string) => unknown;
  set: (key: string, value: any, ttl?: number) => boolean;
  clear: () => void;
  stats: () => CacheStats;
}

// Initialize with a standard TTL and check period for better performance
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const cacheWrapper: Cache = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any, ttl?: number) => cache.set(key, value, ttl || 3600),
  clear: () => cache.flushAll(),
  // Directly return the stats object from the library
  stats: () => cache.getStats()
};

export default cacheWrapper; 