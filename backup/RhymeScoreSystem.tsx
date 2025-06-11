import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Card,
  CardContent,
  useTheme,
  Badge,
  IconButton,
  Collapse,
  Avatar,
} from '@mui/material';
import {
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  MusicNote,
  LocalFireDepartment,
  AutoAwesome,
  Stars,
  ExpandLess,
  ExpandMore,
  Celebration,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { noctuaColors } from '../theme/noctuaTheme';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon?: React.ReactNode;
}

interface RhymeScoreSystemProps {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  level: number;
  currentLevelProgress: number;
  nextLevelThreshold: number;
  recentPatterns: string[];
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shine = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const rarityColors = {
  common: '#8B949E',
  rare: '#58A6FF',
  epic: '#A371F7',
  legendary: '#F7B538',
};

export const RhymeScoreSystem: React.FC<RhymeScoreSystemProps> = ({
  totalScore,
  currentStreak,
  longestStreak,
  achievements,
  level,
  currentLevelProgress,
  nextLevelThreshold,
  recentPatterns,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const levelProgress = (currentLevelProgress / nextLevelThreshold) * 100;

  // Achievement icons mapping
  const achievementIcons: Record<string, React.ReactNode> = {
    firstRhyme: <MusicNote />,
    streakMaster: <LocalFireDepartment />,
    patternExplorer: <AutoAwesome />,
    nightOwl: <Stars />,
    lyricist: <TrophyIcon />,
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        left: 20,
        top: 100,
        width: 320,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${noctuaColors.deepIndigo} 0%, ${noctuaColors.midnightBlue} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: noctuaColors.vibrantGold }}>
              Rhyme Score
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: noctuaColors.moonbeam }}>
              {totalScore.toLocaleString()}
            </Typography>
          </Box>
          
          {/* Streak indicator */}
          <Box sx={{ textAlign: 'center' }}>
            <Badge
              badgeContent={currentStreak}
              color="primary"
              max={999}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '1rem',
                  height: 28,
                  minWidth: 28,
                  borderRadius: '50%',
                },
              }}
            >
              <LocalFireDepartment
                sx={{
                  fontSize: 40,
                  color: currentStreak > 0 ? noctuaColors.vibrantGold : theme.palette.text.disabled,
                  animation: currentStreak > 0 ? `${pulse} 1s ease-in-out infinite` : 'none',
                }}
              />
            </Badge>
            <Typography variant="caption" display="block" color="text.secondary">
              Streak
            </Typography>
          </Box>
        </Box>

        {/* Level Progress */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Level {level}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentLevelProgress} / {nextLevelThreshold}
            </Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={levelProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: noctuaColors.charcoal,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${noctuaColors.brightSkyBlue} 0%, ${noctuaColors.vibrantGold} 100%)`,
                },
              }}
            />
            {levelProgress > 50 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: 'hidden',
                  borderRadius: 4,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '30%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: `${shine} 2s ease-in-out infinite`,
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Recent Patterns */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {recentPatterns.slice(0, 5).map((pattern, index) => (
            <Chip
              key={index}
              label={pattern}
              size="small"
              sx={{
                backgroundColor: `${noctuaColors.vibrantGold}20`,
                color: noctuaColors.vibrantGold,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Expandable Content */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" fontWeight={500}>
          Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0, maxHeight: 300, overflow: 'auto' }}>
          {achievements.map((achievement) => (
            <Box
              key={achievement.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                mb: 1,
                borderRadius: 1,
                backgroundColor: achievement.unlocked
                  ? `${rarityColors[achievement.rarity]}15`
                  : 'transparent',
                border: `1px solid ${
                  achievement.unlocked ? rarityColors[achievement.rarity] : theme.palette.divider
                }`,
                opacity: achievement.unlocked ? 1 : 0.5,
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: achievement.unlocked
                    ? rarityColors[achievement.rarity]
                    : theme.palette.action.disabled,
                }}
              >
                {achievementIcons[achievement.id] || <TrophyIcon />}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={achievement.unlocked ? 600 : 400}>
                  {achievement.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {achievement.description}
                </Typography>
                {!achievement.unlocked && (
                  <LinearProgress
                    variant="determinate"
                    value={(achievement.progress / achievement.maxProgress) * 100}
                    sx={{
                      mt: 0.5,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.action.disabled,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: rarityColors[achievement.rarity],
                      },
                    }}
                  />
                )}
              </Box>
              
              {achievement.unlocked && (
                <Celebration
                  sx={{
                    color: rarityColors[achievement.rarity],
                    fontSize: 20,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}; 