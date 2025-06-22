import express, { Request, Response } from 'express';

import { requireAuth } from '../middleware/auth';

import { logger } from '../utils/logger';

const router = express.Router();

// Get usage information for authenticated user
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const userId = (req as any).user.uid;
    
    // This would typically fetch from a database
    const usageData = {
      totalObservations: 42,
      thisMonth: 15,
      streak: 7,
      favoritePatterns: ['alliteration', 'rhyme'],
      lastActivity: new Date().toISOString()
    };

    res.json(usageData);
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage information' });
  }
});

// Record observation usage
router.post('/record', requireAuth, async (req: any, res: any) => {
  try {
    const userId = (req as any).user.uid;
    const { type, data } = req.body;
    
    // This would typically save to a database
    logger.info(`Recording ${type} usage for user ${userId}`, { data });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error recording observation:', error);
    res.status(500).json({ error: 'Failed to record observation' });
  }
});

export default router; 