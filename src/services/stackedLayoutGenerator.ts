import { logger } from '../utils/logger';

// Types for Rhyme Mahjong (matching backend)
export interface RhymeTile {
  id: string;
  word: string;
  rhymeGroup: string;
  rhymeType: 'exact' | 'slant';
  position: {
    row: number;
    col: number;
    layer: number;
  };
  isRemoved: boolean;
  isExposed: boolean;
  blockedBy: string[];
  // Frontend-specific properties
  visualPosition: {
    x: number;
    y: number;
    z: number;
  };
  isSelected: boolean;
  isHighlighted: boolean;
  animationState: 'idle' | 'selecting' | 'matched' | 'removing' | 'exposing';
}

export interface RhymeGroup {
  id: string;
  pattern: string;
  words: string[];
  rhymeType: 'exact' | 'slant';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  significance: number;
}

export interface RhymeMahjongPuzzle {
  id: string;
  sourceText: string;
  tiles: RhymeTile[];
  rhymeGroups: RhymeGroup[];
  gridDimensions: { width: number; height: number; layers: number };
  totalTiles: number;
}

export interface StackedLayoutConfig {
  tileSize: number;
  tileGap: number;
  layerOffset: { x: number; y: number; z: number };
  containerWidth: number;
  containerHeight: number;
  perspective: number;
  rotationX: number;
  rotationY: number;
}

// Traditional Mahjong layout patterns
const MAHJONG_LAYOUTS = {
  turtle: [
    // Layer 0 (base) - 14x8 grid with turtle shape
    [
      "    XXXX    ",
      "  XXXXXXXX  ",
      " XXXXXXXXXX ",
      "XXXXXXXXXXXX",
      "XXXXXXXXXXXX",
      "XXXXXXXXXXXX",
      " XXXXXXXXXX ",
      "  XXXXXXXX  "
    ],
    // Layer 1 - smaller middle section
    [
      "            ",
      "   XXXXXX   ",
      "  XXXXXXXX  ",
      " XXXXXXXXXX ",
      " XXXXXXXXXX ",
      "  XXXXXXXX  ",
      "   XXXXXX   ",
      "            "
    ],
    // Layer 2 - top layer
    [
      "            ",
      "            ",
      "    XXXX    ",
      "   XXXXXX   ",
      "   XXXXXX   ",
      "    XXXX    ",
      "            ",
      "            "
    ],
    // Layer 3 - peak
    [
      "            ",
      "            ",
      "            ",
      "     XX     ",
      "     XX     ",
      "            ",
      "            ",
      "            "
    ]
  ],
  pyramid: [
    // Layer 0 (base) - 12x8 grid
    [
      "  XXXXXXXX  ",
      " XXXXXXXXXX ",
      "XXXXXXXXXXXX",
      "XXXXXXXXXXXX",
      "XXXXXXXXXXXX",
      "XXXXXXXXXXXX",
      " XXXXXXXXXX ",
      "  XXXXXXXX  "
    ],
    // Layer 1
    [
      "            ",
      "   XXXXXX   ",
      "  XXXXXXXX  ",
      " XXXXXXXXXX ",
      " XXXXXXXXXX ",
      "  XXXXXXXX  ",
      "   XXXXXX   ",
      "            "
    ],
    // Layer 2
    [
      "            ",
      "            ",
      "    XXXX    ",
      "   XXXXXX   ",
      "   XXXXXX   ",
      "    XXXX    ",
      "            ",
      "            "
    ]
  ],
  simple: [
    // Layer 0 - simple rectangular base
    [
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX"
    ],
    // Layer 1 - smaller rectangle
    [
      "  XXXXXX  ",
      " XXXXXXXX ",
      " XXXXXXXX ",
      " XXXXXXXX ",
      "  XXXXXX  ",
      "          "
    ],
    // Layer 2 - top
    [
      "          ",
      "   XXXX   ",
      "   XXXX   ",
      "   XXXX   ",
      "          ",
      "          "
    ]
  ]
};

export class StackedLayoutGenerator {
  private config: StackedLayoutConfig;
  private layoutPattern: string[][];

  constructor(config?: Partial<StackedLayoutConfig>) {
    this.config = {
      tileSize: 60,
      tileGap: 2,
      layerOffset: { x: -4, y: -4, z: 8 },
      containerWidth: 800,
      containerHeight: 600,
      perspective: 1200,
      rotationX: 20,
      rotationY: 0,
      ...config
    };
    
    // Default to turtle layout
    this.layoutPattern = MAHJONG_LAYOUTS.turtle;
  }

  /**
   * Generate a traditional Mahjong layout puzzle
   */
  public generateMahjongLayout(rhymeGroups: RhymeGroup[], layoutType: 'turtle' | 'pyramid' | 'simple' = 'turtle'): RhymeMahjongPuzzle {
    this.layoutPattern = MAHJONG_LAYOUTS[layoutType];
    
    // Count available positions
    const positions = this.getAvailablePositions();
    const totalPositions = positions.length;
    
    // Create tiles from rhyme groups
    const tiles: RhymeTile[] = [];
    let tileId = 0;
    
    // Ensure we have pairs of tiles for matching
    const allWords: string[] = [];
    rhymeGroups.forEach(group => {
      // Add each word twice to create pairs
      group.words.forEach(word => {
        allWords.push(word, word);
      });
    });
    
    // Shuffle words and place them in positions
    const shuffledWords = this.shuffleArray(allWords);
    
    positions.forEach((pos, index) => {
      if (index < shuffledWords.length) {
        const word = shuffledWords[index];
        const rhymeGroup = rhymeGroups.find(g => g.words.includes(word));
        
        tiles.push({
          id: `tile_${tileId++}`,
          word,
          rhymeGroup: rhymeGroup?.id || 'unknown',
          rhymeType: rhymeGroup?.rhymeType || 'exact',
          position: pos,
          isRemoved: false,
          isExposed: false,
          blockedBy: [],
          visualPosition: this.calculateVisualPosition(pos),
          isSelected: false,
          isHighlighted: false,
          animationState: 'idle'
        });
      }
    });
    
    // Update tile exposure based on blocking relationships
    const tilesWithExposure = this.updateTileExposure(tiles);
    
    const puzzle: RhymeMahjongPuzzle = {
      id: `mahjong_${Date.now()}`,
      sourceText: rhymeGroups.map(g => g.words.join(' ')).join(' '),
      tiles: tilesWithExposure,
      rhymeGroups,
      gridDimensions: {
        width: this.layoutPattern[0]?.[0]?.length || 12,
        height: this.layoutPattern[0]?.length || 8,
        layers: this.layoutPattern.length
      },
      totalTiles: tilesWithExposure.length
    };
    
    logger.info(`Generated Mahjong ${layoutType} layout with ${tiles.length} tiles`);
    return puzzle;
  }

  /**
   * Get all available tile positions from the layout pattern
   */
  private getAvailablePositions(): Array<{ row: number; col: number; layer: number }> {
    const positions: Array<{ row: number; col: number; layer: number }> = [];
    
    this.layoutPattern.forEach((layer, layerIndex) => {
      layer.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === 'X') {
            positions.push({
              row: rowIndex,
              col: colIndex,
              layer: layerIndex
            });
          }
        }
      });
    });
    
    return positions;
  }

  /**
   * Generate 3D visual positions for tiles based on their logical positions
   */
  public generateStackedLayout(puzzle: RhymeMahjongPuzzle): RhymeTile[] {
    logger.info('Generating stacked 3D layout for Rhyme Mahjong puzzle');

    const enhancedTiles = puzzle.tiles.map(tile => {
      const visualPosition = this.calculateVisualPosition(tile.position);

      return {
        ...tile,
        visualPosition,
        isSelected: false,
        isHighlighted: false,
        animationState: 'idle' as const
      };
    });

    // Sort tiles by layer (back to front for proper rendering)
    enhancedTiles.sort((a, b) => a.position.layer - b.position.layer);

    logger.info(`Generated 3D layout for ${enhancedTiles.length} tiles across ${puzzle.gridDimensions.layers} layers`);
    return enhancedTiles;
  }

  /**
   * Get container styles for 3D perspective
   */
  public getContainerStyle(): React.CSSProperties {
    const { containerWidth, containerHeight, perspective } = this.config;
    
    return {
      width: containerWidth,
      height: containerHeight,
      perspective: `${perspective}px`,
      margin: '0 auto',
      position: 'relative',
      overflow: 'visible',
    };
  }

  public getStageStyle(): React.CSSProperties {
      const { rotationX, rotationY } = this.config;
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
      }
  }

  /**
   * Calculate visual position for a tile based on its logical position
   */
  private calculateVisualPosition(
    logicalPos: { row: number; col: number; layer: number }
  ): { x: number; y: number; z: number } {
    const { tileSize, tileGap, layerOffset } = this.config;
    
    const maxCols = Math.max(...this.layoutPattern.map(layer => 
      Math.max(...layer.map(row => row.length))
    ));
    const maxRows = Math.max(...this.layoutPattern.map(layer => layer.length));
    
    const totalWidth = maxCols * (tileSize + tileGap);
    const totalHeight = maxRows * (tileSize + tileGap);
    
    const offsetX = (this.config.containerWidth - totalWidth) / 2;
    // Adjust offsetY to account for the 3D rotation visually
    const offsetY = (this.config.containerHeight - totalHeight) / 2 - 50; 
    
    const baseX = logicalPos.col * (tileSize + tileGap) + offsetX;
    const baseY = logicalPos.row * (tileSize + tileGap) + offsetY;
    
    const layerX = logicalPos.layer * layerOffset.x;
    const layerY = logicalPos.layer * layerOffset.y;
    const layerZ = logicalPos.layer * layerOffset.z;
    
    const finalPosition = {
      x: baseX + layerX,
      y: baseY + layerY,
      z: layerZ
    };
    
    return finalPosition;
  }

  /**
   * Update tile exposure based on blocking relationships
   */
  public updateTileExposure(tiles: RhymeTile[]): RhymeTile[] {
    return tiles.map(tile => {
      const isExposed = this.isTileExposed(tile, tiles);
      const blockedBy = this.getBlockingTiles(tile, tiles);
      
      return {
        ...tile,
        isExposed,
        blockedBy
      };
    });
  }

  /**
   * Check if a tile is exposed (can be selected)
   */
  private isTileExposed(targetTile: RhymeTile, allTiles: RhymeTile[]): boolean {
    if (targetTile.isRemoved) return false;
    
    // Check if tile is blocked by tiles in higher layers
    const blockingTiles = allTiles.filter(tile => 
      !tile.isRemoved &&
      tile.position.layer > targetTile.position.layer &&
      this.isPositionBlocking(tile.position, targetTile.position)
    );
    
    return blockingTiles.length === 0;
  }

  /**
   * Get all tiles that are blocking this tile
   */
  private getBlockingTiles(targetTile: RhymeTile, allTiles: RhymeTile[]): string[] {
    return allTiles
      .filter(tile => 
        !tile.isRemoved &&
        tile.position.layer > targetTile.position.layer &&
        this.isPositionBlocking(tile.position, targetTile.position)
      )
      .map(tile => tile.id);
  }

  /**
   * Check if one position blocks another (Mahjong rules)
   */
  private isPositionBlocking(
    upperPos: { row: number; col: number; layer: number },
    lowerPos: { row: number; col: number; layer: number }
  ): boolean {
    // Must be in adjacent layers
    if (upperPos.layer !== lowerPos.layer + 1) return false;
    
    // Check if positions overlap (with some tolerance)
    const rowDiff = Math.abs(upperPos.row - lowerPos.row);
    const colDiff = Math.abs(upperPos.col - lowerPos.col);
    
    return rowDiff <= 1 && colDiff <= 1;
  }

  /**
   * Find tiles that can match with the selected tile
   */
  public findMatchableTiles(selectedTile: RhymeTile, allTiles: RhymeTile[]): RhymeTile[] {
    return allTiles.filter(tile =>
      tile.id !== selectedTile.id &&
      !tile.isRemoved &&
      tile.isExposed &&
      this.canTilesMatch(selectedTile, tile)
    );
  }

  /**
   * Check if two tiles can match (same rhyme group)
   */
  public canTilesMatch(tile1: RhymeTile, tile2: RhymeTile): boolean {
    return tile1.rhymeGroup === tile2.rhymeGroup && tile1.word === tile2.word;
  }

  /**
   * Remove tiles and update exposure
   */
  public removeTiles(tileIds: string[], allTiles: RhymeTile[]): RhymeTile[] {
    const updatedTiles = allTiles.map(tile => ({
      ...tile,
      isRemoved: tileIds.includes(tile.id) ? true : tile.isRemoved,
      animationState: tileIds.includes(tile.id) ? 'removing' as const : tile.animationState
    }));

    // Update exposure after removal
    return this.updateTileExposure(updatedTiles);
  }

  /**
   * Get CSS transform for a tile
   */
  public getTileTransform(tile: RhymeTile): string {
    const { x, y, z } = tile.visualPosition;
    return `translate3d(${x}px, ${y}px, ${z}px)`;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<StackedLayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if puzzle is complete
   */
  public isPuzzleComplete(tiles: RhymeTile[]): boolean {
    return tiles.every(tile => tile.isRemoved);
  }

  /**
   * Get puzzle statistics
   */
  public getPuzzleStats(tiles: RhymeTile[]): {
    totalTiles: number;
    removedTiles: number;
    exposedTiles: number;
    remainingTiles: number;
    progress: number;
  } {
    const totalTiles = tiles.length;
    const removedTiles = tiles.filter(tile => tile.isRemoved).length;
    const exposedTiles = tiles.filter(tile => !tile.isRemoved && tile.isExposed).length;
    const remainingTiles = totalTiles - removedTiles;
    const progress = totalTiles > 0 ? (removedTiles / totalTiles) * 100 : 0;

    return {
      totalTiles,
      removedTiles,
      exposedTiles,
      remainingTiles,
      progress
    };
  }

  /**
   * Shuffle array utility
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 