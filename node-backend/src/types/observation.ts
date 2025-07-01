export interface ObservationData {
  patterns: Pattern[];
  originalText: string;
  timestamp: string;
  constellations?: Constellation[];
}

export interface Pattern {
  id: string;
  type: PatternType;
  segments: string[]; // Array of segment IDs, not segment objects
  originalText: string;
  significance?: number;
  acousticFeatures?: {
    primaryFeature: string;
    secondaryFeatures: string[];
  };
  description?: string;
  phonetic?: PhoneticPattern;
}

export interface Segment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phoneticContext?: string;
  phoneticForm?: string;
  stressPattern?: string;
  syllableCount?: number;
  phonetic?: PhoneticSegment;
}

export interface PhoneticSegment {
  ipa: string;
  vowels: string[];
  consonants: string[];
  syllableCount: number;
  stressPattern: string[];
}

export interface PhoneticPattern {
  type: string;
  segments: (PhoneticSegment | undefined)[];
  commonSounds: {
    vowels: string[];
    consonants: string[];
  };
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export type PatternType = 
  | 'rhyme'
  | 'assonance'
  | 'consonance'
  | 'alliteration'
  | 'rhythm'
  | 'sibilance'
  | 'fricative'
  | 'plosive'
  | 'liquid'
  | 'nasal_harmony'
  | 'internal_rhyme'
  | 'slant_rhyme'
  | 'repetition'
  | 'code_switching'
  | 'cultural_resonance'
  | 'emotional_emphasis';

export type PatternStrength = 'strong' | 'medium' | 'weak';

interface CulturalAnalysis {
  detectedLanguages: string[];
  codeSwithingPoints: number;
  culturalPatterns: string[];
  modernAnalysis: string;
  aiServiceAvailable?: boolean;
}

export interface ObservationMetadata {
  language: string;
  rhymeScheme: string | null;
  meter: string | null;
  modelUsed: string;
  analysisOptions?: ObserveOptions;
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
  culturalAnalysis?: CulturalAnalysis;
}

export interface LanguageAnalysis {
  config: any;
  totalVowels: number;
  totalConsonants: number;
  complexityScore: number;
}

// Main Observation interface - matches what observationService.ts expects
export interface Observation {
  id: string;
  text: string;
  language: string;
  userId: string;
  patterns: Pattern[]; // Significant patterns
  allPatterns?: Pattern[]; // All patterns, including micro-patterns
  segments: Segment[];
  constellations: Constellation[];
  createdAt: Date;
  metadata?: ObservationMetadata;
  modelUsed?: string;
  cost?: number;
  tokensUsed?: number;
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
  languageAnalysis?: any;
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
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
  culturalContext?: boolean;
  isAnonymous?: boolean;
}

export interface Constellation {
  id: string;
  name: string;
  patterns: Pattern[];
  relationship: string;
  description?: string;
} 