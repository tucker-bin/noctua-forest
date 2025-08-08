import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  useTheme,
  alpha,
  Chip,
  CircularProgress,
  Stack,
  Container,
  useMediaQuery,
  Divider
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useExperience } from '../../contexts/ExperienceContext';
import { useAuth } from '../../contexts/AuthContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TodayIcon from '@mui/icons-material/Today';
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import PsychologyIcon from '@mui/icons-material/Psychology';

interface DailyChallenge {
  id: string;
  boardSize: '4x4' | '8x8' | '16x16';
  completed: boolean;
  bestTime?: number;
  available: boolean;
}

export const FlowFinderHub: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { level, isPremium } = useExperience();
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loadingDailies, setLoadingDailies] = useState(false);

  // Load daily challenges status
  useEffect(() => {
    loadDailyChallenges();
  }, [currentUser]);

  const loadDailyChallenges = async () => {
    try {
      setLoadingDailies(true);
      
      // Get today's challenges from localStorage
      const today = new Date().toDateString();
      const savedProgress = localStorage.getItem(`daily_progress_${today}`);
      const progress = savedProgress ? JSON.parse(savedProgress) : {};

      // Create daily challenges - all 4x4 available to start
      const challenges: DailyChallenge[] = [
        { id: `daily_4x4_1_${today}`, boardSize: '4x4', completed: progress['4x4_1'] || false, available: true },
        { id: `daily_4x4_2_${today}`, boardSize: '4x4', completed: progress['4x4_2'] || false, available: true },
        { id: `daily_4x4_3_${today}`, boardSize: '4x4', completed: progress['4x4_3'] || false, available: true },
      ];

      setDailyChallenges(challenges);
    } catch (error) {
      console.error('Failed to load daily challenges:', error);
    } finally {
      setLoadingDailies(false);
    }
  };

  const startQuickGame = (boardSize: string = '4x4') => {
    navigate('/games/play', {
      state: {
        boardSize,
        mode: 'timed',
        quickStart: true
      }
    });
  };

  const startDailyChallenge = (challenge: DailyChallenge) => {
    if (!challenge.available || challenge.completed) return;
    
    navigate('/games/play', {
      state: {
        boardSize: challenge.boardSize,
        mode: 'daily',
        challengeId: challenge.id
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Hero Section with Quick Play */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          RhymeTime Games
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Match rhyming words in challenging puzzles
        </Typography>
        
        {/* Large Quick Play Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={() => startQuickGame()}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 3,
            minHeight: 60,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              transform: 'translateY(-2px)',
              boxShadow: 6
            }
          }}
        >
          Quick Play
        </Button>
      </Box>

      {/* Daily Challenges */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TodayIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Today's Challenges
          </Typography>
        </Box>
        
        {loadingDailies ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {dailyChallenges.map((challenge, index) => (
              <Grid item xs={4} sm={3} md={2} key={challenge.id}>
                <Card
                  onClick={() => startDailyChallenge(challenge)}
                  sx={{
                    cursor: challenge.available && !challenge.completed ? 'pointer' : 'default',
                    opacity: !challenge.available ? 0.5 : challenge.completed ? 0.8 : 1,
                    minHeight: isMobile ? 100 : 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    bgcolor: challenge.completed ? alpha(theme.palette.success.main, 0.1) : 'background.paper',
                    border: `2px solid ${challenge.completed ? theme.palette.success.main : 'transparent'}`,
                    '&:hover': challenge.available && !challenge.completed ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: theme.palette.primary.main
                    } : {}
                  }}
                >
                  {!challenge.available ? (
                    <>
                      <LockIcon color="disabled" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Locked
                      </Typography>
                    </>
                  ) : challenge.completed ? (
                    <>
                      <CheckIcon sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                        Complete
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {challenge.boardSize}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Daily {index + 1}
                      </Typography>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Game Modes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Choose Your Challenge
        </Typography>
        
        <Grid container spacing={3}>
          {/* Quick 4x4 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              onClick={() => startQuickGame('4x4')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                minHeight: 140,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h2" sx={{ fontSize: 48 }}>⚡</Typography>
                <Chip label="2 min" size="small" color="primary" />
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Quick Game
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                4x4 • 16 words • Perfect for quick breaks
              </Typography>

              <Button
                variant="contained"
                fullWidth
                startIcon={<PlayArrowIcon />}
                sx={{ mt: 'auto' }}
              >
                Play Now
              </Button>
            </Card>
          </Grid>

          {/* Standard 8x8 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              onClick={() => level >= 5 ? startQuickGame('8x8') : navigate('/subscribe')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                minHeight: 140,
                opacity: level >= 5 ? 1 : 0.7,
                '&:hover': level >= 5 ? {
                  transform: 'translateY(-4px)',
                  borderColor: theme.palette.secondary.main,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`
                } : {}
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h2" sx={{ fontSize: 48 }}>🎯</Typography>
                <Chip label="5 min" size="small" color="secondary" />
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Standard Game
                {level < 5 && <Chip label="Level 5+" size="small" sx={{ ml: 1 }} />}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {level >= 5 ? "8x8 • 64 words • Real challenge" : "Unlock at Level 5"}
              </Typography>

              <Button
                variant={level >= 5 ? "contained" : "outlined"}
                fullWidth
                startIcon={level >= 5 ? <PlayArrowIcon /> : <LockIcon />}
                sx={{ mt: 'auto' }}
                disabled={level < 5}
              >
                {level >= 5 ? "Play Now" : "Locked"}
              </Button>
            </Card>
          </Grid>

          {/* Premium Mega */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              onClick={() => isPremium ? startQuickGame('16x16') : navigate('/subscribe')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                minHeight: 140,
                opacity: isPremium ? 1 : 0.7,
                '&:hover': isPremium ? {
                  transform: 'translateY(-4px)',
                  borderColor: theme.palette.warning.main,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.warning.main, 0.3)}`
                } : {}
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h2" sx={{ fontSize: 48 }}>🔥</Typography>
                <Chip label="15 min" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2) }} />
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Mega Game
                {!isPremium && <Chip label="Premium" size="small" color="warning" sx={{ ml: 1 }} />}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isPremium ? "16x16 • 256 words • Ultimate test" : "Premium Only"}
              </Typography>

              <Button
                variant={isPremium ? "contained" : "outlined"}
                fullWidth
                startIcon={isPremium ? <PlayArrowIcon /> : <LockIcon />}
                sx={{ 
                  mt: 'auto',
                  bgcolor: isPremium ? theme.palette.warning.main : 'transparent',
                  '&:hover': {
                    bgcolor: isPremium ? theme.palette.warning.dark : 'transparent'
                  }
                }}
              >
                {isPremium ? "Play Now" : "Get Premium"}
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add after the main game modes or in the header */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Divider sx={{ mb: 2 }}>
          <Chip label="Alpha Testing" size="small" />
        </Divider>
        <Button
          component={Link}
          to="/flow-finder/advanced"
          variant="outlined"
          startIcon={<PsychologyIcon />}
          sx={{ 
            borderStyle: 'dashed',
            borderColor: 'warning.main',
            color: 'warning.main',
            '&:hover': {
              borderColor: 'warning.dark',
              backgroundColor: 'warning.main',
              color: 'warning.contrastText'
            }
          }}
        >
          Try Advanced Pattern Matching (Alpha)
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Test the new phonetic and semantic pattern system
        </Typography>
      </Box>

      {/* Bottom Navigation */}
      <Box sx={{ textAlign: 'center', pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
          {!isPremium && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate('/subscribe')}
            >
              Get Premium
            </Button>
          )}
        </Stack>
      </Box>

      {/* Coming Soon Section */}
      <Box sx={{ mt: 6, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
          🚀 Coming Soon
        </Typography>
        
        <Grid container spacing={2}>
          {/* Observatory */}
          <Grid item xs={12} sm={6}>
            <Card 
              onClick={() => navigate('/legacy/observatory')}
              sx={{ 
                p: 2, 
                opacity: 0.7,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  opacity: 1,
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4">🔭</Typography>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Observatory
                    <Chip label="Beta Access" size="small" color="info" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sophisticated text pattern analysis for poets and writers
                  </Typography>
                  <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                    Click to try the current beta version
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Multiplayer */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ 
              p: 2, 
              opacity: 0.7,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              bgcolor: alpha(theme.palette.secondary.main, 0.05)
            }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4">👥</Typography>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Multiplayer Battles
                    <Chip label="Coming Soon" size="small" color="secondary" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time rhyming battles with friends and global players
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 