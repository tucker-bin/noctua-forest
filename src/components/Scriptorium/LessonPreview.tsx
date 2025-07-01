import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import { ScriptoriumLesson, LessonSection, PatternGroup } from '../../../node-backend/src/types/lesson.types';
import { PatternType } from '../../../node-backend/src/types/observation';
import SchoolIcon from '@mui/icons-material/School';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';

interface Pattern {
  type: PatternType;
  examples: string[];
  explanation: string;
  significance: number;
}

interface LessonPreviewProps {
  lesson: ScriptoriumLesson;
  onEdit: () => void;
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({ lesson, onEdit }) => {
  const { t } = useTranslation();

  const renderSection = (section: LessonSection) => {
    switch (section.type) {
      case 'pattern_sequence':
        return (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6">{section.title}</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              {section.content}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                icon={<SchoolIcon />}
                label={section.difficulty}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('scriptorium.objective', 'Objective')}: {section.learningObjective}
              </Typography>
            </Box>

            <List>
              {section.patterns?.map((pattern: Pattern, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TimelineIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={pattern.type}
                    secondary={
                      <>
                        <Typography variant="body2">{pattern.explanation}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {pattern.examples.map((example: string, i: number) => (
                            <Chip
                              key={i}
                              label={example}
                              size="small"
                              sx={{
                                bgcolor: `rgba(78, 205, 196, ${pattern.significance})`,
                              }}
                            />
                          ))}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );
      
      case 'welcome':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.title}
            </Typography>
            <Typography variant="body1">
              {section.content}
            </Typography>
          </Box>
        );

      case 'examples':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.title}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {section.content}
            </Typography>
            <List>
              {section.examples?.map((example, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={example.text}
                    secondary={example.explanation}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 'exercise':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.title}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {section.content}
            </Typography>
            <List>
              {section.exercises?.map((exercise, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={exercise.question}
                    secondary={
                      <>
                        {exercise.options && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                            {exercise.options.map((option, i) => (
                              <Chip
                                key={i}
                                label={option}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                        {exercise.hint && (
                          <Typography variant="body2" color="text.secondary">
                            Hint: {exercise.hint}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={3}
        sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, rgba(26, 27, 46, 0.95) 0%, rgba(26, 27, 46, 0.85) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {lesson.title}
          </Typography>
          <Button variant="outlined" onClick={onEdit}>
            {t('scriptorium.edit_lesson', 'Edit Lesson')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip 
            icon={<SchoolIcon />}
            label={lesson.difficulty}
            sx={{ textTransform: 'capitalize' }}
          />
          <Chip 
            icon={<MusicNoteIcon />}
            label={lesson.sourceAnalysis.songDetails.title}
          />
          <Chip 
            label={`${lesson.duration}`}
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {lesson.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {lesson.content.sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderSection(section)}
          </React.Fragment>
        ))}
      </Paper>
    </Box>
  );
}; 