import express from 'express';
import { puzzleService } from '../services/puzzleService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get daily challenge (cached automatically)
 */
router.get('/daily-challenge', async (req, res) => {
  try {
    logger.info('Fetching daily challenge');
    
    const dailyChallenge = await puzzleService.getDailyChallenge();
    
    res.json({
      success: true,
      puzzle: dailyChallenge,
      message: 'Daily challenge retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching daily challenge', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      error: 'Failed to fetch daily challenge',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate custom rhyme mahjong puzzle using Observatory
 */
router.post('/rhyme-mahjong', async (req, res) => {
  try {
    const { sourceText, language = 'en' } = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    if (!sourceText || typeof sourceText !== 'string') {
      return res.status(400).json({
        error: 'Source text is required and must be a string'
      });
    }

    if (sourceText.length < 50) {
      return res.status(400).json({
        error: 'Source text must be at least 50 characters long for meaningful pattern analysis'
      });
    }

    logger.info('Generating custom Observatory puzzle', {
      userId: userId.substring(0, 8) + '...',
      textLength: sourceText.length,
      language
    });

    const puzzle = await puzzleService.generateRhymeMahjongPuzzle(
      sourceText,
      userId,
      language,
      false // Not a daily challenge
    );

    res.json({
      success: true,
      puzzle,
      message: 'Observatory-integrated puzzle generated successfully'
    });

  } catch (error) {
    logger.error('Error generating Observatory puzzle', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      error: 'Failed to generate puzzle',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate rhyme match during gameplay
 */
router.post('/validate-match', async (req, res) => {
  try {
    const { tile1, tile2 } = req.body;
    
    if (!tile1 || !tile2) {
      return res.status(400).json({
        error: 'Both tiles are required for validation'
      });
    }

    const isValid = puzzleService.validateRhymeMatch(tile1, tile2);
    
    res.json({
      success: true,
      isValid,
      message: isValid ? 'Valid rhyme match!' : 'Tiles do not rhyme'
    });

  } catch (error) {
    logger.error('Error validating rhyme match', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      error: 'Failed to validate match',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get puzzle generation statistics for corpus analysis
 */
router.get('/statistics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as 'day' | 'week' | 'month' || 'day';
    
    const stats = await puzzleService.getPuzzleStatistics(timeframe);
    
    res.json({
      success: true,
      statistics: stats,
      timeframe
    });

  } catch (error) {
    logger.error('Error fetching puzzle statistics', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 