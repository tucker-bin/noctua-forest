import express, { Response } from 'express';

import { requireAuth } from '../middleware/auth';

import { observationService } from '../services/observationService';
import { apiLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/', apiLimiter, requireAuth, async (req: any, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;
    const userId = (req as any).user.uid;

    logger.info('Starting observation request', { 
      userId, 
      textLength: text?.length, 
      language,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
    });

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('Anthropic API key not configured, returning demo response');
      
      // Return a demo response for testing
      const demoPatterns = [
        {
          type: 'rhyme',
          segments: [
            { text: 'demo', globalStartIndex: 0, globalEndIndex: 4 }
          ],
          primaryFeature: 'demo_pattern',
          secondaryFeatures: [],
          confidence: 0.8
        }
      ];
      
      return res.json({
        id: Date.now().toString(),
        patterns: demoPatterns,
        constellations: [],
        originalText: text,
        modelUsed: 'demo-mode',
        cost: 0,
        tokensUsed: 0,
        language: language,
        createdAt: new Date().toISOString()
      });
    }

    const observation = await observationService.observeText(text, userId, language);
    // Return patterns in the format expected by the frontend
    res.json({
      id: observation.id || Date.now().toString(),
      patterns: observation.patterns || [],
      constellations: observation.constellations || [],
      originalText: observation.text || text,
      modelUsed: 'claude-3-5-sonnet-20241022',
      cost: 0.001,
      tokensUsed: Math.floor(text.length / 4), // Rough estimate
      language: language,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in observation:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        });
      }
      if (error.message.includes('API key')) {
        return res.status(500).json({
          success: false,
          error: 'Service configuration error. Please contact support.'
        });
      }
      
      // Log the specific error for debugging
      logger.error('Observation processing failed:', { 
        error: error.message, 
        stack: error.stack,
        userId: (req as any).user?.uid,
        textLength: req.body?.text?.length 
      });
      
      return res.status(500).json({
        success: false,
        error: `Processing failed: ${error.message}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process observation'
    });
  }
});

export default router; 