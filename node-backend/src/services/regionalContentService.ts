import { aiContentGenerationService } from './aiContentGenerationService';
import { observationService } from './observationService';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Regional cultural patterns and progression paths
export interface RegionalProgression {
  region: string;
  countryCode: string;
  nativeLanguage: string;
  culturalHooks: CulturalHook[];
  bridgePatterns: BridgePattern[];
  discoveryPath: DiscoveryMilestone[];
  familiarSounds: string[];
  poeticTraditions: string[];
}

export interface CulturalHook {
  level: number;
  familiarConcept: string;
  nativeExample: string;
  englishBridge: string;
  culturalContext: string;
  engagementType: 'recognition' | 'discovery' | 'bridge' | 'mastery';
}

export interface BridgePattern {
  fromPattern: string;
  toPattern: string;
  similarity: number; // 0-1 how similar the sounds are
  culturalNote: string;
  examples: {
    native: string[];
    english: string[];
    blended: string[];
  };
}

export interface DiscoveryMilestone {
  level: number;
  feature: 'Observatory' | 'Lessons' | 'Community' | 'Advanced_Games';
  unlockReason: string;
  personalizedIntro: string;
  culturalRelevance: string;
}

// Comprehensive regional progressions
export const REGIONAL_PROGRESSIONS: { [key: string]: RegionalProgression } = {
  // Philippines
  'PH': {
    region: 'Philippines',
    countryCode: 'PH',
    nativeLanguage: 'Filipino/Tagalog',
    culturalHooks: [
      {
        level: 1,
        familiarConcept: 'Tugmang Salita (Rhyming Words)',
        nativeExample: 'Tula, sula, gula, kula - traditional Filipino rhyme patterns',
        englishBridge: 'Cool, fool, pool, tool - English rhymes with the same feeling',
        culturalContext: 'Like the tula poetry you learned in school!',
        engagementType: 'recognition'
      },
      {
        level: 3,
        familiarConcept: 'Kundiman Melody Patterns',
        nativeExample: 'Nayon kong minumutya, bituin kong nagniningning',
        englishBridge: 'Traditional melodies meet modern English rap flows',
        culturalContext: 'Your lolo\'s kundiman songs have the same rhythm magic as hip-hop!',
        engagementType: 'discovery'
      },
      {
        level: 5,
        familiarConcept: 'Baybayin Sound Patterns',
        nativeExample: 'ᜊ-ᜌ-ᜈ᜔ (ba-ya-n) - ancient script sounds',
        englishBridge: 'Similar consonant-vowel patterns in English words',
        culturalContext: 'Our ancestors knew about sound patterns before English even existed!',
        engagementType: 'bridge'
      },
      {
        level: 8,
        familiarConcept: 'Code-Switching Mastery',
        nativeExample: 'Ang ganda ng sunset, parang painting sa sky',
        englishBridge: 'Taglish flows naturally - you\'re already a pattern expert!',
        culturalContext: 'You switch languages like a pro - that\'s advanced poetry!',
        engagementType: 'mastery'
      }
    ],
    bridgePatterns: [
      {
        fromPattern: 'Tagalog -an endings',
        toPattern: 'English -tion endings',
        similarity: 0.7,
        culturalNote: 'Both create flowing, musical endings',
        examples: {
          native: ['kain-an', 'tul-an', 'gul-an'],
          english: ['crea-tion', 'na-tion', 'sta-tion'],
          blended: ['Filipino creation', 'Proud of our nation', 'Jeepney station']
        }
      }
    ],
    discoveryPath: [
      {
        level: 6,
        feature: 'Observatory',
        unlockReason: 'Ready for deep pattern analysis',
        personalizedIntro: 'Discover how Tagalog and English patterns connect!',
        culturalRelevance: 'Analyze OPM lyrics, Jose Rizal poems, and modern Filipino rap'
      },
      {
        level: 10,
        feature: 'Lessons',
        unlockReason: 'Master traditional Filipino forms',
        personalizedIntro: 'Learn Tanaga, Awit, and other Filipino poetry forms',
        culturalRelevance: 'From Balagtas to modern spoken word - master your heritage'
      }
    ],
    familiarSounds: ['ng', 'o', 'a', 'i', 'ay', 'oy'],
    poeticTraditions: ['Tula', 'Tanaga', 'Awit', 'Kundiman', 'Spoken Word']
  },

  // Mexico  
  'MX': {
    region: 'Mexico',
    countryCode: 'MX',
    nativeLanguage: 'Spanish',
    culturalHooks: [
      {
        level: 1,
        familiarConcept: 'Rimas Tradicionales',
        nativeExample: 'Amor, dolor, calor, valor - classic Spanish rhymes',
        englishBridge: 'Love, dove, above, shove - English has the same flow!',
        culturalContext: 'Like the coplas your abuela taught you',
        engagementType: 'recognition'
      },
      {
        level: 3,
        familiarConcept: 'Corrido Storytelling',
        nativeExample: 'Voy a cantar un corrido de un hombre muy mentado',
        englishBridge: 'Hip-hop tells stories just like corridos do',
        culturalContext: 'From Pancho Villa ballads to modern rap narratives!',
        engagementType: 'discovery'
      },
      {
        level: 5,
        familiarConcept: 'Son Jarocho Rhythms',
        nativeExample: 'La bamba, la bamba, para bailar la bamba',
        englishBridge: 'These rhythms flow perfectly with English rap beats',
        culturalContext: 'Veracruz rhythms meet modern urban flows',
        engagementType: 'bridge'
      }
    ],
    bridgePatterns: [
      {
        fromPattern: 'Spanish -ción endings',
        toPattern: 'English -tion endings',
        similarity: 0.9,
        culturalNote: 'Almost identical sounds across languages',
        examples: {
          native: ['canción', 'emoción', 'tradición'],
          english: ['creation', 'emotion', 'tradition'],
          blended: ['Mi canción creation', 'Pure emotion', 'Nueva tradition']
        }
      }
    ],
    discoveryPath: [
      {
        level: 6,
        feature: 'Observatory',
        unlockReason: 'Analyze bilingual patterns',
        personalizedIntro: '¡Descubre cómo el español y inglés se conectan!',
        culturalRelevance: 'From Sor Juana to Bad Bunny - analyze it all'
      }
    ],
    familiarSounds: ['rr', 'ñ', 'ch', 'll', 'ción', 'dad'],
    poeticTraditions: ['Copla', 'Romance', 'Corrido', 'Son', 'Rap Español']
  },

  // Japan
  'JP': {
    region: 'Japan',
    countryCode: 'JP',
    nativeLanguage: 'Japanese',
    culturalHooks: [
      {
        level: 1,
        familiarConcept: 'Onomatopoeia Patterns',
        nativeExample: 'Doki doki, pika pika, kira kira - sound patterns you know',
        englishBridge: 'Boom boom, bling bling, click click - English does this too!',
        culturalContext: 'Manga sound effects are poetry in disguise!',
        engagementType: 'recognition'
      },
      {
        level: 3,
        familiarConcept: 'Haiku Syllable Counting',
        nativeExample: 'Sa-ku-ra no / ha-na chi-ru ko-ro wa / ko-ko-ro ka-na',
        englishBridge: 'English haiku: Cher-ry blos-soms fall / An-cient wis-dom speaks through time / Spring re-turns a-gain',
        culturalContext: 'Your haiku skills work perfectly in English!',
        engagementType: 'bridge'
      },
      {
        level: 5,
        familiarConcept: 'Rap with Japanese Flow',
        nativeExample: 'Japanese rap artists like KOHH blend cultures seamlessly',
        englishBridge: 'Tokyo meets Brooklyn - same rhythm, different language',
        culturalContext: 'Hip-hop is universal - from Shibuya to Harlem',
        engagementType: 'discovery'
      }
    ],
    bridgePatterns: [
      {
        fromPattern: 'Japanese mora timing',
        toPattern: 'English syllable timing',
        similarity: 0.6,
        culturalNote: 'Both languages have natural rhythm, just different counting',
        examples: {
          native: ['sa-ku-ra', 'a-ri-ga-to', 'o-ha-yo'],
          english: ['beau-ti-ful', 'thank-you-much', 'good-morn-ing'],
          blended: ['Sakura beautiful', 'Arigato thank you', 'Ohayo good morning']
        }
      }
    ],
    discoveryPath: [
      {
        level: 6,
        feature: 'Observatory',
        unlockReason: 'Master cross-cultural analysis',
        personalizedIntro: '日本語と英語のパターンを発見しよう！',
        culturalRelevance: 'From Basho to modern J-rap - analyze the evolution'
      }
    ],
    familiarSounds: ['wa', 'wo', 'ga', 'tsu', 'kya', 'ryu'],
    poeticTraditions: ['Haiku', 'Tanka', 'Renga', 'J-Rap', 'Spoken Word']
  },

  // India
  'IN': {
    region: 'India',
    countryCode: 'IN',
    nativeLanguage: 'Hindi/Multiple',
    culturalHooks: [
      {
        level: 1,
        familiarConcept: 'Sanskrit Syllable Patterns',
        nativeExample: 'Man-tra rhythms: Om na-ma shi-va-ya',
        englishBridge: 'English mantras: I am strong and free',
        culturalContext: 'Ancient chanting wisdom meets modern affirmations!',
        engagementType: 'recognition'
      },
      {
        level: 3,
        familiarConcept: 'Bollywood Song Structures',
        nativeExample: 'Verse-chorus-verse patterns in Hindi film songs',
        englishBridge: 'Same structure in English pop and hip-hop',
        culturalContext: 'From Kishore Kumar to Drake - universal song patterns!',
        engagementType: 'discovery'
      },
      {
        level: 5,
        familiarConcept: 'Classical Raga Patterns',
        nativeExample: 'Sa Re Ga Ma Pa Dha Ni - musical note patterns',
        englishBridge: 'Do Re Mi Fa Sol La Ti - Western scales work similarly',
        culturalContext: 'Raga knowledge gives you a musical advantage in any language!',
        engagementType: 'bridge'
      }
    ],
    bridgePatterns: [
      {
        fromPattern: 'Hindi repeated consonants',
        toPattern: 'English alliteration',
        similarity: 0.8,
        culturalNote: 'Both languages love sound repetition for emphasis',
        examples: {
          native: ['dal-dal', 'chup-chap', 'dil-dil'],
          english: ['big-bang', 'tick-tock', 'hip-hop'],
          blended: ['Dil beats like hip-hop', 'Chup-chap quiet contemplation']
        }
      }
    ],
    discoveryPath: [
      {
        level: 6,
        feature: 'Observatory',
        unlockReason: 'Analyze multilingual patterns',
        personalizedIntro: 'भारतीय और अंग्रेजी पैटर्न की खोज करें!',
        culturalRelevance: 'From Mirza Ghalib to DIVINE - trace the poetic evolution'
      }
    ],
    familiarSounds: ['bh', 'dh', 'gh', 'kh', 'th', 'retroflex'],
    poeticTraditions: ['Ghazal', 'Doha', 'Bhajan', 'Qawwali', 'Desi Hip-Hop']
  },

  // Default/International
  'GLOBAL': {
    region: 'International',
    countryCode: 'GLOBAL',
    nativeLanguage: 'English',
    culturalHooks: [
      {
        level: 1,
        familiarConcept: 'Basic English Rhymes',
        nativeExample: 'Cat, hat, bat, sat - nursery rhyme patterns',
        englishBridge: 'These become complex hip-hop flows',
        culturalContext: 'From Mother Goose to Grammy winners!',
        engagementType: 'recognition'
      }
    ],
    bridgePatterns: [],
    discoveryPath: [
      {
        level: 5,
        feature: 'Observatory',
        unlockReason: 'Ready for sophisticated analysis',
        personalizedIntro: 'Discover the deep patterns in English poetry and hip-hop',
        culturalRelevance: 'From Shakespeare to Kendrick Lamar'
      }
    ],
    familiarSounds: ['th', 'w', 'r', 'ing', 'tion', 'ed'],
    poeticTraditions: ['Sonnet', 'Ballad', 'Free Verse', 'Hip-Hop', 'Spoken Word']
  }
};

class RegionalContentService {
  private static instance: RegionalContentService;

  public static getInstance(): RegionalContentService {
    if (!RegionalContentService.instance) {
      RegionalContentService.instance = new RegionalContentService();
    }
    return RegionalContentService.instance;
  }

  /**
   * Detect user's region and set up personalized progression
   */
  public async initializeUserRegion(
    userId: string, 
    detectedRegion?: string, 
    userSelectedRegion?: string
  ): Promise<RegionalProgression> {
    try {
      const region = userSelectedRegion || detectedRegion || 'GLOBAL';
      const progression = REGIONAL_PROGRESSIONS[region] || REGIONAL_PROGRESSIONS['GLOBAL'];

      // Save user's regional preference
      await db.collection('user_profiles').doc(userId).set({
        regionalProgression: region,
        culturalHooks: progression.culturalHooks,
        discoveryMilestones: progression.discoveryPath,
        setupAt: Timestamp.now()
      }, { merge: true });

      logger.info('User regional progression initialized', { 
        userId, 
        region, 
        nativeLanguage: progression.nativeLanguage 
      });

      return progression;
    } catch (error) {
      logger.error('Failed to initialize user region', { userId, error });
      return REGIONAL_PROGRESSIONS['GLOBAL'];
    }
  }

  /**
   * Generate culturally personalized daily content
   */
  public async generateRegionalDailyContent(
    userId: string,
    userLevel: number,
    isPremium: boolean = false
  ): Promise<any> {
    try {
      // Get user's regional progression
      const userProfile = await db.collection('user_profiles').doc(userId).get();
      const regionCode = userProfile.data()?.regionalProgression || 'GLOBAL';
      const progression = REGIONAL_PROGRESSIONS[regionCode];

      // Find appropriate cultural hook for user's level
      const relevantHook = progression.culturalHooks
        .filter(hook => hook.level <= userLevel)
        .pop(); // Get the highest level hook they qualify for

      if (!relevantHook) {
        // Fall back to standard AI content
        return await aiContentGenerationService.getUserDailyContent(userId, userLevel);
      }

      // Generate culturally contextualized content
      const culturalText = this.createCulturallyContextualizedText(relevantHook, progression);
      
      // Use Observatory to analyze the cultural text
      const analysisResult = await observationService.observeText(
        culturalText,
        userId,
        'en',
        { focusMode: 'comprehensive' }
      );

      // Create culturally personalized bundle
      const bundle = {
        id: `regional_${regionCode}_${userId}_${Date.now()}`,
        level: userLevel,
        patternType: this.mapEngagementToPatternType(relevantHook.engagementType),
        difficulty: this.calculateCulturalDifficulty(userLevel, relevantHook),
        sourceText: culturalText,
        analysisResult,
        extractedPatterns: this.extractCulturalPatterns(analysisResult, progression),
        gameVariants: this.generateCulturalGameVariants(relevantHook, userLevel),
        culturalContext: `${progression.region} - ${relevantHook.culturalContext}`,
        language: 'en',
        generatedAt: new Date(),
        usageCount: 0,
        isPremium,
        bundleType: 'daily' as const,
        regionalHook: relevantHook,
        nativeLanguage: progression.nativeLanguage
      };

      // Save regional bundle
      await this.saveRegionalBundle(bundle, userId);

      logger.info('Regional daily content generated', { 
        userId, 
        region: progression.region,
        hookLevel: relevantHook.level,
        engagementType: relevantHook.engagementType
      });

      return bundle;

    } catch (error) {
      logger.error('Failed to generate regional daily content', { userId, error });
      // Fall back to standard content
      return await aiContentGenerationService.getUserDailyContent(userId, userLevel);
    }
  }

  /**
   * Check if user should discover new features based on regional progression
   */
  public async checkDiscoveryMilestones(userId: string, userLevel: number): Promise<DiscoveryMilestone[]> {
    try {
      const userProfile = await db.collection('user_profiles').doc(userId).get();
      const regionCode = userProfile.data()?.regionalProgression || 'GLOBAL';
      const progression = REGIONAL_PROGRESSIONS[regionCode];

      // Find unlockable milestones
      const unlockedMilestones = progression.discoveryPath.filter(
        milestone => milestone.level <= userLevel
      );

      // Check which ones are new for the user
      const completedMilestones = userProfile.data()?.completedMilestones || [];
      const newMilestones = unlockedMilestones.filter(
        milestone => !completedMilestones.includes(milestone.feature)
      );

      if (newMilestones.length > 0) {
        // Mark milestones as seen
        await db.collection('user_profiles').doc(userId).update({
          completedMilestones: [...completedMilestones, ...newMilestones.map(m => m.feature)]
        });
      }

      return newMilestones;
    } catch (error) {
      logger.error('Failed to check discovery milestones', { userId, error });
      return [];
    }
  }

  /**
   * Get cultural bridge suggestions for user
   */
  public getCulturalBridges(regionCode: string, userLevel: number): BridgePattern[] {
    const progression = REGIONAL_PROGRESSIONS[regionCode] || REGIONAL_PROGRESSIONS['GLOBAL'];
    return progression.bridgePatterns.filter(bridge => 
      // Show more complex bridges as user levels up
      bridge.similarity >= (0.5 + (userLevel * 0.02))
    );
  }

  // Helper methods
  private createCulturallyContextualizedText(hook: CulturalHook, progression: RegionalProgression): string {
    // Combine native example with English bridge for Observatory analysis
    return `${hook.nativeExample}\n\n${hook.englishBridge}\n\nCultural Note: ${hook.culturalContext}`;
  }

  private mapEngagementToPatternType(engagementType: string): 'rhyme' | 'alliteration' | 'consonance' | 'internal_rhyme' | 'multicultural' {
    const mapping = {
      'recognition': 'rhyme' as const,
      'discovery': 'alliteration' as const,
      'bridge': 'multicultural' as const,
      'mastery': 'internal_rhyme' as const
    };
    return mapping[engagementType as keyof typeof mapping] || 'rhyme';
  }

  private calculateCulturalDifficulty(userLevel: number, hook: CulturalHook): number {
    const baseDifficulty = Math.min(10, Math.floor(userLevel / 2) + 1);
    const hookMultiplier = {
      'recognition': 0.8,
      'discovery': 1.0,
      'bridge': 1.3,
      'mastery': 1.6
    }[hook.engagementType];
    
    return Math.min(10, Math.floor(baseDifficulty * hookMultiplier));
  }

  private extractCulturalPatterns(analysisResult: any, progression: RegionalProgression): any[] {
    // Add cultural sound awareness to extracted patterns
    if (!analysisResult.patterns) return [];

    return analysisResult.patterns.map((pattern: any) => ({
      ...pattern,
      culturalOrigin: progression.region,
      familiarSounds: progression.familiarSounds.filter(sound => 
        pattern.word?.includes(sound) || pattern.text?.includes(sound)
      ),
      poeticTradition: progression.poeticTraditions[0] // Primary tradition
    }));
  }

  private generateCulturalGameVariants(hook: CulturalHook, userLevel: number): any[] {
    const gridSize = userLevel < 5 ? '4x4' : '8x8';
    
    return [{
      gridSize,
      targetWords: this.extractWordsFromExample(hook.nativeExample, hook.englishBridge),
      decoyWords: this.generateCulturalDecoys(hook, gridSize),
      timeLimit: 90, // Slightly more time for cultural learning
      strikes: 4, // Extra strike for cultural patterns
      bonusPoints: hook.level * 15 // Higher rewards for cultural engagement
    }];
  }

  private extractWordsFromExample(nativeExample: string, englishBridge: string): string[] {
    // Extract key words from both examples
    const nativeWords = nativeExample.split(/[\s,.-]+/).filter(w => w.length > 2);
    const englishWords = englishBridge.split(/[\s,.-]+/).filter(w => w.length > 2);
    
    return [...nativeWords, ...englishWords].slice(0, 6);
  }

  private generateCulturalDecoys(hook: CulturalHook, gridSize: '4x4' | '8x8'): string[] {
    const decoyCount = gridSize === '4x4' ? 10 : 50;
    const culturalDecoys = [
      'rhythm', 'pattern', 'sound', 'music', 'flow', 'beat',
      'culture', 'tradition', 'heritage', 'language', 'poetry', 'song'
    ];
    
    return culturalDecoys.slice(0, decoyCount);
  }

  private async saveRegionalBundle(bundle: any, userId: string): Promise<void> {
    try {
      await db.collection('regional_content_bundles').add({
        ...bundle,
        userId,
        generatedAt: Timestamp.fromDate(bundle.generatedAt)
      });
    } catch (error) {
      logger.error('Failed to save regional bundle', { userId, error });
    }
  }

  /**
   * Get available regions for user selection
   */
  public getAvailableRegions(): Array<{ code: string; name: string; language: string; preview: string }> {
    return Object.entries(REGIONAL_PROGRESSIONS).map(([code, progression]) => ({
      code,
      name: progression.region,
      language: progression.nativeLanguage,
      preview: progression.culturalHooks[0]?.familiarConcept || 'Global patterns'
    }));
  }

  /**
   * Generate regional onboarding sequence
   */
  public async generateOnboardingSequence(
    userId: string,
    regionCode: string
  ): Promise<Array<{ step: number; content: any; unlocks: string }>> {
    const progression = REGIONAL_PROGRESSIONS[regionCode] || REGIONAL_PROGRESSIONS['GLOBAL'];
    
    return progression.culturalHooks.slice(0, 3).map((hook, index) => ({
      step: index + 1,
      content: {
        title: hook.familiarConcept,
        nativeExample: hook.nativeExample,
        englishBridge: hook.englishBridge,
        culturalContext: hook.culturalContext,
        interactiveDemo: this.generateInteractiveDemo(hook)
      },
      unlocks: index === 2 ? 'Full game access + Observatory preview!' : `Step ${index + 2} unlocked`
    }));
  }

  private generateInteractiveDemo(hook: CulturalHook): any {
    return {
      type: 'pattern_matching',
      instruction: `Try matching these ${hook.familiarConcept} patterns!`,
      examples: hook.nativeExample.split(',').map(ex => ex.trim()),
      userTask: 'Find the connecting sound pattern',
      reward: 'Cultural Pattern Master +10 XP'
    };
  }
}

export const regionalContentService = RegionalContentService.getInstance(); 