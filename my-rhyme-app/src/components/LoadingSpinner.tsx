import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  minHeight: '200px',
}));

const AnimatedProgress = styled(CircularProgress)(({ theme }) => ({
  animation: `${pulse} 2s ease-in-out infinite`,
  color: theme.palette.primary.main,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.text.secondary,
  textAlign: 'center',
  fontWeight: 500,
}));

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  variant?: 'standard' | 'minimal' | 'detailed';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 40,
  fullScreen = false,
  variant = 'standard'
}) => {
  const containerProps = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9999,
    minHeight: '100vh',
  } : {};

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <LoadingContainer sx={containerProps}>
        <AnimatedProgress size={size} thickness={4} />
        <LoadingText variant="body1">
          {message}
        </LoadingText>
        {variant === 'detailed' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we process your request...
          </Typography>
        )}
      </LoadingContainer>
    </Fade>
  );
};

export default LoadingSpinner; 