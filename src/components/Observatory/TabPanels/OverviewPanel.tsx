import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  VolumeUp as VolumeUpIcon,
  Insights as InsightsIcon,
  AutoAwesome as SparkleIcon,
  MusicNote as MusicIcon,
  Create as PenIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ObservatoryState } from '../types';
import { ObservationResult, Pattern, PatternType } from '../../../types/observatory';
import { PatternCard } from '../PatternCard';
import { getPatternColor } from '../colorSystem';

interface OverviewPanelProps {
  observation: ObservationResult;
  state: ObservatoryState;
  onStateChange: (newState: Partial<ObservatoryState>) => void;
  onPatternClick: (pattern: Pattern) => void;
  onPatternExpand: (patternId: string) => void;
}

interface PatternStat {
  type: PatternType;
  count: number;
  instances: number;
  patterns: Pattern[];
  density: number; // patterns per 100 words
  coverage: number; // percentage of text covered
  musicalScore: number; // 0-100 rating for musical/rhythmic quality
}

const PATTERN_WEIGHTS: Record<PatternType, number> = {
  rhyme: 1.0,
  assonance: 0.8,
  consonance: 0.8,
  alliteration: 0.9,
  rhythm: 0.7,
  sibilance: 0.6,
  internal_rhyme: 0.8,
  slant_rhyme: 0.7,
  repetition: 0.8,
  parallelism: 0.7,
  sound_parallelism: 0.7,
  meter: 0.9,
  caesura: 0.5,
  code_switching: 1.0,
  cultural_resonance: 0.9,
  emotional_emphasis: 0.9
};

const PATTERN_ICONS: Record<PatternType, React.ReactNode> = {
  rhyme: <MusicIcon />,
  assonance: <SparkleIcon />,
  consonance: <SparkleIcon />,
  alliteration: <SparkleIcon />,
  rhythm: <MusicIcon />,
  sibilance: <SparkleIcon />,
  internal_rhyme: <MusicIcon />,
  slant_rhyme: <MusicIcon />,
  repetition: <SparkleIcon />,
  parallelism: <SparkleIcon />,
  sound_parallelism: <SparkleIcon />,
  meter: <MusicIcon />,
  caesura: <MusicIcon />,
  code_switching: <SparkleIcon />,
  cultural_resonance: <SparkleIcon />,
  emotional_emphasis: <SparkleIcon />
};

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  observation,
  state,
  onStateChange,
  onPatternClick,
  onPatternExpand
}) => {
  const { t, i18n } = useTranslation();

  // Define calculateMusicalScore function before using it
  const calculateMusicalScore = (type: PatternType, patterns: Pattern[], instances: number, density: number): number => {
    let score = 0;
    
    // Base scores for different pattern types (musical/rhythmic value)
    const typeScores: Record<PatternType, number> = {
      rhyme: 35,
      assonance: 20,
      consonance: 15,
      alliteration: 25,
      rhythm: 40,
      sibilance: 10,
      internal_rhyme: 30,
      slant_rhyme: 15,
      repetition: 20,
      parallelism: 15,
      sound_parallelism: 25,
      meter: 35,
      caesura: 20,
      code_switching: 30,
      cultural_resonance: 25,
      emotional_emphasis: 30
    };
    
    score += typeScores[type] || 10;
    
    // Density bonus (more patterns = more musical)
    score += Math.min(density * 2, 30);
    
    // Instance bonus (repeated patterns = more rhythmic)
    score += Math.min(instances * 0.5, 20);
    
    // Pattern count bonus
    score += Math.min(patterns.length, 10);
    
    return Math.min(Math.round(score), 100);
  };

  const patternStats = useMemo(() => {
    if (!observation) return [];

    const wordCount = observation.text.split(/\s+/).length;
    const textLength = observation.text.length;
    
    // Group patterns by type with enhanced metrics
    const grouped = new Map<PatternType, Pattern[]>();
    observation.patterns.forEach(pattern => {
      if (!grouped.has(pattern.type)) {
        grouped.set(pattern.type, []);
      }
      grouped.get(pattern.type)!.push(pattern);
    });

    // Calculate advanced metrics for each pattern type
    return Array.from(grouped.entries()).map(([type, patterns]) => {
      const instances = patterns.reduce((sum, p) => sum + p.segments.length, 0);
      const density = (patterns.length / wordCount) * 100;
      
      // Calculate text coverage (how much of the text has this pattern)
      const coveredCharacters = new Set<number>();
      patterns.forEach(pattern => {
        pattern.segments.forEach(segId => {
          const segment = observation.segments.find(s => s.id === segId);
          if (segment) {
            for (let i = segment.startIndex; i < segment.endIndex; i++) {
              coveredCharacters.add(i);
            }
          }
        });
      });
      const coverage = (coveredCharacters.size / textLength) * 100;
      
      // Calculate musical/rhythmic score based on pattern characteristics
      const musicalScore = calculateMusicalScore(type, patterns, instances, density);

      return {
        type,
        count: patterns.length,
        instances,
        patterns,
        density,
        coverage,
        musicalScore
      } satisfies PatternStat;
    }).sort((a, b) => b.musicalScore - a.musicalScore); // Sort by musical potential
  }, [observation, calculateMusicalScore]);

  const playPatternSound = (patternStat: PatternStat) => {
    if ('speechSynthesis' in window) {
      // Create a sample of the pattern for audio preview
      const sampleText = patternStat.patterns
        .slice(0, 3)
        .map(p => p.originalText)
        .join(', ')
        .replace(/\s*\/\s*/g, ' ')
        .trim();
      
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = i18n.language.startsWith('en') ? 'en-US' : i18n.language;
      utterance.rate = 0.8; // Slower for better pattern appreciation
      utterance.pitch = 1.1; // Slightly higher pitch for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const getPatternTypeIcon = (type: PatternType): React.ReactNode => {
    const iconMap: Record<PatternType, React.ReactNode> = {
      rhyme: <VolumeUpIcon />,
      assonance: <MusicIcon />,
      consonance: <PenIcon />,
      alliteration: <SparkleIcon />,
      rhythm: <MusicIcon />,
      sibilance: <VolumeUpIcon />,
      internal_rhyme: <VolumeUpIcon />,
      slant_rhyme: <VolumeUpIcon />,
      repetition: <SparkleIcon />,
      parallelism: <InsightsIcon />,
      sound_parallelism: <InsightsIcon />,
      meter: <MusicIcon />,
      caesura: <PaletteIcon />,
      code_switching: <SparkleIcon />,
      cultural_resonance: <InsightsIcon />,
      emotional_emphasis: <SparkleIcon />
    };
    return iconMap[type] || <SparkleIcon />;
  };

  const getPatternInsight = (stat: PatternStat): string => {
    if (stat.density > 5) return 'High density - excellent for rhythm!';
    if (stat.coverage > 20) return 'Wide coverage - great for cohesion!';
    if (stat.musicalScore > 70) return 'Strong musical potential!';
    if (stat.instances > 10) return 'Rich repetition - perfect for songs!';
    return 'Subtle but effective pattern';
  };

  if (!observation) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('observatory.no_observation')}
        </Typography>
      </Box>
    );
  }

  const totalPatterns = patternStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalInstances = patternStats.reduce((sum, stat) => sum + stat.instances, 0);
  const averageMusicalScore = patternStats.reduce((sum, stat) => sum + stat.musicalScore, 0) / patternStats.length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Overall Metrics Card */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightsIcon color="primary" />
            Pattern Analysis Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {totalPatterns}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unique Patterns
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {totalInstances}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Instances
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {Math.round(averageMusicalScore)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Musical Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {observation.text.split(/\s+/).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Words
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pattern Gallery - Show patterns visually */}
      {observation.patterns.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon color="primary" />
              🎭 Pattern Gallery - Click any pattern to explore
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {observation.patterns.slice(0, 12).map((pattern) => (
                <Chip
                  key={pattern.id}
                  label={`${pattern.type}: "${pattern.originalText.length > 20 ? pattern.originalText.substring(0, 20) + '...' : pattern.originalText}"`}
                  size="small"
                  clickable
                  variant="outlined"
                  color="primary"
                  onClick={() => onPatternClick?.(pattern)}
                  sx={{
                    mb: 1,
                    maxWidth: 250,
                    bgcolor: `${getPatternColor(pattern.type)}15`,
                    borderColor: getPatternColor(pattern.type),
                    color: getPatternColor(pattern.type),
                    '& .MuiChip-label': {
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      fontWeight: 500
                    },
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 2px 8px ${getPatternColor(pattern.type)}40`,
                      bgcolor: `${getPatternColor(pattern.type)}25`,
                      transition: 'all 0.2s'
                    }
                  }}
                />
              ))}
              {observation.patterns.length > 12 && (
                <Chip
                  label={`+${observation.patterns.length - 12} more patterns in detailed view below...`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ mb: 1, fontStyle: 'italic' }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Patterns ranked by musical and rhythmic potential for creative writing
      </Typography>

      <Stack spacing={2}>
        {patternStats.map((stat) => (
          <Accordion
            key={stat.type}
            expanded={state.expandedPattern === stat.type}
            onChange={(_, isExpanded) => 
              onStateChange({ expandedPattern: isExpanded ? stat.type : null })}
            sx={{
              '&:before': { display: 'none' },
              bgcolor: 'background.paper',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '&.Mui-expanded': {
                boxShadow: `0 4px 20px ${getPatternColor(stat.type)}20`
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ color: getPatternColor(stat.type) }}>
                  {getPatternTypeIcon(stat.type)}
                </Box>
                
                <Chip
                  label={stat.type.replace('_', ' ')}
                  size="small"
                  sx={{
                    bgcolor: `${getPatternColor(stat.type)}22`,
                    color: getPatternColor(stat.type),
                    borderColor: `${getPatternColor(stat.type)}44`,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                />
                
                <Box sx={{ flexGrow: 1, mx: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {stat.count} pattern{stat.count !== 1 ? 's' : ''} • {stat.instances} instance{stat.instances !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getPatternInsight(stat)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ minWidth: 60 }}>
                    <LinearProgress
                      variant="determinate"
                      value={stat.musicalScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getPatternColor(stat.type),
                          borderRadius: 3
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {stat.musicalScore}% musical
                    </Typography>
                  </Box>
                  
                  <Tooltip title="Play pattern sounds">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPatternSound(stat);
                      }}
                      sx={{
                        color: getPatternColor(stat.type),
                        '&:hover': {
                          bgcolor: `${getPatternColor(stat.type)}20`
                        }
                      }}
                    >
                      <PlayIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {/* Advanced metrics */}
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Density
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {stat.density.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Coverage
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {stat.coverage.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Musical Score
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {stat.musicalScore}/100
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={1}>
                {stat.patterns.slice(0, 5).map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    segments={observation?.segments || []}
                    isCreativeMode={state.isCreativeMode}
                    onPatternClick={() => onPatternClick(pattern)}
                    expanded={state.expandedPattern === pattern.id}
                    onExpand={() => onPatternExpand(pattern.id)}
                  />
                ))}
                {stat.patterns.length > 5 && (
                  <Button 
                    size="small" 
                    onClick={() => onStateChange({ expandedPattern: null })}
                    sx={{ 
                      alignSelf: 'flex-start',
                      color: getPatternColor(stat.type),
                      '&:hover': {
                        bgcolor: `${getPatternColor(stat.type)}10`
                      }
                    }}
                  >
                    {t('observatory.show_all', { count: stat.patterns.length - 5 })} more patterns
                  </Button>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}; 