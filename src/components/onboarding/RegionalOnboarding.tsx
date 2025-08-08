import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Language as LanguageIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Explore as ExploreIcon,
  MusicNote as MusicIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { aiContentService } from '../../services/aiContentService';

interface Region {
  code: string;
  name: string;
  language: string;
  preview: string;
  flag: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

interface CulturalHook {
  level: number;
  familiarConcept: string;
  nativeExample: string;
  englishBridge: string;
  culturalContext: string;
  engagementType: 'recognition' | 'discovery' | 'bridge' | 'mastery';
}

interface OnboardingStep {
  step: number;
  content: {
    title: string;
    nativeExample: string;
    englishBridge: string;
    culturalContext: string;
    interactiveDemo: {
      type: string;
      instruction: string;
      examples: string[];
      userTask: string;
      reward: string;
    };
  };
  unlocks: string;
}

const REGIONAL_DATA: { [key: string]: Region } = {
  'PH': {
    code: 'PH',
    name: 'Philippines',
    language: 'Filipino/Tagalog',
    preview: 'Tugmang Salita (Rhyming Words)',
    flag: '🇵🇭',
    colors: { primary: '#0038a8', secondary: '#ce1126' }
  },
  'MX': {
    code: 'MX',
    name: 'Mexico',
    language: 'Spanish',
    preview: 'Rimas Tradicionales',
    flag: '🇲🇽',
    colors: { primary: '#006341', secondary: '#ce1126' }
  },
  'JP': {
    code: 'JP',
    name: 'Japan',
    language: 'Japanese',
    preview: 'Onomatopoeia Patterns',
    flag: '🇯🇵',
    colors: { primary: '#bc002d', secondary: '#ffffff' }
  },
  'IN': {
    code: 'IN',
    name: 'India',
    language: 'Hindi/Multiple',
    preview: 'Sanskrit Syllable Patterns',
    flag: '🇮🇳',
    colors: { primary: '#ff6600', secondary: '#ffffff' }
  },
  'GLOBAL': {
    code: 'GLOBAL',
    name: 'International',
    language: 'English',
    preview: 'Universal Patterns',
    flag: '🌍',
    colors: { primary: '#4285f4', secondary: '#34a853' }
  }
};

interface RegionalOnboardingProps {
  open: boolean;
  onClose: () => void;
  onComplete: (regionCode: string) => void;
}

const RegionalOnboarding: React.FC<RegionalOnboardingProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      loadAvailableRegions();
      detectUserRegion();
    }
  }, [open]);

  const loadAvailableRegions = async () => {
    try {
      const progressionData = await aiContentService.getContentProgression();
      // For now, use our predefined regions
      const regions = Object.values(REGIONAL_DATA);
      setAvailableRegions(regions);
    } catch (error) {
      console.error('Failed to load regions:', error);
      setAvailableRegions(Object.values(REGIONAL_DATA));
    }
  };

  const detectUserRegion = () => {
    // Try to detect user's region from browser/timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = navigator.language || navigator.languages[0];
      
      let detectedRegion = 'GLOBAL';
      
      if (timezone.includes('Manila') || locale.includes('fil') || locale.includes('tl')) {
        detectedRegion = 'PH';
      } else if (timezone.includes('Mexico') || locale.includes('es-MX')) {
        detectedRegion = 'MX';
      } else if (timezone.includes('Tokyo') || locale.includes('ja')) {
        detectedRegion = 'JP';
      } else if (timezone.includes('Kolkata') || locale.includes('hi') || locale.includes('en-IN')) {
        detectedRegion = 'IN';
      }
      
      // Pre-select detected region but allow user to change
      setSelectedRegion(detectedRegion);
    } catch (error) {
      setSelectedRegion('GLOBAL');
    }
  };

  const handleRegionSelect = (regionCode: string) => {
    setSelectedRegion(regionCode);
  };

  const handleStartOnboarding = async () => {
    if (!selectedRegion || !currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Initialize regional progression
      const response = await fetch('/api/ai-content/initialize-region', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userSelectedRegion: selectedRegion,
          detectedRegion: selectedRegion
        })
      });

      if (!response.ok) throw new Error('Failed to initialize region');

      // Generate onboarding sequence
      const sequenceResponse = await fetch('/api/ai-content/onboarding-sequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({ regionCode: selectedRegion })
      });

      if (!sequenceResponse.ok) throw new Error('Failed to generate sequence');

      const sequenceData = await sequenceResponse.json();
      setOnboardingSteps(sequenceData.data.sequence);
      setShowSteps(true);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    
    if (stepIndex < onboardingSteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // All steps completed
      setTimeout(() => {
        onComplete(selectedRegion!);
        onClose();
      }, 1000);
    }
  };

  const handleStepDemo = (demo: any) => {
    // Simulate interactive demo completion
    setTimeout(() => {
      handleStepComplete(currentStep);
    }, 2000);
  };

  const getEngagementIcon = (type: string) => {
    switch (type) {
      case 'recognition': return <MusicIcon />;
      case 'discovery': return <ExploreIcon />;
      case 'bridge': return <LanguageIcon />;
      case 'mastery': return <SchoolIcon />;
      default: return <PlayIcon />;
    }
  };

  const getEngagementColor = (type: string) => {
    switch (type) {
      case 'recognition': return '#4caf50';
      case 'discovery': return '#ff9800';
      case 'bridge': return '#2196f3';
      case 'mastery': return '#9c27b0';
      default: return '#757575';
    }
  };

  if (!showSteps) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', position: 'relative' }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
            🌍 Discover Your Cultural Sound Patterns
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
            Start with patterns from your heritage, then explore the world
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: 'white', p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ color: '#333', mb: 3 }}>
            Choose your cultural background to get personalized learning:
          </Typography>

          <Grid container spacing={3}>
            {availableRegions.map((region) => (
              <Grid item xs={12} sm={6} md={4} key={region.code}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedRegion === region.code ? 
                      `3px solid ${region.colors.primary}` : 
                      '2px solid transparent',
                    transform: selectedRegion === region.code ? 'scale(1.05)' : 'scale(1)',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleRegionSelect(region.code)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h2" sx={{ mb: 1 }}>
                      {region.flag}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {region.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {region.language}
                    </Typography>
                    <Chip
                      label={region.preview}
                      size="small"
                      sx={{
                        bgcolor: region.colors.primary,
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                    {selectedRegion === region.code && (
                      <CheckIcon 
                        sx={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8, 
                          color: region.colors.primary 
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {selectedRegion && (
            <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: REGIONAL_DATA[selectedRegion].colors.primary, mr: 2 }}>
                  {REGIONAL_DATA[selectedRegion].flag}
                </Avatar>
                Ready to explore {REGIONAL_DATA[selectedRegion].name} patterns!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We'll start with patterns you already know from {REGIONAL_DATA[selectedRegion].language}, 
                then gradually bridge to English and global sound patterns. This helps you discover 
                the Observatory, Lessons, and other advanced features naturally!
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartOnboarding}
                disabled={loading}
                sx={{
                  bgcolor: REGIONAL_DATA[selectedRegion].colors.primary,
                  '&:hover': {
                    bgcolor: REGIONAL_DATA[selectedRegion].colors.secondary
                  },
                  px: 4,
                  py: 1.5
                }}
              >
                {loading ? 'Creating your journey...' : `Start ${REGIONAL_DATA[selectedRegion].name} Journey`}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: REGIONAL_DATA[selectedRegion!].colors.primary,
        color: 'white',
        position: 'relative'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {REGIONAL_DATA[selectedRegion!].flag} Your {REGIONAL_DATA[selectedRegion!].name} Journey
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
          Step {currentStep + 1} of {onboardingSteps.length}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={((currentStep + 1) / onboardingSteps.length) * 100}
          sx={{ 
            mt: 1, 
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': { bgcolor: 'white' }
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Stepper activeStep={currentStep} orientation="vertical">
          {onboardingSteps.map((step, index) => (
            <Step key={index} completed={completedSteps.has(index)}>
              <StepLabel
                icon={
                  completedSteps.has(index) ? 
                    <CheckIcon sx={{ color: '#4caf50' }} /> :
                    getEngagementIcon(step.content.interactiveDemo?.type || 'recognition')
                }
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {step.content.title}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: '#f8f9fa', mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            🏠 Familiar Pattern:
                          </Typography>
                          <Typography sx={{ fontSize: '1.1rem', mb: 2 }}>
                            {step.content.nativeExample}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {step.content.culturalContext}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: '#e3f2fd', mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            🌉 English Bridge:
                          </Typography>
                          <Typography sx={{ fontSize: '1.1rem' }}>
                            {step.content.englishBridge}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {step.content.interactiveDemo && (
                    <Card sx={{ bgcolor: '#fff3e0', mt: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          🎮 Interactive Demo: {step.content.interactiveDemo.instruction}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {step.content.interactiveDemo.examples.map((example, idx) => (
                            <Chip
                              key={idx}
                              label={example}
                              sx={{ 
                                bgcolor: getEngagementColor(step.content.interactiveDemo.type),
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {step.content.interactiveDemo.userTask}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => handleStepDemo(step.content.interactiveDemo)}
                          disabled={completedSteps.has(index)}
                          sx={{
                            bgcolor: getEngagementColor(step.content.interactiveDemo.type)
                          }}
                        >
                          {completedSteps.has(index) ? 'Completed!' : 'Try Interactive Demo'}
                        </Button>
                        {completedSteps.has(index) && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#4caf50', fontWeight: 600 }}>
                            ✨ {step.content.interactiveDemo.reward}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Unlocks:</strong> {step.unlocks}
                  </Alert>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {completedSteps.size === onboardingSteps.length && (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e8' }}>
            <Typography variant="h5" sx={{ mb: 2, color: '#2e7d32' }}>
              🎉 Cultural Journey Complete!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              You've mastered the bridge between {REGIONAL_DATA[selectedRegion!].name} patterns 
              and English sound recognition. Ready to explore the full platform!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                onComplete(selectedRegion!);
                onClose();
              }}
              sx={{ bgcolor: '#2e7d32', px: 4 }}
            >
              Enter Noctua Forest 🌟
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegionalOnboarding; 