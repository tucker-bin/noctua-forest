import React from 'react';
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';

const languages: { code: string; label: string; rtl?: boolean }[] = [
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
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'he', label: 'עברית', rtl: true },
  { code: 'fa', label: 'فارسی', rtl: true },
  { code: 'ur', label: 'اردو', rtl: true },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'th', label: 'ไทย' },
  { code: 'el', label: 'Ελληνικά' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n: i18nextInstance } = useTranslation();
  const currentLang = i18nextInstance.language;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
  };

  return (
    <select 
      value={currentLang} 
      onChange={handleChange} 
      aria-label="Select language"
      style={{
        backgroundColor: 'transparent',
        color: 'inherit',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '0.875rem'
      }}
    >
      {languages.map((lang) => (
        <option 
          key={lang.code} 
          value={lang.code}
          style={{
            backgroundColor: '#1a1f2e',
            color: 'white',
            direction: lang.rtl ? 'rtl' : 'ltr'
          }}
        >
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher; 