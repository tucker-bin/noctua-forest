import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useTranslation } from 'react-i18next';
import { log } from '../../utils/logger';

interface PronunciationGuideProps {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  pronunciationData: {
    ipa: string;
    romanization?: string;
    nativeScript: string;
    explanation: Record<string, string>;
    soundFeatures: {
      stress?: string[];
      tone?: string[];
      length?: string[];
      special?: string[];
    };
    learnerTips?: {
      emoji: string;
      tip: string;
      practice: string;
    }[];
    relatable?: {
      popCulture?: string;
      social?: string;
    };
  }[];
  phonologyComparison: {
    similarities: string[];
    differences: string[];
  };
  soundCorrespondences: {
    source: string;
    target: string;
    example: string;
  }[];
  userAge?: 'child' | 'teen' | 'adult';
}

const PronunciationGuide: React.FC<PronunciationGuideProps> = ({
  text,
  sourceLanguage,
  targetLanguage,
  pronunciationData,
  phonologyComparison,
  soundCorrespondences,
  userAge
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  const playPronunciation = useCallback(async (text: string, language: string = 'en') => {
    try {
      // Check if browser supports speech synthesis
      if (!('speechSynthesis' in window)) {
        log.warn('Speech synthesis not supported in this browser');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8; // Slightly slower for better pronunciation clarity
      utterance.pitch = 1;
      utterance.volume = 0.8;

      log.userAction('Playing pronunciation', { 
        text: text.substring(0, 50), 
        language,
        textLength: text.length 
      });

      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        log.info('Pronunciation playback started');
      };

      utterance.onend = () => {
        setIsPlaying(false);
        log.info('Pronunciation playback ended');
      };

      utterance.onerror = (event) => {
        setIsPlaying(false);
        log.error('Pronunciation playback failed', {
          error: event.error,
          text: text.substring(0, 50)
        });
      };

      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      log.error('Failed to play pronunciation', {
        text: text.substring(0, 50),
        language,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
      
      setIsPlaying(false);
    }
  }, []);

  const stopPronunciation = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      log.userAction('Pronunciation playback stopped');
    }
  }, []);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('pronunciation.guide')}
        {userAge === 'teen' && <EmojiEmotionsIcon sx={{ ml: 1, verticalAlign: 'middle' }} />}
      </Typography>
      
      {/* Original Text */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('pronunciation.original_text')}:
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {text}
          <IconButton
            size="small"
            onClick={() => playPronunciation(text, sourceLanguage)}
            sx={{ ml: 1 }}
          >
            {isPlaying ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Word-by-Word Pronunciation with Teen-Friendly Features */}
      {pronunciationData.map((item, index) => (
        <Accordion 
          key={index}
          sx={userAge === 'teen' ? {
            '&.MuiAccordion-root': {
              background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
              mb: 1,
              borderRadius: 2,
              '&:before': {
                display: 'none',
              },
            }
          } : {}}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={userAge === 'teen' ? {
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            } : {}}
          >
            <Typography>{item.nativeScript}</Typography>
            {userAge === 'teen' && item.learnerTips && (
              <Chip
                icon={<EmojiEmotionsIcon />}
                label={t('pronunciation.has_tips')}
                size="small"
                color="secondary"
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Teen-Friendly Tips */}
              {userAge === 'teen' && item.learnerTips && (
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'secondary.light',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  {item.learnerTips.map((tip, idx) => (
                    <Box key={idx}>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span role="img" aria-label="tip emoji">{tip.emoji}</span>
                        {tip.tip}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="secondary.dark"
                        sx={{ mt: 0.5, fontStyle: 'italic' }}
                      >
                        Practice: "{tip.practice}"
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Pop Culture References */}
              {userAge === 'teen' && item.relatable && (
                <Box sx={{ mt: 1 }}>
                  {item.relatable.popCulture && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MusicNoteIcon color="primary" />
                      <Typography variant="body2">
                        {item.relatable.popCulture}
                      </Typography>
                    </Box>
                  )}
                  {item.relatable.social && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WhatshotIcon color="error" />
                      <Typography variant="body2">
                        {item.relatable.social}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Standard Pronunciation Info */}
              <Box>
                <Typography variant="subtitle2">
                  {t('pronunciation.ipa')}: {item.ipa}
                </Typography>
                {item.romanization && (
                  <Typography variant="subtitle2">
                    {t('pronunciation.romanization')}: {item.romanization}
                  </Typography>
                )}
              </Box>

              {/* Sound Features */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(item.soundFeatures).map(([feature, values]) => 
                  values && (
                    <Tooltip
                      key={feature}
                      title={values.join(', ')}
                      arrow
                    >
                      <Chip
                        label={t(`pronunciation.features.${feature}`)}
                        size="small"
                        variant="outlined"
                        sx={userAge === 'teen' ? {
                          background: 'linear-gradient(45deg, #fff1eb 0%, #ace0f9 100%)',
                        } : {}}
                      />
                    </Tooltip>
                  )
                )}
              </Box>

              {/* Explanation */}
              <Typography variant="body2">
                {item.explanation[targetLanguage]}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* Phonology Comparison */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{t('pronunciation.phonology_comparison')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Similarities */}
            <Box>
              <Typography variant="subtitle2" color="success.main">
                {t('pronunciation.similarities')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {phonologyComparison.similarities.map((sim, index) => (
                  <Chip key={index} label={sim} size="small" color="success" />
                ))}
              </Box>
            </Box>

            {/* Differences */}
            <Box>
              <Typography variant="subtitle2" color="info.main">
                {t('pronunciation.differences')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {phonologyComparison.differences.map((diff, index) => (
                  <Chip key={index} label={diff} size="small" color="info" />
                ))}
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Sound Correspondences */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{t('pronunciation.sound_correspondences')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {soundCorrespondences.map((corr, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>{corr.source}</Typography>
                <Typography>→</Typography>
                <Typography>{corr.target}</Typography>
                <Tooltip title={corr.example}>
                  <IconButton size="small">
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default PronunciationGuide; 