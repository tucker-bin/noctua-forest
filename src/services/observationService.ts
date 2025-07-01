import { ObservationData, Pattern } from '../types/observatory';
import { auth } from '../config/firebase';
import { log } from '../utils/logger';

// In development, use empty string to leverage Vite proxy
// In production, VITE_API_URL will be set by the build process
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
console.log('🔧 Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV
});

interface AnalysisOptions {
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  culturalContext?: boolean;
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
}

interface ObserveOptions {
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  language?: string;
}

interface SaveObservationData {
  observation: ObservationData;
  title?: string;
  tags?: string[];
  isPublic?: boolean;
}

interface SavedObservation extends ObservationData {
  id: string;
  title: string;
  tags: string[];
  isPublic: boolean;
  savedAt: string;
  userId: string;
}

interface PaginatedObservations {
  observations: SavedObservation[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ObservationService {
  
  async observeText(text: string, options: ObserveOptions = {}): Promise<ObservationData> {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      log.info('Starting text observation', { textLength: text.length, options });
      
      const response = await fetch(`${API_BASE_URL}/api/observe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          language: options.language || 'en',
          focusMode: options.focusMode || 'comprehensive'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      log.info('Observation completed', { 
        patternsFound: result.patterns?.length || 0,
        modelUsed: result.modelUsed 
      });

      return result;
    } catch (error) {
      log.error('Observation failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async saveObservation(data: SaveObservationData): Promise<{ id: string; message: string }> {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required to save observations');
    }

    try {
      log.info('Saving observation', { 
        title: data.title,
        patternsCount: data.observation.patterns?.length || 0,
        isPublic: data.isPublic 
      });
      
      const response = await fetch(`${API_BASE_URL}/api/observe/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save observation: ${response.status}`);
      }

      const result = await response.json();
      log.info('Observation saved successfully', { id: result.id });

      return result;
    } catch (error) {
      log.error('Save observation failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getUserObservations(options: {
    page?: number;
    limit?: number;
    sortBy?: 'savedAt' | 'createdAt' | 'title';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedObservations> {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const params = new URLSearchParams({
        page: String(options.page || 1),
        limit: String(options.limit || 10),
        sortBy: options.sortBy || 'savedAt',
        sortOrder: options.sortOrder || 'desc'
      });

      const response = await fetch(`${API_BASE_URL}/api/observe/saved?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch observations: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      log.error('Fetch observations failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getObservation(id: string): Promise<SavedObservation> {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/observe/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch observation: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      log.error('Fetch observation failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async deleteObservation(id: string): Promise<{ message: string }> {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/observe/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete observation: ${response.status}`);
      }

      const result = await response.json();
      log.info('Observation deleted successfully', { id });
      return result;
    } catch (error) {
      log.error('Delete observation failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export const observationService = new ObservationService();

// Legacy function for backward compatibility  
export async function observeText(
  text: string, 
  language: string = 'en', 
  options?: any
): Promise<ObservationData> {
  return observationService.observeText(text, { language, ...options });
}

export default observationService;

export const observeAnonymousExample = async (text: string, exampleId: string, language: string = 'en') => {
  try {
    const url = `${API_BASE_URL}/api/observe/example`;
    console.log('🔍 Anonymous example request details:');
    console.log('  API_BASE_URL:', API_BASE_URL);
    console.log('  Full URL:', url);
    console.log('  Text:', text.substring(0, 50) + '...');
    console.log('  Text length:', text.length);
    console.log('  Example ID:', exampleId);
    console.log('  Language:', language);
    
    const requestBody = {
      text,
      exampleId,
      language
    };
    
    console.log('📤 Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      console.error('❌ Response error data:', errorData);
      throw new Error(errorData.error || 'Failed to observe example');
    }

    const data = await response.json();
    console.log('✅ Success response data keys:', Object.keys(data));
    console.log('✅ Patterns found:', data.patterns?.length || 0);
    return data;
  } catch (error) {
    console.error('💥 Anonymous example observation failed:', error);
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}; 