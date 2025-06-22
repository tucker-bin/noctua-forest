import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { ObservationData, Pattern, PatternType, Observation } from '../types/observation';
import { findEnhancedPatterns } from './patternRecognition';
import { rateLimiter } from './rateLimiter';
import { cacheService } from './cacheService';
import { 
  validateText, 
  ObservationError, 
  ExternalServiceError,
  ValidationError
} from '../utils/errors';
import { settings } from '../config/settings';
import { db } from '../config/firebase';

// Music-specific types extending Observatory system
interface SongDetailsData {
  title: string;
  artistName: string;
  albumName: string;
  duration: string;
  releaseYear?: number;
  genre?: string[];
}

interface MusixmatchTrack {
  track_id: number;
  track_name: string;
  track_artist: string;
  track_album: string;
  track_length: number;
  track_rating: number;
  has_lyrics: boolean;
  primary_genres?: {
    music_genre_list: Array<{
      music_genre: {
        music_genre_name: string;
      };
    }>;
  };
}

interface MusixmatchLyrics {
  lyrics_body: string;
  lyrics_language: string;
  lyrics_copyright: string;
}

interface LyricalTheme {
  name: string;
  value: number;
  color: string;
}

interface EmotionPoint {
  subject: string;
  value: number;
  fullMark?: number;
}

interface MoodPoint {
  section: string;
  energyLevel: number;
  timestamp?: number;
}

interface MusicObservation extends Observation {
  musicMetadata: {
    songDetails: SongDetailsData;
    lyricsSource: 'musixmatch' | 'manual' | 'hybrid';
    confidence: number;
    originalInput?: string;
  };
  enhancedAnalysis: {
    songStructure: Array<{ section: string; startLine: number; endLine: number }>;
    lyricalThemes: LyricalTheme[];
    emotionalAnalysis: EmotionPoint[];
    moodTimeline: MoodPoint[];
  };
}

interface LyricsProcessingResult {
  originalInput: string;
  cleanedLyrics?: string;
  songMetadata?: SongDetailsData;
  confidence: number;
  source: 'manual' | 'musixmatch';
  detectedSongInfo?: { title?: string; artist?: string };
}

export class MusicAnalysisService {
  private baseUrl = 'https://api.musixmatch.com/ws/1.1';
  private apiKey: string;
  private observationsRef = db.collection('music_observations');
  private cacheRef = db.collection('music_observation_cache');

  constructor() {
    this.apiKey = process.env.MUSIXMATCH_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('Musixmatch API key not configured - using manual mode only');
    }
  }

  /**
   * Main analysis method - handles both scenarios:
   * 1. Smart lyrics cleanup from messy user input
   * 2. Enhanced context from song identification
   */
  async analyzeLyrics(
    userInput: string, 
    userId: string, 
    language: string = 'en'
  ): Promise<MusicObservation & { modelUsed: string; cost: number; tokensUsed: number }> {
    try {
      validateText(userInput);
      await rateLimiter.checkLimit(userId);

      // STEP 1: Smart lyrics processing (Scenario 1 & 2)
      const lyricsResult = await this.processLyricsInput(userInput);
      
      // STEP 2: Use Observatory pattern analysis on cleaned lyrics
      const textToAnalyze = lyricsResult.cleanedLyrics || lyricsResult.originalInput;
      const observationResult = await this.performObservatoryAnalysis(textToAnalyze, userId, language);
      
      // STEP 3: Add music-specific analysis
      const musicAnalysis = await this.performMusicSpecificAnalysis(textToAnalyze, lyricsResult.songMetadata);
      
      // STEP 4: Create unified music observation
      const musicObservation: Omit<MusicObservation, 'id'> = {
        data: {
          patterns: observationResult.patterns,
          originalText: observationResult.text,
          timestamp: new Date().toISOString(),
          constellations: observationResult.constellations || []
        },
        metadata: {
          userId: observationResult.userId,
          title: lyricsResult.songMetadata?.title || 'Unknown Song',
          description: `Musical observation of ${lyricsResult.songMetadata?.artistName || 'Unknown Artist'}`,
          tags: ['music', 'lyrics', ...(lyricsResult.songMetadata?.genre || [])],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          language: observationResult.language
        },
        musicMetadata: {
          songDetails: lyricsResult.songMetadata || this.extractBasicSongInfo(userInput),
          lyricsSource: lyricsResult.source,
          confidence: lyricsResult.confidence,
          originalInput: userInput
        },
        enhancedAnalysis: musicAnalysis
      };

      // STEP 5: Save to database
      const docRef = await this.observationsRef.add(musicObservation);
      const savedObservation: MusicObservation = {
        id: docRef.id,
        ...musicObservation
      };

      logger.info('Music observation completed', { 
        userId, 
        songTitle: lyricsResult.songMetadata?.title,
        source: lyricsResult.source,
        confidence: lyricsResult.confidence,
        patternCount: observationResult.patterns.length
      });

      return {
        ...savedObservation,
        modelUsed: observationResult.modelUsed || 'enhanced-pattern-recognition',
        cost: observationResult.cost || 0,
        tokensUsed: observationResult.tokensUsed || 0
      };

    } catch (error) {
      logger.error('Music analysis failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        inputLength: userInput?.length
      });
      throw new ObservationError('Failed to analyze music content');
    }
  }

  /**
   * Smart lyrics processing - extracts song info and gets clean lyrics
   */
  private async processLyricsInput(userInput: string): Promise<LyricsProcessingResult> {
    // Extract potential song info from user input
    const songInfo = this.extractSongInfo(userInput);
    
    if (!this.apiKey || (!songInfo.title && !songInfo.artist)) {
      // No API key or no identifiable song info - manual processing
      return {
        originalInput: userInput,
        cleanedLyrics: this.cleanManualLyrics(userInput),
        confidence: 0.3,
        source: 'manual',
        detectedSongInfo: songInfo
      };
    }

    try {
      // Search Musixmatch for the song
      const searchResults = await this.searchTracks(songInfo.title || userInput, songInfo.artist);
      
      if (searchResults.length === 0) {
        return {
          originalInput: userInput,
          cleanedLyrics: this.cleanManualLyrics(userInput),
          confidence: 0.4,
          source: 'manual',
          detectedSongInfo: songInfo
        };
      }

      // Get the best match
      const bestMatch = searchResults[0].track;
      const lyricsResult = await this.getLyrics(bestMatch.track_id);
      
      if (!lyricsResult) {
        return {
          originalInput: userInput,
          cleanedLyrics: this.cleanManualLyrics(userInput),
          songMetadata: this.formatTrackMetadata(bestMatch),
          confidence: 0.6,
          source: 'manual',
          detectedSongInfo: songInfo
        };
      }

      return {
        originalInput: userInput,
        cleanedLyrics: lyricsResult.lyrics.lyrics_body,
        songMetadata: this.formatTrackMetadata(bestMatch),
        confidence: 0.9,
        source: 'musixmatch',
        detectedSongInfo: songInfo
      };

    } catch (error) {
      logger.warn('Musixmatch lookup failed, falling back to manual processing:', error);
      return {
        originalInput: userInput,
        cleanedLyrics: this.cleanManualLyrics(userInput),
        confidence: 0.3,
        source: 'manual',
        detectedSongInfo: songInfo
      };
    }
  }

  /**
   * Use existing Observatory pattern analysis system
   */
  private async performObservatoryAnalysis(text: string, userId: string, language: string) {
    // Import the observation service dynamically to avoid circular dependencies
    const { observationService } = await import('./observationService');
    
    // Use the same pattern analysis as Observatory
    return await observationService.observeText(text, userId, language, {
      focusMode: 'comprehensive',
      complexity: 'standard'
    });
  }

  /**
   * Add music-specific analysis capabilities
   */
  private async performMusicSpecificAnalysis(
    lyrics: string, 
    songMetadata?: SongDetailsData
  ): Promise<{
    songStructure: Array<{ section: string; startLine: number; endLine: number }>;
    lyricalThemes: LyricalTheme[];
    emotionalAnalysis: EmotionPoint[];
    moodTimeline: MoodPoint[];
  }> {
    
    // Analyze song structure from lyrics
    const songStructure = this.analyzeSongStructure(lyrics);
    
    // Generate lyrical themes based on content analysis
    const lyricalThemes = await this.analyzeLyricalThemes(lyrics, songMetadata);
    
    // Emotional analysis based on lyrics sentiment
    const emotionalAnalysis = await this.analyzeEmotions(lyrics);
    
    // Mood timeline across song sections
    const moodTimeline = this.analyzeMoodTimeline(lyrics, songStructure);

    return {
      songStructure,
      lyricalThemes,
      emotionalAnalysis,
      moodTimeline
    };
  }

  /**
   * Musixmatch API methods
   */
  private async searchTracks(query: string, artist?: string): Promise<{ track: MusixmatchTrack }[]> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        q: query,
        page_size: '5',
        s_track_rating: 'desc'
      });

      if (artist) {
        params.append('q_artist', artist);
      }

      const response = await axios.get(`${this.baseUrl}/track.search`, { params });
      
      if (response.data.message.header.status_code === 200) {
        return response.data.message.body.track_list;
      }
      
      return [];
    } catch (error) {
      logger.error('Musixmatch search failed:', error);
      return [];
    }
  }

  private async getLyrics(trackId: number): Promise<{ lyrics: MusixmatchLyrics } | null> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        track_id: trackId.toString()
      });

      const response = await axios.get(`${this.baseUrl}/track.lyrics.get`, { params });
      
      if (response.data.message.header.status_code === 200) {
        return response.data.message.body;
      }
      
      return null;
    } catch (error) {
      logger.error('Musixmatch lyrics fetch failed:', error);
      return null;
    }
  }

  /**
   * Utility methods for processing
   */
  private extractSongInfo(input: string): { title?: string; artist?: string } {
    const patterns = [
      /^["']?([^"']+?)["']?\s+by\s+(.+?)$/i,      // "Song Title by Artist"
      /^(.+?)\s*[-–—]\s*(.+?)$/,                   // "Artist - Song Title"
      /^\[([^\]]+)\]\s*(.+?)$/,                    // "[Artist] Song Title"
      /^(.+?):\s*(.+?)$/                           // "Artist: Song Title"
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return {
          artist: match[1].trim(),
          title: match[2].trim()
        };
      }
    }

    // Try metadata markers
    const lines = input.split('\n');
    let title, artist;
    
    for (const line of lines.slice(0, 5)) {
      if (line.toLowerCase().includes('title:') || line.toLowerCase().includes('song:')) {
        title = line.split(':')[1]?.trim();
      }
      if (line.toLowerCase().includes('artist:') || line.toLowerCase().includes('by:')) {
        artist = line.split(':')[1]?.trim();
      }
    }

    return { title, artist };
  }

  private cleanManualLyrics(input: string): string {
    return input
      .replace(/^(title|artist|album|year):\s*.+$/gim, '')
      .replace(/^\[(verse|chorus|bridge|intro|outro|pre-?chorus)(\s+\d+)?\]\s*$/gim, '')
      .replace(/^\[\d+:\d+\.\d+\]\s*/gm, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  private formatTrackMetadata(track: MusixmatchTrack): SongDetailsData {
    return {
      title: track.track_name,
      artistName: track.track_artist,
      albumName: track.track_album,
      duration: this.formatDuration(track.track_length),
      genre: track.primary_genres?.music_genre_list.map(g => g.music_genre.music_genre_name) || []
    };
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private extractBasicSongInfo(input: string): SongDetailsData {
    const songInfo = this.extractSongInfo(input);
    return {
      title: songInfo.title || 'Unknown Song',
      artistName: songInfo.artist || 'Unknown Artist',
      albumName: 'Unknown Album',
      duration: '0:00'
    };
  }

  /**
   * Music-specific analysis methods
   */
  private analyzeSongStructure(lyrics: string): Array<{ section: string; startLine: number; endLine: number }> {
    const lines = lyrics.split('\n');
    const structure: Array<{ section: string; startLine: number; endLine: number }> = [];
    let currentSection = 'Verse';
    let sectionStart = 0;

    const sectionMarkers = {
      verse: /^\s*\[?(verse|v)\s*\d*\]?\s*$/i,
      chorus: /^\s*\[?(chorus|hook|refrain)\s*\d*\]?\s*$/i,
      bridge: /^\s*\[?(bridge|b)\s*\d*\]?\s*$/i,
      intro: /^\s*\[?(intro|introduction)\s*\]?\s*$/i,
      outro: /^\s*\[?(outro|end)\s*\]?\s*$/i,
      preChorus: /^\s*\[?(pre-?chorus|pc)\s*\]?\s*$/i
    };

    lines.forEach((line, index) => {
      for (const [section, pattern] of Object.entries(sectionMarkers)) {
        if (pattern.test(line)) {
          if (structure.length > 0) {
            structure[structure.length - 1].endLine = index - 1;
          }
          
          currentSection = section.charAt(0).toUpperCase() + section.slice(1);
          sectionStart = index;
          structure.push({ section: currentSection, startLine: index, endLine: lines.length - 1 });
          break;
        }
      }
    });

    // If no sections found, treat as one verse
    if (structure.length === 0) {
      structure.push({ section: 'Verse', startLine: 0, endLine: lines.length - 1 });
    }

    return structure;
  }

  private async analyzeLyricalThemes(lyrics: string, songMetadata?: SongDetailsData): Promise<LyricalTheme[]> {
    // Simple keyword-based theme analysis (could be enhanced with AI)
    const themes = {
      'Love': ['love', 'heart', 'romance', 'kiss', 'forever', 'together'],
      'Loss': ['goodbye', 'miss', 'gone', 'lost', 'alone', 'empty'],
      'Hope': ['tomorrow', 'dream', 'believe', 'future', 'light', 'hope'],
      'Struggle': ['fight', 'hard', 'difficult', 'struggle', 'pain', 'overcome'],
      'Joy': ['happy', 'celebrate', 'smile', 'laugh', 'dance', 'joy'],
      'Nostalgia': ['remember', 'past', 'yesterday', 'memories', 'back', 'time']
    };

    const lyricsLower = lyrics.toLowerCase();
    const themeScores: { [key: string]: number } = {};
    
    Object.entries(themes).forEach(([theme, keywords]) => {
      themeScores[theme] = keywords.reduce((score, keyword) => {
        const matches = (lyricsLower.match(new RegExp(keyword, 'g')) || []).length;
        return score + matches;
      }, 0);
    });

    const total = Object.values(themeScores).reduce((sum, score) => sum + score, 0);
    
    if (total === 0) {
      return [{ name: 'General', value: 100, color: '#4ECDC4' }];
    }

    const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#A8E6CF'];
    
    return Object.entries(themeScores)
      .filter(([_, score]) => score > 0)
      .map(([theme, score], index) => ({
        name: theme,
        value: Math.round((score / total) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }

  private async analyzeEmotions(lyrics: string): Promise<EmotionPoint[]> {
    // Simple sentiment analysis (could be enhanced with AI)
    const emotionKeywords = {
      'Joy': ['happy', 'smile', 'laugh', 'celebrate', 'joy', 'excited'],
      'Sadness': ['sad', 'cry', 'tears', 'sorrow', 'grief', 'depressed'],
      'Anger': ['angry', 'mad', 'rage', 'furious', 'hate', 'fight'],
      'Fear': ['afraid', 'scared', 'terror', 'anxiety', 'worry', 'nervous'],
      'Surprise': ['surprise', 'shock', 'sudden', 'unexpected', 'amazing'],
      'Disgust': ['disgusting', 'awful', 'terrible', 'horrible', 'sick']
    };

    const lyricsLower = lyrics.toLowerCase();
    
    return Object.entries(emotionKeywords).map(([emotion, keywords]) => {
      const score = keywords.reduce((total, keyword) => {
        const matches = (lyricsLower.match(new RegExp(keyword, 'g')) || []).length;
        return total + matches;
      }, 0);
      
      return {
        subject: emotion,
        value: Math.min(100, score * 20), // Scale to 0-100
        fullMark: 100
      };
    });
  }

  private analyzeMoodTimeline(
    lyrics: string, 
    structure: Array<{ section: string; startLine: number; endLine: number }>
  ): MoodPoint[] {
    return structure.map(section => {
      const lines = lyrics.split('\n').slice(section.startLine, section.endLine + 1);
      const sectionText = lines.join(' ').toLowerCase();
      
      // Simple energy calculation based on exclamation marks, capitalization, etc.
      const exclamations = (sectionText.match(/!/g) || []).length;
      const capitals = (sectionText.match(/[A-Z]/g) || []).length;
      const energyWords = (sectionText.match(/\b(yeah|oh|hey|wow|go|up|high|loud|fast)\b/g) || []).length;
      
      const energy = Math.min(100, (exclamations * 10) + (capitals * 2) + (energyWords * 5) + 40);
      
      return {
        section: section.section,
        energyLevel: energy
      };
    });
  }

  /**
   * Public utility methods for frontend
   */
  async detectSong(input: string): Promise<{ title?: string; artist?: string; confidence: number } | null> {
    const songInfo = this.extractSongInfo(input);
    
    if (!songInfo.title && !songInfo.artist) {
      return null;
    }

    if (!this.apiKey) {
      return {
        ...songInfo,
        confidence: 0.3
      };
    }

    try {
      const results = await this.searchTracks(songInfo.title || input, songInfo.artist);
      if (results.length > 0) {
        const track = results[0].track;
        return {
          title: track.track_name,
          artist: track.track_artist,
          confidence: 0.8
        };
      }
    } catch (error) {
      logger.warn('Song detection failed:', error);
    }

    return {
      ...songInfo,
      confidence: 0.4
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const musicAnalysisService = new MusicAnalysisService(); 