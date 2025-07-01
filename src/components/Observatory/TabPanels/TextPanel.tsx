import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  Badge,
  Divider,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  TextFields as TextFieldsIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  VolumeUp as VolumeUpIcon,
  Edit as EditIcon,
  AutoAwesome as SparkleIcon,
  FormatLineSpacing as LineSpacingIcon,
  FormatSize as FontSizeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ObservatoryState } from '../types';
import { ObservationResult, PatternType, Pattern } from '../../../types/observatory';
import { HighlightedText } from '../HighlightedText';
import { ObservatoryTheme } from '../ObservatoryCustomizer';

interface TextPanelProps {
  observation: ObservationResult | null;
  state: ObservatoryState;
  onStateChange: (newState: Partial<ObservatoryState>) => void;
  theme: ObservatoryTheme; // ✅ Fixed: Use proper ObservatoryTheme type
  showPatternControls?: boolean; // 🎯 NEW: Show enhanced pattern controls
  onPatternClick?: (pattern: Pattern) => void; // 🎯 NEW: Handle pattern clicks
  onSwitchToCustomize?: () => void; // 🎯 NEW: Switch to customize tab
}

type HighlightMode = 'clean' | 'all' | 'focus' | 'musical' | 'creative';

export const TextPanel: React.FC<TextPanelProps> = ({
  observation,
  state,
  onStateChange,
  theme,
  showPatternControls,
  onPatternClick,
  onSwitchToCustomize
}) => {
  const { t, i18n } = useTranslation();
  const muiTheme = useTheme(); // Material-UI theme for palette access
  
  // 🎯 NEW: State for the new interaction model
  const [viewMode, setViewMode] = useState<'significant' | 'focus'>('significant');

  if (!observation) {
    return null;
  }

  // 🎯 NEW: Correctly identify all rhythm-related pattern types
  const RHYTHM_TYPES: PatternType[] = ['rhythm', 'meter', 'caesura', 'internal_rhyme', 'slant_rhyme'];

  const getPatternTypeCount = (type: PatternType, source: 'significant' | 'all') => {
    const patternSource = source === 'all' ? observation.allPatterns : observation.patterns;
    if (!patternSource) return 0;
    
    if (type === 'rhythm') {
      return patternSource.filter(p => RHYTHM_TYPES.includes(p.type)).length;
    }
    return patternSource.filter(p => p.type === type).length;
  };
  
  // 🎯 NEW: Filter patterns based on the new viewMode
  const getFilteredPatterns = (): Pattern[] => {
    const source = observation.allPatterns || observation.patterns;
    
    switch (viewMode) {
      case 'significant':
        return observation.patterns;
      case 'focus':
        if (state.selectedPatternTypes.size === 0) return observation.patterns;
        
        // Use sophisticated pattern analysis for rhymes
        return source.filter(p => {
          // For rhyme patterns, use advanced analysis
          if (state.selectedPatternTypes.has('rhyme')) {
            return p.type === 'rhyme' || p.type === 'slant_rhyme' || p.type === 'internal_rhyme';
          }
          
          // For rhythm patterns, include all rhythm-related types
          if (state.selectedPatternTypes.has('rhythm')) {
            return RHYTHM_TYPES.includes(p.type);
          }
          
          // For other pattern types, use exact match
          return state.selectedPatternTypes.has(p.type);
        }).sort((a, b) => {
          // Sort by significance and pattern complexity
          const sigDiff = (b.significance || 0) - (a.significance || 0);
          if (sigDiff !== 0) return sigDiff;
          
          // If significance is equal, prioritize by pattern type
          const typeOrder = {
            'rhyme': 5,
            'slant_rhyme': 4,
            'internal_rhyme': 3,
            'alliteration': 3,
            'assonance': 2,
            'consonance': 2,
            'rhythm': 1
          };
          return (typeOrder[b.type as keyof typeof typeOrder] || 0) - 
                 (typeOrder[a.type as keyof typeof typeOrder] || 0);
        });
      default:
        return observation.patterns;
    }
  };

  // 🎯 NEW: Handle toggling pattern types for focus mode
  const handleTypeToggle = (type: PatternType) => {
    // Single-focus mode: only one type can be selected at a time
    const newTypes = new Set<PatternType>();
    if (!state.selectedPatternTypes.has(type)) {
      newTypes.add(type);
    }
    // If the new set is empty, it means the user deselected the only active filter
    setViewMode(newTypes.size > 0 ? 'focus' : 'significant');
    onStateChange({ selectedPatternTypes: newTypes });
  };
  
  const handleClearFilters = () => {
    setViewMode('significant');
    onStateChange({ selectedPatternTypes: new Set() });
  };

  const priorityPatterns: PatternType[] = ['rhyme', 'rhythm', 'alliteration', 'assonance', 'consonance', 'repetition'];

  // Calculate text metrics
  const wordCount = observation.text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  const patternDensity = ((observation.patterns.length / wordCount) * 100).toFixed(1);

  const playTextAudio = () => {
    if ('speechSynthesis' in window) {
      // Clean up the text by removing slashes and normalizing whitespace
      const cleanText = observation.text.replace(/\s*\/\s*/g, ' ').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = i18n.language.startsWith('en') ? 'en-US' : i18n.language;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Simplified Control Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextFieldsIcon />
            💡 Hover words to explore, click to copy pattern info
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Play text audio">
              <IconButton size="small" onClick={playTextAudio} color="primary">
                <VolumeUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={state.isTextExpanded ? 'Collapse view' : 'Expand view'}>
              <IconButton 
                size="small" 
                onClick={() => onStateChange({ isTextExpanded: !state.isTextExpanded })}
                color={state.isTextExpanded ? 'primary' : 'default'}
              >
                {state.isTextExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Text Metrics */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`${wordCount} words`}
            size="small"
            icon={<EditIcon />}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          />
          <Chip
            label={`${readingTime} min read`}
            size="small"
            icon={<SpeedIcon />}
            color="secondary"
          />
          <Chip
            label={`${patternDensity}% pattern density`}
            size="small"
            icon={<TextFieldsIcon />}
            variant="outlined"
          />
        </Stack>

        {/* Simplified Highlight Mode Controls */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Highlight Mode
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="significant">
              <VisibilityOffIcon sx={{ mr: 1 }} />
              Significant Patterns
            </ToggleButton>
            <ToggleButton value="focus">
              Focus Selected
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Export and Customize Link */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              if (onSwitchToCustomize) {
                onSwitchToCustomize();
              }
            }}
            sx={{ flexShrink: 0 }}
          >
            Customize & Export
          </Button>
        </Box>

        {/* 🎯 REBUILT: Pattern Controls Section */}
        {showPatternControls && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Pattern Filters
              </Typography>
              <Button
                size="small"
                onClick={handleClearFilters}
                disabled={viewMode === 'significant' && state.selectedPatternTypes.size === 0}
              >
                Clear Filters
              </Button>
            </Box>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {priorityPatterns.map((patternType) => {
                const isSelected = state.selectedPatternTypes.has(patternType);
                const count = getPatternTypeCount(patternType, isSelected ? 'all' : 'significant');

                return (
                  <Chip
                    key={patternType}
                    label={`${patternType} (${count})`}
                    size="small"
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => handleTypeToggle(patternType)}
                    sx={{ mb: 1 }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Interactive Text Display */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: theme.expandedView ? 0 : 2,
          minHeight: state.isTextExpanded ? 400 : (theme.expandedView ? theme.viewportHeight : 200),
          maxHeight: state.isTextExpanded ? 'none' : (theme.expandedView ? 'none' : 500),
          overflow: state.isTextExpanded ? 'visible' : (theme.expandedView ? 'visible' : 'auto'),
          bgcolor: theme.expandedView ? 'transparent' : 'background.default',
          border: theme.expandedView ? 'none' : undefined,
          borderRadius: theme.expandedView ? 0 : undefined,
        }}
      >
        <HighlightedText
          text={observation.text}
          patterns={getFilteredPatterns()}
          segments={observation.segments}
          theme={theme}
          onPatternClick={onPatternClick}
        />
      </Paper>

      {/* Writing Tips (appears in expanded mode) */}
      {state.isTextExpanded && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SparkleIcon color="primary" />
            Writing Enhancement Tips
          </Typography>
          
          <Stack spacing={1}>
            {observation.patterns.length > 15 && (
              <Typography variant="body2" color="text.secondary">
                • Rich pattern density suggests strong musicality - perfect for song lyrics or performance poetry
              </Typography>
            )}
            {getPatternTypeCount('rhyme', 'all') > 3 && (
              <Typography variant="body2" color="text.secondary">
                • Strong rhyme patterns detected - consider varying the rhyme scheme for dynamic effect
              </Typography>
            )}
            {getPatternTypeCount('alliteration', 'all') > 2 && (
              <Typography variant="body2" color="text.secondary">
                • Alliteration creates memorable hooks - great for titles and key phrases
              </Typography>
            )}
            {getPatternTypeCount('rhythm', 'all') > 1 && (
              <Typography variant="body2" color="text.secondary">
                • Rhythmic patterns suggest natural musical flow - perfect for setting to melody
              </Typography>
            )}
            {observation.patterns.length < 5 && (
              <Typography variant="body2" color="text.secondary">
                • Try adding more sound patterns for increased musical appeal and memorability
              </Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}; 