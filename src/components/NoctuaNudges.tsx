import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Fade,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimerIcon from '@mui/icons-material/Timer';
import { useTranslation } from 'react-i18next';

interface Nudge {
  id: string;
  prompt: string;
  category: 'poetry' | 'storytelling' | 'wordplay' | 'observation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number; // in minutes
  inspiration?: string;
}

const SAMPLE_NUDGES: Nudge[] = [
  {
    id: '1',
    prompt: 'Write a haiku about the last thing that made you smile',
    category: 'poetry',
    difficulty: 'beginner',
    timeLimit: 5,
    inspiration: 'Sometimes the smallest moments hold the most beauty'
  },
  {
    id: '2',
    prompt: 'Create a story where every sentence starts with the next letter of the alphabet',
    category: 'wordplay',
    difficulty: 'advanced',
    timeLimit: 20,
    inspiration: 'Constraints can unlock creativity'
  },
  {
    id: '3',
    prompt: 'Describe a color to someone who has never seen',
    category: 'observation',
    difficulty: 'intermediate',
    timeLimit: 10,
    inspiration: 'Use all your senses except sight'
  },
];

const NudgeCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(43, 58, 103, 0.8) 0%, rgba(43, 58, 103, 0.6) 100%)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 215, 0, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.5), transparent)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s',
  },
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

const CategoryChip = styled(Chip)<{ category: string }>(({ theme, category }) => ({
  backgroundColor: 
    category === 'poetry' ? 'rgba(147, 112, 219, 0.3)' :
    category === 'storytelling' ? 'rgba(100, 149, 237, 0.3)' :
    category === 'wordplay' ? 'rgba(255, 182, 193, 0.3)' :
    'rgba(144, 238, 144, 0.3)',
  color: theme.palette.common.white,
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const DifficultyIndicator = styled(Box)<{ difficulty: string }>(({ difficulty }) => ({
  display: 'flex',
  gap: 4,
  '& .dot': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 
      difficulty === 'beginner' ? '#90EE90' :
      difficulty === 'intermediate' ? '#FFD700' :
      '#FF6B6B',
  },
}));

interface NoctuaNudgesProps {
  onAcceptNudge?: (nudge: Nudge) => void;
}

const NoctuaNudges: React.FC<NoctuaNudgesProps> = ({ onAcceptNudge }) => {
  const { t } = useTranslation();
  const [currentNudge, setCurrentNudge] = useState<Nudge>(SAMPLE_NUDGES[0]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
      // Could trigger a completion event here
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const getNewNudge = () => {
    const currentIndex = SAMPLE_NUDGES.findIndex(n => n.id === currentNudge.id);
    const nextIndex = (currentIndex + 1) % SAMPLE_NUDGES.length;
    setCurrentNudge(SAMPLE_NUDGES[nextIndex]);
    setIsActive(false);
    setTimeRemaining(null);
  };

  const startChallenge = () => {
    if (currentNudge.timeLimit) {
      setTimeRemaining(currentNudge.timeLimit * 60);
      setIsActive(true);
    }
    onAcceptNudge?.(currentNudge);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = currentNudge.timeLimit && timeRemaining !== null
    ? ((currentNudge.timeLimit * 60 - timeRemaining) / (currentNudge.timeLimit * 60)) * 100
    : 0;

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'secondary.main',
              fontFamily: '"Space Grotesk", sans-serif',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <AutoAwesomeIcon />
            {t('noctua_nudges_title', "Noctua's Nudges")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('noctua_nudges_subtitle', 'Daily creative prompts from your wise owl companion')}
          </Typography>
        </motion.div>
      </Box>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentNudge.id}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.5 }}
        >
          <NudgeCard>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <CategoryChip
                  label={t(`category_${currentNudge.category}`, currentNudge.category)}
                  category={currentNudge.category}
                  size="small"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('difficulty', 'Difficulty')}:
                  </Typography>
                  <DifficultyIndicator difficulty={currentNudge.difficulty}>
                    <div className="dot" />
                    <div className="dot" style={{ opacity: currentNudge.difficulty !== 'beginner' ? 1 : 0.3 }} />
                    <div className="dot" style={{ opacity: currentNudge.difficulty === 'advanced' ? 1 : 0.3 }} />
                  </DifficultyIndicator>
                </Box>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  color: 'common.white',
                  fontFamily: '"Space Grotesk", sans-serif',
                  mb: 3,
                  minHeight: 60,
                }}
              >
                {currentNudge.prompt}
              </Typography>

              {currentNudge.inspiration && (
                <Fade in>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 215, 0, 0.8)',
                      fontStyle: 'italic',
                      mb: 3,
                      pl: 2,
                      borderLeft: '2px solid rgba(255, 215, 0, 0.5)',
                    }}
                  >
                    💡 {currentNudge.inspiration}
                  </Typography>
                </Fade>
              )}

              {currentNudge.timeLimit && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimerIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {isActive 
                        ? `Time remaining: ${formatTime(timeRemaining!)}`
                        : `Time limit: ${currentNudge.timeLimit} minutes`
                      }
                    </Typography>
                  </Box>
                  {isActive && (
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'secondary.main',
                          borderRadius: 3,
                        },
                      }}
                    />
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={startChallenge}
                  disabled={isActive}
                  sx={{
                    backgroundColor: 'secondary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
                    },
                  }}
                >
                  {isActive 
                    ? t('challenge_active', 'Challenge in Progress')
                    : t('accept_nudge', 'Accept Nudge')
                  }
                </Button>
                <IconButton
                  onClick={getNewNudge}
                  disabled={isActive}
                  sx={{
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: 'secondary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
            </CardContent>
          </NudgeCard>
        </motion.div>
      </AnimatePresence>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('nudge_hint', 'Complete nudges to unlock achievements and grow your creative constellation')}
        </Typography>
      </Box>
    </Box>
  );
};

export default NoctuaNudges; 