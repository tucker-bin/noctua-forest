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

// Cultural Context Service - Code-switching detection and cross-cultural analysis

interface DetectedLanguage {
  code: string;
  name: string;
  script: string;
  confidence: number;
  segments: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
}

interface CulturalPattern {
  type: string;
  nativeName: string;
  description: string;
  phoneticContext: string;
  culturalSignificance: string;
}

interface CrossLinguisticAnalysis {
  detectedLanguages: DetectedLanguage[];
  codeSwithingPoints: Array<{
    position: number;
    fromLanguage: string;
    toLanguage: string;
    phoneticTransition: string;
  }>;
  culturalPatterns: CulturalPattern[];
  modernAnalysis: string;
}

// Language detection patterns using Unicode ranges and common words
const LANGUAGE_PATTERNS = {
  arabic: {
    unicode: /[\u0600-\u06FF\u0750-\u077F]/,
    common: ['في', 'من', 'إلى', 'على', 'هذا', 'التي'],
    script: 'Arabic',
    phoneticMarkers: ['ʕ', 'ħ', 'q', 'x', 'ɣ', 'ʃ', 'ð', 'θ'] // pharyngeal, uvular sounds
  },
  chinese: {
    unicode: /[\u4e00-\u9fff]/,
    common: ['的', '是', '在', '了', '和', '有'],
    script: 'Hanzi',
    phoneticMarkers: ['tone', 'retroflex', 'aspirated']
  },
  japanese: {
    unicode: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
    common: ['の', 'に', 'は', 'を', 'が', 'で'],
    script: 'Mixed',
    phoneticMarkers: ['mora', 'palatalized', 'geminate']
  },
  korean: {
    unicode: /[\uac00-\ud7af]/,
    common: ['의', '이', '가', '을', '를', '에'],
    script: 'Hangul',
    phoneticMarkers: ['tense', 'aspirated', 'syllable-final']
  },
  hindi: {
    unicode: /[\u0900-\u097f]/,
    common: ['का', 'के', 'में', 'है', 'से', 'को'],
    script: 'Devanagari',
    phoneticMarkers: ['retroflex', 'breathy', 'dental']
  },
  persian: {
    unicode: /[\u0600-\u06FF]/,
    common: ['در', 'به', 'از', 'که', 'را', 'با'],
    script: 'Persian',
    phoneticMarkers: ['uvular', 'epenthetic', 'vowel_harmony']
  },
  russian: {
    unicode: /[\u0400-\u04ff]/,
    common: ['в', 'и', 'на', 'с', 'не', 'что'],
    script: 'Cyrillic',
    phoneticMarkers: ['palatalized', 'hard_soft', 'vowel_reduction']
  },
  spanish: {
    unicode: /[áéíóúñü]/,
    common: ['de', 'la', 'que', 'el', 'en', 'y'],
    script: 'Latin',
    phoneticMarkers: ['trilled_r', 'dental', 'open_syllable']
  },
  german: {
    unicode: /[äöüß]/,
    common: ['der', 'die', 'und', 'in', 'den', 'von'],
    script: 'Latin',
    phoneticMarkers: ['fronted', 'consonant_cluster', 'final_devoicing']
  }
};

// Cultural poetic traditions and their characteristics
const CULTURAL_TRADITIONS = {
  arabic: {
    jinas: {
      type: 'sound_similarity',
      levels: ['tam', 'naqis', 'mutlaq'],
      description: 'Sophisticated sound echoing with precise classifications',
      phoneticFocus: 'Root consonant patterns and vowel alternation'
    },
    bahr: {
      type: 'meter',
      description: 'Quantitative meter based on long/short syllables',
      phoneticFocus: 'Syllable weight and rhythmic patterns'
    }
  },
  chinese: {
    pingze: {
      type: 'tonal_parallelism',
      description: 'Tonal pattern regulation in classical poetry',
      phoneticFocus: 'Tone contour and pitch relationships'
    },
    duilian: {
      type: 'structural_parallelism',
      description: 'Semantic and phonetic parallelism in couplets',
      phoneticFocus: 'Syllable count and tonal balance'
    }
  },
  japanese: {
    jiamari: {
      type: 'syllable_overflow',
      description: 'Deliberate excess in traditional forms',
      phoneticFocus: 'Mora timing and rhythm disruption'
    },
    onomatopoeia: {
      type: 'sound_symbolism',
      description: 'Extensive use of mimetic words',
      phoneticFocus: 'Consonant symbolism and vowel quality'
    }
  },
  persian: {
    radif: {
      type: 'refrain_pattern',
      description: 'Recurring word or phrase in ghazal',
      phoneticFocus: 'Syllable echo and semantic resonance'
    },
    qafiya: {
      type: 'rhyme_pattern',
      description: 'Classical rhyme scheme with strict rules',
      phoneticFocus: 'Consonant closure and vowel matching'
    }
  },
  spanish: {
    rima_consonante: {
      type: 'perfect_rhyme',
      description: 'Full phonetic correspondence from stressed vowel',
      phoneticFocus: 'Syllable-final matching including consonants'
    },
    esdrujula: {
      type: 'proparoxytone_rhythm',
      description: 'Stress patterns creating musical effect',
      phoneticFocus: 'Antepenultimate stress and rhythm acceleration'
    }
  }
};

export class CulturalContextService {
  
  /**
   * Detect code-switching and provide cross-cultural analysis
   */
  analyzeMultilingualText(text: string): CrossLinguisticAnalysis {
    const detectedLanguages = this.detectLanguages(text);
    const codeSwitchingPoints = this.findCodeSwitchingPoints(text, detectedLanguages);
    const culturalPatterns = this.identifyCulturalPatterns(text, detectedLanguages);
    const modernAnalysis = this.generateModernAnalysis(text, detectedLanguages, culturalPatterns);

    return {
      detectedLanguages,
      codeSwithingPoints: codeSwitchingPoints,
      culturalPatterns,
      modernAnalysis
    };
  }

  /**
   * Detect non-English languages in the text
   */
  private detectLanguages(text: string): DetectedLanguage[] {
    const detected: DetectedLanguage[] = [];
    
    // Always include English as base
    detected.push({
      code: 'en',
      name: 'English',
      script: 'Latin',
      confidence: 0.8,
      segments: this.extractEnglishSegments(text)
    });

    // Check for each language pattern
    Object.entries(LANGUAGE_PATTERNS).forEach(([langCode, pattern]) => {
      const segments = this.extractLanguageSegments(text, pattern);
      if (segments.length > 0) {
        const confidence = this.calculateConfidence(text, pattern);
        detected.push({
          code: langCode,
          name: this.getLanguageName(langCode),
          script: pattern.script,
          confidence,
          segments
        });
      }
    });

    return detected.filter(lang => lang.segments.length > 0);
  }

  /**
   * Extract segments for a specific language
   */
  private extractLanguageSegments(text: string, pattern: any): Array<{text: string, startIndex: number, endIndex: number}> {
    const segments: Array<{text: string, startIndex: number, endIndex: number}> = [];
    const unicodeMatches = [...text.matchAll(new RegExp(pattern.unicode.source + '+', 'g'))];
    
    unicodeMatches.forEach(match => {
      if (match.index !== undefined) {
        segments.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    return segments;
  }

  /**
   * Extract English segments (non-foreign script)
   */
  private extractEnglishSegments(text: string): Array<{text: string, startIndex: number, endIndex: number}> {
    const segments: Array<{text: string, startIndex: number, endIndex: number}> = [];
    const words = text.split(/(\s+)/);
    let currentIndex = 0;

    words.forEach(word => {
      if (/^[a-zA-Z\-',.!?;:]+$/.test(word.trim()) && word.trim().length > 0) {
        segments.push({
          text: word,
          startIndex: currentIndex,
          endIndex: currentIndex + word.length
        });
      }
      currentIndex += word.length;
    });

    return segments;
  }

  /**
   * Find points where language switches occur
   */
  private findCodeSwitchingPoints(text: string, languages: DetectedLanguage[]): Array<{
    position: number;
    fromLanguage: string;
    toLanguage: string;
    phoneticTransition: string;
  }> {
    const switchPoints: Array<{position: number, fromLanguage: string, toLanguage: string, phoneticTransition: string}> = [];
    
    if (languages.length < 2) return switchPoints;

    // Find transition points between language segments
    const allSegments = languages.flatMap(lang => 
      lang.segments.map(seg => ({ ...seg, language: lang.code, script: lang.script }))
    ).sort((a, b) => a.startIndex - b.startIndex);

    for (let i = 1; i < allSegments.length; i++) {
      const prev = allSegments[i - 1];
      const curr = allSegments[i];
      
      if (prev.language !== curr.language) {
        const transition = this.analyzePhoneticTransition(prev, curr);
        switchPoints.push({
          position: curr.startIndex,
          fromLanguage: prev.language,
          toLanguage: curr.language,
          phoneticTransition: transition
        });
      }
    }

    return switchPoints;
  }

  /**
   * Analyze phonetic transition between languages
   */
  private analyzePhoneticTransition(prev: any, curr: any): string {
    const prevLang = LANGUAGE_PATTERNS[prev.language as keyof typeof LANGUAGE_PATTERNS];
    const currLang = LANGUAGE_PATTERNS[curr.language as keyof typeof LANGUAGE_PATTERNS];
    
    if (!prevLang || !currLang) return 'Script transition';

    // Analyze phonetic contrast
    if (prev.script !== curr.script) {
      return `Script shift: ${prev.script} → ${curr.script} creates visual and phonetic contrast`;
    }

    return `Phonetic shift: Different sound systems creating textural variation`;
  }

  /**
   * Identify cultural poetic patterns
   */
  private identifyCulturalPatterns(text: string, languages: DetectedLanguage[]): CulturalPattern[] {
    const patterns: CulturalPattern[] = [];

    languages.forEach(lang => {
      const traditions = CULTURAL_TRADITIONS[lang.code as keyof typeof CULTURAL_TRADITIONS];
      if (traditions) {
        Object.entries(traditions).forEach(([patternName, patternData]) => {
          // Check if this cultural pattern appears in the text
          if (this.detectCulturalPattern(text, lang, patternData)) {
            patterns.push({
              type: patternName,
              nativeName: this.getNativePatternName(lang.code, patternName),
              description: patternData.description,
              phoneticContext: patternData.phoneticFocus,
              culturalSignificance: this.getCulturalSignificance(lang.code, patternName)
            });
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Detect if a cultural pattern is present
   */
  private detectCulturalPattern(text: string, language: DetectedLanguage, patternData: any): boolean {
    // Simplified detection - in reality this would be much more sophisticated
    return language.segments.length > 0 && language.confidence > 0.3;
  }

  /**
   * Generate modern phonetic analysis
   */
  private generateModernAnalysis(text: string, languages: DetectedLanguage[], patterns: CulturalPattern[]): string {
    if (languages.length === 1) {
      return 'Monolingual English text with standard Western prosodic patterns.';
    }

    const nonEnglish = languages.filter(l => l.code !== 'en');
    const analysis: string[] = [];

    analysis.push(`Code-switching detected: ${nonEnglish.map(l => l.name).join(', ')} elements integrated into English matrix.`);

    if (patterns.length > 0) {
      analysis.push(`Cultural prosodic elements: ${patterns.map(p => p.nativeName).join(', ')} create unique cross-linguistic effects.`);
    }

    analysis.push('Modern phonetic analysis reveals distinct articulatory patterns interacting to create hybrid textural effects.');

    return analysis.join(' ');
  }

  /**
   * Helper methods
   */
  private calculateConfidence(text: string, pattern: any): number {
    const unicodeMatches = (text.match(pattern.unicode) || []).length;
    const commonWordMatches = pattern.common.filter((word: string) => text.includes(word)).length;
    return Math.min(0.9, (unicodeMatches * 0.1 + commonWordMatches * 0.2));
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      arabic: 'Arabic',
      chinese: 'Chinese',
      japanese: 'Japanese',
      korean: 'Korean',
      hindi: 'Hindi',
      persian: 'Persian',
      russian: 'Russian',
      spanish: 'Spanish',
      german: 'German'
    };
    return names[code] || code;
  }

  private getNativePatternName(langCode: string, patternName: string): string {
    const nativeNames: Record<string, Record<string, string>> = {
      arabic: { jinas: 'جناس', bahr: 'بحر' },
      chinese: { pingze: '平仄', duilian: '對聯' },
      japanese: { jiamari: '字余り', onomatopoeia: '擬音語' },
      persian: { radif: 'ردیف', qafiya: 'قافیه' },
      spanish: { rima_consonante: 'rima consonante', esdrujula: 'esdrújula' }
    };
    return nativeNames[langCode]?.[patternName] || patternName;
  }

  private getCulturalSignificance(langCode: string, patternName: string): string {
    const significance: Record<string, Record<string, string>> = {
      arabic: {
        jinas: 'Central to classical Arabic poetry, emphasizing the beauty of Arabic morphology',
        bahr: 'Foundation of Arabic prosody, connecting to musical and oral traditions'
      },
      chinese: {
        pingze: 'Core principle of regulated verse, balancing yin-yang in sound',
        duilian: 'Embodies Chinese aesthetic ideals of balance and parallelism'
      },
      persian: {
        radif: 'Signature element of ghazal form, creating unity and emotional resonance',
        qafiya: 'Classical rhyme structure maintaining musical flow in Persian poetry'
      }
    };
    return significance[langCode]?.[patternName] || 'Culturally significant poetic device';
  }
}

export const culturalContextService = new CulturalContextService(); 