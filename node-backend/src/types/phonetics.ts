export interface LanguageConfig {
  name: string;
  vowels: string[];
  consonants: string[];
  stressMarkers: string[];
  syllableStructure: string;
  diphthongs: string[];
  commonClusters: string[];
  rules?: LanguageRules;
}

export interface LanguageRules {
  syllabification?: {
    maxOnset?: number;
    maxCoda?: number;
    allowedOnsets?: string[];
    allowedCodas?: string[];
  };
  stress?: {
    defaultPosition?: 'first' | 'last' | 'penultimate' | 'antepenultimate';
    weightSensitive?: boolean;
    secondaryStress?: boolean;
  };
  phonotactics?: {
    allowGeminates?: boolean;
    maxConsecutiveConsonants?: number;
    maxConsecutiveVowels?: number;
    requiredOnset?: boolean;
    allowEmptyCoda?: boolean;
  };
}

export interface PhoneticSystem {
  vowels: {
    front: string[];
    central: string[];
    back: string[];
    high: string[];
    mid: string[];
    low: string[];
    rounded: string[];
    unrounded: string[];
  };
  consonants: {
    stops: string[];
    fricatives: string[];
    affricates: string[];
    nasals: string[];
    liquids: string[];
    glides: string[];
    voiced: string[];
    voiceless: string[];
  };
  suprasegmentals: {
    stress: string[];
    tone: string[];
    length: string[];
    intonation: string[];
  };
  features: {
    [key: string]: {
      [key: string]: boolean;
    };
  };
}

export interface SyllableStructure {
  onset: string[];
  nucleus: string[];
  coda: string[];
  weight?: 'light' | 'heavy';
  stress?: number;
}

export interface PhoneticAnalysis {
  segments: string[];
  syllables: SyllableStructure[];
  features: string[];
  prosody: {
    stress: number[];
    intonation?: string;
    rhythm?: string;
  };
  language: string;
  confidence: number;
}

export interface PhoneticTransformation {
  from: string;
  to: string;
  environment?: string;
  language: string;
  type: 'assimilation' | 'dissimilation' | 'epenthesis' | 'deletion' | 'metathesis';
}

export type StressPattern = 'iambic' | 'trochaic' | 'dactylic' | 'anapestic' | 'spondaic';

export interface RhymeAnalysis {
  type: 'perfect' | 'slant' | 'assonance' | 'consonance';
  segments: string[];
  similarity: number;
  features: string[];
}

export interface PhoneticDistance {
  overall: number;
  vowels: number;
  consonants: number;
  features: {
    [key: string]: number;
  };
} 