import React from 'react';
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

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({ patterns }) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" gutterBottom>Analysis Legend & Reasoning:</Typography>
    <Stack spacing={2}>
      {patterns.map((pattern) => (
        <Box key={pattern.phonetic_link_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label=" " sx={{ bgcolor: getColorForGroup(pattern.phonetic_link_id), minWidth: 32, height: 32 }} />
          <Box>
            <Typography fontWeight="bold">
              {/* Show a sample of matched words */}
              {pattern.segments.slice(0, 3).map(s => s.text).join(', ')}
              {pattern.segments.length > 3 ? ', ...' : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pattern.pattern_description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
);

export default AnalysisLegend; 