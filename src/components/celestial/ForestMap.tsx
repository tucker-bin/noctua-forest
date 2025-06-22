import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useExperience } from '../../contexts/ExperienceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Badge
} from '@mui/material';
import {
  Visibility as TelescopeIcon,
  School as SchoolIcon,
  Piano as PianoIcon,
  EmojiEvents as TrophyIcon,
  Token as TokenIcon,
  Lock as LockIcon,
  Star as StarIcon,
  LocalFireDepartment as StreakIcon
} from '@mui/icons-material';

interface ForestArea {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  unlocked: boolean;
  tokenCost?: number;
  premiumOnly?: boolean;
  comingSoon?: boolean;
}

const ForestMap: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    tokens, 
    streak, 
    level, 
    xp, 
    xpForNextLevel, 
    achievements, 
    flowFinderChallenge,
    isPremium,
    useTokens 
  } = useExperience();

  const [selectedArea, setSelectedArea] = useState<ForestArea | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);

  const forestAreas: ForestArea[] = [
    {
      id: 'observatory',
      name: t('forest.areas.observatory.name', 'Observatory Clearing'),
      description: t('forest.areas.observatory.description', 'Observe patterns in text and poetry. Your gateway to discovery.'),
      icon: <TelescopeIcon sx={{ fontSize: 40, color: '#4A90E2' }} />,
      path: '/observatory',
      unlocked: true,
      tokenCost: isPremium ? 0 : 1
    },
    {
      id: 'learning',
      name: t('forest.areas.learning.name', 'Learning Groves'),
      description: t('forest.areas.learning.description', 'Master the art of pattern recognition through guided lessons.'),
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#7B68EE' }} />,
      path: '/lessons',
      unlocked: isPremium || level >= 2,
      premiumOnly: !isPremium
    },
    {
      id: 'scriptorium',
      name: t('forest.areas.scriptorium.name', 'Scriptorium Sanctuary'),
      description: t('forest.areas.scriptorium.description', 'Professional music and lyrics analysis for creative writers.'),
      icon: <PianoIcon sx={{ fontSize: 40, color: '#FF6B6B' }} />,
      path: '/scriptorium',
      unlocked: isPremium,
      premiumOnly: true
    },
    {
      id: 'forest',
      name: t('forest.areas.community.name', 'Community Forest'),
      description: t('forest.areas.community.description', 'Connect with fellow pattern explorers and share discoveries.'),
      icon: <StarIcon sx={{ fontSize: 40, color: '#4ECDC4' }} />,
      path: '/forest',
      unlocked: true
    }
  ];

  const handleAreaClick = (area: ForestArea) => {
    if (!area.unlocked) {
      setSelectedArea(area);
      return;
    }

    if (area.tokenCost && area.tokenCost > 0) {
      if (tokens < area.tokenCost) {
        setShowTokenDialog(true);
        return;
      }
      setSelectedArea(area);
      return;
    }

    navigate(area.path);
  };

  const handleEnterArea = () => {
    if (!selectedArea) return;

    if (selectedArea.tokenCost && selectedArea.tokenCost > 0) {
      if (useTokens(selectedArea.tokenCost)) {
        navigate(selectedArea.path);
        setSelectedArea(null);
      }
    } else {
      navigate(selectedArea.path);
      setSelectedArea(null);
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const progressPercent = ((xp % 100) / 100) * 100;

  return (
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header with user stats */}
      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                {currentUser?.displayName?.[0] || '🌟'}
              </Avatar>
              <Box>
                <Typography variant="h6">{currentUser?.displayName || t('common.explorer')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('forest.level')} {level} • {streak} {t('forest.dayStreak')} {streak > 0 && <StreakIcon sx={{ fontSize: 16, color: '#FF6B35' }} />}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">{t('forest.experience')}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={progressPercent} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption">{xp}/{xpForNextLevel} XP</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TokenIcon color="primary" />
              <Typography variant="h6">{tokens}</Typography>
              <Typography variant="body2" color="text.secondary">{t('forest.tokens')}</Typography>
              {!isPremium && (
                <Chip size="small" label={t('forest.dailyLimit', '5/day')} color="info" variant="outlined" />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TrophyIcon color="secondary" />
              <Typography variant="h6">{unlockedAchievements.length}</Typography>
              <Typography variant="body2" color="text.secondary">{t('forest.achievements')}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Flow Finder Challenge */}
      {flowFinderChallenge && !flowFinderChallenge.completed && (
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)' }}>
          <Typography variant="h6" color="white" gutterBottom>
            🎯 {t('forest.flowFinder')}
          </Typography>
          <Typography variant="body1" color="white" sx={{ mb: 2 }}>
            {t('forest.findPatterns')}: "{flowFinderChallenge.text}"
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
              onClick={() => navigate('/flow-finder-hub')}
            >
              {t('forest.startChallenge')} (+{flowFinderChallenge.tokensReward} 🪙 +{flowFinderChallenge.xpReward} XP)
            </Button>
          </Box>
        </Paper>
      )}

      {/* Forest Areas */}
      <Typography variant="h4" gutterBottom sx={{ color: 'white', textAlign: 'center', mb: 4 }}>
        🌲 {t('forest.title', 'Noctua Forest')}
      </Typography>

      <Grid container spacing={4}>
        {forestAreas.map((area) => (
          <Grid item xs={12} sm={6} md={3} key={area.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                },
                opacity: area.unlocked ? 1 : 0.7,
                background: area.unlocked 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'
                  : 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onClick={() => handleAreaClick(area)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box position="relative" display="inline-block">
                  {area.icon}
                  {!area.unlocked && (
                    <LockIcon 
                      sx={{ 
                        position: 'absolute', 
                        top: -5, 
                        right: -5, 
                        fontSize: 20, 
                        color: 'error.main' 
                      }} 
                    />
                  )}
                  {area.tokenCost && area.tokenCost > 0 && area.unlocked && (
                    <Badge 
                      badgeContent={`${area.tokenCost}🪙`} 
                      color="primary"
                      sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10 
                      }}
                    />
                  )}
                </Box>
                
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {area.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {area.description}
                </Typography>

                {area.premiumOnly && !isPremium && (
                  <Chip 
                    label={t('forest.premiumOnly')} 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                  />
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained"
                  disabled={!area.unlocked}
                  size="small"
                >
                  {area.unlocked 
                    ? area.tokenCost 
                      ? t('forest.enter') + ` (${area.tokenCost}🪙)`
                      : t('forest.enter')
                    : area.premiumOnly 
                      ? t('forest.upgradeToPremium')
                      : t('forest.locked')
                  }
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Area confirmation dialog */}
      <Dialog open={!!selectedArea} onClose={() => setSelectedArea(null)} maxWidth="sm" fullWidth>
        {selectedArea && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {selectedArea.icon}
                {selectedArea.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedArea.description}
              </Typography>
              
              {selectedArea.tokenCost && selectedArea.tokenCost > 0 && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6">
                    {t('forest.tokenCost')}: {selectedArea.tokenCost} 🪙
                  </Typography>
                  <Typography variant="body2">
                    {t('forest.currentTokens')}: {tokens} 🪙
                  </Typography>
                </Box>
              )}

              {selectedArea.premiumOnly && !isPremium && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'warning.main', 
                    color: 'white', 
                    borderRadius: 2,
                    textAlign: 'center',
                    mt: 2
                  }}
                >
                  <Typography variant="h6">
                    {t('forest.premiumRequired')}
                  </Typography>
                  <Typography variant="body2">
                    {t('forest.premiumBenefits')}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedArea(null)}>
                {t('common.cancel')}
              </Button>
              {selectedArea.unlocked && (
                <Button 
                  variant="contained" 
                  onClick={handleEnterArea}
                  disabled={selectedArea.tokenCost ? tokens < selectedArea.tokenCost : false}
                >
                  {t('forest.enter')}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Insufficient tokens dialog */}
      <Dialog open={showTokenDialog} onClose={() => setShowTokenDialog(false)}>
        <DialogTitle>{t('forest.insufficientTokens')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t('forest.needMoreTokens')}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('forest.earnTokens')}:
            </Typography>
            <ul>
              <li>{t('forest.flowFinder')}</li>
              <li>{t('forest.levelUp')}</li>
              <li>{t('forest.weeklyStreak')}</li>
              <li>{t('forest.upgradePremium')}</li>
            </ul>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTokenDialog(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForestMap; 