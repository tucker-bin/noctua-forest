import React from 'react';
import { Box, Typography, Chip, Paper, Divider } from '@mui/material';
import { Language, Translate, CompareArrows } from '@mui/icons-material';

interface DetectedLanguage {
  code: string;
  name: string;
  script: string;
  confidence: number;
  segments: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
}

interface CodeSwitchingPoint {
  position: number;
  fromLanguage: string;
  toLanguage: string;
  phoneticTransition: string;
}

interface CulturalPattern {
  type: string;
  nativeName: string;
  description: string;
  phoneticContext: string;
  culturalSignificance: string;
}

interface CulturalAnalysis {
  detectedLanguages: string[];
  codeSwithingPoints: number;
  culturalPatterns: string[];
  modernAnalysis: string;
}

interface LanguageAnalysisPanelProps {
  culturalAnalysis?: CulturalAnalysis;
  isVisible?: boolean;
}

export const LanguageAnalysisPanel: React.FC<LanguageAnalysisPanelProps> = ({
  culturalAnalysis,
  isVisible = true
}) => {
  if (!isVisible || !culturalAnalysis) {
    return null;
  }

  const hasMultipleLanguages = culturalAnalysis.detectedLanguages.length > 1;
  const hasCodeSwitching = culturalAnalysis.codeSwithingPoints > 0;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: hasMultipleLanguages ? 'primary.main' : 'divider',
        borderRadius: 2
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Language color={hasMultipleLanguages ? 'primary' : 'action'} />
        <Typography variant="h6" color={hasMultipleLanguages ? 'primary' : 'text.primary'}>
          Language Analysis
        </Typography>
        {hasMultipleLanguages && (
          <Chip 
            label="Multilingual" 
            color="primary" 
            size="small" 
            icon={<Translate />}
          />
        )}
      </Box>

      {/* Detected Languages */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Detected Languages ({culturalAnalysis.detectedLanguages.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {culturalAnalysis.detectedLanguages.map((language, index) => (
            <Chip
              key={index}
              label={language}
              variant={index === 0 ? "filled" : "outlined"}
              color={index === 0 ? "primary" : "default"}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Code-Switching Information */}
      {hasCodeSwitching && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box mb={2}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CompareArrows color="secondary" />
              <Typography variant="subtitle2" color="text.secondary">
                Code-Switching Detected
              </Typography>
              <Chip 
                label={`${culturalAnalysis.codeSwithingPoints} transitions`}
                color="secondary" 
                size="small" 
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Language transitions create unique phonetic and cultural effects in your text.
            </Typography>
          </Box>
        </>
      )}

      {/* Cultural Patterns */}
      {culturalAnalysis.culturalPatterns.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cultural Patterns
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {culturalAnalysis.culturalPatterns.map((pattern, index) => (
                <Chip
                  key={index}
                  label={pattern}
                  variant="outlined"
                  color="info"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Modern Analysis */}
      {culturalAnalysis.modernAnalysis && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cross-Linguistic Analysis
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
              {culturalAnalysis.modernAnalysis}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}; 