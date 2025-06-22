import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { musicAnalysisService } from '../services/musicAnalysisService';
import { AppError } from '../utils/errors';

export class MusicController {
  /**
   * Analyze lyrics - main endpoint for Scriptorium
   */
  async analyzeLyrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { input, language = 'en' } = req.body;
      
      if (!input || typeof input !== 'string') {
        res.status(400).json({ 
          error: 'Input is required and must be a string',
          details: 'Please provide song lyrics, title, or identifying information'
        });
        return;
      }

      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      logger.info('Music analysis request', { 
        userId: req.userId, 
        inputLength: input.length,
        language 
      });

      const result = await musicAnalysisService.analyzeLyrics(input, req.userId, language);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Music analysis failed:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId 
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
          details: error.details
        });
        return;
      }

      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Music analysis service temporarily unavailable'
      });
    }
  }

  /**
   * Detect song from input text
   */
  async detectSong(req: Request, res: Response): Promise<void> {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        res.status(400).json({
          error: 'Input is required and must be a string',
          details: 'Please provide song lyrics or identifying information'
        });
        return;
      }

      const result = await musicAnalysisService.detectSong(input);
      
      if (!result) {
        res.json({
          success: false,
          message: 'No song detected from the provided input',
          suggestions: [
            'Try including more specific information like artist name',
            'Include some actual lyrics from the song',
            'Make sure the song title and artist are spelled correctly'
          ]
        });
        return;
      }

      res.json({
        success: true,
        data: result,
        message: 'Song detection completed'
      });
    } catch (error) {
      logger.error('Song detection failed:', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Song detection service temporarily unavailable'
      });
    }
  }

  /**
   * Get service configuration status
   */
  async getServiceStatus(req: Request, res: Response) {
    try {
      const isConfigured = musicAnalysisService.isConfigured();
      
      res.status(200).json({
        success: true,
        data: {
          musixmatchConfigured: isConfigured,
          features: {
            lyricsCleanup: true,
            songDetection: isConfigured,
            enhancedMetadata: isConfigured,
            patternAnalysis: true,
            musicSpecificAnalysis: true
          }
        },
        message: 'Service status retrieved'
      });

    } catch (error) {
      logger.error('Service status error:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get service status'
      });
    }
  }

  /**
   * Get user's music observations
   */
  async getUserObservations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { page = 1, limit = 10 } = req.query;
      
      // For now, return a placeholder response since this method isn't fully implemented
      res.status(501).json({ 
        error: 'Feature not yet implemented',
        message: 'Music observation history will be available in a future update'
      });
    } catch (error) {
      logger.error('Error getting user observations:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId 
      });
      
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to retrieve music observations'
      });
    }
  }

  /**
   * Get specific music observation by ID
   */
  async getObservation(req: AuthRequest, res: Response): Promise<void> {
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

      // For now, return a placeholder response since this method isn't fully implemented
      res.status(501).json({ 
        error: 'Feature not yet implemented',
        message: 'Individual music observation retrieval will be available in a future update'
      });
    } catch (error) {
      logger.error('Error getting observation:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
        observationId: req.params.id
      });
      
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to retrieve music observation'
      });
    }
  }
}

export const musicController = new MusicController(); 