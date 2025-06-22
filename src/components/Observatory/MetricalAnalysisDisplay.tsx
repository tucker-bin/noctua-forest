import React from 'react';
import { Box, Typography, Chip, Paper, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MetricalAnalysisDisplayProps {
  meter?: string;
  lines?: Array<{
    text: string;
    syllableCount: number;
    stressPattern?: string;
    meterMatch?: number; // 0-1 confidence
  }>;
  averageSyllables?: number;
  meterRegularity?: number; // 0-1 consistency
}

export const MetricalAnalysisDisplay: React.FC<MetricalAnalysisDisplayProps> = ({
  meter,
  lines = [],
  averageSyllables,
  meterRegularity
}) => {
  const { t } = useTranslation();

  if (!meter && lines.length === 0 && !averageSyllables) {
    return null;
  }

  const getMeterColor = (confidence?: number) => {
    if (!confidence) return '#999';
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const getMeterType = (meter?: string): { type: string; icon: string; description?: string } => {
    if (!meter) return { type: 'Unknown', icon: '❓' };
    
    const meterTypes: Record<string, { type: string; icon: string; description: string }> = {
      'iambic': { type: 'Iambic', icon: '⚡', description: 'da-DUM pattern' },
      'trochaic': { type: 'Trochaic', icon: '🎵', description: 'DUM-da pattern' },
      'anapestic': { type: 'Anapestic', icon: '🌊', description: 'da-da-DUM pattern' },
      'dactylic': { type: 'Dactylic', icon: '🏛️', description: 'DUM-da-da pattern' },
      'spondaic': { type: 'Spondaic', icon: '💪', description: 'DUM-DUM pattern' },
      'pyrrhic': { type: 'Pyrrhic', icon: '🍃', description: 'da-da pattern' },
      'free': { type: 'Free Verse', icon: '🎨', description: 'No regular pattern' },
      'blank': { type: 'Blank Verse', icon: '📜', description: 'Unrhymed iambic pentameter' }
    };

    const key = Object.keys(meterTypes).find(k => 
      meter.toLowerCase().includes(k)
    );
    
    return key ? meterTypes[key] : { type: meter, icon: '📏', description: 'Custom meter' };
  };

  const meterInfo = getMeterType(meter);

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 2, 
      background: 'rgba(26, 31, 46, 0.8)',
      border: '1px solid rgba(116, 195, 101, 0.3)',
      borderRadius: 2
    }}>
      <Typography variant="h6" sx={{ 
        fontSize: '1.1rem',
        fontWeight: 600,
        mb: 2,
        color: '#74C365',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {meterInfo.icon} {t('analysis.metricalAnalysis', 'Metrical Analysis')}
        {meter && (
          <Chip 
            label={meterInfo.type} 
            size="small"
            sx={{ 
              backgroundColor: '#74C365',
              color: '#1a1b2e',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          />
        )}
      </Typography>

      {meter && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{meterInfo.type}</strong>
            {meterInfo.description && (
              <Typography component="span" variant="caption" sx={{ 
                ml: 1, 
                color: 'text.secondary',
                fontStyle: 'italic' 
              }}>
                ({meterInfo.description})
              </Typography>
            )}
          </Typography>
          
          {meterRegularity !== undefined && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Meter Consistency: {(meterRegularity * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={meterRegularity * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(116, 195, 101, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getMeterColor(meterRegularity),
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {averageSyllables && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Average syllables per line: {averageSyllables.toFixed(1)}
          </Typography>
        </Box>
      )}

      {lines.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#74C365' }}>
            Line Analysis:
          </Typography>
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
              <Typography variant="caption" sx={{ 
                minWidth: '20px',
                color: 'text.secondary',
                mr: 1
              }}>
                {index + 1}
              </Typography>
              
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography variant="body2" sx={{ 
                  fontFamily: '"Georgia", serif',
                  lineHeight: 1.4,
                  mb: 0.5
                }}>
                  {line.text}
                </Typography>
                {line.stressPattern && (
                  <Typography variant="caption" sx={{ 
                    fontFamily: 'monospace',
                    color: 'text.secondary',
                    letterSpacing: '1px'
                  }}>
                    {line.stressPattern}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${line.syllableCount} syl`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: '20px',
                    borderColor: '#74C365',
                    color: '#74C365'
                  }}
                />
                {line.meterMatch !== undefined && (
                  <Box sx={{ 
                    width: 40, 
                    height: 20, 
                    borderRadius: 1,
                    backgroundColor: getMeterColor(line.meterMatch),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 'bold'
                    }}>
                      {(line.meterMatch * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}; 