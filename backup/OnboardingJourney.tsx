import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  TextField,
  Fade,
  Grow,
  useTheme,
} from '@mui/material';
import { OrionOwl } from './OrionOwl';
import { noctuaColors } from '../theme/noctuaTheme';

interface OnboardingStep {
  title: string;
  content: React.ReactNode;
  orionMood: 'happy' | 'thinking' | 'excited' | 'listening';
  orionMessage: string;
}

export const OnboardingJourney: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [sampleLyrics, setSampleLyrics] = useState('');

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to Noctua",
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome, Night Poet! 🌙
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            I'm Orion, your wise companion on this lyrical journey.
            Together, we'll explore the hidden patterns in your words.
          </Typography>
          <TextField
            label="What should I call you?"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            fullWidth
            sx={{ maxWidth: 400, mx: 'auto' }}
          />
        </Box>
      ),
      orionMood: 'happy',
      orionMessage: "Hoot! I'm so excited to meet you! What's your name?"
    },
    {
      title: "Discover Patterns",
      content: (
        <Box>
          <Typography variant="h5" gutterBottom>
            {userName ? `Nice to meet you, ${userName}!` : 'Hello there!'} 
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Noctua helps you discover hidden patterns in your lyrics:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            {[
              { name: 'Perfect Rhymes', color: noctuaColors.highlights.perfectRhymes, example: 'night / flight' },
              { name: 'Assonance', color: noctuaColors.highlights.assonance, example: 'fleet / dream' },
              { name: 'Consonance', color: noctuaColors.highlights.consonance, example: 'luck / rock' },
              { name: 'Alliteration', color: noctuaColors.highlights.alliteration, example: 'wild words' },
            ].map((pattern) => (
              <Box key={pattern.name} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    backgroundColor: pattern.color,
                  }}
                />
                <Typography>
                  <strong>{pattern.name}:</strong> {pattern.example}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ),
      orionMood: 'thinking',
      orionMessage: "Each color reveals a different sonic pattern in your lyrics!"
    },
    {
      title: "Try It Out",
      content: (
        <Box>
          <Typography variant="h5" gutterBottom>
            Let's analyze some lyrics!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Paste a few lines of lyrics below, and I'll show you the magic:
          </Typography>
          <TextField
            multiline
            rows={4}
            placeholder="Enter some lyrics here..."
            value={sampleLyrics}
            onChange={(e) => setSampleLyrics(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {sampleLyrics && (
            <Fade in>
              <Typography variant="caption" color="primary">
                ✨ I can see patterns forming already! Click next to start exploring.
              </Typography>
            </Fade>
          )}
        </Box>
      ),
      orionMood: 'excited',
      orionMessage: "Share your lyrics and watch the patterns come alive!"
    },
    {
      title: "Ready to Create",
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            You're all set, {userName || 'poet'}! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Remember, I'm always here to help. Look for me in the corner
            whenever you need guidance or inspiration.
          </Typography>
          <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Quick Tips:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Click on highlighted words to see rhyme suggestions
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Use the Control Deck to toggle different pattern types
            </Typography>
            <Typography variant="body2">
              • Watch your Rhyme Score grow as you create!
            </Typography>
          </Box>
        </Box>
      ),
      orionMood: 'happy',
      orionMessage: "Let's create something amazing together!"
    }
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const currentStep = steps[activeStep];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 800,
          width: '100%',
          p: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Orion positioned at the bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: -20,
            zIndex: 10,
          }}
        >
          <Grow in timeout={500}>
            <Box>
              <OrionOwl
                size={60}
                mood={currentStep.orionMood}
                showBubble
                bubbleText={currentStep.orionMessage}
                animate
              />
            </Box>
          </Grow>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 6 }}>
          {steps.map((step) => (
            <Step key={step.title}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Fade in key={activeStep}>
          <Box sx={{ minHeight: 300, mb: 4 }}>
            {currentStep.content}
          </Box>
        </Fade>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            variant="contained"
            color="primary"
            disabled={activeStep === 0 && !userName}
          >
            {activeStep === steps.length - 1 ? 'Start Creating' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}; 