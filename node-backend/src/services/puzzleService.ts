import { Pattern, Observation, Segment } from '../types/observation';
import { observationService } from './observationService';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// === PUZZLE INTERFACES ===
interface RhymeMahjongPuzzle {
  id: string;
  sourceText: string;
  observation: Observation;
  tiles: RhymeTile[];
  rhymeGroups: RhymeGroup[];
  gridDimensions: { width: number; height: number; layers: number };
  totalTiles: number;
  isDailyChallenge: boolean;
  createdAt: Date;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

interface RhymeTile {
  id: string;
  word: string;
  rhymeGroup: string;
  rhymeType: 'exact' | 'slant';
  position: { row: number; col: number; layer: number };
  isRemoved: boolean;
  isExposed: boolean;
  blockedBy: string[];
}

interface RhymeGroup {
  id: string;
  pattern: string;
  words: string[];
  rhymeType: 'exact' | 'slant';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  significance: number;
  description: string;
}

interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD format
  puzzle: RhymeMahjongPuzzle;
  sourceType: 'corpus' | 'user_generated' | 'featured';
  sourceId?: string;
  createdAt: Date;
}

// === OBSERVATORY-INTEGRATED PUZZLE SERVICE ===
export class PuzzleService {
  private dailyChallengeRef = db.collection('daily_challenges');
  private puzzleRef = db.collection('puzzles');
  private corpusPath = path.join(__dirname, '../corpus');

  /**
   * Get or generate daily challenge (cached automatically)
   */
  public async getDailyChallenge(): Promise<RhymeMahjongPuzzle> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // Check if daily challenge already exists
      const existingChallenge = await this.dailyChallengeRef
        .where('date', '==', today)
        .limit(1)
        .get();

      if (!existingChallenge.empty) {
        const challengeDoc = existingChallenge.docs[0];
        const challengeData = challengeDoc.data() as DailyChallenge;
        
        logger.info('Returning cached daily challenge', {
          date: today,
          puzzleId: challengeData.puzzle.id,
          sourceType: challengeData.sourceType
        });
        
        return challengeData.puzzle;
      }

      // Generate new daily challenge
      logger.info('Generating new daily challenge', { date: today });
      
      const sourceText = await this.selectDailyChallengeText();
      const puzzle = await this.generateRhymeMahjongPuzzle(sourceText, 'system', 'en', true);
      
      // Cache the daily challenge
      const dailyChallenge: DailyChallenge = {
        id: `daily_${today}`,
        date: today,
        puzzle,
        sourceType: 'corpus',
        createdAt: new Date()
      };

      await this.dailyChallengeRef.doc(dailyChallenge.id).set(dailyChallenge);
      
      logger.info('Created and cached new daily challenge', {
        date: today,
        puzzleId: puzzle.id,
        totalTiles: puzzle.totalTiles,
        rhymeGroups: puzzle.rhymeGroups.length
      });

      return puzzle;

    } catch (error) {
      logger.error('Error getting daily challenge', { error, date: today });
      throw new Error('Failed to get daily challenge');
    }
  }

  /**
   * Generate Rhyme Mahjong puzzle using Observatory system
   */
  public async generateRhymeMahjongPuzzle(
    sourceText: string,
    userId: string,
    language: string = 'en',
    isDailyChallenge: boolean = false
  ): Promise<RhymeMahjongPuzzle> {
    try {
      logger.info('Starting Observatory-integrated puzzle generation', {
        textLength: sourceText.length,
        userId: userId.substring(0, 8) + '...',
        language,
        isDailyChallenge
      });

      // === STEP 1: Observatory Analysis ===
      const observation = await observationService.observeText(
        sourceText,
        userId,
        language,
        {
          focusMode: 'rhyme',
          sensitivity: 'moderate'
        }
      );

      logger.info('Observatory analysis complete', {
        totalPatterns: observation.allPatterns.length,
        significantPatterns: observation.patterns.length,
        segments: observation.segments.length
      });

      // === STEP 2: Extract Rhyme Groups ===
      const rhymeGroups = this.extractObservatoryRhymeGroups(observation);
      
      if (rhymeGroups.length === 0) {
        throw new Error('No rhyme patterns found in Observatory analysis');
      }

      // === STEP 3: Generate Mahjong Layout ===
    const totalWords = rhymeGroups.reduce((sum, group) => sum + group.words.length, 0);
      const gridDimensions = this.calculateOptimalDimensions(totalWords);
      const tiles = this.generateObservatoryTileLayout(rhymeGroups, gridDimensions);
    
      // Calculate tile exposure using Mahjong rules
    this.calculateTileExposure(tiles);
    
      // === STEP 4: Determine Difficulty ===
      const difficulty = this.calculatePuzzleDifficulty(rhymeGroups, observation);

      const puzzleId = isDailyChallenge 
        ? `daily_${new Date().toISOString().split('T')[0]}`
        : `puzzle_${Date.now()}_${userId.substring(0, 8)}`;

      const puzzle: RhymeMahjongPuzzle = {
      id: puzzleId,
      sourceText,
        observation,
      tiles,
      rhymeGroups,
      gridDimensions,
        totalTiles: tiles.length,
        isDailyChallenge,
        createdAt: new Date(),
        difficulty
      };

      // Save puzzle for corpus building
      if (!isDailyChallenge) {
        await this.savePuzzleForCorpus(puzzle, userId);
      }

      logger.info('Observatory-integrated puzzle generated successfully', {
      puzzleId,
      rhymeGroups: rhymeGroups.length,
      totalTiles: tiles.length,
        difficulty,
      dimensions: gridDimensions
    });
    
      return puzzle;

    } catch (error) {
      logger.error('Error generating Observatory puzzle', { error, userId });
      throw error;
    }
  }

  /**
   * Extract rhyme groups from Observatory analysis
   */
  private extractObservatoryRhymeGroups(observation: Observation): RhymeGroup[] {
    const rhymeGroups: RhymeGroup[] = [];
    
    // Focus on rhyme and slant_rhyme patterns
    const rhymePatterns = observation.allPatterns.filter(p => 
      p.type === 'rhyme' || p.type === 'slant_rhyme'
    );
    
    rhymePatterns.forEach((pattern, index) => {
      const words = this.extractWordsFromObservatoryPattern(pattern, observation.segments);
      
      if (words.length >= 2) {
        const rhymeSound = this.extractRhymeSoundFromPattern(pattern);
        
        rhymeGroups.push({
          id: `rhyme_group_${index}`,
          pattern: rhymeSound,
          words,
          rhymeType: pattern.type === 'rhyme' ? 'exact' : 'slant',
          difficulty: this.getPatternDifficulty(pattern.type, pattern.significance || 0.5),
          significance: pattern.significance || 0.5,
          description: pattern.description || `${pattern.type} pattern: ${rhymeSound}`
        });
      }
    });
    
    // Sort by significance for better gameplay
    return rhymeGroups.sort((a, b) => b.significance - a.significance);
  }

  /**
   * Extract words from Observatory pattern using actual segments
   */
  private extractWordsFromObservatoryPattern(pattern: Pattern, segments: Segment[]): string[] {
    const words: string[] = [];
    
    pattern.segments.forEach(segmentId => {
      const segment = segments.find(s => s.id === segmentId);
      if (segment && segment.text.length > 1) {
        words.push(segment.text.toLowerCase().replace(/[^a-z]/g, ''));
      }
    });

    // Remove duplicates and filter out empty/short words
    return [...new Set(words)].filter(word => word.length > 1);
  }

  /**
   * Extract rhyme sound from pattern's acoustic features
   */
  private extractRhymeSoundFromPattern(pattern: Pattern): string {
    if (pattern.acousticFeatures?.primaryFeature) {
      // Try to extract phonetic notation
      const phoneticMatch = pattern.acousticFeatures.primaryFeature.match(/\/([^\/]+)\//);
      if (phoneticMatch) {
        return phoneticMatch[1];
      }
      
      // Fallback to feature description
      return pattern.acousticFeatures.primaryFeature;
    }
    
    return pattern.type;
  }

  /**
   * Calculate puzzle difficulty based on Observatory analysis
   */
  private calculatePuzzleDifficulty(rhymeGroups: RhymeGroup[], observation: Observation): 'easy' | 'medium' | 'hard' | 'expert' {
    const avgSignificance = rhymeGroups.reduce((sum, group) => sum + group.significance, 0) / rhymeGroups.length;
    const hasSlantRhymes = rhymeGroups.some(group => group.rhymeType === 'slant');
    const totalWords = rhymeGroups.reduce((sum, group) => sum + group.words.length, 0);
    
    // Expert: High complexity patterns, many slant rhymes
    if (avgSignificance > 0.8 && hasSlantRhymes && totalWords > 40) {
      return 'expert';
    }
    
    // Hard: Complex patterns or many slant rhymes
    if (avgSignificance > 0.6 || (hasSlantRhymes && totalWords > 30)) {
      return 'hard';
    }
    
    // Medium: Mix of exact and slant rhymes, moderate complexity
    if (avgSignificance > 0.4 || totalWords > 20) {
      return 'medium';
    }
    
    // Easy: Simple exact rhymes, low word count
    return 'easy';
  }

  /**
   * Generate optimized tile layout using Observatory data
   */
  private generateObservatoryTileLayout(rhymeGroups: RhymeGroup[], dimensions: { width: number; height: number; layers: number }): RhymeTile[] {
    const tiles: RhymeTile[] = [];
    let tileId = 0;
    
    // Distribute words across layers with strategic placement
    for (let layer = 0; layer < dimensions.layers; layer++) {
      const layerSize = this.calculateLayerSize(dimensions, layer);
      const wordsForLayer = this.selectWordsForLayer(rhymeGroups, layer, layerSize.totalSlots);
      
      let wordIndex = 0;
      for (let row = layerSize.startRow; row < layerSize.endRow; row++) {
        for (let col = layerSize.startCol; col < layerSize.endCol; col++) {
          if (wordIndex < wordsForLayer.length) {
            const wordData = wordsForLayer[wordIndex];
            tiles.push({
              id: `tile_${tileId++}`,
              word: wordData.word,
              rhymeGroup: wordData.rhymeGroup,
              rhymeType: wordData.rhymeType,
              position: { row, col, layer },
              isRemoved: false,
              isExposed: false,
              blockedBy: []
            });
            wordIndex++;
          }
        }
      }
    }
    
    // Shuffle for gameplay variety
    return this.shuffleArrayInPlace(tiles);
  }

  /**
   * Calculate optimal dimensions based on word count and complexity
   */
  private calculateOptimalDimensions(totalWords: number): { width: number; height: number; layers: number } {
    if (totalWords <= 16) return { width: 5, height: 4, layers: 2 };
    if (totalWords <= 30) return { width: 6, height: 5, layers: 3 };
    if (totalWords <= 48) return { width: 7, height: 6, layers: 3 };
    if (totalWords <= 72) return { width: 8, height: 7, layers: 4 };
    return { width: 9, height: 7, layers: 4 };
  }

  /**
   * Calculate layer size for pyramid structure
   */
  private calculateLayerSize(dimensions: { width: number; height: number; layers: number }, layer: number) {
    const shrinkFactor = layer * 0.25; // Gentler pyramid
    const layerWidth = Math.max(3, Math.floor(dimensions.width - shrinkFactor * 2));
    const layerHeight = Math.max(3, Math.floor(dimensions.height - shrinkFactor));
    
    const startRow = Math.floor((dimensions.height - layerHeight) / 2);
    const startCol = Math.floor((dimensions.width - layerWidth) / 2);
    
    return {
      startRow,
      endRow: startRow + layerHeight,
      startCol,
      endCol: startCol + layerWidth,
      totalSlots: layerWidth * layerHeight
    };
  }

  /**
   * Select words for layer with strategic distribution
   */
  private selectWordsForLayer(rhymeGroups: RhymeGroup[], layer: number, slots: number): Array<{ word: string; rhymeGroup: string; rhymeType: 'exact' | 'slant' }> {
    const words: Array<{ word: string; rhymeGroup: string; rhymeType: 'exact' | 'slant' }> = [];
    
    // Distribute words evenly across rhyme groups
    let groupIndex = 0;
    let wordIndexInGroup = 0;
    
    while (words.length < slots && groupIndex < rhymeGroups.length) {
      const group = rhymeGroups[groupIndex];
      
      if (wordIndexInGroup < group.words.length) {
        words.push({
          word: group.words[wordIndexInGroup],
          rhymeGroup: group.id,
          rhymeType: group.rhymeType
        });
        wordIndexInGroup++;
      } else {
        groupIndex++;
        wordIndexInGroup = 0;
      }
    }
    
    return words.slice(0, slots);
  }

  /**
   * Calculate tile exposure using Mahjong rules
   */
  private calculateTileExposure(tiles: RhymeTile[]): void {
    tiles.forEach(tile => {
      if (tile.isRemoved) {
        tile.isExposed = false;
        return;
      }
      
      const blockingTiles = tiles.filter(other => 
        other.position.layer > tile.position.layer &&
        this.isPositionBlocking(other.position, tile.position) &&
        !other.isRemoved
      );
      
      tile.isExposed = blockingTiles.length === 0;
      tile.blockedBy = blockingTiles.map(t => t.id);
    });
  }

  /**
   * Check if upper tile blocks lower tile
   */
  private isPositionBlocking(upperPos: { row: number; col: number; layer: number }, lowerPos: { row: number; col: number; layer: number }): boolean {
    const rowOverlap = Math.abs(upperPos.row - lowerPos.row) <= 1;
    const colOverlap = Math.abs(upperPos.col - lowerPos.col) <= 1;
    return rowOverlap && colOverlap;
  }

  /**
   * Select daily challenge text from corpus
   */
  private async selectDailyChallengeText(): Promise<string> {
    try {
      const corpusFiles = ['nursery_rhymes.txt', 'tongue_twisters.txt', 'classics.txt'];
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      // Deterministic selection based on day of year
      const selectedFile = corpusFiles[dayOfYear % corpusFiles.length];
      const filePath = path.join(this.corpusPath, selectedFile);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const segments = content.split('\n').filter(line => line.trim().length > 50);
      
      if (segments.length === 0) {
        throw new Error('No suitable content found in corpus');
      }
      
      // Select segment based on day
      const selectedSegment = segments[dayOfYear % segments.length];
      
      logger.info('Selected daily challenge text', {
        file: selectedFile,
        segmentIndex: dayOfYear % segments.length,
        textLength: selectedSegment.length
      });
      
      return selectedSegment;
      
    } catch (error) {
      logger.error('Error selecting daily challenge text', { error });
      // Fallback to default content
      return "She sells seashells by the seashore. The shells she sells are surely seashells.";
    }
  }

  /**
   * Save puzzle for corpus building
   */
  private async savePuzzleForCorpus(puzzle: RhymeMahjongPuzzle, userId: string): Promise<void> {
    try {
      await this.puzzleRef.doc(puzzle.id).set({
        ...puzzle,
        userId,
        createdAt: Timestamp.fromDate(puzzle.createdAt),
        // Remove observation object to save space, keep just the IDs we need
        observationId: puzzle.observation.id,
        observation: undefined
      });
      
      logger.info('Puzzle saved for corpus building', {
        puzzleId: puzzle.id,
        userId: userId.substring(0, 8) + '...',
        difficulty: puzzle.difficulty
      });
    } catch (error) {
      logger.warn('Failed to save puzzle for corpus', { error, puzzleId: puzzle.id });
    }
  }

  /**
   * Get pattern difficulty based on type and significance
   */
  private getPatternDifficulty(patternType: string, significance: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (patternType === 'alliteration' && significance < 0.6) return 'easy';
    if (patternType === 'rhyme' && significance < 0.7) return 'medium';
    if (patternType === 'slant_rhyme') return 'hard';
    if (significance > 0.8) return 'expert';
    
    return 'medium';
  }

  /**
   * Utility: In-place array shuffle
   */
  private shuffleArrayInPlace<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Validate rhyme match for gameplay
   */
  public validateRhymeMatch(tile1: RhymeTile, tile2: RhymeTile): boolean {
    // Exact match: same rhyme group
    if (tile1.rhymeGroup === tile2.rhymeGroup) {
      return true;
    }
    
    // Allow cross-matching exact and slant rhymes if they share sound patterns
    // This would need more sophisticated logic using Observatory data
    return false;
  }

  /**
   * Get puzzle statistics for corpus analysis
   */
  public async getPuzzleStatistics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalPuzzles: number;
    averageDifficulty: string;
    popularPatterns: Array<{ type: string; count: number }>;
    userEngagement: number;
  }> {
    try {
      const now = new Date();
      const startTime = new Date();
      
      switch (timeframe) {
        case 'day':
          startTime.setDate(now.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(now.getDate() - 7);
          break;
        case 'month':
          startTime.setMonth(now.getMonth() - 1);
          break;
      }

      const puzzles = await this.puzzleRef
        .where('createdAt', '>=', Timestamp.fromDate(startTime))
        .get();

      const stats = {
        totalPuzzles: puzzles.size,
        averageDifficulty: 'medium',
        popularPatterns: [] as Array<{ type: string; count: number }>,
        userEngagement: 0.85 // Placeholder
      };

      logger.info('Generated puzzle statistics', { timeframe, ...stats });
      return stats;
      
    } catch (error) {
      logger.error('Error generating puzzle statistics', { error, timeframe });
      throw error;
    }
  }
}

// Export singleton instance
export const puzzleService = new PuzzleService();
export default puzzleService; 