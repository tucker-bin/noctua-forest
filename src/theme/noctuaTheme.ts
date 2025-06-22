import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { isRTL } from '../i18n';
import i18n from '../i18n';

// Extend the theme to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    celestial: {
      starlight: string;
      nebula: string;
      cosmos: string;
      aurora: string;
    };
    forest: {
      primary: string;    // #90BE6D - Green
      secondary: string;  // #F9C74F - Yellow
      accent: string;     // #43AA8B - Teal
      blue: string;       // #277DA1 - Blue
      dark: string;       // #577590 - Dark blue-gray
      card: string;       // #2d3748 - Card background
      border: string;     // #4D908E - Border color
      background: string; // #1a202c - Main background
    };
  }

  interface PaletteOptions {
    celestial?: {
      starlight: string;
      nebula: string;
      cosmos: string;
      aurora: string;
    };
    forest?: {
      primary: string;
      secondary: string;
      accent: string;
      blue: string;
      dark: string;
      card: string;
      border: string;
      background: string;
    };
  }
}

// Create the Noctua theme
const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90BE6D',      // Forest green (keep this as it looks good)
      light: '#a1d17e',
      dark: '#7ba85a',
      contrastText: '#000000',
    },
    secondary: {
      main: '#43AA8B',      // Muted teal instead of bright yellow
      light: '#5cbaa1',
      dark: '#359a75',
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a202c',   // Main background from mock
      paper: '#2d3748',     // Card background from mock
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.9)',  // text-white/90 from mock
      secondary: 'rgba(255, 255, 255, 0.7)', // text-white/70 from mock
    },
    success: {
      main: '#90BE6D',      // Use primary green for success
    },
    warning: {
      main: '#D4A574',      // Muted earth tone instead of bright yellow
    },
    error: {
      main: '#e74c3c',
    },
    info: {
      main: '#277DA1',      // Forest blue
    },
    celestial: {
      starlight: '#FFD700',
      nebula: '#9C27B0',
      cosmos: '#1A1B2E',
      aurora: '#4CAF50'
    },
    forest: {
      primary: '#90BE6D',     // Main forest green
      secondary: '#43AA8B',   // Muted teal instead of bright yellow
      accent: '#277DA1',      // Blue accent
      blue: '#5A9BD4',        // Softer blue
      dark: '#577590',        // Dark blue-gray for secondary buttons
      card: '#2d3748',        // Card background
      border: '#4D908E',      // Border color with opacity
      background: '#1a202c',  // Main background
    },
  },
  typography: {
    // Use Noto fonts for better international support and readability
    fontFamily: [
      '"Noto Sans"',
      '"Noto Sans Display"', // For headings
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"'
    ].join(','),
    
    // Mobile-first typography inspired by Uber/Airbnb
    h1: {
      fontFamily: '"Noto Sans Display", "Noto Sans", sans-serif',
      fontWeight: 700,
      fontSize: '2rem', // 32px base
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (min-width:600px)': {
        fontSize: '2.5rem', // 40px tablet
      },
      '@media (min-width:900px)': {
        fontSize: '3rem', // 48px desktop
      },
    },
    h2: {
      fontFamily: '"Noto Sans Display", "Noto Sans", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem', // 28px base
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      '@media (min-width:600px)': {
        fontSize: '2rem', // 32px tablet
      },
      '@media (min-width:900px)': {
        fontSize: '2.25rem', // 36px desktop
      },
    },
    h3: {
      fontFamily: '"Noto Sans Display", "Noto Sans", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem', // 24px base
      lineHeight: 1.3,
      letterSpacing: '-0.005em',
      '@media (min-width:600px)': {
        fontSize: '1.625rem', // 26px tablet
      },
      '@media (min-width:900px)': {
        fontSize: '1.75rem', // 28px desktop
      },
    },
    h4: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem', // 20px base
      lineHeight: 1.35,
      '@media (min-width:600px)': {
        fontSize: '1.375rem', // 22px tablet
      },
    },
    h5: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 500,
      fontSize: '1.125rem', // 18px base
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1.25rem', // 20px tablet
      },
    },
    h6: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 500,
      fontSize: '1rem', // 16px base
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1.125rem', // 18px tablet
      },
    },
    
    // Body text optimized for readability (Pinterest/Flipboard style)
    body1: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 400,
      fontSize: '1rem', // 16px base - never smaller for accessibility
      lineHeight: 1.6, // Generous line height for readability
      letterSpacing: '0.01em',
      '@media (min-width:600px)': {
        fontSize: '1.0625rem', // 17px tablet
        lineHeight: 1.65,
      },
    },
    body2: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem', // 14px base
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      '@media (min-width:600px)': {
        fontSize: '0.9375rem', // 15px tablet
        lineHeight: 1.55,
      },
    },
    
    // UI elements (Tinder-style clarity)
    button: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '0.02em',
      textTransform: 'none', // More natural than all caps
    },
    caption: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem', // 12px base
      lineHeight: 1.4,
      letterSpacing: '0.02em',
      '@media (min-width:600px)': {
        fontSize: '0.8125rem', // 13px tablet
      },
    },
    overline: {
      fontFamily: '"Noto Sans", sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: 1.2,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  direction: isRTL(i18n.language) ? 'rtl' : 'ltr',
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
            background: '#1E1E1E',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4A90E2',
            borderRadius: '4px',
          },
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backgroundColor: '#0a0f1c',
          overflow: 'auto'
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // RTL language-specific fonts
          'body.rtl &': {
            fontFamily: [
              'Noto Sans Arabic',
              'Noto Sans Hebrew', 
              'Amiri',
              'Frank Ruhl Libre',
              'system-ui',
              'sans-serif',
            ].join(','),
          },
          // Hebrew-specific styling
          '&:lang(he)': {
            fontFamily: [
              'Frank Ruhl Libre',
              'Noto Sans Hebrew',
              'system-ui',
              'sans-serif',
            ].join(','),
          },
          // Arabic-specific styling
          '&:lang(ar)': {
            fontFamily: [
              'Amiri',
              'Noto Sans Arabic',
              'system-ui',
              'sans-serif',
            ].join(','),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '1rem',
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255,255,255,0.24)',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
          '& .MuiInputBase-input': {
            padding: '14px 16px', // Comfortable touch targets
            '@media (max-width:600px)': {
              padding: '16px 18px',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px', // Larger touch targets
          minHeight: 44, // Apple/Google recommended minimum
          fontSize: '1rem',
          fontWeight: 500,
          '@media (max-width:600px)': {
            padding: '14px 28px', // Even larger on mobile
            minHeight: 48,
          },
          // RTL language-specific fonts
          'body.rtl &': {
            fontFamily: [
              'Noto Sans Arabic',
              'Noto Sans Hebrew',
              'Amiri',
              'Frank Ruhl Libre',
              'system-ui',
              'sans-serif',
            ].join(','),
          },
        },
        sizeSmall: {
          padding: '8px 16px',
          minHeight: 36,
          fontSize: '0.875rem',
          '@media (max-width:600px)': {
            padding: '10px 20px',
            minHeight: 40,
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          minHeight: 52,
          fontSize: '1.125rem',
          '@media (max-width:600px)': {
            padding: '18px 36px',
            minHeight: 56,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // More modern than default 4px
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', // Subtle depth
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.875rem',
          fontWeight: 500,
          height: 'auto',
          padding: '6px 12px',
          '& .MuiChip-label': {
            padding: 0,
          },
        },
        sizeSmall: {
          fontSize: '0.75rem',
          padding: '4px 8px',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.04)',
          },
        },
      },
    },
  },
  spacing: 8, // 8px base unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 8, // More modern default
  },
});

// Apply responsive font sizing
export const noctuaTheme = responsiveFontSizes(baseTheme, {
  breakpoints: ['sm', 'md', 'lg'],
  factor: 2, // Less aggressive scaling
});

export default noctuaTheme; 