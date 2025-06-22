import React, { useState } from 'react';
import { Box, Container, Tabs, Tab, Typography, Card, CardContent, Grid, Button, useTheme } from '@mui/material';
import { CommunityForest } from '../components/social/CommunityForest';
import Observatory from '../components/Observatory/Observatory';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import TelescopeIcon from '@mui/icons-material/Visibility';
import GroupsIcon from '@mui/icons-material/Groups';

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { log } from '../utils/logger';
import { Scriptorium } from '../components/Scriptorium/Scriptorium';

// Mock data - in real app this would come from API
const mockAnalyses = [
  {
    id: '1',
    author: {
      name: 'Luna Starweaver',
      avatar: '/avatars/luna.jpg',
      constellation: 'Lyrical Astronomer'
    },
    text: 'Whispers of wind through willows weave wondrous words',
    patterns: [
      { type: 'alliteration', count: 8 },
      { type: 'assonance', count: 3 }
    ],
    insights: 'The alliteration creates a flowing, musical quality that mirrors the wind movement described.',
    likes: 23,
    isLiked: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    language: 'en'
  },
  {
    id: '2',
    author: {
      name: 'Cosmos Chen',
      avatar: '/avatars/cosmos.jpg',
      constellation: 'Pattern Navigator'
    },
    text: '夜空中繁星点点，闪烁着古老的秘密',
    patterns: [
      { type: 'consonance', count: 4 },
      { type: 'rhythm', count: 2 }
    ],
    insights: 'The tonal patterns in Chinese create a celestial rhythm that echoes the star imagery.',
    likes: 31,
    isLiked: true,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    language: 'zh'
  }
];

const mockStargazers = [
  {
    id: '1',
    name: 'Luna Starweaver',
    avatar: '/avatars/luna.jpg',
    bio: 'Exploring the music hidden in everyday language',
    constellation: 'Lyrical Astronomer',
    starsGiven: 142,
    starsReceived: 89,
    isFollowing: false
  },
  {
    id: '2',
    name: 'Cosmos Chen',
    avatar: '/avatars/cosmos.jpg',
    bio: 'Bridging Eastern and Western poetic traditions through pattern analysis',
    constellation: 'Pattern Navigator',
    starsGiven: 203,
    starsReceived: 156,
    isFollowing: true
  },
  {
    id: '3',
    name: 'Maya Rhythmus',
    avatar: '/avatars/maya.jpg',
    bio: 'Finding the heartbeat in words, the dance in sentences',
    constellation: 'Rhythm Keeper',
    starsGiven: 87,
    starsReceived: 124,
    isFollowing: false
  }
];

const ForestAreaCard = ({ title, description, icon, isActive, onClick, theme }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  theme: any;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      sx={{
        cursor: 'pointer',
        background: isActive 
          ? `linear-gradient(135deg, ${theme.palette.forest.primary}50 0%, ${theme.palette.forest.card}F0 100%)`
          : `linear-gradient(135deg, ${theme.palette.forest.card}CC 0%, ${theme.palette.forest.card}99 100%)`,
        backdropFilter: 'blur(10px)',
        border: isActive 
          ? `2px solid ${theme.palette.forest.primary}`
          : `1px solid ${theme.palette.forest.border}40`,
        transition: 'all 0.3s ease',
        height: '100%',
        boxShadow: isActive
          ? `0 0 20px ${theme.palette.forest.primary}40`
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          border: `1px solid ${theme.palette.forest.primary}99`,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 16px ${theme.palette.forest.primary}30`,
          background: `linear-gradient(135deg, ${theme.palette.forest.primary}30 0%, ${theme.palette.forest.card}E6 100%)`,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ mb: 2, color: theme.palette.forest.secondary, fontSize: '3rem' }}>
          {icon}
        </Box>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: isActive ? theme.palette.forest.primary : 'text.primary',
            fontFamily: '"Noto Sans", sans-serif',
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

export const ForestPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeArea, setActiveArea] = useState<'overview' | 'observatory' | 'community' | 'pathways' | 'scriptorium'>('overview');

  const handleLike = (analysisId: string) => {
    log.info('Liked analysis:', { data: analysisId });
  };

  const handleShare = (analysisId: string) => {
    log.info('Shared analysis:', { data: analysisId });
  };

  const handleView = (analysisId: string) => {
    log.info('Viewing analysis:', { data: analysisId });
  };

  const handleFollow = (userId: string) => {
    log.info('Following user:', { data: userId });
  };

  const handleUnfollow = (userId: string) => {
    log.info('Unfollowing user:', { data: userId });
  };

  const forestAreas = [
    {
      id: 'observatory',
      title: t('forest.areas.observatory', 'Observatory'),
      description: t('forest.areas.observatory_desc', 'Discover patterns hidden in text under the starlit canopy'),
      icon: <TelescopeIcon fontSize="inherit" />
    },
    {
      id: 'community',
      title: t('forest.areas.community', 'Community Forest'),
      description: t('forest.areas.community_desc', 'Share discoveries and connect with fellow observers'),
      icon: <GroupsIcon fontSize="inherit" />
    },
    {
      id: 'pathways',
      title: t('forest.areas.pathways', 'Learning Pathways'),
      description: t('forest.areas.pathways_desc', 'Follow guided trails to deepen your observation skills'),
      icon: <AutoStoriesIcon fontSize="inherit" />
    },
    {
      id: 'scriptorium',
      title: t('forest.areas.scriptorium', 'Song Scriptorium'),
      description: t('forest.areas.scriptorium_desc', 'Discover patterns in music and lyrics'),
      icon: <AudiotrackIcon fontSize="inherit" />
    }
  ];

  return (

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Forest Overview */}
        {activeArea === 'overview' && (
          <>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.forest.primary,
                    fontFamily: '"Noto Sans", sans-serif',
                    mb: 2,
                    background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }
                  }}
                >
                  {t('forest.welcome', 'Welcome to Noctua Forest')}
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{ 
                    maxWidth: 800, 
                    mx: 'auto',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    mb: 4
                  }}
                >
                  {t('forest.welcome_subtitle', 'A mystical realm where language patterns dance among the stars, and every word holds the potential for discovery')}
                </Typography>

                {/* Primary CTAs */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setActiveArea('observatory')}
                    startIcon={<TelescopeIcon />}
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                      color: 'black',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.forest.secondary}, ${theme.palette.forest.primary})`,
                      },
                    }}
                  >
                    {t('forest.start_observing', 'Begin Observing')}
                  </Button>
                  {!currentUser && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        borderColor: theme.palette.forest.blue,
                        color: theme.palette.forest.blue,
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: theme.palette.forest.blue,
                          backgroundColor: `${theme.palette.forest.blue}20`,
                        },
                      }}
                    >
                      {t('enter_forest', 'Create Your Profile')}
                    </Button>
                  )}
                  {currentUser && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/lessons')}
                      startIcon={<AutoStoriesIcon />}
                      sx={{
                        borderColor: theme.palette.forest.blue,
                        color: theme.palette.forest.blue,
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: theme.palette.forest.blue,
                          backgroundColor: `${theme.palette.forest.blue}20`,
                        },
                      }}
                    >
                      {t('lessons.title', 'Learning Paths')}
                    </Button>
                  )}
                </Box>
              </motion.div>
            </Box>

            {/* Feature Cards */}
            <Typography
              variant="h4"
              sx={{
                textAlign: 'center',
                mb: 4,
                color: 'text.secondary',
                fontFamily: '"Noto Sans", sans-serif',
              }}
            >
              {t('forest.explore_features', 'Explore the Forest')}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 4, mb: 6 }}>
              {forestAreas.map((area, index) => (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  style={{ width: '100%' }}
                >
                  <ForestAreaCard
                    title={area.title}
                    description={area.description}
                    icon={area.icon}
                    isActive={false}
                    onClick={() => {
                      if (area.id === 'pathways') {
                        navigate('/lessons');
                      } else {
                        setActiveArea(area.id as any);
                      }
                    }}
                    theme={theme}
                  />
                </motion.div>
              ))}
            </Box>

            {/* Quick Stats or Info */}
            <Box sx={{ 
              textAlign: 'center', 
              mt: 8,
              p: 4,
              background: `${theme.palette.forest.card}66`,
              borderRadius: 2,
              border: `1px solid ${theme.palette.forest.border}40`
            }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {t('forest.discover_more', 'Discover the magic of pattern observation')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" color={theme.palette.forest.secondary} fontWeight="bold">14</Typography>
                  <Typography variant="body2" color="text.secondary">{t('forest.languages_supported', 'Languages')}</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color={theme.palette.forest.secondary} fontWeight="bold">20+</Typography>
                  <Typography variant="body2" color="text.secondary">{t('forest.pattern_types', 'Pattern Types')}</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color={theme.palette.forest.secondary} fontWeight="bold">∞</Typography>
                  <Typography variant="body2" color="text.secondary">{t('forest.discoveries_await', 'Discoveries')}</Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Observatory Area */}
        {activeArea === 'observatory' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Button
                onClick={() => setActiveArea('overview')}
                sx={{ mr: 2, color: theme.palette.forest.accent }}
              >
                ← {t('forest.back_to_forest', 'Back to Forest')}
              </Button>
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.forest.primary,
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 600
                }}
              >
                🔭 {t('forest.areas.observatory', 'Observatory')}
              </Typography>
            </Box>
            <Observatory />
          </>
        )}

        {/* Community Area */}
        {activeArea === 'community' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Button
                onClick={() => setActiveArea('overview')}
                sx={{ mr: 2, color: theme.palette.forest.accent }}
              >
                ← {t('forest.back_to_forest', 'Back to Forest')}
              </Button>
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.forest.primary,
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 600
                }}
              >
                🌲 {t('forest.areas.community', 'Community Forest')}
              </Typography>
            </Box>
            <CommunityForest
              analyses={mockAnalyses}
              stargazers={mockStargazers}
              onLike={handleLike}
              onShare={handleShare}
              onView={handleView}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          </>
        )}

        {/* Scriptorium Area */}
        {activeArea === 'scriptorium' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Button
                onClick={() => setActiveArea('overview')}
                sx={{ mr: 2, color: theme.palette.forest.accent }}
              >
                ← {t('forest.back_to_forest', 'Back to Forest')}
              </Button>
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.forest.primary,
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 600
                }}
              >
                🎵 {t('forest.areas.scriptorium', 'Song Scriptorium')}
              </Typography>
            </Box>
            <Scriptorium />
          </>
        )}
      </Container>

  );
}; 
