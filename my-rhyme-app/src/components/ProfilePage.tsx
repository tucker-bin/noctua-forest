import React from 'react';
import { OrionOwl } from './OrionOwl';
import { Box, Typography, Button, Card, CardContent, Stack, LinearProgress, Chip } from '@mui/material';

const ProfilePage: React.FC = () => {
  // Placeholder data
  const user = { name: 'Your Name', email: 'your@email.com' };
  const xp = 120;
  const streak = 3;
  const savedAnalyses = [
    { id: 1, title: 'Verse 1', note: 'Worked on internal rhyme.' },
    { id: 2, title: 'Chorus', note: 'Improved assonance.' },
  ];

  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
      <OrionOwl />
      <Typography variant="h5" sx={{ mt: 2 }}>{user.name}</Typography>
      <Typography variant="body2" color="text.secondary">{user.email}</Typography>
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2">XP</Typography>
        <LinearProgress variant="determinate" value={xp % 100} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption">Level {Math.floor(xp / 100) + 1} • {xp} XP</Typography>
      </Box>
      <Chip label={`🔥 ${streak}-day streak`} color="warning" size="small" sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mt: 2 }}>Saved Analyses</Typography>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {savedAnalyses.map(a => (
          <Card key={a.id}>
            <CardContent>
              <Typography variant="subtitle1">{a.title}</Typography>
              <Typography variant="body2" color="text.secondary">{a.note}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Button variant="contained" color="primary" sx={{ mt: 3 }}>Share Your Progress</Button>
    </Box>
  );
};

export default ProfilePage; 