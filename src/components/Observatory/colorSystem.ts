import { Pattern, PatternType, Segment } from '../../types/observatory';

// Core pattern colors - carefully chosen for visual distinction and pattern recognition
const patternColors: Record<PatternType, { color: string; significance: number }> = {
  rhyme: {
    color: '#FFD700',      // Gold - high visibility for end rhymes
    significance: 0.9
  },
  assonance: {
    color: '#9C27B0',      // Purple - strong vowel presence
    significance: 0.8
  },
  consonance: {
    color: '#4A90E2',      // Blue - clear consonant marking
    significance: 0.8
  },
  alliteration: {
    color: '#4CAF50',      // Green - distinct word beginnings
    significance: 0.85
  },
  rhythm: {
    color: '#FF5722',      // Orange - rhythmic emphasis
    significance: 0.75
  },
  sibilance: {
    color: '#E91E63',      // Pink - clear sibilant marking
    significance: 0.7
  },
  internal_rhyme: {
    color: '#00BCD4',      // Cyan - internal sound connections
    significance: 0.8
  },
  slant_rhyme: {
    color: '#FFA726',      // Light Orange - near-match emphasis
    significance: 0.7
  },
  repetition: {
    color: '#7E57C2',      // Deep Purple - pattern echo
    significance: 0.85
  },
  parallelism: {
    color: '#26A69A',      // Teal - structural marking
    significance: 0.75
  },
  sound_parallelism: {
    color: '#66BB6A',      // Light Green - sound structure
    significance: 0.8
  },
  meter: {
    color: '#FF8F00',      // Deep Orange - metrical emphasis
    significance: 0.85
  },
  caesura: {
    color: '#78909C',      // Blue Grey - pause marking
    significance: 0.6
  },
  code_switching: {
    color: '#8E24AA',      // Deep Purple - language transition
    significance: 0.9
  },
  cultural_resonance: {
    color: '#D81B60',      // Pink - cultural emphasis
    significance: 0.85
  },
  emotional_emphasis: {
    color: '#C62828',      // Red - emotional intensity
    significance: 0.9
  }
};

// Pattern display colors - full opacity for clear pattern visibility
export const PATTERN_COLORS = [
  '#FFD700', '#9C27B0', '#4A90E2', '#4CAF50', '#FF5722', '#E91E63',
  '#00BCD4', '#FFA726', '#7E57C2', '#26A69A', '#66BB6A', '#FF8F00',
  '#8E24AA', '#D81B60', '#C62828', '#2196F3', '#009688', '#FF4081'
];

// Z-index ranges for pattern layering
const Z_INDEX_RANGES = {
  base: 1,
  hover: 100,
  selected: 1000
};

export interface ColorMapping {
  [key: string]: string;
}

class EnhancedColorSystem {
  private colorMap: ColorMapping = {};
  private patternInstanceColors: Map<string, string> = new Map();
  private patternSignificance: Map<string, number> = new Map();
  private colorIndex = 0;

  getColorForPatternInstance(pattern: Pattern, index: number): string {
    if (!pattern || !pattern.segments || !pattern.type) {
      console.warn('Invalid pattern or missing required properties', { pattern });
      return PATTERN_COLORS[0];
    }

    const patternId = this.generatePatternInstanceId(pattern, index);
    
    if (this.patternInstanceColors.has(patternId)) {
      return this.patternInstanceColors.get(patternId)!;
    }

    const color = PATTERN_COLORS[this.colorIndex % PATTERN_COLORS.length];
    this.patternInstanceColors.set(patternId, color);
    this.colorMap[patternId] = color;
    
    // Store significance for z-index calculation
    const significance = pattern.significance || patternColors[pattern.type]?.significance || 0.5;
    this.patternSignificance.set(patternId, significance);
    
    this.colorIndex++;
    return color;
  }

  generatePatternInstanceId(pattern: Pattern, index: number): string {
    try {
      if (!pattern || !pattern.segments || !pattern.type) {
        return `invalid_pattern_${index}_${Date.now()}`;
      }

      if (pattern.id) {
        return pattern.id;
      }

      const segments = pattern.segments;
      
      if (!Array.isArray(segments) || segments.length === 0) {
        return `${pattern.type}_${index}_no_segments_${Date.now()}`;
      }

      // Pattern.segments is an array of segment IDs
      const firstSegmentId = segments[0];
      const lastSegmentId = segments[segments.length - 1];
      const segmentHash = segments.join('_');
      
      return `${pattern.type}_${index}_${firstSegmentId}_${lastSegmentId}_${segmentHash}`
        .replace(/[^a-zA-Z0-9_-]/g, '') 
        .slice(0, 100);
    } catch (error) {
      console.error('Error generating pattern ID:', error, pattern);
      return `error_pattern_${index}_${Date.now()}`;
    }
  }

  getColorForPattern(patternType: PatternType): string {
    return patternColors[patternType]?.color || PATTERN_COLORS[0];
  }

  getPatternZIndex(patternId: string, isHovered: boolean = false, isSelected: boolean = false): number {
    const significance = this.patternSignificance.get(patternId) || 0.5;
    const baseZ = isSelected ? Z_INDEX_RANGES.selected : 
                 isHovered ? Z_INDEX_RANGES.hover : 
                 Z_INDEX_RANGES.base;
    return baseZ + Math.floor(significance * 100);
  }

  reset(): void {
    this.colorMap = {};
    this.patternInstanceColors.clear();
    this.patternSignificance.clear();
    this.colorIndex = 0;
  }
}

const enhancedColorSystem = new EnhancedColorSystem();

// Get pattern color with full opacity for clear visibility
export const getPatternColor = (patternType: PatternType): string => {
  return patternColors[patternType]?.color || PATTERN_COLORS[0];
};

// Get pattern significance for z-index calculation
export const getPatternSignificance = (patternType: PatternType): number => {
  return patternColors[patternType]?.significance || 0.5;
};

// Get z-index for pattern layering
export const getPatternZIndex = (pattern: Pattern, isHovered: boolean = false, isSelected: boolean = false): number => {
  const patternId = enhancedColorSystem.generatePatternInstanceId(pattern, 0);
  return enhancedColorSystem.getPatternZIndex(patternId, isHovered, isSelected);
};

export const getPatternInstanceColor = (pattern: Pattern, index: number): string => {
  return enhancedColorSystem.getColorForPatternInstance(pattern, index);
};

export const generatePatternColors = (patterns: Pattern[]): Record<string, string> => {
  const colorMap: Record<string, string> = {};
  
  if (!Array.isArray(patterns)) {
    console.warn('Invalid patterns array provided to generatePatternColors');
    return { default: PATTERN_COLORS[0] };
  }

  enhancedColorSystem.reset();
  
  patterns.forEach((pattern, index) => {
    if (!pattern) return;

    const patternInstanceId = enhancedColorSystem.generatePatternInstanceId(pattern, index);
    const instanceColor = enhancedColorSystem.getColorForPatternInstance(pattern, index);
    
    colorMap[patternInstanceId] = instanceColor;
    
    if (pattern.type && !colorMap[pattern.type]) {
      colorMap[pattern.type] = enhancedColorSystem.getColorForPattern(pattern.type);
    }
  });

  colorMap['default'] = PATTERN_COLORS[0];
  return colorMap;
};

export const getPatternId = (pattern: Pattern, index: number): string => {
  return enhancedColorSystem.generatePatternInstanceId(pattern, index);
}; 