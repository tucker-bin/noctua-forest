import { Request, Response, NextFunction } from 'express';
import { analyzeText } from '../services/anthropicService';
import logger from '../config/logger';
import NodeCache from 'node-cache';
import crypto from 'crypto';

const cache = new NodeCache({ stdTTL: 600 });

function getCacheKey(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const observeText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }
    
    const cacheKey = getCacheKey(text);
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      logger.info(`Cache hit for observe endpoint: ${cacheKey}`);
      res.status(200).json(cachedResult);
      return;
    } else {
      logger.info(`Cache miss for observe endpoint: ${cacheKey}`);
    }

    const analysis = await analyzeText(text);
    cache.set(cacheKey, analysis);
    res.json(analysis);
  } catch (error) {
    logger.error('Error observing text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 