import React from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const Sparkle: React.FC<{ color?: string; size?: number }> = ({ color = '#F7B538', size = 24 }) => (
  <AutoAwesomeIcon style={{ color, fontSize: size }} />
);

export { Sparkle }; 