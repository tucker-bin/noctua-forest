import { Request, Response } from 'express';

import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
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
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
}; 