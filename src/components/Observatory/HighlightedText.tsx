import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Pattern } from '../../types/observatory';
import { getPatternColor } from './colorSystem';
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
  originalText: string;
  patterns: Pattern[];
  activeFilters: Set<string>;
  palette?: { [key: string]: string };
  isLightTheme?: boolean;
  theme?: ObservatoryTheme;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  originalText,
  patterns,
  activeFilters,
  isLightTheme = false,
  theme
}) => {
  // Split text into words with indices, preserving character positions and formatting
  const words = useMemo(() => {
    const result: Array<{ text: string; index: number; isWord: boolean; isLineBreak: boolean; startPos: number; endPos: number }> = [];
    // Split on both whitespace and line breaks to preserve formatting
    const parts = originalText.split(/(\s+|\n)/);
    let currentPos = 0;
    
    parts.forEach((part, index) => {
      const startPos = currentPos;
      const endPos = currentPos + part.length;
      
      result.push({
        text: part,
        index,
        isWord: /\S/.test(part),
        isLineBreak: part.includes('\n'),
        startPos,
        endPos
      });
      
      currentPos = endPos;
    });
    
    return result;
  }, [originalText]);

  // Create word-to-patterns mapping using accurate character positions
  const wordToPatterns = useMemo(() => {
    const mapping = new Map<number, Pattern[]>();
    
    // Filter patterns based on active filters
    const filteredPatterns = activeFilters.size === 0 
      ? patterns 
      : patterns.filter(pattern => activeFilters.has(pattern.type));
    
    filteredPatterns.forEach(pattern => {
      pattern.segments.forEach(segment => {
        const segmentStart = segment.startIndex;
        const segmentEnd = segment.endIndex;
        
        // Find words that intersect with this pattern segment
        words.forEach((word, wordIndex) => {
          // Check if word intersects with pattern segment using actual character positions
          if (word.startPos < segmentEnd && word.endPos > segmentStart) {
            if (!mapping.has(wordIndex)) {
              mapping.set(wordIndex, []);
            }
            mapping.get(wordIndex)!.push(pattern);
          }
        });
      });
    });
    
    return mapping;
  }, [words, patterns, activeFilters]);

  const getWordStyle = (wordIndex: number) => {
    const hasPatterns = wordToPatterns.has(wordIndex);
    
    if (!hasPatterns) {
      return {
        color: theme?.textColor || (isLightTheme ? '#1a1a1a' : 'inherit')
      };
    }

    // Show highlights by default - solid highlighter effect with theme customization
    const patterns = wordToPatterns.get(wordIndex)!;
    const primaryPattern = patterns[0];
    const patternColor = getPatternColor(primaryPattern.type);
    
    return {
      backgroundColor: patternColor,
      color: getContrastTextColor(patternColor),
      fontWeight: 'bold',
      borderRadius: `${theme?.highlightBorderRadius || 4}px`,
      padding: `${(theme?.highlightPadding || 6) / 2}px ${theme?.highlightPadding || 6}px`,
      margin: '0 2px',
      display: 'inline-block',
      boxShadow: theme?.highlightShadow !== false 
        ? (isLightTheme 
          ? 'inset 0 -2px 0 rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)' 
          : 'inset 0 -2px 0 rgba(0,0,0,0.1)')
        : 'none',
      opacity: theme?.highlightOpacity || 1,
    };
  };

  // Generate background style from theme
  const generateBackgroundStyle = () => {
    if (!theme) return {};

    const baseStyle: React.CSSProperties = {
      opacity: theme.backgroundOpacity,
      filter: theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : 'none'
    };

    switch (theme.backgroundType) {
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(${theme.gradientDirection}deg, ${theme.gradientColors[0]}, ${theme.gradientColors[1]})`
        };
      case 'image':
        return {
          ...baseStyle,
          backgroundImage: `url(${theme.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'pattern':
        return {
          ...baseStyle,
          backgroundColor: theme.backgroundColor,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.backgroundColor
        };
    }
  };

  return (
    <Box sx={{ 
      mb: 3,
      ...(theme && {
        ...generateBackgroundStyle(),
        padding: `${theme.padding}px`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      })
    }}>
      {/* Text display with highlights and custom formatting */}
      <Typography 
        variant="body1" 
        sx={{ 
          lineHeight: theme?.lineHeight || 2,
          fontSize: theme?.fontSize ? `${theme.fontSize}px` : '1.1rem',
          fontFamily: theme?.fontFamily || 'Georgia, serif',
          fontWeight: theme?.fontWeight || 400,
          color: theme?.textColor || (isLightTheme ? '#000000' : 'inherit'),
          letterSpacing: theme?.letterSpacing ? `${theme.letterSpacing}px` : 'normal',
          textAlign: theme?.textAlign || 'left',
          maxWidth: theme?.maxWidth ? `${theme.maxWidth}px` : 'none',
          mx: theme?.textAlign === 'center' ? 'auto' : 'initial',
          whiteSpace: 'pre-wrap' // Preserve whitespace and line breaks
        }}
      >
        {words.map((word, index) => {
          if (word.isLineBreak) {
            // Line break - render as actual line break
            return <br key={index} />;
          }
          
          if (!word.isWord) {
            // Whitespace - render as-is
            return <span key={index}>{word.text}</span>;
          }

          // Apply highlighting styles
          return (
            <span key={index} style={getWordStyle(index)}>
              {word.text}
            </span>
          );
        })}
      </Typography>
    </Box>
  );
}; 