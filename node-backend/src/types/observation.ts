export interface ObservationData {
  patterns: Pattern[];
  originalText: string;
  timestamp: string;
  constellations: Constellation[];
  metadata?: ObservationMetadata;
}

export interface Pattern {
  id: string;
  segments: Segment[];
  type: PatternType;
  originalText: string;
  confidence?: 'high' | 'medium' | 'low';
  description?: string;
  acousticFeatures?: {
    primaryFeature: string;
    secondaryFeatures: string[];
  };
  languageSpecific?: {
    language: string;
    culturalContext?: string;
    traditionalForm?: string;
  };
}

export interface Segment {
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phoneticContext?: string;
}

export interface Constellation {
  id: string;
  name: string;
  patterns: Pattern[];
  relationship: string;
}

// Common pattern types across languages
export type BasePatternType = 
  // Basic rhyme patterns
  | 'rhyme'
  | 'slant_rhyme'
  | 'internal_rhyme'
  
  // Vowel-based patterns
  | 'assonance'
  | 'vowel_harmony'
  
  // Consonant-based patterns
  | 'consonance'
  | 'alliteration'
  | 'sibilance'
  | 'plosive'
  | 'liquid_consonants'
  | 'nasal_consonants'
  
  // Rhythmic patterns
  | 'rhythm'
  | 'meter'
  | 'caesura'
  | 'enjambment'
  
  // Special sound patterns
  | 'onomatopoeia'
  | 'euphony'
  | 'cacophony'
  | 'sound_parallelism';

// Language-specific pattern types
export type JapanesePatternType =
  | 'pitch_accent'        // High-low pitch patterns
  | 'mora_rhythm'         // Rhythmic patterns based on mora timing
  | 'rendaku'            // Sequential voicing
  | 'giseigo'            // Sound-symbolic words for natural sounds
  | 'gitaigo'            // Sound-symbolic words for states/conditions
  | 'kakekotoba'         // Pivot words with multiple meanings
  | 'kurikaeshi'         // Reduplication patterns
  | 'vowel_devoicing';   // Devoiced vowels between voiceless consonants

export type ChinesePatternType =
  | 'tone_pattern'       // Tonal melody patterns
  | 'tone_sandhi'        // Tone change patterns
  | 'reduplication'      // AA, AABB patterns
  | 'onomatopoeia_cn'    // Chinese-specific sound symbolism
  | 'rhythmic_balance'   // Balanced phrase structure
  | 'four_character'     // Four-character expressions
  | 'particle_rhythm';   // Rhythmic patterns with particles

export type KoreanPatternType =
  | 'vowel_harmony_ko'   // Traditional vowel harmony
  | 'consonant_tension'  // Tense consonant patterns
  | 'sound_symbolism'    // Korean sound symbolic words
  | 'syllable_rhythm'    // Rhythmic patterns in syllable blocks
  | 'pitch_accent_ko'    // Regional pitch accent patterns
  | 'reduplication_ko';  // Korean reduplication patterns

export type ArabicPatternType =
  | 'root_pattern'       // Root-and-pattern morphology
  | 'tajweed'           // Quranic recitation patterns
  | 'emphatic_harmony'   // Patterns of emphatic consonants
  | 'case_melody'        // Case ending patterns
  | 'meter_arabic'       // Arabic poetic meters
  | 'sajc'              // Rhyming prose
  | 'tarjiic';          // Echo patterns

export type HindiPatternType =
  | 'schwa_deletion'     // Schwa deletion patterns
  | 'aspirated_rhythm'   // Patterns with aspirated consonants
  | 'retroflex_harmony'  // Patterns of retroflex consonants
  | 'nasalization'       // Patterns of nasalized vowels
  | 'tatsama_tadbhava'  // Sanskrit vs. vernacular patterns
  | 'compound_rhythm';   // Rhythmic patterns in compounds

export type RussianPatternType =
  | 'palatalization'     // Soft-hard consonant patterns
  | 'vowel_reduction'    // Reduced vowel patterns
  | 'mobile_stress'      // Shifting stress patterns
  | 'cluster_rhythm'     // Consonant cluster patterns
  | 'diminutive'         // Diminutive suffix patterns
  | 'aspect_pairs';      // Verbal aspect pair patterns

export type TurkishPatternType =
  | 'vowel_harmony_tr'   // Turkish vowel harmony
  | 'consonant_harmony'  // Consonant assimilation patterns
  | 'agglutination'      // Agglutinative rhythm
  | 'stress_accent'      // Word-final stress patterns
  | 'reduplication_tr';  // Turkish reduplication patterns

export type FilipinoPatternType =
  | 'reduplication_tl'   // Filipino reduplication
  | 'infix_rhythm'       // Rhythmic patterns with infixes
  | 'abakada'           // Native sound patterns
  | 'spanish_influence'  // Hispanic sound patterns
  | 'particle_rhythm_tl'; // Particle-based rhythm

export type SpanishPatternType =
  | 'stress_accent_es'   // Spanish stress patterns
  | 'synalepha'         // Vowel blending
  | 'seseo_ceceo'       // S/Z distinction patterns
  | 'yeismo'            // LL/Y patterns
  | 'hiatus_diphthong'; // Hiatus vs. diphthong patterns

export type FrenchPatternType =
  | 'liaison'           // Linking patterns
  | 'elision'          // Vowel elision
  | 'nasal_harmony'     // Nasal vowel patterns
  | 'schwa_patterns'    // Schwa deletion/retention
  | 'accent_group';     // Accent group patterns

export type GermanPatternType =
  | 'compound_stress'    // Compound word stress
  | 'umlaut_patterns'    // Umlaut alternations
  | 'final_devoicing'   // Final devoicing patterns
  | 'schwa_syncope'     // Schwa deletion patterns
  | 'auslautverhärtung'; // Final fortition

export type ItalianPatternType =
  | 'raddoppiamento'    // Syntactic doubling
  | 'gemination'        // Geminate consonants
  | 'closed_vowel'      // Closed vowel patterns
  | 'dittongazione'     // Diphthongization
  | 'troncamento';      // Final vowel truncation

export type PortuguesePatternType =
  | 'nasal_vowel_pt'    // Portuguese nasal vowels
  | 'vowel_reduction_pt' // Vowel reduction patterns
  | 'palatalization_pt'  // Palatalization patterns
  | 'sandhi_pt'         // External sandhi
  | 'crasis';           // Vowel contraction

// Combined pattern type
export type PatternType = 
  | BasePatternType
  | JapanesePatternType
  | ChinesePatternType
  | KoreanPatternType
  | ArabicPatternType
  | HindiPatternType
  | RussianPatternType
  | TurkishPatternType
  | FilipinoPatternType
  | SpanishPatternType
  | FrenchPatternType
  | GermanPatternType
  | ItalianPatternType
  | PortuguesePatternType;

export type PatternStrength = 'strong' | 'medium' | 'weak';

export interface ObservationMetadata {
  userId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  language?: string;
  culturalContext?: string;
}

export interface Observation {
  id: string;
  data: ObservationData;
  metadata: ObservationMetadata;
}

export interface ObservationWithMetrics extends Observation {
  modelUsed: string;
  cost: number;
  tokensUsed: number;
}

export interface ObserveOptions {
  modelId?: string;
  complexity?: 'simple' | 'standard' | 'complex';
  maxCost?: number;
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
} 