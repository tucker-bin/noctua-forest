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

const Analysis: React.FC = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const { usageInfo, recordAnalysis } = useUsage();
  const { currentUser } = useAuth();

  const handleAnalyze = async () => {
    if (!text.trim()) {
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

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the backend API
      const analysisResults = await analyzeText(text);
      setResults(analysisResults);
      // Record the analysis
      await recordAnalysis(text.length);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isAnalyzing}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {usageInfo ? `${usageInfo.analysesThisMonth}/${usageInfo.planLimits.monthlyAnalyses} analyses used this month` : 'Loading usage info...'}
            </Typography>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : null}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </Box>
        </Paper>

        {/* Results section */}
        {results && (
          <>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h5" gutterBottom>Analysis Output</Typography>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(results, null, 2)}</pre>
            </Paper>
            {results.rhyme_details && results.rhyme_details.length > 0 && (
              <AnalysisLegend rhymeGroups={results.rhyme_details} />
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default Analysis; 