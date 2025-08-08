import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    difficulty: {
      easy: string;
      medium: string;
      hard: string;
      expert: string;
    };
    forest: {
      background: string;
      card: string;
      border: string;
      primary: string;
      secondary: string;
      accent: string;
      blue: string;
    };
  }

  interface PaletteOptions {
    difficulty?: {
      easy?: string;
      medium?: string;
      hard?: string;
      expert?: string;
    };
    forest?: {
      background?: string;
      card?: string;
      border?: string;
      primary?: string;
      secondary?: string;
      accent?: string;
      blue?: string;
    };
  }
} 