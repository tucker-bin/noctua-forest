import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { log } from '../utils/logger';
import FlowFinderService, { FlowFinderChallenge, WeeklyPack } from '../services/flowFinderService';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'learning' | 'discovery' | 'community' | 'professional' | 'streak';
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
}

// FlowFinderChallenge interface is now imported from the service

interface ExperienceState {
  xp: number;
  level: number;
  xpForNextLevel: number;
  tokens: number;
  dailyTokens: number;
  maxDailyTokens: number;
  streak: number;
  lastActivity: string | null;
  achievements: Achievement[];
  flowFinderChallenge: FlowFinderChallenge | null;
  weeklyPacks: WeeklyPack[];
  isPremium: boolean;
}

interface ExperienceContextType extends ExperienceState {
  addXp: (points: number, source?: string) => void;
  addTokens: (amount: number, source?: string) => void;
  useTokens: (amount: number) => boolean;
  giftTokens: (recipientId: string, amount: number) => Promise<boolean>;
  updateStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  completeFlowFinderChallenge: (success: boolean, accuracy: number) => void;
  loadWeeklyPacks: () => void;
  isLoading: boolean;
}

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

const XP_PER_LEVEL = 100;
const DAILY_TOKEN_LIMIT = 5;
const PREMIUM_DAILY_TOKENS = 20;

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_observation',
    name: 'First Light',
    description: 'Complete your first Observatory session',
    category: 'discovery',
    icon: '🔭',
    xpReward: 50,
    unlocked: false
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    icon: '🔥',
    xpReward: 100,
    unlocked: false
  },
  {
    id: 'pattern_pioneer',
    name: 'Pattern Pioneer',
    description: 'Discover 100 unique patterns',
    category: 'discovery',
    icon: '🌟',
    xpReward: 200,
    unlocked: false,
    progress: 0,
    maxProgress: 100
  },
  {
    id: 'forest_sage',
    name: 'Forest Sage',
    description: 'Complete all learning groves',
    category: 'learning',
    icon: '🌲',
    xpReward: 500,
    unlocked: false
  }
];

export const ExperienceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [tokens, setTokens] = useState(0);
  const [dailyTokens, setDailyTokens] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [flowFinderChallenge, setFlowFinderChallenge] = useState<FlowFinderChallenge | null>(null);
  const [weeklyPacks, setWeeklyPacks] = useState<WeeklyPack[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const flowFinderService = FlowFinderService.getInstance();

  const maxDailyTokens = isPremium ? PREMIUM_DAILY_TOKENS : DAILY_TOKEN_LIMIT;

  // Load saved data
  useEffect(() => {
    if (currentUser) {
      const savedData = localStorage.getItem(`noctua_experience_${currentUser.uid}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        setXp(data.xp || 0);
        setLevel(data.level || 1);
        setTokens(data.tokens || 10); // Welcome bonus
        setStreak(data.streak || 0);
        setLastActivity(data.lastActivity || null);
        setAchievements(data.achievements || DEFAULT_ACHIEVEMENTS);
        setIsPremium(data.isPremium || false);
      } else {
        // New user - give welcome bonus
        setTokens(10);
      }
      
      // Reset daily tokens if new day
      const today = new Date().toDateString();
      const lastTokenReset = localStorage.getItem(`noctua_token_reset_${currentUser.uid}`);
      if (lastTokenReset !== today) {
        setDailyTokens(0);
        localStorage.setItem(`noctua_token_reset_${currentUser.uid}`, today);
      }
    }
    
    setIsLoading(false);
  }, [currentUser]);

  // Save data
  const saveData = useCallback(() => {
    if (!currentUser) return;
    
    const data = {
      xp,
      level,
      tokens,
      streak,
      lastActivity,
      achievements,
      isPremium
    };
    
    localStorage.setItem(`noctua_experience_${currentUser.uid}`, JSON.stringify(data));
  }, [currentUser, xp, level, tokens, streak, lastActivity, achievements, isPremium]);

  useEffect(() => {
    saveData();
  }, [saveData]);



  const addXp = useCallback((points: number, source = 'general') => {
    if (!currentUser) return;

    setXp(prevXp => {
      const newXp = prevXp + points;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

      if (newLevel > level) {
        setLevel(newLevel);
        // Level up bonus tokens
        addTokens(2, 'level_up');
        log.userAction('User leveled up', { 
          previousLevel: level,
          newLevel,
          totalXp: newXp,
          source 
        });
      }
      
      return newXp;
    });
  }, [currentUser, level]);

  const addTokens = useCallback((amount: number, source = 'general') => {
    if (!currentUser) return;
    
    setTokens(prev => {
      const newTotal = prev + amount;
      log.userAction('Tokens added', { amount, source, newTotal });
      return newTotal;
    });
  }, [currentUser]);

  const useTokens = useCallback((amount: number): boolean => {
    if (!currentUser || tokens < amount) return false;
    
    setTokens(prev => prev - amount);
    log.userAction('Tokens used', { amount, remaining: tokens - amount });
    return true;
  }, [currentUser, tokens]);

  const giftTokens = useCallback(async (recipientId: string, amount: number): Promise<boolean> => {
    if (!currentUser || !isPremium || tokens < amount) return false;
    
    // In real implementation, this would call backend API
    setTokens(prev => prev - amount);
    log.userAction('Tokens gifted', { recipientId, amount });
    return true;
  }, [currentUser, isPremium, tokens]);

  const updateStreak = useCallback(() => {
    if (!currentUser) return;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (lastActivity === yesterday) {
      // Continue streak
      setStreak(prev => {
        const newStreak = prev + 1;
        // Streak rewards
        if (newStreak === 7) unlockAchievement('week_warrior');
        if (newStreak % 7 === 0) addTokens(3, 'weekly_streak');
        return newStreak;
      });
    } else if (lastActivity !== today) {
      // Start new streak
      setStreak(1);
    }
    
    setLastActivity(today);
  }, [currentUser, lastActivity]);

  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId && !achievement.unlocked) {
        addXp(achievement.xpReward, 'achievement');
        log.userAction('Achievement unlocked', { achievementId, xpReward: achievement.xpReward });
        return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      return achievement;
    }));
  }, [addXp]);

  // Listen for first observation event
  useEffect(() => {
    const handleFirstObservation = () => {
      unlockAchievement('first_observation');
    };

    window.addEventListener('firstObservation', handleFirstObservation);
    return () => window.removeEventListener('firstObservation', handleFirstObservation);
  }, [unlockAchievement]);

  const generateFlowFinderChallenge = useCallback(async () => {
    const today = new Date().toDateString();
    const savedChallenge = localStorage.getItem(`noctua_flow_finder_${today}`);
    
    if (!savedChallenge) {
      try {
        // Generate sophisticated daily challenge based on user's actual level and progression
        const userId = currentUser?.uid || 'anonymous';
        const challenge = await flowFinderService.generateDynamicChallenge(userId, level, isPremium, true); // true = isDaily
        
        console.log(`📅 Generated daily challenge for level ${level}:`, {
          gridSize: challenge.gridSize,
          eloRating: challenge.eloRating,
          adaptiveFeatures: challenge.adaptiveFeatures,
          groups: challenge.rhymeGroups?.length || 0,
          timeLimit: challenge.timeLimit
        });
        
        setFlowFinderChallenge(challenge);
        localStorage.setItem(`noctua_flow_finder_${today}`, JSON.stringify(challenge));
      } catch (error) {
        console.error('Error generating FlowFinder challenge:', error);
        // Fallback to a basic challenge or show error state
        setFlowFinderChallenge(null);
      }
    } else {
      setFlowFinderChallenge(JSON.parse(savedChallenge));
    }
  }, [flowFinderService, currentUser, level, isPremium]);

  // Generate FlowFinder challenge for both authenticated and anonymous users
  useEffect(() => {
    generateFlowFinderChallenge();
  }, [generateFlowFinderChallenge]);

  const completeFlowFinderChallenge = useCallback((success: boolean, accuracy: number) => {
    if (!flowFinderChallenge || flowFinderChallenge.completed) return;
    
    const updatedChallenge = { ...flowFinderChallenge, completed: true };
    setFlowFinderChallenge(updatedChallenge);
    
    if (success) {
      const bonusMultiplier = accuracy >= 0.9 ? 2 : accuracy >= 0.7 ? 1.5 : 1;
      addTokens(Math.floor(flowFinderChallenge.tokensReward * bonusMultiplier), 'flow_finder');
      addXp(Math.floor(flowFinderChallenge.xpReward * bonusMultiplier), 'flow_finder');
      updateStreak();
    }
    
    // Update the service
    flowFinderService.completeChallenge(flowFinderChallenge.id, success, accuracy);
    
    const today = new Date().toDateString();
    localStorage.setItem(`noctua_flow_finder_${today}`, JSON.stringify(updatedChallenge));
  }, [flowFinderChallenge, addTokens, addXp, updateStreak, flowFinderService]);

  const loadWeeklyPacks = useCallback(async () => {
    try {
      const packs = await flowFinderService.getAvailablePacks(isPremium);
      setWeeklyPacks(packs);
    } catch (error) {
      console.error('Error loading weekly packs:', error);
      setWeeklyPacks([]);
    }
  }, [flowFinderService, isPremium]);

  const xpForNextLevel = level * XP_PER_LEVEL;

  const value: ExperienceContextType = {
    xp,
    level,
    xpForNextLevel,
    tokens,
    dailyTokens,
    maxDailyTokens,
    streak,
    lastActivity,
    achievements,
    flowFinderChallenge,
    weeklyPacks,
    isPremium,
    addXp,
    addTokens,
    useTokens,
    giftTokens,
    updateStreak,
    unlockAchievement,
    completeFlowFinderChallenge,
    loadWeeklyPacks,
    isLoading
  };

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
};

export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (context === undefined) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
}; 