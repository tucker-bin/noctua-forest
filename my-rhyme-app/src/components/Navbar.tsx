import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OrionOwl from './OrionOwl';

interface NavbarProps {
  onDrawerToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser || currentUser.isAnonymous) {
        setIsAdmin(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch('/api/admin/check', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } else {
          // Silently fail for non-200 responses
          setIsAdmin(false);
        }
      } catch (err) {
        // Silently fail - admin check is not critical for app functionality
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={onDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <OrionOwl size={24} animate={false} />
          Noctua Forest
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/forest">
            The Forest
          </Button>
          <Button color="inherit" component={RouterLink} to="/observatory">
            Observatory
          </Button>
          <Button color="inherit" component={RouterLink} to="/credit">
            Credit
          </Button>
          <Button color="inherit" component={RouterLink} to="/usage">
            Usage
          </Button>
          
          {currentUser && !currentUser.isAnonymous ? (
            <>
              <Tooltip title="Account">
                <IconButton color="inherit" component={RouterLink} to="/account">
                  <AccountCircle />
                </IconButton>
              </Tooltip>
              {isAdmin && (
                <Tooltip title="Admin Dashboard">
                  <IconButton color="inherit" component={RouterLink} to="/admin">
                    <AdminIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/account')}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 