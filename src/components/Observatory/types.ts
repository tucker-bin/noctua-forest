import { Pattern, PatternType, Segment, ObservationResult } from '../../types/observatory';

export interface ObservatoryState {
  isCreativeMode: boolean;
  viewMode: 'grid' | 'list';
  sortBy: 'frequency' | 'position' | 'complexity';
  selectedPatternTypes: PatternType[];
  searchQuery: string;
  expandedPattern: string | null;
  showHighlights: boolean;
  isTextExpanded: boolean;
}

export interface PatternDisplayProps {
  pattern: Pattern;
  segments: Segment[];
  isCreativeMode: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onClick?: () => void;
}

export interface PatternListProps {
  patterns: Pattern[];
  segments: Segment[];
  isCreativeMode: boolean;
  viewMode: 'grid' | 'list';
  expandedPattern: string | null;
  onPatternClick: (pattern: Pattern) => void;
  onPatternExpand: (patternId: string) => void;
}

export interface PatternFilterState {
  selectedTypes: PatternType[];
  searchQuery: string;
  sortBy: 'frequency' | 'position' | 'complexity';
}

export interface PatternSortOptions {
  sortBy: 'frequency' | 'position' | 'complexity';
  observation: ObservationResult;
  isCreativeMode: boolean;
}

export interface PatternFilterOptions extends PatternFilterState {
  observation: ObservationResult;
}

// Helper functions for pattern sorting and filtering
export const sortPatterns = (patterns: Pattern[], options: PatternSortOptions): Pattern[] => {
  const { sortBy, observation, isCreativeMode } = options;
  
  return [...patterns].sort((a, b) => {
    if (sortBy === 'frequency') {
      return b.segments.length - a.segments.length;
    }
    if (sortBy === 'position') {
      const aStart = Math.min(...a.segments.map(segId => {
        const segment = observation.segments.find(s => s.id === segId);
        return segment?.globalStartIndex || 0;
      }));
      const bStart = Math.min(...b.segments.map(segId => {
        const segment = observation.segments.find(s => s.id === segId);
        return segment?.globalStartIndex || 0;
      }));
      return aStart - bStart;
    }
    if (sortBy === 'complexity' && isCreativeMode) {
      const aComplexity = a.phonetic?.segments.length || 0;
      const bComplexity = b.phonetic?.segments.length || 0;
      return bComplexity - aComplexity;
    }
    return 0;
  });
};

export const filterPatterns = (patterns: Pattern[], options: PatternFilterOptions): Pattern[] => {
  const { selectedTypes, searchQuery, observation } = options;
  let filtered = patterns;

  if (selectedTypes.length > 0) {
    filtered = filtered.filter(p => selectedTypes.includes(p.type));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(pattern => {
      const patternSegments = pattern.segments
        .map(segId => observation.segments.find(s => s.id === segId))
        .filter((s): s is Segment => s !== undefined);

      return (
        pattern.type.toLowerCase().includes(query) ||
        patternSegments.some(s => s.text.toLowerCase().includes(query)) ||
        pattern.description?.toLowerCase().includes(query)
      );
    });
  }

  return filtered;
}; 