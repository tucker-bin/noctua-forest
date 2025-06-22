import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PWAInstallPrompt from './PWAInstallPrompt';
import PushNotifications from './PushNotifications';
import ShareButton from './ShareButton';
import AccessibilityEnhancements from './AccessibilityEnhancements';
import OfflineIndicator from './OfflineIndicator';

const ProductionLaunchSuite: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      {/* Always-visible components */}
      <OfflineIndicator />
      <PWAInstallPrompt />

      {/* Production Features Dashboard */}
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
          {t('production.title', 'Production Features')}
        </Typography>

        <Grid container spacing={3}>
          {/* PWA Features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.pwa.title', 'Progressive Web App')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="✅ Offline Support" size="small" color="success" />
                <Chip label="✅ App Install" size="small" color="success" />
                <Chip label="✅ Service Worker" size="small" color="success" />
                <Chip label="✅ Web Manifest" size="small" color="success" />
              </Box>
            </Box>
          </Grid>

          {/* User Engagement */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.engagement.title', 'User Engagement')}
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <PushNotifications />
                <ShareButton />
              </Box>
            </Box>
          </Grid>

          {/* Accessibility */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.accessibility.title', 'Accessibility')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="✅ WCAG 2.1 AA" size="small" color="success" />
                <Chip label="✅ Screen Reader" size="small" color="success" />
                <Chip label="✅ Keyboard Nav" size="small" color="success" />
                <Chip label="✅ High Contrast" size="small" color="success" />
              </Box>
              <AccessibilityEnhancements />
            </Box>
          </Grid>

          {/* Internationalization */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.i18n.title', 'Internationalization')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="✅ 14 Languages" size="small" color="success" />
                <Chip label="✅ RTL Support" size="small" color="success" />
                <Chip label="✅ Cultural Context" size="small" color="success" />
                <Chip label="✅ Auto-detect" size="small" color="success" />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {t('production.i18n.coverage', 'Covers 4+ billion speakers worldwide')}
              </Typography>
            </Box>
          </Grid>

          {/* Performance */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.performance.title', 'Performance')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="✅ Web Vitals" size="small" color="success" />
                <Chip label="✅ Caching" size="small" color="success" />
                <Chip label="✅ Code Splitting" size="small" color="success" />
                <Chip label="✅ Font Preload" size="small" color="success" />
              </Box>
            </Box>
          </Grid>

          {/* Security & Privacy */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('production.security.title', 'Security & Privacy')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="✅ Firebase Auth" size="small" color="success" />
                <Chip label="✅ HTTPS Only" size="small" color="success" />
                <Chip label="✅ Data Encryption" size="small" color="success" />
                <Chip label="⚠️ GDPR Compliance" size="small" color="warning" />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Production Readiness Status */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#10b981', mb: 1 }}>
            {t('production.status.title', 'Production Readiness: 85%')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {t('production.status.description', 
              'Core features implemented. Remaining: API keys, final testing, deployment configuration.'
            )}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductionLaunchSuite; 