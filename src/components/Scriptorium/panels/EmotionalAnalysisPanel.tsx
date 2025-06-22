import React from 'react';
import { Box } from '@mui/material';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { EmotionalAnalysisData } from '../types';
import PsychologyIcon from '@mui/icons-material/Psychology';

interface EmotionalAnalysisPanelProps {
  data: EmotionalAnalysisData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 1,
          p: 1,
        }}
      >
        <Box sx={{ color: 'white', fontSize: 14 }}>
          {payload[0].payload.subject}: {payload[0].value}
        </Box>
      </Box>
    );
  }
  return null;
};

export const EmotionalAnalysisPanel: React.FC<EmotionalAnalysisPanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Emotional Analysis" 
      icon={<PsychologyIcon sx={{ color: 'secondary.main' }} />}
    >
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.emotions}>
            <PolarGrid 
              stroke="rgba(255, 255, 255, 0.1)"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="subject"
              tick={{ fill: '#b0bec5', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#b0bec5', fontSize: 10 }}
            />
            <Radar 
              name="Emotional Valence" 
              dataKey="value" 
              stroke="#FF6B9D"
              fill="#FF6B9D"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Emotion values list */}
      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {data.emotions.map((emotion, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            <Box sx={{ color: 'text.secondary', fontSize: 14 }}>
              {emotion.subject}
            </Box>
            <Box sx={{ fontWeight: 600, fontSize: 14 }}>
              {emotion.value}%
            </Box>
          </Box>
        ))}
      </Box>
    </DashboardCard>
  );
}; 