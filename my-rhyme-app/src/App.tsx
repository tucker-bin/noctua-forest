import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { UsageProvider } from './contexts/UsageContext';
import { Container, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import OnboardingModal from './components/OnboardingModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { noctuaTheme } from './theme/noctuaTheme';
import { useAuth } from './contexts/AuthContext';
import i18n from './i18n';

const Home = lazy(() => import('./pages/Home'));
const Observatory = lazy(() => import('./components/Observatory'));
const UsageDashboard = lazy(() => import('./components/UsageDashboard'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const Credit = lazy(() => import('./pages/Credit'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const Profile = lazy(() => import('./pages/Profile'));
const TheForest = lazy(() => import('./pages/TheForest'));

function AppContent() {
    const { currentUser } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Show onboarding if user is not logged in and hasn't seen it before
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!currentUser && !hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, [currentUser]);

    const handleDrawerToggle = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };
    
    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar onDrawerToggle={handleDrawerToggle} />
                <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/forest" element={<TheForest />} />
                            <Route path="/observatory" element={<Observatory />} />
                            <Route path="/usage" element={<UsageDashboard />} />
                            <Route path="/login" element={<AuthPage />} />
                            <Route path="/signup" element={<AuthPage />} />
                            <Route path="/account" element={<AccountsPage />} />
                            <Route path="/credit" element={<Credit />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/admin" element={<AdminPage />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/profile/:userId" element={<Profile />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </Container>
            </Box>
            {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
        </>
    );
}

function App() {
    return (
        <I18nextProvider i18n={i18n}>
            <ThemeProvider theme={noctuaTheme}>
                <CssBaseline />
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AuthProvider>
                        <UsageProvider>
                            <ErrorBoundary>
                                <AppContent />
                            </ErrorBoundary>
                        </UsageProvider>
                    </AuthProvider>
                </Router>
            </ThemeProvider>
        </I18nextProvider>
    );
}

export default App;
