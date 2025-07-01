import React from 'react';
import { logger } from '../utils/logger';

export interface LessonInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  locked: boolean;
  progress?: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  lessons: LessonInfo[];
  totalProgress: number;
  icon?: React.ReactNode;
}

export interface LessonProgress {
  lessonId: string;
  pathId: string;
  progress: number;
  completed: boolean;
  lastAccessed: Date;
  timeSpent: number;
}

class LessonService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  async getLearningPaths(userId?: string): Promise<LearningPath[]> {
    try {
      const url = userId 
        ? `${this.baseUrl}/api/lessons/paths?userId=${userId}`
        : `${this.baseUrl}/api/lessons/paths`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch learning paths: ${response.statusText}`);
      }

      const data = await response.json();
      return data.paths || [];
    } catch (error) {
      logger.error('Error fetching learning paths:', { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback to mock data for development
      return this.getMockLearningPaths();
    }
  }

  async getLessonContent(pathId: string, lessonId: string, language: string = 'en'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/lessons/${pathId}/${lessonId}?lang=${language}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson content: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching lesson content:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async updateLessonProgress(pathId: string, lessonId: string, progress: Partial<LessonProgress>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/lessons/${pathId}/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(progress)
      });

      if (!response.ok) {
        throw new Error(`Failed to update lesson progress: ${response.statusText}`);
      }

      logger.info('Lesson progress updated successfully', { pathId, lessonId, progress });
    } catch (error) {
      logger.error('Error updating lesson progress:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<LessonProgress[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/lessons/progress?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user progress: ${response.statusText}`);
      }

      const data = await response.json();
      return data.progress || [];
    } catch (error) {
      logger.error('Error fetching user progress:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  // Mock data for development/fallback
  private getMockLearningPaths(): LearningPath[] {
    return [
      {
        id: 'celestial_observer',
        name: 'Celestial Observer',
        description: 'Begin your journey by learning to observe patterns like stars in the night sky',
        totalProgress: 33,
        lessons: [
          {
            id: 'first_light',
            title: 'First Light: Introduction to Observation',
            description: 'Introduction to sound observation and basic pattern recognition',
            duration: '20 min',
            difficulty: 'beginner',
            completed: true,
            locked: false,
            progress: 100
          },
          {
            id: 'star_patterns',
            title: 'Star Patterns: Universal Sounds',
            description: 'Explore universal patterns that appear across languages',
            duration: '25 min',
            difficulty: 'beginner',
            completed: false,
            locked: false,
            progress: 60
          },
          {
            id: 'constellation_mapping',
            title: 'Constellation Mapping: Connected Sounds',
            description: 'Learn to connect related sounds and create pattern networks',
            duration: '30 min',
            difficulty: 'intermediate',
            completed: false,
            locked: false,
            progress: 0
          },
          {
            id: 'night_vision',
            title: 'Night Vision: Advanced Pattern Recognition',
            description: 'Develop skills to recognize subtle and complex patterns',
            duration: '35 min',
            difficulty: 'intermediate',
            completed: false,
            locked: true,
            progress: 0
          }
        ]
      },
      {
        id: 'pattern_navigator',
        name: 'Pattern Navigator',
        description: 'Advanced techniques for navigating and creating complex pattern systems',
        totalProgress: 0,
        lessons: [
          {
            id: 'advanced_mapping',
            title: 'Advanced Pattern Mapping',
            description: 'Master complex pattern relationships and networks',
            duration: '40 min',
            difficulty: 'advanced',
            completed: false,
            locked: true,
            progress: 0
          }
        ]
      }
    ];
  }
}

export const lessonService = new LessonService(); 