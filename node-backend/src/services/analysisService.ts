import { logger } from '../utils/logger';
import { admin, db, auth } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import ContentModerationService from './contentModerationService';
import { AuthRequest } from '../middleware/auth';

interface Analysis {
  id: string;
  userId: string;
  title: string;
  description?: string;
  originalText: string;
  analysisData: any;
  isPublic: boolean;
  isDraft: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  thumbnail?: string;
}

interface AnalysisAuthor {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

class AnalysisService {
  private analysesRef = db.collection('analyses');
  private likesRef = db.collection('likes');

  async createAnalysis(
    userId: string,
    data: Omit<Analysis, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount' | 'shareCount'>
  ): Promise<Analysis> {
    try {
      // Content moderation check
      const moderationResult = await ContentModerationService.moderateContent(
        data.originalText,
        { title: data.title, description: data.description, tags: data.tags }
      );

      if (!moderationResult.isApproved) {
        throw new Error('Content moderation failed');
      }

      const now = new Date();
      const analysisData: Omit<Analysis, 'id'> = {
        userId,
        ...data,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0
      };

      const docRef = await this.analysesRef.add(analysisData);
      const analysis: Analysis = { ...analysisData, id: docRef.id };

      logger.info(`Analysis created: ${docRef.id} by user: ${userId}`);
      return analysis;
    } catch (error) {
      logger.error('Error creating analysis:', error);
      throw error;
    }
  }

  async getUserAnalyses(userId: string, requestingUserId?: string): Promise<Analysis[]> {
    try {
      let query = this.analysesRef.where('userId', '==', userId);
      
      // If not the owner, only show public non-draft analyses
      if (requestingUserId !== userId) {
        query = query.where('isPublic', '==', true).where('isDraft', '==', false);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      const analyses: Analysis[] = [];
      snapshot.forEach((doc: any) => {
        analyses.push({ ...doc.data(), id: doc.id } as Analysis);
      });

      return analyses;
    } catch (error) {
      logger.error('Error fetching user analyses:', error);
      throw error;
    }
  }

  async getAnalysis(analysisId: string, requestingUserId?: string): Promise<Analysis | null> {
    try {
      const doc = await this.analysesRef.doc(analysisId).get();
      
      if (!doc.exists) {
        return null;
      }

      const analysis = { ...doc.data(), id: doc.id } as Analysis;

      // Check permissions
      const canView = analysis.isPublic || 
                     (!analysis.isDraft && analysis.isPublic) ||
                     (requestingUserId === analysis.userId);

      if (!canView) {
        throw new Error('Access denied');
      }

      // Increment view count
      await this.analysesRef.doc(analysisId).update({
        viewCount: FieldValue.increment(1)
      });

      return analysis;
    } catch (error) {
      logger.error('Error fetching analysis:', error);
      throw error;
    }
  }

  async updateAnalysis(
    analysisId: string,
    userId: string,
    updates: Partial<Omit<Analysis, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Analysis> {
    try {
      const doc = await this.analysesRef.doc(analysisId).get();
      
      if (!doc.exists) {
        throw new Error('Analysis not found');
      }

      const analysis = doc.data() as Analysis;
      
      if (analysis.userId !== userId) {
        throw new Error('Access denied');
      }

      // Content moderation for updated content
      if (updates.originalText || updates.title || updates.description || updates.tags) {
        const moderationResult = await ContentModerationService.moderateContent(
          updates.originalText || analysis.originalText,
          { 
            title: updates.title || analysis.title, 
            description: updates.description || analysis.description,
            tags: updates.tags || analysis.tags
          }
        );

        if (!moderationResult.isApproved) {
          throw new Error('Content moderation failed');
        }
      }

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await this.analysesRef.doc(analysisId).update(updateData);

      return { ...analysis, ...updateData, id: analysisId };
    } catch (error) {
      logger.error('Error updating analysis:', error);
      throw error;
    }
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    try {
      const doc = await this.analysesRef.doc(analysisId).get();
      
      if (!doc.exists) {
        throw new Error('Analysis not found');
      }

      const analysis = doc.data() as Analysis;
      
      if (analysis.userId !== userId) {
        throw new Error('Access denied');
      }

      // Delete associated likes
      const likesSnapshot = await this.likesRef
        .where('analysisId', '==', analysisId)
        .get();
      
      const batch = db.batch();
      
      likesSnapshot.forEach((likeDoc: any) => {
        batch.delete(likeDoc.ref);
      });
      
      batch.delete(doc.ref);
      await batch.commit();

      logger.info(`Analysis deleted: ${analysisId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error deleting analysis:', error);
      throw error;
    }
  }

  async toggleLike(analysisId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const analysisDoc = await this.analysesRef.doc(analysisId).get();
      
      if (!analysisDoc.exists) {
        throw new Error('Analysis not found');
      }

      const likeId = `${userId}_${analysisId}`;
      const likeDoc = await this.likesRef.doc(likeId).get();
      
      const batch = db.batch();
      
      if (likeDoc.exists) {
        // Unlike
        batch.delete(likeDoc.ref);
        batch.update(analysisDoc.ref, {
          likeCount: FieldValue.increment(-1)
        });
        
        await batch.commit();
        
        const updatedAnalysis = await analysisDoc.ref.get();
        return {
          liked: false,
          likeCount: updatedAnalysis.data()?.likeCount || 0
        };
      } else {
        // Like
        batch.set(this.likesRef.doc(likeId), {
          userId,
          analysisId,
          createdAt: new Date()
        });
        batch.update(analysisDoc.ref, {
          likeCount: FieldValue.increment(1)
        });
        
        await batch.commit();
        
        const updatedAnalysis = await analysisDoc.ref.get();
        return {
          liked: true,
          likeCount: updatedAnalysis.data()?.likeCount || 0
        };
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      throw error;
    }
  }

  async getPublicAnalyses(limit: number = 20, startAfter?: string): Promise<Analysis[]> {
    try {
      let query = this.analysesRef
        .where('isPublic', '==', true)
        .where('isDraft', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (startAfter) {
        const startDoc = await this.analysesRef.doc(startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      const snapshot = await query.get();
      
      const analyses: Analysis[] = [];
      snapshot.forEach((doc: any) => {
        analyses.push({ ...doc.data(), id: doc.id } as Analysis);
      });

      return analyses;
    } catch (error) {
      logger.error('Error fetching public analyses:', error);
      throw error;
    }
  }

  async getAnalysisAuthor(userId: string): Promise<AnalysisAuthor> {
    try {
      const userRecord = await auth.getUser(userId);
      
      return {
        id: userRecord.uid,
        displayName: userRecord.displayName || 'Anonymous User',
        email: userRecord.email,
        photoURL: userRecord.photoURL
      };
    } catch (error) {
      logger.error('Error fetching user info:', error);
      return {
        id: userId,
        displayName: 'Anonymous User'
      };
    }
  }

  async isLikedByUser(analysisId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${analysisId}`;
      const likeDoc = await this.likesRef.doc(likeId).get();
      return likeDoc.exists;
    } catch (error) {
      logger.error('Error checking like status:', error);
      return false;
    }
  }
}

export const analysisService = new AnalysisService();
export type { Analysis, AnalysisAuthor }; 