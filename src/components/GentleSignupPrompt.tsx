import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stack,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Games as GameIcon,
  AutoAwesome as CustomIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGameSession } from '../contexts/GameSessionContext';

export const GentleSignupPrompt: React.FC = () => {
  const { showSignupPrompt, dismissSignupPrompt, remainingRegularGames } = useGameSession();
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/auth/signup');
  };

  const handleSignIn = () => {
    navigate('/auth/signin');
  };

  if (!showSignupPrompt) return null;

  return (
    <Fade in={showSignupPrompt}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          maxWidth: 400,
          width: '90vw'
        }}
      >
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Enjoying the games?
              </Typography>
              <IconButton 
                size="small" 
                onClick={dismissSignupPrompt}
                sx={{ color: 'white', mt: -1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              You have {remainingRegularGames} regular games left this session.
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <GameIcon fontSize="small" />
                <Typography variant="body2">
                  Unlimited regular games
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CustomIcon fontSize="small" />
                <Typography variant="body2">
                  Create custom puzzles with your text
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                size="small"
                onClick={handleSignUp}
                sx={{ 
                  background: 'rgba(255,255,255,0.2)',
                  '&:hover': { background: 'rgba(255,255,255,0.3)' }
                }}
              >
                Sign Up
              </Button>
              <Button 
                variant="text" 
                size="small"
                onClick={handleSignIn}
                sx={{ color: 'white' }}
              >
                Sign In
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );
}; 