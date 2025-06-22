import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { DashboardCard } from '../DashboardCard';
import { SongDetailsData } from '../types';
import AlbumIcon from '@mui/icons-material/Album';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';

interface SongDetailsPanelProps {
  data: SongDetailsData;
}

export const SongDetailsPanel: React.FC<SongDetailsPanelProps> = ({ data }) => {
  return (
    <DashboardCard 
      title="Song Details" 
      icon={<MusicNoteIcon sx={{ color: 'secondary.main' }} />}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Artist
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.artistName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AlbumIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Album
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.albumName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TimerIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.duration}
            </Typography>
          </Box>
        </Box>

        {data.releaseYear && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Release Year
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {data.releaseYear}
              </Typography>
            </Box>
          </Box>
        )}

        {data.genre && data.genre.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CategoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Genre
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {data.genre.join(', ')}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </DashboardCard>
  );
}; 