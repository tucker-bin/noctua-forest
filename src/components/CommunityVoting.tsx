import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ThumbUp as UpvoteIcon,
  ThumbDown as DownvoteIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Schedule as RecentIcon,
} from '@mui/icons-material';

interface CommunitySubmission {
  id: string;
  text: string;
  author: string;
  submittedAt: Date;
  votes: { up: number; down: number };
  userVote?: 'up' | 'down' | null;
  qualityScore: number;
  patternCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export const CommunityVoting: React.FC = () => {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSubmissions();
  }, [activeTab]);

  const fetchPendingSubmissions = async () => {
    try {
      const endpoint = activeTab === 0 ? 'recent' : 'trending';
      const response = await fetch(`/api/community/voting/${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (submissionId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, voteType })
      });
      
      if (response.ok) {
        // Update local state
        setSubmissions(submissions.map(sub => {
          if (sub.id === submissionId) {
            const newVotes = { ...sub.votes };
            const oldVote = sub.userVote;
            
            // Remove old vote
            if (oldVote === 'up') newVotes.up--;
            if (oldVote === 'down') newVotes.down--;
            
            // Add new vote
            if (voteType === 'up') newVotes.up++;
            if (voteType === 'down') newVotes.down++;
            
            return {
              ...sub,
              votes: newVotes,
              userVote: sub.userVote === voteType ? null : voteType
            };
          }
          return sub;
        }));
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      case 'expert': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Community Quality Control
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Help curate high-quality content for the gaming corpus. Your votes determine which submissions become puzzles.
      </Typography>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<RecentIcon />} label="Recent Submissions" />
        <Tab icon={<TrendingIcon />} label="Trending" />
      </Tabs>

      {submissions.map((submission) => (
        <Card key={submission.id} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Linguistic Analysis Sample
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                  "{submission.text}"
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    size="small"
                    label={submission.difficulty.toUpperCase()}
                    color={getDifficultyColor(submission.difficulty)}
                  />
                  <Chip
                    size="small"
                    icon={<StarIcon />}
                    label={`${submission.patternCount} patterns`}
                  />
                  <Chip
                    size="small"
                    label={`Quality: ${(submission.qualityScore * 100).toFixed(0)}%`}
                  />
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  By {submission.author} • {submission.submittedAt.toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6">Community Vote</Typography>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton
                      onClick={() => handleVote(submission.id, 'up')}
                      color={submission.userVote === 'up' ? 'primary' : 'default'}
                      size="large"
                    >
                      <UpvoteIcon />
                    </IconButton>
                    
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight={600}>
                        {submission.votes.up - submission.votes.down}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        score
                      </Typography>
                    </Box>
                    
                    <IconButton
                      onClick={() => handleVote(submission.id, 'down')}
                      color={submission.userVote === 'down' ? 'error' : 'default'}
                      size="large"
                    >
                      <DownvoteIcon />
                    </IconButton>
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {submission.votes.up + submission.votes.down} total votes
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}; 