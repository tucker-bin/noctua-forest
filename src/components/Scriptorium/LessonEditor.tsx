import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DashboardCard } from './DashboardCard';
import { SongObservation } from './types';
import { ScriptoriumLesson } from '../../../node-backend/src/types/lesson.types';
import { PatternType } from '../../../node-backend/src/types/observation';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import { ExerciseEditor } from './ExerciseEditor';
import { LessonPreview } from './LessonPreview';
import { PatternGraph } from './PatternGraph';
import { logger } from '../../utils/logger';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lesson-tabpanel-${index}`}
      aria-labelledby={`lesson-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface LessonEditorProps {
  observation: SongObservation;
  onSave: (lesson: ScriptoriumLesson) => void;
  onCancel: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  observation,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [title, setTitle] = useState(`Musical Patterns in "${observation.songDetails.title}"`);
  const [description, setDescription] = useState('');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [exercises, setExercises] = useState<ScriptoriumLesson['exercises']>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const lesson: ScriptoriumLesson = {
      id: '', // Will be set by backend
      path: 'pattern-navigator',
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      description,
      order: 0, // Will be set by backend
      duration: '30 minutes',
      difficulty,
      content: {
        sections: [
          {
            type: 'welcome',
            title: 'Introduction',
            content: `In this lesson, we'll explore musical patterns through "${observation.songDetails.title}" by ${observation.songDetails.artistName}.`
          },
          {
            type: 'examples',
            title: 'Pattern Analysis',
            content: 'Let\'s examine the patterns found in this piece:',
            examples: observation.lyricalThemes.themes
              .filter(theme => selectedPatterns.includes(theme.name))
              .map(theme => ({
                text: theme.name,
                explanation: `${theme.name} appears with ${theme.value}% prominence in the piece.`
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
        patterns: observation.lyricalThemes.themes
          .filter(theme => selectedPatterns.includes(theme.name))
          .map(theme => ({
            type: theme.name as PatternType,
            examples: [theme.name],
            explanation: `${theme.name} creates emotional resonance through consistent presence`,
            significance: theme.value / 100
          }))
      },
      exercises,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const response = await fetch('/api/lessons/scriptorium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lesson })
      });

      if (!response.ok) {
        throw new Error('Failed to save lesson');
      }

      const savedLesson = await response.json();
      return savedLesson;
    } catch (err) {
      logger.error('Failed to save lesson:', { error: err });
      setError(t('scriptorium.save_error', 'Failed to save lesson. Please try again.'));
      throw err;
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);
      
      // First save the lesson
      const savedLesson = await handleSave();
      
      // Then publish it
      const response = await fetch(`/api/lessons/scriptorium/${savedLesson.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to publish lesson');
      }

      const publishedLesson = await response.json();
      logger.info('Lesson published successfully:', { lessonId: publishedLesson.id });
      
      onSave(publishedLesson);
    } catch (err) {
      logger.error('Failed to publish lesson:', { error: err });
      setError(t('scriptorium.publish_error', 'Failed to publish lesson. Please try again.'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const previewLesson: ScriptoriumLesson = {
    id: 'preview',
    path: 'pattern-navigator',
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title,
    description,
    order: 0,
    duration: '30 minutes',
    difficulty,
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Introduction',
          content: `In this lesson, we'll explore musical patterns through "${observation.songDetails.title}" by ${observation.songDetails.artistName}.`
        },
        {
          type: 'examples',
          title: 'Pattern Analysis',
          content: 'Let\'s examine the patterns found in this piece:',
          examples: observation.lyricalThemes.themes
            .filter(theme => selectedPatterns.includes(theme.name))
            .map(theme => ({
              text: theme.name,
              explanation: `${theme.name} appears with ${theme.value}% prominence in the piece.`
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
      patterns: observation.lyricalThemes.themes
        .filter(theme => selectedPatterns.includes(theme.name))
        .map(theme => ({
          type: theme.name as PatternType,
          examples: [theme.name],
          explanation: `${theme.name} creates emotional resonance through consistent presence`,
          significance: theme.value / 100
        }))
    },
    exercises,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={t('scriptorium.edit', 'Edit')} />
        <Tab label={t('scriptorium.patterns', 'Patterns')} />
        <Tab label={t('scriptorium.exercises', 'Exercises')} />
        <Tab label={t('scriptorium.preview', 'Preview')} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={activeTab} index={0}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Lesson Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lesson Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Difficulty Level</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty Level"
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>

          <DashboardCard title={t('scriptorium.patterns', 'Patterns')}>
            <Stack spacing={2}>
              {observation.lyricalThemes.themes.map((theme) => (
                <FormControlLabel
                  key={theme.name}
                  control={
                    <Checkbox
                      checked={selectedPatterns.includes(theme.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPatterns([...selectedPatterns, theme.name]);
                        } else {
                          setSelectedPatterns(selectedPatterns.filter(p => p !== theme.name));
                        }
                      }}
                    />
                  }
                  label={theme.name}
                />
              ))}
            </Stack>
          </DashboardCard>
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ height: 600 }}>
          <PatternGraph
            patterns={observation.lyricalThemes.themes
              .filter(theme => selectedPatterns.includes(theme.name))
              .map(theme => ({
                type: theme.name as PatternType,
                examples: [theme.name],
                explanation: `${theme.name} creates emotional resonance through consistent presence`,
                significance: theme.value / 100
              }))}
          />
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ExerciseEditor
          exercises={exercises}
          onExercisesChange={setExercises}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <LessonPreview
          lesson={previewLesson}
          onEdit={() => setActiveTab(0)}
        />
      </TabPanel>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          {t('scriptorium.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disabled={!title || !description || selectedPatterns.length === 0 || isPublishing}
        >
          {t('scriptorium.save_lesson', 'Save Lesson')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePublish}
          startIcon={<PublishIcon />}
          disabled={!title || !description || selectedPatterns.length === 0 || isPublishing}
        >
          {isPublishing 
            ? t('scriptorium.publishing', 'Publishing...')
            : t('scriptorium.publish', 'Publish to Community')
          }
        </Button>
      </Box>
    </Box>
  );
}; 