import { Request, Response, NextFunction } from 'express';

import { metricsService } from '../services/metricsService';
import { Redis } from 'ioredis';
import { settings } from '../config/settings';
import { logger } from '../utils/logger';

const redis = new Redis(settings.redis.url);

export const monitorRequest = async (
  req: Request | Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  const userId = (req as any).user?.uid || 'anonymous';

  // Track active user
  redis.zadd('active_users', Date.now(), userId).catch(error => {
    logger.error('Error tracking active user:', error);
  });

  // Track active connection
  redis.sadd('active_connections', req.ip || 'unknown').catch(error => {
    logger.error('Error tracking active connection:', error);
  });

  // Track request metrics
  try {
    await metricsService.incrementCounter('api.requests', 1, {
      method: req.method,
      path: req.path,
      userId
    });
  } catch (error) {
    logger.error('Error tracking request metrics:', error);
  }

  // Track response time after request completes
  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    try {
      await metricsService.recordTiming('api.response_time', duration, {
        method: req.method,
        path: req.path,
        status: res.statusCode.toString()
      });

      // Track errors
      if (res.statusCode >= 400) {
        await metricsService.incrementCounter('api.errors', 1, {
          method: req.method,
          path: req.path,
          status: res.statusCode.toString()
        });
      }
    } catch (error) {
      logger.error('Error tracking response time:', error);
    }

    // Remove connection from active set
    redis.srem('active_connections', req.ip || 'unknown').catch(error => {
      logger.error('Error removing active connection:', error);
    });
  });

  next();
};

// Track cache operations
export const trackCacheOperation = (operation: 'hit' | 'miss'): void => {
  metricsService.incrementCounter(`cache.${operation}s`, 1)
    .catch(error => {
      logger.error('Error tracking cache operation:', error);
    });
};

// Track pattern detection
export const trackPatternDetection = (patternType: string): void => {
  metricsService.incrementCounter(`patterns.${patternType}`, 1)
    .catch(error => {
      logger.error('Error tracking pattern detection:', error);
    });
};

// Track batch operations
export const trackBatchOperation = (operation: 'submitted' | 'completed' | 'failed'): void => {
  metricsService.incrementCounter(`batch.${operation}`, 1)
    .catch(error => {
      logger.error('Error tracking batch operation:', error);
    });
};

// Clean up old monitoring data periodically
setInterval(() => {
  try {
    const oldestTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    redis.zremrangebyscore('active_users', '-inf', oldestTime);
  } catch (error) {
    logger.error('Error cleaning up monitoring data:', error);
  }
}, 60 * 60 * 1000); // Run every hour 