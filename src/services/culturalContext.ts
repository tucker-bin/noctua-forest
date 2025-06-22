import { i18n } from 'i18next';

interface CulturalFeatures {
  writingSystem: string;
  soundPatterns: string[];
  culturalEmphasis: string[];
  traditionalForms?: string[];
}

const culturalFeatures: Record<string, CulturalFeatures> = {
  ar: {
    writingSystem: 'Arabic abjad with diacritical marks',
    soundPatterns: ['consonant emphasis', 'length contrast', 'root-pattern morphology'],
    culturalEmphasis: ['poetic meter', 'rhyme patterns', 'calligraphic traditions'],
    traditionalForms: ['qasida', 'saj', 'muwashshah']
  },
  ja: {
    writingSystem: 'Mixed system (kanji, hiragana, katakana)',
    soundPatterns: ['pitch accent', 'mora timing', 'vowel devoicing'],
    culturalEmphasis: ['onomatopoeia', 'word play', 'seasonal references'],
    traditionalForms: ['haiku', 'tanka', 'renga']
  },
  zh: {
    writingSystem: 'Chinese characters (hanzi)',
    soundPatterns: ['tones', 'syllable structure', 'compound words'],
    culturalEmphasis: ['four-character idioms', 'tonal patterns', 'semantic pairs'],
    traditionalForms: ['regulated verse', 'ci poetry', 'fu prose']
  },
  es: {
    writingSystem: 'Latin alphabet',
    soundPatterns: ['stress patterns', 'syllable timing', 'liaison'],
    culturalEmphasis: ['assonance', 'word play', 'regional variations'],
    traditionalForms: ['romance', 'copla', 'décima']
  },
  de: {
    writingSystem: 'Latin alphabet with umlauts',
    soundPatterns: ['consonant clusters', 'word stress', 'compound words'],
    culturalEmphasis: ['compound formation', 'word order', 'nominalization'],
    traditionalForms: ['ballad', 'minnesang', 'spruch']
  }
};

export async function fetchCulturalContext(language: string): Promise<string> {
  // Get the base language code (e.g., 'en-US' -> 'en')
  const baseLanguage = language.split('-')[0].toLowerCase();
  
  const features = culturalFeatures[baseLanguage];
  if (!features) {
    return 'Standard Latin script with typical phonological patterns';
  }

  return `${features.writingSystem}. 
Key sound patterns: ${features.soundPatterns.join(', ')}. 
Cultural emphasis: ${features.culturalEmphasis.join(', ')}.
${features.traditionalForms ? `Traditional forms: ${features.traditionalForms.join(', ')}.` : ''}`;
}

export function getScriptDirection(language: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const baseLanguage = language.split('-')[0].toLowerCase();
  return rtlLanguages.includes(baseLanguage) ? 'rtl' : 'ltr';
}

export function getLanguageFont(language: string): string {
  const fontMap: Record<string, string> = {
    ar: 'Amiri, Arial',
    ja: 'Noto Sans JP, Arial',
    zh: 'Noto Sans SC, Arial',
    ko: 'Noto Sans KR, Arial',
    th: 'Noto Sans Thai, Arial',
    he: 'Frank Ruhl Libre, Arial',
    fa: 'Vazirmatn, Arial',
    ur: 'Noto Nastaliq Urdu, Arial'
  };

  const baseLanguage = language.split('-')[0].toLowerCase();
  return fontMap[baseLanguage] || 'inherit';
} 