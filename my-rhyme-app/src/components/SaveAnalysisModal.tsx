import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { SaveAnalysisRequest } from '../types/analysis';
import { AnalysisService } from '../services/analysisService';

interface SaveAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  originalText: string;
  analysisData: any;
  onSave?: (data: SaveAnalysisRequest) => Promise<void>;
}

const SUGGESTED_TAGS = [
  'Poetry', 'Lyrics', 'Rap', 'Spoken Word', 'Song', 'Verse', 'Rhyme Scheme',
  'ABAB', 'AABB', 'Free Verse', 'Sonnet', 'Haiku', 'Ballad', 'Hip Hop',
  'R&B', 'Pop', 'Rock', 'Folk', 'Country', 'Jazz', 'Classical', 'Experimental'
];

const SaveAnalysisModal: React.FC<SaveAnalysisModalProps> = ({
  open,
  onClose,
  originalText,
  analysisData,
  onSave
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    isDraft: true,
    tags: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!currentUser || currentUser.isAnonymous) {
      setError('You must be signed in to save analyses');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saveData: SaveAnalysisRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        originalText,
        analysisData,
        isPublic: formData.isPublic,
        isDraft: formData.isDraft,
        tags: formData.tags
      };

      if (onSave) {
        // Use custom save handler if provided
        await onSave(saveData);
      } else {
        // Use default API service
        await AnalysisService.saveAnalysis(saveData);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        isPublic: false,
        isDraft: true,
        tags: []
      });
      
      // Close modal after a brief success message
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewText = () => {
    return originalText.length > 100 
      ? originalText.substring(0, 100) + '...'
      : originalText;
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Save Analysis
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Analysis saved successfully!
          </Alert>
        )}

        {/* Preview of the text being saved */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Text Preview:
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            "{getPreviewText()}"
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Title *"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          margin="normal"
          placeholder="Give your analysis a descriptive title"
          helperText="This will be displayed on your profile and in search results"
          disabled={saving || success}
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          margin="normal"
          multiline
          rows={3}
          placeholder="Optional description or notes about this analysis"
          disabled={saving || success}
        />

        <Autocomplete
          multiple
          options={SUGGESTED_TAGS}
          value={formData.tags}
          onChange={(event, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
          freeSolo
          disabled={saving || success}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags to help others discover your analysis"
              margin="normal"
              helperText="Press Enter to add custom tags"
            />
          )}
          sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Visibility Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={!formData.isDraft}
                onChange={(e) => setFormData(prev => ({ ...prev, isDraft: !e.target.checked }))}
                disabled={saving || success}
              />
            }
            label={formData.isDraft ? "Save as Draft" : "Publish Now"}
          />
          
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
            {formData.isDraft 
              ? "Drafts are only visible to you and can be published later"
              : "Published posts will be visible according to your privacy settings"
            }
          </Typography>

          {!formData.isDraft && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={saving || success}
                />
              }
              label={formData.isPublic ? "Public" : "Private"}
            />
          )}
          
          {!formData.isDraft && (
            <Typography variant="caption" display="block" color="text.secondary">
              {formData.isPublic 
                ? "Anyone can view and analyze this post"
                : "Only you can view this post"
              }
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !formData.title.trim()}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : (formData.isDraft ? 'Save Draft' : 'Publish')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SaveAnalysisModal; 