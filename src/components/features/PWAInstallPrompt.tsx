import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, IconButton, Snackbar } from '@mui/material';
import { Close, GetApp, Smartphone } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store dismissal to avoid showing again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  const recentlyDismissed = dismissedTime && 
    Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000; // 7 days

  if (isInstalled || !showInstallPrompt || recentlyDismissed) {
    return null;
  }

  return (
    <Snackbar
      open={showInstallPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ 
        '& .MuiSnackbarContent-root': { 
          backgroundColor: 'transparent',
          boxShadow: 'none',
          padding: 0
        }
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 400,
          background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Smartphone color="primary" />
              <Typography variant="h6" color="white">
                {t('pwa.install.title', 'Install Noctua Forest')}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleDismiss} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" mb={3}>
            {t('pwa.install.description', 'Get the full experience with offline access, faster loading, and native app features.')}
          </Typography>
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={handleInstallClick}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)'
                }
              }}
            >
              {t('pwa.install.button', 'Install App')}
            </Button>
            <Button
              variant="text"
              onClick={handleDismiss}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('pwa.install.later', 'Maybe Later')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Snackbar>
  );
};

export default PWAInstallPrompt; 