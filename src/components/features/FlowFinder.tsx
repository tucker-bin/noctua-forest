import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha,
  DialogContentText,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Timer as TimerIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// CSS animations for enhanced visual effects
const animationStyles = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    50% { transform: translateX(3px); }
    75% { transform: translateX(-3px); }
    100% { transform: translateX(0); }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
  }

  @keyframes explode {
    0% {
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.3) rotate(180deg);
      opacity: 0.8;
    }
    100% {
      transform: translate(-50%, -50%) scale(1) rotate(360deg);
      opacity: 1;
    }
  }
`;

// Add these types at the top after the imports
interface DifficultyConfig {
  gridSize: number; // 4x4, 8x8
  minGroupSize: number;
  maxGroupSize: number;
}

const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  '4x4': {
    gridSize: 4, // 16 cards
    minGroupSize: 3,
    maxGroupSize: 5
  },
  '8x8': {
    gridSize: 8, // 64 cards
    minGroupSize: 2,
    maxGroupSize: 4
  }
};

// Example rhyme groups with explanations
const RHYME_PATTERNS = [
  { ending: 'at', explanation: 'Words ending in -AT', examples: ['cat', 'sat', 'hat', 'mat', 'bat', 'rat'] },
  { ending: 'ight', explanation: 'Words ending in -IGHT', examples: ['bright', 'night', 'light', 'sight', 'fight', 'right'] },
  { ending: 'own', explanation: 'Words ending in -OWN', examples: ['brown', 'town', 'down', 'crown', 'frown', 'gown'] },
  { ending: 'ear', explanation: 'Words ending in -EAR', examples: ['bear', 'near', 'clear', 'dear', 'fear', 'hear'] },
  { ending: 'ake', explanation: 'Words ending in -AKE', examples: ['make', 'take', 'lake', 'bake', 'wake', 'fake'] },
  { ending: 'ing', explanation: 'Words ending in -ING', examples: ['sing', 'ring', 'king', 'wing', 'bring', 'spring'] },
  { ending: 'ore', explanation: 'Words ending in -ORE', examples: ['more', 'core', 'store', 'shore', 'bore', 'wore'] },
  { ending: 'ay', explanation: 'Words ending in -AY', examples: ['day', 'way', 'say', 'play', 'may', 'stay'] },
  { ending: 'ock', explanation: 'Words ending in -OCK', examples: ['rock', 'lock', 'clock', 'block', 'shock', 'dock'] },
  { ending: 'ell', explanation: 'Words ending in -ELL', examples: ['bell', 'tell', 'well', 'sell', 'fell', 'smell'] },
  { ending: 'ice', explanation: 'Words ending in -ICE', examples: ['nice', 'mice', 'rice', 'dice', 'price', 'twice'] },
  { ending: 'ound', explanation: 'Words ending in -OUND', examples: ['round', 'sound', 'found', 'ground', 'pound', 'bound'] }
];

// Decoy words that look normal but are actually mines
const MINE_WORDS = [
  'the', 'and', 'but', 'for', 'with', 'from', 'about', 'through',
  'under', 'over', 'after', 'before', 'during', 'between', 'among',
  'quick', 'slow', 'big', 'small', 'new', 'old', 'good', 'bad',
  'first', 'last', 'next', 'other', 'many', 'few', 'all', 'some'
];

interface ChallengeWord {
  word: string;
  type: string;
  position: number;
  revealed: boolean;
  clicked: boolean;
  isMine: boolean;
  rhymeGroup?: number; // Group ID
  rhymeExplanation?: string; // Explanation shown after group completion
  flipped?: boolean; // For card flip animation
}

const FlowFinder: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { flowFinderChallenge, completeFlowFinderChallenge } = useExperience();
  
  // Get grid size from URL params
  const urlGridSize = searchParams.get('size') as '4x4' | '8x8' | null;
  const challengeId = searchParams.get('challenge');

  // Computed challenge object (either real or mock)
  const currentChallenge = flowFinderChallenge || {
    id: 'mock-daily-challenge',
    text: 'The cat sat on the mat, looking fat and ready to chat.',
    patterns: [
      { word: 'cat', type: 'rhyme', position: 1 },
      { word: 'sat', type: 'rhyme', position: 2 },
      { word: 'mat', type: 'rhyme', position: 6 },
      { word: 'fat', type: 'rhyme', position: 8 },
      { word: 'chat', type: 'rhyme', position: 12 }
    ],
    type: 'rhyme_hunter',
    difficulty: 'medium',
    tokensReward: 0,
    xpReward: 25,
    completed: false,
    createdAt: new Date()
  };

  // Inject animation styles
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [words, setWords] = useState<ChallengeWord[]>([]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [foundPatterns, setFoundPatterns] = useState(0);
  const [totalPatterns, setTotalPatterns] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [explosionWord, setExplosionWord] = useState<string | null>(null);
  const [activePatternType, setActivePatternType] = useState<string | null>(null);
  const [completedPatternTypes, setCompletedPatternTypes] = useState<Set<string>>(new Set());
  const [completedRhymeGroups, setCompletedRhymeGroups] = useState<Set<number>>(new Set());
  const [difficulty, setDifficulty] = useState<'4x4' | '8x8'>(urlGridSize || '4x4');
  const [strikes, setStrikes] = useState(0);

  // Generate a grid based on difficulty
  const generateGrid = (difficulty: '4x4' | '8x8'): ChallengeWord[] => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const totalCards = config.gridSize * config.gridSize;
    
    // Determine rhyme groups distribution
    const groups: { pattern: typeof RHYME_PATTERNS[0], size: number }[] = [];
    let remainingCards = totalCards;
    let groupId = 0;
    
    // Shuffle patterns for variety
    const shuffledPatterns = [...RHYME_PATTERNS].sort(() => Math.random() - 0.5);
    
    while (remainingCards > 0 && groupId < shuffledPatterns.length) {
      const groupSize = Math.min(
        remainingCards,
        Math.floor(Math.random() * (config.maxGroupSize - config.minGroupSize + 1)) + config.minGroupSize
      );
      
      if (remainingCards - groupSize < config.minGroupSize && remainingCards !== groupSize) {
        // Adjust last group to avoid leaving too few cards
        groups.push({ pattern: shuffledPatterns[groupId], size: remainingCards });
        remainingCards = 0;
      } else {
        groups.push({ pattern: shuffledPatterns[groupId], size: groupSize });
        remainingCards -= groupSize;
      }
      groupId++;
    }
    
    // Create word array
    const words: ChallengeWord[] = [];
    let wordIndex = 0;
    
    // Add rhyme groups
    groups.forEach((group, gId) => {
      const availableWords = [...group.pattern.examples];
      for (let i = 0; i < group.size && i < availableWords.length; i++) {
        words.push({
          word: availableWords[i],
          type: `rhyme-${group.pattern.ending}`,
          position: wordIndex++,
          revealed: false,
          clicked: false,
          isMine: false,
          rhymeGroup: gId,
          rhymeExplanation: group.pattern.explanation
        });
      }
    });
    
    // Shuffle the grid
    return words.sort(() => Math.random() - 0.5).map((word, index) => ({
      ...word,
      position: index
    }));
  };

  // Initialize challenge
  useEffect(() => {
    if (!currentChallenge) {
      navigate('/');
      return;
    }

    if (currentChallenge.completed && flowFinderChallenge) {
      setGameState('won');
      return;
    }

    // Generate grid based on difficulty
    const challengeWords = generateGrid(difficulty);
    setWords(challengeWords);
    
    // Count total non-mine words for progress tracking
    const totalNonMineWords = challengeWords.filter(word => !word.isMine).length;
    setTotalPatterns(totalNonMineWords);
    
    // Only show instructions on first visit (when we have a real daily challenge)
    if (flowFinderChallenge && !currentChallenge.completed) {
      setShowInstructions(true);
    }
  }, [currentChallenge, flowFinderChallenge, navigate, difficulty]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleWordClick = useCallback((index: number) => {
    if (gameState !== 'playing') return;
    
    const word = words[index];
    if (word.clicked) return;
    
    // Check if this click breaks the chain
    if (activePatternType && word.type !== activePatternType && word.type.startsWith('rhyme-')) {
      // Breaking the chain - increment strikes
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      
      // Mark this word as a mine (wrong guess)
      setWords(prev => prev.map((w, i) => 
        i === index ? { ...w, clicked: true, revealed: true, isMine: true } : w
      ));
      
      if (newStrikes >= 3) {
        // Game over on 3rd strike
        setExplosionWord(`Strike 3! You clicked "${word.word}" while completing ${activePatternType.replace('rhyme-', '-').toUpperCase()} rhymes`);
        setGameState('lost');
      } else {
        // Show strike warning but continue playing
        setExplosionWord(`Strike ${newStrikes}! Wrong pattern - ${3 - newStrikes} ${newStrikes === 2 ? 'strike' : 'strikes'} left`);
      }
      return;
    }
    
    setWords(prev => {
      const newWordState = prev.map((w, i) => {
        if (i === index) {
          const updatedWord = { ...w, clicked: true, revealed: true };
          
          // Handle different word types
          if (w.type.startsWith('rhyme-')) {
            // Set active pattern type if this is the first click of this type
            if (!activePatternType || completedPatternTypes.has(activePatternType)) {
              setActivePatternType(w.type);
            }
            
            return updatedWord;
          }
          
          return updatedWord;
        }
        return w;
      });
      
      return newWordState;
    });
    
    // Check for rhyme group completion
    setTimeout(() => {
      setWords(prev => {
        let updatedWords = [...prev];
        const clickedWord = updatedWords[index];
        
        if (clickedWord.rhymeGroup !== undefined) {
          const revealedInGroup = updatedWords.filter(w => 
            w.rhymeGroup === clickedWord.rhymeGroup && w.revealed
          ).length;
          
          const totalInGroup = updatedWords.filter(w => w.rhymeGroup === clickedWord.rhymeGroup).length;
          
          if (revealedInGroup === totalInGroup) {
            setCompletedPatternTypes(current => new Set([...current, clickedWord.type]));
            if (clickedWord.rhymeGroup !== undefined) {
              setCompletedRhymeGroups(current => new Set([...current, clickedWord.rhymeGroup!]));
            }
            setActivePatternType(null);
            
            // Mark all words in this group to show their rhyme explanation with staggered flip
            setTimeout(() => {
              setWords(current => current.map(w => {
                if (w.rhymeGroup === clickedWord.rhymeGroup) {
                  return { ...w, revealed: true, flipped: true };
                }
                return w;
              }));
            }, 300); // Delay the flip animation slightly
          }
        }
        
        // Update found patterns count
        const revealedCount = updatedWords.filter(w => w.revealed && !w.isMine).length;
        setFoundPatterns(revealedCount);
        
        // Check win condition
        if (revealedCount === totalPatterns) {
          setGameState('won');
          if (flowFinderChallenge) {
            completeFlowFinderChallenge(true, revealedCount / totalPatterns);
          }
        }
        
        return updatedWords;
      });
    }, 0);
  }, [gameState, words, activePatternType, completedPatternTypes, totalPatterns, flowFinderChallenge, completeFlowFinderChallenge, strikes]);

  const handleGameEnd = useCallback(() => {
    if (!currentChallenge) return;

    const success = gameState === 'won';
    const accuracy = foundPatterns / totalPatterns;
    
    // Only call completeFlowFinderChallenge if we have a real daily challenge
    if (flowFinderChallenge) {
      completeFlowFinderChallenge(success, accuracy);
    }
  }, [currentChallenge, flowFinderChallenge, gameState, foundPatterns, totalPatterns, completeFlowFinderChallenge]);

  // Handle game restart
  const handleRestart = useCallback(() => {
    if (!currentChallenge) return;

    // Reset all game state
    setGameState('playing');
    setTimeLeft(180);
    setFoundPatterns(0);
    setExplosionWord(null);
    setShowInstructions(false);
    setActivePatternType(null);
    setCompletedPatternTypes(new Set());
    setCompletedRhymeGroups(new Set());
    setStrikes(0);

    // Generate new grid based on difficulty
    const challengeWords = generateGrid(difficulty);
    setWords(challengeWords);
    
    // Count total non-mine words for progress tracking
    const totalNonMineWords = challengeWords.filter(word => !word.isMine).length;
    setTotalPatterns(totalNonMineWords);
  }, [currentChallenge, difficulty]);

  // Handle revealing the solution
  const handleRevealSolution = useCallback(() => {
    setWords(current => {
      const revealed = current.map(word => {
        if (!word.isMine) {
          return { ...word, revealed: true, clicked: true };
        }
        return word;
      });
      
      // Get all unique rhyme groups
      const allRhymeGroups = new Set(revealed.filter(w => w.rhymeGroup !== undefined).map(w => w.rhymeGroup!));
      setCompletedRhymeGroups(allRhymeGroups);
      
      // Flip cards after a short delay to show the rhyme patterns
      setTimeout(() => {
        setWords(revealed.map(word => {
          if (!word.isMine && word.rhymeGroup !== undefined) {
            return { ...word, flipped: true };
          }
          return word;
        }));
      }, 500);
      
      return revealed;
    });
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') {
      handleGameEnd();
    }
  }, [gameState, handleGameEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordColor = (word: ChallengeWord) => {
    if (!word.revealed) return 'transparent';
    if (word.isMine) return theme.palette.error.main;
    
    // Use rhyme group ID to determine color
    if (word.rhymeGroup !== undefined) {
      const colors = [
        theme.palette.forest.primary,
        theme.palette.forest.blue,
        theme.palette.forest.secondary,
        theme.palette.forest.accent,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.success.main
      ];
      return colors[word.rhymeGroup % colors.length];
    }
    
    return alpha(theme.palette.text.primary, 0.1);
  };

  const getGridCardColor = (word: ChallengeWord) => {
    // Hide mines until clicked
    if (word.isMine && !word.clicked) {
      return alpha(theme.palette.background.paper, 0.8);
    }
    
    if (!word.revealed) return alpha(theme.palette.background.paper, 0.8);
    if (word.isMine) return theme.palette.error.main;
    
    // Use rhyme group ID to determine color
    if (word.rhymeGroup !== undefined) {
      const colors = [
        theme.palette.forest.primary,
        theme.palette.forest.blue,
        theme.palette.forest.secondary,
        theme.palette.forest.accent,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.success.main
      ];
      return colors[word.rhymeGroup % colors.length];
    }
    
    return alpha(theme.palette.background.paper, 0.9);
  };

  const getGridCardBorderColor = (word: ChallengeWord) => {
    // Hide mines until clicked
    if (word.isMine && !word.clicked) {
      return alpha(theme.palette.forest.border, 0.3);
    }
    
    if (!word.revealed) return alpha(theme.palette.forest.border, 0.3);
    if (word.isMine) return theme.palette.error.main;
    
    // Use rhyme group ID to determine color
    if (word.rhymeGroup !== undefined) {
      const colors = [
        theme.palette.forest.primary,
        theme.palette.forest.blue,
        theme.palette.forest.secondary,
        theme.palette.forest.accent,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.success.main
      ];
      return colors[word.rhymeGroup % colors.length];
    }
    
    return alpha(theme.palette.forest.border, 0.3);
  };

  const getGridTextColor = (word: ChallengeWord) => {
    // Hide mines until clicked
    if (word.isMine && !word.clicked) {
      return theme.palette.text.primary;
    }
    
    if (!word.revealed) return theme.palette.text.primary;
    if (word.isMine) return '#FFFFFF';
    
    // Determine text color based on background
    if (word.rhymeGroup !== undefined) {
      const lightBgGroups = [0, 2]; // Primary and secondary are light
      return lightBgGroups.includes(word.rhymeGroup % 7) ? '#000000' : '#FFFFFF';
    }
    
    return theme.palette.text.primary;
  };

  const progress = totalPatterns > 0 ? (foundPatterns / totalPatterns) * 100 : 0;

  if (!currentChallenge) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: theme.palette.forest.background,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.primary" mb={3}>
            Daily Challenge not found
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ 
              bgcolor: theme.palette.forest.primary,
              color: 'black',
              '&:hover': { bgcolor: theme.palette.forest.primary }
            }}
          >
            Back to Forest
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.forest.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4, 
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px !important'
        }}
      >
        {/* Header */}
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4, 
            width: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
            borderRadius: 2
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              🎯 Flow Finder
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              {/* Difficulty Selector */}
              {gameState !== 'playing' && (
                <Box display="flex" gap={0.5} mr={2}>
                  <Button
                    size="small"
                    variant={difficulty === '4x4' ? 'contained' : 'outlined'}
                    onClick={() => setDifficulty('4x4')}
                    sx={{ 
                      bgcolor: difficulty === '4x4' ? theme.palette.forest.primary : 'transparent',
                      color: difficulty === '4x4' ? 'black' : theme.palette.forest.primary,
                      borderColor: theme.palette.forest.primary,
                      '&:hover': { 
                        bgcolor: difficulty === '4x4' ? theme.palette.forest.primary : alpha(theme.palette.forest.primary, 0.1)
                      }
                    }}
                  >
                    4x4
                  </Button>
                  <Button
                    size="small"
                    variant={difficulty === '8x8' ? 'contained' : 'outlined'}
                    onClick={() => setDifficulty('8x8')}
                    sx={{ 
                      bgcolor: difficulty === '8x8' ? theme.palette.forest.accent : 'transparent',
                      color: difficulty === '8x8' ? 'white' : theme.palette.forest.accent,
                      borderColor: theme.palette.forest.accent,
                      '&:hover': { 
                        bgcolor: difficulty === '8x8' ? theme.palette.forest.accent : alpha(theme.palette.forest.accent, 0.1)
                      }
                    }}
                  >
                    8x8
                  </Button>
                </Box>
              )}
              <Tooltip title="Instructions">
                <IconButton 
                  onClick={() => setShowInstructions(true)}
                  sx={{ color: theme.palette.forest.secondary }}
                >
                  <HelpIcon />
                </IconButton>
              </Tooltip>
              <IconButton 
                onClick={() => navigate('/')}
                sx={{ color: theme.palette.forest.primary }}
              >
                <HomeIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                <TimerIcon 
                  sx={{ color: timeLeft < 30 ? theme.palette.error.main : theme.palette.forest.blue }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: timeLeft < 30 ? theme.palette.error.main : theme.palette.text.primary,
                    fontSize: { xs: '1.125rem', md: '1.25rem' }
                  }}
                >
                  {formatTime(timeLeft)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Box textAlign={{ xs: 'center', md: 'left' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progress: {foundPatterns}/{totalPatterns}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: alpha(theme.palette.forest.primary, 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.forest.primary
                    }
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1} justifyContent={{ xs: 'center', md: 'flex-start' }} flexWrap="wrap">
                <Chip 
                  label={`+${currentChallenge.tokensReward} 🪙`} 
                  sx={{ 
                    bgcolor: theme.palette.forest.blue,
                    color: 'white',
                    fontWeight: 600
                  }}
                  size="small"
                />
                <Chip 
                  label={`+${currentChallenge.xpReward} XP`} 
                  sx={{ 
                    bgcolor: theme.palette.forest.secondary,
                    color: 'black',
                    fontWeight: 600
                  }}
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'center', md: 'left' }}>
                Type: {currentChallenge.type.replace('_', ' ')}
              </Typography>
            </Grid>

            {/* Strikes Indicator */}
            {gameState === 'playing' && strikes > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Strikes:
                  </Typography>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: i < strikes ? theme.palette.error.main : alpha(theme.palette.error.main, 0.2),
                        border: `2px solid ${i < strikes ? theme.palette.error.dark : alpha(theme.palette.error.main, 0.3)}`,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {3 - strikes} {strikes === 2 ? 'strike' : 'strikes'} left
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Paper>

        {/* Game Area */}
        <Paper 
          sx={{ 
            p: 4, 
            width: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.forest.card, 0.9)}, ${alpha(theme.palette.forest.card, 0.7)})`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
            borderRadius: 2
          }}
        >
          {gameState === 'playing' && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                '& .MuiAlert-icon': { color: theme.palette.info.main }
              }}
            >
              Clear the entire board by completing pattern groups strategically!
            </Alert>
          )}

          {gameState === 'won' && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                bgcolor: alpha(theme.palette.forest.primary, 0.1),
                color: theme.palette.forest.primary,
                '& .MuiAlert-icon': { color: theme.palette.forest.primary }
              }}
            >
              🎉 Challenge completed successfully! +{currentChallenge.tokensReward} 🪙 +{currentChallenge.xpReward} XP
            </Alert>
          )}

          {gameState === 'lost' && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main
              }}
            >
              💥 Challenge failed! {explosionWord && `${explosionWord}`}
            </Alert>
          )}

          {/* Strike Warning */}
          {gameState === 'playing' && strikes > 0 && strikes < 3 && explosionWord && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main
              }}
            >
              ⚠️ {explosionWord}
            </Alert>
          )}

          {/* Game Grid - Minesweeper Style */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="text.primary" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Strategic Pattern Hunt
            </Typography>
            
            {/* Dynamic Grid */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${DIFFICULTY_CONFIGS[difficulty].gridSize}, 1fr)`,
                gap: difficulty === '8x8' ? 1 : 2,
                maxWidth: difficulty === '8x8' ? '800px' : '600px',
                margin: '0 auto',
                p: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.1),
                borderRadius: 3,
                border: `2px solid ${alpha(theme.palette.forest.border, 0.3)}`
              }}
            >
              {words.map((word, index) => (
                <Card
                  key={index}
                  onClick={() => handleWordClick(index)}
                  sx={{
                    minHeight: difficulty === '8x8' ? '60px' : '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: gameState === 'playing' && !word.clicked ? 'pointer' : 'default',
                    transition: 'transform 0.6s',
                    bgcolor: getGridCardColor(word),
                    border: `2px solid ${getGridCardBorderColor(word)}`,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: word.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    '&:hover': gameState === 'playing' && !word.clicked && !word.flipped ? {
                      transform: 'translateY(-4px) rotateY(0deg)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.forest.primary, 0.3)}`,
                      bgcolor: alpha(theme.palette.forest.primary, 0.1)
                    } : {},
                    // Completed rhyme group styling
                    ...(word.rhymeGroup !== undefined && completedRhymeGroups.has(word.rhymeGroup) && !word.flipped && {
                      background: `linear-gradient(135deg, ${getGridCardColor(word)}, ${alpha(getGridCardColor(word), 0.8)})`,
                      boxShadow: `inset 0 0 10px ${alpha(theme.palette.common.white, 0.3)}`
                    })
                  }}
                >
                  {/* Front of card */}
                  <CardContent sx={{ 
                    textAlign: 'center',
                    p: difficulty === '8x8' ? 1 : 2,
                    '&:last-child': { pb: difficulty === '8x8' ? 1 : 2 },
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)'
                  }}>
                    <Typography 
                      variant={difficulty === '8x8' ? 'body2' : 'h6'}
                      sx={{ 
                        fontWeight: word.revealed ? 700 : 600,
                        color: getGridTextColor(word),
                        fontSize: difficulty === '8x8' ? '0.9rem' : { xs: '1rem', md: '1.1rem' },
                        textTransform: word.revealed && word.type !== 'normal' ? 'uppercase' : 'none'
                      }}
                    >
                      {word.word}
                    </Typography>
                    
                    {/* Mine indicator - only show after clicked */}
                    {word.clicked && word.isMine && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 0.5,
                          fontSize: difficulty === '8x8' ? '1rem' : '1.2rem'
                        }}
                      >
                        💥
                      </Typography>
                    )}
                  </CardContent>
                  
                  {/* Back of card - shows rhyme pattern */}
                  {word.flipped && word.rhymeExplanation && (
                    <CardContent sx={{ 
                      textAlign: 'center',
                      p: difficulty === '8x8' ? 1 : 2,
                      '&:last-child': { pb: difficulty === '8x8' ? 1 : 2 },
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      bgcolor: alpha(getGridCardColor(word), 0.9)
                    }}>
                      <Typography 
                        variant={difficulty === '8x8' ? 'body2' : 'h6'}
                        sx={{ 
                          fontWeight: 700,
                          color: getGridTextColor(word),
                          fontSize: difficulty === '8x8' ? '0.8rem' : { xs: '0.9rem', md: '1rem' }
                        }}
                      >
                        {word.word}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 0.5,
                          color: 'inherit',
                          opacity: 0.9,
                          fontSize: difficulty === '8x8' ? '0.6rem' : '0.7rem',
                          fontWeight: 600,
                          fontStyle: 'italic'
                        }}
                      >
                        {word.type.replace('rhyme-', '-').toUpperCase()}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              ))}
            </Box>
          </Box>

          {/* Completed Words Legend */}
          {completedRhymeGroups.size > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="text.primary" sx={{ textAlign: 'center' }}>
                Discovered Rhyme Patterns
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2, 
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`
                }}
              >
                {[...completedRhymeGroups].sort().map(groupId => {
                  const groupWords = words.filter(w => w.rhymeGroup === groupId && w.revealed);
                  if (groupWords.length === 0) return null;
                  
                  const rhymeEnding = groupWords[0].type.replace('rhyme-', '-').toUpperCase();
                  const color = getGridCardColor(groupWords[0]);
                  const textColor = getGridTextColor(groupWords[0]);
                  
                  return (
                    <Box 
                      key={groupId}
                      sx={{ 
                        p: 1.5,
                        bgcolor: color,
                        borderRadius: 2,
                        minWidth: '120px'
                      }}
                    >
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: textColor,
                          fontWeight: 700,
                          textAlign: 'center',
                          mb: 1,
                          borderBottom: `2px solid ${alpha(textColor, 0.3)}`,
                          pb: 0.5
                        }}
                      >
                        {rhymeEnding} rhymes
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                        {groupWords.map((word, idx) => (
                          <Typography 
                            key={idx}
                            variant="body2" 
                            sx={{ 
                              color: textColor,
                              fontWeight: 500
                            }}
                          >
                            {word.word}
                            {idx < groupWords.length - 1 && ','}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              sx={{ 
                mr: 2,
                bgcolor: theme.palette.forest.primary,
                color: 'black',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': { 
                  bgcolor: theme.palette.forest.primary,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {gameState === 'playing' ? 'Quit' : 'Back to Forest'}
            </Button>
            
            {gameState !== 'playing' && (
              <Button 
                variant="outlined" 
                onClick={() => handleRestart()}
                startIcon={<RefreshIcon />}
                sx={{
                  borderColor: theme.palette.forest.secondary,
                  color: theme.palette.forest.secondary,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: theme.palette.forest.secondary,
                    bgcolor: alpha(theme.palette.forest.secondary, 0.1),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Try Again
              </Button>
            )}
            
            {gameState === 'lost' && (
              <Button 
                variant="outlined" 
                onClick={handleRevealSolution}
                startIcon={<VisibilityIcon />}
                sx={{
                  ml: 2,
                  borderColor: theme.palette.info.main,
                  color: theme.palette.info.main,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Reveal Solution
              </Button>
            )}
          </Box>
        </Paper>

        {/* Instructions Dialog */}
        <Dialog 
          open={showInstructions} 
          onClose={() => setShowInstructions(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.forest.card,
              border: `1px solid ${alpha(theme.palette.forest.border, 0.3)}`,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ color: theme.palette.text.primary, textAlign: 'center', pb: 1 }}>
            🎯 How to Play Flow Finder
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <DialogContentText sx={{ mb: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                🎯 Flow Finder
              </Typography>
              
              <Typography paragraph>
                Find and complete rhyme groups while avoiding mines!
              </Typography>

              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                How to Play:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="🔍 Click any word to reveal if it's part of a rhyme group" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="🎵 Once you click a rhyming word, you must complete ALL words in that rhyme group" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="⚡ You get 3 strikes - breaking the chain (clicking a different rhyme group) gives you a strike" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="💥 3 strikes and you're out! Failed attempts turn into mines" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="📚 When you complete a rhyme group, the rhyme pattern is revealed (e.g., -AT, -IGHT)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="✨ Clear all rhyme groups to win!" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="⏰ Complete the challenge before time runs out!" />
                </ListItem>
              </List>

              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                Difficulty Levels:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="4x4 Grid" 
                    secondary={`${3}-${5} words per rhyme group`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="8x8 Grid" 
                    secondary={`${2}-${4} words per rhyme group`}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  💡 Pro Tips:
                </Typography>
                <Typography variant="body2">
                  • Once you start a rhyme group, commit to finding all words in it
                  <br />
                  • You get 3 strikes before game over - use them wisely!
                  <br />
                  • Each wrong pattern guess creates a mine on that word
                  <br />
                  • Look for common endings like -AT, -ING, -OWN
                  <br />
                  • Higher difficulties have more groups but fewer words per group
                  <br />
                  • After completing a group, you'll see what makes them rhyme!
                </Typography>
              </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setShowInstructions(false)} 
              variant="contained"
              size="large"
              sx={{
                bgcolor: theme.palette.forest.primary,
                color: 'black',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': { 
                  bgcolor: theme.palette.forest.primary,
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              🎮 Start Playing!
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default FlowFinder; 