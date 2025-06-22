import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { DashboardCard } from '../DashboardCard';
import { SongMeaningData } from '../types';
import CreateIcon from '@mui/icons-material/Create';
import VerifiedIcon from '@mui/icons-material/Verified';

interface SongMeaningPanelProps {
  data: SongMeaningData;
}

export const SongMeaningPanel: React.FC<SongMeaningPanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Song Meaning" 
      icon={<CreateIcon sx={{ color: 'secondary.main' }} />}
    >
      <Box>
        <Typography 
          variant="body1" 
          sx={{ 
            lineHeight: 1.8,
            color: 'text.primary',
            maxHeight: 300,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              }
            },
          }}
        >
          {data.meaningText}
        </Typography>
        
        {data.confidence && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
              label={`${Math.round(data.confidence * 100)}% Confidence`}
              size="small"
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: '#4caf50',
                borderColor: '#4caf50',
                '& .MuiChip-icon': {
                  color: '#4caf50',
                }
              }}
            />
          </Box>
        )}
        
        {data.interpretations && data.interpretations.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Alternative Interpretations:
            </Typography>
            {data.interpretations.map((interpretation, index) => (
              <Typography
                key={index}
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  pl: 2,
                  borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                  fontStyle: 'italic',
                }}
              >
                {interpretation}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </DashboardCard>
  );
}; 