import { Router, Response } from 'express';

import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

const router = Router();

// Get system metrics
router.get('/metrics', async (req: any, res: any) => {
  try {
    const metrics = {
      requests: {
        total: await metricsService.getCounter('api.requests'),
        errors: await metricsService.getCounter('api.errors')
      },
      response_time: {
        average: await metricsService.getAverageTiming('api.response_time'),
        p95: await metricsService.getTimingPercentile('api.response_time', 95)
      },
      users: {
        active: await metricsService.getGauge('users.active'),
        total: await metricsService.getCounter('users.total')
      },
      cache: {
        hits: await metricsService.getCounter('cache.hits'),
        misses: await metricsService.getCounter('cache.misses')
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    }); return;
  }
});

export default router; 