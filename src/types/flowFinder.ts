// Enhanced FlowFinder Pattern Types - Alpha Version
// Phase 1: Phonetic sub-patterns
// Phase 2: Semantic and thematic grouping

export interface AdvancedPattern {
  id: string;
  
  // Phase 1: Phonetic Dimensions
  phonetic: {
    endRhyme?: string;              // "-AT", "-IGHT", "-ATION"
    endRhymePhonetic?: string;      // IPA: /æt/, /aɪt/, /eɪʃən/
    internalRhyme?: string[];       // ["ical", "ow"] 
    assonance?: string[];           // Vowel patterns: ["i", "i", "i"]
    consonance?: string[];          // Consonant patterns: ["st", "st"]
    alliteration?: string;          // Initial sound: "S", "FL", "PR"
    stress?: string;                // Rhythm pattern: "DA-dum-DA-dum"
    syllableStructure?: string;     // "CVC", "CVCC", etc.
  };
  
  // Phase 2: Semantic & Thematic Dimensions
  semantic: {
    theme?: string[];               // ["movement", "emotion", "nature", "urban"]
    semanticField?: string;         // "motion", "feeling", "time"
    register?: 'formal' | 'colloquial' | 'poetic' | 'technical' | 'slang';
    mood?: 'energetic' | 'melancholic' | 'aggressive' | 'peaceful' | 'playful';
    imagery?: string[];             // ["visual", "auditory", "kinesthetic"]
    culturalContext?: string;       // "hip-hop", "classical-poetry", "folk"
  };
  
  // Pattern metadata
  metadata: {
    complexity: PatternComplexity;
    frequency: number;              // How common in English (1-10)
    userLevel: number;              // Minimum level to introduce (1-30)
    cognitiveLoad: number;          // How many dimensions (1-5)
  };
  
  // Elements that match this pattern
  elements: PatternElement[];
  
  // Relationships to other patterns
  relationships?: {
    subPatternOf?: string[];        // This is a specific case of these patterns
    siblingPatterns?: string[];     // Related patterns at same level
    progressionTo?: string[];       // Next level patterns
    combinesWith?: string[];        // Works well together with
  };
}

export interface PatternElement {
  id: string;
  text: string;
  
  // Phonetic information
  phonetic?: {
    ipa?: string;                   // IPA transcription
    syllables?: string[];           // Syllable breakdown
    stress?: number[];              // Stress pattern [1, 0, 2] (primary, none, secondary)
    rhymeSound?: string;            // The actual rhyming part
  };
  
  // Semantic information
  semantic?: {
    meaning?: string;               // Brief definition
    connotation?: 'positive' | 'negative' | 'neutral';
    register?: 'formal' | 'colloquial' | 'poetic' | 'technical' | 'slang';
    imagery?: string[];             // Types of imagery
    culturalNote?: string;          // Cultural context if relevant
  };
  
  // Game metadata
  metadata: {
    difficulty: number;             // 1-10
    frequency: number;              // How common (1-10)
    displayPriority: number;        // Order in game
  };
}

export interface PatternComplexity {
  level: number;                    // 1-30
  dimensions: string[];             // Active pattern dimensions
  cognitiveLoad: number;            // 1-5 scale
  linguisticSophistication: number; // 1-5 scale
  culturalKnowledge: number;        // 0-5 scale
}

// Game-specific types
export interface PatternGroup {
  id: string;
  name: string;                     // Display name for the group
  description: string;              // What to look for
  
  // The pattern this group represents
  pattern: AdvancedPattern;
  
  // Words in this group for the current game
  elements: PatternElement[];
  
  // Game state
  completed: boolean;
  revealedElements: string[];       // IDs of revealed elements
  attempts: number;
  hintsUsed: number;
}

export interface GameChallenge {
  id: string;
  level: number;
  
  // Pattern groups to find
  patternGroups: PatternGroup[];
  
  // All elements on the board (including decoys)
  boardElements: PatternElement[];
  
  // Difficulty settings
  settings: {
    gridSize: '4x4' | '6x6' | '8x8';
    timeLimit: number;
    maxStrikes: number;
    hintsAllowed: number;
    showPhonetic: boolean;          // Show IPA on hover
    showThemes: boolean;            // Show semantic hints
  };
  
  // Scoring
  scoring: {
    basePoints: number;
    timeBonus: boolean;
    accuracyBonus: boolean;
    patternComplexityMultiplier: number;
  };
}

// Pattern matching rules for different levels
export interface PatternMatchRule {
  id: string;
  name: string;
  description: string;
  
  // Function to check if elements match
  matchFunction: (elements: PatternElement[]) => boolean;
  
  // Minimum level to use this rule
  minLevel: number;
  
  // Which pattern dimensions to check
  dimensions: ('phonetic' | 'semantic')[];
  
  // Specific fields to compare
  compareFields: string[];
}

// User progress tracking
export interface PatternMastery {
  patternId: string;
  
  exposures: number;                // Times seen
  correctMatches: number;           // Times matched correctly
  incorrectMatches: number;         // Times matched incorrectly
  averageTime: number;              // Avg time to recognize
  
  mastery: 'unseen' | 'introduced' | 'practicing' | 'proficient' | 'mastered';
  lastSeen: Date;
  
  // Specific dimension mastery
  dimensionMastery: {
    phonetic?: number;              // 0-100%
    semantic?: number;              // 0-100%
    combined?: number;              // 0-100%
  };
}

// Helper functions for pattern matching
export const patternMatchers = {
  // Phase 1: Phonetic matchers
  endRhyme: (a: PatternElement, b: PatternElement) => 
    a.phonetic?.rhymeSound === b.phonetic?.rhymeSound,
    
  alliteration: (a: PatternElement, b: PatternElement) =>
    a.text[0].toLowerCase() === b.text[0].toLowerCase(),
    
  syllableCount: (a: PatternElement, b: PatternElement) =>
    a.phonetic?.syllables?.length === b.phonetic?.syllables?.length,
    
  stressPattern: (a: PatternElement, b: PatternElement) =>
    JSON.stringify(a.phonetic?.stress) === JSON.stringify(b.phonetic?.stress),
  
  // Phase 2: Semantic matchers  
  theme: (a: PatternElement, b: PatternElement, theme: string) =>
    a.semantic?.imagery?.includes(theme) && b.semantic?.imagery?.includes(theme),
    
  register: (a: PatternElement, b: PatternElement) =>
    a.semantic?.register === b.semantic?.register,
    
  mood: (a: PatternElement, b: PatternElement, mood: string) =>
    a.semantic?.connotation === b.semantic?.connotation,
    
  // Combined matchers for advanced levels
  rhymeAndTheme: (a: PatternElement, b: PatternElement, theme: string) =>
    patternMatchers.endRhyme(a, b) && patternMatchers.theme(a, b, theme),
    
  alliterationAndRegister: (a: PatternElement, b: PatternElement) =>
    patternMatchers.alliteration(a, b) && patternMatchers.register(a, b)
};

export type PatternMatcherFunction = (a: PatternElement, b: PatternElement, ...args: any[]) => boolean; 