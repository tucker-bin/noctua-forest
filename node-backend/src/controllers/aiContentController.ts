import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiContentGenerationService } from '../services/aiContentGenerationService';
import { regionalContentService } from '../services/regionalContentService';
import { logger } from '../utils/logger';

/**
 * Get or generate daily content for user
 */
export const getDailyContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userLevel, isPremium } = req.body;
    
    if (!userLevel || typeof userLevel !== 'number') {
      res.status(400).json({ error: 'User level is required and must be a number' });
      return;
    }

    // Try regional content first, fall back to standard AI content
    let contentBundle;
    try {
      contentBundle = await regionalContentService.generateRegionalDailyContent(
        req.userId,
        userLevel,
        isPremium
      );
    } catch (error) {
      logger.info('Regional content failed, using standard AI content', { userId: req.userId });
      contentBundle = await aiContentGenerationService.getUserDailyContent(
        req.userId, 
        userLevel
      );
    }

    if (!contentBundle) {
      res.status(500).json({ error: 'Failed to generate daily content' });
      return;
    }

    // Track usage
    await aiContentGenerationService.trackBundleUsage(contentBundle.id, req.userId);

    logger.info('Daily content provided', { 
      userId: req.userId, 
      bundleId: contentBundle.id,
      userLevel 
    });

    res.json({
      success: true,
      data: contentBundle
    });

  } catch (error) {
    logger.error('Error getting daily content:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to get daily content' });
  }
};

/**
 * Generate a new weekly pack (premium feature)
 */
export const generateWeeklyPack = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { theme, weekStart } = req.body;
    
    const startDate = weekStart ? new Date(weekStart) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const weeklyPack = await aiContentGenerationService.generateWeeklyPack(
      startDate,
      theme || 'progressive'
    );

    logger.info('Weekly pack generated', { 
      userId: req.userId, 
      packSize: weeklyPack.length,
      theme,
      weekStart: startDate
    });

    res.json({
      success: true,
      data: {
        packId: `weekly_${startDate.getTime()}`,
        bundles: weeklyPack,
        weekStart: startDate,
        theme: theme || 'progressive'
      }
    });

  } catch (error) {
    logger.error('Error generating weekly pack:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to generate weekly pack' });
  }
};

/**
 * Generate cultural series pack
 */
export const generateCulturalSeries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { culture, difficulty } = req.body;
    
    if (!culture) {
      res.status(400).json({ error: 'Culture parameter is required' });
      return;
    }

    const culturalPack = await aiContentGenerationService.generateCulturalSeries(
      culture,
      difficulty || 5
    );

    logger.info('Cultural series generated', { 
      userId: req.userId, 
      culture,
      packSize: culturalPack.length,
      difficulty: difficulty || 5
    });

    res.json({
      success: true,
      data: {
        seriesId: `cultural_${culture}_${Date.now()}`,
        bundles: culturalPack,
        culture,
        difficulty: difficulty || 5
      }
    });

  } catch (error) {
    logger.error('Error generating cultural series:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
      culture: req.body.culture
    });
    res.status(500).json({ error: 'Failed to generate cultural series' });
  }
};

/**
 * Get available premium bundles for purchase
 */
export const getPremiumBundles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { theme } = req.query;
    
    const premiumBundles = await aiContentGenerationService.getPremiumBundles(
      theme as string
    );

    logger.info('Premium bundles requested', { 
      userId: req.userId,
      theme,
      bundleCount: premiumBundles.length 
    });

    res.json({
      success: true,
      data: premiumBundles
    });

  } catch (error) {
    logger.error('Error getting premium bundles:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to get premium bundles' });
  }
};

/**
 * Get content progression levels for user education
 */
export const getContentProgression = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userLevel } = req.query;
    
    // Import the progression constant from the service
    const { CONTENT_PROGRESSION } = await import('../services/aiContentGenerationService');
    
    let relevantLevels = CONTENT_PROGRESSION;
    
    if (userLevel && typeof userLevel === 'string') {
      const level = parseInt(userLevel, 10);
      if (!isNaN(level)) {
        // Show current level and next 2-3 levels for progression preview
        relevantLevels = CONTENT_PROGRESSION.filter(
          contentLevel => contentLevel.level >= level && contentLevel.level <= level + 3
        );
      }
    }

    res.json({
      success: true,
      data: {
        progression: relevantLevels,
        totalLevels: CONTENT_PROGRESSION.length,
        currentUserLevel: userLevel || 1
      }
    });

  } catch (error) {
    logger.error('Error getting content progression:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to get content progression' });
  }
};

/**
 * Track when user completes an AI-generated challenge
 */
export const trackChallengeCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { bundleId, success, accuracy, timeElapsed, difficulty } = req.body;
    
    if (!bundleId) {
      res.status(400).json({ error: 'Bundle ID is required' });
      return;
    }

    // Track the usage
    await aiContentGenerationService.trackBundleUsage(bundleId, req.userId);

    // Additional analytics for challenge completion
    await import('../config/firebase').then(({ db }) => {
      return db.collection('challenge_completions').add({
        bundleId,
        userId: req.userId,
        success: success || false,
        accuracy: accuracy || 0,
        timeElapsed: timeElapsed || 0,
        difficulty: difficulty || 1,
        completedAt: new Date()
      });
    });

    logger.info('Challenge completion tracked', { 
      userId: req.userId, 
      bundleId,
      success,
      accuracy,
      timeElapsed
    });

    res.json({
      success: true,
      message: 'Challenge completion tracked successfully'
    });

  } catch (error) {
    logger.error('Error tracking challenge completion:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
      bundleId: req.body.bundleId
    });
    res.status(500).json({ error: 'Failed to track challenge completion' });
  }
};

/**
 * Initialize user's regional progression
 */
export const initializeRegionalProgression = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { detectedRegion, userSelectedRegion } = req.body;
    
    const progression = await regionalContentService.initializeUserRegion(
      req.userId,
      detectedRegion,
      userSelectedRegion
    );

    logger.info('Regional progression initialized', { 
      userId: req.userId, 
      region: progression.region,
      nativeLanguage: progression.nativeLanguage
    });

    res.json({
      success: true,
      data: {
        progression,
        personalizedMessage: `Welcome to patterns from ${progression.region}! 🌍`,
        culturalHooks: progression.culturalHooks.slice(0, 3), // First 3 hooks for preview
        discoveryPath: progression.discoveryPath
      }
    });

  } catch (error) {
    logger.error('Error initializing regional progression:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to initialize regional progression' });
  }
};

/**
 * Get available regions for user selection
 */
export const getAvailableRegions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const regions = regionalContentService.getAvailableRegions();

    res.json({
      success: true,
      data: {
        regions,
        totalRegions: regions.length,
        recommendation: 'Choose your cultural background for personalized learning!'
      }
    });

  } catch (error) {
    logger.error('Error getting available regions:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Failed to get available regions' });
  }
};

/**
 * Check for feature discovery milestones
 */
export const checkDiscoveryMilestones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userLevel } = req.body;
    
    if (!userLevel || typeof userLevel !== 'number') {
      res.status(400).json({ error: 'User level is required and must be a number' });
      return;
    }

    const milestones = await regionalContentService.checkDiscoveryMilestones(
      req.userId, 
      userLevel
    );

    if (milestones.length > 0) {
      logger.info('Discovery milestones unlocked', { 
        userId: req.userId, 
        milestones: milestones.map(m => m.feature)
      });
    }

    res.json({
      success: true,
      data: {
        newMilestones: milestones,
        hasNewUnlocks: milestones.length > 0,
        message: milestones.length > 0 ? 
          `🎉 New features unlocked: ${milestones.map(m => m.feature).join(', ')}!` :
          'Keep playing to unlock more features!'
      }
    });

  } catch (error) {
    logger.error('Error checking discovery milestones:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to check discovery milestones' });
  }
};

/**
 * Generate cultural onboarding sequence
 */
export const generateOnboardingSequence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { regionCode } = req.body;
    
    if (!regionCode) {
      res.status(400).json({ error: 'Region code is required' });
      return;
    }

    const onboardingSequence = await regionalContentService.generateOnboardingSequence(
      req.userId,
      regionCode
    );

    logger.info('Onboarding sequence generated', { 
      userId: req.userId, 
      regionCode,
      steps: onboardingSequence.length
    });

    res.json({
      success: true,
      data: {
        sequence: onboardingSequence,
        totalSteps: onboardingSequence.length,
        estimatedTime: `${onboardingSequence.length * 2} minutes`,
        culturalFocus: regionCode
      }
    });

  } catch (error) {
    logger.error('Error generating onboarding sequence:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
      regionCode: req.body.regionCode
    });
    res.status(500).json({ error: 'Failed to generate onboarding sequence' });
  }
}; 