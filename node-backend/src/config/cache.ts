import NodeCache from 'node-cache';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
}

interface Cache {
  get: (key: string) => unknown;
  set: (key: string, value: any, ttl?: number) => boolean;
  clear: () => void;
  stats: () => CacheStats;
}

const cache = new NodeCache();

const cacheWrapper: Cache = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any, ttl?: number) => cache.set(key, value, ttl),
  clear: () => cache.flushAll(),
  stats: () => ({
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    keys: cache.keys().length
  })
};

export default cacheWrapper; 