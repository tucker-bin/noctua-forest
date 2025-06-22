import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Collapse,
  Link,
  Chip
} from '@mui/material';
import { log } from '../../utils/logger';
import {
  Cookie,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

const GDPR_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365;

const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: 0,
    version: GDPR_VERSION
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('noctua-cookie-consent');
    
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      const isExpired = Date.now() - parsed.timestamp > CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const isOutdated = parsed.version !== GDPR_VERSION;
      
      if (isExpired || isOutdated) {
        setShowBanner(true);
      } else {
        setConsent(parsed);
        configureServices(parsed);
      }
    } else {
      // First visit - show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, []);

  const configureServices = (consentData: CookieConsent) => {
    // Configure Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: consentData.analytics ? 'granted' : 'denied',
        ad_storage: consentData.marketing ? 'granted' : 'denied',
        personalization_storage: consentData.preferences ? 'granted' : 'denied',
        functionality_storage: 'granted', // Always granted for necessary
        security_storage: 'granted' // Always granted for necessary
      });
    }

    // Configure other services
    if (consentData.analytics) {
      enableAnalytics();
    }
    
    if (consentData.marketing) {
      enableMarketing();
    }
    
    if (consentData.preferences) {
      enablePersonalization();
    }
  };

  const enableAnalytics = () => {
    // Enable performance monitoring, user behavior analytics
    log.info('Analytics enabled');
  };

  const enableMarketing = () => {
    // Enable marketing pixels, conversion tracking
    log.info('Marketing enabled');
  };

  const enablePersonalization = () => {
    // Enable personalized content, recommendations
    log.info('Personalization enabled');
  };

  const handleConsentChange = (category: keyof CookieConsent, value: boolean) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const saveConsent = (consentData: CookieConsent) => {
    const finalConsent = {
      ...consentData,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    localStorage.setItem('noctua-cookie-consent', JSON.stringify(finalConsent));
    configureServices(finalConsent);
    setShowBanner(false);
  };

  const acceptAll = () => {
    const allConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    saveConsent(allConsent);
  };

  const acceptSelected = () => {
    saveConsent(consent);
  };

  const rejectAll = () => {
    const minimalConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    saveConsent(minimalConsent);
  };

  if (!showBanner) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px 16px 0 0',
        backdropFilter: 'blur(10px)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <Box p={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Cookie color="primary" />
          <Typography variant="h6" sx={{ color: 'white' }}>
            {t('cookies.title', 'Cookie Preferences')}
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
          {t('cookies.description', 
            'We use cookies to enhance your experience, analyze usage, and personalize content. You have full control over your preferences.'
          )}
        </Typography>

        {/* Quick Actions */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Button
            variant="contained"
            onClick={acceptAll}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)'
              }
            }}
          >
            {t('cookies.accept_all', 'Accept All')}
          </Button>
          
          <Button
            variant="outlined"
            onClick={rejectAll}
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            {t('cookies.reject_all', 'Reject All')}
          </Button>
          
          <Button
            variant="text"
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
            sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {t('cookies.customize', 'Customize')}
          </Button>
        </Box>

        {/* Detailed Options */}
        <Collapse in={showDetails}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
            <FormGroup>
              {/* Necessary Cookies */}
              <FormControlLabel
                control={
                  <Switch
                    checked={consent.necessary}
                    disabled
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                        {t('cookies.necessary.title', 'Necessary Cookies')}
                      </Typography>
                      <Chip label={t('cookies.required', 'Required')} size="small" />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t('cookies.necessary.description', 
                        'Essential for authentication, security, and basic functionality. Cannot be disabled.'
                      )}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              {/* Analytics Cookies */}
              <FormControlLabel
                control={
                  <Switch
                    checked={consent.analytics}
                    onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                      {t('cookies.analytics.title', 'Analytics Cookies')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t('cookies.analytics.description', 
                        'Help us understand app usage, identify issues, and improve performance. Includes Web Vitals and error tracking.'
                      )}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              {/* Preferences Cookies */}
              <FormControlLabel
                control={
                  <Switch
                    checked={consent.preferences}
                    onChange={(e) => handleConsentChange('preferences', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                      {t('cookies.preferences.title', 'Preference Cookies')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t('cookies.preferences.description', 
                        'Remember your language, theme, accessibility settings, and learning preferences.'
                      )}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              {/* Marketing Cookies */}
              <FormControlLabel
                control={
                  <Switch
                    checked={consent.marketing}
                    onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                      {t('cookies.marketing.title', 'Marketing Cookies')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t('cookies.marketing.description', 
                        'Enable personalized content recommendations and measure effectiveness of features.'
                      )}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />
            </FormGroup>

            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                onClick={acceptSelected}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)'
                  }
                }}
              >
                {t('cookies.save_preferences', 'Save Preferences')}
              </Button>
            </Box>
          </Box>
        </Collapse>

        {/* Footer Links */}
        <Box mt={2} pt={2} borderTop="1px solid rgba(255, 255, 255, 0.1)">
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {t('cookies.learn_more', 'Learn more about our data practices in our')}{' '}
            <Link href="/privacy" color="primary" underline="hover">
              {t('cookies.privacy_policy', 'Privacy Policy')}
            </Link>
            {' '}and{' '}
            <Link href="/terms" color="primary" underline="hover">
              {t('cookies.terms_of_service', 'Terms of Service')}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default CookieConsentBanner;
