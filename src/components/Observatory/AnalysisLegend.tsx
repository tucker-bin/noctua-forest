import React, { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Collapse,
  TextField,
  IconButton,
  InputAdornment,
  Badge,
  Divider,
  Tooltip,
  ListItemIcon,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  ExpandLess, 
  ExpandMore, 
  Search, 
  Clear, 
  Tag as TagIcon,
  VolumeUp,
  GraphicEq,
  AccountTree,
  Psychology
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Pattern, PatternType, PATTERN_TAGS } from '../../types/observatory';

interface AnalysisLegendProps {
  patterns: Pattern[];
  onToggleFilter: (patternType: string) => void;
  activeFilters: Set<string>;
  palette: Record<string, string>;
  activePatterns: Set<Pattern>;
  onPatternInstanceClick: (pattern: Pattern) => void;
}

// Simplified pattern descriptions
const patternDescriptions: Record<string, string> = {
  'alliteration': 'Same starting sounds',
  'assonance': 'Similar vowel sounds',
  'consonance': 'Similar consonant sounds',
  'rhyme': 'End rhymes',
  'internal_rhyme': 'Rhymes within lines',
  'rhythm': 'Beat patterns',
  'repetition': 'Repeated words',
  'phonetic_similarity': 'Sound-alike words'
};

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({
  patterns,
  onToggleFilter,
  activeFilters,
  palette,
  activePatterns,
  onPatternInstanceClick
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Group patterns by category for cleaner organization
  const patternsByCategory = useMemo(() => {
    const categories = {
      sound: [] as Pattern[],
      rhythm: [] as Pattern[],
      structure: [] as Pattern[],
      meaning: [] as Pattern[],
      other: [] as Pattern[]
    };

    patterns.forEach(pattern => {
      const tags = PATTERN_TAGS[pattern.type];
      if (tags && tags.length > 0) {
        const category = tags[0].category;
        if (category in categories) {
          categories[category as keyof typeof categories].push(pattern);
        } else {
          categories.other.push(pattern);
        }
      } else {
        categories.other.push(pattern);
      }
    });

    return categories;
  }, [patterns]);

  // Group patterns by type with simplified metrics
  const patternGroups = useMemo(() => {
    const groups = new Map<string, Pattern[]>();
    patterns.forEach(pattern => {
      const type = pattern.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)?.push(pattern);
    });
    
    return Array.from(groups.entries())
      .map(([type, typePatterns]) => ({
        type,
        patterns: typePatterns,
        count: typePatterns.length,
        totalSegments: typePatterns.reduce((sum, p) => sum + p.segments.length, 0),
        description: patternDescriptions[type] || 'Sound pattern',
        tags: PATTERN_TAGS[type] || []
      }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }, [patterns]);

  // Filter patterns based on search and category
  const filteredGroups = useMemo(() => {
    let filtered = patternGroups;

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(group => {
        const tags = PATTERN_TAGS[group.type];
        return tags && tags.some(tag => tag.category === categoryFilter);
      });
    }

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.type.toLowerCase().includes(lowerSearchTerm) ||
        group.description.toLowerCase().includes(lowerSearchTerm) ||
        group.patterns.some(pattern => 
          pattern.segments.some(segment => 
            segment.text.toLowerCase().includes(lowerSearchTerm)
          )
        )
      );
    }

    return filtered;
  }, [patternGroups, searchTerm, categoryFilter]);

  const handleToggleExpand = useCallback((type: string) => {
    setExpandedTypes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(type)) {
        newExpanded.delete(type);
      } else {
        newExpanded.add(type);
      }
      return newExpanded;
    });
  }, []);

  const getPatternColor = useCallback((type: string) => {
    return palette[type] || palette.default || '#6B7280';
  }, [palette]);

  const formatPatternType = useCallback((type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sound': return <VolumeUp fontSize="small" />;
      case 'rhythm': return <GraphicEq fontSize="small" />;
      case 'structure': return <AccountTree fontSize="small" />;
      case 'meaning': return <Psychology fontSize="small" />;
      default: return <TagIcon fontSize="small" />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 1, color: '#F3F4F6' }}>
          Patterns Found ({patterns.length})
        </Typography>
        
        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="simple" sx={{ px: 2, fontSize: '0.75rem' }}>
            Simple
          </ToggleButton>
          <ToggleButton value="detailed" sx={{ px: 2, fontSize: '0.75rem' }}>
            Detailed
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Category Filter */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={categoryFilter}
            exclusive
            onChange={(_, newCategory) => newCategory && setCategoryFilter(newCategory)}
            size="small"
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.7rem' }}>
              All
            </ToggleButton>
            <ToggleButton value="sound" sx={{ px: 1.5, fontSize: '0.7rem' }}>
              <VolumeUp sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              Sound
            </ToggleButton>
            <ToggleButton value="rhythm" sx={{ px: 1.5, fontSize: '0.7rem' }}>
              <GraphicEq sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              Rhythm
            </ToggleButton>
            <ToggleButton value="structure" sx={{ px: 1.5, fontSize: '0.7rem' }}>
              <AccountTree sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              Structure
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search patterns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Pattern Groups */}
      <List dense sx={{ maxHeight: '50vh', overflow: 'auto' }}>
        {filteredGroups.map(({ type, patterns: typePatterns, count, totalSegments, description, tags }) => {
          const isFilteredByText = activePatterns.size > 0;
          const patternsOfTypeInSelection = Array.from(activePatterns).filter(p => p.type === type);
          const isTypeActiveInText = patternsOfTypeInSelection.length > 0;
          
          const isVisibleInLegend = activeFilters.has(type) || activeFilters.size === 0;
          const isDimmed = isFilteredByText && !isTypeActiveInText;

          const isExpanded = expandedTypes.has(type);
          const color = getPatternColor(type);
          const primaryTag = tags[0];

          return (
            <React.Fragment key={type}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => onToggleFilter(type)}
                  sx={{
                    py: 1,
                    opacity: isDimmed ? 0.4 : 1,
                    backgroundColor: isVisibleInLegend && !isDimmed ? `${color}15` : 'transparent',
                    borderRadius: 2,
                    mb: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: `${color}25`,
                      opacity: 1
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: isVisibleInLegend && !isDimmed ? '2px solid white' : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {primaryTag && getCategoryIcon(primaryTag.category)}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: isVisibleInLegend && !isDimmed ? 600 : 400,
                          color: '#F3F4F6'
                        }}>
                          {formatPatternType(type)}
                        </Typography>
                        <Chip
                          label={count}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            backgroundColor: color,
                            color: 'white',
                            minWidth: 24
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        {description} • {totalSegments} instances
                      </Typography>
                    }
                  />
                  
                  {viewMode === 'detailed' && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand(type);
                      }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Expanded Pattern Details */}
              {viewMode === 'detailed' && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List dense sx={{ pl: 4, maxHeight: '200px', overflow: 'auto' }}>
                    {typePatterns.slice(0, 10).map((pattern, index) => {
                      const isPatternActive = activePatterns.has(pattern);
                      const isPatternDimmed = isFilteredByText && !isPatternActive;
                      
                      return (
                        <ListItemButton 
                          key={pattern.id}
                          onClick={() => onPatternInstanceClick(pattern)}
                          sx={{ 
                            py: 0.5,
                            opacity: isPatternDimmed ? 0.4 : 1,
                            borderRadius: 1,
                            '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.05)' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="caption" sx={{ color: '#D1D5DB' }}>
                                "{pattern.segments.map(s => s.text).join(' ')}"
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                                {pattern.segments.length} segments
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                    {typePatterns.length > 10 && (
                      <ListItem>
                        <Typography variant="caption" color="text.secondary">
                          ... and {typePatterns.length - 10} more
                        </Typography>
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>

      {filteredGroups.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          {searchTerm ? `No patterns found matching "${searchTerm}"` : 'No patterns found'}
        </Typography>
      )}
    </Box>
  );
};

export default AnalysisLegend; 