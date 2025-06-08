import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';

interface RhymeGroup {
  group_id: string;
  original_rhyming_words: string[];
  pattern_description: string;
}

interface AnalysisLegendProps {
  rhymeGroups: RhymeGroup[];
}

// Simple color palette for groups
const COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#e57373', '#f06292', '#ba68c8', '#64b5f6', '#4db6ac',
  '#81c784', '#dce775', '#ffd54f', '#ffb74d', '#a1887f',
];

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({ rhymeGroups }) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" gutterBottom>Analysis Legend & Reasoning:</Typography>
    <Stack spacing={2}>
      {rhymeGroups.map((group, idx) => (
        <Box key={group.group_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label=" " sx={{ bgcolor: COLORS[idx % COLORS.length], minWidth: 32, height: 32 }} />
          <Box>
            <Typography fontWeight="bold">
              {group.original_rhyming_words.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group.pattern_description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
);

export default AnalysisLegend; 