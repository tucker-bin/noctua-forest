import { logger } from '../utils/logger';
import { admin, db, auth } from '../config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface ConsentData {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface PrivacySettings {
  dataRetention: 'minimal' | 'standard' | 'extended';
  allowAnalytics: boolean;
  allowMarketing: boolean;
  profileVisibility: 'private' | 'friends' | 'public';
  shareUsageData: boolean;
  updatedAt?: Date;
}

interface DataExportRequest {
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

interface DeletionRequest {
  id: string;
  userId: string;
  reason: string;
  requestedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  ipAddress?: string;
  userEmail?: string;
}

class PrivacyService {
  // Cookie consent management
  async getCookieConsent(sessionId: string) {
    try {
      const consentDoc = await db.collection('cookieConsents').doc(sessionId).get();
      
      if (!consentDoc.exists) {
        return {
          hasConsent: false,
          consentVersion: '1.0',
          preferences: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
          }
        };
      }

      const data = consentDoc.data();
      return {
        hasConsent: true,
        consentVersion: data?.consentVersion || '1.0',
        preferences: {
          necessary: data?.necessary !== false,
          analytics: data?.analytics || false,
          marketing: data?.marketing || false,
          preferences: data?.preferences || false
        },
        timestamp: data?.timestamp?.toDate?.() || data?.timestamp
      };
    } catch (error) {
      logger.error('Error getting cookie consent:', error);
      throw error;
    }
  }

  async updateCookieConsent(sessionId: string, consentData: ConsentData) {
    try {
      await db.collection('cookieConsents').doc(sessionId).set({
        ...consentData,
        timestamp: Timestamp.fromDate(consentData.timestamp)
      }, { merge: true });

      logger.info(`Cookie consent updated for session: ${sessionId}`);
    } catch (error) {
      logger.error('Error updating cookie consent:', error);
      throw error;
    }
  }

  // Privacy settings
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const settingsDoc = await db.collection('privacySettings').doc(userId).get();
      
      if (!settingsDoc.exists) {
        // Return default settings
        const defaultSettings: PrivacySettings = {
          dataRetention: 'standard',
          allowAnalytics: false,
          allowMarketing: false,
          profileVisibility: 'private',
          shareUsageData: false,
          updatedAt: new Date()
        };

        // Save default settings
        await this.updatePrivacySettings(userId, defaultSettings);
        return defaultSettings;
      }

      const data = settingsDoc.data() as any;
      return {
        dataRetention: data.dataRetention || 'standard',
        allowAnalytics: data.allowAnalytics || false,
        allowMarketing: data.allowMarketing || false,
        profileVisibility: data.profileVisibility || 'private',
        shareUsageData: data.shareUsageData || false,
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      };
    } catch (error) {
      logger.error('Error getting privacy settings:', error);
      throw error;
    }
  }

  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const updateData = {
        ...settings,
        updatedAt: Timestamp.fromDate(settings.updatedAt || new Date())
      };

      await db.collection('privacySettings').doc(userId).set(updateData, { merge: true });
      
      logger.info(`Privacy settings updated for user: ${userId}`);
      
      // Return updated settings
      return this.getPrivacySettings(userId);
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // Data summary
  async getDataSummary(userId: string) {
    try {
      const [
        userDoc,
        observationsQuery,
        lessonsQuery,
        feedbackQuery
      ] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('observations').where('userId', '==', userId).get(),
        db.collection('userProgress').where('userId', '==', userId).get(),
        db.collection('feedback').where('userId', '==', userId).get()
      ]);

      const userData = userDoc.exists ? userDoc.data() : {};
      
      return {
        profile: {
          accountCreated: userData?.createdAt?.toDate?.() || userData?.createdAt,
          lastActive: userData?.lastActive?.toDate?.() || userData?.lastActive,
          email: userData?.email,
          displayName: userData?.displayName
        },
        dataTypes: {
          observations: observationsQuery.size,
          lessonProgress: lessonsQuery.size,
          feedback: feedbackQuery.size,
          privacySettings: 1
        },
        storage: {
          totalDocuments: observationsQuery.size + lessonsQuery.size + feedbackQuery.size + 1,
          estimatedSize: `${Math.round((observationsQuery.size * 2 + lessonsQuery.size * 1 + feedbackQuery.size * 0.5) / 1024 * 100) / 100} KB`
        },
        rights: {
          dataExport: 'Available',
          dataDeletion: 'Available',
          dataCorrection: 'Available via profile settings',
          dataPortability: 'JSON format available'
        }
      };
    } catch (error) {
      logger.error('Error getting data summary:', error);
      throw error;
    }
  }

  // Data export
  async exportUserData(userId: string) {
    try {
      const [
        userDoc,
        observationsQuery,
        lessonsQuery,
        feedbackQuery,
        privacySettings
      ] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('observations').where('userId', '==', userId).get(),
        db.collection('userProgress').where('userId', '==', userId).get(),
        db.collection('feedback').where('userId', '==', userId).get(),
        this.getPrivacySettings(userId)
      ]);

      const userData = userDoc.exists ? userDoc.data() : {};
      
      const observations = observationsQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      const lessons = lessonsQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      const feedback = feedbackQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      return {
        profile: {
          ...userData,
          createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt,
          lastActive: userData?.lastActive?.toDate?.()?.toISOString() || userData?.lastActive
        },
        observations,
        learningProgress: lessons,
        feedback,
        privacySettings,
        exportMetadata: {
          totalRecords: observations.length + lessons.length + feedback.length + 1,
          exportedAt: new Date().toISOString(),
          format: 'JSON',
          gdprCompliant: true
        }
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Data deletion
  async requestDataDeletion(userId: string, details: {
    reason: string;
    requestedAt: Date;
    ipAddress?: string;
    userEmail?: string;
  }): Promise<DeletionRequest> {
    try {
      const deletionId = `del_${userId}_${Date.now()}`;
      
      const deletionRequest: DeletionRequest = {
        id: deletionId,
        userId,
        reason: details.reason,
        requestedAt: details.requestedAt,
        status: 'pending',
        ipAddress: details.ipAddress,
        userEmail: details.userEmail
      };

      await db.collection('deletionRequests').doc(deletionId).set({
        ...deletionRequest,
        requestedAt: Timestamp.fromDate(details.requestedAt)
      });

      logger.info(`Data deletion requested: ${deletionId} for user: ${userId}`);
      
      return deletionRequest;
    } catch (error) {
      logger.error('Error requesting data deletion:', error);
      throw error;
    }
  }

  // Audit logging
  async logDataAccess(userId: string, action: string, ipAddress?: string) {
    try {
      await db.collection('dataAccessLogs').add({
        userId,
        action,
        timestamp: Timestamp.now(),
        ipAddress,
        userAgent: 'API'
      });
    } catch (error) {
      logger.error('Error logging data access:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  // Cleanup expired cookie consents (run periodically)
  async cleanupExpiredConsents() {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const expiredQuery = await db.collection('cookieConsents')
        .where('timestamp', '<', Timestamp.fromDate(oneYearAgo))
        .get();

      const batch = db.batch();
      expiredQuery.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      if (expiredQuery.size > 0) {
        await batch.commit();
        logger.info(`Cleaned up ${expiredQuery.size} expired cookie consents`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired consents:', error);
    }
  }
}

export const privacyService = new PrivacyService(); 