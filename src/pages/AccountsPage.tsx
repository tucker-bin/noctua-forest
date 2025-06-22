import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Chip,
  Divider,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
import TokenIcon from '@mui/icons-material/Token';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { ModelPreferences } from '../components/preferences/ModelPreferences';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AccountsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { usageInfo, tokenConfig } = useUsage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setMessage(t('accounts.onboarding_reset', 'Onboarding has been reset. It will show again on your next visit.'));
  };

  const monthlyUsagePercentage = usageInfo ? (usageInfo.observationsThisMonth / 100) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 700,
          color: 'secondary.main',
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {t('accounts.title', 'My Account')}
      </Typography>

      <Paper
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(26, 27, 46, 0.6)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(26, 27, 46, 0.8)',
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'secondary.main',
              },
            },
          }}
        >
          <Tab icon={<BarChartIcon />} label={t('accounts.usage', 'Usage')} />
          <Tab icon={<PersonIcon />} label={t('accounts.profile', 'Profile')} />
          <Tab icon={<PaymentIcon />} label={t('accounts.billing', 'Billing')} />
          <Tab icon={<PsychologyIcon />} label={t('accounts.ai_models', 'AI Models')} />
          <Tab icon={<SettingsIcon />} label={t('accounts.settings', 'Settings')} />
        </Tabs>

        {/* Usage Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Token Balance Card */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(26, 27, 46, 0.9) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TokenIcon sx={{ color: 'secondary.main', mr: 1 }} />
                  <Typography variant="h6">
                    {t('accounts.token_balance', 'Token Balance')}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'secondary.main', mb: 1 }}>
                  {usageInfo?.tokenBalance || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('accounts.tokens_remaining', 'tokens remaining')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2, borderColor: 'secondary.main', color: 'secondary.main' }}
                  onClick={() => navigate('/pricing')}
                >
                  {t('accounts.buy_tokens', 'Buy More Tokens')}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Usage Card */}
            <Card
              sx={{
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarMonthIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  <Typography variant="h6">
                    {t('accounts.monthly_usage', 'Monthly Usage')}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {usageInfo?.observationsThisMonth || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('accounts.observations_this_month', 'observations this month')}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={monthlyUsagePercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 215, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'secondary.main',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Usage Statistics - spans full width */}
            <Card
              sx={{
                gridColumn: '1 / -1',
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {t('accounts.usage_breakdown', 'Usage Breakdown')}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary.main">
                      {tokenConfig.baseCost}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('accounts.base_cost', 'Base cost per observation')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary.main">
                      {tokenConfig.batchSize}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('accounts.characters_per_batch', 'Characters per batch')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary.main">
                      {(tokenConfig.bulkDiscount * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('accounts.bulk_discount', 'Bulk discount (5+ batches)')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary.main">
                      {usageInfo?.userRegion || 'US'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('accounts.your_region', 'Your region')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card
              sx={{
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {t('accounts.profile_info', 'Profile Information')}
                </Typography>
                
                <TextField
                  fullWidth
                  label={t('accounts.display_name', 'Display Name')}
                  defaultValue={currentUser?.displayName || ''}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label={t('accounts.email', 'Email')}
                  value={currentUser?.email || ''}
                  disabled
                  sx={{ mb: 2 }}
                />
                
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    color: 'primary.main',
                  }}
                >
                  {t('accounts.update_profile', 'Update Profile')}
                </Button>
              </CardContent>
            </Card>
            
            <Card
              sx={{
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {t('accounts.account_status', 'Account Status')}
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary={t('accounts.member_since', 'Member Since')}
                      secondary={currentUser?.metadata?.creationTime || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={t('accounts.email_verified', 'Email Verified')}
                      secondary={
                        <Chip
                          label={currentUser?.emailVerified ? t('common.yes', 'Yes') : t('common.no', 'No')}
                          color={currentUser?.emailVerified ? 'success' : 'warning'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Billing Tab */}
        <TabPanel value={activeTab} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('accounts.billing_info', 'Billing features coming soon. For now, all features are free during beta.')}
          </Alert>
          
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: 'primary.main',
            }}
            onClick={() => navigate('/pricing')}
          >
            {t('accounts.view_plans', 'View Available Plans')}
          </Button>
        </TabPanel>

        {/* AI Models Tab */}
        <TabPanel value={activeTab} index={3}>
          <ModelPreferences />
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <Card
              sx={{
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {t('accounts.preferences', 'Preferences')}
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                  }
                  label={t('accounts.email_notifications', 'Email Notifications')}
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                    />
                  }
                  label={t('accounts.dark_mode', 'Dark Mode')}
                  sx={{ mb: 2 }}
                />
              </CardContent>
            </Card>

            <Card
              sx={{
                background: 'rgba(26, 27, 46, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {t('accounts.developer_options', 'Developer Options')}
                </Typography>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetOnboarding}
                >
                  {t('accounts.reset_onboarding', 'Reset Onboarding')}
                </Button>
                
                {message && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AccountsPage; 