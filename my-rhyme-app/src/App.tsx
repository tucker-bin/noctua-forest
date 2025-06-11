import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { FormEvent } from 'react';
import type { AnalysisData } from './components/RhymeAnalysisTool';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UsageProvider, useUsage } from './contexts/UsageContext';
import { Container, TextField, Button, Alert, Typography, Box, CircularProgress, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { noctuaTheme } from './theme/noctuaTheme';
import OnboardingModal from './components/OnboardingModal';
import NavigationHandler from './components/NavigationHandler';
import ErrorBoundary from './components/ErrorBoundary';
import Drawer from './components/Drawer';
import AnalysisIcon from '@mui/icons-material/Analytics';
import AccountIcon from '@mui/icons-material/AccountCircle';
import SubscriptionIcon from '@mui/icons-material/CardMembership';
import TokenIcon from '@mui/icons-material/Token';

// Lazy load components
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const SubscriptionPlansPage = lazy(() => import('./pages/SubscriptionPlansPage'));
const TopUpTokensPage = lazy(() => import('./pages/TopUpTokensPage'));
const ObserverHome = React.lazy(() => import('./pages/ObserverHome'));
const Analysis = React.lazy(() => import('./pages/Analysis'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const UsageDashboard = lazy(() => import('./components/UsageDashboard'));
const RhymeAnalysisTool = lazy(() => import('./components/RhymeAnalysisTool'));

const API_BASE_URL = '/api';

// Real API call function
export const analyzeText = async (text: string): Promise<AnalysisData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
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
    const { currentUser } = useAuth();
    const { usageInfo } = useUsage();

    const [isLogin, setIsLogin] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        return !hasSeenOnboarding;
    });

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const handleDrawerToggle = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    return (
        <ThemeProvider theme={noctuaTheme}>
            <CssBaseline />
            <ErrorBoundary>
                <AuthProvider>
                    <UsageProvider>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                            <Navbar onDrawerToggle={handleDrawerToggle} />
                            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                                <Container maxWidth="lg">
                                    <ErrorBoundary>
                                        <Suspense fallback={<CircularProgress />}>
                                            <Routes>
                                                <Route path="/" element={<ObserverHome />} />
                                                <Route path="/account" element={<AccountsPage />} />
                                                <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                                                <Route path="/top-up-tokens" element={<TopUpTokensPage />} />
                                                <Route path="/admin" element={<AdminPage />} />
                                                <Route path="/analysis" element={<Analysis />} />
                                                <Route path="/usage" element={<UsageDashboard />} />
                                            </Routes>
                                        </Suspense>
                                    </ErrorBoundary>
                                </Container>
                            </Box>
                            <Drawer
                                open={isDrawerOpen}
                                onClose={handleDrawerToggle}
                            />
                            <OnboardingModal
                                open={showOnboarding}
                                onClose={handleOnboardingClose}
                            />
                        </Box>
                    </UsageProvider>
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    // Onboarding state management
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Check if the user has seen the onboarding before
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        // Mark onboarding as seen
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    return (
        <ThemeProvider theme={noctuaTheme}>
            <CssBaseline />
            <ErrorBoundary>
                <AuthProvider>
                    <UsageProvider>
                        <Router>
                            <AppContent />
                            <OnboardingModal
                                open={showOnboarding}
                                onClose={handleOnboardingClose}
                            />
                        </Router>
                    </UsageProvider>
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;
