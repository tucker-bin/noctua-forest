import React from 'react';
import { Switch, styled, keyframes } from '@mui/material';
import type { SwitchProps } from '@mui/material';
import { noctuaColors } from '../theme/noctuaTheme';

// Keyframe for glowing effect
const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px rgba(247, 181, 56, 0.5);
  }
  50% { 
    box-shadow: 0 0 20px rgba(247, 181, 56, 0.8);
  }
`;

interface LunarSwitchProps extends SwitchProps {
  highlightColor?: string;
}

const LunarSwitch = styled(({ highlightColor, ...props }: LunarSwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme, highlightColor }) => ({
  width: 56,
  height: 28,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 3,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(28px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: highlightColor || noctuaColors.vibrantGold,
        opacity: 1,
        border: 0,
        animation: `${glow} 2s ease-in-out infinite`,
      },
      '& .MuiSwitch-thumb': {
        '&:before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
          borderRadius: '50%',
          backgroundColor: '#fff',
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          width: '60%',
          height: '60%',
          right: '-20%',
          top: '20%',
          borderRadius: '50%',
          backgroundColor: highlightColor || noctuaColors.vibrantGold,
          opacity: 0.8,
        },
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: noctuaColors.brightSkyBlue,
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: noctuaColors.mutedSilver,
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
    position: 'relative',
    backgroundColor: noctuaColors.moonbeam,
    transition: theme.transitions.create(['transform', 'background-color'], {
      duration: 300,
    }),
    '&:before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      borderRadius: '50%',
      backgroundColor: noctuaColors.moonbeam,
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      width: '70%',
      height: '70%',
      left: '15%',
      top: '15%',
      borderRadius: '50%',
      backgroundColor: noctuaColors.charcoal,
      transition: theme.transitions.create(['transform', 'opacity'], {
        duration: 300,
      }),
    },
  },
  '& .MuiSwitch-track': {
    borderRadius: 28 / 2,
    backgroundColor: noctuaColors.charcoal,
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'box-shadow'], {
      duration: 300,
    }),
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      width: '8px',
      height: '8px',
      left: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderRadius: '50%',
      backgroundColor: noctuaColors.mutedSilver,
      opacity: 0.5,
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      width: '6px',
      height: '6px',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderRadius: '50%',
      backgroundColor: noctuaColors.mutedSilver,
      opacity: 0.3,
    },
  },
}));

export default LunarSwitch; 