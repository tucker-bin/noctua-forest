import { Router } from 'express';
import { RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getAvailableModels,
  getModelRecommendation,
  getUserPreferences,
  updateUserPreferences,
  getUserUsage,
  getCostEstimate
} from '../controllers/modelController';

const router = Router();

// Public routes
router.get('/available', getAvailableModels as any);
router.post('/recommend', getModelRecommendation as any);
router.post('/cost-estimate', getCostEstimate as any);

// Protected routes
router.get('/preferences', requireAuth, getUserPreferences as any);
router.put('/preferences', requireAuth, updateUserPreferences as any);
router.get('/usage', requireAuth, getUserUsage as any);

export default router; 