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
  Paper,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useExperience } from '../../contexts/ExperienceContext';
import { useAuth } from '../../contexts/AuthContext';
import { audioService } from '../../services/audioService';
import { advancedFlowFinderService } from '../../services/advancedFlowFinderService';
import { 
  GameChallenge, 
  PatternGroup, 
  PatternElement,
  patternMatchers 
} from '../../types/flowFinder';

// Icons
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PsychologyIcon from '@mui/icons-material/Psychology';

// Dynamic font size and tile height based on word length for vertical stacking
const getDynamicTileSettings = (word: string, isMobile: boolean = false) => {
  const letterCount = word.length;
  const baseSize = isMobile ? 11 : 13;
  const baseTileHeight = isMobile ? 80 : 100;
  
  // Calculate optimal settings for vertical stacking
  let fontSize = baseSize;
  let tileHeight = baseTileHeight;
  let letterSpacing = '0.5px';
  
  if (letterCount <= 4) {
    fontSize = baseSize + 2;
    tileHeight = baseTileHeight;
    letterSpacing = '1px';
  } else if (letterCount <= 6) {
    fontSize = baseSize;
    tileHeight = baseTileHeight + 15;
    letterSpacing = '0.5px';
  } else if (letterCount <= 8) {
    fontSize = baseSize - 1;
    tileHeight = baseTileHeight + 30;
    letterSpacing = '0.25px';
  } else if (letterCount <= 10) {
    fontSize = baseSize - 2;
    tileHeight = baseTileHeight + 45;
    letterSpacing = '0px';
  } else {
    fontSize = baseSize - 3;
    tileHeight = baseTileHeight + 60;
    letterSpacing = '0px';
  }
  
  return {
    fontSize: `${fontSize}px`,
    tileHeight: `${tileHeight}px`,
    letterSpacing,
    lineHeight: isMobile ? '1.0' : '1.1'
  };
};

// Render word letters vertically stacked
const renderVerticalWord = (word: string, settings: any, isRevealed: boolean, isMatched: boolean) => {
  const letters = word.split('');
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 0.05
      }}
    >
      {letters.map((letter, index) => (
        <Typography
          key={index}
          component="span"
          sx={{
            fontSize: settings.fontSize,
            fontWeight: 'bold',
            lineHeight: settings.lineHeight,
            letterSpacing: settings.letterSpacing,
            color: isRevealed || isMatched ? 'white' : 'text.primary',
            textAlign: 'center',
            textTransform: 'uppercase',
            display: 'block',
            minHeight: settings.lineHeight
          }}
        >
          {letter}
        </Typography>
      ))}
    </Box>
  );
};

interface GameCard {
  id: string;
  elementId: string;
  element: PatternElement;
  isRevealed: boolean;
  isMatched: boolean;
  position: { row: number; col: number };
  groupId?: string;
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
  currentChallenge?: GameChallenge;
  patternGroups: Map<string, PatternGroup>;
  hintsRemaining: number;
}

interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'success' | 'combo' | 'perfect' | 'phonetic' | 'semantic';
  emoji: string;
}

const PARTICLE_EMOJIS = {
  success: ['✨', '💫', '⭐', '🌟'],
  combo: ['🔥', '💥', '⚡', '🚀'],
  perfect: ['🏆', '👑', '💎', '🎉'],
  phonetic: ['🎵', '🎶', '🎼', '🔊'],
  semantic: ['🎨', '🖼️', '🌈', '✍️']
};

const GROUP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const FlowFinderAdvanced: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { level, xp, addXp, addTokens, flowFinderChallenge, completeFlowFinderChallenge, isPremium } = useExperience();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Game state
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
    lastMatchTime: null,
    patternGroups: new Map(),
    hintsRemaining: 3
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Initialize audio on mount
  useEffect(() => {
    const initAudio = () => {
      audioService.resumeContext();
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => document.removeEventListener('click', initAudio);
  }, []);
  
  // Start new game
  const startGame = useCallback(async () => {
    try {
      setLoading(true);
      
      // Generate challenge based on user level
      const challenge = advancedFlowFinderService.generateChallenge(level, isPremium);
      
      // Create pattern groups map
      const patternGroups = new Map<string, PatternGroup>();
      challenge.patternGroups.forEach(group => {
        patternGroups.set(group.id, group);
      });
      
      // Create cards from board elements
      const cards: GameCard[] = [];
      const gridSize = challenge.settings.gridSize;
      const size = parseInt(gridSize.split('x')[0]);
      
      challenge.boardElements.forEach((element, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        
        // Find which group this element belongs to
        let groupId: string | undefined;
        challenge.patternGroups.forEach(group => {
          if (group.elements.some(el => el.id === element.id)) {
            groupId = group.id;
          }
        });
        
        cards.push({
          id: `card_${index}`,
          elementId: element.id,
          element: element,
          isRevealed: false,
          isMatched: false,
          position: { row, col },
          groupId
        });
      });
      
      setGameState({
        cards,
        revealedCards: [],
        completedGroups: new Set(),
        strikes: 0,
        maxStrikes: challenge.settings.maxStrikes,
        isGameOver: false,
        isWon: false,
        currentGroupInProgress: null,
        combo: 0,
        perfectStreak: 0,
        totalScore: 0,
        lastMatchTime: null,
        currentChallenge: challenge,
        patternGroups,
        hintsRemaining: challenge.settings.hintsAllowed
      });
      
      setTimeLeft(challenge.settings.timeLimit);
      setGameStartTime(new Date());
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setLoading(false);
    }
  }, [level, isPremium]);
  
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
  
  // Create particle effects
  const createParticles = useCallback((x: number, y: number, type: ParticleEffect['type'], count: number = 3) => {
    const newParticles: ParticleEffect[] = [];
    const emojis = PARTICLE_EMOJIS[type];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle_${Date.now()}_${i}`,
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 30,
        type,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);
  
  // Handle card click
  const handleCardClick = useCallback((card: GameCard, event: React.MouseEvent) => {
    if (gameState.isGameOver || card.isMatched || loading) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;
    
            audioService.playCardClick();
    
    // Toggle card reveal
    if (card.isRevealed) {
      setGameState(prev => ({
        ...prev,
        revealedCards: prev.revealedCards.filter(c => c.id !== card.id),
        cards: prev.cards.map(c => c.id === card.id ? { ...c, isRevealed: false } : c)
      }));
      return;
    }
    
    // Reveal card
    const newRevealedCards = [...gameState.revealedCards, card];
    const updatedCards = gameState.cards.map(c => 
      c.id === card.id ? { ...c, isRevealed: true } : c
    );
    
    setGameState(prev => ({
      ...prev,
      cards: updatedCards,
      revealedCards: newRevealedCards
    }));
    
    // Check for pattern match
    if (newRevealedCards.length >= 3) {
      checkForPatternMatch(newRevealedCards, updatedCards, clickX, clickY);
    }
  }, [gameState, loading]);
  
  // Check if revealed cards match a pattern
  const checkForPatternMatch = useCallback((revealedCards: GameCard[], allCards: GameCard[], x: number, y: number) => {
    const elements = revealedCards.map(card => card.element);
    let matchFound = false;
    let matchedGroup: PatternGroup | undefined;
    
    // Check each incomplete pattern group
    gameState.patternGroups.forEach((group, groupId) => {
      if (!matchFound && !gameState.completedGroups.has(groupId)) {
        const isMatch = advancedFlowFinderService.checkMatch(elements, group.pattern);
        
        if (isMatch && elements.length === group.elements.length) {
          matchFound = true;
          matchedGroup = group;
        }
      }
    });
    
    if (matchFound && matchedGroup) {
      handleSuccessfulMatch(revealedCards, matchedGroup, allCards, x, y);
    } else if (revealedCards.length >= 4) {
      handleFailedMatch(revealedCards, allCards);
    }
  }, [gameState]);
  
  // Handle successful pattern match
  const handleSuccessfulMatch = useCallback((matchedCards: GameCard[], group: PatternGroup, allCards: GameCard[], x: number, y: number) => {
              audioService.playGroupComplete();
    
    // Calculate score
    const baseScore = gameState.currentChallenge?.scoring.basePoints || 100;
    const complexityMultiplier = group.pattern.metadata.complexity.cognitiveLoad;
    const timeBonus = timeLeft / (gameState.currentChallenge?.settings.timeLimit || 180);
    const comboMultiplier = 1 + (gameState.combo * 0.1);
    
    const score = Math.floor(baseScore * complexityMultiplier * timeBonus * comboMultiplier);
    
    // Update cards
    const updatedCards = allCards.map(c => {
      if (matchedCards.some(mc => mc.id === c.id)) {
        return { ...c, isMatched: true };
      }
      return c;
    });
    
    // Create particles based on pattern type
    if (group.pattern.phonetic.endRhyme) {
      createParticles(x, y, 'phonetic', 2);
    }
    if (group.pattern.semantic.theme) {
      createParticles(x, y, 'semantic', 2);
    }
    
    // Update state
    setGameState(prev => ({
      ...prev,
      cards: updatedCards,
      revealedCards: [],
      completedGroups: new Set([...prev.completedGroups, group.id]),
      combo: prev.combo + 1,
      totalScore: prev.totalScore + score,
      lastMatchTime: Date.now(),
      currentGroupInProgress: null
    }));
    
    // Award XP
    addXp(10 * group.pattern.metadata.complexity.cognitiveLoad);
    
    // Check win condition
    if (gameState.completedGroups.size + 1 === gameState.patternGroups.size) {
      handleGameWin();
    }
  }, [gameState, timeLeft, createParticles, addXp]);
  
  // Handle failed match
  const handleFailedMatch = useCallback((revealedCards: GameCard[], allCards: GameCard[]) => {
            audioService.playCardMismatch();
    
    setTimeout(() => {
      const updatedCards = allCards.map(c => {
        if (revealedCards.some(rc => rc.id === c.id && !c.isMatched)) {
          return { ...c, isRevealed: false };
        }
        return c;
      });
      
      setGameState(prev => ({
        ...prev,
        cards: updatedCards,
        revealedCards: [],
        strikes: prev.strikes + 1,
        combo: 0,
        currentGroupInProgress: null
      }));
      
      if (gameState.strikes + 1 >= gameState.maxStrikes) {
        handleGameOver();
      }
    }, 1000);
  }, [gameState]);
  
  // Game win handler
  const handleGameWin = useCallback(() => {
    audioService.playGameWin();
    
    setGameState(prev => ({ ...prev, isGameOver: true, isWon: true }));
    
    const finalScore = gameState.totalScore + (timeLeft * 10);
    const xpGain = Math.floor(finalScore / 10);
    const tokensGain = Math.floor(finalScore / 100);
    
    addXp(xpGain);
    addTokens(tokensGain);
    
    if (completeFlowFinderChallenge) {
      const accuracy = (1 - gameState.strikes / gameState.maxStrikes) * 100;
      completeFlowFinderChallenge(true, accuracy);
    }
  }, [gameState, timeLeft, addXp, addTokens, completeFlowFinderChallenge]);
  
  // Game over handler
  const handleGameOver = useCallback(() => {
    audioService.playGameLoss();
    setGameState(prev => ({ ...prev, isGameOver: true, isWon: false }));
    
    if (completeFlowFinderChallenge) {
      completeFlowFinderChallenge(false, 0);
    }
  }, [completeFlowFinderChallenge]);
  
  // Use hint
  const useHint = useCallback(() => {
    if (gameState.hintsRemaining <= 0) return;
    
          audioService.playCardHover();
    
    // Find incomplete group with lowest attempts
    let targetGroup: PatternGroup | undefined;
    let lowestAttempts = Infinity;
    
    gameState.patternGroups.forEach(group => {
      if (!gameState.completedGroups.has(group.id) && group.attempts < lowestAttempts) {
        targetGroup = group;
        lowestAttempts = group.attempts;
      }
    });
    
    if (targetGroup) {
      // Reveal one card from the group
      const groupCard = gameState.cards.find(card => 
        card.groupId === targetGroup!.id && !card.isRevealed && !card.isMatched
      );
      
      if (groupCard) {
        const updatedCards = gameState.cards.map(c => 
          c.id === groupCard.id ? { ...c, isRevealed: true } : c
        );
        
        setGameState(prev => ({
          ...prev,
          cards: updatedCards,
          hintsRemaining: prev.hintsRemaining - 1,
          revealedCards: [...prev.revealedCards, groupCard]
        }));
        
        // Update hints used for the group
        targetGroup.hintsUsed++;
      }
    }
  }, [gameState]);
  
  // Render game board
  const renderGameBoard = () => {
    if (!gameState.currentChallenge) return null;
    
    const gridSize = gameState.currentChallenge.settings.gridSize;
    const size = parseInt(gridSize.split('x')[0]);
    
    return (
      <Grid container spacing={1} sx={{ maxWidth: size * 120, margin: '0 auto' }}>
        {gameState.cards.map((card) => {
          const settings = getDynamicTileSettings(card.element.text, isMobile);
          return (
            <Grid item xs={12 / size} key={card.id}>
              <motion.div
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
              >
                <Card
                  onClick={(e) => handleCardClick(card, e)}
                  sx={{
                    height: settings.tileHeight,
                    cursor: card.isMatched ? 'default' : 'pointer',
                    backgroundColor: card.isMatched
                      ? GROUP_COLORS[(parseInt(card.groupId?.split('_')[1] || '0')) % GROUP_COLORS.length]
                      : card.isRevealed
                      ? theme.palette.primary.light
                      : theme.palette.background.paper,
                    opacity: card.isMatched ? 0.8 : 1,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    border: card.isRevealed ? `2px solid ${theme.palette.primary.main}` : undefined
                  }}
                >
                  <CardContent sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 1
                  }}>
                    {card.isRevealed || card.isMatched ? (
                      renderVerticalWord(card.element.text, settings, card.isRevealed, card.isMatched)
                    ) : (
                      <Typography variant="h4" color="text.disabled">
                        ?
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    );
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', p: 2 }}>
      {/* Particle Effects */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 1 }}
            animate={{ 
              x: particle.x + (Math.random() - 0.5) * 100,
              y: particle.y - 100,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{
              position: 'fixed',
              fontSize: '28px',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Game Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            {/* Timer and Score */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<TimerIcon />}
                label={formatTime(timeLeft)}
                color={timeLeft < 30 ? "error" : "default"}
                variant="outlined"
              />
              <Chip
                icon={<StarIcon />}
                label={`Score: ${gameState.totalScore}`}
                color="primary"
                variant="outlined"
              />
              {gameState.combo > 1 && (
                <Chip
                  icon={<WhatshotIcon />}
                  label={`${gameState.combo}x Combo`}
                  color="secondary"
                  variant="filled"
                />
              )}
            </Stack>
            
            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={useHint}
                disabled={gameState.hintsRemaining <= 0}
                startIcon={<LightbulbIcon />}
              >
                Hint ({gameState.hintsRemaining})
              </Button>
              <IconButton onClick={() => setShowHelp(true)} size="small">
                <HelpOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>
          
          {/* Progress */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={(gameState.completedGroups.size / gameState.patternGroups.size) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          {/* Pattern Groups */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
            {Array.from(gameState.patternGroups.values()).map((group, index) => (
              <Tooltip 
                key={group.id} 
                title={group.description}
                arrow
              >
                <Chip
                  label={group.name}
                  size="small"
                  color={gameState.completedGroups.has(group.id) ? "success" : "default"}
                  variant={gameState.completedGroups.has(group.id) ? "filled" : "outlined"}
                  icon={gameState.completedGroups.has(group.id) ? <CheckCircleIcon /> : 
                        group.pattern.phonetic.endRhyme ? <VolumeUpIcon /> : <PsychologyIcon />}
                  sx={{ 
                    mb: 1,
                    borderColor: gameState.completedGroups.has(group.id) ? 
                      undefined : GROUP_COLORS[index % GROUP_COLORS.length],
                    borderWidth: 2
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
          
          {/* Strikes */}
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {Array.from({ length: gameState.maxStrikes }).map((_, i) => (
              <ErrorIcon 
                key={i} 
                color={i < gameState.strikes ? "error" : "disabled"}
                fontSize="small"
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
      
      {/* Game Board or Start Screen */}
      {gameState.currentChallenge ? (
        renderGameBoard()
      ) : (
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Advanced Pattern Matching
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Test your skills with phonetic patterns and semantic themes!
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={startGame}
            disabled={loading}
            startIcon={<EmojiEventsIcon />}
          >
            {loading ? 'Loading...' : 'Start New Game'}
          </Button>
        </Card>
      )}
      
      {/* Game Over Dialog */}
      <Dialog open={gameState.isGameOver} maxWidth="sm" fullWidth>
        <DialogTitle>
          {gameState.isWon ? '🎉 Victory!' : '😔 Game Over'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              Final Score: {gameState.totalScore}
            </Typography>
            {gameState.isWon && (
              <>
                <Typography>
                  Time Bonus: +{timeLeft * 10} points
                </Typography>
                <Typography>
                  Accuracy: {Math.round((1 - gameState.strikes / gameState.maxStrikes) * 100)}%
                </Typography>
              </>
            )}
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Patterns Found: {gameState.completedGroups.size} / {gameState.patternGroups.size}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.reload()}>
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>How to Play</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              <strong>Goal:</strong> Find groups of words that share the same pattern.
            </Typography>
            <Typography variant="body2">
              <strong>Patterns can be:</strong>
            </Typography>
            <ul>
              <li>Phonetic: Rhymes, alliteration, syllable count</li>
              <li>Semantic: Themes, mood, register, imagery</li>
              <li>Combined: Both sound and meaning patterns</li>
            </ul>
            <Typography variant="body2">
              <strong>Tips:</strong>
            </Typography>
            <ul>
              <li>Click cards to reveal them</li>
              <li>Find all words in a pattern group to score</li>
              <li>Use hints when stuck</li>
              <li>Higher level patterns have multiple dimensions</li>
            </ul>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Got it!</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 