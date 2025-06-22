import React from 'react';
import { Box, Stack, Typography, LinearProgress } from '@mui/material';
import { DashboardCard } from '../DashboardCard';
import { StructuralAnalysisData } from '../types';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import BoltIcon from '@mui/icons-material/Bolt';

interface StructuralAnalysisPanelProps {
  data: StructuralAnalysisData;
}

export const StructuralAnalysisPanel: React.FC<StructuralAnalysisPanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Structural Analysis" 
      icon={<TuneIcon sx={{ color: 'secondary.main' }} />}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SpeedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tempo (BPM)
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.tempo}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AvTimerIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Time Signature
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.timeSignature}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MusicNoteIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Key
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.key}
            </Typography>
          </Box>
        </Box>

        {data.energy !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BoltIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Energy Level
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {data.energy}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={data.energy} 
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(45deg, #FF6B9D, #4ECDC4)',
                }
              }}
            />
          </Box>
        )}
      </Stack>
    </DashboardCard>
  );
}; 