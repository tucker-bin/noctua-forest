import { createTheme } from '@mui/material/styles';

// Updated theme for a clean, minimalist, paper-like aesthetic
export const noctuaTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1C1C1C', // Dark, readable text
    },
    secondary: {
      main: '#4A90E2', // Clean blue for interactive elements
    },
    background: {
      default: '#FDFBF7', // Warm, paper-like off-white
      paper: '#FFFFFF',   // Contrasting white for surfaces
    },
    text: {
      primary: '#1C1C1C',
      secondary: '#5A5A5A',
    },
    error: {
      main: '#D32F2F',
    },
    success: {
      main: '#2E7D32',
    },
    warning: {
      main: '#FFC107', // Amber for highlighting
      contrastText: '#1C1C1C',
    },
    // Custom forest theme colors
    forest: {
      background: '#0A0B14',
      card: '#1A1B2E',
      border: '#16213E',
      primary: '#0E4B99',
      secondary: '#2E8B57',
      accent: '#FFD700',
      blue: '#4169E1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#1C1C1C',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        containedSecondary: {
            backgroundColor: '#4A90E2',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#357ABD',
            },
        }
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                borderRadius: 8,
            }
        }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1C1C1C',
          color: '#FFFFFF',
          fontSize: '0.875rem',
        },
        arrow: {
          color: '#1C1C1C',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
}); 