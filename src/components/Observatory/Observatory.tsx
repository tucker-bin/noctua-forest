import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Chip,
  IconButton,
  Stack,
  TextField,
  CircularProgress, 
  Alert, 
  Tabs,
  Tab,
  Badge,
  Divider,
  SwipeableDrawer,
  Fab,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Card,
  CardContent,
  Tooltip,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterIcon,
  Create as CreateIcon,
  Clear as ClearIcon,
  TextFields as TextFieldsIcon,
  MusicNote as MusicNoteIcon,
  Repeat as RepeatIcon,
  FormatQuote as FormatQuoteIcon,
  Abc as AbcIcon,
  Category as CategoryIcon,
  AutoAwesome as AutoAwesomeIcon,
  Lightbulb as LightbulbIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { Pattern, PatternType, ObservationData, ObservationResult } from '../../types/observatory';
import { generatePatternColors } from './colorSystem';
import { HighlightedText } from './HighlightedText';
import { ObservatoryFeedback } from './ObservatoryFeedback';
import { ObservatoryCustomizer, ObservatoryTheme, DEFAULT_THEME } from './ObservatoryCustomizer';
import { FloatingXpDisplay } from '../features/FloatingXpDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useObservation } from '../../hooks/useObservation';
import { useCache } from '../../hooks/useCache';
import { useExperience } from '../../contexts/ExperienceContext';
import { log } from '../../utils/logger';
import { observationService, observeAnonymousExample } from '../../services/observationService';
import { PatternCard } from './PatternCard';
import PatternControls from './PatternControls';
import { ObservatoryState, PatternFilterOptions, PatternSortOptions, filterPatterns, sortPatterns } from './types';
import { PatternList } from './PatternList';
import { ObservatoryTabs } from './TabPanels/ObservatoryTabs';

// Tab panel component
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
      id={`pattern-tabpanel-${index}`}
      aria-labelledby={`pattern-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// Pattern type icons mapping
const patternIcons: Record<string, React.ReactElement> = {
  rhyme: <MusicNoteIcon fontSize="small" />,
  alliteration: <AbcIcon fontSize="small" />,
  assonance: <TextFieldsIcon fontSize="small" />,
  consonance: <TextFieldsIcon fontSize="small" />,
  repetition: <RepeatIcon fontSize="small" />,
  parallelism: <FormatQuoteIcon fontSize="small" />,
  default: <CategoryIcon fontSize="small" />
};

const Observatory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { currentUser } = useAuth();
  const { addXp, updateStreak, unlockAchievement } = useExperience();

  // Core observation state
  const {
    text,
    setText,
    observation,
    isObserving,
    error: observationError,
    observeText,
    clearObservation,
    observationProgress,
    textCleaningInfo,
    setTextCleaningInfo
  } = useObservation('');

  const { cachedObservations, saveToCache } = useCache();
  
  // UI State
  const [state, setState] = useState<ObservatoryState>({
    isCreativeMode: false,
    viewMode: 'list',
    sortBy: 'frequency',
    selectedPatternTypes: new Set(),
    searchQuery: '',
    expandedPattern: null,
    showHighlights: true,
    isTextExpanded: false
  });

  // Significance threshold state
  const [significanceThreshold, setSignificanceThreshold] = useState<number>(0.3);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastXpGained, setLastXpGained] = useState({ xp: 0, bonusType: '', trigger: 0 });
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [hasShownLessonsModal, setHasShownLessonsModal] = useState(false);
  const [isAnonymousExample, setIsAnonymousExample] = useState(false);
  const [hasUsedAnonymousExample, setHasUsedAnonymousExample] = useState(false);
  const [anonymousObservation, setAnonymousObservation] = useState<ObservationResult | null>(null);

  // Customizer state
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [observatoryTheme, setObservatoryTheme] = useState<ObservatoryTheme>(() => {
    // Try to load saved theme from localStorage
    const saved = localStorage.getItem('observatory-theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  const [payloadOptimizationInfo, setPayloadOptimizationInfo] = useState<{ wasOptimized: boolean; originalCount: number; optimizedCount: number } | null>(null);

  // Move isCreativeMode state to the top
  const [isCreativeMode, setIsCreativeMode] = useState(false);

  // Handle error state
  const [serviceErrorMessage, setServiceErrorMessage] = useState<string | null>(null);

  // Initialize hasUsedAnonymousExample from localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem('hasUsedAnonymousExample');
    if (storedValue === 'true') {
      setHasUsedAnonymousExample(true);
    }
  }, []);

  // Handle errors
  const handleError = (message: string) => {
    setServiceErrorMessage(message);
    setFeedbackOpen(true);
  };

  // Group patterns by type
  const patternsByType = useMemo(() => {
    const currentObservation = observation || anonymousObservation;
    if (!currentObservation) return new Map<PatternType, Pattern[]>();
    
    const grouped = new Map<PatternType, Pattern[]>();
    currentObservation.patterns.forEach((pattern: Pattern) => {
      const type = pattern.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(pattern);
    });
    
    // Sort each group by frequency
    grouped.forEach((patterns) => {
      patterns.sort((a, b) => b.segments.length - a.segments.length);
    });
    
    return grouped;
  }, [observation, anonymousObservation]);

  // Get pattern statistics
  const patternStats = useMemo(() => {
    const currentObservation = observation || anonymousObservation;
    if (!currentObservation) return [];
    
    return Array.from(patternsByType.entries()).map(([type, patterns]) => ({
      type,
      count: patterns.length,
      instances: patterns.reduce((sum, p) => sum + p.segments.length, 0),
      patterns
    })).sort((a, b) => b.instances - a.instances);
  }, [patternsByType, observation, anonymousObservation]);

  // Get available pattern types from current observation
  const availableTypes = useMemo(() => {
    const currentObservation = observation || anonymousObservation;
    if (!currentObservation) return [];
    
    return Array.from(new Set(currentObservation.patterns.map((p: Pattern) => p.type)));
  }, [observation, anonymousObservation]);

  // Exit intent handler for anonymous users
  useEffect(() => {
    if (!currentUser && anonymousObservation && !hasShownLessonsModal) {
      const handleMouseLeave = (e: MouseEvent) => {
        // Check if mouse is leaving the top of the viewport (likely going to address bar or close button)
        if (e.clientY <= 0) {
          setShowLessonsModal(true);
          setHasShownLessonsModal(true);
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [currentUser, anonymousObservation, hasShownLessonsModal]);

  // Handle anonymous example observation
  const handleAnonymousExample = useCallback(async (exampleText: string, isOnboardingExample: boolean = false) => {
    try {
      const exampleId = `example_${Date.now()}`;
      const result = await observeAnonymousExample(exampleText, exampleId, i18n.language);
      
      // Clear any existing observation first
      clearObservation();
      
      // Check if patterns were reduced (backend might include metadata)
      if (result && result.metadata?.payloadOptimized) {
        setPayloadOptimizationInfo({
          wasOptimized: true,
          originalCount: result.metadata.originalPatternCount || 0,
          optimizedCount: result.patterns?.length || 0
        });
      }
      
      // Set anonymous observation if we got a valid result
      if (result) {
        setAnonymousObservation(result);
      }
      
      // Only mark usage limit if this is NOT an onboarding example
      if (!isOnboardingExample) {
        localStorage.setItem('hasUsedAnonymousExample', 'true');
        setHasUsedAnonymousExample(true);
      }
      
      setSuccessMessage('🎉 Free example analyzed! Take your time to explore the patterns above.');
      
      // After 30 seconds, show a gentle modal prompt to visit lessons (no auto-redirect)
      setTimeout(() => {
        if (!hasShownLessonsModal) {
          setShowLessonsModal(true);
          setHasShownLessonsModal(true);
        }
      }, 30000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Anonymous example failed:', { error: errorMessage });
      handleError('Sorry, there was an error with the example. Please try signing up for full access.');
    }
  }, [i18n.language, clearObservation, hasShownLessonsModal]);

  // Check for example text from onboarding or saved observation
  useEffect(() => {
    const exampleText = localStorage.getItem('exampleText');
    const savedObservationText = localStorage.getItem('savedObservationText');
    
    if (exampleText) {
      setText(exampleText);
      localStorage.removeItem('exampleText'); // Clean up after use
      setIsAnonymousExample(true);
      
      // Always auto-submit for examples from onboarding (regardless of previous usage)
      // Onboarding examples should always work, even if user has used anonymous example before
      if (!currentUser) {
        // Mark this as an onboarding example (not subject to usage limits)
        handleAnonymousExample(exampleText, true); // true = isOnboardingExample
      } else {
        // Authenticated users can analyze normally
        setSuccessMessage(t('onboarding.example_loaded', 'Example text loaded! Click "Find Patterns" to see what patterns are hidden inside.'));
      }
    } else if (savedObservationText) {
      setText(savedObservationText);
      localStorage.removeItem('savedObservationText'); // Clean up after use
      setSuccessMessage(t('observatory.saved_loaded', 'Saved observation loaded! You can now re-analyze or make changes.'));
    }
  }, [setText, t, currentUser, handleAnonymousExample]);

  // Effect to save observation to cache after it's been fetched
  useEffect(() => {
    if (observation && !cachedObservations[text]) {
      // Safe date conversion
      const getISOString = (dateValue: any): string => {
        try {
          // Debug logging to see what we're getting
          console.log('getISOString received:', dateValue, 'type:', typeof dateValue);
          
          if (!dateValue) return new Date().toISOString();
          
          if (dateValue instanceof Date) {
            // Check if it's a valid date
            return isNaN(dateValue.getTime()) ? new Date().toISOString() : dateValue.toISOString();
          }
          
          if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            console.log('Parsed string date:', parsedDate, 'isValid:', !isNaN(parsedDate.getTime()));
            return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
          }
          
          if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            try {
              return dateValue.toDate().toISOString();
            } catch {
              return new Date().toISOString();
            }
          }
          
          console.log('Fallback for dateValue:', dateValue);
          return new Date().toISOString(); // fallback
        } catch (error) {
          console.error('Error in getISOString:', error, 'for value:', dateValue);
          return new Date().toISOString(); // Ultimate fallback
        }
      };

      // Transform ObservationResult to ObservationData for caching
      const observationData: ObservationData = {
        text: observation.text,
        patterns: observation.patterns,
        segments: observation.segments,
        language: observation.language,
        metadata: {
          userId: currentUser?.uid || 'anonymous',
          language: observation.language,
          createdAt: getISOString(observation.createdAt),
          updatedAt: getISOString(observation.createdAt)
        }
      };
      saveToCache(text, observationData);
      
      // Gamification: Award XP for completing observation
      const baseXp = Math.min(50, Math.max(10, Math.floor(text.length / 10)));
      const patternBonus = observation.patterns.length * 2;
      const totalXp = baseXp + patternBonus;
      
      addXp(totalXp, 'observation_complete');
      setLastXpGained({ xp: totalXp, bonusType: 'Observation Complete', trigger: Date.now() });
      updateStreak();
      
      // Check for first observation achievement
      const hasObservedBefore = Object.keys(cachedObservations).length > 0;
      if (!hasObservedBefore && currentUser) {
        unlockAchievement('first_observation');
      }
    }
  }, [observation, text, saveToCache, cachedObservations, addXp, updateStreak, unlockAchievement, currentUser]);

  // Handle observation
  const handleObserve = async () => {
    if (!currentUser) {
      if (isAnonymousExample && !hasUsedAnonymousExample) {
        // Allow one anonymous example (not from onboarding)
        await handleAnonymousExample(text, false); // false = not onboarding example
        return;
      } else {
        handleError('You\'ve used your free example! Sign up to unlock lessons and earn more observations.');
        return;
      }
    }
    
    try {
      await observeText(text, i18n.language);
      
      // The text cleaning info is already handled in the hook
      // We just need to check if we got it from the hook's state
      if (textCleaningInfo?.wasCleaned) {
        // This is already set by the hook
        log.info('Text was cleaned during observation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Observation failed:', { error: errorMessage });
      handleError('Failed to analyze text. Please try again.');
    }
  };

  // Handle pattern interactions
  const handlePatternClick = useCallback((pattern: Pattern) => {
    if (state.isCreativeMode) {
      setState(prev => ({
        ...prev,
        expandedPattern: prev.expandedPattern === pattern.id ? null : pattern.id
      }));
    }
  }, [state.isCreativeMode]);

  const handlePatternExpand = useCallback((patternId: string) => {
    setState(prev => ({
      ...prev,
      expandedPattern: prev.expandedPattern === patternId ? null : patternId
    }));
  }, []);

  // Customizer handlers
  const handleThemeChange = (newTheme: ObservatoryTheme) => {
    setObservatoryTheme(newTheme);
    // Auto-save theme changes to localStorage
    localStorage.setItem('observatory-theme', JSON.stringify(newTheme));
  };

  const handleThemeSave = (theme: ObservatoryTheme) => {
    localStorage.setItem('observatory-theme', JSON.stringify(theme));
    setSuccessMessage('Theme saved successfully!');
  };

  const handleThemeReset = () => {
    setObservatoryTheme(DEFAULT_THEME);
    localStorage.removeItem('observatory-theme');
    setSuccessMessage('Theme reset to default!');
  };

  // Handle save observation
  const handleSave = useCallback(async () => {
    const currentObservation = observation || anonymousObservation;
    if (!currentObservation || !currentUser) return;
    
    try {
      const title = `Observation - ${new Date().toLocaleDateString()}`;
      const observationData: ObservationData = {
        text: currentObservation.text,
        patterns: currentObservation.patterns,
        segments: currentObservation.segments,
        language: currentObservation.language,
        metadata: {
          userId: currentUser.uid,
          language: currentObservation.language,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      const result = await observationService.saveObservation({
        observation: observationData,
        title,
        tags: [],
        isPublic: false
      });
      
      setSuccessMessage(`Observation saved successfully! ID: ${result.id}`);
    } catch (error) {
      handleError('Failed to save observation. Please try again.');
    }
  }, [observation, anonymousObservation, currentUser]);

  // Handle create lesson from observation
  const handleCreateLesson = useCallback(() => {
    const currentObservation = observation || anonymousObservation;
    if (!currentObservation || !currentUser) {
      handleError('Please sign in to create lessons');
      return;
    }

    // Save the observation text for the Scriptorium
    localStorage.setItem('savedObservationText', currentObservation.text);
    
    // Navigate to Scriptorium
    navigate('/scriptorium');
  }, [observation, anonymousObservation, currentUser, navigate]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearObservation();
    setText('');
    setState(prev => ({
      ...prev,
      selectedPatternTypes: new Set(),
      searchQuery: '',
      expandedPattern: null
    }));
  }, [clearObservation]);

  // Add creative mode toggle
  const toggleCreativeMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreativeMode: !prev.isCreativeMode
    }));
  }, []);

  // Handle state changes
  const handleStateChange = useCallback((newState: Partial<ObservatoryState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      pb: 8, 
      background: `linear-gradient(135deg, ${theme.palette.forest?.background || theme.palette.background.default} 0%, ${theme.palette.forest?.card || theme.palette.background.paper} 100%)`
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center', position: 'relative' }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.125rem' },
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {state.isCreativeMode ? 'Pattern Studio' : 'Pattern Observatory'}
          </Typography>
          
          <Tooltip title={state.isCreativeMode ? "Switch to Analysis Mode" : "Switch to Creative Mode"}>
            <IconButton
              onClick={toggleCreativeMode}
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {state.isCreativeMode ? <VisibilityIcon /> : <CreateIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Input Section */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 4 : 6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('observatory.placeholder', 'Paste your text here to discover patterns...')}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                fontSize: '1.1rem'
              }
            }}
          />
          
          {/* Progress bar during observation */}
          {isObserving && (
            <LinearProgress 
              variant="determinate" 
              value={observationProgress} 
              sx={{ mb: 2, height: 6, borderRadius: 3 }}
            />
          )}
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleObserve}
              disabled={!text.trim() || isObserving}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                minWidth: { sm: 200 }
              }}
            >
              {isObserving ? t('observatory.observing', 'Observing...') : t('observatory.observe', 'Observe Patterns')}
            </Button>
              {(observation || anonymousObservation) && (
              <>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={!currentUser}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  {t('observatory.save', 'Save Observation')}
                    </Button>
                <Button
                  variant="outlined"
                  startIcon={<CreateIcon />}
                  onClick={handleCreateLesson}
                  disabled={!currentUser}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  {t('observatory.create_lesson', 'Create Lesson')}
                </Button>
                <Tooltip title={t('observatory.clearTooltip', 'Clear all data')}>
                  <IconButton onClick={handleClear} color="error">
                    <ClearIcon />
                  </IconButton>
                  </Tooltip>
              </>
            )}
          </Stack>
        </Paper>

        {/* Error State */}
              {observationError && (
                <Alert 
                  severity="error" 
            sx={{ mb: 2 }}
                  action={
                      <Button 
                        color="inherit" 
                        size="small"
                        onClick={() => {
                          setServiceErrorMessage(observationError?.message || 'Unknown error');
                          setFeedbackOpen(true);
                        }}
                      >
                {t('observatory.reportIssue', 'Report Issue')}
                      </Button>
                  }
                >
                  {observationError?.message || 'An error occurred'}
                </Alert>
              )}

        {/* Text Cleaning Notification */}
        {textCleaningInfo?.wasCleaned && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            onClose={() => setTextCleaningInfo(null)}
          >
            {t('observatory.text_cleaned', 'Text cleaned - removed metadata and formatting for better analysis')}
            {textCleaningInfo.originalLength && textCleaningInfo.cleanedLength && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                {textCleaningInfo.originalLength - textCleaningInfo.cleanedLength} characters removed
              </Typography>
            )}
          </Alert>
        )}

        {/* Payload Optimization Notification */}
        {payloadOptimizationInfo?.wasOptimized && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            onClose={() => setPayloadOptimizationInfo(null)}
          >
            {t('observatory.payload_optimized', 'Pattern results optimized for performance')}
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
              Showing {payloadOptimizationInfo.optimizedCount} of {payloadOptimizationInfo.originalCount} patterns found. 
              The most significant patterns have been preserved.
            </Typography>
          </Alert>
        )}

        {/* Main Content */}
        {(observation || anonymousObservation) ? (
          <ObservatoryTabs
            observation={observation || anonymousObservation}
            state={state}
            onStateChange={handleStateChange}
            onPatternClick={handlePatternClick}
            onPatternExpand={handlePatternExpand}
            theme={observatoryTheme}
            onThemeChange={handleThemeChange}
            significanceThreshold={significanceThreshold}
            onSignificanceThresholdChange={setSignificanceThreshold}
          />
        ) : !text && !isObserving ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('observatory.welcome', 'Welcome to the Observatory')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('observatory.welcome_desc', 'Enter text below to discover hidden patterns')}
            </Typography>
          </Box>
        ) : null}
      </Container>
      
      {/* Floating XP Display */}
      <FloatingXpDisplay {...lastXpGained} />


      
      {/* Feedback Dialog */}
      <ObservatoryFeedback
        open={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          setServiceErrorMessage(null);
        }}
        errorMessage={serviceErrorMessage || undefined}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Lessons Modal for Anonymous Users */}
      <Dialog
        open={showLessonsModal}
        onClose={() => setShowLessonsModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 600 }}>
          🎓 {t('lessons.modal.title', 'Ready to Learn More?')}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            {t('lessons.modal.description', "You've explored your free example! Our lessons teach you how to find these patterns yourself and unlock more Observatory observations.")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
            {t('lessons.modal.benefits', '✨ Learn pattern recognition techniques\n🔍 Earn more free Observatory uses\n🌟 Track your progress and achievements')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setShowLessonsModal(false);
              navigate('/lessons');
            }}
            sx={{ minWidth: 120 }}
          >
            {t('lessons.modal.visit_lessons', 'Visit Lessons')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setShowLessonsModal(false)}
            sx={{ minWidth: 120 }}
          >
            {t('lessons.modal.maybe_later', 'Maybe Later')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Observatory;