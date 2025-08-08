import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Modal,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShareIcon from '@mui/icons-material/Share';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

// Define the structure of the puzzle data we expect from the API
interface PuzzleGroup {
  description: string;
  words: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

interface Puzzle {
  id: string;
  groups: PuzzleGroup[];
}

// Define props for the component
interface FlowFinderGameWrapperProps {
  puzzle?: Puzzle | null;
}

// Represents a single word card on the 4x4 grid
interface GameCard {
  word: string;
  groupDescription: string;
  isMatched: boolean;
  isSelected: boolean;
}

// Update colors to be semi-transparent for a "highlighter" effect
const difficultyColors = {
  easy: 'rgba(253, 240, 180, 0.7)',      // Light Yellow (~70% opacity)
  medium: 'rgba(166, 216, 168, 0.7)',    // Light Green (~70% opacity)
  hard: 'rgba(169, 210, 233, 0.7)',      // Light Blue (~70% opacity)
  expert: 'rgba(209, 196, 233, 0.7)',    // Light Purple (~70% opacity)
};

const difficultyEmoji = {
  easy: '🟨',
  medium: '🟩',
  hard: '🟦',
  expert: '🟪',
}

// Star display component
const StarDisplay: React.FC<{ rating: number; canEarn: boolean }> = ({ rating, canEarn }) => {
  return (
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
};

// Star gain animation component
const StarGainAnimation: React.FC<{ starsGained: number; show: boolean }> = ({ starsGained, show }) => {
  if (!show || starsGained === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.5 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#FFD700',
        padding: '16px 24px',
        borderRadius: '12px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <StarIcon sx={{ color: '#FFD700', fontSize: '2rem' }} />
      +{starsGained} Star{starsGained === 1 ? '' : 's'}!
    </motion.div>
  );
};

/**
 * Formats a raw backend description string into a user-friendly title and subtitle.
 * @param description The raw description from the puzzle API.
 * @returns An object with a title and subtitle.
 */
const formatDescription = (description: string): { title: string; subtitle: string } => {
  const soundMatch = description.match(/\/(.*?)\//);
  const sound = soundMatch ? soundMatch[0] : '';

  if (description.startsWith('rhyme pattern')) {
    return { title: 'Perfect Rhyme', subtitle: `Words ending in the ${sound} sound` };
  }
  if (description.startsWith('slant_rhyme')) {
    return { title: 'Slant Rhyme', subtitle: 'Words with similar, but not identical, end sounds' };
  }
  if (description.startsWith('internal_rhyme')) {
    return { title: 'Internal Rhyme', subtitle: 'Words that rhyme within the same phrase' };
  }
  if (description.startsWith('alliteration')) {
    const initialSoundMatch = description.match(/initial sound: (\w)/);
    const initialSound = initialSoundMatch ? initialSoundMatch[1] : '';
    return { title: 'Alliteration', subtitle: `Words starting with the '${initialSound}' sound` };
  }
  if (description.startsWith('assonance')) {
    return { title: 'Assonance', subtitle: `Repetition of the ${sound} vowel sound` };
  }
  if (description.startsWith('consonance')) {
    return { title: 'Consonance', subtitle: `Repetition of the ${sound} consonant sound` };
  }
  if (description.startsWith('sibilance')) {
    return { title: 'Sibilance', subtitle: 'Repetition of soft, hissing sounds (s, z, sh)' };
  }
  if (description.startsWith('fricative')) {
    return { title: 'Fricatives', subtitle: 'Words sharing sounds like /f/, /v/, or /th/' };
  }
  if (description.startsWith('plosive')) {
    return { title: 'Plosives', subtitle: 'Words sharing explosive sounds like /p/, /b/, or /t/' };
  }
  if (description.startsWith('liquid')) {
    return { title: 'Liquid Sounds', subtitle: 'Repetition of smooth sounds like /l/ or /r/' };
  }
  if (description.startsWith('nasal_harmony') || description.startsWith('nasal')) {
    return { title: 'Nasal Harmony', subtitle: 'Words with nasal sounds like /m/, /n/, or /ng/' };
  }
  if (description.startsWith('Regular rhythmic pattern')) {
    return { title: 'Metrical Feet', subtitle: 'Words that share the same stress pattern' };
  }

  // Fallback for any unhandled cases
  return { title: description.charAt(0).toUpperCase() + description.slice(1), subtitle: '' };
};


type GameStatus = 'loading' | 'playing' | 'error' | 'won';

export const FlowFinderGameWrapper: React.FC<FlowFinderGameWrapperProps> = ({ puzzle: puzzleProp = null }) => {
  const theme = useTheme();
  const [status, setStatus] = useState<GameStatus>('loading');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedGroups, setMatchedGroups] = useState<PuzzleGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [starRating, setStarRating] = useState(3);
  const [canEarnStars, setCanEarnStars] = useState(true);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [userStats, setUserStats] = useState<{
    totalStars: number;
    level: number;
    title: string;
    starsToNext: number;
    progress: number;
  } | null>(null);
  const [showStarGain, setShowStarGain] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const handleHint = async () => {
    if (status !== 'playing' || matchedGroups.length >= 3) {
      return;
    }

    // Record hint in backend for star penalty calculation
    try {
      await fetch('http://localhost:3001/api/puzzles/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleId: puzzle?.id
        }),
      });
    } catch (error) {
      console.error('Error recording hint:', error);
    }

    // Find the first group that hasn't been matched yet
    const unsolvedGroup = puzzle?.groups.find(
      (pg) => !matchedGroups.some((mg) => mg.description === pg.description)
    );

    if (unsolvedGroup) {
      // Add this group to the matched list
      const newMatchedGroups = [...matchedGroups, unsolvedGroup];
      setMatchedGroups(newMatchedGroups);

      // Update the grid to mark the hinted words as matched
      setGrid(currentGrid =>
        currentGrid.map(card =>
          unsolvedGroup.words.includes(card.word)
            ? { ...card, isSelected: false, isMatched: true }
            : card
        )
      );

      // Clear any user selections
      setSelectedCards([]);

      // Increment hints used (for UI display)
      setHintsUsed(prev => prev + 1);

      // Check for win condition
      if (newMatchedGroups.length === 4) {
        setStatus('won');
        setIsCompletionModalOpen(true);
        setToastMessage('Hint revealed the final group!');
      } else {
        setToastMessage('Hint used! A group has been revealed.');
      }
    }
  };

  const handleCorpusContribution = () => {
    const contributionMessage = `Contributed ${matchedGroups.length} linguistic patterns to Noctua corpus!`;
    // Track corpus contribution instead of sharing
    // log.userAction('Corpus contribution', {
    //   patterns: matchedGroups.length,
    //   difficulty: difficulty,
    //   userId: currentUser?.uid
    // });
  };

  const handleInfoClick = () => {
    setIsInfoDialogOpen(true);
  };

  const handleCloseInfoDialog = () => {
    setIsInfoDialogOpen(false);
  };

  const recordPuzzleCompletion = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/puzzles/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleId: puzzle?.id,
          starsEarned: starRating,
          userId: 'anonymous', // In real app, this would be the actual user ID
          hintsUsed,
          mistakes
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update user stats with level calculation
        setUserStats({
          totalStars: result.updatedStats.totalStars,
          level: result.updatedStats.currentLevel,
          title: 'Explorer', // This would come from the backend calculation
          starsToNext: result.updatedStats.starsToNextLevel,
          progress: 0.5 // This would be calculated based on current progress
        });
        
        // Show star gain animation
        if (starRating > 0) {
          setShowStarGain(true);
          setTimeout(() => setShowStarGain(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error recording puzzle completion:', error);
    }
  };

  // Fetch a new puzzle from our backend when the component mounts
  const fetchNewPuzzle = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // NOTE: This assumes the local dev server is running on port 3001
      // In a real app, this would come from an environment variable.
      const response = await fetch(`http://localhost:3001/api/puzzles/random`);
      if (!response.ok) {
        throw new Error('Failed to fetch a new puzzle. Please try again.');
      }
      const newPuzzle: Puzzle = await response.json();
      setPuzzle(newPuzzle);
      initializeGrid(newPuzzle);
      setStatus('playing');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (puzzleProp) {
      // If a puzzle is passed via props, use it
      setPuzzle(puzzleProp);
      initializeGrid(puzzleProp);
      setStatus('playing');
    } else {
      // Otherwise, fetch a new random puzzle
      fetchNewPuzzle();
    }
    // We only want this to run when the puzzle prop changes, or on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleProp, fetchNewPuzzle]);
  
  // Prepare the game grid once a puzzle is fetched
  const initializeGrid = (p: Puzzle) => {
    const allWords = p.groups.flatMap(group => 
      group.words.map(word => ({
        word,
        groupDescription: group.description,
        isMatched: false,
        isSelected: false,
      }))
    );
    // Shuffle the words to create the grid
    const shuffledGrid = allWords.sort(() => Math.random() - 0.5);
    setGrid(shuffledGrid);
    setSelectedCards([]);
    setMatchedGroups([]);
    // Reset game state
    setMistakes(0);
    setStarRating(3);
    setCanEarnStars(true);
    setHintsUsed(0);
    // Check if all groups have been matched
    if (matchedGroups.length === 3) { // 3 because state update is pending
        setStatus('won');
        setToastMessage('Congratulations! You solved the puzzle!');
    }
  };

  const handleCardClick = (clickedCard: GameCard) => {
    if (status !== 'playing' || clickedCard.isMatched) {
      return;
    }

    // Toggle selection
    const isAlreadySelected = selectedCards.some(c => c.word === clickedCard.word);

    let newSelectedCards: GameCard[];
    if (isAlreadySelected) {
      newSelectedCards = selectedCards.filter(c => c.word !== clickedCard.word);
    } else {
      if (selectedCards.length >= 4) {
        setToastMessage('You can only select 4 words at a time.');
        return;
      }
      newSelectedCards = [...selectedCards, clickedCard];
    }

    setSelectedCards(newSelectedCards);
    setGrid(currentGrid =>
      currentGrid.map(card =>
        card.word === clickedCard.word ? { ...card, isSelected: !card.isSelected } : card
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedCards.length !== 4) {
      setToastMessage('Please select exactly 4 words.');
      return;
    }

    try {
      const words = selectedCards.map(card => card.word);
      const response = await fetch('http://localhost:3001/api/puzzles/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          words,
          puzzleId: puzzle?.id 
        }),
      });

      const validation = await response.json();
      
      // Update mistake count and star rating from backend
      if (validation.mistakeCount !== undefined) {
        setMistakes(validation.mistakeCount);
      }
      if (validation.starRating !== undefined) {
        setStarRating(validation.starRating);
      }
      if (validation.canEarnStars !== undefined) {
        setCanEarnStars(validation.canEarnStars);
      }

      if (validation.isValid && validation.pattern?.isOfficial) {
        // Official pattern found - progresses game
        const firstGroup = selectedCards[0].groupDescription;
        const newMatchedGroups = [...matchedGroups, puzzle!.groups.find(g => g.description === firstGroup)!];
        setMatchedGroups(newMatchedGroups);

        setGrid(currentGrid =>
          currentGrid.map(card =>
            selectedCards.some(sc => sc.word === card.word)
              ? { ...card, isSelected: false, isMatched: true }
              : card
          )
        );
        setSelectedCards([]);
        
        if (newMatchedGroups.length === 4) {
          setStatus('won');
          setIsCompletionModalOpen(true);
          setToastMessage('Congratulations! You solved the puzzle!');
          // Record puzzle completion
          recordPuzzleCompletion();
        } else {
          setToastMessage('Correct!');
        }
      } else if (validation.isValid && validation.pattern?.isDiscovery) {
        // Discovery pattern - show encouraging message but don't progress
        const patternType = validation.pattern.type;
        setToastMessage(`${patternType.charAt(0).toUpperCase() + patternType.slice(1)}-pattern found, 0 points!`);
        setSelectedCards([]);
      } else {
        // Invalid pattern
        setToastMessage('Not a valid group. Try again!');
        setSelectedCards([]);
      }
    } catch (error) {
      console.error('Error validating pattern:', error);
      setToastMessage('Error validating pattern. Please try again.');
      setSelectedCards([]);
    }
  };

  const handleNewGame = () => {
    if (puzzleProp) {
        // This is handled by the buttons in App.tsx
    } else {
        fetchNewPuzzle();
    }
  }

  // When the game is won, we no longer show a separate screen.
  // The 'won' status will now be used to conditionally render new UI elements below the grid.

  if (status === 'loading') {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading a new puzzle...</Typography>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={fetchNewPuzzle} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Container>
    );
  }
  
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, color: theme.palette.text.primary, minHeight: 'calc(100vh - 64px)', p: 3 }}>
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
            Noctua Patterns
          </Typography>
          <IconButton onClick={handleInfoClick} color="primary" sx={{ ml: 1 }}>
            <InfoIcon />
          </IconButton>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, color: theme.palette.text.secondary }}>
          Find groups of four words that share linguistic patterns - sounds, rhymes, or rhythms.
        </Typography>
        
        {/* Matched Groups Display */}
        <Grid container spacing={1} sx={{ mb: 4 }}>
          {matchedGroups.map((group, index) => {
              const { title, subtitle } = formatDescription(group.description);
              const bgColor = difficultyColors[group.difficulty];
              return (
                <Grid item xs={12} key={index}>
                    <Card sx={{ 
                      p: 2, 
                      bgcolor: bgColor, 
                      color: theme.palette.text.primary 
                    }}>
                        <Typography variant="h6" fontWeight="bold">{title}</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>{subtitle}</Typography>
                        <Typography>{group.words.join(', ')}</Typography>
                    </Card>
                </Grid>
              )
          })}
        </Grid>

        <Grid container spacing={2}>
          {grid.filter(c => !c.isMatched).map((card, index) => (
            <Grid item xs={3} key={index}>
              <Card
                onClick={() => handleCardClick(card)}
                sx={{
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                  border: card.isSelected ? `2px solid ${theme.palette.secondary.main}` : '2px solid transparent',
                  transform: card.isSelected ? 'scale(1.05)' : 'scale(1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <Typography variant="body1">{card.word}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Game Controls - Always Visible */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
          {status === 'won' && !isCompletionModalOpen ? (
            // Post-completion controls
            <Box sx={{display: 'flex', gap: 2}}>
              {!puzzleProp && (
                <Button 
                  variant="contained" 
                  onClick={handleNewGame}
                  size="large"
                >
                  Next Puzzle
                </Button>
              )}
              <Button 
                variant="outlined" 
                startIcon={<ShareIcon />}
                onClick={handleCorpusContribution}
                size="large"
              >
                Patterns Recorded
              </Button>
            </Box>
          ) : status !== 'won' ? (
            // Regular game controls
            <>
              <Box sx={{display: 'flex', gap: 2}}>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit} 
                  disabled={selectedCards.length !== 4}
                  size="large"
                >
                  Submit
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<LightbulbIcon />}
                  onClick={handleHint}
                  disabled={status !== 'playing' || matchedGroups.length >= 3}
                >
                  Hint
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <StarDisplay rating={starRating} canEarn={canEarnStars} />
                <Typography variant="body2" color="text.secondary">
                  Mistakes: {mistakes}/3 | Hints: {hintsUsed}
                </Typography>
              </Box>
            </>
          ) : null}
        </Box>


        <Snackbar
          open={!!toastMessage}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          message={toastMessage}
        />

        {/* Star Gain Animation */}
        <AnimatePresence>
          <StarGainAnimation starsGained={starRating} show={showStarGain} />
        </AnimatePresence>
      </Container>

      <Dialog open={isInfoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Pattern Types</Typography>
            <IconButton onClick={handleCloseInfoDialog} color="primary">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Noctua Patterns uses colors to indicate difficulty levels of the linguistic patterns you discover.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: 'rgba(253, 240, 180, 0.7)', textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">🟨 Easy</Typography>
                <Typography variant="body2">Common patterns like basic alliteration</Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: 'rgba(166, 216, 168, 0.7)', textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">🟩 Medium</Typography>
                <Typography variant="body2">Moderate patterns like consonance</Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: 'rgba(169, 210, 233, 0.7)', textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">🟦 Hard</Typography>
                <Typography variant="body2">Advanced patterns like assonance</Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: 'rgba(209, 196, 233, 0.7)', textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">🟪 Expert</Typography>
                <Typography variant="body2">Complex patterns like perfect rhyme</Typography>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
            After completing a puzzle, you'll see detailed explanations of each pattern you discovered!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Completion Modal - Clean overlay instead of inline content */}
      <Modal
        open={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        aria-labelledby="completion-modal-title"
        aria-describedby="completion-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '60%' },
          maxWidth: 600,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <Typography id="completion-modal-title" variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
            🎉 Puzzle Complete!
          </Typography>
          
          {/* Star Rating Display */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
            <StarDisplay rating={starRating} canEarn={true} />
            <Typography variant="body1" color="text.secondary">
              {starRating === 3 ? 'Perfect!' : starRating === 2 ? 'Great!' : starRating === 1 ? 'Good!' : 'Practice Mode'}
              {starRating > 0 && ` • ${mistakes} mistake${mistakes === 1 ? '' : 's'} • ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}`}
            </Typography>
          </Box>

          {/* User Level Display */}
          {userStats && (
            <Box sx={{ textAlign: 'center', mb: 3, p: 2, bgcolor: 'rgba(255, 215, 0, 0.1)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                Level {userStats.level} • {userStats.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Stars: {userStats.totalStars} • {userStats.starsToNext} stars to next level
              </Typography>
            </Box>
          )}
          
          {/* Patterns Summary - Simplified */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: theme.palette.primary.main, textAlign: 'center' }}>
            Patterns Discovered: {matchedGroups.length}/4
          </Typography>
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {matchedGroups.map((group, index) => {
              const { title } = formatDescription(group.description);
              return (
                <Grid item xs={6} key={index}>
                  <Card sx={{ 
                    p: 1.5, 
                    bgcolor: difficultyColors[group.difficulty],
                    textAlign: 'center',
                    minHeight: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">{title}</Typography>
                    <Chip 
                      label={group.difficulty.charAt(0).toUpperCase() + group.difficulty.slice(1)} 
                      size="small"
                      sx={{ mt: 0.5 }}
                      color={
                        group.difficulty === 'expert' ? 'secondary' :
                        group.difficulty === 'hard' ? 'info' :
                        group.difficulty === 'medium' ? 'success' : 'warning'
                      }
                    />
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            {!puzzleProp && (
              <Button 
                variant="contained" 
                onClick={() => {
                  setIsCompletionModalOpen(false);
                  handleNewGame();
                }} 
                size="large"
              >
                Next Puzzle
              </Button>
            )}
            <Button 
              variant="outlined" 
              startIcon={<ShareIcon />}
              onClick={handleCorpusContribution}
              size="large"
            >
              Patterns Recorded
            </Button>
            <Button 
              variant="text" 
              onClick={() => setIsCompletionModalOpen(false)}
              size="large"
            >
              Close
            </Button>
            <Button 
              variant="text" 
              onClick={() => window.location.href = '/'}
              size="large"
            >
              Back to Hub
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}; 