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
import { Pattern } from '../../types/observatory';
import { PatternConstellation } from '../celestial/PatternConstellation';

interface PatternAnalysisProps {
  pattern: Pattern;
  relatedPatterns: Pattern[];
  onPatternSelect: (patternId: string) => void;
}

export const PatternAnalysis: React.FC<PatternAnalysisProps> = ({
  pattern,
  relatedPatterns,
  onPatternSelect,
}) => {
  const { t } = useTranslation();

  const getPatternRelationship = (p1: Pattern, p2: Pattern): string => {
    // Calculate pattern relationships based on:
    // - Phonetic similarity
    // - Position in text
    // - Acoustic features
    // - Cultural context
    const relationships = [];

    if (p1.acousticFeatures?.primaryFeature === p2.acousticFeatures?.primaryFeature) {
      relationships.push('acoustic_similarity');
    }

    if (p1.languageSpecific?.culturalContext === p2.languageSpecific?.culturalContext) {
      relationships.push('cultural_context');
    }

    // Position-based relationship
    const p1Start = p1.segments[0].globalStartIndex;
    const p2Start = p2.segments[0].globalStartIndex;
    if (Math.abs(p1Start - p2Start) < 50) {
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
                    primary={relatedPattern.segments.map(s => s.text).join(' ')}
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
                pattern={pattern}
                width={800}
                height={200}
                animated={true}
                glowIntensity={0.8}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 