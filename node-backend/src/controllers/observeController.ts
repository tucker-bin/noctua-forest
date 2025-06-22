import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { observationService } from '../services/observationService';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import crypto from 'crypto';

const cache = new NodeCache({ stdTTL: 600 });

function getCacheKey(text: string, userId: string, options?: any): string {
  const optionsStr = options ? JSON.stringify(options) : '';
  return crypto.createHash('md5').update(`${text}-${userId}-${optionsStr}`).digest('hex');
}

export const observeText = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Starting observation request', { 
      userId: req.userId,
      bodyKeys: Object.keys(req.body),
      hasText: !!req.body.text,
      textLength: req.body.text?.length
    });
    
    const { text, language = 'en', focusMode = 'comprehensive' } = req.body;
    
    if (!text || typeof text !== 'string') {
      logger.warn('Invalid text input', { text: typeof text, userId: req.userId });
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (!req.userId) {
      logger.warn('Missing userId in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    logger.info('Calling observation service', { 
      userId: req.userId, 
      textLength: text.length, 
      language, 
      focusMode 
    });

    const result = await observationService.observeText(text, req.userId, language, { focusMode });

    logger.info('Observation service completed successfully', { 
      userId: req.userId,
      resultKeys: Object.keys(result),
      patternsCount: result.patterns?.length
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in observeText controller:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      userId: req.userId,
      errorDetails: error
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getObservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Observation ID is required' });
      return;
    }

    // For now, return a simple response since these methods don't exist yet
    res.status(501).json({ error: 'Feature not yet implemented' });
  } catch (error) {
    logger.error('Error in getObservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserObservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 10 } = req.query;
    
    // For now, return a simple response since these methods don't exist yet
    res.status(501).json({ error: 'Feature not yet implemented' });
  } catch (error) {
    logger.error('Error in getUserObservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 