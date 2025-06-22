import { Router } from 'express';
import { RequestHandler } from 'express';
import { getHelpContent, submitFeedback, searchHelp } from '../controllers/helpController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get help content
router.get('/content', requireAuth, getHelpContent as any);

// Submit feedback
router.post('/feedback/:context', requireAuth, submitFeedback as any);

// Search help content
router.get('/search', requireAuth, searchHelp as any);

export default router; 