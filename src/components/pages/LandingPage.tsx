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
  Stack
} from '@mui/material';
import {
  Visibility as ObservatoryIcon,
  Piano as ScriptoriumIcon,
  School as JourneyIcon,
  Layers as ComingSoonIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon,
  Token as TokenIcon,
  Star as StarIcon,
  Extension as FlowFinderIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ForestCard {
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
  tokenCost?: number;
  premiumOnly?: boolean;
}

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { 
    level, 
    xp, 
    xpForNextLevel, 
    tokens, 
    streak, 
    achievements, 
    isPremium,
    useTokens 
  } = useExperience();

  const isRTL = i18n.dir() === 'rtl';
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  const forestCards: ForestCard[] = [
    {
      id: 'journey',
      titleKey: 'landing.cards.journey.title',
      descriptionKey: 'landing.cards.journey.description',
      icon: <JourneyIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'landing.cards.journey.button',
      href: '/lessons',
      color: theme.palette.forest.primary,
      hoverColor: theme.palette.forest.primary,
      shadowColor: alpha(theme.palette.forest.primary, 0.1),
      available: isPremium || level >= 2,
      premiumOnly: !isPremium && level < 2
    },
    {
      id: 'observatory',
      titleKey: 'landing.cards.observatory.title',
      descriptionKey: 'landing.cards.observatory.description',
      icon: <ObservatoryIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'landing.cards.observatory.button',
      href: '/observatory',
      color: theme.palette.forest.secondary,
      hoverColor: theme.palette.forest.blue,
      shadowColor: alpha(theme.palette.forest.blue, 0.1),
      available: true
    },
    {
      id: 'scriptorium',
      titleKey: 'landing.cards.scriptorium.title',
      descriptionKey: 'landing.cards.scriptorium.description',
      icon: <ScriptoriumIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'landing.cards.scriptorium.button',
      href: '/scriptorium',
      color: theme.palette.forest.accent,
      hoverColor: theme.palette.forest.blue,
      shadowColor: alpha(theme.palette.forest.accent, 0.1),
      available: isPremium,
      premiumOnly: true
    },
    {
      id: 'game-grove',
      titleKey: 'landing.cards.gameGrove.title',
      descriptionKey: 'landing.cards.gameGrove.description',
      icon: <FlowFinderIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'landing.cards.gameGrove.button',
      href: '/game-grove',
      color: theme.palette.forest.accent,
      hoverColor: theme.palette.forest.accent,
      shadowColor: alpha(theme.palette.forest.accent, 0.1),
      available: true
    },
    {
      id: 'achievements',
      titleKey: 'landing.cards.achievements.title',
      descriptionKey: 'landing.cards.achievements.description',
      icon: <TrophyIcon sx={{ fontSize: 40 }} />,
      buttonTextKey: 'landing.cards.achievements.button',
      href: '/achievements',
      color: theme.palette.forest.secondary,
      hoverColor: theme.palette.forest.secondary,
      shadowColor: alpha(theme.palette.forest.secondary, 0.1),
      available: true
    },
    {
      id: 'coming-soon',
      titleKey: 'landing.cards.comingSoon.title',
      descriptionKey: 'landing.cards.comingSoon.description',
      icon: <ComingSoonIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.4)' }} />,
      buttonTextKey: 'landing.cards.comingSoon.button',
      href: '#',
      color: 'rgba(255,255,255,0.1)',
      hoverColor: 'rgba(255,255,255,0.1)',
      shadowColor: 'transparent',
      available: false
    }
  ];

  const handleCardClick = (card: ForestCard) => {
    if (!card.available) {
      if (card.premiumOnly) {
        navigate('/accounts'); // Navigate to premium upgrade
        return;
      }
      return;
    }

    navigate(card.href);
  };

  const progressPercent = ((xp % 100) / 100) * 100;

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
          maxWidth: '1200px !important'
        }}
      >
        {/* User Stats Header (for authenticated users) - moved to be less prominent */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <Card 
              sx={{ 
                mb: 4, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.6)}, ${alpha(theme.palette.forest.card, 0.4)})`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.forest.border, 0.2)}`,
                width: '100%',
                maxWidth: '800px'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          bgcolor: theme.palette.forest.primary,
                          color: 'black',
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {currentUser.displayName?.[0] || '🌟'}
                      </Avatar>
                      <Box textAlign="center">
                        <Typography variant="body1" color="text.primary">
                          {currentUser.displayName || t('common.explorer')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('forest.level')} {level}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('forest.experience')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressPercent} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3, 
                          mb: 1,
                          bgcolor: alpha(theme.palette.forest.primary, 0.2),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: theme.palette.forest.primary
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {xp}/{xpForNextLevel} XP
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <TrophyIcon sx={{ color: theme.palette.forest.secondary, fontSize: 20 }} />
                      <Typography variant="body1" color="text.primary">
                        {unlockedAchievements.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('forest.achievements')}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Box textAlign="center" mb={6} maxWidth="800px">
            <Typography 
              variant="h1" 
              color="text.primary"
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3rem', lg: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('landing.title')}
            </Typography>
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
              {t('landing.subtitle')}
            </Typography>
          </Box>
        </motion.div>

        {/* Cards Grid - Centered and responsive */}
        <Box 
          sx={{ 
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            justifyContent: 'center',
            mb: 6
          }}
        >
          <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '900px' }}>
            {forestCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={6} lg={forestCards.length === 4 ? 3 : 4} key={card.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  whileHover={card.available ? { y: -8 } : {}}
                >
                  <Card
                    onClick={() => handleCardClick(card)}
                    sx={{
                      height: '100%',
                      cursor: card.available ? 'pointer' : 'default',
                      background: card.available 
                        ? `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`
                        : alpha(theme.palette.forest.card, 0.3),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.forest.border, card.available ? 0.3 : 0.1)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: card.available ? 1 : 0.6,
                      '&:hover': card.available ? {
                        borderColor: alpha(card.hoverColor, 0.5),
                        boxShadow: `0 8px 32px ${card.shadowColor}`,
                        transform: 'translateY(-4px)',
                      } : {},
                    }}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                      {/* Icon with token cost badge */}
                      <Box position="relative" display="inline-block" alignSelf="center" mb={2}>
                        <Box sx={{ color: card.available ? card.color : 'rgba(255,255,255,0.4)' }}>
                          {card.icon}
                        </Box>
                        {card.tokenCost && card.tokenCost > 0 && card.available && (
                          <Chip
                            size="small"
                            label={`${card.tokenCost}🪙`}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              [isRTL ? 'left' : 'right']: -8,
                              bgcolor: theme.palette.forest.blue,
                              color: 'white',
                              fontSize: '0.75rem',
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>

                      {/* Content */}
                      <Box flexGrow={1}>
                        <Typography 
                          variant="h6" 
                          color="text.primary"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          {t(card.titleKey)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ lineHeight: 1.6, mb: 2 }}
                        >
                          {t(card.descriptionKey)}
                        </Typography>

                        {/* Premium/Lock indicators */}
                        {card.premiumOnly && !isPremium && (
                          <Chip 
                            label={t('landing.premiumOnly')} 
                            size="small" 
                            sx={{ 
                              mt: 1,
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: theme.palette.warning.main,
                              fontSize: '0.75rem'
                            }} 
                          />
                        )}
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant={card.available ? "contained" : "outlined"}
                        fullWidth
                        disabled={!card.available}
                        sx={{
                          mt: 3,
                          py: 1.5,
                          bgcolor: card.available ? card.color : 'transparent',
                          color: card.available ? (card.id === 'journey' ? 'black' : 'white') : 'rgba(255,255,255,0.3)',
                          borderColor: card.available ? card.color : 'rgba(255,255,255,0.1)',
                          fontWeight: 600,
                          '&:hover': card.available ? {
                            bgcolor: card.hoverColor,
                            borderColor: card.hoverColor,
                          } : {},
                          '&:disabled': {
                            color: 'rgba(255,255,255,0.3)',
                            borderColor: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        {card.available 
                          ? t(card.buttonTextKey)
                          : (card.premiumOnly 
                            ? t('landing.upgradeToPremium')
                            : t(card.buttonTextKey)
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

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('landing.exploreMore', 'Explore the Forest')}
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LandingPage; 