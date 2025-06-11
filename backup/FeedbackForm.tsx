import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const [feedbackType, setFeedbackType] = useState('general');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!comment.trim()) {
      setMessage({ type: 'error', text: 'Please enter your feedback' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
        },
        body: JSON.stringify({
          type: feedbackType,
          comment: comment.trim(),
          userId: currentUser?.uid || 'anonymous',
          email: currentUser?.email || 'anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setMessage({ type: 'success', text: 'Thank you for your feedback!' });
      setComment('');
      setFeedbackType('general');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit feedback' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Submit Feedback
      </Typography>
      
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Feedback Type</InputLabel>
          <Select
            value={feedbackType}
            label="Feedback Type"
            onChange={(e) => setFeedbackType(e.target.value)}
          >
            <MenuItem value="general">General Comment</MenuItem>
            <MenuItem value="bug">Bug Report</MenuItem>
            <MenuItem value="feature">Feature Suggestion</MenuItem>
            <MenuItem value="accuracy">Analysis Accuracy</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Your Feedback"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Share your thoughts, report issues, or suggest improvements..."
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !comment.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Sending...' : 'Send Feedback'}
        </Button>
      </Box>
    </Paper>
  );
};

export default FeedbackForm; 