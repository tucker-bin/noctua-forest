import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

/**
 * A minimal placeholder header.
 * The complex navigation and user menus have been removed to align with the
 * new, simplified "game-first" user experience.
 */
export const Header: React.FC = () => {
  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: 'background.paper',
        boxShadow: 'none',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: 'primary.main'
          }}
        >
          Noctua Games
        </Typography>
      </Toolbar>
    </AppBar>
  );
}; 