import { Pattern, Segment, PatternType, PhoneticSegment as ObservationPhoneticSegment } from '../types/observation';
import { phoneticize, extractVowelSounds, extractConsonantSounds } from './phoneticService';

// Constants for text processing
const CHUNK_SIZE = 5000;
const OVERLAP_SIZE = 500;
const MAX_ENHANCED_PATTERNS = 40;

// Utility function to create proper segments with IDs
function createSegmentWithId(seg: any, index: number, patternType: string): Segment {
  return {
    id: `${patternType}_seg_${index}`,
    text: seg.text,
    startIndex: seg.startIndex,
    endIndex: seg.endIndex,
    globalStartIndex: seg.globalStartIndex,
    globalEndIndex: seg.globalEndIndex
  };
}

interface SoundQuality {
  vowels: string[];
  consonants: string[];
  stressPattern: string[];
}

interface PhoneticSegment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  globalStartIndex: number;
  globalEndIndex: number;
  phoneticForm: string;
  stressPattern: string;
  syllableCount: number;
  soundQuality: SoundQuality;
}

interface SoundPattern {
  type: 'vowel' | 'consonant' | 'combined';
  sound: string;
  positions: number[];
  strength: number;
  quality?: string[];
}

interface RhymeGroup {
  rhymeSound: string;
  segments: PhoneticSegment[];
  similarity: number;
}

export function findEnhancedPatterns(text: string, language: string = 'en'): Pattern[] {
  if (text.length < 2000) {
    return processChunk(text, 0, language);
  }
  
  const chunks = splitTextIntoChunks(text, CHUNK_SIZE, OVERLAP_SIZE);
  const maxChunks = 3;
  const limitedChunks = chunks.slice(0, maxChunks);
  
  const chunkPatterns = limitedChunks.map((chunk, index) => {
    const chunkStart = index * (CHUNK_SIZE - OVERLAP_SIZE);
    return processChunk(chunk, chunkStart, language);
  });

  const mergedPatterns = mergeChunkPatterns(chunkPatterns);
  return rankAndSelectPatterns(mergedPatterns, MAX_ENHANCED_PATTERNS);
}

function splitTextIntoChunks(text: string, chunkSize: number, overlapSize: number): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    const endPos = Math.min(currentPos + chunkSize, text.length);
    const chunk = text.slice(Math.max(0, currentPos - overlapSize), endPos);
    chunks.push(chunk);
    currentPos += chunkSize - overlapSize;
  }

  return chunks;
}

function processChunk(text: string, chunkStart: number, language: string): Pattern[] {
  const phoneticSegments = createPhoneticSegments(text, language, chunkStart);
  const patterns: Pattern[] = [];

  patterns.push(...findRhymePatterns(phoneticSegments));
  patterns.push(...findAssonancePatterns(phoneticSegments));
  patterns.push(...findConsonancePatterns(phoneticSegments));
  patterns.push(...findAlliterationPatterns(phoneticSegments));
  patterns.push(...findSibilancePatterns(phoneticSegments));
  patterns.push(...findFricativePatterns(phoneticSegments));
  patterns.push(...findPlosivePatterns(phoneticSegments));
  patterns.push(...findLiquidPatterns(phoneticSegments));
  patterns.push(...findRhythmicPatterns(phoneticSegments));

  return patterns;
}

function createPhoneticSegments(text: string, language: string, chunkStart: number): PhoneticSegment[] {
  const words = text.split(/\s+/);
  const segments: PhoneticSegment[] = [];
  let currentIndex = chunkStart;

  for (const word of words) {
    if (word.length < 2) continue;
    
    const phoneticForm = phoneticize(word);
    const stressPattern = getStressPattern(phoneticForm);
    const syllableCount = countSyllables(phoneticForm);
    const { vowels, consonants } = extractSounds(phoneticForm);

    segments.push({
      id: `segment_${currentIndex}_${word}`,
      text: word,
      startIndex: currentIndex,
      endIndex: currentIndex + word.length,
      globalStartIndex: currentIndex,
      globalEndIndex: currentIndex + word.length,
      phoneticForm,
      stressPattern,
      syllableCount,
      soundQuality: {
        vowels,
        consonants,
        stressPattern: stressPattern.split('')
      }
    });

    currentIndex += word.length + 1;
  }

  return segments;
}

function extractSounds(phoneticForm: string): { vowels: string[], consonants: string[] } {
  return {
    vowels: phoneticForm.match(/[aeiouæɪɛʊəɔʌɑː]/gi)?.map(v => v.toLowerCase()) || [],
    consonants: phoneticForm.match(/[bcdfghjklmnpqrstvwxyzʃʒθðŋ]/gi)?.map(c => c.toLowerCase()) || []
  };
}

// Sophisticated rhyme detection
function findRhymePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const rhymeGroups = groupByRhyme(segments);
  
  rhymeGroups.forEach((group: RhymeGroup, index: number) => {
    if (group.segments.length >= 2) {
      // Calculate rhyme strength based on phonetic similarity
      const rhymeStrength = calculateRhymeStrength(group.segments);
      
      // Determine rhyme type based on phonetic analysis
      const rhymeType = determineRhymeType(group.segments);
      
      const pattern: Pattern = {
        id: `rhyme_${index}`,
        type: rhymeType,
        segments: group.segments.map(s => s.id),
        originalText: group.segments.map(s => s.text).join(' '),
        significance: rhymeStrength,
        acousticFeatures: {
          primaryFeature: `${rhymeType.replace('_', ' ')} pattern: ${group.rhymeSound}`,
          secondaryFeatures: [
            `Strength: ${(rhymeStrength * 100).toFixed(0)}%`,
            `Sound: /${group.rhymeSound}/`,
            `Type: ${rhymeType}`,
            `Segments: ${group.segments.length}`
          ]
        },
        description: `${rhymeType.replace('_', ' ')} pattern with sound /${group.rhymeSound}/`
      };
      patterns.push(pattern);
    }
  });
  
  return patterns;
}

// Calculate rhyme strength based on phonetic similarity
function calculateRhymeStrength(segments: PhoneticSegment[]): number {
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const similarity = calculatePhoneticSimilarity(
        segments[i].phoneticForm,
        segments[j].phoneticForm
      );
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

// Determine rhyme type based on phonetic analysis
function determineRhymeType(segments: PhoneticSegment[]): PatternType {
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  
  // Check for internal rhyme
  const isInternal = Math.abs(
    firstSegment.startIndex - lastSegment.startIndex
  ) < 20;
  
  if (isInternal) {
    return 'internal_rhyme';
  }
  
  // Calculate phonetic similarity
  const similarity = calculatePhoneticSimilarity(
    firstSegment.phoneticForm,
    lastSegment.phoneticForm
  );
  
  // Determine rhyme type based on similarity
  if (similarity > 0.8) {
    return 'rhyme';
  } else {
    return 'slant_rhyme';
  }
}

// Calculate phonetic similarity between two phonetic forms
function calculatePhoneticSimilarity(form1: string, form2: string): number {
  const sound1 = extractRhymeSound(form1);
  const sound2 = extractRhymeSound(form2);
  
  if (!sound1 || !sound2) return 0;
  
  // Split into vowels and consonants
  const [vowels1, consonants1] = splitVowelsConsonants(sound1);
  const [vowels2, consonants2] = splitVowelsConsonants(sound2);
  
  // Calculate similarities
  const vowelSimilarity = calculateSoundSimilarity(vowels1, vowels2);
  const consonantSimilarity = calculateSoundSimilarity(consonants1, consonants2);
  
  // Weight vowels more heavily in rhyme similarity
  return (vowelSimilarity * 0.6) + (consonantSimilarity * 0.4);
}

// Split phonetic form into vowels and consonants
function splitVowelsConsonants(sound: string): [string, string] {
  const vowels = sound.match(/[aeiouæɪɛʊəɔʌɑː]/gi)?.join('') || '';
  const consonants = sound.match(/[bcdfghjklmnpqrstvwxyzʃʒθðŋ]/gi)?.join('') || '';
  return [vowels, consonants];
}

// Calculate similarity between two sound sequences
function calculateSoundSimilarity(sound1: string, sound2: string): number {
  if (!sound1 || !sound2) return 0;
  
  const maxLength = Math.max(sound1.length, sound2.length);
  let matches = 0;
  
  for (let i = 0; i < maxLength; i++) {
    if (sound1[i] === sound2[i]) {
      matches++;
    }
  }
  
  return matches / maxLength;
}

// Sophisticated assonance detection  
function findAssonancePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const vowelGroups = new Map<string, PhoneticSegment[]>();
  
  // Group segments by vowel pattern
  segments.forEach(segment => {
    const vowels = segment.soundQuality.vowels.join('');
    if (vowels.length > 0) {
      if (!vowelGroups.has(vowels)) {
        vowelGroups.set(vowels, []);
      }
      vowelGroups.get(vowels)!.push(segment);
    }
  });
  
  // Create patterns for each vowel group
  vowelGroups.forEach((group, vowels) => {
    if (group.length >= 3) {
      patterns.push({
        id: `assonance_${vowels}`,
        type: 'assonance',
        segments: group.map(s => s.id),
        originalText: group.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: `Assonance pattern: ${vowels}`,
          secondaryFeatures: [
            `Vowel sounds: ${vowels}`,
            `${group.length} segments`
          ]
        },
        description: `Assonance pattern with vowel sounds: ${vowels}`
      });
    }
  });
  
  return patterns;
}

// Sophisticated consonance detection
function findConsonancePatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const consonantGroups = new Map<string, PhoneticSegment[]>();
  
  // Group segments by consonant pattern
  segments.forEach(segment => {
    const consonants = segment.soundQuality.consonants.join('');
    if (consonants.length > 0) {
      if (!consonantGroups.has(consonants)) {
        consonantGroups.set(consonants, []);
      }
      consonantGroups.get(consonants)!.push(segment);
    }
  });
  
  // Create patterns for each consonant group
  consonantGroups.forEach((group, consonants) => {
    if (group.length >= 3) {
      patterns.push({
        id: `consonance_${consonants}`,
        type: 'consonance',
        segments: group.map(s => s.id),
        originalText: group.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: `Consonance pattern: ${consonants}`,
          secondaryFeatures: [
            `Consonant sounds: ${consonants}`,
            `${group.length} segments`
          ]
        },
        description: `Consonance pattern with consonant sounds: ${consonants}`
      });
    }
  });
  
  return patterns;
}

// Sophisticated alliteration detection
function findAlliterationPatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const initialSoundGroups = new Map<string, PhoneticSegment[]>();
  
  // Group segments by initial sound
  segments.forEach(segment => {
    const initialSound = segment.soundQuality.consonants[0];
    if (initialSound) {
      if (!initialSoundGroups.has(initialSound)) {
        initialSoundGroups.set(initialSound, []);
      }
      initialSoundGroups.get(initialSound)!.push(segment);
    }
  });
  
  // Create patterns for each initial sound group
  initialSoundGroups.forEach((group, sound) => {
    if (group.length >= 3) {
      patterns.push({
        id: `alliteration_${sound}`,
        type: 'alliteration',
        segments: group.map(s => s.id),
        originalText: group.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: `Alliteration pattern: ${sound}`,
          secondaryFeatures: [
            `Initial sound: ${sound}`,
            `${group.length} segments`
          ]
        },
        description: `Alliteration pattern with initial sound: ${sound}`
      });
    }
  });
  
  return patterns;
}

function findSibilancePatterns(segments: PhoneticSegment[]): Pattern[] {
  return findSpecializedConsonantPatterns(segments, 'sibilance', ['s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ']);
}

function findFricativePatterns(segments: PhoneticSegment[]): Pattern[] {
  return findSpecializedConsonantPatterns(segments, 'fricative', ['f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ']);
}

function findPlosivePatterns(segments: PhoneticSegment[]): Pattern[] {
  return findSpecializedConsonantPatterns(segments, 'plosive', ['p', 'b', 't', 'd', 'k', 'g']);
}

function findLiquidPatterns(segments: PhoneticSegment[]): Pattern[] {
  return findSpecializedConsonantPatterns(segments, 'liquid', ['l', 'r']);
}

function findRhythmicPatterns(segments: PhoneticSegment[]): Pattern[] {
  const patterns: Pattern[] = [];
  const rhythmGroups = groupByRhythmicPattern(segments);
  
  rhythmGroups.forEach((group, index) => {
    if (group.length >= 3) {
      const pattern: Pattern = {
        id: `rhythm_${index}`,
        type: 'rhythm',
        segments: group.map(s => s.id),
        originalText: group.map(s => s.text).join(' '),
        acousticFeatures: {
          primaryFeature: 'Rhythmic pattern',
          secondaryFeatures: [
            `${group.length} segments`,
            'Regular stress pattern',
            'Consistent timing'
          ]
        },
        description: 'Regular rhythmic pattern detected'
      };
      patterns.push(pattern);
    }
  });
  
  return patterns;
}

function findSpecializedConsonantPatterns(segments: PhoneticSegment[], patternType: string, targetSounds: string[]): Pattern[] {
  const patterns: Pattern[] = [];
  const matchingSegments = segments.filter(seg => 
    targetSounds.some(sound => seg.phoneticForm.includes(sound))
  );

  if (matchingSegments.length >= 3) {
    const pattern: Pattern = {
      id: `${patternType}_0`,
      type: patternType as PatternType,
      segments: matchingSegments.map(s => s.id),
      originalText: matchingSegments.map(s => s.text).join(' '),
      acousticFeatures: {
        primaryFeature: `${patternType} pattern`,
        secondaryFeatures: targetSounds.filter(sound => 
          matchingSegments.some(seg => seg.phoneticForm.includes(sound))
        )
      },
      description: `${patternType.charAt(0).toUpperCase() + patternType.slice(1)} sound pattern`
    };
    patterns.push(pattern);
  }

  return patterns;
}

// Sophisticated helper functions
function getStressPattern(phoneticForm: string): string {
  // Analyze stress based on vowel prominence and position
  const syllables = phoneticForm.split(/[aeiouæɪɛʊəɔʌɑː]/gi);
  if (syllables.length <= 1) return 'mono';
  if (syllables.length === 2) return 'trochee'; // Strong-weak
  return 'complex';
}

function countSyllables(phoneticForm: string): number {
  // Count vowel sounds for syllable estimation
  const vowelMatches = phoneticForm.match(/[aeiouæɪɛʊəɔʌɑː]/gi);
  return vowelMatches ? vowelMatches.length : 1;
}

function analyzeSoundQuality(phoneticForm: string): SoundQuality {
  const vowels = phoneticForm.match(/[aeiouæɪɛʊəɔʌɑː]/gi)?.map(v => v.toLowerCase()) || [];
  const consonants = phoneticForm.match(/[bcdfghjklmnpqrstvwxyzʃʒθðŋ]/gi)?.map(c => c.toLowerCase()) || [];
  const stressPattern = getStressPattern(phoneticForm).split('');
  
  return {
    vowels,
    consonants,
    stressPattern
  };
}

function groupByRhyme(segments: PhoneticSegment[]): RhymeGroup[] {
  const rhymeMap = new Map<string, PhoneticSegment[]>();
  
  segments.forEach(segment => {
    const rhymeSound = extractRhymeSound(segment.phoneticForm);
    if (rhymeSound) {
      if (!rhymeMap.has(rhymeSound)) {
        rhymeMap.set(rhymeSound, []);
      }
      rhymeMap.get(rhymeSound)!.push(segment);
    }
  });
  
  return Array.from(rhymeMap.entries()).map(([sound, segs]) => ({
    rhymeSound: sound,
    segments: segs,
    similarity: calculateRhymeSimilarity(segs)
  }));
}

function groupByVowelPattern(segments: PhoneticSegment[]): PhoneticSegment[][] {
  const vowelGroups = new Map<string, PhoneticSegment[]>();
  
  segments.forEach(segment => {
    const vowelPattern = extractVowelPattern(segment.phoneticForm);
    if (vowelPattern) {
      if (!vowelGroups.has(vowelPattern)) {
        vowelGroups.set(vowelPattern, []);
      }
      vowelGroups.get(vowelPattern)!.push(segment);
    }
  });
  
  return Array.from(vowelGroups.values()).filter(group => group.length >= 2);
}

function groupByConsonantPattern(segments: PhoneticSegment[]): PhoneticSegment[][] {
  const consonantGroups = new Map<string, PhoneticSegment[]>();
  
  segments.forEach(segment => {
    const consonantPattern = extractConsonantPattern(segment.phoneticForm);
    if (consonantPattern) {
      if (!consonantGroups.has(consonantPattern)) {
        consonantGroups.set(consonantPattern, []);
      }
      consonantGroups.get(consonantPattern)!.push(segment);
    }
  });
  
  return Array.from(consonantGroups.values()).filter(group => group.length >= 2);
}

function groupByInitialSound(segments: PhoneticSegment[]): PhoneticSegment[][] {
  const initialGroups = new Map<string, PhoneticSegment[]>();
  
  segments.forEach(segment => {
    const initialSound = segment.phoneticForm.charAt(0);
    if (initialSound && /[bcdfghjklmnpqrstvwxyz]/i.test(initialSound)) {
      if (!initialGroups.has(initialSound)) {
        initialGroups.set(initialSound, []);
      }
      initialGroups.get(initialSound)!.push(segment);
    }
  });
  
  return Array.from(initialGroups.values()).filter(group => group.length >= 2);
}

function groupByRhythmicPattern(segments: PhoneticSegment[]): Map<string, PhoneticSegment[]> {
  const rhythmGroups = new Map<string, PhoneticSegment[]>();
  
  segments.forEach(segment => {
    const rhythmKey = `${segment.stressPattern}_${segment.syllableCount}`;
    if (!rhythmGroups.has(rhythmKey)) {
      rhythmGroups.set(rhythmKey, []);
    }
    rhythmGroups.get(rhythmKey)!.push(segment);
  });
  
  return rhythmGroups;
}

// Sophisticated extraction functions
function extractRhymeSound(phoneticForm: string): string | null {
  // Extract the ending sound pattern for rhyme detection
  const match = phoneticForm.match(/([aeiouæɪɛʊəɔʌɑː][bcdfghjklmnpqrstvwxyzʃʒθðŋ]*)$/i);
  return match ? match[1] : null;
}

function extractVowelPattern(phoneticForm: string): string | null {
  // Extract primary vowel sounds
  const vowels = phoneticForm.match(/[aeiouæɪɛʊəɔʌɑː]/gi);
  return vowels ? vowels.join('') : null;
}

function extractConsonantPattern(phoneticForm: string): string | null {
  // Extract primary consonant clusters
  const consonants = phoneticForm.match(/[bcdfghjklmnpqrstvwxyzʃʒθðŋ]/gi);
  return consonants && consonants.length >= 2 ? consonants.join('') : null;
}

function calculateRhymeSimilarity(segments: PhoneticSegment[]): number {
  if (segments.length < 2) return 0;
  
  // Calculate similarity based on phonetic endings
  const endings = segments.map(s => extractRhymeSound(s.phoneticForm) || '');
  const longestEnding = Math.max(...endings.map(e => e.length));
  
  return longestEnding > 0 ? longestEnding / 4 : 0.5; // Normalize to 0-1 range
}

function mergeChunkPatterns(chunkPatterns: Pattern[][]): Pattern[] {
  // Merge patterns from multiple chunks, removing duplicates
  const allPatterns = chunkPatterns.flat();
  const uniquePatterns = new Map<string, Pattern>();
  
  allPatterns.forEach(pattern => {
    const key = `${pattern.type}_${pattern.originalText}`;
    if (!uniquePatterns.has(key)) {
      uniquePatterns.set(key, pattern);
    }
  });
  
  return Array.from(uniquePatterns.values());
}

function rankAndSelectPatterns(patterns: Pattern[], maxCount: number): Pattern[] {
  // Rank patterns by sophistication and select the best ones
  return patterns
    .sort((a, b) => {
      const scoreA = a.segments.length * (a.acousticFeatures?.secondaryFeatures?.length || 1);
      const scoreB = b.segments.length * (b.acousticFeatures?.secondaryFeatures?.length || 1);
      return scoreB - scoreA;
    })
    .slice(0, maxCount);
}