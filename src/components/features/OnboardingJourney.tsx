import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  TextField, 
  Fade, 
  Card, 
  CardContent, 
  Chip, 
  Button,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Star, Lock, Diamond } from '@mui/icons-material';

interface OnboardingStep {
  title: string;
  content: React.ReactNode;
  orionMood: string;
  orionMessage: string;
}

const OnboardingJourney: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [sampleLyrics, setSampleLyrics] = useState('');

  const steps: OnboardingStep[] = [
    {
      title: t('welcome_to_noctua_forest'),
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('welcome_night_observer')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('forest_intro')}
          </Typography>
          <TextField
            label={t('what_should_i_call_you')}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            fullWidth
            sx={{ maxWidth: 400, mx: 'auto' }}
          />
        </Box>
      ),
      orionMood: 'happy',
      orionMessage: t('orion_excited')
    },
    {
      title: t('your_journey_tiers'),
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            {t('choose_your_path')}
          </Typography>
          
          {/* Free Tier */}
          <Card sx={{ mb: 3, border: `2px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6">{t('free_observer')}</Typography>
                <Chip label={t('current')} color="primary" size="small" sx={{ ml: 2 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('free_tier_description')}
              </Typography>
              <Typography variant="body2">
                • {t('daily_observatory_tokens', { count: 3 })} <br/>
                • {t('basic_pattern_detection')} <br/>
                • {t('community_forest_access')} <br/>
                • {t('learning_paths')}
              </Typography>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card sx={{ mb: 3, opacity: 0.8 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Diamond sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                <Typography variant="h6">{t('premium_explorer')}</Typography>
                <Chip label={t('upgrade_available')} color="secondary" size="small" sx={{ ml: 2 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('premium_tier_description')}
              </Typography>
              <Typography variant="body2">
                • {t('unlimited_observatory_access')} <br/>
                • {t('advanced_pattern_analysis')} <br/>
                • {t('export_observations')} <br/>
                • {t('priority_support')} <br/>
                • {t('exclusive_features')}
              </Typography>
            </CardContent>
          </Card>

          {/* Admin Note */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('admin_tier_note')}
            </Typography>
          </Box>
        </Box>
      ),
      orionMood: 'wise',
      orionMessage: t('tiers_explanation')
    },
    {
      title: t('try_observatory'),
      content: (
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('observe_patterns')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('observatory_explanation')}
          </Typography>
          
          {/* Token Usage Display */}
          <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('daily_tokens')}</Typography>
                <Chip label="3/3" color="primary" />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('tokens_reset_daily')}
              </Typography>
            </CardContent>
          </Card>

          <TextField
            multiline
            rows={4}
            placeholder={t('enter_text_to_observe')}
            value={sampleLyrics}
            onChange={(e) => setSampleLyrics(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {sampleLyrics && (
            <Fade in>
              <Typography variant="caption" color="primary">
                {t('patterns_detected')}
              </Typography>
            </Fade>
          )}
        </Box>
      ),
      orionMood: 'excited',
      orionMessage: t('share_text_to_observe')
    },
    {
      title: t('ready_to_explore'),
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('welcome_to_forest', { name: userName || t('observer') })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('forest_journey_begins')}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('observatory')}
              </Typography>
              <Typography variant="body2">
                {t('discover_patterns_in_text')}
              </Typography>
            </Card>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" color="secondary" gutterBottom>
                {t('learning_paths')}
              </Typography>
              <Typography variant="body2">
                {t('structured_observation_lessons')}
              </Typography>
            </Card>
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            onClick={onComplete}
            sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              px: 4
            }}
          >
            {t('begin_journey')}
          </Button>
        </Box>
      ),
      orionMood: 'happy',
      orionMessage: t('excited_to_guide_you')
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Fade in key={activeStep}>
        <Box>
          {steps[activeStep].content}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button 
              onClick={handleBack} 
              disabled={activeStep === 0}
              variant="outlined"
            >
              {t('back')}
            </Button>
            
            {activeStep < steps.length - 1 && (
              <Button 
                onClick={handleNext} 
                variant="contained"
              >
                {t('next')}
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default OnboardingJourney; 