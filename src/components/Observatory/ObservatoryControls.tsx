import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TextField, 
  Button, 
  Box, 
  LinearProgress, 
  Typography, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Collapse,
  IconButton,
  Slider,
  alpha,
  CircularProgress
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  Tune,
  Search,
  Psychology,
  FilterList
} from '@mui/icons-material';
import { ModelSelector } from './ModelSelector';

interface ObservatoryControlsProps {
  text: string;
  setText: (text: string) => void;
  handleObserve: () => void;
  isObserving: boolean;
  progress: number;
  selectedModel?: string;
  onModelChange: (modelId: string) => void;
  language: string;
  analysisOptions?: {
    sensitivity: 'subtle' | 'moderate' | 'strong';
    phoneticDepth: 'basic' | 'detailed' | 'expert';
    culturalContext: boolean;
  };
  onAnalysisOptionsChange?: (options: {
    sensitivity: 'subtle' | 'moderate' | 'strong';
    phoneticDepth: 'basic' | 'detailed' | 'expert';
    culturalContext: boolean;
  }) => void;
  isLightTheme?: boolean;
  onThemeToggle?: (isLight: boolean) => void;
  significanceThreshold?: number;
  onSignificanceThresholdChange?: (threshold: number) => void;
}

// Removed AnalysisOptions interface - now using the props interface directly

const progressStages = [
  { stage: 'Analyzing text structure...', progress: 15 },
  { stage: 'Detecting phonetic patterns...', progress: 35 },
  { stage: 'Mapping sound relationships...', progress: 55 },
  { stage: 'Generating acoustic features...', progress: 75 },
  { stage: 'Creating pattern constellations...', progress: 95 },
  { stage: 'Complete!', progress: 100 }
];

export const ObservatoryControls: React.FC<ObservatoryControlsProps> = ({
  text,
  setText,
  handleObserve,
  isObserving,
  progress,
  selectedModel,
  onModelChange,
  language,
  analysisOptions,
  onAnalysisOptionsChange,
  isLightTheme,
  onThemeToggle,
  significanceThreshold,
  onSignificanceThresholdChange
}) => {
  const { t } = useTranslation();
  // Use external options if provided, otherwise use defaults
  const options = analysisOptions || {
    sensitivity: 'moderate',
    culturalContext: true,
    phoneticDepth: 'detailed'
  };
  
  const handleOptionsChange = (newOptions: Partial<typeof options>) => {
    if (onAnalysisOptionsChange) {
      onAnalysisOptionsChange({ ...options, ...newOptions });
    }
  };
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');

  // Smooth progress animation
  useEffect(() => {
    if (isObserving && progress > 0) {
      const targetProgress = Math.min(progress, 100);
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          const diff = targetProgress - prev;
          const increment = Math.max(0.5, diff * 0.1);
          return Math.min(prev + increment, targetProgress);
        });
      }, 50);

      return () => clearInterval(interval);
    } else if (!isObserving) {
      setSmoothProgress(0);
      setCurrentStage('');
    }
  }, [isObserving, progress]);

  // Update stage based on progress
  useEffect(() => {
    const stage = progressStages.find(s => smoothProgress <= s.progress);
    if (stage) {
      setCurrentStage(stage.stage);
    }
  }, [smoothProgress]);

  const getAnalysisDescription = () => {
    const depthDesc = options.phoneticDepth === 'expert' ? 'Expert-level phonetic analysis' :
                     options.phoneticDepth === 'detailed' ? 'Detailed phonetic analysis' : 'Basic phonetic analysis';
    const sensitivityDesc = options.sensitivity === 'strong' ? 'High sensitivity pattern detection' :
                           options.sensitivity === 'subtle' ? 'Subtle pattern detection' : 'Moderate pattern detection';
    const culturalDesc = options.culturalContext ? ' with cultural context' : '';
    
    return `Comprehensive analysis: ${depthDesc}, ${sensitivityDesc}${culturalDesc}`;
  };

  const getEstimatedPatterns = () => {
    const baseCount = Math.max(2, Math.floor(text.length / 20));
    const multiplier = options.sensitivity === 'subtle' ? 0.7 : 
                     options.sensitivity === 'strong' ? 1.4 : 1;
    return Math.round(baseCount * multiplier);
  };

  return (
    <Box>
      <Box sx={{ 
        mb: { xs: 2, sm: 3 },
        '& .MuiTextField-root': {
          mb: { xs: 2, sm: 2.5 }
        }
      }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('observatory.textPlaceholder')}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: { xs: '1rem', sm: '1.0625rem' },
              lineHeight: 1.6,
              '& textarea': {
                padding: { xs: '16px 18px', sm: '14px 16px' },
                minHeight: { xs: '120px', sm: '100px' }
              }
            }
          }}
        />

        {/* AI Model Selection */}
        <Box sx={{ mb: 2 }}>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            text={text}
            language={language}
            disabled={isObserving}
          />
        </Box>

        {/* Simplified controls with friendly instructions */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          alignItems: { sm: 'center' }
        }}>
          <Box sx={{ 
            minWidth: { sm: 200 },
            '& .MuiFormControl-root': { width: '100%' }
          }}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '0.8125rem' } }}>
                {t('observatory.sensitivity')}
              </InputLabel>
              <Select
                value={options.sensitivity}
                onChange={(e) => handleOptionsChange({ sensitivity: e.target.value as any })}
                disabled={isObserving}
                sx={{
                  borderRadius: 2,
                  '& .MuiSelect-select': {
                    padding: { xs: '12px 14px', sm: '10px 12px' }
                  }
                }}
              >
                <MenuItem value="subtle">{t('observatory.subtle')}</MenuItem>
                <MenuItem value="moderate">{t('observatory.moderate')}</MenuItem>
                <MenuItem value="strong">{t('observatory.strong')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Theme Toggle - Prominent placement */}
          <Box sx={{ 
            minWidth: { sm: 180 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha('#4a90e2', 0.1),
            border: '1px solid rgba(74, 144, 226, 0.3)'
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isLightTheme || false}
                  onChange={(e) => onThemeToggle?.(e.target.checked)}
                  disabled={isObserving}
                  size="small"
                />
              }
              label={t('observatory.lightTheme')}
              sx={{ 
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  color: '#4a90e2'
                }
              }}
            />
          </Box>

          {/* Friendly usage instructions */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha('#4a90e2', 0.1),
            border: '1px solid rgba(74, 144, 226, 0.3)',
            flex: 1
          }}>
            <Psychology sx={{ fontSize: 18, color: '#4a90e2' }} />
            <Typography variant="body2" sx={{ color: '#4a90e2', fontSize: '0.85rem' }}>
              💡 Hover words to explore, click to focus
            </Typography>
          </Box>

          <IconButton
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isObserving}
            sx={{ 
              ml: { sm: 'auto' },
              alignSelf: { xs: 'flex-start', sm: 'center' }
            }}
          >
            <Tune />
            {showAdvanced ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showAdvanced}>
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: alpha('#1a1b2e', 0.4),
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Advanced Options
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Phonetic Depth</InputLabel>
                  <Select
                    value={options.phoneticDepth}
                    onChange={(e) => handleOptionsChange({ phoneticDepth: e.target.value as any })}
                    disabled={isObserving}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="detailed">Detailed</MenuItem>
                    <MenuItem value="expert">Expert</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.culturalContext}
                      onChange={(e) => handleOptionsChange({ culturalContext: e.target.checked })}
                      disabled={isObserving}
                    />
                  }
                  label="Cultural Context"
                />
              </Box>
            </Box>

            {/* Significance Threshold Control */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FilterList sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Pattern Significance Threshold
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Filter patterns by significance level. Higher values show only the most important patterns.
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={significanceThreshold || 0.3}
                  onChange={(_, value) => onSignificanceThresholdChange?.(value as number)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  disabled={isObserving}
                  marks={[
                    { value: 0.1, label: 'All' },
                    { value: 0.3, label: 'Decent' },
                    { value: 0.6, label: 'Good' },
                    { value: 0.8, label: 'Strong' }
                  ]}
                  sx={{
                    '& .MuiSlider-mark': {
                      backgroundColor: 'text.secondary',
                      opacity: 0.5
                    },
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.7rem',
                      color: 'text.secondary'
                    }
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Current: {((significanceThreshold || 0.3) * 100).toFixed(0)}% minimum significance
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Analysis Preview:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getAnalysisDescription()}
            </Typography>
            
            {text && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Estimated patterns: ~{getEstimatedPatterns()}
              </Typography>
            )}
            
            <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#4a90e2', 0.1), borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#4a90e2', fontWeight: 500, mb: 1 }}>
                💡 {t('observatory.howItWorksTitle')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('observatory.howItWorksDescription')}
              </Typography>
            </Box>
          </Paper>
        </Collapse>

        <Button
          fullWidth
          variant="contained"
          onClick={handleObserve}
          disabled={!text || !text.trim() || isObserving}
          size="large"
          sx={{
            py: { xs: 1.5, sm: 1.75 },
            fontSize: { xs: '1rem', sm: '1.125rem' },
            fontWeight: 600,
            borderRadius: 2,
            background: isObserving 
              ? 'rgba(255, 215, 0, 0.3)' 
              : 'linear-gradient(45deg, #FFD700, #FFA500)',
            color: 'primary.main',
            '&:hover': {
              background: isObserving 
                ? 'rgba(255, 215, 0, 0.3)' 
                : 'linear-gradient(45deg, #FFA500, #FF8C00)',
            },
            '&:disabled': {
              background: 'rgba(255, 215, 0, 0.2)',
              color: 'rgba(26, 27, 46, 0.5)',
            }
          }}
          startIcon={isObserving ? <CircularProgress size={20} /> : <Search />}
        >
          {isObserving ? t('observatory.observing') : t('observatory.findPatterns', 'Find Patterns')}
        </Button>

        {/* Progress Display */}
        {isObserving && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {currentStage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(smoothProgress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={smoothProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 215, 0, 0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'secondary.main',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}; 