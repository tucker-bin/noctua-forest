import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { analyzeText } from '../api.ts';
import type { AnalysisData } from '../api.ts';
import AnalysisLegend from './AnalysisLegend.tsx';
import HighlightLyrics from './HighlightLyrics.tsx';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { 
    CircularProgress, Typography, TextField, Button, Paper, Box, Alert,
    Tabs, Tab, IconButton, Grid, Card, CardContent,
    FormControlLabel, Checkbox, Slider, Dialog, DialogTitle,
    DialogContent, DialogActions, LinearProgress, useTheme, useMediaQuery, Container
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import BuyTokensModal from './BuyTokensModal';
import SaveAnalysisModal from './SaveAnalysisModal';
import type { SaveAnalysisRequest } from '../types/analysis';
import { useTranslation } from 'react-i18next';

// TabPanel component for Material-UI Tabs
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export type ThemeMode = 'dark' | 'light' | 'vintage';
export type ColorPalette = 'vibrant' | 'pastel' | 'neon' | 'earth' | 'ocean' | 'sunset' | 'camo' | 'rainbow' | 
    'nude' | 'berry' | 'smokey' | 'glam' | 'coral' | 'mauve' | 'bronze' | 'rose';

export const colorPalettes: Record<ColorPalette, string[]> = {
    vibrant: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#8A2BE2', 
        '#FF8C00', '#00CED1', '#DA70D6', '#32CD32', '#FF4500',
        '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C', '#87CEEB'
    ],
    pastel: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
        '#E8BBE8', '#FFC8DD', '#B5EAD7', '#FFDAC1', '#C7CEEA',
        '#FFE5E5', '#E5F3FF', '#F3E5FF', '#E5FFE5', '#FFF5E5'
    ],
    neon: [
        '#FF073A', '#FF0099', '#FF3366', '#C239B3', '#7700FF',
        '#0033FF', '#0099FF', '#00FFCC', '#00FF00', '#CCFF00',
        '#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF0066'
    ],
    earth: [
        '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E',
        '#BC8F8F', '#F4A460', '#DAA520', '#B8860B', '#8B7355',
        '#A52A2A', '#800000', '#8B0000', '#CD5C5C', '#F08080'
    ],
    ocean: [
        '#000080', '#0000CD', '#0000FF', '#4169E1', '#1E90FF',
        '#00BFFF', '#87CEEB', '#87CEFA', '#00CED1', '#48D1CC',
        '#40E0D0', '#00FFFF', '#7FFFD4', '#5F9EA0', '#4682B4'
    ],
    sunset: [
        '#FF1744', '#FF5722', '#FF6E40', '#FF8A65', '#FFAB91',
        '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000',
        '#FF8F00', '#FF6F00', '#E65100', '#FF3D00', '#DD2C00'
    ],
    camo: [
        '#4B5320', '#6B8E23', '#556B2F', '#8FBC8F', '#228B22',
        '#3CB371', '#2E8B57', '#808000', '#6B8E23', '#9ACD32',
        '#32CD32', '#00FF00', '#7CFC00', '#7FFF00', '#ADFF2F'
    ],
    rainbow: [
        '#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00',
        '#ADFF2F', '#00FF00', '#00FA9A', '#00CED1', '#0000FF',
        '#4B0082', '#8B00FF', '#9400D3', '#FF1493', '#FF69B4'
    ],
    // Makeup-inspired palettes
    nude: [
        '#F5DEB3', '#FFDAB9', '#FFE4C4', '#FAF0E6', '#FFF8DC',
        '#F5E6D3', '#E8D5C4', '#D2B48C', '#C19A6B', '#A0826D',
        '#8B7355', '#DEB887', '#D2691E', '#CD853F', '#F4A460'
    ],
    berry: [
        '#8B0051', '#C71585', '#DC143C', '#FF1493', '#FF69B4',
        '#DB7093', '#C74375', '#8B3A62', '#CD5C5C', '#F08080',
        '#E75480', '#FF6B9D', '#C9184A', '#A4133C', '#800020'
    ],
    smokey: [
        '#2F4F4F', '#696969', '#708090', '#778899', '#808080',
        '#A9A9A9', '#C0C0C0', '#D3D3D3', '#36454F', '#4B4B4D',
        '#5C5C5C', '#6C6C6C', '#7C7C7C', '#8C8C8C', '#9C9C9C'
    ],
    glam: [
        '#FFD700', '#FFC125', '#FFB90F', '#CDAD00', '#FFF68F',
        '#F0E68C', '#EEE8AA', '#BDB76B', '#DAA520', '#B8860B',
        '#FFE4B5', '#FFDEAD', '#F5DEB3', '#DEB887', '#D2691E'
    ],
    coral: [
        '#FF7F50', '#FF6347', '#FF4500', '#FA8072', '#E9967A',
        '#FFA07A', '#FF8C69', '#FF7256', '#FF6A6A', '#FF5333',
        '#CD5B45', '#FF3030', '#FF6B6B', '#FF8A80', '#FF5252'
    ],
    mauve: [
        '#E0B0FF', '#DA70D6', '#BA55D3', '#9370DB', '#8B7AB8',
        '#9966CC', '#9D4EDD', '#B298DC', '#C19BBB', '#D8BFD8',
        '#DDA0DD', '#EE82EE', '#FF00FF', '#C154C1', '#915C83'
    ],
    bronze: [
        '#CD7F32', '#B87333', '#A0522D', '#8B4513', '#D2691E',
        '#BC8F8F', '#C19A6B', '#826644', '#734A12', '#5C4033',
        '#8B7355', '#A0826D', '#BC9A6A', '#D4A76A', '#E3BC9A'
    ],
    rose: [
        '#FFE4E1', '#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493',
        '#DB7093', '#C71585', '#FFF0F5', '#FFDDF4', '#FFC4E1',
        '#FFADD6', '#FF91AF', '#FF6B9D', '#F8BBD0', '#F48FB1'
    ]
};

const BATCH_SIZE = 1000; // Characters per batch
const DEBOUNCE_DELAY = 500; // ms

const Observatory: React.FC = () => {
    const { currentUser } = useAuth();
    const { usageInfo, calculateTokenCost, recordAnalysis, tokenConfig } = useUsage();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    
    const [lyrics, setLyrics] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [colorPalette, setColorPalette] = useState<ColorPalette>('vibrant');
    const [paletteAnchor, setPaletteAnchor] = useState<null | HTMLElement>(null);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [anonymousUsageCount, setAnonymousUsageCount] = useState(0);
    
    // New advanced features state
    const [patternFilters, setPatternFilters] = useState<Set<string>>(new Set());
    const [minSegmentSize, setMinSegmentSize] = useState(2);
    const [showCrossBoundary, setShowCrossBoundary] = useState(true);
    const [showMicroPatterns, setShowMicroPatterns] = useState(true);
    const [highlightIntensity, setHighlightIntensity] = useState(70);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
    const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
    const [sortBy, setSortBy] = useState<'frequency' | 'length' | 'position' | 'type'>('frequency');

    // View controls
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    
    // Toggle states for patterns
    const [enabledPatterns, setEnabledPatterns] = useState<Set<string>>(new Set());
    const [showAllHighlights, setShowAllHighlights] = useState(true);

    const [batchProgress, setBatchProgress] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(1);
    const [totalBatches, setTotalBatches] = useState(1);

    const [estimatedTokens, setEstimatedTokens] = useState<number>(0);

    const [showBuyTokens, setShowBuyTokens] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Save analysis modal state
    const [showSaveModal, setShowSaveModal] = useState(false);

    const cooldownSeconds = tokenConfig.cooldownSeconds || 20;

    // Load anonymous usage count from localStorage
    useEffect(() => {
        const count = parseInt(localStorage.getItem('anonymousUsageCount') || '0');
        setAnonymousUsageCount(count);
    }, []);

    // Update estimated tokens when text changes
    useEffect(() => {
        if (lyrics.length > 0) {
            const cost = calculateTokenCost(lyrics.length);
            setEstimatedTokens(cost);
        } else {
            setEstimatedTokens(0);
        }
    }, [lyrics, calculateTokenCost]);

    // Add cooldown effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Check if user can analyze
    const canAnalyze = () => {
        if (!currentUser) {
            // Anonymous users get 0 uses
            return false;
        }
        
        if (currentUser.isAnonymous) {
            // Anonymous users get 0 uses in production
            return false;
        }
        
        // Logged in users - check their usage
        if (usageInfo) {
            // Free users get 3 uses per month
            return usageInfo.analysesThisMonth < 3 || usageInfo.tokenBalance > 0;
        }
        
        return true;
    };

    const handleTogglePattern = (patternId: string) => {
        setEnabledPatterns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(patternId)) {
                newSet.delete(patternId);
            } else {
                newSet.add(patternId);
            }
            return newSet;
        });
        setShowAllHighlights(false); // Turn off "show all" when individually toggling
    };

    const handleAnalyze = useCallback(async () => {
        if (!lyrics.trim()) {
            setError('Please enter some lyrics to analyze.');
            return;
        }
        
        // Check if user can analyze
        if (!canAnalyze()) {
            setShowAuthDialog(true);
            return;
        }
        
        const tokenCost = calculateTokenCost(lyrics.length);
        if (usageInfo && usageInfo.tokenBalance < tokenCost) {
            setError('Insufficient tokens. Please purchase more tokens to continue.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            // Split text into batches if it's too long
            if (lyrics.length > BATCH_SIZE) {
                const batches = [];
                for (let i = 0; i < lyrics.length; i += BATCH_SIZE) {
                    batches.push(lyrics.slice(i, i + BATCH_SIZE));
                }

                setTotalBatches(batches.length);
                setBatchProgress(0);
                setCurrentBatch(1);

                let combinedAnalysis: AnalysisData | null = null;
                for (let i = 0; i < batches.length; i++) {
                    const result = await analyzeText(batches[i]);
                    setCurrentBatch(i + 1);
                    setBatchProgress(((i + 1) / batches.length) * 100);

                    if (!combinedAnalysis) {
                        combinedAnalysis = result;
                    } else {
                        // Merge the analyses
                        combinedAnalysis.rhyme_details = [
                            ...combinedAnalysis.rhyme_details,
                            ...result.rhyme_details
                        ];
                    }
                }
                setAnalysis(combinedAnalysis);
            } else {
                const result = await analyzeText(lyrics);
                setAnalysis(result);
            }
            
            // Initialize all patterns as enabled by default
            if (analysis) {
                const allPatternIds = new Set(analysis.rhyme_details.map(p => p.phonetic_link_id));
                setEnabledPatterns(allPatternIds);
                setShowAllHighlights(true);
            }
            
            // Record usage for logged in users
            if (currentUser && !currentUser.isAnonymous && recordAnalysis) {
                await recordAnalysis(tokenCost);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
            setBatchProgress(0);
            setCurrentBatch(1);
            setTotalBatches(1);
            setCooldown(cooldownSeconds);
        }
    }, [lyrics, currentUser, recordAnalysis, analysis, calculateTokenCost, usageInfo]);

    const activePatterns = useMemo(() => {
        return analysis?.rhyme_details ?? [];
    }, [analysis]);

    // Filter patterns based on advanced settings
    const filteredPatterns = useMemo(() => {
        if (!activePatterns) return [];
        
        let patterns = activePatterns.filter(pattern => {
            // Filter by enabled/disabled state
            if (!showAllHighlights && !enabledPatterns.has(pattern.phonetic_link_id)) {
                return false;
            }
            
            // Filter by pattern type
            if (patternFilters.size > 0 && pattern.acoustic_features?.primary_feature) {
                if (!patternFilters.has(pattern.acoustic_features.primary_feature)) {
                    return false;
                }
            }
            
            // Filter by segment size
            const hasValidSegment = pattern.segments.some(seg => 
                seg.text.length >= minSegmentSize
            );
            if (!hasValidSegment) return false;
            
            // Filter cross-boundary patterns
            if (!showCrossBoundary && pattern.segments.some(seg => 
                seg.phonetic_context === 'cross_boundary'
            )) {
                return false;
            }
            
            // Filter micro patterns
            if (!showMicroPatterns && pattern.segments.every(seg => 
                seg.text.length <= 3
            )) {
                return false;
            }
            
            return true;
        });
        
        // Sort patterns
        patterns.sort((a, b) => {
            switch (sortBy) {
                case 'frequency':
                    return b.segments.length - a.segments.length;
                case 'length':
                    const avgLengthA = a.segments.reduce((sum, seg) => sum + seg.text.length, 0) / a.segments.length;
                    const avgLengthB = b.segments.reduce((sum, seg) => sum + seg.text.length, 0) / b.segments.length;
                    return avgLengthB - avgLengthA;
                case 'position':
                    const minPosA = Math.min(...a.segments.map(seg => seg.globalStartIndex));
                    const minPosB = Math.min(...b.segments.map(seg => seg.globalStartIndex));
                    return minPosA - minPosB;
                case 'type':
                    const typeA = a.acoustic_features?.primary_feature || 'z';
                    const typeB = b.acoustic_features?.primary_feature || 'z';
                    return typeA.localeCompare(typeB);
                default:
                    return 0;
            }
        });
        
        return patterns;
    }, [activePatterns, patternFilters, minSegmentSize, showCrossBoundary, showMicroPatterns, sortBy, enabledPatterns, showAllHighlights]);

    // Get unique pattern types
    const patternTypes = useMemo(() => {
        const types = new Set<string>();
        activePatterns.forEach(pattern => {
            if (pattern.acoustic_features?.primary_feature) {
                types.add(pattern.acoustic_features.primary_feature);
            }
        });
        return Array.from(types);
    }, [activePatterns]);

    // Calculate pattern statistics
    const patternStats = useMemo(() => {
        if (!activePatterns.length) return null;
        
        const totalPatterns = activePatterns.length;
        const totalSegments = activePatterns.reduce((sum, p) => sum + p.segments.length, 0);
        const avgSegmentsPerPattern = (totalSegments / totalPatterns).toFixed(1);
        
        // Count pattern types
        const patternTypes = activePatterns.reduce((acc, p) => {
            const type = p.acoustic_features?.primary_feature || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return {
            totalPatterns,
            totalSegments,
            avgSegmentsPerPattern,
            patternTypes
        };
    }, [activePatterns]);

    const handleCopyText = () => {
        navigator.clipboard.writeText(lyrics);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleExportAnalysis = () => {
        if (!analysis) return;
        
        const exportData = {
            text: analysis.original_text,
            patterns: activePatterns,
            statistics: patternStats,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rhyme-analysis-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveAnalysis = async () => {
      if (!analysis || !currentUser) return;
      
      try {
        setIsLoading(true);
        const data = {
          originalText: analysis.original_text,
          analysis: analysis.rhyme_details,
          timestamp: new Date().toISOString(),
          userId: currentUser.uid
        };
        
        // Save analysis to backend
        const response = await fetch('/api/analyses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error('Failed to save analysis');
        }

        const result = await response.json();
        setShowSaveModal(false);
        
        // Show success message
        setError(null);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save analysis');
      } finally {
        setIsLoading(false);
      }
    };

    const exampleTexts = [
        { 
            title: "Shakespeare's Sonnet 18", 
            text: "Shall I compare thee to a summer's day?\nThou art more lovely and more temperate:\nRough winds do shake the darling buds of May,\nAnd summer's lease hath all too short a date:\nSometime too hot the eye of heaven shines,\nAnd often is his gold complexion dimmed;\nAnd every fair from fair sometime declines,\nBy chance, or nature's changing course untrimmed" 
        },
        { 
            title: "The Raven by Edgar Allan Poe", 
            text: "Once upon a midnight dreary, while I pondered, weak and weary,\nOver many a quaint and curious volume of forgotten lore—\nWhile I nodded, nearly napping, suddenly there came a tapping,\nAs of some one gently rapping, rapping at my chamber door.\n\"'Tis some visitor,\" I muttered, \"tapping at my chamber door—\nOnly this and nothing more.\"" 
        },
        { 
            title: "Nursery Rhyme Collection", 
            text: "Hickory dickory dock, the mouse ran up the clock\nThe clock struck one, the mouse ran down\nHickory dickory dock, tick tock tick tock\n\nMary had a little lamb, its fleece was white as snow\nAnd everywhere that Mary went, the lamb was sure to go\nIt followed her to school one day, which was against the rule\nIt made the children laugh and play to see a lamb at school" 
        },
        {
            title: "Original Poem - Ocean Dreams",
            text: "Beneath the azure sky so wide, where ocean meets the shore\nThe waves cascade in rhythmic pride, each crest worth living for\nSeagulls dance on salty breeze, their calls both wild and free\nWhile golden sand between my knees reminds me where to be\n\nThe lighthouse stands with steadfast grace, a beacon through the night\nIts beam cuts through the darkest space, a guardian of light\nShips pass by with silent dreams, their journeys yet untold\nAs moonlight bathes the ocean streams in silver, blue, and gold"
        }
    ];

  return (
    <Layout owlMessage={t('noctua_observatory_welcome', 'Welcome to my Observatory! Ready to unlock the music in your words?')}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {t('observatory_title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('observatory_subtitle')}
          </Typography>

          {/* Usage Info */}
          {usageInfo && (
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('token_balance')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {usageInfo.tokenBalance}
                  </Typography>
                </Grid>
                {estimatedTokens > 0 && (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {t('estimated_cost')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {estimatedTokens} tokens
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setShowBuyTokens(true)}
                    fullWidth
                  >
                    Buy Tokens
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Text Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('enter_text_to_analyze')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Enter your text here for phonetic analysis..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            {lyrics && (
              <Typography variant="caption" color="text.secondary">
                {lyrics.length} characters • {Math.ceil(lyrics.length / 3000)} batches
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!canAnalyze() || isLoading || cooldown > 0 || !lyrics.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
              sx={{ flex: 1 }}
            >
              {isLoading ? 'Analyzing...' : t('analyze_text')}
            </Button>
            
            {analysis && currentUser && !currentUser.isAnonymous && (
              <Button
                variant="outlined"
                onClick={() => setShowSaveModal(true)}
                startIcon={<SaveIcon />}
              >
                Save Analysis
              </Button>
            )}
          </Box>

          {/* Cooldown Progress */}
          {cooldown > 0 && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={100 * (1 - cooldown / cooldownSeconds)} 
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Please wait {cooldown} seconds before analyzing again
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  Analysis Results
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={handleCopyText} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton onClick={handleExportAnalysis} size="small">
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Pattern Statistics */}
              {patternStats && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Pattern Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {patternStats.totalPatterns}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Patterns
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h4" fontWeight="bold" color="secondary">
                        {patternStats.totalSegments}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Segments
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {patternStats.avgSegmentsPerPattern}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg per Pattern
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {Object.keys(patternStats.patternTypes).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pattern Types
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Analysis Display Components */}
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                <Tab label="Highlighted Text" />
                <Tab label="Pattern Legend" />
                <Tab label="Advanced Controls" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <HighlightLyrics
                  text={analysis.original_text}
                  patterns={filteredPatterns}
                  hoveredGroupId={hoveredGroupId}
                  themeMode={themeMode}
                  colorPalette={colorPalette}
                  highlightIntensity={highlightIntensity}
                  enabledPatterns={enabledPatterns}
                  showAllHighlights={showAllHighlights}
                />
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <AnalysisLegend
                  patterns={filteredPatterns}
                  onHoverGroup={setHoveredGroupId}
                  onTogglePattern={handleTogglePattern}
                  enabledPatterns={enabledPatterns}
                  themeMode={themeMode}
                  colorPalette={colorPalette}
                  showAllHighlights={showAllHighlights}
                />
              </TabPanel>

              {activeTab === 2 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Advanced Controls
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Minimum Segment Size
                      </Typography>
                      <Slider
                        value={minSegmentSize}
                        onChange={(e, v) => setMinSegmentSize(v as number)}
                        min={1}
                        max={10}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Highlight Intensity
                      </Typography>
                      <Slider
                        value={highlightIntensity}
                        onChange={(e, v) => setHighlightIntensity(v as number)}
                        min={10}
                        max={100}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={showCrossBoundary}
                            onChange={(e) => setShowCrossBoundary(e.target.checked)}
                          />
                        }
                        label="Show Cross-Boundary Patterns"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={showMicroPatterns}
                            onChange={(e) => setShowMicroPatterns(e.target.checked)}
                          />
                        }
                        label="Show Micro Patterns"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}

          {/* Example Texts */}
          {!analysis && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Try These Examples
              </Typography>
              <Grid container spacing={2}>
                {exampleTexts.map((example, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 }
                      }}
                      onClick={() => setLyrics(example.text)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {example.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {example.text.substring(0, 100)}...
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Modals */}
        <BuyTokensModal
          open={showBuyTokens}
          onClose={() => setShowBuyTokens(false)}
        />

        <SaveAnalysisModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          originalText={lyrics}
          analysisData={analysis}
          onSave={handleSaveAnalysis}
        />

        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)}>
          <DialogTitle>Sign In Required</DialogTitle>
          <DialogContent>
            <Typography>
              You need to sign in to use the Observatory. Anonymous users cannot perform analyses.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowAuthDialog(false);
                navigate('/auth');
              }}
              variant="contained"
            >
              Sign In
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Observatory; 