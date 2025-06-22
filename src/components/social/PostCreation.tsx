import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Stack,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  Public,
  People,
  Lock,
  Share,
  ContentCopy,
  Twitter,
  Facebook
} from '@mui/icons-material';
import { Pattern } from '../../types/observatory';
import { generatePatternColors, getContrastColor } from '../Observatory/colorSystem';
import { useAuth } from '../../contexts/AuthContext';
import { log } from '../../utils/logger';

interface ObservationData {
  originalText: string;
  patterns: Pattern[];
  language: string;
  timestamp: string;
}

const PostCreation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const observationData = location.state?.observationData as ObservationData;
  
  const [title, setTitle] = useState('');
  const [insights, setInsights] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!observationData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {t('post.noData', 'No observation data found')}
        </Typography>
        <Button onClick={() => navigate('/observatory')} sx={{ mt: 2 }}>
          {t('post.backToObservatory', 'Back to Observatory')}
        </Button>
      </Box>
    );
  }

  const palette = generatePatternColors(observationData.patterns, 'minimal');
  const patternSummary = observationData.patterns.reduce((acc, pattern) => {
    acc[pattern.type] = (acc[pattern.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreatePost = async () => {
    if (!currentUser || !observationData) return;
    
    const startTime = performance.now();
    
    try {
      setIsCreating(true);
      
      log.userAction('Creating social post', {
        userId: currentUser.uid,
        isPublic,
        hasTitle: !!title.trim(),
        hasDescription: !!insights.trim(),
        patternCount: observationData.patterns?.length || 0
      });
      
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Observation',
          description: insights.trim(),
          observationId: observationData.timestamp, // Use timestamp as ID since ObservationData doesn't have id
          isPublic,
          tags: []
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const newPost = await response.json();
      
      const duration = performance.now() - startTime;
      log.performance('Social post created', duration, {
        postId: newPost.id,
        isPublic,
        success: true
      });
      
      setSuccess('Post created successfully!');
      
      // Navigate to the post or back to observatory
      setTimeout(() => {
        navigate('/forest');
      }, 1500);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('Failed to create social post', {
        userId: currentUser.uid,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
      
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (observationData) {
      const link = `${window.location.origin}/observation/${observationData.timestamp}`;
      navigator.clipboard.writeText(link).then(() => {
        setSuccess('Link copied to clipboard!');
        log.userAction('Observation link copied', { observationId: observationData.timestamp });
      }).catch(() => {
        log.warn('Failed to copy link to clipboard');
        setError('Failed to copy link');
      });
    }
  };

  const handleExternalShare = async (platform: 'twitter' | 'facebook' | 'copy') => {
    const shareText = `Check out this pattern analysis from Noctua Forest!\n\n"${observationData.originalText.substring(0, 100)}${observationData.originalText.length > 100 ? '...' : ''}"\n\nFound ${observationData.patterns.length} sound patterns! 🔭✨`;
    const shareUrl = window.location.origin + '/observatory';
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } catch (error) {
          log.error('Failed to copy to clipboard');
        }
        break;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 100%)',
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(45deg, #4a90e2, #f39c12)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            {t('post.createTitle', 'Share Your Discovery')}
          </Typography>
        </Box>

        {shareSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('post.shareSuccess', 'Your discovery has been shared successfully!')}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Main Form */}
          <Box sx={{ flex: 2 }}>
            <Paper sx={{ 
              p: 3, 
              background: 'rgba(26, 31, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3 
            }}>
              <Typography variant="h6" gutterBottom>
                {t('post.addYourThoughts', 'Add Your Thoughts')}
              </Typography>
              
              <TextField
                fullWidth
                label={t('post.titleLabel', 'Title (optional)')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post.titlePlaceholder', 'Give your discovery a title...')}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('post.insightsLabel', 'Your Insights')}
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                placeholder={t('post.insightsPlaceholder', 'What did you notice? What patterns stood out to you?')}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isPublic ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                      {isPublic ? t('post.public', 'Public') : t('post.private', 'Private')}
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleCreatePost}
                  disabled={isCreating}
                  startIcon={isCreating ? <CircularProgress size={20} /> : <Share />}
                  sx={{
                    background: 'linear-gradient(45deg, #4a90e2, #f39c12)',
                    '&:hover': { background: 'linear-gradient(45deg, #357abd, #e67e22)' }
                  }}
                >
                  {isCreating ? t('post.sharing', 'Sharing...') : t('post.shareToForest', 'Share to Forest')}
                </Button>

                <Tooltip title={t('post.copyLink', 'Copy link')}>
                  <IconButton onClick={handleCopyLink}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('post.shareTwitter', 'Share on Twitter')}>
                  <IconButton onClick={() => handleExternalShare('twitter')}>
                    <Twitter />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('post.shareFacebook', 'Share on Facebook')}>
                  <IconButton onClick={() => handleExternalShare('facebook')}>
                    <Facebook />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Box>

          {/* Observation Preview */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ 
              p: 3, 
              background: 'rgba(26, 31, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              position: 'sticky',
              top: 20
            }}>
              <Typography variant="h6" gutterBottom>
                {t('post.observationPreview', 'Your Observation')}
              </Typography>
              
              <Card sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.3)' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    fontSize: '0.9rem'
                  }}>
                    "{observationData.originalText}"
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" gutterBottom>
                {t('post.patternsFound', 'Patterns Found:')} {observationData.patterns.length}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {Object.entries(patternSummary).map(([type, count]) => {
                  const color = palette[type] || '#999999';
                  return (
                    <Chip
                      key={type}
                      label={`${type.replace(/_/g, ' ')} (${count})`}
                      size="small"
                      sx={{
                        backgroundColor: color,
                        color: getContrastColor(color),
                        fontSize: '0.7rem'
                      }}
                    />
                  );
                })}
              </Box>

              <Typography variant="caption" color="text.secondary">
                {t('post.language', 'Language')}: {observationData.language.toUpperCase()}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          message={success}
        />
      )}

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          message={error}
        />
      )}
    </Box>
  );
};

export default PostCreation; 