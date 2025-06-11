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
  Chip,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import { analyzeText } from '../App';
import RhymeAnalysisTool from '../components/RhymeAnalysisTool';
import { noctuaColors } from '../theme/noctuaTheme';
import { OrionOwl } from '../components/OrionOwl';

// Demo mode flag - set to false for production
const DEMO_MODE = false;

interface AnalysisResult {
  original_text: string;
  rhyme_details: Array<{
    group_id: string;
    occurrences: Array<{
      startIndex: number;
      endIndex: number;
      text: string;
    }>;
    original_rhyming_words: string[];
    pattern_description: string;
  }>;
}

const Analysis: React.FC = () => {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [showDemoAlert, setShowDemoAlert] = useState(DEMO_MODE);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      if (DEMO_MODE) {
        // For demo mode, call the API directly without auth
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            rhyme_scheme: 'phonetic_architecture'
          }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const data = await response.json();
        const formattedResults: AnalysisResult = {
          original_text: text,
          rhyme_details: data.map((group: any) => ({
            group_id: group.phonetic_link_id,
            occurrences: group.segments.map((segment: any) => ({
              startIndex: segment.globalStartIndex,
              endIndex: segment.globalEndIndex,
              text: segment.text
            })),
            original_rhyming_words: group.segments.map((segment: any) => segment.text),
            pattern_description: group.pattern_description
          }))
        };
        setResults(formattedResults);
      } else {
        // Use the regular auth-protected flow
        const analysisResults = await analyzeText(text);
        setResults(analysisResults);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleTexts = [
    {
      title: "Classic Rhyme",
      text: "Roses are red, violets are blue\nSugar is sweet, and so are you\nThe sky is gray, the grass is green\nYou're the best I've ever seen"
    },
    {
      title: "Hip Hop Bars",
      text: "I'm living life in the fast lane, no brake lights\nStay up late nights, chasing dreams and stage lights\nMy flow's so cold, it'll give you frost bite\nBut my future's so bright, need shades for the spotlight"
    },
    {
      title: "Poetic Verse",
      text: "Beneath the moon's gentle gleam\nFlows a silver moonbeam stream\nWhere shadows dance and spirits dream\nNothing is quite what it may seem"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Demo Mode Alert */}
      {showDemoAlert && (
        <Alert 
          severity="info" 
          onClose={() => setShowDemoAlert(false)}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Demo Mode Active:</strong> Running without authentication for local testing. 
            The analysis will use mock patterns if no API key is configured.
          </Typography>
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${noctuaColors.moonbeam} 0%, ${noctuaColors.brightSkyBlue} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Rhyme Analysis Lab
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover the hidden patterns in your words
        </Typography>
      </Box>

      {/* Orion Helper */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10 }}>
        <OrionOwl
          size={60}
          mood={loading ? 'thinking' : results ? 'excited' : 'happy'}
          showBubble
          bubbleText={
            loading ? "Analyzing patterns..." :
            results ? "Look at all these patterns!" :
            "Paste your lyrics below!"
          }
          animate
        />
      </Box>

      {/* Main Analysis Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Input Text
            </Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your lyrics, poetry, or any text here..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              sx={{
                background: noctuaColors.vibrantGold,
                color: noctuaColors.deepIndigo,
                '&:hover': {
                  background: alpha(noctuaColors.vibrantGold, 0.9),
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Analyze Patterns'}
            </Button>

            {/* Sample Texts */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Try these examples:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {sampleTexts.map((sample, index) => (
                  <Chip
                    key={index}
                    label={sample.title}
                    onClick={() => setText(sample.text)}
                    variant="outlined"
                    size="small"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Analysis Results
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
              </Box>
            )}

            {results && !loading && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Found {results.rhyme_details.length} pattern groups:
                </Typography>
                {results.rhyme_details.map((group, index) => (
                  <Card key={group.group_id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {group.pattern_description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {group.original_rhyming_words.map((word, wordIndex) => (
                          <Chip
                            key={wordIndex}
                            label={word}
                            size="small"
                            sx={{
                              backgroundColor: alpha(noctuaColors.brightSkyBlue, 0.2),
                              color: noctuaColors.brightSkyBlue,
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {!results && !loading && !error && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <Typography>
                  Results will appear here after analysis
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Full Analysis Tool (if you want to use the existing component) */}
      {results && (
        <Box sx={{ mt: 4 }}>
          <RhymeAnalysisTool
            results={results}
            isLoading={loading}
            error={error}
            onSubmit={async (newText: string) => {
              setText(newText);
              await handleAnalyze();
            }}
            currentCost={0}
          />
        </Box>
      )}
    </Container>
  );
};

export default Analysis; 