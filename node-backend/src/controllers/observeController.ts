import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { observationService } from '../services/observationService';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { db } from '../config/firebase';
import { Observation } from '../types/observation';

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

export const saveObservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { observation, title, tags, isPublic = false } = req.body;

    if (!observation || !observation.text || !observation.patterns) {
      res.status(400).json({ 
        error: 'Valid observation data is required',
        details: 'Observation must include text and patterns'
      });
      return;
    }

    // Create saved observation document
    const savedObservation = {
      ...observation,
      id: undefined, // Remove ID as Firestore will generate one
      userId: req.userId,
      title: title || `Observation - ${new Date().toLocaleDateString()}`,
      tags: tags || [],
      isPublic: isPublic,
      savedAt: new Date(),
      createdAt: observation.createdAt || new Date()
    };

    // Save to Firestore
    const docRef = await db.collection('saved_observations').add(savedObservation);
    
    logger.info('Observation saved successfully', {
      userId: req.userId,
      observationId: docRef.id,
      title: savedObservation.title,
      patternsCount: observation.patterns?.length
    });

    res.json({
      success: true,
      id: docRef.id,
      message: 'Observation saved successfully'
    });

  } catch (error) {
    logger.error('Error saving observation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to save observation' });
  }
};

export const getObservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Observation ID is required' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const doc = await db.collection('saved_observations').doc(id).get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Observation not found' });
      return;
    }

    const observationData = doc.data();
    const observation = { id: doc.id, ...observationData } as Observation & { 
      userId: string; 
      isPublic?: boolean;
      title?: string;
      tags?: string[];
      savedAt?: Date;
    };

    // Check if user owns this observation or if it's public
    if (observation.userId !== req.userId && !observation.isPublic) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    logger.info('Observation retrieved', {
      userId: req.userId,
      observationId: id,
      isOwner: observation.userId === req.userId
    });

    res.json({
      success: true,
      data: observation
    });

  } catch (error) {
    logger.error('Error getting observation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
      observationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to retrieve observation' });
  }
};

export const getUserObservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 10, sortBy = 'savedAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // Cap at 50
    const offset = (pageNum - 1) * limitNum;

    // Query user's saved observations
    let query = db.collection('saved_observations')
      .where('userId', '==', req.userId)
      .orderBy(sortBy as string, sortOrder === 'desc' ? 'desc' : 'asc')
      .limit(limitNum);

    if (offset > 0) {
      // For pagination, we need to get the last document from previous page
      const prevQuery = db.collection('saved_observations')
        .where('userId', '==', req.userId)
        .orderBy(sortBy as string, sortOrder === 'desc' ? 'desc' : 'asc')
        .limit(offset);
      
      const prevSnapshot = await prevQuery.get();
      if (!prevSnapshot.empty) {
        const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const observations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count for pagination
    const totalSnapshot = await db.collection('saved_observations')
      .where('userId', '==', req.userId)
      .get();
    
    const totalCount = totalSnapshot.size;
    const totalPages = Math.ceil(totalCount / limitNum);

    logger.info('User observations retrieved', {
      userId: req.userId,
      count: observations.length,
      page: pageNum,
      totalCount
    });

    res.json({
      success: true,
      data: {
        observations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user observations:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to retrieve observations' });
  }
};

export const deleteObservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Observation ID is required' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if observation exists and user owns it
    const doc = await db.collection('saved_observations').doc(id).get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Observation not found' });
      return;
    }

    const observation = doc.data();
    if (observation?.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Delete the observation
    await db.collection('saved_observations').doc(id).delete();

    logger.info('Observation deleted', {
      userId: req.userId,
      observationId: id
    });

    res.json({
      success: true,
      message: 'Observation deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting observation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
      observationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to delete observation' });
  }
};

export const observeAnonymousExample = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language = 'en', exampleId } = req.body;
    
    if (!text || typeof text !== 'string') {
      logger.warn('Invalid text input for anonymous example');
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (!exampleId || typeof exampleId !== 'string') {
      logger.warn('Invalid example ID for anonymous example');
      res.status(400).json({ error: 'Example ID is required' });
      return;
    }

    // Log the received text for debugging
    logger.info('Anonymous example request received', { 
      exampleId,
      text: text.trim(),
      textLength: text.length 
    });

    // More flexible validation - check if text contains key phrases from examples
    const allowedExamplePhrases = [
      'rain in Spain',
      'trees of green',
      'Peter Piper picked',
      'Twinkle, twinkle',
      'She sells seashells'
    ];

    const textToCheck = text.trim().toLowerCase();
    const isValidExample = allowedExamplePhrases.some(phrase => 
      textToCheck.includes(phrase.toLowerCase())
    );

    if (!isValidExample) {
      logger.warn('Attempted to use non-example text anonymously', { 
        text: text.substring(0, 100),
        exampleId 
      });
      res.status(400).json({ 
        error: 'Anonymous usage is only allowed for predefined examples',
        requiresAuth: true,
        debug: {
          receivedText: text.trim(),
          allowedPhrases: allowedExamplePhrases
        }
      });
      return;
    }

    logger.info('Processing anonymous example observation', { 
      exampleId,
      textLength: text.length, 
      language,
      isValidExample 
    });

    // Use a dummy user ID for anonymous usage
    const anonymousUserId = `anonymous_${exampleId}`;
    
    const result = await observationService.observeText(text, anonymousUserId, language, { 
      focusMode: 'comprehensive',
      isAnonymous: true 
    });

    // Remove sensitive data for anonymous users
    const anonymousResult = {
      id: result.id,
      text: result.text,
      language: result.language,
      patterns: result.patterns,
      segments: result.segments,
      constellations: result.constellations,
      createdAt: result.createdAt,
      metadata: {
        rhymeScheme: result.metadata?.rhymeScheme,
        meter: result.metadata?.meter
      },
      modelUsed: 'example',
      cost: 0,
      tokensUsed: 0,
      isAnonymousExample: true,
      exampleId
    };

    logger.info('Anonymous example observation completed successfully', { 
      exampleId,
      patternsCount: result.patterns?.length
    });

    res.json(anonymousResult);
  } catch (error) {
    logger.error('Error in observeAnonymousExample controller:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorDetails: error
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}; 