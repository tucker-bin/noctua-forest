import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { AnalysisPost } from '../types/analysis';
import AnalysisCard from './AnalysisCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { AnalysisService } from '../services/analysisService';

interface UserAnalysesProps {
  userId: string;
  isOwnProfile?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analyses-tabpanel-${index}`}
      aria-labelledby={`analyses-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserAnalyses: React.FC<UserAnalysesProps> = ({ userId, isOwnProfile = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadAnalyses();
  }, [userId, tabValue]);

  const loadAnalyses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const includePrivate = isOwnProfile;
      const fetchedAnalyses = await AnalysisService.getUserAnalyses(userId, includePrivate);
      setAnalyses(fetchedAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAnalysis = (analysis: AnalysisPost) => {
    // Navigate to Observatory with pre-loaded analysis
    navigate(`/observatory?analysis=${analysis.id}`);
  };

  const handleEditAnalysis = (analysis: AnalysisPost) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Editing analysis:', analysis.id);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      await AnalysisService.deleteAnalysis(analysisId);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analysis');
    }
  };

  const handleLikeAnalysis = async (analysisId: string) => {
    try {
      const analysis = analyses.find(a => a.id === analysisId);
      if (!analysis) return;

      const newIsLiked = !analysis.isLiked;
      const result = await AnalysisService.toggleLike(analysisId, newIsLiked);
      
      setAnalyses(prev => prev.map(a => 
        a.id === analysisId 
          ? { ...a, isLiked: result.isLiked, likeCount: result.likeCount }
          : a
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like');
    }
  };

  const handleShareAnalysis = (analysis: AnalysisPost) => {
    if (navigator.share) {
      navigator.share({
        title: analysis.title,
        text: analysis.description,
        url: `${window.location.origin}/analysis/${analysis.id}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/analysis/${analysis.id}`);
    }
  };

  const getFilteredAnalyses = () => {
    let filtered = analyses;

    // Filter by tab
    if (tabValue === 0) {
      // All (published only for non-owners)
      filtered = isOwnProfile ? analyses : analyses.filter(a => !a.isDraft && a.isPublic);
    } else if (tabValue === 1) {
      // Public
      filtered = analyses.filter(a => !a.isDraft && a.isPublic);
    } else if (tabValue === 2) {
      // Private (only for owners)
      filtered = analyses.filter(a => !a.isDraft && !a.isPublic);
    } else if (tabValue === 3) {
      // Drafts (only for owners)
      filtered = analyses.filter(a => a.isDraft);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(a => 
        a.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    return filtered;
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    analyses.forEach(a => {
      a.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const filteredAnalyses = getFilteredAnalyses();
  const allTags = getAllTags();

  if (loading) {
    return <LoadingSpinner message="Loading analyses..." />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          {isOwnProfile ? 'My Analyses' : 'Analyses'}
        </Typography>
        {isOwnProfile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/observatory')}
          >
            New Analysis
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All" />
          <Tab label="Public" />
          {isOwnProfile && <Tab label="Private" />}
          {isOwnProfile && <Tab label="Drafts" />}
        </Tabs>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search analyses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {allTags.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Filter by tags:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {allTags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {filteredAnalyses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {isOwnProfile ? 'No analyses yet. Create your first analysis!' : 'No public analyses to display.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredAnalyses.map(analysis => (
              <Grid item xs={12} sm={6} md={4} key={analysis.id}>
                <AnalysisCard
                  analysis={analysis}
                  onOpen={handleOpenAnalysis}
                  onEdit={isOwnProfile ? handleEditAnalysis : undefined}
                  onDelete={isOwnProfile ? handleDeleteAnalysis : undefined}
                  onLike={handleLikeAnalysis}
                  onShare={handleShareAnalysis}
                  showAuthor={!isOwnProfile}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {filteredAnalyses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No public analyses to display.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredAnalyses.map(analysis => (
              <Grid item xs={12} sm={6} md={4} key={analysis.id}>
                <AnalysisCard
                  analysis={analysis}
                  onOpen={handleOpenAnalysis}
                  onEdit={isOwnProfile ? handleEditAnalysis : undefined}
                  onDelete={isOwnProfile ? handleDeleteAnalysis : undefined}
                  onLike={handleLikeAnalysis}
                  onShare={handleShareAnalysis}
                  showAuthor={!isOwnProfile}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {isOwnProfile && (
        <>
          <TabPanel value={tabValue} index={2}>
            {filteredAnalyses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No private analyses.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredAnalyses.map(analysis => (
                  <Grid item xs={12} sm={6} md={4} key={analysis.id}>
                    <AnalysisCard
                      analysis={analysis}
                      onOpen={handleOpenAnalysis}
                      onEdit={handleEditAnalysis}
                      onDelete={handleDeleteAnalysis}
                      onLike={handleLikeAnalysis}
                      onShare={handleShareAnalysis}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {filteredAnalyses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No drafts. Save an analysis as a draft to see it here.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredAnalyses.map(analysis => (
                  <Grid item xs={12} sm={6} md={4} key={analysis.id}>
                    <AnalysisCard
                      analysis={analysis}
                      onOpen={handleOpenAnalysis}
                      onEdit={handleEditAnalysis}
                      onDelete={handleDeleteAnalysis}
                      onLike={handleLikeAnalysis}
                      onShare={handleShareAnalysis}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default UserAnalyses; 