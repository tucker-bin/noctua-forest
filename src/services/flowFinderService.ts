import { logger } from '../utils/logger';

// Enhanced Error Types for FlowFinder
export class FlowFinderError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'FlowFinderError';
  }
}

export class ChallengeGenerationError extends FlowFinderError {
  constructor(message: string, public difficulty: number, userMessage?: string) {
    super(message, 'CHALLENGE_GENERATION_FAILED', true, userMessage);
    this.name = 'ChallengeGenerationError';
  }
}

export class PatternSelectionError extends FlowFinderError {
  constructor(message: string, public patternType: string, userMessage?: string) {
    super(message, 'PATTERN_SELECTION_FAILED', true, userMessage);
    this.name = 'PatternSelectionError';
  }
}

export class WordFilteringError extends FlowFinderError {
  constructor(message: string, public filterCriteria: any, userMessage?: string) {
    super(message, 'WORD_FILTERING_FAILED', true, userMessage);
    this.name = 'WordFilteringError';
  }
}

export class DataValidationError extends FlowFinderError {
  constructor(message: string, public invalidData: any, userMessage?: string) {
    super(message, 'DATA_VALIDATION_FAILED', false, userMessage);
    this.name = 'DataValidationError';
  }
}

// Retry configuration
interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  backoffMs: 100,
  backoffMultiplier: 2
};

// Retry utility function
async function withRetry<T>(
  operation: () => Promise<T> | T,
  options: Partial<RetryOptions> = {},
  context: string = 'operation'
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry non-retryable errors
      if (error instanceof FlowFinderError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        logger.error(`${context} failed after ${attempt} attempts`, {
          error: lastError.message,
          attempts: attempt
        });
        break;
      }
      
      // Wait before retry with exponential backoff
      const delay = config.backoffMs * Math.pow(config.backoffMultiplier, attempt - 1);
      logger.warn(`${context} failed on attempt ${attempt}, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        nextRetryIn: delay
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Validation helpers
function validateUserLevel(userLevel: number): void {
  if (typeof userLevel !== 'number' || userLevel < 1 || userLevel > 100) {
    throw new DataValidationError(
      `Invalid user level: ${userLevel}`,
      { userLevel },
      'User level must be between 1 and 100'
    );
  }
}

function validateDifficulty(difficulty: number): void {
  if (typeof difficulty !== 'number' || difficulty < 800 || difficulty > 3000) {
    throw new DataValidationError(
      `Invalid difficulty rating: ${difficulty}`,
      { difficulty },
      'Difficulty must be between 800 and 3000'
    );
  }
}

function validateGridSize(gridSize: string): void {
  if (gridSize !== '4x4' && gridSize !== '8x8') {
    throw new DataValidationError(
      `Invalid grid size: ${gridSize}`,
      { gridSize },
      'Grid size must be either 4x4 or 8x8'
    );
  }
}

function validateAdaptiveFeatures(features: any): void {
  if (!features || typeof features !== 'object') {
    throw new DataValidationError(
      'Adaptive features must be an object',
      { features },
      'Invalid game configuration'
    );
  }
}

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
  ending?: string;
  words: string[];
  difficulty: number;
  rhythm: string;
  culture?: string;
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
        { pattern: 'at', words: ['cat', 'hat', 'mat', 'bat', 'rat', 'flat', 'chat', 'spat'], difficulty: 1, rhythm: 'simple' },
        { pattern: 'og', words: ['dog', 'log', 'fog', 'hog', 'jog', 'frog', 'clog', 'smog'], difficulty: 1, rhythm: 'simple' },
        { pattern: 'ay', words: ['day', 'way', 'say', 'play', 'stay', 'gray', 'clay', 'pray'], difficulty: 2, rhythm: 'simple' },
        { pattern: 'ine', words: ['line', 'mine', 'wine', 'pine', 'shine', 'fine', 'spine', 'divine'], difficulty: 2, rhythm: 'melodic' },
        { pattern: 'ound', words: ['sound', 'round', 'found', 'ground', 'bound', 'pound', 'mound', 'hound'], difficulty: 2, rhythm: 'resonant' },
        { pattern: 'ake', words: ['make', 'take', 'wake', 'lake', 'cake', 'snake', 'brake', 'shake'], difficulty: 2, rhythm: 'crisp' }
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
      name: 'Bars & Rhymes',
      description: 'Drop bars with the same ending sound',
      icon: '🎵',
      unlockLevel: 1
    },
    'alliteration_alert': { 
      patternType: 'alliteration', 
      name: 'Flow State',
      description: 'Catch words with the same starting sounds',
      icon: '💥',
      unlockLevel: 5
    },
    'consonance_challenge': { 
      patternType: 'consonance', 
      name: 'Beat Breaks',
      description: 'Find the rhythm in consonant patterns',
      icon: '🌊',
      unlockLevel: 10
    },
    'decoy_detective': {
      patternType: 'decoy',
      name: 'Battle Mode',
      description: 'Dodge trap words that fake the rhyme!',
      icon: '🕵️',
      unlockLevel: 7
    },
    'cultural_crossover': { 
      patternType: 'cultural', 
      name: 'World Cypher',
      description: 'Drop knowledge from global sound traditions',
      icon: '🌍',
      unlockLevel: 15
    }
  };

  // Comprehensive list of function words to exclude for better gameplay
  private readonly BORING_WORDS = new Set([
    // Articles
    'a', 'an', 'the',
    // Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'this', 'that', 'these', 'those', 'my', 'your', 'his', 'hers', 'its', 'our', 'their',
    'mine', 'yours', 'ours', 'theirs', 'myself', 'yourself', 'himself', 'herself',
    'itself', 'ourselves', 'yourselves', 'themselves', 'who', 'whom', 'whose', 'which', 'what',
    // Auxiliary verbs
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'can',
    'could', 'must', 'ought',
    // Prepositions
    'in', 'on', 'at', 'by', 'for', 'with', 'to', 'of', 'from', 'up', 'out', 'off',
    'over', 'under', 'above', 'below', 'across', 'through', 'into', 'onto', 'upon',
    'about', 'around', 'before', 'after', 'during', 'within', 'without', 'between',
    'among', 'against', 'toward', 'towards', 'behind', 'beside', 'beneath', 'beyond',
    // Conjunctions
    'and', 'or', 'but', 'so', 'yet', 'nor', 'for', 'because', 'since', 'although',
    'though', 'while', 'whereas', 'if', 'unless', 'until', 'when', 'where', 'how',
    'why', 'that', 'whether',
    // Determiners
    'all', 'any', 'both', 'each', 'every', 'few', 'many', 'most', 'much', 'no',
    'none', 'one', 'other', 'some', 'such', 'more', 'less', 'little', 'enough',
    // Common short words
    'as', 'too', 'very', 'just', 'now', 'then', 'here', 'there', 'way', 'well',
    'back', 'only', 'also', 'still', 'even', 'again', 'once', 'never', 'always',
    'often', 'sometimes', 'usually', 'quite', 'rather', 'almost', 'already', 'yet',
    // Numbers as words
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    // Fillers and basic verbs
    'get', 'got', 'go', 'went', 'come', 'came', 'see', 'saw', 'know', 'knew', 'think',
    'thought', 'want', 'need', 'like', 'look', 'take', 'took', 'give', 'gave', 'make',
    'made', 'find', 'found', 'tell', 'told', 'ask', 'put', 'try', 'use', 'work',
    'help', 'show', 'move', 'play', 'run', 'walk', 'talk', 'live', 'feel', 'seem',
    'become', 'leave', 'left', 'turn', 'start', 'stop', 'keep', 'let', 'begin', 'end'
  ]);

  // Filter out function words from word lists
  private filterBoringWords(words: string[]): string[] {
    return words.filter(word => !this.BORING_WORDS.has(word.toLowerCase()));
  }

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

  // Generate ELO-based dynamic challenge with comprehensive error handling
  public async generateDynamicChallenge(
    userId: string, 
    userLevel: number, 
    isPremium: boolean = false,
    isDaily: boolean = true
  ): Promise<DynamicChallenge> {
    try {
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        throw new DataValidationError('User ID is required', { userId }, 'Invalid user session');
      }
      validateUserLevel(userLevel);

      logger.info('Generating dynamic challenge', {
        userId,
        userLevel,
        isPremium,
        isDaily
      });

      // Generate challenge with retries
      return await withRetry(async () => {
        const playerELO = this.getPlayerELO(userId, userLevel);
        const targetDifficulty = this.calculateTargetDifficulty(playerELO);
        
        validateDifficulty(targetDifficulty);
        
        // For daily challenges, use standardized difficulty
        // For premium endless mode, use dynamic ELO-based difficulty
        const challengeDifficulty = isDaily ? 
          Math.min(targetDifficulty, 1600) : // Cap daily challenge difficulty
          targetDifficulty;

        const adaptiveFeatures = this.generateAdaptiveFeatures(challengeDifficulty, userLevel);
        validateAdaptiveFeatures(adaptiveFeatures);
        
        const gridSize = this.determineGridSize(challengeDifficulty, userLevel, adaptiveFeatures);
        validateGridSize(gridSize);
        
        const rhymeGroups = await this.generateRhymeGroups(challengeDifficulty, gridSize, adaptiveFeatures);
        
        if (!rhymeGroups || rhymeGroups.length === 0) {
          throw new ChallengeGenerationError(
            'No rhyme groups generated',
            challengeDifficulty,
            'Unable to create game. Please try again.'
          );
        }

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
        
        logger.info('Challenge generated successfully', {
          challengeId: challenge.id,
          difficulty: challengeDifficulty,
          gridSize,
          groupCount: rhymeGroups.length
        });
        
        return challenge;
      }, { maxAttempts: 2 }, 'challenge generation');
      
    } catch (error) {
      logger.error('Challenge generation failed completely', {
        userId,
        userLevel,
        isPremium,
        isDaily,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Try to generate a fallback challenge
      return this.generateFallbackChallenge(userLevel, isPremium, isDaily);
    }
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

  // Determine grid size based on difficulty, level, and word complexity
  private determineGridSize(difficulty: number, userLevel: number, adaptiveFeatures?: any): '4x4' | '8x8' {
    // Always start with 4x4 for new users
    if (userLevel < 5) return '4x4';
    
    // Stay with 4x4 for lower difficulties
    if (difficulty < 1200) return '4x4';
    
    // Consider word length when choosing grid size
    if (adaptiveFeatures?.maxWordLength && adaptiveFeatures.maxWordLength > 8) {
      // Prefer smaller grids with longer words to avoid crowding
      return Math.random() > 0.7 ? '8x8' : '4x4'; // Only 30% chance of 8x8 with long words
    }
    
    // Normal progression for balanced word lengths
    return Math.random() > 0.3 ? '8x8' : '4x4'; // 70% chance of 8x8 for high difficulty
  }

  // Generate adaptive features based on difficulty with progressive word length scaling
  private generateAdaptiveFeatures(difficulty: number, userLevel: number) {
    // Progressive word length introduction - more gradual than before
    const wordLengthProgression = this.calculateWordLengthProgression(difficulty, userLevel);
    
    return {
      longerWords: wordLengthProgression.allowLongerWords,
      maxWordLength: wordLengthProgression.maxLength,
      preferredLength: wordLengthProgression.preferredLength,
      obscureRhymes: difficulty > 1400 || userLevel > 10, // Raised threshold
      mixedPatterns: difficulty > 1600 || userLevel > 15, // Raised threshold  
      culturalWords: difficulty > 1800 || userLevel > 20, // Raised threshold
      abstractConcepts: difficulty > 2000 || userLevel > 25 // Raised threshold
    };
  }

  // Calculate progressive word length limits based on difficulty and user level
  private calculateWordLengthProgression(difficulty: number, userLevel: number) {
    // Base progression: Start with 3-5 character words, gradually increase
    let maxLength = 5; // Start conservative
    let preferredLength = 4;
    let allowLongerWords = false;

    // Level-based progression (user experience)
    if (userLevel >= 3) {
      maxLength = 6;
      preferredLength = 5;
    }
    if (userLevel >= 6) {
      maxLength = 7;
      preferredLength = 5;
      allowLongerWords = true;
    }
    if (userLevel >= 10) {
      maxLength = 8;
      preferredLength = 6;
    }
    if (userLevel >= 15) {
      maxLength = 10;
      preferredLength = 7;
    }
    if (userLevel >= 20) {
      maxLength = 12;
      preferredLength = 8;
    }

    // ELO-based fine-tuning (skill level)
    if (difficulty > 1200) {
      maxLength = Math.min(maxLength + 1, 12);
    }
    if (difficulty > 1500) {
      maxLength = Math.min(maxLength + 1, 15);
      preferredLength = Math.min(preferredLength + 1, 10);
    }
    if (difficulty > 1800) {
      maxLength = Math.min(maxLength + 2, 18);
      preferredLength = Math.min(preferredLength + 2, 12);
    }

    return {
      maxLength,
      preferredLength,
      allowLongerWords: maxLength > 6
    };
  }

  // Generate Decoy Detective challenge with trap words
  public generateDecoyChallenge(
    userId: string,
    userLevel: number,
    isPremium: boolean = false
  ): DynamicChallenge {
    const playerELO = this.getPlayerELO(userId, userLevel);
    const targetDifficulty = this.calculateTargetDifficulty(playerELO);
    
    // Progressive grid size: 4x4 → 8x8 as you advance
    const gridSize = this.determineDecoyGridSize(userLevel, targetDifficulty);
    
    // Generate real rhyme groups (fewer than normal)
    const realGroups = this.generateRealRhymeGroups(targetDifficulty, gridSize);
    
    // Generate decoy words (progressively more sophisticated)
    const decoys = this.generateDecoyWords(targetDifficulty, userLevel, gridSize, realGroups);
    
    // Combine real groups with decoys for the challenge
    const allCards = this.combineGroupsWithDecoys(realGroups, decoys, gridSize);

    const challenge: DynamicChallenge = {
      id: `decoy_${gridSize}_${Date.now()}_${userId}`,
      type: 'rhyme_hunter', // Use existing type but with decoy logic
      gridSize,
      text: this.generateDecoyInstructions(userLevel),
      patterns: [],
      targetWords: realGroups.flatMap(group => group.words),
      grid: allCards,
      timeLimit: this.calculateDecoyTimeLimit(targetDifficulty, gridSize),
      completed: false,
      tokensReward: this.calculateTokenReward(targetDifficulty, false) * 1.5, // 50% bonus for decoy mode
      xpReward: this.calculateXPReward(targetDifficulty, false) * 1.5,
      difficulty: gridSize,
      createdAt: new Date(),
      eloRating: targetDifficulty,
      adaptiveFeatures: { longerWords: false, obscureRhymes: false, mixedPatterns: false, culturalWords: false, abstractConcepts: false },
      rhymeGroups: realGroups,
      maxStrikes: 3, // 3 strikes and you're out!
      timeBonus: false,
      isPremium,
      isDaily: false
    };

    this.challenges.push(challenge);
    return challenge;
  }

  // Progressive grid sizing for Decoy Detective
  private determineDecoyGridSize(userLevel: number, difficulty: number): '4x4' | '8x8' {
    if (userLevel < 10) return '4x4';
    if (userLevel < 20 && difficulty < 1400) return '4x4'; 
    return '8x8'; // Advanced players get 8x8 grids
  }

  // Generate sophisticated decoy words
  private generateDecoyWords(
    difficulty: number, 
    userLevel: number, 
    gridSize: '4x4' | '8x8',
    realGroups: RhymeGroup[]
  ): string[] {
    const decoyCount = gridSize === '4x4' ? 6 : 20; // Fill remaining cards with decoys
    const decoys: string[] = [];
    
    // Extract real rhyme patterns to avoid
    const realPatterns = realGroups.map(group => group.pattern);
    
    for (let i = 0; i < decoyCount; i++) {
      const decoy = this.generateSingleDecoy(difficulty, userLevel, realPatterns);
      if (!decoys.includes(decoy) && !realGroups.some(group => group.words.includes(decoy))) {
        decoys.push(decoy);
      }
    }
    
    return decoys;
  }

  // Generate individual sophisticated decoy words
  private generateSingleDecoy(difficulty: number, userLevel: number, realPatterns: string[]): string {
    const decoyTypes = [
      'near_rhyme',    // BEAT vs CAT (similar ending, different vowel)
      'visual_trick',  // THROUGH vs TOUGH (looks similar)
      'length_trap',   // CATASTROPHE vs CAT (same start/end, different length)
      'consonant_shift' // BACK vs PACK (similar but different initial)
    ];
    
    // More sophisticated decoys at higher levels
    const sophisticationLevel = difficulty > 1500 ? 'advanced' : 
                               difficulty > 1200 ? 'intermediate' : 'basic';
    
    const decoyType = decoyTypes[Math.floor(Math.random() * decoyTypes.length)];
    
    switch (decoyType) {
      case 'near_rhyme':
        return this.generateNearRhymeDecoy(sophisticationLevel);
      case 'visual_trick': 
        return this.generateVisualTrickDecoy(sophisticationLevel);
      case 'length_trap':
        return this.generateLengthTrapDecoy(sophisticationLevel);
      case 'consonant_shift':
        return this.generateConsonantShiftDecoy(sophisticationLevel);
      default:
        return this.generateBasicDecoy();
    }
  }

  // Different types of decoy generation
  private generateNearRhymeDecoy(level: string): string {
    const nearRhymes = {
      basic: ['cut', 'bit', 'hit', 'net', 'set', 'met'],
      intermediate: ['flight', 'weight', 'height', 'freight', 'debate'],
      advanced: ['genuine', 'feminine', 'medicine', 'adrenaline']
    };
    const words = nearRhymes[level as keyof typeof nearRhymes];
    return words[Math.floor(Math.random() * words.length)];
  }

  private generateVisualTrickDecoy(level: string): string {
    const visualTricks = {
      basic: ['bow', 'sow', 'row', 'tow', 'how'],
      intermediate: ['colonel', 'island', 'debt', 'doubt', 'lamb'],
      advanced: ['boutique', 'technique', 'physique', 'critique']
    };
    const words = visualTricks[level as keyof typeof visualTricks];
    return words[Math.floor(Math.random() * words.length)];
  }

  private generateLengthTrapDecoy(level: string): string {
    const lengthTraps = {
      basic: ['care', 'scare', 'beware', 'declare'],
      intermediate: ['cat', 'chat', 'scattered', 'catastrophe'],
      advanced: ['run', 'runner', 'running', 'runningness']
    };
    const words = lengthTraps[level as keyof typeof lengthTraps];
    return words[Math.floor(Math.random() * words.length)];
  }

  private generateConsonantShiftDecoy(level: string): string {
    const consonantShifts = {
      basic: ['back', 'pack', 'lack', 'rack', 'sack'],
      intermediate: ['bright', 'fright', 'sight', 'might', 'blight'],
      advanced: ['transcend', 'descend', 'ascend', 'condescend']
    };
    const words = consonantShifts[level as keyof typeof consonantShifts];
    return words[Math.floor(Math.random() * words.length)];
  }

  private generateBasicDecoy(): string {
    const basicDecoys = ['apple', 'table', 'water', 'paper', 'window', 'garden'];
    return basicDecoys[Math.floor(Math.random() * basicDecoys.length)];
  }

  // Generate fewer, more obvious real rhyme groups for decoy mode
  private generateRealRhymeGroups(difficulty: number, gridSize: '4x4' | '8x8'): RhymeGroup[] {
    const groupCount = gridSize === '4x4' ? 2 : 4; // Fewer real groups, more decoys
    const groups: RhymeGroup[] = [];
    
    // Use simple, obvious rhyme patterns for decoy mode
    const simplePatterns = [
      { pattern: '-AT', words: ['cat', 'hat', 'bat', 'rat', 'mat'], difficulty: 2, rhythm: 'simple' },
      { pattern: '-ORE', words: ['more', 'door', 'floor', 'store', 'shore'], difficulty: 2, rhythm: 'simple' },
      { pattern: '-IGHT', words: ['light', 'night', 'sight', 'right', 'bright'], difficulty: 3, rhythm: 'simple' },
      { pattern: '-AY', words: ['day', 'way', 'play', 'say', 'may'], difficulty: 2, rhythm: 'simple' }
    ];
    
    for (let i = 0; i < groupCount; i++) {
      const pattern = simplePatterns[i % simplePatterns.length];
      const groupSize = 3; // Smaller groups in decoy mode
      
      groups.push({
        id: `real_group_${i}`,
        pattern: pattern.pattern,
        words: pattern.words.slice(0, groupSize),
        difficulty: pattern.difficulty,
        completed: false,
        cardsRevealed: [],
        groupSize
      });
    }
    
    return groups;
  }

  // Combine real groups with decoys into card grid
  private combineGroupsWithDecoys(realGroups: RhymeGroup[], decoys: string[], gridSize: '4x4' | '8x8'): string[][] {
    const totalCards = gridSize === '4x4' ? 16 : 64;
    const dimension = gridSize === '4x4' ? 4 : 8;
    
    // Collect all real words
    const realWords = realGroups.flatMap(group => group.words);
    
    // Combine with decoys
    const allWords = [...realWords, ...decoys];
    
    // Shuffle and fill grid
    const shuffledWords = this.shuffleArray(allWords).slice(0, totalCards);
    
    // Create grid
    const grid: string[][] = [];
    for (let row = 0; row < dimension; row++) {
      grid[row] = [];
      for (let col = 0; col < dimension; col++) {
        const index = row * dimension + col;
        grid[row][col] = shuffledWords[index] || this.generateBasicDecoy();
      }
    }
    
    return grid;
  }

  // Instructions for decoy mode
  private generateDecoyInstructions(userLevel: number): string {
    if (userLevel < 10) {
      return "🕵️ DECOY DETECTIVE: Find the REAL rhyming groups! Avoid the trap words that DON'T rhyme. You have 3 strikes!";
    } else if (userLevel < 20) {
      return "🔍 ADVANCED DETECTION: Sophisticated decoys ahead! Look for genuine rhyme patterns. Beware of near-rhymes and visual tricks!";
    } else {
      return "🎯 MASTER DETECTIVE: Expert-level decoys with complex phonetic traps. Trust your ear, not your eyes. Precision required!";
    }
  }

  // Slightly longer time limit for decoy mode (need to think more)
  private calculateDecoyTimeLimit(difficulty: number, gridSize: '4x4' | '8x8'): number {
    const baseTime = gridSize === '4x4' ? 90 : 180; // 90s for 4x4, 180s for 8x8
    const difficultyModifier = Math.max(0.8, 1 - (difficulty - 1000) / 2000); // Easier = more time
    return Math.round(baseTime * difficultyModifier);
  }

  // Generate fallback challenge when main generation fails
  private generateFallbackChallenge(
    userLevel: number, 
    isPremium: boolean, 
    isDaily: boolean
  ): DynamicChallenge {
    logger.warn('Generating fallback challenge', { userLevel, isPremium, isDaily });
    
    try {
      // Simple fallback configuration
      const challengeDifficulty = Math.max(800, userLevel * 50); // Basic difficulty based on level
      const gridSize: '4x4' | '8x8' = userLevel < 5 ? '4x4' : '4x4'; // Always use 4x4 for fallback
      
      // Use simple patterns for fallback
      const fallbackGroups: RhymeGroup[] = [
        {
          id: 'fallback_1',
          pattern: 'at',
          words: ['cat', 'hat', 'bat', 'rat'],
          difficulty: 1,
          completed: false,
          cardsRevealed: [],
          groupSize: 4
        },
        {
          id: 'fallback_2', 
          pattern: 'og',
          words: ['dog', 'log', 'fog', 'hog'],
          difficulty: 1,
          completed: false,
          cardsRevealed: [],
          groupSize: 4
        },
        {
          id: 'fallback_3',
          pattern: 'ay',
          words: ['day', 'way', 'say', 'play'],
          difficulty: 1,
          completed: false,
          cardsRevealed: [],
          groupSize: 4
        },
        {
          id: 'fallback_4',
          pattern: 'ight',
          words: ['bright', 'night', 'light', 'sight'],
          difficulty: 2,
          completed: false,
          cardsRevealed: [],
          groupSize: 4
        }
      ];

      const fallbackChallenge: DynamicChallenge = {
        id: `fallback_${Date.now()}`,
        type: 'rhyme_hunter',
        gridSize,
        text: 'Find groups of rhyming words. This is a simplified challenge.',
        patterns: this.convertGroupsToPatterns(fallbackGroups),
        targetWords: this.extractTargetWords(fallbackGroups),
        grid: this.generateCardGrid(fallbackGroups, gridSize),
        timeLimit: 300, // 5 minutes
        completed: false,
        tokensReward: isDaily ? 3 : 2,
        xpReward: isDaily ? 25 : 15,
        difficulty: gridSize,
        createdAt: new Date(),
        eloRating: challengeDifficulty,
                 adaptiveFeatures: {
           longerWords: false,
           obscureRhymes: false,
           mixedPatterns: false,
           culturalWords: false,
           abstractConcepts: false
         },
        rhymeGroups: fallbackGroups,
        maxStrikes: 3,
        timeBonus: false,
        isPremium,
        isDaily
      };

      this.challenges.push(fallbackChallenge);
      logger.info('Fallback challenge generated successfully', { challengeId: fallbackChallenge.id });
      return fallbackChallenge;
      
    } catch (error) {
      logger.error('Even fallback challenge generation failed', { error });
      throw new ChallengeGenerationError(
        'Complete challenge generation failure',
        800,
        'Unable to start game. Please refresh and try again.'
      );
    }
  }

  // Generate rhyme groups with dynamic difficulty - now with error handling
  private async generateRhymeGroups(
    difficulty: number, 
    gridSize: '4x4' | '8x8',
    adaptiveFeatures: any
  ): Promise<RhymeGroup[]> {
    try {
      const totalCards = gridSize === '4x4' ? 16 : 64;
      const groupCount = gridSize === '4x4' ? 4 : 8;
      const avgGroupSize = Math.floor(totalCards / groupCount);
      
      const groups: RhymeGroup[] = [];
      let usedWords = new Set<string>();

      // Select rhyme patterns based on difficulty
      const availablePatterns = this.selectRhymePatterns(difficulty, adaptiveFeatures);
      
      if (!availablePatterns || availablePatterns.length === 0) {
        throw new PatternSelectionError(
          'No suitable patterns found',
          'rhyme',
          'Unable to find appropriate word patterns'
        );
      }
      
      for (let i = 0; i < groupCount; i++) {
        const pattern = availablePatterns[i % availablePatterns.length];
        const groupSize = this.calculateGroupSize(difficulty, avgGroupSize);
        
        // Filter out already used words
        const availableWords = pattern.words.filter(word => !usedWords.has(word));
        
        if (availableWords.length < groupSize) {
          logger.warn('Insufficient words for group', {
            patternId: pattern.pattern,
            available: availableWords.length,
            needed: groupSize
          });
          // Use what we have
          const selectedWords = availableWords;
          selectedWords.forEach(word => usedWords.add(word));
          
          if (selectedWords.length >= 2) { // Minimum viable group
            groups.push({
              id: `group_${i}`,
              pattern: pattern.ending || pattern.pattern,
              words: selectedWords,
              difficulty: pattern.difficulty,
              completed: false,
              cardsRevealed: [],
              groupSize: selectedWords.length
            });
          }
        } else {
          const selectedWords = this.shuffleArray(availableWords).slice(0, groupSize);
          selectedWords.forEach(word => usedWords.add(word));

          groups.push({
            id: `group_${i}`,
            pattern: pattern.ending || pattern.pattern,
            words: selectedWords,
            difficulty: pattern.difficulty,
            completed: false,
            cardsRevealed: [],
            groupSize: selectedWords.length
          });
        }
      }

      if (groups.length === 0) {
        throw new ChallengeGenerationError(
          'No valid groups could be created',
          difficulty,
          'Unable to create word groups'
        );
      }

      return groups;
    } catch (error) {
      if (error instanceof FlowFinderError) {
        throw error;
      }
      throw new ChallengeGenerationError(
        `Rhyme group generation failed: ${error instanceof Error ? error.message : String(error)}`,
        difficulty,
        'Error creating word groups'
      );
    }
  }

  // Select rhyme patterns based on difficulty and features with progressive word length filtering
  private selectRhymePatterns(difficulty: number, adaptiveFeatures: any) {
    let patterns = [];
    
    if (difficulty < 1200) {
      patterns = [...this.patternDatabase.rhyme.simple];
    } else if (difficulty < 1800) {
      patterns = [...this.patternDatabase.rhyme.simple, ...this.patternDatabase.rhyme.rhythmic];
    } else {
      patterns = [...this.patternDatabase.rhyme.rhythmic, ...this.patternDatabase.rhyme.sophisticated];
    }

    // Filter by word length progression - most important change
    if (adaptiveFeatures.maxWordLength && adaptiveFeatures.preferredLength) {
      patterns = patterns.map(pattern => ({
        ...pattern,
        words: this.filterWordsByLength(this.filterBoringWords(pattern.words), adaptiveFeatures)
      })).filter(pattern => pattern.words.length >= 3); // Ensure minimum viable words after filtering
    } else {
      // Always filter boring words even if no length constraints
      patterns = patterns.map(pattern => ({
        ...pattern,
        words: this.filterBoringWords(pattern.words)
      })).filter(pattern => pattern.words.length >= 3);
    }

    // Filter by other adaptive features
    if (adaptiveFeatures.obscureRhymes) {
      patterns = patterns.filter(p => p.difficulty >= 6);
    }

    return this.shuffleArray(patterns);
  }

  // Filter words by length preferences for progressive difficulty
  private filterWordsByLength(words: string[], adaptiveFeatures: any): string[] {
    const { maxWordLength, preferredLength } = adaptiveFeatures;
    
    // Separate words by length categories
    const shortWords = words.filter(word => word.length <= preferredLength);
    const mediumWords = words.filter(word => word.length > preferredLength && word.length <= maxWordLength);
    const longWords = words.filter(word => word.length > maxWordLength);
    
    // Start with preferred length words, then add medium, limit long words
    let filteredWords = [...shortWords];
    
    // Add some medium words if available
    if (mediumWords.length > 0) {
      filteredWords = [...filteredWords, ...mediumWords.slice(0, Math.max(2, Math.floor(mediumWords.length * 0.6)))];
    }
    
    // Add limited long words only if user is ready
    if (adaptiveFeatures.longerWords && longWords.length > 0) {
      filteredWords = [...filteredWords, ...longWords.slice(0, Math.max(1, Math.floor(longWords.length * 0.3)))];
    }
    
    return filteredWords;
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

  // Generate decoy words that don't rhyme with any group (filtered to exclude boring words)
  private generateDecoyWord(): string {
    const decoys = [
      'puzzle', 'wonder', 'forest', 'galaxy', 'wisdom', 'journey', 'mystery', 'harmony',
      'crystal', 'meadow', 'thunder', 'whisper', 'shadow', 'gentle', 'cosmic', 'serene',
      'mountain', 'ocean', 'flower', 'rainbow', 'butterfly', 'sunrise', 'adventure', 'treasure',
      'dragon', 'castle', 'diamond', 'magic', 'phoenix', 'warrior', 'starlight', 'moonbeam'
    ];
    // Filter out any boring words that might have snuck in
    const filteredDecoys = this.filterBoringWords(decoys);
    return filteredDecoys[Math.floor(Math.random() * filteredDecoys.length)];
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
  public async getNextPremiumChallenge(userId: string, userLevel: number): Promise<DynamicChallenge> {
    return await this.generateDynamicChallenge(userId, userLevel, true, false);
  }

  // Daily challenges (free + premium)
  public async getDailyChallenge(userId: string, userLevel: number, gridSize: '4x4' | '8x8'): Promise<DynamicChallenge> {
    const dailyId = `daily_${gridSize}_${new Date().toDateString()}`;
    
    // Check if daily challenge already exists
    const existing = this.challenges.find(c => c.id === dailyId);
    if (existing) return existing;
    
    // Generate new daily challenge with moderate difficulty
    return await this.generateDynamicChallenge(userId, userLevel, false, true);
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

  // Weekly pack functionality with async support and error handling
  public async generateWeeklyPack(weekStart: Date): Promise<WeeklyPack> {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const packId = `week_${weekStart.toISOString().split('T')[0]}`;
      
      const challenges: FlowFinderChallenge[] = [];
      
      for (let day = 0; day < 7; day++) {
        try {
          const challengeDate = new Date(weekStart);
          challengeDate.setDate(challengeDate.getDate() + day);
          
          // Convert dynamic challenges to standard format for packs
          const challenge4x4 = await this.generateDynamicChallenge('weekly', 10, false, true);
          const challenge8x8 = await this.generateDynamicChallenge('weekly', 15, false, true);
          
          challenge4x4.id = `${packId}_4x4_day${day + 1}`;
          challenge8x8.id = `${packId}_8x8_day${day + 1}`;
          challenge4x4.packId = packId;
          challenge8x8.packId = packId;
          
          challenges.push(challenge4x4, challenge8x8);
        } catch (error) {
          logger.warn(`Failed to generate challenges for day ${day + 1}`, {
            packId,
            day: day + 1,
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue with other days
        }
      }

      if (challenges.length === 0) {
        throw new ChallengeGenerationError(
          'No challenges could be generated for weekly pack',
          1000,
          'Unable to create weekly pack'
        );
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
      logger.info('Weekly pack generated successfully', { packId, challengeCount: challenges.length });
      return pack;
      
    } catch (error) {
      logger.error('Weekly pack generation failed', {
        packId: weekStart.toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw new ChallengeGenerationError(
        'Failed to generate weekly pack',
        1000,
        'Unable to create weekly challenges'
      );
    }
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

  public async getAvailablePacks(isPremium: boolean): Promise<WeeklyPack[]> {
    const now = new Date();
    const packs: WeeklyPack[] = [];
    
    for (let i = 0; i < 12; i++) {
      try {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const pack = await this.generateWeeklyPack(weekStart);
        
        if (isPremium || pack.unlocked) {
          packs.push(pack);
        }
      } catch (error) {
        logger.warn(`Failed to generate pack for week ${i}`, {
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with other weeks
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
      const pattern = availablePatterns[i] as Pattern;
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