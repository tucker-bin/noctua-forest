// Base pattern types (language-agnostic)
export type BasePatternType = 
  | 'rhyme'           // End rhymes, internal rhymes
  | 'slant_rhyme'     // Near rhymes, off rhymes
  | 'internal_rhyme'  // Rhymes within single lines
  | 'assonance'       // Vowel harmony patterns
  | 'consonance'      // Consonant repetition patterns
  | 'alliteration'    // Initial sound patterns
  | 'sibilance'       // S sound patterns
  | 'rhythm'          // Stress/meter patterns
  | 'repetition'      // Word or phrase repetition
  | 'parallelism'     // Structural parallelism
  | 'sound_parallelism' // Phonetic relationships
  | 'anaphora'        // Beginning repetition
  | 'epistrophe'      // Ending repetition
  | 'chiasmus'        // ABBA pattern
  | 'antithesis'      // Contrasting patterns
  | 'onomatopoeia'    // Sound mimicry
  | 'euphony'         // Pleasant sound patterns
  | 'cacophony'       // Harsh sound patterns
  | 'fricative'       // F/V/TH patterns
  | 'plosive'         // P/B/T/D/K/G patterns
  | 'liquid'          // L/R flow patterns
  | 'nasal_harmony'   // M/N resonance
  | 'vowel_gradation' // Systematic vowel changes
  | 'consonant_gradation'; // Systematic consonant changes

// Japanese-specific pattern types
export type JapanesePatternType =
  | 'kireji'          // Cutting words in haiku
  | 'kakekotoba'      // Pivot words/double meanings
  | 'makurakotoba'    // Pillow words/epithets
  | 'jokotoba'        // Preface words
  | 'engo'            // Associated words
  | 'honkadori'       // Allusive variation
  | 'hibiki'          // Sound symbolism
  | 'gion_gitai'      // Onomatopoeia categories
  | 'dodoitsu_rhythm' // 7-7-7-5 rhythm
  | 'tanka_rhythm'    // 5-7-5-7-7 rhythm
  | 'haiku_rhythm'    // 5-7-5 rhythm
  | 'jiamari'         // Hypermetric lines
  | 'jitarazu'        // Hypometric lines
  | 'kugire'          // Caesura patterns
  | 'taigendome'      // Noun endings
  | 'ioriten'         // Tonal patterns
  | 'shichigochou'    // 7-5 alternating rhythm
  | 'goro_awase'      // Number wordplay
  | 'dajare'          // Pun patterns
  | 'yamato_kotoba'   // Native word patterns
  | 'kango_rhythm'    // Chinese compound rhythm
  | 'mora_rhythm'     // Mora-based patterns
  | 'pitch_accent'    // High-low pitch patterns
  | 'rendaku'         // Sequential voicing
  | 'renjou'          // Sound euphony rules
  | 'sokuon'          // Geminate consonant patterns
  | 'hatsuon'         // Moraic nasal patterns
  | 'chouon'          // Long vowel patterns
  | 'yoon'            // Palatalized patterns
  | 'vowel_coalescence'; // Diphthong patterns

// Korean-specific pattern types
export type KoreanPatternType =
  | 'sijo_rhythm'     // 3-4-3-4 / 3-4-3-4 / 3-5-4-3
  | 'gasa_rhythm'     // 4-4 or 3-4 continuous
  | 'pansori_rhythm'  // Traditional narrative rhythm
  | 'hangeul_jamo'    // Initial-medial-final patterns
  | 'dueum_beopchik'  // Initial sound law
  | 'korean_sandhi'   // Sound change rules
  | 'tensification'   // Consonant tensing patterns
  | 'aspiration'      // Aspirated consonant patterns
  | 'vowel_harmony_kr'; // Korean vowel harmony

// Chinese-specific pattern types
export type ChinesePatternType =
  | 'tone_pattern'       // Tonal melody patterns
  | 'tone_sandhi'        // Tone change patterns
  | 'reduplication'      // AA, AABB patterns
  | 'onomatopoeia_cn'    // Chinese-specific sound symbolism
  | 'rhythmic_balance'   // Balanced phrase structure
  | 'four_character'     // Four-character expressions
  | 'parallel_couplets'  // Duilian structure
  | 'pingze'            // Level-oblique tonal patterns
  | 'caesura_cn'        // Mid-line pauses
  | 'end_rhyme_cn';     // Traditional rhyme categories

// Arabic-specific pattern types
export type ArabicPatternType =
  | 'qafiya'          // End rhyme schemes
  | 'wazan'           // Metrical patterns
  | 'radif'           // Repeated words after rhyme
  | 'jinas'           // Paronomasia/wordplay
  | 'tibaq'           // Antithesis
  | 'muqabala'        // Parallelism
  | 'sajaa'           // Rhythmic prose
  | 'tawriya'         // Double entendre
  | 'iqtibas'         // Quotation patterns
  | 'root_echo';      // Root consonant patterns

// Spanish-specific pattern types
export type SpanishPatternType =
  | 'rima_asonante'   // Vowel rhyme
  | 'rima_consonante' // Full rhyme
  | 'sinalefa'        // Vowel blending
  | 'hiato'           // Vowel separation
  | 'esdrujula'       // Proparoxytone patterns
  | 'aguda_oxytone'   // Oxytone patterns
  | 'llana_paroxytone'; // Paroxytone patterns

// French-specific pattern types
export type FrenchPatternType =
  | 'rime_riche'      // Rich rhyme (3+ sounds)
  | 'rime_suffisante' // Sufficient rhyme (2 sounds)
  | 'rime_pauvre'     // Poor rhyme (1 sound)
  | 'alexandrin'      // 12-syllable lines
  | 'cesure'          // Caesura patterns
  | 'enjambement'     // Line overflow
  | 'diérèse'         // Syllable separation
  | 'synérèse'        // Syllable fusion
  | 'e_muet'          // Silent e patterns
  | 'liaison'         // Word linking patterns
  | 'élision';        // Vowel elision

// Additional language-specific types for other supported languages
export type HindiPatternType =
  | 'schwa_deletion'     // Schwa deletion patterns
  | 'aspirated_rhythm'   // Patterns with aspirated consonants
  | 'retroflex_harmony'  // Patterns of retroflex consonants
  | 'nasalization'       // Patterns of nasalized vowels
  | 'tatsama_tadbhava'  // Sanskrit vs. vernacular patterns
  | 'compound_rhythm';

export type RussianPatternType =
  | 'palatalization'     // Soft-hard consonant patterns
  | 'vowel_reduction'    // Reduced vowel patterns
  | 'mobile_stress'      // Shifting stress patterns
  | 'cluster_rhythm'     // Consonant cluster patterns
  | 'diminutive'         // Diminutive suffix patterns
  | 'aspect_pairs';

export type TurkishPatternType =
  | 'vowel_harmony_tr'   // Turkish vowel harmony
  | 'consonant_harmony'  // Consonant assimilation patterns
  | 'agglutination'      // Agglutinative rhythm
  | 'stress_accent'      // Word-final stress patterns
  | 'reduplication_tr';

export type FilipinoPatternType =
  | 'reduplication_tl'   // Filipino reduplication
  | 'infix_rhythm'       // Rhythmic patterns with infixes
  | 'abakada'           // Native sound patterns
  | 'spanish_influence'  // Hispanic sound patterns
  | 'particle_rhythm_tl';

export type GermanPatternType =
  | 'compound_stress'    // Compound word stress
  | 'umlaut_patterns'    // Umlaut alternations
  | 'final_devoicing'   // Final devoicing patterns
  | 'schwa_syncope'     // Schwa deletion patterns
  | 'auslautverhärtung'; 

export type ItalianPatternType =
  | 'raddoppiamento'    // Syntactic doubling
  | 'gemination'        // Geminate consonants
  | 'closed_vowel'      // Closed vowel patterns
  | 'dittongazione'     // Diphthongization
  | 'troncamento';

export type PortuguesePatternType =
  | 'nasal_vowel_pt'    // Portuguese nasal vowels
  | 'vowel_reduction_pt' // Vowel reduction patterns
  | 'palatalization_pt'  // Palatalization patterns
  | 'sandhi_pt'         // External sandhi
  | 'crasis';

// Combined pattern type
export type PatternType = 
  | 'rhyme'
  | 'assonance'
  | 'consonance'
  | 'alliteration'
  | 'rhythm'
  | 'sibilance'
  | 'internal_rhyme'
  | 'slant_rhyme'
  | 'repetition'
  | 'parallelism'
  | 'sound_parallelism'
  | 'meter'
  | 'caesura'
  | 'code_switching'
  | 'cultural_resonance'
  | 'emotional_emphasis';

export type PatternStrength = 'strong' | 'medium' | 'weak';

export interface Segment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phonetic?: PhoneticSegment;
}

export interface PhoneticSegment {
  ipa: string;
  vowels: string[];
  consonants: string[];
  syllableCount: number;
  stressPattern: string[];
}

export interface Pattern {
  id: string;
  type: PatternType;
  segments: string[]; // Array of segment IDs
  originalText: string;
  significance?: number; // From backend
  description?: string;
  acousticFeatures?: {
    primaryFeature: string;
    secondaryFeatures: string[];
  };
  phonetic?: PhoneticPattern;
  languageSpecific?: {
    language: string;
    culturalContext?: string;
    traditionalForm?: string;
  };
}

export interface PhoneticPattern {
  type: string;
  segments: PhoneticSegment[];
  commonSounds: {
    vowels: string[];
    consonants: string[];
  };
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface ObservationData {
  id?: string;
  text: string;
  patterns: Pattern[];
  segments: Segment[];
  language: string;
  metadata: {
    userId: string;
    language: string;
    createdAt: string;
    updatedAt?: string;
  };
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
}

export interface ObservationResult extends ObservationData {
  id: string;
  createdAt: Date;
  allPatterns?: Pattern[]; // From backend
}

export interface CachedObservation {
  data: ObservationData;
  timestamp: number;
  size: number;
}

export type ThemeMode = 'dark' | 'light' | 'vintage';
export type ColorPalette = 'celestial' | 'aurora' | 'nebula' | 'stardust' | 'cosmic' | 'galaxy';

export interface PatternTag {
  id: string;
  name: string;
  color: string;
  description: string;
  category: 'sound' | 'rhythm' | 'structure' | 'meaning';
}

export interface TaggedPattern extends Pattern {
  tags?: PatternTag[];
  userTags?: string[]; // User-added custom tags
}

// Predefined pattern tags for common pattern types
export const PATTERN_TAGS: Record<string, PatternTag[]> = {
  'alliteration': [{
    id: 'consonant-start',
    name: 'Consonant Start',
    color: '#3B82F6',
    description: 'Words starting with similar consonant sounds',
    category: 'sound'
  }],
  'assonance': [{
    id: 'vowel-echo',
    name: 'Vowel Echo',
    color: '#10B981',
    description: 'Similar vowel sounds within words',
    category: 'sound'
  }],
  'consonance': [{
    id: 'consonant-echo',
    name: 'Consonant Echo',
    color: '#F59E0B',
    description: 'Similar consonant sounds within or at end of words',
    category: 'sound'
  }],
  'rhyme': [{
    id: 'end-rhyme',
    name: 'End Rhyme',
    color: '#EF4444',
    description: 'Words that rhyme at the end of lines',
    category: 'sound'
  }],
  'internal_rhyme': [{
    id: 'internal-rhyme',
    name: 'Internal Rhyme',
    color: '#8B5CF6',
    description: 'Rhymes within the same line',
    category: 'sound'
  }],
  'rhythm': [{
    id: 'beat-pattern',
    name: 'Beat Pattern',
    color: '#F97316',
    description: 'Rhythmic patterns in speech',
    category: 'rhythm'
  }],
  'repetition': [{
    id: 'word-repeat',
    name: 'Word Repeat',
    color: '#06B6D4',
    description: 'Repeated words or phrases',
    category: 'structure'
  }],
  'phonetic_similarity': [{
    id: 'sound-alike',
    name: 'Sound Alike',
    color: '#84CC16',
    description: 'Words that sound similar',
    category: 'sound'
  }]
};

export interface PatternGroup {
  type: PatternType;
  patterns: Pattern[];
  centerX: number;
  centerY: number;
  color: string;
}

export interface PatternNode {
  id: string;
  pattern: Pattern;
  x: number;
  y: number;
  radius: number;
  color: string;
  connections: string[];
} 