import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { Pattern } from '../api';
import type { ThemeMode, ColorPalette } from './Observatory';
import { colorPalettes } from './Observatory';

interface HighlightLyricsProps {
    text: string;
    patterns: Pattern[];
    hoveredGroupId: string | null;
    themeMode?: ThemeMode;
    colorPalette?: ColorPalette;
    highlightIntensity?: number;
    enabledPatterns?: Set<string>;
    showAllHighlights?: boolean;
}

interface CharacterStyle {
    groupIds: string[];
    colors: string[];
}

const HighlightLyrics: React.FC<HighlightLyricsProps> = ({ 
    text, 
    patterns, 
    hoveredGroupId, 
    themeMode = 'dark',
    colorPalette = 'vibrant',
    highlightIntensity = 70,
    enabledPatterns = new Set(),
    showAllHighlights = true
}) => {
    const isDark = themeMode === 'dark';
    const isVintage = themeMode === 'vintage';
    const colors = colorPalettes[colorPalette];
    
    const getTextColor = () => {
        if (isDark) return '#ffffff';
        if (isVintage) return '#3d2914'; // Dark brown for vintage
        return '#000000';
    };
    
    const getBackgroundColor = () => {
        if (isDark) return '#0a0a0a';
        if (isVintage) return '#E0C9A6'; // Tan paper color
        return '#ffffff';
    };
    
    const getBorderColor = () => {
        if (isDark) return '#333';
        if (isVintage) return '#c9a876';
        return '#e0e0e0';
    };
    
    const getColorForGroupId = (groupId: string) => {
        if (!groupId) return colors[0];
        const hash = groupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };
    
    const renderedText = useMemo(() => {
        if (typeof text !== 'string' || !text) {
            return '';
        }

        // Create a style map for each character position
        const charStyles: CharacterStyle[] = Array.from(text).map(() => ({
            groupIds: [],
            colors: []
        }));

        // Apply all segments to the character map
        patterns.forEach(pattern => {
            const color = getColorForGroupId(pattern.phonetic_link_id);
            pattern.segments.forEach(seg => {
                const start = Math.max(0, seg.globalStartIndex);
                const end = Math.min(text.length, seg.globalEndIndex);
                
                for (let i = start; i < end; i++) {
                    if (!charStyles[i].groupIds.includes(pattern.phonetic_link_id)) {
                        charStyles[i].groupIds.push(pattern.phonetic_link_id);
                        charStyles[i].colors.push(color);
                    }
                }
            });
        });

        // Build the rendered output
        const elements: React.ReactNode[] = [];
        let i = 0;
        
        while (i < text.length) {
            const currentStyle = charStyles[i];
            
            if (currentStyle.groupIds.length === 0) {
                // Find the end of this non-highlighted section
                let end = i + 1;
                while (end < text.length && charStyles[end].groupIds.length === 0) {
                    end++;
                }
                elements.push(
                    <span key={`plain-${i}`} style={{ 
                        color: getTextColor(),
                        textShadow: isDark ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                    }}>
                        {text.substring(i, end)}
                    </span>
                );
                i = end;
            } else {
                // Find the end of this highlighted section with the same style
                let end = i + 1;
                while (
                    end < text.length && 
                    charStyles[end].groupIds.length === currentStyle.groupIds.length &&
                    charStyles[end].groupIds.every(id => currentStyle.groupIds.includes(id))
                ) {
                    end++;
                }
                
                const segmentText = text.substring(i, end);
                const isHovered = currentStyle.groupIds.some(id => id === hoveredGroupId);
                const hasHoveredGroup = hoveredGroupId !== null;
                
                // Check if any of the patterns in this segment are disabled
                const isDisabled = !showAllHighlights && currentStyle.groupIds.some(id => !enabledPatterns.has(id));
                
                // Handle multiple overlapping highlights
                if (currentStyle.colors.length > 1) {
                    // Create layered backgrounds for multiple colors
                    const backgroundLayers = currentStyle.colors.map((color, idx) => {
                        const baseOpacity = (highlightIntensity / 100) * (isDark ? 0.4 : 0.7) * (isDisabled ? 0.2 : 1);
                        const opacity = baseOpacity - (idx * 0.05);
                        return isDisabled ? `#888888${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
                    });
                    
                    elements.push(
                        <Box
                            key={`multi-${i}`}
                            component="span"
                            sx={{
                                position: 'relative',
                                display: 'inline-block',
                                color: isDisabled ? '#888' : getTextColor(),
                                fontWeight: isDisabled ? 400 : 600,
                                textShadow: isDisabled ? 'none' : (isDark ? '1px 1px 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.8)'),
                                transition: 'all 0.2s ease-in-out',
                                opacity: isDisabled ? 0.5 : (hasHoveredGroup && !isHovered ? 0.5 : 1.0),
                                transform: isHovered && !isDisabled ? 'scale(1.05)' : 'scale(1)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '-2px',
                                    left: '-3px',
                                    right: '-3px',
                                    bottom: '-2px',
                                    background: backgroundLayers[0],
                                    borderRadius: '3px',
                                    zIndex: -1,
                                },
                                ...(backgroundLayers.length > 1 && {
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '-1px',
                                        left: '-2px',
                                        right: '-2px',
                                        bottom: '-1px',
                                        background: backgroundLayers[1],
                                        borderRadius: '3px',
                                        zIndex: -2,
                                    }
                                })
                            }}
                        >
                            {segmentText}
                        </Box>
                    );
                } else {
                    // Single color highlight with semi-transparent background
                    const baseOpacity = (highlightIntensity / 100) * (isDisabled ? 0.2 : 1);
                    const opacity = Math.round((isDark ? baseOpacity * 0.4 : baseOpacity * 0.7) * 255).toString(16).padStart(2, '0');
                    const hoverOpacity = Math.round((isDark ? baseOpacity * 0.6 : baseOpacity * 0.8) * 255).toString(16).padStart(2, '0');
                    const bgColor = isDisabled ? '#888888' : currentStyle.colors[0];
                    
                    elements.push(
                        <Box
                            key={`single-${i}`}
                            component="span"
                            sx={{
                                backgroundColor: `${bgColor}${opacity}`,
                                color: isDisabled ? '#666' : getTextColor(),
                                padding: '1px 2px',
                                borderRadius: '3px',
                                fontWeight: isDisabled ? 400 : 600,
                                textShadow: isDisabled ? 'none' : (isDark ? '1px 1px 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.8)'),
                                transition: 'all 0.2s ease-in-out',
                                opacity: isDisabled ? 0.5 : (hasHoveredGroup && !isHovered ? 0.5 : 1.0),
                                boxShadow: isHovered && !isDisabled ? `0 0 8px ${currentStyle.colors[0]}` : 'none',
                                transform: isHovered && !isDisabled ? 'scale(1.05)' : 'scale(1)',
                                display: 'inline-block',
                                position: 'relative',
                                textDecoration: isDisabled ? 'line-through' : 'none',
                                '&:hover': {
                                    backgroundColor: isDisabled ? `${bgColor}${opacity}` : `${currentStyle.colors[0]}${hoverOpacity}`,
                                }
                            }}
                        >
                            {segmentText}
                        </Box>
                    );
                }
                i = end;
            }
        }
        
        return elements;
    }, [text, patterns, hoveredGroupId, isDark, isVintage, colors, getColorForGroupId, highlightIntensity, enabledPatterns, showAllHighlights]);

    if (typeof text !== 'string') {
        return (
            <Paper elevation={2} sx={{ p: 3, whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                <Typography component="div" color="text.secondary">
                    Waiting for text...
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={2} sx={{ 
            p: 4, 
            whiteSpace: 'pre-wrap', 
            lineHeight: '2.4',
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)' : 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '100% 2em',
            border: `1px solid ${getBorderColor()}`,
            transition: 'all 0.3s ease'
        }}>
            <Typography component="div" sx={{ 
                fontSize: '1.2rem',
                fontFamily: '"Roboto Mono", "Courier New", monospace',
                letterSpacing: '0.5px',
                fontWeight: 500,
            }}>
                {renderedText}
            </Typography>
        </Paper>
    );
};

export default HighlightLyrics; 