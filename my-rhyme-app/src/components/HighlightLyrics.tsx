import React, { useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Utility to assign a color to each phonetic_link_id
const COLORS = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac', '#ffb74d', '#a1887f', '#90a4ae', '#f06292',
  '#7986cb', '#aed581', '#fff176', '#9575cd', '#4fc3f7', '#ff8a65', '#dce775', '#b0bec5', '#f44336', '#2196f3',
];

// Memoized color map
const colorMap = new Map<string, string>();

export function getColorForGroup(groupId: string) {
  if (!groupId || typeof groupId !== 'string') return '#ccc';
  
  // Check memoized color first
  if (colorMap.has(groupId)) {
    return colorMap.get(groupId)!;
  }
  
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = COLORS[Math.abs(hash) % COLORS.length];
  colorMap.set(groupId, color);
  return color;
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

// Memoized segment flattening
function useFlattenedSegments(patterns: HighlightLyricsProps['patterns'], lyrics: string) {
  return useMemo(() => {
    const all: Segment[] = [];
    for (const pattern of patterns) {
      if (!Array.isArray(pattern.segments)) continue;
      for (const seg of pattern.segments) {
        all.push({
          ...seg,
          phonetic_link_id: pattern.phonetic_link_id,
        });
      }
    }
    return all
      .filter(seg => 
        seg.globalStartIndex >= 0 &&
        seg.globalEndIndex <= lyrics.length &&
        seg.globalStartIndex <= seg.globalEndIndex
      )
      .sort((a, b) => a.globalStartIndex - b.globalStartIndex);
  }, [patterns, lyrics.length]);
}

// Split text into lines for virtual scrolling
function splitTextIntoLines(text: string, segments: Segment[]): Array<{
  text: string;
  startIndex: number;
  endIndex: number;
  segments: Segment[];
}> {
  const lines: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    segments: Segment[];
  }> = [];
  
  let currentLine = '';
  let currentStartIndex = 0;
  let currentSegments: Segment[] = [];
  
  for (let i = 0; i < text.length; i++) {
    currentLine += text[i];
    
    // Check if current position has any segments
    const activeSegments = segments.filter(seg => 
      i >= seg.globalStartIndex && i < seg.globalEndIndex
    );
    
    if (activeSegments.length > 0) {
      currentSegments.push(...activeSegments);
    }
    
    // Split on newline or if line gets too long
    if (text[i] === '\n' || currentLine.length >= 100) {
      lines.push({
        text: currentLine.trim(),
        startIndex: currentStartIndex,
        endIndex: i,
        segments: [...new Set(currentSegments)]
      });
      currentLine = '';
      currentStartIndex = i + 1;
      currentSegments = [];
    }
  }
  
  // Add the last line if there's any remaining text
  if (currentLine.trim()) {
    lines.push({
      text: currentLine.trim(),
      startIndex: currentStartIndex,
      endIndex: text.length,
      segments: [...new Set(currentSegments)]
    });
  }
  
  return lines;
}

interface AutoSizerProps {
  height: number;
  width: number;
}

const HighlightLyrics: React.FC<HighlightLyricsProps> = ({ lyrics, patterns }) => {
  if (!patterns || patterns.length === 0) return <span>{lyrics}</span>;
  
  const segments = useFlattenedSegments(patterns, lyrics);
  const lines = useMemo(() => splitTextIntoLines(lyrics, segments), [lyrics, segments]);
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const line = lines[index];
    const output: React.ReactNode[] = [];
    let lastIdx = 0;
    
    // Sort segments for this line by start index
    const lineSegments = line.segments.sort((a, b) => a.globalStartIndex - b.globalStartIndex);
    
    for (const seg of lineSegments) {
      // Add text before the segment
      if (seg.globalStartIndex > lastIdx) {
        output.push(line.text.slice(lastIdx - line.startIndex, seg.globalStartIndex - line.startIndex));
      }
      
      // Add the highlighted segment
      output.push(
        <span
          key={`${seg.globalStartIndex}-${seg.globalEndIndex}-${seg.phonetic_link_id}`}
          style={{
            backgroundColor: getColorForGroup(seg.phonetic_link_id),
            borderRadius: 3,
            padding: '0 2px',
            color: '#222',
            border: '2px solid #000',
            fontWeight: 'bold',
            fontSize: '1.1em',
          }}
          title={`${seg.phonetic_link_id} [${seg.globalStartIndex},${seg.globalEndIndex}] "${lyrics.slice(seg.globalStartIndex, seg.globalEndIndex)}"`}
        >
          {line.text.slice(seg.globalStartIndex - line.startIndex, seg.globalEndIndex - line.startIndex)}
        </span>
      );
      lastIdx = seg.globalEndIndex;
    }
    
    // Add any remaining text
    if (lastIdx < line.endIndex) {
      output.push(line.text.slice(lastIdx - line.startIndex));
    }
    
    return <div style={style}>{output}</div>;
  };
  
  if (patterns.length > 0 && segments.length === 0) {
    return <span style={{ color: 'red', fontWeight: 'bold' }}>No highlights rendered. Check segment indices and input text.</span>;
  }
  
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <AutoSizer>
        {({ height, width }: AutoSizerProps) => (
          <List
            height={height}
            width={width}
            itemCount={lines.length}
            itemSize={35}
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default HighlightLyrics; 