import { useState, useCallback } from 'react';
import { getPronunciationGuide, getPhonologyComparison, getSoundCorrespondences } from '../services/pronunciationService';

export const usePronunciation = () => {
  const [pronunciationData, setPronunciationData] = useState<any[]>([]);
  const [phonologyComparison, setPhonologyComparison] = useState<{ similarities: string[]; differences: string[] }>({ similarities: [], differences: [] });
  const [soundCorrespondences, setSoundCorrespondences] = useState<Array<{ source: string; target: string; example: string }>>([]);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePronunciation = useCallback(async (text: string, sourceLanguage: string, targetLanguage: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [guide, comparison, correspondences] = await Promise.all([
        getPronunciationGuide(text, sourceLanguage, targetLanguage),
        getPhonologyComparison(sourceLanguage, targetLanguage),
        getSoundCorrespondences(sourceLanguage, targetLanguage),
      ]);
      setPronunciationData(guide);
      setPhonologyComparison(comparison);
      setSoundCorrespondences(correspondences);
      setShowPronunciation(true);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze pronunciation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    pronunciationData,
    phonologyComparison,
    soundCorrespondences,
    showPronunciation,
    setShowPronunciation,
    isLoading,
    error,
    analyzePronunciation,
  };
}; 