import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Stack,
  Divider,
  Badge,
  Paper,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  AutoAwesome as AutoAwesomeIcon,
  VolumeUp as VolumeUpIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Create as CreateIcon,
  MusicNote as MusicIcon,
  Psychology as BrainIcon,
  ContentCopy as CopyIcon,
  Lightbulb as LightbulbIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { Pattern, Segment } from '../../types/observatory';
import { generatePatternColors } from './colorSystem';

interface PatternCardProps {
  pattern: Pattern;
  segments: Segment[];
  isCreativeMode?: boolean;
  onPatternClick?: () => void;
  expanded?: boolean;
  onExpand?: () => void;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  segments,
  isCreativeMode = false,
  onPatternClick,
  expanded = false,
  onExpand
}) => {
  const { t, i18n } = useTranslation();
  const [showCreativeMode, setShowCreativeMode] = useState(false);
  
  // Add null safety checks for segments
  if (!segments || !Array.isArray(segments)) {
    return null;
  }

  if (!pattern?.segments || !Array.isArray(pattern.segments)) {
    return null;
  }

  // Get the actual segments from segment IDs
  const patternSegments = pattern.segments
    .map(segId => segments.find(s => s.id === segId))
    .filter((s): s is Segment => s !== undefined);

  // If no valid segments found, don't render the card
  if (patternSegments.length === 0) {
    return null;
  }

  const patternColor = generatePatternColors([{
    id: pattern.id,
    type: pattern.type,
    segments: pattern.segments,
    originalText: pattern.originalText
  }]);

  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use Web Speech API to pronounce the pattern
    if ('speechSynthesis' in window) {
      // Clean up the text by removing slashes and normalizing whitespace
      const cleanText = patternSegments
        .map(s => s.text)
        .join(' ')
        .replace(/\s*\/\s*/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = i18n.language.startsWith('en') ? 'en-US' : i18n.language;
      utterance.rate = 0.7; // Slower for pattern appreciation
      utterance.pitch = 1.2; // Higher pitch for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = patternSegments.map(s => s.text).join(' ');
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  const getCreativeSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    switch (pattern.type) {
      case 'rhyme':
        suggestions.push(
          'Perfect for chorus endings and memorable hooks',
          'Try extending this rhyme scheme to other verses',
          'Consider internal rhymes to strengthen the pattern'
        );
        break;
      case 'alliteration':
        suggestions.push(
          'Great for creating memorable phrases and titles',
          'Use this for emphasis in key lines',
          'Perfect for rap verses and tongue twisters'
        );
        break;
      case 'rhythm':
        suggestions.push(
          'This creates natural musical flow',
          'Consider matching drum patterns to this rhythm',
          'Perfect foundation for melodic phrasing'
        );
        break;
      case 'assonance':
        suggestions.push(
          'Creates subtle musical continuity',
          'Great for smooth vocal delivery',
          'Perfect for emotional resonance'
        );
        break;
      case 'consonance':
        suggestions.push(
          'Adds texture and depth to your writing',
          'Perfect for creating atmospheric effects',
          'Use for percussive emphasis in rap'
        );
        break;
      default:
        suggestions.push(
          'This pattern adds musical quality to your text',
          'Consider repeating this pattern for stronger effect',
          'Perfect for creating flow and continuity'
        );
    }
    
    return suggestions;
  };

  const getPhoneticInsights = () => {
    if (!pattern.phonetic) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TranslateIcon fontSize="small" />
          Phonetic Analysis
        </Typography>
        
        <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
            IPA: {pattern.phonetic.segments.map(s => s.ipa).join(' • ')}
          </Typography>
          
          {pattern.phonetic.commonSounds && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Vowel Sounds:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {pattern.phonetic.commonSounds.vowels.map((vowel, i) => (
                    <Chip
                      key={`vowel-${i}`}
                      label={vowel}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        bgcolor: `${patternColor}10`,
                        borderColor: `${patternColor}30`,
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Consonant Sounds:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {pattern.phonetic.commonSounds.consonants.map((consonant, i) => (
                    <Chip
                      key={`consonant-${i}`}
                      label={consonant}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        bgcolor: `${patternColor}10`,
                        borderColor: `${patternColor}30`,
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Box>
    );
  };

  const creativeSuggestions = getCreativeSuggestions();

  return (
    <Card
      sx={{
        position: 'relative',
        borderRadius: 2,
        border: `2px solid ${patternColor}30`,
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: `${patternColor}60`,
          boxShadow: `0 4px 20px ${patternColor}20`,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={onPatternClick}
    >
      <CardContent sx={{ pb: expanded ? 2 : 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label={pattern.type.replace('_', ' ')}
            size="small"
            sx={{
              bgcolor: `${patternColor}20`,
              color: patternColor,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          />
          
          {pattern.acousticFeatures?.primaryFeature && (
            <Chip
              label={pattern.acousticFeatures.primaryFeature}
              size="small"
              variant="outlined"
              sx={{ 
                borderColor: `${patternColor}40`,
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}
            />
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Play pattern sound">
              <IconButton
                size="small"
                onClick={handlePlaySound}
                sx={{
                  color: patternColor,
                  '&:hover': { bgcolor: `${patternColor}10` }
                }}
              >
                <PlayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Copy to clipboard">
              <IconButton
                size="small"
                onClick={handleCopyToClipboard}
                sx={{
                  color: patternColor,
                  '&:hover': { bgcolor: `${patternColor}10` }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Creative suggestions">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreativeMode(!showCreativeMode);
                }}
                sx={{
                  color: showCreativeMode ? patternColor : 'text.secondary',
                  '&:hover': { bgcolor: `${patternColor}10` }
                }}
              >
                <LightbulbIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {onExpand && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                sx={{
                  color: 'text.secondary',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Box>

        {/* Pattern Text */}
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          "{pattern.originalText}"
        </Typography>

        {/* Pattern Segments */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Matching Words:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {patternSegments.map((segment, index) => (
              <Chip
                key={segment.id}
                label={segment.text}
                size="small"
                sx={{
                  bgcolor: `${patternColor}15`,
                  color: patternColor,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: `${patternColor}25`
                  }
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Creative Mode Panel */}
        <Collapse in={showCreativeMode}>
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LightbulbIcon fontSize="small" color="primary" />
              Creative Writing Tips
            </Typography>
            
            <Stack spacing={1}>
              {creativeSuggestions.map((suggestion, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: patternColor, mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {suggestion}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Collapse>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Description */}
          {pattern.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {pattern.description}
            </Typography>
          )}

          {/* Acoustic Features */}
          {pattern.acousticFeatures?.secondaryFeatures && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Sound Features:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {pattern.acousticFeatures.secondaryFeatures.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: `${patternColor}30`,
                      color: 'text.secondary',
                      fontSize: '0.7rem'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Phonetic Details */}
          {getPhoneticInsights()}

          {/* Cultural Context */}
          {pattern.languageSpecific?.culturalContext && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BrainIcon fontSize="small" />
                Cultural Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pattern.languageSpecific.culturalContext}
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}; 