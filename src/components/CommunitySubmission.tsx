import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Alert,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as ApprovedIcon,
  AccessTime as PendingIcon,
  ThumbUp as VoteIcon,
} from '@mui/icons-material';

interface SubmissionStatus {
  id: string;
  text: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  votes: { up: number; down: number };
  qualityScore: number;
  patternCount: number;
}

export const CommunitySubmission: React.FC = () => {
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionStatus[]>([]);

  const handleSubmit = async () => {
    if (submissionText.length < 50) return;

    setIsSubmitting(true);
    
    try {
      // Submit to Observatory for analysis + corpus addition
      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: submissionText,
          type: 'community_content' 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add to user's submission history
        const newSubmission: SubmissionStatus = {
          id: result.submissionId,
          text: submissionText,
          submittedAt: new Date(),
          status: 'pending',
          votes: { up: 0, down: 0 },
          qualityScore: result.qualityScore,
          patternCount: result.patternCount
        };
        
        setSubmissions([newSubmission, ...submissions]);
        setSubmissionText('');
      }
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Contribute to Community Corpus
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Submit Content for Community Games
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Enter text with interesting linguistic patterns - poetry, prose, song lyrics, etc. (minimum 50 characters)"
            sx={{ mb: 3 }}
          />
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleSubmit}
              disabled={submissionText.length < 50 || isSubmitting}
            >
              {isSubmitting ? 'Analyzing...' : 'Submit to Corpus'}
            </Button>
            
            <Typography variant="body2" color="text.secondary">
              {submissionText.length}/50 minimum characters
            </Typography>
          </Stack>
          
          {isSubmitting && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Observatory analyzing linguistic patterns...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* User's Submission History */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Your Submissions
      </Typography>
      
      {submissions.map((submission) => (
        <Card key={submission.id} sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  "{submission.text.substring(0, 100)}..."
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted: {submission.submittedAt.toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      icon={submission.status === 'approved' ? <ApprovedIcon /> : <PendingIcon />}
                      label={submission.status.toUpperCase()}
                      color={submission.status === 'approved' ? 'success' : 'default'}
                    />
                    <Chip
                      size="small"
                      label={`Quality: ${(submission.qualityScore * 100).toFixed(0)}%`}
                      color={getQualityColor(submission.qualityScore)}
                    />
                  </Stack>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <VoteIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {submission.votes.up - submission.votes.down}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {submission.patternCount} patterns found
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      {submissions.length === 0 && (
        <Alert severity="info">
          Submit your first text to start contributing to the community corpus! 
          Quality submissions earn contributor rewards.
        </Alert>
      )}
    </Box>
  );
}; 