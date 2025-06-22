import React, { useState } from 'react';
import { Pattern } from '../../types/observatory';
import { Box, Typography, Paper } from '@mui/material';

interface PatternConstellationProps {
  patterns: Pattern[];
  onHoverPattern: (id: string | null) => void;
  activeFilters: Set<string>;
  colorPalette?: string;
}

interface ConstellationGroup {
  type: string;
  patterns: Pattern[];
  color: string;
  position: { x: number; y: number };
}

export const PatternConstellation: React.FC<PatternConstellationProps> = ({ 
  patterns, 
  onHoverPattern, 
  activeFilters,
  colorPalette = 'vibrant'
}) => {
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getPatternColor = (type: string): string => {
    const palettes = {
      vibrant: {
        rhyme: '#FFD700',        // Gold
        assonance: '#9C27B0',    // Purple  
        consonance: '#4A90E2',   // Blue
        alliteration: '#4CAF50', // Green
        rhythm: '#FF5722',       // Orange
        onomatopoeia: '#E91E63', // Pink
        sound_parallelism: '#00BCD4', // Cyan
        default: '#FFF'
      },
      dark: {
        rhyme: '#B8860B',
        assonance: '#6A1B9A',
        consonance: '#1976D2',
        alliteration: '#2E7D32',
        rhythm: '#D84315',
        onomatopoeia: '#AD1457',
        sound_parallelism: '#00838F',
        default: '#BBB'
      },
      light: {
        rhyme: '#FFF176',
        assonance: '#BA68C8',
        consonance: '#64B5F6',
        alliteration: '#81C784',
        rhythm: '#FF8A65',
        onomatopoeia: '#F06292',
        sound_parallelism: '#4DD0E1',
        default: '#333'
      },
      vintage: {
        rhyme: '#D4AF37',
        assonance: '#8E44AD',
        consonance: '#34495E',
        alliteration: '#27AE60',
        rhythm: '#E67E22',
        onomatopoeia: '#C0392B',
        sound_parallelism: '#16A085',
        default: '#95A5A6'
      }
    };
    
    return palettes[colorPalette as keyof typeof palettes]?.[type as keyof typeof palettes.vibrant] || 
           palettes[colorPalette as keyof typeof palettes]?.default || '#FFF';
  };

  // Group patterns by type
  const createConstellations = (): ConstellationGroup[] => {
    const groups = new Map<string, Pattern[]>();
    
    patterns.forEach(pattern => {
      if (activeFilters.size === 0 || activeFilters.has(pattern.type)) {
        if (!groups.has(pattern.type)) {
          groups.set(pattern.type, []);
        }
        groups.get(pattern.type)?.push(pattern);
      }
    });

    const constellations: ConstellationGroup[] = [];
    const positions = [
      { x: 25, y: 25 },   // Top left
      { x: 75, y: 25 },   // Top right
      { x: 50, y: 50 },   // Center
      { x: 25, y: 75 },   // Bottom left
      { x: 75, y: 75 },   // Bottom right
    ];
    
    let index = 0;
    groups.forEach((patternList, type) => {
      constellations.push({
        type,
        patterns: patternList,
        color: getPatternColor(type),
        position: positions[index % positions.length] || { x: 50, y: 50 }
      });
      index++;
    });

    return constellations;
  };

  // Find if patterns share text segments
  const findSharedSegments = (pattern1: Pattern, pattern2: Pattern): string[] => {
    const shared: string[] = [];
    
    pattern1.segments.forEach(seg1 => {
      pattern2.segments.forEach(seg2 => {
        if (seg1.text.toLowerCase() === seg2.text.toLowerCase() ||
            Math.abs(seg1.globalStartIndex - seg2.globalStartIndex) < 10) {
          shared.push(seg1.text);
        }
      });
    });
    
    return [...new Set(shared)]; // Remove duplicates
  };

  const handleMouseEnter = (event: React.MouseEvent, patternId: string) => {
    setHoveredPattern(patternId);
    onHoverPattern(patternId);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredPattern(null);
    onHoverPattern(null);
  };

  if (patterns.length === 0) {
    return (
      <Box 
        sx={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(10, 11, 20, 0.95)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'text.secondary',
          fontStyle: 'italic'
        }}
      >
        <Typography>Enter text to see pattern constellations...</Typography>
      </Box>
    );
  }

  const constellations = createConstellations();

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
      {/* Main constellation view */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(10, 11, 20, 0.95)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.1), transparent),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.05), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.08), transparent),
            radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.06), transparent),
            radial-gradient(1px 1px at 160px 30px, rgba(255,255,255,0.04), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 100px'
        }}
      >
        {/* Pattern constellation groups */}
        {constellations.map((constellation, groupIndex) => (
          <Box
            key={constellation.type}
            sx={{
              position: 'absolute',
              left: `${constellation.position.x}%`,
              top: `${constellation.position.y}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            {/* Constellation label */}
            <Typography
              variant="caption"
              sx={{
                color: constellation.color,
                fontWeight: 'bold',
                textShadow: `0 0 8px ${constellation.color}`,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              {constellation.type}
            </Typography>
            
            {/* Pattern stars in this constellation */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 120, justifyContent: 'center' }}>
              {constellation.patterns.map((pattern, patternIndex) => {
                const isHovered = hoveredPattern === pattern.id;
                const starSize = 8 + pattern.segments.length * 2;
                
                return (
                  <Box
                    key={pattern.id}
                    onMouseEnter={(e) => handleMouseEnter(e, pattern.id)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      width: starSize,
                      height: starSize,
                      borderRadius: '50%',
                      backgroundColor: constellation.color,
                      boxShadow: isHovered 
                        ? `0 0 16px ${constellation.color}, 0 0 32px ${constellation.color}40`
                        : `0 0 8px ${constellation.color}60`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                      opacity: isHovered ? 1 : 0.8,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Segment count indicator */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '8px',
                        color: 'black',
                        fontWeight: 'bold',
                        textShadow: '0 0 2px white'
                      }}
                    >
                      {pattern.segments.length}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Connection indicators */}
            {constellation.patterns.length > 1 && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '8px',
                  textAlign: 'center'
                }}
              >
                {constellation.patterns.length} patterns
              </Typography>
            )}
          </Box>
        ))}

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '10px'
          }}
        >
          <Typography variant="caption" fontWeight="bold" display="block">
            Pattern Constellations
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.6 }}>
            ★ Size = segment count
          </Typography>
        </Box>

        {/* Pattern relationships indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '10px',
            textAlign: 'right'
          }}
        >
          <Typography variant="caption" display="block">
            {patterns.length} total patterns
          </Typography>
          <Typography variant="caption" display="block">
            {constellations.length} constellations
          </Typography>
        </Box>
      </Box>
      
      {/* Enhanced tooltip */}
      {hoveredPattern && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: 1.5,
            borderRadius: 1,
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: 250,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {(() => {
            const pattern = patterns.find(p => p.id === hoveredPattern);
            if (!pattern) return null;
            
            const relatedPatterns = patterns.filter(p => 
              p.id !== pattern.id && findSharedSegments(pattern, p).length > 0
            );
            
            return (
              <>
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ color: getPatternColor(pattern.type) }}>
                  {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern
                </Typography>
                
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  <strong>Segments:</strong> {pattern.segments.map(s => s.text).join(', ')}
                </Typography>
                
                {pattern.acousticFeatures?.primaryFeature && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                    <strong>Feature:</strong> {pattern.acousticFeatures.primaryFeature}
                  </Typography>
                )}
                
                {pattern.acousticFeatures?.secondaryFeatures && pattern.acousticFeatures.secondaryFeatures.length > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                    <strong>Properties:</strong> {pattern.acousticFeatures.secondaryFeatures.slice(0, 2).join(', ')}
                  </Typography>
                )}
                
                {relatedPatterns.length > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.6 }}>
                    <strong>Connected to:</strong> {relatedPatterns.length} other pattern{relatedPatterns.length > 1 ? 's' : ''}
                  </Typography>
                )}
              </>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
}; 