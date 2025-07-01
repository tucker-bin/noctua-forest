import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { OverviewPanel } from './OverviewPanel';
import { PatternsPanel } from './PatternsPanel';
import { TextPanel } from './TextPanel';
import { LanguageAnalysisPanel } from '../LanguageAnalysisPanel';
import { PatternInspector } from '../PatternInspector';
import { ObservatoryCustomizer, ObservatoryTheme } from '../ObservatoryCustomizer';
import { ObservatoryState } from '../types';
import { ObservationResult, Pattern } from '../../../types/observatory';

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
      id={`observatory-tabpanel-${index}`}
      aria-labelledby={`observatory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface ObservatoryTabsProps {
  observation: ObservationResult | null;
  state: ObservatoryState;
  onStateChange: (newState: Partial<ObservatoryState>) => void;
  onPatternClick: (pattern: Pattern) => void;
  onPatternExpand: (patternId: string) => void;
  theme: ObservatoryTheme;
  onThemeChange: (newTheme: ObservatoryTheme) => void;
  significanceThreshold?: number;
  onSignificanceThresholdChange?: (threshold: number) => void;
}

const defaultObservation: ObservationResult = {
  id: '',
  text: '',
  patterns: [],
  segments: [],
  language: 'en',
  metadata: {
    userId: '',
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  createdAt: new Date()
};

export const ObservatoryTabs: React.FC<ObservatoryTabsProps> = ({
  observation,
  state,
  onStateChange,
  onPatternClick,
  onPatternExpand,
  theme,
  onThemeChange,
  significanceThreshold = 0.3,
  onSignificanceThresholdChange
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState(0);
  const [selectedPattern, setSelectedPattern] = React.useState<Pattern | undefined>(undefined);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePatternSelect = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    onPatternClick(pattern);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontSize: '0.95rem',
              fontWeight: 500,
              minWidth: 120,
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              }
            }
          }}
        >
          {/* 🎯 TAB 1: Main Observatory Experience */}
          <Tab label="🔭 Observatory" />
          {/* 🎯 TAB 2: Pattern Explorer */}
          <Tab label="🎨 Pattern Explorer" />
          {/* 🎯 TAB 3: Customize */}
          <Tab label="⚙️ Customize" />
        </Tabs>
      </Box>

      {/* 🌟 TAB 1: Main Observatory Experience */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Language Analysis Panel - Show code-switching and cultural analysis */}
          <LanguageAnalysisPanel
            culturalAnalysis={(observation as any)?.metadata?.culturalAnalysis}
            isVisible={!!(observation as any)?.metadata?.culturalAnalysis}
          />
          
          {/* Interactive Text with integrated controls */}
          <TextPanel
            observation={observation || defaultObservation}
            state={state}
            onStateChange={onStateChange}
            theme={theme}
            showPatternControls={true}
            onPatternClick={handlePatternSelect}
            onSwitchToCustomize={() => setActiveTab(2)}
          />
          
          {/* Simplified Pattern Overview */}
          <OverviewPanel
            observation={observation || defaultObservation}
            state={state}
            onStateChange={onStateChange}
            onPatternClick={handlePatternSelect}
            onPatternExpand={onPatternExpand}
          />
        </Box>
      </TabPanel>

      {/* 🌟 TAB 2: Pattern Explorer - Enhanced with Pattern Inspector */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Left Column: Pattern Inspector */}
          <Box>
            <PatternInspector
              patterns={observation?.patterns || []}
              selectedPattern={selectedPattern}
              onPatternSelect={handlePatternSelect}
              significanceThreshold={significanceThreshold}
            />
          </Box>
          
          {/* Right Column: Traditional Pattern Controls & Analysis */}
          <Box>
            <PatternsPanel
              observation={observation || defaultObservation}
              state={state}
              onStateChange={onStateChange}
              onPatternClick={handlePatternSelect}
              onPatternExpand={onPatternExpand}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* 🌟 TAB 3: Customize & Export */}
      <TabPanel value={activeTab} index={2}>
        <ObservatoryCustomizer
          theme={theme}
          onThemeChange={onThemeChange}
        />
      </TabPanel>
    </Box>
  );
}; 