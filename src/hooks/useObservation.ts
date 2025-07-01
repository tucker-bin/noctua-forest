import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { log } from '../utils/logger';
import { observationService } from '../services/observationService';
import { ObservationResult } from '../types/observatory';

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
  const [error, setError] = useState<Error | null>(null);
  const [observationProgress, setObservationProgress] = useState(0);
  const [textCleaningInfo, setTextCleaningInfo] = useState<{
    wasCleaned: boolean;
    originalLength: number;
    cleanedLength: number;
  } | null>(null);

  const clearObservation = useCallback(() => {
    setObservation(null);
    setError(null);
    setObservationProgress(0);
    setTextCleaningInfo(null);
  }, []);

  const observeText = useCallback(async (text: string, language: string = 'en') => {
    try {
      setIsObserving(true);
      setError(null);
      setObservationProgress(0);

      const result = await observationService.observeText(text, { language });
      
      if (!result) {
        throw new Error('Failed to analyze text');
      }

      // Convert to ObservationResult
      const observationResult: ObservationResult = {
        text: result.text,
        patterns: result.patterns,
        segments: result.segments,
        language: result.language,
        metadata: result.metadata,
        id: result.id || `obs_${Date.now()}`,
        createdAt: new Date(result.metadata.createdAt),
        textWasCleaned: result.textWasCleaned,
        originalTextLength: result.originalTextLength,
        cleanedTextLength: result.cleanedTextLength
      };

      setObservation(observationResult);
      setObservationProgress(100);

      if (result.textWasCleaned) {
        setTextCleaningInfo({
          wasCleaned: true,
          originalLength: result.originalTextLength || text.length,
          cleanedLength: result.cleanedTextLength || result.text.length
        });
      }

      return observationResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to observe text'));
      return null;
    } finally {
      setIsObserving(false);
    }
  }, []);

  const handleObserve = useCallback(async () => {
    if (!text || !text.trim()) {
      setError(new Error('Please enter some text to observe'));
      return;
    }
    return observeText(text);
  }, [text, observeText]);

  return {
    text,
    setText,
    observation,
    isObserving,
    error,
    canReport: !!error,
    observeText,
    clearObservation,
    observationProgress,
    textCleaningInfo,
    setTextCleaningInfo,
    handleObserve
  };
}; 