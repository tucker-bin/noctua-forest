import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact';
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ variant = 'default' }) => {
  const { currentUser } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current subscription status
  useEffect(() => {
    if (!currentUser) {
      setFetchingStatus(false);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/newsletter/status', {
          headers: {
            'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscribed(data.subscribed);
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setFetchingStatus(false);
      }
    };

    fetchSubscriptionStatus();
  }, [currentUser]);

  const handleToggle = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Please sign in to manage newsletter preferences' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({
          subscribed: !subscribed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const newStatus = !subscribed;
      setSubscribed(newStatus);
      setMessage({
        type: 'success',
        text: newStatus ? 'Successfully subscribed to newsletter!' : 'Successfully unsubscribed from newsletter.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update subscription',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={subscribed}
              onChange={handleToggle}
              disabled={loading || !currentUser}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" />
              <Typography variant="body2">
                Subscribe to newsletter
              </Typography>
            </Box>
          }
        />
        {message && (
          <Alert severity={message.type} sx={{ mt: 1 }}>
            {message.text}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon />
        Newsletter
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stay updated with the latest features, tips, and rhyme analysis insights.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={subscribed}
            onChange={handleToggle}
            disabled={loading || !currentUser}
          />
        }
        label={
          loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Updating...</Typography>
            </Box>
          ) : (
            'Send me updates about new features and rhyme analysis tips'
          )
        }
      />

      {!currentUser && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Sign in to manage newsletter preferences
        </Typography>
      )}
    </Paper>
  );
};

export default NewsletterSignup; 