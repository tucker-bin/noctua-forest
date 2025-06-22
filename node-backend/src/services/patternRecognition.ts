import { Pattern, Segment, PatternType } from '../types/observation';
import { phoneticize, extractVowelSounds, extractConsonantSounds } from './phoneticService';

// Constants for text processing
const CHUNK_SIZE = 5000; // Process 5000 characters at a time
const OVERLAP_SIZE = 500; // 500 character overlap between chunks to catch patterns at boundaries

interface PhoneticSegment extends Segment {
  phoneticForm: string;
  stressPattern: string;
  syllableCount: number;
  soundQuality?: {
    smooth: boolean;
    harsh: boolean;
    resonant: boolean;
    plosive: boolean;
    sibilant: boolean;
  };
}

interface SoundPattern {
  type: 'vowel' | 'consonant' | 'combined';
  sound: string;
  positions: number[];
  strength: number;
  quality?: string[];
}

export function findEnhancedPatterns(text: string, language: string = 'en'): Pattern[] {
  // Optimize for shorter texts - don't use chunking for small texts
  if (text.length < 2000) {
    return processChunk(text, 0, language);
  }
  
  // For longer texts, use chunking but with limits
  const chunks = splitTextIntoChunks(text, CHUNK_SIZE, OVERLAP_SIZE);
  
  // Limit number of chunks to prevent too many patterns
  const maxChunks = 3; // Process maximum 3 chunks to limit pattern count
  const limitedChunks = chunks.slice(0, maxChunks);
  
  const chunkPatterns = limitedChunks.map((chunk, index) => {
    const chunkStart = index * (CHUNK_SIZE - OVERLAP_SIZE);
    return processChunk(chunk, chunkStart, language);
  });

  // Merge patterns from all chunks with strict limits
  const mergedPatterns = mergeChunkPatterns(chunkPatterns);
  
  // CRITICAL: Return only top quality patterns to prevent payload size issues
  const MAX_ENHANCED_PATTERNS = 30; // Strict limit on enhanced patterns
  
  // Sort by quality: patterns with more segments first, then by type priority
  const qualityRanked = mergedPatterns.sort((a, b) => {
    // Type priority: rhyme > alliteration > assonance > consonance > rhythm
    const typePriority = { 
      'rhyme': 5, 
      'alliteration': 4, 
      'assonance': 3, 
      'consonance': 2, 
      'rhythm': 1 
    };
    const aPriority = typePriority[a.type as keyof typeof typePriority] || 0;
    const bPriority = typePriority[b.type as keyof typeof typePriority] || 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then by segment count
    return b.segments.length - a.segments.length;
  });
  
  return qualityRanked.slice(0, MAX_ENHANCED_PATTERNS);
}

function splitTextIntoChunks(text: string, chunkSize: number, overlapSize: number): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    // Calculate end position for this chunk
    const endPos = Math.min(currentPos + chunkSize, text.length);
    
    // Extract chunk with overlap
    const chunk = text.slice(
      Math.max(0, currentPos - overlapSize),
      endPos
    );
    
    chunks.push(chunk);
    currentPos += chunkSize - overlapSize;
  }

  return chunks;
}

function processChunk(text: string, chunkStart: number, language: string): Pattern[] {
  const phoneticSegments = createPhoneticSegments(text, language, chunkStart);
  const patterns: Pattern[] = [];

  // Process basic patterns within the chunk - limit each type
  const rhymePatterns = findRhymePatterns(phoneticSegments).slice(0, 8);
  const assonancePatterns = findAssonancePatterns(phoneticSegments).slice(0, 6);
  const consonancePatterns = findConsonancePatterns(phoneticSegments).slice(0, 6);
  const alliterationPatterns = findAlliterationPatterns(phoneticSegments).slice(0, 8);
  const rhythmicPatterns = findRhythmicPatterns(phoneticSegments).slice(0, 4);

  patterns.push(...rhymePatterns);
  patterns.push(...assonancePatterns);
  patterns.push(...consonancePatterns);
  patterns.push(...alliterationPatterns);
  patterns.push(...rhythmicPatterns);

  return patterns;
}

function mergeChunkPatterns(chunkPatterns: Pattern[][]): Pattern[] {
  const allPatterns = chunkPatterns.flat();
  const mergedPatterns: Pattern[] = [];
  const patternGroups = new Map<string, Pattern[]>();

  // Group similar patterns
  allPatterns.forEach(pattern => {
    const key = `${pattern.type}_${pattern.acousticFeatures?.primaryFeature}`;
    if (!patternGroups.has(key)) {
      patternGroups.set(key, []);
    }
    patternGroups.get(key)?.push(pattern);
  });

  // Merge overlapping patterns
  patternGroups.forEach(patterns => {
    patterns.sort((a, b) => a.segments[0].startIndex - b.segments[0].startIndex);
    
    let currentPattern = patterns[0];
    for (let i = 1; i < patterns.length; i++) {
      const nextPattern = patterns[i];
      if (patternsOverlap(currentPattern, nextPattern)) {
        currentPattern = mergePatterns(currentPattern, nextPattern);
      } else {
        mergedPatterns.push(currentPattern);
        currentPattern = nextPattern;
      }
    }
    mergedPatterns.push(currentPattern);
  });

  return mergedPatterns;
}

function patternsOverlap(p1: Pattern, p2: Pattern): boolean {
  const p1End = Math.max(...p1.segments.map(s => s.endIndex));
  const p2Start = Math.min(...p2.segments.map(s => s.startIndex));
  return p1End >= p2Start;
}

function mergePatterns(p1: Pattern, p2: Pattern): Pattern {
  return {
    id: `${p1.id}_${p2.id}`,
    type: p1.type,
    segments: [...new Set([...p1.segments, ...p2.segments])],
    originalText: [...new Set([...p1.segments, ...p2.segments])]
      .sort((a, b) => a.startIndex - b.startIndex)
      .map(s => s.text)
      .join(' '),
    acousticFeatures: {
      primaryFeature: p1.acousticFeatures?.primaryFeature || "",
      secondaryFeatures: [...new Set([
        ...p1.acousticFeatures?.secondaryFeatures || [],
        ...p2.acousticFeatures?.secondaryFeatures || []
      ])]
    }
  };
}

function createPhoneticSegments(text: string, language: string, chunkStart: number): PhoneticSegment[] {
  const words = text.split(/\s+/);
  const segments: PhoneticSegment[] = [];
  let currentIndex = chunkStart;

  for (const word of words) {
    const phoneticForm = phoneticize(word);
    const stressPattern = getStressPattern(phoneticForm);
    const syllableCount = countSyllables(phoneticForm);

    segments.push({
      text: word,
      startIndex: currentIndex,
      endIndex: currentIndex + word.length,
      globalStartIndex: currentIndex,
      globalEndIndex: currentIndex + word.length,
      phoneticForm,
      stressPattern,
      syllableCount
    });

    currentIndex += word.length + 1; // +1 for the space
  }

  return segments;
}

function findRhymePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const rhymeGroups = new Map<string, PhoneticSegment[]>();

  segments.forEach(segment => {
    const rhymeSound = getRhymeSound(segment.phoneticForm);
    if (!rhymeGroups.has(rhymeSound)) {
      rhymeGroups.set(rhymeSound, []);
    }
    rhymeGroups.get(rhymeSound)?.push(segment);
  });

  rhymeGroups.forEach((groupSegments, rhymeSound) => {
    if (groupSegments.length >= 2) {
      patterns.push({
        id: `rhyme_${rhymeSound}`,
        type: 'rhyme',
        segments: groupSegments,
        originalText: groupSegments.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: 'end_rhyme',
          secondaryFeatures: ['vowel_harmony', 'consonant_harmony']
        }
      });
    }
  });

  return patterns;
}

function findAssonancePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const vowelPatterns = findSoundPatterns(segments, 'vowel');

  vowelPatterns.forEach(pattern => {
    if (pattern.positions.length >= 3) {
      const involvedSegments = pattern.positions.map(pos => segments[pos]);
      patterns.push({
        id: `assonance_${pattern.sound}`,
        type: 'assonance',
        segments: involvedSegments,
        originalText: involvedSegments.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: 'vowel_harmony',
          secondaryFeatures: [`vowel_${pattern.sound}`]
        }
      });
    }
  });

  return patterns;
}

function findConsonancePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const consonantPatterns = findSoundPatterns(segments, 'consonant');

  consonantPatterns.forEach(pattern => {
    if (pattern.positions.length >= 2) {
      const involvedSegments = pattern.positions.map(pos => segments[pos]);
      patterns.push({
        id: `consonance_${pattern.sound}`,
        type: 'consonance',
        segments: involvedSegments,
        originalText: involvedSegments.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: 'consonant_harmony',
          secondaryFeatures: [`consonant_${pattern.sound}`]
        }
      });
    }
  });

  return patterns;
}

function findAlliterationPatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  let currentPattern: PhoneticSegment[] = [];
  let currentSound = '';

  segments.forEach((segment, index) => {
    const initialSound = getInitialSound(segment.phoneticForm);
    
    if (initialSound === currentSound) {
      currentPattern.push(segment);
    } else {
      if (currentPattern.length >= 2) {
        patterns.push({
          id: `alliteration_${currentSound}_${index}`,
          type: 'alliteration',
          segments: [...currentPattern],
          originalText: currentPattern.map(s => s.text).join(' '),
          acousticFeatures: {
            primaryFeature: 'initial_consonant',
            secondaryFeatures: [`sound_${currentSound}`]
          }
        });
      }
      currentPattern = [segment];
      currentSound = initialSound;
    }
  });

  return patterns;
}

function findRhythmicPatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  let currentPattern: PhoneticSegment[] = [];
  let currentStress = '';

  segments.forEach((segment, index) => {
    if (segment.stressPattern === currentStress) {
      currentPattern.push(segment);
    } else {
      if (currentPattern.length >= 3) {
        patterns.push({
          id: `rhythm_${currentStress}_${index}`,
          type: 'rhythm',
          segments: [...currentPattern],
          originalText: currentPattern.map(s => s.text).join(' '),
          acousticFeatures: {
            primaryFeature: 'stress_pattern',
            secondaryFeatures: [`meter_${currentStress}`]
          }
        });
      }
      currentPattern = [segment];
      currentStress = segment.stressPattern;
    }
  });

  return patterns;
}

// Helper functions
function findSoundPatterns(segments: PhoneticSegment[], type: 'vowel' | 'consonant'): Array<{
  type: 'vowel' | 'consonant';
  sound: string;
  positions: number[];
}> {
  const patterns: Array<{
    type: 'vowel' | 'consonant';
    sound: string;
    positions: number[];
  }> = [];
  const soundMap = new Map<string, number[]>();

  segments.forEach((segment, index) => {
    const sounds = type === 'vowel' 
      ? extractVowelSounds(segment.phoneticForm)
      : extractConsonantSounds(segment.phoneticForm);

    sounds.forEach(sound => {
      if (!soundMap.has(sound)) {
        soundMap.set(sound, []);
      }
      soundMap.get(sound)?.push(index);
    });
  });

  soundMap.forEach((positions, sound) => {
    patterns.push({
      type,
      sound,
      positions
    });
  });

  return patterns;
}

function getStressPattern(phoneticForm: string): string {
  return phoneticForm.replace(/[^012]/g, '');
}

function countSyllables(phoneticForm: string): number {
  return (phoneticForm.match(/[aeiouAEIOU]/g) || []).length;
}

function getRhymeSound(phoneticForm: string): string {
  return phoneticForm.split('-').pop() || '';
}

function getInitialSound(phoneticForm: string): string {
  return phoneticForm.split('-')[0] || '';
}

// ... rest of the code ... 