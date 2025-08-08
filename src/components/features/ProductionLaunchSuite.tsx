import React from 'react';
import { Box, Grid, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PushNotifications from './PushNotifications';
// REMOVED: import ShareButton from './ShareButton';

const ProductionLaunchSuite: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%)',
      p: 4 
    }}>
      <Typography variant="h3" align="center" sx={{ mb: 6, color: 'white', fontWeight: 700 }}>
        {t('production.title', 'Noctua Forest - Production Ready')}
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

        {/* Corpus Analytics */}
        <Grid item xs={12} md={6}>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              {t('production.corpus.title', 'Corpus Analytics')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <PushNotifications />
              {/* REMOVED: ShareButton - Focusing on corpus economics */}
            </Box>
          </Box>
        </Grid>

        {/* Data Analytics */}
        <Grid item xs={12}>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Linguistic Data Collection
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip label="✅ Observatory Corpus" size="small" color="success" />
              <Chip label="✅ Pattern Database" size="small" color="success" />
              <Chip label="✅ Analysis API" size="small" color="success" />
              <Chip label="✅ Research Licensing" size="small" color="success" />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductionLaunchSuite; 