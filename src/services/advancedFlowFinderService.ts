import { 
  AdvancedPattern, 
  PatternElement, 
  PatternGroup, 
  GameChallenge,
  PatternComplexity,
  patternMatchers 
} from '../types/flowFinder';

// Enhanced pattern database with phonetic and semantic dimensions
class AdvancedFlowFinderService {
  private static instance: AdvancedFlowFinderService;
  
  // Phase 1 & 2 Pattern Database
  private patternDatabase: Map<number, AdvancedPattern[]> = new Map();
  
  private constructor() {
    this.initializePatternDatabase();
  }
  
  public static getInstance(): AdvancedFlowFinderService {
    if (!AdvancedFlowFinderService.instance) {
      AdvancedFlowFinderService.instance = new AdvancedFlowFinderService();
    }
    return AdvancedFlowFinderService.instance;
  }
  
  private initializePatternDatabase() {
    // Level 1-5: Simple phonetic patterns
    this.patternDatabase.set(1, [
      {
        id: 'simple_rhyme_at',
        phonetic: {
          endRhyme: '-at',
          endRhymePhonetic: '/æt/'
        },
        semantic: {},
        metadata: {
          complexity: {
            level: 1,
            dimensions: ['phonetic.endRhyme'],
            cognitiveLoad: 1,
            linguisticSophistication: 1,
            culturalKnowledge: 0
          },
          frequency: 10,
          userLevel: 1,
          cognitiveLoad: 1
        },
        elements: this.generateSimpleRhymeElements('-at', '/æt/')
      },
      {
        id: 'simple_alliteration_s',
        phonetic: {
          alliteration: 'S'
        },
        semantic: {},
        metadata: {
          complexity: {
            level: 2,
            dimensions: ['phonetic.alliteration'],
            cognitiveLoad: 1,
            linguisticSophistication: 1,
            culturalKnowledge: 0
          },
          frequency: 9,
          userLevel: 2,
          cognitiveLoad: 1
        },
        elements: this.generateAlliterationElements('S')
      }
    ]);
    
    // Level 5-10: Complex phonetic patterns
    this.patternDatabase.set(5, [
      {
        id: 'internal_rhyme_ight',
        phonetic: {
          endRhyme: '-ight',
          endRhymePhonetic: '/aɪt/',
          syllableStructure: 'CVCC'
        },
        semantic: {
          theme: ['vision', 'illumination']
        },
        metadata: {
          complexity: {
            level: 5,
            dimensions: ['phonetic.endRhyme', 'semantic.theme'],
            cognitiveLoad: 2,
            linguisticSophistication: 2,
            culturalKnowledge: 0
          },
          frequency: 8,
          userLevel: 5,
          cognitiveLoad: 2
        },
        elements: this.generateThemedRhymeElements('-ight', '/aɪt/', ['vision', 'illumination'])
      }
    ]);
    
    // Level 10-15: Phonetic + Semantic patterns
    this.patternDatabase.set(10, [
      {
        id: 'movement_rhyme_tion',
        phonetic: {
          endRhyme: '-tion',
          endRhymePhonetic: '/ʃən/',
          stress: 'da-DA-dum'
        },
        semantic: {
          theme: ['movement', 'action'],
          semanticField: 'motion',
          register: 'formal'
        },
        metadata: {
          complexity: {
            level: 10,
            dimensions: ['phonetic.endRhyme', 'phonetic.stress', 'semantic.theme'],
            cognitiveLoad: 3,
            linguisticSophistication: 3,
            culturalKnowledge: 1
          },
          frequency: 7,
          userLevel: 10,
          cognitiveLoad: 3
        },
        elements: this.generateSemanticPhoneticElements()
      }
    ]);
    
    // Level 15+: Multi-dimensional patterns
    this.patternDatabase.set(15, [
      {
        id: 'hiphop_internal_flow',
        phonetic: {
          internalRhyme: ['ical'],
          stress: 'DA-da-da-DA-da-da',
          consonance: ['k', 'l']
        },
        semantic: {
          theme: ['skill', 'artistry', 'expression'],
          register: 'colloquial',
          mood: 'energetic',
          culturalContext: 'hip-hop'
        },
        metadata: {
          complexity: {
            level: 15,
            dimensions: ['phonetic.internalRhyme', 'phonetic.stress', 'semantic.register', 'semantic.culturalContext'],
            cognitiveLoad: 4,
            linguisticSophistication: 4,
            culturalKnowledge: 3
          },
          frequency: 6,
          userLevel: 15,
          cognitiveLoad: 4
        },
        elements: this.generateCulturalPatternElements('hip-hop')
      }
    ]);
  }
  
  // Generate game challenge based on user level
  public generateChallenge(userLevel: number, isPremium: boolean = false): GameChallenge {
    const patterns = this.selectPatternsForLevel(userLevel);
    const patternGroups = this.createPatternGroups(patterns, userLevel);
    const boardElements = this.generateBoardElements(patternGroups, userLevel);
    
    const gridSize = this.determineGridSize(userLevel);
    
    return {
      id: `challenge_${Date.now()}`,
      level: userLevel,
      patternGroups,
      boardElements,
      settings: {
        gridSize,
        timeLimit: this.calculateTimeLimit(userLevel, gridSize),
        maxStrikes: userLevel < 10 ? 4 : 3,
        hintsAllowed: userLevel < 5 ? 3 : userLevel < 15 ? 2 : 1,
        showPhonetic: userLevel >= 5,
        showThemes: userLevel >= 10
      },
      scoring: {
        basePoints: 100 * userLevel,
        timeBonus: true,
        accuracyBonus: true,
        patternComplexityMultiplier: 1 + (userLevel * 0.1)
      }
    };
  }
  
  // Pattern selection logic
  private selectPatternsForLevel(userLevel: number): AdvancedPattern[] {
    const availablePatterns: AdvancedPattern[] = [];
    
    // Get patterns at and below user level
    for (let level = 1; level <= userLevel; level++) {
      const levelPatterns = this.patternDatabase.get(level) || [];
      availablePatterns.push(...levelPatterns);
    }
    
    // Mix difficulties: 60% current level, 30% stretch, 10% review
    const currentLevelPatterns = availablePatterns.filter(p => 
      Math.abs(p.metadata.userLevel - userLevel) <= 2
    );
    const stretchPatterns = availablePatterns.filter(p => 
      p.metadata.userLevel > userLevel && p.metadata.userLevel <= userLevel + 3
    );
    const reviewPatterns = availablePatterns.filter(p => 
      p.metadata.userLevel < userLevel - 2
    );
    
    // Select appropriate number of patterns
    const numPatterns = userLevel < 5 ? 2 : userLevel < 10 ? 3 : 4;
    const selected: AdvancedPattern[] = [];
    
    // Add patterns based on proportions
    const currentCount = Math.floor(numPatterns * 0.6);
    const stretchCount = Math.floor(numPatterns * 0.3);
    const reviewCount = numPatterns - currentCount - stretchCount;
    
    selected.push(...this.randomSelect(currentLevelPatterns, currentCount));
    selected.push(...this.randomSelect(stretchPatterns, stretchCount));
    selected.push(...this.randomSelect(reviewPatterns, reviewCount));
    
    return selected;
  }
  
  // Create pattern groups for the game
  private createPatternGroups(patterns: AdvancedPattern[], userLevel: number): PatternGroup[] {
    return patterns.map((pattern, index) => ({
      id: `group_${index}`,
      name: this.generateGroupName(pattern),
      description: this.generateGroupDescription(pattern, userLevel),
      pattern,
      elements: this.selectElementsForGame(pattern.elements, userLevel),
      completed: false,
      revealedElements: [],
      attempts: 0,
      hintsUsed: 0
    }));
  }
  
  // Helper methods for pattern generation
  private generateSimpleRhymeElements(rhyme: string, phonetic: string): PatternElement[] {
    const words = {
      '-at': ['cat', 'hat', 'bat', 'mat', 'rat', 'flat', 'chat'],
      '-ight': ['light', 'night', 'sight', 'bright', 'flight', 'might', 'tight'],
      '-ay': ['day', 'way', 'play', 'say', 'may', 'stay', 'gray']
    };
    
    return (words[rhyme] || words['-at']).map((word, index) => ({
      id: `${rhyme}_${word}`,
      text: word,
      phonetic: {
        rhymeSound: rhyme,
        ipa: `/${word}/` // Simplified for now
      },
      semantic: {},
      metadata: {
        difficulty: 1,
        frequency: 8 - index * 0.5,
        displayPriority: index
      }
    }));
  }
  
  private generateAlliterationElements(letter: string): PatternElement[] {
    const words = {
      'S': ['sun', 'sand', 'sea', 'song', 'silver', 'smooth', 'swift'],
      'B': ['big', 'bold', 'bright', 'brave', 'beautiful', 'busy', 'blue'],
      'F': ['fast', 'fun', 'fly', 'free', 'fresh', 'flow', 'fire']
    };
    
    return (words[letter] || words['S']).map((word, index) => ({
      id: `${letter}_${word}`,
      text: word,
      phonetic: {
        alliteration: letter
      },
      semantic: {},
      metadata: {
        difficulty: 2,
        frequency: 7 - index * 0.3,
        displayPriority: index
      }
    }));
  }
  
  private generateThemedRhymeElements(rhyme: string, phonetic: string, themes: string[]): PatternElement[] {
    const themedWords = {
      'vision': {
        '-ight': ['sight', 'light', 'bright']
      },
      'illumination': {
        '-ight': ['light', 'bright', 'night']
      }
    };
    
    const words = new Set<string>();
    themes.forEach(theme => {
      const themeWords = themedWords[theme]?.[rhyme] || [];
      themeWords.forEach(word => words.add(word));
    });
    
    return Array.from(words).map((word, index) => ({
      id: `themed_${rhyme}_${word}`,
      text: word,
      phonetic: {
        rhymeSound: rhyme,
        ipa: phonetic
      },
      semantic: {
        theme: themes,
        imagery: ['visual']
      },
      metadata: {
        difficulty: 3,
        frequency: 6,
        displayPriority: index
      }
    }));
  }
  
  private generateSemanticPhoneticElements(): PatternElement[] {
    return [
      {
        id: 'motion_1',
        text: 'motion',
        phonetic: {
          rhymeSound: '-tion',
          stress: [0, 1],
          syllables: ['mo', 'tion']
        },
        semantic: {
          theme: ['movement'],
          semanticField: 'motion',
          register: 'formal'
        },
        metadata: { difficulty: 4, frequency: 8, displayPriority: 0 }
      },
      {
        id: 'action_1',
        text: 'action',
        phonetic: {
          rhymeSound: '-tion',
          stress: [1, 0],
          syllables: ['ac', 'tion']
        },
        semantic: {
          theme: ['movement', 'action'],
          semanticField: 'motion',
          register: 'formal'
        },
        metadata: { difficulty: 4, frequency: 9, displayPriority: 1 }
      },
      {
        id: 'creation_1',
        text: 'creation',
        phonetic: {
          rhymeSound: '-tion',
          stress: [0, 1, 0],
          syllables: ['cre', 'a', 'tion']
        },
        semantic: {
          theme: ['action'],
          semanticField: 'motion',
          register: 'formal'
        },
        metadata: { difficulty: 5, frequency: 7, displayPriority: 2 }
      }
    ];
  }
  
  private generateCulturalPatternElements(culture: string): PatternElement[] {
    if (culture === 'hip-hop') {
      return [
        {
          id: 'lyrical_1',
          text: 'lyrical',
          phonetic: {
            internalRhyme: 'ical',
            stress: [1, 0, 0],
            syllables: ['lyr', 'i', 'cal']
          },
          semantic: {
            theme: ['skill', 'artistry'],
            register: 'colloquial',
            mood: 'energetic',
            culturalContext: 'hip-hop'
          },
          metadata: { difficulty: 6, frequency: 6, displayPriority: 0 }
        },
        {
          id: 'mystical_1',
          text: 'mystical',
          phonetic: {
            internalRhyme: 'ical',
            stress: [1, 0, 0],
            syllables: ['mys', 'ti', 'cal']
          },
          semantic: {
            theme: ['artistry', 'expression'],
            register: 'colloquial',
            mood: 'energetic',
            culturalContext: 'hip-hop'
          },
          metadata: { difficulty: 6, frequency: 5, displayPriority: 1 }
        }
      ];
    }
    return [];
  }
  
  // Generate board with pattern elements and decoys
  private generateBoardElements(patternGroups: PatternGroup[], userLevel: number): PatternElement[] {
    const elements: PatternElement[] = [];
    
    // Add all pattern elements
    patternGroups.forEach(group => {
      elements.push(...group.elements);
    });
    
    // Add decoys based on level
    const decoyCount = this.calculateDecoyCount(userLevel, elements.length);
    const decoys = this.generateDecoys(patternGroups, decoyCount, userLevel);
    elements.push(...decoys);
    
    // Shuffle for random placement
    return this.shuffle(elements);
  }
  
  // Generate smart decoys that are close but don't match
  private generateDecoys(patternGroups: PatternGroup[], count: number, userLevel: number): PatternElement[] {
    const decoys: PatternElement[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create decoys that are similar to real patterns but don't match
      const targetGroup = patternGroups[i % patternGroups.length];
      const decoy = this.createDecoyForPattern(targetGroup.pattern, i);
      decoys.push(decoy);
    }
    
    return decoys;
  }
  
  private createDecoyForPattern(pattern: AdvancedPattern, index: number): PatternElement {
    // Create near-misses based on pattern type
    if (pattern.phonetic.endRhyme) {
      // Near rhyme decoy
      const nearRhymes = {
        '-at': ['cut', 'bet', 'hot'],
        '-ight': ['bite', 'height', 'white'], // These actually rhyme, need better examples
        '-tion': ['shun', 'shin', 'shown']
      };
      
      const decoyWord = nearRhymes[pattern.phonetic.endRhyme]?.[index % 3] || 'word';
      
      return {
        id: `decoy_${pattern.id}_${index}`,
        text: decoyWord,
        phonetic: {
          rhymeSound: '-' + decoyWord.slice(-2) // Different rhyme
        },
        semantic: pattern.semantic.theme ? {
          theme: ['decoy'] // Different theme
        } : {},
        metadata: {
          difficulty: pattern.metadata.complexity.level,
          frequency: 5,
          displayPriority: 99
        }
      };
    }
    
    return {
      id: `decoy_generic_${index}`,
      text: ['puzzle', 'wonder', 'system', 'random'][index % 4],
      phonetic: {},
      semantic: {},
      metadata: {
        difficulty: 1,
        frequency: 5,
        displayPriority: 99
      }
    };
  }
  
  // Helper methods
  private determineGridSize(userLevel: number): '4x4' | '6x6' | '8x8' {
    if (userLevel < 5) return '4x4';
    if (userLevel < 15) return '6x6';
    return '8x8';
  }
  
  private calculateTimeLimit(userLevel: number, gridSize: string): number {
    const baseTime = {
      '4x4': 120,
      '6x6': 180,
      '8x8': 240
    }[gridSize] || 180;
    
    // Less time at higher levels
    const levelModifier = 1 - (userLevel * 0.01);
    return Math.floor(baseTime * levelModifier);
  }
  
  private calculateDecoyCount(userLevel: number, patternCount: number): number {
    const gridSize = this.determineGridSize(userLevel);
    const totalCells = {
      '4x4': 16,
      '6x6': 36,
      '8x8': 64
    }[gridSize] || 16;
    
    return totalCells - patternCount;
  }
  
  private generateGroupName(pattern: AdvancedPattern): string {
    // Generate user-friendly names
    if (pattern.phonetic.endRhyme) {
      return `Words ending in "${pattern.phonetic.endRhyme}"`;
    }
    if (pattern.phonetic.alliteration) {
      return `Words starting with "${pattern.phonetic.alliteration}"`;
    }
    if (pattern.semantic.theme) {
      return `${pattern.semantic.theme[0]} theme`;
    }
    return 'Pattern Group';
  }
  
  private generateGroupDescription(pattern: AdvancedPattern, userLevel: number): string {
    const descriptions: string[] = [];
    
    // Add phonetic hints
    if (pattern.phonetic.endRhyme && userLevel >= 1) {
      descriptions.push(`Rhyme with "${pattern.phonetic.endRhyme}"`);
    }
    if (pattern.phonetic.stress && userLevel >= 8) {
      descriptions.push(`Stress pattern: ${pattern.phonetic.stress}`);
    }
    
    // Add semantic hints
    if (pattern.semantic.theme && userLevel >= 10) {
      descriptions.push(`Theme: ${pattern.semantic.theme.join(', ')}`);
    }
    if (pattern.semantic.register && userLevel >= 12) {
      descriptions.push(`Register: ${pattern.semantic.register}`);
    }
    
    return descriptions.join(' • ');
  }
  
  private selectElementsForGame(elements: PatternElement[], userLevel: number): PatternElement[] {
    // Select appropriate number of elements based on level
    const count = Math.min(elements.length, userLevel < 10 ? 4 : 6);
    return elements.slice(0, count);
  }
  
  private randomSelect<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Check if elements match a pattern
  public checkMatch(elements: PatternElement[], pattern: AdvancedPattern): boolean {
    // Check each active dimension
    const dimensions = pattern.metadata.complexity.dimensions;
    
    for (const dimension of dimensions) {
      if (dimension.startsWith('phonetic.')) {
        if (!this.checkPhoneticMatch(elements, pattern, dimension)) {
          return false;
        }
      } else if (dimension.startsWith('semantic.')) {
        if (!this.checkSemanticMatch(elements, pattern, dimension)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private checkPhoneticMatch(elements: PatternElement[], pattern: AdvancedPattern, dimension: string): boolean {
    const field = dimension.split('.')[1];
    
    switch (field) {
      case 'endRhyme':
        return elements.every(el => el.phonetic?.rhymeSound === pattern.phonetic.endRhyme);
      case 'alliteration':
        return elements.every(el => el.text[0].toUpperCase() === pattern.phonetic.alliteration);
      case 'stress':
        return elements.every(el => 
          JSON.stringify(el.phonetic?.stress) === JSON.stringify(pattern.phonetic.stress)
        );
      default:
        return true;
    }
  }
  
  private checkSemanticMatch(elements: PatternElement[], pattern: AdvancedPattern, dimension: string): boolean {
    const field = dimension.split('.')[1];
    
    switch (field) {
      case 'theme':
        return elements.every(el => 
          el.semantic?.theme?.some(t => pattern.semantic.theme?.includes(t))
        );
      case 'register':
        return elements.every(el => el.semantic?.register === pattern.semantic.register);
      case 'culturalContext':
        return elements.every(el => el.semantic?.culturalContext === pattern.semantic.culturalContext);
      default:
        return true;
    }
  }
}

export const advancedFlowFinderService = AdvancedFlowFinderService.getInstance(); 