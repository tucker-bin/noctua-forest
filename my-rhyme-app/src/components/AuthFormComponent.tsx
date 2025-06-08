import React, { useState, useContext } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    Link,
    Stack,
    Divider,
    useTheme,
    useMediaQuery,
    CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import { AuthContext } from '../contexts/AuthContext';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';

interface AuthFormComponentProps {
    isLogin: boolean;
    setIsLogin: (isLogin: boolean) => void;
    error: string | null;
    message: string;
    onSubmit: (email: string, password: string) => Promise<void>;
}

const AuthFormComponent: React.FC<AuthFormComponentProps> = ({
    isLogin,
    setIsLogin,
    error,
    message,
    onSubmit,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const authCtx = useContext(AuthContext);
    const signInWithGoogle = authCtx?.signInWithGoogle;
    const [showTos, setShowTos] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [tosScrolled, setTosScrolled] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        if (!isLogin && password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setPasswordError(null);

        // Validate email
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Validate password
        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(email, password);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setGoogleError(null);
        try {
            await signInWithGoogle?.();
        } catch (err: any) {
            setGoogleError(err.message || 'Google sign-in failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleTosScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 10) setTosScrolled(true);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                p: 2,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 4 },
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 2,
                }}
            >
                <Stack spacing={3}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            {isLogin ? 'Welcome back, creator! 👋' : 'Join the crew!'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {isLogin
                                ? 'Log in to unlock your rhyme journey'
                                : 'Sign up and start exploring your lyrics!'}
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {message && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            {message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailError(null);
                                }}
                                error={!!emailError}
                                helperText={emailError}
                                disabled={isSubmitting || googleLoading}
                                InputProps={{
                                    startAdornment: (
                                        <EmailIcon color="action" sx={{ mr: 1 }} />
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError(null);
                                }}
                                error={!!passwordError}
                                helperText={passwordError}
                                disabled={isSubmitting || googleLoading}
                                InputProps={{
                                    startAdornment: (
                                        <LockIcon color="action" sx={{ mr: 1 }} />
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={isSubmitting || googleLoading || (!isLogin && !agreed)}
                                sx={{ mt: 2 }}
                            >
                                {isSubmitting ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : isLogin ? (
                                    'Log In'
                                ) : (
                                    'Sign Up'
                                )}
                            </Button>
                        </Stack>
                    </form>

                    <Divider>
                        <Typography variant="body2" color="text.secondary">
                            or
                        </Typography>
                    </Divider>

                    <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting || googleLoading}
                        startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                    >
                        {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </Button>

                    {googleError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {googleError}
                        </Alert>
                    )}

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <Link
                                component="button"
                                onClick={() => setIsLogin(!isLogin)}
                                sx={{ fontWeight: 'bold' }}
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </Link>
                        </Typography>
                    </Box>

                    {!isLogin && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Checkbox
                                    checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)}
                                    disabled={!tosScrolled}
                                    sx={{ mr: 1 }}
                                />
                                <Typography variant="body2">
                                    I agree to the
                                    <Link component="button" onClick={() => setShowTos(true)} sx={{ mx: 0.5 }}>Terms of Service</Link>
                                    and
                                    <Link component="button" onClick={() => setShowPrivacy(true)} sx={{ mx: 0.5 }}>Privacy Policy</Link>.
                                </Typography>
                            </Box>
                            <Dialog open={showTos} onClose={() => setShowTos(false)} maxWidth="md" fullWidth>
                                <DialogTitle>Terms of Service</DialogTitle>
                                <DialogContent dividers onScroll={handleTosScroll} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <TermsOfService />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowTos(false)} disabled={!tosScrolled}>Close</Button>
                                </DialogActions>
                            </Dialog>
                            <Dialog open={showPrivacy} onClose={() => setShowPrivacy(false)} maxWidth="md" fullWidth>
                                <DialogTitle>Privacy Policy</DialogTitle>
                                <DialogContent dividers sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <PrivacyPolicy />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowPrivacy(false)}>Close</Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                </Stack>
            </Paper>
        </Box>
    );
};

export default AuthFormComponent;
