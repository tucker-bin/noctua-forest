import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, FormControlLabel, Switch, Slider, Typography } from '@mui/material';
import { Accessibility, Contrast, TextFields, VolumeUp } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  fontSize: number;
  speechRate: number;
}

const AccessibilityEnhancements: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    fontSize: 16,
    speechRate: 1
  });

  useEffect(() => {
    // Load saved accessibility settings
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }
  }, []);

  useEffect(() => {
    // Apply accessibility settings
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    root.style.fontSize = `${settings.fontSize}px`;

    // Save settings
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // Announce changes to screen readers
    if (settings.screenReaderOptimized) {
      announceToScreenReader(t('accessibility.settings_updated', 'Accessibility settings updated'));
    }
  }, [settings, t]);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const handleSettingChange = (setting: keyof AccessibilitySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const resetToDefaults = () => {
    const defaults: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      fontSize: 16,
      speechRate: 1
    };
    setSettings(defaults);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Accessibility />}
        onClick={() => setOpen(true)}
        aria-label={t('accessibility.open_settings', 'Open accessibility settings')}
        sx={{ textTransform: 'none' }}
      >
        {t('accessibility.title', 'Accessibility')}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="accessibility-dialog-title"
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle id="accessibility-dialog-title" sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Accessibility color="primary" />
            {t('accessibility.settings_title', 'Accessibility Settings')}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ color: 'white', '& .MuiFormControlLabel-label': { color: 'white' } }}>
            
            {/* Visual Settings */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                              <Contrast sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('accessibility.visual_title', 'Visual Settings')}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.highContrast}
                  onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                  color="primary"
                />
              }
              label={t('accessibility.high_contrast', 'High Contrast Mode')}
              sx={{ display: 'block', mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.largeText}
                  onChange={(e) => handleSettingChange('largeText', e.target.checked)}
                  color="primary"
                />
              }
              label={t('accessibility.large_text', 'Large Text')}
              sx={{ display: 'block', mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.reducedMotion}
                  onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                  color="primary"
                />
              }
              label={t('accessibility.reduced_motion', 'Reduce Motion')}
              sx={{ display: 'block', mb: 3 }}
            />

            {/* Font Size Slider */}
            <Typography variant="body2" sx={{ mb: 1 }}>
              <TextFields sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('accessibility.font_size', 'Font Size')}: {settings.fontSize}px
            </Typography>
            <Slider
              value={settings.fontSize}
              onChange={(_, value) => handleSettingChange('fontSize', value as number)}
              min={12}
              max={24}
              step={1}
              marks={[
                { value: 12, label: '12px' },
                { value: 16, label: '16px' },
                { value: 20, label: '20px' },
                { value: 24, label: '24px' }
              ]}
              sx={{ mb: 3 }}
            />

            {/* Screen Reader Settings */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('accessibility.screen_reader_title', 'Screen Reader Settings')}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.screenReaderOptimized}
                  onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked)}
                  color="primary"
                />
              }
              label={t('accessibility.screen_reader_optimized', 'Screen Reader Optimized')}
              sx={{ display: 'block', mb: 1 }}
            />

            {/* Speech Rate Slider */}
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('accessibility.speech_rate', 'Speech Rate')}: {settings.speechRate}x
            </Typography>
            <Slider
              value={settings.speechRate}
              onChange={(_, value) => handleSettingChange('speechRate', value as number)}
              min={0.5}
              max={2}
              step={0.1}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1, label: '1x' },
                { value: 1.5, label: '1.5x' },
                { value: 2, label: '2x' }
              ]}
              sx={{ mb: 3 }}
            />

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={resetToDefaults} color="secondary">
                {t('accessibility.reset', 'Reset to Defaults')}
              </Button>
              <Button onClick={() => setOpen(false)} variant="contained">
                {t('accessibility.save', 'Save Settings')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* CSS for accessibility classes */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(150%) brightness(120%);
        }
        
        .large-text {
          --text-scale: 1.2;
        }
        
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .screen-reader-optimized {
          --focus-outline: 3px solid #667eea;
        }
        
        .screen-reader-optimized *:focus {
          outline: var(--focus-outline) !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </>
  );
};

export default AccessibilityEnhancements; 