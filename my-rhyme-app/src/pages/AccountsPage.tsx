import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  Analytics,
  Token,
  Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import FeedbackForm from '../components/FeedbackForm';
import NewsletterSignup from '../components/NewsletterSignup';
import { useUsage } from '../contexts/UsageContext';

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
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AccountsPage: React.FC = () => {
  const { currentUser, login, signup, logout } = useAuth();
  const { usageInfo } = useUsage();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      setSuccess('Successfully signed in!');
      // No need to navigate, the UI will update automatically
    } catch (err: unknown) {
      // handle error, optionally check if err is an Error
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      setSuccess('Account created successfully!');
      setTabValue(0); // Switch to sign in tab
    } catch (err: unknown) {
      // handle error, optionally check if err is an Error
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err: unknown) {
      // handle error, optionally check if err is an Error
      setError(err instanceof Error ? err.message : 'Failed to log out');
    }
  };

  // If user is signed in and not anonymous, show account management
  if (currentUser && !currentUser.isAnonymous) {
    return (
      <Layout owlMessage="Welcome back! Here's your account overview.">
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              My Account
            </Typography>

            <Grid container spacing={3}>
              {/* Profile Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Profile Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText
                          primary="Email"
                          secondary={currentUser.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Person />
                        </ListItemIcon>
                        <ListItemText
                          primary="Account Type"
                          secondary="Registered User"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Usage Stats Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Usage Statistics
                    </Typography>
                    {usageInfo ? (
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <Analytics />
                          </ListItemIcon>
                          <ListItemText
                            primary="Analyses This Month"
                            secondary={`${usageInfo.analysesThisMonth} / ${usageInfo.planLimits.monthlyAnalyses}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Token />
                          </ListItemIcon>
                          <ListItemText
                            primary="Token Balance"
                            secondary={usageInfo.tokenBalance}
                          />
                        </ListItem>
                      </List>
                    ) : (
                      <CircularProgress />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Newsletter Section */}
              <Grid item xs={12} md={6}>
                <NewsletterSignup />
              </Grid>

              {/* Feedback Section */}
              <Grid item xs={12} md={6}>
                <FeedbackForm />
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/subscription-plans')}
                  >
                    Manage Subscription
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/top-up-tokens')}
                  >
                    Buy More Tokens
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    );
  }

  // Show sign in/sign up form for anonymous users
  return (
    <Layout owlMessage="Sign in to unlock all features and save your analyses!">
      <Container component="main" maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Account Access
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                <Tab label="Sign In" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleSignIn}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: <Email />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: <Lock />,
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handleSignUp}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: <Email />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: <Lock />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: <Lock />,
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
              </Box>
            </TabPanel>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" align="center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};

export default AccountsPage;
