import React from 'react';
import { Box, Typography, Button, Card, CardContent, Stack, LinearProgress, Chip, Grid } from '@mui/material';
import { OrionOwl } from './mascot/OrionOwl';
import { LearningProgress } from './profile/LearningProgress';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DataManager from './profile/DataManager';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Placeholder data
  const user = { name: 'Your Name', email: 'your@email.com' };
  const xp = 120;
  const streak = 3;

  const handleStartLesson = () => {
    navigate('/lessons/celestial_observer/first_light');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Profile Overview */}
        <Box>
          <Card sx={{ textAlign: 'center', position: 'relative', overflow: 'visible', mb: 3 }}>
            <CardContent>
              <Box sx={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }}>
                <OrionOwl 
                  size={60}
                  mood="celebrating"
                  showBubble={true}
                  bubbleText={t('profile.welcome_back', { name: user.name })}
                  glowIntensity="medium"
                />
              </Box>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" sx={{ mt: 2 }}>{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2">XP</Typography>
                  <LinearProgress variant="determinate" value={xp % 100} sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption">Level {Math.floor(xp / 100) + 1} • {xp} XP</Typography>
                </Box>
                <Chip label={`🔥 ${streak}-day streak`} color="warning" size="small" sx={{ mb: 2 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Learning Progress */}
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {t('profile.your_journey')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('profile.journey_description')}
            </Typography>
          </Box>
          <LearningProgress />
          
          {/* Next Lesson Recommendation */}
          <Card sx={{ mt: 3, position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('profile.continue_learning')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t('profile.next_lesson_description')}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleStartLesson}
                  >
                    {t('profile.start_next_lesson')}
                  </Button>
                </Box>
                <Box sx={{ position: 'absolute', right: 20, bottom: 20 }}>
                  <OrionOwl 
                    size={40}
                    mood="excited"
                    showBubble={true}
                    bubbleText={t('profile.lesson_encouragement')}
                    interactive={true}
                    glowIntensity="subtle"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Data Management Section */}
          <DataManager />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage; 