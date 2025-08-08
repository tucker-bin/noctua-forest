import { logger } from '../utils/logger';
import { RhymeTile, RhymeGroup, RhymeMahjongPuzzle } from './stackedLayoutGenerator';

export interface MatchValidationResult {
  isValid: boolean;
  matchType: 'exact' | 'slant' | 'invalid';
  score: number;
  message: string;
  tiles: RhymeTile[];
}

export interface GameState {
  tiles: RhymeTile[];
  selectedTiles: RhymeTile[];
  completedMatches: string[][];
  mistakes: number;
  hintsUsed: number;
  startTime: number;
  isComplete: boolean;
  currentScore: number;
}

export interface HintResult {
  type: 'match' | 'exposure' | 'none';
  message: string;
  highlightedTiles: string[];
  cost: number;
}

export class RhymeMatchingEngine {
  private gameState: GameState;
  private puzzle: RhymeMahjongPuzzle;
  private readonly EXACT_RHYME_SCORE = 100;
  private readonly SLANT_RHYME_SCORE = 75;
  private readonly HINT_PENALTY = 50;

  constructor(puzzle: RhymeMahjongPuzzle) {
    this.puzzle = puzzle;
    this.gameState = {
      tiles: puzzle.tiles,
      selectedTiles: [],
      completedMatches: [],
      mistakes: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      isComplete: false,
      currentScore: 0
    };
    
    logger.info('RhymeMatchingEngine initialized', {
      puzzleId: puzzle.id,
      totalTiles: puzzle.tiles.length,
      rhymeGroups: puzzle.rhymeGroups.length
    });
  }

  /**
   * Initialize game with tiles
   */
  public initializeGame(tiles: RhymeTile[]): void {
    this.gameState = {
      tiles: tiles,
      selectedTiles: [],
      completedMatches: [],
      mistakes: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      isComplete: false,
      currentScore: 0
    };
    
    logger.info('Game initialized with tiles', { tileCount: tiles.length });
  }

  /**
   * Process a match between two tiles
   */
  public processMatch(tileIds: string[], allTiles: RhymeTile[]): { isValid: boolean; pointsAwarded: number } {
    const tiles = tileIds.map(id => allTiles.find(tile => tile.id === id)).filter(Boolean) as RhymeTile[];
    
    if (tiles.length !== 2) {
      return { isValid: false, pointsAwarded: 0 };
    }

    const matchResult = this.validateMatch(tiles);
    
    if (matchResult.isValid) {
      this.processValidMatch(matchResult);
      return { isValid: true, pointsAwarded: matchResult.score };
    } else {
      this.processInvalidMatch();
      return { isValid: false, pointsAwarded: 0 };
    }
  }

  /**
   * Select a tile for matching
   */
  public selectTile(tileId: string): {
    success: boolean;
    message: string;
    matchResult?: MatchValidationResult;
    gameState: GameState;
  } {
    const tile = this.gameState.tiles.find(t => t.id === tileId);
    
    if (!tile) {
      return {
        success: false,
        message: 'Tile not found',
        gameState: this.gameState
      };
    }

    // Check if tile can be selected (Mahjong rules)
    if (!this.canSelectTile(tile)) {
      return {
        success: false,
        message: 'This tile is blocked and cannot be selected',
        gameState: this.gameState
      };
    }

    // If tile is already selected, deselect it
    if (this.gameState.selectedTiles.some(t => t.id === tileId)) {
      this.deselectTile(tileId);
      return {
        success: true,
        message: 'Tile deselected',
        gameState: this.gameState
      };
    }

    // Add to selection
    this.gameState.selectedTiles.push(tile);
    this.updateTileState(tileId, { isSelected: true, animationState: 'selecting' });

    // Check if we have a pair to validate
    if (this.gameState.selectedTiles.length === 2) {
      const matchResult = this.validateMatch(this.gameState.selectedTiles);
      
      if (matchResult.isValid) {
        this.processValidMatch(matchResult);
        return {
          success: true,
          message: `Great match! ${matchResult.message}`,
          matchResult,
          gameState: this.gameState
        };
      } else {
        this.processInvalidMatch();
        return {
          success: false,
          message: 'Those tiles don\'t rhyme. Try again!',
          matchResult,
          gameState: this.gameState
        };
      }
    }

    return {
      success: true,
      message: 'Tile selected. Choose another tile to match.',
      gameState: this.gameState
    };
  }

  /**
   * Check if a tile can be selected (Mahjong exposure rules)
   */
  private canSelectTile(tile: RhymeTile): boolean {
    if (tile.isRemoved) return false;
    return tile.isExposed;
  }

  /**
   * Deselect a tile
   */
  private deselectTile(tileId: string): void {
    this.gameState.selectedTiles = this.gameState.selectedTiles.filter(t => t.id !== tileId);
    this.updateTileState(tileId, { isSelected: false, animationState: 'idle' });
  }

  /**
   * Validate if two selected tiles can be matched
   */
  private validateMatch(selectedTiles: RhymeTile[]): MatchValidationResult {
    if (selectedTiles.length !== 2) {
      return {
        isValid: false,
        matchType: 'invalid',
        score: 0,
        message: 'Select exactly two tiles to match',
        tiles: selectedTiles
      };
    }

    const [tile1, tile2] = selectedTiles;

    // Check if tiles are from the same rhyme group
    if (tile1.rhymeGroup !== tile2.rhymeGroup) {
      return {
        isValid: false,
        matchType: 'invalid',
        score: 0,
        message: 'These words don\'t rhyme',
        tiles: selectedTiles
      };
    }

    // Determine match type and score
    const matchType = this.getMatchType(tile1, tile2);
    const score = matchType === 'exact' ? this.EXACT_RHYME_SCORE : this.SLANT_RHYME_SCORE;
    
    return {
      isValid: true,
      matchType,
      score,
      message: `${matchType === 'exact' ? 'Perfect' : 'Slant'} rhyme match!`,
      tiles: selectedTiles
    };
  }

  /**
   * Determine the type of match between two tiles
   */
  private getMatchType(tile1: RhymeTile, tile2: RhymeTile): 'exact' | 'slant' {
    // If both tiles are marked as exact rhymes, it's an exact match
    if (tile1.rhymeType === 'exact' && tile2.rhymeType === 'exact') {
      return 'exact';
    }
    
    // If either tile is a slant rhyme, it's a slant match
    return 'slant';
  }

  /**
   * Process a valid match
   */
  private processValidMatch(matchResult: MatchValidationResult): void {
    const tileIds = matchResult.tiles.map(t => t.id);
    
    // Mark tiles as matched and removing
    matchResult.tiles.forEach(tile => {
      this.updateTileState(tile.id, {
        isSelected: false,
        animationState: 'matched'
      });
    });

    // Add to completed matches
    this.gameState.completedMatches.push(tileIds);
    
    // Update score
    this.gameState.currentScore += matchResult.score;
    
    // Remove tiles after animation
    setTimeout(() => {
      this.removeTiles(tileIds);
    }, 500);

    // Clear selection
    this.gameState.selectedTiles = [];
    
    logger.info('Valid match processed', {
      matchType: matchResult.matchType,
      score: matchResult.score,
      tilesMatched: tileIds
    });
  }

  /**
   * Process an invalid match attempt
   */
  private processInvalidMatch(): void {
    // Increment mistakes
    this.gameState.mistakes++;
    
    // Deselect tiles with error animation
    this.gameState.selectedTiles.forEach(tile => {
      this.updateTileState(tile.id, {
        isSelected: false,
        animationState: 'idle'
      });
    });
    
    // Clear selection
    this.gameState.selectedTiles = [];
    
    logger.info('Invalid match attempt', {
      mistakes: this.gameState.mistakes,
      selectedTiles: this.gameState.selectedTiles.map(t => t.word)
    });
  }

  /**
   * Remove tiles from the game board
   */
  private removeTiles(tileIds: string[]): void {
    tileIds.forEach(tileId => {
      this.updateTileState(tileId, {
        isRemoved: true,
        animationState: 'removing'
      });
    });

    // Update exposure states for remaining tiles
    this.updateAllTileExposure();
    
    // Check if game is complete
    this.checkGameCompletion();
  }

  /**
   * Update exposure states for all tiles
   */
  private updateAllTileExposure(): void {
    this.gameState.tiles.forEach(tile => {
      if (!tile.isRemoved) {
        const isExposed = this.isTileExposed(tile);
        if (isExposed !== tile.isExposed) {
          this.updateTileState(tile.id, {
            isExposed,
            animationState: isExposed ? 'exposing' : 'idle'
          });
        }
      }
    });
  }

  /**
   * Check if a tile is exposed (Mahjong rules)
   */
  private isTileExposed(targetTile: RhymeTile): boolean {
    if (targetTile.isRemoved) return false;

    // Check if any tiles are blocking this tile
    for (const tile of this.gameState.tiles) {
      if (tile.isRemoved || tile.id === targetTile.id) continue;

      if (this.isPositionBlocking(tile.position, targetTile.position)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if upperPos blocks lowerPos
   */
  private isPositionBlocking(
    upperPos: { row: number; col: number; layer: number },
    lowerPos: { row: number; col: number; layer: number }
  ): boolean {
    // Only tiles on higher layers can block
    if (upperPos.layer <= lowerPos.layer) return false;

    // Check if positions overlap
    const rowOverlap = Math.abs(upperPos.row - lowerPos.row) <= 1;
    const colOverlap = Math.abs(upperPos.col - lowerPos.col) <= 1;

    return rowOverlap && colOverlap;
  }

  /**
   * Update a tile's state
   */
  private updateTileState(tileId: string, updates: Partial<RhymeTile>): void {
    const tileIndex = this.gameState.tiles.findIndex(t => t.id === tileId);
    if (tileIndex !== -1) {
      this.gameState.tiles[tileIndex] = {
        ...this.gameState.tiles[tileIndex],
        ...updates
      };
    }
  }

  /**
   * Check if the game is complete
   */
  private checkGameCompletion(): void {
    const remainingTiles = this.gameState.tiles.filter(t => !t.isRemoved);
    
    if (remainingTiles.length === 0) {
      this.gameState.isComplete = true;
      logger.info('Game completed!', {
        finalScore: this.gameState.currentScore,
        mistakes: this.gameState.mistakes,
        hintsUsed: this.gameState.hintsUsed,
        duration: Date.now() - this.gameState.startTime
      });
    }
  }

  /**
   * Provide a hint to the player
   */
  public getHint(): HintResult {
    this.gameState.hintsUsed++;
    
    // Find an exposed tile that has a match
    const exposedTiles = this.gameState.tiles.filter(t => !t.isRemoved && t.isExposed);
    
    for (const tile of exposedTiles) {
      const matchableTiles = this.findMatchableTiles(tile);
      if (matchableTiles.length > 0) {
        const matchTile = matchableTiles[0];
        
        return {
          type: 'match',
          message: `Try matching "${tile.word}" with "${matchTile.word}"`,
          highlightedTiles: [tile.id, matchTile.id],
          cost: this.HINT_PENALTY
        };
      }
    }

    // If no matches available, suggest focusing on exposing tiles
    const blockedTiles = this.gameState.tiles.filter(t => !t.isRemoved && !t.isExposed);
    if (blockedTiles.length > 0) {
      return {
        type: 'exposure',
        message: 'Focus on removing tiles from higher layers to expose more options',
        highlightedTiles: [],
        cost: this.HINT_PENALTY
      };
    }

    return {
      type: 'none',
      message: 'No hints available',
      highlightedTiles: [],
      cost: 0
    };
  }

  /**
   * Find all tiles that can match with the given tile
   */
  private findMatchableTiles(tile: RhymeTile): RhymeTile[] {
    return this.gameState.tiles.filter(t => 
      t.id !== tile.id &&
      !t.isRemoved &&
      t.isExposed &&
      t.rhymeGroup === tile.rhymeGroup
    );
  }

  /**
   * Calculate star rating based on performance
   */
  public calculateStarRating(): number {
    if (this.gameState.hintsUsed >= 2) return 0;
    if (this.gameState.hintsUsed === 1) return Math.max(0, 3 - 2);
    
    if (this.gameState.mistakes === 0) return 3;
    if (this.gameState.mistakes <= 2) return 2;
    if (this.gameState.mistakes === 3) return 1;
    return 0;
  }

  /**
   * Get current game statistics
   */
  public getGameStats(): {
    totalTiles: number;
    remainingTiles: number;
    completedMatches: number;
    mistakes: number;
    hintsUsed: number;
    currentScore: number;
    progress: number;
    starRating: number;
    isComplete: boolean;
  } {
    const totalTiles = this.gameState.tiles.length;
    const remainingTiles = this.gameState.tiles.filter(t => !t.isRemoved).length;
    const progress = totalTiles > 0 ? ((totalTiles - remainingTiles) / totalTiles) * 100 : 0;
    
    return {
      totalTiles,
      remainingTiles,
      completedMatches: this.gameState.completedMatches.length,
      mistakes: this.gameState.mistakes,
      hintsUsed: this.gameState.hintsUsed,
      currentScore: this.gameState.currentScore,
      progress,
      starRating: this.calculateStarRating(),
      isComplete: this.gameState.isComplete
    };
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    this.gameState = {
      tiles: this.puzzle.tiles.map(tile => ({
        ...tile,
        isSelected: false,
        isHighlighted: false,
        animationState: 'idle'
      })),
      selectedTiles: [],
      completedMatches: [],
      mistakes: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      isComplete: false,
      currentScore: 0
    };
    
    // Recalculate initial exposure states
    this.updateAllTileExposure();
    
    logger.info('Game reset', { puzzleId: this.puzzle.id });
  }
}

export default RhymeMatchingEngine; 