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
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Extension as FlowFinderIcon,
  Quiz as QuizIcon,
  MusicNote as MusicGameIcon,
  Psychology as BrainIcon,
  Timeline as ProgressIcon,
  Lock as LockIcon,
  PlayArrow as PlayIcon,
  Home as HomeIcon,
  Construction as ComingSoonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface GameCard {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactElement;
  buttonTextKey: string;
  href: string;
  color: string;
  hoverColor: string;
  shadowColor: string;
  available: boolean;
  comingSoon?: boolean;
  premiumOnly?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedTime?: string;
}

const GameGrove: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { isPremium, level } = useExperience();

  const gameCards: GameCard[] = [
    {
      id: 'flow-finder',
      titleKey: 'gameGrove.flowFinder.title',
      descriptionKey: 'gameGrove.flowFinder.description',
      icon: <FlowFinderIcon sx={{ fontSize: 48 }} />,
      buttonTextKey: 'gameGrove.flowFinder.button',
      href: '/flow-finder-hub',
      color: theme.palette.forest.accent,
      hoverColor: theme.palette.forest.accent,
      shadowColor: alpha(theme.palette.forest.accent, 0.2),
      available: true,
      difficulty: 'Medium',
      estimatedTime: '3-5 min'
    },
    {
      id: 'rhyme-quiz',
      titleKey: 'gameGrove.rhymeQuiz.title',
      descriptionKey: 'gameGrove.rhymeQuiz.description',
      icon: <QuizIcon sx={{ fontSize: 48 }} />,
      buttonTextKey: 'gameGrove.rhymeQuiz.button',
      href: '#',
      color: theme.palette.forest.primary,
      hoverColor: theme.palette.forest.primary,
      shadowColor: alpha(theme.palette.forest.primary, 0.2),
      available: false,
      comingSoon: true,
      difficulty: 'Easy',
      estimatedTime: '2-3 min'
    },
    {
      id: 'melody-matcher',
      titleKey: 'gameGrove.melodyMatcher.title',
      descriptionKey: 'gameGrove.melodyMatcher.description',
      icon: <MusicGameIcon sx={{ fontSize: 48 }} />,
      buttonTextKey: 'gameGrove.melodyMatcher.button',
      href: '#',
      color: theme.palette.forest.blue,
      hoverColor: theme.palette.forest.blue,
      shadowColor: alpha(theme.palette.forest.blue, 0.2),
      available: false,
      comingSoon: true,
      premiumOnly: true,
      difficulty: 'Hard',
      estimatedTime: '5-8 min'
    },
    {
      id: 'pattern-brain',
      titleKey: 'gameGrove.patternBrain.title',
      descriptionKey: 'gameGrove.patternBrain.description',
      icon: <BrainIcon sx={{ fontSize: 48 }} />,
      buttonTextKey: 'gameGrove.patternBrain.button',
      href: '#',
      color: theme.palette.forest.secondary,
      hoverColor: theme.palette.forest.secondary,
      shadowColor: alpha(theme.palette.forest.secondary, 0.2),
      available: false,
      comingSoon: true,
      premiumOnly: true,
      difficulty: 'Hard',
      estimatedTime: '10-15 min'
    }
  ];

  const handleGameClick = (game: GameCard) => {
    if (!game.available) {
      if (game.premiumOnly && !isPremium) {
        navigate('/accounts'); // Navigate to premium upgrade
        return;
      }
      return;
    }

    navigate(game.href);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return theme.palette.success.main;
      case 'Medium': return theme.palette.warning.main;
      case 'Hard': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.forest.background,
        pt: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%'
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px'
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Box textAlign="center" mb={6} maxWidth="800px">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <IconButton 
                onClick={() => navigate('/')}
                sx={{ 
                  mr: 2,
                  color: theme.palette.forest.primary,
                  '&:hover': { bgcolor: alpha(theme.palette.forest.primary, 0.1) }
                }}
              >
                <HomeIcon />
              </IconButton>
              <Typography 
                variant="h1" 
                color="text.primary"
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3rem', lg: '3.5rem' },
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.forest.accent}, ${theme.palette.forest.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                🎮 {t('gameGrove.title', 'Game Grove')}
              </Typography>
            </Box>
            <Typography 
              variant="h5" 
              color="text.secondary"
              sx={{ 
                maxWidth: '600px', 
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1.125rem', md: '1.25rem', lg: '1.5rem' }
              }}
            >
              {t('gameGrove.subtitle', 'Master patterns through play - games that make learning fun')}
            </Typography>
          </Box>
        </motion.div>

        {/* Games Grid */}
        <Box 
          sx={{ 
            width: '100%',
            maxWidth: '1000px',
            display: 'flex',
            justifyContent: 'center',
            mb: 6
          }}
        >
          <Grid container spacing={4} justifyContent="center">
            {gameCards.map((game, index) => (
              <Grid item xs={12} sm={6} md={6} key={game.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  whileHover={game.available ? { y: -8 } : {}}
                >
                  <Card
                    onClick={() => handleGameClick(game)}
                    sx={{
                      height: '100%',
                      minHeight: 280,
                      cursor: game.available ? 'pointer' : 'default',
                      background: game.available 
                        ? `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`
                        : alpha(theme.palette.forest.card, 0.3),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.forest.border, game.available ? 0.3 : 0.1)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: game.available ? 1 : 0.6,
                      '&:hover': game.available ? {
                        borderColor: alpha(game.hoverColor, 0.5),
                        boxShadow: `0 12px 40px ${game.shadowColor}`,
                        transform: 'translateY(-8px)',
                      } : {},
                    }}
                  >
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                      {/* Icon with status badges */}
                      <Box position="relative" display="inline-block" alignSelf="center" mb={3}>
                        <Box sx={{ color: game.available ? game.color : 'rgba(255,255,255,0.4)' }}>
                          {game.icon}
                        </Box>
                        {game.comingSoon && (
                          <Chip
                            size="small"
                            label="Coming Soon"
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -16,
                              bgcolor: theme.palette.info.main,
                              color: 'white',
                              fontSize: '0.75rem',
                              height: 20
                            }}
                          />
                        )}
                        {game.premiumOnly && !isPremium && (
                          <LockIcon 
                            sx={{ 
                              position: 'absolute',
                              bottom: -8,
                              right: -8,
                              color: theme.palette.warning.main,
                              fontSize: 20
                            }} 
                          />
                        )}
                      </Box>

                      {/* Content */}
                      <Box flexGrow={1}>
                        <Typography 
                          variant="h5" 
                          color="text.primary"
                          gutterBottom
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          {t(game.titleKey)}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ lineHeight: 1.6, mb: 3 }}
                        >
                          {t(game.descriptionKey)}
                        </Typography>

                        {/* Game Info */}
                        <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
                          {game.difficulty && (
                            <Chip 
                              label={game.difficulty}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(getDifficultyColor(game.difficulty), 0.2),
                                color: getDifficultyColor(game.difficulty),
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                          {game.estimatedTime && (
                            <Chip 
                              label={game.estimatedTime}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.2),
                                color: theme.palette.info.main,
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Stack>

                        {/* Premium indicator */}
                        {game.premiumOnly && !isPremium && (
                          <Chip 
                            label={t('gameGrove.premiumOnly', 'Premium Only')} 
                            size="small" 
                            sx={{ 
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: theme.palette.warning.main,
                              fontSize: '0.75rem',
                              mb: 2
                            }} 
                          />
                        )}
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant={game.available ? "contained" : "outlined"}
                        fullWidth
                        disabled={!game.available}
                        startIcon={game.available ? <PlayIcon /> : <ComingSoonIcon />}
                        sx={{
                          py: 1.5,
                          bgcolor: game.available ? game.color : 'transparent',
                          color: game.available ? 'white' : 'rgba(255,255,255,0.3)',
                          borderColor: game.available ? game.color : 'rgba(255,255,255,0.1)',
                          fontWeight: 600,
                          fontSize: '1rem',
                          '&:hover': game.available ? {
                            bgcolor: game.hoverColor,
                            borderColor: game.hoverColor,
                          } : {},
                          '&:disabled': {
                            color: 'rgba(255,255,255,0.3)',
                            borderColor: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        {game.available 
                          ? t(game.buttonTextKey)
                          : (game.premiumOnly && !isPremium
                            ? t('gameGrove.upgradeToPremium', 'Upgrade to Premium')
                            : t('gameGrove.comingSoon', 'Coming Soon')
                          )
                        }
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Box textAlign="center" maxWidth="600px">
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('gameGrove.moreGames', 'More games are being crafted in the forest. Check back soon for new adventures!')}
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default GameGrove; 