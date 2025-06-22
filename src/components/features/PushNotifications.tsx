import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Alert } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { log } from '../../utils/logger';

const PushNotifications: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check for existing subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      log.warn('This browser does not support notifications');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      log.warn('Push messaging is not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        setShowPermissionDialog(false);
      }
    } catch (error) {
      log.error('Error requesting notification permission:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from environment or backend
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          subscription,
          userId: currentUser?.uid,
          preferences: {
            lessonReminders: true,
            weeklyProgress: true,
            newFeatures: false
          }
        })
      });

      setSubscription(subscription);
    } catch (error) {
      log.error('Error subscribing to push notifications:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    }
  };

  const unsubscribeFromPush = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        
        // Remove subscription from backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser?.getIdToken()}`
          },
          body: JSON.stringify({
            userId: currentUser?.uid
          })
        });

        setSubscription(null);
      } catch (error) {
        log.error('Error unsubscribing from push notifications:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      }
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification(t('notifications.test.title', 'Noctua Forest'), {
        body: t('notifications.test.body', 'Your pattern observation journey continues!'),
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: 'test-notification',
        requireInteraction: false
      });
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <>
      <Box display="flex" alignItems="center" gap={2}>
        {permission === 'granted' && subscription ? (
          <>
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={sendTestNotification}
              size="small"
            >
              {t('notifications.test', 'Test')}
            </Button>
            <Button
              variant="text"
              startIcon={<NotificationsOff />}
              onClick={unsubscribeFromPush}
              size="small"
              color="error"
            >
              {t('notifications.disable', 'Disable')}
            </Button>
          </>
        ) : (
          <Button
            variant="outlined"
            startIcon={<Notifications />}
            onClick={() => setShowPermissionDialog(true)}
            size="small"
          >
            {t('notifications.enable', 'Enable Notifications')}
          </Button>
        )}
      </Box>

      <Dialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Notifications color="primary" />
            {t('notifications.permission.title', 'Enable Notifications')}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
            {t('notifications.permission.description', 
              'Stay engaged with your pattern observation journey! We\'ll send you:'
            )}
          </Typography>
          
          <Box component="ul" sx={{ color: 'rgba(255, 255, 255, 0.8)', pl: 2 }}>
            <li>{t('notifications.benefits.reminders', 'Gentle reminders for daily practice')}</li>
            <li>{t('notifications.benefits.progress', 'Weekly progress updates')}</li>
            <li>{t('notifications.benefits.insights', 'New pattern insights and discoveries')}</li>
            <li>{t('notifications.benefits.community', 'Community highlights and achievements')}</li>
          </Box>

          {permission === 'denied' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('notifications.permission.blocked', 
                'Notifications are blocked. Please enable them in your browser settings.'
              )}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setShowPermissionDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {t('notifications.permission.later', 'Maybe Later')}
          </Button>
          <Button
            onClick={requestPermission}
            variant="contained"
            disabled={permission === 'denied'}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)'
              }
            }}
          >
            {t('notifications.permission.enable', 'Enable Notifications')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PushNotifications; 