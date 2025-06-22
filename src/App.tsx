import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, useMediaQuery } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { UsageProvider } from './contexts/UsageContext';
import { ExperienceProvider } from './contexts/ExperienceContext';
import noctuaTheme from './theme/noctuaTheme';
import { Layout } from './components/layout/Layout';
import Observatory from './components/Observatory/Observatory';
import ProfilePage from './components/ProfilePage';
import { ForestPage } from './pages/ForestPage';
import OnboardingModal from './components/modals/OnboardingModal';

// GDPR and Production Features
import CookieConsentBanner from './components/features/CookieConsentBanner';
import PWAInstallPrompt from './components/features/PWAInstallPrompt';
import OfflineIndicator from './components/features/OfflineIndicator';
import { WebVitalsMonitor } from './components/features/WebVitalsMonitor';

// Lazy load legal pages and lessons
const TermsOfService = lazy(() => import('./components/layout/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/layout/PrivacyPolicy'));
const LessonList = lazy(() => import('./components/lessons/LessonList'));
const LessonView = lazy(() => import('./components/lessons/LessonView'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const SignIn = lazy(() => import('./components/auth/SignIn'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const PostCreation = lazy(() => import('./components/social/PostCreation'));
const Scriptorium = lazy(() => import('./components/Scriptorium/Scriptorium'));

// Gamification Components
const LandingPage = lazy(() => import('./components/pages/LandingPage'));
const ForestMap = lazy(() => import('./components/celestial/ForestMap'));
const AchievementDashboard = lazy(() => import('./components/features/AchievementDashboard'));
const FlowFinder = lazy(() => import('./components/features/FlowFinder'));
const FlowFinderHub = lazy(() => import('./components/features/FlowFinderHub'));
const GameGrove = lazy(() => import('./pages/GameGrove'));
const OnboardingJourney = lazy(() => import('./components/features/OnboardingJourney'));

const App: React.FC = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        return !hasSeenOnboarding;
    });

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    return (
        <ThemeProvider theme={noctuaTheme}>
            <CssBaseline />
            <AuthProvider>
                <UsageProvider>
                    <ExperienceProvider>
                        <Layout>
                            <Suspense fallback={
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                                    <CircularProgress />
                                </Box>
                            }>
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/map" element={<ForestMap />} />
                                    <Route path="/observatory" element={<Observatory />} />
                                    <Route path="/forest" element={<ForestPage />} />
                                    <Route path="/forest/create-post" element={<PostCreation />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/lessons" element={<LessonList />} />
                                    <Route path="/lessons/:path/:lessonSlug" element={<LessonView />} />
                                    <Route path="/terms" element={<TermsOfService />} />
                                    <Route path="/privacy" element={<PrivacyPolicy />} />
                                    <Route path="/signup" element={<SignUp />} />
                                    <Route path="/signin" element={<SignIn />} />
                                    <Route path="/accounts" element={<AccountsPage />} />
                                    <Route path="/scriptorium" element={<Scriptorium />} />
                                    <Route path="/achievements" element={<AchievementDashboard />} />
                                    <Route path="/flow-finder" element={<FlowFinder />} />
                                    <Route path="/flow-finder-hub" element={<FlowFinderHub />} />
                                    <Route path="/game-grove" element={<GameGrove />} />
                                    <Route path="/onboarding" element={<OnboardingJourney onComplete={() => {}} />} />
                                </Routes>
                            </Suspense>
                            <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
                        </Layout>

                        {/* Production-Ready Features */}
                        <CookieConsentBanner />
                        <PWAInstallPrompt />
                        <OfflineIndicator />
                        <WebVitalsMonitor />
                    </ExperienceProvider>
                </UsageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App; 