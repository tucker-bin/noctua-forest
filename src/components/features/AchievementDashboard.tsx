import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExperience } from '../../contexts/ExperienceContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  School as LearningIcon,
  Visibility as DiscoveryIcon,
  Group as CommunityIcon,
  Work as ProfessionalIcon,
  LocalFireDepartment as StreakIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`achievement-tabpanel-${index}`}
      aria-labelledby={`achievement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AchievementDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { achievements, xp, level, streak } = useExperience();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const categoryIcons = {
    learning: <LearningIcon />,
    discovery: <DiscoveryIcon />,
    community: <CommunityIcon />,
    professional: <ProfessionalIcon />,
    streak: <StreakIcon />
  };

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const getAchievementProgress = (achievement: any) => {
    if (achievement.unlocked) return 100;
    if (achievement.progress !== undefined && achievement.maxProgress !== undefined) {
      return (achievement.progress / achievement.maxProgress) * 100;
    }
    return 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          maxWidth: '1200px !important'
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Card 
            sx={{ 
              mb: 4, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
              width: '100%',
              maxWidth: '1000px'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography 
                    variant="h1" 
                    color="text.primary"
                    sx={{ 
                      fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                      fontWeight: 700,
                      mb: 2,
                      background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    🏆 {t('achievements.title')}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      lineHeight: 1.6,
                      fontSize: { xs: '1rem', md: '1.125rem' }
                    }}
                  >
                    {t('achievements.subtitle')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography 
                      variant="h2" 
                      color="text.primary"
                      sx={{ 
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontWeight: 700,
                        background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {unlockedCount}/{totalCount}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {t('achievements.unlocked')}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={completionRate}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        mt: 1,
                        bgcolor: alpha(theme.palette.forest.primary, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.forest.primary
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Grid container spacing={3} sx={{ mb: 4, maxWidth: '900px' }}>
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 32px ${alpha(theme.palette.forest.primary, 0.1)}`,
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.forest.primary, 
                    mx: 'auto', 
                    mb: 2,
                    width: 56,
                    height: 56,
                    color: 'black'
                  }}
                >
                  <StarIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                  {level}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('achievements.currentLevel')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {xp} XP
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 32px ${alpha('#FF6B35', 0.1)}`,
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#FF6B35', 
                    mx: 'auto', 
                    mb: 2,
                    width: 56,
                    height: 56
                  }}
                >
                  <StreakIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                  {streak}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('achievements.currentStreak')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('achievements.days')}
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 32px ${alpha(theme.palette.forest.secondary, 0.1)}`,
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.forest.secondary, 
                    mx: 'auto', 
                    mb: 2,
                    width: 56,
                    height: 56
                  }}
                >
                  <TrophyIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                  {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('achievements.achievementXP')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('achievements.totalEarned')}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Achievement Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Card 
            sx={{ 
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
              width: '100%',
              maxWidth: '1200px'
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
                '& .MuiTab-root': {
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: theme.palette.forest.primary
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.forest.primary
                }
              }}
            >
              <Tab 
                label={t('achievements.all')} 
                icon={<TrophyIcon />} 
                iconPosition="start"
              />
              {Object.keys(achievementsByCategory).map((category, index) => (
                <Tab 
                  key={category}
                  label={t(`achievements.categories.${category}`)}
                  icon={categoryIcons[category as keyof typeof categoryIcons]}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* All Achievements Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {achievements.map((achievement, index) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
                          backdropFilter: 'blur(10px)',
                          border: achievement.unlocked 
                            ? `2px solid ${theme.palette.forest.primary}` 
                            : `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: achievement.unlocked ? 1 : 0.7,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 32px ${alpha(theme.palette.forest.primary, 0.1)}`,
                            borderColor: alpha(theme.palette.forest.primary, 0.5),
                          }
                        }}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Box position="relative" display="inline-block" mb={2}>
                            <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                              {achievement.icon}
                            </Typography>
                            {!achievement.unlocked && (
                              <LockIcon 
                                sx={{ 
                                  position: 'absolute', 
                                  top: -5, 
                                  right: -5, 
                                  fontSize: 20, 
                                  color: 'text.secondary' 
                                }} 
                              />
                            )}
                            {achievement.unlocked && (
                              <Badge 
                                badgeContent="✓" 
                                color="success"
                                sx={{ 
                                  position: 'absolute', 
                                  top: -5, 
                                  right: -5 
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography variant="h6" gutterBottom color="text.primary" sx={{ fontWeight: 600 }}>
                            {achievement.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            {achievement.description}
                          </Typography>

                          <Chip 
                            label={`+${achievement.xpReward} XP`}
                            sx={{
                              mb: 1,
                              bgcolor: theme.palette.forest.secondary,
                              color: 'white',
                              fontWeight: 600
                            }}
                            size="small"
                          />

                          {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={getAchievementProgress(achievement)}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  bgcolor: alpha(theme.palette.forest.primary, 0.2),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: theme.palette.forest.primary
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {achievement.progress}/{achievement.maxProgress} {t('achievements.progress')}
                              </Typography>
                            </Box>
                          )}

                          {achievement.unlocked && achievement.unlockedAt && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme.palette.forest.primary }}>
                              {t('achievements.unlockedOn')} {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Category Tabs */}
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements], index) => (
              <TabPanel key={category} value={tabValue} index={index + 1}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {categoryIcons[category as keyof typeof categoryIcons]} {t(`achievements.categories.${category}`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`achievements.categoryDescriptions.${category}`)}
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {categoryAchievements.map((achievement) => (
                    <Grid item xs={12} sm={6} key={achievement.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3
                          },
                          opacity: achievement.unlocked ? 1 : 0.7,
                          border: achievement.unlocked ? '2px solid #4CAF50' : '1px solid #e0e0e0'
                        }}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>
                              {achievement.icon}
                            </Typography>
                            <Box flex={1}>
                              <Typography variant="h6">{achievement.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {achievement.description}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Chip 
                                label={`+${achievement.xpReward} XP`}
                                color="secondary"
                                size="small"
                              />
                              {achievement.unlocked && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                                  ✓ {t('achievements.unlocked')}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          
                          {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={getAchievementProgress(achievement)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {achievement.progress}/{achievement.maxProgress} {t('achievements.progress')}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </TabPanel>
            ))}
          </Card>
        </motion.div>

        {/* Achievement Detail Dialog */}
        <Dialog 
          open={!!selectedAchievement} 
          onClose={() => setSelectedAchievement(null)}
          maxWidth="sm" 
          fullWidth
        >
          {selectedAchievement && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h4" sx={{ fontSize: '2rem' }}>
                    {selectedAchievement.icon}
                  </Typography>
                  <Box>
                    <Typography variant="h6">{selectedAchievement.name}</Typography>
                    <Chip 
                      label={t(`achievements.categories.${selectedAchievement.category}`)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedAchievement.description}
                </Typography>
                
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('achievements.reward')}:</strong> +{selectedAchievement.xpReward} XP
                  </Typography>
                  {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
                    <Typography variant="body2" color="success.main">
                      <strong>{t('achievements.unlockedOn')}:</strong> {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>

                {selectedAchievement.progress !== undefined && selectedAchievement.maxProgress !== undefined && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      {t('achievements.progress')}: {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getAchievementProgress(selectedAchievement)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {!selectedAchievement.unlocked && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      💡 {t('achievements.howToUnlock')}: {t(`achievements.hints.${selectedAchievement.id}`)}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedAchievement(null)}>
                  {t('common.close')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default AchievementDashboard; 