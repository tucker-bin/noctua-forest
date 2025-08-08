import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  useTheme, 
  useMediaQuery, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Container,
  Card,
  Divider,
  IconButton,
  Modal,
  Backdrop,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '../../services/audioService';
import { RhymeMahjongPuzzleService } from '../../services/rhymeMahjongPuzzleService';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InfoIcon from '@mui/icons-material/Info';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Component props interface
interface RhymeMahjongProps {
  customText?: string; // Optional custom text for puzzle generation
  onCustomComplete?: () => void; // Callback when custom puzzle is completed
}

// Scrolling text component for long words
const ScrollingText: React.FC<{ 
  children: string; 
  maxWidth?: number;
  fontSize?: string;
}> = ({ children, maxWidth = 45, fontSize = '10px' }) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const [textRef, setTextRef] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (textRef) {
      const textWidth = textRef.scrollWidth;
      const containerWidth = maxWidth;
      setShouldScroll(textWidth > containerWidth);
    }
    
    // Cleanup function to reset scroll state if component unmounts
    return () => {
      setShouldScroll(false);
    };
  }, [children, maxWidth, textRef]);

  // LED-style scroll timing: pause, scroll, pause
  const scrollDuration = Math.max(4, children.length * 0.25);

  if (!shouldScroll) {
    // Short text - display normally centered
    return (
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'bold',
          fontSize: fontSize,
          lineHeight: 1,
          textAlign: 'center',
          color: 'inherit',
          textShadow: '1px 1px 1px rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: `${maxWidth}px`
        }}
      >
        {children}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        width: `${maxWidth}px`,
        overflow: 'hidden',
        position: 'relative',
        height: '12px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Typography
        ref={setTextRef}
        variant="body2"
        sx={{
          fontWeight: 'bold',
          fontSize: fontSize,
          lineHeight: 1,
          color: 'inherit',
          textShadow: '1px 1px 1px rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap',
          width: 'max-content',
          animation: `ledScroll ${scrollDuration}s ease-in-out infinite`,
          animationDelay: '0.5s', // Small delay before starting
          '@keyframes ledScroll': {
            '0%': {
              transform: `translateX(2px)` // Start slightly right
            },
            '15%': {
              transform: `translateX(2px)` // Pause at start
            },
            '75%': {
              transform: `translateX(calc(${maxWidth}px - 100% - 2px))` // Scroll to show end
            },
            '100%': {
              transform: `translateX(calc(${maxWidth}px - 100% - 2px))` // Pause at end
            }
          }
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

export interface MahjongTile {
  id: string;
  content: string;
  rhymeGroups: string[]; // Multiple rhyme groups for layered recognition
  layer: number;
  row: number;
  col: number;
  isSelectable: boolean;
  isSelected: boolean;
  isRemoved: boolean;
  position: { x: number; y: number };
  gridX: number;
  gridY: number;
  isHinted?: boolean;
  pairId: string; // Unique identifier for the matching pair
  phoneticPattern?: string; // Additional phonetic information for advanced matching
}

// Traditional Mahjong Solitaire "Turtle" Layout - 144 tiles (72 pairs)
const TRADITIONAL_TURTLE_LAYOUT = [
  // Layer 0 (Base) - 56 tiles
      { layer: 0, positions: [
    // Left wing (6 tiles)
    [0, 3], [0, 4], [0, 5],
    [1, 3], [1, 4], [1, 5],
    // Main body (38 tiles)
    [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9],
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10],
    [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10],
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9],
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [7, 9],
    // Right wing (6 tiles)
    [8, 3], [8, 4], [8, 5],
    [9, 3], [9, 4], [9, 5],
    // Head (4 tiles)
    [4, 11], [5, 11],
    // Tail (2 tiles)
    [4, -1], [5, -1]
  ]},
  // Layer 1 (Middle) - 40 tiles
      { layer: 1, positions: [
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
    [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8],
    [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
    [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9],
    [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8],
    [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8]
  ]},
  // Layer 2 (Upper) - 28 tiles
      { layer: 2, positions: [
    [2, 3], [2, 4], [2, 5], [2, 6], [2, 7],
    [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
    [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8],
    [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8],
    [6, 3], [6, 4], [6, 5], [6, 6], [6, 7],
    [7, 3], [7, 4], [7, 5], [7, 6], [7, 7]
  ]},
  // Layer 3 (High) - 14 tiles
  { layer: 3, positions: [
    [3, 4], [3, 5], [3, 6],
    [4, 3], [4, 4], [4, 5], [4, 6], [4, 7],
    [5, 3], [5, 4], [5, 5], [5, 6], [5, 7],
    [6, 4], [6, 5], [6, 6]
  ]},
  // Layer 4 (Peak) - 6 tiles
  { layer: 4, positions: [
    [4, 4], [4, 5], [4, 6],
    [5, 4], [5, 5], [5, 6]
  ]}
];

// Traditional Mahjong tile dimensions
const TILE_DIMENSIONS = {
  width: 48,
  height: 64,
  spacing: 4,
  layerOffset: { x: 3, y: 3 }
};

// Traditional Mahjong Tile Component
const TraditionalMahjongTile: React.FC<{
  tile: MahjongTile;
  style: React.CSSProperties;
  onClick: (id: string) => void;
}> = ({ tile, style, onClick }) => {
  const theme = useTheme();
  
  const getTileStyle = () => {
    // Traditional ivory/bone color for base
    let background = 'linear-gradient(145deg, #f5f5dc, #e6e6d4)';
    let cursor = 'not-allowed';
    let color = '#999';
    let border = '2px solid #d3d3d3';
    let boxShadow = '2px 2px 6px rgba(0, 0, 0, 0.3)';

    if (tile.isSelectable) {
      background = 'linear-gradient(145deg, #fffffb, #f5f5dc)';
      cursor = 'pointer';
      color = '#2c3e50';
      border = '2px solid #8b7355';
      boxShadow = '3px 3px 8px rgba(0, 0, 0, 0.4)';
    }

    if (tile.isHinted && !tile.isSelected) {
      background = 'linear-gradient(145deg, #fff3cd, #ffeaa7)';
      color = '#856404';
      border = '3px solid #ffc107';
      boxShadow = '0 0 15px rgba(255, 193, 7, 0.6), 3px 3px 8px rgba(0, 0, 0, 0.4)';
    }

    if (tile.isSelected) {
      background = 'linear-gradient(145deg, #d4edda, #c3e6cb)';
      color = '#155724';
      border = '3px solid #28a745';
      boxShadow = '0 0 20px rgba(40, 167, 69, 0.8), 3px 3px 8px rgba(0, 0, 0, 0.4)';
    }

    return {
      background,
      cursor,
      color,
      border,
      boxShadow,
      borderRadius: '6px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '11px',
      transition: 'all 0.2s ease-in-out',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      userSelect: 'none' as const,
      fontFamily: '"Roboto Mono", monospace'
    };
  };

  return (
    <motion.div
      whileHover={tile.isSelectable ? { scale: 1.05, y: -2 } : {}}
      whileTap={tile.isSelectable ? { scale: 0.95 } : {}}
      style={{
        ...style,
        ...getTileStyle()
      }}
      onClick={() => tile.isSelectable && onClick(tile.id)}
    >
      {/* Layer depth indicator */}
      {tile.layer > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '50%',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {tile.layer}
        </Box>
      )}
      
      {/* Rhyme group indicator - only show when hinted */}
      {tile.isHinted && (
        <Box
          sx={{
            position: 'absolute',
            top: 3,
            left: 3,
            fontSize: '8px',
            fontWeight: 'bold',
            color: 'rgba(0, 0, 0, 0.5)',
            maxWidth: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={`Rhyme groups: ${tile.rhymeGroups.join(', ')}${tile.phoneticPattern ? ` (${tile.phoneticPattern})` : ''}`}
        >
          {tile.rhymeGroups[0]}
          {tile.rhymeGroups.length > 1 && <span style={{ color: 'gold' }}>+{tile.rhymeGroups.length - 1}</span>}
        </Box>
      )}
      
      {/* Main word content - horizontal traditional layout */}
      <ScrollingText
        children={tile.content}
        maxWidth={45}
        fontSize="10px"
      />
    </motion.div>
  );
};

// Star display component
const StarDisplay: React.FC<{ rating: number; canEarn: boolean }> = ({ rating, canEarn }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {[1, 2, 3].map((star) => (
        <Box key={star} sx={{ opacity: canEarn ? 1 : 0.5 }}>
          {star <= rating ? (
            <StarIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
          ) : (
            <StarBorderIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
          )}
        </Box>
      ))}
    </Box>
  );

// Main Game Component
const RhymeMahjong: React.FC<RhymeMahjongProps> = ({ customText, onCustomComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tiles, setTiles] = useState<MahjongTile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchesFound, setMatchesFound] = useState(0);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [hintedTiles, setHintedTiles] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isHintActive, setIsHintActive] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Add continuous elapsed time state
  
  // Puzzle service state
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [puzzleError, setPuzzleError] = useState<string | null>(null);
  const puzzleService = useMemo(() => RhymeMahjongPuzzleService.getInstance(), []);

  // Add continuous timer effect
  useEffect(() => {
    if (gameComplete) return; // Stop timer when game is complete
    
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, [startTime, gameComplete]);

  // Reset timer when new tiles are generated
  useEffect(() => {
    if (tiles.length > 0 && !gameComplete) {
      setStartTime(Date.now());
      setElapsedTime(0);
    }
  }, [tiles.length, gameComplete]); // Reset timer when new game starts

  // Responsive scaling
  const scale = isMobile ? 0.7 : 1.0;
  const scaledDimensions = {
    width: TILE_DIMENSIONS.width * scale,
    height: TILE_DIMENSIONS.height * scale,
    spacing: TILE_DIMENSIONS.spacing * scale,
    layerOffset: {
      x: TILE_DIMENSIONS.layerOffset.x * scale,
      y: TILE_DIMENSIONS.layerOffset.y * scale
    }
  };

  // Load puzzle when difficulty changes or custom text is provided
  useEffect(() => {
    const loadPuzzle = async () => {
      setIsLoadingPuzzle(true);
      setPuzzleError(null);
      
      try {
        // Use hybrid approach: custom text -> backend analysis, standard -> curated vocabulary
        const generatedPuzzle = await puzzleService.generatePuzzle(difficulty, customText);
        const difficultyConfig = puzzleService.getDifficultyConfig(difficulty);
        
        if (difficultyConfig) {
          setCurrentPuzzle({
            name: customText ? 'Custom Puzzle' : difficultyConfig.name,
            description: customText ? 'Generated from your text' : difficultyConfig.description,
            layoutComplexity: difficultyConfig.layoutComplexity,
            rhymeGroups: generatedPuzzle.rhymeGroups,
            isCustom: !!customText,
            metadata: generatedPuzzle.metadata
          });
          
          // Log puzzle generation method for debugging
          console.log('Puzzle generated:', {
            method: customText ? 'custom_text' : 'curated_vocabulary',
            source: generatedPuzzle.metadata?.source || 'curated',
            fallbackUsed: generatedPuzzle.metadata?.fallbackUsed || false,
            supplemented: generatedPuzzle.metadata?.supplemented || false,
            groupCount: generatedPuzzle.metadata?.groupCount || 0,
            totalWords: generatedPuzzle.metadata?.totalWords || 0
          });
        }
      } catch (error) {
        setPuzzleError(error instanceof Error ? error.message : 'Failed to load puzzle');
        console.error('Error loading puzzle:', error);
      } finally {
        setIsLoadingPuzzle(false);
      }
    };

    loadPuzzle();
  }, [difficulty, customText, puzzleService]); // Added customText to dependencies

  // Generate traditional Mahjong layout with proper pairing
  const generateTraditionalLayout = useCallback((): MahjongTile[] => {
    if (!currentPuzzle) return [];
    
    const rhymeWords = currentPuzzle.rhymeGroups || [];
    if (rhymeWords.length === 0) return [];
    
    const tiles: Omit<MahjongTile, 'position' | 'isSelectable' | 'isSelected'>[] = [];
    let idCounter = 0;
    
    // Calculate total positions (traditional turtle layout has 144 tiles = 72 pairs)
    const totalPositions = TRADITIONAL_TURTLE_LAYOUT.reduce(
      (sum, layer) => sum + layer.positions.length, 0
    );
    const pairsNeeded = totalPositions / 2; // 72 pairs
    
    // Create better word distribution - use all words before repeating
    const wordPairs: Array<{ word: string; group: string; pairId: string }> = [];
    
    // Strategy: Cycle through all available words, then repeat if needed
    const allWords = [...rhymeWords]; // Copy the array
    let wordIndex = 0;
    
    for (let pairIndex = 0; pairIndex < pairsNeeded; pairIndex++) {
      // Get next word, cycling through all available words
      const wordData = allWords[wordIndex % allWords.length];
      const pairId = `pair_${pairIndex}`;
      
      // Create exactly two tiles for this pair
      wordPairs.push({ ...wordData, pairId });
      wordPairs.push({ ...wordData, pairId });
      
      wordIndex++;
      
      // If we've used all words, shuffle them for better variety in next cycle
      if (wordIndex % allWords.length === 0 && wordIndex < pairsNeeded) {
        // Shuffle the word array for next cycle to create different patterns
        allWords.sort(() => Math.random() - 0.5);
      }
    }
    
    // Shuffle the pairs for random distribution while maintaining pair relationships
    wordPairs.sort(() => Math.random() - 0.5);
    
    // Generate tiles for each layer position
    let wordPairIndex = 0;
    TRADITIONAL_TURTLE_LAYOUT.forEach(({ layer, positions }) => {
      positions.forEach(([gridX, gridY]) => {
        if (wordPairIndex >= wordPairs.length) {
          console.warn('Not enough word pairs for all positions');
          return;
        }
        
        const wordData = wordPairs[wordPairIndex];
        
                  tiles.push({
            id: `tile-${idCounter++}`,
            content: wordData.word,
            rhymeGroups: (wordData as any).groups || [wordData.group], // Use multiple groups if available
            layer,
            row: gridY,
            col: gridX,
            gridX,
            gridY,
            isRemoved: false,
            pairId: wordData.pairId,
            phoneticPattern: (wordData as any).phonetic
          });
        
        wordPairIndex++;
      });
    });

    // Calculate positions and update selectability
    const positionedTiles = calculateTilePositions(tiles);
    return updateSelectability(positionedTiles);
  }, [currentPuzzle]);

  // Initialize board
  useEffect(() => {
    if (!currentPuzzle) return;
    
    const initialTiles = generateTraditionalLayout();
    setTiles(initialTiles);
    
    // Reset game state
    setMatchesFound(0);
    setSelectedIds([]);
    setStartTime(Date.now());
    setGameComplete(false);
    setHintedTiles([]);
    setHintsUsed(0);
  }, [generateTraditionalLayout, currentPuzzle]);

  // Calculate pixel positions for tiles
  const calculateTilePositions = (tileList: any[]): any[] => {
    return tileList.map(tile => {
      const x = tile.gridX * (scaledDimensions.width + scaledDimensions.spacing) + 
                tile.layer * scaledDimensions.layerOffset.x;
      const y = tile.gridY * (scaledDimensions.height + scaledDimensions.spacing) + 
                tile.layer * scaledDimensions.layerOffset.y;
      return { ...tile, position: { x, y } };
    });
  };

  // Check if tile is exposed (not covered by other tiles)
  const isTileExposed = (tile: MahjongTile, allTiles: MahjongTile[]): boolean => {
    if (tile.isRemoved) return false;
    
    const tileAbove = allTiles.find(t => 
      !t.isRemoved &&
      t.layer === tile.layer + 1 &&
      Math.abs(t.gridX - tile.gridX) <= 0.5 &&
      Math.abs(t.gridY - tile.gridY) <= 0.5
    );
    
    return !tileAbove;
  };

  // Check if tile has free sides (left or right edge is open)
  const hasFreeEdge = (tile: MahjongTile, allTiles: MahjongTile[]): boolean => {
    if (tile.isRemoved) return false;
    
    const leftBlocked = allTiles.some(t => 
      !t.isRemoved &&
      t.layer === tile.layer &&
      t.gridX === tile.gridX - 1 &&
      t.gridY === tile.gridY
    );
    
    const rightBlocked = allTiles.some(t => 
      !t.isRemoved &&
      t.layer === tile.layer &&
      t.gridX === tile.gridX + 1 &&
      t.gridY === tile.gridY
    );
    
    return !leftBlocked || !rightBlocked;
  };

  // Update which tiles are selectable - optimized with memoization
  const updateSelectability = useCallback((allTiles: MahjongTile[]): MahjongTile[] => {
    return allTiles.map(tile => ({
      ...tile,
      isSelectable: !tile.isRemoved && isTileExposed(tile, allTiles) && hasFreeEdge(tile, allTiles)
    }));
  }, []);

  // Memoized calculation for tile selectability
  const selectableTiles = useMemo(() => {
    return updateSelectability(tiles);
  }, [tiles, updateSelectability]);

  // Add ref to track matching timeout
  const matchingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Match checking logic
  useEffect(() => {
    if (selectedIds.length !== 2) return;

    // Clear any existing timeout to prevent race conditions
    if (matchingTimeoutRef.current) {
      clearTimeout(matchingTimeoutRef.current);
      matchingTimeoutRef.current = null;
    }

    const [id1, id2] = selectedIds;
    const tile1 = tiles.find(t => t.id === id1);
    const tile2 = tiles.find(t => t.id === id2);

    matchingTimeoutRef.current = setTimeout(() => {
      // Check if tiles belong to the same rhyme group (rhyme-based matching)
      if (tile1 && tile2 && tile1.rhymeGroups.some(group => tile2.rhymeGroups.includes(group)) && tile1.id !== tile2.id) {
        // Rhyme match found
        audioService.playCardMatch();
        setMatchesFound(prev => prev + 1);
        
        setTiles(prevTiles => {
          const newTiles = prevTiles.map(t =>
            t.id === id1 || t.id === id2 ? { ...t, isRemoved: true } : t
          );
          const updatedTiles = updateSelectability(newTiles);
          
          // Check if game is complete
          const remainingTiles = updatedTiles.filter(t => !t.isRemoved);
          if (remainingTiles.length === 0) {
            setTimeout(() => {
              setGameComplete(true);
              setCompletionTime(Date.now() - startTime);
              audioService.playGameWon();
              
              // Call custom completion callback if provided
              if (customText && onCustomComplete) {
                onCustomComplete();
              }
            }, 500);
          }
          
          return updatedTiles;
        });
      } else {
        // No match
        audioService.playCardMismatch();
      }
      setSelectedIds([]);
      matchingTimeoutRef.current = null;
    }, 600);

    return () => {
      if (matchingTimeoutRef.current) {
        clearTimeout(matchingTimeoutRef.current);
        matchingTimeoutRef.current = null;
      }
    };
  }, [selectedIds, startTime, customText, onCustomComplete]); // Removed 'tiles' to prevent race conditions

  // Handle tile clicks
  const handleTileClick = useCallback((tileId: string) => {
    const tile = selectableTiles.find(t => t.id === tileId);
    if (!tile || !tile.isSelectable || tile.isRemoved) return;

    audioService.playCardClick();

    setSelectedIds(prev => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else if (prev.length >= 2) {
        return [prev[1], tileId];
      } else {
        return [...prev, tileId];
      }
    });
  }, [selectableTiles]);

  // Enhanced hint finding with layered rhyme support
  const findHintPair = (): string[] => {
    const availableTiles = selectableTiles.filter(tile => tile.isSelectable && !tile.isRemoved);
    
    // Prioritize matches: 1. Exact rhyme group matches, 2. Phonetic pattern matches, 3. Any shared group
    for (let priority = 1; priority <= 3; priority++) {
      for (let i = 0; i < availableTiles.length; i++) {
        for (let j = i + 1; j < availableTiles.length; j++) {
          const tile1 = availableTiles[i];
          const tile2 = availableTiles[j];
          
          if (tile1.id === tile2.id) continue;
          
          let isMatch = false;
          
          if (priority === 1) {
            // Priority 1: Exact primary rhyme group match
            isMatch = tile1.rhymeGroups[0] === tile2.rhymeGroups[0];
          } else if (priority === 2) {
            // Priority 2: Phonetic pattern similarity
            if (tile1.phoneticPattern && tile2.phoneticPattern) {
              const pattern1 = tile1.phoneticPattern.split('/').join('');
              const pattern2 = tile2.phoneticPattern.split('/').join('');
              // Simple phonetic similarity check (ending sounds)
              isMatch = pattern1.slice(-3) === pattern2.slice(-3);
            }
          } else {
            // Priority 3: Any shared rhyme group
            isMatch = tile1.rhymeGroups.some(group => tile2.rhymeGroups.includes(group));
          }
          
          if (isMatch) {
            return [tile1.id, tile2.id];
          }
        }
      }
    }
    
    return [];
  };

  // Handle hint button click
  const handleHint = () => {
    // Prevent hint spamming
    if (isHintActive) return;
    
    const hintPair = findHintPair();
    if (hintPair.length === 2) {
      setHintedTiles(hintPair);
      setHintsUsed(prev => prev + 1);
      setIsHintActive(true);
      audioService.playCardClick();
      
      setTimeout(() => {
        setHintedTiles([]);
        setIsHintActive(false);
      }, 3000);
    }
  };

  // Handle new game
  const handleNewGame = () => {
    if (!currentPuzzle) return;
    
    audioService.playCardClick();
    const newTiles = generateTraditionalLayout();
    setTiles(newTiles);
    setMatchesFound(0);
    setSelectedIds([]);
    setHintedTiles([]);
    setHintsUsed(0);
    setStartTime(Date.now());
    setGameComplete(false);
    setCompletionTime(0);
  };

  // Calculate completion stats
  const getCompletionStats = () => {
    const totalTiles = tiles.length;
    const removedTiles = tiles.filter(t => t.isRemoved).length;
    const remainingTiles = totalTiles - removedTiles;
    const percentageComplete = totalTiles > 0 ? Math.round((removedTiles / totalTiles) * 100) : 0;
    
    let stars = 0;
    if (percentageComplete >= 90) stars = 3;
    else if (percentageComplete >= 75) stars = 2;
    else if (percentageComplete >= 50) stars = 1;
    
    return { totalTiles, removedTiles, remainingTiles, percentageComplete, stars };
  };

  // Format elapsed time for display
  const formatElapsedTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate board bounds for centering
   const boardBounds = useMemo(() => {
    if (tiles.length === 0) return { width: 600, height: 400, offsetX: 50, offsetY: 50 };
     
     const maxX = Math.max(...tiles.map(t => t.position.x + scaledDimensions.width));
     const maxY = Math.max(...tiles.map(t => t.position.y + scaledDimensions.height));
     const minX = Math.min(...tiles.map(t => t.position.x));
     const minY = Math.min(...tiles.map(t => t.position.y));
     
     return {
       width: maxX - minX + 100,
       height: maxY - minY + 100,
       offsetX: -minX + 50,
       offsetY: -minY + 50
     };
   }, [tiles, scaledDimensions]);

  // Update tile selection and hint state
  const tilesWithSelection = useMemo(() => {
    return tiles.map(tile => ({
      ...tile,
      isSelected: selectedIds.includes(tile.id),
      isHinted: hintedTiles.includes(tile.id)
    }));
  }, [tiles, selectedIds, hintedTiles]);

  // Handle hint functionality
  const provideHint = useCallback(() => {
    if (hintsUsed >= 3) return; // Max 3 hints
    
    // Find selectable tiles that can form matches
    const selectableTiles = tiles.filter(tile => tile.isSelectable && !tile.isRemoved);
    if (selectableTiles.length < 2) return;
    
    // Find tiles that have matching rhyme groups
    const rhymeGroups = new Map<string, MahjongTile[]>();
    selectableTiles.forEach(tile => {
      const groups = tile.rhymeGroups || []; // Use only rhymeGroups array
      groups.forEach(group => {
        if (!rhymeGroups.has(group)) {
          rhymeGroups.set(group, []);
        }
        rhymeGroups.get(group)!.push(tile);
      });
    });
    
    // Find first group with at least 2 selectable tiles
    for (const [group, groupTiles] of rhymeGroups) {
      if (groupTiles.length >= 2) {
        // Highlight first 2 tiles in this group
        const tilesToHint = groupTiles.slice(0, 2);
        setHintedTiles(prev => [...prev, ...tilesToHint.map(t => t.id)]);
        setHintsUsed(prev => prev + 1);
        setIsHintActive(true);
        
        // Clear hint after 3 seconds
        setTimeout(() => {
          setHintedTiles([]);
          setIsHintActive(false);
        }, 3000);
        
        audioService.playCardMatch(); // Fix: use existing audio method
        break;
      }
    }
  }, [tiles, hintsUsed]);

  // Reset game function
  const resetGame = useCallback(() => {
    setTiles([]);
    setSelectedIds([]);
    setMatchesFound(0);
    setHintedTiles([]);
    setHintsUsed(0);
    setIsHintActive(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setGameComplete(false);
    setCompletionTime(0);
  }, []);

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      color: theme.palette.text.primary, 
      minHeight: 'calc(100vh - 64px)', 
      p: 2
    }}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        
        {/* Game Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            🀄 Traditional Rhyme Mahjong
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Match identical rhyming words in pairs. Only exposed tiles with free edges can be selected.
          </Typography>
        </Box>
        
        {/* Settings and Stats Panel */}
        <Card sx={{ p: 2, mb: 3, bgcolor: theme.palette.background.paper }}>
          
          {/* Settings Row */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isLoadingPuzzle}
              >
                {puzzleService.getAvailableDifficulties().map((key) => {
                  const level = puzzleService.getDifficultyConfig(key);
                  return level ? (
                  <MenuItem key={key} value={key}>
                      {level.name}
                  </MenuItem>
                  ) : null;
                })}
              </Select>
            </FormControl>
              
            <Button 
              variant="contained" 
              startIcon={<RestartAltIcon />}
              onClick={handleNewGame}
              disabled={!currentPuzzle}
            >
              New Game
            </Button>
            
            <Button 
              variant="outlined"
              startIcon={<LightbulbIcon />}
              onClick={handleHint}
              disabled={isHintActive || findHintPair().length === 0}
            >
              {isHintActive ? 'Hint Active...' : `Hint (${hintsUsed})`}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Stats Row */}
          <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
            <Chip 
              icon={<StarIcon />}
              label={`${getCompletionStats().stars}/3 Stars`}
              color={getCompletionStats().stars > 0 ? "success" : "default"}
            />
            <Chip 
              label={`${getCompletionStats().percentageComplete}% Complete`}
              variant="outlined"
            />
            <Chip 
              label={`${matchesFound} Matches`}
              variant="outlined"
            />
            <Chip 
              label={`${getCompletionStats().remainingTiles} Tiles Left`}
              variant="outlined"
            />
            <Chip 
              label={`${formatElapsedTime(elapsedTime)}`}
              variant="outlined"
            />
          </Stack>
        </Card>

        {/* Loading State */}
        {isLoadingPuzzle && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading puzzle...
            </Typography>
          </Box>
        )}
        
        {/* Error State */}
        {puzzleError && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Error: {puzzleError}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
        )}

        {/* Game Board */}
        {currentPuzzle && !isLoadingPuzzle && !puzzleError && (
        <Box sx={{
          position: 'relative',
          width: boardBounds.width,
          height: boardBounds.height,
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: 2,
            backgroundColor: '#1a3d2e', // Traditional green felt background
          mx: 'auto',
            mb: 3,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3)'
        }}>
          <AnimatePresence mode="popLayout">
            {tilesWithSelection.map((tile) => (
              !tile.isRemoved && (
                <motion.div
                  key={tile.id}
                  layout
                    initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                  animate={{ 
                    opacity: 1, 
                      scale: tile.isSelected ? 1.1 : (tile.isHinted ? 1.05 : 1),
                      y: tile.isSelected ? -4 : (tile.isHinted ? -2 : 0),
                      rotateX: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.3, 
                      rotateX: 90,
                      y: -20,
                      transition: { duration: 0.4, ease: "easeIn" }
                  }}
                  transition={{ 
                      duration: 0.3, 
                    ease: "easeOut",
                      layout: { duration: 0.2 }
                  }}
                  style={{
                    position: 'absolute',
                    left: tile.position.x + boardBounds.offsetX,
                    top: tile.position.y + boardBounds.offsetY,
                      zIndex: tile.layer * 10 + (tile.isSelected ? 100 : 0)
                  }}
                >
                    <TraditionalMahjongTile
                    tile={tile}
                    style={{
                      width: scaledDimensions.width,
                      height: scaledDimensions.height
                    }}
                    onClick={handleTileClick}
                  />
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </Box>
        )}
      </Container>

      {/* Game Info and Controls */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            ⏰ {formatElapsedTime(elapsedTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🎯 {matchesFound} matches
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={provideHint}
            disabled={hintsUsed >= 3 || gameComplete}
            startIcon={<LightbulbIcon />}
            sx={{ minWidth: 100 }}
          >
            Hint ({3 - hintsUsed})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={resetGame}
            startIcon={<RestartAltIcon />}
          >
            Reset
          </Button>
        </Box>
      </Box>
        
        {/* Game Completion Modal */}
        <Modal
          open={gameComplete}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '400px' },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: 'center'
          }}>
            <Typography variant="h4" gutterBottom>
              🎉 Puzzle Complete!
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <StarDisplay rating={getCompletionStats().stars} canEarn={true} />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {getCompletionStats().percentageComplete}% Complete
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Time:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatElapsedTime(completionTime)}
              </Typography>
            </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Matches:</Typography>
              <Typography variant="body2" fontWeight="bold">{matchesFound}</Typography>
            </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Hints Used:</Typography>
              <Typography variant="body2" fontWeight="bold">{hintsUsed}</Typography>
            </Box>
            </Stack>
            
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleNewGame}>
                 Play Again
               </Button>
              <Button variant="outlined" onClick={() => setGameComplete(false)}>
                 Continue
               </Button>
            </Stack>
          </Box>
        </Modal>
        
      </Container>
    </Container>
  </Box>
  );
};

export default RhymeMahjong; 