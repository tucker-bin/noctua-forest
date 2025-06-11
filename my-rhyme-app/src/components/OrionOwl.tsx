import React, { useEffect, useState } from 'react';
import { Box, useTheme, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import orionSvg from '../assets/orion.svg';
import { noctuaColors } from '../theme/noctuaTheme';

interface OrionOwlProps {
  size?: number;
  animate?: boolean;
  mood?: 'happy' | 'thinking' | 'excited' | 'listening';
  showBubble?: boolean;
  bubbleText?: string;
  isListening?: boolean;
}

// Animation keyframes
const blink = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const SpeechBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -60,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: theme.palette.background.paper,
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
        padding: '12px 16px',
        minWidth: 200,
        boxShadow: `0 0 20px ${theme.palette.primary.main}20`,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `10px solid ${theme.palette.primary.main}`,
        }
      }}
    >
      <Typography variant="body2" color="text.primary">
        {children}
      </Typography>
    </Box>
  );
};

export const OrionOwl: React.FC<OrionOwlProps> = ({ 
  size = 120, 
  animate = true, 
  mood = 'happy',
  showBubble = false,
  bubbleText = '',
  isListening = false
}) => {
  const theme = useTheme();
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Load and modify SVG to apply theme colors
    fetch(orionSvg)
      .then(response => response.text())
      .then(text => {
        // Replace black fill with theme color
        const modifiedSvg = text.replace(/fill="#000000"/g, `fill="${theme.palette.primary.main}"`);
        setSvgContent(modifiedSvg);
      });
  }, [theme]);

  const eyeColor = {
    happy: noctuaColors.wisdom,
    thinking: theme.palette.secondary.main,
    excited: noctuaColors.creativity,
    listening: noctuaColors.rhythm
  }[mood];

  const animationClass = animate ? {
    animation: mood === 'excited' ? `${bounce} 0.5s ease-in-out infinite` :
               isListening ? `${pulse} 1.5s ease-in-out infinite` :
               `${floatAnimation} 3s ease-in-out infinite`
  } : {};

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Box
        sx={{
          width: size,
          height: size,
          position: 'relative',
          filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`,
          ...animationClass
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      
      {/* Glowing eyes overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: size * 0.2,
          pointerEvents: 'none'
        }}
      >
        <Box
          sx={{
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: '50%',
            backgroundColor: eyeColor,
            boxShadow: `0 0 ${size * 0.1}px ${eyeColor}`,
            animation: isListening ? `${pulse} 0.5s ease-in-out infinite` : 
                      animate ? `${blink} 5s ease-in-out infinite` : 'none'
          }}
        />
        <Box
          sx={{
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: '50%',
            backgroundColor: eyeColor,
            boxShadow: `0 0 ${size * 0.1}px ${eyeColor}`,
            animation: isListening ? `${pulse} 0.5s ease-in-out infinite` : 
                      animate ? `${blink} 5s ease-in-out infinite 0.1s` : 'none'
          }}
        />
      </Box>

      {showBubble && bubbleText && (
        <SpeechBubble>{bubbleText}</SpeechBubble>
      )}
    </Box>
  );
};

export default OrionOwl; 