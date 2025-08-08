import React, { useState } from 'react';
import { Box, Button, Typography, useTheme, Container } from '@mui/material';
import RhymeMahjong from './RhymeMahjong';
import { CustomPuzzleGenerator } from './CustomPuzzleGenerator';

export const RhymeMahjongWrapper: React.FC = () => {
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);
  const [customText, setCustomText] = useState<string | undefined>(undefined);
  const theme = useTheme();

  const handlePuzzleGenerated = (text: string) => {
    setCustomText(text);
    setShowCustomGenerator(false);
  };

  const handleCustomComplete = () => {
    // Reset to standard mode after completing custom puzzle
    setCustomText(undefined);
  };

  const handleBackToStandard = () => {
    setCustomText(undefined);
    setShowCustomGenerator(false);
  };

  // Show custom puzzle generator
  if (showCustomGenerator) {
    return (
      <CustomPuzzleGenerator
        onPuzzleGenerated={handlePuzzleGenerated}
        onCancel={() => setShowCustomGenerator(false)}
      />
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Custom puzzle option */}
      {!customText && (
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        }}>
          <Typography variant="h6" gutterBottom>
            🎮 Rhyme Mahjong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose your challenge: play with curated word sets or create a puzzle from your own text
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowCustomGenerator(true)}
              sx={{ minWidth: 140 }}
            >
              📝 Custom Text
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ 
              alignSelf: 'center',
              fontStyle: 'italic'
            }}>
              ↓ Or play standard difficulties below ↓
            </Typography>
          </Box>
        </Box>
      )}

      {/* Custom puzzle indicator */}
      {customText && (
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h6" gutterBottom>
            🎯 Custom Puzzle Active
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Generated from your text • Words analyzed by Observatory Engine
          </Typography>
          <Button 
            variant="contained" 
            size="small"
            onClick={handleBackToStandard}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            ← Back to Standard
          </Button>
        </Box>
      )}

      {/* Main game component */}
      <RhymeMahjong 
        customText={customText}
        onCustomComplete={handleCustomComplete}
      />
    </Container>
  );
};

export default RhymeMahjongWrapper; 