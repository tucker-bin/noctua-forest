import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Button,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  VolumeUp as VolumeUpIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const LessonContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  maxWidth: '800px',
  marginLeft: 'auto',
  marginRight: 'auto',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ExampleBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(2, 0),
  '& pre': {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
}));

interface Example {
  text: string;
  focus_points?: string[];
  romanization?: string;
  meaning?: string;
}

interface Section {
  title?: string;
  description?: string;
  example?: Example;
  examples?: Example[];
  points?: string[];
  [key: string]: any;
}

interface Lesson {
  title: string;
  [key: string]: Section | string;
}

interface LessonContentProps {
  path: string;
}

export const LessonContent: React.FC<LessonContentProps> = ({ path }) => {
  const { t, i18n } = useTranslation('lessons');
  const isRTL = i18n.dir() === 'rtl';
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [progress, setProgress] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => {
      const newStep = prevStep + 1;
      setProgress((newStep / 4) * 100);
      return newStep;
    });
  };

  const handleBack = () => {
    setActiveStep((prevStep) => {
      const newStep = prevStep - 1;
      setProgress((newStep / 4) * 100);
      return newStep;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language;
    window.speechSynthesis.speak(utterance);
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const renderExample = (example: any) => {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Example
            </Typography>
            <Tooltip title="Listen">
              <IconButton onClick={() => playAudio(example.text)}>
                <VolumeUpIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <ExampleBox>
            <pre dir={isRTL ? 'rtl' : 'ltr'}>
              {renderText(example.text)}
            </pre>
            {example.focus_points && (
              <List>
                {example.focus_points.map((point: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={point} />
                  </ListItem>
                ))}
              </List>
            )}
          </ExampleBox>
        </CardContent>
      </Card>
    );
  };

  const renderSection = (sectionKey: string, section: any) => {
    if (typeof section === 'string') {
      return <Typography>{section}</Typography>;
    }

    const isExpanded = expandedSections[sectionKey] ?? true;

    return (
      <Box key={sectionKey} sx={{ mb: 3 }}>
        <SectionTitle variant="h5">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {section.title}
            {section.example && (
              <Tooltip title="Listen">
                <IconButton size="small" onClick={() => playAudio(section.title)}>
                  <VolumeUpIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <IconButton onClick={() => toggleSection(sectionKey)}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </SectionTitle>
        
        <Collapse in={isExpanded}>
          {section.description && (
            <Typography paragraph>
              {section.description}
            </Typography>
          )}
          {section.example && renderExample(section.example)}
          {section.points && (
            <List>
              {section.points.map((point: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          )}
          {section.examples && (
            <Box>
              {section.examples.map((ex: any, index: number) => (
                <Box key={index} mb={2}>
                  <Typography variant="subtitle1" dir={isRTL ? 'rtl' : 'ltr'}>
                    {ex.text}
                    <Tooltip title="Listen">
                      <IconButton size="small" onClick={() => playAudio(ex.text)}>
                        <VolumeUpIcon />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ex.romanization && `${ex.romanization} - `}{ex.meaning}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {Object.entries(section).map(([key, value]: [string, any]) => {
            if (typeof value === 'object' && !Array.isArray(value) && key !== 'example' && key !== 'examples') {
              return renderSection(key, value);
            }
            return null;
          })}
        </Collapse>
      </Box>
    );
  };

  const lesson = t(path, { returnObjects: true }) as any;
  const sections = ['welcome', 'basic_recognition', 'practice_exercises', 'cultural_perspectives'];

  return (
    <LessonContainer>
      <Typography variant="h4" gutterBottom>
        {lesson.title}
        <Tooltip title="Listen">
          <IconButton onClick={() => playAudio(lesson.title)}>
            <VolumeUpIcon />
          </IconButton>
        </Tooltip>
      </Typography>

      <LinearProgress variant="determinate" value={progress} sx={{ mb: 4 }} />

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {sections.map((label) => (
          <Step key={label}>
            <StepLabel>{lesson[label]?.title || label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 4 }}>
        {renderSection(sections[activeStep], lesson[sections[activeStep]])}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === sections.length - 1}
          endIcon={<CheckCircleIcon />}
        >
          {activeStep === sections.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </LessonContainer>
  );
};

export default LessonContent; 