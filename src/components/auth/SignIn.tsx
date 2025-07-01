import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Divider,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { FirebaseError } from 'firebase/app';

export const SignIn: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('auth.errors.fill_all_fields', 'Please fill in all fields'));
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      
      // Handle specific Firebase auth errors
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError(t('auth.errors.invalid_email', 'Invalid email address'));
          break;
        case 'auth/user-disabled':
          setError(t('auth.errors.user_disabled', 'This account has been disabled'));
          break;
        case 'auth/user-not-found':
          setError(t('auth.errors.user_not_found', 'No account found with this email'));
          break;
        case 'auth/wrong-password':
          setError(t('auth.errors.wrong_password', 'Incorrect password'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.errors.too_many_requests', 'Too many failed attempts. Please try again later'));
          break;
        default:
          setError(t('auth.errors.signin_failed', 'Failed to sign in. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError(t('auth.errors.popup_closed', 'Sign-in cancelled'));
      } else {
        setError(t('auth.errors.google_signin_failed', 'Failed to sign in with Google'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.forest.background,
        pt: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              background: `linear-gradient(135deg, ${theme.palette.forest.card}CC 0%, ${theme.palette.forest.card}99 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.forest.border}40`,
              borderRadius: 2,
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 3,
                background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: '"Noto Sans", sans-serif',
                fontWeight: 600,
              }}
            >
              {t('auth.signin_title', 'Sign In')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, textAlign: 'center' }}
            >
              {t('auth.signin_subtitle', 'Welcome back to Noctua Forest')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('auth.email', 'Email Address')}
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.password', 'Password')}
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              
              <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('auth.forgot_password', 'Forgot password?')}
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FFA500, #FFD700)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 215, 0, 0.3)',
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: 'primary.main' }} />
                ) : (
                  t('auth.signin_button', 'Sign In')
                )}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.or', 'OR')}
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                sx={{
                  mb: 2,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
                startIcon={
                  <Box
                    component="img"
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    sx={{ width: 20, height: 20 }}
                  />
                }
              >
                {t('auth.signin_with_google', 'Sign in with Google')}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.no_account', "Don't have an account?")}{' '}
                  <Link
                    component={RouterLink}
                    to="/signup"
                    sx={{
                      color: 'secondary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {t('auth.signup_link', 'Sign up')}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default SignIn; 