import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ObservatoryState } from '../types';
import { ObservationResult, Pattern } from '../../../types/observatory';
import PatternControls from '../PatternControls';
import { PatternList } from '../PatternList';
import { filterPatterns, sortPatterns } from '../types';
import { PatternType } from '../../../types/observatory';

interface PatternsPanelProps {
  observation: ObservationResult | null;
  state: ObservatoryState;
  onStateChange: (update: Partial<ObservatoryState>) => void;
  onPatternClick: (pattern: Pattern) => void;
  onPatternExpand: (patternId: string) => void;
}

export const PatternsPanel: React.FC<PatternsPanelProps> = ({
  observation,
  state,
  onStateChange,
  onPatternClick,
  onPatternExpand
}) => {
  const { t } = useTranslation();

  // Get available pattern types
  const availableTypes = useMemo(() => {
    if (!observation) return [];
    return Array.from(new Set(observation.patterns.map(p => p.type)));
  }, [observation]);

  // Process patterns with filtering and sorting
  const processedPatterns = useMemo(() => {
    if (!observation) return [];

    const filtered = filterPatterns(observation.patterns, {
      selectedTypes: state.selectedPatternTypes,
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      observation
    });

    return sortPatterns(filtered, {
      sortBy: state.sortBy,
      observation,
      isCreativeMode: state.isCreativeMode
    });
  }, [observation, state]);

  if (!observation) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PatternControls
        selectedTypes={state.selectedPatternTypes}
        onTypeToggle={(type: PatternType) => {
          const newTypes = [...state.selectedPatternTypes];
          const index = newTypes.indexOf(type);
          if (index >= 0) {
            newTypes.splice(index, 1);
          } else {
            newTypes.push(type);
          }
          onStateChange({ selectedPatternTypes: newTypes });
        }}
        searchQuery={state.searchQuery}
        onSearchChange={(query: string) => onStateChange({ searchQuery: query })}
        viewMode={state.viewMode}
        onViewModeChange={(mode: 'grid' | 'list') => onStateChange({ viewMode: mode })}
        sortBy={state.sortBy}
        onSortChange={(sort: 'frequency' | 'position' | 'complexity') => onStateChange({ sortBy: sort })}
        isCreativeMode={state.isCreativeMode}
        availableTypes={availableTypes}
      />

      <PatternList
        patterns={processedPatterns}
        segments={observation?.segments || []}
        isCreativeMode={state.isCreativeMode}
        viewMode={state.viewMode}
        expandedPattern={state.expandedPattern}
        onPatternClick={onPatternClick}
        onPatternExpand={onPatternExpand}
      />
    </Box>
  );
}; 