import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  School,
  CheckCircle,
  RadioButtonUnchecked,
  NavigateNext,
  Lock,
  Star,
  TrendingUp,
  Explore
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { OrionOwl } from '../mascot/OrionOwl';

interface LessonInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  locked: boolean;
  progress?: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  lessons: LessonInfo[];
  totalProgress: number;
}

const LessonList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in production this would come from the backend
  const learningPaths: LearningPath[] = [
    {
      id: 'celestial_observer',
      name: t('paths.celestial_observer', 'Celestial Observer'),
      description: t('paths.celestial_observer.description', 'Begin your journey by learning to observe patterns like stars in the night sky'),
      icon: <Explore />,
      totalProgress: 33,
      lessons: [
        {
          id: 'first_light',
          title: t('lessons.celestial_observer.first_light.title'),
          description: 'Introduction to sound observation and basic pattern recognition',
          duration: '20 min',
          difficulty: 'beginner',
          completed: true,
          locked: false,
          progress: 100
        },
        {
          id: 'star_patterns',
          title: t('lessons.celestial_observer.star_patterns.title'),
          description: 'Explore universal patterns that appear across languages',
          duration: '25 min',
          difficulty: 'beginner',
          completed: false,
          locked: false,
          progress: 60
        },
        {
          id: 'constellation_mapping',
          title: t('lessons.celestial_observer.constellation_mapping.title'),
          description: 'Learn to connect related sounds and create pattern networks',
          duration: '30 min',
          difficulty: 'intermediate',
          completed: false,
          locked: false,
          progress: 0
        },
        {
          id: 'night_vision',
          title: 'Night Vision: Advanced Pattern Recognition',
          description: 'Develop skills to recognize subtle and complex patterns',
          duration: '35 min',
          difficulty: 'intermediate',
          completed: false,
          locked: true,
          progress: 0
        }
      ]
    },
    {
      id: 'pattern_navigator',
      name: t('paths.pattern_navigator', 'Pattern Navigator'),
      description: t('paths.pattern_navigator.description', 'Advanced techniques for navigating and creating complex pattern systems'),
      icon: <TrendingUp />,
      totalProgress: 0,
      lessons: [
        {
          id: 'advanced_mapping',
          title: 'Advanced Pattern Mapping',
          description: 'Master complex pattern relationships and networks',
          duration: '40 min',
          difficulty: 'advanced',
          completed: false,
          locked: true,
          progress: 0
        }
      ]
    }
  ];

  const handleLessonClick = (pathId: string, lessonId: string, locked: boolean) => {
    if (!locked) {
      navigate(`/lessons/${pathId}/${lessonId}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const currentPath = learningPaths[activeTab];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%'
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4, 
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px !important'
        }}
      >
        <Box sx={{ mb: 6, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' } }}>
            {t('lessons.title', 'Learning Paths')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' }, lineHeight: 1.6 }}>
            {t('lessons.subtitle', 'Choose your path and begin your journey of discovery')}
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper sx={{ mb: 4, borderRadius: 2, width: '100%' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 3,
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            >
              {learningPaths.map((path, index) => (
                <Tab
                  key={path.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                      {path.icon}
                      <span>{path.name}</span>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>

          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'center', lg: 'flex-start' },
            justifyContent: 'center',
            width: '100%'
          }}>
            {/* Sidebar */}
            <Box sx={{ 
              flex: { lg: '0 0 350px' },
              width: { xs: '100%', sm: '80%', md: '60%', lg: '350px' },
              maxWidth: '500px'
            }}>
              <Paper sx={{ p: 4, mb: 3, borderRadius: 2, textAlign: { xs: 'center', lg: 'left' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: { xs: 'center', lg: 'flex-start' } }}>
                  {currentPath.icon}
                  <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
                    {currentPath.name}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 3 }}>
                  {currentPath.description}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                    Overall Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={currentPath.totalProgress} 
                    sx={{ height: 10, borderRadius: 5, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentPath.totalProgress}% Complete
                  </Typography>
                </Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {currentPath.lessons.filter(l => l.completed).length} of {currentPath.lessons.length} lessons completed
                </Typography>
              </Paper>

              <Box sx={{ textAlign: 'center' }}>
                <OrionOwl
                  size={120}
                  mood="wise"
                  showBubble={true}
                  bubbleText={t('lessons.owl_encouragement', "You're doing great! Keep exploring!")}
                  animate={true}
                  glowIntensity="medium"
                  interactive={true}
                />
              </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ 
              flex: 1, 
              maxWidth: { xs: '100%', lg: '750px' },
              width: '100%'
            }}>
              <List sx={{ p: 0 }}>
                {currentPath.lessons.map((lesson, index) => (
                  <Card key={lesson.id} sx={{ 
                    mb: 3, 
                    opacity: lesson.locked ? 0.6 : 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': lesson.locked ? {} : {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.3s ease'
                  }}>
                    <ListItemButton
                      onClick={() => handleLessonClick(currentPath.id, lesson.id, lesson.locked)}
                      disabled={lesson.locked}
                      sx={{ p: 3 }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        {lesson.completed ? (
                          <CheckCircle color="success" sx={{ fontSize: 32 }} />
                        ) : lesson.locked ? (
                          <Lock color="disabled" sx={{ fontSize: 32 }} />
                        ) : (
                          <RadioButtonUnchecked color="primary" sx={{ fontSize: 32 }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        sx={{ ml: 2 }}
                        primary={
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.125rem', md: '1.25rem' }, fontWeight: 600 }}>
                              Lesson {index + 1}: {lesson.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={lesson.difficulty} 
                                size="small"
                                color={getDifficultyColor(lesson.difficulty)}
                                sx={{ fontWeight: 500 }}
                              />
                              <Chip 
                                label={lesson.duration} 
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                              {lesson.description}
                            </Typography>
                            {lesson.progress !== undefined && lesson.progress > 0 && !lesson.completed && (
                              <Box sx={{ mt: 2 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={lesson.progress} 
                                  sx={{ height: 6, borderRadius: 3, mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {lesson.progress}% Complete
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      {!lesson.locked && (
                        <NavigateNext color="action" sx={{ fontSize: 28 }} />
                      )}
                    </ListItemButton>
                  </Card>
                ))}
              </List>

              {currentPath.lessons.every(l => l.locked || l.completed) && (
                <Alert severity="info" sx={{ mt: 4, p: 3, borderRadius: 2, fontSize: '1rem' }}>
                  {currentPath.lessons.every(l => l.completed) 
                    ? t('lessons.path_complete', 'Congratulations! You have completed all lessons in this path.')
                    : t('lessons.unlock_more', 'Complete previous lessons to unlock more content.')
                  }
                </Alert>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LessonList; 