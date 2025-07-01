import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useExperience } from '../../contexts/ExperienceContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  IconButton
} from '@mui/material';
import {
  Games as GamesIcon,
  PlayArrow as PlayIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  TrendingUp as RankingIcon,
  Extension as PuzzleIcon,
  Timer as ChallengeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface GameFeature {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactElement;
  buttonTextKey: string;
  href: string;
  color: string;
  hoverColor: string;
  available: boolean;
  highlight?: boolean;
}

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { 
    level, 
    xp, 
    tokens, 
    streak, 
    achievements, 
    isPremium
  } = useExperience();

  const isRTL = i18n.dir() === 'rtl';
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  const gameFeatures: GameFeature[] = [
    {
      id: 'daily-challenge',
      titleKey: 'Daily Challenge',
      descriptionKey: 'Fresh rhyme puzzles every day with streak rewards',
      icon: <ChallengeIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'Play Today\'s Puzzle',
      href: '/games',
      color: theme.palette.primary.main,
      hoverColor: theme.palette.primary.dark,
      available: true,
      highlight: true
    },
    {
      id: 'endless-mode',
      titleKey: 'Endless Puzzles',
      descriptionKey: 'Unlimited rhyme challenges that adapt to your skill',
      icon: <PuzzleIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'Play Unlimited',
      href: '/games',
      color: theme.palette.secondary.main,
      hoverColor: theme.palette.secondary.dark,
      available: isPremium
    },
    {
      id: 'leaderboards',
      titleKey: 'Compete & Climb',
      descriptionKey: 'Challenge friends and climb the global rankings',
      icon: <RankingIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'View Rankings',
      href: '/profile',
      color: theme.palette.success.main,
      hoverColor: theme.palette.success.dark,
      available: true
    },
    {
      id: 'premium-features',
      titleKey: 'Premium Games',
      descriptionKey: 'Exclusive puzzle packs and advanced features',
      icon: <StarIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'Go Premium',
      href: '/subscribe',
      color: theme.palette.warning.main,
      hoverColor: theme.palette.warning.dark,
      available: true
    }
  ];

  const handleFeatureClick = (feature: GameFeature) => {
    if (!feature.available && !isPremium) {
      navigate('/subscribe');
      return;
    }
    navigate(feature.href);
  };

  const handlePlayDemo = () => {
    // Store demo flag and go directly to game
    localStorage.setItem('demoMode', 'true');
    navigate('/games');
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}20, ${theme.palette.secondary.dark}20)`,
        pt: { xs: 4, sm: 6 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              🎮 RhymeTime Games
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                fontWeight: 500,
                mb: 4,
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.4
              }}
            >
              AI-powered word puzzles that make you a better writer while you play
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayIcon />}
                onClick={handlePlayDemo}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3
                }}
              >
                Play Free Demo
              </Button>
              
              {!currentUser && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3
                  }}
                >
                  Sign Up Free
                </Button>
              )}
            </Stack>
          </Box>
        </motion.div>

        {/* Player Stats (for authenticated users) */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card 
              sx={{ 
                mb: 6, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={currentUser.photoURL || undefined}
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 1,
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {currentUser.displayName?.[0] || 'P'}
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Level {level}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress to Level {level + 1}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(xp % 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={600} color="primary">
                          {streak}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Day Streak
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={600} color="secondary">
                          {tokens}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tokens
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Game Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              fontWeight: 700,
              mb: 4,
              textAlign: 'center'
            }}
          >
            Choose Your Challenge
          </Typography>

          <Grid container spacing={3} sx={{ mb: 6 }}>
            {gameFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={feature.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      background: feature.highlight 
                        ? `linear-gradient(135deg, ${alpha(feature.color, 0.1)}, ${alpha(feature.hoverColor, 0.05)})`
                        : 'background.paper',
                      border: feature.highlight 
                        ? `2px solid ${feature.color}` 
                        : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 8px 32px ${alpha(feature.color, 0.2)}`,
                        transform: 'translateY(-4px)',
                        borderColor: feature.color
                      },
                      opacity: feature.available || isPremium ? 1 : 0.7
                    }}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ color: feature.color, mb: 2 }}>
                        {feature.icon}
                      </Box>
                      
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {feature.titleKey}
                        {!feature.available && !isPremium && (
                          <Chip
                            label="Premium"
                            size="small"
                            color="warning"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 3, flexGrow: 1 }}
                      >
                        {feature.descriptionKey}
                      </Typography>

                      <Button
                        variant={feature.highlight ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600
                        }}
                      >
                        {feature.buttonTextKey}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Game Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card sx={{ 
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                🧩 How RhymeTime Works
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
                Match rhyming words in challenging card grids. Find patterns, build streaks, 
                and climb the leaderboards while improving your vocabulary and writing skills.
              </Typography>

              <Grid container spacing={3} sx={{ maxWidth: '800px', mx: 'auto' }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <GamesIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Flip & Match
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tap cards to reveal words and find rhyming groups
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SpeedIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Beat the Clock
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Race against time to complete challenging puzzles
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrophyIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Earn & Compete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Build streaks, earn rewards, and climb the rankings
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Ready to Play?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of players improving their writing skills through addictive word puzzles
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={handlePlayDemo}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }}
            >
              Start Playing Now
            </Button>
          </Box>
        </motion.div>

      </Container>
    </Box>
  );
};

export default LandingPage; 