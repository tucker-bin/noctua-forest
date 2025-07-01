import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, useMediaQuery } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExperienceProvider } from './contexts/ExperienceContext';
import { UsageProvider } from './contexts/UsageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { noctuaTheme } from './theme/noctuaTheme';
import { Layout } from './components/layout/Layout';

// Core components - loaded immediately for better initial experience
import ProfilePage from './components/ProfilePage';
import OnboardingModal from './components/modals/OnboardingModal';

// Production features - loaded immediately for better UX
import CookieConsentBanner from './components/features/CookieConsentBanner';
import PWAInstallPrompt from './components/features/PWAInstallPrompt';
import OfflineIndicator from './components/features/OfflineIndicator';
import { WebVitalsMonitor } from './components/features/WebVitalsMonitor';
import PerformanceMonitor from './components/features/PerformanceMonitor';
import PushNotifications from './components/features/PushNotifications';

// Lazy loaded components for optimal bundle splitting
const LandingPage = lazy(() => import('./components/pages/LandingPage'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const SignIn = lazy(() => import('./components/auth/SignIn'));
const TermsOfService = lazy(() => import('./components/layout/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/layout/PrivacyPolicy'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));

// Main game experience
const FlowFinderHub = lazy(() => import('./components/features/FlowFinderHub'));
const FlowFinder = lazy(() => import('./components/features/FlowFinder'));

// Social features
const Leaderboard = lazy(() => import('./components/social/Leaderboard').then(module => ({ default: module.Leaderboard })));

// Legacy components - kept for backward compatibility but not in main nav
const Observatory = lazy(() => import('./components/Observatory/Observatory'));
const Scriptorium = lazy(() => import('./components/Scriptorium/Scriptorium').then(module => ({ default: module.Scriptorium })));
const LessonList = lazy(() => import('./components/lessons/LessonList'));
const LessonView = lazy(() => import('./components/lessons/LessonView'));

// Enhanced loading component with better UX
const LoadingFallback: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
    <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        gap={2}
    >
        <CircularProgress size={40} />
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            {message}
        </Box>
    </Box>
);

const MobileOptimizedApp: React.FC = () => {
    const { currentUser } = useAuth();
    const [showPWAPrompt, setShowPWAPrompt] = useState(false);
    const [showPushNotifications, setShowPushNotifications] = useState(false);

    // Track user interactions for PWA prompt timing
    useEffect(() => {
        let interactionCount = 0;
        const trackInteraction = () => {
            interactionCount++;
            localStorage.setItem('user-interactions', interactionCount.toString());
        };

        const events = ['click', 'touch', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, trackInteraction);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, trackInteraction);
            });
        };
    }, []);

    // Track games played for PWA prompt
    useEffect(() => {
        const gamesPlayed = localStorage.getItem('games-played') || '0';
        const count = parseInt(gamesPlayed);
        
        // Show PWA prompt after 2 games
        if (count >= 2 && !showPWAPrompt) {
            setTimeout(() => setShowPWAPrompt(true), 5000);
        }
    }, [showPWAPrompt]);

    return (
        <>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                
                {/* Main Games Experience */}
                <Route 
                    path="/games" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading Games..." />}>
                            <FlowFinderHub />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/games/play" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading puzzle..." />}>
                            <FlowFinder />
                        </Suspense>
                    } 
                />
                
                {/* Social features */}
                <Route 
                    path="/leaderboard" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading rankings..." />}>
                            <Leaderboard />
                        </Suspense>
                    } 
                />
                
                {/* Core user pages */}
                <Route 
                    path="/profile" 
                    element={
                        currentUser ? <ProfilePage /> : <Navigate to="/" replace />
                    } 
                />
                <Route 
                    path="/subscribe" 
                    element={
                        currentUser ? <SubscriptionPage /> : <Navigate to="/" replace />
                    } 
                />
                
                {/* Auth routes */}
                <Route 
                    path="/signup" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading sign up..." />}>
                            <SignUp />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/signin" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading sign in..." />}>
                            <SignIn />
                        </Suspense>
                    } 
                />
                
                {/* Legal and account pages */}
                <Route 
                    path="/terms" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading terms..." />}>
                            <TermsOfService />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/privacy" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading privacy policy..." />}>
                            <PrivacyPolicy />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/accounts" 
                    element={
                        currentUser ? <AccountsPage /> : <Navigate to="/" replace />
                    } 
                />
                
                {/* Legacy routes - redirects to main games experience */}
                <Route path="/forest" element={<Navigate to="/games" replace />} />
                <Route path="/flow-finder" element={<Navigate to="/games" replace />} />
                <Route path="/flow-finder/play" element={<Navigate to="/games/play" replace />} />
                <Route path="/daily-challenge" element={<Navigate to="/games" replace />} />
                <Route path="/game-grove" element={<Navigate to="/games" replace />} />
                <Route path="/achievements" element={<Navigate to="/profile" replace />} />
                
                {/* Hidden legacy routes - accessible by direct URL but not in navigation */}
                <Route 
                    path="/legacy/observatory" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading Observatory..." />}>
                            <Observatory />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/legacy/scriptorium" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading Scriptorium..." />}>
                            <Scriptorium />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/legacy/lessons" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading lessons..." />}>
                            <LessonList />
                        </Suspense>
                    } 
                />
                <Route 
                    path="/legacy/lessons/:path/:lessonSlug" 
                    element={
                        <Suspense fallback={<LoadingFallback message="Loading lesson content..." />}>
                            <LessonView />
                        </Suspense>
                    } 
                />
                
                {/* Redirect old paths to games */}
                <Route path="/observatory" element={<Navigate to="/games" replace />} />
                <Route path="/scriptorium" element={<Navigate to="/games" replace />} />
                <Route path="/lessons" element={<Navigate to="/games" replace />} />
                <Route path="/studio" element={<Navigate to="/games" replace />} />
            </Routes>

            {/* Mobile Optimization Components */}
            <PWAInstallPrompt 
                onInstall={() => {
                    setShowPWAPrompt(false);
                    console.log('PWA installed successfully');
                }}
                onDismiss={() => setShowPWAPrompt(false)}
            />
            
            {/* Show push notifications setup for authenticated users */}
            {currentUser && (
                <Box sx={{ 
                    position: 'fixed', 
                    bottom: 80, 
                    right: 16, 
                    zIndex: 1200,
                    display: showPushNotifications ? 'block' : 'none'
                }}>
                    <PushNotifications 
                        onPermissionChange={(granted) => {
                            if (granted) {
                                setShowPushNotifications(false);
                            }
                        }}
                    />
                </Box>
            )}

            {/* Offline gaming indicator */}
            <Box sx={{ 
                position: 'fixed', 
                top: 16, 
                right: 16, 
                zIndex: 1100,
                maxWidth: '90vw'
            }}>
                <OfflineIndicator />
            </Box>
        </>
    );
};

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={noctuaTheme}>
        <CssBaseline />
        <AuthProvider>
          <ExperienceProvider>
            <UsageProvider>
              <Router>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <MobileOptimizedApp />
                  </Suspense>
                </Layout>
              </Router>
            </UsageProvider>
          </ExperienceProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App; 