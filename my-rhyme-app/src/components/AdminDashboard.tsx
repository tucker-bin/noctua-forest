import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';

const stats = [
  { label: 'Total Users', value: 124, color: 'primary' },
  { label: 'Feedback', value: 18, color: 'secondary' },
  { label: 'System Health', value: 'Healthy', color: 'success' },
];

const AdminDashboard: React.FC = () => (
  <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
    <Typography variant="h5" sx={{ mb: 2 }}>Admin Dashboard</Typography>
    <Grid container spacing={2}>
      {stats.map(stat => (
        <Grid item xs={12} sm={4} key={stat.label}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>{stat.value}</Typography>
              <Chip label={stat.label} color={stat.color as any} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default AdminDashboard; 