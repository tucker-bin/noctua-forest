import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import TelescopeIcon from '@mui/icons-material/Visibility';
import GroupsIcon from '@mui/icons-material/Groups';
import ExploreIcon from '@mui/icons-material/Explore';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { log } from '../../utils/logger';

const navigationItems = [
  { path: '/observatory', label: 'nav.observatory', icon: <TelescopeIcon /> },
  { path: '/scriptorium', label: 'nav.scriptorium', icon: <GroupsIcon /> },
  { path: '/lessons', label: 'nav.journey', icon: <ExploreIcon /> },
  { path: '/achievements', label: 'nav.achievements', icon: <EmojiEventsIcon /> },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigate = (path: string) => {
    log.userAction('Header menu navigation', { 
      path, 
      menuItem: navigationItems.find(item => item.path === path)?.label,
      userId: currentUser?.uid 
    });
    
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      log.userAction('User sign out initiated', { userId: currentUser?.uid });
      
      await logout();
      handleUserMenuClose();
      navigate('/');
      
      log.info('User signed out successfully');
    } catch (error) {
      log.error('Sign out failed', {
        userId: currentUser?.uid,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
    }
  };

  const renderNavItems = () => (
    <>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          sx={{
            color: location.pathname === item.path ? theme.palette.forest.primary : 'text.primary',
            mx: 1,
            '&:hover': {
              color: theme.palette.forest.primary,
              background: `${theme.palette.forest.primary}20`,
            },
          }}
          startIcon={item.icon}
        >
          {t(item.label)}
        </Button>
      ))}
    </>
  );

  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: 240,
          bgcolor: theme.palette.forest.card,
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <List>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: `${theme.palette.forest.primary}20`,
                '&:hover': {
                  bgcolor: `${theme.palette.forest.primary}30`,
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.forest.primary : 'text.primary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={t(item.label)}
              sx={{ color: location.pathname === item.path ? theme.palette.forest.primary : 'text.primary' }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );

  const handleLogoClick = () => {
    log.userAction('Logo clicked', { currentPath: location.pathname });
    navigate('/');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'transparent',
        backgroundImage: `linear-gradient(rgba(45, 55, 72, 0.8), rgba(45, 55, 72, 0.8))`,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.palette.forest.border}30`,
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          onClick={handleLogoClick}
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontFamily: '"Noto Sans", sans-serif',
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Noctua Forest
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderNavItems()}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <LanguageSwitcher />
          
          {!currentUser && !isMobile && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/signin')}
              sx={{
                ml: 2,
                borderColor: theme.palette.forest.blue,
                color: theme.palette.forest.blue,
                '&:hover': {
                  borderColor: theme.palette.forest.blue,
                  backgroundColor: `${theme.palette.forest.blue}20`,
                },
              }}
            >
              {t('nav.sign_in', 'Sign In')}
            </Button>
          )}
          
          <IconButton
            onClick={handleUserMenuClick}
            sx={{
              ml: 1,
              color: userMenuAnchor ? theme.palette.forest.primary : 'text.primary',
            }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: {
              bgcolor: theme.palette.forest.card,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.forest.border}50`,
              mt: 1.5,
            },
          }}
        >
          {currentUser ? (
            <>
              <MenuItem onClick={() => { handleNavigate('/profile'); handleUserMenuClose(); }}>
                {t('nav.profile')}
              </MenuItem>
              <Divider sx={{ borderColor: `${theme.palette.forest.border}30` }} />
              <MenuItem onClick={handleSignOut}>{t('nav.sign_out')}</MenuItem>
            </>
          ) : (
            <MenuItem onClick={() => { handleNavigate('/signin'); handleUserMenuClose(); }}>
              {t('nav.sign_in')}
            </MenuItem>
          )}
        </Menu>

        {renderMobileDrawer()}
      </Toolbar>
    </AppBar>
  );
}; 