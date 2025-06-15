import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Fade } from '@mui/material';

interface OnboardingStep {
  title: string;
  content: React.ReactNode;
  orionMood: string;
  orionMessage: string;
}

const OnboardingJourney: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [sampleLyrics, setSampleLyrics] = useState('');

  const steps: OnboardingStep[] = [
    {
      title: t('welcome_to_noctua'),
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('welcome_night_poet')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('orion_intro')}
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
      title: t('try_it_out'),
      content: (
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('analyze_lyrics')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('paste_lyrics')}
          </Typography>
          <TextField
            multiline
            rows={4}
            placeholder={t('enter_lyrics_here')}
            value={sampleLyrics}
            onChange={(e) => setSampleLyrics(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {sampleLyrics && (
            <Fade in>
              <Typography variant="caption" color="primary">
                {t('patterns_forming')}
              </Typography>
            </Fade>
          )}
        </Box>
      ),
      orionMood: 'excited',
      orionMessage: t('share_lyrics')
    },
    {
      title: t('ready_to_create'),
      content: (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('all_set', { name: userName || 'poet' })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('remember_help')}
          </Typography>
          <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('quick_tips')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('tip_1')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('tip_2')}
            </Typography>
            <Typography variant="body2">
              {t('tip_3')}
            </Typography>
          </Box>
        </Box>
      ),
      orionMood: 'happy',
      orionMessage: t('create_amazing')
    }
  ];

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default OnboardingJourney; 