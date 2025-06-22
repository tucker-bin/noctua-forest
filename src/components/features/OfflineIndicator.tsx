import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Box, Typography, Button } from '@mui/material';
import { WifiOff, Wifi, CloudOff, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setShowOnlineMessage(true);
      
      // Hide online message after 3 seconds
      setTimeout(() => setShowOnlineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if starting offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      // Force a cache refresh
      window.location.reload();
    }
  };

  const handleDismissOffline = () => {
    setShowOfflineMessage(false);
  };

  return (
    <>
      {/* Offline Banner */}
      <Snackbar
        open={showOfflineMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            padding: 0
          }
        }}
      >
        <Alert
          severity="warning"
          icon={<WifiOff />}
          sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            minWidth: 350,
            '& .MuiAlert-icon': { color: 'white' }
          }}
          action={
            <Box display="flex" gap={1}>
              <Button
                size="small"
                onClick={handleRetry}
                sx={{ color: 'white', minWidth: 'auto' }}
              >
                <Refresh fontSize="small" />
              </Button>
              <Button
                size="small"
                onClick={handleDismissOffline}
                sx={{ color: 'white' }}
              >
                ×
              </Button>
            </Box>
          }
        >
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {t('offline.title', 'You\'re offline')}
            </Typography>
            <Typography variant="caption">
              {t('offline.description', 'Some features may be limited. Your progress is saved locally.')}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Back Online Message */}
      <Snackbar
        open={showOnlineMessage}
        autoHideDuration={3000}
        onClose={() => setShowOnlineMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<Wifi />}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Typography variant="body2">
            {t('online.message', 'Back online! Syncing your progress...')}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Status Indicator in Corner (subtle) */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <CloudOff fontSize="small" />
          <Typography variant="caption">
            {t('offline.indicator', 'Offline')}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default OfflineIndicator; 