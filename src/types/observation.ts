export interface ObservationData {
  patterns: Pattern[];
  originalText: string;
  timestamp: string;
  constellations?: Constellation[];
  metadata?: {
    userId?: string;
    language?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface Pattern {
  id: string;
  segments: Segment[];
  type: string;
  originalText: string;
  acousticFeatures?: {
    primaryFeature: string;
    secondaryFeatures: string[];
  };
  description?: string;
}

export interface Segment {
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phoneticContext?: string;
  phoneticForm?: string;
  stressPattern?: string;
  syllableCount?: number;
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
  | 'internal_rhyme';

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
  rhymeScheme?: string | null;
  meter?: string | null;
  modelUsed?: string;
  analysisOptions?: ObserveOptions;
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
}

// Main Observation interface - matches backend
export interface Observation {
  id: string;
  text: string;
  language: string;
  userId: string;
  patterns: Pattern[];
  constellations?: Constellation[];
  createdAt: Date;
  metadata: {
    rhymeScheme: string | null;
    meter: string | null;
    modelUsed: string;
    analysisOptions: ObserveOptions;
    payloadOptimized?: boolean;
    originalPatternCount?: number;
    originalConstellationCount?: number;
  };
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
  originalText?: string;  // Add this field as it's used in the frontend
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
  patterns: Pattern[] | string[];  // Backend uses Pattern[], frontend might use string[]
  relationship: string;
  description?: string;
} 