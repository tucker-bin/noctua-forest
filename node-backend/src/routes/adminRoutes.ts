import { Router, RequestHandler } from 'express';
import { requireAdminToken } from '../middleware/auth';
import {
  getSystemStatus,
  clearCache,
  updateSystemSettings,
  getAdminMetrics
} from '../controllers/adminController';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint - no auth required
router.get('/check', getSystemStatus as RequestHandler);

// All routes below this require admin authentication
router.use(requireAdminToken as RequestHandler);

// Admin-only routes
router.post('/cache/clear', clearCache as RequestHandler);
router.put('/settings', updateSystemSettings as RequestHandler);
router.get('/metrics', getAdminMetrics as RequestHandler);

export default router;
