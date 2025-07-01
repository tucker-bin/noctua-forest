export interface AnalysisResult {
  rhymes: string[];
  syllables: number;
  stressPattern: string;
  phoneticBreakdown: string;
  analysis: string;
  suggestions?: string[];
}

export interface AIPattern {
  type: string;
  category: string;
  description: string;
  examples: string[];
  explanation: string;
  significance: number;
} 