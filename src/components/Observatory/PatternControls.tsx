import { FC } from 'react';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FilterList as FilterIcon,
  Layers as LayersIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PatternType } from '../../types/observatory';
import { getPatternColor, getPatternId } from './colorSystem';
import { Pattern } from '../../types/observation';

interface PatternControlsProps {
  selectedTypes: PatternType[];
  onTypeToggle: (type: PatternType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: 'frequency' | 'position' | 'complexity';
  onSortChange: (sort: 'frequency' | 'position' | 'complexity') => void;
  isCreativeMode?: boolean;
  availableTypes: PatternType[];
}

const getPatternMeaning = (patternType: string): string => {
  const meanings: Record<string, string> = {
    rhyme: 'Words that share similar ending sounds',
    assonance: 'Repetition of vowel sounds',
    consonance: 'Repetition of consonant sounds',
    alliteration: 'Words that start with the same sound',
    rhythm: 'Regular pattern of stressed and unstressed syllables',
    sibilance: 'Repetition of "s" and "sh" sounds',
    internal_rhyme: 'Rhyming words within the same line'
  };
  return meanings[patternType] || patternType;
};

const getPatternBackground = (patternType: string): string => {
  const color = getPatternColor(patternType as any);
  return `${color}33`; // Add 20% opacity
};

const PatternControls: FC<PatternControlsProps> = ({
  selectedTypes,
  onTypeToggle,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  isCreativeMode,
  availableTypes
}) => {
  const { t } = useTranslation();

  // Group pattern types by category
  const patternGroups = {
    'Sound Patterns': ['rhyme', 'assonance', 'consonance', 'alliteration', 'sibilance'],
    'Complex Patterns': ['internal_rhyme', 'slant_rhyme', 'sound_parallelism'],
    'Rhythm & Structure': ['rhythm', 'meter', 'caesura', 'parallelism'],
    'Cultural Elements': ['code_switching', 'cultural_resonance', 'emotional_emphasis']
  };

  return (
    <Stack spacing={2}>
      {/* Search and View Controls */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('controls.search_patterns')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flex: 1 }}
        />
        
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(_, value) => value && onViewModeChange(value)}
        >
          <ToggleButton value="grid">
            <ViewModuleIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewListIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Pattern Type Groups */}
      {Object.entries(patternGroups).map(([groupName, types]) => {
        const availableInGroup = types.filter(type => 
          availableTypes.includes(type as PatternType)
        );

        if (availableInGroup.length === 0) return null;

        return (
          <Paper key={groupName} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'text.secondary'
            }}>
              <LayersIcon fontSize="small" />
              {groupName}
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {availableInGroup.map((type) => {
                const patternType = type as PatternType;
                
                return (
                  <Tooltip 
                    key={type} 
                    title={getPatternMeaning(patternType)}
                    arrow
                  >
                    <Chip
                      label={t(`pattern.${type}`)}
                      size="small"
                      onClick={() => onTypeToggle(patternType)}
                      sx={{
                        mb: 1,
                        bgcolor: selectedTypes.includes(patternType) ? getPatternBackground(patternType) : 'transparent',
                        borderColor: getPatternColor(patternType as any),
                        color: getPatternColor(patternType),
                        fontWeight: selectedTypes.includes(patternType) ? 600 : 400,
                        '&:hover': {
                          bgcolor: getPatternBackground(patternType)
                        }
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Stack>
          </Paper>
        );
      })}

      {/* Sort Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SortIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <ToggleButtonGroup
          size="small"
          value={sortBy}
          exclusive
          onChange={(_, value) => value && onSortChange(value)}
        >
          <ToggleButton value="frequency">
            {t('controls.sort_frequency')}
          </ToggleButton>
          <ToggleButton value="position">
            {t('controls.sort_position')}
          </ToggleButton>
          <ToggleButton value="complexity">
            {t('controls.sort_complexity')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
};

export default PatternControls; 