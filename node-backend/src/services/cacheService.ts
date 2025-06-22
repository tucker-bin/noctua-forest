import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { ObservationData } from '../types/observation';
import { settings } from '../config/settings';
import NodeCache from 'node-cache';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(settings.redis.url);
    
    this.redis.on('error', (err) => {
      logger.error('Redis cache error:', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = settings.cache.ttl): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
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