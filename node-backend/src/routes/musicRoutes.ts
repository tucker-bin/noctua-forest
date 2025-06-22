import express from 'express';
import { requireAuth } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { musicController } from '../controllers/musicController';

const router = express.Router();

// Apply rate limiting to all music routes
router.use(apiLimiter); // 20 requests per 15 minutes

/**
 * @route POST /api/music/analyze
 * @desc Analyze lyrics with music-specific enhancements
 * @access Private
 */
router.post('/analyze', requireAuth, musicController.analyzeLyrics.bind(musicController) as any);

/**
 * @route POST /api/music/detect
 * @desc Lightweight song detection from lyrics or title
 * @access Public
 */
router.post('/detect', musicController.detectSong.bind(musicController) as any);

/**
 * @route GET /api/music/status
 * @desc Get service configuration status
 * @access Public
 */
router.get('/status', musicController.getServiceStatus.bind(musicController));

/**
 * @route GET /api/music/observations
 * @desc Get user's music observations
 * @access Private
 */
router.get('/observations', requireAuth, musicController.getUserObservations.bind(musicController) as any);

/**
 * @route GET /api/music/observations/:id
 * @desc Get specific music observation
 * @access Private
 */
router.get('/observations/:id', requireAuth, musicController.getObservation.bind(musicController) as any);

export default router; 