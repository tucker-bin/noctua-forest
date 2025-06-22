import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useExperience } from '../../contexts/ExperienceContext';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Lock as LockIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Grid3x3 as Grid4Icon,
  Grid4x4 as Grid8Icon,
  Info as InfoIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`flow-finder-tabpanel-${index}`}
      aria-labelledby={`flow-finder-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FlowFinderHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { 
    flowFinderChallenge, 
    weeklyPacks, 
    isPremium, 
    loadWeeklyPacks,
    tokens 
  } = useExperience();

  const [tabValue, setTabValue] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    loadWeeklyPacks();
  }, [loadWeeklyPacks]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChallengeClick = (challenge: any, requiresPremium: boolean = false) => {
    if (requiresPremium && !isPremium) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setSelectedChallenge(challenge);
  };

  const handlePlayChallenge = (gridSize: '4x4' | '8x8') => {
    // Navigate to FlowFinder with the selected grid size
    navigate(`/flow-finder?size=${gridSize}&challenge=${selectedChallenge?.id || 'daily'}`);
  };

  const getDifficultyColor = (gridSize: '4x4' | '8x8') => {
    return gridSize === '4x4' ? theme.palette.success.main : theme.palette.warning.main;
  };

  const getDifficultyIcon = (gridSize: '4x4' | '8x8') => {
    return gridSize === '4x4' ? <Grid4Icon /> : <Grid8Icon />;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.forest.background,
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper sx={{ 
          p: 4, 
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
          borderRadius: 2
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h3" color="text.primary" sx={{ 
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 600
            }}>
              🎯 Flow Finder Hub
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Chip 
                icon={<StarIcon />}
                label={isPremium ? 'Premium' : 'Free'}
                color={isPremium ? 'secondary' : 'default'}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {tokens} 🪙
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Master rhyme patterns with strategic gameplay. Choose your grid size and difficulty!
          </Typography>
          
          {/* Daily Challenges Quick Access */}
          {flowFinderChallenge && !flowFinderChallenge.completed && (
            <Card sx={{ 
              mb: 3,
              background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🌟 Today's Challenge
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {flowFinderChallenge.text}
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip 
                    icon={getDifficultyIcon(flowFinderChallenge.gridSize)}
                    label={flowFinderChallenge.gridSize}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Typography variant="caption">
                    +{flowFinderChallenge.tokensReward} 🪙 +{flowFinderChallenge.xpReward} XP
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => navigate('/flow-finder')}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Play Now
                </Button>
              </CardActions>
            </Card>
          )}
        </Paper>

        {/* Tabs for different content */}
        <Paper sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
          borderRadius: 2
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="Daily Challenges" />
            <Tab label="Weekly Packs" />
            <Tab label="Archive" />
          </Tabs>

          {/* Daily Challenges Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" gutterBottom>
              Daily Challenges
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fresh challenges every day! Choose your preferred grid size.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  height: '100%',
                  border: `2px solid ${getDifficultyColor('4x4')}`,
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s' }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {getDifficultyIcon('4x4')}
                      <Typography variant="h6">4x4 Grid</Typography>
                      <Chip label="Easy" size="small" color="success" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Perfect for beginners. 16 words, 3-5 words per rhyme group.
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip label="+3 🪙" size="small" />
                      <Chip label="+25 XP" size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => handlePlayChallenge('4x4')}
                      sx={{ bgcolor: getDifficultyColor('4x4') }}
                    >
                      Play 4x4
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  height: '100%',
                  border: `2px solid ${getDifficultyColor('8x8')}`,
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s' }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {getDifficultyIcon('8x8')}
                      <Typography variant="h6">8x8 Grid</Typography>
                      <Chip label="Hard" size="small" color="warning" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For experts. 64 words, 2-4 words per rhyme group.
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip label="+5 🪙" size="small" />
                      <Chip label="+50 XP" size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => handlePlayChallenge('8x8')}
                      sx={{ bgcolor: getDifficultyColor('8x8') }}
                    >
                      Play 8x8
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Weekly Packs Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom>
              Weekly Packs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Collections of 14 challenges (7 days × 2 sizes). Free users get the last month's packs.
            </Typography>

            <Grid container spacing={3}>
              {weeklyPacks.slice(0, 8).map((pack) => (
                <Grid item xs={12} md={6} lg={4} key={pack.id}>
                  <Card sx={{ 
                    height: '100%',
                    opacity: pack.unlocked || isPremium ? 1 : 0.6,
                    border: pack.isPremium && !isPremium ? `2px solid ${theme.palette.warning.main}` : 'none'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CalendarIcon />
                        <Typography variant="h6">{pack.name}</Typography>
                        {pack.isPremium && !isPremium && (
                          <LockIcon fontSize="small" color="warning" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {pack.description}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={0} // TODO: Calculate completion percentage
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        0/14 challenges completed
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        variant={pack.unlocked || isPremium ? "contained" : "outlined"}
                        startIcon={pack.isPremium && !isPremium ? <LockIcon /> : <PlayIcon />}
                        onClick={() => handleChallengeClick(pack, pack.isPremium)}
                        disabled={!pack.unlocked && !isPremium}
                      >
                        {pack.isPremium && !isPremium ? 'Premium' : 'Play Pack'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Archive Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom>
              Archive
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Older weekly packs available for premium members.
            </Typography>

            {!isPremium ? (
              <Card sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Premium Feature
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Access to all archived weekly packs with unlimited gameplay.
                </Typography>
                <Button 
                  variant="contained"
                  color="warning"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  Upgrade to Premium
                </Button>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {weeklyPacks.slice(8).map((pack) => (
                  <Grid item xs={12} md={6} lg={4} key={pack.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{pack.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pack.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          variant="contained"
                          startIcon={<PlayIcon />}
                          onClick={() => handleChallengeClick(pack)}
                        >
                          Play Pack
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Paper>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)}>
          <DialogTitle>Upgrade to Premium</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Unlock unlimited access to Flow Finder with Premium:
            </Typography>
            <ul>
              <li>Access to all archived weekly packs</li>
              <li>Unlimited daily challenges</li>
              <li>No token costs for gameplay</li>
              <li>Exclusive premium-only challenge types</li>
              <li>Priority access to new features</li>
            </ul>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpgradeDialog(false)}>
              Maybe Later
            </Button>
            <Button variant="contained" color="warning">
              Upgrade Now
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default FlowFinderHub; 