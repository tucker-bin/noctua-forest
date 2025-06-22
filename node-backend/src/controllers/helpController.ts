import { Request, Response } from 'express';

import { helpService } from '../services/helpService';
import { logger } from '../utils/logger';

export const getHelpContent = async (req: any, res: Response): Promise<void> => {
  try {
    const { language = 'en' } = req.query;
    const userId = req.user.uid;

    const content = await helpService.getContent(language as string, {
      userId,
      isAdmin: req.user.isAdmin || false
    });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error getting help content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch help content'
    });
  }
};

export const submitFeedback = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { context } = req.params;
    const { feedback, rating } = req.body;

    await helpService.submitFeedback({
      userId,
      context,
      feedback,
      rating
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
};

export const searchHelp = async (req: any, res: Response): Promise<void> => {
  try {
    const { query, language = 'en' } = req.query;
    const userId = req.user.uid;

    const results = await helpService.search(query as string, language as string, {
      userId,
      isAdmin: req.user.isAdmin || false
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error searching help:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search help content'
    });
  }
}; 