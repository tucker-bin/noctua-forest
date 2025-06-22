import { Request, Response } from 'express';

import { batchService } from '../services/batchService';
import { rateLimiter } from '../services/rateLimiter';
import { logger } from '../utils/logger';

export const submitBatch = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { items } = req.body;

    const isAllowed = await rateLimiter.checkLimit(`batch_submit:${userId}`);
    if (!isAllowed) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for batch submissions'
      });
      return;
    }

    const result = await batchService.submitBatch(items, userId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error submitting batch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit batch'
    });
  }
};

export const getBatchStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { batchId } = req.params;

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
    });
  }
};

export const cancelBatch = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { batchId } = req.params;

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
    });
  }
}; 