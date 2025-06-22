import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { log } from '../../utils/logger';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  Lightbulb,
  PlayArrow,
  Pause,
  VolumeUp
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { OrionOwl } from '../mascot/OrionOwl';

interface LessonSection {
  type: 'welcome' | 'content' | 'practice' | 'exercise' | 'reflection';
  title: string;
  content: any;
  completed?: boolean;
}

const LessonView: React.FC = () => {
  const { path, lessonSlug } = useParams<{ path: string; lessonSlug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionProgress, setSectionProgress] = useState<Record<number, boolean>>({});
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    loadLesson();
  }, [path, lessonSlug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLesson = async () => {
    try {
      setLoading(true);
      // Load lesson content from translations
      const lessonKey = `${path}.${lessonSlug}`;
      const lessonContent = t(`lessons.${lessonKey}`, { returnObjects: true });
      
      if (typeof lessonContent === 'object') {
        setLesson(lessonContent);
      }
    } catch (error) {
      log.error('Error loading lesson:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionComplete = (sectionIndex: number) => {
    setSectionProgress(prev => ({
      ...prev,
      [sectionIndex]: true
    }));
  };

  const handleExerciseAnswer = (exerciseId: string, answer: string) => {
    setExerciseAnswers(prev => ({
      ...prev,
      [exerciseId]: answer
    }));
  };

  const toggleHint = (exerciseId: string) => {
    setShowHints(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language;
      utterance.rate = 0.9;
      
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
      }
    }
  };

  const renderSection = (section: any, sectionKey: string, index: number) => {
    const isExpanded = expandedSections[index] !== false;

    return (
      <Card key={sectionKey} sx={{ mb: 3 }}>
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => toggleSection(index)}
          >
            <Typography variant="h6" gutterBottom>
              {section.title}
            </Typography>
            <IconButton size="small">
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          <Collapse in={isExpanded}>
            {section.description && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" paragraph>
                  {section.description}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleTextToSpeech(section.description)}
                  sx={{ ml: 1 }}
                >
                  <VolumeUp />
                </IconButton>
              </Box>
            )}

            {section.example && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                  {section.example.text}
                </Typography>
                {section.example.focus_points && (
                  <Box sx={{ mt: 2 }}>
                    {section.example.focus_points.map((point: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={point}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {section.examples && (
              <Box sx={{ mt: 2 }}>
                {section.examples.map((example: any, idx: number) => (
                  <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {example.text}
                    </Typography>
                    {example.pattern && (
                      <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                        Pattern: {example.pattern}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {section.exercises && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Practice Exercises
                </Typography>
                {Object.entries(section.exercises).map(([exerciseKey, exercise]: [string, any]) => (
                  <Box key={exerciseKey} sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      {exercise.instructions || exercise.description}
                    </Typography>
                    
                    {exercise.options && (
                      <FormControl component="fieldset" sx={{ mt: 1 }}>
                        <RadioGroup
                          value={exerciseAnswers[exerciseKey] || ''}
                          onChange={(e) => handleExerciseAnswer(exerciseKey, e.target.value)}
                        >
                          {exercise.options.map((option: string, idx: number) => (
                            <FormControlLabel
                              key={idx}
                              value={option}
                              control={<Radio />}
                              label={option}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    )}

                    {exercise.hint && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Lightbulb />}
                          onClick={() => toggleHint(exerciseKey)}
                        >
                          {showHints[exerciseKey] ? 'Hide Hint' : 'Show Hint'}
                        </Button>
                        <Collapse in={showHints[exerciseKey]}>
                          <Alert severity="info" sx={{ mt: 1 }}>
                            {exercise.hint}
                          </Alert>
                        </Collapse>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {section.points && (
              <Box sx={{ mt: 2 }}>
                {section.points.map((point: string, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <CheckCircle color="primary" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                    <Typography variant="body2">{point}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {!sectionProgress[index] && (
              <Box sx={{ mt: 3, textAlign: { xs: 'center', sm: 'right' } }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleSectionComplete(index)}
                >
                  Mark as Complete
                </Button>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!lesson) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Lesson not found
        </Alert>
      </Container>
    );
  }

  const sections = Object.entries(lesson).filter(([key]) => 
    !['title', 'welcome', 'note'].includes(key)
  );

  const progress = Object.keys(sectionProgress).length / sections.length * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: '0 0 300px' }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" gutterBottom>
              {lesson.title}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {Math.round(progress)}% Complete
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <OrionOwl 
                bubbleText={progress === 100 ? "Great job completing this lesson!" : "Keep going, you're doing great!"}
                mood={progress === 100 ? "celebrating" : "wise"}
                showBubble={true}
                size={80}
                glowIntensity={progress === 100 ? "bright" : "medium"}
                interactive={true}
              />
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 4 }}>
            {lesson.welcome && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                  {lesson.welcome.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {lesson.welcome.description}
                </Typography>
              </Box>
            )}

            {sections.map(([sectionKey, section], index) => 
              renderSection(section, sectionKey, index)
            )}

            {lesson.note && (
              <Alert severity="info" sx={{ mt: 4 }}>
                {lesson.note}
              </Alert>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                startIcon={<NavigateBefore />}
                onClick={() => navigate(-1)}
              >
                Previous Lesson
              </Button>
              
              {progress === 100 && (
                <Button
                  variant="contained"
                  endIcon={<NavigateNext />}
                  onClick={() => navigate(`/${path}/lessons/next`)}
                >
                  Next Lesson
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default LessonView; 