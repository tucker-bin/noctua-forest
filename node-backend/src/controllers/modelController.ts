import { Request, Response, NextFunction } from 'express';

import { settings } from '../config/settings';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { UserPreferences, UserUsage } from '../types/user';


export const getAvailableModels = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const models = settings.models.available.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      tier: model.tier,
      strengths: model.strengths,
      costPerToken: model.costPerToken,
      maxTokens: model.maxTokens
    }));

    res.json({
      models,
      defaultModel: settings.models.default
    });
  } catch (error) {
    logger.error('Error fetching available models:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
};

export const getModelRecommendation = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, language = 'en', complexity = 'standard' } = req.body;
    
    if (!text) {
      res.status(400).json({ error: 'Text is required for model recommendation' });
      return;
    }

    const recommendedModelId = settings.models.getRecommendedModel(
      text.length, 
      language, 
      complexity as 'simple' | 'standard' | 'complex'
    );

    const recommendedModel = settings.models.available.find(m => m.id === recommendedModelId);
    const estimatedTokens = Math.ceil(text.length / 4); // Rough estimation
    const estimatedCost = settings.models.calculateCost(estimatedTokens, recommendedModelId);

    res.json({
      recommendedModel: {
        id: recommendedModel?.id,
        name: recommendedModel?.name,
        description: recommendedModel?.description,
        tier: recommendedModel?.tier
      },
      estimatedTokens,
      estimatedCost,
      reasoning: {
        textLength: text.length,
        language,
        complexity,
        isRTL: ['ar', 'he', 'fa', 'ur'].includes(language),
        isComplexLanguage: ['ja', 'zh', 'ko', 'ar', 'he', 'fa', 'ur'].includes(language)
      }
    });
  } catch (error) {
    logger.error('Error getting model recommendation:', error);
    res.status(500).json({ error: 'Failed to get model recommendation' });
  }
};

export const getUserPreferences = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const doc = await db.collection('user_preferences').doc(userId).get();
    const preferences = doc.exists ? doc.data() as UserPreferences : {};

    res.json({ preferences });
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
};

export const updateUserPreferences = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const updates: Partial<UserPreferences> = req.body;
    
    // Validate model ID if provided
    if (updates.preferredModel) {
      const modelExists = settings.models.available.some(m => m.id === updates.preferredModel);
      if (!modelExists) {
        res.status(400).json({ error: 'Invalid model ID' });
        return;
      }
    }

    // Validate budget limit
    if (updates.budgetLimit !== undefined) {
      if (updates.budgetLimit < 0 || updates.budgetLimit > 1000) {
        res.status(400).json({ error: 'Budget limit must be between $0 and $1000' });
        return;
      }
    }

    await db.collection('user_preferences').doc(userId).set(updates, { merge: true });
    
    logger.info('User preferences updated', { userId, updates });
    res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
};

export const getUserUsage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const doc = await db.collection('user_usage').doc(userId).get();
    if (!doc.exists) {
      res.json({
        tokensUsedThisMonth: 0,
        costThisMonth: 0,
        observationsThisMonth: 0,
        favoriteModels: []
      });
      return;
    }

    const usage = doc.data() as UserUsage;
    
    // Check if we need to reset for new month
    const now = new Date();
    // Handle both Date and Firestore Timestamp
    let lastReset: Date;
    if (usage.lastReset instanceof Date) {
      lastReset = usage.lastReset;
    } else if (usage.lastReset && typeof (usage.lastReset as any).toDate === 'function') {
      lastReset = (usage.lastReset as any).toDate();
    } else {
      lastReset = new Date(usage.lastReset);
    }
    
    const needsReset = now.getMonth() !== lastReset.getMonth() || 
                      now.getFullYear() !== lastReset.getFullYear();

    if (needsReset) {
      const resetUsage = {
        tokensUsedThisMonth: 0,
        costThisMonth: 0,
        observationsThisMonth: 0,
        lastReset: now,
        favoriteModels: usage.favoriteModels || []
      };
      
      await db.collection('user_usage').doc(userId).set(resetUsage);
      res.json(resetUsage);
    } else {
      res.json({
        tokensUsedThisMonth: usage.tokensUsedThisMonth,
        costThisMonth: usage.costThisMonth,
        observationsThisMonth: usage.observationsThisMonth,
        favoriteModels: usage.favoriteModels || []
      });
    }
  } catch (error) {
    logger.error('Error fetching user usage:', error);
    res.status(500).json({ error: 'Failed to fetch user usage' });
  }
};

export const getCostEstimate = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, modelId, language = 'en' } = req.body;
    
    if (!text) {
      res.status(400).json({ error: 'Text is required for cost estimation' });
      return;
    }

    const selectedModelId = modelId || settings.models.getRecommendedModel(text.length, language);
    const model = settings.models.available.find(m => m.id === selectedModelId);
    
    if (!model) {
      res.status(400).json({ error: 'Invalid model ID' });
      return;
    }

    const estimatedTokens = Math.ceil(text.length / 4);
    const estimatedCost = settings.models.calculateCost(estimatedTokens, selectedModelId);

    res.json({
      modelId: selectedModelId,
      modelName: model.name,
      estimatedTokens,
      estimatedCost,
      costPerToken: model.costPerToken
    });
  } catch (error) {
    logger.error('Error calculating cost estimate:', error);
    res.status(500).json({ error: 'Failed to calculate cost estimate' });
  }
}; 