import { logger } from '../utils/logger';
import { db } from '../config/firebase';
import { Lesson, LessonProgress, UserProgress, LearningPath, ScriptoriumLesson, LessonWithStatus } from '../types/lesson.types';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

class LessonService {
  private lessonsRef = db.collection('lessons');
  private progressRef = db.collection('lessonProgress');
  private usersRef = db.collection('users');
  private scriptoriumRef = db.collection('scriptorium');

  async getLessons(path: LearningPath): Promise<Lesson[]> {
    try {
      const snapshot = await this.lessonsRef
        .where('path', '==', path)
        .orderBy('order')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          path: data.path || 'celestial-observer',
          slug: data.slug || '',
          title: data.title || '',
          description: data.description || '',
          order: data.order || 0,
          duration: data.duration || '0',
          difficulty: data.difficulty || 'beginner',
          content: data.content || { sections: [] },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Lesson;
      });
    } catch (error) {
      logger.error('Error fetching lessons:', error);
      throw error;
    }
  }

  async getLesson(path: LearningPath, slug: string): Promise<Lesson | null> {
    try {
      const snapshot = await this.lessonsRef
        .where('path', '==', path)
        .where('slug', '==', slug)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        path: data.path || 'celestial-observer',
        slug: data.slug || '',
        title: data.title || '',
        description: data.description || '',
        order: data.order || 0,
        duration: data.duration || '0',
        difficulty: data.difficulty || 'beginner',
        content: data.content || { sections: [] },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Lesson;
    } catch (error) {
      logger.error('Error fetching lesson:', error);
      throw error;
    }
  }

  async getScriptoriumLessons(): Promise<ScriptoriumLesson[]> {
    try {
      const snapshot = await this.scriptoriumRef.get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          path: data.path || 'celestial-observer',
          slug: data.slug || '',
          title: data.title || '',
          description: data.description || '',
          order: data.order || 0,
          duration: data.duration || '0',
          difficulty: data.difficulty || 'beginner',
          content: data.content || { sections: [] },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          sourceAnalysis: {
            songDetails: {
              title: data.sourceAnalysis?.songDetails?.title || '',
              artist: data.sourceAnalysis?.songDetails?.artist || '',
              album: data.sourceAnalysis?.songDetails?.album
            },
            patterns: data.sourceAnalysis?.patterns || [],
            emotionalAnalysis: data.sourceAnalysis?.emotionalAnalysis,
            culturalContext: data.sourceAnalysis?.culturalContext
          },
          exercises: data.exercises || []
        } as ScriptoriumLesson;
      });
    } catch (error) {
      logger.error('Failed to get Scriptorium lessons:', { error });
      throw error;
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const snapshot = await this.progressRef
        .where('userId', '==', userId)
        .where('lessonId', '==', lessonId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startedAt: data.startedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        exercises: data.exercises || []
      } as LessonProgress;
    } catch (error) {
      logger.error('Error fetching lesson progress:', error);
      throw error;
    }
  }

  async publishLesson(lesson: LessonWithStatus, userId: string): Promise<void> {
    try {
      const lessonRef = this.scriptoriumRef.doc(lesson.id);
      const lessonDoc = await lessonRef.get();

      if (!lessonDoc.exists) {
        throw new Error('Lesson not found');
      }

      const lessonData = lessonDoc.data();
      if (lessonData?.userId !== userId) {
        throw new Error('Unauthorized');
      }

      const updatedLesson = {
        ...lesson,
        status: 'published' as const,
        updatedAt: new Date()
      };

      await lessonRef.update(updatedLesson);
    } catch (error) {
      logger.error('Failed to publish lesson:', { error });
      throw error;
    }
  }

  async startLesson(userId: string, lesson: Lesson, language: string = 'en'): Promise<LessonProgress> {
    try {
      const existingProgress = await this.getLessonProgress(userId, lesson.id);
      if (existingProgress) {
        return existingProgress;
      }

      const exercises = lesson.content.sections
        .filter(section => section.type === 'exercise')
        .map((_, index) => ({
          exerciseId: `${lesson.id}_ex_${index}`,
          completed: false,
          attempts: 0,
          lastAttemptAt: new Date()
        }));

      const progress: LessonProgress = {
        id: uuidv4(),
        userId,
        lessonId: lesson.id,
        path: lesson.path,
        status: 'started',
        progress: 0,
        exercises,
        startedAt: new Date(),
        timeSpent: 0
      };

      await this.progressRef.doc(progress.id).set(progress);
      return progress;
    } catch (error) {
      logger.error('Error starting lesson:', error);
      throw error;
    }
  }

  async completeLesson(userId: string, lessonId: string): Promise<void> {
    try {
      const progressRef = this.progressRef
        .where('userId', '==', userId)
        .where('lessonId', '==', lessonId)
        .limit(1);

      const snapshot = await progressRef.get();
      if (snapshot.empty) {
        throw new Error('Progress not found');
      }

      const doc = snapshot.docs[0];
      await doc.ref.update({
        status: 'completed',
        progress: 100,
        completedAt: FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.error('Error completing lesson:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const userDoc = await this.usersRef.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const data = userDoc.data();
      return {
        currentPath: data?.currentPath || 'celestial-observer',
        paths: data?.paths || {
          'celestial-observer': {
            completedLessons: [],
            currentLesson: null,
            totalProgress: 0
          },
          'pattern-navigator': {
            completedLessons: [],
            currentLesson: null,
            totalProgress: 0
          },
          'cultural-astronomer': {
            completedLessons: [],
            currentLesson: null,
            totalProgress: 0
          }
        }
      };
    } catch (error) {
      logger.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async saveScriptoriumLesson(userId: string, lesson: ScriptoriumLesson): Promise<LessonWithStatus> {
    const lessonWithUser: LessonWithStatus = {
      ...lesson,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.scriptoriumRef.add(lessonWithUser);
    return {
      ...lessonWithUser,
      id: docRef.id
    };
  }

  async getScriptoriumLessons(userId: string): Promise<LessonWithStatus[]> {
    const snapshot = await this.scriptoriumRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const lessons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate() || null,
        sourceAnalysis: data.sourceAnalysis || {},
        exercises: data.exercises || [],
        path: data.path || 'celestial-observer',
        slug: data.slug || '',
        content: data.content || { sections: [] }
      } as LessonWithStatus;
    });

    return lessons;
  }

  async getCommunityLessons(options: { page?: number; limit?: number } = {}): Promise<LessonWithStatus[]> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const snapshot = await this.scriptoriumRef
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const lessons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate() || null,
        sourceAnalysis: data.sourceAnalysis || {},
        exercises: data.exercises || [],
        path: data.path || 'celestial-observer',
        slug: data.slug || '',
        content: data.content || { sections: [] }
      } as LessonWithStatus;
    });

    return lessons;
  }

  async updateExerciseProgress(
    userId: string,
    lessonId: string,
    exerciseId: string,
    answer: string,
    correctAnswer: string
  ): Promise<{ correct: boolean; completed: boolean; lessonCompleted: boolean }> {
    try {
      const progress = await this.getLessonProgress(userId, lessonId);
      if (!progress) throw new Error('Lesson not started');

      const exerciseProgress = progress.exercises.find(ex => ex.exerciseId === exerciseId);
      if (!exerciseProgress) throw new Error('Exercise not found');

      exerciseProgress.attempts += 1;
      exerciseProgress.lastAttemptAt = new Date();
      exerciseProgress.completed = answer === correctAnswer;

      const allCompleted = progress.exercises.every(ex => ex.completed);
      const completedCount = progress.exercises.filter(ex => ex.completed).length;
      const totalExercises = progress.exercises.length;

      progress.progress = Math.round((completedCount / totalExercises) * 100);

      if (allCompleted && progress.status !== 'completed') {
        progress.status = 'completed';
        progress.completedAt = new Date();
      }

      await this.progressRef.doc(progress.id).update({
        exercises: progress.exercises,
        status: progress.status,
        progress: progress.progress,
        completedAt: progress.completedAt
      });

      return {
        correct: answer === correctAnswer,
        completed: exerciseProgress.completed,
        lessonCompleted: progress.status === 'completed'
      };
    } catch (error) {
      logger.error('Error updating exercise progress:', error);
      throw error;
    }
  }

  async updateLessonTime(userId: string, lessonId: string, timeSpent: number): Promise<void> {
    try {
      const progress = await this.getLessonProgress(userId, lessonId);
      if (!progress) throw new Error('Lesson progress not found');

      await this.progressRef.doc(progress.id).update({
        timeSpent: progress.timeSpent + timeSpent
      });
    } catch (error) {
      logger.error('Error updating lesson time:', error);
      throw error;
    }
  }
}

export const lessonService = new LessonService();

export const saveScriptoriumLesson = async (
  userId: string,
  lesson: Omit<ScriptoriumLesson, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScriptoriumLesson> => {
  try {
    const lessonId = uuidv4();
    const now = new Date();
    
    const fullLesson: ScriptoriumLesson = {
      ...lesson,
      id: lessonId,
      createdAt: now,
      updatedAt: now
    };

    // Save to Firestore
    await db.collection('lessons').doc(lessonId).set({
      ...fullLesson,
      userId,
      type: 'scriptorium',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    logger.info('Saved Scriptorium lesson:', { lessonId });
    
    return fullLesson;
  } catch (error) {
    logger.error('Failed to save Scriptorium lesson:', { error });
    throw error;
  }
};

export const getScriptoriumLessons = async (userId: string): Promise<ScriptoriumLesson[]> => {
  try {
    const snapshot = await db.collection('lessons')
      .where('userId', '==', userId)
      .where('type', '==', 'scriptorium')
      .orderBy('createdAt', 'desc')
      .get();

    const lessons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as ScriptoriumLesson;
    });

    return lessons;
  } catch (error) {
    logger.error('Failed to get Scriptorium lessons:', { error });
    throw error;
  }
};

export const publishLesson = async (
  userId: string,
  lessonId: string
): Promise<ScriptoriumLesson> => {
  try {
    const lessonRef = db.collection('lessons').doc(lessonId);
    const lessonDoc = await lessonRef.get();

    if (!lessonDoc.exists) {
      throw new Error('Lesson not found');
    }

    const lesson = lessonDoc.data() as ScriptoriumLesson;

    if (lesson.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Create a published version
    const publishedLesson: ScriptoriumLesson = {
      ...lesson,
      status: undefined,
      publishedAt: undefined
    };

    await lessonRef.update(publishedLesson);
    
    logger.info('Published lesson:', { lessonId });
    
    return publishedLesson;
  } catch (error) {
    logger.error('Failed to publish lesson:', { error });
    throw error;
  }
};

export const getCommunityLessons = async (
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'popular';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  } = {}
): Promise<{
  lessons: ScriptoriumLesson[];
  total: number;
}> => {
  try {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'recent',
      difficulty
    } = options;

    let query = db.collection('lessons')
      .where('status', '==', 'published');

    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }

    if (sortBy === 'recent') {
      query = query.orderBy('publishedAt', 'desc');
    } else {
      query = query.orderBy('downloads', 'desc');
    }

    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    const snapshot = await query
      .limit(limit)
      .offset(offset)
      .get();

    const lessons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined
      } as ScriptoriumLesson;
    });

    return { lessons, total };
  } catch (error) {
    logger.error('Failed to get community lessons:', { error });
    throw error;
  }
}; 