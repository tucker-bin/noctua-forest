import React, { useMemo } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { getColorForGroup } from './HighlightLyrics';

interface AnalysisLegendProps {
  patterns: Array<{
    phonetic_link_id: string;
    pattern_description: string;
    segments: Array<{
      text: string;
    }>;
  }>;
}

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({ patterns }) => {
  // Memoize filtered patterns
  const validPatterns = useMemo(() => 
    patterns.filter(pattern => 
      typeof pattern.phonetic_link_id === 'string' && 
      Array.isArray(pattern.segments) && 
      pattern.segments.length > 0
    ),
    [patterns]
  );

  // Memoize pattern items
  const patternItems = useMemo(() => 
    validPatterns.map((pattern) => (
      <Box key={pattern.phonetic_link_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip 
          label=" " 
          sx={{ 
            bgcolor: getColorForGroup(pattern.phonetic_link_id), 
            minWidth: 32, 
            height: 32,
            transition: 'background-color 0.2s'
          }} 
        />
        <Box>
          <Typography fontWeight="bold">
            {pattern.segments.slice(0, 3).map(s => s.text).join(', ')}
            {pattern.segments.length > 3 ? ', ...' : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pattern.pattern_description}
          </Typography>
        </Box>
      </Box>
    )),
    [validPatterns]
  );

  if (validPatterns.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Analysis Legend & Reasoning:</Typography>
      <Stack spacing={2}>
        {patternItems}
      </Stack>
    </Box>
  );
};

export default AnalysisLegend; 