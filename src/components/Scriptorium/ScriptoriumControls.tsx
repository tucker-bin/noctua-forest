import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SongObservation } from './types';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { log } from '../../utils/logger';

interface ScriptoriumControlsProps {
  observation: SongObservation;
  onCreateLesson: () => void;
}

export const ScriptoriumControls: React.FC<ScriptoriumControlsProps> = ({ 
  observation,
  onCreateLesson
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleShare = () => {
    // Share using Web Share API if available, otherwise fallback to copy
    log.info('Sharing song observation');
    
    if (navigator.share) {
      navigator.share({
        title: `Song Analysis: ${observation.songDetails.title}`,
        text: `Check out this analysis of "${observation.songDetails.title}" by ${observation.songDetails.artistName}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const shareText = `Song Analysis: "${observation.songDetails.title}" by ${observation.songDetails.artistName} - ${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Analysis link copied to clipboard!');
      }).catch(console.error);
    }
  };

  const handleSave = () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    // Save to localStorage for now (could be enhanced with backend later)
    const savedObservations = JSON.parse(localStorage.getItem('savedObservations') || '[]');
    savedObservations.push({
      ...observation,
      savedAt: new Date().toISOString(),
      userId: currentUser.uid
    });
    localStorage.setItem('savedObservations', JSON.stringify(savedObservations));
    
    log.info('Song observation saved to local storage');
  };

  const handleRefresh = () => {
    // Refresh by reloading the page (could be enhanced to re-run analysis)
    log.info('Refreshing song analysis');
    window.location.reload();
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      <Box>
        <Box sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
          {observation.songDetails.title}
        </Box>
        <Box sx={{ fontSize: 14, color: 'text.secondary' }}>
          {observation.songDetails.artistName} • {observation.songDetails.albumName}
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title={t('scriptorium.refresh', 'Refresh Analysis')}>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t('scriptorium.save', 'Save Observation')}>
          <IconButton 
            onClick={handleSave} 
            size="small"
            disabled={!currentUser}
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          size="small"
          startIcon={<EditIcon />}
          onClick={onCreateLesson}
          sx={{
            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #3DBCB3, #34A6C0)',
            }
          }}
        >
          {t('scriptorium.create_lesson', 'Create Lesson')}
        </Button>
        
        <Button
          variant="contained"
          size="small"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          sx={{
            background: 'linear-gradient(45deg, #FF6B9D, #4ECDC4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF5A8C, #3DBCB3)',
            }
          }}
        >
          {t('scriptorium.share', 'Share')}
        </Button>
      </Box>
    </Box>
  );
}; 