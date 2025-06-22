import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ObservationData, Pattern, PatternType } from '../types/observation';
import { findEnhancedPatterns } from './patternRecognition';
import { rateLimiter } from './rateLimiter';
import { cacheService } from './cacheService';
import { 
  validateText, 
  ObservationError, 
  ExternalServiceError,
  RateLimitError,
  CacheError,
  ValidationError
} from '../utils/errors';
import { settings } from '../config/settings';
import { metricsService } from './metricsService';
import { languageConfigs } from './phoneticService';
import { db } from '../config/firebase';
import { UserPreferences, UserUsage } from '../types/user';

// Create Anthropic client lazily to ensure environment variables are loaded
function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.error('Anthropic API key not found in environment variables');
    throw new Error('Anthropic API key not configured');
  }
  
  logger.info('Creating Anthropic client', { 
    hasKey: !!process.env.ANTHROPIC_API_KEY,
    keyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 8) || 'undefined'
  });
  
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  });
}

const OBSERVATION_PROMPT = `Your task is to analyze a given text for phonetic and linguistic patterns. You must strictly adhere to the following output format. Do not include any introductory text, explanations, or summaries. Your response must begin directly with "Pattern 1:" and contain nothing after the final pattern.

Format:
Pattern [n]:
Type: [pattern_type]
Segments: "[text segment 1]", "[text segment 2]", ...
Primary Feature: [feature]
Secondary Features: [feature1, feature2, ...]

Base pattern types include: rhyme, assonance, consonance, alliteration, rhythm, repetition, parallelism, anaphora, epistrophe, chiasmus, antithesis, onomatopoeia, euphony, cacophony, sibilance, fricative, plosive, liquid, nasal_harmony, vowel_gradation, consonant_gradation

Language-specific patterns will be indicated based on the text language.

Example:
Pattern 1:
Type: rhyme
Segments: "the wind", "behind"
Primary Feature: end_rhyme
Secondary Features: vowel_harmony, perfect_rhyme

Pattern 2:
Type: assonance
Segments: "I cry", "fly high"
Primary Feature: vowel_harmony
Secondary Features: vowel_i, diphthong_ai

Now, analyze the following text:`;

// Input validation
function validateInput(text: string): void {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  
  if (text.length > settings.validation.maxTextLength) {
    throw new Error(`Text exceeds maximum length of ${settings.validation.maxTextLength} characters`);
  }

  // Check for potentially malicious content
  for (const pattern of settings.validation.unsafePatterns) {
    if (text.toLowerCase().includes(pattern)) {
      throw new Error('Invalid input: text contains potentially unsafe content');
    }
  }
}

// Text cleaning function - removes metadata and structural markers while preserving formatting
function cleanTextForObservation(input: string): string {
  return input
    // Remove metadata lines (title, artist, album, year, etc.)
    .replace(/^(title|artist|album|year|song|by):\s*.+$/gim, '')
    // Remove section markers like [verse], [chorus], [bridge], etc. - case insensitive and more flexible
    .replace(/^\[(verse|chorus|bridge|intro|outro|pre-?chorus|hook|refrain|rap|breakdown|instrumental)(\s*:?\s*\d*)?\]\s*$/gim, '')
    // Remove section markers that appear inline (not at start of line)
    .replace(/\[(verse|chorus|bridge|intro|outro|pre-?chorus|hook|refrain|rap|breakdown|instrumental)(\s*:?\s*\d*)?\]/gi, '')
    // Remove timestamp markers like [0:34.56] or [1:23]
    .replace(/^\[\d+:\d+(\.\d+)?\]\s*/gm, '')
    .replace(/\[\d+:\d+(\.\d+)?\]/g, '')
    // Remove performer/artist indicators like [Artist Name:] or [Featuring:]
    .replace(/^\[([^:\]]+):\s*\]\s*/gim, '')
    // Remove other common structural markers
    .replace(/^\[([^\]]+)\]\s*$/gm, '') // Remove any remaining bracketed markers on their own lines
    .replace(/\[([^\]]+)\]/g, '') // Remove any remaining bracketed content inline
    // Remove common lyric metadata
    .replace(/^(lyrics?|written by|composed by|performed by):\s*.+$/gim, '')
    // Remove repetition indicators like (x2), (x3), etc.
    .replace(/\(\s*x\d+\s*\)/gi, '')
    // Remove ad-libs in parentheses that are common in rap
    .replace(/\(\s*(yeah|uh|what|oh|hey|yo|ay|huh|mm|hmm|ahh|ooh)\s*\)/gi, '')
    // PRESERVE FORMATTING: Clean up excessive whitespace more carefully
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Limit to max 2 consecutive newlines
    .replace(/^[ \t]+/gm, '') // Remove leading spaces/tabs from lines but preserve line structure
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces/tabs from lines
    // Remove leading/trailing whitespace from entire text
    .trim();
}

interface Observation {
  id: string;
  text: string;
  language: string;
  userId: string;
  patterns: any[];
  constellations?: any[];
  createdAt: Date;
  metadata: {
    rhymeScheme: string | null;
    meter: string | null;
    modelUsed: string;
    analysisOptions: ObserveOptions;
  };
  textWasCleaned?: boolean;
  originalTextLength?: number;
  cleanedTextLength?: number;
}

interface ObserveOptions {
  modelId?: string;
  complexity?: 'simple' | 'standard' | 'complex';
  maxCost?: number;
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
  culturalContext?: boolean;
}

class ObservationService {
  private observationsRef = db.collection('observations');
  private cacheRef = db.collection('observation_cache');
  private userPreferencesRef = db.collection('user_preferences');
  private userUsageRef = db.collection('user_usage');

  async observeText(
    text: string, 
    userId: string, 
    language: string = 'en', 
    options?: ObserveOptions
  ): Promise<Observation & { modelUsed: string; cost: number; tokensUsed: number }> {
    try {
      logger.info('Starting observation process', { userId, textLength: text.length, language });
      
      // Validate input
      validateText(text);
      logger.info('Input validation passed', { userId });

      // Clean text - remove metadata and structural markers like Scriptorium
      const originalText = text;
      const cleanedText = cleanTextForObservation(text);
      const textWasCleaned = cleanedText !== originalText;
      
      if (textWasCleaned) {
        logger.info('Text cleaned for observation', { 
          userId, 
          originalLength: originalText.length, 
          cleanedLength: cleanedText.length,
          removed: originalText.length - cleanedText.length
        });
      }
      
      // Use cleaned text for analysis
      text = cleanedText;

      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      logger.info('User preferences loaded', { userId, hasPrefs: !!userPrefs });
      
      // Determine which model to use
      const selectedModel = await this.selectModel(text, language, userId, options, userPrefs || undefined);
      logger.info('Model selected', { userId, modelId: selectedModel.id });
      
      // Check if user can afford this operation
      await this.checkUserBudget(userId, selectedModel.estimatedCost);
      logger.info('Budget check passed', { userId });

      // Create metadata object that will be populated throughout the function
      const metadata = {
        rhymeScheme: null as string | null,
        meter: null as string | null,
        modelUsed: selectedModel.id,
        analysisOptions: options || {}
      };

      // Generate text hash for caching (use cleaned text for consistent caching)
      const textHash = await this.hashText(text);

      // Try to get from cache first
      let cachedResult = await this.getFromCache(textHash, language);
      if (cachedResult) {
        logger.info('Observation retrieved from cache', { userId, textHash: textHash.substring(0, 8) });
        return {
          ...cachedResult,
          modelUsed: 'cached',
          cost: 0,
          tokensUsed: 0
        };
      }

      // Rate limiting
      logger.info('Checking rate limit', { userId });
      await rateLimiter.checkLimit(userId);
      logger.info('Rate limit check passed', { userId });

      let patterns: Pattern[] = [];

      // Get language-specific prompt
      logger.info(`Using language code: "${language}" for analysis`);
      const prompt = getAdaptiveLanguagePrompt(text, language, options);
      logger.info('Language prompt generated', { userId, promptLength: prompt.length });

      // Call the Anthropic (Claude) AI with selected model
      const startTime = Date.now();
      logger.info('Starting Anthropic API call', { userId, modelId: selectedModel.id });
      
      try {
        const fullMessage = `${prompt}\n\nText: ${text}`;
        
        logger.info('Calling Anthropic API with parameters', { 
          userId, 
          modelId: selectedModel.id, 
          maxTokens: selectedModel.maxTokens,
          messageLength: fullMessage.length,
          promptLength: prompt.length,
          textLength: text.length
        });
        
        // Log first 200 chars of message for debugging
        logger.info('Message preview', { 
          userId,
          messagePreview: fullMessage.substring(0, 200) + '...'
        });
        
        const anthropic = getAnthropicClient();
        const msg = await anthropic.messages.create({
          model: selectedModel.id,
          max_tokens: selectedModel.maxTokens,
          messages: [{ role: 'user', content: fullMessage }]
        });
        
        logger.info('Anthropic API call successful', { userId });
        const responseTime = Date.now() - startTime;

        // Calculate actual token usage and cost
        const tokensUsed = this.estimateTokens(text, language);
        const actualCost = settings.models.calculateCost(tokensUsed, selectedModel.id);

        // Extract the response content
        let analysisContent = '';
        if (msg.content[0] && msg.content[0].type === 'text') {
          analysisContent = msg.content[0].text;
        } else {
          throw new ExternalServiceError("Anthropic", "Invalid response format from AI service");
        }

        logger.info('AI Analysis completed', { 
          userId, 
          model: selectedModel.name,
          tokensUsed,
          cost: actualCost,
          responseTime,
          language
        });

        // Parse the AI's response to get structured pattern data
        patterns = parsePatterns(analysisContent, text);

        // Extract rhyme scheme and metrical analysis from AI response
        const rhymeSchemeAnalysis = extractRhymeScheme(analysisContent);
        const metricalAnalysis = extractMetricalAnalysis(analysisContent);

        // HYBRID ENHANCEMENT: Use sophisticated pattern recognition to refine and augment AI patterns
        logger.info('Enhancing patterns with sophisticated algorithms...');
        const enhancedPatterns = findEnhancedPatterns(text, language);
        
        // Merge AI patterns with enhanced patterns, prioritizing quality and limiting size
        patterns = mergeAndRefinePatterns(patterns, enhancedPatterns, text);
        
        // CRITICAL: Limit patterns to prevent payload size issues
        const MAX_PATTERNS = 50; // Firestore document size limit consideration
        if (patterns.length > MAX_PATTERNS) {
          logger.warn(`Pattern count ${patterns.length} exceeds limit, reducing to ${MAX_PATTERNS}`);
          // Keep highest quality patterns (AI patterns first, then by confidence)
          patterns = patterns.slice(0, MAX_PATTERNS);
        }
        
        logger.info(`Final pattern count: ${patterns.length} (after size limiting)`);

        // Store extracted analysis for metadata
        metadata.rhymeScheme = rhymeSchemeAnalysis;
        metadata.meter = metricalAnalysis;

        // Update user usage tracking
        await this.updateUserUsage(userId, selectedModel.id, tokensUsed, actualCost, responseTime);
      } catch (error: any) {
        logger.error(`Anthropic API call failed for user ${userId}`);
        logger.error(`Error message: ${error?.message || 'No message'}`);
        logger.error(`Error status: ${error?.status || 'No status'}`);
        logger.error(`Error code: ${error?.code || 'No code'}`);
        logger.error(`Error type: ${error?.constructor?.name || 'Unknown'}`);
        logger.error(`Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
        console.error('Raw error object:', error);
        
        if (error.status === 401) {
          throw new ExternalServiceError('Anthropic', 'Invalid API key. Please check your Anthropic API key configuration.');
        } else if (error.status === 429) {
          throw new ExternalServiceError('Anthropic', 'API rate limit exceeded. Please try again later.');
        } else if (error.status >= 500) {
          throw new ExternalServiceError('Anthropic', 'Service is temporarily unavailable. Please try again later.');
        } else {
          throw new ExternalServiceError('Anthropic', `AI analysis failed: ${error.message}`);
        }
      }
      
      // Find constellations (pattern relationships) - also limit these
      const constellations = findConstellations(patterns, language).slice(0, 10); // Limit constellations too

      // Create observation with proper typing - store original text for display
      const observation: Omit<Observation, 'id'> = {
        text: originalText, // Store original text so users see what they entered
        language,
        userId,
        patterns,
        constellations,
        createdAt: new Date(),
        metadata
      };

      // PAYLOAD SIZE CHECK: Estimate payload size before saving
      const estimatedPayloadSize = this.estimatePayloadSize(observation);
      const FIRESTORE_LIMIT = 1048576; // 1MB limit for Firestore documents
      
      if (estimatedPayloadSize > FIRESTORE_LIMIT) {
        logger.warn(`Payload size ${estimatedPayloadSize} bytes exceeds Firestore limit, reducing patterns further`);
        
        // Drastically reduce patterns if still too large
        const reduction = Math.ceil(patterns.length * 0.3); // Keep only top 30%
        observation.patterns = patterns.slice(0, reduction);
        observation.constellations = constellations.slice(0, 5);
        
        logger.info(`Reduced to ${observation.patterns.length} patterns and ${observation.constellations?.length} constellations`);
      }

      // Save to database with error handling for large payloads
      let savedObservation: Observation;
      try {
        const docRef = await this.observationsRef.add(observation);
        savedObservation = {
          id: docRef.id,
          ...observation
        };
      } catch (error: any) {
        if (error.message && error.message.includes('payload size exceeds')) {
          logger.error('Firestore payload still too large, using minimal pattern set');
          
          // Last resort: keep only AI patterns (they're highest quality)
          const aiPatterns = patterns.filter(p => p.description && p.description.length > 0).slice(0, 15);
          const minimalObservation = {
            ...observation,
            patterns: aiPatterns,
            constellations: []
          };
          
          const docRef = await this.observationsRef.add(minimalObservation);
          savedObservation = {
            id: docRef.id,
            ...minimalObservation
          };
          
          logger.info(`Saved with ${aiPatterns.length} AI patterns only`);
        } else {
          throw error; // Re-throw if not a size issue
        }
      }

      // Cache using text hash (with size check for cache too)
      if (this.estimatePayloadSize(savedObservation) < FIRESTORE_LIMIT) {
        await this.saveToCache(textHash, language, savedObservation);
      } else {
        logger.warn('Observation too large for cache, skipping cache save');
      }

      // Track pattern types
      await this.trackPatterns(savedObservation.patterns);

      return {
        ...savedObservation,
        modelUsed: selectedModel.id,
        cost: selectedModel.estimatedCost,
        tokensUsed: this.estimateTokens(text, language),
        textWasCleaned,
        originalTextLength: originalText.length,
        cleanedTextLength: text.length
      };
    } catch (error) {
      // Proper error handling with specific error types
      if (error instanceof ValidationError) {
        logger.error('Validation error in observation:', { error: error.message, userId });
        throw error;
      }
      if (error instanceof RateLimitError) {
        logger.error('Rate limit error in observation:', { error: error.message, userId });
        throw error;
      }
      if (error instanceof ExternalServiceError) {
        logger.error('External service error in observation:', { error: error.message, userId });
        throw error;
      }
      
      // Log detailed error information for debugging
      logger.error('Unexpected error processing observation:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        userId,
        textLength: text?.length,
        language,
        errorDetails: error
      });
      
      throw new ObservationError('Failed to process observation');
    }
  }

  private async selectModel(
    text: string, 
    language: string, 
    userId: string, 
    options?: ObserveOptions,
    userPrefs?: UserPreferences
  ) {
    // Priority: explicit option > user preference > automatic recommendation
    let modelId: string;
    
    if (options?.modelId) {
      modelId = options.modelId;
    } else if (userPrefs?.preferredModel) {
      modelId = userPrefs.preferredModel;
    } else {
      // Use automatic recommendation
      const complexity = options?.complexity || 'standard';
      modelId = settings.models.getRecommendedModel(text.length, language, complexity);
    }

    // Validate model exists
    const model = settings.models.available.find(m => m.id === modelId);
    if (!model) {
      logger.warn(`Invalid model ${modelId}, falling back to default`);
      modelId = settings.models.default;
    }

    const selectedModel = settings.models.available.find(m => m.id === modelId)!;
    
    // Estimate cost
    const estimatedTokens = this.estimateTokens(text, language);
    const estimatedCost = settings.models.calculateCost(estimatedTokens, modelId);

    // Check if user wants auto-upgrade for complex content
    if (userPrefs?.autoUpgradeForComplexity && this.isComplexContent(text, language)) {
      const upgradeModel = settings.models.available.find(m => m.tier === 'premium');
      if (upgradeModel && upgradeModel.id !== modelId) {
        const upgradeCost = settings.models.calculateCost(estimatedTokens, upgradeModel.id);
        const costDifference = upgradeCost - estimatedCost;
        
        // Only upgrade if within budget
        if (!userPrefs.budgetLimit || costDifference <= (userPrefs.budgetLimit * 0.1)) {
          logger.info(`Auto-upgrading to ${upgradeModel.name} for complex content`, { userId });
          return {
            ...upgradeModel,
            estimatedCost: upgradeCost,
            maxTokens: upgradeModel.maxTokens
          };
        }
      }
    }

    return {
      ...selectedModel,
      estimatedCost,
      maxTokens: selectedModel.maxTokens
    };
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const doc = await this.userPreferencesRef.doc(userId).get();
      return doc.exists ? doc.data() as UserPreferences : null;
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return null;
    }
  }

  private async checkUserBudget(userId: string, estimatedCost: number): Promise<void> {
    try {
      const usage = await this.getUserUsage(userId);
      const userPrefs = await this.getUserPreferences(userId);
      
      if (userPrefs?.budgetLimit) {
        const projectedTotal = usage.costThisMonth + estimatedCost;
        if (projectedTotal > userPrefs.budgetLimit) {
          throw new ValidationError(`This operation would exceed your monthly budget limit of $${userPrefs.budgetLimit}`);
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.error('Error checking user budget:', error);
      // Don't block operation if budget check fails
    }
  }

  private async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      const doc = await this.userUsageRef.doc(userId).get();
      if (doc.exists) {
        const usage = doc.data() as UserUsage;
        // Reset if new month
        const now = new Date();
        const lastReset = usage.lastReset instanceof Date ? usage.lastReset : new Date(usage.lastReset);
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          const resetUsage: UserUsage = {
            tokensUsedThisMonth: 0,
            costThisMonth: 0,
            observationsThisMonth: 0,
            lastReset: now,
            favoriteModels: usage.favoriteModels || []
          };
          await this.userUsageRef.doc(userId).set(resetUsage);
          return resetUsage;
        }
        return usage;
      } else {
        // Create new usage record
        const newUsage: UserUsage = {
          tokensUsedThisMonth: 0,
          costThisMonth: 0,
          observationsThisMonth: 0,
          lastReset: new Date(),
          favoriteModels: []
        };
        await this.userUsageRef.doc(userId).set(newUsage);
        return newUsage;
      }
    } catch (error) {
      logger.error('Error getting user usage:', error);
      // Return default usage if error
      return {
        tokensUsedThisMonth: 0,
        costThisMonth: 0,
        observationsThisMonth: 0,
        lastReset: new Date(),
        favoriteModels: []
      };
    }
  }

  private async updateUserUsage(
    userId: string, 
    modelId: string, 
    tokensUsed: number, 
    cost: number,
    responseTime: number
  ): Promise<void> {
    try {
      const usage = await this.getUserUsage(userId);
      
      const updatedUsage: UserUsage = {
        tokensUsedThisMonth: usage.tokensUsedThisMonth + tokensUsed,
        costThisMonth: usage.costThisMonth + cost,
        observationsThisMonth: usage.observationsThisMonth + 1,
        lastReset: usage.lastReset,
        favoriteModels: this.updateFavoriteModels(usage.favoriteModels, modelId)
      };

      await this.userUsageRef.doc(userId).set(updatedUsage);
      
      // Track metrics
      await metricsService.incrementCounter(`model.${modelId}.usage`, 1);
      await metricsService.incrementCounter(`model.${modelId}.response_time`, responseTime);
      await metricsService.incrementCounter(`model.${modelId}.cost`, cost);
      
    } catch (error) {
      logger.error('Error updating user usage:', error);
    }
  }

  private updateFavoriteModels(current: string[], newModel: string): string[] {
    const updated = [...current];
    const index = updated.indexOf(newModel);
    
    if (index > -1) {
      // Move to front if already exists
      updated.splice(index, 1);
      updated.unshift(newModel);
    } else {
      // Add to front
      updated.unshift(newModel);
    }
    
    // Keep only top 3 favorites
    return updated.slice(0, 3);
  }

  private estimateTokens(inputText: string, language: string): number {
    const averageTokensPerChar = language === 'ja' ? 0.9 : 0.25;
    return Math.ceil(inputText.length * averageTokensPerChar);
  }

  private async hashText(text: string): Promise<string> {
    // Use Node.js crypto for hashing
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private async getFromCache(textHash: string, language: string): Promise<Observation | null> {
    try {
      const snapshot = await this.cacheRef
        .where('textHash', '==', textHash)
        .where('language', '==', language)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      return snapshot.docs[0].data() as Observation;
    } catch (error) {
      logger.error('Error getting from cache:', error);
      return null;
    }
  }

  private async saveToCache(textHash: string, language: string, observation: Observation): Promise<void> {
    try {
      await this.cacheRef.add({
        textHash,
        ...observation,
        language,
        cachedAt: new Date()
      });
    } catch (error) {
      logger.error('Error saving to cache:', error);
    }
  }

  private async trackPatterns(patterns: Pattern[]): Promise<void> {
    try {
      await Promise.all(
        patterns.map(pattern =>
          metricsService.incrementCounter(`patterns.${pattern.type}`, 1)
            .catch(error => {
              logger.error('Error tracking pattern:', error);
            })
        )
      );
    } catch (error) {
      logger.error('Error tracking patterns:', error);
    }
  }



  private isComplexContent(text: string, language: string): boolean {
    // Consider content complex if it has:
    // - More than 500 characters
    // - Multiple languages mixed
    // - Technical terminology
    // - Dense punctuation
    const length = text.length;
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = length / wordCount;
    const punctuationDensity = (text.match(/[.,;:!?-]/g) || []).length / wordCount;
    
    return length > 500 || avgWordLength > 7 || punctuationDensity > 0.3;
  }

  private estimatePayloadSize(observation: any): number {
    // Rough estimate of JSON serialized size
    try {
      const jsonString = JSON.stringify(observation);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch (error) {
      // Fallback estimate
      const patternCount = observation.patterns?.length || 0;
      const constellationCount = observation.constellations?.length || 0;
      const textLength = observation.text?.length || 0;
      
      // Rough calculation: base size + patterns + text
      return 1000 + (patternCount * 500) + (constellationCount * 200) + (textLength * 2);
    }
  }


}

export const observationService = new ObservationService();

function getLanguageSpecificPrompt(language: string): (text: string) => string {
  return (text: string) => {
    const textLength = text.length;
    const isPoetic = /[\n\r].*[\n\r]|[.!?]\s*[A-Z].*[.!?]/.test(text) || textLength > 200;
    const targetPatterns = isPoetic ? 
      (textLength > 1000 ? '35-50' : textLength > 500 ? '20-35' : '10-25') : 
      (textLength > 500 ? '8-15' : '3-8');

    const baseAdvice = `CRITICAL INSTRUCTIONS FOR COMPREHENSIVE POETIC ANALYSIS:

You MUST find ${targetPatterns} distinct sound patterns. Be extremely thorough and precise.

REQUIRED PATTERN CATEGORIES TO IDENTIFY:

1. ALLITERATION (HIGHEST PRIORITY):
   - Initial consonant repetition at word beginnings
   - Examples: "flame of my life", "candle... church"
   - Label as "Alliteration" - this is CRITICAL and currently missing

2. SIBILANCE (HIGH PRIORITY):
   - Repetition of s, sh, z, ch, j sounds
   - Examples: "stretched As... seems... kissing... sorrows"
   - Label as "Sibilance" - distinct from general consonance

3. RHYME ANALYSIS (ESSENTIAL):
   - Perfect Rhyme: Exact sound matches (cat/bat)
   - Slant Rhyme: Near matches (pook/luhod, stretched/red)
   - Internal Rhyme: Within single lines (knees/seems)
   - End Rhyme: Line endings - IDENTIFY THE RHYME SCHEME
   - Eye Rhyme: Visual similarity, different sounds (through/tough)

4. RHYME SCHEME DETECTION:
   - Analyze end words of each line
   - Assign letters (A, B, C, D) to rhyme patterns
   - Examples: AABB, ABAB, ABCB
   - Include this in your analysis

5. METRICAL ANALYSIS:
   - Count syllables per line
   - Identify stress patterns (iambic, trochaic, anapestic)
   - Note meter irregularities

6. ADVANCED CONSONANCE:
   - Separate initial (alliteration) from medial/final consonance
   - Identify specific consonant families (plosives, fricatives, nasals)

7. VOWEL SOPHISTICATION:
   - Long vs short vowel patterns
   - Diphthong vs monophthong patterns
   - Vowel progression sequences

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

Pattern 1:
Type: [Specific type like "Alliteration", "Sibilance", "Perfect Rhyme", "Slant Rhyme", etc.]
Segments: "word1", "word2", "word3"
Sound: [IPA notation or clear phonetic description]
Confidence: [High/Medium/Low]
Explanation: [Why this pattern is significant]

Pattern 2:
Type: Internal Rhyme
Segments: "knees", "seems"  
Sound: /i:/ long vowel rhyme within line
Confidence: High
Explanation: Creates internal musical quality in the line

[Continue for ALL patterns found...]

RHYME SCHEME ANALYSIS:
Line 1: [end word] - A
Line 2: [end word] - B  
Line 3: [end word] - A
Overall Scheme: ABA

METRICAL ANALYSIS:
Line 1: [X syllables] - [stress pattern]
Line 2: [X syllables] - [stress pattern]
Identified Meter: [e.g., Iambic pentameter, Free verse, etc.]

${getLanguageSpecificEnhancements(language, isPoetic, textLength)}`;

    return baseAdvice;
  };
}

function getLanguageSpecificEnhancements(language: string, isPoetic: boolean, textLength: number): string {
  const baseAdvice = `
ANALYSIS DEPTH REQUIREMENTS:
- Use IPA notation where helpful: [phonetic transcription]
- Include stress patterns: primary (ˈ) and secondary (ˌ) stress
- Note morphological relationships: prefixes, suffixes, roots
- Identify borrowed words and their phonetic adaptations
- Consider dialectal variations if evident
- Analyze prosodic features: intonation, duration, intensity`;

  switch (language) {
    case 'en':
      return `ENGLISH-SPECIFIC REQUIREMENTS:
${baseAdvice}
- ALLITERATION: Initial consonant clusters (/str/, /fl/, /pr/)
- SIBILANCE: /s/, /ʃ/, /z/, /ʒ/, /tʃ/, /dʒ/ patterns - this is CRITICAL
- R-coloring: /ɚ/, /ɝ/ effects on neighboring vowels
- TH-sounds: /θ/ vs /ð/ distribution patterns
- Stress-timing: Identify iambs (da-DUM), trochees (DUM-da), anapests (da-da-DUM)
- T-flapping: /t/ → [ɾ] between vowels
- Perfect rhymes: -ing/-ing, -ight/-ight, -eed/-eed
- Slant rhymes: Different vowels, same consonants (cat/cut)
- Internal rhymes: Mid-line to end-line connections
- Consonant clusters: Complex onset/coda patterns
- RHYME SCHEME: Essential for English poetry analysis
- METER: Iambic pentameter, common meter, free verse identification
- Traditional forms: Sonnet, ballad, blank verse patterns if applicable`;

    case 'fil':
    case 'tl':
      return `FILIPINO/TAGALOG-SPECIFIC REQUIREMENTS:  
${baseAdvice}
- TUGMAAN (Perfect Rhyme): -an/-an, -ay/-ay endings - IDENTIFY SCHEME
- ASSONANT RHYME: Vowel-final similarity (pook/luhod acceptable)
- REDUPLICATION: Full (laki-laki) and partial (mag-mahal) patterns
- GLOTTAL STOP: /ʔ/ insertion and deletion patterns
- NG-sounds: /ŋ/ in various positions and combinations
- FILIPINO ALLITERATION: Initial consonant repetition (tila/tanod)
- Stress patterns: Penultimate vs final stress variations
- Borrowed adaptations: Spanish/English loan phonology
- Traditional forms: Awit, korido, tanaga patterns if applicable
- POETIC DEVICES: 
  * Uulit-uulit (repetition patterns)
  * Tayutay (figurative language with sound effects)
  * Sukat (syllable counting - 8 syllables per line traditional)`;

    case 'es':
      return `SPANISH-SPECIFIC REQUIREMENTS:
${baseAdvice}
- RIMA CONSONANTE: Perfect rhyme including consonants
- RIMA ASONANTE: Assonant rhyme (vowels only from last stressed syllable)
- SINALEFA: Vowel liaison across word boundaries
- SYNALEPHA: Vowel blending effects on syllable count
- Syllable timing: Even-timed rhythm structure
- Pure vowels: /a/, /e/, /i/, /o/, /u/ clarity
- Diphthongs: Rising (ia, ie, io, ua, ue, uo) vs falling (ai, ei, oi, au, eu)
- Triphthongs: Complex sequences like /iai/, /uai/
- Spirantization: /b/, /d/, /g/ → [β], [ð], [ɣ] intervocalically
- Lateral palatalization: /ʎ/ vs /ʝ/ merger (yeísmo)
- Sibilant distinctions: /s/ vs /θ/ (seseo/ceceo variations)
- Liaison: Sinalefa across word boundaries
- Stress patterns: Aguda, llana, esdrújula classifications
- Rhotics: Tap /ɾ/ vs trill /r/ minimal pairs
- Classical forms: Romance verse patterns if poetic
- ESQUEMA RIMÁTICO: ABBA, ABAB, etc. - ESSENTIAL`;

    // Additional language cases...
    default:
      return `UNIVERSAL LINGUISTIC ANALYSIS:
${baseAdvice}
- Apply cross-linguistic phonetic principles
- ALLITERATION: Initial sound repetition in any language
- Note language-specific phonological constraints
- Identify borrowed word adaptation patterns
- Consider cultural sound symbolism
- Include prosodic and intonational features
- Adapt analysis to text characteristics and purpose
- Find meaningful patterns regardless of theoretical framework
- RHYME SCHEMES: Identify end-line patterns universally`;
  }
}

// Update the main observeText function to use the new adaptive prompt
function getAdaptiveLanguagePrompt(text: string, language: string, options?: ObserveOptions): string {
  const promptGenerator = getLanguageSpecificPrompt(language);
  let basePrompt = promptGenerator(text);
  
  // Customize prompt based on advanced options
  if (options) {
    let customizations = '\n\nADVANCED ANALYSIS CUSTOMIZATIONS:\n';
    
    // Sensitivity setting
    if (options.sensitivity === 'subtle') {
      customizations += '- SENSITIVITY LEVEL: SUBTLE - Focus only on the most obvious and clear patterns. Avoid borderline cases.\n';
    } else if (options.sensitivity === 'strong') {
      customizations += '- SENSITIVITY LEVEL: STRONG - Include subtle and nuanced patterns. Be comprehensive and inclusive.\n';
    } else {
      customizations += '- SENSITIVITY LEVEL: MODERATE - Balance between obvious and subtle patterns.\n';
    }
    
    // Phonetic depth setting
    if (options.phoneticDepth === 'basic') {
      customizations += '- PHONETIC DEPTH: BASIC - Use simple phonetic descriptions without IPA notation.\n';
    } else if (options.phoneticDepth === 'expert') {
      customizations += '- PHONETIC DEPTH: EXPERT - Include full IPA notation, articulation details, acoustic properties, and advanced phonetic features.\n';
    } else {
      customizations += '- PHONETIC DEPTH: DETAILED - Include IPA notation and phonetic explanations appropriate for intermediate users.\n';
    }
    
    // Cultural context setting
    if (options.culturalContext === false) {
      customizations += '- CULTURAL CONTEXT: MINIMAL - Focus purely on linguistic patterns without cultural references.\n';
    } else {
      customizations += '- CULTURAL CONTEXT: ENABLED - Include cultural, literary, and contextual significance of patterns where relevant.\n';
    }
    
    basePrompt += customizations;
  }
  
  return basePrompt;
}

function formatPatterns(patterns: Pattern[]): string {
  return patterns.map((pattern, index) => `
Pattern ${index + 1}:
Type: ${pattern.type}
Segments: ${pattern.segments.map(s => `"${s.text}"`).join(', ')}
Primary Feature: ${pattern.acousticFeatures?.primaryFeature || 'unknown'}
Secondary Features: ${pattern.acousticFeatures?.secondaryFeatures.join(', ') || 'none'}
`).join('\n');
}

function parsePatterns(content: string, originalText: string): Pattern[] {
  try {
    // Log the first 500 characters of AI response for debugging
    logger.info(`AI Response preview: "${content.substring(0, 500)}..."`);
    
    // Try multiple pattern formats to be more flexible
    let patternMatches: string[] = [];
    
    // Primary format: "Pattern N:"
    patternMatches = content.match(/Pattern \d+:[\s\S]*?(?=Pattern \d+:|RHYME SCHEME ANALYSIS:|METRICAL ANALYSIS:|$)/g) || [];
    
    if (patternMatches.length === 0) {
      // Alternative format: "N. Type:"
      patternMatches = content.match(/\d+\.\s*Type:[\s\S]*?(?=\d+\.\s*Type:|RHYME SCHEME ANALYSIS:|METRICAL ANALYSIS:|$)/g) || [];
    }
    
    if (patternMatches.length === 0) {
      // Alternative format: numbered list starting with digit
      patternMatches = content.match(/^\d+\.[\s\S]*?(?=^\d+\.|RHYME SCHEME ANALYSIS:|METRICAL ANALYSIS:|$)/gm) || [];
    }
    
    if (patternMatches.length === 0) {
      // Fallback: split by "Pattern" word but stop at analysis sections
      const splitByPattern = content.split(/Pattern/i);
      if (splitByPattern.length > 1) {
        patternMatches = splitByPattern.slice(1).map(p => `Pattern${p}`)
          .map(p => p.split(/RHYME SCHEME ANALYSIS:|METRICAL ANALYSIS:/)[0].trim());
      }
    }

    let lastIndex = 0; // Keep track of the last found index

    // Log how many patterns we found
    logger.info(`Found ${patternMatches.length} pattern matches in AI response`);
    
    if (patternMatches.length === 0) {
      logger.warn('No patterns found with any format');
      return [];
    }

    const patterns = patternMatches.map((match, index) => {
      // Parse pattern type
      const typeMatch = match.match(/Type: ([^\n]+)/);
      let type = (typeMatch || [])[1]?.trim() || 'unknown';
      
      // Parse confidence level
      const confidenceMatch = match.match(/Confidence: ([^\n]+)/);
      const confidence = confidenceMatch ? confidenceMatch[1].trim() : 'medium';
      
      // Parse explanation
      const explanationMatch = match.match(/Explanation: ([^\n]+)/);
      const explanation = explanationMatch ? explanationMatch[1].trim() : '';

      // Map pattern types to our PatternType enum
      const patternTypeMapping: { [key: string]: PatternType } = {
        // RHYME FAMILY - More specific categorization
        'Perfect Rhyme': 'rhyme',
        'Near Rhyme': 'slant_rhyme', 
        'Slant Rhyme': 'slant_rhyme',
        'Eye Rhyme': 'rhyme', // Visual rhyme - map to general rhyme for now
        'Internal Rhyme': 'internal_rhyme',
        'Cross Rhyme': 'rhyme',
        'Mosaic Rhyme': 'rhyme',
        'Feminine Rhyme': 'rhyme',
        'Masculine Rhyme': 'rhyme',
        'Rich Rhyme': 'rhyme',
        'End Rhyme': 'rhyme',
        'Tugmaan': 'rhyme', // Filipino perfect rhyme
        'Rima Consonante': 'rhyme', // Spanish perfect rhyme
        'Rima Asonante': 'assonance', // Spanish assonant rhyme
        
        // INITIAL SOUND PATTERNS - Critical distinction
        'Alliteration': 'alliteration', // HIGHEST PRIORITY - initial consonants
        'Initial Sound': 'alliteration',
        'Filipino Alliteration': 'alliteration',
        'Sibilance': 'sibilance', // HIGH PRIORITY - s/sh/z/ch sounds
        
        // VOWEL PATTERNS
        'Assonance': 'assonance',
        'Vowel Harmony': 'assonance',
        'Diphthong Match': 'assonance',
        'Monophthong Echo': 'assonance',
        'Vowel Gradation': 'assonance',
        'Schwa Pattern': 'assonance',
        'Vowel Length': 'assonance',
        'Vowel Match': 'assonance',
        'Vowel Echo': 'assonance',
        'Vowel Progression': 'assonance',
        'High Vowel': 'assonance',
        'Mid Vowel': 'assonance', 
        'Low Vowel': 'assonance',
        'Assonant Rhyme': 'assonance', // Filipino vowel rhyme
        
        // CONSONANT PATTERNS - More specific than before
        'Consonance': 'consonance', // General consonant repetition
        'Plosive Chain': 'consonance',
        'Fricative Chain': 'consonance',
        'Nasal Chain': 'consonance',
        'Liquid Chain': 'consonance',
        'Affricate Pattern': 'consonance',
        'Cluster Pattern': 'consonance',
        'Consonant Match': 'consonance',
        'Consonant Echo': 'consonance',
        'Final Sound': 'consonance',
        'Medial Sound': 'consonance',
        'Voiced Pattern': 'consonance',
        'Voiceless Pattern': 'consonance',
        'Aspirated Pattern': 'consonance',
        
        // STRUCTURAL PATTERNS
        'Syllable Echo': 'rhythm',
        'Stress Pattern': 'rhythm',
        'Meter Match': 'rhythm',
        'Caesura Pattern': 'rhythm',
        'Enjambment': 'rhythm',
        'Stanza Echo': 'rhythm',
        'Rhythm Match': 'rhythm',
        'Rhythm Pattern': 'rhythm',
        'Metrical Pattern': 'rhythm',
        
        // PHONETIC RELATIONSHIPS
        'Phoneme Chain': 'sound_parallelism',
        'Sound Bridge': 'sound_parallelism',
        'Acoustic Shadow': 'sound_parallelism',
        'Articulation Echo': 'sound_parallelism',
        'Voicing Pattern': 'sound_parallelism',
        'Aspiration Pattern': 'sound_parallelism',
        'Phonetic Echo': 'sound_parallelism',
        'Sound Chain': 'sound_parallelism',
        
        // MORPHOLOGICAL ECHOES
        'Prefix Echo': 'sound_parallelism',
        'Suffix Echo': 'sound_parallelism',
        'Root Pattern': 'sound_parallelism',
        'Compound Echo': 'sound_parallelism',
        'Inflection Pattern': 'sound_parallelism',
        'Derivation Chain': 'sound_parallelism',
        'Compound Pattern': 'sound_parallelism',
        'Reduplication': 'sound_parallelism', // Filipino
        
        // PROSODIC FEATURES
        'Intonation Pattern': 'rhythm',
        'Duration Pattern': 'rhythm',
        'Intensity Pattern': 'rhythm',
        'Tempo Relationship': 'rhythm',
        
        // LEGACY MAPPINGS (for backward compatibility)
        'Sound Parallelism': 'sound_parallelism'
      };

      const mappedType = patternTypeMapping[type] || 
                        (Object.keys(patternTypeMapping).find(key => 
                          type.toLowerCase().includes(key.toLowerCase())
                        ) ? patternTypeMapping[Object.keys(patternTypeMapping).find(key => 
                          type.toLowerCase().includes(key.toLowerCase())
                        )!] : 'sound_parallelism') as PatternType;

      const segments = extractSegments(match, originalText, lastIndex);
      
      // Parse the Sound field
      const soundMatch = match.match(/Sound: ([^\n]+)/);
      const soundDescription = soundMatch ? soundMatch[1].trim() : 'unknown sound';

      // Update lastIndex to the end of the last segment found for this pattern
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment) {
            lastIndex = lastSegment.globalEndIndex;
        }
      }

      const pattern = {
        id: `pattern_${index}`,
        type: mappedType,
        segments,
        originalText,
        acousticFeatures: {
          primaryFeature: soundDescription,
          secondaryFeatures: [type, `confidence: ${confidence}`, explanation].filter(Boolean) // Store original type, confidence, and explanation
        },
        // Add confidence as a property for potential filtering
        confidence: confidence as 'high' | 'medium' | 'low',
        description: explanation || `${mappedType} pattern detected by AI`
      };

      logger.info(`Created pattern ${index + 1}: type="${mappedType}", originalType="${type}", segments=${segments.length}, confidence=${confidence}`);
      return pattern;
    }).filter((p, index) => {
      // Quality filters
      const segmentCheck = p.segments.length >= 2;
      const maxSegmentCheck = p.segments.length <= 8;
      const lowConfidenceCheck = !(patternMatches.length > 100 && p.confidence === 'low');
      
      const shouldKeep = segmentCheck && maxSegmentCheck && lowConfidenceCheck;
      
      if (!shouldKeep) {
        logger.warn(`Filtering out pattern ${index + 1}: segments=${p.segments.length} (need ≥2, ≤8), confidence=${p.confidence}, totalPatterns=${patternMatches.length}`);
      } else {
        logger.info(`Keeping pattern ${index + 1}: type=${p.type}, segments=${p.segments.length}`);
      }
      
      return shouldKeep;
    });

    // Extract rhyme scheme and metrical analysis
    const rhymeSchemeAnalysis = extractRhymeScheme(content);
    const metricalAnalysis = extractMetricalAnalysis(content);
    
    // Add rhyme scheme and metrical info as metadata to patterns
    if (rhymeSchemeAnalysis || metricalAnalysis) {
      logger.info(`Extracted additional analysis - Rhyme scheme: ${rhymeSchemeAnalysis ? 'Yes' : 'No'}, Meter: ${metricalAnalysis ? 'Yes' : 'No'}`);
    }

    logger.info(`Final result: ${patterns.length} patterns after filtering`);
    
    // Sort by confidence (high first) and then by segment count
    return patterns.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const aConfidence = confidenceOrder[a.confidence as keyof typeof confidenceOrder] || 2;
      const bConfidence = confidenceOrder[b.confidence as keyof typeof confidenceOrder] || 2;
      
      if (aConfidence !== bConfidence) {
        return bConfidence - aConfidence; // Higher confidence first
      }
      
      return b.segments.length - a.segments.length; // More segments first
    });
  } catch (error) {
    logger.error('Error parsing patterns:', error);
    return [];
  }
}

function extractRhymeScheme(content: string): string | null {
  try {
    const rhymeSchemeSection = content.match(/RHYME SCHEME ANALYSIS:([\s\S]*?)(?=METRICAL ANALYSIS:|$)/);
    if (rhymeSchemeSection) {
      const schemeMatch = rhymeSchemeSection[1].match(/Overall Scheme: ([A-Z]+)/);
      if (schemeMatch) {
        logger.info(`Found rhyme scheme: ${schemeMatch[1]}`);
        return schemeMatch[1];
      }
    }
    return null;
  } catch (error) {
    logger.error('Error extracting rhyme scheme:', error);
    return null;
  }
}

function extractMetricalAnalysis(content: string): string | null {
  try {
    const metricalSection = content.match(/METRICAL ANALYSIS:([\s\S]*?)$/);
    if (metricalSection) {
      const meterMatch = metricalSection[1].match(/Identified Meter: ([^\n]+)/);
      if (meterMatch) {
        logger.info(`Found meter: ${meterMatch[1]}`);
        return meterMatch[1].trim();
      }
    }
    return null;
  } catch (error) {
    logger.error('Error extracting metrical analysis:', error);
    return null;
  }
}

function extractSegments(patternDescription: string, originalText: string, searchFromIndex: number = 0) {
    const segmentsLine = patternDescription.match(/Segments?: (.+)/);
    if (!segmentsLine) {
        logger.warn('No segments line found in pattern');
        return [];
    }

    const segmentTexts = (segmentsLine[1].match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, ''));
    if (segmentTexts.length === 0) {
        logger.warn('No quoted segments found in segments line');
        return [];
    }

    logger.info(`Extracting segments: ${segmentTexts.join(', ')} from text: "${originalText.substring(0, 100)}..."`);

    const segments: { text: string; startIndex: number; endIndex: number; globalStartIndex: number; globalEndIndex: number; }[] = [];

    for (const text of segmentTexts) {
        const normalizedText = text.trim();
        if (!normalizedText) continue;

        const lowerOriginalText = originalText.toLowerCase();
        const lowerSegmentText = normalizedText.toLowerCase();

        // Try exact match first (case insensitive, any position)
        let startIndex = lowerOriginalText.indexOf(lowerSegmentText);
        
        if (startIndex !== -1) {
            // Found exact match
            const endIndex = startIndex + normalizedText.length;
            const actualText = originalText.substring(startIndex, endIndex);
            
            segments.push({
                text: actualText,
                startIndex,
                endIndex,
                globalStartIndex: startIndex,
                globalEndIndex: endIndex
            });
            logger.info(`Found exact match for "${normalizedText}" at position ${startIndex}-${endIndex}`);
            continue;
        }

        // If exact match fails, try word-by-word matching
        const words = normalizedText.split(/\s+/);
        let foundAnyWord = false;
        
        for (const word of words) {
            if (!word.trim()) continue;
            
            const wordIndex = lowerOriginalText.indexOf(word.toLowerCase());
            if (wordIndex !== -1) {
                const actualText = originalText.substring(wordIndex, wordIndex + word.length);
                segments.push({
                    text: actualText,
                    startIndex: wordIndex,
                    endIndex: wordIndex + word.length,
                    globalStartIndex: wordIndex,
                    globalEndIndex: wordIndex + word.length
                });
                logger.info(`Found word match for "${word}" at position ${wordIndex}`);
                foundAnyWord = true;
                break; // Take first word match to avoid duplicates
            }
        }

        if (!foundAnyWord) {
            // Try fuzzy matching - find similar words
            const originalWords = originalText.toLowerCase().split(/\s+/);
            for (const originalWord of originalWords) {
                // Check if segment is contained in or contains the original word
                if (originalWord.includes(lowerSegmentText) || lowerSegmentText.includes(originalWord)) {
                    const wordIndex = lowerOriginalText.indexOf(originalWord);
                    if (wordIndex !== -1) {
                        const actualText = originalText.substring(wordIndex, wordIndex + originalWord.length);
                        segments.push({
                            text: actualText,
                            startIndex: wordIndex,
                            endIndex: wordIndex + originalWord.length,
                            globalStartIndex: wordIndex,
                            globalEndIndex: wordIndex + originalWord.length
                        });
                        logger.info(`Found fuzzy match for "${normalizedText}" -> "${originalWord}" at position ${wordIndex}`);
                        foundAnyWord = true;
                        break;
                    }
                }
            }
        }

        if (!foundAnyWord) {
            logger.warn(`Could not find segment "${normalizedText}" in original text`);
        }
    }

    logger.info(`Extracted ${segments.length} segments out of ${segmentTexts.length} requested`);
    return segments;
}

function extractAdvancedAcousticFeatures(patternDescription: string) {
  const primaryFeature = (patternDescription.match(/Primary Feature: ([^\n]+)/) || [])[1]?.trim();
  const secondaryFeaturesLine = (patternDescription.match(/Secondary Features: \[([^\]]+)\]/) || 
                                patternDescription.match(/Secondary Features: ([^\n]+)/) || [])[1];
  
  let secondaryFeatures: string[] = [];
  
  if (secondaryFeaturesLine) {
    // Handle both bracketed [feature1, feature2] and non-bracketed feature1, feature2 formats
    secondaryFeatures = secondaryFeaturesLine
      .replace(/^\[|\]$/g, '') // Remove brackets if present
      .split(',')
      .map(f => f.trim())
      .filter(f => f && f.toLowerCase() !== 'none' && f.toLowerCase() !== 'unknown');
  }

  return {
    primaryFeature: primaryFeature || 'unknown',
    secondaryFeatures
  };
}

interface Constellation {
  id: string;
  name: string;
  patterns: Pattern[];
  relationship: string;
}

function findConstellations(patterns: Pattern[], language: string): Constellation[] {
  const constellations: Constellation[] = [];

  // Group patterns by type
  const typeGroups = new Map<PatternType, Pattern[]>();
  patterns.forEach(pattern => {
    if (!typeGroups.has(pattern.type)) {
      typeGroups.set(pattern.type, []);
    }
    typeGroups.get(pattern.type)?.push(pattern);
  });

  // Create constellations for each significant pattern group
  typeGroups.forEach((groupPatterns, type) => {
    if (groupPatterns.length >= 2) {
      constellations.push({
        id: `constellation_${type}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Constellation`,
        patterns: groupPatterns,
        relationship: `A collection of related ${type} patterns`
      });
    }
  });

  // Find cross-type pattern relationships
  patterns.forEach(pattern => {
    const relatedPatterns = findRelatedPatterns(pattern, patterns);
    if (relatedPatterns.length >= 2) {
      constellations.push({
        id: `constellation_mixed_${pattern.id}`,
        name: 'Mixed Pattern Constellation',
        patterns: [pattern, ...relatedPatterns],
        relationship: 'Patterns that share text segments or occur in close proximity'
      });
    }
  });

  return constellations;
}

function findRelatedPatterns(pattern: Pattern, allPatterns: Pattern[]): Pattern[] {
  return allPatterns.filter(other => 
    other.id !== pattern.id && (
      // Patterns share text segments
      pattern.segments.some(seg1 => 
        other.segments.some(seg2 => 
          Math.abs(seg1.globalStartIndex - seg2.globalStartIndex) < 50
        )
      ) ||
      // Patterns have similar acoustic features
      pattern.acousticFeatures?.primaryFeature === other.acousticFeatures?.primaryFeature ||
      pattern.acousticFeatures?.secondaryFeatures.some(f1 => 
        other.acousticFeatures?.secondaryFeatures.includes(f1)
      )
    )
  );
}

function mergeAndRefinePatterns(aiPatterns: Pattern[], enhancedPatterns: Pattern[], text: string): Pattern[] {
  logger.info(`Merging patterns: AI=${aiPatterns.length}, Enhanced=${enhancedPatterns.length}`);
  
  // Create a combined list starting with AI patterns (they have explanations)
  const mergedPatterns: Pattern[] = [...aiPatterns];
  
  // Add enhanced patterns that don't overlap with AI patterns
  enhancedPatterns.forEach(enhancedPattern => {
    const hasOverlap = aiPatterns.some(aiPattern => 
      patternsOverlapSignificantly(aiPattern, enhancedPattern)
    );
    
    if (!hasOverlap) {
      // Convert enhanced pattern to match our format
      const convertedPattern: Pattern = {
        id: enhancedPattern.id,
        type: enhancedPattern.type,
        segments: enhancedPattern.segments,
        originalText: enhancedPattern.originalText,
        acousticFeatures: enhancedPattern.acousticFeatures || {
          primaryFeature: `${enhancedPattern.type}_pattern`,
          secondaryFeatures: ['enhanced_detection', 'rule_based']
        },
        confidence: 'medium' as 'high' | 'medium' | 'low',
        description: `Rule-based ${enhancedPattern.type} detection`
      };
      
      mergedPatterns.push(convertedPattern);
    }
  });
  
  // Sort by quality: AI patterns first (they have explanations), then by confidence
  const sortedPatterns = mergedPatterns.sort((a, b) => {
    // Prioritize patterns with descriptions (AI patterns)
    const aHasDescription = !!a.description;
    const bHasDescription = !!b.description;
    if (aHasDescription && !bHasDescription) return -1;
    if (!aHasDescription && bHasDescription) return 1;
    
    // Then by confidence
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    const aConfidence = confidenceOrder[a.confidence as keyof typeof confidenceOrder] || 2;
    const bConfidence = confidenceOrder[b.confidence as keyof typeof confidenceOrder] || 2;
    if (aConfidence !== bConfidence) return bConfidence - aConfidence;
    
    // Finally by segment count
    return b.segments.length - a.segments.length;
  });
  
  logger.info(`Merged result: ${sortedPatterns.length} patterns total`);
  return sortedPatterns;
}

function patternsOverlapSignificantly(pattern1: Pattern, pattern2: Pattern): boolean {
  // Check if patterns are the same type
  if (pattern1.type !== pattern2.type) return false;
  
  // Check if they share significant text segments
  const segments1 = pattern1.segments.map(s => s.text.toLowerCase());
  const segments2 = pattern2.segments.map(s => s.text.toLowerCase());
  
  const commonSegments = segments1.filter(seg1 => 
    segments2.some(seg2 => seg1 === seg2 || seg1.includes(seg2) || seg2.includes(seg1))
  );
  
  // Consider overlap significant if 50% or more segments overlap
  const overlapRatio = commonSegments.length / Math.min(segments1.length, segments2.length);
  return overlapRatio >= 0.5;
} 