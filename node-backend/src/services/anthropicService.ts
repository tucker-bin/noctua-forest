import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, AIPattern } from '../types/analysisTypes';
import { logger } from '../utils/logger';
import { WordLanguage } from './culturalContext';

function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'default-key',
    defaultHeaders: {
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY || 'default-key'
    }
  });
}

/**
 * @deprecated Use getAIPatternsWithCulturalContext for more detailed analysis
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  try {
    const client = getAnthropicClient();
    
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Analyze the following text for rhymes, syllables, stress patterns, and provide suggestions:
        
        ${text}`
      }]
    }, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'default-key'
      }
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

const ANTHROPIC_TOOLS = [
  {
    name: 'extract_patterns',
    description: 'Extracts the identified creative and cultural patterns from the text.',
    input_schema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['code_switching', 'cultural_resonance', 'emotional_emphasis'], 
                description: 'The type of pattern identified.' 
              },
              category: { 
                type: 'string', 
                description: 'The broader category of the pattern.' 
              },
              description: { 
                type: 'string', 
                description: "A concise, user-facing description of the pattern." 
              },
              examples: { 
                type: 'array', 
                items: { type: 'string' }, 
                description: 'Specific word(s) or phrase(s) from the text that exemplify the pattern.' 
              },
              explanation: { 
                type: 'string', 
                description: "A deeper explanation of the pattern's effect and significance." 
              },
              significance: { 
                type: 'number', 
                description: 'A score from 0.1 to 1.0 for how impactful the pattern is.' 
              }
            },
            required: ['type', 'category', 'description', 'examples', 'explanation', 'significance']
          }
        }
      },
      required: ['patterns']
    }
  }
];

export async function getAIPatternsWithCulturalContext(text: string, wordByWordAnalysis: WordLanguage[], language: string): Promise<AIPattern[]> {
  const client = getAnthropicClient();
  const languageMap = wordByWordAnalysis
    .map(w => `"${w.word}" (${w.language})`)
    .join(', ');

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Analyze the following text for cultural patterns, focusing on code-switching points: ${text}\n\nWord-by-word language analysis: ${languageMap}\n\nUser's primary language: ${language}`
      }]
    }, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'default-key'
      }
    });

    if (response.content && response.content[0] && response.content[0].type === 'text') {
      return JSON.parse(response.content[0].text || '[]');
    }
    return [];
  } catch (error) {
    logger.error('Error getting AI patterns:', error);
    return [];
  }
} 