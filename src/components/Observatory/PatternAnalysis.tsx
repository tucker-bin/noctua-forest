import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import TimelineIcon from '@mui/icons-material/Timeline';
import CompareIcon from '@mui/icons-material/Compare';
import InfoIcon from '@mui/icons-material/Info';
import { Pattern as ObservatoryPattern } from '../../types/observatory';
import { Pattern as ObservationPattern, Segment } from '../../types/observation';
import { PatternConstellation } from '../celestial/PatternConstellation';

interface PatternAnalysisProps {
  pattern: ObservatoryPattern;
  relatedPatterns: ObservatoryPattern[];
  onPatternSelect: (patternId: string) => void;
}

export const PatternAnalysis: React.FC<PatternAnalysisProps> = ({
  pattern,
  relatedPatterns,
  onPatternSelect,
}) => {
  const { t } = useTranslation();

  const comparePatternPositions = (p1: ObservatoryPattern, p2: ObservatoryPattern): number => {
    const p1Segments = p1.segments as unknown as Segment[];
    const p2Segments = p2.segments as unknown as Segment[];
    const p1Start = p1Segments[0]?.globalStartIndex || 0;
    const p2Start = p2Segments[0]?.globalStartIndex || 0;
    return p1Start - p2Start;
  };

  const getPatternRelationship = (pattern: ObservatoryPattern, relatedPattern: ObservatoryPattern): string => {
    const relationships: string[] = [];

    // Language-specific relationship
    if (pattern.languageSpecific?.language === relatedPattern.languageSpecific?.language) {
      relationships.push('same language');
    }

    if (pattern.acousticFeatures?.primaryFeature === relatedPattern.acousticFeatures?.primaryFeature) {
      relationships.push('acoustic_similarity');
    }

    if (pattern.languageSpecific?.culturalContext === relatedPattern.languageSpecific?.culturalContext) {
      relationships.push('cultural_context');
    }

    // Position-based relationship
    const positionDifference = comparePatternPositions(pattern, relatedPattern);
    if (Math.abs(positionDifference) < 50) {
      relationships.push('proximity');
    }

    return relationships.join(', ');
  };

  const renderFeatureList = (features: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {features.map((feature, index) => (
        <Chip
          key={index}
          label={t(`features.${feature}`)}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 215, 0, 0.1)',
            color: 'secondary.main',
            '&:hover': {
              bgcolor: 'rgba(255, 215, 0, 0.2)',
            },
          }}
        />
      ))}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
        {t('analysis.detailed_title')}
      </Typography>

      <Grid container spacing={3}>
        {/* Pattern Details */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              bgcolor: 'rgba(26, 27, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {t('analysis.primary_features')}
            </Typography>
            {pattern.acousticFeatures && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t('analysis.primary_feature')}:
                </Typography>
                {renderFeatureList([pattern.acousticFeatures.primaryFeature])}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {t('analysis.secondary_features')}:
                </Typography>
                {renderFeatureList(pattern.acousticFeatures.secondaryFeatures)}
              </>
            )}

            {pattern.languageSpecific && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('analysis.language_specific')}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'secondary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('analysis.language')}
                      secondary={pattern.languageSpecific.language}
                    />
                  </ListItem>
                  {pattern.languageSpecific.culturalContext && (
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon sx={{ color: 'secondary.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('analysis.cultural_context')}
                        secondary={pattern.languageSpecific.culturalContext}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Pattern Relationships */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              bgcolor: 'rgba(26, 27, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {t('analysis.related_patterns')}
            </Typography>
            <List>
              {relatedPatterns.map((relatedPattern) => (
                <ListItem
                  key={relatedPattern.id}
                  button
                  onClick={() => onPatternSelect(relatedPattern.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255, 215, 0, 0.1)',
                    },
                  }}
                >
                  <ListItemText
                    primary={relatedPattern.segments.map((s: unknown) => (s as Segment).text).join(' ')}
                    secondary={getPatternRelationship(pattern, relatedPattern)}
                  />
                  <Tooltip title={t('analysis.view_pattern')}>
                    <IconButton size="small" sx={{ color: 'secondary.main' }}>
                      <CompareIcon />
                    </IconButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Pattern Evolution */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              bgcolor: 'rgba(26, 27, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {t('analysis.pattern_evolution')}
            </Typography>
            <Box sx={{ height: 200, position: 'relative' }}>
              <PatternConstellation
                patterns={[pattern, ...relatedPatterns].map(p => ({
                  ...p,
                  segments: (p.segments as unknown as Segment[])
                }))}
                onHoverPattern={(id) => id && onPatternSelect(id)}
                activeFilters={new Set()}
                colorPalette="vibrant"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 