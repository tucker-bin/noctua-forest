import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Description as DocumentIcon,
  FolderOpen as FolderIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { noctuaColors, customStyles } from '../theme/noctuaTheme';

interface ObservatoryProps {
  children: React.ReactNode;
  controlPanel?: React.ReactNode;
  projects?: Array<{ id: string; name: string; date: Date }>;
  currentProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  onNewProject?: () => void;
}

const DRAWER_WIDTH = 280;

const Observatory: React.FC<ObservatoryProps> = ({
  children,
  controlPanel,
  projects = [],
  currentProjectId,
  onProjectSelect,
  onNewProject,
}) => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Auto-hide panels when typing
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.getAttribute('type') === 'text')) {
        setFocusMode(true);
      }
    };

    const handleBlur = () => {
      setFocusMode(false);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const drawerStyles = {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: DRAWER_WIDTH,
      boxSizing: 'border-box',
      backgroundColor: noctuaColors.midnightBlue,
      borderRight: `1px solid ${noctuaColors.charcoal}`,
      transition: 'all 0.3s ease-in-out',
      opacity: focusMode ? 0.8 : 1,
    },
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Panel - Project Nest */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={leftDrawerOpen}
        sx={drawerStyles}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${noctuaColors.charcoal}`,
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: '"Lora", serif' }}>
            Project Nest
          </Typography>
          <IconButton onClick={() => setLeftDrawerOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {/* New Project Button */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={onNewProject}
              sx={{
                mb: 1,
                mx: 1,
                borderRadius: 1,
                backgroundColor: alpha(noctuaColors.vibrantGold, 0.1),
                '&:hover': {
                  backgroundColor: alpha(noctuaColors.vibrantGold, 0.2),
                },
              }}
            >
              <ListItemIcon>
                <AddIcon sx={{ color: noctuaColors.vibrantGold }} />
              </ListItemIcon>
              <ListItemText 
                primary="New Observation" 
                primaryTypographyProps={{
                  fontWeight: 500,
                  color: noctuaColors.vibrantGold,
                }}
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          {/* Recent Projects */}
          <ListItemButton onClick={() => setRecentOpen(!recentOpen)}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Recent" />
            {recentOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={recentOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {projects.map((project) => (
                <ListItemButton
                  key={project.id}
                  selected={currentProjectId === project.id}
                  onClick={() => onProjectSelect?.(project.id)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: alpha(noctuaColors.brightSkyBlue, 0.1),
                      borderLeft: `3px solid ${noctuaColors.brightSkyBlue}`,
                      '&:hover': {
                        backgroundColor: alpha(noctuaColors.brightSkyBlue, 0.2),
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <DocumentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={project.name}
                    secondary={project.date.toLocaleDateString()}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      </Drawer>

      {/* Center Panel - Main Observatory */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: noctuaColors.deepIndigo,
          transition: 'all 0.3s ease-in-out',
          ml: leftDrawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
          mr: rightDrawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
          ...customStyles.starfield,
        }}
      >
        {/* Toggle buttons when panels are hidden */}
        {!leftDrawerOpen && (
          <IconButton
            onClick={() => setLeftDrawerOpen(true)}
            sx={{
              position: 'fixed',
              left: 8,
              top: 8,
              zIndex: 1200,
              backgroundColor: noctuaColors.midnightBlue,
              '&:hover': {
                backgroundColor: noctuaColors.charcoal,
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {!rightDrawerOpen && (
          <IconButton
            onClick={() => setRightDrawerOpen(true)}
            sx={{
              position: 'fixed',
              right: 8,
              top: 8,
              zIndex: 1200,
              backgroundColor: noctuaColors.midnightBlue,
              '&:hover': {
                backgroundColor: noctuaColors.charcoal,
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          {children}
        </Box>
      </Box>

      {/* Right Panel - Control Deck */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={rightDrawerOpen}
        sx={{
          ...drawerStyles,
          '& .MuiDrawer-paper': {
            ...drawerStyles['& .MuiDrawer-paper'],
            borderRight: 'none',
            borderLeft: `1px solid ${noctuaColors.charcoal}`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${noctuaColors.charcoal}`,
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: '"Lora", serif' }}>
            Control Deck
          </Typography>
          <IconButton onClick={() => setRightDrawerOpen(false)} size="small">
            <ChevronLeftIcon sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, overflow: 'auto', flexGrow: 1 }}>
          {controlPanel}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Observatory; 