import { useState, useCallback, useEffect } from 'react';
import { CachedObservation, ObservationData } from '../types/observatory';
import { log } from '../utils/logger';

const CACHE_PREFIX = 'noctua_forest_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

const calculateCacheSize = (data: Record<string, CachedObservation>): number => {
  return Object.values(data).reduce((sum, entry) => sum + entry.size, 0);
};

export const useCache = () => {
  const [cachedObservations, setCachedObservations] = useState<Record<string, CachedObservation>>({});
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const loadCachedObservations = async () => {
      try {
        const stored = localStorage.getItem(CACHE_PREFIX + 'observations');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCachedObservations(parsed);
          log.info('Cached observations loaded', { count: Object.keys(parsed).length });
          setCacheSize(calculateCacheSize(parsed));
        }
      } catch (error) {
        log.error('Failed to load cached observations', { 
          error: error instanceof Error ? error.message : String(error) 
        }, error instanceof Error ? error : undefined);
      }
    };

    loadCachedObservations();
  }, []);

  const saveToCache = useCallback((text: string, observation: ObservationData) => {
    try {
      const cacheEntry: CachedObservation = {
        data: observation,
        timestamp: Date.now(),
        size: JSON.stringify(observation).length
      };

      const updatedCache = {
        ...cachedObservations,
        [text]: cacheEntry
      };

      // Check cache size limit
      const totalSize = Object.values(updatedCache).reduce((sum, entry) => sum + entry.size, 0);
      if (totalSize > MAX_CACHE_SIZE) {
        // Remove oldest entries
        const entries = Object.entries(updatedCache);
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        let currentSize = totalSize;
        const entriesToKeep = [];
        
        for (let i = entries.length - 1; i >= 0; i--) {
          if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max size
          currentSize -= entries[i][1].size;
          entriesToKeep.push(entries[i]);
        }
        
        const trimmedCache = Object.fromEntries(entriesToKeep);
        setCachedObservations(trimmedCache);
        localStorage.setItem(CACHE_PREFIX + 'observations', JSON.stringify(trimmedCache));
        
        log.info('Cache trimmed due to size limit', { 
          removedEntries: entries.length - entriesToKeep.length,
          newSize: currentSize 
        });
      } else {
        setCachedObservations(updatedCache);
        localStorage.setItem(CACHE_PREFIX + 'observations', JSON.stringify(updatedCache));
        
        log.info('Observation saved to cache', { 
          textLength: text.length,
          cacheSize: Object.keys(updatedCache).length 
        });
      }
    } catch (error) {
      log.error('Failed to save observation to cache', { 
        textLength: text.length,
        error: error instanceof Error ? error.message : String(error) 
      }, error instanceof Error ? error : undefined);
    }
  }, [cachedObservations]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_PREFIX + 'observations');
      setCachedObservations({});
      setCacheSize(0);
      log.info('Cache cleared successfully');
    } catch (error) {
      log.error('Failed to clear cache', { 
        error: error instanceof Error ? error.message : String(error) 
      }, error instanceof Error ? error : undefined);
    }
  }, []);

  return { cachedObservations, saveToCache, cacheSize, clearCache };
}; 