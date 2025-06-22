import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TelescopeIcon from '@mui/icons-material/Visibility';
import GroupsIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';

interface SharedAnalysis {
  id: string;
  author: {
    name: string;
    avatar: string;
    constellation: string;
  };
  text: string;
  patterns: {
    type: string;
    count: number;
  }[];
  insights: string;
  likes: number;
  isLiked: boolean;
  timestamp: Date;
  language: string;
}

interface Stargazer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  constellation: string;
  starsGiven: number;
  starsReceived: number;
  isFollowing: boolean;
}

interface CommunityForestProps {
  analyses: SharedAnalysis[];
  stargazers: Stargazer[];
  onLike: (analysisId: string) => void;
  onShare: (analysisId: string) => void;
  onView: (analysisId: string) => void;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(43, 58, 103, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.2)',
  },
}));

export const CommunityForest: React.FC<CommunityForestProps> = ({
  analyses,
  stargazers,
  onLike,
  onShare,
  onView,
  onFollow,
  onUnfollow
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return t('time.just_now', 'Just now');
    if (diffInHours < 24) return t('time.hours_ago', `${Math.floor(diffInHours)}h ago`);
    return t('time.days_ago', `${Math.floor(diffInHours / 24)}d ago`);
  };

  const handleToggleFollow = (stargazer: Stargazer) => {
    if (stargazer.isFollowing) {
      onUnfollow(stargazer.id);
    } else {
      onFollow(stargazer.id);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: 'secondary.main',
            fontFamily: '"Space Grotesk", sans-serif',
            mb: 2,
          }}
        >
          🌲 {t('community.forest_title', 'Community Forest')}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t('community.forest_subtitle', 'Share discoveries, connect with fellow observers')}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, bgcolor: 'rgba(26, 27, 46, 0.8)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: 'secondary.main' },
            '& .MuiTab-root': { 
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: 'secondary.main' }
            },
          }}
        >
          <Tab icon={<TimelineIcon />} label={t('community.feed', 'Discovery Feed')} />
          <Tab icon={<GroupsIcon />} label={t('community.stargazers', 'Star Gazers')} />
        </Tabs>
      </Paper>

      {/* Discovery Feed */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {analyses.map((analysis, index) => (
            <Grid item xs={12} key={analysis.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={analysis.author.avatar} sx={{ mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" color="secondary.main">
                          {analysis.author.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {analysis.author.constellation} • {formatTimeAgo(analysis.timestamp)}
                        </Typography>
                      </Box>
                      <Chip label={analysis.language.toUpperCase()} size="small" color="secondary" />
                    </Box>

                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(0,0,0,0.3)' }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        "{analysis.text}"
                      </Typography>
                    </Paper>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                        {t('community.patterns_found', 'Patterns Found:')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {analysis.patterns.map((pattern, idx) => (
                          <Chip
                            key={idx}
                            label={`${pattern.type} (${pattern.count})`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255, 215, 0, 0.2)', color: 'secondary.main' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {analysis.insights && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2, 
                          fontStyle: 'italic',
                          p: 1,
                          bgcolor: 'rgba(255, 215, 0, 0.1)',
                          borderRadius: 1
                        }}
                      >
                        {analysis.insights}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton onClick={() => onLike(analysis.id)} color="secondary">
                          {analysis.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                        <Typography variant="body2" color="text.secondary">
                          {analysis.likes}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <IconButton onClick={() => onView(analysis.id)} color="secondary">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => onShare(analysis.id)} color="secondary">
                          <ShareIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Star Gazers */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {stargazers.map((stargazer, index) => (
            <Grid item xs={12} sm={6} md={4} key={stargazer.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={stargazer.avatar}
                        sx={{ width: 60, height: 60, border: '2px solid rgba(255, 215, 0, 0.5)' }}
                      />
                      <Box sx={{ ml: 2, flex: 1 }}>
                        <Typography variant="h6" color="secondary.main">
                          {stargazer.name}
                        </Typography>
                        <Chip
                          icon={<TelescopeIcon />}
                          label={stargazer.constellation}
                          size="small"
                          sx={{ bgcolor: 'rgba(255, 215, 0, 0.2)', color: 'secondary.main' }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {stargazer.bio}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <StarBorderIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {stargazer.starsGiven}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <StarIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {stargazer.starsReceived}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant={stargazer.isFollowing ? 'contained' : 'outlined'}
                      startIcon={stargazer.isFollowing ? <StarIcon /> : <StarBorderIcon />}
                      onClick={() => handleToggleFollow(stargazer)}
                      sx={{
                        borderColor: 'secondary.main',
                        color: stargazer.isFollowing ? 'primary.main' : 'secondary.main',
                        bgcolor: stargazer.isFollowing ? 'secondary.main' : 'transparent',
                      }}
                    >
                      {stargazer.isFollowing ? t('following', 'Following') : t('follow', 'Follow')}
                    </Button>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}; 