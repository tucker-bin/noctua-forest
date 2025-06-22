import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Forest, Science } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { ForestBackground } from './ForestBackground';
import './LearningProgress.css';

const JourneyPath = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4px',
    height: '100%',
    background: `linear-gradient(to bottom, 
      ${theme.palette.success.light}, 
      ${theme.palette.primary.main})`,
    zIndex: 0,
  }
}));

const PathNode = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  backdropFilter: 'blur(10px)',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    left: '-28px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: theme.palette.primary.main,
    border: `3px solid ${theme.palette.background.paper}`,
    zIndex: 1,
  }
}));

interface ProgressIndicatorProps {
  progress: number;
}

const ProgressIndicator = styled(Box)<ProgressIndicatorProps>(({ theme, progress }) => ({
  position: 'relative',
  height: '12px',
  borderRadius: '6px',
  background: 'rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${progress}%`,
    height: '100%',
    background: `linear-gradient(90deg, 
      ${theme.palette.success.main}, 
      ${theme.palette.primary.main})`,
    transition: 'width 0.3s ease-in-out',
  }
}));

interface PathProgress {
  id: string;
  name: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  icon: React.ReactNode;
  description: string;
  theme: {
    icon: React.ReactNode;
    color: string;
    image: string;
  };
}

export const LearningProgress: React.FC = () => {
  const { t } = useTranslation();
  
  const learningPaths: PathProgress[] = [
    {
      id: 'explorer',
      name: t('paths.explorer'),
      progress: 40,
      completedLessons: 2,
      totalLessons: 5,
      icon: <Forest sx={{ fontSize: 40, color: 'success.light' }} />,
      description: 'Begin your journey through the enchanted forest, discovering basic patterns in the rustling leaves and gentle streams.',
      theme: {
        icon: <Forest />,
        color: 'success.light',
        image: '/forest-path.jpg'
      }
    },
    {
      id: 'navigator',
      name: t('paths.navigator'),
      progress: 0,
      completedLessons: 0,
      totalLessons: 5,
      icon: <Science sx={{ fontSize: 40, color: 'primary.main' }} />,
      description: 'Ascend to the observatory at the forest\'s peak, where you\'ll master the art of pattern navigation.',
      theme: {
        icon: <Science />,
        color: 'primary.main',
        image: '/observatory.jpg'
      }
    }
  ];

  return (
    <ForestBackground>
      <Typography variant="h5" gutterBottom sx={{ color: 'common.white', mb: 4 }}>
        {t('profile.learning_journey')}
      </Typography>
      
      <JourneyPath>
        {learningPaths.map((path, index) => (
          <Box key={path.id} sx={{ position: 'relative', pl: 4 }}>
            <PathNode elevation={3} className="path-node">
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  className="node-icon"
                  sx={{ 
                    p: 1, 
                    borderRadius: '50%', 
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 2
                  }}
                >
                  {path.icon}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
                      {path.name}
                    </Typography>
                    <Chip 
                      size="small"
                      label={`${path.completedLessons}/${path.totalLessons} Lessons`}
                      sx={{ 
                        bgcolor: path.id === 'explorer' ? 'success.main' : 'primary.main',
                        color: 'common.white'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {path.description}
                  </Typography>
                  
                  <ProgressIndicator progress={path.progress} />
                  
                  {path.completedLessons > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {[...Array(path.totalLessons)].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: i < path.completedLessons ? 
                              path.id === 'explorer' ? 'success.main' : 'primary.main'
                              : 'action.disabled'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </PathNode>
          </Box>
        ))}
      </JourneyPath>
    </ForestBackground>
  );
}; 