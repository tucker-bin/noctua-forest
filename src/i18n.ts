import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// RTL languages - updated to match available directories
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

// Import translations for all available languages
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import ptTranslation from './locales/pt/translation.json';
import zhTranslation from './locales/zh/translation.json';
import viTranslation from './locales/vi/translation.json';
import trTranslation from './locales/tr/translation.json';
import koTranslation from './locales/ko/translation.json';
import jaTranslation from './locales/ja/translation.json';
import idTranslation from './locales/id/translation.json';
import itTranslation from './locales/it/translation.json';
import deTranslation from './locales/de/translation.json';
import filTranslation from './locales/fil/translation.json';
import msTranslation from './locales/ms/translation.json';
import arTranslation from './locales/ar/translation.json';
import heTranslation from './locales/he/translation.json';
import hiTranslation from './locales/hi/translation.json';
import ruTranslation from './locales/ru/translation.json';
import ukTranslation from './locales/uk/translation.json';
import plTranslation from './locales/pl/translation.json';
import nlTranslation from './locales/nl/translation.json';
import svTranslation from './locales/sv/translation.json';
import thTranslation from './locales/th/translation.json';
import elTranslation from './locales/el/translation.json';
import faTranslation from './locales/fa/translation.json';
import urTranslation from './locales/ur/translation.json';

// Import lesson translations for languages that have them
import enLessons from './locales/en/lessons.json';
import esLessons from './locales/es/lessons.json';
import jaLessons from './locales/ja/lessons.json';
import arLessons from './locales/ar/lessons.json';
import zhLessons from './locales/zh/lessons.json';
import deLessons from './locales/de/lessons.json';
import faLessons from './locales/fa/lessons.json';
import urLessons from './locales/ur/lessons.json';

const resources = {
  en: { 
    translation: enTranslation,
    lessons: enLessons
  },
  es: { 
    translation: esTranslation,
    lessons: esLessons
  },
  fr: { translation: frTranslation },
  pt: { translation: ptTranslation },
  zh: { 
    translation: zhTranslation,
    lessons: zhLessons
  },
  vi: { translation: viTranslation },
  tr: { translation: trTranslation },
  ko: { translation: koTranslation },
  ja: { 
    translation: jaTranslation,
    lessons: jaLessons
  },
  id: { translation: idTranslation },
  it: { translation: itTranslation },
  de: { 
    translation: deTranslation,
    lessons: deLessons
  },
  fil: { translation: filTranslation },
  ms: { translation: msTranslation },
  ar: {
    translation: arTranslation,
    lessons: arLessons
  },
  he: { translation: heTranslation },
  hi: { translation: hiTranslation },
  ru: { translation: ruTranslation },
  uk: { translation: ukTranslation },
  pl: { translation: plTranslation },
  nl: { translation: nlTranslation },
  sv: { translation: svTranslation },
  th: { translation: thTranslation },
  el: { translation: elTranslation },
  fa: { 
    translation: faTranslation,
    lessons: faLessons
  },
  ur: { 
    translation: urTranslation,
    lessons: urLessons
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // Add support for nested keys
    keySeparator: '.',
    // Add support for namespaces
    ns: ['translation', 'lessons'],
    defaultNS: 'translation',
  });

// Function to check if a language is RTL
export const isRTL = (language: string): boolean => {
  const baseLanguage = language.split('-')[0].toLowerCase();
  return rtlLanguages.includes(baseLanguage);
};

// Function to set document direction based on language
export const setDocumentDirection = (language: string): void => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  
  // Also update the body class for CSS targeting
  document.body.classList.remove('rtl', 'ltr');
  document.body.classList.add(direction);
};

// RTL-aware styling utilities
export const rtlAware = {
  // Text alignment
  textAlign: (align: 'left' | 'right' | 'center') => {
    if (align === 'center') return 'center';
    const currentIsRTL = isRTL(i18n.language);
    if (align === 'left') return currentIsRTL ? 'right' : 'left';
    if (align === 'right') return currentIsRTL ? 'left' : 'right';
    return align;
  },
  
  // Margin utilities
  marginLeft: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { marginRight: value } : { marginLeft: value };
  },
  
  marginRight: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { marginLeft: value } : { marginRight: value };
  },
  
  // Padding utilities
  paddingLeft: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { paddingRight: value } : { paddingLeft: value };
  },
  
  paddingRight: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { paddingLeft: value } : { paddingRight: value };
  },
  
  // Position utilities
  left: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { right: value } : { left: value };
  },
  
  right: (value: string | number) => {
    const currentIsRTL = isRTL(i18n.language);
    return currentIsRTL ? { left: value } : { right: value };
  },
  
  // Transform utilities for centering
  translateX: (value: string) => {
    const currentIsRTL = isRTL(i18n.language);
    if (value === '-50%') return currentIsRTL ? 'translateX(50%)' : 'translateX(-50%)';
    return `translateX(${value})`;
  }
};

// Set initial direction
setDocumentDirection(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (language) => {
  setDocumentDirection(language);
});

export default i18n; 