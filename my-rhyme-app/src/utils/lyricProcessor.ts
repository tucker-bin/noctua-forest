export interface ProcessedLyrics {
  patterns: {
    [key: string]: Array<{
      text: string;
      positions: number[];
    }>;
  };
  highlights: Array<{
    type: string;
    startIndex: number;
    endIndex: number;
    text: string;
  }>;
}

export async function processLyrics(lyrics: string): Promise<ProcessedLyrics> {
  // Mock implementation for now
  // In a real app, this would call your API to analyze the text
  
  // Simple pattern detection for demonstration
  const words = lyrics.split(/\s+/);
  const patterns: ProcessedLyrics['patterns'] = {
    perfectRhymes: [],
    assonance: [],
    consonance: [],
    alliteration: []
  };
  
  const highlights: ProcessedLyrics['highlights'] = [];
  
  // Simple alliteration detection (words starting with same letter)
  let currentIndex = 0;
  words.forEach((word, i) => {
    if (i > 0 && word[0]?.toLowerCase() === words[i-1][0]?.toLowerCase()) {
      highlights.push({
        type: 'alliteration',
        startIndex: currentIndex - words[i-1].length - 1,
        endIndex: currentIndex + word.length,
        text: `${words[i-1]} ${word}`
      });
      
      patterns.alliteration.push({
        text: `${words[i-1]} ${word}`,
        positions: [i-1, i]
      });
    }
    currentIndex += word.length + 1;
  });
  
  // Add some mock rhyme patterns for demonstration
  if (lyrics.toLowerCase().includes('time') && lyrics.toLowerCase().includes('rhyme')) {
    patterns.perfectRhymes.push({
      text: 'time-rhyme',
      positions: [0, 1]
    });
  }
  
  return {
    patterns,
    highlights
  };
} 