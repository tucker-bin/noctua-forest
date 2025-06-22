import { db } from '../config/firebase';
import { Lesson, LessonProgress, UserProgress, LearningPath } from '../types/lesson.types';
import { logger } from '../utils/logger';

class LessonService {
  private lessonsRef = db.collection('lessons');
  private progressRef = db.collection('lessonProgress');
  private usersRef = db.collection('users');

  async getLessons(path: LearningPath): Promise<Lesson[]> {
    try {
      const snapshot = await this.lessonsRef
        .where('path', '==', path)
        .orderBy('order')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lesson));
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
      return {
        id: doc.id,
        ...doc.data()
      } as Lesson;
    } catch (error) {
      logger.error('Error fetching lesson:', error);
      throw error;
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const snapshot = await this.progressRef
        .where('userId', '==', userId)
        .where('lessonId', '==', lessonId)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as LessonProgress;
    } catch (error) {
      logger.error('Error fetching lesson progress:', error);
      throw error;
    }
  }

  async startLesson(userId: string, lesson: Lesson): Promise<LessonProgress> {
    try {
      // Check if progress already exists
      const existingProgress = await this.getLessonProgress(userId, lesson.id);
      if (existingProgress) return existingProgress;

      // Create new progress
      const exercises = lesson.content.sections
        .filter(section => section.type === 'exercise')
        .map((_, index) => ({
          exerciseId: `${lesson.id}_ex_${index}`,
          completed: false,
          attempts: 0,
          lastAttemptAt: new Date()
        }));

      const progressData: Omit<LessonProgress, 'id'> = {
        userId,
        lessonId: lesson.id,
        path: lesson.path,
        status: 'started',
        exercises,
        startedAt: new Date(),
        timeSpent: 0
      };

      const docRef = await this.progressRef.add(progressData);
      return {
        id: docRef.id,
        ...progressData
      } as LessonProgress;
    } catch (error) {
      logger.error('Error starting lesson:', error);
      throw error;
    }
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

      // Update exercise progress
      exerciseProgress.attempts += 1;
      exerciseProgress.lastAttemptAt = new Date();
      exerciseProgress.completed = answer === correctAnswer;

      // Check if all exercises are completed
      const allCompleted = progress.exercises.every(ex => ex.completed);
      if (allCompleted && progress.status !== 'completed') {
        progress.status = 'completed';
        progress.completedAt = new Date();

        // Update user progress
        const userDoc = await this.usersRef.doc(userId).get();
        const userData = userDoc.data() as { progress?: UserProgress };
        
        if (userData?.progress) {
          const pathProgress = userData.progress[progress.path as keyof typeof userData.progress] as any;
          if (pathProgress && !pathProgress.completedLessons?.includes(lessonId)) {
            if (pathProgress.completedLessons) pathProgress.completedLessons.push(lessonId);
            await this.usersRef.doc(userId).update({
              [`progress.${progress.path}.completedLessons`]: pathProgress?.completedLessons || []
            });
          }
        }
      }

      // Save progress
      await this.progressRef.doc(progress.id).update({
        exercises: progress.exercises,
        status: progress.status,
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