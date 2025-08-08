import { db } from '../config/firebase';
import { observationService } from './observationService';
import { logger } from '../utils/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Content progression levels from basic hip hop to sophisticated multicultural
export interface ContentLevel {
  level: number;
  name: string;
  description: string;
  patternTypes: string[];
  culturalFocus: string[];
  sampleTexts: string[];
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface GeneratedContentBundle {
  id: string;
  level: number;
  patternType: 'rhyme' | 'alliteration' | 'consonance' | 'internal_rhyme' | 'multicultural';
  difficulty: number; // 1-10 scale
  sourceText: string;
  analysisResult: any; // Observatory analysis
  extractedPatterns: ContentPattern[];
  gameVariants: GameVariant[];
  culturalContext?: string;
  language: string;
  generatedAt: Date;
  usageCount: number;
  isPremium: boolean;
  bundleType: 'daily' | 'weekly' | 'premium_pack' | 'cultural_series';
}

export interface ContentPattern {
  words: string[];
  patternType: string;
  difficulty: number;
  culturalOrigin?: string;
  examples: string[];
  phonetic: string[];
  rhythm: string;
  phoneticDetails?: {
    endRhyme: string;
    syllableCount: number;
  };
  semanticDetails?: {
    theme: string;
    register: string;
  };
}

export interface GameVariant {
  gridSize: '4x4' | '8x8';
  targetWords: string[];
  decoyWords: string[];
  timeLimit: number;
  strikes: number;
  bonusPoints: number;
}

// Progressive content levels
export const CONTENT_PROGRESSION: ContentLevel[] = [
  // Hip Hop Foundation (Levels 1-10)
  {
    level: 1,
    name: "Street Basics",
    description: "Foundation hip hop patterns - simple end rhymes",
    patternTypes: ['simple_rhyme'],
    culturalFocus: ['hip_hop'],
    sampleTexts: [
      "Mic check, one two, let me speak my truth, From the streets to the booth, representing youth",
      "Flow tight, bars right, spitting all night, Freestyle bright, bringing heat and light",
      "Rhythm and rhyme, keeping perfect time, Every single line designed to make you shine"
    ],
    complexity: 'basic'
  },
  {
    level: 3,
    name: "Flow State",
    description: "Multi-syllabic rhymes and internal patterns",
    patternTypes: ['multi_rhyme', 'internal_rhyme'],
    culturalFocus: ['hip_hop'],
    sampleTexts: [
      "Systematic, automatic, flow so dramatic, Mathematical patterns that are quite emphatic",
      "Incredible, unforgettable, flow so tremendous, Lyrical and mystical, naturally stupendous",
      "Phenomenal abdominal, astronomical economical, Anatomical miracle, flow so comical"
    ],
    complexity: 'basic'
  },
  {
    level: 5,
    name: "Cipher Skills",
    description: "Complex alliteration and consonance patterns",
    patternTypes: ['alliteration', 'consonance'],
    culturalFocus: ['hip_hop'],
    sampleTexts: [
      "Spitting spectacular syllables, sophisticated and spiritual, Specialized spectacular, spontaneous and lyrical",
      "Breaking barriers boldly, bringing beats that bounce, Brilliant bars blazing, every word that counts",
      "Crushing crystalline crescendos, creative concepts flow, Crafted with precision, letting everyone know"
    ],
    complexity: 'intermediate'
  },
  
  // Cross-Cultural Bridge (Levels 8-15)
  {
    level: 8,
    name: "Cultural Bridge",
    description: "Code-switching and multilingual patterns",
    patternTypes: ['code_switch', 'multilingual'],
    culturalFocus: ['hip_hop', 'spanish', 'japanese'],
    sampleTexts: [
      "Mi corazón beats with the rhythm of the street, Amor and love flowing in every heartbeat",
      "Switching languages like I switch the flow, From English to español, letting everyone know",
      "Sakura petals fall like bars from my soul, 美しい beautiful, making music whole"
    ],
    complexity: 'intermediate'
  },
  
  // Classical Integration (Levels 12-20)
  {
    level: 12,
    name: "Poetic Fusion",
    description: "Hip hop meets classical poetry forms",
    patternTypes: ['iambic', 'sonnet_rhyme', 'classical_alliteration'],
    culturalFocus: ['hip_hop', 'classical', 'shakespearean'],
    sampleTexts: [
      "Shall I compare thee to a summer's day? Your flow's more lovely and more temperate",
      "In fair Verona where we lay our scene, From ancient grudge break to new mutiny",
      "When in eternal lines to time thou grow'st, So long as men can breathe or eyes can see"
    ],
    complexity: 'advanced'
  },
  
  // World Poetry (Levels 18-25)
  {
    level: 18,
    name: "Global Rhythms",
    description: "Traditional forms from world cultures",
    patternTypes: ['haiku', 'ghazal', 'qawwali', 'arabic_maqam'],
    culturalFocus: ['japanese', 'arabic', 'persian', 'urdu'],
    sampleTexts: [
      "Cherry blossoms fall / Ancient wisdom speaks through time / Spring returns again",
      "قافلہ گزر گیا اور دھوال اٹھ رہا ہے / The caravan passes and dust is rising",
      "هذا الجمال يفوق كل وصف ممكن / This beauty surpasses all possible description"
    ],
    complexity: 'advanced'
  },
  
  // Master Level (Levels 22+)
  {
    level: 25,
    name: "Pattern Master",
    description: "Advanced multicultural fusion patterns",
    patternTypes: ['fusion', 'experimental', 'contemporary'],
    culturalFocus: ['global_fusion'],
    sampleTexts: [
      "Synthesizing civilizations through syllables and sound, From Tokyo to Timbuktu, beauty can be found",
      "Ancient Arabic flows with modern hip hop beats, As traditional Japanese haiku and trap music meets",
      "Ghazal meets gospel, qawwali meets jazz, Poetry transcending borders, that's what art class has"
    ],
    complexity: 'expert'
  }
];

class AIContentGenerationService {
  private static instance: AIContentGenerationService;
  private contentCache: Map<string, GeneratedContentBundle> = new Map();
  
  public static getInstance(): AIContentGenerationService {
    if (!AIContentGenerationService.instance) {
      AIContentGenerationService.instance = new AIContentGenerationService();
    }
    return AIContentGenerationService.instance;
  }

  /**
   * Generate daily content bundle based on user's current level
   */
  public async generateDailyContent(
    userId: string, 
    userLevel: number, 
    isPremium: boolean = false
  ): Promise<GeneratedContentBundle> {
    try {
      logger.info('Generating daily content', { userId, userLevel, isPremium });

      // Find appropriate content level for user
      const contentLevel = this.getContentLevelForUser(userLevel);
      
      // Select random sample text from the level
      const sampleText = this.selectSampleText(contentLevel);
      
      // Generate Observatory analysis
      const analysisResult = await observationService.observeText(
        sampleText,
        userId,
        'en',
        { focusMode: 'comprehensive' }
      );

      // Extract patterns from analysis
      const extractedPatterns = this.extractGamePatterns(analysisResult);
      
      // Generate game variants
      const gameVariants = this.generateGameVariants(extractedPatterns, userLevel);
      
      // Create content bundle
      const bundle: GeneratedContentBundle = {
        id: `daily_${userId}_${Date.now()}`,
        level: userLevel,
        patternType: this.selectPatternType(contentLevel),
        difficulty: this.calculateDifficulty(userLevel, contentLevel),
        sourceText: sampleText,
        analysisResult,
        extractedPatterns,
        gameVariants,
        culturalContext: contentLevel.culturalFocus.join(', '),
        language: 'en',
        generatedAt: new Date(),
        usageCount: 0,
        isPremium,
        bundleType: 'daily'
      };

      // Save to Firebase
      await this.saveBundleToFirebase(bundle);
      
      // Cache for quick access
      this.contentCache.set(bundle.id, bundle);
      
      logger.info('Daily content generated successfully', { 
        bundleId: bundle.id, 
        patternCount: extractedPatterns.length 
      });

      return bundle;

    } catch (error) {
      logger.error('Failed to generate daily content', { 
        userId, 
        userLevel, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Generate weekly premium pack
   */
  public async generateWeeklyPack(
    weekStart: Date,
    theme: string = 'progressive'
  ): Promise<GeneratedContentBundle[]> {
    try {
      logger.info('Generating weekly pack', { weekStart, theme });

      const bundles: GeneratedContentBundle[] = [];
      
      // Generate 7 progressive challenges for the week
      for (let day = 0; day < 7; day++) {
        const levelForDay = Math.min(25, 5 + day * 3); // Progressive difficulty
        const contentLevel = this.getContentLevelForUser(levelForDay);
        const sampleText = this.selectSampleText(contentLevel);
        
        const analysisResult = await observationService.observeText(
          sampleText,
          'system',
          'en',
          { focusMode: 'comprehensive' }
        );

        const extractedPatterns = this.extractGamePatterns(analysisResult);
        const gameVariants = this.generateGameVariants(extractedPatterns, levelForDay);
        
        const bundle: GeneratedContentBundle = {
          id: `weekly_${weekStart.getTime()}_day${day + 1}`,
          level: levelForDay,
          patternType: this.selectPatternType(contentLevel),
          difficulty: this.calculateDifficulty(levelForDay, contentLevel),
          sourceText: sampleText,
          analysisResult,
          extractedPatterns,
          gameVariants,
          culturalContext: contentLevel.culturalFocus.join(', '),
          language: 'en',
          generatedAt: new Date(),
          usageCount: 0,
          isPremium: true,
          bundleType: 'weekly'
        };

        await this.saveBundleToFirebase(bundle);
        bundles.push(bundle);
      }

      logger.info('Weekly pack generated', { bundleCount: bundles.length });
      return bundles;

    } catch (error) {
      logger.error('Failed to generate weekly pack', { error });
      throw error;
    }
  }

  /**
   * Generate cultural series pack (e.g., "Arabic Poetry", "Japanese Haiku", "Spanish Rap")
   */
  public async generateCulturalSeries(
    culture: string,
    difficulty: number = 5
  ): Promise<GeneratedContentBundle[]> {
    try {
      logger.info('Generating cultural series', { culture, difficulty });

      const culturalTexts = this.getCulturalTexts(culture);
      const bundles: GeneratedContentBundle[] = [];

      for (const text of culturalTexts) {
        const analysisResult = await observationService.observeText(
          text,
          'system',
          'en',
          { focusMode: 'comprehensive' }
        );

        const extractedPatterns = this.extractGamePatterns(analysisResult);
        const gameVariants = this.generateGameVariants(extractedPatterns, difficulty);
        
        const bundle: GeneratedContentBundle = {
          id: `cultural_${culture}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          level: difficulty,
          patternType: 'multicultural',
          difficulty,
          sourceText: text,
          analysisResult,
          extractedPatterns,
          gameVariants,
          culturalContext: culture,
          language: 'en',
          generatedAt: new Date(),
          usageCount: 0,
          isPremium: true,
          bundleType: 'cultural_series'
        };

        await this.saveBundleToFirebase(bundle);
        bundles.push(bundle);
      }

      logger.info('Cultural series generated', { culture, bundleCount: bundles.length });
      return bundles;

    } catch (error) {
      logger.error('Failed to generate cultural series', { culture, error });
      throw error;
    }
  }

  /**
   * Get user's daily content bundle
   */
  public async getUserDailyContent(userId: string, userLevel: number): Promise<GeneratedContentBundle | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if user has today's content
      const existingBundle = await db.collection('content_bundles')
        .where('bundleType', '==', 'daily')
        .where('userId', '==', userId)
        .where('generatedAt', '>=', Timestamp.fromDate(today))
        .limit(1)
        .get();

      if (!existingBundle.empty) {
        const bundleData = existingBundle.docs[0].data() as Omit<GeneratedContentBundle, 'id'>;
        return { id: existingBundle.docs[0].id, ...bundleData };
      }

      // Generate new daily content
      return await this.generateDailyContent(userId, userLevel);

    } catch (error) {
      logger.error('Failed to get user daily content', { userId, error });
      return null;
    }
  }

  // Helper Methods
  private getContentLevelForUser(userLevel: number): ContentLevel {
    // Find the highest content level user qualifies for
    const qualifiedLevels = CONTENT_PROGRESSION.filter(level => level.level <= userLevel);
    return qualifiedLevels[qualifiedLevels.length - 1] || CONTENT_PROGRESSION[0];
  }

  private selectSampleText(contentLevel: ContentLevel): string {
    const randomIndex = Math.floor(Math.random() * contentLevel.sampleTexts.length);
    return contentLevel.sampleTexts[randomIndex];
  }

  private selectPatternType(contentLevel: ContentLevel): 'rhyme' | 'alliteration' | 'consonance' | 'internal_rhyme' | 'multicultural' {
    const types = contentLevel.patternTypes;
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Map to our bundle pattern types
    if (randomType.includes('rhyme')) return 'rhyme';
    if (randomType.includes('alliteration')) return 'alliteration';
    if (randomType.includes('consonance')) return 'consonance';
    if (randomType.includes('internal')) return 'internal_rhyme';
    return 'multicultural';
  }

  private calculateDifficulty(userLevel: number, contentLevel: ContentLevel): number {
    const baseDifficulty = Math.min(10, Math.floor(userLevel / 3) + 1);
    const complexityMultiplier = {
      basic: 1,
      intermediate: 1.3,
      advanced: 1.6,
      expert: 2
    }[contentLevel.complexity];
    
    return Math.min(10, Math.floor(baseDifficulty * complexityMultiplier));
  }

  private extractGamePatterns(analysisResult: any): ContentPattern[] {
    const patterns: ContentPattern[] = [];
    
    if (!analysisResult.patterns || analysisResult.patterns.length === 0) {
      console.warn('No patterns found in analysis result');
      return patterns;
    }
    
    // Group patterns by actual phonetic properties, not just type
    const rhymeGroups = new Map<string, any[]>();
    const alliterationGroups = new Map<string, any[]>();
    const semanticGroups = new Map<string, any[]>();
    
    // First pass: organize patterns by their actual sound/meaning
    analysisResult.patterns.forEach((pattern: any) => {
      const word = pattern.word || pattern.text;
      if (!word) return;
      
      // Extract phonetic information
      if (pattern.type === 'rhyme' || pattern.type === 'end_rhyme') {
        // Extract the actual rhyme ending
        const rhymeKey = this.extractRhymeEnding(word, pattern.phonetic);
        if (!rhymeGroups.has(rhymeKey)) {
          rhymeGroups.set(rhymeKey, []);
        }
        rhymeGroups.get(rhymeKey)!.push({ word, pattern });
      } else if (pattern.type === 'alliteration') {
        // Group by first letter/sound
        const firstSound = word[0].toUpperCase();
        if (!alliterationGroups.has(firstSound)) {
          alliterationGroups.set(firstSound, []);
        }
        alliterationGroups.get(firstSound)!.push({ word, pattern });
      }
      
      // Extract semantic themes if present
      if (pattern.semanticField || pattern.theme) {
        const theme = pattern.semanticField || pattern.theme;
        if (!semanticGroups.has(theme)) {
          semanticGroups.set(theme, []);
        }
        semanticGroups.get(theme)!.push({ word, pattern });
      }
    });
    
    // Convert groups to game patterns - Phase 1: Phonetic patterns
    rhymeGroups.forEach((items, rhymeEnding) => {
      if (items.length >= 3) {
        const words = items.map(item => item.word);
        patterns.push({
          words: words.slice(0, 7), // Max 7 for game balance
          patternType: 'rhyme',
          difficulty: this.calculatePatternDifficulty(words),
          examples: [`Words ending in "${rhymeEnding}"`],
          phonetic: items.map(item => item.pattern.phonetic || '').filter(Boolean),
          rhythm: this.determineRhythm(words),
          // Add phonetic sub-pattern data
          phoneticDetails: {
            endRhyme: rhymeEnding,
            syllableCount: this.getAverageSyllableCount(words)
          }
        } as any);
      }
    });
    
    alliterationGroups.forEach((items, startSound) => {
      if (items.length >= 3) {
        const words = items.map(item => item.word);
        patterns.push({
          words: words.slice(0, 7),
          patternType: 'alliteration',
          difficulty: this.calculatePatternDifficulty(words),
          examples: [`Words starting with "${startSound}"`],
          phonetic: items.map(item => item.pattern.phonetic || '').filter(Boolean),
          rhythm: this.determineRhythm(words),
          // Add phonetic sub-pattern data
          phoneticDetails: {
            alliteration: startSound
          }
        } as any);
      }
    });
    
    // Phase 2: Semantic patterns
    semanticGroups.forEach((items, theme) => {
      if (items.length >= 3) {
        const words = items.map(item => item.word);
        patterns.push({
          words: words.slice(0, 7),
          patternType: 'semantic',
          difficulty: this.calculatePatternDifficulty(words) + 1, // Semantic patterns are harder
          examples: [`Theme: ${theme}`],
          phonetic: items.map(item => item.pattern.phonetic || '').filter(Boolean),
          rhythm: this.determineRhythm(words),
          // Add semantic data
          semanticDetails: {
            theme: theme,
            register: this.detectRegister(words)
          }
        } as any);
      }
    });
    
    // If we found very few patterns, generate some basic ones
    if (patterns.length < 3) {
      console.log('Generating fallback patterns');
      patterns.push(...this.generateFallbackPatterns(analysisResult));
    }
    
    return patterns;
  }
  
  // Helper to extract rhyme ending
  private extractRhymeEnding(word: string, phonetic?: string): string {
    // If we have phonetic info, use it (more accurate)
    if (phonetic) {
      // Look for the last vowel sound and everything after it
      const match = phonetic.match(/[aeiouɑɛɪɔʊæʌə][^aeiouɑɛɪɔʊæʌə]*$/i);
      return match ? match[0] : word.slice(-2).toLowerCase();
    }
    
    // Otherwise use simple ending extraction
    // Find last vowel and everything after it
    const match = word.match(/[aeiou][^aeiou]*$/i);
    return match ? match[0].toLowerCase() : word.slice(-2).toLowerCase();
  }
  
  // Helper to get average syllable count
  private getAverageSyllableCount(words: string[]): number {
    const counts = words.map(word => this.countSyllables(word));
    return Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
  }
  
  // Simple syllable counter
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiou'.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }
  
  // Detect register (formal, colloquial, etc)
  private detectRegister(words: string[]): string {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const hasLatinEndings = words.some(w => w.endsWith('tion') || w.endsWith('ment') || w.endsWith('ity'));
    
    if (avgLength > 8 || hasLatinEndings) return 'formal';
    if (avgLength < 4) return 'colloquial';
    return 'neutral';
  }
  
  // Generate fallback patterns if analysis fails
  private generateFallbackPatterns(analysisResult: any): ContentPattern[] {
    const fallbackPatterns: ContentPattern[] = [];
    const text = analysisResult.text || '';
    const words = text.split(/\s+/).filter((w: string) => w.length > 2);
    
    if (words.length >= 6) {
      // Try to find simple rhymes
      const rhymeMap = new Map<string, string[]>();
      words.forEach((word: string) => {
        const ending = word.slice(-2).toLowerCase();
        if (!rhymeMap.has(ending)) {
          rhymeMap.set(ending, []);
        }
        rhymeMap.get(ending)!.push(word);
      });
      
      // Convert to patterns
      rhymeMap.forEach((rhymeWords, ending) => {
        if (rhymeWords.length >= 3) {
          fallbackPatterns.push({
            words: rhymeWords.slice(0, 5),
            patternType: 'rhyme',
            difficulty: 3,
            examples: [`Simple rhyme: -${ending}`],
            phonetic: [],
            rhythm: 'simple'
          });
        }
      });
    }
    
    return fallbackPatterns;
  }

  private determineRhythm(words: string[]): string {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgLength < 4) return 'staccato';
    if (avgLength < 7) return 'flowing';
    return 'cascading';
  }

  private calculatePatternDifficulty(words: string[]): number {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const syllableComplexity = words.some(word => word.length > 7) ? 2 : 1;
    return Math.min(10, Math.floor(avgLength / 2) + syllableComplexity);
  }

  private generateGameVariants(patterns: ContentPattern[], userLevel: number): GameVariant[] {
    const variants: GameVariant[] = [];
    
    patterns.forEach(pattern => {
      const gridSize = userLevel < 5 ? '4x4' : '8x8';
      const targetWords = pattern.words.slice(0, gridSize === '4x4' ? 4 : 6);
      const decoyWords = this.generateDecoyWords(pattern, gridSize);
      
      variants.push({
        gridSize,
        targetWords,
        decoyWords,
        timeLimit: this.calculateTimeLimit(pattern.difficulty, gridSize),
        strikes: gridSize === '4x4' ? 3 : 4,
        bonusPoints: pattern.difficulty * 10
      });
    });

    return variants;
  }

  private generateDecoyWords(pattern: ContentPattern, gridSize: '4x4' | '8x8'): string[] {
    const decoyCount = gridSize === '4x4' ? 12 : 58; // Fill remaining grid
    const decoys: string[] = [];
    
    // Generate thematic decoys that are close but not exact matches
    for (let i = 0; i < decoyCount; i++) {
      decoys.push(this.generateSingleDecoy(pattern));
    }
    
    return decoys;
  }

  private generateSingleDecoy(pattern: ContentPattern): string {
    // Logic to generate decoy words that are similar but don't match the pattern
    const baseWords = ['flow', 'beat', 'word', 'sound', 'rhythm', 'voice', 'style', 'time'];
    return baseWords[Math.floor(Math.random() * baseWords.length)];
  }

  private calculateTimeLimit(difficulty: number, gridSize: '4x4' | '8x8'): number {
    const baseTime = gridSize === '4x4' ? 60 : 120; // Base seconds
    const difficultyMultiplier = 1 + (difficulty * 0.1);
    return Math.floor(baseTime * difficultyMultiplier);
  }

  private getCulturalTexts(culture: string): string[] {
    const culturalTexts: { [key: string]: string[] } = {
      'arabic': [
        'يا ليل الصب متى غدك أم متى أجده يا نديم الصبر',
        'قافلة الحب تمضي في طريق الأمل والذكريات الجميلة'
      ],
      'japanese': [
        'Sakura no / hana chiru koro wa / kokoro kana',
        'Fuyu no asa / yukigesho ni / suzume kana'
      ],
      'spanish': [
        'En las noches de luna llena, canta el corazón una melodía eterna',
        'Ritmo y pasión, música y tradición, cultura que fluye con gran emoción'
      ]
    };
    
    return culturalTexts[culture] || culturalTexts['spanish'];
  }

  private async saveBundleToFirebase(bundle: GeneratedContentBundle): Promise<void> {
    try {
      const docRef = await db.collection('content_bundles').add({
        ...bundle,
        generatedAt: Timestamp.fromDate(bundle.generatedAt)
      });
      
      logger.info('Bundle saved to Firebase', { bundleId: docRef.id });
    } catch (error) {
      logger.error('Failed to save bundle to Firebase', { error });
      throw error;
    }
  }

  /**
   * Get premium content bundles for sale
   */
  public async getPremiumBundles(theme?: string): Promise<GeneratedContentBundle[]> {
    try {
      let query = db.collection('content_bundles')
        .where('isPremium', '==', true)
        .orderBy('generatedAt', 'desc')
        .limit(20);

      if (theme) {
        query = query.where('culturalContext', '==', theme);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedContentBundle));
    } catch (error) {
      logger.error('Failed to get premium bundles', { error });
      return [];
    }
  }

  /**
   * Track bundle usage for analytics and billing
   */
  public async trackBundleUsage(bundleId: string, userId: string): Promise<void> {
    try {
      await db.collection('content_bundles').doc(bundleId).update({
        usageCount: FieldValue.increment(1),
        lastUsed: Timestamp.now(),
        lastUsedBy: userId
      });

      // Track in analytics
      await db.collection('content_analytics').add({
        bundleId,
        userId,
        usedAt: Timestamp.now(),
        eventType: 'bundle_played'
      });

    } catch (error) {
      logger.error('Failed to track bundle usage', { bundleId, userId, error });
    }
  }
}

export const aiContentGenerationService = AIContentGenerationService.getInstance(); 