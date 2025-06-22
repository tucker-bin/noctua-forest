import { db } from '../config/firebase';
import { logger } from '../utils/logger';

interface HelpContent {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  lastUpdated: Date;
}

interface UserContext {
  userId: string;
  isAdmin: boolean;
}

class HelpService {
  private helpRef = db.collection('help');
  private feedbackRef = db.collection('help_feedback');

  async getContent(language: string, context: UserContext): Promise<HelpContent[]> {
    try {
      const snapshot = await this.helpRef
        .where('language', '==', language)
        .orderBy('category')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpContent[];
    } catch (error) {
      logger.error('Error fetching help content:', error);
      throw error;
    }
  }

  async submitFeedback(feedback: {
    userId: string;
    context: string;
    feedback: string;
    rating: number;
  }): Promise<void> {
    try {
      await this.feedbackRef.add({
        ...feedback,
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async search(query: string, language: string, context: UserContext): Promise<HelpContent[]> {
    try {
      // For now, doing a simple text match
      // In production, this would use a proper search engine
      const snapshot = await this.helpRef
        .where('language', '==', language)
        .get();

      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HelpContent[];

      return results.filter(content =>
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.content.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      logger.error('Error searching help content:', error);
      throw error;
    }
  }
}

export const helpService = new HelpService(); 