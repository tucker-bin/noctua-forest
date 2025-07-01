import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Pattern, Segment } from '../../types/observatory';
import { getPatternColor, getPatternZIndex, getPatternSignificance } from './colorSystem';
import { ObservatoryTheme } from './ObservatoryCustomizer';

// Function to determine if text should be black or white based on background color
const getContrastTextColor = (backgroundColor: string): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

interface HighlightedTextProps {
  text: string;
  patterns: Pattern[];
  segments: Segment[];
  showHighlights?: boolean;
  onPatternClick?: (pattern: Pattern) => void;
  onPatternHover?: (pattern: Pattern | null) => void;
  isLightTheme?: boolean;
  theme?: ObservatoryTheme;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  patterns,
  segments,
  showHighlights = true,
  onPatternClick,
  onPatternHover
}) => {
  const [hoveredPattern, setHoveredPattern] = useState<Pattern | null>(null);

  // Create a map of character positions to patterns
  const patternMap = useMemo(() => {
    const map = new Map<number, Pattern[]>();
    
    // Sort patterns by significance and type priority
    const sortedPatterns = [...patterns].sort((a, b) => {
      const sigDiff = (b.significance || 0) - (a.significance || 0);
      if (sigDiff !== 0) return sigDiff;
      
      // If significance is equal, use type priority
      const typeOrder = {
        'code_switching': 5,
        'rhyme': 4,
        'internal_rhyme': 3,
        'alliteration': 2,
        'assonance': 1
      };
      return (typeOrder[b.type as keyof typeof typeOrder] || 0) - 
             (typeOrder[a.type as keyof typeof typeOrder] || 0);
    });
    
    sortedPatterns.forEach(pattern => {
      pattern.segments.forEach(segmentId => {
        const segment = segments.find(s => s.id === segmentId);
        if (segment) {
          for (let i = segment.startIndex; i < segment.endIndex; i++) {
            if (!map.has(i)) map.set(i, []);
            map.get(i)!.push(pattern);
          }
        }
      });
    });
    
    return map;
  }, [patterns, segments]);

  // Render text with highlights
  const renderText = () => {
    if (!showHighlights) return text;

    const elements: JSX.Element[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
      const patternsAtPos = patternMap.get(currentPos) || [];
      
      if (patternsAtPos.length === 0) {
        // No pattern - render plain text
        let plainTextEnd = currentPos + 1;
        while (plainTextEnd < text.length && !patternMap.has(plainTextEnd)) {
          plainTextEnd++;
        }
        elements.push(
          <span key={`plain-${currentPos}`}>
            {text.slice(currentPos, plainTextEnd)}
          </span>
        );
        currentPos = plainTextEnd;
      } else {
        // Find the end of the current pattern segment
        let patternEnd = currentPos + 1;
        while (patternEnd < text.length && 
               JSON.stringify(patternMap.get(patternEnd)) === JSON.stringify(patternsAtPos)) {
          patternEnd++;
        }

        // Get all patterns at this position
        const isHovered = patternsAtPos.some(p => hoveredPattern?.id === p.id);

        // Create layered highlights for each pattern
        const patternElements = patternsAtPos.map((pattern, idx) => {
          const isPatternHovered = hoveredPattern?.id === pattern.id;
          const zIndex = getPatternZIndex(pattern, isPatternHovered);
          const significance = getPatternSignificance(pattern.type);
          
          return (
            <span
              key={`${pattern.id}-${idx}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: getPatternColor(pattern.type),
                opacity: significance,
                zIndex,
                transition: 'all 0.2s ease',
                pointerEvents: 'none'
              }}
            />
          );
        });
        
        elements.push(
          <Tooltip
            key={`pattern-${currentPos}`}
            title={
              <Box>
                {patternsAtPos.map((pattern, idx) => (
                  <Box key={idx} sx={{ mb: idx < patternsAtPos.length - 1 ? 1 : 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getPatternColor(pattern.type)
                        }}
                      />
                      {pattern.type} ({Math.round((pattern.significance || 0) * 100)}%)
                    </Typography>
                    {pattern.description && (
                      <Typography variant="body2">
                        {pattern.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            }
            arrow
            placement="top"
          >
            <span
              style={{
                position: 'relative',
                cursor: 'pointer',
                padding: '0 1px',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
                boxShadow: isHovered ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
              onClick={() => onPatternClick?.(patternsAtPos[0])}
              onMouseEnter={() => {
                setHoveredPattern(patternsAtPos[0]);
                onPatternHover?.(patternsAtPos[0]);
              }}
              onMouseLeave={() => {
                setHoveredPattern(null);
                onPatternHover?.(null);
              }}
            >
              {patternElements}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {text.slice(currentPos, patternEnd)}
              </span>
            </span>
          </Tooltip>
        );
        currentPos = patternEnd;
      }
    }

    return elements;
  };

  return (
    <Box sx={{ 
      fontFamily: 'monospace',
      fontSize: '1.1rem',
      lineHeight: 2,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      letterSpacing: '0.02em',
      '& > span': {
        transition: 'all 0.2s ease'
      }
    }}>
      {renderText()}
    </Box>
  );
}; 