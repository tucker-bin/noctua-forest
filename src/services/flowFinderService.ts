interface PlayerELO {
  userId: string;
  rating: number; // 800-2400+ scale like chess
  gamesPlayed: number;
  wins: number;
  losses: number;
  averageTime: number;
  streak: number;
  lastPlayed: Date;
  volatility: number; // K-factor for rating changes
  level: number; // User's overall level from ExperienceContext
}

interface RhymeGroup {
  id: string;
  pattern: string; // "-IGHT", "-ORE", "-OCK"
  words: string[];
  difficulty: number; // 1-10 scale
  completed: boolean;
  cardsRevealed: string[];
  groupSize: number; // 2-7 cards per group
}

interface DynamicChallenge extends FlowFinderChallenge {
  eloRating: number; // Challenge difficulty (800-2400+)
  adaptiveFeatures: {
    longerWords: boolean; // 5+ character words
    obscureRhymes: boolean; // Less common rhyme patterns
    mixedPatterns: boolean; // Multiple rhyme types in one group
    culturalWords: boolean; // Words from different languages/cultures
    abstractConcepts: boolean; // Non-concrete nouns
  };
  rhymeGroups: RhymeGroup[];
  maxStrikes: number;
  timeBonus: boolean;
  isPremium: boolean; // Generated for premium users
  isDaily: boolean; // Daily challenge or premium endless mode
}

interface GameSession {
  challengeId: string;
  startTime: Date;
  currentStrikes: number;
  completedGroups: string[];
  revealedCards: string[];
  eloChange: number;
  accuracy: number;
  timeElapsed: number;
}

// Comprehensive pattern database with rhythmic sophistication progression
interface Pattern {
  pattern: string;
  words: string[];
  difficulty: number;
  rhythm: string;
}

interface PatternDatabase {
  rhyme: {
    simple: Pattern[];
    rhythmic: Pattern[];
    sophisticated: Pattern[];
  };
  alliteration: {
    simple: Pattern[];
    rhythmic: Pattern[];
    sophisticated: Pattern[];
  };
  consonance: {
    simple: Pattern[];
    rhythmic: Pattern[];
    sophisticated: Pattern[];
  };
  cultural: {
    hiphop: Pattern[];
    classical: Pattern[];
    japanese: Pattern[];
    spanish: Pattern[];
    arabic: Pattern[];
  };
}

interface GameMode {
  patternType: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
}

interface FlowFinderChallenge {
  id: string;
  type: 'rhyme_hunter' | 'alliteration_alert' | 'meter_master' | 'cultural_crossover' | 'freestyle';
  gridSize: '4x4' | '8x8';
  text: string;
  patterns: Array<{ word: string; type: string; position: number }>;
  targetWords: string[]; // Words to find in the grid (now for card game)
  grid: string[][]; // Card grid for the game
  timeLimit: number; // Time limit in seconds
  completed: boolean;
  tokensReward: number;
  xpReward: number;
  difficulty: '4x4' | '8x8';
  createdAt: Date;
  packId?: string; // For weekly pack challenges
}

interface WeeklyPack {
  id: string;
  name: string;
  description: string;
  weekStart: Date;
  weekEnd: Date;
  challenges: FlowFinderChallenge[];
  unlocked: boolean;
  isPremium: boolean;
}

class FlowFinderService {
  private static instance: FlowFinderService;
  private challenges: DynamicChallenge[] = [];
  private weeklyPacks: WeeklyPack[] = [];
  private playerELOs: Map<string, PlayerELO> = new Map();
  private currentSessions: Map<string, GameSession> = new Map();

  // Comprehensive pattern database with rhythmic sophistication progression
  private patternDatabase: PatternDatabase = {
    // RHYME PATTERNS - End sound matching
    rhyme: {
      simple: [
        { pattern: 'at', words: ['cat', 'sat', 'hat', 'mat', 'bat', 'rat'], difficulty: 1, rhythm: 'simple' },
        { pattern: 'og', words: ['dog', 'log', 'fog', 'hog', 'jog', 'frog'], difficulty: 1, rhythm: 'simple' },
        { pattern: 'ay', words: ['day', 'way', 'say', 'play', 'may', 'stay'], difficulty: 2, rhythm: 'simple' }
      ],
      rhythmic: [
        { pattern: 'ation', words: ['nation', 'station', 'creation', 'vacation', 'education', 'celebration'], difficulty: 4, rhythm: 'multi-syllabic' },
        { pattern: 'ight', words: ['bright', 'night', 'light', 'sight', 'fight', 'delight'], difficulty: 3, rhythm: 'flowing' },
        { pattern: 'er', words: ['dripper', 'spitter', 'hitter', 'quicker', 'slicker', 'thicker'], difficulty: 5, rhythm: 'staccato' }
      ],
      sophisticated: [
        { pattern: 'eous', words: ['gorgeous', 'courageous', 'outrageous', 'advantageous', 'spontaneous', 'simultaneous'], difficulty: 8, rhythm: 'cascading' },
        { pattern: 'escence', words: ['luminescence', 'adolescence', 'effervescence', 'incandescence', 'phosphorescence', 'acquiescence'], difficulty: 10, rhythm: 'ethereal' }
      ]
    },
    
    // ALLITERATION PATTERNS - Initial consonant matching
    alliteration: {
      simple: [
        { pattern: 'B', words: ['big', 'bad', 'bold', 'bright', 'brave', 'busy'], difficulty: 2, rhythm: 'punchy' },
        { pattern: 'S', words: ['swift', 'smooth', 'strong', 'sweet', 'soft', 'sharp'], difficulty: 2, rhythm: 'sibilant' },
        { pattern: 'T', words: ['tiny', 'tough', 'tight', 'tall', 'thick', 'thin'], difficulty: 2, rhythm: 'crisp' }
      ],
      rhythmic: [
        { pattern: 'FL', words: ['flowing', 'flourish', 'flicker', 'flutter', 'flexible', 'fluent'], difficulty: 5, rhythm: 'liquid' },
        { pattern: 'CR', words: ['creative', 'crushing', 'crystalline', 'crescendo', 'crashing', 'crafted'], difficulty: 6, rhythm: 'crackling' },
        { pattern: 'PR', words: ['powerful', 'pristine', 'precision', 'prominent', 'profound', 'progressive'], difficulty: 6, rhythm: 'percussive' }
      ],
      sophisticated: [
        { pattern: 'SP', words: ['spectacular', 'spontaneous', 'spirituality', 'specialized', 'sophisticated', 'spellbinding'], difficulty: 8, rhythm: 'explosive' },
        { pattern: 'ST', words: ['stratospheric', 'stentorian', 'stethoscope', 'stenography', 'stratification', 'structuralism'], difficulty: 9, rhythm: 'structural' }
      ]
    },
    
    // CONSONANCE PATTERNS - Internal consonant matching
    consonance: {
      simple: [
        { pattern: 'ck', words: ['back', 'pack', 'track', 'black', 'crack', 'slack'], difficulty: 3, rhythm: 'clicking' },
        { pattern: 'nd', words: ['hand', 'band', 'sand', 'grand', 'brand', 'stand'], difficulty: 3, rhythm: 'grounding' },
        { pattern: 'mp', words: ['jump', 'bump', 'pump', 'camp', 'stamp', 'clamp'], difficulty: 3, rhythm: 'thumping' }
      ],
      rhythmic: [
        { pattern: 'st', words: ['contest', 'fastest', 'harvest', 'tempest', 'earnest', 'honest'], difficulty: 6, rhythm: 'steady' },
        { pattern: 'nt', words: ['content', 'moment', 'present', 'current', 'absent', 'recent'], difficulty: 5, rhythm: 'resonant' },
        { pattern: 'ct', words: ['contact', 'perfect', 'protect', 'subject', 'collect', 'respect'], difficulty: 6, rhythm: 'structured' }
      ],
      sophisticated: [
        { pattern: 'xt', words: ['context', 'texture', 'mixture', 'fixture', 'nexus', 'complex'], difficulty: 8, rhythm: 'textured' },
        { pattern: 'nk', words: ['distinctive', 'instinctive', 'extinction', 'conjunction', 'disjunction', 'injunction'], difficulty: 9, rhythm: 'linking' }
      ]
    },
    
    // CULTURAL PATTERNS - Language-specific sound beauty
    cultural: {
      // Hip-Hop Flow Patterns
      hiphop: [
        { pattern: 'flow', words: ['blow', 'show', 'glow', 'throw', 'know', 'grow'], difficulty: 4, rhythm: 'bouncing', culture: 'Hip-Hop' },
        { pattern: 'internal', words: ['lyrical', 'mystical', 'typical', 'critical', 'physical', 'magical'], difficulty: 7, rhythm: 'syncopated', culture: 'Hip-Hop' },
        { pattern: 'multis', words: ['phenomenal', 'abdominal', 'astronomical', 'economical', 'anatomical', 'comical'], difficulty: 9, rhythm: 'rapid-fire', culture: 'Hip-Hop' }
      ],
      
      // Classical Poetry Patterns  
      classical: [
        { pattern: 'iambic', words: ['arise', 'delight', 'serene', 'divine', 'sublime', 'refine'], difficulty: 6, rhythm: 'da-DUM', culture: 'Classical Poetry' },
        { pattern: 'shakespearean', words: ['fortune', 'nature', 'venture', 'capture', 'rapture', 'departure'], difficulty: 7, rhythm: 'dignified', culture: 'Shakespearean' },
        { pattern: 'sonnet', words: ['eternal', 'immortal', 'celestial', 'ephemeral', 'temporal', 'maternal'], difficulty: 8, rhythm: 'elevated', culture: 'Sonnet Tradition' }
      ],
      
      // International Sound Patterns
      japanese: [
        { pattern: 'haiku', words: ['silence', 'moonlight', 'dewdrop', 'bamboo', 'cherry', 'willow'], difficulty: 5, rhythm: '5-7-5', culture: 'Japanese Haiku' },
        { pattern: 'zen', words: ['peaceful', 'mindful', 'thoughtful', 'graceful', 'restful', 'careful'], difficulty: 4, rhythm: 'meditative', culture: 'Zen Poetry' }
      ],
      
      spanish: [
        { pattern: 'romance', words: ['corazón', 'pasión', 'canción', 'emoción', 'tradición', 'ocasión'], difficulty: 6, rhythm: 'flowing', culture: 'Spanish Romance' },
        { pattern: 'flamenco', words: ['fuego', 'cielo', 'suelo', 'vuelo', 'duelo', 'consuelo'], difficulty: 5, rhythm: 'passionate', culture: 'Flamenco Tradition' }
      ],
      
      arabic: [
        { pattern: 'qafiya', words: ['jameel', 'kareem', 'hakeem', 'nadeem', 'saleem', 'raheem'], difficulty: 7, rhythm: 'ornate', culture: 'Arabic Poetry' },
        { pattern: 'rajaz', words: ['sahar', 'qamar', 'bahar', 'anhar', 'athar', 'akbar'], difficulty: 8, rhythm: 'rhythmic', culture: 'Classical Arabic' }
      ]
    }
  };

  // Game mode configurations
  private gameModes: Record<string, GameMode> = {
    'rhyme_hunter': { 
      patternType: 'rhyme', 
      name: 'RhymeTime',
      description: 'Find words that end with the same sound',
      icon: '🎵',
      unlockLevel: 1
    },
    'alliteration_alert': { 
      patternType: 'alliteration', 
      name: 'AlliTime',
      description: 'Match words with the same starting sounds',
      icon: '💥',
      unlockLevel: 5
    },
    'consonance_challenge': { 
      patternType: 'consonance', 
      name: 'FlowTime',
      description: 'Discover internal consonant patterns',
      icon: '🌊',
      unlockLevel: 10
    },
    'cultural_crossover': { 
      patternType: 'cultural', 
      name: 'CultureTime',
      description: 'Explore sound patterns from world traditions',
      icon: '🌍',
      unlockLevel: 15
    }
  };

  public static getInstance(): FlowFinderService {
    if (!FlowFinderService.instance) {
      FlowFinderService.instance = new FlowFinderService();
    }
    return FlowFinderService.instance;
  }

  // Initialize or get player ELO
  public getPlayerELO(userId: string, userLevel: number): PlayerELO {
    if (!this.playerELOs.has(userId)) {
      this.playerELOs.set(userId, {
        userId,
        rating: 1200, // Starting rating
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageTime: 0,
        streak: 0,
        lastPlayed: new Date(),
        volatility: 40, // High volatility for new players
        level: userLevel
      });
    }
    
    const elo = this.playerELOs.get(userId)!;
    elo.level = userLevel; // Update level from context
    return elo;
  }

  // Generate ELO-based dynamic challenge
  public generateDynamicChallenge(
    userId: string, 
    userLevel: number, 
    isPremium: boolean = false,
    isDaily: boolean = true
  ): DynamicChallenge {
    const playerELO = this.getPlayerELO(userId, userLevel);
    const targetDifficulty = this.calculateTargetDifficulty(playerELO);
    
    // For daily challenges, use standardized difficulty
    // For premium endless mode, use dynamic ELO-based difficulty
    const challengeDifficulty = isDaily ? 
      Math.min(targetDifficulty, 1600) : // Cap daily challenge difficulty
      targetDifficulty;

    const gridSize = this.determineGridSize(challengeDifficulty, userLevel);
    const adaptiveFeatures = this.generateAdaptiveFeatures(challengeDifficulty, userLevel);
    const rhymeGroups = this.generateRhymeGroups(challengeDifficulty, gridSize, adaptiveFeatures);

    const challengeId = isDaily ? 
      `daily_${gridSize}_${new Date().toDateString()}_${userId}` :
      `premium_${gridSize}_${Date.now()}_${userId}`;

    const challenge: DynamicChallenge = {
      id: challengeId,
      type: this.selectChallengeType(challengeDifficulty),
      gridSize,
      text: this.generateChallengeText(challengeDifficulty, adaptiveFeatures),
      patterns: this.convertGroupsToPatterns(rhymeGroups),
      targetWords: this.extractTargetWords(rhymeGroups),
      grid: this.generateCardGrid(rhymeGroups, gridSize),
      timeLimit: this.calculateTimeLimit(challengeDifficulty, gridSize),
      completed: false,
      tokensReward: this.calculateTokenReward(challengeDifficulty, isDaily),
      xpReward: this.calculateXPReward(challengeDifficulty, isDaily),
      difficulty: gridSize,
      createdAt: new Date(),
      eloRating: challengeDifficulty,
      adaptiveFeatures,
      rhymeGroups,
      maxStrikes: 3,
      timeBonus: challengeDifficulty > 1400,
      isPremium,
      isDaily
    };

    this.challenges.push(challenge);
    return challenge;
  }

  // Calculate target difficulty based on player ELO and recent performance
  private calculateTargetDifficulty(playerELO: PlayerELO): number {
    const baseRating = playerELO.rating;
    const levelBonus = playerELO.level * 20; // +20 rating per level
    const streakBonus = Math.min(playerELO.streak * 10, 100); // +10 per streak, max +100
    
    // Add some randomness for variety (-50 to +50)
    const variance = (Math.random() - 0.5) * 100;
    
    return Math.max(800, Math.min(2400, baseRating + levelBonus + streakBonus + variance));
  }

  // Determine grid size based on difficulty and level
  private determineGridSize(difficulty: number, userLevel: number): '4x4' | '8x8' {
    if (userLevel < 5) return '4x4';
    if (difficulty < 1200) return '4x4';
    return Math.random() > 0.3 ? '8x8' : '4x4'; // 70% chance of 8x8 for high difficulty
  }

  // Generate adaptive features based on difficulty
  private generateAdaptiveFeatures(difficulty: number, userLevel: number) {
    return {
      longerWords: difficulty > 1300 || userLevel > 8,
      obscureRhymes: difficulty > 1500 || userLevel > 12,
      mixedPatterns: difficulty > 1700 || userLevel > 15,
      culturalWords: difficulty > 1900 || userLevel > 20,
      abstractConcepts: difficulty > 2000 || userLevel > 25
    };
  }

  // Generate rhyme groups with dynamic difficulty
  private generateRhymeGroups(
    difficulty: number, 
    gridSize: '4x4' | '8x8',
    adaptiveFeatures: any
  ): RhymeGroup[] {
    const totalCards = gridSize === '4x4' ? 16 : 64;
    const groupCount = gridSize === '4x4' ? 4 : 8;
    const avgGroupSize = Math.floor(totalCards / groupCount);
    
    const groups: RhymeGroup[] = [];
    let usedWords = new Set<string>();

    // Select rhyme patterns based on difficulty
    const availablePatterns = this.selectRhymePatterns(difficulty, adaptiveFeatures);
    
    for (let i = 0; i < groupCount; i++) {
      const pattern = availablePatterns[i % availablePatterns.length];
      const groupSize = this.calculateGroupSize(difficulty, avgGroupSize);
      
      // Filter out already used words
      const availableWords = pattern.words.filter(word => !usedWords.has(word));
      const selectedWords = this.shuffleArray(availableWords).slice(0, groupSize);
      
      selectedWords.forEach(word => usedWords.add(word));

      groups.push({
        id: `group_${i}`,
        pattern: pattern.ending,
        words: selectedWords,
        difficulty: pattern.difficulty,
        completed: false,
        cardsRevealed: [],
        groupSize: selectedWords.length
      });
    }

    return groups;
  }

  // Select rhyme patterns based on difficulty and features
  private selectRhymePatterns(difficulty: number, adaptiveFeatures: any) {
    let patterns = [];
    
    if (difficulty < 1200) {
      patterns = [...this.patternDatabase.rhyme.simple];
    } else if (difficulty < 1800) {
      patterns = [...this.patternDatabase.rhyme.simple, ...this.patternDatabase.rhyme.rhythmic];
    } else {
      patterns = [...this.patternDatabase.rhyme.rhythmic, ...this.patternDatabase.rhyme.sophisticated];
    }

    // Filter by adaptive features
    if (adaptiveFeatures.longerWords) {
      patterns = patterns.filter(p => p.words.some(word => word.length >= 5));
    }

    if (adaptiveFeatures.obscureRhymes) {
      patterns = patterns.filter(p => p.difficulty >= 6);
    }

    return this.shuffleArray(patterns);
  }

  // Calculate dynamic group size (2-7 cards)
  private calculateGroupSize(difficulty: number, avgGroupSize: number): number {
    const minSize = 2;
    const maxSize = 7;
    
    // Higher difficulty tends toward larger groups
    const difficultyFactor = (difficulty - 800) / 1600; // 0-1 scale
    const targetSize = minSize + (maxSize - minSize) * difficultyFactor;
    
    // Add some randomness
    const randomVariance = (Math.random() - 0.5) * 2;
    const finalSize = Math.round(targetSize + randomVariance);
    
    return Math.max(minSize, Math.min(maxSize, finalSize));
  }

  // Generate card grid (now represents card positions, not letters)
  private generateCardGrid(rhymeGroups: RhymeGroup[], gridSize: '4x4' | '8x8'): string[][] {
    const size = gridSize === '4x4' ? 4 : 8;
    const allWords: string[] = [];
    
    // Collect all words from groups
    rhymeGroups.forEach(group => {
      allWords.push(...group.words);
    });

    // Shuffle words for random placement
    const shuffledWords = this.shuffleArray(allWords);
    
    // Fill remaining slots with decoy words if needed
    while (shuffledWords.length < size * size) {
      shuffledWords.push(this.generateDecoyWord());
    }

    // Arrange in grid
    const grid: string[][] = [];
    for (let i = 0; i < size; i++) {
      grid[i] = [];
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        grid[i][j] = shuffledWords[index] || '';
      }
    }

    return grid;
  }

  // Generate decoy words that don't rhyme with any group
  private generateDecoyWord(): string {
    const decoys = [
      'puzzle', 'wonder', 'forest', 'galaxy', 'wisdom', 'journey', 'mystery', 'harmony',
      'crystal', 'meadow', 'thunder', 'whisper', 'shadow', 'gentle', 'cosmic', 'serene'
    ];
    return decoys[Math.floor(Math.random() * decoys.length)];
  }

  // Update player ELO after game completion
  public updatePlayerELO(
    userId: string, 
    challengeELO: number, 
    success: boolean, 
    accuracy: number, 
    timeRatio: number
  ): number {
    const playerELO = this.getPlayerELO(userId, 0);
    
    // Calculate expected score using ELO formula
    const expectedScore = 1 / (1 + Math.pow(10, (challengeELO - playerELO.rating) / 400));
    
    // Actual score based on performance
    let actualScore = success ? 1 : 0;
    
    // Adjust score based on accuracy and time
    if (success) {
      actualScore = 0.5 + (accuracy * 0.3) + (timeRatio * 0.2);
      actualScore = Math.min(1, actualScore);
    }

    // Calculate ELO change
    const K = playerELO.volatility; // K-factor
    const eloChange = Math.round(K * (actualScore - expectedScore));
    
    // Update player stats
    playerELO.rating += eloChange;
    playerELO.gamesPlayed++;
    if (success) {
      playerELO.wins++;
      playerELO.streak++;
    } else {
      playerELO.losses++;
      playerELO.streak = 0;
    }
    
    // Reduce volatility over time
    if (playerELO.gamesPlayed > 10) {
      playerELO.volatility = Math.max(15, playerELO.volatility - 0.5);
    }
    
    playerELO.lastPlayed = new Date();
    
    return eloChange;
  }

  // Get seamless next challenge for premium users
  public getNextPremiumChallenge(userId: string, userLevel: number): DynamicChallenge {
    return this.generateDynamicChallenge(userId, userLevel, true, false);
  }

  // Daily challenges (free + premium)
  public getDailyChallenge(userId: string, userLevel: number, gridSize: '4x4' | '8x8'): DynamicChallenge {
    const dailyId = `daily_${gridSize}_${new Date().toDateString()}`;
    
    // Check if daily challenge already exists
    const existing = this.challenges.find(c => c.id === dailyId);
    if (existing) return existing;
    
    // Generate new daily challenge with moderate difficulty
    return this.generateDynamicChallenge(userId, userLevel, false, true);
  }

  // Helper methods for conversion and compatibility
  private convertGroupsToPatterns(rhymeGroups: RhymeGroup[]) {
    const patterns: Array<{ word: string; type: string; position: number }> = [];
    let position = 0;
    
    rhymeGroups.forEach(group => {
      group.words.forEach(word => {
        patterns.push({
          word,
          type: `rhyme-${group.pattern}`,
          position: position++
        });
      });
    });

    return patterns;
  }

  private extractTargetWords(rhymeGroups: RhymeGroup[]): string[] {
    return rhymeGroups.flatMap(group => group.words);
  }

  private selectChallengeType(difficulty: number): 'rhyme_hunter' | 'alliteration_alert' | 'meter_master' | 'cultural_crossover' | 'freestyle' {
    if (difficulty < 1200) return 'rhyme_hunter';
    if (difficulty < 1600) return 'alliteration_alert';
    if (difficulty < 2000) return 'meter_master';
    return Math.random() > 0.5 ? 'cultural_crossover' : 'freestyle';
  }

  private generateChallengeText(difficulty: number, features: any): string {
    const texts = [
      'Find the rhyming pattern groups by flipping cards!',
      'Match words that rhyme together - complete each group before starting another!',
      'Discover the hidden rhyme connections. Three strikes and you\'re out!',
      'Chain together rhyming words to reveal the pattern. Watch your strikes!',
      'Advanced pattern recognition: find the sophisticated rhyme groups!'
    ];
    
    const index = Math.floor((difficulty - 800) / 320);
    return texts[Math.max(0, Math.min(texts.length - 1, index))];
  }

  private calculateTimeLimit(difficulty: number, gridSize: '4x4' | '8x8'): number {
    const baseTime = gridSize === '4x4' ? 180 : 360; // 3 or 6 minutes base
    const difficultyMultiplier = 1 + (difficulty - 1200) / 1200; // 1.0 to 2.0
    return Math.round(baseTime * difficultyMultiplier);
  }

  private calculateTokenReward(difficulty: number, isDaily: boolean): number {
    const baseReward = isDaily ? 5 : 3;
    const difficultyBonus = Math.floor((difficulty - 800) / 200);
    return baseReward + difficultyBonus;
  }

  private calculateXPReward(difficulty: number, isDaily: boolean): number {
    const baseReward = isDaily ? 50 : 30;
    const difficultyBonus = Math.floor((difficulty - 800) / 100);
    return baseReward + difficultyBonus;
  }

  // Weekly pack functionality (unchanged but enhanced)
  public generateWeeklyPack(weekStart: Date): WeeklyPack {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const packId = `week_${weekStart.toISOString().split('T')[0]}`;
    
    const challenges: FlowFinderChallenge[] = [];
    
    for (let day = 0; day < 7; day++) {
      const challengeDate = new Date(weekStart);
      challengeDate.setDate(challengeDate.getDate() + day);
      
      // Convert dynamic challenges to standard format for packs
      const challenge4x4 = this.generateDynamicChallenge('weekly', 10, false, true);
      const challenge8x8 = this.generateDynamicChallenge('weekly', 15, false, true);
      
      challenge4x4.id = `${packId}_4x4_day${day + 1}`;
      challenge8x8.id = `${packId}_8x8_day${day + 1}`;
      challenge4x4.packId = packId;
      challenge8x8.packId = packId;
      
      challenges.push(challenge4x4, challenge8x8);
    }

    const pack: WeeklyPack = {
      id: packId,
      name: `Week of ${weekStart.toLocaleDateString()}`,
      description: `14 Flow Finder challenges for the week starting ${weekStart.toLocaleDateString()}`,
      weekStart,
      weekEnd,
      challenges,
      unlocked: this.isPackUnlocked(weekStart),
      isPremium: this.isPackPremium(weekStart)
    };

    this.weeklyPacks.push(pack);
    return pack;
  }

  private isPackUnlocked(weekStart: Date): boolean {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return weekStart >= oneWeekAgo;
  }

  private isPackPremium(weekStart: Date): boolean {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return weekStart < oneWeekAgo;
  }

  public getAvailablePacks(isPremium: boolean): WeeklyPack[] {
    const now = new Date();
    const packs: WeeklyPack[] = [];
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const pack = this.generateWeeklyPack(weekStart);
      
      if (isPremium || pack.unlocked) {
        packs.push(pack);
      }
    }
    
    return packs.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  // Utility functions
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public completeChallenge(challengeId: string, success: boolean, accuracy: number): void {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = true;
    }
  }

  public getChallengeById(id: string): DynamicChallenge | undefined {
    return this.challenges.find(c => c.id === id);
  }

  // Get player statistics
  public getPlayerStats(userId: string): PlayerELO | undefined {
    return this.playerELOs.get(userId);
  }

  // Get available game modes based on user level
  public getAvailableGameModes(userLevel: number) {
    return Object.entries(this.gameModes)
      .filter(([_, mode]) => userLevel >= mode.unlockLevel)
      .map(([id, mode]) => ({ id, ...mode }));
  }

  // Generate challenge with specific pattern type and cultural context
  public generateCulturalChallenge(
    userId: string,
    userLevel: number,
    modeId: string,
    culturalTheme?: string,
    isPremium: boolean = false
  ): DynamicChallenge {
    const mode = this.gameModes[modeId as keyof typeof this.gameModes];
    if (!mode) throw new Error(`Unknown game mode: ${modeId}`);

    const playerELO = this.getPlayerELO(userId, userLevel);
    const targetDifficulty = this.calculateTargetDifficulty(playerELO);
    const sophisticationLevel = this.determineSophisticationLevel(targetDifficulty, userLevel);
    
    const gridSize = this.determineGridSize(targetDifficulty, userLevel);
    const patternGroups = this.generatePatternGroups(
      mode.patternType, 
      sophisticationLevel, 
      gridSize, 
      culturalTheme
    );

    const challengeId = `${modeId}_${sophisticationLevel}_${Date.now()}_${userId}`;

    const challenge: DynamicChallenge = {
      id: challengeId,
      type: modeId as any,
      gridSize,
      text: this.generateCulturalChallengeText(mode, sophisticationLevel, culturalTheme),
      patterns: this.convertGroupsToPatterns(patternGroups),
      targetWords: this.extractTargetWords(patternGroups),
      grid: this.generateCardGrid(patternGroups, gridSize),
      timeLimit: this.calculateTimeLimit(targetDifficulty, gridSize),
      completed: false,
      tokensReward: this.calculateTokenReward(targetDifficulty, true),
      xpReward: this.calculateXPReward(targetDifficulty, true),
      difficulty: gridSize,
      createdAt: new Date(),
      eloRating: targetDifficulty,
      adaptiveFeatures: {
        longerWords: sophisticationLevel !== 'simple',
        obscureRhymes: sophisticationLevel === 'sophisticated',
        mixedPatterns: sophisticationLevel === 'sophisticated',
        culturalWords: mode.patternType === 'cultural',
        abstractConcepts: sophisticationLevel === 'sophisticated'
      },
      rhymeGroups: patternGroups,
      maxStrikes: 3,
      timeBonus: targetDifficulty > 1400,
      isPremium,
      isDaily: false
    };

    this.challenges.push(challenge);
    return challenge;
  }

  // Determine sophistication level based on difficulty and user level
  private determineSophisticationLevel(difficulty: number, userLevel: number): 'simple' | 'rhythmic' | 'sophisticated' {
    if (difficulty < 1200 || userLevel < 5) return 'simple';
    if (difficulty < 1800 || userLevel < 15) return 'rhythmic';
    return 'sophisticated';
  }

  // Generate pattern groups for specific pattern type and sophistication
  private generatePatternGroups(
    patternType: string,
    sophisticationLevel: string,
    gridSize: '4x4' | '8x8',
    culturalTheme?: string
  ): RhymeGroup[] {
    const totalCards = gridSize === '4x4' ? 16 : 64;
    const groupCount = gridSize === '4x4' ? 4 : 8;
    const avgGroupSize = Math.floor(totalCards / groupCount);
    
    let availablePatterns: any[] = [];

    // Select patterns based on type and sophistication
    if (patternType === 'cultural' && culturalTheme) {
      availablePatterns = this.patternDatabase.cultural[culturalTheme as keyof typeof this.patternDatabase.cultural] || [];
    } else if (patternType in this.patternDatabase) {
      const typePatterns = this.patternDatabase[patternType as keyof typeof this.patternDatabase];
      availablePatterns = typePatterns[sophisticationLevel as keyof typeof typePatterns] || [];
    }

    // Fallback to rhyme patterns if no patterns found
    if (availablePatterns.length === 0) {
      availablePatterns = this.patternDatabase.rhyme[sophisticationLevel as keyof typeof this.patternDatabase.rhyme];
    }

    const groups: RhymeGroup[] = [];
    let usedWords = new Set<string>();

    for (let i = 0; i < groupCount && i < availablePatterns.length; i++) {
      const pattern = availablePatterns[i];
      const groupSize = Math.min(avgGroupSize, pattern.words.length);
      
      // Filter out already used words
      const availableWords = pattern.words.filter((word: string) => !usedWords.has(word));
      const selectedWords = this.shuffleArray(availableWords).slice(0, groupSize);
      
      selectedWords.forEach(word => usedWords.add(word));

      groups.push({
        id: `group_${i}`,
        pattern: pattern.pattern,
        words: selectedWords,
        difficulty: pattern.difficulty,
        completed: false,
        cardsRevealed: [],
        groupSize: selectedWords.length
      });
    }

    return groups;
  }

  // Generate cultural challenge text with context
  private generateCulturalChallengeText(
    mode: any, 
    sophisticationLevel: string, 
    culturalTheme?: string
  ): string {
    const sophisticationTexts = {
      simple: `Find the ${mode.patternType} pattern groups! Listen for sounds that connect.`,
      rhythmic: `Discover the rhythmic ${mode.patternType} patterns. Feel the flow between words.`,
      sophisticated: `Master sophisticated ${mode.patternType} patterns. Experience the musical complexity.`
    };

    let baseText = sophisticationTexts[sophisticationLevel as keyof typeof sophisticationTexts];
    
    if (culturalTheme && mode.patternType === 'cultural') {
      const culturalContext = {
        hiphop: 'Inspired by Hip-Hop wordplay and flow',
        classical: 'From the tradition of classical poetry',
        japanese: 'Reflecting Japanese aesthetic principles',
        spanish: 'Capturing Spanish lyrical beauty',
        arabic: 'Honoring Arabic poetic traditions'
      };
      baseText += ` ${culturalContext[culturalTheme as keyof typeof culturalContext] || ''}`;
    }

    return baseText;
  }
}

export default FlowFinderService;
export type { FlowFinderChallenge, WeeklyPack, DynamicChallenge, PlayerELO, RhymeGroup, GameSession }; 