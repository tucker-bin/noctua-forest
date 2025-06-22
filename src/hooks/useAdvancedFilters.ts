import { useState, useCallback } from 'react';

export type SortByType = 'frequency' | 'length' | 'position' | 'type';

export const useAdvancedFilters = () => {
  const [patternFilters, setPatternFilters] = useState<Set<string>>(new Set());
  const [minPatternSize, setMinPatternSize] = useState(2);
  const [showCrossPatterns, setShowCrossPatterns] = useState(true);
  const [showMicroPatterns, setShowMicroPatterns] = useState(true);
  const [sortBy, setSortBy] = useState<SortByType>('frequency');

  const togglePatternFilter = useCallback((patternType: string) => {
    setPatternFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patternType)) {
        newSet.delete(patternType);
      } else {
        newSet.add(patternType);
      }
      return newSet;
    });
  }, []);

  const setAllPatternFilters = useCallback((newFilters: Set<string>) => {
    setPatternFilters(newFilters);
  }, []);

  return {
    patternFilters,
    togglePatternFilter,
    setAllPatternFilters,
    minPatternSize,
    setMinPatternSize,
    showCrossPatterns,
    setShowCrossPatterns,
    showMicroPatterns,
    setShowMicroPatterns,
    sortBy,
    setSortBy,
  };
}; 