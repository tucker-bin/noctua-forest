import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Slide,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import GamepadIcon from '@mui/icons-material/Gamepad';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SpeedIcon from '@mui/icons-material/Speed';
import StarIcon from '@mui/icons-material/Star';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, onDismiss }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<'not-supported' | 'installable' | 'installed' | 'dismissed'>('not-supported');

  // Check if app is already installed
  useEffect(() => {
    const checkInstallStatus = () => {
      // Check if running in standalone mode (already installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (window.navigator as any).standalone || isStandalone;
      
      setIsInstalled(isInstalled);
      
      if (isInstalled) {
        setInstallStatus('installed');
        return;
      }

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          setInstallStatus('dismissed');
          return;
        }
      }
    };

    checkInstallStatus();
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      setInstallStatus('installable');
      
      // Show prompt after user has played at least once
      const gamesPlayed = localStorage.getItem('games-played') || '0';
      if (parseInt(gamesPlayed) > 0) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallStatus('installed');
      setShowPrompt(false);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  // Trigger install prompt after user interaction
  useEffect(() => {
    if (isInstallable && !isInstalled && installStatus === 'installable') {
      const timer = setTimeout(() => {
        const interactionCount = parseInt(localStorage.getItem('user-interactions') || '0');
        if (interactionCount > 5) {
          setShowPrompt(true);
        }
      }, 10000); // Show after 10 seconds of interaction

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, installStatus]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
        setInstallStatus('installed');
        onInstall?.();
      } else {
        console.log('PWA installation dismissed');
        handleDismiss();
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setInstallStatus('dismissed');
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    onDismiss?.();
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return isMobile 
        ? 'Tap the menu (⋮) and select "Add to Home screen"'
        : 'Click the install icon in the address bar';
    } else if (userAgent.includes('firefox')) {
      return isMobile
        ? 'Tap the menu (⋮) and select "Install"'
        : 'Click the install icon in the address bar';
    } else if (userAgent.includes('safari')) {
      return 'Tap the Share button and select "Add to Home Screen"';
    } else if (userAgent.includes('edg')) {
      return isMobile
        ? 'Tap the menu (⋯) and select "Add to phone"'
        : 'Click the install icon in the address bar';
    }
    
    return 'Use your browser\'s install option';
  };

  // Don't show if not installable or already installed
  if (!showPrompt || installStatus !== 'installable') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 24,
          left: isMobile ? 16 : 24,
          right: isMobile ? 16 : 'auto',
          zIndex: 1300,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : 400
        }}
      >
        <Card
          elevation={8}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            borderRadius: 3,
            overflow: 'visible',
            position: 'relative',
            border: '2px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Floating game icon */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: theme.shadows[4]
            }}
          >
            🎮
          </Box>

          <CardContent sx={{ p: 3, pb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box flex={1}>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Install RhymeTime Games
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  Get the full gaming experience with offline play and instant access!
                </Typography>
              </Box>
              <IconButton
                onClick={handleDismiss}
                size="small"
                sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Features grid */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <OfflineBoltIcon fontSize="small" />
                <Typography variant="body2">Play offline anytime</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <NotificationsActiveIcon fontSize="small" />
                <Typography variant="body2">Daily challenge reminders</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon fontSize="small" />
                <Typography variant="body2">Faster loading & performance</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <StarIcon fontSize="small" />
                <Typography variant="body2">App-like experience</Typography>
              </Box>
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} alignItems="center">
              {deferredPrompt ? (
                <Button
                  variant="contained"
                  onClick={handleInstallClick}
                  startIcon={<InstallMobileIcon />}
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-1px)'
                    },
                    flex: 1
                  }}
                >
                  Install App
                </Button>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    To install:
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {getInstallInstructions()}
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="text"
                onClick={handleDismiss}
                sx={{ 
                  color: 'white', 
                  opacity: 0.8,
                  '&:hover': { opacity: 1 }
                }}
              >
                Later
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt; 