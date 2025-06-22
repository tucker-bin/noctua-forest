import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { ThumbUp, ThumbDown } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface ObservatoryFeedbackProps {
  open: boolean;
  onClose: () => void;
  errorMessage?: string;
}

export const ObservatoryFeedback: React.FC<ObservatoryFeedbackProps> = ({ 
  open, 
  onClose,
  errorMessage 
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feedbackType) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'observatory_error',
          feedback: feedbackType,
          message: message || undefined,
          errorMessage,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state
        setFeedbackType(null);
        setMessage('');
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      setSubmitError(t('observatory.feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset state
      setFeedbackType(null);
      setMessage('');
      setSubmitSuccess(false);
      setSubmitError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('observatory.feedback.title')}</DialogTitle>
      <DialogContent>
        {submitSuccess ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t('observatory.feedback.thankYou')}
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('observatory.feedback.description')}
            </Typography>
            
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  color={feedbackType === 'positive' ? 'success' : 'default'}
                  onClick={() => setFeedbackType('positive')}
                  size="large"
                  sx={{ 
                    border: feedbackType === 'positive' ? 2 : 1,
                    borderColor: feedbackType === 'positive' ? 'success.main' : 'divider'
                  }}
                >
                  <ThumbUp fontSize="large" />
                </IconButton>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {t('observatory.feedback.working')}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  color={feedbackType === 'negative' ? 'error' : 'default'}
                  onClick={() => setFeedbackType('negative')}
                  size="large"
                  sx={{ 
                    border: feedbackType === 'negative' ? 2 : 1,
                    borderColor: feedbackType === 'negative' ? 'error.main' : 'divider'
                  }}
                >
                  <ThumbDown fontSize="large" />
                </IconButton>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {t('observatory.feedback.notWorking')}
                </Typography>
              </Box>
            </Box>

            {feedbackType === 'negative' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('observatory.feedback.messageLabel')}
                placeholder={t('observatory.feedback.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!feedbackType || isSubmitting || submitSuccess}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? t('common.submitting') : t('common.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 