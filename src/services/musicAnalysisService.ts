import { getAuth } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SongDetailsData {
  title: string;
  artistName: string;
  albumName: string;
  duration: string;
  releaseYear?: number;
  genre?: string[];
}

export interface LyricalTheme {
  name: string;
  value: number;
  color: string;
}

export interface EmotionPoint {
  subject: string;
  value: number;
  fullMark?: number;
}

export interface MoodPoint {
  section: string;
  energyLevel: number;
  timestamp?: number;
}

export interface MusicObservationData {
  id: string;
  data: {
    originalText: string;
    language: string;
    patterns: Array<{
      type: string;
      text: string;
      confidence: number;
      explanation: string;
    }>;
    totalWords: number;
    analysisTimestamp: string;
    complexity: string;
  };
  metadata: {
    user: string;
    timestamp: string;
    version: string;
    title: string;
    description: string;
    tags: string[];
  };
  musicMetadata: {
    songDetails: SongDetailsData;
    lyricsSource: 'musixmatch' | 'manual' | 'hybrid';
    confidence: number;
    originalInput?: string;
  };
  enhancedAnalysis: {
    songStructure: Array<{ section: string; startLine: number; endLine: number }>;
    lyricalThemes: LyricalTheme[];
    emotionalAnalysis: EmotionPoint[];
    moodTimeline: MoodPoint[];
  };
  modelUsed: string;
  cost: number;
  tokensUsed: number;
}

export interface ServiceStatus {
  musixmatchConfigured: boolean;
  features: {
    lyricsCleanup: boolean;
    songDetection: boolean;
    enhancedMetadata: boolean;
    patternAnalysis: boolean;
    musicSpecificAnalysis: boolean;
  };
}

export interface SongDetectionResult {
  title?: string;
  artist?: string;
  confidence: number;
}

class MusicAnalysisService {
  private async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const config: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(data && { body: JSON.stringify(data) })
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  private async makePublicRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data && { body: JSON.stringify(data) })
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  /**
   * Analyze lyrics using Observatory patterns + music-specific analysis
   */
  async analyzeLyrics(text: string, language: string = 'en'): Promise<MusicObservationData> {
    const response = await this.makeAuthenticatedRequest<{
      success: boolean;
      data: MusicObservationData;
      message: string;
    }>('POST', '/music/analyze', { text, language });

    if (!response.success) {
      throw new Error(response.message || 'Analysis failed');
    }

    return response.data;
  }

  /**
   * Detect song information from input text
   */
  async detectSong(text: string): Promise<SongDetectionResult | null> {
    const response = await this.makePublicRequest<{
      success: boolean;
      data: SongDetectionResult | null;
      message: string;
    }>('POST', '/music/detect-song', { text });

    return response.data;
  }

  /**
   * Get service configuration status
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    const response = await this.makePublicRequest<{
      success: boolean;
      data: ServiceStatus;
      message: string;
    }>('GET', '/music/status');

    return response.data;
  }

  /**
   * Get user's music observations with pagination
   */
  async getUserObservations(limit: number = 10, offset: number = 0): Promise<{
    observations: MusicObservationData[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.makeAuthenticatedRequest<{
      success: boolean;
      data: {
        observations: MusicObservationData[];
        total: number;
        hasMore: boolean;
      };
      message: string;
    }>('GET', `/music/observations?limit=${limit}&offset=${offset}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch observations');
    }

    return response.data;
  }

  /**
   * Get a specific music observation by ID
   */
  async getObservation(id: string): Promise<MusicObservationData> {
    const response = await this.makeAuthenticatedRequest<{
      success: boolean;
      data: MusicObservationData;
      message: string;
    }>('GET', `/music/observations/${id}`);

        if (!response.success) {
      throw new Error(response.message || 'Failed to fetch observation');
    }

    return response.data;
  }
}

export const musicAnalysisService = new MusicAnalysisService(); 