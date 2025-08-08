import express from 'express';
import { communityCorpusService } from '../services/communityCorpusService';
import { puzzleService } from '../services/puzzleService';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get regular game from community corpus (no auth required)
 */
router.get('/regular', async (req, res) => {
  try {
    const difficulty = req.query.difficulty as string;
    
    // Get random content from approved community corpus
    const corpusContent = await communityCorpusService.getRandomPuzzleContent(difficulty, 1);
    
    if (corpusContent.length === 0) {
      // Fallback to default content if corpus is empty
      const fallbackText = "She sells seashells by the seashore. The shells she sells are surely seashells.";
      const game = await puzzleService.generateRhymeMahjongPuzzle(fallbackText, 'system', 'en', false);
      
      return res.json({
        success: true,
        game,
        source: 'fallback'
      });
    }
    
    const selectedContent = corpusContent[0];
    
    // Generate game using existing Observatory analysis
    const game = await puzzleService.generateRhymeMahjongPuzzle(
      selectedContent.text, 
      'community', 
      'en', 
      false
    );
    
    logger.info('Regular game served', {
      gameId: game.id,
      source: 'community_corpus',
      difficulty: selectedContent.difficulty
    });
    
    res.json({
      success: true,
      game,
      source: 'community',
      originalSubmitter: selectedContent.userId.substring(0, 8) + '...'
    });

  } catch (error) {
    logger.error('Error serving regular game', { error });
    res.status(500).json({
      error: 'Failed to load regular game',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate custom game from user text (requires auth)
 */
router.post('/custom', requireAuth, async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const userId = (req as any).user.uid;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text is required and must be a string'
      });
    }

    if (text.length < 50) {
      return res.status(400).json({
        error: 'Text must be at least 50 characters for meaningful analysis'
      });
    }

    logger.info('Generating custom game', {
      userId: userId.substring(0, 8) + '...',
      textLength: text.length,
      language
    });

    // Generate unique game using Observatory
    const game = await puzzleService.generateRhymeMahjongPuzzle(text, userId, language, false);
    
    // Optionally submit to community corpus for future use
    try {
      await communityCorpusService.submitContent(userId, text);
    } catch (error) {
      // Don't fail the custom game if corpus submission fails
      logger.warn('Failed to submit custom game to corpus', { error });
    }

    res.json({
      success: true,
      game,
      source: 'custom',
      message: 'Custom game generated successfully'
    });

  } catch (error) {
    logger.error('Error generating custom game', { error });
    res.status(500).json({
      error: 'Failed to generate custom game',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 