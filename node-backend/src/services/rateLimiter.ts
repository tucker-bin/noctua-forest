import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { settings } from '../config/settings';

class RateLimiter {
  private redis: Redis | null = null;

  constructor() {
    try {
      this.redis = new Redis(settings.redis.url, {
        maxRetriesPerRequest: 0,
        lazyConnect: true
      });
      
      this.redis.on('error', (err) => {
        logger.warn('Redis not available, rate limiting disabled');
        this.redis?.disconnect();
        this.redis = null;
      });
    } catch (error) {
      logger.warn('Redis not available, rate limiting disabled:', error);
      this.redis = null;
    }
  }

  async checkLimit(key: string): Promise<boolean> {
    // If Redis is not available, allow all requests
    if (!this.redis) {
      return true;
    }

    const currentTime = Date.now();
    const windowStart = currentTime - settings.rateLimit.windowMs;

    try {
      // Add the current request timestamp
      await this.redis.zadd(key, currentTime.toString(), currentTime.toString());
      
      // Remove old entries outside the window
      await this.redis.zremrangebyscore(key, '-inf', windowStart.toString());
      
      // Count requests in current window
      const requestCount = await this.redis.zcard(key);
      
      // Set expiry on the key
      await this.redis.expire(key, Math.floor(settings.rateLimit.windowMs / 1000));
      
      return requestCount <= settings.rateLimit.maxRequests;
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fail open if Redis is down
      return true;
    }
  }

  async getRemainingRequests(key: string): Promise<number> {
    // If Redis is not available, return max requests
    if (!this.redis) {
      return settings.rateLimit.maxRequests;
    }

    try {
      const windowStart = Date.now() - settings.rateLimit.windowMs;
      await this.redis.zremrangebyscore(key, '-inf', windowStart.toString());
      const requestCount = await this.redis.zcard(key);
      return Math.max(0, settings.rateLimit.maxRequests - requestCount);
    } catch (error) {
      logger.error('Error getting remaining requests:', error);
      return 0;
    }
  }
}

export const rateLimiter = new RateLimiter(); 