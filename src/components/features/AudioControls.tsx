import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Slider,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Tooltip
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VibrationIcon from '@mui/icons-material/Vibration';
import { audioService } from '../../services/audioService';

export const AudioControls: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settings, setSettings] = useState(audioService.getSettings());

  useEffect(() => {
    setSettings(audioService.getSettings());
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleMasterVolumeChange = (_event: Event, newValue: number | number[]) => {
    const volume = Array.isArray(newValue) ? newValue[0] : newValue;
    audioService.setMasterVolume(volume / 100);
    setSettings(audioService.getSettings());
  };

  const handleEffectsVolumeChange = (_event: Event, newValue: number | number[]) => {
    const volume = Array.isArray(newValue) ? newValue[0] : newValue;
    audioService.setEffectsVolume(volume / 100);
    setSettings(audioService.getSettings());
  };

  const handleMuteToggle = () => {
    audioService.toggleMute();
    setSettings(audioService.getSettings());
  };

  const handleHapticsToggle = () => {
    audioService.toggleHaptics();
    setSettings(audioService.getSettings());
  };

  const handleTestSound = () => {
    audioService.playTestSound();
  };

  return (
    <>
      <Tooltip title="Audio Settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'grey.100' },
            boxShadow: 1
          }}
        >
          {settings.isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 3, minWidth: 280 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            🔊 Audio Settings
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Master Volume
            </Typography>
            <Slider
              value={settings.masterVolume * 100}
              onChange={handleMasterVolumeChange}
              disabled={settings.isMuted}
              min={0}
              max={100}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
              sx={{ mt: 1 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Effects Volume
            </Typography>
            <Slider
              value={settings.effectsVolume * 100}
              onChange={handleEffectsVolumeChange}
              disabled={settings.isMuted}
              min={0}
              max={100}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!settings.isMuted}
                  onChange={handleMuteToggle}
                  color="primary"
                />
              }
              label="Enable Sound Effects"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableHaptics}
                  onChange={handleHapticsToggle}
                  color="primary"
                  icon={<VibrationIcon sx={{ fontSize: 16 }} />}
                />
              }
              label="Enable Haptic Feedback"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={handleTestSound}
              disabled={settings.isMuted}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' }
              }}
            >
              🎵
            </IconButton>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Test Sound
            </Typography>
          </Box>
        </Paper>
      </Popover>
    </>
  );
}; 