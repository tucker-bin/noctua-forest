// Cultural Context Service - Code-switching detection and cross-cultural analysis
import { franc, francAll } from 'franc';

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
  wordByWordAnalysis: WordLanguage[];
}

export interface WordLanguage {
  word: string;
  language: string; // ISO 639-3 code
  confidence: number;
  startIndex: number;
  endIndex: number;
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
    const wordByWordAnalysis = this.analyzeWordByWord(text);

    return {
      detectedLanguages,
      codeSwithingPoints: codeSwitchingPoints,
      culturalPatterns,
      modernAnalysis,
      wordByWordAnalysis
    };
  }

  /**
   * Generate culturally-informed pattern descriptions
   */
  getCulturalPatternDescription(patternType: string, userLanguage: string, phoneticDetails: string): string {
    const culturalContext = this.getCulturalContext(patternType, userLanguage);
    
    if (culturalContext) {
      return `${phoneticDetails} — ${culturalContext}`;
    }
    
    return phoneticDetails;
  }

    /**
   * Detect non-English languages in the text using franc for precise detection
   */
  private detectLanguages(text: string): DetectedLanguage[] {
    const detected: DetectedLanguage[] = [];
    
    // Use franc for word-by-word and phrase-by-phrase language detection
    const languageMap = new Map<string, DetectedLanguage>();
    
    // Split text into sentences and phrases for more granular detection
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    
    // Analyze sentences first for context
    sentences.forEach((sentence) => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length > 10) { // Only analyze substantial sentences
        const detectedCode = franc(trimmedSentence);
        const allDetections = francAll(trimmedSentence);
        
        if (detectedCode && detectedCode !== 'und') {
          const confidence = allDetections.find((d: [string, number]) => d[0] === detectedCode)?.[1] || 0;
          
          if (!languageMap.has(detectedCode)) {
            languageMap.set(detectedCode, {
              code: detectedCode,
              name: this.getLanguageName(detectedCode),
              script: this.getScriptForLanguage(detectedCode),
              confidence: confidence,
              segments: []
            });
          }
          
          // Add this sentence as a segment
          const startIndex = text.indexOf(trimmedSentence);
          if (startIndex !== -1) {
            languageMap.get(detectedCode)!.segments.push({
              text: trimmedSentence,
              startIndex,
              endIndex: startIndex + trimmedSentence.length
            });
          }
        }
      }
    });
    
    // Analyze individual words for fine-grained detection
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w\u00C0-\u017F\u0100-\u024F\u0400-\u04FF\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0900-\u097f]/g, '');
      
      if (cleanWord.length > 2) { // Only analyze substantial words
        const detectedCode = franc(cleanWord);
        
        if (detectedCode && detectedCode !== 'und') {
          if (!languageMap.has(detectedCode)) {
            const allDetections = francAll(cleanWord);
            const confidence = allDetections.find((d: [string, number]) => d[0] === detectedCode)?.[1] || 0;
            
            languageMap.set(detectedCode, {
              code: detectedCode,
              name: this.getLanguageName(detectedCode),
              script: this.getScriptForLanguage(detectedCode),
              confidence: confidence,
              segments: []
            });
          }
          
          // Add this word as a segment
          const startIndex = text.indexOf(word);
          if (startIndex !== -1) {
            languageMap.get(detectedCode)!.segments.push({
              text: word,
              startIndex,
              endIndex: startIndex + word.length
            });
          }
        }
      }
    });
    
    // Convert map to array and sort by confidence
    const detectedLanguages = Array.from(languageMap.values())
      .sort((a, b) => b.confidence - a.confidence);
    
    // Add detected languages to result
    detected.push(...detectedLanguages);
    
    // Always include English as base if not already detected
    if (!detected.find(lang => lang.code === 'en')) {
      detected.push({
        code: 'en',
        name: 'English',
        script: 'Latin',
        confidence: 0.5,
        segments: this.extractEnglishSegments(text)
      });
    }
    
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
   * Get cultural context for pattern types
   */
  private getCulturalContext(patternType: string, userLanguage: string): string | null {
    const contextMap: Record<string, Record<string, string>> = {
      alliteration: {
        spanish: 'creates énfasis like Spanish aliteración',
        arabic: 'resonates with جناس (jinas) sound echoing',
        chinese: 'similar to 頭韻 (tóuyùn) initial sound matching',
        japanese: '頭韻 (tōin) - initial sound harmony',
        german: 'echoes Stabreim tradition in Germanic poetry'
      },
      rhyme: {
        spanish: 'perfect like rima consonante tradition',
        arabic: 'structured like classical قافية (qafiya)',
        persian: 'follows قافیه (qafiye) patterns',
        chinese: 'mirrors 韻腳 (yùnjiǎo) end-rhyme principles'
      },
      rhythm: {
        spanish: 'creates ritmo like traditional romance meter',
        arabic: 'structured like بحر (bahr) quantitative patterns',
        japanese: 'follows 音律 (onritsu) syllabic timing',
        chinese: 'balanced like 平仄 (píngzè) tonal rhythm'
      }
    };

    return contextMap[patternType]?.[userLanguage] || null;
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
      // Traditional pattern codes
      arabic: 'Arabic',
      chinese: 'Chinese',
      japanese: 'Japanese',
      korean: 'Korean',
      hindi: 'Hindi',
      persian: 'Persian',
      russian: 'Russian',
      spanish: 'Spanish',
      german: 'German',
      // ISO 639-3 codes used by franc
      ara: 'Arabic',
      cmn: 'Chinese (Mandarin)',
      jpn: 'Japanese',
      kor: 'Korean',
      hin: 'Hindi',
      fas: 'Persian',
      rus: 'Russian',
      spa: 'Spanish',
      deu: 'German',
      eng: 'English',
      fra: 'French',
      por: 'Portuguese',
      ita: 'Italian',
      nld: 'Dutch',
      pol: 'Polish',
      tur: 'Turkish',
      swe: 'Swedish',
      dan: 'Danish',
      nor: 'Norwegian'
    };
    return names[code] || code.toUpperCase();
  }

  private getScriptForLanguage(code: string): string {
    const scripts: Record<string, string> = {
      // Traditional pattern codes
      arabic: 'Arabic',
      persian: 'Persian', 
      chinese: 'Hanzi',
      japanese: 'Mixed',
      korean: 'Hangul',
      hindi: 'Devanagari',
      russian: 'Cyrillic',
      spanish: 'Latin',
      german: 'Latin',
      // ISO 639-3 codes used by franc
      ara: 'Arabic',
      fas: 'Persian',
      cmn: 'Hanzi',
      jpn: 'Mixed',
      kor: 'Hangul',
      hin: 'Devanagari',
      rus: 'Cyrillic',
      eng: 'Latin',
      spa: 'Latin',
      deu: 'Latin',
      fra: 'Latin',
      por: 'Latin',
      ita: 'Latin',
      nld: 'Latin',
      pol: 'Latin',
      tur: 'Latin',
      swe: 'Latin',
      dan: 'Latin',
      nor: 'Latin'
    };
    return scripts[code] || 'Latin';
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

  /**
   * Performs word-by-word language analysis on the text.
   */
  private analyzeWordByWord(text: string): WordLanguage[] {
    const wordAnalysis: WordLanguage[] = [];
    const words = text.split(/\s+/);
    let currentIndex = 0;

    words.forEach(word => {
      // Skip empty words and punctuation
      if (!word.trim() || /^[.,!?;:'")\-]+$/.test(word)) {
        currentIndex += word.length + 1;
        return;
      }

      // Clean the word for analysis
      const cleanWord = word.replace(/[^\w\u00C0-\u017F\u0100-\u024F\u0400-\u04FF\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0900-\u097f]/g, '');

      if (cleanWord.length > 0) {
        // First check if it's a common English word or follows English patterns
        const isEnglishWord = /^[a-zA-Z]+$/.test(cleanWord) || 
                             this.isCommonEnglishWord(cleanWord.toLowerCase());

        if (isEnglishWord) {
          wordAnalysis.push({
            word,
            language: 'eng',
            confidence: 0.9,
            startIndex: currentIndex,
            endIndex: currentIndex + word.length
          });
        } else {
          // Only use franc for non-English-looking words
          const detectedLang = franc(cleanWord);
          const allDetections = francAll(cleanWord);
          const confidence = allDetections.find(d => d[0] === detectedLang)?.[1] || 0;

          // Default to English for short words or uncertain detections
          const finalLang = (detectedLang === 'und' || cleanWord.length < 3) ? 'eng' : detectedLang;
          const finalConfidence = (finalLang === 'eng') ? 0.7 : confidence;

          wordAnalysis.push({
            word,
            language: finalLang,
            confidence: finalConfidence,
            startIndex: currentIndex,
            endIndex: currentIndex + word.length
          });
        }
      }

      currentIndex += word.length + 1; // +1 for the space
    });

    return wordAnalysis;
  }

  private isCommonEnglishWord(word: string): boolean {
    // Common English words that might be mistaken for other languages
    const commonEnglishWords = new Set([
      'red', 'led', 'bed', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
      'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
      'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
      'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
      'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
      'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
      'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
      'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
      'these', 'give', 'day', 'most', 'us'
    ]);

    return commonEnglishWords.has(word.toLowerCase());
  }
}

export const culturalContextService = new CulturalContextService(); 