import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Fade, useTheme } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface OrionOwlProps {
  size?: number;
  mood?: 'observing' | 'thinking' | 'excited' | 'listening' | 'wise' | 'celebrating';
  showBubble?: boolean;
  bubbleText?: string;
  animate?: boolean;
  interactive?: boolean;
  glowIntensity?: 'subtle' | 'medium' | 'bright';
  onOwlClick?: () => void;
}

// Keyframe animations defined outside component for better performance
const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  }
`;

const twinkleAnimation = keyframes`
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const SpeechBubble = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(30, 30, 50, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
  maxWidth: 220,
  zIndex: 10,
  transform: 'translateX(-50%)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    borderWidth: '8px 8px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(30, 30, 50, 0.95) transparent transparent'
      : 'rgba(255, 255, 255, 0.95) transparent transparent',
  },
  
  // Responsive positioning
  [theme.breakpoints.down('sm')]: {
    maxWidth: 180,
    padding: theme.spacing(1, 1.5),
  },
}));

const OwlContainer = styled(Box, {
  shouldForwardProp: (prop) => !['animate', 'interactive', 'glowIntensity'].includes(prop as string),
})<{ animate: boolean; interactive: boolean; glowIntensity: 'subtle' | 'medium' | 'bright' }>(
  ({ theme, animate, interactive, glowIntensity }) => ({
    position: 'relative',
    cursor: interactive ? 'pointer' : 'default',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'center bottom',
    
    ...(animate && {
      animation: `${floatAnimation} 4s ease-in-out infinite`,
    }),
    
    ...(interactive && {
      '&:hover': {
        transform: 'scale(1.05) translateY(-2px)',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
    
    // Glow effects based on intensity
    ...(glowIntensity === 'subtle' && {
      filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.2))',
    }),
    ...(glowIntensity === 'medium' && {
      filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))',
      animation: animate ? `${floatAnimation} 4s ease-in-out infinite, ${pulseGlow} 3s ease-in-out infinite` : `${pulseGlow} 3s ease-in-out infinite`,
    }),
    ...(glowIntensity === 'bright' && {
      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
      animation: animate ? `${floatAnimation} 4s ease-in-out infinite, ${pulseGlow} 2s ease-in-out infinite` : `${pulseGlow} 2s ease-in-out infinite`,
    }),
  })
);

const MoodIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: -8,
  right: -8,
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${theme.palette.primary.main}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  boxShadow: theme.shadows[2],
  animation: `${twinkleAnimation} 2s ease-in-out infinite`,
}));

const OwlImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'filter 0.3s ease',
  
  // Add a subtle filter for dark mode
  ...(theme.palette.mode === 'dark' && {
    filter: 'brightness(0.9) contrast(1.1)',
  }),
}));

export const OrionOwl: React.FC<OrionOwlProps> = ({
  size = 100,
  mood = 'observing',
  showBubble = false,
  bubbleText = '',
  animate = true,
  interactive = false,
  glowIntensity = 'subtle',
  onOwlClick,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sophisticated mood system that fits the astronomical theme
  const moodConfig = {
    observing: {
      icon: '🔭',
      color: theme.palette.primary.main,
      description: 'Observing the patterns',
    },
    thinking: {
      icon: '💭',
      color: theme.palette.secondary.main,
      description: 'Deep in thought',
    },
    excited: {
      icon: '✨',
      color: theme.palette.warning.main,
      description: 'Discovered something amazing',
    },
    listening: {
      icon: '👂',
      color: theme.palette.info.main,
      description: 'Listening carefully',
    },
    wise: {
      icon: '🦉',
      color: theme.palette.success.main,
      description: 'Sharing wisdom',
    },
    celebrating: {
      icon: '🌟',
      color: theme.palette.error.main,
      description: 'Celebrating your progress',
    },
  };

  const currentMood = moodConfig[mood];

  const handleClick = () => {
    if (interactive && onOwlClick) {
      onOwlClick();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Fallback SVG for when image fails to load
  const FallbackOwl = () => (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="40" fill={theme.palette.primary.main} opacity="0.2" />
      <circle cx="40" cy="40" r="8" fill={theme.palette.text.primary} />
      <circle cx="60" cy="40" r="8" fill={theme.palette.text.primary} />
      <circle cx="38" cy="38" r="3" fill={theme.palette.background.paper} />
      <circle cx="58" cy="38" r="3" fill={theme.palette.background.paper} />
      <path d="M45 55 Q50 60 55 55" stroke={theme.palette.text.primary} strokeWidth="2" fill="none" />
      <text x="50" y="75" textAnchor="middle" fontSize="8" fill={theme.palette.text.secondary}>
        Orion
      </text>
    </svg>
  );

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      role="img"
      aria-label={`Orion the Owl - ${currentMood.description}`}
    >
      {/* Speech Bubble */}
      <Fade in={showBubble && !!bubbleText} timeout={300}>
        <SpeechBubble
          sx={{
            bottom: size + 20,
            left: '50%',
            minWidth: Math.max(size * 1.2, 120),
            display: showBubble && bubbleText ? 'block' : 'none',
          }}
          elevation={3}
        >
          <Typography 
            variant="body2" 
            align="center"
            sx={{ 
              lineHeight: 1.4,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            {bubbleText}
          </Typography>
        </SpeechBubble>
      </Fade>

      {/* Owl Container */}
      <OwlContainer
        animate={animate}
        interactive={interactive}
        glowIntensity={glowIntensity}
        onClick={handleClick}
        sx={{
          width: size,
          height: size,
        }}
      >
        {/* Owl Image or Fallback */}
        {!imageError ? (
          <OwlImage
            src="/noctua-mascot.svg"
            alt="Orion the Owl"
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
        ) : (
          <FallbackOwl />
        )}

        {/* Mood Indicator */}
        <MoodIndicator
          sx={{
            display: mood ? 'flex' : 'none',
            borderColor: currentMood.color,
            backgroundColor: theme.palette.background.paper,
          }}
          title={currentMood.description}
        >
          <span role="img" aria-label={currentMood.description}>
            {currentMood.icon}
          </span>
        </MoodIndicator>
      </OwlContainer>
    </Box>
  );
}; 