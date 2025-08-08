import React from 'react';
import { Box, Typography, Button, Card, CardContent, Stack, LinearProgress, Chip, Grid } from '@mui/material';
import { OrionOwl } from './mascot/OrionOwl';
import { LearningProgress } from './profile/LearningProgress';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DataManager from './profile/DataManager';
import StarIcon from '@mui/icons-material/Star';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Placeholder data
  const user = { name: 'Your Name', email: 'your@email.com' };
  const streak = 3;
  
  // Mock star data - in real app, this would come from user context/API
  const userStats = {
    totalStars: 27,
    level: 3,
    title: 'Linguist',
    starsToNext: 5,
    progress: 0.6, // 60% to next level
    puzzlesSolved: 12,
    perfectSolutions: 4
  };

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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <StarIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
                    <Typography variant="subtitle2">{userStats.totalStars} Stars</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={userStats.progress * 100} sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption">Level {userStats.level} {userStats.title} • {userStats.starsToNext} to next</Typography>
                </Box>
                <Chip label={`🔥 ${streak}-day streak`} color="warning" size="small" sx={{ mb: 2 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Minimal Game Stats */}
          <Card sx={{ p: 2 }}>
            <Grid container spacing={2} sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{userStats.puzzlesSolved}</Typography>
                <Typography variant="caption" color="text.secondary">Solved</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{userStats.perfectSolutions}</Typography>
                <Typography variant="caption" color="text.secondary">Perfect</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{userStats.totalStars}</Typography>
                <Typography variant="caption" color="text.secondary">Stars</Typography>
              </Grid>
            </Grid>
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