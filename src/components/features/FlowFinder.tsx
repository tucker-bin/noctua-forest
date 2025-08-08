import React, { useState, useEffect, useCallback, useMemo, ErrorInfo } from 'react';
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
  Paper,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useExperience } from '../../contexts/ExperienceContext';
import { useAuth } from '../../contexts/AuthContext';
import FlowFinderService, { 
  DynamicChallenge, 
  RhymeGroup,
  FlowFinderError,
  ChallengeGenerationError,
  PatternSelectionError,
  WordFilteringError,
  DataValidationError
} from '../../services/flowFinderService';
import { audioService } from '../../services/audioService';
import { AudioControls } from './AudioControls';
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
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { PatternType } from '../../types/observatory';
import { logger } from '../../utils/logger';

// Simple inline functions to replace missing imports
const getPatternColor = (type: string) => {
  const colors: Record<string, string> = {
    'rhyme': '#FFD700',
    'alliteration': '#4CAF50', 
    'consonance': '#4A90E2',
    'internal_rhyme': '#9C27B0',
    'multicultural': '#FF5722',
    'default': '#FFF'
  };
  return colors[type] || colors.default;
};

const getPatternSignificance = (type: string) => {
  return type === 'rhyme' || type === 'alliteration' ? 'high' : 'medium';
};

// Enhanced Error Types for UI
interface GameError {
  type: 'network' | 'generation' | 'validation' | 'unknown';
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: any;
}

// Error Recovery Options
interface ErrorRecoveryOptions {
  canRetry: boolean;
  canUseFallback: boolean;
  canReportIssue: boolean;
  retryDelay?: number;
}

// Enhanced Game State with Error Handling
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
  lastMatchTime: Date | null;
  // Error handling additions
  lastError?: GameError;
  retryCount: number;
  isRecovering: boolean;
}

// Error boundary hook for functional components
function useErrorHandler() {
  const [error, setError] = useState<GameError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error: Error | FlowFinderError | string, context: string = 'Unknown') => {
    logger.error('Game error occurred', { error, context });

    let gameError: GameError;
    
    if (error instanceof FlowFinderError) {
      gameError = {
        type: error.name.includes('Generation') ? 'generation' : 
              error.name.includes('Pattern') ? 'generation' :
              error.name.includes('Validation') ? 'validation' : 'unknown',
        message: error.message,
        userMessage: error.userMessage || 'Something went wrong. Please try again.',
        retryable: error.retryable,
        details: { code: error.code, context }
      };
    } else if (error instanceof Error) {
      gameError = {
        type: error.message.includes('fetch') || error.message.includes('network') ? 'network' : 'unknown',
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        retryable: true,
        details: { context }
      };
    } else {
      gameError = {
        type: 'unknown',
        message: String(error),
        userMessage: 'An unexpected error occurred.',
        retryable: true,
        details: { context }
      };
    }

    setError(gameError);
    return gameError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retryWithDelay = useCallback(async (retryFn: () => Promise<void>, delay: number = 1000) => {
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await retryFn();
      clearError();
    } catch (retryError) {
      handleError(retryError as Error, 'retry');
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return { error, isRetrying, handleError, clearError, retryWithDelay };
}

interface GameCard {
  id: string;
  word: string;
  groupId: string;
  isRevealed: boolean;
  isMatched: boolean;
  position: { row: number; col: number };
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
  type: 'success' | 'combo' | 'perfect' | 'decoy_hit';
  emoji: string;
}

interface FlowFinderProps {
  mode?: string; // Optional mode for direct routing (TETR.IO style)
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
  perfect: ['🏆', '👑', '💎', '🎉'],
  decoy_hit: ['💀', '⚠️', '❌', '🚨']
};

// Observatory-style highlighting function for natural text appearance
const getPatternHighlighting = (card: GameCard, selectedMode: string) => {
  // Map actual game mode IDs to pattern types for highlighting
  const patternTypeMap: { [key: string]: PatternType } = {
    'rhyme_hunter': 'rhyme',           // Bars & Rhymes
    'alliteration_alert': 'alliteration',  // Flow State  
    'consonance_challenge': 'rhythm',     // Beat Breaks
    'cultural_crossover': 'cultural_resonance', // World Cypher
    'decoy_detective': 'emotional_emphasis'     // Battle Mode
  };
  
  const patternType = patternTypeMap[selectedMode] || 'rhyme';
  const baseColor = getPatternColor(patternType);
  
  return { patternType, baseColor };
};

// Dynamic font size and tile height based on word length for vertical stacking
const getDynamicTileSettings = (word: string, isMobile: boolean = false) => {
  const letterCount = word.length;
  const baseSize = isMobile ? 12 : 14;
  const baseTileHeight = isMobile ? 60 : 80;
  
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
    tileHeight = baseTileHeight + 20;
    letterSpacing = '0.5px';
  } else if (letterCount <= 8) {
    fontSize = baseSize - 1;
    tileHeight = baseTileHeight + 35;
    letterSpacing = '0.25px';
  } else if (letterCount <= 10) {
    fontSize = baseSize - 2;
    tileHeight = baseTileHeight + 50;
    letterSpacing = '0px';
  } else {
    fontSize = baseSize - 3;
    tileHeight = baseTileHeight + 65;
    letterSpacing = '0px';
  }
  
  return {
    fontSize: `${fontSize}px`,
    tileHeight: `${tileHeight}px`,
    letterSpacing,
    lineHeight: isMobile ? '1.1' : '1.2'
  };
};

// Render word letters vertically stacked
const renderVerticalWord = (word: string, settings: any, isRevealed: boolean) => {
  const letters = word.split('');
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 0.1
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
            color: isRevealed ? 'white' : 'text.primary',
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

// Dynamic font size based on word length (like NYT Connections) - DEPRECATED, use getDynamicTileSettings instead
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



export const FlowFinder: React.FC<FlowFinderProps> = ({ mode }) => {
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
  const [loadingContent, setLoadingContent] = useState(false);
  
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
    lastMatchTime: null,
    retryCount: 0,
    isRecovering: false
  });
  
  // UI enhancement states
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showELOUpdate, setShowELOUpdate] = useState<{show: boolean, change: number}>({show: false, change: 0});
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [showComboPopup, setShowComboPopup] = useState<{ show: boolean; combo: number; score: number }>({ show: false, combo: 0, score: 0 });
  
  // Error and loading states
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      audioService.resumeContext();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Timer audio warnings
  useEffect(() => {
    if (timeLeft === 30) {
      audioService.playTimeWarning();
    } else if (timeLeft <= 10 && timeLeft > 0) {
      audioService.playTimeCritical();
    }
  }, [timeLeft]);

  // Simplified particle effect system (much fewer particles)
  const createParticles = useCallback((x: number, y: number, type: ParticleEffect['type'], count: number = 1) => {
    // Only create particles for major achievements, not every match
    if (type === 'success') return; // Skip basic success particles
    
    const newParticles: ParticleEffect[] = [];
    const emojis = PARTICLE_EMOJIS[type];
    
    for (let i = 0; i < Math.min(count, 2); i++) { // Max 2 particles instead of 3-10
      newParticles.push({
        id: `particle_${Date.now()}_${i}`,
        x: x + (Math.random() - 0.5) * 50, // Smaller spread
        y: y + (Math.random() - 0.5) * 30,
        type,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Auto-remove particles faster
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000); // Reduced from 2000ms to 1000ms
  }, [setParticles]);

  // Simplified haptic feedback (less intrusive)
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    // Reduced haptic feedback - only for major events
    if (type === 'light') return; // Skip light haptic feedback
    
    // In a real app, this would use navigator.vibrate() or Haptics API
    console.log(`Haptic feedback: ${type}`);
  }, []);

  // Initialize available game modes
  useEffect(() => {
    const service = FlowFinderService.getInstance();
    const modes = service.getAvailableGameModes(level);
    setAvailableModes(modes);
  }, [level]);

  // Auto-start game when mode prop is provided (TETR.IO style direct routing)
  useEffect(() => {
    if (mode && availableModes.length > 0) {
      // Automatically start the game with the provided mode
      setShowModeSelection(false);
      startGame(mode);
    }
  }, [mode, availableModes.length]);

  // Start game with selected mode - now using real backend content
  const startGame = async (modeId: string, culturalTheme?: string) => {
    try {
      setLoadingContent(true);
      const userId = currentUser?.uid || 'anonymous';
      
      let challenge: DynamicChallenge;
      
      // Only use AI content for specific premium modes when backend is available
      if (false) { // Temporarily disabled until backend is stable
        try {
          // Get AI-generated content bundle
          const contentBundle = await aiContentService.getDailyContent(level, isPremium);
          
          // Select appropriate game variant based on user level
          const variant = contentBundle.gameVariants.find(v => 
            level < 10 ? v.gridSize === '4x4' : v.gridSize === '8x8'
          ) || contentBundle.gameVariants[0];
          
          // Convert to challenge format
          const aiChallenge = aiContentService.convertBundleToChallenge(contentBundle, variant);
          
          // Create rhyme groups from AI patterns
          const rhymeGroups: RhymeGroup[] = [];
          const patternMap = new Map<string, string[]>();
          
          // Group words by pattern type
          contentBundle.extractedPatterns.forEach(pattern => {
            pattern.words.forEach(word => {
              const key = pattern.patternType;
              if (!patternMap.has(key)) {
                patternMap.set(key, []);
              }
              patternMap.get(key)!.push(word);
            });
          });
          
          // Convert to rhyme groups
          let groupIndex = 0;
          patternMap.forEach((words, patternType) => {
            if (words.length >= 2) {
              rhymeGroups.push({
                id: `ai_group_${groupIndex}`,
                pattern: patternType,
                words: words.slice(0, Math.min(words.length, 7)), // Max 7 words per group
                difficulty: contentBundle.difficulty,
                completed: false,
                cardsRevealed: [],
                groupSize: words.length
              });
              groupIndex++;
            }
          });
          
          challenge = {
            ...aiChallenge,
            rhymeGroups,
            eloRating: contentBundle.difficulty * 200 + 800,
            adaptiveFeatures: {
              longerWords: contentBundle.complexity !== 'basic',
              obscureRhymes: contentBundle.complexity === 'expert',
              mixedPatterns: true,
              culturalWords: !!contentBundle.culturalContext,
              abstractConcepts: contentBundle.complexity === 'advanced' || contentBundle.complexity === 'expert'
            },
            maxStrikes: variant.strikes,
            timeBonus: contentBundle.isPremium,
            isPremium: contentBundle.isPremium,
            isDaily: contentBundle.bundleType === 'daily'
          };
          
          console.log('🎮 Using AI-generated content:', {
            bundleId: contentBundle.id,
            language: contentBundle.language,
            culturalContext: contentBundle.culturalContext,
            patterns: rhymeGroups.length,
            complexity: contentBundle.complexity
          });
        } catch (error) {
          console.error('Failed to fetch AI content, falling back to local generation:', error);
          // Fallback to local generation
          const service = FlowFinderService.getInstance();
          challenge = service.generateDynamicChallenge(userId, level, isPremium, false);
        }
      } else {
        // Use local generation for other modes
        const service = FlowFinderService.getInstance();
        
        if (modeId === 'decoy_detective') {
          challenge = await service.generateDecoyChallenge(userId, level, isPremium);
        } else {
          challenge = await service.generateDynamicChallenge(userId, level, isPremium, false);
          // Override the type to match the selected mode
          if (modeId === 'alliteration_alert') {
            challenge.type = 'alliteration_alert';
          } else if (modeId === 'consonance_challenge') {
            challenge.type = 'meter_master';
          }
        }
      }
      
      setChallenge(challenge);
      setSelectedMode(modeId);
      setShowModeSelection(false);

      // Create cards from challenge
      const cards: GameCard[] = [];
      const size = challenge.gridSize === '4x4' ? 4 : 8;
      
      if (modeId === 'decoy_detective') {
        // For decoy mode, use pre-generated grid with real words and decoys mixed
        let cardIndex = 0;
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            const word = challenge.grid[row][col];
            
            // Determine if this word belongs to a real rhyme group or is a decoy
            let groupId = 'decoy';
            challenge.rhymeGroups.forEach((group) => {
              if (group.words.includes(word)) {
                groupId = group.id;
              }
            });
            
            cards.push({
              id: `card_${cardIndex}`,
              word,
              groupId,
              isRevealed: false,
              isMatched: false,
              position: { row, col }
            });
            cardIndex++;
          }
        }
      } else {
        // For normal modes, generate cards from rhyme groups
        let cardIndex = 0;
        const totalSlots = size * size;
        const availableWords: Array<{word: string, groupId: string}> = [];
        
        // First, collect all valid words from rhyme groups
        challenge.rhymeGroups.forEach((group) => {
          group.words.forEach((word) => {
            // Skip boring/function words that shouldn't be in a rhyme game
            const boringWords = ['the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 
                               'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 
                               'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 
                               'might', 'can', 'it', 'its', 'that', 'this', 'these', 'those',
                               'as', 'if', 'so', 'yet', 'for', 'with', 'from', 'by', 'up', 'down',
                               'out', 'off', 'over', 'under', 'into', 'onto', 'upon', 'about'];
            
            if (!boringWords.includes(word.toLowerCase())) {
              availableWords.push({ word, groupId: group.id });
            }
          });
        });
        
        // Validate we have enough words for the grid
        if (availableWords.length === 0) {
          throw new Error('No valid words available for game generation');
        }
        
        // Create cards up to the grid limit or available words, whichever is smaller
        const cardsToCreate = Math.min(totalSlots, availableWords.length);
        
        for (let i = 0; i < cardsToCreate; i++) {
          const wordData = availableWords[i % availableWords.length];
          const row = Math.floor(cardIndex / size);
          const col = cardIndex % size;
          
          // Safety check: ensure we don't exceed grid bounds
          if (row >= size || col >= size) {
            console.warn(`Card position out of bounds: row=${row}, col=${col}, size=${size}`);
            break;
          }
          
          cards.push({
            id: `card_${cardIndex}`,
            word: wordData.word,
            groupId: wordData.groupId,
            isRevealed: false,
            isMatched: false,
            position: { row, col }
          });
          cardIndex++;
        }
        
        // Fill remaining slots with safe placeholder words only if absolutely necessary
        while (cards.length < totalSlots && cardIndex < totalSlots) {
          const row = Math.floor(cardIndex / size);
          const col = cardIndex % size;
          
          // Final safety check
          if (row >= size || col >= size) {
            console.warn(`Filler position out of bounds: row=${row}, col=${col}, size=${size}`);
            break;
          }
          
          cards.push({
            id: `card_${cardIndex}`,
            word: `WORD_${cardIndex}`,
            groupId: 'filler',
            isRevealed: false,
            isMatched: false,
            position: { row, col }
          });
          cardIndex++;
        }
        
        // Shuffle cards for random positioning in normal modes
        cards.sort(() => Math.random() - 0.5);
      }
      
      setGameState({
        cards: cards,
        revealedCards: [],
        completedGroups: new Set(),
        strikes: 0,
        maxStrikes: challenge.maxStrikes,
        isGameOver: false,
        isWon: false,
        currentGroupInProgress: null,
        combo: 0,
        perfectStreak: 0,
        totalScore: 0,
        lastMatchTime: null,
        retryCount: 0,
        isRecovering: false
      });
      
      setTimeLeft(challenge.timeLimit);
      setGameStartTime(new Date());
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game. Using offline mode instead.');
      setIsOfflineMode(true);
      
      // Fallback to local generation for all modes when API fails
      const service = FlowFinderService.getInstance();
      try {
        const fallbackUserId = currentUser?.uid || 'anonymous';
        const fallbackChallenge = service.generateDynamicChallenge(fallbackUserId, level, isPremium, false);
        setChallenge(fallbackChallenge);
        setSelectedMode(modeId);
        setShowModeSelection(false);

        // Create cards from fallback challenge
        const cards: GameCard[] = [];
        const size = fallbackChallenge.gridSize === '4x4' ? 4 : 8;
        
        const totalSlots = size * size;
        const availableWords: Array<{word: string, groupId: string}> = [];
        
        // Collect all words from fallback groups
        fallbackChallenge.rhymeGroups.forEach((group) => {
          group.words.forEach((word) => {
            availableWords.push({ word, groupId: group.id });
          });
        });
        
        // Validate we have words
        if (availableWords.length === 0) {
          console.error('No words available in fallback challenge');
          return;
        }
        
        let cardIndex = 0;
        const cardsToCreate = Math.min(totalSlots, availableWords.length);
        
        for (let i = 0; i < cardsToCreate; i++) {
          const wordData = availableWords[i % availableWords.length];
          const row = Math.floor(cardIndex / size);
          const col = cardIndex % size;
          
          // Safety check
          if (row >= size || col >= size) {
            console.warn(`Fallback card position out of bounds: row=${row}, col=${col}, size=${size}`);
            break;
          }

          cards.push({
            id: `card_${cardIndex}`,
            word: wordData.word,
            groupId: wordData.groupId,
            isRevealed: false,
            isMatched: false,
            position: { row, col }
          });
          cardIndex++;
        }

        // Fill remaining slots if needed with safety checks
        while (cards.length < totalSlots && cardIndex < totalSlots) {
          const row = Math.floor(cardIndex / size);
          const col = cardIndex % size;
          
          if (row >= size || col >= size) {
            console.warn(`Fallback filler position out of bounds: row=${row}, col=${col}, size=${size}`);
            break;
          }
          
          cards.push({
            id: `card_${cardIndex}`,
            word: `WORD_${cardIndex}`,
            groupId: 'filler',
            isRevealed: false,
            isMatched: false,
            position: { row, col }
          });
          cardIndex++;
        }

        // Shuffle cards
        cards.sort(() => Math.random() - 0.5);

        setGameState({
          cards: cards,
          revealedCards: [],
          completedGroups: new Set(),
          strikes: 0,
          maxStrikes: fallbackChallenge.maxStrikes,
          isGameOver: false,
          isWon: false,
          currentGroupInProgress: null,
          combo: 0,
          perfectStreak: 0,
          totalScore: 0,
          lastMatchTime: null,
          retryCount: 0,
          isRecovering: false
        });
        
        setTimeLeft(fallbackChallenge.timeLimit);
        setGameStartTime(new Date());
              } catch (fallbackError) {
          console.error('Fallback game generation also failed:', fallbackError);
          setError('Unable to start game. Please try again later.');
          return;
        }
    } finally {
      setLoadingContent(false);
    }
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

  // Enhanced card click handler with decoy detection and audio
  const handleCardClick = useCallback((card: GameCard) => {
    if (gameState.isGameOver || card.isMatched) return;

    // Play card click sound for all valid clicks
    audioService.playCardClick();

    // DECOY DETECTIVE MODE: Check if user clicked a decoy word
    if (selectedMode === 'decoy_detective' && card.groupId === 'decoy') {
      // User clicked a decoy! Strike them and show feedback
      const newStrikes = gameState.strikes + 1;
      
      // Audio and visual feedback for decoy click
      audioService.playDecoyHit();
      createParticles(400, 300, 'decoy_hit', 1);
      triggerHaptic('heavy');
      
      // Show decoy warning message
      console.log(`🚨 DECOY DETECTED! "${card.word}" is a trap word!`);
      
      setGameState(prev => ({
        ...prev,
        strikes: newStrikes,
        isGameOver: newStrikes >= gameState.maxStrikes,
        isWon: false
      }));
      
      // Don't add decoy to revealed cards
      return;
    }

    const newRevealedCards = [...gameState.revealedCards];
    
    // If card is already revealed, remove it (deselect)
    const alreadyRevealedIndex = newRevealedCards.findIndex(c => c.id === card.id);
    if (alreadyRevealedIndex !== -1) {
      newRevealedCards.splice(alreadyRevealedIndex, 1);
      setGameState(prev => ({ ...prev, revealedCards: newRevealedCards }));
      return;
    }

    // Add card to revealed cards (only for non-decoys)
    newRevealedCards.push(card);

    // Check if we have a complete group
    if (newRevealedCards.length > 0) {
      const firstGroupId = newRevealedCards[0].groupId;
      const allSameGroup = newRevealedCards.every(c => c.groupId === firstGroupId);
      
      if (allSameGroup && challenge) {
        const rhymeGroup = challenge.rhymeGroups.find(g => g.id === firstGroupId);
        
        if (rhymeGroup && newRevealedCards.length === rhymeGroup.groupSize) {
          // Complete group found! Enhanced audio feedback
          const currentTime = Date.now();
          const timeSinceLastMatch = gameState.lastMatchTime ? (currentTime - gameState.lastMatchTime.getTime()) / 1000 : Infinity;
          
          // Calculate performance metrics
          const isQuickMatch = timeSinceLastMatch < 5;
          const isPerfectStreak = gameState.strikes === 0;
          const newCombo = isQuickMatch ? gameState.combo + 1 : 1;
          const perfectStreak = isPerfectStreak ? gameState.perfectStreak + 1 : 0;
          
          // Calculate score
          const timeBonus = Math.max(0, (120 - (Date.now() - gameStartTime.getTime()) / 1000) / 120);
          const score = calculateScore(rhymeGroup.difficulty || 1, timeBonus, newCombo, isPerfectStreak);
          
          // Audio feedback based on performance
          if (newCombo > 5) {
            audioService.playCombo(newCombo);
            createParticles(400, 300, 'combo', 1);
          } else if (isPerfectStreak && perfectStreak > 3) {
            audioService.playPerfectStreak();
          } else {
            audioService.playGroupComplete();
          }
          
          // Only major haptic feedback and particles for high combos
          if (newCombo > 4) {
            triggerHaptic('medium');
          }
          
          // Much less frequent combo popup - only for impressive streaks
          if (newCombo > 5) {
            setShowComboPopup({ show: true, combo: newCombo, score });
            setTimeout(() => setShowComboPopup({ show: false, combo: 0, score: 0 }), 1500); // Shorter duration
          }
          
          // Update game state
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
            lastMatchTime: new Date(currentTime)
          }));
          
          return;
        }
      }
      
      // Check for mistakes - simplified error handling
      if (newRevealedCards.length >= 2) {
        const groupIds = [...new Set(newRevealedCards.map(c => c.groupId))];
        
        if (groupIds.length > 1 || (challenge && newRevealedCards.length > Math.max(...challenge.rhymeGroups.map(g => g.groupSize)))) {
          // Mistake - audio feedback
          audioService.playCardMismatch();
          
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
              combo: 0,
              perfectStreak: 0
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

  // Enhanced game completion with audio
  useEffect(() => {
    if (challenge && gameState.completedGroups.size === challenge.rhymeGroups.length && !gameState.isGameOver) {
      // Game won! Victory celebration
      audioService.playGameWin();
      triggerHaptic('heavy');
      
      // Only one victory particle
      createParticles(400, 200, 'perfect', 1);
      
      setGameState(prev => ({ ...prev, isGameOver: true, isWon: true }));
      
      // Calculate final rewards
      const timeBonus = Math.max(0, (120 - (Date.now() - gameStartTime.getTime()) / 1000) / 120);
      const finalScore = gameState.totalScore + (timeBonus * 500);
      const xpGain = Math.floor(finalScore / 10);
      const tokensGain = Math.floor(finalScore / 100);
      
      // Award experience and tokens with level up check
      const oldLevel = Math.floor(xp / 1000) + 1;
      addXp(xpGain);
      addTokens(tokensGain);
      
      // Check for level up
      const newLevel = Math.floor((xp + xpGain) / 1000) + 1;
      if (newLevel > oldLevel) {
        setTimeout(() => audioService.playLevelUp(), 1000);
      }
      
      if (completeFlowFinderChallenge) {
        const accuracy = Math.max(0, 1 - (gameState.strikes / gameState.maxStrikes)) * 100;
        completeFlowFinderChallenge(true, accuracy);
      }
    }
  }, [gameState.completedGroups.size, challenge, gameState.isGameOver, gameState.totalScore, gameStartTime, addXp, addTokens, completeFlowFinderChallenge, triggerHaptic, createParticles, xp]);

  // Game loss audio feedback
  useEffect(() => {
    if (gameState.isGameOver && !gameState.isWon) {
      audioService.playGameLoss();
    }
  }, [gameState.isGameOver, gameState.isWon]);

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
            mb: 3, // More breathing room
            background: `linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95))`, // More subtle
            border: `1px solid rgba(255, 215, 0, 0.2)`, // Gold border to connect with cards
            color: 'white',
            backdropFilter: 'blur(10px)', // Glass effect
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' // Elevated feel
          }}>
            <CardContent sx={{ pb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <IconButton 
                    onClick={returnToModeSelection} 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255, 215, 0, 0.1)',
                      color: '#FFD700',
                      '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.2)' }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Typography variant={isMobile ? "h6" : "h5"} component="h2" sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {availableModes.find(m => m.id === selectedMode)?.name || 'Find the Flow'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <AudioControls />
                  <Tooltip title={t('flowFinder.help', 'How to play')}>
                    <IconButton onClick={() => setShowHelp(true)} size="small" sx={{ color: '#FFD700' }}>
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Chip
                    icon={<TimerIcon />}
                    label={formatTime(timeLeft)}
                    color={timeLeft < 30 ? 'error' : timeLeft < 60 ? 'warning' : 'primary'}
                    variant="outlined"
                    sx={{ 
                      fontWeight: 'bold', 
                      minWidth: '70px',
                      borderColor: '#FFD700',
                      color: '#FFD700'
                    }}
                  />
                </Box>
              </Box>

              {/* Enhanced Progress Display */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.25px', color: '#FFD700' }}>
                    Sets Dropped: {gameState.completedGroups.size}/{challenge.rhymeGroups.length}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* Decoy Detective Mode Special Display */}
                    {selectedMode === 'decoy_detective' ? (
                      <>
                        <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.25px', color: '#FFD700' }}>
                          🕵️ Lives: {gameState.maxStrikes - gameState.strikes}/{gameState.maxStrikes}
                        </Typography>
                        {Array.from({ length: gameState.maxStrikes }).map((_, i) => (
                          <span key={i} style={{ fontSize: '18px' }}>
                            {i < gameState.maxStrikes - gameState.strikes ? '❤️' : '💀'}
                          </span>
                        ))}
                      </>
                    ) : (
                      <>
                        <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.25px', color: '#FFD700' }}>
                          Misses: {gameState.strikes}/{gameState.maxStrikes}
                        </Typography>
                        {Array.from({ length: gameState.maxStrikes }).map((_, i) => (
                          <ErrorIcon 
                            key={i} 
                            fontSize="medium" 
                            sx={{ color: i < gameState.strikes ? '#e94560' : 'rgba(255, 255, 255, 0.3)' }}
                          />
                        ))}
                      </>
                    )}
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 12, // Thicker for better visibility
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, #FFD700, #FFA500, #e94560)'
                    }
                  }}
                />
              </Box>

              {/* Game Stats Row */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 215, 0, 0.1)', 
                    borderRadius: 3,
                    border: '1px solid rgba(255, 215, 0, 0.2)'
                  }}>
                    <Typography variant="body2" color="rgba(255, 215, 0, 0.8)" sx={{ fontWeight: 600, mb: 0.5 }}>Bars</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFD700', letterSpacing: '-0.25px' }}>
                      {gameState.totalScore.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(233, 69, 96, 0.1)', 
                    borderRadius: 3,
                    border: '1px solid rgba(233, 69, 96, 0.2)'
                  }}>
                    <Typography variant="body2" color="rgba(233, 69, 96, 0.8)" sx={{ fontWeight: 600, mb: 0.5 }}>Flow</Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <WhatshotIcon sx={{ color: gameState.combo > 2 ? '#e94560' : 'rgba(233, 69, 96, 0.5)' }} fontSize="small" />
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#e94560', letterSpacing: '-0.25px' }}>
                        {gameState.combo}x
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 165, 0, 0.1)', 
                    borderRadius: 3,
                    border: '1px solid rgba(255, 165, 0, 0.2)'
                  }}>
                    <Typography variant="body2" color="rgba(255, 165, 0, 0.8)" sx={{ fontWeight: 600, mb: 0.5 }}>Heat</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFA500', letterSpacing: '-0.25px' }}>
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
                
                {/* Decoy Detective Mode Instructions */}
                {selectedMode === 'decoy_detective' && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(233, 69, 96, 0.1)', 
                    borderRadius: 3, 
                    border: `2px solid rgba(233, 69, 96, 0.3)`,
                    mb: 3,
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 700, 
                      color: '#e94560', 
                      letterSpacing: '-0.25px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>
                      🎤 BATTLE MODE: Find the {challenge.rhymeGroups.length} real rhyme sets! 
                      Dodge fake bars that break the flow - they'll cost you the round! 🔥
                    </Typography>
                  </Box>
                )}
                <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
                  <Typography variant="body1" color="rgba(255, 215, 0, 0.8)" sx={{ 
                    alignSelf: 'center', 
                    mr: 1,
                    fontWeight: 600,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                  }}>
                    Find groups:
                  </Typography>
                  {challenge.rhymeGroups.map((group, index) => (
                    <Chip
                      key={group.id}
                        label={`${group.pattern} (${group.groupSize})`}
                        size="medium"
                        icon={gameState.completedGroups.has(group.id) ? <CheckCircleIcon /> : undefined}
                        sx={{
                          backgroundColor: gameState.completedGroups.has(group.id) 
                            ? `${RHYME_GROUP_COLORS[index % RHYME_GROUP_COLORS.length]}CC`
                            : 'rgba(26, 26, 46, 0.7)',
                          color: gameState.completedGroups.has(group.id) ? 'white' : 'rgba(255, 215, 0, 0.9)',
                          fontWeight: 600,
                          border: gameState.completedGroups.has(group.id) 
                            ? `2px solid ${RHYME_GROUP_COLORS[index % RHYME_GROUP_COLORS.length]}` 
                            : '1px solid rgba(255, 215, 0, 0.3)',
                          backdropFilter: 'blur(4px)',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }}
                      />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Game Grid Layout */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 3,
            direction: i18n.dir() === 'rtl' ? 'rtl' : 'ltr'
          }}>
            <Grid 
              container 
              spacing={1} 
              sx={{ 
                maxWidth: challenge?.gridSize === '8x8' ? '600px' : '400px',
                width: '100%'
              }}
            >
              {gameState.cards.map((card) => (
                <Grid 
                  item 
                  xs={challenge?.gridSize === '8x8' ? 1.5 : 3} 
                  key={card.id}
                >
                  <Card
                    onClick={() => handleCardClick(card)}
                    sx={{
                      height: getDynamicTileSettings(card.word, isMobile).tileHeight,
                      cursor: card.isMatched ? 'default' : 'pointer',
                      opacity: card.isMatched ? 0.6 : 1,
                      bgcolor: card.isRevealed ? getPatternColor(challenge?.type || 'default') : 'background.paper',
                      border: card.isRevealed ? '2px solid' : '1px solid',
                      borderColor: card.isRevealed ? getPatternColor(challenge?.type || 'default') : 'divider',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: card.isMatched ? 'none' : 'scale(1.02)', // Reduced scale to prevent layout issues with variable heights
                        boxShadow: card.isMatched ? 'none' : '0 4px 8px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      p: 1, 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      '&:last-child': { pb: 1 }
                    }}
                    onMouseEnter={() => {
                      // Play word pronunciation on hover for phonetic learning
                      if (!card.isRevealed) {
                        audioService.playWordPronunciation(card.word);
                      }
                    }}
                    >
                      {renderVerticalWord(card.word, getDynamicTileSettings(card.word, isMobile), card.isRevealed)}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Mobile-Optimized Game Controls */}
          <Box display="flex" justifyContent="center" gap={isMobile ? 2 : 3} mb={3}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={returnToModeSelection}
              sx={{ 
                minWidth: isMobile ? '140px' : '140px',
                minHeight: isMobile ? 48 : 44,
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: 600,
                borderColor: 'rgba(255, 215, 0, 0.5)',
                color: '#FFD700',
                backdropFilter: 'blur(8px)',
                bgcolor: 'rgba(26, 26, 46, 0.6)',
                '&:hover': {
                  borderColor: '#FFD700',
                  bgcolor: 'rgba(255, 215, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              New Game
            </Button>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setShowHelp(true)}
              sx={{ 
                minWidth: isMobile ? '120px' : '120px',
                minHeight: isMobile ? 48 : 44,
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: 600,
                borderColor: 'rgba(255, 215, 0, 0.5)',
                color: '#FFD700',
                backdropFilter: 'blur(8px)',
                bgcolor: 'rgba(26, 26, 46, 0.6)',
                '&:hover': {
                  borderColor: '#FFD700',
                  bgcolor: 'rgba(255, 215, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              Help
            </Button>
          </Box>

          {/* Game Over Modal - Gentle Backdrop */}
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
            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.25)', // Much more transparent - was default 0.5
                backdropFilter: 'blur(2px)' // Gentle blur instead of heavy opacity
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

          {/* Enhanced Help Dialog - Gentle Backdrop */}
          <Dialog 
            open={showHelp} 
            onClose={() => setShowHelp(false)} 
            maxWidth="md" 
            fullWidth
            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.25)', // Much more transparent
                backdropFilter: 'blur(2px)' // Gentle blur
              }
            }}
          >
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

      {/* Simplified Particle Effects (much fewer, only for major events) */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 0, scale: 0.5, y: -50 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            position: 'fixed',
            left: particle.x,
            top: particle.y,
            fontSize: '20px',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}

      {/* Simplified Combo Popup (less frequent, shorter duration) */}
      <AnimatePresence>
        {showComboPopup.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                color: 'white',
                textAlign: 'center',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {showComboPopup.combo}x COMBO!
              </Typography>
              <Typography variant="body2">
                +{showComboPopup.score.toLocaleString()} points
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Error Display */}
      {error && (
        <Snackbar 
          open={true} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 1000 }}
        >
          <Alert 
            severity="error" 
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => {
                    setError(null);
                    if (selectedMode) {
                      startGame(selectedMode);
                    }
                  }}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
                <IconButton 
                  color="inherit" 
                  size="small" 
                  onClick={() => setError(null)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{
              backgroundColor: 'rgba(211, 47, 47, 0.9)',
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' },
              minWidth: '400px'
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {error.includes('fetch') || error.includes('network') ? 'Connection Error' : 'Game Error'}
              </Typography>
              <Typography variant="body2">
                {error.includes('Unable to start game') 
                  ? 'Having trouble loading the game. Please check your connection and try again.'
                  : error.includes('fetch') 
                  ? 'Unable to connect to game servers. Please check your internet connection.'
                  : 'Something went wrong. Please try starting a new game.'
                }
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      )}

      {/* Loading State with Better UX */}
      {loadingContent && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            backdropFilter: 'blur(4px)'
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(13, 13, 23, 0.95))',
              color: 'white',
              borderRadius: 3,
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <CircularProgress 
              size={60} 
              sx={{ 
                color: '#FFD700',
                mb: 3,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }} 
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              Preparing Your Game
            </Typography>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
              Generating word patterns and setting up the challenge...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity={isOfflineMode ? "warning" : "error"} 
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
          {isOfflineMode && " - Playing in offline mode"}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FlowFinder; 