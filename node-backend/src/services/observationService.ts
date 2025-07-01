import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ObservationData, Pattern, PatternType, Observation, ObserveOptions, Constellation, Segment, ObservationMetadata } from '../types/observation';
import { findEnhancedPatterns } from './patternRecognition';
import { rateLimiter } from './rateLimiter';
import { cacheService } from './cacheService';
import { 
  validateText, 
  ObservationError, 
  ExternalServiceError,
  RateLimitError,
  CacheError,
  ValidationError
} from '../utils/errors';
import { settings } from '../config/settings';
import { metricsService } from './metricsService';
import { languageConfigs, phoneticize, extractVowelSounds, extractConsonantSounds } from './phoneticService';
import { db } from '../config/firebase';
import { UserPreferences, UserUsage } from '../types/user';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AdvancedPatternAnalysis } from './advancedPatternAnalysis';
import { culturalContextService } from './culturalContext';
import { getAIPatternsWithCulturalContext } from './anthropicService';
import { AIPattern } from '../types/analysisTypes';

const cache = new NodeCache({ stdTTL: 300 });

function validateInput(text: string): void {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  
  if (text.length > 10000) {
    throw new Error('Text cannot exceed 10,000 characters');
  }
  
  if (text.trim().length === 0) {
    throw new Error('Text cannot be empty or only whitespace');
  }
}

function cleanTextForObservation(input: string): string {
  let cleaned = input.trim();
  
  // Remove excessive whitespace while preserving structure
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Normalize quotes
  cleaned = cleaned.replace(/[""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  
  // Remove special characters that might break analysis, but preserve accented letters and foreign scripts
  cleaned = cleaned.replace(/[^\w\s.,!?;:'"()\-\u00C0-\u017F\u0100-\u024F\u0400-\u04FF\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0900-\u097f]/g, '');
  
  return cleaned;
}

class ObservationService {
  private observationsRef = db.collection('observations');
  private cacheRef = db.collection('observation_cache');
  private userPreferencesRef = db.collection('user_preferences');
  private userUsageRef = db.collection('user_usage');

  async observeText(
    text: string, 
    userId: string, 
    language: string = 'en', 
    options?: ObserveOptions
  ): Promise<Observation> {
    try {
      validateInput(text);
      
      const cleanedText = cleanTextForObservation(text);
      const textWasCleaned = cleanedText !== text;
      
      logger.info('Starting observation', { 
        userId: userId.substring(0, 8) + '...', 
        textLength: text.length, 
        cleanedLength: cleanedText.length,
        language,
        options 
      });

      // Cultural context analysis for code-switching
      const culturalAnalysis = culturalContextService.analyzeMultilingualText(cleanedText);
      
      // Get AI-powered cultural patterns
      let aiPatterns: AIPattern[] = [];
      let aiServiceAvailable = true;
      try {
        aiPatterns = await getAIPatternsWithCulturalContext(cleanedText, culturalAnalysis.wordByWordAnalysis, language);
      } catch (error: unknown) {
        aiServiceAvailable = false;
        if (error instanceof Error && error.message === 'AI service not configured') {
          logger.info('AI service not configured - using basic pattern detection');
        } else {
          logger.warn('Failed to get AI patterns - using basic pattern detection', { 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Create segments and patterns
      const segments: Segment[] = this.createMockSegments(cleanedText);
      const allPatterns: Pattern[] = this.createSophisticatedPatterns(segments, cleanedText, language);

      // Map AI patterns to our internal Pattern format only if we have them
      const mappedAIPatterns = aiPatterns.length > 0 ? 
        this.mapAIPatternsToPatterns(aiPatterns, segments, cleanedText) : 
        [];
      
      // Deduplicate and combine patterns
      const combinedPatterns = this.deduplicatePatterns([...allPatterns, ...mappedAIPatterns]);

      // Filter for significant patterns for the main view
      const significantPatterns = combinedPatterns.filter(p => (p.significance || 0) >= 0.4);

      const constellations: Constellation[] = findConstellations(significantPatterns, segments);

      const observationData: Omit<Observation, 'id'> = {
        text: cleanedText,
        language,
        userId,
        patterns: significantPatterns,
        allPatterns: combinedPatterns,
        segments,
        constellations,
        createdAt: new Date(),
        metadata: {
          language,
          rhymeScheme: significantPatterns.some(p => p.type === 'rhyme') ? 'ABAB' : null,
          meter: null,
          modelUsed: aiServiceAvailable ? 'claude-3-5-sonnet' : 'basic',
          analysisOptions: options,
          textWasCleaned,
          originalTextLength: text.length,
          cleanedTextLength: cleanedText.length,
          culturalAnalysis: {
            detectedLanguages: culturalAnalysis.detectedLanguages.map(l => l.name),
            codeSwithingPoints: culturalAnalysis.codeSwithingPoints.length,
            culturalPatterns: culturalAnalysis.culturalPatterns.map(p => p.nativeName),
            modernAnalysis: culturalAnalysis.modernAnalysis,
            aiServiceAvailable
          }
        },
        textWasCleaned,
        originalTextLength: text.length,
        cleanedTextLength: cleanedText.length
      };

      // Save to database
      const docRef = await this.observationsRef.add(observationData);
      
      const savedObservation: Observation = {
        id: docRef.id,
        ...observationData
      };

      // Add metrics
      const result: Observation = {
        ...savedObservation,
        modelUsed: aiServiceAvailable ? 'claude-3-5-sonnet' : 'basic',
        cost: 0,
        tokensUsed: 0,
        segments: segments,
        patterns: significantPatterns,
        allPatterns: combinedPatterns,
        constellations: constellations,
        languageAnalysis: {
          config: languageConfigs[language] || languageConfigs.en,
          totalVowels: segments.reduce((sum, s) => sum + (s.phonetic?.vowels.length || 0), 0),
          totalConsonants: segments.reduce((sum, s) => sum + (s.phonetic?.consonants.length || 0), 0),
          complexityScore: 0
        }
      };

      logger.info('Observation completed successfully', { 
        observationId: docRef.id,
        totalPatternsCount: combinedPatterns.length,
        significantPatternsCount: significantPatterns.length,
        segmentsCount: segments.length,
        aiServiceAvailable
      });

      return result;

    } catch (error) {
      logger.error('Error in observeText:', error);
      throw new ObservationError('Failed to process observation', { cause: error });
    }
  }

  private createMockSegments(text: string): Segment[] {
    const words = text.split(/\s+/);
    const segments: Segment[] = [];
    let currentIndex = 0;

    words.forEach((word, index) => {
      if (word.trim()) {
        const startIndex = text.indexOf(word, currentIndex);
        const endIndex = startIndex + word.length;
        
        segments.push({
          id: `seg_${index}`,
          text: word,
          startIndex,
          endIndex,
          globalStartIndex: startIndex,
          globalEndIndex: endIndex
        });
        
        currentIndex = endIndex;
      }
    });

    return segments;
  }

  private createSophisticatedPatterns(segments: Segment[], text: string, language: string = 'en'): Pattern[] {
    // Use sophisticated pattern analysis instead of simple mock
    return AdvancedPatternAnalysis.analyzeText(text, segments, language);
  }

  private mapAIPatternsToPatterns(aiPatterns: AIPattern[], existingSegments: Segment[], text: string): Pattern[] {
    const mappedPatterns: Pattern[] = [];
    let segmentIdCounter = existingSegments.length;

    aiPatterns.forEach((aiPattern, index) => {
      const patternSegments: string[] = []; // Store segment IDs instead of segments
      
      aiPattern.examples.forEach((example: string) => {
        let startIndex = -1;
        let searchIndex = 0;

        // Find all occurrences of the example text
        while ((startIndex = text.indexOf(example, searchIndex)) !== -1) {
          const endIndex = startIndex + example.length;
          
          // Check if a segment already exists for this exact position
          let segment = existingSegments.find(s => s.startIndex === startIndex && s.endIndex === endIndex);
          
          if (!segment) {
            segment = {
              id: `ai-seg-${segmentIdCounter++}`,
              text: example,
              startIndex,
              endIndex,
              globalStartIndex: startIndex,
              globalEndIndex: endIndex,
            };
            existingSegments.push(segment);
          }
          patternSegments.push(segment.id); // Store the segment ID

          searchIndex = endIndex;
        }
      });
      
      if (patternSegments.length > 0) {
        mappedPatterns.push({
          id: `ai-pattern-${index}`,
          type: aiPattern.type as PatternType,
          segments: patternSegments,
          originalText: aiPattern.examples.join(' / '),
          description: aiPattern.explanation,
          significance: aiPattern.significance,
          acousticFeatures: {
            primaryFeature: aiPattern.category,
            secondaryFeatures: ['AI-generated', aiPattern.type]
          }
        });
      }
    });

    return mappedPatterns;
  }

  private deduplicatePatterns(patterns: Pattern[]): Pattern[] {
    // First, group patterns by their text coverage
    const patternGroups = new Map<string, Pattern[]>();
    
    patterns.forEach(pattern => {
      // Sort segments to create consistent key
      const sortedSegments = [...pattern.segments].sort();
      const key = sortedSegments.join(',');
      
      if (!patternGroups.has(key)) {
        patternGroups.set(key, []);
      }
      patternGroups.get(key)!.push(pattern);
    });

    // Process each group to remove duplicates and merge related patterns
    const deduplicated: Pattern[] = [];
    
    patternGroups.forEach(group => {
      if (group.length === 1) {
        // Single pattern for this text segment, keep as is
        deduplicated.push(group[0]);
        return;
      }

      // Sort by significance
      group.sort((a, b) => (b.significance || 0) - (a.significance || 0));

      // Check for rhyme/slant_rhyme overlap
      const hasRhyme = group.some(p => p.type === 'rhyme');
      const hasSlantRhyme = group.some(p => p.type === 'slant_rhyme');

      if (hasRhyme && hasSlantRhyme) {
        // Keep only the rhyme pattern if it has higher significance
        const rhymePattern = group.find(p => p.type === 'rhyme')!;
        const slantPattern = group.find(p => p.type === 'slant_rhyme')!;
        
        deduplicated.push(
          (rhymePattern.significance || 0) >= (slantPattern.significance || 0) 
            ? rhymePattern 
            : slantPattern
        );
        
        // Add any other non-rhyme patterns from this group
        group
          .filter(p => p.type !== 'rhyme' && p.type !== 'slant_rhyme')
          .forEach(p => deduplicated.push(p));
      } else {
        // For other overlaps, keep the pattern with highest significance
        // unless they're different types with similar significance
        const highestSig = group[0].significance || 0;
        
        group.forEach((pattern, index) => {
          if (index === 0) {
            deduplicated.push(pattern);
          } else {
            const currentSig = pattern.significance || 0;
            // Keep additional patterns only if they're different types
            // and have similar significance (within 0.2)
            if (
              pattern.type !== group[0].type && 
              Math.abs(highestSig - currentSig) <= 0.2
            ) {
              deduplicated.push(pattern);
            }
          }
        });
      }
    });

    return deduplicated;
  }
}

export const observationService = new ObservationService();

function getLanguageSpecificPrompt(language: string): (text: string) => string {
  const languagePrompts: Record<string, string> = {
    'en': 'Analyze this English text for phonetic and linguistic patterns. Focus on rhyme, alliteration, assonance, consonance, rhythm, and sound symbolism.',
    'es': 'Analiza este texto en español para patrones fonéticos y lingüísticos. Enfócate en rima, aliteración, asonancia, consonancia, ritmo y simbolismo sonoro.',
    'fr': 'Analysez ce texte français pour les motifs phonétiques et linguistiques. Concentrez-vous sur la rime, l\'allitération, l\'assonance, la consonance, le rythme et le symbolisme sonore.',
    'de': 'Analysiere diesen deutschen Text auf phonetische und sprachliche Muster. Konzentriere dich auf Reim, Alliteration, Assonanz, Konsonanz, Rhythmus und Lautsymbolik.',
    'ja': 'この日本語テキストの音韻的および言語的パターンを分析してください。韻、頭韻、類韻、子音韻、リズム、音象徴に焦点を当ててください。',
    'zh': '分析这段中文文本的语音和语言模式。专注于韵律、头韵、元音韵、辅音韵、节奏和声音象征。',
    'ar': 'حلل هذا النص العربي للأنماط الصوتية واللغوية. ركز على القافية والجناس والسجع والإيقاع والرمزية الصوتية.'
  };

  const basePrompt = languagePrompts[language] || languagePrompts['en'];
  
  return (text: string) => {
    return `${basePrompt}

Please analyze the following text and return a JSON response with the following structure:
{
  "patterns": [
    {
      "id": "unique_pattern_id",
      "type": "rhyme|alliteration|assonance|consonance|rhythm|sibilance|fricative|plosive|liquid",
      "segments": [
        {
          "text": "word",
          "startIndex": 0,
          "endIndex": 4,
          "globalStartIndex": 0,
          "globalEndIndex": 4
        }
      ],
      "originalText": "combined text of all segments",
      "acousticFeatures": {
        "primaryFeature": "main sound pattern description",
        "secondaryFeatures": ["feature1", "feature2", "feature3"]
      },
      "description": "detailed explanation of the pattern"
    }
  ],
  "rhymeScheme": "ABAB|AABB|null",
  "meter": "iambic pentameter|trochaic tetrameter|null",
  "constellations": [
    {
      "id": "constellation_id",
      "name": "Constellation Name",
      "patterns": ["pattern_id_1", "pattern_id_2"],
      "relationship": "description of how patterns relate"
    }
  ]
}

Ensure all start/end indices are accurate and patterns are sophisticated and meaningful.`;
  };
}

function getAdaptiveLanguagePrompt(text: string, language: string, options?: ObserveOptions): string {
  const promptGenerator = getLanguageSpecificPrompt(language);
  let basePrompt = promptGenerator(text);
  
  // Adapt based on options
  if (options?.focusMode) {
    const focusInstructions: Record<string, string> = {
      'rhyme': 'Pay special attention to end rhymes, internal rhymes, and slant rhymes.',
      'rhythm': 'Focus primarily on rhythmic patterns, stress patterns, and metrical analysis.',
      'alliteration': 'Emphasize alliterative patterns and consonant clustering.',
      'advanced': 'Provide maximum depth analysis including subtle patterns and cross-linguistic comparisons.',
      'comprehensive': 'Analyze all pattern types with equal attention and detail.'
    };
    
    const focusInstruction = focusInstructions[options.focusMode];
    if (focusInstruction) {
      basePrompt += `\n\nSPECIAL FOCUS: ${focusInstruction}`;
    }
  }
  
  if (options?.sensitivity) {
    const sensitivityInstructions: Record<string, string> = {
      'subtle': 'Include even very subtle patterns and weak connections.',
      'moderate': 'Balance between obvious and subtle patterns.',
      'strong': 'Focus only on clear, strong, and obvious patterns.'
    };
    
    const sensitivityInstruction = sensitivityInstructions[options.sensitivity];
    if (sensitivityInstruction) {
      basePrompt += `\n\nSENSITIVITY: ${sensitivityInstruction}`;
    }
  }
  
  return basePrompt + `\n\nText to analyze: "${text}"`;
}

function parsePatterns(content: string, originalText: string, allSegments: Segment[]): Pattern[] {
  try {
    // First try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(content);
    } catch {
      // Try to extract JSON from text response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    }
    
    if (!jsonData.patterns || !Array.isArray(jsonData.patterns)) {
      logger.warn('No valid patterns array found in AI response');
      return [];
    }

    const patterns: Pattern[] = [];
    let patternIndex = 0;
    
    jsonData.patterns.forEach((patternData: any) => {
      try {
        // Validate pattern structure
        if (!patternData.type || !patternData.segments || !Array.isArray(patternData.segments)) {
          logger.warn('Invalid pattern structure:', patternData);
          return;
        }
        
        // Find matching segment objects for the pattern segments
        const segmentObjects: Segment[] = [];
        patternData.segments.forEach((segmentData: any) => {
          if (segmentData.text && 
              typeof segmentData.startIndex === 'number' && 
              typeof segmentData.endIndex === 'number') {
            
            // Find the matching segment in allSegments
            const matchingSegment = allSegments.find(seg => 
              seg.text === segmentData.text &&
              Math.abs(seg.startIndex - segmentData.startIndex) <= 5 // Allow small differences
            );
            
            if (matchingSegment) {
              segmentObjects.push(matchingSegment);
            } else {
              // Create a new segment if none found
              const newSegmentId = `ai_seg_${patternIndex}_${segmentObjects.length}`;
              const newSegment: Segment = {
                id: newSegmentId,
                text: segmentData.text,
                startIndex: segmentData.startIndex,
                endIndex: segmentData.endIndex,
                globalStartIndex: segmentData.globalStartIndex || segmentData.startIndex,
                globalEndIndex: segmentData.globalEndIndex || segmentData.endIndex,
                phoneticForm: segmentData.phoneticForm,
                stressPattern: segmentData.stressPattern,
                syllableCount: segmentData.syllableCount
              };
              allSegments.push(newSegment);
              segmentObjects.push(newSegment);
            }
          }
        });
        
        if (segmentObjects.length === 0) {
          logger.warn('No valid segment objects found for pattern:', patternData);
          return;
        }
        
        const pattern: Pattern = {
          id: patternData.id || `ai_pattern_${patternIndex++}`,
          type: patternData.type,
          segments: segmentObjects.map(s => s.id),
          originalText: patternData.originalText || segmentObjects.map(seg => seg.text).join(' '),
          acousticFeatures: patternData.acousticFeatures || {
            primaryFeature: `${patternData.type} pattern`,
            secondaryFeatures: ['AI-detected pattern']
          },
          description: patternData.description || `${patternData.type} pattern detected by AI`
        };
        
        patterns.push(pattern);
  } catch (error) {
        logger.error('Error processing individual pattern:', error, patternData);
      }
    });
    
    logger.info(`Successfully parsed ${patterns.length} patterns from AI response`);
    return patterns;
    
  } catch (error) {
    logger.error('Error parsing AI patterns:', error);
    logger.debug('AI response content:', content.substring(0, 500));
    
    // Fallback: try to extract simple patterns from text
    return extractFallbackPatterns(originalText, allSegments);
  }
}

function extractFallbackPatterns(text: string, allSegments: Segment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const words = text.toLowerCase().split(/\s+/);
  
  // Simple alliteration detection as fallback
  const alliterationGroups = new Map<string, string[]>();
  let wordIndex = 0;
  
  words.forEach(word => {
    if (word.length > 1) {
      const firstLetter = word.charAt(0);
      if (!alliterationGroups.has(firstLetter)) {
        alliterationGroups.set(firstLetter, []);
      }
      alliterationGroups.get(firstLetter)!.push(word);
    }
    wordIndex++;
  });
  
  alliterationGroups.forEach((groupWords, letter) => {
    if (groupWords.length >= 2) {
      const segmentObjects: Segment[] = [];
      let searchIndex = 0;
      
      groupWords.forEach(word => {
        const index = text.indexOf(word, searchIndex);
        if (index !== -1) {
          // Try to find existing segment
          const existingSegment = allSegments.find(seg => 
            seg.text === word && Math.abs(seg.startIndex - index) <= 5
          );
          
          if (existingSegment) {
            segmentObjects.push(existingSegment);
          } else {
            // Create new segment
            const newSegmentId = `fallback_seg_${letter}_${segmentObjects.length}`;
            const newSegment: Segment = {
              id: newSegmentId,
            text: word,
            startIndex: index,
            endIndex: index + word.length,
            globalStartIndex: index,
            globalEndIndex: index + word.length
            };
            allSegments.push(newSegment);
            segmentObjects.push(newSegment);
          }
          searchIndex = index + word.length;
        }
      });
      
      if (segmentObjects.length >= 2) {
        patterns.push({
          id: `fallback_alliteration_${letter}`,
          type: 'alliteration',
          segments: segmentObjects.map(s => s.id),
          originalText: groupWords.join(' '),
          acousticFeatures: {
            primaryFeature: `/${letter}/ initial consonant`,
            secondaryFeatures: ['Fallback detection', 'Simple alliteration']
          },
          description: `Simple ${letter}-alliteration detected`
        });
      }
    }
  });
  
  return patterns;
}

function extractRhymeScheme(content: string): string | null {
  try {
    const jsonData = JSON.parse(content);
    return jsonData.rhymeScheme || null;
  } catch {
    // Try to extract from text
    const rhymeMatch = content.match(/rhyme\s*scheme[:\s]+([A-Z]{2,8})/i);
    return rhymeMatch ? rhymeMatch[1] : null;
  }
}

function extractMetricalAnalysis(content: string): string | null {
  try {
    const jsonData = JSON.parse(content);
    return jsonData.meter || null;
  } catch {
    // Try to extract from text
    const meterMatch = content.match(/meter[:\s]+([\w\s]+?)(?:\n|$)/i);
    return meterMatch ? meterMatch[1].trim() : null;
  }
}

function findConstellations(patterns: Pattern[], allSegments: Segment[]): Constellation[] {
  const constellations: Constellation[] = [];

  // Group patterns by type for type-based constellations
  const patternsByType = new Map<string, Pattern[]>();
  patterns.forEach(pattern => {
    if (!patternsByType.has(pattern.type)) {
      patternsByType.set(pattern.type, []);
    }
    patternsByType.get(pattern.type)!.push(pattern);
  });
  
  // Create constellations for pattern types with multiple instances
  patternsByType.forEach((typePatterns, type) => {
    if (typePatterns.length >= 2) {
      constellations.push({
        id: `constellation_${type}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Constellation`,
        patterns: typePatterns,
        relationship: `Multiple ${type} patterns working together to create cohesive sound effects`
      });
    }
  });

  // Find proximity-based constellations
  const proximityConstellations = findProximityConstellations(patterns, allSegments);
  constellations.push(...proximityConstellations);
  
  // Find overlapping segment constellations
  const overlapConstellations = findOverlapConstellations(patterns, allSegments);
  constellations.push(...overlapConstellations);

  return constellations;
}

function findProximityConstellations(patterns: Pattern[], allSegments: Segment[]): Constellation[] {
  const constellations: Constellation[] = [];
  const PROXIMITY_THRESHOLD = 50; // characters
  
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const pattern1 = patterns[i];
      const pattern2 = patterns[j];
      
      const segments1 = pattern1.segments.map(id => allSegments.find(s => s.id === id)).filter((s): s is Segment => !!s);
      const segments2 = pattern2.segments.map(id => allSegments.find(s => s.id === id)).filter((s): s is Segment => !!s);

      if (segments1.length === 0 || segments2.length === 0) continue;

      // Check if patterns are close to each other
      const minDistance = Math.min(
        ...segments1.flatMap(seg1 => 
          segments2.map(seg2 => 
            Math.abs(seg1.globalStartIndex - seg2.globalStartIndex)
          )
        )
      );
      
      if (minDistance <= PROXIMITY_THRESHOLD && pattern1.type !== pattern2.type) {
        constellations.push({
          id: `constellation_proximity_${i}_${j}`,
          name: `${pattern1.type}-${pattern2.type} Proximity Constellation`,
          patterns: [pattern1, pattern2],
          relationship: `${pattern1.type} and ${pattern2.type} patterns occurring in close proximity`
        });
      }
    }
  }
  
  return constellations;
}

function findOverlapConstellations(patterns: Pattern[], allSegments: Segment[]): Constellation[] {
  const constellations: Constellation[] = [];
  
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const pattern1 = patterns[i];
      const pattern2 = patterns[j];
      
      const segments1 = pattern1.segments.map(id => allSegments.find(s => s.id === id)).filter((s): s is Segment => !!s);
      const segments2 = pattern2.segments.map(id => allSegments.find(s => s.id === id)).filter((s): s is Segment => !!s);

      if (segments1.length === 0 || segments2.length === 0) continue;

      // Check if patterns share any text segments
      const hasOverlap = segments1.some(seg1 =>
        segments2.some(seg2 =>
          seg1.text.toLowerCase() === seg2.text.toLowerCase() ||
          (seg1.globalStartIndex < seg2.globalEndIndex && 
           seg1.globalEndIndex > seg2.globalStartIndex)
        )
      );
      
      if (hasOverlap && pattern1.type !== pattern2.type) {
        constellations.push({
          id: `constellation_overlap_${i}_${j}`,
          name: `Mixed Pattern Constellation`,
          patterns: [pattern1, pattern2],
          relationship: `Patterns that share text segments or occur in close proximity`
        });
      }
    }
  }
  
  return constellations;
}

function getAnthropicClient(): Anthropic {
  const apiKey = 'always-available';
  return new Anthropic({ 
    apiKey,
    defaultHeaders: {
      'Content-Type': 'application/json'
    }
  });
} 