import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  useMediaQuery,
  Fade,
  Zoom,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Paper
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useExperience } from '../../contexts/ExperienceContext';
import { useAuth } from '../../contexts/AuthContext';
import FlowFinderService, { DynamicChallenge, RhymeGroup } from '../../services/flowFinderService';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StarIcon from '@mui/icons-material/Star';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBack from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CelebrationIcon from '@mui/icons-material/Celebration';

interface GameCard {
  id: string;
  word: string;
  groupId: string;
  isRevealed: boolean;
  isMatched: boolean;
  position: { row: number; col: number };
}

interface GameState {
  cards: GameCard[];
  revealedCards: GameCard[];
  completedGroups: Set<string>;
  strikes: number;
  maxStrikes: number;
  isGameOver: boolean;
  isWon: boolean;
  currentGroupInProgress: string | null;
  combo: number;
  perfectStreak: number;
  totalScore: number;
  lastMatchTime: number | null;
}

interface GameMode {
  id: string;
  patternType: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
}

interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'success' | 'combo' | 'perfect';
  emoji: string;
}

// Cultural themes for CultureTime mode
const CULTURAL_THEMES = {
  hiphop: { name: 'Hip-Hop Flow', icon: '🎤', description: 'Master the art of rap wordplay' },
  classical: { name: 'Classical Poetry', icon: '📜', description: 'Explore timeless poetic forms' },
  japanese: { name: 'Haiku Harmony', icon: '🌸', description: 'Discover Japanese aesthetic principles' },
  spanish: { name: 'Romance Rhythm', icon: '💃', description: 'Experience Spanish lyrical beauty' },
  arabic: { name: 'Arabic Elegance', icon: '🕌', description: 'Honor classical Arabic traditions' }
};

const RHYME_GROUP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#FFB74D', '#81C784', '#F48FB1', '#A1C4FD'
];

// Enhanced game visual effects
const PARTICLE_EMOJIS = {
  success: ['✨', '💫', '⭐', '🌟'],
  combo: ['🔥', '💥', '⚡', '🚀'],
  perfect: ['🏆', '👑', '💎', '🎉']
};

// Dynamic font size based on word length (like NYT Connections)
const getDynamicFontSize = (word: string, isMobile: boolean = false) => {
  const baseSize = isMobile ? 14 : 16;
  const longWordThreshold = 8;
  const veryLongWordThreshold = 12;
  
  if (word.length >= veryLongWordThreshold) {
    return `${baseSize - 4}px`;
  } else if (word.length >= longWordThreshold) {
    return `${baseSize - 2}px`;
  }
  return `${baseSize}px`;
};

// Calculate score based on performance
const calculateScore = (groupDifficulty: number, timeBonus: number, combo: number, perfect: boolean): number => {
  const baseScore = groupDifficulty * 100;
  const comboMultiplier = 1 + (combo * 0.1);
  const perfectBonus = perfect ? 1.5 : 1;
  const timeBonusPoints = Math.floor(timeBonus * 50);
  
  return Math.floor((baseScore + timeBonusPoints) * comboMultiplier * perfectBonus);
};

export const FlowFinder: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { level, xp, addXp, addTokens, flowFinderChallenge, completeFlowFinderChallenge, isPremium } = useExperience();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Game mode selection states
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedCulturalTheme, setSelectedCulturalTheme] = useState<string>('hiphop');
  const [availableModes, setAvailableModes] = useState<GameMode[]>([]);
  
  // Enhanced game states
  const [challenge, setChallenge] = useState<DynamicChallenge | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    revealedCards: [],
    completedGroups: new Set(),
    strikes: 0,
    maxStrikes: 3,
    isGameOver: false,
    isWon: false,
    currentGroupInProgress: null,
    combo: 0,
    perfectStreak: 0,
    totalScore: 0,
    lastMatchTime: null
  });
  
  // UI enhancement states
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showELOUpdate, setShowELOUpdate] = useState<{show: boolean, change: number}>({show: false, change: 0});
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [showComboPopup, setShowComboPopup] = useState<{ show: boolean; combo: number; score: number }>({ show: false, combo: 0, score: 0 });
  const [cardShakeIds, setCardShakeIds] = useState<Set<string>>(new Set());

  // Particle effect system
  const createParticles = useCallback((x: number, y: number, type: ParticleEffect['type'], count: number = 3) => {
    const newParticles: ParticleEffect[] = [];
    const emojis = PARTICLE_EMOJIS[type];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle_${Date.now()}_${i}`,
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 50,
        type,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Auto-remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  // Enhanced haptic feedback simulation
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    // In a real app, this would use navigator.vibrate() or Haptics API
    // For now, we'll add visual feedback to simulate haptic response
    if (type === 'heavy') {
      // Create a subtle screen flash for major events
      document.body.style.transition = 'filter 0.1s ease';
      document.body.style.filter = 'brightness(1.1)';
      setTimeout(() => {
        document.body.style.filter = 'brightness(1)';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 100);
      }, 50);
    }
  }, []);

  // Initialize available game modes
  useEffect(() => {
    const service = FlowFinderService.getInstance();
    const modes = service.getAvailableGameModes(level);
    setAvailableModes(modes);
  }, [level]);

  // Start game with selected mode
  const startGame = (modeId: string, culturalTheme?: string) => {
    const userId = currentUser?.uid || 'anonymous';
    const service = FlowFinderService.getInstance();
    
    let dynamicChallenge: DynamicChallenge;
    
    if (modeId === 'cultural_crossover' && culturalTheme) {
      dynamicChallenge = service.generateCulturalChallenge(userId, level, modeId, culturalTheme, isPremium);
    } else {
      dynamicChallenge = service.generateCulturalChallenge(userId, level, modeId, undefined, isPremium);
    }
    
    setChallenge(dynamicChallenge);
    setSelectedMode(modeId);
    setShowModeSelection(false);
    
    // Create cards from pattern groups
    const cards: GameCard[] = [];
    const size = dynamicChallenge.gridSize === '4x4' ? 4 : 8;
    let cardIndex = 0;
    
    dynamicChallenge.rhymeGroups.forEach((group, groupIndex) => {
      group.words.forEach((word) => {
        const row = Math.floor(cardIndex / size);
        const col = cardIndex % size;
        
        cards.push({
          id: `card_${cardIndex}`,
          word,
          groupId: group.id,
          isRevealed: false,
          isMatched: false,
          position: { row, col }
        });
        cardIndex++;
      });
    });
    
    // Shuffle cards
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    
    setGameState({
      cards: shuffledCards,
      revealedCards: [],
      completedGroups: new Set(),
      strikes: 0,
      maxStrikes: dynamicChallenge.maxStrikes,
      isGameOver: false,
      isWon: false,
      currentGroupInProgress: null,
      combo: 0,
      perfectStreak: 0,
      totalScore: 0,
      lastMatchTime: null
    });
    
    setTimeLeft(dynamicChallenge.timeLimit);
    setGameStartTime(new Date());
  };

  // Return to mode selection
  const returnToModeSelection = () => {
    setShowModeSelection(true);
    setChallenge(null);
    setSelectedMode(null);
  };

  // Timer effect
  useEffect(() => {
    if (gameState.isGameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState(prevState => ({ ...prevState, isGameOver: true, isWon: false }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isGameOver, timeLeft]);

  // Enhanced card click handler with combo system and effects
  const handleCardClick = useCallback((card: GameCard) => {
    if (gameState.isGameOver || card.isMatched) return;

    // Haptic feedback for card selection
    triggerHaptic('light');

    const newRevealedCards = [...gameState.revealedCards];
    
    // If card is already revealed, remove it (deselect)
    const alreadyRevealedIndex = newRevealedCards.findIndex(c => c.id === card.id);
    if (alreadyRevealedIndex !== -1) {
      newRevealedCards.splice(alreadyRevealedIndex, 1);
      setGameState(prev => ({ ...prev, revealedCards: newRevealedCards }));
      return;
    }

    // Add card to revealed cards
    newRevealedCards.push(card);

    // Check if we have a complete group
    if (newRevealedCards.length > 0) {
      const firstGroupId = newRevealedCards[0].groupId;
      const allSameGroup = newRevealedCards.every(c => c.groupId === firstGroupId);
      
      if (allSameGroup && challenge) {
        const rhymeGroup = challenge.rhymeGroups.find(g => g.id === firstGroupId);
        
        if (rhymeGroup && newRevealedCards.length === rhymeGroup.groupSize) {
          // Complete group found! Enhanced success handling
          const currentTime = Date.now();
          const timeSinceLastMatch = gameState.lastMatchTime ? (currentTime - gameState.lastMatchTime) / 1000 : Infinity;
          
          // Calculate performance metrics
          const isQuickMatch = timeSinceLastMatch < 5; // Quick succession bonus
          const isPerfectStreak = gameState.strikes === 0;
          const newCombo = isQuickMatch ? gameState.combo + 1 : 1;
          const perfectStreak = isPerfectStreak ? gameState.perfectStreak + 1 : 0;
          
          // Calculate score
          const timeBonus = Math.max(0, (120 - (Date.now() - gameStartTime.getTime()) / 1000) / 120);
          const score = calculateScore(rhymeGroup.difficulty || 1, timeBonus, newCombo, isPerfectStreak);
          
          // Enhanced haptic feedback for success
          triggerHaptic(newCombo > 3 ? 'heavy' : 'medium');
          
          // Create particles at card positions
          newRevealedCards.forEach((_, index) => {
            setTimeout(() => {
              const particleType = newCombo > 5 ? 'perfect' : newCombo > 2 ? 'combo' : 'success';
              createParticles(
                300 + (index * 80), // Approximate card positions
                400,
                particleType,
                newCombo > 3 ? 5 : 3
              );
            }, index * 100);
          });
          
          // Show combo popup for impressive achievements
          if (newCombo > 2) {
            setShowComboPopup({ show: true, combo: newCombo, score });
            setTimeout(() => setShowComboPopup({ show: false, combo: 0, score: 0 }), 2000);
          }
          
          // Update game state with enhanced metrics
          const updatedCards = gameState.cards.map(c => 
            newRevealedCards.some(rc => rc.id === c.id) 
              ? { ...c, isMatched: true, isRevealed: true }
              : c
          );
          
          setGameState(prev => ({
            ...prev,
            cards: updatedCards,
            revealedCards: [],
            completedGroups: new Set([...prev.completedGroups, firstGroupId]),
            currentGroupInProgress: null,
            combo: newCombo,
            perfectStreak: perfectStreak,
            totalScore: prev.totalScore + score,
            lastMatchTime: currentTime
          }));
          
          return;
        }
      }
      
      // Check for mistakes (mixed groups or wrong group size)
      if (newRevealedCards.length >= 2) {
        const groupIds = [...new Set(newRevealedCards.map(c => c.groupId))];
        
        if (groupIds.length > 1 || (challenge && newRevealedCards.length > Math.max(...challenge.rhymeGroups.map(g => g.groupSize)))) {
          // Mixed groups or too many cards - strike!
          
          // Enhanced error feedback
          triggerHaptic('heavy');
          
          // Shake animation for incorrect cards
          const wrongCardIds = new Set(newRevealedCards.map(c => c.id));
          setCardShakeIds(wrongCardIds);
          setTimeout(() => setCardShakeIds(new Set()), 600);
          
          setGameState(prev => {
            const newStrikes = prev.strikes + 1;
            const isGameOver = newStrikes >= prev.maxStrikes;
            
            return {
              ...prev,
              revealedCards: [],
              strikes: newStrikes,
              isGameOver,
              isWon: false,
              currentGroupInProgress: null,
              combo: 0, // Reset combo on mistake
              perfectStreak: 0 // Reset perfect streak
            };
          });
          
          return;
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      revealedCards: newRevealedCards,
      currentGroupInProgress: newRevealedCards.length > 0 ? newRevealedCards[0].groupId : null
    }));
  }, [gameState, challenge, triggerHaptic, createParticles, gameStartTime]);

  // Enhanced game completion with celebrations
  useEffect(() => {
    if (challenge && gameState.completedGroups.size === challenge.rhymeGroups.length && !gameState.isGameOver) {
      // Game won! Big celebration
      triggerHaptic('heavy');
      
      // Victory particles
      setTimeout(() => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            createParticles(
              Math.random() * window.innerWidth,
              Math.random() * 200 + 100,
              'perfect',
              1
            );
          }, i * 100);
        }
      }, 300);
      
      setGameState(prev => ({ ...prev, isGameOver: true, isWon: true }));
      
      // Calculate final rewards
      const timeBonus = Math.max(0, (120 - (Date.now() - gameStartTime.getTime()) / 1000) / 120);
      const finalScore = gameState.totalScore + (timeBonus * 500);
      const xpGain = Math.floor(finalScore / 10);
      const tokensGain = Math.floor(finalScore / 100);
      
      // Award experience and tokens
      addXp(xpGain);
      addTokens(tokensGain);
      
      if (completeFlowFinderChallenge) {
        const accuracy = Math.max(0, 1 - (gameState.strikes / gameState.maxStrikes)) * 100;
        completeFlowFinderChallenge(true, accuracy);
      }
    }
  }, [gameState.completedGroups.size, challenge, gameState.isGameOver, gameState.totalScore, gameStartTime, addXp, addTokens, completeFlowFinderChallenge, triggerHaptic, createParticles]);

  // Show ELO update animation
  useEffect(() => {
    if (showELOUpdate.show) {
      const timer = setTimeout(() => {
        setShowELOUpdate({ show: false, change: 0 });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showELOUpdate.show]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardBackgroundColor = (card: GameCard) => {
    if (card.isMatched) {
      const groupIndex = challenge?.rhymeGroups.findIndex(g => g.id === card.groupId) || 0;
      return RHYME_GROUP_COLORS[groupIndex % RHYME_GROUP_COLORS.length];
    }
    if (gameState.revealedCards.some(c => c.id === card.id)) {
      return theme.palette.primary.main;
    }
    return theme.palette.background.paper;
  };

  const progress = challenge ? (gameState.completedGroups.size / challenge.rhymeGroups.length) * 100 : 0;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Particle Effects Overlay */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 1 }}
            animate={{ 
              x: particle.x + (Math.random() - 0.5) * 200,
              y: particle.y - 150,
              scale: [0, 1.2, 0.8],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{
              position: 'fixed',
              fontSize: '24px',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Combo Popup */}
      <AnimatePresence>
        {showComboPopup.show && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1001,
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                color: 'white',
                borderRadius: 3,
                textAlign: 'center',
                border: '2px solid #FFD700'
              }}
            >
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {showComboPopup.combo}x COMBO! 🔥
              </Typography>
              <Typography variant="h6">
                +{showComboPopup.score} points
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show game mode selection screen */}
      {showModeSelection ? (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom align="center">
                🎮 RhymeTime Games
              </Typography>
              <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
                {t('flowFinder.selectMode', 'Choose Your Word Pattern Challenge')}
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {availableModes.map((mode) => {
              const isLocked = level < mode.unlockLevel;
              return (
                <Grid item xs={12} sm={6} md={3} key={mode.id}>
                  <motion.div
                    whileHover={!isLocked ? { scale: 1.02, y: -5 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.6 : 1,
                        position: 'relative',
                        background: isLocked ? 
                          'linear-gradient(135deg, #f5f5f5, #e0e0e0)' :
                          `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                        border: !isLocked ? `2px solid ${theme.palette.primary.main}20` : '2px solid transparent',
                        '&:hover': {
                          boxShadow: isLocked ? 'none' : theme.shadows[8],
                          borderColor: !isLocked ? theme.palette.primary.main : 'transparent'
                        }
                      }}
                      onClick={() => !isLocked && (mode.id === 'cultural_crossover' ? null : startGame(mode.id))}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        {isLocked && (
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <LockIcon color="disabled" />
                          </Box>
                        )}
                        
                        <Typography variant="h2" sx={{ mb: 1, filter: isLocked ? 'grayscale(1)' : 'none' }}>
                          {mode.icon}
                        </Typography>
                        
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {mode.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {mode.description}
                        </Typography>
                        
                        {isLocked ? (
                          <Chip 
                            icon={<LockIcon />}
                            label={`Unlock at Level ${mode.unlockLevel}`}
                            size="small"
                            color="default"
                            sx={{ mb: 1 }}
                          />
                        ) : mode.id === 'cultural_crossover' ? (
                          <Box>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                              <InputLabel>Cultural Theme</InputLabel>
                              <Select
                                value={selectedCulturalTheme}
                                onChange={(e) => setSelectedCulturalTheme(e.target.value)}
                                label="Cultural Theme"
                              >
                                {Object.entries(CULTURAL_THEMES).map(([key, theme]) => (
                                  <MenuItem key={key} value={key}>
                                    {theme.icon} {theme.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Button
                              variant="contained"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => startGame(mode.id, selectedCulturalTheme)}
                              fullWidth
                              size="large"
                              sx={{ fontWeight: 'bold' }}
                            >
                              Start Game
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => startGame(mode.id)}
                            fullWidth
                            size="large"
                            sx={{ fontWeight: 'bold' }}
                          >
                            Start Game
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          {/* Enhanced Player Progress */}
          <Card sx={{ mt: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📊 Your Progress
                </Typography>
                <Badge badgeContent={level} color="primary">
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    🎯
                  </Avatar>
                </Badge>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Level {level} Player
                </Typography>
                <Typography color="text.secondary">
                  {availableModes.length} of 4 modes unlocked
                </Typography>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={(availableModes.length / 4) * 100} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 2,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  }
                }}
              />
              
              <Typography variant="body2" color="text.secondary" align="center">
                🎯 Level up through gameplay to unlock new pattern challenges!
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ) : !challenge ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('flowFinder.title', 'Flow Finder')}
            </Typography>
            <Typography color="text.secondary">
              {t('flowFinder.noChallenge', 'No challenge available. Check back later!')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        // Enhanced Game Interface
        <Box>
          {/* Game Header with Enhanced Info */}
          <Card sx={{ 
            mb: 2, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}05)`,
            border: `1px solid ${theme.palette.primary.main}20`
          }}>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton 
                    onClick={returnToModeSelection} 
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.background.paper,
                      '&:hover': { bgcolor: theme.palette.grey[100] }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Typography variant={isMobile ? "h6" : "h5"} component="h2" sx={{ fontWeight: 'bold' }}>
                    {availableModes.find(m => m.id === selectedMode)?.name || 'Flow Finder'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Tooltip title={t('flowFinder.help', 'How to play')}>
                    <IconButton onClick={() => setShowHelp(true)} size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Chip
                    icon={<TimerIcon />}
                    label={formatTime(timeLeft)}
                    color={timeLeft < 30 ? 'error' : timeLeft < 60 ? 'warning' : 'primary'}
                    variant="outlined"
                    sx={{ fontWeight: 'bold', minWidth: '70px' }}
                  />
                </Box>
              </Box>

              {/* Enhanced Progress Display */}
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Progress: {gameState.completedGroups.size}/{challenge.rhymeGroups.length} Groups
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Strikes: {gameState.strikes}/{gameState.maxStrikes}
                    </Typography>
                    {Array.from({ length: gameState.maxStrikes }).map((_, i) => (
                      <ErrorIcon 
                        key={i} 
                        fontSize="small" 
                        color={i < gameState.strikes ? 'error' : 'disabled'} 
                        sx={{ 
                          animation: i === gameState.strikes - 1 && gameState.strikes > 0 ? 
                            'shake 0.5s ease-in-out' : 'none',
                          '@keyframes shake': {
                            '0%, 100%': { transform: 'translateX(0)' },
                            '25%': { transform: 'translateX(-3px)' },
                            '75%': { transform: 'translateX(3px)' }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                />
              </Box>

              {/* Game Stats Row */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ p: 1, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Score</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                      {gameState.totalScore.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ p: 1, bgcolor: theme.palette.secondary.main + '10', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Combo</Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <WhatshotIcon color={gameState.combo > 2 ? 'secondary' : 'disabled'} fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                        {gameState.combo}x
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ p: 1, bgcolor: theme.palette.warning.main + '10', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Perfect</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                      {gameState.perfectStreak}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Pattern Groups Display */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {challenge.text}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                    Find groups:
                  </Typography>
                  {challenge.rhymeGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      animate={gameState.completedGroups.has(group.id) ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Chip
                        label={`${group.pattern} (${group.groupSize})`}
                        size="small"
                        color={gameState.completedGroups.has(group.id) ? 'success' : 'default'}
                        icon={gameState.completedGroups.has(group.id) ? <CheckCircleIcon /> : undefined}
                        sx={{
                          backgroundColor: gameState.completedGroups.has(group.id) 
                            ? RHYME_GROUP_COLORS[index % RHYME_GROUP_COLORS.length] 
                            : undefined,
                          color: gameState.completedGroups.has(group.id) ? 'white' : undefined,
                          fontWeight: 'bold',
                          border: gameState.completedGroups.has(group.id) ? '2px solid #FFD700' : 'none'
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Enhanced Game Grid */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Grid container spacing={1.5} sx={{ maxWidth: isMobile ? 350 : 500 }}>
              {gameState.cards.map((card) => {
                const isRevealed = gameState.revealedCards.some(c => c.id === card.id);
                const backgroundColor = getCardBackgroundColor(card);
                const fontSize = getDynamicFontSize(card.word, isMobile);
                const isShaking = cardShakeIds.has(card.id);
                
                return (
                  <Grid 
                    item 
                    xs={12 / (challenge.gridSize === '4x4' ? 4 : 8)} 
                    key={card.id}
                  >
                    <motion.div
                      whileHover={card.isMatched ? {} : { scale: 1.05, y: -3 }}
                      whileTap={card.isMatched ? {} : { scale: 0.95 }}
                      animate={card.isMatched ? 
                        { scale: [1, 1.15, 1], rotateY: [0, 10, 0] } : 
                        isShaking ? { x: [-3, 3, -3, 3, 0] } : {}
                      }
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                        duration: isShaking ? 0.6 : 0.3
                      }}
                    >
                      <Card
                        onClick={() => handleCardClick(card)}
                        sx={{
                          minHeight: isMobile ? 70 : 85,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: card.isMatched ? 'default' : 'pointer',
                          backgroundColor,
                          border: isRevealed && !card.isMatched ? 
                            `3px solid ${theme.palette.primary.main}` : 
                            card.isMatched ? `3px solid #FFD700` : 
                            `2px solid ${theme.palette.divider}`,
                          borderRadius: 3,
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: card.isMatched ? 
                            `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}dd)` :
                            isRevealed ? 
                            `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` :
                            `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
                          boxShadow: card.isMatched ? 
                            `0 8px 16px ${backgroundColor}40, 0 0 20px ${backgroundColor}30` :
                            isRevealed ? 
                            `0 4px 12px ${theme.palette.primary.main}40` :
                            theme.shadows[2],
                          '&:hover': {
                            boxShadow: card.isMatched ? 
                              `0 8px 16px ${backgroundColor}40, 0 0 20px ${backgroundColor}30` :
                              theme.shadows[8],
                            borderColor: card.isMatched ? '#FFD700' : theme.palette.primary.main
                          }
                        }}
                      >
                        {/* Success glow effect */}
                        {card.isMatched && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,255,255,0.1))',
                              pointerEvents: 'none'
                            }}
                          />
                        )}
                        
                        <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
                          <Typography 
                            variant="body1"
                            sx={{ 
                              fontSize,
                              fontWeight: 'bold',
                              color: card.isMatched || isRevealed ? 'white' : theme.palette.text.primary,
                              textTransform: 'uppercase',
                              lineHeight: 1.2,
                              letterSpacing: '0.5px',
                              textShadow: card.isMatched || isRevealed ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {card.word}
                          </Typography>
                        </CardContent>
                        
                        {/* Match celebration icon */}
                        <AnimatePresence>
                          {card.isMatched && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                fontSize: '16px'
                              }}
                            >
                              ✨
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Game Controls */}
          <Box display="flex" justifyContent="center" gap={2} mb={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={returnToModeSelection}
              sx={{ minWidth: '120px' }}
            >
              New Game
            </Button>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setShowHelp(true)}
              sx={{ minWidth: '120px' }}
            >
              Help
            </Button>
          </Box>

          {/* Game Over Modal */}
          <Dialog 
            open={gameState.isGameOver} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: gameState.isWon ? 
                  `linear-gradient(135deg, ${theme.palette.success.main}10, ${theme.palette.primary.main}05)` :
                  `linear-gradient(135deg, ${theme.palette.error.main}10, ${theme.palette.grey[100]})`
              }
            }}
          >
            <DialogContent sx={{ textAlign: 'center', p: 4 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Typography variant="h3" sx={{ mb: 2 }}>
                  {gameState.isWon ? '🎉' : '😔'}
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {gameState.isWon ? 'Congratulations!' : 'Game Over'}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  {gameState.isWon ? 
                    'You successfully found all pattern groups!' : 
                    'Better luck next time!'}
                </Typography>
              </motion.div>
              
              {gameState.isWon && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: theme.palette.primary.main + '10', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Final Score</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {gameState.totalScore.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: theme.palette.success.main + '10', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Max Combo</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                        {gameState.combo}x
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
              
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => startGame(selectedMode!, selectedCulturalTheme)}
                  size="large"
                  sx={{ minWidth: '140px', fontWeight: 'bold' }}
                >
                  Play Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={returnToModeSelection}
                  size="large"
                  sx={{ minWidth: '140px' }}
                >
                  New Mode
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* Enhanced Help Dialog */}
          <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              🎮 How to Play RhymeTime Games
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎯 <strong>Objective</strong>
                    </Typography>
                    <Typography paragraph>
                      Find groups of words that follow the same pattern (rhymes, alliteration, etc.). Each group has a specific size - match exactly that many words!
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎮 <strong>How to Play</strong>
                    </Typography>
                    <Typography paragraph>
                      • Click cards to select words
                      <br />• Complete one group at a time
                      <br />• Avoid mixing different patterns
                      <br />• Use the pattern hints as your guide
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔥 <strong>Scoring System</strong>
                    </Typography>
                    <Typography paragraph>
                      • Build combos for higher scores
                      <br />• Maintain perfect streaks for bonuses
                      <br />• Complete quickly for time bonuses
                      <br />• Zero mistakes = maximum points
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⚠️ <strong>Strikes & Strategy</strong>
                    </Typography>
                    <Typography paragraph>
                      • 3 strikes maximum per game
                      <br />• Mixed patterns = 1 strike
                      <br />• Study group sizes carefully
                      <br />• Think before you click!
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: theme.palette.info.main + '10', 
                borderRadius: 2,
                border: `1px solid ${theme.palette.info.main}30`
              }}>
                <Typography variant="body2" align="center" sx={{ fontWeight: 'bold' }}>
                  💡 <strong>Pro Tip:</strong> Master the patterns to unlock higher-level modes and compete on the global leaderboard!
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={() => setShowHelp(false)} 
                variant="contained" 
                size="large"
                sx={{ minWidth: '120px', fontWeight: 'bold' }}
              >
                Got It!
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};

export default FlowFinder; 