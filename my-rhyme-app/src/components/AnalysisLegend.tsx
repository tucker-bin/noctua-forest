import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Chip,
} from '@mui/material';
import { getColorForPattern } from './HighlightLyrics';
import type { Pattern } from '../api';

interface AnalysisLegendProps {
  patterns: Pattern[];
}

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({ patterns }) => {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        maxHeight: '600px',
        overflowY: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Rhyme Pattern Analysis
      </Typography>
      
      {patterns.map((pattern, index) => {
        const words = pattern.segments.map(s => s.text);
        const uniqueWords = [...new Set(words)];
        const colors = getColorForPattern(pattern.pattern_description);
        
        return (
          <Box key={pattern.phonetic_link_id} sx={{ mb: 3 }}>
            {/* Group Header */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  color: '#333',
                  mb: 0.5
                }}
              >
                {`[Verse ${Math.floor(index / 2) + 1}, ${pattern.pattern_description || `Pattern ${index + 1}`}]`}
              </Typography>
              
              {/* Rhyming words with color */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {uniqueWords.map((word, idx) => (
                  <React.Fragment key={idx}>
                    <Chip
                      label={word}
                      size="small"
                      sx={{
                        backgroundColor: colors.base,
                        color: '#000',
                        fontWeight: 500,
                      }}
                    />
                    {idx < uniqueWords.length - 1 && (
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        /
                      </Typography>
                    )}
                  </React.Fragment>
                ))}
              </Box>
              
              {/* Phonetic explanation */}
              {pattern.pattern_description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#555',
                    fontStyle: 'italic',
                    mt: 1,
                    lineHeight: 1.6
                  }}
                >
                  {pattern.pattern_description}
                </Typography>
              )}
            </Box>
            
            {index < patterns.length - 1 && (
              <Divider sx={{ my: 2, borderColor: '#e0e0e0' }} />
            )}
          </Box>
        );
      })}
      
      {/* Additional Info */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0' }}>
        <Typography variant="caption" sx={{ color: '#666' }}>
          Analysis powered by advanced phonetic pattern recognition
        </Typography>
      </Box>
    </Paper>
  );
};

export default AnalysisLegend; 