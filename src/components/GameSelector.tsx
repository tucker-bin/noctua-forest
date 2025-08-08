import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Games as RegularIcon,
  AutoAwesome as CustomIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useGameSession } from '../contexts/GameSessionContext';
import { useNavigate } from 'react-router-dom';

export const GameSelector: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    canPlayRegularGame, 
    canPlayCustomGame, 
    playRegularGame, 
    playCustomGame,
    remainingRegularGames 
  } = useGameSession();
  
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handlePlayRegular = async () => {
    if (!canPlayRegularGame) return;
    
    playRegularGame();
    
    // Fetch random game from corpus
    try {
      const response = await fetch('/api/games/regular');
      const data = await response.json();
      
      if (data.success) {
        // Navigate to game with corpus content
        navigate('/play', { state: { gameData: data.game, type: 'regular' } });
      }
    } catch (error) {
      console.error('Failed to load regular game:', error);
    }
  };

  const handlePlayCustom = async () => {
    if (!canPlayCustomGame || !customText.trim()) return;
    
    setIsGenerating(true);
    playCustomGame();
    
    try {
      // Call Observatory to generate custom game
      const response = await fetch('/api/games/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to game with custom analysis
        navigate('/play', { state: { gameData: data.game, type: 'custom' } });
      }
    } catch (error) {
      console.error('Failed to generate custom game:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 600 }}>
        Choose Your Game
      </Typography>

      <Stack spacing={4}>
        {/* Regular Games */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <RegularIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Regular Games
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Play puzzles from community-submitted content
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Chip 
                label="Free" 
                color="success" 
                size="small" 
              />
              <Chip 
                label="No AI calls" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label="Community content" 
                variant="outlined" 
                size="small" 
              />
            </Stack>

            {!currentUser && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {remainingRegularGames} games remaining this session. 
                <strong> Sign up for unlimited access!</strong>
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handlePlayRegular}
              disabled={!canPlayRegularGame}
              startIcon={<RegularIcon />}
              fullWidth
            >
              {canPlayRegularGame ? 'Play Regular Game' : 'Session Limit Reached'}
            </Button>
          </CardContent>
        </Card>

        <Divider>OR</Divider>

        {/* Custom Games */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <CustomIcon color="secondary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Custom Games
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Input your own text for Observatory analysis
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Chip 
                label={currentUser ? "Premium" : "Requires Login"} 
                color={currentUser ? "primary" : "error"} 
                size="small" 
              />
              <Chip 
                label="Observatory AI" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label="Unique puzzles" 
                variant="outlined" 
                size="small" 
              />
            </Stack>

            {!currentUser && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Custom games require a subscription.</strong> Sign up to create unique puzzles!
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter your text here - poetry, prose, song lyrics, anything with interesting patterns..."
              disabled={!canPlayCustomGame}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {customText.length}/50 minimum characters for analysis
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handlePlayCustom}
              disabled={!canPlayCustomGame || customText.length < 50 || isGenerating}
              startIcon={canPlayCustomGame ? <CustomIcon /> : <LockIcon />}
              fullWidth
            >
              {isGenerating 
                ? 'Observatory Analyzing...' 
                : canPlayCustomGame 
                  ? 'Generate Custom Game' 
                  : 'Login Required'}
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}; 