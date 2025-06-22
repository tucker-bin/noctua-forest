import { Router, Request, Response } from 'express';

import { requireAuth } from '../middleware/auth';

import { batchService } from '../services/batchService';
import { rateLimiter } from '../services/rateLimiter';
import { logger } from '../utils/logger';

const router = Router();

// Rate limit batch submissions
async function batchRateLimit(req: Request, res: Response, next: any) {
  const userId = (req as any).user?.uid || 'anonymous';
  const isAllowed = await rateLimiter.checkLimit(`batch_submit:${userId}`);
  
  if (!isAllowed) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for batch submissions'
    });
      return;
  }
  
  next();
}

// POST /api/batch - Submit batch observation job
router.post('/', requireAuth, batchRateLimit, async (req: Request, res: Response) => {
  try {
    const { text, options = {} } = req.body;
    const userId = (req as any).user.uid;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid text input.' 
      });
      return;
    }

    // Create batch items for observation
    const batchItems = [{
      id: `item_${Date.now()}`,
      type: 'observation',
      data: {
        text,
        options,
        userId
      }
    }];

    const result = await batchService.submitBatch(batchItems, userId);
    
    res.json({ 
      success: true, 
      message: 'Batch processing submitted successfully.',
      batchId: result.id,
      status: result.status,
      itemCount: result.items.length
    });
  } catch (error) {
    logger.error('Error submitting batch observation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit batch observation'
    }); return;
  }
});

// GET /api/batch/:batchId/status - Get batch status
router.get('/:batchId/status', requireAuth, async (req: any, res: any) => {
  try {
    const { batchId } = req.params;
    const userId = (req as any).user.uid;

    const status = await batchService.getBatchStatus(batchId, userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting batch status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch status'
    }); return;
  }
});

// POST /api/batch/:batchId/cancel - Cancel batch job
router.post('/:batchId/cancel', requireAuth, async (req: any, res: any) => {
  try {
    const { batchId } = req.params;
    const userId = (req as any).user.uid;

    await batchService.cancelBatch(batchId, userId);
    
    res.json({
      success: true,
      message: 'Batch cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling batch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel batch'
    }); return;
  }
});

export default router; 