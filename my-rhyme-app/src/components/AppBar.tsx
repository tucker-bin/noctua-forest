import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface AppBarProps {
  onMenuClick: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ onMenuClick }) => {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <MuiAppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Rhyme App
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleDarkMode} aria-label="toggle dark mode">
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          {currentUser ? (
            <Button
              color="inherit"
              component={RouterLink}
              to="/account"
            >
              Account
            </Button>
          ) : (
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar; 