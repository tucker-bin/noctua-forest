import React from 'react';
import { Box } from '@mui/material';
import { PatternListProps } from './types';
import { PatternCard } from './PatternCard';

export const PatternList: React.FC<PatternListProps> = ({
  patterns,
  segments,
  isCreativeMode,
  viewMode,
  expandedPattern,
  onPatternClick,
  onPatternExpand
}) => {
  return (
    <Box sx={{ 
      display: viewMode === 'grid' ? 'grid' : 'flex',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 2,
      flexDirection: viewMode === 'grid' ? undefined : 'column'
    }}>
      {patterns.map(pattern => (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          segments={segments}
          isCreativeMode={isCreativeMode}
          onPatternClick={() => onPatternClick(pattern)}
          expanded={expandedPattern === pattern.id}
          onExpand={() => onPatternExpand(pattern.id)}
        />
      ))}
    </Box>
  );
}; 