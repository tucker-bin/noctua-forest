import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ScriptoriumLesson } from '../../../node-backend/src/types/lesson.types';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SchoolIcon from '@mui/icons-material/School';
import DownloadIcon from '@mui/icons-material/Download';
import { logger } from '../../utils/logger';

const ITEMS_PER_PAGE = 12;

export const CommunityLessons: React.FC = () => {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<ScriptoriumLesson[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [difficulty, setDifficulty] = useState<string>('');

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
        sortBy,
        ...(difficulty && { difficulty })
      });

      const response = await fetch(`/api/lessons/community?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      setLessons(data.lessons);
      setTotalLessons(data.total);
    } catch (err) {
      logger.error('Failed to fetch community lessons:', { error: err });
      setError(t('scriptorium.fetch_error', 'Failed to load community lessons. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [page, sortBy, difficulty]);

  const handleDownload = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons/scriptorium/${lessonId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download lesson');
      }

      const lesson = await response.json();
      // TODO: Implement lesson download/import functionality
      logger.info('Lesson downloaded:', { lessonId });
    } catch (err) {
      logger.error('Failed to download lesson:', { error: err });
      setError(t('scriptorium.download_error', 'Failed to download lesson. Please try again.'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('scriptorium.community_lessons', 'Community Lessons')}
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('scriptorium.sort_by', 'Sort By')}</InputLabel>
          <Select
            value={sortBy}
            label={t('scriptorium.sort_by', 'Sort By')}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
          >
            <MenuItem value="recent">{t('scriptorium.most_recent', 'Most Recent')}</MenuItem>
            <MenuItem value="popular">{t('scriptorium.most_popular', 'Most Popular')}</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('scriptorium.difficulty', 'Difficulty')}</InputLabel>
          <Select
            value={difficulty}
            label={t('scriptorium.difficulty', 'Difficulty')}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <MenuItem value="">{t('scriptorium.all_levels', 'All Levels')}</MenuItem>
            <MenuItem value="beginner">{t('scriptorium.beginner', 'Beginner')}</MenuItem>
            <MenuItem value="intermediate">{t('scriptorium.intermediate', 'Intermediate')}</MenuItem>
            <MenuItem value="advanced">{t('scriptorium.advanced', 'Advanced')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {lessons.map((lesson) => (
              <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, rgba(26, 27, 46, 0.95) 0%, rgba(26, 27, 46, 0.85) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 215, 0, 0.15)',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {lesson.title}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        icon={<SchoolIcon />}
                        label={lesson.difficulty}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        icon={<MusicNoteIcon />}
                        label={lesson.sourceAnalysis.songDetails.title}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {lesson.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {lesson.sourceAnalysis.patterns.map((pattern, index) => (
                        <Chip
                          key={index}
                          label={pattern.type}
                          size="small"
                          sx={{
                            background: `linear-gradient(45deg, rgba(78, 205, 196, ${pattern.significance}), rgba(69, 183, 209, ${pattern.significance}))`,
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(lesson.id)}
                    >
                      {t('scriptorium.use_lesson', 'Use Lesson')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(totalLessons / ITEMS_PER_PAGE)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
}; 