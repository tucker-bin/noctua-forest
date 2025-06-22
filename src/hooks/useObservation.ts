import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { log } from '../utils/logger';

interface ObservationResult {
  id: string;
  text: string;
  language: string;
  userId: string;
  patterns: any[];
  constellations?: any[];
  createdAt: Date;
  modelUsed: string;
  cost: number;
  tokensUsed: number;
  originalText?: string;
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
}

interface ObserveOptions {
  modelId?: string;
  complexity?: 'simple' | 'standard' | 'complex';
  maxCost?: number;
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
  culturalContext?: boolean;
}

export const useObservation = (initialText: string = '') => {
  const { currentUser } = useAuth();
  const [text, setText] = useState(initialText);
  const [observation, setObservation] = useState<ObservationResult | null>(null);
  const [isObserving, setIsObserving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [textCleaningInfo, setTextCleaningInfo] = useState<{
    wasCleaned: boolean;
    originalLength: number;
    cleanedLength: number;
  } | null>(null);

  const observeText = useCallback(async (
    textToObserve: string, 
    language: string = 'en', 
    options?: ObserveOptions
  ): Promise<ObservationResult | null> => {
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const startTime = performance.now();
    
    try {
      setIsObserving(true);
      setProgress(0);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 95));
      }, 500);

      const token = await currentUser.getIdToken();
      
      log.userAction('Text observation started', { 
        textLength: textToObserve.length, 
        language, 
        options 
      });
      
      const response = await fetch('/api/observe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textToObserve,
          language,
          ...options
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze text');
      }

      const result = await response.json();
      
      const duration = performance.now() - startTime;
      log.performance('Text observation completed', duration, {
        textLength: textToObserve.length,
        patternCount: result.patterns?.length || 0,
        language
      });
      
      // Handle text cleaning information
      if (result.textWasCleaned) {
        setTextCleaningInfo({
          wasCleaned: true,
          originalLength: result.originalTextLength || textToObserve.length,
          cleanedLength: result.cleanedTextLength || textToObserve.length
        });
      }
      
      // Transform result to match expected format
      const transformedResult: ObservationResult = {
        id: result.id || Date.now().toString(),
        text: textToObserve,
        language,
        userId: currentUser.uid,
        patterns: result.patterns || [],
        constellations: result.constellations || [],
        createdAt: new Date(),
        modelUsed: result.modelUsed || 'claude-3-5-sonnet-20241022',
        cost: result.cost || 0,
        tokensUsed: result.tokensUsed || 0,
        originalText: textToObserve,
        textWasCleaned: result.textWasCleaned,
        originalTextLength: result.originalTextLength,
        cleanedTextLength: result.cleanedTextLength
      };
      
      setObservation(transformedResult);
      return transformedResult;
    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('Text observation failed', { 
        textLength: text.length, 
        language, 
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
      
      setError(error instanceof Error ? error.message : 'Failed to analyze text');
      throw error;
    } finally {
      setIsObserving(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [currentUser]);

  const handleObserve = useCallback(async () => {
    if (!text || !text.trim()) {
      setError('Please enter some text to observe');
      return;
    }

    try {
      await observeText(text);
    } catch (error) {
      // Error is already set in observeText
      log.error('Failed to observe text', { 
        textLength: text.length,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
    }
  }, [text, observeText]);

  const clearObservation = useCallback(() => {
    setObservation(null);
    setProgress(0);
    setError(null);
    setTextCleaningInfo(null);
  }, []);

  return {
    // Text state management
    text,
    setText,
    
    // Observation state
    observation,
    isObserving,
    error,
    canReport: !!error,
    textCleaningInfo,
    
    // Actions
    handleObserve,
    observeText,
    clearObservation,
    setTextCleaningInfo,
    
    // Progress
    observationProgress: progress
  };
}; 