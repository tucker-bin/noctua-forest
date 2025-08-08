import { logger } from '../utils/logger';

export interface RhymeMahjongDifficulty {
  name: string;
  description: string;
  layoutComplexity: 'simple' | 'classic' | 'expert';
  sourceText: string;
}

export interface GeneratedPuzzle {
  rhymeGroups: Array<{ word: string; group: string }>;
  difficulty: RhymeMahjongDifficulty;
  metadata: {
    totalWords: number;
    groupCount: number;
    patternTypes: string[];
    complexity: 'simple' | 'medium' | 'complex';
    source?: string; // Added for custom text source
    fallbackUsed?: boolean; // Added for fallback reasons
    fallbackReason?: string; // Added for fallback reasons
    supplemented?: boolean; // Added for supplemented words
    supplementedWith?: number; // Added for supplemented words
  };
}

export class RhymeMahjongPuzzleService {
  private static instance: RhymeMahjongPuzzleService;
  private backendUrl: string;

  private constructor() {
    // Use the environment variable from Vite, with a correct fallback for local dev.
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  public static getInstance(): RhymeMahjongPuzzleService {
    if (!RhymeMahjongPuzzleService.instance) {
      RhymeMahjongPuzzleService.instance = new RhymeMahjongPuzzleService();
    }
    return RhymeMahjongPuzzleService.instance;
  }

  // Define difficulty levels with actual content sources
  private readonly DIFFICULTY_CONFIGS: Record<string, RhymeMahjongDifficulty> = {
    easy: {
      name: 'Easy',
      description: 'Simple rhymes, basic patterns',
      layoutComplexity: 'simple',
      sourceText: `Mary had a little lamb, its fleece was white as snow. And everywhere that Mary went, the lamb was sure to go.`,
    },
    medium: {
      name: 'Medium',
      description: 'Mixed rhymes, more complex',
      layoutComplexity: 'classic',
      sourceText: `Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked. If Peter Piper picked a peck of pickled peppers, where's the peck of pickled peppers Peter Piper picked?`,
    },
    hard: {
      name: 'Hard',
      description: 'Complex rhymes, literary source',
      layoutComplexity: 'expert',
      sourceText: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.`,
    }
  };

  // Enhanced rhyme word groups with layered recognition
  private readonly RHYME_WORD_GROUPS = {
    easy: [
      { 
        group: 'at', 
        words: [
          { word: 'cat', groups: ['at', 'short-a'], phonetic: '/kæt/' },
          { word: 'hat', groups: ['at', 'short-a'], phonetic: '/hæt/' },
          { word: 'mat', groups: ['at', 'short-a'], phonetic: '/mæt/' },
          { word: 'bat', groups: ['at', 'short-a'], phonetic: '/bæt/' },
          { word: 'rat', groups: ['at', 'short-a'], phonetic: '/ræt/' },
          { word: 'flat', groups: ['at', 'bl-cluster'], phonetic: '/flæt/' },
          { word: 'chat', groups: ['at', 'ch-sound'], phonetic: '/tʃæt/' },
          { word: 'sat', groups: ['at', 'short-a'], phonetic: '/sæt/' },
          { word: 'fat', groups: ['at', 'short-a'], phonetic: '/fæt/' },
          { word: 'pat', groups: ['at', 'short-a'], phonetic: '/pæt/' },
          { word: 'that', groups: ['at', 'th-sound'], phonetic: '/ðæt/' },
          { word: 'brat', groups: ['at', 'br-cluster'], phonetic: '/bræt/' }
        ]
      },
      { 
        group: 'ay', 
        words: [
          { word: 'day', groups: ['ay', 'long-a'], phonetic: '/deɪ/' },
          { word: 'way', groups: ['ay', 'long-a'], phonetic: '/weɪ/' },
          { word: 'say', groups: ['ay', 'long-a'], phonetic: '/seɪ/' },
          { word: 'play', groups: ['ay', 'pl-cluster'], phonetic: '/pleɪ/' },
          { word: 'stay', groups: ['ay', 'st-cluster'], phonetic: '/steɪ/' },
          { word: 'gray', groups: ['ay', 'gr-cluster'], phonetic: '/ɡreɪ/' },
          { word: 'clay', groups: ['ay', 'cl-cluster'], phonetic: '/kleɪ/' },
          { word: 'pray', groups: ['ay', 'pr-cluster'], phonetic: '/preɪ/' },
          { word: 'may', groups: ['ay', 'long-a'], phonetic: '/meɪ/' },
          { word: 'pay', groups: ['ay', 'long-a'], phonetic: '/peɪ/' },
          { word: 'bay', groups: ['ay', 'long-a'], phonetic: '/beɪ/' },
          { word: 'ray', groups: ['ay', 'long-a'], phonetic: '/reɪ/' }
        ]
      },
      { 
        group: 'ight', 
        words: [
          { word: 'night', groups: ['ight', 'long-i'], phonetic: '/naɪt/' },
          { word: 'light', groups: ['ight', 'long-i'], phonetic: '/laɪt/' },
          { word: 'bright', groups: ['ight', 'br-cluster'], phonetic: '/braɪt/' },
          { word: 'sight', groups: ['ight', 'long-i'], phonetic: '/saɪt/' },
          { word: 'flight', groups: ['ight', 'fl-cluster'], phonetic: '/flaɪt/' },
          { word: 'might', groups: ['ight', 'long-i'], phonetic: '/maɪt/' },
          { word: 'tight', groups: ['ight', 'long-i'], phonetic: '/taɪt/' },
          { word: 'fight', groups: ['ight', 'long-i'], phonetic: '/faɪt/' },
          { word: 'right', groups: ['ight', 'long-i'], phonetic: '/raɪt/' },
          { word: 'fright', groups: ['ight', 'fr-cluster'], phonetic: '/fraɪt/' },
          { word: 'blight', groups: ['ight', 'bl-cluster'], phonetic: '/blaɪt/' },
          { word: 'slight', groups: ['ight', 'sl-cluster'], phonetic: '/slaɪt/' }
        ]
      },
      { 
        group: 'ake', 
        words: [
          { word: 'make', groups: ['ake', 'long-a'], phonetic: '/meɪk/' },
          { word: 'take', groups: ['ake', 'long-a'], phonetic: '/teɪk/' },
          { word: 'cake', groups: ['ake', 'long-a'], phonetic: '/keɪk/' },
          { word: 'wake', groups: ['ake', 'long-a'], phonetic: '/weɪk/' },
          { word: 'shake', groups: ['ake', 'sh-sound'], phonetic: '/ʃeɪk/' },
          { word: 'break', groups: ['ake', 'br-cluster'], phonetic: '/breɪk/' },
          { word: 'snake', groups: ['ake', 'sn-cluster'], phonetic: '/sneɪk/' },
          { word: 'fake', groups: ['ake', 'long-a'], phonetic: '/feɪk/' },
          { word: 'lake', groups: ['ake', 'long-a'], phonetic: '/leɪk/' },
          { word: 'rake', groups: ['ake', 'long-a'], phonetic: '/reɪk/' },
          { word: 'bake', groups: ['ake', 'long-a'], phonetic: '/beɪk/' },
          { word: 'flake', groups: ['ake', 'fl-cluster'], phonetic: '/fleɪk/' }
        ]
      },
      { 
        group: 'ell', 
        words: [
          { word: 'bell', groups: ['ell', 'short-e'], phonetic: '/bɛl/' },
          { word: 'tell', groups: ['ell', 'short-e'], phonetic: '/tɛl/' },
          { word: 'sell', groups: ['ell', 'short-e'], phonetic: '/sɛl/' },
          { word: 'well', groups: ['ell', 'short-e'], phonetic: '/wɛl/' },
          { word: 'fell', groups: ['ell', 'short-e'], phonetic: '/fɛl/' },
          { word: 'shell', groups: ['ell', 'sh-sound'], phonetic: '/ʃɛl/' },
          { word: 'smell', groups: ['ell', 'sm-cluster'], phonetic: '/smɛl/' },
          { word: 'spell', groups: ['ell', 'sp-cluster'], phonetic: '/spɛl/' },
          { word: 'dwell', groups: ['ell', 'dw-cluster'], phonetic: '/dwɛl/' },
          { word: 'swell', groups: ['ell', 'sw-cluster'], phonetic: '/swɛl/' },
          { word: 'yell', groups: ['ell', 'short-e'], phonetic: '/jɛl/' },
          { word: 'cell', groups: ['ell', 'short-e'], phonetic: '/sɛl/' }
        ]
      },
      { 
        group: 'ock', 
        words: [
          { word: 'rock', groups: ['ock', 'short-o'], phonetic: '/rɑk/' },
          { word: 'sock', groups: ['ock', 'short-o'], phonetic: '/sɑk/' },
          { word: 'lock', groups: ['ock', 'short-o'], phonetic: '/lɑk/' },
          { word: 'block', groups: ['ock', 'bl-cluster'], phonetic: '/blɑk/' },
          { word: 'clock', groups: ['ock', 'cl-cluster'], phonetic: '/klɑk/' },
          { word: 'knock', groups: ['ock', 'kn-cluster'], phonetic: '/nɑk/' },
          { word: 'shock', groups: ['ock', 'sh-sound'], phonetic: '/ʃɑk/' },
          { word: 'stock', groups: ['ock', 'st-cluster'], phonetic: '/stɑk/' },
          { word: 'flock', groups: ['ock', 'fl-cluster'], phonetic: '/flɑk/' },
          { word: 'dock', groups: ['ock', 'short-o'], phonetic: '/dɑk/' },
          { word: 'mock', groups: ['ock', 'short-o'], phonetic: '/mɑk/' },
          { word: 'crock', groups: ['ock', 'cr-cluster'], phonetic: '/krɑk/' }
        ]
      }
    ],
    medium: [
      { 
        group: 'ing', 
        words: [
          { word: 'sing', groups: ['ing', 'short-i'], phonetic: '/sɪŋ/' },
          { word: 'ring', groups: ['ing', 'short-i'], phonetic: '/rɪŋ/' },
          { word: 'bring', groups: ['ing', 'br-cluster'], phonetic: '/brɪŋ/' },
          { word: 'thing', groups: ['ing', 'th-sound'], phonetic: '/θɪŋ/' },
          { word: 'swing', groups: ['ing', 'sw-cluster'], phonetic: '/swɪŋ/' },
          { word: 'spring', groups: ['ing', 'spr-cluster'], phonetic: '/sprɪŋ/' },
          { word: 'string', groups: ['ing', 'str-cluster'], phonetic: '/strɪŋ/' },
          { word: 'wing', groups: ['ing', 'short-i'], phonetic: '/wɪŋ/' },
          { word: 'king', groups: ['ing', 'short-i'], phonetic: '/kɪŋ/' },
          { word: 'zing', groups: ['ing', 'short-i'], phonetic: '/zɪŋ/' },
          { word: 'bling', groups: ['ing', 'bl-cluster'], phonetic: '/blɪŋ/' },
          { word: 'cling', groups: ['ing', 'cl-cluster'], phonetic: '/klɪŋ/' }
        ]
      },
      { 
        group: 'ound', 
        words: [
          { word: 'sound', groups: ['ound', 'ou-vowel'], phonetic: '/saʊnd/' },
          { word: 'found', groups: ['ound', 'ou-vowel'], phonetic: '/faʊnd/' },
          { word: 'round', groups: ['ound', 'ou-vowel'], phonetic: '/raʊnd/' },
          { word: 'ground', groups: ['ound', 'gr-cluster'], phonetic: '/ɡraʊnd/' },
          { word: 'bound', groups: ['ound', 'ou-vowel'], phonetic: '/baʊnd/' },
          { word: 'wound', groups: ['ound', 'ou-vowel'], phonetic: '/waʊnd/' },
          { word: 'hound', groups: ['ound', 'ou-vowel'], phonetic: '/haʊnd/' },
          { word: 'mound', groups: ['ound', 'ou-vowel'], phonetic: '/maʊnd/' },
          { word: 'pound', groups: ['ound', 'ou-vowel'], phonetic: '/paʊnd/' },
          { word: 'crown', groups: ['ound', 'cr-cluster'], phonetic: '/kraʊn/' },
          { word: 'brown', groups: ['ound', 'br-cluster'], phonetic: '/braʊn/' },
          { word: 'down', groups: ['ound', 'ou-vowel'], phonetic: '/daʊn/' }
        ]
      },
      { 
        group: 'ate', 
        words: [
          { word: 'late', groups: ['ate', 'long-a'], phonetic: '/leɪt/' },
          { word: 'gate', groups: ['ate', 'long-a'], phonetic: '/ɡeɪt/' },
          { word: 'fate', groups: ['ate', 'long-a'], phonetic: '/feɪt/' },
          { word: 'hate', groups: ['ate', 'long-a'], phonetic: '/heɪt/' },
          { word: 'rate', groups: ['ate', 'long-a'], phonetic: '/reɪt/' },
          { word: 'date', groups: ['ate', 'long-a'], phonetic: '/deɪt/' },
          { word: 'mate', groups: ['ate', 'long-a'], phonetic: '/meɪt/' },
          { word: 'state', groups: ['ate', 'st-cluster'], phonetic: '/steɪt/' },
          { word: 'plate', groups: ['ate', 'pl-cluster'], phonetic: '/pleɪt/' },
          { word: 'create', groups: ['ate', 'cr-cluster'], phonetic: '/kriˈeɪt/' },
          { word: 'debate', groups: ['ate', 'long-a'], phonetic: '/dɪˈbeɪt/' },
          { word: 'relate', groups: ['ate', 'long-a'], phonetic: '/rɪˈleɪt/' }
        ]
      },
      { 
        group: 'ight', 
        words: [
          { word: 'height', groups: ['ight', 'long-i'], phonetic: '/haɪt/' },
          { word: 'weight', groups: ['ight', 'long-a'], phonetic: '/weɪt/' },
          { word: 'freight', groups: ['ight', 'fr-cluster'], phonetic: '/freɪt/' },
          { word: 'straight', groups: ['ight', 'str-cluster'], phonetic: '/streɪt/' },
          { word: 'eight', groups: ['ight', 'long-a'], phonetic: '/eɪt/' },
          { word: 'great', groups: ['ight', 'gr-cluster'], phonetic: '/ɡreɪt/' },
          { word: 'plate', groups: ['ight', 'pl-cluster'], phonetic: '/pleɪt/' },
          { word: 'state', groups: ['ight', 'st-cluster'], phonetic: '/steɪt/' },
          { word: 'create', groups: ['ight', 'cr-cluster'], phonetic: '/kriˈeɪt/' },
          { word: 'gate', groups: ['ight', 'long-a'], phonetic: '/ɡeɪt/' },
          { word: 'late', groups: ['ight', 'long-a'], phonetic: '/leɪt/' },
          { word: 'fate', groups: ['ight', 'long-a'], phonetic: '/feɪt/' }
        ]
      },
      { 
        group: 'ean', 
        words: [
          { word: 'clean', groups: ['ean', 'long-e'], phonetic: '/klin/' },
          { word: 'mean', groups: ['ean', 'long-e'], phonetic: '/min/' },
          { word: 'bean', groups: ['ean', 'long-e'], phonetic: '/bin/' },
          { word: 'lean', groups: ['ean', 'long-e'], phonetic: '/lin/' },
          { word: 'seen', groups: ['ean', 'long-e'], phonetic: '/sin/' },
          { word: 'green', groups: ['ean', 'gr-cluster'], phonetic: '/ɡrin/' },
          { word: 'screen', groups: ['ean', 'scr-cluster'], phonetic: '/skrin/' },
          { word: 'queen', groups: ['ean', 'kw-sound'], phonetic: '/kwin/' },
          { word: 'keen', groups: ['ean', 'long-e'], phonetic: '/kin/' },
          { word: 'teen', groups: ['ean', 'long-e'], phonetic: '/tin/' },
          { word: 'scene', groups: ['ean', 'sc-cluster'], phonetic: '/sin/' },
          { word: 'machine', groups: ['ean', 'long-e'], phonetic: '/məˈʃin/' }
        ]
      },
      { 
        group: 'ool', 
        words: [
          { word: 'cool', groups: ['ool', 'long-o'], phonetic: '/kul/' },
          { word: 'pool', groups: ['ool', 'long-o'], phonetic: '/pul/' },
          { word: 'tool', groups: ['ool', 'long-o'], phonetic: '/tul/' },
          { word: 'school', groups: ['ool', 'sch-cluster'], phonetic: '/skul/' },
          { word: 'fool', groups: ['ool', 'long-o'], phonetic: '/ful/' },
          { word: 'rule', groups: ['ool', 'long-o'], phonetic: '/rul/' },
          { word: 'jewel', groups: ['ool', 'long-o'], phonetic: '/dʒul/' },
          { word: 'cruel', groups: ['ool', 'cr-cluster'], phonetic: '/krul/' },
          { word: 'stool', groups: ['ool', 'st-cluster'], phonetic: '/stul/' },
          { word: 'drool', groups: ['ool', 'dr-cluster'], phonetic: '/drul/' },
          { word: 'spool', groups: ['ool', 'sp-cluster'], phonetic: '/spul/' },
          { word: 'fuel', groups: ['ool', 'long-o'], phonetic: '/fjul/' }
        ]
      }
    ],
    hard: [
      { 
        group: 'tion', 
        words: [
          { word: 'action', groups: ['tion', 'shun-sound'], phonetic: '/ˈækʃən/' },
          { word: 'nation', groups: ['tion', 'shun-sound'], phonetic: '/ˈneɪʃən/' },
          { word: 'station', groups: ['tion', 'shun-sound'], phonetic: '/ˈsteɪʃən/' },
          { word: 'creation', groups: ['tion', 'shun-sound'], phonetic: '/kriˈeɪʃən/' },
          { word: 'vacation', groups: ['tion', 'shun-sound'], phonetic: '/veɪˈkeɪʃən/' },
          { word: 'education', groups: ['tion', 'shun-sound'], phonetic: '/ˌɛdʒuˈkeɪʃən/' },
          { word: 'location', groups: ['tion', 'shun-sound'], phonetic: '/loʊˈkeɪʃən/' },
          { word: 'emotion', groups: ['tion', 'shun-sound'], phonetic: '/ɪˈmoʊʃən/' },
          { word: 'motion', groups: ['tion', 'shun-sound'], phonetic: '/ˈmoʊʃən/' },
          { word: 'potion', groups: ['tion', 'shun-sound'], phonetic: '/ˈpoʊʃən/' },
          { word: 'caution', groups: ['tion', 'shun-sound'], phonetic: '/ˈkɔʃən/' },
          { word: 'auction', groups: ['tion', 'shun-sound'], phonetic: '/ˈɔkʃən/' }
        ]
      },
      { 
        group: 'ough', 
        words: [
          { word: 'through', groups: ['ough', 'oo-sound'], phonetic: '/θru/' },
          { word: 'tough', groups: ['ough', 'uff-sound'], phonetic: '/tʌf/' },
          { word: 'rough', groups: ['ough', 'uff-sound'], phonetic: '/rʌf/' },
          { word: 'enough', groups: ['ough', 'uff-sound'], phonetic: '/ɪˈnʌf/' },
          { word: 'cough', groups: ['ough', 'off-sound'], phonetic: '/kɔf/' },
          { word: 'laugh', groups: ['ough', 'aff-sound'], phonetic: '/læf/' },
          { word: 'though', groups: ['ough', 'oh-sound'], phonetic: '/ðoʊ/' },
          { word: 'bought', groups: ['ough', 'ot-sound'], phonetic: '/bɔt/' },
          { word: 'fought', groups: ['ough', 'ot-sound'], phonetic: '/fɔt/' },
          { word: 'thought', groups: ['ough', 'ot-sound'], phonetic: '/θɔt/' },
          { word: 'brought', groups: ['ough', 'ot-sound'], phonetic: '/brɔt/' },
          { word: 'sought', groups: ['ough', 'ot-sound'], phonetic: '/sɔt/' }
        ]
      },
      { 
        group: 'ness', 
        words: [
          { word: 'darkness', groups: ['ness', 'suffix'], phonetic: '/ˈdɑrknəs/' },
          { word: 'kindness', groups: ['ness', 'suffix'], phonetic: '/ˈkaɪndnəs/' },
          { word: 'sadness', groups: ['ness', 'suffix'], phonetic: '/ˈsædnəs/' },
          { word: 'madness', groups: ['ness', 'suffix'], phonetic: '/ˈmædnəs/' },
          { word: 'gladness', groups: ['ness', 'suffix'], phonetic: '/ˈɡlædnəs/' },
          { word: 'softness', groups: ['ness', 'suffix'], phonetic: '/ˈsɔftnəs/' },
          { word: 'sweetness', groups: ['ness', 'suffix'], phonetic: '/ˈswitnəs/' },
          { word: 'weakness', groups: ['ness', 'suffix'], phonetic: '/ˈwiknəs/' },
          { word: 'thickness', groups: ['ness', 'suffix'], phonetic: '/ˈθɪknəs/' },
          { word: 'richness', groups: ['ness', 'suffix'], phonetic: '/ˈrɪtʃnəs/' },
          { word: 'freshness', groups: ['ness', 'suffix'], phonetic: '/ˈfrɛʃnəs/' },
          { word: 'coolness', groups: ['ness', 'suffix'], phonetic: '/ˈkulnəs/' }
        ]
      }
    ]
  };

  /**
   * Generate puzzle based on difficulty level or custom text
   */
  public async generatePuzzle(difficultyLevel: string = 'easy', customText?: string): Promise<GeneratedPuzzle> {
    const difficulty = this.DIFFICULTY_CONFIGS[difficultyLevel];
    if (!difficulty) {
      throw new Error(`Unknown difficulty level: ${difficultyLevel}`);
    }

    logger.info('Generating RhymeMahjong puzzle', { 
      difficulty: difficultyLevel,
      isCustomText: !!customText,
      textLength: customText?.length || 0,
      method: customText ? 'backend_analysis' : 'curated_vocabulary'
    });

    // Route 1: Custom user text -> Backend analysis
    if (customText && customText.trim().length > 0) {
      return this.generateFromCustomText(customText, difficulty);
    }

    // Route 2: Standard difficulty modes -> Curated vocabulary  
    try {
      return this.generateFromCuratedVocabulary(difficulty, difficultyLevel);
    } catch (curatedError) {
      logger.warn('Curated generation failed, attempting backend fallback', { 
        error: curatedError instanceof Error ? curatedError.message : String(curatedError)
      });
      
      // Fallback to backend with default text if curated fails
      try {
        return await this.generateFromBackend(difficulty);
      } catch (backendError) {
        logger.error('Both curated and backend generation failed', {
          curatedError: curatedError instanceof Error ? curatedError.message : String(curatedError),
          backendError: backendError instanceof Error ? backendError.message : String(backendError)
        });
        throw new Error('Failed to generate puzzle with both methods');
      }
    }
  }

  /**
   * Generate puzzle using curated vocabulary for consistent quality
   */
  private generateFromCuratedVocabulary(difficulty: RhymeMahjongDifficulty, difficultyLevel: string): GeneratedPuzzle {
    const rhymeGroups = this.RHYME_WORD_GROUPS[difficultyLevel as keyof typeof this.RHYME_WORD_GROUPS];
    if (!rhymeGroups || rhymeGroups.length === 0) {
      throw new Error(`No rhyme groups found for difficulty: ${difficultyLevel}`);
    }

    // Determine how many groups to use based on difficulty
    const groupsToUse = this.determineGroupCount(difficultyLevel);
    const selectedGroups = this.shuffleArray([...rhymeGroups]).slice(0, groupsToUse);
    
    // Generate tiles with better distribution
    const puzzleRhymeGroups = this.generateBalancedTileDistribution(selectedGroups);

    logger.info('Generated curated puzzle', {
      difficulty: difficultyLevel,
      groupsUsed: selectedGroups.length,
      totalTiles: puzzleRhymeGroups.length,
      groups: selectedGroups.map(g => g.group)
    });

    return {
      rhymeGroups: puzzleRhymeGroups,
      difficulty,
      metadata: {
        totalWords: puzzleRhymeGroups.length,
        groupCount: selectedGroups.length,
        patternTypes: ['rhyme'],
        complexity: difficultyLevel === 'hard' ? 'complex' : difficultyLevel === 'medium' ? 'medium' : 'simple'
      }
    };
  }

  /**
   * Generate puzzle from custom user text using backend analysis
   */
  private async generateFromCustomText(customText: string, difficulty: RhymeMahjongDifficulty): Promise<GeneratedPuzzle> {
    // Validate text has potential for rhymes
    this.validateCustomText(customText);

    try {
      logger.info('Processing custom text through backend analysis', {
        textLength: customText.length,
        wordCount: customText.split(/\s+/).length
      });

      const response = await fetch(`${this.backendUrl}/api/puzzles/rhyme-mahjong`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText: customText,
          difficulty: difficulty.name.toLowerCase(),
          isCustomText: true
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('Backend API error for custom text', { 
          status: response.status, 
          body: errorBody,
          textPreview: customText.substring(0, 100) + '...'
        });
        throw new Error(`Backend analysis failed: ${response.status}`);
      }

      const backendResponse = await response.json();
      const backendPuzzle = backendResponse.puzzle;
      
      // Validate backend response quality
      const processedPuzzle = this.processBackendResponse(backendPuzzle, difficulty);
      
      // If backend didn't produce enough quality groups, supplement with curated words
      if (processedPuzzle.rhymeGroups.length < 12) { // Minimum viable tile count
        logger.warn('Backend produced insufficient rhyme groups, supplementing with curated vocabulary');
        return this.supplementWithCuratedWords(processedPuzzle, difficulty);
      }

      return processedPuzzle;

    } catch (error) {
      logger.error('Custom text analysis failed', { 
        error: error instanceof Error ? error.message : String(error),
        textPreview: customText.substring(0, 100) + '...'
      });
      
      // Fallback: Use curated vocabulary but inform user
      logger.info('Falling back to curated vocabulary for failed custom text');
      const fallbackPuzzle = this.generateFromCuratedVocabulary(difficulty, 'easy');
      
      // Add metadata to indicate fallback was used
      fallbackPuzzle.metadata.fallbackUsed = true;
      fallbackPuzzle.metadata.fallbackReason = 'Custom text analysis failed';
      
      return fallbackPuzzle;
    }
  }

  /**
   * Validate custom text has potential for good rhyme extraction
   */
  private validateCustomText(text: string): void {
    if (!text || text.trim().length < 20) {
      throw new Error('Text must be at least 20 characters long');
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    if (wordCount < 10) {
      throw new Error('Text must contain at least 10 substantial words');
    }

    // Check for reasonable variety in ending sounds
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const endings = new Set(words.map(word => word.slice(-2)));
    
    if (endings.size < 3) {
      logger.warn('Custom text may have limited rhyme potential', {
        wordCount: words.length,
        uniqueEndings: endings.size
      });
    }
  }

  /**
   * Process and improve backend response
   */
  private processBackendResponse(backendPuzzle: any, difficulty: RhymeMahjongDifficulty): GeneratedPuzzle {
    const rhymeGroups: Array<{ word: string; group: string; groups?: string[]; phonetic?: string }> = [];
    
    backendPuzzle.rhymeGroups.forEach((group: any, groupIndex: number) => {
      const groupLetter = String.fromCharCode(65 + groupIndex); // A, B, C, etc.
      
      // Filter out function words and improve word quality
      const filteredWords = this.filterQualityWords(group.words);
      
      filteredWords.forEach((word: string) => {
        rhymeGroups.push({ 
          word: word.toUpperCase(), 
          group: groupLetter,
          groups: [group.pattern || groupLetter.toLowerCase()], // Add pattern info
          phonetic: group.phoneticPattern // Add phonetic info if available
        });
      });
    });

    return {
      rhymeGroups,
      difficulty,
      metadata: {
        totalWords: rhymeGroups.length,
        groupCount: backendPuzzle.rhymeGroups.length,
        patternTypes: backendPuzzle.rhymeGroups.map((g: any) => g.pattern || 'rhyme'),
        complexity: this.determineComplexity(rhymeGroups.length, backendPuzzle.rhymeGroups.length),
        source: 'custom_text'
      }
    };
  }

  /**
   * Filter words to remove function words and improve quality
   */
  private filterQualityWords(words: string[]): string[] {
    const functionWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    return words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      return cleanWord.length >= 3 && 
             !functionWords.has(cleanWord) &&
             /^[a-z]+$/.test(cleanWord); // Only alphabetic characters
    });
  }

  /**
   * Supplement backend response with curated words if needed
   */
  private supplementWithCuratedWords(backendPuzzle: GeneratedPuzzle, difficulty: RhymeMahjongDifficulty): GeneratedPuzzle {
    const needed = 24 - backendPuzzle.rhymeGroups.length; // Target 24 tiles
    
    if (needed <= 0) return backendPuzzle;

    // Add some curated words from easy group
    const easyGroups = this.RHYME_WORD_GROUPS.easy;
    const supplementWords: Array<{ word: string; group: string; groups?: string[]; phonetic?: string }> = [];
    
    for (let i = 0; i < Math.min(needed, 12); i++) {
      const groupIndex = i % easyGroups.length;
      const wordIndex = Math.floor(i / easyGroups.length) % easyGroups[groupIndex].words.length;
      const wordData = easyGroups[groupIndex].words[wordIndex];
      
      supplementWords.push({
        word: wordData.word.toUpperCase(),
        group: easyGroups[groupIndex].group.toUpperCase(),
        groups: wordData.groups,
        phonetic: wordData.phonetic
      });
    }

    const combinedRhymeGroups = [...backendPuzzle.rhymeGroups, ...supplementWords];
    
    return {
      rhymeGroups: this.shuffleArray(combinedRhymeGroups),
      difficulty,
      metadata: {
        ...backendPuzzle.metadata,
        totalWords: combinedRhymeGroups.length,
        supplemented: true,
        supplementedWith: supplementWords.length
      }
    };
  }

  /**
   * Determine optimal group count based on difficulty
   */
  private determineGroupCount(difficultyLevel: string): number {
    switch (difficultyLevel) {
      case 'easy': return 4;    // 4 groups for simpler games
      case 'medium': return 5;  // 5 groups for medium complexity  
      case 'hard': return 6;    // 6 groups for expert players
      default: return 4;
    }
  }

  /**
   * Generate balanced tile distribution across rhyme groups
   */
  private generateBalancedTileDistribution(rhymeGroups: any[]): Array<{ word: string; group: string; groups: string[]; phonetic?: string }> {
    const puzzleRhymeGroups: Array<{ word: string; group: string; groups: string[]; phonetic?: string }> = [];
    
    // Target tiles per group for balanced gameplay
    const tilesPerGroup = 6; // Standard Mahjong pairs (3 sets of 2)
    
    rhymeGroups.forEach(rhymeGroup => {
      // Shuffle words within each group for variety
      const shuffledWords = this.shuffleArray([...rhymeGroup.words]);
      
      // Take the needed number of words, cycling if necessary
      const selectedWords = [];
      for (let i = 0; i < tilesPerGroup; i++) {
        const wordIndex = i % shuffledWords.length;
        selectedWords.push(shuffledWords[wordIndex]);
      }
      
      // Add words to puzzle
      selectedWords.forEach(wordData => {
        puzzleRhymeGroups.push({
          word: wordData.word.toUpperCase(),
          group: rhymeGroup.group.toUpperCase(),
          groups: wordData.groups, // Multiple rhyme groups for layered recognition
          phonetic: wordData.phonetic // Phonetic information for advanced matching
        });
      });
    });

    // Final shuffle to distribute tiles randomly
    return this.shuffleArray(puzzleRhymeGroups);
  }

  /**
   * Generate puzzle using backend API
   */
  private async generateFromBackend(difficulty: RhymeMahjongDifficulty): Promise<GeneratedPuzzle> {
    try {
      const response = await fetch(`${this.backendUrl}/api/puzzles/rhyme-mahjong`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText: difficulty.sourceText,
          difficulty: difficulty.name.toLowerCase()
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('Backend API error', { status: response.status, body: errorBody });
        throw new Error(`Backend API error: ${response.status} - ${errorBody}`);
      }

      const backendResponse = await response.json();
      const backendPuzzle = backendResponse.puzzle;
      
      // Convert backend format to frontend format
      const rhymeGroups: Array<{ word: string; group: string }> = [];
      
      backendPuzzle.rhymeGroups.forEach((group: any, groupIndex: number) => {
        const groupLetter = String.fromCharCode(65 + groupIndex); // A, B, C, etc.
        group.words.forEach((word: string) => {
          rhymeGroups.push({ word: word.toUpperCase(), group: groupLetter });
        });
      });

      return {
        rhymeGroups,
        difficulty,
        metadata: {
          totalWords: rhymeGroups.length,
          groupCount: backendPuzzle.rhymeGroups.length,
          patternTypes: backendPuzzle.rhymeGroups.map((g: any) => g.pattern),
          complexity: this.determineComplexity(rhymeGroups.length, backendPuzzle.rhymeGroups.length)
        }
      };
    } catch (error) {
      logger.error('Backend puzzle generation failed', { error: error instanceof Error ? error.message : String(error) });
      // Re-throw the error to be caught by the UI component
      throw error;
    }
  }

  /**
   * Determine complexity based on word count and group count
   */
  private determineComplexity(wordCount: number, groupCount: number): 'simple' | 'medium' | 'complex' {
    if (wordCount <= 12 && groupCount <= 3) return 'simple';
    if (wordCount <= 24 && groupCount <= 5) return 'medium';
    return 'complex';
  }

  /**
   * Helper to shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  }

  /**
   * Get available difficulty levels
   */
  public getAvailableDifficulties(): string[] {
    return Object.keys(this.DIFFICULTY_CONFIGS);
  }

  /**
   * Get difficulty configuration
   */
  public getDifficultyConfig(level: string): RhymeMahjongDifficulty | null {
    return this.DIFFICULTY_CONFIGS[level] || null;
  }
} 