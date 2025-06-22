import React from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { LyricalThemesData } from '../types';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface LyricalThemesPanelProps {
  data: LyricalThemesData;
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
        <Typography variant="body2" color="white">
          {payload[0].name}: {payload[0].value}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {payload.map((entry: any, index: number) => (
        <Box
          key={`item-${index}`}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export const LyricalThemesPanel: React.FC<LyricalThemesPanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Lyrical Themes" 
      icon={<FavoriteBorderIcon sx={{ color: 'secondary.main' }} />}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.themes}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.themes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ flex: 1 }}>
          <CustomLegend payload={data.themes.map(theme => ({
            value: theme.name,
            color: theme.color
          }))} />
        </Box>
      </Box>
      
      {/* Theme percentages */}
      <Box sx={{ mt: 3 }}>
        {data.themes.map((theme, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {theme.name}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {theme.value}%
              </Typography>
            </Box>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${theme.value}%`,
                  backgroundColor: theme.color,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </DashboardCard>
  );
}; 