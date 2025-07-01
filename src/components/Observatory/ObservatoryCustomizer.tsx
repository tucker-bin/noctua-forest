import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Upload as UploadIcon,
  TextFields as TextFieldsIcon,
  RestartAlt as ResetIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  FormatColorFill as FillIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

export interface ObservatoryTheme {
  // Background options
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundColor: string;
  gradientColors: [string, string];
  gradientDirection: number; // degrees
  backgroundImage?: string;
  backgroundOpacity: number;
  backgroundBlur: number;
  
  // Text styling
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  lineHeight: number;
  letterSpacing: number;
  
  // Highlight styling
  highlightOpacity: number;
  highlightBorderRadius: number;
  highlightPadding: number;
  highlightShadow: boolean;
  
  // Layout
  textAlign: 'left' | 'center' | 'right' | 'justify';
  maxWidth: number;
  padding: number;
  
  // Viewport
  expandedView: boolean;
  viewportHeight: number;
}

export const DEFAULT_THEME: ObservatoryTheme = {
  backgroundType: 'solid',
  backgroundColor: '#1a1a1a',
  gradientColors: ['#1a1a1a', '#2d2d2d'],
  gradientDirection: 45,
  backgroundOpacity: 1,
  backgroundBlur: 0,
  fontFamily: 'Georgia',
  fontSize: 18,
  fontWeight: 400,
  textColor: '#ffffff',
  lineHeight: 1.8,
  letterSpacing: 0,
  highlightOpacity: 0.8,
  highlightBorderRadius: 4,
  highlightPadding: 6,
  highlightShadow: true,
  textAlign: 'left',
  maxWidth: 800,
  padding: 24,
  expandedView: false,
  viewportHeight: 400
};

const FONT_OPTIONS = [
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Arial', label: 'Arial (Sans-serif)' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Courier New', label: 'Courier New (Monospace)' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Fira Code', label: 'Fira Code' }
];

const PRESET_COLORS = [
  // Dark tones
  '#000000', '#1a1a1a', '#2d2d2d', '#3d3d3d',
  '#1e1e1e', '#2a2a2a', '#363636', '#4a4a4a',
  
  // White and paper tones
  '#ffffff', '#fefefe', '#fdfdf9', '#fcfcfc',
  '#f9f9f7', '#f7f5f3', '#f5f3f0', '#f2f0e8',
  '#f0ede5', '#ede8e0', '#e8e3db', '#e5ddd5',
  '#ddd6ce', '#d4cfc7', '#ccc5bd', '#c4bdb5',
  
  // Warm paper tones
  '#faf8f5', '#f6f2ed', '#f1ece5', '#ede6dd',
  '#e9e0d5', '#e4dacd', '#dfd4c5', '#dacebe',
  
  // Cool paper tones  
  '#f8f9fa', '#f1f3f4', '#e8eaed', '#dee1e6',
  '#d2d5da', '#c4c7cc', '#b6bac0', '#a8acb4',
  
  // Themed colors
  '#0f172a', '#1e293b', '#334155', '#475569',
  '#7c2d12', '#991b1b', '#7c3aed', '#2563eb',
  '#059669', '#0891b2', '#ca8a04', '#dc2626'
];

const GRADIENT_PRESETS = [
  { name: 'Night Sky', colors: ['#0f172a', '#1e293b'] as [string, string] },
  { name: 'Deep Ocean', colors: ['#1e293b', '#0891b2'] as [string, string] },
  { name: 'Forest', colors: ['#1a2e05', '#365314'] as [string, string] },
  { name: 'Sunset', colors: ['#7c2d12', '#ca8a04'] as [string, string] },
  { name: 'Purple Haze', colors: ['#581c87', '#7c3aed'] as [string, string] }
];

interface ObservatoryCustomizerProps {
  theme: ObservatoryTheme;
  onThemeChange: (theme: ObservatoryTheme) => void;
  onSave?: (theme: ObservatoryTheme) => void;
  onReset?: () => void;
}

export const ObservatoryCustomizer: React.FC<ObservatoryCustomizerProps> = ({
  theme,
  onThemeChange,
  onSave,
  onReset
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onThemeChange({
          ...theme,
          backgroundType: 'image',
          backgroundImage: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTheme = (updates: Partial<ObservatoryTheme>) => {
    onThemeChange({ ...theme, ...updates });
  };

  const handleExportPNG = async () => {
    const textElement = document.getElementById('observatory-text-display');
    
    if (!textElement) {
      alert('No content to export. Please run an observation first.');
      return;
    }

    try {
      // Use HTML2Canvas for perfect rendering
      const canvas = await html2canvas(textElement, {
        useCORS: true,
        background: theme.backgroundType === 'solid' ? theme.backgroundColor : '#ffffff',
        logging: false,
        width: textElement.offsetWidth,
        height: textElement.offsetHeight
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.download = `observatory-analysis-${new Date().toISOString().slice(0, 10)}.png`;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          
          if (onSave) {
            onSave(theme);
          }
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to existing export method
      exportWithOptimizedWindow(textElement);
    }
  };

  const exportWithFileSystemAPI = async (element: HTMLElement) => {
    try {
      // Create a high-quality export using Canvas API
      const canvas = await createCanvasFromElement(element);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      // Use File System Access API for native save dialog
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `observatory-analysis-${new Date().toISOString().slice(0, 10)}.png`,
        types: [{
          description: 'PNG images',
          accept: { 'image/png': ['.png'] }
        }]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      // Show success message
      if (onSave) {
        onSave(theme);
      }
    } catch (error) {
      throw error;
    }
  };

  const createCanvasFromElement = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set high DPI for crisp exports
    const scale = window.devicePixelRatio || 2;
    const rect = element.getBoundingClientRect();
    
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    ctx.scale(scale, scale);
    
    // Apply background
    if (theme.backgroundType === 'solid') {
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    } else if (theme.backgroundType === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, theme.gradientColors[0]);
      gradient.addColorStop(1, theme.gradientColors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    // Render text content
    await renderTextToCanvas(ctx, element, theme);
    
    return canvas;
  };

  const renderTextToCanvas = async (ctx: CanvasRenderingContext2D, element: HTMLElement, theme: ObservatoryTheme) => {
    ctx.font = `${theme.fontWeight} ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    ctx.textBaseline = 'top';
    
    const lines = element.textContent?.split('\n') || [];
    const lineHeight = theme.fontSize * theme.lineHeight;
    let y = theme.padding;
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        ctx.fillText(line, theme.padding, y);
      }
      y += lineHeight;
    });
  };

  const exportWithOptimizedWindow = (element: HTMLElement) => {
    // Create a beautifully styled export window
    const exportWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    if (!exportWindow) return;

    const styles = generateExportStyles();
    const content = element.innerHTML;
    
    exportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Observatory Analysis - Export</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0;
              background: #f5f5f5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .export-container {
              max-width: 1000px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .export-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .export-content { 
              ${styles}
              margin: 0;
              border-radius: 0;
              box-shadow: none;
            }
            .export-footer {
              padding: 20px;
              text-align: center;
              background: #f8f9fa;
              border-top: 1px solid #e9ecef;
            }
            .export-instructions {
              background: #e3f2fd;
              border: 1px solid #bbdefb;
              border-radius: 8px;
              padding: 15px;
              margin: 10px 0;
            }
            .btn {
              background: #2196f3;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              margin: 5px;
              transition: background 0.2s;
            }
            .btn:hover { background: #1976d2; }
            .btn-secondary {
              background: #6c757d;
            }
            .btn-secondary:hover { background: #545b62; }
            @media print {
              body { background: white; }
              .export-container { 
                box-shadow: none; 
                margin: 0;
                max-width: none;
              }
              .export-header, .export-footer { display: none; }
              .export-content { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="export-container">
            <div class="export-header">
              <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Observatory Analysis</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="export-content">${content}</div>
            
            <div class="export-footer">
              <div class="export-instructions">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">📸 How to Save as PNG</h3>
                <p style="margin: 0; line-height: 1.5;">
                  <strong>Method 1:</strong> Right-click on the content above → "Save as..." or "Save image as..."<br>
                  <strong>Method 2:</strong> Use your browser's screenshot tool (Ctrl+Shift+S on Windows/Linux, Cmd+Shift+5 on Mac)<br>
                  <strong>Method 3:</strong> Print to PDF, then convert to PNG using any online converter
                </p>
              </div>
              
              <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
              <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
            </div>
          </div>
          
          <script>
            // Auto-focus for better UX
            window.focus();
            
            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
              }
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    exportWindow.document.close();
  };

  const generateExportStyles = () => {
    const backgroundStyle = generateBackgroundStyle();
    return `
      padding: ${theme.padding}px;
      font-family: ${theme.fontFamily};
      font-size: ${theme.fontSize}px;
      font-weight: ${theme.fontWeight};
      color: ${theme.textColor};
      line-height: ${theme.lineHeight};
      letter-spacing: ${theme.letterSpacing}px;
      text-align: ${theme.textAlign};
      max-width: ${theme.maxWidth}px;
      margin: 0 auto;
      background: ${backgroundStyle.background || backgroundStyle.backgroundColor || 'transparent'};
      border-radius: 8px;
      min-height: 300px;
    `;
  };

  const generateBackgroundStyle = () => {
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
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)
          `,
          backgroundSize: '20px 20px'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.backgroundColor
        };
    }
  };

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );

  return (
    <Paper elevation={2} sx={{ p: 3, maxHeight: '80vh', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('observatory.customizer.title', 'Observatory Customizer')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={theme.expandedView ? <FullscreenExitIcon /> : <FullscreenIcon />}
            onClick={() => updateTheme({ expandedView: !theme.expandedView })}
          >
            {theme.expandedView ? 'Compact' : 'Expand'}
          </Button>
          <Tooltip title="Export your styled analysis as a high-quality PNG image - works natively in all modern browsers!">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportPNG}
              sx={{
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                color: 'white',
                border: 'none',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2 30%, #1cb5e0 90%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              📸 Export PNG
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ResetIcon />}
            onClick={onReset}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => onSave?.(theme)}
          >
            Save
          </Button>
        </Stack>
      </Box>

      {!previewMode && (
        <>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
            <Tab icon={<FillIcon />} label="Background" />
            <Tab icon={<TextFieldsIcon />} label="Typography" />
            <Tab icon={<PaletteIcon />} label="Highlights" />
          </Tabs>

          {/* Background Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Background Type</InputLabel>
                <Select
                  value={theme.backgroundType}
                  onChange={(e) => updateTheme({ backgroundType: e.target.value as any })}
                  label="Background Type"
                >
                  <MenuItem value="solid">Solid Color</MenuItem>
                  <MenuItem value="gradient">Gradient</MenuItem>
                  <MenuItem value="image">Custom Image</MenuItem>
                  <MenuItem value="pattern">Pattern</MenuItem>
                </Select>
              </FormControl>

              {theme.backgroundType === 'solid' && (
                <Box>
                  <Typography gutterBottom>Background Color</Typography>
                  
                  {/* Color Input */}
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Color (hex, rgb, or name)"
                      value={theme.backgroundColor}
                      onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                      placeholder="e.g. #ffffff, rgb(255,255,255), white"
                      InputProps={{
                        startAdornment: (
                          <input
                            type="color"
                            value={theme.backgroundColor.startsWith('#') ? theme.backgroundColor : '#ffffff'}
                            onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                            style={{
                              width: 24,
                              height: 24,
                              border: 'none',
                              borderRadius: 4,
                              marginRight: 8,
                              cursor: 'pointer'
                            }}
                          />
                        )
                      }}
                    />
                  </Box>

                  {/* Preset Colors - Organized by category */}
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Quick Presets:</Typography>
                  
                  {/* Dark Tones */}
                  <Typography variant="caption" color="text.secondary">Dark Tones</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {PRESET_COLORS.slice(0, 8).map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: color,
                          borderRadius: 1,
                          border: theme.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                        onClick={() => updateTheme({ backgroundColor: color })}
                      />
                    ))}
                  </Box>

                  {/* White & Paper Tones */}
                  <Typography variant="caption" color="text.secondary">White & Paper Tones</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {PRESET_COLORS.slice(8, 24).map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: color,
                          borderRadius: 1,
                          border: theme.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                        onClick={() => updateTheme({ backgroundColor: color })}
                      />
                    ))}
                  </Box>

                  {/* Warm Paper Tones */}
                  <Typography variant="caption" color="text.secondary">Warm Paper Tones</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {PRESET_COLORS.slice(24, 32).map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: color,
                          borderRadius: 1,
                          border: theme.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                        onClick={() => updateTheme({ backgroundColor: color })}
                      />
                    ))}
                  </Box>

                  {/* Cool Paper Tones */}
                  <Typography variant="caption" color="text.secondary">Cool Paper Tones</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {PRESET_COLORS.slice(32, 40).map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: color,
                          borderRadius: 1,
                          border: theme.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                        onClick={() => updateTheme({ backgroundColor: color })}
                      />
                    ))}
                  </Box>

                  {/* Themed Colors */}
                  <Typography variant="caption" color="text.secondary">Themed Colors</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {PRESET_COLORS.slice(40).map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: color,
                          borderRadius: 1,
                          border: theme.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                        onClick={() => updateTheme({ backgroundColor: color })}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {theme.backgroundType === 'gradient' && (
                <Box>
                  <Typography gutterBottom>Gradient Presets</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 2 }}>
                    {GRADIENT_PRESETS.map(preset => (
                      <Chip
                        key={preset.name}
                        label={preset.name}
                        onClick={() => updateTheme({ gradientColors: preset.colors })}
                        sx={{
                          background: `linear-gradient(45deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                          color: 'white'
                        }}
                      />
                    ))}
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Color 1"
                        value={theme.gradientColors[0]}
                        onChange={(e) => updateTheme({ 
                          gradientColors: [e.target.value, theme.gradientColors[1]] 
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Color 2"
                        value={theme.gradientColors[1]}
                        onChange={(e) => updateTheme({ 
                          gradientColors: [theme.gradientColors[0], e.target.value] 
                        })}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom>Direction: {theme.gradientDirection}°</Typography>
                    <Slider
                      value={theme.gradientDirection}
                      onChange={(_, value) => updateTheme({ gradientDirection: value as number })}
                      min={0}
                      max={360}
                      step={15}
                    />
                  </Box>
                </Box>
              )}

              {theme.backgroundType === 'image' && (
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                  >
                    Upload Background Image
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {theme.backgroundImage && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <img
                        src={theme.backgroundImage}
                        alt="Background preview"
                        style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              <Box>
                <Typography gutterBottom>Opacity: {Math.round(theme.backgroundOpacity * 100)}%</Typography>
                <Slider
                  value={theme.backgroundOpacity}
                  onChange={(_, value) => updateTheme({ backgroundOpacity: value as number })}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Blur: {theme.backgroundBlur}px</Typography>
                <Slider
                  value={theme.backgroundBlur}
                  onChange={(_, value) => updateTheme({ backgroundBlur: value as number })}
                  min={0}
                  max={10}
                  step={1}
                />
              </Box>
            </Stack>
          </TabPanel>

          {/* Typography Tab */}
          <TabPanel value={activeTab} index={1}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={theme.fontFamily}
                  onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                  label="Font Family"
                >
                  {FONT_OPTIONS.map(font => (
                    <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                      {font.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Font Size: {theme.fontSize}px</Typography>
                <Slider
                  value={theme.fontSize}
                  onChange={(_, value) => updateTheme({ fontSize: value as number })}
                  min={12}
                  max={36}
                  step={1}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Font Weight: {theme.fontWeight}</Typography>
                <Slider
                  value={theme.fontWeight}
                  onChange={(_, value) => updateTheme({ fontWeight: value as number })}
                  min={100}
                  max={900}
                  step={100}
                  marks={[
                    { value: 100, label: 'Thin' },
                    { value: 400, label: 'Normal' },
                    { value: 700, label: 'Bold' },
                    { value: 900, label: 'Black' }
                  ]}
                />
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Text Color"
                value={theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
              />

              <Box>
                <Typography gutterBottom>Line Height: {theme.lineHeight}</Typography>
                <Slider
                  value={theme.lineHeight}
                  onChange={(_, value) => updateTheme({ lineHeight: value as number })}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Letter Spacing: {theme.letterSpacing}px</Typography>
                <Slider
                  value={theme.letterSpacing}
                  onChange={(_, value) => updateTheme({ letterSpacing: value as number })}
                  min={-2}
                  max={5}
                  step={0.5}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Text Alignment</InputLabel>
                <Select
                  value={theme.textAlign}
                  onChange={(e) => updateTheme({ textAlign: e.target.value as any })}
                  label="Text Alignment"
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                  <MenuItem value="justify">Justify</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </TabPanel>

          {/* Highlights Tab */}
          <TabPanel value={activeTab} index={2}>
            <Stack spacing={3}>
              <Box>
                <Typography gutterBottom>Highlight Opacity: {Math.round(theme.highlightOpacity * 100)}%</Typography>
                <Slider
                  value={theme.highlightOpacity}
                  onChange={(_, value) => updateTheme({ highlightOpacity: value as number })}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Border Radius: {theme.highlightBorderRadius}px</Typography>
                <Slider
                  value={theme.highlightBorderRadius}
                  onChange={(_, value) => updateTheme({ highlightBorderRadius: value as number })}
                  min={0}
                  max={20}
                  step={1}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Padding: {theme.highlightPadding}px</Typography>
                <Slider
                  value={theme.highlightPadding}
                  onChange={(_, value) => updateTheme({ highlightPadding: value as number })}
                  min={2}
                  max={15}
                  step={1}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={theme.highlightShadow}
                    onChange={(e) => updateTheme({ highlightShadow: e.target.checked })}
                  />
                }
                label="Drop Shadow"
              />

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Viewport Height: {theme.viewportHeight}px</Typography>
                <Slider
                  value={theme.viewportHeight}
                  onChange={(_, value) => updateTheme({ viewportHeight: value as number })}
                  min={200}
                  max={1000}
                  step={50}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={theme.expandedView}
                    onChange={(e) => updateTheme({ expandedView: e.target.checked })}
                  />
                }
                label="Expanded Viewport"
              />
            </Stack>
          </TabPanel>
        </>
      )}

      {/* Preview */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Preview
        </Typography>
        <Paper
          id="observatory-preview"
          elevation={1}
          sx={{
            p: theme.padding / 8,
            minHeight: theme.expandedView ? theme.viewportHeight : 150,
            maxHeight: theme.expandedView ? 'none' : 300,
            position: 'relative',
            overflow: theme.expandedView ? 'visible' : 'hidden',
            ...generateBackgroundStyle()
          }}
        >
          <Box
            sx={{
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
              fontWeight: theme.fontWeight,
              color: theme.textColor,
              lineHeight: theme.lineHeight,
              letterSpacing: theme.letterSpacing,
              textAlign: theme.textAlign,
              maxWidth: theme.maxWidth,
              mx: 'auto'
            }}
          >
            <span>The night sky reveals its </span>
            <span
              style={{
                backgroundColor: `rgba(255, 193, 7, ${theme.highlightOpacity})`,
                borderRadius: theme.highlightBorderRadius,
                padding: `${theme.highlightPadding / 2}px ${theme.highlightPadding}px`,
                boxShadow: theme.highlightShadow ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              hidden patterns
            </span>
            <span> through careful </span>
            <span
              style={{
                backgroundColor: `rgba(76, 175, 80, ${theme.highlightOpacity})`,
                borderRadius: theme.highlightBorderRadius,
                padding: `${theme.highlightPadding / 2}px ${theme.highlightPadding}px`,
                boxShadow: theme.highlightShadow ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              observation
            </span>
            <span>.</span>
            <br />
            <br />
            <span>Each constellation tells a story</span>
            <br />
            <span>Written in light across the darkness</span>
          </Box>
        </Paper>
      </Box>

      {/* Export Information */}
      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>🎨 Export Ready!</strong> The Export PNG button creates beautiful, high-quality exports
          using native browser technology. Modern browsers get direct PNG downloads,
          while older browsers get a perfectly formatted export window with easy save options.
          No external dependencies required!
        </Typography>
      </Alert>
    </Paper>
  );
}; 