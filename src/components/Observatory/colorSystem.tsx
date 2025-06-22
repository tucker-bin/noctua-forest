// Clean, Minimal Color System for Pattern Observatory
// Focus on readability and reduced visual noise

import { Pattern, PatternType } from '../../types/observatory';

// Highlighter-style colors - vibrant and solid like real highlighters
export const HIGHLIGHTER_COLORS = [
  '#FFD700', // Bright yellow highlighter (better contrast than pure yellow)
  '#32CD32', // Lime green highlighter
  '#FF69B4', // Hot pink highlighter
  '#87CEEB', // Sky blue highlighter
  '#FF8C00', // Orange highlighter
  '#DA70D6', // Orchid/purple highlighter
  '#00FF7F', // Spring green highlighter
  '#FFB6C1', // Light pink highlighter
  '#40E0D0', // Turquoise highlighter
  '#F0E68C', // Khaki/light yellow highlighter
  '#98FB98', // Pale green highlighter
  '#DDA0DD'  // Plum highlighter
];

// Minimal, professional color palettes with muted tones
export const ColorPalettes = {
  // Clean minimal palette - subtle and professional
  minimal: [
    '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'
  ],

  // Muted spectral - toned down version
  muted: [
    '#8B9DC3', '#7FB3D3', '#87C5A4', '#B8D4A4', '#E0E8A8',
    '#F0D8A8', '#E8B8A8', '#D8A8A8', '#C8A8B8', '#B8A8C8',
    '#A8B8D8', '#A8C8E8', '#A8D8F8', '#B8E8F8', '#C8F8E8'
  ],

  // High contrast but limited - only 6 colors max
  focused: [
    '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#DB2777'
  ],

  // Monochrome with single accent
  mono: [
    '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F9FAFB', '#3B82F6'
  ]
};

// Minimal professional color palette - maximum 8 muted colors
const MINIMAL_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple  
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#84cc16', // Lime
  '#f97316'  // Orange
];

// Reduced opacity ranges for subtle highlighting
const OPACITY_RANGE = {
  min: 0.3,
  max: 0.7
};

export interface ColorMapping {
  [key: string]: string;
}

class ColorSystem {
  private colorMap: ColorMapping = {};
  private usedColors: Set<string> = new Set();
  private colorIndex = 0;

  // Get color for a pattern type with consistent assignment
  getColorForPattern(patternType: PatternType): string {
    const key = patternType.toLowerCase();
    
    if (this.colorMap[key]) {
      return this.colorMap[key];
    }

    // Assign next available color from highlighter palette
    const color = HIGHLIGHTER_COLORS[this.colorIndex % HIGHLIGHTER_COLORS.length];
    
    this.colorMap[key] = color;
    this.usedColors.add(color);
    this.colorIndex++;
    
    return color;
  }

  // Calculate opacity based on index for visual variety
  private calculateOpacity(index: number): number {
    const { min, max } = OPACITY_RANGE;
    const range = max - min;
    const step = range / MINIMAL_COLORS.length;
    return min + (step * (index % MINIMAL_COLORS.length));
  }

  // Convert hex to rgba with opacity
  private hexToRgba(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Get all assigned colors
  getAllColors(): ColorMapping {
    return { ...this.colorMap };
  }

  // Reset color assignments
  reset(): void {
    this.colorMap = {};
    this.usedColors.clear();
    this.colorIndex = 0;
  }

  // Get color statistics
  getStats() {
    return {
      totalPatterns: Object.keys(this.colorMap).length,
      maxColors: MINIMAL_COLORS.length,
      utilizationRate: (Object.keys(this.colorMap).length / MINIMAL_COLORS.length) * 100
    };
  }
}

// Export singleton instance
export const colorSystem = new ColorSystem();

// Export color utilities
export const getPatternColor = (patternType: PatternType) => 
  colorSystem.getColorForPattern(patternType);

export const resetColors = () => colorSystem.reset();

export const getColorStats = () => colorSystem.getStats();

// Simplified color generation - maximum 12 highlighter colors total
export function generatePatternColors(patterns: Pattern[], palette: keyof typeof ColorPalettes = 'minimal'): Record<string, string> {
  const colorMap: Record<string, string> = {};
  
  // Use highlighter colors for vibrant highlighting
  const colors = HIGHLIGHTER_COLORS;
  
  // Group patterns by type
  const patternTypes = [...new Set(patterns.map(p => p.type))];
  
  // Limit to maximum 12 pattern types for visual clarity
  const limitedTypes = patternTypes.slice(0, 12);
  
  // Assign one color per pattern type
  limitedTypes.forEach((type, index) => {
    const color = colors[index % colors.length];
    colorMap[type] = color;
    
    // Also assign to individual patterns of this type
    patterns
      .filter(p => p.type === type)
      .forEach((pattern, patternIndex) => {
        const patternId = `${pattern.type}-${patternIndex}-${pattern.segments[0]?.text || patternIndex}`;
        colorMap[patternId] = color;
      });
  });

  // Default color
  colorMap['default'] = colors[0]; // Use first highlighter color as default

  return colorMap;
}

// Generate unique pattern ID for consistent color mapping
export function getPatternId(pattern: Pattern, index: number): string {
  return `${pattern.type}-${index}-${pattern.segments[0]?.text || index}`;
}

// Enhanced contrast calculation for readability
export function getContrastColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white or black based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Reduced opacity for subtle highlighting
export function getPatternOpacity(confidence: number = 0.5): number {
  // Much more subtle opacity range
  const normalizedConfidence = Math.max(0, Math.min(1, confidence));
  return 0.3 + (normalizedConfidence * 0.4); // Range: 0.3 - 0.7
}

// Simplified color variations
export function getColorVariation(baseColor: string, variation: 'lighter' | 'darker'): string {
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  let newR = r, newG = g, newB = b;
  
  if (variation === 'lighter') {
    newR = Math.min(255, r + 30);
    newG = Math.min(255, g + 30);
    newB = Math.min(255, b + 30);
  } else {
    newR = Math.max(0, r - 30);
    newG = Math.max(0, g - 30);
    newB = Math.max(0, b - 30);
  }
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
} 