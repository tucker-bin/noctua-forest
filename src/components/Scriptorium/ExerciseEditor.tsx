import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Typography,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

interface Exercise {
  type: 'pattern_recognition' | 'cultural_context' | 'emotional_analysis';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface ExerciseEditorProps {
  exercises: Exercise[];
  onExercisesChange: (exercises: Exercise[]) => void;
}

export const ExerciseEditor: React.FC<ExerciseEditorProps> = ({
  exercises,
  onExercisesChange
}) => {
  const { t } = useTranslation();
  const [newExercise, setNewExercise] = useState<Exercise>({
    type: 'pattern_recognition',
    question: '',
    options: [],
    correctAnswer: '',
    explanation: ''
  });
  const [newOption, setNewOption] = useState('');

  const handleAddExercise = () => {
    onExercisesChange([...exercises, { ...newExercise }]);
    setNewExercise({
      type: 'pattern_recognition',
      question: '',
      options: [],
      correctAnswer: '',
      explanation: ''
    });
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    onExercisesChange(updatedExercises);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setNewExercise({
        ...newExercise,
        options: [...(newExercise.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    setNewExercise({
      ...newExercise,
      options: newExercise.options?.filter((_, i) => i !== optionIndex)
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('scriptorium.exercises', 'Exercises')}
      </Typography>

      {/* Existing Exercises */}
      {exercises.map((exercise, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            mb: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            position: 'relative'
          }}
        >
          <IconButton
            size="small"
            onClick={() => handleRemoveExercise(index)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>

          <Typography variant="subtitle1" color="primary" gutterBottom>
            {t('scriptorium.exercise_number', 'Exercise {{number}}', { number: index + 1 })}
          </Typography>

          <Stack spacing={2}>
            <Typography variant="body2">
              {t('scriptorium.type', 'Type')}: {exercise.type}
            </Typography>
            <Typography variant="body2">
              {t('scriptorium.question', 'Question')}: {exercise.question}
            </Typography>
            {exercise.options && (
              <Box>
                <Typography variant="body2">
                  {t('scriptorium.options', 'Options')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {exercise.options.map((option, i) => (
                    <Chip key={i} label={option} size="small" />
                  ))}
                </Box>
              </Box>
            )}
            <Typography variant="body2">
              {t('scriptorium.correct_answer', 'Correct Answer')}: {exercise.correctAnswer}
            </Typography>
            <Typography variant="body2">
              {t('scriptorium.explanation', 'Explanation')}: {exercise.explanation}
            </Typography>
          </Stack>
        </Box>
      ))}

      {/* New Exercise Form */}
      <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('scriptorium.add_exercise', 'Add New Exercise')}
        </Typography>

        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>{t('scriptorium.exercise_type', 'Exercise Type')}</InputLabel>
            <Select
              value={newExercise.type}
              label={t('scriptorium.exercise_type', 'Exercise Type')}
              onChange={(e) => setNewExercise({ ...newExercise, type: e.target.value as Exercise['type'] })}
            >
              <MenuItem value="pattern_recognition">
                {t('scriptorium.pattern_recognition', 'Pattern Recognition')}
              </MenuItem>
              <MenuItem value="cultural_context">
                {t('scriptorium.cultural_context', 'Cultural Context')}
              </MenuItem>
              <MenuItem value="emotional_analysis">
                {t('scriptorium.emotional_analysis', 'Emotional Analysis')}
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('scriptorium.question', 'Question')}
            value={newExercise.question}
            onChange={(e) => setNewExercise({ ...newExercise, question: e.target.value })}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('scriptorium.options', 'Options')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder={t('scriptorium.add_option', 'Add option')}
              />
              <Button
                variant="outlined"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
              >
                <AddIcon />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {newExercise.options?.map((option, index) => (
                <Chip
                  key={index}
                  label={option}
                  onDelete={() => handleRemoveOption(index)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <TextField
            fullWidth
            label={t('scriptorium.correct_answer', 'Correct Answer')}
            value={newExercise.correctAnswer}
            onChange={(e) => setNewExercise({ ...newExercise, correctAnswer: e.target.value })}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('scriptorium.explanation', 'Explanation')}
            value={newExercise.explanation}
            onChange={(e) => setNewExercise({ ...newExercise, explanation: e.target.value })}
          />

          <Button
            variant="contained"
            onClick={handleAddExercise}
            disabled={!newExercise.question || !newExercise.correctAnswer}
            startIcon={<AddIcon />}
          >
            {t('scriptorium.add_exercise', 'Add Exercise')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}; 