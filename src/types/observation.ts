export interface ObservationData {
  patterns: Pattern[];
  originalText: string;
  timestamp: string;
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
}

export interface Segment {
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phoneticContext?: string;
}

export type PatternType = 
  | 'rhyme'
  | 'assonance'
  | 'consonance'
  | 'alliteration'
  | 'rhythm';

export type PatternStrength = 'strong' | 'medium' | 'weak';

export interface ObservationMetadata {
  userId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
} 