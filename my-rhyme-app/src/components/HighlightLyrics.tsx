import React, { useMemo, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { noctuaColors } from '../theme/noctuaTheme';
import type { Pattern } from '../api';

// Map pattern types to Noctua colors
export const getColorForPattern = (patternDescription: string): { base: string; hover: string } => {
  const desc = patternDescription?.toLowerCase() || '';
  
  if (desc.includes('perfect') || desc.includes('rhyme')) {
    return { 
      base: noctuaColors.highlights.perfectRhymes, 
      hover: noctuaColors.highlights.perfectRhymesHover 
    };
  } else if (desc.includes('assonance')) {
    return { 
      base: noctuaColors.highlights.assonance, 
      hover: noctuaColors.highlights.assonanceHover 
    };
  } else if (desc.includes('consonance')) {
    return { 
      base: noctuaColors.highlights.consonance, 
      hover: noctuaColors.highlights.consonanceHover 
    };
  } else if (desc.includes('slant') || desc.includes('near')) {
    return { 
      base: noctuaColors.highlights.slantRhymes, 
      hover: noctuaColors.highlights.slantRhymesHover 
    };
  } else if (desc.includes('alliteration')) {
    return { 
      base: noctuaColors.highlights.alliteration, 
      hover: noctuaColors.highlights.alliterationHover 
    };
  }
  
  // Default to perfect rhymes color
  return { 
    base: noctuaColors.highlights.perfectRhymes, 
    hover: noctuaColors.highlights.perfectRhymesHover 
  };
};

interface HighlightLyricsProps {
  lyrics: string;
  patterns: Pattern[];
  highlightEnabled?: boolean;
  onWordClick?: (word: string, pattern: Pattern) => void;
}

const HighlightLyrics: React.FC<HighlightLyricsProps> = ({ 
  lyrics, 
  patterns, 
  highlightEnabled = true,
  onWordClick 
}) => {
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const highlightedContent = useMemo(() => {
    if (!highlightEnabled || !patterns || patterns.length === 0) {
      return <span>{lyrics}</span>;
    }

    // Create a map of positions to highlight info
    const highlightMap = new Map<number, { 
      end: number; 
      groupId: string; 
      pattern: Pattern;
      colors: { base: string; hover: string };
    }>();
    
    patterns.forEach(pattern => {
      if (!pattern.segments) return;
      
      const colors = getColorForPattern(pattern.pattern_description);
      pattern.segments.forEach(segment => {
        highlightMap.set(segment.globalStartIndex, {
          end: segment.globalEndIndex,
          groupId: pattern.phonetic_link_id,
          pattern,
          colors
        });
      });
    });

    // Sort positions
    const positions = Array.from(highlightMap.keys()).sort((a, b) => a - b);
    
    // Build the highlighted content
    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    positions.forEach((start) => {
      const highlight = highlightMap.get(start)!;
      const isHovered = hoveredGroupId === highlight.groupId;
      const isInSameGroup = hoveredGroupId && patterns.some(p => 
        p.phonetic_link_id === hoveredGroupId && 
        p.segments.some(s => s.globalStartIndex === start)
      );
      
      // Add text before this highlight
      if (start > lastEnd) {
        elements.push(
          <span 
            key={`text-${lastEnd}`}
            style={{
              opacity: focusMode && !isInSameGroup ? 0.5 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            {lyrics.substring(lastEnd, start)}
          </span>
        );
      }

      const word = lyrics.substring(start, highlight.end);
      
      // Add highlighted text with tooltip
      elements.push(
        <Tooltip
          key={`highlight-${start}`}
          title={
            <Box>
              <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                {highlight.pattern.pattern_description || 'Rhyme Pattern'}
              </Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                Click to see all related words
              </Box>
            </Box>
          }
          placement="top"
          arrow
          enterDelay={300}
          leaveDelay={200}
        >
          <span
            style={{
              backgroundColor: isHovered ? highlight.colors.hover : highlight.colors.base,
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 500,
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              display: 'inline-block',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              opacity: focusMode && !isInSameGroup ? 0.5 : 1,
              animation: isInSameGroup && hoveredGroupId ? 'pulse 1s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={() => {
              setHoveredGroupId(highlight.groupId);
              setFocusMode(true);
            }}
            onMouseLeave={() => {
              setHoveredGroupId(null);
              setFocusMode(false);
            }}
            onClick={() => onWordClick?.(word, highlight.pattern)}
          >
            {word}
          </span>
        </Tooltip>
      );

      lastEnd = highlight.end;
    });

    // Add any remaining text
    if (lastEnd < lyrics.length) {
      elements.push(
        <span 
          key={`text-${lastEnd}`}
          style={{
            opacity: focusMode ? 0.5 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {lyrics.substring(lastEnd)}
        </span>
      );
    }

    return <>{elements}</>;
  }, [lyrics, patterns, highlightEnabled, hoveredGroupId, focusMode, onWordClick]);

  return (
    <Box
      sx={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: '1.2rem',
        lineHeight: 2,
        fontFamily: '"Inter", sans-serif',
        p: 3,
        backgroundColor: 'rgba(22, 27, 34, 0.5)',
        backdropFilter: 'blur(8px)',
        borderRadius: 1,
        maxHeight: '600px',
        overflowY: 'auto',
        border: `1px solid ${noctuaColors.charcoal}`,
        transition: 'all 0.3s ease-in-out',
        '&:focus-within': {
          backgroundColor: 'rgba(22, 27, 34, 0.8)',
          borderColor: noctuaColors.mutedSilver,
        },
        '& @keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.1)', opacity: 0.8 },
        },
      }}
    >
      {highlightedContent}
    </Box>
  );
};

export default HighlightLyrics; 