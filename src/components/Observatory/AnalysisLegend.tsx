import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Pattern } from '../../types/observatory';

interface AnalysisLegendProps {
  patterns: Pattern[];
  onToggleFilter: (patternType: string) => void;
  activeFilters: Set<string>;
  palette: Record<string, string>;
  activePatterns: Set<Pattern>;
  onPatternInstanceClick: (pattern: Pattern) => void;
}

const AnalysisLegend: React.FC<AnalysisLegendProps> = ({
  patterns,
  onToggleFilter,
  activeFilters,
  palette,
  activePatterns,
  onPatternInstanceClick
}) => {
  const { t } = useTranslation();

  // Group patterns by type with simplified metrics
  const patternGroups = useMemo(() => {
    const groups = new Map<string, Pattern[]>();
    patterns.forEach(pattern => {
      const type = pattern.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)?.push(pattern);
    });
    
    return Array.from(groups.entries())
      .map(([type, typePatterns]) => {
        const fallbackName = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return {
          type,
          patterns: typePatterns,
          count: typePatterns.length,
          totalSegments: typePatterns.reduce((sum, p) => sum + p.segments.length, 0),
          displayName: t(`patterns.${type}.name`, { defaultValue: fallbackName }),
          description: t(`patterns.${type}.description`, { defaultValue: 'A notable sound pattern.' })
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }, [patterns, t]);

  const getPatternColor = useCallback((type: string) => {
    return palette[type] || palette.default || '#6B7280';
  }, [palette]);

  return (
    <Box>
      {/* Simple Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 1, color: '#F3F4F6' }}>
          Patterns Found ({patterns.length})
        </Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
          Click to show/hide patterns
        </Typography>
      </Box>

      {/* Simplified Pattern List */}
      <List dense sx={{ maxHeight: '60vh', overflow: 'auto' }}>
        {patternGroups.map(({ type, count, totalSegments, displayName, description }) => {
          const isVisible = activeFilters.has(type) || activeFilters.size === 0;
          const color = getPatternColor(type);

          return (
            <ListItem key={type} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => onToggleFilter(type)}
                sx={{
                  py: 2,
                  backgroundColor: isVisible ? `${color}15` : 'transparent',
                  borderRadius: 2,
                  border: `2px solid ${isVisible ? color : 'transparent'}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: `${color}25`,
                    borderColor: color
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: isVisible ? '3px solid white' : '1px solid rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ 
                        fontWeight: isVisible ? 600 : 400,
                        color: '#F3F4F6',
                        fontSize: '1rem'
                      }}>
                        {displayName}
                      </Typography>
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.75rem',
                          backgroundColor: color,
                          color: 'white',
                          minWidth: 28,
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                      {description} • {totalSegments} instances
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {patternGroups.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No patterns found in this text
        </Typography>
      )}

      {/* Quick Toggle All */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Chip
            label="Show All"
            clickable
            onClick={() => patternGroups.forEach(({ type }) => {
              if (!activeFilters.has(type)) onToggleFilter(type);
            })}
            sx={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60A5FA',
              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.3)' }
            }}
          />
          <Chip
            label="Hide All"
            clickable
            onClick={() => patternGroups.forEach(({ type }) => {
              if (activeFilters.has(type)) onToggleFilter(type);
            })}
            sx={{ 
              backgroundColor: 'rgba(107, 114, 128, 0.2)',
              color: '#9CA3AF',
              '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.3)' }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AnalysisLegend; 