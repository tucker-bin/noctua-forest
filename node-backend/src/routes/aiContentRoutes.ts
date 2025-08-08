import express from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  getDailyContent,
  generateWeeklyPack,
  generateCulturalSeries,
  getPremiumBundles,
  getContentProgression,
  trackChallengeCompletion,
  initializeRegionalProgression,
  getAvailableRegions,
  checkDiscoveryMilestones,
  generateOnboardingSequence
} from '../controllers/aiContentController';

const router = express.Router();

// Wrapper to make controller functions compatible with Express
const wrapController = (fn: any) => (req: any, res: any, next: any) => fn(req, res, next);

// Public endpoints
router.get('/progression', wrapController(getContentProgression));
router.get('/regions', wrapController(getAvailableRegions));

// Protected endpoints - require authentication
router.post('/daily', requireAuth, wrapController(getDailyContent));
router.post('/weekly-pack', requireAuth, wrapController(generateWeeklyPack));
router.post('/cultural-series', requireAuth, wrapController(generateCulturalSeries));
router.get('/premium-bundles', requireAuth, wrapController(getPremiumBundles));
router.post('/track-completion', requireAuth, wrapController(trackChallengeCompletion));

// Regional personalization endpoints
router.post('/initialize-region', requireAuth, wrapController(initializeRegionalProgression));
router.post('/check-milestones', requireAuth, wrapController(checkDiscoveryMilestones));
router.post('/onboarding-sequence', requireAuth, wrapController(generateOnboardingSequence));

export default router; 