import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid,
  Button,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

// Import components
import { LessonEditor } from './LessonEditor';
import { LessonPreview } from './LessonPreview';

// Import types
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { ScriptoriumLesson } from '../../../node-backend/src/types/lesson.types';
import { ObservationData, Pattern } from '../../types/observation';
import { PatternType } from '../../../node-backend/src/types/observation';
import { SongObservation, LyricalTheme, LyricalThemesData } from './types';

// Convert ObservationData to SongObservation
const convertToSongObservation = (data: ObservationData): SongObservation => {
  // Extract title and description from patterns
  const firstPattern = data.patterns[0];
  const title = firstPattern?.originalText?.split('\n')[0] || 'Untitled Observation';
  const description = firstPattern?.description || 'No description available';

  // Group patterns by type
  const themes = data.patterns.reduce((acc: LyricalTheme[], pattern, index) => {
    const value = pattern.segments.length * 10; // Simple heuristic
    acc.push({
      name: pattern.type,
      value: Math.min(value, 100),
      color: `hsl(${index * 30}, 70%, 50%)`
    });
    return acc;
  }, []);

  return {
    id: `local_${Date.now()}`,
    userId: data.metadata?.userId || 'local',
    timestamp: new Date(data.timestamp),
    songDetails: {
      title,
      artistName: 'Observation',
      albumName: 'Pattern Analysis',
      duration: '0:00',
      genre: []
    },
    structuralAnalysis: {
      tempo: 0,
      timeSignature: '4/4',
      key: 'Unknown',
      mode: 'major',
      energy: 0
    },
    lyricalThemes: {
      themes
    },
    emotionalAnalysis: {
      emotions: []
    },
    songMeaning: {
      meaningText: description,
      confidence: 0.5
    },
    moodTimeline: {
      points: []
    }
  };
};

// Convert SongObservation to ScriptoriumLesson
const convertToLesson = (observation: SongObservation): ScriptoriumLesson => {
  return {
    id: observation.id,
    path: 'pattern-navigator',
    slug: observation.songDetails.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: observation.songDetails.title,
    description: observation.songMeaning.meaningText,
    order: 0,
    duration: '30 minutes',
    difficulty: 'intermediate',
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Introduction',
          content: observation.songMeaning.meaningText
        },
        {
          type: 'pattern_sequence',
          title: 'Pattern Analysis',
          content: 'Let\'s examine the patterns found in this piece:',
          patterns: observation.lyricalThemes.themes.map(theme => ({
            type: theme.name as PatternType,
            examples: [theme.name],
            explanation: `${theme.name} appears with ${theme.value}% prominence in the piece.`,
            significance: theme.value / 100
          }))
        }
      ]
    },
    sourceAnalysis: {
      songDetails: {
        title: observation.songDetails.title,
        artist: observation.songDetails.artistName,
        album: observation.songDetails.albumName
      },
      patterns: observation.lyricalThemes.themes.map(theme => ({
        type: theme.name as PatternType,
        examples: [theme.name],
        explanation: `${theme.name} creates emotional resonance through consistent presence`,
        significance: theme.value / 100
      }))
    },
    exercises: [],
    createdAt: observation.timestamp,
    updatedAt: observation.timestamp
  };
};

export const Scriptorium: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'analysis' | 'lesson'>('analysis');
  const [observationData, setObservationData] = useState<ObservationData | null>(null);
  const [songObservation, setSongObservation] = useState<SongObservation | null>(null);
  const [lesson, setLesson] = useState<ScriptoriumLesson | null>(null);

  // Load saved observation from localStorage
  useEffect(() => {
    const savedText = localStorage.getItem('savedObservationText');
    if (savedText) {
      try {
        const data: ObservationData = JSON.parse(savedText);
        setObservationData(data);
        const song = convertToSongObservation(data);
        setSongObservation(song);
        setLesson(convertToLesson(song));
        localStorage.removeItem('savedObservationText'); // Clean up
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        logger.error('Failed to parse saved observation', { 
          error: error.message,
          stack: error.stack
        });
        setError(t('scriptorium.load_error', 'Failed to load observation data'));
      }
    }
  }, [t]);

  // Add lesson saving handler
  const handleSaveLesson = async (lesson: ScriptoriumLesson) => {
    if (!currentUser) {
      setError(t('scriptorium.signin_required', 'Please sign in to save lessons'));
      return;
    }

    try {
      // Save lesson locally first
      const savedLessons = JSON.parse(localStorage.getItem('savedLessons') || '[]');
      const newLesson = {
        ...lesson,
        id: `local_${Date.now()}`,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      savedLessons.push(newLesson);
      localStorage.setItem('savedLessons', JSON.stringify(savedLessons));

      // Try to save to backend if available
      try {
        const response = await fetch('/api/lessons/scriptorium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lesson: newLesson })
        });

        if (response.ok) {
          const savedLesson = await response.json();
          logger.info('Lesson saved to backend', { lessonId: savedLesson.id });
        }
      } catch (err) {
        // Backend save failed, but we already have local save
        const error = err instanceof Error ? err : new Error('Unknown error');
        logger.warn('Failed to save lesson to backend', { 
          error: error.message,
          stack: error.stack
        });
      }
      
      setEditorMode('analysis');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Failed to save lesson', { 
        error: error.message,
        stack: error.stack
      });
      setError(t('scriptorium.lesson_save_error', 'Failed to save lesson. Please try again.'));
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.forest.background,
        pt: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%'
      }}
    >
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
            {editorMode === 'analysis' 
              ? t('scriptorium.title', 'Scriptorium')
              : t('scriptorium.lesson_editor', 'Create Lesson')
            }
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {editorMode === 'analysis'
              ? t('scriptorium.subtitle', 'Transform your observations into engaging lessons')
              : t('scriptorium.lesson_subtitle', 'Create a lesson from your observation')
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!lesson ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('scriptorium.no_observation', 'No observation data available')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('scriptorium.create_observation', 'Create an observation in the Observatory first')}
            </Typography>
          </Box>
        ) : (
          editorMode === 'analysis' ? (
            <LessonPreview
              lesson={lesson}
              onEdit={() => setEditorMode('lesson')}
            />
          ) : (
            <LessonEditor
              observation={songObservation!}
              onSave={handleSaveLesson}
              onCancel={() => setEditorMode('analysis')}
            />
          )
        )}
      </Container>
    </Box>
  );
}; 