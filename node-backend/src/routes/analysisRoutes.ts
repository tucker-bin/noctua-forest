import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth';
import { analyzeText } from '../services/anthropicService';
import { AnalysisResult } from '../types/analysisTypes';
import ContentModerationService from '../services/contentModerationService';

const router = Router();

// Middleware to authenticate all routes
router.use(authenticateUser as RequestHandler);

// Mock database - in production, this would be a real database
let analyses: any[] = [];
let nextId = 1;

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

    // TODO: Get user ID from authentication middleware
    const userId = req.headers['user-id'] || 'mock-user-id';

    // Content moderation check
    const moderationResult = await ContentModerationService.moderateContent(
      originalText,
      { title, description, tags }
    );

    if (!moderationResult.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Content moderation failed',
        moderationIssues: moderationResult.issues,
        suggestions: moderationResult.suggestions
      });
    }

    const newAnalysis = {
      id: nextId.toString(),
      userId,
      title,
      description,
      originalText,
      analysisData,
      isPublic,
      isDraft,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      thumbnail: null
    };

    analyses.push(newAnalysis);
    nextId++;

    res.status(201).json({
      success: true,
      analysis: newAnalysis
    });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save analysis'
    });
  }
});

// Get analyses for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const requestingUserId = req.headers['user-id'];
    const canSeePrivate = requestingUserId === userId;

    let userAnalyses = analyses.filter(analysis => analysis.userId === userId);

    // Filter based on privacy settings
    if (!canSeePrivate) {
      userAnalyses = userAnalyses.filter(analysis => 
        !analysis.isDraft && analysis.isPublic
      );
    }

    // Add author information
    const analysesWithAuthor = userAnalyses.map(analysis => ({
      ...analysis,
      author: {
        id: userId,
        name: 'Mock User',
        email: 'user@example.com',
        avatar: null
      },
      isLiked: false
    }));

    res.json({
      success: true,
      analyses: analysesWithAuthor
    });
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyses'
    });
  }
});

// Get a specific analysis by ID
router.get('/:analysisId', (req: Request, res: Response) => {
  try {
    const analysisId = req.params.analysisId;
    const analysis = analyses.find(a => a.id === analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // Check if user has permission to view this analysis
    const requestingUserId = req.headers['user-id'];
    const canView = analysis.isPublic || 
                   (!analysis.isDraft && analysis.isPublic) ||
                   (requestingUserId === analysis.userId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Increment view count
    analysis.viewCount++;

    // Add author information
    const analysisWithAuthor = {
      ...analysis,
      author: {
        id: analysis.userId,
        name: 'Mock User',
        email: 'user@example.com',
        avatar: null
      },
      isLiked: false
    };

    res.json({
      success: true,
      analysis: analysisWithAuthor
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
});

// Delete an analysis
router.delete('/:analysisId', (req: Request, res: Response) => {
  try {
    const analysisId = req.params.analysisId;
    const analysisIndex = analyses.findIndex(a => a.id === analysisId);
    
    if (analysisIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    const analysis = analyses[analysisIndex];
    
    // Check if user owns this analysis
    const requestingUserId = req.headers['user-id'];
    if (requestingUserId !== analysis.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Remove the analysis
    analyses.splice(analysisIndex, 1);

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis'
    });
  }
});

// Like/unlike an analysis
router.post('/:analysisId/like', (req: Request, res: Response) => {
  try {
    const analysisId = req.params.analysisId;
    const analysis = analyses.find(a => a.id === analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    const { isLiked } = req.body;
    
    if (isLiked) {
      analysis.likeCount++;
    } else {
      analysis.likeCount = Math.max(0, analysis.likeCount - 1);
    }

    res.json({
      success: true,
      likeCount: analysis.likeCount,
      isLiked
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

export default router; 