import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useUsage } from '../contexts/UsageContext';
import { useAuth } from '../contexts/AuthContext';
import { analyzeText } from '../App'; // Adjust the path if needed
import AnalysisLegend from '../components/AnalysisLegend';
import HighlightLyrics from '../components/HighlightLyrics';
import AnalysisResultsCard from '../components/AnalysisResultsCard';

const Analysis: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usageInfo, recordAnalysis } = useUsage();
  const { currentUser } = useAuth();

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    if (!currentUser) {
      setError('Please log in to analyze text');
      return;
    }

    if (!usageInfo) {
      setError('Unable to check usage limits');
      return;
    }

    if (usageInfo.analysesThisMonth >= usageInfo.planLimits.monthlyAnalyses) {
      setError('You have reached your monthly analysis limit');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the backend API
      const analysis = await analyzeText(input);
      setResult(analysis);
      // Record the analysis
      await recordAnalysis(input.length);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rhyme Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Enter your text below to analyze its rhyme patterns and poetic elements
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            label="Enter your text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Paste your lyrics or poem here..."
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {usageInfo ? `${usageInfo.analysesThisMonth}/${usageInfo.planLimits.monthlyAnalyses} analyses used this month` : 'Loading usage info...'}
            </Typography>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </Box>
        </Paper>

        {/* Results section */}
        {result && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
              alignItems: 'flex-start',
              mt: 3,
            }}
          >
            <Paper sx={{ p: 3, flex: 2, minWidth: 0 }}>
              <Typography variant="h5" gutterBottom>Analysis Output</Typography>
              {/* Highlighted lyrics */}
              <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '1.1rem', lineHeight: 1.7 }}>
                <HighlightLyrics lyrics={result} patterns={Array.isArray(result) ? result : []} />
              </Box>
            </Paper>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <AnalysisLegend patterns={Array.isArray(result) ? result : []} />
            </Box>
          </Box>
        )}
        {result && <AnalysisResultsCard />}
      </Box>
    </Container>
  );
};

export default Analysis; 