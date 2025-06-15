export interface AnalysisResult {
  rhymes: string[];
  syllables: number;
  stressPattern: string;
  phoneticBreakdown: string;
  analysis: string;
  suggestions?: string[];
} 