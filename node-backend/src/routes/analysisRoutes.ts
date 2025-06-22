import { Router, Request, Response, NextFunction, RequestHandler } from 'express';

import { requireAuth } from '../middleware/auth';

import { analysisService } from '../services/analysisService';
import { logger } from '../utils/logger';

const router = Router();

// Middleware to authenticate all routes
// Auth middleware applied per route

// Save a new analysis
router.post('/save', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      originalText,
      analysisData,
      isPublic,
      isDraft,
      tags
    } = req.body;

    // Get user ID from authentication middleware
    const userId = (req as any).user.uid;

    const newAnalysis = await analysisService.createAnalysis(userId, {
      title,
      description,
      originalText,
      analysisData,
      isPublic,
      isDraft,
      tags: tags || [],
      thumbnail: undefined
    });

    res.status(201).json({
      success: true,
      analysis: newAnalysis
    });
      return;
  } catch (error) {
    logger.error('Error saving analysis:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save analysis'
    }); return;
  }
});

// Get analyses for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).user.uid;

    const userAnalyses = await analysisService.getUserAnalyses(userId, requestingUserId);
    
    // Add author information to each analysis
    const analysesWithAuthor = await Promise.all(
      userAnalyses.map(async (analysis) => {
        const author = await analysisService.getAnalysisAuthor(analysis.userId);
        const isLiked = await analysisService.isLikedByUser(analysis.id, requestingUserId);
        
        return {
          ...analysis,
          author,
          isLiked
        };
      })
    );

    res.json({
      success: true,
      analyses: analysesWithAuthor
    });
  } catch (error) {
    logger.error('Error fetching user analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyses'
    }); return;
  }
});

// Get public analyses (feed)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const { limit = 20, startAfter } = req.query;
    const requestingUserId = (req as any).user.uid;

    const publicAnalyses = await analysisService.getPublicAnalyses(
      Number(limit),
      startAfter as string
    );
    
    // Add author information to each analysis
    const analysesWithAuthor = await Promise.all(
      publicAnalyses.map(async (analysis) => {
        const author = await analysisService.getAnalysisAuthor(analysis.userId);
        const isLiked = await analysisService.isLikedByUser(analysis.id, requestingUserId);
        
        return {
          ...analysis,
          author,
          isLiked
        };
      })
    );

    res.json({
      success: true,
      analyses: analysesWithAuthor
    });
  } catch (error) {
    logger.error('Error fetching public analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public analyses'
    }); return;
  }
});

// Get a specific analysis by ID
router.get('/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const requestingUserId = (req as any).user.uid;

    const analysis = await analysisService.getAnalysis(analysisId, requestingUserId);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
      return;
    }

    // Add author information
    const author = await analysisService.getAnalysisAuthor(analysis.userId);
    const isLiked = await analysisService.isLikedByUser(analysis.id, requestingUserId);

    res.json({
      success: true,
      analysis: {
        ...analysis,
        author,
        isLiked
      }
    });
  } catch (error) {
    logger.error('Error fetching analysis:', error);
    
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analysis'
      }); return;
    }
  }
});

// Update an analysis
router.put('/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user.uid;
    const updates = req.body;

    const updatedAnalysis = await analysisService.updateAnalysis(
      analysisId,
      userId,
      updates
    );

    res.json({
      success: true,
      analysis: updatedAnalysis
    });
  } catch (error) {
    logger.error('Error updating analysis:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      return;
      } else if (error.message === 'Analysis not found') {
        res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      return;
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        }); return;
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update analysis'
      }); return;
    }
  }
});

// Delete an analysis
router.delete('/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user.uid;

    await analysisService.deleteAnalysis(analysisId, userId);

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting analysis:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      return;
      } else if (error.message === 'Analysis not found') {
        res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      return;
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        }); return;
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete analysis'
      }); return;
    }
  }
});

// Like/unlike an analysis
router.post('/:analysisId/like', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user.uid;

    const result = await analysisService.toggleLike(analysisId, userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    }); return;
  }
});

export default router; 