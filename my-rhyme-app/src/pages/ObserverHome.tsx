import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Grid,
  Card,
  CardContent,
  alpha,
  keyframes,
} from '@mui/material';
import { 
  AutoAwesome as SparkleIcon,
  Psychology as BrainIcon,
  Share as ShareIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { noctuaColors, customStyles } from '../theme/noctuaTheme';
import { OrionOwl } from '../components/OrionOwl';
import { OnboardingJourney } from '../components/OnboardingJourney';
import { ControlDeck } from '../components/ControlDeck';
import { RhymeScoreSystem } from '../components/RhymeScoreSystem';
import { Sparkle } from '../components/Sparkle';
import type { PatternControl } from '../components/ControlDeck';

// Animation keyframes
// const twinkle = keyframes`
//   0%, 100% { opacity: 0.3; }
//   50% { opacity: 0.8; }
// `;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const ObserverHome: React.FC = () => {
  const navigate = useNavigate();
  const [showOrion, setShowOrion] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check if user has completed onboarding
    return !localStorage.getItem('onboardingCompleted');
  });
  const [showControlDeck, setShowControlDeck] = useState(false);
  const [controlDeckCollapsed, setControlDeckCollapsed] = useState(false);
  
  // Pattern visibility state
  const [patternControls, setPatternControls] = useState<PatternControl[]>([
    { id: 'perfectRhymes', name: 'Perfect Rhymes', color: noctuaColors.highlights.perfectRhymes, description: 'Exact sound matches', enabled: true, icon: <Sparkle /> },
    { id: 'assonance', name: 'Assonance', color: noctuaColors.highlights.assonance, description: 'Vowel sound patterns', enabled: true, icon: <Sparkle /> },
    { id: 'consonance', name: 'Consonance', color: noctuaColors.highlights.consonance, description: 'Consonant patterns', enabled: true, icon: <Sparkle /> },
    { id: 'alliteration', name: 'Alliteration', color: noctuaColors.highlights.alliteration, description: 'Starting sound patterns', enabled: true, icon: <Sparkle /> },
  ]);

  // Gamification state
  // const [rhymeScore, setRhymeScore] = useState(0);
  // const [currentStreak, setCurrentStreak] = useState(0);
  // const [achievements, setAchievements] = useState([
  //   { id: 'firstRhyme', name: 'First Flight', description: 'Discover your first rhyme', icon: null, unlocked: false, progress: 0, maxProgress: 1, rarity: 'common' as const },
  //   { id: 'streakMaster', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: null, unlocked: false, progress: 0, maxProgress: 7, rarity: 'rare' as const },
  //   { id: 'patternExplorer', name: 'Pattern Explorer', description: 'Find all pattern types', icon: null, unlocked: false, progress: 0, maxProgress: 4, rarity: 'epic' as const },
  // ]);
  // const [level, setLevel] = useState(1);
  // const [levelProgress, setLevelProgress] = useState(0);
  // const [recentPatterns, setRecentPatterns] = useState<string[]>([]);

  useEffect(() => {
    // Show Orion after a short delay
    setTimeout(() => setShowOrion(true), 500);
  }, []);

  const features = [
    {
      icon: <SparkleIcon sx={{ fontSize: 40 }} />,
      title: 'Phonetic Intelligence',
      description: 'Our AI discovers hidden rhyme patterns across perfect rhymes, assonance, consonance, and alliteration.',
    },
    {
      icon: <BrainIcon sx={{ fontSize: 40 }} />,
      title: 'Deep Analysis',
      description: 'See beyond surface-level rhymes. Understand the musical architecture of your words.',
    },
    {
      icon: <ShareIcon sx={{ fontSize: 40 }} />,
      title: 'Share Discoveries',
      description: 'Export your analyses and share the hidden patterns you discover with collaborators.',
    },
  ];

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
    setShowControlDeck(true);
  };

  const handleTogglePattern = (patternId: string) => {
    setPatternControls(prev => 
      prev.map(p => p.id === patternId ? { ...p, enabled: !p.enabled } : p)
    );
  };

  const handleToggleAllPatterns = (enabled: boolean) => {
    setPatternControls(prev => 
      prev.map(p => ({ ...p, enabled }))
    );
  };

  if (showOnboarding) {
    return <OnboardingJourney onComplete={handleOnboardingComplete} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: noctuaColors.deepIndigo,
        overflow: 'hidden',
        ...customStyles.starfield,
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            py: 8,
          }}
        >
          {/* Orion Mascot */}
          {showOrion && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                animation: `${fadeInUp} 1s ease-out`,
                zIndex: 10,
              }}
            >
              <OrionOwl 
                mood="happy" 
                size={60}
                showBubble
                bubbleText="Welcome, Observer!"
                animate
              />
            </Box>
          )}

          {/* Main Headline */}
          <Typography
            variant="h1"
            sx={{
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              background: `linear-gradient(135deg, ${noctuaColors.moonbeam} 0%, ${noctuaColors.brightSkyBlue} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${fadeInUp} 1s ease-out`,
            }}
          >
            See The Music In Your Words
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h5"
            sx={{
              mb: 5,
              color: noctuaColors.mutedSilver,
              maxWidth: 800,
              mx: 'auto',
              fontWeight: 400,
              animation: `${fadeInUp} 1s ease-out 0.2s`,
              animationFillMode: 'both',
            }}
          >
            Discover hidden phonetic patterns in text with AI-powered analysis. 
            Transform your writing into a constellation of connected sounds.
          </Typography>

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            onClick={() => navigate('/analyze')}
            sx={{
              px: 5,
              py: 2,
              fontSize: '1.125rem',
              fontWeight: 600,
              animation: `${fadeInUp} 1s ease-out 0.4s`,
              animationFillMode: 'both',
              background: noctuaColors.vibrantGold,
              color: noctuaColors.deepIndigo,
              '&:hover': {
                background: alpha(noctuaColors.vibrantGold, 0.9),
                transform: 'translateY(-2px)',
                boxShadow: `0 10px 30px ${alpha(noctuaColors.vibrantGold, 0.3)}`,
              },
            }}
          >
            Begin Observing
          </Button>

          {/* Scroll Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: noctuaColors.mutedSilver,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Scroll to explore
              <Box
                sx={{
                  width: 2,
                  height: 30,
                  background: `linear-gradient(to bottom, ${noctuaColors.mutedSilver}, transparent)`,
                }}
              />
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          py: 12,
          backgroundColor: alpha(noctuaColors.midnightBlue, 0.5),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${noctuaColors.charcoal}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{
              mb: 8,
              fontWeight: 600,
              color: noctuaColors.moonbeam,
            }}
          >
            How The Observatory Works
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: alpha(noctuaColors.midnightBlue, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${noctuaColors.charcoal}`,
                    transition: 'all 0.3s ease-in-out',
                    animation: `${fadeInUp} 1s ease-out ${0.6 + index * 0.2}s`,
                    animationFillMode: 'both',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: noctuaColors.brightSkyBlue,
                      boxShadow: `0 20px 40px ${alpha(noctuaColors.brightSkyBlue, 0.2)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(noctuaColors.brightSkyBlue, 0.1),
                        color: noctuaColors.brightSkyBlue,
                        mb: 3,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: noctuaColors.moonbeam,
                        mb: 2,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: noctuaColors.mutedSilver,
                        lineHeight: 1.7,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* CTA Section */}
          <Box
            sx={{
              mt: 10,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                mb: 4,
                fontWeight: 600,
                color: noctuaColors.moonbeam,
              }}
            >
              Ready to discover the hidden patterns?
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/analyze')}
              sx={{
                px: 4,
                py: 1.5,
                borderColor: noctuaColors.vibrantGold,
                color: noctuaColors.vibrantGold,
                '&:hover': {
                  borderColor: noctuaColors.vibrantGold,
                  backgroundColor: alpha(noctuaColors.vibrantGold, 0.1),
                },
              }}
            >
              Start Your First Observation
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Rhyme Score System */}
      {/* <RhymeScoreSystem
        totalScore={rhymeScore}
        currentStreak={currentStreak}
        longestStreak={7}
        achievements={achievements}
        level={level}
        currentLevelProgress={levelProgress}
        nextLevelThreshold={100}
        recentPatterns={recentPatterns}
      /> */}

      {/* Control Deck */}
      {showControlDeck && (
        <ControlDeck
          patterns={patternControls}
          onTogglePattern={handleTogglePattern}
          onToggleAll={handleToggleAllPatterns}
          collapsed={controlDeckCollapsed}
          onToggleCollapse={() => setControlDeckCollapsed(!controlDeckCollapsed)}
        />
      )}
    </Box>
  );
};

export default ObserverHome; 