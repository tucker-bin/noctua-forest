import OnboardingModal from './components/OnboardingModal';

const AppContent: React.FC = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const { currentUser, signInAnon } = useAuth();
    const { usageInfo, isLoading } = useUsage();
    const [showOnboarding, setShowOnboarding] = useState(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        return !hasSeenOnboarding;
    });

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
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
                    <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
                </UsageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}; 