import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ThemeMode, ColorPalette } from '../../../types/observatory';

interface ObservatoryTheme {
  mode: ThemeMode;
  colorPalette: ColorPalette;
  expandedView: boolean;
  viewportHeight: number;
  highlightOpacity: number;
}

interface CustomizePanelProps {
  theme: ObservatoryTheme;
  onThemeChange: (newTheme: Partial<ObservatoryTheme>) => void;
}

export const CustomizePanel: React.FC<CustomizePanelProps> = ({
  theme,
  onThemeChange
}) => {
  const { t } = useTranslation();

  const handleReset = () => {
    onThemeChange({
      mode: 'dark',
      colorPalette: 'celestial',
      expandedView: false,
      viewportHeight: 600,
      highlightOpacity: 0.3
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        {t('observatory.customize_appearance')}
      </Typography>

      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Theme Mode */}
        <FormControl>
          <InputLabel>{t('observatory.theme_mode')}</InputLabel>
          <Select
            value={theme.mode || 'dark'}
            label={t('observatory.theme_mode')}
            onChange={(e) => onThemeChange({ mode: e.target.value as ThemeMode })}
            size="small"
          >
            <MenuItem value="dark">{t('observatory.theme_mode_dark')}</MenuItem>
            <MenuItem value="light">{t('observatory.theme_mode_light')}</MenuItem>
            <MenuItem value="vintage">{t('observatory.theme_mode_vintage')}</MenuItem>
          </Select>
        </FormControl>

        {/* Color Palette */}
        <FormControl>
          <InputLabel>{t('observatory.color_palette')}</InputLabel>
          <Select
            value={theme.colorPalette || 'celestial'}
            label={t('observatory.color_palette')}
            onChange={(e) => onThemeChange({ colorPalette: e.target.value as ColorPalette })}
            size="small"
          >
            <MenuItem value="celestial">{t('observatory.palette_celestial')}</MenuItem>
            <MenuItem value="aurora">{t('observatory.palette_aurora')}</MenuItem>
            <MenuItem value="nebula">{t('observatory.palette_nebula')}</MenuItem>
            <MenuItem value="stardust">{t('observatory.palette_stardust')}</MenuItem>
            <MenuItem value="cosmic">{t('observatory.palette_cosmic')}</MenuItem>
            <MenuItem value="galaxy">{t('observatory.palette_galaxy')}</MenuItem>
          </Select>
        </FormControl>

        {/* Expanded View */}
        <FormControlLabel
          control={
            <Switch
              checked={theme.expandedView}
              onChange={(e) => onThemeChange({ expandedView: e.target.checked })}
            />
          }
          label={t('observatory.expanded_view')}
        />

        {/* Viewport Height */}
        <Box>
          <Typography variant="body2" gutterBottom>
            {t('observatory.viewport_height')}
          </Typography>
          <Slider
            value={theme.viewportHeight}
            min={400}
            max={1200}
            step={100}
            marks
            onChange={(_, value) => onThemeChange({ viewportHeight: value as number })}
          />
        </Box>

        {/* Highlight Opacity */}
        <Box>
          <Typography variant="body2" gutterBottom>
            {t('observatory.highlight_opacity')}
          </Typography>
          <Slider
            value={theme.highlightOpacity}
            min={0.1}
            max={0.9}
            step={0.1}
            marks
            onChange={(_, value) => onThemeChange({ highlightOpacity: value as number })}
          />
        </Box>

        {/* Reset Button */}
        <Button 
          variant="outlined" 
          onClick={handleReset}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('observatory.reset_theme')}
        </Button>
      </Stack>
    </Box>
  );
}; 