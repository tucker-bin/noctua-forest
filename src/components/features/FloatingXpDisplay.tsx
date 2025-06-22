import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const floatUp = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px);
  }
`;

interface FloatingXpDisplayProps {
  xp: number;
  bonusType?: string;
  trigger: number; // A number that changes to trigger the animation
}

export const FloatingXpDisplay: React.FC<FloatingXpDisplayProps> = ({ xp, bonusType, trigger }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500); // Animation duration + fade time
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible || xp === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: `${floatUp} 1.5s ease-out forwards`,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          color: 'secondary.main',
          textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        +{xp} XP
      </Typography>
      {bonusType && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {bonusType}
        </Typography>
      )}
    </Box>
  );
}; 