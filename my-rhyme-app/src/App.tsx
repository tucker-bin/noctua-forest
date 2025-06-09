import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import type { FormEvent } from 'react';
import type { AnalysisData } from './components/RhymeAnalysisTool';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthContext, AuthProvider, useAuth } from './contexts/AuthContext';
import type { UsageInfo } from './contexts/UsageContext';
import { UsageContext, UsageProvider } from './contexts/UsageContext';
import { Container, TextField, Button, Alert, Typography, Box, Toolbar, IconButton, List, ListItem, ListItemIcon, ListItemText, useMediaQuery, CircularProgress, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AnalysisIcon from '@mui/icons-material/Analytics';
import AccountIcon from '@mui/icons-material/AccountCircle';
import SubscriptionIcon from '@mui/icons-material/CardMembership';
import TokenIcon from '@mui/icons-material/Token';
import LogoutIcon from '@mui/icons-material/Logout';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AppRoutes from './routes';
import AppBar from './components/AppBar';
import Drawer from './components/Drawer';
import UsageDashboard from './components/UsageDashboard';
import Navbar from './components/Navbar';
import { useUsage } from './contexts/UsageContext';
import { theme } from './theme';

// Lazy load components
const AuthFormComponent = lazy(() => import('./components/AuthFormComponent'));
const RhymeAnalysisTool = lazy(() => import('./components/RhymeAnalysisTool'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const SubscriptionPlansPage = lazy(() => import('./pages/SubscriptionPlansPage'));
const TopUpTokensPage = lazy(() => import('./pages/TopUpTokensPage'));
const Home = React.lazy(() => import('./pages/Home'));
const Analysis = React.lazy(() => import('./pages/Analysis'));

const API_BASE_URL = '';

// Real API call function
export const analyzeText = async (text: string): Promise<AnalysisData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                rhyme_scheme: 'phonetic_architecture' // Using the most comprehensive analysis
            }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to analyze text';
            let errorType = response.status;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON
                errorMessage = `${errorMessage} (Status: ${response.status})`;
            }
            if (response.status === 429) {
                errorMessage = 'You are sending requests too quickly. Please wait and try again.';
            } else if (response.status === 400) {
                errorMessage = 'Invalid input: Please check your text and try again.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error: Our analysis engine is having trouble. Please try again later.';
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
            original_text: text,
            rhyme_details: data.map((group: any) => ({
                group_id: group.phonetic_link_id,
                occurrences: group.segments.map((segment: any) => ({
                    startIndex: segment.globalStartIndex,
                    endIndex: segment.globalEndIndex,
                    text: segment.text
                })),
                original_rhyming_words: group.segments.map((segment: any) => segment.text),
                pattern_description: group.pattern_description
            }))
        };
    } catch (error) {
        // Show a user-friendly error message
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error('An unknown error occurred during analysis.');
        }
    }
};

// Define token cost tiers
const TOKEN_COST_SHORT = 5;
const TOKEN_COST_MEDIUM = 10;
const TOKEN_COST_LONG = 20;
const SHORT_CHAR_LIMIT = 500;
const MEDIUM_CHAR_LIMIT = 2000;

const MIN_TOKENS_FOR_LOW_WARNING = 20;

const AppContent: React.FC = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const { currentUser, signInAnon } = useAuth();
    const { usageInfo, isLoading } = useUsage();

    const [isLogin, setIsLogin] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState("");

    const [textToAnalyze, setTextToAnalyze] = useState<string>("");
    const [analysisResults, setAnalysisResults] = useState<AnalysisData | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [showOutOfTokensPrompt, setShowOutOfTokensPrompt] = useState<boolean>(false);
    const [showLowTokensWarning, setShowLowTokensWarning] = useState<boolean>(false);
    const [currentAnalysisCost, setCurrentAnalysisCost] = useState<number>(TOKEN_COST_SHORT);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const theme = createTheme({
        palette: {
            mode: prefersDarkMode ? 'dark' : 'light',
            primary: {
                main: '#2196f3',
            },
            secondary: {
                main: '#f50057',
            },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },
        },
    });
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const navigate = useNavigate();

    useEffect(() => {
        const len = textToAnalyze.length;
        if (len === 0) {
            setCurrentAnalysisCost(0);
        } else if (len < SHORT_CHAR_LIMIT) {
            setCurrentAnalysisCost(TOKEN_COST_SHORT);
        } else if (len < MEDIUM_CHAR_LIMIT) {
            setCurrentAnalysisCost(TOKEN_COST_MEDIUM);
        } else {
            setCurrentAnalysisCost(TOKEN_COST_LONG);
        }
    }, [textToAnalyze]);

    useEffect(() => {
        if (usageInfo && !isLoading) {
            const enoughForCurrent = usageInfo.tokenBalance >= currentAnalysisCost;
            if (enoughForCurrent && usageInfo.tokenBalance < MIN_TOKENS_FOR_LOW_WARNING + currentAnalysisCost && usageInfo.tokenBalance > 0 && textToAnalyze.length > 0) {
                setShowLowTokensWarning(true);
            } else {
                setShowLowTokensWarning(false);
            }
        } else {
            setShowLowTokensWarning(false);
        }
    }, [usageInfo, isLoading, currentAnalysisCost, textToAnalyze.length]);

    useEffect(() => {
        if (!currentUser && signInAnon) {
            signInAnon().catch(err => setAuthError("Anon sign-in failed."));
        }
    }, [currentUser, signInAnon]);

    if (!currentUser) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                gap: 2
            }}>
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Loading your rhyme journey...
                </Typography>
            </Box>
        );
    }

    const { login, signup, logout } = useAuth();

    useEffect(() => {
        if (currentUser?.isAnonymous && (window.location.pathname === '/account' || window.location.pathname === '/subscription-plans' || window.location.pathname === '/top-up-tokens')) {
            navigate('/');
        }
    }, [currentUser, signInAnon, navigate]);

    const handleAuth = async (email: string, password: string): Promise<void> => {
        setAuthError(null);
        setAuthMessage("");
        try {
            if (isLogin) await login(email, password);
            else { 
                await signup(email, password); 
                setAuthMessage("Sign up successful!"); 
                setIsLogin(true); 
            }
            navigate('/');
        } catch (error: any) { 
            setAuthError(error.message); 
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
            setAnalysisResults(null); setTextToAnalyze("");
            navigate('/');
            if (signInAnon) await signInAnon();
        } catch (error: any) { setAuthError(error.message); }
    };

    const handleAnalysisSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textToAnalyze.trim()) return;

        setIsLoadingAnalysis(true);
        setAnalysisError(null);
        setAnalysisResults(null);

        try {
            const results = await analyzeText(textToAnalyze);
            setAnalysisResults(results);
        } catch (error) {
            setAnalysisError(error instanceof Error ? error.message : 'An error occurred during analysis');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const canAnalyze = usageInfo && usageInfo.tokenBalance >= currentAnalysisCost && usageInfo.analysesThisMonth < usageInfo.planLimits.monthlyAnalyses;

    const renderAnalysisContent = () => (
        <>
            {showLowTokensWarning && !showOutOfTokensPrompt && usageInfo && canAnalyze && textToAnalyze.length > 0 && (
                <Alert severity="info" sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography fontWeight="bold">Low Token Balance!</Typography>
                    <Typography>
                        You have {usageInfo.tokenBalance} tokens remaining. This analysis will cost {currentAnalysisCost} tokens.
                    </Typography>
                    {!currentUser?.isAnonymous && (
                        <Button variant="contained" size="small" onClick={() => navigate('/top-up-tokens')} sx={{ mt: 1 }}>
                            Top Up Tokens
                        </Button>
                    )}
                    {currentUser?.isAnonymous && (
                        <Typography variant="body2" sx={{ mt: 1 }}>Sign up to get more tokens and save your work!</Typography>
                    )}
                </Alert>
            )}
            {showOutOfTokensPrompt && usageInfo && (
                <Alert severity="error" sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Out of Tokens!</Typography>
                    <Typography>
                        {analysisError || (currentUser?.isAnonymous
                            ? "You don't have enough tokens for this analysis. Sign up to get more!"
                            : `This analysis costs ${currentAnalysisCost} tokens, but you only have ${usageInfo.tokenBalance}.`)}
                    </Typography>
                    {!currentUser?.isAnonymous && (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/top-up-tokens')}
                            sx={{ mt: 2 }}
                            disabled={false}
                        >
                            Purchase More Tokens
                        </Button>
                    )}
                    {currentUser?.isAnonymous && (
                        <Button variant="contained" color="warning" size="large" onClick={() => {
                            setAuthError("Please sign up to get free tokens and continue.");
                            setIsLogin(false);
                            navigate('/');
                        }} sx={{ mt: 2 }}>
                            Sign Up for Free Tokens
                        </Button>
                    )}
                </Alert>
            )}
            <Box component="form" onSubmit={handleAnalysisSubmit} sx={{ mb: 4, p: 4, border: '1px solid #ccc', borderRadius: 2, bgcolor: 'white', boxShadow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Enter Text for Analysis:</Typography>
                    <Typography variant="body2" color={currentAnalysisCost > (usageInfo?.tokenBalance || 0) && textToAnalyze.length > 0 ? 'error' : 'textSecondary'}>
                        Cost: {textToAnalyze.length > 0 ? currentAnalysisCost : 0} Tokens
                    </Typography>
                </Box>
                <TextField
                    id="textToAnalyze"
                    label="Paste lyrics or poetry..."
                    multiline
                    rows={5}
                    value={textToAnalyze}
                    onChange={(e) => setTextToAnalyze(e.target.value)}
                    placeholder="Paste lyrics or poetry here..."
                    disabled={isLoadingAnalysis}
                    fullWidth
                    margin="normal"
                />
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!!(isLoadingAnalysis || !textToAnalyze.trim() || showOutOfTokensPrompt || (usageInfo && usageInfo.tokenBalance < currentAnalysisCost && textToAnalyze.length > 0))}
                    sx={{ mt: 2 }}
                    startIcon={isLoadingAnalysis ? <CircularProgress size={20} /> : null}
                >
                    {isLoadingAnalysis ? 'Analyzing...' : "Analyze Rhymes"}
                </Button>
                {isLoadingAnalysis && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}
                {analysisError && !showOutOfTokensPrompt && !showLowTokensWarning && <Typography variant="body2" color="error" align="center" mt={2}>{analysisError}</Typography>}
            </Box>
            <RhymeAnalysisTool 
                onSubmit={async (text: string) => {
                    setTextToAnalyze(text);
                    await handleAnalysisSubmit(new Event('submit') as unknown as FormEvent);
                }}
                results={analysisResults}
                isLoading={isLoadingAnalysis}
                error={analysisError}
                currentCost={currentAnalysisCost}
                tokenBalance={usageInfo?.tokenBalance}
            />
        </>
    );

    const handleDrawerToggle = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const menuItems = [
        { text: 'Analysis', icon: <AnalysisIcon />, path: '/' },
        { text: 'Account', icon: <AccountIcon />, path: '/account' },
        { text: 'Subscription Plans', icon: <SubscriptionIcon />, path: '/subscription-plans' },
        { text: 'Top Up Tokens', icon: <TokenIcon />, path: '/top-up-tokens' },
    ];

    const renderDrawer = () => (
        <Drawer
            open={isDrawerOpen}
            onClose={handleDrawerToggle}
        />
    );

    const renderContent = () => {
        if (!currentUser) {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh',
                    gap: 2
                }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                        Loading authentication...
                    </Typography>
                </Box>
            );
        }

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Suspense fallback={
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        minHeight: '50vh',
                        gap: 2
                    }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" color="text.secondary">
                            Loading page...
                        </Typography>
                    </Box>
                }>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/analysis" element={<Analysis />} />
                        <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                        <Route path="/top-up-tokens" element={<TopUpTokensPage navigateTo={(page) => {
                            if (page === 'analysis') navigate('/');
                            else if (page === 'account') navigate('/account');
                            else if (page === 'subscriptionPlans') navigate('/subscription-plans');
                            else if (page === 'topUpTokens') navigate('/top-up-tokens');
                        }} />} />
                        {currentUser && <Route path="/dashboard" element={<UsageDashboard />} />}
                    </Routes>
                </Suspense>
            </Container>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <UsageProvider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <Navbar />
                        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                            <Suspense fallback={<CircularProgress />}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/analysis" element={<Analysis />} />
                                    <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                                    <Route path="/top-up-tokens" element={<TopUpTokensPage navigateTo={(page) => {
                                        if (page === 'analysis') navigate('/');
                                        else if (page === 'account') navigate('/account');
                                        else if (page === 'subscriptionPlans') navigate('/subscription-plans');
                                        else if (page === 'topUpTokens') navigate('/top-up-tokens');
                                    }} />} />
                                    {currentUser && <Route path="/dashboard" element={<UsageDashboard />} />}
                                </Routes>
                            </Suspense>
                        </Box>
                    </Box>
                </UsageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box
                    className="star-field"
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <AppRoutes />
                </Box>
            </Router>
        </ThemeProvider>
    );
};

export default App;
