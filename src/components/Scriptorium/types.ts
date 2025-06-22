// Core data structures for Song Scriptorium

export interface SongDetailsData {
  artistName: string;
  albumName: string;
  duration: string; // e.g., "3:41"
  title: string;
  releaseYear?: number;
  genre?: string[];
}

export interface StructuralAnalysisData {
  tempo: number; // BPM
  timeSignature: string; // e.g., "4/4"
  key: string; // e.g., "C Major"
  mode?: 'major' | 'minor';
  energy?: number; // 0-100
}

export interface LyricalTheme {
  name: string;
  value: number; // percentage
  color: string; // hex code
}

export interface LyricalThemesData {
  themes: LyricalTheme[];
}

export interface EmotionPoint {
  subject: string; // e.g., "Anger", "Joy"
  value: number;   // 0-100
  fullMark?: number; // Max value for the axis
}

export interface EmotionalAnalysisData {
  emotions: EmotionPoint[];
}

export interface SongMeaningData {
  meaningText: string;
  confidence?: number;
  interpretations?: string[];
}

export interface MoodPoint {
  section: string; // "Intro", "Verse 1", etc.
  energyLevel: number; // 0-100
  timestamp?: number; // seconds from start
}

export interface MoodTimelineData {
  points: MoodPoint[];
}

// Complete observation result
export interface SongObservation {
  id: string;
  userId: string;
  timestamp: Date;
  songDetails: SongDetailsData;
  structuralAnalysis: StructuralAnalysisData;
  lyricalThemes: LyricalThemesData;
  emotionalAnalysis: EmotionalAnalysisData;
  songMeaning: SongMeaningData;
  moodTimeline: MoodTimelineData;
  audioFeatures?: {
    danceability: number;
    acousticness: number;
    instrumentalness: number;
    speechiness: number;
    valence: number;
  };
} 