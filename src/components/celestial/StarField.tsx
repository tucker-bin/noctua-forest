import React, { useRef, useEffect, useState } from 'react';
import { Pattern, Segment } from '../../types/observation';
import { Box, Typography, Tooltip } from '@mui/material';

interface StarFieldProps {
  patterns: Pattern[];
  onHoverPattern: (id: string | null) => void;
  activeFilters: Set<string>;
  colorPalette: string;
}

interface ConstellationNode {
  id: string;
  pattern: Pattern;
  x: number;
  y: number;
  radius: number;
  color: string;
  connections: string[];
}

interface ConstellationGroup {
  type: string;
  patterns: Pattern[];
  centerX: number;
  centerY: number;
  color: string;
}

export const StarField: React.FC<StarFieldProps> = ({ 
  patterns, 
  onHoverPattern, 
  activeFilters,
  colorPalette = 'vibrant'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
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
        rhyme: '#B8860B',        // Dark gold
        assonance: '#6A1B9A',    // Dark purple
        consonance: '#1976D2',   // Dark blue
        alliteration: '#2E7D32', // Dark green
        rhythm: '#D84315',       // Dark orange
        onomatopoeia: '#AD1457', // Dark pink
        sound_parallelism: '#00838F', // Dark cyan
        default: '#BBB'
      },
      light: {
        rhyme: '#FFF176',        // Light gold
        assonance: '#BA68C8',    // Light purple
        consonance: '#64B5F6',   // Light blue
        alliteration: '#81C784', // Light green
        rhythm: '#FF8A65',       // Light orange
        onomatopoeia: '#F06292', // Light pink
        sound_parallelism: '#4DD0E1', // Light cyan
        default: '#333'
      },
      vintage: {
        rhyme: '#D4AF37',        // Vintage gold
        assonance: '#8E44AD',    // Vintage purple
        consonance: '#34495E',   // Vintage blue
        alliteration: '#27AE60', // Vintage green
        rhythm: '#E67E22',       // Vintage orange
        onomatopoeia: '#C0392B', // Vintage red
        sound_parallelism: '#16A085', // Vintage teal
        default: '#95A5A6'
      }
    };
    
    return palettes[colorPalette as keyof typeof palettes]?.[type as keyof typeof palettes.vibrant] || 
           palettes[colorPalette as keyof typeof palettes]?.default || '#FFF';
  };

  // Group patterns by type and find relationships
  const createConstellations = (): ConstellationGroup[] => {
    const groups = new Map<string, Pattern[]>();
    
    patterns.forEach(pattern => {
      if (!groups.has(pattern.type)) {
        groups.set(pattern.type, []);
      }
      groups.get(pattern.type)?.push(pattern);
    });

    const constellations: ConstellationGroup[] = [];
    const width = 800;
    const height = 400;
    const padding = 60;
    
    let index = 0;
    const totalGroups = groups.size;
    
    groups.forEach((patternList, type) => {
      if (activeFilters.size === 0 || activeFilters.has(type)) {
        // Arrange constellation groups in a circle
        const angle = (index / totalGroups) * 2 * Math.PI - Math.PI / 2;
        const radius = Math.min(width, height) * 0.25;
        const centerX = width / 2 + Math.cos(angle) * radius;
        const centerY = height / 2 + Math.sin(angle) * radius;
        
        constellations.push({
          type,
          patterns: patternList,
          centerX: Math.max(padding, Math.min(width - padding, centerX)),
          centerY: Math.max(padding, Math.min(height - padding, centerY)),
          color: getPatternColor(type)
        });
      }
      index++;
    });

    return constellations;
  };

  // Find patterns that share text segments
  const findConnections = (pattern: Pattern): string[] => {
    const connections: string[] = [];
    
    patterns.forEach(otherPattern => {
      if (pattern.id !== otherPattern.id) {
        // Check if patterns share any text segments
        const hasSharedSegment = pattern.segments.some(seg1 =>
          otherPattern.segments.some(seg2 =>
            areSegmentsRelated(seg1, seg2)
          )
        );
        
        if (hasSharedSegment) {
          connections.push(otherPattern.id);
        }
      }
    });
    
    return connections;
  };

  const areSegmentsRelated = (seg1: Segment, seg2: Segment): boolean => {
    return (
      Math.abs(seg1.globalStartIndex - seg2.globalStartIndex) < 20 ||
      seg1.text.toLowerCase() === seg2.text.toLowerCase()
    );
  };

  const handleMouseMove = (event: React.MouseEvent, patternId: string) => {
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
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox="0 0 800 400"
        style={{ 
          backgroundColor: 'rgba(10, 11, 20, 0.95)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Background gradient */}
        <defs>
          <radialGradient id="spaceGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(26, 27, 46, 0.9)" />
            <stop offset="100%" stopColor="rgba(10, 11, 20, 0.95)" />
          </radialGradient>
          
          {/* Glow filters for stars */}
          <filter id="glow">
            <feMorphology operator="dilate" radius="2"/>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#spaceGradient)" />
        
        {/* Draw constellation connections */}
        {constellations.map(constellation => {
          const nodes: ConstellationNode[] = constellation.patterns.map((pattern, index) => {
            const angleStep = (2 * Math.PI) / constellation.patterns.length;
            const angle = index * angleStep;
            const radius = 30 + constellation.patterns.length * 5;
            
            return {
              id: pattern.id,
              pattern,
              x: constellation.centerX + Math.cos(angle) * radius,
              y: constellation.centerY + Math.sin(angle) * radius,
              radius: 6 + pattern.segments.length * 2,
              color: constellation.color,
              connections: findConnections(pattern)
            };
          });

          return (
            <g key={constellation.type}>
              {/* Draw connections within constellation */}
              {nodes.map(node => 
                node.connections
                  .filter(connId => nodes.some(n => n.id === connId))
                  .map(connId => {
                    const connectedNode = nodes.find(n => n.id === connId);
                    if (!connectedNode) return null;
                    
                    const isActive = activeFilters.size === 0 || 
                                   (activeFilters.has(node.pattern.type) && activeFilters.has(connectedNode.pattern.type));
                    
                    return (
                      <line
                        key={`${node.id}-${connId}`}
                        x1={node.x}
                        y1={node.y}
                        x2={connectedNode.x}
                        y2={connectedNode.y}
                        stroke={constellation.color}
                        strokeWidth="1"
                        strokeOpacity={isActive ? 0.4 : 0.1}
                        strokeDasharray="2,2"
                      />
                    );
                  })
              )}
              
              {/* Draw constellation center label */}
              <text
                x={constellation.centerX}
                y={constellation.centerY - constellation.patterns.length * 5 - 40}
                fill={constellation.color}
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
                opacity={activeFilters.size === 0 || activeFilters.has(constellation.type) ? 0.8 : 0.3}
              >
                {constellation.type.charAt(0).toUpperCase() + constellation.type.slice(1)}
              </text>
              
              {/* Draw pattern stars */}
              {nodes.map(node => {
                const isActive = activeFilters.size === 0 || activeFilters.has(node.pattern.type);
                const isHovered = hoveredPattern === node.id;
                
                return (
                  <g key={node.id}>
                    {/* Star glow */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius * 2}
                      fill={node.color}
                      opacity={isActive ? (isHovered ? 0.3 : 0.15) : 0.05}
                    />
                    
                    {/* Main star */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius}
                      fill={node.color}
                      opacity={isActive ? (isHovered ? 1 : 0.8) : 0.2}
                      filter={isHovered ? "url(#glow)" : undefined}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handleMouseMove(e, node.id)}
                      onMouseLeave={handleMouseLeave}
                    />
                    
                    {/* Pattern segment count indicator */}
                    <text
                      x={node.x}
                      y={node.y + 3}
                      fill="white"
                      fontSize="8"
                      textAnchor="middle"
                      opacity={isActive ? 0.9 : 0.3}
                      pointerEvents="none"
                    >
                      {node.pattern.segments.length}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        
        {/* Cross-constellation connections */}
        {constellations.map(constellation => 
          constellation.patterns.map(pattern => {
            const connections = findConnections(pattern);
            const patternX = constellation.centerX;
            const patternY = constellation.centerY;
            
            return connections
              .filter(connId => !constellation.patterns.some(p => p.id === connId))
              .map(connId => {
                const connectedPattern = patterns.find(p => p.id === connId);
                if (!connectedPattern) return null;
                
                const connectedConstellation = constellations.find(c => 
                  c.patterns.some(p => p.id === connId)
                );
                if (!connectedConstellation) return null;
                
                const isActive = activeFilters.size === 0 || 
                               (activeFilters.has(pattern.type) && activeFilters.has(connectedPattern.type));
                
                return (
                  <line
                    key={`cross-${pattern.id}-${connId}`}
                    x1={patternX}
                    y1={patternY}
                    x2={connectedConstellation.centerX}
                    y2={connectedConstellation.centerY}
                    stroke="rgba(255, 215, 0, 0.2)"
                    strokeWidth="1"
                    strokeOpacity={isActive ? 0.6 : 0.1}
                    strokeDasharray="5,5"
                  />
                );
              });
          })
        )}
        
        {/* Legend */}
        <g transform="translate(20, 20)">
          <text x="0" y="0" fill="rgba(255, 255, 255, 0.7)" fontSize="10" fontWeight="bold">
            Pattern Constellations
          </text>
          <text x="0" y="15" fill="rgba(255, 255, 255, 0.5)" fontSize="8">
            ★ Size = segment count • Lines = shared segments
          </text>
        </g>
      </svg>
      
      {/* Tooltip */}
      {hoveredPattern && (
        <Box
          sx={{
            position: 'fixed',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: 200
          }}
        >
          {(() => {
            const pattern = patterns.find(p => p.id === hoveredPattern);
            if (!pattern) return null;
            
            return (
              <>
                <Typography variant="caption" fontWeight="bold" display="block">
                  {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}
                </Typography>
                <Typography variant="caption" display="block">
                  {pattern.segments.length} segments: {pattern.segments.map((s: Segment) => s.text).join(', ')}
                </Typography>
                {pattern.acousticFeatures?.primaryFeature && (
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    {pattern.acousticFeatures.primaryFeature}
                  </Typography>
                )}
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
}; 