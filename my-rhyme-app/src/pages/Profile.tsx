import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import UserAnalyses from '../components/UserAnalyses';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: Date;
  analysisCount: number;
  publicAnalysisCount: number;
  totalViews: number;
  totalLikes: number;
  followers: number;
  following: number;
}

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });

  const targetUserId = userId || currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  // Mock profile data
  const mockProfile: UserProfile = {
    id: targetUserId || 'mock-user',
    name: isOwnProfile ? (currentUser?.displayName || 'Your Name') : 'John Doe',
    email: isOwnProfile ? (currentUser?.email || 'your@email.com') : 'john@example.com',
    avatar: currentUser?.photoURL || undefined,
    bio: 'Passionate about poetry, lyrics, and the art of rhyme. Exploring the intersection of language and music through phonetic analysis.',
    location: 'New York, NY',
    website: 'https://johndoe.com',
    joinedAt: new Date('2023-06-15'),
    analysisCount: 15,
    publicAnalysisCount: 12,
    totalViews: 342,
    totalLikes: 89,
    followers: 24,
    following: 18
  };

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) {
      setError('User not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(mockProfile);
      setEditForm({
        name: mockProfile.name,
        bio: mockProfile.bio || '',
        location: mockProfile.location || '',
        website: mockProfile.website || ''
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: API call to update profile
      if (profile) {
        setProfile({
          ...profile,
          name: editForm.name,
          bio: editForm.bio,
          location: editForm.location,
          website: editForm.website
        });
      }
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Profile not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={profile.avatar}
              sx={{ width: 120, height: 120, fontSize: '3rem' }}
            >
              {profile.name.charAt(0)}
            </Avatar>
          </Grid>
          
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mr: 2 }}>
                {profile.name}
              </Typography>
              {isOwnProfile && (
                <IconButton onClick={handleEditProfile} size="small">
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            {profile.bio && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {profile.bio}
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {profile.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {profile.location}
                  </Typography>
                </Box>
              )}
              
              {profile.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkIcon fontSize="small" color="action" />
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    component="a" 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: 'none' }}
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Joined {formatDistanceToNow(profile.joinedAt, { addSuffix: true })}
                </Typography>
              </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {profile.analysisCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Analyses
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {profile.totalViews}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Views
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {profile.totalLikes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Likes
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {profile.followers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {profile.following}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Following
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* User Analyses */}
      <UserAnalyses userId={profile.id} isOwnProfile={isOwnProfile} />

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Bio"
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
            placeholder="Tell others about yourself..."
          />
          
          <TextField
            fullWidth
            label="Location"
            value={editForm.location}
            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            margin="normal"
            placeholder="City, Country"
          />
          
          <TextField
            fullWidth
            label="Website"
            value={editForm.website}
            onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
            margin="normal"
            placeholder="https://yourwebsite.com"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 