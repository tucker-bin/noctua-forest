import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from '../types/analysisTypes';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function analyzeText(text: string): Promise<AnalysisResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze the following text for rhymes, syllables, stress patterns, and provide suggestions:
        
        ${text}`
      }]
    });

    // Parse the response and extract relevant information
    const analysis: AnalysisResult = {
      rhymes: [],
      syllables: 0,
      stressPattern: '',
      phoneticBreakdown: '',
      analysis: response.content[0].type === 'text' ? response.content[0].text : '',
      suggestions: []
    };

    return analysis;
  } catch (error) {
    logger.error('Error analyzing text:', error);
    throw error;
  }
} 