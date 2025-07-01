import { PatternType } from './observation';

export type LearningPath = 'celestial-observer' | 'pattern-navigator' | 'cultural-astronomer';

export interface PatternGroup {
  id: string;
  title: string;
  description: string;
  patterns: Array<{
    type: PatternType;
    examples: string[];
    explanation: string;
    significance: number;
  }>;
  learningObjective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LessonSection {
  type: 'welcome' | 'practice' | 'examples' | 'exercise' | 'pattern_sequence';
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
  learningObjective?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  patterns?: Array<{
    type: PatternType;
    examples: string[];
    explanation: string;
    significance: number;
  }>;
}

export interface Lesson {
  id: string;
  path: LearningPath;
  slug: string;
  title: string;
  description: string;
  order: number;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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
  progress: number; // 0-100
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
  paths: {
    [key in LearningPath]: {
      completedLessons: string[];
      currentLesson: string | null;
      totalProgress: number;
    };
  };
}

export interface ScriptoriumLesson extends Lesson {
  sourceAnalysis: {
    songDetails: {
      title: string;
      artist: string;
      album?: string;
    };
    patterns: Array<{
      type: PatternType;
      examples: string[];
      explanation: string;
      significance: number;
    }>;
    emotionalAnalysis?: {
      emotions: Array<{
        name: string;
        value: number;
      }>;
    };
    culturalContext?: string;
  };
  exercises: Array<{
    type: 'pattern_recognition' | 'cultural_context' | 'emotional_analysis';
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export interface LessonWithStatus extends Lesson {
  status: 'draft' | 'published';
  userId?: string;
} 