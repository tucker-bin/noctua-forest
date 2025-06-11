import { createTheme } from '@mui/material/styles';

// Noctua Design System Colors
export const noctuaColors = {
  // Primary Surfaces (The Night Sky)
  deepIndigo: '#0D1117',
  midnightBlue: '#161B22',
  charcoal: '#21262D',
  
  // Primary Text & Icons
  moonbeam: '#E6EDF3',
  mutedSilver: '#8B949E',
  
  // Action & Accent (The Firefly Glow)
  vibrantGold: '#F7B538',
  brightSkyBlue: '#58A6FF',
  
  // Phonetic Highlighting Palette (The Bioluminescence)
  highlights: {
    perfectRhymes: 'rgba(239, 83, 80, 0.7)',
    assonance: 'rgba(173, 216, 230, 0.7)',
    consonance: 'rgba(144, 238, 144, 0.7)',
    slantRhymes: 'rgba(255, 165, 0, 0.7)',
    alliteration: 'rgba(221, 160, 221, 0.7)',
    // Hover states (more opaque)
    perfectRhymesHover: 'rgba(239, 83, 80, 0.9)',
    assonanceHover: 'rgba(173, 216, 230, 0.9)',
    consonanceHover: 'rgba(144, 238, 144, 0.9)',
    slantRhymesHover: 'rgba(255, 165, 0, 0.9)',
    alliterationHover: 'rgba(221, 160, 221, 0.9)',
  },
  
  // Additional semantic colors
  success: '#2EA043',
  warning: '#F7B538',
  error: '#F85149',
  info: '#58A6FF',
  // Orion moods
  wisdom: '#A3E635',      // Soft lime green for wisdom
  creativity: '#FF6F91',  // Vibrant pink for creativity
  rhythm: '#00B8A9',      // Teal for rhythm
};

// Typography configuration
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontFamily: '"Lora", serif',
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: '"Lora", serif',
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: '"Lora", serif',
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: '"Lora", serif',
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h5: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  h6: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  button: {
    fontWeight: 500,
    letterSpacing: '0.02em',
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: noctuaColors.mutedSilver,
  },
};

// Create the Noctua theme
export const noctuaTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: noctuaColors.vibrantGold,
      light: '#F9C74F',
      dark: '#E09F24',
      contrastText: noctuaColors.deepIndigo,
    },
    secondary: {
      main: noctuaColors.brightSkyBlue,
      light: '#79B8FF',
      dark: '#388BFD',
      contrastText: noctuaColors.deepIndigo,
    },
    background: {
      default: noctuaColors.deepIndigo,
      paper: noctuaColors.midnightBlue,
    },
    text: {
      primary: noctuaColors.moonbeam,
      secondary: noctuaColors.mutedSilver,
    },
    divider: noctuaColors.charcoal,
    success: {
      main: noctuaColors.success,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: noctuaColors.warning,
      contrastText: noctuaColors.deepIndigo,
    },
    error: {
      main: noctuaColors.error,
      contrastText: '#FFFFFF',
    },
    info: {
      main: noctuaColors.info,
      contrastText: '#FFFFFF',
    },
  },
  typography,
  spacing: 8, // 8px grid system
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: noctuaColors.midnightBlue,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: noctuaColors.charcoal,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: noctuaColors.mutedSilver,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(247, 181, 56, 0.2)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(247, 181, 56, 0.3)',
          },
        },
        containedPrimary: {
          background: noctuaColors.vibrantGold,
          color: noctuaColors.deepIndigo,
          '&:hover': {
            background: '#F9C74F',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(22, 27, 34, 0.5)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: noctuaColors.charcoal,
              transition: 'all 0.2s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: noctuaColors.mutedSilver,
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(22, 27, 34, 0.8)',
              '& fieldset': {
                borderColor: noctuaColors.brightSkyBlue,
                borderWidth: 2,
                boxShadow: `0 0 0 3px ${noctuaColors.brightSkyBlue}33`,
              },
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: noctuaColors.midnightBlue,
          border: `1px solid ${noctuaColors.charcoal}`,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(22, 27, 34, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${noctuaColors.charcoal}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            border: `1px solid ${noctuaColors.mutedSilver}`,
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: noctuaColors.midnightBlue,
          border: `1px solid ${noctuaColors.charcoal}`,
          backdropFilter: 'blur(10px)',
          fontSize: '0.875rem',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
        arrow: {
          color: noctuaColors.midnightBlue,
          '&::before': {
            border: `1px solid ${noctuaColors.charcoal}`,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 48,
          height: 26,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(22px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: noctuaColors.vibrantGold,
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 22,
            height: 22,
          },
          '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: noctuaColors.charcoal,
            opacity: 1,
            transition: 'background-color 300ms',
          },
        },
      },
    },
  },
});

// Animation keyframes
export const animations = {
  fadeIn: {
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  slideUp: {
    '@keyframes slideUp': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  pulse: {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
  },
  glow: {
    '@keyframes glow': {
      '0%': { boxShadow: '0 0 5px rgba(247, 181, 56, 0.5)' },
      '50%': { boxShadow: '0 0 20px rgba(247, 181, 56, 0.8)' },
      '100%': { boxShadow: '0 0 5px rgba(247, 181, 56, 0.5)' },
    },
  },
};

// Custom component styles
export const customStyles = {
  glassPanel: {
    backgroundColor: 'rgba(22, 27, 34, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${noctuaColors.charcoal}`,
    borderRadius: 8,
  },
  focusGlow: {
    '&:focus-within': {
      boxShadow: `0 0 0 3px ${noctuaColors.brightSkyBlue}33`,
      borderColor: noctuaColors.brightSkyBlue,
    },
  },
  starfield: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(1px 1px at 20% 30%, white 1%, transparent 0%),
        radial-gradient(1px 1px at 60% 70%, white 1%, transparent 0%),
        radial-gradient(1px 1px at 80% 10%, white 1%, transparent 0%)
      `,
      backgroundSize: '200px 200px',
      opacity: 0.3,
      animation: 'twinkle 10s ease-in-out infinite',
      pointerEvents: 'none',
    },
    '@keyframes twinkle': {
      '0%, 100%': { opacity: 0.3 },
      '50%': { opacity: 0.5 },
    },
  },
}; 