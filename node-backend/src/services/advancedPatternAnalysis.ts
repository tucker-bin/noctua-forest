import { Pattern, Segment, PatternType } from '../types/observation';
import { phoneticize, languageConfigs } from './phoneticService';

interface TraditionalForm {
  name: string;
  type: 'sonnet' | 'haiku' | 'villanelle' | 'ghazal' | 'ballad' | 'tanka' | 'pantoum';
  rhymeScheme?: string;
  syllablePattern?: number[];
  lineCount?: number;
  language?: string;
  culturalContext: string;
}

// Advanced pattern analysis for sophisticated literary detection
export class AdvancedPatternAnalysis {
  
  // Traditional forms database
  private static traditionalForms: TraditionalForm[] = [
    // English forms
    { name: 'Shakespearean Sonnet', type: 'sonnet', rhymeScheme: 'ABABCDCDEFEFGG', lineCount: 14, language: 'en', culturalContext: 'English Renaissance poetry' },
    { name: 'Petrarchan Sonnet', type: 'sonnet', rhymeScheme: 'ABBAABBACDECDE', lineCount: 14, language: 'en', culturalContext: 'Italian Renaissance influence' },
    { name: 'Spenserian Sonnet', type: 'sonnet', rhymeScheme: 'ABABBCBCCDCDEE', lineCount: 14, language: 'en', culturalContext: 'Elizabethan poetry' },
    { name: 'English Haiku', type: 'haiku', syllablePattern: [5, 7, 5], lineCount: 3, language: 'en', culturalContext: 'Japanese-inspired nature poetry' },
    { name: 'Traditional Ballad', type: 'ballad', rhymeScheme: 'ABCB', lineCount: 4, language: 'en', culturalContext: 'Folk narrative tradition' },
    
    // Japanese forms
    { name: 'Traditional Haiku', type: 'haiku', syllablePattern: [5, 7, 5], lineCount: 3, language: 'ja', culturalContext: 'Traditional Japanese nature meditation' },
    { name: 'Tanka', type: 'tanka', syllablePattern: [5, 7, 5, 7, 7], lineCount: 5, language: 'ja', culturalContext: 'Classical Japanese court poetry' },
    
    // Arabic forms
    { name: 'Arabic Ghazal', type: 'ghazal', rhymeScheme: 'AA BA CA DA EA', language: 'ar', culturalContext: 'Classical Arabic love poetry' },
    
    // Spanish forms
    { name: 'Romance', type: 'ballad', rhymeScheme: 'ASSONANT', language: 'es', culturalContext: 'Spanish narrative ballad tradition' },
    
    // French forms
    { name: 'Villanelle', type: 'villanelle', rhymeScheme: 'ABA ABA ABA ABA ABA ABAA', lineCount: 19, language: 'fr', culturalContext: 'French pastoral poetry with refrains' },
    { name: 'Pantoum', type: 'pantoum', language: 'fr', culturalContext: 'Malaysian-inspired interlocking verse' }
  ];
  
  // Main analysis entry point - COMPREHENSIVE APPROACH
  static analyzeText(text: string, segments: Segment[], language: string = 'en'): Pattern[] {
    const patterns: Pattern[] = [];
    
    // === RULE-BASED ANALYSIS (Fast & Precise) ===
    const perfectRhymes = this.detectPerfectRhymes(segments, language);
    const slantRhymes = this.detectSlantRhymes(segments, language);
    
    // Combine rhyme patterns intelligently
    const rhymeGroups = new Map<string, Pattern[]>();
    
    // Group rhymes by their text coverage
    [...perfectRhymes, ...slantRhymes].forEach(pattern => {
      const segmentKey = pattern.segments.sort().join(',');
      if (!rhymeGroups.has(segmentKey)) {
        rhymeGroups.set(segmentKey, []);
      }
      rhymeGroups.get(segmentKey)!.push(pattern);
    });

    // For each group, keep the most significant pattern
    rhymeGroups.forEach(group => {
      // Sort by significance and pattern type (perfect rhymes preferred over slant)
      const sortedPatterns = group.sort((a, b) => {
        const sigDiff = (b.significance || 0) - (a.significance || 0);
        if (sigDiff !== 0) return sigDiff;
        // If significance is equal, prefer perfect rhymes
        if (a.type === 'rhyme' && b.type !== 'rhyme') return -1;
        if (a.type !== 'rhyme' && b.type === 'rhyme') return 1;
        return 0;
      });

      patterns.push(sortedPatterns[0]); // Add the highest scoring pattern
    });

    // Add other pattern types
    patterns.push(...this.detectPerfectAlliteration(segments, language));
    patterns.push(...this.detectCodeSwitching(segments, text));
    patterns.push(...this.detectCrossLinguisticRhymes(segments, text));
    patterns.push(...this.detectInternalRhymes(segments, text, language));
    patterns.push(...this.detectAssonanceConsonance(segments, language));
    patterns.push(...this.detectComplexRhythms(segments, text, language));
    
    // Filter and sort final patterns
    return patterns
      .filter(p => p.segments.length >= 2) // Only meaningful patterns
      .sort((a, b) => {
        // Sort by significance and pattern complexity
        const sigDiff = (b.significance || 0) - (a.significance || 0);
        if (sigDiff !== 0) return sigDiff;
        
        // If significance is equal, prioritize by pattern type
        const typeOrder = {
          'rhyme': 5,
          'slant_rhyme': 4,
          'alliteration': 3,
          'assonance': 2,
          'consonance': 2,
          'rhythm': 1
        };
        return (typeOrder[b.type as keyof typeof typeOrder] || 0) - 
               (typeOrder[a.type as keyof typeof typeOrder] || 0);
      });
  }

  // === RULE-BASED: PERFECT RHYMES ===
  static detectPerfectRhymes(segments: Segment[], language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const rhymeGroups = new Map<string, Segment[]>();
    
    segments.forEach(segment => {
      if (segment.text.length < 2) return;
      
      // Simple rhyme detection based on last 2-3 characters for now
      const word = segment.text.toLowerCase();
      let rhymeSound = '';
      
      if (word.length >= 3) {
        rhymeSound = word.slice(-2); // Last 2 characters
      }
      
      if (rhymeSound) {
        if (!rhymeGroups.has(rhymeSound)) {
          rhymeGroups.set(rhymeSound, []);
        }
        rhymeGroups.get(rhymeSound)!.push(segment);
      }
    });
    
    let rhymeIndex = 0;
    rhymeGroups.forEach((segmentGroup, rhymeSound) => {
      if (segmentGroup.length >= 2) {
        const rhymeType = this.classifyRhymeType(segmentGroup, rhymeSound);
        const significance = rhymeType === 'multisyllabic' ? 0.9 : (rhymeType === 'feminine' ? 0.7 : 0.5);

        patterns.push({
          id: `perfect_rhyme_${rhymeSound.replace(/[^a-zA-Z]/g, '')}`,
          type: 'rhyme',
          segments: segmentGroup.map(s => s.id),
          originalText: segmentGroup.map(s => s.text).join(' / '),
          significance,
          acousticFeatures: {
            primaryFeature: `Perfect ${rhymeType} rhyme`,
            secondaryFeatures: [
              `Type: end rhyme`,
              `Strength: Perfect`,
              `Words: ${segmentGroup.length}`,
              `Language: ${language}`
            ]
          },
          description: `Perfect end rhyme with /${rhymeSound}/ sound (${segmentGroup.length} words)`
        });
      }
    });
    
    return patterns;
  }

  // === RULE-BASED: PERFECT ALLITERATION ===
  static detectPerfectAlliteration(segments: Segment[], language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const initialGroups = new Map<string, Segment[]>();
    
    segments.forEach(segment => {
      if (segment.text.length < 2) return;
      
      const firstLetter = segment.text.charAt(0).toLowerCase();
      
      // Only consider letters, not numbers or punctuation
      if (firstLetter.match(/[a-z]/)) {
        if (!initialGroups.has(firstLetter)) {
          initialGroups.set(firstLetter, []);
        }
        initialGroups.get(firstLetter)!.push(segment);
      }
    });
    
    let alliterationIndex = 0;
    initialGroups.forEach((segmentGroup, letter) => {
      if (segmentGroup.length >= 2) {
        const significance = 0.4 + (Math.min(segmentGroup.length, 5) * 0.1); // Score 0.5 to 0.9
        patterns.push({
          id: `perfect_alliteration_${letter}`,
          type: 'alliteration',
          segments: segmentGroup.map(s => s.id),
          originalText: segmentGroup.map(s => s.text).join(' / '),
          significance,
          acousticFeatures: {
            primaryFeature: `Perfect alliteration: /${letter}/`,
            secondaryFeatures: [
              `Type: initial alliteration`,
              `Sound repetition`,
              `Words: ${segmentGroup.length}`,
              `Language-specific pattern`
            ]
          },
          description: `Perfect alliteration with /${letter}/ initial sound (${segmentGroup.length} words)`
        });
      }
    });
    
    return patterns;
  }

  // === RULE-BASED: TRADITIONAL FORMS ===
  static detectTraditionalForms(segments: Segment[], text: string, language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    this.traditionalForms.forEach(form => {
      if (form.language === language || !form.language) {
        const detection = this.matchTraditionalForm(lines, form, segments);
        if (detection) {
          patterns.push(detection);
        }
      }
    });
    
    return patterns;
  }

  // === MULTILINGUAL: CODE-SWITCHING ===
  static detectCodeSwitching(segments: Segment[], text: string): Pattern[] {
    const patterns: Pattern[] = [];
    const languageMap = this.mapSegmentLanguages(segments);
    const uniqueLanguages = Array.from(new Set(languageMap.values()));
    
    if (uniqueLanguages.length > 1) {
      const switchingPoints = this.findLanguageSwitchingPoints(segments, languageMap);
      
      if (switchingPoints.length > 0) {
        patterns.push({
          id: 'code_switching_analysis',
          type: 'rhythm',
          segments: switchingPoints.map(s => s.id),
          originalText: switchingPoints.map(s => s.text).join(' '),
          acousticFeatures: {
            primaryFeature: 'Multilingual code-switching',
            secondaryFeatures: [
              `Languages: ${uniqueLanguages.join(', ')}`,
              `Switch points: ${switchingPoints.length}`,
              'Cultural bilingual expression',
              'Cross-linguistic phonetic patterns'
            ]
          },
          description: `Code-switching detected between ${uniqueLanguages.join(' and ')}: ${switchingPoints.length} transition points`
        });
      }
      
      // Detect cross-linguistic phonetic bridges
      const phoneticBridges = this.findPhoneticBridges(segments, languageMap);
      if (phoneticBridges.length > 0) {
        patterns.push({
          id: 'phonetic_bridges',
          type: 'rhyme',
          segments: phoneticBridges.map(s => s.id),
          originalText: phoneticBridges.map(s => s.text).join(' '),
          acousticFeatures: {
            primaryFeature: 'Cross-linguistic phonetic bridges',
            secondaryFeatures: [
              'Sound similarities across languages',
              'Bilingual rhyming',
              'Cultural sound patterns'
            ]
          },
          description: `Cross-linguistic sound patterns connecting ${uniqueLanguages.join(' and ')} phonetics`
        });
      }
    }
    
    return patterns;
  }

  // === HELPER METHODS ===
  
  static getPhoneticForm(word: string, language: string): string {
    // Simplified phonetic conversion - in production this would use proper IPA
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Záéíóúñüçàèìòùâêîôûäöüßæœшщжчыяюёьъ]/g, '');
    
    // Basic phonetic approximations by language
    const phoneticRules: Record<string, Array<[RegExp, string]>> = {
      'en': [
        [/ph/g, 'f'], [/th/g, 'θ'], [/ch/g, 'tʃ'], [/sh/g, 'ʃ'],
        [/oo/g, 'u'], [/ee/g, 'i'], [/ay/g, 'eɪ'], [/ow/g, 'aʊ']
      ],
      'es': [
        [/rr/g, 'r'], [/ll/g, 'ʎ'], [/ñ/g, 'ɲ'], [/j/g, 'x']
      ],
      'fr': [
        [/ou/g, 'u'], [/ch/g, 'ʃ'], [/gn/g, 'ɲ'], [/ç/g, 's']
      ]
    };
    
    let phonetic = cleanWord;
    const rules = phoneticRules[language] || phoneticRules['en'];
    
    rules.forEach(([pattern, replacement]) => {
      phonetic = phonetic.replace(pattern, replacement);
    });
    
    return phonetic;
  }

  static extractRhymeSound(phoneticForm: string, language: string): string | null {
    // Language-specific rhyme sound extraction
    const languagePatterns: Record<string, RegExp> = {
      'en': /[12][aeiouəɪʊæɑɔ][^-]*$/,  // English stress + vowel + following sounds
      'es': /[aeiou][^-]*$/,             // Spanish vowel + following sounds
      'fr': /[aeiouəɛɔ][^-]*$/,          // French vowel + following sounds
      'de': /[aeiouäöü][^-]*$/,          // German vowel + following sounds
      'ja': /[aiueo][^-]*$/,             // Japanese vowel + following sounds
      'ar': /[aiu][^-]*$/                 // Arabic vowel + following sounds
    };
    
    const pattern = languagePatterns[language] || languagePatterns['en'];
    const matches = phoneticForm.match(pattern);
    return matches ? matches[0] : null;
  }

  static extractInitialConsonantCluster(phoneticForm: string, language: string): string | null {
    // Language-specific initial consonant extraction
    const languagePatterns: Record<string, RegExp> = {
      'en': /^[^aeiouəɪʊæɑɔ]+/,          // English consonant clusters
      'es': /^[^aeiou]+/,                 // Spanish consonant clusters
      'fr': /^[^aeiouəɛɔ]+/,              // French consonant clusters  
      'de': /^[^aeiouäöü]+/,              // German consonant clusters
      'ja': /^[^aiueo]+/,                 // Japanese consonant clusters
      'ar': /^[^aiu]+/                    // Arabic consonant clusters
    };
    
    const pattern = languagePatterns[language] || languagePatterns['en'];
    const matches = phoneticForm.match(pattern);
    return matches ? matches[0] : null;
  }

  static classifyRhymeType(segments: Segment[], rhymeSound: string): string {
    const syllableCounts = segments.map(s => this.countSyllables(s.text));
    const maxSyllables = Math.max(...syllableCounts);
    
    if (maxSyllables === 1) return 'monosyllabic';
    if (maxSyllables === 2) return 'feminine';
    return 'multisyllabic';
  }

  static classifyAlliterationType(sound: string, language: string): string {
    // Classify based on phonetic properties
    if (sound.length === 1) return 'simple';
    if (sound.includes('r') || sound.includes('l')) return 'liquid';
    if (sound.includes('s') || sound.includes('sh')) return 'sibilant';
    return 'consonant cluster';
  }

  static matchTraditionalForm(lines: string[], form: TraditionalForm, segments: Segment[]): Pattern | null {
    // Line count check
    if (form.lineCount && lines.length !== form.lineCount) return null;
    
    // Syllable pattern check
    if (form.syllablePattern) {
      const syllableCounts = lines.map(line => this.countSyllablesInLine(line));
      if (!this.arraysEqual(syllableCounts, form.syllablePattern)) return null;
    }
    
    // Rhyme scheme check - simplified for now
    if (form.rhymeScheme && form.rhymeScheme !== 'ASSONANT') {
      const detectedScheme = this.analyzeRhymeScheme(lines);
      if (!this.rhymeSchemesMatch(detectedScheme, form.rhymeScheme)) return null;
    }
    
    // Form detected!
    return {
      id: `traditional_form_${form.type}`,
      type: 'rhythm',
      segments: segments.map(s => s.id),
      originalText: lines.join('\n'),
      significance: 1.0,
      acousticFeatures: {
        primaryFeature: `Traditional form: ${form.name}`,
        secondaryFeatures: [
          form.rhymeScheme ? `Rhyme scheme: ${form.rhymeScheme}` : '',
          form.syllablePattern ? `Syllable pattern: ${form.syllablePattern.join('-')}` : '',
          `Cultural context: ${form.culturalContext}`,
          form.language ? `Language tradition: ${form.language}` : ''
        ].filter(Boolean)
      },
      description: `${form.name} detected: ${form.culturalContext}`
    };
  }

  static mapSegmentLanguages(segments: Segment[]): Map<Segment, string> {
    const map = new Map<Segment, string>();
    
    segments.forEach(segment => {
      const detectedLang = this.detectWordLanguage(segment.text);
      map.set(segment, detectedLang);
    });
    
    return map;
  }

  static detectWordLanguage(word: string): string {
    // Enhanced language detection
    if (/[ñáéíóúü¿¡]/.test(word)) return 'es';
    if (/[àâçéèêëîïôöùûüÿæœ]/.test(word)) return 'fr';
    if (/[äöüßẞ]/.test(word)) return 'de';
    if (/[ひらがなカタカナ一-龯]/.test(word)) return 'ja';
    if (/[한글가-힣]/.test(word)) return 'ko';
    if (/[一-龯]/.test(word)) return 'zh';
    if (/[ا-ي]/.test(word)) return 'ar';
    if (/[א-ת]/.test(word)) return 'he';
    if (/[а-я]/.test(word)) return 'ru';
    if (/[ก-ฮ]/.test(word)) return 'th';
    
    return 'en'; // Default to English
  }

  static findLanguageSwitchingPoints(segments: Segment[], languageMap: Map<Segment, string>): Segment[] {
    const switchPoints: Segment[] = [];
    let previousLang: string | null = null;
    
    segments.forEach(segment => {
      const currentLang = languageMap.get(segment) || null;
      if (previousLang && currentLang && currentLang !== previousLang) {
        switchPoints.push(segment);
      }
      previousLang = currentLang;
    });
    
    return switchPoints;
  }

  static findPhoneticBridges(segments: Segment[], languageMap: Map<Segment, string>): Segment[] {
    // Find words that sound similar across languages
    const bridges: Segment[] = [];
    const languageGroups = new Map<string, Segment[]>();
    
    // Group segments by language
    languageMap.forEach((lang, segment) => {
      if (!languageGroups.has(lang)) {
        languageGroups.set(lang, []);
      }
      languageGroups.get(lang)!.push(segment);
    });
    
    // Find phonetic similarities across language groups
    const languages = Array.from(languageGroups.keys());
    for (let i = 0; i < languages.length; i++) {
      for (let j = i + 1; j < languages.length; j++) {
        const lang1Segments = languageGroups.get(languages[i])!;
        const lang2Segments = languageGroups.get(languages[j])!;
        
        lang1Segments.forEach(seg1 => {
          lang2Segments.forEach(seg2 => {
            const similarity = this.calculateCrossLinguisticSimilarity(seg1.text, seg2.text);
            if (similarity > 0.7) { // High phonetic similarity
              bridges.push(seg1, seg2);
            }
          });
        });
      }
    }
    
    return [...new Set(bridges)]; // Remove duplicates
  }

  // Utility methods
  static countSyllables(word: string): number {
    if (!word || typeof word !== 'string') return 0;
    
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 0;
    
    // Basic syllable counting algorithm
    let syllables = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiouy'.includes(word[i]);
      
      if (isVowel && !previousWasVowel) {
        syllables++;
      }
      
      previousWasVowel = isVowel;
    }
    
    // Special cases
    if (word.endsWith('e') && syllables > 1) {
      syllables--; // Silent e
    }
    
    if (word.endsWith('le') && syllables > 1 && word.length > 2) {
      const beforeLe = word[word.length - 3];
      if (!'aeiouy'.includes(beforeLe)) {
        syllables++; // -ble, -ple, etc.
      }
    }
    
    return Math.max(syllables, 1); // Every word has at least 1 syllable
  }

  static countSyllablesInLine(line: string): number {
    const words = line.trim().split(/\s+/);
    return words.reduce((total, word) => total + this.countSyllables(word), 0);
  }

  static arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  static analyzeRhymeScheme(lines: string[]): string {
    // Simple implementation for now - detect if last words rhyme
    const lastWords = lines.map(line => {
      const words = line.trim().split(/\s+/);
      return words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    });
    
    // Check for simple ABAB, AABB patterns
    if (lastWords.length === 4) {
      const ending1 = lastWords[0].slice(-2);
      const ending2 = lastWords[1].slice(-2);
      const ending3 = lastWords[2].slice(-2);
      const ending4 = lastWords[3].slice(-2);
      
      if (ending1 === ending3 && ending2 === ending4) return 'ABAB';
      if (ending1 === ending2 && ending3 === ending4) return 'AABB';
    }
    
    return 'SIMPLE';
  }

  static rhymeSchemesMatch(detected: string, expected: string): boolean {
    // Allow flexible matching for now
    return detected === expected || detected === 'SIMPLE';
  }

  static calculateCrossLinguisticSimilarity(word1: string, word2: string): number {
    // Implementation would calculate phonetic similarity across languages
    return 0.5; // Placeholder
  }

  // Placeholder methods for additional patterns
  static detectInternalRhymes(segments: Segment[], text: string, language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Internal rhymes occur within the same line
    lines.forEach((line, lineIndex) => {
      const wordsInLine = line.split(/\s+/).filter(word => word.length > 2);
      if (wordsInLine.length < 2) return;
      
      // Find segments that belong to this line
      const lineSegments = segments.filter(seg => 
        line.toLowerCase().includes(seg.text.toLowerCase())
      );
      
      // Check for rhymes within the line
      for (let i = 0; i < lineSegments.length; i++) {
        for (let j = i + 1; j < lineSegments.length; j++) {
          const seg1 = lineSegments[i];
          const seg2 = lineSegments[j];
          
          // Get phonetic forms
          const phonetic1 = this.getPhoneticForm(seg1.text, language);
          const phonetic2 = this.getPhoneticForm(seg2.text, language);
          
          const rhyme1 = this.extractRhymeSound(phonetic1, language);
          const rhyme2 = this.extractRhymeSound(phonetic2, language);
          
          if (rhyme1 && rhyme2 && rhyme1 === rhyme2) {
            patterns.push({
              id: `internal_rhyme_${lineIndex}_${i}_${j}`,
              type: 'internal_rhyme',
              segments: [seg1.id, seg2.id],
              originalText: `${seg1.text} / ${seg2.text}`,
              significance: 0.65,
              acousticFeatures: {
                primaryFeature: 'Internal rhyme',
                secondaryFeatures: [
                  `Line ${lineIndex + 1}`,
                  `Rhyme sound: /${rhyme1}/`,
                  'Intra-line rhyming',
                  'Sophisticated internal structure'
                ]
              },
              description: `Internal rhyme within line ${lineIndex + 1}: "${seg1.text}" and "${seg2.text}" share /${rhyme1}/ sound`
            });
          }
        }
      }
    });
    
    return patterns;
  }

  static detectSlantRhymes(segments: Segment[], language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const rhymeGroups = new Map<string, Segment[]>();
    
    // Group segments by approximate rhyme sounds
    segments.forEach(segment => {
      const phonetic = this.getPhoneticForm(segment.text, language);
      const vowelPattern = phonetic.replace(/[^aeiouəɪʊæɑɔ]/g, ''); // Extract vowel pattern
      
      if (vowelPattern.length > 0) {
        const key = vowelPattern.slice(-2); // Last two vowel sounds for slant rhyme
        if (!rhymeGroups.has(key)) {
          rhymeGroups.set(key, []);
        }
        rhymeGroups.get(key)!.push(segment);
      }
    });
    
    // Find slant rhyme groups
    rhymeGroups.forEach((segmentGroup, rhymeKey) => {
      if (segmentGroup.length >= 2) {
        const significance = 0.3 + (Math.min(segmentGroup.length, 5) * 0.05); // Score 0.35 to 0.55
        patterns.push({
          id: `slant_rhyme_${rhymeKey}`,
          type: 'slant_rhyme',
          segments: segmentGroup.map(s => s.id), // Use segment IDs
          originalText: segmentGroup.map(s => s.text).join(' / '),
          significance,
          acousticFeatures: {
            primaryFeature: 'Slant rhyme',
            secondaryFeatures: [
              `Vowel pattern: ${rhymeKey}`,
              `Type: near rhyme`,
              `Subtle sound connection`,
              `Words: ${segmentGroup.length}`
            ]
          },
          description: `Slant rhyme with ${rhymeKey} vowel pattern (${segmentGroup.length} words)`
        });
      }
    });
    
    return patterns;
  }

  static detectAssonanceConsonance(segments: Segment[], language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const vowelGroups = new Map<string, Segment[]>();
    const consonantGroups = new Map<string, Segment[]>();
    
    // Group segments by vowel and consonant patterns
    segments.forEach(segment => {
      const phonetic = this.getPhoneticForm(segment.text, language);
      
      // Extract vowel pattern (assonance)
      const vowels = phonetic.replace(/[^aeiouəɪʊæɑɔ]/g, '');
      if (vowels.length > 0) {
        const vowelKey = vowels.slice(0, 2); // First two vowels
        if (!vowelGroups.has(vowelKey)) {
          vowelGroups.set(vowelKey, []);
        }
        vowelGroups.get(vowelKey)!.push(segment);
      }
      
      // Extract consonant pattern (consonance)
      const consonants = phonetic.replace(/[aeiouəɪʊæɑɔ]/g, '');
      if (consonants.length > 0) {
        const consonantKey = consonants.slice(0, 2); // First two consonants
        if (!consonantGroups.has(consonantKey)) {
          consonantGroups.set(consonantKey, []);
        }
        consonantGroups.get(consonantKey)!.push(segment);
      }
    });
    
    // Create assonance patterns
    vowelGroups.forEach((segmentGroup, vowelPattern) => {
      if (segmentGroup.length >= 2) {
        const significance = 0.2 + (Math.min(segmentGroup.length, 5) * 0.05); // Score 0.25 to 0.45
        patterns.push({
          id: `assonance_${vowelPattern}`,
          type: 'assonance',
          segments: segmentGroup.map(s => s.id),
          originalText: segmentGroup.map(s => s.text).join(' / '),
          significance,
          acousticFeatures: {
            primaryFeature: 'Assonance',
            secondaryFeatures: [
              `Vowel pattern: ${vowelPattern}`,
              `Repeated vowel sounds`,
              `Words: ${segmentGroup.length}`,
              'Sophisticated vowel echo'
            ]
          },
          description: `Assonance with ${vowelPattern} vowel pattern (${segmentGroup.length} words)`
        });
      }
    });
    
    // Create consonance patterns
    consonantGroups.forEach((segmentGroup, consonantPattern) => {
      if (segmentGroup.length >= 2) {
        const significance = 0.2 + (Math.min(segmentGroup.length, 5) * 0.05); // Score 0.25 to 0.45
        patterns.push({
          id: `consonance_${consonantPattern}`,
          type: 'consonance',
          segments: segmentGroup.map(s => s.id),
          originalText: segmentGroup.map(s => s.text).join(' / '),
          significance,
          acousticFeatures: {
            primaryFeature: 'Consonance',
            secondaryFeatures: [
              `Consonant pattern: ${consonantPattern}`,
              `Repeated consonant sounds`,
              `Words: ${segmentGroup.length}`,
              'Sophisticated consonant echo'
            ]
          },
          description: `Consonance with ${consonantPattern} consonant pattern (${segmentGroup.length} words)`
        });
      }
    });
    
    return patterns;
  }

  static detectRepetitionPatterns(segments: Segment[]): Pattern[] {
    const patterns: Pattern[] = [];
    const wordCounts = new Map<string, Segment[]>();
    
    // Count word occurrences
    segments.forEach(segment => {
      const word = segment.text.toLowerCase().replace(/[^a-zA-Z]/g, '');
      if (word.length > 2) { // Only meaningful words
        if (!wordCounts.has(word)) {
          wordCounts.set(word, []);
        }
        wordCounts.get(word)!.push(segment);
      }
    });
    
    // Find repetition patterns
    wordCounts.forEach((segmentGroup, word) => {
      if (segmentGroup.length >= 2) {
        const significance = 0.3 + (Math.min(segmentGroup.length, 10) * 0.05); // Score 0.35 to 0.8
        patterns.push({
          id: `repetition_${word}`,
          type: 'repetition',
          segments: segmentGroup.map(s => s.id),
          originalText: segmentGroup.map(s => s.text).join(' ... '),
          significance,
          acousticFeatures: {
            primaryFeature: 'Word repetition',
            secondaryFeatures: [
              `Word: "${word}"`,
              `Occurrences: ${segmentGroup.length}`,
              'Emphasis through repetition',
              'Rhetorical device'
            ]
          },
          description: `Repetition of "${word}" (${segmentGroup.length} times)`
        });
      }
    });
    
    return patterns;
  }

  static detectMeterPatterns(segments: Segment[], text: string, language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return patterns;
    
    // Analyze syllable patterns across lines
    const syllableCounts = lines.map(line => this.countSyllablesInLine(line));
    const isRegular = syllableCounts.every(count => count === syllableCounts[0]);
    
    if (isRegular && syllableCounts[0] >= 8) {
      const meterName = this.identifyMeter(syllableCounts[0]);
      patterns.push({
        id: `meter_${meterName}`,
        type: 'rhythm',
        segments: segments.map(s => s.id),
        originalText: text,
        significance: 0.95,
        acousticFeatures: {
          primaryFeature: `${meterName} meter`,
          secondaryFeatures: [
            `${syllableCounts[0]} syllables per line`,
            `Regular meter pattern`,
            `${lines.length} lines analyzed`,
            'Structured rhythm'
          ]
        },
        description: `${meterName} meter detected: ${syllableCounts[0]} syllables per line`
      });
    }
    
    return patterns;
  }

  static detectComplexRhythms(segments: Segment[], text: string, language: string): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Detect caesura (mid-line breaks)
    const caesuraLines = lines.filter(line => /[,.;:]/.test(line.slice(0, line.length / 2)));
    if (caesuraLines.length >= 2) {
      patterns.push({
        id: 'caesura_pattern',
        type: 'rhythm',
        segments: segments.filter(s => caesuraLines.some(line => line.includes(s.text))).map(s => s.id),
        originalText: caesuraLines.join('\n'),
        significance: 0.8,
        acousticFeatures: {
          primaryFeature: 'Caesura patterns',
          secondaryFeatures: [
            'Mid-line breaks',
            'Rhythmic pauses',
            'Sophisticated timing',
            `${caesuraLines.length} lines with caesura`
          ]
        },
        description: `Caesura patterns in ${caesuraLines.length} lines`
      });
    }
    
    return patterns;
  }

  static detectCrossLinguisticRhymes(segments: Segment[], text: string): Pattern[] {
    const patterns: Pattern[] = [];
    const languageMap = this.mapSegmentLanguages(segments);
    const languages = Array.from(new Set(languageMap.values()));
    
    if (languages.length < 2) return patterns;
    
    // Find rhymes across different languages
    const crossRhymes: Segment[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];
        const lang1 = languageMap.get(seg1);
        const lang2 = languageMap.get(seg2);
        
        if (lang1 !== lang2) {
          const similarity = this.calculateCrossLinguisticSimilarity(seg1.text, seg2.text);
          if (similarity > 0.7) {
            crossRhymes.push(seg1, seg2);
          }
        }
      }
    }
    
    if (crossRhymes.length >= 2) {
      patterns.push({
        id: 'cross_linguistic_rhymes',
        type: 'rhyme',
        segments: crossRhymes.map(s => s.id),
        originalText: crossRhymes.map(s => s.text).join(' / '),
        acousticFeatures: {
          primaryFeature: 'Cross-linguistic rhymes',
          secondaryFeatures: [
            'Multilingual sound patterns',
            'Cultural sound bridges',
            `Languages: ${languages.join(', ')}`,
            'Sophisticated bilingual rhyming'
          ]
        },
        description: `Cross-linguistic rhymes between ${languages.join(' and ')}`
      });
    }
    
    return patterns;
  }

  static identifyMeter(syllableCount: number): string {
    const meters: Record<number, string> = {
      8: 'Octosyllabic',
      10: 'Iambic pentameter',
      12: 'Alexandrine',
      14: 'Fourteener'
    };
    return meters[syllableCount] || `${syllableCount}-syllable`;
  }
} 