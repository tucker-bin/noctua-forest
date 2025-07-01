import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
  Badge,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useExperience } from '../../contexts/ExperienceContext';
import FlowFinderService from '../../services/flowFinderService';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as RankingIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Whatshot as StreakIcon,
  Group as FriendsIcon,
  Send as ChallengeIcon,
  Share as ShareIcon,
  Timer as TimeIcon,
  Games as GamesIcon,
  Psychology as SkillIcon,
  LocalFireDepartment as FireIcon,
  Diamond as DiamondIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

interface LeaderboardPlayer {
  userId: string;
  username: string;
  avatar: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  streak: number;
  averageTime: number;
  lastPlayed: Date;
  level: number;
  rank: number;
  tier: string;
  achievements: LeaderboardAchievement[];
  isOnline: boolean;
  isFriend: boolean;
}

interface LeaderboardAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  unlockedAt?: Date;
}

interface GameModeStats {
  mode: string;
  icon: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  bestStreak: number;
}

// Chess-like rating tiers
const getRatingTier = (rating: number): { name: string; color: string; icon: React.ReactElement } => {
  if (rating >= 2400) return { name: 'Grandmaster', color: '#FFD700', icon: <DiamondIcon /> };
  if (rating >= 2200) return { name: 'Master', color: '#C0C0C0', icon: <ShieldIcon /> };
  if (rating >= 2000) return { name: 'Expert', color: '#CD7F32', icon: <StarIcon /> };
  if (rating >= 1800) return { name: 'Advanced', color: '#4A90E2', icon: <SkillIcon /> };
  if (rating >= 1600) return { name: 'Intermediate', color: '#7ED321', icon: <RankingIcon /> };
  if (rating >= 1400) return { name: 'Beginner+', color: '#BD10E0', icon: <GamesIcon /> };
  if (rating >= 1200) return { name: 'Novice', color: '#9013FE', icon: <SpeedIcon /> };
  return { name: 'Unrated', color: '#757575', icon: <TrophyIcon /> };
};

export const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const { level, achievements } = useExperience();

  const [activeTab, setActiveTab] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [userStats, setUserStats] = useState<LeaderboardPlayer | null>(null);
  const [friendChallengeDialog, setFriendChallengeDialog] = useState<{ open: boolean; friend?: LeaderboardPlayer }>({ open: false });
  const [gameModeStats, setGameModeStats] = useState<GameModeStats[]>([]);

  // Initialize leaderboard data (mock data for demo)
  useEffect(() => {
    const generateMockLeaderboard = (): LeaderboardPlayer[] => {
      const mockPlayers: LeaderboardPlayer[] = [
        {
          userId: '1',
          username: 'RhymeKing',
          avatar: '/avatars/1.jpg',
          rating: 2450,
          gamesPlayed: 1200,
          wins: 980,
          winRate: 81.7,
          streak: 15,
          averageTime: 95,
          lastPlayed: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          level: 45,
          rank: 1,
          tier: 'Grandmaster',
          achievements: [],
          isOnline: true,
          isFriend: false
        },
        {
          userId: '2',
          username: 'FlowMaster',
          avatar: '/avatars/2.jpg',
          rating: 2380,
          gamesPlayed: 890,
          wins: 720,
          winRate: 80.9,
          streak: 8,
          averageTime: 102,
          lastPlayed: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          level: 42,
          rank: 2,
          tier: 'Grandmaster',
          achievements: [],
          isOnline: false,
          isFriend: true
        },
        {
          userId: '3',
          username: 'WordWizard',
          avatar: '/avatars/3.jpg',
          rating: 2290,
          gamesPlayed: 765,
          wins: 610,
          winRate: 79.7,
          streak: 12,
          averageTime: 88,
          lastPlayed: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
          level: 38,
          rank: 3,
          tier: 'Master',
          achievements: [],
          isOnline: true,
          isFriend: false
        }
      ];

      // Add current user if logged in
      if (currentUser) {
        const service = FlowFinderService.getInstance();
        const playerELO = service.getPlayerStats(currentUser.uid);
        
        if (playerELO) {
          const userPlayer: LeaderboardPlayer = {
            userId: currentUser.uid,
            username: currentUser.displayName || 'You',
            avatar: currentUser.photoURL || '/avatars/default.jpg',
            rating: playerELO.rating,
            gamesPlayed: playerELO.gamesPlayed,
            wins: playerELO.wins,
            winRate: playerELO.gamesPlayed > 0 ? (playerELO.wins / playerELO.gamesPlayed) * 100 : 0,
            streak: playerELO.streak,
            averageTime: playerELO.averageTime,
            lastPlayed: playerELO.lastPlayed,
            level: level,
            rank: mockPlayers.length + 1,
            tier: getRatingTier(playerELO.rating).name,
                         achievements: [],
            isOnline: true,
            isFriend: false
          };
          mockPlayers.push(userPlayer);
          setUserStats(userPlayer);
        }
      }

      // Sort by rating
      return mockPlayers.sort((a, b) => b.rating - a.rating).map((player, index) => ({
        ...player,
        rank: index + 1
      }));
    };

    setLeaderboardData(generateMockLeaderboard());

    // Mock game mode stats
    setGameModeStats([
      { mode: 'rhyme_hunter', icon: '🎵', name: 'RhymeTime', rating: 1450, gamesPlayed: 145, winRate: 72.4, bestStreak: 8 },
      { mode: 'alliteration_alert', icon: '💥', name: 'AlliTime', rating: 1380, gamesPlayed: 89, winRate: 68.5, bestStreak: 5 },
      { mode: 'consonance_challenge', icon: '🌊', name: 'FlowTime', rating: 1290, gamesPlayed: 34, winRate: 64.7, bestStreak: 3 },
      { mode: 'cultural_crossover', icon: '🌍', name: 'CultureTime', rating: 1520, gamesPlayed: 67, winRate: 76.1, bestStreak: 12 }
    ]);
  }, [currentUser, level, achievements]);

  const sendFriendChallenge = (friend: LeaderboardPlayer) => {
    setFriendChallengeDialog({ open: true, friend });
  };

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Header with User Stats */}
      {userStats && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge
                    badgeContent={userStats.isOnline ? '🟢' : '⚪'}
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <Avatar
                      src={userStats.avatar}
                      sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.3)' }}
                    />
                  </Badge>
                  <Box>
                    <Typography variant="h5" color="white" fontWeight="bold">
                      {userStats.username}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        icon={getRatingTier(userStats.rating).icon}
                        label={getRatingTier(userStats.rating).name}
                        size="small"
                        sx={{ 
                          bgcolor: getRatingTier(userStats.rating).color,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" color="rgba(255,255,255,0.8)">
                        #{userStats.rank}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {userStats.rating}
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.8)">
                        Rating
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {userStats.winRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.8)">
                        Win Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="white" fontWeight="bold" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <FireIcon fontSize="small" />
                        {userStats.streak}
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.8)">
                        Streak
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {userStats.gamesPlayed}
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.8)">
                        Games
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<RankingIcon />} label="Global Rankings" />
          <Tab icon={<GamesIcon />} label="Game Modes" />
          <Tab icon={<FriendsIcon />} label="Friends" />
          <Tab icon={<TrophyIcon />} label="Achievements" />
        </Tabs>

        {/* Global Rankings */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Games</TableCell>
                  <TableCell align="center">Win Rate</TableCell>
                  <TableCell align="center">Streak</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboardData.slice(0, 20).map((player, index) => {
                  const tier = getRatingTier(player.rating);
                  const isCurrentUser = player.userId === currentUser?.uid;
                  
                  return (
                                         <TableRow
                       key={player.userId}
                       sx={{
                         backgroundColor: isCurrentUser ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                       }}
                     >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h6" fontWeight="bold">
                            #{player.rank}
                          </Typography>
                          {player.rank <= 3 && (
                            <TrophyIcon 
                              sx={{ 
                                color: player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : '#CD7F32' 
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Badge
                            badgeContent={player.isOnline ? '🟢' : '⚪'}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          >
                            <Avatar src={player.avatar} sx={{ width: 40, height: 40 }} />
                          </Badge>
                          <Box>
                            <Typography fontWeight="bold">
                              {player.username} {isCurrentUser && '(You)'}
                            </Typography>
                            <Chip
                              icon={tier.icon}
                              label={tier.name}
                              size="small"
                              sx={{ 
                                bgcolor: tier.color,
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 20
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {player.rating}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography>
                          {player.gamesPlayed}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box>
                          <Typography fontWeight="bold">
                            {player.winRate.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={player.winRate}
                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                            color={player.winRate >= 75 ? 'success' : player.winRate >= 60 ? 'primary' : 'warning'}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <FireIcon 
                            fontSize="small" 
                            sx={{ color: player.streak > 5 ? '#FF5722' : '#757575' }} 
                          />
                          <Typography fontWeight="bold">
                            {player.streak}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {!isCurrentUser && (
                            <>
                              <IconButton 
                                size="small" 
                                onClick={() => sendFriendChallenge(player)}
                                color="primary"
                              >
                                <ChallengeIcon />
                              </IconButton>
                              <IconButton size="small" color="secondary">
                                <ShareIcon />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                                         </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Game Mode Statistics */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {gameModeStats.map((mode, index) => (
              <Grid item xs={12} sm={6} md={3} key={mode.mode}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ mb: 1 }}>
                        {mode.icon}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {mode.name}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {mode.rating}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rating
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6" fontWeight="bold">
                            {mode.winRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Win Rate
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6" fontWeight="bold">
                            {mode.gamesPlayed}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Games
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            <FireIcon fontSize="small" />
                            {mode.bestStreak}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Best Streak
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Friends */}
        <TabPanel value={activeTab} index={2}>
          <Box textAlign="center" py={4}>
            <FriendsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Friends feature coming soon!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with friends, send challenges, and compete head-to-head
            </Typography>
          </Box>
        </TabPanel>

        {/* Achievements */}
        <TabPanel value={activeTab} index={3}>
          <Box textAlign="center" py={4}>
            <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Achievement showcase coming soon!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Display your badges, trophies, and milestones
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Friend Challenge Dialog */}
      <Dialog 
        open={friendChallengeDialog.open} 
        onClose={() => setFriendChallengeDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Challenge {friendChallengeDialog.friend?.username}
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Send a direct challenge to compete head-to-head in your favorite game mode!
          </Typography>
          {/* Challenge options would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFriendChallengeDialog({ open: false })}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<ChallengeIcon />}>
            Send Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 