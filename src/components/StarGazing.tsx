import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TelescopeIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';

interface Stargazer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  constellation: string; // Their specialty/genre
  starsGiven: number; // How many they follow
  starsReceived: number; // Their followers
  isFollowing: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(43, 58, 103, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
  },
}));

const ConstellationChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 215, 0, 0.2)',
  color: theme.palette.secondary.main,
  border: '1px solid rgba(255, 215, 0, 0.3)',
  '& .MuiChip-icon': {
    color: theme.palette.secondary.main,
  },
}));

const StarButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.secondary.main,
  color: theme.palette.secondary.main,
  '&:hover': {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: theme.palette.secondary.light,
  },
  '&.following': {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  },
}));

interface StarGazingProps {
  stargazers: Stargazer[];
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
}

const StarGazing: React.FC<StarGazingProps> = ({ stargazers, onFollow, onUnfollow }) => {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleToggleFollow = (stargazer: Stargazer) => {
    if (stargazer.isFollowing) {
      onUnfollow(stargazer.id);
    } else {
      onFollow(stargazer.id);
    }
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'secondary.main',
              fontFamily: '"Space Grotesk", sans-serif',
              mb: 2,
            }}
          >
            {t('stargazing_title', 'Star-gazing in the Forest')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            {t('stargazing_subtitle', 'Follow fellow observers and artists to see their constellations light up your sky')}
          </Typography>
        </motion.div>
      </Box>

      <Grid container spacing={3}>
        {stargazers.map((stargazer, index) => (
          <Grid item xs={12} sm={6} md={4} key={stargazer.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredId(stargazer.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={stargazer.avatar}
                      alt={stargazer.name}
                      sx={{
                        width: 60,
                        height: 60,
                        border: '2px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: hoveredId === stargazer.id 
                          ? '0 0 20px rgba(255, 215, 0, 0.6)' 
                          : 'none',
                        transition: 'box-shadow 0.3s ease',
                      }}
                    />
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'secondary.main',
                          fontFamily: '"Space Grotesk", sans-serif',
                        }}
                      >
                        {stargazer.name}
                      </Typography>
                      <ConstellationChip
                        icon={<TelescopeIcon />}
                        label={stargazer.constellation}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {stargazer.bio}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Tooltip title={t('stars_given', 'Stars Given')}>
                      <Box sx={{ textAlign: 'center' }}>
                        <StarBorderIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {stargazer.starsGiven}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip title={t('stars_received', 'Stars Received')}>
                      <Box sx={{ textAlign: 'center' }}>
                        <StarIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {stargazer.starsReceived}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>

                  <StarButton
                    fullWidth
                    variant={stargazer.isFollowing ? 'contained' : 'outlined'}
                    className={stargazer.isFollowing ? 'following' : ''}
                    startIcon={stargazer.isFollowing ? <StarIcon /> : <StarBorderIcon />}
                    onClick={() => handleToggleFollow(stargazer)}
                  >
                    {stargazer.isFollowing 
                      ? t('following', 'Following') 
                      : t('follow', 'Follow')}
                  </StarButton>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Constellation visualization could go here */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            {t('constellation_hint', 'The stars you follow form unique constellations in your personal sky')}
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
};

export default StarGazing; 