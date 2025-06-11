import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { noctuaColors } from '../theme/noctuaTheme';

interface RhymeOwlProps {
  message?: string;
  isAnalyzing?: boolean;
}

export const RhymeOwl: React.FC<RhymeOwlProps> = ({ message, isAnalyzing }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        component="img"
        src="/orion_the_owl_mascot.svg"
        alt="Orion the Owl"
        sx={{
          width: 60,
          height: 60,
          animation: isAnalyzing ? 'thinking 2s ease-in-out infinite' : undefined,
          '@keyframes thinking': {
            '0%': { transform: 'rotate(0deg)' },
            '25%': { transform: 'rotate(-10deg)' },
            '75%': { transform: 'rotate(10deg)' },
            '100%': { transform: 'rotate(0deg)' },
          },
        }}
      />
      {message && (
        <Typography
          variant="body1"
          sx={{
            color: noctuaColors.moonbeam,
            fontStyle: 'italic',
            maxWidth: 300,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}; 