import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useExperience } from '../../contexts/ExperienceContext';
import FlowFinder from './FlowFinder';
import StarIcon from '@mui/icons-material/Star';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExtensionIcon from '@mui/icons-material/Extension';
import LockIcon from '@mui/icons-material/Lock';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const FlowFinderHub: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { 
    flowFinderChallenge, 
    level, 
    xp,
    weeklyPacks,
    isPremium
  } = useExperience();
  
  const [activeTab, setActiveTab] = useState(0);
  const availablePacks = weeklyPacks;

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'challenges') {
      setActiveTab(1);
    } else if (tabParam === 'packs') {
      setActiveTab(2);
    } else if (tabParam === 'play') {
      setActiveTab(0);
    }
  }, [searchParams]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const challengeTypes = [
    {
      id: 'daily',
      title: t('flowFinder.dailyChallenge', 'Daily Challenge'),
      description: t('flowFinder.dailyDescription', 'Fresh puzzles every day'),
      icon: <CalendarTodayIcon />,
      available: true,
      difficulty: 'Medium',
      rewards: { tokens: 10, xp: 50 }
    },
    {
      id: 'weekly',
      title: t('flowFinder.weeklyChallenge', 'Weekly Challenge'),
      description: t('flowFinder.weeklyDescription', 'Harder puzzles with bigger rewards'),
      icon: <TrophyIcon />,
      available: level >= 5,
      difficulty: 'Hard',
      rewards: { tokens: 25, xp: 150 }
    },
    {
      id: 'premium',
      title: t('flowFinder.premiumPuzzles', 'Premium Puzzles'),
      description: t('flowFinder.premiumDescription', 'Unlimited custom puzzles'),
      icon: <StarIcon />,
      available: isPremium,
      difficulty: 'Variable',
      rewards: { tokens: 15, xp: 75 }
    }
  ];

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            🧩 {t('flowFinder.hub.title', 'Flow Finder Hub')}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" paragraph>
            {t('flowFinder.hub.subtitle', 'Connect letters, find words, and challenge your mind!')}
          </Typography>
          
          {/* Player Stats */}
          <Box display="flex" justifyContent="center" gap={3} mb={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {level}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('common.level', 'Level')}
              </Typography>
            </Box>
                         <Box textAlign="center">
               <Typography variant="h6" color="primary">
                 {xp}
               </Typography>
               <Typography variant="caption" color="text.secondary">
                 {t('common.xp', 'XP')}
               </Typography>
             </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {/* This would come from a stats service */}
                {Math.floor(Math.random() * 50) + 10}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('flowFinder.puzzlesSolved', 'Puzzles Solved')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab 
            label={t('flowFinder.tabs.play', 'Play')} 
            icon={<ExtensionIcon />}
            iconPosition="start"
          />
          <Tab 
            label={t('flowFinder.tabs.challenges', 'Challenges')} 
            icon={<TrophyIcon />}
            iconPosition="start"
          />
          <Tab 
            label={t('flowFinder.tabs.packs', 'Puzzle Packs')} 
            icon={<StarIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {/* Main Game */}
        <FlowFinder />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Challenge Selection */}
        <Grid container spacing={3}>
          {challengeTypes.map((challenge) => (
            <Grid item xs={12} md={4} key={challenge.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    opacity: challenge.available ? 1 : 0.6,
                    cursor: challenge.available ? 'pointer' : 'default',
                    border: challenge.available ? `1px solid ${theme.palette.primary.main}40` : '1px solid transparent',
                    '&:hover': {
                      border: challenge.available ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box sx={{ color: theme.palette.primary.main, mr: 1 }}>
                        {challenge.icon}
                      </Box>
                      <Typography variant="h6">
                        {challenge.title}
                      </Typography>
                      {!challenge.available && (
                        <LockIcon sx={{ ml: 'auto', color: 'text.disabled' }} />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {challenge.description}
                    </Typography>

                    <Box mb={2}>
                      <Chip 
                        label={challenge.difficulty} 
                        size="small" 
                        color={
                          challenge.difficulty === 'Easy' ? 'success' :
                          challenge.difficulty === 'Medium' ? 'warning' :
                          challenge.difficulty === 'Hard' ? 'error' : 'primary'
                        }
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        {t('common.rewards', 'Rewards')}:
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip 
                          label={`${challenge.rewards.tokens} tokens`} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${challenge.rewards.xp} XP`} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Button
                      variant={challenge.available ? 'contained' : 'outlined'}
                      fullWidth
                      disabled={!challenge.available}
                      onClick={() => setActiveTab(0)} // Switch to play tab
                    >
                      {challenge.available 
                        ? t('flowFinder.startChallenge', 'Start Challenge')
                        : challenge.id === 'weekly' 
                          ? t('flowFinder.unlockAtLevel', 'Unlock at Level {{level}}', { level: 5 })
                          : t('flowFinder.premiumRequired', 'Premium Required')
                      }
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Puzzle Packs */}
        <Grid container spacing={3}>
          {availablePacks.map((pack) => (
            <Grid item xs={12} md={6} key={pack.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {pack.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {pack.description}
                  </Typography>
                  
                                     <Box mb={2}>
                     <Typography variant="caption" color="text.secondary">
                       {t('flowFinder.progress', 'Progress')}
                     </Typography>
                     <LinearProgress 
                       variant="determinate" 
                       value={(pack.challenges.filter(c => c.completed).length / pack.challenges.length) * 100} 
                       sx={{ mt: 0.5 }}
                     />
                     <Typography variant="caption" color="text.secondary">
                       {pack.challenges.filter(c => c.completed).length}/{pack.challenges.length} {t('flowFinder.completed', 'completed')}
                     </Typography>
                   </Box>
 
                   <Box display="flex" justifyContent="space-between" alignItems="center">
                     <Chip 
                       label={pack.isPremium ? 'Premium' : 'Free'} 
                       size="small" 
                       color={pack.isPremium ? 'warning' : 'success'}
                     />
                    <Button 
                      variant="outlined" 
                      size="small"
                      disabled={!pack.unlocked}
                    >
                      {pack.unlocked 
                        ? t('flowFinder.playPack', 'Play Pack')
                        : t('flowFinder.locked', 'Locked')
                      }
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {availablePacks.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('flowFinder.noPacks', 'No puzzle packs available')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('flowFinder.upgradeForPacks', 'Upgrade to Premium to unlock exclusive puzzle packs!')}
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              {t('common.upgradeToPremium', 'Upgrade to Premium')}
            </Button>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default FlowFinderHub; 