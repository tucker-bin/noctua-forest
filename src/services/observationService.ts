import { ObservationData } from '../types/observatory';
import { auth } from '../config/firebase';

interface AnalysisOptions {
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  culturalContext?: boolean;
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
}

export async function observeText(
  text: string, 
  language: string = 'en', 
  options?: AnalysisOptions
): Promise<ObservationData> {
  // Get the current user's token
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('http://localhost:3001/api/observe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      text, 
      language,
      options: {
        focusMode: 'comprehensive',
        sensitivity: 'strong', // Default to strong for rap lyrics
        culturalContext: true,
        phoneticDepth: 'detailed',
        ...options
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.code === 'EXTERNAL_SERVICE_ERROR' && errorData.canReport) {
      const error = new Error(errorData.error);
      (error as any).canReport = true;
      (error as any).code = errorData.code;
      throw error;
    }
    throw new Error(errorData.error || 'Failed to make observation');
  }

  return response.json();
} 