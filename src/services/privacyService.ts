import { auth } from '../config/firebase';
import { log } from '../utils/logger';

const API_BASE_URL = 'http://localhost:3001/api/privacy';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentVersion: string;
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

interface DataSummary {
  profile: {
    accountCreated: string;
    lastActive: string;
    email: string;
    displayName: string;
  };
  dataTypes: {
    observations: number;
    lessonProgress: number;
    feedback: number;
    privacySettings: number;
  };
  storage: {
    totalDocuments: number;
    estimatedSize: string;
  };
  rights: {
    dataExport: string;
    dataDeletion: string;
    dataCorrection: string;
    dataPortability: string;
  };
}

interface DeletionRequest {
  success: boolean;
  deletionRequestId: string;
  message: string;
  processingTimeframe: string;
  contactEmail: string;
  requestedAt: string;
}

class PrivacyService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Cookie consent management (no auth required)
  async getCookieConsent(): Promise<{
    hasConsent: boolean;
    consentVersion: string;
    preferences: CookieConsent;
    timestamp?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cookie-consent`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get cookie consent');
      }

      return await response.json();
    } catch (error) {
      log.error('Failed to get cookie consent', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async updateCookieConsent(consent: Partial<CookieConsent>): Promise<{
    success: boolean;
    sessionId: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...consent,
          consentVersion: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update cookie consent');
      }

      return await response.json();
    } catch (error) {
      log.error('Failed to update cookie consent', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Privacy settings (authenticated)
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get privacy settings');
      }

      const data = await response.json();
      return {
        ...data,
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      log.error('Failed to get privacy settings', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      const data = await response.json();
      return {
        ...data,
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      log.error('Failed to update privacy settings', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Data summary
  async getDataSummary(): Promise<DataSummary> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/data-summary`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get data summary');
      }

      return await response.json();
    } catch (error) {
      log.error('Failed to get data summary', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Data export (GDPR Article 20)
  async exportUserData(): Promise<Blob> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/data-export`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many export requests. Please wait before trying again.');
        }
        throw new Error('Failed to export user data');
      }

      // Return as blob for download
      return await response.blob();
    } catch (error) {
      log.error('Failed to export user data', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Data deletion (GDPR Article 17)
  async requestDataDeletion(reason: string): Promise<DeletionRequest> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/data-deletion`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          reason,
          confirmDeletion: true
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many deletion requests. Please wait before trying again.');
        }
        throw new Error('Failed to request data deletion');
      }

      return await response.json();
    } catch (error) {
      log.error('Failed to request data deletion', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Utility methods
  downloadDataExport(blob: Blob, filename?: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `noctua-forest-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Check if user has specific consent
  hasAnalyticsConsent(): boolean {
    // This would typically check stored consent
    // For now, return false as default
    return false;
  }

  hasMarketingConsent(): boolean {
    // This would typically check stored consent
    // For now, return false as default
    return false;
  }
}

export const privacyService = new PrivacyService();
export type { CookieConsent, PrivacySettings, DataSummary, DeletionRequest }; 