import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'praise';
  message: string;
  context?: string;
  userAgent?: string;
  url?: string;
}

export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, feedback, message, errorMessage, timestamp } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!type || !feedback) {
      res.status(400).json({ error: 'Type and feedback are required' });
      return;
    }

    // Save feedback to Firestore
    const feedbackData = {
      userId,
      type,
      feedback,
      message: message || null,
      errorMessage: errorMessage || null,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date()
    };

    await db.collection('feedback').add(feedbackData);

    logger.info('Feedback submitted', {
      userId,
      type,
      feedback
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
}; 