import React from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

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
  const { i18n: i18nextInstance } = useTranslation();
  const currentLang = i18nextInstance.language;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select value={currentLang} onChange={handleChange} aria-label="Select language">
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher; 