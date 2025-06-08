import React from 'react';

// Utility to assign a color to each phonetic_link_id
const COLORS = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac', '#ffb74d', '#a1887f', '#90a4ae', '#f06292',
  '#7986cb', '#aed581', '#fff176', '#9575cd', '#4fc3f7', '#ff8a65', '#dce775', '#b0bec5', '#f44336', '#2196f3',
];

export function getColorForGroup(groupId: string) {
  // Simple hash to pick a color for each group
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Segment {
  globalStartIndex: number;
  globalEndIndex: number;
  text: string;
  phonetic_link_id: string;
}

interface HighlightLyricsProps {
  lyrics: string;
  patterns: Array<{
    phonetic_link_id: string;
    pattern_description: string;
    segments: Array<{
      globalStartIndex: number;
      globalEndIndex: number;
      text: string;
    }>;
  }>;
}

// Flattens all segments and adds group id
function flattenSegments(patterns: HighlightLyricsProps['patterns']): Segment[] {
  const all: Segment[] = [];
  for (const pattern of patterns) {
    for (const seg of pattern.segments) {
      all.push({
        ...seg,
        phonetic_link_id: pattern.phonetic_link_id,
      });
    }
  }
  // Sort by start index for correct rendering
  return all.sort((a, b) => a.globalStartIndex - b.globalStartIndex);
}

const HighlightLyrics: React.FC<HighlightLyricsProps> = ({ lyrics, patterns }) => {
  console.log('HighlightLyrics patterns:', patterns);
  if (!patterns || patterns.length === 0) return <span>{lyrics}</span>;
  const segments = flattenSegments(patterns).filter(seg =>
    seg.globalStartIndex >= 0 &&
    seg.globalEndIndex < lyrics.length &&
    seg.globalStartIndex <= seg.globalEndIndex
  );
  console.log('Highlight segments:', segments, 'Lyrics:', lyrics);
  const output: React.ReactNode[] = [];
  let lastIdx = 0;
  let highlightCount = 0;

  for (const seg of segments) {
    // Add text before the segment
    if (seg.globalStartIndex > lastIdx) {
      output.push(lyrics.slice(lastIdx, seg.globalStartIndex));
    }
    // Add the highlighted segment
    output.push(
      <span
        key={seg.globalStartIndex + '-' + seg.globalEndIndex + '-' + seg.phonetic_link_id}
        style={{
          backgroundColor: getColorForGroup(seg.phonetic_link_id),
          borderRadius: 3,
          padding: '0 2px',
          color: '#222',
          border: '2px solid #000',
          fontWeight: 'bold',
          fontSize: '1.1em',
        }}
        title={
          `${seg.phonetic_link_id} [${seg.globalStartIndex},${seg.globalEndIndex}] "${lyrics.slice(seg.globalStartIndex, seg.globalEndIndex + 1)}"`
        }
      >
        {lyrics.slice(seg.globalStartIndex, seg.globalEndIndex + 1)}
      </span>
    );
    lastIdx = seg.globalEndIndex + 1;
    highlightCount++;
  }
  // Add any remaining text
  if (lastIdx < lyrics.length) {
    output.push(lyrics.slice(lastIdx));
  }
  if (patterns.length > 0 && highlightCount === 0) {
    console.warn('HighlightLyrics: Patterns present but no highlights rendered. Check segment indices and input text.');
    return <span style={{ color: 'red', fontWeight: 'bold' }}>No highlights rendered. Check segment indices and input text.</span>;
  }
  return <span>{output}</span>;
};

export default HighlightLyrics; 