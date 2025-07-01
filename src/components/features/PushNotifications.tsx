import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  Stack,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GamepadIcon from '@mui/icons-material/Gamepad';
import { useAuth } from '../../contexts/AuthContext';
import { useExperience } from '../../contexts/ExperienceContext';

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  time?: string;
  category: 'daily' | 'streak' | 'social' | 'achievements';
}

interface PushNotificationsProps {
  onPermissionChange?: (granted: boolean) => void;
}

const PushNotifications: React.FC<PushNotificationsProps> = ({ onPermissionChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const { level } = useExperience();

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'daily-challenge',
      name: 'Daily Challenge',
      description: 'Reminder to play today\'s puzzle',
      icon: <GamepadIcon />,
      enabled: true,
      time: '09:00',
      category: 'daily'
    },
    {
      id: 'streak-reminder',
      name: 'Streak Protection',
      description: 'Don\'t lose your winning streak!',
      icon: <WhatshotIcon />,
      enabled: true,
      time: '20:00',
      category: 'streak'
    },
    {
      id: 'leaderboard-update',
      name: 'Leaderboard Changes',
      description: 'When your ranking changes',
      icon: <TrendingUpIcon />,
      enabled: false,
      category: 'social'
    },
    {
      id: 'achievements',
      name: 'New Achievements',
      description: 'When you unlock new milestones',
      icon: <EmojiEventsIcon />,
      enabled: true,
      category: 'achievements'
    },
    {
      id: 'comeback',
      name: 'Come Back Reminder',
      description: 'We miss you! (after 3 days away)',
      icon: <ScheduleIcon />,
      enabled: true,
      time: '18:00',
      category: 'daily'
    }
  ]);

  // Check notification support and permission
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Get service worker registration
  useEffect(() => {
    if (isSupported) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
      });
    }
  }, [isSupported]);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings(prev => 
          prev.map(setting => ({
            ...setting,
            enabled: parsed[setting.id] !== undefined ? parsed[setting.id] : setting.enabled
          }))
        );
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange?.(result === 'granted');
      
      if (result === 'granted') {
        await setupNotifications();
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, onPermissionChange]);

  const setupNotifications = useCallback(async () => {
    if (!registration || permission !== 'granted') return;

    try {
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          subscription,
          settings: notificationSettings.reduce((acc, setting) => ({
            ...acc,
            [setting.id]: setting.enabled
          }), {})
        })
      });

      if (!response.ok) {
        throw new Error('Failed to setup notifications');
      }

      console.log('Push notifications setup successfully');
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }, [registration, permission, notificationSettings, currentUser]);

  const updateSetting = useCallback((settingId: string, enabled: boolean) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.id === settingId ? { ...setting, enabled } : setting
      )
    );

    // Save to localStorage
    const settings = notificationSettings.reduce((acc, setting) => ({
      ...acc,
      [setting.id]: setting.id === settingId ? enabled : setting.enabled
    }), {});
    
    localStorage.setItem('notification-settings', JSON.stringify(settings));

    // Update server if permission granted
    if (permission === 'granted') {
      setupNotifications();
    }
  }, [notificationSettings, permission, setupNotifications]);

  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') return;

    try {
      // Send test notification via service worker
      if (registration) {
        await registration.showNotification('RhymeTime Games', {
          body: 'Test notification - you\'re all set! 🎮',
          icon: '/pwa-192x192.png',
          badge: '/pwa-64x64.png',
          tag: 'test-notification',
          data: { url: '/games' }
        });
        
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [permission, registration]);

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'success', text: 'Enabled', icon: <NotificationsActiveIcon /> };
      case 'denied':
        return { color: 'error', text: 'Blocked', icon: <NotificationsOffIcon /> };
      default:
        return { color: 'warning', text: 'Not Set', icon: <NotificationsOffIcon /> };
    }
  };

  const getMotivationalMessage = () => {
    if (level > 10) {
      return 'Master-level player! Stay on top with notifications! 🏆';
    }
    if (level > 5) {
      return 'Stay sharp with daily challenges! 🎯';
    }
    return 'Never miss a puzzle with smart reminders! 📱';
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Push notifications are not supported in your browser. Try using Chrome, Firefox, or Safari.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getPermissionStatus();

  return (
    <Box>
      <Card>
        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                {statusInfo.icon}
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Push Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getMotivationalMessage()}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={statusInfo.text}
              color={statusInfo.color as any}
              variant={permission === 'granted' ? 'filled' : 'outlined'}
            />
          </Box>

          {/* Permission Request */}
          {permission !== 'granted' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Alert 
                severity={permission === 'denied' ? 'error' : 'info'} 
                sx={{ mb: 3 }}
                action={
                  permission !== 'denied' && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={requestPermission}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Enable
                    </Button>
                  )
                }
              >
                {permission === 'denied' 
                  ? 'Notifications are blocked. You can enable them in your browser settings.'
                  : 'Enable notifications to get daily challenges and streak reminders!'
                }
              </Alert>
            </motion.div>
          )}

          {/* Notification Settings */}
          {permission === 'granted' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Stack spacing={2}>
                {notificationSettings.map((setting, index) => (
                  <motion.div
                    key={setting.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: setting.enabled ? `${theme.palette.primary.main}08` : 'transparent',
                        border: '1px solid',
                        borderColor: setting.enabled ? `${theme.palette.primary.main}20` : theme.palette.divider,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box color={setting.enabled ? theme.palette.primary.main : theme.palette.text.secondary}>
                          {setting.icon}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: setting.enabled ? 'bold' : 'normal' }}>
                            {setting.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {setting.description}
                            {setting.time && ` • ${setting.time}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={setting.enabled}
                        onChange={(e) => updateSetting(setting.id, e.target.checked)}
                        color="primary"
                      />
                    </Box>
                  </motion.div>
                ))}
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Advanced Options */}
              <Box>
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 2 }}
                >
                  Advanced Options
                </Button>

                <Collapse in={showAdvanced}>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={sendTestNotification}
                      disabled={testNotificationSent}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {testNotificationSent ? 'Test Sent! ✓' : 'Send Test Notification'}
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                      💡 <strong>Tip:</strong> Notifications will be sent at the times you specify. 
                      Make sure your device allows notifications from your browser.
                    </Typography>
                  </Stack>
                </Collapse>
              </Box>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PushNotifications; 