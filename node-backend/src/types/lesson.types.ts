export type LearningPath = 'explorer' | 'navigator';

export interface LessonSection {
  type: 'welcome' | 'practice' | 'examples' | 'exercise';
  title: string;
  content: string;
  examples?: Array<{
    text: string;
    explanation?: string;
  }>;
  exercises?: Array<{
    question: string;
    options?: string[];
    correctAnswer: string;
    hint?: string;
  }>;
}

export interface Lesson {
  id: string;
  path: LearningPath;
  slug: string;
  title: string;
  description: string;
  order: number;
  content: {
    sections: LessonSection[];
  };
  requirements?: string[];
  nextLesson?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  path: LearningPath;
  status: 'started' | 'completed';
  exercises: Array<{
    exerciseId: string;
    completed: boolean;
    attempts: number;
    lastAttemptAt: Date;
  }>;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

export interface UserProgress {
  currentPath: LearningPath;
  progress: {
    explorer: {
      completedLessons: string[];
      currentLesson: string | null;
      progress: number;
    };
    navigator: {
      completedLessons: string[];
      currentLesson: string | null;
      progress: number;
    };
  };
} 