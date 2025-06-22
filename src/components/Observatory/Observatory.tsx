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
  LinearProgress
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
  Settings as SettingsIcon
} from '@mui/icons-material';

import { Pattern, Segment } from '../../types/observatory';
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
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatternTypes, setSelectedPatternTypes] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [serviceErrorMessage, setServiceErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastXpGained, setLastXpGained] = useState({ xp: 0, bonusType: '', trigger: 0 });

  // Customizer state
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [observatoryTheme, setObservatoryTheme] = useState<ObservatoryTheme>(() => {
    // Try to load saved theme from localStorage
    const saved = localStorage.getItem('observatory-theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  // Group patterns by type
  const patternsByType = useMemo(() => {
    if (!observation) return new Map<string, Pattern[]>();
    
    const grouped = new Map<string, Pattern[]>();
    observation.patterns.forEach(pattern => {
      const type = pattern.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(pattern);
    });
    
    // Sort each group by frequency
    grouped.forEach((patterns, type) => {
      patterns.sort((a, b) => b.segments.length - a.segments.length);
    });
    
    return grouped;
  }, [observation]);

  // Get pattern statistics
  const patternStats = useMemo(() => {
    if (!observation) return [];
    
    return Array.from(patternsByType.entries()).map(([type, patterns]) => ({
      type,
      count: patterns.length,
      instances: patterns.reduce((sum, p) => sum + p.segments.length, 0),
      patterns
    })).sort((a, b) => b.instances - a.instances);
  }, [patternsByType]);

  // Filter patterns based on search and selected types
  const filteredPatterns = useMemo(() => {
    if (!observation) return [];
    
    let patterns = observation.patterns;
    
    // Filter by type if any are selected (if none selected, show all)
    if (selectedPatternTypes.size > 0) {
      patterns = patterns.filter(p => selectedPatternTypes.has(p.type));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      patterns = patterns.filter(p => 
        p.type.toLowerCase().includes(query) ||
        p.segments.some((s: Segment) => s.text.toLowerCase().includes(query)) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return patterns;
  }, [observation, selectedPatternTypes, searchQuery]);
  
  // Effect to save observation to cache after it's been fetched
  useEffect(() => {
    if (observation && !cachedObservations[text]) {
      // Transform ObservationResult to ObservationData for caching
      const observationData = {
        patterns: observation.patterns,
        originalText: observation.originalText || observation.text || '',
        timestamp: observation.createdAt.toISOString(),
        metadata: {
          userId: observation.userId,
          language: observation.language,
          createdAt: observation.createdAt.toISOString(),
          updatedAt: observation.createdAt.toISOString()
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
      setServiceErrorMessage('Please sign in to use the Observatory. You can sign in using the button in the top right corner.');
      setFeedbackOpen(true);
      return;
    }
    
    try {
      await observeText(text, i18n.language);
    } catch (error) {
      log.error('Observation failed:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    }
  };

  // Handle pattern type selection
  const togglePatternType = (type: string) => {
    setSelectedPatternTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Customizer handlers
  const handleThemeChange = (newTheme: ObservatoryTheme) => {
    setObservatoryTheme(newTheme);
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



  // Handle share
  const handleShare = useCallback(() => {
    if (!observation) return;
    
    navigate('/forest/create-post', { 
      state: { 
        observationData: {
          originalText: observation.originalText || observation.text || '',
          patterns: observation.patterns,
          language: i18n.language,
          timestamp: new Date().toISOString()
        }
      }
    });
  }, [observation, navigate, i18n.language]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearObservation();
    setText('');
    setSelectedPatternTypes(new Set());
    setSearchQuery('');
    setActiveTab(0);
    setExpandedPattern(null);
  }, [clearObservation]);

  // Pattern detail component
  const PatternDetail = ({ pattern }: { pattern: Pattern }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1
      }}

    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
            {pattern.segments.map((s: Segment) => s.text).join(' • ')}
          </Typography>
          <Chip 
            label={pattern.segments.length}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ minWidth: 32 }}
          />
        </Box>
        {pattern.description && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {pattern.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      pb: 8, 
      background: `linear-gradient(135deg, ${theme.palette.forest?.background || theme.palette.background.default} 0%, ${theme.palette.forest?.card || theme.palette.background.paper} 100%)`
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            🔭 {t('observatory.title', 'Observatory')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('observatory.subtitle', 'Discover hidden patterns in any text')}
          </Typography>
        </Box>

        {/* Input Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
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
              {observation && (
              <>
                    <Button
                      variant="outlined"
                      startIcon={<CreateIcon />}
                      onClick={handleShare}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  {t('observatory.share', 'Create Post')}
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
                          setServiceErrorMessage(observationError);
                          setFeedbackOpen(true);
                        }}
                      >
                {t('observatory.reportIssue', 'Report Issue')}
                      </Button>
                  }
                >
                  {observationError}
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

        {/* Results Section */}
        {observation && !isObserving && (
          <>
            {/* Quick Stats */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Stack 
                direction="row" 
                spacing={2} 
                sx={{ 
                  overflowX: 'auto', 
                  pb: 1,
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': { 
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 2
                  }
                }}
              >
                <Chip
                  icon={<CategoryIcon />}
                  label={`${patternStats.length} ${t('observatory.patternTypes', 'Types')}`}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label={`${observation.patterns.length} ${t('observatory.totalPatterns', 'Patterns')}`}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<TextFieldsIcon />}
                  label={`${observation.patterns.reduce((sum, p) => sum + p.segments.length, 0)} ${t('observatory.instances', 'Instances')}`}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Paper>

            {/* Main Content Area */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Tab 
                  label={t('observatory.overview', 'Overview')} 
                  icon={<CategoryIcon />}
                  iconPosition="start"
                />
                <Tab 
                  label={t('observatory.patterns', 'Patterns')} 
                  icon={<FilterIcon />}
                  iconPosition="start"
                />
                <Tab 
                  label={t('observatory.text', 'Text')} 
                  icon={<TextFieldsIcon />}
                  iconPosition="start"
                />
                <Tab 
                  label={t('observatory.customize', 'Customize')} 
                  icon={<PaletteIcon />}
                  iconPosition="start"
                />
              </Tabs>

              <Box sx={{ minHeight: 400, maxHeight: { xs: 600, md: 700 }, overflow: 'auto' }}>
                {/* Overview Tab */}
                <TabPanel value={activeTab} index={0}>
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <LightbulbIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      {t('observatory.overviewHint', 'Click any pattern to highlight it in the text')}
                    </Typography>
                    
                    <Stack spacing={1}>
                      {patternStats.map(stat => (
                        <Accordion
                          key={stat.type}
                          expanded={expandedPattern === stat.type}
                          onChange={(_, isExpanded) => setExpandedPattern(isExpanded ? stat.type : null)}
                          sx={{
                            '&:before': { display: 'none' },
                            boxShadow: 1,
                            '&.Mui-expanded': { margin: '8px 0' }
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              minHeight: 56
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                              <Box sx={{ color: 'primary.main' }}>
                                {patternIcons[stat.type] || patternIcons.default}
                              </Box>
                              <Typography sx={{ flexGrow: 1, textTransform: 'capitalize', fontWeight: 500 }}>
                                {stat.type}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                  label={`${stat.count} ${t('observatory.patternsLower', 'patterns')}`} 
                                  size="small"
                                  variant="outlined"
                                />
                                <Badge badgeContent={stat.instances} color="primary" max={999}>
                                  <Box sx={{ width: 20 }} />
                                </Badge>
                              </Stack>
                </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1}>
                              {stat.patterns.slice(0, 5).map((pattern, idx) => (
                                <PatternDetail key={idx} pattern={pattern} />
                              ))}
                              {stat.patterns.length > 5 && (
                                <Button 
                                  size="small" 
                                  onClick={() => {
                                    setActiveTab(1);
                                    togglePatternType(stat.type);
                                  }}
                                  sx={{ alignSelf: 'flex-start' }}
                                >
                                  {t('observatory.viewAll', 'View all')} ({stat.patterns.length})
                                </Button>
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </Box>
                </TabPanel>

                {/* Patterns Tab */}
                <TabPanel value={activeTab} index={1}>
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Search */}
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={t('observatory.searchPatterns', 'Search patterns...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    {/* Type Filters */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('observatory.filterByType', 'Filter by Type')}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        {Array.from(patternsByType.keys()).map(type => (
                          <Chip
                            key={type}
                            label={type}
                            onClick={() => togglePatternType(type)}
                            color={selectedPatternTypes.has(type) ? 'primary' : 'default'}
                            variant={selectedPatternTypes.has(type) ? 'filled' : 'outlined'}
                            icon={patternIcons[type] || patternIcons.default}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Pattern List */}
                    <Stack spacing={1}>
                      {filteredPatterns.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          {t('observatory.noPatterns', 'No patterns found matching your criteria')}
                        </Typography>
                      ) : (
                        filteredPatterns.map((pattern, idx) => (
                          <PatternDetail key={idx} pattern={pattern} />
                        ))
                      )}
                    </Stack>
                  </Box>
                </TabPanel>

                {/* Text Tab */}
                <TabPanel value={activeTab} index={2}>
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {t('observatory.textView', 'Highlighted Text')}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={showHighlights ? t('observatory.hideHighlights', 'Hide highlights') : t('observatory.showHighlights', 'Show highlights')}>
                          <IconButton 
                            size="small" 
                            onClick={() => setShowHighlights(!showHighlights)}
                            color={showHighlights ? 'primary' : 'default'}
                          >
                            {showHighlights ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('observatory.customizeAppearance', 'Customize appearance')}>
                          <IconButton 
                            size="small" 
                            onClick={() => setActiveTab(3)}
                            color="default"
                          >
                            <PaletteIcon />
                          </IconButton>
                        </Tooltip>

                      </Stack>
                    </Box>
                    
                    <Paper 
                      id="observatory-text-display"
                      variant="outlined" 
                      sx={{ 
                        p: observatoryTheme.expandedView ? 0 : 2,
                        minHeight: observatoryTheme.expandedView ? observatoryTheme.viewportHeight : 200,
                        maxHeight: observatoryTheme.expandedView ? 'none' : 500,
                        overflow: observatoryTheme.expandedView ? 'visible' : 'auto',
                        bgcolor: observatoryTheme.expandedView ? 'transparent' : 'background.default',
                        border: observatoryTheme.expandedView ? 'none' : undefined
                      }}
                    >
                      <HighlightedText
                        originalText={observation.originalText || observation.text || ''} 
                        patterns={showHighlights ? filteredPatterns : []}
                        activeFilters={selectedPatternTypes}
                        isLightTheme={false}
                        theme={observatoryTheme}
                      />
                    </Paper>
                    

                  </Box>
                </TabPanel>

                {/* Customize Tab */}
                <TabPanel value={activeTab} index={3}>
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <ObservatoryCustomizer
                      theme={observatoryTheme}
                      onThemeChange={handleThemeChange}
                      onSave={handleThemeSave}
                      onReset={handleThemeReset}
                    />
                  </Box>
                </TabPanel>
              </Box>
            </Paper>
          </>
        )}

        {/* Empty State */}
        {!observation && !isObserving && !observationError && (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('observatory.welcome', 'Ready to Explore?')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              {t('observatory.instructions', 'Paste any text above and click "Observe Patterns" to discover rhymes, alliteration, and other linguistic patterns.')}
            </Typography>
          </Paper>
        )}
      </Container>
      
      {/* Floating XP Display */}
      <FloatingXpDisplay {...lastXpGained} />

      {/* Mobile FAB for pattern filters */}
      {isMobile && observation && activeTab === 1 && (
        <Fab
          color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setIsDrawerOpen(true)}
          >
          <FilterIcon />
          </Fab>
      )}
      
      {/* Filter Drawer for Mobile */}
          <SwipeableDrawer
            anchor="bottom"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        PaperProps={{
          sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('observatory.filters', 'Filters')}
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('observatory.selectTypes', 'Select pattern types to display')}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {Array.from(patternsByType.keys()).map(type => (
              <Chip
                key={type}
                label={type}
                onClick={() => togglePatternType(type)}
                color={selectedPatternTypes.has(type) ? 'primary' : 'default'}
                variant={selectedPatternTypes.has(type) ? 'filled' : 'outlined'}
                icon={patternIcons[type] || patternIcons.default}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Stack>
          <Button 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => setIsDrawerOpen(false)}
          >
            {t('observatory.apply', 'Apply Filters')}
          </Button>
            </Box>
          </SwipeableDrawer>
      
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
    </Box>
  );
};

export default Observatory;