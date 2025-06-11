import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => (
  <Grid item xs={12} sm={4}>
    <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
      <CardContent>
        <Typography variant="h4" component="p" sx={{ color: 'secondary.main' }}>
          {value}
        </Typography>
        <Typography variant="h6" component="p" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

interface AnalysisStatsProps {
  wordCount: number;
  uniqueWordCount: number;
  rhymeDensity: number;
}

const AnalysisStats: React.FC<AnalysisStatsProps> = ({
  wordCount,
  uniqueWordCount,
  rhymeDensity,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <StatCard
          title="Total Words"
          value={wordCount}
          description="The total number of words in the text."
        />
        <StatCard
          title="Unique Words"
          value={uniqueWordCount}
          description="The number of distinct words, indicating vocabulary richness."
        />
        <StatCard
          title="Rhyme Density"
          value={`${(rhymeDensity * 100).toFixed(1)}%`}
          description="The percentage of words that participate in a rhyme."
        />
      </Grid>
    </Box>
  );
};

export default AnalysisStats; 