import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  MusicNote,
  TextFields,
  Lyrics,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import LunarSwitch from './LunarSwitch';

interface PatternControl {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

interface ControlDeckProps {
  patterns: PatternControl[];
  onTogglePattern: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  patterns,
  onTogglePattern,
  onToggleAll,
  collapsed = false,
  onToggleCollapse,
}) => {
  const theme = useTheme();
  const allEnabled = patterns.every(p => p.enabled);

  const getIcon = (id: string) => {
    const icons: Record<string, React.ReactNode> = {
      perfectRhymes: <MusicNote fontSize="small" />,
      assonance: <TextFields fontSize="small" />,
      consonance: <Lyrics fontSize="small" />,
      alliteration: <AutoAwesome fontSize="small" />,
    };
    return icons[id] || <TextFields fontSize="small" />;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 20,
        top: 100,
        width: collapsed ? 60 : 280,
        transition: 'all 0.3s ease-in-out',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
        }}
        onClick={onToggleCollapse}
      >
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Control Deck
          </Typography>
        )}
        <IconButton size="small">
          {collapsed ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ p: 2 }}>
          {/* Master Toggle */}
          <Box
            sx={{
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <FormControlLabel
              control={
                <LunarSwitch
                  checked={allEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggleAll(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  {allEnabled ? 'All Patterns Active' : 'Toggle All Patterns'}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Box>

          {/* Individual Pattern Controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {patterns.map((pattern) => (
              <Box
                key={pattern.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: pattern.enabled 
                    ? `${pattern.color}15` 
                    : 'transparent',
                  border: `1px solid ${pattern.enabled ? pattern.color : 'transparent'}`,
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: pattern.color,
                    color: theme.palette.background.default,
                  }}
                >
                  {getIcon(pattern.id)}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {pattern.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pattern.description}
                  </Typography>
                </Box>

                <Switch
                  size="small"
                  checked={pattern.enabled}
                  onChange={() => onTogglePattern(pattern.id)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: pattern.color,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: pattern.color,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Stats */}
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary">
              Active Patterns: {patterns.filter(p => p.enabled).length} / {patterns.length}
            </Typography>
          </Box>
        </Box>
      </Collapse>

      {/* Collapsed State */}
      {collapsed && (
        <Box sx={{ p: 1 }}>
          {patterns.map((pattern) => (
            <Tooltip key={pattern.id} title={pattern.name} placement="left">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePattern(pattern.id);
                }}
                sx={{
                  color: pattern.enabled ? pattern.color : theme.palette.text.disabled,
                  mb: 1,
                  width: '100%',
                }}
              >
                {getIcon(pattern.id)}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export type { PatternControl }; 