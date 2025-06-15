import React from 'react';
import i18n from '../i18n';
import Tooltip from '@mui/material/Tooltip';

const languages: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fil', label: 'Filipino' },
  { code: 'ms', label: 'Bahasa Melayu' },
  // Add more as needed
];

const LanguageSwitcher: React.FC = () => {
  const currentLang = i18n.language || 'en';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <Tooltip title="Change Language" placement="top">
      <select value={currentLang} onChange={handleChange} aria-label="Change Language">
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </Tooltip>
  );
};

export default LanguageSwitcher; 