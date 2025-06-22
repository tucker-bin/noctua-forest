import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

// Import panels
import { SongDetailsPanel } from './panels/SongDetailsPanel';
import { StructuralAnalysisPanel } from './panels/StructuralAnalysisPanel';
import { LyricalThemesPanel } from './panels/LyricalThemesPanel';
import { EmotionalAnalysisPanel } from './panels/EmotionalAnalysisPanel';
import { SongMeaningPanel } from './panels/SongMeaningPanel';
import { MoodTimelinePanel } from './panels/MoodTimelinePanel';
import { ScriptoriumControls } from './ScriptoriumControls';

// Import types
import { SongObservation } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { log } from '../../utils/logger';
import { musicAnalysisService, MusicObservationData, ServiceStatus } from '../../services/musicAnalysisService';

// Mock data for development
const mockObservation: SongObservation = {
  id: '1',
  userId: 'user123',
  timestamp: new Date(),
  songDetails: {
    title: '9/10',
    artistName: 'Jeff Rosenstock',
    albumName: 'POST-',
    duration: '3:41',
    releaseYear: 2018,
    genre: ['Punk', 'Indie Rock']
  },
  structuralAnalysis: {
    tempo: 125,
    timeSignature: '4/4',
    key: 'C Major',
    mode: 'major',
    energy: 78
  },
  lyricalThemes: {
    themes: [
      { name: 'Disappointment', value: 35, color: '#FF6B9D' },
      { name: 'Loneliness', value: 25, color: '#4ECDC4' },
      { name: 'Hope', value: 20, color: '#45B7D1' },
      { name: 'Nostalgia', value: 12, color: '#96CEB4' },
      { name: 'Anger', value: 8, color: '#FECA57' }
    ]
  },
  emotionalAnalysis: {
    emotions: [
      { subject: 'Joy', value: 45, fullMark: 100 },
      { subject: 'Sadness', value: 65, fullMark: 100 },
      { subject: 'Anger', value: 38, fullMark: 100 },
      { subject: 'Fear', value: 22, fullMark: 100 },
      { subject: 'Surprise', value: 55, fullMark: 100 },
      { subject: 'Disgust', value: 15, fullMark: 100 }
    ]
  },
  songMeaning: {
    meaningText: "This song explores themes of disappointment and isolation in modern life, while maintaining an underlying current of resilience. The artist uses vivid imagery to convey the feeling of being let down by circumstances beyond one's control, yet the energetic musical arrangement suggests a defiant response to these challenges.",
    confidence: 0.82
  },
  moodTimeline: {
    points: [
      { section: 'Intro', energyLevel: 65 },
      { section: 'Verse 1', energyLevel: 72 },
      { section: 'Chorus', energyLevel: 88 },
      { section: 'Verse 2', energyLevel: 70 },
      { section: 'Chorus', energyLevel: 90 },
      { section: 'Bridge', energyLevel: 55 },
      { section: 'Outro', energyLevel: 78 }
    ]
  }
};

export const Scriptorium: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [observation, setObservation] = useState<SongObservation | null>(null);
  const [musicObservation, setMusicObservation] = useState<MusicObservationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

  // Load service status on mount
  useEffect(() => {
    const loadServiceStatus = async () => {
      try {
        const status = await musicAnalysisService.getServiceStatus();
        setServiceStatus(status);
      } catch (err) {
        log.error('Failed to load service status:', { error: err });
      }
    };
    
    loadServiceStatus();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!currentUser) {
      setError(t('scriptorium.signin_required', 'Please sign in to analyze music'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      log.info('Analyzing music:', { data: searchQuery });
      
      // Use real API call
      const result = await musicAnalysisService.analyzeLyrics(searchQuery);
      setMusicObservation(result);
      
      // Convert to legacy format for now to keep existing UI working
      const legacyObservation: SongObservation = {
        id: result.id,
        userId: result.metadata.user,
        timestamp: new Date(result.metadata.timestamp),
        songDetails: {
          ...result.musicMetadata.songDetails,
          releaseYear: result.musicMetadata.songDetails.releaseYear
        },
        structuralAnalysis: {
          tempo: Math.round(Math.random() * 60) + 100, // Mock for now
          timeSignature: '4/4',
          key: 'C Major',
          mode: 'major',
          energy: Math.round(Math.random() * 40) + 60
        },
        lyricalThemes: {
          themes: result.enhancedAnalysis.lyricalThemes
        },
        emotionalAnalysis: {
          emotions: result.enhancedAnalysis.emotionalAnalysis
        },
        songMeaning: {
          meaningText: `Musical observation reveals ${result.data.patterns.length} distinct patterns in this piece. The analysis shows ${result.musicMetadata.confidence > 0.7 ? 'high confidence' : 'moderate confidence'} in pattern recognition.`,
          confidence: result.musicMetadata.confidence
        },
        moodTimeline: {
          points: result.enhancedAnalysis.moodTimeline
        }
      };
      
      setObservation(legacyObservation);
      setShowDemo(false);
    } catch (err) {
      log.error('Music analysis failed:', { error: err });
      setError(err instanceof Error ? err.message : t('scriptorium.search_error', 'Failed to analyze music. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    setObservation(mockObservation);
    setShowDemo(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Noto Sans", sans-serif',
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.forest.accent}, ${theme.palette.forest.blue})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          <AudiotrackIcon sx={{ mr: 2, verticalAlign: 'middle', color: theme.palette.forest.accent }} />
          {t('scriptorium.title', 'Song Scriptorium')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          {t('scriptorium.subtitle', 'Observe the hidden patterns in music - from structural elements to emotional landscapes')}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('scriptorium.search_placeholder', 'Search by song title, artist, or lyrics...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
              color: 'black',
              minWidth: 120,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.forest.primary}DD, ${theme.palette.forest.secondary}DD)`,
              }
            }}
          >
            {t('scriptorium.observe', 'Observe')}
          </Button>
        </Box>
        
        {!currentUser && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('scriptorium.signin_prompt', 'Sign in to save your musical observations')}
          </Alert>
        )}
        
        {/* Service Status Indicator */}
        {serviceStatus && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Chip
              label={serviceStatus.musixmatchConfigured ? 'Enhanced Mode' : 'Basic Mode'}
              color={serviceStatus.musixmatchConfigured ? 'success' : 'default'}
              size="small"
            />
            <Chip
              label="Pattern Analysis"
              color={serviceStatus.features.patternAnalysis ? 'success' : 'default'}
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Demo Mode Prompt */}
      {showDemo && !observation && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="outlined"
            onClick={handleDemoMode}
            sx={{ 
              borderColor: theme.palette.forest.blue, 
              color: theme.palette.forest.blue,
              '&:hover': {
                borderColor: theme.palette.forest.blue,
                backgroundColor: `${theme.palette.forest.blue}20`,
              }
            }}
          >
            {t('scriptorium.try_demo', 'Try Demo with Sample Song')}
          </Button>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Observation Results */}
      {observation && (
        <>
          {/* Controls */}
          <ScriptoriumControls observation={observation} />
          
          {/* Dashboard Grid */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <SongDetailsPanel data={observation.songDetails} />
                </Grid>
                <Grid item xs={12}>
                  <StructuralAnalysisPanel data={observation.structuralAnalysis} />
                </Grid>
                <Grid item xs={12}>
                  <LyricalThemesPanel data={observation.lyricalThemes} />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Right Column */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <EmotionalAnalysisPanel data={observation.emotionalAnalysis} />
                </Grid>
                <Grid item xs={12}>
                  <SongMeaningPanel data={observation.songMeaning} />
                </Grid>
                <Grid item xs={12}>
                  <MoodTimelinePanel data={observation.moodTimeline} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Scriptorium; 