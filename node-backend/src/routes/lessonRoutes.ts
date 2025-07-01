import express, { Response } from 'express';

import { requireAuth } from '../middleware/auth';

import { lessonService } from '../services/lessonService';
import { LearningPath } from '../types/lesson.types';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

const router = express.Router();

// Get all lessons for a path
router.get('/:path', requireAuth, async (req: any, res: any) => {
  try {
    const path = req.params.path as LearningPath;
    if (!['celestial-observer', 'pattern-navigator', 'cultural-astronomer'].includes(path)) {
      res.status(400).json({
        success: false,
        error: 'Invalid path'
      });
      return;
    }

    const lessons = await lessonService.getLessons(path);
    res.json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    logger.error('Error getting lessons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lessons'
    });
 return;
  }
});

// Get a specific lesson
router.get('/:path/:slug', requireAuth, async (req: any, res: any) => {
  try {
    const { path, slug } = req.params;
    if (!['celestial-observer', 'pattern-navigator', 'cultural-astronomer'].includes(path)) {
      res.status(400).json({
        success: false,
        error: 'Invalid path'
      });
      return;
    }

    const lesson = await lessonService.getLesson(path as LearningPath, slug);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    // Get user's progress for this lesson
    const progress = await lessonService.getLessonProgress((req as any).user.uid, lesson.id);

    res.json({
      success: true,
      data: {
        lesson,
        progress: progress || null
      }
    });
  } catch (error) {
    logger.error('Error getting lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson'
    });
 return;
  }
});

// Start a lesson
router.post('/:path/:slug/start', requireAuth, async (req: any, res: any) => {
  try {
    const { path, slug } = req.params;
    const { language = 'en' } = req.body;
    
    if (!['celestial-observer', 'pattern-navigator', 'cultural-astronomer'].includes(path)) {
      res.status(400).json({
        success: false,
        error: 'Invalid path'
      });
      return;
    }

    const lesson = await lessonService.getLesson(path as LearningPath, slug);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    const progress = await lessonService.startLesson((req as any).user.uid, lesson, language);
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Error starting lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start lesson'
    });
 return;
  }
});

// Submit exercise answer
router.post('/:path/:slug/exercise/:exerciseId', requireAuth, async (req: any, res: any) => {
  try {
    const { path, slug, exerciseId } = req.params;
    const { answer } = req.body;

    const lesson = await lessonService.getLesson(path as LearningPath, slug);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    // Find the exercise in the lesson
    const exercise = lesson.content.sections
      .find(section => section.type === 'exercise')
      ?.exercises?.[0];

    if (!exercise) {
      res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
      return;
    }

    const result = await lessonService.updateExerciseProgress(
      (req as any).user.uid,
      lesson.id,
      exerciseId,
      answer,
      exercise.correctAnswer
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error submitting exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit exercise'
    });
 return;
  }
});

// Update lesson time
router.put('/:path/:slug/time', requireAuth, async (req: any, res: any) => {
  try {
    const { path, slug } = req.params;
    const { timeSpent } = req.body;

    const lesson = await lessonService.getLesson(path as LearningPath, slug);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    await lessonService.updateLessonTime((req as any).user.uid, lesson.id, timeSpent);
    res.json({
      success: true,
      message: 'Time updated successfully'
    });
  } catch (error) {
    logger.error('Error updating lesson time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lesson time'
    });
 return;
  }
});

// Scriptorium Lessons
router.post('/scriptorium', requireAuth, async (req, res, next) => {
  try {
    const { lesson } = req.body;
    const userId = req.user!.uid;

    if (!lesson) {
      throw new ValidationError('Lesson data is required');
    }

    const savedLesson = await lessonService.saveScriptoriumLesson(userId, lesson);
    res.json(savedLesson);
  } catch (error) {
    next(error);
  }
});

router.get('/scriptorium', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    const lessons = await lessonService.getScriptoriumLessons(userId);
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

// Community Lessons
router.get('/community', async (req, res, next) => {
  try {
    const { 
      limit, 
      offset, 
      sortBy, 
      difficulty 
    } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortBy: sortBy as 'recent' | 'popular',
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced'
    };

    const lessons = await lessonService.getCommunityLessons(options);
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

router.post('/scriptorium/:lessonId/publish', requireAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.uid;

    const lesson = await lessonService.getLesson('celestial-observer', lessonId);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    await lessonService.updateLessonTime(userId, lessonId, 0); // Mark as published
    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
});

export default router; 