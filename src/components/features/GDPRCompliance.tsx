import React, { useState, useEffect } from 'react';
import { log } from '../../utils/logger';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Divider,
  Link
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Cookie,
  Analytics,
  PersonalVideo,
  CloudDownload,
  Delete,
  Edit,
  Visibility
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

interface GDPRSettings {
  dataProcessing: boolean;
  profileAnalytics: boolean;
  marketingEmails: boolean;
  thirdPartySharing: boolean;
  performanceTracking: boolean;
}

const GDPR_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365;

const GDPRCompliance: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showPrivacyCenter, setShowPrivacyCenter] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  
  const [cookieConsent, setCookieConsent] = useState<CookieConsent>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: 0,
    version: GDPR_VERSION
  });

  const [gdprSettings, setGdprSettings] = useState<GDPRSettings>({
    dataProcessing: false,
    profileAnalytics: false,
    marketingEmails: false,
    thirdPartySharing: false,
    performanceTracking: false
  });

  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
  const [deletionStatus, setDeletionStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  useEffect(() => {
    // Check for existing consent
    const savedConsent = localStorage.getItem('gdpr-cookie-consent');
    const savedSettings = localStorage.getItem('gdpr-settings');
    
    if (savedConsent) {
      const consent = JSON.parse(savedConsent);
      const isExpired = Date.now() - consent.timestamp > CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const isOutdated = consent.version !== GDPR_VERSION;
      
      if (isExpired || isOutdated) {
        setShowCookieBanner(true);
      } else {
        setCookieConsent(consent);
      }
    } else {
      setShowCookieBanner(true);
    }

    if (savedSettings) {
      setGdprSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleCookieConsentChange = (category: keyof CookieConsent, value: boolean) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setCookieConsent(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const acceptAllCookies = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    setCookieConsent(consent);
    localStorage.setItem('gdpr-cookie-consent', JSON.stringify(consent));
    setShowCookieBanner(false);
    
    // Enable analytics and tracking
    enableAnalytics();
  };

  const acceptSelectedCookies = () => {
    const consent = {
      ...cookieConsent,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    setCookieConsent(consent);
    localStorage.setItem('gdpr-cookie-consent', JSON.stringify(consent));
    setShowCookieBanner(false);
    
    // Configure services based on consent
    configureServices(consent);
  };

  const rejectAllCookies = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
      version: GDPR_VERSION
    };
    
    setCookieConsent(consent);
    localStorage.setItem('gdpr-cookie-consent', JSON.stringify(consent));
    setShowCookieBanner(false);
    
    // Disable all non-essential services
    disableNonEssentialServices();
  };

  const enableAnalytics = () => {
    // Enable Google Analytics, performance monitoring, etc.
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    }
  };

  const configureServices = (consent: CookieConsent) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        personalization_storage: consent.preferences ? 'granted' : 'denied'
      });
    }
  };

  const disableNonEssentialServices = () => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        personalization_storage: 'denied'
      });
    }
  };

  const handleGDPRSettingChange = (setting: keyof GDPRSettings, value: boolean) => {
    const newSettings = {
      ...gdprSettings,
      [setting]: value
    };
    
    setGdprSettings(newSettings);
    localStorage.setItem('gdpr-settings', JSON.stringify(newSettings));
    
    // Update backend settings if user is logged in
    if (currentUser) {
      updateUserPrivacySettings(newSettings);
    }
  };

  const updateUserPrivacySettings = async (settings: GDPRSettings) => {
    try {
      await fetch('/api/user/privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(settings)
      });
    } catch (error) {
      log.error('Failed to update privacy settings:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    }
  };

  const requestDataExport = async () => {
    if (!currentUser) return;
    
    setExportStatus('processing');
    
    try {
      const response = await fetch('/api/user/data-export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });
      
      if (response.ok) {
        setExportStatus('ready');
        // Optionally trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noctua-forest-data-${Date.now()}.json`;
        a.click();
      } else {
        setExportStatus('error');
      }
    } catch (error) {
      log.error('Data export failed:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      setExportStatus('error');
    }
  };

  const requestDataDeletion = async () => {
    if (!currentUser) return;
    
    setDeletionStatus('processing');
    
    try {
      const response = await fetch('/api/user/data-deletion', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });
      
      if (response.ok) {
        setDeletionStatus('completed');
        // Clear local data
        localStorage.clear();
        // Redirect to goodbye page or sign out
      } else {
        setDeletionStatus('error');
      }
    } catch (error) {
      log.error('Data deletion failed:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      setDeletionStatus('error');
    }
  };

  return (
    <>
      {/* Cookie Consent Banner */}
      <Dialog
        open={showCookieBanner}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            top: 'auto',
            margin: 0,
            background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Cookie color="primary" />
            {t('gdpr.cookies.title', 'Cookie Preferences')}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ color: 'white' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('gdpr.cookies.description', 
              'We use cookies to enhance your experience, analyze site usage, and personalize content. You can customize your preferences below.'
            )}
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={cookieConsent.necessary}
                  disabled
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {t('gdpr.cookies.necessary', 'Necessary Cookies')} 
                    <Chip label={t('gdpr.required', 'Required')} size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                    {t('gdpr.cookies.necessary_desc', 'Essential for basic site functionality')}
                  </Typography>
                </Box>
              }
              sx={{ mb: 1, '& .MuiFormControlLabel-label': { color: 'white' } }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={cookieConsent.analytics}
                  onChange={(e) => handleCookieConsentChange('analytics', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {t('gdpr.cookies.analytics', 'Analytics Cookies')}
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                    {t('gdpr.cookies.analytics_desc', 'Help us understand how you use our app')}
                  </Typography>
                </Box>
              }
              sx={{ mb: 1, '& .MuiFormControlLabel-label': { color: 'white' } }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={cookieConsent.preferences}
                  onChange={(e) => handleCookieConsentChange('preferences', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {t('gdpr.cookies.preferences', 'Preference Cookies')}
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                    {t('gdpr.cookies.preferences_desc', 'Remember your settings and preferences')}
                  </Typography>
                </Box>
              }
              sx={{ mb: 1, '& .MuiFormControlLabel-label': { color: 'white' } }}
            />
          </FormGroup>
          
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 2, display: 'block' }}>
            {t('gdpr.cookies.policy_link', 'Learn more in our')}{' '}
            <Link href="/privacy" color="primary" underline="hover">
              {t('gdpr.privacy_policy', 'Privacy Policy')}
            </Link>
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={rejectAllCookies} color="secondary">
            {t('gdpr.cookies.reject_all', 'Reject All')}
          </Button>
          <Button onClick={acceptSelectedCookies} variant="outlined">
            {t('gdpr.cookies.accept_selected', 'Accept Selected')}
          </Button>
          <Button onClick={acceptAllCookies} variant="contained">
            {t('gdpr.cookies.accept_all', 'Accept All')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Center Button */}
      <Button
        variant="outlined"
        startIcon={<Security />}
        onClick={() => setShowPrivacyCenter(true)}
        sx={{ textTransform: 'none' }}
      >
        {t('gdpr.privacy_center', 'Privacy Center')}
      </Button>

      {/* Privacy Center Dialog */}
      <Dialog
        open={showPrivacyCenter}
        onClose={() => setShowPrivacyCenter(false)}
        maxWidth="md"
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
            <Security color="primary" />
            {t('gdpr.privacy_center_title', 'Privacy & Data Control')}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ color: 'white' }}>
          {/* Cookie Management */}
          <Accordion sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                <Cookie sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('gdpr.cookie_management', 'Cookie Management')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Button
                variant="outlined"
                onClick={() => setShowCookieBanner(true)}
                sx={{ mb: 2 }}
              >
                {t('gdpr.update_preferences', 'Update Cookie Preferences')}
              </Button>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                {t('gdpr.cookie_status', 'Current status')}: 
                Analytics: {cookieConsent.analytics ? '✅' : '❌'}, 
                Preferences: {cookieConsent.preferences ? '✅' : '❌'}
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Data Rights */}
          <Accordion sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('gdpr.data_rights', 'Your Data Rights')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownload />}
                  onClick={requestDataExport}
                  disabled={!currentUser || exportStatus === 'processing'}
                >
                  {exportStatus === 'processing' 
                    ? t('gdpr.exporting', 'Exporting...') 
                    : t('gdpr.export_data', 'Export My Data')
                  }
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setShowDataDeletion(true)}
                  disabled={!currentUser}
                >
                  {t('gdpr.delete_account', 'Delete My Account')}
                </Button>
                
                {!currentUser && (
                  <Alert severity="info">
                    {t('gdpr.login_required', 'Please sign in to access your data rights')}
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Privacy Settings */}
          {currentUser && (
            <Accordion sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('gdpr.privacy_settings', 'Privacy Settings')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={gdprSettings.dataProcessing}
                        onChange={(e) => handleGDPRSettingChange('dataProcessing', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t('gdpr.settings.data_processing', 'Allow data processing for app improvement')}
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={gdprSettings.profileAnalytics}
                        onChange={(e) => handleGDPRSettingChange('profileAnalytics', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t('gdpr.settings.profile_analytics', 'Enable learning progress analytics')}
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={gdprSettings.marketingEmails}
                        onChange={(e) => handleGDPRSettingChange('marketingEmails', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t('gdpr.settings.marketing_emails', 'Receive feature updates and tips')}
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowPrivacyCenter(false)}>
            {t('gdpr.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Deletion Confirmation */}
      <Dialog
        open={showDataDeletion}
        onClose={() => setShowDataDeletion(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error.main">
          {t('gdpr.deletion.title', 'Delete Account & Data')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('gdpr.deletion.warning', 'This action cannot be undone. All your data will be permanently deleted.')}
          </Alert>
          <Typography variant="body2">
            {t('gdpr.deletion.description', 
              'This will delete your account, learning progress, and all associated data from our servers within 30 days.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDataDeletion(false)}>
            {t('gdpr.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={requestDataDeletion}
            color="error"
            disabled={deletionStatus === 'processing'}
          >
            {deletionStatus === 'processing' 
              ? t('gdpr.deleting', 'Deleting...') 
              : t('gdpr.confirm_delete', 'Confirm Delete')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GDPRCompliance; 