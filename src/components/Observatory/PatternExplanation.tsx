import React from 'react';
import { Tooltip, Card, Typography, Box, Paper } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from 'react-i18next';
import { Pattern } from '../../types/observatory';

interface PatternExplanationProps {
  pattern?: Pattern;
}

export const PatternExplanation: React.FC<PatternExplanationProps> = ({ pattern }) => {
  const { t } = useTranslation();

  const getPatternDescription = (type: string) => {
    return t(`patterns.${type}.description`, {
      defaultValue: t('patterns.generic.description')
    });
  };

  const getFeatureExplanation = (feature: string) => {
    return t(`features.${feature}.explanation`, {
      defaultValue: t('features.generic.explanation')
    });
  };

  if (!pattern) {
    return (
        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', mt: 2, backgroundColor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary">
                {t('observatory.hover_for_details')}
            </Typography>
        </Paper>
    );
  }

  const { type, segments, acousticFeatures } = pattern;

  return (
    <Card sx={{ 
      p: 2, 
      mt: 2, 
      backgroundColor: 'background.paper',
      borderRadius: 2,
      boxShadow: 2
    }}>
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="h6" component="h3" color="primary">
          {t(`patterns.${type}.title`)}
        </Typography>
        <Tooltip title={getPatternDescription(type)} arrow placement="top">
          <InfoIcon sx={{ ml: 1, cursor: 'help' }} color="action" />
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        {getPatternDescription(type)}
      </Typography>

      <Box mb={2}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          {t('observatory.pattern.examples')}:
        </Typography>
        {segments.map((segment, index) => (
          <Box 
            key={index}
            sx={{ 
              p: 1, 
              mb: 1, 
              backgroundColor: 'action.hover',
              borderRadius: 1,
              display: 'inline-block',
              mr: 1
            }}
          >
            <Typography variant="body2">"{segment.text}"</Typography>
          </Box>
        ))}
      </Box>

      {acousticFeatures && (
        <Box>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {t('observatory.pattern.features')}:
          </Typography>
          
          <Box mb={1}>
            <Tooltip 
              title={getFeatureExplanation(acousticFeatures.primaryFeature)} 
              arrow 
              placement="top"
            >
              <Typography 
                variant="body2" 
                component="span"
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'help'
                }}
              >
                {t(`features.${acousticFeatures.primaryFeature}.name`)}
              </Typography>
            </Tooltip>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {acousticFeatures.secondaryFeatures.map((feature, index) => (
              <Tooltip 
                key={index}
                title={getFeatureExplanation(feature)} 
                arrow 
                placement="top"
              >
                <Typography 
                  variant="body2" 
                  component="span"
                  sx={{ 
                    backgroundColor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: 'help'
                  }}
                >
                  {t(`features.${feature}.name`)}
                </Typography>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
}; 