import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  AccountCircle as AccountIcon,
  CreditCard as CreditCardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { text: 'Observatory', icon: <AnalyticsIcon />, path: '/observatory' },
  { text: 'Account', icon: <AccountIcon />, path: '/account' },
  { text: 'Credit', icon: <CreditCardIcon />, path: '/credit' },
  { text: 'Usage', icon: <AnalyticsIcon />, path: '/usage' },
];

const Drawer: React.FC<DrawerProps> = ({ open, onClose }) => {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (authCtx) {
      try {
        await authCtx.logout();
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  return (
    <MuiDrawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          mt: { xs: 8, sm: 9 },
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={RouterLink}
              to={item.path}
              onClick={() => {
                if (isMobile) onClose();
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          {currentUser && !currentUser.isAnonymous && (
            <ListItem button onClick={handleSignOut}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItem>
          )}
        </List>
      </Box>
    </MuiDrawer>
  );
};

export default Drawer; 