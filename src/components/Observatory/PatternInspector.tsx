import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Card, 
  CardContent, 
  IconButton, 
  Collapse,
  Tooltip,
  Button
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { Pattern } from '../../types/observatory';

interface PatternInspectorProps {
  patterns: Pattern[];
  selectedPattern?: Pattern;
  onPatternSelect?: (pattern: Pattern) => void;
  significanceThreshold?: number;
}

export const PatternInspector: React.FC<PatternInspectorProps> = ({
  patterns,
  selectedPattern,
  onPatternSelect,
  significanceThreshold = 0.3
}) => {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Filter and sort patterns by significance
  const displayPatterns = useMemo(() => {
    return patterns
      .filter(pattern => (pattern.significance || 0) >= significanceThreshold)
      .sort((a, b) => (b.significance || 0) - (a.significance || 0))
      .slice(0, 12); // Show top 12 patterns
  }, [patterns, significanceThreshold]);

  // Generate pattern-specific insights
  const getPatternInsight = (pattern: Pattern): string => {
    const patternType = pattern.type;
    const significance = pattern.significance || 0;
    const segmentCount = pattern.segments.length;
    
    const insights: Record<string, (p: Pattern) => string> = {
      'rhyme': (p) => `Your "${p.originalText}" creates ${segmentCount > 2 ? 'multiple' : 'paired'} end rhymes ${significance > 0.7 ? 'with strong resonance' : 'with subtle harmony'}`,
      'alliteration': (p) => `The "${p.originalText}" alliteration ${significance > 0.8 ? 'creates powerful emphasis' : 'adds rhythmic flow'} through repeated initial sounds`,
      'assonance': (p) => `Your vowel harmony in "${p.originalText}" ${significance > 0.7 ? 'creates rich melodic unity' : 'adds subtle musical continuity'}`,
      'consonance': (p) => `The consonant patterns in "${p.originalText}" ${significance > 0.7 ? 'build strong textural foundation' : 'create gentle sound echoes'}`,
      'internal_rhyme': (p) => `Internal rhyming in "${p.originalText}" shows sophisticated structural control`,
      'rhythm': (p) => `Your rhythmic pattern in "${p.originalText}" ${significance > 0.8 ? 'drives powerful momentum' : 'creates steady flow'}`,
      'repetition': (p) => `Repetition of "${p.originalText}" ${significance > 0.7 ? 'builds strong emphasis' : 'creates subtle reinforcement'}`
    };

    return insights[patternType]?.(pattern) || `Your ${patternType} pattern in "${pattern.originalText}" adds creative structure to your text`;
  };

  const handlePatternClick = (pattern: Pattern) => {
    if (onPatternSelect) {
      onPatternSelect(pattern);
    }
    setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id);
  };

  const copyPatternExample = (pattern: Pattern) => {
    const example = `${pattern.type.toUpperCase()}: "${pattern.originalText}"`;
    navigator.clipboard?.writeText(example).then(() => {
      console.log('Pattern example copied to clipboard');
    });
  };

  const getSignificanceColor = (significance: number): string => {
    if (significance >= 0.8) return '#4caf50'; // Strong - Green
    if (significance >= 0.6) return '#ff9800'; // Good - Orange  
    if (significance >= 0.4) return '#2196f3'; // Decent - Blue
    return '#757575'; // Weak - Gray
  };

  const getSignificanceLabel = (significance: number): string => {
    if (significance >= 0.8) return 'Strong';
    if (significance >= 0.6) return 'Good';
    if (significance >= 0.4) return 'Decent';
    return 'Subtle';
  };

  if (displayPatterns.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          No significant patterns found. Try lowering the significance threshold.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightbulbIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          Pattern Inspector
        </Typography>
        <Chip 
          label={`${displayPatterns.length} patterns`} 
          size="small" 
          variant="outlined" 
        />
      </Box>

      {displayPatterns.map((pattern) => (
        <Card 
          key={pattern.id}
          sx={{ 
            mb: 1.5, 
            cursor: 'pointer',
            border: selectedPattern?.id === pattern.id ? '2px solid' : '1px solid',
            borderColor: selectedPattern?.id === pattern.id ? 'primary.main' : 'divider',
            '&:hover': {
              borderColor: 'primary.light',
              boxShadow: 2
            }
          }}
          onClick={() => handlePatternClick(pattern)}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={pattern.type.replace('_', ' ')}
                  size="small"
                  sx={{ 
                    backgroundColor: getSignificanceColor(pattern.significance || 0),
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  "{pattern.originalText}"
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  label={getSignificanceLabel(pattern.significance || 0)}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
                <Tooltip title="Copy pattern example">
                  <IconButton 
                    size="small" 
                    onClick={(e) => { e.stopPropagation(); copyPatternExample(pattern); }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  size="small"
                  sx={{
                    transform: expandedPattern === pattern.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedPattern === pattern.id}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                {/* Pattern-specific insight */}
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.dark' }}>
                    💡 {getPatternInsight(pattern)}
                  </Typography>
                </Box>

                {/* Technical details */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Segments:</strong> {pattern.segments.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Significance:</strong> {((pattern.significance || 0) * 100).toFixed(0)}%
                  </Typography>
                </Box>

                {/* Acoustic features */}
                {pattern.acousticFeatures && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Sound Features:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {pattern.acousticFeatures.primaryFeature}
                    </Typography>
                    {pattern.acousticFeatures.secondaryFeatures && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {pattern.acousticFeatures.secondaryFeatures.slice(0, 3).map((feature, index) => (
                          <Chip 
                            key={index}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {patterns.length > displayPatterns.length && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Showing top {displayPatterns.length} patterns. 
            {patterns.length - displayPatterns.length} more patterns available with lower significance.
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 