import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, Divider, Collapse, IconButton, TextField, InputAdornment, Switch } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import type { Pattern } from '../api';
import type { ThemeMode, ColorPalette } from './Observatory';
import { colorPalettes } from './Observatory';

interface AnalysisLegendProps {
    patterns: Pattern[];
    onHoverGroup: (groupId: string | null) => void;
    themeMode?: ThemeMode;
    colorPalette?: ColorPalette;
    enabledPatterns?: Set<string>;
    showAllHighlights?: boolean;
    onTogglePattern?: (patternId: string) => void;
}

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({ 
    patterns, 
    onHoverGroup,
    themeMode = 'dark',
    colorPalette = 'vibrant',
    enabledPatterns = new Set(),
    showAllHighlights = true,
    onTogglePattern
}) => {
    const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    
    const colors = colorPalettes[colorPalette];
    const isVintage = themeMode === 'vintage';
    const isDark = themeMode === 'dark';

    const getColorForGroupId = (groupId: string) => {
        const hash = groupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const togglePattern = (patternId: string) => {
        setExpandedPatterns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(patternId)) {
                newSet.delete(patternId);
            } else {
                newSet.add(patternId);
            }
            return newSet;
        });
    };

    // Filter patterns based on search
    const filteredPatterns = useMemo(() => {
        if (!searchTerm) return patterns;
        
        const term = searchTerm.toLowerCase();
        return patterns.filter(pattern => 
            pattern.pattern_description.toLowerCase().includes(term) ||
            pattern.segments.some(seg => seg.text.toLowerCase().includes(term)) ||
            pattern.acoustic_features?.ipa_notation?.toLowerCase().includes(term)
        );
    }, [patterns, searchTerm]);

    // Group patterns by type for better organization
    const groupedPatterns = useMemo(() => {
        const groups: Record<string, Pattern[]> = {};
        filteredPatterns.forEach(pattern => {
            const type = pattern.acoustic_features?.primary_feature || 'other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(pattern);
        });
        return groups;
    }, [filteredPatterns]);

    if (patterns.length === 0) {
        return (
                    <Paper elevation={2} sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: isVintage ? '#E0C9A6' : '#1a1a1a',
            border: isVintage ? '1px solid #c9a876' : '1px solid #333'
        }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                    No phonetic patterns found.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={2} sx={{ 
            p: 2, 
            maxHeight: { xs: '50vh', sm: '60vh', lg: '70vh' },
            overflowY: 'auto',
            backgroundColor: isVintage ? '#E0C9A6' : '#1a1a1a',
            border: isVintage ? '1px solid #c9a876' : '1px solid #333',
            '&::-webkit-scrollbar': {
                width: '8px',
            },
            '&::-webkit-scrollbar-track': {
                backgroundColor: '#0a0a0a',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#333',
                borderRadius: '4px',
                '&:hover': {
                    backgroundColor: '#444',
                }
            }
        }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: isVintage ? '#3d2914' : '#ffffff' }}>
                    Phonetic Pattern Groups ({filteredPatterns.length})
                </Typography>
                
                {/* Search bar */}
                <TextField
                    size="small"
                    placeholder="Search patterns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            backgroundColor: '#0a0a0a',
                            '& fieldset': {
                                borderColor: '#444',
                            },
                            '&:hover fieldset': {
                                borderColor: '#666',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#4ECDC4',
                            },
                        },
                        '& .MuiInputAdornment-root': {
                            color: '#666'
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Box>
                {Object.entries(groupedPatterns).map(([type, typePatterns]) => (
                    <Box key={type} sx={{ mb: 3 }}>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                color: '#4ECDC4', 
                                mb: 1, 
                                textTransform: 'capitalize',
                                fontWeight: 'bold'
                            }}
                        >
                            {type.replace(/_/g, ' ')} ({typePatterns.length})
                        </Typography>
                        
                        {typePatterns.map((pattern, index) => {
                            const isExpanded = expandedPatterns.has(pattern.phonetic_link_id);
                            const patternColor = getColorForGroupId(pattern.phonetic_link_id);
                            const isEnabled = showAllHighlights || enabledPatterns.has(pattern.phonetic_link_id);
                            
                            return (
                                <Box
                                    key={pattern.phonetic_link_id || index}
                                    mb={1.5}
                                    onMouseEnter={() => onHoverGroup(pattern.phonetic_link_id)}
                                    onMouseLeave={() => onHoverGroup(null)}
                                    sx={{
                                        borderLeft: `4px solid ${isEnabled ? patternColor : '#888'}`,
                                        backgroundColor: isVintage ? (isEnabled ? '#d4b896' : '#c9a876') : (isEnabled ? '#0a0a0a' : '#111'),
                                        borderRadius: '0 8px 8px 0',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        opacity: isEnabled ? 1 : 0.6,
                                        '&:hover': {
                                            backgroundColor: isVintage ? '#c9a876' : '#1f1f1f',
                                            transform: isEnabled ? 'translateX(4px)' : 'translateX(2px)',
                                            boxShadow: isEnabled ? `0 2px 8px ${patternColor}33` : 'none'
                                        }
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            p: 2,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => togglePattern(pattern.phonetic_link_id)}
                                    >
                                        <Box sx={{ flex: 1, mr: 1 }}>
                                            {/* Pattern Description */}
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    color: isEnabled ? (isVintage ? '#3d2914' : '#ffffff') : '#888',
                                                    fontWeight: isEnabled ? 500 : 400,
                                                    mb: 0.5,
                                                    lineHeight: 1.4,
                                                    textDecoration: isEnabled ? 'none' : 'line-through'
                                                }}
                                            >
                                                {pattern.pattern_description}
                                            </Typography>

                                            {/* IPA notation */}
                                            {pattern.acoustic_features?.ipa_notation && (
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        fontFamily: '"Roboto Mono", monospace', 
                                                        color: patternColor,
                                                        fontWeight: 'bold',
                                                        display: 'block',
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {pattern.acoustic_features.ipa_notation}
                                                </Typography>
                                            )}

                                            {/* Quick preview of segments */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                {pattern.segments.slice(0, isExpanded ? undefined : 3).map((segment, segIndex) => (
                                                    <Chip
                                                        key={segIndex}
                                                        label={segment.text}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            backgroundColor: isEnabled ? `${patternColor}44` : '#44444444',
                                                            color: isEnabled ? '#ffffff' : '#888',
                                                            fontWeight: isEnabled ? '500' : '400',
                                                            fontSize: '0.75rem',
                                                            fontFamily: '"Roboto Mono", monospace',
                                                            border: `1px solid ${isEnabled ? patternColor : '#666'}66`,
                                                            opacity: isEnabled ? 1 : 0.6,
                                                            '& .MuiChip-label': {
                                                                px: 1
                                                            }
                                                        }}
                                                    />
                                                ))}
                                                {!isExpanded && pattern.segments.length > 3 && (
                                                    <Typography variant="caption" sx={{ color: '#666', alignSelf: 'center' }}>
                                                        +{pattern.segments.length - 3} more
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {onTogglePattern && (
                                                <Switch
                                                    size="small"
                                                    checked={showAllHighlights || enabledPatterns.has(pattern.phonetic_link_id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onTogglePattern(pattern.phonetic_link_id);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                        '& .MuiSwitch-switchBase': {
                                                            color: '#888',
                                                            '&.Mui-checked': {
                                                                color: '#4ECDC4',
                                                                '& + .MuiSwitch-track': {
                                                                    backgroundColor: '#4ECDC4',
                                                                    opacity: 0.5,
                                                                },
                                                            },
                                                        },
                                                        '& .MuiSwitch-track': {
                                                            backgroundColor: isVintage ? '#a08060' : '#444',
                                                            opacity: 1,
                                                        },
                                                    }}
                                                />
                                            )}
                                            <IconButton 
                                                size="small" 
                                                sx={{ 
                                                    color: '#666',
                                                    '&:hover': { color: '#fff' }
                                                }}
                                            >
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Expanded details */}
                                    <Collapse in={isExpanded}>
                                        <Box sx={{ px: 2, pb: 2 }}>
                                            <Divider sx={{ my: 1, borderColor: '#333' }} />
                                            
                                            {/* Acoustic features */}
                                            {pattern.acoustic_features && (
                                                <Box sx={{ mb: 1.5 }}>
                                                    {pattern.acoustic_features.secondary_features && pattern.acoustic_features.secondary_features.length > 0 && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {pattern.acoustic_features.secondary_features.map((feature, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={feature.replace(/_/g, ' ')}
                                                                    size="small"
                                                                    sx={{ 
                                                                        height: '18px',
                                                                        fontSize: '0.65rem',
                                                                        textTransform: 'capitalize',
                                                                        backgroundColor: '#333',
                                                                        color: '#999',
                                                                        border: '1px solid #444',
                                                                        '& .MuiChip-label': {
                                                                            px: 0.75
                                                                        }
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}

                                            {/* All segments with source */}
                                            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>
                                                All occurrences:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {pattern.segments.map((segment, segIndex) => (
                                                    <Box key={segIndex} sx={{ textAlign: 'center' }}>
                                                        <Chip
                                                            label={segment.text}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: `${patternColor}66`,
                                                                color: '#ffffff',
                                                                fontWeight: '600',
                                                                fontFamily: '"Roboto Mono", monospace',
                                                                border: `1px solid ${patternColor}`,
                                                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                                                            }}
                                                        />
                                                        {segment.source_word && segment.source_word !== segment.text && (
                                                            <Typography 
                                                                variant="caption" 
                                                                sx={{ 
                                                                    display: 'block',
                                                                    fontSize: '0.6rem',
                                                                    color: '#666',
                                                                    mt: 0.25
                                                                }}
                                                            >
                                                                from "{segment.source_word}"
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default AnalysisLegend; 