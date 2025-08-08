// Audio Service for RhymeTime Games
// Provides immersive sound effects for enhanced gameplay experience

interface SoundConfig {
  volume: number;
  pitch?: number;
  duration?: number;
  type: 'beep' | 'chime' | 'pop' | 'whoosh' | 'ding' | 'buzz' | 'sweep' | 'explosion';
}

interface AudioSettings {
  masterVolume: number;
  effectsVolume: number;
  musicVolume: number;
  isMuted: boolean;
  enableHaptics: boolean;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings = {
    masterVolume: 0.7,
    effectsVolume: 0.8,
    musicVolume: 0.5,
    isMuted: false,
    enableHaptics: true
  };
  
  private isInitialized = false;
  private soundCache = new Map<string, AudioBuffer>();

  constructor() {
    this.initializeAudio();
    this.loadSettings();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.isInitialized = false;
    }
  }

  private safeExecuteAudio(operation: () => void, fallbackMessage?: string) {
    try {
      if (!this.isInitialized || !this.audioContext || this.settings.isMuted) {
        return;
      }
      operation();
    } catch (error) {
      console.warn(`Audio operation failed: ${fallbackMessage || 'Unknown operation'}`, error);
      // Gracefully continue without audio
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('rhymetime_audio_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load audio settings, using defaults:', error);
    }
  }

  private saveSettings() {
    localStorage.setItem('rhymetime_audio_settings', JSON.stringify(this.settings));
  }

  // Resume audio context (required for user interaction)
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate procedural sound effects using Web Audio API
  private generateSound(config: SoundConfig): AudioBuffer | null {
    if (!this.audioContext || this.settings.isMuted) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = config.duration || 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const baseFreq = 440;
    const freq = baseFreq * (config.pitch || 1);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (config.type) {
        case 'beep':
          sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3);
          break;
        case 'chime':
          sample = (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 2 * t)) * Math.exp(-t * 2);
          break;
        case 'pop':
          sample = Math.sin(2 * Math.PI * (freq + 200 * Math.exp(-t * 10)) * t) * Math.exp(-t * 8);
          break;
        case 'whoosh':
          const noise = (Math.random() * 2 - 1);
          sample = noise * Math.exp(-t * 4) * Math.sin(2 * Math.PI * (200 + 300 * t) * t);
          break;
        case 'ding':
          sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1.5) + 
                   0.3 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 2);
          break;
        case 'buzz':
          sample = Math.sign(Math.sin(2 * Math.PI * freq * t)) * Math.exp(-t * 5);
          break;
        case 'sweep':
          const sweepFreq = freq + (800 * t);
          sample = Math.sin(2 * Math.PI * sweepFreq * t) * Math.exp(-t * 3);
          break;
        case 'explosion':
          const noiseExp = (Math.random() * 2 - 1);
          sample = noiseExp * Math.exp(-t * 2) * (1 - t / duration);
          break;
      }

      data[i] = sample * config.volume * 0.3; // Keep volumes reasonable
    }

    return buffer;
  }

  private async playBuffer(buffer: AudioBuffer | null, volume: number = 1) {
    if (!buffer || !this.audioContext || this.settings.isMuted) return;

    try {
      await this.resumeContext();
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const finalVolume = volume * this.settings.effectsVolume * this.settings.masterVolume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
      
      source.start();
    } catch (error) {
      console.warn('Error playing audio:', error);
    }
  }

  // Haptic feedback for mobile devices
  private triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!this.settings.enableHaptics || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [30],
      heavy: [50, 10, 20]
    };
    
    navigator.vibrate(patterns[type]);
  }

  // Game Event Sound Effects
  
  // Card interactions
  playCardHover() {
    const buffer = this.generateSound({
      type: 'beep',
      volume: 0.1,
      pitch: 1.2,
      duration: 0.1
    });
    this.playBuffer(buffer, 0.3);
  }

  playCardClick() {
    this.safeExecuteAudio(() => {
      const buffer = this.generateSound({
        type: 'pop',
        volume: 0.3,
        pitch: 1.5,
        duration: 0.15
      });
      this.playBuffer(buffer, 0.7);
      this.triggerHaptic('light');
    }, 'card click sound');
  }

  playCardMatch() {
    this.safeExecuteAudio(() => {
      const buffer = this.generateSound({
        type: 'chime',
        volume: 0.5,
        pitch: 1.8,
        duration: 0.4
      });
      this.playBuffer(buffer, 0.8);
    }, 'card match sound');
    this.triggerHaptic('medium');
  }

  playCardMismatch() {
    const buffer = this.generateSound({
      type: 'buzz',
      volume: 0.4,
      pitch: 0.6,
      duration: 0.3
    });
    this.playBuffer(buffer, 0.6);
    this.triggerHaptic('heavy');
  }

  // Group completion
  playGroupComplete() {
    const buffer = this.generateSound({
      type: 'ding',
      volume: 0.6,
      pitch: 2.0,
      duration: 0.6
    });
    this.playBuffer(buffer, 0.9);
    
    // Add a second harmonic sound
    setTimeout(() => {
      const harmony = this.generateSound({
        type: 'chime',
        volume: 0.4,
        pitch: 2.5,
        duration: 0.4
      });
      this.playBuffer(harmony, 0.7);
    }, 150);
    
    this.triggerHaptic('medium');
  }

  // Combo and streak effects
  playCombo(comboCount: number) {
    const pitch = 1.5 + (comboCount * 0.2); // Increasing pitch for higher combos
    const buffer = this.generateSound({
      type: 'sweep',
      volume: 0.5,
      pitch: pitch,
      duration: 0.5
    });
    this.playBuffer(buffer, 0.8);
    this.triggerHaptic('medium');
  }

  playPerfectStreak() {
    const buffer = this.generateSound({
      type: 'explosion',
      volume: 0.7,
      pitch: 1.0,
      duration: 0.8
    });
    this.playBuffer(buffer, 1.0);
    
    // Add sparkle effect
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const sparkle = this.generateSound({
            type: 'ding',
            volume: 0.3,
            pitch: 2 + i * 0.5,
            duration: 0.2
          });
          this.playBuffer(sparkle, 0.6);
        }, i * 100);
      }
    }, 200);
    
    this.triggerHaptic('heavy');
  }

  // Decoy Detective specific sounds
  playDecoyHit() {
    const buffer = this.generateSound({
      type: 'buzz',
      volume: 0.6,
      pitch: 0.4,
      duration: 0.4
    });
    this.playBuffer(buffer, 0.8);
    this.triggerHaptic('heavy');
  }

  playDecoyAvoid() {
    const buffer = this.generateSound({
      type: 'whoosh',
      volume: 0.3,
      pitch: 1.2,
      duration: 0.3
    });
    this.playBuffer(buffer, 0.5);
  }

  // Game state changes
  playLevelUp() {
    const buffer = this.generateSound({
      type: 'sweep',
      volume: 0.8,
      pitch: 1.0,
      duration: 1.0
    });
    this.playBuffer(buffer, 1.0);
    
    // Victory fanfare
    const notes = [1.5, 1.8, 2.2, 2.6];
    notes.forEach((pitch, index) => {
      setTimeout(() => {
        const note = this.generateSound({
          type: 'ding',
          volume: 0.5,
          pitch: pitch,
          duration: 0.3
        });
        this.playBuffer(note, 0.8);
      }, index * 150);
    });
    
    this.triggerHaptic('heavy');
  }

  playGameWin() {
    // Triumphant chord progression
    const chords = [
      { pitch: 1.0, delay: 0 },
      { pitch: 1.25, delay: 100 },
      { pitch: 1.5, delay: 200 },
      { pitch: 2.0, delay: 400 }
    ];
    
    chords.forEach(chord => {
      setTimeout(() => {
        const buffer = this.generateSound({
          type: 'chime',
          volume: 0.6,
          pitch: chord.pitch,
          duration: 0.8
        });
        this.playBuffer(buffer, 0.9);
      }, chord.delay);
    });
    
    this.triggerHaptic('heavy');
  }

  playGameLoss() {
    const buffer = this.generateSound({
      type: 'buzz',
      volume: 0.5,
      pitch: 0.5,
      duration: 1.0
    });
    this.playBuffer(buffer, 0.7);
    this.triggerHaptic('heavy');
  }

  // Timer warnings
  playTimeWarning() {
    const buffer = this.generateSound({
      type: 'beep',
      volume: 0.4,
      pitch: 1.8,
      duration: 0.2
    });
    this.playBuffer(buffer, 0.6);
  }

  playTimeCritical() {
    const buffer = this.generateSound({
      type: 'beep',
      volume: 0.6,
      pitch: 2.5,
      duration: 0.15
    });
    this.playBuffer(buffer, 0.8);
    this.triggerHaptic('medium');
  }

  // Settings management
  setMasterVolume(volume: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setEffectsVolume(volume: number) {
    this.settings.effectsVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  toggleMute() {
    this.settings.isMuted = !this.settings.isMuted;
    this.saveSettings();
    return this.settings.isMuted;
  }

  toggleHaptics() {
    this.settings.enableHaptics = !this.settings.enableHaptics;
    this.saveSettings();
    return this.settings.enableHaptics;
  }

  getSettings() {
    return { ...this.settings };
  }

  // Test sound for settings
  playTestSound() {
    this.playCardMatch();
  }

  playMatchFail() {
    this.playCardMismatch();
  }

  playMatchSuccess() {
    this.playCardMatch();
  }

  playGameWon() {
    this.playGameWin();
  }

  // Phonetic pronunciation for rhyme learning
  playWordPronunciation(word: string) {
    if (this.settings.isMuted || !word) return;
    
    try {
      // Use Web Speech API for pronunciation
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.8; // Slightly slower for learning
        utterance.volume = this.settings.effectsVolume * this.settings.masterVolume;
        utterance.pitch = 1.0;
        
        // Use a clear, neutral voice if available
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (voice.name.includes('Natural') || voice.name.includes('Google'))
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Speech synthesis not available:', error);
      // Fallback to a soft chime to indicate hover
      this.playCardHover();
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();
export default audioService; 