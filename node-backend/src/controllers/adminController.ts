import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import cache from '../config/cache';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

// This would be the performance monitor instance from the main app
// This is a placeholder as it needs to be shared from the main app instance
const performanceMonitor = { getStats: () => ({ message: "Performance monitor not implemented in refactor yet."}) };

export function getAdminStats(req: Request, res: Response) {
    logger.info('Admin access: /admin/stats');
    res.json({
        performance: performanceMonitor.getStats(),
        cache: cache.stats()
    });
}

export function getAdminLogs(req: Request, res: Response): void {
    logger.info('Admin access: /admin/logs');
    const logDir = path.join(__dirname, '..', '..', 'logs');
    fs.readdir(logDir, (err, files) => {
        if (err) {
            logger.error('Error reading log directory', err);
            res.status(500).send('Error reading log directory.');
            return;
        }
        const latestLog = files.sort().pop();
        if (!latestLog) {
            res.status(404).send('No logs found.');
            return;
        }
        res.sendFile(path.join(logDir, latestLog));
    });
}

export function getAdminEnv(req: Request, res: Response) {
    logger.info('Admin access: /admin/env');
    // Re-using the masking function from the logger config
    const maskEnvValue = (key: string, value: string | undefined) => {
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
            return value ? value.slice(0, 4) + '***' : '';
        }
        return value;
    };
    const maskedEnv = Object.fromEntries(
        Object.entries(process.env).map(([k, v]) => [k, maskEnvValue(k, v)])
    );
    res.json(maskedEnv);
}

export function clearAdminCache(req: Request, res: Response) {
    logger.info('Admin access: /admin/cache/clear');
    cache.clear();
    res.send('Cache cleared.');
}

export const getSystemStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // --- DEBUGGING STEP ---
    // Return a hardcoded status to isolate the cache issue.
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cacheStats: { message: "Cache stats currently disabled for debugging" },
      environment: process.env.NODE_ENV
    };
    res.json(status);
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSystemSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { settings } = req.body;
    // Implement settings update logic here
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAdminMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      metrics: {
        requests: 0,
        errors: 0,
        // Add other metrics as needed
      }
    };
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting admin metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 