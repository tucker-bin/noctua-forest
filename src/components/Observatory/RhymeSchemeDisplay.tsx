import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface RhymeSchemeDisplayProps {
  rhymeScheme?: string;
  lines?: Array<{
    text: string;
    endWord: string;
    rhymeLabel: string;
  }>;
}

export const RhymeSchemeDisplay: React.FC<RhymeSchemeDisplayProps> = ({
  rhymeScheme,
  lines = []
}) => {
  const { t } = useTranslation();

  if (!rhymeScheme && lines.length === 0) {
    return null;
  }

  const getSchemeColor = (letter: string) => {
    const colors = {
      'A': '#FF6B6B', 'B': '#4ECDC4', 'C': '#45B7D1', 'D': '#F7DC6F',
      'E': '#BB8FCE', 'F': '#52BE80', 'G': '#F8C471', 'H': '#85C1E9'
    };
    return colors[letter as keyof typeof colors] || '#AED6F1';
  };

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 2, 
      background: 'rgba(26, 31, 46, 0.8)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: 2
    }}>
      <Typography variant="h6" sx={{ 
        fontSize: '1.1rem',
        fontWeight: 600,
        mb: 2,
        color: '#FFD700',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        🎵 {t('analysis.rhymeScheme', 'Rhyme Scheme')}
        {rhymeScheme && (
          <Chip 
            label={rhymeScheme} 
            size="small"
            sx={{ 
              backgroundColor: '#FFD700',
              color: '#1a1b2e',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          />
        )}
      </Typography>

      {lines.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {lines.map((line, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography variant="body2" sx={{ 
                  fontFamily: '"Georgia", serif',
                  lineHeight: 1.4 
                }}>
                  {line.text}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  minWidth: '60px'
                }}>
                  "{line.endWord}"
                </Typography>
                <Chip
                  label={line.rhymeLabel}
                  size="small"
                  sx={{
                    backgroundColor: getSchemeColor(line.rhymeLabel),
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '32px',
                    height: '24px'
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {rhymeScheme && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('analysis.rhymeSchemePattern', 'Pattern')}: {
              rhymeScheme.split('').map((letter, index) => (
                <Chip 
                  key={index}
                  label={letter}
                  size="small"
                  sx={{
                    backgroundColor: getSchemeColor(letter),
                    color: 'white',
                    fontSize: '0.6rem',
                    height: '20px',
                    margin: '0 2px',
                    minWidth: '20px'
                  }}
                />
              ))
            }
          </Typography>
        </Box>
      )}
    </Paper>
  );
}; 