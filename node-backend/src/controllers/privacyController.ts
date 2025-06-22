import { Request, Response, NextFunction } from 'express';

import { admin } from '../config/firebase';
import { logger } from '../utils/logger';
import { privacyService } from '../services/privacyService';


interface CookieConsentData {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface PrivacySettings {
  dataProcessing: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdPartySharing: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  activityTracking: boolean;
  emailNotifications: boolean;
  updatedAt: Date;
}

// Cookie consent management (no auth required)
export const getCookieConsent = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      res.json({
        hasConsent: false,
        consentVersion: '1.0',
        preferences: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false
        }
      });
      return;
    }

    const consent = await privacyService.getCookieConsent(sessionId);
    res.json(consent);
  } catch (error: any) {
    logger.error('Error getting cookie consent:', error);
    res.status(500).json({ error: 'Failed to retrieve cookie consent' });
  }
};

export const updateCookieConsent = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      sessionId, 
      analytics, 
      marketing, 
      functional,
      consentVersion 
    } = req.body;
    
    const consentData: CookieConsentData = {
      analytics: analytics || false,
      marketing: marketing || false,
      functional: functional !== false, // Default to true for functional cookies
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    await privacyService.updateCookieConsent(sessionId, consentData);

    // Set session cookie if not exists
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    res.json({ success: true, sessionId });
  } catch (error: any) {
    logger.error('Error updating cookie consent:', error);
    res.status(500).json({ error: 'Failed to update cookie consent' });
  }
};

// Privacy settings (authenticated)
export const getPrivacySettings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const settings = await privacyService.getPrivacySettings(userId);
    res.json(settings);
  } catch (error: any) {
    logger.error('Error getting privacy settings:', error);
    res.status(500).json({ error: 'Failed to retrieve privacy settings' });
  }
};

export const updatePrivacySettings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const settings: Partial<PrivacySettings> = req.body;
    settings.updatedAt = new Date();

    const updatedSettings = await privacyService.updatePrivacySettings(userId, settings);
    res.json(updatedSettings);
  } catch (error: any) {
    logger.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
};

// Data summary
export const getDataSummary = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const summary = await privacyService.getDataSummary(userId);
    res.json(summary);
  } catch (error: any) {
    logger.error('Error getting data summary:', error);
    res.status(500).json({ error: 'Failed to retrieve data summary' });
  }
};

// Data export (GDPR Article 20)
export const exportUserData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    logger.info(`Data export requested by user: ${userId}`);

    const exportData = await privacyService.exportUserData(userId);
    
    // Log the export request for compliance
    await privacyService.logDataAccess(userId, 'data_export', req.ip);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="noctua-forest-data-${userId}-${Date.now()}.json"`);
    
    res.json({
      exportTimestamp: new Date().toISOString(),
      userId,
      userEmail,
      data: exportData,
      metadata: {
        exportVersion: '1.0',
        gdprCompliant: true,
        requestedAt: new Date().toISOString(),
        ipAddress: req.ip
      }
    });
  } catch (error: any) {
    logger.error('Error exporting user data:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

// Data deletion (GDPR Article 17)
export const requestDataDeletion = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { reason, confirmDeletion } = req.body;

    if (!confirmDeletion) {
      res.status(400).json({ error: 'Deletion confirmation required' });
      return;
    }

    logger.info(`Data deletion requested by user: ${userId}, reason: ${reason}`);

    // Create deletion request (processed within 30 days per GDPR)
    const deletionRequest = await privacyService.requestDataDeletion(userId, {
      reason: reason || 'User requested deletion',
      requestedAt: new Date(),
      ipAddress: req.ip,
      userEmail
    });

    // Log the deletion request for compliance
    await privacyService.logDataAccess(userId, 'deletion_request', req.ip);

    res.json({
      success: true,
      deletionRequestId: deletionRequest.id,
      message: 'Data deletion request submitted successfully',
      processingTimeframe: '30 days',
      contactEmail: 'privacy@noctuaforest.com',
      requestedAt: deletionRequest.requestedAt
    });
  } catch (error: any) {
    logger.error('Error requesting data deletion:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
}; 