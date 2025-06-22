interface FlowFinderChallenge {
  id: string;
  type: 'rhyme_hunter' | 'alliteration_alert' | 'meter_master' | 'cultural_crossover' | 'freestyle';
  gridSize: '4x4' | '8x8';
  text: string;
  patterns: Array<{ word: string; type: string; position: number }>;
  completed: boolean;
  tokensReward: number;
  xpReward: number;
  difficulty: '4x4' | '8x8';
  createdAt: Date;
  packId?: string; // For weekly pack challenges
}

interface WeeklyPack {
  id: string;
  name: string;
  description: string;
  weekStart: Date;
  weekEnd: Date;
  challenges: FlowFinderChallenge[];
  unlocked: boolean;
  isPremium: boolean;
}

class FlowFinderService {
  private static instance: FlowFinderService;
  private challenges: FlowFinderChallenge[] = [];
  private weeklyPacks: WeeklyPack[] = [];

  public static getInstance(): FlowFinderService {
    if (!FlowFinderService.instance) {
      FlowFinderService.instance = new FlowFinderService();
    }
    return FlowFinderService.instance;
  }

  // Generate daily challenges
  public generateDailyChallenge(gridSize: '4x4' | '8x8' = '4x4'): FlowFinderChallenge {
    const today = new Date().toDateString();
    const challengeId = `daily_${gridSize}_${today}`;
    
    // Check if we already have a challenge for today
    const existing = this.challenges.find(c => c.id === challengeId);
    if (existing) return existing;

    // Generate new challenge using AI patterns
    const challenge = this.generateAIChallenge(challengeId, gridSize);
    this.challenges.push(challenge);
    
    return challenge;
  }

  // Generate AI-powered challenge content
  private generateAIChallenge(id: string, gridSize: '4x4' | '8x8'): FlowFinderChallenge {
    const rhymePatterns = [
      { ending: 'at', words: ['cat', 'sat', 'hat', 'mat', 'bat', 'rat', 'flat', 'chat'] },
      { ending: 'ight', words: ['bright', 'night', 'light', 'sight', 'fight', 'right', 'tight', 'might'] },
      { ending: 'own', words: ['brown', 'town', 'down', 'crown', 'frown', 'gown', 'shown', 'grown'] },
      { ending: 'ear', words: ['bear', 'near', 'clear', 'dear', 'fear', 'hear', 'year', 'tear'] },
      { ending: 'ake', words: ['make', 'take', 'lake', 'bake', 'wake', 'fake', 'brake', 'shake'] },
      { ending: 'ing', words: ['sing', 'ring', 'king', 'wing', 'bring', 'spring', 'thing', 'swing'] },
      { ending: 'ore', words: ['more', 'core', 'store', 'shore', 'bore', 'wore', 'score', 'before'] },
      { ending: 'ay', words: ['day', 'way', 'say', 'play', 'may', 'stay', 'gray', 'today'] }
    ];

    // Select random patterns based on grid size
    const gridCount = gridSize === '4x4' ? 16 : 64;
    const groupCount = gridSize === '4x4' ? 3 : 8;
    const selectedPatterns = this.shuffleArray([...rhymePatterns]).slice(0, groupCount);
    
    // Generate words for the challenge
    const challengeWords: string[] = [];
    const patterns: Array<{ word: string; type: string; position: number }> = [];
    
    selectedPatterns.forEach((pattern, groupIndex) => {
      const wordsNeeded = Math.floor(gridCount / groupCount) + (groupIndex < gridCount % groupCount ? 1 : 0);
      const selectedWords = this.shuffleArray([...pattern.words]).slice(0, wordsNeeded);
      
      selectedWords.forEach(word => {
        challengeWords.push(word);
        patterns.push({
          word,
          type: `rhyme-${pattern.ending}`,
          position: challengeWords.length - 1
        });
      });
    });

    // Shuffle the words
    const shuffledWords = this.shuffleArray([...challengeWords]);
    
    // Update positions after shuffle
    patterns.forEach(pattern => {
      pattern.position = shuffledWords.indexOf(pattern.word);
    });

    return {
      id,
      type: 'rhyme_hunter',
      gridSize,
      text: `Find the rhyming patterns in this ${gridSize} grid!`,
      patterns,
      completed: false,
      tokensReward: gridSize === '4x4' ? 3 : 5,
      xpReward: gridSize === '4x4' ? 25 : 50,
      difficulty: gridSize,
      createdAt: new Date()
    };
  }

  // Generate weekly pack
  public generateWeeklyPack(weekStart: Date): WeeklyPack {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const packId = `week_${weekStart.toISOString().split('T')[0]}`;
    
    // Generate 14 challenges for the week (7 x 4x4, 7 x 8x8)
    const challenges: FlowFinderChallenge[] = [];
    
    for (let day = 0; day < 7; day++) {
      const challengeDate = new Date(weekStart);
      challengeDate.setDate(challengeDate.getDate() + day);
      
      // 4x4 challenge
      const challenge4x4 = this.generateAIChallenge(
        `${packId}_4x4_day${day + 1}`,
        '4x4'
      );
      challenge4x4.packId = packId;
      challenges.push(challenge4x4);
      
      // 8x8 challenge
      const challenge8x8 = this.generateAIChallenge(
        `${packId}_8x8_day${day + 1}`,
        '8x8'
      );
      challenge8x8.packId = packId;
      challenges.push(challenge8x8);
    }

    const pack: WeeklyPack = {
      id: packId,
      name: `Week of ${weekStart.toLocaleDateString()}`,
      description: `14 Flow Finder challenges for the week starting ${weekStart.toLocaleDateString()}`,
      weekStart,
      weekEnd,
      challenges,
      unlocked: this.isPackUnlocked(weekStart),
      isPremium: this.isPackPremium(weekStart)
    };

    this.weeklyPacks.push(pack);
    return pack;
  }

  // Check if a pack should be unlocked (last month's packs for free users)
  private isPackUnlocked(weekStart: Date): boolean {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return weekStart >= oneMonthAgo;
  }

  // Check if a pack requires premium (older than 1 month)
  private isPackPremium(weekStart: Date): boolean {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return weekStart < oneMonthAgo;
  }

  // Get available packs for user
  public getAvailablePacks(isPremium: boolean): WeeklyPack[] {
    const now = new Date();
    const packs: WeeklyPack[] = [];
    
    // Generate packs for the last 3 months
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      
      const pack = this.generateWeeklyPack(weekStart);
      
      // Only include packs that user can access
      if (isPremium || pack.unlocked) {
        packs.push(pack);
      }
    }
    
    return packs.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  // Get today's daily challenges
  public getDailyChallenges(): { challenge4x4: FlowFinderChallenge; challenge8x8: FlowFinderChallenge } {
    return {
      challenge4x4: this.generateDailyChallenge('4x4'),
      challenge8x8: this.generateDailyChallenge('8x8')
    };
  }

  // Utility function to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Complete a challenge
  public completeChallenge(challengeId: string, success: boolean, accuracy: number): void {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = true;
    }
  }

  // Get challenge by ID
  public getChallengeById(id: string): FlowFinderChallenge | undefined {
    return this.challenges.find(c => c.id === id);
  }
}

export default FlowFinderService;
export type { FlowFinderChallenge, WeeklyPack }; 