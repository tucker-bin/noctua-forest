import express from 'express';
import { Request, Response } from 'express';
import observeRoutes from './observeRoutes';
import usageRoutes from './usageRoutes';
import { apiLimiter } from '../middleware/rateLimiter';
import modelRoutes from './modelRoutes';
import musicRoutes from './musicRoutes';
import cryptoPaymentRoutes from './cryptoPaymentRoutes';
import metricsRoutes from './metricsRoutes';
import aiContentRoutes from './aiContentRoutes';
import puzzleRoutes from './puzzleRoutes';
import { logger } from '../utils/logger';

const router = express.Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'noctua-forest-api'
  });
});

// Sub-routes
router.use('/observe', observeRoutes);
router.use('/usage', usageRoutes);
router.use('/models', modelRoutes);
router.use('/music', musicRoutes);
router.use('/crypto-payments', cryptoPaymentRoutes);
router.use('/metrics', metricsRoutes);
router.use('/ai-content', aiContentRoutes);
router.use('/puzzles', puzzleRoutes);

export default router; 