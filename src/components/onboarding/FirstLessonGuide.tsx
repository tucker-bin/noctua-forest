import React from 'react';
import { Box, Typography, Button, Paper, Stepper, Step, StepLabel, Grid, alpha } from '@mui/material';
import { MusicNote, AutoAwesome, Psychology, Language } from '@mui/icons-material';
import { OrionOwl } from '../mascot/OrionOwl';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface FirstLessonGuideProps {
  onComplete: () => void;
}

export const FirstLessonGuide: React.FC<FirstLessonGuideProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);

  const patternPreviews = [
    { type: 'rhyme', color: '#FFD700', label: 'Rhyme Patterns', icon: <MusicNote />, example: 'cat, bat, hat', description: 'Words that end with similar sounds create musical harmony' },
    { type: 'alliteration', color: '#4CAF50', label: 'Alliteration', icon: <AutoAwesome />, example: 'swift silver streams', description: 'Repetition of starting sounds adds rhythmic emphasis' },
    { type: 'assonance', color: '#9C27B0', label: 'Vowel Harmony', icon: <Psychology />, example: 'deep sea dreams', description: 'Similar vowel sounds create internal melody' },
    { type: 'rhythm', color: '#FF5722', label: 'Rhythm & Meter', icon: <Language />, example: 'da-DUM da-DUM', description: 'Patterns of stressed and unstressed syllables' }
  ];

  const steps = [
    {
      title: t('onboarding.welcome_title'),
      description: t('onboarding.welcome_description'),
      owlMood: 'celebrating' as const,
      owlMessage: t('onboarding.welcome_owl')
    },
    {
      title: 'Pattern Types You\'ll Discover',
      description: 'The Observatory can detect many different types of sound patterns in your text. Here are the main categories:',
      owlMood: 'excited' as const,
      owlMessage: 'These patterns are everywhere in language!',
      showPatterns: true
    },
    {
      title: t('onboarding.first_lesson_title'),
      description: t('onboarding.first_lesson_description'),
      owlMood: 'excited' as const,
      owlMessage: t('onboarding.first_lesson_owl')
    },
    {
      title: t('onboarding.ready_title'),
      description: t('onboarding.ready_description'),
      owlMood: 'listening' as const,
      owlMessage: t('onboarding.ready_owl')
    }
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      navigate('/lessons/celestial_observer/first_light');
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const currentStep = steps[activeStep] as typeof steps[0] & { showPatterns?: boolean };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        mt: 4, 
        p: 4,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <Box sx={{ position: 'absolute', top: -40, right: -20 }}>
        <OrionOwl
          size={80}
          mood={currentStep.owlMood}
          showBubble={true}
          bubbleText={currentStep.owlMessage}
          animate={true}
          glowIntensity="medium"
          interactive={true}
        />
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentStep.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentStep.description}
        </Typography>
      </Box>

      {currentStep.showPatterns && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {patternPreviews.map((pattern) => (
              <Grid size={{ xs: 12, sm: 6 }} key={pattern.type}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(pattern.color, 0.1)}, ${alpha(pattern.color, 0.05)})`,
                    border: `2px solid ${alpha(pattern.color, 0.3)}`,
                    borderRadius: 2,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${alpha(pattern.color, 0.3)}`
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: pattern.color, mr: 2, fontSize: '2rem' }}>
                      {pattern.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: pattern.color, fontWeight: 'bold' }}>
                        {pattern.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {pattern.example}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {pattern.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          {t('common.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          {activeStep === steps.length - 1 ? t('onboarding.start_journey') : t('common.next')}
        </Button>
      </Box>
    </Paper>
  );
}; 