import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Paper, Divider } from '@mui/material';
import LessonContent from './LessonContent';

const LessonTest: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);

  const handleLanguageChange = (event: any) => {
    const lang = event.target.value;
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ar', name: 'العربية' }
  ];

  const hasLessonTranslation = (langCode: string) => {
    const resources = i18n.options.resources || {};
    return resources[langCode]?.lessons !== undefined;
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Lesson Preview
        </Typography>
        <Typography variant="body1" paragraph>
          Select a language to preview the lesson content. Each language version includes culturally relevant examples and patterns.
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={currentLanguage}
            label="Language"
            onChange={handleLanguageChange}
          >
            {languages.map((lang) => (
              <MenuItem 
                key={lang.code} 
                value={lang.code}
                disabled={!hasLessonTranslation(lang.code)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{lang.name}</span>
                  {!hasLessonTranslation(lang.code) && (
                    <Typography variant="caption" color="text.secondary">
                      (Translation in progress)
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <LessonContent path="celestial_observer.first_light" />
    </Box>
  );
};

export default LessonTest; 