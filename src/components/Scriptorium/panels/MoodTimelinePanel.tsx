import React from 'react';
import { Box } from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { MoodTimelineData } from '../types';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface MoodTimelinePanelProps {
  data: MoodTimelineData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
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
        <Box sx={{ color: 'white', fontSize: 14, mb: 0.5 }}>
          {label}
        </Box>
        <Box sx={{ color: '#4ECDC4', fontSize: 14 }}>
          Energy: {payload[0].value}%
        </Box>
      </Box>
    );
  }
  return null;
};

export const MoodTimelinePanel: React.FC<MoodTimelinePanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Mood Timeline" 
      icon={<ShowChartIcon sx={{ color: 'secondary.main' }} />}
    >
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.points}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            <XAxis 
              dataKey="section" 
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis 
              tick={{ fill: '#b0bec5', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px',
                color: '#b0bec5'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="energyLevel" 
              stroke="#4ECDC4" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorEnergy)" 
              name="Energy Level"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Song sections summary */}
      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {data.points.map((point, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: 
                point.energyLevel > 80 
                  ? 'rgba(255, 107, 157, 0.1)' 
                  : point.energyLevel > 60 
                  ? 'rgba(78, 205, 196, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid',
              borderColor: 
                point.energyLevel > 80 
                  ? 'rgba(255, 107, 157, 0.3)' 
                  : point.energyLevel > 60 
                  ? 'rgba(78, 205, 196, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
              {point.section}
            </Box>
            <Box sx={{ fontSize: 12, fontWeight: 600 }}>
              {point.energyLevel}%
            </Box>
          </Box>
        ))}
      </Box>
    </DashboardCard>
  );
}; 