import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  difficulty: number;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  sourceText: string;
  analysisResult: any;
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
}

export interface GameVariant {
  gridSize: '4x4' | '8x8';
  targetWords: string[];
  decoyWords: string[];
  timeLimit: number;
  strikes: number;
  bonusPoints: number;
}

export interface WeeklyPack {
  packId: string;
  bundles: GeneratedContentBundle[];
  weekStart: Date;
  theme: string;
}

export interface CulturalSeries {
  seriesId: string;
  bundles: GeneratedContentBundle[];
  culture: string;
  difficulty: number;
}

class AIContentService {
  private static instance: AIContentService;

  public static getInstance(): AIContentService {
    if (!AIContentService.instance) {
      AIContentService.instance = new AIContentService();
    }
    return AIContentService.instance;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get daily AI-generated content for user
   */
  public async getDailyContent(userLevel: number, isPremium: boolean = false): Promise<GeneratedContentBundle> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/daily`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userLevel, isPremium })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get daily content:', error);
      throw error;
    }
  }

  /**
   * Generate weekly premium pack
   */
  public async generateWeeklyPack(theme: string = 'progressive', weekStart?: Date): Promise<WeeklyPack> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/weekly-pack`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ theme, weekStart: weekStart?.toISOString() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to generate weekly pack:', error);
      throw error;
    }
  }

  /**
   * Generate cultural series pack
   */
  public async generateCulturalSeries(culture: string, difficulty: number = 5): Promise<CulturalSeries> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/cultural-series`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ culture, difficulty })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to generate cultural series:', error);
      throw error;
    }
  }

  /**
   * Get available premium content bundles
   */
  public async getPremiumBundles(theme?: string): Promise<GeneratedContentBundle[]> {
    try {
      const headers = await this.getAuthHeaders();
      const params = theme ? `?theme=${encodeURIComponent(theme)}` : '';
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/premium-bundles${params}`, {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get premium bundles:', error);
      throw error;
    }
  }

  /**
   * Get content progression information
   */
  public async getContentProgression(userLevel?: number): Promise<{
    progression: ContentLevel[];
    totalLevels: number;
    currentUserLevel: number;
  }> {
    try {
      const params = userLevel ? `?userLevel=${userLevel}` : '';
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/progression${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get content progression:', error);
      throw error;
    }
  }

  /**
   * Track challenge completion for analytics
   */
  public async trackChallengeCompletion(
    bundleId: string,
    success: boolean,
    accuracy: number,
    timeElapsed: number,
    difficulty: number
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/ai-content/track-completion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bundleId,
          success,
          accuracy,
          timeElapsed,
          difficulty
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to track challenge completion:', error);
      // Don't throw error for analytics tracking - it's not critical
    }
  }

  /**
   * Convert AI content bundle to FlowFinder challenge format
   */
  public convertBundleToChallenge(bundle: GeneratedContentBundle, variant: GameVariant): any {
    return {
      id: `ai_${bundle.id}_${Date.now()}`,
      type: this.mapPatternTypeToGameType(bundle.patternType),
      gridSize: variant.gridSize,
      text: this.generateChallengeText(bundle),
      patterns: this.convertPatternsToFlowFinderFormat(bundle.extractedPatterns),
      targetWords: variant.targetWords,
      grid: this.generateGameGrid(variant.targetWords, variant.decoyWords, variant.gridSize),
      timeLimit: variant.timeLimit,
      completed: false,
      tokensReward: variant.bonusPoints,
      xpReward: variant.bonusPoints * 2,
      difficulty: variant.gridSize,
      createdAt: new Date(),
      aiGenerated: true,
      sourceBundle: bundle.id,
      culturalContext: bundle.culturalContext
    };
  }

  private mapPatternTypeToGameType(patternType: string): string {
    const mapping: { [key: string]: string } = {
      'rhyme': 'rhyme_hunter',
      'alliteration': 'alliteration_alert',
      'consonance': 'consonance_challenge',
      'internal_rhyme': 'rhyme_hunter',
      'multicultural': 'cultural_crossover'
    };
    return mapping[patternType] || 'rhyme_hunter';
  }

  private generateChallengeText(bundle: GeneratedContentBundle): string {
    const complexityTexts = {
      'basic': `Find the ${bundle.patternType} patterns! 🎵`,
      'intermediate': `Discover rhythmic ${bundle.patternType} connections 🎶`,
      'advanced': `Master sophisticated ${bundle.patternType} patterns 🎼`,
      'expert': `Navigate complex multicultural sound patterns 🌍`
    };

    let baseText = complexityTexts['basic']; // Default
    
    // Find the complexity from the source bundle
    if (bundle.extractedPatterns.length > 0) {
      const avgDifficulty = bundle.extractedPatterns.reduce((sum, p) => sum + p.difficulty, 0) / bundle.extractedPatterns.length;
      if (avgDifficulty > 8) baseText = complexityTexts['expert'];
      else if (avgDifficulty > 6) baseText = complexityTexts['advanced'];
      else if (avgDifficulty > 4) baseText = complexityTexts['intermediate'];
    }

    if (bundle.culturalContext) {
      baseText += ` Inspired by ${bundle.culturalContext} traditions.`;
    }

    return baseText;
  }

  private convertPatternsToFlowFinderFormat(patterns: ContentPattern[]): Array<{ word: string; type: string; position: number }> {
    const flowFinderPatterns: Array<{ word: string; type: string; position: number }> = [];
    
    patterns.forEach(pattern => {
      pattern.words.forEach((word, index) => {
        flowFinderPatterns.push({
          word,
          type: pattern.patternType,
          position: index
        });
      });
    });

    return flowFinderPatterns;
  }

  private generateGameGrid(targetWords: string[], decoyWords: string[], gridSize: '4x4' | '8x8'): string[][] {
    const size = gridSize === '4x4' ? 4 : 8;
    const totalCells = size * size;
    
    // Combine target and decoy words
    const allWords = [...targetWords, ...decoyWords].slice(0, totalCells);
    
    // Shuffle the words
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    // Fill grid
    const grid: string[][] = [];
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        grid[row][col] = allWords[index] || 'empty';
      }
    }

    return grid;
  }

  /**
   * Get AI content progression for user education
   */
  public async getUserProgressionPath(userLevel: number): Promise<{
    currentLevel: ContentLevel | null;
    nextLevel: ContentLevel | null;
    progressToNext: number;
  }> {
    try {
      const progressionData = await this.getContentProgression(userLevel);
      const current = progressionData.progression.find(level => level.level <= userLevel);
      const next = progressionData.progression.find(level => level.level > userLevel);
      
      const progressToNext = current && next ? 
        ((userLevel - current.level) / (next.level - current.level)) * 100 : 100;

      return {
        currentLevel: current || null,
        nextLevel: next || null,
        progressToNext: Math.min(100, Math.max(0, progressToNext))
      };
    } catch (error) {
      console.error('Failed to get user progression path:', error);
      return {
        currentLevel: null,
        nextLevel: null,
        progressToNext: 0
      };
    }
  }
}

export const aiContentService = AIContentService.getInstance(); 