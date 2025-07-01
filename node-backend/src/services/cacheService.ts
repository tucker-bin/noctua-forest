import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { ObservationData } from '../types/observation';
import { settings } from '../config/settings';
import NodeCache from 'node-cache';

class CacheService {
  private redis: Redis | null = null;

  constructor() {
    try {
      this.redis = new Redis(settings.redis.url, {
        maxRetriesPerRequest: 0,
        lazyConnect: true
      });
      
      this.redis.on('error', (err) => {
        logger.warn('Redis not available, caching disabled');
        this.redis?.disconnect();
        this.redis = null;
      });
    } catch (error) {
      logger.warn('Redis not available, caching disabled:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = settings.cache.ttl): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  generateObservationKey(text: string, userId?: string): string {
    // Create a cache key based on text content and user
    const hash = Buffer.from(text).toString('base64');
    return `observation:${userId || 'anonymous'}:${hash}`;
  }

  async getObservation(text: string, userId?: string): Promise<ObservationData | null> {
    const key = this.generateObservationKey(text, userId);
    return this.get<ObservationData>(key);
  }

  async setObservation(text: string, observation: ObservationData, userId?: string): Promise<void> {
    const key = this.generateObservationKey(text, userId);
    await this.set(key, observation);
  }
}

export const cacheService = new CacheService(); 