import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, useMediaQuery, Typography, Container, Card, Button, Grid, Chip, CardMedia, CardContent, CardActions, Badge, Avatar } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExperienceProvider } from './contexts/ExperienceContext';
import { UsageProvider } from './contexts/UsageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { noctuaTheme } from './theme/noctuaTheme';
import CookieConsentBanner from './components/features/CookieConsentBanner';
import OfflineIndicator from './components/features/OfflineIndicator';
import { WebVitalsMonitor } from './components/features/WebVitalsMonitor';
import { CustomPuzzleGenerator } from './components/features/CustomPuzzleGenerator';
import { motion } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import CreateIcon from '@mui/icons-material/Create';

// Main game experiences
const RhymeMahjongWrapper = lazy(() => import('./components/features/RhymeMahjongWrapper'));
const FlowFinderGameWrapper = lazy(() => import('./components/features/FlowFinderGameWrapper').then(module => ({ default: module.FlowFinderGameWrapper })));

const LoadingFallback: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
    <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#0f1419' }}
    >
        <CircularProgress sx={{ color: '#1976d2' }} />
        <Typography sx={{ mt: 2, color: '#8892b0' }}>{message}</Typography>
    </Box>
);

// Game data structure
interface GameData {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    thumbnail: string;
    gradient: string;
    category: 'puzzle' | 'word' | 'strategy';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    players: string;
    status: 'available' | 'coming-soon' | 'new';
    features: string[];
    playtime: string;
    rating: number;
}

const gameLibrary: GameData[] = [
    {
        id: 'rhyme-mahjong',
        title: 'Rhyme Mahjong',
        subtitle: '3D Pyramid Puzzles',
        description: 'Match rhyming words in beautiful 3D pyramid layouts using traditional Mahjong exposure mechanics.',
        thumbnail: '🏯',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        category: 'puzzle',
        difficulty: 'Medium',
        players: 'Single Player',
        status: 'available',
        features: ['3D Graphics', 'Rhyme Engine', 'Star Progression'],
        playtime: '10-20 min',
        rating: 4.8
    },
    {
        id: 'connections',
        title: 'Noctua Connections',
        subtitle: 'Linguistic Patterns',
        description: 'Find groups of four words connected by phonetic patterns, rhymes, and linguistic structures.',
        thumbnail: '🔤',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        category: 'word',
        difficulty: 'Easy',
        players: 'Single Player',
        status: 'available',
        features: ['NYT Style', 'Star Scoring', 'Hint System'],
        playtime: '5-15 min',
        rating: 4.6
    },
    {
        id: 'word-cascade',
        title: 'Word Cascade',
        subtitle: 'Falling Letters',
        description: 'Build rhyming chains as letters cascade down in this fast-paced word puzzle adventure.',
        thumbnail: '🌊',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        category: 'word',
        difficulty: 'Medium',
        players: 'Single Player',
        status: 'coming-soon',
        features: ['Real-time', 'Combos', 'Leaderboards'],
        playtime: '3-10 min',
        rating: 0
    },
    {
        id: 'rhyme-battle',
        title: 'Rhyme Battle',
        subtitle: 'Multiplayer Duels',
        description: 'Challenge friends in real-time rhyming battles with power-ups and special abilities.',
        thumbnail: '⚔️',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        category: 'strategy',
        difficulty: 'Hard',
        players: 'Multiplayer',
        status: 'coming-soon',
        features: ['Real-time PvP', 'Power-ups', 'Tournaments'],
        playtime: '5-15 min',
        rating: 0
    }
];

// Game Card Component
const GameCard: React.FC<{ game: GameData; onPlay: (gameId: string) => void }> = ({ game, onPlay }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card sx={{
                height: 320,
                background: game.gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                cursor: game.status === 'available' ? 'pointer' : 'default',
                opacity: game.status === 'coming-soon' ? 0.7 : 1,
                '&:hover': {
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                }
            }}>
                {/* Status Badge */}
                {game.status === 'new' && (
                    <Chip 
                        icon={<NewReleasesIcon />}
                        label="NEW" 
                        size="small" 
                        sx={{ 
                            position: 'absolute', 
                            top: 12, 
                            right: 12, 
                            bgcolor: '#ff4444',
                            color: 'white',
                            zIndex: 2
                        }} 
                    />
                )}
                {game.status === 'coming-soon' && (
                    <Chip 
                        label="COMING SOON" 
                        size="small" 
                        sx={{ 
                            position: 'absolute', 
                            top: 12, 
                            right: 12, 
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            zIndex: 2
                        }} 
                    />
                )}

                {/* Game Thumbnail */}
                <Box sx={{ 
                    height: 140, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <Typography variant="h1" sx={{ fontSize: '4rem' }}>
                        {game.thumbnail}
                    </Typography>
                </Box>

                <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {game.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        {game.subtitle}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                        opacity: 0.8, 
                        height: '40px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {game.description}
                    </Typography>

                    {/* Game Stats */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ fontSize: '1rem', color: '#ffd700' }} />
                            <Typography variant="body2">{game.rating || 'New'}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {game.playtime}
                        </Typography>
                    </Box>
                </CardContent>

                {/* Play Button Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered && game.status === 'available' ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => onPlay(game.id)}
                        sx={{
                            bgcolor: 'white',
                            color: 'black',
                            '&:hover': { bgcolor: '#f0f0f0' },
                            fontWeight: 'bold',
                            px: 4
                        }}
                    >
                        PLAY
                    </Button>
                </motion.div>
            </Card>
        </motion.div>
    );
};

const GameApp: React.FC = () => {
    const { currentUser } = useAuth();
    const [viewMode, setViewMode] = useState<'hub' | 'rhyme-mahjong' | 'connections' | 'create'>('hub');
    const [customPuzzle, setCustomPuzzle] = useState<any | null>(null);
    const [gameKey, setGameKey] = useState<string>('initial');

    const handlePuzzleGenerated = (puzzle: any) => {
        setCustomPuzzle(puzzle);
        setGameKey(`custom-${Date.now()}`);
        setViewMode('rhyme-mahjong');
    };

    const handlePlayGame = (gameId: string) => {
        setGameKey(`${gameId}-${Date.now()}`);
        if (gameId === 'rhyme-mahjong') {
            setViewMode('rhyme-mahjong');
        } else if (gameId === 'connections') {
            setViewMode('connections');
        }
        // Add other games as they become available
    };

    const handleReturnToHub = () => {
        setViewMode('hub');
    };

    const availableGames = gameLibrary.filter(game => game.status === 'available');
    const comingSoonGames = gameLibrary.filter(game => game.status === 'coming-soon');

    const renderContent = () => {
        switch (viewMode) {
            case 'create':
                return <CustomPuzzleGenerator onPuzzleGenerated={handlePuzzleGenerated} onCancel={handleReturnToHub} />;
            case 'rhyme-mahjong':
                return (
                    <Box sx={{ bgcolor: '#0f1419', minHeight: '100vh' }}>
                        <Button onClick={handleReturnToHub} sx={{ m: 2, color: '#8892b0' }}>← Back to Library</Button>
                        <RhymeMahjongWrapper key={gameKey} />
                    </Box>
                );
            case 'connections':
                return (
                    <Box sx={{ bgcolor: '#0f1419', minHeight: '100vh' }}>
                        <Button onClick={handleReturnToHub} sx={{ m: 2, color: '#8892b0' }}>← Back to Library</Button>
                        <FlowFinderGameWrapper />
                    </Box>
                );
            case 'hub':
            default:
                return (
                    <Box sx={{ 
                        background: 'linear-gradient(180deg, #0f1419 0%, #1a1f36 100%)',
                        minHeight: '100vh',
                        color: '#e6f1ff'
                    }}>
                        {/* Header */}
                        <Box sx={{ p: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <Container maxWidth="lg">
                                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ 
                                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent'
                                }}>
                                    🌙 Noctua Forest
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#8892b0', mb: 3 }}>
                                    Your Linguistic Puzzle Game Library
                                </Typography>
                                
                                {/* Stats Bar */}
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32 }}>
                                            <PeopleIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#8892b0' }}>Games Available</Typography>
                                            <Typography variant="h6" fontWeight="bold">{availableGames.length}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ bgcolor: '#f5576c', width: 32, height: 32 }}>
                                            <TrendingUpIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#8892b0' }}>Coming Soon</Typography>
                                            <Typography variant="h6" fontWeight="bold">{comingSoonGames.length}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Container>
                        </Box>

                        <Container maxWidth="lg" sx={{ py: 4 }}>
                            {/* Available Games Section */}
                            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                                🎮 Play Now
                            </Typography>
                            <Grid container spacing={3} sx={{ mb: 6 }}>
                                {availableGames.map((game) => (
                                    <Grid item xs={12} sm={6} md={4} key={game.id}>
                                        <GameCard game={game} onPlay={handlePlayGame} />
                                    </Grid>
                                ))}
                                
                                {/* Custom Puzzle Creator Card */}
                                <Grid item xs={12} sm={6} md={4}>
                                    <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.2 }}>
                                        <Card sx={{
                                            height: 320,
                                            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                            color: 'white',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: '2px dashed rgba(255,255,255,0.3)',
                                            '&:hover': {
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                                borderColor: 'rgba(255,255,255,0.5)'
                                            }
                                        }} onClick={() => setViewMode('create')}>
                                            <Box sx={{ 
                                                height: '100%',
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                p: 3
                                            }}>
                                                <CreateIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.7 }} />
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                    Create Custom Puzzle
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    Build your own rhyme puzzles from any text
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            </Grid>

                            {/* Coming Soon Section */}
                            {comingSoonGames.length > 0 && (
                                <>
                                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                                        🚀 Coming Soon
                                    </Typography>
                                    <Grid container spacing={3}>
                                        {comingSoonGames.map((game) => (
                                            <Grid item xs={12} sm={6} md={4} key={game.id}>
                                                <GameCard game={game} onPlay={handlePlayGame} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </>
                            )}
                        </Container>
                    </Box>
                );
        }
    };

    return (
        <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
            <Suspense fallback={<LoadingFallback />}>
                {renderContent()}
            </Suspense>
            
            {/* Modals and overlays will go here */}
            <CookieConsentBanner />
            <OfflineIndicator />
            {currentUser && <WebVitalsMonitor />}
        </Box>
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
                            <Routes>
                                <Route path="/" element={<GameApp />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </UsageProvider>
                    </ExperienceProvider>
                </AuthProvider>
            </ThemeProvider>
        </I18nextProvider>
    );
};

export default App; 