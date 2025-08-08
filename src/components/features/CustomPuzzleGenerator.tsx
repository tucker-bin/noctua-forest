import React, { useState } from 'react';
import { Box, Button, Card, CircularProgress, TextField, Typography, Alert } from '@mui/material';

interface CustomPuzzleGeneratorProps {
  onPuzzleGenerated: (puzzle: any) => void;
  onCancel: () => void;
}

export const CustomPuzzleGenerator: React.FC<CustomPuzzleGeneratorProps> = ({ onPuzzleGenerated, onCancel }) => {
  const [customText, setCustomText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (customText.length < 100) {
      setError('Please provide at least 100 characters of text for Rhyme Mahjong.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // For Rhyme Mahjong, we just pass the text directly
      onPuzzleGenerated(customText);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: '#fafafa', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center',
      p: 3 
    }}>
      <Card sx={{ 
        p: 4, 
        maxWidth: '600px', 
        width: '100%',
        mx: 'auto',
        backgroundColor: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            color: '#1a1a1a',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 2
          }}
        >
          Create a Rhyme Mahjong Puzzle
        </Typography>
        <Typography 
          variant="body2" 
          color="#666" 
          sx={{ 
            mb: 3,
            textAlign: 'center',
            fontSize: '1rem'
          }}
        >
          Paste in a text (at least 100 characters) and our engine will find rhyming words to build a custom 3D puzzle for you.
        </Typography>
        <TextField
          multiline
          rows={10}
          fullWidth
          variant="outlined"
          placeholder="Paste your text here..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          disabled={isLoading}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#fafafa',
              '&:hover': {
                backgroundColor: 'white'
              },
              '&.Mui-focused': {
                backgroundColor: 'white'
              }
            }
          }}
        />
        <Box sx={{ mb: 2, textAlign: 'right' }}>
          <Typography variant="caption" color={customText.length >= 100 ? '#4caf50' : '#f44336'}>
            {customText.length} / 100 characters
          </Typography>
        </Box>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2'
            }}
          >
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            onClick={onCancel} 
            disabled={isLoading}
            sx={{ 
              color: '#666',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerate} 
            disabled={isLoading || customText.length < 100}
            sx={{ 
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0'
              },
              minWidth: 120
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Generate Puzzle'
            )}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}; 